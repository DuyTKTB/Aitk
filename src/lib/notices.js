/* ============================================================
   notices.js — lớp IO cho trung tâm thông báo
   ------------------------------------------------------------
   • notifyClassOwner: gửi thông báo cho chủ nhiệm lớp.
     Không bao giờ ném lỗi ra ngoài: thông báo hỏng không được
     làm hỏng thao tác nghiệp vụ (liên kết / giao đề).
   • listNotices / subscribeNotices: chỉ đọc thông báo của mình.
   • markNoticeRead / markAllNoticesRead / deleteNotice.
   Query chỉ lọc theo `toUid` (index mặc định), sắp xếp ở client
   để không phải tạo composite index.
   ============================================================ */

import {
  addDoc, collection, deleteDoc, doc, getDocs, limit, onSnapshot,
  query, serverTimestamp, updateDoc, where,
} from 'firebase/firestore';
import { db } from './firebase.js';
import { buildNotice, sortNotices } from './noticesCore.js';

const COL = 'notices';

export async function notifyClassOwner(payload) {
  try {
    const data = buildNotice(payload);
    if (!data) return null;
    const ref = await addDoc(collection(db, COL), { ...data, createdAt: serverTimestamp() });
    return ref.id;
  } catch (e) {
    console.warn('[notices] không gửi được thông báo:', e?.code || e?.message);
    return null;
  }
}

export async function listNotices(uid, max = 40) {
  if (!uid) return [];
  const q = query(collection(db, COL), where('toUid', '==', uid), limit(max));
  const snap = await getDocs(q);
  return sortNotices(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
}

/** Lắng nghe realtime; trả về hàm huỷ đăng ký. */
export function subscribeNotices(uid, onData, onError) {
  if (!uid) return () => {};
  const q = query(collection(db, COL), where('toUid', '==', uid), limit(40));
  return onSnapshot(
    q,
    (snap) => onData(sortNotices(snap.docs.map((d) => ({ id: d.id, ...d.data() })))),
    (err) => {
      console.warn('[notices] không đọc được thông báo:', err?.code || err?.message);
      onError?.(err);
    },
  );
}

export async function markNoticeRead(id) {
  if (!id) return;
  await updateDoc(doc(db, COL, id), { read: true, readAt: serverTimestamp() });
}

export async function markAllNoticesRead(list = []) {
  const pending = list.filter((n) => n && !n.read && n.id);
  await Promise.all(pending.map((n) => markNoticeRead(n.id)));
  return pending.length;
}

export async function deleteNotice(id) {
  if (!id) return;
  await deleteDoc(doc(db, COL, id));
}
