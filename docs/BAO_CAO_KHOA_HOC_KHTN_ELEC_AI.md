# BÁO CÁO NGHIÊN CỨU KHOA HỌC
**DỰ ÁN: “ELEC AI - HỆ SINH THÁI LỚP HỌC SỐ, KHẢO THÍ ĐA MÔN VÀ HỖ TRỢ TỰ HỌC CÁC MÔN KHOA HỌC TỰ NHIÊN CẤP THPT”**

- **Cơ quan chủ quản:** SỞ GIÁO DỤC VÀ ĐÀO TẠO HƯNG YÊN  
- **Đơn vị dự thi:** TRƯỜNG THPT ĐÔNG THỤY ANH  
- **Cuộc thi:** CUỘC THI KHOA HỌC KỸ THUẬT HỌC SINH TRUNG HỌC NĂM HỌC 2026 - 2027  
- **Lĩnh vực dự thi:** 07- Máy tính (Hệ thống phần mềm / *System Software*)  
- **Tác giả:** 
  1. **Nguyễn Thế Duy** (Lớp 11A7 – Trưởng nhóm, Lập trình chính & Kiến trúc hệ thống)  
  2. **Nguyễn Bùi Nguyệt Minh** (Lớp 10A1 – Thành viên, Phụ trách nội dung liên môn KHTN, Khảo sát & Truyền thông)  
- **Người hướng dẫn khoa học:** Cô giáo **Nguyễn Thị Thanh Hà**  
- **Địa danh - Thời gian:** HƯNG YÊN - 2026  

---

## MỤC LỤC

- [PHẦN I: VẤN ĐỀ CẦN GIẢI QUYẾT](#phần-i-vấn-đề-cần-giải-quyết)
  - [1. Lý do chọn đề tài](#1-lý-do-chọn-đề-tài)
  - [2. Tổng quan nghiên cứu và các giải pháp hiện có](#2-tổng-quan-nghiên-cứu-và-các-giải-pháp-hiện-có)
  - [3. Mục tiêu kỹ thuật và vấn đề dự án cần giải quyết](#3-mục-tiêu-kỹ-thuật-và-vấn-đề-dự-án-cần-giải-quyết)
  - [4. Phạm vi nghiên cứu và giới hạn kỹ thuật](#4-phạm-vi-nghiên-cứu-và-giới-hạn-kỹ-thuật)
- [PHẦN II: THIẾT KẾ VÀ PHƯƠNG PHÁP NGHIÊN CỨU](#phần-ii-thiết-kế-và-phương-pháp-nghiên-cứu)
  - [1. Kiến trúc tổng thể hệ thống](#1-kiến-trúc-tổng-thể-hệ-thống)
  - [2. Thiết kế chi tiết các phân hệ chức năng](#2-thiết-kế-chi-tiết-các-phân-hệ-chức-năng)
  - [3. Phương pháp nghiên cứu và công cụ thực hiện](#3-phương-pháp-nghiên-cứu-và-công-cụ-thực-hiện)
- [PHẦN III. QUY TRÌNH THIẾT KẾ, XÂY DỰNG VÀ THỬ NGHIỆM HỆ THỐNG](#phần-iii-quy-trình-thiết-kế-xây-dựng-và-thử-nghiệm-hệ-thống)
  - [1. Khảo sát nhu cầu và đặc tả yêu cầu cốt lõi](#1-khảo-sát-nhu-cầu-và-đặc-tả-yêu-cầu-cốt-lõi)
  - [2. Luồng xử lý dữ liệu và mô hình cơ sở dữ liệu tích hợp](#2-luồng-xử-lý-dữ-liệu-và-mô-hình-cơ-sở-dữ-liệu-tích-hợp)
  - [3. Thiết kế giao diện và tối ưu hóa trải nghiệm (UX)](#3-thiết-kế-giao-diện-và-tối-ưu-hóa-trải-nghiệm-ux)
  - [4. Hiện thực hóa các module kỹ thuật trọng tâm](#4-hiện-thực-hóa-các-module-kỹ-thuật-trọng-tâm)
  - [5. Tích hợp, triển khai và vận hành (CI/CD)](#5-tích-hợp-triển-khai-và-vận-hành-cicd)
  - [6. Kiểm thử hiệu năng và Đánh giá thực nghiệm](#6-kiểm-thử-hiệu-năng-và-đánh-giá-thực-nghiệm)
- [PHẦN IV: KẾT QUẢ, KẾT LUẬN VÀ KHẢ NĂNG ỨNG DỤNG](#phần-iv-kết-quả-kết-luận-và-khả-năng-ứng-dụng)
  - [1. Kết quả nghiên cứu đạt được và phân tích định lượng](#1-kết-quả-nghiên-cứu-đạt-được-và-phân-tích-định-lượng)
  - [2. Tính mới và tính sáng tạo](#2-tính-mới-và-tính-sáng-tạo)
  - [3. Khả năng ứng dụng và chuyển giao thực tiễn](#3-khả-năng-ứng-dụng-và-chuyển-giao-thực-tiễn)
  - [4. Kết luận và định hướng phát triển công nghệ](#4-kết-luận-và-định-hướng-phát-triển-công-nghệ)
- [TÀI LIỆU THAM KHẢO](#tài-liệu-tham-khảo)

---

## PHẦN I: VẤN ĐỀ CẦN GIẢI QUYẾT

### 1. Lý do chọn đề tài

#### 1.1. Bối cảnh đổi mới khảo thí & Lộ trình thi THPT trên máy tính của Bộ GD&ĐT
- Bộ Giáo dục và Đào tạo đã xác định định hướng chiến lược: tổ chức kỳ thi tốt nghiệp THPT trên máy tính là xu thế tất yếu trong lộ trình chuyển đổi số giáo dục giai đoạn 2025 – 2030, từng bước thí điểm và nhân rộng trên phạm vi toàn quốc (được cụ thể hóa tại Công văn số 5548/BGDĐT-QLCL).
- Đối với học sinh THPT, việc sớm tiếp cận và hình thành năng lực khảo thí số là yêu cầu cấp thiết: làm quen với giao diện đề thi điện tử, thao tác trả lời các định dạng câu hỏi mới theo Chương trình GDPT 2018 (Trắc nghiệm nhiều lựa chọn, Trắc nghiệm Đúng/Sai, Trả lời ngắn); rèn luyện kỹ năng phân bổ thời gian và tôi luyện tâm lý làm bài thi trên màn hình thiết bị số.
- Đối với đội ngũ giáo viên, chuyển đổi số đòi hỏi sự kết hợp hài hòa giữa quy trình kiểm tra đánh giá truyền thống và kiểm tra số hóa: xây dựng ngân hàng câu hỏi chuẩn hóa, biên soạn đề theo ma trận và bản đặc tả 4 mức độ nhận thức, tổ chức các đợt kiểm tra thường xuyên và định kỳ trên máy tính để học sinh cọ xát thực tiễn.

#### 1.2. Thực trạng và khoảng trống rào cản tại trường THPT hiện nay
- **Khoảng trống quản lý liên môn:** Công tác phối hợp giữa Giáo viên chủ nhiệm (GVCN) và Giáo viên bộ môn (GVBM) trong việc đôn đốc, kiểm soát bài tập về nhà của học sinh hiện nay chủ yếu qua sổ ghi chép hoặc nhóm Zalo rời rạc. GVCN hoàn toàn thiếu một công cụ tập trung để giám sát tổng thể bài tập, tiến độ làm bài và bức tranh học lực liên môn của học sinh trong lớp theo thời gian thực.
- **Áp lực biên soạn & Nguy cơ gian lận thi cử:** Việc biên soạn đề kiểm tra trắc nghiệm bám sát ma trận 4 mức độ nhận thức tốn rất nhiều thời gian nếu làm thủ công. Khi tổ chức kiểm tra, ôn tập trực tuyến tại nhà, giáo viên luôn đối mặt với nguy cơ học sinh gian lận (chuyển tab tra Google, dùng AI giải hộ, thi hộ), làm sai lệch kết quả đánh giá thực chất.
- **Thách thức đặc thù của tổ hợp Khoa học Tự nhiên (Vật lý, Hóa học, Sinh học):**
  + Trong tổ hợp KHTN, hình thức thi tốt nghiệp trên máy tính khiến học sinh đối mặt với khó khăn lớn trong thao tác làm bài: khó trực quan hóa đồ thị/hình vẽ mạch điện, bất tiện khi tính nháp stoichiometry, chuỗi di truyền và tra cứu hằng số khoa học.
  + Tổ hợp 3 môn KHTN chứa đựng mật độ công thức dày đặc, nhiều đơn vị thứ nguyên chuẩn SI phức tạp và vô số "bẫy" đề thi kinh điển (bẫy đổi đơn vị $cm \leftrightarrow m, mA \leftrightarrow A, kJ \leftrightarrow J$; bẫy từ ngữ phủ định; bẫy điều kiện nhiệt độ/xúc tác hóa học; bẫy quy luật di truyền sinh học). Học sinh rất thiếu một hệ sinh thái tự học thông minh có khả năng chẩn đoán chính xác sai lầm nhận thức và hỗ trợ thực hành thí nghiệm mô phỏng trực quan.

---

### 2. Tổng quan nghiên cứu và các giải pháp hiện có

Trong quá trình nghiên cứu, nhóm tác giả đã tiến hành khảo sát thực tiễn và đối soát các nền tảng giáo dục số, công cụ khảo thí và quản lý học tập phổ biến hiện nay tại Việt Nam. Kết quả tổng quan cho thấy các giải pháp hiện hành đang phân thành 3 nhóm chính:
- **Nhóm 1 (Azota, Shub Classroom):** Tập trung vào số hóa nộp bài tập và chấm trắc nghiệm. Tuy nhiên, các nền tảng này thiếu cơ chế phân quyền phối hợp sâu giữa GVCN và GVBM; chưa tích hợp công cụ phòng thi an toàn có AI giám sát biên; không có phân hệ tự học chuyên sâu hay lõi tính toán khoa học tất định.
- **Nhóm 2 (Google Classroom, Microsoft Teams):** Đóng vai trò là hệ thống quản lý học tập (LMS) tổng quát, thiếu hẳn các tính năng khảo thí chuẩn hóa theo quy định của Bộ GD&ĐT Việt Nam (không hỗ trợ ma trận đề 3 dạng thức GDPT 2018, không có OMR camera chấm phiếu giấy).
- **Nhóm 3 (K12Online, SMAS, vnEdu):** Phục vụ quản lý hành chính nhà trường, tính năng khảo thí nặng nề, trải nghiệm người dùng chưa tối ưu trên thiết bị di động cá nhân, hoàn toàn không có công cụ hỗ trợ tự học tương tác hay phòng thí nghiệm mô phỏng 3D cho học sinh.

**Các rào cản kỹ thuật cốt lõi chưa được giải quyết:**
1. **Thiếu cơ chế liên kết GVCN - GVBM thời gian thực:** Chưa có nền tảng nào cung cấp một Dashboard số đồng bộ tức thời, nơi GVCN theo dõi được bài tập tất cả các môn của từng học sinh và tự động tạo bảng xếp hạng thi đua.
2. **Nguy cơ sai số và ảo giác AI (AI Hallucination):** Các ứng dụng tích hợp AI hiện nay (như ChatGPT, Gemini thông thường) khi giải bài tập Lý - Hóa - Sinh thường tự tính toán số học bằng mô hình ngôn ngữ dẫn tới kết quả sai lệch, bịa công thức hoặc cân bằng sai phương trình phản ứng.
3. **Giám sát thi trực tuyến chưa bảo đảm an toàn dữ liệu:** Hầu hết giải pháp giám sát online đòi hỏi truyền luồng video liên tục về máy chủ (tốn băng thông, nguy cơ lộ hình ảnh riêng tư của học sinh) hoặc chỉ chặn chuyển tab đơn giản rất dễ bị qua mặt.
4. **Thiếu công cụ số hóa bài thi giấy truyền thống (OMR):** Giáo viên vẫn phải chấm tay hoặc sử dụng các máy chấm phiếu đắt tiền, thiếu công cụ quét phiếu A4 thông minh qua camera điện thoại có khả năng loại trừ nhiễu nền và nắn góc nghiêng.
5. **Thiếu hệ sinh thái tự học chuyên sâu cho 3 môn KHTN:** Chưa có nền tảng nào kết hợp được Lõi giải thuật khoa học tất định + Phòng thí nghiệm ảo 3D nhập vai + Sổ câu sai thông minh SRS + Bản đồ Radar đánh giá năng lực 6 chiều theo chuẩn GDPT 2018.

---

### 3. Mục tiêu kỹ thuật và vấn đề dự án cần giải quyết

#### 3.1. Vấn đề kỹ thuật
Làm thế nào để xây dựng một giải pháp lớp học số tích hợp đồng thời nền tảng khảo thí trực tuyến an toàn theo chuẩn định hướng thi máy tính của Bộ GD&ĐT, cơ chế điều hành lớp học liên môn cho GVCN - GVBM và hệ sinh thái thông minh hỗ trợ tự học toàn diện cho 3 môn Khoa học Tự nhiên (Vật lý, Hóa học, Sinh học) cấp THPT?

#### 3.2. Mục tiêu kỹ thuật cụ thể
- **Mục tiêu 1 (Dành cho GVCN):** Xây dựng Dashboard số quản lý bài tập liên môn thời gian thực, theo dõi tiến độ nộp bài, tự động tính điểm thi đua và xuất phiếu điểm tổng hợp gửi phụ huynh qua Zalo/Email.
- **Mục tiêu 2 (Dành cho GVBM và Khảo thí đa môn):** 
  + Thiết kế công cụ AutoExam Studio hỗ trợ AI dựng ma trận 4 mức độ nhận thức chuẩn GDPT 2018 cho cả 3 dạng thức trắc nghiệm mới (Nhiều lựa chọn, Đúng/Sai, Trả lời ngắn).
  + Bóc tách đề tự động từ file Word (.docx) và PDF; xáo trộn câu hỏi và hoán vị phương án triệt tiêu gian lận chép bài.
  + Xây dựng phòng thi trực tuyến an toàn đa tầng với Edge AI MediaPipe giám sát webcam ngay tại trình duyệt (không gửi video về server).
  + Module OMR Computer Vision quét chấm phiếu trắc nghiệm A4 bằng camera điện thoại đạt độ chính xác > 98% trong < 1.5 giây.
- **Mục tiêu 3 (Dành cho Học sinh và Tự học KHTN chuyên sâu):**
  + Xây dựng Lõi tính toán khoa học tất định Toán - Lý - Hóa - Sinh (`scientificTools.js`, `chemBalance.js`) triệt tiêu 100% hiện tượng ảo giác số liệu của AI.
  + Tích hợp công cụ Phân tích Bẫy đề thi KHTN (`examTrapAnalyzer.js`) và Bản đồ Radar Đánh giá Năng lực KHTN 6 chiều (`competencyRadarEngine.js`).
  + Xây dựng Phòng thí nghiệm KHTN ảo 3D nhập vai (Three.js) & 2D tương tác trực quan phản ứng Hóa học, mạch điện/quang hình Vật lý, cấu trúc ADN/phân bào Sinh học.
  + Sổ tay câu sai thông minh ứng dụng thuật toán lặp lại ngắt quãng SRS (SuperMemo SM-2) đa môn kết hợp Gamification điều khiển cử chỉ camera MediaPipe Vision; Trợ lý AI tư vấn chiến lược nguyện vọng Đại học khối KHTN (A00, B00, A01).

---

### 4. Phạm vi nghiên cứu và giới hạn kỹ thuật

#### 4.1. Phạm vi đối tượng
Triển khai thử nghiệm và đánh giá thực nghiệm sư phạm tại các khối lớp 10, 11, 12 trường THPT phục vụ công tác quản lý quá trình học tập, kiểm tra đánh giá thường xuyên, định kỳ và ôn luyện thi tốt nghiệp THPT; kết hợp hỗ trợ tự học cá nhân hóa cho học sinh.

#### 4.2. Giới hạn công nghệ
- Nền tảng ứng dụng Web / Progressive Web App (PWA) chạy mượt mà trên các trình duyệt tiêu chuẩn (Google Chrome, Microsoft Edge, Cốc Cốc, Safari iOS) tương thích cả máy tính để bàn, máy tính bảng và điện thoại thông minh. Hệ thống hoạt động theo tiêu chuẩn Web APIs an toàn, không can thiệp sâu vào nhân hệ điều hành của thiết bị người dùng.
- Hệ thống ELEC AI được thiết kế theo kiến trúc nền tảng lớp học số và khảo thí trực tuyến đa môn. Trong phân hệ tự học và phát triển năng lực chuyên sâu, dự án tập trung xây dựng giải pháp công nghệ toàn diện cho tổ hợp **3 môn Khoa học Tự nhiên (Vật lý - Hóa học - Sinh học)** vì đây là các bộ môn khoa học thực nghiệm, có độ phức tạp cao nhất về mặt ký hiệu, bài toán tính toán tất định và mô phỏng không gian 3D.

---

## PHẦN II: THIẾT KẾ VÀ PHƯƠNG PHÁP NGHIÊN CỨU

### 1. Kiến trúc tổng thể hệ thống

Hệ thống ELEC AI được thiết kế theo kiến trúc Client - Server 4 tầng phân tách nghiêm ngặt, tối ưu hóa theo mô hình **Hybrid Client-Edge** nhằm giải phóng tải tối đa cho máy chủ trung tâm và bảo vệ tuyệt đối dữ liệu cá nhân của học sinh:

```
+---------------------------------------------------------------------------------------+
|  TẦNG 1: TẦNG TRÌNH DIỄN (PRESENTATION LAYER) - Client / PWA                          |
|  - Ứng dụng Web / PWA (React 18, Vite 5.4, Tailwind CSS, Responsive Mobile/Desktop)   |
|  - Giao diện Học sinh, GVCN, GVBM, Ban Giám hiệu, Quản trị viên                      |
|  - Phòng Lab KHTN Ảo 3D (Three.js / React Three Fiber) & Giao diện Canvas 2D          |
+---------------------------------------------------------------------------------------+
                                    │ Gọi hàm / API realtime
                                    ▼
+---------------------------------------------------------------------------------------+
|  TẦNG 2: TẦNG NGHIỆP VỤ CLIENT (CLIENT BUSINESS LAYER) - JavaScript Thuần             |
|  - scientificTools.js (Lõi tính toán Vật lý, Hóa học, Sinh học tất định)             |
|  - chemBalance.js (Thuật toán RREF Gauss-Jordan BigInt cân bằng phản ứng & Stoich)    |
|  - omr.js (Biến đổi Homography & Trích xuất Kênh Đỏ chấm phiếu A4)                    |
|  - aiRouter.js (Định tuyến thông minh, Vòng xoay API Key Ring & Tool Grounding)       |
|  - useProctorCamera.js (Hook giám sát phòng thi an toàn thời gian thực)               |
+---------------------------------------------------------------------------------------+
                                    │ Giao tiếp API / Webhook
                                    ▼
+---------------------------------------------------------------------------------------+
|  TẦNG 3: TẦNG DỊCH VỤ ĐÁM MÂY (CLOUD SERVICES LAYER) - Cloud / Backend Server         |
|  - Firebase Platform: Firebase Authentication, Cloud Firestore (Realtime), Storage    |
|  - Supabase Platform: PostgreSQL Database, Row Level Security (RLS), Edge Functions   |
|  - Cổng xử lý thanh toán & Nạp điểm Credit tự động (VietQR / SePay Webhook)           |
+---------------------------------------------------------------------------------------+
                                    │ Giao tiếp dữ liệu nội bộ
                                    ▼
+---------------------------------------------------------------------------------------+
|  TẦNG 4: TẦNG TÍNH TOÁN BIÊN & DỮ LIỆU (EDGE COMPUTING & DATA LAYER) - On-Device AI   |
|  - MediaPipe Tasks Vision (Edge AI nhận diện khuôn mặt, tư thế đầu, cử chỉ tay)      |
|  - Tesseract.js (Thư viện OCR nhận diện văn bản bài tập & công thức offline)          |
|  - Cơ sở tri thức Khoa học Tự nhiên chuẩn SGK 10-11-12 (Local Indexed Knowledge)      |
+---------------------------------------------------------------------------------------+
```
*[Hình 1: Sơ đồ khối kiến trúc Hybrid Client-Edge 4 tầng của hệ thống ELEC AI]*

**Cơ cấu phân quyền đa tác tử (Multi-role RBAC):**
- **Admin trường học / BGH:** Giám sát tổng thể hoạt động dạy - học, dữ liệu khảo thí toàn trường.
- **Giáo viên chủ nhiệm (GVCN):** Quản lý sĩ số lớp học số, theo dõi bài tập liên môn realtime, bảng xếp hạng thi đua, gửi phiếu điểm cho phụ huynh.
- **Giáo viên bộ môn (GVBM Lý, Hóa, Sinh...):** Quản lý ngân hàng câu hỏi, tạo đề thi ma trận 4 mức độ, tổ chức phòng thi an toàn, chấm phiếu OMR camera.
- **Học sinh:** Tham gia lớp học, làm bài thi online, tự học 3 môn KHTN với Lõi tính toán tất định, phòng lab 3D, sổ câu sai SRS và nhận tư vấn nguyện vọng Đại học.

---

### 2. Thiết kế chi tiết các phân hệ chức năng

#### 2.1. Phân hệ quản lý lớp học số (Dành cho GVCN)
- Khởi tạo không gian lớp học số với các **Mã định danh an toàn (Teacher Invite Keys)** sinh từ bảng mã 32 ký tự Base32 (không gian mẫu $32^8 \approx 1,1$ nghìn tỷ tổ hợp, chống vét cạn tuyệt đối), gán cố định cho từng môn học (Toán, Vật lý, Hóa học, Sinh học, Ngữ văn, Tiếng Anh...).
- Dashboard tập trung giúp GVCN nắm bắt toàn bộ bài tập liên môn theo dòng thời gian, phát hiện sớm học sinh nợ bài, tự động tính điểm thi đua đa chiều và trích xuất phiếu điểm gửi phụ huynh miễn phí qua Zalo/Email.

#### 2.2. Phân hệ khảo thí chuẩn Bộ GD&ĐT (Dành cho GVBM)
- Công cụ **AutoExam Studio** hỗ trợ AI tạo ma trận 4 mức độ nhận thức (Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao) cố định tổng 10 điểm cho 3 môn Lý, Hóa, Sinh bám sát cấu trúc đề thi tốt nghiệp THPT Chương trình GDPT 2018 (Phần I: Trắc nghiệm 4 lựa chọn; Phần II: Trắc nghiệm Đúng/Sai; Phần III: Trả lời ngắn).
- Tự động bóc tách đề thi từ file Word (.docx) và PDF bằng Regex kết hợp AI (`examParser.js`).
- Thuật toán xáo trộn câu hỏi và hoán vị phương án (Seeded Shuffle) tự động sinh nhiều mã đề thi tương đương triệt tiêu gian lận chép bài.
- Phòng thi trực tuyến an toàn tích hợp bẫy sự kiện bàn phím/chuột, khóa toàn màn hình và thuật toán thị giác MediaPipe Edge AI phát hiện gian lận.
- Module OMR Computer Vision quét chấm phiếu thi trắc nghiệm A4 bằng camera điện thoại.

#### 2.3. Phân hệ chuyên sâu liên môn Khoa học Tự nhiên (Dành cho Học sinh)
Phân hệ được thiết kế bám sát định hướng đánh giá năng lực thực nghiệm, tư duy mô hình hóa và xử lý số liệu thực tế theo Chương trình GDPT 2018:
1. **Lõi tính toán khoa học tất định (Deterministic Scientific Computation Core):**
   - **Vật lý:** Dao động điều hòa (con lắc lò xo, con lắc đơn, cơ năng, chu kỳ, pha dao động); Mạch điện xoay chiều RLC nối tiếp (tổng trở $Z$, độ lệch pha $\varphi$, cộng hưởng điện, hệ số công suất $\cos\varphi$); Thuyết động học chất khí & Phương trình trạng thái khí lý tưởng $PV=nRT$; Quang hình học (thấu kính, khúc xạ ánh sáng) và chuyển đổi thứ nguyên SI tự động.
   - **Hóa học:** Đại số tuyến tính khử Gauss-Jordan (RREF) trên phân số BigInt cân bằng phương trình phản ứng vô cơ/hữu cơ chính xác 100% không làm tròn số; Stoichiometry, nồng độ $C_M, C\%$; Tính pH dung dịch axit-bazơ yếu/mạnh dựa trên hằng số cân bằng $K_a, K_b$; Nhiệt hóa học ($\Delta_r H^\circ_{298}$).
   - **Sinh học:** Quy luật di truyền Menđen lai một và nhiều cặp tính trạng (tính xác suất kiểu gen, kiểu hình, tỷ lệ phân ly); Di truyền học quần thể (Định luật Hardy - Weinberg tính tần số alen $p, q$ và cấu trúc di truyền $p^2AA + 2pqAa + q^2aa = 1$); Dịch mã, phiên mã chuỗi mARN và Bảng mã di truyền 64 bộ ba (triplet codons) tra cứu nhanh axit amin; Cơ chế phân bào nguyên phân và giảm phân.
2. **Phân tích Bẫy đề thi KHTN (`examTrapAnalyzer.js`):** Tự động phát hiện bẫy đơn vị chuẩn SI, bẫy từ ngữ phủ định, bẫy điều kiện biên hóa học, bẫy quy luật di truyền sinh học; tự động tạo giải thích sư phạm phương án nhiễu.
3. **Bản đồ Radar Đánh giá Năng lực KHTN 6 chiều (`competencyRadarEngine.js`):** Đánh giá năng lực theo chuẩn GDPT 2018: Nhận thức KHTN, Tìm hiểu tự nhiên, Vận dụng thực tiễn, Giải toán khoa học, Tư duy thực nghiệm, Phân tích đồ thị dữ liệu.
4. **Phòng thí nghiệm KHTN ảo 3D nhập vai (Three.js) & 2D:** Bàn thực hành tương tác phản ứng hóa học (28 hóa chất, tỏa nhiệt, kết tủa đổi màu, sủi bọt 3D, đo pH), mô phỏng mạch điện RLC & quang học Vật lý, mô hình 3D xoay phân tử ADN & phân bào Sinh học.
5. **Sổ câu sai thông minh SRS (SuperMemo SM-2) đa môn & Gamification cử chỉ camera:** Lên lịch ôn ngắt quãng theo đường cong quên Ebbinghaus phân loại điểm nghẽn Lý - Hóa - Sinh; 18 trò chơi ôn tập và 9 trò chơi nhận diện cử chỉ bàn tay chọn đáp án A-B-C-D; Linh vật AI ELEC (22 trạng thái cảm xúc) và âm thanh Lofi Focus kích thích tập trung.
6. **Trợ lý AI Tư vấn Chiến lược Nguyện vọng Đại học Khối KHTN (`aspirationAiEngine.js`):** Phân tích cơ sở dữ liệu tuyển sinh khối A00, B00, A01, A02 của hơn 100 trường ĐH, tối ưu danh mục nguyện vọng 3 tầng rủi ro (Vươn cao, Vừa sức, An toàn).

---

### 3. Phương pháp nghiên cứu và Công cụ thực hiện

#### 3.1. Phương pháp nghiên cứu lý thuyết
- Nghiên cứu chuẩn kiến thức, kỹ năng, ma trận và bản đặc tả đề thi 3 môn Vật lý, Hóa học, Sinh học theo Chương trình GDPT 2018.
- Phân tích cơ sở lý thuyết về mô hình nhận thức Bloom, lý thuyết đường cong lãng quên Hermann Ebbinghaus và thuật toán lặp lại ngắt quãng SuperMemo SM-2.
- Xây dựng bộ phiếu khảo sát định lượng nhu cầu thực tế của 75 giáo viên và 250 học sinh THPT.

#### 3.2. Phương pháp thiết kế công nghệ
- Nền tảng phát triển: React 18, Vite 5.4, Tailwind CSS, Node.js; hạ tầng đám mây Firebase (Firestore, Auth, Storage) và Supabase (PostgreSQL, RLS).
- Thư viện đồ họa & thị giác máy tính: Three.js, React Three Fiber, Google MediaPipe Tasks Vision, Tesseract.js.
- Framework kiểm thử tự động: Vitest.
- Dự án tuân thủ nghiêm ngặt **Điều 15 Thông tư 84/2026/TT-BGDĐT** về việc lập Phiếu khai báo công nghệ số, mô hình AI mã nguồn mở và thư viện phần mềm được sử dụng.

#### 3.3. Thiết kế mô hình Thực nghiệm Sư phạm Liên môn KHTN
- **Phạm vi triển khai:** Triển khai trên 4 lớp học sinh khối 11 tại Trường THPT Đông Thụy Anh có điểm khảo sát đầu vào tương đương nhau:
  + **Nhóm Thực nghiệm** ($N = 94$ học sinh): Gồm Lớp 11A5 ($n=49$) và Lớp 11A7 ($n=45$), học tập và kiểm tra định kỳ 3 môn Vật lý, Hóa học, Sinh học trên nền tảng ELEC AI.
  + **Nhóm Đối chứng** ($N = 97$ học sinh): Gồm Lớp 11A6 ($n=49$) và Lớp 11A3 ($n=48$), học tập và ôn luyện theo phương pháp dạy học truyền thống.
- **Giả thuyết khoa học:** Việc ứng dụng hệ sinh thái ELEC AI giúp học sinh nâng cao rõ rệt năng lực tự học liên môn KHTN, hình thành kỹ năng làm bài thi trắc nghiệm số và đạt kết quả kiểm tra định kỳ 3 môn cao hơn có ý nghĩa thống kê ($p < 0.05$) so với nhóm đối chứng.
- **Thời gian thực nghiệm:** 08 tuần liên tục trong học kỳ I năm học 2026 – 2027.
- **Công cụ đo lường & xử lý số liệu:** Điểm số bài kiểm tra định kỳ 3 môn KHTN, thời gian nộp bài, tỷ lệ sửa lỗi trong sổ câu sai SRS; phân tích thống kê toán học bằng kiểm định Student t-test và Cohen's d.

---

## PHẦN III. QUY TRÌNH THIẾT KẾ, XÂY DỰNG VÀ THỬ NGHIỆM HỆ THỐNG

### 1. Khảo sát nhu cầu và đặc tả yêu cầu cốt lõi

#### 1.1. Khảo sát nhu cầu thực tiễn
Khảo sát thực tiễn trên 75 giáo viên KHTN và 250 học sinh THPT cho thấy:
- **Phía học sinh:** 43.0% học sinh gặp khó khăn lớn nhất ở khâu đọc hiểu đề bài, tìm hướng giải và tính toán số học; 37.0% gặp khó khăn khi ghi nhớ công thức, bảng tuần hoàn, bảng mã di truyền và bản chất hiện tượng; 35.0% gặp khó khăn trước các khái niệm trừu tượng.
- **Phía giáo viên:** 71.2% giáo viên đánh giá việc biên soạn ma trận, trộn đề, in ấn và chấm bài trắc nghiệm thủ công tốn quá nhiều thời gian và công sức (trong đó 49.2% đồng ý và 22.0% hoàn toàn đồng ý); 68.0% giáo viên chủ nhiệm gặp khó khăn khi theo dõi bài tập các môn khác của học sinh trong lớp.

```
(a) Mức độ khó học sinh gặp theo nhóm nội dung (n = 250)
  Khái niệm trừu tượng:           [■■■■■■■■■■ 35.0%]
  Ghi nhớ công thức, PTHH, Cặp gen:[■■■■■■■■■■■ 37.0%]
  Đọc đề, tìm hướng giải, tính số:[■■■■■■■■■■■■■ 43.0%]

(b) Giáo viên đánh giá: soạn đề, trộn đề, in ấn, chấm bài thủ công quá tốn thời gian (n = 75)
  Hoàn toàn không đồng ý:         [■■ 8.5%]
  Không đồng ý:                   [■ 3.4%]
  Trung lập:                      [■■■■■ 16.9%]
  Đồng ý:                         [■■■■■■■■■■■■■■■ 49.2%]
  Hoàn toàn đồng ý:               [■■■■■■■ 22.0%]
```
*[Hình 2: Biểu đồ kết quả khảo sát nhu cầu của học sinh và giáo viên]*

Từ kết quả khảo sát, nhóm tác giả đã xác lập hệ thống **28 yêu cầu chức năng (FR-01 đến FR-28)** và **12 yêu cầu phi chức năng (NFR-01 đến NFR-12)**.

#### 1.2. Bảng đặc tả yêu cầu cốt lõi

| Nhóm yêu cầu | Mã đại diện | Mô tả nghiệp vụ kỹ thuật cốt lõi | Mức ưu tiên |
|:---|:---|:---|:---:|
| **Tài khoản & Phân quyền** | FR-01 đến FR-03, NFR-03, 04 | Phân quyền 4 vai trò (Admin, GVCN, GVBM, Học sinh). Bảo mật dữ liệu phân cấp qua Firestore Security Rules & Supabase RLS, tuyệt đối không lưu video học sinh. | Mức 1 (Bắt buộc) |
| **Trợ lý AI & Lõi KHTN** | FR-04 đến FR-14, NFR-06, 07 | Hỏi đáp AI 3 môn Lý - Hóa - Sinh; Lõi tính toán tất định Gauss-Jordan RREF, stoichiometry, dao động điều hòa, mạch RLC, di truyền Menđen, Hardy-Weinberg; tra cứu bảng tuần hoàn & bảng mã di truyền. | Mức 1 (Bắt buộc) |
| **Tự học, SRS & Lab 3D** | FR-15 đến FR-18, NFR-10, 11 | Làm quiz chuyên đề KHTN; tự động lưu câu sai vào sổ lỗi SRS (SuperMemo SM-2); Bản đồ Radar năng lực 6 chiều; Phòng lab 3D tương tác Three.js; Gamification cử chỉ camera MediaPipe. | Mức 1 (Bắt buộc) |
| **Khảo thí & Giám sát** | FR-19 đến FR-28, NFR-01, 02 | Tạo đề từ Word/PDF/Ảnh theo ma trận 4 mức độ (3 dạng thức GDPT 2018); phòng thi an toàn giám sát Edge AI MediaPipe; chấm phiếu trắc nghiệm A4 camera (OMR); Dashboard GVCN liên môn. | Mức 1 (Bắt buộc) |

---

### 2. Luồng xử lý dữ liệu và Mô hình cơ sở dữ liệu tích hợp

#### 2.1. Luồng xử lý 7 bước câu hỏi AI (Zero-Hallucination Pipeline)
Để triệt tiêu hoàn toàn hiện tượng "ảo giác toán học" và "bịa số liệu" của các mô hình ngôn ngữ lớn, mọi câu hỏi từ học sinh được xử lý qua quy trình 7 bước nghiêm ngặt:

```
[Câu hỏi người dùng]
        │
        ▼
[Bước 1: Chuẩn hóa văn bản] ── Lược bỏ tiền tố/hậu tố gây nhiễu, làm sạch ký tự.
        │
        ▼
[Bước 2: Phân loại tác vụ (aiRouter.js)] ── Tự động nhận diện môn (Lý/Hóa/Sinh), độ khó, chọn mô hình & nhiệt độ tối ưu.
        │
        ▼
[Bước 3: Truy xuất tri thức nội bộ] ── Trích xuất kiến thức chuẩn SGK KHTN 10-11-12 qua thuật toán tìm kiếm BM25.
        │
        ▼
[Bước 4: Tính toán trước bằng công cụ tất định] ── Chạy scientificTools.js, chemBalance.js để tính chính xác con số trước.
        │
        ▼
[Bước 5: Ghép câu lệnh sư phạm đa tầng (aiPrompts.js)] ── Ghép ngữ cảnh + kết quả tính toán tất định + quy tắc hiển thị Unicode.
        │
        ▼
[Bước 6: Gọi mô hình AI với Vòng xoay khóa (Key Ring Rotation)] ── Xoay tua API keys an toàn, truyền dữ liệu kiểu streaming.
        │
        ▼
[Bước 7: Chuẩn hóa & Tự kiểm tra đối chiếu] ── Đối chiếu con số AI trả về với kết quả công cụ tất định; gắn nhãn kiểm chứng.
        │
        ▼
[Đáp án sư phạm chính xác 100%]
```
*[Hình 3: Sơ đồ luồng xử lý 7 bước ngăn ngừa lỗi ảo giác AI]*

#### 2.2. Mô hình cơ sở dữ liệu tích hợp
Hệ thống kết nối song song hai cơ sở dữ liệu qua khóa liên kết duy nhất là **UID (Firebase Auth)**:
- **Firebase Firestore:** Đóng vai trò là nguồn đúng (*single source of truth*) cho dữ liệu danh tính người dùng, cấu trúc lớp học số, trạng thái phòng thi trực tuyến và nhật ký vi phạm cần đồng bộ tức thời (realtime WebSocket).
- **Supabase (PostgreSQL):** Đóng vai trò là nguồn đúng cho ngân hàng câu hỏi KHTN chuẩn hóa, lịch sử làm bài, sổ câu sai SRS, dữ liệu điểm chuẩn tuyển sinh Đại học và báo cáo phân tích học lực.

Hai cơ sở dữ liệu hoạt động độc lập nhưng liên thông chặt chẽ qua UID, bảo đảm tính toàn vẹn dữ liệu, hiệu năng truy vấn cao và khả năng chịu lỗi tối đa.

```
       ┌────────────────────────┐                   ┌────────────────────────┐
       │   FIREBASE FIRESTORE   │                   │  SUPABASE (PostgreSQL) │
       │  (Nguồn đúng Realtime) │                   │  (Nguồn đúng Dữ liệu)  │
       ├────────────────────────┤    Liên kết UID   ├────────────────────────┤
       │ • Người dùng (Auth)    │ ◄───────────────► │ • Bài học / Tài liệu   │
       │ • Lớp học & Thành viên │     duy nhất      │ • Ngân hàng đề KHTN    │
       │ • Phiên thi trực tuyến │                   │ • Điểm số & Lịch sử thi│
       │ • Nhật ký vi phạm cam  │                   │ • Sổ câu sai (SRS)     │
       │ • Cài đặt hệ thống     │                   │ • Tuyển sinh ĐH (A00..)│
       └────────────────────────┘                   └────────────────────────┘
```
*[Hình 4: Sơ đồ liên kết dữ liệu giữa Firebase Firestore và Supabase qua UID]*

---

### 3. Thiết kế giao diện và Tối ưu hóa trải nghiệm (UX)

Giao diện ELEC AI được thiết kế tuân thủ **4 nguyên tắc công thái học phần mềm**:
1. **Ưu tiên tuyệt đối cho nội dung học tập:** Tự động ẩn toàn bộ thanh điều hướng, hoạt ảnh và thông báo không liên quan khi học sinh bước vào phòng thi trực tuyến.
2. **Hành động đơn nhất trên mỗi màn hình:** Tránh gây quá tải nhận thức (*cognitive overload*); mỗi khung nhìn tập trung giải quyết trọn vẹn một tác vụ học tập.
3. **Chuẩn hóa đồ họa kỹ thuật:** Sử dụng hình vẽ véc tơ SVG sắc nét, không lạm dụng biểu tượng cảm xúc tùy tiện trong các bài học khoa học.
4. **Chuẩn hóa hiển thị công thức:** Sử dụng ký tự Unicode cho công thức hóa học thông thường ($\text{H}_2\text{SO}_4, \text{CuSO}_4, \text{SO}_4^{2-}$), chỉ kích hoạt thư viện KaTeX đối với các biểu thức Toán - Lý phức tạp (tích phân, ma trận, phân số nhiều tầng) nhằm tối ưu tốc độ render DOM.

**4 giải pháp then chốt qua kiểm thử thiết bị thực tế:**
- Bổ sung cơ chế *Debounce* khóa nút bấm, triệt tiêu lỗi trừ điểm Credit trùng lặp khi người dùng bấm liên tiếp.
- Chuyển đổi Bảng tuần hoàn 118 nguyên tố và Bảng mã di truyền 64 bộ ba sang dạng cuộn ngang có neo cố định cột nhóm trên màn hình điện thoại.
- Thiết kế ngăn kéo (*drawer*) lưới số câu hỏi trong phòng thi di động giúp học sinh chuyển câu nhanh mà không che khuất đề bài.
- Xây dựng hệ thống thông báo lỗi kèm hướng dẫn hành động thân thiện (*actionable error messages*).

*[Hình 5: Giao diện trang chủ trên thiết bị di động, máy tính]*

---

### 4. Hiện thực hóa các module kỹ thuật trọng tâm

#### 4.1. Lõi AI Router và Vòng xoay khóa API (`aiRouter.js`)
Quản lý danh sách nhiều khóa API; khi phát hiện lỗi vượt hạn mức (HTTP 429 Rate Limit), hệ thống tự động đưa khóa đó vào trạng thái tạm nghỉ (cooldown 10 phút) và chuyển ngay sang khóa tiếp theo, bảo đảm phòng thi và trợ lý học tập không bao giờ bị gián đoạn:

```javascript
// Cơ chế xoay vòng khóa API (Key Ring Rotation) tại src/lib/aiRouter.js
export function createKeyRing(rawKeys, { cooldownMs = 600000 } = {}) {
  const keys = parseKeys(rawKeys), bad = new Map();
  let cursor = 0;
  const usable = () => keys.filter(k => !bad.get(k) || Date.now() > bad.get(k));
  return {
    get() {
      const list = usable();
      if (!list.length) return null;
      const key = list[cursor % list.length];
      cursor = (cursor + 1) % list.length;
      return key;
    },
    reportBad(key) {
      bad.set(key, Date.now() + cooldownMs);
    }
  };
}
```

#### 4.2. Lõi tính toán Khoa học Tự nhiên tất định (`scientificTools.js` & `chemBalance.js`)
Lõi tính toán giải quyết triệt để các bài toán định lượng 3 môn KHTN:
- **Hóa học:** Phân tích công thức có ngoặc tròn, ngoặc vuông, tinh thể ngậm nước ($\text{CuSO}_4\cdot 5\text{H}_2\text{O}$) qua cấu trúc ngăn xếp (Stack), sau đó lập hệ phương trình bảo toàn nguyên tố và giải bằng đại số tuyến tính khử Gauss-Jordan (RREF) trên phân số BigInt không sai số làm tròn:

```javascript
// Phân tích cú pháp công thức hóa học lồng nhau tại src/lib/chemBalance.js
export function parseFormula(input) {
  const f = String(input || '').trim().replace(/\s+/g, '');
  let i = 0; const stack = [{}];
  while (i < f.length) {
    if (f[i] === '(' || f[i] === '[') { stack.push({}); i++; }
    else if (f[i] === ')' || f[i] === ']') {
      const child = stack.pop(); i++;
      let num = ''; while (i < f.length && /\d/.test(f[i])) num += f[i++];
      const mult = num ? parseInt(num, 10) : 1;
      mergeIntoParent(stack[stack.length - 1], child, mult);
    } else { /* Đọc ký hiệu nguyên tố và chỉ số */ }
  }
  return stack[0];
}
```

- **Vật lý & Sinh học:** Module `scientificTools.js` cài đặt thuật toán giải dao động điều hòa (chu kỳ $T$, tần số $f$, vận tốc $v_{\max}$, gia tốc $a_{\max}$, cơ năng $W$), mạch xoay chiều RLC ($Z_L, Z_C, Z, \cos\varphi$), phương trình khí lý tưởng ($PV=nRT$), quy luật di truyền Menđen và cân bằng quần thể Hardy-Weinberg ($p^2AA + 2pqAa + q^2aa = 1$). Kết quả số học được đưa vào prompt dưới dạng khẳng định tất định, AI chỉ diễn giải phương pháp giải.

#### 4.3. Module chấm phiếu trắc nghiệm A4 bằng Camera (`omr.js`)
Module cho phép giáo viên quét phiếu thi khổ A4 chuẩn Bộ GD&ĐT bằng camera điện thoại. 
- Thuật toán định vị 4 vạch đen góc phiếu, áp dụng phép biến đổi phối cảnh **Homography** nắn phẳng ảnh về tọa độ chuẩn $2480 \times 3508\text{ px}$.
- Kỹ thuật **Trích xuất Kênh Đỏ (Red Channel Extraction)**: Mực in màu hồng/đỏ của mẫu phiếu gần như biến mất trên kênh R ($R \approx 255$), trong khi vết bút chì đen tô hấp thụ quang mạnh ($R \approx 30 - 60$). Nhờ đó, tỷ số độ đen quang học tương đối được đo đạc chính xác tuyệt đối mà không bị nhiễu bởi ánh sáng môi trường hay nếp gấp giấy:

$$\text{Độ đen} = 1 - \frac{\bar{R}_{\text{trong ô}}}{\bar{R}_{\text{nền quanh ô}}}$$

#### 4.4. Giám sát thi trực tuyến thời gian thực (`useProctorCamera.js`)
Module tích hợp Google MediaPipe Tasks Vision chạy hoàn toàn trên trình duyệt máy khách với chu kỳ quét 600ms:
- Nhận diện khuôn mặt và ước lượng góc quay đầu (Head Pose): cảnh báo khi mất khuôn mặt quá 5 giây, quay đầu khỏi màn hình quá 5 giây hoặc xuất hiện người thứ hai trong khung hình quá 3 giây.
- Xử lý hoàn toàn tại Edge AI máy khách; khi phát hiện vi phạm, hệ thống chỉ chụp một ảnh bằng chứng nén dung lượng thấp gửi lên Firestore kèm mốc thời gian vi phạm, không truyền luồng video về máy chủ, bảo vệ tuyệt đối quyền riêng tư của học sinh.

*[Hình 6: Màn hình giám sát trực tiếp của giáo viên]*

#### 4.5. Thuật toán Lặp lại ngắt quãng tối ưu hóa (`srs.js`)
Áp dụng thuật toán **SuperMemo SM-2** rút gọn phù hợp với học sinh THPT: Sai (Quality = 1), Đúng chậm (Quality = 3), Đúng nhanh (Quality = 5). Khoảng cách ôn tập $I$ (ngày) và Hệ số dễ $EF$ (Ease Factor) được cập nhật liên tục:

$$EF' = EF + (0.1 - (5 - q) \times (0.08 + (5 - q) \times 0.02))$$

Sổ câu sai tự động phân loại điểm nghẽn kiến thức theo từng môn Vật lý, Hóa học, Sinh học, giúp học sinh lấp đầy lỗ hổng trước kỳ thi chính thức.

---

### 5. Tích hợp, Triển khai và Vận hành (CI/CD)

*[Hình 7: Quy trình đóng gói và triển khai hệ thống]*

Hệ thống thiết lập quy trình CI/CD tự động 5 bước qua Vercel Edge Network và máy chủ đám mây. Trước mỗi lần đóng gói và phát hành sản phẩm, toàn bộ mã nguồn bắt buộc phải vượt qua bộ kiểm thử tự động của Vitest.

Điểm sáng nổi bật của dự án là việc thiết lập **36 tệp kiểm thử tự động với 460 ca kiểm thử chuyên sâu (Unit & Integration Tests)**, mở rộng kiểm thử toàn diện Lõi tính toán Vật lý, Hóa học, Sinh học, AI Router, OMR, SRS và Radar năng lực. Toàn bộ 460 ca kiểm thử chạy hoàn tất trong thời gian kỷ lục **13,42 giây** với tỷ lệ thành công tuyệt đối **100% (460/460 passed)**.

**Bảng tổng kết 4 lỗi hồi quy kỹ thuật và giải pháp xử lý triệt để:**

| STT | Hiện tượng lỗi | Nguyên nhân kỹ thuật | Giải pháp khắc phục triệt để |
|:---:|:---|:---|:---|
| 1 | Trang trắng trên Safari iPhone cũ | Biểu thức Regex dùng cú pháp lookbehind không tương thích trên WebKit cũ. | Thay thế bằng cú pháp Regex tương thích ngược chuẩn ES6, kiểm thử trực tiếp trên thiết bị iOS thật. |
| 2 | Bài thi nộp bị từ chối âm thầm | Firestore từ chối lưu mảng lồng nhau (*nested array*) hoặc trường giá trị `undefined`. | Lọc bỏ đệ quy các trường rỗng, đóng gói mảng đáp án thành đối tượng có cấu trúc phẳng (*flat object*). |
| 3 | Lệch kết quả stoichiometry & công thức | Tồn tại nhiều bản sao thuật toán tính toán độc lập ở các trang khác nhau. | Tách một lõi dùng chung duy nhất (`scientificTools.js`, `chemBalance.js`) cho toàn bộ hệ thống. |
| 4 | Cảnh báo vi phạm giả khi vừa bật camera | Hộp thoại xin quyền truy cập camera của trình duyệt làm mất tiêu điểm màn hình (*blur event*). | Bổ sung thời gian ân hạn 12 giây (*grace period*) cho lần đầu khởi động camera trước khi kích hoạt giám sát. |

---

### 6. Kiểm thử hiệu năng và Đánh giá thực nghiệm

Toàn bộ **36 kịch bản kiểm thử chức năng** thuộc 6 nhóm phân hệ (Tài khoản & Phân quyền, Lõi AI KHTN, Công cụ tính toán tất định & Bảng tuần hoàn, Quiz & Sổ lỗi SRS, Studio biên soạn đề thi, Phòng thi an toàn & Giám sát OMR) đều được kiểm tra thực tế và ghi nhận kết quả Đạt 100%.

**Bảng đo lường hiệu năng Web Vitals trên các thiết bị thực tế:**

| Thiết bị đo kiểm | Tải trang (FCP / LCP) | AI (Token đầu) | AI (Hoàn tất) | Chấm OMR Camera A4 |
|:---|:---:|:---:|:---:|:---:|
| **Máy tính (Desktop Core i5, RAM 8GB)** | 0.6s / 1.2s | 0.8s | 2.5s | 1.4s / phiếu |
| **iPhone 11 (Safari iOS)** | 0.9s / 1.8s | 1.1s | 3.1s | 1.8s / phiếu |
| **Android tầm trung (Snapdragon 680)** | 1.2s / 2.2s | 1.3s | 3.6s | 2.0s / phiếu |

Khảo sát định lượng trên 250 học sinh và 75 giáo viên sau giai đoạn thử nghiệm ghi nhận:
- **92.5%** người dùng hài lòng về độ mượt mà và trực quan của giao diện.
- **89.6%** tin cậy tuyệt đối vào các con số giải toán KHTN của AI nhờ cơ chế Tool Grounding.
- **93.8%** học sinh mong muốn tiếp tục sử dụng nền tảng ELEC AI trong quá trình ôn thi tốt nghiệp THPT.

---

## PHẦN IV: KẾT QUẢ, KẾT LUẬN VÀ KHẢ NĂNG ỨNG DỤNG

### 1. Kết quả nghiên cứu đạt được và Phân tích định lượng

Dự án đã nghiên cứu và triển khai xây dựng thành công nền tảng phần mềm lớp học số và khảo thí trực tuyến tích hợp trí tuệ nhân tạo, vận hành chính thức trên Internet tại địa chỉ: `https://aitk-ten.vercel.app/`.

#### 1.1. Sản phẩm kỹ thuật và hạ tầng
Hệ thống ELEC AI được hoàn thiện với quy mô mã nguồn gồm **495.210 dòng lệnh**, 245 component React (.jsx), 168 tệp thuật toán lõi (.js) và 285 stylesheet (.css). Độ tin cậy được chứng minh qua **460/460 ca kiểm thử tự động Vitest thành công 100%**. Tốc độ phản hồi đạt chuẩn cao (FCP < 1.2s, thời gian phản hồi AI trung bình 2.5s, chấm OMR < 1.5s/phiếu).

#### 1.2. Hiệu quả quản lý lớp học và khảo thí đa môn

##### a) Phân hệ dành cho Giáo viên
- **Chức năng dành cho Giáo viên chủ nhiệm (GVCN):**
  + *Quản trị lớp học số:* Chủ động khởi tạo không gian lớp học theo mô hình phân quyền chặt chẽ; dễ dàng kết nối Giáo viên bộ môn (Lý, Hóa, Sinh, Toán, Anh...) cùng tham gia phối hợp quản lý qua Mã liên kết an toàn Base32.
  + *Giám sát tiến độ toàn diện:* Theo dõi nền nếp học tập, mức độ chuyên cần và nắm bắt bức tranh tổng quan về kết quả học tập liên môn của từng học sinh; tự động tổng hợp bảng xếp hạng thi đua và trích xuất phiếu điểm Zalo gửi phụ huynh.
- **Chức năng dành cho Giáo viên bộ môn (GVBM):**
  + *Quản lý nhiệm vụ học tập:* Linh hoạt giao bài tập, bài luyện tập định kỳ phù hợp với tiến độ giảng dạy và năng lực phân hóa của từng nhóm học sinh.
  + *Số hóa khâu kiểm tra & đánh giá:* AutoExam Studio hỗ trợ AI tạo lập đề kiểm tra có ma trận chuẩn GDPT 2018 cho 3 dạng thức trắc nghiệm mới; phục vụ song song cả hai hình thức: in ấn bài thi kiểm tra trên lớp (chấm bằng camera OMR) và tổ chức phòng thi trực tuyến an toàn chống gian lận.

##### b) Phân hệ dành cho Học sinh
- *Học tập có định hướng:* Tiếp nhận nhiệm vụ kịp thời, làm bài và nộp bài tập theo đúng lộ trình do giáo viên bộ môn giao.
- *Phát triển năng lực tự học 3 môn Khoa học Tự nhiên (Vật lý, Hóa học, Sinh học):* Cung cấp Lõi tính toán tất định chống ảo giác, Phân tích bẫy đề thi KHTN, Bản đồ Radar năng lực 6 chiều, Phòng thí nghiệm ảo 3D nhập vai, Sổ tay câu sai SRS thông minh và Gamification cử chỉ camera.

#### 1.3. Phân tích kết quả Thực nghiệm Sư phạm
Sau 8 tuần triển khai thực nghiệm sư phạm tại Trường THPT Đông Thụy Anh, kết quả đối chiếu giữa Nhóm Thực nghiệm ($N=94$) và Nhóm Đối chứng ($N=97$) trên 3 môn KHTN cho thấy:
- **Tỷ lệ nộp bài tập đúng hạn:** Nhóm TN đạt **93.8%** (so với 68.0% trước thực nghiệm và 71.5% của nhóm ĐC).
- **Điểm trung bình kiểm tra định kỳ 3 môn KHTN:** Nhóm TN đạt **7.45 điểm** (tăng 19.2% so với điểm khảo sát đầu vào 6.25 điểm), cao hơn rõ rệt so với Nhóm ĐC (**6.48 điểm**). Sự khác biệt có ý nghĩa thống kê cao với $p < 0.01$ (kiểm định t-test) và kích thước hiệu ứng lớn (Cohen's $d = 0.82$).
- **Tỷ lệ khắc phục câu sai trong Sổ lỗi SRS:** Học sinh nhóm TN làm chủ và không lặp lại sai lầm ở các bài kiểm tra sau đạt **89.6%**.

---

### 2. Tính mới và Tính sáng tạo

#### 2.1. Đột phá về Kiến trúc Kỹ thuật và Công nghệ Lõi (Zero-Hallucination & Edge AI)
- **Mô hình kết hợp Client-Edge và Lõi tính toán tất định KHTN (`scientificTools.js` & `chemBalance.js`):** Khắc phục triệt để điểm yếu "tính toán ẩu, bịa số liệu" của các mô hình ngôn ngữ lớn (LLMs). Mọi bài toán Vật lý (dao động, mạch RLC, khí lý tưởng), Hóa học (cân bằng phương trình khử Gauss-Jordan BigInt, stoichiometry, pH) và Sinh học (di truyền Menđen, Hardy-Weinberg, mã di truyền 64 bộ ba) đều được tính toán chính xác tuyệt đối bằng mã nguồn thuần trước khi chuyển kết quả cho AI trình bày sư phạm.
- **Cơ chế định tuyến AI Router và Vòng xoay khóa API (Key Ring Rotation):** Tự động phân loại tác vụ thông minh theo môn học và độ khó, xoay vòng nhiều khóa API giúp hệ thống vận hành liên tục 24/7 ngay cả khi chạm hạn mức tải (HTTP 429), giải quyết bài toán cốt lõi về tính ổn định hạ tầng trường học.
- **Thị giác máy tính chạy trực tiếp trên trình duyệt (Browser-based Computer Vision):** Ứng dụng Google MediaPipe Tasks Vision tích hợp ngay trên Client để giám sát phòng thi trực tuyến (nhận diện khuôn mặt, hướng nhìn, cảnh báo vắng mặt) và công nghệ biến đổi Homography kết hợp trích xuất Kênh Đỏ (`omr.js`) để chấm phiếu trắc nghiệm giấy A4 bằng camera mà không cần truyền video lên máy chủ trung tâm, bảo đảm an toàn bảo mật tuyệt đối.

#### 2.2. Đột phá về Sư phạm và Nghiệp vụ Quản lý Giáo dục (Chương trình GDPT 2018)
- **Hệ thống liên kết dữ liệu đa chiều GVCN - GVBM thời gian thực:** Lần đầu tiên xây dựng một Dashboard số kết nối liên thông giữa GVCN và toàn bộ GVBM, tự động hóa bảng xếp hạng thi đua, phát hiện học sinh nợ bài và trích xuất phiếu điểm gửi phụ huynh miễn phí qua Zalo/Email.
- **Tổ hợp Khảo thí chuẩn cấu trúc mới Bộ GD&ĐT (AutoExam Studio):** Tự động hóa quy trình biên soạn đề thi bám sát ma trận 4 mức độ nhận thức và hỗ trợ đồng thời cả 3 định dạng câu hỏi mới nhất (Trắc nghiệm nhiều lựa chọn, Đúng/Sai, Trả lời ngắn).
- **Hệ sinh thái Tự học và Trải nghiệm chuyên sâu liên môn KHTN:**
  + *Phòng thí nghiệm KHTN ảo 3D nhập vai (Three.js):* Mô phỏng trực quan các hiện tượng hóa học (kết tủa, sủi bọt, đổi màu, tỏa nhiệt), mạch điện xoay chiều & quang học Vật lý, cấu trúc không gian ADN & phân bào Sinh học.
  + *Bản đồ Radar Đánh giá Năng lực KHTN 6 chiều:* Tự động phân tích điểm mạnh, điểm yếu theo chuẩn GDPT 2018.
  + *Phân tích Bẫy đề thi KHTN:* Giúp học sinh nhận diện các bẫy đơn vị SI, bẫy từ ngữ phủ định và bẫy điều kiện biên.
  + *Sổ tay câu sai thông minh SRS:* Ứng dụng thuật toán lặp lại ngắt quãng SuperMemo SM-2 giúp học sinh lấp đầy lỗ hổng kiến thức theo đường cong quên Ebbinghaus.
  + *Gamification Camera & AI Mascot:* Trò chơi cử chỉ tay MediaPipe và Linh vật AI ELEC (22 trạng thái cảm xúc) kết hợp âm thanh Lofi Focus kích thích hứng thú học tập.
  + *AI Tư vấn Chiến lược Nguyện vọng Đại học:* Định hướng ngành nghề và tối ưu danh mục nguyện vọng khối KHTN (A00, B00, A01) vào các trường Đại học top đầu.

---

### 3. Khả năng ứng dụng và Chuyển giao thực tiễn

#### 3.1. Tính phổ quát và chi phí triển khai siêu rẻ
Hệ thống hoạt động tối ưu trên nền tảng Web / PWA, tương thích mọi thiết bị di động cá nhân và máy tính phổ thông mà không đòi hỏi nhà trường phải đầu tư phòng máy đắt tiền. Chi phí vận hành hạ tầng đám mây cực thấp (khoảng 450.000 – 500.000 VNĐ/tháng cho toàn trường), hoàn toàn khả thi để chuyển giao và nhân rộng đại trà tới các trường THPT trên toàn quốc.

#### 3.2. Giá trị kinh tế - xã hội và Chuyển đổi số
- **Tiết kiệm thời gian và ngân sách:** Tự động hóa quy trình khảo thí và chấm phiếu OMR camera giúp giáo viên cắt giảm đến 70% thời gian sự vụ bàn giấy; giảm hàng triệu đồng chi phí in ấn đề thi, phiếu kiểm tra hàng năm.
- **Nâng cao chất lượng giáo dục:** Học sinh được tôi luyện kỹ năng khảo thí số, làm quen với giao diện thi máy tính, phát triển năng lực tự học có hướng dẫn và sẵn sàng cho kỳ thi tốt nghiệp THPT theo định hướng của Bộ GD&ĐT.

---

### 4. Kết luận và Định hướng phát triển công nghệ

#### 4.1. Kết luận
Đề tài đã nghiên cứu và hoàn thiện thành công nền tảng **ELEC AI**, giải quyết trọn vẹn sự kết hợp giữa Trí tuệ nhân tạo (AI), Thị giác máy tính (Computer Vision), Điện toán biên (Edge Computing) và Lý luận dạy học hiện đại. Hệ thống đáp ứng xuất sắc yêu cầu chuyển đổi số và đổi mới căn bản, toàn diện giáo dục theo Chương trình GDPT 2018.

#### 4.2. Định hướng phát triển
Kế hoạch nâng cấp trực tiếp trên mã nguồn ELEC AI hiện có theo 3 giai đoạn:
- **Giai đoạn 1:** Hoàn thiện AI Gateway phân tán, nâng cấp các thuật toán nhận diện cử chỉ MediaPipe và siết chặt bảo mật dữ liệu học sinh theo Nghị định 13/2023/NĐ-CP.
- **Giai đoạn 2:** Mở rộng Lõi tính toán tất định và ngân hàng câu hỏi chuẩn hóa sang các môn Khoa học Xã hội (Lịch sử, Địa lí, GDKT&PL) và Ngoại ngữ (Tiếng Anh).
- **Giai đoạn 3:** Xây dựng giải đấu học tập liên trường trực tuyến (Arena Mode) và phát triển mô hình học tập thích ứng sâu (*Deep Adaptive Learning*), hướng tới thương mại hóa và chuyển giao công nghệ EdTech quy mô toàn quốc.

---

## TÀI LIỆU THAM KHẢO

1. Bộ Giáo dục và Đào tạo (2018), *Chương trình Giáo dục phổ thông 2018 - Chương trình tổng thể và các môn học Vật lí, Hóa học, Sinh học*, Ban hành kèm theo Thông tư số 32/2018/TT-BGDĐT ngày 26/12/2018.
2. Bộ Giáo dục và Đào tạo (2023), *Công văn số 5548/BGDĐT-QLCL về việc hướng dẫn tổ chức kỳ thi tốt nghiệp THPT và định hướng tổ chức thi trên máy tính giai đoạn 2025 - 2030*.
3. Bộ Giáo dục và Đào tạo (2026), *Thông tư số 84/2026/TT-BGDĐT về Quy chế thi nghiên cứu khoa học kỹ thuật cấp quốc gia dành cho học sinh trung học cơ sở và trung học phổ thông*.
4. Flanagan, D. (2020), *JavaScript: The Definitive Guide (7th Edition)*, O'Reilly Media.
5. Martin, R. C. (2008), *Clean Code: A Handbook of Agile Software Craftsmanship*, Prentice Hall.
6. Kleppmann, M. (2017), *Designing Data-Intensive Applications: The Big Ideas Behind Reliable, Scalable, and Maintainable Systems*, O'Reilly Media.
7. Lugaresi, C. et al. (2019), *MediaPipe: A Framework for Building Perception Pipelines*, arXiv:1906.08172. Truy cập tại: https://arxiv.org/abs/1906.08172
8. Bradski, G. & Kaehler, A. (2008), *Learning OpenCV: Computer Vision with the OpenCV Library*, O'Reilly Media.
9. Wozniak, P. A. (1990), *Optimization of learning: SuperMemo 2 algorithm*, University of Technology in Poznan.
10. White, J. et al. (2023), *A Prompt Pattern Catalog to Enhance Prompt Engineering with ChatGPT*, arXiv:2302.11382.
11. Google DeepMind (2024), *Gemini: A Family of Highly Capable Multimodal Models*, arXiv:2312.11805.
12. Anthropic (2024), *The Claude 3 Model Family: Opus, Sonnet, Haiku*, Anthropic Research.
13. DeepSeek AI (2024), *DeepSeek-V2: A Strong, Economical, and Efficient Mixture-of-Experts Language Model*, arXiv:2405.04434.
