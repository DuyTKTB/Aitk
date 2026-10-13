/* ============================================================
   topicsBySubject.js — Chuyên đề theo môn học
   Dùng cho QuestionBank filter + Form thêm câu hỏi.
   ============================================================ */

export const TOPICS_BY_SUBJECT = {
  'Hóa học': [
    { id: 'cau-tao-nguyen-tu', name: 'Cấu tạo nguyên tử' },
    { id: 'bang-tuan-hoan', name: 'Bảng tuần hoàn & định luật tuần hoàn' },
    { id: 'lien-ket-hoa-hoc', name: 'Liên kết hóa học' },
    { id: 'phan-ung-oxh-khu', name: 'Phản ứng oxi hóa – khử' },
    { id: 'nang-luong-hoa-hoc', name: 'Năng lượng hóa học' },
    { id: 'toc-do-phan-ung', name: 'Tốc độ phản ứng' },
    { id: 'nhom-halogen', name: 'Nhóm halogen' },
    { id: 'can-bang-hoa-hoc', name: 'Cân bằng hóa học' },
    { id: 'nitrogen-sulfur', name: 'Nitrogen & Sulfur' },
    { id: 'dai-cuong-huu-co', name: 'Đại cương hóa học hữu cơ' },
    { id: 'hydrocarbon', name: 'Hydrocarbon' },
    { id: 'dan-xuat-halogen', name: 'Dẫn xuất halogen – alcohol – phenol' },
    { id: 'hop-chat-carbonyl', name: 'Hợp chất carbonyl – carboxylic acid' },
    { id: 'este-lipid', name: 'Ester – lipid' },
    { id: 'amine-amino-protein', name: 'Amine, amino acid, protein' },
    { id: 'polymer', name: 'Polymer' },
    { id: 'pin-dien-phan', name: 'Pin điện & điện phân' },
    { id: 'dai-cuong-kim-loai', name: 'Đại cương về kim loại' },
    { id: 'kim-loai-ia-iia', name: 'Kim loại nhóm IA, IIA & aluminium' },
    { id: 'kim-loai-chuyen-tiep', name: 'Kim loại chuyển tiếp & phức chất' },
    { id: 'hoa-hoc-phat-trien', name: 'Hóa học & phát triển bền vững' },
  ],
  'Toán': [
    { id: 'menh-de-tap-hop', name: 'Mệnh đề & tập hợp' },
    { id: 'ham-so-bac-nhat', name: 'Hàm số bậc nhất & bậc hai' },
    { id: 'phuong-trinh-he-pt', name: 'Phương trình & hệ phương trình' },
    { id: 'bat-dang-thuc', name: 'Bất đẳng thức & bất phương trình' },
    { id: 'luong-giac', name: 'Lượng giác' },
    { id: 'vecto', name: 'Vectơ & tọa độ' },
    { id: 'tich-vo-huong', name: 'Tích vô hướng' },
    { id: 'xac-suat', name: 'Xác suất & thống kê' },
    { id: 'day-so-cap-so', name: 'Dãy số & cấp số' },
    { id: 'gioi-han', name: 'Giới hạn' },
    { id: 'dao-ham', name: 'Đạo hàm' },
    { id: 'khao-sat-ham-so', name: 'Khảo sát hàm số' },
    { id: 'mu-logarit', name: 'Hàm số mũ & logarit' },
    { id: 'nguyen-ham-tich-phan', name: 'Nguyên hàm & tích phân' },
    { id: 'so-phuc', name: 'Số phức' },
    { id: 'hinh-hoc-khong-gian', name: 'Hình học không gian' },
    { id: 'phuong-phap-toa-do', name: 'Phương pháp tọa độ trong không gian' },
    { id: 'hinh-hoc-phang', name: 'Hình học phẳng' },
  ],
  'Vật lí': [
    { id: 'dong-hoc', name: 'Động học chất điểm' },
    { id: 'dong-luc-hoc', name: 'Động lực học chất điểm' },
    { id: 'can-bang-vat-ran', name: 'Cân bằng & chuyển động vật rắn' },
    { id: 'cac-dinh-luat-bao-toan', name: 'Các định luật bảo toàn' },
    { id: 'chuyen-dong-tron', name: 'Chuyển động tròn' },
    { id: 'dao-dong-co', name: 'Dao động cơ' },
    { id: 'song-co', name: 'Sóng cơ & sóng âm' },
    { id: 'dong-dien-xc', name: 'Dòng điện xoay chiều' },
    { id: 'dao-dong-dien-tu', name: 'Dao động & sóng điện từ' },
    { id: 'quang-hoc', name: 'Quang học' },
    { id: 'luong-tu-anh-sang', name: 'Lượng tử ánh sáng' },
    { id: 'hat-nhan-nguyen-tu', name: 'Hạt nhân nguyên tử' },
    { id: 'nhiet-hoc', name: 'Nhiệt học' },
    { id: 'dien-tich-dien-truong', name: 'Điện tích & điện trường' },
  ],
  'Sinh học': [
    { id: 'te-bao-hoc', name: 'Tế bào học' },
    { id: 'sinh-hoc-phan-tu', name: 'Sinh học phân tử' },
    { id: 'di-truyen-hoc', name: 'Di truyền học' },
    { id: 'bien-di-di-truyen', name: 'Biến dị & di truyền' },
    { id: 'ung-dung-di-truyen', name: 'Ứng dụng di truyền học' },
    { id: 'tien-hoa', name: 'Tiến hóa' },
    { id: 'sinh-thai-hoc', name: 'Sinh thái học' },
    { id: 'vi-sinh-vat', name: 'Vi sinh vật' },
    { id: 'thuc-vat', name: 'Sinh lý thực vật' },
    { id: 'dong-vat', name: 'Sinh lý động vật' },
    { id: 'sinh-hoc-co-the', name: 'Sinh học cơ thể' },
  ],
  'Ngữ văn': [
    { id: 'doc-hieu-tho', name: 'Đọc hiểu thơ' },
    { id: 'doc-hieu-truyen', name: 'Đọc hiểu truyện ngắn' },
    { id: 'doc-hieu-ky', name: 'Đọc hiểu ký' },
    { id: 'doc-hieu-van-ban-nl', name: 'Đọc hiểu văn bản nghị luận' },
    { id: 'doc-hieu-van-ban-tt', name: 'Đọc hiểu văn bản thông tin' },
    { id: 'nghi-luan-xh', name: 'Nghị luận xã hội' },
    { id: 'nghi-luan-vh', name: 'Nghị luận văn học' },
    { id: 'phan-tich-tho', name: 'Phân tích thơ' },
    { id: 'phan-tich-nhan-vat', name: 'Phân tích nhân vật' },
    { id: 'tieng-viet', name: 'Tiếng Việt & ngữ pháp' },
  ],
  'Tiếng Anh': [
    { id: 'ngu-phap-co-ban', name: 'Ngữ pháp cơ bản' },
    { id: 'thi-dong-tu', name: 'Các thì động từ' },
    { id: 'cau-bi-dong', name: 'Câu bị động' },
    { id: 'cau-dieu-kien', name: 'Câu điều kiện' },
    { id: 'menh-de-quan-he', name: 'Mệnh đề quan hệ' },
    { id: 'tu-vung-chu-de', name: 'Từ vựng theo chủ đề' },
    { id: 'doc-hieu-doan-van', name: 'Đọc hiểu đoạn văn' },
    { id: 'viet-lai-cau', name: 'Viết lại câu' },
    { id: 'giao-tiep', name: 'Giao tiếp' },
    { id: 'phat-am-trong-am', name: 'Phát âm & trọng âm' },
  ],
  'Lịch sử': [
    { id: 'ls-vn-1945-1975', name: 'Lịch sử Việt Nam 1945-1975' },
    { id: 'ls-vn-1975-nay', name: 'Lịch sử Việt Nam 1975-nay' },
    { id: 'ls-the-gioi-hien-dai', name: 'Lịch sử thế giới hiện đại' },
    { id: 'chien-tranh-lanh', name: 'Chiến tranh lạnh' },
    { id: 'cach-mang-thang-10', name: 'Cách mạng tháng Mười Nga' },
    { id: 'ls-vn-co-dai', name: 'Lịch sử Việt Nam cổ - trung đại' },
    { id: 'ls-vn-can-dai', name: 'Lịch sử Việt Nam cận đại' },
  ],
  'Địa lí': [
    { id: 'dia-ly-tu-nhien-vn', name: 'Địa lý tự nhiên Việt Nam' },
    { id: 'dia-ly-dan-cu', name: 'Địa lý dân cư' },
    { id: 'dia-ly-kinh-te', name: 'Địa lý kinh tế - xã hội' },
    { id: 'dia-ly-vung-mien', name: 'Địa lý các vùng miền' },
    { id: 'bien-dao', name: 'Biển đảo Việt Nam' },
    { id: 'dia-ly-the-gioi', name: 'Địa lý thế giới' },
    { id: 'ban-do-atlat', name: 'Kỹ năng bản đồ - Atlat' },
  ],
  'GDCD': [
    { id: 'quyen-cong-dan', name: 'Quyền & nghĩa vụ công dân' },
    { id: 'phap-luat', name: 'Pháp luật & đời sống' },
    { id: 'dao-duc', name: 'Đạo đức & lối sống' },
    { id: 'kinh-te', name: 'Kinh tế & hội nhập' },
    { id: 'cong-dan-toan-cau', name: 'Công dân toàn cầu' },
  ],
  'Tin học': [
    { id: 'python', name: 'Python cơ bản' },
    { id: 'thuat-toan', name: 'Thuật toán' },
    { id: 'cau-truc-du-lieu', name: 'Cấu trúc dữ liệu' },
    { id: 'co-so-du-lieu', name: 'Cơ sở dữ liệu' },
    { id: 'mang-may-tinh', name: 'Mạng máy tính' },
    { id: 'html-css', name: 'HTML & CSS' },
  ],
  'Công nghệ': [
    { id: 'trong-trot', name: 'Công nghệ trồng trọt' },
    { id: 'chan-nuoi', name: 'Công nghệ chăn nuôi' },
    { id: 'lam-nghiep', name: 'Lâm nghiệp' },
    { id: 'thuy-san', name: 'Thủy sản' },
    { id: 'co-khi', name: 'Cơ khí & chế tạo' },
    { id: 'dien-dien-tu', name: 'Điện - Điện tử' },
  ],
  'KHTN': [
    { id: 'chat-bien-doi', name: 'Chất & sự biến đổi chất' },
    { id: 'vat-chat-nang-luong', name: 'Vật chất & năng lượng' },
    { id: 'luc-chuyen-dong', name: 'Lực & chuyển động' },
    { id: 'nang-luong', name: 'Năng lượng' },
    { id: 'te-bao', name: 'Tế bào' },
    { id: 'co-the-sinh-vat', name: 'Cơ thể sinh vật' },
    { id: 'trai-dat', name: 'Trái Đất & bầu trời' },
  ],
};

/* ============ HELPERS ============ */
export const getTopicsForSubject = (subject) => {
  if (!subject) {
    // Trả về tất cả chuyên đề (dùng cho filter "Tất cả môn")
    const all = [];
    Object.entries(TOPICS_BY_SUBJECT).forEach(([subj, topics]) => {
      topics.forEach((t) => all.push({ ...t, subject: subj }));
    });
    return all;
  }
  return TOPICS_BY_SUBJECT[subject] || [];
};

export const getTopicName = (topicId, subject) => {
  if (subject) {
    const list = TOPICS_BY_SUBJECT[subject] || [];
    const found = list.find((t) => t.id === topicId);
    if (found) return found.name;
  }
  // Tìm tất cả môn
  for (const list of Object.values(TOPICS_BY_SUBJECT)) {
    const found = list.find((t) => t.id === topicId);
    if (found) return found.name;
  }
  return topicId;
};

export const ALL_SUBJECTS_LIST = [
  'Hóa học', 'Toán', 'Vật lí', 'Sinh học', 'Ngữ văn', 'Tiếng Anh',
  'Lịch sử', 'Địa lí', 'GDCD', 'Tin học', 'Công nghệ', 'KHTN',
];