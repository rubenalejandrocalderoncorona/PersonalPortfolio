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


def otlp_attr(key, **typed_value):
    return {"key": key, "value": typed_value}


def otlp_export(*spans, scope_key="scopeSpans"):
    return {"resourceSpans": [{"resource": {}, scope_key: [{"scope": {}, "spans": list(spans)}]}]}


def test_otlp_spans_are_normalized_to_the_flat_shape():
    export = otlp_export({
        "traceId": "trace-1",
        "spanId": "abc123",
        "name": "execute_tool get_weather",
        "startTimeUnixNano": "1700000000000000000",
        "attributes": [otlp_attr("gen_ai.tool.name", stringValue="get_weather")],
    })

    (span,) = extract_spans(export)

    assert span["context"] == {"span_id": "abc123", "trace_id": "trace-1"}
    assert span["name"] == "execute_tool get_weather"
    assert span["attributes"] == {"gen_ai.tool.name": "get_weather"}


def test_otlp_typed_attribute_values_are_decoded():
    export = otlp_export({
        "spanId": "s1",
        "attributes": [
            otlp_attr("count", intValue="42"),  # int64 arrives as a JSON string
            otlp_attr("ratio", doubleValue=0.5),
            otlp_attr("ok", boolValue=True),
            otlp_attr("tools", arrayValue={"values": [{"stringValue": "a"}, {"stringValue": "b"}]}),
            otlp_attr("nested", kvlistValue={"values": [{"key": "k", "value": {"intValue": "1"}}]}),
            otlp_attr("empty", arrayValue={}),
        ],
    })

    (span,) = extract_spans(export)

    assert span["attributes"] == {
        "count": 42,
        "ratio": 0.5,
        "ok": True,
        "tools": ["a", "b"],
        "nested": {"k": 1},
        "empty": [],
    }


def test_otlp_nanosecond_timestamps_sort_chronologically_even_with_different_widths():
    export = otlp_export(
        {"spanId": "late", "startTimeUnixNano": "1000000000000000000"},
        {"spanId": "early", "startTimeUnixNano": "999999999999999999"},
    )

    late, early = extract_spans(export)

    assert early["start_time"] < late["start_time"]


def test_spans_without_a_start_time_get_an_empty_one():
    (span,) = extract_spans(otlp_export({"spanId": "s1"}))
    assert span["start_time"] == ""


def test_spans_are_gathered_across_resources_and_scopes():
    trace = {"resourceSpans": [
        {"scopeSpans": [{"spans": [{"spanId": "a"}]}, {"spans": [{"spanId": "b"}]}]},
        {"scopeSpans": [{"spans": [{"spanId": "c"}]}]},
    ]}

    assert [s["context"]["span_id"] for s in extract_spans(trace)] == ["a", "b", "c"]


def test_legacy_instrumentation_library_spans_key_is_accepted():
    export = otlp_export({"spanId": "old"}, scope_key="instrumentationLibrarySpans")
    assert [s["context"]["span_id"] for s in extract_spans(export)] == ["old"]


def test_list_of_otlp_exports_is_flattened_like_a_jsonl_file():
    exports = [otlp_export({"spanId": "a"}), otlp_export({"spanId": "b"})]
    assert [s["context"]["span_id"] for s in extract_spans(exports)] == ["a", "b"]


def test_otlp_resource_spans_must_be_a_list():
    with pytest.raises(TraceFormatError, match="'resourceSpans' must be a list"):
        extract_spans({"resourceSpans": "nope"})
