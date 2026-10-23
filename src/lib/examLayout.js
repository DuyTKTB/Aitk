/* examLayout.js — chia đề thành "khối" (bài đọc + các câu con) và đảo câu KHÔNG phá bài đọc
   Đặt tại: src/lib/examLayout.js
   --------------------------------------------------------------------------
   Quy ước dữ liệu câu hỏi (đã có sẵn từ ExamImporter):
     q.passage      bài đọc / đoạn văn dùng chung (xuống dòng bằng \n)
     q.instruction  dòng hướng dẫn: "Read the following passage and mark..."
     q.passageId    (tuỳ chọn) id nhóm; nếu không có thì gom theo nội dung passage
   exam.displayMode: 'auto' | 'single' | 'paper'   (giáo viên chọn trong ExamEditModal)
   -------------------------------------------------------------------------- */

export const hasPassages = (qs = []) => qs.some((q) => q && (q.passage || q.instruction));

/** Chế độ hiển thị thực tế: giáo viên chọn > tự nhận diện (có bài đọc → paper) */
export function resolveMode(exam) {
  const m = exam?.displayMode;
  if (m === 'single' || m === 'paper') return m;
  return hasPassages(exam?.questions) ? 'paper' : 'single';
}

/** Gom các câu LIỀN NHAU cùng bài đọc / cùng hướng dẫn thành 1 khối */
export function buildBlocks(questions = []) {
  const blocks = [];
  let cur = null;
  questions.forEach((q, i) => {
    const key = q?.passage
      ? (q.passageId != null ? `g:${q.passageId}` : `p:${q.passage}`)
      : q?.instruction ? `i:${q.instruction}` : null;
    if (key !== null && cur && cur.key === key) {
      cur.idx.push(i);
    } else {
      cur = { key, passage: q?.passage || '', instruction: q?.instruction || '', idx: [i] };
      blocks.push(cur);
    }
  });
  return blocks;
}

/* PRNG có seed: cùng đề + cùng học sinh → luôn cùng thứ tự (F5 không bị đổi) */
function seeded(str) {
  let h = 2166136261;
  for (const ch of str) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  let s = h >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Trả { blocks, order }
 *  - blocks: [{ key, passage, instruction, items:[{ qi, pos }] }] theo thứ tự HIỂN THỊ
 *  - order : mảng chỉ số gốc theo thứ tự hiển thị (dùng cho lưới câu hỏi, chế độ từng câu)
 *
 * Quy tắc đảo (khi exam.shuffle = true):
 *  - Khối có bài đọc / hướng dẫn: GIỮ NGUYÊN vị trí và thứ tự câu bên trong.
 *  - Chỉ đảo các câu lẻ nằm liền nhau (không bài đọc) với nhau.
 *  → Đề tiếng Anh: Phần điền từ, đọc hiểu giữ nguyên; phần ngữ pháp/từ vựng được đảo.
 *  → Đề không có bài đọc: đảo toàn bộ như cũ (kết quả giống code cũ).
 */
export function buildLayout(exam, uid) {
  const qs = exam?.questions || [];
  let blocks = buildBlocks(qs);

  if (exam?.shuffle && uid) {
    const rnd = seeded(`${exam?.id || ''}:${uid}`);
    const out = [];
    let run = [];
    const flush = () => {
      for (let i = run.length - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1));
        [run[i], run[j]] = [run[j], run[i]];
      }
      out.push(...run);
      run = [];
    };
    for (const b of blocks) {
      if (b.key === null) run.push(b);
      else { flush(); out.push(b); }
    }
    flush();
    blocks = out;
  }

  let pos = 0;
  const shown = blocks.map((b) => ({
    ...b,
    items: b.idx.map((qi) => ({ qi, pos: pos++ })),
  }));
  return { blocks: shown, order: shown.flatMap((b) => b.items.map((it) => it.qi)) };
}
