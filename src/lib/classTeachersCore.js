/* ============================================================
   classTeachersCore.js — LOGIC THUẦN của "Giáo viên bộ môn"
   ------------------------------------------------------------
   Tách khỏi classTeachers.js (phần Firestore) để:
     • test được bằng vitest mà không cần khởi tạo Firebase
     • dùng lại ở UI, ở rules-comment, ở báo cáo

   Nội dung: đánh giá key, trạng thái key/nhãn, nhãn nhật ký,
   tổng hợp hoạt động ra đề của giáo viên bộ môn.
   ============================================================ */

export const DAY = 86400000;

export const toMs = (v) => {
  if (!v) return 0;
  if (typeof v === 'number') return v;
  if (typeof v?.toMillis === 'function') return v.toMillis();
  if (typeof v?.seconds === 'number') return v.seconds * 1000;
  const t = new Date(v).getTime();
  return Number.isFinite(t) ? t : 0;
};

export const linkDocId = (classId, teacherId) => `${classId}_${teacherId}`;

/* ---------- đánh giá key ---------- */

/**
 * evaluateKey(keyDoc, { uid, classId, now }) → { ok, code, message }
 * code: ok | missing | revoked | expired | exhausted | wrong-class
 *       | own-class | already-used-by-you
 */
export function evaluateKey(keyDoc, { uid = '', classId = '', now = Date.now() } = {}) {
  if (!keyDoc) return { ok: false, code: 'missing', message: 'Key không tồn tại. Kiểm tra lại hoặc xin key mới.' };

  if (keyDoc.revoked) {
    const reason = keyDoc.revokeReason === 'used' ? 'đã dùng hết lượt' : 'đã bị giáo viên chủ nhiệm thu hồi';
    return { ok: false, code: 'revoked', message: `Key này ${reason}. Xin chủ nhiệm tạo key mới.` };
  }

  const exp = toMs(keyDoc.expiresAt);
  if (exp && exp < now) {
    return { ok: false, code: 'expired', message: 'Key đã hết hạn. Xin chủ nhiệm tạo key mới.' };
  }

  const maxUses = Number(keyDoc.maxUses) > 0 ? Number(keyDoc.maxUses) : 1;
  const uses = Number(keyDoc.uses) || 0;
  if (uses >= maxUses) {
    return { ok: false, code: 'exhausted', message: 'Key này đã được dùng. Mỗi key chỉ dùng được một lần.' };
  }

  const usedBy = keyDoc.usedBy || {};
  if (uid && usedBy && usedBy[uid]) {
    return { ok: false, code: 'already-used-by-you', message: 'Bạn đã dùng key này rồi.' };
  }

  if (keyDoc.createdBy && uid && keyDoc.createdBy === uid) {
    return { ok: false, code: 'own-class', message: 'Bạn là chủ lớp này — không cần liên kết.' };
  }

  if (classId && keyDoc.classId && keyDoc.classId !== classId) {
    return { ok: false, code: 'wrong-class', message: 'Key này dành cho lớp khác.' };
  }

  return { ok: true, code: 'ok', message: '' };
}

/** Trạng thái hiển thị của key. */
export function keyStatus(k, now = Date.now()) {
  if (!k) return { code: 'missing', label: 'Không tồn tại', tone: 'bad' };
  const maxUses = Number(k.maxUses) > 0 ? Number(k.maxUses) : 1;
  const uses = Number(k.uses) || 0;

  if (k.revoked) {
    if (k.revokeReason === 'used' || uses >= maxUses) return { code: 'used', label: 'Đã dùng', tone: 'na' };
    return { code: 'revoked', label: 'Đã thu hồi', tone: 'bad' };
  }
  if (uses >= maxUses) return { code: 'used', label: 'Đã dùng', tone: 'na' };

  const exp = toMs(k.expiresAt);
  if (exp && exp < now) return { code: 'expired', label: 'Hết hạn', tone: 'mid' };
  return { code: 'active', label: 'Đang hiệu lực', tone: 'ex' };
}

export const isKeyUsable = (k, now = Date.now()) => keyStatus(k, now).code === 'active';

/* ---------- nhãn nhật ký ---------- */

export const AUDIT_LABEL = {
  key_create: 'Tạo key',
  key_revoke: 'Thu hồi key',
  teacher_link: 'Giáo viên liên kết',
  teacher_unlink: 'Gỡ liên kết',
  report_generate: 'Tạo báo cáo AI',
  report_denied: 'Từ chối tạo báo cáo',
};

/* ---------- thống kê hoạt động ---------- */

export const studentCountOf = (cls) => (cls?.memberIds?.length || cls?.members?.length || 0);

export function examStatus(e, now = Date.now()) {
  if (e.active === false) return { code: 'off', label: 'Đã tắt' };
  const open = toMs(e.opensAt);
  const close = toMs(e.closesAt);
  if (open && now < open) return { code: 'soon', label: 'Chưa mở' };
  if (close && now > close) return { code: 'closed', label: 'Đã đóng' };
  return { code: 'open', label: 'Đang mở' };
}

/**
 * Tổng hợp hoạt động ra đề của từng giáo viên trong 1 lớp.
 * Chỉ tính đề có classId === lớp (đề đã giao cho lớp).
 */
export function buildTeacherActivity({
  classId, exams = [], submissionsMap = {}, linkedTeachers = [], rangeDays = 'all',
  now = Date.now(), rangeTo = 0, students = 0, accountStatus = {},
  /* Chủ nhiệm phải được truyền vào, KHÔNG suy ra từ việc ai là tác giả đề */
  ownerId = '', ownerName = '', ownerSubject = '',
} = {}) {
  const cutoff = rangeDays === 'all' ? 0 : now - Number(rangeDays) * DAY;
  const ceil = toMs(rangeTo) || 0;

  const classExams = exams.filter((e) => e.classId === classId);
  const inRange = classExams.filter((e) => {
    const t = toMs(e.createdAt) || toMs(e.opensAt) || 0;
    if (cutoff && t && t < cutoff) return false;
    if (ceil && t && t > ceil) return false;
    return true;
  });

  const byTeacher = {};
  const ensure = (owner, seed = {}) => {
    if (!byTeacher[owner]) {
      byTeacher[owner] = {
        teacherId: owner,
        teacherName: seed.teacherName || 'Giáo viên',
        email: seed.email || '',
        subject: seed.subject || '',
        subjectSource: seed.subjectSource || '',
        linkedAt: toMs(seed.linkedAt) || toMs(seed.linkedAtMs),
        isOwner: Boolean(seed.isOwner),
        linked: Boolean(seed.linked),
        exams: [],
        submissions: 0,
        students: new Set(),
      };
    }
    return byTeacher[owner];
  };

  /* Chủ nhiệm lớp: xác định bằng classInfo.teacherId, không phải ai giao đề */
  if (ownerId) {
    ensure(ownerId, {
      teacherName: ownerName || 'Chủ nhiệm',
      subject: ownerSubject || '',
      isOwner: true,
    });
  }

  linkedTeachers.forEach((t) => ensure(t.teacherId, { ...t, linked: true }));

  inRange.forEach((e) => {
    const owner = e.teacherId || 'unknown';
    if (owner === 'unknown') return;
    /* Tác giả đề không mặc nhiên là chủ nhiệm: có thể là GVBM đã gỡ liên kết
       hoặc đề được giao từ nơi khác. */
    const row = ensure(owner, {
      teacherName: e.teacherName || 'Giáo viên',
      subject: e.subject || '',
    });
    if (!row.subject && e.subject) row.subject = e.subject;

    const subs = submissionsMap[e.id] || [];
    row.exams.push({
      id: e.id,
      title: e.title || 'Đề',
      subject: e.subject || row.subject || '',
      createdAt: toMs(e.createdAt),
      opensAt: toMs(e.opensAt),
      closesAt: toMs(e.closesAt),
      questions: (e.questions || []).length,
      submissions: subs.length,
      participants: new Set(subs.map((s) => s.studentId).filter(Boolean)).size,
      avgPct: subs.length
        ? Math.round(subs.reduce((a, s) => {
          const tp = Number(s.totalPoints);
          return a + (tp > 0 ? (Number(s.score) / tp) * 100 : 0);
        }, 0) / subs.length)
        : null,
      status: examStatus(e, now),
    });
    row.submissions += subs.length;
    subs.forEach((s) => { if (s.studentId) row.students.add(s.studentId); });
  });

  const rows = Object.values(byTeacher)
    .map((r) => {
      const attempts = r.exams.length;
      const expected = students > 0 ? attempts * students : 0;
      const participation = expected > 0 ? Math.min(100, Math.round((r.submissions / expected) * 100)) : null;
      const scoredExams = r.exams.filter((e) => e.avgPct !== null);
      const avgPct = scoredExams.length
        ? Math.round(scoredExams.reduce((a, e) => a + e.avgPct, 0) / scoredExams.length)
        : null;
      const lastExamMs = r.exams.reduce((m, e) => Math.max(m, e.opensAt || e.createdAt), 0);
      const emptyExams = r.exams.filter((e) => e.submissions === 0).length;
      const acc = accountStatus[r.teacherId];

      let status;
      if (r.isOwner) status = { code: 'owner', label: 'Chủ nhiệm', tone: 'good' };
      else if (!r.linked) status = { code: 'unlinked', label: 'Chưa liên kết', tone: 'mid' };
      else if (!acc || !acc.exists) status = { code: 'no-profile', label: 'Chưa có hồ sơ', tone: 'mid' };
      else if (attempts === 0) status = { code: 'idle', label: 'Chưa giao đề', tone: 'na' };
      else status = { code: 'active', label: 'Đang hoạt động', tone: 'ex' };

      return {
        ...r,
        examCount: attempts,
        studentCount: r.students.size,
        students: undefined,
        participation,
        avgPct,
        lastExamMs,
        emptyExams,
        accountExists: acc ? acc.exists : null,
        status,
        exams: r.exams.sort((a, b) => b.createdAt - a.createdAt),
      };
    })
    .sort((a, b) => {
      if (a.isOwner !== b.isOwner) return a.isOwner ? -1 : 1;
      if (b.examCount !== a.examCount) return b.examCount - a.examCount;
      return String(a.teacherName).localeCompare(String(b.teacherName), 'vi');
    });

  const linked = rows.filter((r) => r.linked && !r.isOwner);
  const subjects = [...new Set(rows.map((r) => r.subject).filter(Boolean))];

  const subjectCount = {};
  linked.forEach((r) => {
    const s = String(r.subject || '').trim();
    if (!s) return;
    subjectCount[s] = (subjectCount[s] || 0) + 1;
  });
  const duplicateSubjects = Object.entries(subjectCount)
    .filter(([, n]) => n > 1)
    .map(([s, n]) => ({ subject: s, count: n }));

  return {
    rows,
    linked,
    subjects,
    duplicateSubjects,
    total: {
      teachers: linked.length,
      teachersActive: linked.filter((r) => r.examCount > 0).length,
      examsAll: rows.reduce((a, r) => a + r.examCount, 0),
      examsLinked: linked.reduce((a, r) => a + r.examCount, 0),
      submissions: rows.reduce((a, r) => a + r.submissions, 0),
      emptyExams: rows.reduce((a, r) => a + r.emptyExams, 0),
    },
  };
}
