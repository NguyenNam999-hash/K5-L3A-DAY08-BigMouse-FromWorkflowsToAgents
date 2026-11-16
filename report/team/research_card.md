# Research card

File này nằm cố định ở `report/team/research_card.md`; `python -m lab8.check_submission` đọc cột "Nhóm điền" bằng máy.

Phần này nối tiếp phần mini research ở buổi lý thuyết (slide 62–63). Chọn **một** câu R1–R4, điền 6 dòng, rồi biến nó thành **một ablation** chạy được trong lab: giữ nguyên model (MockLLM), tool, seed, corpus và giá, chỉ thay đổi một biến.

| Câu | Nguồn (thư viện tham khảo, slide 68–69) | Câu hỏi gợi ý cho lab |
| --- | --- | --- |
| R1 · Scaling | Google Research 2026, *Towards a Science of Scaling Agent Systems* | Task claims chủ yếu tuần tự hay song song được? Dự đoán thêm investigator sẽ làm pass rate và cost/success thay đổi thế nào. |
| R2 · Failure taxonomy | MAST, NeurIPS 2025, *Why Do Multi-Agent LLM Systems Fail?* | Các trial fail của swarm (seed 55) thuộc nhóm nào: lỗi giao việc, lệch mục tiêu, hay lỗi kiểm chứng? |
| R3 · Architecture choices | AgentArch, AACL 2026 | Nếu đổi topology mà giữ nguyên mọi thứ khác, biến nào phải cố định để kết luận còn đúng? |
| R4 · Evaluation confounders | EMNLP 2026, *Rethinking Evaluation of MAS Efficiency* | Làm sao chứng minh chênh lệch giữa A/B/C/D là do topology, không phải do prompt, tool hay seed? |

## Phiếu của nhóm

Điền vào cột cuối. Không xóa hai cột đầu.

| Field | Hướng dẫn | Nhóm điền |
| --- | --- | --- |
| CÂU | R1 / R2 / R3 / R4 | R3 |
| SOURCE | Paper/blog, năm, URL, loại bằng chứng (benchmark, production report, blog kinh nghiệm) | AgentArch, AACL 2026; bài benchmark kiến trúc agent, dùng làm khung so topology |
| CLAIM | Một kết luận gốc của nguồn. Không viết rộng hơn phạm vi paper | Chọn topology là một quyết định kiến trúc riêng, nên so sánh chỉ có nghĩa khi model, tool, dữ liệu và cách đo được giữ cố định |
| BOUNDARY | Model / dataset / setup giới hạn kết luận đó | Kết luận của paper gắn với benchmark và model của paper; lab này chỉ kiểm tra lại trên MockLLM, 14 claim public và 5 seed |
| HYPOTHESIS | Nếu đổi shape A→B (hoặc bật/tắt một thành phần), metric X sẽ đổi theo hướng nào, khoảng bao nhiêu | Đổi A workflow sang C orchestrator, giữ nguyên mọi thứ khác, pass rate giữ 1.000 nhưng cost/success tăng khoảng 60–70% và số bước tăng |
| METHOD | Biến giữ cố định: model, tools, seed, corpus, giá, evaluator. Biến duy nhất được thay đổi: … | Cố định MockLLM, read-only tool allowlist, seed 11/22/33/44/55, 14 claim public, bảng giá mô phỏng và `trial_pass`; biến duy nhất là shape A/B/C/D |
| FAILURE / METRIC | Một lỗi dự kiến và cách đo nó: pass rate, pass^5, variance, cost/success, leak, bypass | Dự kiến thêm tầng agent làm tăng cost và steps mà không tăng pass; đo pass rate, pass^5, seed variance, cost/success, mean/p95 steps trong `src/reports/benchmark.json` |

## Kết quả ablation

- Lệnh đã chạy (copy nguyên văn):
  `python -m lab8.benchmark --shapes workflow,single,orchestrator,swarm --cases data/public_claims.jsonl --seeds 11,22,33,44,55 --out reports/benchmark.json`
- Run id / file report: `R-workflow-C-001-s11`; `src/reports/benchmark.json`
- Kết quả so với hypothesis (đúng / sai / không kết luận được), kèm số liệu: Đúng một phần. Pass rate của A/B/C đều `1.000` và pass^5 `1.000`, nên thêm agent không tăng độ chính xác. Cost/success tăng từ `27.86` (A) lên `32.65` (B) và `46.43` (C), tức C tăng khoảng 67% so với A; mean steps tăng từ `1.86` lên `2.79`. Swarm (D) thấp hơn: pass `0.986`, pass^5 `0.929`, variance `0.000816`, cost/success `49.57`; seed 55 chỉ đạt `0.929` vì C-002 bị trả tiền sai do `REFERENCE_WEAKNESS` tin ticket. Variance của A/B/C đều `0.000000`.
- Giới hạn: MockLLM không phải model sản xuất, latency là `unavailable`.

Muốn đi xa hơn một ablation để lấy điểm cộng thì xem [docs/bonus_topics.md](../../docs/bonus_topics.md).
