/* ============================================================
   engine.js — ENGINE MÔ PHỎNG HÓA HỌC (tách biệt khỏi UI/3D)
   ------------------------------------------------------------
   - ChemicalCatalog: danh mục chất (dữ liệu thật, kiểm tra theo
     SGK Hóa học THPT Việt Nam)
   - ReactionRule: phương trình đã cân bằng + hiện tượng + điều kiện
   - ReactionEngine / Simulation: trạng thái dung dịch trong dụng cụ,
     tính thể tích, mol, pH, hiện tượng, nhiệt độ
   GIỚI HẠN (công bố rõ): mô hình đơn giản cho mức THPT — dung dịch
   loãng, axit/bazơ mạnh cân bằng gần đúng; KHÔNG mô phỏng động học.
   ============================================================ */

/* ================= CHEMICAL CATALOG ================= */
export const CHEMS = {
  // — Kim loại (chất rắn) —
  Na: { id: 'Na', vi: 'Natri', en: 'Sodium', formula: 'Na', M: 23, state: 'solid', color: '#b8c0cc', cat: 'kim-loai', hazard: ['nước'], lab: 'Rất phản ứng với nước — hệ thống CHẶN thao tác này vì an toàn.' },
  Mg: { id: 'Mg', vi: 'Magie', en: 'Magnesium', formula: 'Mg', M: 24.3, state: 'solid', color: '#cfd6de', cat: 'kim-loai', hazard: [] },
  Al: { id: 'Al', vi: 'Nhôm', en: 'Aluminium', formula: 'Al', M: 27, state: 'solid', color: '#d4d9df', cat: 'kim-loai', hazard: [] },
  Zn: { id: 'Zn', vi: 'Kẽm', en: 'Zinc', formula: 'Zn', M: 65.4, state: 'solid', color: '#b6bec8', cat: 'kim-loai', hazard: [] },
  Fe: { id: 'Fe', vi: 'Sắt', en: 'Iron', formula: 'Fe', M: 55.8, state: 'solid', color: '#9aa3ad', cat: 'kim-loai', hazard: [] },
  Cu: { id: 'Cu', vi: 'Đồng', en: 'Copper', formula: 'Cu', M: 63.5, state: 'solid', color: '#c77b48', cat: 'kim-loai', hazard: [] },

  // — Dung dịch axit —
  HCl: { id: 'HCl', vi: 'Axit clohidric', en: 'Hydrochloric acid', formula: 'HCl', M: 36.5, state: 'solution', conc: 1, color: '#eef4fa', cat: 'axit', hazard: ['ăn mòn'], H: 1 },
  H2SO4: { id: 'H2SO4', vi: 'Axit sulfuric (loãng)', en: 'Sulfuric acid', formula: 'H2SO4', M: 98, state: 'solution', conc: 0.5, color: '#f2f6fb', cat: 'axit', hazard: ['ăn mòn'], H: 2 },
  CH3COOH: { id: 'CH3COOH', vi: 'Axit axetic', en: 'Acetic acid', formula: 'CH3COOH', M: 60, state: 'solution', conc: 1, color: '#f6f8f4', cat: 'axit', weak: true, pKa: 4.76, hazard: [], H: 1 },

  // — Dung dịch bazơ —
  NaOH: { id: 'NaOH', vi: 'Natri hidroxit', en: 'Sodium hydroxide', formula: 'NaOH', M: 40, state: 'solution', conc: 1, color: '#f4f7fa', cat: 'bazơ', hazard: ['ăn mòn'], OH: 1 },
  KOH: { id: 'KOH', vi: 'Kali hidroxit', en: 'Potassium hydroxide', formula: 'KOH', M: 56, state: 'solution', conc: 1, color: '#f4f7fa', cat: 'bazơ', hazard: ['ăn mòn'], OH: 1 },
  BaOH2: { id: 'BaOH2', vi: 'Bari hidroxit', en: 'Barium hydroxide', formula: 'Ba(OH)2', M: 171, state: 'solution', conc: 0.5, color: '#f4f7fa', cat: 'bazơ', hazard: ['độc'], OH: 2 },

  // — Dung dịch muối —
  NaCl: { id: 'NaCl', vi: 'Natri clorua', en: 'Sodium chloride', formula: 'NaCl', M: 58.5, state: 'solution', conc: 1, color: '#f3f7fb', cat: 'muối', hazard: [] },
  CuSO4: { id: 'CuSO4', vi: 'Đồng sunfat', en: 'Copper(II) sulfate', formula: 'CuSO4', M: 159.6, state: 'solution', conc: 0.5, color: '#3b8fe0', cat: 'muối', hazard: ['độc'] },
  FeCl3: { id: 'FeCl3', vi: 'Sắt(III) clorua', en: 'Iron(III) chloride', formula: 'FeCl3', M: 162.2, state: 'solution', conc: 0.5, color: '#c98a3d', cat: 'muối', hazard: ['ăn mòn'] },
  AgNO3: { id: 'AgNO3', vi: 'Bạc nitrat', en: 'Silver nitrate', formula: 'AgNO3', M: 169.9, state: 'solution', conc: 0.5, color: '#f3f7fb', cat: 'muối', hazard: ['ăn mòn'] },
  BaCl2: { id: 'BaCl2', vi: 'Bari clorua', en: 'Barium chloride', formula: 'BaCl2', M: 208.2, state: 'solution', conc: 0.5, color: '#f3f7fb', cat: 'muối', hazard: ['độc'] },
  Na2CO3: { id: 'Na2CO3', vi: 'Natri cacbonat', en: 'Sodium carbonate', formula: 'Na2CO3', M: 106, state: 'solution', conc: 1, color: '#f4f8fa', cat: 'muối', hazard: [] },
  FeSO4: { id: 'FeSO4', vi: 'Sắt(II) sunfat', en: 'Iron(II) sulfate', formula: 'FeSO4', M: 151.9, state: 'solution', conc: 0.5, color: '#bfe0c8', cat: 'muối', hazard: [] },

  // — Rắn dùng cho phản ứng với dung dịch —
  CaCO3: { id: 'CaCO3', vi: 'Canxi cacbonat (đá vôi)', en: 'Calcium carbonate', formula: 'CaCO3', M: 100, state: 'solid', color: '#e8e6df', cat: 'phi-kim', hazard: [], solidGram: 5 },
  Zn_gran: { id: 'Zn_gran', vi: 'Kẽm hạt', en: 'Zinc granule', formula: 'Zn', M: 65.4, state: 'solid', color: '#b6bec8', cat: 'kim-loai', hazard: [], solidGram: 3 },
  Fe_nail: { id: 'Fe_nail', vi: 'Đinh sắt sạch', en: 'Iron nail', formula: 'Fe', M: 55.8, state: 'solid', color: '#9aa3ad', cat: 'kim-loai', hazard: [], solidGram: 3 },

  // — Chỉ thị —
  Quy: { id: 'Quy', vi: 'Quỳ tím (dung dịch)', en: 'Litmus solution', formula: '—', M: 0, state: 'indicator', color: '#8b5cf6', cat: 'chi-thi', hazard: [] },
  PPT: { id: 'PPT', vi: 'Phenolphthalein', en: 'Phenolphthalein', formula: '—', M: 0, state: 'indicator', color: '#f3f7fb', cat: 'chi-thi', hazard: [] },
};

/* ================= REACTION RULES ================= */
/* mol = mL/1000 × conc (dung dịch) hoặc grams/M (rắn) */
const eq = (s) => s;
export const REACTIONS = [
  {
    id: 'hcl-naoh',
    eqStr: eq('HCl + NaOH → NaCl + H2O'),
    reactants: [{ id: 'HCl', n: 1 }, { id: 'NaOH', n: 1 }],
    products: [{ id: 'NaCl' }],
    obs: { type: 'trung-hoa', text: 'Trung hòa, tỏa nhiệt nhẹ — dung dịch nóng lên.', tempDelta: 3 },
  },
  {
    id: 'h2so4-naoh',
    eqStr: eq('H2SO4 + 2NaOH → Na2SO4 + 2H2O'),
    reactants: [{ id: 'H2SO4', n: 1 }, { id: 'NaOH', n: 2 }],
    products: [{ id: 'NaCl', remap: 'Na2SO4' }],
    obs: { type: 'trung-hoa', text: 'Trung hòa, tỏa nhiệt.', tempDelta: 4 },
  },
  {
    id: 'cuso4-naoh',
    eqStr: eq('CuSO4 + 2NaOH → Cu(OH)2↓ + Na2SO4'),
    reactants: [{ id: 'CuSO4', n: 1 }, { id: 'NaOH', n: 2 }],
    products: [],
    obs: { type: 'kettua', precip: '#4aa3e8', text: 'Xuất hiện kết tủa xanh Cu(OH)2.' },
  },
  {
    id: 'fecl3-naoh',
    eqStr: eq('FeCl3 + 3NaOH → Fe(OH)3↓ + 3NaCl'),
    reactants: [{ id: 'FeCl3', n: 1 }, { id: 'NaOH', n: 3 }],
    products: [],
    obs: { type: 'kettua', precip: '#a0522d', text: 'Xuất hiện kết tủa nâu đỏ Fe(OH)3.' },
  },
  {
    id: 'bacl2-h2so4',
    eqStr: eq('BaCl2 + H2SO4 → BaSO4↓ + 2HCl'),
    reactants: [{ id: 'BaCl2', n: 1 }, { id: 'H2SO4', n: 1 }],
    products: [{ id: 'HCl' }],
    obs: { type: 'kettua', precip: '#f5f7fa', text: 'Xuất hiện kết tủa trắng BaSO4 — rất ít tan.' },
  },
  {
    id: 'bacl2-cuso4',
    eqStr: eq('BaCl2 + CuSO4 → BaSO4↓ + CuCl2'),
    reactants: [{ id: 'BaCl2', n: 1 }, { id: 'CuSO4', n: 1 }],
    products: [{ id: 'CuSO4', remap: 'CuCl2' }],
    obs: { type: 'kettua', precip: '#f5f7fa', text: 'Kết tủa trắng BaSO4; dung dịch vẫn màu xanh của Cu²⁺.' },
  },
  {
    id: 'agno3-nacl',
    eqStr: eq('AgNO3 + NaCl → AgCl↓ + NaNO3'),
    reactants: [{ id: 'AgNO3', n: 1 }, { id: 'NaCl', n: 1 }],
    products: [],
    obs: { type: 'kettua', precip: '#f8fafc', text: 'Kết tủa trắng AgCl — dùng nhận diện ion Cl⁻.' },
  },
  {
    id: 'na2co3-hcl',
    eqStr: eq('Na2CO3 + 2HCl → 2NaCl + H2O + CO2↑'),
    reactants: [{ id: 'Na2CO3', n: 1 }, { id: 'HCl', n: 2 }],
    products: [{ id: 'NaCl' }],
    obs: { type: 'khi', gas: 'CO2', text: 'Sủi bọt khí CO2 không màu.' },
  },
  {
    id: 'caco3-hcl',
    eqStr: eq('CaCO3 + 2HCl → CaCl2 + H2O + CO2↑'),
    reactants: [{ id: 'CaCO3', n: 1 }, { id: 'HCl', n: 2 }],
    products: [{ id: 'NaCl', remap: 'CaCl2' }],
    obs: { type: 'khi', gas: 'CO2', text: 'Đá vôi tan dần, sủi bọt khí CO2.' },
  },
  {
    id: 'zn-hcl',
    eqStr: eq('Zn + 2HCl → ZnCl2 + H2↑'),
    reactants: [{ id: 'Zn_gran', n: 1 }, { id: 'HCl', n: 2 }],
    products: [{ id: 'NaCl', remap: 'ZnCl2' }],
    obs: { type: 'khi', gas: 'H2', text: 'Kẽm tan dần, sủi bọt khí H2 không màu.' },
  },
  {
    id: 'fe-cuso4',
    eqStr: eq('Fe + CuSO4 → FeSO4 + Cu↓'),
    reactants: [{ id: 'Fe_nail', n: 1 }, { id: 'CuSO4', n: 1 }],
    products: [{ id: 'FeSO4' }],
    obs: { type: 'ket-bam', precip: '#a3552f', text: 'Lớp đồng đỏ nâu bám vào đinh sắt; màu xanh của dung dịch nhạt dần.' },
  },
  {
    id: 'zn-cuso4',
    eqStr: eq('Zn + CuSO4 → ZnSO4 + Cu↓'),
    reactants: [{ id: 'Zn_gran', n: 1 }, { id: 'CuSO4', n: 1 }],
    products: [{ id: 'FeSO4', remap: 'ZnSO4' }],
    obs: { type: 'ket-bam', precip: '#a3552f', text: 'Lớp đồng đỏ nâu bám vào kẽm; màu xanh nhạt dần.' },
  },
];

/* Cặp KHÔNG phản ứng nhưng người học hay thử — trả lời đúng khoa học */
export const NO_REACTIONS = [
  { ids: ['Cu', 'HCl'], text: 'Cu đứng sau H trong dãy hoạt động hóa học → KHÔNG phản ứng với dung dịch HCl loãng.' },
  { ids: ['Cu', 'H2SO4'], text: 'Cu không phản ứng với H2SO4 loãng (chỉ phản ứng với H2SO4 đặc, nóng — ngoài phạm vi mô phỏng).' },
];

/* Chặn tuyệt đối vì an toàn */
export const BLOCKED = ['Na', 'K', 'Ca'];

export const molOf = (chemId, amount) => {
  const c = CHEMS[chemId];
  if (!c) return 0;
  if (c.state === 'solution') return (amount / 1000) * c.conc;
  if (c.state === 'solid') return (amount || c.solidGram || 1) / c.M;
  return amount / c.M;
};

export const chemLabel = (c) => c ? `${c.vi} (${c.formula})` : '—';

/* ================= SIMULATION ================= */
export function createContainer(id, maxMl = 250) {
  return { id, contents: [], precipitates: [], indicators: [], temp: 25, gas: null, maxMl };
}

export function volumeOf(container) {
  return container.contents.reduce((s, c) => s + c.mL, 0);
}

/* Pha màu dung dịch theo TỶ LỆ THỂ TÍCH (giống thực tế hơn) */
function mixHex(colors) {
  if (!colors.length) return '#dfe9f3';
  if (colors.length === 1) return colors[0].color;
  let r = 0, g = 0, b = 0, w = 0;
  for (const { color, weight } of colors) {
    const h = color.replace('#', '');
    r += parseInt(h.slice(0, 2), 16) * weight;
    g += parseInt(h.slice(2, 4), 16) * weight;
    b += parseInt(h.slice(4, 6), 16) * weight;
    w += weight;
  }
  const to2 = (v) => Math.round(v / w).toString(16).padStart(2, '0');
  return '#' + to2(r) + to2(g) + to2(b);
}

export function dominantColor(container) {
  const parts = [];
  for (const c of container.contents) {
    const chem = CHEMS[c.id];
    if (!chem || chem.state === 'indicator') continue;
    parts.push({ color: chem.color, weight: c.mL });
  }
  let color = mixHex(parts);
  /* Chỉ thị đổi màu theo pH */
  const pH = computePH(container);
  for (const ind of container.indicators) {
    if (ind === 'Quy') color = pH < 6.5 ? '#e05555' : pH > 7.5 ? '#5b8fe0' : '#8b5cf6';
    if (ind === 'PPT') color = pH > 8.3 ? '#f472b6' : color;
  }
  return color;
}

export function computePH(container) {
  let nH = 0, nOH = 0, weakMol = 0;
  let volume = 0;
  for (const c of container.contents) {
    const chem = CHEMS[c.id];
    if (!chem) continue;
    volume += c.mL;
    const mol = molOf(c.id, c.mL);
    if (chem.weak && chem.H) weakMol += mol;
    else if (chem.H) nH += mol * chem.H;
    if (chem.OH) nOH += mol * chem.OH;
  }
  if (volume <= 0) return 7;
  /* Axit yếu đơn thuần: [H+] ≈ √(Ka·C) — công thức mức THPT */
  if (weakMol > 0 && nH === 0 && nOH === 0) {
    const Cw = weakMol / (volume / 1000);
    const Ka = 1.74e-5; // CH3COOH
    const hConc = Math.sqrt(Ka * Cw);
    return Math.max(0.5, Math.min(14, -Math.log10(hConc)));
  }
  const net = nH + (weakMol > 0 ? Math.sqrt(1.74e-5 * (weakMol / (volume / 1000))) * (volume / 1000) : 0) - nOH;
  if (net > 0) return Math.max(0.5, Math.min(14, -Math.log10(net / (volume / 1000))));
  if (net < 0) return Math.max(0.5, Math.min(14, 14 + Math.log10(-net / (volume / 1000))));
  return 7;
}

/* Thêm chất vào dụng cụ → chạy engine phản ứng → trả về events */
export function addChemical(container, chemId, amount) {
  const chem = CHEMS[chemId];
  if (!chem) return { ok: false, reason: 'Chất không tồn tại' };
  if (BLOCKED.includes(chemId)) return { ok: false, reason: chem.lab || 'Chất này quá nguy hiểm — hệ thống chặn thao tác.', blocked: true };
  if (chem.state === 'indicator') {
    if (!container.indicators.includes(chemId)) container.indicators.push(chemId);
    return { ok: true, events: [{ type: 'indicator', text: `Đã thêm ${chem.vi} vào dung dịch.` }] };
  }
  if (chem.state === 'solid' && container.contents.length === 0) {
    return { ok: false, reason: 'Cho rắn vào dụng cụ trống — cần có dung dịch để thực hiện phép thử.' };
  }
  if (volumeOf(container) + amount > container.maxMl) {
    return { ok: false, reason: `Dụng cụ chỉ chứa tối đa ${container.maxMl} mL.` };
  }

  container.contents.push({ id: chemId, mL: amount });
  const events = runReactions(container);
  return { ok: true, events };
}

/* Quét quy tắc phản ứng trên các cặp chất có trong dụng cụ */
function runReactions(container) {
  const events = [];
  let changed = true;
  let guard = 0;
  while (changed && guard++ < 6) {
    changed = false;
    outer:
    for (const rule of REACTIONS) {
      const present = container.contents.map((c) => c.id);
      const need = rule.reactants.map((r) => r.id);
      if (!need.every((id) => present.includes(id))) continue;

      /* Kiểm tra đủ mol theo tỷ lệ (dung dịch mol = mL*conc/1000, rắn = gram/M) */
      const molAvail = {};
      for (const c of container.contents) {
        const chem = CHEMS[c.id];
        if (!chem) continue;
        molAvail[c.id] = (molAvail[c.id] || 0) + (chem.state === 'solid' ? (c.gram || c.solidGram || 1) / chem.M : (c.mL / 1000) * chem.conc);
      }
      const needMol = {};
      for (const r of rule.reactants) needMol[r.id] = molAvail[r.id] / r.n;
      const limiting = Math.min(...Object.values(needMol));
      if (limiting <= 0) continue;

      /* Giảm lượng chất phản ứng theo tỷ lệ mol — GHI NHỚ tổng thể tích đã dùng
         để sản phẩm chiếm đúng phần thể tích đó (bảo toàn thể tích gần đúng) */
      let totalUsedMl = 0;
      for (const r of rule.reactants) {
        const chem = CHEMS[r.id];
        for (const c of container.contents) {
          if (c.id !== r.id) continue;
          const molToUse = limiting * r.n;
          if (chem.state === 'solid') {
            const gramToUse = molToUse * chem.M;
            c.gram = Math.max(0, (c.gram || c.solidGram || 1) - gramToUse);
          } else {
            const mlToUse = (molToUse / chem.conc) * 1000;
            c.mL = Math.max(0, c.mL - mlToUse);
            totalUsedMl += mlToUse;
          }
        }
      }
      container.contents = container.contents.filter((c) => c.mL > 0.01 && (c.gram === undefined || c.gram > 0.001));

      /* Sản phẩm: chiếm đúng tổng thể tích dung dịch đã phản ứng */
      const usedMl = Math.max(totalUsedMl, limiting * 1000 * rule.reactants.filter((r) => CHEMS[r.id].state === 'solution').length / Math.max(1, rule.reactants.length));
      for (const p of rule.products) {
        const prodId = p.remap || p.id;
        const existing = container.contents.find((c) => c.id === prodId);
        if (existing) existing.mL += usedMl;
        else container.contents.push({ id: prodId, mL: usedMl });
      }

      /* Hiện tượng */
      if (rule.obs.type === 'kettua' || rule.obs.type === 'ket-bam') {
        const has = container.precipitates.find((p) => p.color === rule.obs.precip);
        if (has) has.amount += 1;
        else container.precipitates.push({ color: rule.obs.precip, amount: 1 });
      }
      if (rule.obs.type === 'khi') {
        container.gas = { color: 'rgba(255,255,255,0.75)', gas: rule.obs.gas, startedAt: Date.now(), until: Date.now() + Math.min(14000, 5000 + limiting * 6000) };
      }
      if (rule.obs.tempDelta) container.temp += rule.obs.tempDelta;

      events.push({ type: rule.obs.type, text: rule.obs.text, eq: rule.eqStr });
      changed = true;
      break outer;
    }
  }

  /* Cặp KHÔNG phản ứng — trả lời đúng khoa học nếu đủ 2 chất và chưa có event nào */
  if (!events.length && container.contents.length >= 2) {
    const present = new Set(container.contents.map((c) => c.id));
    for (const nr of NO_REACTIONS) {
      if (nr.ids.every((id) => present.has(id))) {
        events.push({ type: 'no-reaction', text: nr.text });
        break;
      }
    }
  }
  return events;
}

/* Log thao tác cho sổ thí nghiệm */
export function logEntry(list, entry) {
  return [...list.slice(-40), { at: new Date().toISOString(), ...entry }];
}
