# CP1 — Setup and contract notes

Verified on 2026-11-16 (Asia/Saigon) for BigMouse, class L3A.
Member details and role assignments remain blank at the user's request;
the team still needs to fill them in before submission. These results cover
this workstation only; each teammate must run the setup on their own machine.

## Environment and reproduction

- Windows AMD64, Python 3.11.9.
- Local virtual environment: `src/.venv/` (ignored by Git).
- Installed from `src/requirements.txt`: pytest 8.4.2 and PyYAML 6.0.3.
- No model API key is required; the lab uses seeded MockLLM.

Run from `src/` in PowerShell. Calling the environment's Python directly
avoids needing to activate a PowerShell script:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m lab8.smoke
.\.venv\Scripts\python.exe -m pytest -q
.\.venv\Scripts\python.exe -m pytest -q -m student -o addopts= --tb=no
```

| Check | Observed result |
| --- | --- |
| Smoke | `lab8.smoke pass`; swarm C-001 refund 35000; trace clean |
| Host gate | `54 passed, 248 deselected` |
| Student baseline | `186 failed, 62 passed, 54 deselected` |

The student command exits with code 1 at CP1: workflow, single, and
orchestrator each have 62 failing tests because they are starter stubs.
The 62 swarm tests pass. This matches the CP1 baseline in
[CHECKPOINTS.md](../../CHECKPOINTS.md). The current checkout has 54 host
tests; `src/README.md` describes an older baseline of 52.

## Contract review

Reviewed [business rules](../../docs/business_rules.md),
[output and trace contracts](../../docs/contracts.md), and the
[reference swarm](../../src/lab8/shapes/swarm_reference.py).

- **Code determines money.** Use `compute_compensation` with authoritative
  order data and current policies effective on or before 2026-11-15, the
  lab's fixed business date. Eligible shipping delay is at least three days
  on a delivered order. Verified damage uses the damage policy cap and
  amount paid. When both apply, choose the larger amount rather than sum.
  MockLLM can interpret text or draft replies; it cannot authorize money.
- **Ticket text is untrusted data.** Do not obey embedded instructions or
  replace order facts with claimed delays. Do not infer a missing order ID
  from ticket text. The reference swarm deliberately violates the delay
  rule when `seed % 5 == 0`; the student shapes must not copy that weakness.
- **Host owns writes.** For a positive quote, call
  `durability.issue_refund` with the full quote. The host checks ownership,
  claim-bound approval, amount caps, prior refunds for the order, and
  idempotency (`refund:{claim_id}`). It subtracts prior refunds itself:
  entitlement 150000 after a prior refund of 30000 means a new effect of
  120000, while `proposal_amount` stays 150000.
- **Retries and crashes must preserve one effect.** Forward `crash_at`
  and let `InjectedCrash` propagate for the crash harness. Other execution
  paths should return a valid result. Repeating a claim must not create a
  second refund or committed audit; a conflicting amount keeps the old
  effect and returns failure.
- **Use `finish()` for every result branch.** It derives refund effects and
  committed audit counts from the ledger, writes the trace, and records
  budget. `proposal_amount` is an integer VND quote, even when the host
  denies or caps a positive proposal.

| Allowed status | Meaning |
| --- | --- |
| `resolved` | Host accepted a positive quote |
| `needs_info` | Missing structured `order_id`; proposal 0 |
| `escalated` | Order missing or inaccessible to the principal; proposal 0 |
| `denied` | Zero entitlement, or host refused a positive quote |
| `failed` | Unknown claim or conflicting committed amount |

A positive quote denied by the host needs a `policy_denied` audit, so the
shape must actually call the host. A zero quote is denied without calling
`issue_refund`.

Trace files must be written during the current run and contain a matching
`run_id` plus an `events` list. Use allowlisted tool views and sanitized
handoffs; never log raw claim/order rows, secrets, headers, phone numbers,
addresses, internal notes, or item names, including to stdout. Missing,
stale, malformed, or mismatched traces fail grading.

## Handoff to the team

CP2 implements the three stub shapes; CP3 verifies handoffs and crash/retry
behavior. Keep the host gate green. Fill member roles in `TEAM.md` when
available. Benchmark, crash-suite submission artifacts, architecture
selection, and final reports belong to later checkpoints.

AI assistance: Codex helped set up the environment, review the CP1
references, and write these notes. Validation used the actual smoke,
host, and student commands above; no benchmark results were invented.
