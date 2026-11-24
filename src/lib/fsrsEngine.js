/* ============================================================
   fsrsEngine.js — Thuật toán Ghi nhớ Ngắt quãng FSRS v4.5
   Lấy cảm hứng trực tiếp từ open-spaced-repetition/ts-fsrs (Anki 33K★):
     • Stability S (ngày): thời gian để xác suất nhớ giảm từ 100% xuống 90%
     • Difficulty D ∈ [1, 10]: độ khó cá nhân hóa cho từng thẻ/câu hỏi
     • Retrievability R(t) = (1 + FACTOR * t / S)^DECAY (đường cong quên)
     • Rating: 1=Again (Chưa nhớ), 2=Hard (Khó/Một phần), 3=Good (Nhớ tốt), 4=Easy (Rất dễ)
   Thuần hàm, 0 phụ thuộc ngoài, chuẩn học thuật.
   ============================================================ */

export const FSRS_DAY_MS = 86400000;

// Bộ trọng số mặc định FSRS-4.5 (open-spaced-repetition)
const W = [
  0.4872, 1.4003, 3.7145, 13.8206, // w0..w3: initial stability cho rating 1..4
  5.1618, 1.2298, 0.8975, 0.031,   // w4..w7: difficulty params
  1.6474, 0.1367, 1.0461,          // w8..w10: stability recall params
  2.1072, 0.0793, 0.3246, 1.587,   // w11..w14: stability forget params
  0.2272, 2.8755,                  // w15 (hard penalty), w16 (easy bonus)
];

const DECAY = -0.5;
const FACTOR = 19 / 81; // Đảm bảo R(S, S) = 0.90 chính xác

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function round2(v) {
  return Math.round(v * 100) / 100;
}

/**
 * Xác suất còn nhớ R(t) ∈ [0, 1] sau `elapsedDays` ngày với độ bền `stability`.
 */
export function fsrsRetrievability(elapsedDays, stability) {
  const s = Math.max(0.1, Number(stability) || 0.1);
  const t = Math.max(0, Number(elapsedDays) || 0);
  return Math.pow(1 + (FACTOR * t) / s, DECAY);
}

/**
 * Tính khoảng ngày ôn tiếp theo để giữ mục tiêu ghi nhớ `desiredRetention` (mặc định 0.90 = 90%).
 */
export function fsrsNextIntervalDays(stability, desiredRetention = 0.9, maxDays = 180) {
  const r = clamp(desiredRetention, 0.7, 0.97);
  const s = Math.max(0.1, Number(stability) || 0.1);
  const raw = (s / FACTOR) * (Math.pow(r, 1 / DECAY) - 1);
  return Math.max(1, Math.min(maxDays, Math.round(raw)));
}

/**
 * Cập nhật trạng thái FSRS (stability, difficulty, interval, dueAt, lapses) sau 1 lần ôn.
 * @param {object|null} prev - { stability, difficulty, lastAt, reps, lapses }
 * @param {1|2|3|4} rating - 1=Again, 2=Hard, 3=Good, 4=Easy
 * @param {number} now - timestamp ms
 * @param {number} desiredRetention - mặc định 0.90
 */
export function fsrsSchedule(prev, rating, now = Date.now(), desiredRetention = 0.9) {
  const g = clamp(Math.round(Number(rating) || 3), 1, 4);
  const isNew = !prev || !(Number(prev.stability) > 0);

  let stability;
  let difficulty;
  let reps = Number(prev?.reps || 0) + 1;
  let lapses = Number(prev?.lapses || 0);

  if (isNew) {
    stability = W[g - 1];
    difficulty = clamp(W[4] - Math.exp(W[5] * (g - 1)) + 1, 1, 10);
    if (g === 1) lapses += 1;
  } else {
    const prevS = Math.max(0.1, Number(prev.stability));
    const prevD = clamp(Number(prev.difficulty) || 5, 1, 10);
    const elapsedDays = prev.lastAt ? Math.max(0, (now - prev.lastAt) / FSRS_DAY_MS) : 0;
    const R = fsrsRetrievability(elapsedDays, prevS);

    // Cập nhật độ khó D có mean-reversion
    const d0Easy = clamp(W[4] - Math.exp(W[5] * 2) + 1, 1, 10);
    const nextD = prevD - W[6] * (g - 3);
    difficulty = clamp(W[7] * d0Easy + (1 - W[7]) * nextD, 1, 10);

    if (g === 1) {
      // Quên -> giảm độ bền theo công thức forget của FSRS
      lapses += 1;
      stability = Math.max(
        0.2,
        Math.min(
          prevS,
          W[11] * Math.pow(difficulty, -W[12]) * (Math.pow(prevS + 1, W[13]) - 1) * Math.exp(W[14] * (1 - R))
        )
      );
    } else {
      // Nhớ -> tăng độ bền theo công thức recall của FSRS
      const hardPenalty = g === 2 ? W[15] : 1;
      const easyBonus = g === 4 ? W[16] : 1;
      const inc =
        Math.exp(W[8]) *
        (11 - difficulty) *
        Math.pow(prevS, -W[9]) *
        (Math.exp(W[10] * (1 - R)) - 1) *
        hardPenalty *
        easyBonus;
      stability = prevS * (1 + inc);
    }
  }

  const interval = g === 1 ? 1 : fsrsNextIntervalDays(stability, desiredRetention);
  return {
    stability: round2(stability),
    difficulty: round2(difficulty),
    interval,
    reps,
    lapses,
    lastAt: now,
    dueAt: now + interval * FSRS_DAY_MS,
    retrievability: 1,
  };
}

/**
 * Dự đoán % khả năng còn nhớ hiện tại của 1 thẻ FSRS (0..100).
 */
export function predictCardRetentionPct(card, now = Date.now()) {
  if (!card || !card.lastAt) return 0;
  const s = Number(card.stability) > 0 ? Number(card.stability) : Math.max(1, Number(card.interval) || 1);
  const elapsedDays = Math.max(0, (now - card.lastAt) / FSRS_DAY_MS);
  return Math.round(fsrsRetrievability(elapsedDays, s) * 100);
}
