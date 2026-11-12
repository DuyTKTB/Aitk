/* ============================================================
   appGuideKnowledge.js — TRI THỨC ĐIỀU HƯỚNG & HƯỚNG DẪN WEBSITE ELEC AI
   ------------------------------------------------------------
   Giúp ELEC AI trở thành "Thổ địa toàn năng":
   - Nắm rõ 100% chức năng, vị trí `#route`, menu, và cách dùng từng bước.
   - Nhận diện câu hỏi "ở đâu", "sử dụng như thế nào", "làm sao để..."
   - Trả lời thông minh kèm Markdown Link chuyển trang tức thì dạng [Tên](#route).
   - 0 emoji trong mã nguồn — 100% SVG và văn bản chuẩn.
   ============================================================ */

export const APP_FEATURES = [
  {
    id: 'home',
    name: 'Trang chủ',
    route: '#home',
    menuLocation: 'Thanh điều hướng trên cùng (Logo / Nút Trang chủ)',
    keywords: ['trang chu', 'home', 'man hinh chinh', 'tong quan', 'bento'],
    summary: 'Trung tâm học tập với Bento Grid, đếm ngược kỳ thi, hỏi bài tức thì và truy cập nhanh mọi công cụ.',
    howToUse: [
      '1. Truy cập [#home](#home) để xem tổng quan tiến độ học tập và chuỗi ngày học liên tục (Streak).',
      '2. Sử dụng ô hỏi bài nhanh ở đầu trang: Gõ câu hỏi, công thức hoặc tải ảnh bài tập để ELEC AI giải từng bước.',
      '3. Bấm vào linh vật góc dưới để mở Cửa sổ Toàn cảnh 3 cột (Thống kê - Kế hoạch tuần - Chat AI).',
    ],
    tips: 'Nhấn phím tắt Ctrl + K để mở nhanh Command Palette tìm kiếm mọi bài học và công cụ từ Trang chủ.',
  },
  {
    id: 'exam',
    name: 'Phòng thi ảo & Luyện đề',
    route: '#virtual-exams',
    aliases: ['#exam'],
    menuLocation: 'Thanh điều hướng (Nút "Phòng thi ảo" HOT) hoặc Mega menu Công cụ',
    keywords: ['phong thi ao', 'thi thu', 'de thi', 'luyen de', 'omr', 'bam gio', 'cham diem', 'thptqg', 'dgnl', 'hsa', 'tsa'],
    summary: 'Hệ thống luyện thi chuẩn cấu trúc Bộ GD&ĐT với đồng hồ đếm ngược, phiếu trả lời trắc nghiệm OMR số hóa và chấm điểm phân tích bẫy sai tức thì.',
    howToUse: [
      '1. Bấm vào [Phòng thi ảo](#virtual-exams) từ thanh menu trên cùng.',
      '2. Chọn kỳ thi mục tiêu (THPT Quốc gia 2026-2027, Đánh giá năng lực HSA ĐHQGHN, Đánh giá tư duy TSA Bách Khoa).',
      '3. Chọn môn học (Vật lí, Hóa học, Sinh học) và chọn bộ đề phù hợp với trình độ.',
      '4. Làm bài với phiếu OMR số hóa bên phải: Tô đáp án A-B-C-D hoặc nhập số thực cho câu hỏi điền khuyết.',
      '5. Bấm "Nộp bài" để nhận ngay điểm số, phổ điểm so sánh, và tự động lưu các câu sai vào Sổ tay lỗi sai.',
    ],
    tips: 'Học sinh có thể xem lại lời giải chi tiết từng bước và bấm "Cùng AI phân tích câu sai" để hiểu rõ bẫy đề thi.',
  },
  {
    id: 'roadmap',
    name: 'Lộ trình cá nhân hóa',
    route: '#roadmap',
    menuLocation: 'Thanh điều hướng (Nút "Lộ trình") hoặc Mega menu',
    keywords: ['lo trinh', 'roadmap', 'muc tieu', 'nguyen vong', 'diem chuan', 'giai doan', 'elo', 'nang luc'],
    summary: 'Lộ trình ôn thi 3 giai đoạn được cá nhân hóa theo Nguyện vọng đại học (Bách Khoa, Kinh Tế...), đo lường qua hệ thống Elo và radar năng lực.',
    howToUse: [
      '1. Bấm vào [Lộ trình cá nhân hóa](#roadmap) để xem tiến trình học tập của bạn.',
      '2. Thiết lập mục tiêu: Chọn trường đại học và ngành mơ ước để hệ thống tự động tính khoảng cách điểm số.',
      '3. Làm bài kiểm tra năng lực đầu vào 12 câu để hệ sinh thái xác định điểm mạnh và lỗ hổng kiến thức.',
      '4. Học theo 3 giai đoạn: Nền tảng cốt lõi -> Luyện chuyên đề vận dụng cao -> Luyện đề tổng hợp nước rút.',
    ],
    tips: 'Mỗi bài học hoàn thành sẽ cộng điểm Elo và mở khóa huy hiệu năng lực tương ứng.',
  },
  {
    id: 'notebook',
    name: 'Sổ tay lỗi sai thông minh',
    route: '#notebook',
    menuLocation: 'Mega menu Công cụ -> Học tập & Khảo thí -> "Sổ tay lỗi sai"',
    keywords: ['so tay loi sai', 'so loi', 'cau sai', 'on lai', 'khac phuc', 'bay trac nghiem', 'notebook'],
    summary: 'Tự động gom nhặt tất cả các câu hỏi bạn làm sai trong các bài thi thử, phân loại theo môn học và mức độ nhầm lẫn.',
    howToUse: [
      '1. Mở [Sổ tay lỗi sai](#notebook) để rà soát toàn bộ những câu hỏi đã từng làm sai.',
      '2. Lọc câu sai theo môn học (Vật lí / Hóa học / Sinh học) hoặc theo dạng bẫy kiến thức.',
      '3. Bấm "Làm lại câu này" để tự kiểm tra xem đã hiểu bản chất chưa.',
      '4. Nhấn "Nhờ AI giải thích chuyên sâu" để xem phân tích bản chất và công thức tương ứng.',
    ],
    tips: 'Nên dành 15-20 phút mỗi cuối tuần để dọn sạch các câu sai trong sổ, giúp tăng 1-2 điểm thực chiến thi thật.',
  },
  {
    id: 'balance',
    name: 'Cân bằng PTHH thông minh',
    route: '#balance',
    menuLocation: 'Mega menu Công cụ -> Học tập & Khảo thí -> "Cân bằng PTHH"',
    keywords: ['can bang', 'phuong trinh hoa hoc', 'papi', 'hoa hoc', 'balance', 'he so'],
    summary: 'Công cụ cân bằng phương trình hóa học bằng thuật toán ma trận đại số tuyến tính chính xác 100%, hỗ trợ phản ứng oxi hóa - khử phức tạp.',
    howToUse: [
      '1. Truy cập [Cân bằng PTHH](#balance).',
      '2. Nhập phương trình hóa học (Ví dụ: Fe + HNO3 -> Fe(NO3)3 + NO + H2O hoặc KMnO4 + HCl).',
      '3. Bấm nút "Cân bằng" để nhận hệ số nguyên tối giản ngay lập tức.',
      '4. Xem phân tích các bước bảo toàn nguyên tố và quá trình nhường nhận electron.',
    ],
    tips: 'Bạn cũng có thể gõ trực tiếp cú pháp "/canbang <phương trình>" vào ô chat của ELEC AI để nhận kết quả tức thì.',
  },
  {
    id: 'table',
    name: 'Bảng tuần hoàn 118 nguyên tố',
    route: '#table',
    menuLocation: 'Mega menu Công cụ -> Giải trí & Trực quan -> "Bảng tuần hoàn"',
    keywords: ['bang tuan hoan', 'nguyen to', 'periodic table', '118 nguyen to', 'iupac', 'hoa hoc'],
    summary: 'Bảng tuần hoàn tương tác chuẩn IUPAC với đầy đủ 118 nguyên tố hóa học, độ âm điện, cấu hình electron, trạng thái và màu sắc trực quan.',
    howToUse: [
      '1. Mở [Bảng tuần hoàn](#table).',
      '2. Bấm vào bất kỳ ô nguyên tố nào để xem chi tiết: Khối lượng mol, cấu hình e, số oxi hóa, nhiệt độ sôi/nóng chảy.',
      '3. Dùng thanh lọc theo nhóm (Kim loại kiềm, Halogen, Khí hiếm...) hoặc tìm nhanh theo ký hiệu hóa học.',
    ],
    tips: 'Bảng tuần hoàn hỗ trợ phóng to thu nhỏ và chế độ xem 3D xoay vòng electron.',
  },
  {
    id: 'formulas',
    name: 'Tra cứu Công thức KHTN',
    route: '#formulas',
    aliases: ['#study'],
    menuLocation: 'Mega menu Công cụ -> Học tập & Khảo thí -> "Công thức KHTN"',
    keywords: ['cong thuc', 'tra cuu cong thuc', 'ly hoa sinh', 'formulas', 'study'],
    summary: 'Kho công thức chuẩn ma trận THPT Quốc gia cho 3 môn Vật lí, Hóa học và Sinh học, kèm ví dụ mẫu và đơn vị chuẩn.',
    howToUse: [
      '1. Bấm vào [Công thức KHTN](#formulas).',
      '2. Chọn môn học bạn muốn tra cứu: Vật lí, Hóa học hoặc Sinh học.',
      '3. Gõ tên công thức vào ô tìm kiếm (Ví dụ: con lắc đơn, định luật Ôm, este, quang hợp, ADN).',
      '4. Bấm vào công thức để xem giải thích các đại lượng, đơn vị đo và bài tập áp dụng thực tế.',
    ],
    tips: 'Các công thức đều có nút "Copy LaTeX" và nút "Hỏi AI giải bài tương tự".',
  },
  {
    id: 'lab3d',
    name: 'Phòng thí nghiệm 3D Lab',
    route: '#games',
    aliases: ['#lab', '#virtual-lab'],
    menuLocation: 'Mega menu Công cụ -> Giải trí & Trực quan -> "Trò chơi Khoa học" -> Tab Lab 3D',
    keywords: ['3d lab', 'phong thi nghiem', 'ao', 'lab', 'virtual lab', 'thi nghiem hoa hoc'],
    summary: 'Mô phỏng thí nghiệm thực hành 3D tương tác sống động, cho phép học sinh tự tay phối trộn hóa chất, quan sát ngọn lửa, kết tủa và đo đạc an toàn.',
    howToUse: [
      '1. Truy cập [Phòng thí nghiệm 3D Lab](#games).',
      '2. Chọn bài thực hành mô phỏng (ví dụ: điều chế khí oxi, chuẩn độ axit - bazơ, phản ứng tráng bạc).',
      '3. Kéo thả dụng cụ (ống nghiệm, đèn cồn, bình tam giác) và điều chỉnh lượng chất bằng chuột.',
      '4. Quan sát hiện tượng đổi màu, kết tủa hoặc sủi bọt khí trực tiếp theo thời gian thực.',
    ],
    tips: 'Rất hữu ích cho các câu hỏi thực hành thí nghiệm trong đề thi THPT Quốc gia mới!',
  },
  {
    id: 'admission',
    name: 'Tra cứu Điểm chuẩn & Nguyện vọng',
    route: '#admission',
    menuLocation: 'Mega menu Công cụ -> Tiện ích & Hướng nghiệp -> "Tra cứu điểm chuẩn"',
    keywords: ['diem chuan', 'nguyen vong', 'tra cuu', 'xet tuyen', 'dai hoc', 'bach khoa', 'kinh te'],
    summary: 'Cơ sở dữ liệu điểm chuẩn các trường đại học toàn quốc (khối A00, A01, B00, D07...), so sánh với điểm dự đoán của bạn.',
    howToUse: [
      '1. Mở [Tra cứu điểm chuẩn](#admission).',
      '2. Nhập tên trường đại học (Ví dụ: Bách Khoa, Kinh Tế Quốc Dân, Ngoại Thương, Y Hà Nội).',
      '3. Chọn tổ hợp môn để xem xu hướng điểm chuẩn qua các năm gần nhất.',
      '4. Hệ thống sẽ tự động đo "Độ vừa sức" so với kết quả làm bài thi thử hiện tại của bạn.',
    ],
    tips: 'Bạn có thể lưu trường vào danh sách Nguyện vọng ưu tiên để đồng bộ với Lộ trình học tập.',
  },
  {
    id: 'leaderboard',
    name: 'Bảng xếp hạng & Vinh danh',
    route: '#leaderboard',
    menuLocation: 'Mega menu Công cụ -> Tiện ích & Hướng nghiệp -> "Bảng xếp hạng"',
    keywords: ['bang xep hang', 'leaderboard', 'top', 'vinh danh', 'elo', 'streak', 'chuoi ngay'],
    summary: 'Vinh danh các học sinh có điểm Elo cao nhất, chuỗi ngày học bền bỉ nhất và thành tích xuất sắc theo lớp, trường.',
    howToUse: [
      '1. Bấm vào [Bảng xếp hạng](#leaderboard).',
      '2. Chọn tab "Hạng Nền tảng", "Hạng Trường" hoặc "Hạng Lớp".',
      '3. Xem danh sách top học sinh xuất sắc và thứ hạng hiện tại của chính bạn.',
    ],
    tips: 'Làm bài thi thử đạt điểm cao và duy trì chuỗi học mỗi ngày sẽ giúp bạn thăng hạng thần tốc!',
  },
  {
    id: 'profile',
    name: 'Hồ sơ cá nhân & Cài đặt',
    route: '#profile',
    menuLocation: 'Góc trên cùng bên phải (Avatar người dùng -> Hồ sơ cá nhân)',
    keywords: ['ho so', 'profile', 'doi avatar', 'doi ten', 'cai dat', 'thong tin ca nhan'],
    summary: 'Quản lý thông tin tài khoản học sinh, trường lớp, mục tiêu đại học, tùy chọn avatar chuẩn logo TK và xem lịch sử tích lũy.',
    howToUse: [
      '1. Bấm vào Avatar của bạn ở góc phải thanh điều hướng -> Chọn [Hồ sơ cá nhân](#profile).',
      '2. Bấm "Chỉnh sửa thông tin" để cập nhật họ tên, trường THPT, lớp học và khối thi mục tiêu.',
      '3. Tùy chỉnh ảnh đại diện hoặc chọn ảnh chuẩn logo để hiển thị đồng bộ toàn hệ thống.',
      '4. Bấm "Lưu thay đổi" để hệ thống cập nhật tức thì.',
    ],
    tips: 'Thông tin trường lớp chính xác giúp hệ thống xếp hạng bạn vào đúng bảng xếp hạng trường của mình.',
  },
  {
    id: 'classroom',
    name: 'Quản lý Lớp học & Dành cho Giáo viên',
    route: '#classroom',
    aliases: ['#my-classes'],
    menuLocation: 'Thanh điều hướng -> Nút "Quản lý lớp" hoặc Mega menu',
    keywords: ['lop hoc', 'giao vien', 'teacher', 'classroom', 'tao de', 'word', 'docx', 'cham bai'],
    summary: 'Nền tảng dành cho thầy cô: Tạo đề thi trắc nghiệm theo ma trận chuẩn Bộ GD&ĐT, xuất file Word .docx chuyên nghiệp, giao bài và chấm điểm tự động.',
    howToUse: [
      '1. Truy cập [Quản lý lớp học](#classroom) hoặc [Lớp của tôi](#my-classes).',
      '2. Dành cho Học sinh: Nhập mã phòng thi / mã lớp do thầy cô cung cấp để tham gia lớp.',
      '3. Dành cho Giáo viên: Bấm "Tạo đề thi mới", chọn ma trận số lượng câu hỏi nhận biết - thông hiểu - vận dụng, sau đó tải về file Word .docx chuẩn định dạng.',
      '4. Theo dõi bảng điểm và thống kê phổ điểm của toàn bộ học sinh trong lớp theo thời gian thực.',
    ],
    tips: 'File Word xuất ra có sẵn bảng đáp án và lời giải chi tiết, dùng được ngay trên lớp học.',
  },
  {
    id: 'pomodoro',
    name: 'Focus Mode & Đồng hồ Pomodoro',
    route: '#pomodoro',
    menuLocation: 'Cột 2 trong Cửa sổ Toàn cảnh hoặc Mega menu Công cụ -> "Clock Hub"',
    keywords: ['focus mode', 'pomodoro', 'dong ho', 'tap trung', 'nhac lofi', 'clock'],
    summary: 'Phương pháp Pomodoro 25 phút tập trung cao độ kết hợp nhạc sóng não Lofi nhẹ nhàng, giúp tăng 200% hiệu suất ôn thi.',
    howToUse: [
      '1. Bấm vào nút "Bắt đầu 25:00" ở Cột 2 (Kế hoạch tuần) hoặc mở [Clock Hub](#pomodoro).',
      '2. Bật nhạc Lofi khoa học để cách ly tạp âm môi trường.',
      '3. Tập trung hoàn toàn giải quyết nhiệm vụ học tập trong 25 phút.',
      '4. Hết giờ, đồng hồ sẽ phát chuông thông báo để bạn nghỉ ngơi ngắn 5 phút trước khi vào phiên tiếp theo.',
    ],
    tips: 'Bạn có thể thu nhỏ đồng hồ thành bong bóng nổi để vừa làm bài thi vừa canh giờ tập trung.',
  },
  {
    id: 'community_chat',
    name: 'Chat Cộng đồng Realtime',
    route: '#home',
    menuLocation: 'Bong bóng chat xanh tròn ở góc dưới màn hình',
    keywords: ['chat cong dong', 'hoi bai ban be', 'tro chuyen', 'nhom hoc', 'tro ly ai'],
    summary: 'Kênh giao lưu học tập trực tuyến giữa các học sinh toàn quốc, thảo luận bài tập KHTN và nhận sự trợ giúp giải thích từ ELEC AI.',
    howToUse: [
      '1. Bấm vào nút chat xanh tròn ở góc phải dưới màn hình.',
      '2. Chọn phòng chat: "Kênh chung cộng đồng", "Lớp học của tôi" hoặc tab "Trợ lý AI".',
      '3. Gửi câu hỏi, thảo luận bài tập, hoặc gửi công thức hóa học để bạn bè cùng trao đổi.',
      '4. Xem avatar vector sinh động của các bạn cùng khóa và trạng thái hoạt động trực tuyến.',
    ],
    tips: 'Tôn trọng bạn bè và cùng nhau xây dựng văn hóa học tập tích cực, văn minh.',
  },
];

/** Tóm tắt tri thức dùng để nhúng vào System Prompt của AI */
export const APP_GUIDE_KNOWLEDGE_SUMMARY = `BẢN ĐỒ TOÀN BỘ WEBSITE ELEC AI & QUY TẮC ĐIỀU HƯỚNG:
Khi người dùng hỏi bất kỳ chức năng nào "ở đâu", "dùng như thế nào", "cách làm sao", BẮT BUỘC:
1. Nêu rõ chức năng đó nằm ở đâu (kèm link hash markdown [Tên](#route) để người dùng bấm là chuyển màn hình ngay).
2. Hướng dẫn các bước sử dụng ngắn gọn, súc tích (1 - 2 - 3).
3. Nêu 1 mẹo hoặc phím tắt hữu ích.

DANH SÁCH CÁC TRANG & ROUTE CHÍNH:
- Trang chủ: [#home](#home) — Bento Grid, đếm ngược kỳ thi, hỏi bài tức thì bằng OCR/công thức.
- Phòng thi ảo & Luyện đề: [#virtual-exams](#virtual-exams) — Luyện đề chuẩn cấu trúc THPTQG & ĐGNL, phiếu trả lời OMR số hóa, chấm điểm tự động.
- Lộ trình cá nhân hóa: [#roadmap](#roadmap) — Lộ trình 3 giai đoạn theo Nguyện vọng trường đại học, hệ thống điểm Elo và radar năng lực.
- Sổ tay lỗi sai: [#notebook](#notebook) — Tự động lưu câu sai từ đề thi, phân loại theo môn, luyện tập khắc phục bẫy điểm số.
- Cân bằng PTHH: [#balance](#balance) — Cân bằng phương trình hóa học bằng ma trận đại số tuyến tính chính xác 100%.
- Bảng tuần hoàn 118 nguyên tố: [#table](#table) — Bảng tương tác chuẩn IUPAC, chi tiết cấu hình e, độ âm điện.
- Tra cứu công thức KHTN: [#formulas](#formulas) — Kho công thức 3 môn Lý - Hóa - Sinh chuẩn GDPT mới.
- Phòng thí nghiệm 3D Lab: [#games](#games) — Mô phỏng thực hành hóa học, vật lý 3D trực quan.
- Tra cứu điểm chuẩn & Nguyện vọng: [#admission](#admission) — Tra cứu điểm chuẩn đại học toàn quốc khối A00, B00, A01, D07.
- Bảng xếp hạng: [#leaderboard](#leaderboard) — Vinh danh top Elo và chuỗi học tập theo lớp, trường.
- Hồ sơ cá nhân & Đổi avatar: [#profile](#profile) — Cập nhật thông tin học sinh, trường lớp, chỉnh sửa ảnh đại diện.
- Quản lý lớp học & Dành cho Giáo viên: [#classroom](#classroom) — Tạo đề thi xuất file Word .docx chuẩn ma trận, quản trị lớp.
- Đồng hồ Pomodoro & Focus Mode: [#pomodoro](#pomodoro) — 25 phút tập trung kết hợp nhạc Lofi.
- Phím tắt hữu ích: Nhấn Ctrl + K để mở Command Palette tìm kiếm nhanh mọi bài học và công cụ.`;

/** Nhận diện truy vấn hỏi về hướng dẫn sử dụng hoặc tìm chức năng của website */
export function detectAppGuideQuery(query) {
  if (!query) return null;
  const q = String(query).toLowerCase().trim();
  
  // Các từ khóa chỉ hành vi hỏi vị trí hoặc cách dùng
  const isNavQuery =
    q.includes('ở đâu') ||
    q.includes('o dau') ||
    q.includes('cho nao') ||
    q.includes('chỗ nào') ||
    q.includes('tìm ở') ||
    q.includes('tim o') ||
    q.includes('sử dụng như nào') ||
    q.includes('su dung nhu nao') ||
    q.includes('dùng như thế nào') ||
    q.includes('dung nhu the nao') ||
    q.includes('cách dùng') ||
    q.includes('cach dung') ||
    q.includes('hướng dẫn') ||
    q.includes('huong dan') ||
    q.includes('chức năng') ||
    q.includes('tính năng') ||
    q.includes('làm sao để') ||
    q.includes('lam sao de') ||
    q.includes('web có') ||
    q.includes('website có') ||
    q.includes('web nay co');

  // Tìm feature khớp nhất
  let matchedFeature = null;
  let highestScore = 0;

  for (const feat of APP_FEATURES) {
    let score = 0;
    // Khớp tên
    if (q.includes(feat.name.toLowerCase())) score += 10;
    // Khớp từ khóa
    for (const kw of feat.keywords) {
      if (q.includes(kw)) score += 5;
    }
    if (score > highestScore) {
      highestScore = score;
      matchedFeature = feat;
    }
  }

  if (isNavQuery && matchedFeature && highestScore >= 5) {
    return { type: 'specific', feature: matchedFeature };
  }

  // Nếu người dùng chỉ hỏi chung chung "hướng dẫn dùng web", "web có những gì"
  if (
    q.includes('hướng dẫn sử dụng web') ||
    q.includes('huong dan su dung web') ||
    q.includes('hướng dẫn dùng web') ||
    q.includes('web có những chức năng gì') ||
    q.includes('web co nhung chuc nang gi') ||
    q.includes('các chức năng của web') ||
    q.includes('gioi thieu web') ||
    q.includes('giới thiệu web')
  ) {
    return { type: 'general' };
  }

  return null;
}

/** Tạo câu trả lời hướng dẫn chi tiết kèm link điều hướng trực tiếp */
export function findAppGuideAnswer(query) {
  const detected = detectAppGuideQuery(query);
  if (!detected) return null;

  if (detected.type === 'specific' && detected.feature) {
    const f = detected.feature;
    const stepsText = f.howToUse.join('\n');
    return `[HƯỚNG DẪN TÍNH NĂNG: ${f.name.toUpperCase()}]\n\nVị trí trên website:\nChức năng này nằm ở: ${f.menuLocation}. Bạn có thể bấm trực tiếp vào đây để mở: [${f.name}](${f.route})\n\nTổng quan:\n${f.summary}\n\nCách sử dụng từng bước:\n${stepsText}\n\nMẹo hữu ích:\n${f.tips}`;
  }

  if (detected.type === 'general') {
    return `[BẢN ĐỒ CHỨC NĂNG WEBSITE ELEC AI]\n\nChào bạn! ELEC AI là nền tảng học tập và luyện thi KHTN (Vật lí - Hóa học - Sinh học) thông minh toàn diện. Dưới đây là các khu vực chức năng chính bạn có thể bấm vào để trải nghiệm ngay:\n\n1. [Trang chủ](#home): Bento Grid tiến độ, hỏi bài tức thì bằng ảnh OCR và công thức.\n2. [Phòng thi ảo & Luyện đề](#virtual-exams): Thi thử chuẩn cấu trúc Bộ GD&ĐT với phiếu trả lời OMR số hóa và bấm giờ thực chiến.\n3. [Lộ trình cá nhân hóa](#roadmap): Thiết lập nguyện vọng đại học, theo dõi điểm Elo và 3 giai đoạn bứt phá.\n4. [Sổ tay lỗi sai](#notebook): Tự động gom các câu sai sau mỗi lần thi thử để luyện tập lại triệt để.\n5. [Cân bằng PTHH](#balance): Cân bằng phương trình hóa học tự động bằng ma trận đại số tuyến tính.\n6. [Bảng tuần hoàn 118 nguyên tố](#table): Bảng tra cứu tương tác chuẩn IUPAC.\n7. [Tra cứu công thức KHTN](#formulas): Kho công thức cốt lõi Lý - Hóa - Sinh THPT.\n8. [Phòng thí nghiệm 3D Lab](#games): Thực hành thí nghiệm mô phỏng 3D an toàn, sinh động.\n9. [Tra cứu điểm chuẩn đại học](#admission): So sánh điểm thi thử với điểm chuẩn các trường top.\n10. [Hồ sơ cá nhân & Đổi avatar](#profile): Quản lý tài khoản, chỉnh sửa thông tin trường lớp và avatar.\n11. [Quản lý lớp & Dành cho Giáo viên](#classroom): Tạo đề thi xuất file Word .docx chuẩn ma trận Bộ GD&ĐT.\n\nMẹo: Bạn có thể nhấn Ctrl + K bất cứ lúc nào để mở hộp tìm kiếm nhanh mọi bài học và công cụ!`;
  }

  return null;
}
