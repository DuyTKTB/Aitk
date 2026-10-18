const RAW = `H,Hydrogen,1.008;He,Helium,4.0026;Li,Lithium,6.94;Be,Beryllium,9.0122;B,Boron,10.81;C,Carbon,12.011;N,Nitrogen,14.007;O,Oxygen,15.999;F,Fluorine,18.998;Ne,Neon,20.180;
Na,Sodium,22.990;Mg,Magnesium,24.305;Al,Aluminium,26.982;Si,Silicon,28.085;P,Phosphorus,30.974;S,Sulfur,32.06;Cl,Chlorine,35.45;Ar,Argon,39.948;K,Potassium,39.098;Ca,Calcium,40.078;
Sc,Scandium,44.956;Ti,Titanium,47.867;V,Vanadium,50.942;Cr,Chromium,51.996;Mn,Manganese,54.938;Fe,Iron,55.845;Co,Cobalt,58.933;Ni,Nickel,58.693;Cu,Copper,63.546;Zn,Zinc,65.38;
Ga,Gallium,69.723;Ge,Germanium,72.630;As,Arsenic,74.922;Se,Selenium,78.971;Br,Bromine,79.904;Kr,Krypton,83.798;Rb,Rubidium,85.468;Sr,Strontium,87.62;Y,Yttrium,88.906;Zr,Zirconium,91.224;
Nb,Niobium,92.906;Mo,Molybdenum,95.95;Tc,Technetium,[98];Ru,Ruthenium,101.07;Rh,Rhodium,102.91;Pd,Palladium,106.42;Ag,Silver,107.87;Cd,Cadmium,112.41;In,Indium,114.82;Sn,Tin,118.71;
Sb,Antimony,121.76;Te,Tellurium,127.60;I,Iodine,126.90;Xe,Xenon,131.29;Cs,Caesium,132.91;Ba,Barium,137.33;La,Lanthanum,138.91;Ce,Cerium,140.12;Pr,Praseodymium,140.91;Nd,Neodymium,144.24;
Pm,Promethium,[145];Sm,Samarium,150.36;Eu,Europium,151.96;Gd,Gadolinium,157.25;Tb,Terbium,158.93;Dy,Dysprosium,162.50;Ho,Holmium,164.93;Er,Erbium,167.26;Tm,Thulium,168.93;Yb,Ytterbium,173.05;
Lu,Lutetium,174.97;Hf,Hafnium,178.49;Ta,Tantalum,180.95;W,Tungsten,183.84;Re,Rhenium,186.21;Os,Osmium,190.23;Ir,Iridium,192.22;Pt,Platinum,195.08;Au,Gold,196.97;Hg,Mercury,200.59;
Tl,Thallium,204.38;Pb,Lead,207.2;Bi,Bismuth,208.98;Po,Polonium,[209];At,Astatine,[210];Rn,Radon,[222];Fr,Francium,[223];Ra,Radium,[226];Ac,Actinium,[227];Th,Thorium,232.04;
Pa,Protactinium,231.04;U,Uranium,238.03;Np,Neptunium,[237];Pu,Plutonium,[244];Am,Americium,[243];Cm,Curium,[247];Bk,Berkelium,[247];Cf,Californium,[251];Es,Einsteinium,[252];Fm,Fermium,[257];
Md,Mendelevium,[258];No,Nobelium,[259];Lr,Lawrencium,[266];Rf,Rutherfordium,[267];Db,Dubnium,[268];Sg,Seaborgium,[269];Bh,Bohrium,[270];Hs,Hassium,[277];Mt,Meitnerium,[278];Ds,Darmstadtium,[281];
Rg,Roentgenium,[282];Cn,Copernicium,[285];Nh,Nihonium,[286];Fl,Flerovium,[289];Mc,Moscovium,[290];Lv,Livermorium,[293];Ts,Tennessine,[294];Og,Oganesson,[294]`;

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
const NOBLE = { 2: 'He', 10: 'Ne', 18: 'Ar', 36: 'Kr', 54: 'Xe', 86: 'Rn' };
function shortConfig(z) {
  const coreZ = [86, 54, 36, 18, 10, 2].find((nz) => nz < z);
  if (!coreZ) return config(z);
  const full = rawConfig(z), core = rawConfig(coreZ), rem = {};
  for (const k in full) { const r = full[k] - (core[k] || 0); if (r > 0) rem[k] = r; }
  return `[${NOBLE[coreZ]}] ${fmtConfig(rem)}`;
}
function valenceElectrons(z, group) {
  if (z === 2) return 2; // He
  if (group === 1 || group === 2) return group;
  if (group >= 13 && group <= 18) return group - 10;
  return null; // khối d/f: cách tính phức tạp hơn, không hiển thị số cố định
}
const GAS = new Set('H He N O F Ne Cl Ar Kr Xe Rn'.split(' '));
const LIQUID = new Set('Br Hg'.split(' '));
const stateAtRoomTemp = (sym) => (GAS.has(sym) ? 'Khí' : LIQUID.has(sym) ? 'Lỏng' : 'Rắn');
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
  /* --- Bổ sung khối p còn thiếu --- */
  Cs: { en: 0.79, ox: [1] }, In: { en: 1.78, ox: [1, 3] }, Te: { en: 2.10, ox: [-2, 2, 4, 6] },
  Xe: { en: 2.60, ox: [2, 4, 6, 8] }, Tl: { en: 1.62, ox: [1, 3] }, Bi: { en: 2.02, ox: [3, 5] },
  Po: { en: 2.00, ox: [2, 4, 6] }, At: { en: 2.20, ox: [-1, 1] }, Rn: { en: 2.20, ox: [2, 4] },
  Fr: { en: 0.70, ox: [1] }, Ra: { en: 0.90, ox: [2] },
  /* --- Bổ sung khối d (chu kỳ 5–6) --- */
  Y: { en: 1.22, ox: [3] }, Zr: { en: 1.33, ox: [4] }, Nb: { en: 1.60, ox: [3, 5] }, Mo: { en: 2.16, ox: [4, 6] },
  Tc: { en: 1.90, ox: [4, 7] }, Ru: { en: 2.20, ox: [3, 4, 8] }, Rh: { en: 2.28, ox: [1, 3] }, Pd: { en: 2.20, ox: [2, 4] },
  Hf: { en: 1.30, ox: [4] }, Ta: { en: 1.50, ox: [5] }, W: { en: 2.36, ox: [4, 6] }, Re: { en: 1.90, ox: [4, 7] },
  Os: { en: 2.20, ox: [4, 8] }, Ir: { en: 2.20, ox: [3, 4] },
  /* --- Lanthanide & Actinide (đều phổ biến +3) --- */
  La: { en: 1.10, ox: [3] }, Ce: { en: 1.12, ox: [3, 4] }, Pr: { en: 1.13, ox: [3] }, Nd: { en: 1.14, ox: [3] },
  Pm: { en: 1.13, ox: [3] }, Sm: { en: 1.17, ox: [3] }, Eu: { en: 1.20, ox: [2, 3] }, Gd: { en: 1.20, ox: [3] },
  Tb: { en: 1.20, ox: [3] }, Dy: { en: 1.22, ox: [3] }, Ho: { en: 1.23, ox: [3] }, Er: { en: 1.24, ox: [3] },
  Tm: { en: 1.25, ox: [3] }, Yb: { en: 1.10, ox: [2, 3] }, Lu: { en: 1.27, ox: [3] },
  Ac: { en: 1.10, ox: [3] }, Th: { en: 1.30, ox: [4] }, Pa: { en: 1.50, ox: [5] }, U: { en: 1.38, ox: [4, 6] },
  Np: { en: 1.36, ox: [5] }, Pu: { en: 1.28, ox: [4] }, Am: { en: 1.13, ox: [3] }, Cm: { en: 1.28, ox: [3] },
  Bk: { en: 1.30, ox: [3] }, Cf: { en: 1.30, ox: [3] },
};
export const SGK_MASS = {
  H: 1, He: 4, Li: 7, Be: 9, B: 11, C: 12, N: 14, O: 16, F: 19, Ne: 20, Na: 23, Mg: 24, Al: 27, Si: 28, P: 31,
  S: 32, Cl: 35.5, Ar: 40, K: 39, Ca: 40, Cr: 52, Mn: 55, Fe: 56, Ni: 59, Cu: 64, Zn: 65, Br: 80, Ag: 108, Sn: 119,
  I: 127, Ba: 137, Pt: 195, Au: 197, Hg: 201, Pb: 207,
};

export const ELEMENTS = RAW.replace(/\n/g, '').split(';').map((row, i) => {
  const [symbol, name, atomicMass] = row.split(',');
  const z = i + 1;
  const [period, group] = position(z);
  const isF = group === null;
  const extra = EXTRA[symbol] || { en: null, ox: null };
  return {
    atomicNumber: z, symbol, name, atomicMass, group, period,
    category: category(z), electronConfiguration: config(z), shortConfiguration: shortConfig(z),
    valenceElectrons: valenceElectrons(z, group), stateAtRoomTemp: stateAtRoomTemp(symbol),
    electronegativity: extra.en, oxidationStates: extra.ox,
    row: isF ? (z <= 71 ? 10 : 11) : period + 1,
    col: isF ? (z <= 71 ? z - 57 : z - 89) + 4 : group + 1,
    s: { symbol: norm(symbol), name: norm(name) },
  };
});
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
  La: 1193, Ce: 1068, Pr: 1208, Nd: 1297, Pm: 1315, Sm: 1345, Eu: 1099, Gd: 1585,
  Tb: 1629, Dy: 1680, Ho: 1734, Er: 1802, Tm: 1818, Yb: 1097, Lu: 1936,
  Hf: 2506, Ta: 3290, Re: 3459, Os: 3306, Ir: 2719, Tc: 2430, Ru: 2607, Rh: 2237, Pd: 1828,
  Tl: 577, Bi: 544, Po: 527, Rn: 202, Ra: 973, Ac: 1323, Th: 2115, Pa: 1841,
  Np: 917, Pu: 913, Am: 1449, Cm: 1613, Bk: 1259, Cf: 1173,
  Na: 371, Mg: 923, Al: 933, Si: 1687, P: 317, S: 388, Cl: 172, Ar: 84,
  K: 336, Ca: 1115, Sc: 1814, Ti: 1941, V: 2183, Cr: 2180, Mn: 1519, Fe: 1811,
  Co: 1768, Ni: 1728, Cu: 1358, Zn: 693, Ga: 303, Ge: 1211, As: 1090, Se: 494,
  Br: 266, Kr: 116, Rb: 312, Sr: 1050, Y: 1799, Zr: 2128, Nb: 2750, Mo: 2896,
  Ag: 1235, Cd: 594, In: 430, Sn: 505, Sb: 904, Te: 723, I: 387, Xe: 161,
  Cs: 302, Ba: 1000, W: 3695, Pt: 2041, Au: 1337, Hg: 234, Pb: 601, U: 1405,
};
/* Nhiệt độ sôi (K) — chỉ liệt kê chất rắn/lỏng đo được; khí hiếm & đồng vị phóng xạ ổn định kém để null */
const BOILING = {
  Li: 1615, Be: 2742, B: 4203, C: 4098, Na: 1156, Mg: 1363, Al: 2792, Si: 3538, P: 554, S: 718,
  K: 1032, Ca: 1757, Sc: 3109, Ti: 3560, V: 3680, Cr: 2944, Mn: 2062, Fe: 3134, Co: 3200, Ni: 3186,
  Cu: 2835, Zn: 1180, Ga: 2403, Ge: 3106, As: 887, Se: 958, Br: 332, Rb: 961, Sr: 1655, Y: 3609,
  Zr: 4682, Nb: 5017, Mo: 4912, Tc: 4538, Ru: 4423, Rh: 3968, Pd: 3236, Ag: 2435, Cd: 1040,
  In: 2345, Sn: 2875, Sb: 1860, Te: 1261, I: 457, Cs: 944, Ba: 2170,
  La: 3737, Ce: 3716, Pr: 3403, Nd: 3347, Pm: 3273, Sm: 2067, Eu: 1802, Gd: 3546, Tb: 3503,
  Dy: 2840, Ho: 2993, Er: 3141, Tm: 2223, Yb: 1469, Lu: 3675,
  Hf: 4876, Ta: 5731, W: 5828, Re: 5869, Os: 5285, Ir: 4701, Pt: 4098, Au: 3129, Hg: 630,
  Tl: 1746, Pb: 2022, Bi: 1837, Po: 1235, Ra: 2010, Ac: 3471, Th: 5061, Pa: 4300,
  U: 4404, Np: 4273, Pu: 3505, Am: 2880,
};

/* Khối lượng riêng (g/cm³, điều kiện thường) — khí để null để tránh nhầm đơn vị */
const DENSITY = {
  Li: 0.53, Be: 1.85, B: 2.34, C: 2.27, Na: 0.97, Mg: 1.74, Al: 2.70, Si: 2.33, P: 1.82, S: 2.07,
  K: 0.86, Ca: 1.55, Sc: 2.99, Ti: 4.51, V: 6.11, Cr: 7.15, Mn: 7.44, Fe: 7.87, Co: 8.86, Ni: 8.91,
  Cu: 8.96, Zn: 7.14, Ga: 5.91, Ge: 5.32, As: 5.75, Se: 4.81, Br: 3.10, Rb: 1.53, Sr: 2.64, Y: 4.47,
  Zr: 6.51, Nb: 8.57, Mo: 10.22, Tc: 11.5, Ru: 12.37, Rh: 12.41, Pd: 12.02, Ag: 10.49, Cd: 8.69,
  In: 7.31, Sn: 7.29, Sb: 6.68, Te: 6.23, I: 4.93, Cs: 1.93, Ba: 3.59,
  La: 6.15, Ce: 6.77, Pr: 6.77, Nd: 7.01, Pm: 7.26, Sm: 7.52, Eu: 5.24, Gd: 7.90, Tb: 8.23,
  Dy: 8.55, Ho: 8.80, Er: 9.07, Tm: 9.32, Yb: 6.90, Lu: 9.84,
  Hf: 13.31, Ta: 16.65, W: 19.25, Re: 21.02, Os: 22.59, Ir: 22.56, Pt: 21.45, Au: 19.28, Hg: 13.53,
  Tl: 11.85, Pb: 11.34, Bi: 9.78, Po: 9.20, Ra: 5.50, Ac: 10.07, Th: 11.72, Pa: 15.37,
  U: 19.05, Np: 20.45, Pu: 19.85, Am: 13.69,
};

/* Năm phát hiện — 'Cổ đại' cho các kim loại/phi kim biết từ thời cổ; đồng vị phóng xạ nhân tạo để null */
const DISCOVERY = {
  H: 1766, He: 1868, Li: 1817, Be: 1798, B: 1808, C: 'Cổ đại', N: 1772, O: 1774, F: 1886, Ne: 1898,
  Na: 1807, Mg: 1755, Al: 1825, Si: 1824, P: 1669, S: 'Cổ đại', Cl: 1774, Ar: 1894, K: 1807, Ca: 1808,
  Sc: 1879, Ti: 1791, V: 1801, Cr: 1797, Mn: 1774, Fe: 'Cổ đại', Co: 1735, Ni: 1751, Cu: 'Cổ đại',
  Zn: 1746, Ga: 1875, Ge: 1886, As: 1250, Se: 1817, Br: 1826, Kr: 1898, Rb: 1861, Sr: 1790, Y: 1794,
  Zr: 1789, Nb: 1801, Mo: 1781, Tc: 1937, Ru: 1844, Rh: 1803, Pd: 1803, Ag: 'Cổ đại', Cd: 1817,
  In: 1863, Sn: 'Cổ đại', Sb: 'Cổ đại', Te: 1782, I: 1811, Xe: 1898, Cs: 1860, Ba: 1808,
  La: 1839, Ce: 1803, Pr: 1885, Nd: 1885, Pm: 1945, Sm: 1879, Eu: 1901, Gd: 1880, Tb: 1843,
  Dy: 1886, Ho: 1878, Er: 1843, Tm: 1879, Yb: 1878, Lu: 1907,
  Hf: 1923, Ta: 1802, W: 1783, Re: 1925, Os: 1803, Ir: 1803, Pt: 1735, Au: 'Cổ đại', Hg: 'Cổ đại',
  Tl: 1861, Pb: 'Cổ đại', Bi: 1753, Po: 1898, At: 1940, Rn: 1899, Fr: 1939, Ra: 1898, Ac: 1899,
  Th: 1829, Pa: 1913, U: 1789, Np: 1940, Pu: 1940, Am: 1944, Cm: 1944, Bk: 1949, Cf: 1950,
};

/* Ứng dụng tiêu biểu (ngắn gọn, đúng SGK/đời sống) — chỉ ghi cho nguyên tố phổ biến trong chương trình */
const USES = {
  H: 'Tổng hợp NH3, nhiên liệu sạch, khử khí trong luyện kim',
  He: 'Bóng bay, làm lạnh MRI, khí bảo vệ khi hàn',
  Li: 'Pin lithium-ion, hợp kim nhẹ, điều trị y tế',
  B: 'Kính chịu nhiệt (borosilicate), thủy tinh sợi, thuốc diệt cỏ',
  C: 'Nhiên liệu, thép, than hoạt tính, graphene/diamant',
  N: 'Phân đạm, khí trơ bảo quản, làm lạnh',
  O: 'Hô hấp, y tế, đốt cháy, luyện thép',
  F: 'Kem đánh răng (F-), PTFE/Teflon, chất làm lạnh',
  Ne: 'Đèn neon quảng cáo, laser He-Ne',
  Na: 'Muối ăn, đèn sodium, chất dẫn truyền trong cơ thể',
  Mg: 'Hợp kim siêu nhẹ, pháo sáng, lõi diệp lục',
  Al: 'Vỏ máy bay, bao bì, dây dẫn điện, xây dựng',
  Si: 'Chip bán dẫn, thủy tinh, silicone',
  P: 'Phân lân, diêm, chất tẩy rửa, DNA',
  S: 'Sản xuất H2SO4, lưu hóa cao su, dược phẩm',
  Cl: 'Khử trùng nước, PVC, chất tẩy',
  Ar: 'Khí bảo vệ khi hàn, bơm đèn sợi đốt',
  K: 'Phân bón, xà phòng, duy trì hoạt động tế bào',
  Ca: 'Ximăng, vôi, xây dựng xương và răng',
  Ti: 'Implant y tế, máy bay, sơn trắng (TiO2)',
  V: 'Thép chịu lực, pin vanadium, xúc tác',
  Cr: 'Thép không gỉ, mạ crôm chống gỉ',
  Mn: 'Luyện thép, pin kiềm, hợp kim',
  Fe: 'Thép và gang, xây dựng, huyết sắc tố',
  Co: 'Pin, nam châm, hợp kim superalloy',
  Ni: 'Đồng xu, pin, thép không gỉ, mạ',
  Cu: 'Dây dẫn điện, ống nước, hợp kim đồng/đồng thau',
  Zn: 'Mạ chống gỉ, pin, đồng thau, bổ sung dinh dưỡng',
  Ga: 'LED, bán dẫn GaAs, nhiệt kế cao',
  Ge: 'Quang học hồng ngoại, bán dẫn, sợi quang',
  As: 'Hợp kim chì ắc quy, bán dẫn bán kim loại',
  Se: 'Quét ảnh (cổ điển), quang điện, phụ gia thủy tinh',
  Br: 'Chất dập lửa, thuốc nhuộm, dược phẩm',
  Kr: 'Đèn flash chụp ảnh, đèn laser',
  Rb: 'Đồng hồ nguyên tử, nghiên cứu vật lý nguyên tử',
  Sr: 'Pháo hoa màu đỏ, nam châm ferrite',
  Zr: 'Vỏ thanh nhiên liệu hạt nhân, gốm zirconia',
  Nb: 'Siêu dẫn (máy MRI), hợp kim thép',
  Mo: 'Thép chịu nhiệt, chất xúc tác, bôi trơn (MoS2)',
  Ru: 'Xúc tác, điện cực, hợp kim bền',
  Rh: 'Xúc tác xe hơi (khử NOx), trang sức',
  Pd: 'Xúc tác hydro hóa, lọc khí thải, điện tử',
  Ag: 'Gương, trang sức, dây dẫn, khử khuẩn',
  Cd: 'Pin Ni-Cd (cũ), mạ chống gỉ, màu cadmium',
  In: 'Màn hình cảm ứng ITO, hàn nhiệt, hợp kim thấp',
  Sn: 'Hàn thiếc, mạ lon bảo quản thực phẩm',
  Sb: 'Chất chống cháy, hợp kim chữ, bán dẫn',
  Te: 'Pin mặt trời CdTe, đĩa từ, hợp kim',
  I: 'Khử trùng y tế, muối iốt, cận lâm sàng',
  Xe: 'Đèn pha xe cao cấp, mê khí, laser',
  Cs: 'Đồng hồ nguyên tử (chuẩn giây), khoan dầu',
  Ba: 'Chụp X-quang dạ dày (BaSO4), pháo hoa',
  La: 'Pin Ni-MH, thấu kính, xúc tác',
  Ce: 'Đá lửa bật lửa, đánh bóng, xúc tác ô tô',
  Nd: 'Nam châm cực mạnh NdFeB, laser',
  Eu: 'Phosphor đỏ màn hình, tiền chống giả',
  Gd: 'Thuốc cản từ MRI, che chắn neutron',
  W: 'Dây tóc bóng đèn, dao cắt hợp kim siêu cứng',
  Pt: 'Xúc tác, trang sức, điện cực, đồng hồ',
  Au: 'Trang sức, điện tử, dự trữ giá trị, nha khoa',
  Hg: 'Nhiệt kế/áp kế (cũ), đèn huỳnh quang',
  Tl: 'Đầu dò hồng ngoại, y học (giới hạn nghiêm ngặt)',
  Pb: 'Ắc quy, che tia X, hợp kim hàn',
  Bi: 'Thuốc dạ dày, hợp kim nung thấp, mỹ phẩm',
  Po: 'Nguồn nhiệt RTG, khử tĩnh điện (lượng cực nhỏ)',
  Rn: 'Nghiên cứu địa chất, trị liệu radio (giới hạn)',
  Ra: 'Nghiên cứu lịch sử về phóng xạ',
  U: 'Nhiên liệu nhà máy điện hạt nhân',
  Pu: 'Nhiên liệu hạt nhân, RTG tàu vũ trụ',
};

for (const el of ELEMENTS) {
  el.atomicRadius = RADIUS[el.symbol] ?? null;
  el.meltingPoint = MELTING[el.symbol] ?? null;
  el.boilingPoint = BOILING[el.symbol] ?? null;
  el.density = DENSITY[el.symbol] ?? null;
  el.discovered = DISCOVERY[el.symbol] ?? null;
  el.uses = USES[el.symbol] ?? null;
}
export const TRENDS = [
  { key: 'atomicMass', label: 'Khối lượng nguyên tử', unit: 'u', fmt: (v) => v.toFixed(2) },
  { key: 'electronegativity', label: 'Độ âm điện (Pauling)', unit: '', fmt: (v) => v.toFixed(2) },
  { key: 'atomicRadius', label: 'Bán kính nguyên tử', unit: 'pm', fmt: (v) => v.toFixed(0) },
  { key: 'meltingPoint', label: 'Nhiệt độ nóng chảy', unit: 'K', fmt: (v) => v.toFixed(0) },
  { key: 'valenceElectrons', label: 'Electron hóa trị', unit: 'e', fmt: (v) => String(v) },
];