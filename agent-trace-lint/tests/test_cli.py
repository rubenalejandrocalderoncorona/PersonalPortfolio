import argparse
import io
import json
import os
import subprocess
import sys
from pathlib import Path

import pytest

from agent_trace_lint.cli import _run_check

SAMPLE_TRACE_PATH = Path(__file__).resolve().parent.parent / "traces" / "sample_trace.json"


def make_args(
    *trace_paths,
    detectors="repetition,mismatch",
    fmt="text",
    mismatch_threshold=0.3,
    repeat_min=2,
):
    return argparse.Namespace(
        trace_paths=[str(p) for p in trace_paths],
        detectors=detectors,
        format=fmt,
        mismatch_threshold=mismatch_threshold,
        repeat_min=repeat_min,
    )


@pytest.fixture
def clean_trace_path(tmp_path):
    path = tmp_path / "trace.json"
    path.write_text(json.dumps([]))
    return path


def test_missing_file_exits_2(tmp_path):
    args = make_args(tmp_path / "does_not_exist.json")
    assert _run_check(args) == 2


def test_directory_as_trace_path_exits_2_not_traceback(tmp_path):
    args = make_args(tmp_path)
    assert _run_check(args) == 2


@pytest.mark.skipif(
    sys.platform == "win32" or (hasattr(os, "geteuid") and os.geteuid() == 0),
    reason="permission bits aren't enforced for root or on Windows",
)
def test_unreadable_file_exits_2_not_traceback(tmp_path):
    path = tmp_path / "trace.json"
    path.write_text(json.dumps([]))
    path.chmod(0)
    try:
        args = make_args(path)
        assert _run_check(args) == 2
    finally:
        path.chmod(0o644)


def test_invalid_json_exits_2(tmp_path):
    path = tmp_path / "bad.json"
    path.write_text("{not valid json")
    args = make_args(path)
    assert _run_check(args) == 2


def test_unknown_detector_exits_2(clean_trace_path):
    args = make_args(clean_trace_path, detectors="not-a-real-detector")
    assert _run_check(args) == 2


def test_empty_detectors_exits_2(clean_trace_path):
    args = make_args(clean_trace_path, detectors="")
    assert _run_check(args) == 2


def test_blank_detectors_exits_2(clean_trace_path):
    args = make_args(clean_trace_path, detectors=" , ,")
    assert _run_check(args) == 2


def test_clean_trace_exits_0(clean_trace_path):
    args = make_args(clean_trace_path, detectors="repetition")
    assert _run_check(args) == 0


def test_malformed_trace_shape_exits_2_not_traceback(tmp_path):
    path = tmp_path / "trace.json"
    path.write_text(json.dumps(42))
    args = make_args(path, detectors="repetition")
    assert _run_check(args) == 2


def test_malformed_spans_value_exits_2_not_traceback(tmp_path):
    path = tmp_path / "trace.json"
    path.write_text(json.dumps({"spans": "not-a-list"}))
    args = make_args(path, detectors="repetition")
    assert _run_check(args) == 2


def test_default_mismatch_threshold_flags_known_mismatch():
    args = make_args(SAMPLE_TRACE_PATH, detectors="mismatch")
    assert _run_check(args) == 1


def test_lower_mismatch_threshold_clears_known_mismatch():
    args = make_args(SAMPLE_TRACE_PATH, detectors="mismatch", mismatch_threshold=0.01)
    assert _run_check(args) == 0


def test_findings_on_spans_without_ids_still_render(tmp_path, capsys):
    def tool_span(start_time):
        return {
            "attributes": {
                "gen_ai.operation.name": "execute_tool",
                "gen_ai.tool.name": "get_weather",
                "gen_ai.tool.call.arguments": json.dumps({"city": "Paris"}),
            },
            "start_time": start_time,
        }

    path = tmp_path / "trace.json"
    path.write_text(json.dumps([tool_span("2026-01-01T00:00:00Z"), tool_span("2026-01-01T00:00:01Z")]))

    args = make_args(path, detectors="repetition")
    assert _run_check(args) == 1
    out = capsys.readouterr().out
    assert "[REPEAT] 'get_weather' called 2 times in a row" in out
    assert "<unknown>, <unknown>" in out


def test_model_load_failure_exits_2_not_traceback(monkeypatch, capsys):
    import sentence_transformers

    from agent_trace_lint.detectors import mismatch

    def fail_to_download(*args, **kwargs):
        raise OSError("couldn't connect to huggingface.co")

    monkeypatch.setattr(mismatch, "_model", None)
    monkeypatch.setattr(sentence_transformers, "SentenceTransformer", fail_to_download)

    args = make_args(SAMPLE_TRACE_PATH, detectors="mismatch")
    assert _run_check(args) == 2
    err = capsys.readouterr().err
    assert "could not load embedding model" in err
    assert "--detectors repetition" in err


def test_default_repeat_min_flags_known_repeat():
    args = make_args(SAMPLE_TRACE_PATH, detectors="repetition")
    assert _run_check(args) == 1


def test_higher_repeat_min_clears_known_repeat():
    args = make_args(SAMPLE_TRACE_PATH, detectors="repetition", repeat_min=3)
    assert _run_check(args) == 0


def test_repeat_min_below_2_exits_2(clean_trace_path):
    args = make_args(clean_trace_path, detectors="repetition", repeat_min=1)
    assert _run_check(args) == 2


def test_stdin_input_clean_trace_exits_0(monkeypatch):
    monkeypatch.setattr(sys, "stdin", io.StringIO(json.dumps([])))
    args = make_args("-", detectors="repetition")
    assert _run_check(args) == 0


def test_stdin_invalid_json_reports_stdin_not_a_path(monkeypatch, capsys):
    monkeypatch.setattr(sys, "stdin", io.StringIO("not json"))
    args = make_args("-", detectors="repetition")
    assert _run_check(args) == 2
    assert "invalid JSON in stdin" in capsys.readouterr().err


def test_stdin_end_to_end_via_subprocess():
    result = subprocess.run(
        [sys.executable, "-m", "agent_trace_lint.cli", "check", "-", "--detectors", "repetition"],
        input=SAMPLE_TRACE_PATH.read_text(),
        capture_output=True,
        text=True,
    )
    assert result.returncode == 1
    assert "REPEAT" in result.stdout


def test_version_flag_exits_0_and_prints_version():
    result = subprocess.run(
        [sys.executable, "-m", "agent_trace_lint.cli", "--version"],
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0
    assert "agent-trace-lint" in result.stdout


def test_package_is_runnable_with_python_dash_m():
    result = subprocess.run(
        [sys.executable, "-m", "agent_trace_lint", "check", str(SAMPLE_TRACE_PATH), "--detectors", "repetition"],
        capture_output=True,
        text=True,
    )
    assert result.returncode == 1
    assert "REPEAT" in result.stdout


def test_multiple_files_all_clean_exits_0(clean_trace_path, tmp_path):
    other = tmp_path / "other.json"
    other.write_text(json.dumps([]))
    args = make_args(clean_trace_path, other, detectors="repetition")
    assert _run_check(args) == 0


def test_multiple_files_exit_1_if_any_has_findings(clean_trace_path):
    args = make_args(clean_trace_path, SAMPLE_TRACE_PATH, detectors="repetition")
    assert _run_check(args) == 1


def test_multiple_files_report_is_labeled_per_file(clean_trace_path, capsys):
    args = make_args(clean_trace_path, SAMPLE_TRACE_PATH, detectors="repetition")
    _run_check(args)
    out = capsys.readouterr().out
    assert f"== {clean_trace_path} ==" in out
    assert f"== {SAMPLE_TRACE_PATH} ==" in out


def test_bad_file_among_many_still_checks_the_rest_and_exits_2(clean_trace_path, tmp_path, capsys):
    args = make_args(clean_trace_path, tmp_path / "missing.json", SAMPLE_TRACE_PATH, detectors="repetition")
    assert _run_check(args) == 2
    captured = capsys.readouterr()
    assert "trace file not found" in captured.err
    assert "REPEAT" in captured.out


def test_multiple_files_json_is_keyed_by_path(clean_trace_path, capsys):
    args = make_args(clean_trace_path, SAMPLE_TRACE_PATH, detectors="repetition", fmt="json")
    _run_check(args)
    data = json.loads(capsys.readouterr().out)
    assert data[str(clean_trace_path)] == {"repetition": []}
    assert data[str(SAMPLE_TRACE_PATH)]["repetition"][0]["tool_name"] == "get_weather"


def test_single_file_json_keeps_flat_shape(clean_trace_path, capsys):
    args = make_args(clean_trace_path, detectors="repetition", fmt="json")
    _run_check(args)
    assert json.loads(capsys.readouterr().out) == {"repetition": []}


def test_stdin_cannot_be_combined_with_other_paths(clean_trace_path):
    args = make_args("-", clean_trace_path, detectors="repetition")
    assert _run_check(args) == 2


def _run_cli(*cli_args):
    return subprocess.run(
        [sys.executable, "-m", "agent_trace_lint.cli", *cli_args],
        capture_output=True,
        text=True,
    )


def test_trace_path_interleaved_with_an_option_is_not_stranded(tmp_path):
    """Regression test: argparse's nargs="+" positional used to stop
    consuming trace_paths at the first option, leaving anything after it
    reported as an "unrecognized argument" even though it's a valid path.
    """
    clean = tmp_path / "clean.json"
    clean.write_text(json.dumps([]))

    result = _run_cli("check", str(clean), "--detectors", "repetition", str(SAMPLE_TRACE_PATH))

    assert result.returncode == 1, result.stderr
    assert f"== {clean} ==" in result.stdout
    assert f"== {SAMPLE_TRACE_PATH} ==" in result.stdout
    assert "REPEAT" in result.stdout


def test_unknown_flag_among_paths_still_errors_clearly(tmp_path):
    clean = tmp_path / "clean.json"
    clean.write_text(json.dumps([]))

    result = _run_cli("check", str(clean), "--not-a-real-flag", str(SAMPLE_TRACE_PATH))

    assert result.returncode == 2
    assert "unrecognized arguments: --not-a-real-flag" in result.stderr


def test_hello_rejects_stray_arguments():
    result = _run_cli("hello", "extra")
    assert result.returncode == 2
    assert "unrecognized arguments: extra" in result.stderr
