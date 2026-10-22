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
    const arr = Array.isArray(ans) ? ans : [];
    const right = st.filter((s, k) => arr[k] === s.answer).length;
    const ratio = st.length === 4 ? TF_LADDER[right] : st.length ? right / st.length : 0;
    return { earned: Math.round(max * ratio * 1000) / 1000, max, isCorrect: right === st.length && st.length > 0, partial: right > 0 && right < st.length, picked: arr, correct: st.map((s) => s.answer), right };
  }
  if (type === 'short_answer') {
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
  return { earned: ok ? max : 0, max, isCorrect: ok, partial: false, picked, correct: q.correct };
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
