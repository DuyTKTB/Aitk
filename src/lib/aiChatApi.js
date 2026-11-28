/* ============================================================
   aiChatApi.js — Đồng bộ lịch sử chat AI & Teacher Studio lên Firebase Firestore
   ------------------------------------------------------------
   • Dùng collection `ai_chats` trên Firestore (khớp firestore.rules:
     resource.data.user_id == request.auth.uid) thay cho Supabase vốn luôn bị
     tắt do người dùng đăng nhập bằng Firebase Auth.
   • Tự động dọn dữ liệu thừa (ảnh base64, text quá dài) & lọc `undefined`
     để không bao giờ vượt giới hạn 1MB/document của Firestore.
   • Hợp nhất thông minh dữ liệu server + cục bộ (`mergeChatsById`) khi
     đăng nhập lại hoặc chuyển thiết bị cùng 1 tài khoản.
   ============================================================ */
import {
  db,
  auth,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  onSnapshot,
  limit,
  writeBatch,
} from './firebase.js';
import {
  getDeletedChatTombstones,
  isChatDeletedByTombstone,
  recordLocalChatDeleted,
  recordLocalAllChatsCleared,
  schedulePushCloudStudyState,
} from './cloudStudySync.js';

const COLLECTION = 'ai_chats';
const MAX_CHATS = 100;
const MAX_CLOUD_MESSAGES = 60;
const MAX_CLOUD_MSG_CHARS = 12000;
const MAX_CLOUD_DOC_TEXT_CHARS = 1500;

function activeFirebaseUid(expectedUid) {
  const curUid = auth?.currentUser?.uid || '';
  if (!curUid) return '';
  if (expectedUid && curUid !== expectedUid) return '';
  return curUid;
}

function canSyncFirestore(expectedUid) {
  return Boolean(db && activeFirebaseUid(expectedUid));
}

export function chatDocId(userId, chatId) {
  const cleanUid = String(userId || '').replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanChat = String(chatId || '').replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${cleanUid}__${cleanChat}`;
}

/**
 * Giữ lại helper toValidUUID để tương thích ngược nếu module khác gọi.
 */
export function toValidUUID(str) {
  if (!str) return null;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)) {
    return str;
  }
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57, h3 = 0x9e3779b9, h4 = 0x85ebca6b;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 0x265e5a1b);
    h2 = Math.imul(h2 ^ ch, 0x9e3779b9);
    h3 = Math.imul(h3 ^ ch, 0x85ebca6b);
    h4 = Math.imul(h4 ^ ch, 0xc2b2ae35);
  }
  const toHex = (n) => (n >>> 0).toString(16).padStart(8, '0');
  const hex = (toHex(h1) + toHex(h2) + toHex(h3) + toHex(h4)).toLowerCase();
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

/**
 * Loại bỏ mọi giá trị `undefined`, `NaN`, `Infinity` đệ quy để Firestore setDoc không báo lỗi.
 */
export function sanitizeForFirestore(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
  if (typeof val === 'string' || typeof val === 'boolean') return val;
  if (Array.isArray(val)) return val.map((item) => sanitizeForFirestore(item));
  if (typeof val === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(val)) {
      if (v === undefined || typeof v === 'function' || typeof v === 'symbol') continue;
      out[k] = sanitizeForFirestore(v);
    }
    return out;
  }
  return String(val);
}

/**
 * Rút gọn ảnh base64 / tài liệu quá nặng trước khi đẩy lên Firestore (< 1MB/doc).
 */
export function prepareMessagesForCloud(messages) {
  if (!Array.isArray(messages)) return [];
  return messages.slice(-MAX_CLOUD_MESSAGES).map((m) => {
    if (!m || typeof m !== 'object') return { role: 'user', text: String(m || '') };
    const copy = { ...m };

    if (Array.isArray(copy.parts)) {
      copy.parts = copy.parts.map((p) => {
        if (!p || typeof p !== 'object') return p;
        if (p.inlineData) return { text: '[ảnh đã gửi]' };
        if (typeof p.text === 'string' && p.text.length > MAX_CLOUD_MSG_CHARS) {
          return { ...p, text: `${p.text.slice(0, MAX_CLOUD_MSG_CHARS)}\n...(đã rút gọn khi đồng bộ)` };
        }
        return p;
      });
    }

    if (typeof copy.text === 'string' && copy.text.length > MAX_CLOUD_MSG_CHARS) {
      copy.text = `${copy.text.slice(0, MAX_CLOUD_MSG_CHARS)}\n...(đã rút gọn khi đồng bộ)`;
    }

    if (copy.preview && typeof copy.preview === 'object') {
      const nextPreview = { ...copy.preview };
      if (Array.isArray(nextPreview.images)) {
        nextPreview.images = nextPreview.images.map((im) => ({
          width: im?.width || 0,
          height: im?.height || 0,
          name: im?.name || 'ảnh',
        }));
      }
      if (Array.isArray(nextPreview.docs)) {
        nextPreview.docs = nextPreview.docs.map((d) => ({
          id: d?.id || d?.name || 'doc',
          kind: d?.kind || 'file',
          name: d?.name || 'Tài liệu',
          size: d?.size || 0,
          metaLabel: d?.metaLabel || '',
          text: typeof d?.text === 'string' ? d.text.slice(0, MAX_CLOUD_DOC_TEXT_CHARS) : '',
        }));
      }
      copy.preview = nextPreview;
    }

    return sanitizeForFirestore(copy);
  });
}

/**
 * Hợp nhất danh sách chat cloud + cục bộ theo ID (giữ bản mới hơn, không làm mất tin nhắn).
 */
export function mergeChatsById(serverChats = [], localChats = []) {
  const byId = new Map();
  const normalize = (c) => {
    if (!c || !c.id) return null;
    const updatedAt = Number(c.updatedAt || (c.updated_at ? new Date(c.updated_at).getTime() : 0) || c.createdAt || 0);
    const createdAt = Number(c.createdAt || (c.created_at ? new Date(c.created_at).getTime() : 0) || updatedAt || Date.now());
    return {
      ...c,
      id: String(c.id),
      title: c.title || 'Trò chuyện mới',
      messages: Array.isArray(c.messages) ? c.messages : [],
      createdAt,
      updatedAt,
    };
  };

  for (const raw of (localChats || [])) {
    const item = normalize(raw);
    if (item) byId.set(item.id, item);
  }

  for (const raw of (serverChats || [])) {
    const srv = normalize(raw);
    if (!srv) continue;
    const prev = byId.get(srv.id);
    if (!prev) {
      byId.set(srv.id, srv);
      continue;
    }
    const prevLen = prev.messages?.length || 0;
    const srvLen = srv.messages?.length || 0;
    // Ưu tiên bản mới hơn theo updatedAt; nếu cùng mốc thì giữ bản có nhiều tin nhắn hơn
    if (srv.updatedAt > prev.updatedAt || (srv.updatedAt === prev.updatedAt && srvLen >= prevLen)) {
      byId.set(srv.id, srv);
    }
  }

  return Array.from(byId.values())
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    .slice(0, MAX_CHATS);
}

/**
 * Lấy danh sách chat của user từ Firebase Firestore `ai_chats` + fallback users/{uid}.studyState.aiChatsBackup.
 */
export async function fetchChats(userId) {
  if (!userId || !canSyncFirestore(userId)) return [];
  const uid = activeFirebaseUid(userId);
  const byId = new Map();
  const tombstones = getDeletedChatTombstones(uid);

  const ingest = (raw) => {
    if (!raw || !raw.id) return;
    if (isChatDeletedByTombstone(raw, tombstones)) return;
    const prev = byId.get(String(raw.id));
    const curUpd = Number(raw.updated_at || raw.updatedAt || raw.created_at || 0);
    const prevUpd = prev ? Number(prev.updated_at || prev.updatedAt || prev.created_at || 0) : -1;
    if (!prev || curUpd > prevUpd || (curUpd === prevUpd && (raw.messages?.length || 0) >= (prev.messages?.length || 0))) {
      byId.set(String(raw.id), raw);
    }
  };

  try {
    const q = query(
      collection(db, COLLECTION),
      where('user_id', '==', uid),
      limit(MAX_CHATS + 10)
    );
    const snap = await getDocs(q);
    snap.forEach((docSnap) => {
      const d = docSnap.data() || {};
      if (d.kind === 'teacher_studio' || d.kind === 'teacher_floating') return;
      ingest({
        id: d.chat_id || docSnap.id,
        title: d.title || 'Trò chuyện mới',
        messages: Array.isArray(d.messages) ? d.messages : [],
        pinned: Boolean(d.pinned),
        created_at: d.created_at || Date.now(),
        updated_at: d.updated_at || d.created_at || Date.now(),
      });
    });
  } catch (err) {
    console.warn('[aiChatApi] fetchChats Firestore error:', err?.message || err);
  }

  // Fallback / bổ sung từ users/{uid}.studyState (nếu ai_chats rules chưa deploy hoặc có tombstone mới hơn)
  try {
    const uSnap = await getDoc(doc(db, 'users', uid));
    if (uSnap.exists()) {
      const st = uSnap.data()?.studyState;
      const cloudTomb = {
        ids: { ...(tombstones.ids || {}), ...(st?.aiDeletedIds || {}) },
        clearAllAt: Math.max(Number(tombstones.clearAllAt) || 0, Number(st?.aiClearAllAt) || 0),
      };
      if (Array.isArray(st?.aiChatsBackup)) {
        st.aiChatsBackup.forEach((b) => {
          if (!b || !b.id) return;
          ingest({
            id: b.id,
            title: b.title || 'Trò chuyện mới',
            messages: Array.isArray(b.messages) ? b.messages : [],
            pinned: Boolean(b.pinned),
            created_at: b.createdAt || Date.now(),
            updated_at: b.updatedAt || b.createdAt || Date.now(),
          });
        });
      }
      // Lọc lại một lần nữa theo tombstone mới nhất từ server
      for (const [id, ch] of byId.entries()) {
        if (isChatDeletedByTombstone(ch, cloudTomb)) {
          byId.delete(id);
        }
      }
    }
  } catch { /* ignore */ }

  const rows = Array.from(byId.values());
  rows.sort((a, b) => Number(b.updated_at || 0) - Number(a.updated_at || 0));
  return rows.slice(0, MAX_CHATS);
}

/**
 * Lắng nghe realtime các đoạn chat học sinh trên Firestore `ai_chats` (Mobile <-> Desktop tức thì).
 */
export function subscribeChatsRealtime(userId, onUpdate) {
  if (!userId || !canSyncFirestore(userId) || typeof onSnapshot !== 'function') return () => {};
  const uid = activeFirebaseUid(userId);
  if (!uid) return () => {};
  try {
    const q = query(
      collection(db, COLLECTION),
      where('user_id', '==', uid),
      limit(MAX_CHATS + 10)
    );
    return onSnapshot(q, (snap) => {
      if (snap.metadata?.hasPendingWrites) return;
      const tombstones = getDeletedChatTombstones(uid);
      const list = [];
      snap.forEach((docSnap) => {
        const d = docSnap.data() || {};
        if (d.kind === 'teacher_studio' || d.kind === 'teacher_floating') return;
        const item = {
          id: String(d.chat_id || docSnap.id),
          title: d.title || 'Trò chuyện mới',
          messages: Array.isArray(d.messages) ? d.messages : [],
          pinned: Boolean(d.pinned),
          created_at: d.created_at || Date.now(),
          updated_at: d.updated_at || d.created_at || Date.now(),
        };
        if (!isChatDeletedByTombstone(item, tombstones)) {
          list.push(item);
        }
      });
      list.sort((a, b) => Number(b.updated_at || 0) - Number(a.updated_at || 0));
      onUpdate?.(list.slice(0, MAX_CHATS));
    }, () => {});
  } catch {
    return () => {};
  }
}

/**
 * Tạo đoạn chat mới trên Firestore `ai_chats`.
 */
export async function createChat(userId, chat) {
  if (!userId || !chat?.id || !canSyncFirestore(userId)) return null;
  const uid = activeFirebaseUid(userId);
  const docId = chatDocId(uid, chat.id);
  const now = Date.now();
  const payload = sanitizeForFirestore({
    chat_id: String(chat.id),
    user_id: uid,
    kind: 'student_chat',
    title: String(chat.title || 'Trò chuyện mới').slice(0, 120),
    messages: prepareMessagesForCloud(chat.messages || []),
    pinned: Boolean(chat.pinned),
    created_at: Number(chat.createdAt || now),
    updated_at: Number(chat.updatedAt || now),
  });

  try {
    await setDoc(doc(db, COLLECTION, docId), payload, { merge: true });
    schedulePushCloudStudyState(uid, 900);
    return payload;
  } catch (err) {
    console.warn('[aiChatApi] createChat Firestore error:', err?.message || err);
    schedulePushCloudStudyState(uid, 500);
    return null;
  }
}

/**
 * Cập nhật đoạn chat (tự tạo doc nếu trước đó chưa kịp đẩy lên cloud).
 */
export async function updateChat(chatId, updates = {}) {
  if (!chatId) return null;
  const uid = activeFirebaseUid(updates.userId);
  if (!uid || !db) return null;

  const docId = chatDocId(uid, chatId);
  const patch = {
    chat_id: String(chatId),
    user_id: uid,
    kind: 'student_chat',
    updated_at: Date.now(),
  };
  if (updates.title !== undefined) patch.title = String(updates.title || 'Trò chuyện mới').slice(0, 120);
  if (updates.messages !== undefined) patch.messages = prepareMessagesForCloud(updates.messages);
  if (updates.pinned !== undefined) patch.pinned = Boolean(updates.pinned);

  try {
    await setDoc(doc(db, COLLECTION, docId), sanitizeForFirestore(patch), { merge: true });
    schedulePushCloudStudyState(uid, 900);
    return patch;
  } catch (err) {
    console.warn('[aiChatApi] updateChat Firestore error:', err?.message || err);
    schedulePushCloudStudyState(uid, 500);
    return null;
  }
}

/**
 * Xóa 1 đoạn chat trên Firestore + ghi tombstone để thiết bị khác không hồi sinh.
 */
export async function deleteChat(chatId, userId = '') {
  if (!chatId) return;
  const uid = activeFirebaseUid(userId);
  if (!uid || !db) return;
  recordLocalChatDeleted(uid, chatId);
  try {
    await deleteDoc(doc(db, COLLECTION, chatDocId(uid, chatId)));
  } catch { /* ignore */ }
}

/**
 * Xóa toàn bộ lịch sử chat học sinh của user trên Firestore (giữ nguyên phiên Teacher Studio).
 */
export async function deleteAllChats(userId) {
  if (!userId || !canSyncFirestore(userId)) return;
  const uid = activeFirebaseUid(userId);
  recordLocalAllChatsCleared(uid);
  try {
    const q = query(collection(db, COLLECTION), where('user_id', '==', uid));
    const snap = await getDocs(q);
    if (snap.empty) return;
    const batch = writeBatch(db);
    let count = 0;
    snap.forEach((docSnap) => {
      const d = docSnap.data() || {};
      if (d.kind === 'teacher_studio' || d.kind === 'teacher_floating') return;
      batch.delete(docSnap.ref);
      count += 1;
    });
    if (count > 0) await batch.commit();
  } catch (err) {
    console.warn('[aiChatApi] deleteAllChats Firestore error:', err?.message || err);
  }
}

/**
 * Đẩy các cuộc trò chuyện cục bộ lên Firestore theo từng batch nhỏ.
 */
export async function migrateLocalChats(userId, localChats) {
  if (!userId || !Array.isArray(localChats) || localChats.length === 0) {
    return { migrated: 0 };
  }
  if (!canSyncFirestore(userId)) return { migrated: 0 };
  const uid = activeFirebaseUid(userId);

  const recent = [...localChats]
    .filter((c) => c && c.id)
    .sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0))
    .slice(0, 40);

  if (!recent.length) return { migrated: 0 };

  try {
    const batch = writeBatch(db);
    recent.forEach((c) => {
      const now = Date.now();
      const docRef = doc(db, COLLECTION, chatDocId(uid, c.id));
      batch.set(docRef, sanitizeForFirestore({
        chat_id: String(c.id),
        user_id: uid,
        kind: 'student_chat',
        title: String(c.title || 'Trò chuyện mới').slice(0, 120),
        messages: prepareMessagesForCloud(c.messages || []),
        pinned: Boolean(c.pinned),
        created_at: Number(c.createdAt || now),
        updated_at: Number(c.updatedAt || c.createdAt || now),
      }), { merge: true });
    });
    await batch.commit();
    return { migrated: recent.length };
  } catch (err) {
    console.warn('[aiChatApi] migrateLocalChats Firestore error:', err?.message || err);
    return { migrated: 0 };
  }
}

/* ============================================================
   TEACHER AUTOEXAM STUDIO — ĐỒNG BỘ PHIÊN SOẠN ĐỀ LÊN FIRESTORE
   ============================================================ */
export async function loadTeacherStudioState(userId) {
  if (!userId || !canSyncFirestore(userId)) return null;
  const uid = activeFirebaseUid(userId);
  try {
    const snap = await getDoc(doc(db, COLLECTION, chatDocId(uid, 'teacher_studio')));
    if (!snap.exists()) return null;
    const d = snap.data() || {};
    return {
      chatMessages: Array.isArray(d.chatMessages) ? d.chatMessages : [],
      matrixData: d.matrixData || null,
      questions: Array.isArray(d.questions) ? d.questions : [],
      topic: d.topic || '',
      selectedSubject: d.selectedSubject || '',
      step: Number(d.step) || 0,
      slots: d.slots || { grade: null, count: null, duration: null },
      updatedAt: Number(d.updated_at) || 0,
    };
  } catch (err) {
    console.warn('[aiChatApi] loadTeacherStudioState error:', err?.message || err);
    return null;
  }
}

export async function saveTeacherStudioState(userId, state = {}) {
  if (!userId || !canSyncFirestore(userId)) return null;
  const uid = activeFirebaseUid(userId);
  try {
    const payload = sanitizeForFirestore({
      chat_id: 'teacher_studio',
      user_id: uid,
      kind: 'teacher_studio',
      title: String(state.topic || 'Phiên làm việc AI Giáo viên').slice(0, 120),
      chatMessages: Array.isArray(state.chatMessages) ? state.chatMessages.slice(-40) : [],
      matrixData: state.matrixData || null,
      questions: Array.isArray(state.questions) ? state.questions.slice(0, 80) : [],
      topic: String(state.topic || ''),
      selectedSubject: String(state.selectedSubject || ''),
      step: Number(state.step) || 0,
      slots: state.slots || { grade: null, count: null, duration: null },
      updated_at: Number(state.updatedAt || Date.now()),
    });
    await setDoc(doc(db, COLLECTION, chatDocId(uid, 'teacher_studio')), payload, { merge: true });
    return payload;
  } catch (err) {
    console.warn('[aiChatApi] saveTeacherStudioState error:', err?.message || err);
    return null;
  }
}

export async function clearTeacherStudioState(userId) {
  if (!userId || !canSyncFirestore(userId)) return;
  const uid = activeFirebaseUid(userId);
  try {
    await deleteDoc(doc(db, COLLECTION, chatDocId(uid, 'teacher_studio')));
  } catch { /* ignore */ }
}

export function subscribeTeacherStudioState(userId, onUpdate) {
  if (!userId || !canSyncFirestore(userId) || typeof onSnapshot !== 'function') return () => {};
  const uid = activeFirebaseUid(userId);
  if (!uid) return () => {};
  try {
    return onSnapshot(doc(db, COLLECTION, chatDocId(uid, 'teacher_studio')), (snap) => {
      if (!snap.exists() || snap.metadata?.hasPendingWrites) return;
      const d = snap.data() || {};
      onUpdate?.({
        chatMessages: Array.isArray(d.chatMessages) ? d.chatMessages : [],
        matrixData: d.matrixData || null,
        questions: Array.isArray(d.questions) ? d.questions : [],
        topic: d.topic || '',
        selectedSubject: d.selectedSubject || '',
        step: Number(d.step) || 0,
        slots: d.slots || { grade: null, count: null, duration: null },
        updatedAt: Number(d.updated_at) || 0,
      });
    }, () => {});
  } catch {
    return () => {};
  }
}

/* ============================================================
   TEACHER FLOATING CHAT (ELEC AGENT) — ĐỒNG BỘ LÊN FIRESTORE
   ============================================================ */
export async function loadTeacherFloatingChat(userId) {
  if (!userId || !canSyncFirestore(userId)) return null;
  const uid = activeFirebaseUid(userId);
  try {
    const snap = await getDoc(doc(db, COLLECTION, chatDocId(uid, 'teacher_floating')));
    if (!snap.exists()) return null;
    const d = snap.data() || {};
    return {
      messages: Array.isArray(d.messages) ? d.messages : [],
      updatedAt: Number(d.updated_at) || 0,
      clearedAt: Number(d.cleared_at) || 0,
    };
  } catch (err) {
    console.warn('[aiChatApi] loadTeacherFloatingChat error:', err?.message || err);
    return null;
  }
}

export async function saveTeacherFloatingChat(userId, messages = [], updatedAt = Date.now()) {
  if (!userId || !canSyncFirestore(userId)) return null;
  const uid = activeFirebaseUid(userId);
  try {
    const nonStreaming = (Array.isArray(messages) ? messages : [])
      .filter((m) => m && !m.streaming && m.id && m.sender && typeof m.text === 'string')
      .slice(-50)
      .map((m) => {
        const copy = { ...m };
        delete copy.realSummary;
        delete copy.extractedImages;
        if (copy.imagePreview) {
          copy.imagePreview = { name: copy.imagePreview.name, sizeLabel: copy.imagePreview.sizeLabel };
        }
        // Không đẩy ảnh base64 nặng trong examData lên Firestore (giới hạn 1 MiB/doc)
        if (copy.examData && Array.isArray(copy.examData.questions)) {
          copy.examData = {
            ...copy.examData,
            questions: copy.examData.questions.map((q) => {
              if (!q || typeof q !== 'object') return q;
              const { image: _img, images: _imgs, optionImages: _oimgs, ...qRest } = q;
              return qRest;
            }),
          };
        }
        return copy;
      });
    const payload = sanitizeForFirestore({
      chat_id: 'teacher_floating',
      user_id: uid,
      kind: 'teacher_floating',
      title: 'ELEC Agent Giáo viên',
      messages: prepareMessagesForCloud(nonStreaming),
      updated_at: Number(updatedAt) || Date.now(),
    });
    await setDoc(doc(db, COLLECTION, chatDocId(uid, 'teacher_floating')), payload, { merge: true });
    return payload;
  } catch (err) {
    console.warn('[aiChatApi] saveTeacherFloatingChat error:', err?.message || err);
    return null;
  }
}

export async function clearTeacherFloatingChat(userId, ts = Date.now()) {
  if (!userId || !canSyncFirestore(userId)) return;
  const uid = activeFirebaseUid(userId);
  try {
    await setDoc(
      doc(db, COLLECTION, chatDocId(uid, 'teacher_floating')),
      sanitizeForFirestore({
        chat_id: 'teacher_floating',
        user_id: uid,
        kind: 'teacher_floating',
        title: 'ELEC Agent Giáo viên',
        messages: [],
        cleared_at: ts,
        updated_at: ts,
      }),
      { merge: true }
    );
  } catch { /* ignore */ }
}

export function subscribeTeacherFloatingChat(userId, onUpdate) {
  if (!userId || !canSyncFirestore(userId) || typeof onSnapshot !== 'function') return () => {};
  const uid = activeFirebaseUid(userId);
  if (!uid) return () => {};
  try {
    return onSnapshot(doc(db, COLLECTION, chatDocId(uid, 'teacher_floating')), (snap) => {
      if (!snap.exists() || snap.metadata?.hasPendingWrites) return;
      const d = snap.data() || {};
      onUpdate?.({
        messages: Array.isArray(d.messages) ? d.messages : [],
        updatedAt: Number(d.updated_at) || 0,
        clearedAt: Number(d.cleared_at) || 0,
      });
    }, () => {});
  } catch {
    return () => {};
  }
}

/**
 * Sync debounced — gọi khi có thay đổi.
 */
const syncTimers = new Map();
const pendingSyncPayloads = new Map();

export function debouncedSync(chatId, updates, delay = 1000) {
  const existing = syncTimers.get(chatId);
  if (existing) clearTimeout(existing);
  pendingSyncPayloads.set(chatId, updates);

  const timer = setTimeout(async () => {
    syncTimers.delete(chatId);
    const payload = pendingSyncPayloads.get(chatId) || updates;
    pendingSyncPayloads.delete(chatId);
    try {
      await updateChat(chatId, payload);
    } catch { /* ignore */ }
  }, delay);

  syncTimers.set(chatId, timer);
}

/**
 * Đẩy ngay mọi thay đổi đang chờ (dùng khi chuyển tab/unmount/đóng trang).
 */
export function flushPendingSyncs() {
  for (const timer of syncTimers.values()) clearTimeout(timer);
  syncTimers.clear();
  for (const [chatId, payload] of pendingSyncPayloads.entries()) {
    updateChat(chatId, payload).catch(() => {});
  }
  pendingSyncPayloads.clear();
}

/**
 * Cancel tất cả debounced timers (dùng khi đổi user).
 */
export function cancelAllSyncs() {
  for (const timer of syncTimers.values()) clearTimeout(timer);
  syncTimers.clear();
  pendingSyncPayloads.clear();
}
