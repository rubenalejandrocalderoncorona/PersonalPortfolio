import argparse
import json
import sys
from importlib.metadata import PackageNotFoundError, version

from agent_trace_lint.detectors.mismatch import ModelLoadError, detect_mismatch
from agent_trace_lint.detectors.repetition import detect_repetition

try:
    __version__ = version("agent-trace-lint")
except PackageNotFoundError:
    __version__ = "unknown"

DETECTORS = {
    "repetition": detect_repetition,
    "mismatch": detect_mismatch,
}


def _format_span_ids(span_ids):
    return ", ".join("<unknown>" if sid is None else str(sid) for sid in span_ids)


def _format_repetition(finding):
    span_ids = _format_span_ids(finding["span_ids"])
    return (
        f"  [REPEAT] '{finding['tool_name']}' called {finding['repeat_count']} times in a row\n"
        f"           spans: {span_ids}"
    )


def _format_mismatch(finding):
    span_ids = _format_span_ids(finding["span_ids"])
    return (
        f"  [MISMATCH] '{finding['tool_name']}' looks unrelated to its stated reasoning "
        f"(score: {finding['score']})\n"
        f"           reasoning: {finding['reasoning']!r}\n"
        f"           spans: {span_ids}\n"
        f"           note: {finding['note']}"
    )


FORMATTERS = {
    "repetition": _format_repetition,
    "mismatch": _format_mismatch,
}


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


def _load_trace(path):
    """Return (trace, None) on success or (None, error message) on failure."""
    try:
        if path == "-":
            return json.load(sys.stdin), None
        with open(path) as f:
            return json.load(f), None
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
        except (TypeError, AttributeError) as exc:
            print(f"error: malformed trace in {source}: {exc}", file=sys.stderr)
            exit_code = 2
            continue

        all_results[path] = results
        if any(results.values()):
            exit_code = max(exit_code, 1)

    if args.format == "json":
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

    return exit_code


def main():
    parser = argparse.ArgumentParser(prog="agent-trace-lint")
    parser.add_argument(
        "--version", action="version", version=f"%(prog)s {__version__}"
    )
    subparsers = parser.add_subparsers(dest="command")

    subparsers.add_parser("hello")

    check_parser = subparsers.add_parser("check")
    check_parser.add_argument(
        "trace_paths",
        nargs="+",
        metavar="trace_path",
        help="path(s) to trace JSON file(s), or - to read a single trace from stdin",
    )
    check_parser.add_argument("--format", choices=["text", "json"], default="text")
    check_parser.add_argument(
        "--detectors",
        default="repetition,mismatch",
        help="comma-separated list of detectors to run (default: repetition,mismatch)",
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
