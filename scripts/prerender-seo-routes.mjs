/**
 * scripts/prerender-seo-routes.mjs
 * ------------------------------------------------------------
 * Post-build SEO, AEO (Answer Engine Optimization) & GEO (Generative Engine Optimization)
 * static HTML generator for public ELEC Science AI routes.
 * Reads the compiled `dist/index.html` and emits `dist/<slug>.html` for each
 * public route in `sitemap.xml` with route-specific <title>, <meta>,
 * canonical URL, Open Graph, Twitter Card, rich JSON-LD (@graph: WebPage + Speakable,
 * SoftwareApplication, HowTo, Person, EducationalOrganization, BreadcrumbList, FAQPage),
 * and semantic static HTML (<dl>, <ol>, <ul>, <article>) inside `<div id="root">`
 * so search bots, answer engines, and AI crawlers see authoritative content immediately.
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
  birthDate: '2010',
  award: [
    "Giải Ba Cuộc thi 'Học sinh phổ thông với ý tưởng khởi nghiệp' tỉnh Hưng Yên năm 2026 — Sở Giáo dục và Đào tạo Hưng Yên (Dự án: Elec AI - Phần mềm trợ lý học tập số môn Hóa học trong trường phổ thông, Trường THPT Đông Thụy Anh)",
  ],
  image: [
    `${SITE_ORIGIN}/img/author/nguyen-the-duy-giai-ba-khoi-nghiep-hung-yen-2026.jpg`,
    `${SITE_ORIGIN}/img/nguyen-the-duy.jpg?v=2`,
    `${SITE_ORIGIN}/img/author/chung-nhan-giai-ba-elec-ai-hung-yen-2026.jpg`,
    `${SITE_ORIGIN}/img/author/nguyen-the-duy-phong-van-hytv-elec-ai-2026.jpg`,
  ],
  jobTitle: 'Nhà sáng lập & Kỹ sư phát triển chính (Founder & Lead Developer) — ELEC Science AI',
  disambiguatingDescription:
    'Nguyễn Thế Duy (Duy TK / Tk Media, sinh năm 2010 tại Thái Bình) là nhà sáng lập trẻ của ELEC Science AI và PhotobothNe, đoạt Giải Ba Cuộc thi Học sinh phổ thông với ý tưởng khởi nghiệp tỉnh Hưng Yên năm 2026 (Sở GD&ĐT Hưng Yên), KHÔNG phải các cá nhân trùng tên làm việc tại PetroVietnam (PVN).',
  nationality: { '@type': 'Country', name: 'Vietnam' },
  knowsLanguage: ['vi', 'en'],
  alumniOf: {
    '@type': 'EducationalOrganization',
    name: 'Trường THPT Đông Thụy Anh, Thái Bình',
  },
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

const ROUTE_KEYWORDS = {
  'tro-ly-ai-giai-hoa': 'trợ lý AI giải bài tập, giải Hóa bằng AI, giải Lý bằng AI, giải Sinh bằng AI, chụp ảnh giải bài KHTN, ELEC Science AI, GDPT 2018',
  'phong-thi-ao': 'phòng thi ảo THPT Quốc gia 2026, thi thử Lý Hóa Sinh, đề thi ĐGNL HSA TSA V-ACT, trắc nghiệm đúng sai lũy tiến, ELEC AI',
  'bang-tuan-hoan': 'bảng tuần hoàn hóa học 118 nguyên tố, bảng tuần hoàn IUPAC, cấu hình electron, độ âm điện, số oxi hóa, ELEC Science AI',
  'can-bang-phuong-trinh-hoa-hoc': 'cân bằng phương trình hóa học online, cân bằng PTHH tự động, cân bằng phản ứng oxi hóa khử, chất khử chất oxi hóa, ELEC AI',
  'lo-trinh-on-thi-thpt-quoc-gia': 'lộ trình ôn thi THPT Quốc gia 2026, lộ trình học KHTN Elo, ôn thi khối A00 A01 B00 D07, GDPT 2018, ELEC Science AI',
  'cong-thuc-hoa-hoc': 'sổ tay công thức Vật lí Hóa học Sinh học, công thức tính mol pH, công thức dao động điều hòa mạch RLC, công thức ADN Menđen, ELEC AI',
  'tai-lieu-hoa-hoc': 'tài liệu Khoa học Tự nhiên lớp 10 11 12, máy tính khoa học KHTN, công cụ học tập AI miễn phí, ELEC Science AI',
  'tinh-diem-xet-tuyen-dai-hoc': 'tính điểm xét tuyển đại học 2026, tính điểm tốt nghiệp THPT, giảm trừ điểm ưu tiên 22.5, tổ hợp A00 A01 B00 D07, ELEC AI',
  'tra-cuu-diem-chuan': 'tra cứu điểm chuẩn đại học 2026, điểm chuẩn ĐGNL HSA TSA V-ACT, tư vấn nguyện vọng đại học, ELEC Science AI',
  'dinh-huong-nghe-nghiep': 'trắc nghiệm hướng nghiệp RIASEC, test mật mã Holland, chọn ngành đại học khối KHTN, định hướng nghề nghiệp AI, ELEC AI',
  'tro-choi-khoa-hoc': 'phòng thí nghiệm hóa học 3D, trò chơi khoa học KHTN, đấu nguyên tố, sudoku hóa học, học Lý Hóa Sinh qua game, ELEC AI',
  'phong-thi-nghiem-vat-li': 'phòng thí nghiệm vật lí ảo, mô phỏng vật lí trực tuyến, ném xiên, mạch điện DC, thấu kính quang hình, giao thoa sóng 2D, con lắc kép RK4, Olympiad Vật lí, ELEC AI',
  'ai-doc-studio': 'AI tóm tắt PDF, tạo flashcard từ PDF, tạo câu hỏi trắc nghiệm từ tài liệu, AI Doc Studio, ELEC Science AI',
  'bang-phan-tuong-tac': 'bảng phấn tương tác trực tuyến, vẽ sơ đồ mạch điện, trình bày lời giải KHTN bằng AI, ELEC Science AI',
  quiz: 'luyện tập quiz KHTN, trắc nghiệm Lý Hóa Sinh, ôn tập ngắt quãng SRS SuperMemo SM-2, sổ tay lỗi sai, ELEC AI',
  'bang-xep-hang': 'bảng xếp hạng học tập KHTN, chuỗi ngày học Streak, điểm Elo KHTN, thi đua lớp học ELEC Science AI',
};

const ORG_LD = {
  '@type': ['Organization', 'EducationalOrganization'],
  '@id': `${SITE_ORIGIN}/#org`,
  name: 'ELEC Science AI',
  alternateName: ['ELEC AI', 'ELECAI', 'Elec AI'],
  url: `${SITE_ORIGIN}/`,
  founder: { '@id': `${SITE_ORIGIN}/#founder` },
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
      'Trợ lý AI KHTN của ELEC Science AI (sáng lập bởi Nguyễn Thế Duy) giúp học sinh giải bài tập Vật lí, Hóa học, Sinh học lớp 10, 11, 12 từ văn bản hoặc ảnh chụp đề thi (tối đa 10 ảnh/lần) theo 6 chế độ sư phạm, kết hợp công cụ tính toán khoa học xác định và trình bày công thức KaTeX chuẩn GDPT 2018.',
    specs: {
      subject: 'Vật lí, Hóa học, Sinh học (THCS, THPT Lớp 10–12 & Đại học)',
      method: 'Mô hình AI đa phương thức + Máy tính khoa học xác định + Hiển thị KaTeX',
      audience: 'Học sinh tự học, thí sinh ôn thi THPT Quốc gia / ĐGNL và Giáo viên',
    },
    highlights: [
      '6 chế độ sư phạm chuyên sâu: Tự động, Giải chi tiết từng bước, Gợi ý từng bước (Socratic — không lộ đáp án ngay), Kiểm tra đáp án, Ôn lý thuyết, Tạo bài tương tự.',
      'Hỗ trợ đầy đủ 3 môn Khoa học Tự nhiên lớp 10, 11, 12 và Đại học theo chương trình GDPT 2018 và danh pháp IUPAC.',
      'Kết hợp công cụ tính khối lượng mol, cân bằng PTHH đại số tuyến tính và máy tính khoa học để triệt tiêu sai số tính toán.',
    ],
    steps: [
      'Chọn khối lớp (Lớp 10, 11, 12 hoặc Đại học) và chế độ sư phạm mong muốn (ví dụ: Giải chi tiết hoặc Gợi ý từng bước).',
      'Nhập câu hỏi bằng văn bản hoặc tải lên từ 1 đến 10 ảnh chụp đề bài Vật lí, Hóa học, Sinh học.',
      'Đọc lời giải từng bước kèm giải thích bản chất, công thức KaTeX và bảng kiểm tra bảo toàn; hỏi tiếp ngay trong cùng hội thoại nếu cần làm rõ.',
    ],
    faqs: [
      {
        q: 'Trợ lý AI của ELEC Science AI giải được những môn nào?',
        a: 'Trợ lý AI hỗ trợ giải bài tập từng bước từ văn bản hoặc ảnh chụp cho cả 3 môn Vật lí, Hóa học và Sinh học theo chương trình GDPT 2018, đồng thời hỗ trợ mở rộng cho Toán và các môn học phổ thông khác.',
      },
      {
        q: 'Chế độ Gợi ý từng bước khác gì với Giải chi tiết?',
        a: 'Chế độ Giải chi tiết trình bày trọn vẹn các bước biến đổi và đáp số cuối cùng; trong khi chế độ Gợi ý từng bước (Socratic) chỉ đưa ra định hướng công thức và bước đầu tiên để học sinh tự tư duy tìm đáp án.',
      },
      {
        q: 'Làm sao để Trợ lý AI hạn chế tính toán sai số học?',
        a: 'ELEC Science AI tích hợp các công cụ tính toán khoa học xác định (cân bằng PTHH đại số tuyến tính, tính khối lượng mol, nồng độ, pH, mạch RLC) song song với mô hình ngôn ngữ để kiểm chứng kết quả.',
      },
    ],
  },
  {
    slug: 'phong-thi-ao',
    label: 'Phòng thi ảo THPTQG & ĐGNL',
    title: 'Phòng Thi Ảo THPTQG & ĐGNL Lý Hóa Sinh 2026 · ELEC AI',
    description:
      'Luyện đề thi thử tốt nghiệp THPT và ĐGNL (HSA, TSA, V-ACT) các môn Vật lí, Hóa học, Sinh học bấm giờ thật, cấu trúc 3 phần mới kèm lời giải chi tiết.',
    h1: 'Phòng Thi Ảo THPT Quốc Gia & Đánh Giá Năng Lực (HSA, TSA, V-ACT)',
    intro:
      'Phòng thi ảo ELEC Science AI mô phỏng chính xác áp lực phòng thi thật với cấu trúc đề chuẩn 3 phần mới của Bộ GD&ĐT (18 câu trắc nghiệm 4 lựa chọn, 4 câu Đúng/Sai lũy tiến, 6 câu trả lời ngắn trong 50 phút), phiếu OMR số hóa và tự động lưu câu làm sai vào sổ ôn tập SRS.',
    specs: {
      subject: 'Đề thi Tốt nghiệp THPT (Lý, Hóa, Sinh) & ĐGNL (HSA, TSA, V-ACT)',
      method: 'Chấm điểm lũy tiến chuẩn Bộ GD&ĐT 2026 + Giám sát MediaPipe + Tự động lưu câu sai SRS',
      audience: 'Thí sinh lớp 12 luyện thi Đại học và Giáo viên tổ chức kiểm tra trực tuyến',
    },
    highlights: [
      'Đồng hồ bấm giờ thực 50 phút, chấm điểm lũy tiến Phần II (0,1 – 0,25 – 0,5 – 1,0 điểm/câu) và thống kê độ chính xác theo từng chuyên đề.',
      'Phân khu đề thi miễn phí và chuyên sâu cho Vật lí, Hóa học, Sinh học và bài thi KHTN tổng hợp ĐGNL (HSA, TSA Bách Khoa, V-ACT).',
      'Hỗ trợ giám sát phòng thi trực tuyến bằng thị giác máy tính MediaPipe khi giáo viên giao đề kiểm tra cho lớp.',
    ],
    steps: [
      'Chọn kỳ thi mục tiêu (Tốt nghiệp THPT 2026 môn Vật lí, Hóa học, Sinh học hoặc ĐGNL HSA, TSA, V-ACT).',
      'Làm bài trong thời gian bấm giờ thực trên giao diện phiếu trả lời 3 phần (Nhiều lựa chọn, Đúng/Sai, Trả lời ngắn).',
      'Nộp bài để xem ngay điểm số, lời giải chi tiết từng câu, phân tích bẫy đề thi và lưu các câu sai vào Sổ tay SRS.',
    ],
    faqs: [
      {
        q: 'Phòng thi ảo ELEC AI có bám sát cấu trúc đề thi mới 2026 không?',
        a: 'Có. Đề thi trong Phòng thi ảo được thiết kế chuẩn theo cấu trúc 3 phần mới của Bộ GD&ĐT (Quyết định 4068/QĐ-BGDĐT) và format các kỳ thi ĐGNL HSA, TSA, V-ACT.',
      },
      {
        q: 'Điểm câu hỏi Đúng/Sai (Phần II) trong Phòng thi ảo được tính như thế nào?',
        a: 'Mỗi câu Đúng/Sai có 4 ý nhỏ (a, b, c, d). Hệ thống chấm lũy tiến đúng quy chế Bộ GD&ĐT: trả lời đúng 1 ý được 0,1 điểm; đúng 2 ý được 0,25 điểm; đúng 3 ý được 0,5 điểm; đúng cả 4 ý được trọn vẹn 1,0 điểm.',
      },
      {
        q: 'Các câu làm sai trong Phòng thi ảo có được lưu lại để ôn tập không?',
        a: 'Có. Mọi câu trả lời sai khi luyện đề đều tự động được đưa vào Sổ tay lỗi sai và lên lịch nhắc ôn lại theo thuật toán lặp lại ngắt quãng SRS (SuperMemo SM-2).',
      },
    ],
  },
  {
    slug: 'bang-tuan-hoan',
    label: 'Bảng tuần hoàn 118 nguyên tố',
    title: 'Bảng Tuần Hoàn Hóa Học 118 Nguyên Tố IUPAC · ELEC AI',
    description:
      'Bảng tuần hoàn hóa học trực tuyến 118 nguyên tố chuẩn IUPAC: tra cứu cấu hình electron, độ âm điện, khối lượng nguyên tử, bán kính và so sánh tính chất.',
    h1: 'Bảng Tuần Hoàn 118 Nguyên Tố Hóa Học Tương Tác Chuẩn IUPAC',
    intro:
      'Bảng tuần hoàn tương tác trên ELEC Science AI cung cấp dữ liệu chuẩn quốc tế IUPAC cho toàn bộ 118 nguyên tố hóa học (từ Hydrogen Z=1 đến Oganesson Z=118): số hiệu nguyên tử, nguyên tử khối, cấu hình electron, độ âm điện Pauling, số oxi hóa, mô phỏng lớp vỏ electron và so sánh song song các nguyên tố.',
    specs: {
      subject: 'Hóa học THCS & THPT (Chương trình GDPT 2018 chuẩn danh pháp IUPAC)',
      method: 'Tra cứu tương tác thời gian thực + Lọc theo nhóm/chu kì + So sánh đối chiếu nguyên tố',
      audience: 'Học sinh THCS, THPT, Sinh viên và Giáo viên Hóa học',
    },
    highlights: [
      'Lọc nhanh theo nhóm kim loại kiềm, kiềm thổ, halogen, khí hiếm, kim loại chuyển tiếp, phi kim, lanthanide và actinide.',
      'Hiển thị song ngữ danh pháp quốc tế IUPAC (Sodium, Potassium, Iron, Copper...) và tên tiếng Việt truyền thống.',
      'So sánh trực quan tính chất giữa hai nguyên tố, xem mô phỏng lớp vỏ electron và sử dụng miễn phí 100% trên mọi thiết bị.',
    ],
    steps: [
      'Tìm nguyên tố theo kí hiệu hóa học (ví dụ: Fe, Cu, Na), số hiệu nguyên tử Z hoặc tên gọi IUPAC / tiếng Việt trên thanh tìm kiếm.',
      'Nhấp vào ô nguyên tố để mở thẻ chi tiết gồm cấu hình electron, độ âm điện, bán kính nguyên tử, số oxi hóa, ứng dụng và mẹo ghi nhớ.',
      'Chọn tính năng So sánh để đặt hai nguyên tố cạnh nhau và đối chiếu sự biến đổi tính chất tuần hoàn.',
    ],
    faqs: [
      {
        q: 'Bảng tuần hoàn trên ELEC AI có đủ 118 nguyên tố chuẩn IUPAC mới nhất không?',
        a: 'Có. Bảng tuần hoàn cập nhật đầy đủ 118 nguyên tố (từ Z=1 đến Z=118) theo danh pháp và dữ liệu chuẩn IUPAC mới nhất áp dụng trong chương trình GDPT 2018.',
      },
      {
        q: 'Có thể tra cứu cấu hình electron và độ âm điện trên bảng tuần hoàn này không?',
        a: 'Có. Mỗi nguyên tố đều hiển thị rõ cấu hình electron đầy đủ và thu gọn, độ âm điện theo thang Pauling, năng lượng ion hóa, các số oxi hóa phổ biến và trạng thái vật lí.',
      },
      {
        q: 'Bảng tuần hoàn ELEC Science AI có miễn phí trên điện thoại không?',
        a: 'Hoàn toàn miễn phí 100%, không cần cài đặt phức tạp và tương thích mượt mà trên cả màn hình điện thoại lẫn máy tính.',
      },
    ],
  },
  {
    slug: 'can-bang-phuong-trinh-hoa-hoc',
    label: 'Cân bằng phương trình Hóa học',
    title: 'Cân Bằng Phương Trình Hóa Học Tự Động Online · ELEC AI',
    description:
      'Máy cân bằng phương trình hóa học (PTHH) bằng đại số tuyến tính chính xác cao, chỉ rõ chất oxi hóa, chất khử và quá trình oxi hóa khử.',
    h1: 'Máy Cân Bằng Phương Trình Hóa Học (PTHH) Bằng Đại Số Tuyến Tính',
    intro:
      'Máy cân bằng phương trình hóa học của ELEC Science AI sử dụng thuật toán khử Gauss trên ma trận đại số tuyến tính để tìm bộ hệ số nguyên dương tối giản chính xác tuyệt đối cho cả phản ứng vô cơ, hữu cơ và phản ứng oxi hóa – khử phức tạp chỉ trong tích tắc.',
    specs: {
      subject: 'Hóa học THCS, THPT & Đại học (Phản ứng trao đổi, hữu cơ, oxi hóa – khử)',
      method: 'Thuật toán khử Gauss ma trận đại số tuyến tính trên trường số hữu tỉ',
      audience: 'Học sinh lớp 8–12 và Giáo viên Hóa học',
    },
    highlights: [
      'Xác định rõ hệ số nguyên tối giản, chất khử, chất oxi hóa và quá trình nhường – nhận electron.',
      'Hiển thị bảng kiểm tra bảo toàn số nguyên tử của từng nguyên tố ở vế trái và vế phải.',
      'Hỗ trợ các phương trình oxi hóa – khử nhiều chất thay đổi số oxi hóa trong chương trình THPT nâng cao, miễn phí không giới hạn.',
    ],
    steps: [
      'Nhập phương trình hóa học chưa cân bằng vào ô nhập liệu (ví dụ: Fe + HNO3 -> Fe(NO3)3 + NO + H2O).',
      'Bấm nút Cân bằng để thuật toán đại số tuyến tính giải hệ phương trình bảo toàn nguyên tố.',
      'Xem phương trình đã cân bằng với hệ số nguyên tối giản kèm bảng kiểm tra số nguyên tử hai vế và vai trò chất khử / chất oxi hóa.',
    ],
    faqs: [
      {
        q: 'Máy cân bằng PTHH của ELEC AI xử lý được phản ứng oxi hóa – khử khó không?',
        a: 'Có. Công cụ dùng thuật toán ma trận đại số tuyến tính (Gaussian Elimination) nên cân bằng chính xác cả các phản ứng oxi hóa – khử nhiều ẩn và môi trường acid/base.',
      },
      {
        q: 'Cách nhập công thức hóa học vào máy cân bằng như thế nào?',
        a: 'Bạn chỉ cần gõ kí hiệu nguyên tố đúng chữ hoa/thường và số chỉ số liền sau (ví dụ H2SO4, KMnO4, Fe3O4), dùng dấu "+" giữa các chất và dấu "->" hoặc "=" giữa chất tham gia và sản phẩm.',
      },
      {
        q: 'Công cụ có kiểm tra lỗi nhập sai nguyên tố không?',
        a: 'Có. Nếu một nguyên tố xuất hiện ở vế trái mà không có ở vế phải (hoặc ngược lại), hệ thống sẽ cảnh báo ngay lập tức để bạn kiểm tra lại công thức.',
      },
    ],
  },
  {
    slug: 'lo-trinh-on-thi-thpt-quoc-gia',
    label: 'Lộ trình ôn thi KHTN',
    title: 'Lộ Trình Ôn Thi KHTN Lý Hóa Sinh GDPT 2018 · ELEC AI',
    description:
      'Lộ trình kiến thức cá nhân hóa theo điểm Elo và nguyện vọng đại học khối A00, B00, A01, D07 (Bách Khoa, Kinh Tế Quốc Dân, Y Hà Nội, Ngoại Thương).',
    h1: 'Lộ Trình Ôn Thi KHTN & THPT Quốc Gia Cá Nhân Hóa Theo Điểm Elo',
    intro:
      'Hệ thống Lộ trình ôn thi của ELEC Science AI xây dựng kế hoạch học tập Vật lí, Hóa học, Sinh học theo 3 giai đoạn (Nền tảng — Chuyên sâu — Thực chiến đề thi) dựa trên điểm năng lực Elo từng chuyên đề và trường đại học nguyện vọng khối A00, A01, B00, D07.',
    specs: {
      subject: 'Lộ trình toàn diện Vật lí, Hóa học, Sinh học Lớp 10, 11, 12 (GDPT 2018)',
      method: 'Xếp hạng năng lực Elo động + Phân tích khoảng cách điểm chuẩn + Ôn tập SRS SM-2',
      audience: 'Học sinh THPT lớp 10, 11, 12 và thí sinh ôn thi Đại học / ĐGNL',
    },
    highlights: [
      'Theo dõi mức độ thành thạo từng chương bài lớp 10, 11, 12 theo chuẩn GDPT 2018 qua chỉ số Elo trực quan.',
      'Tự động phát hiện chuyên đề yếu và gợi ý bài học, bài tập rèn luyện tiếp theo sát với mục tiêu điểm chuẩn đại học.',
      'Kết nối trực tiếp với Sổ tay lỗi sai SRS để giữ vững kiến thức lâu dài đến ngày thi.',
    ],
    steps: [
      'Chọn trường đại học, ngành học nguyện vọng và tổ hợp xét tuyển mục tiêu (A00, A01, B00, D07) hoặc mức điểm mong muốn.',
      'Thực hiện bài đánh giá năng lực đầu vào hoặc làm bài tập chuyên đề để hệ thống xác lập điểm Elo ban đầu cho từng môn.',
      'Học theo danh sách chuyên đề ưu tiên mỗi tuần và hoàn thành các phiên ôn tập ngắt quãng SRS để nâng Elo đạt ngưỡng đỗ nguyện vọng.',
    ],
    faqs: [
      {
        q: 'Lộ trình ôn thi trên ELEC AI được cá nhân hóa theo tiêu chí nào?',
        a: 'Lộ trình được cá nhân hóa dựa trên năng lực thực tế qua điểm Elo từng chuyên đề, kết hợp với tổ hợp xét tuyển, điểm chuẩn trường đại học mục tiêu và quỹ thời gian còn lại đến kỳ thi.',
      },
      {
        q: 'Điểm Elo trên ELEC Science AI có ý nghĩa gì?',
        a: 'Điểm Elo phản ánh mức độ làm chủ kiến thức của học sinh ở từng chuyên đề (tương tự hệ số Elo trong cờ vua): tăng lên khi giải đúng câu hỏi khó và giảm xuống khi sai câu cơ bản, giúp nhận diện chính xác chuyên đề cần ưu tiên.',
      },
      {
        q: 'Lộ trình có bao gồm cả học sinh lớp 10 và lớp 11 không?',
        a: 'Có. Hệ thống thiết kế cây kiến thức đầy đủ cho cả 3 khối lớp 10, 11 và 12 theo chương trình GDPT 2018.',
      },
    ],
  },
  {
    slug: 'cong-thuc-hoa-hoc',
    label: 'Sổ tay công thức KHTN',
    title: 'Sổ Tay Công Thức Lý Hóa Sinh Đầy Đủ Nhất · ELEC AI',
    description:
      'Tổng hợp công thức KHTN trọng tâm: dao động, sóng, điện xoay chiều (Vật lí); tính mol, pH, dung dịch (Hóa học); ADN, gen, di truyền (Sinh học).',
    h1: 'Sổ Tay Công Thức Khoa Học Tự Nhiên (Vật Lí — Hóa Học — Sinh Học)',
    intro:
      'Sổ tay công thức KHTN của ELEC Science AI tổng hợp hệ thống công thức trọng tâm lớp 10, 11, 12 cho cả 3 môn Vật lí, Hóa học và Sinh học trình bày chuẩn LaTeX/KaTeX, kèm giải thích đại lượng, đơn vị SI và máy tính khoa học nhập số tính kết quả ngay lập tức.',
    specs: {
      subject: 'Công thức Vật lí, Hóa học, Sinh học Lớp 10, 11, 12 (GDPT 2018)',
      method: 'Thư viện công thức chuẩn KaTeX + Máy tính chuyên đề giải nhanh trực tiếp',
      audience: 'Học sinh THCS, THPT và thí sinh ôn thi Tốt nghiệp THPT / ĐGNL',
    },
    highlights: [
      'Vật lí: Động học, Động lực học, Dao động điều hòa, Sóng cơ, Điện trường, Mạch RLC, Vật lí nhiệt, Khí lí tưởng, Hạt nhân.',
      'Hóa học: Số mol, tỉ khối, nồng độ C% và CM, độ pH, enthalpy, định luật Faraday điện phân, hiệu suất phản ứng.',
      'Sinh học: Chiều dài và số liên kết hydrogen của ADN, phiên mã, dịch mã, nguyên phân – giảm phân, quy luật Menđen và cân bằng Hardy-Weinberg.',
    ],
    steps: [
      'Chọn phân môn (Vật lí, Hóa học hoặc Sinh học) và chuyên đề cần tra cứu.',
      'Xem công thức chuẩn KaTeX cùng chú thích tên gọi, ý nghĩa và đơn vị chuẩn của từng đại lượng.',
      'Nhập các đại lượng đã biết vào khung Máy tính nhanh bên cạnh để hệ thống tự động giải đại lượng còn thiếu.',
    ],
    faqs: [
      {
        q: 'Sổ tay công thức trên ELEC AI có kèm máy tính giải nhanh không?',
        a: 'Có. Bên cạnh bảng công thức chuẩn LaTeX/KaTeX, người học có thể nhập trực tiếp các số liệu đã biết vào máy tính chuyên đề để tính nhanh đại lượng cần tìm.',
      },
      {
        q: 'Sổ tay công thức hỗ trợ những môn nào?',
        a: 'Hỗ trợ trọn vẹn cả 3 môn Khoa học Tự nhiên cấp THPT là Vật lí, Hóa học và Sinh học theo chương trình GDPT 2018.',
      },
    ],
  },
  {
    slug: 'tai-lieu-hoa-hoc',
    label: 'Kho tài liệu & Công cụ KHTN',
    title: 'Kho Tài Liệu & 50+ Công Cụ KHTN Lý Hóa Sinh · ELEC AI',
    description:
      'Khám phá hơn 50 công cụ học tập, máy tính khoa học, sách giáo khoa, chuyên đề và công cụ AI tuyển chọn cho học sinh THCS và THPT.',
    h1: 'Kho Tài Liệu & Bộ Công Cụ Học Tập Khoa Học Tự Nhiên Toàn Diện',
    intro:
      'Kho tài liệu và Công cụ KHTN trên ELEC Science AI quy tụ hơn 50 máy tính khoa học Lý – Hóa – Sinh, công cụ phân tích hợp chất, thư viện chuyên đề sách giáo khoa GDPT 2018 và danh mục hơn 350 công cụ AI / mẫu câu lệnh (prompt) hỗ trợ học tập miễn phí.',
    specs: {
      subject: 'Tài liệu & Máy tính chuyên đề Vật lí, Hóa học, Sinh học',
      method: 'Phân loại theo môn học & khối lớp + Công cụ tính toán tương tác trực tuyến',
      audience: 'Học sinh THCS, THPT và Giáo viên bộ môn KHTN',
    },
    highlights: [
      'Phân nhóm rõ ràng theo Vật lí, Hóa học, Sinh học, tiện ích quản lý học tập và công cụ AI đa năng.',
      'Truy cập nhanh Phân tích hợp chất, Tính khối lượng mol, Định luật khí lí tưởng, Phả hệ di truyền, Clock Hub Pomodoro.',
      'Đồng bộ với tài khoản học tập để lưu ghi chú và tài liệu yêu thích trên mọi thiết bị.',
    ],
    steps: [
      'Duyệt danh mục theo bộ môn (Vật lí, Hóa học, Sinh học) hoặc gõ tên công cụ/tài liệu vào ô tìm kiếm.',
      'Mở trực tiếp máy tính chuyên đề hoặc tài liệu lý thuyết ngay trên trình duyệt mà không cần tải phần mềm.',
      'Kết hợp cùng Trợ lý AI hoặc Sổ tay ghi chú để lưu lại các kiến thức quan trọng.',
    ],
    faqs: [
      {
        q: 'Kho tài liệu ELEC AI gồm những nội dung gì?',
        a: 'Bao gồm hơn 50 công cụ tính toán KHTN chuyên sâu, tài liệu tổng hợp chuyên đề lớp 10–12 theo GDPT 2018, đề ôn tập, thư viện 346 mẫu prompt học tập và danh mục 351 công cụ AI miễn phí.',
      },
      {
        q: 'Học sinh có cần cài đặt phần mềm để dùng bộ công cụ này không?',
        a: 'Không. Toàn bộ công cụ và tài liệu hoạt động trực tiếp trên trình duyệt web của máy tính, máy tính bảng và điện thoại.',
      },
    ],
  },
  {
    slug: 'tinh-diem-xet-tuyen-dai-hoc',
    label: 'Tính điểm xét tuyển Đại học',
    title: 'Tính Điểm Xét Tuyển Đại Học A00 A01 B00 D07 · ELEC AI',
    description:
      'Công cụ tính điểm thi tốt nghiệp THPT và quy đổi điểm xét tuyển đại học chuẩn xác theo quy chế tuyển sinh mới nhất của Bộ GD&ĐT.',
    h1: 'Công Cụ Tính Điểm Tốt Nghiệp & Xét Tuyển Đại Học (A00, A01, B00, D07)',
    intro:
      'Công cụ tính điểm xét tuyển Đại học của ELEC Science AI giúp học sinh lớp 12 tính chính xác điểm xét tốt nghiệp THPT, mức điểm ưu tiên khu vực/đối tượng (áp dụng công thức giảm trừ tuyến tính từ mốc 22,5 điểm) và tổng điểm các tổ hợp A00, A01, B00, D07 theo quy chế mới nhất của Bộ GD&ĐT.',
    specs: {
      subject: 'Tuyển sinh Đại học & Xét công nhận Tốt nghiệp THPT',
      method: 'Công thức quy chế Bộ GD&ĐT + Giảm trừ điểm ưu tiên tuyến tính từ 22,5 điểm',
      audience: 'Học sinh THPT Lớp 12 và Phụ huynh, Giáo viên tư vấn tuyển sinh',
    },
    highlights: [
      'Hỗ trợ đầy đủ các tổ hợp KHTN phổ biến: A00 (Toán-Lý-Hóa), A01 (Toán-Lý-Anh), B00 (Toán-Hóa-Sinh), D07 (Toán-Hóa-Anh) và tổ hợp mới.',
      'Tự động tính mức điểm ưu tiên thực nhận theo công thức: [(30 - Tổng điểm 3 môn) / 7,5] × Mức điểm ưu tiên quy định khi tổng điểm từ 22,5 trở lên.',
      'Kết nối trực tiếp sang công cụ Tra cứu điểm chuẩn để đối chiếu khả năng trúng tuyển vào các trường đại học.',
    ],
    steps: [
      'Nhập điểm thi dự kiến hoặc điểm thực tế của các môn học và điểm trung bình học bạ các năm THPT.',
      'Chọn khu vực ưu tiên (KV1, KV2-NT, KV2, KV3) và đối tượng ưu tiên (nếu có).',
      'Xem ngay kết quả điểm xét tốt nghiệp THPT, tổng điểm từng tổ hợp xét tuyển đại học sau khi cộng điểm ưu tiên và đối chiếu điểm chuẩn.',
    ],
    faqs: [
      {
        q: 'Công cụ tính điểm trên ELEC AI có áp dụng quy chế giảm trừ điểm ưu tiên từ 22,5 điểm không?',
        a: 'Có. Khi tổng điểm 3 môn trong tổ hợp đạt từ 22,5 điểm trở lên (theo thang điểm 10), hệ thống tự động tính điểm ưu tiên theo công thức: Điểm ưu tiên = [(30 - Tổng điểm đạt được) / 7,5] × Mức điểm ưu tiên quy định.',
      },
      {
        q: 'Có thể tính cùng lúc nhiều tổ hợp xét tuyển A00, A01, B00, D07 không?',
        a: 'Có. Chỉ cần nhập điểm các môn Toán, Vật lí, Hóa học, Sinh học, Tiếng Anh, hệ thống sẽ tự động tổng hợp điểm cho tất cả các tổ hợp để bạn chọn phương án tối ưu nhất.',
      },
    ],
  },
  {
    slug: 'tra-cuu-diem-chuan',
    label: 'Tra cứu điểm chuẩn Đại học',
    title: 'Tra Cứu Điểm Chuẩn Đại Học & ĐGNL Mới Nhất · ELEC AI',
    description:
      'Tra cứu điểm chuẩn các trường đại học hàng đầu, đối chiếu ngưỡng điểm xét tuyển THPTQG và Đánh giá năng lực phù hợp mục tiêu cá nhân.',
    h1: 'Tra Cứu Điểm Chuẩn Đại Học & Đánh Giá Năng Lực Trên Toàn Quốc',
    intro:
      'Hệ thống Tra cứu điểm chuẩn Đại học trên ELEC Science AI cho phép tìm kiếm, so sánh điểm chuẩn qua các năm của các trường đại học hàng đầu Việt Nam theo cả phương thức điểm thi Tốt nghiệp THPT (A00, A01, B00, D07) và phương thức Đánh giá năng lực / Đánh giá tư duy (HSA, TSA, V-ACT).',
    specs: {
      subject: 'Dữ liệu Điểm chuẩn & Đề án tuyển sinh các trường Đại học Việt Nam',
      method: 'Tìm kiếm theo trường/ngành/tổ hợp + Phân tích độ an toàn nguyện vọng bằng AI',
      audience: 'Học sinh THPT và Thí sinh xét tuyển Đại học',
    },
    highlights: [
      'So sánh xu hướng điểm chuẩn giữa các năm và các phương thức xét tuyển của từng ngành, từng trường.',
      'Phân loại nguyện vọng theo 3 mức: An toàn, Vừa sức và Thử thách dựa trên năng lực KHTN hiện tại của học sinh.',
      'Liên kết trực tiếp với Lộ trình ôn thi Elo để lập kế hoạch bù đắp số điểm còn thiếu.',
    ],
    steps: [
      'Nhập tên trường đại học, mã trường, tên ngành học hoặc chọn tổ hợp xét tuyển (A00, A01, B00, D07...).',
      'Nhập mức điểm hiện tại hoặc điểm mục tiêu của bạn để hệ thống lọc danh sách ngành phù hợp.',
      'Lưu ngành/trường vào danh sách Nguyện vọng mục tiêu để hệ thống tự động đồng bộ với Lộ trình ôn thi KHTN.',
    ],
    faqs: [
      {
        q: 'Có thể tra cứu điểm chuẩn theo cả phương thức THPT và ĐGNL trên ELEC AI không?',
        a: 'Có. Công cụ hỗ trợ đối chiếu cả điểm thi tốt nghiệp THPT theo tổ hợp lẫn ngưỡng điểm Đánh giá năng lực (HSA, V-ACT) và Đánh giá tư duy (TSA) của nhiều trường đại học lớn.',
      },
      {
        q: 'Làm sao biết mức điểm hiện tại của mình có an toàn với ngành học mong muốn không?',
        a: 'Hệ thống đối chiếu điểm năng lực dự kiến của bạn với lịch sử điểm chuẩn ngành đó để đánh giá xác suất và phân nhóm Nguyện vọng An toàn, Vừa sức hoặc Thử thách.',
      },
    ],
  },
  {
    slug: 'dinh-huong-nghe-nghiep',
    label: 'Định hướng nghề nghiệp RIASEC',
    title: 'Định Hướng Nghề Nghiệp AI & Test RIASEC · ELEC AI',
    description:
      'Khám phá ngành học và nghề nghiệp phù hợp với năng lực KHTN qua bài trắc nghiệm hướng nghiệp RIASEC kết hợp phân tích AI.',
    h1: 'Định Hướng Nghề Nghiệp & Chọn Ngành Đại Học Với Mô Hình RIASEC + AI',
    intro:
      'Phân hệ Định hướng nghề nghiệp của ELEC Science AI kết hợp bài trắc nghiệm mật mã Holland (RIASEC — 6 nhóm tính cách nghề nghiệp) với phân tích năng lực học tập thực tế các môn Lý – Hóa – Sinh để gợi ý chính xác nhóm ngành STEM, Y Dược, Kỹ thuật, Công nghệ thông tin và Kinh tế phù hợp nhất.',
    specs: {
      subject: 'Hướng nghiệp THPT & Tư vấn chọn ngành Đại học',
      method: 'Mô hình trắc nghiệm tâm lý Holland (RIASEC) + Phân tích năng lực KHTN bằng AI',
      audience: 'Học sinh THCS (chọn tổ hợp lớp 10) và Học sinh THPT (chọn ngành Đại học)',
    },
    highlights: [
      'Đánh giá toàn diện 6 nhóm tính cách nghề nghiệp: Kỹ thuật (R), Nghiên cứu (I), Nghệ thuật (A), Xã hội (S), Quản lý (E), Nghiệp vụ (C).',
      'Gợi ý danh sách ngành học, tổ hợp môn xét tuyển và các trường đại học đào tạo uy tín tại Việt Nam.',
      'Liên kết trực tiếp kết quả hướng nghiệp RIASEC với lộ trình ôn thi KHTN cá nhân hóa.',
    ],
    steps: [
      'Hoàn thành bộ câu hỏi trắc nghiệm sở thích và xu hướng hành động theo chuẩn mô hình Holland (RIASEC).',
      'Xem biểu đồ radar phân tích 6 nhóm tính cách nghề nghiệp và mã Holland nổi trội của bản thân.',
      'Nhận danh sách ngành đại học, nghề nghiệp tương lai và tổ hợp môn KHTN phù hợp để bắt đầu lộ trình ôn luyện.',
    ],
    faqs: [
      {
        q: 'Bài test RIASEC trên ELEC AI giúp ích gì cho học sinh THPT?',
        a: 'Giúp học sinh hiểu rõ thế mạnh và xu hướng nghề nghiệp của bản thân theo 6 nhóm Holland, từ đó thu hẹp danh sách ngành học phù hợp và chọn đúng tổ hợp môn KHTN để ôn thi đại học.',
      },
      {
        q: 'Mô hình RIASEC gồm những nhóm tính cách nào?',
        a: 'Gồm 6 nhóm: Realistic (Kỹ thuật/Thực tế), Investigative (Nghiên cứu/Phân tích), Artistic (Nghệ thuật/Sáng tạo), Social (Xã hội/Giáo dục/Y tế), Enterprising (Quản lý/Kinh doanh) và Conventional (Nghiệp vụ/Quy trình).',
      },
    ],
  },
  {
    slug: 'tro-choi-khoa-hoc',
    label: 'Trò chơi Khoa học & Lab 3D',
    title: 'Trò Chơi Khoa Học & Phòng Thí Nghiệm Hóa 3D · ELEC AI',
    description:
      'Học Vật lí, Hóa học, Sinh học qua phòng thí nghiệm ảo 3D tương tác, Đấu nguyên tố, Sudoku Hóa học, Jeopardy và Quiz tốc độ.',
    h1: 'Phòng Thí Nghiệm Hóa Học 3D & Trò Chơi Ôn Tập Khoa Học Tự Nhiên',
    intro:
      'Phân hệ Trò chơi Khoa học & Lab 3D của ELEC Science AI biến việc học Vật lí, Hóa học, Sinh học thành trải nghiệm tương tác trực quan qua Phòng thí nghiệm Hóa học 3D (Three.js) và hơn 10 trò chơi giáo dục gắn liền với ngân hàng câu hỏi chương trình GDPT 2018.',
    specs: {
      subject: 'Mô phỏng thí nghiệm Hóa học 3D & Trò chơi ôn tập Vật lí – Hóa học – Sinh học',
      method: 'Đồ họa WebGL / Three.js + Gamification kết nối Sổ tay lỗi sai SRS',
      audience: 'Học sinh THCS, THPT và Giáo viên tổ chức hoạt động khởi động trên lớp',
    },
    highlights: [
      'Phòng thí nghiệm Hóa học 3D trực quan hóa dụng cụ, hóa chất, hiện tượng phản ứng và mô hình phân tử ngay trên trình duyệt.',
      'Hệ thống trò chơi ôn tập phong phú: Đấu nguyên tố, Sudoku Hóa học, Jeopardy, Bắt gà 2D, Ná cao su, Kéo co, Đua xe trắc nghiệm, Dò mìn KHTN.',
      'Mọi câu trả lời sai trong trò chơi đều tự động được đồng bộ sang Sổ tay lỗi sai SRS để học sinh ôn lại.',
    ],
    steps: [
      'Chọn Phòng thí nghiệm Hóa học 3D hoặc một trò chơi ôn tập yêu thích trong Game Hub.',
      'Chọn môn học (Vật lí, Hóa học, Sinh học), khối lớp và chuyên đề câu hỏi muốn luyện tập.',
      'Tham gia thử thách, tích lũy điểm kinh nghiệm (XP) lên Bảng xếp hạng và xem lại lời giải các câu trả lời sai.',
    ],
    faqs: [
      {
        q: 'Chơi trò chơi khoa học trên ELEC AI có giúp ôn thi thật không?',
        a: 'Có. Toàn bộ câu hỏi trong trò chơi được lấy trực tiếp từ ngân hàng câu hỏi chuyên đề Vật lí, Hóa học, Sinh học THPT; điểm số được lưu lại và câu trả lời sai tự động đi vào Sổ tay lỗi sai SRS.',
      },
      {
        q: 'Phòng thí nghiệm Hóa học 3D có an toàn và miễn phí không?',
        a: 'Hoàn toàn miễn phí và an toàn tuyệt đối trên trình duyệt web, giúp học sinh quan sát màu sắc kết tủa, khí thoát ra và hiện tượng hóa học mà không lo rủi ro hóa chất.',
      },
    ],
  },
  {
    slug: 'ai-doc-studio',
    label: 'AI Doc Studio',
    title: 'AI Doc Studio — Tóm Tắt PDF, Tạo Flashcard & Quiz · ELEC AI',
    description:
      'Tải lên PDF hoặc tài liệu học tập để AI tự động tóm tắt ý chính, trích xuất công thức và tạo bộ flashcard, câu hỏi trắc nghiệm ôn tập.',
    h1: 'AI Doc Studio — Tóm Tắt Tài Liệu PDF, Tạo Flashcard & Quiz Tự Động',
    intro:
      'AI Doc Studio trên ELEC Science AI giúp học sinh và giáo viên chuyển đổi bất kỳ file PDF giáo trình, đề cương ôn tập hoặc văn bản bài giảng dài hàng chục trang thành bản tóm tắt có cấu trúc, bảng tổng hợp công thức, bộ thẻ ghi nhớ Flashcard và đề trắc nghiệm kiểm tra chỉ trong vài giây.',
    specs: {
      subject: 'Tài liệu học tập đa môn (Vật lí, Hóa học, Sinh học, Toán, Văn, Anh...)',
      method: 'Trích xuất văn bản PDF/OCR + Tóm tắt cấu trúc AI + Sinh Flashcard & Quiz tự động',
      audience: 'Học sinh THPT, Sinh viên và Giáo viên biên soạn học liệu',
    },
    highlights: [
      'Trích xuất chính xác trọng tâm kiến thức, định nghĩa, công thức KaTeX và khái niệm cốt lõi từ tài liệu PDF hoặc văn bản.',
      'Tự động sinh bộ thẻ ghi nhớ Flashcard (mặt trước / mặt sau) và bộ câu hỏi trắc nghiệm kèm giải thích để tự kiểm tra ngay.',
      'Cho phép hỏi đáp trực tiếp với nội dung tài liệu vừa tải lên để làm rõ các đoạn khó hiểu.',
    ],
    steps: [
      'Tải lên file tài liệu PDF hoặc dán trực tiếp nội dung văn bản bài học vào AI Doc Studio.',
      'Chọn tác vụ mong muốn: Tóm tắt trọng tâm, Trích xuất bảng công thức, Tạo bộ Flashcard hoặc Tạo đề Quiz trắc nghiệm.',
      'Ôn tập ngay trên thẻ Flashcard hoặc làm bài Quiz vừa tạo và lưu kết quả vào hồ sơ học tập.',
    ],
    faqs: [
      {
        q: 'AI Doc Studio hỗ trợ những định dạng tài liệu nào?',
        a: 'Hệ thống hỗ trợ tải lên trực tiếp file PDF (giáo trình, chuyên đề, đề cương) hoặc dán văn bản bài học để AI phân tích và tạo bộ học liệu ôn tập.',
      },
      {
        q: 'Có thể tạo câu hỏi trắc nghiệm tự động từ file đề cương PDF không?',
        a: 'Có. Chỉ sau vài giây xử lý tài liệu PDF, AI Doc Studio sẽ tự động sinh bộ câu hỏi trắc nghiệm bám sát nội dung file kèm đáp án và giải thích chi tiết.',
      },
    ],
  },
  {
    slug: 'bang-phan-tuong-tac',
    label: 'Bảng phấn tương tác',
    title: 'Bảng Phấn Tương Tác KHTN Trực Tuyến · ELEC AI',
    description:
      'Bảng phấn tương tác trực tuyến hỗ trợ vẽ sơ đồ tư duy, mô phỏng bài giảng và giải thích trực quan các bài tập Vật lí, Hóa học, Sinh học.',
    h1: 'Bảng Phấn Tương Tác KHTN Trực Tuyến Cho Học Sinh & Giáo Viên',
    intro:
      'Bảng phấn tương tác (Interactive Chalkboard) của ELEC Science AI là không gian trình bày trực quan kết hợp AI, hỗ trợ vẽ sơ đồ mạch điện, hình học không gian, biểu đồ lực cơ học, chuỗi phản ứng hóa học và trình diễn lời giải từng bước sống động như trên bảng lớp học.',
    specs: {
      subject: 'Trực quan hóa bài giảng & bài tập Vật lí, Hóa học, Sinh học, Toán học',
      method: 'Canvas tương tác thời gian thực + Trình diễn lời giải từng bước bằng AI',
      audience: 'Học sinh tự học trực quan và Giáo viên giảng dạy trực tuyến / trên lớp',
    },
    highlights: [
      'Trực quan hóa lời giải từng bước cùng trợ lý AI trên khung bảng phấn với công thức KaTeX và hình vẽ minh họa.',
      'Hỗ trợ phác thảo sơ đồ tư duy, hình không gian, phân tích lực cơ học và cơ chế phản ứng.',
      'Phù hợp cho cả việc tự học tại nhà và trình chiếu giảng dạy trực tiếp trên lớp học.',
    ],
    steps: [
      'Mở Bảng phấn tương tác và nhập bài toán hoặc chủ đề KHTN cần minh họa.',
      'Sử dụng bộ công cụ vẽ trực quan hoặc yêu cầu AI trình bày từng bước lời giải lên mặt bảng.',
      'Tương tác, ghi chú bổ sung trực tiếp trên bảng để nắm bắt trọn vẹn bản chất hình học và hiện tượng khoa học.',
    ],
    faqs: [
      {
        q: 'Bảng phấn tương tác trên ELEC AI dùng để làm gì?',
        a: 'Dùng để trình bày lời giải từng bước một cách trực quan, phác thảo sơ đồ mạch điện, biểu đồ lực Vật lí, sơ đồ phản ứng Hóa học, cơ chế Sinh học và hỗ trợ giáo viên giảng dạy.',
      },
      {
        q: 'Bảng phấn có hiển thị được công thức toán – lý – hóa không?',
        a: 'Có. Bảng phấn tích hợp bộ dựng công thức chuẩn KaTeX cùng hình vẽ minh họa trực quan theo từng bước giải.',
      },
    ],
  },
  {
    slug: 'quiz',
    label: 'Luyện tập Quiz SRS',
    title: 'Luyện Tập Quiz KHTN & Ôn Tập Ngắt Quãng SRS · ELEC AI',
    description:
      'Hệ thống câu hỏi trắc nghiệm thông minh đa môn thích ứng điểm mạnh yếu, tự động lưu câu sai để củng cố kiến thức đúng thời điểm.',
    h1: 'Luyện Tập Quiz KHTN Thông Minh & Ôn Tập Ngắt Quãng (SRS)',
    intro:
      'Hệ thống Quiz KHTN của ELEC Science AI cung cấp ngân hàng câu hỏi trắc nghiệm thích ứng cho 3 môn Vật lí, Hóa học, Sinh học lớp 10, 11, 12, kết hợp thuật toán ghi nhớ ngắt quãng SuperMemo SM-2 (SRS) để tự động lưu câu trả lời sai và nhắc học sinh ôn lại đúng thời điểm sắp quên.',
    specs: {
      subject: 'Trắc nghiệm Vật lí, Hóa học, Sinh học Lớp 10, 11, 12 (GDPT 2018)',
      method: 'Thuật toán lặp lại ngắt quãng SuperMemo SM-2 + Thích ứng năng lực Elo',
      audience: 'Học sinh THCS, THPT rèn luyện phản xạ trắc nghiệm hàng ngày',
    },
    highlights: [
      'Nhiều chế độ luyện tập: Theo chuyên đề, Thử thách hôm nay, Time Attack (đấu tốc độ), Thẻ ghi nhớ (Flashcards) và Luyện riêng câu sai.',
      'Chấm điểm tức thì sau mỗi câu, hiển thị giải thích bản chất chi tiết cho từng phương án đúng/sai.',
      'Tự động lập lịch nhắc ôn lại những câu hay nhầm lẫn bằng thuật toán SuperMemo SM-2 trước khi đường cong quên lãng đi xuống.',
    ],
    steps: [
      'Chọn môn học (Vật lí, Hóa học, Sinh học), khối lớp và chuyên đề hoặc chọn chế độ Ôn tập câu sai SRS.',
      'Trả lời các câu hỏi trắc nghiệm và đọc kỹ phần giải thích chi tiết ngay sau khi chọn đáp án.',
      'Quay lại mục Luyện câu sai theo lịch nhắc hàng ngày để củng cố trí nhớ dài hạn và duy trì chuỗi Streak.',
    ],
    faqs: [
      {
        q: 'Thuật toán SRS trong Quiz ELEC AI hoạt động ra sao?',
        a: 'Hệ thống áp dụng thuật toán SuperMemo SM-2 để tính toán khoảng cách ngày ôn lại (Interval) dựa trên độ chính xác và mức độ vững vàng của bạn: câu trả lời sai sẽ quay lại sớm, câu trả lời đúng liên tiếp sẽ giãn cách dài dần.',
      },
      {
        q: 'Làm sao để chỉ ôn lại những câu mình từng làm sai?',
        a: 'Mọi câu làm sai trong Quiz, Phòng thi ảo hoặc Trò chơi đều tự động vào Sổ tay lỗi sai. Bạn chỉ cần bấm chọn chế độ "Luyện câu sai" để ôn riêng các câu đó mà không phải làm lại cả đề.',
      },
    ],
  },
  {
    slug: 'bang-xep-hang',
    label: 'Bảng xếp hạng KHTN',
    title: 'Bảng Xếp Hạng Chuỗi Học & Thành Tích KHTN · ELEC AI',
    description:
      'Vinh danh học sinh và lớp học có chuỗi ôn tập bền bỉ và thành tích luyện thi KHTN nổi bật trên ELEC Science AI.',
    h1: 'Bảng Xếp Hạng Chuỗi Ngày Học & Thành Tích Luyện Thi KHTN',
    intro:
      'Bảng xếp hạng ELEC Science AI theo dõi và vinh danh những học sinh cùng tập thể lớp học có chuỗi ngày học liên tục (Streak), điểm kinh nghiệm (XP) và điểm năng lực Elo KHTN cao nhất trên toàn hệ thống, tạo động lực học tập bền bỉ mỗi ngày.',
    specs: {
      subject: 'Thi đua học tập Vật lí, Hóa học, Sinh học toàn hệ thống & theo lớp học',
      method: 'Tích lũy điểm kinh nghiệm (XP) + Chuỗi ngày học liên tục (Streak) + Điểm Elo',
      audience: 'Học sinh và các Lớp học trên nền tảng ELEC Science AI',
    },
    highlights: [
      'Cập nhật liên tục theo tiến độ hoàn thành bài tập, quiz SRS, phòng thi ảo và trò chơi khoa học.',
      'Bảng xếp hạng riêng cho từng lớp học và bảng vinh danh toàn hệ thống theo tuần / tháng.',
      'Tạo động lực duy trì thói quen tự học Khoa học Tự nhiên đều đặn mỗi ngày.',
    ],
    steps: [
      'Đăng nhập tài khoản học sinh và tham gia lớp học của bạn trên ELEC Science AI.',
      'Hoàn thành ít nhất một hoạt động học tập mỗi ngày (hỏi bài AI, làm Quiz SRS, luyện đề Phòng thi ảo) để giữ lửa chuỗi Streak.',
      'Theo dõi thứ hạng cá nhân và tập thể lớp trên Bảng xếp hạng để chinh phục các huy hiệu thành tích.',
    ],
    faqs: [
      {
        q: 'Làm sao để tăng hạng trên Bảng xếp hạng ELEC AI?',
        a: 'Học sinh tích lũy điểm kinh nghiệm (XP), nâng điểm Elo và duy trì chuỗi ngày học liên tục (Streak) bằng cách hoàn thành bài quiz, luyện đề phòng thi ảo và ôn tập Sổ tay lỗi sai mỗi ngày.',
      },
      {
        q: 'Bảng xếp hạng có phân theo từng lớp học không?',
        a: 'Có. Bên cạnh bảng xếp hạng chung toàn hệ thống, mỗi lớp học do giáo viên tạo đều có bảng xếp hạng thi đua riêng cho các thành viên trong lớp.',
      },
    ],
  },
  {
    slug: 'phong-thi-nghiem-vat-li',
    label: 'Phòng thí nghiệm Vật lí ảo',
    title: 'Phòng Thí Nghiệm Vật Lí Ảo Lớp 8–12 & Olympiad · ELEC AI',
    description:
      '7 mô phỏng Vật lí tương tác thời gian thực: Chuyển động ném xiên, Mạch điện DC, Quang hình học & Thấu kính, Sóng 2D giao thoa, Cơ học 2D, Con lắc kép RK4 và Phân tích số liệu Olympiad.',
    h1: 'Phòng Thí Nghiệm Vật Lí Ảo Tương Tác Lớp 8–12 & Olympiad',
    intro:
      'Phòng thí nghiệm Vật lí ảo trên ELEC Science AI tích hợp 7 mô phỏng vật lí thời gian thực ngay trên trình duyệt: Chuyển động ném xiên, Mạch điện một chiều DC, Quang hình học (Thấu kính hội tụ/phân kì & Khúc xạ Snell), Giao thoa sóng 2D, Cơ học 2D bảo toàn động lượng, Con lắc kép hỗn loạn RK4 và Phân tích số liệu thực nghiệm OLS chuẩn Olympiad.',
    specs: {
      subject: 'Vật lí THCS, THPT (Lớp 8–12 theo GDPT 2018) & Bồi dưỡng Học sinh giỏi / Olympiad',
      method: 'Mô phỏng phương trình vi phân RK4 thời gian thực + Đồ thị tương tác + Hồi quy tuyến tính OLS',
      audience: 'Học sinh THCS, THPT, Đội tuyển HSG Vật lí và Giáo viên trình chiếu minh họa trên lớp',
    },
    highlights: [
      '7 phòng lab chuyên sâu: Ném xiên có lực cản, Mạch điện DC tương tác, Quang hình học & Thấu kính, Giao thoa sóng 2D, Cơ học 2D, Con lắc kép RK4 và Xử lý số liệu thí nghiệm OLS.',
      'Điều chỉnh trực tiếp mọi tham số (góc ném, vận tốc, chiết suất, tiêu cự, điện trở, tần số sóng) và quan sát quỹ đạo, véc-tơ, đồ thị biến thiên tức thì.',
      'Chạy mượt 100% trên trình duyệt web, hoàn toàn miễn phí, không cần cài phần mềm mô phỏng nặng.',
    ],
    steps: [
      'Chọn một trong 7 thí nghiệm Vật lí ảo tương ứng với chuyên đề đang học (Cơ học, Quang học, Sóng, Điện học hoặc Thực nghiệm Olympiad).',
      'Kéo các thanh trượt để thay đổi thông số vật lí (vận tốc, góc, tiêu cự, điện trở, biên độ...) và bấm Chạy mô phỏng.',
      'Quan sát đồ thị, số liệu đo trực tiếp và xuất kết quả phân tích sai số / hồi quy tuyến tính OLS để đối chiếu với lý thuyết SGK.',
    ],
    faqs: [
      {
        q: 'Phòng thí nghiệm Vật lí ảo trên ELEC AI có những mô phỏng nào?',
        a: 'Gồm 7 mô phỏng trực quan: Chuyển động ném xiên, Mạch điện DC, Quang hình học (Thấu kính & Khúc xạ Snell), Giao thoa sóng 2D, Cơ học 2D bảo toàn động lượng, Con lắc kép hỗn loạn RK4 và Thí nghiệm đo g / Ôm / Archimedes phân tích số liệu OLS.',
      },
      {
        q: 'Phòng thí nghiệm Vật lí ảo có dùng cho giảng dạy trên lớp và luyện thi HSG không?',
        a: 'Có. Giáo viên có thể trình chiếu trực tiếp trên màn hình lớp học để minh họa hiện tượng Vật lí trực quan, còn học sinh đội tuyển HSG/Olympiad có thể thực hành xử lý số liệu sai số và hồi quy tuyến tính OLS.',
      },
      {
        q: 'Có cần tải phần mềm để chạy mô phỏng Vật lí trên ELEC Science AI không?',
        a: 'Không. Toàn bộ 7 mô phỏng được tối ưu hóa bằng HTML5 Canvas và thuật toán số RK4 chạy trực tiếp trên trình duyệt máy tính và điện thoại.',
      },
    ],
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
  const faqEntities = [
    ...route.faqs.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
    {
      '@type': 'Question',
      name: 'Ai là nhà sáng lập ELEC AI (ELEC Science AI)?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Nhà sáng lập (Founder) và kỹ sư phát triển chính của ELEC Science AI (ELEC AI / ELECAI) là Nguyễn Thế Duy (biệt danh Tk Media / Duy TK, sinh năm 2010 tại Thái Bình). Facebook chính thức: https://www.facebook.com/nguyentheduytk — Tiểu sử: https://www.elecai.id.vn/nha-sang-lap.',
      },
    },
  ];

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
          datePublished: '2025-09-01',
          dateModified: '2026-11-26',
          isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
          about: { '@id': `${url}#app` },
          mainEntity: { '@id': `${url}#app` },
          author: { '@id': `${SITE_ORIGIN}/#founder` },
          creator: { '@id': `${SITE_ORIGIN}/#founder` },
          publisher: { '@id': `${SITE_ORIGIN}/#org` },
          primaryImageOfPage: {
            '@type': 'ImageObject',
            url: `${SITE_ORIGIN}/img/og-image.png`,
            width: 1200,
            height: 630,
          },
          speakable: {
            '@type': 'SpeakableSpecification',
            cssSelector: ['#aeo-direct-answer', '#geo-key-specs', '#route-faq h3', '#route-faq p'],
          },
        },
        {
          '@type': ['SoftwareApplication', 'WebApplication'],
          '@id': `${url}#app`,
          name: `${route.label} — ELEC Science AI`,
          url,
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Web, Android, iOS, Windows, macOS',
          inLanguage: 'vi-VN',
          isAccessibleForFree: true,
          image: `${SITE_ORIGIN}/img/logo.png`,
          screenshot: `${SITE_ORIGIN}/img/og-image.png`,
          description: route.intro,
          featureList: route.highlights,
          audience: {
            '@type': 'EducationalAudience',
            educationalRole: ['student', 'teacher'],
            audienceType: route.specs.audience,
          },
          author: { '@id': `${SITE_ORIGIN}/#founder` },
          publisher: { '@id': `${SITE_ORIGIN}/#org` },
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'VND',
            availability: 'https://schema.org/InStock',
          },
        },
        {
          '@type': 'HowTo',
          '@id': `${url}#howto`,
          name: `Cách sử dụng ${route.label} trên ELEC Science AI`,
          description: route.description,
          step: route.steps.map((stepText, idx) => ({
            '@type': 'HowToStep',
            position: idx + 1,
            name: `Bước ${idx + 1}`,
            text: stepText,
            url: `${url}#step-${idx + 1}`,
          })),
        },
        FOUNDER_PERSON_LD,
        ORG_LD,
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
          mainEntity: faqEntities,
        },
      ],
    },
    null,
    2
  );
}

function buildStaticRootHtml(route) {
  const otherLinks = SEO_ROUTES.filter((r) => r.slug !== route.slug)
    .map((r) => `<li><a href="/${r.slug}" style="color:#2563eb;text-decoration:none">${escapeHtml(r.label)}</a> — ${escapeHtml(r.description)}</li>`)
    .join('\n          ');

  const highlightsHtml = route.highlights
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join('\n          ');

  const stepsHtml = route.steps
    .map((stepText, idx) => `<li id="step-${idx + 1}"><strong>Bước ${idx + 1}:</strong> ${escapeHtml(stepText)}</li>`)
    .join('\n          ');

  const faqsHtml = route.faqs
    .map(
      (item, idx) => `<article style="margin-bottom:14px">
            <h3 style="font-size:17px;font-weight:600;color:#1e293b;margin-bottom:4px">${idx + 1}. ${escapeHtml(item.q)}</h3>
            <p style="margin:0;color:#475569">${escapeHtml(item.a)}</p>
          </article>`
    )
    .join('\n          ');

  return `<div id="root">
      <header style="max-width:960px;margin:28px auto 16px;padding:0 20px;text-align:center">
        <nav aria-label="Breadcrumb" style="font-size:14px;color:#64748b;margin:0 0 8px">
          <a href="/" style="color:#2563eb;text-decoration:none">ELEC Science AI (ELEC AI)</a> · <span>${escapeHtml(route.label)}</span>
        </nav>
        <h1 style="font-size:28px;font-weight:800;color:#0f172a;line-height:1.3;margin-bottom:8px">
          ${escapeHtml(route.h1)}
        </h1>
        <p id="aeo-direct-answer" style="font-size:17px;color:#475569;max-width:800px;margin:0 auto">
          ${escapeHtml(route.intro)}
        </p>
      </header>
      <main style="max-width:960px;margin:0 auto;padding:0 20px;font:16px/1.7 system-ui,Arial,sans-serif;color:#1e293b">
        <section style="margin-bottom:24px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px 20px">
          <h2 style="font-size:19px;font-weight:700;color:#0f172a;margin:0 0 10px">Thông Số Tóm Tắt (AEO / GEO Quick Specs)</h2>
          <dl id="geo-key-specs" style="margin:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:8px 18px;font-size:15px">
            <dt style="font-weight:700;color:#0f172a">Phân hệ công cụ:</dt>
            <dd style="margin:0 0 4px;color:#334155">${escapeHtml(route.label)} (<a href="https://www.elecai.id.vn/${route.slug}" style="color:#2563eb">https://www.elecai.id.vn/${route.slug}</a>)</dd>
            <dt style="font-weight:700;color:#0f172a">Phạm vi &amp; Môn học:</dt>
            <dd style="margin:0 0 4px;color:#334155">${escapeHtml(route.specs.subject)}</dd>
            <dt style="font-weight:700;color:#0f172a">Phương pháp &amp; Công nghệ:</dt>
            <dd style="margin:0 0 4px;color:#334155">${escapeHtml(route.specs.method)}</dd>
            <dt style="font-weight:700;color:#0f172a">Đối tượng sử dụng:</dt>
            <dd style="margin:0 0 4px;color:#334155">${escapeHtml(route.specs.audience)}</dd>
            <dt style="font-weight:700;color:#0f172a">Nhà sáng lập &amp; Phát triển:</dt>
            <dd style="margin:0 0 4px;color:#334155"><a href="/nha-sang-lap" style="color:#2563eb;font-weight:600">Nguyễn Thế Duy (Duy TK / Tk Media)</a></dd>
          </dl>
        </section>
        <section style="margin-bottom:24px">
          <h2 style="font-size:21px;font-weight:700;color:#0f172a;margin-bottom:10px">Tính năng nổi bật của ${escapeHtml(route.label)}</h2>
          <ul style="padding-left:20px;line-height:1.8">
          ${highlightsHtml}
          </ul>
        </section>
        <section style="margin-bottom:24px">
          <h2 style="font-size:21px;font-weight:700;color:#0f172a;margin-bottom:10px">Hướng dẫn sử dụng từng bước</h2>
          <ol style="padding-left:20px;line-height:1.8">
          ${stepsHtml}
          </ol>
        </section>
        <section id="route-faq" style="margin-bottom:24px">
          <h2 style="font-size:21px;font-weight:700;color:#0f172a;margin-bottom:10px">Câu hỏi thường gặp về ${escapeHtml(route.label)}</h2>
          ${faqsHtml}
          <article>
            <h3 style="font-size:17px;font-weight:600;color:#1e293b;margin-bottom:4px">${route.faqs.length + 1}. Ai là nhà sáng lập ELEC AI (ELEC Science AI)?</h3>
            <p style="margin:0;color:#475569">
              Nhà sáng lập (Founder) và kỹ sư phát triển chính của ELEC Science AI là <strong>Nguyễn Thế Duy</strong> (Tk Media / Duy TK, sinh năm 2010 tại Thái Bình).
              Xem <a href="/nha-sang-lap" style="color:#2563eb">tiểu sử nhà sáng lập</a> hoặc kết nối qua
              <a href="https://www.facebook.com/nguyentheduytk" rel="me noopener noreferrer" style="color:#2563eb">Facebook chính thức</a>.
            </p>
          </article>
        </section>
        <section style="margin-bottom:24px">
          <h2 style="font-size:20px;font-weight:700;color:#0f172a;margin-bottom:10px">Công cụ KHTN liên quan trên ELEC Science AI</h2>
          <ul style="padding-left:20px;line-height:1.8">
          ${otherLinks}
            <li><a href="/cong-dong" style="color:#2563eb;text-decoration:none">Cộng đồng Hỏi đáp KHTN &amp; Ôn thi THPTQG</a> · <a href="/gioi-thieu" style="color:#2563eb;text-decoration:none">Giới thiệu chi tiết ELEC Science AI</a> · <a href="/nha-sang-lap" style="color:#2563eb;text-decoration:none">Nhà sáng lập Nguyễn Thế Duy</a> · <a href="/chinh-sach-bao-mat" style="color:#2563eb;text-decoration:none">Chính sách bảo mật</a> · <a href="/dieu-khoan-su-dung" style="color:#2563eb;text-decoration:none">Điều khoản</a> · <a href="/llms.txt" style="color:#2563eb;text-decoration:none">LLMs.txt</a> · <a href="/llms-full.txt" style="color:#2563eb;text-decoration:none">LLMs-Full.txt</a></li>
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
  const routeKeywords = ROUTE_KEYWORDS[route.slug];
  if (routeKeywords) {
    html = html.replace(
      /<meta\s+name="keywords"\s+content="[\s\S]*?"\s*\/>/,
      `<meta name="keywords" content="${escapeHtml(routeKeywords)}" />`
    );
  }
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
  console.log(`[prerender-seo-routes] Generated ${count} static SEO/AEO/GEO route HTML files in dist/`);
}

main();
