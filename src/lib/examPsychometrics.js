/* ============================================================
   examPsychometrics.js — Phân tích Trắc nghiệm Chuẩn Khảo thí (CTT)
   Lấy cảm hứng từ Moodle Quiz Statistics & easystats/performance:
     • Cronbach's Alpha (α) — Độ tin cậy nội tại của đề thi
     • Item Difficulty (p) — Chỉ số độ khó từng câu (0..1)
     • Item Discrimination (D) — Độ phân biệt nhóm Cao 27% vs Thấp 27%
     • Point-Biserial Correlation (r_pb) — Tương quan điểm câu vs tổng điểm
     • Distractor Analysis — Hiệu quả phương án nhiễu (nhiễu chết / bẫy mạnh)
   Hàm thuần, không phụ thuộc UI, an toàn với mọi quy mô lớp.
   ============================================================ */

const LETTERS = 'ABCDEF';

function round2(n) {
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

function round3(n) {
  return Number.isFinite(n) ? Math.round(n * 1000) / 1000 : 0;
}

/**
 * Chuẩn hóa điểm của 1 học sinh trên 1 câu hỏi về [0, 1].
 * Hỗ trợ đầy đủ cả câu 1 đáp án (0 hoặc 1), câu Đúng/Sai 4 ý (0..1), và câu có earnedPoints.
 */
function itemRatioFromDetail(d) {
  if (!d) return 0;
  if (typeof d.earnedPoints === 'number' && typeof d.maxPoints === 'number' && d.maxPoints > 0) {
    return Math.max(0, Math.min(1, d.earnedPoints / d.maxPoints));
  }
  if (typeof d.scoreRatio === 'number' && Number.isFinite(d.scoreRatio)) {
    return Math.max(0, Math.min(1, d.scoreRatio));
  }
  return d.isCorrect ? 1 : 0;
}

/**
 * Đánh giá chỉ số Cronbach's Alpha (α).
 */
export function interpretCronbachAlpha(alpha) {
  if (alpha === null || alpha === undefined || !Number.isFinite(alpha)) {
    return { label: 'Chưa đủ dữ liệu', tone: 'na', advice: 'Cần ít nhất 3 bài nộp và 2 câu hỏi có biến thiên điểm.' };
  }
  if (alpha >= 0.8) {
    return { label: 'Rất tin cậy', tone: 'ex', advice: 'Đề thi có độ ổn định nội tại cao, đạt chuẩn khảo thí.' };
  }
  if (alpha >= 0.7) {
    return { label: 'Tin cậy tốt', tone: 'good', advice: 'Đề thi đạt độ tin cậy tốt cho kiểm tra định kì.' };
  }
  if (alpha >= 0.6) {
    return { label: 'Chấp nhận được', tone: 'mid', advice: 'Có thể rà soát thêm các câu có độ phân biệt thấp (D < 0.15).' };
  }
  return { label: 'Cần rà soát', tone: 'bad', advice: 'Độ đồng nhất thấp — kiểm tra các câu phân biệt âm hoặc quá dễ/quá khó.' };
}

/**
 * Đánh giá chất lượng từng câu hỏi dựa trên (p, D, r_pb).
 */
export function classifyItemQuality({ difficulty, discrimination, pointBiserial, n }) {
  if (n < 3) {
    return { status: 'insufficient', label: 'Ít bài nộp', tone: 'na', flag: false };
  }
  const disc = pointBiserial !== null ? pointBiserial : discrimination;
  if (disc !== null && disc < 0) {
    return {
      status: 'suspect_key',
      label: 'Nghi sai đáp án / tối nghĩa',
      tone: 'bad',
      flag: true,
    };
  }
  if (difficulty > 0.92) {
    return { status: 'too_easy', label: 'Quá dễ', tone: 'mid', flag: false };
  }
  if (difficulty < 0.2) {
    return { status: 'too_hard', label: 'Quá khó', tone: 'warn', flag: true };
  }
  if (disc !== null && disc < 0.15) {
    return { status: 'weak_disc', label: 'Phân biệt kém', tone: 'warn', flag: true };
  }
  if (disc !== null && disc >= 0.3 && difficulty >= 0.25 && difficulty <= 0.85) {
    return { status: 'excellent', label: 'Câu chuẩn tốt', tone: 'ex', flag: false };
  }
  return { status: 'good', label: 'Đạt yêu cầu', tone: 'good', flag: false };
}

/**
 * Phân tích trắc nghiệm CTT cho 1 đề thi và danh sách bài nộp thật.
 * @param {object} exam - { id, title, questions: [...] }
 * @param {Array} submissions - [{ studentId, score, totalPoints, detail: [{ isCorrect, chosen, ... }] }]
 */
export function analyzeExamPsychometrics(exam, submissions = []) {
  const questions = Array.isArray(exam?.questions) ? exam.questions : [];
  const validSubs = (Array.isArray(submissions) ? submissions : []).filter(
    (s) => s && (Array.isArray(s.detail) || Array.isArray(s.answers))
  );

  const n = validSubs.length;
  const k = questions.length;

  if (k === 0 || n === 0) {
    return {
      examId: exam?.id || '',
      examTitle: exam?.title || 'Đề kiểm tra',
      submissionCount: n,
      questionCount: k,
      cronbachAlpha: null,
      alphaMeta: interpretCronbachAlpha(null),
      meanDifficulty: null,
      meanDiscrimination: null,
      scoreMeanPct: null,
      scoreSdPct: null,
      flaggedCount: 0,
      suspectKeyCount: 0,
      items: [],
    };
  }

  // Ma trận điểm N × K (mỗi ô ∈ [0, 1]) + tổng điểm từng bài nộp
  const matrix = validSubs.map((sub) => {
    const detail = Array.isArray(sub.detail) ? sub.detail : [];
    const row = new Array(k);
    let sumItem = 0;
    for (let j = 0; j < k; j++) {
      const val = itemRatioFromDetail(detail[j]);
      row[j] = val;
      sumItem += val;
    }
    const tp = Number(sub.totalPoints);
    const totalPct = tp > 0 ? (Number(sub.score || 0) / tp) * 100 : (sumItem / k) * 100;
    return { sub, row, total: sumItem, totalPct };
  });

  // Sắp xếp theo tổng điểm giảm dần để tính Upper 27% / Lower 27% (Kelley's 27% rule)
  const ranked = [...matrix].sort((a, b) => b.total - a.total);
  const groupSize = Math.max(1, Math.round(n * 0.27));
  const upperGroup = ranked.slice(0, groupSize);
  const lowerGroup = ranked.slice(Math.max(0, n - groupSize));

  // Thống kê tổng điểm toàn đề (dùng cho Cronbach's Alpha & Point-Biserial)
  const totals = matrix.map((m) => m.total);
  const meanTotal = totals.reduce((a, b) => a + b, 0) / n;
  const varTotal =
    n > 1
      ? totals.reduce((acc, t) => acc + (t - meanTotal) ** 2, 0) / (n - 1)
      : 0;
  const sdTotal = Math.sqrt(varTotal);

  const pcts = matrix.map((m) => m.totalPct);
  const meanPct = pcts.reduce((a, b) => a + b, 0) / n;
  const sdPct =
    n > 1
      ? Math.sqrt(pcts.reduce((acc, x) => acc + (x - meanPct) ** 2, 0) / (n - 1))
      : 0;

  let sumItemVar = 0;
  const items = [];

  for (let j = 0; j < k; j++) {
    const q = questions[j] || {};
    const scoresJ = matrix.map((m) => m.row[j]);
    const p = scoresJ.reduce((a, b) => a + b, 0) / n;
    const varJ =
      n > 1
        ? scoresJ.reduce((acc, x) => acc + (x - p) ** 2, 0) / (n - 1)
        : 0;
    sumItemVar += varJ;

    // Discrimination D = p_upper - p_lower
    const pUpper = upperGroup.reduce((acc, m) => acc + m.row[j], 0) / upperGroup.length;
    const pLower = lowerGroup.reduce((acc, m) => acc + m.row[j], 0) / lowerGroup.length;
    const D = n >= 4 ? pUpper - pLower : null;

    // Point-Biserial / Item-Rest Correlation r_pb (tương quan với tổng điểm các câu còn lại để tránh thổi phồng)
    let rpb = null;
    if (n >= 4 && varJ > 1e-9) {
      const restTotals = matrix.map((m) => m.total - m.row[j]);
      const meanRest = restTotals.reduce((a, b) => a + b, 0) / n;
      let cov = 0;
      let varRest = 0;
      for (let i = 0; i < n; i++) {
        const dx = scoresJ[i] - p;
        const dy = restTotals[i] - meanRest;
        cov += dx * dy;
        varRest += dy * dy;
      }
      const denom = Math.sqrt((varJ * (n - 1)) * varRest);
      if (denom > 1e-9) {
        rpb = Math.max(-1, Math.min(1, cov / denom));
      }
    }

    // Phân tích phương án nhiễu (cho câu trắc nghiệm nhiều lựa chọn)
    let distractors = null;
    const opts = Array.isArray(q.options) ? q.options : [];
    if (opts.length >= 2 && (q.type === 'single_choice' || !q.type)) {
      const counts = new Array(opts.length).fill(0);
      const upperCounts = new Array(opts.length).fill(0);
      matrix.forEach((m) => {
        const d = m.sub.detail?.[j];
        const chosen = typeof d?.chosen === 'number' ? d.chosen : (typeof m.sub.answers?.[j] === 'number' ? m.sub.answers[j] : -1);
        if (chosen >= 0 && chosen < opts.length) counts[chosen] += 1;
      });
      upperGroup.forEach((m) => {
        const d = m.sub.detail?.[j];
        const chosen = typeof d?.chosen === 'number' ? d.chosen : (typeof m.sub.answers?.[j] === 'number' ? m.sub.answers[j] : -1);
        if (chosen >= 0 && chosen < opts.length) upperCounts[chosen] += 1;
      });

      const correctIdx = typeof q.correct === 'number' ? q.correct : -1;
      const optionStats = opts.map((_, oi) => {
        const pct = Math.round((counts[oi] / n) * 100);
        const isCorrect = oi === correctIdx;
        return {
          index: oi,
          letter: LETTERS[oi] || String(oi + 1),
          count: counts[oi],
          pct,
          upperCount: upperCounts[oi],
          isCorrect,
          isDead: !isCorrect && n >= 5 && counts[oi] === 0,
          isStrongTrap: !isCorrect && counts[oi] > 0 && correctIdx >= 0 && counts[oi] > counts[correctIdx],
        };
      });

      const deadCount = optionStats.filter((o) => o.isDead).length;
      const topTrap = optionStats
        .filter((o) => !o.isCorrect && o.count > 0)
        .sort((a, b) => b.count - a.count)[0] || null;

      distractors = {
        options: optionStats,
        deadCount,
        topTrap,
      };
    }

    const quality = classifyItemQuality({
      difficulty: p,
      discrimination: D,
      pointBiserial: rpb,
      n,
    });

    items.push({
      index: j,
      number: j + 1,
      question: String(q.q || q.text || `Câu ${j + 1}`).slice(0, 140),
      type: q.type || 'single_choice',
      level: q.level || '',
      topic: q.topic || '',
      difficulty: round2(p),
      difficultyPct: Math.round(p * 100),
      discrimination: D !== null ? round2(D) : null,
      pointBiserial: rpb !== null ? round2(rpb) : null,
      upperPct: Math.round(pUpper * 100),
      lowerPct: Math.round(pLower * 100),
      quality,
      distractors,
    });
  }

  // Cronbach's Alpha: α = (K / (K - 1)) * (1 - ΣVar(item_j) / Var(Total))
  let cronbachAlpha = null;
  if (n >= 3 && k >= 2 && varTotal > 1e-9) {
    const rawAlpha = (k / (k - 1)) * (1 - sumItemVar / varTotal);
    cronbachAlpha = round3(Math.max(-1, Math.min(1, rawAlpha)));
  }

  const validDiscs = items.map((it) => it.discrimination).filter((d) => d !== null);
  const meanDifficulty = round2(items.reduce((a, b) => a + b.difficulty, 0) / items.length);
  const meanDiscrimination = validDiscs.length
    ? round2(validDiscs.reduce((a, b) => a + b, 0) / validDiscs.length)
    : null;

  return {
    examId: exam?.id || '',
    examTitle: exam?.title || 'Đề kiểm tra',
    submissionCount: n,
    questionCount: k,
    cronbachAlpha,
    alphaMeta: interpretCronbachAlpha(cronbachAlpha),
    meanDifficulty,
    meanDiscrimination,
    scoreMeanPct: Math.round(meanPct),
    scoreSdPct: round2(sdPct),
    scoreSd10: round2(sdPct / 10),
    flaggedCount: items.filter((it) => it.quality.flag).length,
    suspectKeyCount: items.filter((it) => it.quality.status === 'suspect_key').length,
    items,
  };
}
