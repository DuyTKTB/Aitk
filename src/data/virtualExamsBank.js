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
    const raw = JSON.parse(localStorage.getItem(SUB_KEY(uid)) || 'null');
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

export const POINTS_PER_CODE_ENTRY = 15;

export function redeemActivationCode(uid, rawCode) {
  const code = String(rawCode || '').trim().toUpperCase();
  if (!code || code.length < 3) {
    return { ok: false, message: 'Vui lòng nhập mã kích hoạt hợp lệ (tối thiểu 3 ký tự).' };
  }

  const cur = getSubscriptionAndQuota(uid);
  const usedCodes = Array.isArray(cur.usedCodes) ? cur.usedCodes : [];

  // Cấu hình các gói nâng cấp đặc biệt (vẫn cộng +15 điểm mỗi lượt nhập)
  const SPECIAL_PLANS = {
    ELECPRO: {
      planName: 'PRO',
      planDesc: 'Mở khóa toàn bộ Bộ đề PRO & Giải thích AI chi tiết',
      durationLabel: '12 tháng (2026–2027)',
      examAccessLabel: 'Toàn bộ đề FREE + PRO của 6 kỳ thi',
      maxHearts: 10,
      txTitle: 'Kích hoạt mã ELECPRO (+15 điểm AI)',
    },
    ELECVIP: {
      planName: 'VIP',
      planDesc: 'Đặc quyền Bộ đề VIP + Gia sư AI không giới hạn',
      durationLabel: 'Trọn mùa thi 2027',
      examAccessLabel: 'Mở khóa 100% đề VIP, PRO, FREE mọi kỳ thi',
      maxHearts: 99,
      txTitle: 'Kích hoạt mã đặc quyền ELECVIP (+15 điểm AI)',
    },
    '9STUDY2027': {
      planName: 'VIP',
      planDesc: 'Gói Học bổng Lộ trình Mục tiêu Đại học 2027',
      durationLabel: 'Trọn mùa thi 2027',
      examAccessLabel: 'Mở khóa 100% đề VIP, PRO, FREE mọi kỳ thi',
      maxHearts: 99,
      txTitle: 'Kích hoạt học bổng 9STUDY2027 (+15 điểm AI)',
    },
  };

  const matchedPlan = SPECIAL_PLANS[code];
  const addedPoints = POINTS_PER_CODE_ENTRY; // Mỗi lượt nhập được cộng đúng 15 điểm
  const nextCreditsMax = (Number(cur.aiCreditsMax) || 30) + addedPoints;
  const nextBonusPoints = (Number(cur.bonusPoints) || 0) + addedPoints;

  const next = {
    ...cur,
    planName: matchedPlan ? matchedPlan.planName : cur.planName,
    planDesc: matchedPlan ? matchedPlan.planDesc : cur.planDesc,
    durationLabel: matchedPlan ? matchedPlan.durationLabel : cur.durationLabel,
    examAccessLabel: matchedPlan ? matchedPlan.examAccessLabel : cur.examAccessLabel,
    hearts: matchedPlan ? matchedPlan.maxHearts : cur.hearts,
    maxHearts: matchedPlan ? matchedPlan.maxHearts : cur.maxHearts,
    aiCreditsMax: nextCreditsMax,
    bonusPoints: nextBonusPoints,
    usedCodes: [code, ...usedCodes],
    transactions: [
      {
        id: 'TX-' + Date.now().toString(36).toUpperCase(),
        title: matchedPlan ? matchedPlan.txTitle : `Nhập mã quà tặng / giới thiệu ${code}`,
        code,
        amount: `+${addedPoints} điểm`,
        status: 'Thành công',
        at: new Date().toLocaleString('vi-VN'),
      },
      ...(cur.transactions || []),
    ],
  };

  try {
    localStorage.setItem(SUB_KEY(uid), JSON.stringify(next));
    if (matchedPlan) {
      localStorage.setItem('cs-vip-status', JSON.stringify({
        isPro: true,
        plan: matchedPlan.planName,
        expiry: new Date(Date.now() + 365 * 864e5).toISOString(),
        daysLeft: 365,
      }));
      window.dispatchEvent(new CustomEvent('cs-vip-update'));
      window.dispatchEvent(new CustomEvent('cs-tier-update'));
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
    return JSON.parse(localStorage.getItem(REPORT_KEY(uid)) || '[]');
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
    localStorage.setItem(REPORT_KEY(uid), JSON.stringify(next));
  } catch { /* ignore */ }
  return next;
}
