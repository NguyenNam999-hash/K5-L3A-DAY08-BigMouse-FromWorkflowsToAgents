"""Static checks that keep the demo view and generator node ids in sync."""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from tools.build_demo_ui import NODE_IDS  # noqa: E402


def test_diagram_ids_match_generator():
    app = (ROOT / "demo" / "app.js").read_text(encoding="utf-8")
    ids = set(re.findall(r'id: "([a-z_]+)"', app))
    for shape, nodes in NODE_IDS.items():
        missing = [node for node in nodes if node not in ids]
        assert not missing, (shape, missing)


def test_every_shape_has_a_graph_block():
    app = (ROOT / "demo" / "app.js").read_text(encoding="utf-8")
    for shape in NODE_IDS:
        assert re.search(rf'^\s*{shape}: \{{', app, flags=re.MULTILINE), shape
