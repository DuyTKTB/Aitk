/* ============================================================================
   physicsEngine.js — BỘ GIẢI TOÁN & ĐỘNG LỰC HỌC VẬT LÍ (GDPT 2018 / OLYMPIAD)
   Thuần hàm (pure functions) giúp kiểm thử chính xác 100% qua Vitest:
     1. Chuyển động ném xiên (có & không có lực cản không khí)
     2. Mạch điện DC (nối tiếp, song song, hỗn hợp, định luật Ôm toàn mạch)
     3. Quang hình học (thấu kính mỏng + định luật khúc xạ Snell & PXTP)
     4. Giao thoa sóng cơ 2 nguồn (đếm cực đại, cực tiểu)
     5. Con lắc kép hỗn loạn (tích phân Runge-Kutta bậc 4 — RK4)
     6. Lực đẩy Archimedes & cân bằng vật trong chất lỏng
     7. Hồi quy tuyến tính OLS (phân tích số liệu thí nghiệm Olympiad)
   ============================================================================ */

export const GRAVITY_PRESETS = [
  { id: 'earth', name: 'Trái Đất', g: 9.81 },
  { id: 'moon', name: 'Mặt Trăng', g: 1.62 },
  { id: 'mars', name: 'Sao Hỏa', g: 3.71 },
  { id: 'jupiter', name: 'Sao Mộc', g: 24.79 },
];

export const OPTICAL_MEDIA = [
  { id: 'air', name: 'Không khí', n: 1.0 },
  { id: 'water', name: 'Nước', n: 1.333 },
  { id: 'glass', name: 'Thủy tinh', n: 1.5 },
  { id: 'diamond', name: 'Kim cương', n: 2.417 },
];

export const PHYSICS_OPEN_REPOS = [
  {
    stt: 1,
    simId: 'projectile',
    title: 'Mô phỏng chuyển động ném xiên',
    repoName: 'Projectile Motion Simulator',
    url: 'https://github.com/Jamwilltim/Projectile-Motion-Simulator',
    grade: 'Lớp 10',
  },
  {
    stt: 2,
    simId: 'circuit',
    title: 'Mô phỏng lắp ráp và tính toán mạch điện',
    repoName: 'OpenCircuit',
    url: 'https://github.com/opencircuitlabs/circuit-simulator',
    grade: 'Lớp 9 · 11',
  },
  {
    stt: 3,
    simId: 'optics',
    title: 'Mô phỏng phản xạ, khúc xạ và thấu kính',
    repoName: 'Ray Optics Simulation',
    url: 'https://github.com/ricktu288/ray-optics',
    grade: 'Lớp 9 · 11',
  },
  {
    stt: 4,
    simId: 'wave',
    title: 'Mô phỏng sóng và giao thoa',
    repoName: 'Wave Simulator',
    url: 'https://github.com/DavidDonelan/waves',
    grade: 'Lớp 11',
  },
  {
    stt: 5,
    simId: 'mechanics',
    title: 'Mô phỏng cơ học 2D & va chạm',
    repoName: 'Physics Playground',
    url: 'https://github.com/dnoice/physics-playground',
    grade: 'Lớp 10',
  },
  {
    stt: 6,
    simId: 'pendulum',
    title: 'Mô phỏng con lắc kép (Hỗn loạn RK4)',
    repoName: 'Double Pendulum',
    url: 'https://github.com/re0i/double-pendulum',
    grade: 'Lớp 11 · Nâng cao',
  },
  {
    stt: 7,
    simId: 'olympiad',
    title: 'Phòng thí nghiệm Vật lí lớp 8–12',
    repoName: 'Virtual Physics Lab',
    url: 'https://github.com/jaanvishelar/virtual-physics-lab',
    grade: 'Lớp 8–12',
  },
  {
    stt: 8,
    simId: 'mechanics',
    title: 'Mô phỏng khái niệm Vật lí tổng hợp',
    repoName: 'Physics Engine Simulator',
    url: 'https://github.com/hartejnayar/physics-engine-simulator',
    grade: 'Lớp 10–12',
  },
  {
    stt: 9,
    simId: 'wave',
    title: 'Thư viện mô phỏng Vật lí trực quan',
    repoName: 'BN Lab Simulations',
    url: 'https://github.com/4mser/bn-lab-simulations',
    grade: 'Lớp 8–12',
  },
  {
    stt: 10,
    simId: 'olympiad',
    title: 'Thí nghiệm Vật lí ảo & phân tích số liệu',
    repoName: 'Physics Olympiad Experiments',
    url: 'https://github.com/danialht/Physics-Olympiad-Experiments',
    grade: 'HSG · Olympiad',
  },
];

/* ============================================================================
   1. CHUYỂN ĐỘNG NÉM XIÊN (PROJECTILE MOTION)
   ============================================================================ */
export function calcProjectile({ v0 = 25, angleDeg = 45, h0 = 0, g = 9.81, drag = 0 }) {
  const rad = (angleDeg * Math.PI) / 180;
  const vx0 = v0 * Math.cos(rad);
  const vy0 = v0 * Math.sin(rad);

  if (drag <= 1e-6) {
    // Nghiệm giải tích chính xác tuyệt đối khi không có lực cản
    const disc = Math.max(0, vy0 * vy0 + 2 * g * h0);
    const flightTime = (vy0 + Math.sqrt(disc)) / g;
    const range = vx0 * flightTime;
    const tApex = Math.max(0, vy0 / g);
    const maxHeight = h0 + (vy0 > 0 ? (vy0 * vy0) / (2 * g) : 0);
    const vyEnd = vy0 - g * flightTime;
    const impactSpeed = Math.hypot(vx0, vyEnd);

    const points = [];
    const steps = 140;
    for (let i = 0; i <= steps; i++) {
      const t = (flightTime * i) / steps;
      const x = vx0 * t;
      const y = Math.max(0, h0 + vy0 * t - 0.5 * g * t * t);
      points.push({ t, x, y, vx: vx0, vy: vy0 - g * t });
    }
    return { flightTime, range, maxHeight, tApex, impactSpeed, points };
  }

  // Tích phân RK2 khi có lực cản tỉ lệ v²: a_drag = -k * |v| * v
  const dt = 0.01;
  let t = 0;
  let x = 0;
  let y = h0;
  let vx = vx0;
  let vy = vy0;
  let maxHeight = h0;
  let tApex = 0;
  const points = [{ t: 0, x: 0, y: h0, vx, vy }];

  for (let step = 0; step < 6000; step++) {
    const speed = Math.hypot(vx, vy);
    const ax1 = -drag * speed * vx;
    const ay1 = -g - drag * speed * vy;

    const vxMid = vx + 0.5 * ax1 * dt;
    const vyMid = vy + 0.5 * ay1 * dt;
    const sMid = Math.hypot(vxMid, vyMid);
    const ax2 = -drag * sMid * vxMid;
    const ay2 = -g - drag * sMid * vyMid;

    const nextX = x + vxMid * dt;
    const nextY = y + vyMid * dt;
    const nextVx = vx + ax2 * dt;
    const nextVy = vy + ay2 * dt;
    const nextT = t + dt;

    if (nextY > maxHeight) {
      maxHeight = nextY;
      tApex = nextT;
    }

    if (nextY <= 0 && step > 0) {
      // Nội suy chính xác điểm chạm đất y = 0
      const frac = y / Math.max(1e-9, y - nextY);
      const tHit = t + frac * dt;
      const xHit = x + frac * (nextX - x);
      const vxHit = vx + frac * (nextVx - vx);
      const vyHit = vy + frac * (nextVy - vy);
      points.push({ t: tHit, x: xHit, y: 0, vx: vxHit, vy: vyHit });
      return {
        flightTime: tHit,
        range: xHit,
        maxHeight,
        tApex,
        impactSpeed: Math.hypot(vxHit, vyHit),
        points,
      };
    }

    x = nextX;
    y = nextY;
    vx = nextVx;
    vy = nextVy;
    t = nextT;
    if (step % 2 === 0) points.push({ t, x, y, vx, vy });
  }

  return {
    flightTime: t,
    range: x,
    maxHeight,
    tApex,
    impactSpeed: Math.hypot(vx, vy),
    points,
  };
}

/* ============================================================================
   2. MẠCH ĐIỆN MỘT CHIỀU DC (OPENCIRCUIT / ĐỊNH LUẬT ÔM TOÀN MẠCH)
   ============================================================================ */
export function solveDcCircuit({ topology = 'mixed', E = 12, r = 1, R1 = 4, R2 = 6, R3 = 12, closed = true }) {
  const safeR1 = Math.max(0.1, R1);
  const safeR2 = Math.max(0.1, R2);
  const safeR3 = Math.max(0.1, R3);
  const safeR = Math.max(0, r);

  let Req = 0;
  if (topology === 'series') {
    Req = safeR1 + safeR2 + safeR3;
  } else if (topology === 'parallel') {
    Req = 1 / (1 / safeR1 + 1 / safeR2 + 1 / safeR3);
  } else {
    // mixed: R1 nối tiếp (R2 // R3)
    const R23 = (safeR2 * safeR3) / (safeR2 + safeR3);
    Req = safeR1 + R23;
  }

  if (!closed) {
    return {
      Req,
      Itotal: 0,
      Uext: E,
      Pext: 0,
      Psource: 0,
      efficiency: 0,
      branches: [
        { id: 'R1', R: safeR1, I: 0, U: 0, P: 0 },
        { id: 'R2', R: safeR2, I: 0, U: 0, P: 0 },
        { id: 'R3', R: safeR3, I: 0, U: 0, P: 0 },
      ],
    };
  }

  const Itotal = E / (Req + safeR);
  const Uext = Itotal * Req;

  let I1 = 0, I2 = 0, I3 = 0;
  let U1 = 0, U2 = 0, U3 = 0;

  if (topology === 'series') {
    I1 = I2 = I3 = Itotal;
    U1 = I1 * safeR1;
    U2 = I2 * safeR2;
    U3 = I3 * safeR3;
  } else if (topology === 'parallel') {
    U1 = U2 = U3 = Uext;
    I1 = U1 / safeR1;
    I2 = U2 / safeR2;
    I3 = U3 / safeR3;
  } else {
    I1 = Itotal;
    U1 = I1 * safeR1;
    const U23 = Uext - U1;
    U2 = U23;
    U3 = U23;
    I2 = U23 / safeR2;
    I3 = U23 / safeR3;
  }

  const P1 = U1 * I1;
  const P2 = U2 * I2;
  const P3 = U3 * I3;
  const Pext = P1 + P2 + P3;
  const Psource = E * Itotal;
  const efficiency = Psource > 1e-9 ? (Pext / Psource) * 100 : 0;

  return {
    Req,
    Itotal,
    Uext,
    Pext,
    Psource,
    efficiency,
    branches: [
      { id: 'R1', R: safeR1, I: I1, U: U1, P: P1 },
      { id: 'R2', R: safeR2, I: I2, U: U2, P: P2 },
      { id: 'R3', R: safeR3, I: I3, U: U3, P: P3 },
    ],
  };
}

/* ============================================================================
   3. QUANG HÌNH HỌC: THẤU KÍNH MỎNG & KHÚC XẠ SNELL
   ============================================================================ */
export function solveThinLens({ f = 15, d = 30, h = 4 }) {
  if (Math.abs(f) < 0.01) {
    return { dPrime: Infinity, k: Infinity, hPrime: Infinity, isAtFocus: true, nature: 'Tiêu cự không hợp lệ' };
  }
  const denom = d - f;
  if (Math.abs(denom) < 1e-4) {
    return {
      dPrime: Infinity,
      k: Infinity,
      hPrime: Infinity,
      isAtFocus: true,
      isVirtual: false,
      nature: 'Vật đặt tại tiêu điểm F → Ảnh ở vô cực (chùm tia ló song song)',
    };
  }
  const dPrime = (d * f) / denom;
  const k = -dPrime / d;
  const hPrime = k * h;
  const isVirtual = dPrime < 0;
  const sizeLabel =
    Math.abs(Math.abs(k) - 1) < 0.03
      ? 'bằng vật'
      : Math.abs(k) > 1
        ? 'lớn hơn vật'
        : 'nhỏ hơn vật';
  const nature = `${isVirtual ? 'Ảnh ảo' : 'Ảnh thật'}, ${k < 0 ? 'ngược chiều' : 'cùng chiều'}, ${sizeLabel}`;

  return { dPrime, k, hPrime, isAtFocus: false, isVirtual, nature };
}

export function solveSnell({ n1 = 1.5, n2 = 1.0, iDeg = 35 }) {
  const iRad = (iDeg * Math.PI) / 180;
  const sinR = (n1 / n2) * Math.sin(iRad);
  const hasCritical = n1 > n2;
  const criticalDeg = hasCritical ? (Math.asin(n2 / n1) * 180) / Math.PI : null;

  if (sinR >= 1 - 1e-9) {
    return {
      iDeg,
      rDeg: null,
      reflectedDeg: iDeg,
      isTIR: true,
      criticalDeg,
      deviationDeg: 180 - 2 * iDeg,
    };
  }

  const rRad = Math.asin(Math.max(-1, Math.min(1, sinR)));
  const rDeg = (rRad * 180) / Math.PI;
  return {
    iDeg,
    rDeg,
    reflectedDeg: iDeg,
    isTIR: false,
    criticalDeg,
    deviationDeg: Math.abs(iDeg - rDeg),
  };
}

/* ============================================================================
   4. GIAO THOA SÓNG CƠ 2 NGUỒN
   ============================================================================ */
export function calcWaveInterference({ lam = 2.0, dist = 10.0, samePhase = true }) {
  if (lam <= 0 || dist <= 0) return { maxima: 0, minima: 0 };
  const ratio = dist / lam;
  if (samePhase) {
    // Cực đại: -S1S2/lam < k < S1S2/lam (không tính trùng đúng nguồn)
    const kMax = Math.floor(ratio - 1e-9);
    const maxima = 2 * kMax + 1;
    // Cực tiểu: -S1S2/lam < k + 0.5 < S1S2/lam
    const kMinRight = Math.floor(ratio - 0.5 - 1e-9);
    const minima = Math.max(0, 2 * (kMinRight + 1));
    return { maxima, minima };
  }
  // Ngược pha: cực đại và cực tiểu đổi vai trò
  const kMaxRight = Math.floor(ratio - 0.5 - 1e-9);
  const maxima = Math.max(0, 2 * (kMaxRight + 1));
  const kMin = Math.floor(ratio - 1e-9);
  const minima = 2 * kMin + 1;
  return { maxima, minima };
}

/* ============================================================================
   5. CON LẮC KÉP — TÍCH PHÂN LAGRANGE RK4 (DOUBLE PENDULUM)
   ============================================================================ */
function doublePendulumDerivs([th1, w1, th2, w2], { m1, m2, L1, L2, g }) {
  const delta = th1 - th2;
  const sinD = Math.sin(delta);
  const cosD = Math.cos(delta);
  const denom = 2 * m1 + m2 - m2 * Math.cos(2 * delta);

  const a1 =
    (-g * (2 * m1 + m2) * Math.sin(th1) -
      m2 * g * Math.sin(th1 - 2 * th2) -
      2 * sinD * m2 * (w2 * w2 * L2 + w1 * w1 * L1 * cosD)) /
    (L1 * denom);

  const a2 =
    (2 *
      sinD *
      (w1 * w1 * L1 * (m1 + m2) +
        g * (m1 + m2) * Math.cos(th1) +
        w2 * w2 * L2 * m2 * cosD)) /
    (L2 * denom);

  return [w1, a1, w2, a2];
}

export function stepDoublePendulum(state, params, dt) {
  const k1 = doublePendulumDerivs(state, params);
  const s2 = state.map((v, i) => v + 0.5 * dt * k1[i]);
  const k2 = doublePendulumDerivs(s2, params);
  const s3 = state.map((v, i) => v + 0.5 * dt * k2[i]);
  const k3 = doublePendulumDerivs(s3, params);
  const s4 = state.map((v, i) => v + dt * k3[i]);
  const k4 = doublePendulumDerivs(s4, params);

  return state.map((v, i) => v + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
}

export function calcDoublePendulumEnergy([th1, w1, th2, w2], { m1, m2, L1, L2, g }) {
  const y1 = -L1 * Math.cos(th1);
  const y2 = y1 - L2 * Math.cos(th2);
  const v1Sq = (L1 * w1) ** 2;
  const v2Sq = v1Sq + (L2 * w2) ** 2 + 2 * L1 * L2 * w1 * w2 * Math.cos(th1 - th2);

  const kinetic = 0.5 * m1 * v1Sq + 0.5 * m2 * v2Sq;
  // Chọn mốc thế năng tại vị trí thấp nhất y_min = -(L1 + L2)
  const potential = m1 * g * (y1 + L1 + L2) + m2 * g * (y2 + L1 + L2);
  return { kinetic, potential, total: kinetic + potential };
}

/* ============================================================================
   6. LỰC ĐẨY ARCHIMEDES (LỚP 8–10)
   ============================================================================ */
export function calcArchimedes({ objDensity = 7800, fluidDensity = 1000, volumeCm3 = 200, g = 9.81 }) {
  const volM3 = volumeCm3 * 1e-6;
  const massKg = objDensity * volM3;
  const weightN = massKg * g;
  const floats = objDensity <= fluidDensity;
  const submergedFraction = floats ? objDensity / fluidDensity : 1;
  const submergedVolM3 = volM3 * submergedFraction;
  const buoyantForceN = fluidDensity * g * submergedVolM3;
  const apparentWeightN = Math.max(0, weightN - buoyantForceN);

  return {
    massKg,
    weightN,
    floats,
    submergedFraction,
    buoyantForceN,
    apparentWeightN,
    stateLabel:
      objDensity < fluidDensity
        ? `Nổi (${(submergedFraction * 100).toFixed(1)}% chìm trong chất lỏng)`
        : Math.abs(objDensity - fluidDensity) < 1
          ? 'Lơ lửng trong chất lỏng'
          : 'Chìm xuống đáy (P > F_A)',
  };
}

/* ============================================================================
   7. HỒI QUY TUYẾN TÍNH OLS — PHÂN TÍCH SỐ LIỆU OLYMPIAD
   ============================================================================ */
export function calcLinearRegression(points) {
  if (!Array.isArray(points) || points.length < 2) {
    return null;
  }
  const n = points.length;
  let sx = 0, sy = 0, sxx = 0, sxy = 0, syy = 0;
  for (const p of points) {
    sx += p.x;
    sy += p.y;
    sxx += p.x * p.x;
    sxy += p.x * p.y;
    syy += p.y * p.y;
  }
  const denom = n * sxx - sx * sx;
  if (Math.abs(denom) < 1e-12) return null;

  const slope = (n * sxy - sx * sy) / denom;
  const intercept = (sy - slope * sx) / n;

  const meanY = sy / n;
  let ssTot = 0;
  let ssRes = 0;
  for (const p of points) {
    const yHat = slope * p.x + intercept;
    ssTot += (p.y - meanY) ** 2;
    ssRes += (p.y - yHat) ** 2;
  }
  const r2 = ssTot > 1e-12 ? Math.max(0, 1 - ssRes / ssTot) : 1;
  const meanX = sx / n;
  const sxxCentered = points.reduce((acc, p) => acc + (p.x - meanX) ** 2, 0);
  const seSlope =
    n > 2 && sxxCentered > 1e-12 ? Math.sqrt(ssRes / (n - 2) / sxxCentered) : 0;

  return { slope, intercept, r2, seSlope, n };
}
