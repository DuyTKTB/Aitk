/* ============================================================
   learningAnalytics.js — ENGINE THỐNG KÊ HỌC TẬP (thuần JS)
   ------------------------------------------------------------
   Toàn bộ CHỈ SỐ trong trung tâm phân tích được tính ở đây, bằng
   code, từ dữ liệu Firestore thật (classes / exams / submissions /
   class_teachers). AI chỉ diễn giải trên kết quả của module này —
   AI không được tự tính lại các con số quan trọng.

   Nguyên tắc dữ liệu:
   • Không có dữ liệu → trả `null`, KHÔNG trả 0 giả.
   • Tỷ lệ luôn kèm mẫu số (attempts/expected) để kiểm chứng lại.
   • Mọi cảnh báo đều có `evidence` là số liệu tính được.

   File này không import Firebase → test được bằng vitest.
   ============================================================ */

export const DAY = 86400000;

export const RANGE_OPTIONS = [
  { key: '7', label: '7 ngày' },
  { key: '30', label: '30 ngày' },
  { key: '90', label: '90 ngày' },
  { key: 'all', label: 'Toàn bộ' },
  { key: 'custom', label: 'Tuỳ chọn' },
];

/** Ngưỡng cảnh báo — tách riêng để test và để giải thích cho giáo viên. */
export const THRESHOLDS = {
  missingMin: 3,            // số đề tối thiểu bị bỏ
  missingRate: 0.5,         // hoặc bỏ ≥50% số đề
  declineDelta: -10,        // giảm ≥10 điểm % giữa nửa đầu / nửa cuối
  declineDeltaHigh: -20,
  weakTopicRate: 50,        // % trả lời đúng dưới ngưỡng → chủ đề yếu
  weakTopicRateHigh: 35,
  weakTopicAttempts: 8,     // cần tối thiểu số lượt trả lời mới kết luận
  lowParticipation: 50,     // % tham gia dưới ngưỡng
  minStudentsForRate: 5,    // cần tối thiểu học sinh mới xét tỷ lệ tham gia
  abnormalAvg: 20,          // điểm TB đề dưới ngưỡng → nghi vấn dữ liệu
  abnormalAvgHigh: 10,
  minSubsForAbnormal: 5,
  minSubsForAi: 5,          // dữ liệu tối thiểu để gọi AI
  minExamsForAi: 2,
  minStudentsForAi: 3,
};

/* ---------- tiện ích ---------- */

export const toMs = (v) => {
  if (!v) return 0;
  if (typeof v === 'number') return v;
  if (typeof v?.toMillis === 'function') return v.toMillis();
  if (typeof v?.seconds === 'number') return v.seconds * 1000;
  const t = new Date(v).getTime();
  return Number.isFinite(t) ? t : 0;
};

const round = (n) => (Number.isFinite(n) ? Math.round(n) : null);

export function mean(list = []) {
  const nums = list.filter((n) => Number.isFinite(n));
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function median(list = []) {
  const nums = list.filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  if (!nums.length) return null;
  const mid = Math.floor(nums.length / 2);
  return nums.length % 2 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
}

export function stdev(list = []) {
  const nums = list.filter((n) => Number.isFinite(n));
  if (nums.length < 2) return 0;
  const m = mean(nums);
  return Math.sqrt(nums.reduce((a, n) => a + (n - m) ** 2, 0) / (nums.length - 1));
}

/** Phần trăm điểm của 1 bài nộp; null nếu đề không có điểm. */
export function pctOf(sub) {
  const tp = Number(sub?.totalPoints);
  if (!Number.isFinite(tp) || tp <= 0) return null;
  const s = Number(sub?.score);
  if (!Number.isFinite(s)) return null;
  return (s / tp) * 100;
}

const examTime = (e) => toMs(e?.createdAt) || toMs(e?.opensAt) || 0;
const examTopicOf = (q) => String(q?.topic || '').trim();

/* ============================================================
   KHOẢNG THỜI GIAN
   ============================================================ */

/**
 * resolveRange('30' | '7' | '90' | 'all' | 'custom', { from, to, now })
 * → { key, label, from, to, days }
 * `from = 0` nghĩa là không giới hạn dưới.
 */
export function resolveRange(key = '30', { from = 0, to = 0, now = Date.now() } = {}) {
  const end = to || now;
  if (key === 'all') {
    return { key: 'all', label: 'Toàn bộ dữ liệu', from: 0, to: end, days: null };
  }
  if (key === 'custom') {
    const f = toMs(from);
    const t = toMs(to) || now;
    if (!f || f >= t) {
      return { key: 'custom', label: 'Khoảng tuỳ chọn (chưa hợp lệ)', from: 0, to: t, days: null, invalid: true };
    }
    return {
      key: 'custom',
      label: `${fmtDay(f)} – ${fmtDay(t)}`,
      from: f,
      to: t,
      days: Math.round((t - f) / DAY),
    };
  }
  const days = Math.max(1, Math.min(3650, Number(key) || 30));
  return {
    key: String(days),
    label: `${days} ngày gần nhất`,
    from: end - days * DAY,
    to: end,
    days,
  };
}

export function fmtDay(ms) {
  if (!ms) return '—';
  try {
    const d = new Date(ms);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '—';
  }
}

const fmtShort = (ms) => {
  try {
    return new Date(ms).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  } catch {
    return '—';
  }
};

/* ============================================================
   CHIA KHOẢNG THỜI GIAN CHO BIỂU ĐỒ
   ============================================================ */

function bucketStart(ms, granularity) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  if (granularity === 'month') {
    d.setDate(1);
    return d.getTime();
  }
  if (granularity === 'week') {
    const dow = (d.getDay() + 6) % 7; // thứ 2 = 0
    d.setDate(d.getDate() - dow);
    return d.getTime();
  }
  return d.getTime();
}

function nextBucket(ms, granularity) {
  const d = new Date(ms);
  if (granularity === 'month') {
    d.setMonth(d.getMonth() + 1);
    return d.getTime();
  }
  if (granularity === 'week') {
    d.setDate(d.getDate() + 7);
    return d.getTime();
  }
  d.setDate(d.getDate() + 1);
  return d.getTime();
}

function bucketLabel(ms, granularity) {
  if (granularity === 'month') {
    try {
      return `T${new Date(ms).getMonth() + 1}/${String(new Date(ms).getFullYear()).slice(2)}`;
    } catch { return '—'; }
  }
  return fmtShort(ms);
}

/**
 * Chọn độ chia phù hợp: ≤14 ngày → theo ngày, ≤90 → theo tuần, còn lại theo tháng.
 * Giới hạn ≤ 26 cột để biểu đồ còn đọc được.
 */
export function chooseGranularity(spanDays) {
  if (spanDays <= 14) return 'day';
  if (spanDays <= 90) return 'week';
  return 'month';
}

function buildBuckets({ from, to, granularity }) {
  const out = [];
  let cursor = bucketStart(from, granularity);
  const guard = 400;
  let i = 0;
  while (cursor <= to && i < guard) {
    const start = cursor;
    const end = nextBucket(start, granularity);
    out.push({ start, end, label: bucketLabel(start, granularity) });
    cursor = end;
    i += 1;
  }
  return out;
}

/* ============================================================
   PHÂN BỐ ĐIỂM
   ============================================================ */

export const SCORE_BANDS = [
  { key: '0-20', from: 0, to: 20, label: '0–20%' },
  { key: '20-40', from: 20, to: 40, label: '20–40%' },
  { key: '40-60', from: 40, to: 60, label: '40–60%' },
  { key: '60-80', from: 60, to: 80, label: '60–80%' },
  { key: '80-100', from: 80, to: 100.0001, label: '80–100%' },
];

export function buildDistribution(pcts = []) {
  const clean = pcts.filter((n) => Number.isFinite(n));
  const total = clean.length;
  return SCORE_BANDS.map((b) => {
    const count = clean.filter((n) => n >= b.from && n < b.to).length;
    return {
      key: b.key,
      label: b.label,
      count,
      share: total ? Math.round((count / total) * 100) : null,
    };
  });
}

/* ============================================================
   CHỦ ĐỀ / CÂU HỎI
   ============================================================ */

const UNTAGGED = 'Chưa gắn chủ đề';

function collectTopics(examList, submissionsByExam) {
  const map = {};
  let attemptsTotal = 0;
  let taggedQuestions = 0;
  let totalQuestions = 0;

  examList.forEach((exam) => {
    const subs = submissionsByExam[exam.id] || [];
    const questions = exam.questions || [];
    totalQuestions += questions.length;
    taggedQuestions += questions.filter((q) => examTopicOf(q)).length;
    if (!subs.length) return;

    questions.forEach((q, i) => {
      const topic = examTopicOf(q) || UNTAGGED;
      let attempts = 0;
      let correct = 0;

      subs.forEach((s) => {
        const d = s.detail?.[i];
        const picked = d?.picked ?? s.answers?.[i] ?? s.answers?.[String(i)];
        const hasDetail = d && typeof d === 'object';
        if (!hasDetail && picked === undefined) return;
        attempts += 1;
        const isCorrect = hasDetail && typeof d.isCorrect === 'boolean'
          ? d.isCorrect
          : (typeof q.correct === 'number' && picked === q.correct);
        if (isCorrect) correct += 1;
      });

      if (!attempts) return;
      if (!map[topic]) {
        map[topic] = { topic, attempts: 0, correct: 0, tagged: topic !== UNTAGGED, exams: new Set() };
      }
      map[topic].attempts += attempts;
      map[topic].correct += correct;
      map[topic].exams.add(exam.id);
      attemptsTotal += attempts;
    });
  });

  const rows = Object.values(map)
    .map((t) => ({
      topic: t.topic,
      tagged: t.tagged,
      attempts: t.attempts,
      correct: t.correct,
      rate: t.attempts ? Math.round((t.correct / t.attempts) * 100) : null,
      examCount: t.exams.size,
    }))
    .sort((a, b) => (a.rate ?? 999) - (b.rate ?? 999));

  return {
    rows,
    attemptsTotal,
    coverage: totalQuestions ? Math.round((taggedQuestions / totalQuestions) * 100) : null,
    taggedQuestions,
    totalQuestions,
  };
}

/* ============================================================
   TỪNG HỌC SINH
   ============================================================ */

function buildStudents({ members = [], examList = [], submissionsByExam = {} }) {
  const examIds = new Set(examList.map((e) => e.id));
  const expected = examIds.size;

  return members.map((m) => {
    const subs = [];
    examList.forEach((ex) => {
      (submissionsByExam[ex.id] || []).forEach((s) => {
        if (s.studentId === m.id) subs.push({ ...s, examId: ex.id, examTitle: ex.title || 'Đề' });
      });
    });
    subs.sort((a, b) => toMs(a.submittedAt) - toMs(b.submittedAt));

    const pcts = subs.map(pctOf).filter((n) => n !== null);
    const half = Math.floor(pcts.length / 2);
    const firstAvg = pcts.length >= 3 ? mean(pcts.slice(0, half)) : null;
    const lastAvg = pcts.length >= 3 ? mean(pcts.slice(half)) : null;
    const delta = firstAvg !== null && lastAvg !== null ? Math.round(lastAvg - firstAvg) : null;

    let trend = 'unknown';
    if (delta !== null) trend = delta >= 5 ? 'up' : delta <= -5 ? 'down' : 'flat';

    return {
      id: m.id,
      name: m.name || m.email || 'Học sinh',
      email: m.email || '',
      submissions: subs.length,
      expected,
      missing: Math.max(0, expected - subs.length),
      avgPct: round(mean(pcts)),
      lastSubmittedAt: subs.length ? toMs(subs[subs.length - 1].submittedAt) : 0,
      delta,
      trend,
    };
  });
}

/* ============================================================
   XẾP LOẠI HỌC SINH THEO MÔN
   ------------------------------------------------------------
   Ngưỡng quy đổi từ thang 10 của Việt Nam sang % điểm:
     Giỏi ≥ 8.0 → ≥ 80%   ·  Khá 6.5–7.9 → 65–79%
     TB   5.0–6.4 → 50–64% ·  Yếu < 5.0 → < 50%
   Xếp loại chỉ dựa trên các bài ĐÃ LÀM trong khoảng đang xem.
   Đây là mô tả kết quả kiểm tra, KHÔNG phải kết luận về năng lực
   hay phẩm chất của học sinh — vì vậy UI luôn ghi rõ số bài đã dùng
   và đánh dấu "ít dữ liệu" khi mới có 1 bài.
   ============================================================ */

export const BANDS = [
  { key: 'gioi', label: 'Giỏi', min: 80, tone: 'ex' },
  { key: 'kha', label: 'Khá', min: 65, tone: 'good' },
  { key: 'tb', label: 'Trung bình', min: 50, tone: 'mid' },
  { key: 'yeu', label: 'Yếu', min: 0, tone: 'bad' },
];

/** Ngưỡng mặc định (quy đổi thang 10 của VN sang %). */
export const DEFAULT_BANDS = { gioi: 80, kha: 65, tb: 50 };

/**
 * Chuẩn hoá ngưỡng tuỳ chỉnh của từng lớp: bắt buộc giảm dần và nằm trong 1..100.
 * Dữ liệu hỏng (chữ, âm, đảo thứ tự) luôn rơi về ngưỡng mặc định tương ứng.
 */
export function resolveBands(custom) {
  if (!custom || typeof custom !== 'object') return { ...DEFAULT_BANDS };
  /* null / '' / undefined phải rơi về mặc định, không được coi là 0 */
  const num = (v, d) => {
    if (v === null || v === undefined || v === '') return d;
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
  };
  const gioi = Math.min(100, Math.max(2, num(custom.gioi, DEFAULT_BANDS.gioi)));
  const kha = Math.min(gioi - 1, Math.max(1, num(custom.kha, DEFAULT_BANDS.kha)));
  const tb = Math.min(kha - 1, Math.max(0, num(custom.tb, DEFAULT_BANDS.tb)));
  return { gioi, kha, tb };
}

export function classifyPct(pct, bands) {
  if (pct === null || pct === undefined || pct === '') return null;
  const v = Number(pct);
  if (!Number.isFinite(v)) return null;
  const t = resolveBands(bands);
  if (v >= t.gioi) return 'gioi';
  if (v >= t.kha) return 'kha';
  if (v >= t.tb) return 'tb';
  return 'yeu';
}

export function bandLabel(key) {
  const b = BANDS.find((x) => x.key === key);
  return b ? b.label : 'Chưa đủ dữ liệu';
}

/** Đếm số học sinh theo từng mức — null (chưa có bài) đếm riêng. */
export function bandCounts(rows = []) {
  const out = { gioi: 0, kha: 0, tb: 0, yeu: 0, nodata: 0, total: rows.length };
  rows.forEach((r) => {
    if (!r || !r.band) out.nodata += 1;
    else out[r.band] += 1;
  });
  return out;
}

/** Bảng điểm của từng học sinh trong MỘT môn. */
export function buildSubjectStudents({ members = [], examList = [], submissionsByExam = {}, bands }) {
  return members.map((m) => {
    const rows = [];
    examList.forEach((ex) => {
      (submissionsByExam[ex.id] || []).forEach((s) => {
        if (s.studentId !== m.id) return;
        const p = pctOf(s);
        if (p === null) return;
        rows.push({ pct: p, at: toMs(s.submittedAt), examId: ex.id, examTitle: ex.title || 'Đề' });
      });
    });
    rows.sort((a, b) => a.at - b.at);

    const pcts = rows.map((r) => r.pct);
    const avg = pcts.length ? round(mean(pcts)) : null;

    return {
      id: m.id,
      name: m.name || m.email || 'Học sinh',
      email: m.email || '',
      attempts: rows.length,
      expected: examList.length,
      avgPct: avg,
      bestPct: pcts.length ? round(Math.max(...pcts)) : null,
      worstPct: pcts.length ? round(Math.min(...pcts)) : null,
      lastAt: rows.length ? rows[rows.length - 1].at : 0,
      lastPct: rows.length ? round(rows[rows.length - 1].pct) : null,
      band: pcts.length ? classifyPct(avg, bands) : null,
      /* 1 bài là quá ít để xếp loại — vẫn hiện nhưng gắn cờ để UI nói rõ. */
      lowConfidence: rows.length > 0 && rows.length < 2,
    };
  });
}

/* ============================================================
   CẢNH BÁO SỚM (tính bằng luật, minh bạch)
   ============================================================ */

function buildWarnings({ overview, subjects, students, topics, exams, now, linkedTeachers = [], from = 0 }) {
  const out = [];
  const push = (w) => out.push({ detectedAt: now, ...w });

  /* 1. Học sinh bỏ nhiều bài */
  students.forEach((s) => {
    if (!s.expected) return;
    const rate = s.missing / s.expected;
    if (s.missing >= THRESHOLDS.missingMin || (s.expected >= 2 && rate >= THRESHOLDS.missingRate)) {
      push({
        id: `missing:${s.id}`,
        kind: 'student_missing',
        priority: s.missing >= THRESHOLDS.missingMin ? 'high' : 'medium',
        title: `${s.name} chưa làm ${s.missing}/${s.expected} bài được giao`,
        evidence: `${s.missing}/${s.expected} đề chưa có bài nộp (đã nộp ${s.submissions}).`,
        why: 'Bỏ nhiều bài làm giảm độ phủ dữ liệu đánh giá và dễ tạo lỗ hổng kiến thức kéo dài.',
        action: 'Nhắc riêng học sinh, kiểm tra lý do (thiết bị, lịch) và mở lại đề nếu cần.',
        refs: { studentId: s.id, missing: s.missing, expected: s.expected },
      });
    }
  });

  /* 2. Kết quả giảm qua nhiều lần kiểm tra */
  students.forEach((s) => {
    if (s.delta === null) return;
    if (s.delta <= THRESHOLDS.declineDelta) {
      push({
        id: `decline:${s.id}`,
        kind: 'student_decline',
        priority: s.delta <= THRESHOLDS.declineDeltaHigh ? 'high' : 'medium',
        title: `${s.name} có dấu hiệu giảm điểm (${s.delta} điểm %)`,
        evidence: `So sánh nửa đầu và nửa cuối chuỗi bài đã nộp: chênh ${s.delta} điểm %.`,
        why: 'Xu hướng giảm lặp lại thường xuất hiện trước khi kết quả học kỳ đi xuống.',
        action: 'Trao đổi ngắn với học sinh, xem lại các câu sai gần nhất và giao bài củng cố ngắn.',
        refs: { studentId: s.id, delta: s.delta },
      });
    }
  });

  /* 3. Chủ đề có tỷ lệ trả lời sai cao */
  topics.rows.forEach((t) => {
    if (t.attempts < THRESHOLDS.weakTopicAttempts) return;
    if (t.rate === null || t.rate >= THRESHOLDS.weakTopicRate) return;
    push({
      id: `topic:${t.topic}`,
      kind: 'topic_weak',
      priority: t.rate < THRESHOLDS.weakTopicRateHigh ? 'high' : 'medium',
      title: `Chủ đề “${t.topic}” chỉ đạt ${t.rate}% trả lời đúng`,
      evidence: `${t.correct}/${t.attempts} lượt trả lời đúng, trải trên ${t.examCount} đề.`,
      why: 'Tỷ lệ sai cao lặp lại trên nhiều lượt cho thấy lỗ hổng kiến thức, không phải lỗi ngẫu nhiên.',
      action: 'Chữa kỹ 2–3 câu sai nhiều nhất, dạy lại phần lý thuyết gốc rồi giao đề luyện tập cùng chủ đề.',
      refs: { topic: t.topic, rate: t.rate, attempts: t.attempts },
    });
  });

  /* 4. Môn có tỷ lệ tham gia thấp */
  subjects.forEach((s) => {
    if (s.exams === 0) return;
    if (overview.students < THRESHOLDS.minStudentsForRate) return;
    if (s.participation === null || s.participation >= THRESHOLDS.lowParticipation) return;
    push({
      id: `lowpart:${s.subject}`,
      kind: 'subject_low_participation',
      priority: 'medium',
      title: `Môn ${s.subject} chỉ có ${s.participation}% lượt làm bài`,
      evidence: `${s.submissions}/${s.expected} lượt mong đợi · ${s.exams} đề · ${overview.students} học sinh.`,
      why: 'Dữ liệu quá mỏng khiến kết quả môn này chưa đại diện cho cả lớp.',
      action: 'Kiểm tra thời gian mở đề, nhắc học sinh hoàn thành và gia hạn nếu cần.',
      refs: { subject: s.subject, participation: s.participation },
    });
  });

  /* 5. Môn thiếu dữ liệu đánh giá */
  subjects.forEach((s) => {
    if (s.exams === 0 && s.teachers > 0) {
      push({
        id: `nodata:${s.subject}`,
        kind: 'subject_no_data',
        priority: 'medium',
        title: `Môn ${s.subject} chưa có đề nào được giao`,
        evidence: `${s.teachers} giáo viên bộ môn đã liên kết nhưng 0 đề trong khoảng đang xem.`,
        why: 'Lớp thiếu dữ liệu kiểm tra ở môn này nên không thể đánh giá tình hình học tập.',
        action: 'Trao đổi với giáo viên bộ môn để giao ít nhất một đề ngắn có gắn chủ đề.',
        refs: { subject: s.subject },
      });
    } else if (s.exams > 0 && s.submissions === 0) {
      push({
        id: `nosub:${s.subject}`,
        kind: 'subject_no_data',
        priority: 'medium',
        title: `Môn ${s.subject} có ${s.exams} đề nhưng chưa có bài nộp`,
        evidence: `0/${s.expected} lượt làm bài trên ${s.exams} đề.`,
        why: 'Đề đã giao nhưng không có dữ liệu kết quả — chưa thể đánh giá môn này.',
        action: 'Kiểm tra link/key đề, thời gian mở và thông báo lại cho học sinh.',
        refs: { subject: s.subject, exams: s.exams },
      });
    }
  });

  /* 6. Bài kiểm tra có dấu hiệu bất thường về dữ liệu */
  exams.forEach((ex) => {
    const subs = ex._subs || [];
    if (subs.length < THRESHOLDS.minSubsForAbnormal) return;
    const pcts = subs.map(pctOf).filter((n) => n !== null);
    if (!pcts.length) return;
    const avg = mean(pcts);
    const sd = stdev(pcts);
    const allSame = sd < 0.5;

    if (avg < THRESHOLDS.abnormalAvg || allSame) {
      push({
        id: `abnormal:${ex.id}`,
        kind: 'abnormal_exam',
        priority: avg < THRESHOLDS.abnormalAvgHigh ? 'high' : 'low',
        title: allSame
          ? `Đề “${ex.title}”: mọi bài nộp cùng một mức điểm`
          : `Đề “${ex.title}”: điểm trung bình chỉ ${round(avg)}%`,
        evidence: `${subs.length} bài nộp · TB ${round(avg)}% · độ lệch chuẩn ${round(sd)} · ${(ex.questions || []).length} câu.`,
        why: 'Điểm quá thấp hoặc trùng nhau hoàn toàn có thể do lỗi đáp án, lỗi chấm hoặc học sinh chưa được ôn.',
        action: 'Rà lại đáp án đúng và tổng điểm của đề trước khi kết luận về năng lực học sinh.',
        refs: { examId: ex.id, avg: round(avg) },
      });
    }
  });

  /* 7. GVBM đã liên kết nhưng chưa giao đề nào trong khoảng đang xem.
     Chỉ nhắc khi đã liên kết ≥7 ngày để không làm phiền ngay sau khi liên kết.
     Tuyệt đối không dùng số đề để suy ra chất lượng giảng dạy. */
  const examAuthors = new Set(exams.map((e) => e.teacherId).filter(Boolean));
  linkedTeachers.forEach((t) => {
    if (!t?.teacherId || t.isOwner) return;
    if (examAuthors.has(t.teacherId)) return;
    const linkedAt = toMs(t.linkedAt) || toMs(t.linkedAtMs) || 0;
    if (linkedAt && now - linkedAt < 7 * DAY) return;
    if (!linkedAt && !from) return;

    const who = `GV ${t.teacherName || 'bộ môn'}${t.subject ? ` (${t.subject})` : ''}`;
    push({
      id: `idle:${t.teacherId}`,
      kind: 'teacher_idle',
      priority: 'low',
      title: `${who} chưa giao đề nào trong khoảng đang xem`,
      evidence: `${linkedAt ? `Đã liên kết từ ${fmtDay(linkedAt)}` : 'Đã liên kết'} · 0 đề được giao.`,
      why: 'Môn này chưa có dữ liệu kiểm tra nên chưa theo dõi được tiến bộ của lớp.',
      action: 'Trao đổi kế hoạch kiểm tra với giáo viên bộ môn. Số đề không phản ánh năng lực giảng dạy.',
      refs: { teacherId: t.teacherId, subject: t.subject || '' },
    });
  });

  const rank = { high: 0, medium: 1, low: 2 };
  return out.sort((a, b) => (rank[a.priority] - rank[b.priority]) || a.title.localeCompare(b.title, 'vi'));
}

/* ============================================================
   CHẤT LƯỢNG / ĐỘ ĐẦY ĐỦ CỦA DỮ LIỆU
   ============================================================ */

function buildDataQuality({ exams, rawExams = [], subjects, overview, topics }) {
  const notes = [];
  /* Đếm trên đề GỐC: đề không khai môn nhưng được suy ra từ môn của GV
     vẫn phải bị ghi nhận là thiếu metadata. */
  const examNoSubject = rawExams.filter((e) => !String(e.subject || '').trim()).length;
  const examNoSubs = exams.filter((e) => !(e._subs || []).length).length;

  if (examNoSubject > 0) {
    notes.push(`${examNoSubject}/${exams.length} đề chưa gắn môn — đang tạm suy ra từ môn của giáo viên giao đề.`);
  }
  if (topics.coverage !== null && topics.coverage < 80) {
    notes.push(`Chỉ ${topics.coverage}% câu hỏi có metadata chủ đề; phân tích theo chủ đề sẽ kém chính xác.`);
  }
  if (examNoSubs > 0) {
    notes.push(`${examNoSubs} đề chưa có bài nộp nào.`);
  }
  const noDataSubjects = subjects.filter((s) => s.exams === 0 || s.submissions === 0).map((s) => s.subject);
  if (noDataSubjects.length) {
    notes.push(`Môn thiếu dữ liệu: ${noDataSubjects.join(', ')}.`);
  }

  const missing = [];
  if (overview.submissions < THRESHOLDS.minSubsForAi) missing.push(`cần thêm ${THRESHOLDS.minSubsForAi - overview.submissions} bài nộp`);
  if (overview.scoredExams < THRESHOLDS.minExamsForAi) missing.push(`cần thêm ${THRESHOLDS.minExamsForAi - overview.scoredExams} đề có kết quả`);
  if (overview.students < THRESHOLDS.minStudentsForAi) missing.push(`cần thêm ${THRESHOLDS.minStudentsForAi - overview.students} học sinh trong lớp`);

  const ok = missing.length === 0;
  return {
    notes,
    examNoSubject,
    examNoSubs,
    topicCoverage: topics.coverage,
    sufficient: {
      ok,
      label: ok ? 'Đủ dữ liệu để phân tích' : 'Chưa đủ dữ liệu để kết luận',
      missing,
    },
  };
}

/* ============================================================
   FINGERPRINT — nhận diện "phiên bản dữ liệu" của báo cáo
   ============================================================ */

export function fingerprintOf(parts) {
  const s = JSON.stringify(parts);
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

/* ============================================================
   HÀM CHÍNH
   ============================================================ */

/**
 * buildLearningAnalytics({ classInfo, exams, submissionsMap, teachers, range, now })
 *
 * exams           — đề của lớp (đã lọc classId ở nơi gọi)
 * submissionsMap  — { [examId]: submission[] }
 * teachers        — class_teachers docs (đã liên kết)
 */
export function buildLearningAnalytics({
  classInfo = {},
  exams = [],
  submissionsMap = {},
  teachers = [],
  teacherRows = null,
  range = RANGE_OPTIONS[1],
  now = Date.now(),
  bandThresholds = null,
} = {}) {
  /* Ngưỡng xếp loại của lớp (classInfo.bandThresholds) hoặc mặc định VN */
  const bands = resolveBands(bandThresholds);
  const members = classInfo.members || [];
  const students = members.length;
  const from = toMs(range.from);
  const to = toMs(range.to) || now;

  const teacherSubject = {};
  (teachers || []).forEach((t) => {
    if (t?.teacherId && t?.subject) teacherSubject[t.teacherId] = String(t.subject).trim();
  });

  const inRangeTime = (ms) => (!from || !ms || ms >= from) && (!to || !ms || ms <= to);

  /* Đề trong khoảng (theo thời điểm giao) */
  const rangeExams = (exams || []).filter((e) => e && e.classId === classInfo.id && inRangeTime(examTime(e)));

  /* Gắn bài nộp (chỉ bài nằm trong khoảng thời gian) */
  const withSubs = rangeExams.map((e) => {
    const all = submissionsMap[e.id] || [];
    const subs = all.filter((s) => inRangeTime(toMs(s.submittedAt)));
    const subject = String(e.subject || '').trim() || teacherSubject[e.teacherId] || 'Chưa xác định';
    return { ...e, subject, _subs: subs };
  });

  const allSubs = withSubs.flatMap((e) => e._subs);
  const pcts = allSubs.map(pctOf).filter((n) => n !== null);
  const scoredExams = withSubs.filter((e) => e._subs.some((s) => pctOf(s) !== null)).length;
  const expectedAttempts = students * withSubs.length;
  const activeStudentIds = new Set(allSubs.map((s) => s.studentId).filter(Boolean));

  const overview = {
    students,
    teachers: (teachers || []).length,
    teachersActive: (teacherRows || []).filter((r) => !r.isOwner && r.examCount > 0).length,
    exams: withSubs.length,
    scoredExams,
    submissions: allSubs.length,
    attempts: allSubs.length,
    expectedAttempts,
    completionRate: expectedAttempts > 0 ? Math.min(100, Math.round((allSubs.length / expectedAttempts) * 100)) : null,
    participationRate: students > 0 ? Math.round((activeStudentIds.size / students) * 100) : null,
    activeStudents: activeStudentIds.size,
    avgPct: round(mean(pcts)),
    medianPct: round(median(pcts)),
    passRate: pcts.length ? Math.round((pcts.filter((n) => n >= 50).length / pcts.length) * 100) : null,
    spreadPct: pcts.length >= 2 ? round(stdev(pcts)) : null,
  };

  /* ---------- Theo môn ---------- */
  const subjectMap = {};
  withSubs.forEach((e) => {
    if (!subjectMap[e.subject]) {
      subjectMap[e.subject] = { subject: e.subject, exams: 0, submissions: 0, expected: 0, pcts: [], teacherIds: new Set() };
    }
    const row = subjectMap[e.subject];
    row.exams += 1;
    row.submissions += e._subs.length;
    row.expected += students;
    row.pcts.push(...e._subs.map(pctOf).filter((n) => n !== null));
    if (e.teacherId) row.teacherIds.add(e.teacherId);
  });
  /* Môn đã phân công nhưng chưa có đề → vẫn hiển thị để thấy lỗ hổng dữ liệu */
  (teachers || []).forEach((t) => {
    const s = String(t.subject || '').trim();
    if (!s) return;
    if (!subjectMap[s]) {
      subjectMap[s] = { subject: s, exams: 0, submissions: 0, expected: 0, pcts: [], teacherIds: new Set() };
    }
    if (t.teacherId) subjectMap[s].teacherIds.add(t.teacherId);
  });

  const subjects = Object.values(subjectMap)
    .map((s) => {
      const participation = s.expected > 0 ? Math.min(100, Math.round((s.submissions / s.expected) * 100)) : null;
      const p = s.pcts;
      const dataLevel = s.submissions === 0 ? 'none' : (s.submissions < 5 || s.exams < 2 ? 'low' : 'ok');
      return {
        subject: s.subject,
        teachers: s.teacherIds.size,
        teacherIds: [...s.teacherIds],
        exams: s.exams,
        submissions: s.submissions,
        expected: s.expected,
        participation,
        avgPct: round(mean(p)),
        passRate: p.length ? Math.round((p.filter((n) => n >= 50).length / p.length) * 100) : null,
        dataLevel,
        hasData: s.submissions > 0,
      };
    })
    .sort((a, b) => (b.exams - a.exams) || (b.submissions - a.submissions));

  /* ---------- Timeline ---------- */
  const times = withSubs.map(examTime).filter(Boolean);
  const windowFrom = from || (times.length ? Math.min(...times) : now - 30 * DAY);
  const windowTo = Math.max(to, times.length ? Math.max(...times) : to);
  const spanDays = Math.max(1, Math.round((windowTo - windowFrom) / DAY));
  const granularity = chooseGranularity(spanDays);
  const buckets = buildBuckets({ from: windowFrom, to: windowTo, granularity });

  const timeline = buckets.map((b) => {
    const examCount = withSubs.filter((e) => {
      const t = examTime(e);
      return t >= b.start && t < b.end;
    }).length;
    const subs = withSubs.flatMap((e) => e._subs.filter((s) => {
      const t = toMs(s.submittedAt);
      return t >= b.start && t < b.end;
    }));
    return {
      label: b.label,
      from: b.start,
      to: b.end,
      exams: examCount,
      submissions: subs.length,
      avgPct: round(mean(subs.map(pctOf).filter((n) => n !== null))),
    };
  });

  /* ---------- Chủ đề ---------- */
  const topics = collectTopics(withSubs, Object.fromEntries(withSubs.map((e) => [e.id, e._subs])));

  /* ---------- Học sinh ---------- */
  const studentRows = buildStudents({ members, examList: withSubs, submissionsByExam: Object.fromEntries(withSubs.map((e) => [e.id, e._subs])) });

  /* ---------- Cảnh báo ---------- */
  const warnings = buildWarnings({
    overview, subjects, students: studentRows, topics, exams: withSubs, now,
    linkedTeachers: teachers || [], from,
  });

  /* ---------- Chất lượng dữ liệu ---------- */
  const dataQuality = buildDataQuality({ exams: withSubs, rawExams: rangeExams, subjects, overview, topics });

  /* ---------- Báo cáo riêng từng môn ---------- */
  const subjectDetails = {};
  subjects.forEach((s) => {
    const list = withSubs.filter((e) => e.subject === s.subject);
    const topicRows = collectTopics(list, Object.fromEntries(list.map((e) => [e.id, e._subs])));
    /* Điểm từng học sinh của riêng môn này → xếp loại Giỏi/Khá/TB/Yếu */
    const subjectStudents = buildSubjectStudents({
      members,
      examList: list,
      submissionsByExam: Object.fromEntries(list.map((e) => [e.id, e._subs])),
      bands,
    });
    subjectDetails[s.subject] = {
      subject: s.subject,
      students: subjectStudents,
      bands: bandCounts(subjectStudents),
      exams: list
        .map((e) => ({
          id: e.id,
          title: e.title || 'Đề',
          teacherName: e.teacherName || '',
          opensAt: toMs(e.opensAt) || examTime(e),
          submissions: e._subs.length,
          expected: students,
          /* Có thể >100% nếu học sinh thi lại → chặn trần 100 cho dễ đọc,
             số lượt thật vẫn nằm ở `submissions`. */
          participation: students ? Math.min(100, Math.round((e._subs.length / students) * 100)) : null,
          avgPct: round(mean(e._subs.map(pctOf).filter((n) => n !== null))),
          status: e.active === false ? 'off' : 'on',
        }))
        .sort((a, b) => b.opensAt - a.opensAt),
      topics: topicRows.rows,
      topicCoverage: topicRows.coverage,
      trend: list
        .filter((e) => e._subs.length)
        .sort((a, b) => (toMs(a.opensAt) || examTime(a)) - (toMs(b.opensAt) || examTime(b)))
        .map((e) => ({
          label: String(e.title || 'Đề').slice(0, 18),
          value: round(mean(e._subs.map(pctOf).filter((n) => n !== null))),
        })),
    };
  });

  /* Dấu vân tay = "phiên bản dữ liệu", KHÔNG chứa mốc thời gian hiện tại
     (nếu chứa, báo cáo vừa lưu sẽ bị coi là cũ ngay lần mở sau). */
  const fingerprint = fingerprintOf({
    c: classInfo.id || '',
    r: range.key,
    f: range.key === 'custom' ? from : 0,
    e: withSubs.length,
    s: allSubs.length,
    sc: scoredExams,
    st: students,
    l: allSubs.reduce((m, s) => Math.max(m, toMs(s.submittedAt)), 0),
  });

  return {
    meta: {
      classId: classInfo.id || '',
      className: classInfo.name || 'Lớp học',
      classSubject: classInfo.subject || '',
      teacherName: classInfo.teacherName || '',
      rangeKey: range.key,
      rangeLabel: range.label,
      from: from || null,
      to,
      generatedAt: now,
      granularity,
      fingerprint,
      bands,
    },
    overview,
    subjects,
    subjectOptions: subjects.map((s) => s.subject),
    subjectDetails,
    timeline,
    distribution: buildDistribution(pcts),
    topics,
    students: studentRows,
    warnings,
    dataQuality,
    teachers: teacherRows || [],
  };
}

/**
 * Chỉ số phục vụ AI: bỏ email, bỏ tên học sinh (thay bằng mã), giữ số liệu.
 * Dùng cho bước "gửi dữ liệu phù hợp cho AI".
 */
export function anonymizeForAi(analytics) {
  const list = analytics.students || [];
  const codeById = new Map();
  const codeByName = new Map();

  list.forEach((s, i) => {
    const c = `HS${String(i + 1).padStart(2, '0')}`;
    if (s.id) codeById.set(s.id, c);
    if (s.name) codeByName.set(String(s.name), c);
    if (s.email) codeByName.set(String(s.email), c);
  });

  /* Cảnh báo do máy tính thường chứa tên học sinh ("Bình chưa làm 2/3 bài")
     → thay bằng mã trước khi gửi AI. */
  const scrub = (text) => {
    let out = String(text ?? '');
    codeByName.forEach((c, name) => {
      if (name && out.includes(name)) out = out.split(name).join(c);
    });
    return out;
  };

  /* subjectDetails chứa bảng điểm từng học sinh của từng môn → cũng phải
     bỏ tên/email, chỉ giữ mã + số liệu trước khi gửi AI. */
  const subjectDetails = {};
  Object.entries(analytics.subjectDetails || {}).forEach(([subject, d]) => {
    subjectDetails[subject] = {
      ...d,
      students: (d.students || []).map((s) => ({
        code: codeById.get(s.id) || 'HS',
        attempts: s.attempts,
        expected: s.expected,
        avgPct: s.avgPct,
        bestPct: s.bestPct,
        worstPct: s.worstPct,
        band: s.band,
        lowConfidence: s.lowConfidence,
      })),
    };
  });

  return {
    ...analytics,
    subjectDetails,
    students: list.map((s) => ({
      code: codeById.get(s.id) || 'HS',
      submissions: s.submissions,
      expected: s.expected,
      missing: s.missing,
      avgPct: s.avgPct,
      trend: s.trend,
      delta: s.delta,
    })),
    warnings: (analytics.warnings || []).map((w) => ({
      ...w,
      title: scrub(w.title),
      evidence: scrub(w.evidence),
      why: scrub(w.why),
      action: scrub(w.action),
      refs: w.refs?.studentId
        ? { ...w.refs, studentId: codeById.get(w.refs.studentId) || 'HS' }
        : w.refs,
    })),
  };
}
