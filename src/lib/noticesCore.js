/* ============================================================
   noticesCore.js — logic thuần cho trung tâm thông báo
   ------------------------------------------------------------
   Không import Firebase để test được bằng vitest.
   Mỗi thông báo là 1 doc `notices/{id}` chỉ người nhận đọc được
   (xem firestore.rules). Không tự gửi thông báo cho chính mình.
   ============================================================ */

export const NOTICE_TYPES = {
  teacher_link: 'Giáo viên bộ môn liên kết',
  teacher_unlink: 'Giáo viên bộ môn gỡ liên kết',
  exam_assigned: 'Đề mới được giao',
};

export const NOTICE_TABS = ['teachers', 'exams'];

const trim = (v, max) => String(v ?? '').trim().slice(0, max);

/**
 * Chuẩn hoá payload thông báo. Trả về null khi không cần gửi
 * (tự thao tác trên lớp của mình) và ném lỗi khi thiếu dữ liệu bắt buộc.
 */
export function buildNotice({
  type, toUid, actorId, actorName, classId, className,
  subject, title, body, tab, now = Date.now(),
} = {}) {
  if (!toUid || !classId) throw new Error('Thông báo thiếu người nhận hoặc lớp.');
  if (!NOTICE_TYPES[type]) throw new Error(`Loại thông báo không hợp lệ: ${type}`);
  /* Chủ nhiệm tự làm thì không cần thông báo cho chính mình */
  if (toUid === actorId) return null;

  return {
    type,
    toUid,
    actorId: actorId || '',
    actorName: trim(actorName, 80),
    classId,
    className: trim(className, 120),
    subject: trim(subject, 60),
    title: trim(title, 140),
    body: trim(body, 300),
    tab: NOTICE_TABS.includes(tab) ? tab : 'teachers',
    createdAtMs: Number(now) || Date.now(),
    read: false,
  };
}

/** Sắp xếp mới nhất trước — dùng ở client vì query chỉ lọc theo toUid. */
export function sortNotices(list = []) {
  return [...list].sort((a, b) => (Number(b?.createdAtMs) || 0) - (Number(a?.createdAtMs) || 0));
}

export function unreadCount(list = []) {
  return list.filter((n) => n && !n.read).length;
}

/** Nhóm để hiển thị: chưa đọc trước, sau đó theo thời gian. */
export function groupNotices(list = []) {
  const sorted = sortNotices(list);
  return {
    unread: sorted.filter((n) => !n.read),
    read: sorted.filter((n) => n.read),
    total: sorted.length,
  };
}

/** Câu mô tả ngắn cho từng loại — dùng chung cho UI và test. */
export function noticeSummary(n) {
  if (!n) return '';
  const who = n.actorName || 'Giáo viên';
  const subj = n.subject ? ` (${n.subject})` : '';
  if (n.type === 'teacher_link') return `${who}${subj} đã liên kết vào lớp ${n.className || n.classId}.`;
  if (n.type === 'teacher_unlink') return `${who}${subj} đã gỡ liên kết khỏi lớp ${n.className || n.classId}.`;
  if (n.type === 'exam_assigned') return `${who}${subj} vừa giao đề “${n.title || 'Đề'}” cho lớp ${n.className || n.classId}.`;
  return n.body || n.title || '';
}
