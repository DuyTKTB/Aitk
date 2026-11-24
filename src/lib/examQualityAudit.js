/* ============================================================
   examQualityAudit.js — Kiểm định Chất lượng Đề & Chống thiên lệch AI (0 credit)
   Lấy cảm hứng từ ai-question-paper-generator & QuizGen-RAG:
     • Kiểm tra cân bằng vị trí đáp án đúng A/B/C/D (phát hiện thiên lệch LLM)
     • Kiểm tra Length Bias (đáp án đúng dài vượt trội dễ đoán mò)
     • Kiểm tra câu trùng / gần giống nhau (Jaccard n-gram)
     • Kiểm tra lỗi cú pháp LaTeX ($ lẻ, ngoặc nhọn lệch)
     • Kiểm tra phương án trùng lặp / thiếu đáp án / thiếu lời giải
     • Tự động cân bằng vị trí đáp án A/B/C/D an toàn (không đảo câu "Cả A và B")
   ============================================================ */

const LETTERS = 'ABCDEF';

// Không tự ý đảo vị trí đáp án cho câu có tham chiếu chéo ("Cả A và B", "Tất cả các đáp án trên"...)
const LOCKED_OPTION_RE = /\b(?:cả\s+[a-d]\s*(?:và|,|&)\s*[a-d]|tất\s*cả\s*(?:các)?\s*(?:đáp\s*án|phương\s*án|ý|câu)\s*(?:trên|đều)|không\s*(?:có)?\s*(?:đáp\s*án|phương\s*án)\s*nào|all\s+of\s+the\s+above|both\s+[a-d]\s+and\s+[a-d]|none\s+of\s+the\s+above)\b/i;

function normTokens(str) {
  return new Set(
    String(str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 2)
  );
}

function jaccard(setA, setB) {
  if (!setA.size || !setB.size) return 0;
  let inter = 0;
  setA.forEach((v) => {
    if (setB.has(v)) inter += 1;
  });
  return inter / (setA.size + setB.size - inter);
}

function hasUnbalancedLatex(str) {
  const s = String(str || '');
  // Bỏ qua \$ thoát
  const cleaned = s.replace(/\\\$/g, '');
  const dollarCount = (cleaned.match(/\$/g) || []).length;
  if (dollarCount % 2 === 1) return true;
  // Kiểm tra ngoặc nhọn bên trong $...$
  const mathBlocks = cleaned.match(/\$[^$]+\$/g) || [];
  for (const blk of mathBlocks) {
    let depth = 0;
    for (let i = 0; i < blk.length; i++) {
      if (blk[i] === '{' && blk[i - 1] !== '\\') depth += 1;
      else if (blk[i] === '}' && blk[i - 1] !== '\\') depth -= 1;
      if (depth < 0) return true;
    }
    if (depth !== 0) return true;
  }
  return false;
}

/**
 * Kiểm định chất lượng bộ câu hỏi (tức thì, 0 tốn credit).
 */
export function auditExamQuality(questions = []) {
  const list = Array.isArray(questions) ? questions : [];
  if (list.length === 0) {
    return {
      score: 0,
      grade: 'Chưa có câu hỏi',
      tone: 'na',
      total: 0,
      mcqCount: 0,
      answerDistribution: [0, 0, 0, 0],
      answerBias: false,
      lengthBiasIndices: [],
      duplicatePairs: [],
      latexErrorIndices: [],
      missingKeyIndices: [],
      duplicateOptionIndices: [],
      missingExplainCount: 0,
      issues: [],
    };
  }

  const dist = [0, 0, 0, 0];
  let mcqCount = 0;
  const lengthBiasIndices = [];
  const latexErrorIndices = [];
  const missingKeyIndices = [];
  const duplicateOptionIndices = [];
  let missingExplainCount = 0;

  const tokenSets = list.map((q) => normTokens(q?.q || q?.text || ''));

  list.forEach((q, idx) => {
    const type = q?.type || 'single_choice';
    const text = String(q?.q || q?.text || '');
    const opts = Array.isArray(q?.options) ? q.options : [];

    // 1. LaTeX check
    if (
      hasUnbalancedLatex(text) ||
      opts.some((o) => hasUnbalancedLatex(o)) ||
      (Array.isArray(q?.statements) && q.statements.some((st) => hasUnbalancedLatex(st?.text)))
    ) {
      latexErrorIndices.push(idx);
    }

    // 2. Explain check
    if (!String(q?.explain || q?.sampleAnswer || '').trim()) {
      missingExplainCount += 1;
    }

    // 3. Key & option checks
    if (type === 'single_choice') {
      mcqCount += 1;
      const correct = typeof q.correct === 'number' ? q.correct : -1;
      if (correct < 0 || correct >= opts.length) {
        missingKeyIndices.push(idx);
      } else {
        if (correct < 4) dist[correct] += 1;
        // Length bias check (chỉ kiểm tra khi đáp án chữ đủ dài >= 18 ký tự để tránh false positive trên số/công thức ngắn)
        const rightLen = String(opts[correct] || '').trim().length;
        const wrongLens = opts
          .filter((_, oi) => oi !== correct)
          .map((o) => String(o || '').trim().length)
          .filter((l) => l > 0);
        if (rightLen >= 22 && wrongLens.length >= 2) {
          const avgWrong = wrongLens.reduce((a, b) => a + b, 0) / wrongLens.length;
          if (avgWrong > 0 && rightLen >= avgWrong * 1.65) {
            lengthBiasIndices.push(idx);
          }
        }
      }

      // Trùng lặp phương án trong cùng 1 câu
      const seenOpts = new Set();
      let hasDupOpt = false;
      for (const o of opts) {
        const key = String(o || '').trim().toLowerCase();
        if (!key) continue;
        if (seenOpts.has(key)) {
          hasDupOpt = true;
          break;
        }
        seenOpts.add(key);
      }
      if (hasDupOpt) duplicateOptionIndices.push(idx);
    } else if (type === 'true_false') {
      const sts = Array.isArray(q.statements) ? q.statements : [];
      if (sts.length === 0 || sts.some((st) => st?.answer !== true && st?.answer !== false)) {
        missingKeyIndices.push(idx);
      }
    } else if (type === 'short_answer') {
      if (!String(q.answer ?? '').trim()) {
        missingKeyIndices.push(idx);
      }
    }
  });

  // 4. Phát hiện câu hỏi trùng / gần giống nhau
  const duplicatePairs = [];
  for (let i = 0; i < list.length; i++) {
    if (tokenSets[i].size < 4) continue;
    for (let j = i + 1; j < list.length; j++) {
      if (tokenSets[j].size < 4) continue;
      const sim = jaccard(tokenSets[i], tokenSets[j]);
      if (sim >= 0.72) {
        duplicatePairs.push({ a: i, b: j, similarity: Math.round(sim * 100) });
      }
    }
  }

  // 5. Thiên lệch vị trí đáp án A/B/C/D (khi có >= 4 câu trắc nghiệm)
  const maxShare = mcqCount >= 4 ? Math.max(...dist) / mcqCount : 0;
  const answerBias = mcqCount >= 4 && maxShare > 0.45;
  const biasedIdx = dist.indexOf(Math.max(...dist));

  // Tổng hợp danh sách vấn đề + tính điểm 0..100
  const issues = [];
  let score = 100;

  if (missingKeyIndices.length > 0) {
    score -= Math.min(35, missingKeyIndices.length * 8);
    issues.push({
      severity: 'error',
      code: 'missing_key',
      label: `${missingKeyIndices.length} câu chưa có đáp án đúng`,
      indices: missingKeyIndices,
    });
  }
  if (duplicateOptionIndices.length > 0) {
    score -= Math.min(20, duplicateOptionIndices.length * 7);
    issues.push({
      severity: 'error',
      code: 'dup_option',
      label: `${duplicateOptionIndices.length} câu có 2 phương án trùng nội dung`,
      indices: duplicateOptionIndices,
    });
  }
  if (latexErrorIndices.length > 0) {
    score -= Math.min(20, latexErrorIndices.length * 6);
    issues.push({
      severity: 'warn',
      code: 'latex_error',
      label: `${latexErrorIndices.length} câu lệch dấu công thức $ hoặc ngoặc {}`,
      indices: latexErrorIndices,
    });
  }
  if (duplicatePairs.length > 0) {
    score -= Math.min(18, duplicatePairs.length * 6);
    issues.push({
      severity: 'warn',
      code: 'dup_question',
      label: `${duplicatePairs.length} cặp câu hỏi gần trùng lặp nội dung`,
      pairs: duplicatePairs,
    });
  }
  if (answerBias) {
    score -= 10;
    issues.push({
      severity: 'warn',
      code: 'answer_bias',
      label: `Thiên lệch đáp án ${LETTERS[biasedIdx]} (${Math.round(maxShare * 100)}%) — nên bấm "Cân bằng A/B/C/D"`,
    });
  }
  if (lengthBiasIndices.length > 0) {
    score -= Math.min(12, lengthBiasIndices.length * 3);
    issues.push({
      severity: 'info',
      code: 'length_bias',
      label: `${lengthBiasIndices.length} câu có đáp án đúng dài vượt trội (dễ khoanh mò)`,
      indices: lengthBiasIndices,
    });
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const grade = score >= 90 ? 'Chuẩn rất tốt' : score >= 75 ? 'Khá ổn' : score >= 55 ? 'Cần chỉnh sửa' : 'Nhiều lỗi';
  const tone = score >= 90 ? 'ex' : score >= 75 ? 'good' : score >= 55 ? 'mid' : 'bad';

  return {
    score,
    grade,
    tone,
    total: list.length,
    mcqCount,
    answerDistribution: dist,
    answerBias,
    lengthBiasIndices,
    duplicatePairs,
    latexErrorIndices,
    missingKeyIndices,
    duplicateOptionIndices,
    missingExplainCount,
    issues,
  };
}

/**
 * Tự động cân bằng vị trí đáp án đúng A/B/C/D về ~25% mỗi chữ cái
 * mà vẫn giữ nguyên nội dung câu hỏi & phương án (bỏ qua câu có "Cả A và B" / "Tất cả trên").
 */
export function balanceMcqAnswerPositions(questions = []) {
  const list = Array.isArray(questions) ? questions : [];
  const eligible = [];
  list.forEach((q, idx) => {
    if (
      (q?.type === 'single_choice' || !q?.type) &&
      Array.isArray(q?.options) &&
      q.options.length === 4 &&
      typeof q.correct === 'number' &&
      q.correct >= 0 &&
      q.correct < 4 &&
      !q.options.some((o) => LOCKED_OPTION_RE.test(String(o || '')))
    ) {
      eligible.push(idx);
    }
  });

  if (eligible.length < 2) return list;

  // Xây dựng mảng mục tiêu cân bằng 0, 1, 2, 3 theo lượt xoay đều
  const targets = eligible.map((_, k) => k % 4);
  // Đảo nhẹ xác định theo vị trí để tránh chuỗi lặp A-B-C-D dễ đoán
  for (let i = targets.length - 1; i > 0; i--) {
    const j = (i * 7 + 3) % (i + 1);
    [targets[i], targets[j]] = [targets[j], targets[i]];
  }

  const targetByIndex = new Map();
  eligible.forEach((qIdx, k) => targetByIndex.set(qIdx, targets[k]));

  return list.map((q, idx) => {
    if (!targetByIndex.has(idx)) return q;
    const desired = targetByIndex.get(idx);
    if (desired === q.correct) return q;

    const newOpts = [...q.options];
    const tmp = newOpts[desired];
    newOpts[desired] = newOpts[q.correct];
    newOpts[q.correct] = tmp;

    // Hoán đổi luôn optionImages nếu có
    let newOptImgs = q.optionImages;
    if (Array.isArray(q.optionImages) && q.optionImages.length === 4) {
      newOptImgs = [...q.optionImages];
      const tmpImg = newOptImgs[desired];
      newOptImgs[desired] = newOptImgs[q.correct];
      newOptImgs[q.correct] = tmpImg;
    }

    return {
      ...q,
      options: newOpts,
      optionImages: newOptImgs,
      correct: desired,
    };
  });
}
