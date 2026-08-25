# Contributing

`agent-trace-lint` is v0.1 -- both detectors are heuristics, and the thing they need most right now isn't more code, it's more real traces to test against.

## The most valuable contribution: a false positive or false negative

If you ran `agent-trace-lint check` against a real trace and it either:

- **flagged something that wasn't actually a problem** (false positive), or
- **missed something that clearly was one** (false negative),

please open an issue with:

1. The trace itself, or a trimmed-down version that still reproduces the issue (redact anything sensitive -- tool arguments and reasoning text are the fields most likely to carry it)
2. The command you ran
3. What `agent-trace-lint` said vs. what you expected
4. A sentence on why you think it's wrong (e.g. "these two calls only look identical, the retry actually had a different `page` argument the detector didn't parse")

Even a single confusing example is useful -- both detectors are simple on purpose right now, and they'll only get better tuned against cases that actually broke.

## Code contributions

Bug fixes and small, focused improvements are welcome. For anything larger (a new detector, a change to the finding schema), please open an issue first to talk it through before writing code.

To run the test suite locally:

```bash
pip install -e ".[test]"
pytest
```
