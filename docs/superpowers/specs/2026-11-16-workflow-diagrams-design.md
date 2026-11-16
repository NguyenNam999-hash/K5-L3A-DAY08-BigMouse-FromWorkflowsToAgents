# Workflow diagrams — four architectures, all branches

Date: 2026-11-16
Status: awaiting approval

## Intent

A separate read-only reference page for the Lab 8 report. It shows the complete
claim-processing workflow for each architecture, not one run: every decision
point, branch condition, terminal status, ledger effect, and audit effect.

The existing `demo/index.html` answers "what happened on this run". This page
answers "what can happen at all, and why". It is standalone: no claims, seeds,
traces, or generated data.

## Goals

- One full flowchart per architecture: A workflow, B single ReAct, C
  orchestrator, D swarm reference.
- Every branch from the student shape code and the host write gate is visible
  and labelled with its condition.
- Each terminal node shows the exact `RunResult.status`, whether a ledger row
  is written, and which audit event is recorded.
- A shared host-gate section expands the one gate all four shapes call, because
  repeating that logic in four diagrams would hide it or bloat it.
- Readable in a browser and printable as a report appendix.
- No server, no network, no JS dependency.

## Non-goals

- No claim selection, seed selection, trace highlighting, or benchmark data.
- No regeneration script and no changes to `demo/data.js`.
- No customer reply text.
- No change to shape, host, config, data, or graded files.
- Not a live execution view.

## Anti-goals

- A diagram that implies the model chooses the amount or writes the ledger.
- Showing only the happy path.
- Colour as the only carrier of meaning.
- A page that needs Node, Mermaid, a CDN, or `fetch` to render.

## Constraints

- Static files: `demo/workflows.html`, `demo/workflows.css`. No JS required.
- Opens from `file://`.
- Reuses the existing editorial visual language (paper, ink, oxide, green,
  amber) with its own `:root` tokens so `demo/styles.css` is untouched.
- Branch text must match the code in `src/lab8/shapes/*.py`,
  `src/lab8/durability.py`, and `src/lab8/policy.py`.
- Status vocabulary is fixed: `resolved`, `needs_info`, `escalated`, `denied`,
  `failed`.

## Approach

A single scrollable page:

```
header: title, scope note, anchor nav A–D + host gate
section A: diagram + branch table + boundary note
section B: diagram + branch table + boundary note
section C: diagram + branch table + boundary note
section D: diagram + branch table + weakness note
section Host write gate: one expanded gate diagram + reason table
legend + footer
```

Each architecture diagram is a hand-authored inline SVG with a stable
`viewBox`, responsive width, `<title>`/`<desc>`, and text labels on every edge.
The branch table below it lists the same facts in text, so the diagram is not
the only source of meaning.

Chosen over two alternatives:

- **Extend the existing demo with a fifth tab** — rejected because the request
  is a separate UI, and the demo is run-centric while this page is
  architecture-centric.
- **Mermaid source rendered at view time** — rejected because it needs a CDN or
  a build step and adds no value for four fixed diagrams.

## Diagram content

Shared spine per shape, with shape-specific middle:

- A: claim → claim exists? → `order_id`? → lookup order → visible? → quote →
  amount > 0? → host gate → outcome.
- B: claim → claim exists? → ReAct loop (max 8, read tools only) → ready? →
  quote → amount > 0? → host gate → outcome. Loops back to itself.
- C: claim → claim exists? → `order_id`? → allowlist handoff → read-only
  investigators → visible? → quote → amount > 0? → host gate → outcome.
- D: claim → claim exists? → peer/parse calls → `order_id`? → handoff →
  investigators → override? (`seed % 5 == 0` and ticket delay differs from
  order row) → quote → amount > 0? → host gate → outcome. Override branch is
  marked as the reference weakness.

Terminal branches in every shape diagram:

| Condition | Status | Ledger | Audit |
| --- | --- | --- | --- |
| claim not found | `failed` | none | none |
| `order_id` missing | `needs_info` | none | none |
| order missing or not owned | `escalated` | none | none |
| quote 0 | `denied`, proposal 0 | none | none |
| host refuses positive quote | `denied`, proposal = full quote | none | `policy_denied` |
| retry with different amount | `failed` | old row kept | `amount_conflict` |
| injected crash | no result; retry required | depends on crash point | depends on crash point |
| host accepts | `resolved`, proposal = full quote | one row, capped amount | `refund_committed` |

## Host gate section

One expanded diagram and reason table for `issue_refund` + `authorize`:

- claim exists, `order_id` present, order owned by principal
- approval exists, belongs to this claim, status valid, not expired
- approval amount positive, quote positive
- per-order cap: subtract earlier refunds on the same order
- cap at approved amount and at paid amount
- deny reasons: `missing_order`, `outside_principal_scope`,
  `missing_approval`, `approval_claim_mismatch`, `approval_<status>`,
  `approval_expired`, `non_positive_amount`, `order_already_refunded`,
  `capped_to_zero`
- idempotent replay, amount conflict, and the three crash points

## Visual grammar

- Rectangle: code step.
- Rounded rectangle: model step.
- Diamond: decision.
- Double border: host gate.
- Cylinder: ledger.
- Pill: terminal status.
- Green = `resolved`, amber = `needs_info` / `escalated`, red = `denied` /
  `failed`, grey = neutral step.
- Every pill carries its status as text.

## Files

- `demo/workflows.html` — page and four SVG diagrams plus host gate.
- `demo/workflows.css` — tokens, layout, diagram states, print rules.
- `docs/superpowers/specs/2026-11-16-workflow-diagrams-design.md` — this file.

No other file changes.

## Verification

- Open `demo/workflows.html` from `file://`; all four diagrams and the host
  gate render with no console error and no network request.
- Browser zoom and a 1280 px and 768 px width keep text readable and avoid
  horizontal page scroll; wide diagrams scroll inside their own panel if
  needed.
- Print preview: each architecture starts on a fresh page; no diagram is cut
  off; colours remain distinguishable in grayscale because labels are text.
- Cross-check every branch against the four shape files, `durability.py`, and
  `policy.py`; statuses and reasons match exactly.
- `git status` shows only the three files above.
- Existing host gate `python -m pytest -q` from `src/` unchanged.
