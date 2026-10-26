/* ============================================================
   teacherAnalytics.js — SỐ LIỆU LỚP CHO GIÁO VIÊN (v2)
   ------------------------------------------------------------
   v2 thêm phạm vi GIÁO VIÊN CHỦ NHIỆM:
     • Gom mọi đề của lớp, không chỉ đề của mình → thấy cả đề của
       giáo viên bộ môn khác (exams.teacherId/teacherName/subject).
     • Mỗi giáo viên: số đề, số bài, TB, Mastery TB, độ phủ lớp.
     • Ma trận học sinh × giáo viên: em nào làm bài của ai, kết quả bao nhiêu.
     • Hồ sơ học sinh: tách điểm theo từng giáo viên.

   Nguyên tắc giữ nguyên: thiếu dữ liệu → null, không bịa 0.
   ============================================================ */

const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
const toMs = (v) => {
  if (!v) return 0;
  if (typeof v?.toMillis === 'function') return v.toMillis();
  if (typeof v?.seconds === 'number') return v.seconds * 1000;
  const t = new Date(v).getTime();
  return Number.isFinite(t) ? t : 0;
};
const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
const stdev = (arr) => {
  if (arr.length < 2) return 0;
  const m = avg(arr);
  return Math.sqrt(avg(arr.map((x) => (x - m) ** 2)));
};

/* Bài nộp cũ có thể thiếu totalPoints/score → quy về % theo số câu đúng */
const PCT = (s) => {
  const tp = Number(s?.totalPoints);
  if (tp > 0) return (Number(s.score) / tp) * 100;
  const detail = s?.detail || [];
  const tq = Number(s?.totalQuestions) || detail.length;
  const cc = Number.isFinite(Number(s?.correctCount))
    ? Number(s.correctCount)
    : detail.filter((d) => d?.isCorrect).length;
  return tq > 0 ? (cc / tq) * 100 : 0;
};

export const MASTERY_PARTS = [
  { key: 'accuracy', label: 'Độ chính xác', weight: 0.45, hint: 'Ưu tiên bài gần, bài cách đây k bài có trọng số 0.9^k' },
  { key: 'coverage', label: 'Độ phủ chương', weight: 0.2, hint: 'Số chương đã làm / số chương lớp đã được giao' },
  { key: 'consistency', label: 'Độ đều', weight: 0.15, hint: '100 trừ 2 lần độ lệch chuẩn giữa các bài' },
  { key: 'punctuality', label: 'Đúng hạn', weight: 0.1, hint: 'Tỷ lệ nộp trước giờ đóng' },
  { key: 'trend', label: 'Tiến bộ', weight: 0.1, hint: 'So 3 bài gần nhất với 3 bài trước đó' },
];

export function masteryLabel(score) {
  if (score === null || score === undefined) return { label: 'Chưa đủ dữ liệu', tone: 'na' };
  if (score >= 85) return { label: 'Nắm chắc', tone: 'ex' };
  if (score >= 70) return { label: 'Khá', tone: 'good' };
  if (score >= 55) return { label: 'Trung bình', tone: 'mid' };
  if (score >= 40) return { label: 'Cần củng cố', tone: 'low' };
  return { label: 'Báo động', tone: 'bad' };
}

export function rateTone(rate) {
  if (rate === null || rate === undefined) return 'na';
  if (rate >= 80) return 'ex';
  if (rate >= 60) return 'good';
  if (rate >= 40) return 'mid';
  return 'bad';
}

/* ---------- Chỉ số cho 1 tập bài nộp ---------- */
function computeMetrics(sorted, topicsOfClass, closesOfExam) {
  /* Accuracy: trọng số giảm dần về quá khứ, đề ngắn bị chiết khấu */
  let wSum = 0;
  let wAcc = 0;
  sorted.forEach((s, i) => {
    const k = sorted.length - 1 - i;
    const longEnough = Number(s.totalQuestions) >= 10 || (s.detail || []).length >= 10;
    const w = Math.pow(0.9, k) * (longEnough ? 1 : 0.6);
    wAcc += PCT(s) * w;
    wSum += w;
  });
  const accuracy = wSum ? wAcc / wSum : 0;

  /* Theo chương */
  const topicMap = {};
  let ratedTotal = 0;
  sorted.forEach((s) => {
    (s.detail || []).forEach((d, i) => {
      const tp = s.__topics?.[i];
      if (!tp) return;
      if (!topicMap[tp]) topicMap[tp] = { topic: tp, ok: 0, rated: 0 };
      topicMap[tp].rated += 1;
      ratedTotal += 1;
      if (d?.isCorrect) topicMap[tp].ok += 1;
    });
  });
  const topics = Object.values(topicMap)
    .map((t) => ({ ...t, rate: Math.round((t.ok / t.rated) * 100) }))
    .sort((a, b) => a.rate - b.rate);

  /* Coverage */
  const coverage = topicsOfClass.length
    ? clamp((Object.keys(topicMap).length / topicsOfClass.length) * 100)
    : null;

  const pcts = sorted.map(PCT);
  const consistency = pcts.length >= 2 ? clamp(100 - stdev(pcts) * 2) : null;

  /* Punctuality */
  let onTime = 0;
  let timed = 0;
  sorted.forEach((s) => {
    const close = closesOfExam[s.examId];
    if (!close) return;
    timed += 1;
    if (toMs(s.submittedAt) <= toMs(close)) onTime += 1;
  });
  const punctuality = timed ? clamp((onTime / timed) * 100) : null;

  /* Trend */
  let trend = null;
  if (pcts.length >= 4) {
    trend = clamp(50 + (avg(pcts.slice(-3)) - avg(pcts.slice(-6, -3))) * 1.6);
  }

  const enough = sorted.length >= 3 && ratedTotal >= 20;
  const parts = { accuracy, coverage, consistency, punctuality, trend };
  let mastery = null;
  if (enough) {
    let sum = 0;
    let wSum2 = 0;
    MASTERY_PARTS.forEach((p) => {
      const v = parts[p.key];
      if (v === null || v === undefined) return;
      sum += v * p.weight;
      wSum2 += p.weight;
    });
    mastery = wSum2 ? Math.round(sum / wSum2) : null;
  }

  return {
    count: sorted.length,
    accuracy: Math.round(accuracy),
    pctAvg: pcts.length ? Math.round(avg(pcts)) : null,
    coverage: coverage === null ? null : Math.round(coverage),
    consistency: consistency === null ? null : Math.round(consistency),
    punctuality: punctuality === null ? null : Math.round(punctuality),
    trend: trend === null ? null : Math.round(trend),
    mastery,
    topics,
    ratedTotal,
  };
}

/* ---------- 1 học sinh ---------- */
function buildStudent(student, subs, topicsOfClass, closesOfExam, teacherOfExam) {
  const sorted = [...subs].sort((a, b) => toMs(a.submittedAt) - toMs(b.submittedAt));
  const all = computeMetrics(sorted, topicsOfClass, closesOfExam);

  /* Tách theo giáo viên bộ môn */
  const byTeacherMap = {};
  sorted.forEach((s) => {
    const info = teacherOfExam[s.examId] || { teacherId: 'unknown', teacherName: 'Không rõ', subject: '' };
    const key = info.teacherId || info.teacherName;
    if (!byTeacherMap[key]) {
      byTeacherMap[key] = { key, teacherId: info.teacherId, teacherName: info.teacherName, subject: info.subject, subs: [] };
    }
    byTeacherMap[key].subs.push(s);
  });
  const byTeacher = Object.values(byTeacherMap).map((g) => {
    const m = computeMetrics(g.subs, topicsOfClass, closesOfExam);
    return {
      key: g.key,
      teacherId: g.teacherId,
      teacherName: g.teacherName,
      subject: g.subject,
      count: m.count,
      pctAvg: m.pctAvg,
      accuracy: m.accuracy,
      mastery: m.mastery,
    };
  }).sort((a, b) => (b.count - a.count));

  /* Cờ cảnh báo */
  const pcts = sorted.map(PCT);
  const flags = [];
  const lastTwo = pcts.slice(-2);
  const prevTwo = pcts.slice(-4, -2);
  if (lastTwo.length === 2 && prevTwo.length === 2 && avg(lastTwo) < avg(prevTwo) - 10) {
    flags.push({ key: 'down', label: 'Đang tụt điểm' });
  }
  const weak = all.topics.filter((t) => t.rated >= 4 && t.rate < 50);
  if (weak.length >= 2) flags.push({ key: 'weak', label: `${weak.length} chương yếu` });
  if (!sorted.length) flags.push({ key: 'none', label: 'Chưa nộp bài' });
  const abnormal = sorted.some((s) => {
    const dur = Number(s.examDuration || s.duration || 0);
    const spent = Number(s.timeSpent || 0);
    return dur > 0 && spent > 0 && spent < dur * 60 * 0.15;
  });
  if (abnormal) flags.push({ key: 'fast', label: 'Nộp quá nhanh' });

  return {
    id: student.id,
    name: student.name || student.email || 'Học sinh',
    email: student.email || '',
    ...all,
    weakest: weak.sort((a, b) => a.rate - b.rate)[0] || null,
    byTeacher,
    flags,
    lastAt: sorted.length ? toMs(sorted[sorted.length - 1].submittedAt) : 0,
    subs: sorted,
  };
}

export function buildClassAnalytics({
  cls, exams = [], submissionsMap = {}, rangeDays = 'all', now = Date.now(), teacherFilter = 'all',
} = {}) {
  const cutoff = rangeDays === 'all' ? 0 : now - Number(rangeDays) * 86400000;

  const classExams = exams.filter((e) => !cls?.id || e.classId === cls.id);

  /* Chuyên đề + giờ đóng + giáo viên của từng đề */
  const topicSet = new Set();
  const closesOfExam = {};
  const teacherOfExam = {};
  classExams.forEach((e) => {
    closesOfExam[e.id] = e.closesAt || null;
    teacherOfExam[e.id] = {
      teacherId: e.teacherId || '',
      teacherName: e.teacherName || 'Giáo viên',
      subject: e.subject || '',
    };
    (e.questions || []).forEach((q) => { if (q.topic) topicSet.add(String(q.topic)); });
  });
  const topicsOfClass = [...topicSet];

  /* Lọc theo giáo viên nếu có */
  const activeExams = teacherFilter === 'all'
    ? classExams
    : classExams.filter((e) => (e.teacherId || e.teacherName) === teacherFilter);

  /* Gom bài nộp */
  const subsByStudent = {};
  const allSubs = [];
  activeExams.forEach((exam) => {
    const list = submissionsMap[exam.id] || [];
    const qTopics = (exam.questions || []).map((q) => (q.topic ? String(q.topic) : null));
    list.forEach((s) => {
      const t = toMs(s.submittedAt);
      if (t && t < cutoff) return;
      const enriched = { ...s, examId: exam.id, examTitle: exam.title, __topics: qTopics };
      allSubs.push(enriched);
      if (!s.studentId) return;
      if (!subsByStudent[s.studentId]) subsByStudent[s.studentId] = [];
      subsByStudent[s.studentId].push(enriched);
    });
  });

  /* Thành viên lớp (+ học sinh chỉ xuất hiện trong bài nộp) */
  const members = (cls?.members || []).map((m) => ({ id: m.id, name: m.name, email: m.email }));
  const known = {};
  members.forEach((m) => { known[m.id] = m; });
  Object.keys(subsByStudent).forEach((sid) => {
    if (!known[sid]) {
      const first = subsByStudent[sid][0];
      known[sid] = { id: sid, name: first.studentName || 'Học sinh', email: '' };
    }
  });

  const students = Object.values(known).map((m) =>
    buildStudent(m, subsByStudent[m.id] || [], topicsOfClass, closesOfExam, teacherOfExam));

  /* Thống kê chương cả lớp */
  const topicAgg = {};
  students.forEach((st) => st.topics.forEach((t) => {
    if (!topicAgg[t.topic]) topicAgg[t.topic] = { topic: t.topic, ok: 0, rated: 0 };
    topicAgg[t.topic].ok += t.ok;
    topicAgg[t.topic].rated += t.rated;
  }));
  const classTopics = Object.values(topicAgg)
    .map((t) => ({ ...t, rate: Math.round((t.ok / t.rated) * 100) }))
    .sort((a, b) => a.rate - b.rate);

  /* Câu khó nhất */
  const examById = Object.fromEntries(activeExams.map((e) => [e.id, e]));
  const qMap = {};
  allSubs.forEach((s) => {
    const exam = examById[s.examId];
    (s.detail || []).forEach((d, i) => {
      const q = exam?.questions?.[i];
      if (!q) return;
      const key = `${s.examId}#${i}`;
      if (!qMap[key]) {
        qMap[key] = { key, text: q.q || '', topic: q.topic || '', examTitle: exam.title, ok: 0, rated: 0 };
      }
      qMap[key].rated += 1;
      if (d?.isCorrect) qMap[key].ok += 1;
    });
  });
  const hardest = Object.values(qMap)
    .filter((q) => q.rated >= 3)
    .map((q) => ({ ...q, rate: Math.round((q.ok / q.rated) * 100) }))
    .sort((a, b) => a.rate - b.rate)
    .slice(0, 8);

  /* ---------- Giáo viên bộ môn ---------- */
  const tMap = {};
  classExams.forEach((e) => {
    const key = e.teacherId || e.teacherName || 'unknown';
    if (!tMap[key]) {
      tMap[key] = {
        key,
        teacherId: e.teacherId || '',
        teacherName: e.teacherName || 'Giáo viên',
        subject: e.subject || '',
        examCount: 0,
        examTitles: [],
        studentIds: new Set(),
        pcts: [],
        masteryList: [],
      };
    }
    const t = tMap[key];
    t.examCount += 1;
    if (e.title) t.examTitles.push(e.title);
    (submissionsMap[e.id] || []).forEach((s) => {
      const ms = toMs(s.submittedAt);
      if (ms && ms < cutoff) return;
      if (s.studentId) t.studentIds.add(s.studentId);
      t.pcts.push(PCT(s));
    });
  });

  const teachers = Object.values(tMap).map((t) => {
    const own = students.filter((st) => st.byTeacher.some((x) => x.key === t.key));
    const masteryList = own.map((st) => {
      const row = st.byTeacher.find((x) => x.key === t.key);
      return row?.mastery;
    }).filter((v) => v !== null && v !== undefined);
    return {
      key: t.key,
      teacherId: t.teacherId,
      teacherName: t.teacherName,
      subject: t.subject,
      examCount: t.examCount,
      examTitles: t.examTitles.slice(0, 4),
      submissions: t.pcts.length,
      students: t.studentIds.size,
      pctAvg: t.pcts.length ? Math.round(avg(t.pcts)) : null,
      masteryAvg: masteryList.length ? Math.round(avg(masteryList)) : null,
      coverage: members.length ? Math.round((t.studentIds.size / members.length) * 100) : null,
      isMine: false,
    };
  }).sort((a, b) => b.examCount - a.examCount || b.submissions - a.submissions);

  /* ---------- Ma trận học sinh × giáo viên ---------- */
  const matrix = students.map((st) => ({
    studentId: st.id,
    studentName: st.name,
    cells: teachers.map((t) => {
      const row = st.byTeacher.find((x) => x.key === t.key);
      return row ? { count: row.count, pct: row.pctAvg } : null;
    }),
    total: st.count,
  }));

  const pcts = allSubs.map(PCT);
  const withMastery = students.filter((s) => s.mastery !== null);

  return {
    classId: cls?.id || '',
    className: cls?.name || 'Lớp',
    members,
    students: students.sort((a, b) => {
      if (a.mastery === null && b.mastery === null) return a.name.localeCompare(b.name);
      if (a.mastery === null) return 1;
      if (b.mastery === null) return -1;
      return a.mastery - b.mastery;
    }),
    classTopics,
    hardest,
    teachers,
    matrix,
    kpi: {
      students: members.length,
      submitted: allSubs.length,
      avgPct: pcts.length ? Math.round(avg(pcts)) : null,
      passRate: pcts.length ? Math.round((pcts.filter((p) => p >= 50).length / pcts.length) * 100) : null,
      masteryAvg: withMastery.length ? Math.round(avg(withMastery.map((s) => s.mastery))) : null,
      atRisk: withMastery.filter((s) => s.mastery < 40).length,
      noSub: students.filter((s) => s.count === 0).length,
      dataCoverage: students.length ? Math.round((withMastery.length / students.length) * 100) : 0,
      topics: topicsOfClass,
      exams: activeExams.length,
      allExams: classExams.length,
      teachers: teachers.length,
    },
  };
}
