"""Build the static demo bundle from claims, benchmark reports, and traces.

Run from the repo root:

    python3 tools/build_demo_ui.py

Writes demo/data.js. Reads existing evidence only; never runs a shape or opens
the SQLite store.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

CLAIM_FIELDS = (
    "claim_id",
    "principal_id",
    "order_id",
    "approval_id",
    "matrix_id",
    "ticket",
)
EXPECTED_FIELDS = (
    "status",
    "proposal_amount",
    "refund_vnd",
    "refund_count",
    "audit_refund_committed",
    "policy_denied",
    "approval_ok",
)
FORBIDDEN_MARKERS = (
    "CANARY_SECRET_",
    "CANARY_INTERNAL_",
    "parent_secret",
    "raw_headers",
    "Authorization",
    "Bearer ",
)
PHONE_RE = re.compile(r"\b0\d{9}\b")

NODE_IDS: dict[str, list[str]] = {
    "workflow": [
        "claim",
        "order_id",
        "lookup_order",
        "visible",
        "quote",
        "amount_positive",
        "host_check",
        "ledger",
        "outcome",
    ],
    "single": [
        "claim",
        "react",
        "ready",
        "quote",
        "amount_positive",
        "host_check",
        "ledger",
        "outcome",
    ],
    "orchestrator": [
        "claim",
        "order_id",
        "handoff",
        "investigator",
        "visible",
        "quote",
        "amount_positive",
        "host_check",
        "ledger",
        "outcome",
    ],
    "swarm": [
        "claim",
        "peer_parse",
        "order_id",
        "handoff",
        "investigator",
        "model_override",
        "quote",
        "amount_positive",
        "host_check",
        "ledger",
        "outcome",
    ],
}


@dataclass(frozen=True)
class RepoPaths:
    root: Path = Path(__file__).resolve().parents[1]

    @property
    def claims(self) -> Path:
        return self.root / "src" / "data" / "public_claims.jsonl"

    @property
    def benchmark(self) -> Path:
        return self.root / "src" / "reports" / "benchmark.json"

    @property
    def crash(self) -> Path:
        return self.root / "src" / "reports" / "crash.json"

    @property
    def traces(self) -> Path:
        return self.root / "src" / "traces"

    @property
    def output(self) -> Path:
        return self.root / "demo" / "data.js"


def _read_json(path: Path, label: str) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise SystemExit(f"missing {label}: {path}") from exc


def _read_jsonl(path: Path) -> list[dict[str, Any]]:
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except FileNotFoundError as exc:
        raise SystemExit(f"missing claims file: {path}") from exc
    return [json.loads(line) for line in lines if line.strip()]


def sanitize_claim(row: dict[str, Any]) -> dict[str, Any]:
    claim = {key: row.get(key) for key in CLAIM_FIELDS}
    expected = row.get("expected") or {}
    claim["expected"] = {key: expected.get(key) for key in EXPECTED_FIELDS}
    return claim


def _ordered(shape: str, visited: set[str]) -> list[str]:
    return [node_id for node_id in NODE_IDS[shape] if node_id in visited]


def visited_nodes(shape: str, status: str, events: list[dict[str, Any]]) -> list[str]:
    if shape not in NODE_IDS:
        raise SystemExit(f"unknown shape: {shape}")

    visited = {"claim", "outcome"}
    if shape == "swarm":
        visited.add("peer_parse")

    for event in events:
        kind = event.get("kind")
        payload = event.get("payload") or {}

        if kind == "decision":
            visited.add("order_id")
            if status == "needs_info":
                return _ordered(shape, visited)

        if kind in ("lookup_order", "react", "handoff", "investigator", "model_override"):
            visited.add(kind)
            if kind in ("lookup_order", "handoff", "react") and "order_id" in NODE_IDS[shape]:
                visited.add("order_id")

        if kind in ("lookup_order", "investigator"):
            visited.add("visible")
            if kind == "lookup_order":
                visible = payload.get("visible")
            else:
                visible = (payload.get("lookup_order") or {}).get("visible")
            if visible is False and status == "escalated":
                return _ordered(shape, visited)

        if kind == "react":
            visited.add("ready")

        if kind == "quote":
            visited.add("quote")
            visited.add("amount_positive")

    if "quote" not in visited:
        return _ordered(shape, visited)

    positive_quote = any(
        int((event.get("payload") or {}).get("amount_vnd") or 0) > 0
        for event in events
        if event.get("kind") == "quote"
    )
    if status == "resolved":
        visited.update(("host_check", "ledger"))
    elif status in ("denied", "failed") and positive_quote:
        visited.add("host_check")

    return _ordered(shape, visited)


def _iter_strings(value: Any):
    if isinstance(value, str):
        yield value
    elif isinstance(value, dict):
        for item in value.values():
            yield from _iter_strings(item)
    elif isinstance(value, (list, tuple)):
        for item in value:
            yield from _iter_strings(item)


def assert_no_leaks(bundle: dict[str, Any]) -> None:
    for text in _iter_strings(bundle):
        for marker in FORBIDDEN_MARKERS:
            if marker in text:
                raise SystemExit(f"leak guard: forbidden marker {marker} in bundle")
        if PHONE_RE.search(text):
            raise SystemExit("leak guard: phone-like string in bundle")


def _load_trace(traces_dir: Path, run_id: str) -> dict[str, Any]:
    path = traces_dir / f"{run_id}.json"
    if not traces_dir.is_dir():
        raise SystemExit(
            f"missing trace for {run_id}: run the benchmark from src/ first "
            "(python -m lab8.benchmark --shapes workflow,single,orchestrator,swarm "
            "--cases data/public_claims.jsonl --seeds 11,22,33,44,55 "
            "--out reports/benchmark.json)"
        )
    if not path.is_file():
        raise SystemExit(
            f"missing trace for {run_id}: run the benchmark from src/ first "
            "(python -m lab8.benchmark --shapes workflow,single,orchestrator,swarm "
            "--cases data/public_claims.jsonl --seeds 11,22,33,44,55 "
            "--out reports/benchmark.json)"
        )
    return _read_json(path, "trace")


def load_bundle(paths: RepoPaths) -> dict[str, Any]:
    claims = [sanitize_claim(row) for row in _read_jsonl(paths.claims)]
    benchmark = _read_json(paths.benchmark, "benchmark report")
    crash = _read_json(paths.crash, "crash report")
    trials = benchmark.get("trials") or []

    traces: dict[str, Any] = {}
    for trial in trials:
        run_id = trial["run_id"]
        trace = _load_trace(paths.traces, run_id)
        events = trace.get("events") or []
        quotes = [event for event in events if event.get("kind") == "quote"]
        quote_vnd = None
        if quotes:
            quote_vnd = int((quotes[-1].get("payload") or {}).get("amount_vnd") or 0)
        traces[run_id] = {
            "run_id": trace.get("run_id", run_id),
            "steps": trace.get("steps", len(events)),
            "events": events,
            "quote_vnd": quote_vnd,
            "visited": visited_nodes(trial.get("shape", ""), trial.get("status", "failed"), events),
        }

    return {
        "generated_from": {
            "claims": str(paths.claims.relative_to(paths.root)),
            "benchmark": str(paths.benchmark.relative_to(paths.root)),
            "traces": str(paths.traces.relative_to(paths.root)),
            "trace_count": len(traces),
            "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        },
        "claims": claims,
        "shapes": benchmark.get("by_shape") or {},
        "trials": trials,
        "traces": traces,
        "benchmark": benchmark,
        "crash": crash,
    }


def render_data_js(bundle: dict[str, Any]) -> str:
    return "window.DEMO_DATA = " + json.dumps(bundle, ensure_ascii=False, indent=1) + ";\n"


def write_bundle(paths: RepoPaths) -> Path:
    bundle = load_bundle(paths)
    assert_no_leaks(bundle)
    paths.output.parent.mkdir(parents=True, exist_ok=True)
    paths.output.write_text(render_data_js(bundle), encoding="utf-8")
    return paths.output


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Build demo/data.js from existing evidence")
    parser.add_argument("--root", type=Path, default=RepoPaths().root)
    args = parser.parse_args(argv)

    paths = RepoPaths(root=args.root.resolve())
    bundle = load_bundle(paths)
    assert_no_leaks(bundle)
    paths.output.parent.mkdir(parents=True, exist_ok=True)
    paths.output.write_text(render_data_js(bundle), encoding="utf-8")
    print(
        f"{len(bundle['claims'])} claims, {len(bundle['trials'])} trials, "
        f"{len(bundle['traces'])} traces, 0 leaks -> {paths.output}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
