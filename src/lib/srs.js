const DAY = 86400000;
const STORAGE_KEY = 'cs-srs';

/* ============================================================
   Tạo record mới cho 1 thẻ
   ============================================================ */
export function freshRecord() {
  return {
    ef: 2.5,
    reps: 0,
    interval: 0,
    lapses: 0,
    streak: 0,
    due: null,
    lastReview: null,
  };
}

/* ============================================================
   Ôn 1 thẻ — quality 0..5
   ============================================================ */
export function srsReview(rec, quality) {
  const r = { ...(rec || freshRecord()) };
  r.ef = r.ef || 2.5;
  r.reps = r.reps || 0;
  r.interval = r.interval || 0;
  r.lapses = r.lapses || 0;
  r.streak = r.streak || 0;

  if (quality < 3) {
    r.lapses += 1;
    r.reps = 0;
    r.streak = 0;
    r.interval = 1;
    r.ef = Math.max(1.3, r.ef - 0.2);
    r.due = Date.now() + DAY;
  } else {
    r.reps += 1;
    r.streak += 1;
    if (r.reps === 1) r.interval = 1;
    else if (r.reps === 2) r.interval = 6;
    else r.interval = Math.round(r.interval * r.ef);
    r.ef = Math.max(
      1.3,
      r.ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    );
    r.due = Date.now() + r.interval * DAY;
  }
  r.lastReview = Date.now();
  return r;
}

/* ============================================================
   Thẻ có đến hạn không?
   ============================================================ */
export function isDue(rec) {
  if (!rec || !rec.due) return true;
  return Date.now() >= rec.due;
}

/* ============================================================
   Độ thành thạo 0..100
   ============================================================ */
export function mastery(rec) {
  if (!rec) return 0;
  if (rec.reps === 0) return 0;
  return Math.min(100, rec.reps * 15 + (rec.streak || 0) * 5);
}

/* ============================================================
   Thống kê tổng quan
   ============================================================ */
export function stats(records, elements) {
  let mastered = 0, learning = 0, fresh = 0, due = 0;
  elements.forEach((e) => {
    const r = records[e.atomicNumber];
    if (!r) fresh++;
    else {
      const m = mastery(r);
      if (m >= 70) mastered++;
      else learning++;
      if (isDue(r)) due++;
    }
  });
  return { mastered, learning, fresh, due, total: elements.length };
}

/* ============================================================
   Chọn thẻ tiếp theo để học
   ============================================================ */
export function pickNext(elements, records, lastZ) {
  const dueList = [];
  const freshList = [];
  const learningList = [];

  elements.forEach((e) => {
    if (e.atomicNumber === lastZ) return;
    const r = records[e.atomicNumber];
    if (!r) freshList.push(e);
    else if (isDue(r)) dueList.push(e);
    else if (mastery(r) < 70) learningList.push(e);
  });

  const pool =
    dueList.length > 0
      ? dueList
      : freshList.length > 0
      ? freshList
      : learningList.length > 0
      ? learningList
      : elements;

  return pool[Math.floor(Math.random() * pool.length)];
}

/* ============================================================
   Đếm số thẻ đến hạn
   - Nếu truyền records → dùng luôn
   - Nếu không → tự đọc từ localStorage key 'cs-srs'
   ============================================================ */
export function dueCount(records) {
  let data = records;
  if (!data) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = {};
    }
  }
  if (!data || typeof data !== 'object') return 0;
  const now = Date.now();
  let count = 0;
  for (const key of Object.keys(data)) {
    const r = data[key];
    if (r && r.due && r.due <= now) count++;
  }
  return count;
}