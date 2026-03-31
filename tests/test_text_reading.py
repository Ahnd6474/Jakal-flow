from __future__ import annotations

from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from jakal_flow.utils import load_dotenv, read_json, read_text


def test_read_text_falls_back_for_invalid_utf8(tmp_path: Path) -> None:
    path = tmp_path / "legacy.txt"
    path.write_bytes(b"hello \xa4 world")

    text = read_text(path)

    assert "hello" in text
    assert "world" in text


def test_read_json_returns_default_for_invalid_utf8(tmp_path: Path) -> None:
    path = tmp_path / "legacy.json"
    path.write_bytes(b'{"value": "\xa4"}')

    payload = read_json(path, default={})

    assert isinstance(payload, dict)
    assert "value" in payload


def test_load_dotenv_falls_back_for_invalid_utf8(tmp_path: Path) -> None:
    path = tmp_path / ".env"
    path.write_bytes(b"VALID=ok\nBROKEN=\xa4\n")

    values = load_dotenv(path)

    assert values["VALID"] == "ok"
    assert "BROKEN" in values
