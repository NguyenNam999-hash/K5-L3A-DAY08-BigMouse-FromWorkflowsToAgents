"""Tests for the demo data generator. Run from the repo root."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from tools.build_demo_ui import (  # noqa: E402
    RepoPaths,
    assert_no_leaks,
    load_bundle,
    write_bundle,
)


def make_paths(tmp_path: Path) -> RepoPaths:
    paths = RepoPaths(root=tmp_path)
    paths.claims.parent.mkdir(parents=True)
    claim = {
        "claim_id": "C-001",
        "principal_id": "P-100",
        "order_id": "O-107",
        "ticket": "Đơn O-107 giao trễ 4 ngày.",
        "parent_secret": "CANARY_SECRET_PARENT_C-001",
        "raw_headers": {"Authorization": "Bearer CANARY_SECRET_PARENT_C-001"},
        "approval_id": "A-001",
        "matrix_id": "T01",
        "expected": {
            "status": "resolved",
            "proposal_amount": 35000,
            "refund_vnd": 35000,
            "refund_count": 1,
            "audit_refund_committed": 1,
            "policy_denied": False,
            "approval_ok": True,
            "forbid_substrings": ["CANARY_SECRET_PARENT_C-001"],
        },
    }
    paths.claims.write_text(json.dumps(claim, ensure_ascii=False) + "\n", encoding="utf-8")

    benchmark = {
        "controlled_variables": {"as_of": "2026-11-15", "seeds": [11]},
        "by_shape": {"workflow": {"pass_rate": 1.0, "cost_note": "simulated_not_real_api_price"}},
        "trials": [
            {
                "shape": "workflow",
                "claim_id": "C-001",
                "seed": 11,
                "passed": True,
                "reason": "ok",
                "cost_estimate": 30.0,
                "steps": 2,
                "model_calls": 0,
                "tool_calls": 3,
                "run_id": "R-workflow-C-001-s11",
                "status": "resolved",
            }
        ],
    }
    paths.benchmark.parent.mkdir(parents=True, exist_ok=True)
    paths.benchmark.write_text(json.dumps(benchmark), encoding="utf-8")
    paths.crash.write_text(
        json.dumps({"count": 1, "passed": 1, "crash_safety": "1/1", "scenarios": []}),
        encoding="utf-8",
    )

    trace = {
        "run_id": "R-workflow-C-001-s11",
        "steps": 2,
        "events": [
            {"kind": "lookup_order", "payload": {"visible": True}},
            {"kind": "quote", "payload": {"amount_vnd": 35000}},
        ],
    }
    paths.traces.mkdir(parents=True)
    (paths.traces / "R-workflow-C-001-s11.json").write_text(json.dumps(trace), encoding="utf-8")
    return paths


def test_sanitize_claim_drops_secret_and_headers(tmp_path):
    paths = make_paths(tmp_path)
    claim = load_bundle(paths)["claims"][0]
    assert "parent_secret" not in claim
    assert "raw_headers" not in claim
    assert "forbid_substrings" not in claim["expected"]


def test_bundle_has_expected_sections(tmp_path):
    bundle = load_bundle(make_paths(tmp_path))
    assert set(bundle) == {
        "generated_from",
        "claims",
        "shapes",
        "trials",
        "traces",
        "benchmark",
        "crash",
    }


def test_trial_without_trace_raises(tmp_path):
    paths = make_paths(tmp_path)
    (paths.traces / "R-workflow-C-001-s11.json").unlink()
    with pytest.raises(SystemExit, match="trace"):
        load_bundle(paths)


def test_leak_guard_rejects_canary():
    with pytest.raises(SystemExit, match="CANARY_SECRET_"):
        assert_no_leaks({"x": ["ok", "CANARY_SECRET_PARENT_C-001"]})


def test_leak_guard_ignores_metric_floats():
    assert_no_leaks({"cost": 27.857142857142858, "variance": 0.0008163265306122443})


def test_leak_guard_rejects_phone_string():
    with pytest.raises(SystemExit, match="phone"):
        assert_no_leaks({"x": "0901000107"})


def test_render_and_write(tmp_path):
    paths = make_paths(tmp_path)
    out = write_bundle(paths)
    text = out.read_text(encoding="utf-8")
    assert text.startswith("window.DEMO_DATA = ")
    assert "CANARY_SECRET" not in text
