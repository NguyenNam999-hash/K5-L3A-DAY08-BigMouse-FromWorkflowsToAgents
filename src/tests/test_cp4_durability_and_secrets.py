"""CP4 Durability, Approval Binding and Secret Leakage Audit Tests.

Written for Lab 8 CP4 verification:
1. Crash recovery safety (Crash-safe resume, no double payments).
2. Approval binding to claim_id (Approval cross-claim tamper protection).
3. Secret & PII leakage prevention (Zero CANARY_SECRET_* in handoff/trace).
"""

from __future__ import annotations

import json
from pathlib import Path

from lab8.db import connect
from lab8.durability import (
    InjectedCrash,
    committed_audit_count,
    get_refund,
    issue_refund,
)
from lab8.handoff import sanitize
from lab8.tools import get_claim_view


def test_crash_recovery_after_effect_single_row(public_db: Path) -> None:
    """Crash at 'after_effect_before_checkpoint' must resume cleanly with exactly 1 row and 1 audit."""
    conn = connect(public_db)
    try:
        issue_refund(conn, "C-001", 35000, crash_at="after_effect_before_checkpoint")
        crashed = False
    except InjectedCrash:
        crashed = True
    assert crashed, "Expected InjectedCrash to be raised"

    # Before resume: effect is written, but checkpoint is missing
    assert get_refund(conn, "C-001") is not None
    checkpoint = conn.execute(
        "SELECT 1 FROM checkpoints WHERE claim_id = 'C-001' AND step = 'issue_refund'"
    ).fetchone()
    assert checkpoint is None, "Checkpoint should not exist before resume"

    # Resume refund
    resumed = issue_refund(conn, "C-001", 35000, crash_at=None)
    assert resumed["reason"] == "idempotent_replay"

    # Verify exactly 1 ledger row and 1 audit
    rows = conn.execute("SELECT COUNT(*) AS c FROM refund_ledger WHERE claim_id = 'C-001'").fetchone()["c"]
    assert rows == 1, "Must have exactly 1 ledger row after crash recovery"
    assert committed_audit_count(conn, "C-001") == 1
    conn.close()


def test_crash_before_effect_leaves_clean_state(public_db: Path) -> None:
    """Crash at 'before_effect' must not write any ghost ledger row, and retry succeeds."""
    conn = connect(public_db)
    try:
        issue_refund(conn, "C-001", 35000, crash_at="before_effect")
        crashed = False
    except InjectedCrash:
        crashed = True
    assert crashed, "Expected InjectedCrash to be raised"

    # Must be completely clean
    assert get_refund(conn, "C-001") is None
    assert committed_audit_count(conn, "C-001") == 0

    # Retrying issues refund successfully
    retry = issue_refund(conn, "C-001", 35000, crash_at=None)
    assert retry["ok"] is True
    assert retry["reason"] == "committed"
    assert committed_audit_count(conn, "C-001") == 1
    conn.close()


def test_cross_claim_approval_is_denied(public_db: Path) -> None:
    """Claim linking to an approval of a different claim must be denied with audit."""
    conn = connect(public_db)
    # Claim C-002 points to A-002. Try pointing C-002 to A-001 (which belongs to C-001).
    conn.execute("UPDATE claims SET approval_id = 'A-001' WHERE claim_id = 'C-002'")
    conn.commit()

    result = issue_refund(conn, "C-002", 35000)
    conn.close()

    assert result["ok"] is False
    assert result["reason"] == "approval_claim_mismatch"
    assert result["effect"] is None


def test_handoff_and_claim_view_filter_canary_secrets(public_db: Path) -> None:
    """Ensure parent secrets and canary tokens are stripped by get_claim_view and sanitize."""
    conn = connect(public_db)
    view = get_claim_view(conn, "C-001")
    conn.close()

    assert "parent_secret" not in view
    assert "CANARY_SECRET_" not in json.dumps(view)

    # Sanitize handoff payload
    dirty_payload = {
        "contract_version": "handoff.v1",
        "request_id": "REQ-AUDIT-01",
        "claim_id": "C-001",
        "principal_scope": "owner_order_only",
        "task": "investigate_claim",
        "facts": {"order_id": "O-107"},
        "allowed_tools": ["lookup_order"],
        "parent_secret": "CANARY_SECRET_LEAK_TEST",
        "raw_headers": {"Authorization": "Bearer CANARY_SECRET_LEAK_TEST"},
    }
    sanitized = sanitize(dirty_payload)
    dumped = json.dumps(sanitized)
    assert "parent_secret" not in sanitized
    assert "raw_headers" not in sanitized
    assert "CANARY_SECRET_" not in dumped
