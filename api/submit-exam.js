/* ============================================================
   /api/submit-exam.js — Vercel Serverless Function (Chấm thi & Chống gian lận Mức 2)
   ------------------------------------------------------------
   Xác thực Firebase ID Token ở Server → Đọc đáp án bí mật trong
   `exams/{examId}/private/answerKey` bằng Admin SDK → Kiểm tra quyền lớp,
   đồng hồ máy chủ, lượt thi/permit → Chấm điểm 3 dạng câu THPT 2025/2026
   → Ghi bài nộp chính thức vào `submissions/{subId}` (không tin client!).
   ============================================================ */

import fs from 'node:fs';
import path from 'node:path';
import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { scoreExam } from '../src/lib/examScoring.js';
import { stripUndefined } from '../src/lib/examSubmit.js';
import {
  mergeAnswerKeyIntoQuestions,
  sanitizeDetailForStudent,
} from '../src/lib/examSecurity.js';

function getServiceAccountFromEnv() {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (rawJson) {
    try {
      const decoded = rawJson.trim().startsWith('{')
        ? rawJson
        : Buffer.from(rawJson, 'base64').toString('utf8');
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    return { projectId, clientEmail, privateKey };
  }

  if (!process.env.VERCEL) {
    const localKeyPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
    if (fs.existsSync(localKeyPath)) {
      try {
        return JSON.parse(fs.readFileSync(localKeyPath, 'utf8'));
      } catch {
        return null;
      }
    }
  }
  return null;
}

function ensureAdmin() {
  if (getApps().length > 0) return getApp();
  const sa = getServiceAccountFromEnv();
  if (!sa) return null;
  return initializeApp({ credential: cert(sa) });
}

export function parseTimestampMs(v) {
  if (!v) return 0;
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v?.toMillis === 'function') return v.toMillis();
  if (typeof v?.seconds === 'number') return v.seconds * 1000;
  const t = new Date(v).getTime();
  return Number.isNaN(t) ? 0 : t;
}

/**
 * Kiểm tra cửa sổ thời gian hợp lệ trên đồng hồ Server thật.
 * Ngăn học sinh chỉnh giờ máy để nộp bài sớm/muộn hoặc kéo dài thời gian vô hạn.
 */
export function validateExamWindow({
  exam,
  attempt,
  nowMs = Date.now(),
  autoSubmitted = false,
  isRetry = false,
}) {
  if (!exam) return { ok: false, status: 404, error: 'Đề thi không tồn tại.' };
  if (exam.active === false) return { ok: false, status: 403, error: 'Đề thi đã bị đóng bởi giáo viên.' };

  const opensMs = parseTimestampMs(exam.opensAt);
  const closesMs = parseTimestampMs(exam.closesAt);
  if (opensMs && nowMs < opensMs - 30000) {
    return { ok: false, status: 403, error: 'Đề thi chưa tới giờ mở.' };
  }

  const durationMs = Math.max(0, Number(exam.duration) || 0) * 60000;
  const lateGraceMs = Math.max(durationMs, 15 * 60000);
  if (!autoSubmitted && !isRetry && closesMs && nowMs > closesMs + lateGraceMs) {
    return { ok: false, status: 403, error: 'Đề thi đã quá hạn đóng.' };
  }

  // Nếu có mốc startedAt của attempt và đề có thời lượng: cho phép trễ tối đa 3 phút (mạng/nộp tự động)
  const startedMs = parseTimestampMs(attempt?.startedAt);
  if (startedMs > 0 && durationMs > 0 && !autoSubmitted && !isRetry) {
    const maxAllowedMs = startedMs + durationMs + 3 * 60000;
    if (nowMs > maxAllowedMs) {
      return {
        ok: true,
        overdue: true,
        overdueSeconds: Math.round((nowMs - (startedMs + durationMs)) / 1000),
      };
    }
  }

  return { ok: true, overdue: false, overdueSeconds: 0 };
}

/**
 * Tổng hợp số lần vi phạm chuẩn phía Server (không bao giờ nhỏ hơn nhật ký đã lưu).
 */
export function computeAuthoritativeViolations({
  clientViolationCount = 0,
  attemptViolationCount = 0,
  attemptEvents = [],
  sessionViolations = [],
}) {
  const hardAttemptEvents = Array.isArray(attemptEvents)
    ? attemptEvents.filter((e) => e && e.severity === 'hard').length
    : 0;
  const hardSessionEvents = Array.isArray(sessionViolations)
    ? sessionViolations.filter((e) => e && e.severity === 'hard').length
    : 0;

  return Math.max(
    0,
    Number(clientViolationCount) || 0,
    Number(attemptViolationCount) || 0,
    hardAttemptEvents,
    hardSessionEvents,
  );
}

/**
 * Tính thời gian làm bài thực tế từ mốc `startedAt` trên server (tránh client gửi 0s hoặc số âm).
 */
export function computeAuthoritativeTimeSpent({
  clientTimeSpent = 0,
  attemptStartedAt = 0,
  durationMinutes = 0,
  nowMs = Date.now(),
}) {
  const startedMs = parseTimestampMs(attemptStartedAt);
  const maxSec = durationMinutes > 0 ? Math.round(durationMinutes * 60 + 900) : 24 * 3600;
  if (startedMs > 0 && nowMs >= startedMs) {
    const serverElapsed = Math.round((nowMs - startedMs) / 1000);
    return Math.max(0, Math.min(serverElapsed, maxSec));
  }
  const safeClient = Math.round(Number(clientTimeSpent) || 0);
  return Math.max(0, Math.min(safeClient, maxSec));
}

function readJsonBody(req) {
  if (!req?.body) return {};
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return typeof req.body === 'object' ? req.body : {};
}

export default async function handler(req, res) {
  res.setHeader?.('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') {
    return res.status(204).json({ ok: true });
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  const app = ensureAdmin();
  if (!app) {
    return res.status(503).json({
      ok: false,
      code: 'admin_not_configured',
      error: 'Máy chủ chấm thi chưa cấu hình Firebase Admin SDK.',
    });
  }

  const authHeader = String(req.headers?.authorization || '');
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) {
    return res.status(401).json({ ok: false, error: 'Thiếu mã xác thực đăng nhập.' });
  }

  let decoded;
  try {
    decoded = await getAuth(app).verifyIdToken(idToken);
  } catch {
    return res.status(401).json({ ok: false, error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
  }

  const uid = decoded.uid;
  const body = readJsonBody(req);
  const examId = String(body.examId || '').trim();
  const mode = body.mode === 'practice' ? 'practice' : 'submit';
  const answers = body.answers;
  const attemptMeta = body.attemptMeta && typeof body.attemptMeta === 'object' ? body.attemptMeta : {};
  const studentName = String(
    body.student?.name || decoded.name || decoded.email || 'Học sinh'
  ).slice(0, 120);

  if (!examId) {
    return res.status(400).json({ ok: false, error: 'Thiếu mã đề thi (examId).' });
  }

  const db = getFirestore(app);
  const nowMs = Date.now();

  try {
    const examRef = db.collection('exams').doc(examId);
    const [examSnap, keySnap, userSnap] = await Promise.all([
      examRef.get(),
      examRef.collection('private').doc('answerKey').get(),
      db.collection('users').doc(uid).get().catch(() => null),
    ]);

    if (!examSnap.exists) {
      return res.status(404).json({ ok: false, error: 'Đề thi không tồn tại.' });
    }

    const exam = { id: examSnap.id, ...examSnap.data() };
    const isAdminUser = decoded.admin === true || userSnap?.data()?.role === 'admin';
    const isTeacherOfExam = exam.teacherId === uid;

    // 1. Kiểm tra quyền truy cập đề riêng tư của lớp (chống người ngoài nộp bài / dò đáp án)
    if (exam.visibility !== 'public' && exam.classId && !isTeacherOfExam && !isAdminUser) {
      const [clsSnap, linkSnap] = await Promise.all([
        db.collection('classes').doc(exam.classId).get(),
        db.collection('class_teachers').doc(`${exam.classId}_${uid}`).get(),
      ]);
      const cls = clsSnap.exists ? clsSnap.data() : null;
      const memberIds = Array.isArray(cls?.memberIds) ? cls.memberIds : [];
      const members = Array.isArray(cls?.members) ? cls.members : [];
      const inClass = cls?.teacherId === uid
        || linkSnap.exists
        || memberIds.includes(uid)
        || members.some((m) => (m?.id || m?.uid) === uid);

      if (!inClass) {
        return res.status(403).json({
          ok: false,
          error: 'Bạn không thuộc lớp được giao đề thi này.',
        });
      }
    }

    // Gộp đáp án bí mật từ `exams/{examId}/private/answerKey` (chỉ nằm trong RAM server!)
    const keyData = keySnap.exists ? keySnap.data() : null;
    const keyEntries = Array.isArray(keyData?.questionsKey) ? keyData.questionsKey : [];
    const gradedQuestions = mergeAnswerKeyIntoQuestions(exam.questions || [], keyEntries);
    const totalPoints = Number(exam.totalPoints)
      || Math.round(gradedQuestions.reduce((s, q) => s + (Number(q?.points) || 1), 0) * 100) / 100;

    // 2. Chế độ Luyện tập trước khi GV mở phòng (chỉ chấm trả kết quả, KHÔNG ghi submission)
    if (mode === 'practice') {
      const canPractice = Boolean(exam.lockUntilStart || isTeacherOfExam || isAdminUser);
      if (!canPractice) {
        return res.status(403).json({ ok: false, error: 'Đề thi này không mở chế độ luyện tập tự do.' });
      }
      const { detail, correctCount, score } = scoreExam(gradedQuestions, answers || []);
      return res.status(200).json({
        ok: true,
        practice: true,
        score,
        correct: correctCount,
        total: gradedQuestions.length,
        totalPoints,
        detail: sanitizeDetailForStudent(detail, exam.showAnswerAfter !== false),
        gradedByServer: true,
      });
    }

    // 3. Tải attempt hiện tại & kiểm tra phòng thi trực tiếp (nếu có)
    const attemptId = `${examId}_${uid}`;
    const attemptRef = examRef.collection('attempts').doc(attemptId);
    const attemptSnap = await attemptRef.get();
    const attemptData = attemptSnap.exists ? attemptSnap.data() : null;

    let sessionStudentData = null;
    const sessionId = typeof attemptMeta.sessionId === 'string' ? attemptMeta.sessionId.trim() : '';
    if (sessionId) {
      const stSnap = await db.collection('examSessions').doc(sessionId).collection('students').doc(uid).get().catch(() => null);
      if (stSnap?.exists) sessionStudentData = stSnap.data();
    }

    // 4. Kiểm tra cửa sổ thời gian bằng đồng hồ Server
    const windowCheck = validateExamWindow({
      exam,
      attempt: attemptData,
      nowMs,
      autoSubmitted: !!attemptMeta.autoSubmitted,
      isRetry: !!attemptMeta.isRetry,
    });
    if (!windowCheck.ok) {
      return res.status(windowCheck.status || 403).json({ ok: false, error: windowCheck.error });
    }

    // 5. Kiểm tra số lượt làm bài & giấy phép thi lại trên Server
    const oldSubsSnap = await db.collection('submissions')
      .where('examId', '==', examId)
      .where('studentId', '==', uid)
      .get();

    const hasPrevSub = !oldSubsSnap.empty;
    let approvedPermitDoc = null;
    let retryAllowedByServer = Boolean(exam.allowRetry);

    if (hasPrevSub && !retryAllowedByServer) {
      const permitSnap = await db.collection('examRetryPermits')
        .where('examId', '==', examId)
        .where('studentId', '==', uid)
        .get();
      approvedPermitDoc = permitSnap.docs.find((d) => d.data()?.status === 'approved') || null;
      if (approvedPermitDoc) {
        retryAllowedByServer = true;
      } else if (exam.classId) {
        const allowSnap = await db.collection('studentRetryAllowance').doc(`${exam.classId}_${uid}`).get();
        if (allowSnap.exists && allowSnap.data()?.allowed === true) {
          retryAllowedByServer = true;
        }
      }
    }

    if (hasPrevSub && !retryAllowedByServer) {
      const prevDoc = oldSubsSnap.docs[0];
      const prev = prevDoc.data();
      return res.status(200).json({
        ok: true,
        id: prevDoc.id,
        score: prev.score,
        correct: prev.correctCount,
        total: prev.totalQuestions || gradedQuestions.length,
        totalPoints: prev.totalPoints || totalPoints,
        detail: sanitizeDetailForStudent(prev.detail || [], exam.showAnswerAfter !== false),
        alreadySubmitted: true,
        gradedByServer: true,
      });
    }

    // 6. Chấm điểm chính thức 100% trên Server
    const normalizedAnswers = Array.isArray(answers)
      ? answers
      : gradedQuestions.map((_, i) => answers?.[i]);
    const { detail, correctCount, score } = scoreExam(gradedQuestions, normalizedAnswers);

    const violationCount = computeAuthoritativeViolations({
      clientViolationCount: attemptMeta.violationCount,
      attemptViolationCount: attemptData?.violationCount,
      attemptEvents: attemptData?.events,
      sessionViolations: sessionStudentData?.violations,
    });

    const timeSpent = computeAuthoritativeTimeSpent({
      clientTimeSpent: body.timeSpent,
      attemptStartedAt: attemptData?.startedAt,
      durationMinutes: Number(exam.duration) || 0,
      nowMs,
    });

    const subId = `${examId}_${uid}_${attemptData?.startedAt || nowMs}`;
    const submissionDoc = stripUndefined({
      examId,
      classId: exam.classId || '',
      studentId: uid,
      studentName,
      answers: normalizedAnswers,
      detail,
      score,
      totalPoints,
      correctCount,
      totalQuestions: gradedQuestions.length,
      timeSpent,
      submittedAt: FieldValue.serverTimestamp(),
      serverGradedAtMs: nowMs,
      graded: true,
      gradedByServer: true,
      autoSubmitted: !!attemptMeta.autoSubmitted || !!windowCheck.overdue,
      overdueSeconds: windowCheck.overdueSeconds || 0,
      violationCount,
      cameraStatus: String(attemptMeta.cameraStatus || 'off').slice(0, 32),
      isRetry: hasPrevSub,
    });

    const batch = db.batch();
    batch.set(db.collection('submissions').doc(subId), submissionDoc);

    if (approvedPermitDoc) {
      batch.update(approvedPermitDoc.ref, {
        status: 'used',
        usedAt: FieldValue.serverTimestamp(),
        usedAtMs: nowMs,
        usedSubmissionId: subId,
      });
    }

    batch.set(
      attemptRef,
      stripUndefined({
        examId,
        studentId: uid,
        studentName,
        submittedAt: nowMs,
        timeSpent,
        autoSubmitted: !!attemptMeta.autoSubmitted || !!windowCheck.overdue,
        violationCount,
        cameraStatus: String(attemptMeta.cameraStatus || 'off').slice(0, 32),
        submissionId: subId,
      }),
      { merge: true },
    );

    await batch.commit();

    return res.status(200).json({
      ok: true,
      id: subId,
      score,
      correct: correctCount,
      total: gradedQuestions.length,
      totalPoints,
      timeSpent,
      violationCount,
      detail: sanitizeDetailForStudent(detail, exam.showAnswerAfter !== false),
      gradedByServer: true,
    });
  } catch (err) {
    console.error('[/api/submit-exam] Lỗi:', err?.message || err);
    return res.status(500).json({
      ok: false,
      error: 'Lỗi máy chủ khi chấm bài. Vui lòng thử nộp lại.',
    });
  }
}
