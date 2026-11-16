# Báo cáo nhóm — Lab 8 LogiX-VN

Tối đa 5 trang ngoài phụ lục. Số liệu lấy từ file trong `src/reports/`, không chép tay từ terminal.

## 1. Thông tin nhóm

- Tên nhóm: BigMouse
- Thành viên: xem `TEAM.md`
- Commit chốt (trùng `report/team/decision_adr.md`): `8cc1906`

## 2. Mục tiêu và cách tiếp cận

Nhóm làm một quy trình xử lý claim hoàn phí vận chuyển trên bốn kiến trúc, giữ nguyên chữ ký `run_claim` và cùng một host ghi ledger. Mục tiêu là chọn kiến trúc ít tự chủ nhất mà vẫn đúng, dựa trên số đo thay vì mặc định multi-agent tốt hơn.

Thứ tự làm theo checkpoint: CP1 cài môi trường, đọc `docs/business_rules.md`, `docs/contracts.md` và swarm tham chiếu; CP2 viết ba shape `workflow`, `single`, `orchestrator`; CP3 hoàn thiện crash, retry và handoff; CP4 chạy crash suite và rà secret/approval; CP5 chạy benchmark bốn shape, tự kiểm và viết báo cáo. Ở CP1 bộ student đúng baseline `186 failed, 62 passed`: ba shape còn là stub, 62 test swarm xanh. Sau CP2/CP3 bộ student đạt `248 passed` và cổng host `54 passed`.

## 3. Giải pháp

Cả ba shape giữ nguyên ranh giới: code quyết tiền và gọi host, model chỉ đọc dữ liệu và soạn chữ. Mọi nhánh return đều đi qua `lab8.shapes.common.finish()`, nên `refund_effects`, `committed_audit_count` và trace lấy từ ledger trong chính lần chạy.

- **Workflow (A):** mở store, đọc claim bằng `get_claim_view`, thiếu `order_id` thì trả `needs_info`. `lookup_order` không thấy đơn hoặc sai principal thì `escalated`. Quote lấy từ `compute_compensation` trên order row, bỏ qua số ngày trễ ghi trong ticket. Quote 0 thì `denied` và không gọi host. Quote dương thì gọi `durability.issue_refund(conn, claim_id, full_quote)`, truyền `crash_at` và để `InjectedCrash` propagate. Không có lời gọi model.
- **Single (B):** vòng ReAct tối đa 8 bước qua `lab8.runtime.run_react`. `decide` chỉ chọn tool đọc `lookup_order` và `compute_compensation`; không có quyền gọi `issue_refund`. Hết vòng lặp, code của shape kiểm tra quote, từ chối quote 0, rồi gọi host với quote đầy đủ. Mỗi bước model được tính vào `Budget`.
- **Orchestrator (C):** dựng handoff bằng `make_handoff` với allowlist read-only, rồi `run_readonly_investigators` chạy `lookup_order`, `lookup_policy`, `compute_compensation`. Investigator không có write registry. Orchestrator đọc order view và quote, sau đó tự gọi `issue_refund` với quote đầy đủ.
- **Swarm (D):** dùng bản tham chiếu có sẵn để đối chứng cost và variance, không sửa.

Handoff chỉ chứa các field trong allowlist của `lab8.handoff`; trace chỉ ghi handoff đã sanitize. Trace của workflow ghi `error`, `decision`, `lookup_order`, `quote`, `crash`; single ghi trạng thái ReAct và quote; orchestrator ghi handoff, order view của investigator và quote. Không shape nào ghi claim row, `ticket`, `parent_secret`, header, số điện thoại, địa chỉ, tên hàng hay ghi chú nội bộ.

## 4. Kết quả

Bảng lấy từ `src/reports/benchmark.json`, 14 claim public × 5 seed `11,22,33,44,55` (70 trial mỗi shape). Cost là VND mô phỏng, không phải hóa đơn API.

| Shape | Pass rate | pass^5 | Seed min–max | Variance | Cost/success | Mean steps | p95 steps |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| workflow | 1.000 | 1.000 | 1.000–1.000 | 0.000000 | 27.86 | 1.86 | 2.0 |
| single | 1.000 | 1.000 | 1.000–1.000 | 0.000000 | 32.65 | 1.86 | 2.0 |
| orchestrator | 1.000 | 1.000 | 1.000–1.000 | 0.000000 | 46.43 | 2.79 | 3.0 |
| swarm | 0.986 | 0.929 | 0.929–1.000 | 0.000816 | 49.57 | 2.80 | 3.0 |

Crash suite: `crash_safety = 20/20` trong `src/reports/crash.json`. Bộ student: `248 passed`; cổng host: `54 passed`. Swarm chỉ hụt ở seed 55 vì C-002: ticket ghi 5 ngày trễ, order row ghi 2, và `REFERENCE_WEAKNESS` của swarm tin ticket nên trả tiền trong khi đúng phải `denied`.

Quyết định kiến trúc và lý do: xem `report/team/decision_adr.md`. Phiếu nghiên cứu và ablation: xem `report/team/research_card.md`.

## 5. Khó khăn và cách xử lý

- **Baseline CP1 đỏ đúng như tài liệu:** lần chạy student đầu tiên ra `186 failed, 62 passed` vì ba shape còn stub. Nhóm xác nhận đây là baseline, không phải lỗi môi trường, rồi triển khai CP2.
- **Khác biệt số test host:** `src/README.md` ghi baseline cũ `52 passed`, checkout này có `54 passed`. Nhóm dùng số thực tế từ `pytest -q` và ghi lại trong `report/team/cp1_setup.md`.
- **Dấu TODO còn sót sau khi code xong:** ba file shape đã triển khai nhưng vẫn còn hai dòng `TODO CP2`/`TODO CP3` trong thân `run_claim`, dễ gây hiểu nhầm là stub. Nhóm xóa hai dòng này; hành vi không đổi và toàn bộ `248` test student vẫn xanh.
- **Python mặc định của máy khác README:** `python3` ngoài venv là 3.14.7 trong khi README yêu cầu 3.11–3.13. Nhóm tạo và dùng `src/.venv` bằng Python 3.11.15 cho mọi lệnh lab.

## 6. Tổng hợp đóng góp

Chi tiết đóng góp của từng thành viên nằm trong `TEAM.md` (bảng đóng góp) và báo cáo cá nhân `report/team/MSSV_HoTen.md`.

## 7. Hạn chế và hướng cải thiện

MockLLM không phải model sản xuất; latency là `unavailable`. Cost là giá mô phỏng theo `config/pricing.yaml`, không phản ánh giá API thật. Corpus public chỉ có 14 claim và 5 seed, nên kết luận chưa chắc giữ trên hidden hoặc trên claim cần đọc chữ tự do nhiều hơn. Workflow thắng vì bài toán chủ yếu tuần tự và luật tiền nằm trong code; nếu hidden có claim cần chọn policy theo ngữ cảnh, single có thể là bước tăng tự chủ hợp lý tiếp theo. Swarm cần bỏ `REFERENCE_WEAKNESS` trước khi có thể so công bằng.

## 8. Tài liệu tham khảo

- `README.md`, `CHECKPOINTS.md`, `RULES.md`, `docs/contracts.md`, `docs/business_rules.md`, `docs/architecture.md`, `docs/metrics.md` của lab.
- AgentArch, AACL 2026 — khung so sánh kiến trúc agent (dùng cho phiếu R3 trong `report/team/research_card.md`).
- `src/reports/benchmark.json`, `src/reports/crash.json`, `report/team/cp1_setup.md`.
