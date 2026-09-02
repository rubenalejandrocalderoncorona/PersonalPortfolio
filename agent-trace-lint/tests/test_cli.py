import argparse
import json

import pytest

from agent_trace_lint.cli import _run_check


def make_args(trace_path, detectors="repetition,mismatch", fmt="text"):
    return argparse.Namespace(trace_path=str(trace_path), detectors=detectors, format=fmt)


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
