from __future__ import annotations

from pathlib import Path
from pkgutil import extend_path

__path__ = extend_path(__path__, __name__)
_alias_path = Path(__file__).resolve().parents[1] / "jakal_flow"
if str(_alias_path) not in __path__:
    __path__.append(str(_alias_path))
