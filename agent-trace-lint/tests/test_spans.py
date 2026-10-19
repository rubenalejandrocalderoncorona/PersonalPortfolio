import pytest

from agent_trace_lint.spans import TraceFormatError, extract_spans


def test_list_of_spans_is_returned_as_is():
    spans = [{"name": "a"}, {"name": "b"}]
    assert extract_spans(spans) == spans


def test_object_with_spans_array_is_unwrapped():
    spans = [{"name": "a"}]
    assert extract_spans({"spans": spans}) == spans


@pytest.mark.parametrize("trace", [[], {"spans": []}])
def test_empty_traces_are_valid_and_have_no_spans(trace):
    assert extract_spans(trace) == []


@pytest.mark.parametrize("trace", [{}, {"completely": "unrelated"}, {"resource": {}, "data": []}])
def test_object_without_spans_is_rejected_not_treated_as_empty(trace):
    with pytest.raises(TraceFormatError, match="unrecognized trace format"):
        extract_spans(trace)


def test_error_names_the_keys_that_were_found():
    with pytest.raises(TraceFormatError, match="found keys: alpha, beta"):
        extract_spans({"beta": 1, "alpha": 2})


@pytest.mark.parametrize("trace", [42, "text", None, 3.5, True])
def test_non_container_traces_are_rejected(trace):
    with pytest.raises(TraceFormatError, match="unrecognized trace format"):
        extract_spans(trace)


def test_spans_value_must_be_a_list():
    with pytest.raises(TraceFormatError, match="'spans' must be a list"):
        extract_spans({"spans": "not-a-list"})


def test_every_span_must_be_an_object():
    with pytest.raises(TraceFormatError, match="span 1 in the trace must be an object"):
        extract_spans([{"name": "ok"}, "oops"])
