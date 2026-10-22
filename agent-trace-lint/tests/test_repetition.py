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


def make_nameless_tool_span(span_id, arguments, start_time):
    """A malformed execute_tool span missing gen_ai.tool.name entirely."""
    return {
        "name": "execute_tool",
        "context": {"span_id": span_id},
        "attributes": {
            "gen_ai.operation.name": "execute_tool",
            "gen_ai.tool.call.arguments": json.dumps(arguments),
        },
        "start_time": start_time,
    }


def test_unrelated_nameless_calls_are_not_flagged_as_repeat():
    """Two different calls that both happen to be missing gen_ai.tool.name
    (partial/buggy instrumentation) must not be grouped into a false
    "'None' called N times in a row" finding.
    """
    trace = [
        make_nameless_tool_span("s1", {}, "2026-01-01T00:00:00.000Z"),
        make_nameless_tool_span("s2", {}, "2026-01-01T00:00:01.000Z"),
    ]
    assert detect_repetition(trace) == []


@pytest.mark.parametrize("n", [1, 0, -3])
def test_run_length_below_two_is_rejected(trace_with_repeat, n):
    with pytest.raises(ValueError, match="at least 2"):
        detect_repetition(trace_with_repeat, n=n)


def make_traced_tool_span(span_id, trace_id, tool_name, arguments, start_time):
    span = make_tool_span(span_id, tool_name, arguments, start_time)
    span["context"]["trace_id"] = trace_id
    return span


def test_one_call_each_in_two_different_traces_is_not_a_repeat():
    trace = [
        make_traced_tool_span("a1", "trace-A", "get_weather", {"city": "Paris"}, "2026-01-01T00:00:01Z"),
        make_traced_tool_span("b1", "trace-B", "get_weather", {"city": "Paris"}, "2026-01-01T00:00:02Z"),
    ]
    assert detect_repetition(trace) == []


def test_repeat_within_a_trace_is_found_despite_another_traces_call_in_between():
    trace = [
        make_traced_tool_span("a1", "trace-A", "get_weather", {"city": "Paris"}, "2026-01-01T00:00:01Z"),
        make_traced_tool_span("b1", "trace-B", "search", {"q": "x"}, "2026-01-01T00:00:02Z"),
        make_traced_tool_span("a2", "trace-A", "get_weather", {"city": "Paris"}, "2026-01-01T00:00:03Z"),
    ]
    findings = detect_repetition(trace)

    assert len(findings) == 1
    assert findings[0]["span_ids"] == ["a1", "a2"]


def test_findings_from_different_traces_are_ordered_by_start_time():
    trace = [
        make_traced_tool_span("a1", "trace-A", "get_weather", {"city": "Paris"}, "2026-01-01T00:00:05Z"),
        make_traced_tool_span("a2", "trace-A", "get_weather", {"city": "Paris"}, "2026-01-01T00:00:06Z"),
        make_traced_tool_span("b1", "trace-B", "search", {"q": "x"}, "2026-01-01T00:00:01Z"),
        make_traced_tool_span("b2", "trace-B", "search", {"q": "x"}, "2026-01-01T00:00:02Z"),
    ]
    findings = detect_repetition(trace)

    assert [f["tool_name"] for f in findings] == ["search", "get_weather"]


def test_calls_without_a_trace_id_are_still_treated_as_one_trace(trace_with_repeat):
    assert len(detect_repetition(trace_with_repeat)) == 1


def test_finding_reports_the_trace_it_came_from():
    trace = [
        make_traced_tool_span("a1", "trace-A", "get_weather", {"city": "Paris"}, "2026-01-01T00:00:01Z"),
        make_traced_tool_span("a2", "trace-A", "get_weather", {"city": "Paris"}, "2026-01-01T00:00:02Z"),
    ]
    assert detect_repetition(trace)[0]["trace_id"] == "trace-A"


def test_finding_trace_id_is_none_when_the_spans_have_none(trace_with_repeat):
    assert detect_repetition(trace_with_repeat)[0]["trace_id"] is None
