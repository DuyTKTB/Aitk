# BÁO CÁO NÂNG CẤP MODULE LỘ TRÌNH KIẾN THỨC — V3

Cập nhật: 27/10/2026 · Thay thế `BAO_CAO_NANG_CAP_LO_TRINH.md` (v1)
Phạm vi: module Lộ trình kiến thức + các phần liên quan trực tiếp (SEO/GEO, build).

> Nguyên tắc xuyên suốt: chỉ số liệu có nguồn thật; thiếu dữ liệu thì hiện trạng thái trống, không bịa.
> Mọi con số trong báo cáo này lấy từ công cụ đã chạy (test, build, trình duyệt), không phải ước lượng.

---

## 1. Đã làm trong 3 vòng

### Vòng 1 — Trang Lộ trình + lõi tính toán
- Route mới `#roadmap` (lazy chunk), vào từ menu Công cụ, Ctrl-K, và card ở trang chủ.
- 6 chỉ số tổng quan có nguồn; thẻ "Tiếp tục học"; danh sách + bản đồ kiến thức SVG; bản đồ nhiệt;
  hoạt động gần đây; panel chi tiết chương (3 tab); gợi ý có lý do; lịch ôn 1/3/7/14/30 ngày.
- Điểm thành thạo tách khỏi "hoàn thành": `100 × accuracy × (0,6+0,4×volume) × (0,75+0,25×recency)`,
  ngưỡng 40/60/80/95 cấu hình được, dưới 5 câu → "chưa đủ dữ liệu".
- AI: chỉ đẩy ngữ cảnh ≤1800 ký tự sang trợ lý hiện có qua `cs-ai-pending`; không gọi khi mở trang.

### Vòng 2 — Vòng lặp ôn tập + công cụ dữ liệu
- Ôn theo **từng câu từng sai**: `questionStats` + `reviewQueue` + `PracticeRunner` chế độ `review`,
  hiện chênh lệch điểm thành thạo trước/sau.
- `BankTagger` (chỉ teacher/admin): gắn `topic_id` đơn lẻ + hàng loạt, có tiến độ 0/55.
- `scripts/import-questions.mjs`: nhập hàng loạt, validate (1 đáp án đúng, ≥2 lựa chọn, topic hợp lệ),
  dry-run mặc định, `--apply`, `--rollback`, log id đã tạo.
- SEO/GEO: `public/llms.txt`, mở `robots.txt` cho GPTBot/ClaudeBot/PerplexityBot/Google-Extended.

### Vòng 3 — Kế hoạch thi, thẻ ghi nhớ, in PDF, build
- **Kế hoạch tới ngày thi**: lịch theo ngày, trọng số theo mức thiếu + câu chờ ôn, ngày cuối để ôn,
  cảnh báo bất khả thi kèm số phút/ngày cần thiết; lưu cài đặt + dấu "đã xong" theo tài khoản.
- **Thẻ ghi nhớ**: lật thẻ (Space), 3 mức nhớ, chu kỳ 1/3/7→15→…→60 ngày, xếp thẻ chưa nhớ lên trước.
- **In / Lưu PDF** kế hoạch bằng `window.print()` + `@media print` (giữ nguyên tiếng Việt, không cần font nhúng).
- **Build**: tách `vendor-react/firebase/supabase/math`; loại `three` và `pdf` khỏi preload.

---

## 2. File đã tạo

| File | Vai trò |
|---|---|
| `src/data/roadmap.js` | Danh mục chương **sinh từ `chemTopics.js`** + mô tả + prereq |
| `src/lib/roadmapEngine.js` | Thành thạo, trạng thái, lịch ôn, gợi ý, ngữ cảnh AI, `questionStats`/`reviewQueue` |
| `src/lib/roadmapEvidence.js` | Gộp Firestore `submissions` + Supabase attempts/answers/questions + local; lấy câu luyện; đếm độ phủ |
| `src/lib/roadmapStore.js` | Phiên luyện + mục tiêu tuần theo uid |
| `src/lib/bankAdmin.js` | Đọc/ghi `topic_id` cho BankTagger |
| `src/lib/studyPlan.js` | Sinh lịch thi, `needMinutes`, `weightOf`, Markdown export |
| `src/lib/studyPlanStore.js` | Cài đặt kế hoạch + dấu đã xong |
| `src/lib/flashcardStore.js` | Trạng thái nhớ 3 mức + `nextInterval` + `dueCards` |
| `src/components/roadmap/RoadmapPage.jsx` | Trang chính |
| `src/components/roadmap/Overview.jsx` | Chỉ số, vòng thành thạo, tiếp tục học, bản đồ nhiệt |
| `src/components/roadmap/KnowledgeMap.jsx` | Bản đồ SVG (zoom, bàn phím) |
| `src/components/roadmap/ChapterSheet.jsx` | Panel chi tiết (4 tab) |
| `src/components/roadmap/PracticeRunner.jsx` | Luyện / ôn câu sai + delta thành thạo |
| `src/components/roadmap/FlashcardSession.jsx` | Phiên thẻ ghi nhớ |
| `src/components/roadmap/StudyPlanCard.jsx` | Kế hoạch tới ngày thi |
| `src/components/roadmap/BankTagger.jsx` | Gắn chuyên đề |
| `src/components/roadmap/SidePanels.jsx` | Gợi ý / hoạt động / nguồn dữ liệu |
| `src/styles/roadmap-page.css` | Style + responsive + reduced-motion + print |
| `tests/roadmapEngine.test.js` | 23 test (gồm 2 test chống "thiếu chương") |
| `tests/roadmapEvidence.test.js` | 4 test chuẩn hoá câu hỏi |
| `tests/studyPlan.test.js` | 15 test kế hoạch |
| `tests/flashcardStore.test.js` | 10 test thẻ ghi nhớ |
| `scripts/import-questions.mjs` + `question-import.example.json` | Nhập câu hỏi có chuyên đề |
| `public/llms.txt` | Mô tả sản phẩm cho công cụ AI |

**Sửa**: `App.jsx` (route, menu, giữ deep link khi đăng nhập), `lib/routes.js`, `RoadmapCard.jsx`,
`CommandPalette.jsx`, `styles/home-apple-bento.css`, `vite.config.js`, `package.json` (script import), `public/robots.txt`.

---

## 3. Kiểm thử (số liệu thật)

| Lệnh | Kết quả |
|---|---|
| `npx vitest run` | **328 passed / 1 failed (329)** — file fail là `tests/aiPrompts.test.js` (kỳ vọng 7 study mode, thực tế 6), có từ trước, không liên quan thay đổi này |
| `npx vitest run tests/studyPlan.test.js` | 15 passed |
| `npx vitest run tests/flashcardStore.test.js` | 10 passed |
| `npm run build` | pass (lần cuối ~39,8 s) |
| `dist/index.html` sau build | preload: `index`, `vendor-react`, `vendor-firebase`, `vendor-supabase`, CSS — **không còn pdf, không còn three** |

### Trình duyệt (Chrome, dev server)
- 0 console error; 1 warning tồn tại từ trước ở `src/lib/ai.js:731` (`signal is aborted without reason`).
- 4 tab trong panel chương, tab "Thẻ ghi nhớ" mở được, hiện trạng thái trống đúng dữ liệu.
- Kế hoạch: đặt ngày thi → lịch **15 ngày**, mỗi ngày ~14 phút, ngày cuối "Khởi động", nút
  "Xem tất cả 15 ngày", tick xong cập nhật `1/15`; nút "In / Lưu PDF" + "Tải .md" hiện đúng.
- Mobile 390px: `scrollWidth` 380 < 390, không tràn ngang.

### Lỗi tìm thấy khi chạy thật và đã sửa
1. Deep link `#roadmap` bị đẩy về `#home` sau đăng nhập.
2. Panel chi tiết bị nav che → portal + `z-index`. Modal trong suốt → thiếu biến `--rm-*` ngoài `.rm` (đã đặt ở `:root`).
3. Hàng chương mobile co về 0px → bố cục lại.
4. Kế hoạch dồn việc vào 4 ngày đầu → chia theo ngân sách mỗi ngày.
5. Ngày cuối hiện "Học mới" trong khi câu kết luận nói "ôn tổng" → đảm bảo có việc ôn/khởi động.
6. `nextInterval(0, 3)` trả 15 ngày thay vì 7 (lần đầu "nhớ tốt").
7. Lộ trình thiếu chương `c12-sustain` so với ngân hàng → sinh danh mục từ `chemTopics.js` + 2 test chống hồi quy.
8. Entry preload `three` (~950 kB) và `pdf` (~460 kB) → bỏ khỏi nhóm tách chunk.

---

## 4. Chưa làm / còn chặn

| Việc | Lý do |
|---|---|
| Dữ liệu thật cho Lộ trình | `questions.topic_id` đang NULL toàn bộ (55/55), `user_answers` = 0 → mọi điểm thành thạo để trống. Cần gắn chuyên đề (BankTagger) hoặc nhập đề có chuyên đề. **Không tự gắn** vì 55 câu hiện là đề "cực khó" trộn nhiều chương + có cả câu Toán/mol, gắn máy móc sẽ làm sai số liệu. |
| Đồng bộ nhiều thiết bị | App đăng nhập Firebase, không có session Supabase → bảng có RLS `auth.uid()` từ chối ghi. Cần bật Supabase Third-party Auth. |
| Siết bảo mật Supabase | Đã kiểm chứng: PATCH vào `questions` bằng anon key trả 204 → bảng đang cho ghi tự do. Cần bật RLS + policy, và chuyển script nhập liệu sang `service_role`. |
| Khoá AI ở frontend | `src/lib/ai.js` gọi thẳng Gemini/Groq/Agnes bằng `VITE_*_KEY` → khoá nằm trong bundle. Nên chuyển sang Cloud Functions và rotate khoá. |
| Flashcard: luồng đầy đủ (lật/đánh giá/lưu) | Chưa kiểm thử được end-to-end vì chương không có câu hỏi; logic đã có 10 test. |
| In PDF | Đã có nút + CSS in; chưa in thử ra file để đối chiếu bố cục. |
| Dọn file rác | Còn `_scratch`/`shots/`, `probe-*.mjs`, `patch-*.mjs`, `prod-roadmap-*.png` trong workspace — lệnh xoá bị chặn bởi chính sách an toàn của môi trường, cần dọn tay hoặc cho phép. |
| `tests/aiPrompts.test.js` fail | Thuộc module khác (6 vs 7 study mode); không sửa vì đó là quy tắc nghiệp vụ của module đó. |

---

## 5. Cách dùng nhanh

1. `#roadmap` → chọn khối Lớp 10/11/12/Đại học.
2. Bấm một chương → 4 tab: Tổng quan · Luyện tập · Bằng chứng · Thẻ ghi nhớ.
3. Giáo viên: mở khối "Vì sao các chỉ số đang trống?" → "Gắn chuyên đề ngay (N câu)".
4. Kế hoạch: chọn ngày thi + phút/ngày + ngày nghỉ → xem lịch → "In / Lưu PDF".
5. Nhập hàng loạt: `npm run import:questions -- --file data.json` (chạy thử) rồi `--apply`.
