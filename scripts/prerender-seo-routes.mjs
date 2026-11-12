/**
 * scripts/prerender-seo-routes.mjs
 * ------------------------------------------------------------
 * Post-build SEO static HTML generator for public ELEC Science AI routes.
 * Reads the compiled `dist/index.html` and emits `dist/<slug>.html` for each
 * public route in `sitemap.xml` with route-specific <title>, <meta>,
 * canonical URL, Open Graph, Twitter Card, JSON-LD, and semantic static HTML
 * inside `<div id="root">` so search bots and AI crawlers see unique content
 * immediately before React hydrates.
 */
import fs from 'node:fs';
import path from 'node:path';

const SITE_ORIGIN = 'https://www.elecai.id.vn';
const DIST_DIR = path.resolve(process.cwd(), 'dist');
const INDEX_PATH = path.join(DIST_DIR, 'index.html');

const FOUNDER_PERSON_LD = {
  '@type': 'Person',
  '@id': `${SITE_ORIGIN}/#founder`,
  name: 'Nguyễn Thế Duy',
  alternateName: ['Nguyen The Duy', 'Duy TK', 'Tk Media', 'nguyentheduytk'],
  url: `${SITE_ORIGIN}/nha-sang-lap`,
  sameAs: [
    'https://www.facebook.com/nguyentheduytk',
    'https://nguyenduytk.vercel.app/',
    'https://www.behance.net/nguynnguyn583',
    'https://www.instagram.com/nguyenduytkmedia',
    'https://tiktok.com/@nguyenduytk01',
    'https://photobothne.io.vn/',
  ],
};

const SEO_ROUTES = [
  {
    slug: 'tro-ly-ai-giai-hoa',
    label: 'Trợ lý AI giải KHTN',
    title: 'Trợ Lý AI Giải Lý Hóa Sinh Từng Bước Từ Ảnh · ELEC AI',
    description:
      'Gia sư AI KHTN thông minh của ELEC Science AI: giải bài từ ảnh chụp đề Vật lí, Hóa học, Sinh học theo 6 chế độ học, giải thích bản chất và công thức từng bước.',
    h1: 'Trợ Lý AI Giải Bài Tập Vật Lí — Hóa Học — Sinh Học Từng Bước',
    intro:
      'Học sinh có thể gõ câu hỏi, nhập công thức hoặc tải lên tới 10 ảnh đề bài để Trợ lý AI của ELEC Science AI (sáng lập bởi Nguyễn Thế Duy) phân tích hiện tượng, tính toán chính xác bằng công cụ khoa học tích hợp và trình bày lời giải chi tiết bằng KaTeX.',
    highlights: [
      '6 chế độ sư phạm: Tự động, Giải chi tiết, Gợi ý từng bước (không lộ đáp án ngay), Kiểm tra đáp án, Ôn lý thuyết, Tạo bài tương tự.',
      'Hỗ trợ đầy đủ 3 môn Khoa học Tự nhiên lớp 10, 11, 12 và Đại học theo chương trình GDPT 2018.',
      'Kết hợp công cụ tính khối lượng mol, cân bằng PTHH đại số tuyến tính và máy tính khoa học để giảm sai số.',
    ],
    faqQ: 'Trợ lý AI của ELEC Science AI giải được những môn nào?',
    faqA: 'Trợ lý AI hỗ trợ giải bài tập từng bước từ văn bản hoặc ảnh chụp cho cả 3 môn Vật lí, Hóa học và Sinh học theo chương trình GDPT 2018.',
  },
  {
    slug: 'phong-thi-ao',
    label: 'Phòng thi ảo THPTQG & ĐGNL',
    title: 'Phòng Thi Ảo THPTQG & ĐGNL Lý Hóa Sinh 2026 · ELEC AI',
    description:
      'Luyện đề thi thử tốt nghiệp THPT và ĐGNL (HSA, TSA, V-ACT) các môn Vật lí, Hóa học, Sinh học bấm giờ thật, cấu trúc 3 phần mới kèm lời giải chi tiết.',
    h1: 'Phòng Thi Ảo THPT Quốc Gia & Đánh Giá Năng Lực (HSA, TSA, V-ACT)',
    intro:
      'Mô phỏng áp lực phòng thi thật với cấu trúc đề chuẩn 3 phần mới của Bộ GD&ĐT (Trắc nghiệm nhiều lựa chọn, Đúng/Sai, Trả lời ngắn), phiếu OMR số hóa và tự động lưu câu làm sai vào sổ ôn tập SRS.',
    highlights: [
      'Đồng hồ bấm giờ thực, tự động chấm điểm và thống kê độ chính xác theo từng chuyên đề.',
      'Phân khu đề thi miễn phí và chuyên sâu cho Vật lí, Hóa học, Sinh học và bài thi KHTN tổng hợp.',
      'Hỗ trợ giám sát phòng thi trực tuyến bằng MediaPipe khi giáo viên giao đề kiểm tra cho lớp.',
    ],
    faqQ: 'Phòng thi ảo ELEC AI có bám sát cấu trúc đề thi mới 2026 không?',
    faqA: 'Có. Đề thi trong Phòng thi ảo được thiết kế theo cấu trúc 3 phần mới của Bộ GD&ĐT và format các kỳ thi ĐGNL HSA, TSA, V-ACT.',
  },
  {
    slug: 'bang-tuan-hoan',
    label: 'Bảng tuần hoàn 118 nguyên tố',
    title: 'Bảng Tuần Hoàn Hóa Học 118 Nguyên Tố IUPAC · ELEC AI',
    description:
      'Bảng tuần hoàn hóa học trực tuyến 118 nguyên tố chuẩn IUPAC: tra cứu cấu hình electron, độ âm điện, khối lượng nguyên tử, bán kính và so sánh tính chất.',
    h1: 'Bảng Tuần Hoàn 118 Nguyên Tố Hóa Học Tương Tác Chuẩn IUPAC',
    intro:
      'Tra cứu nhanh số hiệu nguyên tử, nguyên tử khối, cấu hình electron, độ âm điện, số oxi hóa và tính chất hóa học đặc trưng của toàn bộ 118 nguyên tố ngay trên trình duyệt.',
    highlights: [
      'Lọc nhanh theo nhóm kim loại kiềm, kiềm thổ, halogen, khí hiếm, kim loại chuyển tiếp, phi kim.',
      'So sánh trực quan tính chất giữa hai nguyên tố và xem mô phỏng lớp vỏ electron.',
      'Sử dụng miễn phí 100% trên cả máy tính và điện thoại.',
    ],
    faqQ: 'Bảng tuần hoàn trên ELEC AI có đủ 118 nguyên tố mới nhất không?',
    faqA: 'Có. Bảng tuần hoàn cập nhật đầy đủ 118 nguyên tố theo danh pháp và dữ liệu chuẩn IUPAC mới nhất.',
  },
  {
    slug: 'can-bang-phuong-trinh-hoa-hoc',
    label: 'Cân bằng phương trình Hóa học',
    title: 'Cân Bằng Phương Trình Hóa Học Tự Động Online · ELEC AI',
    description:
      'Máy cân bằng phương trình hóa học (PTHH) bằng đại số tuyến tính chính xác cao, chỉ rõ chất oxi hóa, chất khử và quá trình oxi hóa khử.',
    h1: 'Máy Cân Bằng Phương Trình Hóa Học (PTHH) Bằng Đại Số Tuyến Tính',
    intro:
      'Cân bằng tự động từ phản ứng cơ bản đến phản ứng oxi hóa – khử phức tạp chỉ trong tích tắc với thuật toán ma trận đại số tuyến tính chính xác tuyệt đối.',
    highlights: [
      'Xác định rõ hệ số nguyên tối giản, chất khử, chất oxi hóa và quá trình nhường nhận electron.',
      'Hỗ trợ nhiều phương trình nâng cao vô cơ và hữu cơ trong chương trình THPT.',
      'Miễn phí không giới hạn lượt tra cứu.',
    ],
    faqQ: 'Máy cân bằng PTHH của ELEC AI xử lý được phản ứng oxi hóa – khử khó không?',
    faqA: 'Có. Công cụ dùng thuật toán ma trận đại số tuyến tính nên cân bằng chính xác cả các phản ứng oxi hóa – khử nhiều ẩn và môi trường axit/bazơ.',
  },
  {
    slug: 'lo-trinh-on-thi-thpt-quoc-gia',
    label: 'Lộ trình ôn thi KHTN',
    title: 'Lộ Trình Ôn Thi KHTN Lý Hóa Sinh GDPT 2018 · ELEC AI',
    description:
      'Lộ trình kiến thức cá nhân hóa theo điểm Elo và nguyện vọng đại học khối A00, B00, A01, D07 (Bách Khoa, Kinh Tế Quốc Dân, Y Hà Nội, Ngoại Thương).',
    h1: 'Lộ Trình Ôn Thi KHTN & THPT Quốc Gia Cá Nhân Hóa Theo Điểm Elo',
    intro:
      'Xây dựng kế hoạch ôn tập Vật lí, Hóa học, Sinh học theo 3 giai đoạn dựa trên bài kiểm tra năng lực đầu vào, điểm Elo từng chuyên đề và trường đại học mục tiêu.',
    highlights: [
      'Theo dõi mức độ thành thạo theo từng chương lớp 10, 11, 12 theo GDPT 2018.',
      'Tự động phát hiện lỗ hổng kiến thức và gợi ý bài học tiếp theo phù hợp mục tiêu điểm số.',
      'Kết nối trực tiếp với Sổ tay lỗi sai SRS để giữ vững kiến thức lâu dài.',
    ],
    faqQ: 'Lộ trình ôn thi trên ELEC AI tính theo tiêu chí nào?',
    faqA: 'Lộ trình được cá nhân hóa dựa trên năng lực thực tế qua điểm Elo từng chuyên đề, kết hợp với tổ hợp xét tuyển và điểm chuẩn mục tiêu của học sinh.',
  },
  {
    slug: 'cong-thuc-hoa-hoc',
    label: 'Sổ tay công thức KHTN',
    title: 'Sổ Tay Công Thức Lý Hóa Sinh Đầy Đủ Nhất · ELEC AI',
    description:
      'Tổng hợp công thức KHTN trọng tâm: dao động, sóng, điện xoay chiều (Vật lí); tính mol, pH, dung dịch (Hóa học); ADN, gen, di truyền (Sinh học).',
    h1: 'Sổ Tay Công Thức Khoa Học Tự Nhiên (Vật Lí — Hóa Học — Sinh Học)',
    intro:
      'Kho tra cứu công thức cốt lõi cho 3 môn Vật lí, Hóa học và Sinh học kèm ý nghĩa đại lượng, đơn vị đo chuẩn và máy tính khoa học áp dụng trực tiếp.',
    highlights: [
      'Vật lí: Động học, Dao động điều hòa, Sóng cơ, Mạch RLC, Vật lí nhiệt, Hạt nhân.',
      'Hóa học: Số mol, nồng độ, pH, pin điện – điện phân, este – cacbohidrat – amin.',
      'Sinh học: Cấu trúc ADN, phiên mã, dịch mã, quy luật Menđen, di truyền quần thể.',
    ],
    faqQ: 'Sổ tay công thức trên ELEC AI có kèm máy tính giải nhanh không?',
    faqA: 'Có. Bên cạnh bảng công thức chuẩn LaTeX/KaTeX, người học có thể nhập số liệu vào máy tính chuyên đề để tính nhanh các đại lượng.',
  },
  {
    slug: 'tai-lieu-hoa-hoc',
    label: 'Kho tài liệu & Công cụ KHTN',
    title: 'Kho Tài Liệu & 50+ Công Cụ KHTN Lý Hóa Sinh · ELEC AI',
    description:
      'Khám phá hơn 50 công cụ học tập, máy tính khoa học, sách giáo khoa, chuyên đề và công cụ AI tuyển chọn cho học sinh THCS và THPT.',
    h1: 'Kho Tài Liệu & Bộ Công Cụ Học Tập Khoa Học Tự Nhiên Toàn Diện',
    intro:
      'Tập hợp toàn bộ máy tính khoa học Lý – Hóa – Sinh, thư viện sách giáo khoa, chuyên đề ôn thi THPT Quốc gia và các công cụ AI hỗ trợ học tập chọn lọc.',
    highlights: [
      'Phân nhóm rõ ràng theo Vật lí, Hóa học, Sinh học và công cụ AI đa năng.',
      'Truy cập nhanh Phân tích hợp chất, Tính khối lượng mol, Định luật khí lí tưởng, Phả hệ di truyền.',
      'Đồng bộ với tài khoản học tập để lưu tài liệu yêu thích.',
    ],
    faqQ: 'Kho tài liệu ELEC AI gồm những nội dung gì?',
    faqA: 'Bao gồm các công cụ tính toán KHTN chuyên sâu, tài liệu tổng hợp chuyên đề lớp 10–12, đề ôn tập và danh mục công cụ AI học tập miễn phí.',
  },
  {
    slug: 'tinh-diem-xet-tuyen-dai-hoc',
    label: 'Tính điểm xét tuyển Đại học',
    title: 'Tính Điểm Xét Tuyển Đại Học A00 A01 B00 D07 · ELEC AI',
    description:
      'Công cụ tính điểm thi tốt nghiệp THPT và quy đổi điểm xét tuyển đại học chuẩn xác theo quy chế tuyển sinh mới nhất của Bộ GD&ĐT.',
    h1: 'Công Cụ Tính Điểm Tốt Nghiệp & Xét Tuyển Đại Học (A00, A01, B00, D07)',
    intro:
      'Tính nhanh điểm xét tốt nghiệp THPT, điểm ưu tiên khu vực/đối tượng và quy đổi tổ hợp xét tuyển đại học theo quy chế tuyển sinh hiện hành.',
    highlights: [
      'Hỗ trợ đầy đủ các tổ hợp KHTN phổ biến: A00, A01, B00, D07 và tổ hợp mới.',
      'Kết nối trực tiếp sang công cụ Tra cứu điểm chuẩn để đối chiếu khả năng trúng tuyển.',
    ],
    faqQ: 'Công cụ tính điểm có áp dụng quy chế điểm ưu tiên mới không?',
    faqA: 'Có. Hệ thống cập nhật công thức tính điểm xét tốt nghiệp và mức giảm trừ điểm ưu tiên khi tổng điểm đạt từ 22,5 trở lên.',
  },
  {
    slug: 'tra-cuu-diem-chuan',
    label: 'Tra cứu điểm chuẩn Đại học',
    title: 'Tra Cứu Điểm Chuẩn Đại Học & ĐGNL Mới Nhất · ELEC AI',
    description:
      'Tra cứu điểm chuẩn các trường đại học hàng đầu, đối chiếu ngưỡng điểm xét tuyển THPTQG và Đánh giá năng lực phù hợp mục tiêu cá nhân.',
    h1: 'Tra Cứu Điểm Chuẩn Đại Học & Đánh Giá Năng Lực Trên Toàn Quốc',
    intro:
      'Tìm kiếm điểm chuẩn theo tên trường, mã ngành, tổ hợp xét tuyển và phương thức ĐGNL để đặt mục tiêu ôn thi thực tế ngay trên ELEC Science AI.',
    highlights: [
      'So sánh điểm chuẩn giữa các năm và các phương thức xét tuyển.',
      'Gợi ý ngành học phù hợp với mức điểm mục tiêu và năng lực KHTN hiện tại.',
    ],
    faqQ: 'Có thể tra cứu điểm chuẩn theo phương thức ĐGNL trên ELEC AI không?',
    faqA: 'Có. Công cụ hỗ trợ đối chiếu cả điểm thi tốt nghiệp THPT theo tổ hợp lẫn ngưỡng điểm Đánh giá năng lực của nhiều trường đại học lớn.',
  },
  {
    slug: 'dinh-huong-nghe-nghiep',
    label: 'Định hướng nghề nghiệp RIASEC',
    title: 'Định Hướng Nghề Nghiệp AI & Test RIASEC · ELEC AI',
    description:
      'Khám phá ngành học và nghề nghiệp phù hợp với năng lực KHTN qua bài trắc nghiệm hướng nghiệp RIASEC kết hợp phân tích AI.',
    h1: 'Định Hướng Nghề Nghiệp & Chọn Ngành Đại Học Với Mô Hình RIASEC + AI',
    intro:
      'Hoàn thành bài trắc nghiệm sở thích nghề nghiệp theo mô hình Holland (RIASEC) để nhận phân tích AI gợi ý nhóm ngành STEM, Y Dược, Kỹ thuật, Công nghệ phù hợp.',
    highlights: [
      'Đánh giá 6 nhóm tính cách nghề nghiệp: Kỹ thuật, Nghiên cứu, Nghệ thuật, Xã hội, Quản lý, Nghiệp vụ.',
      'Liên kết trực tiếp kết quả RIASEC với lộ trình ôn thi KHTN mục tiêu.',
    ],
    faqQ: 'Bài test RIASEC trên ELEC AI giúp ích gì cho học sinh THPT?',
    faqA: 'Giúp học sinh hiểu rõ thế mạnh bản thân, thu hẹp danh sách ngành học phù hợp và chọn đúng tổ hợp môn KHTN để ôn thi đại học.',
  },
  {
    slug: 'tro-choi-khoa-hoc',
    label: 'Trò chơi Khoa học & Lab 3D',
    title: 'Trò Chơi Khoa Học & Phòng Thí Nghiệm Hóa 3D · ELEC AI',
    description:
      'Học Vật lí, Hóa học, Sinh học qua phòng thí nghiệm ảo 3D tương tác, Đấu nguyên tố, Sudoku Hóa học, Jeopardy và Quiz tốc độ.',
    h1: 'Phòng Thí Nghiệm Hóa Học 3D & Trò Chơi Ôn Tập Khoa Học Tự Nhiên',
    intro:
      'Biến việc ôn tập kiến thức Lý – Hóa – Sinh thành trải nghiệm trực quan qua mô phỏng Lab 3D tương tác và hơn 6 trò chơi giáo dục gắn trực tiếp ngân hàng câu hỏi.',
    highlights: [
      'Phòng thí nghiệm 3D trực quan hóa phản ứng và mô hình phân tử ngay trên trình duyệt.',
      'Các trò chơi ôn tập: Đấu nguyên tố, Sudoku Hóa học, Jeopardy, Bắt gà, Ná cao su, Đua xe kiến thức.',
      'Câu trả lời sai trong trò chơi được đồng bộ sang Sổ tay lỗi sai SRS để ôn lại.',
    ],
    faqQ: 'Chơi trò chơi khoa học trên ELEC AI có lưu thành tích không?',
    faqA: 'Có. Điểm số, chuỗi ngày học và các câu hỏi làm sai trong trò chơi được đồng bộ vào hồ sơ học tập và bảng xếp hạng lớp.',
  },
  {
    slug: 'ai-doc-studio',
    label: 'AI Doc Studio',
    title: 'AI Doc Studio — Tóm Tắt PDF, Tạo Flashcard & Quiz · ELEC AI',
    description:
      'Tải lên PDF hoặc tài liệu học tập để AI tự động tóm tắt ý chính, trích xuất công thức và tạo bộ flashcard, câu hỏi trắc nghiệm ôn tập.',
    h1: 'AI Doc Studio — Tóm Tắt Tài Liệu PDF, Tạo Flashcard & Quiz Tự Động',
    intro:
      'Biến giáo trình, đề cương hoặc file PDF bài giảng dài hàng chục trang thành bản tóm tắt có cấu trúc, bộ thẻ ghi nhớ Flashcard và đề trắc nghiệm luyện tập chỉ trong vài giây.',
    highlights: [
      'Trích xuất trọng tâm kiến thức, công thức và khái niệm cốt lõi từ tài liệu KHTN.',
      'Sinh ngay bộ Flashcard ôn tập và câu hỏi kiểm tra để tự đánh giá mức độ hiểu bài.',
    ],
    faqQ: 'AI Doc Studio hỗ trợ định dạng tài liệu nào?',
    faqA: 'Hỗ trợ tải lên tài liệu PDF hoặc dán trực tiếp nội dung văn bản bài học để AI xử lý và tạo bộ ôn tập.',
  },
  {
    slug: 'bang-phan-tuong-tac',
    label: 'Bảng phấn tương tác',
    title: 'Bảng Phấn Tương Tác KHTN Trực Tuyến · ELEC AI',
    description:
      'Bảng phấn tương tác trực tuyến hỗ trợ vẽ sơ đồ tư duy, mô phỏng bài giảng và giải thích trực quan các bài tập Vật lí, Hóa học, Sinh học.',
    h1: 'Bảng Phấn Tương Tác KHTN Trực Tuyến Cho Học Sinh & Giáo Viên',
    intro:
      'Không gian bảng viết trực quan phục vụ trình bày lời giải từng bước, vẽ mạch điện, sơ đồ phản ứng và minh họa hiện tượng khoa học ngay trên web.',
    highlights: [
      'Trực quan hóa lời giải từng bước cùng trợ lý AI trên khung bảng phấn.',
      'Phù hợp cho cả việc tự học và giảng dạy trực tuyến.',
    ],
    faqQ: 'Bảng phấn tương tác trên ELEC AI dùng để làm gì?',
    faqA: 'Dùng để trình bày lời giải từng bước trực quan, phác thảo sơ đồ bài tập Vật lí, Hóa học, Sinh học và hỗ trợ giảng dạy trên lớp.',
  },
  {
    slug: 'quiz',
    label: 'Luyện tập Quiz SRS',
    title: 'Luyện Tập Quiz KHTN & Ôn Tập Ngắt Quãng SRS · ELEC AI',
    description:
      'Hệ thống câu hỏi trắc nghiệm thông minh đa môn thích ứng điểm mạnh yếu, tự động lưu câu sai để củng cố kiến thức đúng thời điểm.',
    h1: 'Luyện Tập Quiz KHTN Thông Minh & Ôn Tập Ngắt Quãng (SRS)',
    intro:
      'Thực hành câu hỏi trắc nghiệm theo chuyên đề Vật lí, Hóa học, Sinh học và ôn lại chính xác các câu từng sai dựa trên thuật toán ghi nhớ ngắt quãng SuperMemo SM-2.',
    highlights: [
      'Chấm điểm tức thì, hiển thị giải thích chi tiết cho từng phương án.',
      'Tự động lập lịch nhắc ôn lại những câu hay nhầm lẫn trước khi quên.',
    ],
    faqQ: 'Thuật toán SRS trong Quiz ELEC AI hoạt động ra sao?',
    faqA: 'Hệ thống áp dụng SuperMemo SM-2 rút gọn để điều chỉnh khoảng cách ngày ôn lại dựa trên độ chính xác và tốc độ phản hồi của bạn.',
  },
  {
    slug: 'bang-xep-hang',
    label: 'Bảng xếp hạng KHTN',
    title: 'Bảng Xếp Hạng Chuỗi Học & Thành Tích KHTN · ELEC AI',
    description:
      'Vinh danh học sinh và lớp học có chuỗi ôn tập bền bỉ và thành tích luyện thi KHTN nổi bật trên ELEC Science AI.',
    h1: 'Bảng Xếp Hạng Chuỗi Ngày Học & Thành Tích Luyện Thi KHTN',
    intro:
      'Theo dõi thứ hạng điểm kinh nghiệm, chuỗi ngày học liên tục (Streak) và thành tích thi đua giữa các học sinh, lớp học trên toàn hệ thống ELEC Science AI.',
    highlights: [
      'Cập nhật liên tục theo tiến độ làm bài tập, quiz và phòng thi ảo.',
      'Tạo động lực duy trì thói quen ôn luyện Khoa học Tự nhiên mỗi ngày.',
    ],
    faqQ: 'Làm sao để tăng hạng trên Bảng xếp hạng ELEC AI?',
    faqA: 'Học sinh tích lũy điểm kinh nghiệm và duy trì chuỗi Streak bằng cách hoàn thành bài quiz, luyện đề phòng thi ảo và ôn tập Sổ tay lỗi sai mỗi ngày.',
  },
];

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildRouteJsonLd(route) {
  const url = `${SITE_ORIGIN}/${route.slug}`;
  return JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': `${url}#webpage`,
          url,
          name: route.title,
          description: route.description,
          inLanguage: 'vi-VN',
          dateModified: '2026-11-12',
          isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
          author: { '@id': `${SITE_ORIGIN}/#founder` },
          creator: { '@id': `${SITE_ORIGIN}/#founder` },
        },
        FOUNDER_PERSON_LD,
        {
          '@type': 'BreadcrumbList',
          '@id': `${url}#breadcrumb`,
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Trang chủ ELEC Science AI', item: `${SITE_ORIGIN}/` },
            { '@type': 'ListItem', position: 2, name: route.label, item: url },
          ],
        },
        {
          '@type': 'FAQPage',
          '@id': `${url}#faq`,
          mainEntity: [
            {
              '@type': 'Question',
              name: route.faqQ,
              acceptedAnswer: { '@type': 'Answer', text: route.faqA },
            },
            {
              '@type': 'Question',
              name: 'Ai là nhà sáng lập ELEC AI (ELEC Science AI)?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Nhà sáng lập và người phát triển chính của ELEC Science AI (ELEC AI) là Nguyễn Thế Duy (biệt danh Tk Media / Duy TK, tại Thái Bình). Facebook chính thức: https://www.facebook.com/nguyentheduytk — Tiểu sử: https://www.elecai.id.vn/nha-sang-lap.',
              },
            },
          ],
        },
      ],
    },
    null,
    2
  );
}

function buildStaticRootHtml(route) {
  const otherLinks = SEO_ROUTES.filter((r) => r.slug !== route.slug)
    .slice(0, 6)
    .map((r) => `<li><a href="/${r.slug}" style="color:#2563eb;text-decoration:none">${escapeHtml(r.label)}</a></li>`)
    .join('\n          ');

  const highlightsHtml = route.highlights
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join('\n          ');

  return `<div id="root">
      <header style="max-width:960px;margin:28px auto 16px;padding:0 20px;text-align:center">
        <p style="font-size:14px;color:#64748b;margin:0 0 8px">
          <a href="/" style="color:#2563eb;text-decoration:none">ELEC Science AI (ELEC AI)</a> · ${escapeHtml(route.label)}
        </p>
        <h1 style="font-size:28px;font-weight:800;color:#0f172a;line-height:1.3;margin-bottom:8px">
          ${escapeHtml(route.h1)}
        </h1>
        <p style="font-size:17px;color:#475569;max-width:760px;margin:0 auto">
          ${escapeHtml(route.intro)}
        </p>
      </header>
      <main style="max-width:960px;margin:0 auto;padding:0 20px;font:16px/1.7 system-ui,Arial,sans-serif;color:#1e293b">
        <section style="margin-bottom:24px">
          <h2 style="font-size:21px;font-weight:700;color:#0f172a;margin-bottom:10px">Tính năng nổi bật</h2>
          <ul style="padding-left:20px;line-height:1.8">
          ${highlightsHtml}
          </ul>
        </section>
        <section style="margin-bottom:24px">
          <h2 style="font-size:21px;font-weight:700;color:#0f172a;margin-bottom:10px">Câu hỏi thường gặp</h2>
          <article style="margin-bottom:12px">
            <h3 style="font-size:17px;font-weight:600;color:#1e293b;margin-bottom:4px">${escapeHtml(route.faqQ)}</h3>
            <p style="margin:0;color:#475569">${escapeHtml(route.faqA)}</p>
          </article>
          <article>
            <h3 style="font-size:17px;font-weight:600;color:#1e293b;margin-bottom:4px">Ai là nhà sáng lập ELEC AI (ELEC Science AI)?</h3>
            <p style="margin:0;color:#475569">
              Nhà sáng lập (Founder) và người phát triển chính của ELEC Science AI là <strong>Nguyễn Thế Duy</strong> (Tk Media / Duy TK).
              Xem <a href="/nha-sang-lap" style="color:#2563eb">tiểu sử nhà sáng lập</a> hoặc kết nối qua
              <a href="https://www.facebook.com/nguyentheduytk" rel="me noopener noreferrer" style="color:#2563eb">Facebook chính thức</a>.
            </p>
          </article>
        </section>
        <section style="margin-bottom:24px">
          <h2 style="font-size:20px;font-weight:700;color:#0f172a;margin-bottom:10px">Công cụ KHTN liên quan trên ELEC AI</h2>
          <ul style="padding-left:20px;line-height:1.8">
          ${otherLinks}
            <li><a href="/gioi-thieu" style="color:#2563eb;text-decoration:none">Giới thiệu chi tiết ELEC Science AI</a></li>
          </ul>
        </section>
      </main>
    </div>`;
}

function renderRouteHtml(baseHtml, route) {
  const url = `${SITE_ORIGIN}/${route.slug}`;
  const escTitle = escapeHtml(route.title);
  const escDesc = escapeHtml(route.description);

  let html = baseHtml;
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escTitle}</title>`);
  html = html.replace(
    /<meta\s+name="description"\s+content="[\s\S]*?"\s*\/>/,
    `<meta name="description" content="${escDesc}" />`
  );
  html = html.replace(
    /<link rel="canonical" href="[^"]*" \/>/,
    `<link rel="canonical" href="${url}" />`
  );
  html = html.replaceAll(
    /<link rel="alternate" hreflang="(vi|x-default)" href="[^"]*" \/>/g,
    '<link rel="alternate" hreflang="$1" href="' + url + '" />'
  );
  html = html.replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${url}" />`);
  html = html.replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${escTitle}" />`);
  html = html.replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${escDesc}" />`);
  html = html.replace(/<meta name="twitter:url" content="[^"]*" \/>/, `<meta name="twitter:url" content="${url}" />`);
  html = html.replace(/<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${escTitle}" />`);
  html = html.replace(/<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${escDesc}" />`);

  const jsonLd = buildRouteJsonLd(route);
  html = html.replace(
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script type="application/ld+json">\n${jsonLd}\n    </script>`
  );

  const staticRoot = buildStaticRootHtml(route);
  html = html.replace(/<div id="root">[\s\S]*?<\/div>\s*(?=<noscript>)/, `${staticRoot}\n    `);

  return html;
}

function main() {
  if (!fs.existsSync(INDEX_PATH)) {
    throw new Error(`Missing built index.html at ${INDEX_PATH}`);
  }
  const baseHtml = fs.readFileSync(INDEX_PATH, 'utf8');
  let count = 0;
  for (const route of SEO_ROUTES) {
    const outPath = path.join(DIST_DIR, `${route.slug}.html`);
    const outHtml = renderRouteHtml(baseHtml, route);
    const ldMatch = outHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (!ldMatch) throw new Error(`Missing JSON-LD for ${route.slug}`);
    JSON.parse(ldMatch[1]);
    if (
      !outHtml.includes(escapeHtml(route.h1)) ||
      !outHtml.includes(`<link rel="canonical" href="${SITE_ORIGIN}/${route.slug}" />`)
    ) {
      throw new Error(`Prerender verification failed for ${route.slug}`);
    }
    fs.writeFileSync(outPath, outHtml, 'utf8');
    count += 1;
  }
  console.log(`[prerender-seo-routes] Generated ${count} static SEO route HTML files in dist/`);
}

main();
