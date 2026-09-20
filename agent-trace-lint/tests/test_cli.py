import argparse
import io
import json
import subprocess
import sys
from pathlib import Path

import pytest

from agent_trace_lint.cli import _run_check

SAMPLE_TRACE_PATH = Path(__file__).resolve().parent.parent / "traces" / "sample_trace.json"


def make_args(
    trace_path,
    detectors="repetition,mismatch",
    fmt="text",
    mismatch_threshold=0.3,
    repeat_min=2,
):
    return argparse.Namespace(
        trace_path=str(trace_path),
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
