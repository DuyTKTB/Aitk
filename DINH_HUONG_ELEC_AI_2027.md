# ĐỊNH HƯỚNG NÂNG CẤP ELEC AI — GIAI ĐOẠN 2027

**Phạm vi khảo sát:** toàn bộ mã nguồn tại `D:\Tải Xuống\app` (nhánh làm việc hiện tại)
**Ngày lập:** 01/11/2026
**Nguyên tắc:** mọi nhận định về hiện trạng đều kèm bằng chứng trong code. Chỗ nào chưa kiểm chứng được thì ghi rõ là giả định.

---

## 0. Tôi đã khảo sát những gì

| Hạng mục | Số liệu thực đo |
|---|---|
| Component React | **228 file `.jsx`, 4.564,8 KB** mã nguồn |
| Lớp logic (`src/lib`) | **98 file `.js`, 979,1 KB** |
| Dữ liệu môn học | 12 môn trong `topicsBySubject.js`; 11 môn + `GENERIC` trong `subjects.js` |
| Game | 15 component game + Virtual Lab 3D |
| Cloud Functions | 4 hàm đang export: `askAI`, `askAIBatch`, `elecaiWebhook`, `processSignUp`, `expireVip`, `syncIdentCode` |
| Bộ test | ~329 test (theo báo cáo V3 ngày 27/10: 328 pass / 1 fail) |
| Ngân hàng câu hỏi | 55 câu; `topic_id` = NULL toàn bộ |

---

## 1. Tóm tắt điều hành — 6 kết luận

1. **Sản phẩm đã đủ dày để thương mại hoá, nhưng chưa đủ an toàn để mở rộng toàn quốc.** Phần "hay" (AI nhiều provider, chấm đề 3 dạng thức, lộ trình thành thạo, 15 game, OMR) đã có. Phần "chịu tải" (bảo mật khoá, quota, chống gian lận dữ liệu, nội dung đa môn) thì chưa.

2. **Rủi ro số 1 không phải là thiếu tính năng, mà là khoá API đang nằm trong bundle.** `src/lib/ai.js` đọc trực tiếp `VITE_GEMINI_KEY`, `VITE_GROQ_API_KEY`, `VITE_AGNES_API_KEY` ở cấp module. Khung proxy đã có (`functions/aiProxy.js`, `src/lib/functionsClient.js`) nhưng **chưa được nối**: client gọi callable `aiProxy`, `submitExam`, `saveExamAnswers`, trong khi `functions/index.js` chỉ export `askAI` / `askAIBatch` dạng HTTP. Đây là việc của **tuần này**, không phải của quý sau.

3. **"Đa môn" hiện là đa môn trên giấy.** Taxonomy môn/chuyên đề có đủ 12 môn, AI sinh đề được mọi môn, nhưng **công cụ tính chính xác và ngân hàng câu hỏi mới chỉ có Hoá**. Muốn mở sang Toán – Lý – Sinh thì phải mở đúng chỗ: lớp *tool* (tính toán/kiểm chứng), không phải lớp *prompt*.

4. **Lộ trình học đã có lõi tốt nhưng đang chạy bằng 0 dữ liệu.** Điểm thành thạo, SRS 1/3/7/14/30, kế hoạch tới ngày thi, flashcard đều đã viết và có test; nhưng 55/55 câu chưa gắn chuyên đề nên mọi chỉ số để trống. **Nạp nội dung là điều kiện tiên quyết**, không phải việc phụ.

5. **Nợ kỹ thuật đang tập trung ở 4 file khổng lồ** (TeacherDashboard 103,7 KB; AIChat 88,4 KB; FormulaCalculator 75,7 KB; ClockHub 65,2 KB). Ở quy mô 1 trường thì không sao; ở quy mô toàn quốc thì mỗi lần sửa là một lần rủi ro.

6. **Cơ hội lớn nhất chưa ai làm:** biến "lộ trình + dữ liệu lỗi sai + ngân hàng đề chuẩn cấu trúc" thành một vòng lặp khép kín (chẩn đoán → luyện → chấm → cập nhật lộ trình). Đây là thứ đối thủ khó copy nhất, và cũng là thứ phần mềm hiện tại đã có 70% linh kiện.

---

## 2. Hiện trạng: cái gì đã mạnh, cái gì chặn đường

### 2.1 Điểm mạnh đã kiểm chứng trong code

| Năng lực | Bằng chứng |
|---|---|
| Kiến trúc AI nhiều tầng | `aiRouter.js` phân loại tác vụ → chọn tầng fast/smart/vision; key-ring xoay khi 429; tự dò model Gemini |
| Nguyên tắc "AI không bịa số học" | `aiTools.js` tính trước (khối lượng mol, cân bằng PTHH, mol/pH), đối chiếu lại sau khi AI trả lời |
| Chấm đề đúng chuẩn 3 dạng thức | `examScoring.js`: `single_choice`, `true_false` (thang 10/25/50/100%), `short_answer` (so khớp số có dung sai) |
| Lộ trình học có lõi đo lường | `roadmapEngine.js`: thành thạo = `100 × accuracy × (0,6+0,4×volume) × (0,75+0,25×recency)`, ngưỡng 40/60/80/95 |
| Ôn tập theo lỗi sai | `reviewQueue.js` + `questionStats` + lịch 1/3/7/14/30 |
| Chấm phiếu A4 (OMR) | `omr.js`, `omrQuality.js`, `paperGrade.js` |
| Hệ sinh thái game | 15 game + Virtual Lab 3D + pet/huy hiệu/xếp hạng |
| PWA + SEO/GEO | `pwa.js`, `public/llms.txt`, robots mở cho GPTBot/PerplexityBot |

### 2.2 Nợ kỹ thuật chặn quy mô (xếp theo mức nguy hiểm)

| # | Vấn đề | Bằng chứng | Hệ quả khi scale |
|---|---|---|---|
| 1 | **Khoá AI nằm trong bundle client** | `ai.js:39-41` đọc `VITE_*_KEY` | Bất kỳ ai mở DevTools cũng lấy được khoá; chi phí và uy tín đều rủi ro |
| 2 | **Proxy chưa nối** | `functionsClient.js` gọi `aiProxy`/`submitExam`/`saveExamAnswers`; `functions/index.js` không export các callable này | Toàn bộ luồng "server-side" đang là mã chết |
| 3 | **Proxy không streaming, sai vùng** | `aiProxy.js`: `generateContent` (không stream), `.region('us-central1')` | Mất trải nghiệm gõ chữ dần; thêm ~250–400 ms mỗi vòng tới Việt Nam |
| 4 | **Trừ credit không nguyên tử** | `aiProxy.js`: đọc `credits` → `update` sau khi gọi AI | Gọi song song sẽ trừ sai, thất thoát doanh thu |
| 5 | **CORS mở `*`** | `res.set('Access-Control-Allow-Origin', '*')` | Gọi hàm từ domain lạ |
| 6 | **Supabase RLS hở** | Báo cáo V3: PATCH `questions` bằng anon key trả 204 | Dữ liệu đề thi bị sửa tự do |
| 7 | **Không đồng bộ đa thiết bị** | Báo cáo V3: chưa bật Supabase Third-party Auth | Học sinh đổi máy là mất tiến độ → mất niềm tin |
| 8 | **4 file > 60 KB** | `TOOLS_ASSESSMENT_ROADMAP.md` | Không thể chia việc cho nhiều người; build chậm; TTI 2,0–2,5 s |
| 9 | **Ngân hàng câu hỏi quá nhỏ và thiếu metadata** | 55 câu, `topic_id` NULL | Lộ trình, adaptive, dự báo điểm đều vô hiệu |
| 10 | **Chưa có đo lường chi phí/độ trễ theo provider** | Không có dashboard, chỉ có `console.error` | Không biết tiền đi đâu khi có 10.000 người dùng |

---

## 3. Khung định hướng: 4 hướng của bạn → 7 trụ

Bốn hướng bạn nêu là đúng, nhưng nếu chỉ làm 4 hướng đó thì sẽ tắc ở tháng thứ 4. Tôi đề xuất giữ nguyên 4 hướng và bổ sung 3 trụ bắt buộc:

| Trụ | Nội dung | Xuất phát từ |
|---|---|---|
| **T1. AI đa môn & suy luận có kiểm chứng** | Toán – Lý – Sinh – Anh, công cụ tính theo môn, kiểm chứng kết quả | Hướng (1) |
| **T2. Hạ tầng serverless & bảo mật** | Gateway, Secret Manager, quota, cache, observability | Hướng (2) |
| **T3. Cá nhân hoá lộ trình** | Chẩn đoán, mục tiêu, adaptive, dự báo, phụ huynh | Hướng (3) |
| **T4. Nội dung & ngân hàng đề chuẩn** | Metadata, ma trận đề, kiểm định, học liệu | Hướng (4) |
| **T5. Game hoá có chiều sâu** | Engine hợp nhất, đấu trường, AI sinh game từ bài giảng | Hướng (4) |
| **T6. Tin cậy & vận hành** *(bổ sung)* | Chống gian lận thi, audit log, sao lưu, SLA, hỗ trợ | Bắt buộc khi thi toàn quốc |
| **T7. Tăng trưởng & giữ chân** *(bổ sung)* | Đo lường học tập, báo cáo giá trị, giới thiệu, gói trường học | Quyết định sống còn về doanh thu |

Lý do bổ sung T6–T7: khi triển khai toàn quốc, câu hỏi không còn là "AI trả lời đúng không" mà là "hệ thống có sập vào ngày thi thử không", "dữ liệu học sinh có bị lộ không", "phụ huynh có thấy tiến bộ để tiếp tục trả tiền không".

---

## 4. Ba mươi chức năng mới

Ký hiệu: **Effort** S ≤ 1 tuần · M = 2–4 tuần · L ≥ 1 tháng (1 người). **Ưu tiên** P0 = bắt buộc trước khi scale, P1 = tạo khác biệt, P2 = tăng trưởng.

### Nhóm A — AI đa môn & phân tích chuyên sâu (8 chức năng)

| ID | Chức năng | Nội dung & giá trị | Effort | Ưu tiên |
|---|---|---|---|---|
| **A1** | **Subject Router + Tool Registry theo môn** | Mở rộng `aiRouter.js`/`aiTools.js`: mỗi môn có bộ công cụ riêng (Hoá: cân bằng PTHH; Toán: giải/kiểm tra biểu thức; Lý: kiểm tra đơn vị + đọc đồ thị; Sinh: xác suất di truyền; Anh: ngữ pháp). AI chỉ diễn giải, không tự tính. Đây là điều kiện để mở môn mà không giảm độ chính xác. | L | **P0** |
| **A2** | **Symbolic Math Engine trên server** | Dịch vụ Python (SymPy) sau Cloud Function: giải phương trình, rút gọn, đạo hàm/tích phân, hình học giải tích, kiểm tra nghiệm. AI gọi tool rồi mới viết lời giải. Khắc phục điểm yếu cố hữu của LLM với Toán. | L | **P0** |
| **A3** | **Bộ kiểm chứng câu trả lời (Answer Verifier)** | Tổng quát hoá cơ chế đã có cho Hoá: mọi con số trong câu trả lời được đối chiếu với tool; lệch → tự trả lời lại hoặc gắn nhãn "cần kiểm tra". Có log để đo tỉ lệ AI sai theo môn. | M | **P0** |
| **A4** | **Giải từng bước có kiểm soát** | Chế độ "step-by-step": ẩn/hiện từng bước, chấm theo bước (đúng bước nào được điểm bước đó), phát hiện bước sai đầu tiên. Rất hợp luyện thi tự luận Toán – Lý. | M | P1 |
| **A5** | **Vision nâng cao: chụp đề có hình – bảng – công thức viết tay** | Nâng cấp luồng ảnh hiện có: nhận diện hình học, đồ thị, bảng số liệu, công thức viết tay; dựng lại thành đề có cấu trúc (câu + hình + đáp án) thay vì chỉ OCR chữ. | M | **P0** |
| **A6** | **Gia sư Socratic 3 chế độ** | "Giải thích" / "Gợi mở từng bước" / "Kiểm tra tôi" — chế độ gợi mở không được đưa đáp án; đo số lần học sinh tự tìm ra. Giảm phụ thuộc "dán đề – chép lời giải". | S–M | P1 |
| **A7** | **Chẩn đoán hiểu sai (misconception tagging)** | Gắn nhãn lỗi: sai đơn vị, sai dấu, đọc sai đề, thiếu điều kiện, sai khái niệm, tính toán. Xuất báo cáo "bạn yếu vì lý do gì" thay vì chỉ "sai 6/10". Là đầu vào cho lộ trình T3. | M | P1 |
| **A8** | **Chấm tự luận bằng rubric + giáo viên duyệt** | Ngữ văn, Toán tự luận: rubric 4 mức, AI đề xuất điểm + dẫn chứng, giáo viên duyệt/sửa. Bắt buộc có "người duyệt" để không đánh mất tính sư phạm. | L | P1 |

### Nhóm B — Serverless, bảo mật, vận hành (6 chức năng)

| ID | Chức năng | Nội dung & giá trị | Effort | Ưu tiên |
|---|---|---|---|---|
| **B1** | **AI Gateway serverless duy nhất** | Một endpoint (Cloud Run hoặc Functions v2 có streaming SSE) cho mọi lời gọi model: xác thực Firebase ID token, phân quyền theo vai, rate-limit theo uid/IP, timeout, fallback provider, chuẩn hoá lỗi. Client chỉ biết một URL. **Đặt vùng `asia-southeast1`** thay vì `us-central1`. | L | **P0** |
| **B2** | **Secret Manager + thu hồi khoá cũ** | Chuyển toàn bộ khoá sang Secret Manager, tách theo môi trường dev/prod, xoay 90 ngày, không cấp khoá cho client. **Thu hồi ngay** các khoá Gemini/Groq/Agnes từng nằm trong bundle đã phát hành. | S | **P0** |
| **B3** | **Cache hai tầng** | Tầng 1: hash prompt + tham số (chính xác). Tầng 2: semantic cache cho câu hỏi tương đương (embedding). Mục tiêu giảm 30–60% token ở các câu lặp lại (giải thích khái niệm, công thức). | M | P1 |
| **B4** | **Quota & Credit Engine phía server** | Ghi sổ credit bằng transaction/ledger (không `read → update`), khoá theo uid, chống gọi song song, tính theo token thật của provider, hoá đơn theo chu kỳ, chặn vượt hạn mức. | M | **P0** |
| **B5** | **Hàng đợi job nặng (Cloud Tasks)** | Chấm OMR hàng loạt, sinh đề hàng loạt, xuất PDF/Word, gửi báo cáo tuần: đưa vào queue, có tiến độ, có retry, không chặn UI và không bị timeout 60 s. | M | P1 |
| **B6** | **Observability + Audit log** | Dashboard chi phí/độ trễ/tỉ lệ lỗi theo provider–model–môn; cảnh báo ngưỡng; audit log truy cập dữ liệu học sinh; phân quyền least-privilege cho service account; đóng RLS Supabase. | M | **P0** |

### Nhóm C — Cá nhân hoá lộ trình (6 chức năng)

| ID | Chức năng | Nội dung & giá trị | Effort | Ưu tiên |
|---|---|---|---|---|
| **C1** | **Chẩn đoán đầu vào (placement test)** | 20–30 câu thích ứng theo môn → bản đồ mạnh/yếu theo chuyên đề → sinh lộ trình ban đầu. Đây là "cửa vào" tự nhiên thay cho màn hình trống hiện tại. | M | **P0** |
| **C2** | **Lộ trình theo mục tiêu cá nhân** | Nhập: mục tiêu điểm, trường/ngành mong muốn, ngày thi, số phút/ngày, tổ hợp môn → hệ thống tính độ thiếu hụt từng chuyên đề, phân bổ lịch, cảnh báo "không khả thi" kèm số phút/ngày cần thiết. Mở rộng `roadmapEngine.js` + `studyPlan.js` đã có. | M | **P0** |
| **C3** | **Luyện thích ứng (adaptive)** | Chọn câu theo năng lực ước lượng (Elo/IRT nhẹ), giữ tỉ lệ đúng mục tiêu 65–80%, tự tăng/giảm độ khó, dừng khi đủ tin cậy. Cần D1 làm nền. | L | P1 |
| **C4** | **Dự báo điểm thi có khoảng tin cậy** | Ước lượng điểm theo phân bố chuyên đề + độ khó, hiển thị **khoảng** (ví dụ 7,2–8,1) kèm nhãn "ước lượng từ N bài đã làm", và "còn cách mục tiêu 0,8 điểm – tập trung 3 chuyên đề này". Không hứa hẹn, không một con số tuyệt đối. | M | P1 |
| **C5** | **Chế độ phụ huynh** | Tài khoản chỉ-đọc: báo cáo tuần (thời gian học, chuyên đề đã cải thiện, cảnh báo bỏ học), mục tiêu tuần, nhận qua email/Zalo. Tăng mạnh tỉ lệ gia hạn. | M | P1 |
| **C6** | **Đồng bộ đa thiết bị + nhắc học + offline-first** | Bật Supabase Third-party Auth để có session song song Firebase → đồng bộ tiến độ; nhắc học qua FCM/Zalo ZNS; luyện tập offline bằng IndexedDB, đồng bộ khi có mạng. | M–L | **P0** |

### Nhóm D — Nội dung, đề thi, ngân hàng câu hỏi (5 chức năng)

| ID | Chức năng | Nội dung & giá trị | Effort | Ưu tiên |
|---|---|---|---|---|
| **D1** | **Ngân hàng câu hỏi đa môn có metadata chuẩn** | Mỗi câu có: môn, chuyên đề, mức độ (nhận biết/thông hiểu/vận dụng/vận dụng cao), dạng thức (3 loại), nguồn, bản quyền, phiên bản, thời gian làm, độ khó ước lượng, lịch sử sửa. Import/export CSV–JSON–DOCX (kèm công thức LaTeX) có validate + rollback. Lấp đúng lỗ hổng "55 câu, topic_id NULL". | M | **P0** |
| **D2** | **Exam Composer theo ma trận đề** | Khai báo ma trận (số câu Phần I/II/III × mức độ × chuyên đề × tổng điểm) → hệ thống bốc đề, kiểm tra khớp ma trận, sinh nhiều mã đề (shuffle có seed để công bằng), xuất PDF/Word kèm phiếu trả lời và bảng đáp án. Bám cấu trúc 3 dạng thức đang áp dụng ổn định cho kỳ thi 2026 ([GD&ĐT, 02/2026](https://giaoducthoidai.vn/thi-tot-nghiep-thpt-2026-on-dinh-cau-truc-de-thi-post767266.html)). | M | **P0** |
| **D3** | **Kiểm định đề tự động (QA)** | Phát hiện: câu trùng/na ná, thiếu đáp án đúng, nhiễu trùng nhau, sai đơn vị, mất cân bằng phân bố A/B/C/D, LaTeX lỗi, câu quá dài so với thời gian, câu "vô nghiệm" theo công cụ tính. Chặn đề lỗi trước khi giao. | M | P1 |
| **D4** | **Thư viện học liệu số + tìm kiếm ngữ nghĩa** | SGK/chuyên đề/video/slide/flashcard gắn vào từng chương; tìm bằng ngữ nghĩa ("chỗ nào nói về cân bằng chuyển dịch"), không chỉ từ khoá; hiển thị đúng đoạn liên quan trong bài giảng. | L | P1 |
| **D5** | **Kho đề tham chiếu theo năm + phân tích phổ điểm** | Lưu đề minh hoạ/đề chính thức theo năm với bản quyền rõ; sau mỗi đợt thi thử, tính phổ điểm thực tế để hiệu chỉnh độ khó. Có "exam blueprint" dạng phiên bản để cập nhật khi Bộ đổi cấu trúc mà không phá dữ liệu cũ. | M | P1 |

### Nhóm E — Game hoá & tương tác (5 chức năng)

| ID | Chức năng | Nội dung & giá trị | Effort | Ưu tiên |
|---|---|---|---|---|
| **E1** | **Quiz Game Engine hợp nhất** | Hiện 15 game mỗi cái tự xử lý câu hỏi/điểm/âm thanh. Tách một lõi chung (chọn câu từ ngân hàng theo chuyên đề + mức độ, tính điểm, thời gian, lưu kết quả) và một API; game chỉ còn phần "luật chơi + hình ảnh". Thêm môn mới = thêm đề, không sửa 15 file. | M | P1 |
| **E2** | **Đấu trường theo lớp/trường** | Giải theo mùa, bảng xếp hạng tuần, bracket loại trực tiếp, phần thưởng (huy hiệu/pet skin). Tận dụng `leaderboard.js`, `petRank.js`, `QuizDuel` đã có. | M | P2 |
| **E3** | **AI sinh game từ bài giảng của giáo viên** | Giáo viên upload tài liệu/giáo án → AI tạo bộ câu hỏi đúng phạm vi bài → chơi ngay ("host mode": máy chiếu hiện câu, học sinh vào bằng mã lớp). Đây là chức năng giữ chân giáo viên mạnh nhất. | M | P1 |
| **E4** | **Quest theo lộ trình + chuỗi ngày học** | Nhiệm vụ ngày/tuần sinh tự động từ lộ trình ("hoàn thành 3 chuyên đề yếu", "ôn 20 thẻ đến hạn"), huy hiệu theo năng lực chứ không theo số lần bấm, giữ chuỗi bằng bài 3 phút. | S–M | P2 |
| **E5** | **Thử thách chia sẻ + bảng xếp hạng trường** | Tạo link thử thách 5 câu gửi qua Zalo/Messenger (không cần đăng nhập để chơi, đăng nhập để lưu), mã trường/lớp trong bảng xếp hạng. Kênh tăng trưởng chi phí thấp nhất. | S | P2 |

**Tổng: 30 chức năng.**

### 5 chức năng dự phòng (nếu muốn thay bớt)

1. **AI soạn giáo án & đề từ SGK** (theo khung 6 bước của công văn 5512 – giáo viên chỉ duyệt).
2. **Chợ học liệu giáo viên** (chia sẻ/sửa/bán chuyên đề, có kiểm duyệt và chia doanh thu).
3. **Ứng dụng di động đóng gói** (Capacitor) + thông báo đẩy, dùng chung mã nguồn web.
4. **Trợ năng & cá nhân hoá giao diện** (cỡ chữ, tương phản, đọc thành tiếng, chế độ dyslexia).
5. **Gói trường học B2B** (SSO, nhập danh sách lớp từ Excel/SIS, phân quyền theo trường, báo cáo cấp trường, hợp đồng theo số học sinh).

---

## 5. Kiến trúc đích (serverless) — cụ thể đến mức triển khai được

```
Người dùng (Web PWA / Mobile)
        │  Firebase ID token
        ▼
┌──────────────────────────────────────────────┐
│  AI GATEWAY  (Cloud Run – asia-southeast1)   │
│  • verify token, phân quyền, rate-limit       │
│  • quota/credit: transaction + ledger         │
│  • cache 2 tầng (Firestore/Redis)             │
│  • router: môn → model tier → tool            │
│  • fallback provider, chuẩn hoá lỗi           │
└───────┬───────────────┬──────────────┬───────┘
        │               │              │
        ▼               ▼              ▼
  Secret Manager    Tool service   Cloud Tasks
  (Gemini/Groq/…)   (SymPy, chem,  (chấm OMR lô,
                     unit/verify)   sinh đề lô, PDF)
        │
        ▼
  Firestore (quota, audit)  ·  Supabase (nội dung, câu hỏi, attempts)
        │
        ▼
  Observability: chi phí / độ trễ / lỗi theo provider–model–môn
```

### 5 quyết định kỹ thuật cần chốt

| Quyết định | Đề xuất | Lý do |
|---|---|---|
| Nền chạy | **Cloud Run** cho gateway (không phải Functions thuần) | Cần streaming SSE dài, timeout > 60 s, giữ kết nối; Functions v2 chỉ dùng cho webhook/cron |
| Vùng | `asia-southeast1` (Singapore) | Giảm ~250–400 ms/vòng so với `us-central1` hiện tại |
| Streaming | SSE qua gateway, client giữ nguyên giao diện gõ chữ dần | Nếu mất streaming, trải nghiệm tụt rõ rệt dù chất lượng không đổi |
| Khoá | Secret Manager + xoay 90 ngày; client **không** có khoá nào | Loại bỏ rủi ro số 1 vĩnh viễn |
| Sổ credit | Ledger append-only + số dư tính từ ledger, có transaction | Sửa lỗi trừ sai khi gọi song song |

**Điểm phải giữ nguyên khi chuyển:** nguyên tắc "tool tính trước, AI diễn giải sau" (`aiTools.js`), tầng phân loại tác vụ (`aiRouter.js`), và cơ chế đối chiếu kết quả sau khi AI trả lời. Chuyển lên server là **dịch chuyển chỗ đặt**, không phải viết lại triết lý.

---

## 6. Lộ trình 3 giai đoạn

### Giai đoạn 0 — Bịt lỗ hổng (2 tuần, làm ngay)

| Việc | Kết quả bàn giao |
|---|---|
| B2: chuyển khoá sang Secret Manager, thu hồi khoá cũ | `grep VITE_.*_KEY src/` trả về rỗng |
| B1 (phần tối thiểu): nối gateway + streaming + auth | Chat vẫn chạy, không còn khoá trong bundle |
| B4: sổ credit nguyên tử | Test 2 request song song không âm credit |
| B6 (phần tối thiểu): đóng RLS Supabase, audit log cơ bản | PATCH `questions` bằng anon key trả 401/403 |
| D1 (phần tối thiểu): gắn `topic_id` cho 55 câu hiện có | Lộ trình có số liệu thật thay vì trống |

**Cổng kiểm soát:** không triển khai cho trường mới nào trước khi 5 việc trên xong.

### Giai đoạn 1 — Đa môn khả dụng (tháng 1–3)

- A1 (tool registry theo môn), A5 (vision nâng cao), A2 bản đầu (Toán: phương trình – hệ phương trình – đạo hàm).
- C1 (chẩn đoán), C2 (lộ trình theo mục tiêu), C6 (đồng bộ + nhắc học).
- D2 (ma trận đề), D1 hoàn chỉnh (metadata + import/export).
- Mục tiêu: **Toán và Vật lí dùng được thật**, không phải "AI trả lời được".

### Giai đoạn 2 — Khác biệt hoá (tháng 4–6)

- A3 (verifier), A4 (từng bước), A6 (Socratic), A7 (chẩn đoán hiểu sai).
- C3 (adaptive), C4 (dự báo điểm có khoảng tin cậy).
- D3 (QA đề), D5 (kho đề theo năm + phổ điểm).
- E1 (game engine hợp nhất), E3 (AI sinh game từ bài giảng).

### Giai đoạn 3 — Mở rộng quy mô (tháng 7–12)

- A8 (chấm tự luận + duyệt), B3 (cache), B5 (job queue), B6 đầy đủ.
- C5 (phụ huynh), D4 (học liệu + tìm kiếm ngữ nghĩa).
- E2, E4, E5 (đấu trường, quest, thử thách chia sẻ).
- Song song: refactor 4 file lớn theo từng đợt nhỏ (không big-bang), tách `TeacherDashboard` → 6 tab, `AIChat` → 5 hook.

---

## 7. Chỉ số đo thành công (đừng đo bằng "đã làm xong")

### Kỹ thuật

| Chỉ số | Ngưỡng đạt |
|---|---|
| Khoá bí mật trong bundle | 0 (kiểm tự động trong CI) |
| Thời gian tới token đầu tiên (p95) | < 2,5 s |
| Tỉ lệ lỗi gateway (5xx + timeout) | < 1,5% |
| Chi phí token / người dùng / tháng | Giảm 40% so với trước cache |
| Uptime giờ cao điểm | ≥ 99,5% |
| Thời gian chấm 1 lớp 40 bài OMR | < 60 s (qua queue) |

### Học tập (mới là phần quan trọng)

| Chỉ số | Ngưỡng đạt |
|---|---|
| Tỉ lệ hoàn thành lộ trình 4 tuần | ≥ 35% |
| Tăng điểm thi thử sau 4 tuần (cùng đề) | +0,5 đến +1,0 điểm trung bình |
| Tỉ lệ câu đã gắn chuyên đề + mức độ | 100% |
| Số câu đã kiểm định cho 4 môn trọng tâm | ≥ 5.000 |
| D7 / D30 retention | ≥ 35% / ≥ 18% |
| Câu hỏi AI bị đánh dấu "sai kiến thức" | < 0,5% (có nút báo lỗi) |

Nguyên tắc: **không công bố "dự báo điểm" như một lời hứa.** Luôn kèm khoảng tin cậy, số bài đã làm, và nhãn "ước lượng".

---

## 8. Rủi ro & đối sách

| Rủi ro | Xác suất | Tác động | Đối sách |
|---|---|---|---|
| Chi phí token bùng nổ khi đông người dùng | Cao | Cao | Cache 2 tầng (B3), quota theo gói (B4), chọn model theo tầng tác vụ, chặn câu hỏi rác |
| Phụ thuộc một provider, bị đổi giá/chặn | Trung bình | Cao | Trừu tượng hoá provider (đã có), fallback tự động, ít nhất 2 provider cùng năng lực |
| AI trả lời sai kiến thức ở môn mới | Cao | Rất cao (uy tín) | Verifier (A3), giới hạn phạm vi chương trình, nút báo lỗi, duyệt người cho nội dung công khai |
| Vi phạm bản quyền đề thi/học liệu | Trung bình | Cao | Chỉ dùng đề có phép hoặc đề tự sinh + kiểm duyệt; ghi nguồn ở D1/D5 |
| Dữ liệu cá nhân của học sinh chưa thành niên | Trung bình | Rất cao | Tối thiểu hoá dữ liệu, đồng ý của phụ huynh, mã hoá, audit log, tuân thủ Nghị định 13/2023/NĐ-CP |
| "Dự báo điểm" gây hiểu nhầm | Trung bình | Trung bình | Chỉ hiển thị khoảng, kèm giải thích phương pháp và số mẫu |
| Nợ kỹ thuật làm chậm mọi tính năng | Chắc chắn | Trung bình | Refactor theo từng đợt gắn với tính năng đang sửa, không dừng sản phẩm để refactor |
| Gian lận thi khi thi online toàn quốc | Trung bình | Cao | Server chấm (đã có khung `submitExam`), mã đề shuffle có seed, giới hạn thời gian phía server, log bất thường |

---

## 9. Việc làm trong 14 ngày tới (checklist)

- [ ] Xoá `VITE_GEMINI_KEY`, `VITE_GROQ_API_KEY`, `VITE_AGNES_API_KEY` khỏi `.env` và khỏi mọi file client.
- [ ] Đưa 3 khoá vào Secret Manager; **thu hồi** khoá đã phát hành trong bundle cũ.
- [ ] Export callable `aiProxy`, `submitExam`, `saveExamAnswers` trong `functions/index.js` (hiện `functionsClient.js` gọi nhưng không tồn tại).
- [ ] Đổi `.region('us-central1')` → `asia-southeast1`; bật streaming SSE.
- [ ] Thay `read → update` credit bằng transaction + ledger.
- [ ] Bật RLS cho Supabase; chuyển script nhập liệu sang `service_role`.
- [ ] Gắn `topic_id` cho 55 câu hiện có (thủ công hoặc bán tự động có duyệt).
- [ ] Thêm bước CI: `grep -r "VITE_.*KEY" src/` phải rỗng, nếu không thì fail build.
- [ ] Thêm bảng "chi phí & độ trễ theo provider" vào trang admin (dữ liệu thật, không ước lượng).
- [ ] Chốt ma trận đề mẫu cho 3 môn (Hoá, Toán, Lý) làm chuẩn cho D2.

---

## 10. Phụ lục — 30 chức năng ứng với module nào trong mã hiện tại

| Chức năng | Chạm vào |
|---|---|
| A1, A3, A6 | `src/lib/aiRouter.js`, `aiTools.js`, `aiPrompts.js` |
| A2 | Mới: `tools-service/` (Python) + gateway route |
| A4 | `src/components/ChatMarkdown.jsx`, `MathText.jsx`, `aiPrompts.js` |
| A5 | `src/lib/aiOcr.js`, `fileReader.js`, nhánh `vision` trong `ai.js` |
| A7 | `src/lib/reviewQueue.js`, `learningAnalytics.js`, mới `misconception.js` |
| A8 | `src/lib/paperGrade.js` (đang chấm phiếu), mới `rubricGrader.js` |
| B1–B6 | `functions/index.js`, `functions/aiProxy.js`, `src/lib/functionsClient.js`, `quota.js`, `creditService.js` |
| C1 | Mới `placementTest.js`; dùng `topicProgress.js` |
| C2, C4 | `roadmapEngine.js`, `studyPlan.js`, `roadmapStore.js` |
| C3 | `roadmapEngine.js`, `questionBank.js`, `src/App.jsx` (luồng luyện) |
| C5 | Mới `parentReport.js` + Cloud Function gửi báo cáo |
| C6 | `supabase.js`, `pwa.js`, `settings.js` |
| D1, D3 | `questionBank.js`, `bankAdmin.js`, `scripts/import-questions.mjs` |
| D2, D5 | `examApi.js`, `examLayout.js`, `examShuffle.js`, `examExport.js`, `virtualExamsBank.js` |
| D4 | `DocsLibrary.jsx`, `DocStudio.jsx`, `docsData.js` |
| E1 | `src/lib/gameQuestionBank.js` + 15 file trong `src/components/games/` |
| E2, E4, E5 | `leaderboard.js`, `petRank.js`, `achievements.js`, `LeaderboardPage.jsx` |
| E3 | `DocStudio.jsx`, `AIQuizGenerator.jsx`, `GameHub.jsx` |

---

### Nếu chỉ được chọn 5 việc trong 3 tháng

1. **B2** — bỏ khoá khỏi client (rủi ro pháp lý và tài chính).
2. **B1** — gateway có streaming, đúng vùng.
3. **D1** — ngân hàng câu hỏi có metadata (mở khoá mọi thứ phía sau).
4. **C2** — lộ trình theo mục tiêu (giá trị người dùng cảm nhận được ngay).
5. **A1 + A2** — Toán dùng được thật (mở thị trường, không chỉ mở menu).
