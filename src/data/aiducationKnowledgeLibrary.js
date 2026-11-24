/* ============================================================
   aiducationKnowledgeLibrary.js — DỮ LIỆU KỆ SÁCH KIẾN THỨC & GIÁO TRÌNH TƯƠNG TÁC
   ------------------------------------------------------------
   Trích xuất đầy đủ từ https://www.aiducation.edu.vn/console/kien-thuc:
   - 8 Tầng kệ sách (Tiers): Được yêu thích nhất, Khoa học Máy tính, Đại học,
     Tiếng Anh, Trung học Phổ thông, Game Development, AI Ứng dụng, Đang biên soạn
   - 14 Chương trình học (Programmes)
   - 85+ Đầu sách & Giáo trình tương tác (Volumes) kèm độ dày gáy sách (chapters),
     màu gáy (accent), mô tả, tags và cấu trúc Phần / Chương chi tiết.
   ============================================================ */

export const KNOWLEDGE_PROGRAMMES = [
  {
    id: 'tieng-anh',
    number: '01',
    title: 'Tiếng Anh',
    tierId: 'tieng-anh',
    route: '/console/kien-thuc/tieng-anh',
    desc: 'Bốn cuốn tiếng Anh phổ thông miễn phí, rồi mười hai cuốn IELTS phía sau',
    tags: 'Từ vựng · Giao tiếp · Đi làm · Nghe · Bốn kỹ năng IELTS',
    accent: '#A96A5B',
  },
  {
    id: 'khoa-hoc-may-tinh',
    number: '02',
    title: 'Khoa học Máy tính',
    tierId: 'khoa-hoc-may-tinh',
    route: '/console/kien-thuc/khoa-hoc-may-tinh',
    desc: 'Từ cổng logic và hệ điều hành lên tới thuật toán và trí tuệ nhân tạo',
    tags: 'Thuật toán · Hệ thống · Mật mã · Cơ sở dữ liệu',
    accent: '#4A7FB8',
  },
  {
    id: 'hoa-hoc',
    number: '03',
    title: 'Hoá học',
    tierId: 'dai-hoc',
    route: '/console/kien-thuc/hoa-hoc',
    desc: 'Giáo trình đại học và phổ thông chuyên sâu: Đại cương, Vô cơ, Hữu cơ & Hoá Dược',
    tags: 'Đại cương · Vô cơ · Hữu cơ · Hoá Dược',
    accent: '#7E6BA6',
  },
  {
    id: 'triet-hoc',
    number: '04',
    title: 'Triết học',
    tierId: 'dai-hoc',
    route: '/console/kien-thuc/triet-hoc',
    desc: 'Duy vật biện chứng & duy vật lịch sử, dựng thành sách tương tác',
    tags: 'Duy vật biện chứng · Duy vật lịch sử',
    accent: '#66699E',
  },
  {
    id: 'dai-hoc',
    number: '05',
    title: 'Đại học',
    tierId: 'dai-hoc',
    route: '/console/kien-thuc/dai-hoc',
    desc: 'Những cuốn mà mọi con số in ra đều được máy kiểm lại',
    tags: 'Xác suất · Trò chơi · Nghịch lý · Phản biện · Ảo giác',
    accent: '#5F5B9E',
  },
  {
    id: 'sinh-hoc',
    number: '06',
    title: 'Sinh học',
    tierId: 'dai-hoc',
    route: '/console/kien-thuc/sinh-hoc',
    desc: 'Sinh học đại cương và thực vật dược cho sinh viên Y–Dược, mỗi quá trình là một mô phỏng',
    tags: 'Tế bào · Năng lượng · Di truyền · Cây thuốc',
    accent: '#4F8A5B',
  },
  {
    id: 'thpt',
    number: '07',
    title: 'Trung học Phổ thông',
    tierId: 'thpt',
    route: '/console/kien-thuc/thpt',
    desc: 'Chương trình phổ thông GDPT 2018 (Toán, Lý, Hóa, Sinh, Anh), dựng thành bài học tương tác',
    tags: 'Toán 10–12 · Vật lí 10–12 · Hoá học 10–12 · Sinh học 10–12 · Tiếng Anh 10–12',
    accent: '#3CA57A',
  },
  {
    id: 'game-development',
    number: '08',
    title: 'Game Development',
    tierId: 'game-development',
    route: '/console/kien-thuc/game-development',
    desc: 'Từ mười phút đầu tiên tới kiến trúc của một game hoàn chỉnh',
    tags: 'Godot · GDScript · Nền tảng 2D · Kiến trúc hệ thống',
    accent: '#5E7F5A',
  },
  {
    id: 'ai-ung-dung',
    number: '09',
    title: 'AI Ứng dụng',
    tierId: 'ai-ung-dung',
    route: '/console/kien-thuc/ai-ung-dung',
    desc: 'Cơ chế phía sau một lời nhắc, và chỗ AI nói dối rất thuyết phục',
    tags: 'Lời nhắc · Ảo giác · Hồ sơ · Bảng tính · Cẩm nang',
    accent: '#2F8189',
  },
  {
    id: 'co-vua',
    number: '10',
    title: 'Cờ Vua',
    tierId: 'sap-ra-mat',
    route: '/console/kien-thuc/co-vua',
    desc: 'Từ luật chơi đến tư duy chiến lược',
    tags: 'Khai cuộc · Chiến thuật · Tàn cuộc',
    accent: '#5B6B7A',
  },
  {
    id: 'am-nhac',
    number: '11',
    title: 'Âm nhạc',
    tierId: 'sap-ra-mat',
    route: '/console/kien-thuc/am-nhac',
    desc: 'Từ cao độ và nhịp đến hoà âm',
    tags: 'Nhịp · Cao độ · Hợp âm',
    accent: '#8E4F63',
  },
  {
    id: 'tieng-trung',
    number: '12',
    title: 'Tiếng Trung',
    tierId: 'sap-ra-mat',
    route: '/console/kien-thuc/tieng-trung',
    desc: 'Cầu Hán–Việt: từ pinyin và thanh điệu tới chữ Hán và từ ghép',
    tags: 'Pinyin · Thanh điệu · Chữ Hán · Từ ghép',
    accent: '#A94E42',
  },
  {
    id: 'bong-da',
    number: '13',
    title: 'Bóng đá',
    tierId: 'sap-ra-mat',
    route: '/console/kien-thuc/bong-da',
    desc: 'Đọc không gian, cấu trúc và giá trị của từng hành động',
    tags: 'Chiến thuật · Dữ liệu · Sân bóng tương tác',
    accent: '#247A59',
  },
  {
    id: 'muoi',
    number: '14',
    title: 'MƯỜI',
    tierId: 'sap-ra-mat',
    route: '/console/kien-thuc/messi',
    desc: 'Vai trò chiến thuật của một cầu thủ qua năm hệ thống',
    tags: 'Chiến thuật · Sơ đồ động · Song ngữ',
    accent: '#69792C',
  },
];

export const KNOWLEDGE_SHELF_TIERS = [
  {
    id: 'duoc-yeu-thich-nhat',
    kicker: 'ĐƯỢC YÊU THÍCH NHẤT',
    label: 'Được yêu thích nhất',
    accent: '#B8894A',
    volumes: [
      { id: 'ngu-phap-ielts', requires: 'ielts', number: '01', title: 'Ngữ Pháp IELTS', desc: 'Gỡ trần 6.0: hai mươi cú nâng câu, tự tay kéo', tags: 'Mệnh đề · Danh hoá · Mạch văn · Band 6 → 7', accent: '#3E5B70', route: '/console/kien-thuc/tieng-anh/ngu-phap-ielts', chapters: 20 },
      { id: 'phat-am-noi-am', number: '02', title: 'Phát Âm & Nối Âm', desc: 'Bạn biết hết từ đó — chúng chỉ đổi hình dạng khi chạm nhau', tags: 'Nối âm · Dạng yếu · Nhịp · Nghe & Nói', accent: '#3E8E8E', route: '/console/kien-thuc/tieng-anh/phat-am-noi-am', chapters: 20 },
      { id: 'cum-dong-tu-ielts', requires: 'ielts', number: '03', title: 'Cụm Động Từ IELTS', desc: 'Thầy Speaking bảo dùng, thầy Writing bảo đừng — bản đồ ở giữa', tags: 'Tách âm · Đại từ · Đăng ký · Cặp Latinh', accent: '#C08A3E', route: '/console/kien-thuc/tieng-anh/cum-dong-tu-ielts', chapters: 12 },
      { id: 'thanh-ngu-ielts', requires: 'ielts', number: '04', title: 'Thành Ngữ IELTS', desc: 'Chín trên năm mươi bảy giữ được hình ảnh — phản xạ dịch tranh sai sáu lần trên bảy', tags: 'Ánh xạ · Bẫy dịch · Đăng ký · Nghe hiểu', accent: '#8A6FA8', route: '/console/kien-thuc/tieng-anh/thanh-ngu-ielts', chapters: 12 },
      { id: 'task-1-ielts', requires: 'ielts', number: '05', title: 'Task 1 IELTS', desc: 'Bạn đã biết plummeted — chưa ai nói số liệu của bạn có cho phép dùng nó', tags: 'Tổng quan · Độ dốc · Bảy dạng đề · Bốn đoạn', accent: '#4A6E8A', route: '/console/kien-thuc/tieng-anh/task-1-ielts', chapters: 16 },
      { id: 'task-2-ielts', requires: 'ielts', number: '06', title: 'Task 2 IELTS', desc: 'Bài band 6 là bài hứa nhiều hơn nó giao — đề hứa ba phần, bài giao hai', tags: 'Bóc đề · Cam kết · Từ nối · Năm dạng đề', accent: '#8A6FA8', route: '/console/kien-thuc/tieng-anh/task-2-ielts', chapters: 18 },
      { id: 'ket-hop-tu-ielts', requires: 'ielts', number: '07', title: 'Kết Hợp Từ IELTS', desc: '*strong rain — ai cũng hiểu, và chưa ai từng sửa bạn', tags: 'Giới từ · make/do · Mức độ · Đếm được', accent: '#B07A3E', route: '/console/kien-thuc/tieng-anh/ket-hop-tu-ielts', chapters: 16 },
      { id: 'nghe-ielts', requires: 'ielts', number: '08', title: 'Nghe IELTS', desc: 'Bạn không trượt vì không nghe được — bạn trượt vì săn từ khoá', tags: 'Bẫy phân tâm · Diễn đạt lại · Đúng định dạng · Bám mạch', accent: '#4E8FA8', route: '/console/kien-thuc/tieng-anh/nghe-ielts', chapters: 18 },
      { id: 'doc-ielts', requires: 'ielts', number: '09', title: 'Đọc IELTS', desc: '“Câu này đúng không” là câu hỏi về thế giới — giám khảo hỏi về văn bản', tags: 'Not Given · Định lượng từ · Quy kết · Đồng hồ', accent: '#5B7B93', route: '/console/kien-thuc/tieng-anh/doc-ielts', chapters: 17 },
      { id: 'noi-part-1', requires: 'ielts', number: '10', title: 'Nói IELTS — Phần 1', desc: '“Yes, I do.” quá ngắn; chín mươi giây học thuộc quá dài', tags: 'Độ dài câu trả lời · Sáu kiểu hỏi · Dấu học thuộc', accent: '#3CA57A', route: '/console/kien-thuc/tieng-anh/noi-part-1', chapters: 18 },
      { id: 'noi-part-2', requires: 'ielts', number: '11', title: 'Nói IELTS — Phần 2', desc: 'Mọi thứ hỏng trong hai phút đã được quyết trong một phút trước đó', tags: 'Ghi neo · Hai phút · Một chuyện · Bốn loại thẻ', accent: '#C08A3E', route: '/console/kien-thuc/tieng-anh/noi-part-2', chapters: 17 },
      { id: 'noi-part-3', requires: 'ielts', number: '12', title: 'Nói IELTS — Phần 3', desc: 'Câu hỏi hỏi về xã hội, câu trả lời nói về mình', tags: 'Có ý ngay · Nhượng bộ rồi bẻ · Câu phức và cái giá', accent: '#8A6FA8', route: '/console/kien-thuc/tieng-anh/noi-part-3', chapters: 18 },
      { id: 'dien-dat-lai', requires: 'ielts', number: '13', title: 'Diễn Đạt Lại IELTS', desc: 'Đề đổi hết chữ — và bạn vẫn phải nhận ra đó là cùng một ý', tags: 'Mười hai phép · Giữ gì · Mồi nhử · Nghe & Đọc', accent: '#6E8B7E', route: '/console/kien-thuc/tieng-anh/dien-dat-lai', chapters: 18 },
    ],
  },
  {
    id: 'khoa-hoc-may-tinh',
    kicker: 'KHOA HỌC MÁY TÍNH',
    label: 'Khoa học Máy tính',
    accent: '#4A7FB8',
    volumes: [
      { id: 'khmt-101', number: '01', title: 'Khoa học Máy tính 101', desc: 'Nhập môn lập trình & tư duy máy tính', tags: 'Cơ bản · Thuật toán · Lập trình', accent: '#4A7FB8', route: '/console/kien-thuc/khoa-hoc-may-tinh/khmt-101', chapters: 19 },
      { id: 'cau-truc-du-lieu', number: '02', title: 'Cấu trúc Dữ liệu', desc: 'Tổ chức dữ liệu & giải thuật nền tảng', tags: 'Mảng · Danh sách · Cây · Đồ thị', accent: '#3CA57A', route: '/console/kien-thuc/khoa-hoc-may-tinh/cau-truc-du-lieu', chapters: 26 },
      { id: 'hoc-sau', number: '03', title: 'Học Sâu', desc: 'Mạng nơ-ron từ một phép nhân đến mô hình lớn', tags: 'Nơ-ron · Gradient · Mạng nhiều lớp', accent: '#E27D5A', route: '/console/kien-thuc/khoa-hoc-may-tinh/hoc-sau', chapters: 19 },
      { id: 'tri-tue-nhan-tao', number: '04', title: 'Trí tuệ Nhân tạo', desc: 'Từ tìm kiếm và suy luận đến tác tử hiện đại', tags: 'Tìm kiếm · Suy luận · Học máy · Tác tử', accent: '#2A7A59', route: '/console/kien-thuc/khoa-hoc-may-tinh/tri-tue-nhan-tao', chapters: 24 },
      { id: 'mat-ma-hoc', number: '05', title: 'Mật mã học Nhập môn', desc: 'Từ mã Caesar tới một cái bắt tay HTTPS, tự tay phá từng lớp', tags: 'Caesar · Vigenère · Diffie–Hellman · RSA · Hàm băm', accent: '#46707F', route: '/console/kien-thuc/khoa-hoc-may-tinh/mat-ma-hoc', chapters: 8 },
      { id: 'nen-du-lieu', number: '06', title: 'Nén Dữ liệu', desc: 'Vì sao một tệp co lại được, và vì sao có một giới hạn không qua nổi', tags: 'RLE · Huffman · LZ77 · Entropy · JPEG', accent: '#57795E', route: '/console/kien-thuc/khoa-hoc-may-tinh/nen-du-lieu', chapters: 8 },
      { id: 'may-tinh-hoat-dong', number: '07', title: 'Máy Tính Hoạt Động Thế Nào', desc: 'Từ một cái công tắc đến một CPU chạy được chương trình bạn viết', tags: 'Transistor · NAND · ALU · Thanh ghi · Tập lệnh', accent: '#96703F', route: '/console/kien-thuc/khoa-hoc-may-tinh/may-tinh-hoat-dong', chapters: 9 },
      { id: 'he-dieu-hanh', number: '08', title: 'Hệ Điều Hành', desc: 'Một CPU, hai mươi chương trình, và ảo giác rằng cái nào cũng có máy riêng', tags: 'Tiến trình · Lập lịch · Khoá chết · Phân trang · Hệ tệp', accent: '#6B5B95', route: '/console/kien-thuc/khoa-hoc-may-tinh/he-dieu-hanh', chapters: 8 },
      { id: 'mang-may-tinh', number: '09', title: 'Mạng Máy Tính', desc: 'Hành trình một gói tin, từ sợi cáp đến cái bắt tay HTTPS', tags: 'Gói tin · Định tuyến · TCP · Tắc nghẽn · DNS', accent: '#A24B52', route: '/console/kien-thuc/khoa-hoc-may-tinh/mang-may-tinh', chapters: 8 },
      { id: 'co-so-du-lieu', number: '10', title: 'Cơ sở Dữ liệu & SQL', desc: 'Vì sao cùng một câu truy vấn chạy nhanh gấp nghìn lần sau một dòng lệnh', tags: 'Bảng · JOIN · B-tree · Kế hoạch · Giao dịch', accent: '#6E8B47', route: '/console/kien-thuc/khoa-hoc-may-tinh/co-so-du-lieu', chapters: 8 },
      { id: 'thiet-ke-he-thong', number: '11', title: 'Thiết kế Hệ thống', desc: 'Mười lăm hệ thống có thật, mổ ra thành thứ bạn vặn được bằng tay', tags: 'Fanout · Băm nhất quán · Kafka · Idempotency · Bầy đàn', accent: '#7A4F6D', route: '/console/kien-thuc/khoa-hoc-may-tinh/thiet-ke-he-thong', chapters: 15 },
    ],
  },
  {
    id: 'dai-hoc',
    kicker: 'ĐẠI HỌC',
    label: 'Đại học',
    accent: '#7E6BA6',
    volumes: [
      { id: 'hoa-dai-cuong-vo-co', number: '01', title: 'Hoá Đại cương — Vô cơ', desc: 'Giáo trình đại học, biên soạn cho sinh viên Dược & Khoa học Tự nhiên', tags: 'Cấu tạo chất · Nhiệt động · Dung dịch · Điện hoá', accent: '#7E6BA6', route: '/console/kien-thuc/hoa-hoc/hoa-dai-cuong-vo-co', chapters: 19, subjectKey: 'hoa' },
      { id: 'hoa-hoc-vo-co', number: '02', title: 'Hoá học Vô cơ', desc: 'Mười bảy chương nguyên tố, dựng lại từ giáo trình in', tags: 'Hydro · Phân nhóm chính · Phân nhóm phụ · Ứng dụng Y Dược', accent: '#2F6E62', route: '/console/kien-thuc/hoa-hoc/hoa-hoc-vo-co', chapters: 17, subjectKey: 'hoa' },
      { id: 'hoa-huu-co', number: '03', title: 'Hoá Hữu Cơ', desc: 'Ba mươi chín chương, mỗi phân tử bấm, xoay và đẩy electron được', tags: 'Cấu trúc · Cơ chế · Nhóm chức · Dị vòng · Hợp chất thiên nhiên', accent: '#3D6E8C', route: '/console/kien-thuc/hoa-hoc/hoa-huu-co', chapters: 40, subjectKey: 'hoa' },
      { id: 'bai-giang-hoa-dai-cuong-duoc', number: '04', title: 'Bài giảng Hoá Đại cương Dược', desc: 'Slide bài giảng của giảng viên (564 slide), xem trực tiếp trong trình duyệt', tags: 'Slide bài giảng · Hoá Đại cương · Sinh viên Dược', accent: '#7E6BA6', route: '/console/kien-thuc/hoa-hoc/bai-giang-hoa-dai-cuong-duoc', chapters: 10, subjectKey: 'hoa' },
      { id: 'triet-hoc', number: '05', title: 'Ôn tập Triết học Mác – Lênin', desc: 'Duy vật biện chứng & duy vật lịch sử, dựng thành 22 chương chạm được', tags: 'Duy vật biện chứng · Duy vật lịch sử · 3 tín chỉ', accent: '#66699E', route: '/console/kien-thuc/triet-hoc', chapters: 22 },
      { id: 'xac-suat-thong-ke', number: '06', title: 'Xác suất & Thống kê', desc: 'Ngẫu nhiên trông như thế nào, và vì sao trực giác đọc sai nó', tags: 'Monty Hall · Bayes · Giới hạn trung tâm · p-hacking', accent: '#3E6E8E', route: '/console/kien-thuc/dai-hoc/xac-suat-thong-ke', chapters: 7 },
      { id: 'ly-thuyet-tro-choi', number: '07', title: 'Lý thuyết Trò chơi', desc: 'Khi kết quả của bạn phụ thuộc vào lựa chọn của người khác', tags: 'Song đề tù nhân · Cân bằng Nash · Đấu giá · Mảnh đất chung', accent: '#8A6A45', route: '/console/kien-thuc/dai-hoc/ly-thuyet-tro-choi', chapters: 7 },
      { id: 'nghich-ly', number: '08', title: 'Nghịch lý', desc: 'Bảy chỗ trực giác gãy, và chỗ nào gãy thì đo được', tags: 'Zeno · Simpson · Braess · Russell · Condorcet', accent: '#5F5B9E', route: '/console/kien-thuc/dai-hoc/nghich-ly', chapters: 7 },
      { id: 'tu-duy-phan-bien', number: '09', title: 'Tư duy Phản biện', desc: 'Tháo một lập luận ra thành từng mảnh, rồi kiểm từng mảnh', tags: 'Tiền đề · Nguỵ biện · Thiên kiến xác nhận · Biến gây nhiễu', accent: '#35705F', route: '/console/kien-thuc/dai-hoc/tu-duy-phan-bien', chapters: 7 },
      { id: 'ao-giac-thi-giac', number: '10', title: 'Ảo giác Thị giác', desc: 'Mắt bạn không đo ánh sáng — nó đoán, và đoán sai một cách có quy luật', tags: 'Điểm mù · Ô cờ trong bóng · Müller-Lyer · Mù thay đổi', accent: '#A9524E', route: '/console/kien-thuc/dai-hoc/ao-giac-thi-giac', chapters: 8 },
      { id: 'sinh-hoc-dai-cuong', number: '11', title: 'Sinh học Đại cương', desc: 'Tế bào, năng lượng, di truyền — mỗi quá trình là một mô phỏng bạn tự điều khiển', tags: 'Tế bào · Enzym · Hô hấp · Quang hợp · ADN · Mendel · Đa dạng sinh học', accent: '#4F8A5B', route: '/console/kien-thuc/sinh-hoc/sinh-hoc-dai-cuong', chapters: 21, subjectKey: 'sinh' },
      { id: 'thuc-vat-duoc', number: '12', title: 'Thực vật Dược', desc: 'Từ tế bào đến cây thuốc, học bằng quan sát và thao tác', tags: 'Tế bào · Giải phẫu · Phân loại · Dược liệu', accent: '#487A51', route: '/console/kien-thuc/sinh-hoc/thuc-vat-duoc', chapters: 13, subjectKey: 'sinh' },
      { id: 'video-hoa-dai-cuong', number: '13', title: 'Video bài giảng Hoá Đại cương', desc: 'Mười chương, chín mươi mốt video ngắn — từ nguyên tử tới điện hoá', tags: 'Nguyên tử · Liên kết · Nhiệt động · Cân bằng · Dung dịch · Điện hoá', accent: '#7E6BA6', route: '/console/kien-thuc/hoa-hoc/video-hoa-dai-cuong', chapters: 10, subjectKey: 'hoa' },
      { id: 'bang-tinh', number: '14', title: 'Bảng tính Excel', desc: 'Làm trên bảng tính thật, chấm trên dữ liệu thay đổi — 10 bài đầu miễn phí', tags: 'Công thức · Thao tác dữ liệu · Dự án văn phòng · Thi thử MOS', accent: '#2F6E62', route: '/console/kien-thuc/dai-hoc/bang-tinh', chapters: 25 },
      { id: 'soan-thao', number: '15', title: 'Soạn thảo Word', desc: 'Làm trên tài liệu thật, chấm theo cấu trúc — 10 bài đầu miễn phí', tags: 'Kiểu và tiêu đề · Mục lục · Bảng · Theo dõi thay đổi · Thi thử MOS', accent: '#2F5496', route: '/console/kien-thuc/dai-hoc/soan-thao', chapters: 18 },
      { id: 'trinh-chieu', number: '16', title: 'Trình chiếu PowerPoint', desc: 'Làm trên bài trình chiếu thật, chấm theo cấu trúc — 10 bài đầu miễn phí', tags: 'Bố cục · Slide Master · Căn chỉnh · Hiệu ứng · Thi thử MOS', accent: '#C55A11', route: '/console/kien-thuc/dai-hoc/trinh-chieu', chapters: 18 },
    ],
  },
  {
    id: 'tieng-anh',
    kicker: 'TIẾNG ANH',
    label: 'Tiếng Anh',
    accent: '#A96A5B',
    volumes: [
      { id: 'tieng-anh-101', number: '01', title: 'Tiếng Anh 101', desc: 'Nhập môn: ngữ pháp lõi & từ vựng nền', tags: 'Ngữ pháp · Từ vựng · Nghe · Nói', accent: '#A96A5B', route: '/console/kien-thuc/tieng-anh/tieng-anh-101', chapters: 20 },
      { id: 'hai-nghin-tu-dau-tien', number: '02', title: 'Hai Nghìn Từ Đầu Tiên', desc: 'Lời hứa ấy có thật — nó chỉ không nói đủ cho việc gì', tags: 'Độ phủ · Thể loại · Lợi tức biên · Danh sách trống', accent: '#3E6F8E', route: '/console/kien-thuc/tieng-anh/hai-nghin-tu-dau-tien', chapters: 8 },
      { id: 'phan-xa-giao-tiep', number: '03', title: 'Phản Xạ Giao Tiếp', desc: 'Bạn không bí từ — bạn trả sàn về cho người ta', tags: 'Lượt lời · Cái móc · Trả sàn · Sửa chữa hội thoại', accent: '#3CA57A', route: '/console/kien-thuc/tieng-anh/phan-xa-giao-tiep', chapters: 8 },
      { id: 'tieng-anh-di-lam', number: '04', title: 'Tiếng Anh Đi Làm', desc: 'Thư của bạn không sai — nó trang trọng lệch một bậc', tags: 'Văn phong · Email · Chat · Bốn vùng', accent: '#8A6FA8', route: '/console/kien-thuc/tieng-anh/tieng-anh-di-lam', chapters: 8 },
      { id: 'nghe-ngoai-phong-thi', number: '05', title: 'Nghe Ngoài Phòng Thi', desc: 'Câu mười một từ tới tai bạn thành bảy khối', tags: 'Nối âm · Dạng yếu · Nuốt âm · Nhịp băng', accent: '#4E8FA8', route: '/console/kien-thuc/tieng-anh/nghe-ngoai-phong-thi', chapters: 8 },
      { id: 'writing-zero-to-hero', number: '06', title: 'IELTS Writing', desc: 'Mười hai bài viết, từ câu đầu tiên tới bài luận Task 2', tags: 'Từ vựng · Ngữ pháp · Task 1 · Task 2 · Video', accent: '#2F3A42', route: '/console/kien-thuc/tieng-anh/writing-zero-to-hero', chapters: 12 },
      { id: 'ielts-speaking-5', number: '07', title: 'IELTS Speaking Band 5.0', desc: 'Mười hai chủ đề nói, từ câu trả lời đầu tiên tới bài thi thử', tags: 'Từ vựng · Ngữ pháp · Phát âm · Part 1–3 · Video', accent: '#2C6E5A', route: '/console/kien-thuc/tieng-anh/ielts-speaking-5', chapters: 12 },
      { id: 'ielts-writing-6', number: '08', title: 'IELTS Writing Band 6.0–7.5', desc: 'Mười chủ đề, mỗi chủ đề một dạng Task 1, một bài luận Task 2 và một đề luyện', tags: 'Task 1 · Task 2 · Ngữ pháp · Đề luyện · Video', accent: '#2C5F6E', route: '/console/kien-thuc/tieng-anh/ielts-writing-6', chapters: 10 },
    ],
  },
  {
    id: 'thpt',
    kicker: 'TRUNG HỌC PHỔ THÔNG',
    label: 'Trung học Phổ thông',
    accent: '#3CA57A',
    volumes: [
      { id: 'toan-lop-10', number: '01', title: 'Toán lớp 10', desc: 'Mệnh đề, tập hợp, vectơ trong mặt phẳng & thống kê mô tả', tags: 'Mệnh đề · Tập hợp · Lượng giác · Vectơ · Thống kê', accent: '#4FB08A', route: '/console/kien-thuc/thpt/toan-lop-10', chapters: 16 },
      { id: 'toan-lop-11', number: '02', title: 'Toán lớp 11', desc: 'Lượng giác, dãy số, quan hệ song song trong không gian & giới hạn', tags: 'Lượng giác · Cấp số · Song song · Giới hạn', accent: '#35896A', route: '/console/kien-thuc/thpt/toan-lop-11', chapters: 17 },
      { id: 'toan-lop-12', number: '03', title: 'Toán lớp 12', desc: 'Đạo hàm, vectơ không gian & thống kê — theo chương trình lớp 12', tags: 'Hàm số · Đồ thị · Vectơ · Toạ độ · Thống kê', accent: '#3CA57A', route: '/console/kien-thuc/thpt/toan-lop-12', chapters: 10 },
      { id: 'vat-ly-10', number: '04', title: 'Vật lí 10', desc: 'Động học, Động lực học Newton, Năng lượng, Động lượng & Chuyển động tròn', tags: 'Động học · Định luật Newton · Bảo toàn · Biến dạng', accent: '#2563EB', route: '/console/kien-thuc/thpt/vat-ly-10', chapters: 14, subjectKey: 'ly', grade: 10 },
      { id: 'vat-ly-11', number: '05', title: 'Vật lí 11', desc: 'Dao động điều hoà, Sóng cơ, Giao thoa ánh sáng, Điện trường & Dòng điện không đổi', tags: 'Dao động · Sóng · Điện trường · Tụ điện · Mạch điện', accent: '#1D4ED8', route: '/console/kien-thuc/thpt/vat-ly-11', chapters: 15, subjectKey: 'ly', grade: 11 },
      { id: 'vat-ly-12', number: '06', title: 'Vật lí 12', desc: 'Vật lí nhiệt, Khí lí tưởng, Từ trường, Cảm ứng điện từ & Vật lí hạt nhân', tags: 'Động học phân tử · Chuyển thể · Nội năng · Từ trường · Hạt nhân', accent: '#3F7EA6', route: '/console/kien-thuc/thpt/vat-ly-12', chapters: 16, subjectKey: 'ly', grade: 12 },
      { id: 'hoa-hoc-10', number: '07', title: 'Hoá học 10', desc: 'Cấu tạo nguyên tử, Bảng tuần hoàn, Liên kết hoá học, Oxi hoá–khử, Enthalpy & Halogen', tags: 'Nguyên tử · Bảng tuần hoàn · Liên kết · Enthalpy · Tốc độ phản ứng · Halogen', accent: '#7C3AED', route: '/console/kien-thuc/thpt/hoa-hoc-10', chapters: 19, subjectKey: 'hoa', grade: 10 },
      { id: 'hoa-hoc-11', number: '08', title: 'Hoá học 11', desc: 'Cân bằng hoá học, pH, Nitrogen–Sulfur, Đại cương Hữu cơ, Hydrocarbon & Dẫn xuất', tags: 'Cân bằng · Chuẩn độ pH · Hữu cơ · Hydrocarbon · Alcohol · Aldehyde · Carboxylic', accent: '#6D28D9', route: '/console/kien-thuc/thpt/hoa-hoc-11', chapters: 18, subjectKey: 'hoa', grade: 11 },
      { id: 'hoa-hoc-12', number: '09', title: 'Hoá học 12', desc: 'Ester–Lipid, Carbohydrate, Amine–Amino Acid–Protein, Polymer, Điện hoá & Kim loại', tags: 'Ester · Carbohydrate · Peptide · Polymer · Thế điện cực · Phức chất', accent: '#5B21B6', route: '/console/kien-thuc/thpt/hoa-hoc-12', chapters: 22, subjectKey: 'hoa', grade: 12 },
      { id: 'sinh-hoc-10', number: '10', title: 'Sinh học 10', desc: 'Thành phần hoá học tế bào, Cấu trúc tế bào, Chuyển hoá năng lượng, Phân bào & Vi sinh vật', tags: 'Tế bào · Enzyme · Hô hấp · Quang hợp · Nguyên phân · Giảm phân · Virus', accent: '#059669', route: '/console/kien-thuc/thpt/sinh-hoc-10', chapters: 15, subjectKey: 'sinh', grade: 10 },
      { id: 'sinh-hoc-11', number: '11', title: 'Sinh học 11', desc: 'Trao đổi chất & Chuyển hoá năng lượng ở Thực vật – Động vật, Cảm ứng, Sinh trưởng & Sinh sản', tags: 'Quang hợp C3/C4/CAM · Tuần hoàn · Miễn dịch · Nội tiết · Sinh sản', accent: '#047857', route: '/console/kien-thuc/thpt/sinh-hoc-11', chapters: 15, subjectKey: 'sinh', grade: 11 },
      { id: 'sinh-hoc-12', number: '12', title: 'Sinh học 12', desc: 'Di truyền phân tử (ADN, Phiên mã, Dịch mã), Quy luật Mendel–Morgan, Di truyền quần thể, Tiến hoá & Sinh thái', tags: 'Operon Lac · Đột biến · Mendel · Hoán vị gen · Hardy–Weinberg · Tiến hoá · Sinh thái', accent: '#065F46', route: '/console/kien-thuc/thpt/sinh-hoc-12', chapters: 20, subjectKey: 'sinh', grade: 12 },
      { id: 'tieng-anh-lop-10', number: '13', title: 'Tiếng Anh lớp 10', desc: 'Chương trình lớp 10, dựng thành unit tương tác', tags: 'Unit 1 · Unit 2 · Nghe · Nói · Đọc · Viết', accent: '#C08A6E', route: '/console/kien-thuc/thpt/tieng-anh-lop-10', chapters: 10 },
      { id: 'tieng-anh-lop-11', number: '14', title: 'Tiếng Anh lớp 11', desc: 'Chương trình lớp 11, dựng thành unit tương tác', tags: 'Unit 1 · Unit 2 · Nghe · Nói · Đọc · Viết', accent: '#A96A5B', route: '/console/kien-thuc/thpt/tieng-anh-lop-11', chapters: 10 },
      { id: 'tieng-anh-lop-12', number: '15', title: 'Tiếng Anh lớp 12', desc: 'Chương trình lớp 12, dựng thành unit tương tác', tags: 'Unit 1 · Unit 2 · Nghe · Nói · Đọc · Viết', accent: '#8E5245', route: '/console/kien-thuc/thpt/tieng-anh-lop-12', chapters: 10 },
    ],
  },
  {
    id: 'game-development',
    kicker: 'GAME DEVELOPMENT',
    label: 'Game Development',
    accent: '#5E7F5A',
    volumes: [
      { id: 'godot-10-phut', number: '01', title: '10 phút đầu tiên', desc: 'Làm một game chạy được, ngay trong trình duyệt, không cài gì', tags: 'Godot · GDScript · Bắt sao · 5 bước', accent: '#3CA57A', route: '/console/kien-thuc/game-development/godot-10-phut', chapters: 5 },
      { id: 'godot-101', number: '02', title: 'Godot 101', desc: 'Trò chơi đầu tiên: từ node đầu tiên tới một link chơi được', tags: 'Node · Signal · Va chạm · Xuất bản web', accent: '#5E7F5A', route: '/console/kien-thuc/game-development/godot-101', chapters: 13 },
      { id: 'godot-102', number: '03', title: 'Godot 102 — 2D thực chiến', desc: 'Làm một platformer có cảm giác điều khiển tử tế, từ đầu đến hết', tags: 'Cảm giác nhảy · Tilemap · Camera · Kẻ địch · Thiết kế màn', accent: '#3CA57A', route: '/console/kien-thuc/game-development/godot-102', chapters: 16 },
      { id: 'godot-103', number: '04', title: 'Godot 103 — Hệ thống trò chơi', desc: 'Kiến trúc game: vì sao phần lớn dự án chết ở giữa chừng, và cách không để nó xảy ra', tags: 'Resource · Event bus · Máy trạng thái · Lưu game · Cân bằng', accent: '#3CA57A', route: '/console/kien-thuc/game-development/godot-103', chapters: 14 },
      { id: 'the-loai-game', number: '05', title: 'Các Thể loại Game', desc: 'Tám thể loại, xếp theo thứ người chơi thật sự làm trong từng giây', tags: 'Phản xạ · Quyết định · Tích luỹ · Vận hành · Suy luận', accent: '#5E7F5A', route: '/console/kien-thuc/game-development/the-loai-game', chapters: 8 },
      { id: 'ly-thuyet-mau-sac', number: '06', title: 'Lý thuyết Màu sắc', desc: 'Từ tế bào nón đến bảng màu của một trò chơi', tags: 'Quang phổ · OKLCh · Tương phản · Grading · Bảng màu game', accent: '#5E7F5A', route: '/console/kien-thuc/game-development/ly-thuyet-mau-sac', chapters: 16 },
      { id: 'phong-cach-nghe-thuat', number: '07', title: 'Phong cách Nghệ thuật', desc: 'Mười cái núm dựng nên mọi phong cách', tags: 'Sản phẩm · Giao diện · Game · Pixel · Cel shading', accent: '#5E7F5A', route: '/console/kien-thuc/game-development/phong-cach-nghe-thuat', chapters: 16 },
    ],
  },
  {
    id: 'ai-ung-dung',
    kicker: 'AI ỨNG DỤNG',
    label: 'AI Ứng dụng',
    accent: '#2F8189',
    volumes: [
      { id: 'noi-chuyen-voi-may', number: '01', title: 'Nói Chuyện Với Máy', desc: 'Cơ chế của một lời nhắc, không phải mẹo', tags: 'Token · Cửa sổ ngữ cảnh · Nhiệt độ · Rubric', accent: '#2F8189', route: '/console/kien-thuc/ai-ung-dung/noi-chuyen-voi-may', chapters: 8 },
      { id: 'doc-so-bang-ai', number: '02', title: 'Đọc Số Bằng AI', desc: 'Từ một bảng số tới một đoạn văn không sai số nào', tags: 'Trung bình · Phần trăm · Biểu đồ · Task 1', accent: '#3E6F8E', route: '/console/kien-thuc/ai-ung-dung/doc-so-bang-ai', chapters: 7 },
      { id: 'ai-cho-ho-so', number: '03', title: 'AI Cho Hồ Sơ', desc: 'CV, thư xin việc và phỏng vấn, chấm bằng luật chứ không bằng cảm tính', tags: 'CV · JD · STAR · Phỏng vấn', accent: '#8A6A4F', route: '/console/kien-thuc/ai-ung-dung/ai-cho-ho-so', chapters: 7 },
      { id: 'ai-noi-doi', number: '04', title: 'AI Nói Dối Như Thế Nào', desc: 'Bịa ở đâu, vì sao nghe rất thật, và kiểm lại bằng cách nào', tags: 'Ảo giác · Trích dẫn ma · Nguồn · Kiểm chứng', accent: '#8E4F63', route: '/console/kien-thuc/ai-ung-dung/ai-noi-doi', chapters: 7 },
      { id: 'ai-cho-nghien-cuu', number: '05', title: 'AI Cho Nghiên Cứu', desc: 'Chỗ nó giúp bạn tìm, và chỗ nó giúp bạn tự lừa mình', tags: 'Recall · Cỡ mẫu · So sánh bội · p-value · Tóm tắt', accent: '#6E7F4F', route: '/console/kien-thuc/ai-ung-dung/ai-cho-nghien-cuu', chapters: 7 },
      { id: 'cam-nang-claude', number: '06', title: 'Cẩm nang Sử dụng Claude', desc: 'Cơ chế phía sau từng nút, và cái nút thì hết hạn', tags: 'Cửa sổ · Project · Trí nhớ · Connector · Model', accent: '#A85C3E', route: '/console/kien-thuc/ai-ung-dung/cam-nang-claude', chapters: 8 },
      { id: 'cam-nang-cowork', number: '07', title: 'Cẩm nang Claude Cowork', desc: 'Bạn thôi đọc từng bước, và mọi thứ khác đổi theo', tags: 'Phiên · Bán kính · Duyệt · Hoàn tác · Lịch chạy', accent: '#4C6B8A', route: '/console/kien-thuc/ai-ung-dung/cam-nang-cowork', chapters: 8 },
      { id: 'ai-trong-workspace', number: '08', title: 'AI Trong Sheets, Docs Và Gmail', desc: 'Không cần mở tab mới — và bốn lời hứa bị phá lặng lẽ', tags: 'Ô AI · Kéo xuống · Kiểu dữ liệu · Thư đến · Giọng văn', accent: '#3F7A5E', route: '/console/kien-thuc/ai-ung-dung/ai-trong-workspace', chapters: 8 },
      { id: 'ai-trong-office', number: '09', title: 'Copilot Trong Excel, Word Và PowerPoint', desc: 'Cấu trúc mới là cỗ máy — và AI vừa đọc vừa viết nó', tags: 'Công thức · Bất định · Style · Placeholder · Tràn chữ', accent: '#7A5C9E', route: '/console/kien-thuc/ai-ung-dung/ai-trong-office', chapters: 8 },
    ],
  },
  {
    id: 'sap-ra-mat',
    kicker: 'ĐANG BIÊN SOẠN',
    label: 'Đang biên soạn',
    accent: '#9A978B',
    volumes: [
      { id: 'co-vua-101', number: '01', title: 'Cờ Vua 101', desc: 'Nhập môn: luật chơi, chiến thuật & thế trận', tags: 'Khai cuộc · Chiến thuật · Tàn cuộc', accent: '#5B6B7A', route: '/console/kien-thuc/co-vua/co-vua-101', chapters: 38 },
      { id: 'am-nhac-101', number: '02', title: 'Âm nhạc 101', desc: 'Nhập môn: nhịp, cao độ & hoà âm', tags: 'Nhịp · Cao độ · Hợp âm', accent: '#8E4F63', route: '/console/kien-thuc/am-nhac/am-nhac-101', chapters: 19 },
      { id: 'dem-hat', number: '03', title: 'Đệm', desc: 'Đệm hát bằng hợp âm, không cần biết nhạc', tags: 'Hợp âm · Điệu · Dịch giọng', accent: '#4F6E8E', route: '/console/kien-thuc/am-nhac/dem-hat', chapters: 19 },
      { id: 'hoa-am', number: '04', title: 'Hòa âm', desc: 'Giáo trình hoà âm bốn bè, chấm bài tự động', tags: 'Bốn bè · Số hiệu bass · Chấm bài', accent: '#6E5A8E', route: '/console/kien-thuc/am-nhac/hoa-am', chapters: 19 },
      { id: 'tieng-trung-101', number: '05', title: 'Tiếng Trung 101', desc: 'Nhập môn: pinyin, thanh điệu & chữ Hán', tags: 'Pinyin · Thanh điệu · Chữ Hán · Cầu Hán-Việt', accent: '#A94E42', route: '/console/kien-thuc/tieng-trung/tieng-trung-101', chapters: 22 },
      { id: 'nghin-chu-dau-tien', number: '06', title: 'Nghìn Chữ Đầu Tiên', desc: 'Từ 226 chữ lên một nghìn, bằng chuỗi thanh phù', tags: 'Thanh phù · Hai kênh đoán âm · Bộ thủ · Chuỗi hỏng', accent: '#C87137', route: '/console/kien-thuc/tieng-trung/nghin-chu-dau-tien', chapters: 17 },
      { id: 'tu-ghep', number: '07', title: 'Từ Ghép', desc: 'Chữ không phải từ — và cây cầu Hán-Việt chỉ đi được một chiều', tags: 'Từ ghép · Cầu một chiều · Bẫy nghĩa · Đường vòng qua Nhật', accent: '#7B6BA8', route: '/console/kien-thuc/tieng-trung/tu-ghep', chapters: 17 },
      { id: 'doc-tran-dau', number: '08', title: 'Đọc Trận Đấu', desc: 'Chiến thuật bóng đá bằng một mặt sân thật sự kéo được', tags: 'Không gian · Kiểm soát sân · Năm câu lạc bộ · Miếng đánh', accent: '#247A59', route: '/console/kien-thuc/bong-da/doc-tran-dau', chapters: 25 },
      { id: 'muoi', number: '09', title: 'MƯỜI', desc: 'Vai trò chiến thuật của Lionel Messi qua năm hệ thống', tags: 'Lionel Messi · Chiến thuật · Sơ đồ động · Song ngữ', accent: '#69792C', route: '/console/kien-thuc/messi', chapters: 15 },
      { id: 'bo-xuong-cau', number: '10', title: 'Bộ Xương Câu', desc: 'Biết cả tám chữ trong câu mà vẫn không dịch được', tags: 'Cắt từ · 43 chiếc khớp · Trật tự · Cầu chở nghĩa không chở việc', accent: '#3F5E78', route: '/console/kien-thuc/tieng-trung/bo-xuong-cau', chapters: 17 },
    ],
  },
];

/* ── Mục lục chi tiết & Nội dung chương chuyên sâu (Chuẩn cấu trúc Aiducation) ── */
export const DETAILED_TEXTBOOK_CURRICULA = {
  'hoa-dai-cuong-vo-co': {
    id: 'hoa-dai-cuong-vo-co',
    categoryLabel: 'Hoá học',
    title: 'Hoá Đại Cương — Vô Cơ',
    metaLine: '10 chương · 3 phần · Tiếng Việt · Bậc đại học & Chuyên THPT',
    authorCard: {
      kicker: 'CHƯƠNG TRÌNH GỐC',
      author: 'Nguyen Thi Ngoc Ha, PhD & Hội đồng Hoá học ELEC AI',
      role: 'Giảng viên, Trường Đại học Dược Hà Nội',
      note: 'Cuốn sách này được biên soạn từ bộ bài giảng 10 chương (564 slide) kết hợp mô phỏng lượng tử và bài tập thực chiến.',
    },
    parts: [
      {
        partNum: 'PHẦN I',
        title: 'Cấu tạo chất',
        desc: 'Nguyên tử, liên kết và phức chất. Vì sao phân tử có hình dạng như vậy, và vì sao hình dạng quyết định tính chất.',
        chapters: [
          {
            num: '01',
            slug: 'cau-tao-nguyen-tu',
            title: 'Cấu tạo nguyên tử',
            enTitle: 'ATOMIC STRUCTURE',
            desc: 'Từ Dalton đến Schrödinger. Ba hạt cơ bản, cơ học lượng tử, bốn số lượng tử và các quy luật biến thiên trong bảng tuần hoàn.',
            linkedChapterId: 'c10-atom',
            objectives: [
              'Trình bày được cấu tạo nguyên tử và các hạt cơ bản (proton, neutron, electron).',
              'Vận dụng được các luận điểm cơ bản của cơ học lượng tử và 4 số lượng tử (n, l, ml, ms).',
              'Viết được cấu hình electron của nguyên tử và ion theo nguyên lý Pauli, Hund, Klechkowski.',
              'Giải thích được quy luật biến đổi bán kính, năng lượng ion hoá I1, ái lực electron và độ âm điện.',
            ],
            mentorQuote: '“Chương này là phần đặt móng cho toàn bộ cuốn sách: cấu hình d sẽ quay lại ở Chương 3 (Phức chất), độ âm điện quay lại ở Chương 2 (Liên kết), và năng lượng ion hoá quay lại ở Chương 10 (Điện hoá học).”',
            sections: [
              {
                heading: 'Hai nghìn năm cho một câu hỏi',
                slideRef: 'Bài 1 · slide 15',
                body: 'Câu hỏi “vật chất được tạo nên từ gì” đã có từ thời Hy Lạp cổ đại với khái niệm atomos (không thể phân chia). Qua thí nghiệm tia âm cực của J.J. Thomson (1897) tìm ra electron, thí nghiệm tán xạ hạt alpha trên lá vàng của Rutherford (1911) phát hiện hạt nhân đặc khít mang điện dương, và mô hình lượng tử hóa quỹ đạo của Niels Bohr (1913), bức tranh nguyên tử dần lộ diện.',
                formula: 'E_n = -\\frac{13{,}6\\text{ eV}}{n^2}, \\quad r_n = n^2 \\cdot 0{,}529\\text{ \\AA}',
              },
              {
                heading: 'Cơ học lượng tử & Bốn số lượng tử (n, l, m_l, m_s)',
                slideRef: 'Bài 1 · slide 38',
                body: 'Electron chuyển động mang lưỡng tính sóng – hạt (De Broglie: λ = h/mv) và tuân theo nguyên lý bất định Heisenberg. Trạng thái của mỗi electron trong nguyên tử được xác định hoàn toàn bởi 4 số lượng tử: số lượng tử chính n (lớp năng lượng), số lượng tử phụ l (hình dạng AO: s, p, d, f), số lượng tử từ m_l (định hướng không gian của AO) và số lượng tử từ spin m_s (+1/2 hoặc -1/2).',
                formula: '\\hat{H}\\Psi = E\\Psi, \\quad l \\in [0, n-1], \\quad m_l \\in [-l, +l], \\quad m_s = \\pm\\frac{1}{2}',
              },
              {
                heading: 'Quy luật biến thiên tuần hoàn: Bán kính, I1 & Độ âm điện',
                slideRef: 'Bài 1 · slide 72',
                body: 'Trong một chu kỳ từ trái sang phải, điện tích hạt nhân hiệu dụng Z* = Z - σ tăng làm bán kính nguyên tử giảm, năng lượng ion hóa thứ nhất (I1) và độ âm điện χ tăng. Lưu ý bẫy đề thi kinh điển: Nhóm IIA (cấu hình bão hòa ns2) có I1 lớn hơn nhóm IIIA (ns2 np1), và nhóm VA (bán bão hòa np3) có I1 lớn hơn nhóm VIA (np4).',
                formula: 'Z^* = Z - \\sigma \\implies I_1(\\text{IIA}) > I_1(\\text{IIIA}), \\quad I_1(\\text{VA}) > I_1(\\text{VIA})',
              },
            ],
          },
          {
            num: '02',
            slug: 'cau-tao-phan-tu',
            title: 'Cấu tạo phân tử',
            enTitle: 'MOLECULAR STRUCTURE',
            desc: 'Liên kết ion, cộng hoá trị và kim loại. Thuyết VB và VSEPR giải thích hình dạng, thuyết MO giải thích năng lượng và từ tính.',
            linkedChapterId: 'c10-bonding',
            objectives: [
              'Phân biệt bản chất năng lượng của liên kết ion, liên kết cộng hoá trị và liên kết kim loại.',
              'Vận dụng thuyết Lai hoá (sp, sp2, sp3, sp3d, sp3d2) và mô hình VSEPR dự đoán hình học phân tử.',
              'Vẽ giản đồ Orbital phân tử (MO) cho các phân tử đồng hạch và dị hạch chu kỳ 2 (O2, N2, CO, NO).',
              'Xác định bậc liên kết, độ bền liên kết và từ tính (thuận từ / nghịch từ) từ cấu hình MO.',
            ],
            mentorQuote: '“Thuyết VB và VSEPR cực mạnh khi bạn cần vẽ nhanh hình dạng 3D của phân tử, nhưng chỉ thuyết MO mới giải thích được vì sao phân tử O2 lại bị nam châm hút (thuận từ với 2 electron độc thân trên π*2p).”',
            sections: [
              {
                heading: 'Mô hình VSEPR & Thuyết Lai hoá Orbital (sp, sp2, sp3)',
                slideRef: 'Bài 2 · slide 24',
                body: 'Theo mô hình VSEPR (AX_nE_m), các cặp electron hoá trị (cả cặp liên kết X và cặp không liên kết E) đẩy nhau sao cho góc liên kết đạt cực đại. Sức đẩy: E-E > E-X > X-X. Ví dụ: CH4 (AX4, sp3, 109.5°), NH3 (AX3E1, sp3, 107.3°), H2O (AX2E2, sp3, 104.5°).',
                formula: '\\text{Tổng số cặp } (n + m) = \\frac{\\text{Số e hoá trị trung tâm} + \\text{Số e góp chung}}{2}',
              },
              {
                heading: 'Thuyết Orbital Phân tử (MO) & Bậc liên kết',
                slideRef: 'Bài 2 · slide 62',
                body: 'Khi hai AO tổ hợp tuyến tính (LCAO), chúng tạo thành 1 MO liên kết (năng lượng thấp) và 1 MO phản liên kết (*) (năng lượng cao). Bậc liên kết càng lớn thì năng lượng liên kết càng lớn và độ dài liên kết càng ngắn.',
                formula: 'N_{\\text{bậc LK}} = \\frac{\\sum e_{\\text{liên kết}} - \\sum e_{\\text{phản liên kết}}^{*}}{2}',
              },
            ],
          },
          {
            num: '03',
            slug: 'phuc-chat',
            title: 'Phức chất',
            enTitle: 'COORDINATION COMPOUNDS',
            desc: 'Ion trung tâm, phối tử, số phối trí. Thuyết trường tinh thể giải thích màu sắc và từ tính của phức.',
            linkedChapterId: 'c12-transition',
            objectives: [
              'Xác định được cầu nội, cầu ngoại, ion trung tâm, phối tử (đơn càng, đa càng) và số phối trí.',
              'Gọi tên phức chất theo danh pháp IUPAC và phân biệt đồng phân hình học cis–trans, đồng phân quang học.',
              'Giải thích sự tách mức năng lượng orbital d trong trường bát diện (Δo) và tứ diện (Δt) theo Thuyết trường tinh thể (CFT).',
              'Ứng dụng phức chất chelat (EDTA, Cisplatin, Hemoglobin, Chlorophyll) trong Y Dược và phân tích định lượng.',
            ],
            mentorQuote: '“Từ chương trình GDPT 2018 mới, Phức chất đã chính thức xuất hiện trong đề thi THPTQG môn Hoá học lớp 12. Nắm chắc chương này giúp bạn ăn trọn cả điểm đại học lẫn câu vận dụng cao THPT!”',
            sections: [
              {
                heading: 'Cấu tạo Phức chất & Hiệu ứng Chelat vòng càng',
                slideRef: 'Bài 3 · slide 14',
                body: 'Phức chất gồm nguyên tử/ion trung tâm (thường là kim loại chuyển tiếp khối d có AO trống) nhận cặp electron từ các phối tử (Ligand) qua liên kết cho – nhận. Phối tử đa càng như EDTA (6 càng) tạo phức vòng càng (chelat) cực bền, dùng giải độc kim loại nặng (Pb2+, Hg2+) và chuẩn độ phức chất.',
                formula: '[\\text{Cu(NH}_3)_4](\\text{OH})_2, \\quad [\\text{Fe(CN)}_6]^{4-}, \\quad \\text{cis}-[\\text{Pt(NH}_3)_2\\text{Cl}_2] \\text{ (Cisplatin)}',
              },
              {
                heading: 'Thuyết Trường Tinh Thể (CFT): Phức Spin cao & Spin thấp',
                slideRef: 'Bài 3 · slide 48',
                body: 'Trong trường bát diện [ML6], 5 orbital d tách thành nhóm t2g (dxy, dyz, dxz — năng lượng thấp) và nhóm eg (dx2-y2, dz2 — năng lượng cao) cách nhau năng lượng tách Δo. Phối tử trường mạnh (CN-, CO) gây tách lớn (Δo > P) tạo phức spin thấp; phối tử trường yếu (I-, Br-, Cl-, F-, H2O) gây tách nhỏ (Δo < P) tạo phức spin cao.',
                formula: '\\Delta_o = h\\nu = \\frac{hc}{\\lambda} \\implies \\text{Màu quan sát là màu phụ của bước sóng hấp thụ } \\lambda',
              },
            ],
          },
          {
            num: '04',
            slug: 'lien-ket-giua-cac-phan-tu',
            title: 'Liên kết giữa các phân tử',
            enTitle: 'INTERMOLECULAR FORCES',
            desc: 'Lực Van der Waals, liên kết hydrogen và tương tác kỵ nước. Vì sao một chất lại có nhiệt độ nóng chảy như vậy.',
            linkedChapterId: 'c10-bonding',
            objectives: [
              'Phân biệt 3 thành phần của lực Van der Waals: định hướng (Keesom), cảm ứng (Debye) và khuếch tán (London).',
              'Giải thích điều kiện hình thành liên kết Hydrogen liên phân tử và nội phân tử.',
              'So sánh nhiệt độ sôi, nhiệt độ nóng chảy và độ tan trong nước của các hợp chất vô cơ – hữu cơ.',
            ],
            mentorQuote: '“Liên kết cộng hoá trị giữ các nguyên tử trong một phân tử, còn lực liên phân tử quyết định phân tử đó là khí, lỏng hay rắn ở nhiệt độ phòng — và quyết định phân tử thuốc có gắn được vào thụ thể protein hay không.”',
            sections: [
              {
                heading: 'Lực Van der Waals & Liên kết Hydrogen',
                slideRef: 'Bài 4 · slide 19',
                body: 'Liên kết Hydrogen hình thành khi nguyên tử H đã liên kết với nguyên tử có độ âm điện lớn (F, O, N) tương tác tĩnh điện với cặp electron chưa liên kết của nguyên tử F, O, N khác. Liên kết hydrogen liên phân tử làm tăng vọt nhiệt độ sôi (H2O sôi ở 100°C so với H2S ở -60°C), còn liên kết hydrogen nội phân tử (như o-nitrophenol) làm giảm nhiệt độ sôi và tăng độ bay hơi theo hơi nước.',
                formula: 'E_{\\text{Van der Waals}} < E_{\\text{Hydrogen}} \\approx 15\\text{–}40\\text{ kJ/mol} \\ll E_{\\text{Cộng hoá trị}}',
              },
            ],
          },
        ],
      },
      {
        partNum: 'PHẦN II',
        title: 'Nhiệt động & Động hoá học',
        desc: 'Phản ứng có tự xảy ra không, xảy ra tới đâu và nhanh chậm thế nào? Mỗi câu hỏi cần một bộ công cụ riêng.',
        chapters: [
          {
            num: '05',
            slug: 'nhiet-dong-hoa-hoc',
            title: 'Nhiệt động hoá học',
            enTitle: 'CHEMICAL THERMODYNAMICS',
            desc: 'Nguyên lý I và II, entanpi, entropi, thế đẳng áp. Chương dài nhất của sách, chia làm hai phần.',
            linkedChapterId: 'c10-energy',
            objectives: [
              'Áp dụng Nguyên lý I Nhiệt động lực học và Định luật Hess tính biến thiên Enthalpy (ΔH) của phản ứng.',
              'Hiểu bản chất thống kê của Entropy (ΔS) và Nguyên lý II Nhiệt động lực học.',
              'Thiết lập và vận dụng hàm Thế đẳng áp Gibbs (ΔG = ΔH - TΔS) để xét chiều tự diễn biến của phản ứng.',
            ],
            mentorQuote: '“Nhiều người nhầm rằng phản ứng toả nhiệt (ΔH < 0) thì luôn tự xảy ra. Không phải! Tiêu chuẩn duy nhất ở áp suất và nhiệt độ không đổi là Thế đẳng áp Gibbs ΔG < 0.”',
            sections: [
              {
                heading: 'Định luật Hess & Chu trình Born–Haber',
                slideRef: 'Bài 5 · slide 28',
                body: 'Hiệu ứng nhiệt của một quá trình hoá học ở P hoặc V không đổi chỉ phụ thuộc vào trạng thái đầu và trạng thái cuối, không phụ thuộc vào các giai đoạn trung gian.',
                formula: '\\Delta_r H^\\circ_{298} = \\sum \\nu_{\\text{sp}} \\Delta_f H^\\circ_{298}(\\text{sp}) - \\sum \\nu_{\\text{cđ}} \\Delta_f H^\\circ_{298}(\\text{cđ})',
              },
              {
                heading: 'Thế đẳng áp Gibbs (ΔG) & Chiều tự diễn biến của phản ứng',
                slideRef: 'Bài 5 · slide 64',
                body: 'Khi ΔG < 0: phản ứng tự xảy ra theo chiều thuận. Khi ΔG = 0: hệ đạt trạng thái cân bằng nhiệt động. Khi ΔG > 0: phản ứng không tự xảy ra theo chiều thuận (tự xảy ra theo chiều nghịch).',
                formula: '\\Delta G = \\Delta H - T\\Delta S, \\quad \\Delta G^\\circ = -RT \\ln K',
              },
            ],
          },
          {
            num: '06',
            slug: 'dong-hoa-hoc',
            title: 'Động hoá học',
            enTitle: 'CHEMICAL KINETICS',
            desc: 'Tốc độ phản ứng, bậc phản ứng, phương trình Arrhenius. Nền tảng của hạn dùng và độ ổn định thuốc.',
            linkedChapterId: 'c10-rate',
            objectives: [
              'Viết được biểu thức định luật tác dụng khối lượng và phân biệt phân tử số với bậc phản ứng.',
              'Thiết lập phương trình động học tích phân và chu kỳ bán huỷ (t1/2) cho phản ứng bậc 0, bậc 1 và bậc 2.',
              'Vận dụng phương trình Arrhenius tính năng lượng hoạt hoá Ea và dự đoán tuổi thọ (hạn dùng t90) của thuốc.',
            ],
            mentorQuote: '“Trong ngành Dược, làm sao biết một viên thuốc có hạn dùng 24 tháng ở 25°C mà không phải chờ đúng 2 năm? Người ta thử nghiệm lão hoá cấp tốc ở 40°C–60°C rồi dùng đúng phương trình Arrhenius của chương này!”',
            sections: [
              {
                heading: 'Phương trình động học bậc 0, bậc 1, bậc 2 & Chu kỳ bán huỷ',
                slideRef: 'Bài 6 · slide 22',
                body: 'Phần lớn quá trình phân huỷ dược chất và phân rã phóng xạ tuân theo động học bậc 1: tốc độ phản ứng tỉ lệ bậc nhất với nồng độ chất phản ứng, và chu kỳ bán huỷ t1/2 không phụ thuộc vào nồng độ ban đầu.',
                formula: 'C_t = C_0 e^{-kt}, \\quad t_{1/2} = \\frac{\\ln 2}{k} = \\frac{0{,}693}{k}, \\quad t_{90} = \\frac{0{,}1054}{k}',
              },
              {
                heading: 'Phương trình Arrhenius & Năng lượng hoạt hoá Ea',
                slideRef: 'Bài 6 · slide 51',
                body: 'Hằng số tốc độ k tăng theo hàm mũ với nhiệt độ tuyệt đối T. Chất xúc tác (và enzyme sinh học) cung cấp một cơ chế phản ứng mới có năng lượng hoạt hoá Ea thấp hơn, làm tốc độ phản ứng tăng hàng triệu lần.',
                formula: 'k = A \\cdot e^{-E_a / (RT)} \\implies \\ln\\frac{k_2}{k_1} = \\frac{E_a}{R}\\left(\\frac{1}{T_1} - \\frac{1}{T_2}\\right)',
              },
            ],
          },
          {
            num: '07',
            slug: 'can-bang-hoa-hoc',
            title: 'Cân bằng hoá học',
            enTitle: 'CHEMICAL EQUILIBRIUM',
            desc: 'Hằng số cân bằng, nguyên lý Le Chatelier và cách nhiệt độ làm dịch chuyển cân bằng theo phương trình van\'t Hoff.',
            linkedChapterId: 'c11-equilibrium',
            objectives: [
              'Thiết lập mối liên hệ giữa các hằng số cân bằng Kp, Kc, Kx và thương số phản ứng Q.',
              'Vận dụng Nguyên lý chuyển dịch cân bằng Le Chatelier khi thay đổi nồng độ, áp suất, nhiệt độ.',
              'Tính sự phụ thuộc của hằng số cân bằng K vào nhiệt độ theo phương trình đẳng áp Van’t Hoff.',
            ],
            mentorQuote: '“Cân bằng hoá học là cân bằng động: tại đó tốc độ phản ứng thuận bằng tốc độ phản ứng nghịch (vt = vn > 0), chứ không phải phản ứng đã dừng lại!”',
            sections: [
              {
                heading: 'Hằng số cân bằng Kp, Kc & Phương trình đẳng áp Van’t Hoff',
                slideRef: 'Bài 7 · slide 18',
                body: 'So sánh thương số phản ứng Q với K giúp biết ngay chiều dịch chuyển: nếu Q < K cân bằng dịch theo chiều thuận; nếu Q > K cân bằng dịch theo chiều nghịch.',
                formula: 'K_p = K_c (RT)^{\\Delta n}, \\quad \\ln\\frac{K_2}{K_1} = \\frac{\\Delta H^\\circ}{R}\\left(\\frac{1}{T_1} - \\frac{1}{T_2}\\right)',
              },
            ],
          },
        ],
      },
      {
        partNum: 'PHẦN III',
        title: 'Dung dịch & Điện hoá',
        desc: 'Hoá học trong nước, môi trường mà gần như mọi thuốc phát huy tác dụng.',
        chapters: [
          {
            num: '08',
            slug: 'dung-dich',
            title: 'Dung dịch',
            enTitle: 'SOLUTIONS',
            desc: 'Nồng độ, độ tan, tính chất tập hợp và giản đồ pha. Áp suất thẩm thấu và dịch truyền đẳng trương.',
            linkedChapterId: 'c11-equilibrium',
            objectives: [
              'Chuyển đổi thành thạo giữa các loại nồng độ: C%, CM, nồng độ molan (Cm), phần mol (x) và đương lượng (CN).',
              'Vận dụng Định luật Raoult về độ giảm áp suất hơi bão hoà, độ tăng nhiệt độ sôi và độ hạ nhiệt độ đông đặc.',
              'Tính áp suất thẩm thấu (π = i·CRT) và điều kiện pha chế dịch truyền đẳng trương với máu (0.9% NaCl).',
            ],
            mentorQuote: '“Vì sao dịch truyền tĩnh mạch phải đẳng trương (π ≈ 7.4 atm ở 37°C)? Nếu truyền dung dịch nhược trương, nước sẽ ồ ạt đi vào làm vỡ hồng cầu (tan máu); nếu ưu trương, hồng cầu sẽ teo lại.”',
            sections: [
              {
                heading: 'Định luật Raoult & Áp suất thẩm thấu Van’t Hoff',
                slideRef: 'Bài 8 · slide 32',
                body: 'Các tính chất tập hợp (Colligative properties) của dung dịch chỉ phụ thuộc vào tổng nồng độ tiểu phân tan mà không phụ thuộc bản chất chất tan.',
                formula: '\\Delta T_s = i \\cdot k_s \\cdot C_m, \\quad \\Delta T_đ = i \\cdot k_đ \\cdot C_m, \\quad \\pi = i \\cdot C_M \\cdot R \\cdot T',
              },
            ],
          },
          {
            num: '09',
            slug: 'dung-dich-dien-ly',
            title: 'Dung dịch điện ly',
            enTitle: 'ELECTROLYTE SOLUTIONS',
            desc: 'pH, hệ đệm, chuẩn độ và tích số tan. Bộ công cụ định lượng dùng hằng ngày trong bào chế và kiểm nghiệm.',
            linkedChapterId: 'c11-equilibrium',
            objectives: [
              'Phân biệt thuyết Acid–Base của Arrhenius, Brønsted–Lowry và Lewis.',
              'Tính pH của dung dịch acid mạnh, base mạnh, đơn acid yếu, đơn base yếu và dung dịch muối thuỷ phân.',
              'Áp dụng phương trình Henderson–Hasselbalch tính pH dung dịch đệm và giải bài toán tích số tan Ks.',
            ],
            mentorQuote: '“Phương trình Henderson–Hasselbalch không chỉ dùng để pha dung dịch đệm trong phòng thí nghiệm, mà còn quyết định bao nhiêu phần trăm phân tử thuốc ở dạng không phân ly để thấm qua màng tế bào!”',
            sections: [
              {
                heading: 'Phương trình Henderson–Hasselbalch & Dung dịch đệm',
                slideRef: 'Bài 9 · slide 44',
                body: 'Hệ đệm (như hệ đệm bicarbonate H2CO3/HCO3- giữ pH máu ổn định ở 7.35–7.45) có khả năng chống lại sự thay đổi pH khi thêm một lượng nhỏ acid mạnh hoặc base mạnh.',
                formula: '\\text{pH} = \\text{p}K_a + \\log\\frac{[\\text{Base liên hợp } A^-]}{[\\text{Acid yếu } HA]}',
              },
            ],
          },
          {
            num: '10',
            slug: 'dien-hoa-hoc',
            title: 'Điện hoá học',
            enTitle: 'ELECTROCHEMISTRY',
            desc: 'Phản ứng oxy hoá khử, thế điện cực, phương trình Nernst. Từ pin điện đến điện cực đo pH.',
            linkedChapterId: 'c12-electrochem',
            objectives: [
              'Mô tả cấu tạo pin Galvani (Anode oxi hoá âm, Cathode khử dương) và tính sức điện động chuẩn E°pin.',
              'Vận dụng phương trình Nernst tính thế điện cực và sức điện động của pin ở nồng độ bất kỳ.',
              'Kết nối mối quan hệ tam giác vàng giữa ΔG°, E°pin và hằng số cân bằng K.',
            ],
            mentorQuote: '“Phương trình Nernst là chiếc cầu nối điện học với hoá học: nhờ nó mà một chiếc điện cực thuỷ tinh nhúng vào dung dịch có thể đọc ngay ra pH trên màn hình điện tử!”',
            sections: [
              {
                heading: 'Thế điện cực chuẩn & Phương trình Nernst',
                slideRef: 'Bài 10 · slide 26',
                body: 'Ở 25°C (298K), thế điện cực phụ thuộc vào nồng độ dạng oxi hoá và dạng khử theo phương trình Nernst.',
                formula: 'E = E^\\circ + \\frac{0{,}0592}{n}\\log\\frac{[\\text{Oxh}]}{[\\text{Kh}]}, \\quad \\Delta G^\\circ = -nFE^\\circ_{\\text{pin}} = -RT\\ln K',
              },
            ],
          },
        ],
      },
    ],
  },
};

/**
 * Tự động sinh cấu trúc giáo trình 3 phần (Parts & Chapters) đầy đủ cho mọi cuốn sách trên kệ
 * nếu cuốn đó chưa có mục lục thủ công trong DETAILED_TEXTBOOK_CURRICULA.
 */
export function getDetailedBookCurriculum(volume) {
  if (!volume) return null;
  if (DETAILED_TEXTBOOK_CURRICULA[volume.id]) {
    return DETAILED_TEXTBOOK_CURRICULA[volume.id];
  }

  const tags = String(volume.tags || 'Cơ bản · Trọng tâm · Thực chiến · Vận dụng cao')
    .split('·')
    .map((t) => t.trim())
    .filter(Boolean);
  const totalChapters = Math.max(4, Number(volume.chapters) || 12);

  const partDefinitions = [
    {
      partNum: 'PHẦN I',
      title: 'Nền tảng & Bản chất cốt lõi',
      desc: `Các khái niệm gốc, mô hình trực quan và quy luật nền tảng của ${volume.title}.`,
    },
    {
      partNum: 'PHẦN II',
      title: 'Cơ chế, Thuật toán & Mô hình hoá',
      desc: `Phân tích sâu từng cơ chế, quy trình giải quyết vấn đề và các bẫy tư duy thường gặp trong ${volume.title}.`,
    },
    {
      partNum: 'PHẦN III',
      title: 'Thực chiến, Ứng dụng & Mở rộng',
      desc: `Tổng hợp bài toán thực tế, đề luyện chuẩn hoá và ứng dụng liên ngành của ${volume.title}.`,
    },
  ];

  let chapterCounter = 1;
  const perPart = Math.min(4, Math.max(2, Math.ceil(Math.min(totalChapters, 10) / 3)));

  const parts = partDefinitions.map((p, pIdx) => {
    const chList = [];
    for (let i = 0; i < perPart; i++) {
      if (chapterCounter > Math.min(totalChapters, 10)) break;
      const numStr = String(chapterCounter).padStart(2, '0');
      const tagTopic = tags[(chapterCounter - 1) % tags.length] || volume.title;
      const nextTag = tags[chapterCounter % tags.length] || 'Chuyên sâu';
      chList.push({
        num: numStr,
        slug: `${volume.id}-ch-${numStr}`,
        title: `Chương ${numStr}: ${tagTopic} & Bản chất ${nextTag}`,
        enTitle: `CHAPTER ${numStr} · ${tagTopic.toUpperCase()}`,
        desc: `${volume.desc}. Đi sâu vào ${tagTopic.toLowerCase()}, phân tích quy luật, công thức trọng tâm và bài tập tương tác.`,
        objectives: [
          `Nắm vững bản chất lý thuyết và mô hình trực quan của chuyên đề ${tagTopic}.`,
          `Phân biệt chính xác các trường hợp biên và bẫy sai lầm phổ biến trong ${tagTopic}.`,
          `Vận dụng quy trình giải nhanh vào bài tập chuẩn hoá của ${volume.title}.`,
          `Liên hệ kiến thức ${tagTopic} với các chương tiếp theo trong lộ trình.`,
        ],
        mentorQuote: `“Đừng học thuộc lòng công thức của ${tagTopic} — hãy nhìn vào cơ chế gốc ở phần đầu chương, mọi hệ quả phía sau sẽ tự khắc sáng tỏ.”`,
        sections: [
          {
            heading: `1. Câu hỏi khởi nguồn & Bản chất của ${tagTopic}`,
            slideRef: `Bài ${chapterCounter} · Mục 1`,
            body: `Trong giáo trình ${volume.title}, chuyên đề "${tagTopic}" đóng vai trò là trụ cột tư duy. Thay vì ghi nhớ máy móc, chúng ta xuất phát từ bài toán thực tế: vì sao quy luật này xuất hiện, giới hạn áp dụng của nó ở đâu, và khi các tham số đầu vào thay đổi thì trạng thái hệ thống dịch chuyển như thế nào.`,
            formula: '',
          },
          {
            heading: `2. Hệ thống Quy tắc, Mô hình & Bẫy tư duy trong ${tagTopic}`,
            slideRef: `Bài ${chapterCounter} · Mục 2`,
            body: `Khi làm việc với ${tagTopic} và ${nextTag}, sai lầm phổ biến nhất của người học là áp dụng công thức khi chưa kiểm tra điều kiện biên. Hãy luôn thực hiện quy trình 3 bước: (1) Xác định hệ quy chiếu / điều kiện chuẩn, (2) Kiểm tra các yếu tố nhiễu, (3) Đối chiếu kết quả với định luật bảo toàn hoặc tiêu chuẩn kiểm chứng.`,
            formula: '',
          },
        ],
      });
      chapterCounter++;
    }
    return {
      ...p,
      chapters: chList,
    };
  }).filter((p) => p.chapters.length > 0);

  return {
    id: volume.id,
    categoryLabel: volume.subjectKey === 'hoa' ? 'Hoá học' : volume.subjectKey === 'ly' ? 'Vật lí' : volume.subjectKey === 'sinh' ? 'Sinh học' : 'Thư viện Kiến thức',
    title: volume.title,
    metaLine: `${volume.chapters} chương · ${parts.length} phần · Tiếng Việt · Giáo trình tương tác`,
    authorCard: {
      kicker: 'CHƯƠNG TRÌNH BIÊN SOẠN',
      author: 'Hội đồng Học thuật ELEC AI & Aiducation',
      role: `Chuyên mục ${volume.tags || volume.title}`,
      note: `Giáo trình tương tác gồm ${volume.chapters} chương. ${volume.desc}.`,
    },
    parts,
  };
}

/**
 * Lấy phẳng toàn bộ danh sách đầu sách từ 8 tầng kệ
 */
export function getAllKnowledgeVolumes() {
  const map = new Map();
  KNOWLEDGE_SHELF_TIERS.forEach((tier) => {
    (tier.volumes || []).forEach((v) => {
      if (!map.has(v.id)) {
        map.set(v.id, { ...v, slug: v.id, tierId: tier.id, tierLabel: tier.label });
      }
    });
  });
  return Array.from(map.values());
}
