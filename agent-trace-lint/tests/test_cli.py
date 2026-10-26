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
    cycle_repeats=3,
    exit_zero=False,
):
    return argparse.Namespace(
        trace_paths=[str(p) for p in trace_paths],
        detectors=detectors,
        format=fmt,
        mismatch_threshold=mismatch_threshold,
        repeat_min=repeat_min,
        cycle_repeats=cycle_repeats,
        exit_zero=exit_zero,
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


@pytest.mark.parametrize("threshold", [30, -2, 1.5, float("nan")])
def test_mismatch_threshold_out_of_range_exits_2(clean_trace_path, threshold):
    """A threshold outside [-1, 1] can't be a real cosine similarity -- most
    plausibly a percentage typo (30 meaning 30%) -- and would otherwise
    silently flag every pair (or none), so it's rejected outright rather
    than run.
    """
    args = make_args(clean_trace_path, detectors="mismatch", mismatch_threshold=threshold)
    assert _run_check(args) == 2


@pytest.mark.parametrize("threshold", [-1.0, 1.0])
def test_mismatch_threshold_boundary_values_are_accepted(threshold):
    args = make_args(SAMPLE_TRACE_PATH, detectors="mismatch", mismatch_threshold=threshold)
    assert _run_check(args) in (0, 1)


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


def test_check_help_documents_format_default_and_exit_codes():
    result = _run_cli("check", "--help")
    assert result.returncode == 0
    assert "output format (default: text)" in result.stdout
    assert "exit codes:" in result.stdout
    assert "0 clean, 1 findings reported (0 with --exit-zero), 2 error" in result.stdout


@pytest.fixture
def ping_pong_trace_path(tmp_path):
    """search / read_page alternating three times -- no single call repeats."""
    spans = []
    for i, (name, arguments) in enumerate([("search", {"q": "paris"}), ("read_page", {"id": 1})] * 3):
        spans.append({
            "context": {"span_id": f"s{i}"},
            "start_time": f"2026-01-01T00:00:{i:02d}Z",
            "attributes": {
                "gen_ai.operation.name": "execute_tool",
                "gen_ai.tool.name": name,
                "gen_ai.tool.call.arguments": json.dumps(arguments),
            },
        })
    path = tmp_path / "ping_pong.json"
    path.write_text(json.dumps(spans))
    return path


def test_cycle_detector_flags_ping_pong_trace(ping_pong_trace_path, capsys):
    args = make_args(ping_pong_trace_path, detectors="cycle")
    assert _run_check(args) == 1
    out = capsys.readouterr().out
    assert "[CYCLE] 'search' -> 'read_page' repeated 3 times (6 calls)" in out


def test_ping_pong_is_invisible_to_the_repetition_detector(ping_pong_trace_path):
    args = make_args(ping_pong_trace_path, detectors="repetition")
    assert _run_check(args) == 0


def test_cycle_is_not_part_of_the_default_detector_set(ping_pong_trace_path):
    result = _run_cli("check", str(ping_pong_trace_path))
    assert result.returncode == 0, result.stderr
    assert "no issues detected" in result.stdout


def test_higher_cycle_repeats_clears_a_three_repeat_cycle(ping_pong_trace_path):
    args = make_args(ping_pong_trace_path, detectors="cycle", cycle_repeats=4)
    assert _run_check(args) == 0


def test_cycle_repeats_below_2_exits_2(ping_pong_trace_path):
    args = make_args(ping_pong_trace_path, detectors="cycle", cycle_repeats=1)
    assert _run_check(args) == 2


def test_cycle_findings_serialize_to_json(ping_pong_trace_path, capsys):
    args = make_args(ping_pong_trace_path, detectors="cycle", fmt="json")
    assert _run_check(args) == 1
    finding = json.loads(capsys.readouterr().out)["cycle"][0]
    assert finding["tool_names"] == ["search", "read_page"]
    assert finding["repeat_count"] == 3
    assert finding["span_ids"] == [f"s{i}" for i in range(6)]


def test_exit_zero_turns_findings_into_exit_0(capsys):
    args = make_args(SAMPLE_TRACE_PATH, detectors="repetition", exit_zero=True)
    assert _run_check(args) == 0
    assert "REPEAT" in capsys.readouterr().out


def test_exit_zero_still_reports_errors_as_exit_2(tmp_path):
    args = make_args(tmp_path / "missing.json", detectors="repetition", exit_zero=True)
    assert _run_check(args) == 2


def test_exit_zero_does_not_mask_an_error_among_findings(clean_trace_path, tmp_path):
    args = make_args(
        SAMPLE_TRACE_PATH, tmp_path / "missing.json", detectors="repetition", exit_zero=True
    )
    assert _run_check(args) == 2


def test_exit_zero_flag_via_the_real_cli():
    result = _run_cli("check", str(SAMPLE_TRACE_PATH), "--detectors", "repetition", "--exit-zero")
    assert result.returncode == 0, result.stderr
    assert "REPEAT" in result.stdout


def test_json_object_that_is_not_a_trace_exits_2_instead_of_reporting_clean(tmp_path, capsys):
    path = tmp_path / "not_a_trace.json"
    path.write_text(json.dumps({"completely": "unrelated"}))
    args = make_args(path, detectors="repetition")
    assert _run_check(args) == 2
    assert "unrecognized trace format" in capsys.readouterr().err


def otlp_tool_span(span_id, nanos, tool_name, arguments):
    def attr(key, value):
        return {"key": key, "value": {"stringValue": value}}

    return {
        "spanId": span_id,
        "startTimeUnixNano": str(nanos),
        "attributes": [
            attr("gen_ai.operation.name", "execute_tool"),
            attr("gen_ai.tool.name", tool_name),
            attr("gen_ai.tool.call.arguments", json.dumps(arguments)),
        ],
    }


@pytest.fixture
def otlp_repeat_export():
    spans = [
        otlp_tool_span("o1", 1_000, "get_weather", {"city": "Paris"}),
        otlp_tool_span("o2", 2_000, "get_weather", {"city": "Paris"}),
    ]
    return {"resourceSpans": [{"scopeSpans": [{"spans": spans}]}]}


def test_otlp_json_file_is_checked_instead_of_reporting_clean(tmp_path, otlp_repeat_export, capsys):
    path = tmp_path / "otlp.json"
    path.write_text(json.dumps(otlp_repeat_export))

    assert _run_check(make_args(path, detectors="repetition")) == 1
    out = capsys.readouterr().out
    assert "[REPEAT] 'get_weather' called 2 times in a row" in out
    assert "o1, o2" in out


def test_otlp_jsonl_file_one_export_per_line(tmp_path, otlp_repeat_export, capsys):
    path = tmp_path / "otlp.jsonl"
    path.write_text(json.dumps(otlp_repeat_export) + "\n" + json.dumps({"resourceSpans": []}) + "\n")

    assert _run_check(make_args(path, detectors="repetition")) == 1
    assert "o1, o2" in capsys.readouterr().out


def test_otlp_from_stdin(monkeypatch, otlp_repeat_export):
    monkeypatch.setattr(sys, "stdin", io.StringIO(json.dumps(otlp_repeat_export)))
    assert _run_check(make_args("-", detectors="repetition")) == 1


def test_broken_jsonl_still_reports_invalid_json(tmp_path, capsys):
    path = tmp_path / "broken.jsonl"
    path.write_text("{not valid\n{also: bad}\n")

    assert _run_check(make_args(path, detectors="repetition")) == 2
    assert "invalid JSON" in capsys.readouterr().err


def test_json_lines_that_are_not_all_objects_are_not_guessed_at(tmp_path):
    path = tmp_path / "mixed.jsonl"
    path.write_text('{"resourceSpans": []}\n[1, 2]\n')

    assert _run_check(make_args(path, detectors="repetition")) == 2


def test_otlp_export_with_two_traces_does_not_mix_them_up(tmp_path):
    def with_trace(span, trace_id):
        return {**span, "traceId": trace_id}

    spans = [
        with_trace(otlp_tool_span("o1", 1_000, "get_weather", {"city": "Paris"}), "trace-A"),
        with_trace(otlp_tool_span("o2", 2_000, "get_weather", {"city": "Paris"}), "trace-B"),
    ]
    path = tmp_path / "two_traces.json"
    path.write_text(json.dumps({"resourceSpans": [{"scopeSpans": [{"spans": spans}]}]}))

    assert _run_check(make_args(path, detectors="repetition,cycle")) == 0


def test_text_report_shows_the_trace_when_there_is_one(capsys):
    assert _run_check(make_args(SAMPLE_TRACE_PATH, detectors="repetition")) == 1
    assert "trace: 0xe19c31b24d35bc69288cdd8be47a9fdb" in capsys.readouterr().out


def test_text_report_omits_the_trace_line_when_spans_have_no_trace_id(tmp_path, capsys):
    def tool_span(start_time):
        return {
            "context": {"span_id": "s"},
            "attributes": {
                "gen_ai.operation.name": "execute_tool",
                "gen_ai.tool.name": "get_weather",
                "gen_ai.tool.call.arguments": json.dumps({"city": "Paris"}),
            },
            "start_time": start_time,
        }

    path = tmp_path / "trace.json"
    path.write_text(json.dumps([tool_span("2026-01-01T00:00:00Z"), tool_span("2026-01-01T00:00:01Z")]))

    assert _run_check(make_args(path, detectors="repetition")) == 1
    assert "trace:" not in capsys.readouterr().out


def test_json_findings_include_trace_id(capsys):
    assert _run_check(make_args(SAMPLE_TRACE_PATH, detectors="repetition", fmt="json")) == 1
    finding = json.loads(capsys.readouterr().out)["repetition"][0]
    assert finding["trace_id"] == "0xe19c31b24d35bc69288cdd8be47a9fdb"


def test_github_format_emits_one_error_annotation_per_finding(capsys):
    args = make_args(SAMPLE_TRACE_PATH, detectors="repetition", fmt="github")
    assert _run_check(args) == 1

    (line,) = capsys.readouterr().out.splitlines()
    assert line.startswith(f"::error file={SAMPLE_TRACE_PATH},title=agent-trace-lint%3A repetition::")
    assert "'get_weather' called 2 times in a row" in line
    assert "spans: 0x3b53978b5fa5e455, 0x0ff8844d1bb1c7e1" in line


def test_github_format_names_the_file_for_each_of_several_traces(clean_trace_path, ping_pong_trace_path, capsys):
    args = make_args(clean_trace_path, SAMPLE_TRACE_PATH, ping_pong_trace_path,
                     detectors="repetition,cycle", fmt="github")
    assert _run_check(args) == 1

    lines = capsys.readouterr().out.splitlines()
    assert len(lines) == 2
    assert f"file={SAMPLE_TRACE_PATH}," in lines[0]
    assert f"file={ping_pong_trace_path}," in lines[1] and "agent-trace-lint%3A cycle" in lines[1]


def test_github_format_from_stdin_has_no_file_property(monkeypatch, capsys):
    monkeypatch.setattr(sys, "stdin", io.StringIO(SAMPLE_TRACE_PATH.read_text()))
    assert _run_check(make_args("-", detectors="repetition", fmt="github")) == 1
    assert capsys.readouterr().out.startswith("::error title=agent-trace-lint%3A repetition::")


def test_github_format_says_so_when_clean(clean_trace_path, capsys):
    assert _run_check(make_args(clean_trace_path, detectors="repetition", fmt="github")) == 0
    assert capsys.readouterr().out.strip() == "no issues detected"


def test_github_format_with_exit_zero_still_annotates(capsys):
    args = make_args(SAMPLE_TRACE_PATH, detectors="repetition", fmt="github", exit_zero=True)
    assert _run_check(args) == 0
    assert capsys.readouterr().out.startswith("::error ")


def test_annotation_escaping_keeps_a_finding_on_one_line():
    from agent_trace_lint.cli import _escape_annotation_data, _escape_annotation_property

    assert _escape_annotation_data("50% done\r\nnext line") == "50%25 done%0D%0Anext line"
    # Property values additionally can't contain the ":" and "," delimiters.
    assert _escape_annotation_property("a,b:c\nd") == "a%2Cb%3Ac%0Ad"


def test_mismatch_annotation_includes_score_and_escapes_the_reasoning():
    from agent_trace_lint.cli import _summarize

    finding = {
        "tool_name": "search_database",
        "span_ids": ["s1"],
        "trace_id": None,
        "score": 0.0291,
        "reasoning": "I am done.\nNothing else, 100% sure",
    }
    summary = _summarize("mismatch", finding)

    assert "'search_database' looks unrelated to its stated reasoning (score 0.0291)" in summary
    assert "trace:" not in summary
    assert summary.endswith("(spans: s1)")


NON_ASCII_TRACE = json.dumps([{"attributes": {"note": "café ☕"}}], ensure_ascii=False)


@pytest.mark.parametrize(
    "raw",
    [
        NON_ASCII_TRACE.encode("utf-8"),
        b"\xef\xbb\xbf" + NON_ASCII_TRACE.encode("utf-8"),
        NON_ASCII_TRACE.encode("utf-16"),  # little-endian with a BOM, as PowerShell writes it
        b"\xfe\xff" + NON_ASCII_TRACE.encode("utf-16-be"),
    ],
    ids=["utf-8", "utf-8-bom", "utf-16-le", "utf-16-be"],
)
def test_trace_files_decode_to_the_same_text_whatever_the_encoding(tmp_path, raw):
    from agent_trace_lint.cli import _load_trace

    path = tmp_path / "trace.json"
    path.write_bytes(raw)

    trace, error = _load_trace(str(path))

    assert error is None
    assert trace[0]["attributes"]["note"] == "café ☕"


def test_utf16_trace_file_is_checked_not_crashed_on(tmp_path):
    path = tmp_path / "trace.json"
    path.write_bytes(json.dumps([]).encode("utf-16"))
    assert _run_check(make_args(path, detectors="repetition")) == 0


def test_a_utf8_bom_is_tolerated(tmp_path):
    path = tmp_path / "trace.json"
    path.write_bytes(b"\xef\xbb\xbf" + json.dumps([]).encode("utf-8"))
    assert _run_check(make_args(path, detectors="repetition")) == 0


def test_undecodable_file_exits_2_with_a_clear_message(tmp_path, capsys):
    path = tmp_path / "latin1.json"
    path.write_bytes('[{"note": "café"}]'.encode("latin-1"))

    assert _run_check(make_args(path, detectors="repetition")) == 2
    err = capsys.readouterr().err
    assert "could not decode" in err and "UTF-8 or UTF-16" in err


def test_stdin_bytes_are_decoded_as_utf16_too():
    result = subprocess.run(
        [sys.executable, "-m", "agent_trace_lint.cli", "check", "-", "--detectors", "repetition"],
        input=json.dumps([]).encode("utf-16"),
        capture_output=True,
    )
    assert result.returncode == 0, result.stderr
    assert b"no issues detected" in result.stdout


def test_utf8_bom_on_text_stdin_is_stripped(monkeypatch):
    monkeypatch.setattr(sys, "stdin", io.StringIO("﻿" + json.dumps([])))
    assert _run_check(make_args("-", detectors="repetition")) == 0
