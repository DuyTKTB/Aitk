/* ============================================================
   flashcardStore.js — TRẠNG THÁI GHI NHỚ THEO TỪNG CÂU (thẻ ghi nhớ)
   ------------------------------------------------------------
   Học sinh tự đánh giá 3 mức: chưa nhớ / nhớ một phần / nhớ tốt.
   Mỗi mức có chu kỳ ôn riêng, tăng dần khi nhớ tốt (kiểu Leitner có
   kiểm soát thời gian), giảm ngay về 1 ngày khi "chưa nhớ".

   Lưu theo tài khoản trên thiết bị (cùng lý do với roadmapStore:
   app đăng nhập Firebase, chưa có session Supabase để ghi bảng RLS).
   Không đụng tới điểm XP / điểm thành thạo của Lộ trình.
   ============================================================ */

export const DAY = 86400000;
const VERSION = 1;
const MAX_CARDS = 600;
const EVT = 'cs-flashcards';

export const LEVELS = {
  1: { key: 1, label: 'Chưa nhớ', short: 'Chưa nhớ', days: 1, tone: 'err' },
  2: { key: 2, label: 'Nhớ một phần', short: 'Một phần', days: 3, tone: 'warn' },
  3: { key: 3, label: 'Nhớ tốt', short: 'Nhớ tốt', days: 7, tone: 'ok' },
};

const keyOf = (uid) => `cs-flashcards-v${VERSION}:${uid || 'guest'}`;

const empty = () => ({ version: VERSION, cards: {} });

export function readCards(uid) {
  try {
    const raw = localStorage.getItem(keyOf(uid));
    if (!raw) return empty();
    const box = JSON.parse(raw);
    if (!box || typeof box !== 'object' || typeof box.cards !== 'object' || !box.cards) return empty();
    return { version: VERSION, cards: box.cards };
  } catch {
    return empty();
  }
}

function write(uid, cards) {
  /* Cắt bớt thẻ cũ nhất nếu vượt ngưỡng, tránh phình localStorage */
  const entries = Object.entries(cards);
  let keep = cards;
  if (entries.length > MAX_CARDS) {
    const sorted = entries.sort((a, b) => (b[1].lastAt || 0) - (a[1].lastAt || 0)).slice(0, MAX_CARDS);
    keep = Object.fromEntries(sorted);
  }
  let written = false;
  try {
    localStorage.setItem(keyOf(uid), JSON.stringify({ version: VERSION, cards: keep }));
    written = true;
  } catch (e) {
    console.warn('[flashcardStore] không lưu được:', e && e.message);
  }
  if (written) {
    try { window.dispatchEvent(new Event(EVT)); } catch { /* test */ }
  }
}

/* Chu kỳ mới: nhớ tốt thì giãn ra, chưa nhớ thì về 1 ngày */
export function nextInterval(prev, level) {
  if (level === 1) return 1;
  if (level === 2) return 3;
  const base = Number(prev) > 0 ? Number(prev) : 0;
  if (!base) return 7;                                   // lần đầu nhớ tốt
  return Math.min(60, Math.max(7, Math.round(base * 2.2)));
}

/** Ghi 1 lượt tự đánh giá cho 1 câu */
export function rateCard(uid, qid, level, now = Date.now(), topicId = null) {
  if (!qid || !LEVELS[level]) return null;
  const all = readCards(uid);
  const prev = all.cards[qid] || { interval: 0, seen: 0 };
  const interval = nextInterval(prev.interval, level);
  const rec = {
    qid: String(qid),
    topicId: topicId || prev.topicId || null,
    level,
    interval,
    seen: (prev.seen || 0) + 1,
    lastAt: now,
    dueAt: now + interval * DAY,
  };
  all.cards[qid] = rec;
  write(uid, all.cards);
  return rec;
}

/** Ghi cả phiên một lần (ít ghi localStorage hơn) */
export function rateMany(uid, ratings = [], now = Date.now()) {
  const all = readCards(uid);
  const out = [];
  ratings.forEach(({ qid, level, topicId }) => {
    if (!qid || !LEVELS[level]) return;
    const prev = all.cards[qid] || { interval: 0, seen: 0 };
    const interval = nextInterval(prev.interval, level);
    const rec = {
      qid: String(qid),
      topicId: topicId || prev.topicId || null,
      level,
      interval,
      seen: (prev.seen || 0) + 1,
      lastAt: now,
      dueAt: now + interval * DAY,
    };
    all.cards[qid] = rec;
    out.push(rec);
  });
  write(uid, all.cards);
  return out;
}

export function dueCards(uid, { now = Date.now(), limit = 100, topicId = null } = {}) {
  const all = readCards(uid);
  return Object.values(all.cards)
    .filter((c) => (c.dueAt || 0) <= now)
    .filter((c) => !topicId || c.topicId === topicId)
    .sort((a, b) => (a.dueAt || 0) - (b.dueAt || 0))
    .slice(0, limit);
}

export function cardOf(uid, qid) {
  return readCards(uid).cards[qid] || null;
}

export function cardStats(uid, now = Date.now()) {
  const all = readCards(uid);
  const list = Object.values(all.cards);
  const out = { total: list.length, due: 0, byLevel: { 1: 0, 2: 0, 3: 0 } };
  list.forEach((c) => {
    if ((c.dueAt || 0) <= now) out.due += 1;
    if (out.byLevel[c.level] !== undefined) out.byLevel[c.level] += 1;
  });
  return out;
}

export function subscribeCards(cb) {
  if (typeof window === 'undefined') return () => {};
  const onEvt = () => cb();
  window.addEventListener(EVT, onEvt);
  return () => window.removeEventListener(EVT, onEvt);
}
