# BÁO CÁO NÂNG CẤP MODULE LỘ TRÌNH KIẾN THỨC (AITK / ELEC AI)

Ngày: 27/10/2026 · Phạm vi: module Lộ trình kiến thức · Làm việc trực tiếp trên codebase hiện có

---

## A. Những phần đã nâng cấp (đã chạy thật, đã kiểm tra)

### A1. Trang Lộ trình riêng — route `#roadmap`
- Trước: chỉ có card nhỏ ở trang chủ (`RoadmapCard`) liệt kê chương, không có trang riêng.
- Nay: trang đầy đủ, lazy-load (`RoadmapPage` chunk 47,9 kB / 15,7 kB gzip + CSS 23,4 kB).
- Vào từ: menu **Công cụ → Lộ trình kiến thức**, Command Palette (Ctrl/Cmd-K), card ở trang chủ (nút "Lộ trình đầy đủ"), hoặc deep link `#roadmap?chapter=c11-alcohol`.

### A2. Khối tổng quan có nguồn dữ liệu rõ ràng
6 chỉ số: Tiến độ chương trình · Chương đã luyện · Độ chính xác · Cần ôn hôm nay · Thời gian học · Mục tiêu tuần.
- Chưa có dữ liệu → hiện `—` + nhãn, **không hiện 0%**.
- "Mục tiêu tuần" do người học tự đặt (lưu theo tài khoản trên thiết bị), tiến độ đếm số câu thật trong 7 ngày.

### A3. Thẻ "Tiếp tục học"
- Chọn chương theo thứ tự ưu tiên: quá hạn ôn → chương yếu nhất → chương kế tiếp chưa học.
- Hiện lý do bằng số liệu thật, thời điểm học gần nhất, điểm thành thạo, nút Luyện tiếp / Xem chi tiết.
- Trạng thái trống phân biệt 2 tình huống: **chưa có dữ liệu** và **có lượt làm bài nhưng câu hỏi chưa gắn chuyên đề** (đang xảy ra thật trong dự án — xem mục C).

### A4. Hai chế độ xem dùng chung một nguồn dữ liệu
- **Danh sách**: trạng thái, độ chính xác, số phiên, điểm thành thạo, nút Luyện.
- **Bản đồ kiến thức** (SVG thuần, không thêm thư viện): node = chương thật, cạnh nét đứt = kiến thức cần học trước, node quá hạn ôn có viền khác; thu phóng +/−, "Vừa khung", cuộn ngang, thao tác bằng bàn phím (Tab + Enter), mỗi node có nhãn chữ + icon (không phụ thuộc màu).

### A5. Chi tiết chương (drawer)
- Mô tả chương, 3 chỉ số (thành thạo / độ chính xác / lần học gần nhất), kiến thức cần học trước (chỉ **gợi ý**, không khoá), 3 tab: Tổng quan · Luyện tập · Bằng chứng.
- Tab Bằng chứng tách số câu theo nguồn: bài cô giao / bài trên máy chủ / phiên luyện trên thiết bị.
- Phần nội dung bài học: **chưa có trong hệ thống** → hiện trạng thái trống + nút "Tóm tắt bằng AI" (không bịa bài giảng).

### A6. Phiên luyện tập thật theo chương
- Câu hỏi lấy từ Supabase (`questions` + `answers`, chỉ đề `is_published`), chấp nhận cả `single_choice` và `mcq` (dữ liệu hiện tại dùng `mcq`).
- Chỉ nhận câu có **đúng 1 đáp án đúng**, ≥2 lựa chọn; câu lỗi bị loại chứ không tự sửa đáp án.
- Phím 1–4 chọn, Enter sang câu tiếp; hiện đáp án đúng + giải thích lấy từ DB.
- Kết thúc: lưu phiên (chương, đúng/sai từng câu, thời lượng) → **cập nhật ngay** điểm thành thạo và lịch ôn.

### A7. Đánh giá mức độ thành thạo (tách khỏi "hoàn thành")
- Công thức: `score = 100 × accuracy × (0,6 + 0,4×volume) × (0,75 + 0,25×recency)`
  với `volume = min(1, số câu/12)`, `recency = 0,85^(số ngày/14)`.
- Ngưỡng cấu hình được: <40 cần củng cố · 40–59 đang hình thành · 60–79 khá · 80–94 thành thạo · ≥95 thành thạo cao.
- Độ tin cậy: <5 câu → "chưa đủ dữ liệu" (không kết luận yếu/thành thạo); 5–11 câu → "đủ dùng"; ≥12 câu → "đáng tin".
- **Không** dùng % bài đã mở, không dùng XP, không đổi quy tắc điểm hiện có.

### A8. Ôn tập theo lịch
- Chu kỳ đề xuất: 1 / 3 / 7 / 14 / 30 ngày tuỳ mức thành thạo; quá hạn → badge "cần ôn" và chỉ số "Cần ôn hôm nay".
- Thuật toán xác định (không gọi AI) → rẻ, dễ test.

### A9. Gợi ý học tập có lý do
4 loại: quá hạn ôn · chương yếu · chương kế tiếp chưa học · điểm mạnh nên giữ nhịp. Mỗi gợi ý có lý do bằng con số (ví dụ "Độ chính xác 3/12 câu (25%), thành thạo 31%") và một hành động bấm được.

### A10. Bản đồ nhiệt kiến thức
Lưới theo chương, có **nhãn chữ + icon** cho từng bậc (không chỉ dựa vào màu), ô chưa có dữ liệu là "—" kèm chú thích, tế bào có `n=<5` được ghi rõ là ít dữ liệu.

### A11. Hoạt động gần đây
6 lượt gần nhất từ 3 nguồn (bài lớp, bài trên máy chủ, phiên luyện), ghi rõ nguồn, số câu đúng, thời gian tương đối.

### A12. Tích hợp AI — tái sử dụng, không tạo luồng mới
- Nút "AI phân tích" / "Học bằng AI" đóng gói ngữ cảnh **đã giới hạn ≤1800 ký tự**, chỉ gồm số liệu thật, rồi đẩy sang trợ lý AI hiện có qua `cs-ai-pending` (đúng cơ chế `askAI()` đang dùng).
- **Không** gọi AI khi mở trang, không gọi lặp, không thêm khóa/endpoint mới. Không có số liệu thì câu lệnh ghi rõ "chưa đủ dữ liệu".

### A13. Ba lỗi phát hiện khi kiểm thử và đã sửa
1. Deep link `#roadmap...` bị đẩy về `#home` ngay sau khi đăng nhập (logic reset hash cũ) → nay giữ nguyên mọi route hợp lệ (trừ `login/register`).
2. Panel chi tiết bị thanh nav dính che phần đầu (do `main` là stacking context riêng) → render qua `createPortal` ra `document.body`, backdrop `z-index: 10050`.
3. Hàng chương trên mobile bị vỡ (`.rm-row-body` co về 0px, tên chương xuống dòng từng ký tự) → bố cục lại cho ≤700px: thân hàng 220px, chiều cao hàng 156px (đã đo lại).

---

## B. Những file đã thay đổi

**Thêm mới**
| File | Mục đích |
|---|---|
| `src/lib/roadmapEngine.js` | Lõi tính toán thuần: thành thạo, trạng thái, lịch ôn, gợi ý, ngữ cảnh AI, tổng quan |
| `src/lib/roadmapStore.js` | Lưu phiên luyện + mục tiêu tuần theo tài khoản (localStorage, version, cap 300) |
| `src/lib/roadmapEvidence.js` | Gom bằng chứng: Firestore `submissions`, Supabase `exam_attempts/user_answers/questions`, phiên luyện; chuẩn hoá câu hỏi luyện |
| `src/components/roadmap/RoadmapPage.jsx` | Trang chính, điều phối trạng thái, deep link, bộ lọc/tìm kiếm |
| `src/components/roadmap/Overview.jsx` | Vòng thành thạo, dải chỉ số, thẻ tiếp tục học, bản đồ nhiệt |
| `src/components/roadmap/SidePanels.jsx` | Gợi ý, hoạt động gần đây, ghi chú nguồn dữ liệu |
| `src/components/roadmap/KnowledgeMap.jsx` | Bản đồ kiến thức SVG (layout, cạnh prereq, zoom, a11y) |
| `src/components/roadmap/ChapterSheet.jsx` | Drawer chi tiết chương (portal, 3 tab, prereq, empty state) |
| `src/components/roadmap/PracticeRunner.jsx` | Phiên luyện trắc nghiệm + lưu kết quả |
| `src/styles/roadmap-page.css` | Giao diện (token sáng/tối, responsive, reduced-motion) |
| `tests/roadmapEngine.test.js` | 19 test cho lõi tính toán |
| `tests/roadmapEvidence.test.js` | 4 test cho bước chuẩn hoá câu hỏi |

**Chỉnh sửa (nhỏ, có kiểm soát)**
| File | Thay đổi |
|---|---|
| `src/data/roadmap.js` | Thêm `desc` + `prereq` cho từng chương; **giữ nguyên id/tên/thứ tự** → thống kê cũ không lệch |
| `src/App.jsx` | Thêm route lazy `roadmap`, mục menu "Học tập", meta description, sửa reset hash khi đăng nhập |
| `src/lib/routes.js` | Thêm `roadmap` vào danh sách route hợp lệ |
| `src/components/RoadmapCard.jsx` | Thêm nút mở trang đầy đủ (giữ nguyên toàn bộ hành vi cũ của card) |
| `src/components/CommandPalette.jsx` | Thêm lệnh "Lộ trình kiến thức" |
| `src/styles/home-apple-bento.css` | 1 rule cho nút mới trong card (`margin-top`) |

Không xoá code cũ, không đổi package.json/lockfile, không nâng dependency.

---

## C. Dữ liệu và Firebase/Supabase

### Nguồn dữ liệu đã dùng (không tạo bảng/collection mới)
| Nguồn | Nội dung | Trạng thái thực tế |
|---|---|---|
| Firestore `submissions` (rules: HS đọc bài của mình) | bài cô giao + `detail[]` đúng/sai | Đọc được, nhưng để quy về chương cần `exam.questions[i].topicId` |
| Firestore `exams` | tiêu đề + câu hỏi | Đọc được (rules cho phép người đã đăng nhập) |
| Supabase `exam_attempts` + `user_answers` + `questions.topic_id` | bài luyện độc lập | **0 dòng** `user_answers` hiện tại |
| Supabase `questions` + `answers` | câu hỏi cho phiên luyện | 55 câu, **tất cả `topic_id = null`**, `question_type = 'mcq'` |
| `localStorage` `cs-roadmap-v1:<uid>` | phiên luyện + mục tiêu tuần | hoạt động |

### Vì sao phiên luyện lưu trên thiết bị (có chủ ý)
- App đăng nhập bằng **Firebase**, không có session Supabase (`useAuth.jsx` không gọi `supabase.auth.signInWithIdToken`). Các bảng có RLS `auth.uid() = user_id` (`wrong_questions`, `ai_chats`…) sẽ **từ chối ghi** từ client này.
- Firestore rules chỉ mở `/users/{uid}` và 2 subcollection `friends`, `friendRequests`; thêm subcollection mới phải sửa + deploy rules.
- Vì vậy **không nới rule, không tạo bảng mới**; lưu theo đúng cơ chế app đang dùng (XP, SRS, quiz-stats cũng lưu localStorage) và ghi rõ trong UI là "lưu trên thiết bị này".

### Toàn vẹn dữ liệu
- Phiên luyện ghi 1 lần khi kết thúc, có `id` riêng → không ghi trùng khi bấm nhiều lần.
- Giới hạn 300 phiên; nếu `localStorage` đầy thì cắt bớt và thử lại, không làm sập trang.
- Cache đọc Firestore/Supabase 10 phút trong `sessionStorage`, có nút "Làm mới" để buộc đọc lại; lỗi một nguồn không làm mất nguồn còn lại (`issues[]` hiển thị trong "Dữ liệu lấy từ đâu").

### Việc cần làm để dữ liệu "sống"
1. Gắn `topic_id` cho 55 câu hiện có (Sửa đề → từng câu) → phiên luyện và thống kê theo chương sẽ có dữ liệu ngay.
2. Muốn lưu lịch ôn theo từng câu trên server: bật **Supabase Third-party Auth (Firebase)** rồi dùng `wrong_questions` — khi đó chỉ cần đổi lớp lưu, không đổi UI.

---

## D. AI

- **Không tạo API AI mới.** Hai nút AI trong trang chỉ soạn prompt + đẩy sang trợ lý AI hiện có (cơ chế `cs-ai-pending` → `#ai`), tức dùng đúng pipeline, quota và bộ lọc hiện hành.
- Nội dung gửi đi: tổng quan + bảng theo chương (đúng/sai, %, thành thạo, trạng thái, số ngày từ lần học cuối), giới hạn 1800 ký tự; **không** gửi email, uid, token hay dữ liệu cá nhân.
- Chống lãng phí: mọi thống kê (tiến độ, chính xác, đến hạn ôn, gợi ý) tính bằng code; AI chỉ chạy khi người dùng bấm; prompt yêu cầu nêu rõ "chưa đủ dữ liệu" thay vì suy đoán nguyên nhân.
- ⚠️ **Rủi ro tồn tại từ trước (chưa sửa, ngoài phạm vi):** `src/lib/ai.js` gọi thẳng Gemini/Groq/Agnes bằng `VITE_*_KEY` → khóa nằm trong bundle frontend. Khuyến nghị chuyển sang Cloud Functions (`functions/` + `lib/aiClient.js` đã có sẵn khung) và thu hồi/rotate khóa. Trang mới **không** thêm chỗ dùng khóa nào.

---

## E. Kiểm thử (kết quả thật)

| Lệnh / kiểm tra | Kết quả |
|---|---|
| `npx vitest run tests/roadmapEngine.test.js tests/roadmapEvidence.test.js` | **23/23 pass** (19 + 4) |
| `npm run build` | **✓ built** (22–40 s), chunk RoadmapPage 47,96 kB / 15,67 kB gzip |
| `npx vitest run` (toàn bộ) | 292 pass · **1 fail có sẵn từ trước**: `tests/aiPrompts.test.js` kỳ vọng `STUDY_MODES` có 7 chế độ, thực tế 6 (`auto, detail, steps, check, theory, similar`). Không liên quan và không bị sửa bởi thay đổi này. |
| Trình duyệt (Chrome, dev server) | Không có console error/warning từ trang (chỉ `[vite] connected` + React DevTools) |
| Deep link `http://localhost:5173/#roadmap` | giữ nguyên `#roadmap` sau khi đăng nhập (trước khi sửa: nhảy về `#home`) |
| Panel chi tiết | trước: nav che header (`elementFromPoint` = `nav-search-pill`); sau: `elementFromPoint` = `H2` nằm trong `.rm-sheet` |
| Mobile 390×844 | không tràn ngang (scrollWidth 380 ≤ 390); `.rm-row-body` 220 px; `.rm-row` cao 156 px |
| Phiên luyện | mở được, đi hết trạng thái tải → **"Chương này chưa có câu hỏi đã xuất bản"** (đúng thực tế dữ liệu: 0 câu có `topic_id`) |

Chưa kiểm thử được (vì dữ liệu trống): luồng trả lời → chấm → lưu phiên → cập nhật thành thạo trên UI. Phần tính toán đã có 23 test; phần chuẩn hoá câu hỏi đã có 4 test.

---

## F. Những phần CHƯA hoàn thành (nói rõ lý do)

| Hạng mục trong yêu cầu | Trạng thái | Lý do / hướng xử lý |
|---|---|---|
| Nội dung bài học chi tiết (lý thuyết, hình, bảng, ví dụ) | Chưa | Hệ thống không có dữ liệu bài giảng; không được tự soạn thay nội dung kiểm duyệt. Đã dựng sẵn khung + trạng thái trống + nút tóm tắt AI. Cần nhập nội dung từ giáo viên. |
| Ôn tập theo từng câu (flashcard/SRS server-side) | Một phần | Đã có "đến hạn ôn theo chương", lối vào Sổ lỗi sai. Lưu lịch theo câu cần ghi bảng có RLS → xem mục C (bật Supabase third-party auth). |
| AI sinh câu hỏi / lập kế hoạch / sơ đồ tư duy / phiếu ôn | Chưa | Cần luồng kiểm duyệt dữ liệu AI + chi phí; hiện tái dùng trợ lý AI để tóm tắt & phân tích. Đề xuất làm thành giai đoạn 2, có schema kiểm tra + hàng chờ duyệt trước khi vào ngân hàng đề. |
| Nhiệm vụ/thành tích gamification | Chưa | Không đổi quy tắc điểm/XP hiện có khi chưa đánh giá ảnh hưởng (yêu cầu của chính đề bài). |
| Thay đổi schema Firestore/Supabase | Không làm | Không cần cho phạm vi này; tránh phải deploy rules/migration ngoài tầm kiểm soát. |
| Đồng bộ phiên luyện giữa các thiết bị | Chưa | Phụ thuộc mục "xác thực Supabase" ở trên. |

---

## G. Hướng dẫn sử dụng

1. **Mở trang**: menu Công cụ → *Lộ trình kiến thức*, hoặc Ctrl/Cmd-K gõ "lộ trình", hoặc từ card ở trang chủ bấm "Lộ trình đầy đủ".
2. **Chọn khối** Lớp 10/11/12/Đại học ở góc phải; lựa chọn được nhớ cho lần sau (dùng chung với card trang chủ).
3. **Đọc tổng quan**: 6 ô chỉ số; bấm "Đặt/Đổi" ở ô *Mục tiêu tuần* để đặt số câu mỗi tuần.
4. **Tiếp tục học**: thẻ lớn ngay dưới tiêu đề, có lý do gợi ý + nút *Luyện tiếp* / *Xem chi tiết*.
5. **Đổi cách xem**: nút *Danh sách* / *Bản đồ*. Ở bản đồ: bấm node để mở chương, dùng +/− hoặc "Vừa khung"; Tab + Enter cũng dùng được.
6. **Lọc/tìm**: ô tìm kiếm theo tên chương; danh sách trạng thái (Cần ôn / Cần củng cố / Đã đạt / Chưa có dữ liệu).
7. **Chi tiết chương**: bấm vào dòng chương → drawer 3 tab. *Luyện tập* → "Bắt đầu luyện 10 câu" (phím 1–4, Enter). Nếu chương chưa có câu hỏi đã xuất bản, trang nói rõ và hướng dẫn giáo viên gắn chuyên đề.
8. **Nhờ AI**: nút *AI phân tích* (cột phải) hoặc *Học bằng AI* (trong chương) → chuyển sang trợ lý AI kèm đúng số liệu đã giới hạn.
9. **Kiểm tra nguồn dữ liệu**: panel "Dữ liệu lấy từ đâu" ở cột phải, có nút *Làm mới* khi vừa làm bài xong.
10. **Deep link** để chia sẻ: `#roadmap?chapter=c11-alcohol&level=Lớp%2011`.
