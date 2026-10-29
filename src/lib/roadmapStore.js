/* ============================================================
   roadmapStore.js — PHIÊN LUYỆN + MỤC TIÊU TUẦN (lưu trên thiết bị)
   ------------------------------------------------------------
   Vì sao lưu localStorage chứ không thêm bảng Supabase/Firestore:
     • App đăng nhập bằng Firebase, KHÔNG có session Supabase
       (xem hooks/useAuth.jsx) nên ghi vào các bảng có RLS
       auth.uid() = user_id sẽ bị từ chối.
     • Firestore rules chỉ mở /users/{uid} và 2 subcollection
       friends/friendRequests → thêm subcollection mới phải deploy
       rules. Không tự nới rule để chạy tính năng.
   => Phiên luyện lưu theo TÀI KHOẢN trên thiết bị này, cùng cơ chế
      với cs-xp / cs-srs / cs-quiz-stats đang dùng. Dữ liệu bài thi
      của lớp (Firestore submissions) và bài luyện trên Supabase vẫn
      được đọc và gộp vào cùng một bộ bằng chứng.

   Dữ liệu ở đây KHÔNG phải điểm thưởng, KHÔNG ảnh hưởng XP.
   ============================================================ */

import { recordDailyStreak } from '../hooks.js';

const VERSION = 1;
const MAX_SESSIONS = 300;
const EVT = 'cs-roadmap';

const keyOf = (uid) => `cs-roadmap-v${VERSION}:${uid || 'guest'}`;

const empty = () => ({ version: VERSION, sessions: [], goal: null });

export function readStore(uid) {
  try {
    const raw = localStorage.getItem(keyOf(uid));
    if (!raw) return empty();
    const box = JSON.parse(raw);
    if (!box || typeof box !== 'object') return empty();
    return {
      version: VERSION,
      sessions: Array.isArray(box.sessions) ? box.sessions.filter((s) => s && s.topicId) : [],
      goal: Number.isFinite(box.goal) && box.goal > 0 ? Math.round(box.goal) : null,
    };
  } catch {
    return empty();
  }
}

function writeStore(uid, next) {
  try {
    localStorage.setItem(keyOf(uid), JSON.stringify(next));
  } catch (e) {
    /* Hết dung lượng / chế độ riêng tư: bỏ phiên cũ nhất rồi thử lại 1 lần */
    try {
      const trimmed = { ...next, sessions: next.sessions.slice(0, 50) };
      localStorage.setItem(keyOf(uid), JSON.stringify(trimmed));
    } catch {
      console.warn('[roadmapStore] không lưu được:', e && e.message);
    }
  }
  try { window.dispatchEvent(new Event(EVT)); } catch { /* SSR/test */ }
}

/* ============================================================
   Ghi 1 phiên luyện đã hoàn tất
   session = { topicId, total, correct, durationMs, answers:[{qid, ok}] }
   ============================================================ */
export function saveSession(uid, session) {
  if (!session || !session.topicId || !session.total) return null;
  const store = readStore(uid);
  const total = Math.max(0, Math.round(Number(session.total) || 0));
  if (!total) return null;
  const correct = Math.min(total, Math.max(0, Math.round(Number(session.correct) || 0)));
  const rec = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    topicId: String(session.topicId),
    at: Date.now(),
    total,
    correct,
    durationMs: Math.max(0, Math.round(Number(session.durationMs) || 0)),
    source: session.source || 'practice',
    answers: (session.answers || []).map((a) => ({ qid: String(a.qid || ''), ok: a.ok === true })),
  };
  const sessions = [rec, ...store.sessions].slice(0, MAX_SESSIONS);
  writeStore(uid, { ...store, sessions });
  try {
    recordDailyStreak();
    const curFood = Number(localStorage.getItem('cs-pet-food')) || 0;
    localStorage.setItem('cs-pet-food', String(curFood + 1));
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('cs-ls', { detail: 'cs-pet-food' }));
    }
  } catch { /* ignore */ }
  return rec;
}

export function setWeeklyGoal(uid, goal) {
  const store = readStore(uid);
  const g = Number(goal);
  writeStore(uid, { ...store, goal: Number.isFinite(g) && g > 0 ? Math.round(g) : null });
}

export function clearSessions(uid) {
  const store = readStore(uid);
  writeStore(uid, { ...store, sessions: [] });
}

/* ============================================================
   Phiên → bằng chứng cho engine
   ============================================================ */
export function sessionsToEvents(sessions = []) {
  const out = [];
  sessions.forEach((s) => {
    const at = Number(s.at) || 0;
    (s.answers || []).forEach((a) => {
      out.push({
        qid: a.qid || null,
        topicId: s.topicId,
        correct: a.ok === true,
        at,
        source: s.source || 'practice',
        sessionId: s.id,
      });
    });
  });
  return out;
}

/* ============================================================
   Theo dõi thay đổi trong cùng tab (dùng ở trang Lộ trình)
   ============================================================ */
export function subscribeRoadmap(cb) {
  if (typeof window === 'undefined') return () => {};
  const onEvt = () => cb();
  const onStorage = (e) => { if (e.key && e.key.indexOf('cs-roadmap-v') === 0) cb(); };
  window.addEventListener(EVT, onEvt);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(EVT, onEvt);
    window.removeEventListener('storage', onStorage);
  };
}
