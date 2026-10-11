/* ============================================================
   Cloud Functions (v2) — chuyển phần NHẠY CẢM ra khỏi trình duyệt
   ------------------------------------------------------------
   1. aiProxy        : giữ khóa Gemini trên server + quota theo từng user,
                       tách lỗi 429 của nhà cung cấp khỏi hết lượt của user.
   2. submitExam     : chấm điểm trên server từ doc đáp án CHỈ giáo viên đọc được
                       (examAnswers/{examId}); học sinh không tự ghi điểm được.
   3. saveExamAnswers: giáo viên lưu đáp án đúng (tách khỏi doc đề).
   4. setAdminClaim  : cấp quyền admin bằng custom claim (nguồn duy nhất).
   Triển khai:
     cd functions && npm i
     firebase functions:secrets:set GEMINI_API_KEY
     firebase deploy --only functions
   ============================================================ */
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret, defineString } from 'firebase-functions/params';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';

initializeApp();
const db = getFirestore();

const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');
const GEMINI_MODELS = defineString('GEMINI_MODELS', { default: 'gemini-3.8-flash,gemini-3.7-flash' });
const BOOTSTRAP_ADMIN_UID = defineString('BOOTSTRAP_ADMIN_UID', { default: '' });

const need = (cond, code, msg) => { if (!cond) throw new HttpsError(code, msg); };
const requireAuth = (req) => { need(req.auth?.uid, 'unauthenticated', 'Cần đăng nhập.'); return req.auth.uid; };
const dayKey = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10); // theo giờ VN

/* ------------------------------------------------------------
   1) aiProxy
   ------------------------------------------------------------ */
const TIER_QUOTA = { free: 18, vip: 500 }; // lượt/ngày; chỉnh theo gói của bạn

export const aiProxy = onCall(
  { secrets: [GEMINI_API_KEY], timeoutSeconds: 120, memory: '512MiB', cors: true },
  async (req) => {
    const uid = requireAuth(req);
    const { system = '', parts = [], temperature = 0.7, kind = 'chat' } = req.data || {};
    need(Array.isArray(parts) && parts.length > 0, 'invalid-argument', 'Thiếu nội dung.');
    need(JSON.stringify(parts).length < 8_000_000, 'invalid-argument', 'Nội dung quá lớn.');

    // --- quota theo từng user (transaction → không vượt khi gọi song song)
    const userSnap = await db.doc(`users/${uid}`).get();
    const tier = String(userSnap.data()?.tier || 'free').toLowerCase();
    const limit = TIER_QUOTA[tier] ?? TIER_QUOTA.free;
    const usageRef = db.doc(`aiUsage/${uid}_${dayKey()}`);
    await db.runTransaction(async (tx) => {
      const cur = (await tx.get(usageRef)).data()?.count || 0;
      if (cur >= limit) throw new HttpsError('resource-exhausted', 'USER_QUOTA');
      tx.set(usageRef, { uid, count: cur + 1, kind, day: dayKey(), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    });

    // --- gọi Gemini (khóa chỉ nằm trên server, đi qua header — không nằm trong URL)
    const models = GEMINI_MODELS.value().split(',').map((s) => s.trim()).filter(Boolean);
    let lastStatus = 0;
    for (const model of models) {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY.value() },
        body: JSON.stringify({
          systemInstruction: system ? { parts: [{ text: system }] } : undefined,
          contents: [{ role: 'user', parts }],
          generationConfig: { temperature: Math.min(2, Math.max(0, Number(temperature) || 0.7)) },
        }),
      });
      lastStatus = res.status;
      if (res.ok) {
        const j = await res.json();
        const text = (j.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('');
        return { text, model };
      }
      if (res.status === 404 || res.status === 429 || res.status >= 500) continue; // thử model kế
      break;
    }
    // hoàn lại lượt vì lỗi không do user
    await usageRef.set({ count: FieldValue.increment(-1) }, { merge: true });
    if (lastStatus === 429) throw new HttpsError('unavailable', 'PROVIDER_RATE_LIMIT');
    throw new HttpsError('internal', `AI lỗi (${lastStatus || 'mạng'})`);
  }
);

/* ------------------------------------------------------------
   3) saveExamAnswers — giáo viên lưu đáp án (doc riêng, chỉ GV đọc được)
   ------------------------------------------------------------ */
export const saveExamAnswers = onCall({ cors: true }, async (req) => {
  const uid = requireAuth(req);
  const { examId, answers } = req.data || {};
  need(examId && Array.isArray(answers), 'invalid-argument', 'Thiếu dữ liệu.');
  const exam = (await db.doc(`exams/${examId}`).get()).data();
  need(exam, 'not-found', 'Đề không tồn tại.');
  need(exam.teacherId === uid || req.auth.token.admin === true, 'permission-denied', 'Không phải đề của bạn.');
  await db.doc(`examAnswers/${examId}`).set({
    teacherId: exam.teacherId,
    answers: answers.map((a) => ({ correct: Number(a.correct), points: Number(a.points) > 0 ? Number(a.points) : 1, explain: String(a.explain || '') })),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return { ok: true };
});

/* ------------------------------------------------------------
   2) submitExam — chấm trên server
   ------------------------------------------------------------ */
export const submitExam = onCall({ cors: true }, async (req) => {
  const uid = requireAuth(req);
  const { examId, answers = {}, timeSpent = 0, attemptMeta = {} } = req.data || {};
  need(examId, 'invalid-argument', 'Thiếu mã đề.');

  const examSnap = await db.doc(`exams/${examId}`).get();
  const exam = examSnap.data();
  need(exam && exam.active !== false, 'not-found', 'Đề không tồn tại hoặc đã đóng.');

  // phải là thành viên lớp
  const cls = (await db.doc(`classes/${exam.classId}`).get()).data();
  need(cls?.memberIds?.includes(uid), 'permission-denied', 'Bạn không thuộc lớp này.');

  const now = Date.now();
  if (exam.opensAt && now < new Date(exam.opensAt).getTime()) throw new HttpsError('failed-precondition', 'Đề chưa mở.');
  if (exam.closesAt && now > new Date(exam.closesAt).getTime() + (Number(exam.duration) || 0) * 60000) {
    throw new HttpsError('failed-precondition', 'Đề đã đóng.');
  }

  const key = (await db.doc(`examAnswers/${examId}`).get()).data();
  need(key?.answers?.length, 'failed-precondition', 'Đề chưa có đáp án (giáo viên cần lưu đáp án).');

  const attemptRef = db.doc(`exams/${examId}/attempts/${examId}_${uid}`);
  const attempt = (await attemptRef.get()).data();
  const subId = `${examId}_${uid}_${attempt?.startedAt || 'x'}`;
  const subRef = db.doc(`submissions/${subId}`);

  return db.runTransaction(async (tx) => {
    const existing = await tx.get(subRef);
    if (existing.exists) { // nộp trùng → trả kết quả cũ, không ghi thêm
      const e = existing.data();
      return { ok: true, id: subId, alreadySubmitted: true, score: e.score, correct: e.correctCount, total: e.totalQuestions, totalPoints: e.totalPoints, detail: e.detail };
    }

    // đã có bài trước đó mà đề không cho làm lại → cần permit hợp lệ
    const prior = await tx.get(db.collection('submissions').where('examId', '==', examId).where('studentId', '==', uid).limit(1));
    let permitRef = null;
    if (!prior.empty && !exam.allowRetry) {
      const p = await tx.get(db.collection('examRetryPermits')
        .where('examId', '==', examId).where('studentId', '==', uid).where('status', '==', 'approved').limit(1));
      need(!p.empty, 'permission-denied', 'Bạn đã nộp bài này rồi.');
      permitRef = p.docs[0].ref;
    }

    let correctCount = 0; let score = 0; let totalPoints = 0;
    const detail = exam.questions.map((_, i) => {
      const k = key.answers[i] || { correct: -1, points: 1 };
      const picked = Number.isInteger(answers[i]) ? answers[i] : -1;
      const isCorrect = picked === k.correct;
      totalPoints += k.points;
      if (isCorrect) { correctCount += 1; score += k.points; }
      return { index: i, picked, correct: k.correct, isCorrect };
    });

    tx.set(subRef, {
      examId, studentId: uid, studentName: req.auth.token.name || cls.members?.find((m) => m.id === uid)?.name || 'Học sinh',
      answers, detail, score, totalPoints, correctCount, totalQuestions: exam.questions.length,
      timeSpent: Number(timeSpent) || 0, submittedAt: FieldValue.serverTimestamp(), graded: true,
      autoSubmitted: !!attemptMeta.autoSubmitted, violationCount: Number(attemptMeta.violationCount) || 0,
      cameraStatus: String(attemptMeta.cameraStatus || 'off'), isRetry: !!permitRef,
    });
    if (permitRef) tx.update(permitRef, { status: 'used', usedAtMs: now, usedAt: FieldValue.serverTimestamp() });
    if (attempt) tx.update(attemptRef, { submittedAt: now, submissionId: subId });

    // chỉ trả đáp án đúng nếu đề cho xem
    const safeDetail = exam.showAnswerAfter ? detail : detail.map(({ correct, ...d }) => d); // eslint-disable-line no-unused-vars
    return { ok: true, id: subId, score, correct: correctCount, total: exam.questions.length, totalPoints, detail: safeDetail };
  });
});

/* ------------------------------------------------------------
   4) setAdminClaim — nguồn quyền admin duy nhất
   ------------------------------------------------------------ */
export const setAdminClaim = onCall({ cors: true }, async (req) => {
  const uid = requireAuth(req);
  const { targetUid, admin = true } = req.data || {};
  need(targetUid, 'invalid-argument', 'Thiếu targetUid.');
  const isBootstrap = BOOTSTRAP_ADMIN_UID.value() && uid === BOOTSTRAP_ADMIN_UID.value();
  need(req.auth.token.admin === true || isBootstrap, 'permission-denied', 'Chỉ admin mới cấp được.');
  await getAuth().setCustomUserClaims(targetUid, { admin: !!admin });
  return { ok: true }; // người được cấp cần đăng nhập lại / getIdToken(true) để nhận claim
});
