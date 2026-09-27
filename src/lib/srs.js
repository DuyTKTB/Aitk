// ============================================================
//  SPACED REPETITION SYSTEM — SM-2 (thuật toán Anki)
//  Mỗi nguyên tố có record: ef, interval, reps, due, lapses
// ============================================================

const DAY = 86400000;

// Record mặc định cho nguyên tố chưa học
export const freshRecord = () => ({
  ef: 2.5,       // easiness factor (1.3 - 2.5)
  interval: 0,   // khoảng cách (ngày)
  reps: 0,       // số lần đúng liên tiếp
  due: 0,        // timestamp đến hạn (0 = chưa học)
  lapses: 0,     // số lần sai
});

/**
 * Review một nguyên tố.
 * @param {object} rec - record hiện tại
 * @param {number} q - chất lượng 0-5:
 *   0-2 = sai (cần học lại)
 *   3 = đúng nhưng khó
 *   4 = đúng
 *   5 = đúng dễ
 * @returns {object} record mới
 */
export function review(rec, q) {
  const r = { ...rec };

  if (q < 3) {
    // Sai → reset
    r.lapses++;
    r.reps = 0;
    r.interval = 1;
    r.ef = Math.max(1.3, r.ef - 0.2);
    r.due = Date.now() + DAY;
  } else {
    r.reps++;
    if (r.reps === 1) r.interval = 1;
    else if (r.reps === 2) r.interval = 6;
    else r.interval = Math.round(r.interval * r.ef);

    r.ef = Math.max(1.3, r.ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
    r.due = Date.now() + r.interval * DAY;
  }

  return r;
}

/**
 * Độ "thuần thục" của một record (0-100).
 * Dùng để vẽ progress bar.
 */
export function mastery(rec) {
  if (!rec || rec.reps === 0) return 0;
  // Kết hợp reps và interval
  const repScore = Math.min(rec.reps / 5, 1) * 60;
  const intScore = Math.min(rec.interval / 30, 1) * 40;
  return Math.round(repScore + intScore);
}

/**
 * Có đến hạn ôn không?
 */
export function isDue(rec) {
  if (!rec || rec.reps === 0) return true; // chưa học → cần học
  return Date.now() >= rec.due;
}

/**
 * Đếm số nguyên tố đến hạn.
 */
export function dueCount(records, elements) {
  let n = 0;
  for (const e of elements) {
    const rec = records[e.atomicNumber];
    if (isDue(rec)) n++;
  }
  return n;
}

/**
 * Chọn nguyên tố nên hỏi tiếp theo (weighted random).
 * Ưu tiên:
 *   1. Đến hạn + hay sai (lapses cao)
 *   2. Đến hạn + chưa học
 *   3. Đã học + lâu không gặp
 */
export function pickNext(elements, records, exclude = null) {
  const now = Date.now();
  const candidates = elements.filter((e) => {
    if (e.atomicNumber === exclude) return false;
    const rec = records[e.atomicNumber];
    return isDue(rec);
  });

  if (candidates.length === 0) {
    // Không còn đến hạn → random trong tất cả (trừ exclude)
    const all = elements.filter((e) => e.atomicNumber !== exclude);
    return all[Math.floor(Math.random() * all.length)];
  }

  // Weighted: lapses cao + chưa học + interval ngắn → ưu tiên
  const scored = candidates.map((e) => {
    const rec = records[e.atomicNumber] || freshRecord();
    let score = 1;
    score += rec.lapses * 3;             // hay sai → ưu tiên
    if (rec.reps === 0) score += 5;      // chưa học → ưu tiên
    score += Math.min(rec.interval / 10, 3);
    // Ngẫu nhiên nhẹ để không lặp pattern
    score += Math.random() * 2;
    return { e, score };
  });

  scored.sort((a, b) => b.score - a.score);
  // Chọn top 5 rồi random
  const top = scored.slice(0, 5);
  return top[Math.floor(Math.random() * top.length)].e;
}

/**
 * Thống kê tổng quan.
 */
export function stats(records, elements) {
  let mastered = 0, learning = 0, fresh = 0, due = 0;
  for (const e of elements) {
    const rec = records[e.atomicNumber];
    if (!rec || rec.reps === 0) fresh++;
    else if (rec.interval >= 21) mastered++;
    else learning++;
    if (isDue(rec)) due++;
  }
  return { mastered, learning, fresh, due, total: elements.length };
}