import argparse
import json
import sys

from agent_trace_lint.detectors.mismatch import detect_mismatch
from agent_trace_lint.detectors.repetition import detect_repetition

DETECTORS = {
    "repetition": detect_repetition,
    "mismatch": detect_mismatch,
}


def _format_repetition(finding):
    span_ids = ", ".join(finding["span_ids"])
    return (
        f"  [REPEAT] '{finding['tool_name']}' called {finding['repeat_count']} times in a row\n"
        f"           spans: {span_ids}"
    )


def _format_mismatch(finding):
    span_ids = ", ".join(finding["span_ids"])
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


def _run_check(args):
    try:
        with open(args.trace_path) as f:
            trace = json.load(f)
    except FileNotFoundError:
        print(f"error: trace file not found: {args.trace_path}", file=sys.stderr)
        return 2
    except json.JSONDecodeError as exc:
        print(f"error: invalid JSON in {args.trace_path}: {exc}", file=sys.stderr)
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

    try:
        results = {name: DETECTORS[name](trace) for name in detector_names}
    except (TypeError, AttributeError) as exc:
        print(f"error: malformed trace in {args.trace_path}: {exc}", file=sys.stderr)
        return 2

    if args.format == "json":
        print(json.dumps(results, indent=2))
    else:
        _print_report(results)

    total = sum(len(findings) for findings in results.values())
    return 1 if total else 0


def main():
    parser = argparse.ArgumentParser(prog="agent-trace-lint")
    subparsers = parser.add_subparsers(dest="command")

    subparsers.add_parser("hello")

    check_parser = subparsers.add_parser("check")
    check_parser.add_argument("trace_path", help="path to a trace JSON file")
    check_parser.add_argument("--format", choices=["text", "json"], default="text")
    check_parser.add_argument(
        "--detectors",
        default="repetition,mismatch",
        help="comma-separated list of detectors to run (default: repetition,mismatch)",
    )

    args = parser.parse_args()

    if args.command == "hello":
        print("agent-trace-lint is alive")
    elif args.command == "check":
        sys.exit(_run_check(args))
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
