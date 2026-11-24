/* ============================================================
   adminAuditService.js — Nhật ký Kiểm toán Admin (Enterprise Audit Trail)
   ------------------------------------------------------------
   Lấy cảm hứng từ Refine / PostHog / Enterprise SaaS Control Planes:
   • Lưu bất biến (append-only) vào Firestore `admin_audit_logs/{id}`
   • Ghi nhận mọi thao tác nhạy cảm của quản trị viên:
     cấp/thu hồi PRO-VIP, đổi quyền, cộng/trừ Credit, tạo/thu hồi Key,
     xử lý báo lỗi, đổi cấu hình & bật/tắt chế độ bảo trì.
   ============================================================ */

import { db } from './firebase.js';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';

export const ADMIN_AUDIT_COLLECTION = 'admin_audit_logs';

export const AUDIT_ACTION_META = {
  grant_pro:          { label: 'Cấp GV PRO',          tone: 'ok' },
  revoke_pro:         { label: 'Thu hồi GV PRO',      tone: 'bad' },
  grant_vip:          { label: 'Cấp HS VIP',          tone: 'ok' },
  revoke_vip:         { label: 'Thu hồi HS VIP',      tone: 'bad' },
  extend_pro:         { label: 'Gia hạn VIP/PRO',     tone: 'info' },
  switch_plan:        { label: 'Đổi gói PRO ↔ VIP',   tone: 'warn' },
  adjust_credits:     { label: 'Điều chỉnh Credit',   tone: 'info' },
  change_role:        { label: 'Đổi phân quyền',      tone: 'warn' },
  create_key:         { label: 'Tạo Key / Voucher',   tone: 'ok' },
  revoke_key:         { label: 'Thu hồi Key',         tone: 'warn' },
  delete_key:         { label: 'Xóa Key',             tone: 'bad' },
  update_report:      { label: 'Xử lý Báo lỗi',       tone: 'info' },
  delete_report:      { label: 'Xóa Báo lỗi',         tone: 'bad' },
  update_settings:    { label: 'Cập nhật Cài đặt',    tone: 'info' },
  toggle_maintenance: { label: 'Bật/Tắt Bảo trì',     tone: 'bad' },
  wipe_data:          { label: 'Xóa dữ liệu lớn',     tone: 'bad' },
};

export function normalizeAuditEntry(raw = {}) {
  const createdAtMs = Number(raw.createdAtMs) || Date.now();
  const id = String(raw.id || `AUD-${createdAtMs.toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`);
  return {
    id,
    actorUid: String(raw.actorUid || '').trim().slice(0, 128),
    actorEmail: String(raw.actorEmail || '').trim().slice(0, 160),
    actorName: String(raw.actorName || '').trim().slice(0, 120),
    action: String(raw.action || 'update_settings').trim().slice(0, 64),
    target: String(raw.target || '').trim().slice(0, 160),
    targetLabel: String(raw.targetLabel || '').trim().slice(0, 200),
    summary: String(raw.summary || '').trim().slice(0, 500),
    createdAtMs,
    at: String(raw.at || new Date(createdAtMs).toLocaleString('vi-VN')),
  };
}

/**
 * Ghi 1 bản ghi kiểm toán lên Firestore (không bao giờ làm vỡ luồng chính nếu offline/rules lỗi).
 */
export async function logAdminAction({
  actor = null,
  action = 'update_settings',
  target = '',
  targetLabel = '',
  summary = '',
} = {}) {
  if (!db) return { ok: false, reason: 'no-db' };
  const entry = normalizeAuditEntry({
    actorUid: actor?.uid || actor?.id || '',
    actorEmail: actor?.email || '',
    actorName: actor?.displayName || actor?.email || 'Admin',
    action,
    target,
    targetLabel,
    summary,
    createdAtMs: Date.now(),
  });
  if (!entry.actorUid || !entry.summary) return { ok: false, reason: 'missing-fields' };

  try {
    await setDoc(doc(db, ADMIN_AUDIT_COLLECTION, entry.id), entry);
    return { ok: true, id: entry.id };
  } catch (err) {
    console.warn('[adminAuditService] logAdminAction failed:', err?.code || err?.message);
    return { ok: false, error: err };
  }
}

export async function fetchAdminAuditLogs(limitCount = 200) {
  if (!db) return [];
  const q = query(
    collection(db, ADMIN_AUDIT_COLLECTION),
    orderBy('createdAtMs', 'desc'),
    limit(Math.max(1, Math.min(500, Number(limitCount) || 200)))
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => normalizeAuditEntry({ id: d.id, ...d.data() }));
}

export function subscribeAdminAuditLogs(onData, onError, limitCount = 200) {
  if (!db) return () => {};
  const q = query(
    collection(db, ADMIN_AUDIT_COLLECTION),
    orderBy('createdAtMs', 'desc'),
    limit(Math.max(1, Math.min(500, Number(limitCount) || 200)))
  );
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => normalizeAuditEntry({ id: d.id, ...d.data() }));
      onData?.(list);
    },
    (err) => onError?.(err)
  );
}
