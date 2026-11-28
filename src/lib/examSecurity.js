/* ============================================================
   examSecurity.js — Tách đáp án bí mật & chuẩn hóa chấm thi phía Server (Mức 2)
   ------------------------------------------------------------
   Dùng chung cho cả Client (tạo/sửa đề, giải nén cho giáo viên) và
   Serverless API (/api/submit-exam).
   Nguyên tắc Zero-Trust:
     • Document công khai `exams/{examId}` CHỈ chứa đề bài (đã tách sạch
       `correct`, `answer`, `accepted`, `explanation`, `statements[i].answer`).
     • Đáp án & lời giải nằm riêng trong `exams/{examId}/private/answerKey`
       (Firestore Rules chỉ cho giáo viên chủ đề / chủ lớp / Admin SDK đọc).
   ============================================================ */

import { qType } from './examScoring.js';

/**
 * Loại bỏ toàn bộ đáp án đúng và lời giải khỏi mảng câu hỏi trước khi lưu vào `exams/{examId}`.
 * Học sinh dù mở DevTools / Network cũng KHÔNG THỂ thấy đáp án.
 */
export function stripAnswerKeys(questions = []) {
  if (!Array.isArray(questions)) return [];
  return questions.map((q) => {
    if (!q || typeof q !== 'object') return q;
    const {
      correct: _c,
      answer: _a,
      accepted: _acc,
      explanation: _exp,
      explain: _expl,
      solution: _sol,
      work: _w,
      correctAnswer: _ca,
      ...rest
    } = q;

    const clean = { ...rest };
    if (Array.isArray(q.statements)) {
      clean.statements = q.statements.map((st) => {
        if (!st || typeof st !== 'object') return st;
        const { answer: _sa, correct: _sc, isCorrect: _sic, ...stRest } = st;
        return stRest;
      });
    }
    return clean;
  });
}

/**
 * Trích xuất khóa đáp án chuẩn để lưu riêng trong `exams/{examId}/private/answerKey`.
 */
export function extractAnswerKey(questions = []) {
  if (!Array.isArray(questions)) return [];
  return questions.map((q, index) => {
    const type = qType(q);
    const entry = {
      index,
      type,
      points: Number(q?.points) || 1,
    };

    if (type === 'true_false') {
      entry.statements = (q?.statements || []).map((st) => {
        if (typeof st?.answer === 'boolean') return st.answer;
        if (typeof st?.correct === 'boolean') return st.correct;
        return false;
      });
    } else if (type === 'short_answer' || type === 'essay') {
      entry.answer = q?.answer ?? '';
      if (type === 'short_answer' && Array.isArray(q?.accepted) && q.accepted.length > 0) {
        entry.accepted = q.accepted.filter((x) => x !== undefined && x !== null && x !== '');
      }
    } else {
      entry.correct = Number.isInteger(q?.correct) ? q.correct : -1;
    }

    if (q?.explanation) entry.explanation = q.explanation;
    if (q?.explain) entry.explain = q.explain;
    if (q?.solution) entry.solution = q.solution;
    if (q?.work) entry.work = q.work;
    return entry;
  });
}

/**
 * Gộp `private/answerKey` trở lại vào mảng câu hỏi (chỉ dùng phía Server chấm điểm
 * hoặc phía Giáo viên khi mở chỉnh sửa / nhân bản / chấm lại đề).
 */
export function mergeAnswerKeyIntoQuestions(questions = [], keyEntries = []) {
  if (!Array.isArray(questions)) return [];
  if (!Array.isArray(keyEntries) || keyEntries.length === 0) return questions;

  const byIdx = new Map();
  keyEntries.forEach((entry, i) => {
    if (!entry || typeof entry !== 'object') return;
    const idx = Number.isInteger(entry.index) ? entry.index : i;
    byIdx.set(idx, entry);
  });

  return questions.map((q, i) => {
    const k = byIdx.get(i);
    if (!k) return q;
    const merged = { ...q };
    const type = qType(q);

    if (type === 'true_false' && Array.isArray(q?.statements)) {
      const ansArr = Array.isArray(k.statements) ? k.statements : [];
      merged.statements = q.statements.map((st, sIdx) => ({
        ...(typeof st === 'object' && st !== null ? st : { text: String(st ?? '') }),
        answer: typeof ansArr[sIdx] === 'boolean' ? ansArr[sIdx] : Boolean(st?.answer),
      }));
    } else if (type === 'short_answer' || type === 'essay') {
      if (k.answer !== undefined) merged.answer = k.answer;
      if (type === 'short_answer' && Array.isArray(k.accepted)) merged.accepted = k.accepted;
    } else if (Number.isInteger(k.correct)) {
      merged.correct = k.correct;
    }

    if (k.explanation !== undefined) merged.explanation = k.explanation;
    if (k.explain !== undefined) merged.explain = k.explain;
    if (k.solution !== undefined) merged.solution = k.solution;
    if (k.work !== undefined) merged.work = k.work;
    if (Number.isFinite(Number(k.points)) && !merged.points) merged.points = Number(k.points);
    return merged;
  });
}

/**
 * Kiểm tra đề cũ (legacy) có còn chứa đáp án ngay trong `exams/{examId}.questions` hay không.
 */
export function hasEmbeddedAnswers(questions = []) {
  if (!Array.isArray(questions) || questions.length === 0) return false;
  return questions.some((q) => {
    if (!q || typeof q !== 'object') return false;
    const t = qType(q);
    if (t === 'true_false') {
      return Array.isArray(q.statements) && q.statements.some((s) => typeof s?.answer === 'boolean');
    }
    if (t === 'short_answer' || t === 'essay') {
      return (q.answer !== undefined && q.answer !== null && q.answer !== '')
        || (t === 'short_answer' && Array.isArray(q.accepted) && q.accepted.length > 0);
    }
    return Number.isInteger(q.correct) && q.correct >= 0;
  });
}

/**
 * Nếu giáo viên tắt `showAnswerAfter`, ẩn đáp án đúng khỏi payload trả về cho học sinh
 * (vẫn lưu đầy đủ `detail` trong Firestore để giáo viên xem thống kê).
 */
export function sanitizeDetailForStudent(detail = [], showAnswerAfter = true) {
  if (showAnswerAfter !== false) return detail;
  if (!Array.isArray(detail)) return [];
  return detail.map((d) => {
    if (!d || typeof d !== 'object') return d;
    const { correct: _c, explanation: _e, explain: _expl, work: _w, ...rest } = d;
    return rest;
  });
}
