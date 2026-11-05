/* ============================================================
   examShuffle.js — Utility tạo mã đề hoán vị chuẩn GDPT 2025
   Hỗ trợ:
   • Giữ đúng cấu trúc 3 phần: Phần I (ABCD) → Phần II (Đúng/Sai) → Phần III (Trả lời ngắn)
   • Tùy chọn trộn riêng từng phần:
     - Phần I: Trộn thứ tự câu + Đảo vị trí phương án A, B, C, D (kèm ảnh phương án)
     - Phần II: Trộn thứ tự câu + Đảo vị trí các ý a), b), c), d)
     - Phần III: Trộn thứ tự câu trả lời ngắn
   • Giữ nhóm độ khó (NB → TH → VD → VDC) hoặc đảo tự do
   • Giữ nhóm câu liên kết (groupId / passageId / đoạn đọc hiểu English "Read the...")
   • Khóa vị trí câu cố định (lockedIndices)
   • Xử lý thông minh phương án đặc biệt ("Cả A và B đúng", "Tất cả các đáp án trên"...)
   • Tái lập đề 100% từ hạt giống (salt / seedText)
   • Tự động kiểm định (validateShuffledVersions)
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

export const ALL_CODES = [
  '101', '102', '103', '104',
  '105', '106', '107', '108',
  '109', '110', '111', '112',
];

/** Chuyển chuỗi hoặc số hạt giống thành số nguyên 32-bit ổn định. */
export function hashSeedText(input) {
  if (input === null || input === undefined || input === '') return 0;
  if (typeof input === 'number') return Number.isFinite(input) ? Math.trunc(input) : 0;
  const str = String(input).trim();
  if (!str) return 0;
  if (/^-?\d+$/.test(str)) return parseInt(str, 10) || 0;
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 100000000;
}

/** Mã đề + seed suy ra từ mã, cộng thêm "muối" để tái lập đúng đề cũ về sau. */
export function seedForCode(code, salt = 0) {
  const numericSalt = typeof salt === 'number' ? (Number(salt) || 0) : hashSeedText(salt);
  return parseInt(code, 10) * 10007 + 37 + numericSalt;
}

/* ============================================================
   NHẬN DIỆN PHƯƠNG ÁN ĐẶC BIỆT PHỤ THUỘC VỊ TRÍ
   ============================================================ */

const CROSS_LETTER_PATTERNS = [
  /\bcả\s+[a-d]\s*(,|và|&|hoặc)\s*[a-d]\b/i,
  /\bcả\s+[a-d]\s*,\s*[a-d]\s*(,|và|&)?\s*[a-d]\b/i,
  /\b(đáp\s+án|phương\s+án|ý|câu)\s+[a-d]\s*(,|và|&|hoặc)\s*[a-d]\b/i,
  /\b[a-d]\s*(,|và|&)\s*[a-d]\s+(đều\s+)?(đúng|sai)\b/i,
  /\b[a-d]\s*,\s*[a-d]\s*(,|và|&)?\s*[a-d]\s+(đều\s+)?(đúng|sai)\b/i,
  /\bcả\s+(hai|2|ba|3)\s+(đáp\s+án|phương\s+án)\s+[a-d]/i,
];

const POSITIONAL_ABOVE_PATTERNS = [
  /tất\s+cả\s+(các\s+)?(đáp\s+án|phương\s+án|ý|lựa\s+chọn)\s+trên/i,
  /tất\s+cả\s+(các\s+)?(đáp\s+án|phương\s+án)\s+đều\s+(đúng|sai)/i,
  /tất\s+cả\s+đều\s+(đúng|sai)/i,
  /cả\s+(hai|2|ba|3)\s+(đáp\s+án|phương\s+án|ý)\s+trên/i,
  /không\s+có\s+(đáp\s+án|phương\s+án|ý)\s+nào\s+(trên|đúng)/i,
  /các\s+(đáp\s+án|phương\s+án)\s+trên\s+đều\s+(đúng|sai)/i,
];

export function hasPositionalOption(options = []) {
  if (!Array.isArray(options) || options.length === 0) return false;
  return options.some((opt) => {
    const text = String(opt || '').trim();
    if (!text) return false;
    return (
      CROSS_LETTER_PATTERNS.some((re) => re.test(text)) ||
      POSITIONAL_ABOVE_PATTERNS.some((re) => re.test(text))
    );
  });
}

export function analyzePositionalOptions(options = []) {
  if (!Array.isArray(options) || options.length === 0) {
    return { hasSpecial: false, mode: 'none', reason: '' };
  }

  let hasCrossLetter = false;
  const aboveIndices = [];

  options.forEach((opt, idx) => {
    const text = String(opt || '').trim();
    if (!text) return;
    if (CROSS_LETTER_PATTERNS.some((re) => re.test(text))) {
      hasCrossLetter = true;
    }
    if (POSITIONAL_ABOVE_PATTERNS.some((re) => re.test(text))) {
      aboveIndices.push(idx);
    }
  });

  if (hasCrossLetter) {
    return {
      hasSpecial: true,
      mode: 'lock_all',
      reason: 'Giữ nguyên thứ tự A/B/C/D do có phương án liên kết vị trí',
    };
  }

  if (aboveIndices.length > 0) {
    const onlyAtLast = aboveIndices.length === 1 && aboveIndices[0] === options.length - 1;
    if (onlyAtLast) {
      return {
        hasSpecial: true,
        mode: 'pin_last',
        reason: 'Giữ nguyên thứ tự A/B/C/D do có phương án liên kết vị trí',
      };
    }
    return {
      hasSpecial: true,
      mode: 'lock_all',
      reason: 'Giữ nguyên thứ tự A/B/C/D do có phương án liên kết vị trí',
    };
  }

  return { hasSpecial: false, mode: 'none', reason: '' };
}

/* ============================================================
   THUẬT TOÁN ĐẢO ĐỀ NÂNG CAO (CHUẨN 3 PHẦN GDPT 2025)
   ============================================================ */

function buildChunks(items, keepLinkedGroups) {
  if (!keepLinkedGroups) {
    return items.map((item) => [item]);
  }
  const chunks = [];
  const groupMap = new Map();

  items.forEach((item) => {
    const gKey = item.q?.groupId || item.q?.passageId || item.q?.contextId || item.q?.readingId || null;
    if (gKey) {
      if (groupMap.has(gKey)) {
        groupMap.get(gKey).push(item);
      } else {
        const chunk = [item];
        groupMap.set(gKey, chunk);
        chunks.push(chunk);
      }
    } else {
      chunks.push([item]);
    }
  });

  return chunks;
}

/**
 * Đảo thứ tự câu hỏi trong 1 phân nhóm (VD: Phần I, Phần II hoặc Phần III)
 */
function shufflePartItems(partItems, { shouldShuffle, keepDifficultyGroups, keepLinkedGroups, lockedSet, codeIdx, prng }) {
  if (!shouldShuffle || codeIdx === 0 || partItems.length <= 1) {
    return [...partItems];
  }

  const unlockedItems = [];
  partItems.forEach((item) => {
    const isReadTheLocked = Boolean(item.q?.lockGroupQuestionOrder);
    if (!lockedSet.has(item.origIdx) && !isReadTheLocked) {
      unlockedItems.push(item);
    }
  });

  let shuffledUnlocked = [];
  if (keepDifficultyGroups) {
    const lvBuckets = { nb: [], th: [], vd: [], vdc: [] };
    unlockedItems.forEach((item) => {
      const lv = normLevel(item.q.level);
      lvBuckets[lv].push(item);
    });
    ['nb', 'th', 'vd', 'vdc'].forEach((lv) => {
      const chunks = buildChunks(lvBuckets[lv], keepLinkedGroups);
      const orderedChunks = shuffleFisherYates(chunks, prng);
      orderedChunks.forEach((chunk) => shuffledUnlocked.push(...chunk));
    });
  } else {
    const chunks = buildChunks(unlockedItems, keepLinkedGroups);
    const orderedChunks = shuffleFisherYates(chunks, prng);
    orderedChunks.forEach((chunk) => shuffledUnlocked.push(...chunk));
  }

  let uPtr = 0;
  return partItems.map((item) => {
    const isReadTheLocked = Boolean(item.q?.lockGroupQuestionOrder);
    if (lockedSet.has(item.origIdx) || isReadTheLocked) {
      return item;
    }
    return shuffledUnlocked[uPtr++];
  });
}

export function generateShuffledVersions(questions = [], count = 4, options = {}) {
  const {
    salt = 0,
    seedText = '',
    shuffleQuestions = true,
    shuffleOptions = true,
    shufflePart1,
    shufflePart1Options,
    shufflePart2,
    shufflePart2Statements,
    shufflePart3,
    keepPartsOrder = true,
    keepDifficultyGroups = true,
    keepLinkedGroups = true,
    lockedIndices = [],
    smartSpecialOptions = true,
    customCodes = null,
  } = options || {};

  const effShufflePart1 = shufflePart1 !== undefined ? Boolean(shufflePart1) : Boolean(shuffleQuestions);
  const effShufflePart1Opts = shufflePart1Options !== undefined ? Boolean(shufflePart1Options) : Boolean(shuffleOptions);
  const effShufflePart2 = shufflePart2 !== undefined ? Boolean(shufflePart2) : Boolean(shuffleQuestions);
  const effShufflePart2Stmts = shufflePart2Statements !== undefined ? Boolean(shufflePart2Statements) : Boolean(shuffleOptions);
  const effShufflePart3 = shufflePart3 !== undefined ? Boolean(shufflePart3) : Boolean(shuffleQuestions);

  const codeList =
    Array.isArray(customCodes) && customCodes.length > 0
      ? customCodes.map(String).slice(0, ALL_CODES.length)
      : ALL_CODES.slice(0, Math.max(1, Math.min(ALL_CODES.length, count)));

  const effectiveSalt =
    (typeof salt === 'number' ? Number(salt) || 0 : hashSeedText(salt)) +
    (seedText ? hashSeedText(seedText) : 0);

  const lockedSet = new Set(
    Array.isArray(lockedIndices)
      ? lockedIndices.map((i) => Number(i))
      : lockedIndices instanceof Set
      ? [...lockedIndices].map((i) => Number(i))
      : []
  );

  const indexedQuestions = questions.map((q, idx) => ({ q, origIdx: idx }));
  const hasMultipleParts = new Set(questions.map((q) => q?.type || 'single_choice')).size > 1;

  return codeList.map((code, codeIdx) => {
    const seed = seedForCode(code, effectiveSalt);
    const prng = mulberry32(seed);

    let orderedWithOrig = [];

    if (codeIdx === 0) {
      orderedWithOrig = indexedQuestions;
    } else if (keepPartsOrder && hasMultipleParts) {
      const p1 = indexedQuestions.filter(({ q }) => (q.type || 'single_choice') === 'single_choice');
      const p2 = indexedQuestions.filter(({ q }) => q.type === 'true_false');
      const p3 = indexedQuestions.filter(({ q }) => q.type === 'short_answer');

      const s1 = shufflePartItems(p1, {
        shouldShuffle: effShufflePart1,
        keepDifficultyGroups,
        keepLinkedGroups,
        lockedSet,
        codeIdx,
        prng,
      });
      const s2 = shufflePartItems(p2, {
        shouldShuffle: effShufflePart2,
        keepDifficultyGroups,
        keepLinkedGroups,
        lockedSet,
        codeIdx,
        prng,
      });
      const s3 = shufflePartItems(p3, {
        shouldShuffle: effShufflePart3,
        keepDifficultyGroups,
        keepLinkedGroups,
        lockedSet,
        codeIdx,
        prng,
      });

      orderedWithOrig = [...s1, ...s2, ...s3];
    } else {
      orderedWithOrig = shufflePartItems(indexedQuestions, {
        shouldShuffle: effShufflePart1 && shuffleQuestions,
        keepDifficultyGroups,
        keepLinkedGroups,
        lockedSet,
        codeIdx,
        prng,
      });
    }

    const finalQuestions = orderedWithOrig.map(({ q, origIdx }) => {
      const isLockedPos = lockedSet.has(origIdx);
      const qPrng = mulberry32(seed + (origIdx + 1) * 313);

      // Phần III: Trả lời ngắn
      if (q.type === 'short_answer') {
        const base = { ...q, originalIndex: origIdx + 1, _origQuestion: q };
        if (isLockedPos) base.isPositionLocked = true;
        return base;
      }

      // Phần II: Đúng / Sai (hỗ trợ đảo các ý a, b, c, d)
      if (q.type === 'true_false') {
        const origStmts = Array.isArray(q.statements) ? q.statements.map((s, sIdx) => ({ ...s, origStatementIdx: sIdx })) : [];
        let newStmts = origStmts;
        if (codeIdx > 0 && effShufflePart2Stmts && origStmts.length > 1) {
          newStmts = shuffleFisherYates(origStmts, qPrng);
        }
        const base = {
          ...q,
          statements: newStmts,
          origStatements: origStmts,
          originalIndex: origIdx + 1,
          _origQuestion: q,
        };
        if (isLockedPos) base.isPositionLocked = true;
        return base;
      }

      // Phần I: Trắc nghiệm 4 lựa chọn A, B, C, D
      const origOpts = [...(q.options || [])];
      const origOptImgs = Array.isArray(q.optionImages) ? [...q.optionImages] : null;
      const origCorrectIdx = q.correct ?? 0;
      const correctText = origOpts[origCorrectIdx];

      const optIndices = origOpts.map((_, i) => i);

      const specialInfo = smartSpecialOptions
        ? analyzePositionalOptions(origOpts)
        : { hasSpecial: false, mode: 'none', reason: '' };

      let shuffledOptIndices;
      if (codeIdx === 0 || !effShufflePart1Opts) {
        shuffledOptIndices = optIndices;
      } else if (specialInfo.hasSpecial && specialInfo.mode === 'lock_all') {
        shuffledOptIndices = optIndices;
      } else if (specialInfo.hasSpecial && specialInfo.mode === 'pin_last' && optIndices.length > 2) {
        const prefix = optIndices.slice(0, -1);
        const last = optIndices[optIndices.length - 1];
        shuffledOptIndices = [...shuffleFisherYates(prefix, qPrng), last];
      } else {
        shuffledOptIndices = shuffleFisherYates(optIndices, qPrng);
      }

      const newOpts = shuffledOptIndices.map((i) => origOpts[i]);
      const newOptImgs = origOptImgs ? shuffledOptIndices.map((i) => origOptImgs[i] || null) : undefined;
      const newCorrect = shuffledOptIndices.indexOf(origCorrectIdx) >= 0
        ? shuffledOptIndices.indexOf(origCorrectIdx)
        : newOpts.indexOf(correctText);

      const resultQ = {
        ...q,
        options: newOpts,
        ...(newOptImgs ? { optionImages: newOptImgs } : {}),
        correct: newCorrect >= 0 ? newCorrect : 0,
        origCorrect: origCorrectIdx,
        originalIndex: origIdx + 1,
        _origQuestion: q,
      };

      if (specialInfo.hasSpecial) {
        resultQ.optionLockedReason = specialInfo.reason;
        resultQ.specialOptionMode = specialInfo.mode;
      }
      if (isLockedPos) {
        resultQ.isPositionLocked = true;
      }

      return resultQ;
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
        origToNew[origNum] = {
          newNum,
          newLetter,
          origLetter,
          type,
          optionLockedReason: q.optionLockedReason || null,
          isPositionLocked: Boolean(q.isPositionLocked),
        };
        newToOrig[newNum] = {
          origNum,
          newLetter,
          origLetter,
          type,
          optionLockedReason: q.optionLockedReason || null,
          isPositionLocked: Boolean(q.isPositionLocked),
        };
      } else if (type === 'true_false') {
        const stmtSummary = (q.statements || []).map((s) => (s.answer ? 'Đ' : 'S')).join('-');
        origToNew[origNum] = {
          newNum,
          newLetter: stmtSummary,
          origLetter: stmtSummary,
          type,
          isPositionLocked: Boolean(q.isPositionLocked),
        };
        newToOrig[newNum] = {
          origNum,
          newLetter: stmtSummary,
          origLetter: stmtSummary,
          type,
          isPositionLocked: Boolean(q.isPositionLocked),
        };
      } else {
        origToNew[origNum] = {
          newNum,
          newLetter: String(q.answer ?? ''),
          origLetter: String(q.answer ?? ''),
          type,
          isPositionLocked: Boolean(q.isPositionLocked),
        };
        newToOrig[newNum] = {
          origNum,
          newLetter: String(q.answer ?? ''),
          origLetter: String(q.answer ?? ''),
          type,
          isPositionLocked: Boolean(q.isPositionLocked),
        };
      }
    });

    return { code, seed, questions: finalQuestions, origToNew, newToOrig };
  });
}

/* ============================================================
   BẢNG ĐÁP ÁN, KIỂM TRA TRÙNG ĐỀ & AUTO-VALIDATION
   ============================================================ */

/** Bảng đáp án của một mã đề, sắp theo số câu mới (để in). */
export function answerKeyOf(version) {
  if (!version?.questions) return [];
  return version.questions.map((q, idx) => {
    const type = q.type || 'single_choice';
    const originalIndex = q.originalIndex ?? idx + 1;
    if (type === 'single_choice') {
      return {
        newNum: idx + 1,
        originalNum: originalIndex,
        type,
        letter: String.fromCharCode(65 + (q.correct ?? 0)),
        origLetter: String.fromCharCode(65 + (q.origCorrect ?? q.correct ?? 0)),
      };
    }
    if (type === 'true_false') {
      return {
        newNum: idx + 1,
        originalNum: originalIndex,
        type,
        letter: '',
        statements: (q.statements || []).map((s) => (s.answer ? 'Đ' : 'S')),
      };
    }
    return {
      newNum: idx + 1,
      originalNum: originalIndex,
      type,
      letter: String(q.answer ?? ''),
    };
  });
}

/** Mã đề trùng nhau: cùng thứ tự câu VÀ cùng thứ tự đáp án. */
export function findCollisions(versions = []) {
  const seen = new Map();
  const collisions = [];
  versions.forEach((v) => {
    const sig = v.questions
      .map((q) => {
        if (q.type === 'true_false') {
          const stSig = (q.statements || []).map((s) => `${s.text}:${s.answer ? 1 : 0}`).join('|');
          return `${q.originalIndex}:TF:${stSig}`;
        }
        return `${q.originalIndex}:${q.correct ?? ''}:${(q.options || []).join('|')}`;
      })
      .join(';');
    if (seen.has(sig)) collisions.push([seen.get(sig), v.code]);
    else seen.set(sig, v.code);
  });
  return collisions;
}

/** Dòng CSV bảng đáp án nhiều mã đề: Mã | Câu | Đáp án | Câu gốc. */
export function answerKeyRows(versions = []) {
  const rows = [];
  versions.forEach((v) => {
    answerKeyOf(v).forEach((r) => {
      rows.push([v.code, r.newNum, r.letter || (r.statements || []).join(' '), r.originalNum]);
    });
  });
  return rows;
}

export function validateShuffledVersions(versions = [], originalCount = 0) {
  if (!Array.isArray(versions) || versions.length === 0) {
    return {
      allCountMatch: false,
      allAnswerKeysValid: false,
      collisions: [],
      specialOptionsHandled: 0,
      specialOptionDetails: [],
      lockedQuestionsCount: 0,
      passed: false,
    };
  }

  const targetCount = originalCount > 0 ? originalCount : (versions[0]?.questions?.length || 0);

  const allCountMatch = versions.every((v) => {
    const qs = v?.questions || [];
    if (qs.length !== targetCount) return false;
    const uniqueOrig = new Set(qs.map((q) => q.originalIndex));
    return uniqueOrig.size === targetCount;
  });

  const allAnswerKeysValid = versions.every((v) => {
    const qs = v?.questions || [];
    return qs.every((q) => {
      const type = q.type || 'single_choice';
      if (type === 'single_choice') {
        const opts = q.options || [];
        if (typeof q.correct !== 'number' || q.correct < 0 || q.correct >= opts.length) {
          return false;
        }
        if (q._origQuestion && Array.isArray(q._origQuestion.options)) {
          const origCorrectIdx = q._origQuestion.correct ?? 0;
          const origCorrectText = q._origQuestion.options[origCorrectIdx];
          if (origCorrectText !== undefined && opts[q.correct] !== origCorrectText) {
            return false;
          }
        }
        return true;
      }
      if (type === 'true_false') {
        return Array.isArray(q.statements) && q.statements.length > 0;
      }
      return true;
    });
  });

  const collisions = findCollisions(versions);

  const specialMap = new Map();
  const lockedSet = new Set();
  versions.forEach((v) => {
    (v?.questions || []).forEach((q) => {
      if (q.optionLockedReason) {
        specialMap.set(q.originalIndex, {
          originalIndex: q.originalIndex,
          reason: q.optionLockedReason,
          mode: q.specialOptionMode || 'lock_all',
        });
      }
      if (q.isPositionLocked) {
        lockedSet.add(q.originalIndex);
      }
    });
  });

  const specialOptionDetails = [...specialMap.values()].sort(
    (a, b) => a.originalIndex - b.originalIndex
  );
  const specialOptionsHandled = specialOptionDetails.length;
  const lockedQuestionsCount = lockedSet.size;

  const passed =
    allCountMatch &&
    allAnswerKeysValid &&
    collisions.length === 0;

  return {
    allCountMatch,
    allAnswerKeysValid,
    collisions,
    specialOptionsHandled,
    specialOptionDetails,
    lockedQuestionsCount,
    passed,
  };
}
