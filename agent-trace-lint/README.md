# agent-trace-lint

[![tests](https://github.com/rubenalejandrocalderoncorona/PersonalPortfolio/actions/workflows/agent-trace-lint-tests.yml/badge.svg)](https://github.com/rubenalejandrocalderoncorona/PersonalPortfolio/actions/workflows/agent-trace-lint-tests.yml)

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

Calls are only compared within the same `trace_id`, so a file holding many traces (a Collector export usually does) never mistakes two different requests for a loop, and a real loop isn't hidden by another trace's call landing in between. Spans with no `trace_id` are treated as one trace.

A third detector is available but opt-in (`--detectors repetition,mismatch,cycle`):

- **cycle** -- flags a short sequence of calls that repeats back to back (`search`, `read_page`, `search`, `read_page`, ...), the alternating loop the repetition detector can't see because no single call repeats. It's opt-in because a legitimate polling loop (`check_status`, `wait`, `check_status`, ...) has the same shape.

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
           trace: 0xe19c31b24d35bc69288cdd8be47a9fdb
           spans: 0x3b53978b5fa5e455, 0x0ff8844d1bb1c7e1

  [MISMATCH] 'search_database' looks unrelated to its stated reasoning (score: 0.0291)
           reasoning: 'The weather looks good, I think I am done here and do not need to do anything else.'
           trace: 0xe19c31b24d35bc69288cdd8be47a9fdb
           spans: 0xbc51ad1e718c30b9
           note: Score is cosine similarity from a general-purpose sentence embedding model (all-MiniLM-L6-v2), used as a first-pass heuristic only -- it has not been tuned or validated against a labeled dataset of real reasoning/action mismatches. Treat low scores as worth a human look, not as a confirmed mismatch.
```

If the `agent-trace-lint` script isn't on your `PATH` (some CI images and virtualenvs), `python -m agent_trace_lint check ...` runs the same CLI.

Exits `0` if the trace is clean, `1` if findings were reported (so it can gate CI), or `2` on an error (bad path, invalid JSON, an unrecognized trace format, unknown or empty `--detectors` list, or the embedding model failing to load) -- so a broken environment is never mistaken for a lint finding.

Rolling this out on an existing agent? Add `--exit-zero` to run in report-only mode: findings are still printed, but the exit code stays `0` so the build doesn't fail while you tune thresholds. Real errors (bad path, invalid JSON, a bad flag value) still exit `2`, so a broken setup can't pass as clean.

```bash
agent-trace-lint check traces/*.json --exit-zero
```

Run only specific detectors with `--detectors` (comma-separated, default `repetition,mismatch`):

```bash
agent-trace-lint check traces/sample_trace.json --detectors repetition
```

Getting false positives or negatives from the `mismatch` detector? Tune its cosine-similarity cutoff with `--mismatch-threshold` (default `0.3`) before opening an issue -- lower it to flag fewer, more clear-cut mismatches, or raise it to catch subtler ones:

```bash
agent-trace-lint check traces/sample_trace.json --detectors mismatch --mismatch-threshold 0.15
```

It's a cosine similarity, so it must be between `-1.0` and `1.0` -- a value outside that range (e.g. `30`, meant as a percentage) is rejected rather than run, since it would otherwise silently flag every pair or none at all.

To catch alternating loops, add the opt-in `cycle` detector. A sequence of 2-4 calls must repeat `--cycle-repeats` times in a row (default `3`, minimum `2`) before it's flagged:

```bash
agent-trace-lint check traces/sample_trace.json --detectors repetition,mismatch,cycle
```

```
  [CYCLE] 'search' -> 'read_page' repeated 3 times (6 calls)
          spans: 0x0000, 0x0001, 0x0002, 0x0003, 0x0004, 0x0005
```

If your agent legitimately retries a call once or twice before moving on, raise `--repeat-min` (default `2`, minimum `2`) so the `repetition` detector only flags longer runs:

```bash
agent-trace-lint check traces/sample_trace.json --detectors repetition --repeat-min 3
```

Check several traces in one run (the embedding model is loaded once, not per file):

```bash
agent-trace-lint check traces/*.json
```

Each report is headed by its file name, and the exit code is the worst outcome across files (`2` if any file errored, else `1` if any had findings, else `0`) -- a bad file doesn't stop the rest from being checked. With `--format json`, a single file prints the flat `{detector: [findings]}` object shown below; multiple files print one object keyed by path.

In GitHub Actions, `--format github` prints each finding as a workflow annotation (`::error file=<trace>,title=agent-trace-lint: <detector>::...`), so findings show up on the run summary and PR checks instead of being buried in the log. Exit codes are unchanged, so the step still fails the job -- add `--exit-zero` to annotate without failing:

```yaml
- run: agent-trace-lint check traces/*.json --format github
```

Pass `-` as the trace path to read from stdin instead of a file (it can't be combined with other paths) -- useful when your trace exporter writes to a pipe rather than disk in CI:

```bash
your-agent-runner --export-trace | agent-trace-lint check -
```

Use `--format json` for machine-readable output, grouped by detector. Each finding carries the `trace_id` it came from (`null` if the spans have none), which is how you locate it in a file holding many traces:

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
      "span_ids": ["0x3b53978b5fa5e455", "0x0ff8844d1bb1c7e1"],
      "trace_id": "0xe19c31b24d35bc69288cdd8be47a9fdb"
    }
  ],
  "mismatch": [
    {
      "tool_name": "search_database",
      "arguments": { "query": "Paris travel advisories" },
      "span_ids": ["0xbc51ad1e718c30b9"],
      "trace_id": "0xe19c31b24d35bc69288cdd8be47a9fdb",
      "reasoning": "The weather looks good, I think I am done here and do not need to do anything else.",
      "score": 0.0291,
      "note": "Score is cosine similarity from a general-purpose sentence embedding model (all-MiniLM-L6-v2), used as a first-pass heuristic only -- it has not been tuned or validated against a labeled dataset of real reasoning/action mismatches. Treat low scores as worth a human look, not as a confirmed mismatch."
    }
  ]
}
```

Note: the mismatch detector downloads its embedding model from Hugging Face on first use (cached locally after that) -- the first run needs network access, later runs don't. If that first download fails, the CLI exits `2` with a clear message; pass `--detectors repetition` to run without the model.

## Supported trace formats

- **OpenTelemetry Python SDK JSON** -- what `span.to_json()` produces (see `scripts/generate_sample_trace.py`): a JSON array of spans, or an object with a `spans` array.
- **OTLP/JSON** -- what the OpenTelemetry Collector's file exporter writes: a `resourceSpans` document, or newline-delimited `.jsonl` with one export per line. Typed attribute values (`stringValue`, `intValue`, `arrayValue`, ...) are decoded for you.

Trace files are read as UTF-8 (a BOM is fine) or UTF-16 -- the latter is what PowerShell's `>` redirection writes -- regardless of the machine's locale. Anything else exits `2` with a `could not decode` error.

Anything else -- a JSON object with none of those keys, say -- exits `2` with an `unrecognized trace format` error naming the keys it found, rather than reporting a clean trace it never actually read.

## Limitations

This is v0.1. In particular:

- **Repetition detection uses exact/near-exact matching.** It compares tool name and parsed arguments for equality -- it is not yet argument-similarity aware, so a retry with a trivially different argument (a different page number, a reworded query) won't be caught even though it's the same underlying loop.
- **Alternating loops need the opt-in `cycle` detector.** The default `repetition` detector only sees back-to-back runs of one call, so an agent bouncing between two calls isn't flagged unless you run `--detectors repetition,mismatch,cycle`. `cycle` is exact-match too (same names *and* arguments), and only looks for blocks of up to 4 calls.
- **Mismatch detection is a first-pass embedding-similarity heuristic**, not a validated classifier. It has not been tuned against a large labeled dataset of real reasoning/action mismatches -- treat a low score as "worth a human look," not "confirmed defect."
- Both detectors are early and will misfire on trace shapes they haven't seen yet.

Contributions and, especially, real-world trace examples (particularly false positives and false negatives) are very welcome -- see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT -- see [LICENSE](LICENSE).
