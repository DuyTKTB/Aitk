/* ============================================================
   examShuffle.js — Utility tạo mã đề hoán vị, giữ nhóm độ khó
   Hỗ trợ:
   • Đảo thứ tự câu / đáp án tùy chọn
   • Giữ nhóm độ khó (NB → TH → VD → VDC) hoặc đảo tự do
   • Giữ nhóm câu liên kết (groupId / passageId / đoạn đọc hiểu)
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

/**
 * Phát hiện phương án chứa cụm từ phụ thuộc vị trí như:
 * "Tất cả các đáp án trên", "Cả A và B", "Cả A, B, C",
 * "Cả hai đáp án trên", "Không có đáp án nào trên", "Đáp án A và B", "A và C đúng"...
 */
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

/**
 * Phân tích chi tiết chế độ bảo vệ phương án đặc biệt của câu hỏi:
 * - 'lock_all': Có tham chiếu chữ cái ("Cả A và B đúng") hoặc phương án vị trí nằm giữa → giữ nguyên A/B/C/D.
 * - 'pin_last': Phương án cuối là "Tất cả các đáp án trên" / "Không có đáp án nào đúng" → cố định phương án cuối, đảo các phương án trên.
 * - 'none': Không có phương án đặc biệt.
 */
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
   THUẬT TOÁN ĐẢO ĐỀ NÂNG CAO
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

export function generateShuffledVersions(questions = [], count = 4, options = {}) {
  const {
    salt = 0,
    seedText = '',
    shuffleQuestions = true,
    shuffleOptions = true,
    keepDifficultyGroups = true,
    keepLinkedGroups = true,
    lockedIndices = [],
    smartSpecialOptions = true,
    customCodes = null,
  } = options || {};

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

  const hasAnyLinkedGroup =
    keepLinkedGroups &&
    questions.some((q) => Boolean(q?.groupId || q?.passageId || q?.contextId || q?.readingId));

  const isClassicMode =
    shuffleQuestions &&
    keepDifficultyGroups &&
    lockedSet.size === 0 &&
    !hasAnyLinkedGroup;

  const groups = { nb: [], th: [], vd: [], vdc: [] };
  questions.forEach((q, idx) => {
    const lv = normLevel(q.level);
    groups[lv].push({ q, origIdx: idx });
  });

  return codeList.map((code, codeIdx) => {
    const seed = seedForCode(code, effectiveSalt);
    const prng = mulberry32(seed);

    let orderedWithOrig = [];

    if (isClassicMode) {
      const shuffledByLevel = {};
      ['nb', 'th', 'vd', 'vdc'].forEach((lv) => {
        const group = groups[lv];
        shuffledByLevel[lv] = codeIdx === 0 ? group : shuffleFisherYates(group, prng);
      });
      orderedWithOrig = [
        ...shuffledByLevel.nb,
        ...shuffledByLevel.th,
        ...shuffledByLevel.vd,
        ...shuffledByLevel.vdc,
      ];
    } else if (!shuffleQuestions) {
      orderedWithOrig = questions.map((q, idx) => ({ q, origIdx: idx }));
    } else {
      // Có lockedIndices, hoặc tắt keepDifficultyGroups, hoặc có câu liên kết (groupId)
      const unlockedItems = [];
      questions.forEach((q, idx) => {
        if (!lockedSet.has(idx)) {
          unlockedItems.push({ q, origIdx: idx });
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
          const orderedChunks = codeIdx === 0 ? chunks : shuffleFisherYates(chunks, prng);
          orderedChunks.forEach((chunk) => shuffledUnlocked.push(...chunk));
        });
      } else {
        const chunks = buildChunks(unlockedItems, keepLinkedGroups);
        const orderedChunks = codeIdx === 0 ? chunks : shuffleFisherYates(chunks, prng);
        orderedChunks.forEach((chunk) => shuffledUnlocked.push(...chunk));
      }

      if (lockedSet.size === 0) {
        orderedWithOrig = shuffledUnlocked;
      } else {
        let uPtr = 0;
        orderedWithOrig = questions.map((q, idx) => {
          if (lockedSet.has(idx)) {
            return { q, origIdx: idx };
          }
          return shuffledUnlocked[uPtr++];
        });
      }
    }

    const finalQuestions = orderedWithOrig.map(({ q, origIdx }) => {
      const isLockedPos = lockedSet.has(origIdx);
      if (q.type === 'true_false' || q.type === 'short_answer') {
        const base = { ...q, originalIndex: origIdx + 1, _origQuestion: q };
        if (isLockedPos) base.isPositionLocked = true;
        return base;
      }

      const origOpts = [...(q.options || [])];
      const origCorrectIdx = q.correct ?? 0;
      const correctText = origOpts[origCorrectIdx];

      const qPrng = mulberry32(seed + (origIdx + 1) * 313);
      const optIndices = origOpts.map((_, i) => i);

      const specialInfo = smartSpecialOptions
        ? analyzePositionalOptions(origOpts)
        : { hasSpecial: false, mode: 'none', reason: '' };

      let shuffledOptIndices;
      if (codeIdx === 0 || !shuffleOptions) {
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
      const newCorrect = newOpts.indexOf(correctText);

      const resultQ = {
        ...q,
        options: newOpts,
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
      } else {
        origToNew[origNum] = {
          newNum,
          type,
          isPositionLocked: Boolean(q.isPositionLocked),
        };
        newToOrig[newNum] = {
          origNum,
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
    return { newNum: idx + 1, originalNum: originalIndex, type, letter: '' };
  });
}

/** Mã đề trùng nhau: cùng thứ tự câu VÀ cùng thứ tự đáp án. */
export function findCollisions(versions = []) {
  const seen = new Map();
  const collisions = [];
  versions.forEach((v) => {
    const sig = v.questions
      .map((q) => `${q.originalIndex}:${q.correct ?? ''}:${(q.options || []).join('|')}`)
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

/**
 * Kiểm tra tự động toàn bộ bộ mã đề sau khi đảo:
 * 1. allCountMatch: mọi mã đề đều có đủ originalCount câu (và đủ tập hợp câu gốc).
 * 2. allAnswerKeysValid: mọi câu trắc nghiệm đều có đáp án đúng hợp lệ khớp nội dung đáp án đúng của đề gốc.
 * 3. collisions: danh sách cặp mã đề trùng nhau.
 * 4. specialOptionsHandled: số câu được bảo vệ phương án đặc biệt ("Cả A và B đúng" / "Tất cả các đáp án trên").
 * 5. passed: boolean tổng hợp.
 */
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
