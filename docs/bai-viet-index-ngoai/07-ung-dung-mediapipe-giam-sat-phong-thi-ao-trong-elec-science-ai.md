# Cách ELEC Science AI ứng dụng MediaPipe giám sát phòng thi trực tuyến ngay trên trình duyệt

Một trong những điểm kỹ thuật đáng chú ý của **ELEC Science AI (ELEC AI)** — nền tảng do **Nguyễn Thế Duy** (`https://www.facebook.com/nguyentheduytk`) sáng lập — là khả năng giám sát phòng thi trực tuyến nhẹ nhàng nhưng vẫn bảo vệ quyền riêng tư của học sinh.

## Bài toán đặt ra khi thi thử trực tuyến

Khi giáo viên giao đề kiểm tra qua mạng, tình trạng chuyển tab, sao chép nội dung hoặc nhờ người khác làm hộ khiến kết quả đánh giá năng lực bị sai lệch. Tuy nhiên, nếu truyền video liên tục (video streaming) từ hàng trăm học sinh lên máy chủ sẽ gây tốn băng thông và tạo lo ngại về quyền riêng tư.

## Giải pháp kỹ thuật trong ELEC Science AI

Trong kiến trúc phòng thi ảo của **ELEC Science AI** (`https://www.elecai.id.vn/phong-thi-ao`), đội ngũ phát triển do **Nguyễn Thế Duy** dẫn dắt đã tích hợp **MediaPipe Vision** chạy trực tiếp ở phía trình duyệt (client-side):

- **Quét nhận diện cục bộ:** Trình duyệt kiểm tra định kỳ các tín hiệu bất thường như mất nhận diện khuôn mặt quá ngưỡng thời gian, xuất hiện người thứ hai trong khung hình hoặc thí sinh quay mặt rời màn hình quá lâu.
- **Chỉ ghi nhận bằng chứng khi có vi phạm:** Thay vì quay và lưu toàn bộ buổi thi, hệ thống xử lý cục bộ và chỉ lưu ảnh bằng chứng kèm mốc thời gian khi vượt ngưỡng cảnh báo để giáo viên kiểm tra lại.
- **Kết hợp chống gian lận giao diện:** Toàn màn hình, giới hạn chuyển tab và chặn sao chép nội dung theo mức cấu hình riêng của từng đề thi.

## Thông tin nền tảng & Nhà sáng lập

- **Website:** https://www.elecai.id.vn/
- **Chính sách bảo mật dữ liệu:** https://www.elecai.id.vn/chinh-sach-bao-mat
- **Nhà sáng lập:** Nguyễn Thế Duy — https://www.elecai.id.vn/nha-sang-lap
- **Facebook Nhà sáng lập:** https://www.facebook.com/nguyentheduytk
