"""Reasoning/action mismatch detection over an OpenTelemetry GenAI trace.

Flags steps where the model's stated reasoning text and the tool call it
then makes look unrelated, using embedding similarity as a cheap first-pass
signal.

Caveat (also carried into every finding): this is a general-purpose sentence
embedding model, not something trained or validated on labeled examples of
real reasoning/action mismatches. A low score means "worth a human look",
not "confirmed mismatch" -- treat it as a heuristic, not a verdict.
"""
import json

_MODEL_NAME = "all-MiniLM-L6-v2"
_model = None

HEURISTIC_NOTE = (
    "Score is cosine similarity from a general-purpose sentence embedding "
    f"model ({_MODEL_NAME}), used as a first-pass heuristic only -- it has "
    "not been tuned or validated against a labeled dataset of real "
    "reasoning/action mismatches. Treat low scores as worth a human look, "
    "not as a confirmed mismatch."
)


def _get_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer(_MODEL_NAME)
    return _model


def _cosine_similarity(a, b):
    import numpy as np
    a = np.asarray(a)
    b = np.asarray(b)
    denom = float(np.linalg.norm(a) * np.linalg.norm(b))
    if denom == 0:
        return 0.0
    return float(np.dot(a, b) / denom)


def _extract_spans(trace):
    if isinstance(trace, list):
        return trace
    if isinstance(trace, dict):
        return trace.get("spans", [])
    raise TypeError(f"Unsupported trace type: {type(trace)!r}")


def _parse_json(raw):
    if isinstance(raw, str):
        try:
            return json.loads(raw)
        except ValueError:
            return raw
    return raw


def _tool_call_text(tool_name, arguments):
    """Render a tool call as a short natural-language description to embed."""
    if isinstance(arguments, dict):
        args_str = ", ".join(f"{k}={v!r}" for k, v in arguments.items())
    else:
        args_str = repr(arguments)
    return f"called {tool_name} with {args_str}"


def _reasoning_tool_pairs(spans):
    """Extract (reasoning, tool call) pairs from chat spans that carry both."""
    pairs = []
    for span in spans:
        attributes = span.get("attributes") or {}
        if attributes.get("gen_ai.operation.name") != "chat":
            continue
        reasoning = attributes.get("gen_ai.response.text")
        tool_names = attributes.get("gen_ai.response.tool_calls") or []
        tool_args = attributes.get("gen_ai.response.tool_call_arguments") or []
        if not reasoning or not tool_names:
            continue
        span_id = (span.get("context") or {}).get("span_id")
        for name, args_raw in zip(tool_names, tool_args):
            pairs.append({
                "span_id": span_id,
                "reasoning": reasoning,
                "tool_name": name,
                "arguments": _parse_json(args_raw),
            })
    return pairs


def detect_mismatch(trace, threshold: float = 0.3) -> list:
    """Flag steps where reasoning text and the tool call that follows it
    look unrelated, based on embedding similarity.

    For each chat span that produced both a reasoning/text response and a
    tool call, computes the cosine similarity between the reasoning text
    and a short natural-language rendering of the tool call. Steps scoring
    below `threshold` are flagged.

    Returns a list of findings shaped like detect_repetition()'s: each has
    tool_name, arguments, and span_ids, plus reasoning, score, and note.

    This is a heuristic, not a verdict -- see HEURISTIC_NOTE / each
    finding's "note" field.
    """
    pairs = _reasoning_tool_pairs(_extract_spans(trace))
    if not pairs:
        return []

    model = _get_model()
    reasoning_embeddings = model.encode([p["reasoning"] for p in pairs])
    action_embeddings = model.encode([_tool_call_text(p["tool_name"], p["arguments"]) for p in pairs])

    findings = []
    for pair, r_emb, a_emb in zip(pairs, reasoning_embeddings, action_embeddings):
        score = _cosine_similarity(r_emb, a_emb)
        if score < threshold:
            findings.append({
                "tool_name": pair["tool_name"],
                "arguments": pair["arguments"],
                "span_ids": [pair["span_id"]],
                "reasoning": pair["reasoning"],
                "score": round(score, 4),
                "note": HEURISTIC_NOTE,
            })
    return findings
