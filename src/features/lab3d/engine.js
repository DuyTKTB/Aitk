/* ============================================================
   engine.js — ENGINE MÔ PHỎNG HÓA HỌC (tách biệt khỏi UI/3D)
   ------------------------------------------------------------
   - ChemicalCatalog: danh mục chất (dữ liệu thật, kiểm tra theo
     SGK Hóa học THPT Việt Nam)
   - ReactionRule: phương trình đã cân bằng + hiện tượng + điều kiện
   - ReactionEngine / Simulation: trạng thái dung dịch trong dụng cụ,
     tính thể tích, khối lượng rắn, mol, pH, hiện tượng, nhiệt độ,
     lưỡng tính, tạo phức, nhiệt phân và chuyển dung dịch giữa các cốc.
   GIỚI HẠN (công bố rõ): mô hình đơn giản cho mức THPT — dung dịch
   loãng, axit/bazơ mạnh cân bằng gần đúng; KHÔNG mô phỏng động học.
   ============================================================ */

/* ================= CHEMICAL CATALOG ================= */
export const CHEMS = {
  // — Dung môi —
  H2O: { id: 'H2O', vi: 'Nước cất', en: 'Distilled water', formula: 'H2O', M: 18, state: 'solution', conc: 0, color: '#eef6fc', cat: 'dung-moi', hazard: [] },

  // — Kim loại & chất rắn —
  Na: { id: 'Na', vi: 'Natri', en: 'Sodium', formula: 'Na', M: 23, state: 'solid', color: '#b8c0cc', cat: 'kim-loai', hazard: ['nước'], lab: 'Rất phản ứng với nước — hệ thống CHẶN thao tác này vì an toàn.', solidGram: 2 },
  Mg_ribbon: { id: 'Mg_ribbon', vi: 'Băng magie', en: 'Magnesium ribbon', formula: 'Mg', M: 24.3, state: 'solid', color: '#cfd6de', cat: 'kim-loai', hazard: [], solidGram: 2, shape: 'strip' },
  Al_foil: { id: 'Al_foil', vi: 'Lá nhôm sạch', en: 'Aluminium foil', formula: 'Al', M: 27, state: 'solid', color: '#d4d9df', cat: 'kim-loai', hazard: [], solidGram: 2, shape: 'strip' },
  Zn_gran: { id: 'Zn_gran', vi: 'Kẽm hạt', en: 'Zinc granule', formula: 'Zn', M: 65.4, state: 'solid', color: '#b6bec8', cat: 'kim-loai', hazard: [], solidGram: 3, shape: 'granule' },
  Fe_nail: { id: 'Fe_nail', vi: 'Đinh sắt sạch', en: 'Iron nail', formula: 'Fe', M: 55.8, state: 'solid', color: '#9aa3ad', cat: 'kim-loai', hazard: [], solidGram: 3, shape: 'nail' },
  Cu_wire: { id: 'Cu_wire', vi: 'Dây đồng đỏ', en: 'Copper wire', formula: 'Cu', M: 63.5, state: 'solid', color: '#c77b48', cat: 'kim-loai', hazard: [], solidGram: 3, shape: 'nail' },
  CaCO3: { id: 'CaCO3', vi: 'Đá vôi (CaCO3)', en: 'Calcium carbonate', formula: 'CaCO3', M: 100, state: 'solid', color: '#e8e6df', cat: 'phi-kim', hazard: [], solidGram: 5, shape: 'granule' },

  // Giữ tương thích ngược với các mã rắn cũ
  Mg: { id: 'Mg', vi: 'Magie', en: 'Magnesium', formula: 'Mg', M: 24.3, state: 'solid', color: '#cfd6de', cat: 'kim-loai', hazard: [], solidGram: 2, shape: 'strip', hiddenInList: true },
  Al: { id: 'Al', vi: 'Nhôm', en: 'Aluminium', formula: 'Al', M: 27, state: 'solid', color: '#d4d9df', cat: 'kim-loai', hazard: [], solidGram: 2, shape: 'strip', hiddenInList: true },
  Zn: { id: 'Zn', vi: 'Kẽm', en: 'Zinc', formula: 'Zn', M: 65.4, state: 'solid', color: '#b6bec8', cat: 'kim-loai', hazard: [], solidGram: 3, shape: 'granule', hiddenInList: true },
  Fe: { id: 'Fe', vi: 'Sắt', en: 'Iron', formula: 'Fe', M: 55.8, state: 'solid', color: '#9aa3ad', cat: 'kim-loai', hazard: [], solidGram: 3, shape: 'nail', hiddenInList: true },
  Cu: { id: 'Cu', vi: 'Đồng', en: 'Copper', formula: 'Cu', M: 63.5, state: 'solid', color: '#c77b48', cat: 'kim-loai', hazard: [], solidGram: 3, shape: 'nail', hiddenInList: true },

  // — Dung dịch axit —
  HCl: { id: 'HCl', vi: 'Axit clohidric', en: 'Hydrochloric acid', formula: 'HCl', M: 36.5, state: 'solution', conc: 1, color: '#eef4fa', cat: 'axit', hazard: ['ăn mòn'], H: 1 },
  H2SO4: { id: 'H2SO4', vi: 'Axit sulfuric loãng', en: 'Sulfuric acid', formula: 'H2SO4', M: 98, state: 'solution', conc: 0.5, color: '#f2f6fb', cat: 'axit', hazard: ['ăn mòn'], H: 2 },
  HNO3: { id: 'HNO3', vi: 'Axit nitric loãng', en: 'Nitric acid', formula: 'HNO3', M: 63, state: 'solution', conc: 1, color: '#eef4fa', cat: 'axit', hazard: ['ăn mòn'], H: 1 },
  CH3COOH: { id: 'CH3COOH', vi: 'Axit axetic', en: 'Acetic acid', formula: 'CH3COOH', M: 60, state: 'solution', conc: 1, color: '#f6f8f4', cat: 'axit', weak: true, pKa: 4.76, hazard: [], H: 1 },

  // — Dung dịch bazơ —
  NaOH: { id: 'NaOH', vi: 'Natri hidroxit', en: 'Sodium hydroxide', formula: 'NaOH', M: 40, state: 'solution', conc: 1, color: '#f4f7fa', cat: 'bazơ', hazard: ['ăn mòn'], OH: 1 },
  KOH: { id: 'KOH', vi: 'Kali hidroxit', en: 'Potassium hydroxide', formula: 'KOH', M: 56, state: 'solution', conc: 1, color: '#f4f7fa', cat: 'bazơ', hazard: ['ăn mòn'], OH: 1 },
  BaOH2: { id: 'BaOH2', vi: 'Bari hidroxit', en: 'Barium hydroxide', formula: 'Ba(OH)2', M: 171, state: 'solution', conc: 0.5, color: '#f4f7fa', cat: 'bazơ', hazard: ['độc'], OH: 2 },
  NH3: { id: 'NH3', vi: 'Dung dịch Amoniac', en: 'Ammonia solution', formula: 'NH3', M: 17, state: 'solution', conc: 1, color: '#f2f7fb', cat: 'bazơ', weakBase: true, pKb: 4.75, hazard: [], OH: 1 },

  // — Dung dịch muối —
  NaCl: { id: 'NaCl', vi: 'Natri clorua', en: 'Sodium chloride', formula: 'NaCl', M: 58.5, state: 'solution', conc: 1, color: '#f3f7fb', cat: 'muối', hazard: [] },
  CuSO4: { id: 'CuSO4', vi: 'Đồng(II) sunfat', en: 'Copper(II) sulfate', formula: 'CuSO4', M: 159.6, state: 'solution', conc: 0.5, color: '#3b8fe0', cat: 'muối', hazard: ['độc'] },
  FeCl3: { id: 'FeCl3', vi: 'Sắt(III) clorua', en: 'Iron(III) chloride', formula: 'FeCl3', M: 162.2, state: 'solution', conc: 0.5, color: '#c98a3d', cat: 'muối', hazard: ['ăn mòn'] },
  FeSO4: { id: 'FeSO4', vi: 'Sắt(II) sunfat', en: 'Iron(II) sulfate', formula: 'FeSO4', M: 151.9, state: 'solution', conc: 0.5, color: '#bfe0c8', cat: 'muối', hazard: [] },
  AlCl3: { id: 'AlCl3', vi: 'Nhôm clorua', en: 'Aluminium chloride', formula: 'AlCl3', M: 133.5, state: 'solution', conc: 0.5, color: '#f3f7fb', cat: 'muối', hazard: [] },
  AgNO3: { id: 'AgNO3', vi: 'Bạc nitrat', en: 'Silver nitrate', formula: 'AgNO3', M: 169.9, state: 'solution', conc: 0.5, color: '#f3f7fb', cat: 'muối', hazard: ['ăn mòn'] },
  BaCl2: { id: 'BaCl2', vi: 'Bari clorua', en: 'Barium chloride', formula: 'BaCl2', M: 208.2, state: 'solution', conc: 0.5, color: '#f3f7fb', cat: 'muối', hazard: ['độc'] },
  Na2CO3: { id: 'Na2CO3', vi: 'Natri cacbonat', en: 'Sodium carbonate', formula: 'Na2CO3', M: 106, state: 'solution', conc: 1, color: '#f4f8fa', cat: 'muối', hazard: [] },
  KI: { id: 'KI', vi: 'Kali iotua', en: 'Potassium iodide', formula: 'KI', M: 166, state: 'solution', conc: 0.5, color: '#f5f8fb', cat: 'muối', hazard: [] },
  KMnO4: { id: 'KMnO4', vi: 'Thuốc tím (KMnO4)', en: 'Potassium permanganate', formula: 'KMnO4', M: 158, state: 'solution', conc: 0.2, color: '#9333ea', cat: 'muối', hazard: ['ăn mòn'] },

  // — Sản phẩm dung dịch nội bộ (ẩn khỏi danh sách chọn nhưng dùng để pha màu chính xác) —
  Cu_NH3_4: { id: 'Cu_NH3_4', vi: 'Phức đồng-amoniac', en: 'Tetraamminecopper(II)', formula: '[Cu(NH3)4](OH)2', M: 169.6, state: 'solution', conc: 0.5, color: '#1d4ed8', cat: 'muối', hazard: [], hiddenInList: true },
  NaAlO2: { id: 'NaAlO2', vi: 'Natri aluminat', en: 'Sodium aluminate', formula: 'Na[Al(OH)4]', M: 118, state: 'solution', conc: 0.5, color: '#f3f7fb', cat: 'muối', hazard: [], hiddenInList: true },
  Fe2SO43: { id: 'Fe2SO43', vi: 'Sắt(III) sunfat', en: 'Iron(III) sulfate', formula: 'Fe2(SO4)3', M: 400, state: 'solution', conc: 0.3, color: '#eab308', cat: 'muối', hazard: [], hiddenInList: true },

  // — Chỉ thị —
  Quy: { id: 'Quy', vi: 'Quỳ tím', en: 'Litmus indicator', formula: 'Chỉ thị', M: 0, state: 'indicator', color: '#8b5cf6', cat: 'chi-thi', hazard: [] },
  PPT: { id: 'PPT', vi: 'Phenolphthalein', en: 'Phenolphthalein', formula: 'Chỉ thị', M: 0, state: 'indicator', color: '#f3f7fb', cat: 'chi-thi', hazard: [] },
  MO: { id: 'MO', vi: 'Metyl da cam', en: 'Methyl orange', formula: 'Chỉ thị', M: 0, state: 'indicator', color: '#f59e0b', cat: 'chi-thi', hazard: [] },
};

/* ================= REACTION RULES ================= */
const eq = (s) => s;
export const REACTIONS = [
  {
    id: 'hcl-naoh',
    eqStr: eq('HCl + NaOH → NaCl + H2O'),
    reactants: [{ id: 'HCl', n: 1 }, { id: 'NaOH', n: 1 }],
    products: [{ id: 'NaCl' }],
    obs: { type: 'trung-hoa', text: 'Phản ứng trung hòa tỏa nhiệt nhẹ — dung dịch ấm lên.', tempDelta: 3 },
  },
  {
    id: 'hcl-koh',
    eqStr: eq('HCl + KOH → KCl + H2O'),
    reactants: [{ id: 'HCl', n: 1 }, { id: 'KOH', n: 1 }],
    products: [{ id: 'NaCl' }],
    obs: { type: 'trung-hoa', text: 'Trung hòa axit mạnh và bazơ mạnh, tỏa nhiệt nhẹ.', tempDelta: 3 },
  },
  {
    id: 'h2so4-naoh',
    eqStr: eq('H2SO4 + 2NaOH → Na2SO4 + 2H2O'),
    reactants: [{ id: 'H2SO4', n: 1 }, { id: 'NaOH', n: 2 }],
    products: [{ id: 'NaCl', remap: 'NaCl' }],
    obs: { type: 'trung-hoa', text: 'Trung hòa hoàn toàn, dung dịch nóng lên.', tempDelta: 4 },
  },
  {
    id: 'h2so4-baoh2',
    eqStr: eq('H2SO4 + Ba(OH)2 → BaSO4↓ + 2H2O'),
    reactants: [{ id: 'H2SO4', n: 1 }, { id: 'BaOH2', n: 1 }],
    products: [{ id: 'H2O' }],
    obs: { type: 'kettua', precip: '#f5f7fa', precipFormula: 'BaSO4', text: 'Xuất hiện kết tủa trắng BaSO4 bền trong axit.' },
  },
  {
    id: 'cuso4-naoh',
    eqStr: eq('CuSO4 + 2NaOH → Cu(OH)2↓ + Na2SO4'),
    reactants: [{ id: 'CuSO4', n: 1 }, { id: 'NaOH', n: 2 }],
    products: [{ id: 'NaCl' }],
    obs: { type: 'kettua', precip: '#4aa3e8', precipFormula: 'Cu(OH)2', text: 'Xuất hiện kết tủa xanh lam Cu(OH)2.' },
  },
  {
    id: 'cuso4-koh',
    eqStr: eq('CuSO4 + 2KOH → Cu(OH)2↓ + K2SO4'),
    reactants: [{ id: 'CuSO4', n: 1 }, { id: 'KOH', n: 2 }],
    products: [{ id: 'NaCl' }],
    obs: { type: 'kettua', precip: '#4aa3e8', precipFormula: 'Cu(OH)2', text: 'Xuất hiện kết tủa xanh lam Cu(OH)2.' },
  },
  {
    id: 'cuso4-nh3',
    eqStr: eq('CuSO4 + 2NH3 + 2H2O → Cu(OH)2↓ + (NH4)2SO4'),
    reactants: [{ id: 'CuSO4', n: 1 }, { id: 'NH3', n: 2 }],
    products: [{ id: 'NaCl' }],
    obs: { type: 'kettua', precip: '#4aa3e8', precipFormula: 'Cu(OH)2', text: 'Tạo kết tủa xanh lam Cu(OH)2 (sẽ tan nếu thêm NH3 dư).' },
  },
  {
    id: 'alcl3-naoh',
    eqStr: eq('AlCl3 + 3NaOH → Al(OH)3↓ + 3NaCl'),
    reactants: [{ id: 'AlCl3', n: 1 }, { id: 'NaOH', n: 3 }],
    products: [{ id: 'NaCl' }],
    obs: { type: 'kettua', precip: '#e2e8f0', precipFormula: 'Al(OH)3', text: 'Xuất hiện kết tủa keo trắng Al(OH)3 (tan trong kiềm dư).' },
  },
  {
    id: 'alcl3-nh3',
    eqStr: eq('AlCl3 + 3NH3 + 3H2O → Al(OH)3↓ + 3NH4Cl'),
    reactants: [{ id: 'AlCl3', n: 1 }, { id: 'NH3', n: 3 }],
    products: [{ id: 'NaCl' }],
    obs: { type: 'kettua', precip: '#e2e8f0', precipFormula: 'Al(OH)3', text: 'Kết tủa keo trắng Al(OH)3 bền, không tan trong NH3 dư.' },
  },
  {
    id: 'fecl3-naoh',
    eqStr: eq('FeCl3 + 3NaOH → Fe(OH)3↓ + 3NaCl'),
    reactants: [{ id: 'FeCl3', n: 1 }, { id: 'NaOH', n: 3 }],
    products: [{ id: 'NaCl' }],
    obs: { type: 'kettua', precip: '#a0522d', precipFormula: 'Fe(OH)3', text: 'Xuất hiện kết tủa nâu đỏ Fe(OH)3.' },
  },
  {
    id: 'feso4-naoh',
    eqStr: eq('FeSO4 + 2NaOH → Fe(OH)2↓ + Na2SO4'),
    reactants: [{ id: 'FeSO4', n: 1 }, { id: 'NaOH', n: 2 }],
    products: [{ id: 'NaCl' }],
    obs: { type: 'kettua', precip: '#bbf7d0', precipFormula: 'Fe(OH)2', text: 'Xuất hiện kết tủa trắng xanh Fe(OH)2.' },
  },
  {
    id: 'bacl2-h2so4',
    eqStr: eq('BaCl2 + H2SO4 → BaSO4↓ + 2HCl'),
    reactants: [{ id: 'BaCl2', n: 1 }, { id: 'H2SO4', n: 1 }],
    products: [{ id: 'HCl' }],
    obs: { type: 'kettua', precip: '#f5f7fa', precipFormula: 'BaSO4', text: 'Xuất hiện kết tủa trắng BaSO4 — không tan trong axit.' },
  },
  {
    id: 'bacl2-cuso4',
    eqStr: eq('BaCl2 + CuSO4 → BaSO4↓ + CuCl2'),
    reactants: [{ id: 'BaCl2', n: 1 }, { id: 'CuSO4', n: 1 }],
    products: [{ id: 'CuSO4', remap: 'CuSO4' }],
    obs: { type: 'kettua', precip: '#f5f7fa', precipFormula: 'BaSO4', text: 'Kết tủa trắng BaSO4; dung dịch vẫn màu xanh của Cu²⁺.' },
  },
  {
    id: 'bacl2-na2co3',
    eqStr: eq('BaCl2 + Na2CO3 → BaCO3↓ + 2NaCl'),
    reactants: [{ id: 'BaCl2', n: 1 }, { id: 'Na2CO3', n: 1 }],
    products: [{ id: 'NaCl' }],
    obs: { type: 'kettua', precip: '#f8fafc', precipFormula: 'BaCO3', text: 'Xuất hiện kết tủa trắng BaCO3.' },
  },
  {
    id: 'agno3-nacl',
    eqStr: eq('AgNO3 + NaCl → AgCl↓ + NaNO3'),
    reactants: [{ id: 'AgNO3', n: 1 }, { id: 'NaCl', n: 1 }],
    products: [{ id: 'NaCl' }],
    obs: { type: 'kettua', precip: '#f8fafc', precipFormula: 'AgCl', text: 'Kết tủa trắng AgCl — dùng nhận diện ion Cl⁻.' },
  },
  {
    id: 'agno3-hcl',
    eqStr: eq('AgNO3 + HCl → AgCl↓ + HNO3'),
    reactants: [{ id: 'AgNO3', n: 1 }, { id: 'HCl', n: 1 }],
    products: [{ id: 'HNO3' }],
    obs: { type: 'kettua', precip: '#f8fafc', precipFormula: 'AgCl', text: 'Xuất hiện kết tủa trắng AgCl.' },
  },
  {
    id: 'agno3-ki',
    eqStr: eq('AgNO3 + KI → AgI↓ + KNO3'),
    reactants: [{ id: 'AgNO3', n: 1 }, { id: 'KI', n: 1 }],
    products: [{ id: 'NaCl' }],
    obs: { type: 'kettua', precip: '#facc15', precipFormula: 'AgI', text: 'Xuất hiện kết tủa vàng đậm AgI — nhận biết ion I⁻.' },
  },
  {
    id: 'kmno4-feso4',
    eqStr: eq('10FeSO4 + 2KMnO4 + 8H2SO4 → 5Fe2(SO4)3 + 2MnSO4 + K2SO4 + 8H2O'),
    reactants: [{ id: 'FeSO4', n: 2 }, { id: 'KMnO4', n: 1 }, { id: 'H2SO4', n: 1 }],
    products: [{ id: 'Fe2SO43' }],
    obs: { type: 'oxi-hoa', text: 'Dung dịch thuốc tím KMnO4 mất màu tím, chuyển sang vàng nhạt của Fe³⁺.', tempDelta: 2 },
  },
  {
    id: 'na2co3-hcl',
    eqStr: eq('Na2CO3 + 2HCl → 2NaCl + H2O + CO2↑'),
    reactants: [{ id: 'Na2CO3', n: 1 }, { id: 'HCl', n: 2 }],
    products: [{ id: 'NaCl' }],
    obs: { type: 'khi', gas: 'CO2', text: 'Sủi bọt khí CO2 không màu.' },
  },
  {
    id: 'na2co3-h2so4',
    eqStr: eq('Na2CO3 + H2SO4 → Na2SO4 + H2O + CO2↑'),
    reactants: [{ id: 'Na2CO3', n: 1 }, { id: 'H2SO4', n: 1 }],
    products: [{ id: 'NaCl' }],
    obs: { type: 'khi', gas: 'CO2', text: 'Sủi bọt khí CO2 mạnh.' },
  },
  {
    id: 'caco3-hcl',
    eqStr: eq('CaCO3 + 2HCl → CaCl2 + H2O + CO2↑'),
    reactants: [{ id: 'CaCO3', n: 1 }, { id: 'HCl', n: 2 }],
    products: [{ id: 'NaCl', remap: 'NaCl' }],
    obs: { type: 'khi', gas: 'CO2', text: 'Đá vôi tan dần, sủi bọt khí CO2.' },
  },
  {
    id: 'zn-hcl',
    eqStr: eq('Zn + 2HCl → ZnCl2 + H2↑'),
    reactants: [{ id: 'Zn_gran', n: 1 }, { id: 'HCl', n: 2 }],
    products: [{ id: 'NaCl', remap: 'NaCl' }],
    obs: { type: 'khi', gas: 'H2', text: 'Kẽm tan dần, sủi bọt khí H2 không màu.', tempDelta: 3 },
  },
  {
    id: 'mg-hcl',
    eqStr: eq('Mg + 2HCl → MgCl2 + H2↑'),
    reactants: [{ id: 'Mg_ribbon', n: 1 }, { id: 'HCl', n: 2 }],
    products: [{ id: 'NaCl' }],
    obs: { type: 'khi', gas: 'H2', text: 'Băng magie tan rất nhanh, sủi bọt khí H2 mạnh, tỏa nhiệt.', tempDelta: 6 },
  },
  {
    id: 'al-naoh',
    eqStr: eq('2Al + 2NaOH + 2H2O → 2NaAlO2 + 3H2↑'),
    reactants: [{ id: 'Al_foil', n: 1 }, { id: 'NaOH', n: 1 }],
    products: [{ id: 'NaAlO2' }],
    obs: { type: 'khi', gas: 'H2', text: 'Lá nhôm tan dần trong dung dịch kiềm, sủi bọt khí H2.', tempDelta: 4 },
  },
  {
    id: 'fe-cuso4',
    eqStr: eq('Fe + CuSO4 → FeSO4 + Cu↓'),
    reactants: [{ id: 'Fe_nail', n: 1 }, { id: 'CuSO4', n: 1 }],
    products: [{ id: 'FeSO4' }],
    obs: { type: 'ket-bam', precip: '#a3552f', precipFormula: 'Cu', text: 'Lớp đồng đỏ nâu bám vào đinh sắt; màu xanh của dung dịch nhạt dần.' },
  },
  {
    id: 'zn-cuso4',
    eqStr: eq('Zn + CuSO4 → ZnSO4 + Cu↓'),
    reactants: [{ id: 'Zn_gran', n: 1 }, { id: 'CuSO4', n: 1 }],
    products: [{ id: 'NaCl', remap: 'NaCl' }],
    obs: { type: 'ket-bam', precip: '#a3552f', precipFormula: 'Cu', text: 'Lớp đồng đỏ nâu bám vào kẽm; màu xanh nhạt dần.' },
  },
  {
    id: 'cu-agno3',
    eqStr: eq('Cu + 2AgNO3 → Cu(NO3)2 + 2Ag↓'),
    reactants: [{ id: 'Cu_wire', n: 1 }, { id: 'AgNO3', n: 2 }],
    products: [{ id: 'CuSO4' }],
    obs: { type: 'ket-bam', precip: '#cbd5e1', precipFormula: 'Ag', text: 'Tinh thể bạc trắng sáng bám lên dây đồng; dung dịch chuyển dần sang màu xanh lam Cu²⁺.' },
  },
];

/* Cặp KHÔNG phản ứng nhưng người học hay thử — trả lời đúng khoa học */
export const NO_REACTIONS = [
  { ids: ['Cu', 'HCl'], text: 'Cu đứng sau H trong dãy hoạt động hóa học → KHÔNG phản ứng với dung dịch HCl loãng.' },
  { ids: ['Cu_wire', 'HCl'], text: 'Cu đứng sau H trong dãy hoạt động hóa học → KHÔNG phản ứng với dung dịch HCl loãng.' },
  { ids: ['Cu', 'H2SO4'], text: 'Cu không phản ứng với H2SO4 loãng (chỉ phản ứng với H2SO4 đặc, nóng).' },
  { ids: ['Cu_wire', 'H2SO4'], text: 'Cu không phản ứng với H2SO4 loãng (chỉ phản ứng với H2SO4 đặc, nóng).' },
  { ids: ['Fe_nail', 'NaOH'], text: 'Sắt (Fe) không phản ứng với dung dịch kiềm NaOH.' },
  { ids: ['AgNO3', 'HNO3'], text: 'Cùng gốc nitrat (NO3⁻) → không xảy ra phản ứng trao đổi ion.' },
];

/* Chặn tuyệt đối vì an toàn */
export const BLOCKED = ['Na', 'K', 'Ca'];

export const molOf = (chemId, amount) => {
  const c = CHEMS[chemId];
  if (!c) return 0;
  if (c.state === 'solution') return (amount / 1000) * (c.conc || 0);
  if (c.state === 'solid') return (amount || c.solidGram || 1) / c.M;
  return amount / (c.M || 1);
};

export const chemLabel = (c) => c ? `${c.vi} (${c.formula})` : '—';

/* ================= SIMULATION ================= */
export function createContainer(id, maxMl = 250) {
  return { id, contents: [], precipitates: [], indicators: [], temp: 25, gas: null, maxMl };
}

export function volumeOf(container) {
  if (!container?.contents) return 0;
  return container.contents.reduce((s, c) => s + (c.mL || 0), 0);
}

export function solidMassOf(container) {
  if (!container) return 0;
  const solidGrams = (container.contents || []).reduce((s, c) => s + (c.gram || 0), 0);
  const precipGrams = (container.precipitates || []).reduce((s, p) => s + (p.amount || 0) * 1.2, 0);
  return Math.round((solidGrams + precipGrams) * 100) / 100;
}

export function totalMassOf(container) {
  if (!container) return 0;
  const liqMass = volumeOf(container) * 1.01;
  return Math.round((liqMass + solidMassOf(container)) * 10) / 10;
}

/* Pha màu dung dịch theo TỶ LỆ THỂ TÍCH (giống thực tế hơn) */
function mixHex(colors) {
  if (!colors.length) return '#dfe9f3';
  if (colors.length === 1) return colors[0].color;
  let r = 0, g = 0, b = 0, w = 0;
  for (const { color, weight } of colors) {
    if (!color || weight <= 0) continue;
    const h = color.replace('#', '');
    r += parseInt(h.slice(0, 2), 16) * weight;
    g += parseInt(h.slice(2, 4), 16) * weight;
    b += parseInt(h.slice(4, 6), 16) * weight;
    w += weight;
  }
  if (w <= 0) return '#dfe9f3';
  const to2 = (v) => Math.round(v / w).toString(16).padStart(2, '0');
  return '#' + to2(r) + to2(g) + to2(b);
}

export function dominantColor(container) {
  const parts = [];
  for (const c of container.contents || []) {
    const chem = CHEMS[c.id];
    if (!chem || chem.state !== 'solution' || (c.mL || 0) <= 0) continue;
    // Tăng trọng số màu cho các ion có màu đậm (KMnO4, phức đồng, CuSO4, FeCl3)
    const vividBoost = ['KMnO4', 'Cu_NH3_4', 'CuSO4', 'FeCl3', 'Fe2SO43'].includes(c.id) ? 3.5 : 1;
    parts.push({ color: chem.color, weight: c.mL * vividBoost });
  }
  let color = mixHex(parts);
  /* Chỉ thị đổi màu theo pH */
  const pH = computePH(container);
  for (const ind of container.indicators || []) {
    if (ind === 'Quy') color = pH < 6.2 ? '#e05555' : pH > 7.8 ? '#3b82f6' : '#8b5cf6';
    if (ind === 'PPT') color = pH > 8.3 ? '#ec4899' : color;
    if (ind === 'MO') color = pH < 3.2 ? '#ef4444' : pH > 4.4 ? '#facc15' : '#f97316';
  }
  return color;
}

export function computePH(container) {
  let nH = 0, nOH = 0, weakAcidMol = 0, weakBaseMol = 0;
  let volume = 0;
  for (const c of container.contents || []) {
    const chem = CHEMS[c.id];
    if (!chem || chem.state !== 'solution') continue;
    volume += c.mL || 0;
    const mol = molOf(c.id, c.mL || 0);
    if (chem.weak && chem.H) weakAcidMol += mol;
    else if (chem.H) nH += mol * chem.H;
    if (chem.weakBase && chem.OH) weakBaseMol += mol;
    else if (chem.OH) nOH += mol * chem.OH;
  }
  if (volume <= 0) return 7;
  const volL = volume / 1000;
  /* Axit yếu đơn thuần: [H+] ≈ √(Ka·C) */
  if (weakAcidMol > 0 && nH === 0 && nOH === 0 && weakBaseMol === 0) {
    const Cw = weakAcidMol / volL;
    const hConc = Math.sqrt(1.74e-5 * Cw);
    return Math.max(0.5, Math.min(14, -Math.log10(hConc)));
  }
  /* Bazơ yếu đơn thuần (NH3): [OH-] ≈ √(Kb·C) */
  if (weakBaseMol > 0 && nH === 0 && nOH === 0 && weakAcidMol === 0) {
    const Cb = weakBaseMol / volL;
    const ohConc = Math.sqrt(1.78e-5 * Cb);
    return Math.max(0.5, Math.min(14, 14 + Math.log10(ohConc)));
  }
  const extraH = weakAcidMol > 0 ? Math.sqrt(1.74e-5 * (weakAcidMol / volL)) * volL : 0;
  const extraOH = weakBaseMol > 0 ? Math.sqrt(1.78e-5 * (weakBaseMol / volL)) * volL : 0;
  const net = (nH + extraH) - (nOH + extraOH);
  if (Math.abs(net) < 1e-6) return 7;
  if (net > 0) return Math.max(0.5, Math.min(14, -Math.log10(net / volL)));
  return Math.max(0.5, Math.min(14, 14 + Math.log10(-net / volL)));
}

/* Thêm chất vào dụng cụ → chạy engine phản ứng → trả về events */
export function addChemical(container, chemId, amount) {
  const chem = CHEMS[chemId];
  if (!chem) return { ok: false, reason: 'Chất không tồn tại' };
  if (BLOCKED.includes(chemId)) return { ok: false, reason: chem.lab || 'Chất này quá nguy hiểm — hệ thống chặn thao tác.', blocked: true };

  if (chem.state === 'indicator') {
    if (!container.indicators.includes(chemId)) container.indicators.push(chemId);
    const pH = computePH(container);
    let indObs = `Đã nhỏ vài giọt ${chem.vi}.`;
    if (chemId === 'PPT' && pH > 8.3) indObs = 'Phenolphthalein chuyển sang màu hồng cánh sen (môi trường kiềm).';
    if (chemId === 'Quy') indObs = pH < 6.2 ? 'Quỳ tím hóa đỏ (môi trường axit).' : pH > 7.8 ? 'Quỳ tím hóa xanh (môi trường bazơ).' : 'Quỳ tím giữ màu tím (trung tính).';
    return { ok: true, events: [{ type: 'indicator', text: indObs }] };
  }

  if (chem.state === 'solid') {
    const gramToAdd = Number(amount) > 0 && Number(amount) <= 15 ? Number(amount) : (chem.solidGram || 3);
    const existing = container.contents.find((c) => c.id === chemId);
    if (existing) existing.gram = (existing.gram || 0) + gramToAdd;
    else container.contents.push({ id: chemId, mL: 0, gram: gramToAdd });
    const events = runReactions(container);
    if (!events.length && volumeOf(container) === 0) {
      events.push({ type: 'solid-added', text: `Đã cho ${gramToAdd}g ${chem.vi} vào dụng cụ. Hãy rót thêm dung dịch để quan sát phản ứng.` });
    }
    return { ok: true, events };
  }

  const addMl = Number(amount) || 20;
  if (volumeOf(container) + addMl > container.maxMl) {
    return { ok: false, reason: `Dụng cụ chỉ chứa tối đa ${container.maxMl} mL (hiện có ${volumeOf(container).toFixed(0)} mL).` };
  }

  const existing = container.contents.find((c) => c.id === chemId);
  if (existing) existing.mL = (existing.mL || 0) + addMl;
  else container.contents.push({ id: chemId, mL: addMl });

  const events = runReactions(container);
  return { ok: true, events };
}

/* Chuyển dung dịch từ dụng cụ source sang target */
export function transferLiquid(source, target, transferMl = 20) {
  const srcVol = volumeOf(source);
  if (srcVol <= 0) return { ok: false, reason: 'Dụng cụ nguồn đang trống — không có dung dịch để rót.' };
  const actualMl = Math.min(srcVol, Number(transferMl) || 20);
  if (volumeOf(target) + actualMl > target.maxMl) {
    return { ok: false, reason: `${target.name} chỉ chứa tối đa ${target.maxMl} mL.` };
  }
  const ratio = actualMl / srcVol;
  for (const item of source.contents) {
    if ((item.mL || 0) > 0) {
      const moved = item.mL * ratio;
      item.mL = Math.max(0, item.mL - moved);
      const ex = target.contents.find((c) => c.id === item.id);
      if (ex) ex.mL += moved;
      else target.contents.push({ id: item.id, mL: moved });
    }
  }
  source.contents = source.contents.filter((c) => (c.mL || 0) > 0.05 || (c.gram || 0) > 0.01);
  for (const ind of source.indicators || []) {
    if (!target.indicators.includes(ind)) target.indicators.push(ind);
  }
  const events = runReactions(target);
  return { ok: true, movedMl: Math.round(actualMl), events };
}

/* Nhiệt phân khi đun nóng bằng đèn cồn (T >= 65°C) */
export function applyHeatReactions(container) {
  const events = [];
  if (!container || (container.temp || 25) < 65) return events;
  const cuoh2 = (container.precipitates || []).find((p) => p.formula === 'Cu(OH)2' || p.color === '#4aa3e8');
  if (cuoh2) {
    cuoh2.color = '#1e293b';
    cuoh2.formula = 'CuO';
    events.push({
      type: 'nhiet-phan',
      eq: 'Cu(OH)2 →(t°) CuO↓ + H2O',
      text: 'Đun nóng: kết tủa xanh lam Cu(OH)2 bị nhiệt phân thành CuO màu đen.',
    });
  }
  return events;
}

/* Quét quy tắc phản ứng trên các cặp chất có trong dụng cụ */
export function runReactions(container) {
  const events = [];
  let changed = true;
  let guard = 0;

  while (changed && guard++ < 8) {
    changed = false;
    outer:
    for (const rule of REACTIONS) {
      const present = container.contents.map((c) => c.id);
      const need = rule.reactants.map((r) => r.id);
      if (!need.every((id) => present.includes(id))) continue;

      /* Kiểm tra đủ mol theo tỷ lệ */
      const molAvail = {};
      for (const c of container.contents) {
        const chem = CHEMS[c.id];
        if (!chem) continue;
        molAvail[c.id] = (molAvail[c.id] || 0) + (chem.state === 'solid' ? (c.gram || chem.solidGram || 1) / chem.M : ((c.mL || 0) / 1000) * (chem.conc || 0.5));
      }
      const needMol = {};
      for (const r of rule.reactants) needMol[r.id] = (molAvail[r.id] || 0) / r.n;
      const limiting = Math.min(...Object.values(needMol));
      if (limiting <= 0.0001) continue;

      /* Giảm lượng chất phản ứng theo tỷ lệ mol */
      let totalUsedMl = 0;
      for (const r of rule.reactants) {
        const chem = CHEMS[r.id];
        for (const c of container.contents) {
          if (c.id !== r.id) continue;
          const molToUse = limiting * r.n;
          if (chem.state === 'solid') {
            const gramToUse = molToUse * chem.M;
            const currentGram = c.gram ?? chem.solidGram ?? 1;
            c.gram = Math.max(0, currentGram - gramToUse);
          } else {
            const mlToUse = (molToUse / (chem.conc || 0.5)) * 1000;
            const actualUsed = Math.min(c.mL || 0, mlToUse);
            c.mL = Math.max(0, (c.mL || 0) - actualUsed);
            totalUsedMl += actualUsed;
          }
        }
      }
      container.contents = container.contents.filter((c) => {
        const chem = CHEMS[c.id];
        if (chem?.state === 'solid') return (c.gram || 0) > 0.02;
        return (c.mL || 0) > 0.02;
      });

      /* Sản phẩm: chiếm đúng tổng thể tích dung dịch đã phản ứng */
      const usedMl = Math.max(totalUsedMl, limiting * 1000 * rule.reactants.filter((r) => CHEMS[r.id]?.state === 'solution').length / Math.max(1, rule.reactants.length));
      for (const p of rule.products) {
        const prodId = p.remap || p.id;
        const existing = container.contents.find((c) => c.id === prodId);
        if (existing) existing.mL = (existing.mL || 0) + usedMl;
        else container.contents.push({ id: prodId, mL: usedMl });
      }

      /* Hiện tượng */
      if (rule.obs.type === 'kettua' || rule.obs.type === 'ket-bam') {
        const has = container.precipitates.find((p) => p.color === rule.obs.precip);
        if (has) has.amount += 1;
        else container.precipitates.push({ color: rule.obs.precip, formula: rule.obs.precipFormula || '', amount: 1 });
      }
      if (rule.obs.type === 'khi') {
        container.gas = { color: 'rgba(255,255,255,0.75)', gas: rule.obs.gas, startedAt: Date.now(), until: Date.now() + Math.min(14000, 5000 + limiting * 6000) };
      }
      if (rule.obs.tempDelta) container.temp = Math.min(100, (container.temp || 25) + rule.obs.tempDelta);

      events.push({ type: rule.obs.type, text: rule.obs.text, eq: rule.eqStr });
      changed = true;
      break outer;
    }

    /* Xử lý phản ứng nối tiếp của kết tủa (Lưỡng tính Al(OH)3 + NaOH dư & Tạo phức Cu(OH)2 + NH3 dư) */
    const alPrecipIdx = container.precipitates.findIndex((p) => p.formula === 'Al(OH)3' || p.color === '#e2e8f0');
    const excessBase = container.contents.find((c) => (c.id === 'NaOH' || c.id === 'KOH' || c.id === 'BaOH2') && (c.mL || 0) >= 3);
    if (alPrecipIdx !== -1 && excessBase) {
      container.precipitates.splice(alPrecipIdx, 1);
      const used = Math.min(excessBase.mL, 12);
      excessBase.mL -= used;
      const exAl = container.contents.find((c) => c.id === 'NaAlO2');
      if (exAl) exAl.mL += used;
      else container.contents.push({ id: 'NaAlO2', mL: used });
      container.contents = container.contents.filter((c) => (c.mL || 0) > 0.02 || (c.gram || 0) > 0.02);
      events.push({
        type: 'hoa-tan-kettua',
        eq: 'Al(OH)3 + NaOH → Na[Al(OH)4]',
        text: 'Tính lưỡng tính: kết tủa keo trắng Al(OH)3 tan hoàn toàn trong kiềm dư tạo dung dịch trong suốt.',
      });
      changed = true;
    }

    const cuPrecipIdx = container.precipitates.findIndex((p) => p.formula === 'Cu(OH)2' || p.color === '#4aa3e8');
    const excessNH3 = container.contents.find((c) => c.id === 'NH3' && (c.mL || 0) >= 5);
    if (cuPrecipIdx !== -1 && excessNH3) {
      container.precipitates.splice(cuPrecipIdx, 1);
      const used = Math.min(excessNH3.mL, 15);
      excessNH3.mL -= used;
      const exComplex = container.contents.find((c) => c.id === 'Cu_NH3_4');
      if (exComplex) exComplex.mL += used + 10;
      else container.contents.push({ id: 'Cu_NH3_4', mL: used + 15 });
      container.contents = container.contents.filter((c) => (c.mL || 0) > 0.02 || (c.gram || 0) > 0.02);
      events.push({
        type: 'tao-phuc',
        eq: 'Cu(OH)2 + 4NH3 → [Cu(NH3)4](OH)2',
        text: 'Tạo phức: kết tủa Cu(OH)2 tan trong NH3 dư tạo dung dịch phức đồng màu xanh lam thẫm đặc trưng.',
      });
      changed = true;
    }
  }

  /* Kiểm tra nhiệt phân nếu đang đun nóng */
  const heatEvents = applyHeatReactions(container);
  events.push(...heatEvents);

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

/* Gợi ý thông minh tiếp theo dựa trên các chất đang có trong dụng cụ */
export function suggestReactionsFor(container) {
  if (!container) return [];
  const present = new Set((container.contents || []).map((c) => c.id));
  const out = [];

  // Nếu có kết tủa Al(OH)3 hoặc Cu(OH)2 thì gợi ý hòa tan / đun nóng
  if ((container.precipitates || []).some((p) => p.formula === 'Al(OH)3' || p.color === '#e2e8f0')) {
    out.push({ chemId: 'NaOH', reason: 'Thêm NaOH dư để hòa tan kết tủa keo trắng Al(OH)3 (tính lưỡng tính)' });
  }
  if ((container.precipitates || []).some((p) => p.formula === 'Cu(OH)2' || p.color === '#4aa3e8')) {
    out.push({ chemId: 'NH3', reason: 'Thêm NH3 dư để hòa tan Cu(OH)2 tạo phức xanh lam thẫm [Cu(NH3)4]²⁺' });
  }

  for (const r of REACTIONS) {
    const rIds = r.reactants.map((x) => x.id);
    const hasSome = rIds.some((id) => present.has(id));
    if (!hasSome) continue;
    for (const id of rIds) {
      if (!present.has(id) && CHEMS[id] && !out.some((o) => o.chemId === id)) {
        out.push({
          chemId: id,
          reason: ` + ${CHEMS[id].formula} → ${r.obs.text}`,
          eq: r.eqStr,
        });
      }
    }
  }
  return out.slice(0, 4);
}

/* Log thao tác cho sổ thí nghiệm */
export function logEntry(list, entry) {
  return [...list.slice(-50), { at: new Date().toISOString(), ...entry }];
}
