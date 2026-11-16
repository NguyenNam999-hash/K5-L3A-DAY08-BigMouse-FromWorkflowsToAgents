# Workflow Diagrams Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone reference page with one complete branch diagram per architecture and one expanded host write gate.

**Architecture:** Two static files. `demo/workflows.html` holds the page, four inline SVG flowcharts, the shared host-gate SVG, and text branch tables. `demo/workflows.css` holds tokens, diagram styling, responsive rules, and print rules. No JavaScript, no data bundle, no network.

**Tech Stack:** HTML5, inline SVG, CSS.

**Spec:** `docs/superpowers/specs/2026-11-16-workflow-diagrams-design.md`

## Global Constraints

- Run from the repo root. Do not edit `src/lab8/`, `src/config/`, `src/data/`, `src/tests/`, `src/reports/`, or `demo/data.js`.
- Only create `demo/workflows.html` and `demo/workflows.css`; the spec file already exists.
- Open from `file://` with no server, no network request, no external font, no CDN, no `<script>`.
- Status vocabulary exactly: `resolved`, `needs_info`, `escalated`, `denied`, `failed`.
- Money and ledger stay host code. The model reads and drafts only.
- Every diagram edge carries a text condition. Every terminal carries its status as text.
- No colour-only meaning; each coloured node or pill also names its state.
- English UI labels. Keep Vietnamese fixture text out of this page.
- Print: A4 landscape, one architecture per page, no diagram cut off.

## Review Focus

- Zero-quote path: the page must show `denied` with proposal 0 and no host call, not `policy_denied`.
- Positive quote refused by host: must show `denied`, proposal = full quote, audit `policy_denied`.
- Single ReAct step cap: the loop can exhaust 8 steps and end `failed` / `step_cap`; the B diagram and table must show this exit.
- Swarm override: `seed % 5 == 0` plus a ticket delay that disagrees with the order row; must be marked as the reference weakness, not as normal behavior.
- Crash points: all three injected crash points must appear in the host gate, with retry/idempotency behavior.

---

### Task 1: Page shell, tokens, navigation, legend

**Files:**
- Create: `demo/workflows.html`
- Create: `demo/workflows.css`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - Section ids `shape-a`, `shape-b`, `shape-c`, `shape-d`, `host-gate`.
  - CSS classes `.sheet`, `.masthead`, `.jump-nav`, `.shape-section`, `.diagram-scroll`, `.branch-table`, `.legend`, and SVG classes `.node`, `.node--code`, `.node--model`, `.node--branch`, `.node--host`, `.node--ledger`, `.edge`, `.edge-label`, `.terminal`, `.terminal--resolved`, `.terminal--denied`, `.terminal--amber`, `.terminal--failed`.
  - Shared SVG marker id `arrow`.

- [ ] **Step 1: Write `demo/workflows.html` shell**

Create the document with:
- `<html lang="en">`, `<meta charset="utf-8">`, viewport meta.
- `<title>LogiX-VN — Architecture workflows</title>`.
- `<link rel="stylesheet" href="workflows.css">`.
- `.sheet` wrapper.
- Masthead: kicker `LogiX-VN · Lab 8 · Claim compensation`, `h1` "Four architectures, every branch.", a dek explaining this page shows the full decision space while `index.html` shows one run, and a scope note `Static reference · no claim data · no network`.
- `<nav class="jump-nav" aria-label="Sections">` with links `#shape-a` A Workflow, `#shape-b` B Single ReAct, `#shape-c` C Orchestrator, `#shape-d` D Swarm reference, `#host-gate` Host write gate.
- Five empty `<section class="shape-section" id="...">` blocks with `<header>` containing an `h2`, a one-line role summary, and an empty `.diagram-scroll` and `.branch-table` container for later tasks.
- A legend block with one item per visual grammar: code step, model step, decision, host gate, ledger, resolved, needs_info/escalated, denied/failed.
- Footer: `Host writes the ledger · model reads and drafts` and a link back to `index.html`.

- [ ] **Step 2: Write `demo/workflows.css` base**

Define a `:root` token block matching the existing demo palette: `--paper: #f4f0e6`, `--card: #fbf8f0`, `--ink: #1c1a15`, `--ink-soft: #4a463c`, `--muted: #77705f`, `--rule: #d6cebb`, `--rule-strong: #b9ae96`, `--oxide: #a5381f`, `--green: #226449`, `--amber: #8a5b0a`, plus soft variants `--oxide-soft`, `--green-soft`, `--amber-soft`, and font stacks copied from `demo/styles.css`.

Add:
- Reset and body background matching the paper texture.
- `.sheet` max-width 1440px, centered, responsive padding.
- Masthead, jump nav (wrapping flex with underlined links), section headings.
- `.diagram-scroll { overflow-x: auto; border: 1px solid var(--rule); background: var(--card); padding: 12px; }`
- `svg.flow { display: block; width: 100%; height: auto; min-width: 1040px; }`
- `.node rect, .node polygon { fill: var(--card); stroke: var(--ink); stroke-width: 1.5; }`
- `.node--model rect { rx: 12; }`, `.node--host rect { stroke-width: 3; }`, `.node--ledger` uses `--green`.
- `.edge { fill: none; stroke: var(--ink-soft); stroke-width: 1.4; }`, `.edge-label { font: 11px var(--mono); fill: var(--muted); }`
- `.terminal` pills with 1.5px border, and modifier classes for green, amber, red.
- `.branch-table` full-width, collapsed borders, small mono headers, cell padding.
- `.legend` grid with swatch shapes.
- No colours outside the token block.

- [ ] **Step 3: Verify the shell**

Run:

```bash
python3 - <<'PY'
from html.parser import HTMLParser
from pathlib import Path

class P(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids, self.hrefs, self.scripts, self.links = set(), [], [], []
    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        if d.get("id"): self.ids.add(d["id"])
        if tag == "a" and d.get("href"): self.hrefs.append(d["href"])
        if tag == "script": self.scripts.append(d)
        if tag == "link": self.links.append(d.get("href", ""))

p = P(); p.feed(Path("demo/workflows.html").read_text())
need = {"shape-a", "shape-b", "shape-c", "shape-d", "host-gate"}
assert need <= p.ids, need - p.ids
assert all(h.startswith("#") for h in p.hrefs if h and not h.startswith("index.html"))
assert not p.scripts, p.scripts
assert p.links == ["workflows.css"], p.links
print("shell ok")
PY
```

Expected: `shell ok`.

- [ ] **Step 4: Commit**

```bash
git add demo/workflows.html demo/workflows.css
git commit -m "feat(demo): add workflow reference shell"
```

---

### Task 2: Shape A workflow diagram

**Files:**
- Modify: `demo/workflows.html` (`#shape-a`)
- Modify: `demo/workflows.css` (only if a new diagram primitive is needed)

**Interfaces:**
- Consumes: shell classes and `#arrow` marker from Task 1.
- Produces: `<svg class="flow" data-shape="workflow" viewBox="0 0 1240 720">` and a `#shape-a` branch table.

- [ ] **Step 1: Add the A diagram**

Draw a left-to-right spine with downward branch exits. Required nodes in order:

`claim` → `claim exists?` → `order_id?` → `lookup order` → `visible?` → `compute quote` → `amount > 0?` → `host write gate` → terminal `resolved`.

Branch exits:
- `claim exists?` no → `failed`, reason `unknown_claim`.
- `order_id?` no → `needs_info`, `missing_order_id`.
- `visible?` no → `escalated`, reason `not_found` or `outside_principal_scope`.
- `amount > 0?` no → `denied`, proposal 0, reason from quote (short delay, cancelled/in-transit, zero fee, old policy, damage unverified).
- host gate → `denied` with proposal = full quote and audit `policy_denied`; `failed` on amount conflict; `resolved` with one ledger row and audit `refund_committed`; crash raises and retry resumes.

Label every edge (`yes`, `no`, `visible`, `hidden`, `positive`, `zero`, `ok`, `refused`, `conflict`). Add `<title>` and `<desc>` naming shape A and the branch set.

- [ ] **Step 2: Add the A branch table**

Columns: `Condition`, `Status`, `Proposal`, `Ledger`, `Audit`. One row per branch above plus the host refusal/conflict/crash rows. Use the exact status and audit strings.

- [ ] **Step 3: Verify A content**

Run:

```bash
python3 - <<'PY'
from pathlib import Path
s = Path("demo/workflows.html").read_text()
a = s.split('id="shape-b"')[0].split('id="shape-a"')[1]
for token in ["data-shape=\"workflow\"", "unknown_claim", "missing_order_id", "outside_principal_scope", "policy_denied", "refund_committed", "amount_conflict", "InjectedCrash", "needs_info", "escalated", "denied", "failed", "resolved"]:
    assert token in a, token
assert a.count("<tr") >= 10, a.count("<tr")
print("shape a ok")
PY
```

Expected: `shape a ok`.

- [ ] **Step 4: Commit**

```bash
git add demo/workflows.html demo/workflows.css
git commit -m "feat(demo): draw workflow shape branches"
```

---

### Task 3: Shape B single ReAct diagram

**Files:**
- Modify: `demo/workflows.html` (`#shape-b`)
- Modify: `demo/workflows.css` (only if needed)

**Interfaces:**
- Consumes: shell classes, `#arrow` marker.
- Produces: `<svg class="flow" data-shape="single" viewBox="0 0 1240 720">` and a `#shape-b` branch table.

- [ ] **Step 1: Add the B diagram**

Required nodes:

`claim` → `claim exists?` → `ReAct loop (max 8)` → `final status?` → `compute quote` → `amount > 0?` → `host write gate` → `resolved`.

Draw a loop-back edge from `ReAct loop (max 8)` to itself labelled `decide → read tool`. Annotate that the loop may call only read tools and never `issue_refund`.

Branch exits:
- `claim exists?` no → `failed` / `unknown_claim`.
- loop returns `needs_info` (missing `order_id`) → `needs_info`, proposal 0.
- loop returns `escalated` (order hidden) → `escalated`, proposal 0.
- loop exhausts 8 steps → `failed` / `step_cap`, proposal 0.
- quote 0 → `denied`, proposal 0.
- host gate → `denied` + `policy_denied`, `failed` + `amount_conflict`, `resolved` + ledger + `refund_committed`, or crash/retry.

- [ ] **Step 2: Add the B branch table**

Same columns as A. Include the `step_cap` row explicitly.

- [ ] **Step 3: Verify B content**

Run:

```bash
python3 - <<'PY'
from pathlib import Path
s = Path("demo/workflows.html").read_text()
b = s.split('id="shape-c"')[0].split('id="shape-b"')[1]
for token in ["data-shape=\"single\"", "ReAct", "max 8", "step_cap", "read tool", "needs_info", "escalated", "policy_denied", "amount_conflict", "refund_committed"]:
    assert token in b, token
assert "issue_refund" not in b or "never" in b
print("shape b ok")
PY
```

Expected: `shape b ok`.

- [ ] **Step 4: Commit**

```bash
git add demo/workflows.html demo/workflows.css
git commit -m "feat(demo): draw single ReAct branches"
```

---

### Task 4: Shape C orchestrator diagram

**Files:**
- Modify: `demo/workflows.html` (`#shape-c`)
- Modify: `demo/workflows.css` (only if needed)

**Interfaces:**
- Consumes: shell classes, `#arrow` marker.
- Produces: `<svg class="flow" data-shape="orchestrator" viewBox="0 0 1240 720">` and a `#shape-c` branch table.

- [ ] **Step 1: Add the C diagram**

Required nodes:

`claim` → `claim exists?` → `order_id?` → `allowlist handoff` → `read-only investigators` → `visible?` → `compute quote` → `amount > 0?` → `host write gate` → `resolved`.

Annotate the handoff and investigator nodes: allowlist only, read tools `lookup_order`, `lookup_policy`, `compute_compensation`; no write registry.

Branch exits:
- claim missing → `failed` / `unknown_claim`.
- `order_id` missing → `needs_info`.
- order hidden → `escalated` (`not_found` / `outside_principal_scope`).
- quote 0 → `denied`, proposal 0.
- host refusal → `denied` + `policy_denied`; conflict → `failed`; success → `resolved` + ledger + `refund_committed`; crash → retry.

- [ ] **Step 2: Add the C branch table**

Same columns as A, plus one row describing the handoff boundary and one describing the read-only tool set.

- [ ] **Step 3: Verify C content**

Run:

```bash
python3 - <<'PY'
from pathlib import Path
s = Path("demo/workflows.html").read_text()
c = s.split('id="shape-d"')[0].split('id="shape-c"')[1]
for token in ["data-shape=\"orchestrator\"", "handoff", "read-only", "lookup_order", "lookup_policy", "compute_compensation", "no write", "unknown_claim", "needs_info", "escalated", "policy_denied", "refund_committed"]:
    assert token in c, token
print("shape c ok")
PY
```

Expected: `shape c ok`.

- [ ] **Step 4: Commit**

```bash
git add demo/workflows.html demo/workflows.css
git commit -m "feat(demo): draw orchestrator branches"
```

---

### Task 5: Shape D swarm reference diagram

**Files:**
- Modify: `demo/workflows.html` (`#shape-d`)
- Modify: `demo/workflows.css` (only if needed)

**Interfaces:**
- Consumes: shell classes, `#arrow` marker.
- Produces: `<svg class="flow" data-shape="swarm" viewBox="0 0 1240 760">` and a `#shape-d` branch table.

- [ ] **Step 1: Add the D diagram**

Required nodes:

`claim` → `claim exists?` → `peer + parse calls` → `order_id?` → `allowlist handoff` → `read-only investigators` → `override?` → `compute quote` → `amount > 0?` → `host write gate` → `resolved`.

The `override?` node has two edges:
- `no` → use investigator quote.
- `yes: seed % 5 == 0 and ticket delay ≠ order row` → rewrite `delay_days`, recompute quote, mark `model_override` in trace.

Mark the `yes` edge and node with a `reference weakness` badge. State that the host still blocks writes that fail approval, ownership, or idempotency.

Other exits mirror C: `unknown_claim`, `needs_info`, `escalated`, quote 0 → `denied`, host refusal/replay/conflict/crash.

- [ ] **Step 2: Add the D branch table**

Same columns as A. Add rows for `model_override` and for "host still gates writes".

- [ ] **Step 3: Verify D content**

Run:

```bash
python3 - <<'PY'
from pathlib import Path
s = Path("demo/workflows.html").read_text()
d = s.split('id="host-gate"')[0].split('id="shape-d"')[1]
for token in ["data-shape=\"swarm\"", "peer", "model_override", "seed % 5 == 0", "reference weakness", "delay_days", "unknown_claim", "needs_info", "escalated", "policy_denied", "refund_committed"]:
    assert token in d, token
print("shape d ok")
PY
```

Expected: `shape d ok`.

- [ ] **Step 4: Commit**

```bash
git add demo/workflows.html demo/workflows.css
git commit -m "feat(demo): draw swarm branches and weakness"
```

---

### Task 6: Shared host write gate

**Files:**
- Modify: `demo/workflows.html` (`#host-gate`)
- Modify: `demo/workflows.css` (only if needed)

**Interfaces:**
- Consumes: shell classes, `#arrow` marker.
- Produces: `<svg class="flow" data-shape="host-gate" viewBox="0 0 1240 900">` plus a reason table.

- [ ] **Step 1: Add the host gate diagram**

Draw the gate in this order:

`issue_refund(full quote)` → `claim exists?` → `order_id present?` → `order owned by principal?` → `approval for this claim?` → `approval valid and not expired?` → `positive quote and approval?` → `already refunded on order?` → `amount = min(quote − prior, approved, paid − prior)` → `existing refund?` → `crash point?` → `commit row + refund_committed` → `resolved`.

Branches:
- unknown claim → `failed`, no ledger/audit (host returns `unknown_claim`).
- missing `order_id` → `denied` + `policy_denied` / `missing_order`.
- order missing or outside principal → `denied` + `policy_denied` / `outside_principal_scope`.
- approval missing → `denied` / `missing_approval`.
- approval belongs to another claim → `denied` / `approval_claim_mismatch`.
- approval not valid → `denied` / `approval_<status>`.
- approval expired → `denied` / `approval_expired`.
- non-positive quote or approval → `denied` / `non_positive_amount`.
- order already fully refunded → `denied` / `order_already_refunded`.
- cap reduces amount to zero → `denied` / `capped_to_zero`.
- existing refund with same amount → idempotent replay (`ok`, no second row).
- existing refund with a different amount → `failed` / `amount_conflict`, old row kept.
- crash points `before_effect`, `after_effect_before_checkpoint`, `after_checkpoint`: raise `InjectedCrash`; retry must remain one row.
- successful write → one ledger row + `refund_committed` audit, amount may be below the quote because of cap.

- [ ] **Step 2: Add the reason table**

Columns: `Reason`, `Status`, `Ledger`, `Audit`, `When`. Include every reason in Step 1, plus `order_total_changed` (concurrent write, inner retry exhausted) and `committed` / `idempotent_replay`.

- [ ] **Step 3: Verify host gate content**

Run:

```bash
python3 - <<'PY'
from pathlib import Path
s = Path("demo/workflows.html").read_text()
h = s.split('id="host-gate"')[1]
for token in ["data-shape=\"host-gate\"", "missing_order", "outside_principal_scope", "missing_approval", "approval_claim_mismatch", "approval_expired", "non_positive_amount", "order_already_refunded", "capped_to_zero", "order_total_changed", "amount_conflict", "idempotent_replay", "before_effect", "after_effect_before_checkpoint", "after_checkpoint", "refund_committed"]:
    assert token in h, token
print("host gate ok")
PY
```

Expected: `host gate ok`.

- [ ] **Step 4: Commit**

```bash
git add demo/workflows.html demo/workflows.css
git commit -m "feat(demo): expand shared host write gate"
```

---

### Task 7: Responsive, print, accessibility, final check

**Files:**
- Modify: `demo/workflows.html`
- Modify: `demo/workflows.css`

**Interfaces:**
- Consumes: all sections from Tasks 1–6.
- Produces: final artifact.

- [ ] **Step 1: Add accessibility attributes**

For every `svg.flow`: `role="img"`, `aria-labelledby` pointing at its `<title>` and `<desc>`. Ensure both ids exist and are unique. Branch tables get `<caption>` naming the shape and `<th scope="col">` on every header cell.

- [ ] **Step 2: Add responsive rules**

- Below 1000px: jump nav wraps, tables become block-scroll containers, SVG keeps `min-width` and scrolls inside `.diagram-scroll`.
- No horizontal scroll on the page body at 1280px and 768px.
- Ensure `.diagram-scroll` has `max-width: 100%` and `-webkit-overflow-scrolling: touch`.

- [ ] **Step 3: Add print rules**

```css
@page { size: A4 landscape; margin: 12mm; }
@media print {
  body { background: #fff; }
  .jump-nav, .legend, footer { display: none; }
  .shape-section { break-before: page; }
  .shape-section:first-of-type { break-before: auto; }
  .diagram-scroll { overflow: visible; border: 1px solid #999; }
  svg.flow { min-width: 0; }
  .shape-section, .branch-table { break-inside: avoid; }
}
```

Keep text black on white in print.

- [ ] **Step 4: Run final structural verification**

Run:

```bash
python3 - <<'PY'
from html.parser import HTMLParser
from pathlib import Path
import re

html = Path("demo/workflows.html").read_text()
css = Path("demo/workflows.css").read_text()

class P(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids, self.svgs, self.captions = [], [], 0
        self.scripts, self.external = [], []
    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        if d.get("id"): self.ids.append(d["id"])
        if tag == "svg" and "flow" in d.get("class", ""): self.svgs.append(d)
        if tag == "caption": self.captions += 1
        if tag == "script": self.scripts.append(1)
        for v in d.values():
            if isinstance(v, str) and re.search(r"https?://|//cdn", v): self.external.append(v)
    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)

p = P(); p.feed(html)
assert len(p.svgs) == 5, len(p.svgs)
assert len(set(p.ids)) == len(p.ids), "duplicate id"
for svg in p.svgs:
    assert svg.get("role") == "img"
    refs = svg.get("aria-labelledby", "").split()
    assert len(refs) == 2 and all(r in p.ids for r in refs), svg
assert not p.scripts and not p.external
assert p.captions >= 5, p.captions
for token in ["resolved", "needs_info", "escalated", "denied", "failed"]:
    assert token in html
assert "@media print" in css and "A4 landscape" in css
print("final check ok: 5 diagrams,", len(p.ids), "unique ids")
PY
```

Expected: `final check ok: 5 diagrams, <n> unique ids`, exit 0.

- [ ] **Step 5: Browser and print check**

Open `demo/workflows.html` from `file://`. Confirm:
- All five sections render; no console error.
- At 1280px and 768px, the page body has no horizontal scroll; wide diagrams scroll inside their panel.
- Tab order reaches every nav link and table; no empty headings.
- Print preview shows one architecture per landscape page, then the host gate.
- Every branch in the tables matches the code paths named in Tasks 2–6.

- [ ] **Step 6: Confirm no protected file changed**

Run:

```bash
git status --short
```

Expected: only `demo/workflows.html`, `demo/workflows.css`, and the spec file.

- [ ] **Step 7: Commit**

```bash
git add demo/workflows.html demo/workflows.css
git commit -m "feat(demo): finish workflow reference page"
```

---

## Self-Review

- Spec coverage: five sections (A–D + host gate), full branch tables, visual grammar, print and responsive rules all map to Tasks 1–7. No claim data or JS appears.
- Step scan: each task names exact nodes, exact statuses, exact audit strings, and a checkable verification command.
- Type consistency: SVG class names and section ids are defined once in Task 1 and reused verbatim.
- Review Focus coverage: zero quote, host refusal, `step_cap`, swarm override, and all three crash points each have an owning task and an assertion.
- Proportion: plan describes decisions and exact branch facts; SVG coordinates and path shapes stay with the implementer, as the spec leaves them open.
