/* ============================================================
   examSession.js — Quản lý PHÒNG THI TRỰC TIẾP (Live Exam Session) v2
   ------------------------------------------------------------
   KHÔNG dùng orderBy trong query để tránh cần composite index.
   Sort client-side.

   Firestore structure:
     /examSessions/{sessionId}
       ├─ examId, examToken, classId, teacherId, teacherName
       ├─ title, duration, status, startedAt, closesAt
       ├─ stats: { joined, submitted, violationCount }
       └─ /students/{studentId}
           ├─ studentName, joinedAt, lastSeen
           ├─ status: 'joined' | 'examining' | 'submitted' | 'kicked' | 'paused'
           ├─ paused: boolean               ← MỚI: GV bật/tắt
           ├─ pausedAtMs: number            ← MỚI: thời điểm bật
           ├─ currentQuestion, answered
           ├─ thumbnail (base64), thumbnailAt, thumbnailAtMs, motion
           ├─ burst: { frames, reason, at }
           ├─ warning: { message, at }
           └─ violations: [{ type, severity, at, snapshotUrl, meta }]

   Thay đổi so với v1:
     • Thêm setStudentPaused({ sessionId, studentId, paused }) → GV
       điều khiển thật sự, không còn qua regex tin nhắn.
     • markStudentSubmitted: check status trước khi tăng stats.submitted
       → tránh gọi 2 lần (nộp tay + auto) tăng stats 2 lần.
   ============================================================ */
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, setDoc,
  query, where, serverTimestamp, onSnapshot, arrayUnion, increment,
  Timestamp, limit, runTransaction,
} from 'firebase/firestore';
import { db } from './firebase.js';

const SESSIONS = 'examSessions';
const HEARTBEAT_TIMEOUT_MS = 60 * 1000;

/* ============ HELPERS ============ */
const rid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export function isStudentOnline(student, now = Date.now()) {
  const ts = student?.lastSeenMs ?? student?.lastSeen?.toMillis?.() ?? student?.lastSeen;
  if (!ts) return false;
  return now - ts < HEARTBEAT_TIMEOUT_MS;
}

export function timeRemaining(session, now = Date.now()) {
  if (!session?.closesAt) return 0;
  const end = session.closesAt?.toMillis?.() ?? session.closesAtMs ?? session.closesAt;
  return Math.max(0, Math.floor((end - now) / 1000));
}

export function secondsSinceUpdate(student, now = Date.now()) {
  const ts = student?.thumbnailAtMs || 0;
  if (!ts) return Infinity;
  return Math.floor((now - ts) / 1000);
}

/* ============================================================
   1) TEACHER — Tạo / quản lý session
   ============================================================ */

export async function createExamSession({
  examId,
  examToken,
  classId,
  teacherId,
  teacherName,
  title,
  duration = 15,
}) {
  if (!examId || !classId || !teacherId) {
    throw new Error('Thiếu thông tin để tạo phòng thi.');
  }

  const now = Date.now();
  const closesAt = Timestamp.fromMillis(now + duration * 60 * 1000);

  const data = {
    sessionId: rid(),
    examId,
    examToken: examToken || null,
    classId,
    teacherId,
    teacherName: teacherName || 'Giáo viên',
    title: title || 'Bài kiểm tra',
    duration: Number(duration) || 15,
    status: 'live',
    startedAt: serverTimestamp(),
    startedAtMs: now,
    closesAt,
    closesAtMs: now + duration * 60 * 1000,
    endedAt: null,
    endedAtMs: null,
    stats: {
      joined: 0,
      submitted: 0,
      violationCount: 0,
    },
    createdAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, SESSIONS), data);
  return { id: ref.id, ...data };
}

export async function endExamSession(sessionId) {
  if (!sessionId) return;
  await updateDoc(doc(db, SESSIONS, sessionId), {
    status: 'ended',
    endedAt: serverTimestamp(),
    endedAtMs: Date.now(),
  });
}

export async function deleteExamSession(sessionId) {
  if (!sessionId) return;
  await deleteDoc(doc(db, SESSIONS, sessionId));
}

export async function getExamSession(sessionId) {
  if (!sessionId) return null;
  const snap = await getDoc(doc(db, SESSIONS, sessionId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function getLiveSessionForClass(classId) {
  if (!classId) return null;
  const q = query(
    collection(db, SESSIONS),
    where('classId', '==', classId),
    where('status', '==', 'live')
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  docs.sort((a, b) => (b.startedAtMs || 0) - (a.startedAtMs || 0));
  return docs[0];
}

export async function getSessionsByTeacher(teacherId, max = 30) {
  if (!teacherId) return [];
  const q = query(
    collection(db, SESSIONS),
    where('teacherId', '==', teacherId),
    limit(max)
  );
  const snap = await getDocs(q);
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  list.sort((a, b) => (b.startedAtMs || 0) - (a.startedAtMs || 0));
  return list;
}

export async function getSessionByExam(examId) {
  if (!examId) return null;
  const q = query(
    collection(db, SESSIONS),
    where('examId', '==', examId),
    limit(10)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  docs.sort((a, b) => (b.startedAtMs || 0) - (a.startedAtMs || 0));
  return docs[0];
}

/* ============================================================
   2) TEACHER — Real-time listeners
   ============================================================ */

export function listenSession(sessionId, cb) {
  if (!sessionId) return () => {};
  return onSnapshot(
    doc(db, SESSIONS, sessionId),
    (snap) => {
      if (!snap.exists()) return cb(null);
      cb({ id: snap.id, ...snap.data() });
    },
    (err) => console.warn('[examSession] listenSession error:', err.message)
  );
}

export function listenSessionStudents(sessionId, cb) {
  if (!sessionId) return () => {};
  const q = query(collection(db, SESSIONS, sessionId, 'students'));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (a.joinedAtMs || 0) - (b.joinedAtMs || 0));
      cb(list);
    },
    (err) => console.warn('[examSession] listenSessionStudents error:', err.message)
  );
}

export function listenLiveSessionForClass(classId, cb) {
  if (!classId) return () => {};
  const q = query(
    collection(db, SESSIONS),
    where('classId', '==', classId),
    where('status', '==', 'live')
  );
  return onSnapshot(
    q,
    (snap) => {
      if (snap.empty) return cb(null);
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      docs.sort((a, b) => (b.startedAtMs || 0) - (a.startedAtMs || 0));
      cb(docs[0]);
    },
    (err) => console.warn('[examSession] listenLiveSessionForClass error:', err.message)
  );
}

/* ============================================================
   3) STUDENT — Join / heartbeat / submit
   ============================================================ */

export async function joinExamSession({
  sessionId,
  studentId,
  studentName,
}) {
  if (!sessionId || !studentId) {
    throw new Error('Thiếu sessionId hoặc studentId.');
  }

  const ref = doc(db, SESSIONS, sessionId, 'students', studentId);

  let snap;
  try {
    snap = await getDoc(ref);
  } catch (e) {
    console.error('[examSession] getDoc failed:', e.code, e.message);
    throw new Error(`Không đọc được session (${e.code || 'unknown'}): ${e.message}`);
  }

  if (snap.exists()) {
    try {
      await updateDoc(ref, {
        lastSeen: serverTimestamp(),
        lastSeenMs: Date.now(),
      });
    } catch (e) {
      console.error('[examSession] updateDoc failed:', e.code, e.message);
      throw new Error(`Không update được session (${e.code || 'unknown'}): ${e.message}`);
    }
    return { id: studentId, restored: true };
  }

  try {
    await setDoc(ref, {
      studentId,
      studentName: studentName || 'Học sinh',
      joinedAt: serverTimestamp(),
      joinedAtMs: Date.now(),
      lastSeen: serverTimestamp(),
      lastSeenMs: Date.now(),
      status: 'joined',
      paused: false,
      pausedAtMs: null,
      currentQuestion: 0,
      answered: 0,
      thumbnail: null,
      thumbnailAt: null,
      thumbnailAtMs: null,
      motion: false,
      burst: null,
      violations: [],
      warning: null,
    });
  } catch (e) {
    console.error('[examSession] setDoc failed:', e.code, e.message);
    throw new Error(`Không tạo được document HS (${e.code || 'unknown'}): ${e.message}`);
  }

  try {
    await updateDoc(doc(db, SESSIONS, sessionId), {
      'stats.joined': increment(1),
    });
  } catch (e) {
    console.warn('[examSession] increment stats failed:', e.message);
  }

  return { id: studentId, restored: false };
}

export async function heartbeat({
  sessionId,
  studentId,
  currentQuestion,
  answered,
  status,
  studentName,
}) {
  if (!sessionId || !studentId) return;

  const patch = {
    lastSeen: serverTimestamp(),
    lastSeenMs: Date.now(),
  };
  if (typeof currentQuestion === 'number') patch.currentQuestion = currentQuestion;
  if (typeof answered === 'number') patch.answered = answered;
  if (status) patch.status = status;

  const ref = doc(db, SESSIONS, sessionId, 'students', studentId);

  try {
    await updateDoc(ref, patch);
  } catch (e) {
    if (e.code === 'not-found') {
      console.warn('[examSession] heartbeat: doc không tồn tại, tự tạo lại.');
      try {
        await setDoc(ref, {
          studentId,
          studentName: studentName || 'Học sinh',
          joinedAt: serverTimestamp(),
          joinedAtMs: Date.now(),
          ...patch,
          paused: false,
          pausedAtMs: null,
          thumbnail: null,
          thumbnailAt: null,
          thumbnailAtMs: null,
          motion: false,
          burst: null,
          violations: [],
          warning: null,
        });
        try {
          await updateDoc(doc(db, SESSIONS, sessionId), {
            'stats.joined': increment(1),
          });
        } catch { /* */ }
      } catch (err2) {
        console.error('[examSession] heartbeat: tạo lại doc fail:', err2.code, err2.message);
      }
    } else {
      console.warn('[examSession] heartbeat failed:', e.code, e.message);
    }
  }
}

export async function uploadThumbnail({ sessionId, studentId, dataUrl }) {
  return uploadThumbnailV2({ sessionId, studentId, dataUrl, motion: false });
}

export async function uploadThumbnailV2({ sessionId, studentId, dataUrl, motion = false }) {
  if (!sessionId || !studentId || !dataUrl) return;
  try {
    await updateDoc(doc(db, SESSIONS, sessionId, 'students', studentId), {
      thumbnail: dataUrl,
      thumbnailAt: serverTimestamp(),
      thumbnailAtMs: Date.now(),
      motion,
    });
  } catch (e) {
    if (e.code !== 'not-found') {
      console.warn('[examSession] uploadThumbnailV2 failed:', e.message);
    }
  }
}

export async function uploadBurst({ sessionId, studentId, frames, reason = '' }) {
  if (!sessionId || !studentId || !Array.isArray(frames) || frames.length === 0) return;
  const cleanFrames = frames.filter(Boolean).slice(0, 6);
  if (cleanFrames.length === 0) return;
  try {
    await updateDoc(doc(db, SESSIONS, sessionId, 'students', studentId), {
      burst: {
        frames: cleanFrames,
        reason,
        at: Date.now(),
      },
      lastSeen: serverTimestamp(),
      lastSeenMs: Date.now(),
    });
  } catch (e) {
    if (e.code !== 'not-found') {
      console.warn('[examSession] uploadBurst failed:', e.message);
    }
  }
}

export async function reportViolation({
  sessionId,
  studentId,
  type,
  severity = 'hard',
  snapshotUrl = null,
  meta = {},
  studentName,
}) {
  if (!sessionId || !studentId || !type) return;

  const violation = {
    type,
    severity,
    at: Date.now(),
    snapshotUrl,
    meta,
  };

  const ref = doc(db, SESSIONS, sessionId, 'students', studentId);

  try {
    await updateDoc(ref, {
      violations: arrayUnion(violation),
      lastSeen: serverTimestamp(),
      lastSeenMs: Date.now(),
    });
  } catch (e) {
    if (e.code === 'not-found') {
      console.warn('[examSession] reportViolation: doc chưa có, tự tạo.');
      try {
        await setDoc(ref, {
          studentId,
          studentName: studentName || 'Học sinh',
          joinedAt: serverTimestamp(),
          joinedAtMs: Date.now(),
          lastSeen: serverTimestamp(),
          lastSeenMs: Date.now(),
          status: 'examining',
          paused: false,
          pausedAtMs: null,
          currentQuestion: 0,
          answered: 0,
          thumbnail: null,
          thumbnailAt: null,
          thumbnailAtMs: null,
          motion: false,
          burst: null,
          violations: [violation],
          warning: null,
        });
      } catch (err2) {
        console.error('[examSession] reportViolation: tạo doc fail:', err2.code, err2.message);
      }
    } else {
      console.warn('[examSession] reportViolation failed:', e.code, e.message);
    }
  }

  if (severity === 'hard') {
    try {
      await updateDoc(doc(db, SESSIONS, sessionId), {
        'stats.violationCount': increment(1),
      });
    } catch { /* */ }
  }
}

/* ============================================================
   FIX #8: markStudentSubmitted
   ------------------------------------------------------------
   Trước đây gọi 2 lần (nộp tay + auto) sẽ tăng stats.submitted 2 lần.
   Nay đọc doc HS trước, nếu đã 'submitted' thì không tăng nữa.
   ============================================================ */
export async function markStudentSubmitted({ sessionId, studentId }) {
  if (!sessionId || !studentId) return;
  try {
    const ref = doc(db, SESSIONS, sessionId, 'students', studentId);
    const sref = doc(db, SESSIONS, sessionId);
    // Transaction: gọi nhiều lần (nộp tay + auto) vẫn chỉ tăng stats.submitted đúng 1 lần
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (snap.exists() && snap.data()?.status === 'submitted') return;
      tx.set(ref, {
        studentId,
        status: 'submitted',
        submittedAt: serverTimestamp(),
        submittedAtMs: Date.now(),
        lastSeen: serverTimestamp(),
        lastSeenMs: Date.now(),
      }, { merge: true });
      tx.update(sref, { 'stats.submitted': increment(1) });
    });
  } catch (e) {
    console.warn('[examSession] markStudentSubmitted failed:', e.message);
  }
}

/* ============================================================
   4) TEACHER — Actions
   ============================================================ */

export async function kickStudent({ sessionId, studentId, reason = '' }) {
  if (!sessionId || !studentId) return;
  try {
    await updateDoc(doc(db, SESSIONS, sessionId, 'students', studentId), {
      status: 'kicked',
      kickedAt: serverTimestamp(),
      kickedAtMs: Date.now(),
      kickReason: reason,
    });
  } catch (e) {
    console.warn('[examSession] kickStudent failed:', e.message);
  }
}

export async function warnStudent({ sessionId, studentId, message }) {
  if (!sessionId || !studentId || !message) return;
  try {
    const ref = doc(db, SESSIONS, sessionId, 'students', studentId);
    await updateDoc(ref, {
      warning: {
        message: String(message).slice(0, 200),
        at: Date.now(),
      },
    });
  } catch (e) {
    console.warn('[examSession] warnStudent failed:', e.message);
  }
}

/* ============================================================
   FIX #5: setStudentPaused — GV điều khiển tạm dừng thật sự
   ------------------------------------------------------------
   Trước đây GV gửi tin nhắn có chữ "TẠM DỪNG", HS listener dùng
   regex để nhận biết → dễ sai + HS tự bấm "Tôi đã hiểu" là tiếp
   tục được. Nay dùng field `paused: boolean` trên doc HS:
     • GV bật: setStudentPaused({ paused: true })
     • GV tắt: setStudentPaused({ paused: false })
   HS listener chỉ cần đọc `doc.paused`.
   ============================================================ */
export async function setStudentPaused({ sessionId, studentId, paused }) {
  if (!sessionId || !studentId) return;
  try {
    const ref = doc(db, SESSIONS, sessionId, 'students', studentId);
    await updateDoc(ref, {
      paused: !!paused,
      pausedAtMs: Date.now(),
      lastSeen: serverTimestamp(),
      lastSeenMs: Date.now(),
    });
  } catch (e) {
    console.warn('[examSession] setStudentPaused failed:', e.message);
  }
}

/* ============================================================
   5) TEACHER — Xem chi tiết
   ============================================================ */

export async function getStudentInSession(sessionId, studentId) {
  if (!sessionId || !studentId) return null;
  const snap = await getDoc(doc(db, SESSIONS, sessionId, 'students', studentId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function getSessionStudents(sessionId) {
  if (!sessionId) return [];
  const snap = await getDocs(collection(db, SESSIONS, sessionId, 'students'));
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  list.sort((a, b) => (a.joinedAtMs || 0) - (b.joinedAtMs || 0));
  return list;
}

/* ============================================================
   6) STUDENT — Lắng nghe
   ============================================================ */

export function listenMySessionDoc(sessionId, studentId, cb) {
  if (!sessionId || !studentId) return () => {};
  return onSnapshot(
    doc(db, SESSIONS, sessionId, 'students', studentId),
    (snap) => {
      if (!snap.exists()) return cb(null);
      cb({ id: snap.id, ...snap.data() });
    },
    (err) => console.warn('[examSession] listenMySessionDoc error:', err.message)
  );
}

/* ============================================================
   7) TIỆN ÍCH
   ============================================================ */

export function countOnline(students, now = Date.now()) {
  return students.filter((s) => isStudentOnline(s, now)).length;
}

export function countViolators(students) {
  return students.filter((s) =>
    (s.violations || []).some((v) => v.severity === 'hard')
  ).length;
}

export function latestViolation(student) {
  const list = student?.violations || [];
  if (!list.length) return null;
  return list[list.length - 1];
}

export function shortName(name) {
  if (!name) return '?';
  const parts = String(name).trim().split(/\s+/);
  return parts[parts.length - 1] || name;
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}