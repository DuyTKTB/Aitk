/* ============================================================
   roadmapEngine.js — LÕI TÍNH TOÁN CỦA LỘ TRÌNH KIẾN THỨC
   ------------------------------------------------------------
   Toàn bộ là hàm THUẦN (không đọc mạng, không localStorage) để
   test được bằng vitest và dùng chung cho mọi nguồn dữ liệu.

   Ba khái niệm PHẢI tách rời (đừng gộp làm một):
     • Đã luyện  (answers > 0)        — có bằng chứng học tập
     • Hoàn thành (mastery >= 80)     — đạt ngưỡng nội dung chương
     • Thành thạo (mastery >= 80 &&
                   answers >= SOLID_ANSWERS && độ tin cậy cao)
   "Cần ôn" là trạng thái THỜI GIAN (quá hạn ôn), không phải điểm.

   Điểm thành thạo KHÔNG lấy từ % bài đã mở, KHÔNG lấy từ XP.
   Nó là ước lượng từ bằng chứng trả lời thật:
        score = 100 × accuracy × volume × recency
     • accuracy = số câu đúng / số câu đã làm
     • volume   = 0.6 + 0.4 × min(1, answers / 12)   → làm ít thì hạ điểm
     • recency  = 0.75 + 0.25 × 0.85^(ngày/14)       → lâu không ôn thì hạ
   Ngưỡng phân loại cấu hình được qua BANDS.
   ============================================================ */

export const DAY = 86400000;

/* Ngưỡng phân loại — có thể chỉnh, KHÔNG phải chuẩn học thuật tuyệt đối */
export const BANDS = {
  weak: 40,       // < 40  : cần củng cố
  forming: 60,    // 40–59 : đang hình thành
  proficient: 80, // 60–79 : đạt mức khá
  strong: 95,     // 80–94 : thành thạo · ≥95 : thành thạo cao
};

/* Ngưỡng "đã đạt" dùng chung cho mọi nơi hiển thị (đừng gõ cứng 80 ở UI) */
export const MASTERED_SCORE = BANDS.proficient;

/* Số câu tối thiểu để được phép KẾT LUẬN về năng lực */
export const MIN_ANSWERS = 5;
/* Số câu để coi là bằng chứng đủ dày (volume = 1) */
export const SOLID_ANSWERS = 12;

/* Khoảng cách ôn đề xuất (ngày) theo mức thành thạo */
export function reviewIntervalDays(score, answers) {
  if (!answers) return 1;
  if (answers < MIN_ANSWERS) return 1;
  if (score === null) return 1;
  if (score >= BANDS.strong) return 30;
  if (score >= BANDS.proficient) return 14;
  if (score >= BANDS.forming) return 7;
  if (score >= BANDS.weak) return 3;
  return 1;
}

export const STATE_META = {
  none: { label: 'Chưa có dữ liệu', short: 'Chưa học', icon: '○', tone: 'muted' },
  insufficient: { label: 'Chưa đủ dữ liệu', short: 'Chưa đủ', icon: '◔', tone: 'muted' },
  weak: { label: 'Cần củng cố', short: 'Cần củng cố', icon: '▲', tone: 'err' },
  forming: { label: 'Đang hình thành', short: 'Đang học', icon: '◐', tone: 'warn' },
  proficient: { label: 'Đạt mức khá', short: 'Khá', icon: '◕', tone: 'acc' },
  mastered: { label: 'Thành thạo', short: 'Thành thạo', icon: '●', tone: 'ok' },
  strong: { label: 'Thành thạo cao', short: 'Rất vững', icon: '★', tone: 'ok' },
  ai: { label: 'Chưa có ngân hàng câu hỏi', short: 'Học bằng AI', icon: '✦', tone: 'muted' },
};

/* ============================================================
   1. Tổng hợp bằng chứng theo chương
   events: [{ topicId, correct:boolean, at:ms, source, sessionId }]
   ============================================================ */
export function summarizeEvents(events = []) {
  /** @type {Record<string, {answers:number, correct:number, lastAt:number, firstAt:number, sessions:Set<string>, bySource:Record<string,number>}>} */
  const map = {};
  for (let i = 0; i < events.length; i += 1) {
    const e = events[i];
    if (!e || !e.topicId) continue;
    const at = Number(e.at) || 0;
    const cur = map[e.topicId] || {
      answers: 0, correct: 0, lastAt: 0, firstAt: 0,
      sessions: new Set(), bySource: {},
    };
    cur.answers += 1;
    if (e.correct === true) cur.correct += 1;
    if (at > cur.lastAt) cur.lastAt = at;
    if (!cur.firstAt || at < cur.firstAt) cur.firstAt = at;
    if (e.sessionId) cur.sessions.add(e.sessionId);
    const src = e.source || 'other';
    cur.bySource[src] = (cur.bySource[src] || 0) + 1;
    map[e.topicId] = cur;
  }

  const out = {};
  Object.keys(map).forEach((id) => {
    const s = map[id];
    out[id] = {
      answers: s.answers,
      correct: s.correct,
      accuracy: s.answers ? s.correct / s.answers : null,
      lastAt: s.lastAt,
      firstAt: s.firstAt,
      sessions: s.sessions.size,
      bySource: s.bySource,
    };
  });
  return out;
}

/* ============================================================
   2. Điểm thành thạo + độ tin cậy
   ============================================================ */
export function masteryOf(summary, now = Date.now()) {
  const answers = summary?.answers || 0;
  if (!answers) return { score: null, confidence: 'none', accuracy: null, ageDays: null };

  const accuracy = (summary.correct || 0) / answers;
  const volume = Math.min(1, answers / SOLID_ANSWERS);
  const ageDays = summary.lastAt ? Math.max(0, (now - summary.lastAt) / DAY) : 0;
  const recency = Math.pow(0.85, ageDays / 14);
  const score = Math.round(
    100 * accuracy * (0.6 + 0.4 * volume) * (0.75 + 0.25 * recency)
  );

  const confidence =
    answers >= SOLID_ANSWERS ? 'high' : answers >= MIN_ANSWERS ? 'medium' : 'low';

  return {
    score: Math.max(0, Math.min(100, score)),
    confidence,
    accuracy: Math.round(accuracy * 100),
    ageDays: Math.round(ageDays),
  };
}

/* ============================================================
   3. Trạng thái chương
   ============================================================ */
export function stateOf(summary, chapter = {}, now = Date.now()) {
  if (chapter && chapter.bank === false) return 'ai';
  const answers = summary?.answers || 0;
  if (!answers) return 'none';
  const { score } = masteryOf(summary, now);
  if (answers < MIN_ANSWERS) return 'insufficient';
  if (score < BANDS.weak) return 'weak';
  if (score < BANDS.forming) return 'forming';
  if (score < BANDS.proficient) return 'proficient';
  if (score < BANDS.strong) return 'mastered';
  return 'strong';
}

/* ============================================================
   4. Lịch ôn
   ============================================================ */
export function reviewOf(summary, now = Date.now()) {
  const answers = summary?.answers || 0;
  if (!answers || !summary.lastAt) return { dueAt: null, isDue: false, overdueDays: 0, intervalDays: null };
  const { score } = masteryOf(summary, now);
  const intervalDays = reviewIntervalDays(score, answers);
  const dueAt = summary.lastAt + intervalDays * DAY;
  const isDue = now >= dueAt;
  return {
    dueAt,
    isDue,
    intervalDays,
    overdueDays: isDue ? Math.floor((now - dueAt) / DAY) : 0,
  };
}

/* ============================================================
   5. Dựng view theo khối lớp
   ============================================================ */
export function buildChapterViews(level, summaries = {}, now = Date.now()) {
  const chapters = (level?.chapters || []).map((chapter, index) => {
    const summary = chapter.id ? summaries[chapter.id] || null : null;
    const mastery = masteryOf(summary, now);
    const state = stateOf(summary, chapter, now);
    const review = reviewOf(summary, now);

    /* Điều kiện tiên quyết chỉ để GỢI Ý — không khoá */
    const missingPrereq = (chapter.prereq || [])
      .map((id) => ({ id, summary: summaries[id] || null }))
      .filter((p) => {
        if (!p.summary) return true;
        const m = masteryOf(p.summary, now);
        return m.score === null || m.score < BANDS.forming;
      });

    return { chapter, index, summary, mastery, state, review, missingPrereq };
  });

  const trackable = chapters.filter((c) => c.chapter.bank !== false);
  const started = trackable.filter((c) => c.summary && c.summary.answers > 0);
  const mastered = trackable.filter(
    (c) => c.mastery.score !== null && c.mastery.score >= BANDS.proficient
      && c.summary.answers >= MIN_ANSWERS
  );
  const dueNow = trackable.filter((c) => c.review.isDue);

  const answered = trackable.reduce((n, c) => n + (c.summary?.answers || 0), 0);
  const correct = trackable.reduce((n, c) => n + (c.summary?.correct || 0), 0);

  const scoredChapters = trackable.filter((c) => c.mastery?.score !== null && Number.isFinite(c.mastery?.score));
  const avgMastery = scoredChapters.length
    ? Math.round(scoredChapters.reduce((acc, c) => acc + c.mastery.score, 0) / scoredChapters.length)
    : (answered > 0 ? (answered ? Math.round((correct / answered) * 100) : 55) : null);

  const overview = {
    chaptersTotal: trackable.length,
    chaptersStarted: started.length,
    chaptersMastered: mastered.length,
    reviewDue: dueNow.length,
    answered,
    correct,
    accuracy: answered ? Math.round((correct / answered) * 100) : null,
    avgMastery,
    completionPct: trackable.length ? Math.round((mastered.length / trackable.length) * 100) : 0,
    hasEvidence: answered > 0,
  };

  return { chapters, trackable, overview };
}

/* ============================================================
   6. Thống kê tuần / thời gian học
   ============================================================ */
export function weekProgress(events = [], now = Date.now()) {
  const since = now - 7 * DAY;
  let count = 0;
  for (let i = 0; i < events.length; i += 1) {
    if ((events[i]?.at || 0) >= since) count += 1;
  }
  return count;
}

/** attempts: [{ timeSpent: giây, at:ms }] */
export function studyMinutes(attempts = [], practiceSessions = []) {
  let sec = 0;
  attempts.forEach((a) => { sec += Number(a?.timeSpent) || 0; });
  practiceSessions.forEach((s) => { sec += (Number(s?.durationMs) || 0) / 1000; });
  return Math.round(sec / 60);
}

/* ============================================================
   7. Gợi ý học tập — mỗi gợi ý BẮT BUỘC có lý do + hành động
   ============================================================ */
export function buildSuggestions(chapterViews, now = Date.now(), limit = 4) {
  const out = [];
  const list = chapterViews.filter((c) => c.chapter.bank !== false);

  /* 7.1 Quá hạn ôn — ưu tiên cao nhất, lý do là thời gian thật */
  list
    .filter((c) => c.review.isDue && c.summary)
    .sort((a, b) => b.review.overdueDays - a.review.overdueDays)
    .forEach((c) => {
      out.push({
        kind: 'review',
        chapterId: c.chapter.id,
        title: `Ôn lại: ${c.chapter.name}`,
        reason: c.review.overdueDays > 0
          ? `Quá hạn ôn ${c.review.overdueDays} ngày (chu kỳ ${c.review.intervalDays} ngày, điểm hiện tại ${c.mastery.score}%).`
          : `Đến hạn ôn theo chu kỳ ${c.review.intervalDays} ngày.`,
        action: 'review',
        actionLabel: 'Ôn 8 câu',
        priority: 100 + Math.min(30, c.review.overdueDays),
      });
    });

  /* 7.2 Chương yếu nhưng đã đủ dữ liệu để kết luận */
  list
    .filter((c) => c.summary && c.summary.answers >= MIN_ANSWERS && c.mastery.score !== null && c.mastery.score < BANDS.forming)
    .sort((a, b) => a.mastery.score - b.mastery.score)
    .forEach((c) => {
      out.push({
        kind: 'weak',
        chapterId: c.chapter.id,
        title: `Củng cố: ${c.chapter.name}`,
        reason: `Độ chính xác ${c.summary.correct}/${c.summary.answers} câu (${c.mastery.accuracy}%), điểm thành thạo ${c.mastery.score}%.`,
        action: 'practice',
        actionLabel: 'Luyện 8 câu',
        priority: 80 + (BANDS.forming - c.mastery.score),
      });
    });

  /* 7.3 Chương kế tiếp chưa học (theo đúng thứ tự chương trình) */
  const nextNew = list.find((c) => !c.summary || c.summary.answers === 0);
  if (nextNew) {
    const prereqNames = (nextNew.chapter.prereq || [])
      .map((id) => list.find((x) => x.chapter.id === id))
      .filter(Boolean)
      .map((x) => x.chapter.name);
    out.push({
      kind: 'next',
      chapterId: nextNew.chapter.id,
      title: `Học mới: ${nextNew.chapter.name}`,
      reason: prereqNames.length
        ? `Chương kế tiếp trong chương trình; kiến thức trước: ${prereqNames.join(', ')}.`
        : 'Chương đầu tiên trong chương trình của khối này.',
      action: 'open',
      actionLabel: 'Mở chương',
      priority: 60 - nextNew.index,
    });
  }

  /* 7.4 Điểm mạnh — để học sinh biết nên giữ gì (không phải khen suông) */
  const strong = list
    .filter((c) => c.mastery.score !== null && c.mastery.score >= BANDS.proficient)
    .sort((a, b) => b.mastery.score - a.mastery.score)[0];
  if (strong && out.length < limit) {
    out.push({
      kind: 'strong',
      chapterId: strong.chapter.id,
      title: `Giữ nhịp: ${strong.chapter.name}`,
      reason: `Đang ở ${strong.mastery.score}% với ${strong.summary.answers} câu đã làm — ôn lại theo chu kỳ ${strong.review.intervalDays} ngày để không rơi.`,
      action: 'review',
      actionLabel: 'Ôn nhanh',
      priority: 30,
    });
  }

  return out.sort((a, b) => b.priority - a.priority).slice(0, limit);
}

/* ============================================================
   8. Ngữ cảnh gửi cho AI (chỉ số liệu THẬT, ngắn, có giới hạn)
   ============================================================ */
export function buildAiContext({ levelKey, level, chapterViews, overview, extra = {} }) {
  const rows = chapterViews
    .filter((c) => c.chapter.bank !== false)
    .map((c) => {
      if (!c.summary) return `- ${c.chapter.name}: chưa có dữ liệu`;
      const conf = c.mastery.confidence === 'low' ? ' (ít dữ liệu)' : '';
      return `- ${c.chapter.name}: ${c.summary.correct}/${c.summary.answers} câu đúng (${c.mastery.accuracy}%), thành thạo ${c.mastery.score}%${conf}, trạng thái ${STATE_META[c.state]?.label || c.state}, học gần nhất ${Math.round(c.mastery.ageDays ?? 0)} ngày trước`;
    })
    .join('\n');

  const head = [
    `Học sinh đang học chương trình Hoá học ${levelKey}.`,
    `Mục tiêu khối: ${level?.goal || ''}`,
    `Tổng: ${overview.chaptersMastered}/${overview.chaptersTotal} chương đạt ≥${MASTERED_SCORE}%, đã làm ${overview.answered} câu, chính xác ${overview.accuracy ?? '—'}%, ${overview.reviewDue} chương quá hạn ôn.`,
    `Số câu đã làm trong 7 ngày: ${extra.weekCount ?? 0}${extra.weekGoal ? ` (mục tiêu ${extra.weekGoal})` : ''}.`,
    '',
    'Dữ liệu theo chương:',
    rows,
  ];

  const text = head.join('\n');
  return text.length > 1800 ? `${text.slice(0, 1800)}…` : text;
}

/* ============================================================
   8.1. Bằng chứng theo TỪNG CÂU → luyện lại đúng câu từng sai
   ------------------------------------------------------------
   Đầu vào là events có `qid`. Câu được coi là "cần ôn lại" khi đã
   từng sai và chưa được trả lời đúng nhiều hơn số lần sai.
   ============================================================ */
export function questionStats(events = []) {
  const map = {};
  for (let i = 0; i < events.length; i += 1) {
    const e = events[i];
    const qid = e && e.qid;
    if (!qid) continue;
    const at = Number(e.at) || 0;
    const cur = map[qid] || {
      qid, topicId: e.topicId || null, wrong: 0, right: 0, lastAt: 0, lastOk: null,
    };
    if (e.correct === true) cur.right += 1;
    else cur.wrong += 1;
    if (at >= cur.lastAt) {
      cur.lastAt = at;
      cur.lastOk = e.correct === true;
    }
    if (!cur.topicId && e.topicId) cur.topicId = e.topicId;
    map[qid] = cur;
  }
  return map;
}

/** Danh sách câu nên ôn lại, ưu tiên câu sai nhiều và lâu chưa làm */
export function reviewQueue(questionMap = {}, { now = Date.now(), topicId = null, limit = 50 } = {}) {
  return Object.keys(questionMap)
    .map((k) => questionMap[k])
    .filter((q) => q.wrong > 0 && (q.right < q.wrong || q.lastOk === false))
    .filter((q) => !topicId || q.topicId === topicId)
    .sort((a, b) => (b.wrong - b.right) - (a.wrong - a.right) || a.lastAt - b.lastAt)
    .slice(0, limit)
    .map((q) => ({ ...q, ageDays: q.lastAt ? Math.round((now - q.lastAt) / DAY) : null }));
}

/** Số câu đang chờ ôn (dùng cho thẻ "Ôn tập hôm nay") */
export function dueQuestionCount(questionMap = {}) {
  return reviewQueue(questionMap, { limit: 9999 }).length;
}

/* ============================================================
   8.2. Hoạt động theo ngày + chuỗi ngày học (streak)
   ------------------------------------------------------------
   Ngày tính theo GIỜ ĐỊA PHƯƠNG của người học (không phải UTC), nên
   câu làm lúc 00:30 giờ Việt Nam vẫn thuộc ngày mới.
   ============================================================ */
export function dayKey(ms) {
  const d = new Date(ms);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

const WEEKDAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

/** `days` ngày gần nhất (cũ → mới): số câu đã làm và số câu đúng mỗi ngày */
export function dailyActivity(events = [], days = 14, now = Date.now()) {
  const n = Math.max(1, Math.min(120, Math.round(days) || 14));
  const buckets = {};
  const out = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setHours(12, 0, 0, 0);          // giữa trưa: tránh lệch khi chuyển giờ mùa hè
    d.setDate(d.getDate() - i);
    const key = dayKey(d.getTime());
    const row = {
      key, label: WEEKDAY_SHORT[d.getDay()], date: d.getDate(), count: 0, correct: 0, isToday: i === 0,
    };
    buckets[key] = row;
    out.push(row);
  }
  for (let i = 0; i < events.length; i += 1) {
    const e = events[i];
    const at = Number(e && e.at) || 0;
    if (!at) continue;
    const row = buckets[dayKey(at)];
    if (!row) continue;
    row.count += 1;
    if (e.correct === true) row.correct += 1;
  }
  return out;
}

/** Chuỗi ngày liên tiếp có làm bài. Chưa làm hôm nay nhưng hôm qua có → chuỗi vẫn còn */
export function streakOf(events = [], now = Date.now()) {
  const days = new Set();
  for (let i = 0; i < events.length; i += 1) {
    const at = Number(events[i] && events[i].at) || 0;
    if (at) days.add(dayKey(at));
  }
  const step = (ms, delta) => {
    const d = new Date(ms);
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + delta);
    return d.getTime();
  };

  const activeToday = days.has(dayKey(now));
  let cursor = activeToday ? now : step(now, -1);
  let current = 0;
  while (days.has(dayKey(cursor)) && current < 1000) {
    current += 1;
    cursor = step(cursor, -1);
  }

  /* Chuỗi dài nhất từ trước tới giờ */
  const sorted = Array.from(days).sort();
  let best = 0;
  let run = 0;
  let prev = null;
  sorted.forEach((k) => {
    const [y, m, d] = k.split('-').map(Number);
    const ms = new Date(y, m - 1, d, 12).getTime();
    run = prev !== null && dayKey(step(prev, 1)) === k ? run + 1 : 1;
    if (run > best) best = run;
    prev = ms;
  });

  return { current, best: Math.max(best, current), activeToday, totalDays: days.size };
}

/* ============================================================
   9. Tiện ích hiển thị
   ============================================================ */
export function agoLabel(at, now = Date.now()) {
  if (!at) return '—';
  const m = Math.round((now - at) / 60000);
  if (m < 1) return 'vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.round(h / 24);
  if (d === 1) return 'hôm qua';
  if (d < 30) return `${d} ngày trước`;
  return `${Math.round(d / 30)} tháng trước`;
}

export function fmtMinutes(min) {
  const n = Number(min) || 0;
  if (n < 60) return `${n} phút`;
  const h = Math.floor(n / 60);
  const r = n % 60;
  return r ? `${h}h${String(r).padStart(2, '0')}` : `${h} giờ`;
}
