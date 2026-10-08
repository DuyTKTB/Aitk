# Audit & đề xuất nâng cấp Aitk / A7 K60 DTA

**Ngày audit:** 05/10/2026  
**Repository:** `DuyTKTB/Aitk`  
**Commit kiểm tra:** `f47d40d` (`main`)  
**Phạm vi:** giao diện, trải nghiệm người dùng, tính năng AI, hiệu năng, bảo mật và khả năng bảo trì.

## 1. Tóm tắt điều hành

Aitk hiện đã vượt xa mô tả trong README: đây là một SPA React/Vite có đăng nhập Firebase, lưu chat Supabase, AI đa provider (Gemini/Groq/Agnes), đọc ảnh, streaming, quiz, bảng tuần hoàn, công cụ Hóa, ghi chú, thi, gamification, trò chơi và PWA.

Điểm mạnh là phạm vi tính năng rộng, đã có lazy route, fallback nhiều provider, hỗ trợ bàn phím cơ bản, dark/light theme, draft chat và đồng bộ lịch sử. Tuy nhiên, sản phẩm đang ở trạng thái **tăng trưởng tính năng nhanh nhưng thiếu lớp nền ổn định**: CSS bị chồng nhiều lớp, bundle khởi động lớn, quyền dữ liệu công khai, AI gọi trực tiếp từ client, README không còn phản ánh sản phẩm và chưa có test/lint CI.

### Ưu tiên nên làm trước

1. **P0 — Bảo mật & tin cậy:** đưa AI qua server/Edge Function; khóa RLS/Firebase rules; không tin quota/VIP ở localStorage/client.
2. **P0 — Hiệu năng startup:** giảm CSS global 534,6 kB và JS entry 967,4 kB; tách PDF/Three/Supabase/route nặng khỏi critical path.
3. **P1 — UX AI:** thiết kế lại thành quy trình học có mục tiêu: chọn cấp độ → chụp/gửi đề → AI đọc đề → giải từng bước → kiểm tra lại → lưu thành thẻ ôn tập.
4. **P1 — Design system:** hợp nhất 59 file CSS, loại bỏ các lớp `glass/pro/fix/v2/upgrade` chồng chéo.
5. **P2 — Đo lường & chất lượng:** thêm analytics sự kiện học tập, test component/E2E, error monitoring và tài liệu vận hành.

## 2. Hiện trạng đã kiểm chứng

| Hạng mục | Quan sát | Bằng chứng |
|---|---|---|
| Stack | React 18 + Vite 5; 126 JSX, khoảng 41.656 dòng JSX | `package.json`, `src/` |
| Tính năng | AI, 118 nguyên tố, công cụ, quiz, thi, ghi chú, stats, game, admin | `src/App.jsx:4-31`, `src/components/` |
| Routing | Hash routing tự viết, chưa dùng router chuẩn | `src/App.jsx:107-121`, `src/App.jsx:281-333` |
| AI | 3 provider, streaming SSE, fallback, timeout 120 giây, đọc ảnh qua Gemini | `src/lib/ai.js:356-843` |
| Lưu trữ | LocalStorage cho draft/quota/settings/progress; Supabase cho lịch sử chat; Firebase Auth/Firestore/Storage | `src/lib/quota.js`, `src/lib/aiChatApi.js`, `src/lib/firebase.js` |
| Styling | 59 file CSS, khoảng 53.913 dòng; nhiều file upgrade/glass/fix/v2 được import cùng lúc | `src/main.jsx`, `src/App.jsx`, `src/components/AIChat.jsx` |
| Build | Build thành công, 664 modules transformed | `npm run build` |
| Bundle | `index.css` 534,59 kB (90,83 kB gzip); entry JS 967,43 kB (256,85 kB gzip); PDF 483,74 kB; ToolsPage 329,79 kB; Supabase 226,92 kB | output Vite ngày audit |
| QA | Chỉ có `dev/build/preview`, chưa có script test/lint | `package.json` |
| PWA | SW cache v1, cache tĩnh rất ít; không thấy chiến lược update UX rõ ràng | `public/sw.js:9-17` |
| Tài liệu | README vẫn nói “không cần backend”, trong khi code dùng Firebase/Supabase và AI API | `README.md:5`, `package.json`, `src/lib/` |

## 3. Phát hiện quan trọng và đề xuất

## 3.1. Bảo mật, quyền dữ liệu và độ tin cậy — P0

### Rủi ro 1: AI provider gọi trực tiếp từ trình duyệt

`src/lib/ai.js:6-8` đọc `VITE_GEMINI_KEY`, `VITE_GROQ_API_KEY`, `VITE_AGNES_API_KEY`, sau đó gửi trực tiếp từ browser (`src/lib/ai.js:367-384`, `485-493`, `577-591`). Trong Vite, biến `VITE_*` được đóng gói vào client; nếu các biến này chứa secret thật, người dùng có thể xem và lạm dụng key.

**Đề xuất:**

- Tạo một lớp `/api/ai` bằng server/Edge Function.
- Client chỉ gửi `messages`, ảnh đã nén và `capability`; server giữ provider key.
- Server xác thực Firebase ID token, kiểm tra tier/quota/rate limit, giới hạn kích thước ảnh và số token.
- Ghi usage server-side theo `uid`, provider, model, latency, status; không dùng localStorage làm nguồn sự thật.
- Chỉ trả stream đã lọc; không trả lỗi chứa thông tin provider/key nội bộ.
- Xoay/revoke ngay các key đã từng được đưa vào build public nếu có.

### Rủi ro 2: Firebase rules quá mở và file rules có cấu trúc bất thường

`firebase-rules.json` có hai object root nối tiếp nhau (dòng 1–19 và 20–57), không phải một JSON hợp lệ duy nhất. Ngoài ra có `.read: true` cho chat/notes/votes và `votes/.write: true`; với notes, điều kiện write cho phép nhánh `newData.hasChild('votes')`, dễ bị lạm dụng để sửa vote hoặc spam.

**Đề xuất:**

- Tách rules theo đúng format của Firebase CLI và kiểm tra bằng `firebase deploy --only database:rules` trong CI.
- Chỉ cho đọc/ghi theo `auth.uid === data.child('uid').val()` hoặc path chứa UID.
- Tách dữ liệu công khai (bài đã publish) khỏi dữ liệu cá nhân (chat, notes, progress).
- Vote dùng transaction/server function, mỗi UID chỉ vote một lần cho một note.
- Kiểm tra Content Security Policy, CORS, giới hạn payload và chống spam.

### Rủi ro 3: quota/VIP có fallback client-side

Code có nhiều fallback `localStorage` cho quota/VIP (`src/lib/quota.js`, `src/services/api.js`, `src/lib/apiTracker.js`). Đây chỉ là UX hint, không thể dùng để thực thi quyền lợi.

**Đề xuất:** server là nguồn sự thật; client chỉ hiển thị trạng thái đã ký/đã xác thực. Dùng idempotency key cho request AI để retry không trừ quota hai lần.

## 3.2. Hiệu năng — P0/P1

### Vấn đề 1: critical CSS và entry JS quá lớn

Build cảnh báo chunk vượt 500 kB. CSS global 534,59 kB và JS entry 967,43 kB khiến lần tải đầu tiên nặng dù page đã dùng `lazy()`.

**Kế hoạch xử lý:**

1. Dùng một `styles/tokens.css` + `styles/base.css` nhỏ cho shell; chỉ import CSS page trong chính page lazy.
2. Gỡ import trùng giữa `src/main.jsx` và `src/App.jsx` (`admin-dashboard.css`, `admin-upgrade.css`, `stats.css`, `home-extras.css`, `AIChat-glass-v2.css`...).
3. Hợp nhất các lớp AI `AIChat-glass.css`, `AIChat-pro.css`, `AIChat-fix.css`, `AIChat-glass-v2.css` thành một stylesheet có token và modifier rõ ràng.
4. Chỉ tải `pdfjs-dist` khi người dùng mở tính năng đọc PDF; chỉ tải Three/R3F khi vào Virtual Lab/game 3D.
5. Tách admin khỏi bundle người học; nếu được, build admin entry riêng.
6. Thêm `manualChunks` cho vendor lớn sau khi đo lại, nhưng không dùng cách này để che vấn đề import thừa.
7. Nén/resize `img/logo.png` 1,13 MB và `img/prom.png` 5,05 MB; dùng WebP/AVIF, `srcset`, `loading="lazy"`, kích thước cố định.

**Mục tiêu:** initial JS gzip < 150 kB cho Home/Login; initial CSS gzip < 35 kB; không tải PDF/Three/Admin ở Home; LCP mobile 4G < 2,5 giây, INP < 200 ms.

### Vấn đề 2: hiệu ứng liên tục và timer

Nhiều component dùng `setInterval`, gồm Home, HomePlus, ClockHub, Pet, AI mark và các widget. Một số là cần thiết, nhưng các animation nền/đồng hồ có thể tiếp tục gây CPU khi tab ẩn hoặc mobile yếu.

**Đề xuất:**

- Dừng animation/timer khi `document.visibilityState === 'hidden'`.
- Dùng `requestAnimationFrame` cho tiến trình hiển thị cần mượt; không dùng interval 33 ms nếu không thật sự cần.
- Thêm `@media (prefers-reduced-motion: reduce)` tắt noise/clip-path/parallax/pulse.
- Đo bằng Lighthouse/Chrome Performance trên mobile CPU 4x slowdown thay vì chỉ nhìn kích thước file.

## 3.3. Giao diện & design system — P1

### Điểm tốt

- Có dark/light theme và biến CSS.
- Có focus-visible chung (`src/index.css:41-44`).
- Có skip link và mobile bottom sheet trong `App.jsx`.
- UI có cá tính, phù hợp sản phẩm học tập STEM.

### Vấn đề

- Nhiều ngôn ngữ thị giác cùng tồn tại: editorial/brutalist, glass, Apple, neo, Sandra, upgrade. Điều này làm giảm cảm giác sản phẩm thống nhất.
- README và tên package còn là `chem-study`, trong khi sản phẩm đã là Aitk/A7 Assistant.
- H1 uppercase/cỡ rất lớn và font mono nhiều nơi có thể làm giảm khả năng đọc dài trên mobile.
- Một số `<img>` thiếu `alt` theo static scan: `DocsLibrary.jsx`, `MobileHeader.jsx`, `AIChat.jsx`, `ToolsKit.jsx`, `PromptLibrary.jsx`.
- Có sử dụng `dangerouslySetInnerHTML` trong `ChatMarkdown.jsx` và `NotebookGuide.jsx`; cần bảo đảm sanitizer không bỏ sót HTML từ nội dung AI/user.

**Đề xuất thiết kế:**

- Chốt một hướng: **“Study OS tối giản, có điểm nhấn hóa học”**. Giữ nền tối/sáng, accent xanh-lục hoặc cam, bỏ các lớp hiệu ứng không phục vụ học.
- Xây design token: color, surface, border, radius, shadow, typography, spacing, motion; dùng component `Button`, `Card`, `Input`, `Modal`, `Toast`, `EmptyState` thống nhất.
- Home chỉ trả lời 3 hành động chính: “Hỏi AI”, “Chụp đề”, “Ôn tập hôm nay”; các tool còn lại đưa vào launcher.
- Trang Tools chia theo mục tiêu học thay vì danh sách dài: **Giải bài**, **Ôn tập**, **Tính toán**, **Theo dõi tiến độ**.
- Responsive ưu tiên thumb zone: composer AI cố định thấp, nút gửi/ảnh/mic có vùng chạm tối thiểu 44 px.
- Thêm empty state có hướng dẫn, skeleton theo nội dung và error state có nút retry.

## 3.4. UX AI — P1

Nền tảng đã có quick prompts, ảnh, voice, streaming, history và fallback; đây là nền tảng tốt. Cần chuyển từ “chat đa năng” sang “trợ lý học có kiểm soát”.

### Tính năng nên thêm

1. **Study mode:** Giải bài / Gợi ý từng bước / Kiểm tra đáp án / Ôn lý thuyết / Tạo bài tương tự.
2. **Explain level:** lớp 10, 11, 12, đại học; điều chỉnh độ dài và ký hiệu.
3. **Cấu trúc câu trả lời chuẩn:** Đề bài đã đọc → Dữ kiện → Công thức → Thay số → Đáp án → Tự kiểm tra.
4. **Answer verification:** chạy bộ kiểm tra hóa học/đơn vị/đại số cục bộ trước khi hiển thị; cảnh báo “cần kiểm tra” thay vì tự tin tuyệt đối.
5. **Citation/context:** khi trả lời từ thư viện sách/ghi chú, hiển thị nguồn và đoạn trích.
6. **Save to learning loop:** một nút lưu câu hỏi thành flashcard, thêm vào Wrong Notebook hoặc tạo quiz 5 câu.
7. **Feedback có cấu trúc:** đúng/sai, lỗi kiến thức, lỗi trình bày, phản hồi tự do; dùng dữ liệu để cải thiện prompt/model.
8. **OCR preview:** cho phép người dùng sửa phần đề AI đã đọc trước khi giải.
9. **Offline fallback:** khi mất mạng, mở lại lịch sử, công cụ tính và flashcard; AI hiển thị trạng thái rõ ràng.
10. **Safety/age guardrail:** bộ lọc server-side cho nội dung nguy hiểm; không đặt `BLOCK_NONE` cho mọi safety category như tại `src/lib/ai.js:379-383` nếu không có lớp kiểm soát khác.

### Luồng UX khuyến nghị

`Chọn mục tiêu → nhập/chụp đề → xem OCR → chọn mức giải → streaming → kiểm tra → lưu vào ôn tập → AI nhắc lại sau 1/3/7 ngày`.

## 3.5. Dữ liệu, lưu trữ và đồng bộ — P1

Lịch sử chat được giới hạn 100 ở API nhưng client có `MAX_CHATS = 50`; cần thống nhất và có cơ chế pagination. `debouncedSync` nuốt lỗi sau khi sync thất bại (`src/lib/aiChatApi.js:157-168`), có thể khiến người dùng tưởng dữ liệu đã lưu.

**Đề xuất:**

- Hiển thị trạng thái `Đang lưu / Đã lưu / Chưa đồng bộ` trên chat.
- Queue thay đổi offline bằng IndexedDB, retry có backoff, conflict resolution theo phiên bản.
- Không lưu base64 ảnh trong chat local lâu dài; upload object storage với URL có hạn, thumbnail riêng.
- Có nút export/delete dữ liệu và chính sách retention.
- Dùng pagination/virtual list cho chat dài và danh sách notes/exams.

## 4. Lộ trình triển khai đề xuất

### Phase 0 — 1–2 ngày: khóa rủi ro

- Di chuyển provider key sang server/Edge Function.
- Viết lại Firebase rules thành một file hợp lệ, khóa `.read/.write`, kiểm thử rules.
- Xác nhận Supabase RLS cho `ai_chats`: user chỉ đọc/sửa/xóa bản ghi của mình.
- Sanitize Markdown/HTML từ AI; bổ sung `alt` cho ảnh.
- Cập nhật README, package name, `.env.example`, tài liệu deploy.

### Phase 1 — 3–5 ngày: nền tảng UI/performance

- Tạo design tokens và component primitives.
- Bỏ import CSS trùng; hợp nhất stylesheet AI và Tools.
- Lazy-load PDF/Three/Admin; nén asset; thêm bundle budget CI.
- Thêm trạng thái save/sync, retry và error boundary theo route.

### Phase 2 — 1–2 tuần: trải nghiệm học AI

- Study mode + OCR preview + answer verification.
- Lưu câu hỏi vào Wrong Notebook/flashcard/quiz.
- Dashboard “Hôm nay học gì?” dựa trên lỗi sai, streak và kỳ thi sắp tới.
- Analytics sự kiện không chứa nội dung nhạy cảm: `ai_request_started`, `ai_first_token`, `ai_answer_saved`, `quiz_completed`, `sync_failed`.

### Phase 3 — 1 tuần: chất lượng phát hành

- Unit test cho parser Hóa, quota, routing, local migration.
- E2E cho login, gửi text, gửi ảnh, stop/retry, lưu chat, logout.
- Visual regression cho Home/AI/Tools ở mobile và desktop.
- Lighthouse CI + bundle size CI + error monitoring.

## 5. KPI nghiệm thu

| Nhóm | KPI đề xuất |
|---|---|
| Hiệu năng | LCP < 2,5 s; INP < 200 ms; initial JS gzip < 150 kB; initial CSS gzip < 35 kB |
| AI | Tỷ lệ first token < 3 s; lỗi request < 2%; retry thành công > 80%; hiển thị rõ provider fallback |
| UX học tập | Tỷ lệ lưu đáp án thành flashcard; tỷ lệ hoàn tất quiz; tỷ lệ quay lại sau 1/7 ngày |
| Tin cậy | 0 secret provider trong client build; 100% bảng cá nhân có RLS; sync failure có hiển thị và retry |
| Accessibility | Không còn ảnh thiếu alt; keyboard flow cho modal/chat; WCAG AA cho contrast/focus; reduced motion hoạt động |
| Bảo trì | CSS page-level không import global trùng; có lint/test/CI; README khớp chức năng thực tế |

## 6. Kết luận

Không nên tiếp tục thêm nhiều “lớp upgrade” giao diện hoặc provider AI trước khi xử lý **server-side security, rules dữ liệu và bundle startup**. Sau khi khóa ba nền tảng này, hướng phát triển có giá trị nhất của Aitk là trở thành **hệ điều hành ôn tập cá nhân**: AI không chỉ trả lời, mà giúp học sinh sửa lỗi, lưu kiến thức và quay lại ôn đúng thời điểm.

> **Khuyến nghị hành động ngay:** thực hiện Phase 0, sau đó đo lại Lighthouse/bundle; chỉ khi baseline an toàn và nhẹ hơn mới bắt đầu redesign Home/AI theo Study mode.
