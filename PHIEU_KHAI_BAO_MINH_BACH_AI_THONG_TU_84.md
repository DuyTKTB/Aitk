# SỞ GIÁO DỤC VÀ ĐÀO TẠO HƯNG YÊN — TRƯỜNG THPT ĐÔNG THỤY ANH
**CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM — Độc lập – Tự do – Hạnh phúc**

---

<div align="center">

## PHIẾU KHAI BÁO MINH BẠCH VIỆC ỨNG DỤNG CÔNG NGHỆ SỐ VÀ TRÍ TUỆ NHÂN TẠO (AI)
*(Kèm theo Hồ sơ dự thi Cuộc thi KHKT dành cho học sinh trung học theo Điều 15 Thông tư số 84/2026/TT-BGDĐT)*

</div>

| Mục | Nội dung kê khai chi tiết |
| :--- | :--- |
| **Tên dự án:** | **NGHIÊN CỨU, XÂY DỰNG HỆ THỐNG LỚP HỌC SỐ TÍCH HỢP KHẢO THÍ TRỰC TUYẾN ĐA MÔN VÀ HỖ TRỢ TỰ HỌC CÁC MÔN KHOA HỌC TỰ NHIÊN (VẬT LÝ, HÓA HỌC, SINH HỌC) CHO HỌC SINH THPT** |
| **Lĩnh vực dự thi:** | Phần mềm hệ thống (System Software) — Mã lĩnh vực: **07** |
| **Đơn vị dự thi:** | Trường THPT Đông Thụy Anh – Sở Giáo dục và Đào tạo Hưng Yên |
| **Học sinh thực hiện:** | 1. **Nguyễn Thế Duy** (Lớp 11A7 – Trưởng nhóm, Lập trình chính & Kiến trúc hệ thống)<br>2. **Nguyễn Bùi Nguyệt Minh** (Lớp 10A1 – Thành viên, Phụ trách nội dung liên môn KHTN, Khảo sát & Truyền thông) |
| **Người hướng dẫn KH:** | **Cô giáo Nguyễn Thị Thanh Hà** (Giáo viên trường THPT Đông Thụy Anh) |

---

### I. CAM KẾT VỀ MỤC ĐÍCH VÀ NGUYÊN TẮC SỬ DỤNG CÔNG NGHỆ SỐ & AI

1. **Tính độc lập và sáng tạo:** Toàn bộ thiết kế kiến trúc hệ thống 4 tầng, mã nguồn giao diện (245 component React `.jsx`), logic nghiệp vụ client (168 tệp `.js`), hệ thống 47 tệp kiểm thử tự động Vitest (486 ca test passed 100%), cơ sở dữ liệu tích hợp và kịch bản thực nghiệm sư phạm đối chứng đều do nhóm học sinh tự nghiên cứu, thiết kế và lập trình dưới sự hướng dẫn khoa học của giáo viên.
2. **Vai trò công cụ hỗ trợ:** Công nghệ số, thư viện mã nguồn mở và API Trí tuệ nhân tạo (AI) chỉ đóng vai trò hỗ trợ kỹ thuật: tra cứu thuật toán, phân tích ngữ nghĩa câu hỏi, gợi ý kịch bản sư phạm gợi mở (Scaffolding) và hỗ trợ viết kiểm thử mã nguồn.
3. **Tuân thủ liêm chính học thuật:** Không sử dụng AI để viết hộ báo cáo khoa học. Toàn bộ văn bản báo cáo, số liệu thống kê thực nghiệm và kết luận sư phạm là sản phẩm thực tế của nhóm tác giả. Lõi tính toán khoa học KHTN được xây dựng theo mô hình lai (Hybrid) với lớp công cụ tất định kiểm soát số liệu, không để AI tự ý suy diễn hoặc bịa số liệu học thuật.

---

### II. NỘI DUNG KÊ KHAI CHI TIẾT CÁC CÔNG NGHỆ SỐ VÀ CÔNG CỤ AI ĐƯỢC SỬ DỤNG

| TT | Công nghệ / Nền tảng / Mô hình | Nguồn gốc / Đơn vị cung cấp | Phạm vi và Mục đích sử dụng cụ thể |
| :---: | :--- | :--- | :--- |
| **1** | **Ngôn ngữ & Nền tảng phát triển Web**<br>*(React 18, Vite 5.4, Tailwind CSS, JavaScript ES6+)* | Mã nguồn mở (Cộng đồng React / Meta / Vite) | Xây dựng giao diện ứng dụng web tiến trình (PWA) đa nền tảng, phản hồi tức thì trên máy tính và điện thoại. Tối ưu nạp mô-đun lười (lazy loading), nạp trang dưới 1.2s. |
| **2** | **Hạ tầng Đám mây & Cơ sở dữ liệu**<br>*(Firebase Auth, Firestore Realtime & Supabase PostgreSQL)* | Google Cloud Platform & Supabase Inc. | Firebase: Xác thực người dùng, đồng bộ dữ liệu lớp học số, phiên thi và giám sát thời gian thực. Supabase: Quản lý ngân hàng đề KHTN, sổ câu sai SRS, dữ liệu điểm chuẩn tuyển sinh ĐH. |
| **3** | **API Mô hình Ngôn ngữ lớn (LLMs)**<br>*(Google Gemini Flash/Pro API, DeepSeek AI API, Groq Llama-3 API)* | Google Cloud, DeepSeek AI, Groq Inc. | Tích hợp vào phân hệ Trợ lý AI KHTN và Studio tạo đề thi ma trận 4 mức độ GDPT 2018. Đóng vai trò gia sư gợi ý tư duy từng bước (Scaffolding), không giải hộ. |
| **4** | **Lõi Khoa học Tất định Toán - Lý - Hóa - Sinh**<br>*(scientificTools.js, chemBalance.js)* | Nhóm học sinh tự nghiên cứu & lập trình thuật toán | Khắc phục triệt để ảo giác số liệu của AI: khử Gauss-Jordan BigInt cân bằng phản ứng, stoichiometry, pH; giải dao động điều hòa, mạch RLC xoay chiều, khí lý tưởng; di truyền Menđen, Hardy-Weinberg. |
| **5** | **Thị giác Máy tính Chấm trắc nghiệm A4 (OMR Scanner)**<br>*(Pure JavaScript - src/lib/omr.js)* | Nhóm học sinh tự phát triển trên Canvas API | Quét phiếu trả lời trắc nghiệm giấy A4 mẫu Bộ GD&ĐT 2025 (đủ 3 phần thi) trực tiếp qua camera/ảnh chụp trên máy khách bằng biến đổi Homography và trích xuất Kênh Đỏ (Red Channel). |
| **6** | **Thị giác Máy tính Giám sát Thi & Tương tác Cử chỉ**<br>*(Google MediaPipe Tasks Vision)* | Google MediaPipe (Mã nguồn mở) | Giám sát thi: Phát hiện quay mặt khỏi màn hình, mất mặt, xuất hiện người lạ qua webcam ngay trên trình duyệt (Edge AI). Gamification: Nhận diện cử chỉ tay (A, B, C, D) trả lời câu hỏi ôn tập. |
| **7** | **Đồ họa Không gian 3D Mô phỏng Thí nghiệm KHTN**<br>*(Three.js, @react-three/fiber)* | Thư viện đồ họa mã nguồn mở Three.js | Xây dựng phòng thí nghiệm ảo 3D trực quan: phản ứng hóa học (tỏa nhiệt, sủi bọt, kết tủa đổi màu, đo pH); mô phỏng tương tác mạch điện & quang hình Vật lý; mô hình xoay 3D phân tử ADN & phân bào Sinh học. |
| **8** | **Công cụ Kiểm thử Tự động & Quản lý Mã nguồn**<br>*(Vitest, Tesseract.js OCR, GitHub)* | Công cụ kiểm thử và mã nguồn mở | Vitest: Kiểm thử tự động toàn diện 486 ca kiểm thử lõi KHTN đạt passed 100% trong 11.56s. Tesseract.js: Nhận dạng ký tự quang học bài tập ngoại tuyến trên máy khách. |

---

### III. MINH CHỨNG SỬ DỤNG TRÍ TUỆ NHÂN TẠO (PROMPT LOG — QUÁ TRÌNH THỰC TẾ CÓ LỖI & SỬA LỖI)

> **Căn cứ pháp lý:** Theo quy định tại Điều 15 Thông tư 84/2026/TT-BGDĐT: Nhóm tác giả cung cấp Nhật ký câu lệnh (Prompt Log) thể hiện chân thực quá trình tương tác lặp (Iterative Prompting), các lỗi kỹ thuật/ảo giác số liệu thực tế phát sinh từ AI, câu lệnh chất vấn bắt lỗi của học sinh và giải pháp tự lập trình kiểm chứng độc lập của nhóm tác giả (đã xóa PII).

---

#### MINH CHỨNG 1: Xây dựng Lõi Cân bằng Phản ứng Hóa học Tất định & Khắc phục Lỗi Số học của AI
- **Công cụ AI sử dụng:** DeepSeek-Coder (DeepSeek AI) & Google Gemini 1.5 Pro.
- **Mục tiêu kỹ thuật:** Xây dựng hàm JavaScript độc lập `balanceEquation(rawEq)` có khả năng cân bằng mọi phản ứng vô cơ/hữu cơ THPT, xử lý được chất ngậm nước ($CuSO_4 \cdot 5H_2O$), gốc nhóm ngoặc lồng nhau ($Fe_2(SO_4)_3$) mà không dùng thư viện ngoài.

1. **Lượt hỏi ban đầu (Initial Prompt - Đã xóa PII):**
   > *"Viết cho tôi một hàm JavaScript cân bằng phương trình hóa học bằng cách giải hệ phương trình tuyến tính đại số ma trận."*

2. **Phản hồi ban đầu của AI (Initial AI Output):**
   > AI đưa ra đoạn code dùng thư viện `mathjs` và kiểu số thực `Number` (Float 64-bit) thông thường để khử Gauss ma trận, sau đó làm tròn bằng `Math.round()`.

3. **Lỗi phát sinh trong thực tế kiểm thử của nhóm (Errors Encountered):**
   - **[!] Lỗi 1 (Sai số dấu phẩy động - Floating Point Bug):** Khi kiểm thử phương trình oxi hóa - khử phức tạp: $KMnO_4 + FeSO_4 + H_2SO_4 \rightarrow Fe_2(SO_4)_3 + K_2SO_4 + MnSO_4 + H_2O$, máy tính ra nghiệm phân số $2.9999999999999995$ và hàm làm tròn sai khiến hệ số cân bằng bị lệch, phương trình không bảo toàn nguyên tố.
   - **[!] Lỗi 2 (Crash phân tích cú pháp - Regex Syntax Error):** Khi gặp chất có ngoặc hoặc ngậm nước như $CuSO_4 \cdot 5H_2O$ hoặc $Al_2(SO_4)_3$, biểu thức Regex đơn giản của AI văng lỗi:  
     `Uncaught TypeError: Cannot read properties of undefined (reading 'elements')`.

4. **Lượt hỏi chất vấn & Bắt lỗi AI của học sinh (Follow-up Debug Prompt):**
   > *"Code của bạn bị 2 lỗi nghiêm trọng khi chạy thực tế:  
   > 1. Dùng `Number` bị sai số dấu phẩy động làm hỏng bảo toàn nguyên tố phương trình oxi hóa khử $KMnO_4 + FeSO_4$. Tôi cần thuật toán khử Gauss-Jordan ma trận bậc thang rút gọn (RREF) giải hoàn toàn trên phân số hữu tỉ gồm 2 số nguyên lớn `BigInt` (tử số / mẫu số), kèm hàm tìm Bội chung nhỏ nhất (LCM) để quy đồng ra hệ số nguyên dương tối giản tuyệt đối.  
   > 2. Hàm tách nguyên tử của bạn dùng Regex không parse được ngoặc lồng nhau và dấu chấm ngậm nước. Hãy gợi ý cho tôi cấu trúc dữ liệu Ngăn xếp (Stack Parser) để duyệt từng ký tự chuỗi hóa học."*

5. **Phản hồi sửa lỗi & Đề xuất giải thuật của AI (Corrected AI Output):**
   > AI thừa nhận hạn chế của kiểu số `Number` thông thường, cung cấp giải thuật lớp `FractionBigInt` (phép cộng/trừ/nhân/chia phân số rút gọn bằng thuật toán Euclid GCD) và mô hình Stack để nhân hệ số ngoặc từ trong ra ngoài.

6. **Đánh giá & Tự lập trình của nhóm học sinh (Human Implementation & Vitest Verification):**
   > Nhóm tự tay viết lại toàn bộ mã nguồn vào tệp `src/lib/chemBalance.js` (không sử dụng `mathjs` giúp web nhẹ hơn 3.2MB). Tự lập trình bộ phân tích cú pháp 3 giai đoạn: Chuẩn hóa ký tự $\rightarrow$ Ngăn xếp phân tích ngoặc $\rightarrow$ Lập ma trận nguyên tố $\rightarrow$ Khử Gauss-Jordan RREF BigInt. Viết 14 ca kiểm thử tự động trong `tests/chemBalance.test.js` kiểm tra từ phản ứng đơn giản đến các phản ứng hữu cơ Este, Peptit, chất ngậm nước. Kết quả: **14/14 tests pass 100% trong 31ms**.

---

#### MINH CHỨNG 2: Thiết kế System Prompt Sư phạm Gợi mở (Scaffolding) & Chống Ảo giác (Anti-Hallucination)
- **Công cụ AI sử dụng:** Google Gemini API (Gemini 2.0 Flash / Gemini 1.5 Flash).
- **Mục tiêu kỹ thuật:** Thiết lập System Prompt sư phạm cho Trợ lý ELEC AI: đóng vai gia sư định hướng tư duy theo phương pháp Socrates, chia bài toán thành các chặng nhỏ (Scaffolding), tuyệt đối không giải hộ và không bịa số liệu.

1. **Lượt hỏi ban đầu (Initial Prompt - Đã xóa PII):**
   > *"Bạn là gia sư AI dạy Vật lý, Hóa học, Sinh học THPT. Hãy đóng vai một người thầy nhiệt tình, giúp học sinh giải các bài tập KHTN một cách dễ hiểu nhất."*

2. **Phản hồi ban đầu của AI (Initial AI Output):**
   > AI đóng vai giáo viên khen ngợi, nhưng luôn giải trọn vẹn cả bài từ bước 1 đến đáp số cuối cùng ngay trong câu trả lời đầu tiên.

3. **Lỗi phát sinh trong thực tế kiểm thử của nhóm (Errors Encountered):**
   - **[!] Lỗi 1 (Giải hộ toàn bộ - Triệt tiêu tư duy học sinh):** Khi học sinh paste câu hỏi: *"Hòa tan hoàn toàn 5.4g Al vào dung dịch HCl dư, tính thể tích $H_2$ thu được (đktc)?"*, AI lập tức tuôn ra toàn bộ lời giải và đáp số $6.72$ lít từ dòng đầu tiên. Học sinh chỉ việc chép bài mà không cần suy nghĩ gì, vi phạm tiêu chí sư phạm của dự án.
   - **[!] Lỗi 2 (Ảo giác số liệu - Hallucination):** Ở bài tập pH dung dịch hỗn hợp axit yếu, AI tự ý làm tròn số bừa bãi: $-\log(0.025)$ AI tính thành $1.4$ (thực tế là $1.602$), dẫn đến chọn sai đáp án trắc nghiệm chuẩn của Bộ GD&ĐT.

4. **Lượt hỏi chất vấn & Bắt lỗi AI của học sinh (Follow-up Debug Prompt):**
   > *"System Prompt như vậy thất bại hoàn toàn về mặt sư phạm:  
   > 1. Học sinh chỉ việc copy-paste đáp án để đối phó bài tập về nhà. Tôi cần một kịch bản Scaffolding 3 bước nghiêm ngặt: Bước 1 chỉ hỏi học sinh dữ kiện đã biết và công thức cần dùng; Bước 2 nhận xét câu trả lời của học sinh; Bước 3 mới xác nhận đáp án. Tuyệt đối không đưa ra lời giải hoàn chỉnh ở phản hồi đầu tiên.  
   > 2. Về số liệu: Hệ thống web của tôi đã có sẵn công cụ tính toán tất định trong `scientificTools.js`. Hãy thiết kế khối tiếp nhận `[DỮ LIỆU ĐÃ TÍNH TOÁN BẰNG TOOL CHÍNH XÁC: {...}]` trong prompt. Ép AI bắt buộc phải dùng con số này, nếu AI tự tính ra con số khác thì hệ thống coi như vi phạm nguyên tắc bảo toàn."*

5. **Phản hồi sửa lỗi & Đề xuất giải thuật của AI (Corrected AI Output):**
   > AI đề xuất kiến trúc Prompt phân tầng 5 khối: `IDENTITY & SOCRATIC PEDAGOGY` (Quy định bắt buộc không đưa đáp án ở turn 1), `TOOL GROUNDING CONTRACT` (Quy ước số liệu bất khả xâm phạm), `SUBJECT ADAPTATION` (Phân chia phong cách Lý / Hóa / Sinh), `FALLBACK SAFETY` (Cách xử lý khi học sinh nói 'Em không biết làm').

6. **Đánh giá & Tự lập trình của nhóm học sinh (Human Implementation & Vitest Verification):**
   > Nhóm tích hợp cấu trúc này vào `src/lib/aiPrompts.js` và điều phối qua `src/lib/aiRouter.js`. Bổ sung cơ chế **Hậu kiểm cục bộ (Client-side Post-Check Verification)**: Trước khi hiển thị tin nhắn của AI lên màn hình, hàm JavaScript chạy đối soát; nếu AI nhắc đến giá trị khối lượng mol hoặc pH sai lệch $> 0.5\%$ so với kết quả của `scientificTools.js`, giao diện sẽ tự động ghim nhãn vàng cảnh báo: *"⚠️ Lưu ý: Con số này có thể chưa chính xác, hãy bấm kiểm tra lại bằng công cụ tính toán nội bộ"*. Thử nghiệm với 86 phiên trò chuyện thực nghiệm tại trường THPT Đông Thụy Anh, tỷ lệ gợi mở tư duy đạt **94.2%**.

---

#### MINH CHỨNG 3: Bóc tách Đề thi Word/PDF sang Ma trận 4 Mức độ GDPT 2018 (AutoExam Studio)
- **Công cụ AI sử dụng:** Groq Llama-3-70B & Google Gemini 1.5 Flash.
- **Mục tiêu kỹ thuật:** Chuyển đổi tệp đề thi thực tế (dạng thô `.docx` hoặc `.pdf` tải từ các Sở GD&ĐT) thành cấu trúc JSON chuẩn hóa gồm 3 phần thi theo format mới nhất của Bộ GD&ĐT 2025: Phần I (4 lựa chọn), Phần II (Đúng/Sai 4 ý a,b,c,d), Phần III (Điền số ngắn), tự động gắn thẻ ma trận nhận thức (Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao).

1. **Lượt hỏi ban đầu (Initial Prompt - Đã xóa PII):**
   > *"Dưới đây là nội dung toàn bộ tệp đề thi thử KHTN tốt nghiệp THPT 2025 dài 8 trang. Hãy đọc và xuất ra cho tôi mảng JSON chứa tất cả câu hỏi, đáp án đúng và mức độ nhận thức của từng câu."*

2. **Phản hồi ban đầu của AI (Initial AI Output):**
   > AI bắt đầu đọc văn bản và tạo JSON, nhưng dừng lại đột ngột ở câu 28 do hết giới hạn output tokens.

3. **Lỗi phát sinh trong thực tế kiểm thử của nhóm (Errors Encountered):**
   - **[!] Lỗi 1 (Tràn ngữ cảnh & Nuốt câu hỏi - Context Cutoff):** Do đề thi dài và chứa nhiều công thức, AI xử lý đến câu 28 thì cạn output token, chuỗi JSON bị đứt gãy giữa chừng gây lỗi cú pháp nghiêm trọng: `SyntaxError: Unexpected end of JSON input at JSON.parse()`.
   - **[!] Lỗi 2 (Nhận diện sai dạng thức đề thi mới):** Đề thi 2025 có Phần II (Đúng/Sai gồm 4 ý a, b, c, d), nhưng AI lại gom gộp nhầm thành một câu trắc nghiệm 4 phương án $A, B, C, D$ truyền thống, làm sai lệch hoàn toàn biểu điểm khảo thí (1 ý đúng được 0.1đ, 4 ý đúng được 1.0đ).
   - **[!] Lỗi 3 (Lỗi công thức hóa học & số mũ):** Các ký hiệu $Fe^{3+}$, $SO_4^{2-}$, $\lambda = 0.5\mu m$ bị biến thành ký tự rác `Fe3+`, `SO42-`, `l = 0.5um`.

4. **Lượt hỏi chất vấn & Bắt lỗi AI của học sinh (Follow-up Debug Prompt):**
   > *"Cách làm gửi toàn bộ tệp văn bản cho AI là phi thực tế vì tốn chi phí token và thường xuyên làm gãy JSON. Tôi quyết định chia bài toán thành mô hình xử lý 2 lớp (Two-Pass Architecture):  
   > - Lớp 1 (Tiền xử lý Regex thuần trên Client): Tôi sẽ dùng JavaScript bóc tách thô tệp Word thành từng khối câu hỏi riêng biệt dựa trên biểu thức chính quy nhận diện tiêu đề 'Câu 1:', 'Phần I', 'Phần II'.  
   > - Lớp 2 (AI phân tích ngữ nghĩa từng câu): Hãy viết cho tôi JSON Schema chuẩn nghiêm ngặt và hàm phân loại câu hỏi với đầu ra JSON có định dạng: `{ id, part: 1|2|3, format: 'MCQ'|'TF'|'SHORT_ANSWER', stem, subQuestions?: [{id: 'a', content, correct: true}], level: 'NB'|'TH'|'VD'|'VDC' }`. Hướng dẫn cách xử lý ký tự công thức Toán/Lý/Hóa bằng cú pháp LaTeX chuẩn để thư viện KaTeX hiển thị được."*

5. **Phản hồi sửa lỗi & Đề xuất giải thuật của AI (Corrected AI Output):**
   > AI cung cấp bộ mẫu Regex tối ưu cho 3 dạng thức đề thi mới, đồng thời cung cấp hàm ép kiểu JSON an toàn (JSON repair parser) loại bỏ các ký tự Markdown thừa ` ```json ` để tránh lỗi `JSON.parse()`.

6. **Đánh giá & Tự lập trình của nhóm học sinh (Human Implementation & Vitest Verification):**
   > Nhóm tự tay xây dựng hai module: `src/lib/examParser.js` (xử lý Regex và KaTeX thuần tốc độ $< 0.1$ giây) và `src/lib/matrixAiService.js` (gửi xử lý song song các câu hỏi qua hàng đợi API). Thử nghiệm bóc tách thành công **35 đề thi thử tốt nghiệp THPT** thực tế của các Sở GD&ĐT Hà Nội, Nam Định, Nghệ An, Hưng Yên với độ chính xác phân loại mức độ đạt **91.4%**.

---

#### MINH CHỨNG 4: Giải thuật Nắn ảnh Homography & Tách Kênh Đỏ chấm Phiếu OMR (src/lib/omr.js)
- **Công cụ AI sử dụng:** DeepSeek-Coder & Claude 3.5 Sonnet.
- **Mục tiêu kỹ thuật:** Viết thuật toán thị giác máy tính chấm phiếu trắc nghiệm A4 (mẫu Bộ GD&ĐT 2025) chạy 100% trên Canvas trình duyệt của máy khách (Client-side Edge AI), không gửi ảnh về server để bảo vệ quyền riêng tư và tốc độ phản hồi tức thì.

1. **Lượt hỏi ban đầu (Initial Prompt - Đã xóa PII):**
   > *"Viết code JavaScript sử dụng OpenCV.js để tìm 4 góc của tờ giấy thi trắc nghiệm và nắn thẳng ảnh (warp perspective) để đọc ô tô trắc nghiệm."*

2. **Phản hồi ban đầu của AI (Initial AI Output):**
   > AI cung cấp đoạn mã JavaScript phụ thuộc thư viện `opencv.js` và hàm `cv.warpPerspective()`.

3. **Lỗi phát sinh trong thực tế kiểm thử của nhóm (Errors Encountered):**
   - **[!] Lỗi 1 (Dung lượng thư viện quá nặng):** Thư viện `opencv.js` có dung lượng lên tới **8.4MB WebAssembly**, khi học sinh hoặc giáo viên tải trang trên điện thoại bằng mạng 4G/3G trường học mất hơn 15 giây mới nạp xong, gây đơ trình duyệt di động.
   - **[!] Lỗi 2 (Nắn ảnh bị lộn ngược và đen sì):** Nhóm yêu cầu AI bỏ `opencv.js` và tự viết hàm giải ma trận Homography 3x3 bằng thuật toán DLT. Tuy nhiên, code AI đưa ra sắp xếp sai thứ tự 4 góc định vị (Top-Left, Top-Right, Bottom-Right, Bottom-Left), dẫn đến ma trận nghịch đảo $H^{-1}$ tính sai khiến ảnh nắn ra bị lộn ngược 180 độ hoặc bị biến dạng thành vệt đen.
   - **[!] Lỗi 3 (Nhầm lẫn mực in màu hồng với vết tô bút chì):** Phiếu thi của Bộ GD&ĐT in khung và chữ số bằng mực màu hồng cánh sen. Thuật toán nhị phân hóa (Thresholding) thang độ xám (Grayscale) của AI nhận diện toàn bộ khung viền hồng là... đáp án tô chì 2B!

4. **Lượt hỏi chất vấn & Bắt lỗi AI của học sinh (Follow-up Debug Prompt):**
   > *"Code tự viết của bạn gặp 2 lỗi nghiêm trọng:  
   > 1. Ma trận Homography tính theo thuật toán khử Gauss 8 phương trình bị lỗi hoán vị hàng (Row Pivoting), làm ảnh nắn ra bị xoay ngược đầu đuôi. Thứ tự 4 điểm mốc góc của tôi trên Canvas là: TL(0,0), TR(width, 0), BR(width, height), BL(0, height). Hãy viết lại thuật toán tính ma trận Homography chuẩn xác bằng giải thuật đại số tuyến tính trực tiếp.  
   > 2. Về xử lý màu sắc: Tại sao lại chuyển ảnh về Grayscale khiến viền in màu hồng bị biến thành màu xám và đè lên vết chì? Tôi nhận thấy mực in màu hồng có thành phần Kênh Đỏ (Red Channel) rất lớn ($R \approx 230 - 255$) tương đương nền giấy trắng ($R \approx 255$), trong khi than chì bút chì 2B thì hấp thụ ánh sáng mạnh trên cả 3 kênh ($R, G, B \le 80$). Hãy cho tôi giải thuật tách độc lập Kênh Đỏ (Red Channel Extraction) trên mảng `ImageData.data` của Canvas HTML5 để triệt tiêu hoàn toàn khung in màu hồng!"*

5. **Phản hồi sửa lỗi & Đề xuất giải thuật của AI (Corrected AI Output):**
   > AI thừa nhận sai sót trong việc sắp xếp tọa độ điểm đích và phép khử Gauss không chọn phần tử trục (partial pivoting). AI cung cấp lại công thức giải hệ 8 phương trình tìm ma trận biến đổi phối cảnh 2D Homography chuẩn xác, và đồng thuận giải pháp trích xuất Kênh Đỏ: $Pixel_{processed} = Pixel_{Red}$, sau đó áp dụng ngưỡng thích nghi Otsu cục bộ.

6. **Đánh giá & Tự lập trình của nhóm học sinh (Human Implementation & Vitest Verification):**
   > Nhóm tự tay lập trình tệp `src/lib/omr.js` và `src/lib/omrSheetGenerator.js` bằng JavaScript thuần 100% (dung lượng mã nguồn chưa đến **38KB**, không phụ thuộc bất kỳ thư viện ngoài nào). Tự thiết kế thuật toán bù trừ độ sáng bất đối xứng (khi học sinh chụp ảnh bài thi bị bóng bàn tay hoặc đèn phòng học chiếu xiên). Kiểm thử thực tế trên **50 phiếu thi trắc nghiệm A4** của học sinh khối 11 và khối 12 trường THPT Đông Thụy Anh, đạt độ chính xác chấm điểm **98.2%**, thời gian xử lý cực nhanh: **1.2 giây/phiếu**.

---

### IV. GIẢI TRÌNH CƠ CHẾ KIỂM SOÁT ĐỘ CHÍNH XÁC, AN TOÀN DỮ LIỆU VÀ ĐẠO ĐỨC

1. **Cơ chế Kiểm soát Độ chính xác (Zero-Hallucination Policy):**
   - Triệt để áp dụng nguyên lý: *"Code tất định tính trước – AI lập luận sư phạm sau"*.
   - Mọi bài toán định lượng (khối lượng mol, nồng độ mol, pH dung dịch, chu kỳ con lắc, tổng trở RLC, tần số alen di truyền) đều bắt buộc giải qua thư viện thuần `scientificTools.js` và `chemBalance.js`.
   - Kết quả số học được đưa vào làm ngữ cảnh bất khả xâm phạm của LLM. Hệ thống có module hậu kiểm (Post-verifier) tự động đối soát; nếu AI phản hồi sai lệch quá ngưỡng cho phép, hệ thống lập tức chặn tin nhắn sai và gắn cảnh báo trực quan cho học sinh.

2. **Cơ chế Bảo vệ Dữ liệu Riêng tư (PII & Data Privacy Protection):**
   - Tuyệt đối không gửi thông tin định danh của học sinh (họ tên, ngày sinh, trường lớp, số điện thoại, kết quả bài thi) lên các API AI bên ngoài. Dữ liệu gửi lên AI chỉ bao gồm nội dung văn bản thuần túy của câu hỏi KHTN cần giải đáp. Toàn bộ mã định danh học sinh được bảo vệ an toàn trên hạ tầng Firebase Auth.

3. **Cơ chế Đạo đức trong Giám sát Khảo thí (Ethical AI & MediaPipe):**
   - Giám sát phòng thi phân tích luồng thị giác hoàn toàn cục bộ trên thiết bị của học sinh qua thư viện MediaPipe (Edge AI). Hệ thống tuyệt đối không truyền phát video luồng liên tục và không ghi âm về máy chủ, chỉ chụp ảnh nhỏ (snapshot) làm bằng chứng kiểm toán tại thời điểm xảy ra hành vi vi phạm quy chế kéo dài.

---

<table style="width: 100%; border: none; margin-top: 30px;">
  <tr style="border: none;">
    <td style="width: 50%; text-align: center; vertical-align: top; border: none;">
      <i>Hưng Yên, ngày 30 tháng 10 năm 2026</i><br>
      <b>NGƯỜI HƯỚNG DẪN NGHIÊN CỨU</b><br>
      <i>(Ký, ghi rõ họ tên và xác nhận tính minh bạch)</i><br><br><br><br><br>
      <b>Nguyễn Thị Thanh Hà</b>
    </td>
    <td style="width: 50%; text-align: center; vertical-align: top; border: none;">
      <i>Hưng Yên, ngày 30 tháng 10 năm 2026</i><br>
      <b>HỌC SINH / TRƯỞNG NHÓM</b><br>
      <i>(Ký, ghi rõ họ tên và cam kết liêm chính học thuật)</i><br><br><br><br><br>
      <b>Nguyễn Thế Duy</b>
    </td>
  </tr>
</table>
