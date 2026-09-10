import argparse
import json
import subprocess
import sys
from pathlib import Path

import pytest

from agent_trace_lint.cli import _run_check

SAMPLE_TRACE_PATH = Path(__file__).resolve().parent.parent / "traces" / "sample_trace.json"


def make_args(trace_path, detectors="repetition,mismatch", fmt="text", mismatch_threshold=0.3):
    return argparse.Namespace(
        trace_path=str(trace_path),
        detectors=detectors,
        format=fmt,
        mismatch_threshold=mismatch_threshold,
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


def test_version_flag_exits_0_and_prints_version():
    result = subprocess.run(
        [sys.executable, "-m", "agent_trace_lint.cli", "--version"],
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0
    assert "agent-trace-lint" in result.stdout
