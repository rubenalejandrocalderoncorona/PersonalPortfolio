import argparse
import json
import sys

from agent_trace_lint.detectors.repetition import detect_repetition


def _print_report(findings):
    if not findings:
        print("no repetition detected")
        return

    print(f"found {len(findings)} repetition issue(s):\n")
    for finding in findings:
        span_ids = ", ".join(finding["span_ids"])
        print(f"  [REPEAT] '{finding['tool_name']}' called {finding['repeat_count']} times in a row")
        print(f"           spans: {span_ids}\n")


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

    findings = detect_repetition(trace)

    if args.format == "json":
        print(json.dumps(findings, indent=2))
    else:
        _print_report(findings)

    return 1 if findings else 0


def main():
    parser = argparse.ArgumentParser(prog="agent-trace-lint")
    subparsers = parser.add_subparsers(dest="command")

    subparsers.add_parser("hello")

    check_parser = subparsers.add_parser("check")
    check_parser.add_argument("trace_path", help="path to a trace JSON file")
    check_parser.add_argument("--format", choices=["text", "json"], default="text")

    args = parser.parse_args()

    if args.command == "hello":
        print("agent-trace-lint is alive")
    elif args.command == "check":
        sys.exit(_run_check(args))
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
