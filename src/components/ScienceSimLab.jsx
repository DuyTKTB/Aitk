import { useState, useEffect, useRef, useMemo } from 'react';

/* ============================================================
   ScienceSimLab.jsx — PHÒNG THÍ NGHIỆM MÔ PHỎNG VẬT LÍ & SINH HỌC TƯƠNG TÁC
   ------------------------------------------------------------
   4 Phân hệ tương tác thời gian thực chuẩn GDPT 2018:
     1. Vật lí 12 — Mạch điện xoay chiều RLC & Giản đồ Vectơ Fresnel
     2. Vật lí 11 — Dao động Con lắc lò xo & Giao thoa ánh sáng Khe Y-âng
     3. Sinh học 12 — Phiên mã, Dịch mã & Mô phỏng Đột biến Điểm ADN
     4. Sinh học 12 — Khung Punnett Menđen & Thống kê Kiểu gen / Kiểu hình
   ============================================================ */

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
    const phi = Math.atan2(ZL - ZC, R); // rad (u so với i)
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
  const [ampA, setAmpA] = useState(8); // cm
  const [simTime, setSimTime] = useState(0);
  const [simRunning, setSimRunning] = useState(true);

  const [lambdaNm, setLambdaNm] = useState(632); // nm (Laser He-Ne đỏ)
  const [slitA, setSlitA] = useState(1.0); // mm
  const [screenD, setScreenD] = useState(2.0); // m

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
    // i (mm) = lambda (um) * D (m) / a (mm)
    const lambdaUm = lambdaNm / 1000;
    const i_mm = (lambdaUm * screenD) / slitA;
    const color = wavelengthToRgb(lambdaNm);
    return { i_mm, color };
  }, [lambdaNm, slitA, screenD]);

  /* ============ TAB 3: DNA TRANSCRIPTION & MUTATION STATE ============ */
  const WILD_DNA = 'TACGGACTTCTCAAAATC'; // 3' -> 5' (6 bộ ba: AUG CCU GAA GAG UUU UAG -> Met-Pro-Glu-Glu-Phe-STOP)
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

    let mutationType = 'Bình thường (Kiểu dại - Wild Type)';
    if (clean !== WILD_DNA) {
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
    };
  }, [dnaTemplate]);

  const applyPresetMutation = (type) => {
    if (type === 'reset') {
      setDnaTemplate(WILD_DNA);
      setMutationLog('Khôi phục mạch gốc chuẩn 3’ TAC-GGA-CTT-CTC-AAA-ATC 5’');
    } else if (type === 'sickle') {
      // Đổi CTC (mARN GAG = Glu) thành CAC (mARN GUG = Val) — Hồng cầu hình liềm
      setDnaTemplate('TACGGACTTCACAAAATC');
      setMutationLog('Đột biến hồng cầu hình liềm (HbS): Thay thế cặp T-A bằng A-T ở bộ ba thứ 4 (CTC → CAC), làm mARN đổi từ GAG (Glu) → GUG (Val).');
    } else if (type === 'nonsense') {
      // Đổi AAA (mARN UUU = Phe) thành ATT (mARN UAA = STOP)
      setDnaTemplate('TACGGACTTCTCATTATC');
      setMutationLog('Đột biến vô nghĩa: Bộ ba thứ 5 đổi từ AAA → ATT, tạo mã kết thúc sớm UAA trên mARN.');
    } else if (type === 'frameshift') {
      // Mất 1 nu G ở vị trí số 4
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

    // Thống kê kiểu hình trội/lặn hoàn toàn
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

  /* ============ RENDER WAVEFORMS FOR RLC ============ */
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

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto', padding: '20px 16px 64px' }}>
      <header style={{ marginBottom: 22, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 999, background: 'rgba(37,99,235,0.12)', color: '#3b82f6', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
            PHÒNG THÍ NGHIỆM KHTN TƯƠNG TÁC · VẬT LÍ &amp; SINH HỌC
          </span>
          <h1 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 800, margin: 0 }}>
            Mô Phỏng Trực Quan Vật Lí &amp; Sinh Học (GDPT 2018)
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #64748b)', fontSize: 14 }}>
            Thay đổi đại lượng trực tiếp để quan sát đồ thị dao động, giản đồ vectơ Fresnel, vân giao thoa Y-âng, đột biến điểm ADN và khung lai Punnett.
          </p>
        </div>
        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('ai')}
            style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid rgba(59,130,246,0.35)', background: 'rgba(37,99,235,0.1)', color: '#3b82f6', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
          >
            Hỏi Gia Sư AI về Thí Nghiệm →
          </button>
        )}
      </header>

      {/* TABS */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {[
          { id: 'rlc', label: '⚡ Vật lí 12: Mạch RLC & Giản đồ Fresnel' },
          { id: 'wave', label: '🌊 Vật lí 11: Con lắc lò xo & Khe Y-âng' },
          { id: 'dna', label: '🧬 Sinh học 12: Phiên mã, Dịch mã & Đột biến ADN' },
          { id: 'punnett', label: '🌱 Sinh học 12: Sơ đồ lai Menđen (Punnett)' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '10px 16px',
              borderRadius: 12,
              border: activeTab === t.id ? '1.5px solid #2563eb' : '1px solid rgba(148,163,184,0.28)',
              background: activeTab === t.id ? '#2563eb' : 'var(--card-bg, rgba(15,23,42,0.04))',
              color: activeTab === t.id ? '#fff' : 'inherit',
              fontWeight: 700,
              fontSize: 13.5,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ================= TAB 1: RLC CIRCUIT ================= */}
      {activeTab === 'rlc' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          <section style={{ padding: 20, borderRadius: 16, border: '1px solid rgba(148,163,184,0.25)', background: 'var(--card-bg, rgba(255,255,255,0.02))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Thông số mạch RLC nối tiếp</h2>
              <button
                type="button"
                onClick={setResonance}
                style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: '#f59e0b', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
              >
                ⚡ Đưa về Cộng hưởng (f₀ = {rlcStats.f0.toFixed(1)} Hz)
              </button>
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              <label style={{ fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                  <span>Điện trở thuần R</span>
                  <span>{R} Ω</span>
                </div>
                <input type="range" min="10" max="300" step="5" value={R} onChange={(e) => setR(Number(e.target.value))} style={{ width: '100%' }} />
              </label>

              <label style={{ fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                  <span>Độ tự cảm L (Z_L = {rlcStats.ZL.toFixed(1)} Ω)</span>
                  <span>{L.toFixed(3)} H</span>
                </div>
                <input type="range" min="0.05" max="1.2" step="0.01" value={L} onChange={(e) => setL(Number(e.target.value))} style={{ width: '100%' }} />
              </label>

              <label style={{ fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                  <span>Điện dung C (Z_C = {rlcStats.ZC.toFixed(1)} Ω)</span>
                  <span>{C_uF.toFixed(1)} μF</span>
                </div>
                <input type="range" min="5" max="150" step="0.5" value={C_uF} onChange={(e) => setCuF(Number(e.target.value))} style={{ width: '100%' }} />
              </label>

              <label style={{ fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                  <span>Tần số dòng điện f (ω = {rlcStats.omega.toFixed(0)} rad/s)</span>
                  <span>{freq} Hz</span>
                </div>
                <input type="range" min="20" max="120" step="1" value={freq} onChange={(e) => setFreq(Number(e.target.value))} style={{ width: '100%' }} />
              </label>

              <label style={{ fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                  <span>Điện áp cực đại U₀ (U = {rlcStats.Urms.toFixed(1)} V)</span>
                  <span>{U0} V</span>
                </div>
                <input type="range" min="50" max="310" step="5" value={U0} onChange={(e) => setU0(Number(e.target.value))} style={{ width: '100%' }} />
              </label>
            </div>

            {/* KẾT QUẢ ĐO */}
            <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              <div style={{ padding: 10, borderRadius: 10, background: 'rgba(37,99,235,0.08)' }}>
                <div style={{ fontSize: 11, opacity: 0.75 }}>Tổng trở Z</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#2563eb' }}>{rlcStats.Z.toFixed(1)} Ω</div>
              </div>
              <div style={{ padding: 10, borderRadius: 10, background: 'rgba(16,185,129,0.08)' }}>
                <div style={{ fontSize: 11, opacity: 0.75 }}>Cường độ cực đại I₀</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#10b981' }}>{rlcStats.I0.toFixed(2)} A</div>
              </div>
              <div style={{ padding: 10, borderRadius: 10, background: 'rgba(245,158,11,0.08)' }}>
                <div style={{ fontSize: 11, opacity: 0.75 }}>Độ lệch pha φ (u so với i)</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#d97706' }}>{rlcStats.phiDeg.toFixed(1)}° (cosφ = {rlcStats.cosPhi.toFixed(2)})</div>
              </div>
              <div style={{ padding: 10, borderRadius: 10, background: 'rgba(139,92,246,0.08)' }}>
                <div style={{ fontSize: 11, opacity: 0.75 }}>Công suất tiêu thụ P</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#8b5cf6' }}>{rlcStats.P.toFixed(1)} W</div>
              </div>
            </div>

            {rlcStats.isResonance && (
              <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 10, background: 'rgba(16,185,129,0.14)', color: '#059669', fontWeight: 700, fontSize: 13 }}>
                ✅ ĐANG XẢY RA CỘNG HƯỞNG ĐIỆN (Z_L ≈ Z_C): Z_min = R = {R} Ω, cosφ ≈ 1, u và i cùng pha, công suất đạt cực đại!
              </div>
            )}
          </section>

          <section style={{ padding: 20, borderRadius: 16, border: '1px solid rgba(148,163,184,0.25)', background: 'var(--card-bg, rgba(255,255,255,0.02))' }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 12px' }}>Dao động ký u(t), i(t) &amp; Giản đồ Vectơ Fresnel</h2>
            <svg viewBox="0 0 420 180" style={{ width: '100%', height: 170, background: '#0f172a', borderRadius: 12, marginBottom: 14 }}>
              <line x1="0" y1="90" x2="420" y2="90" stroke="rgba(148,163,184,0.25)" strokeDasharray="4 4" />
              <polyline fill="none" stroke="#3b82f6" strokeWidth="2.5" points={waveSvgPoints.uPts} />
              <polyline fill="none" stroke="#10b981" strokeWidth="2.5" points={waveSvgPoints.iPts} />
              <text x="12" y="22" fill="#60a5fa" fontSize="12" fontWeight="700">— u(t) Điện áp</text>
              <text x="130" y="22" fill="#34d399" fontSize="12" fontWeight="700">— i(t) Dòng điện</text>
            </svg>

            {/* GIẢN ĐỒ FRESNEL */}
            <svg viewBox="0 0 420 190" style={{ width: '100%', height: 185, background: '#0f172a', borderRadius: 12 }}>
              <g transform="translate(80, 95)">
                {/* Trục I chuẩn nằm ngang */}
                <line x1="0" y1="0" x2="260" y2="0" stroke="rgba(148,163,184,0.3)" strokeDasharray="3 3" />
                <text x="265" y="4" fill="#34d399" fontSize="12" fontWeight="700">I →</text>
                {/* U_R */}
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
                      <circle cx={ur} cy={clampedY} r="4" fill="#60a5fa" />
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          <section style={{ padding: 20, borderRadius: 16, border: '1px solid rgba(148,163,184,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>1. Con lắc lò xo nằm ngang</h2>
              <button
                type="button"
                onClick={() => setSimRunning((v) => !v)}
                style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: simRunning ? '#ef4444' : '#10b981', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
              >
                {simRunning ? '⏸ Tạm dừng' : '▶ Tiếp tục'}
              </button>
            </div>

            <svg viewBox="0 0 400 110" style={{ width: '100%', height: 110, background: '#0f172a', borderRadius: 12, marginBottom: 12 }}>
              <rect x="10" y="20" width="10" height="70" fill="#64748b" />
              <line x1="20" y1="85" x2="390" y2="85" stroke="#475569" strokeWidth="2" />
              <line x1="210" y1="20" x2="210" y2="95" stroke="rgba(148,163,184,0.35)" strokeDasharray="3 3" />
              <text x="206" y="105" fill="#94a3b8" fontSize="11">O (VTCB)</text>
              {(() => {
                const massX = 210 + springStats.x_cm * 9;
                return (
                  <>
                    <line x1="20" y1="55" x2={massX - 20} y2="55" stroke="#38bdf8" strokeWidth="4" strokeDasharray="6 4" />
                    <rect x={massX - 20} y="35" width="40" height="40" rx="8" fill="#3b82f6" />
                    <text x={massX - 10} y="59" fill="#fff" fontSize="12" fontWeight="700">m</text>
                  </>
                );
              })()}
            </svg>

            <div style={{ display: 'grid', gap: 10, fontSize: 13 }}>
              <label>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                  <span>Độ cứng lò xo k</span><span>{springK} N/m</span>
                </div>
                <input type="range" min="10" max="200" step="5" value={springK} onChange={(e) => setSpringK(Number(e.target.value))} style={{ width: '100%' }} />
              </label>
              <label>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                  <span>Khối lượng vật m</span><span>{massM} kg</span>
                </div>
                <input type="range" min="0.1" max="2.0" step="0.1" value={massM} onChange={(e) => setMassM(Number(e.target.value))} style={{ width: '100%' }} />
              </label>
              <label>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                  <span>Biên độ A</span><span>{ampA} cm</span>
                </div>
                <input type="range" min="2" max="12" step="1" value={ampA} onChange={(e) => setAmpA(Number(e.target.value))} style={{ width: '100%' }} />
              </label>
            </div>

            <div style={{ marginTop: 12, fontSize: 13, display: 'grid', gap: 6 }}>
              <div>• Chu kỳ <strong>T = {springStats.T.toFixed(2)} s</strong> · Tần số góc <strong>ω = {springStats.omega.toFixed(2)} rad/s</strong></div>
              <div>• Li độ tức thời <strong>x = {springStats.x_cm.toFixed(1)} cm</strong> · Cơ năng <strong>W = {springStats.W.toFixed(3)} J</strong></div>
              <div>• Động năng W_đ: <strong>{springStats.Wd.toFixed(3)} J</strong> | Thế năng W_t: <strong>{springStats.Wt.toFixed(3)} J</strong></div>
            </div>
          </section>

          <section style={{ padding: 20, borderRadius: 16, border: '1px solid rgba(148,163,184,0.25)' }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 12px' }}>2. Giao thoa ánh sáng Khe Y-âng (i = λD/a)</h2>
            {/* MÀN QUAN SÁT VÂN GIAO THOA */}
            <div style={{ height: 96, borderRadius: 12, background: '#050811', position: 'relative', overflow: 'hidden', marginBottom: 14, border: '1px solid rgba(255,255,255,0.12)' }}>
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

            <div style={{ display: 'grid', gap: 10, fontSize: 13 }}>
              <label>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                  <span>Bước sóng ánh sáng đơn sắc λ</span>
                  <span style={{ color: youngStats.color, fontWeight: 800 }}>{lambdaNm} nm ({ (lambdaNm / 1000).toFixed(3) } μm)</span>
                </div>
                <input type="range" min="380" max="760" step="5" value={lambdaNm} onChange={(e) => setLambdaNm(Number(e.target.value))} style={{ width: '100%' }} />
              </label>
              <label>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                  <span>Khoảng cách hai khe a</span><span>{slitA.toFixed(1)} mm</span>
                </div>
                <input type="range" min="0.5" max="3.0" step="0.1" value={slitA} onChange={(e) => setSlitA(Number(e.target.value))} style={{ width: '100%' }} />
              </label>
              <label>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                  <span>Khoảng cách từ hai khe tới màn D</span><span>{screenD.toFixed(1)} m</span>
                </div>
                <input type="range" min="0.5" max="3.0" step="0.1" value={screenD} onChange={(e) => setScreenD(Number(e.target.value))} style={{ width: '100%' }} />
              </label>
            </div>

            <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: 'rgba(37,99,235,0.08)', fontSize: 13.5 }}>
              <div>• <strong>Khoảng vân giao thoa:</strong> i = λD / a = <strong>{youngStats.i_mm.toFixed(3)} mm</strong></div>
              <div>• Vị trí vân sáng bậc 3: <strong>x_s3 = ±{(3 * youngStats.i_mm).toFixed(3)} mm</strong></div>
              <div>• Vị trí vân tối thứ 3: <strong>x_t3 = ±{(2.5 * youngStats.i_mm).toFixed(3)} mm</strong></div>
            </div>
          </section>
        </div>
      )}

      {/* ================= TAB 3: DNA TRANSCRIPTION & MUTATION ================= */}
      {activeTab === 'dna' && (
        <div style={{ padding: 20, borderRadius: 16, border: '1px solid rgba(148,163,184,0.25)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Mô phỏng Phiên mã, Dịch mã &amp; Đột biến Điểm Gen (ADN → mARN → Polypeptide)</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <button type="button" onClick={() => applyPresetMutation('reset')} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(148,163,184,0.4)', background: 'transparent', color: 'inherit', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                ↺ Mạch gốc chuẩn
              </button>
              <button type="button" onClick={() => applyPresetMutation('sickle')} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                🩸 Đột biến Hồng cầu hình liềm (HbS)
              </button>
              <button type="button" onClick={() => applyPresetMutation('nonsense')} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: '#f59e0b', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                🛑 Đột biến Vô nghĩa (Kết thúc sớm)
              </button>
              <button type="button" onClick={() => applyPresetMutation('frameshift')} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: '#8b5cf6', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                ⚡ Đột biến Dịch khung (Mất 1 cặp nu)
              </button>
            </div>
          </div>

          <label style={{ display: 'block', marginBottom: 14, fontSize: 13.5 }}>
            <span style={{ fontWeight: 700, display: 'block', marginBottom: 6 }}>Nhập hoặc chỉnh sửa trực tiếp Mạch gốc ADN (chiều 3’ → 5’, chỉ gồm A, T, G, C/X):</span>
            <input
              type="text"
              value={dnaTemplate}
              onChange={(e) => {
                setDnaTemplate(e.target.value);
                setMutationLog('Bạn vừa tự chỉnh sửa trực tiếp trình tự nuclêôtit trên mạch gốc ADN.');
              }}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #3b82f6', fontFamily: 'monospace', fontSize: 16, fontWeight: 700, letterSpacing: 2 }}
            />
          </label>

          <div style={{ padding: 12, borderRadius: 10, background: 'rgba(245,158,11,0.1)', borderLeft: '4px solid #f59e0b', marginBottom: 16, fontSize: 13.5 }}>
            <div><strong>Nhật ký thí nghiệm:</strong> {mutationLog}</div>
            <div style={{ marginTop: 4 }}><strong>Chẩn đoán sinh học phân tử:</strong> <span style={{ color: '#d97706', fontWeight: 700 }}>{bioStats.mutationType}</span></div>
          </div>

          <div style={{ display: 'grid', gap: 10, fontFamily: 'monospace', fontSize: 15, padding: 16, borderRadius: 12, background: '#0f172a', color: '#f8fafc', overflowX: 'auto' }}>
            <div><span style={{ color: '#94a3b8' }}>Mạch gốc ADN (3’→5’):     </span><strong style={{ color: '#38bdf8', letterSpacing: 2 }}>{bioStats.clean.match(/.{1,3}/g)?.join(' - ')}</strong></div>
            <div><span style={{ color: '#94a3b8' }}>Mạch bổ sung ADN (5’→3’): </span><strong style={{ color: '#a78bfa', letterSpacing: 2 }}>{bioStats.codingStrand.match(/.{1,3}/g)?.join(' - ')}</strong></div>
            <div><span style={{ color: '#94a3b8' }}>Phân tử mARN (5’→3’):     </span><strong style={{ color: '#34d399', letterSpacing: 2 }}>{bioStats.codons.join(' - ')}</strong></div>
            <div>
              <span style={{ color: '#94a3b8' }}>Chuỗi Polypeptide:        </span>
              <strong style={{ color: '#fbbf24' }}>{bioStats.aminoAcids.join(' — ')}</strong>
            </div>
          </div>

          <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, fontSize: 13.5 }}>
            <div style={{ padding: 12, borderRadius: 10, background: 'rgba(37,99,235,0.08)' }}>
              Tổng số nu của đoạn gen: <strong>N = {bioStats.totalNu} nu</strong>
            </div>
            <div style={{ padding: 12, borderRadius: 10, background: 'rgba(16,185,129,0.08)' }}>
              Chiều dài đoạn gen: <strong>L = {bioStats.lengthAngstrom.toFixed(1)} Å</strong>
            </div>
            <div style={{ padding: 12, borderRadius: 10, background: 'rgba(139,92,246,0.08)' }}>
              Số liên kết Hiđrô (2A + 3G): <strong>H = {bioStats.hBonds} liên kết</strong>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: PUNNETT SQUARE ================= */}
      {activeTab === 'punnett' && (
        <div style={{ padding: 20, borderRadius: 16, border: '1px solid rgba(148,163,184,0.25)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 12px' }}>Máy Tính Sơ Đồ Lai Menđen &amp; Khung Punnett (1 hoặc 2 cặp gen)</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 16 }}>
            <label style={{ fontSize: 13.5, fontWeight: 700 }}>
              Cơ thể bố (P₁):{' '}
              <select value={parent1} onChange={(e) => setParent1(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, fontWeight: 700 }}>
                {['AA', 'Aa', 'aa', 'AABB', 'AaBB', 'AABb', 'AaBb', 'Aabb', 'aaBb', 'aabb'].map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </label>
            <span style={{ fontWeight: 800, fontSize: 18 }}>×</span>
            <label style={{ fontSize: 13.5, fontWeight: 700 }}>
              Cơ thể mẹ (P₂):{' '}
              <select value={parent2} onChange={(e) => setParent2(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, fontWeight: 700 }}>
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
                    <th key={colG} style={{ padding: 10, border: '1px solid rgba(148,163,184,0.3)', color: '#2563eb' }}>{colG}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {punnettData.g1.map((rowG, rIdx) => (
                  <tr key={rowG}>
                    <th style={{ padding: 10, border: '1px solid rgba(148,163,184,0.3)', background: 'rgba(37,99,235,0.08)', color: '#2563eb' }}>{rowG}</th>
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, fontSize: 13.5 }}>
            <div style={{ padding: 14, borderRadius: 12, background: 'rgba(37,99,235,0.08)' }}>
              <div style={{ fontWeight: 800, marginBottom: 6, color: '#2563eb' }}>Tỉ lệ Kiểu gen ở F₁ ({punnettData.total} tổ hợp):</div>
              {Object.entries(punnettData.counts).map(([k, v]) => (
                <span key={k} style={{ display: 'inline-block', marginRight: 10, marginBottom: 4, padding: '3px 8px', borderRadius: 6, background: 'rgba(37,99,235,0.12)', fontWeight: 700 }}>
                  {v}/{punnettData.total} {k}
                </span>
              ))}
            </div>
            <div style={{ padding: 14, borderRadius: 12, background: 'rgba(16,185,129,0.08)' }}>
              <div style={{ fontWeight: 800, marginBottom: 6, color: '#059669' }}>Tỉ lệ Kiểu hình ở F₁ (Trội hoàn toàn):</div>
              {Object.entries(punnettData.phenoCounts).map(([k, v]) => (
                <span key={k} style={{ display: 'inline-block', marginRight: 10, marginBottom: 4, padding: '3px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.15)', fontWeight: 700 }}>
                  {v}/{punnettData.total} {k} ({((v / punnettData.total) * 100).toFixed(1)}%)
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
