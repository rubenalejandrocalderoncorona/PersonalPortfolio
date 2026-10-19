"""Turning a loaded trace file into a flat list of span dicts.

Every detector reads spans through extract_spans(), so a trace shape the
tool doesn't understand fails loudly here instead of quietly producing zero
spans -- which would look exactly like a clean trace.

Two shapes are understood: the flat span dicts the OpenTelemetry Python SDK's
span.to_json() produces (a list, or an object with a "spans" list), and
OTLP/JSON as written by the OpenTelemetry Collector (resourceSpans). OTLP
spans are normalized into the flat shape so detectors only see one format.
"""


class TraceFormatError(ValueError):
    """The trace is valid JSON but not in a shape agent-trace-lint can read."""


def _check_spans(spans, where):
    if not isinstance(spans, list):
        raise TraceFormatError(f"{where} must be a list of spans, got {type(spans).__name__}")
    for index, span in enumerate(spans):
        if not isinstance(span, dict):
            raise TraceFormatError(
                f"span {index} in {where} must be an object, got {type(span).__name__}"
            )
    return spans


def _decode_otlp_value(value):
    """Decode OTLP's typed AnyValue ({"stringValue": ...}, {"intValue": ...}, ...)."""
    if not isinstance(value, dict):
        return value
    if "stringValue" in value:
        return value["stringValue"]
    if "intValue" in value:
        return int(value["intValue"])  # 64-bit ints are JSON strings in OTLP
    if "doubleValue" in value:
        return float(value["doubleValue"])
    if "boolValue" in value:
        return bool(value["boolValue"])
    if "arrayValue" in value:
        return [_decode_otlp_value(v) for v in (value["arrayValue"] or {}).get("values") or []]
    if "kvlistValue" in value:
        return {kv["key"]: _decode_otlp_value(kv.get("value")) for kv in (value["kvlistValue"] or {}).get("values") or []}
    return None


def _normalize_otlp_span(span):
    attributes = {
        kv["key"]: _decode_otlp_value(kv.get("value"))
        for kv in span.get("attributes") or []
        if isinstance(kv, dict) and "key" in kv
    }
    start = span.get("startTimeUnixNano")
    return {
        "name": span.get("name"),
        "context": {"span_id": span.get("spanId")},
        # Zero-padded so nanosecond timestamps of differing widths still sort
        # correctly as strings, matching how ISO timestamps are compared.
        "start_time": str(int(start)).zfill(20) if start not in (None, "") else "",
        "attributes": attributes,
    }


def _flatten_otlp(exports):
    spans = []
    for export in exports:
        resource_spans = export.get("resourceSpans")
        if not isinstance(resource_spans, list):
            raise TraceFormatError("'resourceSpans' must be a list")
        for resource in resource_spans:
            # "instrumentationLibrarySpans" is the pre-1.0 name for "scopeSpans"
            scopes = resource.get("scopeSpans") or resource.get("instrumentationLibrarySpans") or []
            for scope in scopes:
                for span in _check_spans(scope.get("spans") or [], "scope 'spans'"):
                    spans.append(_normalize_otlp_span(span))
    return spans


def extract_spans(trace):
    if isinstance(trace, list):
        # A list of OTLP exports, e.g. a Collector file-exporter .jsonl file
        if trace and all(isinstance(e, dict) and "resourceSpans" in e for e in trace):
            return _flatten_otlp(trace)
        return _check_spans(trace, "the trace")
    if isinstance(trace, dict):
        if "spans" in trace:
            return _check_spans(trace["spans"], "'spans'")
        if "resourceSpans" in trace:
            return _flatten_otlp([trace])
        raise TraceFormatError(
            "unrecognized trace format: expected a JSON array of spans, an object "
            "with a 'spans' array, or OTLP/JSON with 'resourceSpans' "
            f"(found keys: {', '.join(sorted(trace)) or 'none'})"
        )
    raise TraceFormatError(
        f"unrecognized trace format: expected a JSON array or object, got {type(trace).__name__}"
    )
