"""Alternating-call loop detection over an OpenTelemetry GenAI trace.

Flags a short sequence of tool calls (same names, same arguments) that
repeats several times back to back -- e.g. search, read_page, search,
read_page, search, read_page. No single call repeats consecutively there,
so the repetition detector misses it, but it's a classic stuck-agent loop.

Caveat: a legitimate polling loop (check_status, sleep, check_status,
sleep, ...) has exactly this shape. A hit means "worth a human look", and
`min_repeats` is the knob for how much repetition you tolerate.
"""
import json

from agent_trace_lint.detectors.repetition import _extract_spans, _tool_calls_in_order


def _call_key(call):
    return (call["tool_name"], json.dumps(call["arguments"], sort_keys=True, default=str))


def _is_primitive(block):
    """True unless `block` is itself a smaller block repeated (A A, or A B A B)."""
    size = len(block)
    for d in range(1, size):
        if size % d == 0 and block == block[:d] * (size // d):
            return False
    return True


def detect_cycle(trace, min_repeats: int = 3, max_period: int = 4) -> list:
    """Find a block of 2..`max_period` tool calls repeated back to back.

    A block counts once it repeats `min_repeats` times in a row (so with
    the default of 3, search/read_page/search/read_page/search/read_page is
    flagged but a single search/read_page/search/read_page is not). Blocks
    that are really a smaller block repeated -- including a single call
    repeated, which is detect_repetition()'s job -- are not reported here.

    Returns a list of findings, each: {tool_names, arguments, repeat_count,
    span_ids}, ordered by where the run starts in the trace. `tool_names`
    and `arguments` list one entry per call in the cycle; `span_ids` covers
    every call in the run.

    Raises ValueError if `min_repeats` is below 2 or `max_period` is below 2.
    """
    if min_repeats < 2:
        raise ValueError(f"min_repeats must be at least 2, got {min_repeats}")
    if max_period < 2:
        raise ValueError(f"max_period must be at least 2, got {max_period}")

    calls = _tool_calls_in_order(_extract_spans(trace))
    keys = [_call_key(c) for c in calls]

    findings = []
    i = 0
    while i < len(calls):
        match = None
        for period in range(2, max_period + 1):
            block = keys[i:i + period]
            if len(block) < period or not _is_primitive(block):
                continue
            repeats = 1
            while keys[i + repeats * period:i + (repeats + 1) * period] == block:
                repeats += 1
            if repeats >= min_repeats:
                match = (period, repeats)
                break

        if match is None:
            i += 1
            continue

        period, repeats = match
        end = i + period * repeats
        findings.append({
            "tool_names": [c["tool_name"] for c in calls[i:i + period]],
            "arguments": [c["arguments"] for c in calls[i:i + period]],
            "repeat_count": repeats,
            "span_ids": [c["span_id"] for c in calls[i:end]],
        })
        i = end
    return findings
