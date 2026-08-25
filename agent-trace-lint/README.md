# agent-trace-lint

A CLI linter for OpenTelemetry GenAI agent traces -- catches stuck-loop repetitions and reasoning/action mismatches that pass/fail evals miss.

## The gap

OpenTelemetry's [GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) are becoming the standard schema for agent traces -- spans for `chat` calls and `execute_tool` calls, with attributes like `gen_ai.tool.name` and `gen_ai.response.text`. It's already being adopted across major cloud providers and observability vendors as the common wire format for "what did my agent actually do."

But the layer on top of that standard -- actually looking at a trace and flagging *this step was probably a mistake* -- currently only exists as heavy, often commercial evaluation platforms (Arize, Galileo, Braintrust, and similar). There's no small, free, drop-in library that just reads a standard OTel GenAI trace and tells you "your agent looped here" or "the model's stated reasoning doesn't match what it did next."

That gap matters because these failure modes are common and don't show up in a simple pass/fail eval -- the agent can still complete the task while doing this along the way. A 2025 study of agent trajectories found that **17.14% of agent failures involved step repetitions** and **13.98% involved reasoning-action mismatches** -- both silent, both invisible to an eval that only checks the final answer.

`agent-trace-lint` is a first attempt at filling that gap: a small, dependency-light CLI that runs a couple of targeted detectors over a trace file and exits non-zero if it finds something, so it can slot into CI the same way a code linter does.

## What it does

Two detectors run by default:

- **repetition** -- flags a tool called with the same name and arguments back to back, the signature of a stuck agent loop.
- **mismatch** -- flags a step where the model's stated reasoning looks unrelated to the tool it then calls, using offline sentence-embedding similarity as a first-pass heuristic.

## Install

Not on PyPI yet -- install from source:

```bash
git clone https://github.com/rubenalejandrocalderoncorona/PersonalPortfolio.git
cd PersonalPortfolio/agent-trace-lint
pip install -e .
```

## Quick start

```bash
agent-trace-lint check traces/sample_trace.json
```

```
found 2 issue(s):

  [REPEAT] 'get_weather' called 2 times in a row
           spans: 0x3b53978b5fa5e455, 0x0ff8844d1bb1c7e1

  [MISMATCH] 'search_database' looks unrelated to its stated reasoning (score: 0.0291)
           reasoning: 'The weather looks good, I think I am done here and do not need to do anything else.'
           spans: 0xbc51ad1e718c30b9
           note: Score is cosine similarity from a general-purpose sentence embedding model (all-MiniLM-L6-v2), used as a first-pass heuristic only -- it has not been tuned or validated against a labeled dataset of real reasoning/action mismatches. Treat low scores as worth a human look, not as a confirmed mismatch.
```

Exits `0` if the trace is clean, `1` if findings were reported (so it can gate CI), or `2` on a bad path/invalid JSON/unknown detector name.

Run only specific detectors with `--detectors` (comma-separated, default `repetition,mismatch`):

```bash
agent-trace-lint check traces/sample_trace.json --detectors repetition
```

Use `--format json` for machine-readable output, grouped by detector:

```bash
agent-trace-lint check traces/sample_trace.json --format json
```

```json
{
  "repetition": [
    {
      "tool_name": "get_weather",
      "repeat_count": 2,
      "arguments": { "city": "Paris" },
      "span_ids": ["0x3b53978b5fa5e455", "0x0ff8844d1bb1c7e1"]
    }
  ],
  "mismatch": [
    {
      "tool_name": "search_database",
      "arguments": { "query": "Paris travel advisories" },
      "span_ids": ["0xbc51ad1e718c30b9"],
      "reasoning": "The weather looks good, I think I am done here and do not need to do anything else.",
      "score": 0.0291,
      "note": "Score is cosine similarity from a general-purpose sentence embedding model (all-MiniLM-L6-v2), used as a first-pass heuristic only -- it has not been tuned or validated against a labeled dataset of real reasoning/action mismatches. Treat low scores as worth a human look, not as a confirmed mismatch."
    }
  ]
}
```

Note: the mismatch detector downloads its embedding model from Hugging Face on first use (cached locally after that) -- the first run needs network access, later runs don't.

## Limitations

This is v0.1. In particular:

- **Repetition detection uses exact/near-exact matching.** It compares tool name and parsed arguments for equality -- it is not yet argument-similarity aware, so a retry with a trivially different argument (a different page number, a reworded query) won't be caught even though it's the same underlying loop.
- **Mismatch detection is a first-pass embedding-similarity heuristic**, not a validated classifier. It has not been tuned against a large labeled dataset of real reasoning/action mismatches -- treat a low score as "worth a human look," not "confirmed defect."
- Both detectors are early and will misfire on trace shapes they haven't seen yet.

Contributions and, especially, real-world trace examples (particularly false positives and false negatives) are very welcome -- see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT -- see [LICENSE](LICENSE).
