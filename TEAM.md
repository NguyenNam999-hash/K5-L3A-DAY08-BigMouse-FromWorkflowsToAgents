# Team

## Thông tin nhóm

- Tên nhóm: BigMouse
- Lớp: L3A
- Repo nhóm: `K5-L3A-DAY08-BigMouse-FromWorkflowsToAgents` (xem [SUBMISSION.md](SUBMISSION.md))
- URL repo, nhánh nộp, commit chốt:

## Thành viên

Thông tin liên hệ còn trống theo yêu cầu; vai trò ghi theo shape được giao. Bằng chứng cài đặt và ghi chú contract CP1: [report/team/cp1_setup.md](report/team/cp1_setup.md).

| STT | Họ tên | MSSV | Email | GitHub | Vai trò |
| --: | ------ | ---- | ----- | ------ | ------- |
|   1 | Nguyễn Lê Hải Nam | 2A202603699 | nam.nlh2001@gmail.com | `NguyenNam999-hash` | Shape swarm (đối chứng) + demo UI + tài liệu nhóm |
|   2 | Lê Thái Dương     | 2A202603415 |       | `pophi5` | Shape workflow + khung CP2/CP3 |
|   3 | Vũ Văn Hào     | 2A202603419 |       | `haovu1663-crypto` | Shape single + CP4 durability/security |
|   4 | Nguyễn Triều Dương | 2A202603524 |       | `duongnt1` | Shape orchestrator + CP1 setup |

Mỗi người phụ trách một shape và vẽ một sơ đồ luồng xử lý của shape đó trong báo cáo cá nhân tại `report/team/MSSV_HoTen.md`.

## Bảng đóng góp

`python -m lab8.check_submission` đọc bảng này bằng máy: giữ nguyên tiêu đề `## Bảng đóng góp` và các cột. Mỗi người một dòng: commit có nội dung và ít nhất một test đã thêm hoặc sửa.

| Người | Vai | Commit | Test đã thêm hoặc sửa |
| --- | --- | --- | --- |
| Nguyễn Lê Hải Nam | Shape swarm (đối chứng) + demo UI + tài liệu nhóm | `2caa0f0` docs: add workflow diagrams design and plan | `tools/tests/test_build_demo_ui.py` (`c7bf376`), `tools/tests/test_demo_assets.py` (`49076a5`, sửa `9b0ea2c`) |
| Lê Thái Dương | Shape workflow + khung CP2/CP3 | `bf25139` Fix personal report filename; code ở `27903a0` | chưa thêm test mới; xác minh bằng `tests/test_public_matrix.py` (T01–T14), `tests/test_trace_contract.py`, `tests/test_handoff_secret.py` |
| Nguyễn Triều Dương | Shape orchestrator + CP1 setup | `6faf794` docs: record CP1 setup verification and contract review | chưa thêm test mới; xác minh bằng `tests/test_handoff_secret.py` và `tests/test_public_matrix.py` |
| Vũ Văn Hào | Shape single + CP4 durability/security | `09e67f3` feat(cp4): add crash safety 20/20 report, security tests, and author report for Vu Van Hao | `src/tests/test_cp4_durability_and_secrets.py` |

## Cá nhân

Mỗi thành viên đồng thời tạo một báo cáo riêng trong `report/` theo dạng:

```text
report/team/MSSV_HoTen.md
```

Ví dụ: `report/team/20241234_NguyenVanAn.md`.

Sao chép mục dưới đây cho từng thành viên.

## MSSV_HoTen

### Phần việc phụ trách

-

### Đóng góp cụ thể

-

### Bằng chứng

-
