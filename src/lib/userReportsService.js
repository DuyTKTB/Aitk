/* ============================================================
   userReportsService.js — Đồng bộ Báo lỗi & Góp ý (User ↔ Firestore ↔ Admin)
   ------------------------------------------------------------
   • Collection Firestore: `user_reports/{reportId}`
   • Người dùng gửi báo lỗi/góp ý → lưu local tức thì + gửi thẳng lên Firestore
     để Admin nhận realtime trong trang Quản trị (#admin/reports).
   • Tự động đồng bộ ngược các báo lỗi cũ còn nằm trong localStorage lên Cloud
     khi người dùng mở Hồ sơ hoặc gửi báo lỗi mới.
   • Admin cập nhật trạng thái (Đã tiếp nhận / Đang xử lý / Đã giải quyết / Từ chối)
     và viết Phản hồi (`adminReply`) → đồng bộ ngược về trang Báo lỗi của người dùng.
   ============================================================ */

import { db } from './firebase.js';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';

export const USER_REPORTS_COLLECTION = 'user_reports';

export const REPORT_STATUSES = [
  'Đã tiếp nhận',
  'Đang xử lý',
  'Đã giải quyết',
  'Từ chối',
];

const REPORT_KEY = (uid) => `elec_user_reports_v1_${uid || 'guest'}`;

function readLocalReports(uid) {
  try {
    if (typeof localStorage === 'undefined') return [];
    return JSON.parse(localStorage.getItem(REPORT_KEY(uid)) || '[]');
  } catch {
    return [];
  }
}

function writeLocalReports(uid, list) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(REPORT_KEY(uid), JSON.stringify(list));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('elec-user-reports-changed'));
    }
  } catch { /* ignore quota */ }
}

/**
 * Chuẩn hóa 1 bản ghi báo lỗi/góp ý để ghi Firestore an toàn & khớp firestore.rules.
 */
export function normalizeReportRecord(raw = {}, fallbackUid = 'guest') {
  const createdAtMs = Number(raw.createdAtMs || raw.submittedAt) || Date.now();
  const id = String(raw.id || `RP-${createdAtMs.toString(36).toUpperCase()}`).trim();
  const kind = raw.kind === 'report' ? 'report' : 'feedback';
  const status = REPORT_STATUSES.includes(raw.status) ? raw.status : 'Đã tiếp nhận';
  const ratingNum = Number(raw.rating);
  const rating = Number.isFinite(ratingNum) && ratingNum >= 1 && ratingNum <= 5 ? Math.round(ratingNum) : 5;

  return {
    id,
    uid: String(raw.uid || fallbackUid || 'guest'),
    userName: String(raw.userName || '').trim().slice(0, 120),
    userEmail: String(raw.userEmail || raw.contact || '').trim().slice(0, 160),
    kind,
    category: String(raw.category || (kind === 'report' ? 'Báo lỗi đề thi' : 'Đánh giá')).trim().slice(0, 100),
    rating,
    content: String(raw.content || '').trim().slice(0, 3000),
    page: String(raw.page || '').trim().slice(0, 160),
    status,
    adminReply: String(raw.adminReply || '').trim().slice(0, 2000),
    adminReplyAt: Number(raw.adminReplyAt) || 0,
    adminName: String(raw.adminName || '').trim().slice(0, 120),
    createdAtMs,
    at: String(raw.at || new Date(createdAtMs).toLocaleString('vi-VN')),
  };
}

/**
 * Gộp danh sách từ Firestore và localStorage theo `id` (ưu tiên trạng thái/phản hồi mới nhất từ Cloud).
 */
export function mergeReportsList(cloudList = [], localList = []) {
  const byId = new Map();
  (Array.isArray(localList) ? localList : []).forEach((item) => {
    if (!item || !item.id) return;
    byId.set(item.id, normalizeReportRecord(item, item.uid));
  });
  (Array.isArray(cloudList) ? cloudList : []).forEach((item) => {
    if (!item || !item.id) return;
    const norm = normalizeReportRecord(item, item.uid);
    byId.set(norm.id, { ...norm, synced: true });
  });
  return Array.from(byId.values()).sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
}

/**
 * Đếm số báo lỗi/góp ý đang mở (chưa giải quyết) để hiện badge trên menu Admin.
 */
export function countOpenReports(reports = []) {
  return (Array.isArray(reports) ? reports : []).filter(
    (r) => !r?.status || r.status === 'Đã tiếp nhận' || r.status === 'Đang xử lý'
  ).length;
}

/**
 * Gửi 1 báo lỗi/góp ý lên Firestore `user_reports/{id}` để Admin nhận được ngay.
 */
export async function syncReportToCloud(uid, rawReport) {
  if (!uid || uid === 'guest' || !db) return { ok: false, reason: 'guest-or-no-db' };
  const rec = normalizeReportRecord(rawReport, uid);
  if (!rec.content) return { ok: false, reason: 'empty-content' };

  const payload = {
    id: rec.id,
    uid: rec.uid,
    userName: rec.userName,
    userEmail: rec.userEmail,
    kind: rec.kind,
    category: rec.category,
    rating: rec.rating,
    content: rec.content,
    page: rec.page,
    status: 'Đã tiếp nhận',
    adminReply: '',
    adminReplyAt: 0,
    adminName: '',
    createdAtMs: rec.createdAtMs,
    at: rec.at,
  };

  try {
    await setDoc(doc(db, USER_REPORTS_COLLECTION, rec.id), payload);
    // Đánh dấu đã đồng bộ trong localStorage
    const cur = readLocalReports(uid);
    if (cur.some((x) => x.id === rec.id)) {
      writeLocalReports(uid, cur.map((x) => (x.id === rec.id ? { ...x, ...payload, synced: true } : x)));
    }
    return { ok: true, id: rec.id };
  } catch (err) {
    console.warn('[userReportsService] syncReportToCloud failed:', err?.code || err?.message);
    return { ok: false, error: err };
  }
}

/**
 * Tự động đẩy các báo lỗi cũ còn nằm trong localStorage (chưa có cờ `synced`) lên Firestore cho Admin.
 */
export async function syncPendingLocalReports(uid, user = null) {
  if (!uid || uid === 'guest' || !db) return 0;
  const local = readLocalReports(uid);
  const pending = local.filter((r) => r && r.content && !r.synced);
  if (!pending.length) return 0;

  let uploaded = 0;
  const updated = [...local];
  for (const item of pending) {
    const enriched = {
      ...item,
      uid,
      userName: item.userName || user?.displayName || '',
      userEmail: item.userEmail || user?.email || '',
    };
    const res = await syncReportToCloud(uid, enriched);
    if (res.ok) {
      uploaded += 1;
      const idx = updated.findIndex((x) => x.id === item.id);
      if (idx >= 0) updated[idx] = { ...enriched, synced: true };
    }
  }
  if (uploaded > 0) writeLocalReports(uid, updated);
  return uploaded;
}

/**
 * Tải báo lỗi/góp ý của chính người dùng từ Firestore (có trạng thái & phản hồi mới nhất của Admin).
 */
export async function fetchUserReportsFromCloud(uid) {
  const local = readLocalReports(uid);
  if (!uid || uid === 'guest' || !db) return local;
  try {
    const q = query(collection(db, USER_REPORTS_COLLECTION), where('uid', '==', uid));
    const snap = await getDocs(q);
    const cloud = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const merged = mergeReportsList(cloud, local);
    writeLocalReports(uid, merged);
    return merged;
  } catch (err) {
    console.warn('[userReportsService] fetchUserReportsFromCloud failed:', err?.code || err?.message);
    return local;
  }
}

/**
 * Admin: tải toàn bộ báo lỗi & góp ý của mọi người dùng trên hệ thống.
 */
export async function fetchAllReportsForAdmin() {
  if (!db) return [];
  const snap = await getDocs(collection(db, USER_REPORTS_COLLECTION));
  const list = snap.docs.map((d) => normalizeReportRecord({ id: d.id, ...d.data() }));
  return list.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
}

/**
 * Admin: lắng nghe realtime toàn bộ báo lỗi/góp ý (tự cập nhật badge + danh sách).
 */
export function subscribeAdminReports(onData, onError) {
  if (!db) return () => {};
  return onSnapshot(
    collection(db, USER_REPORTS_COLLECTION),
    (snap) => {
      const list = snap.docs
        .map((d) => normalizeReportRecord({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
      onData?.(list);
    },
    (err) => {
      onError?.(err);
    }
  );
}

/**
 * Admin: cập nhật trạng thái xử lý & gửi phản hồi ngược lại cho người dùng.
 */
export async function updateReportByAdmin(reportId, { status, adminReply = '', adminName = 'Admin ELEC AI' } = {}) {
  if (!db || !reportId) throw new Error('Thiếu mã báo lỗi.');
  const safeStatus = REPORT_STATUSES.includes(status) ? status : 'Đã tiếp nhận';
  const patch = {
    status: safeStatus,
    adminReply: String(adminReply || '').trim().slice(0, 2000),
    adminReplyAt: String(adminReply || '').trim() ? Date.now() : 0,
    adminName: String(adminName || 'Admin ELEC AI').trim().slice(0, 120),
    updatedAtMs: Date.now(),
  };
  await updateDoc(doc(db, USER_REPORTS_COLLECTION, reportId), patch);
  return patch;
}

/**
 * Admin: xóa báo lỗi/góp ý (spam hoặc đã xử lý xong cần dọn dẹp).
 */
export async function deleteReportByAdmin(reportId) {
  if (!db || !reportId) throw new Error('Thiếu mã báo lỗi.');
  await deleteDoc(doc(db, USER_REPORTS_COLLECTION, reportId));
}
