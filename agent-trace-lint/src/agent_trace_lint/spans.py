"""Turning a loaded trace file into a flat list of span dicts.

Every detector reads spans through extract_spans(), so a trace shape the
tool doesn't understand fails loudly here instead of quietly producing zero
spans -- which would look exactly like a clean trace.
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


def extract_spans(trace):
    if isinstance(trace, list):
        return _check_spans(trace, "the trace")
    if isinstance(trace, dict):
        if "spans" in trace:
            return _check_spans(trace["spans"], "'spans'")
        raise TraceFormatError(
            "unrecognized trace format: expected a JSON array of spans or an "
            f"object with a 'spans' array (found keys: {', '.join(sorted(trace)) or 'none'})"
        )
    raise TraceFormatError(
        f"unrecognized trace format: expected a JSON array or object, got {type(trace).__name__}"
    )
