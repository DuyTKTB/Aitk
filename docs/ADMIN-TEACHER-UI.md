# Giao diện Giáo viên & Quản trị — đã sửa gì

## 1. Nguyên nhân gốc khiến cả 2 khu vực "xấu / lỗi"

### 1.1. Bộ design token **chưa từng được nạp**
Các component khung (`DashShell.jsx` — dùng chung cho **cả** trang giáo viên và quản trị) dùng
22 biến `--ts-*`, nhưng nhóm này chỉ được định nghĩa trong `src/styles/teacher-studio.css`
— **một file không được file nào import**. Hậu quả:

- `TrendChart` vẽ gradient bằng `var(--ts-accent)` → biến undefined → gradient thành màu đen
  mờ dần + `stroke` thành `none` ⇒ **biểu đồ "Xu hướng điểm thi theo đề" chỉ còn vệt xám,
  không có đường vẽ** (đúng như ảnh chụp).
- Nút, badge, viền, nền phụ ở cả 2 khu vực mất màu / trắng bệch.

**Đã sửa:** bổ sung **toàn bộ 14 biến `--ts-*` thiếu** + 11 biến `--t-*` thiếu (`--t-glass*`,
`--t-line-*`, `--t-shadow-*`, `--t-inset`) vào `src/styles/teacher-tokens.css` (khối tương thích,
có chú thích vì sao). Sau đó 14/14 biến đều OK, build pass.

### 1.2. `admin-apple.css` ghi đè thiết kế CHUNG của khung
`admin-apple.css` có **62 selector `.vt-*`** ghi đè bằng `!important` lên đúng thiết kế dùng chung
(`dash-vitality.css`) — biến thẻ hero gradient thành thẻ trắng washed-out ⇒ admin trông khác
hẳn giáo viên.

**Đã sửa:** gỡ sạch 62 override đó (21 rule xoá hẳn + 33 rule "trộn" chỉ giữ phần `.adl-*`),
giữ nguyên 138 style `.adl-*` riêng của admin. Giờ admin **dùng lại thiết kế giống giáo viên**.

## 2. Đồng bộ màu admin → token giáo viên

Thêm `src/styles/admin-teacher.css` (nạp sau `admin-apple.css` trong `AdminPanel.jsx`):
- `--apl-*` (bảng màu Apple của admin) → map sang token giáo viên: nền `--t-bg`, card
  `--t-surface-2/3`, viền `--t-border*`, nhấn `--t-accent`, trạng thái `--t-status-*`,
  bóng `--t-shadow-*`, bo góc `--t-r-lg`.
- Bỏ màu cứng `#f5f5f7` / `#0a0a0c` của nền admin → tự theo dark/light của giáo viên.
- Card thống kê bo `--t-r-lg` (20px) giống card giáo viên.

## 3. Những gì đã kiểm tra và thấy ỔN

- **Firestore rules phủ đủ** mọi collection admin/giáo viên dùng (`exams`, `examRetryPermits`,
  `submissions`, `classes`, `paperExams`, `proKeys`, `proUsers`, `users`, `studentRetryAllowance`).
- **Không có import thiếu file** trong toàn bộ `components/admin` + `components/teacher`
  (kiểm tra tự động từng file).
- **Không có nút chết** (`onClick` rỗng / `href="#"`) trong 2 khu vực; confirm đều dùng
  dialog riêng (`AdminUI.confirm`), không dùng `confirm()` của trình duyệt.
- Rail sidebar thu hẹp/mở rộng khi hover là **đúng thiết kế** (`.t-rail-sidebar:hover`), không phải lỗi.

## 4. Cần kiểm tra bằng tay (cần đăng nhập + dữ liệu thật)

Các luồng sau cần dữ liệu Firestore thật nên tôi chỉ kiểm tra được phần tĩnh:

- [ ] Admin → Tổng quan: hero "Tổng lượt làm bài" giờ có **gradient màu + chữ trắng** giống giáo viên
- [ ] Admin → Biểu đồ/trend: đường vẽ xuất hiện (không còn vệt xám)
- [ ] Admin → Đề thi / Tạo đề / Câu hỏi / Key giáo viên / Giáo viên PRO / Người dùng / Hoạt động / Cài đặt / Hướng dẫn
- [ ] Giáo viên → AutoExamStudio, Preview Simulator (xuất Word/PDF), PaperGrading (OMR), InsightPanel
- [ ] Dark/light của khu giáo viên: đổi theme ở nút moon trên topbar

## 5. Việc còn lại (đề xuất)

1. `ExamPreviewSimulator.jsx:278,296` còn dùng `alert()` cho lỗi xuất file → nên đổi sang toast.
2. `admin.css` + `admin-dashboard.css` (~3.500 dòng, class `.ad-*`) được nạp **toàn cục trong
   `main.jsx`** nhưng các trang admin hiện dùng `.adl-*`/`.vt-*` → nghi là CSS cũ; nếu xác nhận
   không dùng nữa nên bỏ khỏi `main.jsx` để giảm ~90 kB CSS khởi động.
3. `--stat-color` / `--diff-color` / `--ai-color` / `--tpl-color` dùng trong CSS admin nhưng
   chưa được định nghĩa (có fallback nên không vỡ giao diện) → nên định nghĩa trong
   `admin-teacher.css` khi hoàn thiện bảng màu.
