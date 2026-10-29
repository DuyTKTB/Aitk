/* ============================================================
   studyPlan.js — KẾ HOẠCH HỌC TỚI NGÀY THI (hàm thuần, test được)
   ------------------------------------------------------------
   Khác "mục tiêu tuần" ở chỗ: đây là lịch theo NGÀY, tính từ dữ liệu
   thật (mức thành thạo còn thiếu, số câu đang chờ ôn), có:
     • trọng số theo độ khó còn thiếu (không chia đều vô nghĩa)
     • ngày cuối dành cho ôn tập (không nhồi kiến thức mới)
     • cảnh báo BẤT KHẢ THI thay vì tạo lịch không làm nổi
   Không gọi AI, không ghi mạng — mọi thứ tính tại client.

   v2 (sửa sau khi kiểm thử trên trình duyệt):
     • Trước đây lịch dồn hết việc vào 2–4 ngày đầu rồi bỏ trống phần
       còn lại. Nay chia theo NGÂN SÁCH mỗi ngày (totalNeed / số ngày)
       nên việc trải đều tới sát ngày thi.
     • Ngày cuối LUÔN có việc ôn (kể cả khi chưa có dữ liệu), và câu
       kết luận chỉ nói "ôn tổng" khi thực sự có việc ôn.
   ============================================================ */

export const DAY = 86400000;

export const DEFAULT_PLAN = {
  examDate: '',
  minutesPerDay: 60,
  restDays: [0],
  maxTasksPerDay: 3,
};

const WEEKDAY_VI = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

/* 'YYYY-MM-DD' phải hiểu theo giờ địa phương. new Date('2026-11-05') là nửa đêm UTC,
   ở múi giờ âm (hoặc khi lệch ngày) sẽ thành ngày hôm trước. */
export const parseISODate = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || '').trim());
  if (!m) return new Date(NaN);
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
};

/* Ngày mai (giờ địa phương) dạng ISO — dùng cho thuộc tính min của ô chọn ngày thi */
export const tomorrowISO = (now = Date.now()) => {
  const d = startOfDay(now);
  d.setDate(d.getDate() + 1);
  return isoOf(d);
};

const isoOf = (d) => {
  const x = startOfDay(d);
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  return `${x.getFullYear()}-${m}-${day}`;
};

const labelOf = (d) => {
  const x = startOfDay(d);
  return `${WEEKDAY_VI[x.getDay()]} ${String(x.getDate()).padStart(2, '0')}/${String(x.getMonth() + 1).padStart(2, '0')}`;
};

/* Số phút cần cho 1 chương, dựa trên trạng thái thật */
export function needMinutes(view, dueCount = 0) {
  const score = view.mastery.score;
  let base;
  if (score === null) base = 30;            // chưa có bằng chứng → cần học/luyện từ đầu
  else if (score < 40) base = 28;           // yếu
  else if (score < 60) base = 22;
  else if (score < 80) base = 16;
  else base = 10;                           // đã khá, chỉ cần giữ
  return base + Math.min(20, dueCount * 2); // mỗi câu từng sai ~2 phút
}

/* Trọng số ưu tiên: thiếu nhiều điểm hơn + chưa từng học + câu đang chờ ôn */
export function weightOf(view, dueCount = 0) {
  const score = view.mastery.score;
  const gap = score === null ? 100 : Math.max(0, 80 - score);
  const fresh = view.state === 'none' ? 1.4 : view.state === 'insufficient' ? 1.15 : 1;
  return (gap / 100) * fresh + Math.min(0.5, dueCount * 0.08);
}

export const actionFor = (view, dueCount = 0) => {
  if (dueCount > 0 && view.summary) return { key: 'review', label: 'Ôn câu sai' };
  if (!view.summary) return { key: 'learn', label: 'Học mới' };
  return { key: 'practice', label: 'Luyện tập' };
};

/* ============================================================
   Sinh kế hoạch
   chapters  : mảng chapterView từ roadmapEngine
   dueByTopic: { [topicId]: số câu đang chờ ôn }
   ============================================================ */
export function buildStudyPlan({ chapters = [], dueByTopic = {}, settings = DEFAULT_PLAN, now = Date.now() } = {}) {
  const warnings = [];
  const exam = settings.examDate ? parseISODate(settings.examDate) : null;
  const today = startOfDay(now);

  if (!exam || Number.isNaN(exam.getTime())) {
    return { ok: false, reason: 'missing-date', warnings: ['Chưa chọn ngày thi.'], days: [], stats: null };
  }
  if (exam <= today) {
    return { ok: false, reason: 'past-date', warnings: ['Ngày thi đã qua hoặc là hôm nay — chọn ngày sau hôm nay.'], days: [], stats: null };
  }
  const spanDays = Math.round((exam - today) / DAY);
  if (spanDays > 400) {
    return { ok: false, reason: 'too-far', warnings: ['Ngày thi quá xa (hơn 400 ngày).'], days: [], stats: null };
  }

  const minutesPerDay = Math.max(15, Math.min(600, Number(settings.minutesPerDay) || 60));
  const maxTasks = Math.max(1, Math.min(5, Number(settings.maxTasksPerDay) || 3));
  const restDays = Array.isArray(settings.restDays) ? settings.restDays : [0];

  /* 1. Danh sách ngày học được (bỏ ngày nghỉ, bỏ chính ngày thi) */
  const days = [];
  for (let i = 0; i < spanDays; i += 1) {
    const d = new Date(today.getTime() + i * DAY);
    if (restDays.includes(d.getDay())) continue;
    days.push({ date: isoOf(d), label: labelOf(d), minutes: 0, tasks: [] });
  }
  if (!days.length) {
    return { ok: false, reason: 'no-days', warnings: ['Toàn bộ thời gian còn lại là ngày nghỉ.'], days: [], stats: null };
  }

  /* 2. Hàng đợi chương cần làm */
  const queue = chapters
    .filter((c) => c.chapter.bank !== false && c.chapter.id)
    .map((view) => {
      const due = dueByTopic[view.chapter.id] || 0;
      const need = needMinutes(view, due);
      return {
        view,
        chapterId: view.chapter.id,
        name: view.chapter.name,
        due,
        need,
        weight: weightOf(view, due),
        action: actionFor(view, due),
      };
    })
    .filter((t) => t.weight > 0.02)
    .sort((a, b) => b.weight - a.weight);

  const totalNeed = queue.reduce((n, t) => n + t.need, 0);
  const capacity = days.length * minutesPerDay;

  if (!queue.length) {
    return {
      ok: true,
      reason: 'nothing-to-do',
      warnings: ['Mọi chương đang ở mức tốt — không cần lịch mới. Giữ nhịp ôn theo chu kỳ.'],
      days,
      stats: { totalNeed: 0, planned: 0, capacity, days: days.length, minutesPerDay, feasible: true, coverage: 1, chapters: 0, lastDayReview: false },
    };
  }

  /* 3. Ngày cuối = ôn tập, luôn có ít nhất 1 việc */
  const last = days[days.length - 1];
  const hasData = queue.some((t) => t.view.summary);
  const reviewTargets = queue.filter((t) => t.due > 0 || t.view.summary).slice(0, maxTasks);
  if (!reviewTargets.length) reviewTargets.push(queue[0]);
  let lastDayReview = false;
  if (days.length > 1) {
    reviewTargets.forEach((t) => {
      const minutes = Math.min(30, Math.max(10, Math.round(t.need / 2)));
      last.tasks.push({
        chapterId: t.chapterId,
        name: t.name,
        action: t.view.summary ? { key: 'review', label: 'Ôn tổng' } : { key: 'learn', label: 'Khởi động' },
        minutes,
      });
      if (t.view.summary) lastDayReview = true;
    });
    last.tasks.forEach((x) => { last.minutes += x.minutes; });
  }

  /* 4. Chia theo NGÂN SÁCH mỗi ngày để việc trải đều, không dồn 2 ngày đầu */
  const remaining = queue.map((t) => ({ ...t }));
  const studyDays = days.length > 1 ? days.slice(0, -1) : days;
  const budget = Math.max(25, Math.min(minutesPerDay, Math.round(totalNeed / Math.max(1, studyDays.length))));

  let cursor = 0;
  for (let i = 0; i < studyDays.length && remaining.length; i += 1) {
    const day = studyDays[i];
    let guard = 0;
    while (remaining.length && day.tasks.length < maxTasks && guard < 40) {
      guard += 1;
      const free = Math.min(budget, minutesPerDay) - day.minutes;
      if (free < 10) break;
      remaining.sort((a, b) => b.weight - a.weight || a.need - b.need);
      const t = remaining[cursor % remaining.length];
      const slot = Math.min(30, Math.max(10, Math.min(t.need, free)));
      /* Cùng một chương xuất hiện lại trong ngày → cộng dồn phút, không tạo việc trùng
         (trùng sẽ làm hai ô tick "đã xong" dùng chung một khoá). */
      const same = day.tasks.find((x) => x.chapterId === t.chapterId);
      if (same) same.minutes += slot;
      else day.tasks.push({ chapterId: t.chapterId, name: t.name, action: t.action, minutes: slot });
      day.minutes += slot;
      t.need -= slot;
      if (t.need <= 2) {
        const at = remaining.indexOf(t);
        if (at >= 0) remaining.splice(at, 1);
      } else {
        cursor += 1;
      }
      if (day.minutes >= budget - 9) break;
    }
  }

  /* 5. Còn sót việc → lịch bất khả thi, nói thẳng số liệu */
  const planned = days.reduce((n, d) => n + d.minutes, 0);
  const leftMinutes = remaining.reduce((n, t) => n + Math.max(0, t.need), 0);
  const feasible = totalNeed <= capacity && planned >= totalNeed - 5;

  let suggestedMinutes = minutesPerDay;
  if (!feasible && days.length) {
    suggestedMinutes = Math.ceil((totalNeed / days.length) / 5) * 5;
    warnings.push(
      `Không đủ thời gian: cần khoảng ${totalNeed} phút cho ${queue.length} chương, `
      + `lịch hiện tại chỉ xếp được ${planned} phút. Cần ~${suggestedMinutes} phút/ngày hoặc giảm số chương ưu tiên.`,
    );
  }
  if (restDays.length >= 5) {
    warnings.push('Bạn đang nghỉ 5+ ngày/tuần — kế hoạch sẽ dồn vào rất ít ngày.');
  }
  if (!hasData) {
    warnings.push('Chưa có dữ liệu làm bài nên thứ tự ưu tiên đang dựa trên thứ tự chương trình; luyện vài câu để lịch sát năng lực hơn.');
  }

  const unplaced = remaining.map((t) => ({ chapterId: t.chapterId, name: t.name, need: Math.max(0, t.need) }));

  return {
    ok: true,
    reason: feasible ? 'ok' : 'over-capacity',
    warnings,
    days: days.filter((d) => d.tasks.length),
    stats: {
      days: days.length,
      studyDays: studyDays.length,
      totalNeed,
      planned,
      capacity,
      minutesPerDay,
      budget,
      suggestedMinutes,
      feasible,
      coverage: totalNeed ? Math.min(1, planned / totalNeed) : 1,
      chapters: queue.length,
      lastDayReview,
    },
    unplaced,
  };
}

/* Gom theo tuần để hiển thị gọn (dùng parseISODate để không lệch múi giờ) */
export function groupByWeek(days = []) {
  if (!days.length) return [];
  const base = parseISODate(days[0].date).getTime();
  const out = [];
  let cur = null;
  days.forEach((d) => {
    const k = Math.floor((parseISODate(d.date).getTime() - base) / (7 * DAY));
    if (!cur || cur.week !== k) {
      cur = { week: k, label: `Tuần ${k + 1}`, days: [] };
      out.push(cur);
    }
    cur.days.push(d);
  });
  return out;
}

export function planFileName(settings = {}, levelKey = '') {
  const d = settings.examDate || isoOf(Date.now());
  return `ke-hoach-hoc-${levelKey ? levelKey.replace(/\s+/g, '-').toLowerCase() + '-' : ''}${d}.md`;
}

export function planICalFileName(settings = {}, levelKey = '') {
  const d = settings.examDate || isoOf(Date.now());
  return `lich-on-thi-${levelKey ? levelKey.replace(/\s+/g, '-').toLowerCase() + '-' : ''}${d}.ics`;
}

/* Xuất lịch chuẩn iCalendar (.ics) để nhập vào Google Calendar / Apple Calendar */
export function planToICal(plan, { levelKey = '' } = {}) {
  if (!plan || !plan.ok) return '';
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AITK//LO-TRINH//VI',
    'CALSCALE:GREGORIAN',
  ];
  plan.days.forEach((d) => {
    const dateStr = String(d.date || '').replace(/-/g, '');
    if (!dateStr) return;
    const summary = d.tasks.map((t) => t.name).join(', ');
    const desc = d.tasks.map((t) => `${t.name}: ${t.action?.label || ''} (${t.minutes} phút)`).join('\\n');
    lines.push(
      'BEGIN:VEVENT',
      `DTSTART;VALUE=DATE:${dateStr}`,
      `DTEND;VALUE=DATE:${dateStr}`,
      `SUMMARY:${levelKey ? `[${levelKey}] ` : ''}${summary}`,
      `DESCRIPTION:${desc}`,
      `UID:aitk-plan-${dateStr}@chemstudy`,
      'END:VEVENT',
    );
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/* Kế hoạch → Markdown (để in/lưu, không cần thư viện PDF) */
export function planToMarkdown(plan, { levelKey = '', settings = {} } = {}) {
  if (!plan || !plan.ok) return '';
  const lines = [
    `# Kế hoạch học ${levelKey} → ${settings.examDate || ''}`,
    '',
    `- Thời gian: ${plan.stats.days} ngày · ${plan.stats.minutesPerDay} phút/ngày`,
    `- Tổng nhu cầu: ${plan.stats.totalNeed} phút cho ${plan.stats.chapters} chương`,
    `- Khả thi: ${plan.stats.feasible ? 'có' : `KHÔNG — cần ~${plan.stats.suggestedMinutes} phút/ngày`}`,
    '',
  ];
  plan.days.forEach((d) => {
    lines.push(`## ${d.label} · ${d.minutes} phút`);
    d.tasks.forEach((t) => lines.push(`- [ ] ${t.name} — ${t.action.label} (${t.minutes}')`));
    lines.push('');
  });
  if (plan.unplaced && plan.unplaced.length) {
    lines.push('## Chưa xếp được');
    plan.unplaced.forEach((u) => lines.push(`- ${u.name} (còn ~${u.need}')`));
  }
  return lines.join('\n');
}
