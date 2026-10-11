/* ============================================================
   functionsClient.js — Gọi Cloud Functions + cắm proxy AI
   ------------------------------------------------------------
   Dùng trong main.jsx (một lần):
     import { installAiProxy } from './lib/functionsClient.js';
     installAiProxy();           // examAiUtils.setModelCaller → qua Cloud Function
   Sau đó XÓA VITE_GEMINI_KEY / VITE_GROQ_API_KEY / VITE_AGNES_API_KEY khỏi .env
   và XOÁ (thu hồi) các khóa cũ trên Google AI Studio / Groq — chúng đã nằm trong bundle cũ.
   ============================================================ */
import { getApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { setModelCaller } from './examAiUtils.js';
import { MSG_OUT_OF_QUOTA, MSG_RATE_LIMIT } from './ai.js';

let fns;
const call = (name) => {
  fns = fns || getFunctions(getApp(), import.meta.env.VITE_FUNCTIONS_REGION || 'us-central1');
  return httpsCallable(fns, name, { timeout: 120000 });
};

export async function callAiProxy({ system, parts, temperature, kind }) {
  try {
    const { data } = await call('aiProxy')({ system, parts, temperature, kind });
    return data.text;
  } catch (e) {
    const msg = String(e?.message || '');
    if (e?.code === 'functions/resource-exhausted' || msg.includes('USER_QUOTA')) {
      const err = new Error(MSG_OUT_OF_QUOTA); err.isUserQuota = true; throw err;     // hết lượt CỦA BẠN
    }
    if (msg.includes('PROVIDER_RATE_LIMIT') || e?.code === 'functions/unavailable') {
      const err = new Error(MSG_RATE_LIMIT); err.isRateLimit = true; throw err;        // hệ thống quá tải
    }
    throw e;
  }
}

export function installAiProxy() {
  setModelCaller(({ system, parts, temperature }) =>
    callAiProxy({ system, parts, temperature, kind: 'exam' }));
}

/* Chấm bài trên server (thay cho submitExam chấm ở client) */
export async function submitExamOnServer(payload) {
  const { data } = await call('submitExam')({
    examId: payload.examId, answers: payload.answers, timeSpent: payload.timeSpent, attemptMeta: payload.attemptMeta,
  });
  return data;
}

/* Giáo viên lưu đáp án đúng vào doc riêng */
export const saveExamAnswersOnServer = (examId, questions) =>
  call('saveExamAnswers')({ examId, answers: questions.map((q) => ({ correct: q.correct, points: q.points || 1, explain: q.explain || '' })) });
