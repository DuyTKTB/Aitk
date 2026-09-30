// symbol,English name,Vietnamese name,atomic mass  (thứ tự = số hiệu nguyên tử 1..118)
const RAW = `H,Hydrogen,Hiđro,1.008;He,Helium,Heli,4.0026;Li,Lithium,Liti,6.94;Be,Beryllium,Beri,9.0122;B,Boron,Bo,10.81;C,Carbon,Cacbon,12.011;N,Nitrogen,Nitơ,14.007;O,Oxygen,Oxi,15.999;F,Fluorine,Flo,18.998;Ne,Neon,Neon,20.180;
Na,Sodium,Natri,22.990;Mg,Magnesium,Magie,24.305;Al,Aluminium,Nhôm,26.982;Si,Silicon,Silic,28.085;P,Phosphorus,Photpho,30.974;S,Sulfur,Lưu huỳnh,32.06;Cl,Chlorine,Clo,35.45;Ar,Argon,Agon,39.948;K,Potassium,Kali,39.098;Ca,Calcium,Canxi,40.078;
Sc,Scandium,Scanđi,44.956;Ti,Titanium,Titan,47.867;V,Vanadium,Vanađi,50.942;Cr,Chromium,Crom,51.996;Mn,Manganese,Mangan,54.938;Fe,Iron,Sắt,55.845;Co,Cobalt,Coban,58.933;Ni,Nickel,Niken,58.693;Cu,Copper,Đồng,63.546;Zn,Zinc,Kẽm,65.38;
Ga,Gallium,Gali,69.723;Ge,Germanium,Gecmani,72.630;As,Arsenic,Asen,74.922;Se,Selenium,Selen,78.971;Br,Bromine,Brom,79.904;Kr,Krypton,Kripton,83.798;Rb,Rubidium,Rubidi,85.468;Sr,Strontium,Stronti,87.62;Y,Yttrium,Ytri,88.906;Zr,Zirconium,Zirconi,91.224;
Nb,Niobium,Niobi,92.906;Mo,Molybdenum,Molipđen,95.95;Tc,Technetium,Tecneti,[98];Ru,Ruthenium,Rutheni,101.07;Rh,Rhodium,Rhodi,102.91;Pd,Palladium,Paladi,106.42;Ag,Silver,Bạc,107.87;Cd,Cadmium,Cadimi,112.41;In,Indium,Indi,114.82;Sn,Tin,Thiếc,118.71;
Sb,Antimony,Antimon,121.76;Te,Tellurium,Telu,127.60;I,Iodine,Iot,126.90;Xe,Xenon,Xenon,131.29;Cs,Caesium,Xesi,132.91;Ba,Barium,Bari,137.33;La,Lanthanum,Lantan,138.91;Ce,Cerium,Xeri,140.12;Pr,Praseodymium,Praseođim,140.91;Nd,Neodymium,Neođim,144.24;
Pm,Promethium,Prometi,[145];Sm,Samarium,Samari,150.36;Eu,Europium,Europi,151.96;Gd,Gadolinium,Gadolini,157.25;Tb,Terbium,Terbi,158.93;Dy,Dysprosium,Dysprosi,162.50;Ho,Holmium,Honmi,164.93;Er,Erbium,Erbi,167.26;Tm,Thulium,Tuli,168.93;Yb,Ytterbium,Ytecbi,173.05;
Lu,Lutetium,Luteti,174.97;Hf,Hafnium,Hafni,178.49;Ta,Tantalum,Tantan,180.95;W,Tungsten,Vonfram,183.84;Re,Rhenium,Reni,186.21;Os,Osmium,Osmi,190.23;Ir,Iridium,Iridi,192.22;Pt,Platinum,Bạch kim,195.08;Au,Gold,Vàng,196.97;Hg,Mercury,Thủy ngân,200.59;
Tl,Thallium,Tali,204.38;Pb,Lead,Chì,207.2;Bi,Bismuth,Bismut,208.98;Po,Polonium,Poloni,[209];At,Astatine,Astatin,[210];Rn,Radon,Radon,[222];Fr,Francium,Franxi,[223];Ra,Radium,Radi,[226];Ac,Actinium,Actini,[227];Th,Thorium,Thori,232.04;
Pa,Protactinium,Protactini,231.04;U,Uranium,Urani,238.03;Np,Neptunium,Neptuni,[237];Pu,Plutonium,Plutoni,[244];Am,Americium,Amerixi,[243];Cm,Curium,Curi,[247];Bk,Berkelium,Berkeli,[247];Cf,Californium,Californi,[251];Es,Einsteinium,Einsteini,[252];Fm,Fermium,Fermi,[257];
Md,Mendelevium,Menđelevi,[258];No,Nobelium,Nobeli,[259];Lr,Lawrencium,Lorenxi,[266];Rf,Rutherfordium,Rutherfordi,[267];Db,Dubnium,Dubni,[268];Sg,Seaborgium,Seaborgi,[269];Bh,Bohrium,Bohri,[270];Hs,Hassium,Hassi,[277];Mt,Meitnerium,Meitneri,[278];Ds,Darmstadtium,Darmstadti,[281];
Rg,Roentgenium,Roentgeni,[282];Cn,Copernicium,Copernixi,[285];Nh,Nihonium,Nihoni,[286];Fl,Flerovium,Flerovi,[289];Mc,Moscovium,Moscovi,[290];Lv,Livermorium,Livermori,[293];Ts,Tennessine,Tennessin,[294];Og,Oganesson,Oganesson,[294]`;

export const CATS = [
  ['alkali', 'Kim loại kiềm'], ['alkaline', 'Kim loại kiềm thổ'], ['transition', 'Kim loại chuyển tiếp'],
  ['post', 'Kim loại sau chuyển tiếp'], ['metalloid', 'Á kim'], ['nonmetal', 'Phi kim'],
  ['halogen', 'Halogen'], ['noble', 'Khí hiếm'], ['lanthanide', 'Lanthanide'], ['actinide', 'Actinide'],
];

export const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim();

const S = (s) => s.split(' ').map(Number);
const SETS = {
  alkali: S('3 11 19 37 55 87'), alkaline: S('4 12 20 38 56 88'), metalloid: S('5 14 32 33 51 52'),
  nonmetal: S('1 6 7 8 15 16 34'), halogen: S('9 17 35 53 85 117'), noble: S('2 10 18 36 54 86 118'),
  post: S('13 31 49 50 81 82 83 84 113 114 115 116'),
};
const category = (z) =>
  Object.keys(SETS).find((k) => SETS[k].includes(z)) || (z >= 57 && z <= 71 ? 'lanthanide' : z >= 89 && z <= 103 ? 'actinide' : 'transition');

// [chu kỳ, nhóm] — nhóm = null với hàng f-block (Lanthanide/Actinide nằm 2 hàng riêng bên dưới)
function position(z) {
  if (z === 1) return [1, 1];
  if (z === 2) return [1, 18];
  if (z <= 4) return [2, z - 2];
  if (z <= 10) return [2, z + 8];
  if (z <= 12) return [3, z - 10];
  if (z <= 18) return [3, z];
  if (z <= 36) return [4, z - 18];
  if (z <= 54) return [5, z - 36];
  if (z <= 56) return [6, z - 54];
  if (z <= 71) return [6, null];
  if (z <= 86) return [6, z - 68];
  if (z <= 88) return [7, z - 86];
  if (z <= 103) return [7, null];
  return [7, z - 100];
}

// Cấu hình electron: quy tắc Madelung + các ngoại lệ thực nghiệm
const ORB = '1s 2s 2p 3s 3p 4s 3d 4p 5s 4d 5p 6s 4f 5d 6p 7s 5f 6d 7p'.split(' ');
const CAP = { s: 2, p: 6, d: 10, f: 14 };
const EX = {
  24: { '4s': 1, '3d': 5 }, 29: { '4s': 1, '3d': 10 }, 41: { '5s': 1, '4d': 4 }, 42: { '5s': 1, '4d': 5 },
  44: { '5s': 1, '4d': 7 }, 45: { '5s': 1, '4d': 8 }, 46: { '5s': 0, '4d': 10 }, 47: { '5s': 1, '4d': 10 },
  57: { '4f': 0, '5d': 1 }, 58: { '4f': 1, '5d': 1 }, 64: { '4f': 7, '5d': 1 }, 78: { '6s': 1, '5d': 9 },
  79: { '6s': 1, '5d': 10 }, 89: { '5f': 0, '6d': 1 }, 90: { '5f': 0, '6d': 2 }, 91: { '5f': 2, '6d': 1 },
  92: { '5f': 3, '6d': 1 }, 93: { '5f': 4, '6d': 1 }, 96: { '5f': 7, '6d': 1 }, 103: { '6d': 0, '7p': 1 },
};
const sup = (n) => String(n).replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);
function rawConfig(z) {
  let left = z;
  const o = {};
  for (const k of ORB) { const c = Math.min(left, CAP[k[1]]); o[k] = c; left -= c; }
  Object.assign(o, EX[z]);
  return o;
}
const fmtConfig = (o) => Object.keys(o).filter((k) => o[k])
  .sort((a, b) => a[0] - b[0] || 'spdf'.indexOf(a[1]) - 'spdf'.indexOf(b[1]))
  .map((k) => k + sup(o[k])).join(' ');
function config(z) { return fmtConfig(rawConfig(z)); }

// Cấu hình rút gọn kiểu [Ar]3d⁵4s¹ — dùng khí hiếm gần nhất phía trước làm lõi
const NOBLE = { 2: 'He', 10: 'Ne', 18: 'Ar', 36: 'Kr', 54: 'Xe', 86: 'Rn' };
function shortConfig(z) {
  const coreZ = [86, 54, 36, 18, 10, 2].find((nz) => nz < z);
  if (!coreZ) return config(z);
  const full = rawConfig(z), core = rawConfig(coreZ), rem = {};
  for (const k in full) { const r = full[k] - (core[k] || 0); if (r > 0) rem[k] = r; }
  return `[${NOBLE[coreZ]}] ${fmtConfig(rem)}`;
}

// Số electron hóa trị — tính chắc chắn cho nguyên tố nhóm A (chương trình phổ thông chủ yếu dùng nhóm này)
function valenceElectrons(z, group) {
  if (z === 2) return 2; // He
  if (group === 1 || group === 2) return group;
  if (group >= 13 && group <= 18) return group - 10;
  return null; // khối d/f: cách tính phức tạp hơn, không hiển thị số cố định
}

// Trạng thái ở nhiệt độ phòng (~25°C)
const GAS = new Set('H He N O F Ne Cl Ar Kr Xe Rn'.split(' '));
const LIQUID = new Set('Br Hg'.split(' '));
const stateAtRoomTemp = (sym) => (GAS.has(sym) ? 'Khí' : LIQUID.has(sym) ? 'Lỏng' : 'Rắn');

// Dữ liệu bổ sung cho các nguyên tố thường gặp trong chương trình phổ thông VN
// (độ âm điện Pauling, số oxi hóa phổ biến). Nguyên tố không có trong bảng sẽ hiển thị "Chưa có dữ liệu".
const EXTRA = {
  H: { en: 2.20, ox: [1, -1] }, He: { en: null, ox: [] }, Li: { en: 0.98, ox: [1] }, Be: { en: 1.57, ox: [2] },
  B: { en: 2.04, ox: [3] }, C: { en: 2.55, ox: [-4, 2, 4] }, N: { en: 3.04, ox: [-3, 2, 3, 4, 5] }, O: { en: 3.44, ox: [-2, -1] },
  F: { en: 3.98, ox: [-1] }, Ne: { en: null, ox: [] }, Na: { en: 0.93, ox: [1] }, Mg: { en: 1.31, ox: [2] },
  Al: { en: 1.61, ox: [3] }, Si: { en: 1.90, ox: [-4, 4] }, P: { en: 2.19, ox: [-3, 3, 5] }, S: { en: 2.58, ox: [-2, 4, 6] },
  Cl: { en: 3.16, ox: [-1, 1, 3, 5, 7] }, Ar: { en: null, ox: [] }, K: { en: 0.82, ox: [1] }, Ca: { en: 1.00, ox: [2] },
  Sc: { en: 1.36, ox: [3] }, Ti: { en: 1.54, ox: [2, 3, 4] }, V: { en: 1.63, ox: [2, 3, 4, 5] }, Cr: { en: 1.66, ox: [2, 3, 6] },
  Mn: { en: 1.55, ox: [2, 4, 7] }, Fe: { en: 1.83, ox: [2, 3] }, Co: { en: 1.88, ox: [2, 3] }, Ni: { en: 1.91, ox: [2] },
  Cu: { en: 1.90, ox: [1, 2] }, Zn: { en: 1.65, ox: [2] }, Ga: { en: 1.81, ox: [3] }, Ge: { en: 2.01, ox: [2, 4] },
  As: { en: 2.18, ox: [-3, 3, 5] }, Se: { en: 2.55, ox: [-2, 4, 6] }, Br: { en: 2.96, ox: [-1, 1, 3, 5, 7] },
  Kr: { en: 3.00, ox: [] }, Rb: { en: 0.82, ox: [1] }, Sr: { en: 0.95, ox: [2] }, Ag: { en: 1.93, ox: [1] },
  Cd: { en: 1.69, ox: [2] }, Sn: { en: 1.96, ox: [2, 4] }, Sb: { en: 2.05, ox: [3, 5] }, I: { en: 2.66, ox: [-1, 1, 3, 5, 7] },
  Ba: { en: 0.89, ox: [2] }, Pt: { en: 2.28, ox: [2, 4] }, Au: { en: 2.54, ox: [1, 3] }, Hg: { en: 2.00, ox: [1, 2] },
  Pb: { en: 2.33, ox: [2, 4] },
};

// Nguyên tử khối làm tròn kiểu SGK phổ thông VN (dùng trong công tắc "Dùng số liệu SGK" ở MolarMass)
export const SGK_MASS = {
  H: 1, He: 4, Li: 7, Be: 9, B: 11, C: 12, N: 14, O: 16, F: 19, Ne: 20, Na: 23, Mg: 24, Al: 27, Si: 28, P: 31,
  S: 32, Cl: 35.5, Ar: 40, K: 39, Ca: 40, Cr: 52, Mn: 55, Fe: 56, Ni: 59, Cu: 64, Zn: 65, Br: 80, Ag: 108, Sn: 119,
  I: 127, Ba: 137, Pt: 195, Au: 197, Hg: 201, Pb: 207,
};

export const ELEMENTS = RAW.replace(/\n/g, '').split(';').map((row, i) => {
  const [symbol, name, vietnameseName, atomicMass] = row.split(',');
  const z = i + 1;
  const [period, group] = position(z);
  const isF = group === null;
  const extra = EXTRA[symbol] || { en: null, ox: null };
  return {
    atomicNumber: z, symbol, name, vietnameseName, atomicMass, group, period,
    category: category(z), electronConfiguration: config(z), shortConfiguration: shortConfig(z),
    valenceElectrons: valenceElectrons(z, group), stateAtRoomTemp: stateAtRoomTemp(symbol),
    electronegativity: extra.en, oxidationStates: extra.ox,
    // vị trí trên lưới: hàng 1 = nhãn nhóm, hàng 2-8 = chu kỳ 1-7, hàng 9 = khoảng cách, hàng 10-11 = f-block
    row: isF ? (z <= 71 ? 10 : 11) : period + 1,
    col: isF ? (z <= 71 ? z - 57 : z - 89) + 4 : group + 1,
    s: { symbol: norm(symbol), name: norm(name), vn: norm(vietnameseName) },
  };
});
// ====== BỔ SUNG CHO TREND MODE ======
// Bán kính nguyên tử (pm), nhiệt độ nóng chảy (K) — nguồn: bảng tuần hoàn IUPAC
const RADIUS = {
  H: 53, He: 31, Li: 167, Be: 112, B: 87, C: 67, N: 56, O: 48, F: 42, Ne: 38,
  Na: 190, Mg: 145, Al: 118, Si: 111, P: 98, S: 88, Cl: 79, Ar: 71,
  K: 243, Ca: 194, Sc: 184, Ti: 176, V: 171, Cr: 166, Mn: 161, Fe: 156, Co: 152,
  Ni: 149, Cu: 145, Zn: 142, Ga: 136, Ge: 125, As: 114, Se: 103, Br: 94, Kr: 88,
  Rb: 265, Sr: 219, Y: 212, Zr: 206, Nb: 198, Mo: 190, Tc: 183, Ru: 178, Rh: 173,
  Pd: 169, Ag: 165, Cd: 161, In: 156, Sn: 145, Sb: 133, Te: 123, I: 115, Xe: 108,
  Cs: 298, Ba: 253, La: 226, Ce: 210, Pr: 247, Nd: 206, Pm: 205, Sm: 238, Eu: 231,
  Gd: 233, Tb: 225, Dy: 228, Ho: 226, Er: 226, Tm: 222, Yb: 222, Lu: 217,
  Hf: 208, Ta: 200, W: 193, Re: 188, Os: 185, Ir: 180, Pt: 177, Au: 174, Hg: 171,
  Tl: 156, Pb: 154, Bi: 143, Po: 135, At: 127, Rn: 120,
  Fr: 348, Ra: 215, Ac: 195, Th: 180, Pa: 180, U: 175, Np: 175, Pu: 175, Am: 175,
};
const MELTING = {
  H: 14, He: 0.95, Li: 454, Be: 1560, B: 2349, C: 3800, N: 63, O: 54, F: 53, Ne: 24,
  Na: 371, Mg: 923, Al: 933, Si: 1687, P: 317, S: 388, Cl: 172, Ar: 84,
  K: 336, Ca: 1115, Sc: 1814, Ti: 1941, V: 2183, Cr: 2180, Mn: 1519, Fe: 1811,
  Co: 1768, Ni: 1728, Cu: 1358, Zn: 693, Ga: 303, Ge: 1211, As: 1090, Se: 494,
  Br: 266, Kr: 116, Rb: 312, Sr: 1050, Y: 1799, Zr: 2128, Nb: 2750, Mo: 2896,
  Ag: 1235, Cd: 594, In: 430, Sn: 505, Sb: 904, Te: 723, I: 387, Xe: 161,
  Cs: 302, Ba: 1000, W: 3695, Pt: 2041, Au: 1337, Hg: 234, Pb: 601, U: 1405,
};
// patch vào ELEMENTS — thêm SAU khi ELEMENTS đã tạo
for (const el of ELEMENTS) {
  el.atomicRadius = RADIUS[el.symbol] ?? null;
  el.meltingPoint = MELTING[el.symbol] ?? null;
}

// Metadata cho dropdown Trend
export const TRENDS = [
  { key: 'atomicMass', label: 'Khối lượng nguyên tử', unit: 'u', fmt: (v) => v.toFixed(2) },
  { key: 'electronegativity', label: 'Độ âm điện (Pauling)', unit: '', fmt: (v) => v.toFixed(2) },
  { key: 'atomicRadius', label: 'Bán kính nguyên tử', unit: 'pm', fmt: (v) => v.toFixed(0) },
  { key: 'meltingPoint', label: 'Nhiệt độ nóng chảy', unit: 'K', fmt: (v) => v.toFixed(0) },
  { key: 'valenceElectrons', label: 'Electron hóa trị', unit: 'e', fmt: (v) => String(v) },
];