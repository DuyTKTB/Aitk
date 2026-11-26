/* ============================================================================
   mentionPush.js — Hệ thống @mọi người & Thông báo đẩy Thời gian thực ELEC AI
   ----------------------------------------------------------------------------
   - Nhận diện @mọi người / @moinguoi / @everyone / @all ở Bảng tin, Chat Cộng đồng, Chat Lớp
   - Phát tín hiệu thời gian thực qua Firebase RTDB (/chat/mentions.json) — độ trễ < 1s
   - Đẩy thông báo 3 tầng:
       1) Web Push / OS Notification (Notification API + Service Worker showNotification)
       2) Floating Push Banner góc phải trên (khi đang mở tab ELEC AI)
       3) Chuông Thông Báo (NavNotificationPopover) + Âm thanh chuông nhẹ (Web Audio API)
   - Chống spam: học sinh giới hạn 3 phút/lần; Admin / Giáo viên không bị giới hạn
   ============================================================================ */

const DB = (import.meta.env.VITE_FIREBASE_DB_URL || '').replace(/\/$/, '');
const MENTIONS_URL = DB ? `${DB}/chat/mentions.json` : '';
const MENTIONS_STREAM = DB ? `${MENTIONS_URL}?orderBy=%22%24key%22&limitToLast=20` : '';

const PUSHED_CACHE_KEY = 'elec_pushed_mention_ids_v1';
const COOLDOWN_PREFIX = 'elec_mention_all_cd_v1:';
const SOUND_PREF_KEY = 'elec_push_sound_enabled_v1';

export const EVERYONE_MENTION_RE = /(^|[\s(])@(mọi\s+người|moi\s+nguoi|moinguoi|everyone|all)(?=$|[\s.,!?;:)])/iu;
export const MENTION_SPLIT_RE = /(@mọi\s+người|@moi\s+nguoi|@moinguoi|@everyone|@all)/giu;

export function hasEveryoneMention(text = '') {
  return EVERYONE_MENTION_RE.test(String(text || ''));
}

export function checkEveryoneCooldown(uid, channel = 'global', bypass = false) {
  if (bypass) return { ok: true, waitSec: 0 };
  try {
    const key = `${COOLDOWN_PREFIX}${uid || 'anon'}:${channel}`;
    const last = Number(localStorage.getItem(key) || 0);
    const diffMs = Date.now() - last;
    const limitMs = 3 * 60 * 1000; // 3 phút chống spam @mọi người
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
    return res;
  } catch {
    return Notification.permission || 'denied';
  }
}

/* ── ÂM THANH CHUÔNG NHẸ (WEB AUDIO API — ZERO EXTERNAL FILE) ── */
export function playPushChime() {
  try {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(SOUND_PREF_KEY) === '0') return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    const notes = [880, 1174.66]; // A5 -> D6 dịu nhẹ chuẩn Apple
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.085);
      gain.gain.setValueAtTime(0.0001, now + idx * 0.085);
      gain.gain.exponentialRampToValueAtTime(0.065, now + idx * 0.085 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.085 + 0.24);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.085);
      osc.stop(now + idx * 0.085 + 0.26);
    });
    setTimeout(() => {
      try { ctx.close(); } catch { /* ignore */ }
    }, 600);
  } catch { /* ignore autoplay guard */ }
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
  force = false,
}) {
  if (!force && id && hasAlreadyPushed(id)) return false;
  if (id) recordPushedId(id);

  playPushChime();

  // Tầng 1: Floating Push Banner trong ứng dụng (luôn hiển thị dù người dùng chưa cấp quyền OS Push)
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
          at: Date.now(),
        },
      })
    );
  } catch { /* ignore */ }

  // Tầng 2: Thông báo đẩy hệ điều hành / trình duyệt (OS Desktop & Mobile Push)
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
          window.dispatchEvent(new CustomEvent('elec-open-community-chat', { detail: { tab: channel } }));
          n.close();
        } catch { /* ignore */ }
      };
      return true;
    } catch { /* ignore */ }
  }
  return true;
}

/**
 * Phát sự kiện @mọi người lên Firebase RTDB để toàn bộ thành viên nhận thông báo đẩy tức thì
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
  if (!MENTIONS_URL || !authorUid || !text.trim()) return null;
  const payload = {
    channel,
    channelName: String(channelName || 'Cộng đồng ELEC').slice(0, 60),
    classId: String(classId || '').slice(0, 60),
    authorUid,
    authorName: String(authorName || 'Thành viên ELEC').slice(0, 40),
    authorPhoto: typeof authorPhoto === 'string' && /^https?:\/\//.test(authorPhoto) ? authorPhoto : '',
    text: String(text || '').trim().slice(0, 240),
    postId: String(postId || '').slice(0, 60),
    at: Date.now(),
  };
  try {
    const resp = await fetch(MENTIONS_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!resp.ok) return null;
    const data = await resp.json().catch(() => null);
    return data?.name ? { id: data.name, ...payload } : payload;
  } catch {
    return null;
  }
}

/* ── SINGLETON SUBSCRIBER CHO TOÀN ỨNG DỤNG (1 KẾT NỐI DUY NHẤT) ── */
let _mentionList = [];
let _mentionListeners = new Set();
let _mentionEs = null;
let _mentionPoll = null;
let _mentionStartedAt = 0;
let _mentionMeUid = null;

function notifyMentionSubscribers(newItems = []) {
  _mentionListeners.forEach((cb) => {
    try { cb(_mentionList, newItems); } catch { /* ignore */ }
  });
}

function handleFreshMentions(incoming) {
  if (!Array.isArray(incoming) || incoming.length === 0) return;
  const newlyArrived = incoming.filter(
    (item) =>
      item &&
      item.id &&
      item.at >= _mentionStartedAt - 4000 &&
      item.authorUid &&
      item.authorUid !== _mentionMeUid
  );
  newlyArrived.forEach((item) => {
    const targetTab = item.channel === 'class_chat' ? 'class' : 'community';
    const titlePrefix =
      item.channel === 'class_chat'
        ? `${item.authorName} nhắc @mọi người trong lớp ${item.channelName || ''}`.trim()
        : item.channel === 'community_chat'
          ? `${item.authorName} nhắc @mọi người trong Chat Cộng đồng`
          : `${item.authorName} vừa nhắc @mọi người trên Cộng đồng ELEC`;
    fireElecPushNotification({
      id: `mention_${item.id}`,
      title: titlePrefix,
      body: item.text,
      tag: `elec-mention-${item.channel}`,
      channel: targetTab,
      authorName: item.authorName,
      authorPhoto: item.authorPhoto,
    });
  });
}

function mergeMentionSnapshot(rawObj) {
  const arr = rawObj
    ? Object.entries(rawObj)
        .filter(([, v]) => v && typeof v === 'object' && v.text)
        .map(([id, v]) => ({ id, ...v }))
        .sort((a, b) => (Number(b.at) || 0) - (Number(a.at) || 0))
    : [];
  const prevIds = new Set(_mentionList.map((x) => x.id));
  const added = arr.filter((x) => !prevIds.has(x.id));
  _mentionList = arr.slice(0, 20);
  if (added.length > 0) handleFreshMentions(added);
  notifyMentionSubscribers(added);
}

function startMentionStream(meUid) {
  if (!MENTIONS_STREAM) return;
  _mentionMeUid = meUid || null;
  if (_mentionEs || _mentionPoll) return;
  _mentionStartedAt = Date.now();

  const fetchOnce = async () => {
    try {
      const r = await fetch(MENTIONS_STREAM);
      if (!r.ok) return;
      const data = await r.json();
      mergeMentionSnapshot(data);
    } catch { /* ignore */ }
  };

  try {
    _mentionEs = new EventSource(MENTIONS_STREAM);
    _mentionEs.addEventListener('put', (e) => {
      try {
        const parsed = JSON.parse(e.data);
        if (parsed.path === '/') {
          mergeMentionSnapshot(parsed.data);
        } else if (parsed.data && typeof parsed.data === 'object') {
          const id = parsed.path.replace(/^\//, '').split('/')[0];
          if (id && parsed.data.text) {
            const item = { id, ...parsed.data };
            const exists = _mentionList.some((x) => x.id === id);
            if (!exists) {
              _mentionList = [item, ..._mentionList].slice(0, 20);
              handleFreshMentions([item]);
              notifyMentionSubscribers([item]);
            }
          }
        }
      } catch { /* ignore */ }
    });
    _mentionEs.onerror = () => {
      try { _mentionEs?.close(); } catch { /* ignore */ }
      _mentionEs = null;
    };
  } catch {
    fetchOnce();
  }

  _mentionPoll = setInterval(() => {
    if (!_mentionEs || _mentionEs.readyState !== 1) fetchOnce();
  }, 15000);
}

function stopMentionStream() {
  try { _mentionEs?.close(); } catch { /* ignore */ }
  _mentionEs = null;
  if (_mentionPoll) {
    clearInterval(_mentionPoll);
    _mentionPoll = null;
  }
}

export function subscribeEveryoneMentions(meUid, cb) {
  if (typeof cb !== 'function') return () => {};
  _mentionListeners.add(cb);
  _mentionMeUid = meUid || null;
  startMentionStream(meUid);
  if (_mentionList.length > 0) cb(_mentionList, []);

  return () => {
    _mentionListeners.delete(cb);
    if (_mentionListeners.size === 0) {
      stopMentionStream();
    }
  };
}
