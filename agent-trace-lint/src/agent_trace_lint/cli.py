import argparse


def main():
    parser = argparse.ArgumentParser(prog="agent-trace-lint")
    subparsers = parser.add_subparsers(dest="command")

    subparsers.add_parser("hello")

    args = parser.parse_args()

    if args.command == "hello":
        print("agent-trace-lint is alive")
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
