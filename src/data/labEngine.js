/* ============================================================
   labEngine — Logic phản ứng, pH, nhiệt độ, hints
   Không chứa JSX, chỉ là JS thuần — dễ test, dễ tái dùng.
   ============================================================ */
import { CHEMICALS, REACTIONS, findReaction } from '../data/reactions';

/* ============================================================
   1) PHÂN TÍCH DUNG DỊCH — pH chính xác bằng log nồng độ
   ============================================================ */

// Hằng số axit/bazơ mạnh giả định (chỉ minh họa)
const ACID_STRENGTH = { HCl: 1, H2SO4: 2, HNO3: 1 };
const BASE_STRENGTH = { NaOH: 1, KOH: 1, CaOH2: 2 };

/**
 * Tính pH từ nồng độ H+ / OH- tương đối.
 * Trả về { ph, kind: 'acid'|'neutral'|'base', color }
 */
export function analyzePH(contents) {
  let acidMol = 0;
  let baseMol = 0;
  let volume = 0;

  Object.entries(contents).forEach(([k, v]) => {
    const c = CHEMICALS[k];
    if (!c) return;
    // Chỉ tính chất tan
    if (c.state === 'liquid' || c.type === 'acid' || c.type === 'base') {
      volume += v;
      if (ACID_STRENGTH[k]) acidMol += ACID_STRENGTH[k] * v;
      if (BASE_STRENGTH[k]) baseMol += BASE_STRENGTH[k] * v;
    }
  });

  if (volume === 0) return { ph: 7, kind: 'neutral', color: '#7bc96f', empty: true };

  const net = acidMol - baseMol;
  let ph;
  if (Math.abs(net) < 0.01) ph = 7;
  else if (net > 0) {
    // Dư axit — pH từ 7 → 1
    ph = 7 - Math.min(6, 2 + Math.log2(net + 1) * 1.2);
  } else {
    // Dư bazơ — pH từ 7 → 13
    ph = 7 + Math.min(6, 2 + Math.log2(-net + 1) * 1.2);
  }
  ph = Math.max(0.5, Math.min(13.5, ph));

  const kind = ph < 6.5 ? 'acid' : ph > 7.5 ? 'base' : 'neutral';
  const color =
    ph <= 2 ? '#e5383b' :
    ph <= 4 ? '#f77f00' :
    ph <= 6 ? '#fcbf49' :
    ph <= 8 ? '#7bc96f' :
    ph <= 10 ? '#2ea3a3' :
    ph <= 12 ? '#3a5bd9' : '#7b2cbf';

  return { ph, kind, color, empty: false, volume, acidMol, baseMol };
}

/* ============================================================
   2) CHỈ THỊ MÀU — PP, quỳ, methyl orange, bromothymol
   ============================================================ */

export const INDICATORS = {
  PP: {
    name: 'Phenolphtalein',
    color: (ph) => (ph > 8.2 ? '#e0308c' : null),
    range: '8.2 – 10',
  },
  Quy: {
    name: 'Quỳ tím',
    color: (ph) => (ph < 5 ? '#e5383b' : ph > 8 ? '#3a5bd9' : '#8a4fb0'),
    range: '5 – 8',
  },
  MO: {
    name: 'Methyl orange',
    color: (ph) => (ph < 3.1 ? '#e5383b' : ph > 4.4 ? '#f5c518' : '#f77f00'),
    range: '3.1 – 4.4',
  },
  BTB: {
    name: 'Bromothymol',
    color: (ph) => (ph < 6 ? '#f5c518' : ph > 7.6 ? '#3a5bd9' : '#7bc96f'),
    range: '6.0 – 7.6',
  },
};

/* ============================================================
   3) NHIỆT ĐỘ — hệ số tốc độ phản ứng
   ============================================================ */

export const TEMP = {
  INIT: 25,
  MAX: 120,
  MIN: 15,
  /** Hệ số tốc độ: nhiệt độ cao → phản ứng nhanh hơn */
  rateFactor: (temp) => Math.max(0.5, Math.min(3, 1 + (temp - 25) / 40)),
  /** Nhiệt độ có gây nguy hiểm không */
  isDangerous: (temp) => temp > 85,
};

/* ============================================================
   4) THỰC THI PHẢN ỨNG — trả về kết quả chi tiết
   ============================================================ */

/**
 * @param {object} contents - { chemKey: units }
 * @returns {null | { reaction, newContents, safety }}
 */
export function react(contents) {
  const keys = Object.keys(contents).filter((k) => contents[k] > 0);
  if (keys.length < 2) return null;

  const rxn = findReaction(keys);
  if (!rxn) return null;

  const newContents = { ...contents };
  rxn.inputs.forEach((k) => {
    newContents[k] = (newContents[k] || 0) - 1;
    if (newContents[k] <= 0) delete newContents[k];
  });
  rxn.outputs.forEach((k) => {
    const c = CHEMICALS[k];
    // Khí bay ra ngoài — không tích tụ
    if (c && c.state !== 'gas') {
      newContents[k] = (newContents[k] || 0) + 1;
    }
  });

  return { reaction: rxn, newContents };
}

/* ============================================================
   5) GỢI Ý THÔNG MINH — dựa trên chất hiện có
   ============================================================ */

/**
 * Trả về danh sách chất nên thêm tiếp để có phản ứng.
 */
export function suggestNext(contents) {
  const keys = Object.keys(contents).filter((k) => contents[k] > 0);

  // Nếu cốc rỗng → gợi ý chất khởi đầu
  if (keys.length === 0) {
    return [
      { key: 'Na', reason: 'Thử đổ Natri vào nước để xem phản ứng mãnh liệt' },
      { key: 'HCl', reason: 'Bắt đầu với axit để thử nhiều phản ứng' },
      { key: 'NaOH', reason: 'Bazơ mạnh, tạo kết tủa đẹp' },
    ];
  }

  // Nếu có 1 chất → tìm tất cả chất khác tạo phản ứng
  const suggestions = new Map();
  REACTIONS.forEach((r) => {
    const rInputs = r.inputs;
    // Nếu mọi chất trong cốc đều nằm trong rInputs
    const allInReaction = keys.every((k) => rInputs.includes(k));
    if (!allInReaction) return;
    // Tìm chất còn thiếu
    rInputs.forEach((k) => {
      if (!keys.includes(k)) {
        if (!suggestions.has(k)) {
          suggestions.set(k, {
            key: k,
            reason: `Thêm ${CHEMICALS[k]?.formula || k} → ${r.equation}`,
            targetEquation: r.equation,
          });
        }
      }
    });
  });

  return Array.from(suggestions.values()).slice(0, 5);
}

/* ============================================================
   6) SO SÁNH 2 PHẢN ỨNG — cho tab "So sánh"
   ============================================================ */

export function compareReactions(eqA, eqB) {
  const a = REACTIONS.find((r) => r.equation === eqA);
  const b = REACTIONS.find((r) => r.equation === eqB);
  if (!a || !b) return null;

  const fields = [
    ['Phương trình', a.equation, b.equation],
    ['Loại hiệu ứng', a.effect.type, b.effect.type],
    ['Cường độ', a.effect.intensity, b.effect.intensity],
    ['Mức nguy hiểm', `${a.danger}/5`, `${b.danger}/5`],
    ['Số chất tham gia', a.inputs.length, b.inputs.length],
    ['Số sản phẩm', a.outputs.length, b.outputs.length],
    ['Hiện tượng', a.note, b.note],
  ];

  return fields;
}

/* ============================================================
   7) TOOLTIP HÓA HỌC — thông tin chất
   ============================================================ */

// Khối lượng mol thô (gần đúng) cho các nguyên tố phổ biến
const MOLAR = {
  H: 1, C: 12, N: 14, O: 16, Na: 23, Mg: 24, Al: 27,
  Si: 28, P: 31, S: 32, Cl: 35.5, K: 39, Ca: 40,
  Fe: 56, Cu: 64, Zn: 65, Ag: 108, Ba: 137, Pb: 207, I: 127, Au: 197,
};

/** Tính khối lượng mol gần đúng từ công thức */
export function molarMass(formula) {
  if (!formula) return 0;
  let total = 0;
  // Tách từng nguyên tố + số nguyên tử (kể cả số thập phân như CuSO₄.5H₂O)
  const clean = formula.replace(/[₀-₉]/g, (m) =>
    '₀₁₂₃₄₅₆₇₈₉'.indexOf(m)
  );
  const tokens = clean.match(/([A-Z][a-z]?)(\d*)/g) || [];
  tokens.forEach((t) => {
    const m = t.match(/^([A-Z][a-z]?)(\d*)$/);
    if (!m) return;
    const sym = m[1];
    const count = m[2] ? parseInt(m[2], 10) : 1;
    if (MOLAR[sym]) total += MOLAR[sym] * count;
  });
  return Math.round(total * 100) / 100;
}

/** Thông tin đầy đủ cho tooltip */
export function chemInfo(chemKey) {
  const c = CHEMICALS[chemKey];
  if (!c) return null;
  return {
    ...c,
    molarMass: molarMass(c.formula),
    reactions: REACTIONS.filter((r) => r.inputs.includes(chemKey)).length,
  };
}

/* ============================================================
   8) SHARE URL — encode/decode trạng thái cốc
   ============================================================ */

export function encodeState(contents) {
  return btoa(JSON.stringify(contents))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function decodeState(str) {
  try {
    const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(b64));
  } catch {
    return null;
  }
}

/* ============================================================
   9) GỢI Ý NHIỆM VỤ — đọc theo mission đã có
   ============================================================ */

export function missionProgress(contents, missions, done) {
  const keys = Object.keys(contents).filter((k) => contents[k] > 0);
  return missions.map((m) => ({
    ...m,
    matches: m.required.every((k) => keys.includes(k)),
    isDone: done.includes(m.id),
  }));
}

/* ============================================================
   10) PHÂN TÍCH KẾT QUẢ SAU PHẢN ỨNG — dùng cho notebook
   ============================================================ */

export function describeProduct(chemKey, units) {
  const c = CHEMICALS[chemKey];
  if (!c) return null;
  return {
    formula: c.formula,
    name: c.name,
    units,
    state: c.state,
    molarMass: molarMass(c.formula),
  };
}