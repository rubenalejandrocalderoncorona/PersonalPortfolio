import json

import pytest

from agent_trace_lint.detectors.repetition import detect_repetition


def make_chat_span(span_id, start_time):
    return {
        "name": "chat mock-llm",
        "context": {"span_id": span_id},
        "attributes": {"gen_ai.operation.name": "chat"},
        "start_time": start_time,
    }


def make_tool_span(span_id, tool_name, arguments, start_time):
    return {
        "name": f"execute_tool {tool_name}",
        "context": {"span_id": span_id},
        "attributes": {
            "gen_ai.operation.name": "execute_tool",
            "gen_ai.tool.name": tool_name,
            "gen_ai.tool.call.id": f"call_{span_id}",
            "gen_ai.tool.call.arguments": json.dumps(arguments),
        },
        "start_time": start_time,
    }


@pytest.fixture
def trace_with_repeat():
    return [
        make_chat_span("s1", "2026-01-01T00:00:00.000Z"),
        make_tool_span("s2", "get_weather", {"city": "Paris"}, "2026-01-01T00:00:01.000Z"),
        make_chat_span("s3", "2026-01-01T00:00:02.000Z"),
        make_tool_span("s4", "get_weather", {"city": "Paris"}, "2026-01-01T00:00:03.000Z"),
        make_chat_span("s5", "2026-01-01T00:00:04.000Z"),
        make_tool_span("s6", "search_database", {"query": "travel advisories"}, "2026-01-01T00:00:05.000Z"),
    ]


@pytest.fixture
def trace_without_repeat():
    return [
        make_chat_span("s1", "2026-01-01T00:00:00.000Z"),
        make_tool_span("s2", "get_weather", {"city": "Paris"}, "2026-01-01T00:00:01.000Z"),
        make_chat_span("s3", "2026-01-01T00:00:02.000Z"),
        make_tool_span("s4", "search_database", {"query": "travel advisories"}, "2026-01-01T00:00:03.000Z"),
        make_chat_span("s5", "2026-01-01T00:00:04.000Z"),
        make_tool_span("s6", "send_email", {"to": "user@example.com"}, "2026-01-01T00:00:05.000Z"),
    ]


def test_detects_repeated_tool_call(trace_with_repeat):
    findings = detect_repetition(trace_with_repeat)

    assert len(findings) == 1
    finding = findings[0]
    assert finding["tool_name"] == "get_weather"
    assert finding["repeat_count"] == 2
    assert finding["arguments"] == {"city": "Paris"}
    assert finding["span_ids"] == ["s2", "s4"]


def test_no_findings_without_repeat(trace_without_repeat):
    assert detect_repetition(trace_without_repeat) == []
