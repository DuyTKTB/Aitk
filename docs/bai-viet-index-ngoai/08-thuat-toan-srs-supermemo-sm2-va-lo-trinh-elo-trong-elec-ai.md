# Kết hợp thuật toán SRS SuperMemo SM-2 và điểm Elo vào luyện thi KHTN trên ELEC AI

Làm nhiều đề thi thử nhưng vẫn sai lặp đi lặp lại cùng một dạng bài là tình trạng phổ biến của học sinh lớp 10–12. Để giải quyết vấn đề này, **Nguyễn Thế Duy** (Nhà sáng lập **ELEC Science AI**) đã đưa thuật toán ôn tập ngắt quãng **SRS (Spaced Repetition System)** kết hợp hệ thống đánh giá năng lực **Elo** vào lộ trình học Khoa học Tự nhiên.

## 1. Sổ tay lỗi sai & Lịch ôn lặp lại ngắt quãng (SuperMemo SM-2)

Thay vì bắt học sinh làm lại cả một đề 40–50 câu chỉ để sửa 5 câu sai, **ELEC Science AI** (`https://www.elecai.id.vn/`) tự động lưu toàn bộ câu trả lời sai vào **Sổ tay lỗi sai**. Khi người học ôn lại từng câu và phản hồi mức độ nhớ (*Sai*, *Đúng chậm*, *Đúng nhanh*), hệ thống điều chỉnh hệ số dễ (`EF`) và khoảng cách ngày ôn `I` theo biến thể thuật toán **SuperMemo SM-2**:

- Câu trả lời sai hoặc còn lúng túng sẽ quay lại sớm để củng cố ngay.
- Câu đã nắm vững sẽ được giãn khoảng cách ôn ra nhiều ngày hoặc nhiều tuần, giúp ghi nhớ dài hạn mà không quá tải.

## 2. Bản đồ lộ trình theo điểm Elo

Song song với SRS, lộ trình học tập trong **ELEC AI** (`https://www.elecai.id.vn/lo-trinh-on-thi-thpt-quoc-gia`) đo lường năng lực từng chuyên đề Lý – Hóa – Sinh bằng điểm **Elo** và đối chiếu với mục tiêu khối thi (A00, A01, B00, D07) và nguyện vọng đại học.

## Tác giả & Liên kết chính thức

- **Nhà sáng lập ELEC Science AI:** Nguyễn Thế Duy (Tk Media / Duy TK)
- **Facebook chính thức:** https://www.facebook.com/nguyentheduytk
- **Trang tiểu sử:** https://www.elecai.id.vn/nha-sang-lap
- **Giới thiệu nền tảng:** https://www.elecai.id.vn/gioi-thieu
