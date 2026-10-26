/* ============================================================
   classTeachers.js — GIÁO VIÊN BỘ MÔN THEO LỚP (Firestore layer, v2)
   ------------------------------------------------------------
   Collections:
     class_teacher_keys/{KEY}            — key liên kết, docId CHÍNH LÀ key
     class_teachers/{classId_teacherId}  — liên kết GV ↔ lớp
     class_teacher_audit/{autoId}        — nhật ký thao tác quan trọng

   v2:
     • Key gắn sẵn MÔN HỌC bắt buộc + email người nhận (tuỳ chọn).
     • Key có maxUses (mặc định 1) — dùng hết lượt tự vô hiệu.
     • Đếm uses + usedBy; chặn 1 tài khoản dùng lại cùng key.
     • Nhật ký: tạo/thu hồi key, liên kết, gỡ liên kết, tạo báo cáo AI.
     • Trạng thái tài khoản giáo viên (đã có hồ sơ / chưa có).

   Logic thuần (đánh giá key, trạng thái, tổng hợp hoạt động) nằm ở
   classTeachersCore.js — file này chỉ lo đọc/ghi Firestore và
   re-export lại để nơi khác chỉ cần 1 import.

   Bảo mật: firestore.rules kiểm tra lại key (tồn tại, chưa thu hồi,
   chưa hết hạn, còn lượt, đúng lớp, đúng môn, không phải chủ lớp) khi
   tạo liên kết — client chỉ kiểm tra trước cho giao diện thân thiện.
   ============================================================ */

import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, addDoc,
  query, where, serverTimestamp, documentId,
} from 'firebase/firestore';
import { db } from './firebase.js';
import { notifyClassOwner } from './notices.js';
import {
  DAY, toMs, linkDocId, evaluateKey, keyStatus, isKeyUsable, AUDIT_LABEL,
  examStatus, buildTeacherActivity, studentCountOf,
} from './classTeachersCore.js';

export {
  DAY, toMs, linkDocId, evaluateKey, keyStatus, isKeyUsable, AUDIT_LABEL,
  examStatus, buildTeacherActivity, studentCountOf,
};

const KEY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomCode(len = 6) {
  const out = [];
  const buf = new Uint32Array(len);
  (globalThis.crypto || window.crypto).getRandomValues(buf);
  for (let i = 0; i < len; i++) out.push(KEY_ALPHABET[buf[i] % KEY_ALPHABET.length]);
  return out.join('');
}

/* Firestore không nhận undefined */
function stripUndefined(obj) {
  const out = {};
  Object.keys(obj).forEach((k) => { if (obj[k] !== undefined) out[k] = obj[k]; });
  return out;
}

/* ============================================================
   NHẬT KÝ (AUDIT LOG)
   ============================================================ */

/**
 * Ghi nhật ký. Không bao giờ ném lỗi ra ngoài: nhật ký hỏng không được
 * làm hỏng thao tác nghiệp vụ chính.
 */
export async function logTeacherEvent({
  classId, action, actorId, actorName = '', teacherId = '', teacherName = '',
  key = '', subject = '', detail = '',
}) {
  if (!classId || !action || !actorId) return;
  try {
    await addDoc(collection(db, 'class_teacher_audit'), stripUndefined({
      classId,
      action,
      actorId,
      actorName,
      teacherId,
      teacherName,
      key,
      subject,
      detail,
      at: serverTimestamp(),
      atMs: Date.now(),
    }));
  } catch (e) {
    console.warn('[classTeachers] không ghi được nhật ký:', e?.code || e?.message);
  }
}

export async function listClassAudit(classId, limit = 40) {
  if (!classId) return [];
  try {
    const snap = await getDocs(query(collection(db, 'class_teacher_audit'), where('classId', '==', classId)));
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (toMs(b.at) || b.atMs || 0) - (toMs(a.at) || a.atMs || 0))
      .slice(0, limit);
  } catch (e) {
    console.warn('[classTeachers] không tải được nhật ký:', e?.code || e?.message);
    return [];
  }
}

/* ============================================================
   KEY
   ============================================================ */

export async function createTeacherKey({
  classId, className, createdBy, createdByName = '',
  days = 7, subject = '', email = '', maxUses = 1,
}) {
  if (!classId || !createdBy) throw new Error('Thiếu thông tin lớp hoặc người tạo.');
  const subj = String(subject || '').trim().slice(0, 40);
  if (!subj) throw new Error('Chọn môn học cho key trước khi tạo — môn là bắt buộc.');

  const code = `GV-${randomCode(6)}`;
  const ttl = Math.max(1, Number(days) || 7);
  const uses = Math.max(1, Math.min(50, Number(maxUses) || 1));
  const expiresAt = new Date(Date.now() + ttl * DAY);

  const payload = stripUndefined({
    classId,
    className: className || '',
    createdBy,
    createdByName,
    createdAt: serverTimestamp(),
    expiresAt,
    revoked: false,
    revokeReason: '',
    days: ttl,
    subject: subj,
    email: String(email || '').trim().toLowerCase().slice(0, 120) || '',
    maxUses: uses,
    uses: 0,
    usedBy: {},
  });

  await setDoc(doc(db, 'class_teacher_keys', code), payload);
  await logTeacherEvent({
    classId, action: 'key_create', actorId: createdBy, actorName: createdByName,
    subject: subj, key: code,
    detail: `Hạn ${ttl} ngày · ${uses} lượt${payload.email ? ` · gửi ${payload.email}` : ''}`,
  });
  return { key: code, expiresAt };
}

export async function revokeTeacherKey(key, { by = '', byName = '', classId = '' } = {}) {
  if (!key) return;
  const ref = doc(db, 'class_teacher_keys', key);
  let cid = classId;
  try {
    const snap = await getDoc(ref);
    cid = cid || snap.data()?.classId || '';
  } catch { /* đọc lỗi vẫn cho thu hồi */ }

  await updateDoc(ref, {
    revoked: true,
    revokeReason: 'manual',
    revokedAt: serverTimestamp(),
  });
  if (cid) {
    await logTeacherEvent({
      classId: cid, action: 'key_revoke', actorId: by || '', actorName: byName, key,
      detail: 'Chủ nhiệm thu hồi key',
    });
  }
}

export async function listClassKeys(classId) {
  if (!classId) return [];
  const q = query(collection(db, 'class_teacher_keys'), where('classId', '==', classId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt));
}

/* ============================================================
   LIÊN KẾT
   ============================================================ */

/**
 * Giáo viên bộ môn nhập key → tạo liên kết.
 * subject của liên kết LUÔN lấy từ key (do chủ nhiệm gán) để tránh
 * việc giáo viên tự khai môn khác với phân công.
 */
export async function linkTeacherWithKey(rawKey, user, subjectHint = '') {
  const key = String(rawKey || '').trim().toUpperCase();
  if (!key) throw new Error('Nhập key liên kết trước đã.');
  if (!user?.uid) throw new Error('Bạn cần đăng nhập.');

  const kSnap = await getDoc(doc(db, 'class_teacher_keys', key));
  const k = kSnap.exists() ? kSnap.data() : null;

  const verdict = evaluateKey(k, { uid: user.uid, now: Date.now() });
  if (!verdict.ok) throw new Error(verdict.message);

  const cSnap = await getDoc(doc(db, 'classes', k.classId));
  if (!cSnap.exists()) throw new Error('Lớp của key này không còn tồn tại.');

  const id = linkDocId(k.classId, user.uid);
  const existed = await getDoc(doc(db, 'class_teachers', id));
  if (existed.exists()) throw new Error('Bạn đã liên kết với lớp này rồi.');

  const boundSubject = String(k.subject || '').trim();
  const subject = boundSubject || String(subjectHint || '').trim();
  if (!subject) throw new Error('Key này chưa gán môn. Nhập môn bạn dạy để tiếp tục.');

  const payload = stripUndefined({
    classId: k.classId,
    className: k.className || cSnap.data()?.name || '',
    teacherId: user.uid,
    teacherName: user.displayName || user.email || 'Giáo viên',
    email: user.email || '',
    key,
    linkedAt: serverTimestamp(),
    linkedAtMs: Date.now(),
    role: 'subject',
    subject,
    subjectSource: boundSubject ? 'key' : 'self',
    permissions: { assignExam: true, viewOwnStats: true },
  });

  await setDoc(doc(db, 'class_teachers', id), payload);

  /* Đếm lượt dùng + tự vô hiệu khi hết lượt.
     Rules đã chặn tại thời điểm ghi liên kết (uses < maxUses). Nếu bước này
     thất bại (mất mạng, rules đổi…) thì PHẢI xoá liên kết vừa tạo, nếu không
     key vẫn ở trạng thái "chưa dùng" và một giáo viên khác có thể dùng lại
     cùng một key — xoá link để sai lệch không tồn tại. */
  try {
    const maxUses = Number(k.maxUses) > 0 ? Number(k.maxUses) : 1;
    const uses = (Number(k.uses) || 0) + 1;
    const usedBy = { ...(k.usedBy || {}), [user.uid]: Date.now() };
    const patch = { uses, usedBy, lastUsedAt: serverTimestamp() };
    if (uses >= maxUses) {
      patch.revoked = true;
      patch.revokeReason = 'used';
      patch.revokedAt = serverTimestamp();
    }
    await updateDoc(doc(db, 'class_teacher_keys', key), patch);
  } catch (e) {
    try {
      await deleteDoc(doc(db, 'class_teachers', id));
    } catch (rollbackError) {
      console.error('[classTeachers] không rollback được liên kết:', rollbackError?.code || rollbackError?.message);
    }
    throw new Error(
      'Không trừ được lượt dùng của key nên liên kết đã được huỷ. '
      + 'Nhờ chủ nhiệm kiểm tra key rồi thử lại (hoặc cấp key mới).',
    );
  }

  /* Báo cho chủ nhiệm biết có giáo viên bộ môn mới (không chặn luồng chính) */
  await notifyClassOwner({
    type: 'teacher_link',
    toUid: k.createdBy,
    actorId: user.uid,
    actorName: payload.teacherName,
    classId: k.classId,
    className: payload.className,
    subject,
    title: 'Liên kết mới',
    body: `${payload.teacherName} vừa liên kết môn ${subject} vào lớp ${payload.className || k.classId}.`,
    tab: 'teachers',
  });

  await logTeacherEvent({
    classId: k.classId,
    action: 'teacher_link',
    actorId: user.uid,
    actorName: payload.teacherName,
    teacherId: user.uid,
    teacherName: payload.teacherName,
    key,
    subject,
    detail: 'Liên kết bằng key',
  });

  return { classId: k.classId, className: payload.className, id, subject };
}

export async function unlinkTeacher(classId, teacherId, { by = '', byName = '', teacherName = '', subject = '' } = {}) {
  if (!classId || !teacherId) throw new Error('Thiếu thông tin liên kết.');
  await deleteDoc(doc(db, 'class_teachers', linkDocId(classId, teacherId)));

  /* Chủ nhiệm cần biết giáo viên đã rời lớp (nếu chính họ là người gỡ thì bỏ qua) */
  try {
    const cSnap = await getDoc(doc(db, 'classes', classId));
    const cls = cSnap.exists() ? cSnap.data() : null;
    await notifyClassOwner({
      type: 'teacher_unlink',
      toUid: cls?.teacherId || '',
      actorId: by || teacherId,
      actorName: byName || teacherName,
      classId,
      className: cls?.name || '',
      subject,
      title: 'Gỡ liên kết',
      body: `${byName || teacherName || 'Giáo viên bộ môn'} đã gỡ liên kết khỏi lớp ${cls?.name || classId}.`,
      tab: 'teachers',
    });
  } catch (e) {
    console.warn('[classTeachers] không gửi được thông báo gỡ liên kết:', e?.code || e?.message);
  }
  await logTeacherEvent({
    classId,
    action: 'teacher_unlink',
    actorId: by || teacherId,
    actorName: byName,
    teacherId,
    teacherName,
    detail: by && by !== teacherId ? 'Chủ nhiệm gỡ liên kết' : 'Giáo viên tự gỡ liên kết',
  });
}

export async function listClassTeachers(classId) {
  if (!classId) return [];
  const q = query(collection(db, 'class_teachers'), where('classId', '==', classId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function listMyLinkedClasses(teacherId) {
  if (!teacherId) return [];
  const q = query(collection(db, 'class_teachers'), where('teacherId', '==', teacherId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Trạng thái tài khoản của các giáo viên đã liên kết.
 * Chỉ đọc hồ sơ tối thiểu (users/{uid}), không lấy PII khác.
 * → { [uid]: { exists, name, lastActiveAt } }
 */
export async function getTeacherAccountStatus(uids = []) {
  const ids = [...new Set((uids || []).filter(Boolean))];
  const out = {};
  if (!ids.length) return out;

  const chunks = [];
  for (let i = 0; i < ids.length; i += 10) chunks.push(ids.slice(i, i + 10));

  await Promise.all(chunks.map(async (chunk) => {
    try {
      const snap = await getDocs(query(collection(db, 'users'), where(documentId(), 'in', chunk)));
      snap.docs.forEach((d) => {
        const x = d.data() || {};
        out[d.id] = {
          exists: true,
          name: x.name || x.displayName || '',
          lastActiveAt: toMs(x.lastActiveAt) || toMs(x.updatedAt) || 0,
        };
      });
    } catch (e) {
      console.warn('[classTeachers] không đọc được trạng thái tài khoản:', e?.code || e?.message);
    }
  }));

  ids.forEach((id) => { if (!out[id]) out[id] = { exists: false, name: '', lastActiveAt: 0 }; });
  return out;
}
