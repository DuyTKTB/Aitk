/* ============================================================
   aiTools.js — LỚP CÔNG CỤ TÍNH TOÁN CHÍNH XÁC CHO AI
   ------------------------------------------------------------
   Vì sao cần: LLM rất giỏi lập luận hóa học nhưng hay sai số học
   (nhân chia, đổi đơn vị, chọn hệ số). Lớp này tính bằng code
   tất định rồi đưa KẾT QUẢ ĐÃ TÍNH vào ngữ cảnh để AI chỉ việc
   trình bày lại → đáp án đúng 100% phần số.

   Công cụ:
     molar  — khối lượng mol (118 nguyên tố, hỗ trợ hydrat)
     balance— cân bằng phương trình (đại số tuyến tính)
     element— tra nguyên tố theo ký hiệu/tên tiếng Việt
     compound — phân loại + tính chất + phản ứng của hợp chất
     solution — n = m/M, C_M = n/V, pH (axit/bazơ mạnh), pha loãng
     stoich — bài toán theo phương trình (gam → mol → thể tích khí)

   Thuần JS, không React/DOM → test được bằng vitest.
   ============================================================ */
import {
  molarMass, balanceEquation, checkBalance, parseFormula, prettyFormula,
  isValidSymbol, elementName,
} from './chemBalance.js';
import { ELEMENTS, norm } from '../data/elements.js';
import { COMPOUNDS, analyze } from '../data/chemRules.js';
import { REACTIONS } from '../data/reactions.js';

export const MOLAR_VOLUME = 22.4;   // lít/mol ở đktc
const r3 = (n) => Math.round(n * 1000) / 1000;
const fmt = (n) => String(r3(n)).replace('.', ',');

/* ============ CHUẨN HÓA VĂN BẢN ============ */
const SUB_CHARS = '₀₁₂₃₄₅₆₇₈₉';
const SUP_MAP = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-', '⁺': '+' };

/** H₂SO₄ → H2SO4 ; 10⁻³ → 10^-3 (để regex/máy tính hiểu được) */
export function desub(text) {
  return String(text || '')
    .replace(/[₀-₉]/g, (c) => String(SUB_CHARS.indexOf(c)))
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]/g, (c) => SUP_MAP[c] ?? c)
    .replace(/[×✕]/g, 'x')
    .replace(/[（]/g, '(').replace(/[）]/g, ')')
    .replace(/[–—]/g, '-');
}

/* ============ TRÍCH XUẤT CÔNG THỨC ============ */
const CAND_RE = /[A-Z][a-z]?(?:\d+)?(?:[A-Z][a-z]?(?:\d+)?|\((?:[A-Z][a-z]?\d*)+\)\d*|\[\d+\])*/g;

/** Tìm mọi công thức hóa học hợp lệ trong câu người dùng gõ. */
export function extractFormulas(text) {
  const s = desub(text);
  const found = new Map();
  const push = (raw) => {
    const clean = raw.trim();
    if (!clean || clean.length < 2) return;
    try {
      const counts = parseFormula(clean);
      const syms = Object.keys(counts);
      if (!syms.length || syms.some((x) => !isValidSymbol(x))) return;
      const c = clean.replace(/\s+/g, '');
      if (!found.has(c)) found.set(c, { formula: c, counts });
    } catch { /* bỏ qua ứng viên không phải công thức */ }
  };

  for (const m of s.match(CAND_RE) || []) push(m);
  // Hydrat: "CuSO4.5H2O"
  for (const m of s.match(/[A-Z][A-Za-z0-9]*\d*(?:\.[\d]*[A-Z][A-Za-z0-9]*)+/g) || []) push(m);
  // Công thức trong ngoặc kép hoặc sau chữ "công thức của"
  for (const m of s.match(/(?:công thức(?: của)?|chất|hợp chất)\s+([A-Za-z0-9()[\]]{2,20})/gi) || []) {
    push(m.replace(/^[^\s]*\s+/, ''));
  }
  return [...found.values()];
}

/* ============ TRÍCH XUẤT SỐ + ĐƠN VỊ ============ */
/* Đơn vị phải xét theo thứ tự CỤ THỂ → TỔNG QUÁT và NEO ngay sau con số
   (nếu không, "gam" sẽ bị nhận nhầm thành "m" = mol/L). */
const UNIT_RULES = [
  [/^\s*(mol\/l|mol\.l-1|molarity|molar)\b/i, 'M'],
  [/^\s*(gam\/mol|g\/mol)\b/i, 'g/mol'],
  [/^\s*(mililit|ml)\b/i, 'ml'],
  [/^\s*(lít|lit|liter|l)\b/i, 'l'],
  [/^\s*(kilogam|kilogram|kg)\b/i, 'kg'],
  [/^\s*(gam|gram|g)\b/i, 'g'],
  [/^\s*(mol)\b/i, 'mol'],
  [/^\s*(phần trăm)/i, '%'],
  [/^\s*(%)/, '%'],
  [/^\s*(m)\b/i, 'M'],
];

/** Vị trí các công thức hợp lệ trong câu (để gán số liệu về đúng chất). */
function formulaPositions(s) {
  const list = [];
  const re = new RegExp(CAND_RE.source, 'g');
  let m;
  while ((m = re.exec(s))) {
    if (!m[0]) { re.lastIndex++; continue; }
    try {
      parseFormula(m[0]);
      list.push({ formula: m[0], start: m.index, end: m.index + m[0].length });
    } catch { /* không phải công thức */ }
  }
  return list;
}

/**
 * Lấy các cặp (số, đơn vị) kèm CHẤT gần nhất.
 * Vd: "Cho 5,6 gam Fe..." → { value:5.6, unit:'g', near:'Fe' }
 *     "Fe: 5,6 gam"      → { value:5.6, unit:'g', near:'Fe' }
 */
export function extractQuantities(text) {
  const s = desub(text);
  const out = [];
  const forms = formulaPositions(s);
  const NUM = /(\d+(?:[.,]\d+)?)\s*(?:x\s*10\s*\^?\s*\(?\s*(-?\d+)\s*\)?)?/g;
  let m;
  while ((m = NUM.exec(s))) {
    const base = parseFloat(m[1].replace(',', '.'));
    if (!Number.isFinite(base)) continue;
    const exp = m[2] != null ? parseInt(m[2], 10) : 0;
    const value = exp ? base * Math.pow(10, exp) : base;
    const numEnd = m.index + m[0].length;

    const tail = s.slice(numEnd, numEnd + 16);
    let unit = null;
    for (const [re, u] of UNIT_RULES) { if (re.test(tail)) { unit = u; break; } }

    // Công thức gần nhất (trước hoặc sau số liệu), trong vòng 24 ký tự
    let near = '';
    let bestDist = Infinity;
    for (const f of forms) {
      const d = f.start >= numEnd ? f.start - numEnd : (m.index - f.end);
      if (d < 0) continue;
      if (d < bestDist) { bestDist = d; near = f.formula; }
    }
    if (bestDist > 24) near = '';

    out.push({ value, unit, raw: m[0], near, index: m.index });
  }
  return out;
}

/* ============ CÁC CÔNG CỤ ============ */

/** 1. Khối lượng mol */
export function toolMolar(formulas) {
  const hits = [];
  for (const f of formulas.slice(0, 3)) {
    try {
      const mm = molarMass(f.formula);
      if (!mm.value || mm.unknown.length) continue;
      const detail = mm.breakdown
        .map((b) => `${b.symbol}×${b.count} = ${fmt(b.subtotal)}`)
        .join(' + ');
      hits.push({
        tool: 'molar',
        title: `Khối lượng mol ${mm.pretty}`,
        value: mm.value,
        lines: [`M(${mm.pretty}) = ${fmt(mm.value)} g/mol`, `Kiểm tra: ${detail}`],
      });
    } catch { /* ignore */ }
  }
  return hits;
}

/** 2. Cân bằng phương trình */
export function toolBalance(text) {
  const s = desub(text);
  const eqRe = /([A-Za-z0-9()[\]\s+·.]{3,})\s*(->|=>|→|⇌|<=>|<->|=)\s*([A-Za-z0-9()[\]\s+·.]{2,})/;
  const m = s.match(eqRe);
  if (!m) return [];
  const raw = `${m[1]} ${m[2]} ${m[3]}`;
  try {
    const res = balanceEquation(raw);
    const chk = checkBalance(res);
    if (!chk.ok) return [];
    return [{
      tool: 'balance',
      title: 'Cân bằng phương trình',
      value: res.equation,
      lines: [
        `Phương trình cân bằng: ${res.pretty}`,
        `Hệ số: ${[...res.coeffL, ...res.coeffR].join(' : ')}`,
        `Bảo toàn nguyên tố: ${res.elements.join(', ')} — ĐÃ KIỂM TRA khớp 2 vế`,
        res.ambiguous ? 'Lưu ý: có thể còn cách cân bằng khác (nghiệm phụ).' : '',
      ].filter(Boolean),
    }];
  } catch {
    return [];
  }
}

/** 3. Tra nguyên tố */
export function toolElement(text) {
  const s = desub(text).toLowerCase();
  const hits = [];
  const asked = /nguyên tố|kim loại|phi kim|halogen|khí hiếm|tra|cấu hình/.test(s);
  for (const e of ELEMENTS) {
    const en = norm(e.name || '');
    const sym = e.symbol.toLowerCase();
    const wordRe = new RegExp(`(^|[^a-z])${sym}([^a-z]|$)`);
    const named = (en.length > 3 && s.includes(en));
    const symbolHit = wordRe.test(s) && asked;
    if (!named && !symbolHit) continue;
    hits.push({
      tool: 'element',
      title: `Nguyên tố ${e.symbol} (${e.name})`,
      value: e.symbol,
      lines: [
        `${e.symbol} — ${e.name}: Z = ${e.atomicNumber}, M = ${e.atomicMass}`,
        `Chu kỳ ${e.period}, nhóm ${e.group ?? '—'}, ${e.category}`,
        e.electronConfiguration ? `Cấu hình electron: ${e.electronConfiguration}` : '',
        e.oxidationStates?.length ? `Số oxi hóa thường gặp: ${e.oxidationStates.join(', ')}` : '',
      ].filter(Boolean),
      limit: 2,
    });
  }
  return hits.slice(0, 2);
}

/** 4. Hợp chất: loại, độ mạnh, ion, phản ứng đặc trưng */
export function toolCompound(formulas) {
  const hits = [];
  for (const f of formulas.slice(0, 2)) {
    if (!COMPOUNDS[f.formula]) continue;
    try {
      const a = analyze(f.formula);
      const rxs = (a.reactions || []).slice(0, 3)
        .map((r) => `${r.with} → ${r.result}${r.condition ? ` (${r.condition})` : ''}`);
      hits.push({
        tool: 'compound',
        title: `Hợp chất ${f.formula}`,
        value: a.typeName,
        lines: [
          `${f.formula} — ${a.name || ''}${a.typeName ? ` (${a.typeName})` : ''}`,
          a.strength ? `Độ mạnh: ${a.strength}` : '',
          a.ions?.length ? `Phân li: ${a.ions.join(', ')}` : '',
          a.note || '',
          rxs.length ? `Phản ứng đặc trưng: ${rxs.join(' | ')}` : '',
        ].filter(Boolean),
      });
    } catch { /* ignore */ }
  }
  return hits;
}

/** 5. Dung dịch: n = m/M, C_M = n/V, pH, pha loãng */
export function toolSolution(text, formulas) {
  const qs = extractQuantities(text);
  const mass = qs.find((q) => q.unit === 'g' && q.value > 0);
  const vol = qs.find((q) => (q.unit === 'l' || q.unit === 'ml') && q.value > 0);
  const moles = qs.find((q) => q.unit === 'mol');
  const molarity = qs.find((q) => q.unit === 'M');

  const hasSolutionCue = /dung dịch|nồng độ|\bCM\b|C_M|pH|pha loãng|trung hòa/i.test(desub(text));
  if (!hasSolutionCue) return [];

  const lines = [];
  let n = moles ? moles.value : null;
  const formula = formulas[0]?.formula;

  if (n == null && mass && formula) {
    try {
      const mm = molarMass(formula);
      if (mm.value > 0 && !mm.unknown.length) {
        n = mass.value / mm.value;
        lines.push(`n(${mm.pretty}) = m/M = ${fmt(mass.value)}/${fmt(mm.value)} = ${fmt(n)} mol`);
      }
    } catch { /* ignore */ }
  }

  const V = vol ? (vol.unit === 'ml' ? vol.value / 1000 : vol.value) : null;
  if (V && vol.unit === 'ml') lines.push(`Đổi đơn vị: ${fmt(vol.value)} ml = ${fmt(V)} lít`);

  let C = molarity ? molarity.value : null;
  if (C == null && n != null && V) {
    C = n / V;
    lines.push(`C_M = n/V = ${fmt(n)}/${fmt(V)} = ${fmt(C)} M`);
  }

  if (/\bpH\b/i.test(desub(text)) && C != null && C > 0) {
    const isBase = /bazơ|bazo|NaOH|KOH|Ba\(OH\)2|Ca\(OH\)2/i.test(text);
    const protic = /H2SO4|H₂SO₄/i.test(text) ? 2 : 1;
    const conc = isBase ? C : C * protic;
    const pH = isBase ? 14 + Math.log10(conc) : -Math.log10(conc);
    lines.push(
      `[H⁺] ≈ ${fmt(conc)} M → pH ≈ ${fmt(pH)}`,
      'Giả thiết: chất điện li mạnh phân li hoàn toàn; nếu là axit/bazơ yếu thì pH thực tế khác (cần Ka/Kb).'
    );
  }

  /* Pha loãng C1V1 = C2V2 */
  const Vlist = qs.filter((q) => q.unit === 'l' || q.unit === 'ml');
  const Clist = qs.filter((q) => q.unit === 'M');
  if (/pha loãng/i.test(text) && Clist.length === 2 && Vlist.length >= 1) {
    const [C1, C2] = Clist.map((c) => c.value);
    const v1 = Vlist[0].unit === 'ml' ? Vlist[0].value / 1000 : Vlist[0].value;
    if (C1 > 0 && C2 > 0) {
      lines.push(`Pha loãng: C₁V₁ = C₂V₂ → V₂ = C₁V₁/C₂ = ${fmt(C1)}×${fmt(v1)}/${fmt(C2)} = ${fmt((C1 * v1) / C2)} lít`);
    }
  }

  if (!lines.length) return [];
  return [{
    tool: 'solution',
    title: 'Tính dung dịch',
    value: C != null ? C : n,
    lines,
  }];
}

/** 6. Bài toán theo phương trình: gam → mol → mol chất khác → thể tích/khối lượng */
export function toolStoichiometry(text, formulas) {
  const s = desub(text);
  const present = formulas.map((f) => f.formula);
  const qs = extractQuantities(text);
  if (!qs.length || !present.length) return [];

  /* Tìm phản ứng trong dữ liệu có đủ chất tham gia xuất hiện trong đề */
  const candidates = REACTIONS.filter((r) =>
    (r.inputs || []).length >= 2 && (r.inputs || []).every((i) => present.includes(i))
  );
  if (candidates.length !== 1) return [];

  let bal;
  try { bal = balanceEquation(desub(candidates[0].equation).replace(/[↑↓]/g, '')); } catch { return []; }
  if (!checkBalance(bal).ok) return [];

  const coefOf = (formula) => {
    const l = bal.left.find((t) => t.formula === formula);
    if (l) return { coef: l.coef, side: 'left' };
    const r = bal.right.find((t) => t.formula === formula);
    if (r) return { coef: r.coef, side: 'right' };
    return null;
  };

  /* Chất đã biết khối lượng/số mol (chất phản ứng ở vế trái) */
  let known = null;
  for (const f of present) {
    const c = coefOf(f);
    if (!c || c.side !== 'left') continue;
    const near = qs.find((q) => q.near === f && (q.unit === 'g' || q.unit === 'mol'));
    if (near) { known = { formula: f, ...near }; break; }
  }
  if (!known) return [];

  let nKnown;
  const lines = [];
  if (known.unit === 'mol') {
    nKnown = known.value;
    lines.push(`n(${known.formula}) = ${fmt(nKnown)} mol (đề cho)`);
  } else {
    const mm = molarMass(known.formula);
    if (!mm.value || mm.unknown.length) return [];
    nKnown = known.value / mm.value;
    lines.push(
      `n(${known.formula}) = m/M = ${fmt(known.value)}/${fmt(mm.value)} = ${fmt(nKnown)} mol`
    );
  }

  const baseCoef = coefOf(known.formula).coef;

  /* Gộp theo từng chất: 1 chất = 1 entry có đủ mol / khối lượng / thể tích */
  const byFormula = new Map();
  const addResult = (formula, patch) => {
    byFormula.set(formula, { ...(byFormula.get(formula) || { formula }), ...patch });
  };
  const GAS_RE = /^(H2|O2|N2|CO2|Cl2|F2|SO2|NH3|CH4|C2H4|C2H2|NO|NO2|H2S)$/;

  const emit = (t) => {
    const n = (nKnown * t.coef) / baseCoef;
    lines.push(`n(${t.formula}) = ${fmt(nKnown)} × ${t.coef}/${baseCoef} = ${fmt(n)} mol`);
    addResult(t.formula, { mol: n, coef: t.coef });

    const mm = molarMass(t.formula);
    if (mm.value && !mm.unknown.length) {
      lines.push(`m(${t.formula}) = n × M = ${fmt(n)} × ${fmt(mm.value)} = ${fmt(n * mm.value)} gam`);
      addResult(t.formula, { mass: n * mm.value });
    }
    if (GAS_RE.test(t.formula)) {
      lines.push(`V(${t.formula}, đktc) = n × 22,4 = ${fmt(n)} × 22,4 = ${fmt(n * MOLAR_VOLUME)} lít`);
      addResult(t.formula, { volume: n * MOLAR_VOLUME });
    }
  };

  for (const t of bal.left) {
    if (t.formula === known.formula || !present.includes(t.formula)) continue;
    emit(t);
  }
  for (const t of bal.right) {
    if (!present.includes(t.formula)) continue;
    emit(t);
  }

  const results = [...byFormula.values()];
  if (!results.length) return [];

  lines.push(`Dùng phương trình: ${bal.pretty}`);
  lines.push('Giả thiết: chất còn lại lấy dư nên phản ứng xảy ra hoàn toàn; khí đo ở đktc (22,4 l/mol).');

  return [{
    tool: 'stoich',
    title: `Tính theo phương trình (từ ${known.formula})`,
    value: results[0].mol,
    results,
    lines,
  }];
}

/* ============ BỘ ĐIỀU PHỐI ============ */
const ALL_TOOLS = ['molar', 'balance', 'element', 'compound', 'solution', 'stoich'];

/**
 * runTools(text, { grade }) → { hits, formulas, quantities, summary }
 * Chạy mọi công cụ phù hợp với câu hỏi, gộp kết quả đã tính chính xác.
 */
export function runTools(text, opts = {}) {
  const raw = String(text || '');
  if (raw.trim().length < 4) return { hits: [], formulas: [], quantities: [], summary: '' };

  const formulas = extractFormulas(raw);
  const quantities = extractQuantities(raw);

  let hits = [];
  const safe = (fn) => { try { return fn() || []; } catch { return []; } };

  // Thứ tự ưu tiên: bài toán → cân bằng → hợp chất/nguyên tố → khối lượng mol
  hits = hits.concat(safe(() => toolStoichiometry(raw, formulas)));
  hits = hits.concat(safe(() => toolSolution(raw, formulas)));
  hits = hits.concat(safe(() => toolBalance(raw)));
  hits = hits.concat(safe(() => toolCompound(formulas)));
  hits = hits.concat(safe(() => toolElement(raw)));
  hits = hits.concat(safe(() => toolMolar(formulas)));

  // Khử trùng lặp theo tool + title + dòng đầu
  const seen = new Set();
  hits = hits.filter((h) => {
    const key = `${h.tool}|${h.title}|${h.lines?.[0] || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 6);

  /* Cờ `verify`: chỉ những giá trị LÀ ĐÁP ÁN của câu hỏi mới đem đi đối chiếu,
     tránh báo động giả vì khối lượng mol của các chất phụ trong đề. */
  const asksForMolar = /khối lượng mol|phân tử khối|nguyên tử khối|\bM\b\s*=|tính\s+M\b/i.test(desub(raw));
  hits = hits.map((h) => {
    if (h.tool === 'molar') return { ...h, verify: asksForMolar };
    if (h.tool === 'stoich' || h.tool === 'solution') return { ...h, verify: true };
    return { ...h, verify: false };
  });

  return { hits, formulas, quantities, summary: formatToolHits(hits.filter((h) => h.verify !== false)) };
}

/** Khối text "KẾT QUẢ ĐÃ TÍNH BẰNG CÔNG CỤ" để nhét vào prompt. */
export function formatToolHits(hits, { maxChars = 1800 } = {}) {
  if (!hits || !hits.length) return '';
  const out = [];
  let used = 0;
  let i = 1;
  for (const h of hits) {
    const block = `(${i}) ${h.title}\n${h.lines.map((l) => `  • ${l}`).join('\n')}`;
    if (used + block.length > maxChars) break;
    used += block.length;
    out.push(block);
    i++;
  }
  return out.join('\n');
}

/* ============ TỰ KIỂM TRA ĐÁP ÁN ============ */
const NUM_RE = /-?\d+(?:[.,]\d+)?/g;

/** Lấy mọi con số trong một đoạn văn (chuẩn hóa dấu phẩy thập phân). */
export function numbersIn(text) {
  return (desub(text).match(NUM_RE) || [])
    .map((s) => parseFloat(s.replace(',', '.')))
    .filter((n) => Number.isFinite(n));
}

/**
 * verifyToolResults(answerText, hits)
 * So khớp các giá trị công cụ đã tính với con số xuất hiện trong câu trả lời của AI.
 * → { checked, matched, missing: [{title, value}], ok, allMatched }
 *   ok = AI CÓ dùng ít nhất một con số của công cụ (nếu không dùng gì → nghi ngờ sai).
 */
export function verifyToolResults(answerText, hits) {
  const nums = numbersIn(answerText);
  const checks = [];
  for (const h of hits) {
    if (h.verify === false) continue;
    const values = [];
    if (typeof h.value === 'number' && Number.isFinite(h.value)) values.push(h.value);
    for (const r of h.results || []) {
      if (typeof r.mol === 'number') values.push(r.mol);
      if (typeof r.mass === 'number') values.push(r.mass);
      if (typeof r.volume === 'number') values.push(r.volume);
    }
    if (!values.length) continue;
    for (const v of values) {
      const hit = nums.some((n) => Math.abs(n - v) <= Math.max(0.02, Math.abs(v) * 0.02));
      checks.push({ title: h.title, value: v, hit });
    }
  }
  const missing = checks.filter((c) => !c.hit);
  const matched = checks.length - missing.length;
  return {
    checked: checks.length,
    matched,
    missing,
    ok: checks.length > 0 && matched > 0,
    allMatched: checks.length > 0 && missing.length === 0,
  };
}

export const TOOL_NAMES = ALL_TOOLS;
export { prettyFormula, elementName, molarMass, balanceEquation };
