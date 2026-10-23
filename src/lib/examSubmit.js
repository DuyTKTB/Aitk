/* examSubmit.js — tiện ích cho submitExam trong classroom.js
   Đặt tại: src/lib/examSubmit.js
   Lỗi "Function setDoc() called with invalid data. Unsupported field value: undefined" xảy ra vì
   câu Đúng/Sai & Trả lời ngắn không có q.correct → detail[i].correct = undefined → Firestore từ chối.
   Cách dùng trong submitExam:
       import { buildSubmission, stripUndefined } from './examSubmit.js';
       const { score, correctCount, detail } = buildSubmission(exam.questions, answers);
       await setDoc(ref, stripUndefined({ ...payload, score, correctCount, detail }));
   -------------------------------------------------------------------------- */
import { scoreExam } from './examScoring.js';

/** Xoá đệ quy mọi giá trị undefined (và biến NaN/Infinity thành null) để Firestore chấp nhận */
export function stripUndefined(v) {
  if (v === undefined) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (Array.isArray(v)) return v.map((x) => stripUndefined(x));
  if (v && typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype) {
    const o = {};
    for (const [k, val] of Object.entries(v)) if (val !== undefined) o[k] = stripUndefined(val);
    return o;
  }
  return v;
}

/** Chấm cả bài đủ 3 dạng, trả detail đã sạch undefined */
export function buildSubmission(questions = [], answers = []) {
  const arr = Array.isArray(answers) ? answers : questions.map((_, i) => answers?.[i]);
  const r = scoreExam(questions, arr);
  return { ...r, detail: stripUndefined(r.detail) };
}