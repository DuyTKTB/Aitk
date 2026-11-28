import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import BioCanvas3D from '../components/BioCanvas3D.jsx';
import { analyzeDnaSequence } from '../bioEngine.js';

const BASE_COLOR = { A: '#ef4444', T: '#f59e0b', G: '#3b82f6', C: '#10b981' };

/* ── Vòng Hexamer 6 tiểu phần của Enzyme Helicase ── */
function HelicaseRing({ y }) {
  const ringRef = useRef(null);
  useFrame((_, dt) => {
    if (ringRef.current) ringRef.current.rotation.y += dt * 1.9;
  });
  return (
    <group ref={ringRef} position={[0, y, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.42, 0.085, 16, 36]} />
        <meshPhysicalMaterial
          color="#9333ea"
          roughness={0.2}
          metalness={0.25}
          clearcoat={1}
          emissive="#c084fc"
          emissiveIntensity={0.65}
        />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map((k) => {
        const a = (k / 6) * Math.PI * 2;
        return (
          <mesh key={k} position={[Math.cos(a) * 0.42, 0, Math.sin(a) * 0.42]}>
            <sphereGeometry args={[0.13, 16, 14]} />
            <meshPhysicalMaterial
              color="#a855f7"
              roughness={0.22}
              clearcoat={0.9}
              emissive="#d8b4fe"
              emissiveIntensity={0.5}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function DnaHelixScene({ template, coding, unzip, autoRotate, showLabels }) {
  const rootRef = useRef(null);

  const pairs = useMemo(() => {
    const n = Math.min(22, template.length);
    return Array.from({ length: n }, (_, i) => ({
      i,
      b1: template[i],
      b2: coding[i],
    }));
  }, [template, coding]);

  const unzipIndex = Math.floor((unzip / 100) * pairs.length);

  // Tính tọa độ 3D liên tục cho 2 khung Đường-Phosphate để vẽ TubeGeometry uốn lượn
  const geometryData = useMemo(() => {
    const strand1Pts = [];
    const strand2Pts = [];
    const items = pairs.map(({ i, b1, b2 }) => {
      const y = (i - (pairs.length - 1) / 2) * 0.34;
      const isOpen = i < unzipIndex;
      const openRatio = isOpen ? Math.min(1, (unzipIndex - i) / 5.5) : 0;
      const angle = i * 0.54 * (1 - openRatio * 0.68);
      const radius = 0.98 + openRatio * 1.25;

      const x1 = Math.cos(angle) * radius;
      const z1 = Math.sin(angle) * radius;
      const x2 = -x1;
      const z2 = -z1;

      strand1Pts.push(new THREE.Vector3(x1, y, z1));
      strand2Pts.push(new THREE.Vector3(x2, y, z2));

      const hBonds = (b1 === 'G' || b1 === 'C') ? 3 : 2;
      return { i, y, b1, b2, isOpen, openRatio, angle, radius, x1, z1, x2, z2, hBonds };
    });

    const curve1 = strand1Pts.length >= 2 ? new THREE.CatmullRomCurve3(strand1Pts) : null;
    const curve2 = strand2Pts.length >= 2 ? new THREE.CatmullRomCurve3(strand2Pts) : null;
    return { items, curve1, curve2 };
  }, [pairs, unzipIndex]);

  useFrame((_, dt) => {
    if (rootRef.current && autoRotate) {
      rootRef.current.rotation.y += dt * 0.32;
    }
  });

  const forkY = (unzipIndex - (pairs.length - 1) / 2) * 0.34;

  return (
    <group ref={rootRef}>
      {/* Khung Đường–Phosphate mạch 1 (3'→5') liên tục ánh kim */}
      {geometryData.curve1 && (
        <mesh>
          <tubeGeometry args={[geometryData.curve1, 120, 0.082, 14, false]} />
          <meshPhysicalMaterial
            color="#e2e8f0"
            roughness={0.2}
            metalness={0.35}
            clearcoat={1}
            emissive="#38bdf8"
            emissiveIntensity={0.14}
          />
        </mesh>
      )}

      {/* Khung Đường–Phosphate mạch 2 (5'→3') liên tục ánh xanh bạc */}
      {geometryData.curve2 && (
        <mesh>
          <tubeGeometry args={[geometryData.curve2, 120, 0.082, 14, false]} />
          <meshPhysicalMaterial
            color="#94a3b8"
            roughness={0.22}
            metalness={0.4}
            clearcoat={1}
            emissive="#6366f1"
            emissiveIntensity={0.14}
          />
        </mesh>
      )}

      {/* Từng cặp Nucleotide + Liên kết Hydro 2/3 chấm sáng + Mạch mới tổng hợp */}
      {geometryData.items.map(({ i, y, b1, b2, isOpen, openRatio, angle, radius, x1, z1, x2, z2, hBonds }) => (
        <group key={i} position={[0, y, 0]}>
          {/* Nhóm Phosphate vàng óng dọc 2 khung */}
          <mesh position={[x1, 0, z1]}>
            <sphereGeometry args={[0.125, 16, 12]} />
            <meshPhysicalMaterial color="#fde68a" roughness={0.22} metalness={0.3} clearcoat={0.9} />
          </mesh>
          <mesh position={[x2, 0, z2]}>
            <sphereGeometry args={[0.125, 16, 12]} />
            <meshPhysicalMaterial color="#bae6fd" roughness={0.22} metalness={0.3} clearcoat={0.9} />
          </mesh>

          {/* Base nitơ bên mạch 1 */}
          <mesh position={[x1 * (isOpen ? 0.72 : 0.56), 0, z1 * (isOpen ? 0.72 : 0.56)]} rotation={[0, -angle, Math.PI / 2]}>
            <capsuleGeometry args={[0.058, isOpen ? 0.42 : radius * 0.68, 8, 12]} />
            <meshPhysicalMaterial
              color={BASE_COLOR[b1]}
              roughness={0.22}
              clearcoat={0.85}
              emissive={BASE_COLOR[b1]}
              emissiveIntensity={0.28}
            />
          </mesh>

          {/* Base nitơ bên mạch 2 */}
          <mesh position={[x2 * (isOpen ? 0.72 : 0.56), 0, z2 * (isOpen ? 0.72 : 0.56)]} rotation={[0, -angle, Math.PI / 2]}>
            <capsuleGeometry args={[0.058, isOpen ? 0.42 : radius * 0.68, 8, 12]} />
            <meshPhysicalMaterial
              color={BASE_COLOR[b2]}
              roughness={0.22}
              clearcoat={0.85}
              emissive={BASE_COLOR[b2]}
              emissiveIntensity={0.28}
            />
          </mesh>

          {/* 2 liên kết Hydro (A=T) hoặc 3 liên kết Hydro (G≡C) phát sáng ở giữa khi chưa tách */}
          {!isOpen && (
            <group>
              {(hBonds === 3 ? [-0.075, 0, 0.075] : [-0.048, 0.048]).map((dy, hIdx) => (
                <mesh key={hIdx} position={[0, dy, 0]}>
                  <sphereGeometry args={[0.032, 10, 8]} />
                  <meshStandardMaterial color="#ffffff" emissive="#e0f2fe" emissiveIntensity={1.2} />
                </mesh>
              ))}
            </group>
          )}

          {/* Mạch mới tổng hợp khi tháo xoắn: Mạch dẫn đầu (liên tục) & Đoạn Okazaki (gián đoạn) */}
          {isOpen && openRatio > 0.3 && (
            <>
              {/* Mạch dẫn đầu (Leading strand — liên tục) */}
              <mesh position={[x1 * 0.42, 0, z1 * 0.42]} rotation={[0, -angle, Math.PI / 2]}>
                <capsuleGeometry args={[0.052, 0.34, 8, 12]} />
                <meshPhysicalMaterial
                  color={BASE_COLOR[b2]}
                  roughness={0.2}
                  clearcoat={0.9}
                  emissive={BASE_COLOR[b2]}
                  emissiveIntensity={0.55}
                />
              </mesh>
              <mesh position={[x1 * 0.24, 0, z1 * 0.24]}>
                <sphereGeometry args={[0.088, 12, 10]} />
                <meshStandardMaterial color="#34d399" emissive="#10b981" emissiveIntensity={0.65} />
              </mesh>

              {/* Mạch gián đoạn (Lagging strand — các đoạn Okazaki cách quãng + mồi RNA màu hồng) */}
              {i % 5 !== 0 && (
                <>
                  <mesh position={[x2 * 0.42, 0, z2 * 0.42]} rotation={[0, -angle, Math.PI / 2]}>
                    <capsuleGeometry args={[0.052, 0.34, 8, 12]} />
                    <meshPhysicalMaterial
                      color={BASE_COLOR[b1]}
                      roughness={0.2}
                      clearcoat={0.9}
                      emissive={BASE_COLOR[b1]}
                      emissiveIntensity={0.55}
                    />
                  </mesh>
                  <mesh position={[x2 * 0.24, 0, z2 * 0.24]}>
                    <sphereGeometry args={[0.088, 12, 10]} />
                    <meshStandardMaterial
                      color={i % 5 === 1 ? '#f472b6' : '#fbbf24'}
                      emissive={i % 5 === 1 ? '#ec4899' : '#f59e0b'}
                      emissiveIntensity={0.7}
                    />
                  </mesh>
                </>
              )}
            </>
          )}
        </group>
      ))}

      {/* Enzyme Helicase hexamer xoay liên tục tại chạc chữ Y */}
      {unzip > 4 && unzip < 98 && (
        <>
          <HelicaseRing y={forkY} />
          {showLabels && (
            <Html position={[0.75, forkY + 0.12, 0.45]} center zIndexRange={[10, 0]}>
              <div className="bl-3d-pin active" style={{ '--pin-col': '#c084fc' }}>
                <i />
                <span>Helicase</span>
              </div>
            </Html>
          )}
        </>
      )}

      {/* Nhãn 3D cho Mạch dẫn đầu & Đoạn Okazaki khi đã mở chạc */}
      {showLabels && unzip > 30 && (
        <>
          <Html position={[1.7, -1.8, 0.4]} center zIndexRange={[10, 0]}>
            <div className="bl-3d-pin" style={{ '--pin-col': '#10b981' }}>
              <i />
              <span>Mạch dẫn đầu</span>
            </div>
          </Html>
          <Html position={[-1.7, -1.5, -0.3]} center zIndexRange={[10, 0]}>
            <div className="bl-3d-pin" style={{ '--pin-col': '#f59e0b' }}>
              <i />
              <span>Đoạn Okazaki</span>
            </div>
          </Html>
        </>
      )}
    </group>
  );
}

export default function DnaReplication3DSim() {
  const [seq, setSeq] = useState('TACCGGAAATTTGCTAGCTA');
  const [unzip, setUnzip] = useState(44);
  const [animating, setAnimating] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [rounds, setRounds] = useState(3);

  const info = useMemo(() => analyzeDnaSequence(seq, rounds), [seq, rounds]);

  useEffect(() => {
    if (!animating) return undefined;
    const t = setInterval(() => {
      setUnzip((u) => (u >= 100 ? 0 : u + 2));
    }, 85);
    return () => clearInterval(t);
  }, [animating]);

  return (
    <div className="bl-grid-2">
      <div>
        <div className="bl-tabs">
          <button type="button" className="bl-btn primary" onClick={() => setAnimating((a) => !a)}>
            {animating ? 'Dừng tách mạch' : 'Chạy Nhân đôi DNA'}
          </button>
          <button type="button" className={`bl-tab${autoRotate ? ' on' : ''}`} onClick={() => setAutoRotate((r) => !r)}>
            {autoRotate ? 'Tự xoay 3D: Bật' : 'Tự xoay 3D: Tắt'}
          </button>
          <button type="button" className={`bl-tab${showLabels ? ' on' : ''}`} onClick={() => setShowLabels((l) => !l)}>
            {showLabels ? 'Nhãn 3D: Bật' : 'Nhãn 3D: Tắt'}
          </button>
          <button type="button" className="bl-tab" onClick={() => { setAnimating(false); setUnzip(0); }}>
            Xoắn nguyên vẹn
          </button>
        </div>

        <BioCanvas3D
          camera={{ position: [0.2, 0.3, 8.1], fov: 44 }}
          height={455}
          studioTheme="holo"
          shadowY={-3.9}
          badge="DNA Xoắn Kép 3D · A=T (2H) · G≡C (3H)"
        >
          <DnaHelixScene
            template={info.template3to5}
            coding={info.coding5to3}
            unzip={unzip}
            autoRotate={autoRotate}
            showLabels={showLabels}
          />
        </BioCanvas3D>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 10, fontSize: '0.78rem', fontWeight: 700 }}>
          {Object.entries(BASE_COLOR).map(([base, col]) => (
            <span key={base} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <i style={{ width: 11, height: 11, borderRadius: 3, background: col, display: 'inline-block', boxShadow: `0 0 6px ${col}` }} />
              {base === 'A' ? 'Adenine (A)' : base === 'T' ? 'Thymine (T)' : base === 'G' ? 'Guanine (G)' : 'Cytosine (C)'}
            </span>
          ))}
          <span style={{ color: '#c084fc' }}>◎ Vòng tím: Helicase</span>
          <span style={{ color: '#f472b6' }}>● Chấm hồng: Mồi RNA</span>
        </div>
      </div>

      <div className="bl-controls">
        <div className="bl-panel">
          <h4>Tùy chỉnh Đoạn DNA &amp; Chạc chữ Y</h4>
          <label className="bl-slider-row">
            <header><span>Mức độ tháo xoắn &amp; nhân đôi</span><b>{unzip}%</b></header>
            <input type="range" min={0} max={100} step={2} value={unzip} onChange={(e) => { setAnimating(false); setUnzip(Number(e.target.value)); }} />
          </label>
          <label className="bl-slider-row" style={{ marginTop: 8 }}>
            <header><span>Trình tự mạch khuôn (3&apos; → 5&apos;)</span><b>{info.nPairs} cặp nu</b></header>
            <input
              type="text"
              className="bl-search-input"
              style={{ marginBottom: 0, fontFamily: 'monospace', letterSpacing: '0.08em' }}
              value={seq}
              maxLength={24}
              onChange={(e) => setSeq(e.target.value.toUpperCase().replace(/[^ATGCX]/g, ''))}
            />
          </label>
          <div style={{ marginTop: 8, fontSize: '0.76rem', fontFamily: 'monospace', background: 'var(--bl-surface)', padding: 9, borderRadius: 10, border: '1px solid var(--bl-border)', overflowX: 'auto' }}>
            <div><b>3&apos;–</b> {info.template3to5} <b>–5&apos;</b> (Mạch khuôn → dẫn đầu)</div>
            <div><b>5&apos;–</b> {info.coding5to3} <b>–3&apos;</b> (Mạch mã hóa → Okazaki)</div>
          </div>
        </div>

        <div className="bl-kpi-grid">
          <div className="bl-kpi"><small>Tổng số nu (N)</small><strong>{info.N}</strong></div>
          <div className="bl-kpi"><small>Liên kết Hydro (H)</small><strong>{info.hydrogenBonds}</strong></div>
          <div className="bl-kpi"><small>Chiều dài (L)</small><strong>{info.lengthAngstrom} Å</strong></div>
          <div className="bl-kpi"><small>Số chu kì xoắn</small><strong>{info.turns}</strong></div>
        </div>

        <div className="bl-panel">
          <h4>Tính nhanh Nhân đôi k lần (Bán bảo toàn)</h4>
          <label className="bl-slider-row">
            <header><span>Số lần tái bản k</span><b>k = {rounds}</b></header>
            <input type="range" min={1} max={6} step={1} value={rounds} onChange={(e) => setRounds(Number(e.target.value))} />
          </label>
          <div className="bl-kpi-grid">
            <div className="bl-kpi"><small>DNA con (2ᵏ)</small><strong>{info.replication.totalDaughters}</strong></div>
            <div className="bl-kpi"><small>Mới hoàn toàn</small><strong>{info.replication.newOnlyDaughters}</strong></div>
            <div className="bl-kpi"><small>Nu môi trường</small><strong>{info.replication.nuEnvNeeded}</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
}
