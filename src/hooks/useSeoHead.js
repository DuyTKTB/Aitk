import { useEffect } from 'react';

const SITE_ORIGIN = 'https://aitk-ten.vercel.app';

export const ROUTE_SEO = {
  home: {
    title: 'ELEC AI (ELECAI) — Nền Tảng Học & Luyện Thi Hóa THPT Quốc Gia Chuẩn 2026',
    description: 'Nền tảng học Hóa với trợ lý AI: Giải bài từng bước, bảng tuần hoàn 118 nguyên tố, phòng thi ảo chuẩn format mới Bộ GD&ĐT và quản lý lớp học.',
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
    title: 'Sổ Tay Công Thức Hóa Học 10, 11, 12 Ôn Thi Cấp Tốc · ELEC AI',
    description: 'Tổng hợp công thức hóa học trọng tâm: tính số mol, nồng độ CM, C%, pH, định luật khí lý tưởng và hiệu suất phản ứng.',
    path: '/cong-thuc-hoa-hoc',
  },
  roadmap: {
    title: 'Lộ Trình Ôn Thi THPT Quốc Gia Môn Hóa Chuẩn GDPT 2018 · ELEC AI',
    description: 'Lộ trình kiến thức cá nhân hóa theo điểm Elo và nguyện vọng trường đại học (Bách Khoa, Kinh Tế Quốc Dân, Ngoại Thương, Y Hà Nội).',
    path: '/lo-trinh-on-thi-thpt-quoc-gia',
  },
  'virtual-exams': {
    title: 'Phòng Thi Ảo THPT Quốc Gia Môn Hóa Chuẩn Cấu Trúc 2026 · ELEC AI',
    description: 'Luyện đề thi thử tốt nghiệp THPT môn Hóa bấm giờ thật, cấu trúc 3 phần mới của Bộ GD&ĐT kèm giải chi tiết từng câu.',
    path: '/phong-thi-ao',
  },
  grade: {
    title: 'Tính Điểm Xét Tuyển Đại Học Khối A00, A01, B00, D07 · ELEC AI',
    description: 'Công cụ tính điểm thi tốt nghiệp và xét tuyển đại học chuẩn xác theo quy chế tuyển sinh mới nhất.',
    path: '/tinh-diem-xet-tuyen-dai-hoc',
  },
  ai: {
    title: 'Gia Sư Trợ Lý AI Giải Hóa Học Từng Bước (Step-by-Step) · ELEC AI',
    description: 'Trợ lý AI Hóa học thông minh: giải bài từ ảnh chụp đề, giải thích bản chất hiện tượng phản ứng thay vì chỉ đưa đáp án.',
    path: '/tro-ly-ai-giai-hoa',
  },
  tools: {
    title: 'Kho Tài Liệu & Bộ Công Cụ Hóa Học Trực Tuyến Đầy Đủ Nhất · ELEC AI',
    description: 'Khám phá hơn 50+ công cụ học tập, máy tính hóa học, sách giáo khoa, chuyên đề và AI tuyển chọn dành riêng cho học sinh THPT.',
    path: '/tai-lieu-hoa-hoc',
  },
  quiz: {
    title: 'Luyện Tập Quiz Hóa Học & Ghi Nhớ Lặp Lại Ngắt Quãng (SRS) · ELEC AI',
    description: 'Hệ thống câu hỏi ôn tập thông minh tự động thích ứng với điểm mạnh yếu, lưu trữ câu sai để củng cố kiến thức.',
    path: '/quiz',
  },
  login: {
    title: 'Đăng Nhập Tài Khoản Học Sinh & Giáo Viên · ELEC AI',
    description: 'Đăng nhập để vào lớp học, làm bài thi, lưu tiến độ học tập và sử dụng Trợ lý AI Hóa học.',
    path: '/login',
  },
  register: {
    title: 'Tạo Tài Khoản Học Sinh & Giáo Viên Miễn Phí · ELEC AI',
    description: 'Đăng ký tài khoản ELEC AI miễn phí để bắt đầu học Hóa thông minh cùng Trợ lý AI và tham gia lớp học.',
    path: '/register',
  },
};

export function useSeoHead(page) {
  useEffect(() => {
    const meta = ROUTE_SEO[page] || ROUTE_SEO.home;
    const url = `${SITE_ORIGIN}${meta.path}`;

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

    // 3. Cập nhật Canonical Link
    let canonicalEl = document.querySelector('link[rel="canonical"]');
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.rel = 'canonical';
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.href = url;

    // 4. Cập nhật Open Graph Tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = meta.title;

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.content = meta.description;

    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.content = url;

    // 5. Cập nhật Twitter Card Tags
    const twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle) twTitle.content = meta.title;

    const twDesc = document.querySelector('meta[name="twitter:description"]');
    if (twDesc) twDesc.content = meta.description;
  }, [page]);
}
