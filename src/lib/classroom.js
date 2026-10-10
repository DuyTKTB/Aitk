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
  orderBy, limit,
} from 'firebase/firestore';
import { db } from './firebase.js';

/* ============ HELPERS ============ */
export function generateClassKey(className = 'LOP') {
  const clean = className
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6) || 'LOP';
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${clean}-${rand}`;
}

export function generateExamToken() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

function friendlyFirestoreError(e, context = '') {
  if (!e) return 'Lỗi không xác định';
  const code = e.code || '';
  const msg = e.message || '';

  if (code === 'permission-denied' || /insufficient permissions/i.test(msg)) {
    return `Firestore Rules chặn${context ? ` (${context})` : ''}. Vào Firebase Console → Firestore → Rules để cấp quyền.`;
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
    const ref = await addDoc(collection(db, 'classes'), data);
    return { id: ref.id, ...data };
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
    console.log('[joinClassByKey] Bắt đầu join lớp:', { key: classKey, student });

    const cls = await findClassByKey(classKey);
    if (!cls) {
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

    for (const p of pending) {
      // eslint-disable-next-line no-await-in-loop
      await approveMember(classId, p.id);
    }
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

/* ============================================================
   EXAMS
   ============================================================ */
export async function createExam({
  teacherId, teacherName, classId,
  title, description, duration, questions,
  showAnswerAfter, allowRetry, shuffle,
  opensAt = null, closesAt = null,
  proctor = null,
}) {
  const totalPoints = (questions || []).reduce((s, q) => s + (q.points || 1), 0);

  const data = {
    token: generateExamToken(),
    teacherId,
    teacherName,
    classId,
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
  try {
    const ref = await addDoc(collection(db, 'exams'), data);
    return { id: ref.id, ...data };
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
    if (exam.opensAt && now < new Date(exam.opensAt).getTime()) status = 'not-open';
    else if (exam.closesAt && now > new Date(exam.closesAt).getTime()) status = 'closed';

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
      const s = await getDocs(q);
      await Promise.all(s.docs.map((d) => deleteDoc(d.ref)));
    };
    await kill(query(collection(db, 'submissions'), where('examId', '==', examId)));
    await kill(query(collection(db, 'examRetryPermits'), where('examId', '==', examId)));
    await kill(collection(db, 'exams', examId, 'attempts'));
    await deleteDoc(doc(db, 'exams', examId));
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

    if (snap.exists()) {
      const data = snap.data();

      if (!data.submittedAt) {
        return { id: attemptId, ...data, restored: true, submitted: false };
      }

      const exam = await getExamById(examId);
      if (!exam?.allowRetry && !forceNew) {
        return { id: attemptId, ...data, restored: true, submitted: true };
      }

      console.log('[startAttempt] Đề cho làm lại — tạo attempt mới');
    }

    const data = {
      studentId: student.id,
      studentName: student.name,
      startedAt: Date.now(),
      answers: {},
      submittedAt: null,
      timeSpent: 0,
      events: [],
      violationCount: 0,
      autoSubmitted: false,
      cameraStatus: 'off',
    };
    await setDoc(ref, data);
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
    await updateDoc(ref, { answers });
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
    await updateDoc(ref, { events: arrayUnion(...events) }); // atomic, không mất sự kiện khi ghi song song
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
export async function submitExam({ examId, student, answers, timeSpent, attemptMeta = {} }) {
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
  if (exam.opensAt && now < new Date(exam.opensAt).getTime()) {
    return { ok: false, error: 'Đề chưa mở.' };
  }
  // Cho nộp trễ tối đa bằng thời lượng đề (HS bắt đầu trước giờ đóng vẫn được nộp)
  if (exam.closesAt && now > new Date(exam.closesAt).getTime() + (Number(exam.duration) || 0) * 60000) {
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
  if (attemptMeta.isRetry && oldSnap.docs?.length > 0) {
    const p = await checkRetryPermit({ examId, classId: exam.classId, studentId: student.id });
    retryOk = !!p.canRetry;
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
  let correctCount = 0;
  let score = 0;
  const detail = exam.questions.map((q, i) => {
    const picked = typeof answers[i] === 'number' ? answers[i] : -1;
    const isCorrect = picked === q.correct;
    if (isCorrect) {
      correctCount++;
      score += q.points || 1;
    }
    return { index: i, picked, correct: q.correct, isCorrect };
  });

  const data = {
    examId,
    studentId: student.id,
    studentName: student.name,
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

  let subId;
  try {
    const ref = await addDoc(collection(db, 'submissions'), data);
    subId = ref.id;
  } catch (e) {
    console.error('[submitExam] Ghi submission lỗi:', e.code, e.message);
    return {
      ok: true,
      id: null,
      score,
      correct: correctCount,
      total: exam.questions.length,
      totalPoints: exam.totalPoints,
      detail,
      saveError: friendlyFirestoreError(e, 'lưu bài nộp'),
    };
  }

  // Đánh dấu attempt đã nộp
  try {
    const attemptId = `${examId}_${student.id}`;
    await updateDoc(doc(db, 'exams', examId, 'attempts', attemptId), {
      submittedAt: Date.now(),
      timeSpent: timeSpent || 0,
      autoSubmitted: !!attemptMeta.autoSubmitted,
      violationCount: attemptMeta.violationCount || 0,
      cameraStatus: attemptMeta.cameraStatus || 'off',
      submissionId: subId,
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

export async function getSubmissionForStudent(examId, studentId) {
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
export async function getAllSubmissionsForStudent(examId, studentId) {
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
export async function requestRetry({ examId, classId, student, reason = '' }) {
  if (!examId || !student?.id) {
    return { ok: false, error: 'Thiếu thông tin.' };
  }
  try {
    // Kiểm tra xem đã có yêu cầu pending chưa
    const q = query(
      collection(db, 'examRetryPermits'),
      where('examId', '==', examId),
      where('studentId', '==', student.id),
      where('status', '==', 'pending')
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return { ok: false, error: 'Bạn đã gửi yêu cầu rồi. Chờ giáo viên duyệt nhé.', duplicate: true };
    }

    const data = {
      examId,
      classId: classId || null,
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
    const ref = await addDoc(collection(db, 'examRetryPermits'), data);
    return { ok: true, id: ref.id, ...data };
  } catch (e) {
    console.error('[requestRetry] Lỗi:', e.code, e.message);
    return { ok: false, error: friendlyFirestoreError(e, 'gửi yêu cầu thi lại') };
  }
}

/* ------ GV: duyệt yêu cầu ------ */
export async function approveRetry({ permitId, teacherId, note = '' }) {
  if (!permitId) return { ok: false, error: 'Thiếu permitId' };
  try {
    await updateDoc(doc(db, 'examRetryPermits', permitId), {
      status: 'approved',
      decidedAt: serverTimestamp(),
      decidedAtMs: Date.now(),
      decidedBy: teacherId || null,
      note: String(note || '').slice(0, 200),
    });
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
    await updateDoc(doc(db, 'examRetryPermits', permitId), {
      status: 'denied',
      decidedAt: serverTimestamp(),
      decidedAtMs: Date.now(),
      decidedBy: teacherId || null,
      note: String(note || '').slice(0, 200),
    });
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
    await updateDoc(doc(db, 'examRetryPermits', permitId), {
      status: 'used',
      usedAt: serverTimestamp(),
      usedAtMs: Date.now(),
    });
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