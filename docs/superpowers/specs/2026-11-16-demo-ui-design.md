# Demo UI — four claim-processing shapes, one screen

Date: 2026-11-16
Status: awaiting approval

## Intent

A report/demo artifact for Lab 8. It shows, on one page, the four claim-processing
shapes, how each pipeline is wired, what happened on each public claim, and how the
shapes compare on the benchmark. It is used to explain the lab result — first to the
team, then in the group report and the demo slot.

The artifact reads existing evidence only: committed claims, reports, and a local
`src/traces/` tree from a prior benchmark run. It never runs a shape, never opens
the SQLite store, and never changes graded code.

## Goals

- Show a pipeline diagram for each of the four shapes (workflow, single, orchestrator,
  swarm) that reflects what the code actually does.
- For one selected run, light up the nodes the run visited, in trace order, with the
  payload of each trace event available on click.
- Let a viewer pick shape → claim → seed, and see that run's outcome next to the
  claim's expected outcome.
- Show all 14 public claims for the selected shape, with per-seed pass/fail chips.
- Show the benchmark comparison: pass rate, pass^5, seed variance, cost per success,
  mean steps, model calls, tool calls; plus crash-suite result.
- Work offline from `file://` with no server, no install, no network.
- Regenerate from the repo's own files with one command.

## Non-goals

- No live execution of shapes, no new benchmark run, no hidden-set evaluation.
- No editing of `lab8/`, `config/`, `data/`, tests, or reports.
- No customer-facing "reply" text. The repo stores no such text; the UI shows the
  structured `RunResult` fields and trace events instead and labels them "Outcome".
- No editor, no write actions, no auth, no analytics.
- Not a debugging tool for a running shape. It visualizes frozen evidence.

## Anti-goals

- Showing `parent_secret`, `raw_headers`, phone, address, `internal_note`, item
  names, `CANARY_*` strings, or any raw claim/order row.
- Any artifact that requires Node, a build step, or a running server to view.
- A diagram that implies the model decides money or writes the ledger.
- A screen that reads the same for every claim, hiding pass/fail differences.
- Touching graded shape files or protected files to make the demo easier.

## Constraints

- Python 3.11–3.13, standard library only; no new `requirements.txt` entries.
- Static bundle: `demo/index.html`, `demo/styles.css`, `demo/app.js`, `demo/data.js`.
  All data embedded in `data.js` as `window.DEMO_DATA` so `file://` works without
  `fetch`.
- Generator: `tools/build_demo_ui.py`, run from repo root:
  `python3 tools/build_demo_ui.py`.
- Inputs:
  - `src/data/public_claims.jsonl` — committed
  - `src/traces/R-{shape}-{claim}-s{seed}.json` — local only, gitignored; produced
    by a local benchmark run
  - `src/reports/benchmark.json` — committed (280 trials, per-shape metrics)
  - `src/reports/crash.json` — committed (20/20 scenarios)
- `demo/data.js` is the durable artifact for a fresh clone. The generator needs a
  local `src/traces/` tree; if it is missing it exits with a message telling the
  reader to run the benchmark command from `src/` first. It never force-adds
  traces or weakens `.gitignore`.
- Generator fails loudly if an input is missing or if the output bundle matches a
  leak marker.
- No shape code, host code, config, data, or test file is modified.
- Generated `demo/data.js` is committed so the artifact opens straight from the repo.
  The generator can always rebuild it.

## Approaches considered

**A. Static bundle, vanilla HTML/CSS/JS, generated `data.js`** — chosen.
Zero dependencies, opens from `file://`, regenerates with stdlib Python, no CI or
grader impact. Cost: diagrams are hand-authored SVG coordinates.

**B. Vite + React + Mermaid/D3** — rejected. Adds Node toolchain and `node_modules`
to a Python-only repo; group members would need Node to regenerate; build output
must be shipped anyway.

**C. Python HTTP server over the files** — rejected. Only works while the server
runs, cannot be attached to a report, and adds nothing because the trace set is
frozen.

## Data model

`demo/data.js` sets one object:

```js
window.DEMO_DATA = {
  generated_from: { claims: "...", traces: 280, benchmark: "...", crash: "..." },
  claims: [{
    claim_id, principal_id, order_id, approval_id, matrix_id, ticket,
    expected: { status, proposal_amount, refund_vnd, refund_count,
                audit_refund_committed, policy_denied, approval_ok }
  }],
  shapes: [{ id: "workflow", label: "A — Workflow", pass_rate, pass_5,
             seed_variance, cost_per_success_vnd, mean_steps, mean_model_calls,
             mean_tool_calls, total_simulated_cost_vnd, trials }],
  trials: [{ shape, claim_id, seed, passed, reason, status, cost_estimate,
             steps, model_calls, tool_calls, run_id }],
  traces: { "R-workflow-C-001-s11": { run_id, steps, events: [{kind, payload}] } },
  benchmark: { as_of, seeds, pricing, by_shape },   // full committed block
  crash: { count, passed, crash_safety, scenarios }
};
```

Dropped from `claims`: `parent_secret`, `raw_headers`, and
`expected.forbid_substrings`. No other input field is dropped; traces already pass
the lab's trace contract.

### What "actual" can mean here

Committed evidence has no ledger effect. `benchmark.json` trials carry only
`status`, `passed`, `reason`, cost, and step counts; `refund_effects`,
`committed_audit_count`, and `audit_refund_committed` exist only in the SQLite
store, which the generator does not open. So the UI must not print a measured
"refunded 35,000đ" line or compare actual against expected amounts.

The result card shows:

- **Status** — actual from the trial, expected from the claim. Status match is the
  PASS/MISMATCH verdict. This is the only measured outcome that exists offline.
- **Quote** — from the trace's `quote` event (the amount the shape proposed to the
  host, not the amount written). Absent for runs that never quoted.
- **Expected refund** — `expected.refund_vnd`, labelled "expected, not measured".
  Cap cases (T08 35,000 → 20,000, T14 150,000 → 120,000) show this label plainly;
  the UI never claims it verified the cap.
- **Pass reason** — trial `reason` (`ok`, `amount_mismatch`, …), plus cost, steps,
  model calls, tool calls.

This is a deliberate limit of a committed-evidence demo, not an omission to be
patched with re-implemented policy logic.

Generator leak guard: walk every **string value** in the bundle (never numbers, so
metric floats cannot trip it). Reject `CANARY_SECRET_`, `CANARY_INTERNAL_`,
`parent_secret`, `raw_headers`, `Authorization`, `Bearer `, and `\b0\d{9}\b`.
Abort with the offending marker and write no file.

Event payload policy: traces are already produced through allowlisted views
(`get_claim_view`, `lookup_order`, sanitized handoff) and pass the lab's trace
contract. The UI renders their payloads verbatim in the event detail; the guard
above is the second line of defence. An escalated run may name only the requested
`order_id` and a reason such as `outside_principal_scope`; it never carries phone,
address, item name, or internal note. Those fields exist only in the world-state
fixture and are never read by the generator.

## Per-shape diagrams

Each shape gets a hand-authored SVG graph with stable node ids. Edges are the
possible paths. Trace events map to node ids; a run's visited set plus terminal
status drives styling.

Shared visual grammar: rectangle = code step, rounded rectangle = model step,
diamond = branch, cylinder = host/ledger, red = denied/failed, green = resolved,
amber = needs_info/escalated, grey = not visited.

| Shape | Nodes (in flow order) | Event → node |
| --- | --- | --- |
| A workflow | claim → order_id? → lookup_order → visible? → quote → amount>0? → host check → ledger → outcome | `lookup_order` → lookup_order, `quote` → quote, `decision` → order_id?, `error` → claim, `crash` → host check |
| B single | claim → ReAct loop (model decide, read tool) → ready? → quote → amount>0? → host check → ledger → outcome | `react` → react loop, `quote` → quote, `decision` → claim, `error` → claim, `crash` → host check |
| C orchestrator | claim → order_id? → handoff → investigator (read-only) → visible? → quote → amount>0? → host check → ledger → outcome | `handoff` → handoff, `investigator` → investigator, `quote` → quote, `decision` → order_id?, `error` → claim, `crash` → host check |
| D swarm | claim → peer/parse (model) → order_id? → handoff → investigator → model_override? → quote → amount>0? → host check → ledger → outcome | `handoff` → handoff, `investigator` → investigator, `model_override` → model_override?, `quote` → quote, `decision` → order_id?, `error` → claim, `crash` → host check |

Terminal node colour comes from the trial status, not from the last event: a run
whose quote is 35,000 can still end `denied` (host refusal) and must look denied.

Branch and host nodes have no trace events in the committed set, so the visited set
is derived deterministically from events + status. One rule per shape, applied in
order:

1. `claim` is always visited.
2. `decision` with `needs_info` → visits the `order_id?` branch and the
   `needs_info` outcome; stop.
3. `lookup_order` / `react` / `handoff` / `investigator` visit their own node.
4. `lookup_order` with `visible: false` or `investigator.lookup_order.visible:
   false` → visits `visible?` and the `escalated` outcome; stop.
5. `react` with `status != "ready"` → visits `ready?` and that outcome; stop.
6. A `quote` event visits the `quote` node. `amount_vnd > 0` also visits
   `amount>0?`.
7. `status === "resolved"` → visits `host check`, `ledger`, `outcome`.
8. `status === "denied"` or `"failed"` with a positive quote → visits `host check`
   and `outcome` only; the ledger node stays grey.
9. `status === "denied"` with no positive quote → visits `amount>0?` and `outcome`.
10. `error` → `claim` + `outcome`; `crash` (not present in the committed set) →
    `host check`.

Unvisited nodes stay grey. Every visited node also gets a text state in the step
list, so colour is never the only signal. Nodes with no trace event of their own
are still selectable; their detail panel explains that the state was inferred from
status.

A note line under each diagram states the lab boundary: money and the ledger are
host code; the model only reads and drafts. The swarm diagram marks
`model_override?` as the reference weakness (seed divisible by 5).

## Screen

One page, report-friendly, light theme, dense data typography. Top bar: title,
"read-only demo · data as of 2026-11-15", shape tabs A–D with pass rate.

```
┌──────────────────────────────────────────────────────────────────────────┐
│ LogiX-VN · Claim processing shapes        read-only demo · as of 15/11   │
│ [A Workflow 100%] [B Single 100%] [C Orchestrator 100%] [D Swarm 80%]    │
├──────────────────────────────┬───────────────────────────────────────────┤
│ Pipeline diagram (SVG)       │ C-001 · T01 · seed 11                     │
│  claim → order → quote →     │ ticket: "Đơn O-107 giao trễ 4 ngày..."    │
│  host check → ledger         │ actual resolved / expected resolved  PASS │
│  [step list / event log]     │ quote 35,000đ · expected refund 35,000đ   │
│                              │ (expected, not measured)                  │
│                              │ cost 30đ · 2 steps · 0 model · 3 tool     │
├──────────────────────────────┴───────────────────────────────────────────┤
│ Claims — 14 rows, per-seed chips  [11][22][33][44][55]                    │
│ T01 C-001  resolved 35,000   ● ● ● ● ●     open run →                     │
│ T02 C-002  denied        0   ● ● ● ● ●                                   │
│ ...                                                                       │
├──────────────────────────────────────────────────────────────────────────┤
│ Compare shapes: pass rate · pass^5 · variance · cost/success · steps      │
│ Crash safety 20/20                                                        │
└──────────────────────────────────────────────────────────────────────────┘
```

Behaviour:

- Default selection: workflow shape, first claim, seed 11.
- Clicking a shape tab re-renders its diagram and claim table, keeping the claim
  when that claim exists for the shape.
- Clicking a claim row selects its seed 11 run; clicking a seed chip selects that
  seed. Selected claim+seed drives diagram, event list, and result card.
- Clicking a diagram node filters/highlights its trace event in the event list; the
  detail panel shows the event JSON payload (already sanitized). Nodes with no
  trace event say "state inferred from run status".
- Result card compares expected vs actual status only; mismatch is a red
  "MISMATCH", match is green "PASS". The quote and expected refund sit beside it,
  clearly labelled as proposal and expectation.
- Compare panel shows per-shape bars for pass rate and cost per success, with
  numeric labels. Crash card shows `20/20` and scenario counts by crash point.
- No hidden state beyond the current tab/claim/seed; no persistence.
- Keyboard: tabs and seed chips focusable; Enter/Space activates. Diagram nodes
  are focusable with the same behaviour. Colour is never the only signal; every
  status is also written as text.
- Responsive: two-column on wide screens, stacked below 1000px. Print stylesheet
  hides tabs and shows the selected shape only, so a screenshot/PDF is clean.

## Files

- `tools/build_demo_ui.py` — stdlib generator with leak guard.
- `demo/index.html` — shell, tabs, containers, no inline data logic.
- `demo/styles.css` — layout, tokens, diagram states, print rules.
- `demo/app.js` — shape graph definitions, selection state, rendering, event mapping.
- `demo/data.js` — generated; committed.
- `docs/superpowers/specs/2026-11-16-demo-ui-design.md` — this document.

No other file changes. No `requirements.txt` change.

## Verification

- With local traces present: `python3 tools/build_demo_ui.py` → writes
  `demo/data.js`, prints counts (14 claims, 280 trials, 280 traces) and `0 leaks`.
- With `src/traces/` absent: generator exits non-zero with the benchmark command
  to run first, and leaves `demo/data.js` untouched.
- Leak guard test: a marker string planted in a scratch input copy makes the
  generator exit non-zero (manual check, not committed).
- Open `demo/index.html` from `file://` and check: four tabs, diagram per shape,
  claim table per shape, seed switching, status PASS/MISMATCH, quote and expected
  refund labels, compare panel, print view.
- `git status` shows only the new `tools/`, `demo/`, and spec file; no protected
  file changed.
- Existing gates unchanged: `python -m pytest -q` from `src/` still green (not a
  substitute for the manual UI check).

## Decisions left to the builder

- Exact SVG coordinates, canvas size, and edge routing per shape.
- Visual tokens (font stack, colour values, spacing scale) inside the light theme.
- Whether the event list shows every event or only those mapped to nodes; default is
  every event, in order, with mapped ones tagged.
- Label copy in English or Vietnamese; default is English labels with the original
  Vietnamese ticket text shown verbatim.
- Bar-chart implementation (CSS bars vs inline SVG); either is fine.

## Build order

1. Generator + data model + leak guard.
2. Page shell, tabs, shape/claim/seed selection.
3. Four SVG diagrams + event mapping and node states.
4. Claim table, result card, event detail.
5. Compare + crash panel.
6. Manual browser pass and print check.
