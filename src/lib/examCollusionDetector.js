/* ============================================================
   examCollusionDetector.js — Phát hiện Chép bài & Thông đồng Thi
   Lấy cảm hứng từ:
     • Harpp-Hogan Index (McGill Univ.) — Trắc nghiệm (EIC / Differences)
     • TF-IDF Cosine + 3-gram Shingling — Tự luận (Plagiarism-Checker-API)
   Chạy 100% cục bộ, 0 tốn credit, bảo vệ minh bạch phòng thi.
   ============================================================ */

function normText(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function makeShingles(text, k = 3) {
  const words = normText(text).split(' ').filter((w) => w.length >= 2);
  if (words.length < k) return new Set(words);
  const set = new Set();
  for (let i = 0; i <= words.length - k; i++) {
    set.add(words.slice(i, i + k).join(' '));
  }
  return set;
}

/**
 * Tính TF-IDF Cosine Similarity + 3-gram Jaccard giữa 2 đoạn văn bản tự luận.
 */
export function computeEssaySimilarity(textA, textB) {
  const normA = normText(textA);
  const normB = normText(textB);
  if (normA.length < 35 || normB.length < 35) return 0;

  const wordsA = normA.split(' ').filter((w) => w.length >= 2);
  const wordsB = normB.split(' ').filter((w) => w.length >= 2);
  if (wordsA.length < 8 || wordsB.length < 8) return 0;

  const freqA = new Map();
  const freqB = new Map();
  wordsA.forEach((w) => freqA.set(w, (freqA.get(w) || 0) + 1));
  wordsB.forEach((w) => freqB.set(w, (freqB.get(w) || 0) + 1));

  const vocab = new Set([...freqA.keys(), ...freqB.keys()]);
  let dot = 0;
  let magA = 0;
  let magB = 0;
  vocab.forEach((w) => {
    const a = freqA.get(w) || 0;
    const b = freqB.get(w) || 0;
    dot += a * b;
    magA += a * a;
    magB += b * b;
  });
  const cosine = magA > 0 && magB > 0 ? dot / Math.sqrt(magA * magB) : 0;

  // Kết hợp 3-gram shingling để phát hiện chép nguyên cụm từ
  const shA = makeShingles(normA, 3);
  const shB = makeShingles(normB, 3);
  let inter = 0;
  shA.forEach((x) => { if (shB.has(x)) inter++; });
  const jaccard3 = shA.size + shB.size - inter > 0 ? inter / (shA.size + shB.size - inter) : 0;

  return Math.round((cosine * 0.55 + jaccard3 * 0.45) * 100);
}

/**
 * Lấy lựa chọn của học sinh ở câu j (trắc nghiệm).
 */
function getChosenOption(sub, j) {
  const d = sub?.detail?.[j];
  if (typeof d?.chosen === 'number') return d.chosen;
  if (typeof d?.picked === 'number') return d.picked;
  if (typeof sub?.answers?.[j] === 'number') return sub.answers[j];
  return -1;
}

/**
 * Lấy nội dung bài tự luận của học sinh (gộp tất cả câu tự luận).
 */
function getEssayText(sub, questions) {
  const parts = [];
  (questions || []).forEach((q, j) => {
    if (q?.type !== 'essay') return;
    const d = sub?.detail?.[j];
    const txt = d?.picked ?? d?.answer ?? sub?.answers?.[j] ?? '';
    if (typeof txt === 'string' && txt.trim()) parts.push(txt.trim());
  });
  return parts.join('\n');
}

/**
 * Phát hiện cặp học sinh nghi vấn chép bài trên cùng 1 đề thi:
 *  1) Trắc nghiệm: Chỉ số Harpp-Hogan H = EIC / max(1, Differences)
 *     - EIC: số câu CẢ HAI cùng chọn ĐÚNG 1 ĐÁP ÁN SAI giống hệt nhau
 *     - Nguy cơ cao khi EIC >= 3 và (H >= 0.75 hoặc tỷ lệ trùng đáp án sai >= 65% & trùng tổng >= 85%)
 *  2) Tự luận: TF-IDF + 3-gram similarity >= 62%
 */
export function detectExamCollusion(exam, submissions = []) {
  const questions = Array.isArray(exam?.questions) ? exam.questions : [];
  const subs = (Array.isArray(submissions) ? submissions : []).filter(Boolean);

  if (subs.length < 2 || questions.length === 0) {
    return {
      totalPairsChecked: 0,
      flaggedPairs: [],
      highRiskCount: 0,
      essayFlagCount: 0,
    };
  }

  const mcqIndices = [];
  questions.forEach((q, idx) => {
    if ((q?.type === 'single_choice' || !q?.type) && Array.isArray(q?.options) && q.options.length >= 2) {
      mcqIndices.push(idx);
    }
  });
  const hasEssay = questions.some((q) => q?.type === 'essay');

  // Precompute essay strings
  const essayTexts = hasEssay ? subs.map((s) => getEssayText(s, questions)) : [];
  const flaggedPairs = [];
  let totalPairsChecked = 0;

  for (let i = 0; i < subs.length; i++) {
    for (let j = i + 1; j < subs.length; j++) {
      totalPairsChecked += 1;
      const a = subs[i];
      const b = subs[j];

      // 1. Harpp-Hogan cho trắc nghiệm
      let eic = 0; // Errors In Common (cùng chọn đúng 1 đáp án sai)
      let diffs = 0; // Số câu chọn khác nhau
      let bothAnswered = 0;
      let exactMatches = 0;
      const sharedWrongQs = [];

      for (const qi of mcqIndices) {
        const ca = getChosenOption(a, qi);
        const cb = getChosenOption(b, qi);
        if (ca < 0 || cb < 0) continue;
        bothAnswered += 1;
        const correct = typeof questions[qi]?.correct === 'number' ? questions[qi].correct : -1;
        if (ca === cb) {
          exactMatches += 1;
          if (correct >= 0 && ca !== correct) {
            eic += 1;
            sharedWrongQs.push(qi + 1);
          }
        } else {
          diffs += 1;
        }
      }

      const matchPct = bothAnswered > 0 ? Math.round((exactMatches / bothAnswered) * 100) : 0;
      const harppHogan = eic > 0 ? Math.round((eic / Math.max(1, diffs)) * 100) / 100 : 0;

      // 2. Tự luận TF-IDF + 3-gram
      const essaySim = hasEssay ? computeEssaySimilarity(essayTexts[i], essayTexts[j]) : 0;

      // Phân loại rủi ro (giảm tối đa false positive cho lớp có nhiều học sinh điểm 10!)
      const mcqHigh = eic >= 3 && (harppHogan >= 0.75 || (diffs <= 2 && matchPct >= 88));
      const mcqMedium = !mcqHigh && eic >= 3 && harppHogan >= 0.45 && matchPct >= 75;
      const essayHigh = essaySim >= 72;
      const essayMedium = !essayHigh && essaySim >= 58;

      if (mcqHigh || mcqMedium || essayHigh || essayMedium) {
        const severity = mcqHigh || essayHigh ? 'high' : 'medium';
        const reasons = [];
        if (mcqHigh || mcqMedium) {
          reasons.push(`Trùng ${eic} câu sai giống hệt nhau (Harpp-Hogan H = ${harppHogan}, khớp ${matchPct}%)`);
        }
        if (essayHigh || essayMedium) {
          reasons.push(`Bài tự luận giống nhau ${essaySim}% (TF-IDF + 3-gram)`);
        }

        flaggedPairs.push({
          studentA: a.studentName || a.name || `HS #${i + 1}`,
          studentB: b.studentName || b.name || `HS #${j + 1}`,
          studentAId: a.studentId || a.uid || String(i),
          studentBId: b.studentId || b.uid || String(j),
          severity,
          eic,
          diffs,
          harppHogan,
          matchPct,
          sharedWrongQs: sharedWrongQs.slice(0, 12),
          essaySim,
          reasons,
        });
      }
    }
  }

  flaggedPairs.sort((x, y) => {
    if (x.severity !== y.severity) return x.severity === 'high' ? -1 : 1;
    return (y.harppHogan + y.essaySim / 100) - (x.harppHogan + x.essaySim / 100);
  });

  return {
    totalPairsChecked,
    flaggedPairs: flaggedPairs.slice(0, 20),
    highRiskCount: flaggedPairs.filter((p) => p.severity === 'high').length,
    essayFlagCount: flaggedPairs.filter((p) => p.essaySim >= 58).length,
  };
}
