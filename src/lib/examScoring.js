/* examScoring.js — chấm điểm 3 dạng câu chuẩn thi THPT 2025 (dùng chung cho lớp học & mô phỏng) */

/* Thang điểm Đúng/Sai: đúng 1/2/3/4 ý → 10% / 25% / 50% / 100% điểm của câu */
export const TF_LADDER = [0, 0.1, 0.25, 0.5, 1];

const toNum = (s) => {
  const t = String(s ?? '').replace(/\s/g, '').replace(/,/g, '.');
  if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(t)) return null;
  const v = parseFloat(t);
  return Number.isFinite(v) ? v : null;
};

export const qType = (q) => q?.type || 'single_choice';

/** Chấm 1 câu. Trả { earned, max, isCorrect, partial, picked, correct } */
export function scoreQuestion(q, ans) {
  const max = Number(q?.points) || 1;
  const type = qType(q);
  if (type === 'true_false') {
    const st = q.statements || [];
    /* Học sinh nộp dạng object {0:true,1:false,...} (Firestore không cho mảng lồng mảng) hoặc mảng */
    /* Đáp án có thể là mảng hoặc object {0:true,1:false}. Ý chưa làm → null (KHÔNG để undefined: Firestore từ chối) */
    const raw = Array.isArray(ans) ? ans : (ans && typeof ans === 'object' ? st.map((_, k) => ans[k]) : []);
    const arr = st.map((_, k) => (typeof raw[k] === 'boolean' ? raw[k] : null));
    const right = st.filter((s, k) => arr[k] !== null && arr[k] === s.answer).length;
    const ratio = st.length === 4 ? TF_LADDER[right] : st.length ? right / st.length : 0;
    return { earned: Math.round(max * ratio * 1000) / 1000, max, isCorrect: right === st.length && st.length > 0, partial: right > 0 && right < st.length, picked: arr, correct: st.map((s) => (typeof s.answer === 'boolean' ? s.answer : null)), right };
  }
  if (type === 'short_answer') {
    ans = typeof ans === 'string' ? ans : ''; // -1 (chưa làm) không được coi là đáp án
    const user = toNum(ans);
    const str = String(ans ?? '').replace(/\s/g, '').replace(/\./g, ',').toLowerCase();
    const list = [...(q.accepted || []), q.answer].filter((x) => x !== undefined && x !== null && x !== '');
    const ok = list.some((a) => {
      if (String(a).replace(/\s/g, '').replace(/\./g, ',').toLowerCase() === str && str !== '') return true;
      const an = toNum(a);
      return user !== null && an !== null && Math.abs(an - user) <= 1e-9;
    });
    return { earned: ok ? max : 0, max, isCorrect: ok, partial: false, picked: ans ?? '', correct: q.answer ?? (q.accepted || [])[0] ?? '' };
  }
  const picked = typeof ans === 'number' ? ans : -1;
  const ok = picked === q.correct;
  return { earned: ok ? max : 0, max, isCorrect: ok, partial: false, picked, correct: Number.isInteger(q.correct) ? q.correct : -1 };
}

/** Chấm cả bài. Giữ định dạng detail cũ ({index,picked,correct,isCorrect}) để tương thích. */
export function scoreExam(questions = [], answers = {}) {
  let correctCount = 0;
  let score = 0;
  const detail = questions.map((q, i) => {
    const r = scoreQuestion(q, answers[i]);
    if (r.isCorrect) correctCount += 1;
    score += r.earned;
    return { index: i, type: qType(q), picked: r.picked, correct: r.correct, isCorrect: r.isCorrect, earned: r.earned, partial: r.partial };
  });
  return { detail, correctCount, score: Math.round(score * 100) / 100 };
}

/** Câu này đã được học sinh trả lời chưa? (dùng cho lưới câu, đếm tiến độ, xác nhận nộp bài) */
export function isAnswered(q, v) {
  const t = qType(q);
  if (t === 'true_false') {
    if (!v || typeof v !== 'object') return false;
    return [0, 1, 2, 3].some((k) => typeof v[k] === 'boolean');
  }
  if (t === 'short_answer') return typeof v === 'string' && v.trim() !== '';
  return typeof v === 'number' && v >= 0;
}

export const countAnswered = (questions = [], answers = {}) =>
  questions.reduce((n, q, i) => n + (isAnswered(q, answers[i]) ? 1 : 0), 0);

/** Chuẩn hoá đáp án trước khi gửi lên server */
export function packAnswers(questions = [], answers = {}) {
  return questions.map((q, i) => {
    const v = answers[i];
    const t = qType(q);
    if (t === 'true_false') {
      const o = {};
      if (v && typeof v === 'object') [0, 1, 2, 3].forEach((k) => { if (typeof v[k] === 'boolean') o[k] = v[k]; });
      return o;
    }
    if (t === 'short_answer') return typeof v === 'string' ? v.trim() : '';
    return typeof v === 'number' ? v : -1;
  });
}