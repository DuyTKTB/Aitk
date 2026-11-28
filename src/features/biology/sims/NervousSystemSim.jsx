import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import BioCanvas3D from '../components/BioCanvas3D.jsx';
import BioLiveChart from '../components/BioLiveChart.jsx';
import { getOrganicTextures } from '../components/bioMaterials.js';

const ACTION_POTENTIAL_CURVE = [
  { ms: 0, mv: -70 }, { ms: 0.5, mv: -70 }, { ms: 1.0, mv: -55 }, { ms: 1.4, mv: 0 },
  { ms: 1.8, mv: 30 }, { ms: 2.3, mv: 5 }, { ms: 2.8, mv: -50 }, { ms: 3.3, mv: -82 },
  { ms: 4.0, mv: -74 }, { ms: 4.8, mv: -70 },
];

const REFLEX_STEPS = [
  '1. Cơ quan thụ cảm (da tay) tiếp nhận kích thích nóng / kim châm',
  '2. Neuron cảm giác (hướng tâm) truyền xung về sừng sau tủy sống',
  '3. Neuron trung gian (tủy sống) phân tích và chuyển tiếp qua khớp synapse',
  '4. Neuron vận động (li tâm) truyền lệnh ra cơ bắp tay',
  '5. Cơ quan đáp ứng (cơ nhị đầu cánh tay) co lập tức giúp rụt tay lại (< 0,05 s)',
];

function Neuron3DScene({ myelinated, fireTick, showLabels }) {
  const pulseRef = useRef(null);
  const pulseLightRef = useRef(null);
  const progressRef = useRef(1.2); // > 1 nghĩa là đang nghỉ
  const lastFireRef = useRef(0);

  const organTex = useMemo(() => getOrganicTextures('organ', 2), []);
  const memTex = useMemo(() => getOrganicTextures('membrane', 2), []);

  // Sợi trục uốn nhẹ + 7 nhánh Dendrite vươn 3D quanh thân Soma + 3 nhánh Cúc Synapse
  const geom = useMemo(() => {
    const axonCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-2.1, 0, 0),
      new THREE.Vector3(-0.7, 0.12, 0.14),
      new THREE.Vector3(0.8, -0.08, -0.1),
      new THREE.Vector3(2.35, 0.04, 0.04),
    ]);

    const dendriteDirs = [
      [-1.15, 0.95, 0.35], [-1.25, 0.35, -0.75], [-1.35, -0.35, 0.55],
      [-0.95, -0.95, -0.3], [-0.45, 1.05, -0.45], [-0.55, -1.02, 0.52], [-1.42, 0.08, 0.1],
    ];
    const dendrites = dendriteDirs.map(([dx, dy, dz]) =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-2.35, 0, 0),
        new THREE.Vector3(-2.35 + dx * 0.55, dy * 0.52, dz * 0.55),
        new THREE.Vector3(-2.35 + dx, dy, dz),
      ])
    );

    const terminalDirs = [
      [0.85, 0.55, 0.32], [0.95, 0.04, -0.38], [0.85, -0.52, 0.25],
    ];
    const terminals = terminalDirs.map(([dx, dy, dz]) =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(2.35, 0.04, 0.04),
        new THREE.Vector3(2.35 + dx * 0.55, 0.04 + dy * 0.5, 0.04 + dz * 0.5),
        new THREE.Vector3(2.35 + dx, 0.04 + dy, 0.04 + dz),
      ])
    );

    // 4 phân đoạn Bao Myelin nằm dọc sợi trục
    const myelinSegments = [0.16, 0.38, 0.6, 0.82].map((u) => {
      const p = axonCurve.getPoint(u);
      const tan = axonCurve.getTangent(u);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tan.normalize());
      return { pos: [p.x, p.y, p.z], quat: q };
    });

    return { axonCurve, dendrites, terminals, myelinSegments };
  }, []);

  useFrame((_, dt) => {
    if (fireTick !== lastFireRef.current) {
      lastFireRef.current = fireTick;
      progressRef.current = 0;
    }
    if (progressRef.current <= 1.02) {
      const speed = myelinated ? 1.15 : 0.36;
      progressRef.current += dt * speed;
      const u = Math.min(1, progressRef.current);
      const pt = geom.axonCurve.getPoint(u);
      // Nếu có Myelin: xung nhảy cóc vọt cong lên giữa các eo Ranvier!
      const hopY = myelinated ? Math.abs(Math.sin(u * Math.PI * 4)) * 0.42 : 0;
      if (pulseRef.current) {
        pulseRef.current.visible = true;
        pulseRef.current.position.set(pt.x, pt.y + hopY, pt.z);
      }
      if (pulseLightRef.current) {
        pulseLightRef.current.intensity = 3.2;
        pulseLightRef.current.position.set(pt.x, pt.y + hopY + 0.15, pt.z + 0.35);
      }
    } else {
      if (pulseRef.current) pulseRef.current.visible = false;
      if (pulseLightRef.current) pulseLightRef.current.intensity = 0;
    }
  });

  return (
    <group>
      {/* Thân tế bào thần kinh (Soma) + Nhân tím phát sáng */}
      <group position={[-2.35, 0, 0]}>
        <mesh>
          <sphereGeometry args={[0.56, 32, 24]} />
          <meshPhysicalMaterial
            color="#7c3aed"
            map={organTex.map}
            bumpMap={organTex.bumpMap}
            bumpScale={0.03}
            roughness={0.25}
            clearcoat={0.9}
            transparent
            opacity={0.86}
            emissive="#6d28d9"
            emissiveIntensity={0.25}
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.25, 22, 16]} />
          <meshStandardMaterial color="#e9d5ff" emissive="#c084fc" emissiveIntensity={0.65} />
        </mesh>
      </group>

      {/* 7 Sợi nhánh (Dendrites) vươn 3D */}
      {geom.dendrites.map((c, idx) => (
        <mesh key={idx}>
          <tubeGeometry args={[c, 22, 0.055, 10, false]} />
          <meshPhysicalMaterial color="#a78bfa" roughness={0.3} clearcoat={0.7} emissive="#8b5cf6" emissiveIntensity={0.22} />
        </mesh>
      ))}

      {/* Sợi trục (Axon) */}
      <mesh>
        <tubeGeometry args={[geom.axonCurve, 64, 0.075, 14, false]} />
        <meshPhysicalMaterial color="#e2e8f0" roughness={0.25} clearcoat={0.8} emissive="#94a3b8" emissiveIntensity={0.14} />
      </mesh>

      {/* 4 Đoạn Bao Myelin (tế bào Schwann giàu lipid bóng) cách nhau bởi Eo Ranvier */}
      {myelinated &&
        geom.myelinSegments.map((seg, idx) => (
          <mesh key={idx} position={seg.pos} quaternion={seg.quat}>
            <capsuleGeometry args={[0.175, 0.44, 14, 24]} />
            <meshPhysicalMaterial
              color="#38bdf8"
              map={memTex.map}
              bumpMap={memTex.bumpMap}
              bumpScale={0.025}
              roughness={0.14}
              clearcoat={1}
              iridescence={0.65}
              transparent
              opacity={0.84}
              emissive="#0284c7"
              emissiveIntensity={0.22}
            />
          </mesh>
        ))}

      {/* Cúc Synapse tận cùng */}
      {geom.terminals.map((c, idx) => {
        const end = c.getPoint(1);
        return (
          <group key={idx}>
            <mesh>
              <tubeGeometry args={[c, 18, 0.045, 10, false]} />
              <meshPhysicalMaterial color="#f472b6" roughness={0.28} emissive="#ec4899" emissiveIntensity={0.25} />
            </mesh>
            <mesh position={[end.x, end.y, end.z]}>
              <sphereGeometry args={[0.13, 16, 14]} />
              <meshPhysicalMaterial color="#fb7185" roughness={0.22} clearcoat={0.9} emissive="#f43f5e" emissiveIntensity={0.45} />
            </mesh>
          </group>
        );
      })}

      {/* Xung điện thế hoạt động phát sáng di chuyển dọc sợi trục */}
      <mesh ref={pulseRef} visible={false}>
        <sphereGeometry args={[0.2, 20, 16]} />
        <meshStandardMaterial color="#fef08a" emissive="#facc15" emissiveIntensity={2.2} />
      </mesh>
      <pointLight ref={pulseLightRef} color="#facc15" intensity={0} distance={3.5} />

      {showLabels && (
        <>
          <Html position={[-2.45, 0.92, 0]} center zIndexRange={[10, 0]}>
            <div className="bl-3d-pin" style={{ '--pin-col': '#a78bfa' }}><i /><span>Thân Neuron</span></div>
          </Html>
          <Html position={[-0.1, 0.65, 0.2]} center zIndexRange={[10, 0]}>
            <div className="bl-3d-pin active" style={{ '--pin-col': '#38bdf8' }}>
              <i />
              <span>{myelinated ? 'Bao Myelin · Eo Ranvier' : 'Sợi trục trần'}</span>
            </div>
          </Html>
          <Html position={[2.9, 0.72, 0]} center zIndexRange={[10, 0]}>
            <div className="bl-3d-pin" style={{ '--pin-col': '#f472b6' }}><i /><span>Cúc Synapse</span></div>
          </Html>
        </>
      )}
    </group>
  );
}

export default function NervousSystemSim() {
  const [view, setView] = useState('axon'); // 'axon' | 'synapse' | 'reflex'
  const [myelinated, setMyelinated] = useState(true);
  const [fireTick, setFireTick] = useState(1);
  const [showLabels, setShowLabels] = useState(true);
  const [reflexStep, setReflexStep] = useState(-1);

  const triggerReflex = () => {
    setReflexStep(0);
    let idx = 0;
    const timer = setInterval(() => {
      idx += 1;
      if (idx >= REFLEX_STEPS.length) clearInterval(timer);
      else setReflexStep(idx);
    }, 550);
  };

  return (
    <div className="bl-grid-2">
      <div className="bl-controls">
        <div className="bl-tabs">
          <button type="button" className={`bl-tab${view === 'axon' ? ' on' : ''}`} onClick={() => setView('axon')}>1. Neuron 3D &amp; Xung điện</button>
          <button type="button" className={`bl-tab${view === 'synapse' ? ' on' : ''}`} onClick={() => setView('synapse')}>2. Khớp Synapse hóa học</button>
          <button type="button" className={`bl-tab${view === 'reflex' ? ' on' : ''}`} onClick={() => setView('reflex')}>3. Cung phản xạ 5 khâu</button>
        </div>

        {view === 'axon' && (
          <div>
            <BioCanvas3D
              camera={{ position: [0.1, 0.6, 6.2], fov: 40 }}
              height={395}
              studioTheme="holo"
              shadowY={-1.6}
              badge={myelinated ? 'Neuron 3D · Lan truyền nhảy cóc (~100 m/s)' : 'Neuron 3D · Không bao Myelin (~2 m/s)'}
            >
              <Neuron3DScene myelinated={myelinated} fireTick={fireTick} showLabels={showLabels} />
            </BioCanvas3D>

            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              <button type="button" className="bl-btn primary" onClick={() => setFireTick((k) => k + 1)}>
                ⚡ Kích thích ngưỡng (Phát xung điện 3D)
              </button>
              <button type="button" className={`bl-btn${myelinated ? ' is-on' : ''}`} onClick={() => setMyelinated((m) => !m)}>
                {myelinated ? 'Bao Myelin: Có (Nhảy cóc)' : 'Bao Myelin: Không (Liên tục)'}
              </button>
              <button type="button" className="bl-btn" onClick={() => setShowLabels((v) => !v)}>
                {showLabels ? 'Ẩn nhãn 3D' : 'Hiện nhãn 3D'}
              </button>
            </div>
          </div>
        )}

        {view === 'synapse' && (
          <div className="bl-panel" style={{ background: '#071224', color: '#f8fafc' }}>
            <svg viewBox="0 0 520 220" style={{ width: '100%', height: 220 }}>
              <path d="M20 65 L190 65 Q235 65 235 105 Q235 145 190 145 L20 145" fill="rgba(139,92,246,0.35)" stroke="#a78bfa" strokeWidth="3" />
              <text x="40" y="52" fontSize="11.5" fontWeight="700" fill="#c4b5fd">Chùy Synapse (Màng trước)</text>
              {[155, 185, 212].map((cx, i) => (
                <circle key={i} cx={cx} cy={90 + i * 16} r="9" fill="#fbbf24" opacity="0.9" />
              ))}
              <text x="262" y="34" textAnchor="middle" fontSize="11" fill="#94a3b8">Khe Synapse</text>
              {[0, 1, 2, 3].map((k) => (
                <circle key={k} cx={250 + k * 9} cy={90 + (k % 2) * 26} r="4.5" fill="#4ade80" />
              ))}
              <path d="M500 55 L320 55 Q290 55 290 105 Q290 155 320 155 L500 155" fill="rgba(16,185,129,0.22)" stroke="#34d399" strokeWidth="3" />
              <text x="315" y="44" fontSize="11.5" fontWeight="700" fill="#6ee7b7">Màng sau Synapse (Thụ thể)</text>
              {[78, 105, 132].map((y) => (
                <rect key={y} x="284" y={y - 6} width="14" height="12" rx="3" fill="#38bdf8" />
              ))}
              <text x="18" y="195" fontSize="11" fill="#e2e8f0">
                1. Xung tới → Ca²⁺ vào chùy → 2. Túi vỡ giải phóng Acetylcholine → 3. Gắn thụ thể màng sau mở kênh Na⁺
              </text>
            </svg>
          </div>
        )}

        {view === 'reflex' && (
          <div className="bl-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h4 style={{ margin: 0 }}>Cung phản xạ không điều kiện (Rụt tay khi chạm nóng)</h4>
              <button type="button" className="bl-btn primary" onClick={triggerReflex}>Kích thích nóng</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {REFLEX_STEPS.map((st, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '9px 11px',
                    borderRadius: 11,
                    border: reflexStep === idx ? '1.5px solid #e11d48' : '1px solid var(--bl-border)',
                    background: reflexStep === idx ? 'rgba(225,29,72,0.12)' : 'var(--bl-surface)',
                    fontSize: '0.82rem',
                    fontWeight: reflexStep === idx ? 700 : 500,
                  }}
                >
                  {st}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bl-controls">
        <BioLiveChart
          data={ACTION_POTENTIAL_CURVE}
          xKey="ms"
          xLabel="Thời gian (ms)"
          yLabel="Điện thế màng (mV)"
          series={[{ key: 'mv', label: 'Điện thế hoạt động (−70 → +30 mV)', color: '#f59e0b' }]}
          height={218}
          maxY={50}
        />
        <div className="bl-panel">
          <h4>3 Pha của Điện thế Hoạt động</h4>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.81rem', lineHeight: 1.58, color: 'var(--bl-mut)' }}>
            <li><b style={{ color: 'var(--bl-ink)' }}>Điện thế nghỉ (−70 mV):</b> Trong màng âm, ngoài màng dương (bơm Na⁺/K⁺ tiêu tốn ATP).</li>
            <li><b style={{ color: 'var(--bl-ink)' }}>Khử cực &amp; Đảo cực (→ +30 mV):</b> Kênh Na⁺ mở ồ ạt, ion Na⁺ tràn vào trong tế bào.</li>
            <li><b style={{ color: 'var(--bl-ink)' }}>Tái phân cực (→ −70 mV):</b> Kênh Na⁺ đóng, kênh K⁺ mở đẩy K⁺ ra ngoài lập lại điện thế nghỉ.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
