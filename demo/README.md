# Demo UI — four architectures, one page

Static, read-only artifact for the Lab 8 report and demo. Four tabs, one
pipeline diagram per shape, the public claims with every seed, the sanitized
trace for the selected run, and the benchmark comparison.

## Open it

Open `demo/index.html` directly in a browser. The bundle is embedded in
`demo/data.js`, so no server and no network are needed.

If your browser blocks local scripts from `file://`:

```bash
python3 -m http.server 8000 --directory demo
```

Then open <http://localhost:8000/>.

## Regenerate

`demo/data.js` is committed and already usable. Rebuild it after a new local
benchmark run.

From `src/` (writes `reports/benchmark.json` and a fresh `traces/` tree):

```bash
python -m lab8.benchmark --shapes workflow,single,orchestrator,swarm \
  --cases data/public_claims.jsonl --seeds 11,22,33,44,55 \
  --out reports/benchmark.json
```

From the repo root:

```bash
python3 tools/build_demo_ui.py
```

The generator prints `14 claims, 280 trials, 280 traces, 0 leaks` and writes
`demo/data.js`. It exits non-zero, without writing, when `src/traces/` is
missing or a benchmark trial has no trace file, because `traces/` is
gitignored and must come from a local run.

## What the data means

- **Status is the only measured pass criterion.** It comes from the benchmark
  trial; the claim's expected status is the label.
- **Quote** is the amount the shape proposed in the trace. It is not the amount
  the host wrote.
- **Refund expected** is the claim fixture's label. It is not measured. Cap
  cases (T08, T14) intentionally differ from the quote. The page labels it
  `expected, not measured`.
- The SQLite ledger is never opened. `refund_effects`, `committed_audit_count`,
  and `audit_refund_committed` are not in this artifact.
- Trace payloads are shown verbatim because the shapes already write through
  allowlisted views. The generator still scans every string for
  `CANARY_SECRET_`, `CANARY_INTERNAL_`, `parent_secret`, `raw_headers`,
  `Authorization`, `Bearer `, and phone-like strings, and aborts on a hit.
- The swarm tab exposes the reference weakness: seed divisible by 5 can trust
  the ticket delay. `model_override` marks the runs where that fired.

## Print

The print stylesheet drops the tabs, event detail, legend, and footer, then
keeps the masthead, selected diagram, result card, claim table, comparison, and
crash card on A4 landscape. Use the browser's Print dialog for a report PDF.

## Files

| File | Role |
| --- | --- |
| `index.html` | Page shell and containers |
| `styles.css` | Editorial light theme, diagram states, responsive and print rules |
| `app.js` | Shape graphs, selection state, rendering, event mapping |
| `data.js` | Generated bundle; do not hand-edit |
| `../tools/build_demo_ui.py` | Generator with sanitizer and leak guard |
| `../tools/tests/` | Generator and diagram-id tests |
