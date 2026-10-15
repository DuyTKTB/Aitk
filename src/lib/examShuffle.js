/* ============================================================
   examShuffle.js — Utility tạo mã đề hoán vị, giữ nhóm độ khó
   ============================================================ */
import { normLevel } from './matrixAiService.js';

export function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleFisherYates(array, prng) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateShuffledVersions(questions = [], count = 4) {
  const codeList = ['101', '102', '103', '104'].slice(0, count);

  const groups = { nb: [], th: [], vd: [], vdc: [] };
  questions.forEach((q, idx) => {
    const lv = normLevel(q.level);
    groups[lv].push({ q, origIdx: idx });
  });

  return codeList.map((code, codeIdx) => {
    const seed = parseInt(code, 10) * 10007 + 37;
    const prng = mulberry32(seed);

    const shuffledByLevel = {};
    ['nb', 'th', 'vd', 'vdc'].forEach((lv) => {
      const group = groups[lv];
      shuffledByLevel[lv] = codeIdx === 0 ? group : shuffleFisherYates(group, prng);
    });

    const orderedWithOrig = [
      ...shuffledByLevel.nb,
      ...shuffledByLevel.th,
      ...shuffledByLevel.vd,
      ...shuffledByLevel.vdc,
    ];

    const finalQuestions = orderedWithOrig.map(({ q, origIdx }) => {
      if (q.type === 'true_false' || q.type === 'short_answer') {
        return { ...q, originalIndex: origIdx + 1, _origQuestion: q };
      }

      const origOpts = [...(q.options || [])];
      const origCorrectIdx = q.correct ?? 0;
      const correctText = origOpts[origCorrectIdx];

      const qPrng = mulberry32(seed + (origIdx + 1) * 313);
      const optIndices = origOpts.map((_, i) => i);
      const shuffledOptIndices =
        codeIdx === 0 ? optIndices : shuffleFisherYates(optIndices, qPrng);

      const newOpts = shuffledOptIndices.map((i) => origOpts[i]);
      const newCorrect = newOpts.indexOf(correctText);

      return {
        ...q,
        options: newOpts,
        correct: newCorrect >= 0 ? newCorrect : 0,
        origCorrect: origCorrectIdx,
        originalIndex: origIdx + 1,
        _origQuestion: q,
      };
    });

    const origToNew = {};
    const newToOrig = {};
    finalQuestions.forEach((q, newIdx) => {
      const origNum = q.originalIndex;
      const newNum = newIdx + 1;
      const type = q.type || 'single_choice';

      if (type === 'single_choice') {
        const newLetter = String.fromCharCode(65 + q.correct);
        const origLetter = String.fromCharCode(65 + (q.origCorrect ?? 0));
        origToNew[origNum] = { newNum, newLetter, origLetter, type };
        newToOrig[newNum] = { origNum, newLetter, origLetter, type };
      } else {
        origToNew[origNum] = { newNum, type };
        newToOrig[newNum] = { origNum, type };
      }
    });

    return { code, questions: finalQuestions, origToNew, newToOrig };
  });
}