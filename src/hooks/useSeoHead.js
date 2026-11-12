import { useEffect } from 'react';

const SITE_ORIGIN = 'https://www.elecai.id.vn';

const NOINDEX_PAGES = new Set(['404', 'admin', 'settings', 'feedback', 'login', 'register']);

export const ROUTE_SEO = {
  home: {
    title: 'ELEC Science AI (ELECAI) — Học & Luyện Thi KHTN Lý Hóa Sinh',
    description: 'Nền tảng học & luyện thi KHTN (Vật lí, Hóa học, Sinh học) chuẩn 2026: Trợ lý AI giải từng bước, Phòng thi ảo THPTQG & ĐGNL, Bảng tuần hoàn & Công thức.',
    path: '/',
    label: 'Trang chủ',
  },
  table: {
    title: 'Bảng Tuần Hoàn Hóa Học 118 Nguyên Tố IUPAC · ELEC AI',
    description: 'Bảng tuần hoàn hóa học trực tuyến 118 nguyên tố: tra cứu cấu hình electron, độ âm điện, khối lượng nguyên tử, bán kính và so sánh tính chất.',
    path: '/bang-tuan-hoan',
    label: 'Bảng tuần hoàn 118 nguyên tố',
  },
  balance: {
    title: 'Cân Bằng Phương Trình Hóa Học Tự Động Online · ELEC AI',
    description: 'Máy cân bằng phương trình hóa học (PTHH) bằng đại số tuyến tính chính xác cao, chỉ rõ chất oxi hóa, chất khử và quá trình oxi hóa khử.',
    path: '/can-bang-phuong-trinh-hoa-hoc',
    label: 'Cân bằng phương trình Hóa học',
  },
  formulas: {
    title: 'Sổ Tay Công Thức Lý Hóa Sinh Đầy Đủ Nhất · ELEC AI',
    description: 'Tổng hợp công thức KHTN trọng tâm: dao động, sóng, điện xoay chiều (Vật lí); tính mol, pH, dung dịch (Hóa học); ADN, gen, di truyền (Sinh học).',
    path: '/cong-thuc-hoa-hoc',
    label: 'Sổ tay công thức KHTN',
  },
  roadmap: {
    title: 'Lộ Trình Ôn Thi KHTN Lý Hóa Sinh GDPT 2018 · ELEC AI',
    description: 'Lộ trình kiến thức cá nhân hóa theo điểm Elo và nguyện vọng đại học khối A00, B00, A01, D07 (Bách Khoa, Kinh Tế Quốc Dân, Y Hà Nội, Ngoại Thương).',
    path: '/lo-trinh-on-thi-thpt-quoc-gia',
    label: 'Lộ trình ôn thi KHTN',
  },
  'virtual-exams': {
    title: 'Phòng Thi Ảo THPTQG & ĐGNL Lý Hóa Sinh 2026 · ELEC AI',
    description: 'Luyện đề thi thử tốt nghiệp THPT và ĐGNL (HSA, TSA, V-ACT) các môn Vật lí, Hóa học, Sinh học bấm giờ thật, cấu trúc 3 phần mới kèm lời giải chi tiết.',
    path: '/phong-thi-ao',
    label: 'Phòng thi ảo THPTQG & ĐGNL',
  },
  grade: {
    title: 'Tính Điểm Xét Tuyển Đại Học A00 A01 B00 D07 · ELEC AI',
    description: 'Công cụ tính điểm thi tốt nghiệp THPT và quy đổi điểm xét tuyển đại học chuẩn xác theo quy chế tuyển sinh mới nhất của Bộ GD&ĐT.',
    path: '/tinh-diem-xet-tuyen-dai-hoc',
    label: 'Tính điểm xét tuyển Đại học',
  },
  admission: {
    title: 'Tra Cứu Điểm Chuẩn Đại Học & ĐGNL Mới Nhất · ELEC AI',
    description: 'Tra cứu điểm chuẩn các trường đại học hàng đầu, đối chiếu ngưỡng điểm xét tuyển THPTQG và Đánh giá năng lực phù hợp mục tiêu cá nhân.',
    path: '/tra-cuu-diem-chuan',
    label: 'Tra cứu điểm chuẩn Đại học',
  },
  career: {
    title: 'Định Hướng Nghề Nghiệp AI & Test RIASEC · ELEC AI',
    description: 'Khám phá ngành học và nghề nghiệp phù hợp với năng lực KHTN qua bài trắc nghiệm hướng nghiệp RIASEC kết hợp phân tích AI.',
    path: '/dinh-huong-nghe-nghiep',
    label: 'Định hướng nghề nghiệp RIASEC',
  },
  'doc-studio': {
    title: 'AI Doc Studio — Tóm Tắt PDF, Tạo Flashcard & Quiz · ELEC AI',
    description: 'Tải lên PDF hoặc tài liệu học tập để AI tự động tóm tắt ý chính, trích xuất công thức và tạo bộ flashcard, câu hỏi trắc nghiệm ôn tập.',
    path: '/ai-doc-studio',
    label: 'AI Doc Studio',
  },
  chalkboard: {
    title: 'Bảng Phấn Tương Tác KHTN Trực Tuyến · ELEC AI',
    description: 'Bảng phấn tương tác trực tuyến hỗ trợ vẽ sơ đồ tư duy, mô phỏng bài giảng và giải thích trực quan các bài tập Vật lí, Hóa học, Sinh học.',
    path: '/bang-phan-tuong-tac',
    label: 'Bảng phấn tương tác',
  },
  games: {
    title: 'Trò Chơi Khoa Học & Phòng Thí Nghiệm Hóa 3D · ELEC AI',
    description: 'Học Vật lí, Hóa học, Sinh học qua phòng thí nghiệm ảo 3D tương tác, Đấu nguyên tố, Sudoku Hóa học, Jeopardy và Quiz tốc độ.',
    path: '/tro-choi-khoa-hoc',
    label: 'Trò chơi Khoa học & Lab 3D',
  },
  leaderboard: {
    title: 'Bảng Xếp Hạng Chuỗi Học & Thành Tích KHTN · ELEC AI',
    description: 'Vinh danh học sinh và lớp học có chuỗi ôn tập bền bỉ và thành tích luyện thi KHTN nổi bật trên ELEC Science AI.',
    path: '/bang-xep-hang',
    label: 'Bảng xếp hạng KHTN',
  },
  ai: {
    title: 'Trợ Lý AI Giải Lý Hóa Sinh Từng Bước Từ Ảnh · ELEC AI',
    description: 'Gia sư AI KHTN thông minh: giải bài từ ảnh chụp đề Vật lí, Hóa học, Sinh học, giải thích bản chất hiện tượng và công thức thay vì chỉ đưa đáp án.',
    path: '/tro-ly-ai-giai-hoa',
    label: 'Trợ lý AI giải KHTN',
  },
  tools: {
    title: 'Kho Tài Liệu & 50+ Công Cụ KHTN Lý Hóa Sinh · ELEC AI',
    description: 'Khám phá hơn 50 công cụ học tập, máy tính khoa học, sách giáo khoa, chuyên đề và công cụ AI tuyển chọn cho học sinh THCS và THPT.',
    path: '/tai-lieu-hoa-hoc',
    label: 'Kho tài liệu & Công cụ KHTN',
  },
  quiz: {
    title: 'Luyện Tập Quiz KHTN & Ôn Tập Ngắt Quãng SRS · ELEC AI',
    description: 'Hệ thống câu hỏi trắc nghiệm thông minh đa môn thích ứng điểm mạnh yếu, tự động lưu câu sai để củng cố kiến thức đúng thời điểm.',
    path: '/quiz',
    label: 'Luyện tập Quiz SRS',
  },
  login: {
    title: 'Đăng Nhập Tài Khoản Học Sinh & Giáo Viên · ELEC AI',
    description: 'Đăng nhập để vào lớp học, làm bài thi, lưu tiến độ học tập và sử dụng Trợ lý AI Khoa học Tự nhiên.',
    path: '/login',
    label: 'Đăng nhập',
  },
  register: {
    title: 'Tạo Tài Khoản Học Sinh & Giáo Viên Miễn Phí · ELEC AI',
    description: 'Đăng ký tài khoản ELEC Science AI miễn phí để bắt đầu học tập và luyện thi KHTN thông minh cùng Trợ lý AI và lớp học trực tuyến.',
    path: '/register',
    label: 'Đăng ký',
  },
};

function updateRouteJsonLd(meta, url, isNoindex) {
  const SCRIPT_ID = 'elec-route-ld';
  let scriptEl = document.getElementById(SCRIPT_ID);
  if (isNoindex || meta.path === '/') {
    if (scriptEl) scriptEl.remove();
    return;
  }
  if (!scriptEl) {
    scriptEl = document.createElement('script');
    scriptEl.id = SCRIPT_ID;
    scriptEl.type = 'application/ld+json';
    document.head.appendChild(scriptEl);
  }
  scriptEl.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: meta.title,
        description: meta.description,
        isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
        inLanguage: 'vi-VN',
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: `${SITE_ORIGIN}/` },
          { '@type': 'ListItem', position: 2, name: meta.label || meta.title, item: url },
        ],
      },
    ],
  });
}

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
    const twUrl = document.querySelector('meta[name="twitter:url"]');
    if (twUrl) twUrl.content = url;

    const twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle) twTitle.content = meta.title;

    const twDesc = document.querySelector('meta[name="twitter:description"]');
    if (twDesc) twDesc.content = meta.description;

    // 7. Cập nhật JSON-LD BreadcrumbList & WebPage theo route
    updateRouteJsonLd(meta, url, isNoindex);
  }, [page]);
}
