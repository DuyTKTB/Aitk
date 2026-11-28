# Tuyên bố Bản quyền & Chứng thực Quyền Tác giả — ELEC Science AI

## 1. Thông tin Chủ sở hữu & Tác giả phần mềm

| Trường thông tin | Chi tiết |
| :--- | :--- |
| **Tên phần mềm / Nền tảng** | **ELEC Science AI** (tên gọi khác: ELEC AI, ELECAI) |
| **Tên gói (Package)** | `elec-science-ai` |
| **Chủ sở hữu & Tác giả chính** | **Nguyễn Thế Duy** (Duy TK / Tk Media) |
| **Email liên hệ** | `duyfamabo@gmail.com` |
| **Website chính thức** | https://www.elecai.id.vn/ |
| **Kho mã nguồn chính thức** | https://github.com/DuyTKTB/Aitk |
| **Kênh xác thực công khai** | https://www.facebook.com/nguyentheduytk |
| **Trạng thái giấy phép** | Độc quyền — **All Rights Reserved** (xem tệp [`LICENSE`](./LICENSE)) |

> **Lưu ý về hồ sơ nghiên cứu khoa học (KHKT):**  
> Phần mã nguồn nền tảng phần mềm (`elec-science-ai`) được phát triển và quản trị trên kho `DuyTKTB/Aitk` bởi tác giả chính **Nguyễn Thế Duy**. Đối với hồ sơ, báo cáo và thực nghiệm sư phạm tham dự cuộc thi Khoa học Kỹ thuật (KHKT), vai trò đồng tác giả và giáo viên hướng dẫn được ghi nhận chi tiết theo đúng hồ sơ dự thi (xem `NHAT_KY_NGHIEN_CUU_KHKT_ELEC_AI_THONG_TU_84.md` và `PHIEU_KHAI_BAO_MINH_BACH_AI_THONG_TU_84.md`). Khi tiến hành đăng ký Giấy chứng nhận quyền tác giả chính thức tại cơ quan nhà nước, các bên liên quan cần xác nhận bằng văn bản phạm vi đồng sở hữu (nếu có).

---

## 2. Tài sản thuộc phạm vi bảo hộ

1. **Mã nguồn & Kiến trúc phần mềm** (`src/`, `api/`, `functions/`, `scripts/`, `tests/`), bao gồm các thuật toán cốt lõi tự phát triển:
   * Lõi cân bằng phương trình hóa học chính xác bằng phân số `BigInt` (`src/lib/chemBalance.js`).
   * Lõi công cụ khoa học tất định Lý – Hóa – Sinh & hậu kiểm AI (`src/lib/scientificTools.js`, `src/lib/aiRouter.js`, `src/lib/ai.js`).
   * Động cơ thị giác máy tính chấm phiếu trắc nghiệm A4 OMR trên Canvas thuần (`src/lib/omr.js`).
   * Hệ thống phân tích ma trận đề thi, Radar năng lực, ôn tập SRS và tối ưu danh mục nguyện vọng (`src/lib/`).
2. **Giao diện, thiết kế & tài nguyên thương hiệu:** giao diện ứng dụng web/PWA, bộ ảnh linh vật **ELEC**, bố cục trang thông tin & pháp lý trong `public/`.
3. **Bộ kiểm thử tự động & tài liệu kỹ thuật:** `tests/`, `docs/`, `README.md`.

Các thư viện bên thứ ba được cài đặt thông qua `package.json` giữ nguyên bản quyền và giấy phép gốc của tác giả thư viện đó.

---

## 3. Chứng thực bản quyền bằng Mật mã & Dấu thời gian (Zero-Knowledge Timestamp)

Thư mục [`copyright-proofs/`](./copyright-proofs/) lưu giữ dấu vân tay mật mã (SHA-256) của toàn bộ tệp mã nguồn được theo dõi bởi Git tại từng mốc phát hành:

* `copyright-proofs/MANIFEST-SHA256.txt` — Danh sách mã băm SHA-256 của từng tệp nguồn (tương thích chuẩn `sha256sum -c`).
* `copyright-proofs/COPYRIGHT-PROOF-SUMMARY.json` — Tóm tắt siêu dữ liệu (phiên bản, Git commit `HEAD`, tổng số tệp, **Master SHA-256** của tệp manifest).
* `copyright-proofs/MANIFEST-SHA256.txt.ots` *(lưu sau khi đóng dấu)* — Chứng chỉ dấu thời gian neo trên Blockchain Bitcoin qua **OpenTimestamps**.

### Cách tạo lại dấu vân tay cho bản phát hành mới
```bash
npm run copyright:manifest
```

### Cách kiểm chứng tính toàn vẹn mã nguồn
```bash
node scripts/generate-copyright-manifest.mjs --verify
```

### Cách đóng dấu thời gian miễn phí (không làm lộ mã nguồn)
1. Truy cập **https://opentimestamps.org/** (hoặc cài CLI `opentimestamps-client`).
2. Kéo thả tệp `copyright-proofs/MANIFEST-SHA256.txt` vào mục **Stamp** (trình duyệt chỉ tính mã băm SHA-256 cục bộ, **không tải mã nguồn lên mạng**).
3. Tải tệp bằng chứng `MANIFEST-SHA256.txt.ots` về và lưu ngay vào thư mục `copyright-proofs/`.
4. Đợi khoảng 1–2 giờ để giao dịch xác nhận trong khối Bitcoin, sau đó nâng cấp (Upgrade) tệp `.ots` và lưu giữ cùng bản sao lưu của phiên bản mã nguồn đó (hoặc commit lên GitHub).

---

## 4. Giải thưởng, Ghi nhận & Tư liệu Hình ảnh Bản quyền

* **Giải thưởng chính thức (2026):** **Giải Ba** Cuộc thi *"Học sinh phổ thông với ý tưởng khởi nghiệp" tỉnh Hưng Yên năm 2026* do **Sở Giáo dục và Đào tạo Hưng Yên** trao tặng cho dự án *"Elec AI — Phần mềm trợ lý học tập số môn Hóa học trong trường phổ thông"* (Trường THPT Đông Thụy Anh, ngày 27/11/2026).
* **Ghi nhận truyền thông:** Phỏng vấn trực tiếp tác giả Nguyễn Thế Duy bởi phóng viên **Đài Phát thanh và Truyền hình Hưng Yên (HYTV)** tại khu vực gian trưng bày dự án ELEC AI.
* **Bộ ảnh bản quyền tác giả & giải thưởng chính thức** (`public/img/author/`, lưu trữ công khai và khai báo Schema.org `ImageObject` kèm `copyrightNotice` & `creditText` trên `https://www.elecai.id.vn/nha-sang-lap`):
  1. `public/img/author/nguyen-the-duy-giai-ba-khoi-nghiep-hung-yen-2026.jpg` — Chân dung tác giả Nguyễn Thế Duy nhận Giấy chứng nhận Giải Ba.
  2. `public/img/author/chung-nhan-giai-ba-elec-ai-hung-yen-2026.jpg` — Ảnh cận cảnh Giấy chứng nhận Giải Ba của Sở GD&ĐT Hưng Yên năm 2026.
  3. `public/img/author/nguyen-the-duy-phong-van-hytv-elec-ai-2026.jpg` — Tác giả Nguyễn Thế Duy trả lời phỏng vấn Đài PT&TH Hưng Yên (HYTV).
  4. `public/img/author/elec-ai-thuyet-trinh-ban-giam-khao-hung-yen-2026.jpg` — Nhóm dự án ELEC AI thuyết trình trước Ban giám khảo cuộc thi.
  5. `public/img/author/doi-ngu-elec-ai-san-khau-khoi-nghiep-hung-yen-2026.jpg` — Tập thể tác giả và giáo viên hướng dẫn trên sân khấu chính cuộc thi.
  6. `public/img/author/gian-hang-elec-ai-thpt-dong-thuy-anh-2026.jpg` — Nhóm dự án và linh vật ELEC AI tại gian trưng bày Trường THPT Đông Thụy Anh.

---

## 5. Các lớp công nhận bản quyền bổ sung

* **Xác minh tên miền & công cụ tìm kiếm:** `https://www.elecai.id.vn/` (Google Search Console & Bing Webmaster Tools).
* **Lịch sử phát triển trên bên thứ ba:** GitHub repository `DuyTKTB/Aitk` (khuyến nghị bật ký số commit bằng SSH/GPG để hiển thị nhãn `Verified`).
* **Đăng ký pháp lý chính thức:** Khuyến nghị nộp hồ sơ đăng ký *Quyền tác giả chương trình máy tính* tại **Cục Bản quyền tác giả (Bộ VH-TT-DL Việt Nam)** và lưu trữ phiên bản học thuật kèm mã **DOI** trên **Zenodo**.
