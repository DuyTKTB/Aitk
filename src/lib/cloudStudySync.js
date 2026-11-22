/* ============================================================================
   cloudStudySync.js — Đồng bộ TOÀN DIỆN dữ liệu học tập & giảng dạy qua Firestore
   ----------------------------------------------------------------------------
   Giải quyết triệt để tình trạng lệch dữ liệu khi đăng nhập cùng tài khoản
   giữa Điện thoại & Máy tính:
     • Chuỗi ngày học (cs-streak-v2, cs-streak, khiên đóng băng, thẻ bù, mốc)
     • XP, Thống kê Quiz, Tiến độ 7 ngày, Gamification, Pet Food, Huy hiệu
     • Sổ tay lỗi sai, Nguyên nhân sai, Ghi chú từng câu, Spaced Repetition
     • ELO, Lực chiến (Combat Power), Trường mục tiêu, Nháp phòng thi, Shop Học Bá
     • Flashcards (Leitner), Kế hoạch ôn thi, Kế hoạch 7 ngày, Lịch tuần & AI Strategy
     • Mục tiêu & Nguyện vọng ĐH (elec-aspirations-v2, cs-aspirations-v1)
     • Lịch sử phòng thi ảo, Đề yêu thích, Lộ trình học tập, Bài giảng & Công thức lưu
     • Bộ nhớ dài hạn AI (cs-ai-memory), Pomodoro & ClockHub (Heatmap 365)
     • Trợ lý nổi Companion, Bookmarks, Tombstones xóa chat & Backup chat dự phòng
     • Không gian làm việc Giáo viên (`teacherState`: bộ lọc/meta ngân hàng câu hỏi,
       lịch sử trộn mã đề, giao diện GV, nháp đề thủ công, hạn mức dùng thử)
   Ghi an toàn vào users/{uid}.studyState & users/{uid}.teacherState (khớp firestore.rules).
   ============================================================================ */
import * as firebaseMod from './firebase.js';

const getDb = () => firebaseMod.db || null;
const getAuth = () => firebaseMod.auth || null;

const STUDY_OWNER_KEY = 'cs-study-owner';
const SYNC_META_KEY = 'cs-study-sync-meta';
export const CLOUD_SYNC_EVENT = 'cs-cloud-sync-update';
export const COMPANION_SESSIONS_EVENT = 'cs-companion-sessions-update';

const MAX_CLOUD_BYTES = 420 * 1024; // Giữ an toàn xa giới hạn 1MB/doc của Firestore

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

const STRING_RAW_SUFFIXES = new Set([
  'cs-streak-freeze-count',
  'cs-home-grade',
  'cs-roadmap-grade-v2',
  'elec-current-subject',
  'elec_teacher_theme',
  'elec_teacher_rail_collapsed',
]);

function writeLS(key, value) {
  try {
    const shouldKeepRawString = typeof value === 'string' && (
      STRING_RAW_SUFFIXES.has(key) ||
      key.startsWith('elec-notes-') ||
      (!key.endsWith('-v2') && key !== 'cs-ai-grade' && key !== 'cs-ai-mode' && key !== 'cs-grade-adm')
    );
    const nextRaw = shouldKeepRawString ? value : JSON.stringify(value);
    const prevRaw = localStorage.getItem(key);
    if (prevRaw === nextRaw) return false;
    localStorage.setItem(key, nextRaw);
    try { window.dispatchEvent(new CustomEvent('cs-ls', { detail: key })); } catch { /* ignore */ }
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
    try { window.dispatchEvent(new CustomEvent('cs-ls', { detail: key })); } catch { /* ignore */ }
    return true;
  } catch {
    return false;
  }
}

function removeLSWithNotify(key) {
  try {
    if (localStorage.getItem(key) === null) return false;
    localStorage.removeItem(key);
    try { window.dispatchEvent(new CustomEvent('cs-ls', { detail: key })); } catch { /* ignore */ }
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

/* Các khoá dùng chung không gắn UID -> phải cô lập theo chủ tài khoản & dọn sạch khi đăng xuất */
const SHARED_ACCOUNT_KEYS = [
  'cs-streak-v2',
  'cs-streak',
  'cs-streak-freeze-count',
  'cs-streak-passes',
  'cs-streak-claimed-milestones',
  'cs-xp',
  'cs-pet-food',
  'cs-pet-lastfed',
  'cs-progress-v1',
  'cs-quiz-stats',
  'cs-quiz-prefs',
  'cs-achievements',
  'cs-wrong-bank',
  'cs-srs-v2',
  'cs-srs',
  'cs-grade-v2',
  'cs-grade-history-v2',
  'cs-grade-adm',
  'cs-ai-bookmarks',
  'cs-ai-grade',
  'cs-ai-mode',
  'cs-ai-deepthink',
  'cs-ai-autospeak',
  'cs-ai-chats',
  'cs-ai-active',
  'cs-ai-pinned',
  'cs-ai-chats-owner',
  'cs-ai-draft',
  'cs-pomo-history',
  'cs-pomodoro',
  'cs-sessions',
  'cs-pomo-notify',
  'cs-pomo-sound',
  'cs-pomo-autonext',
  'cs-pomo-goal',
  'cs-pomo-tasks',
  'cs-pomo-desk-theme',
  'cs-pomo-desk-mascot',
  'cs-pomo-ambient-vol',
  'cs-ch-focus-cfg',
  'cs-ch-focus-cycle',
  'cs-ch-focus-hist',
  'cs-ch-focus-auto',
  'cs-ch-focus-tasks',
  'cs-ch-focus-notes',
  'cs-ch-custom-timers',
  'cs-ch-alarms',
  'cs-ch-stopwatch-saved',
  'cs-ch-events',
  'cs-ch-tab',
  'cs-ch-sound-preset',
  'elec-completed-lessons',
  'elec-bookmarked-formulas',
  'elec_wrong_causes_v1',
  'pt-favs',
  'cs-career-report',
  'cs-home-exam',
  'cs-home-grade',
  'cs-roadmap-grade-v2',
  'elec-current-subject',
  'cs-notes-local-v2',
  'cs-note-votes-v2',
  'cs-notes-v1',
  'cs-qb-fav-filters-v1',
  'cs-qb-qmeta-v1',
  'cs-shuffle-history-v1',
  'elec_teacher_rail_collapsed',
  'elec_paper_exams',
  'aes_owner_uid',
];

const SHARED_DYNAMIC_PREFIXES = [
  'elec-notes-',
  'cs-exam-manual-draft:',
  'aes_',
];

function getSyncMeta() {
  return readLS(SYNC_META_KEY, {}) || {};
}

function setSyncMeta(patch = {}) {
  const cur = getSyncMeta();
  const next = {
    ...cur,
    ...patch,
    sectionTs: { ...(cur.sectionTs || {}), ...(patch.sectionTs || {}) },
    syncedSectionTs: { ...(cur.syncedSectionTs || {}), ...(patch.syncedSectionTs || {}) },
  };
  try {
    localStorage.setItem(SYNC_META_KEY, JSON.stringify(next));
  } catch { /* ignore */ }
}

function bumpSectionTs(sectionNames = []) {
  if (!sectionNames.length) return;
  const now = Date.now();
  const sectionTs = {};
  sectionNames.forEach((name) => {
    if (name) sectionTs[name] = now;
  });
  setSyncMeta({
    sectionTs,
    ...(sectionNames.includes('streak') ? { streakUpdatedAt: now } : {}),
    ...(sectionNames.includes('prefs') ? { prefsUpdatedAt: now } : {}),
  });
}

function clearSharedLocalKeys({ notify = false } = {}) {
  const removed = [];
  SHARED_ACCOUNT_KEYS.forEach((k) => {
    try {
      if (localStorage.getItem(k) !== null) {
        localStorage.removeItem(k);
        removed.push(k);
      }
    } catch { /* ignore */ }
  });
  try {
    for (let i = localStorage.length - 1; i >= 0; i -= 1) {
      const key = localStorage.key(i);
      if (key && SHARED_DYNAMIC_PREFIXES.some((p) => key.startsWith(p))) {
        localStorage.removeItem(key);
        removed.push(key);
      }
    }
  } catch { /* ignore */ }
  if (notify) {
    removed.forEach((k) => {
      try { window.dispatchEvent(new CustomEvent('cs-ls', { detail: k })); } catch { /* ignore */ }
    });
  }
}

/**
 * Đảm bảo dữ liệu dùng chung không bị trộn chéo giữa 2 tài khoản khác nhau trên cùng máy tính.
 */
export function ensureStudyOwner(uid) {
  if (typeof window === 'undefined' || !uid) return false;
  try {
    const prevOwner = localStorage.getItem(STUDY_OWNER_KEY) || '';
    if (prevOwner && prevOwner !== uid) {
      clearSharedLocalKeys({ notify: true });
      localStorage.removeItem(SYNC_META_KEY);
      lastPushedJson = '';
      lastPushedTeacherJson = '';
      lastRemoteUpdatedAt = 0;
      lastRemoteTeacherUpdatedAt = 0;
    }
    if (prevOwner !== uid) {
      localStorage.setItem(STUDY_OWNER_KEY, uid);
      return prevOwner !== '';
    }
  } catch { /* ignore */ }
  return false;
}

/**
 * Dọn sạch các khoá dùng chung khi đăng xuất để tài khoản sau/khách không bị dính dữ liệu cũ.
 */
export function clearLocalStudyStateOnLogout() {
  if (typeof window === 'undefined') return;
  try {
    clearSharedLocalKeys({ notify: true });
    localStorage.removeItem(STUDY_OWNER_KEY);
    localStorage.removeItem(SYNC_META_KEY);
  } catch { /* ignore */ }
  lastPushedJson = '';
  lastPushedTeacherJson = '';
  lastRemoteUpdatedAt = 0;
  lastRemoteTeacherUpdatedAt = 0;
  initialPullDoneUid = '';
  initialPullPromise = null;
  dispatchAllSyncEvents('guest');
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

/* ---------- Thu gọn backup Chat AI & Ghi chú bài giảng (<24KB) ---------- */
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

function collectPrefixedLS(prefix, { maxItems = 60, maxValLen = 1000, json = false } = {}) {
  const out = {};
  try {
    let count = 0;
    for (let i = 0; i < localStorage.length && count < maxItems; i += 1) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(prefix)) continue;
      const suffix = k.slice(prefix.length);
      if (!suffix) continue;
      const raw = localStorage.getItem(k);
      if (raw === null) continue;
      if (json) {
        try {
          out[suffix] = JSON.parse(raw);
          count += 1;
        } catch { /* ignore invalid json */ }
      } else {
        out[suffix] = String(raw).slice(0, maxValLen);
        count += 1;
      }
    }
  } catch { /* ignore */ }
  return out;
}

function compactObjectLimit(obj, limit = 150, sortByKeyOrVal = null) {
  if (!obj || typeof obj !== 'object') return {};
  const entries = Object.entries(obj);
  if (entries.length <= limit) return obj;
  if (typeof sortByKeyOrVal === 'function') {
    return Object.fromEntries(entries.sort(sortByKeyOrVal).slice(0, limit));
  }
  return Object.fromEntries(entries.slice(-limit));
}

function trimDaysMap(days, maxDays = 180) {
  if (!days || typeof days !== 'object') return {};
  const keys = Object.keys(days).sort().slice(-maxDays);
  const out = {};
  keys.forEach((k) => { out[k] = days[k]; });
  return out;
}

/* ---------- Đọc toàn bộ snapshot HỌC TẬP hiện tại từ LocalStorage ---------- */
export function collectLocalStudyState(uid) {
  if (!uid || typeof window === 'undefined') return null;
  const meta = getSyncMeta();
  const sTs = meta.sectionTs || {};

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
  const hasFreezeExplicit = freezeRaw !== null && Number.isFinite(Number(freezeRaw));
  const freezeCount = hasFreezeExplicit ? Math.max(0, Number(freezeRaw)) : 1;

  const passes = readLS('cs-streak-passes', {}) || {};
  const claimedMilestones = Array.isArray(readLS('cs-streak-claimed-milestones', []))
    ? readLS('cs-streak-claimed-milestones', [])
    : [];

  const xp = Math.max(0, Number(readLS('cs-xp', 0)) || 0);
  const petFood = Math.max(0, Number(readLS('cs-pet-food', 0)) || 0);
  const petLastFed = String(readLS('cs-pet-lastfed', '') || '');
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
  const wrongBank = Array.isArray(wrongBankRaw) ? wrongBankRaw.slice(0, 80) : [];

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

  const srsRaw = readLS('cs-srs-v2', null) || readLS('cs-srs', {}) || {};
  const srs = compactObjectLimit(srsRaw, 150);

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

  const themeStored = readLS('cs-theme-v2', null);
  const aiPrefs = {
    grade: String(readLS('cs-ai-grade', 'Tự động') || 'Tự động'),
    mode: String(readLS('cs-ai-mode', 'auto') || 'auto'),
    deepThink: Boolean(readLS('cs-ai-deepthink', false)),
    autoSpeak: Boolean(readLS('cs-ai-autospeak', false)),
    gradeAdm: readLS('cs-grade-adm', null),
    gradeV2: readLS('cs-grade-v2', null),
    gradeHistoryV2: Array.isArray(readLS('cs-grade-history-v2', null))
      ? readLS('cs-grade-history-v2', []).slice(0, 20)
      : null,
    theme: typeof themeStored === 'string' && themeStored ? themeStored : '',
    homeGrade: localStorage.getItem('cs-home-grade') || '',
    roadmapGrade: localStorage.getItem('cs-roadmap-grade-v2') || '',
    currentSubject: localStorage.getItem('elec-current-subject') || '',
    homeExam: readLS('cs-home-exam', null),
    updatedAt: Number(meta.prefsUpdatedAt || sTs.prefs) || 0,
  };

  /* ── Phân tích & Tiện ích Học sinh bổ sung ── */
  const eloRaw = readLS(`elec_student_elo_v1_${uid}`, null);
  const eloState = eloRaw && typeof eloRaw === 'object'
    ? { elo: Number(eloRaw.elo) || 1200, history: Array.isArray(eloRaw.history) ? eloRaw.history.slice(-25) : [] }
    : null;

  const powerRaw = readLS(`elec_student_power_v1_${uid}`, null);
  const combatPower = powerRaw && typeof powerRaw === 'object'
    ? { power: Number(powerRaw.power) || 1000, history: Array.isArray(powerRaw.history) ? powerRaw.history.slice(-25) : [] }
    : null;

  const targetUni = readLS(`elec_student_target_uni_v1_${uid}`, null);

  const wrongNotesRaw = readLS(`elec_wrong_notes_v1_${uid}`, {});
  const wrongNotes = wrongNotesRaw && typeof wrongNotesRaw === 'object'
    ? Object.fromEntries(
        Object.entries(wrongNotesRaw)
          .slice(0, 80)
          .map(([k, v]) => [k, String(v || '').slice(0, 500)])
      )
    : {};

  const examDraftsRaw = readLS(`elec_exam_drafts_v1_${uid}`, {});
  const examDrafts = examDraftsRaw && typeof examDraftsRaw === 'object'
    ? Object.fromEntries(
        Object.entries(examDraftsRaw)
          .sort((a, b) => (Number(b[1]?.updatedAt) || 0) - (Number(a[1]?.updatedAt) || 0))
          .slice(0, 8)
      )
    : {};

  const rewardShop = readLS(`elec_reward_shop_v1_${uid}`, null);

  const subQuotaRaw = readLS(`elec_sub_quota_v1_${uid}`, null);
  const subQuota = subQuotaRaw && typeof subQuotaRaw === 'object'
    ? {
        ...subQuotaRaw,
        transactions: Array.isArray(subQuotaRaw.transactions) ? subQuotaRaw.transactions.slice(0, 20) : [],
        usedCodes: Array.isArray(subQuotaRaw.usedCodes) ? subQuotaRaw.usedCodes.slice(0, 30) : [],
      }
    : null;

  /* Flashcards Leitner */
  const fcRaw = readLS(`cs-flashcards-v1:${uid}`, null);
  const flashcards = fcRaw?.cards && typeof fcRaw.cards === 'object'
    ? {
        version: 1,
        cards: compactObjectLimit(
          fcRaw.cards,
          350,
          (a, b) => (Number(b[1]?.lastAt) || 0) - (Number(a[1]?.lastAt) || 0)
        ),
      }
    : null;

  /* Study Plan + Weekly Plan + Roadmap Schedule + AI Aspiration Strategy */
  const studyPlan = readLS(`cs-study-plan-v1:${uid}`, null);
  const weeklyPlan = readLS(`elec_weekly_plan_v1_${uid}`, null);
  const roadmapSchedule = readLS(`elec_ai_roadmap_schedule_v1:${uid}`, null);
  const aspStratRaw = readLS(`elec_ai_aspiration_strategy_v2:${uid}`, null);
  const aspStrategy = aspStratRaw && typeof aspStratRaw === 'object'
    ? {
        ...aspStratRaw,
        strategicRoadmap: Array.isArray(aspStratRaw.strategicRoadmap) ? aspStratRaw.strategicRoadmap.slice(0, 6) : undefined,
        diagnosedTopics: Array.isArray(aspStratRaw.diagnosedTopics) ? aspStratRaw.diagnosedTopics.slice(0, 8) : undefined,
        keyRecommendations: Array.isArray(aspStratRaw.keyRecommendations) ? aspStratRaw.keyRecommendations.slice(0, 8) : undefined,
      }
    : null;

  /* Bộ nhớ dài hạn AI */
  const aiMemory = readLS(`cs-ai-memory:${uid}`, null);

  /* Pomodoro & ClockHub */
  const pomodoro = {
    history: trimDaysMap(readLS('cs-pomo-history', {}) || {}, 180),
    cfg: readLS('cs-pomodoro', null),
    sessions: Number(readLS('cs-sessions', 0)) || 0,
    goal: Number(readLS('cs-pomo-goal', 8)) || 8,
    tasks: Array.isArray(readLS('cs-pomo-tasks', [])) ? readLS('cs-pomo-tasks', []).slice(0, 40) : [],
    notify: readLS('cs-pomo-notify', null),
    sound: readLS('cs-pomo-sound', null),
    autoNext: readLS('cs-pomo-autonext', null),
    deskTheme: readLS('cs-pomo-desk-theme', null),
    deskMascot: readLS('cs-pomo-desk-mascot', null),
    ambientVol: readLS('cs-pomo-ambient-vol', null),
  };

  const clockHub = {
    focusHist: trimDaysMap(readLS('cs-ch-focus-hist', {}) || {}, 180),
    focusCfg: readLS('cs-ch-focus-cfg', null),
    focusCycle: Number(readLS('cs-ch-focus-cycle', 0)) || 0,
    focusAuto: readLS('cs-ch-focus-auto', null),
    focusTasks: Array.isArray(readLS('cs-ch-focus-tasks', [])) ? readLS('cs-ch-focus-tasks', []).slice(0, 40) : [],
    focusNotes: Array.isArray(readLS('cs-ch-focus-notes', [])) ? readLS('cs-ch-focus-notes', []).slice(0, 30) : [],
    customTimers: Array.isArray(readLS('cs-ch-custom-timers', [])) ? readLS('cs-ch-custom-timers', []).slice(0, 15) : [],
    alarms: Array.isArray(readLS('cs-ch-alarms', [])) ? readLS('cs-ch-alarms', []).slice(0, 15) : [],
    stopwatchSaved: Array.isArray(readLS('cs-ch-stopwatch-saved', [])) ? readLS('cs-ch-stopwatch-saved', []).slice(0, 20) : [],
    events: Array.isArray(readLS('cs-ch-events', null)) ? readLS('cs-ch-events', []).slice(0, 30) : null,
    soundPreset: readLS('cs-ch-sound-preset', null),
  };

  /* Bài giảng hoàn thành, Công thức lưu, Ghi chú từng bài, Nguyên nhân lỗi sai */
  const lessons = {
    completed: Array.isArray(readLS('elec-completed-lessons', [])) ? readLS('elec-completed-lessons', []).slice(0, 300) : [],
    bookmarkedFormulas: Array.isArray(readLS('elec-bookmarked-formulas', [])) ? readLS('elec-bookmarked-formulas', []).slice(0, 200) : [],
    notesByLesson: collectPrefixedLS('elec-notes-', { maxItems: 50, maxValLen: 1000, json: false }),
  };

  const wrongCauses = readLS('elec_wrong_causes_v1', {});

  /* Huy hiệu, Quiz prefs, Báo cáo nghề nghiệp AI, Nguyên tố yêu thích, Ghi chú */
  const achievements = Array.isArray(readLS('cs-achievements', [])) ? readLS('cs-achievements', []) : [];
  const quizPrefs = readLS('cs-quiz-prefs', null);
  const ptFavs = Array.isArray(readLS('pt-favs', [])) ? readLS('pt-favs', []).slice(0, 118) : [];
  const careerRaw = readLS('cs-career-report', null);
  const careerReport = careerRaw && typeof careerRaw === 'object'
    ? { ...careerRaw, groups: Array.isArray(careerRaw.groups) ? careerRaw.groups.slice(0, 5) : undefined }
    : null;
  const notesLocal = Array.isArray(readLS('cs-notes-local-v2', null)) ? readLS('cs-notes-local-v2', []).slice(0, 50) : null;
  const notesV1 = Array.isArray(readLS('cs-notes-v1', null)) ? readLS('cs-notes-v1', []).slice(0, 50) : null;
  const noteVotes = readLS('cs-note-votes-v2', null);

  return sanitizeForCloud({
    version: 2,
    updatedAt: Date.now(),
    sectionTs: sTs,
    streak: {
      ...bestStreak,
      freezeCount,
      hasFreezeExplicit,
      passes,
      claimedMilestones,
      lastFed: petLastFed,
      updatedAt: Number(meta.streakUpdatedAt || sTs.streak) || 0,
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
    eloState,
    combatPower,
    targetUni,
    wrongNotes,
    examDrafts,
    rewardShop,
    subQuota,
    flashcards,
    studyPlan,
    weeklyPlan,
    roadmapSchedule,
    aspStrategy,
    aiMemory,
    pomodoro,
    clockHub,
    lessons,
    wrongCauses,
    achievements,
    quizPrefs,
    ptFavs,
    careerReport,
    notesLocal,
    notesV1,
    noteVotes,
  });
}

/* ---------- Đọc toàn bộ snapshot GIÁO VIÊN hiện tại từ LocalStorage ---------- */
export function collectLocalTeacherState(uid) {
  if (!uid || typeof window === 'undefined') return null;
  const meta = getSyncMeta();
  const sTs = meta.sectionTs || {};

  const qbFavFilters = readLS('cs-qb-fav-filters-v1', null);
  const qbQMetaRaw = readLS('cs-qb-qmeta-v1', null);
  const qbQMeta = qbQMetaRaw && typeof qbQMetaRaw === 'object'
    ? compactObjectLimit(qbQMetaRaw, 350)
    : null;

  const shuffleRaw = readLS('cs-shuffle-history-v1', null);
  const shuffleHistory = Array.isArray(shuffleRaw)
    ? shuffleRaw.slice(0, 20).map((item) => {
        if (!item || typeof item !== 'object') return item;
        const copy = { ...item };
        // Giảm dung lượng nếu lưu mảng câu hỏi cồng kềnh
        if (Array.isArray(copy.versions)) {
          copy.versions = copy.versions.slice(0, 8).map((v) => ({
            code: v?.code,
            questionCount: v?.questions?.length || v?.questionCount || 0,
          }));
        }
        return copy;
      })
    : null;

  const teacherTheme = localStorage.getItem('elec_teacher_theme') || '';
  const teacherRailCollapsed = localStorage.getItem('elec_teacher_rail_collapsed') || '';

  const omrTrialUsed = Number(localStorage.getItem(`elec-omr-trial-count:${uid}`) || 0) || 0;
  const wordImportTrialUsed = Number(localStorage.getItem(`elec-word-import-trial-count:${uid}`) || 0) || 0;
  const manualEntryTrialUsed = Number(localStorage.getItem(`elec-manual-entry-trial-count:${uid}`) || 0) || 0;

  const paperRaw = readLS('elec_paper_exams', null);
  const paperExamsLocal = Array.isArray(paperRaw) ? paperRaw.slice(0, 15) : null;

  const manualDrafts = collectPrefixedLS('cs-exam-manual-draft:', { maxItems: 6, json: true });

  const hasAnyTeacherData = Boolean(
    qbFavFilters ||
    (qbQMeta && Object.keys(qbQMeta).length > 0) ||
    (shuffleHistory && shuffleHistory.length > 0) ||
    teacherTheme ||
    teacherRailCollapsed ||
    omrTrialUsed > 0 ||
    wordImportTrialUsed > 0 ||
    manualEntryTrialUsed > 0 ||
    (paperExamsLocal && paperExamsLocal.length > 0) ||
    Object.keys(manualDrafts).length > 0
  );
  if (!hasAnyTeacherData) return null;

  return sanitizeForCloud({
    version: 1,
    updatedAt: Date.now(),
    workspaceTs: Number(sTs.teacherWorkspace) || 0,
    qbFavFilters,
    qbQMeta,
    shuffleHistory,
    teacherTheme,
    teacherRailCollapsed,
    omrTrialUsed,
    wordImportTrialUsed,
    manualEntryTrialUsed,
    paperExamsLocal,
    manualDrafts,
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

  let freezeCount = 1;
  if (!local.hasFreezeExplicit && cloud.freezeCount !== undefined) {
    freezeCount = Number(cloud.freezeCount);
  } else if (cUpd >= lUpd && cloud.freezeCount !== undefined) {
    freezeCount = Number(cloud.freezeCount);
  } else if (local.hasFreezeExplicit && local.freezeCount !== undefined) {
    freezeCount = Number(local.freezeCount);
  } else if (cloud.freezeCount !== undefined) {
    freezeCount = Number(cloud.freezeCount);
  }

  const cPasses = cloud.passes || {};
  const lPasses = local.passes || {};
  const passKeys = new Set([...Object.keys(cPasses), ...Object.keys(lPasses)]);
  const passes = {};
  passKeys.forEach((k) => { passes[k] = Math.max(Number(cPasses[k]) || 0, Number(lPasses[k]) || 0); });

  const claimedMilestones = Array.from(new Set([
    ...(Array.isArray(cloud.claimedMilestones) ? cloud.claimedMilestones : []),
    ...(Array.isArray(local.claimedMilestones) ? local.claimedMilestones : []),
  ])).sort((a, b) => Number(a) - Number(b));

  const lastFed = String(cloud.lastFed || '') >= String(local.lastFed || '')
    ? String(cloud.lastFed || '')
    : String(local.lastFed || '');

  return {
    last: chosenLast,
    n: chosenN,
    total,
    freezeCount: Number.isFinite(freezeCount) ? Math.max(0, freezeCount) : 1,
    passes,
    claimedMilestones,
    lastFed,
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

/**
 * Quyết định 3 chiều theo section timestamp để xóa/sửa trên 1 máy truyền đúng sang máy khác
 * (chỉ giữ bản local nếu local thực sự sửa offline sau lần đồng bộ gần nhất).
 */
function pickMutableSection(sectionName, cloudVal, localVal, cloudTsMap = {}, localTsMap = {}, syncedTsMap = {}) {
  const cTs = Number(cloudTsMap?.[sectionName]) || 0;
  const lTs = Number(localTsMap?.[sectionName]) || 0;
  const sTs = Number(syncedTsMap?.[sectionName]) || 0;

  const hasCloud = cloudVal !== undefined && cloudVal !== null;
  const hasLocal = localVal !== undefined && localVal !== null;

  if (!hasCloud && !hasLocal) return { winner: 'none', val: null, pushBack: false, nextTs: 0 };

  if (cTs > lTs && (lTs <= sTs || !hasLocal)) {
    return { winner: 'cloud', val: cloudVal, pushBack: false, nextTs: cTs };
  }
  if (lTs > cTs && lTs > sTs) {
    return { winner: 'local', val: localVal, pushBack: true, nextTs: lTs };
  }
  if (cTs > 0 && lTs === 0) {
    return { winner: 'cloud', val: cloudVal, pushBack: false, nextTs: cTs };
  }
  if (lTs > 0 && cTs === 0) {
    return { winner: 'local', val: localVal, pushBack: true, nextTs: lTs };
  }
  return { winner: 'merge', val: null, pushBack: false, nextTs: Math.max(cTs, lTs) };
}

function mergeDayMapsMax(cDays = {}, lDays = {}) {
  const out = {};
  new Set([...Object.keys(cDays || {}), ...Object.keys(lDays || {})]).forEach((dk) => {
    const cv = cDays?.[dk];
    const lv = lDays?.[dk];
    if (typeof cv === 'object' || typeof lv === 'object') {
      out[dk] = (Number(cv?.sessions ?? cv) || 0) >= (Number(lv?.sessions ?? lv) || 0) ? cv : lv;
    } else {
      out[dk] = Math.max(Number(cv) || 0, Number(lv) || 0);
    }
  });
  return trimDaysMap(out, 180);
}

let isApplyingRemote = false;

export function applyMergedCloudStudyState(uid, cloudState) {
  if (!uid || !cloudState || typeof cloudState !== 'object' || typeof window === 'undefined') {
    return { changed: false, shouldPushBack: false };
  }
  ensureStudyOwner(uid);
  const local = collectLocalStudyState(uid);
  if (!local) return { changed: false, shouldPushBack: false };

  const meta = getSyncMeta();
  const cSec = cloudState.sectionTs || {};
  const lSec = meta.sectionTs || {};
  const sSec = meta.syncedSectionTs || {};
  const nextSyncedTs = { ...sSec };
  const nextSectionTs = { ...lSec };

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
    if (mStreak.lastFed && writeRawJsonIfChanged('cs-pet-lastfed', mStreak.lastFed)) anyChanged = true;
    if (local.streak.n > (Number(cloudState.streak?.n) || 0) || local.streak.total > (Number(cloudState.streak?.total) || 0)) {
      shouldPushBack = true;
    }

    // 2. XP, Pet food & Quiz Stats
    const mXp = Math.max(Number(cloudState.xp) || 0, Number(local.xp) || 0);
    if (writeRawJsonIfChanged('cs-xp', mXp)) anyChanged = true;
    if (local.xp > (Number(cloudState.xp) || 0)) shouldPushBack = true;

    const mPetFood = Math.max(Number(cloudState.petFood) || 0, Number(local.petFood) || 0);
    if (writeRawJsonIfChanged('cs-pet-food', mPetFood)) anyChanged = true;
    if (local.petFood > (Number(cloudState.petFood) || 0)) shouldPushBack = true;

    const cQs = cloudState.quizStats || {};
    const lQs = local.quizStats || {};
    const mQs = {
      ...cQs,
      ...lQs,
      totalCorrect: Math.max(Number(cQs.totalCorrect) || 0, Number(lQs.totalCorrect) || 0),
      totalWrong: Math.max(Number(cQs.totalWrong) || 0, Number(lQs.totalWrong) || 0),
      maxStreak: Math.max(Number(cQs.maxStreak) || 0, Number(lQs.maxStreak) || 0),
      dailyCount: Math.max(Number(cQs.dailyCount) || 0, Number(lQs.dailyCount) || 0),
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

    // 4. Wrong Bank & Wrong Notebook (hỗ trợ xóa đồng bộ nhờ sectionTs)
    const wbPick = pickMutableSection('wrongBank', cloudState.wrongBank, local.wrongBank, cSec, lSec, sSec);
    if (wbPick.winner === 'cloud') {
      if (writeRawJsonIfChanged('cs-wrong-bank', wbPick.val || [])) anyChanged = true;
      nextSectionTs.wrongBank = wbPick.nextTs;
      nextSyncedTs.wrongBank = wbPick.nextTs;
    } else if (wbPick.winner === 'local') {
      shouldPushBack = true;
    } else {
      const mWrongBank = Array.from(new Set([...(cloudState.wrongBank || []), ...(local.wrongBank || [])])).slice(0, 80);
      if (mWrongBank.length > 0 && writeRawJsonIfChanged('cs-wrong-bank', mWrongBank)) anyChanged = true;
    }

    const wnPick = pickMutableSection('wrongNotebook', cloudState.wrongNotebook, local.wrongNotebook, cSec, lSec, sSec);
    if (wnPick.winner === 'cloud') {
      if (writeRawJsonIfChanged(`cs-wrong-notebook:${uid}`, wnPick.val || [])) anyChanged = true;
      nextSectionTs.wrongNotebook = wnPick.nextTs;
      nextSyncedTs.wrongNotebook = wnPick.nextTs;
    } else if (wnPick.winner === 'local') {
      shouldPushBack = true;
    } else {
      const mWrongNb = mergeByKeyList(
        cloudState.wrongNotebook,
        local.wrongNotebook,
        (w) => String(w.questionId || w.id),
        (w) => new Date(w.last_wrong_at || 0).getTime() || 0,
        50
      );
      if (mWrongNb.length > 0 && writeRawJsonIfChanged(`cs-wrong-notebook:${uid}`, mWrongNb)) anyChanged = true;
    }

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
      if ((Number(lg.xp) || 0) > (Number(cg.xp) || 0)) shouldPushBack = true;
    }

    // 7. Nguyện vọng ĐH
    if (cloudState.aspV2 || local.aspV2) {
      const cA = cloudState.aspV2;
      const lA = local.aspV2;
      const cHas = Array.isArray(cA?.aspirations) && cA.aspirations.length > 0;
      const lHas = Array.isArray(lA?.aspirations) && lA.aspirations.length > 0;
      const cTs = Number(cA?.updatedAt) || 0;
      const lTs = Number(lA?.updatedAt) || 0;
      const chosenV2 = (cTs > lTs) ? cA : (lTs > cTs) ? lA : (cHas ? cA : (lA || cA));
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
    if ((local.examHistory?.length || 0) > (cloudState.examHistory?.length || 0)) shouldPushBack = true;

    const favPick = pickMutableSection('favExams', cloudState.favExams, local.favExams, cSec, lSec, sSec);
    if (favPick.winner === 'cloud') {
      if (writeRawJsonIfChanged(`elec_fav_exams_v1_${uid}`, favPick.val || [])) anyChanged = true;
      nextSectionTs.favExams = favPick.nextTs;
      nextSyncedTs.favExams = favPick.nextTs;
    } else if (favPick.winner === 'local') {
      shouldPushBack = true;
    } else {
      const mFavExams = Array.from(new Set([...(cloudState.favExams || []), ...(local.favExams || [])])).slice(0, 60);
      if (mFavExams.length > 0 && writeRawJsonIfChanged(`elec_fav_exams_v1_${uid}`, mFavExams)) anyChanged = true;
    }

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

    // 10. Companion Sessions
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
    const bmPick = pickMutableSection('aiBookmarks', cloudState.aiBookmarks, local.aiBookmarks, cSec, lSec, sSec);
    if (bmPick.winner === 'cloud') {
      if (writeRawJsonIfChanged('cs-ai-bookmarks', bmPick.val || [])) anyChanged = true;
      nextSectionTs.aiBookmarks = bmPick.nextTs;
      nextSyncedTs.aiBookmarks = bmPick.nextTs;
    } else if (bmPick.winner === 'local') {
      shouldPushBack = true;
    } else {
      const mBookmarks = mergeByKeyList(
        cloudState.aiBookmarks,
        local.aiBookmarks,
        (b) => String(b.id || b.ts || (b.text || '').slice(0, 40)),
        (b) => Number(b.ts) || 0,
        30
      );
      if (mBookmarks.length > 0 && writeRawJsonIfChanged('cs-ai-bookmarks', mBookmarks)) anyChanged = true;
    }

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

    try {
      const curScoped = readLS(`cs-ai-chats:${uid}`, []);
      if (Array.isArray(curScoped) && curScoped.length > 0) {
        const filtered = curScoped.filter((ch) => !isChatDeletedByTombstone(ch, { ids: topTombIds, clearAllAt: mClearAllAt }));
        if (filtered.length !== curScoped.length) {
          writeRawJsonIfChanged(`cs-ai-chats:${uid}`, filtered);
          anyChanged = true;
        }
      }
    } catch { /* ignore */ }

    // 12. AI Backup Fallback Merge
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

    // 13. AI Preferences & Theme & Grade & Subject
    if (cloudState.aiPrefs && (Number(cloudState.aiPrefs.updatedAt) || 0) > (Number(local.aiPrefs?.updatedAt) || 0)) {
      const cp = cloudState.aiPrefs;
      if (cp.grade) { if (writeRawJsonIfChanged('cs-ai-grade', cp.grade)) anyChanged = true; }
      if (cp.mode) { if (writeRawJsonIfChanged('cs-ai-mode', cp.mode)) anyChanged = true; }
      if (cp.deepThink !== undefined) { if (writeRawJsonIfChanged('cs-ai-deepthink', Boolean(cp.deepThink))) anyChanged = true; }
      if (cp.autoSpeak !== undefined) { if (writeRawJsonIfChanged('cs-ai-autospeak', Boolean(cp.autoSpeak))) anyChanged = true; }
      if (cp.gradeAdm) { if (writeRawJsonIfChanged('cs-grade-adm', cp.gradeAdm)) anyChanged = true; }
      if (cp.gradeV2) { if (writeRawJsonIfChanged('cs-grade-v2', cp.gradeV2)) anyChanged = true; }
      if (Array.isArray(cp.gradeHistoryV2)) { if (writeRawJsonIfChanged('cs-grade-history-v2', cp.gradeHistoryV2)) anyChanged = true; }
      if (cp.homeGrade) { if (writeLS('cs-home-grade', cp.homeGrade)) anyChanged = true; }
      if (cp.roadmapGrade) { if (writeLS('cs-roadmap-grade-v2', cp.roadmapGrade)) anyChanged = true; }
      if (cp.currentSubject) { if (writeLS('elec-current-subject', cp.currentSubject)) anyChanged = true; }
      if (cp.homeExam) { if (writeRawJsonIfChanged('cs-home-exam', cp.homeExam)) anyChanged = true; }
      if (cp.theme && (cp.theme === 'dark' || cp.theme === 'light')) {
        if (writeRawJsonIfChanged('cs-theme-v2', cp.theme)) anyChanged = true;
        try { document.documentElement.dataset.theme = cp.theme; } catch { /* ignore */ }
      }
      setSyncMeta({ prefsUpdatedAt: Number(cp.updatedAt) || Date.now() });
      nextSectionTs.prefs = Number(cp.updatedAt) || Date.now();
      nextSyncedTs.prefs = Number(cp.updatedAt) || Date.now();
    } else if ((Number(local.aiPrefs?.updatedAt) || 0) > (Number(cloudState.aiPrefs?.updatedAt) || 0)) {
      shouldPushBack = true;
    }

    // 14. ELO & Lực chiến (StudentAnalytics)
    if (cloudState.eloState || local.eloState) {
      const cH = cloudState.eloState?.history || [];
      const lH = local.eloState?.history || [];
      const mH = mergeByKeyList(cH, lH, (h) => h.key || String(h.at), (h) => Number(h.at) || 0, 30);
      const newestElo = mH[0]?.after ?? Math.max(Number(cloudState.eloState?.elo) || 1200, Number(local.eloState?.elo) || 1200);
      const mergedElo = { elo: newestElo, history: mH.slice().reverse() };
      if (writeRawJsonIfChanged(`elec_student_elo_v1_${uid}`, mergedElo)) anyChanged = true;
      if (lH.length > cH.length) shouldPushBack = true;
    }

    if (cloudState.combatPower || local.combatPower) {
      const cH = cloudState.combatPower?.history || [];
      const lH = local.combatPower?.history || [];
      const mH = mergeByKeyList(cH, lH, (h) => h.key || String(h.at), (h) => Number(h.at) || 0, 30);
      const newestPow = mH[0]?.after ?? Math.max(Number(cloudState.combatPower?.power) || 1000, Number(local.combatPower?.power) || 1000);
      const mergedPow = { power: newestPow, history: mH.slice().reverse() };
      if (writeRawJsonIfChanged(`elec_student_power_v1_${uid}`, mergedPow)) anyChanged = true;
      if (lH.length > cH.length) shouldPushBack = true;
    }

    // 15. Target University, Wrong Notes, Exam Drafts, Reward Shop
    const tuPick = pickMutableSection('targetUni', cloudState.targetUni, local.targetUni, cSec, lSec, sSec);
    if (tuPick.winner === 'cloud') {
      if (tuPick.val) { if (writeRawJsonIfChanged(`elec_student_target_uni_v1_${uid}`, tuPick.val)) anyChanged = true; }
      else if (removeLSWithNotify(`elec_student_target_uni_v1_${uid}`)) anyChanged = true;
      nextSectionTs.targetUni = tuPick.nextTs;
      nextSyncedTs.targetUni = tuPick.nextTs;
    } else if (tuPick.winner === 'local') {
      shouldPushBack = true;
    } else if (cloudState.targetUni && !local.targetUni) {
      if (writeRawJsonIfChanged(`elec_student_target_uni_v1_${uid}`, cloudState.targetUni)) anyChanged = true;
    }

    const wNotePick = pickMutableSection('wrongNotes', cloudState.wrongNotes, local.wrongNotes, cSec, lSec, sSec);
    if (wNotePick.winner === 'cloud') {
      if (writeRawJsonIfChanged(`elec_wrong_notes_v1_${uid}`, wNotePick.val || {})) anyChanged = true;
      nextSectionTs.wrongNotes = wNotePick.nextTs;
      nextSyncedTs.wrongNotes = wNotePick.nextTs;
    } else if (wNotePick.winner === 'local') {
      shouldPushBack = true;
    } else {
      const mNotes = { ...(cloudState.wrongNotes || {}), ...(local.wrongNotes || {}) };
      if (Object.keys(mNotes).length > 0 && writeRawJsonIfChanged(`elec_wrong_notes_v1_${uid}`, mNotes)) anyChanged = true;
    }

    const edPick = pickMutableSection('examDrafts', cloudState.examDrafts, local.examDrafts, cSec, lSec, sSec);
    if (edPick.winner === 'cloud') {
      if (writeRawJsonIfChanged(`elec_exam_drafts_v1_${uid}`, edPick.val || {})) anyChanged = true;
      nextSectionTs.examDrafts = edPick.nextTs;
      nextSyncedTs.examDrafts = edPick.nextTs;
    } else if (edPick.winner === 'local') {
      shouldPushBack = true;
    } else {
      const mDrafts = { ...(local.examDrafts || {}) };
      Object.entries(cloudState.examDrafts || {}).forEach(([k, cd]) => {
        if (!mDrafts[k] || (Number(cd?.updatedAt) || 0) >= (Number(mDrafts[k]?.updatedAt) || 0)) {
          mDrafts[k] = cd;
        }
      });
      if (Object.keys(mDrafts).length > 0 && writeRawJsonIfChanged(`elec_exam_drafts_v1_${uid}`, mDrafts)) anyChanged = true;
    }

    if (cloudState.rewardShop || local.rewardShop) {
      const cs = cloudState.rewardShop || {};
      const ls = local.rewardShop || {};
      const rsPick = pickMutableSection('rewardShop', cloudState.rewardShop, local.rewardShop, cSec, lSec, sSec);
      const mergedShop = rsPick.winner === 'cloud'
        ? cs
        : rsPick.winner === 'local'
          ? ls
          : {
              spent: Math.max(Number(cs.spent) || 0, Number(ls.spent) || 0),
              owned: Array.from(new Set(['frame-minimal', ...(cs.owned || []), ...(ls.owned || [])])),
              equippedFrame: (Number(cSec.rewardShop) || 0) >= (Number(lSec.rewardShop) || 0)
                ? (cs.equippedFrame || ls.equippedFrame || 'frame-minimal')
                : (ls.equippedFrame || cs.equippedFrame || 'frame-minimal'),
              equippedTitle: (Number(cSec.rewardShop) || 0) >= (Number(lSec.rewardShop) || 0)
                ? (cs.equippedTitle ?? ls.equippedTitle ?? '')
                : (ls.equippedTitle ?? cs.equippedTitle ?? ''),
            };
      if (writeRawJsonIfChanged(`elec_reward_shop_v1_${uid}`, mergedShop)) anyChanged = true;
      if (rsPick.winner === 'cloud') {
        nextSectionTs.rewardShop = rsPick.nextTs;
        nextSyncedTs.rewardShop = rsPick.nextTs;
      } else if (rsPick.winner === 'local') {
        shouldPushBack = true;
      }
    }

    if (cloudState.subQuota || local.subQuota) {
      const csq = cloudState.subQuota || {};
      const lsq = local.subQuota || {};
      const sqPick = pickMutableSection('subQuota', cloudState.subQuota, local.subQuota, cSec, lSec, sSec);
      const mergedSub = sqPick.winner === 'cloud'
        ? csq
        : sqPick.winner === 'local'
          ? lsq
          : {
              ...csq,
              ...lsq,
              usedCodes: Array.from(new Set([...(csq.usedCodes || []), ...(lsq.usedCodes || [])])).slice(0, 30),
              hearts: csq.hearts !== undefined && (Number(cSec.subQuota) || 0) >= (Number(lSec.subQuota) || 0)
                ? csq.hearts
                : (lsq.hearts ?? csq.hearts ?? 5),
            };
      if (mergedSub && Object.keys(mergedSub).length > 0 && writeRawJsonIfChanged(`elec_sub_quota_v1_${uid}`, mergedSub)) {
        anyChanged = true;
      }
      if (sqPick.winner === 'local') shouldPushBack = true;
    }

    // 16. Flashcards Leitner
    if (cloudState.flashcards?.cards || local.flashcards?.cards) {
      const mergedCards = { ...(local.flashcards?.cards || {}) };
      let cNewer = false;
      Object.entries(cloudState.flashcards?.cards || {}).forEach(([qid, cCard]) => {
        const lCard = mergedCards[qid];
        if (!lCard || (Number(cCard?.lastAt) || 0) >= (Number(lCard?.lastAt) || 0)) {
          mergedCards[qid] = cCard;
          cNewer = true;
        }
      });
      if (writeRawJsonIfChanged(`cs-flashcards-v1:${uid}`, { version: 1, cards: mergedCards })) anyChanged = true;
      if (!cNewer && local.flashcards?.cards) shouldPushBack = true;
    }

    // 17. Study Plan, Weekly Plan, Roadmap Schedule, AI Strategy
    const spPick = pickMutableSection('studyPlan', cloudState.studyPlan, local.studyPlan, cSec, lSec, sSec);
    if (spPick.winner === 'cloud' && spPick.val) {
      if (writeRawJsonIfChanged(`cs-study-plan-v1:${uid}`, spPick.val)) anyChanged = true;
      nextSectionTs.studyPlan = spPick.nextTs;
      nextSyncedTs.studyPlan = spPick.nextTs;
    } else if (spPick.winner === 'local') {
      shouldPushBack = true;
    } else if (cloudState.studyPlan || local.studyPlan) {
      const cs = cloudState.studyPlan || {};
      const ls = local.studyPlan || {};
      const mergedSp = {
        settings: Object.keys(cs.settings || {}).length >= Object.keys(ls.settings || {}).length && cs.settings?.examDate ? cs.settings : (ls.settings || cs.settings),
        done: { ...(cs.done || {}), ...(ls.done || {}) },
      };
      if (writeRawJsonIfChanged(`cs-study-plan-v1:${uid}`, mergedSp)) anyChanged = true;
    }

    const wpPick = pickMutableSection('weeklyPlan', cloudState.weeklyPlan, local.weeklyPlan, cSec, lSec, sSec);
    if (wpPick.winner === 'cloud' && wpPick.val) {
      if (writeRawJsonIfChanged(`elec_weekly_plan_v1_${uid}`, wpPick.val)) anyChanged = true;
      nextSectionTs.weeklyPlan = wpPick.nextTs;
      nextSyncedTs.weeklyPlan = wpPick.nextTs;
    } else if (wpPick.winner === 'local') {
      shouldPushBack = true;
    } else if (cloudState.weeklyPlan && (!local.weeklyPlan || (local.weeklyPlan.tasks?.length || 0) === 0)) {
      if (writeRawJsonIfChanged(`elec_weekly_plan_v1_${uid}`, cloudState.weeklyPlan)) anyChanged = true;
    }

    const rsSchedPick = pickMutableSection('roadmapSchedule', cloudState.roadmapSchedule, local.roadmapSchedule, cSec, lSec, sSec);
    if (rsSchedPick.winner === 'cloud' && rsSchedPick.val) {
      if (writeRawJsonIfChanged(`elec_ai_roadmap_schedule_v1:${uid}`, rsSchedPick.val)) anyChanged = true;
      nextSectionTs.roadmapSchedule = rsSchedPick.nextTs;
      nextSyncedTs.roadmapSchedule = rsSchedPick.nextTs;
    } else if (rsSchedPick.winner === 'local') {
      shouldPushBack = true;
    } else if (cloudState.roadmapSchedule && !local.roadmapSchedule?.configuredOnce) {
      if (writeRawJsonIfChanged(`elec_ai_roadmap_schedule_v1:${uid}`, cloudState.roadmapSchedule)) anyChanged = true;
    }

    if (cloudState.aspStrategy || local.aspStrategy) {
      const cAt = Number(cloudState.aspStrategy?.appliedAt || cSec.aspStrategy || 0);
      const lAt = Number(local.aspStrategy?.appliedAt || lSec.aspStrategy || 0);
      if (cloudState.aspStrategy && (!local.aspStrategy || cAt >= lAt)) {
        if (writeRawJsonIfChanged(`elec_ai_aspiration_strategy_v2:${uid}`, cloudState.aspStrategy)) anyChanged = true;
      } else if (lAt > cAt) {
        shouldPushBack = true;
      }
    }

    // 18. AI Long-term Memory
    if (cloudState.aiMemory || local.aiMemory) {
      const cm = cloudState.aiMemory || {};
      const lm = local.aiMemory || {};
      const mergedWeak = mergeByKeyList(cm.weakTopics, lm.weakTopics, (t) => t.topic, (t) => Number(t.at) || 0, 8);
      const mergedMem = (Number(cm.lastSeen) || 0) >= (Number(lm.lastSeen) || 0)
        ? { ...lm, ...cm, weakTopics: mergedWeak }
        : { ...cm, ...lm, weakTopics: mergedWeak };
      if (Object.keys(mergedMem).length > 0 && writeRawJsonIfChanged(`cs-ai-memory:${uid}`, mergedMem)) anyChanged = true;
      if ((Number(lm.lastSeen) || 0) > (Number(cm.lastSeen) || 0)) shouldPushBack = true;
    }

    // 19. Pomodoro & ClockHub
    if (cloudState.pomodoro || local.pomodoro) {
      const cp = cloudState.pomodoro || {};
      const lp = local.pomodoro || {};
      const mHist = mergeDayMapsMax(cp.history, lp.history);
      if (Object.keys(mHist).length > 0 && writeRawJsonIfChanged('cs-pomo-history', mHist)) anyChanged = true;
      const mSess = Math.max(Number(cp.sessions) || 0, Number(lp.sessions) || 0);
      if (mSess > 0 && writeRawJsonIfChanged('cs-sessions', mSess)) anyChanged = true;

      const pomoPick = pickMutableSection('pomodoro', cloudState.pomodoro, local.pomodoro, cSec, lSec, sSec);
      const applyPomoPrefs = pomoPick.winner === 'cloud' || (!lp.tasks?.length && cp.tasks?.length);
      if (applyPomoPrefs) {
        if (cp.cfg) { if (writeRawJsonIfChanged('cs-pomodoro', cp.cfg)) anyChanged = true; }
        if (cp.goal) { if (writeRawJsonIfChanged('cs-pomo-goal', cp.goal)) anyChanged = true; }
        if (Array.isArray(cp.tasks)) { if (writeRawJsonIfChanged('cs-pomo-tasks', cp.tasks)) anyChanged = true; }
        if (cp.notify !== undefined && cp.notify !== null) writeRawJsonIfChanged('cs-pomo-notify', cp.notify);
        if (cp.sound !== undefined && cp.sound !== null) writeRawJsonIfChanged('cs-pomo-sound', cp.sound);
        if (cp.autoNext !== undefined && cp.autoNext !== null) writeRawJsonIfChanged('cs-pomo-autonext', cp.autoNext);
        if (cp.deskTheme) writeRawJsonIfChanged('cs-pomo-desk-theme', cp.deskTheme);
        if (cp.deskMascot) writeRawJsonIfChanged('cs-pomo-desk-mascot', cp.deskMascot);
        if (cp.ambientVol !== undefined && cp.ambientVol !== null) writeRawJsonIfChanged('cs-pomo-ambient-vol', cp.ambientVol);
        if (pomoPick.winner === 'cloud') {
          nextSectionTs.pomodoro = pomoPick.nextTs;
          nextSyncedTs.pomodoro = pomoPick.nextTs;
        }
      } else if (pomoPick.winner === 'local') {
        shouldPushBack = true;
      }
    }

    if (cloudState.clockHub || local.clockHub) {
      const cc = cloudState.clockHub || {};
      const lc = local.clockHub || {};
      const mFocusHist = mergeDayMapsMax(cc.focusHist, lc.focusHist);
      if (Object.keys(mFocusHist).length > 0 && writeRawJsonIfChanged('cs-ch-focus-hist', mFocusHist)) anyChanged = true;
      const mCycle = Math.max(Number(cc.focusCycle) || 0, Number(lc.focusCycle) || 0);
      if (mCycle > 0 && writeRawJsonIfChanged('cs-ch-focus-cycle', mCycle)) anyChanged = true;

      const chPick = pickMutableSection('clockHub', cloudState.clockHub, local.clockHub, cSec, lSec, sSec);
      if (chPick.winner === 'cloud' || (!lc.focusTasks?.length && cc.focusTasks?.length)) {
        if (cc.focusCfg) writeRawJsonIfChanged('cs-ch-focus-cfg', cc.focusCfg);
        if (cc.focusAuto !== undefined && cc.focusAuto !== null) writeRawJsonIfChanged('cs-ch-focus-auto', cc.focusAuto);
        if (Array.isArray(cc.focusTasks)) { if (writeRawJsonIfChanged('cs-ch-focus-tasks', cc.focusTasks)) anyChanged = true; }
        if (Array.isArray(cc.focusNotes)) writeRawJsonIfChanged('cs-ch-focus-notes', cc.focusNotes);
        if (Array.isArray(cc.customTimers)) writeRawJsonIfChanged('cs-ch-custom-timers', cc.customTimers);
        if (Array.isArray(cc.alarms)) writeRawJsonIfChanged('cs-ch-alarms', cc.alarms);
        if (Array.isArray(cc.stopwatchSaved)) writeRawJsonIfChanged('cs-ch-stopwatch-saved', cc.stopwatchSaved);
        if (Array.isArray(cc.events)) writeRawJsonIfChanged('cs-ch-events', cc.events);
        if (cc.soundPreset) writeRawJsonIfChanged('cs-ch-sound-preset', cc.soundPreset);
        if (chPick.winner === 'cloud') {
          nextSectionTs.clockHub = chPick.nextTs;
          nextSyncedTs.clockHub = chPick.nextTs;
        }
      } else if (chPick.winner === 'local') {
        shouldPushBack = true;
      }
    }

    // 20. Bài giảng hoàn thành, Công thức đánh dấu, Ghi chú bài học & Nguyên nhân lỗi sai
    const lesPick = pickMutableSection('lessonProgress', cloudState.lessons, local.lessons, cSec, lSec, sSec);
    if (cloudState.lessons) {
      const mCompleted = lesPick.winner === 'cloud'
        ? (cloudState.lessons.completed || [])
        : Array.from(new Set([...(cloudState.lessons.completed || []), ...(local.lessons?.completed || [])])).slice(0, 300);
      if (mCompleted.length > 0 && writeRawJsonIfChanged('elec-completed-lessons', mCompleted)) anyChanged = true;

      const mFormulas = lesPick.winner === 'cloud'
        ? (cloudState.lessons.bookmarkedFormulas || [])
        : Array.from(new Set([...(cloudState.lessons.bookmarkedFormulas || []), ...(local.lessons?.bookmarkedFormulas || [])])).slice(0, 200);
      if (mFormulas.length > 0 && writeRawJsonIfChanged('elec-bookmarked-formulas', mFormulas)) anyChanged = true;

      const cNotesMap = cloudState.lessons.notesByLesson || {};
      Object.entries(cNotesMap).forEach(([lessonId, noteText]) => {
        if (lesPick.winner === 'cloud' || !local.lessons?.notesByLesson?.[lessonId]) {
          if (writeLS(`elec-notes-${lessonId}`, String(noteText || ''))) anyChanged = true;
        }
      });
      if (lesPick.winner === 'cloud') {
        nextSectionTs.lessonProgress = lesPick.nextTs;
        nextSyncedTs.lessonProgress = lesPick.nextTs;
      } else if (lesPick.winner === 'local') {
        shouldPushBack = true;
      }
    }

    const wcPick = pickMutableSection('wrongCauses', cloudState.wrongCauses, local.wrongCauses, cSec, lSec, sSec);
    if (wcPick.winner === 'cloud') {
      if (writeRawJsonIfChanged('elec_wrong_causes_v1', wcPick.val || {})) anyChanged = true;
      nextSectionTs.wrongCauses = wcPick.nextTs;
      nextSyncedTs.wrongCauses = wcPick.nextTs;
    } else if (wcPick.winner === 'local') {
      shouldPushBack = true;
    } else if (cloudState.wrongCauses) {
      const mCauses = { ...(cloudState.wrongCauses || {}), ...(local.wrongCauses || {}) };
      if (Object.keys(mCauses).length > 0 && writeRawJsonIfChanged('elec_wrong_causes_v1', mCauses)) anyChanged = true;
    }

    // 21. Huy hiệu, Quiz Prefs, Periodic Favs, Career Report, Ghi chú cộng đồng
    const mAch = Array.from(new Set([...(cloudState.achievements || []), ...(local.achievements || [])]));
    if (mAch.length > 0 && writeRawJsonIfChanged('cs-achievements', mAch)) anyChanged = true;

    if (cloudState.ptFavs || local.ptFavs) {
      const ptPick = pickMutableSection('ptFavs', cloudState.ptFavs, local.ptFavs, cSec, lSec, sSec);
      const mFavs = ptPick.winner === 'cloud'
        ? (cloudState.ptFavs || [])
        : Array.from(new Set([...(cloudState.ptFavs || []), ...(local.ptFavs || [])])).slice(0, 118);
      if (mFavs.length > 0 && writeRawJsonIfChanged('pt-favs', mFavs)) anyChanged = true;
      if (ptPick.winner === 'local') shouldPushBack = true;
    }

    const qePick = pickMutableSection('quizExtras', cloudState.quizPrefs, local.quizPrefs, cSec, lSec, sSec);
    if (cloudState.quizPrefs && (qePick.winner === 'cloud' || !local.quizPrefs)) {
      if (writeRawJsonIfChanged('cs-quiz-prefs', cloudState.quizPrefs)) anyChanged = true;
    }
    if (cloudState.careerReport && (!local.careerReport || qePick.winner === 'cloud')) {
      if (writeRawJsonIfChanged('cs-career-report', cloudState.careerReport)) anyChanged = true;
    }
    if (Array.isArray(cloudState.notesLocal) && (!local.notesLocal?.length || qePick.winner === 'cloud')) {
      if (writeRawJsonIfChanged('cs-notes-local-v2', cloudState.notesLocal)) anyChanged = true;
    }
    if (Array.isArray(cloudState.notesV1) && (!local.notesV1?.length || qePick.winner === 'cloud')) {
      if (writeRawJsonIfChanged('cs-notes-v1', cloudState.notesV1)) anyChanged = true;
    }
    if (cloudState.noteVotes) {
      const mVotes = { ...(cloudState.noteVotes || {}), ...(local.noteVotes || {}) };
      if (Object.keys(mVotes).length > 0 && writeRawJsonIfChanged('cs-note-votes-v2', mVotes)) anyChanged = true;
    }

    setSyncMeta({ sectionTs: nextSectionTs, syncedSectionTs: nextSyncedTs });

    if (anyChanged) {
      dispatchAllSyncEvents(uid);
    }
  } finally {
    isApplyingRemote = false;
  }

  return { changed: anyChanged, shouldPushBack };
}

export function applyMergedTeacherState(uid, cloudTeacher) {
  if (!uid || !cloudTeacher || typeof cloudTeacher !== 'object' || typeof window === 'undefined') {
    return { changed: false, shouldPushBack: false };
  }
  const local = collectLocalTeacherState(uid);
  const meta = getSyncMeta();
  const cTs = Number(cloudTeacher.workspaceTs) || 0;
  const lTs = Number(meta.sectionTs?.teacherWorkspace) || 0;
  const preferCloud = cTs >= lTs;

  isApplyingRemote = true;
  let anyChanged = false;
  let shouldPushBack = false;

  try {
    if (Array.isArray(cloudTeacher.qbFavFilters) && (preferCloud || !local?.qbFavFilters)) {
      if (writeRawJsonIfChanged('cs-qb-fav-filters-v1', cloudTeacher.qbFavFilters)) anyChanged = true;
    }
    if (cloudTeacher.qbQMeta || local?.qbQMeta) {
      const mMeta = preferCloud
        ? { ...(local?.qbQMeta || {}), ...(cloudTeacher.qbQMeta || {}) }
        : { ...(cloudTeacher.qbQMeta || {}), ...(local?.qbQMeta || {}) };
      if (Object.keys(mMeta).length > 0 && writeRawJsonIfChanged('cs-qb-qmeta-v1', mMeta)) anyChanged = true;
    }
    if (Array.isArray(cloudTeacher.shuffleHistory) || Array.isArray(local?.shuffleHistory)) {
      const mShuf = mergeByKeyList(
        cloudTeacher.shuffleHistory,
        local?.shuffleHistory,
        (s) => String(s.id || s.createdAt || s.title),
        (s) => Number(s.createdAt || s.at) || 0,
        20
      );
      if (mShuf.length > 0 && writeRawJsonIfChanged('cs-shuffle-history-v1', mShuf)) anyChanged = true;
    }
    if (cloudTeacher.teacherTheme && (preferCloud || !local?.teacherTheme)) {
      if (writeLS('elec_teacher_theme', cloudTeacher.teacherTheme)) anyChanged = true;
    }
    if (cloudTeacher.teacherRailCollapsed !== undefined && cloudTeacher.teacherRailCollapsed !== '' && (preferCloud || !local?.teacherRailCollapsed)) {
      if (writeLS('elec_teacher_rail_collapsed', String(cloudTeacher.teacherRailCollapsed))) anyChanged = true;
    }

    // Đồng bộ hạn mức dùng thử theo max(cloud, local) giữa các thiết bị
    const mOmr = Math.max(Number(cloudTeacher.omrTrialUsed) || 0, Number(local?.omrTrialUsed) || 0);
    if (mOmr > 0 && writeLS(`elec-omr-trial-count:${uid}`, String(mOmr))) anyChanged = true;
    if ((local?.omrTrialUsed || 0) > (cloudTeacher.omrTrialUsed || 0)) shouldPushBack = true;

    const mWord = Math.max(Number(cloudTeacher.wordImportTrialUsed) || 0, Number(local?.wordImportTrialUsed) || 0);
    if (mWord > 0 && writeLS(`elec-word-import-trial-count:${uid}`, String(mWord))) anyChanged = true;
    if ((local?.wordImportTrialUsed || 0) > (cloudTeacher.wordImportTrialUsed || 0)) shouldPushBack = true;

    const mManual = Math.max(Number(cloudTeacher.manualEntryTrialUsed) || 0, Number(local?.manualEntryTrialUsed) || 0);
    if (mManual > 0 && writeLS(`elec-manual-entry-trial-count:${uid}`, String(mManual))) anyChanged = true;
    if ((local?.manualEntryTrialUsed || 0) > (cloudTeacher.manualEntryTrialUsed || 0)) shouldPushBack = true;

    if (Array.isArray(cloudTeacher.paperExamsLocal) || Array.isArray(local?.paperExamsLocal)) {
      const mPaper = mergeByKeyList(
        cloudTeacher.paperExamsLocal,
        local?.paperExamsLocal,
        (p) => String(p.id),
        (p) => Date.parse(p.createdAt || 0) || 0,
        15
      );
      if (mPaper.length > 0 && writeRawJsonIfChanged('elec_paper_exams', mPaper)) anyChanged = true;
    }

    if (cloudTeacher.manualDrafts && typeof cloudTeacher.manualDrafts === 'object') {
      Object.entries(cloudTeacher.manualDrafts).forEach(([classId, cd]) => {
        const key = `cs-exam-manual-draft:${classId}`;
        const ld = readLS(key, null);
        if (!ld || (Number(cd?.savedAt) || 0) > (Number(ld?.savedAt) || 0)) {
          if (writeRawJsonIfChanged(key, cd)) anyChanged = true;
        }
      });
    }

    if (lTs > cTs) shouldPushBack = true;
    if (anyChanged) {
      window.dispatchEvent(new CustomEvent(CLOUD_SYNC_EVENT, { detail: { uid, scope: 'teacher', ts: Date.now() } }));
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
    window.dispatchEvent(new Event('cs-flashcards'));
    window.dispatchEvent(new Event('cs-study-plan'));
    window.dispatchEvent(new CustomEvent('elec-weekly-plan-changed'));
    window.dispatchEvent(new CustomEvent('elec-aspirations-change', { detail: { uid } }));
    window.dispatchEvent(new Event('cs-aspirations'));
    window.dispatchEvent(new CustomEvent('elec-fav-exams-changed'));
    window.dispatchEvent(new CustomEvent('elec-exam-history-changed'));
    window.dispatchEvent(new CustomEvent('elec-shop-updated'));
    window.dispatchEvent(new CustomEvent('elec-student-analytics-change', { detail: { uid } }));
    window.dispatchEvent(new CustomEvent('cs-wrong-questions-update', { detail: { uid } }));
    window.dispatchEvent(new CustomEvent('cs-gamification-update', { detail: { uid } }));
    window.dispatchEvent(new CustomEvent('cs-teacher-trial-quota-change'));
    window.dispatchEvent(new CustomEvent(COMPANION_SESSIONS_EVENT, { detail: { uid } }));
    window.dispatchEvent(new CustomEvent(CLOUD_SYNC_EVENT, { detail: { uid, ts: Date.now() } }));
  } catch { /* ignore */ }
}

function clampStudyPayloadSize(snapshot) {
  try {
    let raw = JSON.stringify(snapshot);
    if (raw.length <= MAX_CLOUD_BYTES) return snapshot;
    const trimmed = {
      ...snapshot,
      aiChatsBackup: Array.isArray(snapshot.aiChatsBackup) ? snapshot.aiChatsBackup.slice(0, 6) : [],
      examDrafts: {},
      careerReport: snapshot.careerReport ? { summary: snapshot.careerReport.summary, at: snapshot.careerReport.at } : null,
      notesLocal: Array.isArray(snapshot.notesLocal) ? snapshot.notesLocal.slice(0, 15) : null,
    };
    raw = JSON.stringify(trimmed);
    if (raw.length <= MAX_CLOUD_BYTES) return trimmed;
    return {
      ...trimmed,
      flashcards: snapshot.flashcards?.cards
        ? { version: 1, cards: compactObjectLimit(snapshot.flashcards.cards, 150) }
        : null,
      wrongNotebook: Array.isArray(snapshot.wrongNotebook) ? snapshot.wrongNotebook.slice(0, 25) : [],
    };
  } catch {
    return snapshot;
  }
}

/* ---------- Pull & Push Firestore users/{uid}.studyState & teacherState ---------- */
let pushTimer = null;
let lastPushedJson = '';
let lastPushedTeacherJson = '';
let activeSyncUid = '';
let unsubscribeUserDoc = null;
let lastRemoteUpdatedAt = 0;
let lastRemoteTeacherUpdatedAt = 0;
let initialPullDoneUid = '';
let initialPullPromise = null;

export async function pullCloudStudyState(uid) {
  const db = getDb();
  const auth = getAuth();
  if (!uid || !db || !firebaseMod.doc || !firebaseMod.getDoc || auth?.currentUser?.uid !== uid) return null;
  ensureStudyOwner(uid);
  try {
    const snap = await firebaseMod.getDoc(firebaseMod.doc(db, 'users', uid));
    if (!snap.exists()) {
      initialPullDoneUid = uid;
      await pushCloudStudyState(uid, true, { fromInitialPull: true });
      return null;
    }
    const data = snap.data() || {};
    const cloudState = data.studyState && typeof data.studyState === 'object' ? data.studyState : null;
    const cloudTeacher = data.teacherState && typeof data.teacherState === 'object' ? data.teacherState : null;

    let needPushBack = false;
    if (!cloudState) {
      needPushBack = true;
    } else {
      lastRemoteUpdatedAt = Math.max(
        lastRemoteUpdatedAt,
        Number(cloudState.updatedAt) || Number(data.studyStateUpdatedAt) || 0
      );
      const res = applyMergedCloudStudyState(uid, cloudState);
      if (res.shouldPushBack) needPushBack = true;
    }

    if (cloudTeacher) {
      lastRemoteTeacherUpdatedAt = Math.max(
        lastRemoteTeacherUpdatedAt,
        Number(cloudTeacher.updatedAt) || Number(data.teacherStateUpdatedAt) || 0
      );
      const tRes = applyMergedTeacherState(uid, cloudTeacher);
      if (tRes.shouldPushBack) needPushBack = true;
    } else if (collectLocalTeacherState(uid)) {
      needPushBack = true;
    }

    initialPullDoneUid = uid;
    if (needPushBack) {
      await pushCloudStudyState(uid, true, { fromInitialPull: true });
    }
    return cloudState;
  } catch (err) {
    initialPullDoneUid = uid;
    console.warn('[cloudStudySync] pull error:', err?.message || err);
    return null;
  }
}

export async function pushCloudStudyState(uid, force = false, opts = {}) {
  const db = getDb();
  const auth = getAuth();
  if (!uid || !db || !firebaseMod.doc || !firebaseMod.getDoc || !firebaseMod.setDoc || auth?.currentUser?.uid !== uid) {
    return false;
  }
  if (isApplyingRemote && !force) return false;

  // Chặn ghi đè dữ liệu cloud trước khi initial pull hoàn tất!
  if (!opts.fromInitialPull && initialPullDoneUid !== uid) {
    if (initialPullPromise) {
      try { await initialPullPromise; } catch { /* ignore */ }
    } else {
      await pullCloudStudyState(uid);
      return true;
    }
  }

  ensureStudyOwner(uid);
  const rawSnapshot = collectLocalStudyState(uid);
  if (!rawSnapshot) return false;
  const snapshot = clampStudyPayloadSize(rawSnapshot);
  const teacherSnapshot = collectLocalTeacherState(uid);

  const comparable = JSON.stringify({ ...snapshot, updatedAt: 0 });
  const comparableTeacher = teacherSnapshot ? JSON.stringify({ ...teacherSnapshot, updatedAt: 0 }) : '';

  const studyChanged = force || comparable !== lastPushedJson;
  const teacherChanged = teacherSnapshot && (force || comparableTeacher !== lastPushedTeacherJson);

  if (!studyChanged && !teacherChanged) return false;

  try {
    const userRef = firebaseMod.doc(db, 'users', uid);
    const snap = await firebaseMod.getDoc(userRef);
    const now = Date.now();
    const curUser = auth?.currentUser;
    const payload = {};
    if (studyChanged) {
      payload.studyState = snapshot;
      payload.studyStateUpdatedAt = now;
    }
    if (teacherChanged && teacherSnapshot) {
      payload.teacherState = teacherSnapshot;
      payload.teacherStateUpdatedAt = now;
    }
    if (!snap.exists()) {
      payload.uid = uid;
      payload.email = String(curUser?.email || '');
      payload.role = 'student';
      payload.displayName = String(curUser?.displayName || '');
      payload.createdAt = new Date().toISOString();
    }
    await firebaseMod.setDoc(userRef, payload, { merge: true });
    if (studyChanged) {
      lastPushedJson = comparable;
      lastRemoteUpdatedAt = Math.max(lastRemoteUpdatedAt, now);
    }
    if (teacherChanged) {
      lastPushedTeacherJson = comparableTeacher;
      lastRemoteTeacherUpdatedAt = Math.max(lastRemoteTeacherUpdatedAt, now);
    }
    return true;
  } catch (err) {
    console.warn('[cloudStudySync] push error:', err?.message || err);
    return false;
  }
}

export function schedulePushCloudStudyState(uid = activeSyncUid || getAuth()?.currentUser?.uid, delay = 900) {
  const auth = getAuth();
  if (!uid || isApplyingRemote || auth?.currentUser?.uid !== uid) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    pushCloudStudyState(uid).catch(() => {});
  }, delay);
}

export function flushCloudStudyState(uid = activeSyncUid || getAuth()?.currentUser?.uid) {
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
  const auth = getAuth();
  if (uid && auth?.currentUser?.uid === uid) {
    return pushCloudStudyState(uid, true);
  }
  return Promise.resolve(false);
}

/* ---------- Bảng ánh xạ key/event -> section cần cập nhật timestamp ---------- */
const WATCHED_KEY_SECTIONS = {
  'cs-streak-v2': 'streak',
  'cs-streak': 'streak',
  'cs-streak-freeze-count': 'streak',
  'cs-streak-passes': 'streak',
  'cs-streak-claimed-milestones': 'streak',
  'cs-pet-lastfed': 'streak',
  'cs-xp': 'xp',
  'cs-pet-food': 'petFood',
  'cs-progress-v1': 'progress',
  'cs-quiz-stats': 'quizStats',
  'cs-wrong-bank': 'wrongBank',
  'cs-srs-v2': 'srs',
  'cs-srs': 'srs',
  'gamification-v1': 'gamification',
  'cs-ai-bookmarks': 'aiBookmarks',
  'cs-ai-grade': 'prefs',
  'cs-ai-mode': 'prefs',
  'cs-ai-deepthink': 'prefs',
  'cs-ai-autospeak': 'prefs',
  'cs-grade-adm': 'prefs',
  'cs-grade-v2': 'prefs',
  'cs-grade-history-v2': 'prefs',
  'cs-theme-v2': 'prefs',
  'cs-home-grade': 'prefs',
  'cs-roadmap-grade-v2': 'prefs',
  'elec-current-subject': 'prefs',
  'cs-home-exam': 'prefs',
  'cs-pomo-history': 'pomodoro',
  'cs-pomodoro': 'pomodoro',
  'cs-sessions': 'pomodoro',
  'cs-pomo-notify': 'pomodoro',
  'cs-pomo-sound': 'pomodoro',
  'cs-pomo-autonext': 'pomodoro',
  'cs-pomo-goal': 'pomodoro',
  'cs-pomo-tasks': 'pomodoro',
  'cs-pomo-desk-theme': 'pomodoro',
  'cs-pomo-desk-mascot': 'pomodoro',
  'cs-pomo-ambient-vol': 'pomodoro',
  'cs-ch-focus-cfg': 'clockHub',
  'cs-ch-focus-cycle': 'clockHub',
  'cs-ch-focus-hist': 'clockHub',
  'cs-ch-focus-auto': 'clockHub',
  'cs-ch-focus-tasks': 'clockHub',
  'cs-ch-focus-notes': 'clockHub',
  'cs-ch-custom-timers': 'clockHub',
  'cs-ch-alarms': 'clockHub',
  'cs-ch-stopwatch-saved': 'clockHub',
  'cs-ch-events': 'clockHub',
  'cs-ch-sound-preset': 'clockHub',
  'elec-completed-lessons': 'lessonProgress',
  'elec-bookmarked-formulas': 'lessonProgress',
  'elec_wrong_causes_v1': 'wrongCauses',
  'cs-achievements': 'quizExtras',
  'cs-quiz-prefs': 'quizExtras',
  'cs-career-report': 'quizExtras',
  'cs-notes-local-v2': 'quizExtras',
  'cs-notes-v1': 'quizExtras',
  'cs-note-votes-v2': 'quizExtras',
  'pt-favs': 'ptFavs',
  'cs-qb-fav-filters-v1': 'teacherWorkspace',
  'cs-qb-qmeta-v1': 'teacherWorkspace',
  'cs-shuffle-history-v1': 'teacherWorkspace',
  'elec_teacher_theme': 'teacherWorkspace',
  'elec_teacher_rail_collapsed': 'teacherWorkspace',
  'elec_paper_exams': 'teacherWorkspace',
};

function resolveUidKeySection(key, uid) {
  if (!key) return null;
  if (WATCHED_KEY_SECTIONS[key]) return WATCHED_KEY_SECTIONS[key];
  if (key.startsWith('elec-notes-')) return 'lessonProgress';
  if (key.startsWith('cs-exam-manual-draft:')) return 'teacherWorkspace';
  if (key === `cs-wrong-notebook:${uid}`) return 'wrongNotebook';
  if (key === `elec-aspirations-v2:${uid}` || key === `cs-aspirations-v1:${uid}`) return 'aspirations';
  if (key === `elec_exam_history_v1_${uid}`) return 'examHistory';
  if (key === `elec_fav_exams_v1_${uid}`) return 'favExams';
  if (key === `cs-roadmap-v1:${uid}` || key === `cs-roadmap-checkpoints-v1:${uid}`) return 'roadmap';
  if (key === `cs-elec-companion-sessions:${uid}` || key === `cs-ai-chats:${uid}`) return 'chats';
  if (key === `elec_student_elo_v1_${uid}`) return 'elo';
  if (key === `elec_student_power_v1_${uid}`) return 'combatPower';
  if (key === `elec_student_target_uni_v1_${uid}`) return 'targetUni';
  if (key === `elec_wrong_notes_v1_${uid}`) return 'wrongNotes';
  if (key === `elec_exam_drafts_v1_${uid}`) return 'examDrafts';
  if (key === `elec_reward_shop_v1_${uid}`) return 'rewardShop';
  if (key === `elec_sub_quota_v1_${uid}`) return 'subQuota';
  if (key === `cs-flashcards-v1:${uid}`) return 'flashcards';
  if (key === `cs-study-plan-v1:${uid}`) return 'studyPlan';
  if (key === `elec_weekly_plan_v1_${uid}`) return 'weeklyPlan';
  if (key === `elec_ai_roadmap_schedule_v1:${uid}`) return 'roadmapSchedule';
  if (key === `elec_ai_aspiration_strategy_v2:${uid}`) return 'aspStrategy';
  if (key === `cs-ai-memory:${uid}`) return 'aiMemory';
  if (
    key === `elec-omr-trial-count:${uid}` ||
    key === `elec-word-import-trial-count:${uid}` ||
    key === `elec-manual-entry-trial-count:${uid}`
  ) return 'teacherWorkspace';
  return null;
}

const EVENT_SECTIONS = {
  'cs-streak-change': ['streak'],
  'cs-streak-ui-sync': ['streak'],
  'cs-progress': ['progress'],
  'cs-roadmap': ['roadmap'],
  'cs-flashcards': ['flashcards'],
  'cs-study-plan': ['studyPlan'],
  'elec-weekly-plan-changed': ['weeklyPlan'],
  'elec-ai-strategy-applied': ['aspStrategy'],
  'elec-aspirations-change': ['aspirations'],
  'elec-fav-exams-changed': ['favExams'],
  'elec-exam-history-changed': ['examHistory'],
  'elec-shop-updated': ['rewardShop'],
  'elec-quota-changed': ['subQuota'],
  'elec-student-analytics-change': ['elo', 'combatPower', 'targetUni', 'wrongNotes', 'examDrafts', 'rewardShop'],
  'cs-wrong-questions-update': ['wrongNotebook'],
  'cs-gamification-update': ['gamification'],
  'cs-teacher-trial-quota-change': ['teacherWorkspace'],
  'elec-subject-change': ['prefs'],
  [COMPANION_SESSIONS_EVENT]: ['chats'],
};

/**
 * Kích hoạt đồng bộ tự động (pull ban đầu + realtime listener + tự đẩy mọi thay đổi).
 */
export function initCloudStudySyncForUser(uid) {
  if (!uid || typeof window === 'undefined') return () => {};
  if (activeSyncUid === uid && unsubscribeUserDoc) return unsubscribeUserDoc;

  stopCloudStudySync();
  activeSyncUid = uid;
  initialPullDoneUid = '';
  ensureStudyOwner(uid);

  // 1. Kéo ngay lập tức từ Firestore và khóa initialPullPromise trước khi cho phép push
  initialPullPromise = pullCloudStudyState(uid).catch(() => {});

  // 2. Lắng nghe realtime document users/{uid} (ĐT cập nhật -> PC tự đổi ngay!)
  let unsubSnap = null;
  const db = getDb();
  if (db && firebaseMod.onSnapshot && firebaseMod.doc) {
    try {
      unsubSnap = firebaseMod.onSnapshot(firebaseMod.doc(db, 'users', uid), (snap) => {
        if (!snap.exists() || snap.metadata?.hasPendingWrites) return;
        const data = snap.data() || {};
        const cloudState = data.studyState;
        const cloudTeacher = data.teacherState;

        if (cloudState && typeof cloudState === 'object') {
          const remoteTs = Number(cloudState.updatedAt) || Number(data.studyStateUpdatedAt) || 0;
          if (remoteTs > lastRemoteUpdatedAt) {
            lastRemoteUpdatedAt = remoteTs;
            applyMergedCloudStudyState(uid, cloudState);
          }
        }
        if (cloudTeacher && typeof cloudTeacher === 'object') {
          const remoteTTs = Number(cloudTeacher.updatedAt) || Number(data.teacherStateUpdatedAt) || 0;
          if (remoteTTs > lastRemoteTeacherUpdatedAt) {
            lastRemoteTeacherUpdatedAt = remoteTTs;
            applyMergedTeacherState(uid, cloudTeacher);
          }
        }
      }, () => {});
    } catch { /* ignore */ }
  }

  // 3. Tự động đẩy mỗi khi dữ liệu học tập / giảng dạy thay đổi
  const onMutate = (e) => {
    if (isApplyingRemote) return;
    const secs = EVENT_SECTIONS[e?.type];
    if (secs) bumpSectionTs(secs);
    schedulePushCloudStudyState(uid, 900);
  };
  const onCsLs = (e) => {
    if (isApplyingRemote) return;
    const sec = resolveUidKeySection(e?.detail, uid);
    if (sec) {
      bumpSectionTs([sec]);
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

  Object.keys(EVENT_SECTIONS).forEach((evt) => {
    window.addEventListener(evt, onMutate);
  });
  window.addEventListener('cs-ls', onCsLs);
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', onPageHide);

  unsubscribeUserDoc = () => {
    if (pushTimer) { clearTimeout(pushTimer); pushTimer = null; }
    try { unsubSnap?.(); } catch { /* ignore */ }
    Object.keys(EVENT_SECTIONS).forEach((evt) => {
      window.removeEventListener(evt, onMutate);
    });
    window.removeEventListener('cs-ls', onCsLs);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pagehide', onPageHide);
    unsubscribeUserDoc = null;
    activeSyncUid = '';
    initialPullPromise = null;
  };

  return unsubscribeUserDoc;
}

export function stopCloudStudySync() {
  if (typeof unsubscribeUserDoc === 'function') {
    unsubscribeUserDoc();
  }
}
