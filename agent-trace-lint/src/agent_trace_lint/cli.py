import argparse
import codecs
import json
import sys
from importlib.metadata import PackageNotFoundError, version

from agent_trace_lint.detectors.cycle import detect_cycle
from agent_trace_lint.detectors.mismatch import ModelLoadError, detect_mismatch
from agent_trace_lint.detectors.repetition import detect_repetition
from agent_trace_lint.spans import TraceFormatError, extract_spans

try:
    __version__ = version("agent-trace-lint")
except PackageNotFoundError:
    __version__ = "unknown"

DETECTORS = {
    "repetition": detect_repetition,
    "mismatch": detect_mismatch,
    "cycle": detect_cycle,
}

DEFAULT_DETECTORS = "repetition,mismatch"


def _format_span_ids(span_ids):
    return ", ".join("<unknown>" if sid is None else str(sid) for sid in span_ids)


def _trace_line(finding, indent):
    """A "trace: <id>" line (with trailing newline), or "" if there's no trace_id."""
    if finding.get("trace_id") is None:
        return ""
    return f"{' ' * indent}trace: {finding['trace_id']}\n"


def _format_repetition(finding):
    span_ids = _format_span_ids(finding["span_ids"])
    return (
        f"  [REPEAT] '{finding['tool_name']}' called {finding['repeat_count']} times in a row\n"
        f"{_trace_line(finding, 11)}"
        f"           spans: {span_ids}"
    )


def _format_mismatch(finding):
    span_ids = _format_span_ids(finding["span_ids"])
    return (
        f"  [MISMATCH] '{finding['tool_name']}' looks unrelated to its stated reasoning "
        f"(score: {finding['score']})\n"
        f"           reasoning: {finding['reasoning']!r}\n"
        f"{_trace_line(finding, 11)}"
        f"           spans: {span_ids}\n"
        f"           note: {finding['note']}"
    )


def _format_cycle(finding):
    span_ids = _format_span_ids(finding["span_ids"])
    sequence = " -> ".join(f"'{name}'" for name in finding["tool_names"])
    total_calls = len(finding["span_ids"])
    return (
        f"  [CYCLE] {sequence} repeated {finding['repeat_count']} times "
        f"({total_calls} calls)\n"
        f"{_trace_line(finding, 10)}"
        f"          spans: {span_ids}"
    )


FORMATTERS = {
    "repetition": _format_repetition,
    "mismatch": _format_mismatch,
    "cycle": _format_cycle,
}


def _escape_annotation_data(text):
    return text.replace("%", "%25").replace("\r", "%0D").replace("\n", "%0A")


def _escape_annotation_property(text):
    return _escape_annotation_data(text).replace(":", "%3A").replace(",", "%2C")


def _summarize(detector_name, finding):
    """One line describing a finding, for output with no room for multiple lines."""
    span_ids = _format_span_ids(finding["span_ids"])
    if detector_name == "repetition":
        text = f"'{finding['tool_name']}' called {finding['repeat_count']} times in a row"
    elif detector_name == "cycle":
        sequence = " -> ".join(f"'{name}'" for name in finding["tool_names"])
        text = f"{sequence} repeated {finding['repeat_count']} times ({len(finding['span_ids'])} calls)"
    else:
        text = (
            f"'{finding['tool_name']}' looks unrelated to its stated reasoning "
            f"(score {finding['score']}): {finding['reasoning']}"
        )
    where = f"spans: {span_ids}"
    if finding.get("trace_id") is not None:
        where = f"trace: {finding['trace_id']}, {where}"
    return f"{text} ({where})"


def _print_github_annotations(all_results):
    """Print findings as GitHub Actions workflow commands (::error ...)."""
    total = 0
    for path, results in all_results.items():
        for detector_name, findings in results.items():
            for finding in findings:
                total += 1
                properties = [] if path == "-" else [f"file={_escape_annotation_property(path)}"]
                properties.append(f"title={_escape_annotation_property('agent-trace-lint: ' + detector_name)}")
                message = _escape_annotation_data(_summarize(detector_name, finding))
                print(f"::error {','.join(properties)}::{message}")
    if total == 0:
        print("no issues detected")


def _print_report(results):
    total = sum(len(findings) for findings in results.values())
    if total == 0:
        print("no issues detected")
        return

    print(f"found {total} issue(s):\n")
    for detector_name, findings in results.items():
        for finding in findings:
            print(FORMATTERS[detector_name](finding))
            print()


def _parse_json_or_lines(text):
    """Parse one JSON document, or newline-delimited JSON objects.

    The OpenTelemetry Collector's file exporter writes one OTLP export per
    line (.jsonl), which isn't a single valid JSON document. If the whole
    text fails to parse but every non-empty line is a JSON object, return
    those objects as a list; otherwise re-raise the original error.
    """
    try:
        return json.loads(text)
    except json.JSONDecodeError as original:
        lines = [line for line in text.splitlines() if line.strip()]
        if len(lines) > 1:
            try:
                records = [json.loads(line) for line in lines]
            except json.JSONDecodeError:
                raise original from None
            if all(isinstance(r, dict) for r in records):
                return records
        raise


def _decode_trace_bytes(data):
    """Decode trace bytes: UTF-16 if it has a BOM (what PowerShell's `>`
    writes), otherwise UTF-8 with an optional BOM. Never the platform's
    default encoding, which would make the same file read differently per
    machine."""
    if data.startswith((codecs.BOM_UTF16_LE, codecs.BOM_UTF16_BE)):
        return data.decode("utf-16")
    return data.decode("utf-8-sig")


def _read_trace_text(path):
    if path != "-":
        with open(path, "rb") as f:
            return _decode_trace_bytes(f.read())
    # Real stdin has a byte buffer; a substituted text stream (tests) may not.
    buffer = getattr(sys.stdin, "buffer", None)
    if buffer is not None:
        return _decode_trace_bytes(buffer.read())
    return sys.stdin.read().removeprefix("\ufeff")


def _load_trace(path):
    """Return (trace, None) on success or (None, error message) on failure."""
    try:
        return _parse_json_or_lines(_read_trace_text(path)), None
    except UnicodeDecodeError as exc:
        source = "stdin" if path == "-" else path
        return None, f"could not decode {source} as UTF-8 or UTF-16 ({exc.reason})"
    except FileNotFoundError:
        return None, f"trace file not found: {path}"
    except OSError as exc:
        return None, f"could not read {path}: {exc.strerror or exc}"
    except json.JSONDecodeError as exc:
        source = "stdin" if path == "-" else path
        return None, f"invalid JSON in {source}: {exc}"


def _run_check(args):
    trace_paths = args.trace_paths
    if "-" in trace_paths and len(trace_paths) > 1:
        print("error: - (stdin) can't be combined with other trace paths", file=sys.stderr)
        return 2

    detector_names = [name.strip() for name in args.detectors.split(",") if name.strip()]
    if not detector_names:
        print("error: no detectors specified", file=sys.stderr)
        return 2

    unknown = [name for name in detector_names if name not in DETECTORS]
    if unknown:
        print(
            f"error: unknown detector(s): {', '.join(unknown)} (choices: {', '.join(DETECTORS)})",
            file=sys.stderr,
        )
        return 2

    if args.repeat_min < 2:
        print("error: --repeat-min must be at least 2", file=sys.stderr)
        return 2

    if args.cycle_repeats < 2:
        print("error: --cycle-repeats must be at least 2", file=sys.stderr)
        return 2

    if not (-1.0 <= args.mismatch_threshold <= 1.0):
        print(
            "error: --mismatch-threshold must be between -1.0 and 1.0 "
            "(it's a cosine similarity, not a percentage)",
            file=sys.stderr,
        )
        return 2

    detector_kwargs = {
        "mismatch": {"threshold": args.mismatch_threshold},
        "repetition": {"n": args.repeat_min},
        "cycle": {"min_repeats": args.cycle_repeats},
    }

    # Worst outcome across files wins: 2 (error) > 1 (findings) > 0 (clean).
    exit_code = 0
    all_results = {}
    for path in trace_paths:
        trace, error = _load_trace(path)
        if error:
            print(f"error: {error}", file=sys.stderr)
            exit_code = 2
            continue

        source = "stdin" if path == "-" else path
        try:
            results = {
                name: DETECTORS[name](trace, **detector_kwargs.get(name, {}))
                for name in detector_names
            }
        except ModelLoadError as exc:
            print(
                f"error: {exc} (use --detectors repetition to skip the mismatch detector)",
                file=sys.stderr,
            )
            return 2
        except (TraceFormatError, TypeError, AttributeError) as exc:
            print(f"error: malformed trace in {source}: {exc}", file=sys.stderr)
            exit_code = 2
            continue

        if not extract_spans(trace):
            # An empty export (exporter wrote nothing, wrong file) looks the
            # same as a healthy agent, so say that nothing was checked.
            print(f"warning: no spans found in {source}; nothing was checked", file=sys.stderr)

        all_results[path] = results
        if any(results.values()):
            exit_code = max(exit_code, 1)

    if args.format == "github":
        _print_github_annotations(all_results)
    elif args.format == "json":
        if len(trace_paths) == 1:
            if all_results:
                print(json.dumps(all_results[trace_paths[0]], indent=2))
        else:
            print(json.dumps(all_results, indent=2))
    else:
        for path, results in all_results.items():
            if len(trace_paths) > 1:
                print(f"== {path} ==")
            _print_report(results)

    if args.exit_zero and exit_code == 1:
        return 0
    return exit_code


def main():
    parser = argparse.ArgumentParser(prog="agent-trace-lint")
    parser.add_argument(
        "--version", action="version", version=f"%(prog)s {__version__}"
    )
    subparsers = parser.add_subparsers(dest="command")

    subparsers.add_parser("hello")

    check_parser = subparsers.add_parser(
        "check",
        epilog=(
            "exit codes: 0 clean, 1 findings reported (0 with --exit-zero), "
            "2 error (bad path, invalid JSON, bad flag value, or the embedding "
            "model failing to load) -- with multiple trace paths, the worst "
            "of these across all of them."
        ),
    )
    check_parser.add_argument(
        "trace_paths",
        nargs="+",
        metavar="trace_path",
        help="path(s) to trace JSON file(s), or - to read a single trace from stdin",
    )
    check_parser.add_argument(
        "--format",
        choices=["text", "json", "github"],
        default="text",
        help=(
            "output format (default: text); github prints GitHub Actions "
            "annotations so findings appear on the workflow run and PR checks"
        ),
    )
    check_parser.add_argument(
        "--detectors",
        default=DEFAULT_DETECTORS,
        help=(
            f"comma-separated list of detectors to run (default: {DEFAULT_DETECTORS}; "
            f"available: {', '.join(DETECTORS)} -- cycle is opt-in because a "
            "legitimate polling loop looks like one)"
        ),
    )
    check_parser.add_argument(
        "--exit-zero",
        action="store_true",
        help=(
            "exit 0 even when findings are reported (report-only mode, for "
            "rolling the linter out without failing builds); errors such as a "
            "bad path or invalid JSON still exit 2"
        ),
    )
    check_parser.add_argument(
        "--repeat-min",
        type=int,
        default=2,
        help=(
            "minimum length of a back-to-back identical tool-call run that "
            "counts as a repetition (default: 2) -- raise it if your agent "
            "legitimately retries a call once or twice before moving on"
        ),
    )
    check_parser.add_argument(
        "--cycle-repeats",
        type=int,
        default=3,
        help=(
            "how many times a short sequence of calls must repeat back to back "
            "for the cycle detector to flag it (default: 3, minimum 2)"
        ),
    )
    check_parser.add_argument(
        "--mismatch-threshold",
        type=float,
        default=0.3,
        help=(
            "cosine similarity below which the mismatch detector flags a step "
            "(default: 0.3) -- lower it to reduce false positives, raise it to "
            "catch more subtle mismatches"
        ),
    )

    # argparse's nargs="+" positional stops consuming trace_paths at the
    # first option it sees, so "check a.json --format json b.json" leaves
    # b.json stranded as an "unrecognized argument" even though it's a
    # perfectly valid trace path. parse_known_args() + manually reclaiming
    # non-flag leftovers lets trace paths and options be freely interleaved.
    args, extras = parser.parse_known_args()

    if args.command == "check":
        stray_flags = [e for e in extras if e != "-" and e.startswith("-")]
        if stray_flags:
            parser.error(f"unrecognized arguments: {' '.join(stray_flags)}")
        args.trace_paths.extend(extras)
    elif extras:
        parser.error(f"unrecognized arguments: {' '.join(extras)}")

    if args.command == "hello":
        print("agent-trace-lint is alive")
    elif args.command == "check":
        sys.exit(_run_check(args))
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
