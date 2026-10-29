/* ============================================================
   aspirationStore.js — HỒ SƠ NGUYỆN VỌNG & QUY TRÌNH 5 BƯỚC (9STUDY)
   ------------------------------------------------------------
   Quản lý:
     • Nguyện vọng đại học (NV1, NV2, NV3) từ CUTOFF_DATA hoặc tự nhập
     • Kỳ thi mục tiêu (THPTQG, HSA, TSA, V-ACT) & Tổ hợp xét tuyển (A00, B00, D07...)
     • Điểm mục tiêu (tổng 3 môn & môn Hóa) + Ngày thi mục tiêu
     • Tính toán trung thực: Điểm Hóa dự kiến, Hệ số Elo, Khoảng cách tới NV1,
       Trạng thái 5 bước lộ trình, 3 Nhiệm vụ Hôm nay & Lịch giữ nhịp tháng.
   ============================================================ */

import { CUTOFF_DATA } from '../data/uniCutoffs.js';
import { getUserAspirationsState } from './aspirationService.js';

const KEY_PREFIX = 'cs-aspirations-v1:';
const EVT = 'cs-aspirations';
const DAY = 86400000;

export const EXAM_TYPES = [
  {
    id: 'THPTQG',
    code: 'THPTQG',
    name: 'Tốt nghiệp THPT Quốc gia',
    shortLabel: 'Thi THPT QG',
    scale: 30,
    chemQuestions: '28 câu (18 TN + 4 Đ/S + 6 TLN) · 50 phút',
    desc: 'Xét tuyển theo tổ hợp 3 môn (thang 30) — cấu trúc đề mới GDPT 2018.',
  },
  {
    id: 'HSA',
    code: 'HSA',
    name: 'Đánh giá năng lực ĐHQG Hà Nội (HSA)',
    shortLabel: 'ĐGNL HSA',
    scale: 150,
    chemQuestions: 'Phần Khoa học (17 câu Hóa học) · Tư duy định lượng & thực nghiệm',
    desc: 'Bài thi 150 điểm của ĐHQGHN — yêu cầu đọc hiểu số liệu và bản chất Hóa học.',
  },
  {
    id: 'TSA',
    code: 'TSA',
    name: 'Đánh giá tư duy ĐH Bách Khoa (TSA)',
    shortLabel: 'ĐGTD TSA',
    scale: 100,
    chemQuestions: 'Tư duy Khoa học / Giải quyết vấn đề (Đọc hiểu thí nghiệm Hóa)',
    desc: 'Bài thi 100 điểm của ĐHBK Hà Nội — trọng tâm phân tích biểu đồ và suy luận.',
  },
  {
    id: 'V-ACT',
    code: 'V-ACT',
    name: 'Đánh giá năng lực ĐHQG TP.HCM (V-ACT)',
    shortLabel: 'ĐGNL V-ACT',
    scale: 1200,
    chemQuestions: 'Giải quyết vấn đề Hóa học (số liệu thực tiễn & suy luận logic)',
    desc: 'Bài thi 1200 điểm của ĐHQG TP.HCM — xét tuyển hơn 100 trường ĐH phía Nam.',
  },
  {
    id: 'SPT',
    code: 'SPT',
    name: 'Đánh giá năng lực ĐH Sư phạm Hà Nội (SPT)',
    shortLabel: 'ĐGNL SPT',
    scale: 10,
    chemQuestions: 'Thi độc lập môn Hóa học (TN + Tự luận ngắn) · Thang 10 điểm',
    desc: 'Kỳ thi ĐGNL của Trường ĐH Sư phạm Hà Nội — xét tuyển các trường khối Sư phạm & KHTN.',
  },
  {
    id: 'H-SCA',
    code: 'H-SCA',
    name: 'Đánh giá năng lực chuyên biệt ĐH Sư phạm TP.HCM (H-SCA)',
    shortLabel: 'ĐGNL H-SCA',
    scale: 10,
    chemQuestions: 'Bài thi chuyên biệt môn Hóa học (40 câu) · Thang 10 điểm',
    desc: 'Kỳ thi ĐGNL chuyên biệt của ĐHSP TP.HCM — trọng tâm vận dụng Hóa học.',
  },
];

export const EXAM_BLOCKS = [
  { id: 'A00', label: 'A00', subjects: ['Toán', 'Vật lí', 'Hóa học'], chemRole: 'Môn trụ cột kéo điểm KHTN' },
  { id: 'B00', label: 'B00', subjects: ['Toán', 'Hóa học', 'Sinh học'], chemRole: 'Môn quyết định khối Y - Dược' },
  { id: 'D07', label: 'D07', subjects: ['Toán', 'Hóa học', 'Tiếng Anh'], chemRole: 'Tổ hợp mũi nhọn Kinh tế & Kỹ thuật' },
  { id: 'KHTN', label: 'KHTN', subjects: ['Vật lí', 'Hóa học', 'Sinh học'], chemRole: 'Tổ hợp Khoa học Tự nhiên (HSA/TSA)' },
  { id: 'A01', label: 'A01', subjects: ['Toán', 'Vật lí', 'Tiếng Anh'], chemRole: 'Hóa học bổ trợ bài thi ĐGNL/ĐGTD' },
];

export const NINE_STUDY_STAGES = [
  {
    step: 1,
    id: 'wish',
    title: 'Chọn Nguyện vọng & Ngành',
    subtitle: 'Định vị trường đại học mơ ước',
    desc: 'Lựa chọn tối đa 3 nguyện vọng (NV1, NV2, NV3) và đối chiếu điểm chuẩn 2 năm gần nhất.',
  },
  {
    step: 2,
    id: 'exam',
    title: 'Kỳ thi & Điểm mục tiêu',
    subtitle: 'Chọn phương thức xét tuyển',
    desc: 'Xác định kỳ thi (THPTQG, HSA, TSA, V-ACT), tổ hợp môn và mốc điểm môn Hóa cần đạt.',
  },
  {
    step: 3,
    id: 'diagnose',
    title: 'Đánh giá Năng lực & Elo',
    subtitle: 'Đo điểm xuất phát thực tế',
    desc: 'Làm bài luyện tập để hệ thống định hạng Elo và chỉ ra chuyên đề đang kéo tụt điểm.',
  },
  {
    step: 4,
    id: 'mastery',
    title: 'Lấp lỗ hổng Chuyên đề',
    subtitle: 'Luyện 3 cấp độ & Sổ lỗi sai',
    desc: 'Cày chuyên đề yếu theo Nhận biết → Thông hiểu → Vận dụng và xử lý dứt điểm câu sai đến hạn.',
  },
  {
    step: 5,
    id: 'sprint',
    title: 'Về đích Nguyện vọng 1',
    subtitle: 'Bứt phá ngưỡng điểm chuẩn',
    desc: 'Duy trì chuỗi học tập đều đặn, nâng thành thạo ≥80% và đạt mốc điểm chuẩn NV1.',
  },
];

function keyOf(uid) {
  return `${KEY_PREFIX}${uid || 'guest'}`;
}

export function defaultAspirationProfile() {
  return {
    wishes: [
      {
        id: 'bka-kthoa',
        uni: 'ĐH Bách Khoa Hà Nội',
        code: 'BKA',
        majorCode: 'CH1',
        city: 'Hà Nội',
        major: 'Kỹ thuật Hóa học',
        combo: 'A00/B00/D07',
        s2024: 23.8,
        s2025: 24.4,
      },
      {
        id: 'dkh-duoc',
        uni: 'ĐH Dược Hà Nội',
        code: 'DKH',
        majorCode: '7720201',
        city: 'Hà Nội',
        major: 'Dược học',
        combo: 'A00/B00',
        s2024: 25.51,
        s2025: 25.85,
      },
    ],
    examType: 'THPTQG',
    examBlock: 'A00',
    targetTotalScore: 25.5,
    targetChemScore: 8.5,
    dailyMinutes: 45,
    updatedAt: 0,
  };
}

export function readAspirations(uid) {
  const base = defaultAspirationProfile();
  try {
    // Ưu tiên đồng bộ từ aspirationService (v2) trên Navbar nếu người dùng đã chọn nguyện vọng
    const v2 = getUserAspirationsState(uid);
    if (v2 && Array.isArray(v2.aspirations) && v2.aspirations.length > 0) {
      const active = v2.activeAspiration || v2.aspirations[0];
      const ordered = [
        active,
        ...v2.aspirations.filter((a) => a.id !== active.id),
      ];
      return {
        ...base,
        wishes: ordered.map((a) => ({
          id: a.id,
          uni: a.school.name,
          code: a.school.code,
          majorCode: a.major.majorCode,
          city: a.school.city || 'Toàn quốc',
          major: a.major.name,
          combo: (a.major.blocks || [a.block || 'A00']).join('/'),
          s2024: a.cutoffScore,
          s2025: a.cutoffScore,
        })),
        examType: v2.selectedExamId || active.examId || 'THPTQG',
        examBlock: active.block || 'A00',
        targetTotalScore: active.targetScore || base.targetTotalScore,
        targetChemScore: active.targetChemScore || base.targetChemScore,
      };
    }

    const raw = localStorage.getItem(keyOf(uid));
    if (!raw) return base;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return base;
    return {
      ...base,
      ...parsed,
      wishes: Array.isArray(parsed.wishes) ? parsed.wishes.slice(0, 3) : base.wishes,
      targetTotalScore: Number.isFinite(Number(parsed.targetTotalScore))
        ? Math.min(30, Math.max(15, Number(parsed.targetTotalScore)))
        : base.targetTotalScore,
      targetChemScore: Number.isFinite(Number(parsed.targetChemScore))
        ? Math.min(10, Math.max(5, Number(parsed.targetChemScore)))
        : base.targetChemScore,
    };
  } catch {
    return base;
  }
}

export function saveAspirations(uid, partial = {}) {
  const cur = readAspirations(uid);
  const next = {
    ...cur,
    ...partial,
    updatedAt: Date.now(),
  };
  if (Array.isArray(next.wishes)) {
    next.wishes = next.wishes.slice(0, 3);
  }
  let written = false;
  try {
    localStorage.setItem(keyOf(uid), JSON.stringify(next));
    written = true;
  } catch (e) {
    console.warn('aspirationStore: không ghi được localStorage', e);
  }
  if (written) {
    try { window.dispatchEvent(new Event(EVT)); } catch { /* môi trường test */ }
  }
  return next;
}

export function addWish(uid, item) {
  if (!item || !item.uni || !item.major) return readAspirations(uid);
  const cur = readAspirations(uid);
  const id = item.id || `${item.code || 'UNI'}-${item.major}`.toLowerCase().replace(/\s+/g, '-');
  const exists = cur.wishes.some((w) => w.id === id || (w.uni === item.uni && w.major === item.major));
  if (exists) return cur;
  const normalized = {
    id,
    uni: item.uni,
    code: item.code || 'ĐH',
    majorCode: item.majorCode || '',
    city: item.city || 'Toàn quốc',
    major: item.major,
    combo: item.combo || cur.examBlock,
    s2024: Number.isFinite(Number(item.s2024)) ? Number(item.s2024) : null,
    s2025: Number.isFinite(Number(item.s2025)) ? Number(item.s2025) : null,
  };
  const wishes = [...cur.wishes, normalized].slice(0, 3);
  // Nếu mới chọn NV1 và NV1 có điểm chuẩn 2025, đồng bộ gợi ý điểm mục tiêu
  const nv1 = wishes[0];
  const autoTargetTotal = nv1?.s2025 ? Math.min(30, Math.round((nv1.s2025 + 0.5) * 100) / 100) : cur.targetTotalScore;
  const autoTargetChem = nv1?.s2025 ? Math.min(10, Math.round(((nv1.s2025 / 3) + 0.25) * 4) / 4) : cur.targetChemScore;
  return saveAspirations(uid, {
    wishes,
    targetTotalScore: wishes.length === 1 ? autoTargetTotal : cur.targetTotalScore,
    targetChemScore: wishes.length === 1 ? autoTargetChem : cur.targetChemScore,
  });
}

export function removeWish(uid, wishId) {
  const cur = readAspirations(uid);
  const wishes = cur.wishes.filter((w) => w.id !== wishId);
  return saveAspirations(uid, { wishes });
}

export function promoteWish(uid, wishId) {
  const cur = readAspirations(uid);
  const idx = cur.wishes.findIndex((w) => w.id === wishId);
  if (idx <= 0) return cur;
  const picked = cur.wishes[idx];
  const rest = cur.wishes.filter((_, i) => i !== idx);
  const wishes = [picked, ...rest];
  const targetTotalScore = picked.s2025
    ? Math.min(30, Math.round((picked.s2025 + 0.5) * 100) / 100)
    : cur.targetTotalScore;
  const targetChemScore = picked.s2025
    ? Math.min(10, Math.round(((picked.s2025 / 3) + 0.25) * 4) / 4)
    : cur.targetChemScore;
  return saveAspirations(uid, { wishes, targetTotalScore, targetChemScore });
}

export function subscribeAspirations(fn) {
  if (typeof window === 'undefined') return () => {};
  const h = () => fn();
  window.addEventListener(EVT, h);
  window.addEventListener('storage', h);
  return () => {
    window.removeEventListener(EVT, h);
    window.removeEventListener('storage', h);
  };
}

/* ---------- Tính toán hệ thống điểm, Elo, khả năng đỗ & 5 bước ---------- */

export function classifyFeasibility(estimatedTotal, cutoffScore) {
  if (!Number.isFinite(cutoffScore) || cutoffScore <= 0) {
    return { key: 'unknown', label: 'Xét tuyển riêng', tone: 'muted', delta: null };
  }
  if (!Number.isFinite(estimatedTotal)) {
    return { key: 'untested', label: 'Chưa đo điểm xuất phát', tone: 'muted', delta: null };
  }
  const delta = Math.round((estimatedTotal - cutoffScore) * 100) / 100;
  if (delta >= 0.75) {
    return { key: 'safe', label: 'An toàn · Vượt chuẩn', tone: 'ok', delta };
  }
  if (delta >= -0.5) {
    return { key: 'fit', label: 'Phù hợp · Cạnh tranh tốt', tone: 'info', delta };
  }
  if (delta >= -2.25) {
    return { key: 'stretch', label: 'Thử thách · Cần tăng tốc', tone: 'warn', delta };
  }
  return { key: 'challenge', label: 'Cần bứt phá mạnh', tone: 'err', delta };
}

export function computeEloInfo(avgMastery, totalAnswers = 0) {
  if (avgMastery === null || avgMastery === undefined || totalAnswers <= 0) {
    return {
      elo: null,
      tier: 'Chưa xếp hạng',
      nextTier: 'Nền tảng (1300 Elo)',
      progressPct: 0,
      tone: 'muted',
    };
  }
  // Quy đổi trung thực từ độ thành thạo (0..100) và độ dày bằng chứng (tối đa +60 Elo thưởng kinh nghiệm)
  const expBonus = Math.min(60, Math.round(Math.sqrt(totalAnswers) * 5));
  const elo = Math.round(1000 + avgMastery * 8.5 + expBonus);
  if (elo >= 1750) {
    return { elo, tier: 'Thủ khoa · 9.0+', nextTier: 'Đỉnh cao (1900+)', progressPct: 95, tone: 'ok' };
  }
  if (elo >= 1580) {
    return { elo, tier: 'Bứt phá · 8.0+', nextTier: 'Thủ khoa (1750 Elo)', progressPct: Math.round(((elo - 1580) / 170) * 100), tone: 'info' };
  }
  if (elo >= 1380) {
    return { elo, tier: 'Khá vững · 7.0+', nextTier: 'Bứt phá (1580 Elo)', progressPct: Math.round(((elo - 1380) / 200) * 100), tone: 'warn' };
  }
  return {
    elo,
    tier: 'Nền tảng · Xuất phát',
    nextTier: 'Khá vững (1380 Elo)',
    progressPct: Math.max(8, Math.round(((elo - 1000) / 380) * 100)),
    tone: 'muted',
  };
}

export function buildMonthlyActivity(events = [], now = Date.now()) {
  const curDate = new Date(now);
  const year = curDate.getFullYear();
  const month = curDate.getMonth();
  const todayDate = curDate.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const countByDay = {};
  (events || []).forEach((e) => {
    if (!e || !e.at) return;
    const d = new Date(e.at);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const dayNum = d.getDate();
      countByDay[dayNum] = (countByDay[dayNum] || 0) + 1;
    }
  });

  const cells = [];
  let activeDays = 0;
  for (let d = 1; d <= daysInMonth; d += 1) {
    const count = countByDay[d] || 0;
    if (count > 0) activeDays += 1;
    let status = 'miss';
    if (d > todayDate) status = 'future';
    else if (d === todayDate) status = count >= 5 ? 'fire' : count > 0 ? 'partial' : 'today';
    else if (count >= 10) status = 'fire';
    else if (count > 0) status = 'partial';

    cells.push({ day: d, count, status });
  }

  return {
    monthLabel: `Tháng ${month + 1}/${year}`,
    activeDays,
    daysInMonth,
    cells,
  };
}

export function computeAspirationAnalytics({
  profile = defaultAspirationProfile(),
  overview = {},
  chapters = [],
  dueTotal = 0,
  cardsDue = 0,
  events = [],
  now = Date.now(),
} = {}) {
  const wishes = Array.isArray(profile.wishes) ? profile.wishes : [];
  const nv1 = wishes[0] || null;
  const examMeta = EXAM_TYPES.find((e) => e.id === profile.examType) || EXAM_TYPES[0];
  const blockMeta = EXAM_BLOCKS.find((b) => b.id === profile.examBlock) || EXAM_BLOCKS[0];

  const hasEvidence = Boolean(overview?.hasEvidence && overview?.avgMastery !== null);
  // Quy đổi điểm Hóa dự kiến (thang 10) từ avgMastery thực tế
  const estimatedChemScore = hasEvidence
    ? Math.round((overview.avgMastery / 10) * 4) / 4
    : null;
  // Quy đổi tổng điểm 3 môn giả định tương đương năng lực môn Hóa hiện tại (để tham chiếu khoảng cách NV1)
  const estimatedTotalScore = estimatedChemScore !== null
    ? Math.round(estimatedChemScore * 3 * 100) / 100
    : null;

  const targetChemScore = Number(profile.targetChemScore) || (nv1?.s2025 ? Math.round((nv1.s2025 / 3) * 4) / 4 : 8.5);
  const targetTotalScore = Number(profile.targetTotalScore) || (nv1?.s2025 || 25.5);

  const chemGap = estimatedChemScore !== null
    ? Math.round((targetChemScore - estimatedChemScore) * 100) / 100
    : null;

  const eloInfo = computeEloInfo(overview?.avgMastery ?? null, overview?.totalAnswers || 0);

  // Đánh giá từng nguyện vọng
  const evaluatedWishes = wishes.map((w, idx) => {
    const reqChem = w.s2025 ? Math.round((w.s2025 / 3) * 100) / 100 : null;
    const status = classifyFeasibility(estimatedTotalScore, w.s2025);
    return {
      ...w,
      rank: idx + 1,
      requiredChemScore: reqChem,
      trendDelta: (w.s2025 && w.s2024) ? Math.round((w.s2025 - w.s2024) * 100) / 100 : null,
      feasibility: status,
    };
  });

  // Phân loại chương yếu / chương kéo tụt điểm mục tiêu
  const activeChapters = (chapters || []).filter((c) => c?.chapter?.bank !== false);
  const weakChapters = activeChapters.filter((c) => c.state === 'weak' || c.state === 'forming');
  const untestedChapters = activeChapters.filter((c) => c.state === 'none' || c.state === 'insufficient');
  const masteredChapters = activeChapters.filter((c) => c.state === 'mastered' || c.state === 'proficient' || c.state === 'strong');

  // Chọn chương trọng tâm hôm nay
  const focusChapter = weakChapters[0] || untestedChapters[0] || activeChapters[0] || null;

  // Gợi ý mức độ luyện tập dựa trên mục tiêu điểm Hóa
  const recommendedLevel = targetChemScore >= 8.75 ? 'vd' : targetChemScore >= 7.5 ? 'th' : 'nb';
  const recommendedLevelLabel = recommendedLevel === 'vd'
    ? 'Vận dụng (Mục tiêu 8.5–10đ)'
    : recommendedLevel === 'th'
      ? 'Thông hiểu (Mục tiêu 7.5–8.5đ)'
      : 'Nhận biết (Xây gốc 6.5–7.5đ)';

  // 3 Nhiệm vụ Hôm nay chuẩn 9Study
  const dailyMissions = [
    {
      id: 'mission-theory',
      pillar: 'Lý thuyết trọng tâm',
      badge: 'Bước 1 · Nắm bản chất',
      title: focusChapter
        ? `Đọc trọng tâm & lỗi hay sai: ${focusChapter.chapter.name}`
        : 'Chọn chuyên đề đầu tiên để xem tóm tắt trọng tâm',
      subtitle: focusChapter?.summary
        ? `Hiện đạt ${focusChapter.mastery.score ?? 0}% thành thạo · Nắm chắc bẫy lý thuyết để giữ trọn điểm cơ bản`
        : 'Xem tóm tắt kiến thức cốt lõi và các bẫy trắc nghiệm thường gặp trước khi làm bài',
      duration: '10 phút',
      chapterId: focusChapter?.chapter?.id || null,
      actionType: 'open',
      cta: 'Mở trọng tâm',
      done: Boolean(focusChapter?.summary && focusChapter.summary.answers >= 5),
    },
    {
      id: 'mission-practice',
      pillar: 'Luyện chuyên đề nâng Elo',
      badge: `Bước 2 · ${recommendedLevelLabel}`,
      title: focusChapter
        ? `Luyện 10 câu chuyên đề "${focusChapter.chapter.name}"`
        : 'Làm 10 câu đánh giá năng lực đầu vào',
      subtitle: chemGap !== null && chemGap > 0
        ? `Cần tăng thêm +${chemGap} điểm Hóa để chạm chuẩn ${nv1 ? nv1.uni : 'mục tiêu'}`
        : 'Tích lũy bằng chứng thực tế để cập nhật điểm dự kiến và hệ số Elo',
      duration: '20 phút',
      chapterId: focusChapter?.chapter?.id || null,
      actionType: 'practice',
      cta: 'Luyện ngay',
      done: Boolean((overview?.streak || 0) > 0 && events.some((e) => (now - (e.at || 0)) < DAY)),
    },
    {
      id: 'mission-review',
      pillar: 'Sổ lỗi sai & Thẻ SRS',
      badge: 'Bước 3 · Chống quên ngắt quãng',
      title: (dueTotal + cardsDue) > 0
        ? `Xử lý ${dueTotal} câu trả lời sai & ${cardsDue} thẻ ghi nhớ đến hạn`
        : 'Củng cố lại các câu vận dụng trong chuyên đề vừa học',
      subtitle: (dueTotal + cardsDue) > 0
        ? 'Ôn đúng thời điểm vàng giúp tăng 40% khả năng nhớ lâu trong phòng thi'
        : 'Hiện không có câu sai tồn đọng — duy trì phong độ rất tốt!',
      duration: '15 phút',
      chapterId: focusChapter?.chapter?.id || null,
      actionType: (dueTotal > 0) ? 'review' : (cardsDue > 0 ? 'flashcard' : 'practice'),
      cta: (dueTotal > 0) ? `Ôn ${dueTotal} câu sai` : (cardsDue > 0 ? `Lật ${cardsDue} thẻ` : 'Ôn củng cố'),
      done: (dueTotal + cardsDue) === 0 && hasEvidence,
    },
  ];

  // Trạng thái Quy trình 5 Bước
  const step1Done = wishes.length > 0;
  const step2Done = Boolean(profile.examType && profile.examBlock && targetChemScore > 0);
  const step3Done = hasEvidence && (overview?.totalAnswers || 0) >= 10;
  const step4Done = step3Done && masteredChapters.length >= Math.max(1, Math.ceil(activeChapters.length * 0.4));
  const step5Done = step4Done && estimatedChemScore !== null && estimatedChemScore >= targetChemScore;

  const doneFlags = [step1Done, step2Done, step3Done, step4Done, step5Done];
  const firstPendingIdx = doneFlags.findIndex((d) => !d);
  const currentStepIndex = firstPendingIdx === -1 ? 4 : firstPendingIdx;

  const stages = NINE_STUDY_STAGES.map((st, idx) => {
    const done = doneFlags[idx];
    const active = idx === currentStepIndex;
    let metric = '';
    if (idx === 0) metric = wishes.length ? `Đã chọn ${wishes.length}/3 nguyện vọng` : 'Chưa chọn trường';
    if (idx === 1) metric = `${examMeta.shortLabel} · Khối ${blockMeta.label} · Mục tiêu ${targetChemScore}đ`;
    if (idx === 2) metric = hasEvidence ? `Elo ${eloInfo.elo} · Dự kiến ${estimatedChemScore}/10đ` : `Đã làm ${overview?.totalAnswers || 0}/10 câu tối thiểu`;
    if (idx === 3) metric = `${masteredChapters.length}/${activeChapters.length} chương vững · ${dueTotal} câu cần ôn`;
    if (idx === 4) metric = chemGap === null ? 'Chờ điểm xuất phát' : (chemGap <= 0 ? 'Đã đạt điểm mục tiêu!' : `Còn cách mục tiêu +${chemGap}đ`);
    return {
      ...st,
      done,
      active,
      metric,
    };
  });

  const monthlyCalendar = buildMonthlyActivity(events, now);

  return {
    wishes: evaluatedWishes,
    nv1: evaluatedWishes[0] || null,
    examMeta,
    blockMeta,
    hasEvidence,
    estimatedChemScore,
    estimatedTotalScore,
    targetChemScore,
    targetTotalScore,
    chemGap,
    eloInfo,
    stages,
    currentStep: currentStepIndex + 1,
    dailyMissions,
    monthlyCalendar,
    weakCount: weakChapters.length,
    masteredCount: masteredChapters.length,
    totalChapters: activeChapters.length,
    catalog: CUTOFF_DATA,
  };
}
