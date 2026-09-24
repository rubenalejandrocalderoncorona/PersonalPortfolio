import json

import pytest

from agent_trace_lint.detectors.mismatch import _reasoning_tool_pairs, detect_mismatch


def make_chat_span(span_id, reasoning, tool_name, arguments, start_time):
    return {
        "name": "chat mock-llm",
        "context": {"span_id": span_id},
        "attributes": {
            "gen_ai.operation.name": "chat",
            "gen_ai.response.text": reasoning,
            "gen_ai.response.tool_calls": [tool_name],
            "gen_ai.response.tool_call_arguments": [json.dumps(arguments)],
        },
        "start_time": start_time,
    }


@pytest.fixture
def trace_with_matching_reasoning():
    return [
        make_chat_span(
            "s1",
            "I need to check the current weather in Paris before answering.",
            "get_weather",
            {"city": "Paris"},
            "2026-01-01T00:00:00.000Z",
        ),
    ]


@pytest.fixture
def trace_with_mismatched_reasoning():
    return [
        make_chat_span(
            "s1",
            "The weather looks good, I think I am done here and do not need to do anything else.",
            "search_database",
            {"query": "Paris travel advisories"},
            "2026-01-01T00:00:00.000Z",
        ),
    ]


def test_no_findings_when_reasoning_matches_action(trace_with_matching_reasoning):
    assert detect_mismatch(trace_with_matching_reasoning) == []


def test_flags_reasoning_that_diverges_from_action(trace_with_mismatched_reasoning):
    findings = detect_mismatch(trace_with_mismatched_reasoning)

    assert len(findings) == 1
    finding = findings[0]
    assert finding["tool_name"] == "search_database"
    assert finding["arguments"] == {"query": "Paris travel advisories"}
    assert finding["span_ids"] == ["s1"]
    assert finding["score"] < 0.3
    assert "heuristic" in finding["note"].lower()


def test_nameless_tool_call_is_not_flagged():
    """A tool_calls entry with no name (partial/buggy instrumentation) can't
    be blamed in a useful finding, so it should be skipped rather than
    surfaced as a "'None' looks unrelated to its stated reasoning" finding.
    """
    trace = [
        make_chat_span(
            "s1",
            "The weather looks good, I think I am done here and do not need to do anything else.",
            None,
            {"query": "Paris travel advisories"},
            "2026-01-01T00:00:00.000Z",
        ),
    ]
    assert detect_mismatch(trace) == []


def make_chat_attributes_span(tool_calls, tool_call_arguments):
    return {
        "context": {"span_id": "s1"},
        "attributes": {
            "gen_ai.operation.name": "chat",
            "gen_ai.response.text": "I will look things up.",
            "gen_ai.response.tool_calls": tool_calls,
            "gen_ai.response.tool_call_arguments": tool_call_arguments,
        },
    }


def test_tool_call_without_matching_arguments_is_not_dropped():
    span = make_chat_attributes_span(["get_weather", "search_database"], ['{"city": "Paris"}'])

    pairs = _reasoning_tool_pairs([span])

    assert [p["tool_name"] for p in pairs] == ["get_weather", "search_database"]
    assert pairs[0]["arguments"] == {"city": "Paris"}
    assert pairs[1]["arguments"] is None


def test_scalar_tool_call_attributes_are_not_split_into_characters():
    """Some exporters flatten single-element arrays to bare scalars; a string
    must be treated as one tool call, not iterated character by character."""
    span = make_chat_attributes_span("get_weather", '{"city": "Paris"}')

    pairs = _reasoning_tool_pairs([span])

    assert len(pairs) == 1
    assert pairs[0]["tool_name"] == "get_weather"
    assert pairs[0]["arguments"] == {"city": "Paris"}
