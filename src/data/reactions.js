// Database phản ứng hóa học cho Virtual Lab
export const CHEMICALS = {
  // Đơn chất — kim loại
  Na:   { name: 'Natri',        formula: 'Na',    type: 'metal',    color: '#c0c0c0', state: 'solid' },
  K:    { name: 'Kali',         formula: 'K',     type: 'metal',    color: '#c0c0c0', state: 'solid' },
  Ca:   { name: 'Canxi',        formula: 'Ca',    type: 'metal',    color: '#d4d4d4', state: 'solid' },
  Mg:   { name: 'Magie',        formula: 'Mg',    type: 'metal',    color: '#e0e0e0', state: 'solid' },
  Al:   { name: 'Nhôm',         formula: 'Al',    type: 'metal',    color: '#d0d0d0', state: 'solid' },
  Zn:   { name: 'Kẽm',          formula: 'Zn',    type: 'metal',    color: '#b8b8b8', state: 'solid' },
  Fe:   { name: 'Sắt',          formula: 'Fe',    type: 'metal',    color: '#8b8b8b', state: 'solid' },
  Cu:   { name: 'Đồng',         formula: 'Cu',    type: 'metal',    color: '#b87333', state: 'solid' },
  Ag:   { name: 'Bạc',          formula: 'Ag',    type: 'metal',    color: '#e8e8e8', state: 'solid' },
  Au:   { name: 'Vàng',         formula: 'Au',    type: 'metal',    color: '#ffd700', state: 'solid' },

  // Đơn chất — khí
  H2:   { name: 'Hiđro',        formula: 'H₂',    type: 'gas',      color: '#f0f0f0', state: 'gas' },
  O2:   { name: 'Oxi',          formula: 'O₂',    type: 'gas',      color: '#e0f0ff', state: 'gas' },
  N2:   { name: 'Nitơ',         formula: 'N₂',    type: 'gas',      color: '#e8e8ff', state: 'gas' },
  Cl2:  { name: 'Clo',          formula: 'Cl₂',   type: 'gas',      color: '#e8f5b0', state: 'gas' },

  // Hợp chất — dung dịch
  H2O:  { name: 'Nước',         formula: 'H₂O',   type: 'compound', color: '#a7c4f2', state: 'liquid' },
  HCl:  { name: 'Axit clohiđric', formula: 'HCl', type: 'acid',     color: '#ffe8b0', state: 'liquid' },
  H2SO4:{ name: 'Axit sunfuric', formula: 'H₂SO₄', type: 'acid',    color: '#fff0c0', state: 'liquid' },
  HNO3: { name: 'Axit nitric',  formula: 'HNO₃',  type: 'acid',     color: '#fff8d0', state: 'liquid' },
  NaOH: { name: 'Natri hiđroxit', formula: 'NaOH', type: 'base',    color: '#d0e8ff', state: 'liquid' },
  KOH:  { name: 'Kali hiđroxit', formula: 'KOH',  type: 'base',     color: '#d0e8ff', state: 'liquid' },
  CaOH2:{ name: 'Canxi hiđroxit', formula: 'Ca(OH)₂', type: 'base', color: '#d8e8ff', state: 'liquid' },

  // Chỉ thị
  PP:   { name: 'Phenolphtalein', formula: 'PP',  type: 'indicator', color: '#f0e8f8', state: 'liquid' },
  Quy:  { name: 'Quỳ tím',      formula: 'Quỳ',   type: 'indicator', color: '#b88ee0', state: 'liquid' },

  // Muối — rắn
  NaCl: { name: 'Muối ăn',      formula: 'NaCl',  type: 'salt',     color: '#ffffff', state: 'solid' },
  CuSO4:{ name: 'Đồng sunfat',  formula: 'CuSO₄', type: 'salt',     color: '#2e86de', state: 'solid' },
  CaCO3:{ name: 'Đá vôi',       formula: 'CaCO₃', type: 'salt',     color: '#f5f5f5', state: 'solid' },
  AgNO3:{ name: 'Bạc nitrat',   formula: 'AgNO₃', type: 'salt',     color: '#f0f0f0', state: 'solid' },
  BaCl2:{ name: 'Bari clorua',  formula: 'BaCl₂', type: 'salt',     color: '#f0f4f8', state: 'solid' },
  KI:   { name: 'Kali iotua',   formula: 'KI',    type: 'salt',     color: '#eef2f6', state: 'solid' },
  PbNO3:{ name: 'Chì(II) nitrat', formula: 'Pb(NO₃)₂', type: 'salt', color: '#eef0f2', state: 'solid' },

  // Muối — sản phẩm (có thể tạo ra)
  ZnCl2:{ name: 'Kẽm clorua',    formula: 'ZnCl₂', type: 'salt',    color: '#e8f0f8', state: 'liquid' },
  FeCl2:{ name: 'Sắt(II) clorua', formula: 'FeCl₂', type: 'salt',   color: '#c8e0b8', state: 'liquid' },
  FeCl3:{ name: 'Sắt(III) clorua', formula: 'FeCl₃', type: 'salt',  color: '#d4a86a', state: 'liquid' },
  MgCl2:{ name: 'Magie clorua',  formula: 'MgCl₂', type: 'salt',    color: '#e8f0f8', state: 'liquid' },
  CaCl2:{ name: 'Canxi clorua',  formula: 'CaCl₂', type: 'salt',    color: '#e8f0f8', state: 'liquid' },
  Na2SO4:{ name: 'Natri sunfat', formula: 'Na₂SO₄', type: 'salt',   color: '#e8f0f8', state: 'liquid' },
  NaNO3:{ name: 'Natri nitrat',  formula: 'NaNO₃', type: 'salt',    color: '#e8f0f8', state: 'liquid' },
  KCl:  { name: 'Kali clorua',   formula: 'KCl',   type: 'salt',    color: '#e8f0f8', state: 'liquid' },
  KNO3: { name: 'Kali nitrat',   formula: 'KNO₃',  type: 'salt',    color: '#e8f0f8', state: 'liquid' },
  AlCl3:{ name: 'Nhôm clorua',   formula: 'AlCl₃', type: 'salt',    color: '#e8f0f8', state: 'liquid' },

  // Kết tủa — rắn
  AgCl: { name: 'Bạc clorua',    formula: 'AgCl',  type: 'salt',    color: '#ffffff', state: 'solid' },
  BaSO4:{ name: 'Bari sunfat',   formula: 'BaSO₄', type: 'salt',    color: '#f8f8f8', state: 'solid' },
  PbI2: { name: 'Chì(II) iotua', formula: 'PbI₂',  type: 'salt',    color: '#f2c40c', state: 'solid' },
  CuOH2:{ name: 'Đồng(II) hiđroxit', formula: 'Cu(OH)₂', type: 'base', color: '#4a90d9', state: 'solid' },
  FeOH3:{ name: 'Sắt(III) hiđroxit', formula: 'Fe(OH)₃', type: 'base', color: '#a0442a', state: 'solid' },
  MgOH2:{ name: 'Magie hiđroxit', formula: 'Mg(OH)₂', type: 'base', color: '#f0f4f8', state: 'solid' },

  // Oxit
  CaO:  { name: 'Vôi sống',     formula: 'CaO',   type: 'oxide',    color: '#f8f8f8', state: 'solid' },
  CuO:  { name: 'Đồng oxit',    formula: 'CuO',   type: 'oxide',    color: '#1a1a1a', state: 'solid' },
  Fe2O3:{ name: 'Sắt(III) oxit', formula: 'Fe₂O₃', type: 'oxide',  color: '#a0442a', state: 'solid' },
  MgO:  { name: 'Magie oxit',   formula: 'MgO',   type: 'oxide',    color: '#f8f8f8', state: 'solid' },
  CO2:  { name: 'Cacbon đioxit', formula: 'CO₂',  type: 'oxide',    color: '#e8e8e8', state: 'gas' },
  SO2:  { name: 'Lưu huỳnh đioxit', formula: 'SO₂', type: 'oxide',  color: '#fff0e0', state: 'gas' },
};

export const REACTIONS = [
  // Kim loại + Axit → Muối + H₂
  {
    inputs: ['Na', 'HCl'],
    outputs: ['NaCl', 'H2'],
    equation: '2Na + 2HCl → 2NaCl + H₂↑',
    effect: { type: 'bubble', color: '#f0f0f0', intensity: 3 },
    note: 'Kim loại kiềm + axit → muối + khí H₂ (phản ứng mạnh)',
    danger: 2,
  },
  {
    inputs: ['Zn', 'HCl'],
    outputs: ['ZnCl2', 'H2'],
    equation: 'Zn + 2HCl → ZnCl₂ + H₂↑',
    effect: { type: 'bubble', color: '#f0f0f0', intensity: 2 },
    note: 'Kẽm tan dần, có bọt khí thoát ra',
    danger: 1,
  },
  {
    inputs: ['Fe', 'HCl'],
    outputs: ['FeCl2', 'H2'],
    equation: 'Fe + 2HCl → FeCl₂ + H₂↑',
    effect: { type: 'bubble', color: '#f0f0f0', intensity: 2 },
    note: 'Sắt tan, dung dịch chuyển màu lục nhạt',
    danger: 1,
  },
  {
    inputs: ['Mg', 'HCl'],
    outputs: ['MgCl2', 'H2'],
    equation: 'Mg + 2HCl → MgCl₂ + H₂↑',
    effect: { type: 'bubble', color: '#f0f0f0', intensity: 3 },
    note: 'Magie tan nhanh, bọt khí mạnh',
    danger: 2,
  },
  {
    inputs: ['Al', 'HCl'],
    outputs: ['AlCl3', 'H2'],
    equation: '2Al + 6HCl → 2AlCl₃ + 3H₂↑',
    effect: { type: 'bubble', color: '#f0f0f0', intensity: 3 },
    note: 'Nhôm tan, sủi bọt khí H₂',
    danger: 2,
  },

  // Axit + Bazơ → Muối + H₂O
  {
    inputs: ['HCl', 'NaOH'],
    outputs: ['NaCl', 'H2O'],
    equation: 'HCl + NaOH → NaCl + H₂O',
    effect: { type: 'heat', color: '#ff9b85', intensity: 2 },
    note: 'Phản ứng trung hòa, tỏa nhiệt',
    danger: 1,
  },
  {
    inputs: ['H2SO4', 'NaOH'],
    outputs: ['Na2SO4', 'H2O'],
    equation: 'H₂SO₄ + 2NaOH → Na₂SO₄ + 2H₂O',
    effect: { type: 'heat', color: '#ff9b85', intensity: 2 },
    note: 'Trung hòa, tỏa nhiệt mạnh',
    danger: 2,
  },

  // Oxit bazơ + Nước → Bazơ
  {
    inputs: ['CaO', 'H2O'],
    outputs: ['CaOH2'],
    equation: 'CaO + H₂O → Ca(OH)₂',
    effect: { type: 'heat', color: '#ffb020', intensity: 4, steam: true },
    note: 'Vôi sống tôi trong nước, tỏa nhiệt rất mạnh, có hơi nước',
    danger: 3,
  },
  {
    inputs: ['Na', 'H2O'],
    outputs: ['NaOH', 'H2'],
    equation: '2Na + 2H₂O → 2NaOH + H₂↑',
    effect: { type: 'fire', color: '#ffcc33', intensity: 5 },
    note: '⚠ Natri cháy trên mặt nước — phản ứng cực mạnh!',
    danger: 5,
  },

  // Muối + Muối → Kết tủa
  {
    inputs: ['AgNO3', 'NaCl'],
    outputs: ['AgCl', 'NaNO3'],
    equation: 'AgNO₃ + NaCl → AgCl↓ + NaNO₃',
    effect: { type: 'precipitate', color: '#ffffff', intensity: 3 },
    note: 'Kết tủa trắng AgCl xuất hiện',
    danger: 1,
  },
  {
    inputs: ['BaCl2', 'H2SO4'],
    outputs: ['BaSO4', 'HCl'],
    equation: 'BaCl₂ + H₂SO₄ → BaSO₄↓ + 2HCl',
    effect: { type: 'precipitate', color: '#f8f8f8', intensity: 3 },
    note: 'Kết tủa trắng BaSO₄ không tan trong axit',
    danger: 2,
  },
  {
    inputs: ['PbNO3', 'KI'],
    outputs: ['PbI2', 'KNO3'],
    equation: 'Pb(NO₃)₂ + 2KI → PbI₂↓ + 2KNO₃',
    effect: { type: 'precipitate', color: '#f2c40c', intensity: 4 },
    note: 'Kết tủa vàng tươi PbI₂ — "mưa vàng"',
    danger: 2,
  },
  {
    inputs: ['CuSO4', 'NaOH'],
    outputs: ['CuOH2', 'Na2SO4'],
    equation: 'CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄',
    effect: { type: 'precipitate', color: '#4a90d9', intensity: 3 },
    note: 'Kết tủa xanh lam Cu(OH)₂',
    danger: 1,
  },
  {
    inputs: ['Fe2O3', 'HCl'],
    outputs: ['FeCl3', 'H2O'],
    equation: 'Fe₂O₃ + 6HCl → 2FeCl₃ + 3H₂O',
    effect: { type: 'dissolve', color: '#ff8c42', intensity: 2 },
    note: 'Oxit sắt tan, dung dịch chuyển vàng nâu',
    danger: 1,
  },
  {
    inputs: ['CuO', 'H2SO4'],
    outputs: ['CuSO4', 'H2O'],
    equation: 'CuO + H₂SO₄ → CuSO₄ + H₂O',
    effect: { type: 'dissolve', color: '#2e86de', intensity: 2 },
    note: 'Chất rắn đen tan dần, dung dịch xanh lam',
    danger: 1,
  },
  {
    inputs: ['CaCO3', 'HCl'],
    outputs: ['CaCl2', 'H2O', 'CO2'],
    equation: 'CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂↑',
    effect: { type: 'bubble', color: '#e8e8e8', intensity: 4 },
    note: 'Sủi bọt mạnh, khí CO₂ thoát ra',
    danger: 1,
  },
  {
    inputs: ['CO2', 'CaOH2'],
    outputs: ['CaCO3', 'H2O'],
    equation: 'CO₂ + Ca(OH)₂ → CaCO₃↓ + H₂O',
    effect: { type: 'precipitate', color: '#ffffff', intensity: 2 },
    note: 'Nước vôi trong bị đục — phản ứng nhận biết CO₂',
    danger: 1,
  },

  // Chỉ thị
  {
    inputs: ['HCl', 'Quy'],
    outputs: ['Quy'],
    equation: 'Quỳ tím + Axit → Hóa đỏ',
    effect: { type: 'color', color: '#e5383b', intensity: 1 },
    note: 'Quỳ tím chuyển màu đỏ trong dung dịch axit',
    danger: 1,
  },
  {
    inputs: ['NaOH', 'Quy'],
    outputs: ['Quy'],
    equation: 'Quỳ tím + Bazơ → Hóa xanh',
    effect: { type: 'color', color: '#3a5bd9', intensity: 1 },
    note: 'Quỳ tím chuyển màu xanh trong dung dịch bazơ',
    danger: 1,
  },
  {
    inputs: ['NaOH', 'PP'],
    outputs: ['PP'],
    equation: 'Phenolphtalein + Bazơ → Hóa hồng',
    effect: { type: 'color', color: '#e0308c', intensity: 1 },
    note: 'PP chuyển màu hồng đậm trong môi trường bazơ',
    danger: 1,
  },
];

export function findReaction(chemKeys) {
  const sorted = [...chemKeys].sort();
  return REACTIONS.find((r) => {
    const rSorted = [...r.inputs].sort();
    return rSorted.length === sorted.length && rSorted.every((k, i) => k === sorted[i]);
  });
}

export const LAB_MISSIONS = [
  { id: 'naoh', title: 'Điều chế NaOH', desc: 'Tạo Natri hiđroxit từ Natri và Nước.', required: ['Na', 'H2O'], hint: 'Cho Na vào nước — phản ứng mãnh liệt!', difficulty: 1 },
  { id: 'nacl', title: 'Điều chế muối ăn', desc: 'Trung hòa HCl bằng NaOH để tạo NaCl.', required: ['HCl', 'NaOH'], hint: 'Axit + Bazơ → Muối + Nước', difficulty: 1 },
  { id: 'caco3', title: 'Nhận biết CO₂', desc: 'Dùng nước vôi trong để nhận biết khí CO₂.', required: ['CO2', 'CaOH2'], hint: 'CO₂ làm đục nước vôi trong', difficulty: 2 },
  { id: 'agcl', title: 'Tạo kết tủa trắng', desc: 'Dùng AgNO₃ để nhận biết ion Cl⁻ trong NaCl.', required: ['AgNO3', 'NaCl'], hint: 'Kết tủa trắng AgCl không tan', difficulty: 2 },
  { id: 'cuoh2', title: 'Kết tủa xanh lam', desc: 'Tạo Cu(OH)₂ từ CuSO₄ và NaOH.', required: ['CuSO4', 'NaOH'], hint: 'Kết tủa màu xanh lam đặc trưng', difficulty: 3 },
  { id: 'fecl3', title: 'Sắt tan trong axit', desc: 'Hòa tan Fe₂O₃ bằng HCl.', required: ['Fe2O3', 'HCl'], hint: 'Dung dịch chuyển màu vàng nâu', difficulty: 3 },
  { id: 'h2', title: 'Điều chế H₂', desc: 'Cho Zn tác dụng với HCl để thu khí H₂.', required: ['Zn', 'HCl'], hint: 'Kim loại + Axit → Muối + H₂', difficulty: 2 },
  { id: 'caco3-decompose', title: 'Đá vôi sủi bọt', desc: 'Nhỏ HCl vào đá vôi CaCO₃.', required: ['CaCO3', 'HCl'], hint: 'Sủi bọt mạnh do CO₂', difficulty: 2 },
  { id: 'pbi2', title: 'Mưa vàng', desc: 'Tạo kết tủa vàng tươi PbI₂ từ Pb(NO₃)₂ và KI.', required: ['PbNO3', 'KI'], hint: 'Kết tủa vàng đặc trưng', difficulty: 3 },
  { id: 'baso4', title: 'Kết tủa không tan', desc: 'Tạo BaSO₄ từ BaCl₂ và H₂SO₄.', required: ['BaCl2', 'H2SO4'], hint: 'BaSO₄ không tan trong axit', difficulty: 3 },
];

export const SAFETY_TIPS = {
  1: 'An toàn — thao tác bình thường',
  2: 'Cẩn thận — đeo kính bảo hộ',
  3: 'Nguy hiểm — cần găng tay',
  4: 'Rất nguy hiểm — cần tủ hút',
  5: '⚠ CỰC KỲ NGUY HIỂM — không làm ở nhà!',
};