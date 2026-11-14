/* ============================================================
   CLASSROOM — Firestore version (v4)
   ------------------------------------------------------------
   Bao gồm:
     • Tính năng A: Duyệt thi lại (retry permits + allowance)
     • Tính năng B: Duyệt thành viên lớp (pending members)
     • Fix 1.1: startAttempt reset khi allowRetry=true
     • Fix joinClassByKey: gửi yêu cầu thay vì vào thẳng
   ============================================================ */
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, setDoc,
  query, where, serverTimestamp, arrayUnion, arrayRemove, onSnapshot,
  orderBy, limit, writeBatch,
} from 'firebase/firestore';
import { scoreExam, scoreQuestion, isAnswered, qType } from './examScoring.js';
import { stripUndefined } from './examSubmit.js';
import { db } from './firebase.js';

/* ============ HELPERS ============ */
/* Mã ngẫu nhiên an toàn (crypto), bỏ ký tự dễ nhầm: 0/O, 1/I */
const KEY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 ký tự
function secureRandom(len, alphabet = KEY_ALPHABET) {
  const out = [];
  const buf = new Uint32Array(len);
  (globalThis.crypto || window.crypto).getRandomValues(buf);
  for (let i = 0; i < len; i++) out.push(alphabet[buf[i] % alphabet.length]);
  return out.join('');
}

/* Key lớp: 8 ký tự ngẫu nhiên → 32^8 ≈ 1,1 nghìn tỷ khả năng (trước đây chỉ ~1,6 triệu) */
export function generateClassKey(className = 'LOP') {
  const clean = className
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6) || 'LOP';
  return `${clean}-${secureRandom(4)}${secureRandom(4)}`;
}

export function generateExamToken() {
  return secureRandom(14, 'abcdefghijkmnpqrstuvwxyz23456789');
}

/* Giới hạn dò key phía client (5 lần sai / 10 phút). Chặn thật sự cần Cloud Function / rules. */
const JOIN_LIMIT = { max: 5, windowMs: 10 * 60 * 1000, lsKey: 'cs-join-attempts' };
function joinAttempts() {
  try {
    const arr = JSON.parse(localStorage.getItem(JOIN_LIMIT.lsKey) || '[]');
    return arr.filter((t) => Date.now() - t < JOIN_LIMIT.windowMs);
  } catch { return []; }
}
function noteJoinFail() {
  try { localStorage.setItem(JOIN_LIMIT.lsKey, JSON.stringify([...joinAttempts(), Date.now()])); } catch { /* */ }
}
export function joinThrottle() {
  const a = joinAttempts();
  if (a.length < JOIN_LIMIT.max) return { blocked: false, left: JOIN_LIMIT.max - a.length };
  const wait = Math.ceil((JOIN_LIMIT.windowMs - (Date.now() - a[0])) / 60000);
  return { blocked: true, waitMinutes: Math.max(1, wait) };
}

function friendlyFirestoreError(e, context = '') {
  if (!e) return 'Lỗi không xác định';
  const code = e.code || '';
  const msg = e.message || '';

  if (code === 'permission-denied' || /insufficient permissions/i.test(msg)) {
    return `Firestore Rules chặn${context ? ` (${context})` : ''}. Vào Firebase Console → Firestore → Rules để cấp quyền.`;
  }
  if (code === 'resource-exhausted' || /quota exceeded/i.test(msg)) {
    return 'Hệ thống đang tạm đạt giới hạn truy vấn của Firebase (Spark quota). Dữ liệu đã được lưu tạm an toàn.';
  }
  if (code === 'unavailable') return 'Không kết nối được Firestore. Kiểm tra mạng.';
  if (code === 'not-found') return 'Không tìm thấy dữ liệu (có thể đã bị xóa).';
  if (code === 'already-exists') return 'Dữ liệu đã tồn tại.';
  if (code === 'failed-precondition') return 'Truy vấn không hợp lệ (thiếu index?).';
  return msg || 'Lỗi không xác định';
}

/* ============================================================
   CLASSES
   ============================================================ */
export async function createClass({ name, teacherId, teacherName, subject, requireApproval = true }) {
  const data = {
    name: name || 'Lớp mới',
    subject: subject || 'Hóa học',
    teacherId,
    teacherName,
    key: generateClassKey(name),
    members: [],
    memberIds: [],
    pendingMembers: [],
    pendingIds: [],
    requireApproval: requireApproval !== false,
    createdAt: serverTimestamp(),
  };
  try {
    const newDocRef = doc(collection(db, 'classes'));
    const classData = { id: newDocRef.id, ...data };
    setDoc(newDocRef, stripUndefined(data)).catch((err) => {
      console.warn('[createClass] setDoc background warning:', err?.message);
    });
    return classData;
  } catch (e) {
    console.error('[createClass] Lỗi:', e.code, e.message);
    throw new Error(friendlyFirestoreError(e, 'tạo lớp'));
  }
}

export async function getClassesByTeacher(teacherId) {
  if (!teacherId) return [];
  try {
    const q = query(collection(db, 'classes'), where('teacherId', '==', teacherId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error('[getClassesByTeacher] Lỗi:', e.code, e.message);
    throw new Error(friendlyFirestoreError(e, 'tải lớp của giáo viên'));
  }
}

export async function getClassesByStudent(studentId) {
  if (!studentId) return [];
  try {
    const q = query(
      collection(db, 'classes'),
      where('memberIds', 'array-contains', studentId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error('[getClassesByStudent] Lỗi:', e.code, e.message);
    throw new Error(friendlyFirestoreError(e, 'tải lớp của học sinh'));
  }
}

export async function getPendingClassesByStudent(studentId) {
  if (!studentId) return [];
  try {
    const q = query(
      collection(db, 'classes'),
      where('pendingIds', 'array-contains', studentId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn('[getPendingClassesByStudent]', e.message);
    return [];
  }
}

export async function getClassById(classId) {
  if (!classId) return null;
  try {
    const snap = await getDoc(doc(db, 'classes', classId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch (e) {
    console.error('[getClassById] Lỗi:', e.code, e.message);
    throw new Error(friendlyFirestoreError(e, 'tải lớp'));
  }
}

export async function findClassByKey(key) {
  if (!key) return null;
  try {
    const q = query(collection(db, 'classes'), where('key', '==', key.trim().toUpperCase()));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() };
  } catch (e) {
    console.error('[findClassByKey] Lỗi:', e.code, e.message);
    throw new Error(friendlyFirestoreError(e, 'tìm lớp theo key'));
  }
}

/* ============================================================
   TÍNH NĂNG B — Duyệt thành viên lớp
   ============================================================ */
export async function joinClassByKey(classKey, student) {
  try {
    const th = joinThrottle();
    if (th.blocked) {
      return { ok: false, error: `Bạn nhập sai quá nhiều lần. Thử lại sau ${th.waitMinutes} phút.` };
    }

    const cls = await findClassByKey(classKey);
    if (!cls) {
      noteJoinFail();
      return { ok: false, error: 'Key không đúng hoặc lớp không tồn tại.' };
    }

    const memberIds = cls.memberIds || [];
    if (memberIds.includes(student.id)) {
      console.log('[joinClassByKey] HS đã ở trong lớp này');
      return { ok: true, class: cls, already: true };
    }

    const pendingIds = cls.pendingIds || [];
    if (pendingIds.includes(student.id)) {
      return { ok: true, class: cls, pending: true, already: true };
    }

    const person = {
      id: student.id,
      name: student.name,
      email: student.email,
      requestedAt: new Date().toISOString(),
    };
    const ref = doc(db, 'classes', cls.id);

    // Nếu lớp không cần duyệt → vào thẳng
    if (cls.requireApproval === false) {
      const member = { ...person, role: 'member', joinedAt: person.requestedAt };
      delete member.requestedAt;
      await updateDoc(ref, {
        members: arrayUnion(member),
        memberIds: arrayUnion(student.id),
      });
      console.log('[joinClassByKey] ✅ Vào lớp ngay (không cần duyệt)');
      return { ok: true, class: cls };
    }

    // Cần duyệt → gửi yêu cầu
    await updateDoc(ref, {
      pendingMembers: arrayUnion(person),
      pendingIds: arrayUnion(student.id),
    });
    console.log('[joinClassByKey] ⏳ Đã gửi yêu cầu chờ duyệt');
    return { ok: true, class: cls, pending: true };
  } catch (e) {
    console.error('[joinClassByKey] ❌ Lỗi chi tiết:', {
      code: e.code,
      message: e.message,
      name: e.name,
    });

    return {
      ok: false,
      error: friendlyFirestoreError(e, 'join lớp'),
      code: e.code,
    };
  }
}

export async function approveMember(classId, studentId) {
  try {
    const cls = await getClassById(classId);
    if (!cls) return { ok: false, error: 'Lớp không tồn tại' };
    const p = (cls.pendingMembers || []).find((m) => m.id === studentId);
    if (!p) return { ok: false, error: 'Yêu cầu không còn tồn tại.' };

    const member = {
      id: p.id,
      name: p.name,
      email: p.email,
      role: 'member',
      joinedAt: new Date().toISOString(),
    };

    await updateDoc(doc(db, 'classes', classId), {
      members: arrayUnion(member),
      memberIds: arrayUnion(studentId),
      pendingMembers: arrayRemove(p),
      pendingIds: arrayRemove(studentId),
    });
    return { ok: true };
  } catch (e) {
    console.error('[approveMember] Lỗi:', e.code, e.message);
    return { ok: false, error: friendlyFirestoreError(e, 'duyệt học sinh') };
  }
}

export async function rejectMember(classId, studentId) {
  try {
    const cls = await getClassById(classId);
    if (!cls) return { ok: false, error: 'Lớp không tồn tại' };
    const p = (cls.pendingMembers || []).find((m) => m.id === studentId);
    if (!p) return { ok: true };

    await updateDoc(doc(db, 'classes', classId), {
      pendingMembers: arrayRemove(p),
      pendingIds: arrayRemove(studentId),
    });
    return { ok: true };
  } catch (e) {
    console.error('[rejectMember] Lỗi:', e.code, e.message);
    return { ok: false, error: friendlyFirestoreError(e, 'từ chối học sinh') };
  }
}

export async function approveAllMembers(classId) {
  try {
    const cls = await getClassById(classId);
    if (!cls) return { ok: false, error: 'Lớp không tồn tại' };
    const pending = cls.pendingMembers || [];
    if (pending.length === 0) return { ok: true, count: 0 };

    const joinedAt = new Date().toISOString();
    const members = pending.map((p) => ({
      id: p.id, name: p.name, email: p.email, role: 'member', joinedAt,
    }));
    // Gộp thành MỘT lần ghi (trước đây: mỗi học sinh 1 lần đọc + 1 lần ghi)
    await updateDoc(doc(db, 'classes', classId), {
      members: arrayUnion(...members),
      memberIds: arrayUnion(...pending.map((p) => p.id)),
      pendingMembers: arrayRemove(...pending),
      pendingIds: arrayRemove(...pending.map((p) => p.id)),
    });
    return { ok: true, count: pending.length };
  } catch (e) {
    console.error('[approveAllMembers] Lỗi:', e.message);
    return { ok: false, error: friendlyFirestoreError(e, 'duyệt tất cả') };
  }
}

export async function setClassApproval(classId, required) {
  try {
    await updateDoc(doc(db, 'classes', classId), { requireApproval: !!required });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: friendlyFirestoreError(e, 'đổi chế độ duyệt') };
  }
}

export async function removeClassMember(classId, memberId) {
  try {
    const cls = await getClassById(classId);
    if (!cls) return { ok: false, error: 'Lớp không tồn tại' };
    const member = (cls.members || []).find((m) => m.id === memberId);
    if (!member) return { ok: false, error: 'Không tìm thấy thành viên' };

    await updateDoc(doc(db, 'classes', classId), {
      members: arrayRemove(member),
      memberIds: arrayRemove(memberId),
    });
    return { ok: true };
  } catch (e) {
    console.error('[removeClassMember] Lỗi:', e.code, e.message);
    return { ok: false, error: friendlyFirestoreError(e, 'xóa thành viên') };
  }
}

export async function leaveClass(classId, studentId) {
  if (!classId || !studentId) return { ok: false, error: 'Thiếu thông tin.' };
  return removeClassMember(classId, studentId);
}

export async function cancelJoinRequest(classId, studentId) {
  if (!classId || !studentId) return { ok: false, error: 'Thiếu thông tin.' };
  return rejectMember(classId, studentId);
}

export async function updateClass(classId, patch = {}) {
  if (!classId) return { ok: false, error: 'Thiếu mã lớp' };
  const data = {};
  if (typeof patch.name === 'string' && patch.name.trim()) data.name = patch.name.trim().slice(0, 48);
  if (typeof patch.subject === 'string') data.subject = patch.subject.trim().slice(0, 40);
  if (patch.grade !== undefined && patch.grade !== null) {
    const g = Number(patch.grade);
    if (!Number.isNaN(g) && g >= 1 && g <= 12) data.grade = g;
  }
  if (patch.announcement !== undefined) {
    data.announcement = patch.announcement === null
      ? null
      : {
          text: String(patch.announcement?.text || '').trim().slice(0, 500),
          updatedAt: Date.now(),
        };
  }
  if (patch.bandThresholds && typeof patch.bandThresholds === 'object') {
    const b = patch.bandThresholds;
    data.bandThresholds = {
      good: Number(b.good) || 8,
      fair: Number(b.fair) || 6.5,
      pass: Number(b.pass) || 5,
    };
  }
  if (!Object.keys(data).length) return { ok: false, error: 'Không có thay đổi.' };
  data.updatedAt = serverTimestamp();
  try {
    await updateDoc(doc(db, 'classes', classId), data);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: friendlyFirestoreError(e, 'sửa lớp') };
  }
}

export async function regenerateClassKey(classId) {
  if (!classId) return { ok: false, error: 'Thiếu mã lớp' };
  try {
    const cls = await getClassById(classId);
    if (!cls) return { ok: false, error: 'Lớp không tồn tại' };
    const key = generateClassKey(cls.name);
    await updateDoc(doc(db, 'classes', classId), { key, updatedAt: serverTimestamp() });
    return { ok: true, key };
  } catch (e) {
    return { ok: false, error: friendlyFirestoreError(e, 'đổi mã lớp') };
  }
}

export function classJoinUrl(key) {
  if (typeof window === 'undefined') return `#join/${key}`;
  const base = `${window.location.origin}${window.location.pathname || '/'}`;
  return `${base}#join/${String(key || '').toUpperCase()}`;
}

export async function deleteClass(classId) {
  if (!classId) return { ok: false, error: 'Thiếu mã lớp' };
  try {
    const exams = await getExamsByClass(classId);
    await Promise.all(exams.map((ex) => deleteExam(ex.id).catch(() => {})));
    await Promise.race([
      deleteDoc(doc(db, 'classes', classId)),
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: friendlyFirestoreError(e, 'xóa lớp') };
  }
}

/* ============================================================
   EXAMS
   ============================================================ */
export async function createExam({
  teacherId, teacherName, classId,
  title, description, duration, questions,
  showAnswerAfter, allowRetry, shuffle,
  opensAt = null, closesAt = null,
  proctor = null,
  source = '',
  kind = '',
  subject = '',
  grade = 0,
  gradeType = '',
  isDraft = false,
  /* 'private' = chỉ thành viên lớp vào được (mặc định); 'public' = ai có link cũng làm được */
  visibility = 'private',
}) {
  const totalPoints = Math.round((questions || []).reduce((s, q) => s + (Number(q.points) || 1), 0) * 100) / 100;

  const data = {
    token: generateExamToken(),
    teacherId,
    teacherName,
    classId: classId || '',
    isDraft: !!isDraft,
    visibility: visibility === 'public' ? 'public' : 'private',
    visibilityUpdatedAt: null,
    title: title || 'Đề kiểm tra',
    description: description || '',
    duration: Number(duration) || 15,
    questions: questions || [],
    totalPoints,
    showAnswerAfter: showAnswerAfter ?? true,
    allowRetry: allowRetry ?? false,
    shuffle: shuffle ?? false,
    opensAt: opensAt || null,
    closesAt: closesAt || null,
    proctor: proctor || defaultProctor(),
    createdAt: serverTimestamp(),
    active: true,
  };
  if (source) data.source = source;
  if (kind) data.kind = kind;
  if (subject) data.subject = subject;
  if (grade) data.grade = Number(grade) || 0;
  if (gradeType && ['tx', 'dgk', 'ckk'].includes(gradeType)) data.gradeType = gradeType;
  try {
    const newDocRef = doc(collection(db, 'exams'));
    const examData = { id: newDocRef.id, ...data };
    setDoc(newDocRef, stripUndefined(data)).catch((err) => {
      console.warn('[createExam] setDoc background warning:', err?.message);
    });
    return examData;
  } catch (e) {
    console.error('[createExam] Lỗi:', e.code, e.message);
    throw new Error(friendlyFirestoreError(e, 'tạo đề'));
  }
}

export function defaultProctor() {
  return {
    fullscreenLock: true,
    tabSwitchLimit: 3,
    blockCopyPaste: true,
    strictMode: true,
    camera: 'off',
    cameraChecks: {
      noFace: true,
      multiFace: true,
      lookAway: true,
      handRaise: true,
      phoneLike: true,
    },
    snapshotOnEvent: true,
    maxSnapshots: 10,
    retentionDays: 30,
    blockDevTools: true,
    blockPrintScreen: true,
    blockLongBlur: true,
    allowPauseByTeacher: true,
  };
}

/* ❗ MỚI: GV sửa đề đã tạo (thông tin + câu hỏi + cấu hình giám sát camera...) */
export async function updateTeacherExam(examId, patch) {
  if (!examId) throw new Error('Thiếu examId.');
  try {
    await Promise.race([
      updateDoc(doc(db, 'exams', examId), stripUndefined({
        ...patch,
        updatedAt: serverTimestamp(),
      })),
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]).catch((err) => {
      console.warn('[updateTeacherExam] updateDoc warning:', err?.message);
    });
    return true;
  } catch (e) {
    console.error('[updateTeacherExam] Lỗi:', e.code, e.message);
    throw new Error(friendlyFirestoreError(e, 'lưu đề'));
  }
}

export async function getExamsByTeacher(teacherId) {
  if (!teacherId) return [];
  try {
    const q = query(collection(db, 'exams'), where('teacherId', '==', teacherId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error('[getExamsByTeacher] Lỗi:', e.code, e.message);
    throw new Error(friendlyFirestoreError(e, 'tải đề của giáo viên'));
  }
}

export async function getExamsByClass(classId) {
  if (!classId) return [];
  try {
    const q = query(collection(db, 'exams'), where('classId', '==', classId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error('[getExamsByClass] Lỗi:', e.code, e.message);
    throw new Error(friendlyFirestoreError(e, 'tải đề của lớp'));
  }
}

/* Chuyển đổi timestamp / ISO string / millis an toàn */
export const tsMs = (v) => {
  if (!v) return 0;
  if (typeof v === 'number') return v;
  if (typeof v?.toMillis === 'function') return v.toMillis();
  if (v?.seconds) return v.seconds * 1000;
  const t = new Date(v).getTime();
  return Number.isNaN(t) ? 0 : t;
};

export async function getExamByToken(token) {
  if (!token) return null;
  try {
    const q = query(collection(db, 'exams'), where('token', '==', token));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    const exam = { id: d.id, ...d.data() };

    const now = Date.now();
    let status = 'ok';
    const opensMs = tsMs(exam.opensAt);
    const closesMs = tsMs(exam.closesAt);
    if (opensMs && now < opensMs) status = 'not-open';
    else if (closesMs && now > closesMs) status = 'closed';

    return { ...exam, status };
  } catch (e) {
    console.error('[getExamByToken] Lỗi:', e.code, e.message);
    throw new Error(friendlyFirestoreError(e, 'tải đề'));
  }
}

export async function getExamById(id) {
  if (!id) return null;
  try {
    const snap = await getDoc(doc(db, 'exams', id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch (e) {
    console.error('[getExamById] Lỗi:', e.code, e.message);
    throw new Error(friendlyFirestoreError(e, 'tải đề theo ID'));
  }
}

export async function deleteExam(examId) {
  if (!examId) return;
  try {
    // Xóa kèm dữ liệu liên quan (Firestore không tự xóa subcollection / doc tham chiếu)
    const kill = async (q) => {
      try {
        const s = await getDocs(q);
        await Promise.all(s.docs.map((d) => deleteDoc(d.ref).catch((err) => console.warn('[deleteExam sub]', err))));
      } catch (err) {
        console.warn('[deleteExam subquery]', err);
      }
    };
    await kill(query(collection(db, 'submissions'), where('examId', '==', examId)));
    await kill(query(collection(db, 'examRetryPermits'), where('examId', '==', examId)));
    await kill(query(collection(db, 'examSessions'), where('examId', '==', examId)));
    await kill(collection(db, 'exams', examId, 'attempts'));
    await Promise.race([
      deleteDoc(doc(db, 'exams', examId)),
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);
  } catch (e) {
    console.error('[deleteExam] Lỗi:', e.code, e.message);
    throw new Error(friendlyFirestoreError(e, 'xóa đề'));
  }
}

/* ============================================================
   ATTEMPTS
   ============================================================ */
export async function startAttempt({ examId, student, forceNew = false }) {
  if (!examId || !student?.id) throw new Error('Thiếu thông tin attempt');
  const attemptId = `${examId}_${student.id}`;
  const ref = doc(db, 'exams', examId, 'attempts', attemptId);

  try {
    const snap = await getDoc(ref);

    if (snap.exists() && !forceNew) {
      const data = snap.data();

      if (!data.submittedAt) {
        // Kiểm tra xem attempt dở dang này có quá hạn từ lâu không
        const exam = await getExamById(examId);
        const durationSec = (exam?.duration || 0) * 60;
        const elapsedSec = (Date.now() - (data.startedAt || 0)) / 1000;

        // Nếu đề có giới hạn thời lượng và đã quá thời lượng + 10 phút gia hạn
        if (durationSec > 0 && elapsedSec > durationSec + 600) {
          if (exam?.allowRetry) {
            console.log('[startAttempt] Attempt dở dang đã quá hạn từ lâu và đề cho làm lại — tạo attempt mới');
          } else {
            // Đã quá hạn và không cho làm lại — trả về submitted: true để học sinh không bị rơi vào loop 0 điểm
            return { id: attemptId, ...data, restored: true, submitted: true, expired: true };
          }
        } else {
          return { id: attemptId, ...data, restored: true, submitted: false };
        }
      } else {
        const exam = await getExamById(examId);
        if (!exam?.allowRetry) {
          return { id: attemptId, ...data, restored: true, submitted: true };
        }
      }

      console.log('[startAttempt] Đề cho làm lại hoặc forceNew — tạo attempt mới');
    }

    const data = {
      studentId: student.id,
      studentName: student.name || student.email || 'Học sinh',
      startedAt: Date.now(),
      answers: {},
      submittedAt: null,
      timeSpent: 0,
      events: [],
      violationCount: 0,
      autoSubmitted: false,
      cameraStatus: 'off',
    };
    await Promise.race([
      setDoc(ref, data),
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]).catch((err) => {
      console.warn('[startAttempt] setDoc warning:', err?.message);
    });
    return { id: attemptId, ...data, restored: false, submitted: false };
  } catch (e) {
    console.error('[startAttempt] Lỗi:', e.code, e.message);
    throw new Error(friendlyFirestoreError(e, 'bắt đầu làm bài'));
  }
}

export async function saveAttemptAnswers({ examId, studentId, answers }) {
  if (!examId || !studentId) return;
  const attemptId = `${examId}_${studentId}`;
  const ref = doc(db, 'exams', examId, 'attempts', attemptId);
  try {
    await Promise.race([
      updateDoc(ref, stripUndefined({ answers })),
      new Promise((resolve) => setTimeout(resolve, 1500)),
    ]).catch(() => {});
  } catch (e) {
    if (e.code !== 'not-found') {
      console.warn('[saveAttemptAnswers] Lỗi:', e.code, e.message);
    }
  }
}

export async function getAttempt({ examId, studentId }) {
  if (!examId || !studentId) return null;
  const attemptId = `${examId}_${studentId}`;
  try {
    const snap = await getDoc(doc(db, 'exams', examId, 'attempts', attemptId));
    if (!snap.exists()) return null;
    return { id: attemptId, ...snap.data() };
  } catch (e) {
    if (e.code !== 'not-found') {
      console.warn('[getAttempt] Lỗi:', e.code, e.message);
    }
    return null;
  }
}

export async function appendAttemptEvents({ examId, studentId, events }) {
  if (!examId || !studentId || !events?.length) return;
  const attemptId = `${examId}_${studentId}`;
  const ref = doc(db, 'exams', examId, 'attempts', attemptId);
  try {
    await Promise.race([
      updateDoc(ref, { events: arrayUnion(...events) }),
      new Promise((resolve) => setTimeout(resolve, 1500)),
    ]).catch(() => {});
  } catch (e) {
    if (e.code !== 'not-found') {
      console.warn('[appendAttemptEvents] Lỗi:', e.code, e.message);
    }
  }
}

export async function getAttemptsByExam(examId) {
  if (!examId) return [];
  try {
    const snap = await getDocs(collection(db, 'exams', examId, 'attempts'));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error('[getAttemptsByExam] Lỗi:', e.code, e.message);
    return [];
  }
}

/* ============================================================
   SUBMISSIONS
   ============================================================ */
const inflightSubmit = new Map();
export function submitExam(args) {
  const k = `${args?.examId}_${args?.student?.id}`;
  if (inflightSubmit.has(k)) return inflightSubmit.get(k); // bấm nhanh 2 lần → dùng chung 1 lượt
  const p = _submitExamImpl(args).finally(() => inflightSubmit.delete(k));
  inflightSubmit.set(k, p);
  return p;
}

async function _submitExamImpl({ examId, student, answers, timeSpent, attemptMeta = {} }) {
  if (!examId || !student?.id) {
    return { ok: false, error: 'Thiếu thông tin nộp bài.' };
  }

  let exam;
  try {
    exam = await getExamById(examId);
  } catch (e) {
    return { ok: false, error: e.message };
  }

  if (!exam) return { ok: false, error: 'Đề không tồn tại.' };

  const now = Date.now();
  const opensMs = tsMs(exam.opensAt);
  const closesMs = tsMs(exam.closesAt);
  if (opensMs && now < opensMs) {
    return { ok: false, error: 'Đề chưa mở.' };
  }
  // Cho nộp trễ tối đa bằng thời lượng đề (HS bắt đầu trước giờ đóng vẫn được nộp)
  const durationMs = (Number(exam.duration) || 0) * 60000;
  const isLateAllowed = !!attemptMeta.autoSubmitted || !!attemptMeta.isRetry;
  if (!isLateAllowed && closesMs && now > closesMs + Math.max(durationMs, 15 * 60000)) {
    return { ok: false, error: 'Đề đã đóng.' };
  }

  // Kiểm tra đã nộp chưa
  let oldSnap;
  try {
    const oldQ = query(
      collection(db, 'submissions'),
      where('examId', '==', examId),
      where('studentId', '==', student.id)
    );
    oldSnap = await getDocs(oldQ);
  } catch (e) {
    console.warn('[submitExam] Không check được submission cũ:', e.code, e.message);
    oldSnap = { empty: true, docs: [] };
  }

  // Thi lại: phải có permit/allowance hợp lệ (kiểm tra lại ở đây, không tin cờ từ client)
  let retryOk = false;
  let retryPermit = null;
  if (attemptMeta.isRetry && oldSnap.docs?.length > 0) {
    retryPermit = await checkRetryPermit({ examId, classId: exam.classId, studentId: student.id });
    retryOk = !!retryPermit.canRetry;
  }

  if (!exam.allowRetry && !retryOk && oldSnap.docs?.length > 0) {
    const prev = oldSnap.docs[0].data();
    return {
      ok: true,
      id: oldSnap.docs[0].id,
      score: prev.score,
      correct: prev.correctCount,
      total: prev.totalQuestions || exam.questions.length,
      totalPoints: prev.totalPoints || exam.totalPoints,
      detail: prev.detail || [],
      alreadySubmitted: true,
    };
  }

  // Chấm điểm
  const { detail, correctCount, score } = scoreExam(exam.questions, answers);

  const data = {
    examId,
    /* cần cho bảng xếp hạng theo lớp + rule đọc bài của bạn cùng lớp */
    classId: exam.classId || '',
    studentId: student.id,
    studentName: student.name || student.email || 'Học sinh',
    answers,
    detail,
    score,
    totalPoints: exam.totalPoints,
    correctCount,
    totalQuestions: exam.questions.length,
    timeSpent: timeSpent || 0,
    submittedAt: serverTimestamp(),
    graded: true,
    autoSubmitted: !!attemptMeta.autoSubmitted,
    violationCount: attemptMeta.violationCount || 0,
    cameraStatus: attemptMeta.cameraStatus || 'off',
    isRetry: !!attemptMeta.isRetry,
  };

  // ID cố định theo (đề, học sinh, lần làm) → bấm nộp 2 lần / 2 tab chỉ ghi ĐÚNG 1 bài
  let subId;
  try {
    const att = await Promise.race([
      getAttempt({ examId, studentId: student.id }),
      new Promise((r) => setTimeout(() => r(null), 1500)),
    ]).catch(() => null);

    subId = `${examId}_${student.id}_${att?.startedAt || Date.now()}`;
    const subDocRef = doc(db, 'submissions', subId);

    setDoc(subDocRef, stripUndefined(data)).catch((err) => {
      console.warn('[_submitExamImpl] setDoc background warning:', err?.message);
    });
  } catch (e) {
    console.error('[submitExam] Ghi submission lỗi:', e.code, e.message);
    const errText = friendlyFirestoreError(e, 'lưu bài nộp');
    return {
      ok: false,
      id: null,
      score,
      correct: correctCount,
      total: exam.questions.length,
      totalPoints: exam.totalPoints,
      detail,
      error: errText,
      saveError: errText,
      data,
    };
  }

  // Thi lại bằng permit riêng → đánh dấu ĐÃ DÙNG để 1 lần duyệt chỉ thi lại 1 lần
  if (retryOk && retryPermit?.source === 'permit' && retryPermit.permit?.id) {
    markPermitUsed({ permitId: retryPermit.permit.id }).catch(() => {});
  }

  // Đánh dấu attempt đã nộp
  try {
    const attemptId = `${examId}_${student.id}`;
    const attemptRef = doc(db, 'exams', examId, 'attempts', attemptId);
    await Promise.race([
      updateDoc(attemptRef, {
        submittedAt: Date.now(),
        timeSpent: timeSpent || 0,
        autoSubmitted: !!attemptMeta.autoSubmitted,
        violationCount: attemptMeta.violationCount || 0,
        cameraStatus: attemptMeta.cameraStatus || 'off',
        submissionId: subId,
      }),
      new Promise((resolve) => setTimeout(resolve, 1500)),
    ]).catch((err) => {
      console.warn('[submitExam] update attempt warning:', err?.message);
    });
  } catch (e) {
    if (e.code !== 'not-found') {
      console.warn('[submitExam] update attempt lỗi:', e.code, e.message);
    }
  }

  return {
    ok: true,
    id: subId,
    score,
    correct: correctCount,
    total: exam.questions.length,
    totalPoints: exam.totalPoints,
    detail,
  };
}

export async function getSubmissionsByExam(examId) {
  if (!examId) return [];
  try {
    const q = query(collection(db, 'submissions'), where('examId', '==', examId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error('[getSubmissionsByExam] Lỗi:', e.code, e.message);
    throw new Error(friendlyFirestoreError(e, 'tải bài nộp'));
  }
}

export function listenSubmissionsByClass(classId, cb, onErr) {
  if (!classId) return () => {};
  const q = query(collection(db, 'submissions'), where('classId', '==', classId));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      cb(list);
    },
    (err) => {
      console.warn('[listenSubmissionsByClass] error:', err.message);
      onErr?.(err);
    }
  );
}

export function listenSubmissionsByExam(examId, cb, onErr) {
  if (!examId) return () => {};
  const q = query(collection(db, 'submissions'), where('examId', '==', examId));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      cb(list);
    },
    (err) => {
      console.warn('[listenSubmissionsByExam] error:', err.message);
      onErr?.(err);
    }
  );
}

export async function getSubmissionsByStudent(studentId) {
  if (!studentId) return [];
  try {
    const q = query(collection(db, 'submissions'), where('studentId', '==', studentId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error('[getSubmissionsByStudent] Lỗi:', e.code, e.message);
    return [];
  }
}

export async function getSubmissionForStudent(arg1, arg2) {
  const examId = typeof arg1 === 'object' && arg1 !== null ? arg1.examId : arg1;
  const studentId = typeof arg1 === 'object' && arg1 !== null ? arg1.studentId : arg2;
  if (!examId || !studentId) return null;
  try {
    const q = query(
      collection(db, 'submissions'),
      where('examId', '==', examId),
      where('studentId', '==', studentId)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const ms = (x) => x?.submittedAt?.toMillis?.() ?? x?.submittedAt ?? 0;
    const list = snap.docs.map((x) => ({ id: x.id, ...x.data() })).sort((a, b) => ms(b) - ms(a));
    return list[0]; // bài nộp MỚI NHẤT
  } catch (e) {
    console.error('[getSubmissionForStudent] Lỗi:', e.code, e.message);
    return null;
  }
}

/* Lấy tất cả submissions của 1 HS cho 1 đề (để hiện lịch sử thi lại) */
export async function getAllSubmissionsForStudent(arg1, arg2) {
  const examId = typeof arg1 === 'object' && arg1 !== null ? arg1.examId : arg1;
  const studentId = typeof arg1 === 'object' && arg1 !== null ? arg1.studentId : arg2;
  if (!examId || !studentId) return [];
  try {
    const q = query(
      collection(db, 'submissions'),
      where('examId', '==', examId),
      where('studentId', '==', studentId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn('[getAllSubmissionsForStudent]', e.message);
    return [];
  }
}

/* ============================================================
   TÍNH NĂNG A — DUYỆT THI LẠI
   ------------------------------------------------------------
   Data model:
     /examRetryPermits/{permitId}
       examId, classId, studentId, studentName,
       status: pending|approved|denied|used,
       reason, requestedAt, decidedAt, decidedBy, usedAt, note
     /studentRetryAllowance/{classId_studentId}
       classId, studentId, allowed, updatedAt, updatedBy
   ============================================================ */

/* ------ HS: gửi yêu cầu xin thi lại ------ */
export async function requestRetry({ examId, classId, teacherId, student, reason = '' }) {
  if (!examId || !student?.id) {
    return { ok: false, error: 'Thiếu thông tin.' };
  }
  try {
    // Kiểm tra xem đã có yêu cầu pending chưa
    /* ❗ Kiểm tra trùng lặp theo CẢ teacherId: yêu cầu cũ (lưu trước khi có teacherId,
       classId=null) sẽ không chặn việc gửi lại yêu cầu mới đã định tuyến đúng */
    const conds = [
      where('examId', '==', examId),
      where('studentId', '==', student.id),
      where('status', '==', 'pending'),
    ];
    if (teacherId) conds.push(where('teacherId', '==', teacherId));
    const snap = await getDocs(query(collection(db, 'examRetryPermits'), ...conds));
    if (!snap.empty) {
      return { ok: false, error: 'Bạn đã gửi yêu cầu rồi. Chờ giáo viên duyệt nhé.', duplicate: true };
    }

    const data = {
      examId,
      classId: classId || null,
      /* ❗ FIX: đề trong hệ chính (Supabase) KHÔNG có trường classId — trước đây
         classId luôn null → giáo viên chỉ lắng nghe theo classId nên KHÔNG BAO GIỜ
         thấy yêu cầu. Giờ lưu thêm teacherId (người tạo đề) để định tuyến đúng. */
      teacherId: teacherId || null,
      studentId: student.id,
      studentName: student.name || 'Học sinh',
      status: 'pending',
      reason: String(reason || '').slice(0, 300),
      requestedAt: serverTimestamp(),
      requestedAtMs: Date.now(),
      decidedAt: null,
      decidedBy: null,
      usedAt: null,
      note: '',
    };
    const newDocRef = doc(collection(db, 'examRetryPermits'));
    const permitData = { ok: true, id: newDocRef.id, ...data };
    const writePromise = setDoc(newDocRef, stripUndefined(data));
    await Promise.race([
      writePromise,
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]).catch((err) => {
      console.warn('[requestRetry] setDoc background warning:', err?.message);
    });
    return permitData;
  } catch (e) {
    console.error('[requestRetry] Lỗi:', e.code, e.message);
    return { ok: false, error: friendlyFirestoreError(e, 'gửi yêu cầu thi lại') };
  }
}

/* ------ GV: duyệt yêu cầu ------ */
export async function approveRetry({ permitId, teacherId, note = '' }) {
  if (!permitId) return { ok: false, error: 'Thiếu permitId' };
  try {
    await Promise.race([
      updateDoc(doc(db, 'examRetryPermits', permitId), {
        status: 'approved',
        decidedAt: serverTimestamp(),
        decidedAtMs: Date.now(),
        decidedBy: teacherId || null,
        note: String(note || '').slice(0, 200),
      }),
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);
    return { ok: true };
  } catch (e) {
    console.error('[approveRetry] Lỗi:', e.code, e.message);
    return { ok: false, error: friendlyFirestoreError(e, 'duyệt thi lại') };
  }
}

/* ------ GV: từ chối yêu cầu ------ */
export async function denyRetry({ permitId, teacherId, note = '' }) {
  if (!permitId) return { ok: false, error: 'Thiếu permitId' };
  try {
    await Promise.race([
      updateDoc(doc(db, 'examRetryPermits', permitId), {
        status: 'denied',
        decidedAt: serverTimestamp(),
        decidedAtMs: Date.now(),
        decidedBy: teacherId || null,
        note: String(note || '').slice(0, 200),
      }),
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);
    return { ok: true };
  } catch (e) {
    console.error('[denyRetry] Lỗi:', e.code, e.message);
    return { ok: false, error: friendlyFirestoreError(e, 'từ chối thi lại') };
  }
}

/* ------ GV: bật cho HS thi lại mọi đề của lớp ------ */
export async function setStudentRetryAllowance({ classId, studentId, allowed, teacherId }) {
  if (!classId || !studentId) return { ok: false, error: 'Thiếu thông tin.' };
  const id = `${classId}_${studentId}`;
  try {
    await setDoc(doc(db, 'studentRetryAllowance', id), {
      classId,
      studentId,
      allowed: !!allowed,
      updatedAt: serverTimestamp(),
      updatedAtMs: Date.now(),
      updatedBy: teacherId || null,
    }, { merge: true });
    return { ok: true, allowed: !!allowed };
  } catch (e) {
    console.error('[setStudentRetryAllowance] Lỗi:', e.code, e.message);
    return { ok: false, error: friendlyFirestoreError(e, 'bật quyền thi lại') };
  }
}

/* ------ HS: kiểm tra permit trước khi vào thi ------ */
export async function checkRetryPermit({ examId, classId, studentId }) {
  if (!examId || !studentId) return { canRetry: false, source: 'none' };
  try {
    // 1. Check permit riêng cho đề này
    const q = query(
      collection(db, 'examRetryPermits'),
      where('examId', '==', examId),
      where('studentId', '==', studentId)
    );
    const snap = await getDocs(q);
    const approved = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((p) => p.status === 'approved');

    if (approved.length > 0) {
      return { canRetry: true, source: 'permit', permit: approved[0] };
    }

    // 2. Check allowance của lớp
    if (classId) {
      const allowId = `${classId}_${studentId}`;
      const allowSnap = await getDoc(doc(db, 'studentRetryAllowance', allowId));
      if (allowSnap.exists() && allowSnap.data()?.allowed === true) {
        return { canRetry: true, source: 'allowance', allowanceId: allowId };
      }
    }

    return { canRetry: false, source: 'none' };
  } catch (e) {
    console.warn('[checkRetryPermit] Lỗi:', e.code, e.message);
    return { canRetry: false, source: 'error', error: e.message };
  }
}

/* ------ HS: đánh dấu permit đã dùng ------ */
export async function markPermitUsed({ permitId, teacherId }) {
  if (!permitId) return { ok: false };
  try {
    await Promise.race([
      updateDoc(doc(db, 'examRetryPermits', permitId), {
        status: 'used',
        usedAt: serverTimestamp(),
        usedAtMs: Date.now(),
      }),
      new Promise((resolve) => setTimeout(resolve, 1500)),
    ]).catch(() => {});
    return { ok: true };
  } catch (e) {
    console.warn('[markPermitUsed] Lỗi:', e.message);
    return { ok: false };
  }
}

/* ------ GV: lấy quyền thi lại theo lớp → { [studentId]: true } ------ */
export async function getClassAllowances(classId) {
  if (!classId) return {};
  try {
    const snap = await getDocs(query(collection(db, 'studentRetryAllowance'), where('classId', '==', classId)));
    const map = {};
    snap.docs.forEach((d) => { const x = d.data(); if (x.allowed === true) map[x.studentId] = true; });
    return map;
  } catch (e) {
    console.warn('[getClassAllowances]', e.message);
    return {};
  }
}

/* ------ GV: lấy danh sách yêu cầu ------ */
export async function getRetryRequests({ examId = null, classId = null, status = null } = {}) {
  try {
    const constraints = [];
    if (examId) constraints.push(where('examId', '==', examId));
    if (classId) constraints.push(where('classId', '==', classId));
    if (status) constraints.push(where('status', '==', status));
    constraints.push(orderBy('requestedAtMs', 'desc'));
    constraints.push(limit(200));

    const q = query(collection(db, 'examRetryPermits'), ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error('[getRetryRequests] Lỗi:', e.code, e.message);
    return [];
  }
}

/* ------ GV: lắng nghe yêu cầu thi lại của CÁC LỚP CỦA MÌNH ------
   Mỗi lớp 1 listener chỉ với where('classId','==',id): không cần composite index,
   và khớp các Firestore Rules giới hạn theo lớp. Sắp xếp phía client. */
export function listenRetryRequestsByClasses(classIds, cb, onError) {
  const ids = [...new Set((classIds || []).filter(Boolean))];
  if (ids.length === 0) { cb([]); return () => {}; }
  const bucket = new Map();
  const emit = () => cb(
    [...bucket.values()].flat().sort((a, b) => (b.requestedAtMs || 0) - (a.requestedAtMs || 0))
  );
  const unsubs = ids.map((id) => onSnapshot(
    query(collection(db, 'examRetryPermits'), where('classId', '==', id)),
    (snap) => {
      bucket.set(id, snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      emit();
    },
    (err) => {
      console.warn('[listenRetryRequestsByClasses] Lỗi:', err.code, err.message);
      onError?.(err);
    }
  ));
  return () => unsubs.forEach((u) => u && u());
}

/* GV: lắng nghe yêu cầu theo NGƯỜI TẠO ĐỀ — bắt cả yêu cầu từ đề không gắn lớp
   (đề Supabase không có classId nên trước đây những yêu cầu này biến mất). */
export function listenRetryRequestsByTeacher(teacherId, cb, onError) {
  if (!teacherId) { cb([]); return () => {}; }
  return onSnapshot(
    query(collection(db, 'examRetryPermits'), where('teacherId', '==', teacherId)),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => {
      console.warn('[listenRetryRequestsByTeacher] Lỗi:', err.code, err.message);
      onError?.(err);
    }
  );
}

/* ------ GV: lắng nghe realtime ------ */
export function listenRetryRequests(cb, { classId = null, status = null } = {}) {
  const constraints = [];
  if (classId) constraints.push(where('classId', '==', classId));
  if (status) constraints.push(where('status', '==', status));
  constraints.push(orderBy('requestedAtMs', 'desc'));
  constraints.push(limit(200));

  const q = query(collection(db, 'examRetryPermits'), ...constraints);
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, (err) => {
    console.warn('[listenRetryRequests] Lỗi:', err.code, err.message);
  });
}

/* ============ REALTIME ============ */
export function listenExamsByClass(classId, cb) {
  if (!classId) return () => {};
  const q = query(collection(db, 'exams'), where('classId', '==', classId));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, (err) => {
    console.warn('[listenExamsByClass] Lỗi:', err.code, err.message);
  });
}

/** Lắng nghe toàn bộ đề thi do giáo viên tạo theo thời gian thực (Realtime cho TeacherDashboard) */
export function listenExamsByTeacher(teacherId, cb) {
  if (!teacherId) return () => {};
  const q = query(collection(db, 'exams'), where('teacherId', '==', teacherId));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => (tsMs(b.createdAt) || 0) - (tsMs(a.createdAt) || 0));
    cb(list);
  }, (err) => {
    console.warn('[listenExamsByTeacher] Lỗi:', err.code, err.message);
  });
}

/** Lắng nghe danh sách lớp học do giáo viên phụ trách theo thời gian thực (Realtime cho TeacherDashboard) */
export function listenClassesByTeacher(teacherId, cb) {
  if (!teacherId) return () => {};
  const q = query(collection(db, 'classes'), where('teacherId', '==', teacherId));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => (tsMs(b.createdAt) || 0) - (tsMs(a.createdAt) || 0));
    cb(list);
  }, (err) => {
    console.warn('[listenClassesByTeacher] Lỗi:', err.code, err.message);
  });
}

export function listenSubmissions(examId, cb) {
  if (!examId) return () => {};
  const q = query(collection(db, 'submissions'), where('examId', '==', examId));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, (err) => {
    console.warn('[listenSubmissions] Lỗi:', err.code, err.message);
  });
}

export function listenAttempts(examId, cb) {
  if (!examId) return () => {};
  return onSnapshot(collection(db, 'exams', examId, 'attempts'), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, (err) => {
    console.warn('[listenAttempts] Lỗi:', err.code, err.message);
  });
}

/* ============================================================
   QUẢN LÝ ĐỀ (v5): sửa / nhân bản / đóng-mở / gia hạn / chấm lại
   ============================================================ */
const sumPoints = (qs = []) => Math.round(qs.reduce((t, q) => t + (Number(q.points) || 1), 0) * 100) / 100;

/** Sửa thông tin đề. Nếu đổi `questions` thì tự tính lại tổng điểm. */
export async function updateExam(examId, patch = {}) {
  if (!examId) throw new Error('Thiếu mã đề');
  const allowed = ['title', 'description', 'duration', 'questions', 'showAnswerAfter',
    'allowRetry', 'shuffle', 'opensAt', 'closesAt', 'proctor', 'active', 'visibility', 'lockUntilStart'];
  const data = {};
  allowed.forEach((k) => { if (k in patch) data[k] = patch[k]; });
  if (data.questions) data.totalPoints = sumPoints(data.questions);
  if ('duration' in data) data.duration = Number(data.duration) || 15;
  data.updatedAt = serverTimestamp();
  try {
    await updateDoc(doc(db, 'exams', examId), data);
    return { ok: true };
  } catch (e) {
    throw new Error(friendlyFirestoreError(e, 'sửa đề'));
  }
}

/**
 * Công khai / riêng tư một đề.
 * 'private'  → chỉ thành viên lớp (và giáo viên) vào được bằng link.
 * 'public'   → ai có link cũng làm được (đề ôn tập, đề thi thử).
 * Rules kiểm tra lại giá trị này khi đọc đề và khi nộp bài.
 */
/**
 * Khoá bài: bật → học sinh chỉ vào được khi giáo viên ĐÃ bấm "Bắt đầu thi"
 * (có phòng thi trực tiếp đang mở). Chưa mở phòng thì học sinh vào chế độ
 * LUYỆN TẬP: chấm tại chỗ, không ghi bài nộp, không tính vi phạm.
 */
export async function setExamLock(examId, locked) {
  if (!examId) throw new Error('Thiếu mã đề');
  const lockUntilStart = !!locked;
  try {
    await updateDoc(doc(db, 'exams', examId), { lockUntilStart });
    return { ok: true, lockUntilStart };
  } catch (e) {
    throw new Error(friendlyFirestoreError(e, 'đổi chế độ khoá bài'));
  }
}

export async function setExamVisibility(examId, visibility) {
  if (!examId) throw new Error('Thiếu mã đề');
  const v = visibility === 'public' ? 'public' : 'private';
  try {
    await updateDoc(doc(db, 'exams', examId), {
      visibility: v,
      visibilityUpdatedAt: serverTimestamp(),
    });
    return { ok: true, visibility: v };
  } catch (e) {
    throw new Error(friendlyFirestoreError(e, 'đổi chế độ công khai'));
  }
}

/** Nhân bản đề (sang lớp khác nếu truyền classId). Token mới, không chép bài nộp. */
export async function duplicateExam(examId, { classId = null, titleSuffix = ' (bản sao)' } = {}) {
  const src = await getExamById(examId);
  if (!src) throw new Error('Đề gốc không tồn tại');
  return createExam({
    teacherId: src.teacherId,
    teacherName: src.teacherName,
    classId: classId || src.classId,
    title: `${src.title}${titleSuffix}`,
    description: src.description,
    duration: src.duration,
    questions: src.questions,
    showAnswerAfter: src.showAnswerAfter,
    allowRetry: src.allowRetry,
    shuffle: src.shuffle,
    opensAt: null,
    closesAt: null,
    proctor: src.proctor,
  });
}

/** Đóng đề ngay (học sinh không vào được nữa) hoặc mở lại. */
export const setExamActive = (examId, active) => updateExam(examId, { active: !!active });

/** Gia hạn: dời giờ đóng thêm `minutes` phút (tính từ giờ đóng cũ, hoặc từ bây giờ nếu đã quá hạn). */
export async function extendExam(examId, minutes = 15) {
  const exam = await getExamById(examId);
  if (!exam) throw new Error('Đề không tồn tại');
  const base = Math.max(Date.now(), exam.closesAt ? new Date(exam.closesAt).getTime() : 0);
  const closesAt = new Date(base + Number(minutes) * 60000).toISOString();
  await updateExam(examId, { closesAt, active: true });
  return { ok: true, closesAt };
}

/** Điểm một bài theo đáp án hiện tại của đề. */
export function gradeAnswers(questions, answers = {}) {
  return scoreExam(questions, answers);
}

/**
 * CHẤM LẠI khi giáo viên đổi đáp án đúng (hỗ trợ cả 3 phần: Trắc nghiệm, Đúng/Sai, Trả lời ngắn).
 * changes: { [chỉ số câu]: chỉ số đáp án đúng mới | { statements } | { answer, accepted } }
 * Trả về { ok, changed, total, avg }
 */
export async function regradeExam(examId, changes = {}) {
  const exam = await getExamById(examId);
  if (!exam) throw new Error('Đề không tồn tại');

  const questions = (exam.questions || []).map((q, i) => {
    const c = changes[i];
    if (c == null) return q;
    if (typeof c === 'object' && !Array.isArray(c)) {
      const next = { ...q, ...c };
      if (Array.isArray(c.statements)) {
        next.statements = c.statements.map((s) => ({
          ...s,
          answer: Boolean(s.answer ?? s.correct),
          correct: Boolean(s.answer ?? s.correct),
        }));
      }
      return next;
    }
    return { ...q, correct: Number(c) };
  });
  const totalPoints = sumPoints(questions);

  const subs = await getSubmissionsByExam(examId);
  let changed = 0;
  let sum = 0;

  // Firestore giới hạn 500 thao tác / batch
  for (let i = 0; i < subs.length; i += 400) {
    const batch = writeBatch(db);
    subs.slice(i, i + 400).forEach((sub) => {
      const g = gradeAnswers(questions, sub.answers || {});
      sum += g.score;
      if (g.score !== sub.score || g.correctCount !== sub.correctCount) changed += 1;
      batch.update(doc(db, 'submissions', sub.id), stripUndefined({
        detail: g.detail, score: g.score, correctCount: g.correctCount,
        totalPoints, regradedAt: serverTimestamp(),
      }));
    });
    // eslint-disable-next-line no-await-in-loop
    await batch.commit();
  }

  await updateDoc(doc(db, 'exams', examId), stripUndefined({
    questions, totalPoints, regradedAt: serverTimestamp(),
    stats: { submitted: subs.length, avg: subs.length ? +(sum / subs.length).toFixed(2) : 0 },
  }));
  return { ok: true, changed, total: subs.length, avg: subs.length ? sum / subs.length : 0 };
}

/* ============================================================
   THỐNG KÊ & PHÂN TÍCH ĐÁP ÁN NHIỄU (tính từ submissions đã tải, chuẩn 3 phần)
   ============================================================ */
export function analyzeSubmissions(exam, subs = []) {
  const n = subs.length;
  const examTotalPts = Number(exam?.totalPoints) || sumPoints(exam?.questions || []) || 10;
  const scores10 = subs.map((s) => {
    const raw = Number(s?.score) || 0;
    const max = Number(s?.totalPoints) || examTotalPts || 10;
    return max > 0 ? Math.round(((raw / max) * 10) * 100) / 100 : raw;
  });

  const questions = (exam?.questions || []).map((q, qi) => {
    const type = qType(q);
    const isMC = type === 'single_choice';
    const isTF = type === 'true_false';
    const isSA = type === 'short_answer';
    const counts = new Array(isMC ? (q.options || []).length : 0).fill(0);
    const stmtCorrectCounts = isTF ? new Array((q.statements || []).length).fill(0) : [];
    const wrongShortMap = new Map();
    let skipped = 0;
    let earnedRatioSum = 0;
    let fullCorrectCount = 0;

    subs.forEach((s) => {
      const rawAns = s.answers?.[qi] !== undefined ? s.answers[qi] : s.detail?.[qi]?.picked;
      const answered = isAnswered(q, rawAns);
      if (!answered) {
        skipped += 1;
        return;
      }
      const res = scoreQuestion(q, rawAns);
      const ratio = res.max > 0 ? (res.earned / res.max) : (res.isCorrect ? 1 : 0);
      earnedRatioSum += ratio;
      if (res.isCorrect) fullCorrectCount += 1;

      if (isMC) {
        const p = typeof rawAns === 'number' ? rawAns : res.picked;
        if (typeof p === 'number' && p >= 0 && p < counts.length) counts[p] += 1;
      } else if (isTF) {
        const stmts = q.statements || [];
        const pickedArr = Array.isArray(res.picked) ? res.picked : [];
        stmts.forEach((stmt, si) => {
          const target = Boolean(stmt.answer ?? stmt.correct);
          if (pickedArr[si] === target) stmtCorrectCounts[si] += 1;
        });
      } else if (isSA && !res.isCorrect) {
        const txt = String(rawAns ?? '').trim();
        if (txt) wrongShortMap.set(txt, (wrongShortMap.get(txt) || 0) + 1);
      }
    });

    const correctRate = n
      ? (isMC ? (counts[q.correct] || 0) / n : earnedRatioSum / n)
      : 0;
    const fullCorrectRate = n ? fullCorrectCount / n : 0;

    const topWrong = isMC
      ? counts
          .map((c, oi) => ({ oi, c }))
          .filter((x) => x.oi !== q.correct)
          .sort((a, b) => b.c - a.c)[0]
      : null;

    let topWrongShort = null;
    if (isSA && wrongShortMap.size > 0) {
      const sorted = [...wrongShortMap.entries()].sort((a, b) => b[1] - a[1]);
      topWrongShort = { text: sorted[0][0], c: sorted[0][1] };
    }

    const statementRates = isTF
      ? stmtCorrectCounts.map((c) => (n ? c / n : 0))
      : [];

    return {
      index: qi,
      type,
      counts,
      skipped,
      correctRate,
      fullCorrectRate,
      statementRates,
      difficulty: correctRate >= 0.8 ? 'dễ' : correctRate >= 0.5 ? 'vừa' : 'khó',
      topDistractor: topWrong && topWrong.c > 0 ? topWrong : null,
      topWrongShort,
      suspicious: n >= 3 && correctRate < 0.2 && skipped < n * 0.8,
    };
  });

  return {
    submitted: n,
    avg: n ? Math.round((scores10.reduce((a, b) => a + b, 0) / n) * 100) / 100 : 0,
    max: n ? Math.max(...scores10) : 0,
    min: n ? Math.min(...scores10) : 0,
    questions,
  };
}

/* ============================================================
   LỊCH SỬ & THÔNG BÁO THI LẠI cho học sinh
   ============================================================ */
export function listenMyRetryRequests(studentId, cb, onError) {
  if (!studentId) return () => {};
  const q = query(collection(db, 'examRetryPermits'), where('studentId', '==', studentId));
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (e) => { console.warn('[listenMyRetryRequests]', e.code, e.message); onError?.(e); }
  );
}

/* ============================================================
   TOP CHUỖI LỚP HỌC (cho ChatWidget & BXH)
   ============================================================ */
export async function getTopStreakClasses(limitCount = 3) {
  try {
    const q = query(collection(db, 'classes'), limit(20));
    const snap = await getDocs(q);
    if (snap.empty) return [];
    const list = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((c) => (c.streak?.count || 0) > 0);
    list.sort((a, b) => (b.streak?.count || 0) - (a.streak?.count || 0));
    return list.slice(0, limitCount);
  } catch (e) {
    console.warn('[getTopStreakClasses]', e);
    return [];
  }
}