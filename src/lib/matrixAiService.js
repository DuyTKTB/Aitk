/* ============================================================
   matrixAiService.js — Lập ma trận & sinh đề THPT (GDPT 2018 / Bộ GD&ĐT)
   ------------------------------------------------------------
   v5 (nâng cấp THPT, nhanh hơn, chuẩn hơn):
     • CHỈ THPT: lớp 10–12. Nhập lớp 6–9 sẽ bị từ chối rõ ràng.
     • Ma trận do CODE dựng (số câu, phần, mức độ, điểm luôn khớp tổng 10);
       AI chỉ đặt tên dạng bài → phản hồi nhỏ, nhanh, không bao giờ lệch số câu.
     • 3 dạng câu chuẩn thi tốt nghiệp 2025: Trắc nghiệm / Đúng-Sai (4 ý) /
       Trả lời ngắn (đề 28 câu = 18 + 4 + 6).
     • Sinh câu hỏi song song theo từng câu, kết quả hiện dần (onPartial),
       retry chính xác phần thiếu, loại câu trùng, điểm và mức độ theo ma trận.
     • Soát đáp án độc lập: AI giải lại từng câu không nhìn đáp án (verifyQuestionsWithAI).
     • Lệnh nhanh không cần gọi AI: tăng/giảm câu theo mức, xóa câu, đổi đáp án...
   ============================================================ */
import {
  callModel,
  parseJsonLoose,
  normalizeQuestion,
  shuffleOptions,
  rid,
} from './examAiUtils.js';
import { buildFileContext } from './fileReader.js';

export const BLOOM_MAPPING = {
  nb: { vn: 'Nhận biết', en: 'Remembering', desc: 'Nhớ khái niệm, định nghĩa, công thức' },
  th: { vn: 'Thông hiểu', en: 'Understanding', desc: 'Giải thích, phân biệt, suy luận' },
  vd: { vn: 'Vận dụng', en: 'Applying', desc: 'Áp dụng công thức, tính toán một bước' },
  vdc: { vn: 'Vận dụng cao', en: 'Analyzing', desc: 'Tổng hợp, biện luận, nhiều bước' },
};

export function normLevel(str) {
  if (!str) return 'nb';
  const s = String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .trim();
  if (s.includes('cao') || s === 'vdc') return 'vdc';
  if (s.includes('dung') || s === 'vd') return 'vd';
  if (s.includes('hieu') || s === 'th') return 'th';
  if (s.includes('biet') || s === 'nb') return 'nb';
  return 'nb';
}

export const LEVEL_INFO = {
  nb: { code: 'nb', label: 'Nhận biết', short: 'NB', color: 'var(--t-bloom-nb, #22c55e)', bg: 'var(--t-bloom-nb-bg, rgba(34, 197, 94, 0.12))' },
  th: { code: 'th', label: 'Thông hiểu', short: 'TH', color: 'var(--t-bloom-th, #0284c7)', bg: 'var(--t-bloom-th-bg, rgba(2, 132, 199, 0.12))' },
  vd: { code: 'vd', label: 'Vận dụng', short: 'VD', color: 'var(--t-bloom-vd, #d97706)', bg: 'var(--t-bloom-vd-bg, rgba(217, 119, 6, 0.12))' },
  vdc: { code: 'vdc', label: 'Vận dụng cao', short: 'VDC', color: 'var(--t-bloom-vdc, #dc2626)', bg: 'var(--t-bloom-vdc-bg, rgba(220, 38, 38, 0.12))' },
};

const NW = '(?![\\p{L}\\p{N}])';
const PW = '(^|[^\\p{L}\\p{N}])';
const re = (src, flags = 'iu') => new RegExp(src, flags);

export const FORMAT_GDPT = 'Chuẩn GDPT 2018 (Trắc nghiệm + Đúng/Sai + Trả lời ngắn)';
export const FORMAT_GDPT_ADV = 'Chuẩn GDPT 2018 · Phân hóa nâng cao';
export const FORMAT_MCQ = 'Trắc nghiệm 4 lựa chọn';

export function parseExamIntent(text) {
  const empty = { count: null, duration: null, grade: null, invalidGrade: null, topic: '', format: '', preset: false };
  if (!text || typeof text !== 'string') return empty;

  const original = text.normalize('NFC').trim();
  let str = ` ${original} `;
  let count = null;
  let duration = null;
  let grade = null;
  let invalidGrade = null;

  let m = str.match(re(`(\\d{1,3})\\s*(?:phút|phut|ph|p|min|mins|')${NW}`));
  if (m) { duration = parseInt(m[1], 10); str = str.replace(m[0], ' '); }
  else if ((m = str.match(re(`(\\d{1,2})\\s*tiết${NW}`)))) { duration = parseInt(m[1], 10) * 45; str = str.replace(m[0], ' '); }
  else if ((m = str.match(re(`(\\d{1,2})\\s*(?:giờ|gio|h)${NW}`)))) { duration = parseInt(m[1], 10) * 60; str = str.replace(m[0], ' '); }

  m = str.match(re(`(\\d{1,3})\\s*(?:câu|cau|qs?|questions?)${NW}`));
  if (m) { count = parseInt(m[1], 10); str = str.replace(m[0], ' '); }

  /* THPT: chỉ nhận lớp 10–12. Lớp 6–9 → báo ngoài phạm vi. */
  const okGrade = (n) => n >= 10 && n <= 12;
  const lowGrade = (n) => n >= 1 && n <= 9;
  m = str.match(re(`${PW}(?:lớp|lop|khối|khoi|k)\\s*(\\d{1,2})${NW}`));
  if (m) {
    const n = +m[2];
    if (okGrade(n)) { grade = String(n); str = str.replace(m[0], `${m[1]} `); }
    else if (lowGrade(n)) { invalidGrade = n; str = str.replace(m[0], `${m[1]} `); }
  }
  if (!grade && !invalidGrade) {
    m = str.match(re(`${PW}(?:hóa học|hoa hoc|hóa|hoa|học|hoc)\\s*(\\d{1,2})${NW}`));
    if (m && okGrade(+m[2])) { grade = m[2]; str = str.replace(m[0], `${m[1]} `); }
  }
  if (!grade && !invalidGrade) {
    m = str.match(re(`${PW}(1[0-2])${NW}`));
    if (m) { grade = m[2]; str = str.replace(m[0], `${m[1]} `); }
  }

  const wantsGdpt = /gdpt|2018|2025|đúng sai|đúng\/sai|trả lời ngắn|chuẩn|thptqg|thpt quốc gia|tốt nghiệp|thi thử/i.test(original);
  const wantsAdv = /phân hóa|nâng cao|vận dụng cao|chuyên/i.test(original);
  let format = '';
  if (wantsGdpt && wantsAdv) format = FORMAT_GDPT_ADV;
  else if (wantsGdpt) format = FORMAT_GDPT;
  else if (wantsAdv) format = 'Phân hóa nâng cao';
  else if (/trắc nghiệm|4 lựa chọn/i.test(original)) format = FORMAT_MCQ;

  let preset = false;
  if (/thptqg|thpt quốc gia|tốt nghiệp|thi thử/i.test(original) && !count && !duration) {
    count = 28; duration = 50; preset = true;
    if (!grade && !invalidGrade) grade = '12';
  }

  const noise = '(?:tốt nghiệp|thpt quốc gia|quốc gia|thpt|đề kiểm tra|bài kiểm tra|đề thi thử|đề thi|đề ôn tập|đề ôn|đề|phiếu bài tập|kiểm tra|ra đề|tạo đề|soạn đề|tạo|soạn|giúp tôi|giúp|cho tôi|hãy|môn hóa|thi thử|thptqg|chuẩn bộ gd&đt|chuẩn|phân hóa sâu|phân hóa|nâng cao|gồm|có|về|chủ đề|bài|của|môn)';
  let topic = str
    .replace(re(`${PW}${noise}${NW}`, 'giu'), '$1 ')
    .replace(re(`${PW}${noise}${NW}`, 'giu'), '$1 ')
    .replace(/\b(19|20)\d{2}\b/g, ' ')
    .replace(/[,;:·|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (topic.length < 2 || /^(hóa học|hóa|môn hóa học)$/i.test(topic)) topic = '';
  else topic = topic.charAt(0).toUpperCase() + topic.slice(1);

  return { count, duration, grade, invalidGrade, topic, format, preset };
}

export function inferExamShape({ count = null, duration = null } = {}) {
  let c = count;
  let d = duration;
  let inferred = false;
  if (c && !d) {
    d = c <= 10 ? 15 : c <= 15 ? 25 : c <= 20 ? 45 : c <= 28 ? 50 : 90;
    inferred = true;
  } else if (d && !c) {
    c = d <= 15 ? 10 : d <= 25 ? 15 : d <= 45 ? 20 : d <= 50 ? 28 : d <= 60 ? 30 : 40;
    inferred = true;
  }
  return { count: c, duration: d, inferred };
}

/** Định dạng gợi ý khi giáo viên không nói rõ: đề dài → cấu trúc 3 phần chuẩn thi; đề ngắn → trắc nghiệm. */
export function suggestFormat(count) {
  return Number(count) >= 24 ? FORMAT_GDPT : FORMAT_MCQ;
}

/* Lệnh theo số câu: "viết lại câu 3", "đổi phương án nhiễu câu 2" — cần gọi AI */
export function parseQuestionCommand(text, total = 0) {
  if (!text || !total) return null;
  const m = text.match(re(`${PW}câu\\s*(?:số\\s*)?(\\d{1,3})${NW}`));
  if (!m) return null;
  const n = parseInt(m[2], 10);
  if (n < 1 || n > total) return null;
  const kind = /nhiễu|phương án sai|đáp án sai|distractor/i.test(text) ? 'distractors' : 'rewrite';
  return { index: n - 1, kind };
}

/* Lệnh cục bộ — xử lý TỨC THÌ, không gọi AI */
export function parseLocalCommand(text, total = 0) {
  if (!text || !total) return null;
  const t = text.normalize('NFC').trim();

  let m = t.match(re(`(?:xóa|xoá|bỏ|loại)\\s*câu\\s*(?:số\\s*)?(\\d{1,3})${NW}`));
  if (m) {
    const n = parseInt(m[1], 10);
    return n >= 1 && n <= total ? { type: 'delete', index: n - 1 } : { type: 'outOfRange', n };
  }

  m = t.match(re(`câu\\s*(?:số\\s*)?(\\d{1,3}).*?(?:đáp án|dap an)\\s*(?:đúng\\s*)?(?:là|thành|:|=)?\\s*([A-D])${NW}`));
  if (!m) {
    const m2 = t.match(re(`(?:đáp án|dap an)\\s*(?:đúng\\s*)?(?:là|thành)\\s*([A-D])${NW}.*?câu\\s*(?:số\\s*)?(\\d{1,3})${NW}`));
    if (m2) m = [m2[0], m2[2], m2[1]];
  }
  if (m) {
    const n = parseInt(m[1], 10);
    if (n < 1 || n > total) return { type: 'outOfRange', n };
    return { type: 'setCorrect', index: n - 1, option: 'ABCD'.indexOf(m[2].toUpperCase()) };
  }

  if (/kiểm tra (?:lại )?đáp án|soát (?:lại )?đáp án|kiểm tra lại|soát lại|xác minh đáp án/i.test(t)) return { type: 'verify' };
  if (/lưu (?:tất cả )?(?:vào )?ngân hàng/i.test(t)) return { type: 'bank' };
  if (/xuất bản|chuyển sang thủ công|đưa vào lớp|giao cho lớp/i.test(t)) return { type: 'publish' };
  if (/mô phỏng|làm thử|thi thử đề/i.test(t)) return { type: 'tab', tab: 'sim' };
  if (/in a4|in đề|bản in/i.test(t)) return { type: 'tab', tab: 'print' };
  if (/đảo mã|trộn đề|đảo đề|mã đề/i.test(t)) return { type: 'tab', tab: 'shuffle' };
  if (/xem ma trận|mở ma trận/i.test(t)) return { type: 'tab', tab: 'matrix' };
  if (/xem câu hỏi|danh sách câu/i.test(t)) return { type: 'tab', tab: 'questions' };
  return null;
}

const LEVEL_KEYS = ['nb', 'th', 'vd', 'vdc'];

/* Kích thước lô theo dạng câu (nhỏ → nhanh, song song nhiều lô) */
const BATCH_SIZE = { single_choice: 3, true_false: 2, short_answer: 3 };
const GEN_CONCURRENCY = 6;
const MAX_RETRY = 2;

export function emptyLevel() {
  return { count: 0, points: 0 };
}

function asLevel(v) {
  const count = Math.max(0, Math.round(Number(v?.count) || 0));
  const points = Math.max(0, Number(v?.points) || 0);
  return { count, points: Math.round(points * 100) / 100 };
}

export function summarizeMatrix(matrix) {
  const summary = {
    nb: emptyLevel(),
    th: emptyLevel(),
    vd: emptyLevel(),
    vdc: emptyLevel(),
    total: emptyLevel(),
  };
  (matrix.parts || []).forEach((p) => {
    (p.topics || []).forEach((t) => {
      LEVEL_KEYS.forEach((k) => {
        const lv = asLevel(t[k]);
        t[k] = lv;
        summary[k].count += lv.count;
        summary[k].points = Math.round((summary[k].points + lv.points) * 100) / 100;
      });
    });
  });
  summary.total.count = LEVEL_KEYS.reduce((a, k) => a + summary[k].count, 0);
  summary.total.points = Math.round(LEVEL_KEYS.reduce((a, k) => a + summary[k].points, 0) * 100) / 100 || 10;
  return summary;
}

/* Giữ lại để tương thích — co/giãn ma trận về đúng số câu (đã không còn dùng trong luồng chính) */
export function scaleMatrixToCount(matrix, targetCount) {
  const n = Math.max(4, Math.min(60, Number(targetCount) || 10));
  const summary = summarizeMatrix(matrix);
  const current = summary.total.count || 1;
  if (current === n) {
    matrix.summary = summary;
    matrix.totalQuestions = n;
    return matrix;
  }
  const cells = [];
  (matrix.parts || []).forEach((part, pi) => {
    (part.topics || []).forEach((top, ti) => {
      LEVEL_KEYS.forEach((k) => {
        const c = top[k]?.count || 0;
        if (c > 0) cells.push({ pi, ti, k, count: c });
      });
    });
  });
  if (!cells.length) {
    matrix.summary = summary;
    matrix.totalQuestions = n;
    return matrix;
  }
  const scaled = cells.map((c) => ({ ...c, count: Math.max(0, Math.round((c.count / current) * n)) }));
  let diff = n - scaled.reduce((a, c) => a + c.count, 0);
  for (let i = 0; diff !== 0 && i < 400; i++) {
    const cell = scaled[i % scaled.length];
    if (diff > 0) { cell.count += 1; diff -= 1; }
    else if (cell.count > 0) { cell.count -= 1; diff += 1; }
  }
  (matrix.parts || []).forEach((part) => {
    (part.topics || []).forEach((top) => {
      LEVEL_KEYS.forEach((k) => { top[k] = { count: 0, points: 0 }; });
    });
  });
  scaled.forEach((c) => {
    const top = matrix.parts[c.pi]?.topics?.[c.ti];
    if (top) top[c.k] = { count: c.count, points: 0 };
  });
  matrix.totalQuestions = n;
  return normalizePoints(matrix);
}

export function flattenMatrixSpecs(matrix) {
  const specs = [];
  (matrix.parts || []).forEach((part) => {
    const type = PART_TYPE[part.format] || 'single_choice';
    (part.topics || []).forEach((top) => {
      LEVEL_KEYS.forEach((lvl) => {
        const count = top[lvl]?.count || 0;
        const pts = Number(top[lvl]?.points) || 0;
        const each = count && pts ? Math.round((pts / count) * 100) / 100 : 0.25;
        for (let i = 0; i < count; i++) {
          specs.push({
            part: part.partName,
            format: part.format || 'multiple_choice',
            type,
            topic: top.name,
            levelKey: lvl,
            level: BLOOM_MAPPING[lvl].vn,
            points: each,
          });
        }
      });
    });
  });
  return specs;
}

function intentLabel(intent) {
  if (intent === 'sheet') return 'phiếu bài tập luyện tập (nhiều câu nhận biết/thông hiểu, số liệu đơn)';
  if (intent === 'lecture') return 'câu hỏi kiểm tra ngay sau bài giảng (ngắn, bám đúng nội dung vừa dạy)';
  return 'đề kiểm tra/thi (phân hóa, có câu vận dụng cao)';
}

export const THPT_GRADES = ['10', '11', '12'];
export const isGdptFormat = (f = '') => /gdpt/i.test(String(f));
const isAdvancedFormat = (f = '') => /phân hóa|nâng cao|sâu/i.test(String(f));

export const PART_TYPE = {
  multiple_choice: 'single_choice',
  true_false: 'true_false',
  short_answer: 'short_answer',
};
const PART_LABEL = {
  multiple_choice: 'Trắc nghiệm nhiều lựa chọn',
  true_false: 'Trắc nghiệm đúng/sai',
  short_answer: 'Trả lời ngắn',
};
/* Trọng số điểm: 1 câu Đúng/Sai (tối đa) = 4 lần 1 câu trắc nghiệm / trả lời ngắn (đề 18-4-6 → 0,25 / 1 / 0,25) */
const PART_WEIGHT = { multiple_choice: 1, true_false: 4, short_answer: 1 };
const ROMAN = ['I', 'II', 'III', 'IV'];

export function gdptSplit(n) {
  if (n === 28) return { p1: 18, p2: 4, p3: 6 };
  const p2 = Math.max(1, Math.round((n * 4) / 28));
  const p3 = Math.max(1, Math.round((n * 6) / 28));
  const p1 = Math.max(1, n - p2 - p3);
  return { p1, p2, p3 };
}

function distribute(total, weights) {
  const raw = LEVEL_KEYS.map((k) => total * (weights[k] || 0));
  const out = raw.map((x) => Math.floor(x));
  let rem = total - out.reduce((a, b) => a + b, 0);
  const order = raw
    .map((x, i) => ({ i, f: x - Math.floor(x) }))
    .filter((o) => (weights[LEVEL_KEYS[o.i]] || 0) > 0)
    .sort((a, b) => b.f - a.f);
  for (let j = 0, guard = 0; rem > 0 && order.length && guard < 200; j = (j + 1) % order.length, guard++) {
    out[order[j].i] += 1;
    rem -= 1;
  }
  return { nb: out[0], th: out[1], vd: out[2], vdc: out[3] };
}

function levelWeights(intent, advanced) {
  if (advanced) return { nb: 0.15, th: 0.25, vd: 0.35, vdc: 0.25 };
  if (intent === 'sheet') return { nb: 0.35, th: 0.35, vd: 0.25, vdc: 0.05 };
  if (intent === 'lecture') return { nb: 0.4, th: 0.4, vd: 0.2, vdc: 0 };
  return { nb: 0.25, th: 0.3, vd: 0.3, vdc: 0.15 };
}

function partWeights(partFormat, advanced) {
  if (partFormat === 'true_false') {
    return advanced ? { nb: 0, th: 0, vd: 0.5, vdc: 0.5 } : { nb: 0, th: 0.25, vd: 0.5, vdc: 0.25 };
  }
  if (partFormat === 'short_answer') {
    return advanced ? { nb: 0, th: 0, vd: 0.4, vdc: 0.6 } : { nb: 0, th: 0.15, vd: 0.5, vdc: 0.35 };
  }
  return advanced
    ? { nb: 0.2, th: 0.3, vd: 0.35, vdc: 0.15 }
    : { nb: 0.4, th: 0.35, vd: 0.25, vdc: 0 };
}

export function buildSlots({ count = 10, format = '', intent = 'exam' } = {}) {
  const n = Math.max(4, Math.min(60, Number(count) || 10));
  const advanced = isAdvancedFormat(format);
  const gdpt = isGdptFormat(format);
  const parts = [];
  if (gdpt) {
    const s = gdptSplit(n);
    parts.push({ format: 'multiple_choice', n: s.p1 }, { format: 'true_false', n: s.p2 }, { format: 'short_answer', n: s.p3 });
  } else {
    parts.push({ format: 'multiple_choice', n });
  }
  const slots = [];
  parts.forEach((p, pi) => {
    const w = gdpt ? partWeights(p.format, advanced) : levelWeights(intent, advanced);
    const d = distribute(p.n, w);
    LEVEL_KEYS.forEach((k) => {
      for (let i = 0; i < d[k]; i++) slots.push({ partIndex: pi, partFormat: p.format, levelKey: k });
    });
  });
  return { slots, parts, n };
}

/** Tính lại điểm từng ô theo trọng số dạng câu, tổng luôn = 10. */
export function normalizePoints(matrix) {
  let units = 0;
  (matrix.parts || []).forEach((p) => {
    const w = PART_WEIGHT[p.format] || 1;
    (p.topics || []).forEach((t) => LEVEL_KEYS.forEach((k) => { units += (Number(t[k]?.count) || 0) * w; }));
  });
  if (!units) return matrix;
  const unit = 10 / units;
  (matrix.parts || []).forEach((p) => {
    const w = PART_WEIGHT[p.format] || 1;
    (p.topics || []).forEach((t) => LEVEL_KEYS.forEach((k) => {
      const c = Math.max(0, Math.round(Number(t[k]?.count) || 0));
      t[k] = { count: c, points: Math.round(c * w * unit * 100) / 100 };
    }));
  });
  /* bù chênh lệch làm tròn vào ô lớn nhất để tổng đúng 10,00 */
  let sum = 0;
  let big = null;
  (matrix.parts || []).forEach((p) => (p.topics || []).forEach((t) => LEVEL_KEYS.forEach((k) => {
    sum += t[k].points;
    if (t[k].count > 0 && (!big || t[k].count > big.count)) big = t[k];
  })));
  if (big) big.points = Math.round((big.points + (10 - sum)) * 100) / 100;
  matrix.totalPoints = 10;
  matrix.summary = summarizeMatrix(matrix);
  return matrix;
}

function fallbackTopicName(topic, levelKey) {
  const t = topic || 'Kiến thức trọng tâm';
  if (levelKey === 'nb') return `Nhận biết khái niệm, tính chất — ${t}`;
  if (levelKey === 'th') return `Thông hiểu: giải thích, so sánh — ${t}`;
  if (levelKey === 'vd') return `Vận dụng: tính toán, áp dụng công thức — ${t}`;
  return `Vận dụng cao: bài toán tổng hợp — ${t}`;
}

function buildMatrixFromSlots({ slots, parts, names, meta }) {
  const matrixParts = parts.map((p, pi) => ({
    partName: `Phần ${ROMAN[pi]}: ${PART_LABEL[p.format]}`,
    format: p.format,
    topics: [],
  }));
  slots.forEach((s, i) => {
    const name = String(names[i] || '').trim().slice(0, 140) || fallbackTopicName(meta.topic, s.levelKey);
    const part = matrixParts[s.partIndex];
    let row = part.topics.find((t) => t.name === name);
    if (!row) {
      row = { name, nb: emptyLevel(), th: emptyLevel(), vd: emptyLevel(), vdc: emptyLevel() };
      part.topics.push(row);
    }
    row[s.levelKey].count += 1;
  });
  const matrix = {
    title: meta.title,
    subject: meta.subject,
    grade: meta.grade,
    duration: meta.duration,
    totalPoints: 10,
    totalQuestions: slots.length,
    source: meta.source,
    parts: matrixParts,
    aiPedagogicalAdvice: meta.advice,
    focusSkills: meta.focusSkills || [],
  };
  return normalizePoints(matrix);
}

const PLAN_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    topics: { type: 'array', items: { type: 'string' } },
    aiPedagogicalAdvice: { type: 'string' },
    focusSkills: { type: 'array', items: { type: 'string' } },
  },
  required: ['topics'],
};

export async function planMatrixWithAI({
  topic,
  grade,
  subject = 'Hóa học',
  count = 10,
  duration = 30,
  format = '',
  intent = 'exam',
  customPrompt = '',
  classInsights = '',
  files = [],
  signal,
} = {}) {
  const g = String(grade || '12');
  if (!THPT_GRADES.includes(g)) {
    throw new Error('Công cụ này chỉ hỗ trợ THPT (lớp 10, 11, 12).');
  }
  const { slots, parts, n } = buildSlots({ count, format, intent });
  const { textParts, imageParts, pdfParts } = buildFileContext(files || []);
  const cleanTopic = topic || 'Kiến thức trọng tâm';

  const slotLines = slots
    .map((s, i) => `${i + 1}. Phần ${ROMAN[s.partIndex]} · ${PART_LABEL[s.partFormat]} · mức ${BLOOM_MAPPING[s.levelKey].vn}`)
    .join('\n');

  const system = `Bạn là chuyên gia khảo thí môn ${subject} THPT, lớp ${g}, chương trình GDPT 2018 và cấu trúc đề thi tốt nghiệp THPT 2025.
Cấu trúc đề (số câu, phần, mức độ) đã được hệ thống CỐ ĐỊNH — bạn KHÔNG được thay đổi.
Nhiệm vụ: đặt TÊN DẠNG BÀI cụ thể cho từng ô, đúng thứ tự.

Quy tắc:
- Trả về đúng ${n} phần tử trong "topics", phần tử thứ i ứng với ô thứ i.
- Mỗi tên ≤ 90 ký tự, cụ thể (ghi rõ công thức / định luật / loại phản ứng), KHÔNG chung chung kiểu "kiến thức trọng tâm".
- Đúng mức độ: Nhận biết = nhớ khái niệm, tính chất, danh pháp; Thông hiểu = giải thích, so sánh, nhận ra hiện tượng; Vận dụng = tính toán 1–2 bước, áp dụng công thức; Vận dụng cao = tổng hợp, biện luận, nhiều bước, bài toán thực tiễn.
- Phần đúng/sai: dạng bài là một tình huống/thí nghiệm có thể đặt 4 nhận định. Phần trả lời ngắn: dạng tính toán cho ra một số.
- Bao phủ toàn bộ chủ đề, hạn chế trùng lặp; không ra ngoài chương trình lớp ${g}.
${classInsights ? '- Ưu tiên đào sâu các điểm yếu của lớp được cung cấp.' : ''}

Chỉ trả JSON: {"title":"Tên đề ngắn gọn","topics":["..."],"aiPedagogicalAdvice":"2–3 câu: vì sao phân bổ như vậy, tiết tới nên nhấn gì","focusSkills":["kỹ năng 1","kỹ năng 2"]}`;

  const user = [
    `Chủ đề: ${cleanTopic}. Lớp ${g}. ${n} câu, ${duration} phút. Loại: ${intentLabel(intent)}.`,
    customPrompt ? `Yêu cầu thêm của giáo viên: ${customPrompt}` : '',
    classInsights ? `Phân tích lớp:\n${String(classInsights).slice(0, 800)}` : '',
    `DANH SÁCH Ô CẦN ĐẶT TÊN:\n${slotLines}`,
    textParts.length ? `Tài liệu tham khảo:\n${textParts.join('\n\n').slice(0, 2500)}` : '',
  ].filter(Boolean).join('\n\n');

  const meta = {
    topic: cleanTopic,
    subject,
    grade: g,
    duration,
    title: `Đề ${cleanTopic} — ${subject} lớp ${g}`,
    advice: `Đã lập ${n} câu / ${duration} phút cho "${cleanTopic}" lớp ${g}, phân bổ 4 mức nhận thức theo chuẩn khảo thí. Xem bảng bên phải rồi xác nhận để sinh câu hỏi.`,
    focusSkills: [],
    source: 'ai',
  };

  try {
    const raw = await callModel({
      system,
      parts: [...imageParts, ...pdfParts, { text: user }],
      temperature: 0.3,
      signal,
      schema: PLAN_SCHEMA,
    });
    const data = parseJsonLoose(raw);
    const names = (Array.isArray(data?.topics) ? data.topics : [])
      .map((x) => (typeof x === 'string' ? x : x?.name || ''));
    if (names.filter(Boolean).length >= Math.ceil(n * 0.5)) {
      meta.title = String(data.title || '').trim() || meta.title;
      if (data.aiPedagogicalAdvice) meta.advice = String(data.aiPedagogicalAdvice).trim();
      meta.focusSkills = Array.isArray(data.focusSkills) ? data.focusSkills.slice(0, 5) : [];
      return buildMatrixFromSlots({ slots, parts, names, meta });
    }
    console.warn('[matrix] AI trả quá ít tên dạng bài, dùng khung dự phòng.');
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    console.warn('[matrix] AI plan failed, fallback:', err);
  }

  meta.source = 'fallback';
  meta.advice = `${meta.advice} (Khung dự phòng — AI chưa đặt được tên dạng bài chi tiết, thầy/cô có thể nhờ AI chỉnh lại.)`;
  return buildMatrixFromSlots({ slots, parts, names: [], meta });
}

/* Tương thích ngược: khung ma trận không cần AI */
export function buildFallbackMatrix({ topic = 'Kiến thức trọng tâm', grade = '12', subject = 'Hóa học', count = 10, duration = 30, intent = 'exam', format = '' } = {}) {
  const { slots, parts, n } = buildSlots({ count, format: format || suggestFormat(count), intent });
  return buildMatrixFromSlots({
    slots,
    parts,
    names: [],
    meta: {
      topic,
      subject,
      grade,
      duration,
      title: `Đề ${topic} — ${subject} lớp ${grade}`,
      advice: `Khung ${n} câu / ${duration} phút cho "${topic}" lớp ${grade}.`,
      focusSkills: [],
      source: 'fallback',
    },
  });
}

/* ============================================================
   CHỈNH MA TRẬN — AI chỉ đề xuất, CODE ép đúng số câu từng phần
   ============================================================ */
function repairMatrix(data, base, targets) {
  const out = { ...base, ...data, parts: [] };
  base.parts.forEach((bp) => {
    const dp = (data.parts || []).find((p) => p.format === bp.format) || null;
    const topics = (dp?.topics || [])
      .map((t) => ({
        name: String(t?.name || '').trim().slice(0, 140),
        nb: asLevel(t?.nb), th: asLevel(t?.th), vd: asLevel(t?.vd), vdc: asLevel(t?.vdc),
      }))
      .filter((t) => t.name && LEVEL_KEYS.some((k) => t[k].count > 0));
    const part = { partName: bp.partName, format: bp.format, topics: topics.length ? topics : JSON.parse(JSON.stringify(bp.topics)) };
    const target = targets[bp.format];
    const total = () => part.topics.reduce((a, t) => a + LEVEL_KEYS.reduce((s, k) => s + t[k].count, 0), 0);
    let diff = target - total();
    let guard = 0;
    while (diff !== 0 && guard++ < 500) {
      if (diff > 0) {
        const t = part.topics[guard % part.topics.length];
        const k = bp.format === 'multiple_choice' ? 'th' : 'vd';
        t[k].count += 1;
        diff -= 1;
      } else {
        let best = null;
        part.topics.forEach((t) => LEVEL_KEYS.forEach((k) => {
          if (t[k].count > 0 && (!best || t[k].count > best.t[k].count)) best = { t, k };
        }));
        if (!best) break;
        best.t[best.k].count -= 1;
        diff += 1;
      }
    }
    part.topics = part.topics.filter((t) => LEVEL_KEYS.some((k) => t[k].count > 0));
    out.parts.push(part);
  });
  out.totalQuestions = Object.values(targets).reduce((a, b) => a + b, 0);
  return normalizePoints(out);
}

export async function refineMatrixWithAI({ matrix, instruction, classInsights = '', signal } = {}) {
  if (!matrix) throw new Error('Chưa có ma trận để chỉnh.');
  const curTargets = {};
  (matrix.parts || []).forEach((p) => {
    curTargets[p.format] = (p.topics || []).reduce((a, t) => a + LEVEL_KEYS.reduce((s, k) => s + (t[k]?.count || 0), 0), 0);
  });
  const curTotal = Object.values(curTargets).reduce((a, b) => a + b, 0) || 10;

  /* Nếu giáo viên đổi tổng số câu → tính lại số câu từng phần bằng code */
  const wanted = parseExamIntent(instruction || '').count;
  let targets = { ...curTargets };
  if (wanted && wanted !== curTotal && wanted >= 4 && wanted <= 60) {
    if (curTargets.true_false != null) {
      const s = gdptSplit(wanted);
      targets = { multiple_choice: s.p1, true_false: s.p2, short_answer: s.p3 };
    } else {
      targets = { multiple_choice: wanted };
    }
  }
  const newTotal = Object.values(targets).reduce((a, b) => a + b, 0);

  const system = `Bạn chỉnh MA TRẬN đề thi THPT (lớp ${matrix.grade}) theo yêu cầu giáo viên.
Giữ nguyên các phần (format) và cấu trúc JSON. Số câu mỗi phần mục tiêu: ${JSON.stringify(targets)} (hệ thống sẽ tự cân lại nếu lệch).
Mỗi dòng topics là DẠNG BÀI cụ thể; chỉ có count (không cần points). Chỉ lớp 10–12.
Chỉ trả JSON: {"title":"...","parts":[{"format":"multiple_choice|true_false|short_answer","topics":[{"name":"...","nb":{"count":0},"th":{"count":0},"vd":{"count":0},"vdc":{"count":0}}]}],"aiPedagogicalAdvice":"2–3 câu"}`;
  const compact = (matrix.parts || []).map((p) => ({
    format: p.format,
    topics: (p.topics || []).map((t) => ({
      name: t.name,
      nb: { count: t.nb?.count || 0 }, th: { count: t.th?.count || 0 },
      vd: { count: t.vd?.count || 0 }, vdc: { count: t.vdc?.count || 0 },
    })),
  }));
  const raw = await callModel({
    system,
    parts: [{ text: `Yêu cầu: ${instruction}\n${classInsights ? `Dữ liệu lớp:\n${String(classInsights).slice(0, 800)}\n` : ''}Ma trận hiện tại:\n${JSON.stringify({ title: matrix.title, parts: compact })}` }],
    temperature: 0.3,
    signal,
  });
  const data = parseJsonLoose(raw);
  if (!data?.parts) throw new Error('AI không trả về ma trận hợp lệ.');
  /* nếu đổi tổng số câu mà AI không theo kịp, repair vẫn ép đúng */
  const fixed = repairMatrix(data, matrix, targets);
  fixed.title = String(data.title || matrix.title);
  fixed.aiPedagogicalAdvice = String(data.aiPedagogicalAdvice || matrix.aiPedagogicalAdvice || '');
  fixed.subject = matrix.subject;
  fixed.grade = matrix.grade;
  fixed.duration = matrix.duration;
  fixed.focusSkills = matrix.focusSkills || [];
  fixed.source = 'ai';
  fixed.totalQuestions = newTotal;
  return fixed;
}

/* ============================================================
   SINH CÂU HỎI — song song, theo từng dạng, theo dõi đúng vị trí
   ============================================================ */
const clean = (s) => String(s ?? '').trim();
const listFromPayload = (p) => (Array.isArray(p) ? p : Array.isArray(p?.questions) ? p.questions : []);

const GEN_SCHEMA = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          q: { type: 'string' },
          options: { type: 'array', items: { type: 'string' } },
          statements: {
            type: 'array',
            items: {
              type: 'object',
              properties: { text: { type: 'string' }, answer: { type: 'boolean' } },
              required: ['text', 'answer'],
            },
          },
          work: { type: 'string' },
          correct: { type: 'number' },
          answer: { type: 'string' },
          explain: { type: 'string' },
        },
        required: ['q'],
      },
    },
  },
  required: ['questions'],
};

const CHEM_RULES = `HẰNG SỐ DÙNG THỐNG NHẤT: H=1; C=12; N=14; O=16; Na=23; Mg=24; Al=27; P=31; S=32; Cl=35,5; K=39; Ca=40; Fe=56; Cu=64; Zn=65; Br=80; Ag=108; Ba=137. Thể tích mol khí ở điều kiện chuẩn (25 °C, 1 bar) = 24,79 L/mol. Số Avogadro 6,022.10^23.`;

function typeRules(type) {
  if (type === 'true_false') {
    return `DẠNG ĐÚNG/SAI (thi tốt nghiệp THPT 2025): mỗi câu gồm 1 đoạn dẫn (tình huống/thí nghiệm/số liệu) trong "q" và ĐÚNG 4 nhận định trong "statements" (a, b, c, d) với "answer" true/false.
- 4 nhận định phải độc lập, không suy ra lẫn nhau; xếp từ dễ → khó; nên có cả đúng lẫn sai (tránh cả 4 cùng đáp án).
- Không đánh số a), b) trong "text". "explain" giải thích từng ý theo thứ tự, ngắn gọn.
- Không dùng "options"/"correct".`;
  }
  if (type === 'short_answer') {
    return `DẠNG TRẢ LỜI NGẮN (thi tốt nghiệp THPT 2025): đáp án là MỘT SỐ (thập phân dùng dấu phẩy), tối đa 4 ký tự.
- Đề phải nói rõ yêu cầu làm tròn (vd "làm tròn đến hàng phần mười") và đơn vị cần tính.
- "answer" chỉ chứa số, vd "12,5" hoặc "4". Không kèm đơn vị. "work" là bản giải nháp ngắn; số liệu phải khớp đáp án.
- Không dùng "options"/"correct".`;
  }
  return `DẠNG TRẮC NGHIỆM 4 LỰA CHỌN: "options" có ĐÚNG 4 phương án KHÁC NHAU (không ghi A./B. ở đầu), đúng 1 đáp án; "correct" là số nguyên 0–3.
- Phương án nhiễu là sai lầm thật của học sinh (nhầm công thức, quên đổi đơn vị, nhầm tỉ lệ mol).
- "work": giải nháp ≤ 200 ký tự cho câu tính toán; số liệu phải khớp đáp án. Lời giải không nhắc A/B/C/D.`;
}

function buildSystem(type, subject, grade) {
  return `Bạn là giáo viên ${subject} THPT giàu kinh nghiệm, ra đề lớp ${grade} theo chương trình GDPT 2018 và định dạng đề thi tốt nghiệp THPT 2025.
${typeRules(type)}

QUY TẮC CHUNG:
1. Trả JSON {"questions":[...]} đúng số phần tử yêu cầu; mỗi phần tử là MỘT câu riêng, không gộp.
2. TUYỆT ĐỐI không chèn tiêu đề "PHẦN I/II/III" hay "Câu 1:" vào nội dung.
3. Đúng chương trình lớp ${grade}, đúng mức độ nhận thức được chỉ định, kiến thức hóa học chính xác tuyệt đối.
4. Các câu trong cùng lô dùng chất/số liệu/ngữ cảnh khác nhau.
5. Công thức/phương trình dùng LaTeX trong $...$, ví dụ $\\\\ce{2H2 + O2 -> 2H2O}$, $\\\\frac{a}{b}$ (trong JSON viết hai dấu gạch chéo ngược).
6. ${CHEM_RULES}`;
}

function toBool(v) {
  if (typeof v === 'boolean') return v;
  const s = String(v ?? '').toLowerCase().trim();
  if (['true', 'đúng', 'dung', 'đ', 'd', '1', 'yes'].includes(s)) return true;
  if (['false', 'sai', 's', '0', 'no'].includes(s)) return false;
  return null;
}

function numFromText(s) {
  const t = String(s ?? '').replace(/\s/g, '').replace(/,/g, '.').replace(/[^0-9eE+\-.]/g, '');
  const v = parseFloat(t);
  return Number.isFinite(v) ? v : null;
}

function bad(qText) {
  const m = qText.match(/(?:^|\n)\s*(PHẦN\s+[IVX]+|CÂU\s+HỎI\s+TRẮC)/i);
  return !!(m && m.index > 30);
}

function carry(sp) {
  return { points: sp.points, topic: sp.topic, level: sp.level, levelKey: sp.levelKey, part: sp.part };
}

function buildMC(raw, sp, { shuffle = true } = {}) {
  const options = (Array.isArray(raw.options) ? raw.options : []).map((o) => clean(o).replace(/^[A-Da-d][.)]\s+/, ''));
  if (options.length !== 4 || options.some((o) => !o)) return null;
  if (new Set(options.map((o) => o.toLowerCase())).size < 4) return null;
  let correct = raw.correct;
  if (typeof correct === 'string') correct = 'ABCD'.indexOf(correct.trim().toUpperCase()[0]);
  correct = Number(correct);
  if (!Number.isInteger(correct) || correct < 0 || correct > 3) return null;
  const qText = clean(raw.q);
  if (!qText || bad(qText)) return null;
  let q = normalizeQuestion({ ...raw, q: qText, options, correct, ...carry(sp) });
  if (shuffle) q = shuffleOptions(q);
  return { ...q, ...carry(sp), type: 'single_choice', id: q.id || rid() };
}

function buildTF(raw, sp) {
  const qText = clean(raw.q);
  if (!qText || bad(qText)) return null;
  const st = (Array.isArray(raw.statements) ? raw.statements : [])
    .map((s) => ({ text: clean(s?.text).replace(/^[a-dA-D][.)]\s+/, ''), answer: toBool(s?.answer) }))
    .filter((s) => s.text && s.answer !== null);
  if (st.length < 4) return null;
  return {
    id: rid(),
    type: 'true_false',
    q: qText,
    statements: st.slice(0, 4),
    explain: clean(raw.explain),
    ...carry(sp),
  };
}

function buildSA(raw, sp) {
  const qText = clean(raw.q);
  if (!qText || bad(qText)) return null;
  const ans = clean(raw.answer ?? raw.correct).replace(/\s/g, '');
  const v = numFromText(ans);
  if (!ans || v === null || ans.length > 8) return null;
  const vi = ans.replace('.', ',');
  const en = ans.replace(',', '.');
  return {
    id: rid(),
    type: 'short_answer',
    q: qText,
    answer: vi,
    accepted: [...new Set([vi, en])],
    explain: clean(raw.explain),
    work: clean(raw.work).slice(0, 300),
    ...carry(sp),
  };
}

function buildByType(raw, sp, opts) {
  if (!raw || typeof raw !== 'object') return null;
  if (sp.type === 'true_false') return buildTF(raw, sp);
  if (sp.type === 'short_answer') return buildSA(raw, sp);
  return buildMC(raw, sp, opts);
}

const dupKey = (q) => clean(q.q).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').slice(0, 90);

async function pool(tasks, limit) {
  let next = 0;
  const worker = async () => {
    while (next < tasks.length) {
      const i = next++;
      await tasks[i]();
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
}

function chunkByType(specs, indexes, sizeOf) {
  const batches = [];
  let cur = [];
  indexes.forEach((i) => {
    const t = specs[i].type;
    if (cur.length && (specs[cur[0]].type !== t || cur.length >= sizeOf(t))) { batches.push(cur); cur = []; }
    cur.push(i);
  });
  if (cur.length) batches.push(cur);
  return batches;
}

export async function generateQuestionsFromApprovedMatrix({
  matrix,
  files = [],
  classInsights = '',
  onProgress,
  onPartial,
  signal,
} = {}) {
  const subject = matrix.subject || 'Hóa học';
  const grade = String(matrix.grade || '12');
  if (!THPT_GRADES.includes(grade)) throw new Error('Chỉ hỗ trợ THPT (lớp 10, 11, 12).');
  const specs = flattenMatrixSpecs(matrix);
  if (!specs.length) throw new Error('Ma trận chưa có ô câu hỏi nào.');

  const { textParts, imageParts, pdfParts } = buildFileContext(files || []);
  const refText = textParts.length
    ? `Tài liệu tham khảo (chỉ để bám nội dung, KHÔNG chép nguyên vào câu hỏi):\n${textParts.join('\n').slice(0, 1800)}`
    : '';
  const systems = {};
  const sysOf = (t) => (systems[t] ||= buildSystem(t, subject, grade));

  const results = new Array(specs.length).fill(null);
  const seen = new Set();
  let firstErr = null;
  const emit = () => {
    const got = results.filter(Boolean);
    onProgress?.(got.length, specs.length);
    onPartial?.(got);
  };
  onProgress?.(0, specs.length);

  const runBatch = async (idxs) => {
    const type = specs[idxs[0]].type;
    const specText = idxs.map((gi, j) => {
      const s = specs[gi];
      return `Câu ${j + 1}: dạng "${s.topic}" | mức ${s.level}`;
    }).join('\n');
    try {
      const raw = await callModel({
        system: sysOf(type),
        parts: [
          ...imageParts,
          ...pdfParts,
          {
            text: [
              `Soạn ĐÚNG ${idxs.length} câu theo thứ tự các spec sau (mỗi spec = 1 câu riêng):`,
              specText,
              classInsights ? `Ưu tiên điểm yếu của lớp:\n${String(classInsights).slice(0, 600)}` : '',
              refText,
              `Nhắc lại: JSON có ĐÚNG ${idxs.length} phần tử, đúng thứ tự.`,
            ].filter(Boolean).join('\n\n'),
          },
        ],
        temperature: 0.4,
        signal,
        schema: GEN_SCHEMA,
      });
      const list = listFromPayload(parseJsonLoose(raw)).slice(0, idxs.length);
      list.forEach((item, j) => {
        const gi = idxs[j];
        if (results[gi]) return;
        const q = buildByType(item, specs[gi]);
        if (!q) return;
        const key = dupKey(q);
        if (key && seen.has(key)) return;
        if (key) seen.add(key);
        results[gi] = q;
      });
    } catch (e) {
      if (e?.name === 'AbortError') throw e;
      firstErr = firstErr || e;
    }
    emit();
  };

  const allIdx = specs.map((_, i) => i);
  const first = chunkByType(specs, allIdx, (t) => BATCH_SIZE[t] || 3);
  await pool(first.map((b) => () => runBatch(b)), GEN_CONCURRENCY);

  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    const missing = allIdx.filter((i) => !results[i]);
    if (!missing.length) break;
    console.warn(`[matrix] Thiếu ${missing.length} câu, thử lại ${attempt}/${MAX_RETRY}`);
    const batches = chunkByType(specs, missing, () => 2);
    await pool(batches.map((b) => () => runBatch(b)), GEN_CONCURRENCY);
  }

  const out = results.filter(Boolean);
  if (!out.length) throw firstErr || new Error('AI không sinh được câu hỏi. Thử mô tả chủ đề rõ hơn hoặc thử lại.');
  if (out.length < specs.length) {
    console.warn(`[matrix] Chỉ tạo được ${out.length}/${specs.length} câu.`);
  }
  return out;
}

/* ============================================================
   SOÁT ĐÁP ÁN — AI giải lại độc lập (không thấy đáp án) rồi so khớp
   ============================================================ */
const VERIFY_SCHEMA = {
  type: 'object',
  properties: {
    results: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          i: { type: 'number' },
          work: { type: 'string' },
          answer: { type: 'string' },
        },
        required: ['i', 'answer'],
      },
    },
  },
  required: ['results'],
};

function verifyPayload(q, i) {
  if (q.type === 'true_false') {
    return { i, type: 'true_false', q: q.q, statements: (q.statements || []).map((s) => s.text) };
  }
  if (q.type === 'short_answer') return { i, type: 'short_answer', q: q.q };
  return { i, type: 'single_choice', q: q.q, options: q.options };
}

function parseVerifyAnswer(q, ans) {
  const s = clean(ans);
  if (q.type === 'true_false') {
    const arr = s.split(/[\s,;/|]+/).filter(Boolean).map(toBool);
    return arr.length >= 4 && arr.slice(0, 4).every((x) => x !== null) ? arr.slice(0, 4) : null;
  }
  if (q.type === 'short_answer') return numFromText(s);
  const idx = 'ABCD'.indexOf(s.toUpperCase()[0]);
  return idx >= 0 ? idx : null;
}

function isMatch(q, got) {
  if (got === null || got === undefined) return null;
  if (q.type === 'true_false') return (q.statements || []).every((st, k) => st.answer === got[k]);
  if (q.type === 'short_answer') {
    const exp = numFromText(q.answer);
    if (exp === null) return null;
    return Math.abs(exp - got) <= Math.max(1e-9, Math.abs(exp) * 0.011);
  }
  return got === q.correct;
}

export async function verifyQuestionsWithAI({ questions = [], subject = 'Hóa học', grade = '12', onProgress, signal } = {}) {
  const system = `Bạn là giáo viên ${subject} THPT giải đề độc lập. Với mỗi câu hãy TỰ GIẢI từng bước rồi đưa đáp án.
${CHEM_RULES}
Trả JSON {"results":[{"i":số thứ tự,"work":"giải ngắn ≤ 200 ký tự","answer":"..."}]}.
- single_choice: answer là một chữ A, B, C hoặc D (theo thứ tự options).
- true_false: answer là 4 giá trị Đ hoặc S theo thứ tự các nhận định, cách nhau bằng dấu cách (vd "Đ S S Đ").
- short_answer: answer chỉ là một số (dấu phẩy thập phân), theo yêu cầu làm tròn của đề.
Chỉ trả đúng JSON, mỗi câu một phần tử.`;
  const out = questions.map((q) => ({ ...q, verify: { status: 'unchecked' } }));
  const idxs = questions.map((_, i) => i);
  const batches = [];
  for (let i = 0; i < idxs.length; i += 4) batches.push(idxs.slice(i, i + 4));
  let done = 0;
  await pool(batches.map((b) => async () => {
    try {
      const raw = await callModel({
        system,
        parts: [{ text: `Lớp ${grade}. Giải các câu sau:\n${JSON.stringify(b.map((gi) => verifyPayload(questions[gi], gi)))}` }],
        temperature: 0.1,
        signal,
        schema: VERIFY_SCHEMA,
      });
      const list = parseJsonLoose(raw)?.results || [];
      list.forEach((r) => {
        const gi = Number(r?.i);
        const q = questions[gi];
        if (!q || !b.includes(gi)) return;
        const got = parseVerifyAnswer(q, r.answer);
        const ok = isMatch(q, got);
        out[gi] = {
          ...q,
          verify: ok === null
            ? { status: 'unchecked' }
            : ok
              ? { status: 'ok' }
              : { status: 'mismatch', suggest: got, note: clean(r.work).slice(0, 220) },
        };
      });
    } catch (e) {
      if (e?.name === 'AbortError') throw e;
      console.warn('[verify] batch failed', e);
    }
    done += b.length;
    onProgress?.(Math.min(done, questions.length), questions.length);
  }), 4);
  const mismatches = out.map((q, index) => ({ q, index })).filter((x) => x.q.verify?.status === 'mismatch').map((x) => x.index);
  return { questions: out, mismatches, checked: out.filter((q) => q.verify.status !== 'unchecked').length };
}

/** Áp dụng đáp án AI gợi ý cho 1 câu đã bị đánh dấu lệch. */
export function applyVerifySuggestion(q) {
  const s = q?.verify?.suggest;
  if (s === undefined || s === null) return q;
  const next = { ...q, verify: { status: 'ok', fixed: true } };
  if (q.type === 'true_false') next.statements = q.statements.map((st, k) => ({ ...st, answer: s[k] }));
  else if (q.type === 'short_answer') {
    const vi = String(s).replace('.', ',');
    next.answer = vi;
    next.accepted = [...new Set([vi, String(s)])];
  } else next.correct = s;
  return next;
}

/* ============================================================
   CHỈNH TỪNG CÂU — an toàn cho cả 3 dạng
   ============================================================ */
export function questionToPlainText(q) {
  if (!q) return '';
  if (q.type === 'true_false') {
    return `${q.q}\n${(q.statements || []).map((s, i) => `${'abcd'[i]}) ${s.text} → ${s.answer ? 'Đúng' : 'Sai'}`).join('\n')}`;
  }
  if (q.type === 'short_answer') return `${q.q}\nĐáp án: ${q.answer}`;
  return `${q.q}\n${(q.options || []).map((o, i) => `${'ABCD'[i]}. ${o}`).join('\n')}\nĐáp án đúng: ${'ABCD'[q.correct] || '?'}`;
}

function specOf(question) {
  return {
    type: question.type || 'single_choice',
    points: question.points,
    topic: question.topic || '',
    level: question.level || '',
    levelKey: question.levelKey,
    part: question.part,
  };
}

export async function askPedagogyAI({ question, matrix, classInsights = '', signal } = {}) {
  const raw = await callModel({
    system: `Bạn là trợ lý sư phạm Hóa học THPT Việt Nam (lớp 10–12, GDPT 2018).
Trả lời ngắn, cụ thể, có ví dụ số liệu hoặc câu hỏi gợi ý dạy ngay được.
Chỉ trả JSON: {"answer":"..."}.`,
    parts: [{
      text: [
        question,
        matrix?.title ? `Đề/ma trận đang mở: ${matrix.title}` : '',
        classInsights ? `Dữ liệu lớp:\n${classInsights}` : '',
      ].filter(Boolean).join('\n\n'),
    }],
    temperature: 0.5,
    signal,
  });
  try {
    const p = parseJsonLoose(raw);
    return String(p?.answer || p?.text || '').trim() || 'Chưa nhận được gợi ý.';
  } catch {
    return String(raw || '').trim() || 'Chưa nhận được gợi ý.';
  }
}

export async function rewriteQuestionWithAI({
  question,
  instruction = '',
  subject = 'Hóa học',
  grade = '12',
  signal,
} = {}) {
  const sp = specOf(question);
  const raw = await callModel({
    system: `${buildSystem(sp.type, subject, grade)}

NHIỆM VỤ: viết lại/hoàn thiện CÂU HỎI GỐC theo yêu cầu giáo viên, GIỮ NGUYÊN dạng câu và mức độ "${sp.level || 'giữ nguyên'}". Trả JSON {"questions":[ĐÚNG 1 câu]}.`,
    parts: [{
      text: [
        `CÂU HỎI GỐC:\n${questionToPlainText(question)}\nLời giải hiện tại: ${question.explain || ''}`,
        instruction ? `YÊU CẦU CỦA GIÁO VIÊN: ${instruction}` : 'YÊU CẦU: làm đề mạch lạc, sát thực tế, phương án/nhận định phân hóa tốt hơn.',
      ].join('\n\n'),
    }],
    temperature: 0.4,
    signal,
    schema: GEN_SCHEMA,
  });
  const item = listFromPayload(parseJsonLoose(raw))[0];
  const built = buildByType(item, sp, { shuffle: false });
  if (!built) throw new Error('AI không trả về cấu trúc câu hỏi hợp lệ.');
  return { ...question, ...built, id: question.id || built.id, verify: { status: 'unchecked' } };
}

export async function regenerateDistractorsWithAI({
  question,
  subject = 'Hóa học',
  grade = '12',
  signal,
} = {}) {
  if ((question.type || 'single_choice') !== 'single_choice') {
    throw new Error('Chỉ đổi phương án nhiễu cho câu trắc nghiệm 4 lựa chọn.');
  }
  const correctText = question.options?.[question.correct] || '';
  const raw = await callModel({
    system: `Bạn là chuyên gia ra đề ${subject} lớp ${grade} THPT.
Giữ nguyên câu hỏi và ĐÁP ÁN ĐÚNG; TẠO MỚI 3 phương án nhiễu dựa trên lỗi sai kinh điển của học sinh (nhầm công thức, quên cân bằng, nhầm tỉ lệ mol, bẫy đơn vị). 3 phương án phải khác nhau và khác đáp án đúng.
Trả JSON: {"distractors":["...","...","..."],"explain":"Lời giải, chỉ ra lỗi sai của từng phương án nhiễu"}`,
    parts: [{ text: `CÂU HỎI: ${question.q}\nĐÁP ÁN ĐÚNG: ${correctText}\nLời giải hiện tại: ${question.explain || ''}` }],
    temperature: 0.4,
    signal,
  });
  const p = parseJsonLoose(raw);
  const d = (Array.isArray(p?.distractors) ? p.distractors : []).map(clean).filter(Boolean);
  const uniq = [...new Set(d.filter((x) => x.toLowerCase() !== clean(correctText).toLowerCase()))];
  if (uniq.length < 3) throw new Error('AI không tạo được phương án nhiễu hợp lệ.');
  const options = [correctText, ...uniq.slice(0, 3)];
  const fixed = shuffleOptions({ ...question, options, correct: 0, explain: p.explain || question.explain });
  return { ...question, options: fixed.options, correct: fixed.correct, explain: p.explain || question.explain, verify: { status: 'unchecked' } };
}

export async function getPedagogicalInsightForQuestion({ question, subject = 'Hóa học', signal } = {}) {
  const raw = await callModel({
    system: `Bạn là cố vấn sư phạm môn ${subject} THPT.
Phân tích câu hỏi và trả JSON {"trap":"bẫy nhận thức/sai lầm dễ mắc nhất (1–2 câu)","teachingTip":"mẹo hoặc câu hỏi gợi mở nên hỏi trên lớp (1–2 câu)"}`,
    parts: [{ text: `${questionToPlainText(question)}\nLời giải: ${question.explain || ''}` }],
    temperature: 0.3,
    signal,
  });
  const parsed = parseJsonLoose(raw);
  return {
    trap: parsed?.trap || 'Học sinh dễ nhầm lẫn công thức và điều kiện phản ứng.',
    teachingTip: parsed?.teachingTip || 'Yêu cầu học sinh viết nhẩm phương trình ion thu gọn trước khi bấm máy tính.',
  };
}

export const ridMatrix = rid;
