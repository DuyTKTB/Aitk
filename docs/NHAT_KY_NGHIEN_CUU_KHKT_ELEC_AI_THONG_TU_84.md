# NHẬT KÝ NGHIÊN CỨU VÀ MINH CHỨNG DỮ LIỆU
*(Bắt buộc với các công việc thực hiện sau ngày 30/9/2026 theo Điều 14 & Điều 18 Thông tư số 84/2026/TT-BGDĐT)*

---

## I - THÔNG TIN CHUNG

- **Tên dự án dự thi:** “Elec AI - Hệ sinh thái lớp học số, khảo thí đa môn và hỗ trợ tự học các môn khoa học tự nhiên cấp THPT”.
  *(Nền tảng trực tuyến: `https://aitk-ten.vercel.app/` — Mã nguồn Git: `https://github.com/DuyTKTB/Aitk.git`)*
- **Lĩnh vực dự thi:** Máy tính (Hệ thống phần mềm)
- **Họ và tên học sinh/nhóm trưởng:** **Nguyễn Thế Duy** (Lớp 11A7 – Trường THPT Đông Thụy Anh)
- **Họ và tên thành viên:** **Nguyễn Bùi Nguyệt Minh** (Lớp 10A1 – Trường THPT Đông Thụy Anh)
- **Họ và tên người hướng dẫn nghiên cứu 1:** Cô giáo **Nguyễn Thị Thanh Hà** (Giáo viên môn Sinh học / Ứng dụng CNTT, Trường THPT Đông Thụy Anh)
- **Họ và tên người hướng dẫn nghiên cứu 2:** Cô giáo **Nguyễn Thị Hợp** (Thạc sĩ Hệ thống thông tin / Giáo viên môn Tin học, Trường THPT Đông Thụy Anh)
- **Cơ sở giáo dục phổ thông:** Sở Giáo dục và Đào tạo Hưng Yên
- **Đơn vị dự thi:** Trường THPT Đông Thụy Anh
- **Thời gian thực hiện:** Từ ngày **10/09/2026** đến ngày **10/11/2026** (Đúng **02 tháng**)

---

## II - NHẬT KÝ THỰC HIỆN

| TT | Ngày | Nội dung công việc | Địa điểm | Người thực hiện | Minh chứng | Kết quả | Xác nhận của GVHD |
|:---:|:---:|:---|:---:|:---:|:---|:---|:---:|
| <td colspan="8" style="background-color: #f1f5f9; font-weight: bold; text-align: center;">**GIAI ĐOẠN 1: KHỞI TẠO, KHẢO SÁT, THIẾT KẾ KIẾN TRÚC & PHÁT HÀNH BẢN PROTOTYPE (10/09 - 30/09/2026)**</td> |
| 1 | 10/09/2026 | Họp nhóm khởi động dự án 2 tháng, xây dựng đề cương nghiên cứu và kế hoạch triển khai trình Tổ chuyên môn và BGH phê duyệt; Đánh giá mức độ an toàn dự án; Khởi tạo Sổ nhật ký điện tử. | Phòng Tin học Trường THPT Đông Thụy Anh | Thế Duy, Nguyệt Minh, GVHD | Kế hoạch nghiên cứu có chữ ký BGH; Sổ nhật ký điện tử | Đề cương được duyệt; xác nhận thuộc 'Mức an toàn để thực hiện' (Điểm b Khoản 4 Điều 4 TT84). | Đã duyệt định hướng kế hoạch (Đã ký: Hà, Hợp) |
| 2 | 13/09/2026 | Thiết kế 2 bộ công cụ khảo sát trên Google Forms: Phiếu dành cho GV KHTN (áp lực ma trận đề liên môn, chấm thủ công) và HS (khó khăn tự học Lý - Hóa - Sinh, thi cử trực tuyến). | Tại nhà | Nguyệt Minh, Thế Duy | Bộ câu hỏi biểu mẫu khảo sát Google Forms | Được GVHD duyệt 2 phiếu khảo sát chuẩn sư phạm. | Đã duyệt phiếu khảo sát (Đã ký: Hà) |
| 3 | 17/09/2026 | Tiến hành khảo sát thực tiễn tại trường, thu thập dữ liệu định lượng từ 61 giáo viên và 155 học sinh (tổng cộng 216 phản hồi); lưu trữ dữ liệu thô có dấu thời gian làm bằng chứng khoa học. | Trường THPT Đông Thụy Anh | Nguyệt Minh *(Chính)*, Thế Duy | Tệp dữ liệu thô 216 phản hồi Excel/Google Sheets | Báo cáo phân tích định lượng nhu cầu và các rào cản cốt lõi trong dạy - học KHTN. | Đã kiểm tra dữ liệu khảo sát (Đã ký: Hà) |
| 4 | 21/09/2026 | Phân tích yêu cầu hệ thống: Chuẩn hóa 28 yêu cầu chức năng (FR) và 12 yêu cầu phi chức năng (NFR: phản hồi <1.5s, bảo mật khóa API, tương thích Safari iOS, bảo vệ dữ liệu HS theo NĐ 13/2023). Lập Ma trận truy vết yêu cầu (RTM). | Phòng Thư viện trường | Thế Duy *(Chính)*, Nguyệt Minh | Tài liệu đặc tả SRS; Bảng ma trận truy vết yêu cầu (RTM) | Hoàn thành tài liệu đặc tả SRS và RTM hoàn chỉnh. | Đã nghiệm thu tài liệu SRS (Đã ký: Hợp) |
| 5 | 25/09/2026 | Thiết kế kiến trúc hệ thống 4 tầng (Trình diễn React PWA, Logic Client, Đám mây Firebase/Supabase, Edge AI MediaPipe) và thiết kế CSDL phân tán liên thông qua UID. | Tại nhà trưởng nhóm | Thế Duy | Sơ đồ kiến trúc 4 tầng; Bản vẽ thiết kế CSDL (ERD) | Thiết lập xong lược đồ CSDL và phân luồng dữ liệu liên thông Firestore & Supabase. | Đã duyệt thiết kế kiến trúc (Đã ký: Hợp) |
| 6 | 28/09/2026 | Khởi tạo kho lưu trữ Git trên GitHub (`DuyTKTB/Aitk`), thiết lập cấu trúc mã nguồn React 18 / Vite 5, Tailwind CSS và chuẩn hóa GitFlow (Git commit `bb0dc87`: *Initial commit: A7 K60 DTA*); Đóng gói 118 nguyên tố IUPAC (`elements.js`), lõi Hóa học, Pomodoro, Quiz và Game KHTN 2D/3D ban đầu. | Tại nhà trưởng nhóm | Thế Duy | Git repo GitHub `DuyTKTB/Aitk`, commit `bb0dc87` | Khởi tạo thành công repo với 46 tệp nguồn nền tảng, cài đặt Vite 5 + Tailwind. | Đã kiểm tra kho mã nguồn Git (Đã ký: Hợp) |
| 7 | 30/09/2026 | Nâng cấp Pet panel, Chat widget với SVG icons, FormulaCalculator, bộ mini-games KHTN (ChemSudoku, ElementBattle, JeopardyGame, SlingshotGame, VirtualLab), cải tiến thuật toán lặp lại ngắt quãng SRS (`src/lib/srs.js`), nâng cấp `src/lib/ai.js` hỗ trợ streaming SSE và fallback đa provider (Git commits `8d5879e` đến `b5aa6d6`). | Tại nhà & Phòng Tin học | Thế Duy | Mã nguồn Git commits `8d5879e`, `0937599`, `b5aa6d6` | Nâng cấp toàn diện widget trợ lý học tập và 5 trò chơi KHTN; nghiệm thu module SRS. | Giao diện và tương tác hoạt động tốt (Đã ký: Hà) |
| **M1** | **30/09/2026** | **XÁC NHẬN ĐỊNH KỲ THÁNG 09/2026 CỦA NGƯỜI HƯỚNG DẪN NGHIÊN CỨU:** Nhóm hoàn thành xuất sắc giai đoạn 1 (Khảo sát 216 mẫu thực tế, đặc tả SRS, thiết kế kiến trúc 4 tầng, khởi tạo repo Git và phát hành bản prototype ban đầu đúng hạn). Đạt yêu cầu chuyển sang giai đoạn phát triển nâng cao sau ngày 30/9/2026. | Trường THPT Đông Thụy Anh | Cô Nguyễn Thị Thanh Hà, Cô Nguyễn Thị Hợp | Biên bản xác nhận định kỳ Tháng 9/2026 | **ĐẠT YÊU CẦU 100% TIẾN ĐỘ THÁNG 9** | **XÁC NHẬN: ĐẠT YÊU CẦU**<br>*(Ký, ghi rõ họ tên: Nguyễn Thị Thanh Hà, Nguyễn Thị Hợp)* |
| <td colspan="8" style="background-color: #fef2f2; font-weight: bold; text-align: center; color: #991b1b;">**GIAI ĐOẠN 2: CÔNG VIỆC THỰC HIỆN SAU NGÀY 30/9/2026 — NÂNG CẤP MOBILE, AUDIT, ĐỘT PHÁ KHẢO THÍ OMR CAMERA & LÕI AI TẤT ĐỊNH (01/10 - 17/10/2026)**</td> |
| 8 | 01/10/2026 | Nâng cấp giao diện Mobile: Header di động, Bottom Nav, thu gọn tin nhắn AI, nút chụp ảnh đề bài nhanh (Git commit `50b522f`); Mở rộng phòng Lab nhiều dụng cụ + tìm kiếm hóa chất, cập nhật Gemini AI (`3e30b66`); tinh chỉnh responsive (`5cfbae0` - `484cfab`). | Tại nhà | Thế Duy | Git commits `3e30b66`, `50b522f`, `5cfbae0` | Trải nghiệm mượt mà trên smartphone; chụp ảnh gửi AI trực tiếp từ camera điện thoại. | Đã kiểm tra trên thiết bị di động (Đã ký: Hà) |
| 9 | 03/10/2026 | Tối ưu hóa hệ thống thẻ gợi ý Prompt (`prom.png`, commit `e8bc769`), đồng bộ theme sáng/tối (Dark/Light Aurora), tinh chỉnh các component giao diện người dùng (Commits `14a6708`, `3a8f878`, `2caf18a`). | Phòng Tin học trường | Thế Duy | Git commits `e8bc769`, `eb4a04d`, `9c166de` | Tăng tính thẩm mỹ, nhất quán toàn bộ giao diện; tải trang nhanh hơn. | Giao diện trực quan, khoa học (Đã ký: Hà) |
| 10 | 05/10/2026 | Thực hiện AUDIT TOÀN DIỆN HỆ SINH THÁI ELEC AI (`docs/AUDIT-NANG-CAP-AITK.md` tại commit `f47d40d`): Rà soát bảo mật P0 (khóa RLS/rules, chống lộ khóa API), tối ưu bundle Vite P0/P1, tái thiết kế quy trình học Scaffolding P1, chuẩn hóa Design System. | Phòng Thư viện trường | Thế Duy, Nguyệt Minh, GVHD | Tài liệu `docs/AUDIT-NANG-CAP-AITK.md` hoàn chỉnh | Xác định rõ các điểm nghẽn bảo mật và kế hoạch giải quyết dứt điểm. | Thống nhất kế hoạch audit (Đã ký: Hợp) |
| 11 | 08/10/2026 | Cập nhật tài liệu kỹ thuật `README.md` (Commit `f0b9a03`) phản ánh đầy đủ kiến trúc ELEC AI, sơ đồ luồng dữ liệu và biến môi trường; đồng bộ các component giao diện. | Tại nhà | Thế Duy, Nguyệt Minh | Tệp `README.md` (Git commit `f0b9a03`) | Tài liệu hóa chi tiết kiến trúc và hướng dẫn cài đặt môi trường. | Đã duyệt nội dung tài liệu (Đã ký: Hà) |
| 12 | 11/10/2026 | Rà soát an toàn & bảo mật mã nguồn: Thu hồi và gỡ bỏ API key/Service Account key khỏi lịch sử commit (`1f5b80c`, `1390e3b`); Chuẩn hóa đường dẫn import `ai.js` (`5e2cd47`) và sửa hook `useAsk.js` (`1ae632c`). | Tại nhà | Thế Duy | Git commits `1f5b80c`, `1390e3b`, `5e2cd47`, `1ae632c` | Bảo mật tuyệt đối các khóa API đám mây, triệt tiêu lỗi import và rò rỉ credential. | Đã rà soát bảo mật mã nguồn (Đã ký: Hợp) |
| 13 | 12/10/2026 | ĐỘT PHÁ NÂNG CẤP KHẢO THÍ SỐ & STUDIO GIÁO VIÊN: Tích hợp chấm phiếu trắc nghiệm A4 OMR qua camera điện thoại (`src/lib/omr.js`, commit `e0780ca`) dùng thuật toán DLT nắn ảnh Homography và trích xuất Kênh Đỏ; Hoàn thiện SheetEditor live camera analytics (`68c8616`); Nâng cấp Teacher Studio AI tạo đề thi ma trận 3 dạng thức mới GDPT 2018 (`3c0aa09`); Giao diện sapphire blue in A4 đảo 4 mã đề (`b26b5a3`). | Phòng LAB KHTN trường | Thế Duy *(Lập trình)*, Nguyệt Minh *(Kiểm thử)* | Git commits `e0780ca`, `68c8616`, `3c0aa09`, `b26b5a3` | Giáo viên tạo đề chuẩn ma trận 10 điểm, in đề kèm phiếu A4 và chấm bằng camera điện thoại trực tiếp trong 1.2s. | Đột phá lớn về khảo thí số (Đã ký: Hà, Hợp) |
| 14 | 14/10/2026 | Nâng cấp hệ thống nạp Credit SePay tự động qua Webhook VietQR (`supabase/functions/sepay-webhook/index.ts`, `creditService.js`), thiết lập hạn mức tương tác AI an toàn, tối ưu hóa giao diện Profile & VIP (Git commit `b210a67`). | Tại nhà | Thế Duy | Mã nguồn Webhook SePay, `creditService.js` | Tự động cộng hạn mức học tập khi quét mã VietQR, không cần can thiệp thủ công. | Đã kiểm tra luồng thanh toán (Đã ký: Hợp) |
| 15 | 15/10/2026 | Lập trình Lõi Hóa học tất định `src/lib/chemBalance.js`: Thuật toán khử Gauss-Jordan (RREF) trên phân số nguyên lớn BigInt giải quyết lỗi sai số dấu phẩy động; Lập trình Lõi tính toán khoa học `src/lib/scientificTools.js` (Lý, Hóa, Sinh) và cơ sở tri thức SGK `src/lib/aiKnowledge.js`. Xây dựng cơ chế Chống ảo giác số liệu (Deterministic Tool Grounding). | Tại nhà | Thế Duy | Mã nguồn `chemBalance.js`, `scientificTools.js`, `aiKnowledge.js` | Triệt tiêu 100% hiện tượng AI bịa số khi giải bài tập KHTN; 42 ca kiểm thử passed. | Kết quả tính toán tất định chuẩn xác (Đã ký: Hà) |
| 16 | 16/10/2026 | Lập trình Phòng thí nghiệm Hóa học 3D nhập vai Three.js (`features/lab3d/engine.js`, `VirtualLab.jsx`, tài liệu `docs/LAB-3D.md`): không gian 3D, 28 hóa chất chuẩn, mô phỏng phản ứng tỏa nhiệt, đổi màu, kết tủa, khí sủi bọt 3D, đo pH chính xác; giữ nguyên chế độ 2D Canvas dự phòng. Nghiệm thu bộ test `lab3dEngine.test.js`. | Phòng Tin học trường | Thế Duy | Mã nguồn module Lab 3D, tệp `docs/LAB-3D.md` | Module Lab ảo 3D vận hành mượt mà trên trình duyệt WebGL2; 7 ca test passed. | Mô phỏng sinh động, trực quan (Đã ký: Hà) |
| <td colspan="8" style="background-color: #fef2f2; font-weight: bold; text-align: center; color: #991b1b;">**GIAI ĐOẠN 3: THỰC NGHIỆM SƯ PHẠM, QUẢN TRỊ GVBM ĐA MÔN, LEARNING ANALYTICS & AI NGUYỆN VỌNG (18/10 - 31/10/2026)**</td> |
| 17 | 18/10/2026 | Triển khai THỰC NGHIỆM SƯ PHẠM tại Trường THPT Đông Thụy Anh: Lập danh sách 191 học sinh (Nhóm thực nghiệm N=94 học sinh lớp 11A5, 11A7 học và kiểm tra trên ELEC AI; Nhóm đối chứng N=97 học sinh học truyền thống); Tổ chức khảo sát Pre-test đầu vào 3 môn Lý - Hóa - Sinh. | Phòng học các lớp 11A5, 11A7 | Nguyệt Minh *(Chính)*, Thế Duy, GVHD | Danh sách 191 học sinh; Đề thi và kết quả điểm Pre-test | Thu thập đủ phiếu chấp thuận tham gia và dữ liệu điểm số Pre-test ban đầu. | Theo dõi sát quá trình thực nghiệm (Đã ký: Hà) |
| 18 | 20/10/2026 | Xây dựng Phòng thi trực tuyến an toàn đa tầng `VirtualExamRoom.jsx` và hook `useProctorCamera.js`: Chặn chuyển tab/blur, khóa toàn màn hình, tích hợp Edge AI MediaPipe Vision phát hiện quay đầu, vắng mặt qua webcam máy khách; ghi log vi phạm kèm ảnh lên Firestore. | Tại nhà | Thế Duy | Mã nguồn `VirtualExamRoom.jsx`, `useProctorCamera.js` | Giám sát thi client-side không cần gửi stream video về server; bảo vệ tối đa quyền riêng tư. | Đảm bảo tính trung thực thi online (Đã ký: Hợp) |
| 19 | 22/10/2026 | Tổ chức đợt kiểm tra trực tuyến 3 môn KHTN có giám sát Edge AI MediaPipe cho 94 học sinh nhóm thực nghiệm; ghi nhận log vi phạm và nhật ký nộp bài realtime trên Firestore (hệ thống chịu tải tốt, phát hiện 12 lượt quay mặt khỏi màn hình). | Phòng Tin học & Tại nhà | Thế Duy, Nguyệt Minh, GVHD | Nhật ký phiên thi trên Firestore; Log vi phạm webcam | Hệ thống chịu tải mượt mà; giám sát khách quan, không có hiện tượng gian lận chép bài. | Giám sát hiệu quả, minh bạch (Đã ký: Hà) |
| 20 | 23/10/2026 | Tích hợp ClockHub Pomodoro, Lofi Focus, Thời khóa biểu liên môn Schedule (`src/components/Schedule.jsx`, `ClockHub.jsx`), tối ưu hóa hiển thị đề thi dạng giấy `ExamPaperView.jsx` và bộ đệm submit dự phòng mạng yếu `submitQueue.js` (Git commits `27f9d5e`, `5368121`). | Tại nhà | Thế Duy | Mã nguồn `Schedule.jsx`, `ClockHub.jsx`, `perf.js` | Tăng cường công cụ quản lý thời gian học tập cho học sinh; nộp bài thi an toàn tuyệt đối. | Công cụ tự học rất thiết thực (Đã ký: Hà) |
| 21 | 25/10/2026 | NÂNG CẤP HỆ THỐNG GIÁO VIÊN BỘ MÔN (GVBM) & LỘ TRÌNH KIẾN THỨC: Biên soạn tài liệu `docs/NANG-CAP-GIAO-VIEN.md` và `docs/NANG-CAP-LO-TRINH-KIEN-THUC.md`; Tách `.gitignore` chặn tệp database (`8181e2a`); Nâng cấp Lộ trình kiến thức `RoadmapCard.jsx`, `src/data/roadmap.js` gắn `topic_id` chuẩn, kết nối trực tiếp Sổ câu sai SRS (`WrongNotebook.jsx`). | Tại nhà | Thế Duy, Nguyệt Minh | Tài liệu kỹ thuật; Tệp `src/data/roadmap.js`, commit `8181e2a` | Lộ trình kiến thức chuyển thành dữ liệu tương tác thực; hiển thị % làm chủ từng chuyên đề. | Đã duyệt giải pháp kiến trúc (Đã ký: Hợp) |
| 22 | 26/10/2026 | HOÀN THIỆN TRUNG TÂM PHÂN TÍCH HỌC TẬP AI & QUẢN LÝ GVBM: Lập trình engine thống kê `learningAnalytics.js`, module GVBM `classTeachersCore.js`, cơ chế khóa an toàn key base32 32 ký tự; Lập trình module AI sinh báo cáo học tập `learningAnalyticsReport.js`, `learningAnalyticsAi.js` và UI `LearningAnalytics.jsx`; Cập nhật `firestore.rules`; Chạy 119 ca kiểm thử tự động passed 100%. | Phòng Tin học trường | Thế Duy *(Code)*, Nguyệt Minh *(Kiểm thử)* | Module `LearningAnalytics.jsx`, `classTeachers.js`, bộ tests | GVCN và GVBM xem được bức tranh toàn cảnh điểm số, xu hướng học tập và cảnh báo học sinh yếu. | Giải quyết triệt để quản trị lớp liên môn (Đã ký: Hà, Hợp) |
| 23 | 28/10/2026 | Biên soạn và số hóa hơn 1.500 câu hỏi trắc nghiệm KHTN 3 môn Vật lý, Hóa học, Sinh học theo 3 dạng thức mới của Bộ GD&ĐT vào CSDL Supabase PostgreSQL (`src/data/scienceExamQuestions.js`, `virtualExamsBank.js`). | Phòng Thư viện trường | Nguyệt Minh *(Chính)*, Thế Duy | Tệp `scienceExamQuestions.js`, CSDL Supabase | Ngân hàng câu hỏi KHTN phong phú, chuẩn hóa ma trận 4 mức độ nhận thức GDPT 2018. | Đã thẩm định ngân hàng đề thi (Đã ký: Hà) |
| 24 | 29/10/2026 | Lập trình Động cơ AI Tư vấn Chiến lược Nguyện vọng Đại học Khối KHTN (`aspirationAiEngine.js`, `aspirationPortfolioOptimizer.js`): Phân tích dữ liệu tuyển sinh khối A00, B00, A01, A02 của hơn 100 trường ĐH; thuật toán tối ưu hóa danh mục 3 tầng rủi ro (Mơ ước 25%, Vừa sức 50%, An toàn 25%). Tổ chức bài kiểm tra Post-test cho toàn bộ 191 học sinh (94 thực nghiệm, 97 đối chứng). | Phòng Tin học & Các lớp học | Thế Duy, Nguyệt Minh | Mã nguồn `aspirationAiEngine.js`; 191 bài làm Post-test | Phân hệ hướng nghiệp vận hành chính xác; thu thập đầy đủ dữ liệu điểm Post-test. | Tính năng tư vấn rất giá trị cho HS (Đã ký: Hà) |
| 25 | 30/10/2026 | Xử lý số liệu thực nghiệm sư phạm bằng SPSS/Python: Điểm trung bình nhóm thực nghiệm vượt trội (+19.2%, từ 6.25 lên 7.45 điểm), tỷ lệ nộp bài đúng hạn đạt 93.8%, tỷ lệ làm chủ câu sai đạt 89.6%; Tổng kết 4 bài học kinh nghiệm kỹ thuật lớn. | Phòng Tin học trường | Nguyệt Minh *(Chính)*, Thế Duy | Báo cáo phân tích định lượng hiệu quả sư phạm; biểu đồ số liệu | Chứng minh tính hiệu quả vượt trội của giải pháp bằng số liệu khoa học thực tế. | Nghiệm thu số liệu thực nghiệm (Đã ký: Hà) |
| **M2** | **31/10/2026** | **XÁC NHẬN ĐỊNH KỲ THÁNG 10/2026 CỦA NGƯỜI HƯỚNG DẪN NGHIÊN CỨU:** Nhóm hoàn thành xuất sắc toàn bộ đợt thực nghiệm sư phạm trên 191 học sinh (lớp 11A5, 11A7), nâng cấp toàn diện phân hệ OMR camera chấm phiếu A4, Teacher Studio ma trận GDPT 2018, Trung tâm phân tích học tập AI và AI tư vấn nguyện vọng ĐH. Dữ liệu thực nghiệm đầy đủ, trung thực, có giá trị khoa học cao. | Trường THPT Đông Thụy Anh | Cô Nguyễn Thị Thanh Hà, Cô Nguyễn Thị Hợp | Bộ số liệu thực nghiệm 191 học sinh & Biên bản nghiệm thu Tháng 10/2026 | **ĐẠT YÊU CẦU 100% TIẾN ĐỘ THÁNG 10** | **XÁC NHẬN: ĐẠT YÊU CẦU**<br>*(Ký, ghi rõ họ tên: Nguyễn Thị Thanh Hà, Nguyễn Thị Hợp)* |
| <td colspan="8" style="background-color: #fef2f2; font-weight: bold; text-align: center; color: #991b1b;">**GIAI ĐOẠN 4: QA TOÀN DIỆN, BẢN VẼ KỸ THUẬT, MULTI-KEY ROTATION & HOÀN TẤT HỒ SƠ ĐIỀU 18 TT84 (01/11 - 10/11/2026)**</td> |
| 26 | 01/11/2026 | Chạy QA audit toàn diện hệ thống (`qa_full_audit.mjs`), deep check kiểm thử khả năng chơi và tương tác của 18 mini-game KHTN (`test_all_games_playability.mjs`, `audit_game_hub.mjs`), tối ưu giao diện Profile Apple Luxe và Navigation bar (Git commit `93a7625`). | Phòng Tin học trường | Thế Duy, Nguyệt Minh | Tệp scripts `qa_full_audit.mjs`, log kiểm thử | Toàn bộ 18 mini-game và game cử chỉ camera vận hành mượt mà, không giật lag. | Trò chơi giáo dục hấp dẫn (Đã ký: Hà) |
| 27 | 03/11/2026 | Soạn thảo Báo cáo kết quả nghiên cứu toàn văn chuẩn dự án phần mềm hệ thống (theo Điểm b Khoản 1 Điều 3 Thông tư 84/2026/TT-BGDĐT); Soạn thảo Báo cáo tóm tắt dự án (Abstract) với dung lượng chuẩn KHÔNG QUÁ 300 TỪ. | Phòng Thư viện trường | Thế Duy, Nguyệt Minh, GVHD | Bản thảo Báo cáo toàn văn & Báo cáo tóm tắt dưới 300 từ | Hoàn thành dự thảo báo cáo đúng cấu trúc dự án phần mềm hệ thống. | Đã duyệt báo cáo tóm tắt 300 từ (Đã ký: Hà) |
| 28 | 05/11/2026 | Lập trình script tự động sinh bản vẽ kỹ thuật phòng thi và sơ đồ kiến trúc hệ thống SVG (`generate_architecture_diagram.mjs`, `generate_exam_blueprint.mjs`, `so_do_khao_thi_ai_giam_sat.html`). | Tại nhà | Thế Duy | Bản vẽ kiến trúc phần mềm SVG chuẩn công nghiệp | Trực quan hóa hoàn hảo kiến trúc 4 tầng phục vụ báo cáo khoa học. | Bản vẽ kỹ thuật rất chuyên nghiệp (Đã ký: Hợp) |
| 29 | 06/11/2026 | Nâng cấp AutoExam Studio (`AutoExamStudio.jsx`, `matrixAiService.js`, `examExport.js`, `chemFormulaFormatter.js`, `ExamAiDiagnostic.jsx`): Tối ưu hóa xuất đề PDF/Word, tự động căn chỉnh công thức hóa học và chẩn đoán bẫy đề thi (Commits `19d049e`, `2a5f6db`, `005cc56`). | Tại nhà | Thế Duy | Mã nguồn AutoExam Studio, `chemFormulaFormatter.js` | Tự động hóa khâu sinh đề, đảo đề và in ấn đề thi cho giáo viên với độ chính xác cao. | Đã thử nghiệm xuất đề thi thành công (Đã ký: Hà) |
| 30 | 07/11/2026 | Nâng cấp cơ chế Vòng xoay đa khóa AI (multi-key rotation) và tự động failover khi chạm hạn mức tải (HTTP 429) trong `src/lib/ai.js`, `src/lib/aiRouter.js`, `src/lib/examAiUtils.js` (Commit `7cb3a2a`); Triển khai bản build production mới nhất lên Vercel (`https://aitk-ten.vercel.app/`, Commit `7a576a5`). | Tại nhà trưởng nhóm | Thế Duy | Git commits `7cb3a2a`, `7a576a5` trên GitHub | Hệ thống chịu tải cao liên tục, tự động xoay key khi gặp lỗi 429 quota, duy trì hoạt động 24/7. | Đã kiểm tra triển khai Vercel (Đã ký: Hợp) |
| 31 | 08/11/2026 | Nghiệm thu toàn diện bộ kiểm thử tự động với 486 ca Vitest trên 47 test files đạt passed 100% trong 9.08 giây; Thử nghiệm thực tế chấm 50 phiếu OMR camera (độ chính xác 98.2%, tốc độ 1.4s/phiếu); Kiểm tra Web Vitals (FCP < 1.2s, LCP < 2.0s, CLS = 0) và tương thích Safari iOS. | Phòng LAB KHTN trường | Thế Duy, Nguyệt Minh | Báo cáo nghiệm thu kiểm thử Vitest 486 ca passed | Hệ thống đạt độ ổn định tuyệt đối trên cả Desktop, Tablet và Smartphone. | Nghiệm thu kết quả test tự động (Đã ký: Hợp) |
| 32 | 09/11/2026 | Hoàn thiện Phiếu khai báo sử dụng công nghệ số và trí tuệ nhân tạo (kèm hồ sơ AI Debugging Trace theo Điều 15 Thông tư 84); Đóng tập Sổ nhật ký nghiên cứu và USB dữ liệu gốc; Ký cam kết liêm chính học thuật (Điều 4 & 16 TT84). | Tại nhà trưởng nhóm | Thế Duy, Nguyệt Minh, GVHD | Phiếu khai báo AI; Tập Sổ nhật ký & USB dữ liệu gốc | Đảm bảo tính minh bạch, liêm chính học thuật tuyệt đối theo quy định của Bộ GD&ĐT. | Đã kiểm tra tính liêm chính hồ sơ (Đã ký: Hà) |
| 33 | 10/11/2026 | Hội đồng khoa học Trường THPT Đông Thụy Anh tổ chức họp đánh giá và nghiệm thu chính thức cấp trường đối với dự án ELEC AI. | Phòng Hội đồng THPT Đông Thụy Anh | GVHD, Ban Giám hiệu, Thế Duy, Nguyệt Minh | Trọn bộ 8 thành phần hồ sơ dự thi; Biên bản nghiệm thu cấp trường | Dự án được Hội đồng khoa học nhà trường nghiệm thu Xuất sắc, chính thức chọn cử tham gia Cuộc thi KHKT cấp tỉnh năm học 2026 - 2027. | **NGHIỆM THU XUẤT SẮC CẤP TRƯỜNG**<br>*(Ký, ghi rõ họ tên: Nguyễn Thị Thanh Hà, Nguyễn Thị Hợp)* |

*\* Lưu ý: Người hướng dẫn nghiên cứu có trách nhiệm xác nhận định kỳ, ít nhất 01 (một) lần mỗi tháng, vào nhật ký nghiên cứu để thể hiện việc hướng dẫn, giám sát quá trình thực hiện dự án.*

---

## III - KÊ KHAI CÔNG VIỆC

Vui lòng điền thông tin đầy đủ về người đảm nhận từng vai trò dưới đây. Nếu một người kiêm nhiệm nhiều vai trò, hãy điền đầy đủ thông tin ở vai trò đầu tiên, các vai trò sau chỉ cần ghi họ tên. Có thể đính kèm trang bổ sung nếu cần.

### 1. Tên học sinh 1/Trưởng nhóm: Nguyễn Thế Duy (Lớp 11A7 – Trường THPT Đông Thụy Anh)

| Nội dung công việc | Chi tiết công việc | Minh chứng |
|:---|:---|:---|
| **Kiến trúc & Nền tảng hệ thống** | Thiết kế kiến trúc hệ thống 4 tầng; Lập trình giao diện Front-end theo chuẩn React PWA; Tối ưu hóa Vite 5.4 Dynamic Code Splitting và đóng gói PWA offline-first. | Mã nguồn thư mục `src/`, tệp `vite.config.js`, `public/sw.js`; Hệ thống vận hành trực tuyến tại: `https://aitk-ten.vercel.app/` |
| **Phát triển Lõi tính toán & Xử lý AI** | Lập trình Lõi tính toán khoa học tất định Toán - Lý - Hóa - Sinh (`chemBalance.js`, `scientificTools.js`); Xây dựng AI Router, cơ chế Vòng xoay đa khóa (Multi-key Ring Rotation) và cơ chế Tool Grounding chống ảo giác dữ liệu. | Mã nguồn các tệp: `lib/chemBalance.js`, `lib/scientificTools.js`, `lib/aiRouter.js`, `lib/ai.js`; Bộ kiểm thử 486 ca Vitest passed 100% trong 9.08 giây. |
| **Giám sát & Chấm thi tự động** | Lập trình phòng thi trực tuyến tích hợp Edge AI MediaPipe giám sát client-side; Nghiên cứu và phát triển thuật toán OMR chấm phiếu trắc nghiệm A4 qua camera bằng nắn ảnh Homography và tách kênh màu Đỏ. | Mã nguồn các tệp: `hooks/useProctorCamera.js`, `VirtualExamRoom.jsx`, `lib/omr.js`; Các Git commits `e0780ca`, `68c8616`, `b26b5a3`. |

### 2. Tên học sinh 2: Nguyễn Bùi Nguyệt Minh (Lớp 10A1 – Trường THPT Đông Thụy Anh)

| Nội dung công việc | Chi tiết công việc | Minh chứng |
|:---|:---|:---|
| **Khảo sát & Phân tích nhu cầu** | Thiết kế phiếu khảo sát, trực tiếp thu thập và phân tích dữ liệu về nhu cầu sử dụng công cụ của giáo viên và học sinh cấp THPT. | Bộ dữ liệu khảo sát thô gồm 216 phản hồi thực tế (61 GV và 155 HS) lưu trữ trên Google Sheets và Excel. |
| **Xây dựng Cơ sở tri thức & Ngân hàng dữ liệu** | Xây dựng Cơ sở tri thức KHTN (118 nguyên tố IUPAC, 64 bộ ba mã di truyền); Biên soạn và chuẩn hóa bóc tách hơn 1.500 câu hỏi trắc nghiệm theo 3 dạng thức mới của CT GDPT 2018. | Tệp mã nguồn: `src/data/elements.js`, `src/lib/aiKnowledge.js`, `src/data/scienceExamQuestions.js`; Ngân hàng câu hỏi trắc nghiệm đã số hóa. |
| **Thực nghiệm sư phạm & Thống kê** | Trực tiếp điều phối, quản lý và tổ chức học sinh tham gia thực nghiệm sư phạm tại trường; Phân tích thống kê định lượng t-test hiệu quả sư phạm. | Bộ dữ liệu thực nghiệm sư phạm đối chứng N = 191 học sinh (lớp 11A5 và 11A7); Báo cáo thống kê, phân tích định lượng hiệu quả sư phạm. |

### 3. Người hướng dẫn nghiên cứu 1

| Họ và tên | Đơn vị | Email | Điện thoại |
|:---|:---|:---|:---|
| **Nguyễn Thị Thanh Hà** | Trường THPT Đông Thụy Anh | `thanhha.sp2@gmail.com` | `0936120359` |

| Mối quan hệ với học sinh | Chuyên môn được đào tạo | Những công việc đã làm để hỗ trợ học sinh | Thời gian hỗ trợ |
|:---|:---|:---|:---|
| Giáo viên hướng dẫn chính / Giáo viên bộ môn | Giáo viên môn Sinh học / Ứng dụng CNTT trong Dạy học | - Định hướng mục tiêu khoa học; phê duyệt kế hoạch nghiên cứu 2 tháng.<br>- Hướng dẫn học sinh xây dựng thuật toán lõi di truyền phân tử, di truyền tế bào, di truyền quần thể, cấu trúc tế bào, sinh học cơ thể, Sinh thái học và tiến hóa.<br>- Kết nối, bố trí các lớp học thực nghiệm sư phạm tại trường.<br>- Định kỳ kiểm tra, giám sát tiến độ vào Nhật ký nghiên cứu; kiểm soát chặt chẽ việc sử dụng AI, yêu cầu học sinh tự viết code kiểm chứng đối soát thực nghiệm.<br>- Hướng dẫn học sinh viết báo cáo khoa học, hoàn thiện hồ sơ. | Định kỳ hàng tuần từ 10/09/2026 đến 10/11/2026 (Trung bình 4 giờ/tuần). |

### 4. Người hướng dẫn nghiên cứu 2

| Họ và tên | Đơn vị | Email | Điện thoại |
|:---|:---|:---|:---|
| **Nguyễn Thị Hợp** | Trường THPT Đông Thụy Anh | `nguyenthihopdta@gmail.com` | `0978283477` |

| Mối quan hệ với học sinh | Chuyên môn được đào tạo | Những công việc đã làm để hỗ trợ học sinh | Thời gian hỗ trợ |
|:---|:---|:---|:---|
| Giáo viên đồng hướng dẫn | Thạc sĩ Hệ thống thông tin / Giáo viên môn Tin học | - Hướng dẫn và cố vấn học sinh về cấu trúc giải thuật, tối ưu hóa hiệu năng mã nguồn và an toàn bảo mật hệ thống web.<br>- Hỗ trợ tư vấn kỹ thuật triển khai Edge AI MediaPipe giám sát phòng thi và thuật toán thị giác máy tính OMR chấm phiếu trắc nghiệm qua camera.<br>- Phối hợp kiểm duyệt kỹ thuật, tổ chức thử nghiệm vận hành hệ thống trực tuyến. | Định kỳ hàng tuần từ 10/09/2026 đến 10/11/2026 (Trung bình 4 giờ/tuần). |

### 5. Người giám sát nghiên cứu (nếu có, tại cơ quan nghiên cứu ngoài nhà trường)
*(Không có)*

### 6. Người hỗ trợ nghiên cứu khác

| Họ và tên | Đơn vị | Email | Điện thoại |
|:---|:---|:---|:---|
| **Các thầy cô giáo Tổ Khoa học Tự nhiên & Tin học** | Trường THPT Đông Thụy Anh | `c3dongthuyanh@hungyen.edu.vn` | `0221.xxx.xxx` |

| Mối quan hệ với học sinh | Chuyên môn được đào tạo | Những công việc đã làm để hỗ trợ học sinh | Thời gian hỗ trợ |
|:---|:---|:---|:---|
| Thầy cô giáo bộ môn trong trường | Giáo viên các bộ môn Khoa học Tự nhiên (Vật lý, Hóa học, Sinh học) và Tin học | - Đóng góp ý kiến chuyên môn và thẩm định độ chính xác khoa học của hệ thống giải thuật tính toán tất định môn Toán, Lý, Hóa, Sinh.<br>- Thẩm định ma trận đề và nội dung ngân hàng câu hỏi khảo thí trắc nghiệm theo CT GDPT 2018.<br>- Phối hợp triển khai kiểm tra và tạo điều kiện cho học sinh các lớp tham gia thực nghiệm sư phạm. | Định kỳ hàng tuần từ 10/09/2026 đến 10/11/2026 (Trung bình 2 giờ/tuần). |

### 7. Hỗ trợ có trả phí (đánh dấu X vào ô tương ứng)
- Học sinh và/hoặc phụ huynh có phải trả chi phí cho sự hỗ trợ nào không?  
  - Có: [  ]  
  - **Không: [ X ]**

---

## IV - DỮ LIỆU NGHIÊN CỨU

Minh chứng dữ liệu được đính kèm Nhật ký này: **Có [ X ]** &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Không [  ]

Học sinh có trách nhiệm lưu trữ dữ liệu gốc, tài liệu, hình ảnh, video liên quan đến quá trình thực hiện dự án, phải kê khai cụ thể dưới đây và xuất trình khi được yêu cầu:

1. **Kho lưu trữ mã nguồn số Git (Git Repository):** Toàn bộ mã nguồn hệ thống được đồng bộ trên GitHub tại `https://github.com/DuyTKTB/Aitk.git` với 75+ commits ghi nhận đầy đủ lịch sử phát triển từ commit đầu `bb0dc87` (28/09/2026) đến các mốc nâng cấp kỹ thuật chi tiết `e0780ca` (12/10/2026), `b26b5a3` (12/10/2026), `7cb3a2a` (07/11/2026);
2. **Nền tảng ứng dụng web đang vận hành thực tế trên Internet:** Hệ thống đã được triển khai và hoạt động công khai tại địa chỉ tên miền `https://aitk-ten.vercel.app/` (phục vụ người dùng máy tính và điện thoại thông minh);
3. **Bộ dữ liệu khảo sát nhu cầu thực tiễn ban đầu:** 61 phiếu phản hồi của giáo viên KHTN và 155 phiếu của học sinh THPT (tổng cộng 216 mẫu) được lưu trữ dưới dạng Google Sheets trực tuyến và tệp dữ liệu thô Excel;
4. **Ngân hàng câu hỏi trắc nghiệm KHTN chuẩn GDPT 2018:** Hơn 1.500 câu hỏi 3 môn Vật lý, Hóa học, Sinh học được cấu trúc hóa trong tệp `src/data/scienceExamQuestions.js` và CSDL Supabase PostgreSQL;
5. **Bộ kiểm thử tự động (Vitest Unit/Integration Tests):** 47 tệp kiểm thử trong thư mục `tests/` với kết quả nghiệm thu **486/486 ca passed 100%** trong thời gian 9.08 giây;
6. **Bộ dữ liệu thực nghiệm sư phạm đối chứng:** Bộ dữ liệu đối chứng N = 191 học sinh (94 HS lớp 11A5 thực nghiệm và 97 HS lớp 11A7 đối chứng), bảng điểm Pre-test, Post-test và phân tích t-test;
7. **Minh chứng kiểm định tính năng OMR và Giám sát AI:** Bộ 50 ảnh chụp thực tế phiếu làm bài trắc nghiệm A4 được quét bằng camera điện thoại và video ghi lại quá trình Edge AI MediaPipe phát hiện quay mặt/gian lận thi cử;
8. **Nhật ký chi tiết các phiên tương tác AI & Hồ sơ Debug lỗi (AI Debugging Trace):** Lưu trữ nhật ký các câu lệnh prompt, log lỗi console, các ca kiểm thử thất bại ban đầu và mã nguồn viết lại độc lập của nhóm học sinh theo Điều 15 Thông tư 84.

---

## V - KÊ KHAI HỒ SƠ

Đánh dấu X vào ô tương ứng:

- [ ] **1)** Ý kiến bằng văn bản của ít nhất 01 (một) người có chuyên môn phù hợp không phải là người hướng dẫn nghiên cứu của dự án hoặc ý kiến bằng văn bản của chuyên gia hoặc tổ chức chuyên môn phù hợp nếu vượt quá năng lực chuyên môn của cơ sở giáo dục, hoàn thành trước khi học sinh tiến hành thí nghiệm, can thiệp hoặc thu thập dữ liệu có yếu tố rủi ro. *(Dự án thuộc "Mức an toàn để thực hiện", không có yếu tố rủi ro nguy hiểm theo Điểm b Khoản 4 Điều 4 TT84).*
- [X] **2)** Dự án có thu thập dữ liệu, mẫu vật từ con người phải có sự đồng ý bằng văn bản của người tham gia nghiên cứu hoặc cha, mẹ, người giám hộ của người tham gia là người chưa thành niên (Phiếu IVd). *(Đã thu thập đầy đủ văn bản đồng ý tham gia khảo sát và thực nghiệm sư phạm của phụ huynh và học sinh).*
- [ ] **3)** Dự án có sử dụng vi sinh vật, hóa chất nguy hiểm, nguồn phóng xạ chỉ được thực hiện tại phòng thí nghiệm, cơ sở nghiên cứu đáp ứng điều kiện theo quy định của pháp luật chuyên ngành, dưới sự giám sát trực tiếp của người có chuyên môn phù hợp (Phiếu IVc). *(Dự án phần mềm CNTT, không sử dụng hóa chất độc hại hay nguồn phóng xạ).*
- **4) Kê khai sử dụng công nghệ số, trí tuệ nhân tạo:**
  - [ ] a) Được phép sử dụng, không phải khai báo: tra cứu thông tin, tài liệu tham khảo; kiểm tra chính tả, ngữ pháp.
  - [X] **b) Được phép sử dụng nhưng phải khai báo theo quy định (bao gồm nhưng không giới hạn: hỗ trợ xử lý, phân tích dữ liệu, mô phỏng, lập trình; tạo lập hình ảnh, sơ đồ; biên soạn, biên dịch nội dung báo cáo, poster và các trường hợp sử dụng khác có ảnh hưởng đến nội dung, kết quả nghiên cứu hoặc sản phẩm trình bày của dự án).**  
    *--> Dự án đánh dấu X ở điểm b và ĐÃ KÊ KHAI CHI TIẾT TRỌN VẸN ở Phụ lục VI / Phiếu khai báo công nghệ số & AI theo quy định tại Điều 15 Thông tư 84/2026/TT-BGDĐT.*

---

*Hưng Yên, ngày 10 tháng 11 năm 2026*

| XÁC NHẬN CỦA NGƯỜI HƯỚNG DẪN NGHIÊN CỨU<br>*(Ký, ghi rõ họ tên)*<br><br><br><br><br>**Nguyễn Thị Thanh Hà &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Nguyễn Thị Hợp** | HỌC SINH / TRƯỞNG NHÓM NGHIÊN CỨU<br>*(Ký, ghi rõ họ tên)*<br><br><br><br><br>**Nguyễn Thế Duy** |
|:---:|:---:|

<br>

<div align="center">

**XÁC NHẬN CỦA CƠ SỞ GIÁO DỤC PHỔ THÔNG**<br>
*(Ký, ghi rõ họ tên và đóng dấu)*<br><br><br><br><br><br>
**HIỆU TRƯỞNG TRƯỜNG THPT ĐÔNG THỤY ANH**

</div>
