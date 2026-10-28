"""Keep the README's examples true: every command it shows must run, and the
sample output it prints must be what the tool actually prints."""
import glob
import json
import re
import shlex
import sys
from pathlib import Path

import pytest

from agent_trace_lint.cli import main

PROJECT_ROOT = Path(__file__).resolve().parent.parent
README = (PROJECT_ROOT / "README.md").read_text()

# A ```bash block holding one agent-trace-lint command, optionally followed
# by a plain ``` block that shows its output.
EXAMPLE = re.compile(
    r"```bash\n(?P<command>agent-trace-lint [^\n]+)\n```(?:\n\n```\n(?P<output>.*?)```)?",
    re.S,
)
EXAMPLES = [(m["command"], m["output"]) for m in EXAMPLE.finditer(README)]

# The same, for a command followed by a ```json block of its output.
JSON_EXAMPLE = re.compile(
    r"```bash\n(?P<command>agent-trace-lint [^\n]+)\n```\n\n```json\n(?P<output>.*?)```", re.S
)
JSON_EXAMPLES = [(m["command"], m["output"]) for m in JSON_EXAMPLE.finditer(README)]


def run_readme_command(command, monkeypatch, capsys):
    """Run a README command in-process (so the embedding model loads once for
    the whole test session instead of once per example) and return
    (exit code, stdout, stderr). Globs like traces/*.json are expanded here
    because there's no shell to do it."""
    argv = []
    for token in shlex.split(command)[1:]:
        argv.extend(sorted(glob.glob(token, root_dir=PROJECT_ROOT)) if "*" in token else [token])

    monkeypatch.chdir(PROJECT_ROOT)
    monkeypatch.setattr(sys, "argv", ["agent-trace-lint", *argv])
    capsys.readouterr()
    try:
        main()
        code = 0
    except SystemExit as exit_:
        code = exit_.code if isinstance(exit_.code, int) else 1
    captured = capsys.readouterr()
    return code, captured.out, captured.err


def test_the_readme_has_examples_to_check():
    assert len(EXAMPLES) >= 8


@pytest.mark.parametrize("command", [c for c, _ in EXAMPLES], ids=[c for c, _ in EXAMPLES])
def test_readme_command_runs_without_a_usage_or_input_error(command, monkeypatch, capsys):
    code, _, err = run_readme_command(command, monkeypatch, capsys)
    # 0 = clean, 1 = findings; 2 would mean a bad flag, path or format.
    assert code in (0, 1), f"{command}\n{err}"


@pytest.mark.parametrize(
    "command,output",
    [(c, o) for c, o in EXAMPLES if o],
    ids=[c for c, o in EXAMPLES if o],
)
def test_readme_sample_output_matches_what_the_tool_prints(command, output, monkeypatch, capsys):
    _, out, _ = run_readme_command(command, monkeypatch, capsys)
    actual_lines = {line.rstrip() for line in out.splitlines()}
    for line in output.splitlines():
        if line.strip():
            assert line.rstrip() in actual_lines, f"README shows a line the tool doesn't print:\n{line}"


def finding_keys(report):
    return {detector: [sorted(finding) for finding in findings] for detector, findings in report.items()}


@pytest.mark.parametrize("command,output", JSON_EXAMPLES, ids=[c for c, _ in JSON_EXAMPLES])
def test_readme_json_example_has_the_same_shape_as_real_output(command, output, monkeypatch, capsys):
    """Compares which keys each finding has, not their values -- scores can
    differ in the last digit across library versions."""
    _, out, _ = run_readme_command(command, monkeypatch, capsys)
    assert finding_keys(json.loads(output)) == finding_keys(json.loads(out))


def test_the_readme_has_a_json_example_to_check():
    assert JSON_EXAMPLES
