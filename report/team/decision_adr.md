# Decision record

Điền sau dấu `:` trên cùng dòng, không xóa nhãn. Giảng viên và `python -m lab8.check_submission` (chạy trong `src/`) đọc các dòng này bằng máy. Không đổi tên hay dời file này khỏi `report/team/`.
`Shape chọn` phải là đúng một trong: `workflow`, `single`, `orchestrator`, `swarm`. Đây là shape được chấm cổng hidden.

- Shape chọn: workflow
- Commit hash: 8cc1906
- Run id dẫn chứng: R-workflow-C-001-s11
- Pass rate / pass^5 / seed min-max / variance: 1.000 / 1.000 / 1.000–1.000 / 0.000000
- Cost per success (mô phỏng, VND): 27.86
- Crash safety: 20/20 (`src/reports/crash.json`)
- Secret leak / approval bypass: 0 leak, 0 bypass (`pytest -q -m student` 248 passed)

Ví dụ một dòng đã điền: `- Shape chọn: workflow`, `- Crash safety: 20/20 (src/reports/crash.json)`.

## Vì sao shape này

Workflow là kiến trúc ít tự chủ nhất trong bốn shape mà vẫn làm đúng toàn bộ bài toán. Trên cùng 14 claim public, cùng 5 seed `11,22,33,44,55`, cùng bảng giá mô phỏng, workflow đạt pass rate `1.000`, pass^5 `1.000`, seed min–max `1.000–1.000`, variance `0.000000`, cost/success `27.86` VND. Single và orchestrator cũng đạt `1.000` nhưng tốn hơn: `32.65` và `46.43` VND mỗi lần thành công. Swarm đạt `0.986` và pass^5 `0.929`, với seed 55 tụt còn `0.929` do lỗi cố ý `REFERENCE_WEAKNESS` (C-002 seed 55 tin số ngày trễ trong ticket thay vì order row). Vì workflow không dùng model để quyết tiền, tiền do `compute_compensation` tính và host ghi, shape này vừa rẻ nhất vừa không thêm rủi ro.

## Có đáng đổi lấy multi-agent không

Không, với dữ liệu public hiện tại. Multi-agent không tăng pass rate mà tăng cost/success khoảng 17% (single) đến 78% (swarm) và tăng bước trung bình từ `1.86` lên `2.79–2.80`. Đổi sang single hoặc orchestrator chỉ hợp lý khi hidden có claim cần đọc chữ tự do hoặc chọn policy theo ngữ cảnh mà code cố định không xử lý được, và khi đó pass rate phải tăng đủ để bù cost. Đổi sang swarm chỉ hợp lý nếu bỏ được `REFERENCE_WEAKNESS` và variance thấp hơn; hiện swarm còn thua cả workflow về pass^5.

## Trace và bằng chứng

Trace của workflow ghi các event `error` (claim không tồn tại), `decision` (thiếu `order_id`), `lookup_order` (order view đã qua allowlist), `quote` (kết quả `compute_compensation`), `crash` (khi `crash_at` bắn), rồi `finish()` ghi file JSON đúng contract v1. Nhóm cố ý **không** ghi claim row, order row thô, `ticket`, `parent_secret`, `raw_headers_json`, số điện thoại, địa chỉ, tên hàng, ghi chú nội bộ hay approval id vào trace. Single chỉ ghi trạng thái vòng ReAct và quote; orchestrator chỉ ghi handoff đã `make_handoff` sanitize, order view của investigator và quote, không ghi parent context. Mọi file debug đều nằm cùng thư mục trace và bắt đầu bằng `run_id`. `tests/test_trace_contract.py`, `tests/test_handoff_secret.py` và scanner của grader kiểm tra trace path cùng mọi file `<run_id>*`; stdout cũng không in dữ liệu thô.

## Giới hạn

MockLLM không phải model sản xuất; latency là `unavailable`. Số cost là VND mô phỏng, không phải hóa đơn API. Kết luận chỉ đúng cho 14 claim public với 5 seed cố định. Không sửa JSON cho đủ 0.75.
