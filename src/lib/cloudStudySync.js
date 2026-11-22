/* ============================================================================
   cloudStudySync.js — Đồng bộ TOÀN DIỆN dữ liệu học tập qua Firebase Firestore
   ----------------------------------------------------------------------------
   Giải quyết triệt để tình trạng lệch dữ liệu khi đăng nhập cùng tài khoản
   giữa Điện thoại & Máy tính:
     • Chuỗi ngày học (cs-streak-v2, cs-streak, khiên đóng băng, thẻ bù, mốc)
     • XP, Thống kê Quiz, Tiến độ 7 ngày (cs-progress-v1), Gamification, Pet Food
     • Sổ tay lỗi sai & Spaced Repetition (cs-srs-v2, cs-wrong-bank, notebook)
     • Mục tiêu & Nguyện vọng ĐH (elec-aspirations-v2, cs-aspirations-v1)
     • Lịch sử phòng thi ảo, đề yêu thích, Lộ trình học tập (cs-roadmap-v1)
     • Trợ lý nổi Companion ("Lịch sử đã hỏi" Trang chủ), Bookmarks & Cài đặt AI
     • Tombstones xóa chat (aiDeletedIds / aiClearAllAt) & Backup chat dự phòng
   Ghi an toàn vào users/{uid}.studyState (khớp 100% firestore.rules isOwner).
   ============================================================================ */
import { auth, db, doc, getDoc, setDoc, onSnapshot } from './firebase.js';

const STUDY_OWNER_KEY = 'cs-study-owner';
const SYNC_META_KEY = 'cs-study-sync-meta';
export const CLOUD_SYNC_EVENT = 'cs-cloud-sync-update';
export const COMPANION_SESSIONS_EVENT = 'cs-companion-sessions-update';

const p2 = (n) => String(n).padStart(2, '0');
const dayKeyLocal = (t = Date.now()) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
};

const liveStreakVal = (s) => {
  if (!s || typeof s !== 'object') return 0;
  const today = dayKeyLocal();
  const yesterday = dayKeyLocal(Date.now() - 864e5);
  return (s.last === today || s.last === yesterday) ? (Number(s.n) || 0) : 0;
};

function readLS(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    try { return JSON.parse(raw); } catch { return raw; }
  } catch {
    return fallback;
  }
}

function writeLS(key, value) {
  try {
    const nextRaw = typeof value === 'string' && !key.endsWith('-v2') && key !== 'cs-ai-grade' && key !== 'cs-ai-mode' && key !== 'cs-grade-adm'
      ? value
      : JSON.stringify(value);
    const prevRaw = localStorage.getItem(key);
    if (prevRaw === nextRaw) return false;
    localStorage.setItem(key, nextRaw);
    try { window.dispatchEvent(new CustomEvent('cs-ls', { detail: key })); } catch {}
    return true;
  } catch {
    return false;
  }
}

function writeRawJsonIfChanged(key, obj) {
  try {
    const nextRaw = JSON.stringify(obj);
    if (localStorage.getItem(key) === nextRaw) return false;
    localStorage.setItem(key, nextRaw);
    try { window.dispatchEvent(new CustomEvent('cs-ls', { detail: key })); } catch {}
    return true;
  } catch {
    return false;
  }
}

export function sanitizeForCloud(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
  if (typeof val === 'string' || typeof val === 'boolean') return val;
  if (Array.isArray(val)) return val.map((item) => sanitizeForCloud(item));
  if (typeof val === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(val)) {
      if (v === undefined || typeof v === 'function' || typeof v === 'symbol') continue;
      out[k] = sanitizeForCloud(v);
    }
    return out;
  }
  return String(val);
}

const SHARED_ACCOUNT_KEYS = [
  'cs-streak-v2',
  'cs-streak',
  'cs-streak-freeze-count',
  'cs-streak-passes',
  'cs-streak-claimed-milestones',
  'cs-xp',
  'cs-pet-food',
  'cs-progress-v1',
  'cs-quiz-stats',
  'cs-wrong-bank',
  'cs-srs-v2',
  'cs-srs',
  'cs-grade-v2',
  'cs-grade-adm',
  'cs-ai-bookmarks',
  'cs-ai-grade',
  'cs-ai-mode',
  'cs-ai-deepthink',
  'cs-ai-chats',
  'cs-ai-active',
  'cs-ai-pinned',
  'cs-ai-chats-owner',
];

function getSyncMeta() {
  return readLS(SYNC_META_KEY, {}) || {};
}

function setSyncMeta(patch = {}) {
  const cur = getSyncMeta();
  try {
    localStorage.setItem(SYNC_META_KEY, JSON.stringify({ ...cur, ...patch }));
  } catch {}
}

/**
 * Đảm bảo dữ liệu dùng chung không bị trộn chéo giữa 2 tài khoản khác nhau trên cùng máy tính.
 */
export function ensureStudyOwner(uid) {
  if (typeof window === 'undefined' || !uid) return false;
  try {
    const prevOwner = localStorage.getItem(STUDY_OWNER_KEY) || '';
    if (prevOwner && prevOwner !== uid) {
      SHARED_ACCOUNT_KEYS.forEach((k) => {
        try { localStorage.removeItem(k); } catch {}
      });
    }
    if (prevOwner !== uid) {
      localStorage.setItem(STUDY_OWNER_KEY, uid);
      return prevOwner !== '';
    }
  } catch {}
  return false;
}

/* ---------- Tombstones xóa Chat AI (ngăn máy kia hồi sinh chat đã xóa) ---------- */
export function getDeletedChatTombstones(uid) {
  if (!uid) return { ids: {}, clearAllAt: 0 };
  const raw = readLS(`cs-ai-deleted:${uid}`, null);
  if (raw && typeof raw === 'object') {
    return {
      ids: raw.ids && typeof raw.ids === 'object' ? raw.ids : {},
      clearAllAt: Number(raw.clearAllAt) || 0,
    };
  }
  return { ids: {}, clearAllAt: 0 };
}

export function isChatDeletedByTombstone(chat, tombstones) {
  if (!chat || !chat.id) return false;
  const updatedAt = Number(chat.updatedAt || (chat.updated_at ? new Date(chat.updated_at).getTime() : 0) || chat.createdAt || 0);
  const clearAllAt = Number(tombstones?.clearAllAt) || 0;
  if (clearAllAt > 0 && updatedAt <= clearAllAt) return true;
  const delAt = Number(tombstones?.ids?.[String(chat.id)]) || 0;
  if (delAt > 0 && updatedAt <= delAt) return true;
  return false;
}

export function recordLocalChatDeleted(uid, chatId, ts = Date.now()) {
  if (!uid || !chatId) return;
  const cur = getDeletedChatTombstones(uid);
  const nextIds = { ...cur.ids, [String(chatId)]: ts };
  // Giữ 80 ID xóa gần nhất để giữ dung lượng nhỏ gọn
  const sorted = Object.entries(nextIds).sort((a, b) => Number(b[1]) - Number(a[1])).slice(0, 80);
  writeRawJsonIfChanged(`cs-ai-deleted:${uid}`, {
    ids: Object.fromEntries(sorted),
    clearAllAt: cur.clearAllAt || 0,
  });
  schedulePushCloudStudyState(uid, 400);
}

export function recordLocalAllChatsCleared(uid, ts = Date.now()) {
  if (!uid) return;
  writeRawJsonIfChanged(`cs-ai-deleted:${uid}`, {
    ids: {},
    clearAllAt: ts,
  });
  schedulePushCloudStudyState(uid, 300);
}

/* ---------- Thu gọn backup Chat AI dự phòng (<24KB) ---------- */
function compactChatsForBackup(chats = []) {
  if (!Array.isArray(chats)) return [];
  return [...chats]
    .filter((c) => c && c.id)
    .sort((a, b) => (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0))
    .slice(0, 15)
    .map((c) => ({
      id: String(c.id),
      title: String(c.title || 'Trò chuyện mới').slice(0, 80),
      pinned: Boolean(c.pinned),
      createdAt: Number(c.createdAt) || Date.now(),
      updatedAt: Number(c.updatedAt) || Date.now(),
      messages: (Array.isArray(c.messages) ? c.messages : []).slice(-12).map((m) => ({
        role: m?.role === 'model' ? 'model' : 'user',
        text: typeof m?.text === 'string' ? m.text.slice(0, 900) : '',
        ts: Number(m?.ts) || Number(c.updatedAt) || Date.now(),
      })),
    }));
}

/* ---------- Đọc toàn bộ snapshot hiện tại từ LocalStorage ---------- */
export function collectLocalStudyState(uid) {
  if (!uid || typeof window === 'undefined') return null;
  const meta = getSyncMeta();

  const sV2 = readLS('cs-streak-v2', { last: '', n: 0, total: 0 });
  const sV1 = readLS('cs-streak', { last: '', n: 0, total: 0 });
  const bestStreak = liveStreakVal(sV2) >= liveStreakVal(sV1)
    ? {
        last: sV2?.last || sV1?.last || '',
        n: Math.max(Number(sV2?.n) || 0, liveStreakVal(sV2) === liveStreakVal(sV1) ? (Number(sV1?.n) || 0) : 0),
        total: Math.max(Number(sV2?.total) || 0, Number(sV1?.total) || 0),
      }
    : {
        last: sV1?.last || '',
        n: Number(sV1?.n) || 0,
        total: Math.max(Number(sV2?.total) || 0, Number(sV1?.total) || 0),
      };

  const freezeRaw = localStorage.getItem('cs-streak-freeze-count');
  const freezeCount = freezeRaw !== null && Number.isFinite(Number(freezeRaw)) ? Math.max(0, Number(freezeRaw)) : 1;

  const passes = readLS('cs-streak-passes', {}) || {};
  const claimedMilestones = Array.isArray(readLS('cs-streak-claimed-milestones', []))
    ? readLS('cs-streak-claimed-milestones', [])
    : [];

  const xp = Math.max(0, Number(readLS('cs-xp', 0)) || 0);
  const petFood = Math.max(0, Number(readLS('cs-pet-food', 0)) || 0);
  const quizStats = readLS('cs-quiz-stats', { totalCorrect: 0, totalWrong: 0 }) || { totalCorrect: 0, totalWrong: 0 };

  const progressRaw = readLS('cs-progress-v1', { goal: 10, days: {}, recent: [] }) || {};
  const dayKeys = Object.keys(progressRaw.days || {}).sort().slice(-120);
  const prunedDays = {};
  dayKeys.forEach((k) => { prunedDays[k] = Number(progressRaw.days[k]) || 0; });
  const progress = {
    goal: Number(progressRaw.goal) || 10,
    days: prunedDays,
    recent: Array.isArray(progressRaw.recent) ? progressRaw.recent.slice(0, 20) : [],
  };

  const wrongBankRaw = readLS('cs-wrong-bank', []);
  const wrongBank = Array.isArray(wrongBankRaw) ? wrongBankRaw.slice(0, 60) : [];

  const wrongNotebookRaw = readLS(`cs-wrong-notebook:${uid}`, []);
  const wrongNotebook = (Array.isArray(wrongNotebookRaw) ? wrongNotebookRaw : []).slice(0, 50).map((w) => ({
    ...w,
    question: w?.question ? {
      id: w.question.id,
      content: String(w.question.content || '').slice(0, 400),
      explanation: String(w.question.explanation || '').slice(0, 400),
      difficulty: w.question.difficulty || 'medium',
      topic_id: w.question.topic_id || 'hoa',
      subject: w.question.subject || 'hoa',
      answers: Array.isArray(w.question.answers) ? w.question.answers.slice(0, 6) : [],
    } : undefined,
  }));

  const srsRaw = readLS('cs-srs-v2', {}) || {};
  const srsEntries = Object.entries(srsRaw).slice(0, 150);
  const srs = Object.fromEntries(srsEntries);

  const gamiAll = readLS('gamification-v1', {}) || {};
  const gamification = gamiAll[uid] || null;

  const aspV2 = readLS(`elec-aspirations-v2:${uid}`, null);
  const aspV1 = readLS(`cs-aspirations-v1:${uid}`, null);

  const examHistRaw = readLS(`elec_exam_history_v1_${uid}`, []);
  const examHistory = (Array.isArray(examHistRaw) ? examHistRaw : []).slice(0, 35);
  const favExamsRaw = readLS(`elec_fav_exams_v1_${uid}`, []);
  const favExams = Array.isArray(favExamsRaw) ? favExamsRaw.slice(0, 60) : [];

  const rmRaw = readLS(`cs-roadmap-v1:${uid}`, null);
  const roadmap = rmRaw && typeof rmRaw === 'object'
    ? { version: rmRaw.version || 1, goal: rmRaw.goal || null, sessions: Array.isArray(rmRaw.sessions) ? rmRaw.sessions.slice(0, 50) : [] }
    : null;
  const roadmapCheckpoints = readLS(`cs-roadmap-checkpoints-v1:${uid}`, null);

  const compRaw = readLS(`cs-elec-companion-sessions:${uid}`, []);
  const companionSessions = (Array.isArray(compRaw) ? compRaw : []).slice(0, 12).map((s) => ({
    id: s?.id || `comp_${Date.now()}`,
    title: String(s?.title || 'Phiên hỏi đáp AI').slice(0, 90),
    updatedAt: Number(s?.updatedAt) || Number(s?.createdAt) || Date.now(),
    createdAt: Number(s?.createdAt) || Date.now(),
    messages: (Array.isArray(s?.messages) ? s.messages : []).slice(-16).map((m) => ({
      role: m?.role || 'user',
      text: typeof m?.text === 'string' ? m.text.slice(0, 800) : '',
      ts: Number(m?.ts) || Date.now(),
    })),
  }));

  const bmRaw = readLS('cs-ai-bookmarks', []);
  const aiBookmarks = (Array.isArray(bmRaw) ? bmRaw : []).slice(0, 30).map((b) => ({
    ...b,
    text: typeof b?.text === 'string' ? b.text.slice(0, 1200) : '',
  }));

  const scopedChats = readLS(`cs-ai-chats:${uid}`, []);
  const aiChatsBackup = compactChatsForBackup(scopedChats);
  const tombstones = getDeletedChatTombstones(uid);

  const aiPrefs = {
    grade: String(readLS('cs-ai-grade', 'Tự động') || 'Tự động'),
    mode: String(readLS('cs-ai-mode', 'auto') || 'auto'),
    deepThink: Boolean(readLS('cs-ai-deepthink', false)),
    gradeAdm: readLS('cs-grade-adm', null),
    gradeV2: readLS('cs-grade-v2', null),
    theme: String(readLS('cs-theme-v2', 'light') || 'light'),
    updatedAt: Number(meta.prefsUpdatedAt) || 0,
  };

  return sanitizeForCloud({
    version: 1,
    updatedAt: Date.now(),
    streak: {
      ...bestStreak,
      freezeCount,
      passes,
      claimedMilestones,
      updatedAt: Number(meta.streakUpdatedAt) || 0,
    },
    xp,
    petFood,
    quizStats,
    progress,
    wrongBank,
    wrongNotebook,
    srs,
    gamification,
    aspV2,
    aspV1,
    examHistory,
    favExams,
    roadmap,
    roadmapCheckpoints,
    companionSessions,
    aiBookmarks,
    aiChatsBackup,
    aiDeletedIds: tombstones.ids,
    aiClearAllAt: tombstones.clearAllAt,
    aiPrefs,
  });
}

/* ---------- Hợp nhất thông minh giữa Cloud và Local ---------- */
function mergeStreakObj(cloud = {}, local = {}) {
  const cLive = liveStreakVal(cloud);
  const lLive = liveStreakVal(local);
  const cN = Number(cloud.n) || 0;
  const lN = Number(local.n) || 0;
  const cLast = String(cloud.last || '');
  const lLast = String(local.last || '');

  let chosenLast = cLast;
  let chosenN = cN;

  if (cLive > lLive) {
    chosenLast = cLast;
    chosenN = cN;
  } else if (lLive > cLive) {
    chosenLast = lLast;
    chosenN = lN;
  } else if (cLast !== lLast) {
    if (lLast > cLast) {
      chosenLast = lLast;
      chosenN = lN;
    } else {
      chosenLast = cLast;
      chosenN = cN;
    }
  } else {
    chosenLast = cLast || lLast;
    chosenN = Math.max(cN, lN);
  }

  const total = Math.max(Number(cloud.total) || 0, Number(local.total) || 0, chosenN);
  const cUpd = Number(cloud.updatedAt) || 0;
  const lUpd = Number(local.updatedAt) || 0;
  const freezeCount = cUpd >= lUpd && cloud.freezeCount !== undefined
    ? Number(cloud.freezeCount)
    : (local.freezeCount !== undefined ? Number(local.freezeCount) : Number(cloud.freezeCount ?? 1));

  const cPasses = cloud.passes || {};
  const lPasses = local.passes || {};
  const passKeys = new Set([...Object.keys(cPasses), ...Object.keys(lPasses)]);
  const passes = {};
  passKeys.forEach((k) => { passes[k] = Math.max(Number(cPasses[k]) || 0, Number(lPasses[k]) || 0); });

  const claimedMilestones = Array.from(new Set([
    ...(Array.isArray(cloud.claimedMilestones) ? cloud.claimedMilestones : []),
    ...(Array.isArray(local.claimedMilestones) ? local.claimedMilestones : []),
  ])).sort((a, b) => Number(a) - Number(b));

  return {
    last: chosenLast,
    n: chosenN,
    total,
    freezeCount: Number.isFinite(freezeCount) ? Math.max(0, freezeCount) : 1,
    passes,
    claimedMilestones,
    updatedAt: Math.max(cUpd, lUpd),
  };
}

function mergeByKeyList(arrA = [], arrB = [], getKey, getTime, limitN = 40) {
  const map = new Map();
  const apply = (item) => {
    if (!item) return;
    const k = getKey(item);
    if (!k) return;
    const prev = map.get(k);
    if (!prev || getTime(item) >= getTime(prev)) {
      map.set(k, item);
    }
  };
  (Array.isArray(arrA) ? arrA : []).forEach(apply);
  (Array.isArray(arrB) ? arrB : []).forEach(apply);
  return Array.from(map.values())
    .sort((a, b) => getTime(b) - getTime(a))
    .slice(0, limitN);
}

let isApplyingRemote = false;

export function applyMergedCloudStudyState(uid, cloudState) {
  if (!uid || !cloudState || typeof cloudState !== 'object' || typeof window === 'undefined') {
    return { changed: false, shouldPushBack: false };
  }
  ensureStudyOwner(uid);
  const local = collectLocalStudyState(uid);
  if (!local) return { changed: false, shouldPushBack: false };

  isApplyingRemote = true;
  let anyChanged = false;
  let shouldPushBack = false;

  try {
    // 1. Streak & shields
    const mStreak = mergeStreakObj(cloudState.streak, local.streak);
    const streakCore = { last: mStreak.last, n: mStreak.n, total: mStreak.total };
    if (writeRawJsonIfChanged('cs-streak-v2', streakCore)) anyChanged = true;
    if (writeRawJsonIfChanged('cs-streak', streakCore)) anyChanged = true;
    if (writeLS('cs-streak-freeze-count', String(mStreak.freezeCount))) anyChanged = true;
    if (writeRawJsonIfChanged('cs-streak-passes', mStreak.passes)) anyChanged = true;
    if (writeRawJsonIfChanged('cs-streak-claimed-milestones', mStreak.claimedMilestones)) anyChanged = true;
    if (local.streak.n > (Number(cloudState.streak?.n) || 0) || local.streak.total > (Number(cloudState.streak?.total) || 0)) {
      shouldPushBack = true;
    }

    // 2. XP & Pet food & Quiz Stats
    const mXp = Math.max(Number(cloudState.xp) || 0, Number(local.xp) || 0);
    if (writeRawJsonIfChanged('cs-xp', mXp)) anyChanged = true;
    if (local.xp > (Number(cloudState.xp) || 0)) shouldPushBack = true;

    const mPetFood = Math.max(Number(cloudState.petFood) || 0, Number(local.petFood) || 0);
    if (writeRawJsonIfChanged('cs-pet-food', mPetFood)) anyChanged = true;

    const cQs = cloudState.quizStats || {};
    const lQs = local.quizStats || {};
    const mQs = {
      ...cQs,
      ...lQs,
      totalCorrect: Math.max(Number(cQs.totalCorrect) || 0, Number(lQs.totalCorrect) || 0),
      totalWrong: Math.max(Number(cQs.totalWrong) || 0, Number(lQs.totalWrong) || 0),
    };
    if (writeRawJsonIfChanged('cs-quiz-stats', mQs)) anyChanged = true;

    // 3. Progress 7 ngày
    const cProg = cloudState.progress || { goal: 10, days: {}, recent: [] };
    const lProg = local.progress || { goal: 10, days: {}, recent: [] };
    const mDays = {};
    new Set([...Object.keys(cProg.days || {}), ...Object.keys(lProg.days || {})]).forEach((dk) => {
      mDays[dk] = Math.max(Number(cProg.days?.[dk]) || 0, Number(lProg.days?.[dk]) || 0);
    });
    const mRecent = mergeByKeyList(
      cProg.recent,
      lProg.recent,
      (r) => r.id || `${r.type}_${r.title}`,
      (r) => Number(r.t) || 0,
      20
    );
    const mProg = { goal: Number(cProg.goal) || Number(lProg.goal) || 10, days: mDays, recent: mRecent };
    if (writeRawJsonIfChanged('cs-progress-v1', mProg)) anyChanged = true;

    // 4. Wrong Bank & Wrong Notebook
    const mWrongBank = Array.from(new Set([...(cloudState.wrongBank || []), ...(local.wrongBank || [])])).slice(0, 60);
    if (mWrongBank.length > 0 && writeRawJsonIfChanged('cs-wrong-bank', mWrongBank)) anyChanged = true;

    const mWrongNb = mergeByKeyList(
      cloudState.wrongNotebook,
      local.wrongNotebook,
      (w) => String(w.questionId || w.id),
      (w) => new Date(w.last_wrong_at || 0).getTime() || 0,
      50
    );
    if (mWrongNb.length > 0 && writeRawJsonIfChanged(`cs-wrong-notebook:${uid}`, mWrongNb)) anyChanged = true;

    // 5. SRS nguyên tố
    const mSrs = { ...(local.srs || {}) };
    Object.entries(cloudState.srs || {}).forEach(([k, cv]) => {
      const lv = mSrs[k];
      if (!lv || (Number(cv?.reps) || 0) >= (Number(lv?.reps) || 0)) {
        mSrs[k] = cv;
      }
    });
    if (Object.keys(mSrs).length > 0 && writeRawJsonIfChanged('cs-srs-v2', mSrs)) anyChanged = true;

    // 6. Gamification
    if (cloudState.gamification || local.gamification) {
      const cg = cloudState.gamification || {};
      const lg = local.gamification || {};
      const mGami = {
        xp: Math.max(Number(cg.xp) || 0, Number(lg.xp) || 0),
        level: Math.max(Number(cg.level) || 1, Number(lg.level) || 1),
        streak: Math.max(Number(cg.streak) || 0, Number(lg.streak) || 0, mStreak.n),
        totalCorrect: Math.max(Number(cg.totalCorrect) || 0, Number(lg.totalCorrect) || 0),
        totalWrong: Math.max(Number(cg.totalWrong) || 0, Number(lg.totalWrong) || 0),
        lastStudyDate: String(cg.lastStudyDate || '') >= String(lg.lastStudyDate || '')
          ? (cg.lastStudyDate || null)
          : (lg.lastStudyDate || null),
      };
      const allGami = readLS('gamification-v1', {}) || {};
      if (JSON.stringify(allGami[uid]) !== JSON.stringify(mGami)) {
        allGami[uid] = mGami;
        writeRawJsonIfChanged('gamification-v1', allGami);
        anyChanged = true;
      }
    }

    // 7. Nguyện vọng ĐH (elec-aspirations-v2 & cs-aspirations-v1)
    if (cloudState.aspV2 || local.aspV2) {
      const cA = cloudState.aspV2;
      const lA = local.aspV2;
      const cHas = Array.isArray(cA?.aspirations) && cA.aspirations.length > 0;
      const lHas = Array.isArray(lA?.aspirations) && lA.aspirations.length > 0;
      const cTs = Number(cA?.updatedAt) || 0;
      const lTs = Number(lA?.updatedAt) || 0;
      const chosenV2 = (cHas && (!lHas || cTs >= lTs)) ? cA : (lA || cA);
      if (chosenV2 && writeRawJsonIfChanged(`elec-aspirations-v2:${uid}`, chosenV2)) anyChanged = true;
      if (lHas && (!cHas || lTs > cTs)) shouldPushBack = true;
    }
    if (cloudState.aspV1 || local.aspV1) {
      const cA1 = cloudState.aspV1;
      const lA1 = local.aspV1;
      const chosenV1 = (Number(cA1?.updatedAt) || 0) >= (Number(lA1?.updatedAt) || 0) ? (cA1 || lA1) : (lA1 || cA1);
      if (chosenV1 && writeRawJsonIfChanged(`cs-aspirations-v1:${uid}`, chosenV1)) anyChanged = true;
    }

    // 8. Lịch sử thi phòng thi ảo & Đề yêu thích
    const mExamHist = mergeByKeyList(
      cloudState.examHistory,
      local.examHistory,
      (e) => String(e.attemptId || e.id || `${e.examId}_${e.ts || e.date}`),
      (e) => Number(e.ts || e.completedAt || (e.date ? new Date(e.date).getTime() : 0)) || 0,
      35
    );
    if (mExamHist.length > 0 && writeRawJsonIfChanged(`elec_exam_history_v1_${uid}`, mExamHist)) anyChanged = true;

    const mFavExams = Array.from(new Set([...(cloudState.favExams || []), ...(local.favExams || [])])).slice(0, 60);
    if (mFavExams.length > 0 && writeRawJsonIfChanged(`elec_fav_exams_v1_${uid}`, mFavExams)) anyChanged = true;

    // 9. Lộ trình & Checkpoints
    if (cloudState.roadmap || local.roadmap) {
      const mSessions = mergeByKeyList(
        cloudState.roadmap?.sessions,
        local.roadmap?.sessions,
        (s) => String(s.id || `${s.topicId}_${s.at || s.startedAt}`),
        (s) => Number(s.at || s.startedAt) || 0,
        50
      );
      const mRm = {
        version: local.roadmap?.version || cloudState.roadmap?.version || 1,
        goal: local.roadmap?.goal || cloudState.roadmap?.goal || null,
        sessions: mSessions,
      };
      if (writeRawJsonIfChanged(`cs-roadmap-v1:${uid}`, mRm)) anyChanged = true;
    }
    if (cloudState.roadmapCheckpoints || local.roadmapCheckpoints) {
      const mergedCp = { ...(cloudState.roadmapCheckpoints || {}), ...(local.roadmapCheckpoints || {}) };
      if (writeRawJsonIfChanged(`cs-roadmap-checkpoints-v1:${uid}`, mergedCp)) anyChanged = true;
    }

    // 10. Companion Sessions ("Lịch sử đã hỏi" trên Home & Floating Drawer)
    const mCompanion = mergeByKeyList(
      cloudState.companionSessions,
      local.companionSessions,
      (s) => String(s.id),
      (s) => Number(s.updatedAt || s.createdAt) || 0,
      12
    );
    if (mCompanion.length > 0 && writeRawJsonIfChanged(`cs-elec-companion-sessions:${uid}`, mCompanion)) {
      anyChanged = true;
    }

    // 11. AI Bookmarks & Tombstones
    const mBookmarks = mergeByKeyList(
      cloudState.aiBookmarks,
      local.aiBookmarks,
      (b) => String(b.id || b.ts || (b.text || '').slice(0, 40)),
      (b) => Number(b.ts) || 0,
      30
    );
    if (mBookmarks.length > 0 && writeRawJsonIfChanged('cs-ai-bookmarks', mBookmarks)) anyChanged = true;

    const cTomb = cloudState.aiDeletedIds || {};
    const lTomb = getDeletedChatTombstones(uid);
    const mTombIds = { ...cTomb, ...lTomb.ids };
    Object.keys(mTombIds).forEach((id) => {
      mTombIds[id] = Math.max(Number(cTomb[id]) || 0, Number(lTomb.ids?.[id]) || 0);
    });
    const mClearAllAt = Math.max(Number(cloudState.aiClearAllAt) || 0, Number(lTomb.clearAllAt) || 0);
    const topTombIds = Object.fromEntries(
      Object.entries(mTombIds).sort((a, b) => Number(b[1]) - Number(a[1])).slice(0, 80)
    );
    if (writeRawJsonIfChanged(`cs-ai-deleted:${uid}`, { ids: topTombIds, clearAllAt: mClearAllAt })) {
      anyChanged = true;
    }

    // Áp tombstone ngay lên scoped local chats nếu thiết bị kia vừa xóa
    try {
      const curScoped = readLS(`cs-ai-chats:${uid}`, []);
      if (Array.isArray(curScoped) && curScoped.length > 0) {
        const filtered = curScoped.filter((ch) => !isChatDeletedByTombstone(ch, { ids: topTombIds, clearAllAt: mClearAllAt }));
        if (filtered.length !== curScoped.length) {
          writeRawJsonIfChanged(`cs-ai-chats:${uid}`, filtered);
          anyChanged = true;
        }
      }
    } catch {}

    // 12. AI Backup Fallback Merge (dự phòng khi ai_chats collection bị trễ/chặn)
    if (Array.isArray(cloudState.aiChatsBackup) && cloudState.aiChatsBackup.length > 0) {
      const curScoped = readLS(`cs-ai-chats:${uid}`, []);
      const curArr = Array.isArray(curScoped) ? curScoped : [];
      const curById = new Map(curArr.map((c) => [String(c.id), c]));
      let backupChanged = false;
      cloudState.aiChatsBackup.forEach((bc) => {
        if (!bc || !bc.id) return;
        if (isChatDeletedByTombstone(bc, { ids: topTombIds, clearAllAt: mClearAllAt })) return;
        const ex = curById.get(String(bc.id));
        if (!ex || (Number(bc.updatedAt) || 0) > (Number(ex.updatedAt) || 0)) {
          // Chỉ chèn nếu local chưa có hoặc bản backup mới hơn rõ rệt & có messages
          if (!ex || (Array.isArray(bc.messages) && bc.messages.length >= (ex.messages?.length || 0))) {
            curById.set(String(bc.id), bc);
            backupChanged = true;
          }
        }
      });
      if (backupChanged) {
        const nextScoped = Array.from(curById.values())
          .filter((ch) => !isChatDeletedByTombstone(ch, { ids: topTombIds, clearAllAt: mClearAllAt }))
          .sort((a, b) => (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0))
          .slice(0, 60);
        writeRawJsonIfChanged(`cs-ai-chats:${uid}`, nextScoped);
        anyChanged = true;
      }
    }

    // 13. AI Preferences (nếu cloud mới hơn)
    if (cloudState.aiPrefs && (Number(cloudState.aiPrefs.updatedAt) || 0) > (Number(local.aiPrefs?.updatedAt) || 0)) {
      if (cloudState.aiPrefs.grade) writeRawJsonIfChanged('cs-ai-grade', cloudState.aiPrefs.grade);
      if (cloudState.aiPrefs.mode) writeRawJsonIfChanged('cs-ai-mode', cloudState.aiPrefs.mode);
      if (cloudState.aiPrefs.gradeAdm) writeRawJsonIfChanged('cs-grade-adm', cloudState.aiPrefs.gradeAdm);
      if (cloudState.aiPrefs.gradeV2) writeRawJsonIfChanged('cs-grade-v2', cloudState.aiPrefs.gradeV2);
      setSyncMeta({ prefsUpdatedAt: Number(cloudState.aiPrefs.updatedAt) || Date.now() });
    }

    if (anyChanged) {
      dispatchAllSyncEvents(uid);
    }
  } finally {
    isApplyingRemote = false;
  }

  return { changed: anyChanged, shouldPushBack };
}

function dispatchAllSyncEvents(uid) {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent('cs-streak-change'));
    window.dispatchEvent(new CustomEvent('cs-streak-ui-sync'));
    window.dispatchEvent(new Event('cs-progress'));
    window.dispatchEvent(new Event('cs-roadmap'));
    window.dispatchEvent(new CustomEvent('elec-aspirations-change', { detail: { uid } }));
    window.dispatchEvent(new Event('cs-aspirations'));
    window.dispatchEvent(new CustomEvent('elec-fav-exams-changed'));
    window.dispatchEvent(new CustomEvent('elec-exam-history-changed'));
    window.dispatchEvent(new CustomEvent('cs-wrong-questions-update', { detail: { uid } }));
    window.dispatchEvent(new CustomEvent('cs-gamification-update', { detail: { uid } }));
    window.dispatchEvent(new CustomEvent(COMPANION_SESSIONS_EVENT, { detail: { uid } }));
    window.dispatchEvent(new CustomEvent(CLOUD_SYNC_EVENT, { detail: { uid, ts: Date.now() } }));
  } catch {}
}

/* ---------- Pull & Push Firestore users/{uid}.studyState ---------- */
let pushTimer = null;
let lastPushedJson = '';
let activeSyncUid = '';
let unsubscribeUserDoc = null;
let lastRemoteUpdatedAt = 0;

export async function pullCloudStudyState(uid) {
  if (!uid || !db || auth?.currentUser?.uid !== uid) return null;
  ensureStudyOwner(uid);
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) {
      // Đẩy dữ liệu local ban đầu lên cloud cho tài khoản mới
      await pushCloudStudyState(uid, true);
      return null;
    }
    const data = snap.data() || {};
    const cloudState = data.studyState && typeof data.studyState === 'object' ? data.studyState : null;
    if (!cloudState) {
      await pushCloudStudyState(uid, true);
      return null;
    }
    lastRemoteUpdatedAt = Math.max(lastRemoteUpdatedAt, Number(cloudState.updatedAt) || Number(data.studyStateUpdatedAt) || 0);
    const { shouldPushBack } = applyMergedCloudStudyState(uid, cloudState);
    if (shouldPushBack) {
      schedulePushCloudStudyState(uid, 500);
    }
    return cloudState;
  } catch (err) {
    console.warn('[cloudStudySync] pull error:', err?.message || err);
    return null;
  }
}

export async function pushCloudStudyState(uid, force = false) {
  if (!uid || !db || auth?.currentUser?.uid !== uid) return false;
  if (isApplyingRemote && !force) return false;
  ensureStudyOwner(uid);

  const snapshot = collectLocalStudyState(uid);
  if (!snapshot) return false;

  // Bỏ qua nếu nội dung thực chất chưa đổi
  const comparable = JSON.stringify({ ...snapshot, updatedAt: 0 });
  if (!force && comparable === lastPushedJson) return false;

  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    const now = Date.now();
    const curUser = auth?.currentUser;
    const payload = {
      studyState: snapshot,
      studyStateUpdatedAt: now,
    };
    if (!snap.exists()) {
      payload.uid = uid;
      payload.email = String(curUser?.email || '');
      payload.role = 'student';
      payload.displayName = String(curUser?.displayName || '');
      payload.createdAt = new Date().toISOString();
    }
    await setDoc(userRef, payload, { merge: true });
    lastPushedJson = comparable;
    lastRemoteUpdatedAt = Math.max(lastRemoteUpdatedAt, now);
    return true;
  } catch (err) {
    console.warn('[cloudStudySync] push error:', err?.message || err);
    return false;
  }
}

export function schedulePushCloudStudyState(uid = activeSyncUid || auth?.currentUser?.uid, delay = 900) {
  if (!uid || isApplyingRemote || auth?.currentUser?.uid !== uid) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    pushCloudStudyState(uid).catch(() => {});
  }, delay);
}

export function flushCloudStudyState(uid = activeSyncUid || auth?.currentUser?.uid) {
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
  if (uid && auth?.currentUser?.uid === uid) {
    return pushCloudStudyState(uid, true);
  }
  return Promise.resolve(false);
}

/**
 * Kích hoạt đồng bộ tự động (pull ban đầu + realtime listener + tự đẩy mọi thay đổi).
 */
export function initCloudStudySyncForUser(uid) {
  if (!uid || typeof window === 'undefined') return () => {};
  if (activeSyncUid === uid && unsubscribeUserDoc) return unsubscribeUserDoc;

  stopCloudStudySync();
  activeSyncUid = uid;
  ensureStudyOwner(uid);

  // 1. Kéo ngay lập tức từ Firestore
  pullCloudStudyState(uid).catch(() => {});

  // 2. Lắng nghe realtime document users/{uid} (nếu ĐT cập nhật, PC tự đổi ngay!)
  let unsubSnap = null;
  if (db) {
    try {
      unsubSnap = onSnapshot(doc(db, 'users', uid), (snap) => {
        if (!snap.exists() || snap.metadata?.hasPendingWrites) return;
        const data = snap.data() || {};
        const cloudState = data.studyState;
        if (!cloudState || typeof cloudState !== 'object') return;
        const remoteTs = Number(cloudState.updatedAt) || Number(data.studyStateUpdatedAt) || 0;
        if (remoteTs <= lastRemoteUpdatedAt) return;
        lastRemoteUpdatedAt = remoteTs;
        applyMergedCloudStudyState(uid, cloudState);
      }, () => {});
    } catch {}
  }

  // 3. Tự động đẩy mỗi khi dữ liệu học tập thay đổi
  const watchedKeys = new Set([
    'cs-streak-v2',
    'cs-streak',
    'cs-streak-freeze-count',
    'cs-streak-passes',
    'cs-streak-claimed-milestones',
    'cs-xp',
    'cs-pet-food',
    'cs-progress-v1',
    'cs-quiz-stats',
    'cs-wrong-bank',
    'cs-srs-v2',
    'gamification-v1',
    'cs-ai-bookmarks',
    'cs-ai-grade',
    'cs-ai-mode',
    'cs-ai-deepthink',
    'cs-grade-adm',
    'cs-grade-v2',
    `cs-wrong-notebook:${uid}`,
    `elec-aspirations-v2:${uid}`,
    `cs-aspirations-v1:${uid}`,
    `elec_exam_history_v1_${uid}`,
    `elec_fav_exams_v1_${uid}`,
    `cs-roadmap-v1:${uid}`,
    `cs-roadmap-checkpoints-v1:${uid}`,
    `cs-elec-companion-sessions:${uid}`,
    `cs-ai-chats:${uid}`,
  ]);

  const onMutate = () => {
    if (isApplyingRemote) return;
    schedulePushCloudStudyState(uid, 900);
  };
  const onCsLs = (e) => {
    if (isApplyingRemote) return;
    if (watchedKeys.has(e?.detail)) {
      if (e.detail === 'cs-streak-freeze-count' || e.detail === 'cs-streak-v2') {
        setSyncMeta({ streakUpdatedAt: Date.now() });
      }
      if (e.detail === 'cs-ai-grade' || e.detail === 'cs-ai-mode' || e.detail === 'cs-ai-deepthink') {
        setSyncMeta({ prefsUpdatedAt: Date.now() });
      }
      schedulePushCloudStudyState(uid, 900);
    }
  };
  const onVisibility = () => {
    if (document.visibilityState === 'hidden') {
      flushCloudStudyState(uid).catch(() => {});
    } else if (document.visibilityState === 'visible') {
      pullCloudStudyState(uid).catch(() => {});
    }
  };
  const onPageHide = () => {
    flushCloudStudyState(uid).catch(() => {});
  };

  window.addEventListener('cs-streak-change', onMutate);
  window.addEventListener('cs-streak-ui-sync', onMutate);
  window.addEventListener('cs-progress', onMutate);
  window.addEventListener('cs-roadmap', onMutate);
  window.addEventListener('elec-aspirations-change', onMutate);
  window.addEventListener('elec-fav-exams-changed', onMutate);
  window.addEventListener('elec-exam-history-changed', onMutate);
  window.addEventListener('cs-wrong-questions-update', onMutate);
  window.addEventListener('cs-gamification-update', onMutate);
  window.addEventListener(COMPANION_SESSIONS_EVENT, onMutate);
  window.addEventListener('cs-ls', onCsLs);
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', onPageHide);

  unsubscribeUserDoc = () => {
    if (pushTimer) { clearTimeout(pushTimer); pushTimer = null; }
    try { unsubSnap?.(); } catch {}
    window.removeEventListener('cs-streak-change', onMutate);
    window.removeEventListener('cs-streak-ui-sync', onMutate);
    window.removeEventListener('cs-progress', onMutate);
    window.removeEventListener('cs-roadmap', onMutate);
    window.removeEventListener('elec-aspirations-change', onMutate);
    window.removeEventListener('elec-fav-exams-changed', onMutate);
    window.removeEventListener('elec-exam-history-changed', onMutate);
    window.removeEventListener('cs-wrong-questions-update', onMutate);
    window.removeEventListener('cs-gamification-update', onMutate);
    window.removeEventListener(COMPANION_SESSIONS_EVENT, onMutate);
    window.removeEventListener('cs-ls', onCsLs);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pagehide', onPageHide);
    unsubscribeUserDoc = null;
    activeSyncUid = '';
  };

  return unsubscribeUserDoc;
}

export function stopCloudStudySync() {
  if (typeof unsubscribeUserDoc === 'function') {
    unsubscribeUserDoc();
  }
}
