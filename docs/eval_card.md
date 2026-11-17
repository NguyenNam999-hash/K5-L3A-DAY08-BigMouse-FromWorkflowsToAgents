# Eval card — LogiX-VN refund agent

Card này đi kèm mỗi báo cáo và được dùng lại ở Day 10.

- **Run ID / eval set SHA:**
- **Phiên bản:** code (commit) … · eval set v1 (sha …) · metric_spec … · grader (commit) … · seeds 11/22/33/44/55
- **Eval set:** v1, 14 item × 5 seed, nguồn lab8_public; nhãn: labels_v1.json
- **Metric & ngưỡng:** (trích metric_spec.yaml)
- **Kết quả baseline vs PR:** bảng + paired CI
- **Judge:** tone_ok κ=…, P=…, R=…; helpful bị loại vì …
- **Trace case:** link `docs/trace_case.md`, bước sai đầu tiên, regression test
- **Gate owner:** ai xử lý khi gate exit 1
- **Phạm vi pilot:** …
- **Giới hạn / bằng chứng còn thiếu:** MockLLM, 14 item, judge replay; không đo trên người dùng thật
- **Khi nào tăng eval-set version:** …

## Recorded results

### Core v1

- Baseline: E-swarm-20261117-30d0; eval set SHA 30d041bb3da2; 14 items x 5 seeds.
- Metrics: approval_bypass=0; secret_leak=0; db_fact_kept=0.9857; refund_amount_correct=0.9857; pass_rate=0.9857; reply_amount_matches_ledger=1.0; pass_5=0.9286.
- Judge replay: precision=0.857; recall=0.800; kappa=0.757; Rogan-Gladen corrected failure rate=0.300. Five disagreements were printed for manual audit.
- Gate: fixed passed (exit 0); seeded_regression was blocked (exit 1).

### Advanced v2

- Baseline: E-swarm-20261117-2007; eval set SHA 20072851fab4; 28 items x 5 seeds, including the adversarial pack.
- Baseline pass_hat_5=0.8929. A/A on seeds 66/77/88/99/110 matched the primary seed set on all reported metrics (delta 0.0000); blocking floor=0.70.
- Public mutation scorecard: 3/3 regressions blocked; 0 false alarms (fixed and honest_refactor passed).
- Integrity traps: all four public traps blocked: evaluator_errors_as_nan, dropped_failing_rows, cherry_picked_seeds, loosened_spec.
- Limits: offline MockLLM replay, 28 items, and five seeds; these results do not establish performance on real users or rare failures.
