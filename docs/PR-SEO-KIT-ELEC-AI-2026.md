# Bộ Kit Truyền Thông, Lên Báo 0 Đồng, SEO & Học Thuật (DOI) — ELEC Science AI (2026)

> Tài liệu lưu trữ trong dự án `elec-science-ai` (`docs/PR-SEO-KIT-ELEC-AI-2026.md`). Dùng để tự đăng bài miễn phí trên Tinh tế, Viblo, Spiderum, Zenodo (lấy mã DOI), Product Hunt, gửi báo Giáo dục & Thời đại / VnExpress / Báo Hưng Yên và đăng tin lên cổng trường `.edu.vn`.

## 0. Bộ 6 Ảnh Bản Quyền Chính Thức (`elecai.id.vn/img/author/`)

1. Chân dung nhận Giải Ba: `https://www.elecai.id.vn/img/author/nguyen-the-duy-giai-ba-khoi-nghiep-hung-yen-2026.jpg`
2. Giấy chứng nhận Giải Ba Sở GD&ĐT Hưng Yên 2026: `https://www.elecai.id.vn/img/author/chung-nhan-giai-ba-elec-ai-hung-yen-2026.jpg`
3. Phỏng vấn Đài PT&TH Hưng Yên (HYTV): `https://www.elecai.id.vn/img/author/nguyen-the-duy-phong-van-hytv-elec-ai-2026.jpg`
4. Thuyết trình trước Hội đồng Giám khảo: `https://www.elecai.id.vn/img/author/elec-ai-thuyet-trinh-ban-giam-khao-hung-yen-2026.jpg`
5. Đội ngũ tác giả & giáo viên hướng dẫn trên sân khấu: `https://www.elecai.id.vn/img/author/doi-ngu-elec-ai-san-khau-khoi-nghiep-hung-yen-2026.jpg`
6. Gian trưng bày ELEC AI — Trường THPT Đông Thụy Anh: `https://www.elecai.id.vn/img/author/gian-hang-elec-ai-thpt-dong-thuy-anh-2026.jpg`

---

## 1. Bài Đăng Tinh Tế (`tinhte.vn`)

**Tiêu đề:** Mình là học sinh THPT, tự làm web AI giải Lý – Hóa – Sinh "không tự bịa số liệu", vừa đạt Giải Ba Khởi nghiệp Hưng Yên 2026

Chào anh em Tinh tế,

Mình là Nguyễn Thế Duy, hiện là học sinh Trường THPT Đông Thụy Anh. Hôm nay mình muốn chia sẻ dự án web mà mình tự thiết kế và lập trình từ năm 2025 tới giờ mang tên **ELEC Science AI** (`https://www.elecai.id.vn/`), và may mắn vừa đạt **Giải Ba** tại Cuộc thi *"Học sinh phổ thông với ý tưởng khởi nghiệp"* tỉnh Hưng Yên năm 2026 do Sở GD&ĐT Hưng Yên tổ chức.

### Vì sao mình làm thêm một web AI khi ChatGPT/Gemini đã có sẵn?
Khi ôn thi Khoa học Tự nhiên (Vật lí, Hóa học, Sinh học) theo chương trình GDPT 2018, có 3 rào cản lớn nếu chỉ dùng chatbot thông thường:
- **AI hay "bịa" số liệu và cân bằng sai phương trình hóa học phức tạp** (oxi hóa – khử nhiều ẩn, tính nồng độ/pH, khối lượng mol).
- **Đưa thẳng đáp án làm học sinh lười tư duy**, không hiểu bản chất.
- **Công cụ học tập phân mảnh** ở quá nhiều website khác nhau.

### Điểm kỹ thuật cốt lõi: Ép AI "không tự tính nhẩm"
- **Cân bằng PTHH bằng khử Gauss với phân số `BigInt`:** Loại bỏ sai số dấu phẩy động, luôn ra hệ số nguyên dương tối giản chính xác tuyệt đối.
- **Tính trước – Hậu kiểm sau:** Khối lượng mol, số mol, nồng độ, pH được lõi công cụ tính trước khi đưa vào ngữ cảnh AI, sau đó đối chiếu lại phản hồi AI.
- **6 chế độ sư phạm:** Gồm chế độ **Gợi ý từng bước (Socratic)** không lộ đáp án ngay, và hỗ trợ chụp tới 10 ảnh đề bài.

### Các công cụ miễn phí khác cho Học sinh & Giáo viên
- **Bảng tuần hoàn 118 nguyên tố chuẩn IUPAC** (mô phỏng 3D, so sánh 2 nguyên tố).
- **Phòng thí nghiệm Vật lí ảo 7 mô phỏng & Lab Hóa học 3D.**
- **Phòng thi ảo 50 phút chuẩn cấu trúc 3 phần Bộ GD&ĐT 2026 & ĐGNL (HSA, TSA, V-ACT)**, tự động lưu câu sai vào Sổ tay SRS (SuperMemo SM-2) và đo năng lực theo điểm Elo.
- **Công cụ giáo viên:** Tạo đề từ PDF/Word/Ảnh, **chấm phiếu trắc nghiệm giấy A4 qua camera (OMR)** và **giám sát phòng thi MediaPipe cục bộ trên trình duyệt**.

Trải nghiệm miễn phí tại: **https://www.elecai.id.vn/**

---

## 2. Bài Kỹ Thuật Chuyên Sâu Cho Viblo (`viblo.asia`)

**Tiêu đề:** Kiến trúc Hybrid Neuro-Symbolic trong ELEC Science AI: Giải bài toán chống "ảo giác số học" của LLM cho Vật lí – Hóa học – Sinh học

- **Tags:** `AI`, `EdTech`, `JavaScript`, `React`, `Computer Vision`
- **Tóm tắt kiến trúc 6 tầng:** `aiRouter.js` (phân loại + hedge đa provider) → `aiOcr.js` (Vision + Tesseract OCR fallback) → `chemBalance.js` & `aiTools.js` (khử Gauss `BigInt`, tính mol/pH tất định) → `aiKnowledge.js` (118 nguyên tố IUPAC & công thức GDPT 2018) → `aiPrompts.js` (6 chế độ sư phạm Socratic) → `ai.js` & `aiMemory.js` (hậu kiểm số học + hồ sơ năng lực).
- **Các module nổi bật khác:** Chấm phiếu A4 OMR bằng Canvas thuần (`src/lib/omr.js`), Edge AI Proctoring dùng MediaPipe Vision không tải video lên server, Elo + SuperMemo SM-2 SRS, và chứng thực bản quyền Zero-Knowledge Timestamp (`SHA-256 Manifest` + OpenTimestamps trên Bitcoin).

---

## 3. Hồ Sơ Đăng Ký Mã DOI Quốc Tế Miễn Phí Trên Zenodo (`zenodo.org`)

- **File tải lên:** `Bao cao du an ELEC AI - da can chinh.pdf`
- **Title:** `ELEC Science AI: A Tool-Verified Neuro-Symbolic AI Assistant and Online Assessment Platform for Secondary Natural Sciences (Physics, Chemistry, Biology) in Vietnam`
- **Creator:** `Nguyễn, Thế Duy` — `Dong Thuy Anh High School (Trường THPT Đông Thụy Anh), Vietnam`
- **Related Links:** `https://www.elecai.id.vn/`, `https://github.com/DuyTKTB/Aitk`, `https://vi.wikipedia.org/wiki/ELEC_Science_AI`

---

## 4. Hồ Sơ Product Hunt (`producthunt.com`)

- **Name:** `ELEC Science AI`
- **Tagline:** `Tool-verified AI tutor & exam platform for Natural Sciences`
- **Website:** `https://www.elecai.id.vn/`

---

## 5. Mẫu Email Gửi Báo Giáo Dục / VnExpress / Báo Hưng Yên & Tin Cổng Trường `.edu.vn`

Xem bản đầy đủ kèm checklist 7 ngày và mẫu chú thích Wikipedia `<ref>` trong artifact `elec_ai_free_pr_seo_kit.md`.
