# PHIẾU KHAI BÁO MINH BẠCH VIỆC ỨNG DỤNG CÔNG NGHỆ SỐ VÀ TRÍ TUỆ NHÂN TẠO (AI)
*(Kèm theo Hồ sơ dự thi Cuộc thi KHKT dành cho học sinh trung học theo Điều 15 Thông tư số 84/2026/TT-BGDĐT)*

---

| SỞ GIÁO DỤC VÀ ĐÀO TẠO HƯNG YÊN<br>**TRƯỜNG THPT ĐÔNG THỤY ANH**<br>———————————— | CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br>**Độc lập – Tự do – Hạnh phúc**<br>———————————— |
|:---:|:---:|

### **THÔNG TIN DỰ ÁN**
- **Tên dự án:** NGHIÊN CỨU, XÂY DỰNG HỆ THỐNG LỚP HỌC SỐ TÍCH HỢP KHẢO THÍ TRỰC TUYẾN ĐA MÔN VÀ HỖ TRỢ TỰ HỌC CÁC MÔN KHOA HỌC TỰ NHIÊN (VẬT LÝ, HÓA HỌC, SINH HỌC) CHO HỌC SINH THPT
- **Lĩnh vực dự thi:** Phần mềm hệ thống (*System Software*) - Mã lĩnh vực: 07
- **Đơn vị dự thi:** Trường THPT Đông Thụy Anh – Sở Giáo dục và Đào tạo Hưng Yên
- **Học sinh thực hiện:**
  1. **Nguyễn Thế Duy** (Lớp 11A7 – Trưởng nhóm, Lập trình chính & Kiến trúc hệ thống)
  2. **Nguyễn Bùi Nguyệt Minh** (Lớp 10A1 – Thành viên, Phụ trách nội dung liên môn KHTN, Khảo sát & Truyền thông)
- **Người hướng dẫn khoa học:** Cô giáo **Nguyễn Thị Thanh Hà** (Giáo viên trường THPT Đông Thụy Anh)

---

## I. CAM KẾT VỀ MỤC ĐÍCH VÀ NGUYÊN TẮC SỬ DỤNG CÔNG NGHỆ SỐ & AI

1. **Tính độc lập và sáng tạo:** Toàn bộ thiết kế kiến trúc hệ thống 4 tầng, mã nguồn giao diện (245 component React `.jsx`), logic nghiệp vụ client (168 tệp `.js`), hệ thống 36 tệp kiểm thử tự động Vitest (460 ca test passed 100%), cơ sở dữ liệu tích hợp và kịch bản thực nghiệm sư phạm đối chứng đều do nhóm học sinh tự nghiên cứu, thiết kế và lập trình dưới sự hướng dẫn khoa học của giáo viên.
2. **Vai trò công cụ hỗ trợ:** Công nghệ số, thư viện mã nguồn mở và API Trí tuệ nhân tạo (AI) chỉ đóng vai trò hỗ trợ kỹ thuật: thực thi các mô hình thị giác máy tính tại máy khách, hỗ trợ biên soạn gợi ý tư duy sư phạm (*Scaffolding*), tra cứu cú pháp giải thuật và kiểm thử mã nguồn.
3. **Tuân thủ liêm chính học thuật:** Không sử dụng AI để viết hộ báo cáo khoa học. Toàn bộ văn bản báo cáo, số liệu thống kê thực nghiệm và kết luận sư phạm là sản phẩm thực tế của nhóm tác giả. Lõi tính toán khoa học KHTN được xây dựng theo mô hình lai (*Hybrid*) với lớp công cụ tất định kiểm soát số liệu, không để AI tự ý suy diễn hoặc bịa số liệu học thuật.

---

## II. NỘI DUNG KÊ KHAI CHI TIẾT CÁC CÔNG NGHỆ SỐ VÀ CÔNG CỤ AI ĐƯỢC SỬ DỤNG

| TT | Công nghệ / Nền tảng / Mô hình | Nguồn gốc / Đơn vị cung cấp | Phạm vi và Mục đích sử dụng |
|:---:|:---|:---|:---|
| **1** | **Ngôn ngữ & Nền tảng phát triển Web**<br>(React 18, Vite 5.4, Tailwind CSS, JavaScript ES6+) | Mã nguồn mở<br>(Cộng đồng React / Meta / Vite) | Xây dựng giao diện ứng dụng web tiến trình (PWA) đa nền tảng, phản hồi tức thì trên máy tính và điện thoại. Tối ưu nạp mô-đun lười (*lazy loading*), nạp trang dưới 1.2s. |
| **2** | **Hạ tầng Đám mây & Cơ sở dữ liệu**<br>(Firebase Auth, Firestore Realtime & Supabase PostgreSQL) | Google Cloud Platform & Supabase Inc. | • Firebase: Xác thực người dùng, đồng bộ dữ liệu lớp học số, phiên thi và giám sát thời gian thực.<br>• Supabase: Quản lý ngân hàng đề KHTN, sổ câu sai SRS, dữ liệu điểm chuẩn tuyển sinh ĐH. |
| **3** | **API Mô hình Ngôn ngữ lớn (LLMs)**<br>(Google Gemini Flash/Pro API, DeepSeek AI API, Groq Llama-3 API) | Google Cloud, DeepSeek AI, Groq Inc. | Tích hợp vào phân hệ Trợ lý AI KHTN và Studio tạo đề thi ma trận 4 mức độ GDPT 2018. Đóng vai trò gia sư gợi ý tư duy từng bước (*Scaffolding*), không giải hộ. |
| **4** | **Lõi Khoa học Tất định Toán - Lý - Hóa - Sinh**<br>(`scientificTools.js`, `chemBalance.js`) | Nhóm học sinh tự nghiên cứu & lập trình thuật toán | Khắc phục triệt để ảo giác số liệu của AI: khử Gauss-Jordan BigInt cân bằng phản ứng, stoichiometry, pH; giải dao động điều hòa, mạch RLC xoay chiều, khí lý tưởng; di truyền Menđen, Hardy-Weinberg, bảng mã di truyền 64 bộ ba. |
| **5** | **Thị giác Máy tính Chấm trắc nghiệm A4 (OMR Scanner)**<br>(Pure JavaScript - `src/lib/omr.js`) | Nhóm học sinh tự phát triển trên Canvas API | Quét phiếu trả lời trắc nghiệm giấy A4 mẫu Bộ GD&ĐT 2025 (đủ 3 phần thi) trực tiếp qua camera/ảnh chụp trên máy khách bằng biến đổi Homography và trích xuất Kênh Đỏ (*Red Channel*). |
| **6** | **Thị giác Máy tính Giám sát Thi & Tương tác Cử chỉ**<br>(Google MediaPipe Tasks Vision) | Google MediaPipe<br>(Mã nguồn mở) | Giám sát thi: Phát hiện quay mặt khỏi màn hình, mất mặt, xuất hiện người lạ qua webcam ngay trên trình duyệt (*Edge AI*). Gamification: Nhận diện cử chỉ tay (A, B, C, D) trả lời câu hỏi ôn tập. |
| **7** | **Đồ họa Không gian 3D Mô phỏng Thí nghiệm KHTN**<br>(Three.js, @react-three/fiber) | Thư viện đồ họa mã nguồn mở Three.js | Xây dựng phòng thí nghiệm ảo 3D trực quan: phản ứng hóa học (tỏa nhiệt, sủi bọt, kết tủa đổi màu, đo pH); mô phỏng tương tác mạch điện & quang hình Vật lý; mô hình xoay 3D phân tử ADN & phân bào Sinh học. |
| **8** | **Công cụ Kiểm thử Tự động & Quản lý Mã nguồn**<br>(Vitest, Tesseract.js OCR, GitHub) | Công cụ kiểm thử và mã nguồn mở | Vitest: Kiểm thử tự động toàn diện 460 ca kiểm thử lõi KHTN đạt passed 100% trong 13.42s. Tesseract.js: Nhận dạng ký tự quang học bài tập ngoại tuyến trên máy khách. |

---

## III. MINH CHỨNG SỬ DỤNG TRÍ TUỆ NHÂN TẠO (PROMPT LOG)
*(Theo đúng quy định mẫu tại Điều 15 Thông tư số 84/2026/TT-BGDĐT)*

> *Nếu Dự án có sử dụng trí tuệ nhân tạo (AI) hoặc công cụ chạy trên nền AI, vui lòng cung cấp Nhật ký câu lệnh (Prompt Log) chứa các câu lệnh và phản hồi từ AI hoặc công cụ chạy trên nền AI được sử dụng (đính kèm trang phụ nếu cần). Xóa các câu lệnh có chứa thông tin nhận dạng cá nhân (PII).*

---

### MINH CHỨNG 1: TRA CỨU GIẢI THUẬT ĐẠI SỐ TUYẾN TÍNH KHỬ GAUSS-JORDAN PHÂN SỐ BIGINT VÀ CÔNG THỨC KHOA HỌC TẤT ĐỊNH
- **Tên công cụ:** `DeepSeek-Coder (DeepSeek AI)` & `Gemini Pro (Google Cloud)`
- **Mục đích sử dụng:** Tra cứu logic giải thuật ma trận bậc thang rút gọn (RREF) trên phân số nguyên lớn để cân bằng phản ứng hóa học không sai số, giải mạch điện xoay chiều RLC và định luật di truyền quần thể Hardy-Weinberg.
- **Câu lệnh đầu vào (Prompt / Input - Đã xóa PII):**
  > *"Tôi đang xây dựng module lõi tính toán tất định JavaScript cho hệ thống học tập KHTN THPT (ELEC AI). Để chống hiện tượng AI bịa số khi cân bằng phương trình phản ứng phức tạp có ngoặc và ngậm nước (như $CuSO_4 \cdot 5H_2O$ hoặc $KMnO_4 + FeSO_4 + H_2SO_4$), hãy gợi ý thuật toán chuyển đổi chuỗi công thức thành ma trận nguyên tố và đưa ma trận về dạng bậc thang rút gọn (RREF) sử dụng phân số BigInt để đảm bảo hệ số tìm được luôn là số nguyên tối giản, tuyệt đối không bị sai số dấu phẩy động (floating-point error). Tương tự, hãy đưa ra công thức tính tổng trở $Z$, độ lệch pha $\varphi$ cho mạch RLC nối tiếp và tỷ lệ phân ly kiểu gen định luật Hardy-Weinberg $p^2AA + 2pqAa + q^2aa = 1$."*
- **Tóm tắt phản hồi từ AI (Output / Response):**
  > AI giải thích nguyên lý lập hệ phương trình bảo toàn nguyên tố $\sum a_i A_{ij} = 0$, mô tả thuật toán khử Gauss-Jordan với các phép biến đổi hàng cơ bản trên trường số hữu tỉ với 2 thuộc tính BigInt (`numerator` và `denominator`). Cung cấp khung hàm toán học tìm nghiệm nguyên dương nhỏ nhất qua Bội chung nhỏ nhất (LCM). Đồng thời cung cấp công thức tính tổng trở mạch RLC: $Z = \sqrt{R^2 + (\omega L - \frac{1}{\omega C})^2}$, $\tan\varphi = \frac{Z_L - Z_C}{R}$ và công thức tần số alen $p(A) + q(a) = 1$.
- **Đánh giá & Tiếp thu của nhóm tác giả (Human Verification & Implementation):**
  > Nhóm học sinh đã không sao chép nguyên mẫu mà tự tay lập trình lại hoàn toàn trong hai tệp mã nguồn [`src/lib/chemBalance.js`](file:///d:/Tải Xuống/app/src/lib/chemBalance.js) và [`src/lib/scientificTools.js`](file:///d:/Tải Xuống/app/src/lib/scientificTools.js); tự xây dựng bộ phân tích cú pháp chuỗi bằng cấu trúc ngăn xếp (Stack) để xử lý ngoặc lồng nhau; viết 42 ca kiểm thử tự động Vitest bao quát các bài toán Vật lý, Hóa học và Sinh học để xác minh tính chính xác 100%.

---

### MINH CHỨNG 2: THIẾT KẾ SYSTEM PROMPT CHO TRỢ LÝ SƯ PHẠM AI KHTN (SCAFFOLDING) VÀ CƠ CHẾ TOOL GROUNDING
- **Tên công cụ:** `Google Gemini API (Gemini 1.5 Flash / 2.0 Flash)`
- **Mục đích sử dụng:** Thiết kế System Prompt chuẩn sư phạm cho Trợ lý AI gia sư 3 môn KHTN theo phương pháp Scaffolding (gợi mở từng bước, không giải hộ) và áp dụng cơ chế *Deterministic Tool Grounding* để ép AI lấy kết quả tính toán số học từ máy tính.
- **Câu lệnh đầu vào (Prompt / Input - Đã xóa PII):**
  > *"Hãy giúp tôi tối ưu hóa System Prompt sư phạm cho trợ lý học tập ELEC AI dành cho học sinh THPT học 3 môn Vật lý, Hóa học, Sinh học. Yêu cầu sư phạm:*  
  > *1. Tuyệt đối không đưa ra lời giải hoàn chỉnh ngay từ câu đầu tiên mà phải đóng vai gia sư Socrates, chia nhỏ bài toán thành các gợi ý tư duy (Scaffolding), hỏi xem học sinh đã hiểu đến bước nào.*  
  > *2. Bắt buộc tuân thủ dữ liệu số học trong khối `[KẾT QUẢ ĐÃ TÍNH TOÁN BẰNG CÔNG CỤ NỘI BỘ]` (như khối lượng mol, hệ số cân bằng, bước sóng, điện áp hiệu dụng, tần số alen kiểu gen). AI tuyệt đối không được tự ý tính ra con số khác nhằm chống ảo giác số liệu.*  
  > *3. Sử dụng định dạng ký tự công thức hóa học Unicode ($\text{H}_2\text{SO}_4$) cho các chất thông thường và LaTeX (\$...\$) cho công thức Vật lý, Di truyền học."*
- **Tóm tắt phản hồi từ AI (Output / Response):**
  > AI đề xuất cấu trúc System Prompt phân tầng gồm 5 khối: `ROLE & PEDAGOGICAL IDENTITY`, `DETERMINISTIC GROUNDING RULES`, `SUBJECT CONSTRAINTS (VẬT LÝ / HÓA HỌC / SINH HỌC)`, `SCAFFOLDING STEP-BY-STEP STRATEGY`, và `OUTPUT FORMATTING`. Hướng dẫn thiết lập nhiệt độ mô hình ($temperature = 0.1$) đối với câu hỏi giải toán để giảm thiểu tính ngẫu nhiên, giữ giọng điệu thân thiện, khích lệ.
- **Đánh giá & Tiếp thu của nhóm tác giả (Human Verification & Implementation):**
  > Nhóm đã tích hợp cấu trúc này vào [`src/lib/aiPrompts.js`](file:///d:/Tải Xuống/app/src/lib/aiPrompts.js) và [`src/lib/aiRouter.js`](file:///d:/Tải Xuống/app/src/lib/aiRouter.js). Nhóm đã thử nghiệm với hơn 86 kịch bản hội thoại thực tế của học sinh trường THPT Đông Thụy Anh; bổ sung thêm cơ chế tự kiểm tra hậu kỳ (*Post-check Verification*): nếu AI nói ra con số khác với kết quả của `scientificTools.js`, giao diện sẽ tự động gắn nhãn cảnh báo đính chính cho học sinh.

---

### MINH CHỨNG 3: BÓC TÁCH ĐỀ THI VÀ XÂY DỰNG MA TRẬN ĐỀ 4 MỨC ĐỘ CHUẨN GDPT 2018 (AUTOEXAM STUDIO)
- **Tên công cụ:** `Gemini 1.5 Flash (Google Cloud)` & `Llama-3-70B (Groq Cloud)`
- **Mục đích sử dụng:** Xây dựng module AutoExam Studio bóc tách đề thi tự động từ file Word (.docx) và PDF, phân tích đề thi 3 môn KHTN theo ma trận 4 mức độ nhận thức (NB, TH, VD, VDC) bám sát 3 định dạng câu hỏi mới theo định hướng của Bộ GD&ĐT (Trắc nghiệm 4 lựa chọn, Trắc nghiệm Đúng/Sai, Trả lời ngắn).
- **Câu lệnh đầu vào (Prompt / Input - Đã xóa PII):**
  > *"Dưới đây là một đoạn trích đề thi thử tốt nghiệp THPT môn Khoa học Tự nhiên (Vật lý / Hóa học / Sinh học) có chứa cả 3 dạng thức trắc nghiệm mới theo Chương trình GDPT 2018 (Phần I: 4 lựa chọn; Phần II: Đúng/Sai 4 ý a,b,c,d; Phần III: Trả lời ngắn điền số). Hãy viết biểu thức Regular Expression kết hợp cấu trúc JSON Schema để bóc tách chính xác từng câu hỏi, các phương án lựa chọn, đáp án đúng, chủ đề (topic) và mức độ nhận thức (NB/TH/VD/VDC) từ văn bản phi cấu trúc."*
- **Tóm tắt phản hồi từ AI (Output / Response):**
  > AI cung cấp mẫu JSON Schema chuẩn hóa cho cấu trúc đề thi 3 phần và các mẫu Regex nhận diện tiêu đề câu hỏi (`Câu \d+:?`, `a\)|b\)|c\)|d\)`), đồng thời khuyến nghị kết hợp Regex làm bước lọc thô (fast pass) trước, sau đó mới dùng LLM phân tích ngữ nghĩa các câu phức tạp để tiết kiệm chi phí và tăng tốc độ xử lý.
- **Đánh giá & Tiếp thu của nhóm tác giả (Human Verification & Implementation):**
  > Nhóm đã lập trình module [`src/lib/examParser.js`](file:///d:/Tải Xuống/app/src/lib/examParser.js) và [`src/lib/matrixAiService.js`](file:///d:/Tải Xuống/app/src/lib/matrixAiService.js) theo nguyên lý xử lý hai lớp: Lớp 1 dùng Regex thuần để phân tách khối câu hỏi với tốc độ < 0.1s; Lớp 2 dùng AI Router để chuẩn hóa và phân loại chủ đề/mức độ nhận thức. Nhóm đã kiểm thử thành công trên 35 đề thi thử thực tế của các Sở GD&ĐT.

---

### MINH CHỨNG 4: GIẢI THUẬT THỊ GIÁC MÁY TÍNH NẮN ẢNH HOMOGRAPHY VÀ TRÍCH XUẤT KÊNH ĐỎ CHO MODULE OMR CHẤM PHIẾU A4
- **Tên công cụ:** `DeepSeek-Coder` & `Claude 3.5 Sonnet`
- **Mục đích sử dụng:** Tra cứu giải thuật hình học biến đổi phối cảnh 2D (*Perspective Transform / Homography*) và kỹ thuật tách kênh màu kỹ thuật số (*Red Channel Extraction*) để nắn phẳng ảnh chụp phiếu trắc nghiệm A4 từ camera điện thoại bị nghiêng góc.
- **Câu lệnh đầu vào (Prompt / Input - Đã xóa PII):**
  > *"Tôi đang viết thuật toán chấm phiếu trắc nghiệm OMR bằng JavaScript chạy trực tiếp trên Canvas máy khách (không dùng thư viện OpenCV nặng). Hãy giải thích cách tính ma trận biến đổi phối cảnh Homography $3 \times 3$ từ 4 điểm mốc định vị góc $P_i(x_i, y_i)$ sang tọa độ chuẩn $P'_i(u_i, v_i)$ bằng phương pháp giải hệ phương trình tuyến tính trực tiếp (DLT). Ngoài ra, nếu phiếu thi được in bằng mực màu hồng cánh sen, làm thế nào để trích xuất ma trận điểm ảnh nhằm triệt tiêu hoàn toàn màu mực in, chỉ giữ lại vết chì tô màu đen?"*
- **Tóm tắt phản hồi từ AI (Output / Response):**
  > AI giải thích công thức thiết lập hệ 8 phương trình đại số tuyến tính $Ah = 0$ để tìm 8 tham số của ma trận Homography $H$, cung cấp phương pháp giải định thức Gauss khử từng bước trên JavaScript. Về xử lý màu sắc, AI phân tích: mực in màu hồng có giá trị kênh Đỏ (Red) rất cao ($R \approx 240 - 255$) tương đương với nền giấy trắng ($R \approx 255$), trong khi than chì của bút chì 2B hấp thụ ánh sáng mạnh trên mọi kênh ($R \approx 30 - 80$). Do đó, chỉ cần lấy dữ liệu Kênh Đỏ (Red Channel) và đo tỷ lệ độ đen quang học tương đối là sẽ triệt tiêu hoàn toàn khung mực in màu hồng.
- **Đánh giá & Tiếp thu của nhóm tác giả (Human Verification & Implementation):**
  > Nhóm tác giả đã tự cài đặt thuật toán này trong [`src/lib/omr.js`](file:///d:/Tải Xuống/app/src/lib/omr.js) và [`src/lib/omrSheetGenerator.js`](file:///d:/Tải Xuống/app/src/lib/omrSheetGenerator.js) bằng JavaScript thuần không phụ thuộc bất kỳ thư viện ngoài nào, giúp giảm dung lượng tải trang xuống dưới 50KB. Thử nghiệm trên 50 phiếu thi thực tế đạt độ chính xác 98.2% với thời gian xử lý chỉ 1.4 giây/phiếu.

---

## IV. GIẢI TRÌNH CƠ CHẾ KIỂM SOÁT ĐỘ CHÍNH XÁC, AN TOÀN DỮ LIỆU VÀ ĐẠO ĐỨC HỌC THUẬT

1. **Cơ chế Kiểm soát Độ chính xác — Khắc phục Triệt để Hiện tượng Ảo giác (Zero-Hallucination):**
   - **Nguyên lý "Code tính trước, AI biện luận sau":** Mọi câu hỏi tính toán khoa học 3 môn Lý - Hóa - Sinh đều được giải bằng Lõi tính toán tất định `scientificTools.js` và `chemBalance.js` trước khi gửi cho AI. Kết quả số học được đưa vào câu lệnh dưới dạng khẳng định bắt buộc, AI chỉ có nhiệm vụ trình bày phương pháp và lý giải bản chất hiện tượng.
   - **Lớp Hậu kiểm Độc lập (*Post-check Verification*):** Sau khi AI phản hồi, hệ thống tiếp tục quét câu trả lời để đối chiếu lại với kết quả tính toán của máy tính; nếu phát hiện sai lệch, giao diện lập tức gắn cờ cảnh báo đính chính cho học sinh.
   - **Thẩm định chuyên môn sư phạm:** Toàn bộ ngân hàng câu hỏi theo 4 mức độ nhận thức và hệ thống phản ứng hóa học đều được kiểm duyệt, đối soát trực tiếp theo chương trình SGK GDPT 2018 bởi giáo viên hướng dẫn.

2. **Cơ chế Bảo mật Dữ liệu Riêng tư của Học sinh (Privacy & PII Protection):**
   - Hệ thống tuân thủ nghiêm ngặt nguyên tắc bảo mật thông tin cá nhân: Tuyệt đối không gửi thông tin định danh của học sinh (họ tên, ngày sinh, trường lớp, số điện thoại, kết quả bài thi) lên các API AI bên ngoài. Dữ liệu gửi lên AI chỉ bao gồm nội dung văn bản thuần túy của câu hỏi KHTN cần giải đáp.
   - Phân quyền Firestore chặt chẽ: Dữ liệu bài thi và giám sát của lớp nào chỉ GVCN và GVBM lớp đó được truy cập; học sinh chỉ xem được tiến độ học tập của chính mình.

3. **Cơ chế Giám sát Đạo đức & Không Xâm phạm Hình ảnh Cá nhân:**
   - Hệ thống giám sát thi trực tuyến (*Live Proctoring*) phân tích luồng thị giác hoàn toàn cục bộ trên thiết bị của học sinh qua thư viện MediaPipe. Hệ thống không ghi hình và không truyền phát luồng video liên tục về máy chủ, chỉ chụp lại các khung hình nhỏ (snapshot) làm bằng chứng kiểm toán tại thời điểm xảy ra hành vi vi phạm quy chế (chuyển tab, mất mặt, có người hỗ trợ), đảm bảo tính liêm chính khảo thí mà vẫn tôn trọng quyền riêng tư học đường.

---

*Hưng Yên, ngày 30 tháng 10 năm 2026*

| NGƯỜI HƯỚNG DẪN NGHIÊN CỨU<br>*(Ký, ghi rõ họ tên và xác nhận tính minh bạch)*<br><br><br><br><br>**Nguyễn Thị Thanh Hà** | HỌC SINH / TRƯỞNG NHÓM<br>*(Ký, ghi rõ họ tên và cam kết liêm chính)*<br><br><br><br><br>**Nguyễn Thế Duy** |
|:---:|:---:|
