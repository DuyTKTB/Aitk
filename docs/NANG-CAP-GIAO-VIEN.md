# Nâng cấp chức năng Giáo viên — quản lý học sinh, số liệu, giáo viên bộ môn

_25/10/2026 · căn cứ trên code hiện tại (Firestore + Supabase)_

---

## 1. Hiện trạng (đo từ code)

### Hai kho dữ liệu song song

| Nơi lưu | Nội dung | File |
|---|---|---|
| **Firestore** | `classes` (mã lớp, duyệt thành viên, mời/xoá), `exams` (đề GV tạo, câu hỏi nhúng trong doc, token, giờ mở/đóng), `submissions` (bài nộp: điểm, số đúng, chi tiết từng câu, thời gian), phiếu cho thi lại | `src/lib/classroom.js` (1.302 dòng) |
| **Supabase** | `questions.topic_id`, `exam_attempts`, `user_answers`, `wrong_questions`, `saved_questions`, `courses/course_chapters/course_slides/slide_progress`, credits | `src/lib/examApi.js`, migrations 001–008 |

### Giáo viên hiện có gì

`TeacherDashboard.jsx` có 5 tab: Tổng quan · Lớp học · Đề thi · Phòng thi · AI tạo đề.

- Xếp loại hiện tại (dòng ~797): chỉ dựa **2 số** — `avgPct` và `passRate` → A+/A/B+/B/C.
- Có trung bình theo từng đề, danh sách bài nộp, duyệt thi lại, chống gian lận khi thi.

### 5 khoảng trống lớn (đây là gốc của mọi vấn đề bạn nêu)

1. **Câu hỏi trong đề GV tạo KHÔNG có `topic_id`** → không thể biết "lớp yếu chương nào". Đây là việc phải làm trước mọi thứ khác.
2. **Không có khái niệm "bài giao"**: chỉ có đề thi. Không giao được bài tập/quiz AI kèm hạn, không biết ai chưa làm.
3. **Không có hồ sơ học sinh theo thời gian**: chỉ xem theo đề hoặc theo lớp, không xem "em A yếu dần từ tuần 3".
4. **Một lớp chỉ có 1 `teacherId`** → không có mô hình **giáo viên bộ môn** (1 lớp nhiều GV, mỗi GV 1 môn).
5. **Không có số liệu tổng hợp cấp khối/trường**, không xuất được báo cáo.

---

## 2. Nhóm A — Quản lý học sinh mạnh hơn

| # | Tính năng | Chi tiết | Công |
|---|---|---|---|
| A1 | **Hồ sơ 360° của 1 học sinh** | Bấm tên → panel: điểm TB, số bài đã nộp/được giao, % đúng theo từng chương, chuỗi ngày học, 5 bài gần nhất kèm xu hướng, ghi chú của GV | M |
| A2 | **Bảng lớp có cột + sắp xếp + lọc** | Cột: Điểm TB · Đã nộp · Trễ · Chương yếu nhất · Mức độ học tập · Cờ cảnh báo. Lọc nhanh: "yếu nhất 5 em", "vắng 2 bài", "tụt điểm" | M |
| A3 | **Cờ cảnh báo tự động** | Tụt ≥15 điểm 2 bài liên tiếp · bỏ 2 bài giao · đúng <40% ở ≥2 chương · không vào app 14 ngày | S |
| A4 | **Nhãn & ghi chú** | Tự tạo nhãn (HSG / cần kèm / chuyển lớp), ghi chú có thời gian, lọc theo nhãn | S |
| A5 | **Nhóm trong lớp** | Chia tổ/nhóm, giao bài theo nhóm thay vì cả lớp | S |
| A6 | **Nhập/xuất danh sách** | Nhập CSV (tên, email, tổ), xuất bảng điểm ra Excel | S |
| A7 | **Thao tác hàng loạt** | Chọn nhiều em → nhắc bài / giao bù / mở khoá thi lại / gắn nhãn | S |

---

## 3. Nhóm B — Số liệu tổng quát hơn

| # | Tính năng | Chi tiết | Công |
|---|---|---|---|
| B1 | **Dashboard khối/lớp** | Phân bố điểm (histogram), % đạt, so lớp này với TB khối, xu hướng 8 tuần | M |
| B2 | **Heatmap lớp × chương** | Hàng = học sinh, cột = chương, ô đỏ/vàng/xanh theo % đúng. Nhìn 5 giây biết cả lớp yếu gì | M |
| B3 | **Độ khó từng câu** | % đúng của từng câu trên cả lớp → phát hiện câu mơ hồ / đề sai (dưới 25% đúng) | S |
| B4 | **Phễu giao bài** | Giao N em → mở X → nộp Y → đúng giờ Z. Thấy ngay điểm nghẽn | S |
| B5 | **Báo cáo tuần tự động** | Thứ 6 gửi cho GV: 3 em cần chú ý, chương yếu nhất, tỉ lệ hoàn thành | S |
| B6 | **Xuất báo cáo** | Excel/PDF theo lớp hoặc theo em (dùng skill xlsx có sẵn) | M |
| B7 | **Hiệu quả can thiệp** | So % đúng chương trước/sau khi dạy lại hoặc giao bù → biết cách dạy nào hiệu quả | M |

---

## 4. Nhóm C — Giáo viên bộ môn, giao bài, cách tính "học sinh học thế nào"

### C1. Mô hình giáo viên bộ môn

Thêm bảng `class_teachers`:

```
class_teachers(classId, teacherId, teacherName, subject, role)   // role: owner | subject
```

- `owner` = GV chủ nhiệm/quản trị lớp (tạo lớp, duyệt thành viên, thấy toàn bộ môn).
- `subject` = GV bộ môn: **chỉ thấy lớp đó + chỉ thấy đề/bài thuộc môn mình**, không xoá lớp, không xem môn khác.
- Mọi đề/bài gắn `subject` (đã có field `subject` trong `createExam` — chỉ cần bắt buộc khi là GV bộ môn).
- Query Firestore phải thêm `where('subject','==',mySubject)` ở tầng quyền, không chỉ ẩn UI.

### C2. Giao bài (assignments)

```
assignments(classId, teacherId, subject, type, refId, title,
            targetType, targets[], opensAt, closesAt,
            allowLate, maxAttempts, createdAt)
```

- `type`: `exam` (đề có sẵn) · `quiz_ai` (AI sinh theo chương) · `practice` (luyện chương trong app) · `lesson` (xem slide).
- `targetType`: `class` · `group` · `student` → giao cả lớp, theo tổ, hoặc bù riêng 1 em.
- Trạng thái mỗi HS: `chưa mở · đang làm · đã nộp · nộp trễ · vắng` — tính từ `submissions` + `opensAt/closesAt`, không lưu cứng.
- Tận dụng hạ tầng có sẵn: `exam_attempts` + `submissions` đã có đủ dữ liệu để suy ra trạng thái.

### C3. Cách tính "học sinh học thế nào" — chỉ số Mức độ học tập (0–100)

Đây là phần bạn hỏi kỹ nhất. Đề xuất **5 thành phần**, mỗi thành phần chống một kiểu "học ảo":

| Thành phần | Trọng số | Cách tính | Chống được gì |
|---|---|---|---|
| Độ chính xác | 45% | Trung bình % đúng các bài đã nộp, **ưu tiên bài gần** (bài cách đây k bài có trọng số 0.9^k) | Học kỳ trước giỏi, giờ yếu vẫn bị phản ánh |
| Độ phủ chương | 20% | Số chương đã làm / số chương được giao | Học lệch, chỉ làm chương dễ |
| Độ đều | 15% | 100 − độ lệch chuẩn % đúng giữa các bài (chuẩn hoá) | Lúc 95% lúc 30% → không ổn định |
| Đúng hạn | 10% | Số bài nộp trước hạn / tổng bài đã nộp | Học đối phó, nộp muộn |
| Tiến bộ | 10% | So TB 3 bài gần nhất với 3 bài trước đó, quy về thang −100…+100 rồi chuẩn hoá | Đang đi lên hay đi xuống |

Công thức:

```
Mastery = 0.45·Accuracy + 0.20·Coverage + 0.15·Consistency + 0.10·Punctuality + 0.10·Trend
```

Xếp loại: **≥85 Nắm chắc · 70–84 Khá · 55–69 Trung bình · 40–54 Cần củng cố · <40 Báo động**

Ba quy tắc bắt buộc để con số không nói dối:

1. **Chưa đủ dữ liệu thì không xếp loại.** Dưới 3 bài hoặc dưới 20 câu → hiện "chưa đủ dữ liệu (2/3 bài)". Thà trống còn hơn sai.
2. **Giảm nhiễu theo độ dài đề.** Đề <10 câu bị nhân hệ số tin cậy 0.6; bài nộp dưới 20% thời lượng bị loại khỏi Accuracy và gắn cờ "bất thường".
3. **Lưu snapshot mỗi tuần.** Bảng `mastery_snapshots(studentId, classId, subject, week, score, parts)` để vẽ xu hướng và chứng minh tiến bộ, không tính lại từ đầu mỗi lần mở app.

Chỉ số cấp lớp (GV nhìn 1 dòng): `TB lớp · trung vị · độ lệch · % nguy cơ (<40) · chương yếu nhất`.

Với **GV bộ môn**, Mastery tính **riêng theo môn** (chỉ bài của môn đó) — không gộp với môn khác, nếu không thì "yếu Vật lý" sẽ kéo điểm Hóa của thầy/cô dạy Hóa.

### C4. Vì sao không dùng cách xếp loại hiện tại

Cách cũ (A+/A/B+/B/C theo `avgPct` + `passRate`) có 3 điểm yếu: (a) 1 bài điểm cao là lên A+; (b) không biết em đó có học đủ chương không; (c) không thấy xu hướng. Giữ nguyên hàm cũ để không phá dữ liệu cũ, nhưng dashboard mới hiển thị **Mastery** và để cũ làm tham chiếu.

---

## 5. Lộ trình đề xuất

| Đợt | Nội dung | Vì sao đợt này | Công |
|---|---|---|---|
| **1** | Gắn `topic_id` cho câu hỏi khi tạo đề (AI tự gợi ý chương, GV sửa lại) → hồ sơ 360° (A1) → heatmap lớp × chương (B2) | Mở khoá toàn bộ số liệu theo chương; đây là nút thắt lớn nhất | 3–4 ngày |
| **2** | `class_teachers` + phân quyền GV bộ môn (C1) → giao bài (C2) → Mastery v1 + snapshot (C3) | Đúng yêu cầu "giao cho HS lớp mình + tự tổng hợp" | 5–7 ngày |
| **3** | Bảng lớp nâng cao + cờ cảnh báo (A2, A3) → dashboard khối (B1) → báo cáo tuần (B5) → xuất Excel (B6) | Khi đã có dữ liệu sạch mới đáng làm đẹp | 4–6 ngày |

**Ghi chú kỹ thuật quan trọng**

- Firestore không join được → mỗi lần mở dashboard đừng đọc hết `submissions`. Duy trì doc tổng hợp `class_stats/{classId}` cập nhật bằng Cloud Function khi có bài nộp (hoặc lazy-recompute khi mở, cache 10 phút).
- `topic_id` phải **copy vào câu hỏi của đề** lúc tạo (không tra Supabase mỗi lần chấm) → chấm xong là có ngay thống kê chương, không phụ thuộc mạng.
- Phân quyền phải nằm ở **Firestore rules** (`teacherId`/`class_teachers` + `subject`), không chỉ ẩn nút trên UI.
- Quyền riêng tư: HS chỉ thấy điểm của mình; GV bộ môn chỉ thấy môn mình; `owner` thấy tất cả.

---

## 6. Rủi ro cần biết trước

1. **Dữ liệu cũ không có topic** → heatmap sẽ trống với đề đã tạo trước đó. Cần map một lần (GV gán chương cho đề cũ, hoặc bỏ qua đề cũ).
2. **Số nhỏ gây kết luận sai**: lớp 12 em mà 3 em vắng → % đạt nhảy loạn. Luôn hiện kèm `n=`.
3. **Mastery bị "game"** nếu HS làm lại nhiều lần: chỉ tính **bài nộp đầu tiên** hoặc bài cao nhất theo cấu hình, không cộng dồn.
4. **Firestore rules sai = lộ dữ liệu lớp khác** — cần test bằng 2 tài khoản trước khi phát hành.

---

## 7. Thứ tự mình khuyên làm ngay

1. `topic_id` cho đề GV (nhỏ, mở khoá nhiều thứ nhất)
2. Hồ sơ 360° của học sinh
3. Heatmap lớp × chương
4. `class_teachers` + giao bài
5. Mastery + snapshot

Bốn việc đầu đã đủ để bạn nhìn lớp "đang học thế nào" thay vì chỉ xem từng bài.
