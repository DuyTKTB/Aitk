/* ============================================================
   bioEngine.js — LÕI TOÁN HỌC & MÔ PHỎNG SINH HỌC CHUẨN GDPT 2018
   ------------------------------------------------------------
   Toàn bộ hàm thuần JS (pure functions, unit-testable bằng Vitest):
     • Quang hợp (Blackman limiting factors · C3/C4 · phổ ánh sáng)
     • Hô hấp tế bào (Đường phân · Krebs · ETC · Lên men)
     • DNA / RNA / 64 Codon / Dịch mã / Nhân đôi k lần / Đột biến điểm
     • Di truyền Mendel (lai 1 & 2 cặp · Punnett · Chi-square)
     • Điện di gel Agarose (cắt giới hạn + di chuyển theo log10 bp)
     • Bộ giải RK4 cho Tăng trưởng quần thể (J/S), Lotka–Volterra & Dịch tễ SIR
     • Tháp năng lượng sinh thái 10%
     • Thực hành Biuret (A540) & Hoạt tính Enzyme Catalase
   ============================================================ */

/* ── 1. QUANG HỢP (Photosynthesis — Blackman + Michaelis-Menten) ── */
export const LIGHT_SPECTRUM_EFF = {
  white: { label: 'Ánh sáng trắng', factor: 1.0, color: '#f8fafc' },
  red: { label: 'Ánh sáng đỏ (660 nm)', factor: 1.08, color: '#ef4444' },
  blue: { label: 'Ánh sáng xanh tím (450 nm)', factor: 1.02, color: '#3b82f6' },
  green: { label: 'Ánh sáng lục (530 nm)', factor: 0.16, color: '#22c55e' },
};

export function calcPhotosynthesisRate({
  light = 800,      // µmol photons / m²·s (0..2000)
  co2 = 420,        // ppm (0..1200)
  temp = 26,        // °C (5..48)
  spectrum = 'white',
  plantType = 'C3', // 'C3' | 'C4'
} = {}) {
  const specFactor = LIGHT_SPECTRUM_EFF[spectrum]?.factor ?? 1.0;
  const effLight = Math.max(0, Number(light) || 0) * specFactor;
  const effCo2 = Math.max(0, Number(co2) || 0);
  const t = Number(temp) || 25;

  const isC4 = plantType === 'C4';
  const kLight = isC4 ? 360 : 210;
  const kCo2 = isC4 ? 95 : 260;
  const optTemp = isC4 ? 33 : 25;
  const maxRate = isC4 ? 46 : 32; // µmol O2 / m²·s

  const fLight = effLight > 0 ? effLight / (effLight + kLight) : 0;
  const fCo2 = effCo2 > 0 ? effCo2 / (effCo2 + kCo2) : 0;

  // Đường cong enzyme Rubisco/PEP-carboxylase (bất đối xứng: giảm mạnh khi > 40°C do biến tính)
  let fTemp = 0;
  if (t > 2 && t < 50) {
    const sigma = t <= optTemp ? 12.5 : 7.8;
    fTemp = Math.exp(-Math.pow((t - optTemp) / sigma, 2));
  }

  // Áp dụng quy luật nhân tố giới hạn kết hợp nhân mượt
  const rateO2 = Math.max(0, Math.round(maxRate * fLight * fCo2 * fTemp * 100) / 100);
  const bubblesPerMin = Math.round(rateO2 * 2.4);
  const glucoseRate = Math.round((rateO2 / 6) * 100) / 100;

  let limitingFactor = 'Tối ưu';
  if (fTemp < 0.35) limitingFactor = t > optTemp ? 'Nhiệt độ quá cao (biến tính enzyme)' : 'Nhiệt độ quá thấp';
  else if (fLight <= fCo2 && fLight < 0.72) limitingFactor = 'Cường độ / bước sóng ánh sáng';
  else if (fCo2 < fLight && fCo2 < 0.72) limitingFactor = 'Nồng độ CO₂';

  return {
    rateO2,
    bubblesPerMin,
    glucoseRate,
    fLight: Math.round(fLight * 100),
    fCo2: Math.round(fCo2 * 100),
    fTemp: Math.round(fTemp * 100),
    limitingFactor,
  };
}

/* ── 2. HÔ HẤP TẾ BÀO (Cellular Respiration) ── */
export function calcCellularRespiration({
  glucose = 1,
  oxygenPresent = true,
  fermentationType = 'lactic', // 'lactic' | 'ethanol'
} = {}) {
  const g = Math.max(1, Math.min(10, Math.round(Number(glucose) || 1)));
  if (!oxygenPresent) {
    return {
      mode: fermentationType === 'ethanol' ? 'Lên men rượu (Nấm men)' : 'Lên men Lactic (Cơ người / Vi khuẩn)',
      stages: [
        { id: 'glycolysis', name: 'Đường phân (Tế bào chất)', atp: 2 * g, nadh: 2 * g, fadh2: 0, co2: 0, note: `${g} Glucose → ${2 * g} Pyruvate` },
        {
          id: 'fermentation',
          name: fermentationType === 'ethanol' ? 'Lên men tạo Ethanol' : 'Lên men tạo Acid Lactic',
          atp: 0,
          nadh: -2 * g,
          fadh2: 0,
          co2: fermentationType === 'ethanol' ? 2 * g : 0,
          note: fermentationType === 'ethanol'
            ? `Tái sinh NAD⁺, tạo ${2 * g} Ethanol + ${2 * g} CO₂`
            : `Tái sinh NAD⁺, tạo ${2 * g} Acid Lactic (gây mỏi cơ)`,
        },
      ],
      totals: {
        atp: 2 * g,
        nadhNet: 0,
        fadh2Net: 0,
        co2: fermentationType === 'ethanol' ? 2 * g : 0,
        o2Consumed: 0,
        h2oProduced: 0,
      },
    };
  }

  // Hô hấp hiếu khí chuẩn SGK GDPT 2018 (32 ATP / 1 phân tử glucose: 1 NADH ≈ 2.5 ATP, 1 FADH2 ≈ 1.5 ATP)
  const stages = [
    { id: 'glycolysis', name: '1. Đường phân (Tế bào chất)', atp: 2 * g, nadh: 2 * g, fadh2: 0, co2: 0, note: `${g} Glucose → ${2 * g} Pyruvate + ${2 * g} ATP + ${2 * g} NADH` },
    { id: 'link', name: '2. Oxi hóa Pyruvate (Chất nền ti thể)', atp: 0, nadh: 2 * g, fadh2: 0, co2: 2 * g, note: `${2 * g} Pyruvate → ${2 * g} Acetyl-CoA + ${2 * g} CO₂ + ${2 * g} NADH` },
    { id: 'krebs', name: '3. Chu trình Krebs (Chất nền ti thể)', atp: 2 * g, nadh: 6 * g, fadh2: 2 * g, co2: 4 * g, note: `Tạo ${2 * g} ATP, ${6 * g} NADH, ${2 * g} FADH₂ và ${4 * g} CO₂` },
    { id: 'etc', name: '4. Chuỗi truyền e⁻ & Hóa thẩm (Màng trong)', atp: 28 * g, nadh: 0, fadh2: 0, co2: 0, note: `${10 * g} NADH + ${2 * g} FADH₂ + ${6 * g} O₂ → ${28 * g} ATP + ${6 * g} H₂O` },
  ];

  return {
    mode: 'Hô hấp hiếu khí (C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + 32 ATP)',
    stages,
    totals: {
      atp: 32 * g,
      nadhProduced: 10 * g,
      fadh2Produced: 2 * g,
      co2: 6 * g,
      o2Consumed: 6 * g,
      h2oProduced: 6 * g,
    },
  };
}

/* ── 3. DI TRUYỀN PHÂN TỬ: DNA, PHIÊN MÃ, DỊCH MÃ & ĐỘT BIẾN ── */
export const CODON_TABLE = {
  UUU: 'Phe', UUC: 'Phe', UUA: 'Leu', UUG: 'Leu',
  UCU: 'Ser', UCC: 'Ser', UCA: 'Ser', UCG: 'Ser',
  UAU: 'Tyr', UAC: 'Tyr', UAA: 'STOP', UAG: 'STOP',
  UGU: 'Cys', UGC: 'Cys', UGA: 'STOP', UGG: 'Trp',
  CUU: 'Leu', CUC: 'Leu', CUA: 'Leu', CUG: 'Leu',
  CCU: 'Pro', CCC: 'Pro', CCA: 'Pro', CCG: 'Pro',
  CAU: 'His', CAC: 'His', CAA: 'Gln', CAG: 'Gln',
  CGU: 'Arg', CGC: 'Arg', CGA: 'Arg', CGG: 'Arg',
  AUU: 'Ile', AUC: 'Ile', AUA: 'Ile', AUG: 'Met',
  ACU: 'Thr', ACC: 'Thr', ACA: 'Thr', ACG: 'Thr',
  AAU: 'Asn', AAC: 'Asn', AAA: 'Lys', AAG: 'Lys',
  AGU: 'Ser', AGC: 'Ser', AGA: 'Arg', AGG: 'Arg',
  GUU: 'Val', GUC: 'Val', GUA: 'Val', GUG: 'Val',
  GCU: 'Ala', GCC: 'Ala', GCA: 'Ala', GCG: 'Ala',
  GAU: 'Asp', GAC: 'Asp', GAA: 'Glu', GAG: 'Glu',
  GGU: 'Gly', GGC: 'Gly', GGA: 'Gly', GGG: 'Gly',
};

const DNA_COMP = { A: 'T', T: 'A', G: 'C', C: 'G' };
const DNA_TO_MRNA = { A: 'U', T: 'A', G: 'C', C: 'G' };
const MRNA_TO_TRNA = { A: 'U', U: 'A', G: 'C', C: 'G' };

export function sanitizeDnaSeq(seq = '') {
  return String(seq || '')
    .toUpperCase()
    .replace(/X/g, 'C')
    .replace(/[^ATGC]/g, '');
}

export function analyzeDnaSequence(template3to5 = 'TACCGGAAATTTGCTATT', replicationRounds = 1) {
  const tpl = sanitizeDnaSeq(template3to5);
  const coding5to3 = tpl.split('').map((b) => DNA_COMP[b] || 'A').join('');
  const mRNA = tpl.split('').map((b) => DNA_TO_MRNA[b] || 'A').join('');

  const nPairs = tpl.length;
  const N = nPairs * 2;
  let A = 0, T = 0, G = 0, C = 0;
  for (let i = 0; i < tpl.length; i++) {
    const b1 = tpl[i];
    const b2 = coding5to3[i];
    if (b1 === 'A') A++; else if (b1 === 'T') T++; else if (b1 === 'G') G++; else if (b1 === 'C') C++;
    if (b2 === 'A') A++; else if (b2 === 'T') T++; else if (b2 === 'G') G++; else if (b2 === 'C') C++;
  }
  const hydrogenBonds = 2 * A + 3 * G;
  const lengthAngstrom = Math.round(nPairs * 3.4 * 10) / 10;
  const molecularWeight = N * 300;
  const turns = Math.round((nPairs / 10) * 100) / 100;

  const k = Math.max(1, Math.min(8, Math.round(Number(replicationRounds) || 1)));
  const totalDaughters = Math.pow(2, k);
  const newOnlyDaughters = Math.max(0, totalDaughters - 2);
  const nuEnvNeeded = N * (totalDaughters - 1);

  const codons = [];
  const anticodons = [];
  const aminoAcids = [];
  let stopped = false;
  for (let i = 0; i + 2 < mRNA.length; i += 3) {
    const c = mRNA.slice(i, i + 3);
    codons.push(c);
    const aa = CODON_TABLE[c] || '?';
    anticodons.push(aa === 'STOP' ? '—' : c.split('').map((x) => MRNA_TO_TRNA[x] || x).join(''));
    if (!stopped) {
      aminoAcids.push(aa);
      if (aa === 'STOP') stopped = true;
    }
  }

  return {
    template3to5: tpl,
    coding5to3,
    mRNA,
    nPairs,
    N,
    counts: { A, T, G, C },
    hydrogenBonds,
    lengthAngstrom,
    molecularWeight,
    turns,
    replication: { k, totalDaughters, newOnlyDaughters, nuEnvNeeded },
    codons,
    anticodons,
    aminoAcids,
  };
}

/* ── 4. DI TRUYỀN MENDEL (1 & 2 CẶP + PUNNETT + CHI-SQUARE) ── */
function normalizeAllelePair(a, b) {
  // Đưa chữ in hoa lên trước (Aa, Bb)
  const isUpperA = a === a.toUpperCase() && a !== a.toLowerCase();
  const isUpperB = b === b.toUpperCase() && b !== b.toLowerCase();
  if (isUpperB && !isUpperA) return b + a;
  return a + b;
}

export function getGametes(genotype = 'Aa') {
  const clean = String(genotype || '').replace(/\s+/g, '');
  if (clean.length === 2) {
    return [clean[0], clean[1]];
  }
  if (clean.length === 4) {
    return [
      clean[0] + clean[2],
      clean[0] + clean[3],
      clean[1] + clean[2],
      clean[1] + clean[3],
    ];
  }
  return ['A', 'a'];
}

export function combineGametePair(g1, g2) {
  if (g1.length === 1 && g2.length === 1) {
    return normalizeAllelePair(g1, g2);
  }
  if (g1.length === 2 && g2.length === 2) {
    return normalizeAllelePair(g1[0], g2[0]) + normalizeAllelePair(g1[1], g2[1]);
  }
  return g1 + g2;
}

export function classifyMendelPhenotype(genotype, { incompleteDominance = false } = {}) {
  const g = String(genotype || '');
  if (g.length === 2) {
    if (g === 'AA') return 'Vàng (Trội thuần)';
    if (g === 'aa') return 'Xanh (Lặn)';
    return incompleteDominance ? 'Vàng nhạt (Trung gian)' : 'Vàng (Trội)';
  }
  if (g.length === 4) {
    const hasA = g[0] === 'A' || g[1] === 'A';
    const hasB = g[2] === 'B' || g[3] === 'B';
    const color = hasA ? 'Vàng' : 'Xanh';
    const shape = hasB ? 'Trơn' : 'Nhăn';
    return `${color} – ${shape}`;
  }
  return g;
}

export function computeMendelCross(parent1 = 'Aa', parent2 = 'Aa', opts = {}) {
  const g1 = getGametes(parent1);
  const g2 = getGametes(parent2);
  const grid = g1.map((rowGam) =>
    g2.map((colGam) => {
      const geno = combineGametePair(rowGam, colGam);
      return {
        rowGam,
        colGam,
        genotype: geno,
        phenotype: classifyMendelPhenotype(geno, opts),
      };
    })
  );

  const total = g1.length * g2.length;
  const genoCounts = {};
  const phenoCounts = {};
  grid.flat().forEach((cell) => {
    genoCounts[cell.genotype] = (genoCounts[cell.genotype] || 0) + 1;
    phenoCounts[cell.phenotype] = (phenoCounts[cell.phenotype] || 0) + 1;
  });

  const genotypeSummary = Object.entries(genoCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([genotype, count]) => ({ genotype, count, pct: Math.round((count / total) * 1000) / 10 }));

  const phenotypeSummary = Object.entries(phenoCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([phenotype, count]) => ({ phenotype, count, pct: Math.round((count / total) * 1000) / 10 }));

  return {
    parent1,
    parent2,
    gametes1: g1,
    gametes2: g2,
    grid,
    total,
    genotypeSummary,
    phenotypeSummary,
  };
}

export function simulateMendelOffspring(crossResult, nOffspring = 200) {
  const cells = crossResult.grid.flat();
  const n = Math.max(10, Math.min(5000, Math.round(Number(nOffspring) || 200)));
  const observed = {};
  for (let i = 0; i < n; i++) {
    const pick = cells[Math.floor(Math.random() * cells.length)];
    observed[pick.phenotype] = (observed[pick.phenotype] || 0) + 1;
  }
  let chiSquare = 0;
  const rows = crossResult.phenotypeSummary.map((item) => {
    const expCount = (item.count / crossResult.total) * n;
    const obsCount = observed[item.phenotype] || 0;
    if (expCount > 0) {
      chiSquare += Math.pow(obsCount - expCount, 2) / expCount;
    }
    return {
      phenotype: item.phenotype,
      expected: Math.round(expCount * 10) / 10,
      observed: obsCount,
    };
  });
  return {
    n,
    rows,
    chiSquare: Math.round(chiSquare * 1000) / 1000,
    df: Math.max(1, crossResult.phenotypeSummary.length - 1),
  };
}

/* ── 5. ĐIỆN DI GEL AGAROSE (DNA Electrophoresis) ── */
export const DNA_LADDER_BP = [10000, 6000, 4000, 3000, 2000, 1500, 1000, 750, 500, 250, 100];

export function calcGelMigrationFraction(bp, { voltage = 100, minutes = 40, gelPct = 1.0 } = {}) {
  const safeBp = Math.max(50, Number(bp) || 1000);
  const v = Math.max(20, Math.min(200, Number(voltage) || 100));
  const t = Math.max(0, Math.min(90, Number(minutes) || 0));
  const g = Math.max(0.5, Math.min(2.5, Number(gelPct) || 1.0));

  // Tốc độ điện di giảm tuyến tính theo log10(bp) và giảm khi tăng % agarose
  const logSize = Math.log10(safeBp); // 100 bp -> 2.0, 10000 bp -> 4.0
  const mobility = Math.max(0.06, (4.45 - logSize) / 2.65);
  const poreResistance = 1.0 / (0.55 + 0.45 * g);
  const dist = mobility * poreResistance * (v / 100) * (t / 45);
  return Math.max(0, Math.min(0.96, Math.round(dist * 1000) / 1000));
}

/* ── 6. BỘ GIẢI RK4: TĂNG TRƯỞNG QUẦN THỂ, LOTKA–VOLTERRA & DỊCH TỄ SIR ── */
export function simulatePopulationCurve({
  mode = 'logistic', // 'exponential' | 'logistic' | 'lotka'
  n0 = 20,
  r = 0.25,
  K = 500,
  pred0 = 10,
  alpha = 0.4, // sinh sản con mồi
  beta = 0.015, // tỷ lệ săn mồi
  delta = 0.008, // chuyển hóa sinh sản vật ăn thịt
  gamma = 0.22, // tử vong vật ăn thịt
  steps = 60,
  dt = 0.5,
} = {}) {
  const series = [];
  if (mode === 'lotka') {
    let x = Math.max(1, Number(n0) || 40);
    let y = Math.max(1, Number(pred0) || 12);
    const fx = (px, py) => alpha * px - beta * px * py;
    const fy = (px, py) => delta * px * py - gamma * py;
    for (let i = 0; i <= steps; i++) {
      series.push({ t: Math.round(i * dt * 10) / 10, prey: Math.round(x * 10) / 10, predator: Math.round(y * 10) / 10 });
      const k1x = fx(x, y), k1y = fy(x, y);
      const k2x = fx(x + 0.5 * dt * k1x, y + 0.5 * dt * k1y), k2y = fy(x + 0.5 * dt * k1x, y + 0.5 * dt * k1y);
      const k3x = fx(x + 0.5 * dt * k2x, y + 0.5 * dt * k2y), k3y = fy(x + 0.5 * dt * k2x, y + 0.5 * dt * k2y);
      const k4x = fx(x + dt * k3x, y + dt * k3y), k4y = fy(x + dt * k3x, y + dt * k3y);
      x = Math.max(0.5, x + (dt / 6) * (k1x + 2 * k2x + 2 * k3x + k4x));
      y = Math.max(0.5, y + (dt / 6) * (k1y + 2 * k2y + 2 * k3y + k4y));
    }
    return series;
  }

  let N = Math.max(1, Number(n0) || 20);
  const capK = Math.max(20, Number(K) || 500);
  const rate = Math.max(0.01, Number(r) || 0.2);
  const f = (n) => (mode === 'exponential' ? rate * n : rate * n * (1 - n / capK));

  for (let i = 0; i <= steps; i++) {
    series.push({ t: Math.round(i * dt * 10) / 10, N: Math.round(Math.min(N, capK * 4) * 10) / 10 });
    const k1 = f(N);
    const k2 = f(N + 0.5 * dt * k1);
    const k3 = f(N + 0.5 * dt * k2);
    const k4 = f(N + dt * k3);
    N = Math.max(0, N + (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4));
  }
  return series;
}

export function simulateSirModel({
  population = 1000,
  initialInfected = 5,
  vaccinatedPct = 0,
  beta = 0.36, // hệ số lây nhiễm
  gamma = 0.12, // hệ số hồi phục (1/ngày bệnh)
  days = 100,
} = {}) {
  const N = Math.max(50, Number(population) || 1000);
  const initR = Math.round((N * Math.max(0, Math.min(95, Number(vaccinatedPct) || 0))) / 100);
  let I = Math.min(N - initR, Math.max(1, Number(initialInfected) || 5));
  let R = initR;
  let S = Math.max(0, N - I - R);

  const r0 = gamma > 0 ? Math.round((beta / gamma) * 100) / 100 : 0;
  const rEff = Math.round(r0 * (S / N) * 100) / 100;
  const herdImmunityPct = r0 > 1 ? Math.round((1 - 1 / r0) * 1000) / 10 : 0;

  const series = [];
  let peakI = I;
  let peakDay = 0;
  const dt = 0.5;
  const totalSteps = Math.round(days / dt);

  const dS = (s, inf) => (-beta * s * inf) / N;
  const dI = (s, inf) => (beta * s * inf) / N - gamma * inf;
  const dR = (inf) => gamma * inf;

  for (let step = 0; step <= totalSteps; step++) {
    const day = Math.round(step * dt * 10) / 10;
    if (step % 2 === 0) {
      series.push({ day, S: Math.round(S), I: Math.round(I), R: Math.round(R) });
    }
    if (I > peakI) {
      peakI = I;
      peakDay = day;
    }
    const k1S = dS(S, I), k1I = dI(S, I), k1R = dR(I);
    const k2S = dS(S + 0.5 * dt * k1S, I + 0.5 * dt * k1I);
    const k2I = dI(S + 0.5 * dt * k1S, I + 0.5 * dt * k1I);
    const k2R = dR(I + 0.5 * dt * k1I);
    const k3S = dS(S + 0.5 * dt * k2S, I + 0.5 * dt * k2I);
    const k3I = dI(S + 0.5 * dt * k2S, I + 0.5 * dt * k2I);
    const k3R = dR(I + 0.5 * dt * k2I);
    const k4S = dS(S + dt * k3S, I + dt * k3I);
    const k4I = dI(S + dt * k3S, I + dt * k3I);
    const k4R = dR(I + dt * k3I);

    S = Math.max(0, S + (dt / 6) * (k1S + 2 * k2S + 2 * k3S + k4S));
    I = Math.max(0, I + (dt / 6) * (k1I + 2 * k2I + 2 * k3I + k4I));
    R = Math.min(N, Math.max(0, R + (dt / 6) * (k1R + 2 * k2R + 2 * k3R + k4R)));
  }

  return {
    r0,
    rEff,
    herdImmunityPct,
    peakInfected: Math.round(peakI),
    peakDay: Math.round(peakDay),
    totalInfected: Math.round(N - S - initR),
    series,
  };
}

/* ── 7. THÁP NĂNG LƯỢNG SINH THÁI (10% Rule) ── */
export function calcEnergyPyramid(producerKcal = 100000, efficiencyPct = 10) {
  const eff = Math.max(2, Math.min(25, Number(efficiencyPct) || 10)) / 100;
  const levels = [
    { level: 1, name: 'Sinh vật sản xuất (Thực vật)', energy: Math.round(producerKcal) },
    { level: 2, name: 'Sinh vật tiêu thụ bậc 1 (Động vật ăn cỏ)', energy: Math.round(producerKcal * eff) },
    { level: 3, name: 'Sinh vật tiêu thụ bậc 2 (Động vật ăn thịt nhỏ)', energy: Math.round(producerKcal * eff * eff) },
    { level: 4, name: 'Sinh vật tiêu thụ bậc 3 (Đỉnh lưới thức ăn)', energy: Math.round(producerKcal * eff * eff * eff) },
  ];
  return levels;
}

/* ── 8. THỰC HÀNH SINH HÓA: BIURET (PROTEIN) & ENZYME CATALASE ── */
export function calcBiuretAbsorbance(proteinMgPerMl = 2.5) {
  // Định luật Beer-Lambert: A540 = 0.085 * C + 0.015 (tuyến tính 0..10 mg/mL)
  const c = Math.max(0, Math.min(12, Number(proteinMgPerMl) || 0));
  const absorbance = Math.round((0.085 * c + 0.015) * 1000) / 1000;
  return { concentration: c, absorbance };
}

export function calcCatalaseActivity({ temp = 37, ph = 7.0, substratePct = 3.0 } = {}) {
  const t = Number(temp) || 37;
  const p = Number(ph) || 7;
  const s = Math.max(0, Number(substratePct) || 3);
  const fTemp = t >= 68 ? 0 : Math.exp(-Math.pow((t - 37) / (t <= 37 ? 18 : 11), 2));
  const fPh = Math.exp(-Math.pow((p - 7.0) / 2.2, 2));
  const fSub = s / (s + 1.2);
  const rate = Math.round(100 * fTemp * fPh * fSub * 10) / 10; // mL O2 / phút
  return { rate, fTemp: Math.round(fTemp * 100), fPh: Math.round(fPh * 100) };
}
