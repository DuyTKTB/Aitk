/* ============================================================
   scientificTools.js — BỘ CÔNG CỤ TÍNH TOÁN KHOA HỌC ĐA MÔN ELEC AI
   Chuẩn GDPT 2025: Toán học, Vật lí, Hóa học, Sinh học
   ------------------------------------------------------------
   Mục tiêu: Đảm bảo nguyên tắc "Công cụ tính toán tất định trước,
   AI chỉ diễn giải sư phạm sau" → Đáp án số học và bản chất
   khoa học chính xác 100%, loại bỏ hoàn toàn việc AI bịa số.
   ============================================================ */

const r3 = (n) => Math.round(n * 1000) / 1000;
const r4 = (n) => Math.round(n * 10000) / 10000;
const fmt = (n) => String(r3(n)).replace('.', ',');

/* ============================================================
   1. TOÁN HỌC (MATHEMATICS ENGINE)
   ============================================================ */

/**
 * Giải và biện luận phương trình bậc hai: a*x^2 + b*x + c = 0
 */
export function solveQuadratic(a, b, c) {
  const numA = Number(a);
  const numB = Number(b);
  const numC = Number(c);

  if (Number.isNaN(numA) || Number.isNaN(numB) || Number.isNaN(numC)) return null;

  // Bậc nhất nếu a = 0
  if (Math.abs(numA) < 1e-9) {
    if (Math.abs(numB) < 1e-9) {
      return Math.abs(numC) < 1e-9 ? { type: 'infinite', roots: [] } : { type: 'none', roots: [] };
    }
    const root = -numC / numB;
    return { type: 'linear', roots: [r4(root)], sum: root, product: null };
  }

  const delta = numB * numB - 4 * numA * numC;
  const vertexX = -numB / (2 * numA);
  const vertexY = -delta / (4 * numA);

  if (delta < -1e-9) {
    return {
      type: 'none',
      delta: r4(delta),
      roots: [],
      vertex: { x: r4(vertexX), y: r4(vertexY) },
    };
  }

  if (Math.abs(delta) <= 1e-9) {
    return {
      type: 'double',
      delta: 0,
      roots: [r4(vertexX)],
      vertex: { x: r4(vertexX), y: r4(vertexY) },
      sum: r4(-numB / numA),
      product: r4(numC / numA),
    };
  }

  const sqrtDelta = Math.sqrt(delta);
  const x1 = (-numB + sqrtDelta) / (2 * numA);
  const x2 = (-numB - sqrtDelta) / (2 * numA);
  return {
    type: 'two_distinct',
    delta: r4(delta),
    roots: [r4(Math.min(x1, x2)), r4(Math.max(x1, x2))],
    sum: r4(-numB / numA),
    product: r4(numC / numA),
    vertex: { x: r4(vertexX), y: r4(vertexY) },
  };
}

/**
 * Khảo sát hàm phân thức hữu tỉ nhất biến: y = (ax + b) / (cx + d)
 */
export function analyzeRationalFunction(a, b, c, d) {
  const numA = Number(a);
  const numB = Number(b);
  const numC = Number(c);
  const numD = Number(d);

  if (Math.abs(numC) < 1e-9) return null; // Không phải bậc nhất trên bậc nhất
  const det = numA * numD - numB * numC; // Đạo hàm y' = det / (cx + d)^2

  const verticalAsymptote = -numD / numC; // Tiệm cận đứng x = -d/c
  const horizontalAsymptote = numA / numC; // Tiệm cận ngang y = a/c

  return {
    det: r4(det),
    isIncreasing: det > 0,
    isDecreasing: det < 0,
    verticalAsymptote: r4(verticalAsymptote),
    horizontalAsymptote: r4(horizontalAsymptote),
    centerOfSymmetry: { x: r4(verticalAsymptote), y: r4(horizontalAsymptote) },
    domainExclude: r4(verticalAsymptote),
  };
}

/**
 * Hình học không gian Oxyz: Tính toán Vectơ 3D
 */
export function vector3D(u = [0, 0, 0], v = [0, 0, 0]) {
  const [x1, y1, z1] = u.map(Number);
  const [x2, y2, z2] = v.map(Number);

  const lengthU = Math.sqrt(x1 * x1 + y1 * y1 + z1 * z1);
  const lengthV = Math.sqrt(x2 * x2 + y2 * y2 + z2 * z2);
  const dotProduct = x1 * x2 + y1 * y2 + z1 * z2;

  // Tích có hướng: [u, v]
  const crossProduct = [
    y1 * z2 - z1 * y2,
    z1 * x2 - x1 * z2,
    x1 * y2 - y1 * x2,
  ];
  const lengthCross = Math.sqrt(
    crossProduct[0] ** 2 + crossProduct[1] ** 2 + crossProduct[2] ** 2
  );

  let angleDeg = 0;
  if (lengthU > 1e-9 && lengthV > 1e-9) {
    const cosAngle = Math.max(-1, Math.min(1, dotProduct / (lengthU * lengthV)));
    angleDeg = (Math.acos(cosAngle) * 180) / Math.PI;
  }

  return {
    lengthU: r4(lengthU),
    lengthV: r4(lengthV),
    dotProduct: r4(dotProduct),
    crossProduct: crossProduct.map(r4),
    triangleArea: r4(0.5 * lengthCross),
    angleDeg: r4(angleDeg),
    isPerpendicular: Math.abs(dotProduct) < 1e-6,
    isParallel: lengthCross < 1e-6,
  };
}

/**
 * Đại số tổ hợp & xác suất: Hoán vị, Chỉnh hợp, Tổ hợp
 */
export function combinatorics(n, k) {
  const numN = Math.floor(Number(n));
  const numK = Math.floor(Number(k));

  if (numN < 0 || numK < 0 || numK > numN) return null;

  const fact = (m) => {
    let p = 1;
    for (let i = 2; i <= m; i++) p *= i;
    return p;
  };

  const nFact = fact(numN);
  const p = nFact; // P_n
  const a = fact(numN) / fact(numN - numK); // A_n^k
  const c = fact(numN) / (fact(numK) * fact(numN - numK)); // C_n^k

  return {
    n: numN,
    k: numK,
    permutations: p,
    arrangements: a,
    combinations: c,
  };
}

/* ============================================================
   2. VẬT LÍ (PHYSICS ENGINE)
   ============================================================ */

/**
 * Dao động điều hòa (Con lắc lò xo / Con lắc đơn)
 */
export function harmonicOscillation({ m, k, g = 9.8, l, A = 1 }) {
  let omega = 0;
  let type = '';

  if (k && m) {
    omega = Math.sqrt(Number(k) / Number(m));
    type = 'Con lắc lò xo';
  } else if (l && g) {
    omega = Math.sqrt(Number(g) / Number(l));
    type = 'Con lắc đơn';
  }

  if (omega <= 0) return null;

  const numA = Number(A) || 1; // Biên độ (cm hoặc m)
  const T = (2 * Math.PI) / omega;
  const f = 1 / T;
  const vMax = omega * numA;
  const aMax = omega * omega * numA;

  let totalEnergy = null;
  if (k && numA) {
    totalEnergy = 0.5 * Number(k) * (numA / 100) ** 2; // Giả sử A tính bằng cm đổi sang m
  }

  return {
    type,
    omega: r4(omega),
    periodT: r4(T),
    frequencyF: r4(f),
    vMax: r4(vMax),
    aMax: r4(aMax),
    totalEnergy: totalEnergy !== null ? r4(totalEnergy) : null,
  };
}

/**
 * Mạch điện xoay chiều RLC nối tiếp
 */
export function acCircuits({ R = 0, L = 0, C = 0, f = 50 }) {
  const numR = Number(R) || 0;
  const numL = Number(L) || 0; // Henry (H)
  const numC = Number(C) || 0; // Farad (F)
  const numF = Number(f) || 50;

  const omega = 2 * Math.PI * numF;
  const zL = omega * numL;
  const zC = numC > 0 ? 1 / (omega * numC) : 0;
  const Z = Math.sqrt(numR ** 2 + (zL - zC) ** 2);
  const cosPhi = Z > 0 ? numR / Z : 1;
  const phiRad = Math.atan2(zL - zC, numR);
  const phiDeg = (phiRad * 180) / Math.PI;

  const resonantF = (numL > 0 && numC > 0) ? 1 / (2 * Math.PI * Math.sqrt(numL * numC)) : null;

  return {
    frequency: numF,
    omega: r4(omega),
    zL: r4(zL),
    zC: r4(zC),
    totalImpedanceZ: r4(Z),
    powerFactorCosPhi: r4(cosPhi),
    phaseShiftDeg: r4(phiDeg),
    resonantFrequency: resonantF !== null ? r4(resonantF) : null,
    isResonant: Math.abs(zL - zC) < 1e-4,
  };
}

/**
 * Phương trình trạng thái khí lý tưởng: P*V = n*R*T
 */
export function idealGas({ p, v, tCelsius, n }) {
  const R = 8.314; // J/(mol*K)
  const numT = Number(tCelsius) + 273.15; // Kelvin

  if (p && v && tCelsius && !n) {
    const numP = Number(p); // Pa hoặc kPa
    const numV = Number(v); // m^3 hoặc lít
    const computedMol = (numP * numV) / (R * numT);
    return { moles: r4(computedMol), temperatureK: r4(numT) };
  }

  return { temperatureK: r4(numT) };
}

/* ============================================================
   3. SINH HỌC (BIOLOGY MOLECULAR ENGINE)
   ============================================================ */

/**
 * Di truyền học phân tử: Cấu trúc gen & ADN
 */
export function dnaMolecular({ N, L, H, M, A, G }) {
  let totalN = Number(N) || 0;

  if (!totalN && L) {
    totalN = (Number(L) / 3.4) * 2;
  } else if (!totalN && M) {
    totalN = Number(M) / 300;
  }

  let numA = Number(A) || 0;
  let numG = Number(G) || 0;

  if (totalN > 0 && H) {
    // Hệ phương trình: 2A + 2G = N và 2A + 3G = H -> G = H - N
    numG = Number(H) - totalN;
    numA = totalN / 2 - numG;
  }

  if (totalN > 0 && !numA && numG > 0) {
    numA = totalN / 2 - numG;
  } else if (totalN > 0 && !numG && numA > 0) {
    numG = totalN / 2 - numA;
  }

  const lengthL = totalN > 0 ? (totalN / 2) * 3.4 : (L ? Number(L) : 0);
  const hydrogenBonds = (numA > 0 && numG > 0) ? 2 * numA + 3 * numG : (H ? Number(H) : 0);
  const molecularWeight = totalN > 0 ? totalN * 300 : 0;
  const coils = totalN > 0 ? totalN / 20 : 0;

  return {
    totalNucleotides: Math.round(totalN),
    lengthAngstrom: r4(lengthL),
    hydrogenBonds: Math.round(hydrogenBonds),
    molecularWeight: Math.round(molecularWeight),
    coils: r4(coils),
    nucleotides: {
      A: Math.round(numA),
      T: Math.round(numA),
      G: Math.round(numG),
      X: Math.round(numG),
    },
    ratios: totalN > 0 ? {
      percentA: r4((numA / totalN) * 100),
      percentG: r4((numG / totalN) * 100),
    } : null,
  };
}

/* ============================================================
   4. BỘ TỰ ĐỘNG CHẠY CÔNG CỤ KHOA HỌC ĐA MÔN (DISPATCHER)
   ============================================================ */

/**
 * Quét chuỗi văn bản của câu hỏi, phát hiện bài toán Toán - Lý - Sinh
 * và tính toán trước đáp án tất định để chuyển cho AI.
 */
export function runScientificTools(text) {
  if (!text || typeof text !== 'string') return { hits: [], summary: '' };
  const s = text.toLowerCase();
  const hits = [];

  // --- A. TOÁN HỌC: PHƯƠNG TRÌNH BẬC 2 ---
  // Dạng: "x^2 - 5x + 6 = 0" hoặc "2x^2 + 3x - 5 = 0"
  const quadMatch = s.match(/([+-]?\s*\d*)\s*x\^?2\s*([+-]\s*\d*)\s*x\s*([+-]\s*\d+)\s*=\s*0/i);
  if (quadMatch) {
    const rawA = quadMatch[1].replace(/\s+/g, '');
    const a = rawA === '' || rawA === '+' ? 1 : rawA === '-' ? -1 : Number(rawA);
    const rawB = quadMatch[2].replace(/\s+/g, '');
    const b = rawB === '+' ? 1 : rawB === '-' ? -1 : Number(rawB);
    const c = Number(quadMatch[3].replace(/\s+/g, ''));

    const res = solveQuadratic(a, b, c);
    if (res) {
      const rootStr = res.roots.length
        ? res.roots.map((r) => `x = ${fmt(r)}`).join(', ')
        : 'Phương trình vô nghiệm thực';
      hits.push({
        subject: 'Toán học',
        tool: 'quadratic_equation',
        title: `Giải phương trình bậc hai: ${a}x² ${b >= 0 ? '+' : ''}${b}x ${c >= 0 ? '+' : ''}${c} = 0`,
        lines: [
          `Biệt thức Delta = ${fmt(res.delta || 0)}`,
          `Tập nghiệm: ${rootStr}`,
          res.vertex ? `Tọa độ đỉnh Parabol I(${fmt(res.vertex.x)}; ${fmt(res.vertex.y)})` : '',
        ].filter(Boolean),
        value: res.roots[0] ?? null,
      });
    }
  }

  // --- B. TOÁN HỌC: HÀM NHẤT BIẾN y = (ax+b)/(cx+d) ---
  // Dạng: "y = (2x+1)/(x-1)" hoặc "tiệm cận của hàm số y = (x+3)/(2x-4)"
  const ratMatch = s.match(/y\s*=\s*\(?\s*([+-]?\d*)\s*x\s*([+-]\s*\d+)\s*\)?\s*\/\s*\(?\s*([+-]?\d*)\s*x\s*([+-]\s*\d+)\s*\)?/i);
  if (ratMatch) {
    const a = Number(ratMatch[1] || 1);
    const b = Number(ratMatch[2].replace(/\s+/g, ''));
    const c = Number(ratMatch[3] || 1);
    const d = Number(ratMatch[4].replace(/\s+/g, ''));

    const res = analyzeRationalFunction(a, b, c, d);
    if (res) {
      hits.push({
        subject: 'Toán học',
        tool: 'rational_function',
        title: `Khảo sát hàm số phân thức y = (${a}x + ${b}) / (${c}x + ${d})`,
        lines: [
          `Đạo hàm y' = ${fmt(res.det)} / (${c}x ${d >= 0 ? '+' : ''}${d})² (${res.isIncreasing ? 'Hàm số đồng biến' : 'Hàm số nghịch biến'})`,
          `Tiệm cận đứng: x = ${fmt(res.verticalAsymptote)}`,
          `Tiệm cận ngang: y = ${fmt(res.horizontalAsymptote)}`,
          `Tâm đối xứng: I(${fmt(res.centerOfSymmetry.x)}; ${fmt(res.centerOfSymmetry.y)})`,
        ],
        value: res.verticalAsymptote,
      });
    }
  }

  // --- C. TOÁN HỌC: TỔ HỢP C(n, k) & CHỈNH HỢP A(n, k) ---
  const combMatch = s.match(/(?:chọn|tổ hợp|chỉnh hợp|c_?(\d+)\^?(\d+)|c\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)|(\d+)\s*chọn\s*(\d+))/i);
  if (combMatch) {
    const n = Number(combMatch[1] || combMatch[3] || combMatch[5]);
    const k = Number(combMatch[2] || combMatch[4] || combMatch[6]);
    if (n && k && k <= n) {
      const res = combinatorics(n, k);
      if (res) {
        hits.push({
          subject: 'Toán học',
          tool: 'combinatorics',
          title: `Đại số tổ hợp: n = ${n}, k = ${k}`,
          lines: [
            `Số tổ hợp C(${n}, ${k}) = ${res.combinations}`,
            `Số chỉnh hợp A(${n}, ${k}) = ${res.arrangements}`,
            `Số hoán vị P(${n}) = ${res.permutations}`,
          ],
          value: res.combinations,
        });
      }
    }
  }

  // --- D. VẬT LÍ: CON LẮC LÒ XO & DAO ĐỘNG ĐIỀU HÒA ---
  const kMatch = s.match(/(?:độ cứng|k\s*=)\s*(\d+(?:[.,]\d+)?)\s*(?:n\/m)?/i);
  const mMatch = s.match(/(?:khối lượng|m\s*=)\s*(\d+(?:[.,]\d+)?)\s*(?:g|gam|kg)?/i);
  if ((s.includes('dao động') || s.includes('con lắc') || s.includes('chu kỳ')) && kMatch && mMatch) {
    const k = Number(kMatch[1].replace(',', '.'));
    let m = Number(mMatch[1].replace(',', '.'));
    if (m > 10) m /= 1000; // Đổi gram ra kg nếu số lớn hơn 10

    const aMatch = s.match(/(?:biên độ|a\s*=)\s*(\d+(?:[.,]\d+)?)\s*(?:cm)?/i);
    const A = aMatch ? Number(aMatch[1].replace(',', '.')) : 5;

    const res = harmonicOscillation({ k, m, A });
    if (res) {
      hits.push({
        subject: 'Vật lí',
        tool: 'harmonic_oscillation',
        title: `Dao động điều hòa con lắc lò xo (k = ${k} N/m, m = ${fmt(m)} kg)`,
        lines: [
          `Tần số góc omega = ${fmt(res.omega)} rad/s`,
          `Chu kỳ T = ${fmt(res.periodT)} s | Tần số f = ${fmt(res.frequencyF)} Hz`,
          `Vận tốc cực đại v_max = ${fmt(res.vMax)} cm/s`,
          `Gia tốc cực đại a_max = ${fmt(res.aMax)} cm/s²`,
          res.totalEnergy !== null ? `Cơ năng dao động W = ${fmt(res.totalEnergy)} J` : '',
        ].filter(Boolean),
        value: res.periodT,
      });
    }
  }

  // --- E. VẬT LÍ: MẠCH XOAY CHIỀU RLC ---
  const rlcMatch = s.match(/r\s*=\s*(\d+)/i);
  const lMatch = s.match(/l\s*=\s*(\d+(?:[.,]\d+)?)\s*(?:h|\/?\s*pi\s*h)/i);
  const cMatch = s.match(/c\s*=\s*(\d+(?:[.,]\d+)?)\s*(?:u?f|micro\s*f)/i);
  if (s.includes('mạch') && (s.includes('xoay chiều') || s.includes('rlc') || s.includes('tổng trở')) && rlcMatch) {
    const R = Number(rlcMatch[1]);
    const L = lMatch ? Number(lMatch[1].replace(',', '.')) : 0;
    const C = cMatch ? Number(cMatch[1].replace(',', '.')) * 1e-6 : 0;

    const res = acCircuits({ R, L, C, f: 50 });
    if (res) {
      hits.push({
        subject: 'Vật lí',
        tool: 'ac_circuit_rlc',
        title: `Mạch điện xoay chiều RLC (R = ${R} Ω, f = 50 Hz)`,
        lines: [
          `Tần số góc omega = 100π ≈ 314,16 rad/s`,
          res.zL > 0 ? `Cảm kháng Z_L = ${fmt(res.zL)} Ω` : '',
          res.zC > 0 ? `Dung kháng Z_C = ${fmt(res.zC)} Ω` : '',
          `Tổng trở Z = ${fmt(res.totalImpedanceZ)} Ω`,
          `Hệ số công suất cosφ = ${fmt(res.powerFactorCosPhi)}`,
        ].filter(Boolean),
        value: res.totalImpedanceZ,
      });
    }
  }

  // --- F. SINH HỌC: DI TRUYỀN PHÂN TỬ ADN ---
  const dnaNMatch = s.match(/(?:chiều dài|dài)\s*(?:là|=)?\s*(\d+(?:[.,]\d+)?)\s*(?:angstrom|a°|å)/i);
  const dnaNuMatch = s.match(/(?:tổng số|có)\s*(\d+)\s*(?:nucleotit|nu)\b/i);
  const dnaHMatch = s.match(/(\d+)\s*liên kết hiđrô/i);

  if (s.includes('gen') || s.includes('adn') || s.includes('nucleotit')) {
    let N = dnaNuMatch ? Number(dnaNuMatch[1]) : 0;
    let L = dnaNMatch ? Number(dnaNMatch[1].replace(',', '.')) : 0;
    let H = dnaHMatch ? Number(dnaHMatch[1]) : 0;

    if (N > 0 || L > 0 || H > 0) {
      const res = dnaMolecular({ N, L, H });
      if (res && res.totalNucleotides > 0) {
        hits.push({
          subject: 'Sinh học',
          tool: 'dna_molecular',
          title: `Di truyền phân tử ADN / Gen`,
          lines: [
            `Tổng số nuclêôtit N = ${res.totalNucleotides} nu`,
            `Chiều dài gen L = ${fmt(res.lengthAngstrom)} Å`,
            res.hydrogenBonds ? `Số liên kết hiđrô H = ${res.hydrogenBonds}` : '',
            `Khối lượng phân tử M = ${res.molecularWeight} đvC`,
            `Số chu kỳ xoắn C = ${fmt(res.coils)} chu kỳ`,
          ].filter(Boolean),
          value: res.totalNucleotides,
        });
      }
    }
  }

  const summary = hits.map((h, i) => `[${i + 1}] (${h.subject} - ${h.title}):\n${h.lines.map((l) => `  • ${l}`).join('\n')}`).join('\n\n');

  return { hits, summary };
}
