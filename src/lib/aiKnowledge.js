/* ============================================================
   aiKnowledge.js — CHỈ MỤC TRI THỨC NỘI BỘ cho ELEC AI
   ------------------------------------------------------------
   Mục đích: AI không còn "chỉ có kiến thức của model" mà được
   NEO vào dữ liệu chuẩn của app (công thức, hợp chất, 118 nguyên tố,
   phản ứng, chuyên đề SGK) → trả lời đúng hơn, có trích dẫn nguồn.

   Cơ chế: chỉ mục nghịch đảo + BM25 rút gọn, chấm điểm không dấu
   (người dùng gõ "sat" vẫn tìm được "Sắt"), ưu tiên khớp công thức.

   Không phụ thuộc React/DOM nên test được bằng vitest.
   ============================================================ */
import { FORMULAS } from '../components/formulaData.js';
import { COMPOUNDS } from '../data/chemRules.js';
import { ELEMENTS, CATS, norm } from '../data/elements.js';
import { REACTIONS } from '../data/reactions.js';
import { CHEM_TOPICS } from '../data/chemTopics.js';

const CAT_LABEL = new Map(CATS);
const KIND_WEIGHT = {
  formula: 1.25,
  compound: 1.15,
  reaction: 1.1,
  element: 1.0,
  topic: 0.95,
};

/* ============ TIỀN XỬ LÝ VĂN BẢN ============ */
/* Từ chức năng tiếng Việt — không mang thông tin hóa học, nếu để lại sẽ chi phối điểm
   (vd "về", "hỏi" xuất hiện ở rất ít tài liệu nên có idf rất cao). */
const STOP = new Set(`
  la cua va co cho trong khi thi mot cac nhung gi nao the voi tinh bang hay duoc tu den nhu de
  ra vao sau truoc phai se da dang rat hon nhat khong cung do nay nen vi boi tai moi
  minh ban toi so giup lam sao cach bai tap giai thich tao roi dung hoi ve xem biet muon can
  em anh chi thay oi nhe nha vay nay kia day di tren duoi ngoai giua hoac ma
  xin chao hello hi thanks thank cau y kieu chut chiec vui
`.trim().split(/\s+/));

/** Tách token tìm kiếm: chữ/số, bỏ dấu, bỏ stopword ngắn */
export function tokenize(text) {
  const n = norm(String(text || ''));
  // Dấu phẩy: giữ khi nằm giữa hai số (thập phân kiểu Việt Nam: 5,6),
  // còn "Sắt," thì bỏ để khớp truy vấn không dấu "sat".
  const tokens = n
    .split(/[^a-z0-9,]+/)
    .map((t) => t.replace(/(\d),(\d)/g, '$1.$2').replace(/,/g, ''))
    .filter(Boolean);
  const out = [];
  for (const t of tokens) {
    if (t.length < 2) continue;
    if (STOP.has(t)) continue;
    if (/^\d+$/.test(t) && t.length > 6) continue;
    out.push(t);
    // "10^-3" / "ph=3" kiểu gộp: tách phần chữ và phần số để tăng recall
    const m = t.match(/^([a-z]+)(\d+(?:\.\d+)?)$/);
    if (m) { out.push(m[1]); if (m[2].length >= 2) out.push(m[2]); }
  }
  return out;
}

/** Chuẩn hóa công thức để so khớp: bỏ dấu cách, hoa/thường, bỏ ký tự trang trí */
export function canonFormula(f) {
  return String(f || '')
    .toLowerCase()
    .replace(/[₀-₉]/g, (c) => String('₀₁₂₃₄₅₆₇₈₉'.indexOf(c)))
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (c) => String('⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c)))
    .replace(/\s+/g, '')
    .replace(/[·.·*]/g, '.')
    .replace(/[()[\]]/g, '');
}

/* ============ XÂY CHỈ MỤC ============ */
function makeDoc({ id, kind, title, text, formulas = [], grade = null, ref = '', keys = [] }) {
  const titleTokens = tokenize(title);
  const bodyTokens = tokenize(`${text} ${formulas.join(' ')}`);
  const tf = new Map();
  // Token trong TIÊU ĐỀ quan trọng hơn (đếm 3 lần) — vd "Sắt" của nguyên tố Fe.
  for (const t of titleTokens) tf.set(t, (tf.get(t) || 0) + 3);
  for (const t of bodyTokens) tf.set(t, (tf.get(t) || 0) + 1);
  return {
    id, kind, title, text, ref,
    grade,
    formulas: formulas.map(canonFormula).filter(Boolean),
    keyTokens: [...new Set(keys.flatMap((k) => tokenize(k)))].filter((t) => t.length >= 2),
    tf,
    len: titleTokens.length + bodyTokens.length,
  };
}

function buildDocs() {
  const docs = [];

  /* ---------- 1. Công thức ---------- */
  for (const f of FORMULAS) {
    const sym = (f.symbols || []).map((s) => `${s.s} là ${s.name}${s.unit ? ` (${s.unit})` : ''}`).join('; ');
    const ex = f.example ? ` Ví dụ: ${f.example.problem} ${(f.example.steps || []).join(' ')}` : '';
    docs.push(makeDoc({
      id: `formula:${f.id}`,
      kind: 'formula',
      title: f.name,
      text: `Công thức: ${f.formula}. ${sym ? `Ký hiệu: ${sym}.` : ''}${f.notes ? ` Lưu ý: ${f.notes}.` : ''}${ex}`,
      formulas: [f.formula],
      grade: Array.isArray(f.grade) ? f.grade : null,
      ref: `Công thức · ${f.name}`,
    }));
  }

  /* ---------- 2. Hợp chất (axit/bazơ/muối/oxit) ---------- */
  for (const [formula, c] of Object.entries(COMPOUNDS)) {
    const parts = [
      `${formula}: ${c.name || ''}`,
      c.type ? `loại ${c.type}` : '',
      c.strength ? `độ mạnh ${c.strength}` : '',
      c.sub ? `${c.sub}` : '',
      Array.isArray(c.ions) && c.ions.length ? `phân li: ${c.ions.join(', ')}` : '',
      c.common ? `gặp ở: ${c.common}` : '',
      c.note || '',
    ].filter(Boolean);
    docs.push(makeDoc({
      id: `compound:${formula}`,
      kind: 'compound',
      title: `${formula} — ${c.name || ''}`,
      text: parts.join('. '),
      formulas: [formula],
      ref: `Hợp chất · ${formula}`,
    }));
  }

  /* ---------- 3. Nguyên tố ---------- */
  for (const e of ELEMENTS) {
    const cat = CAT_LABEL.get(e.category) || e.category || '';
    const ox = Array.isArray(e.oxidationStates) && e.oxidationStates.length
      ? `số oxi hóa thường gặp ${e.oxidationStates.join(', ')}` : '';
    docs.push(makeDoc({
      id: `element:${e.symbol}`,
      kind: 'element',
      title: `${e.symbol} — ${e.name}`,
      text: [
        `Nguyên tố ${e.symbol} (${e.name}), Z = ${e.atomicNumber}, khối lượng nguyên tử ${e.atomicMass}`,
        `chu kỳ ${e.period}, nhóm ${e.group ?? '—'}, ${cat}`,
        e.electronConfiguration ? `cấu hình electron ${e.electronConfiguration}` : '',
        ox,
        e.electronegativity ? `độ âm điện ${e.electronegativity}` : '',
      ].filter(Boolean).join(', '),
      formulas: [e.symbol],
      ref: `Nguyên tố · ${e.symbol}`,
      keys: [e.symbol, e.name],
    }));
  }

  /* ---------- 4. Phản ứng đặc trưng ---------- */
  for (const r of REACTIONS) {
    docs.push(makeDoc({
      id: `reaction:${(r.inputs || []).join('+')}`,
      kind: 'reaction',
      title: `${(r.inputs || []).join(' + ')} → ${(r.outputs || []).join(' + ')}`,
      text: `Phương trình: ${r.equation}. ${r.note || ''}${r.danger ? ` Mức nguy hiểm ${r.danger}/3.` : ''}`,
      formulas: [r.equation, ...(r.inputs || []), ...(r.outputs || [])],
      ref: `Phản ứng · ${r.equation}`,
    }));
  }

  /* ---------- 5. Chuyên đề SGK ---------- */
  for (const t of CHEM_TOPICS) {
    docs.push(makeDoc({
      id: `topic:${t.id}`,
      kind: 'topic',
      title: t.name,
      text: `Chuyên đề Hóa học lớp ${t.grade}: ${t.name}.`,
      grade: [t.grade],
      ref: `Chuyên đề · ${t.name}`,
    }));
  }

  return docs;
}

/* ============ CHỈ MỤC NGHỊCH ĐẢO ============ */
let INDEX = null;

function getIndex() {
  if (INDEX) return INDEX;
  const docs = buildDocs();
  const posting = new Map();          // token → Map(docIdx, tf)
  let totalLen = 0;

  docs.forEach((d, i) => {
    totalLen += d.len;
    for (const [t, n] of d.tf) {
      let list = posting.get(t);
      if (!list) { list = new Map(); posting.set(t, list); }
      list.set(i, n);
    }
  });

  const avgLen = docs.length ? totalLen / docs.length : 1;
  const idf = new Map();
  for (const [t, list] of posting) {
    idf.set(t, Math.log(1 + (docs.length - list.size + 0.5) / (list.size + 0.5)));
  }

  /* Bảng "tên riêng của nguyên tố" (vd "sat" → Fe, "iron" → Fe).
     Nếu người dùng gọi tên một nguyên tố thì trang nguyên tố phải đứng đầu,
     trước các hợp chất cũng chứa từ đó. Bỏ các tên mơ hồ (nhiều nguyên tố cùng khớp). */
  const nameHits = new Map();
  docs.forEach((d, i) => {
    if (d.kind !== 'element') return;
    for (const t of d.keyTokens) {
      if (!nameHits.has(t)) nameHits.set(t, { only: i, multiple: false });
      else if (nameHits.get(t).only !== i) nameHits.set(t, { only: null, multiple: true });
    }
  });
  const elementNameIndex = new Map();
  for (const [t, v] of nameHits) if (!v.multiple) elementNameIndex.set(t, v.only);

  INDEX = { docs, posting, idf, avgLen, elementNameIndex };
  return INDEX;
}

const K1 = 1.3;
const B = 0.72;

/**
 * retrieve('tính số mol Fe', { k: 4, grade: 11 })
 * → [{ id, kind, title, text, ref, score }]
 */
export function retrieve(query, opts = {}) {
  const { k = 4, grade = null, minScore = 1.2 } = opts;
  const q = String(query || '').trim();
  if (q.length < 3) return [];

  const { docs, posting, idf, avgLen, elementNameIndex } = getIndex();
  const qTokens = [...new Set(tokenize(q))];
  if (!qTokens.length) return [];

  const scores = new Map();
  const bump = (i, v) => scores.set(i, (scores.get(i) || 0) + v);

  for (const t of qTokens) {
    // Người dùng gọi tên nguyên tố → ưu tiên trang nguyên tố đó
    const elIdx = elementNameIndex.get(t);
    if (elIdx != null) bump(elIdx, 3.5);

    const list = posting.get(t);
    if (!list) continue;
    const w = idf.get(t) || 0;
    for (const [i, tf] of list) {
      const dl = docs[i].len || 1;
      const sat = (tf * (K1 + 1)) / (tf + K1 * (1 - B + B * (dl / avgLen)));
      bump(i, w * sat);
    }
  }

  /* Ưu tiên khớp công thức chính xác (mạnh hơn hẳn khớp từ) */
  const qCanon = canonFormula(q);
  const qFormulas = q.match(/[A-Z][a-z]?\d*(?:\([A-Za-z0-9]+\)\d*)?/g) || [];
  for (const [i, d] of docs.entries()) {
    if (!d.formulas.length) continue;
    for (const f of d.formulas) {
      if (!f) continue;
      if (qCanon.includes(f) && f.length >= 2) bump(i, 3.2);
      else if (qFormulas.some((qf) => canonFormula(qf) === f)) bump(i, 2.2);
    }
  }

  /* Điểm nền theo loại + ưu tiên đúng khối lớp */
  for (const [i, s] of scores) {
    const d = docs[i];
    let v = s * (KIND_WEIGHT[d.kind] || 1);
    if (grade && Array.isArray(d.grade) && d.grade.includes(Number(grade))) v *= 1.15;
    scores.set(i, v);
  }

  return [...scores.entries()]
    .filter(([, s]) => s >= minScore)
    .sort((a, b) => b[1] - a[1])
    .slice(0, k)
    .map(([i, score]) => ({
      id: docs[i].id,
      kind: docs[i].kind,
      title: docs[i].title,
      text: docs[i].text,
      ref: docs[i].ref,
      score: Math.round(score * 100) / 100,
    }));
}

/** Rút gọn text cho ngữ cảnh gửi model (tiết kiệm token). */
const clip = (s, n) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);

/** Khối ngữ cảnh nhét vào system prompt. */
export function formatContext(hits, { maxChars = 2400 } = {}) {
  if (!hits || !hits.length) return '';
  const lines = [];
  let used = 0;
  for (let i = 0; i < hits.length; i++) {
    const h = hits[i];
    const line = `[${i + 1}] (${h.ref}) ${clip(h.text, 420)}`;
    if (used + line.length > maxChars) break;
    used += line.length;
    lines.push(line);
  }
  return lines.join('\n');
}

/** Danh sách trích dẫn để UI hiển thị chip nguồn. */
export function citationsOf(hits) {
  return (hits || []).map((h, i) => ({ n: i + 1, label: h.ref, kind: h.kind, id: h.id }));
}

/** Thống kê chỉ mục (dùng cho test/debug). */
export function knowledgeStats() {
  const { docs, posting } = getIndex();
  const byKind = {};
  for (const d of docs) byKind[d.kind] = (byKind[d.kind] || 0) + 1;
  return { docs: docs.length, tokens: posting.size, byKind };
}
