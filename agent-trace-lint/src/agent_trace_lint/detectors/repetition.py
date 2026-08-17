"""Step-repetition / loop detection over an OpenTelemetry GenAI trace.

Flags tool calls that repeat -- same tool name, same arguments -- back to
back, which is a common signature of a stuck agent loop.
"""
import json


def _extract_spans(trace):
    if isinstance(trace, list):
        return trace
    if isinstance(trace, dict):
        return trace.get("spans", [])
    raise TypeError(f"Unsupported trace type: {type(trace)!r}")


def _parse_arguments(raw):
    if isinstance(raw, str):
        try:
            return json.loads(raw)
        except ValueError:
            return raw
    return raw


def _tool_calls_in_order(spans):
    """Extract execute_tool spans, sorted chronologically by start_time."""
    calls = []
    for span in spans:
        attributes = span.get("attributes") or {}
        if attributes.get("gen_ai.operation.name") != "execute_tool":
            continue
        calls.append({
            "span_id": (span.get("context") or {}).get("span_id"),
            "tool_name": attributes.get("gen_ai.tool.name"),
            "arguments": _parse_arguments(attributes.get("gen_ai.tool.call.arguments")),
            "start_time": span.get("start_time") or "",
        })
    calls.sort(key=lambda c: c["start_time"])
    return calls


def detect_repetition(trace, n: int = 2) -> list:
    """Find runs of consecutive, identical tool calls in `trace`.

    A "call" matches the previous one when both its tool name and its
    (exactly, not fuzzily) parsed arguments are equal. `n` is the minimum
    run length that counts as a repetition -- the default of 2 flags any
    back-to-back duplicate call, since that's already a wasted round trip.

    Returns a list of findings, each: {tool_name, repeat_count, arguments,
    span_ids}, ordered by where the run starts in the trace.
    """
    calls = _tool_calls_in_order(_extract_spans(trace))

    findings = []
    i = 0
    while i < len(calls):
        j = i + 1
        while (
            j < len(calls)
            and calls[j]["tool_name"] == calls[i]["tool_name"]
            and calls[j]["arguments"] == calls[i]["arguments"]
        ):
            j += 1
        run_length = j - i
        if run_length >= n:
            findings.append({
                "tool_name": calls[i]["tool_name"],
                "repeat_count": run_length,
                "arguments": calls[i]["arguments"],
                "span_ids": [c["span_id"] for c in calls[i:j]],
            })
        i = j
    return findings
