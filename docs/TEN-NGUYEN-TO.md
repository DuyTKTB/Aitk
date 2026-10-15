# Tên nguyên tố: chuyển sang tiếng Anh

Ứng dụng dùng **tên nguyên tố tiếng Anh** (Hydrogen, Iron, Copper…) thay cho tên tiếng Việt
(Hiđro, Sắt, Đồng) ở mọi nơi hiển thị tên nguyên tố. Tài liệu này ghi lại phạm vi đã đổi,
cách kiểm tra, và những chỗ **cố ý giữ tiếng Việt**.

---

## 1. Đã đổi (273 chỗ, 20 file)

| Nhóm | File | Nội dung |
|---|---|---|
| Dữ liệu gốc (118 nguyên tố) | `data/elements.js` | **bỏ hẳn cột tên tiếng Việt**: RAW còn `symbol,EnglishName,atomicMass`; xoá trường `vietnameseName`; ô tìm kiếm `s` chỉ còn `symbol` + `name` |
| Bộ 24 nguyên tố cho "Nguyên tố của ngày" | `lib/elements.js` | `n: 'Hiđro'` → `n: 'Hydrogen'` (giữ câu `fact` tiếng Việt) |
| Thẻ/kho dữ liệu | `HomePlus.jsx`, `HomeExtras.jsx`, `elementStats.js`, `reactions.js`, `games/LabNotebook.jsx` | tên nguyên tố → tiếng Anh |
| Ngân hàng câu hỏi game | `data/gamePresets.js`, `data/sudokuPuzzles.js`, `games/FlipPuzzleGame.jsx`, `games/MillionaireGame.jsx`, `games/QuizRacingGame.jsx`, `games/TugOfWarGame.jsx`, `games/LuckyWheelGame.jsx` | đáp án/lời giải: `Hiđro` → `Hydrogen`, `Sắt` → `Iron`, dạng `Clo (Cl)` → `Chlorine (Cl)` |
| Giao diện nguyên tố | `ElementCard.jsx`, `ElementModal.jsx`, `CompareBar.jsx`, `PeriodicTable.jsx`, `Quiz.jsx`, `AiPanel.jsx` | đọc `e.name` (tiếng Anh) thay `e.vietnameseName` |
| Đề thi mẫu | `lib/sampleExamsData.js` | dạng `Tên (Ký hiệu)` |
| Trang chủ | `HeroLindy.jsx` | câu hỏi/nhận xét có tên nguyên tố |
| Lớp AI | `lib/aiKnowledge.js`, `lib/aiTools.js`, `lib/chemBalance.js` | ngữ cảnh nền + công cụ + khối lượng mol đều dùng tên tiếng Anh |

Hệ quả cần biết:

- **Ô tìm kiếm bảng tuần hoàn** giờ khớp **tên tiếng Anh** và **ký hiệu** (gõ `iron` hoặc `Fe`).
  Gõ `sắt` sẽ không ra kết quả nữa.
- **Khối lượng mol** hiển thị `Fe — Iron: M = 55.845`, `H — Hydrogen`, …
- AI trả lời dựa trên tên tiếng Anh khi tra nguyên tố.

---

## 2. Cố ý GIỮ tiếng Việt (không đổi)

| Loại | Ví dụ | Vì sao |
|---|---|---|
| Tên chương/mục SGK | `Chương 7: Sắt và hợp chất`, `Nitơ và lưu huỳnh` | là tên chương trong SGK Việt Nam, không phải nhãn nguyên tố |
| Tên hợp chất | `Axit sunfuric`, `Cacbon đioxit`, `Sắt(III) hiđroxit`, `Canxi hiđroxit` | tên hợp chất tiếng Việt (SGK), không phải tên nguyên tố |
| Thuật ngữ quá trình | `Oxi hóa — Khử`, `Hiđro hóa`, `Hiđrocacbon` | là tên phản ứng/khái niệm; nếu thay sẽ thành câu trộn ngôn ngữ |
| Câu văn mô tả/giải thích | `Sắt tan, dung dịch chuyển màu lục nhạt` | câu tiếng Việt hoàn chỉnh |

> Muốn đổi cả nhóm này thì nói — nhưng lưu ý UI sẽ thành "trộn ngôn ngữ" (vừa tiếng Việt vừa tiếng Anh).

---

## 3. Cách kiểm tra lại

Script kiểm tra (không nằm trong repo, chạy từ scratchpad):

```bash
# 1) còn tên nguyên tố dạng chuỗi khớp đúng?
node scan-vi-left.js  "D:/Tải Xuống/app"     # → Còn 0 chỗ
# 2) còn dạng "Tên (Ký hiệu)"?
node name-en-paren.js "D:/Tải Xuống/app"     # → CHẠY THỬ: 0 chỗ
```

Bảng ánh xạ (114 tên) được lấy từ chính `git show HEAD:src/data/elements.js` nên có thể tái sử dụng
bất cứ lúc nào — kể cả sau khi đã xoá cột tiếng Việt khỏi file hiện tại.
