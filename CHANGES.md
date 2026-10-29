# Nâng cấp Lộ trình kiến thức

Chép đè các file cùng đường dẫn vào dự án. File không đổi (BankTagger, SidePanels, roadmapStore,
studyPlanStore, bankAdmin…) giữ nguyên bản cũ.

## Hai import cần thêm
- `home-roadmap-v2.css`: import SAU `home-apple-bento.css` (nơi Home nạp CSS card).
- `roadmap-page-v2.css`: đã import sẵn trong RoadmapPage.jsx, sau `roadmap-page.css`.
Gỡ hai file v2 là về giao diện cũ, logic không bị ảnh hưởng.

## 1. Sửa lỗi / đồng bộ
- PracticeRunner: Enter khi focus đang ở nút "Câu tiếp" chạy hai lần (phím tắt + click), có thể ghi trùng
  phiên ở câu cuối. Thêm chặn theo thẻ đích và cờ `saved`.
- FlashcardSession: Space/Enter khi focus ở nút lật thẻ bị xử lý hai lần (lật rồi lật lại). Đã chặn.
- RoadmapPage: thời gian học bị cộng trùng (phiên luyện nằm cả trong `attempts` lẫn `sessions`). Đã tách.
- RoadmapPage: làm xong phiên luyện thì điểm không đổi cho tới khi tải lại từ mạng. Nay phiên trên thiết bị
  được ghép tại chỗ nên điểm, streak, biểu đồ cập nhật ngay; bỏ `load(true)` sau mỗi phiên.
- RoadmapPage: link `#roadmap?chapter=…` giữ nguyên trên thanh địa chỉ khi đóng sheet. Nay tự cập nhật bằng
  replaceState (mở chương thì link chia sẻ được, đóng thì link sạch).
- studyPlan: ngày thi `YYYY-MM-DD` hiểu theo giờ địa phương; `min` của ô chọn ngày không còn theo UTC
  (sáng sớm giờ VN trước đây cho chọn đúng ngày hôm nay, rồi báo "ngày đã qua"). Một chương không còn
  xuất hiện hai lần trong cùng một ngày (trùng khoá ô "đã xong").
- Ngưỡng "đạt": thêm `MASTERED_SCORE` (=80) trong roadmapEngine, Overview và ngữ cảnh AI dùng chung.
  Card trang chủ vẫn dùng `MASTERED_PCT` của data/roadmap.js, và đó là ĐỘ CHÍNH XÁC, không phải điểm thành thạo.
- CommandPalette: tìm không phân biệt hoa/thường và dấu, xếp hạng kết quả, Home/End không còn cướp phím
  của ô nhập, chọn bằng mũi tên khớp thứ tự hiển thị, ARIA combobox/listbox, trả focus khi đóng,
  thêm lối tắt Lộ trình Lớp 11/12.
- KnowledgeMap: đường nối tiên quyết cùng cột không còn vẽ vòng sai.

## 2. Chức năng mới
- Nhịp học (Insights.jsx): chuỗi ngày học theo giờ địa phương, biểu đồ 14 ngày có màu theo độ chính xác,
  mục tiêu tuần kèm "còn bao nhiêu câu", thống kê thẻ ghi nhớ.
- Ôn thẻ đến hạn: từ trang (mọi chương) và từng chương; chọn 5/10/15 thẻ. Thẻ nay nhớ chương của nó.
- Luyện câu mới ưu tiên câu chưa làm.
- Phím `/` nhảy tới ô tìm chương.

## 3. Giao diện
Kính mờ ở thanh chọn khối, thẻ "Tiếp tục học" có chiều sâu, chỉ số có hover, animation mở sheet,
hiệu ứng đáp án đúng/sai, skeleton shimmer, vòng % đổi màu theo mức, vùng chạm ≥44px trên mobile,
`prefers-reduced-motion`, kiểu in cho kế hoạch.

## Kiểm thử
`test/roadmapInsights.test.js`: 14 test (streak, hoạt động theo ngày, thẻ theo chương, ngày/giờ studyPlan).
Đã chạy với TZ Asia/Ho_Chi_Minh, America/Los_Angeles, UTC: đều qua. Test flashcardStore cũ cũng qua.

## Chưa kiểm chứng được
- Thiếu data/roadmap.js, lib/topicProgress.js, Icons.jsx, supabase.js, classroom.js nên chưa chạy được test cũ
  của roadmapEngine/studyPlan, và chưa chạy app trên trình duyệt. File JSX mới chỉ qua kiểm tra cú pháp (esbuild).
  Hãy chạy `npx vitest run` và mở thử trang trước khi merge.
- BankTagger/bankAdmin: bảng `questions` vẫn ghi được bằng anon key. Cần siết RLS ở Supabase;
  UI không thay thế được lớp bảo mật.
- `routes.js` không được App.jsx dùng (App tự định tuyến qua `PAGES`), nên mình không sửa.
