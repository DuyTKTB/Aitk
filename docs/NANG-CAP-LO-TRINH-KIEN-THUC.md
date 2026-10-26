# Nâng cấp "Lộ trình kiến thức" — đề xuất tính năng

_Cập nhật: 25/10/2026 · Căn cứ trên code hiện tại của ELEC AI_

---

## 1. Hiện trạng (đo từ code, không phỏng đoán)

File đang chạy: `src/components/Home.jsx` → component `RoadmapBento` (dòng ~413).
(`src/pages/Home.jsx` là bản trùng, không được `App.jsx` import — nên xoá/gộp.)

| Hạng mục | Hiện tại |
|---|---|
| Dữ liệu lộ trình | Object `ROAD` hardcode ngay trong file, 2 bản trùng nhau |
| Chuyên đề | Chỉ là **chuỗi tên** (`'Cân bằng hóa học'`), **không có id** |
| Nút chuyên đề | Bấm → gửi 1 prompt cho AI (`askAI(...)`) rồi mở trang chat |
| Tiến độ | Không có |
| Liên kết | Không trỏ tới Quiz / Sổ lỗi sai / Bài giảng / Đề thi |
| Lưu trạng thái | Chỉ lưu tab lớp đang chọn (`cs-home-grade`) |

Kết luận: card hiện là **menu tĩnh gọi AI**, chưa phải "lộ trình".

---

## 2. Dữ liệu app đã có, dùng được ngay (không cần xây mới)

| Nguồn | Dùng cho |
|---|---|
| `src/data/chemTopics.js` — id chuẩn (`c11-equilibrium`, `c11-alcohol`, …) | Gắn id cho từng chuyên đề → mọi thống kê đều nối được |
| `questions.topic_id` | Biết câu hỏi thuộc chương nào |
| `user_answers` (attempt_id, question_id, answer, đúng/sai) | **Tính % đúng thật theo từng chương** |
| `wrong_questions` (+ `mastered`) | Sổ lỗi sai theo chương, đếm câu chưa khắc phục |
| `exam_attempts` | Số đề đã làm, điểm, lần gần nhất |
| `courses` / `course_chapters` / `course_slides` / `slide_progress` | Nếu giáo viên có bài giảng → tiến độ xem slide |
| `user_credits` / `creditService` | Thưởng điểm khi hoàn thành chương |
| `AIQuizGenerator` (đã sinh câu hỏi kèm `topic_id`) | "Luyện 5 câu chương này" ngay từ card |

Điểm mấu chốt: **chỉ cần gắn `topic_id` vào lộ trình là mở ra được toàn bộ hệ sinh thái trên.**

---

## 3. Ý tưởng nâng cấp (12 cái, xếp theo giá trị/công sức)

### Nhóm A — Biến lộ trình thành dữ liệu thật

**A1. Tách lộ trình ra file riêng, gắn id chuẩn** · S
`src/data/roadmap.js`: mỗi chuyên đề = `{ id, name, order, prereq[], examWeight }`, id lấy đúng từ `chemTopics.js`. Xoá bản trùng trong `pages/Home.jsx`.
→ Mọi tính năng bên dưới đều phụ thuộc vào bước này.

**A2. Chip = 3 hành động thay vì 1** · M
Bấm chip mở bottom-sheet (mobile) gồm:
- **Học nhanh** — tóm tắt trọng tâm bằng AI (giữ tính năng cũ);
- **Luyện 5 câu** — sinh quiz có `topic_id` đúng chương, chấm ngay tại chỗ;
- **Sổ lỗi sai** — mở `#notebook` đã lọc sẵn theo chương đó.

**A3. Deep link mỗi chương** · S
`#home?topic=c11-alcohol` → tự mở đúng tab lớp + highlight chip. Chia sẻ được link chương cho học sinh, giáo viên gửi bài tập theo chương.

### Nhóm B — Tiến độ & độ thành thạo (giá trị cao nhất)

**B1. Vòng % thành thạo trên từng chip** · M
Tính từ `user_answers` join `questions.topic_id`: `đúng / (đúng + sai)`. Màu: <50% xám, 50–79% vàng, ≥80% xanh. Chưa làm câu nào → để trống, không bịa số.

**B2. "Chương nên học tiếp"** · S
Tự chọn chương đầu tiên có `% < 70` và đã đủ điều kiện tiên quyết → ghim lên đầu card kèm nút "Vào học". Đây là thứ khiến nó thành *lộ trình* chứ không phải danh sách.

**B3. Thanh tiến độ cả năm + mốc** · M
Dải tiến độ theo `order` của chương, có mốc "xong học kỳ 1", "đủ nền thi tốt nghiệp". Hiển thị `đã xong 3/6 chương`.

**B4. Khóa theo điều kiện tiên quyết (tuỳ chọn)** · M
Ví dụ Hiđrocacbon cần Đại cương hữu cơ ≥60%. Nên để **mềm**: hiện gợi ý "nên học trước", không chặn cứng (học sinh ghét bị chặn, và giáo viên dạy lệch thứ tự).

### Nhóm C — Cá nhân hóa & ôn tập

**C1. Ôn tập ngắt quãng (SRS)** · M
Mỗi chương có "hạn ôn" theo lịch 1–3–7–14–30 ngày kể từ lần luyện cuối. Hết hạn → chip có chấm đỏ + nhóm "Cần ôn hôm nay" ở đầu card.

**C2. Streak + thưởng điểm** · S
Học/luyện mỗi ngày → chuỗi ngày; hoàn thành chương (≥80% + 0 câu sai chưa sửa) → cộng credit qua `creditService` (đã có sẵn cơ chế trừ/cộng).

**C3. AI coach 7 ngày** · L
Đọc điểm yếu theo chương + sổ lỗi sai → sinh kế hoạch 7 ngày (mỗi ngày 1 chương + 5 câu). Trả về JSON có cấu trúc để render thành checklist, không phải chat suông.

### Nhóm D — Cho giáo viên & lớp

**D1. Giao lộ trình cho lớp** · L
Giáo viên chọn lớp → gán lộ trình + hạn chót; học sinh thấy "Tuần này: Cân bằng hóa học". Dùng lại `classroom.js` (đã có lớp/thành viên).

**D2. Heatmap lớp theo chương** · L
Bảng chương × học sinh, ô càng đỏ càng yếu → giáo viên biết cho ôn chương nào. Có dữ liệu là làm được, nhưng đây là màn riêng (teacher dashboard).

### Nhóm E — Trải nghiệm & kỹ thuật

**E1. Mobile-first: chip gọn 2 dòng + vuốt đổi lớp** · S
Hiện chip dài dễ xuống dòng xấu trên 360px. Bo góc, giới hạn 2 dòng, chấm % bên phải, vuốt ngang để đổi Lớp 10/11/12.

**E2. Trọng số thi tốt nghiệp** · S
Mỗi chương có `examWeight` (tĩnh, ghi rõ nguồn: cấu trúc đề tham khảo) → hiện "chiếm ~12% đề". Giúp học sinh ưu tiên ôn đúng chỗ.

---

## 4. Đề xuất triển khai theo 3 đợt

### Đợt 1 — "Lộ trình biết nói" (1–2 ngày, không cần đổi schema DB)
- A1 (roadmap.js + id chuẩn, xoá file trùng)
- A2 bottom-sheet 3 hành động
- B2 "Chương nên học tiếp"
- B3 thanh tiến độ năm
- E1 chip gọn cho mobile

Kết quả: bấm chuyên đề là **học / luyện / sửa lỗi** đúng chương, có tiến độ thật, biết học gì tiếp.

### Đợt 2 — Cá nhân hóa (3–5 ngày)
- B1 vòng % thành thạo (join `user_answers` × `questions.topic_id`)
- C1 ôn tập ngắt quãng + nhóm "Cần ôn hôm nay"
- C2 streak + thưởng credit
- A3 deep link chương

### Đợt 3 — Giáo viên & AI (1 tuần+)
- D1 giao lộ trình, D2 heatmap lớp
- C3 AI coach 7 ngày
- E2 trọng số thi

---

## 5. Phác thảo giao diện card mới

```
┌──────────────────────────────────────────────┐
│ 📘 Lộ trình kiến thức              Lớp 10 11 12 ĐH │
│                                              │
│  ▶ HỌC TIẾP: Cân bằng hóa học   ▓▓▓▓▓░░ 62%  │
│                                              │
│  ▓▓▓▓▓▓░░░░░░░░  đã xong 2/6 chương          │
│                                              │
│  ① Cân bằng hóa học              ◔ 62%  ›    │
│  ② Nitơ & lưu huỳnh              ○  –    ›   │
│  ③ Đại cương hữu cơ              ◕ 88%  ›    │
│  ④ Hiđrocacbon                   ◔ 45%  🔔   │
│  …                                           │
│  [Cần ôn hôm nay: Hiđrocacbon, Ancol]        │
└──────────────────────────────────────────────┘
```

---

## 6. Lưu ý khi làm

- **Không đổi `topic_id` đã gắn cho câu hỏi** (ghi rõ trong `chemTopics.js`) — đổi là lệch toàn bộ thống kê cũ.
- **Không bịa số**: chương chưa có dữ liệu thì hiện "chưa luyện", không hiện 0% như đã học mà kém.
- Chỉ nên query 1 lần khi vào Home (gộp bằng view/RPC) — tránh 6 truy vấn cho 6 chip trên máy yếu; tôn trọng `perf-lite`.
- Mọi tính năng mới phải chịu được màn 360px và bàn phím ảo.
- Nếu `exam_attempts`/`user_answers` chưa có RLS đúng, phần % sẽ trả về rỗng — kiểm tra trước khi hứa với người dùng.
