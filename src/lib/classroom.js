/* ============================================================
   CLASSROOM — Firestore version (v3)
   ------------------------------------------------------------
   • Chấm điểm NGAY khi nộp (client-side)
   • Lưu attempt để khôi phục sau reload
   • Hỗ trợ opensAt / closesAt / proctor (strict mode)
   • Log debug rõ ràng để fix lỗi Firestore Rules
   • Xử lý race condition khi join lớp
   ============================================================ */
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, setDoc,
  query, where, serverTimestamp, arrayUnion, arrayRemove, onSnapshot,
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

/* Friendly error message từ Firestore error */
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

/* ============ CLASSES ============ */
export async function createClass({ name, teacherId, teacherName, subject }) {
  const data = {
    name: name || 'Lớp mới',
    subject: subject || 'Hóa học',
    teacherId,
    teacherName,
    key: generateClassKey(name),
    members: [],
    memberIds: [],
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

    const newMember = {
      id: student.id,
      name: student.name,
      email: student.email,
      role: 'member',
      joinedAt: new Date().toISOString(),
    };

    await updateDoc(doc(db, 'classes', cls.id), {
      members: arrayUnion(newMember),
      memberIds: arrayUnion(student.id),
    });

    console.log('[joinClassByKey] ✅ Join thành công');
    return { ok: true, class: { ...cls, members: [...(cls.members || []), newMember] } };
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

/* ============ EXAMS ============ */
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

/* ============ PROCTOR CONFIG — STRICT MODE MẶC ĐỊNH ============ */
export function defaultProctor() {
  return {
    // Cơ bản
    fullscreenLock: true,
    tabSwitchLimit: 3,
    blockCopyPaste: true,

    // STRICT MODE
    strictMode: true,

    // Camera
    camera: 'off',
    cameraChecks: {
      noFace: true,
      multiFace: true,
      lookAway: true,
      handRaise: true,
      phoneLike: true,
    },

    // Snapshot
    snapshotOnEvent: true,
    maxSnapshots: 10,
    retentionDays: 30,

    // Chặn bổ sung
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
    await deleteDoc(doc(db, 'exams', examId));
  } catch (e) {
    console.error('[deleteExam] Lỗi:', e.code, e.message);
    throw new Error(friendlyFirestoreError(e, 'xóa đề'));
  }
}

/* ============ ATTEMPTS ============ */
export async function startAttempt({ examId, student }) {
  if (!examId || !student?.id) throw new Error('Thiếu thông tin attempt');
  const attemptId = `${examId}_${student.id}`;
  const ref = doc(db, 'exams', examId, 'attempts', attemptId);

  try {
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const data = snap.data();
      return { id: attemptId, ...data, restored: true, submitted: !!data.submittedAt };
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
    // Attempt có thể chưa tạo → bỏ qua
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
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const cur = snap.data();
    const merged = [...(cur.events || []), ...events];
    await updateDoc(ref, { events: merged });
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

/* ============ SUBMISSIONS ============ */
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
  if (exam.closesAt && now > new Date(exam.closesAt).getTime()) {
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

  if (!exam.allowRetry && oldSnap.docs?.length > 0) {
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
  };

  let subId;
  try {
    const ref = await addDoc(collection(db, 'submissions'), data);
    subId = ref.id;
  } catch (e) {
    console.error('[submitExam] Ghi submission lỗi:', e.code, e.message);
    // Vẫn trả kết quả chấm cho HS xem
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
    const d = snap.docs[0];
    return { id: d.id, ...d.data() };
  } catch (e) {
    console.error('[getSubmissionForStudent] Lỗi:', e.code, e.message);
    return null;
  }
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