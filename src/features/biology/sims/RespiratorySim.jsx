import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import BioCanvas3D from '../components/BioCanvas3D.jsx';
import { getOrganicTextures } from '../components/bioMaterials.js';

function Lungs3DScene({ rate, tidalMl, running, viewMode, showLabels, onBreathPhase }) {
  const groupRef = useRef(null);
  const lungRRef = useRef(null);
  const lungLRef = useRef(null);
  const diaphragmRef = useRef(null);
  const alveoliRef = useRef(null);
  const gasRefs = useRef([]);
  const tRef = useRef(0);
  const lastInhaling = useRef(true);

  const lungTex = useMemo(() => getOrganicTextures('lung', 2), []);
  const muscleTex = useMemo(() => getOrganicTextures('muscle', 2), []);

  // Cây phế quản phân nhánh vào 2 lá phổi + Lưới mao mạch quanh chùm phế nang
  const curves = useMemo(() => {
    const brR = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.9, 0),
      new THREE.Vector3(-0.42, 0.62, 0.02),
      new THREE.Vector3(-0.78, 0.25, 0.04),
    ]);
    const brL = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.9, 0),
      new THREE.Vector3(0.45, 0.62, 0.02),
      new THREE.Vector3(0.8, 0.22, 0.02),
    ]);
    const cap1 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-2.1, -0.75, 0.4),
      new THREE.Vector3(-0.95, 0.35, 0.92),
      new THREE.Vector3(0.1, 0.72, 0.98),
      new THREE.Vector3(1.1, 0.15, 0.85),
      new THREE.Vector3(2.1, -0.75, 0.35),
    ]);
    const cap2 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-2.0, -0.4, -0.45),
      new THREE.Vector3(-0.75, -0.85, 0.72),
      new THREE.Vector3(0.45, -0.68, 0.92),
      new THREE.Vector3(1.45, -0.2, 0.65),
      new THREE.Vector3(2.1, -0.4, -0.4),
    ]);
    return { brR, brL, cap1, cap2 };
  }, []);

  // Tọa độ 14 túi phế nang kết thành chùm nho
  const alveoliCoords = useMemo(() => [
    [0, 0.1, 0, 0.56],
    [-0.58, 0.42, 0.28, 0.44], [0.58, 0.38, 0.24, 0.45],
    [-0.64, -0.22, 0.38, 0.46], [0.62, -0.28, 0.35, 0.44],
    [0, 0.66, -0.15, 0.43], [0, -0.52, 0.38, 0.45],
    [-0.36, 0.15, -0.55, 0.46], [0.38, 0.12, -0.55, 0.45],
    [-0.95, 0.05, -0.12, 0.38], [0.95, 0.02, -0.1, 0.38],
    [-0.45, -0.62, -0.25, 0.4], [0.46, -0.6, -0.22, 0.4],
    [0, 0.22, 0.62, 0.42],
  ], []);

  useFrame((_, dt) => {
    if (running) tRef.current += dt;
    const omega = (2 * Math.PI * rate) / 60;
    const rawSin = Math.sin(tRef.current * omega);
    const breathFactor = (rawSin + 1) / 2; // 0..1
    const inhaling = Math.cos(tRef.current * omega) >= 0;

    if (inhaling !== lastInhaling.current) {
      lastInhaling.current = inhaling;
      onBreathPhase(inhaling);
    }

    const amp = 0.08 + (tidalMl / 1400) * 0.14;
    const s = 0.94 + breathFactor * amp;

    if (lungRRef.current && lungLRef.current) {
      lungRRef.current.scale.set(s, 0.96 + breathFactor * (amp * 0.7), s);
      lungLRef.current.scale.set(s, 0.96 + breathFactor * (amp * 0.7), s);
    }
    if (diaphragmRef.current) {
      diaphragmRef.current.position.y = -1.18 - breathFactor * 0.26;
      diaphragmRef.current.scale.y = 0.48 - breathFactor * 0.18;
    }
    if (alveoliRef.current) {
      alveoliRef.current.scale.setScalar(0.92 + breathFactor * (amp * 0.95));
    }
    // Hạt khí O2 / CO2 chuyển động trong khí quản
    gasRefs.current.forEach((m, idx) => {
      if (!m) return;
      const offset = ((tRef.current * (inhaling ? -1.4 : 1.4) + idx * 0.35) % 1.8 + 1.8) % 1.8;
      m.position.y = 0.8 + offset * 0.75;
    });
  });

  if (viewMode === 'alveoli') {
    return (
      <group ref={groupRef}>
        {/* Tiểu phế quản dẫn vào chùm phế nang */}
        <mesh position={[0, 1.38, 0]}>
          <cylinderGeometry args={[0.22, 0.28, 1.1, 20]} />
          <meshPhysicalMaterial color="#cbd5e1" roughness={0.35} clearcoat={0.6} />
        </mesh>

        {/* Chùm 14 túi phế nang căng phồng */}
        <group ref={alveoliRef}>
          {alveoliCoords.map(([x, y, z, r], i) => (
            <mesh key={i} position={[x, y, z]}>
              <sphereGeometry args={[r, 26, 20]} />
              <meshPhysicalMaterial
                color="#f4a6b8"
                map={lungTex.map}
                bumpMap={lungTex.bumpMap}
                bumpScale={0.03}
                roughness={0.22}
                clearcoat={0.9}
                transparent
                opacity={0.86}
                emissive="#fb7185"
                emissiveIntensity={0.14}
              />
            </mesh>
          ))}
        </group>

        {/* Lưới mao mạch phổi (xanh tĩnh mạch -> đỏ động mạch) ôm quanh chùm phế nang */}
        <mesh>
          <tubeGeometry args={[curves.cap1, 56, 0.12, 14, false]} />
          <meshPhysicalMaterial color="#ef4444" roughness={0.22} clearcoat={0.95} emissive="#dc2626" emissiveIntensity={0.24} />
        </mesh>
        <mesh>
          <tubeGeometry args={[curves.cap2, 56, 0.11, 14, false]} />
          <meshPhysicalMaterial color="#2563eb" roughness={0.22} clearcoat={0.95} emissive="#3b82f6" emissiveIntensity={0.24} />
        </mesh>

        {showLabels && (
          <>
            <Html position={[0.1, 1.45, 0.35]} center zIndexRange={[10, 0]}>
              <div className="bl-3d-pin" style={{ '--pin-col': '#94a3b8' }}><i /><span>Tiểu phế quản</span></div>
            </Html>
            <Html position={[-1.05, 0.55, 0.65]} center zIndexRange={[10, 0]}>
              <div className="bl-3d-pin active" style={{ '--pin-col': '#34d399' }}><i /><span>O₂ → Máu (104 mmHg)</span></div>
            </Html>
            <Html position={[1.25, -0.55, 0.65]} center zIndexRange={[10, 0]}>
              <div className="bl-3d-pin" style={{ '--pin-col': '#ef4444' }}><i /><span>Mao mạch phổi</span></div>
            </Html>
          </>
        )}
      </group>
    );
  }

  return (
    <group ref={groupRef} position={[0, -0.1, 0]}>
      {/* Khí quản + 9 Vòng sụn chữ C */}
      <mesh position={[0, 1.55, 0]}>
        <cylinderGeometry args={[0.18, 0.2, 1.45, 20]} />
        <meshPhysicalMaterial color="#e2e8f0" roughness={0.32} clearcoat={0.7} />
      </mesh>
      {Array.from({ length: 9 }).map((_, i) => (
        <mesh key={i} position={[0, 0.95 + i * 0.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.205, 0.032, 10, 24]} />
          <meshStandardMaterial color="#bae6fd" roughness={0.35} />
        </mesh>
      ))}

      {/* Phế quản chính phải & trái */}
      <mesh>
        <tubeGeometry args={[curves.brR, 24, 0.12, 12, false]} />
        <meshPhysicalMaterial color="#cbd5e1" roughness={0.35} />
      </mesh>
      <mesh>
        <tubeGeometry args={[curves.brL, 24, 0.12, 12, false]} />
        <meshPhysicalMaterial color="#cbd5e1" roughness={0.35} />
      </mesh>

      {/* Các hạt khí O2/CO2 di chuyển dọc khí quản */}
      {[0, 1, 2, 3, 4].map((idx) => (
        <mesh
          key={idx}
          ref={(el) => { gasRefs.current[idx] = el; }}
          position={[(idx % 2 === 0 ? -0.05 : 0.05), 1.4, 0.22]}
        >
          <sphereGeometry args={[0.055, 12, 10]} />
          <meshStandardMaterial color="#34d399" emissive="#10b981" emissiveIntensity={0.95} />
        </mesh>
      ))}

      {/* Phổi phải 3 thùy (trái trên màn hình) phủ vân tiểu thùy & mao mạch */}
      <group ref={lungRRef} position={[-0.95, 0.08, 0]}>
        <mesh position={[0.06, 0.56, 0]} scale={[0.78, 0.92, 0.78]}>
          <sphereGeometry args={[0.64, 30, 22]} />
          <meshPhysicalMaterial color="#e295a2" map={lungTex.map} bumpMap={lungTex.bumpMap} bumpScale={0.045} roughness={0.26} clearcoat={0.85} transparent opacity={0.9} />
        </mesh>
        <mesh position={[-0.06, -0.02, 0.05]} scale={[0.88, 0.82, 0.82]}>
          <sphereGeometry args={[0.68, 30, 22]} />
          <meshPhysicalMaterial color="#d88494" map={lungTex.map} bumpMap={lungTex.bumpMap} bumpScale={0.045} roughness={0.26} clearcoat={0.85} transparent opacity={0.9} />
        </mesh>
        <mesh position={[-0.1, -0.58, -0.04]} scale={[0.92, 0.76, 0.84]}>
          <sphereGeometry args={[0.66, 30, 22]} />
          <meshPhysicalMaterial color="#ce7688" map={lungTex.map} bumpMap={lungTex.bumpMap} bumpScale={0.045} roughness={0.26} clearcoat={0.85} transparent opacity={0.9} />
        </mesh>
      </group>

      {/* Phổi trái 2 thùy (nhỏ hơn, có khuyết tim) */}
      <group ref={lungLRef} position={[1.02, 0.08, 0]}>
        <mesh position={[-0.04, 0.42, 0]} scale={[0.76, 0.98, 0.78]}>
          <sphereGeometry args={[0.64, 30, 22]} />
          <meshPhysicalMaterial color="#e295a2" map={lungTex.map} bumpMap={lungTex.bumpMap} bumpScale={0.045} roughness={0.26} clearcoat={0.85} transparent opacity={0.9} />
        </mesh>
        <mesh position={[0.1, -0.44, -0.02]} scale={[0.84, 0.86, 0.82]}>
          <sphereGeometry args={[0.63, 30, 22]} />
          <meshPhysicalMaterial color="#ce7688" map={lungTex.map} bumpMap={lungTex.bumpMap} bumpScale={0.045} roughness={0.26} clearcoat={0.85} transparent opacity={0.9} />
        </mesh>
      </group>

      {/* Vòm cơ hoành 3D co hạ – dãn cong theo nhịp thở */}
      <mesh ref={diaphragmRef} position={[0, -1.25, 0]} scale={[2.05, 0.45, 1.05]}>
        <sphereGeometry args={[0.92, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial
          color="#e11d48"
          map={muscleTex.map}
          bumpMap={muscleTex.bumpMap}
          bumpScale={0.03}
          roughness={0.34}
          transparent
          opacity={0.78}
          side={THREE.DoubleSide}
        />
      </mesh>

      {showLabels && (
        <>
          <Html position={[0.55, 1.75, 0.25]} center zIndexRange={[10, 0]}>
            <div className="bl-3d-pin" style={{ '--pin-col': '#38bdf8' }}><i /><span>Khí quản</span></div>
          </Html>
          <Html position={[-1.45, 0.2, 0.65]} center zIndexRange={[10, 0]}>
            <div className="bl-3d-pin active" style={{ '--pin-col': '#fb7185' }}><i /><span>Phổi phải (3 thùy)</span></div>
          </Html>
          <Html position={[1.45, 0.2, 0.65]} center zIndexRange={[10, 0]}>
            <div className="bl-3d-pin" style={{ '--pin-col': '#fb7185' }}><i /><span>Phổi trái (2 thùy)</span></div>
          </Html>
          <Html position={[0, -1.55, 0.65]} center zIndexRange={[10, 0]}>
            <div className="bl-3d-pin" style={{ '--pin-col': '#e11d48' }}><i /><span>Cơ hoành</span></div>
          </Html>
        </>
      )}
    </group>
  );
}

export default function RespiratorySim() {
  const [rate, setRate] = useState(16);
  const [tidalMl, setTidalMl] = useState(500);
  const [running, setRunning] = useState(true);
  const [viewMode, setViewMode] = useState('lungs'); // 'lungs' | 'alveoli'
  const [showLabels, setShowLabels] = useState(true);
  const [inhaling, setInhaling] = useState(true);

  const minuteVentL = Math.round(((rate * tidalMl) / 1000) * 10) / 10;

  return (
    <div className="bl-grid-2">
      <div>
        <div className="bl-tabs">
          <button type="button" className={`bl-tab${viewMode === 'lungs' ? ' on' : ''}`} onClick={() => setViewMode('lungs')}>
            1. Phổi 3/2 thùy &amp; Cơ hoành (3D)
          </button>
          <button type="button" className={`bl-tab${viewMode === 'alveoli' ? ' on' : ''}`} onClick={() => setViewMode('alveoli')}>
            2. Phóng đại Chùm Phế nang &amp; Mao mạch (3D)
          </button>
          <button type="button" className={`bl-tab${showLabels ? ' on' : ''}`} onClick={() => setShowLabels((v) => !v)}>
            {showLabels ? 'Nhãn 3D: Bật' : 'Nhãn 3D: Tắt'}
          </button>
        </div>

        <BioCanvas3D
          camera={{ position: [0, 0.25, 5.2], fov: 42 }}
          height={455}
          studioTheme="medical"
          shadowY={-2.1}
          badge={
            viewMode === 'alveoli'
              ? 'Chùm Phế nang 3D · Trao đổi khí O₂ / CO₂'
              : inhaling
                ? 'ĐANG HÍT VÀO · Cơ hoành hạ xuống'
                : 'ĐANG THỞ RA · Cơ hoành dãn vòm lên'
          }
        >
          <Lungs3DScene
            rate={rate}
            tidalMl={tidalMl}
            running={running}
            viewMode={viewMode}
            showLabels={showLabels}
            onBreathPhase={setInhaling}
          />
        </BioCanvas3D>
      </div>

      <div className="bl-controls">
        <div className="bl-panel">
          <h4>Điều khiển Thông khí Phổi 3D</h4>
          <div className="bl-tabs">
            <button type="button" className="bl-btn primary" onClick={() => setRunning((r) => !r)}>
              {running ? 'Tạm dừng' : 'Tiếp tục hít thở'}
            </button>
            <button type="button" className="bl-tab" onClick={() => { setRate(14); setTidalMl(500); }}>Nghỉ ngơi</button>
            <button type="button" className="bl-tab" onClick={() => { setRate(30); setTidalMl(1100); }}>Chạy bộ mạnh</button>
          </div>
          <label className="bl-slider-row">
            <header><span>Tần số hô hấp</span><b>{rate} nhịp/phút</b></header>
            <input type="range" min={8} max={36} step={1} value={rate} onChange={(e) => setRate(Number(e.target.value))} />
          </label>
          <label className="bl-slider-row" style={{ marginTop: 8 }}>
            <header><span>Thể tích khí lưu thông (TV)</span><b>{tidalMl} mL</b></header>
            <input type="range" min={350} max={1400} step={50} value={tidalMl} onChange={(e) => setTidalMl(Number(e.target.value))} />
          </label>
        </div>

        <div className="bl-kpi-grid">
          <div className="bl-kpi"><small>Thông khí phút</small><strong style={{ color: '#059669' }}>{minuteVentL} L/phút</strong></div>
          <div className="bl-kpi"><small>Áp suất phổi</small><strong>{inhaling ? 'Thấp hơn KQ' : 'Cao hơn KQ'}</strong></div>
          <div className="bl-kpi"><small>Trạng thái cơ hoành</small><strong>{inhaling ? 'Co hạ xuống' : 'Dãn cong lên'}</strong></div>
        </div>

        <div className="bl-info-card">
          <h4>Cơ chế trao đổi khí tại Phế nang (~300 triệu phế nang)</h4>
          <p>
            Không khí phế nang có phân áp <strong>pO₂ ≈ 104 mmHg</strong> cao hơn máu tĩnh mạch (40 mmHg) nên O₂ khuếch tán thụ động qua thành phế nang dày chỉ 1 lớp tế bào vào hồng cầu; ngược lại <strong>CO₂</strong> (45 → 40 mmHg) khuếch tán ra phế nang để thở ra ngoài.
          </p>
        </div>
      </div>
    </div>
  );
}
