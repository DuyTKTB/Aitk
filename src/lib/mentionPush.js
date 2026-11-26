/* ============================================================================
   mentionPush.js — Hệ thống @mọi người & Thông báo đẩy Thời gian thực ELEC AI
   ----------------------------------------------------------------------------
   - Phát & nhận @mọi người qua Firestore `communityMentions` (realtime onSnapshot,
     xác thực chuẩn Firebase Auth, KHÔNG bao giờ bị RTDB Permission denied!)
   - Tự động quét thêm các tin nhắn @mọi người từ kênh Chat Cộng đồng RTDB
     (`/chat/messages.json`) để hiển thị tức thì cả các lượt nhắc đã gửi trước đó
   - Đẩy thông báo 3 tầng:
       1) Web Push / OS Desktop Notification (Notification API + Service Worker)
       2) Floating Push Banner góc phải trên + nút "Bật đẩy trên máy" 1 chạm
       3) Chuông Thông Báo (NavNotificationPopover) + Âm thanh chuông nhẹ (Web Audio)
   ============================================================================ */
import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import { db } from './firebase.js';

const DB = (import.meta.env.VITE_FIREBASE_DB_URL || '').replace(/\/$/, '');
const RTDB_MSG_STREAM = DB
  ? `${DB}/chat/messages.json?orderBy=%22%24key%22&limitToLast=25`
  : '';

const PUSHED_CACHE_KEY = 'elec_pushed_mention_ids_v2';
const COOLDOWN_PREFIX = 'elec_mention_all_cd_v1:';
const SOUND_PREF_KEY = 'elec_push_sound_enabled_v1';

export const EVERYONE_MENTION_RE =
  /(^|[\s(])@(mọi\s+người|moi\s+nguoi|moinguoi|everyone|all)(?=$|[\s.,!?;:)])/iu;
export const MENTION_SPLIT_RE =
  /(@mọi\s+người|@moi\s+nguoi|@moinguoi|@everyone|@all)/giu;

export function hasEveryoneMention(text = '') {
  return EVERYONE_MENTION_RE.test(String(text || ''));
}

export function checkEveryoneCooldown(uid, channel = 'global', bypass = false) {
  if (bypass) return { ok: true, waitSec: 0 };
  try {
    const key = `${COOLDOWN_PREFIX}${uid || 'anon'}:${channel}`;
    const last = Number(localStorage.getItem(key) || 0);
    const diffMs = Date.now() - last;
    const limitMs = 3 * 60 * 1000;
    if (last && diffMs < limitMs) {
      return { ok: false, waitSec: Math.ceil((limitMs - diffMs) / 1000) };
    }
  } catch { /* ignore */ }
  return { ok: true, waitSec: 0 };
}

export function markEveryoneCooldown(uid, channel = 'global') {
  try {
    const key = `${COOLDOWN_PREFIX}${uid || 'anon'}:${channel}`;
    localStorage.setItem(key, String(Date.now()));
  } catch { /* ignore */ }
}

/* ── QUYỀN THÔNG BÁO ĐẨY TRÌNH DUYỆT / HỆ ĐIỀU HÀNH ── */
export function getPushPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
}

export async function requestPushPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  try {
    const res = await Notification.requestPermission();
    window.dispatchEvent(new CustomEvent('elec-push-perm-changed', { detail: res }));
    return res;
  } catch {
    return Notification.permission || 'denied';
  }
}

/* ── ÂM THANH CHUÔNG NHẸ (WEB AUDIO API) ── */
export function playPushChime() {
  try {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(SOUND_PREF_KEY) === '0') return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    const notes = [880, 1174.66];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.085);
      gain.gain.setValueAtTime(0.0001, now + idx * 0.085);
      gain.gain.exponentialRampToValueAtTime(0.07, now + idx * 0.085 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.085 + 0.24);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.085);
      osc.stop(now + idx * 0.085 + 0.26);
    });
    setTimeout(() => {
      try { ctx.close(); } catch { /* ignore */ }
    }, 600);
  } catch { /* ignore */ }
}

function hasAlreadyPushed(id) {
  if (!id) return false;
  try {
    const arr = JSON.parse(localStorage.getItem(PUSHED_CACHE_KEY) || '[]');
    return Array.isArray(arr) && arr.includes(id);
  } catch {
    return false;
  }
}

function recordPushedId(id) {
  if (!id) return;
  try {
    const prev = JSON.parse(localStorage.getItem(PUSHED_CACHE_KEY) || '[]');
    const next = Array.from(new Set([...(Array.isArray(prev) ? prev : []), id])).slice(-60);
    localStorage.setItem(PUSHED_CACHE_KEY, JSON.stringify(next));
  } catch { /* ignore */ }
}

/**
 * Kích hoạt thông báo đẩy đa tầng (In-App Floating Banner + OS Push Notification + Âm thanh)
 */
export async function fireElecPushNotification({
  id,
  title = 'Cộng đồng ELEC AI',
  body = '',
  tag = 'elec-mention-all',
  channel = 'community',
  authorName = '',
  authorPhoto = '',
  isSelf = false,
  force = false,
}) {
  if (!force && id && hasAlreadyPushed(id)) return false;
  if (id) recordPushedId(id);

  playPushChime();

  // Tầng 1: Floating Push Banner góc phải trên (luôn hiển thị ngay lập tức!)
  try {
    window.dispatchEvent(
      new CustomEvent('elec-live-push-banner', {
        detail: {
          id: id || `push_${Date.now()}`,
          title,
          body,
          channel,
          authorName,
          authorPhoto,
          isSelf,
          at: Date.now(),
        },
      })
    );
  } catch { /* ignore */ }

  // Tầng 2: Thông báo đẩy hệ điều hành / trình duyệt (khi đã cấp quyền Notification)
  if (getPushPermission() === 'granted') {
    const notifOptions = {
      body: String(body || '').slice(0, 180),
      icon: '/img/elec/elec-cool.png',
      badge: '/img/elec/elec-cool.png',
      tag,
      renotify: true,
      vibrate: [120, 60, 120],
      data: { url: '/#home', channel },
    };
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        if (reg && typeof reg.showNotification === 'function') {
          await reg.showNotification(title, notifOptions);
          return true;
        }
      }
      const n = new Notification(title, notifOptions);
      n.onclick = () => {
        try {
          window.focus();
          window.dispatchEvent(
            new CustomEvent('elec-open-community-chat', { detail: { tab: channel } })
          );
          n.close();
        } catch { /* ignore */ }
      };
      return true;
    } catch { /* ignore */ }
  }
  return true;
}

/**
 * Phát sự kiện @mọi người lên Firestore `communityMentions` để toàn bộ thành viên
 * nhận thông báo đẩy tức thì + hiện xác nhận đẩy ngay cho chính người gửi!
 */
export async function broadcastEveryoneMention({
  channel = 'feed', // 'feed' | 'community_chat' | 'class_chat'
  channelName = 'Cộng đồng ELEC',
  classId = '',
  authorUid,
  authorName = 'Thành viên ELEC',
  authorPhoto = '',
  text = '',
  postId = '',
}) {
  if (!authorUid || !String(text || '').trim()) return null;
  const now = Date.now();
  const payload = {
    channel,
    channelName: String(channelName || 'Cộng đồng ELEC').slice(0, 60),
    classId: String(classId || '').slice(0, 60),
    authorUid,
    authorName: String(authorName || 'Thành viên ELEC').slice(0, 40),
    authorPhoto:
      typeof authorPhoto === 'string' && /^https?:\/\//.test(authorPhoto) ? authorPhoto : '',
    text: String(text || '').trim().slice(0, 260),
    postId: String(postId || '').slice(0, 60),
    at: now,
  };

  let createdId = `local_${now}`;
  try {
    const docRef = await addDoc(collection(db, 'communityMentions'), payload);
    createdId = docRef.id;
  } catch (err) {
    console.warn('[mentionPush] Firestore communityMentions write fallback:', err?.code || err?.message);
  }

  // Hiện ngay Floating Push Banner xác nhận cho chính người gửi (để biết chắc chắn đã đẩy thành công!)
  const targetTab = channel === 'class_chat' ? 'class' : channel === 'feed' ? 'feed' : 'community';
  fireElecPushNotification({
    id: `self_sent_${createdId}`,
    title:
      channel === 'class_chat'
        ? `Đã đẩy thông báo @mọi người tới lớp ${payload.channelName}`
        : 'Đã đẩy thông báo @mọi người tới Cộng đồng ELEC!',
    body: payload.text,
    tag: `elec-mention-self-${channel}`,
    channel: targetTab,
    authorName: payload.authorName,
    authorPhoto: payload.authorPhoto,
    isSelf: true,
    force: true,
  });

  // Cập nhật ngay vào danh sách local để Chuông Thông Báo hiển thị tức thì (0ms)
  const optimisticItem = { id: createdId, ...payload };
  _fsMentions = [optimisticItem, ..._fsMentions.filter((x) => x.id !== createdId)].slice(0, 25);
  rebuildMergedMentions([]);

  return optimisticItem;
}

/* ── SINGLETON SUBSCRIBER (FIRESTORE communityMentions + RTDB /chat/messages) ── */
let _fsMentions = [];
let _rtdbMentions = [];
let _mergedMentions = [];
let _mentionListeners = new Set();
let _unsubFs = null;
let _rtdbEs = null;
let _rtdbPoll = null;
let _mentionStartedAt = 0;
let _mentionMeUid = null;
let _initialFsLoaded = false;
let _initialRtdbLoaded = false;

function dedupeMentions(list) {
  const sorted = [...list].sort((a, b) => (Number(b.at) || 0) - (Number(a.at) || 0));
  const out = [];
  for (const item of sorted) {
    if (!item || !item.text) continue;
    // Khử trùng nếu cùng author + cùng text trong vòng 8 giây (VD: vừa ở Firestore vừa ở RTDB chat)
    const dup = out.some(
      (x) =>
        x.id === item.id ||
        (x.authorUid === item.authorUid &&
          x.text === item.text &&
          Math.abs((Number(x.at) || 0) - (Number(item.at) || 0)) < 8000)
    );
    if (!dup) out.push(item);
    if (out.length >= 25) break;
  }
  return out;
}

function handleFreshMentions(incoming) {
  if (!Array.isArray(incoming) || incoming.length === 0) return;
  const newlyArrived = incoming.filter(
    (item) =>
      item &&
      item.id &&
      Number(item.at) >= _mentionStartedAt - 4000 &&
      item.authorUid &&
      item.authorUid !== _mentionMeUid
  );
  newlyArrived.forEach((item) => {
    const targetTab =
      item.channel === 'class_chat' ? 'class' : item.channel === 'feed' ? 'feed' : 'community';
    const titlePrefix =
      item.channel === 'class_chat'
        ? `${item.authorName} nhắc @mọi người trong lớp ${item.channelName || ''}`.trim()
        : item.channel === 'community_chat'
          ? `${item.authorName} nhắc @mọi người trong Chat Cộng đồng`
          : `${item.authorName} vừa nhắc @mọi người trên Cộng đồng ELEC`;
    fireElecPushNotification({
      id: `mention_${item.authorUid}_${Math.floor((Number(item.at) || 0) / 5000)}`,
      title: titlePrefix,
      body: item.text,
      tag: `elec-mention-${item.channel}`,
      channel: targetTab,
      authorName: item.authorName,
      authorPhoto: item.authorPhoto,
    });
  });
}

function rebuildMergedMentions(freshItems = []) {
  _mergedMentions = dedupeMentions([..._fsMentions, ..._rtdbMentions]);
  if (freshItems.length > 0) handleFreshMentions(freshItems);
  _mentionListeners.forEach((cb) => {
    try { cb(_mergedMentions, freshItems); } catch { /* ignore */ }
  });
}

function extractRtdbMentions(rawObj) {
  if (!rawObj || typeof rawObj !== 'object') return [];
  return Object.entries(rawObj)
    .filter(([, v]) => v && typeof v === 'object' && typeof v.text === 'string' && hasEveryoneMention(v.text))
    .map(([id, v]) => ({
      id: `rtdb_${id}`,
      channel: 'community_chat',
      channelName: 'Chat Cộng đồng ELEC',
      authorUid: v.uid || 'anonymous',
      authorName: v.name || 'Thành viên ELEC',
      authorPhoto: v.photoURL || '',
      text: v.text,
      at: Number(v.t) || 0,
    }));
}

function startMentionStreams(meUid) {
  _mentionMeUid = meUid || null;
  if (_unsubFs || _rtdbEs || _rtdbPoll) return;
  _mentionStartedAt = Date.now();
  _initialFsLoaded = false;
  _initialRtdbLoaded = false;

  // 1. Luồng chính: Firestore `communityMentions` (khi đã đăng nhập)
  if (meUid && meUid !== 'anonymous') {
    try {
      const q = query(collection(db, 'communityMentions'), orderBy('at', 'desc'), limit(20));
      _unsubFs = onSnapshot(
        q,
        (snap) => {
          const prevIds = new Set(_fsMentions.map((x) => x.id));
          const nextList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          const added = _initialFsLoaded ? nextList.filter((x) => !prevIds.has(x.id)) : [];
          _initialFsLoaded = true;
          _fsMentions = nextList;
          rebuildMergedMentions(added);
        },
        () => {}
      );
    } catch { /* ignore */ }
  }

  // 2. Luồng bổ trợ: Quét trực tiếp `/chat/messages.json` (luôn đọc công khai được!)
  if (RTDB_MSG_STREAM) {
    const syncRtdbOnce = async () => {
      try {
        const r = await fetch(RTDB_MSG_STREAM);
        if (!r.ok) return;
        const data = await r.json();
        const prevIds = new Set(_rtdbMentions.map((x) => x.id));
        const nextList = extractRtdbMentions(data);
        const added = _initialRtdbLoaded ? nextList.filter((x) => !prevIds.has(x.id)) : [];
        _initialRtdbLoaded = true;
        _rtdbMentions = nextList;
        rebuildMergedMentions(added);
      } catch { /* ignore */ }
    };

    try {
      _rtdbEs = new EventSource(RTDB_MSG_STREAM);
      _rtdbEs.addEventListener('put', (e) => {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed.path === '/') {
            const prevIds = new Set(_rtdbMentions.map((x) => x.id));
            const nextList = extractRtdbMentions(parsed.data);
            const added = _initialRtdbLoaded ? nextList.filter((x) => !prevIds.has(x.id)) : [];
            _initialRtdbLoaded = true;
            _rtdbMentions = nextList;
            rebuildMergedMentions(added);
          } else if (parsed.data && typeof parsed.data === 'object' && hasEveryoneMention(parsed.data.text)) {
            const rawId = parsed.path.replace(/^\//, '').split('/')[0];
            const item = {
              id: `rtdb_${rawId}`,
              channel: 'community_chat',
              channelName: 'Chat Cộng đồng ELEC',
              authorUid: parsed.data.uid || 'anonymous',
              authorName: parsed.data.name || 'Thành viên ELEC',
              authorPhoto: parsed.data.photoURL || '',
              text: parsed.data.text,
              at: Number(parsed.data.t) || Date.now(),
            };
            if (!_rtdbMentions.some((x) => x.id === item.id)) {
              _rtdbMentions = [item, ..._rtdbMentions].slice(0, 25);
              rebuildMergedMentions([item]);
            }
          }
        } catch { /* ignore */ }
      });
      _rtdbEs.onerror = () => {
        try { _rtdbEs?.close(); } catch { /* ignore */ }
        _rtdbEs = null;
      };
    } catch {
      syncRtdbOnce();
    }

    _rtdbPoll = setInterval(() => {
      if (!_rtdbEs || _rtdbEs.readyState !== 1) syncRtdbOnce();
    }, 15000);
  }
}

function stopMentionStreams() {
  try { _unsubFs?.(); } catch { /* ignore */ }
  _unsubFs = null;
  try { _rtdbEs?.close(); } catch { /* ignore */ }
  _rtdbEs = null;
  if (_rtdbPoll) {
    clearInterval(_rtdbPoll);
    _rtdbPoll = null;
  }
}

export function subscribeEveryoneMentions(meUid, cb) {
  if (typeof cb !== 'function') return () => {};
  _mentionListeners.add(cb);
  const uidChanged = _mentionMeUid !== (meUid || null);
  if (uidChanged && (_unsubFs || _rtdbEs)) {
    stopMentionStreams();
  }
  startMentionStreams(meUid);
  if (_mergedMentions.length > 0) cb(_mergedMentions, []);

  return () => {
    _mentionListeners.delete(cb);
    if (_mentionListeners.size === 0) {
      stopMentionStreams();
    }
  };
}
