#!/usr/bin/env python3
"""Generate a sample OpenTelemetry GenAI trace for a tool-calling agent loop.

Standalone script, not part of the agent_trace_lint package -- it exists to
produce a realistic sample_trace.json to develop the linter against.

Runs fully offline by default, using scripted fake LLM responses instead of
a real model. The mock is deliberately scripted so the agent calls
get_weather twice in a row before moving on -- a "stuck/repeated tool call"
pattern the linter will eventually need to flag.

To route through the real OpenAI API instead, set OPENAI_API_KEY and:
    AGENT_TRACE_LINT_USE_OPENAI=1 python scripts/generate_sample_trace.py
Note the repeated-call pattern is only guaranteed on the mock path -- a real
model won't reliably reproduce it.
"""
import json
import os
import uuid
from pathlib import Path

from opentelemetry import trace
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor, SpanExporter, SpanExportResult
from opentelemetry.trace import SpanKind, Status, StatusCode

SCRIPT_DIR = Path(__file__).resolve().parent
OUTPUT_PATH = SCRIPT_DIR.parent / "traces" / "sample_trace.json"

USE_OPENAI = bool(os.environ.get("OPENAI_API_KEY")) and os.environ.get("AGENT_TRACE_LINT_USE_OPENAI") == "1"
MODEL_NAME = "gpt-4o-mini" if USE_OPENAI else "mock-llm"


# --------------------------------------------------------------------------
# Fake tools
# --------------------------------------------------------------------------

def get_weather(city):
    return {"city": city, "temp_c": 18, "condition": "cloudy"}


def search_database(query):
    return {"query": query, "results": ["No active travel advisories for Paris."]}


def send_email(to, subject, body):
    return {"status": "sent", "to": to, "message_id": f"mock-{uuid.uuid4().hex[:8]}"}


TOOLS = {
    "get_weather": get_weather,
    "search_database": search_database,
    "send_email": send_email,
}

TOOLS_SCHEMA = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get current weather for a city",
            "parameters": {
                "type": "object",
                "properties": {"city": {"type": "string"}},
                "required": ["city"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_database",
            "description": "Search an internal database",
            "parameters": {
                "type": "object",
                "properties": {"query": {"type": "string"}},
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "send_email",
            "description": "Send an email",
            "parameters": {
                "type": "object",
                "properties": {
                    "to": {"type": "string"},
                    "subject": {"type": "string"},
                    "body": {"type": "string"},
                },
                "required": ["to", "subject", "body"],
            },
        },
    },
]


# --------------------------------------------------------------------------
# Mocked LLM -- scripted step-by-step so the trace is deterministic and
# contains the repeated-tool-call pattern on purpose.
# --------------------------------------------------------------------------

MOCK_SCRIPT = [
    {"tool": "get_weather", "args": {"city": "Paris"}},
    {"tool": "get_weather", "args": {"city": "Paris"}},  # deliberate repeat
    {"tool": "search_database", "args": {"query": "Paris travel advisories"}},
    {"tool": "send_email", "args": {
        "to": "user@example.com",
        "subject": "Your Paris Trip Update",
        "body": "Weather is cloudy, 18C. No travel advisories found.",
    }},
    {"tool": None, "content": (
        "I checked the weather in Paris (cloudy, 18C), found no travel "
        "advisories, and sent you an email summary."
    )},
]


def mock_llm_call(step, messages):
    action = MOCK_SCRIPT[step]
    input_tokens = 40 + 12 * len(messages)
    if action["tool"] is None:
        return {
            "finish_reason": "stop",
            "content": action["content"],
            "tool_calls": [],
            "usage": {"input_tokens": input_tokens, "output_tokens": 24},
        }
    return {
        "finish_reason": "tool_calls",
        "content": None,
        "tool_calls": [{
            "id": f"call_{uuid.uuid4().hex[:8]}",
            "name": action["tool"],
            "arguments": action["args"],
        }],
        "usage": {"input_tokens": input_tokens, "output_tokens": 18},
    }


def real_llm_call(client, messages):
    response = client.chat.completions.create(model=MODEL_NAME, messages=messages, tools=TOOLS_SCHEMA)
    choice = response.choices[0]
    msg = choice.message
    tool_calls = []
    if msg.tool_calls:
        for tc in msg.tool_calls:
            tool_calls.append({
                "id": tc.id,
                "name": tc.function.name,
                "arguments": json.loads(tc.function.arguments),
            })
    return {
        "finish_reason": choice.finish_reason,
        "content": msg.content,
        "tool_calls": tool_calls,
        "usage": {
            "input_tokens": response.usage.prompt_tokens,
            "output_tokens": response.usage.completion_tokens,
        },
    }


# --------------------------------------------------------------------------
# OpenTelemetry setup -- export spans to a local JSON file, no collector
# --------------------------------------------------------------------------

class JSONFileSpanExporter(SpanExporter):
    """Collects spans in memory and dumps them as a single JSON array on write()."""

    def __init__(self):
        self.spans = []

    def export(self, spans):
        for span in spans:
            self.spans.append(json.loads(span.to_json()))
        return SpanExportResult.SUCCESS

    def shutdown(self):
        return None

    def force_flush(self, timeout_millis=30000):
        return True

    def write(self, path):
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w") as f:
            json.dump(self.spans, f, indent=2)


resource = Resource.create({"service.name": "agent-trace-lint-sample"})
provider = TracerProvider(resource=resource)
exporter = JSONFileSpanExporter()
provider.add_span_processor(SimpleSpanProcessor(exporter))
trace.set_tracer_provider(provider)
tracer = trace.get_tracer("agent_trace_lint.sample")


def run_llm_span(step, messages, client):
    with tracer.start_as_current_span(f"chat {MODEL_NAME}", kind=SpanKind.CLIENT) as span:
        span.set_attribute("gen_ai.operation.name", "chat")
        span.set_attribute("gen_ai.system", "openai" if USE_OPENAI else "mock")
        span.set_attribute("gen_ai.request.model", MODEL_NAME)

        result = real_llm_call(client, messages) if USE_OPENAI else mock_llm_call(step, messages)

        span.set_attribute("gen_ai.response.model", MODEL_NAME)
        span.set_attribute("gen_ai.response.finish_reasons", [result["finish_reason"]])
        span.set_attribute("gen_ai.usage.input_tokens", result["usage"]["input_tokens"])
        span.set_attribute("gen_ai.usage.output_tokens", result["usage"]["output_tokens"])
        if result["tool_calls"]:
            span.set_attribute("gen_ai.response.tool_calls", [tc["name"] for tc in result["tool_calls"]])
        span.set_status(Status(StatusCode.OK))
        return result


def run_tool_span(tool_name, call_id, arguments):
    with tracer.start_as_current_span(f"execute_tool {tool_name}") as span:
        span.set_attribute("gen_ai.operation.name", "execute_tool")
        span.set_attribute("gen_ai.tool.name", tool_name)
        span.set_attribute("gen_ai.tool.call.id", call_id)
        span.set_attribute("gen_ai.tool.call.arguments", json.dumps(arguments))
        try:
            result = TOOLS[tool_name](**arguments)
            span.set_attribute("gen_ai.tool.call.result", json.dumps(result))
            span.set_status(Status(StatusCode.OK))
            return result
        except Exception as exc:
            span.record_exception(exc)
            span.set_status(Status(StatusCode.ERROR, str(exc)))
            raise


def main():
    client = None
    if USE_OPENAI:
        from openai import OpenAI
        client = OpenAI()

    messages = [
        {"role": "system", "content": "You are a travel assistant. Use tools as needed."},
        {"role": "user", "content": "What's the weather in Paris, any travel advisories, and email me a summary."},
    ]

    final_answer = None
    max_steps = 10

    with tracer.start_as_current_span("invoke_agent travel_assistant", kind=SpanKind.INTERNAL) as root:
        root.set_attribute("gen_ai.operation.name", "invoke_agent")
        root.set_attribute("gen_ai.agent.name", "travel_assistant")
        root.set_attribute("gen_ai.system", "openai" if USE_OPENAI else "mock")

        for step in range(max_steps):
            result = run_llm_span(step, messages, client)

            if not result["tool_calls"]:
                final_answer = result["content"]
                messages.append({"role": "assistant", "content": final_answer})
                break

            for tc in result["tool_calls"]:
                messages.append({
                    "role": "assistant",
                    "content": None,
                    "tool_calls": [{
                        "id": tc["id"],
                        "type": "function",
                        "function": {"name": tc["name"], "arguments": json.dumps(tc["arguments"])},
                    }],
                })
                tool_result = run_tool_span(tc["name"], tc["id"], tc["arguments"])
                messages.append({
                    "role": "tool",
                    "tool_call_id": tc["id"],
                    "content": json.dumps(tool_result),
                })

        root.set_attribute("gen_ai.agent.final_response", final_answer or "")

    provider.shutdown()
    exporter.write(OUTPUT_PATH)
    print(f"Wrote {len(exporter.spans)} spans to {OUTPUT_PATH}")
    print(f"Final answer: {final_answer}")


if __name__ == "__main__":
    main()
