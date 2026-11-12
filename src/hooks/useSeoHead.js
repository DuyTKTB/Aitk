import { useEffect } from 'react';

const SITE_ORIGIN = 'https://www.elecai.id.vn';

const NOINDEX_PAGES = new Set(['404', 'admin', 'settings', 'feedback', 'login', 'register']);

export const ROUTE_SEO = {
  home: {
    title: 'ELEC Science AI (ELECAI) — Nền Tảng Học & Luyện Thi Khoa Học Tự Nhiên (Vật lí — Hóa học — Sinh học)',
    description: 'Nền tảng học tập & khảo thí KHTN với trợ lý AI: Giải bài tập từng bước, thư viện công thức 3 môn, phòng thi ảo chuẩn format mới Bộ GD&ĐT và quản lý lớp học.',
    path: '/',
  },
  table: {
    title: 'Bảng Tuần Hoàn Hóa Học 118 Nguyên Tố Tương Tác Chuẩn IUPAC · ELEC AI',
    description: 'Bảng tuần hoàn hóa học trực tuyến đầy đủ 118 nguyên tố: tra cứu cấu hình electron, độ âm điện, bán kính nguyên tử và so sánh tính chất.',
    path: '/bang-tuan-hoan',
  },
  balance: {
    title: 'Cân Bằng Phương Trình Hóa Học Trực Tuyến Bằng Đại Số Tuyến Tính · ELEC AI',
    description: 'Công cụ cân bằng phương trình hóa học (PTHH) tự động chính xác cao, chỉ rõ chất oxi hóa, chất khử và quá trình oxi hóa khử.',
    path: '/can-bang-phuong-trinh-hoa-hoc',
  },
  formulas: {
    title: 'Sổ Tay Công Thức Khoa Học Tự Nhiên (Vật lí — Hóa học — Sinh học) · ELEC AI',
    description: 'Tổng hợp công thức KHTN trọng tâm: dao động, sóng, điện xoay chiều (Vật lí); tính mol, pH, dung dịch (Hóa học); ADN, gen, di truyền Menđen (Sinh học).',
    path: '/cong-thuc-hoa-hoc',
  },
  roadmap: {
    title: 'Lộ Trình Ôn Thi KHTN (Vật lí, Hóa học, Sinh học) Chuẩn GDPT 2018 · ELEC AI',
    description: 'Lộ trình kiến thức cá nhân hóa theo điểm Elo và nguyện vọng trường đại học khối A00, B00, A01, D07 (Bách Khoa, Kinh Tế Quốc Dân, Y Hà Nội, Ngoại Thương).',
    path: '/lo-trinh-on-thi-thpt-quoc-gia',
  },
  'virtual-exams': {
    title: 'Phòng Thi Ảo KHTN: Vật lí, Hóa học, Sinh học Chuẩn Cấu Trúc 2026–2027 · ELEC AI',
    description: 'Luyện đề thi thử tốt nghiệp THPT và ĐGNL (HSA, TSA) các môn Vật lí, Hóa học, Sinh học bấm giờ thật, cấu trúc 3 phần mới kèm giải chi tiết từng câu.',
    path: '/phong-thi-ao',
  },
  grade: {
    title: 'Tính Điểm Xét Tuyển Đại Học Khối A00, A01, B00, D07, KHTN · ELEC AI',
    description: 'Công cụ tính điểm thi tốt nghiệp và xét tuyển đại học chuẩn xác theo quy chế tuyển sinh mới nhất.',
    path: '/tinh-diem-xet-tuyen-dai-hoc',
  },
  admission: {
    title: 'Tra Cứu Điểm Chuẩn Đại Học & ĐGNL (Khối A00, A01, B00, D07) · ELEC AI',
    description: 'Tra cứu điểm chuẩn các trường đại học hàng đầu, đối chiếu ngưỡng điểm xét tuyển THPTQG và Đánh giá năng lực phù hợp mục tiêu cá nhân.',
    path: '/tra-cuu-diem-chuan',
  },
  career: {
    title: 'Định Hướng Nghề Nghiệp AI & Trắc Nghiệm RIASEC Chuẩn · ELEC AI',
    description: 'Khám phá ngành học và nghề nghiệp phù hợp với năng lực KHTN qua bài test RIASEC kết hợp phân tích AI.',
    path: '/dinh-huong-nghe-nghiep',
  },
  'doc-studio': {
    title: 'AI Doc Studio — Tóm Tắt Tài Liệu, Tạo Flashcard & Quiz Tự Động · ELEC AI',
    description: 'Tải lên PDF hoặc tài liệu học tập để AI tự động tóm tắt ý chính, tạo flashcard và bộ câu hỏi trắc nghiệm ôn tập.',
    path: '/ai-doc-studio',
  },
  games: {
    title: 'Trò Chơi Khoa Học Tự Nhiên & Phòng Thí Nghiệm Hóa Học 3D · ELEC AI',
    description: 'Học Vật lí, Hóa học, Sinh học qua phòng thí nghiệm ảo 3D tương tác, Đấu nguyên tố, Sudoku Hóa học, Jeopardy và Quiz tốc độ.',
    path: '/tro-choi-khoa-hoc',
  },
  leaderboard: {
    title: 'Bảng Xếp Hạng Chuỗi Ngày Học & Thành Tích KHTN · ELEC AI',
    description: 'Vinh danh học sinh và lớp học có chuỗi ôn tập bền bỉ và thành tích luyện thi KHTN nổi bật trên ELEC Science AI.',
    path: '/bang-xep-hang',
  },
  ai: {
    title: 'Gia Sư Trợ Lý AI Giải Khoa Học Tự Nhiên (Vật lí — Hóa học — Sinh học) Từng Bước · ELEC AI',
    description: 'Trợ lý AI KHTN thông minh: giải bài từ ảnh chụp đề, giải thích bản chất hiện tượng khoa học, công thức và bước giải thay vì chỉ đưa đáp án.',
    path: '/tro-ly-ai-giai-hoa',
  },
  tools: {
    title: 'Kho Tài Liệu & Bộ Công Cụ Khoa Học Tự Nhiên (Vật lí, Hóa học, Sinh học) Đầy Đủ Nhất · ELEC AI',
    description: 'Khám phá hơn 50+ công cụ học tập, máy tính khoa học, sách giáo khoa, chuyên đề và AI tuyển chọn dành riêng cho học sinh THCS và THPT.',
    path: '/tai-lieu-hoa-hoc',
  },
  quiz: {
    title: 'Luyện Tập Quiz KHTN & Ghi Nhớ Lặp Lại Ngắt Quãng (SRS) · ELEC AI',
    description: 'Hệ thống câu hỏi ôn tập thông minh đa môn thích ứng với điểm mạnh yếu, lưu trữ câu sai để củng cố kiến thức.',
    path: '/quiz',
  },
  login: {
    title: 'Đăng Nhập Tài Khoản Học Sinh & Giáo Viên KHTN · ELEC AI',
    description: 'Đăng nhập để vào lớp học, làm bài thi, lưu tiến độ học tập và sử dụng Trợ lý AI Khoa học Tự nhiên.',
    path: '/login',
  },
  register: {
    title: 'Tạo Tài Khoản Học Sinh & Giáo Viên KHTN Miễn Phí · ELEC AI',
    description: 'Đăng ký tài khoản ELEC Science AI miễn phí để bắt đầu học tập và luyện thi KHTN thông minh cùng Trợ lý AI và lớp học trực tuyến.',
    path: '/register',
  },
};

export function useSeoHead(page) {
  useEffect(() => {
    const meta = ROUTE_SEO[page] || ROUTE_SEO.home;
    const url = `${SITE_ORIGIN}${meta.path}`;
    const isNoindex = NOINDEX_PAGES.has(page);

    // 1. Cập nhật Title
    document.title = meta.title;

    // 2. Cập nhật Meta Description
    let descEl = document.querySelector('meta[name="description"]');
    if (!descEl) {
      descEl = document.createElement('meta');
      descEl.name = 'description';
      document.head.appendChild(descEl);
    }
    descEl.content = meta.description;

    // 3. Cập nhật Meta Robots (noindex các trang riêng tư/404, index cho trang SEO công khai)
    let robotsEl = document.querySelector('meta[name="robots"]');
    if (!robotsEl) {
      robotsEl = document.createElement('meta');
      robotsEl.name = 'robots';
      document.head.appendChild(robotsEl);
    }
    robotsEl.content = isNoindex
      ? 'noindex,nofollow'
      : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1';

    // 4. Cập nhật Canonical & hreflang Links
    let canonicalEl = document.querySelector('link[rel="canonical"]');
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.rel = 'canonical';
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.href = url;

    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((el) => {
      el.href = url;
    });

    // 5. Cập nhật Open Graph Tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = meta.title;

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.content = meta.description;

    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.content = url;

    // 6. Cập nhật Twitter Card Tags
    const twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle) twTitle.content = meta.title;

    const twDesc = document.querySelector('meta[name="twitter:description"]');
    if (twDesc) twDesc.content = meta.description;
  }, [page]);
}
