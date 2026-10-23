import json

import pytest

from agent_trace_lint.detectors.cycle import detect_cycle

ARGS = {
    "A": ("search", {"q": "paris"}),
    "B": ("read_page", {"id": 1}),
    "C": ("summarize", {"style": "short"}),
    "X": ("get_weather", {"city": "Paris"}),
}


def make_tool_span(index, tool_name, arguments):
    return {
        "context": {"span_id": f"s{index}"},
        "attributes": {
            "gen_ai.operation.name": "execute_tool",
            "gen_ai.tool.name": tool_name,
            "gen_ai.tool.call.arguments": json.dumps(arguments),
        },
        "start_time": f"2026-01-01T00:00:{index:02d}Z",
    }


def make_trace(pattern):
    """Build a trace from a string like "ABABAB" using the ARGS table."""
    return [make_tool_span(i, *ARGS[letter]) for i, letter in enumerate(pattern)]


def test_detects_alternating_pair_repeated_three_times():
    findings = detect_cycle(make_trace("ABABAB"))

    assert len(findings) == 1
    finding = findings[0]
    assert finding["tool_names"] == ["search", "read_page"]
    assert finding["arguments"] == [{"q": "paris"}, {"id": 1}]
    assert finding["repeat_count"] == 3
    assert finding["span_ids"] == [f"s{i}" for i in range(6)]


def test_two_repeats_not_flagged_by_default_but_flagged_when_lowered():
    trace = make_trace("ABAB")

    assert detect_cycle(trace) == []
    findings = detect_cycle(trace, min_repeats=2)
    assert len(findings) == 1
    assert findings[0]["repeat_count"] == 2


def test_single_call_repeated_is_left_to_the_repetition_detector():
    assert detect_cycle(make_trace("AAAAAA")) == []


def test_detects_three_call_cycle():
    findings = detect_cycle(make_trace("ABCABCABC"))

    assert len(findings) == 1
    assert findings[0]["tool_names"] == ["search", "read_page", "summarize"]
    assert findings[0]["repeat_count"] == 3


def test_cycle_after_unrelated_calls_reports_its_own_spans():
    findings = detect_cycle(make_trace("XABABAB"))

    assert len(findings) == 1
    assert findings[0]["span_ids"] == [f"s{i}" for i in range(1, 7)]


def test_longer_run_is_one_finding_not_several():
    findings = detect_cycle(make_trace("ABABABAB"))

    assert len(findings) == 1
    assert findings[0]["repeat_count"] == 4


def test_trailing_partial_cycle_is_excluded_from_the_run():
    findings = detect_cycle(make_trace("ABABABA"))

    assert len(findings) == 1
    assert findings[0]["repeat_count"] == 3
    assert findings[0]["span_ids"] == [f"s{i}" for i in range(6)]


def test_same_tools_with_different_arguments_are_not_a_cycle():
    trace = [
        make_tool_span(0, "search", {"q": "a"}),
        make_tool_span(1, "read_page", {"id": 1}),
        make_tool_span(2, "search", {"q": "b"}),
        make_tool_span(3, "read_page", {"id": 2}),
        make_tool_span(4, "search", {"q": "c"}),
        make_tool_span(5, "read_page", {"id": 3}),
    ]
    assert detect_cycle(trace) == []


def test_clean_trace_has_no_cycles():
    assert detect_cycle(make_trace("ABCX")) == []


@pytest.mark.parametrize("min_repeats", [1, 0, -2])
def test_min_repeats_below_two_is_rejected(min_repeats):
    with pytest.raises(ValueError, match="min_repeats"):
        detect_cycle(make_trace("ABABAB"), min_repeats=min_repeats)


def test_max_period_below_two_is_rejected():
    with pytest.raises(ValueError, match="max_period"):
        detect_cycle(make_trace("ABABAB"), max_period=1)


def make_traced_trace(pattern, trace_id, start=0):
    spans = []
    for i, letter in enumerate(pattern):
        span = make_tool_span(start + i, *ARGS[letter])
        span["context"]["trace_id"] = trace_id
        spans.append(span)
    return spans


def test_alternating_calls_split_across_two_traces_are_not_a_cycle():
    """Interleaved in time this reads A B A B A B, but A is one trace
    repeating a single call and B is another -- neither is a cycle."""
    spans = []
    for i in range(6):
        trace_id, letter = ("trace-A", "A") if i % 2 == 0 else ("trace-B", "B")
        span = make_tool_span(i, *ARGS[letter])
        span["context"]["trace_id"] = trace_id
        spans.append(span)

    assert detect_cycle(spans) == []


def test_cycle_within_one_trace_is_found_amid_another_traces_calls():
    ping_pong = make_traced_trace("ABABAB", "trace-A", start=0)
    noise = make_traced_trace("X", "trace-B", start=20)
    noise[0]["start_time"] = "2026-01-01T00:00:02Z"  # lands in the middle of the cycle

    findings = detect_cycle(ping_pong + noise)

    assert len(findings) == 1
    assert findings[0]["repeat_count"] == 3
    assert findings[0]["span_ids"] == [f"s{i}" for i in range(6)]


def test_finding_reports_the_trace_it_came_from():
    findings = detect_cycle(make_traced_trace("ABABAB", "trace-A"))
    assert findings[0]["trace_id"] == "trace-A"


def test_finding_trace_id_is_none_when_the_spans_have_none():
    assert detect_cycle(make_trace("ABABAB"))[0]["trace_id"] is None


def test_cycle_order_survives_mixed_fractional_and_whole_second_timestamps():
    """A lands on each whole second and B half a second later. As strings
    "00.5Z" < "00Z", so the old sort saw B A B A B A and reported the cycle
    starting with the wrong call."""
    spans = [make_tool_span(i, *ARGS[letter]) for i, letter in enumerate("ABABAB")]
    for i, span in enumerate(spans):
        span["start_time"] = f"2026-01-01T00:00:0{i // 2}.5Z" if i % 2 else f"2026-01-01T00:00:0{i // 2}Z"

    findings = detect_cycle(spans)

    assert len(findings) == 1
    assert findings[0]["tool_names"] == ["search", "read_page"]
    assert findings[0]["span_ids"] == [f"s{i}" for i in range(6)]
