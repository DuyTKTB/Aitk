/* ============================================================
   studentAnalytics.js — Bộ phân tích học tập phía Học sinh
   - Tính & lưu điểm ELO năng lực sau mỗi bài thi
   - Phân tích độ chính xác theo 3 Phần GDPT 2025 (P.I, P.II, P.III)
   - Đánh giá tốc độ làm bài (giây/câu so với chuẩn đề)
   - Thống kê tỷ trọng nguyên nhân sai cho Sổ lỗi sai
   - So sánh điểm năng lực học sinh với điểm chuẩn Đại học
   ============================================================ */

const ELO_STORAGE_PREFIX = 'elec_student_elo_v1_';
const TARGET_UNI_PREFIX = 'elec_student_target_uni_v1_';
const COMBAT_POWER_PREFIX = 'elec_student_power_v1_';
const WRONG_NOTES_PREFIX = 'elec_wrong_notes_v1_';
const EXAM_DRAFT_PREFIX = 'elec_exam_drafts_v1_';
const REWARD_SHOP_PREFIX = 'elec_reward_shop_v1_';
const BASE_ELO = 1200;
const BASE_POWER = 1000;

function emitAnalyticsKeyChanged(key) {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
  try {
    if (key) window.dispatchEvent(new CustomEvent('cs-ls', { detail: key }));
    window.dispatchEvent(new CustomEvent('elec-student-analytics-change', { detail: { key } }));
  } catch { /* ignore */ }
}

export function getStudentElo(uid = 'guest') {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { elo: BASE_ELO, history: [] };
  }
  try {
    const raw = window.localStorage.getItem(`${ELO_STORAGE_PREFIX}${uid || 'guest'}`);
    if (!raw) return { elo: BASE_ELO, history: [] };
    const parsed = JSON.parse(raw);
    return {
      elo: Number.isFinite(parsed?.elo) ? parsed.elo : BASE_ELO,
      history: Array.isArray(parsed?.history) ? parsed.history : [],
    };
  } catch {
    return { elo: BASE_ELO, history: [] };
  }
}

export function computeEloUpdate({ currentElo = BASE_ELO, pct = 0, totalQuestions = 10 } = {}) {
  const safePct = Math.max(0, Math.min(100, Number(pct) || 0));
  const weight = Math.min(1.4, Math.max(0.6, (Number(totalQuestions) || 10) / 20));
  // Baseline expectation at 60%; scoring above 60% gains ELO, below 55% loses mildly
  const rawDelta = Math.round(((safePct - 58) / 1.65) * weight);
  const delta = Math.max(-28, Math.min(42, rawDelta));
  const nextElo = Math.max(800, Math.min(2600, Math.round(currentElo + delta)));
  const rank =
    nextElo >= 1800
      ? { label: 'Tinh Anh', tone: 'violet' }
      : nextElo >= 1500
        ? { label: 'Học Bá', tone: 'blue' }
        : nextElo >= 1300
          ? { label: 'Vững Vàng', tone: 'emerald' }
          : nextElo >= 1150
            ? { label: 'Tăng Tốc', tone: 'amber' }
            : { label: 'Khởi Động', tone: 'slate' };
  return { currentElo, delta, nextElo, rank };
}

export function recordStudentEloOnce({ uid = 'guest', attemptKey, pct, totalQuestions }) {
  const state = getStudentElo(uid);
  const key = String(attemptKey || '');
  if (key) {
    const existing = state.history.find((h) => h.key === key);
    if (existing) {
      return {
        currentElo: existing.before,
        delta: existing.delta,
        nextElo: existing.after,
        rank: computeEloUpdate({ currentElo: existing.after, pct: 60 }).rank,
      };
    }
  }
  const calc = computeEloUpdate({ currentElo: state.elo, pct, totalQuestions });
  if (typeof window !== 'undefined' && window.localStorage && key) {
    try {
      const nextHistory = [
        ...state.history.slice(-29),
        { key, before: state.elo, delta: calc.delta, after: calc.nextElo, at: Date.now() },
      ];
      const lsKey = `${ELO_STORAGE_PREFIX}${uid || 'guest'}`;
      window.localStorage.setItem(
        lsKey,
        JSON.stringify({ elo: calc.nextElo, history: nextHistory })
      );
      emitAnalyticsKeyChanged(lsKey);
    } catch { /* ignore */ }
  }
  return calc;
}

/**
 * Phân tích độ chính xác theo 3 Phần chuẩn GDPT 2025 + Tốc độ làm bài
 */
export function buildPostExamAnalytics({ exam, result } = {}) {
  const questions = exam?.questions || [];
  const detail = result?.detail || [];
  const parts = {
    1: { part: 1, label: 'Phần I · Nhiều lựa chọn', correct: 0, total: 0 },
    2: { part: 2, label: 'Phần II · Đúng / Sai', correct: 0, total: 0 },
    3: { part: 3, label: 'Phần III · Trả lời ngắn', correct: 0, total: 0 },
    4: { part: 4, label: 'Phần Tự luận / Đọc hiểu mở', correct: 0, total: 0 },
  };

  questions.forEach((q, i) => {
    const p = q.type === 'essay' || q.part === 4
      ? 4
      : q.part || (q.type === 'true_false' || Array.isArray(q.statements) ? 2 : q.type === 'short_answer' ? 3 : 1);
    const bucket = parts[p] || parts[1];
    bucket.total += 1;
    if (detail[i]?.isCorrect) bucket.correct += 1;
  });

  const partBreakdown = Object.values(parts)
    .filter((b) => b.total > 0)
    .map((b) => ({
      ...b,
      pct: Math.round((b.correct / b.total) * 100),
    }));

  const qCount = questions.length || result?.total || 1;
  const durationSec = Math.max(60, (Number(exam?.duration) || 45) * 60);
  const timeSpent = Math.max(0, Number(result?.timeSpent) || 0);
  const secPerQuestion = timeSpent > 0 ? Math.round(timeSpent / qCount) : null;
  const targetSecPerQuestion = Math.round(durationSec / qCount);

  let paceStatus = { label: 'Chưa đo thời gian', tone: 'slate', hint: '' };
  if (secPerQuestion != null) {
    if (secPerQuestion <= targetSecPerQuestion * 0.45) {
      paceStatus = {
        label: `${secPerQuestion}s/câu · Khá nhanh`,
        tone: 'amber',
        hint: 'Làm nhanh hơn nhịp chuẩn — chú ý đọc kỹ câu dễ mắc bẫy.',
      };
    } else if (secPerQuestion <= targetSecPerQuestion * 1.05) {
      paceStatus = {
        label: `${secPerQuestion}s/câu · Nhịp tối ưu`,
        tone: 'emerald',
        hint: `Phân bổ thời gian chuẩn đẹp (nhịp tiêu chuẩn ~${targetSecPerQuestion}s/câu).`,
      };
    } else {
      paceStatus = {
        label: `${secPerQuestion}s/câu · Hơi chậm`,
        tone: 'danger',
        hint: `Vượt nhịp chuẩn (${targetSecPerQuestion}s/câu) — nên bỏ qua câu khó để làm cuối.`,
      };
    }
  }

  return { partBreakdown, secPerQuestion, targetSecPerQuestion, paceStatus };
}

/**
 * Thống kê tỷ trọng nguyên nhân sai trong Sổ lỗi sai
 */
export function buildWrongCauseBreakdown(wrongItems = [], customCauses = {}, inferFn, causeDefs = []) {
  const counts = {};
  const validDefs = causeDefs.filter((c) => c.id !== 'all');
  validDefs.forEach((c) => { counts[c.id] = 0; });

  wrongItems.forEach((item) => {
    const q = item?.question || item || {};
    const qid = q.id ?? item?.questionId ?? item?.id;
    const cid = customCauses[qid] || (typeof inferFn === 'function' ? inferFn(q) : 'concept');
    counts[cid] = (counts[cid] || 0) + 1;
  });

  const total = wrongItems.length || 0;
  return validDefs
    .map((c) => ({
      ...c,
      count: counts[c.id] || 0,
      pct: total > 0 ? Math.round(((counts[c.id] || 0) / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Lưu / tải Nguyện vọng 1 (Target University Major) của học sinh
 */
export function loadTargetUniversity(uid = 'guest') {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(`${TARGET_UNI_PREFIX}${uid || 'guest'}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveTargetUniversity(uid = 'guest', majorRecord = null) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const key = `${TARGET_UNI_PREFIX}${uid || 'guest'}`;
    if (!majorRecord) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(majorRecord));
    emitAnalyticsKeyChanged(key);
  } catch { /* ignore */ }
}

/**
 * Đánh giá chênh lệch điểm học sinh vs điểm chuẩn Đại học
 */
export function evaluateAdmissionFit(myAvg, cutoffScore) {
  if (myAvg == null || cutoffScore == null) return null;
  const diff = Number((cutoffScore - myAvg).toFixed(2));
  if (diff <= 0) {
    return { status: 'safe', diff: Math.abs(diff), text: `Vượt +${Math.abs(diff).toFixed(1)}đ · An toàn` };
  }
  if (diff <= 1.5) {
    return { status: 'near', diff, text: `Còn thiếu ${diff.toFixed(1)}đ · Rất sát` };
  }
  return { status: 'far', diff, text: `Còn thiếu ${diff.toFixed(1)}đ` };
}

/**
 * Ước tính điểm năng lực quy đổi thang 30 từ lịch sử Phòng thi ảo & Lộ trình (thay thế số 24.5 cứng)
 */
export function computeRealPredictedScore30({ virtualHistory = [], overviewAvgPct = null } = {}) {
  const scores30 = (virtualHistory || [])
    .filter((h) => typeof h?.score === 'number' && (h.totalPoints || 10) > 0)
    .slice(0, 12)
    .map((h) => (h.score / (h.totalPoints || 10)) * 30);

  if (scores30.length > 0) {
    const avg = scores30.reduce((s, v) => s + v, 0) / scores30.length;
    return Math.round(avg * 10) / 10;
  }
  if (typeof overviewAvgPct === 'number' && overviewAvgPct > 0) {
    return Math.round((overviewAvgPct / 100) * 30 * 10) / 10;
  }
  return null;
}

/**
 * Xây dựng 3 Nhiệm Vụ Học Tập Hôm Nay (Daily Mission Strip) trên Trang chủ Học sinh
 */
export function buildDailyStudyMissions({
  wrongCount = 0,
  virtualHistory = [],
  dueTotal = 0,
  cardsDue = 0,
  targetExamType = 'THPTQG',
  now = Date.now(),
} = {}) {
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const startMs = todayStart.getTime();

  const examsToday = (virtualHistory || []).filter((h) => {
    const t = new Date(h?.completedAt || h?.submittedAt || h?.date || 0).getTime();
    return Number.isFinite(t) && t >= startMs;
  }).length;

  const srsDue = (Number(dueTotal) || 0) + (Number(cardsDue) || 0);

  const tasks = [
    {
      id: 'exam',
      title: `Làm 1 đề ${targetExamType} hôm nay`,
      subtitle: examsToday > 0 ? `Đã hoàn thành ${examsToday} đề hôm nay` : 'Bấm giờ chuẩn GDPT 2025 để tăng ELO',
      done: examsToday > 0,
      cta: examsToday > 0 ? 'Luyện thêm' : 'Vào phòng thi',
      href: `#virtual-exams?type=${encodeURIComponent(targetExamType)}`,
      tone: 'blue',
    },
    {
      id: 'wrong',
      title: wrongCount > 0 ? `Vá ${Math.min(5, wrongCount)}/${wrongCount} câu Sổ lỗi sai` : 'Sổ lỗi sai đang sạch bóng',
      subtitle: wrongCount > 0 ? 'Chạy Đề Vá Lỗi 5 phút dọn sạch bẫy đề' : 'Chưa có câu sai tồn đọng — rất tốt!',
      done: wrongCount === 0,
      cta: wrongCount > 0 ? 'Vá lỗi 5p' : 'Mở sổ lỗi',
      href: '#notebook',
      tone: 'rose',
    },
    {
      id: 'srs',
      title: srsDue > 0 ? `Ôn ${srsDue} mục Lộ trình & Flashcard` : 'Đã hoàn tất ôn tập SRS hôm nay',
      subtitle: srsDue > 0 ? 'Nhắc lại ngắt quãng giúp nhớ lâu gấp 3 lần' : 'Tiếp tục mở chương mới trên Lộ trình',
      done: srsDue === 0,
      cta: srsDue > 0 ? 'Ôn ngay' : 'Xem lộ trình',
      href: '#roadmap',
      tone: 'emerald',
    },
  ];

  const completedCount = tasks.filter((t) => t.done).length;
  return {
    tasks,
    completedCount,
    totalCount: tasks.length,
    pct: Math.round((completedCount / tasks.length) * 100),
    examsToday,
  };
}

/**
 * Cơ chế Lực Chiến (Combat Power) + Lực Chiến đang chờ ở các câu làm sai (kiểu 9Study)
 */
const POWER_TIERS = [
  { min: 0, label: 'Tân Binh', next: 1200 },
  { min: 1200, label: 'Học Sĩ', next: 1600 },
  { min: 1600, label: 'Kiếm Sĩ', next: 2200 },
  { min: 2200, label: 'Học Bá', next: 3000 },
  { min: 3000, label: 'Đại Sư', next: 4500 },
  { min: 4500, label: 'Huyền Thoại', next: 6000 },
];

export function getCombatPowerTier(power = BASE_POWER) {
  let cur = POWER_TIERS[0];
  for (const t of POWER_TIERS) {
    if (power >= t.min) cur = t;
  }
  const span = Math.max(1, cur.next - cur.min);
  const pct = Math.min(100, Math.round(((power - cur.min) / span) * 100));
  return { ...cur, pct };
}

export function getStudentCombatPower(uid = 'guest') {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { power: BASE_POWER, history: [], tier: getCombatPowerTier(BASE_POWER) };
  }
  try {
    const raw = window.localStorage.getItem(`${COMBAT_POWER_PREFIX}${uid || 'guest'}`);
    if (!raw) return { power: BASE_POWER, history: [], tier: getCombatPowerTier(BASE_POWER) };
    const parsed = JSON.parse(raw);
    const power = Number.isFinite(parsed?.power) ? parsed.power : BASE_POWER;
    return {
      power,
      history: Array.isArray(parsed?.history) ? parsed.history : [],
      tier: getCombatPowerTier(power),
    };
  } catch {
    return { power: BASE_POWER, history: [], tier: getCombatPowerTier(BASE_POWER) };
  }
}

export function recordCombatPowerOnce({ uid = 'guest', attemptKey, correctCount = 0, wrongCount = 0 }) {
  const earned = Math.max(0, Math.round(Number(correctCount) || 0) * 12);
  const waitingFromMistakes = Math.max(0, Math.round(Number(wrongCount) || 0) * 15);
  const state = getStudentCombatPower(uid);
  const key = String(attemptKey || '');

  if (key) {
    const existing = state.history.find((h) => h.key === key);
    if (existing) {
      return {
        earned: existing.earned,
        waitingFromMistakes,
        totalPower: existing.after,
        tier: getCombatPowerTier(existing.after),
      };
    }
  }

  const totalPower = state.power + earned;
  if (typeof window !== 'undefined' && window.localStorage && key) {
    try {
      const nextHistory = [
        ...state.history.slice(-29),
        { key, earned, after: totalPower, at: Date.now() },
      ];
      const lsKey = `${COMBAT_POWER_PREFIX}${uid || 'guest'}`;
      window.localStorage.setItem(
        lsKey,
        JSON.stringify({ power: totalPower, history: nextHistory })
      );
      emitAnalyticsKeyChanged(lsKey);
    } catch { /* ignore */ }
  }

  return {
    earned,
    waitingFromMistakes,
    totalPower,
    tier: getCombatPowerTier(totalPower),
  };
}

/**
 * Ghi chú cá nhân (tối đa 500 ký tự) cho từng câu hỏi trong Sổ lỗi sai
 */
export function loadWrongQuestionNotes(uid = 'guest') {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  try {
    return JSON.parse(window.localStorage.getItem(`${WRONG_NOTES_PREFIX}${uid || 'guest'}`) || '{}');
  } catch {
    return {};
  }
}

export function saveWrongQuestionNote(uid = 'guest', qid, noteText = '') {
  const current = loadWrongQuestionNotes(uid);
  const clean = String(noteText || '').slice(0, 500);
  const next = { ...current };
  if (clean.trim()) next[qid] = clean;
  else delete next[qid];
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const lsKey = `${WRONG_NOTES_PREFIX}${uid || 'guest'}`;
      window.localStorage.setItem(lsKey, JSON.stringify(next));
      emitAnalyticsKeyChanged(lsKey);
    } catch { /* ignore */ }
  }
  return next;
}

/**
 * Gom lịch sử hoạt động 365 ngày (GitHub-style Heatmap) từ mọi nguồn thật trên thiết bị
 */
export function buildActivityHeatmap365({
  virtualHistory = [],
  roadmapSessions = [],
  pomodoroHistory = {},
  days = 182,
  now = Date.now(),
} = {}) {
  const counts = {};
  const toKey = (ts) => {
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  (virtualHistory || []).forEach((h) => {
    const k = toKey(h?.completedAt || h?.submittedAt || h?.date);
    if (k) counts[k] = (counts[k] || 0) + 2;
  });

  (roadmapSessions || []).forEach((s) => {
    const k = toKey(s?.at);
    if (k) counts[k] = (counts[k] || 0) + 1;
  });

  Object.entries(pomodoroHistory || {}).forEach(([k, val]) => {
    if (val > 0) {
      const normalized = /^\d{4}-\d{2}-\d{2}$/.test(k) ? k : toKey(k);
      if (normalized) counts[normalized] = (counts[normalized] || 0) + Number(val);
    }
  });

  const endDate = new Date(now);
  endDate.setHours(0, 0, 0, 0);
  const cells = [];
  let activeDays = 0;
  let totalActions = 0;

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(endDate.getTime() - i * 86400000);
    const key = toKey(d.getTime());
    const count = counts[key] || 0;
    if (count > 0) activeDays++;
    totalActions += count;
    const level = count === 0 ? 0 : count === 1 ? 1 : count <= 3 ? 2 : count <= 6 ? 3 : 4;
    cells.push({
      key,
      label: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      count,
      level,
    });
  }

  return { cells, activeDays, totalActions };
}

/**
 * Tính 6 trục Năng lực Học sinh (0..100) cho Biểu đồ Radar trên Hồ sơ Học viên
 */
export function computeStudentAbilityRadar({
  virtualHistory = [],
  roadmapSessions = [],
  pomodoroHistory = {},
  streakDays = 0,
  wrongCount = 0,
  elo = BASE_ELO,
} = {}) {
  const hist = Array.isArray(virtualHistory) ? virtualHistory : [];
  const pcts = hist
    .map((h) => {
      if (Number.isFinite(h?.pct)) return Number(h.pct);
      if (Number.isFinite(h?.score) && Number.isFinite(h?.totalPoints) && h.totalPoints > 0) {
        return (Number(h.score) / Number(h.totalPoints)) * 100;
      }
      return null;
    })
    .filter((v) => v !== null);

  const avgPct = pcts.length ? pcts.reduce((s, v) => s + v, 0) / pcts.length : 52;
  const bestPct = pcts.length ? Math.max(...pcts) : avgPct;

  // Tốc độ làm bài (từ timeSpent / totalQuestions nếu có)
  const paceScores = hist
    .map((h) => {
      const sec = Number(h?.timeSpent || h?.sec || 0);
      const total = Number(h?.total || h?.questionCount || 0);
      if (sec <= 0 || total <= 0) return null;
      const spq = sec / total;
      if (spq <= 65) return 92;
      if (spq <= 95) return 80;
      if (spq <= 125) return 66;
      return 48;
    })
    .filter((v) => v !== null);
  const speedScore = paceScores.length
    ? Math.round(paceScores.reduce((s, v) => s + v, 0) / paceScores.length)
    : Math.min(88, Math.round(45 + Math.min(hist.length, 6) * 5));

  const accuracyScore = Math.round(Math.min(99, Math.max(25, avgPct)));
  const advancedScore = Math.round(
    Math.min(99, Math.max(22, bestPct * 0.65 + ((elo - 800) / 1400) * 35))
  );

  const consistencyScore = Math.round(
    Math.min(100, Math.max(20, 28 + streakDays * 5 + Math.min(hist.length, 10) * 3))
  );

  const pomoTotal = Object.values(pomodoroHistory || {}).reduce((s, v) => s + (Number(v) || 0), 0);
  const focusScore = Math.round(
    Math.min(100, Math.max(25, 32 + pomoTotal * 4 + Math.min((roadmapSessions || []).length, 12) * 3))
  );

  const masteryScore = Math.round(
    Math.min(98, Math.max(28, 86 - Math.min(wrongCount, 24) * 2.2 + Math.min((roadmapSessions || []).length, 10) * 1.2))
  );

  const axes = [
    { key: 'accuracy', label: 'Chính xác', score: accuracyScore },
    { key: 'speed', label: 'Tốc độ', score: speedScore },
    { key: 'advanced', label: 'Vận dụng cao', score: advancedScore },
    { key: 'consistency', label: 'Độ bền chuỗi', score: consistencyScore },
    { key: 'focus', label: 'Tập trung sâu', score: focusScore },
    { key: 'mastery', label: 'Vá lỗ hổng', score: masteryScore },
  ];

  const overall = Math.round(axes.reduce((s, a) => s + a.score, 0) / axes.length);
  const sorted = [...axes].sort((a, b) => b.score - a.score);

  return {
    axes,
    overall,
    strongest: sorted[0],
    weakest: sorted[sorted.length - 1],
  };
}

/**
 * Chẩn đoán học tập thông minh + Cảnh báo chống quên (Ebbinghaus) cho StatsPage
 */
export function computeStudyDiagnosis({
  attempts = [],
  streakDays = 0,
  wrongCount = 0,
  now = Date.now(),
} = {}) {
  const list = [...(attempts || [])]
    .filter((a) => Number.isFinite(a?.pct) && Number.isFinite(a?.t))
    .sort((a, b) => b.t - a.t);

  const recent3 = list.slice(0, 3);
  const prev3 = list.slice(3, 6);
  const avgRecent = recent3.length ? recent3.reduce((s, a) => s + a.pct, 0) / recent3.length : 0;
  const avgPrev = prev3.length ? prev3.reduce((s, a) => s + a.pct, 0) / prev3.length : avgRecent;
  const trendDelta = prev3.length ? Math.round(avgRecent - avgPrev) : 0;

  let trendLabel = 'Chưa đủ dữ liệu xu hướng';
  let trendTone = 'slate';
  if (list.length >= 2) {
    if (trendDelta >= 5) {
      trendLabel = `Đang bứt phá (+${trendDelta}%)`;
      trendTone = 'emerald';
    } else if (trendDelta <= -5) {
      trendLabel = `Đang chững lại (${trendDelta}%)`;
      trendTone = 'rose';
    } else {
      trendLabel = 'Phong độ ổn định';
      trendTone = 'blue';
    }
  }

  // Độ ổn định (dựa vào độ lệch chuẩn của 6 bài gần nhất + streak)
  const sample = list.slice(0, 6).map((a) => a.pct);
  let consistencyScore = Math.min(100, Math.round(35 + streakDays * 6));
  if (sample.length >= 2) {
    const meanVal = sample.reduce((s, v) => s + v, 0) / sample.length;
    const variance = sample.reduce((s, v) => s + (v - meanVal) ** 2, 0) / sample.length;
    const sd = Math.sqrt(variance);
    consistencyScore = Math.round(
      Math.min(100, Math.max(25, 100 - sd * 1.45 + Math.min(streakDays, 14) * 1.1))
    );
  }

  const lastAt = list[0]?.t || 0;
  const daysSinceLastStudy = lastAt ? Math.max(0, Math.floor((now - lastAt) / 86400000)) : 99;

  let forgettingRisk = { level: 'low', label: 'Trí nhớ đang nóng', tone: 'emerald' };
  if (daysSinceLastStudy >= 4 || wrongCount >= 10) {
    forgettingRisk = { level: 'high', label: 'Nguy cơ quên cao', tone: 'rose' };
  } else if (daysSinceLastStudy >= 2 || wrongCount >= 4) {
    forgettingRisk = { level: 'medium', label: 'Cần ôn nhắc nhịp SRS', tone: 'amber' };
  }

  let recommendation = 'Duy trì mỗi ngày 1 đề mini hoặc 1 phiên Đấu tốc độ 5 câu để giữ đỉnh phong độ.';
  if (wrongCount >= 5) {
    recommendation = `Bạn có ${wrongCount} câu sai tồn đọng — hãy mở Sổ lỗi sai làm Đề Vá Lỗi 5 Phút trước khi sang đề mới.`;
  } else if (daysSinceLastStudy >= 3 && list.length > 0) {
    recommendation = `Đã ${daysSinceLastStudy} ngày bạn chưa luyện đề — hãy làm ngay 1 vòng Đấu tốc độ 5 câu để kích hoạt lại trí nhớ.`;
  } else if (trendDelta <= -5) {
    recommendation = 'Điểm các đề gần đây giảm nhẹ — nên rà soát lại Phần II Đúng/Sai và giảm tốc độ đọc đề để tránh bẫy phủ định.';
  } else if (trendDelta >= 5) {
    recommendation = 'Đà tăng điểm rất tốt! Có thể nâng độ khó lên các đề VIP/ĐGNL để kéo dự đoán /30 vượt điểm chuẩn NV1.';
  }

  return {
    consistencyScore,
    trendDelta,
    trendLabel,
    trendTone,
    daysSinceLastStudy,
    forgettingRisk,
    recommendation,
    avgRecent: Math.round(avgRecent),
  };
}

/**
 * Bộ tính toán biểu thức khoa học an toàn (KHÔNG dùng eval/Function) cho máy tính nháp trong Phòng thi
 */
export function evaluateSafeMathExpr(rawExpr = '') {
  const cleaned = String(rawExpr || '')
    .replace(/,/g, '.')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/π/gi, 'pi')
    .replace(/\s+/g, '');

  if (!cleaned) return { ok: false, error: 'Nhập biểu thức để tính' };
  if (cleaned.length > 120) return { ok: false, error: 'Biểu thức quá dài' };

  // Tokenize
  const tokens = [];
  let i = 0;
  while (i < cleaned.length) {
    const ch = cleaned[i];
    if (/[0-9.]/.test(ch)) {
      let numStr = '';
      let dots = 0;
      while (i < cleaned.length && /[0-9.]/.test(cleaned[i])) {
        if (cleaned[i] === '.') dots++;
        numStr += cleaned[i++];
      }
      if (dots > 1 || numStr === '.') return { ok: false, error: 'Số không hợp lệ' };
      tokens.push({ type: 'num', value: parseFloat(numStr) });
      continue;
    }
    if (/[a-zA-Z]/.test(ch)) {
      let id = '';
      while (i < cleaned.length && /[a-zA-Z]/.test(cleaned[i])) id += cleaned[i++];
      const low = id.toLowerCase();
      if (low === 'pi') {
        tokens.push({ type: 'num', value: Math.PI });
      } else if (low === 'e') {
        tokens.push({ type: 'num', value: Math.E });
      } else if (['sqrt', 'abs', 'sin', 'cos', 'tan', 'log', 'ln'].includes(low)) {
        tokens.push({ type: 'fn', value: low });
      } else {
        return { ok: false, error: `Hàm không hỗ trợ: ${id}` };
      }
      continue;
    }
    if ('+-*/^()'.includes(ch)) {
      tokens.push({ type: 'op', value: ch });
      i++;
      continue;
    }
    return { ok: false, error: `Ký tự không hợp lệ: ${ch}` };
  }

  let pos = 0;
  const peek = () => tokens[pos];
  const consume = () => tokens[pos++];

  function parseExpr() {
    let left = parseTerm();
    while (peek()?.type === 'op' && (peek().value === '+' || peek().value === '-')) {
      const op = consume().value;
      const right = parseTerm();
      left = op === '+' ? left + right : left - right;
    }
    return left;
  }

  function parseTerm() {
    let left = parsePower();
    while (peek()?.type === 'op' && (peek().value === '*' || peek().value === '/')) {
      const op = consume().value;
      const right = parsePower();
      if (op === '/' && right === 0) throw new Error('Không thể chia cho 0');
      left = op === '*' ? left * right : left / right;
    }
    return left;
  }

  function parsePower() {
    let base = parseUnary();
    if (peek()?.type === 'op' && peek().value === '^') {
      consume();
      const exp = parsePower();
      base = Math.pow(base, exp);
    }
    return base;
  }

  function parseUnary() {
    if (peek()?.type === 'op' && (peek().value === '+' || peek().value === '-')) {
      const op = consume().value;
      const val = parseUnary();
      return op === '-' ? -val : val;
    }
    return parsePrimary();
  }

  function parsePrimary() {
    const t = peek();
    if (!t) throw new Error('Biểu thức thiếu toán hạng');
    if (t.type === 'num') {
      consume();
      return t.value;
    }
    if (t.type === 'fn') {
      const fn = consume().value;
      if (peek()?.type !== 'op' || peek().value !== '(') {
        throw new Error(`Thiếu dấu ngoặc sau ${fn}`);
      }
      consume();
      const arg = parseExpr();
      if (peek()?.type !== 'op' || peek().value !== ')') {
        throw new Error('Thiếu dấu đóng ngoặc )');
      }
      consume();
      if (fn === 'sqrt') {
        if (arg < 0) throw new Error('Căn bậc hai số âm');
        return Math.sqrt(arg);
      }
      if (fn === 'abs') return Math.abs(arg);
      if (fn === 'sin') return Math.sin(arg);
      if (fn === 'cos') return Math.cos(arg);
      if (fn === 'tan') return Math.tan(arg);
      if (fn === 'log') {
        if (arg <= 0) throw new Error('log10 cần số dương');
        return Math.log10(arg);
      }
      if (fn === 'ln') {
        if (arg <= 0) throw new Error('ln cần số dương');
        return Math.log(arg);
      }
    }
    if (t.type === 'op' && t.value === '(') {
      consume();
      const val = parseExpr();
      if (peek()?.type !== 'op' || peek().value !== ')') {
        throw new Error('Thiếu dấu đóng ngoặc )');
      }
      consume();
      return val;
    }
    throw new Error('Cú pháp biểu thức không hợp lệ');
  }

  try {
    const val = parseExpr();
    if (pos < tokens.length) return { ok: false, error: 'Dư ký tự trong biểu thức' };
    if (!Number.isFinite(val)) return { ok: false, error: 'Kết quả không xác định' };
    const rounded = Math.abs(val) < 1e-12 ? 0 : Number(val.toFixed(6));
    return { ok: true, value: rounded, formatted: String(rounded) };
  } catch (err) {
    return { ok: false, error: err?.message || 'Biểu thức không hợp lệ' };
  }
}

/**
 * Biểu đồ phân bố điểm 10 khoảng (Histogram) & Percentile "Cao hơn X% thí sinh"
 * Hiệu chỉnh theo phân bố phổ điểm thi THPTQG môn KHTN thực tế
 */
const NATIONAL_DIST_WEIGHTS = [1.5, 2.5, 4.5, 7.5, 12.0, 17.5, 21.0, 17.5, 11.5, 4.5];

export function buildScoreDistributionHistogram(pct = 0) {
  const safePct = Math.min(100, Math.max(0, Number(pct) || 0));
  const score10 = safePct / 10;
  const userBinIdx = Math.min(9, Math.max(0, Math.floor(score10 === 10 ? 9 : score10)));

  let cumulativeBelow = 0;
  for (let i = 0; i < userBinIdx; i++) cumulativeBelow += NATIONAL_DIST_WEIGHTS[i];
  const withinBinFrac = score10 === 10 ? 0.96 : Math.min(0.95, Math.max(0.08, score10 - userBinIdx));
  const percentile = Math.min(99, Math.max(1, Math.round(cumulativeBelow + NATIONAL_DIST_WEIGHTS[userBinIdx] * withinBinFrac)));

  const maxWeight = Math.max(...NATIONAL_DIST_WEIGHTS);
  const bins = NATIONAL_DIST_WEIGHTS.map((w, i) => ({
    idx: i,
    label: `${i}-${i + 1}`,
    pctShare: w,
    heightPct: Math.round((w / maxWeight) * 100),
    isUser: i === userBinIdx,
  }));

  const topPct = Math.max(1, 100 - percentile);
  return {
    bins,
    userBinIdx,
    percentile,
    topPct,
    score10: Number(score10.toFixed(2)),
  };
}

/**
 * Gom kết quả bài thi theo chủ đề / dạng câu hỏi để hiển thị tab Phân tích sâu
 */
export function buildTopicPerformanceBreakdown(rows = []) {
  const map = new Map();
  (rows || []).forEach((r) => {
    const q = r?.q || {};
    const topic =
      q.topic ||
      q.chapter ||
      q.subject ||
      (q.type === 'true_false'
        ? 'Trắc nghiệm Đúng / Sai'
        : q.type === 'short_answer'
          ? 'Trả lời ngắn'
          : 'Trắc nghiệm 4 lựa chọn');
    if (!map.has(topic)) {
      map.set(topic, { topic, total: 0, correct: 0, wrong: 0, skip: 0, firstIdx: r.i ?? 0 });
    }
    const entry = map.get(topic);
    entry.total += 1;
    if (r.status === 'ok') entry.correct += 1;
    else if (r.status === 'no') entry.wrong += 1;
    else entry.skip += 1;
  });

  return Array.from(map.values())
    .map((e) => ({
      ...e,
      pct: e.total > 0 ? Math.round((e.correct / e.total) * 100) : 0,
    }))
    .sort((a, b) => a.pct - b.pct || b.wrong - a.wrong);
}

/**
 * Lưu / tải / xóa bản nháp đề thi đang làm dở (nút "Làm tiếp" trên Phòng thi ảo)
 */
export function listExamDrafts(uid = 'guest') {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  try {
    return JSON.parse(window.localStorage.getItem(`${EXAM_DRAFT_PREFIX}${uid || 'guest'}`) || '{}') || {};
  } catch {
    return {};
  }
}

export function saveExamDraft(uid = 'guest', examId, draft) {
  if (!examId || typeof window === 'undefined' || !window.localStorage) return;
  try {
    const lsKey = `${EXAM_DRAFT_PREFIX}${uid || 'guest'}`;
    const all = listExamDrafts(uid);
    all[examId] = { ...draft, updatedAt: Date.now() };
    window.localStorage.setItem(lsKey, JSON.stringify(all));
    emitAnalyticsKeyChanged(lsKey);
  } catch { /* ignore */ }
}

export function loadExamDraft(uid = 'guest', examId) {
  if (!examId) return null;
  const all = listExamDrafts(uid);
  return all[examId] || null;
}

export function clearExamDraft(uid = 'guest', examId) {
  if (!examId || typeof window === 'undefined' || !window.localStorage) return;
  try {
    const lsKey = `${EXAM_DRAFT_PREFIX}${uid || 'guest'}`;
    const all = listExamDrafts(uid);
    if (all[examId]) {
      delete all[examId];
      window.localStorage.setItem(lsKey, JSON.stringify(all));
      emitAnalyticsKeyChanged(lsKey);
    }
  } catch { /* ignore */ }
}

/**
 * Cửa Hàng Học Bá (Reward Shop): Khung Avatar, Danh Hiệu & Băng Giữ Chuỗi
 */
export const SHOP_CATALOG = [
  {
    id: 'frame-minimal',
    category: 'frame',
    name: 'Tối giản Tuyết trắng',
    desc: 'Viền mảnh thanh lịch mặc định.',
    cost: 0,
    previewClass: 's9-frame-minimal',
    accent: '#94a3b8',
  },
  {
    id: 'frame-aurora',
    category: 'frame',
    name: 'Khung Cực Quang Xanh',
    desc: 'Hiệu ứng ánh sáng xanh lam – ngọc bích mượt mà.',
    cost: 60,
    previewClass: 's9-frame-aurora',
    accent: '#0ea5e9',
  },
  {
    id: 'frame-emerald',
    category: 'frame',
    name: 'Khung Lục Bảo Học Đường',
    desc: 'Viền xanh ngọc bích tươi mát, bền bỉ giữ chuỗi.',
    cost: 90,
    previewClass: 's9-frame-emerald',
    accent: '#10b981',
  },
  {
    id: 'frame-gold',
    category: 'frame',
    name: 'Khung Hoàng Kim Học Bá',
    desc: 'Viền vàng kim loại sang trọng dành cho nhóm dẫn đầu.',
    cost: 120,
    previewClass: 's9-frame-gold',
    accent: '#f59e0b',
  },
  {
    id: 'frame-ruby',
    category: 'frame',
    name: 'Khung Hồng Ngọc Thủ Khoa',
    desc: 'Ánh đỏ hổ phách nổi bật trên Bảng xếp hạng.',
    cost: 180,
    previewClass: 's9-frame-ruby',
    accent: '#e11d48',
  },
  {
    id: 'frame-nebula',
    category: 'frame',
    name: 'Khung Tinh Vân Tím',
    desc: 'Dải màu vũ trụ sâu lắng dành riêng cho Tinh Anh.',
    cost: 240,
    previewClass: 's9-frame-nebula',
    accent: '#7c3aed',
  },
  {
    id: 'title-sniper',
    category: 'title',
    name: 'Bậc Thầy Đúng/Sai',
    desc: 'Hiển thị danh hiệu bên cạnh tên trên Hồ sơ.',
    cost: 50,
    accent: '#2563eb',
  },
  {
    id: 'title-speed',
    category: 'title',
    name: 'Tia Chớp Phòng Thi',
    desc: 'Biểu tượng tốc độ xử lý đề chuẩn nhịp.',
    cost: 80,
    accent: '#0d9488',
  },
  {
    id: 'title-valedictorian',
    category: 'title',
    name: 'Ứng Viên Thủ Khoa 2026',
    desc: 'Danh hiệu danh giá cho chiến dịch về đích.',
    cost: 150,
    accent: '#d97706',
  },
  {
    id: 'item-streak-freeze',
    category: 'item',
    name: '+1 Băng Giữ Chuỗi',
    desc: 'Tự động bảo vệ ngọn lửa chuỗi học nếu bạn bận 1 ngày.',
    cost: 70,
    consumable: true,
    accent: '#0284c7',
  },
];

export function getRewardShopState(uid = 'guest') {
  const power = getStudentCombatPower(uid)?.power || BASE_POWER;
  const baseCoins = Math.max(100, Math.floor(power / 8));
  const fallback = {
    spent: 0,
    owned: ['frame-minimal'],
    equippedFrame: 'frame-minimal',
    equippedTitle: '',
    coins: baseCoins,
  };
  if (typeof window === 'undefined' || !window.localStorage) return fallback;
  try {
    const raw = window.localStorage.getItem(`${REWARD_SHOP_PREFIX}${uid || 'guest'}`);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    const spent = Math.max(0, Number(parsed?.spent) || 0);
    const owned = Array.isArray(parsed?.owned) ? Array.from(new Set(['frame-minimal', ...parsed.owned])) : ['frame-minimal'];
    return {
      spent,
      owned,
      equippedFrame: parsed?.equippedFrame || 'frame-minimal',
      equippedTitle: parsed?.equippedTitle || '',
      coins: Math.max(0, baseCoins - spent),
    };
  } catch {
    return fallback;
  }
}

export function buyOrEquipShopItem(uid = 'guest', itemId) {
  const item = SHOP_CATALOG.find((x) => x.id === itemId);
  if (!item) return { ok: false, message: 'Vật phẩm không tồn tại.' };

  const cur = getRewardShopState(uid);
  const alreadyOwned = !item.consumable && cur.owned.includes(item.id);
  let nextSpent = cur.spent;
  let nextOwned = [...cur.owned];
  let nextFrame = cur.equippedFrame;
  let nextTitle = cur.equippedTitle;

  if (!alreadyOwned) {
    if (cur.coins < item.cost) {
      return { ok: false, message: `Bạn cần thêm ${item.cost - cur.coins} Xu Học Bá để đổi vật phẩm này.` };
    }
    nextSpent += item.cost;
    if (!item.consumable) nextOwned.push(item.id);
  }

  if (item.category === 'frame') nextFrame = item.id;
  if (item.category === 'title') nextTitle = item.name;
  if (item.id === 'item-streak-freeze' && typeof window !== 'undefined' && window.localStorage) {
    try {
      const curFreeze = Number(window.localStorage.getItem('cs-streak-freeze-count') ?? 1);
      window.localStorage.setItem('cs-streak-freeze-count', String(Math.max(0, curFreeze) + 1));
      window.dispatchEvent(new CustomEvent('cs-ls', { detail: 'cs-streak-freeze-count' }));
      window.dispatchEvent(new CustomEvent('cs-streak-ui-sync'));
    } catch { /* ignore */ }
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const lsKey = `${REWARD_SHOP_PREFIX}${uid || 'guest'}`;
      window.localStorage.setItem(
        lsKey,
        JSON.stringify({
          spent: nextSpent,
          owned: nextOwned,
          equippedFrame: nextFrame,
          equippedTitle: nextTitle,
        })
      );
      window.dispatchEvent(new CustomEvent('elec-shop-updated'));
      emitAnalyticsKeyChanged(lsKey);
    } catch { /* ignore */ }
  }

  return {
    ok: true,
    state: getRewardShopState(uid),
    message: alreadyOwned
      ? `Đã trang bị "${item.name}".`
      : item.consumable
        ? `Đã cộng ${item.name} vào kho bảo vệ chuỗi!`
        : `Đã mở khóa và trang bị "${item.name}"!`,
  };
}

/**
 * Thuật toán Định hướng Ngành & Trường khoa học (Holland RIASEC + Điểm thật /30)
 */
const GROUP_RIASEC_MAP = {
  'Y - Dược': ['I', 'S', 'R'],
  'Kỹ thuật - Công nghệ': ['R', 'I', 'C'],
  'Kinh tế - Quản trị': ['E', 'C', 'S'],
  'Luật - Ngoại giao': ['E', 'S', 'A'],
  'Sư phạm - KHTN': ['S', 'I', 'A'],
};

export function computeRiasecCareerMatches({ riasecScores = {}, cutoffData = [], predictedScore30 = null } = {}) {
  const entries = ['R', 'I', 'A', 'S', 'E', 'C'].map((k) => ({
    code: k,
    val: Number(riasecScores[k]) || 0,
  }));
  entries.sort((a, b) => b.val - a.val);
  const top3Codes = entries.slice(0, 3).map((e) => e.code);
  const maxScore = Math.max(1, entries[0]?.val || 1);

  const matches = (cutoffData || []).map((row) => {
    const profile = GROUP_RIASEC_MAP[row.group] || ['I', 'R', 'C'];
    const rawFit =
      ((Number(riasecScores[profile[0]]) || 0) * 0.52 +
        (Number(riasecScores[profile[1]]) || 0) * 0.32 +
        (Number(riasecScores[profile[2]]) || 0) * 0.16) /
      maxScore;

    let scoreBonus = 0;
    const cutoff = Number(row.s2025 || row.s2024 || 0);
    if (predictedScore30 != null && cutoff > 0) {
      const diff = predictedScore30 - cutoff;
      if (diff >= 0) scoreBonus = 8;
      else if (diff >= -1.5) scoreBonus = 4;
      else scoreBonus = -4;
    }

    const fitPct = Math.min(98, Math.max(58, Math.round(62 + rawFit * 30 + scoreBonus)));
    return { ...row, fitPct, profileCodes: profile };
  });

  matches.sort((a, b) => b.fitPct - a.fitPct || (b.s2025 || 0) - (a.s2025 || 0));
  return {
    hollandCode: top3Codes.join('-'),
    topCodes: top3Codes,
    matches: matches.slice(0, 5),
  };
}
