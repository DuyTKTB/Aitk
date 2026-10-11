/* ============================================================
   seededShuffle.js — Xáo thứ tự câu & đáp án RIÊNG cho từng học sinh
   ------------------------------------------------------------
   • Seed lưu trong attempt (attempt.seed) → tải lại trang vẫn ra đúng thứ tự cũ.
   • Chấm điểm luôn dùng chỉ số GỐC: ExamTaking hiển thị theo `view`,
     nhưng lưu đáp án bằng chỉ số gốc (origIndex / origOption).
   Cách dùng trong ExamTaking:
     const view = buildStudentView(exam.questions, attempt.seed);
     view.forEach(v => render(v.q, v.options))   // options = [{ text, orig }]
     chọn đáp án → answers[v.orig] = option.orig
   ============================================================ */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const hashSeed = (str) => {
  let h = 2166136261;
  for (let i = 0; i < String(str).length; i++) { h ^= String(str).charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
};

export const newSeed = () => (globalThis.crypto?.getRandomValues
  ? globalThis.crypto.getRandomValues(new Uint32Array(1))[0]
  : Math.floor(Math.random() * 2 ** 32));

function shuffled(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Câu có nhắc chữ cái ("cả A và B", "đáp án C") thì KHÔNG xáo đáp án — xáo sẽ làm sai nghĩa
const LETTER_REF = /(?:đáp án|phương án|mệnh đề|ý)\s*[A-E]\b|\bcả\s+[A-E]\b|\b[A-E]\s*(?:và|,|&)\s*[A-E]\b|tất cả|cả hai|không có đáp án/i;

export function buildStudentView(questions, seed, { shuffleQuestions = true, shuffleOptions = true } = {}) {
  const rng = mulberry32(seed);
  const order = shuffleQuestions ? shuffled(questions.map((_, i) => i), rng) : questions.map((_, i) => i);
  return order.map((orig) => {
    const q = questions[orig];
    const keep = !shuffleOptions || (q.options || []).some((o) => LETTER_REF.test(o)) || LETTER_REF.test(q.q || '');
    const idx = (q.options || []).map((_, i) => i);
    const optOrder = keep ? idx : shuffled(idx, rng);
    return { orig, q, options: optOrder.map((oi) => ({ text: q.options[oi], orig: oi })) };
  });
}
