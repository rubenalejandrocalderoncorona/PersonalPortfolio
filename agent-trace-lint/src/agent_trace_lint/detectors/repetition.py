"""Step-repetition / loop detection over an OpenTelemetry GenAI trace.

Flags tool calls that repeat -- same tool name, same arguments -- back to
back, which is a common signature of a stuck agent loop.
"""
import json

from agent_trace_lint.spans import extract_spans


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
        tool_name = attributes.get("gen_ai.tool.name")
        if not tool_name:
            # Malformed/partial instrumentation -- without a name there's no
            # basis to call two such calls "the same call", so skip rather
            # than risk grouping unrelated calls into a false repeat.
            continue
        context = span.get("context") or {}
        calls.append({
            "span_id": context.get("span_id"),
            "trace_id": context.get("trace_id"),
            "tool_name": tool_name,
            "arguments": _parse_arguments(attributes.get("gen_ai.tool.call.arguments")),
            "start_time": span.get("start_time") or "",
        })
    calls.sort(key=lambda c: c["start_time"])
    return calls


def _by_trace(calls):
    """Split chronologically-ordered calls into one list per trace_id.

    A file can hold many independent traces (an OTLP export from a Collector
    usually does). Runs must be looked for within a single trace: across
    traces, two unrelated requests that each made one call look like a
    repeat, and another trace's call landing in between hides a real one.
    Calls without a trace_id all share one group.
    """
    groups = {}
    for call in calls:
        groups.setdefault(call["trace_id"], []).append(call)
    return list(groups.values())


def _find_runs(calls, n):
    """Return (start_time, finding) for each run of >= n identical calls."""
    found = []
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
            found.append((calls[i]["start_time"], {
                "tool_name": calls[i]["tool_name"],
                "repeat_count": run_length,
                "arguments": calls[i]["arguments"],
                "span_ids": [c["span_id"] for c in calls[i:j]],
            }))
        i = j
    return found


def detect_repetition(trace, n: int = 2) -> list:
    """Find runs of consecutive, identical tool calls in `trace`.

    A "call" matches the previous one when both its tool name and its
    (exactly, not fuzzily) parsed arguments are equal. `n` is the minimum
    run length that counts as a repetition -- the default of 2 flags any
    back-to-back duplicate call, since that's already a wasted round trip.

    Returns a list of findings, each: {tool_name, repeat_count, arguments,
    span_ids}, ordered by where the run starts. Runs are found within each
    trace_id separately, so calls from different traces never count as
    repeats of each other.

    Raises ValueError if `n` is below 2: a run of one call isn't a repetition,
    and would flag every call in the trace.
    """
    if n < 2:
        raise ValueError(f"n must be at least 2, got {n}")

    calls = _tool_calls_in_order(extract_spans(trace))

    found = []
    for group in _by_trace(calls):
        found.extend(_find_runs(group, n))
    found.sort(key=lambda pair: pair[0])
    return [finding for _, finding in found]
