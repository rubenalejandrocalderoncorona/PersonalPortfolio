# agent-trace-lint

A CLI tool for linting agent traces.

## Usage

Check a trace file for issues (e.g. an agent stuck calling the same tool with the same arguments in a row):

```bash
agent-trace-lint check traces/sample_trace.json
```

```
found 1 repetition issue(s):

  [REPEAT] 'get_weather' called 2 times in a row
           spans: 0xba641c4168839610, 0x8de46d99cb7ccf67
```

Exits `0` if the trace is clean, `1` if findings were reported (so it can gate CI), or `2` on a bad path/invalid JSON.

Use `--format json` for machine-readable output:

```bash
agent-trace-lint check traces/sample_trace.json --format json
```

```json
[
  {
    "tool_name": "get_weather",
    "repeat_count": 2,
    "arguments": {
      "city": "Paris"
    },
    "span_ids": [
      "0xba641c4168839610",
      "0x8de46d99cb7ccf67"
    ]
  }
]
```
