/* ============================================================
   ExamImporter.jsx — Studio Nhập Đề Word / PDF / Text / JSON (v5.0)
   ------------------------------------------------------------
   • Đồng bộ hoàn toàn với Teacher Studio v2 (--t-* tokens, word-importer.css)
   • Sử dụng 100% engine bóc tách thống nhất từ examDocxParser.js (OMML, ảnh, 3 phần GDPT 2025)
   • Sửa chi tiết từng câu: Đổi dạng (I / II / III), STT, mức độ, điểm, chủ đề,
     ngữ cảnh, SymbolBar (Toán/Hóa), xem trước MathText, thêm/xóa đáp án & ảnh phương án
   ============================================================ */
import { useEffect, useMemo, useRef, useState } from 'react';
import MathText from '../MathText.jsx';
import ExamPreviewSimulator from './ExamPreviewSimulator.jsx';
import WordDocxEditor from './WordDocxEditor.jsx';
import { ElecFlaskBrandSvg } from './ElecBrandMark.jsx';
import { exportToWord } from '../../lib/examExport.js';
import { askAI } from '../../lib/ai.js';
import { digitizeExam } from '../../lib/examAiUtils.js';
import { readFile } from '../../lib/fileReader.js';
import { readExamPdfFile } from '../../lib/pdfExamReader.js';
import { ocrImages } from '../../lib/aiOcr.js';
import { runWithCredit } from '../../lib/creditService.js';
import { useAuth } from '../../hooks/useAuth.jsx';
import { detectExamSubjectAndGrade } from '../../lib/subjectClassifier.js';
import { fileToCompressedDataUrl } from '../../lib/imageUtils.js';
import {
  classifySmartLevel,
  countFormulasInText,
  extractMcqAnswerFromExplain,
  fold,
  normalizeImporterType,
  parseAndStripLevelTag,
  parseLines,
  parsePastedAnswerKey,
  readDocx,
  readTf,
  textToLines,
} from '../../lib/examDocxParser.js';
import '../../styles/word-importer.css';

export { classifySmartLevel, parseLines };

const LETTERS = 'ABCDEF';
const LEVEL_CYCLE = ['nb', 'th', 'vd', 'vdc'];
const LEVEL_LABELS = { nb: 'NB', th: 'TH', vd: 'VD', vdc: 'VDC' };
const LEVEL_NAMES = {
  nb: 'Nhận biết (NB)',
  th: 'Thông hiểu (TH)',
  vd: 'Vận dụng (VD)',
  vdc: 'Vận dụng cao (VDC)',
};
const SUBJECT_OPTIONS = [
  'Toán học',
  'Vật lí',
  'Hóa học',
  'Sinh học',
  'Ngữ văn',
  'Tiếng Anh',
  'Lịch sử',
  'Địa lí',
  'GDKT&PL',
  'Tin học',
  'Công nghệ',
  'Khoa học tự nhiên',
];
const GRADE_OPTIONS = ['12', '11', '10', '9', '8', '7', '6'];

const SYM_GROUPS = [
  {
    id: 'basic',
    label: 'Cơ bản',
    items: [
      { label: '±', val: '±' },
      { label: '×', val: '×' },
      { label: '÷', val: '÷' },
      { label: '≠', val: '≠' },
      { label: '≤', val: '≤' },
      { label: '≥', val: '≥' },
      { label: '≈', val: '≈' },
      { label: '∞', val: '∞' },
      { label: '°', val: '°' },
      { label: '∠', val: '∠' },
      { label: '△', val: '△' },
    ],
  },
  {
    id: 'math',
    label: 'Phân số & Căn',
    items: [
      { label: 'Phân số', val: '$\\frac{a}{b}$' },
      { label: 'Căn bậc 2', val: '$\\sqrt{x}$' },
      { label: 'Mũ ²', val: '²' },
      { label: 'Mũ ³', val: '³' },
      { label: 'Mũ ⁿ', val: '$x^{n}$' },
      { label: 'Chỉ số ₙ', val: '$x_{n}$' },
      { label: 'Vector', val: '$\\vec{a}$' },
    ],
  },
  {
    id: 'chem',
    label: 'Hóa học',
    items: [
      { label: '→', val: ' → ' },
      { label: '⇌', val: ' ⇌ ' },
      { label: '↑', val: '↑' },
      { label: '↓', val: '↓' },
      { label: 'H₂O', val: 'H₂O' },
      { label: 'CO₂', val: 'CO₂' },
      { label: 'H₂SO₄', val: 'H₂SO₄' },
      { label: '⁺', val: '⁺' },
      { label: '²⁺', val: '²⁺' },
      { label: '⁻', val: '⁻' },
      { label: 'E°', val: 'E°' },
      { label: 'ΔH', val: 'ΔH°' },
    ],
  },
  {
    id: 'calc',
    label: 'Giải tích',
    items: [
      { label: '∫', val: '$\\int_{a}^{b}$' },
      { label: '∑', val: '$\\sum$' },
      { label: 'lim', val: '$\\lim_{x \\to 0}$' },
      { label: 'π', val: 'π' },
      { label: 'α', val: 'α' },
      { label: 'β', val: 'β' },
      { label: '∈', val: '∈' },
      { label: '∀', val: '∀' },
      { label: '∃', val: '∃' },
    ],
  },
];

/* ============================================================
   SVG ICONS SẮC NÉT
   ============================================================ */
const SvgWrap = ({ size = 15, children }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.85"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    {children}
  </svg>
);

const IcoDoc = ({ size = 16 }) => (
  <SvgWrap size={size}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </SvgWrap>
);
const IcoDownload = ({ size = 15 }) => (
  <SvgWrap size={size}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </SvgWrap>
);
const IcoUpload = ({ size = 18 }) => (
  <SvgWrap size={size}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </SvgWrap>
);
const IcoBolt = ({ size = 14 }) => (
  <SvgWrap size={size}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </SvgWrap>
);
const IcoSparkles = ({ size = 14 }) => <ElecFlaskBrandSvg size={size} variant="gradient" />;
const IcoCheck = ({ size = 13 }) => (
  <SvgWrap size={size}>
    <polyline points="20 6 9 17 4 12" />
  </SvgWrap>
);
const IcoAlert = ({ size = 13 }) => (
  <SvgWrap size={size}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </SvgWrap>
);
const IcoEdit = ({ size = 13 }) => (
  <SvgWrap size={size}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </SvgWrap>
);
const IcoTrash = ({ size = 13 }) => (
  <SvgWrap size={size}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </SvgWrap>
);
const IcoImage = ({ size = 13 }) => (
  <SvgWrap size={size}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </SvgWrap>
);
const IcoShuffle = ({ size = 14 }) => (
  <SvgWrap size={size}>
    <polyline points="16 3 21 3 21 8" />
    <line x1="4" y1="20" x2="21" y2="3" />
    <polyline points="21 16 21 21 16 21" />
    <line x1="15" y1="15" x2="21" y2="21" />
    <line x1="4" y1="4" x2="9" y2="9" />
  </SvgWrap>
);
const IcoFolder = ({ size = 14 }) => (
  <SvgWrap size={size}>
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </SvgWrap>
);
const IcoClose = ({ size = 15 }) => (
  <SvgWrap size={size}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </SvgWrap>
);
const IcoGlobe = ({ size = 14 }) => (
  <SvgWrap size={size}>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </SvgWrap>
);
const IcoSearch = ({ size = 13 }) => (
  <SvgWrap size={size}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </SvgWrap>
);
const IcoPlus = ({ size = 13 }) => (
  <SvgWrap size={size}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </SvgWrap>
);
const IcoCopy = ({ size = 13 }) => (
  <SvgWrap size={size}>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </SvgWrap>
);
const IcoUp = ({ size = 12 }) => (
  <SvgWrap size={size}>
    <polyline points="18 15 12 9 6 15" />
  </SvgWrap>
);
const IcoDown = ({ size = 12 }) => (
  <SvgWrap size={size}>
    <polyline points="6 9 12 15 18 9" />
  </SvgWrap>
);
const IcoInfo = ({ size = 14 }) => (
  <SvgWrap size={size}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </SvgWrap>
);

/* ============================================================
   TIỆN ÍCH ĐỌC PDF, JSON & CHUẨN HÓA CÂU HỎI
   ============================================================ */
function cleanJsonString(raw) {
  if (!raw) return '';
  let inString = false;
  let escaped = false;
  let out = '';
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === '"' && !escaped) {
      inString = !inString;
      out += ch;
    } else if (inString && ch === '\n') out += '\\n';
    else if (inString && ch === '\r') out += '\\r';
    else if (inString && ch === '\t') out += '\\t';
    else out += ch;
    escaped = ch === '\\' && !escaped;
  }
  return out;
}

function parseExamJsonSafe(text) {
  if (!text) return null;
  const s = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');
  try { return JSON.parse(s); } catch { /* noop */ }
  try { return JSON.parse(cleanJsonString(s)); } catch { /* noop */ }
  const firstBrace = s.indexOf('{');
  const lastBrace = s.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const sub = s.slice(firstBrace, lastBrace + 1);
    try { return JSON.parse(sub); } catch { /* noop */ }
    try { return JSON.parse(cleanJsonString(sub)); } catch { /* noop */ }
  }
  return null;
}

const escapeNewlinesInStrings = (str) => {
  let out = '';
  let inStr = false;
  let esc = false;
  for (const ch of str) {
    if (inStr) {
      if (esc) { out += ch; esc = false; }
      else if (ch === '\\') { out += ch; esc = true; }
      else if (ch === '"') { out += ch; inStr = false; }
      else if (ch === '\n') out += '\\n';
      else if (ch === '\r') { /* ignore */ }
      else if (ch === '\t') out += '\\t';
      else out += ch;
    } else {
      if (ch === '"') inStr = true;
      out += ch;
    }
  }
  return out;
};

const sliceBrackets = (str) => {
  const a = str.search(/[[{]/);
  if (a < 0) return null;
  const close = str[a] === '{' ? '}' : ']';
  const b = str.lastIndexOf(close);
  return b > a ? str.slice(a, b + 1) : { incomplete: close };
};

const extractJson = (raw) => {
  const t = String(raw || '').trim();
  if (!t) return null;
  const cands = [];
  const fence = !/^[[{]/.test(t) ? t.match(/```(?:json|JSON)?[ \t]*\n([\s\S]*?)```/) : null;
  if (fence) cands.push(fence[1]);
  cands.push(t);
  let firstErr = '';
  for (const c of cands) {
    const sl = sliceBrackets(c);
    if (!sl) continue;
    if (typeof sl === 'object') {
      firstErr = firstErr || `JSON chưa đầy đủ — thiếu dấu đóng "${sl.incomplete}".`;
      continue;
    }
    const fixed = escapeNewlinesInStrings(sl);
    const noComma = fixed.replace(/,\s*([}\]])/g, '$1');
    const smart = noComma.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
    for (const attempt of [sl, fixed, noComma, smart]) {
      try { return { value: JSON.parse(attempt) }; } catch (e) { firstErr = firstErr || e.message; }
    }
  }
  return firstErr ? { error: firstErr } : null;
};

const nk = (k) => k.toLowerCase().replace(/[\s_-]/g, '');
const normObj = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [nk(k), v]));
const pickK = (o, keys) => {
  for (const k of keys) if (o[k] !== undefined && o[k] !== null && o[k] !== '') return o[k];
  return undefined;
};

const normalizeJsonExam = (data) => {
  let meta = {};
  let arr = data;
  if (!Array.isArray(arr)) {
    if (!data || typeof data !== 'object') return null;
    const o = normObj(data);
    meta = {
      title: pickK(o, ['title', 'name', 'tende', 'tieude']),
      duration: Number(pickK(o, ['duration', 'time', 'thoigian', 'minutes'])) || 0,
    };
    arr = pickK(o, ['questions', 'items', 'data', 'cauhoi', 'quiz', 'groups', 'passages', 'sections', 'parts']);
    if (arr && !Array.isArray(arr) && typeof arr === 'object') arr = pickK(normObj(arr), ['questions', 'items', 'cauhoi']);
  }
  if (!Array.isArray(arr)) return null;

  const PASSAGE_KEYS = ['passage', 'readingpassage', 'reading', 'baidoc', 'doanvan', 'doan', 'context', 'stimulus'];
  const INSTR_KEYS = ['instruction', 'instructions', 'direction', 'directions', 'huongdan', 'dedieu', 'rubric'];
  const flatten = (list, inherit) =>
    list.flatMap((raw) => {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return [];
      const o = normObj(raw);
      const ctx = {
        passage: pickK(o, PASSAGE_KEYS) ?? inherit.passage,
        instruction: pickK(o, INSTR_KEYS) ?? inherit.instruction,
      };
      const sub = pickK(o, ['questions', 'items', 'cauhoi']);
      if (Array.isArray(sub) && o.options === undefined && o.choices === undefined) return flatten(sub, ctx);
      return [{ raw, ctx }];
    });
  const asText = (v) => (Array.isArray(v) ? v.join('\n') : String(v ?? '')).replace(/\r/g, '').trim();

  const questions = flatten(arr, {}).map(({ raw, ctx }, i) => {
    const o = normObj(raw);
    const warns = [];
    let q = String(pickK(o, ['q', 'question', 'cauhoi', 'noidung', 'content', 'text', 'stem', 'prompt']) ?? '').trim();
    const { level: tagLv, text: strippedQ, hadTag } = parseAndStripLevelTag(q);
    q = strippedQ;

    let flagged = -1;
    let options = [];
    const rawOpts = pickK(o, ['options', 'choices', 'answers', 'luachon', 'phuongan', 'answerchoices']);
    if (Array.isArray(rawOpts)) {
      options = rawOpts.map((x, j) => {
        if (x && typeof x === 'object') {
          const xo = normObj(x);
          if (xo.correct === true || xo.iscorrect === true || xo.dung === true) flagged = j;
          return String(pickK(xo, ['text', 'content', 'value', 'label', 'option', 'noidung']) ?? '');
        }
        return String(x);
      });
    } else if (rawOpts && typeof rawOpts === 'object') {
      options = Object.entries(rawOpts)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, v]) => String(v));
    } else if (o.a !== undefined) {
      options = ['a', 'b', 'c', 'd', 'e', 'f'].filter((k) => o[k] !== undefined).map((k) => String(o[k]));
    }
    options = options.map((t) => t.replace(/^\s*[A-Fa-f][.)]\s+/, '').trim());

    let correct = -1;
    let numeric = false;
    const idxK = pickK(o, ['correctindex', 'answerindex']);
    let c = pickK(o, ['correct', 'correctanswer', 'answer', 'dapan', 'dapandung', 'correctoption', 'right', 'key']);
    if (flagged >= 0) correct = flagged;
    else if (idxK !== undefined && Number.isInteger(Number(idxK))) correct = Number(idxK);
    else if (c !== undefined) {
      if (Array.isArray(c)) c = c[0];
      if (typeof c === 'number') {
        correct = c;
        numeric = true;
      } else {
        const t = String(c).trim();
        const m = t.match(/^\(?([A-Fa-f])\)?(?:[.):]|$)/);
        if (m) correct = LETTERS.indexOf(m[1].toUpperCase());
        else if (/^\d+$/.test(t)) {
          correct = Number(t);
          numeric = true;
        } else correct = options.findIndex((op) => fold(op) === fold(t));
      }
    }
    if (numeric && correct === options.length && correct > 0) correct -= 1;
    if (correct < 0 || correct >= options.length) correct = -1;

    const typeRaw = fold(String(pickK(o, ['type', 'loai', 'dang', 'kind', 'format']) ?? ''));
    const stRaw = pickK(o, ['statements', 'claims', 'nhandinh', 'menhde', 'ys', 'subquestions']);
    let type = 'single_choice';
    if (Array.isArray(stRaw) || /true|dung|tf|boolean/.test(typeRaw)) type = 'true_false';
    else if (/short|ngan|numeric|number|fill|tuluan/.test(typeRaw)) type = 'short_answer';
    else if (!options.length && c !== undefined && String(Array.isArray(c) ? c[0] : c).trim() !== '' && correct < 0)
      type = 'short_answer';

    const toB = (v) => {
      if (typeof v === 'boolean') return v;
      const t = fold(String(v ?? '')).trim();
      if (['true', 'dung', 'd', '1', 'yes'].includes(t)) return true;
      if (['false', 'sai', 's', '0', 'no'].includes(t)) return false;
      return null;
    };
    let statements = [];
    if (type === 'true_false') {
      statements = (Array.isArray(stRaw) ? stRaw : []).map((x) => {
        if (x && typeof x === 'object') {
          const xo = normObj(x);
          return {
            text: String(pickK(xo, ['text', 'content', 'statement', 'noidung', 'nhandinh', 'claim']) ?? '')
              .replace(/^\s*[a-dA-D][.)]\s+/, '')
              .trim(),
            answer: toB(pickK(xo, ['answer', 'correct', 'dung', 'dapan', 'value', 'istrue'])),
          };
        }
        return { text: String(x), answer: null };
      });
    }
    let answer = '';
    if (type === 'short_answer') {
      const av = pickK(o, ['answer', 'dapan', 'correct', 'correctanswer', 'key', 'result', 'ketqua']);
      answer = String(Array.isArray(av) ? av[0] : av ?? '').trim();
    }

    const pts = Number(pickK(o, ['points', 'score', 'diem']));
    const topicV = String(pickK(o, ['topic', 'chude', 'dangbai']) ?? '').trim();
    const rawLv = fold(String(pickK(o, ['level', 'mucdo', 'bloom']) ?? ''));
    let normLv = tagLv || 'nb';
    if (!tagLv && rawLv) {
      if (rawLv.includes('cao') || rawLv === 'vdc') normLv = 'vdc';
      else if (rawLv.includes('van') || rawLv === 'vd') normLv = 'vd';
      else if (rawLv.includes('thong') || rawLv === 'th') normLv = 'th';
      else normLv = 'nb';
    }
    const imgField = pickK(o, ['image', 'img', 'hinh', 'hinhanh', 'figure']);

    return {
      id: 'j' + (i + 1),
      num: i + 1,
      type,
      statements,
      answer,
      accepted: Array.isArray(o.accepted) ? o.accepted.map(String) : undefined,
      topic: topicV,
      level: normLv,
      hadLevelTag: hadTag || Boolean(rawLv),
      q,
      image: imgField ? String(imgField) : null,
      images: imgField ? [String(imgField)] : [],
      options,
      correct,
      src: 'JSON',
      passage: asText(ctx.passage),
      instruction: asText(ctx.instruction),
      explain: String(pickK(o, ['explain', 'explanation', 'giaithich', 'loigiai', 'solution', 'reason']) ?? '').trim(),
      warns,
      points: pts > 0 ? pts : undefined,
    };
  });

  if (!questions.some((x) => x.q)) return null;
  let pgN = 0;
  let prevP = null;
  questions.forEach((x) => {
    if (!x.passage) {
      prevP = null;
      x.pg = null;
      return;
    }
    if (x.passage !== prevP) {
      pgN++;
      prevP = x.passage;
    }
    x.pg = 'pg' + pgN;
  });
  return { meta, questions };
};

const toUiQuestion = (q, fallbackIdx = 0) => {
  const normType = normalizeImporterType(q?.type);
  const imgs = Array.isArray(q?.images) ? q.images.filter(Boolean) : q?.image ? [q.image] : [];
  const defaultPts = normType === 'true_false' ? 1 : 0.25;
  return {
    ...q,
    id: q?.id || `q_${Date.now()}_${fallbackIdx}_${Math.random().toString(36).slice(2, 6)}`,
    num: Number(q?.num) || fallbackIdx + 1,
    type: normType,
    level: (q?.level || 'nb').toLowerCase(),
    q: q?.q || '',
    image: q?.image || imgs[0] || null,
    images: imgs,
    options: Array.isArray(q?.options) ? q.options : normType === 'single_choice' ? ['', '', '', ''] : [],
    correct: typeof q?.correct === 'number' ? q.correct : -1,
    statements: Array.isArray(q?.statements) ? q.statements : [],
    answer: q?.answer ?? '',
    accepted: Array.isArray(q?.accepted) ? q.accepted : [],
    points: Number(q?.points) > 0 ? Number(q.points) : defaultPts,
    topic: q?.topic || '',
    explain: q?.explain || '',
    warns: Array.isArray(q?.warns) ? q.warns : [],
  };
};

const issuesOf = (it) => {
  const out = [];
  if (!String(it.q || '').trim() && !it.image) out.push('Thiếu nội dung câu hỏi');
  const normType = normalizeImporterType(it.type);
  if (normType === 'true_false') {
    const st = it.statements || [];
    if (st.length !== 4) out.push(`Câu Đúng/Sai cần đủ 4 ý a-d (đang có ${st.length})`);
    else if (st.some((x) => !String(x.text || '').trim())) out.push('Có ý nhận định bị trống');
    if (st.some((x) => x.answer !== true && x.answer !== false)) out.push('Chưa chọn Đúng/Sai đủ các ý');
    return out;
  }
  if (normType === 'short_answer') {
    if (!String(it.answer || '').trim()) out.push('Chưa có đáp án trả lời ngắn');
    return out;
  }
  const opts = it.options || [];
  if (opts.length < 2) out.push(opts.length ? 'Chỉ có 1 lựa chọn' : 'Không có lựa chọn A/B/C/D');
  else if (opts.some((o, idx) => !String(o || '').trim() && !it.optionImages?.[idx])) out.push('Có phương án bị trống');
  if (it.correct < 0 || it.correct >= opts.length) out.push('Chưa chọn đáp án đúng');
  return out;
};

/* ============================================================
   ĐỀ MẪU CHUẨN 3 PHẦN + FILE WORD MẪU
   ============================================================ */
const GALVANI_SVG_DATA_URL =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="520" height="250" viewBox="0 0 520 250">
  <rect width="520" height="250" rx="12" fill="#ffffff"/>
  <g stroke="#1e293b" stroke-width="1.8" fill="none" font-family="Arial, sans-serif" font-size="12">
    <line x1="150" y1="95" x2="150" y2="42"/>
    <line x1="150" y1="42" x2="242" y2="42"/>
    <line x1="278" y1="42" x2="370" y2="42"/>
    <line x1="370" y1="42" x2="370" y2="95"/>
    <circle cx="260" cy="42" r="18" fill="#fef9c3" stroke="#1e293b"/>
    <line x1="248" y1="30" x2="272" y2="54"/>
    <line x1="272" y1="30" x2="248" y2="54"/>
    <text x="260" y="18" text-anchor="middle" fill="#0f172a" stroke="none" font-weight="bold">Bóng đèn</text>
    <text x="260" y="76" text-anchor="middle" fill="#334155" stroke="none">Dây dẫn điện</text>
    <path d="M110 85 L110 195 Q110 205 120 205 L180 205 Q190 205 190 195 L190 85" stroke-width="2"/>
    <path d="M112 125 L188 125 L188 195 Q188 203 180 203 L120 203 Q112 203 112 195 Z" fill="#f1f5f9" stroke="none"/>
    <line x1="111" y1="125" x2="189" y2="125" stroke="#64748b" stroke-dasharray="3 2"/>
    <rect x="142" y="72" width="16" height="108" fill="#cbd5e1" stroke="#1e293b"/>
    <text x="95" y="76" text-anchor="end" fill="#0f172a" stroke="none" font-weight="bold">Thanh Zn</text>
    <line x1="98" y1="74" x2="140" y2="85" stroke="#475569" stroke-width="1.2"/>
    <text x="150" y="224" text-anchor="middle" fill="#0f172a" stroke="none">Dung dịch</text>
    <text x="150" y="240" text-anchor="middle" fill="#0f172a" stroke="none" font-weight="bold">ZnSO₄ 1,0 M</text>
    <path d="M330 85 L330 195 Q330 205 340 205 L400 205 Q410 205 410 195 L410 85" stroke-width="2"/>
    <path d="M332 125 L408 125 L408 195 Q408 203 400 203 L340 203 Q332 203 332 195 Z" fill="#dbeafe" stroke="none"/>
    <line x1="331" y1="125" x2="409" y2="125" stroke="#3b82f6" stroke-dasharray="3 2"/>
    <rect x="362" y="72" width="16" height="108" fill="#fdba74" stroke="#1e293b"/>
    <text x="425" y="76" text-anchor="start" fill="#0f172a" stroke="none" font-weight="bold">Thanh Cu</text>
    <line x1="422" y1="74" x2="380" y2="85" stroke="#475569" stroke-width="1.2"/>
    <text x="370" y="224" text-anchor="middle" fill="#0f172a" stroke="none">Dung dịch</text>
    <text x="370" y="240" text-anchor="middle" fill="#0f172a" stroke="none" font-weight="bold">CuSO₄ 1,0 M</text>
  </g>
</svg>`);

const SAMPLE_GDPT2025_QUESTIONS = [
  {
    id: 'sample-1',
    num: 1,
    type: 'single_choice',
    level: 'nb',
    hadLevelTag: true,
    q: 'Dụng cụ nào cần bổ sung vào hệ được mô tả như sơ đồ ở hình bên dưới để tạo thành pin Galvani hoạt động?',
    image: GALVANI_SVG_DATA_URL,
    images: [GALVANI_SVG_DATA_URL],
    options: ['Cầu muối.', 'Vôn kế.', 'Ampe kế.', 'Nhiệt kế.'],
    correct: 0,
    points: 0.25,
    src: 'in đậm/gạch chân',
    explain: 'Cầu muối giúp khép kín mạch điện và trung hòa điện tích giữa hai dung dịch điện phân ZnSO₄ và CuSO₄.',
    warns: [],
  },
  {
    id: 'sample-2',
    num: 2,
    type: 'single_choice',
    level: 'nb',
    hadLevelTag: true,
    q: 'Khi pin Galvani Zn – Cu hoạt động, quá trình nào sau đây xảy ra ở cathode?',
    options: ['Zn²⁺ + 2e → Zn.', 'Cu²⁺ + 2e → Cu.', 'Cu → Cu²⁺ + 2e.', 'Zn → Zn²⁺ + 2e.'],
    correct: 1,
    points: 0.25,
    src: 'in đậm/gạch chân',
    explain: 'Ở cathode (cực dương Cu) xảy ra quá trình khử ion Cu²⁺: Cu²⁺ + 2e → Cu.',
    warns: [],
  },
  {
    id: 'sample-3',
    num: 1,
    type: 'true_false',
    level: 'th',
    hadLevelTag: true,
    q: 'Thiết lập một pin điện hóa gồm điện cực Zn nhúng trong dung dịch ZnSO₄ 1 M và điện cực Cu nhúng trong dung dịch CuSO₄ 1 M nối với nhau qua cầu muối. Cho E°(Zn²⁺/Zn) = −0,76 V; E°(Cu²⁺/Cu) = +0,34 V.',
    statements: [
      { text: 'Thanh Zn đóng vai trò là anode (cực âm) và bị ăn mòn dần.', answer: true },
      { text: 'Dòng electron ở mạch ngoài di chuyển từ thanh Cu sang thanh Zn.', answer: false },
      { text: 'Nồng độ ion Cu²⁺ trong dung dịch giảm dần theo thời gian pin hoạt động.', answer: true },
      { text: 'Sức điện động chuẩn của pin bằng 1,10 V.', answer: true },
    ],
    options: [],
    correct: -1,
    points: 1,
    src: 'gạch chân/in đậm',
    explain: 'E°pin = 0,34 − (−0,76) = 1,10 V. Electron di chuyển từ cực âm (Zn) sang cực dương (Cu).',
    warns: [],
  },
  {
    id: 'sample-4',
    num: 1,
    type: 'short_answer',
    level: 'vd',
    hadLevelTag: true,
    q: 'Cho thế điện cực chuẩn E°(Mg²⁺/Mg) = −2,356 V và E°(Ag⁺/Ag) = +0,799 V. Sức điện động chuẩn của pin Galvani Mg – Ag bằng bao nhiêu Vôn? (Làm tròn kết quả đến hàng phần trăm)',
    answer: '3,16',
    accepted: ['3,16', '3.16'],
    options: [],
    correct: -1,
    points: 0.25,
    src: 'dòng đáp án',
    explain: 'E°pin = E°(Ag⁺/Ag) − E°(Mg²⁺/Mg) = 0,799 − (−2,356) = 3,155 V ≈ 3,16 V.',
    warns: [],
  },
];

const downloadWordTemplateDocx = async () => {
  const { Document, Packer, Paragraph, TextRun, UnderlineType } = await import('docx');
  const { saveAs } = await import('file-saver');

  const p = (runs) => new Paragraph({ children: runs, spacing: { after: 120 } });
  const txt = (t, opts = {}) => new TextRun({ text: t, size: 24, font: 'Times New Roman', ...opts });
  const ansRun = (t) =>
    new TextRun({
      text: t,
      size: 24,
      font: 'Times New Roman',
      bold: true,
      underline: { type: UnderlineType.SINGLE },
    });

  const doc = new Document({
    sections: [
      {
        children: [
          p([txt('PHẦN I. Câu trắc nghiệm nhiều lựa chọn', { bold: true })]),
          p([txt('Câu 1. [NB] ', { bold: true }), txt('Khi pin Galvani Zn – Cu hoạt động, quá trình nào sau đây xảy ra ở cathode?')]),
          p([txt('A. ', { bold: true }), txt('Zn²⁺ + 2e → Zn.')]),
          p([ansRun('B.'), txt(' Cu²⁺ + 2e → Cu.')]),
          p([txt('C. ', { bold: true }), txt('Cu → Cu²⁺ + 2e.')]),
          p([txt('D. ', { bold: true }), txt('Zn → Zn²⁺ + 2e.')]),
          p([txt('Lời giải: Ở cathode (cực dương Cu) xảy ra quá trình khử ion Cu²⁺.')]),

          p([txt('PHẦN II. Câu trắc nghiệm đúng sai', { bold: true })]),
          p([txt('Câu 1. [TH] ', { bold: true }), txt('Cho các phát biểu sau về pin điện hóa Zn – Cu:')]),
          p([ansRun('a)'), txt(' Thanh kẽm (Zn) đóng vai trò là cực âm (anode).')]),
          p([txt('b) '), txt('Dòng electron di chuyển từ thanh đồng (Cu) sang thanh kẽm (Zn).')]),
          p([ansRun('c)'), txt(' Cầu muối giúp trung hòa điện tích của hai dung dịch.')]),
          p([ansRun('d)'), txt(' Sức điện động chuẩn của pin Zn – Cu là 1,10 V.')]),
          p([txt('Đáp án: a-Đ, b-S, c-Đ, d-Đ')]),
          p([txt('Lời giải: Electron chuyển từ cực âm Zn sang cực dương Cu nên ý b sai.')]),

          p([txt('PHẦN III. Câu trắc nghiệm trả lời ngắn', { bold: true })]),
          p([txt('Câu 1. [VD] ', { bold: true }), txt('Thủy phân hoàn toàn 8,8 gam etyl axetat bằng dung dịch NaOH dư, thu được bao nhiêu gam muối natri axetat? (Làm tròn đến hàng phần mười)')]),
          p([txt('Đáp án: 8,2', { bold: true })]),
          p([txt('Lời giải: n_este = 8,8 / 88 = 0,1 mol → m_CH3COONa = 0,1 × 82 = 8,2 gam.')]),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, 'De-Word-Mau-Chuan-3-Phan-GDPT2025.docx');
};

/* ============================================================
   COMPONENT CON: TRÌNH SỬA CHI TIẾT CÂU HỎI
   ============================================================ */
function QuestionDetailEditor({
  item,
  onPatch,
  onConvertType,
  onUploadQuestionImage,
  onUploadOptionImage,
  onDone,
  onAutoDetectFromExplain,
}) {
  const [symGroup, setSymGroup] = useState('basic');
  const [showPassage, setShowPassage] = useState(Boolean(item.passage || item.instruction));
  const [showPreview, setShowPreview] = useState(false);
  const activeInputRef = useRef({ el: null, field: null });

  const registerFocus = (fieldMeta) => (e) => {
    activeInputRef.current = { el: e.target, field: fieldMeta };
  };

  const insertSymbolAtCursor = (symbolVal) => {
    const { el, field } = activeInputRef.current;
    if (!field || !el) {
      onPatch({ q: `${item.q || ''}${symbolVal}` });
      return;
    }
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const curVal = String(el.value || '');
    const nextVal = curVal.slice(0, start) + symbolVal + curVal.slice(end);

    if (field.kind === 'q') onPatch({ q: nextVal });
    else if (field.kind === 'passage') onPatch({ passage: nextVal });
    else if (field.kind === 'explain') onPatch({ explain: nextVal });
    else if (field.kind === 'answer') onPatch({ answer: nextVal, src: 'bạn nhập' });
    else if (field.kind === 'opt') {
      const nextOpts = [...(item.options || [])];
      nextOpts[field.idx] = nextVal;
      onPatch({ options: nextOpts });
    } else if (field.kind === 'tf') {
      const nextSt = (item.statements || []).map((s, j) => (j === field.idx ? { ...s, text: nextVal } : s));
      onPatch({ statements: nextSt });
    }

    requestAnimationFrame(() => {
      try {
        el.focus();
        const caret = start + symbolVal.length;
        el.setSelectionRange(caret, caret);
      } catch { /* ignore */ }
    });
  };

  const normType = normalizeImporterType(item.type);
  const activeGroup = SYM_GROUPS.find((g) => g.id === symGroup) || SYM_GROUPS[0];
  const acceptedText = Array.isArray(item.accepted) && item.accepted.length > 0
    ? item.accepted.join('; ')
    : String(item.answer || '');

  const stemImages = Array.isArray(item.images) && item.images.length > 0
    ? item.images
    : item.image
      ? [item.image]
      : [];

  return (
    <div className="wimp-editor">
      {/* 1. Thanh chuyển loại câu hỏi + Metadata */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div className="wimp-type-switch" role="group" aria-label="Loại câu hỏi">
          {[
            { id: 'single_choice', label: 'Phần I · Trắc nghiệm (A/B/C/D)' },
            { id: 'true_false', label: 'Phần II · Đúng / Sai (a-d)' },
            { id: 'short_answer', label: 'Phần III · Trả lời ngắn' },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={`wimp-type-btn ${normType === opt.id ? 'active' : ''}`}
              onClick={() => onConvertType(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            className="wimp-btn wimp-btn-xs"
            onClick={() => setShowPassage((v) => !v)}
          >
            {showPassage ? 'Ẩn ngữ cảnh' : '+ Ngữ cảnh / Đoạn đọc'}
          </button>
          <button
            type="button"
            className="wimp-btn wimp-btn-xs"
            onClick={() => setShowPreview((v) => !v)}
          >
            {showPreview ? 'Ẩn xem trước' : 'Xem trước công thức'}
          </button>
        </div>
      </div>

      <div className="wimp-editor-meta">
        <div>
          <label className="wimp-field-label">Số câu</label>
          <input
            type="number"
            min={1}
            className="wimp-input"
            value={item.num || 1}
            onChange={(e) => onPatch({ num: Math.max(1, Number(e.target.value) || 1) })}
          />
        </div>
        <div>
          <label className="wimp-field-label">Mức độ</label>
          <select
            className="wimp-select"
            value={(item.level || 'nb').toLowerCase()}
            onChange={(e) => onPatch({ level: e.target.value, hadLevelTag: true })}
          >
            {LEVEL_CYCLE.map((lv) => (
              <option key={lv} value={lv}>
                {LEVEL_NAMES[lv]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="wimp-field-label">Điểm</label>
          <input
            type="number"
            step="0.05"
            min={0.05}
            className="wimp-input"
            value={item.points ?? (normType === 'true_false' ? 1 : 0.25)}
            onChange={(e) => onPatch({ points: Math.max(0.05, Number(e.target.value) || 0.25) })}
          />
        </div>
        <div>
          <label className="wimp-field-label">Chủ đề / Chuyên đề (tùy chọn)</label>
          <input
            type="text"
            className="wimp-input"
            value={item.topic || ''}
            onChange={(e) => onPatch({ topic: e.target.value })}
            placeholder="VD: Pin điện hóa, Hàm số, Reading..."
          />
        </div>
      </div>

      {/* 2. Thanh chèn ký hiệu Toán / Hóa nhanh vào đúng vị trí con trỏ */}
      <div className="wimp-symbar">
        <div className="wimp-symbar-tabs">
          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--wi-ink3)', marginRight: 4 }}>
            Chèn nhanh ký hiệu:
          </span>
          {SYM_GROUPS.map((g) => (
            <button
              key={g.id}
              type="button"
              className={`wimp-symbar-tab ${symGroup === g.id ? 'active' : ''}`}
              onClick={() => setSymGroup(g.id)}
            >
              {g.label}
            </button>
          ))}
        </div>
        <div className="wimp-symbar-keys">
          {activeGroup.items.map((sym) => (
            <button
              key={sym.label}
              type="button"
              className="wimp-sym-btn"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insertSymbolAtCursor(sym.val)}
              title={`Chèn ${sym.val}`}
            >
              {sym.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Ngữ cảnh / Đoạn đọc hiểu */}
      {showPassage && (
        <div>
          <label className="wimp-field-label">Đoạn văn / Ngữ cảnh chung của câu hỏi</label>
          <textarea
            className="wimp-textarea"
            rows={3}
            value={item.passage || ''}
            onFocus={registerFocus({ kind: 'passage' })}
            onChange={(e) => onPatch({ passage: e.target.value })}
            placeholder="Nhập đoạn văn đọc hiểu hoặc đề dẫn thí nghiệm chung..."
          />
        </div>
      )}

      {/* 4. Nội dung câu dẫn & Hình ảnh */}
      <div>
        <label className="wimp-field-label">Nội dung câu hỏi</label>
        <textarea
          className="wimp-textarea"
          rows={3}
          value={item.q}
          onFocus={registerFocus({ kind: 'q' })}
          onChange={(e) => onPatch({ q: e.target.value })}
          placeholder="Nhập nội dung câu hỏi (hỗ trợ $LaTeX$ và ký tự H₂O, x²)..."
        />
        {(showPreview || countFormulasInText(item.q) > 0) && item.q && (
          <div className="wimp-preview-box" style={{ marginTop: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--wi-ink3)', marginBottom: 3 }}>
              Xem trước hiển thị:
            </div>
            <MathText text={item.q} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <label className="wimp-btn wimp-btn-sm" style={{ cursor: 'pointer' }}>
          <IcoImage size={13} /> {stemImages.length > 0 ? 'Thêm ảnh minh họa' : 'Tải ảnh câu hỏi'}
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) onUploadQuestionImage(file);
            }}
          />
        </label>
        {stemImages.map((imgUrl, imgIdx) => (
          <div key={imgIdx} className="wimp-thumb-wrap">
            <img src={imgUrl} alt={`Hình minh họa ${imgIdx + 1}`} style={{ maxHeight: 88 }} />
            <button
              type="button"
              className="wimp-thumb-del"
              title="Xóa ảnh này"
              onClick={() => {
                const rest = stemImages.filter((_, j) => j !== imgIdx);
                onPatch({ image: rest[0] || null, images: rest });
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* 5. Chi tiết phương án / nhận định / đáp án ngắn */}
      {normType === 'single_choice' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="wimp-field-label" style={{ margin: 0 }}>
              Các phương án lựa chọn (chạm chữ cái để chọn đáp án đúng)
            </label>
            {(item.options || []).length < 6 && (
              <button
                type="button"
                className="wimp-btn wimp-btn-xs wimp-btn-soft"
                onClick={() => onPatch({ options: [...(item.options || []), ''] })}
              >
                <IcoPlus size={12} /> Thêm phương án {LETTERS[(item.options || []).length]}
              </button>
            )}
          </div>
          {(item.options || []).map((opt, oIdx) => {
            const isCorr = item.correct === oIdx;
            const optImg = item.optionImages?.[oIdx];
            return (
              <div key={oIdx} className={`wimp-editor-opt-row ${isCorr ? 'is-correct' : ''}`}>
                <button
                  type="button"
                  className="wimp-opt-key"
                  style={
                    isCorr
                      ? { background: 'var(--wi-ok)', color: '#fff', borderColor: 'var(--wi-ok)', cursor: 'pointer' }
                      : { cursor: 'pointer' }
                  }
                  onClick={() => onPatch({ correct: oIdx, src: 'bạn chọn' })}
                  title={`Đặt ${LETTERS[oIdx]} là đáp án đúng`}
                >
                  {LETTERS[oIdx]}
                </button>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <input
                    type="text"
                    className="wimp-input"
                    value={opt}
                    onFocus={registerFocus({ kind: 'opt', idx: oIdx })}
                    onChange={(e) => {
                      const nextOpts = (item.options || []).map((v, j) => (j === oIdx ? e.target.value : v));
                      onPatch({ options: nextOpts });
                    }}
                    placeholder={`Nội dung phương án ${LETTERS[oIdx]}...`}
                  />
                  {optImg && (
                    <div className="wimp-thumb-wrap" style={{ alignSelf: 'flex-start' }}>
                      <img src={optImg} alt={`Ảnh ${LETTERS[oIdx]}`} style={{ maxHeight: 72 }} />
                      <button
                        type="button"
                        className="wimp-thumb-del"
                        onClick={() => {
                          const nextImgs = { ...(item.optionImages || {}) };
                          delete nextImgs[oIdx];
                          onPatch({ optionImages: Object.keys(nextImgs).length ? nextImgs : undefined });
                        }}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
                <label className="wimp-btn wimp-btn-xs" title="Đính kèm ảnh cho phương án" style={{ cursor: 'pointer' }}>
                  <IcoImage size={12} />
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = '';
                      if (f) onUploadOptionImage(oIdx, f);
                    }}
                  />
                </label>
                {(item.options || []).length > 2 && (
                  <button
                    type="button"
                    className="wimp-btn wimp-btn-xs wimp-btn-danger"
                    title="Xóa phương án này"
                    onClick={() => {
                      const nextOpts = (item.options || []).filter((_, j) => j !== oIdx);
                      const nextImgs = {};
                      if (item.optionImages) {
                        Object.entries(item.optionImages).forEach(([kStr, url]) => {
                          const k = Number(kStr);
                          if (k < oIdx) nextImgs[k] = url;
                          else if (k > oIdx) nextImgs[k - 1] = url;
                        });
                      }
                      let nextCorrect = item.correct;
                      if (nextCorrect === oIdx) nextCorrect = -1;
                      else if (nextCorrect > oIdx) nextCorrect -= 1;
                      onPatch({
                        options: nextOpts,
                        optionImages: Object.keys(nextImgs).length ? nextImgs : undefined,
                        correct: nextCorrect,
                      });
                    }}
                  >
                    <IcoTrash size={12} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {normType === 'true_false' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
            <label className="wimp-field-label" style={{ margin: 0 }}>
              Các ý nhận định Đúng / Sai (chuẩn 4 ý a, b, c, d)
            </label>
            <div style={{ display: 'flex', gap: 6 }}>
              {(item.statements || []).length < 4 && (
                <button
                  type="button"
                  className="wimp-btn wimp-btn-xs wimp-btn-soft"
                  onClick={() => {
                    const cur = [...(item.statements || [])];
                    while (cur.length < 4) cur.push({ text: '', answer: null });
                    onPatch({ statements: cur });
                  }}
                >
                  Chuẩn hóa đủ 4 ý a-d
                </button>
              )}
              {(item.statements || []).length < 6 && (
                <button
                  type="button"
                  className="wimp-btn wimp-btn-xs"
                  onClick={() => onPatch({ statements: [...(item.statements || []), { text: '', answer: null }] })}
                >
                  <IcoPlus size={12} /> Thêm ý
                </button>
              )}
            </div>
          </div>
          {(item.statements || []).map((st, sIdx) => (
            <div key={sIdx} className="wimp-tf-row" style={{ alignItems: 'flex-start' }}>
              <span style={{ fontWeight: 800, color: 'var(--wi-accent)', paddingTop: 7 }}>
                {'abcdef'[sIdx] || sIdx + 1})
              </span>
              <input
                type="text"
                className="wimp-input"
                style={{ flex: 1 }}
                value={st.text}
                onFocus={registerFocus({ kind: 'tf', idx: sIdx })}
                onChange={(e) =>
                  onPatch({
                    statements: (item.statements || []).map((x, j) =>
                      j === sIdx ? { ...x, text: e.target.value } : x
                    ),
                  })
                }
                placeholder={`Nội dung nhận định ${'abcdef'[sIdx] || sIdx + 1})...`}
              />
              <div className="wimp-tf-pills" style={{ paddingTop: 2 }}>
                <button
                  type="button"
                  className={`wimp-tf-btn ${st.answer === true ? 'active-true' : ''}`}
                  onClick={() =>
                    onPatch({
                      statements: (item.statements || []).map((x, j) => (j === sIdx ? { ...x, answer: true } : x)),
                    })
                  }
                >
                  Đúng
                </button>
                <button
                  type="button"
                  className={`wimp-tf-btn ${st.answer === false ? 'active-false' : ''}`}
                  onClick={() =>
                    onPatch({
                      statements: (item.statements || []).map((x, j) => (j === sIdx ? { ...x, answer: false } : x)),
                    })
                  }
                >
                  Sai
                </button>
                {(item.statements || []).length > 1 && (
                  <button
                    type="button"
                    className="wimp-btn wimp-btn-xs wimp-btn-danger"
                    title="Xóa ý này"
                    onClick={() =>
                      onPatch({ statements: (item.statements || []).filter((_, j) => j !== sIdx) })
                    }
                  >
                    <IcoTrash size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {normType === 'short_answer' && (
        <div className="wimp-grid-2">
          <div>
            <label className="wimp-field-label">Đáp án chuẩn (chính thức)</label>
            <input
              type="text"
              className="wimp-input"
              style={{ fontWeight: 800, color: 'var(--wi-ok)' }}
              value={item.answer || ''}
              onFocus={registerFocus({ kind: 'answer' })}
              onChange={(e) => onPatch({ answer: e.target.value, src: 'bạn nhập' })}
              placeholder="VD: 12,5 hoặc -3,2"
            />
          </div>
          <div>
            <label className="wimp-field-label">Các cách ghi chấp nhận thêm (ngăn cách bởi dấu ;)</label>
            <input
              type="text"
              className="wimp-input"
              value={acceptedText}
              onChange={(e) => {
                const arr = e.target.value
                  .split(/[;|\n]+/)
                  .map((s) => s.trim())
                  .filter(Boolean);
                onPatch({ accepted: arr });
              }}
              placeholder="VD: 12,5; 12.5; 25/2"
            />
          </div>
        </div>
      )}

      {/* 6. Lời giải chi tiết + hoàn tất */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <label className="wimp-field-label" style={{ margin: 0 }}>
            Lời giải / Hướng dẫn chi tiết
          </label>
          {item.explain && (
            <button
              type="button"
              className="wimp-btn wimp-btn-xs wimp-btn-soft"
              onClick={onAutoDetectFromExplain}
            >
              <IcoSparkles size={12} /> Dò đáp án từ lời giải
            </button>
          )}
        </div>
        <textarea
          className="wimp-textarea"
          rows={3}
          value={item.explain || ''}
          onFocus={registerFocus({ kind: 'explain' })}
          onChange={(e) => onPatch({ explain: e.target.value })}
          placeholder="Nhập lời giải chi tiết hoặc gợi ý cho học sinh..."
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button type="button" className="wimp-btn wimp-btn-primary wimp-btn-sm" onClick={onDone}>
          <IcoCheck size={13} /> Lưu &amp; Đóng trình sửa
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   COMPONENT CHÍNH: ExamImporter
   ============================================================ */
export default function ExamImporter({
  open = true,
  variant = 'page',
  isModal: isModalProp,
  classInfo = null,
  classes = [],
  allowBank = false,
  allowSoftExam = false,
  allowSendToMixer = true,
  onCreateSoftExam = null,
  onSaveToBank = null,
  onSendToMixer = null,
  onConfirm = null,
  onClose = null,
  defaultSubject = '',
  defaultGrade = '',
  defaultTitle = '',
  defaultDuration = '45',
  initialEnglishMode = false,
}) {
  const { user } = useAuth();
  const fileRef = useRef(null);
  const lastFileRef = useRef(null);
  const extractedTextRef = useRef('');
  const userPickedClassRef = useRef(false);
  const [pdfMeta, setPdfMeta] = useState(null);

  const [inputMode, setInputMode] = useState('file'); // 'file' | 'paste' | 'json'
  const [raw, setRaw] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [items, setItems] = useState([]);
  const [fileName, setFileName] = useState('');
  const [formulaCount, setFormulaCount] = useState(0);
  const [appendMode, setAppendMode] = useState('replace');
  const [quickAnswerStr, setQuickAnswerStr] = useState('');
  const [quickKeyNote, setQuickKeyNote] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [englishMode, setEnglishMode] = useState(Boolean(initialEnglishMode));
  const [openMixerModal, setOpenMixerModal] = useState(false);
  const [openWordEditor, setOpenWordEditor] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'p1' | 'p2' | 'p3' | 'img' | 'issue'
  const [searchTerm, setSearchTerm] = useState('');

  const [title, setTitle] = useState(defaultTitle || '');
  const [detectedSubject, setDetectedSubject] = useState(defaultSubject || classInfo?.subject || '');
  const [detectedGrade, setDetectedGrade] = useState(String(defaultGrade || classInfo?.grade || '12'));
  const [duration, setDuration] = useState(String(defaultDuration || '45'));
  const [classId, setClassId] = useState(classInfo?.id || classes[0]?.id || '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const isModal = Boolean(isModalProp ?? (Boolean(onClose) && variant !== 'page' && variant !== 'inline'));
  const canCreateExam = Boolean(onCreateSoftExam && (allowSoftExam || isModalProp || onConfirm));

  useEffect(() => {
    if (initialEnglishMode !== undefined) setEnglishMode(Boolean(initialEnglishMode));
  }, [initialEnglishMode]);

  useEffect(() => {
    if (!title && defaultTitle) setTitle(defaultTitle);
  }, [defaultTitle, title]);

  useEffect(() => {
    if (!detectedSubject && (defaultSubject || classInfo?.subject)) {
      setDetectedSubject(defaultSubject || classInfo?.subject);
    }
  }, [defaultSubject, classInfo?.subject, detectedSubject]);

  useEffect(() => {
    if (!userPickedClassRef.current && !classId && (classInfo?.id || classes[0]?.id)) {
      setClassId(classInfo?.id || classes[0]?.id);
    }
  }, [classInfo?.id, classes, classId]);

  /* Nạp văn bản dán hoặc JSON */
  const handlePasteTextChange = (textVal) => {
    setRaw(textVal);
    if (!textVal.trim()) {
      if (appendMode === 'replace') setItems([]);
      return;
    }

    const jx = extractJson(textVal);
    if (jx && jx.value !== undefined) {
      const ex = normalizeJsonExam(jx.value);
      if (ex) {
        const normalized = ex.questions.map((q, idx) => toUiQuestion(q, idx));
        setItems((prev) => (appendMode === 'append' ? [...prev, ...normalized] : normalized));
        if (ex.meta.title) setTitle((t) => t || String(ex.meta.title));
        if (ex.meta.duration) setDuration((d) => d || String(ex.meta.duration));
        setFormulaCount(normalized.reduce((s, q) => s + countFormulasInText(`${q.q} ${(q.options || []).join(' ')}`), 0));
        return;
      }
    }

    const res = parseLines(textToLines(textVal), []);
    const normalized = res.questions.map((q, idx) => toUiQuestion(q, idx));
    setFormulaCount(normalized.reduce((s, q) => s + countFormulasInText(`${q.q} ${(q.options || []).join(' ')}`), 0));
    setItems((prev) => (appendMode === 'append' ? [...prev, ...normalized] : normalized));
  };

  /* Đọc file .docx / .pdf / ảnh / .txt / .json */
  const processFile = async (f) => {
    if (!f) return;
    setBusy(true);
    setMsg('');
    lastFileRef.current = f;
    setPdfMeta(null);
    try {
      if (/\.doc$/i.test(f.name)) {
        throw new Error('File .doc đời cũ chưa hỗ trợ trực tiếp. Vui lòng mở bằng Word → Save As .docx rồi nạp lại.');
      }
      let newQuestions = [];
      let fCount = 0;

      if (/\.docx$/i.test(f.name)) {
        const { lines, extractedImages: imgs, formulaCount: docxFormulas } = await readDocx(f);
        extractedTextRef.current = (lines || []).map((l) => l.t).join('\n');
        const res = parseLines(lines, imgs);
        newQuestions = res.questions.map((q, idx) => toUiQuestion(q, idx));
        const textFormulas = newQuestions.reduce((s, q) => s + countFormulasInText(`${q.q} ${(q.options || []).join(' ')}`), 0);
        fCount = Math.max(docxFormulas, textFormulas);
      } else if (/\.pdf$/i.test(f.name)) {
        setMsg('Đang tái cấu trúc dòng, công thức, gạch chân & bảng đáp án từ PDF...');
        const pdfRes = await readExamPdfFile(f, { maxPages: 60, ocrFallback: true });
        extractedTextRef.current = pdfRes.text || '';
        setPdfMeta({
          pages: pdfRes.pages,
          totalPdfPages: pdfRes.totalPdfPages,
          usedOcr: pdfRes.usedOcr,
          scannedCount: pdfRes.scannedPages.length,
        });
        if (!pdfRes.text.replace(/\s/g, '')) {
          throw new Error('PDF này là bản scan ảnh chưa tách được chữ. Bấm "Quét AI chuẩn xác" hoặc dùng file Word (.docx).');
        }
        const res = parseLines(pdfRes.lines, []);
        newQuestions = res.questions.map((q, idx) => toUiQuestion(q, idx));
        fCount = newQuestions.reduce((s, q) => s + countFormulasInText(`${q.q} ${(q.options || []).join(' ')}`), 0);
        if (pdfRes.usedOcr) {
          setMsg(`Đã tự động OCR ${pdfRes.scannedPages.length} trang ảnh & tách ${newQuestions.length} câu. Nếu công thức phức tạp, hãy bấm "Quét AI chuẩn xác".`);
        }
      } else if (/^image\//i.test(f.type) || /\.(jpe?g|png|webp|bmp)$/i.test(f.name)) {
        setMsg('Đang OCR ảnh đề thi...');
        const dataUrl = await fileToCompressedDataUrl(f, { maxWidth: 1800, quality: 0.9 });
        const ocrRes = await ocrImages([dataUrl]);
        extractedTextRef.current = ocrRes.text || '';
        if (!ocrRes.ok) {
          throw new Error('OCR ảnh chưa rõ chữ. Hãy bấm "Quét AI chuẩn xác" để AI Vision đọc trực tiếp ảnh.');
        }
        const res = parseLines(textToLines(ocrRes.text), []);
        newQuestions = res.questions.map((q, idx) => toUiQuestion(q, idx));
        fCount = newQuestions.reduce((s, q) => s + countFormulasInText(`${q.q} ${(q.options || []).join(' ')}`), 0);
      } else {
        const text = await f.text();
        extractedTextRef.current = text;
        const jx = extractJson(text);
        if (jx?.value) {
          const ex = normalizeJsonExam(jx.value);
          if (ex) newQuestions = ex.questions.map((q, idx) => toUiQuestion(q, idx));
        }
        if (!newQuestions.length) {
          const res = parseLines(textToLines(text), []);
          newQuestions = res.questions.map((q, idx) => toUiQuestion(q, idx));
        }
        fCount = newQuestions.reduce((s, q) => s + countFormulasInText(`${q.q} ${(q.options || []).join(' ')}`), 0);
      }

      setFormulaCount(fCount);
      setFileName(f.name);
      if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''));

      const corpusText = newQuestions.map((q) => `${q.q} ${(q.options || []).join(' ')}`).join('\n');
      const detected = detectExamSubjectAndGrade({
        fileName: f.name,
        text: corpusText,
        questions: newQuestions,
      });
      if (detected.subject) setDetectedSubject(detected.subject);
      if (detected.grade) setDetectedGrade(String(detected.grade));

      setItems((prev) => {
        if (appendMode === 'append' && prev.length > 0) {
          return [...prev, ...newQuestions.map((q, idx) => ({ ...q, id: `${q.id}_ap_${Date.now()}_${idx}` }))];
        }
        return newQuestions;
      });
      setFilterTab('all');
    } catch (err) {
      setFileName(f.name);
      setMsg(err.message || 'Không đọc được file này. Vui lòng dùng file Word (.docx), PDF hoặc TXT.');
    } finally {
      setBusy(false);
    }
  };

  /* Quét sâu lại toàn bộ đề / PDF scan bằng AI Vision */
  const handleAiDeepScan = async () => {
    const f = lastFileRef.current;
    const textCtx = String(extractedTextRef.current || raw || '').trim();
    if (!f && !textCtx) {
      setMsg('Hãy chọn file hoặc dán nội dung đề trước khi quét AI.');
      return;
    }
    setBusy(true);
    setMsg('AI đang đọc sâu cấu trúc 3 phần, công thức toán/hóa & đáp án...');
    try {
      const filesForAi = [];
      if (f && (/\.pdf$/i.test(f.name) || /^image\//i.test(f.type) || /\.(jpe?g|png|webp)$/i.test(f.name))) {
        try {
          filesForAi.push(await readFile(f));
        } catch { /* fallback text below */ }
      }
      if (textCtx) {
        filesForAi.push({ name: f?.name || 'noi-dung-de.txt', kind: 'text', text: textCtx });
      }
      if (!filesForAi.length) {
        throw new Error('Không đọc được dữ liệu gửi cho AI.');
      }

      const subj = detectedSubject || defaultSubject || classInfo?.subject || 'Toán học';
      const gr = String(detectedGrade || defaultGrade || classInfo?.grade || '12');

      const aiRes = await runWithCredit(
        { userId: user?.uid, cost: 2, reason: 'Quét chuẩn PDF/Đề bằng AI' },
        () => digitizeExam({
          files: filesForAi,
          subject: subj,
          grade: gr,
          duration: Number(duration) || 45,
          explain: true,
        })
      );

      const aiQs = (aiRes?.questions || []).map((q, idx) => toUiQuestion({
        ...q,
        id: `ai_scan_${Date.now()}_${idx}`,
      }, idx));
      if (!aiQs.length) throw new Error('AI chưa tách được câu hỏi từ đề này.');

      setFormulaCount(aiQs.reduce((s, q) => s + countFormulasInText(`${q.q} ${(q.options || []).join(' ')}`), 0));
      setItems((prev) => {
        if (prev.length === aiQs.length) {
          return aiQs.map((nq, idx) => ({
            ...nq,
            image: nq.image || prev[idx]?.image || null,
            images: nq.images?.length ? nq.images : prev[idx]?.images || [],
          }));
        }
        return aiQs;
      });
      setFilterTab('all');
      setMsg(`AI đã phân tích chuẩn xác ${aiQs.length} câu hỏi!`);
    } catch (err) {
      setMsg(`Quét AI lỗi: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (f) processFile(f);
  };

  /* Nhập nhanh bảng đáp án cho CẢ 3 PHẦN */
  const handleQuickAnswerApply = (val, immediateText) => {
    const str = immediateText !== undefined ? immediateText : val;
    if (immediateText === undefined) setQuickAnswerStr(str);
    if (!String(str || '').trim() || items.length === 0) {
      setQuickKeyNote('');
      return;
    }
    const { updates, counts } = parsePastedAnswerKey(str, items);
    if (updates.size === 0) {
      setQuickKeyNote('Chưa khớp câu nào — thử mẫu: "1A 2B 3C" hoặc dán theo từng Phần I / II / III.');
      return;
    }
    setItems((arr) =>
      arr.map((it, idx) => {
        const u = updates.get(idx);
        if (!u) return it;
        if (u.type === 'true_false' && Array.isArray(u.tfAns)) {
          const baseSt = (it.statements || []).length ? it.statements : [0, 1, 2, 3].map(() => ({ text: '', answer: null }));
          return {
            ...it,
            type: 'true_false',
            statements: baseSt.map((s, sIdx) => ({ ...s, answer: u.tfAns[sIdx] ?? s.answer })),
            src: u.src,
          };
        }
        if (u.type === 'short_answer') {
          return { ...it, type: 'short_answer', answer: u.answer, src: u.src };
        }
        return { ...it, type: 'single_choice', correct: u.correct, src: u.src };
      })
    );
    const parts = [];
    if (counts.p1) parts.push(`Phần I (${counts.p1})`);
    if (counts.p2) parts.push(`Đúng/Sai (${counts.p2})`);
    if (counts.p3) parts.push(`Ngắn (${counts.p3})`);
    setQuickKeyNote(`Đã gán đáp án: ${parts.join(' • ')}`);
  };

  const handleLoadSample = () => {
    setFileName('De-mau-3-phan-GDPT-2025.docx');
    setTitle((t) => t || 'Đề minh họa chuẩn 3 phần (GDPT 2025)');
    setDetectedSubject('Hóa học');
    setDetectedGrade('12');
    setFormulaCount(14);
    setItems(SAMPLE_GDPT2025_QUESTIONS.map((q, idx) => toUiQuestion(q, idx)));
    setFilterTab('all');
    setMsg('Đã nạp bộ câu hỏi mẫu chuẩn 3 phần để xem thử.');
  };

  /* Thêm câu hỏi thủ công */
  const handleAddManualQuestion = (targetType = 'single_choice') => {
    const norm = normalizeImporterType(targetType);
    const sameTypeCount = items.filter((q) => normalizeImporterType(q.type) === norm).length;
    const newItem = toUiQuestion(
      {
        id: `manual_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        num: sameTypeCount + 1,
        type: norm,
        level: norm === 'short_answer' ? 'vd' : norm === 'true_false' ? 'th' : 'nb',
        q: '',
        options: norm === 'single_choice' ? ['', '', '', ''] : [],
        correct: norm === 'single_choice' ? 0 : -1,
        statements:
          norm === 'true_false'
            ? [
                { text: '', answer: true },
                { text: '', answer: false },
                { text: '', answer: true },
                { text: '', answer: false },
              ]
            : [],
        answer: '',
        points: norm === 'true_false' ? 1 : 0.25,
        src: 'thêm thủ công',
      },
      items.length
    );
    setItems((arr) => [...arr, newItem]);
    setEditingId(newItem.id);
    setFilterTab('all');
  };

  /* Đánh lại STT 1..N theo từng phần */
  const handleRenumberByPart = () => {
    let n1 = 0;
    let n2 = 0;
    let n3 = 0;
    setItems((arr) =>
      arr.map((it) => {
        const t = normalizeImporterType(it.type);
        if (t === 'true_false') return { ...it, num: ++n2 };
        if (t === 'short_answer') return { ...it, num: ++n3 };
        return { ...it, num: ++n1 };
      })
    );
    setMsg('Đã đánh lại số thứ tự 1..N theo từng Phần I, II, III.');
  };

  /* Chia điểm tự động: Chuẩn GDPT 2025 (0.25 / 1.0 / 0.25) hoặc chia đều thang 10 */
  const handleDistributePoints = () => {
    if (!items.length) return;
    const p1 = items.filter((q) => normalizeImporterType(q.type) === 'single_choice').length;
    const p2 = items.filter((q) => normalizeImporterType(q.type) === 'true_false').length;
    const p3 = items.filter((q) => normalizeImporterType(q.type) === 'short_answer').length;
    const gdptTotal = p1 * 0.25 + p2 * 1 + p3 * 0.25;
    if (Math.abs(gdptTotal - 10) < 0.01) {
      setItems((arr) =>
        arr.map((q) => {
          const t = normalizeImporterType(q.type);
          return { ...q, points: t === 'true_false' ? 1 : 0.25 };
        })
      );
      setMsg('Đã áp dụng thang điểm chuẩn BGD 2025: Phần I = 0,25đ • Phần II = 1,0đ • Phần III = 0,25đ (Tổng 10đ).');
      return;
    }
    const perQ = Math.round((10 / items.length) * 100) / 100;
    setItems((arr) => arr.map((q) => ({ ...q, points: perQ })));
    setMsg(`Đã chia đều ${(perQ * items.length).toFixed(2)} điểm cho ${items.length} câu (~${perQ}đ/câu).`);
  };

  /* Tự dò đáp án từ lời giải & phân tích mức độ toàn bộ đề */
  const autoDetectOne = (it) => {
    const normType = normalizeImporterType(it.type);
    const nextLv = it.hadLevelTag ? it.level : classifySmartLevel(it.q, normType, it.explain);
    let nextCorrect = it.correct;
    let nextAnswer = it.answer;
    let nextStatements = it.statements;
    let nextSrc = it.src;
    let fixed = false;

    if (normType === 'single_choice' && (it.correct < 0 || it.correct === undefined)) {
      const fromExp = extractMcqAnswerFromExplain(it.explain || '');
      if (fromExp >= 0 && fromExp < (it.options || []).length) {
        nextCorrect = fromExp;
        nextSrc = 'dò từ lời giải';
        fixed = true;
      }
    } else if (normType === 'short_answer' && !String(it.answer || '').trim() && it.explain) {
      const expMatch = it.explain.match(/(?:đáp\s*án|đa|đáp\s*số|kết\s*quả|kq|=)\s*[:=]?\s*([+-]?\d[\d.,]*(?:\/\d+)?)/i);
      if (expMatch) {
        nextAnswer = expMatch[1].replace(/[.,]+$/, '');
        nextSrc = 'dò từ lời giải';
        fixed = true;
      }
    } else if (normType === 'true_false' && Array.isArray(it.statements)) {
      const missing = it.statements.some((s) => s.answer !== true && s.answer !== false);
      if (missing && it.explain) {
        const expTf = readTf(fold(it.explain));
        if (expTf) {
          nextStatements = it.statements.map((s, idx) => ({ ...s, answer: expTf[idx] ?? s.answer }));
          nextSrc = 'dò từ lời giải';
          fixed = true;
        }
      }
    }

    return {
      updated: {
        ...it,
        type: normType,
        level: nextLv,
        correct: nextCorrect,
        answer: nextAnswer,
        statements: nextStatements,
        src: nextSrc,
      },
      fixed,
    };
  };

  const handleSmartAnalyzeAll = () => {
    let fixedAns = 0;
    setItems((arr) =>
      arr.map((it) => {
        const { updated, fixed } = autoDetectOne(it);
        if (fixed) fixedAns++;
        return updated;
      })
    );
    setMsg(
      fixedAns > 0
        ? `Đã phân tích mức độ & dò tự động được ${fixedAns} đáp án từ lời giải!`
        : 'Đã cập nhật mức độ nhận thức (NB/TH/VD/VDC) cho toàn bộ câu hỏi!'
    );
  };

  /* Bác sĩ AI bổ sung đủ 3 phần */
  const handleAiComplete3Parts = async () => {
    if (!items.length) {
      setMsg('Vui lòng nạp câu hỏi trước khi nhờ AI bổ sung.');
      return;
    }
    const needP2 = Math.max(0, 4 - stats.p2);
    const needP3 = Math.max(0, 6 - stats.p3);
    if (needP2 === 0 && needP3 === 0) {
      setMsg('Đề đã có đủ cấu trúc chuẩn 3 phần GDPT 2025!');
      return;
    }

    setBusy(true);
    setMsg('AI đang biên soạn bổ sung Phần II & Phần III...');
    try {
      const sampleStems = items.slice(0, 5).map((q, i) => `${i + 1}. ${q.q || ''}`).join('\n');
      const subj = detectedSubject || defaultSubject || classInfo?.subject || 'Hóa học';
      const gr = String(detectedGrade || defaultGrade || classInfo?.grade || '12');

      const prompt = `Bạn là chuyên gia ra đề ${subj} lớp ${gr} chuẩn GDPT 2025 của Bộ GD&ĐT.
Dưới đây là một số câu hỏi hiện có:
${sampleStems}

Hãy bổ sung:
- ${needP2} câu Phần II (Đúng/Sai, 4 nhận định a-d boolean)
- ${needP3} câu Phần III (Trả lời ngắn, đáp án số rõ ràng)

TRẢ VỀ DUY NHẤT JSON HỢP LỆ:
{
  "part2": [{ "q": "...", "statements": [{"text": "...", "answer": true}, ...], "level": "th", "explain": "..." }],
  "part3": [{ "q": "...", "answer": "12,5", "level": "vd", "explain": "..." }]
}`;

      const aiRes = await runWithCredit(
        { userId: user?.uid, cost: 2, reason: 'AI bổ sung câu hỏi đề nhập' },
        () => askAI(prompt)
      );
      const text = typeof aiRes === 'string' ? aiRes : aiRes?.text || '';
      const parsed = parseExamJsonSafe(text);
      const newP2 = (parsed?.part2 || []).map((q, idx) =>
        toUiQuestion({ ...q, id: `ai_p2_${Date.now()}_${idx}`, num: stats.p2 + idx + 1, type: 'true_false', points: 1 })
      );
      const newP3 = (parsed?.part3 || []).map((q, idx) =>
        toUiQuestion({ ...q, id: `ai_p3_${Date.now()}_${idx}`, num: stats.p3 + idx + 1, type: 'short_answer', points: 0.25 })
      );
      if (!newP2.length && !newP3.length) {
        throw new Error('AI chưa trả về JSON đúng cấu trúc. Vui lòng thử lại.');
      }
      setItems((prev) => [...prev, ...newP2, ...newP3]);
      setMsg(`AI đã bổ sung ${newP2.length} câu Phần II và ${newP3.length} câu Phần III!`);
    } catch (err) {
      setMsg(`Lỗi AI bổ sung đề: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  /* Chuyển đổi định dạng câu hỏi an toàn */
  const convertQuestionType = (id, targetType) => {
    const normTarget = normalizeImporterType(targetType);
    setItems((arr) =>
      arr.map((it) => {
        if (it.id !== id) return it;
        const curType = normalizeImporterType(it.type);
        if (curType === normTarget) return it;

        if (normTarget === 'true_false') {
          let nextSt = Array.isArray(it.statements) && it.statements.length ? [...it.statements] : [];
          if (!nextSt.length && Array.isArray(it.options) && it.options.length) {
            nextSt = it.options.slice(0, 4).map((o, idx) => ({
              text: String(o || ''),
              answer: it.correct >= 0 ? idx === it.correct : null,
            }));
          }
          while (nextSt.length < 4) nextSt.push({ text: '', answer: null });
          return {
            ...it,
            type: 'true_false',
            statements: nextSt,
            points: 1,
            warns: [],
            src: it.src || 'chuyển dạng thủ công',
          };
        }

        if (normTarget === 'short_answer') {
          let nextAns = String(it.answer || '').trim();
          if (!nextAns && it.explain) {
            const m = it.explain.match(/(?:đáp\s*án|đa|đáp\s*số|kết\s*quả|kq)\s*[:=]\s*([+-]?\d[\d.,]*(?:\/\d+)?)/i);
            if (m) nextAns = m[1];
          }
          return {
            ...it,
            type: 'short_answer',
            answer: nextAns,
            accepted: nextAns ? [...new Set([nextAns, nextAns.replace(',', '.'), nextAns.replace('.', ',')])] : [],
            points: 0.25,
            warns: [],
            src: it.src || 'chuyển dạng thủ công',
          };
        }

        // Chuyển sang Trắc nghiệm nhiều lựa chọn
        let nextOpts = Array.isArray(it.options) && it.options.length >= 2 ? [...it.options] : [];
        let nextCorrect = it.correct >= 0 ? it.correct : -1;
        if (!nextOpts.length && Array.isArray(it.statements) && it.statements.length) {
          nextOpts = it.statements.slice(0, 6).map((s) => String(s.text || ''));
          const trueIdx = it.statements.findIndex((s) => s.answer === true);
          if (trueIdx >= 0) nextCorrect = trueIdx;
        }
        while (nextOpts.length < 4) nextOpts.push('');
        return {
          ...it,
          type: 'single_choice',
          options: nextOpts,
          correct: nextCorrect,
          points: 0.25,
          warns: [],
          src: it.src || 'chuyển dạng thủ công',
        };
      })
    );
  };

  /* Patch, nhân bản, di chuyển thứ tự, upload ảnh */
  const patch = (id, p) => setItems((arr) => arr.map((it) => (it.id === id ? { ...it, ...p } : it)));
  const remove = (id) => {
    if (editingId === id) setEditingId(null);
    setItems((arr) => arr.filter((it) => it.id !== id));
  };
  const duplicateQuestion = (id) => {
    setItems((arr) => {
      const idx = arr.findIndex((it) => it.id === id);
      if (idx < 0) return arr;
      const copy = {
        ...arr[idx],
        id: `dup_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        num: Number(arr[idx].num || idx + 1) + 1,
      };
      const out = [...arr];
      out.splice(idx + 1, 0, copy);
      return out;
    });
  };
  const moveQuestion = (id, dir) => {
    setItems((arr) => {
      const idx = arr.findIndex((it) => it.id === id);
      const nextIdx = idx + dir;
      if (idx < 0 || nextIdx < 0 || nextIdx >= arr.length) return arr;
      const out = [...arr];
      const [moved] = out.splice(idx, 1);
      out.splice(nextIdx, 0, moved);
      return out;
    });
  };

  const handleUploadQuestionImage = async (id, file) => {
    if (!file) return;
    try {
      const dataUrl = await fileToCompressedDataUrl(file, { maxW: 900, quality: 0.75 });
      if (!dataUrl) return;
      setItems((arr) =>
        arr.map((it) => {
          if (it.id !== id) return it;
          const prevImgs = Array.isArray(it.images) && it.images.length ? it.images : it.image ? [it.image] : [];
          const nextImgs = [...prevImgs, dataUrl];
          return { ...it, image: nextImgs[0], images: nextImgs };
        })
      );
    } catch (err) {
      setMsg(err?.message || 'Không đọc được hình ảnh.');
    }
  };

  const handleUploadOptionImage = async (id, oIdx, file) => {
    if (!file) return;
    try {
      const dataUrl = await fileToCompressedDataUrl(file, { maxW: 600, quality: 0.75 });
      if (!dataUrl) return;
      setItems((arr) =>
        arr.map((it) => {
          if (it.id !== id) return it;
          return { ...it, optionImages: { ...(it.optionImages || {}), [oIdx]: dataUrl } };
        })
      );
    } catch (err) {
      setMsg(err?.message || 'Không đọc được hình ảnh phương án.');
    }
  };

  /* Thống kê */
  const stats = useMemo(() => {
    let p1 = 0;
    let p2 = 0;
    let p3 = 0;
    let hasAnswer = 0;
    let hasExplain = 0;
    let imgCount = 0;
    const lv = { nb: 0, th: 0, vd: 0, vdc: 0 };

    items.forEach((it) => {
      const t = normalizeImporterType(it.type);
      if (t === 'true_false') {
        p2++;
        if ((it.statements || []).length === 4 && it.statements.every((s) => s.answer === true || s.answer === false)) {
          hasAnswer++;
        }
      } else if (t === 'short_answer') {
        p3++;
        if (String(it.answer || '').trim()) hasAnswer++;
      } else {
        p1++;
        if (it.correct >= 0 && it.correct < (it.options || []).length) hasAnswer++;
      }
      if (it.explain?.trim()) hasExplain++;
      if (it.image) imgCount++;
      const lKey = (it.level || 'nb').toLowerCase();
      lv[lKey] = (lv[lKey] || 0) + 1;
    });

    return { total: items.length, p1, p2, p3, hasAnswer, hasExplain, imgCount, lv };
  }, [items]);

  const checked = useMemo(() => items.map((it) => ({ it, issues: issuesOf(it) })), [items]);
  const issueCount = useMemo(() => checked.filter((c) => c.issues.length > 0).length, [checked]);

  const filteredChecked = useMemo(() => {
    let list = checked;
    if (filterTab === 'p1') list = list.filter(({ it }) => normalizeImporterType(it.type) === 'single_choice');
    else if (filterTab === 'p2') list = list.filter(({ it }) => normalizeImporterType(it.type) === 'true_false');
    else if (filterTab === 'p3') list = list.filter(({ it }) => normalizeImporterType(it.type) === 'short_answer');
    else if (filterTab === 'img') list = list.filter(({ it }) => Boolean(it.image));
    else if (filterTab === 'issue') list = list.filter(({ issues }) => issues.length > 0);

    const kw = fold(searchTerm.trim());
    if (kw) {
      list = list.filter(({ it }) => {
        const hay = fold(`${it.num} ${it.q} ${(it.options || []).join(' ')} ${(it.statements || []).map((s) => s.text).join(' ')} ${it.topic || ''}`);
        return hay.includes(kw);
      });
    }
    return list;
  }, [checked, filterTab, searchTerm]);

  if (!open) return null;

  /* Chuẩn hóa đầu ra gửi lên Ngân hàng / Trộn đề / Tạo đề */
  const buildNormalizedQuestions = (sourceList = items) =>
    sourceList.map((it) => {
      const normType = normalizeImporterType(it.type);
      const resolvedSubject = detectedSubject || defaultSubject || classInfo?.subject || 'Toán học';
      const resolvedGrade = Number(detectedGrade || defaultGrade || classInfo?.grade || 12) || 12;
      const meta = {
        ...(it.topic ? { topic: it.topic } : {}),
        level: it.level || 'nb',
        ...(it.image ? { image: it.image } : {}),
        ...(Array.isArray(it.images) && it.images.length ? { images: it.images } : {}),
        ...(it.optionImages ? { optionImages: it.optionImages } : {}),
        subject: resolvedSubject,
        grade: resolvedGrade,
      };
      if (normType === 'true_false') {
        return {
          ...meta,
          type: 'true_false',
          q: it.q,
          statements: (it.statements || []).map((x) => ({ text: x.text, answer: x.answer === true })),
          points: Number(it.points) || 1,
          explain: it.explain || '',
        };
      }
      if (normType === 'short_answer') {
        const rawAns = String(it.answer || '').trim();
        const vi = rawAns.replace('.', ',');
        const customAccepted = Array.isArray(it.accepted) ? it.accepted : [];
        return {
          ...meta,
          type: 'short_answer',
          q: it.q,
          answer: vi,
          accepted: [...new Set([rawAns, vi, vi.replace(',', '.'), ...customAccepted])].filter(Boolean),
          points: Number(it.points) || 0.25,
          explain: it.explain || '',
        };
      }
      return {
        ...meta,
        type: 'single_choice',
        q: it.q,
        options: it.options || [],
        correct: it.correct >= 0 ? it.correct : 0,
        points: Number(it.points) || 0.25,
        explain: it.explain || '',
        ...(it.pg ? { groupId: it.pg, passage: it.passage, instruction: it.instruction } : {}),
      };
    });

  const handleSaveBankClick = async () => {
    const listToSave = buildNormalizedQuestions();
    if (!listToSave.length) {
      setMsg('Chưa có câu hỏi nào để lưu vào ngân hàng.');
      return;
    }
    if (!onSaveToBank) return;
    setBusy(true);
    setMsg('');
    try {
      await onSaveToBank(listToSave);
      setMsg(`Đã lưu ${listToSave.length} câu hỏi vào Ngân hàng thành công!`);
    } catch (e) {
      setMsg(e.message || 'Lỗi khi lưu vào ngân hàng.');
    } finally {
      setBusy(false);
    }
  };

  const handleExportRepairedWord = async () => {
    if (!items.length) {
      setMsg('Chưa có câu hỏi nào để xuất file Word.');
      return;
    }
    try {
      const filename = await exportToWord({
        examTitle: title || fileName.replace(/\.[^.]+$/, '') || 'Đề kiểm tra',
        subject: detectedSubject || defaultSubject || classInfo?.subject || 'Toán học',
        duration: Number(duration) || 45,
        code: '101',
        questions: buildNormalizedQuestions(items),
        includeAnswers: true,
        headerInfo: {
          deptName: 'SỞ GIÁO DỤC VÀ ĐÀO TẠO',
          schoolName: 'TRƯỜNG THPT',
          examName: (title || fileName.replace(/\.[^.]+$/, '') || 'ĐỀ KIỂM TRA ĐÁNH GIÁ CHUẨN GDPT 2025').toUpperCase(),
          subject: detectedSubject || defaultSubject || classInfo?.subject || 'Toán học',
          grade: String(detectedGrade || defaultGrade || classInfo?.grade || '12'),
          schoolYear: '2026 - 2027',
          duration: Number(duration) || 45,
        },
      });
      setMsg(`Đã xuất file Word (.docx) thành công: ${filename}`);
    } catch (err) {
      setMsg(`Lỗi xuất Word: ${err.message}`);
    }
  };

  const handleSendToMixerClick = () => {
    const listToMix = buildNormalizedQuestions(items);
    if (!listToMix.length) {
      setMsg('Vui lòng nạp đề trước khi đưa vào trộn đề.');
      return;
    }
    if (typeof onSendToMixer === 'function') {
      onSendToMixer({
        title: title || fileName.replace(/\.[^.]+$/, '') || 'Đề kiểm tra',
        subject: detectedSubject || defaultSubject || classInfo?.subject || 'Toán học',
        grade: Number(detectedGrade || defaultGrade || classInfo?.grade || 12) || 12,
        duration: Number(duration) || 45,
        sourceFile: fileName || 'Đề vừa nạp',
        questions: listToMix,
        stats,
      });
      return;
    }
    setOpenMixerModal(true);
  };

  const handleCreateExamClick = async () => {
    const listToCreate = buildNormalizedQuestions(items);
    if (!listToCreate.length) {
      setMsg('Chưa có câu hỏi nào để tạo đề.');
      return;
    }
    const targetClassId = userPickedClassRef.current
      ? classId
      : classId || classInfo?.id || classes[0]?.id || '';
    const targetClassObj = (classes || []).find((c) => c.id === targetClassId) || null;
    const resolvedSubject = detectedSubject || defaultSubject || targetClassObj?.subject || classInfo?.subject || 'Toán học';
    const resolvedGrade = Number(detectedGrade || defaultGrade || targetClassObj?.grade || classInfo?.grade || 12) || 12;
    const payload = {
      title: title || fileName.replace(/\.[^.]+$/, '') || 'Đề nhập từ file Word',
      duration: Number(duration) > 0 ? Number(duration) : 45,
      classId: targetClassId,
      isDraft: !targetClassId,
      subject: resolvedSubject,
      grade: resolvedGrade,
      questions: listToCreate,
      sourceFile: fileName || null,
    };

    if (typeof onConfirm === 'function' && !onCreateSoftExam) {
      onConfirm(payload);
      return;
    }
    if (!onCreateSoftExam) return;

    setBusy(true);
    setMsg('');
    try {
      await onCreateSoftExam(payload);
      setMsg(
        targetClassId
          ? `Đã tạo đề thành công từ ${listToCreate.length} câu hỏi!`
          : `Đã lưu bản nháp (${listToCreate.length} câu hỏi) vào Kho đề!`
      );
    } catch (e) {
      setMsg(e.message || 'Lỗi khi tạo đề.');
    } finally {
      setBusy(false);
    }
  };

  const studioShell = (
    <div className={`wimp-scope ${isModal ? 'wimp-modal' : 'wimp-page'}`}>
      {/* ===== HEADER CHUẨN TEACHER STUDIO v2 ===== */}
      <header className="wimp-header">
        <div className="wimp-brand">
          <div className="wimp-brand-icon">
            <IcoDoc size={20} />
          </div>
          <div>
            <h2 className="wimp-brand-title">
              <span>{englishMode ? 'Nhập Đề Tiếng Anh (Word / PDF)' : 'Studio Nhập Đề Word · GDPT 2025'}</span>
              <span className="wimp-brand-pill">3 Phần • OMML • Ảnh • Sửa chi tiết</span>
            </h2>
            <div className="wimp-brand-sub">
              Tự phân tách Phần I (Trắc nghiệm), Phần II (Đúng/Sai a-d), Phần III (Trả lời ngắn) và giữ nguyên công thức, hình vẽ
            </div>
          </div>
        </div>

        <div className="wimp-header-actions">
          <button
            type="button"
            className={`wimp-btn wimp-btn-sm ${englishMode ? 'wimp-btn-accent' : ''}`}
            onClick={() => setEnglishMode((v) => !v)}
          >
            <IcoGlobe size={14} /> {englishMode ? 'Đang bật: Tiếng Anh' : 'Đề Tiếng Anh'}
          </button>
          <button type="button" className="wimp-btn wimp-btn-sm" onClick={() => setOpenWordEditor(true)}>
            <IcoEdit size={13} /> Soạn A4 giống Word
          </button>
          <button type="button" className="wimp-btn wimp-btn-sm" onClick={() => setShowGuide(true)}>
            <IcoInfo size={13} /> Hướng dẫn định dạng
          </button>
          {onClose && (
            <button type="button" className="wimp-btn wimp-btn-sm" onClick={onClose} title="Đóng cửa sổ">
              <IcoClose size={14} /> Đóng
            </button>
          )}
        </div>
      </header>

      {busy && (
        <div className="wimp-progress-track">
          <div className="wimp-progress-fill" style={{ width: '68%' }} />
        </div>
      )}

      {/* ===== BODY 2 CỘT ===== */}
      <div className="wimp-body">
        {/* CỘT TRÁI: NGUỒN ĐỀ + THÔNG TIN + BẢNG ĐÁP ÁN */}
        <aside className="wimp-left">
          {/* 1. Nguồn đề: File Word / Dán văn bản / JSON */}
          <div className="wimp-panel">
            <div className="wimp-panel-head">
              <span className="wimp-panel-title">
                <IcoUpload size={14} /> Nguồn nạp đề thi
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  type="button"
                  className={`wimp-btn wimp-btn-xs ${appendMode === 'replace' ? 'wimp-btn-soft' : ''}`}
                  onClick={() => setAppendMode('replace')}
                >
                  Thay mới
                </button>
                <button
                  type="button"
                  className={`wimp-btn wimp-btn-xs ${appendMode === 'append' ? 'wimp-btn-soft' : ''}`}
                  onClick={() => setAppendMode('append')}
                >
                  Nối thêm
                </button>
              </div>
            </div>

            <div className="wimp-seg">
              {[
                { id: 'file', label: 'File .docx/.pdf' },
                { id: 'paste', label: 'Dán văn bản' },
                { id: 'json', label: 'Dán JSON AI' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`wimp-seg-btn ${inputMode === m.id ? 'active' : ''}`}
                  onClick={() => setInputMode(m.id)}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {inputMode === 'file' ? (
              <>
                <label
                  className={`wimp-drop ${dragOver ? 'drag' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    const f = e.dataTransfer?.files?.[0];
                    if (f) processFile(f);
                  }}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".docx,.doc,.pdf,.txt,.md,.json,.png,.jpg,.jpeg,.webp"
                    hidden
                    onChange={onFileChange}
                    disabled={busy}
                  />
                  <div className="wimp-drop-icon">
                    <IcoUpload size={18} />
                  </div>
                  <div className="wimp-drop-title">
                    {busy ? 'Đang giải mã công thức & cấu trúc đề...' : 'Chọn hoặc kéo thả file Word / PDF / Ảnh'}
                  </div>
                  <div className="wimp-drop-sub">
                    Hỗ trợ .docx (MathType, OMML, bảng, ảnh), .pdf (text, 2 cột &amp; OCR), ảnh đề, .txt, .json
                  </div>
                </label>

                {fileName && (
                  <div className="wimp-file-chip">
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {fileName}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--wi-ink2)' }}>
                        {items.length} câu • {formulaCount} công thức • {stats.imgCount} ảnh
                        {pdfMeta ? ` • ${pdfMeta.pages} trang${pdfMeta.usedOcr ? ' (OCR)' : ''}` : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                      <button
                        type="button"
                        className="wimp-btn wimp-btn-xs wimp-btn-soft"
                        onClick={handleAiDeepScan}
                        disabled={busy}
                        title="Dùng AI Vision rà soát lại toàn bộ câu hỏi, công thức và 3 phần GDPT 2025 (2 credit)"
                      >
                        Quét AI
                      </button>
                      <button type="button" className="wimp-btn wimp-btn-xs" onClick={() => fileRef.current?.click()}>
                        Đổi file
                      </button>
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <button type="button" className="wimp-btn wimp-btn-sm" onClick={downloadWordTemplateDocx}>
                    <IcoDownload size={13} /> Tải Word mẫu
                  </button>
                  <button type="button" className="wimp-btn wimp-btn-sm wimp-btn-soft" onClick={handleLoadSample}>
                    <IcoBolt size={13} /> Nạp đề mẫu 2025
                  </button>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <textarea
                  className="wimp-textarea"
                  rows={8}
                  value={raw}
                  onChange={(e) => handlePasteTextChange(e.target.value)}
                  placeholder={
                    inputMode === 'json'
                      ? 'Dán đoạn JSON câu hỏi do AI tạo vào đây (tự sửa lỗi ngoặc/xuống dòng)...'
                      : 'Dán toàn bộ đề từ Word/PDF (có thể gồm PHẦN I, PHẦN II Đúng/Sai a-d, PHẦN III Trả lời ngắn và Bảng đáp án)...'
                  }
                />
                {raw && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                    {inputMode === 'paste' && (
                      <button
                        type="button"
                        className="wimp-btn wimp-btn-xs wimp-btn-soft"
                        onClick={handleAiDeepScan}
                        disabled={busy}
                      >
                        Quét AI chuẩn xác (2cr)
                      </button>
                    )}
                    <button
                      type="button"
                      className="wimp-btn wimp-btn-xs wimp-btn-danger"
                      onClick={() => {
                        setRaw('');
                        extractedTextRef.current = '';
                        if (appendMode === 'replace') setItems([]);
                      }}
                    >
                      Xóa nội dung đã dán
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Thông tin đề thi & Lớp áp dụng */}
          <div className="wimp-panel">
            <div className="wimp-panel-head">
              <span className="wimp-panel-title">Thông tin đề thi &amp; Phân lớp</span>
            </div>
            <div>
              <label className="wimp-field-label">Tên đề thi</label>
              <input
                type="text"
                className="wimp-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Kiểm tra giữa kỳ I - Hóa 12"
              />
            </div>
            <div className="wimp-grid-3">
              <div>
                <label className="wimp-field-label">Môn học</label>
                <select
                  className="wimp-select"
                  value={detectedSubject || 'Toán học'}
                  onChange={(e) => setDetectedSubject(e.target.value)}
                >
                  {SUBJECT_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                  {detectedSubject && !SUBJECT_OPTIONS.includes(detectedSubject) && (
                    <option value={detectedSubject}>{detectedSubject}</option>
                  )}
                </select>
              </div>
              <div>
                <label className="wimp-field-label">Khối</label>
                <select
                  className="wimp-select"
                  value={detectedGrade}
                  onChange={(e) => setDetectedGrade(e.target.value)}
                >
                  {GRADE_OPTIONS.map((g) => (
                    <option key={g} value={g}>Lớp {g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="wimp-field-label">Phút</label>
                <input
                  type="number"
                  min={5}
                  max={240}
                  className="wimp-input"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>
            </div>

            {classes.length > 0 && (
              <div>
                <label className="wimp-field-label">Gán trực tiếp vào lớp học</label>
                <select
                  className="wimp-select"
                  value={classId}
                  onChange={(e) => {
                    userPickedClassRef.current = true;
                    setClassId(e.target.value);
                  }}
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name || c.title} {c.grade ? `(Khối ${c.grade})` : ''}
                    </option>
                  ))}
                  <option value="">Lưu bản nháp (chưa gán lớp)</option>
                </select>
              </div>
            )}
          </div>

          {/* 3. Nhập nhanh Bảng đáp án đa phần */}
          <div className="wimp-panel">
            <div className="wimp-panel-head">
              <span className="wimp-panel-title">
                <IcoBolt size={14} /> Nhập nhanh bảng đáp án (3 phần)
              </span>
            </div>
            <textarea
              className="wimp-textarea"
              rows={3}
              value={quickAnswerStr}
              onChange={(e) => {
                setQuickAnswerStr(e.target.value);
                if (!e.target.value.trim()) setQuickKeyNote('');
              }}
              placeholder={'Phần I: 1A 2B 3C hoặc ABCD...\nPhần II: 1. aĐ bS cĐ dĐ (hoặc Đ S Đ S)\nPhần III: 1: 12,5  2: -4'}
            />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="wimp-btn wimp-btn-sm wimp-btn-soft"
                style={{ flex: 1 }}
                disabled={!items.length || !quickAnswerStr.trim()}
                onClick={() => handleQuickAnswerApply(quickAnswerStr)}
              >
                <IcoCheck size={13} /> Áp dụng bảng đáp án
              </button>
              <button
                type="button"
                className="wimp-btn wimp-btn-sm"
                disabled={!items.length}
                onClick={handleSmartAnalyzeAll}
                title="Tự dò đáp án từ lời giải & phân loại NB/TH/VD/VDC"
              >
                <IcoSparkles size={13} /> Dò thông minh
              </button>
            </div>
            {quickKeyNote && (
              <div style={{ fontSize: 11.5, color: quickKeyNote.startsWith('Đã gán') ? 'var(--wi-ok)' : 'var(--wi-warn)', fontWeight: 600 }}>
                {quickKeyNote}
              </div>
            )}
          </div>
        </aside>

        {/* CỘT PHẢI: TOOLBAR THỐNG KÊ, LỌC, THẺ CÂU HỎI & TRÌNH SỬA CHI TIẾT */}
        <section className="wimp-right">
          {/* Thanh thống kê + tìm kiếm + công cụ nhanh */}
          <div className="wimp-toolbar">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div className="wimp-stats-row">
                <span className="wimp-stat-pill">Tổng <b>{stats.total}</b> câu</span>
                <span className="wimp-stat-pill">Phần I <b>{stats.p1}</b></span>
                <span className="wimp-stat-pill">Phần II (Đ/S) <b>{stats.p2}</b></span>
                <span className="wimp-stat-pill">Phần III (Ngắn) <b>{stats.p3}</b></span>
                <span className={`wimp-stat-pill ${stats.total > 0 && stats.hasAnswer === stats.total ? 'ok' : ''}`}>
                  Có ĐA <b>{stats.hasAnswer}/{stats.total}</b>
                </span>
                {issueCount > 0 && (
                  <span className="wimp-stat-pill warn">
                    Cần rà soát <b>{issueCount}</b>
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button type="button" className="wimp-btn wimp-btn-xs wimp-btn-soft" onClick={() => handleAddManualQuestion('single_choice')}>
                  <IcoPlus size={12} /> Thêm câu
                </button>
                {items.length > 0 && (
                  <>
                    <button type="button" className="wimp-btn wimp-btn-xs" onClick={handleDistributePoints} title="Chia điểm chuẩn GDPT 2025 hoặc đều 10đ">
                      Chia điểm 10đ
                    </button>
                    <button type="button" className="wimp-btn wimp-btn-xs" onClick={handleRenumberByPart} title="Đánh lại STT 1..N theo từng phần">
                      Đánh lại STT
                    </button>
                    <button type="button" className="wimp-btn wimp-btn-xs" onClick={handleExportRepairedWord} title="Tải xuống file Word chuẩn 3 phần">
                      <IcoDownload size={12} /> Xuất .docx
                    </button>
                  </>
                )}
              </div>
            </div>

            {items.length > 0 && (
              <div className="wimp-filter-row">
                <div className="wimp-tabs">
                  {[
                    { id: 'all', label: 'Tất cả', count: stats.total },
                    { id: 'p1', label: 'Phần I (TN)', count: stats.p1 },
                    { id: 'p2', label: 'Phần II (Đ/S)', count: stats.p2 },
                    { id: 'p3', label: 'Phần III (Ngắn)', count: stats.p3 },
                    ...(stats.imgCount > 0 ? [{ id: 'img', label: 'Có hình', count: stats.imgCount }] : []),
                    ...(issueCount > 0 ? [{ id: 'issue', label: 'Cần kiểm tra', count: issueCount }] : []),
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      className={`wimp-tab ${filterTab === tab.id ? 'active' : ''}`}
                      onClick={() => setFilterTab(tab.id)}
                    >
                      <span>{tab.label}</span>
                      <span className="wimp-tab-count">({tab.count})</span>
                    </button>
                  ))}
                </div>

                <div className="wimp-search-wrap">
                  <IcoSearch size={13} />
                  <input
                    type="text"
                    className="wimp-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm nội dung câu hỏi..."
                  />
                </div>
              </div>
            )}

            {items.length > 0 && (stats.p2 < 4 || stats.p3 < 6) && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  flexWrap: 'wrap',
                  padding: '7px 11px',
                  borderRadius: 11,
                  background: 'var(--wi-warn-soft)',
                  border: '1px solid color-mix(in srgb, var(--wi-warn) 28%, transparent)',
                  fontSize: 12,
                }}
              >
                <span style={{ color: 'var(--wi-ink2)' }}>
                  Gợi ý chuẩn GDPT 2025: Hiện có {stats.p2} câu Đúng/Sai và {stats.p3} câu Trả lời ngắn — có thể nhờ AI sinh bù phần còn thiếu.
                </span>
                <button type="button" className="wimp-btn wimp-btn-xs wimp-btn-accent" disabled={busy} onClick={handleAiComplete3Parts}>
                  <IcoSparkles size={12} /> AI bổ sung đủ 3 phần
                </button>
              </div>
            )}
          </div>

          {/* Danh sách câu hỏi */}
          <div className="wimp-list">
            {items.length === 0 ? (
              <div className="wimp-empty">
                <div className="wimp-brand-icon" style={{ width: 52, height: 52, borderRadius: 15 }}>
                  <IcoDoc size={25} />
                </div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Chưa có câu hỏi nào được nạp</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--wi-ink2)', lineHeight: 1.55 }}>
                  Kéo thả file Word (.docx) ở cột trái, dán đề từ clipboard hoặc thêm từng câu thủ công. Hệ thống tự động phân loại Phần I, Đúng/Sai, Trả lời ngắn và giữ nguyên công thức &amp; hình vẽ.
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 }}>
                  <button type="button" className="wimp-btn wimp-btn-primary" onClick={() => fileRef.current?.click()}>
                    <IcoUpload size={14} /> Chọn file Word (.docx)
                  </button>
                  <button type="button" className="wimp-btn" onClick={handleLoadSample}>
                    <IcoBolt size={14} /> Nạp đề mẫu 2025
                  </button>
                  <button type="button" className="wimp-btn" onClick={() => handleAddManualQuestion('single_choice')}>
                    <IcoPlus size={14} /> Tự tạo câu mới
                  </button>
                </div>
              </div>
            ) : filteredChecked.length === 0 ? (
              <div className="wimp-empty">
                <div style={{ fontWeight: 700, fontSize: 14 }}>Không có câu hỏi khớp bộ lọc hiện tại</div>
                <button
                  type="button"
                  className="wimp-btn wimp-btn-sm"
                  onClick={() => {
                    setFilterTab('all');
                    setSearchTerm('');
                  }}
                >
                  Hiện toàn bộ {items.length} câu
                </button>
              </div>
            ) : (
              filteredChecked.map(({ it, issues }) => {
                const isEditing = editingId === it.id;
                const normType = normalizeImporterType(it.type);
                const isTf = normType === 'true_false';
                const isSa = normType === 'short_answer';
                const partBadgeClass = isTf ? 'wimp-badge-p2' : isSa ? 'wimp-badge-p3' : 'wimp-badge-p1';
                const partLabel = isTf ? 'Phần II · Đúng/Sai' : isSa ? 'Phần III · Trả lời ngắn' : 'Phần I · Trắc nghiệm';
                const lvCode = LEVEL_LABELS[(it.level || 'nb').toLowerCase()] || 'NB';

                let ansText = '';
                let ansOk = true;
                if (isTf) {
                  const st = it.statements || [];
                  if (st.length === 4 && st.every((s) => s.answer === true || s.answer === false)) {
                    ansText = st.map((s) => (s.answer ? 'Đ' : 'S')).join('-');
                  } else {
                    ansText = 'Thiếu ý Đ/S';
                    ansOk = false;
                  }
                } else if (isSa) {
                  if (String(it.answer || '').trim()) ansText = `ĐA: ${it.answer}`;
                  else {
                    ansText = 'Thiếu đáp án';
                    ansOk = false;
                  }
                } else if (it.correct >= 0 && it.correct < (it.options || []).length) {
                  ansText = `ĐA: ${LETTERS[it.correct]}`;
                } else {
                  ansText = 'Chưa chọn ĐA';
                  ansOk = false;
                }

                return (
                  <article
                    key={it.id}
                    className={`wimp-qcard ${issues.length > 0 ? 'is-warn' : ''} ${isEditing ? 'is-editing' : ''}`}
                  >
                    {/* Header thẻ câu hỏi */}
                    <div className="wimp-qhead">
                      <div className="wimp-qmeta">
                        <span className="wimp-qnum">Câu {it.num}</span>
                        <select
                          className={`wimp-badge ${partBadgeClass}`}
                          style={{ cursor: 'pointer', fontFamily: 'inherit', paddingRight: 6 }}
                          value={normType}
                          onChange={(e) => convertQuestionType(it.id, e.target.value)}
                          title="Đổi nhanh định dạng câu hỏi (Phần I / II / III)"
                        >
                          <option value="single_choice">Phần I · Trắc nghiệm</option>
                          <option value="true_false">Phần II · Đúng/Sai</option>
                          <option value="short_answer">Phần III · Trả lời ngắn</option>
                        </select>
                        <button
                          type="button"
                          className="wimp-badge wimp-badge-neutral"
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            const cur = (it.level || 'nb').toLowerCase();
                            const next = LEVEL_CYCLE[(LEVEL_CYCLE.indexOf(cur) + 1) % LEVEL_CYCLE.length];
                            patch(it.id, { level: next });
                          }}
                          title="Nhấn để chuyển mức độ NB → TH → VD → VDC"
                        >
                          {lvCode}
                        </button>
                        <span className="wimp-badge wimp-badge-neutral">
                          {it.points ?? (isTf ? 1 : 0.25)}đ
                        </span>
                        <span className={`wimp-badge ${ansOk ? 'wimp-badge-ok' : 'wimp-badge-warn'}`}>
                          {ansOk ? <IcoCheck size={11} /> : <IcoAlert size={11} />}
                          {ansText}
                        </span>
                        {it.src && (
                          <span className="wimp-badge wimp-badge-neutral" style={{ opacity: 0.8 }}>
                            {it.src}
                          </span>
                        )}
                      </div>

                      <div className="wimp-qactions">
                        <button
                          type="button"
                          className="wimp-btn wimp-btn-xs"
                          onClick={() => moveQuestion(it.id, -1)}
                          title="Di chuyển lên"
                        >
                          <IcoUp />
                        </button>
                        <button
                          type="button"
                          className="wimp-btn wimp-btn-xs"
                          onClick={() => moveQuestion(it.id, 1)}
                          title="Di chuyển xuống"
                        >
                          <IcoDown />
                        </button>
                        <button
                          type="button"
                          className="wimp-btn wimp-btn-xs"
                          onClick={() => duplicateQuestion(it.id)}
                          title="Nhân bản câu hỏi"
                        >
                          <IcoCopy />
                        </button>
                        <button
                          type="button"
                          className={`wimp-btn wimp-btn-xs ${isEditing ? 'wimp-btn-primary' : 'wimp-btn-soft'}`}
                          onClick={() => setEditingId(isEditing ? null : it.id)}
                        >
                          <IcoEdit size={12} /> {isEditing ? 'Đang sửa' : 'Sửa chi tiết'}
                        </button>
                        <button
                          type="button"
                          className="wimp-btn wimp-btn-xs wimp-btn-danger"
                          onClick={() => remove(it.id)}
                          title="Xóa câu hỏi"
                        >
                          <IcoTrash size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Thanh cảnh báo + nút sửa nhanh định dạng khi parser nhận thấy thiếu cấu trúc */}
                    {issues.length > 0 && (
                      <div className="wimp-warn-strip">
                        <span>{issues.join(' • ')}</span>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {!isTf && !isSa && (it.options || []).length === 0 && (
                            <button
                              type="button"
                              className="wimp-btn wimp-btn-xs"
                              onClick={() => convertQuestionType(it.id, 'short_answer')}
                            >
                              Đổi sang Trả lời ngắn
                            </button>
                          )}
                          {!isTf && !isSa && (it.options || []).length === 4 && (
                            <button
                              type="button"
                              className="wimp-btn wimp-btn-xs"
                              onClick={() => convertQuestionType(it.id, 'true_false')}
                            >
                              Đổi sang Đúng/Sai
                            </button>
                          )}
                          {isTf && (it.statements || []).length < 4 && (
                            <button
                              type="button"
                              className="wimp-btn wimp-btn-xs"
                              onClick={() => {
                                const cur = [...(it.statements || [])];
                                while (cur.length < 4) cur.push({ text: '', answer: null });
                                patch(it.id, { statements: cur });
                                setEditingId(it.id);
                              }}
                            >
                              Bổ sung đủ 4 ý a-d
                            </button>
                          )}
                          {!isEditing && (
                            <button type="button" className="wimp-btn wimp-btn-xs" onClick={() => setEditingId(it.id)}>
                              Mở trình sửa
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Chế độ ĐỌC vs Chế độ SỬA CHI TIẾT */}
                    {isEditing ? (
                      <QuestionDetailEditor
                        item={it}
                        onPatch={(p) => patch(it.id, p)}
                        onConvertType={(nextType) => convertQuestionType(it.id, nextType)}
                        onUploadQuestionImage={(f) => handleUploadQuestionImage(it.id, f)}
                        onUploadOptionImage={(oIdx, f) => handleUploadOptionImage(it.id, oIdx, f)}
                        onAutoDetectFromExplain={() => {
                          const { updated } = autoDetectOne(it);
                          patch(it.id, updated);
                        }}
                        onDone={() => setEditingId(null)}
                      />
                    ) : (
                      <>
                        {it.passage && (
                          <div className="wimp-passage-box">
                            <div style={{ fontSize: 11, fontWeight: 800, marginBottom: 3, color: 'var(--wi-accent)' }}>
                              Ngữ cảnh / Đoạn đọc hiểu
                            </div>
                            <MathText text={it.passage} />
                          </div>
                        )}

                        <div className="wimp-stem">
                          {it.q ? <MathText text={it.q} /> : <span style={{ color: 'var(--wi-ink3)', fontStyle: 'italic' }}>(Chưa có nội dung câu hỏi — bấm "Sửa chi tiết" để nhập)</span>}
                        </div>

                        {it.image && (
                          <div className="wimp-thumb-wrap" style={{ alignSelf: 'flex-start' }}>
                            <img src={it.image} alt={`Hình câu ${it.num}`} />
                          </div>
                        )}

                        {!isTf && !isSa && (
                          <div className="wimp-opts-grid">
                            {(it.options || []).map((opt, oIdx) => {
                              const isCorr = it.correct === oIdx;
                              const optImg = it.optionImages?.[oIdx];
                              return (
                                <button
                                  key={oIdx}
                                  type="button"
                                  className={`wimp-opt ${isCorr ? 'correct' : ''}`}
                                  onClick={() => patch(it.id, { correct: oIdx, src: 'bạn chọn' })}
                                  title="Nhấn để đặt làm đáp án đúng"
                                >
                                  <span className="wimp-opt-key">{LETTERS[oIdx]}</span>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <MathText text={opt} />
                                    {optImg && (
                                      <img
                                        src={optImg}
                                        alt={`Phương án ${LETTERS[oIdx]}`}
                                        style={{ display: 'block', maxHeight: 88, maxWidth: '100%', marginTop: 4, borderRadius: 6, background: '#fff' }}
                                      />
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {isTf && (
                          <div className="wimp-tf-list">
                            {(it.statements || []).map((st, sIdx) => (
                              <div key={sIdx} className="wimp-tf-row">
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <b style={{ marginRight: 6, color: 'var(--wi-accent)' }}>{'abcdef'[sIdx] || sIdx + 1})</b>
                                  <MathText text={st.text} />
                                </div>
                                <div className="wimp-tf-pills">
                                  <button
                                    type="button"
                                    className={`wimp-tf-btn ${st.answer === true ? 'active-true' : ''}`}
                                    onClick={() =>
                                      patch(it.id, {
                                        statements: (it.statements || []).map((x, j) =>
                                          j === sIdx ? { ...x, answer: true } : x
                                        ),
                                      })
                                    }
                                  >
                                    Đúng
                                  </button>
                                  <button
                                    type="button"
                                    className={`wimp-tf-btn ${st.answer === false ? 'active-false' : ''}`}
                                    onClick={() =>
                                      patch(it.id, {
                                        statements: (it.statements || []).map((x, j) =>
                                          j === sIdx ? { ...x, answer: false } : x
                                        ),
                                      })
                                    }
                                  >
                                    Sai
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {isSa && (
                          <div className="wimp-sa-box">
                            <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--wi-ink2)' }}>
                              Đáp án đúng:
                            </span>
                            <input
                              type="text"
                              className="wimp-input"
                              style={{ maxWidth: 160, fontWeight: 800, color: 'var(--wi-ok)' }}
                              value={it.answer || ''}
                              onChange={(e) => patch(it.id, { answer: e.target.value, src: 'bạn nhập' })}
                              placeholder="VD: 12,5"
                            />
                            {Array.isArray(it.accepted) && it.accepted.length > 1 && (
                              <span style={{ fontSize: 11.5, color: 'var(--wi-ink3)' }}>
                                Chấp nhận: {it.accepted.join(' • ')}
                              </span>
                            )}
                          </div>
                        )}

                        {it.explain && (
                          <div className="wimp-passage-box" style={{ borderLeftColor: 'var(--wi-ok)' }}>
                            <b>Lời giải:</b> <MathText text={it.explain} />
                          </div>
                        )}
                      </>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* ===== FOOTER ACTION BAR ===== */}
      <footer className="wimp-footer">
        <div className="wimp-footer-info">
          <span>
            Mẹo: Nhấn phương án A-D hoặc nút Đúng/Sai ngay trên thẻ để đổi nhanh; dùng <b>Sửa chi tiết</b> để đổi dạng Phần I/II/III, chỉnh công thức, điểm &amp; hình ảnh.
          </span>
          {msg && (
            <span
              style={{
                fontWeight: 700,
                color: msg.toLowerCase().includes('lỗi') || msg.toLowerCase().includes('không') ? 'var(--wi-bad)' : 'var(--wi-ok)',
              }}
            >
              • {msg}
            </span>
          )}
        </div>

        <div className="wimp-footer-actions">
          {onClose && (
            <button type="button" className="wimp-btn" onClick={onClose}>
              Đóng
            </button>
          )}
          {(allowBank || onSaveToBank) && (
            <button
              type="button"
              className="wimp-btn"
              disabled={!items.length || busy}
              onClick={handleSaveBankClick}
            >
              <IcoFolder size={14} /> Lưu vào Ngân hàng ({items.length})
            </button>
          )}
          {allowSendToMixer && (
            <button
              type="button"
              className="wimp-btn"
              disabled={!items.length || busy}
              onClick={handleSendToMixerClick}
            >
              <IcoShuffle size={14} /> Đưa vào Trộn đề
            </button>
          )}
          {(canCreateExam || onConfirm) && (
            <button
              type="button"
              className="wimp-btn wimp-btn-primary"
              disabled={!items.length || busy}
              onClick={handleCreateExamClick}
            >
              <IcoCheck size={14} /> {classId ? 'Tạo đề cho lớp' : 'Lưu bản nháp đề'} ({items.length})
            </button>
          )}
        </div>
      </footer>

      {/* MODAL HƯỚNG DẪN ĐỊNH DẠNG FILE WORD */}
      {showGuide && (
        <div className="wimp-guide-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setShowGuide(false)}>
          <div className="wimp-guide-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Hướng dẫn soạn file Word chuẩn GDPT 2025</h3>
              <button type="button" className="wimp-btn wimp-btn-xs" onClick={() => setShowGuide(false)}>
                Đóng
              </button>
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--wi-ink2)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <b>1. Phần I — Trắc nghiệm nhiều lựa chọn:</b> Tiêu đề mục bắt đầu bằng <code>PHẦN I</code>. Câu hỏi bắt đầu bằng <code>Câu 1.</code>, phương án <code>A. B. C. D.</code> (hỗ trợ cả bảng 2×2). Đánh dấu đáp án đúng bằng gạch chân / tô màu chữ / bôi vàng / dấu <code>*</code> hoặc bảng đáp án cuối đề.
              </div>
              <div>
                <b>2. Phần II — Trắc nghiệm Đúng / Sai:</b> Tiêu đề <code>PHẦN II</code> hoặc <code>Câu trắc nghiệm đúng sai</code>. Các ý con dùng <code>a) b) c) d)</code>. Đáp án nhận diện qua gạch chân ý đúng, dòng <code>Đáp án: a-Đ, b-S, c-Đ, d-Đ</code> hoặc <code>ĐSĐS</code> ở bảng đáp án cuối đề.
              </div>
              <div>
                <b>3. Phần III — Trả lời ngắn:</b> Tiêu đề <code>PHẦN III</code> hoặc <code>Trả lời ngắn</code>. Đáp án đặt tại dòng <code>Đáp án: 12,5</code> hoặc trong bảng đáp án cuối file.
              </div>
              <div>
                <b>4. Nhãn mức độ &amp; Công thức:</b> Thêm <code>[NB]</code>, <code>[TH]</code>, <code>[VD]</code>, <code>[VDC]</code> sau chữ <code>Câu 1.</code> Công thức OMML (Insert Equation) và hình ảnh trong Word tự động được giải mã trực tiếp.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TRỘN ĐỀ */}
      {openMixerModal && (
        <ExamPreviewSimulator
          exam={{
            title: title || fileName.replace(/\.[^.]+$/, '') || 'Đề kiểm tra',
            subject: detectedSubject || defaultSubject || classInfo?.subject || 'Toán học',
            duration: Number(duration) || 45,
            grade: detectedGrade || defaultGrade || classInfo?.grade || '12',
            classId: classId || classInfo?.id || classes[0]?.id || '',
            questions: buildNormalizedQuestions(items),
          }}
          questions={buildNormalizedQuestions(items)}
          classes={classes}
          defaultTab="config"
          initialWizardStep={2}
          onAssignShuffled={
            onCreateSoftExam
              ? async (assignPayload) => {
                  const targetCid = assignPayload?.classId ?? classId ?? '';
                  await onCreateSoftExam({
                    title: assignPayload?.title || title || fileName.replace(/\.[^.]+$/, '') || 'Đề kiểm tra',
                    duration: Number(assignPayload?.duration) || Number(duration) || 45,
                    classId: targetCid,
                    isDraft: assignPayload?.isDraft ?? !targetCid,
                    subject: assignPayload?.subject || detectedSubject || defaultSubject || classInfo?.subject || 'Toán học',
                    grade: assignPayload?.grade || detectedGrade || defaultGrade || classInfo?.grade || 12,
                    questions: assignPayload?.questions || buildNormalizedQuestions(items),
                    sourceFile: fileName || null,
                    shuffleVariants: true,
                  });
                  setOpenMixerModal(false);
                }
              : undefined
          }
          onClose={() => setOpenMixerModal(false)}
        />
      )}

      {/* MODAL SOẠN THẢO WORD A4 */}
      {openWordEditor && (
        <WordDocxEditor
          open={openWordEditor}
          onClose={() => setOpenWordEditor(false)}
          initialExam={{
            title: title || fileName.replace(/\.[^.]+$/, '') || 'Đề kiểm tra',
            subject: detectedSubject || defaultSubject || classInfo?.subject || 'Toán học',
            grade: detectedGrade || defaultGrade || classInfo?.grade || 12,
            duration: Number(duration) || 45,
            questions: buildNormalizedQuestions(items),
          }}
          classes={classes}
          initialClassId={classId || classInfo?.id || classes[0]?.id || ''}
          onSaveToClass={async (newExam) => {
            if (onCreateSoftExam) {
              const targetCid = newExam?.classId !== undefined ? newExam.classId : classId || classInfo?.id || classes[0]?.id || '';
              await onCreateSoftExam({
                ...newExam,
                classId: targetCid,
                isDraft: newExam?.isDraft ?? !targetCid,
              });
            }
          }}
          onSaveToBank={onSaveToBank}
        />
      )}
    </div>
  );

  if (isModal) {
    return (
      <div className="wimp-scope wimp-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
        {studioShell}
      </div>
    );
  }

  return studioShell;
}
