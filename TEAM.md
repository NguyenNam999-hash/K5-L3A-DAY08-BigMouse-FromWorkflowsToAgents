# Team

## Thông tin nhóm

- Tên nhóm: BigMouse
- Lớp: L3A
- Repo nhóm: `K5-L3A-DAY08-BigMouse-FromWorkflowsToAgents` (xem [SUBMISSION.md](SUBMISSION.md))
- URL repo, nhánh nộp, commit chốt:

## Thành viên

Thông tin cá nhân và vai trò để trống theo yêu cầu. Bằng chứng cài đặt và ghi chú contract CP1: [report/team/cp1_setup.md](report/team/cp1_setup.md).

| STT | Họ tên | MSSV | Email | GitHub | Vai trò |
| --: | ------ | ---- | ----- | ------ | ------- |
| STT | Họ tên | MSSV | Email | GitHub | Vai trò |
| --: | ------ | ---- | ----- | ------ | ------- |
|   1 | Nguyễn Lê Hải Nam | 2A202603699 | nam.nlh2001@gmail.com |        | Evaluation & Benchmarking (CP5) |
|   2 | Lê Thái Dương     | 2A202603415 |       |        | CP2/CP3 Shapes & Handoff Lead |
|   3 | Vũ Văn Hào     | 2A202603419 | haovu1663@gmail.com | haovu1663-cryto | CP4 Durability & Security Lead |
|   4 | Nguyễn Triều Dương | 2A202603524 |       |        | Report & ADR Architecture |

Gợi ý chia vai:

- Nhóm 6 người: integration; workflow; single agent; orchestrator; ledger/policy/crash; eval/report.
- Nhóm 4 người: workflow + integration; single; orchestrator + handoff; ledger + evaluation.

## Bảng đóng góp

`python -m lab8.check_submission` đọc bảng này bằng máy: giữ nguyên tiêu đề `## Bảng đóng góp` và các cột. Mỗi người một dòng: commit có nội dung và ít nhất một test đã thêm hoặc sửa.

| Người | Vai | Commit | Test đã thêm hoặc sửa |
| --- | --- | --- | --- |
| Vũ Văn Hào | CP4 Durability & Security Lead | 09e67f3 | tests/test_cp4_durability_and_secrets.py |
| Lê Thái Dương | CP2/CP3 Shapes & Handoff Lead | 27903a0 | tests/test_public_matrix.py |

## Cá nhân

Mỗi thành viên đồng thời tạo một báo cáo riêng trong `report/` theo dạng:

```text
report/team/MSSV_HoTen.md
```

Ví dụ: `report/team/20241234_NguyenVanAn.md`.

Sao chép mục dưới đây cho từng thành viên.

## 2A202603419_VuVanHao

### Phần việc phụ trách

- Phụ trách Checkpoint 4 (CP4): Crash Safety, Durability, Approval Binding & Security Audit.

### Đóng góp cụ thể

- Chạy kiểm định bộ crash suite 20 kịch bản và xuất báo cáo `src/reports/crash.json` đạt tuyệt đối 20/20.
- Viết bộ test kiểm thử bảo mật độc lập `src/tests/test_cp4_durability_and_secrets.py` (idempotency khi crash, chặn giả mạo approval, lọc sạch canary secret).

### Bằng chứng

- File báo cáo crash: `src/reports/crash.json` (20/20).
- File test cá nhân: `src/tests/test_cp4_durability_and_secrets.py` (4/4 passed).
- Báo cáo cá nhân: `report/team/2A202603419_vuvanhao.md`.
