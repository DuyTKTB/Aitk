import { useState, useEffect, useMemo } from 'react';
import PhysicsInquiryWorkbench from '../features/physics/PhysicsInquiryWorkbench.jsx';
import '../features/physics/physics-lab.css';
import '../styles/science-sim-lab.css';

/* ============================================================
   ScienceSimLab.jsx — PHÒNG THÍ NGHIỆM KHTN TƯƠNG TÁC (100% SVG + MASCOT BÉ ELEC)
   ------------------------------------------------------------
   4 Phân hệ tương tác thời gian thực chuẩn GDPT 2018:
     1. Vật lí 12 — Mạch điện xoay chiều RLC & Giản đồ Vectơ Fresnel
     2. Vật lí 11 — Dao động Con lắc lò xo & Giao thoa ánh sáng Khe Y-âng
     3. Sinh học 12 — Phiên mã, Dịch mã & Mô phỏng Đột biến Điểm ADN
     4. Sinh học 12 — Khung Punnett Menđen & Thống kê Kiểu gen / Kiểu hình
   ============================================================ */

/* ── Bộ Icon SVG Sắc Nét (Không dùng Emoji) ── */
const SvgBolt = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const SvgWave = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 12c2.5-5 5-5 7.5 0s5 5 7.5 0 5-5 5 0" />
    <path d="M2 17c2.5-5 5-5 7.5 0s5 5 7.5 0 5-5 5 0" opacity="0.55" />
  </svg>
);

const SvgDna = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 15c6.667-6 13.333 0 20-6" />
    <path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993" />
    <path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993" />
    <path d="m17 6-2.5-2.5" />
    <path d="m14 8-1-1" />
    <path d="m7 18 2.5 2.5" />
    <path d="m3.5 14.5.5.5" />
    <path d="m20 9 .5.5" />
    <path d="m6.5 12.5 1 1" />
    <path d="m16.5 10.5 1 1" />
    <path d="m10 16 1.5 1.5" />
  </svg>
);

const SvgGrid = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

const SvgPlay = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <polygon points="6 3 20 12 6 21 6 3" />
  </svg>
);

const SvgPause = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </svg>
);

const SvgReset = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

const SvgSparkle = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3l1.9 5.8H20l-4.9 3.6 1.9 5.8-5-3.6-5 3.6 1.9-5.8L4 8.8h6.1z" />
  </svg>
);

const SvgCheckCircle = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const SvgAlert = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const SvgArrowRight = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const CODON_TABLE = {
  UUU: 'Phe', UUC: 'Phe', UUA: 'Leu', UUG: 'Leu',
  UCU: 'Ser', UCC: 'Ser', UCA: 'Ser', UCG: 'Ser',
  UAU: 'Tyr', UAC: 'Tyr', UAA: 'STOP', UAG: 'STOP',
  UGU: 'Cys', UGC: 'Cys', UGA: 'STOP', UGG: 'Trp',
  CUU: 'Leu', CUC: 'Leu', CUA: 'Leu', CUG: 'Leu',
  CCU: 'Pro', CCC: 'Pro', CCA: 'Pro', CCG: 'Pro',
  CAU: 'His', CAC: 'His', CAA: 'Gln', CAG: 'Gln',
  CGU: 'Arg', CGC: 'Arg', CGA: 'Arg', CGG: 'Arg',
  AUU: 'Ile', AUC: 'Ile', AUA: 'Ile', AUG: 'Met (Mở đầu)',
  ACU: 'Thr', ACC: 'Thr', ACA: 'Thr', ACG: 'Thr',
  AAU: 'Asn', AAC: 'Asn', AAA: 'Lys', AAG: 'Lys',
  AGU: 'Ser', AGC: 'Ser', AGA: 'Arg', AGG: 'Arg',
  GUU: 'Val', GUC: 'Val', GUA: 'Val', GUG: 'Val',
  GCU: 'Ala', GCC: 'Ala', GCA: 'Ala', GCG: 'Ala',
  GAU: 'Asp', GAC: 'Asp', GAA: 'Glu', GAG: 'Glu',
  GGU: 'Gly', GGC: 'Gly', GGA: 'Gly', GGG: 'Gly',
};

const COMPLEMENT_DNA = { A: 'T', T: 'A', G: 'C', C: 'G', X: 'G' };
const TRANSCRIBE_MAP = { T: 'A', A: 'U', G: 'C', C: 'G', X: 'G' };

function wavelengthToRgb(nm) {
  let r = 0, g = 0, b = 0;
  if (nm >= 380 && nm < 440) {
    r = -(nm - 440) / (440 - 380);
    b = 1;
  } else if (nm >= 440 && nm < 490) {
    g = (nm - 440) / (490 - 440);
    b = 1;
  } else if (nm >= 490 && nm < 510) {
    g = 1;
    b = -(nm - 510) / (510 - 490);
  } else if (nm >= 510 && nm < 580) {
    r = (nm - 510) / (580 - 510);
    g = 1;
  } else if (nm >= 580 && nm < 645) {
    r = 1;
    g = -(nm - 645) / (645 - 580);
  } else if (nm >= 645 && nm <= 760) {
    r = 1;
  }
  return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
}

function translateMrna(mrnaClean) {
  const codons = [];
  const aminoAcids = [];
  let stopped = false;
  for (let i = 0; i + 2 < mrnaClean.length; i += 3) {
    const c = mrnaClean.slice(i, i + 3);
    codons.push(c);
    if (!stopped) {
      const aa = CODON_TABLE[c] || '?';
      aminoAcids.push(aa);
      if (aa === 'STOP') stopped = true;
    }
  }
  return { codons, aminoAcids };
}

function parseParentGametes(geno) {
  const clean = String(geno || '').replace(/\s+/g, '');
  if (clean.length === 2) {
    const [a1, a2] = [clean[0], clean[1]];
    return Array.from(new Set([a1, a2]));
  }
  if (clean.length === 4) {
    const g1 = [clean[0], clean[1]];
    const g2 = [clean[2], clean[3]];
    const combos = [];
    for (const x of g1) {
      for (const y of g2) {
        combos.push(x + y);
      }
    }
    return Array.from(new Set(combos));
  }
  return ['A', 'a'];
}

function combineGametes(gam1, gam2) {
  if (gam1.length === 1 && gam2.length === 1) {
    return [gam1, gam2].sort().join('');
  }
  if (gam1.length === 2 && gam2.length === 2) {
    const pair1 = [gam1[0], gam2[0]].sort().join('');
    const pair2 = [gam1[1], gam2[1]].sort().join('');
    return pair1 + pair2;
  }
  return gam1 + gam2;
}

export default function ScienceSimLab({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('rlc');

  /* ============ TAB 1: RLC CIRCUIT STATE ============ */
  const [R, setR] = useState(100);
  const [L, setL] = useState(0.318);
  const [C_uF, setCuF] = useState(31.8);
  const [freq, setFreq] = useState(50);
  const [U0, setU0] = useState(220);

  const rlcStats = useMemo(() => {
    const omega = 2 * Math.PI * freq;
    const C = C_uF * 1e-6;
    const ZL = omega * L;
    const ZC = 1 / (omega * C);
    const Z = Math.sqrt(R * R + (ZL - ZC) * (ZL - ZC));
    const I0 = U0 / Z;
    const phi = Math.atan2(ZL - ZC, R);
    const phiDeg = (phi * 180) / Math.PI;
    const cosPhi = Math.cos(phi);
    const Urms = U0 / Math.sqrt(2);
    const Irms = I0 / Math.sqrt(2);
    const P = Urms * Irms * cosPhi;
    const f0 = 1 / (2 * Math.PI * Math.sqrt(L * C));
    const isResonance = Math.abs(ZL - ZC) < 3.0;
    return { omega, ZL, ZC, Z, I0, Urms, Irms, phi, phiDeg, cosPhi, P, f0, isResonance };
  }, [R, L, C_uF, freq, U0]);

  const setResonance = () => {
    const clampedF0 = Math.max(20, Math.min(120, Math.round(rlcStats.f0)));
    setFreq(clampedF0);
  };

  /* ============ TAB 2: SPRING & YOUNG SLIT STATE ============ */
  const [springK, setSpringK] = useState(50);
  const [massM, setMassM] = useState(0.5);
  const [ampA, setAmpA] = useState(8);
  const [simTime, setSimTime] = useState(0);
  const [simRunning, setSimRunning] = useState(true);

  const [lambdaNm, setLambdaNm] = useState(632);
  const [slitA, setSlitA] = useState(1.0);
  const [screenD, setScreenD] = useState(2.0);

  useEffect(() => {
    if (activeTab !== 'wave' || !simRunning) return undefined;
    let raf;
    let start = performance.now();
    const loop = (now) => {
      const dt = (now - start) / 1000;
      start = now;
      setSimTime((t) => t + dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [activeTab, simRunning]);

  const springStats = useMemo(() => {
    const omega = Math.sqrt(springK / massM);
    const T = (2 * Math.PI) / omega;
    const A_m = ampA / 100;
    const x_m = A_m * Math.cos(omega * simTime);
    const v_ms = -A_m * omega * Math.sin(omega * simTime);
    const W = 0.5 * springK * A_m * A_m;
    const Wt = 0.5 * springK * x_m * x_m;
    const Wd = Math.max(0, W - Wt);
    return { omega, T, x_cm: x_m * 100, v_cms: v_ms * 100, W, Wt, Wd };
  }, [springK, massM, ampA, simTime]);

  const youngStats = useMemo(() => {
    const lambdaUm = lambdaNm / 1000;
    const i_mm = (lambdaUm * screenD) / slitA;
    const color = wavelengthToRgb(lambdaNm);
    return { i_mm, color };
  }, [lambdaNm, slitA, screenD]);

  /* ============ TAB 3: DNA TRANSCRIPTION & MUTATION STATE ============ */
  const WILD_DNA = 'TACGGACTTCTCAAAATC';
  const [dnaTemplate, setDnaTemplate] = useState(WILD_DNA);
  const [mutationLog, setMutationLog] = useState('Mạch gốc chuẩn (Chưa đột biến — Chuỗi HbA bình thường)');

  const bioStats = useMemo(() => {
    const clean = dnaTemplate.toUpperCase().replace(/[^ATGCX]/g, '').replace(/X/g, 'C');
    const codingStrand = clean.split('').map((b) => COMPLEMENT_DNA[b] || 'N').join('');
    const mrna = clean.split('').map((b) => TRANSCRIBE_MAP[b] || 'N').join('');

    let countA = 0, countG = 0;
    for (const ch of clean) {
      if (ch === 'A' || ch === 'T') countA++;
      if (ch === 'G' || ch === 'C') countG++;
    }
    const totalNu = clean.length * 2;
    const lengthAngstrom = (totalNu / 2) * 3.4;
    const hBonds = 2 * countA + 3 * countG;

    const wildMrna = WILD_DNA.split('').map((b) => TRANSCRIBE_MAP[b]).join('');
    const wildTrans = translateMrna(wildMrna);
    const curTrans = translateMrna(mrna);

    let mutationType = 'Bình thường (Kiểu dại — Wild Type)';
    let isMutated = false;
    if (clean !== WILD_DNA) {
      isMutated = true;
      if (clean.length !== WILD_DNA.length) {
        mutationType = `Đột biến dịch khung (${clean.length > WILD_DNA.length ? 'Thêm' : 'Mất'} ${Math.abs(clean.length - WILD_DNA.length)} cặp nuclêôtit) — Thay đổi toàn bộ các bộ ba từ vị trí đột biến!`;
      } else {
        const wildAA = wildTrans.aminoAcids.join('-');
        const curAA = curTrans.aminoAcids.join('-');
        if (wildAA === curAA) {
          mutationType = 'Đột biến đồng nghĩa (Tính thoái hóa của mã di truyền — Chuỗi axit amin không đổi)';
        } else if (curTrans.aminoAcids.indexOf('STOP') < wildTrans.aminoAcids.indexOf('STOP')) {
          mutationType = 'Đột biến vô nghĩa (Xuất hiện bộ ba kết thúc sớm — Chuỗi Polypeptide bị ngắn lại)';
        } else {
          mutationType = 'Đột biến sai nghĩa (Thay thế 1 cặp nu làm thay đổi 1 axit amin trong chuỗi Polypeptide)';
        }
      }
    }

    return {
      clean,
      codingStrand,
      mrna,
      totalNu,
      lengthAngstrom,
      hBonds,
      codons: curTrans.codons,
      aminoAcids: curTrans.aminoAcids,
      wildAminoAcids: wildTrans.aminoAcids,
      mutationType,
      isMutated,
    };
  }, [dnaTemplate]);

  const applyPresetMutation = (type) => {
    if (type === 'reset') {
      setDnaTemplate(WILD_DNA);
      setMutationLog('Khôi phục mạch gốc chuẩn 3’ TAC-GGA-CTT-CTC-AAA-ATC 5’');
    } else if (type === 'sickle') {
      setDnaTemplate('TACGGACTTCACAAAATC');
      setMutationLog('Đột biến hồng cầu hình liềm (HbS): Thay thế cặp T-A bằng A-T ở bộ ba thứ 4 (CTC → CAC), làm mARN đổi từ GAG (Glu) → GUG (Val).');
    } else if (type === 'nonsense') {
      setDnaTemplate('TACGGACTTCTCATTATC');
      setMutationLog('Đột biến vô nghĩa: Bộ ba thứ 5 đổi từ AAA → ATT, tạo mã kết thúc sớm UAA trên mARN.');
    } else if (type === 'frameshift') {
      setDnaTemplate('TACGACTTCTCAAAATC');
      setMutationLog('Đột biến dịch khung: Mất 1 cặp G-X ở vị trí nu số 4, làm dịch khung đọc toàn bộ các bộ ba phía sau.');
    }
  };

  /* ============ TAB 4: PUNNETT SQUARE STATE ============ */
  const [parent1, setParent1] = useState('AaBb');
  const [parent2, setParent2] = useState('AaBb');

  const punnettData = useMemo(() => {
    const g1 = parseParentGametes(parent1);
    const g2 = parseParentGametes(parent2);
    const grid = g1.map((rowGam) =>
      g2.map((colGam) => combineGametes(rowGam, colGam))
    );
    const counts = {};
    let total = 0;
    grid.flat().forEach((geno) => {
      counts[geno] = (counts[geno] || 0) + 1;
      total++;
    });

    const phenoCounts = {};
    grid.flat().forEach((geno) => {
      if (geno.length === 2) {
        const domA = /[A-Z]/.test(geno[0]);
        const key = domA ? 'Trội (A-)' : 'Lặn (aa)';
        phenoCounts[key] = (phenoCounts[key] || 0) + 1;
      } else if (geno.length === 4) {
        const domA = /[A-Z]/.test(geno.slice(0, 2));
        const domB = /[A-Z]/.test(geno.slice(2, 4));
        const key = `${domA ? 'A-' : 'aa'}${domB ? 'B-' : 'bb'}`;
        phenoCounts[key] = (phenoCounts[key] || 0) + 1;
      }
    });

    return { g1, g2, grid, counts, phenoCounts, total };
  }, [parent1, parent2]);

  const waveSvgPoints = useMemo(() => {
    const uPts = [];
    const iPts = [];
    const W = 420;
    const H = 180;
    const midY = H / 2;
    for (let x = 0; x <= W; x += 4) {
      const angle = (x / W) * 4 * Math.PI;
      const uVal = Math.cos(angle);
      const iVal = Math.cos(angle - rlcStats.phi);
      const uY = midY - uVal * (U0 / 320) * 72;
      const iScale = Math.min(1, rlcStats.I0 / 3.5);
      const iY = midY - iVal * iScale * 64;
      uPts.push(`${x},${uY.toFixed(1)}`);
      iPts.push(`${x},${iY.toFixed(1)}`);
    }
    return { uPts: uPts.join(' '), iPts: iPts.join(' ') };
  }, [U0, rlcStats]);

  const heroMascotImg = useMemo(() => {
    if (activeTab === 'rlc') return rlcStats.isResonance ? '/img/elec/elec-celebrate.png' : '/img/elec/elec-cool.png';
    if (activeTab === 'wave') return '/img/elec/elec-heart-eyes.png';
    if (activeTab === 'dna') return bioStats.isMutated ? '/img/elec/elec-shocked.png' : '/img/elec/elec-happy.png';
    return '/img/elec/elec-love.png';
  }, [activeTab, rlcStats.isResonance, bioStats.isMutated]);

  const heroMascotSpeech = useMemo(() => {
    if (activeTab === 'rlc') {
      return rlcStats.isResonance
        ? 'Tuyệt vời! Mạch đang đạt Cộng hưởng điện Z_L = Z_C, u và i cùng pha nên công suất đạt cực đại P_max!'
        : 'Hãy thử kéo thanh trượt L, C hoặc bấm nút Cộng hưởng để xem giản đồ vectơ Fresnel thay đổi nhé!';
    }
    if (activeTab === 'wave') {
      return 'Khi tăng bước sóng λ từ tím (380nm) sang đỏ (760nm), bạn sẽ thấy khoảng vân giao thoa i = λD/a giãn rộng ra ngay!';
    }
    if (activeTab === 'dna') {
      return bioStats.isMutated
        ? `Cẩn thận! Đã xảy ra ${bioStats.mutationType.split('(')[0].trim()} trên mạch gốc ADN rồi kìa!`
        : 'Bấm thử các nút tạo đột biến điểm để xem 1 cặp nu thay đổi sẽ biến đổi chuỗi Polypeptide thế nào nhé!';
    }
    return 'Chọn kiểu gen bố mẹ P₁ × P₂ bất kỳ để Elec lập bảng Punnett và tính tỉ lệ kiểu hình giúp bạn ngay!';
  }, [activeTab, rlcStats.isResonance, bioStats.isMutated, bioStats.mutationType]);

  return (
    <div className="simlab-wrap">
      {/* HERO BANNER VỚI MASCOT BÉ ELEC */}
      <header className="simlab-hero">
        <div className="simlab-hero-content">
          <div className="simlab-badge">
            <SvgSparkle size={13} />
            <span>PHÒNG THÍ NGHIỆM KHTN TƯƠNG TÁC · VẬT LÍ &amp; SINH HỌC</span>
          </div>
          <h1 className="simlab-title">
            Mô Phỏng Trực Quan Vật Lí &amp; Sinh Học (GDPT 2018)
          </h1>
          <p className="simlab-sub">
            Thay đổi đại lượng trực tiếp để quan sát dao động ký điện xoay chiều RLC, giản đồ vectơ Fresnel, vân giao thoa Y-âng, đột biến điểm ADN và khung lai Punnett cùng Bé Elec.
          </p>
          <div className="simlab-hero-actions">
            {onNavigate && (
              <>
                <button
                  type="button"
                  className="simlab-btn simlab-btn-primary"
                  onClick={() => onNavigate('physics-lab')}
                >
                  <SvgBolt size={14} />
                  <span>Mở Phòng Lab Vật Lí Ảo (7 Mô phỏng mới)</span>
                  <SvgArrowRight size={14} />
                </button>
                <button
                  type="button"
                  className="simlab-btn"
                  style={{ color: '#e2e8f0', borderColor: 'rgba(148,163,184,0.36)' }}
                  onClick={() => onNavigate('ai')}
                >
                  <SvgSparkle size={14} />
                  <span>Hỏi Gia Sư AI về Thí Nghiệm</span>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="simlab-hero-mascot">
          <img src={heroMascotImg} alt="Bé Elec Nhà Khoa Học" />
          <div className="simlab-mascot-bubble">
            <b>Bé Elec Đồng Hành Thí Nghiệm</b>
            <p>{heroMascotSpeech}</p>
          </div>
        </div>
      </header>

      {/* TABS 100% SVG */}
      <div className="simlab-tabs" role="tablist">
        {[
          { id: 'rlc', label: 'Vật lí 12: Mạch RLC & Giản đồ Fresnel', Icon: SvgBolt },
          { id: 'wave', label: 'Vật lí 11: Con lắc lò xo & Khe Y-âng', Icon: SvgWave },
          { id: 'dna', label: 'Sinh học 12: Phiên mã & Đột biến ADN', Icon: SvgDna },
          { id: 'punnett', label: 'Sinh học 12: Sơ đồ lai Menđen (Punnett)', Icon: SvgGrid },
        ].map((t) => {
          const IconComp = t.Icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`simlab-tab ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              <span className="simlab-tab-ico">
                <IconComp size={18} />
              </span>
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ================= TAB 1: RLC CIRCUIT ================= */}
      {activeTab === 'rlc' && (
        <div className="simlab-grid-2">
          <section className="simlab-card">
            <div className="simlab-card-head">
              <h2 className="simlab-card-title">
                <SvgBolt size={18} />
                <span>Thông số mạch RLC nối tiếp</span>
              </h2>
              <button
                type="button"
                className="simlab-btn simlab-btn-amber"
                onClick={setResonance}
              >
                <SvgBolt size={13} />
                <span>Đưa về Cộng hưởng (f₀ = {rlcStats.f0.toFixed(1)} Hz)</span>
              </button>
            </div>

            <div className="simlab-slider-group">
              <label className="simlab-slider-row">
                <div className="simlab-slider-top">
                  <span>Điện trở thuần R</span>
                  <span>{R} Ω</span>
                </div>
                <input type="range" min="10" max="300" step="5" value={R} onChange={(e) => setR(Number(e.target.value))} />
              </label>

              <label className="simlab-slider-row">
                <div className="simlab-slider-top">
                  <span>Độ tự cảm L (Z_L = {rlcStats.ZL.toFixed(1)} Ω)</span>
                  <span>{L.toFixed(3)} H</span>
                </div>
                <input type="range" min="0.05" max="1.2" step="0.01" value={L} onChange={(e) => setL(Number(e.target.value))} />
              </label>

              <label className="simlab-slider-row">
                <div className="simlab-slider-top">
                  <span>Điện dung C (Z_C = {rlcStats.ZC.toFixed(1)} Ω)</span>
                  <span>{C_uF.toFixed(1)} μF</span>
                </div>
                <input type="range" min="5" max="150" step="0.5" value={C_uF} onChange={(e) => setCuF(Number(e.target.value))} />
              </label>

              <label className="simlab-slider-row">
                <div className="simlab-slider-top">
                  <span>Tần số dòng điện f (ω = {rlcStats.omega.toFixed(0)} rad/s)</span>
                  <span>{freq} Hz</span>
                </div>
                <input type="range" min="20" max="120" step="1" value={freq} onChange={(e) => setFreq(Number(e.target.value))} />
              </label>

              <label className="simlab-slider-row">
                <div className="simlab-slider-top">
                  <span>Điện áp cực đại U₀ (U = {rlcStats.Urms.toFixed(1)} V)</span>
                  <span>{U0} V</span>
                </div>
                <input type="range" min="50" max="310" step="5" value={U0} onChange={(e) => setU0(Number(e.target.value))} />
              </label>
            </div>

            <div className="simlab-metrics">
              <div className="simlab-metric-box">
                <div className="simlab-metric-label">Tổng trở Z</div>
                <div className="simlab-metric-val" style={{ color: '#3b82f6' }}>{rlcStats.Z.toFixed(1)} Ω</div>
              </div>
              <div className="simlab-metric-box">
                <div className="simlab-metric-label">Cường độ cực đại I₀</div>
                <div className="simlab-metric-val" style={{ color: '#10b981' }}>{rlcStats.I0.toFixed(2)} A</div>
              </div>
              <div className="simlab-metric-box">
                <div className="simlab-metric-label">Độ lệch pha φ (u so với i)</div>
                <div className="simlab-metric-val" style={{ color: '#f59e0b', fontSize: 16 }}>
                  {rlcStats.phiDeg.toFixed(1)}° (cosφ = {rlcStats.cosPhi.toFixed(2)})
                </div>
              </div>
              <div className="simlab-metric-box">
                <div className="simlab-metric-label">Công suất tiêu thụ P</div>
                <div className="simlab-metric-val" style={{ color: '#8b5cf6' }}>{rlcStats.P.toFixed(1)} W</div>
              </div>
            </div>

            {rlcStats.isResonance && (
              <div className="simlab-companion-strip" style={{ background: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.35)' }}>
                <img src="/img/elec/elec-celebrate.png" alt="Bé Elec Cộng Hưởng" />
                <p style={{ color: '#10b981', fontWeight: 700 }}>
                  <SvgCheckCircle size={15} /> Đang xảy ra Cộng hưởng điện (Z_L ≈ Z_C): Z_min = R = {R} Ω, cosφ ≈ 1, điện áp u và dòng điện i cùng pha!
                </p>
              </div>
            )}
          </section>

          <section className="simlab-card">
            <div className="simlab-card-head">
              <h2 className="simlab-card-title">
                <SvgWave size={18} />
                <span>Dao động ký u(t), i(t) &amp; Giản đồ Vectơ Fresnel</span>
              </h2>
            </div>

            <svg viewBox="0 0 420 180" style={{ width: '100%', height: 175, background: '#0f172a', borderRadius: 14, marginBottom: 14, border: '1px solid rgba(148,163,184,0.2)' }}>
              <line x1="0" y1="90" x2="420" y2="90" stroke="rgba(148,163,184,0.25)" strokeDasharray="4 4" />
              <polyline fill="none" stroke="#3b82f6" strokeWidth="2.6" points={waveSvgPoints.uPts} />
              <polyline fill="none" stroke="#10b981" strokeWidth="2.6" points={waveSvgPoints.iPts} />
              <text x="12" y="22" fill="#60a5fa" fontSize="12" fontWeight="700">— u(t) Điện áp</text>
              <text x="130" y="22" fill="#34d399" fontSize="12" fontWeight="700">— i(t) Dòng điện</text>
            </svg>

            <svg viewBox="0 0 420 190" style={{ width: '100%', height: 185, background: '#0f172a', borderRadius: 14, border: '1px solid rgba(148,163,184,0.2)' }}>
              <g transform="translate(80, 95)">
                <line x1="0" y1="0" x2="260" y2="0" stroke="rgba(148,163,184,0.3)" strokeDasharray="3 3" />
                <text x="265" y="4" fill="#34d399" fontSize="12" fontWeight="700">I →</text>
                {(() => {
                  const scale = 160 / Math.max(rlcStats.Z, 1);
                  const ur = R * scale;
                  const ul = Math.min(75, rlcStats.ZL * scale);
                  const uc = Math.min(75, rlcStats.ZC * scale);
                  const uNetY = -(rlcStats.ZL - rlcStats.ZC) * scale;
                  const clampedY = Math.max(-80, Math.min(80, uNetY));
                  return (
                    <>
                      <line x1="0" y1="0" x2={ur} y2="0" stroke="#38bdf8" strokeWidth="3" />
                      <line x1="0" y1="0" x2="0" y2={-ul} stroke="#f59e0b" strokeWidth="2.5" />
                      <line x1="0" y1="0" x2="0" y2={uc} stroke="#ec4899" strokeWidth="2.5" />
                      <line x1={ur} y1="0" x2={ur} y2={clampedY} stroke="rgba(255,255,255,0.25)" strokeDasharray="3 3" />
                      <line x1="0" y1="0" x2={ur} y2={clampedY} stroke="#60a5fa" strokeWidth="3.2" />
                      <circle cx={ur} cy={clampedY} r="4.5" fill="#60a5fa" />
                      <text x={ur / 2} y="16" fill="#38bdf8" fontSize="11" fontWeight="700">U_R</text>
                      <text x="6" y={-ul + 10} fill="#f59e0b" fontSize="11" fontWeight="700">U_L</text>
                      <text x="6" y={uc - 4} fill="#ec4899" fontSize="11" fontWeight="700">U_C</text>
                      <text x={ur + 8} y={clampedY} fill="#93c5fd" fontSize="12" fontWeight="800">U (φ = {rlcStats.phiDeg.toFixed(1)}°)</text>
                    </>
                  );
                })()}
              </g>
            </svg>
          </section>
        </div>
      )}

      {/* ================= TAB 2: SPRING & YOUNG SLIT ================= */}
      {activeTab === 'wave' && (
        <div className="simlab-grid-2">
          <section className="simlab-card">
            <div className="simlab-card-head">
              <h2 className="simlab-card-title">
                <SvgWave size={18} />
                <span>1. Con lắc lò xo nằm ngang</span>
              </h2>
              <button
                type="button"
                className={`simlab-btn ${simRunning ? 'simlab-btn-danger' : 'simlab-btn-emerald'}`}
                onClick={() => setSimRunning((v) => !v)}
              >
                {simRunning ? <SvgPause size={12} /> : <SvgPlay size={12} />}
                <span>{simRunning ? 'Tạm dừng' : 'Tiếp tục'}</span>
              </button>
            </div>

            <svg viewBox="0 0 400 110" style={{ width: '100%', height: 112, background: '#0f172a', borderRadius: 14, marginBottom: 14, border: '1px solid rgba(148,163,184,0.2)' }}>
              <rect x="10" y="20" width="10" height="70" fill="#64748b" />
              <line x1="20" y1="85" x2="390" y2="85" stroke="#475569" strokeWidth="2" />
              <line x1="210" y1="20" x2="210" y2="95" stroke="rgba(148,163,184,0.35)" strokeDasharray="3 3" />
              <text x="190" y="104" fill="#94a3b8" fontSize="11">O (VTCB)</text>
              {(() => {
                const massX = 210 + springStats.x_cm * 9;
                return (
                  <>
                    <line x1="20" y1="55" x2={massX - 20} y2="55" stroke="#38bdf8" strokeWidth="4" strokeDasharray="6 4" />
                    <rect x={massX - 20} y="35" width="40" height="40" rx="8" fill="#3b82f6" />
                    <text x={massX - 6} y="59" fill="#fff" fontSize="12" fontWeight="700">m</text>
                  </>
                );
              })()}
            </svg>

            <div className="simlab-slider-group">
              <label className="simlab-slider-row">
                <div className="simlab-slider-top">
                  <span>Độ cứng lò xo k</span><span>{springK} N/m</span>
                </div>
                <input type="range" min="10" max="200" step="5" value={springK} onChange={(e) => setSpringK(Number(e.target.value))} />
              </label>
              <label className="simlab-slider-row">
                <div className="simlab-slider-top">
                  <span>Khối lượng vật m</span><span>{massM} kg</span>
                </div>
                <input type="range" min="0.1" max="2.0" step="0.1" value={massM} onChange={(e) => setMassM(Number(e.target.value))} />
              </label>
              <label className="simlab-slider-row">
                <div className="simlab-slider-top">
                  <span>Biên độ A</span><span>{ampA} cm</span>
                </div>
                <input type="range" min="2" max="12" step="1" value={ampA} onChange={(e) => setAmpA(Number(e.target.value))} />
              </label>
            </div>

            <div className="simlab-metrics">
              <div className="simlab-metric-box">
                <div className="simlab-metric-label">Chu kỳ T &amp; Tần số góc ω</div>
                <div className="simlab-metric-val" style={{ fontSize: 15.5, color: '#3b82f6' }}>
                  T = {springStats.T.toFixed(2)}s · ω = {springStats.omega.toFixed(1)} rad/s
                </div>
              </div>
              <div className="simlab-metric-box">
                <div className="simlab-metric-label">Cơ năng bảo toàn W = ½kA²</div>
                <div className="simlab-metric-val" style={{ fontSize: 15.5, color: '#10b981' }}>
                  W = {springStats.W.toFixed(3)} J
                </div>
              </div>
            </div>
          </section>

          <section className="simlab-card">
            <div className="simlab-card-head">
              <h2 className="simlab-card-title">
                <SvgSparkle size={18} />
                <span>2. Giao thoa ánh sáng Khe Y-âng (i = λD/a)</span>
              </h2>
            </div>

            <div style={{ height: 104, borderRadius: 14, background: '#050811', position: 'relative', overflow: 'hidden', marginBottom: 14, border: '1px solid rgba(255,255,255,0.14)' }}>
              {Array.from({ length: 15 }, (_, idx) => idx - 7).map((k) => {
                const offsetPx = k * youngStats.i_mm * 18;
                return (
                  <div
                    key={k}
                    style={{
                      position: 'absolute',
                      left: `calc(50% + ${offsetPx}px)`,
                      top: 0,
                      bottom: 0,
                      width: Math.max(4, youngStats.i_mm * 7),
                      transform: 'translateX(-50%)',
                      background: youngStats.color,
                      boxShadow: `0 0 14px ${youngStats.color}`,
                      opacity: k === 0 ? 1 : Math.max(0.25, 1 - Math.abs(k) * 0.1),
                    }}
                  />
                );
              })}
            </div>

            <div className="simlab-slider-group">
              <label className="simlab-slider-row">
                <div className="simlab-slider-top">
                  <span>Bước sóng ánh sáng đơn sắc λ</span>
                  <span style={{ color: youngStats.color, fontWeight: 800 }}>{lambdaNm} nm ({(lambdaNm / 1000).toFixed(3)} μm)</span>
                </div>
                <input type="range" min="380" max="760" step="5" value={lambdaNm} onChange={(e) => setLambdaNm(Number(e.target.value))} />
              </label>
              <label className="simlab-slider-row">
                <div className="simlab-slider-top">
                  <span>Khoảng cách hai khe a</span><span>{slitA.toFixed(1)} mm</span>
                </div>
                <input type="range" min="0.5" max="3.0" step="0.1" value={slitA} onChange={(e) => setSlitA(Number(e.target.value))} />
              </label>
              <label className="simlab-slider-row">
                <div className="simlab-slider-top">
                  <span>Khoảng cách từ hai khe tới màn D</span><span>{screenD.toFixed(1)} m</span>
                </div>
                <input type="range" min="0.5" max="3.0" step="0.1" value={screenD} onChange={(e) => setScreenD(Number(e.target.value))} />
              </label>
            </div>

            <div className="simlab-companion-strip">
              <img src="/img/elec/elec-think.png" alt="Bé Elec Quang Học" />
              <p>
                <strong>Khoảng vân: i = {youngStats.i_mm.toFixed(3)} mm</strong> · Vân sáng bậc 3 tại <strong>x = ±{(3 * youngStats.i_mm).toFixed(3)} mm</strong> · Vân tối thứ 3 tại <strong>x = ±{(2.5 * youngStats.i_mm).toFixed(3)} mm</strong>.
              </p>
            </div>
          </section>
        </div>
      )}

      {/* ================= TAB 3: DNA TRANSCRIPTION & MUTATION ================= */}
      {activeTab === 'dna' && (
        <div className="simlab-card">
          <div className="simlab-card-head">
            <h2 className="simlab-card-title">
              <SvgDna size={18} />
              <span>Mô phỏng Phiên mã, Dịch mã &amp; Đột biến Điểm Gen (ADN → mARN → Polypeptide)</span>
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <button type="button" className="simlab-btn" onClick={() => applyPresetMutation('reset')}>
                <SvgReset size={13} />
                <span>Mạch gốc chuẩn</span>
              </button>
              <button type="button" className="simlab-btn simlab-btn-danger" onClick={() => applyPresetMutation('sickle')}>
                <SvgAlert size={13} />
                <span>Đột biến Hồng cầu hình liềm (HbS)</span>
              </button>
              <button type="button" className="simlab-btn simlab-btn-amber" onClick={() => applyPresetMutation('nonsense')}>
                <SvgAlert size={13} />
                <span>Đột biến Vô nghĩa (Kết thúc sớm)</span>
              </button>
              <button type="button" className="simlab-btn simlab-btn-primary" onClick={() => applyPresetMutation('frameshift')}>
                <SvgBolt size={13} />
                <span>Đột biến Dịch khung (Mất 1 cặp nu)</span>
              </button>
            </div>
          </div>

          <label style={{ display: 'block', marginBottom: 14, fontSize: 13.5 }}>
            <span style={{ fontWeight: 700, display: 'block', marginBottom: 6 }}>Nhập hoặc chỉnh sửa trực tiếp Mạch gốc ADN (chiều 3’ → 5’, gồm A, T, G, C/X):</span>
            <input
              type="text"
              value={dnaTemplate}
              onChange={(e) => {
                setDnaTemplate(e.target.value);
                setMutationLog('Bạn vừa tự chỉnh sửa trực tiếp trình tự nuclêôtit trên mạch gốc ADN.');
              }}
              style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '1.5px solid #3b82f6', background: 'rgba(15,23,42,0.04)', color: 'inherit', fontFamily: 'monospace', fontSize: 16, fontWeight: 700, letterSpacing: 2 }}
            />
          </label>

          <div className="simlab-companion-strip" style={{ marginBottom: 16, background: bioStats.isMutated ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.1)', borderColor: bioStats.isMutated ? 'rgba(245,158,11,0.4)' : 'rgba(16,185,129,0.35)' }}>
            <img src={bioStats.isMutated ? '/img/elec/elec-shocked.png' : '/img/elec/elec-happy.png'} alt="Bé Elec Chẩn Đoán Gen" />
            <div>
              <div style={{ fontSize: 13 }}><strong>Nhật ký thí nghiệm:</strong> {mutationLog}</div>
              <div style={{ fontSize: 13.5, marginTop: 3 }}>
                <strong>Chẩn đoán sinh học phân tử:</strong>{' '}
                <span style={{ color: bioStats.isMutated ? '#d97706' : '#059669', fontWeight: 800 }}>{bioStats.mutationType}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 10, fontFamily: 'monospace', fontSize: 15, padding: 18, borderRadius: 14, background: '#0f172a', color: '#f8fafc', overflowX: 'auto' }}>
            <div><span style={{ color: '#94a3b8' }}>Mạch gốc ADN (3’→5’):     </span><strong style={{ color: '#38bdf8', letterSpacing: 2 }}>{bioStats.clean.match(/.{1,3}/g)?.join(' - ')}</strong></div>
            <div><span style={{ color: '#94a3b8' }}>Mạch bổ sung ADN (5’→3’): </span><strong style={{ color: '#a78bfa', letterSpacing: 2 }}>{bioStats.codingStrand.match(/.{1,3}/g)?.join(' - ')}</strong></div>
            <div><span style={{ color: '#94a3b8' }}>Phân tử mARN (5’→3’):     </span><strong style={{ color: '#34d399', letterSpacing: 2 }}>{bioStats.codons.join(' - ')}</strong></div>
            <div>
              <span style={{ color: '#94a3b8' }}>Chuỗi Polypeptide:        </span>
              <strong style={{ color: '#fbbf24' }}>{bioStats.aminoAcids.join(' — ')}</strong>
            </div>
          </div>

          <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <div className="simlab-metric-box">
              <div className="simlab-metric-label">Tổng số nu của đoạn gen</div>
              <div className="simlab-metric-val" style={{ color: '#3b82f6' }}>N = {bioStats.totalNu} nu</div>
            </div>
            <div className="simlab-metric-box">
              <div className="simlab-metric-label">Chiều dài đoạn gen (L = N/2 × 3.4 Å)</div>
              <div className="simlab-metric-val" style={{ color: '#10b981' }}>L = {bioStats.lengthAngstrom.toFixed(1)} Å</div>
            </div>
            <div className="simlab-metric-box">
              <div className="simlab-metric-label">Số liên kết Hiđrô (H = 2A + 3G)</div>
              <div className="simlab-metric-val" style={{ color: '#8b5cf6' }}>H = {bioStats.hBonds} liên kết</div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: PUNNETT SQUARE ================= */}
      {activeTab === 'punnett' && (
        <div className="simlab-card">
          <div className="simlab-card-head">
            <h2 className="simlab-card-title">
              <SvgGrid size={18} />
              <span>Máy Tính Sơ Đồ Lai Menđen &amp; Khung Punnett (1 hoặc 2 cặp gen)</span>
            </h2>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 16 }}>
            <label style={{ fontSize: 13.5, fontWeight: 700 }}>
              Kiểu gen Bố (P₁):{' '}
              <select value={parent1} onChange={(e) => setParent1(e.target.value)} style={{ padding: '8px 12px', borderRadius: 10, fontWeight: 700, border: '1px solid rgba(59,130,246,0.4)' }}>
                {['AA', 'Aa', 'aa', 'AABB', 'AaBB', 'AABb', 'AaBb', 'Aabb', 'aaBb', 'aabb'].map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </label>
            <span style={{ fontWeight: 800, fontSize: 18, color: '#3b82f6' }}>×</span>
            <label style={{ fontSize: 13.5, fontWeight: 700 }}>
              Kiểu gen Mẹ (P₂):{' '}
              <select value={parent2} onChange={(e) => setParent2(e.target.value)} style={{ padding: '8px 12px', borderRadius: 10, fontWeight: 700, border: '1px solid rgba(59,130,246,0.4)' }}>
                {['AA', 'Aa', 'aa', 'AABB', 'AaBB', 'AABb', 'AaBb', 'Aabb', 'aaBb', 'aabb'].map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ overflowX: 'auto', marginBottom: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: 14 }}>
              <thead>
                <tr style={{ background: 'rgba(37,99,235,0.12)' }}>
                  <th style={{ padding: 10, border: '1px solid rgba(148,163,184,0.3)' }}>Giao tử P₁ \ P₂</th>
                  {punnettData.g2.map((colG) => (
                    <th key={colG} style={{ padding: 10, border: '1px solid rgba(148,163,184,0.3)', color: '#3b82f6' }}>{colG}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {punnettData.g1.map((rowG, rIdx) => (
                  <tr key={rowG}>
                    <th style={{ padding: 10, border: '1px solid rgba(148,163,184,0.3)', background: 'rgba(37,99,235,0.08)', color: '#3b82f6' }}>{rowG}</th>
                    {punnettData.grid[rIdx].map((cellGeno, cIdx) => (
                      <td key={`${rowG}-${cIdx}`} style={{ padding: 10, border: '1px solid rgba(148,163,184,0.3)', fontWeight: 700 }}>
                        {cellGeno}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="simlab-grid-2">
            <div className="simlab-metric-box">
              <div style={{ fontWeight: 800, marginBottom: 8, color: '#3b82f6' }}>Tỉ lệ Kiểu gen ở F₁ ({punnettData.total} tổ hợp):</div>
              <div>
                {Object.entries(punnettData.counts).map(([k, v]) => (
                  <span key={k} style={{ display: 'inline-block', marginRight: 8, marginBottom: 6, padding: '4px 10px', borderRadius: 8, background: 'rgba(37,99,235,0.14)', fontWeight: 700, fontSize: 13 }}>
                    {v}/{punnettData.total} {k}
                  </span>
                ))}
              </div>
            </div>
            <div className="simlab-metric-box" style={{ background: 'rgba(16,185,129,0.08)' }}>
              <div style={{ fontWeight: 800, marginBottom: 8, color: '#10b981' }}>Tỉ lệ Kiểu hình ở F₁ (Trội hoàn toàn):</div>
              <div>
                {Object.entries(punnettData.phenoCounts).map(([k, v]) => (
                  <span key={k} style={{ display: 'inline-block', marginRight: 8, marginBottom: 6, padding: '4px 10px', borderRadius: 8, background: 'rgba(16,185,129,0.16)', fontWeight: 700, fontSize: 13 }}>
                    {v}/{punnettData.total} {k} ({((v / punnettData.total) * 100).toFixed(1)}%)
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INQ-ITS TELEMETRY · GIZMOS EXPLORATION · CER RUBRIC STUDIO */}
      <PhysicsInquiryWorkbench simId={activeTab} />
    </div>
  );
}
