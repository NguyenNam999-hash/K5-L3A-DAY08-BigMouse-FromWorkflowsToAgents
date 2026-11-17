"""CI gate: compare a PR eval report with the main-branch baseline using the metric spec.

    python -m lab9.gate --pr reports/eval_workflow.json --baseline reports/baseline_v1.json

exit 0 = merge, exit 1 = blocked. Safety metrics: max 0, no averaging away.
Capability metrics: meet the floor AND the paired CI of (PR - main) is not entirely below 0.
Thresholds may only get stricter on the same eval-set version (ratchet).
"""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

from lab8.console import utf8_stdio
from lab9 import stats
from lab9.eval import SPEC, load_spec, per_item


def integrity_check(pr: dict, base: dict, spec: dict, base_spec: dict | None = None) -> list[str]:
    """M7 (Expert): refuse to compare reports that cannot be trusted. Return a list of problems
    (empty = trustworthy). A gate that passes a broken report is worse than no gate.
    Must catch at least:
      - any metric value in pr["metrics"] that is NaN or inf
      - len(pr["rows"]) != manifest items x len(manifest seeds)   (dropped / duplicated rows)
      - the (item_id, seed) set of PR differs from the baseline's (cherry-picked seeds/items)
      - pr["evaluator_failures"] non-empty, or a row whose value for a graded spec metric is
        None (a crashed grader silently scores as "missing" and drops out of the mean)
      - base_spec given and a threshold in spec is LOOSER than in base_spec for the same
        eval-set version (ratchet: max may not rise, min may not fall, a blocking metric may
        not become non-blocking, a metric may not disappear; the same for spec["slices"],
        including dropping no_significant_drop)
      - an item's slice tags in PR rows differ from the baseline's (relabelling an item out of a
        slice hides its regression from the slice gate)"""
    problems: list[str] = []
    metrics = pr.get("metrics") or {}
    for name, value in metrics.items():
        if isinstance(value, (int, float)) and not math.isfinite(value):
            problems.append(f"metric {name} is not finite ({value})")

    rows = pr.get("rows") or []
    base_rows = base.get("rows") or []
    manifest = pr.get("manifest") or {}
    expected_count = int(manifest.get("items", 0)) * len(manifest.get("seeds") or [])
    if len(rows) != expected_count:
        problems.append(f"row count {len(rows)} != manifest items x seeds ({expected_count})")
    if pr.get("evaluator_failures"):
        problems.append(f"evaluator_failures is non-empty ({len(pr['evaluator_failures'])})")

    def pair_set(report_rows: list[dict]) -> set[tuple[str, int]]:
        return {(str(row.get("item_id")), int(row.get("seed"))) for row in report_rows
                if row.get("item_id") is not None and row.get("seed") is not None}

    pr_pairs, base_pairs = pair_set(rows), pair_set(base_rows)
    if len(pr_pairs) != len(rows):
        problems.append("rows contain duplicate or incomplete (item_id, seed) keys")
    if pr_pairs != base_pairs:
        problems.append("(item_id, seed) set differs from baseline")

    graded = [m for m in spec.get("metrics", [])
              if m.get("level") != "system" and m.get("grader") != "lab8.metrics.summarize"]
    for metric in graded:
        mid = metric["id"]
        missing = sum(1 for row in rows if row.get(mid) is None)
        if missing:
            problems.append(f"graded metric {mid} has {missing} missing/None row value(s)")

    def slice_labels(report_rows: list[dict]) -> dict[str, tuple[str, ...]]:
        return {str(row["item_id"]): tuple(sorted(row.get("slices") or []))
                for row in report_rows if row.get("item_id") is not None}

    if slice_labels(rows) != slice_labels(base_rows):
        problems.append("item slice tags differ from baseline")

    same_version = base_spec is not None and spec.get("eval_set_version") == base_spec.get("eval_set_version")
    if same_version:
        current_metrics = {m.get("id"): m for m in spec.get("metrics", [])}
        prior_metrics = {m.get("id"): m for m in base_spec.get("metrics", [])}
        for mid, prior in prior_metrics.items():
            current = current_metrics.get(mid)
            if current is None:
                problems.append(f"ratchet: metric {mid} was removed")
                continue
            if prior.get("blocking") and not current.get("blocking"):
                problems.append(f"ratchet: metric {mid} changed from blocking to non-blocking")
            old_th, new_th = prior.get("threshold") or {}, current.get("threshold") or {}
            for key, old_value in old_th.items():
                if key == "no_significant_drop":
                    if old_value and not new_th.get(key):
                        problems.append(f"ratchet: metric {mid} removed no_significant_drop")
                elif key not in new_th:
                    problems.append(f"ratchet: metric {mid} removed threshold {key}")
                elif key == "min" and new_th[key] < old_value:
                    problems.append(f"ratchet: metric {mid} lowered min threshold")
                elif key in ("max", "max_increase") and new_th[key] > old_value:
                    problems.append(f"ratchet: metric {mid} raised {key} threshold")

        current_slices = {(s.get("name"), s.get("metric")): s for s in spec.get("slices", [])}
        prior_slices = {(s.get("name"), s.get("metric")): s for s in base_spec.get("slices", [])}
        for key, prior in prior_slices.items():
            current = current_slices.get(key)
            label = f"{key[0]}/{key[1]}"
            if current is None:
                problems.append(f"ratchet: slice {label} was removed")
                continue
            if prior.get("blocking") and not current.get("blocking"):
                problems.append(f"ratchet: slice {label} changed from blocking to non-blocking")
            for threshold in ("min", "max"):
                if threshold in prior and threshold not in current:
                    problems.append(f"ratchet: slice {label} removed {threshold} threshold")
                elif threshold == "min" and threshold in prior and current[threshold] < prior[threshold]:
                    problems.append(f"ratchet: slice {label} lowered min threshold")
                elif threshold == "max" and threshold in prior and current[threshold] > prior[threshold]:
                    problems.append(f"ratchet: slice {label} raised max threshold")
            if prior.get("no_significant_drop") and not current.get("no_significant_drop"):
                problems.append(f"ratchet: slice {label} removed no_significant_drop")
    return problems


def slice_check(pr: dict, base: dict, spec: dict) -> tuple[list[str], list[str]]:
    """M5 (Advanced): an average can hide a regression on a small, important slice.
    For each entry of spec["slices"] ({"name", "metric", "min"?, "no_significant_drop"?, "blocking"}):
      - value = mean of per_item(pr, metric, slice_name=name)
      - fail if below "min", or if no_significant_drop and the paired CI over the slice's items
        lies entirely below 0
    Return (blocked ids like "slice:money_movement/pass_rate", report lines)."""
    blocked: list[str] = []
    lines: list[str] = []
    bs = spec.get("bootstrap", {})
    for rule in spec.get("slices", []):
        name, metric = rule["name"], rule["metric"]
        current = per_item(pr, metric, name)
        baseline = per_item(base, metric, name)
        value = sum(current.values()) / len(current) if current else None
        verdict, note = "ok", ""
        if value is None:
            verdict = "missing"
        elif "min" in rule and value < rule["min"]:
            verdict = "fail"
        elif "max" in rule and value > rule["max"]:
            verdict = "fail"
        if rule.get("no_significant_drop") and value is not None:
            keys = sorted(set(current) & set(baseline))
            if not keys:
                verdict = "missing"
                note = "no paired slice items"
            else:
                d, lo, hi = stats.paired_bootstrap(
                    [current[k] for k in keys], [baseline[k] for k in keys],
                    n_resamples=bs.get("n_resamples", 1000), rng=bs.get("rng", 2027),
                    confidence=bs.get("confidence", 0.95))
                note = f"Δ {d:+.3f} CI [{lo:+.3f}, {hi:+.3f}]"
                if hi < 0:
                    verdict = "fail"
        is_blocking = rule.get("blocking", False)
        if verdict != "ok" and is_blocking:
            blocked.append(f"slice:{name}/{metric}")
        label = "ok" if verdict == "ok" else ("BLOCK" if is_blocking else "warn")
        lines.append(f"  slice {name}/{metric:<20} {value!s:<8} {json.dumps(rule):<70} {note:<28} {label}")
    return blocked, lines


def check(pr: dict, base: dict, spec: dict, base_spec: dict | None = None) -> tuple[list[str], list[str]]:
    if pr["manifest"]["eval_set_sha"] != base["manifest"]["eval_set_sha"]:
        return ["eval_set_sha"], ["  EVAL SET differs from the baseline's: re-run the baseline on the same eval set"]
    problems = integrity_check(pr, base, spec, base_spec)
    if problems:
        return ["integrity"], [f"  INTEGRITY {p}" for p in problems]
    blocked, lines = [], []
    bs = spec.get("bootstrap", {})
    for m in spec["metrics"]:
        mid, th, val = m["id"], m.get("threshold", {}), pr["metrics"].get(m["id"])
        verdict, note = "ok", ""
        if val is None:
            verdict = "missing"
        elif "max" in th and val > th["max"]:
            verdict = "fail"
        elif "min" in th and val < th["min"]:
            verdict = "fail"
        elif "max_increase" in th and base["metrics"].get(mid):
            if val > base["metrics"][mid] * (1 + th["max_increase"]):
                verdict = "fail"
        if th.get("no_significant_drop") and val is not None:
            a, b = per_item(pr, mid), per_item(base, mid)
            keys = sorted(set(a) & set(b))
            d, lo, hi = stats.paired_bootstrap([a[k] for k in keys], [b[k] for k in keys],
                                               n_resamples=bs.get("n_resamples", 1000), rng=bs.get("rng", 2027))
            note = f"Δ {d:+.3f} CI [{lo:+.3f}, {hi:+.3f}]"
            if hi < 0:
                verdict = "fail"
        if verdict != "ok" and m.get("blocking"):
            blocked.append(mid)
        label = {"ok": "ok", "missing": "MISSING"}.get(verdict, "BLOCK" if m.get("blocking") else "warn")
        lines.append(f"  {mid:<22} {val!s:<8} {json.dumps(th):<40} {note:<28} {label}")
    if spec.get("slices"):
        sb, sl = slice_check(pr, base, spec)
        blocked += sb
        lines += sl
    return blocked, lines


def main(argv: list[str] | None = None) -> int:
    utf8_stdio()
    ap = argparse.ArgumentParser(prog="lab9.gate")
    ap.add_argument("--pr", required=True)
    ap.add_argument("--baseline", required=True)
    ap.add_argument("--spec", default=str(SPEC))
    ap.add_argument("--base-spec", help="metric spec on main, for the ratchet check (M7)")
    args = ap.parse_args(argv)
    pr = json.loads(Path(args.pr).read_text(encoding="utf-8"))
    base = json.loads(Path(args.baseline).read_text(encoding="utf-8"))
    base_spec = load_spec(Path(args.base_spec)) if args.base_spec else None
    blocked, lines = check(pr, base, load_spec(Path(args.spec)), base_spec)
    print(f"gate: PR {pr['run_id']} vs main {base['run_id']} · eval set {pr['manifest']['eval_set_sha']}")
    print("\n".join(lines))
    if blocked:
        print(f"exit 1 — blocked: {', '.join(blocked)}")
        return 1
    print("exit 0 — merge")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
