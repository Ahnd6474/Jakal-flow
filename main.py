try:
    from jakal_flow.cli import main
except ModuleNotFoundError as exc:
    if exc.name != "jakal_flow":
        raise
    raise SystemExit("jakal_flow is not importable. Run `python -m jakal_flow` from an installed or editable environment.") from exc


if __name__ == "__main__":
    raise SystemExit(main())
