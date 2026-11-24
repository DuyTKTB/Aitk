/* ============================================================
   studentStemStudio.js — Bộ Engine STEM & Ngôn ngữ Cho Học Sinh
   Lấy cảm hứng từ các kho mã nguồn mở hàng đầu GitHub:
     1. SI Unit Converter (amangit007/Unit-Converter-in-React) — 8 nhóm đại lượng Lý/Hóa
     2. DNA → mRNA → Amino Acid Codon & Point Mutation Decoder (seqviz / Codon)
     3. RSVP Optimal Recognition Point (ORP) Splitter (snowfluke/rsvp-speed-reader)
     4. English Dictation Word-Level Diff Grader (EchoTalk / Mock-Test-UI)
   100% thuần hàm, 0 phụ thuộc ngoài, test chính xác tuyệt đối.
   ============================================================ */

/* ============================================================
   1. CHUYỂN ĐỔI ĐƠN VỊ KHOA HỌC SI (VẬT LÍ · HÓA HỌC · SINH HỌC)
   ============================================================ */
export const UNIT_CATEGORIES = [
  {
    id: 'energy',
    label: 'Năng lượng',
    units: [
      { id: 'J', label: 'Joule (J)', toBase: (v) => v, fromBase: (v) => v },
      { id: 'kJ', label: 'Kilojoule (kJ)', toBase: (v) => v * 1e3, fromBase: (v) => v / 1e3 },
      { id: 'eV', label: 'Electronvolt (eV)', toBase: (v) => v * 1.602176634e-19, fromBase: (v) => v / 1.602176634e-19 },
      { id: 'MeV', label: 'Mega-eV (MeV)', toBase: (v) => v * 1.602176634e-13, fromBase: (v) => v / 1.602176634e-13 },
      { id: 'cal', label: 'Calorie (cal)', toBase: (v) => v * 4.184, fromBase: (v) => v / 4.184 },
      { id: 'kWh', label: 'Kilowatt-giờ (kWh)', toBase: (v) => v * 3.6e6, fromBase: (v) => v / 3.6e6 },
    ],
  },
  {
    id: 'pressure',
    label: 'Áp suất',
    units: [
      { id: 'Pa', label: 'Pascal (Pa)', toBase: (v) => v, fromBase: (v) => v },
      { id: 'kPa', label: 'Kilopascal (kPa)', toBase: (v) => v * 1e3, fromBase: (v) => v / 1e3 },
      { id: 'atm', label: 'Atmosphere (atm)', toBase: (v) => v * 101325, fromBase: (v) => v / 101325 },
      { id: 'bar', label: 'Bar (bar)', toBase: (v) => v * 1e5, fromBase: (v) => v / 1e5 },
      { id: 'mmHg', label: 'mmHg (Torr)', toBase: (v) => v * 133.322368, fromBase: (v) => v / 133.322368 },
    ],
  },
  {
    id: 'temperature',
    label: 'Nhiệt độ',
    units: [
      { id: 'C', label: 'Độ C (°C)', toBase: (v) => v + 273.15, fromBase: (v) => v - 273.15 },
      { id: 'K', label: 'Kelvin (K)', toBase: (v) => v, fromBase: (v) => v },
      { id: 'F', label: 'Độ F (°F)', toBase: (v) => ((v - 32) * 5) / 9 + 273.15, fromBase: (v) => ((v - 273.15) * 9) / 5 + 32 },
    ],
  },
  {
    id: 'length',
    label: 'Độ dài / Bước sóng',
    units: [
      { id: 'm', label: 'Mét (m)', toBase: (v) => v, fromBase: (v) => v },
      { id: 'cm', label: 'Centimet (cm)', toBase: (v) => v * 1e-2, fromBase: (v) => v * 1e2 },
      { id: 'mm', label: 'Milimet (mm)', toBase: (v) => v * 1e-3, fromBase: (v) => v * 1e3 },
      { id: 'um', label: 'Micromet (μm)', toBase: (v) => v * 1e-6, fromBase: (v) => v * 1e6 },
      { id: 'nm', label: 'Nanomet (nm)', toBase: (v) => v * 1e-9, fromBase: (v) => v * 1e9 },
      { id: 'A', label: 'Angstrom (Å)', toBase: (v) => v * 1e-10, fromBase: (v) => v * 1e10 },
    ],
  },
  {
    id: 'speed',
    label: 'Vận tốc',
    units: [
      { id: 'ms', label: 'm/s', toBase: (v) => v, fromBase: (v) => v },
      { id: 'kmh', label: 'km/h', toBase: (v) => v / 3.6, fromBase: (v) => v * 3.6 },
      { id: 'cms', label: 'cm/s', toBase: (v) => v * 0.01, fromBase: (v) => v * 100 },
    ],
  },
  {
    id: 'volume',
    label: 'Thể tích',
    units: [
      { id: 'L', label: 'Lít (L / dm³)', toBase: (v) => v, fromBase: (v) => v },
      { id: 'mL', label: 'Mililít (mL / cm³)', toBase: (v) => v * 1e-3, fromBase: (v) => v * 1e3 },
      { id: 'm3', label: 'Mét khối (m³)', toBase: (v) => v * 1e3, fromBase: (v) => v / 1e3 },
    ],
  },
  {
    id: 'mass',
    label: 'Khối lượng',
    units: [
      { id: 'kg', label: 'Kilôgam (kg)', toBase: (v) => v, fromBase: (v) => v },
      { id: 'g', label: 'Gam (g)', toBase: (v) => v * 1e-3, fromBase: (v) => v * 1e3 },
      { id: 'mg', label: 'Miligam (mg)', toBase: (v) => v * 1e-6, fromBase: (v) => v * 1e6 },
      { id: 'amu', label: 'Đơn vị KLNT (amu / u)', toBase: (v) => v * 1.6605390666e-27, fromBase: (v) => v / 1.6605390666e-27 },
    ],
  },
  {
    id: 'angle',
    label: 'Góc & Tần số',
    units: [
      { id: 'deg', label: 'Độ (°)', toBase: (v) => (v * Math.PI) / 180, fromBase: (v) => (v * 180) / Math.PI },
      { id: 'rad', label: 'Radian (rad)', toBase: (v) => v, fromBase: (v) => v },
    ],
  },
];

export function convertScientificUnit(categoryId, value, fromUnitId, toUnitId) {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  const cat = UNIT_CATEGORIES.find((c) => c.id === categoryId);
  if (!cat) return null;
  const fromU = cat.units.find((u) => u.id === fromUnitId);
  const toU = cat.units.find((u) => u.id === toUnitId);
  if (!fromU || !toU) return null;
  return toU.fromBase(fromU.toBase(num));
}

export function formatSciNumber(val) {
  if (val === null || val === undefined || !Number.isFinite(val)) return '—';
  if (val === 0) return '0';
  const abs = Math.abs(val);
  if (abs >= 1e6 || abs < 1e-4) return val.toExponential(4).replace('e+', ' × 10^').replace('e-', ' × 10^-');
  return String(Math.round(val * 1e6) / 1e6);
}

/* ============================================================
   2. GIẢI MÃ GEN ADN → mARN → AXIT AMIN & ĐỘT BIẾN ĐIỂM (SINH 12)
   ============================================================ */
const CODON_TABLE = {
  UUU: 'Phe', UUC: 'Phe', UUA: 'Leu', UUG: 'Leu',
  CUU: 'Leu', CUC: 'Leu', CUA: 'Leu', CUG: 'Leu',
  AUU: 'Ile', AUC: 'Ile', AUA: 'Ile', AUG: 'Met',
  GUU: 'Val', GUC: 'Val', GUA: 'Val', GUG: 'Val',
  UCU: 'Ser', UCC: 'Ser', UCA: 'Ser', UCG: 'Ser',
  CCU: 'Pro', CCC: 'Pro', CCA: 'Pro', CCG: 'Pro',
  ACU: 'Thr', ACC: 'Thr', ACA: 'Thr', ACG: 'Thr',
  GCU: 'Ala', GCC: 'Ala', GCA: 'Ala', GCG: 'Ala',
  UAU: 'Tyr', UAC: 'Tyr', UAA: 'STOP', UAG: 'STOP',
  CAU: 'His', CAC: 'His', CAA: 'Gln', CAG: 'Gln',
  AAU: 'Asn', AAC: 'Asn', AAA: 'Lys', AAG: 'Lys',
  GAU: 'Asp', GAC: 'Asp', GAA: 'Glu', GAG: 'Glu',
  UGU: 'Cys', UGC: 'Cys', UGA: 'STOP', UGG: 'Trp',
  CGU: 'Arg', CGC: 'Arg', CGA: 'Arg', CGG: 'Arg',
  AGU: 'Ser', AGC: 'Ser', AGA: 'Arg', AGG: 'Arg',
  GGU: 'Gly', GGC: 'Gly', GGA: 'Gly', GGG: 'Gly',
};

/**
 * Giải mã mạch gốc ADN 3'→5' (hỗ trợ cả ký hiệu Việt X lẫn quốc tế C):
 *   → Mạch bổ sung ADN 5'→3'
 *   → mARN 5'→3'
 *   → Chuỗi axit amin (dịch mã từ bộ ba, dừng khi gặp STOP)
 *   → Thông số gen (N, L(Å), M(đvC), liên kết Hidro H = 2A + 3G)
 */
export function decodeDnaTemplate(rawTemplate = '') {
  const clean = String(rawTemplate || '')
    .toUpperCase()
    .replace(/X/g, 'C')
    .replace(/[^ATCG]/g, '');

  if (!clean.length) {
    return {
      template3to5: '',
      coding5to3: '',
      mrna5to3: '',
      codons: [],
      aminoAcids: [],
      stats: { totalNu: 0, A: 0, T: 0, G: 0, C: 0, hBonds: 0, lengthAngstrom: 0, massDa: 0 },
    };
  }

  const compDnaMap = { A: 'T', T: 'A', C: 'G', G: 'C' };
  const mrnaMap = { A: 'U', T: 'A', C: 'G', G: 'C' };

  let coding5to3 = '';
  let mrna5to3 = '';
  let A1 = 0, T1 = 0, G1 = 0, C1 = 0;

  for (let i = 0; i < clean.length; i++) {
    const b = clean[i];
    coding5to3 += compDnaMap[b];
    mrna5to3 += mrnaMap[b];
    if (b === 'A') A1++;
    else if (b === 'T') T1++;
    else if (b === 'G') G1++;
    else if (b === 'C') C1++;
  }

  const codons = [];
  const aminoAcids = [];
  let stopped = false;

  for (let i = 0; i + 2 < mrna5to3.length; i += 3) {
    const codon = mrna5to3.slice(i, i + 3);
    const aa = CODON_TABLE[codon] || '?';
    codons.push({ index: Math.floor(i / 3) + 1, codon, aa, isStop: aa === 'STOP', afterStop: stopped });
    if (!stopped) {
      if (aa === 'STOP') stopped = true;
      else aminoAcids.push(aa);
    }
  }

  // Tổng số nucleotit cả 2 mạch của gen: N = 2 * len
  const totalNu = clean.length * 2;
  const A = A1 + T1;
  const T = A;
  const G = G1 + C1;
  const C = G;
  const hBonds = 2 * A + 3 * G;
  const lengthAngstrom = Math.round((totalNu / 2) * 3.4 * 10) / 10;
  const massDa = totalNu * 300;

  return {
    template3to5: clean,
    coding5to3,
    mrna5to3,
    codons,
    aminoAcids,
    stats: { totalNu, A, T, G, C, hBonds, lengthAngstrom, massDa },
  };
}

/**
 * So sánh 2 mạch ADN (gốc vs đột biến điểm) để phân loại đột biến:
 *   Đồng nghĩa (Silent) / Sai nghĩa (Missense) / Vô nghĩa (Nonsense) / Dịch khung (Frameshift)
 */
export function classifyPointMutation(originalTemplate, mutatedTemplate) {
  const orig = decodeDnaTemplate(originalTemplate);
  const mut = decodeDnaTemplate(mutatedTemplate);
  if (!orig.template3to5 || !mut.template3to5) return { type: 'none', label: 'Chưa có dữ liệu' };
  if (orig.template3to5 === mut.template3to5) return { type: 'none', label: 'Không có đột biến' };
  if (orig.template3to5.length !== mut.template3to5.length) {
    return {
      type: 'frameshift',
      label: 'Đột biến dịch khung (thêm / mất nucleotit)',
      deltaH: mut.stats.hBonds - orig.stats.hBonds,
    };
  }
  const origStr = orig.aminoAcids.join('-');
  const mutStr = mut.aminoAcids.join('-');
  const deltaH = mut.stats.hBonds - orig.stats.hBonds;
  if (origStr === mutStr) {
    return { type: 'silent', label: 'Đột biến đồng nghĩa (Silent — axit amin không đổi)', deltaH };
  }
  if (mut.aminoAcids.length < orig.aminoAcids.length) {
    return { type: 'nonsense', label: 'Đột biến vô nghĩa (Nonsense — xuất hiện mã kết thúc sớm!)', deltaH };
  }
  return { type: 'missense', label: 'Đột biến sai nghĩa (Missense — làm thay đổi axit amin)', deltaH };
}

/* ============================================================
   3. RSVP SPEED READER (ORP — OPTIMAL RECOGNITION POINT)
   ============================================================ */
export function splitWordOrp(word) {
  const w = String(word || '').trim();
  if (!w) return { left: '', pivot: '', right: '' };
  const len = w.length;
  const idx = len <= 1 ? 0 : len <= 5 ? 1 : len <= 9 ? 2 : len <= 13 ? 3 : 4;
  return {
    left: w.slice(0, idx),
    pivot: w[idx] || '',
    right: w.slice(idx + 1),
  };
}

export function getRsvpWordDelayMs(word, wpm = 300) {
  const base = 60000 / Math.max(100, Math.min(900, Number(wpm) || 300));
  const w = String(word || '').trim();
  if (/[.!?…]$/.test(w)) return Math.round(base * 2.1);
  if (/[,;:]$/.test(w)) return Math.round(base * 1.45);
  if (w.length >= 10) return Math.round(base * 1.25);
  return Math.round(base);
}

/* ============================================================
   4. ENGLISH DICTATION WORD-LEVEL DIFF GRADER (ECHOTALK STYLE)
   ============================================================ */
export const ENGLISH_SHADOWING_SAMPLES = [
  {
    id: 'env',
    level: 'THPTQG B1',
    title: 'Renewable Energy & Climate',
    text: 'Transitioning to renewable energy sources like solar and wind power significantly reduces carbon emissions and protects our planet for future generations.',
  },
  {
    id: 'ai',
    level: 'IELTS B2',
    title: 'Artificial Intelligence in Education',
    text: 'Artificial intelligence helps students personalize their learning pace, identify knowledge gaps immediately, and build stronger problem solving skills.',
  },
  {
    id: 'habit',
    level: 'THPTQG B1',
    title: 'Active Recall Strategy',
    text: 'Active recall combined with spaced repetition is scientifically proven to strengthen long term memory far more effectively than passive rereading.',
  },
];

export function gradeDictationText(expectedText, userText) {
  const cleanTokens = (s) =>
    String(s || '')
      .toLowerCase()
      .replace(/[^a-z0-9'\s-]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);

  const exp = cleanTokens(expectedText);
  const got = cleanTokens(userText);
  if (!exp.length) return { accuracy: 0, correct: 0, total: 0, words: [] };

  // LCS (Longest Common Subsequence) để đối chiếu chính xác kể cả khi học sinh gõ thiếu/thừa 1 từ
  const m = exp.length;
  const n = got.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (exp[i - 1] === got[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
      else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  const matchedExpIndices = new Set();
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (exp[i - 1] === got[j - 1]) {
      matchedExpIndices.add(i - 1);
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  const words = exp.map((w, idx) => ({ word: w, ok: matchedExpIndices.has(idx) }));
  const correct = matchedExpIndices.size;
  return {
    accuracy: Math.round((correct / m) * 100),
    correct,
    total: m,
    words,
  };
}
