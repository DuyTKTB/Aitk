# Nâng cấp AITK: Quản lý giáo viên bộ môn & Trung tâm phân tích học tập bằng AI

Tài liệu bàn giao — ngày 26/10/2026. Mọi số liệu dưới đây lấy từ mã nguồn đã sửa trong repo này.

---

## 1. Audit hiện trạng trước khi sửa

| Hạng mục | Hiện trạng ghi nhận |
|---|---|
| Frontend | React 18 + Vite 5, không có router lib (điều hướng bằng hash trong `src/lib/routes.js`) |
| Backend | `functions/` (Firebase Functions v1): `elecaiWebhook`, `processSignUp`, `expireVip`, `syncIdentCode`, `askAI`, `askAIBatch` |
| Auth | Firebase Authentication; hồ sơ người dùng ở `users/{uid}` |
| Dữ liệu lớp | `classes/{classId}`: `teacherId`, `teacherName`, `key`, `members[]`, `memberIds[]`, `pendingMembers[]` |
| Đề & bài nộp | `exams/{examId}` (có `classId`, `teacherId`, `questions[]` với `topic`, `level`, `correct`), `submissions/{id}` (có `score`, `totalPoints`, `detail[]`, `submittedAt`) |
| GVBM (trước nâng cấp) | `class_teacher_keys/{KEY}` + `class_teachers/{classId_uid}`; key **không giới hạn số lần dùng**, môn do giáo viên tự khai, không có nhật ký, không có trạng thái tài khoản |
| AI | `src/lib/examAiUtils.js → callModel()` (1 điểm gọi chuẩn của app), có cơ chế `setModelCaller` để chuyển sang Cloud Function; backend `functions/aiProxy.js` cung cấp `askAI` (HTTP) |
| Kiểm thử | vitest (11 tệp), chưa có test cho phần giáo viên bộ môn |

Kết luận audit: dữ liệu để phân tích học tập **đã có sẵn** (`exams.questions[].topic`, `submissions.detail[]`), nên không cần thêm collection nguồn; chỉ thiếu (a) ràng buộc chặt cho key, (b) tầng thống kê, (c) tầng AI + lưu báo cáo, (d) nhật ký và rules cho dữ liệu mới.

---

## 2. File đã chỉnh sửa / file mới

### Tạo mới

| Tệp | Vai trò |
|---|---|
| `src/lib/learningAnalytics.js` | Engine thống kê thuần JS: khoảng thời gian, KPI, theo môn, timeline, phân bố điểm, chủ đề, từng học sinh, cảnh báo sớm, chất lượng dữ liệu, fingerprint |
| `src/lib/learningAnalyticsReport.js` | Hợp đồng dữ liệu với AI: payload ẩn danh, prompt, JSON schema, `validateReport`, `auditNumbers`, báo cáo fallback bằng luật |
| `src/lib/learningAnalyticsAi.js` | Gọi AI qua kênh sẵn có (Cloud Function `askAI` nếu cấu hình, ngược lại `callModel`), xử lý lỗi/hết điểm |
| `src/lib/analyticsReports.js` | Lưu/đọc báo cáo Firestore theo lớp + khoảng thời gian + môn + phiên bản dữ liệu |
| `src/lib/classTeachersCore.js` | Logic thuần của module GVBM (đánh giá key, trạng thái, tổng hợp hoạt động) — tách để test không cần Firebase |
| `src/components/teacher/LearningAnalytics.jsx` | UI Trung tâm phân tích (6 khu vực) |
| `src/components/teacher/analyticsCharts.jsx` | Biểu đồ SVG (cột, thanh ngang, chỉ số) — không thêm thư viện |
| `src/styles/learning-analytics.css` | Style riêng, dùng token sẵn có, có dark mode + responsive |
| `src/components/teacher/LinkedClassesPanel.jsx` | Danh sách lớp đã liên kết của GVBM: giao đề, mở/giám sát phòng thi, xem kết quả từng đề |
| `src/styles/learning-analytics.css` (bổ sung) | Khối `.la-bands/.la-band/.la-link` cho bảng xếp loại |
| `tests/learningAnalytics.test.js` | 44 test cho engine thống kê (gồm xếp loại Giỏi/Khá/TB/Yếu) |
| `tests/learningAnalyticsReport.test.js` | 23 test cho validate/audit/fallback |
| `tests/classTeachers.test.js` | 26 test cho key & hoạt động GVBM |

### Chỉnh sửa

| Tệp | Thay đổi |
|---|---|
| `src/lib/classTeachers.js` | v2: key gắn môn bắt buộc, `maxUses/uses/usedBy`, tự vô hiệu khi hết lượt, email người nhận, nhật ký, trạng thái tài khoản; re-export logic thuần từ `classTeachersCore.js` |
| `src/components/teacher/SubjectTeacherPanel.jsx` | v2: tạo key có môn/email/số lượt, danh sách key có trạng thái + hạn + lượt, bảng GVBM có tìm kiếm/lọc môn/trạng thái/chi tiết đề, cảnh báo trùng môn, nhật ký |
| `src/components/teacher/LinkClassPanel.jsx` | Môn lấy từ key (ô nhập chỉ còn là fallback cho key cũ); nêu rõ key dùng 1 lần |
| `src/components/ClassDetailModal.jsx` | Thêm tab **Phân tích AI**, truyền `classInfo`, `exams`, `submissionsMap` thật vào panel; tab **Giáo viên bộ môn** chuyển lên cạnh “Thành viên” để không bị cắt khỏi dải tab |
| `src/components/TeacherDashboard.jsx` | Nút “Giao đề lớp khác” mở panel lớp đã liên kết (giao đề + giám sát) thay vì chỉ nhập mã lớp; “Giao đề” chuyển sang `CreateExamPage` 3 tab khoá đúng lớp (`extCreate`); nhận session mới để mở `LiveProctorView` |
| `src/styles/class-detail.css` | Dải tab xuống dòng ở màn ≥721px (trước đây tab cuối bị ẩn sau vùng cuộn không có thanh cuộn) |
| `src/components/MyClasses.jsx` | Học sinh: chia đề theo môn, mỗi môn có điểm TB + xếp loại học lực; thẻ tổng quan thêm “Học lực tổng hợp” |
| `src/styles/class-apple.css` | Style `.ap-subject-group*`, `.ap-band.*`, `.ap-overall-band` |
| `src/styles/subject-teachers.css` | Bổ sung style cho cảnh báo, meta key, tìm kiếm, nhật ký |
| `src/lib/aiClient.js` | Hỗ trợ `AbortSignal` (nút "Dừng" của báo cáo AI) |
| `firestore.rules` | Ràng buộc key v2, nhật ký, báo cáo phân tích |

---

## 3. Cấu trúc dữ liệu Firestore

### 3.1 Có sẵn (không đổi schema)

- `classes/{classId}` — chỉ đọc.
- `exams/{examId}` — chỉ đọc; trường dùng để phân tích: `classId`, `teacherId`, `teacherName`, `subject`, `createdAt`, `opensAt`, `closesAt`, `questions[].topic`, `questions[].correct`, `totalPoints`.
- `submissions/{id}` — chỉ đọc; dùng `examId`, `studentId`, `score`, `totalPoints`, `detail[].isCorrect`, `submittedAt`.

### 3.2 Nâng cấp: `class_teacher_keys/{KEY}`

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `classId`, `className` | string | lớp được cấp |
| `createdBy`, `createdByName` | string | chủ nhiệm tạo key |
| `subject` | string | **bắt buộc** — môn của giáo viên sẽ liên kết |
| `email` | string | tuỳ chọn, người nhận dự kiến |
| `expiresAt`, `days` | timestamp / number | hạn dùng (1/7/30 ngày) |
| `maxUses`, `uses` | number | mặc định 1 lượt |
| `usedBy` | map<uid, ms> | chống 1 tài khoản dùng lại; audit ai đã dùng |
| `revoked`, `revokeReason`, `revokedAt` | bool / string / ts | `manual` (chủ nhiệm thu hồi) hoặc `used` (hết lượt) |

DocId chính là key (giữ nguyên thiết kế cũ để rules tra cứu trực tiếp). Key **không** lưu bản sao văn bản ở trường khác; vòng đời ngắn (≤30 ngày) + 1 lượt + thu hồi được giảm thiểu rủi ro lộ.

### 3.3 Nâng cấp: `class_teachers/{classId_teacherId}`

Giữ nguyên khoá; bổ sung `subjectSource` (`key` | `self`), `permissions`, `linkedAtMs`, `className`, `email`.

### 3.4 Mới: `class_teacher_audit/{autoId}`

`classId`, `action` (`key_create` | `key_revoke` | `teacher_link` | `teacher_unlink` | `report_generate`), `actorId`, `actorName`, `teacherId`, `teacherName`, `key`, `subject`, `detail`, `at`, `atMs`.

### 3.5 Mới: `class_analytics_reports/{docId}` (+ bản phiên bản)

DocId = `{classId}__{rangeKey}[__from_to][__subject]`. Trường chính:

| Trường | Ý nghĩa |
|---|---|
| `classId`, `rangeKey`, `rangeLabel`, `from`, `to`, `focusSubject` | phạm vi báo cáo |
| `dataFingerprint` | dấu vân tay dữ liệu lúc tạo → phát hiện báo cáo cũ |
| `version`, `versionsOf` | phiên bản; bản cũ lưu thành `{docId}__v000N` cùng collection |
| `engine`, `schemaVersion`, `aiError` | `ai` hay `rule`, và lý do nếu AI lỗi |
| `report` | `{ summary, findings, evidence, risks, recommendations, perSubject, limitations }` |
| `metrics` | ảnh chụp nhanh: số đề, bài nộp, học sinh, điểm TB, tỷ lệ hoàn thành, số cảnh báo |
| `generatedAt`, `generatedAtMs`, `createdBy`, `createdByName` | thời điểm & người tạo |

Không dùng subcollection để rules giới hạn được theo `classId` trên mọi bản ghi.

---

## 4. Hệ thống key liên kết — cách hoạt động

1. **Chủ nhiệm tạo key**: chọn môn (bắt buộc, lấy từ danh mục `src/lib/subjects.js` + môn đã có trong lớp), email người nhận (tuỳ chọn), hạn (1/7/30 ngày), số lượt (1/2/5). Client kiểm tra, server kiểm tra lại.
2. **Giáo viên bộ môn nhập key** bằng tài khoản riêng → `linkTeacherWithKey()`:
   - đọc key, `evaluateKey()` kiểm tra: tồn tại → chưa thu hồi → chưa hết hạn → còn lượt → chưa dùng bởi chính uid → không phải chủ lớp;
   - đọc lớp để chắc lớp còn tồn tại;
   - môn của liên kết **lấy từ key** (không cho tự khai khác phân công);
   - ghi `class_teachers/{classId_uid}`;
   - tăng `uses`, ghi `usedBy`, tự đặt `revoked: true, revokeReason: 'used'` khi hết lượt;
   - ghi nhật ký `teacher_link`.
3. **Firestore Rules kiểm tra lại toàn bộ** ở thời điểm ghi (không tin client): key còn hiệu lực, còn lượt, đúng lớp, đúng môn, không phải người tạo, lớp tồn tại; nhánh cập nhật key của giáo viên chỉ cho đổi đúng 6 trường `uses/usedBy/lastUsedAt/revoked/revokeReason/revokedAt` và bắt buộc `uses == uses_cũ + 1`.
4. **Thu hồi**: chủ nhiệm thu hồi key bất kỳ lúc nào; gỡ liên kết bằng nút "Gỡ" (chủ nhiệm) hoặc tự gỡ (giáo viên). Cả hai đều ghi nhật ký.
5. **Ghi nhận đề đã giao**: hệ thống **không tạo bảng mới**; đề đã giao cho lớp chính là `exams` có `classId === lớp` — đây là nguồn duy nhất cho mọi thống kê, tránh lệch số liệu.

---

## 5. Kiến trúc AI — truy xuất, phân tích, lưu báo cáo

### Bước 1 — Truy xuất
`ClassDetailModal` đã tải đề của lớp và bài nộp từng đề; `LearningAnalytics` nhận đúng tập dữ liệu đó và danh sách GVBM liên kết (`class_teachers`), trạng thái tài khoản (`users`), nhật ký (`class_teacher_audit`).

### Bước 2 — Tính toán bằng code
Toàn bộ chỉ số nằm ở `buildLearningAnalytics()`. AI **không** tính lại số. Bảng công thức:

| Chỉ số | Công thức | Khi thiếu dữ liệu |
|---|---|---|
| Số đề | số `exams` có `classId = lớp` và thời điểm giao trong khoảng | 0 |
| Lượt làm bài | số `submissions` của các đề đó, `submittedAt` trong khoảng | 0 |
| Tỷ lệ hoàn thành | `lượt nộp / (số đề × số học sinh)`, chặn trần 100% | `null` nếu chưa có đề/học sinh |
| Tỷ lệ tham gia | `học sinh có ≥1 bài / tổng học sinh` | `null` nếu lớp 0 học sinh |
| Điểm TB | trung bình `% điểm` của từng bài = `score/totalPoints×100` | `null` nếu chưa có bài |
| Trung vị, độ lệch chuẩn | tính trên cùng tập `% điểm` | `null` |
| Tỷ lệ đạt | `số bài ≥50% / số bài có điểm` | `null` |
| Theo môn | nhóm đề theo `exam.subject`, thiếu thì lấy môn của GV đã liên kết | môn đã phân công vẫn hiện với `exams = 0` |
| Theo chủ đề | từ `questions[].topic` + `submissions.detail[].isCorrect` | bỏ câu không có dữ liệu trả lời |
| Xu hướng học sinh | so `mean(nửa đầu)` với `mean(nửa cuối)` chuỗi bài đã nộp (cần ≥3 bài) | `unknown` |

### Bước 3 — Gửi dữ liệu phù hợp
`buildAiContext()` chỉ gửi số tổng hợp: quy mô, chỉ số, theo môn, theo giáo viên (tên GV — cần cho ngữ cảnh), timeline, phân bố, chủ đề, và **học sinh đã ẩn danh `HS01…HS25`**. Không gửi email, không gửi tên học sinh, không gửi câu trả lời thô. Cảnh báo do máy tính sinh ra (có chứa tên học sinh) cũng được thay tên bằng mã trước khi gửi (có test).

### Bước 4 — AI trả JSON có schema
- System prompt quy định rõ: chỉ diễn giải trên số liệu gửi kèm, không tự tính, không suy nguyên nhân khi thiếu căn cứ, không xếp loại giáo viên theo số lượng đề, không dán nhãn học sinh.
- Schema đầu ra: `summary`, `findings[]`, `evidence[]`, `risks[]`, `recommendations[]` (mỗi đề xuất có `target`, `timeframe`, `basedOn`), `perSubject[]`, `limitations[]`.
- `validateReport()` chuẩn hoá/kiểm tra: thiếu `summary` → lỗi; nội dung rỗng → lỗi; cắt độ dài; bỏ thẻ HTML; giới hạn số phần tử; đọc được cả khoá tiếng Việt nếu AI trả sai tên khoá.
- `auditNumbers()` đối chiếu mọi phát biểu `x%` với tập số liệu đã tính (cho phép lệch ±1 do làm tròn). Số không khớp bị liệt kê và ghi vào `limitations`.
- Sai JSON → thử lại 1 lần với nhiệt độ thấp hơn; vẫn lỗi → trả **báo cáo bằng luật** với `engine = 'rule'` và nêu lý do, UI hiển thị rõ "không phải nhận định của AI".

### Bước 5 — Lưu trữ & chống gọi lặp
- Lưu 1 doc "mới nhất" + 1 doc phiên bản cho mỗi lần tạo.
- `dataFingerprint` (băm số đề/bài nộp/điểm cuối/khoảng) dùng để phát hiện báo cáo cũ: UI hiện banner "Báo cáo được tạo lúc … — dữ liệu lớp đã thay đổi" kèm nút tạo lại, và luôn hiển thị "Dữ liệu lúc tạo: N bài nộp".
- Không tự động gọi AI: chỉ gọi khi chủ nhiệm bấm nút, và chặn khi chưa có bài nộp nào.

### Kênh gọi AI
1. `VITE_FUNCTIONS_ENDPOINT` có cấu hình → gọi Cloud Function `askAI` (`functions/aiProxy.js`): API key ở server, đọc `GEMINI_API_KEY` từ Secret Manager/env.
2. Không cấu hình → dùng lớp AI sẵn có của app (`examAiUtils.callModel`, tức `VITE_GEMINI_KEY` như tính năng tạo đề hiện tại, hoặc custom caller nếu `installAiProxy` được bật).
3. Không có cả hai → không gọi được, UI báo đúng lỗi và dùng báo cáo bằng luật.

Không thêm nhà cung cấp, model hay API key mới.

---

## 6. Cảnh báo sớm (tính bằng luật, không phụ thuộc AI)

| Loại | Ngưỡng (trong `THRESHOLDS`) | Mức |
|---|---|---|
| `student_missing` — bỏ bài | ≥3 đề chưa làm, hoặc ≥50% số đề (khi có ≥2 đề) | cao nếu ≥3 đề |
| `student_decline` — giảm điểm | nửa cuối thấp hơn nửa đầu ≥10 điểm % (≥3 bài) | cao nếu ≤ −20 |
| `topic_weak` — chủ đề yếu | <50% đúng và ≥8 lượt trả lời | cao nếu <35% |
| `subject_low_participation` | <50% lượt làm bài, lớp ≥5 học sinh | trung bình |
| `subject_no_data` | môn có GV nhưng 0 đề, hoặc có đề nhưng 0 bài nộp | trung bình |
| `abnormal_exam` — bất thường | ≥5 bài mà TB <20% hoặc mọi bài cùng điểm | thấp/cao |

Mỗi cảnh báo có: nội dung, **dữ liệu căn cứ**, mức ưu tiên, giải thích vì sao, hành động đề xuất, thời điểm phát hiện. Cảnh báo chạy được cả khi AI lỗi.

---

## 7. Bảo mật & quyền riêng tư

| Yêu cầu | Cách xử lý |
|---|---|
| Xác thực & phân quyền ở backend | Firestore Rules kiểm tra `request.auth.uid` + `classes/{id}.teacherId` cho mọi ghi/đọc mới |
| Không xem lớp khác | `class_analytics_reports` chỉ chủ lớp đọc/ghi; `class_teacher_audit` chỉ chủ lớp hoặc chính người thao tác |
| Không tin `classId/teacherId/role` từ client | Rules đối chiếu với doc `classes` và `class_teacher_keys`; `teacherId` phải bằng uid, `role` phải là `subject` |
| Không lộ API key | Ưu tiên Cloud Function; key không xuất hiện trong báo cáo/log |
| Hạn chế PII trong báo cáo AI | Học sinh → `HSxx`; không email; không tên học sinh (có test) |
| Ghi nhận hoạt động quan trọng | `class_teacher_audit`: tạo/thu hồi key, liên kết, gỡ liên kết, tạo báo cáo |
| Giáo viên rời lớp | Gỡ liên kết xoá `class_teachers`; key hết lượt/hết hạn tự vô hiệu; nhật ký giữ lại |
| Key dùng sai | 1 lượt mặc định, chặn dùng lại cùng uid, có hạn, thu hồi được |

### 7.1. Siết quyền `classes` / `exams` / `submissions` (đợt B)

Trước đây cả 3 collection mở cho mọi user đã đăng nhập (kể cả xoá). Nay:

| Collection | Quyền sau khi siết |
|---|---|
| `classes` | Đọc: vẫn mở (luồng nhập key phải tìm được lớp trước khi vào). Tạo: `teacherId == uid`. Sửa: chủ lớp, **hoặc** học sinh chỉ thêm/gỡ **chính mình** trong `members/memberIds/pendingMembers/pendingIds` (không đổi `teacherId`, `key`). Xoá: chủ lớp. |
| `exams` | Đọc: giữ mở (học sinh vào thi bằng token/link). Tạo: `teacherId == uid` **và** (chủ lớp hoặc GVBM đã liên kết của lớp đó). Sửa: tác giả đề hoặc chủ lớp, **không được đổi `classId`/`teacherId`**. Xoá: tác giả, chủ lớp, admin. |
| `exams/{id}/private` | Tác giả đề hoặc chủ lớp (client hiện không dùng). |
| `submissions` | Đọc/ghi: học sinh chỉ bài của mình; giáo viên chỉ bài của đề mình tạo; chủ lớp mọi bài trong lớp (tra `examId → classId`). Xoá: tác giả/chủ lớp/admin. |
| `notices` | Chỉ người nhận; người tạo phải là chủ lớp hoặc GVBM đã liên kết, người nhận phải đúng chủ nhiệm lớp đó. |

Đã deploy lên `duyheheh-2a269` (rules biên dịch hợp lệ). **Chưa có emulator** trong môi trường này (không có Java) nên không chạy được rules-unit-testing; thay vào đó đã rà từng đường ghi thực tế trong `classroom.js` (join/leave/duyệt thành viên/nộp bài/chấm lại/xoá đề) để khớp rule.

**Rủi ro còn lại (ghi rõ):** điểm được chấm ở client rồi ghi vào `submissions`, nên học sinh vẫn có thể sửa `score` của bài mình — chống tuyệt đối cần chuyển chấm điểm sang Cloud Function. Đọc `classes` vẫn mở nên danh sách thành viên (tên/email) của một lớp có thể bị đọc bởi user đã đăng nhập nếu biết `classId`.

---

## 8. Giao diện

Tab **Phân tích AI** trong modal chi tiết lớp (`ClassDetailModal`), gồm:

1. **Tổng quan**: 6 thẻ KPI (học sinh, GVBM, đề, lượt làm bài, tỷ lệ hoàn thành, điểm TB) + điểm TB theo môn.
2. **Hoạt động giáo viên bộ môn**: bảng có tìm kiếm, lọc môn, cột số đề/lượt làm bài/tham gia/điểm TB/trạng thái, mở rộng xem từng đề.
3. **Biểu đồ**: số đề theo thời gian, số đề theo môn, tỷ lệ hoàn thành, xu hướng điểm, phân bố điểm, tỷ lệ đúng theo chủ đề — mỗi biểu đồ có trạng thái "chưa đủ dữ liệu" riêng.
4. **Báo cáo chuyên sâu theo môn**: chọn môn → số đề, bài nộp, điểm TB, độ phủ chủ đề, xu hướng, bảng đề, chủ đề cần ôn.
5. **EARLY WARNING**: danh sách cảnh báo, lọc theo mức ưu tiên.
6. **Báo cáo AI**: nút tạo/tạo lại/dừng, trạng thái đang phân tích, banner báo cáo cũ, các khối tóm tắt — phát hiện — vấn đề ưu tiên — khuyến nghị — phân tích theo môn — dẫn chứng — giới hạn, kèm thời điểm, phạm vi, phiên bản.
7. **Chất lượng dữ liệu & nhật ký**: độ đầy đủ (điều kiện ≥5 bài nộp, ≥2 đề có kết quả, ≥3 học sinh), ghi chú thiếu metadata, nhật ký 12 hoạt động gần nhất.
8. Bảng học sinh thu gọn (đã nộp/thiếu/điểm TB/xu hướng) để đối chiếu cảnh báo.

Toàn bộ nút/bộ lọc/biểu đồ nối với dữ liệu thật; có trạng thái tải, trống, lỗi. Responsive: 2 cột → 1 cột ở 720px, KPI 1 cột ở 460px, bảng cuộn ngang có sticky header. Không dùng gradient mạnh/glow/animation (chỉ spinner khi đang gọi AI).

### 8.1. “Giao đề lớp khác” — lớp đã liên kết, giao đề và giám sát (phía GVBM)

`src/components/teacher/LinkedClassesPanel.jsx` thay cho ô nhập mã lớp đơn lẻ trước đây
(ô nhập mã vẫn còn trong mục “Hoặc dùng mã lớp” để tương thích).

- Danh sách lấy từ `class_teachers` với `teacherId == uid` — chỉ lớp đã liên kết thật.
- Mỗi lớp hiển thị: tên lớp, môn đã gắn ở key, giáo viên chủ nhiệm, sĩ số, ngày liên kết.
- **Giao đề**: mở đúng trang tạo đề 3 tab của mục “AI Tạo đề” (`CreateExamPage`:
  **Tạo bằng AI (AutoExam Studio)** · **Soạn thủ công** · **Nhập từ file**) và khoá
  `classInfo`/`classes` vào lớp vừa chọn, nên không thể giao nhầm lớp. Đề tạo ra có
  `classId` của lớp, `teacherId` là tài khoản GVBM ⇒ chủ nhiệm thấy ngay trong bảng GVBM
  và Phân tích AI. Rời trang tạo đề sẽ tự bỏ khoá lớp (`goSection` reset `extCreate`).
- **Giám sát**: nếu đề đang có phòng thi LIVE → mở `LiveProctorView`; nếu chưa có thì hỏi
  xác nhận (“Mở phòng thi trực tiếp?”) rồi mới `createExamSession` — không tự mở phòng
  khi người dùng chỉ xem danh sách.
- **Kết quả**: bảng điểm từng đề (học sinh · điểm · % · thời điểm nộp), đọc từ `submissions`.
- **Sửa**: mở lại `ExamEditModal` (thông tin, câu hỏi/đáp án, thời gian mở–đóng, camera &
  chống gian lận) cho đề đã giao; danh sách lớp/đề được khoá vào lớp đã liên kết và
  làm mới ngay sau khi lưu.
- Chỉ đề do chính GVBM giao (`exams.teacherId == uid`) mới hiện trong bảng của họ.

### 8.2. Xếp loại học sinh theo môn (phía chủ nhiệm)

Bổ sung trong tab **Phân tích AI**:

- **Bảng tổng quan theo môn** (§4): môn · giáo viên bộ môn đã liên kết · số đề · lượt nộp ·
  điểm TB · **số học sinh Giỏi / Khá / Trung bình / Yếu / chưa có bài**; bấm “Xem học sinh”
  để nhảy sang môn đó.
- **Bảng xếp loại từng học sinh của môn đang chọn**: bài đã làm/đề của môn · điểm TB ·
  cao nhất · thấp nhất · bài gần nhất · xếp loại.

Ngưỡng quy đổi từ thang 10 sang % (`BANDS` trong `learningAnalytics.js`):
Giỏi ≥ 80% (≥ 8.0) · Khá 65–79% (6.5–7.9) · Trung bình 50–64% (5.0–6.4) · Yếu < 50% (< 5.0).

### 8.3. Hiển thị lớp/môn/chủ nhiệm và chia mục theo môn cho học sinh

- **Thẻ đề của giáo viên** (`TeacherDashboard` → mục Đề thi): dòng mô tả nay ghi rõ
  `Lớp … · Môn … · GV chủ nhiệm: … · n câu · m phút`; tiêu đề nhóm lớp ghi
  `Toán, Hóa học · n đề · GV chủ nhiệm: … · n HS`. Danh sách lớp dùng cho việc tra cứu
  gồm cả lớp **đã liên kết** (`class_teachers`) nên đề giao cho lớp khác không còn hiện
  “Lớp —”.
- **Trang “Lớp học của tôi” của học sinh** (`MyClasses`): danh sách đề được **chia mục
  theo môn**; mỗi mục có số đề, số bài đã làm, điểm TB và **xếp loại học lực** của môn đó
  (cùng ngưỡng với giáo viên). Thẻ tổng quan có thêm dòng “Học lực tổng hợp”.
  Môn lấy từ đề → câu hỏi đầu tiên → môn của lớp; môn chưa có bài nào thì ghi “Chưa có điểm”,
  không xếp loại.

Quy ước chống diễn giải sai: học sinh **chưa làm bài nào** vào nhóm “chưa có bài”,
không bị xếp Yếu; mới có 1 bài thì vẫn xếp loại nhưng gắn nhãn **“ít dữ liệu”**;
mọi bảng đều ghi rõ đây là mô tả kết quả kiểm tra, không phải kết luận về năng lực.

### 8.4. Đợt nâng cấp bổ sung

| Việc | Chi tiết |
|---|---|
| Tiêu thụ key nguyên tử | `linkTeacherWithKey`: nếu cập nhật `uses` của key thất bại thì **xoá liên kết vừa tạo** và báo lỗi, tránh key “chưa dùng” bị dùng lại. |
| Quản lý đề ngay trong panel lớp liên kết | Thêm nút **Quản lý** mở `ExamManagePanel` (gia hạn +15/30/60′, đóng–mở, nhân bản, sửa nhanh, phân tích đáp án, chấm lại) và nút **Xoá** (có xác nhận). |
| Ngưỡng xếp loại theo lớp | `classInfo.bandThresholds` + `resolveBands()`; mặc định 80/65/50. Sửa được trong tab Phân tích AI (chỉ chủ lớp), học sinh đọc cùng ngưỡng. Dữ liệu hỏng tự về mặc định. |
| Xuất CSV | Nút **Xuất CSV** trong bảng tổng quan theo môn: mỗi dòng = 1 học sinh/môn (TB, cao nhất, thấp nhất, xếp loại), có BOM UTF-8 để Excel không lỗi dấu. |
| Cảnh báo mới | `teacher_idle`: GVBM đã liên kết ≥7 ngày mà chưa giao đề trong khoảng xem (mức thấp, câu chữ nêu rõ **số đề không phản ánh năng lực giảng dạy**). |
| AI có dữ liệu xếp loại | `theoMon[].xepLoai = {gioi, kha, trungBinh, yeu, chuaCoBai}` để nhận định về mức học sinh có căn cứ tính sẵn. |
| Mobile | Bảng đề trong panel lớp liên kết chuyển thành **card dọc** ở ≤560px (nhãn lấy từ `data-label`), không phải kéo ngang. |
| Ngữ cảnh khi giao đề | Trang tạo đề 3 tab có thanh “Đang giao đề cho lớp … · GV chủ nhiệm …” + nút Huỷ khi vào từ panel lớp liên kết. |
| Chủ nhiệm đúng | `buildTeacherActivity` nhận `ownerId` từ hồ sơ lớp, không suy ra từ tác giả đề; thêm trạng thái “Chưa liên kết”. |

### 8.5. Trung tâm thông báo (chuông)

Collection mới `notices/{id}` — chỉ người nhận đọc được.

| Trường | Ý nghĩa |
|---|---|
| `toUid` | Chủ nhiệm nhận thông báo (rules bắt buộc bằng `classes.teacherId`) |
| `actorId`, `actorName` | Người gây ra sự việc (GVBM) |
| `type` | `teacher_link` · `teacher_unlink` · `exam_assigned` |
| `classId`, `className`, `subject` | Ngữ cảnh |
| `title`, `body`, `tab` | Hiển thị + tab cần mở (`teachers` / `exams`) |
| `createdAtMs`, `read`, `readAt` | Sắp xếp (client) và trạng thái đã đọc |

Luồng: `linkTeacherWithKey` → gửi `teacher_link`; `unlinkTeacher` → `teacher_unlink`;
tạo đề trong lớp đã liên kết (`CreateExamPage` onDone ở luồng `extCreate`) → `exam_assigned`.
Không bao giờ tự gửi cho chính mình (`buildNotice` trả `null`). Gửi lỗi chỉ `console.warn`,
không làm hỏng liên kết/giao đề.

UI: nút chuông trên topbar (badge bật khi có thông báo chưa đọc) → modal “Thông báo”:
chưa đọc trước, mỗi dòng có **Mở lớp** (mở `ClassDetailModal` đúng tab qua prop `initialTab`),
**Đã đọc**, **Xoá**, kèm “Đánh dấu tất cả đã đọc” và lối tắt tới phòng thi / đơn thi lại /
thành viên chờ duyệt.

Rules: đọc/đánh dấu đã đọc chỉ với `toUid == uid`; người tạo phải là chủ lớp **hoặc** GVBM
đã có liên kết trong `class_teachers` của chính lớp đó, và chỉ được gửi cho chủ nhiệm lớp ấy.
Query chỉ lọc theo `toUid` rồi sắp xếp ở client → không cần composite index.

### 8.6. Đăng ký tài khoản chi tiết hơn (kèm bảo mật)

`LoginPage` chế độ “Đăng ký” nay dùng `RegisterFlow` 3 bước
(`src/components/RegisterFlow.jsx` + `src/styles/register-flow.css`):

1. **Thông tin**: họ tên (gộp khoảng trắng, chặn toàn số), vai trò (học sinh/giáo viên),
   **tên trường bắt buộc với giáo viên**, email.
2. **Mật khẩu**: nhập + nhập lại, hiện/ẩn, cảnh báo Caps Lock, thang độ mạnh 5 mức,
   checklist 4 tiêu chí, nút “Gợi ý mật khẩu mạnh” (14 ký tự, đủ 4 nhóm).
3. **Xác nhận**: bảng tóm tắt, checkbox điều khoản (bắt buộc), nút tạo tài khoản →
   gửi **email xác thực** và chuyển sang màn “Kiểm tra hộp thư” (có gửi lại, đếm ngược 60s).

Quy tắc mật khẩu (`src/lib/authValidation.js`, có test): ≥ 8 ký tự, ≥ 3/4 nhóm ký tự,
không nằm trong danh sách mật khẩu phổ biến, không phải chuỗi liên tiếp (`12345678`,
`abcdefgh`), không lặp 1 ký tự ≥ 4 lần, **không chứa email hoặc tên của chính mình**.
Email dùng một lần (mailinator, yopmail…) bị chặn.

Bảo mật khác:

| Việc | Cách làm |
|---|---|
| Không tự phong admin | `users` create trong rules chỉ cho `role in ['student','teacher']` + `email` là string |
| Không lộ tài khoản tồn tại | Lỗi `user-not-found` và `wrong-password` trả **cùng một câu** |
| Chống thử dồn dập | 5 lần thất bại → khoá 5 phút (lưu localStorage), kèm đếm ngược; Firebase vẫn tự giới hạn phía server |
| Không lưu mật khẩu | Chỉ Firebase Auth giữ (băm); mật khẩu không ghi vào Firestore/không gửi log |
| Ghi nhận điều khoản | `termsAcceptedAt` + `termsVersion: 'v1'` lưu trong `users/{uid}` |

Giới hạn đã biết: đây là kiểm tra phía client (kẻ tấn công gọi thẳng Firebase API vẫn qua được
policy mạnh hơn của client) — Firebase chỉ bắt buộc ≥ 6 ký tự; muốn chặn tuyệt đối phải bật
Identity Platform/Cloud Function kiểm tra mật khẩu, hoặc thêm App Check. Email xác thực hiện
**nhắc nhưng không chặn** đăng nhập (tránh khoá người dùng khi SMTP trục trặc).

---

## 9. Kiểm thử đã chạy

```text
npx vitest run tests/learningAnalytics.test.js tests/learningAnalyticsReport.test.js tests/classTeachers.test.js
→ 3 files, 99 tests passed; `tests/notices.test.js` 10 tests
```

Bao phủ: tính đúng các chỉ số (đối chiếu tay), lọc theo lớp/khoảng thời gian, môn thiếu dữ liệu, chủ đề, xu hướng, cảnh báo theo ngưỡng, phân bố điểm, trường hợp rỗng; key hợp lệ/không hợp lệ/hết hạn/hết lượt/thu hồi/sai lớp/chủ lớp; ẩn danh PII; validate JSON sai; kiểm chứng số liệu AI; fallback.

`npm run build` → **thành công** (✓ built in ~24s).

Trạng thái toàn bộ test suite: **201/202 pass**. 1 test hỏng có sẵn từ trước, **không liên quan đợt này**: `tests/aiPrompts.test.js > STUDY_MODES > có đủ 7 chế độ học` (mong đợi 7, thực tế 6). Tệp `src/lib/aiPrompts.js` và test này không bị chỉnh sửa trong đợt nâng cấp (đã kiểm tra bằng `git status`).

---

## 10. Cấu hình cần thiết để chạy

1. **Deploy Firestore Rules** (bắt buộc, nếu không key/tab mới sẽ bị chặn):
   ```bash
   firebase deploy --only firestore:rules
   ```
   **Trạng thái:** đã deploy ngày 26/10/2026 lên project `duyheheh-2a269` (rules biên dịch hợp lệ,
   đã release). CLI báo token hết hạn ở bước phụ sau đó → nếu cần deploy lại, chạy
   `firebase login --reauth` trước.

2. **Chọn kênh AI** trong `.env` (chỉ cần một trong hai):
   - Khuyến nghị — key nằm ở server:
     ```
     VITE_FUNCTIONS_ENDPOINT=https://us-central1-<project>.cloudfunctions.net/askAI
     VITE_AI_MODEL_SMART=gemini-2.5-flash
     ```
     và deploy function `askAI` + tạo secret `GEMINI_API_KEY` (Secret Manager hoặc env của function).
   - Như hiện trạng các tính năng AI khác: `VITE_GEMINI_KEY=...` (key nằm trong bundle — dự án đang dùng cách này cho tạo đề).
3. Không cần migration dữ liệu: key cũ vẫn dùng được (được coi là 1 lượt); đề/bài nộp giữ nguyên.
4. Gợi ý vận hành: khi soạn đề, điền `topic` và `level` cho câu hỏi để phần "tỷ lệ đúng theo chủ đề" có nghĩa; đề không có metadata sẽ được cảnh báo trong mục Chất lượng dữ liệu.

---

## 11. Đã hoàn thành / chưa thể hoàn thiện

### Đã hoàn thành (có code + test)
- Key liên kết 1 lượt gắn môn, hạn, thu hồi, chống dùng lại; liên kết & gỡ liên kết có nhật ký.
- Bảng hoạt động GVBM theo lớp, chỉ tính đề `classId = lớp`; trạng thái tài khoản; cảnh báo trùng môn.
- Engine thống kê đầy đủ + 6 loại cảnh báo sớm có căn cứ.
- AI: payload ẩn danh, schema, validate, kiểm chứng số liệu, fallback minh bạch, lưu báo cáo có phiên bản + phát hiện báo cáo cũ.
- UI 6 khu vực, bộ lọc thời gian (7/30/90/toàn bộ/tuỳ chọn) và theo môn, trạng thái tải/trống/lỗi, responsive.
- Rules cho dữ liệu mới; build OK, 99 test của module mới pass (216/217 toàn bộ — 1 test `aiPrompts` hỏng có sẵn từ trước).

### Chưa thể hoàn thiện / giới hạn kỹ thuật (nói rõ để không hiểu nhầm)
- **Chưa chạy thử trên Firebase thật** (không có phiên đăng nhập và project trong môi trường này). Các luồng cần kiểm thử tay theo checklist §12; rules phải deploy mới có hiệu lực.
- **AI cần cấu hình** (mục 10). Nếu chưa cấu hình, nút tạo báo cáo vẫn chạy nhưng ra báo cáo bằng luật, có ghi rõ lý do — không giả danh AI.
- **Phân tích theo chủ đề phụ thuộc metadata**: nếu đề không có `topic`, hệ thống báo "chưa gắn chủ đề" thay vì suy đoán. Chưa có tính năng tự gắn metadata bằng AI (đúng yêu cầu: không suy diễn thành kết quả chính thức).
- **Phân quyền chi tiết theo từng quyền của GVBM** (ví dụ tắt quyền xem điểm) chưa làm; hiện GVBM chỉ liên kết và giao đề, không đọc được báo cáo phân tích của lớp.
- **Chống đua key (race)**: rules chặn tại thời điểm ghi; nay nếu bước trừ lượt thất bại thì liên kết được rollback. Khe còn lại chỉ là trường hợp rollback cũng thất bại (mất mạng cả hai lượt) — muốn tuyệt đối cần Cloud Function giao dịch.
- **Thông báo chỉ trong ứng dụng**: đã có chuông + `notices` (§8.5), nhưng chưa có push/FCM hay email khi người dùng đóng tab.
- **Đã siết rules** (§7.1) nhưng **chưa có test tự động cho rules** (máy không có Java → không chạy được Firestore emulator). Mọi luồng phải kiểm thử tay theo checklist §12; nếu có sự cố, rollback bằng Firebase Console → Firestore → Rules → lịch sử → chọn phiên bản trước → Publish.
- **Chấm điểm vẫn ở client**: học sinh có thể sửa `score` bài của mình trong `submissions`. Muốn chặn tuyệt đối phải chấm ở Cloud Function rồi client chỉ đọc.
- Đã có **xuất CSV** bảng điểm theo môn; chưa xuất PDF.

---

## 12. Checklist kiểm thử tay trên môi trường thật

| # | Kịch bản | Kỳ vọng |
|---|---|---|
| 1 | Chủ nhiệm tạo key không chọn môn | Nút tạo bị chặn + thông báo môn bắt buộc |
| 2 | Tạo key 1 lượt, GV A nhập | Liên kết thành công, key chuyển "Đã dùng", nhật ký có 2 dòng |
| 3 | GV B nhập lại cùng key | Báo "đã được dùng" |
| 4 | Key hết hạn / bị thu hồi | Báo đúng lý do, không tạo liên kết |
| 5 | GV nhập key của lớp khác | Báo "key dành cho lớp khác" |
| 6 | Chủ nhiệm tự nhập key của mình | Báo "bạn là chủ lớp" |
| 7 | GVBM giao đề cho lớp | Số đề của GV đó tăng ngay trong tab GVBM và tab Phân tích AI |
| 8 | Lớp chưa có bài nộp | Các tỷ lệ hiện "—", nút tạo báo cáo bị chặn, có hướng dẫn |
| 9 | Có bài nộp, tạo báo cáo AI | Báo cáo có tóm tắt/phát hiện/khuyến nghị/giới hạn; badge "Phân tích AI" |
| 10 | Ngắt mạng / hết điểm khi tạo báo cáo | Báo lỗi rõ, có báo cáo bằng luật, badge "Báo cáo thống kê" |
| 11 | Tạo báo cáo rồi cho HS nộp thêm bài | Mở lại tab: banner "dữ liệu đã thay đổi" + nút tạo lại |
| 12 | GV lớp khác đăng nhập, mở báo cáo bằng URL/docId | Bị rules từ chối |
| 13 | Xem trên 1440 / 1024 / 768 / 390 px | Không tràn ngang, bảng cuộn được, KPI xuống 1–2 cột |
| 14 | Các tab cũ (Thành viên, Đề thi, Bảng điểm, Xin thi lại, GVBM, Cài đặt) | Hoạt động như trước |
