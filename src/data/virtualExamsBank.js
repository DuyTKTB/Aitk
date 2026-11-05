/* ============================================================
   virtualExamsBank.js — NGÂN HÀNG ĐỀ THI PHÒNG THI ẢO ELEC AI
   ------------------------------------------------------------
   Bao gồm 3 phân khu chuẩn như thiết kế:
     1. Bộ đề VIP môn Hóa học độc quyền ELEC AI – 2027
     2. Bộ đề PRO môn Hóa học độc quyền ELEC AI – 2027
     3. Ngân hàng đề luyện THPTQG môn Hóa học miễn phí – 2026
   Kèm các đề ĐGNL (HSA, TSA, V-ACT, SPT, H-SCA) để lọc theo Kỳ thi.
   ============================================================ */

import { builtinQuestions, BUILTIN_TOPICS } from './roadmapExercises.js';

export const VIRTUAL_EXAMS = [
  /* ── 1. BỘ ĐỀ VIP ĐỘC QUYỀN 2027 (Tím) ── */
  {
    id: 'vip-2027-06',
    year: 2027,
    tier: 'VIP',
    isHot: true,
    examType: 'THPTQG',
    sourceType: 'exclusive',
    badgeLabel: 'ĐỘC QUYỀN ELEC AI',
    title: 'Đề thi thử tốt nghiệp THPTQG 2027 môn Hóa học - Đề độc quyền số 6',
    attemptsCount: 2006,
    questionCount: 28,
    durationMinutes: 50,
    author: 'PGS. TS Nguyễn Mậu Đức',
    institution: 'Trường Đại Học Sư Phạm Hà Nội',
    gradeScope: 'all',
    topics: ['c12-ester', 'c12-carbohydrate', 'c12-amine', 'c12-electro', 'c12-metal', 'c11-equilibrium'],
  },
  {
    id: 'vip-2027-05',
    year: 2027,
    tier: 'VIP',
    isHot: true,
    examType: 'THPTQG',
    sourceType: 'exclusive',
    badgeLabel: 'ĐỘC QUYỀN ELEC AI',
    title: 'Đề thi thử tốt nghiệp THPTQG 2027 môn Hóa học - Đề độc quyền số 5',
    attemptsCount: 2005,
    questionCount: 28,
    durationMinutes: 50,
    author: 'PGS. TS Nguyễn Mậu Đức',
    institution: 'Trường Đại Học Sư Phạm Hà Nội',
    gradeScope: 'all',
    topics: ['c12-ester', 'c12-polymer', 'c12-electro', 'c12-metal-main', 'c12-transition', 'c10-redox'],
  },
  {
    id: 'vip-2027-07',
    year: 2027,
    tier: 'VIP',
    isHot: true,
    examType: 'THPTQG',
    sourceType: 'exclusive',
    badgeLabel: 'ĐỘC QUYỀN ELEC AI',
    title: 'Đề thi thử tốt nghiệp THPTQG 2027 môn Hóa học - Đề độc quyền số 7',
    attemptsCount: 2001,
    questionCount: 28,
    durationMinutes: 50,
    author: 'PGS. TS Nguyễn Mậu Đức',
    institution: 'Trường Đại Học Sư Phạm Hà Nội',
    gradeScope: 'all',
    topics: ['c12-carbohydrate', 'c12-amine', 'c12-transition', 'c11-nitrogen', 'c11-hydrocarbon', 'c10-energy'],
  },
  {
    id: 'vip-2027-11',
    year: 2027,
    tier: 'VIP',
    isHot: true,
    examType: 'THPTQG',
    sourceType: 'exclusive',
    badgeLabel: 'ĐỘC QUYỀN ELEC AI',
    title: 'Đề thi thử tốt nghiệp THPTQG 2027 môn Hóa học - Đề độc quyền số 11',
    attemptsCount: 2000,
    questionCount: 28,
    durationMinutes: 50,
    author: 'Đội ngũ giáo viên ELEC AI',
    institution: 'Hội đồng chuyên môn Hóa THPT',
    gradeScope: 'all',
    topics: ['c12-ester', 'c12-electro', 'c12-sustain', 'c11-alcohol', 'c11-carbonyl', 'c10-bonding'],
  },
  {
    id: 'vip-hsa-2027-01',
    year: 2027,
    tier: 'VIP',
    isHot: true,
    examType: 'HSA',
    sourceType: 'exclusive',
    badgeLabel: 'ĐỘC QUYỀN ELEC AI',
    title: 'Đề thi thử ĐGNL ĐHQG Hà Nội (HSA) 2027 - Phần Khoa học Hóa học Đề số 01',
    attemptsCount: 1840,
    questionCount: 28,
    durationMinutes: 45,
    author: 'PGS. TS Nguyễn Mậu Đức',
    institution: 'ĐHQG Hà Nội & ĐHSP Hà Nội',
    gradeScope: 'all',
    topics: ['c11-equilibrium', 'c11-nitrogen', 'c12-ester', 'c12-electro', 'c10-rate'],
  },
  {
    id: 'vip-tsa-2027-01',
    year: 2027,
    tier: 'VIP',
    isHot: true,
    examType: 'TSA',
    sourceType: 'exclusive',
    badgeLabel: 'ĐỘC QUYỀN ELEC AI',
    title: 'Đề thi Đánh giá tư duy Bách Khoa (TSA) 2027 - Tư duy Khoa học Hóa học Đề 01',
    attemptsCount: 1620,
    questionCount: 28,
    durationMinutes: 45,
    author: 'Đội ngũ giáo viên ELEC AI',
    institution: 'Chuyên gia luyện thi TSA',
    gradeScope: 'all',
    topics: ['c10-energy', 'c11-equilibrium', 'c12-polymer', 'c12-electro', 'c12-transition'],
  },

  /* ── 2. BỘ ĐỀ PRO ĐỘC QUYỀN 2027 (Cam) ── */
  {
    id: 'pro-2027-12',
    year: 2027,
    tier: 'PRO',
    isHot: true,
    examType: 'THPTQG',
    sourceType: 'official',
    badgeLabel: 'ĐỀ CHÍNH THỨC',
    title: 'Đề thi thử THPTQG Hóa học năm 2027 - Đề số 12',
    attemptsCount: 2000,
    questionCount: 28,
    durationMinutes: 50,
    author: 'Đội ngũ ELEC AI',
    institution: '',
    gradeScope: '12',
    topics: ['c12-ester', 'c12-carbohydrate', 'c12-amine', 'c12-polymer'],
  },
  {
    id: 'pro-2027-11',
    year: 2027,
    tier: 'PRO',
    isHot: true,
    examType: 'THPTQG',
    sourceType: 'official',
    badgeLabel: 'ĐỀ CHÍNH THỨC',
    title: 'Đề thi thử THPTQG Hóa học năm 2027 - Đề số 11',
    attemptsCount: 2000,
    questionCount: 28,
    durationMinutes: 50,
    author: 'Đội ngũ ELEC AI',
    institution: '',
    gradeScope: '12',
    topics: ['c12-electro', 'c12-metal', 'c12-metal-main', 'c12-transition'],
  },
  {
    id: 'pro-2027-05',
    year: 2027,
    tier: 'PRO',
    isHot: true,
    examType: 'THPTQG',
    sourceType: 'official',
    badgeLabel: 'ĐỀ CHÍNH THỨC',
    title: 'Đề thi thử THPTQG Hóa học năm 2027 - Đề số 05',
    attemptsCount: 2000,
    questionCount: 28,
    durationMinutes: 50,
    author: 'Đội ngũ ELEC AI',
    institution: '',
    gradeScope: '12',
    topics: ['c12-ester', 'c12-electro', 'c11-equilibrium', 'c11-nitrogen'],
  },
  {
    id: 'pro-2027-04',
    year: 2027,
    tier: 'PRO',
    isHot: true,
    examType: 'THPTQG',
    sourceType: 'official',
    badgeLabel: 'ĐỀ CHÍNH THỨC',
    title: 'Đề thi thử THPTQG Hóa học năm 2027 - Đề số 04',
    attemptsCount: 2000,
    questionCount: 28,
    durationMinutes: 50,
    author: 'Đội ngũ ELEC AI',
    institution: '',
    gradeScope: '11',
    topics: ['c11-equilibrium', 'c11-nitrogen', 'c11-organic-gen', 'c11-hydrocarbon'],
  },
  {
    id: 'pro-2027-03',
    year: 2027,
    tier: 'PRO',
    isHot: true,
    examType: 'THPTQG',
    sourceType: 'official',
    badgeLabel: 'ĐỀ CHÍNH THỨC',
    title: 'Đề thi thử THPTQG Hóa học năm 2027 - Đề số 03',
    attemptsCount: 2000,
    questionCount: 28,
    durationMinutes: 50,
    author: 'Đội ngũ ELEC AI',
    institution: '',
    gradeScope: '11',
    topics: ['c11-alcohol', 'c11-carbonyl', 'c12-ester', 'c12-carbohydrate'],
  },
  {
    id: 'pro-2027-02',
    year: 2027,
    tier: 'PRO',
    isHot: true,
    examType: 'THPTQG',
    sourceType: 'official',
    badgeLabel: 'ĐỀ CHÍNH THỨC',
    title: 'Đề thi thử THPTQG Hóa học năm 2027 - Đề số 02',
    attemptsCount: 2000,
    questionCount: 28,
    durationMinutes: 50,
    author: 'Đội ngũ ELEC AI',
    institution: '',
    gradeScope: '10',
    topics: ['c10-atom', 'c10-periodic', 'c10-bonding', 'c10-redox'],
  },
  {
    id: 'pro-2027-01',
    year: 2027,
    tier: 'PRO',
    isHot: true,
    examType: 'THPTQG',
    sourceType: 'exclusive',
    badgeLabel: 'ĐỀ THAM KHẢO',
    title: 'Đề thi thử THPTQG Hóa học năm 2027 - Đề số 01',
    attemptsCount: 2000,
    questionCount: 28,
    durationMinutes: 50,
    author: 'Đội ngũ ELEC AI',
    institution: '',
    gradeScope: '10',
    topics: ['c10-energy', 'c10-rate', 'c10-halogen', 'c11-equilibrium'],
  },

  /* ── 3. NGÂN HÀNG ĐỀ LUYỆN THPTQG MIỄN PHÍ – 2026 (Xanh dương) ── */
  {
    id: 'free-2026-ninhbinh-01',
    year: 2026,
    tier: 'FREE',
    isHot: false,
    examType: 'THPTQG',
    sourceType: 'schools',
    badgeLabel: 'ĐỀ THI THỬ',
    title: 'Đề thi thử môn Hóa Lớp 12 Sở GD&ĐT Ninh Bình - Năm học 2025–2026 - Mã đề 01',
    attemptsCount: 5182,
    questionCount: 28,
    durationMinutes: 50,
    author: 'Sở GD&ĐT Ninh Bình',
    institution: '',
    gradeScope: '12',
    topics: ['c12-ester', 'c12-carbohydrate', 'c12-amine', 'c12-electro', 'c12-metal'],
  },
  {
    id: 'free-2026-phutho-01',
    year: 2026,
    tier: 'FREE',
    isHot: false,
    examType: 'THPTQG',
    sourceType: 'schools',
    badgeLabel: 'ĐỀ THI THỬ',
    title: 'Đề thi thử môn Hóa Lớp 12 Sở GD&ĐT Phú Thọ - Mức độ Trung bình năm học 2025–2026',
    attemptsCount: 4945,
    questionCount: 28,
    durationMinutes: 50,
    author: 'Sở GD&ĐT Phú Thọ',
    institution: '',
    gradeScope: '12',
    topics: ['c12-ester', 'c12-polymer', 'c12-metal-main', 'c11-equilibrium'],
  },
  {
    id: 'free-2026-bacninh-01',
    year: 2026,
    tier: 'FREE',
    isHot: false,
    examType: 'THPTQG',
    sourceType: 'schools',
    badgeLabel: 'ĐỀ THI THỬ',
    title: 'Đề thi thử môn Hóa Lớp 12 Sở GD&ĐT Bắc Ninh - Năm học 2025–2026 - Mã đề HH1',
    attemptsCount: 4854,
    questionCount: 28,
    durationMinutes: 50,
    author: 'Sở GD&ĐT Bắc Ninh',
    institution: '',
    gradeScope: '12',
    topics: ['c12-carbohydrate', 'c12-amine', 'c12-electro', 'c12-transition'],
  },
  {
    id: 'free-2026-thanhhoa-01',
    year: 2026,
    tier: 'FREE',
    isHot: false,
    examType: 'THPTQG',
    sourceType: 'schools',
    badgeLabel: 'ĐỀ THI THỬ',
    title: 'Đề thi thử môn Hóa Lớp 12 Sở GD&ĐT Thanh Hóa - Năm học 2025–2026 - Mã đề 01',
    attemptsCount: 4797,
    questionCount: 28,
    durationMinutes: 50,
    author: 'Sở GD&ĐT Thanh Hóa',
    institution: '',
    gradeScope: '12',
    topics: ['c12-ester', 'c12-metal', 'c12-sustain', 'c11-nitrogen'],
  },
  {
    id: 'free-2026-chuyenvinh-01',
    year: 2026,
    tier: 'FREE',
    isHot: false,
    examType: 'THPTQG',
    sourceType: 'schools',
    badgeLabel: 'ĐỀ THI THỬ',
    title: 'Đề thi thử môn Hóa Lớp 12 trường THPT Chuyên Đại học Vinh - Năm 2025–2026',
    attemptsCount: 4707,
    questionCount: 28,
    durationMinutes: 50,
    author: 'THPT Chuyên Đại học Vinh',
    institution: '',
    gradeScope: 'all',
    topics: ['c12-ester', 'c12-electro', 'c12-transition', 'c11-equilibrium', 'c10-redox'],
  },
  {
    id: 'free-2026-bacninh-02',
    year: 2026,
    tier: 'FREE',
    isHot: false,
    examType: 'THPTQG',
    sourceType: 'schools',
    badgeLabel: 'ĐỀ THI THỬ',
    title: 'Đề thi thử môn Hóa Lớp 12 Sở GD&ĐT Bắc Ninh - Năm học 2025–2026 - Mã đề 02',
    attemptsCount: 3937,
    questionCount: 28,
    durationMinutes: 50,
    author: 'Sở GD&ĐT Bắc Ninh',
    institution: '',
    gradeScope: '12',
    topics: ['c12-amine', 'c12-polymer', 'c12-metal-main', 'c11-carbonyl'],
  },
  {
    id: 'free-vact-2026-01',
    year: 2026,
    tier: 'FREE',
    isHot: false,
    examType: 'V-ACT',
    sourceType: 'schools',
    badgeLabel: 'ĐỀ THI THỬ',
    title: 'Đề luyện ĐGNL ĐHQG TP.HCM (V-ACT) 2026 - Phần Giải quyết vấn đề Hóa học',
    attemptsCount: 3120,
    questionCount: 28,
    durationMinutes: 45,
    author: 'Đội ngũ ELEC AI',
    institution: '',
    gradeScope: 'all',
    topics: ['c11-equilibrium', 'c11-organic-gen', 'c12-ester', 'c12-electro'],
  },
  /* ── 4. BỘ ĐỀ THI THỬ CÁC TRƯỜNG & SỞ MÙA THI 2025–2026 (TRÍCH XUẤT MỚI) ── */

  /* ── [VIP] ĐỀ THI XUẤT SẮC - TRƯỜNG CHUYÊN & HSG CẤP TỈNH (PHÂN HÓA 9+) ── */
  {
    id: 'cbn-2026-lan1',
    year: 2026,
    tier: 'VIP',
    isHot: true,
    examType: 'THPTQG',
    sourceType: 'schools',
    badgeLabel: 'ĐỀ THI THỬ',
    title: 'Đề khảo sát chất lượng môn Hóa học 12 Lần 1 - THPT Chuyên Bắc Ninh (2025–2026)',
    attemptsCount: 2700,
    questionCount: 28,
    durationMinutes: 50,
    author: 'Tổ Hóa học THPT Chuyên Bắc Ninh',
    institution: 'THPT Chuyên Bắc Ninh',
    gradeScope: '12',
    topics: ['c12-ester', 'c12-carbohydrate', 'c12-amine', 'c12-electro', 'c12-transition'],
  },
  {
    id: 'phutho-hsg-2026-mh',
    year: 2026,
    tier: 'VIP',
    isHot: true,
    examType: 'THPTQG',
    sourceType: 'schools',
    badgeLabel: 'ĐỀ THI THỬ',
    title: 'Đề minh họa kỳ thi chọn Học sinh giỏi cấp tỉnh Lớp 12 môn Hóa - Sở GD&ĐT Phú Thọ (2025–2026)',
    attemptsCount: 2700,
    questionCount: 28,
    durationMinutes: 150,
    author: 'Hội đồng ra đề Sở GD&ĐT Phú Thọ',
    institution: 'Sở GD&ĐT Phú Thọ',
    gradeScope: '12',
    topics: ['c12-ester', 'c12-electro', 'c12-transition', 'c11-equilibrium', 'c10-energy'],
  },
  {
    id: 'haiphong-hsg-2026-bangb',
    year: 2026,
    tier: 'VIP',
    isHot: true,
    examType: 'THPTQG',
    sourceType: 'schools',
    badgeLabel: 'ĐỀ THI THỬ',
    title: 'Đề thi chọn Học sinh giỏi 12 cấp Thành phố môn Hóa Bảng B - Cụm THPT Hải Phòng (15/11/2025)',
    attemptsCount: 2700,
    questionCount: 28,
    durationMinutes: 90,
    author: 'Cụm các trường THPT Hải Phòng',
    institution: 'Sở GD&ĐT Hải Phòng',
    gradeScope: '12',
    topics: ['c12-ester', 'c12-carbohydrate', 'c12-polymer', 'c12-electro', 'c11-nitrogen'],
    variants: ['101', '102', '103', '104'],
  },
  {
    id: 'nghean-hsg-2026-cum',
    year: 2026,
    tier: 'VIP',
    isHot: true,
    examType: 'THPTQG',
    sourceType: 'schools',
    badgeLabel: 'ĐỀ THI THỬ',
    title: 'Đề khảo sát đội tuyển HSG Tỉnh Lớp 12 môn Hóa - Liên trường THPT Nghệ An (2025–2026)',
    attemptsCount: 2700,
    questionCount: 28,
    durationMinutes: 150,
    author: 'Liên trường CL - LVT - NDT - DTNT 2 Nghệ An',
    institution: 'Sở GD&ĐT Nghệ An',
    gradeScope: '12',
    topics: ['c12-ester', 'c12-electro', 'c12-transition', 'c11-equilibrium', 'c10-redox'],
    variants: ['201', '202', '203', '204', 'Đề tự luận'],
  },
  {
    id: 'nkhcm-2026-lan12',
    year: 2026,
    tier: 'VIP',
    isHot: true,
    examType: 'THPTQG',
    sourceType: 'schools',
    badgeLabel: 'ĐỀ THI THỬ',
    title: 'Đề kiểm tra chất lượng Hóa học 12 Lần 12 - THPT Nguyễn Khuyến & Lê Thánh Tông (09/11/2025)',
    attemptsCount: 2700,
    questionCount: 28,
    durationMinutes: 50,
    author: 'Tổ Hóa học Nguyễn Khuyến - Bình Dương',
    institution: 'THCS & THPT Nguyễn Khuyến TP.HCM',
    gradeScope: '12',
    topics: ['c12-ester', 'c12-amine', 'c12-electro', 'c12-metal', 'c11-carbonyl'],
    variants: ['121', '122'],
  },
  {
    id: 'nkhcm-2026-lan09',
    year: 2026,
    tier: 'VIP',
    isHot: true,
    examType: 'THPTQG',
    sourceType: 'schools',
    badgeLabel: 'ĐỀ THI THỬ',
    title: 'Đề kiểm tra thường xuyên Hóa học 12 Lần 9 - THPT Nguyễn Khuyến & Lê Thánh Tông (12/10/2025)',
    attemptsCount: 2700,
    questionCount: 28,
    durationMinutes: 50,
    author: 'Tổ Hóa học Nguyễn Khuyến & Lê Thánh Tông',
    institution: 'THCS & THPT Nguyễn Khuyến TP.HCM',
    gradeScope: '12',
    topics: ['c12-carbohydrate', 'c12-amine', 'c12-polymer', 'c12-electro'],
    variants: ['001', '002'],
  },
  {
    id: 'nkhcm-2026-lan08',
    year: 2026,
    tier: 'VIP',
    isHot: true,
    examType: 'THPTQG',
    sourceType: 'schools',
    badgeLabel: 'ĐỀ THI THỬ',
    title: 'Đề kiểm tra năng lực Hóa học 12 Lần 8 - THPT Lê Thánh Tông & Nguyễn Khuyến (05/10/2025)',
    attemptsCount: 2700,
    questionCount: 28,
    durationMinutes: 50,
    author: 'Tổ Hóa học Lê Thánh Tông',
    institution: 'THPT Lê Thánh Tông TP.HCM',
    gradeScope: '12',
    topics: ['c12-ester', 'c12-carbohydrate', 'c12-amine', 'c11-nitrogen'],
    variants: ['4001', '4002'],
  },
  {
    id: 'nkhcm-2026-lan14-md900',
    year: 2026,
    tier: 'VIP',
    isHot: true,
    examType: 'THPTQG',
    sourceType: 'schools',
    badgeLabel: 'ĐỀ THI THỬ',
    title: 'Đề khảo sát năng lực Hóa học 12 Đợt 26.11 Mã đề 900 - THPT Nguyễn Khuyến TP.HCM (2025–2026)',
    attemptsCount: 2700,
    questionCount: 28,
    durationMinutes: 50,
    author: 'Tổ Hóa học Nguyễn Khuyến',
    institution: 'THCS & THPT Nguyễn Khuyến TP.HCM',
    gradeScope: '12',
    topics: ['c12-ester', 'c12-amine', 'c12-electro', 'c12-metal-main', 'c12-transition'],
  },
  {
    id: 'thaibinh-lqd-2026-lan2',
    year: 2026,
    tier: 'VIP',
    isHot: true,
    examType: 'THPTQG',
    sourceType: 'schools',
    badgeLabel: 'ĐỀ THI THỬ',
    title: 'Đề khảo sát Học sinh giỏi Hóa 12 Lần 2 - THPT Chuyên Lê Quý Đôn Thái Bình (2025–2026)',
    attemptsCount: 2700,
    questionCount: 28,
    durationMinutes: 90,
    author: 'Tổ Hóa học THPT Lê Quý Đôn',
    institution: 'THPT Lê Quý Đôn Thái Bình',
    gradeScope: '12',
    topics: ['c12-ester', 'c12-carbohydrate', 'c12-electro', 'c11-equilibrium', 'c10-rate'],
  },
  {
    id: 'thaibinh-cva-2026-lan2',
    year: 2026,
    tier: 'VIP',
    isHot: true,
    examType: 'THPTQG',
    sourceType: 'schools',
    badgeLabel: 'ĐỀ THI THỬ',
    title: 'Đề thi thử chọn Học sinh giỏi Hóa 12 Lần 2 - THPT Chu Văn An Thái Bình (2025–2026)',
    attemptsCount: 2700,
    questionCount: 28,
    durationMinutes: 90,
    author: 'Tổ Hóa học THPT Chu Văn An',
    institution: 'THPT Chu Văn An Thái Bình',
    gradeScope: '12',
    topics: ['c12-ester', 'c12-amine', 'c12-polymer', 'c12-electro'],
  },
  {
    id: 'thaibinh-ndc-2026-lan2',
    year: 2026,
    tier: 'VIP',
    isHot: true,
    examType: 'THPTQG',
    sourceType: 'schools',
    badgeLabel: 'ĐỀ THI THỬ',
    title: 'Đề khảo sát chất lượng đội tuyển HSG Hóa 12 Lần 2 - THPT Nguyễn Đức Cảnh (2025–2026)',
    attemptsCount: 2700,
    questionCount: 28,
    durationMinutes: 90,
    author: 'Tổ Hóa học THPT Nguyễn Đức Cảnh',
    institution: 'THPT Nguyễn Đức Cảnh Thái Bình',
    gradeScope: '12',
    topics: ['c12-ester', 'c12-carbohydrate', 'c12-electro', 'c12-transition'],
  },
  {
    id: 'thaibinh-bacduyenha-2026-lan3',
    year: 2026,
    tier: 'VIP',
    isHot: true,
    examType: 'THPTQG',
    sourceType: 'schools',
    badgeLabel: 'ĐỀ THI THỬ',
    title: 'Đề khảo sát năng lực Hóa học 12 Đợt 3 - THPT Bắc Duyên Hà Thái Bình (2025–2026)',
    attemptsCount: 2700,
    questionCount: 28,
    durationMinutes: 50,
    author: 'Thầy Hà Đăng Khiêm - THPT Bắc Duyên Hà',
    institution: 'THPT Bắc Duyên Hà Thái Bình',
    gradeScope: '12',
    topics: ['c12-ester', 'c12-carbohydrate', 'c12-amine', 'c12-electro'],
  },

  /* ── [PRO] ĐỀ THI CHẤT LƯỢNG CAO - TRƯỜNG TRỌNG ĐIỂM & CỤM THI ĐUA (MỤC TIÊU 8+) ── */
  {
    id: 'hiephoa1-2026-24md',
    year: 2026,
    tier: 'PRO',
    isHot: false,
    examType: 'THPTQG',
    sourceType: 'schools',
    badgeLabel: 'ĐỀ THI THỬ',
    title: 'Bộ đề khảo sát chất lượng Hóa 12 (24 mã đề) - THPT Hiệp Hòa Số 1 Bắc Giang (2025–2026)',
    attemptsCount: 2000,
    questionCount: 28,
    durationMinutes: 50,
    author: 'Tổ Hóa học THPT Hiệp Hòa Số 1',
    institution: 'THPT Hiệp Hòa Số 1',
    gradeScope: '12',
    topics: ['c12-ester', 'c12-carbohydrate', 'c12-amine', 'c12-electro', 'c12-metal'],
    variants: ['0301', '0302', '0303', '0304', '0305', '0306', '0307', '0308', '0309', '0310', '0311', '0312', '0313', '0314', '0315', '0316', '0317', '0318', '0319', '0320', '0321', '0322', '0323', '0324'],
  },
  {
    id: 'dongdau-phutho-2026-lan1',
    year: 2026,
    tier: 'PRO',
    isHot: false,
    examType: 'THPTQG',
    sourceType: 'schools',
    badgeLabel: 'ĐỀ THI THỬ',
    title: 'Đề khảo sát chất lượng môn Hóa 12 Lần 1 - THPT Đồng Đậu Phú Thọ (2025–2026)',
    attemptsCount: 2000,
    questionCount: 28,
    durationMinutes: 50,
    author: 'Tổ Hóa học THPT Đồng Đậu',
    institution: 'THPT Đồng Đậu Phú Thọ',
    gradeScope: '12',
    topics: ['c12-ester', 'c12-carbohydrate', 'c12-amine', 'c11-carbonyl'],
  },
  {
    id: 'khoaichau-hungyen-2026-hsg',
    year: 2026,
    tier: 'PRO',
    isHot: false,
    examType: 'THPTQG',
    sourceType: 'schools',
    badgeLabel: 'ĐỀ THI THỬ',
    title: 'Đề thi chọn Học sinh giỏi cấp trường môn Hóa 12 - THPT Khoái Châu Hưng Yên (08/11/2025)',
    attemptsCount: 2000,
    questionCount: 28,
    durationMinutes: 90,
    author: 'Tổ Hóa học THPT Khoái Châu',
    institution: 'THPT Khoái Châu Hưng Yên',
    gradeScope: '12',
    topics: ['c12-ester', 'c12-carbohydrate', 'c12-polymer', 'c12-electro'],
  },
  {
    id: 'hadong-hanoi-2026-lan2',
    year: 2026,
    tier: 'PRO',
    isHot: false,
    examType: 'THPTQG',
    sourceType: 'schools',
    badgeLabel: 'ĐỀ THI THỬ',
    title: 'Đề khảo sát Học sinh giỏi Hóa 12 Đợt 2 - THPT Hà Đông Hà Nội (2025–2026)',
    attemptsCount: 2000,
    questionCount: 28,
    durationMinutes: 90,
    author: 'Tổ Hóa học THPT Hà Đông',
    institution: 'THPT Hà Đông Hà Nội',
    gradeScope: '12',
    topics: ['c12-ester', 'c12-amine', 'c12-electro', 'c11-nitrogen'],
  },
  {
    id: 'cum10-hq-2026-lan1',
    year: 2026,
    tier: 'PRO',
    isHot: false,
    examType: 'THPTQG',
    sourceType: 'schools',
    badgeLabel: 'ĐỀ THI THỬ',
    title: 'Đề kiểm tra Hóa học 12 Cụm 10 - HQ (4 mã đề 301 - 304) (04/12/2025)',
    attemptsCount: 2000,
    questionCount: 28,
    durationMinutes: 50,
    author: 'Hội đồng chuyên môn Hóa Cụm 10',
    institution: 'Cụm trường THPT số 10 - HQ',
    gradeScope: '12',
    topics: ['c12-ester', 'c12-carbohydrate', 'c12-amine', 'c12-electro'],
    variants: ['301', '302', '303', '304'],
  },
  {
    id: 'cum6-2026-lan1',
    year: 2026,
    tier: 'PRO',
    isHot: false,
    examType: 'THPTQG',
    sourceType: 'schools',
    badgeLabel: 'ĐỀ THI THỬ',
    title: 'Đề khảo sát Học sinh giỏi môn Hóa Lần 1 (7 mã đề 3001 - 3007) - Cụm thi đua số 6 (2025–2026)',
    attemptsCount: 2000,
    questionCount: 28,
    durationMinutes: 90,
    author: 'Hội đồng thi Cụm thi đua số 6',
    institution: 'Cụm thi đua số 6',
    gradeScope: '12',
    topics: ['c12-ester', 'c12-carbohydrate', 'c12-amine', 'c12-electro', 'c12-transition'],
    variants: ['3001', '3002', '3003', '3004', '3005', '3006', '3007'],
  },
  {
    id: 'nkhcm-2026-lan07',
    year: 2026,
    tier: 'PRO',
    isHot: false,
    examType: 'THPTQG',
    sourceType: 'schools',
    badgeLabel: 'ĐỀ THI THỬ',
    title: 'Đề kiểm tra Hóa học 12 Lần 7 - THPT Nguyễn Khuyến & Lê Thánh Tông (21/09/2025)',
    attemptsCount: 2000,
    questionCount: 28,
    durationMinutes: 50,
    author: 'Tổ Hóa học Nguyễn Khuyến & Lê Thánh Tông',
    institution: 'THCS & THPT Nguyễn Khuyến TP.HCM',
    gradeScope: '12',
    topics: ['c12-ester', 'c12-carbohydrate', 'c11-equilibrium'],
    variants: ['701', '702'],
  },
  {
    id: 'nkhcm-2026-lan06',
    year: 2026,
    tier: 'PRO',
    isHot: false,
    examType: 'THPTQG',
    sourceType: 'schools',
    badgeLabel: 'ĐỀ THI THỬ',
    title: 'Đề kiểm tra Hóa học 12 Lần 6 (4 mã đề 061 - 064) - THPT Nguyễn Khuyến TP.HCM (14/09/2025)',
    attemptsCount: 2000,
    questionCount: 28,
    durationMinutes: 50,
    author: 'Tổ Hóa học Nguyễn Khuyến',
    institution: 'THCS & THPT Nguyễn Khuyến TP.HCM',
    gradeScope: '12',
    topics: ['c12-ester', 'c12-carbohydrate'],
    variants: ['061', '062', '063', '064'],
  },
  {
    id: 'nkhcm-2026-lan05',
    year: 2026,
    tier: 'PRO',
    isHot: false,
    examType: 'THPTQG',
    sourceType: 'schools',
    badgeLabel: 'ĐỀ THI THỬ',
    title: 'Đề kiểm tra đầu năm Hóa học 12 Lần 5 - THPT Nguyễn Khuyến TP.HCM (07/09/2025)',
    attemptsCount: 2000,
    questionCount: 28,
    durationMinutes: 50,
    author: 'Tổ Hóa học Nguyễn Khuyến',
    institution: 'THCS & THPT Nguyễn Khuyến TP.HCM',
    gradeScope: '12',
    topics: ['c12-ester', 'c11-equilibrium', 'c11-alcohol'],
    variants: ['501', '502'],
  },
  {
    id: 'nkhcm-2026-lan04',
    year: 2026,
    tier: 'PRO',
    isHot: false,
    examType: 'THPTQG',
    sourceType: 'schools',
    badgeLabel: 'ĐỀ THI THỬ',
    title: 'Đề khảo sát năng lực Hóa học hè Lần 4 Mã đề 228 - THPT Nguyễn Khuyến TP.HCM (22/08/2025)',
    attemptsCount: 2000,
    questionCount: 28,
    durationMinutes: 50,
    author: 'Tổ Hóa học Nguyễn Khuyến',
    institution: 'THCS & THPT Nguyễn Khuyến TP.HCM',
    gradeScope: '12',
    topics: ['c12-ester', 'c11-alcohol', 'c11-carbonyl'],
    variants: ['401', '402', '228'],
  },
  {
    id: 'nkhcm-2026-lan13-2311',
    year: 2026,
    tier: 'PRO',
    isHot: false,
    examType: 'THPTQG',
    sourceType: 'schools',
    badgeLabel: 'ĐỀ THI THỬ',
    title: 'Đề kiểm tra Hóa học 12 Đợt 23.11 (MĐ 141, 142) - THPT Nguyễn Khuyến TP.HCM (2025–2026)',
    attemptsCount: 2000,
    questionCount: 28,
    durationMinutes: 50,
    author: 'Tổ Hóa học Nguyễn Khuyến',
    institution: 'THCS & THPT Nguyễn Khuyến TP.HCM',
    gradeScope: '12',
    topics: ['c12-ester', 'c12-carbohydrate', 'c12-amine', 'c12-electro'],
    variants: ['141', '142'],
  },
  {
    id: 'thaibinh-quynhtho-2026-lan2',
    year: 2026,
    tier: 'PRO',
    isHot: false,
    examType: 'THPTQG',
    sourceType: 'schools',
    badgeLabel: 'ĐỀ THI THỬ',
    title: 'Đề thi thử tốt nghiệp THPT Hóa 12 Lần 2 - THPT Quỳnh Thọ Thái Bình (2025–2026)',
    attemptsCount: 2000,
    questionCount: 28,
    durationMinutes: 50,
    author: 'Cô Nguyễn Thị Luyện - THPT Quỳnh Thọ',
    institution: 'THPT Quỳnh Thọ Thái Bình',
    gradeScope: '12',
    topics: ['c12-ester', 'c12-carbohydrate', 'c12-amine', 'c12-electro'],
  },
  {
    id: 'thaibinh-phuduc-2026-lan2',
    year: 2026,
    tier: 'PRO',
    isHot: false,
    examType: 'THPTQG',
    sourceType: 'schools',
    badgeLabel: 'ĐỀ THI THỬ',
    title: 'Đề khảo sát chất lượng Hóa học 12 Lần 2 - THPT Phụ Dực Thái Bình (2025–2026)',
    attemptsCount: 2000,
    questionCount: 28,
    durationMinutes: 50,
    author: 'Tổ Hóa học THPT Phụ Dực',
    institution: 'THPT Phụ Dực Thái Bình',
    gradeScope: '12',
    topics: ['c12-ester', 'c12-carbohydrate', 'c12-amine', 'c12-polymer'],
  },
  {
    id: 'thaibinh-namduyenha-2026-lan2',
    year: 2026,
    tier: 'PRO',
    isHot: false,
    examType: 'THPTQG',
    sourceType: 'schools',
    badgeLabel: 'ĐỀ THI THỬ',
    title: 'Đề khảo sát chất lượng Hóa 12 Lần 2 - THPT Nam Duyên Hà Thái Bình (2025–2026)',
    attemptsCount: 2000,
    questionCount: 28,
    durationMinutes: 50,
    author: 'Cô Hà Thủy - THPT Nam Duyên Hà',
    institution: 'THPT Nam Duyên Hà Thái Bình',
    gradeScope: '12',
    topics: ['c12-ester', 'c12-amine', 'c12-electro', 'c11-nitrogen'],
  },
  {
    id: 'thaibinh-lybon-2026-lan2',
    year: 2026,
    tier: 'PRO',
    isHot: false,
    examType: 'THPTQG',
    sourceType: 'schools',
    badgeLabel: 'ĐỀ THI THỬ',
    title: 'Đề khảo sát Học sinh giỏi Hóa 12 Lần 2 - THPT Lý Bôn Thái Bình (2025–2026)',
    attemptsCount: 2000,
    questionCount: 28,
    durationMinutes: 90,
    author: 'Thầy Đỗ Đức Mạnh - THPT Lý Bôn',
    institution: 'THPT Lý Bôn Thái Bình',
    gradeScope: '12',
    topics: ['c12-ester', 'c12-carbohydrate', 'c12-electro', 'c12-transition'],
  },
  {
    id: 'thaibinh-taythuyanh-2026-hsg',
    year: 2026,
    tier: 'PRO',
    isHot: false,
    examType: 'THPTQG',
    sourceType: 'schools',
    badgeLabel: 'ĐỀ THI THỬ',
    title: 'Đề thi thử Học sinh giỏi Hóa 12 - THPT Tây Thụy Anh Thái Bình (2025–2026)',
    attemptsCount: 2000,
    questionCount: 28,
    durationMinutes: 90,
    author: 'Cô Thanh Nhàn - THPT Tây Thụy Anh',
    institution: 'THPT Tây Thụy Anh Thái Bình',
    gradeScope: '12',
    topics: ['c12-ester', 'c12-amine', 'c12-polymer', 'c12-electro'],
  },
  {
    id: 'thaibinh-tienhai-2026-lan2',
    year: 2026,
    tier: 'PRO',
    isHot: false,
    examType: 'THPTQG',
    sourceType: 'schools',
    badgeLabel: 'ĐỀ THI THỬ',
    title: 'Đề khảo sát Học sinh giỏi Hóa 12 - THPT Đông Tiền Hải & Tây Tiền Hải (2025–2026)',
    attemptsCount: 2000,
    questionCount: 28,
    durationMinutes: 90,
    author: 'Tổ Hóa học THPT Đông Tiền Hải',
    institution: 'Cụm THPT Tiền Hải Thái Bình',
    gradeScope: '12',
    topics: ['c12-ester', 'c12-carbohydrate', 'c12-electro'],
  },
  {
    id: 'thanhhoa-vinhloc-2026-hsg',
    year: 2026,
    tier: 'PRO',
    isHot: false,
    examType: 'THPTQG',
    sourceType: 'schools',
    badgeLabel: 'ĐỀ THI THỬ',
    title: 'Đề thi chọn Học sinh giỏi trường môn Hóa 12 - THPT Vĩnh Lộc Thanh Hóa (2025–2026)',
    attemptsCount: 2000,
    questionCount: 28,
    durationMinutes: 90,
    author: 'Tổ Hóa học THPT Vĩnh Lộc',
    institution: 'THPT Vĩnh Lộc Thanh Hóa',
    gradeScope: '12',
    topics: ['c12-ester', 'c12-carbohydrate', 'c12-electro', 'c11-nitrogen'],
  },

  /* ── [FREE] ĐỀ THI MIỄN PHÍ - RÈN LUYỆN NỀN TẢNG & KHỞI ĐỘNG HÈ (MỞ TỰ DO) ── */
  {
    id: 'free-nkhcm-2026-lan01',
    year: 2026,
    tier: 'FREE',
    isHot: false,
    examType: 'THPTQG',
    sourceType: 'schools',
    badgeLabel: 'ĐỀ THI THỬ',
    title: 'Đề khảo sát năng lực hè Hóa học Lần 1 - THPT Nguyễn Khuyến & Lê Thánh Tông (13/07/2025)',
    attemptsCount: 1600,
    questionCount: 28,
    durationMinutes: 60,
    author: 'Tổ Hóa học Nguyễn Khuyến & Lê Thánh Tông',
    institution: 'THCS & THPT Nguyễn Khuyến TP.HCM',
    gradeScope: '12',
    topics: ['c12-ester', 'c11-hydrocarbon', 'c11-alcohol'],
    variants: ['137', '249'],
  },
  {
    id: 'free-nkhcm-2026-lan02',
    year: 2026,
    tier: 'FREE',
    isHot: false,
    examType: 'THPTQG',
    sourceType: 'schools',
    badgeLabel: 'ĐỀ THI THỬ',
    title: 'Đề kiểm tra năng lực Hóa học hè Lần 2 (3 mã đề) - THPT Nguyễn Khuyến TP.HCM (20/07/2025)',
    attemptsCount: 1600,
    questionCount: 28,
    durationMinutes: 50,
    author: 'Tổ Hóa học Nguyễn Khuyến',
    institution: 'THCS & THPT Nguyễn Khuyến TP.HCM',
    gradeScope: '12',
    topics: ['c12-ester', 'c11-carbonyl', 'c11-carboxylic'],
    variants: ['021', '022', '023'],
  },
  {
    id: 'free-nkhcm-2026-lan03',
    year: 2026,
    tier: 'FREE',
    isHot: false,
    examType: 'THPTQG',
    sourceType: 'schools',
    badgeLabel: 'ĐỀ THI THỬ',
    title: 'Đề khảo sát hè môn Hóa học 12 Lần 3 - THPT Nguyễn Khuyến TP.HCM (27/07/2025)',
    attemptsCount: 1600,
    questionCount: 28,
    durationMinutes: 50,
    author: 'Tổ Hóa học Nguyễn Khuyến',
    institution: 'THCS & THPT Nguyễn Khuyến TP.HCM',
    gradeScope: '12',
    topics: ['c12-ester', 'c12-carbohydrate', 'c11-alcohol'],
    variants: ['031', '032', '033'],
  },
  {
    id: 'free-cum3-2026-dot1',
    year: 2026,
    tier: 'FREE',
    isHot: false,
    examType: 'THPTQG',
    sourceType: 'schools',
    badgeLabel: 'ĐỀ THI THỬ',
    title: 'Đề khảo sát chất lượng Hóa học 12 Cụm 3 - Đợt 1 (Mã đề 3301, 3302) (2025–2026)',
    attemptsCount: 1600,
    questionCount: 28,
    durationMinutes: 50,
    author: 'Hội đồng chuyên môn Cụm 3',
    institution: 'Cụm trường THPT số 3',
    gradeScope: '12',
    topics: ['c12-ester', 'c12-carbohydrate', 'c11-equilibrium'],
    variants: ['3301', '3302'],
  },
  {
    id: 'free-thaibinh-thaininh-2026-lan2',
    year: 2026,
    tier: 'FREE',
    isHot: false,
    examType: 'THPTQG',
    sourceType: 'schools',
    badgeLabel: 'ĐỀ THI THỬ',
    title: 'Đề khảo sát chất lượng Hóa 12 Lần 2 - THPT Thái Ninh Thái Bình (2025–2026)',
    attemptsCount: 1600,
    questionCount: 28,
    durationMinutes: 50,
    author: 'Thầy Huân Đỗ - THPT Thái Ninh',
    institution: 'THPT Thái Ninh Thái Bình',
    gradeScope: '12',
    topics: ['c12-ester', 'c12-carbohydrate', 'c11-nitrogen'],
  },
  {
    id: 'free-thaibinh-vutien-2026-lan2',
    year: 2026,
    tier: 'FREE',
    isHot: false,
    examType: 'THPTQG',
    sourceType: 'schools',
    badgeLabel: 'ĐỀ THI THỬ',
    title: 'Đề thi thử tốt nghiệp THPT môn Hóa Lần 2 - THPT Vũ Tiên Thái Bình (2025–2026)',
    attemptsCount: 1600,
    questionCount: 28,
    durationMinutes: 50,
    author: 'Thầy Hải Hoàng - THPT Vũ Tiên',
    institution: 'THPT Vũ Tiên Thái Bình',
    gradeScope: '12',
    topics: ['c12-ester', 'c12-amine', 'c12-metal'],
  },
];

/* Sinh danh sách câu hỏi cho một đề thi cụ thể từ ngân hàng câu hỏi chuyên sâu */
export function buildExamQuestionsForPaper(examPaper) {
  // Ưu tiên câu hỏi tùy chỉnh do Admin nhập hoặc tải từ hệ thống
  if (Array.isArray(examPaper?.customQuestions) && examPaper.customQuestions.length > 0) {
    return examPaper.customQuestions.map((q, idx) => ({
      id: q.id || `cq-${examPaper.id}-${idx}`,
      prompt: q.prompt || q.question || `Câu hỏi ${idx + 1}`,
      question: q.question || q.prompt || `Câu hỏi ${idx + 1}`,
      options: Array.isArray(q.options)
        ? q.options.map((opt) => (typeof opt === 'string' ? opt : opt?.text || ''))
        : ['Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D'],
      correct: typeof q.correct === 'number' ? q.correct : (typeof q.answer === 'number' ? q.answer : 0),
      explain: q.explain || q.explanation || '',
      explanation: q.explanation || q.explain || '',
      tag: q.tag || examPaper.title || 'Đề thi phòng thi ảo',
      difficulty: q.difficulty || 'medium',
    }));
  }

  if (Array.isArray(examPaper?.questions) && examPaper.questions.length > 0 && examPaper.questions[0]?.options) {
    return examPaper.questions.map((q, idx) => ({
      id: q.id || `eq-${examPaper.id}-${idx}`,
      prompt: q.prompt || q.question || `Câu hỏi ${idx + 1}`,
      question: q.question || q.prompt || `Câu hỏi ${idx + 1}`,
      options: Array.isArray(q.options)
        ? q.options.map((opt) => (typeof opt === 'string' ? opt : opt?.text || ''))
        : ['Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D'],
      correct: typeof q.correct === 'number' ? q.correct : (typeof q.answer === 'number' ? q.answer : 0),
      explain: q.explain || q.explanation || '',
      explanation: q.explanation || q.explain || '',
      tag: q.tag || examPaper.title || 'Đề thi hệ thống',
      difficulty: q.difficulty || 'medium',
    }));
  }

  const topics = examPaper?.topics?.length ? examPaper.topics : BUILTIN_TOPICS;
  const collected = [];
  const seen = new Set();

  // Lấy câu hỏi từ các chuyên đề trọng tâm của đề
  topics.forEach((tid) => {
    const qs = builtinQuestions(tid, { level: 'all' });
    qs.forEach((q) => {
      if (!seen.has(q.id)) {
        seen.add(q.id);
        collected.push(q);
      }
    });
  });

  // Nếu chưa đủ 28 câu chuẩn GDPT 2018 thì bổ sung thêm từ các chuyên đề khác
  if (collected.length < 28) {
    BUILTIN_TOPICS.forEach((tid) => {
      if (collected.length >= 28) return;
      const qs = builtinQuestions(tid, { level: 'all' });
      qs.forEach((q) => {
        if (collected.length < 28 && !seen.has(q.id)) {
          seen.add(q.id);
          collected.push(q);
        }
      });
    });
  }

  return collected.slice(0, Math.max(28, examPaper?.questionCount || 28));
}

/* ============================================================
   KHO ĐỀ THI PHÒNG THI ẢO TÙY CHỈNH (DO ADMIN CẤP VÀ QUẢN TRỊ)
   ============================================================ */
export const CUSTOM_VIRTUAL_EXAMS_KEY = 'elec_custom_virtual_exams_v1';

export function getCustomVirtualExams() {
  try {
    const raw = localStorage.getItem(CUSTOM_VIRTUAL_EXAMS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('[virtualExams] getCustomVirtualExams parse error:', e);
    return [];
  }
}

export function saveCustomVirtualExams(exams) {
  try {
    localStorage.setItem(CUSTOM_VIRTUAL_EXAMS_KEY, JSON.stringify(exams || []));
    window.dispatchEvent(new CustomEvent('elec-virtual-exams-changed', {
      detail: { exams: exams || [] },
    }));
  } catch (e) {
    console.error('[virtualExams] saveCustomVirtualExams error:', e);
  }
}

export function getAllVirtualExams() {
  const customList = getCustomVirtualExams();
  // Tránh trùng lặp ID nếu admin ghi đè hoặc cấp lại đề
  const customIds = new Set(customList.map((e) => e.id));
  const baseList = VIRTUAL_EXAMS.filter((e) => !customIds.has(e.id));
  return [...customList, ...baseList];
}

export function isExamInVirtualRoom(examId) {
  if (!examId) return false;
  const custom = getCustomVirtualExams();
  if (custom.some((e) => e.id === examId || e.adminExamId === examId)) return true;
  return VIRTUAL_EXAMS.some((e) => e.id === examId);
}

export function publishExamToVirtual(examData) {
  if (!examData) return null;
  const cur = getCustomVirtualExams();

  const id = examData.id || `vex-custom-${Date.now().toString(36)}`;
  const tier = (examData.tier || 'PRO').toUpperCase();
  const examType = (examData.examType || examData.exam_type || 'THPTQG').toUpperCase();
  const defaultBadge = tier === 'VIP' ? 'ĐỘC QUYỀN ELEC AI' : tier === 'PRO' ? 'ĐỀ CHÍNH THỨC' : 'ĐỀ LUYỆN TẬP';

  const entry = {
    id,
    adminExamId: examData.id,
    year: Number(examData.year) || new Date().getFullYear(),
    tier: ['VIP', 'PRO', 'FREE'].includes(tier) ? tier : 'PRO',
    isHot: examData.isHot !== undefined ? Boolean(examData.isHot) : true,
    examType,
    sourceType: examData.sourceType || examData.source || 'exclusive',
    badgeLabel: examData.badgeLabel || defaultBadge,
    title: examData.title || 'Đề thi phòng thi ảo ELEC AI',
    attemptsCount: Number(examData.attempt_count || examData.attemptsCount) || 0,
    questionCount: Number(examData.questionCount || examData.question_count || examData.questions?.length) || 28,
    durationMinutes: Number(examData.durationMinutes || examData.duration) || 50,
    author: examData.author || 'Đội ngũ giáo viên ELEC AI',
    institution: examData.institution || (examData.subject?.name ? `Tổ bộ môn ${examData.subject.name}` : 'Ban Chuyên Môn'),
    gradeScope: String(examData.gradeScope || examData.grade?.name || 'all').replace(/[^0-9]/g, '') || 'all',
    topics: Array.isArray(examData.topics) && examData.topics.length ? examData.topics : ['c12-ester', 'c12-electro', 'c11-nitrogen'],
    customQuestions: Array.isArray(examData.customQuestions || examData.questions) ? (examData.customQuestions || examData.questions) : [],
    createdAt: examData.created_at || new Date().toISOString(),
    publishedToVirtualAt: new Date().toISOString(),
  };

  const next = [entry, ...cur.filter((e) => e.id !== id && e.adminExamId !== id)];
  saveCustomVirtualExams(next);
  return entry;
}

export function unpublishExamFromVirtual(examId) {
  if (!examId) return false;
  const cur = getCustomVirtualExams();
  const next = cur.filter((e) => e.id !== examId && e.adminExamId !== examId);
  saveCustomVirtualExams(next);
  return true;
}

/* ============================================================
   LOCALSTORAGE HELPERS: ĐỀ YÊU THÍCH, LỊCH SỬ THI, MẠNG LUYỆN TẬP & MÃ KÍCH HOẠT
   ============================================================ */

const memStorage = new Map();
function safeGet(key) {
  try {
    if (typeof localStorage !== 'undefined') {
      const v = localStorage.getItem(key);
      if (v != null) return v;
    }
  } catch {}
  return memStorage.get(key) || null;
}

function safeSet(key, val) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, val);
    }
  } catch {}
  memStorage.set(key, val);
}

const FAV_KEY = (uid) => `elec_fav_exams_v1_${uid || 'guest'}`;
const HIST_KEY = (uid) => `elec_exam_history_v1_${uid || 'guest'}`;
const SUB_KEY = (uid) => `elec_sub_quota_v1_${uid || 'guest'}`;
const REPORT_KEY = (uid) => `elec_user_reports_v1_${uid || 'guest'}`;

export function getFavoriteExamIds(uid) {
  try {
    return JSON.parse(localStorage.getItem(FAV_KEY(uid)) || '[]');
  } catch {
    return [];
  }
}

export function toggleFavoriteExamId(uid, examId) {
  const cur = getFavoriteExamIds(uid);
  const exists = cur.includes(examId);
  const next = exists ? cur.filter((id) => id !== examId) : [examId, ...cur];
  try {
    localStorage.setItem(FAV_KEY(uid), JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('elec-fav-exams-changed'));
  } catch { /* ignore */ }
  return next;
}

export function getVirtualExamHistory(uid) {
  try {
    return JSON.parse(localStorage.getItem(HIST_KEY(uid)) || '[]');
  } catch {
    return [];
  }
}

export function saveVirtualExamResult(uid, result) {
  const cur = getVirtualExamHistory(uid);
  const entry = {
    id: 'vex-' + Date.now(),
    at: Date.now(),
    ...result,
  };
  const next = [entry, ...cur].slice(0, 60);
  try {
    localStorage.setItem(HIST_KEY(uid), JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('elec-exam-history-changed'));
    const curFood = Number(localStorage.getItem('cs-pet-food')) || 0;
    localStorage.setItem('cs-pet-food', String(curFood + 2));
    window.dispatchEvent(new CustomEvent('cs-ls', { detail: 'cs-pet-food' }));
  } catch { /* ignore */ }
  try {
    const v2 = localStorage.getItem('cs-streak-v2');
    const v1 = localStorage.getItem('cs-streak');
    let base = { last: '', n: 0, total: 0 };
    if (v2) { try { base = JSON.parse(v2); } catch {} }
    else if (v1) { try { base = JSON.parse(v1); } catch {} }
    const p2 = (n) => String(n).padStart(2, '0');
    const d = new Date();
    const today = `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
    const yesterday = `${new Date(Date.now() - 864e5).getFullYear()}-${p2(new Date(Date.now() - 864e5).getMonth() + 1)}-${p2(new Date(Date.now() - 864e5).getDate())}`;
    if (base.last !== today) {
      const nextStreak = {
        last: today,
        n: base.last === yesterday ? (base.n || 0) + 1 : 1,
        total: (base.total || 0) + 1,
      };
      const raw = JSON.stringify(nextStreak);
      localStorage.setItem('cs-streak-v2', raw);
      localStorage.setItem('cs-streak', raw);
      window.dispatchEvent(new CustomEvent('cs-streak-change', { detail: nextStreak }));
      window.dispatchEvent(new CustomEvent('cs-ls', { detail: 'cs-streak-v2' }));
      window.dispatchEvent(new CustomEvent('cs-ls', { detail: 'cs-streak' }));
    }
  } catch { /* ignore */ }
  return entry;
}

export function getSubscriptionAndQuota(uid) {
  try {
    const raw = JSON.parse(safeGet(SUB_KEY(uid)) || safeGet(`cs-user-subscription:${uid}`) || 'null');
    if (raw && typeof raw === 'object') return raw;
  } catch { /* ignore */ }
  return {
    planName: 'Free',
    planDesc: 'Nội dung miễn phí',
    durationLabel: 'Trọn đời',
    examAccessLabel: 'Đề cơ bản của mọi kỳ thi',
    hearts: 5,
    maxHearts: 5,
    aiCreditsUsed: 0,
    aiCreditsMax: 30,
    transactions: [],
  };
}

/**
 * Kiểm tra xem người dùng có quyền làm đề thi theo phân hạng không
 * @param {string} userPlan - 'FREE' | 'PRO' | 'VIP' | 'ADMIN'
 * @param {string} examTier - 'FREE' | 'PRO' | 'VIP'
 * @returns {boolean}
 */
export function canAccessVirtualExam(userPlan = 'FREE', examTier = 'FREE') {
  const normPlan = String(userPlan || 'FREE').toUpperCase();
  const normTier = String(examTier || 'FREE').toUpperCase();

  // 1. Đề FREE: Mọi tài khoản đều được truy cập
  if (normTier === 'FREE') return true;

  // 2. Admin hoặc VIP: Toàn quyền truy cập mọi phân hạng (VIP, PRO, FREE)
  if (normPlan.includes('VIP') || normPlan.includes('ADMIN')) return true;

  // 3. Gói PRO (Học sinh PRO, Giáo viên PRO): Được làm đề PRO và FREE
  if (normPlan.includes('PRO')) {
    return normTier === 'PRO' || normTier === 'FREE';
  }

  // 4. Mặc định tài khoản Free: Chỉ được làm đề FREE
  return false;
}

/**
 * Tiêu hao 1 mạng luyện tập khi bắt đầu hoặc nộp bài thi
 * @param {string} uid
 * @returns {{ ok: boolean, hearts: number, message?: string }}
 */
export function consumeExamHeart(uid) {
  const cur = getSubscriptionAndQuota(uid);
  const isVip = String(cur.planName || '').toUpperCase().includes('VIP');
  if (isVip) return { ok: true, hearts: 99 }; // VIP không bị giới hạn mạng

  const currentHearts = Number.isFinite(cur.hearts) ? cur.hearts : 5;
  if (currentHearts <= 0) {
    return { ok: false, hearts: 0, message: 'Bạn đã sử dụng hết mạng luyện tập hôm nay.' };
  }

  const nextHearts = Math.max(0, currentHearts - 1);
  const nextQuota = {
    ...cur,
    hearts: nextHearts,
  };
  safeSet(SUB_KEY(uid), JSON.stringify(nextQuota));
  try {
    localStorage.setItem(`cs-user-subscription:${uid}`, JSON.stringify(nextQuota));
  } catch {}
  window.dispatchEvent(new CustomEvent('elec-quota-changed', { detail: nextQuota }));
  return { ok: true, hearts: nextHearts };
}

export const POINTS_PER_CODE_ENTRY = 15;

export async function redeemActivationCode(uid, rawCode) {
  const code = String(rawCode || '').trim().toUpperCase();
  if (!code || code.length < 3) {
    return { ok: false, message: 'Vui lòng nhập mã kích hoạt hợp lệ (tối thiểu 3 ký tự).' };
  }

  const cur = getSubscriptionAndQuota(uid);
  const usedCodes = Array.isArray(cur.usedCodes) ? cur.usedCodes : [];

  // 1. Chống spam: Mỗi mã chỉ được sử dụng 1 lần duy nhất trên tài khoản
  if (usedCodes.includes(code)) {
    return {
      ok: false,
      message: `Mã "${code}" đã được kích hoạt trên tài khoản này rồi! Mỗi mã chỉ được nhận thưởng 1 lần.`,
    };
  }

  let matchedPlan = null;
  let serverActivated = false;

  // 2. Thử kích hoạt qua hệ thống Key/Voucher bảo mật từ Server (Supabase/Firestore)
  try {
    const { activateProKey } = await import('../lib/proKeyApi.js');
    const actRes = await activateProKey(uid, code);
    if (actRes.ok) {
      serverActivated = true;
      if (actRes.type === 'credit') {
        matchedPlan = {
          planName: null,
          txTitle: `Nạp thẻ điểm AI ${code} (+${actRes.amount} điểm)`,
          bonusAmount: actRes.amount,
        };
      } else if (actRes.isDiscount) {
        return {
          ok: true,
          isDiscount: true,
          discountData: actRes,
          message: actRes.message || 'Mã giảm giá hợp lệ! Vui lòng áp dụng tại màn hình thanh toán.',
        };
      } else {
        const plan = actRes.pro?.plan || (code.startsWith('VIP-') ? 'VIP' : 'PRO');
        matchedPlan = {
          planName: plan,
          planDesc: plan === 'VIP' ? 'Đặc quyền VIP Phòng thi ảo + Gia sư AI' : 'Mở khóa toàn bộ Đề thi PRO',
          durationLabel: 'Kích hoạt thành công',
          examAccessLabel: plan === 'VIP' ? '100% đề VIP, PRO, FREE' : 'Toàn bộ đề PRO & FREE',
          maxHearts: plan === 'VIP' ? 99 : 15,
          txTitle: `Kích hoạt thành công mã ${code} (${plan})`,
        };
      }
    }
  } catch (srvErr) {
    console.warn('[virtualExamsBank] Server key activation err:', srvErr);
  }

  // 3. Fallback mã quà tặng chào mừng chuẩn (Chỉ tặng điểm, KHÔNG cấp VIP/PRO miễn phí)
  if (!serverActivated) {
    if (code === 'ELEC15') {
      matchedPlan = {
        planName: null,
        txTitle: 'Nhập mã quà tặng ELEC15 (+15 điểm AI)',
        bonusAmount: 15,
      };
    } else if (code === 'ELECVIP') {
      matchedPlan = {
        planName: 'VIP',
        planDesc: 'Đặc quyền VIP Phòng thi ảo + Gia sư AI',
        durationLabel: 'VIP Vĩnh viễn (Mã trải nghiệm)',
        examAccessLabel: '100% đề VIP, PRO, FREE',
        maxHearts: 99,
        txTitle: 'Kích hoạt thành công mã VIP trải nghiệm (ELECVIP)',
      };
    } else {
      return {
        ok: false,
        message: 'Mã ưu đãi không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại.',
      };
    }
  }
  const addedPoints = POINTS_PER_CODE_ENTRY; // Mỗi lượt nhập được cộng đúng 15 điểm
  const nextCreditsMax = (Number(cur.aiCreditsMax) || 30) + addedPoints;
  const nextBonusPoints = (Number(cur.bonusPoints) || 0) + addedPoints;

  const next = {
    ...cur,
    planName: matchedPlan?.planName ? matchedPlan.planName : cur.planName,
    planDesc: matchedPlan?.planDesc ? matchedPlan.planDesc : cur.planDesc,
    durationLabel: matchedPlan?.durationLabel ? matchedPlan.durationLabel : cur.durationLabel,
    examAccessLabel: matchedPlan?.examAccessLabel ? matchedPlan.examAccessLabel : cur.examAccessLabel,
    hearts: matchedPlan?.maxHearts ? matchedPlan.maxHearts : cur.hearts,
    maxHearts: matchedPlan?.maxHearts ? matchedPlan.maxHearts : cur.maxHearts,
    aiCreditsMax: nextCreditsMax,
    bonusPoints: nextBonusPoints,
    usedCodes: [code, ...usedCodes],
    transactions: [
      {
        id: 'TX-' + Date.now().toString(36).toUpperCase(),
        title: matchedPlan ? matchedPlan.txTitle : `Nhập mã giới thiệu ${code} (+${addedPoints} điểm)`,
        code,
        amount: `+${addedPoints} điểm`,
        status: 'Thành công',
        at: new Date().toLocaleString('vi-VN'),
      },
      ...(cur.transactions || []),
    ],
  };

  try {
    safeSet(SUB_KEY(uid), JSON.stringify(next));
    if (matchedPlan?.planName) {
      safeSet('cs-vip-status', JSON.stringify({
        isPro: true,
        plan: matchedPlan.planName,
        expiry: new Date(Date.now() + 365 * 864e5).toISOString(),
        daysLeft: 365,
      }));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cs-vip-update'));
        window.dispatchEvent(new CustomEvent('cs-tier-update'));
        window.dispatchEvent(new CustomEvent('user-profile-change'));
      }
    }
  } catch { /* ignore */ }

  return {
    ok: true,
    addedPoints,
    message: matchedPlan
      ? `Kích hoạt thành công gói ${matchedPlan.planName} và nhận +${addedPoints} điểm!`
      : `Nhập mã thành công! Bạn đã được cộng +${addedPoints} điểm vào tài khoản.`,
    data: next,
  };
}

export function getUserReports(uid) {
  try {
    return JSON.parse(safeGet(REPORT_KEY(uid)) || '[]');
  } catch {
    return [];
  }
}

export function addUserReport(uid, report) {
  const cur = getUserReports(uid);
  const item = {
    id: 'RP-' + Date.now().toString(36).toUpperCase(),
    at: new Date().toLocaleString('vi-VN'),
    status: 'Đã tiếp nhận',
    ...report,
  };
  const next = [item, ...cur];
  try {
    safeSet(REPORT_KEY(uid), JSON.stringify(next));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('elec-user-reports-changed'));
    }
  } catch { /* ignore */ }
  return next;
}
