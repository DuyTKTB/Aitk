import React, { Component, Suspense, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import BioCanvas3D from '../components/BioCanvas3D.jsx';
import { getOrganicTextures } from '../components/bioMaterials.js';

const ATLAS_SYSTEMS = {
  skeletal: {
    name: 'Hệ Xương (206 xương ngà chuẩn giải phẫu)',
    short: 'Hệ Xương',
    color: '#ede7d9',
    pinPos: [-0.94, 1.38, 0.14],
    cam: { position: [0.3, 0.7, 5.2], target: [0, 0.4, 0] },
    desc: 'Gồm hộp sọ, xương hàm, 33 đốt sống cong chữ S, xương ức, 12 đôi xương sườn ôm khoang ngực, xương đòn chữ S, khung chậu và xương chi. Nâng đỡ cơ thể, bảo vệ nội tạng và tạo hồng cầu ở tủy đỏ.',
  },
  muscular: {
    name: 'Hệ Cơ Vân (~600 cơ bám xương)',
    short: 'Hệ Cơ vân',
    color: '#f43f5e',
    pinPos: [0.96, 1.02, 0.28],
    cam: { position: [1.6, 0.9, 4.4], target: [0, 0.65, 0] },
    desc: 'Các bó sợi cơ vân đỏ–gân trắng (cơ ngực lớn, cơ thẳng bụng 6 múi, cơ delta vai, bắp tay, cơ tứ đầu đùi) co rút tạo lực vận động và sinh nhiệt duy trì 37°C.',
  },
  nervous: {
    name: 'Hệ Thần kinh (Đại não rãnh cuộn & Tủy sống)',
    short: 'Não & Thần kinh',
    color: '#facc15',
    pinPos: [0.56, 2.26, 0.16],
    cam: { position: [0.45, 2.05, 2.55], target: [0, 1.75, 0] },
    desc: 'Bộ não (~86 tỉ neuron) với vỏ não có hàng trăm nếp gấp hồi–rãnh (gyri/sulci) tăng diện tích bề mặt, tiểu não điều hòa thăng bằng, tủy sống và đám rối dây thần kinh chi.',
  },
  circulatory: {
    name: 'Hệ Tuần hoàn (Trái tim 3D GLB & Cung ĐM chủ)',
    short: 'Tim 3D & Mạch',
    color: '#ef4444',
    pinPos: [0.54, 1.18, 0.46],
    cam: { position: [0.65, 0.95, 2.6], target: [0.06, 0.72, 0.1] },
    desc: 'Trái tim 4 ngăn giải phẫu thật nằm trong khuyết tim bên phổi trái, đập nhịp đôi lub–dub bơm ~5 L/phút qua cung động mạch chủ nuôi toàn cơ thể.',
  },
  respiratory: {
    name: 'Hệ Hô hấp (Phổi phải 3 thùy · Phổi trái 2 thùy)',
    short: 'Phổi & Cơ hoành',
    color: '#fb7185',
    pinPos: [-0.72, 1.18, 0.36],
    cam: { position: [-0.6, 1.0, 2.9], target: [0, 0.76, 0.05] },
    desc: 'Khí quản có các vòng sụn chữ C chia nhánh phế quản vào phổi phải (3 thùy) và phổi trái (2 thùy, có khuyết tim), co giãn liên tục nhờ vòm cơ hoành và cơ liên sườn.',
  },
  digestive: {
    name: 'Hệ Tiêu hóa (Gan 2 thùy, Dạ dày chữ J & Ruột)',
    short: 'Gan · Dạ dày · Ruột',
    color: '#22c55e',
    pinPos: [0.52, 0.46, 0.48],
    cam: { position: [0.4, 0.3, 2.9], target: [0, 0.05, 0.1] },
    desc: 'Gan nâu đỏ tiết dịch mật dự trữ trong túi mật xanh ngọc; dạ dày hình chữ J co bóp tiết HCl + Pepsin; ruột non dài ~6m hấp thụ dinh dưỡng trong lòng khung ruột già.',
  },
};

/* ── ErrorBoundary cục bộ để tải Trái tim .glb thật an toàn tuyệt đối ── */
class HeartGlbBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { err: false };
  }
  static getDerivedStateFromError() {
    return { err: true };
  }
  render() {
    return this.state.err ? this.props.fallback : this.props.children;
  }
}

function RealHeartGLB({ onSelect }) {
  const { scene } = useGLTF('/models/heart-3d.glb');
  const cloned = useMemo(() => {
    const c = scene.clone(true);
    const box = new THREE.Box3().setFromObject(c);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const s = 0.44 / maxDim;
    c.scale.setScalar(s);
    c.position.set(-center.x * s, -center.y * s, -center.z * s);
    return c;
  }, [scene]);

  return (
    <primitive
      object={cloned}
      onClick={(e) => {
        e.stopPropagation();
        onSelect('circulatory');
      }}
    />
  );
}

function ProceduralHeartFallback({ glow, onSelect }) {
  return (
    <mesh
      scale={[0.92, 1.12, 0.85]}
      rotation={[0, 0, -0.26]}
      onClick={(e) => { e.stopPropagation(); onSelect('circulatory'); }}
    >
      <sphereGeometry args={[0.19, 28, 22]} />
      <meshPhysicalMaterial color="#b91c1c" roughness={0.2} clearcoat={1} emissive="#ef4444" emissiveIntensity={glow + 0.25} />
    </mesh>
  );
}

function HumanBodyScene({ layers, explode, selected, onSelect, autoRotate, xray, showLabels }) {
  const rootRef = useRef(null);
  const heartRef = useRef(null);
  const lungRRef = useRef(null);
  const lungLRef = useRef(null);
  const diaphragmRef = useRef(null);

  const brainTex = useMemo(() => getOrganicTextures('brain', 2), []);
  const lungTex = useMemo(() => getOrganicTextures('lung', 2), []);
  const muscleTex = useMemo(() => getOrganicTextures('muscle', 2), []);
  const boneTex = useMemo(() => getOrganicTextures('bone', 2), []);
  const organTex = useMemo(() => getOrganicTextures('organ', 2), []);

  // Hình khối thân người giải phẫu tự nhiên bằng LatheGeometry (hông -> eo -> ngực -> vai -> cổ)
  const torsoGeo = useMemo(() => {
    const pts = [
      new THREE.Vector2(0.01, -0.34),
      new THREE.Vector2(0.42, -0.28),
      new THREE.Vector2(0.48, -0.05),
      new THREE.Vector2(0.41, 0.28),
      new THREE.Vector2(0.45, 0.64),
      new THREE.Vector2(0.55, 1.15),
      new THREE.Vector2(0.62, 1.48),
      new THREE.Vector2(0.24, 1.64),
      new THREE.Vector2(0.18, 1.82),
      new THREE.Vector2(0.01, 1.84),
    ];
    return new THREE.LatheGeometry(pts, 36);
  }, []);

  // Đường cong mạch máu & khung ruột
  const curves = useMemo(() => {
    const aorta = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.06, 1.18, 0.12),
      new THREE.Vector3(0.04, 1.46, 0.08),
      new THREE.Vector3(-0.05, 1.5, -0.03),
      new THREE.Vector3(-0.08, 1.24, -0.1),
      new THREE.Vector3(-0.06, 0.06, -0.08),
    ]);
    const venaCava = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.13, 1.66, 0.02),
      new THREE.Vector3(-0.13, 1.16, 0.06),
      new THREE.Vector3(-0.12, 0.08, -0.02),
    ]);
    const colon = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.24, 0.0, 0.1),
      new THREE.Vector3(-0.27, 0.44, 0.12),
      new THREE.Vector3(0, 0.48, 0.17),
      new THREE.Vector3(0.27, 0.44, 0.12),
      new THREE.Vector3(0.24, 0.0, 0.1),
      new THREE.Vector3(0.02, -0.12, 0.06),
    ]);
    const nerveL = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.04, 1.56, -0.12),
      new THREE.Vector3(-0.48, 1.5, -0.05),
      new THREE.Vector3(-0.76, 0.94, -0.02),
      new THREE.Vector3(-0.86, 0.22, 0.04),
    ]);
    const nerveR = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.04, 1.56, -0.12),
      new THREE.Vector3(0.48, 1.5, -0.05),
      new THREE.Vector3(0.76, 0.94, -0.02),
      new THREE.Vector3(0.86, 0.22, 0.04),
    ]);
    return { aorta, venaCava, colon, nerveL, nerveR };
  }, []);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    if (rootRef.current && autoRotate) {
      rootRef.current.rotation.y += dt * 0.2;
    }
    if (heartRef.current) {
      const cycle = (t * 1.15) % 1;
      const lub = Math.exp(-Math.pow((cycle - 0.14) / 0.045, 2));
      const dub = 0.55 * Math.exp(-Math.pow((cycle - 0.3) / 0.04, 2));
      const beat = 1 + (lub + dub) * 0.06;
      heartRef.current.scale.setScalar(beat);
    }
    const breath = Math.sin(t * 1.5);
    if (lungRRef.current && lungLRef.current) {
      const sx = 1 + breath * 0.045;
      const sy = 1 + breath * 0.028;
      lungRRef.current.scale.set(sx, sy, sx);
      lungLRef.current.scale.set(sx, sy, sx);
    }
    if (diaphragmRef.current) {
      diaphragmRef.current.position.y = 0.76 - breath * 0.045;
    }
  });

  const ex = explode / 100;
  const glow = (k) => (selected === k ? 0.55 : xray ? 0.35 : 0.08);
  const boneMat = {
    color: xray ? '#7dd3fc' : '#f3eee2',
    map: xray ? null : boneTex.map,
    bumpMap: boneTex.bumpMap,
    bumpScale: 0.018,
    roughness: 0.38,
    metalness: 0.06,
    clearcoat: 0.35,
    transparent: xray,
    opacity: xray ? 0.48 : 1,
    emissive: xray ? '#38bdf8' : '#e2e8f0',
    emissiveIntensity: glow('skeletal'),
  };

  return (
    <group ref={rootRef} position={[0, -0.45, 0]}>
      {/* 1. HỆ XƯƠNG NGÀ CHUẨN GIẢI PHẪU */}
      {layers.skeletal && (
        <group onClick={(e) => { e.stopPropagation(); onSelect('skeletal'); }}>
          {/* Hộp sọ + Xương gò má + Hàm dưới */}
          <mesh position={[0, 2.15, -0.02]} scale={[0.92, 1.06, 1.05]}>
            <sphereGeometry args={[0.34, 32, 24]} />
            <meshPhysicalMaterial {...boneMat} />
          </mesh>
          <mesh position={[0, 1.85, 0.14]} scale={[0.84, 0.54, 0.72]}>
            <sphereGeometry args={[0.23, 20, 16]} />
            <meshPhysicalMaterial {...boneMat} />
          </mesh>
          {/* 16 Đốt sống cổ – ngực – thắt lưng cong chữ S có mỏm gai */}
          {Array.from({ length: 16 }).map((_, idx) => {
            const y = 1.76 - idx * 0.125;
            const z = -0.17 + Math.sin(idx * 0.42) * 0.042;
            return (
              <group key={idx} position={[0, y, z]}>
                <mesh>
                  <cylinderGeometry args={[0.072, 0.078, 0.085, 14]} />
                  <meshPhysicalMaterial {...boneMat} />
                </mesh>
                <mesh position={[0, -0.01, -0.075]} rotation={[0.45, 0, 0]}>
                  <boxGeometry args={[0.032, 0.045, 0.085]} />
                  <meshPhysicalMaterial {...boneMat} />
                </mesh>
              </group>
            );
          })}
          {/* Xương ức + Đôi xương đòn chữ S */}
          <mesh position={[0, 1.22, 0.32]}>
            <capsuleGeometry args={[0.052, 0.54, 8, 12]} />
            <meshPhysicalMaterial {...boneMat} />
          </mesh>
          {[-0.36, 0.36].map((x, idx) => (
            <mesh key={idx} position={[x, 1.57, 0.16]} rotation={[0, 0, idx === 0 ? -0.15 : 0.15]}>
              <capsuleGeometry args={[0.032, 0.5, 8, 12]} />
              <meshPhysicalMaterial {...boneMat} />
            </mesh>
          ))}
          {/* 9 Đôi xương sườn cong ôm lồng ngực */}
          {[1.5, 1.41, 1.32, 1.23, 1.14, 1.05, 0.96, 0.87, 0.78].map((y, idx) => (
            <mesh key={idx} position={[0, y, 0.04]} rotation={[Math.PI / 2, 0, 0]} scale={[1.1, 0.73, 1]}>
              <torusGeometry args={[0.455 - Math.abs(idx - 3) * 0.02, 0.022, 10, 36]} />
              <meshPhysicalMaterial {...boneMat} />
            </mesh>
          ))}
          {/* Khung chậu */}
          <mesh position={[0, -0.18, 0]} scale={[1.4, 0.58, 0.78]}>
            <torusGeometry args={[0.33, 0.08, 14, 28]} />
            <meshPhysicalMaterial {...boneMat} />
          </mesh>
          {/* Chi trên & Chi dưới có khớp cầu */}
          {[-1, 1].map((side) => (
            <group key={side}>
              <mesh position={[side * 0.69, 1.52, 0]}>
                <sphereGeometry args={[0.092, 16, 14]} />
                <meshPhysicalMaterial {...boneMat} />
              </mesh>
              <mesh position={[side * 0.75, 1.12, 0]} rotation={[0, 0, side * -0.09]}>
                <capsuleGeometry args={[0.052, 0.64, 8, 12]} />
                <meshPhysicalMaterial {...boneMat} />
              </mesh>
              <mesh position={[side * 0.83, 0.44, 0.04]} rotation={[0.08, 0, side * -0.06]}>
                <capsuleGeometry args={[0.042, 0.58, 8, 12]} />
                <meshPhysicalMaterial {...boneMat} />
              </mesh>
              <mesh position={[side * 0.25, -0.68, 0]}>
                <capsuleGeometry args={[0.068, 0.82, 10, 14]} />
                <meshPhysicalMaterial {...boneMat} />
              </mesh>
              <mesh position={[side * 0.25, -1.16, 0.04]}>
                <sphereGeometry args={[0.08, 16, 14]} />
                <meshPhysicalMaterial {...boneMat} />
              </mesh>
              <mesh position={[side * 0.25, -1.62, 0]}>
                <capsuleGeometry args={[0.056, 0.76, 10, 14]} />
                <meshPhysicalMaterial {...boneMat} />
              </mesh>
            </group>
          ))}
        </group>
      )}

      {/* 2. HỆ CƠ VÂN & VỎ THÂN GIẢI PHẪU LATHE (raycast={() => null} để KHÔNG chặn click vào Tim, Phổi, Gan, Não bên trong!) */}
      {layers.muscular && (
        <group position={[0, 0, ex * 0.88]}>
          {/* Vỏ thân người chuẩn tỉ lệ bằng LatheGeometry */}
          <mesh geometry={torsoGeo} scale={[1.04, 1, 0.68]} raycast={() => null}>
            <meshPhysicalMaterial
              color={xray ? '#38bdf8' : '#e11d48'}
              map={xray ? null : muscleTex.map}
              bumpMap={muscleTex.bumpMap}
              bumpScale={0.025}
              transparent
              opacity={xray ? 0.14 : 0.22}
              roughness={0.26}
              clearcoat={0.85}
              emissive={xray ? '#0ea5e9' : '#9f1239'}
              emissiveIntensity={glow('muscular')}
              depthWrite={false}
            />
          </mesh>
          {/* Cơ ngực lớn (Pectoralis major) phủ vân thớ cơ vân */}
          {[-0.25, 0.25].map((x, i) => (
            <mesh key={i} position={[x, 1.3, 0.28]} scale={[1.12, 0.78, 0.42]} raycast={() => null}>
              <sphereGeometry args={[0.24, 22, 18]} />
              <meshPhysicalMaterial
                map={xray ? null : muscleTex.map}
                bumpMap={muscleTex.bumpMap}
                bumpScale={0.03}
                color={xray ? '#38bdf8' : '#f43f5e'}
                transparent
                opacity={xray ? 0.2 : 0.36}
                roughness={0.32}
                depthWrite={false}
              />
            </mesh>
          ))}
          {/* Cơ thẳng bụng 6 múi (Rectus abdominis) */}
          {[0.82, 0.58, 0.34].map((y, rIdx) =>
            [-0.12, 0.12].map((x, cIdx) => (
              <mesh key={`${rIdx}_${cIdx}`} position={[x, y, 0.29]} scale={[0.92, 0.85, 0.38]} raycast={() => null}>
                <sphereGeometry args={[0.11, 14, 12]} />
                <meshPhysicalMaterial
                  map={xray ? null : muscleTex.map}
                  color={xray ? '#38bdf8' : '#e11d48'}
                  transparent
                  opacity={xray ? 0.14 : 0.3}
                  roughness={0.35}
                  depthWrite={false}
                />
              </mesh>
            ))
          )}
          {/* Cơ Delta vai (có thể bấm chọn Hệ cơ ở 2 bên vai) */}
          {[-0.72, 0.72].map((x, i) => (
            <mesh key={i} position={[x, 1.46, 0]} scale={[0.92, 1.18, 0.85]} onClick={(e) => { e.stopPropagation(); onSelect('muscular'); }}>
              <sphereGeometry args={[0.16, 20, 16]} />
              <meshPhysicalMaterial
                map={xray ? null : muscleTex.map}
                bumpMap={muscleTex.bumpMap}
                bumpScale={0.03}
                color={xray ? '#38bdf8' : '#f43f5e'}
                transparent
                opacity={xray ? 0.2 : 0.42}
                roughness={0.32}
                depthWrite={false}
              />
            </mesh>
          ))}
        </group>
      )}

      {/* 3. HỆ THẦN KINH — ĐẠI NÃO VỚI RÃNH CUỘN GYRI/SULCI NỔI 3D */}
      {layers.nervous && (
        <group position={[0, ex * 0.48, -ex * 0.55]} onClick={(e) => { e.stopPropagation(); onSelect('nervous'); }}>
          {[-0.128, 0.128].map((x, i) => (
            <mesh key={i} position={[x, 2.18, 0.01]} scale={[0.94, 0.86, 1.18]}>
              <sphereGeometry args={[0.225, 32, 24]} />
              <meshPhysicalMaterial
                color={xray ? '#fde047' : '#f1c7b8'}
                map={xray ? null : brainTex.map}
                bumpMap={brainTex.bumpMap}
                bumpScale={0.055}
                roughness={0.32}
                clearcoat={0.65}
                emissive="#eab308"
                emissiveIntensity={glow('nervous') + 0.12}
              />
            </mesh>
          ))}
          {/* Tiểu não */}
          <mesh position={[0, 1.94, -0.18]} scale={[1.22, 0.72, 0.85]}>
            <sphereGeometry args={[0.145, 22, 16]} />
            <meshPhysicalMaterial
              color="#eab8a8"
              map={brainTex.map}
              bumpMap={brainTex.bumpMap}
              bumpScale={0.04}
              roughness={0.38}
              emissive="#f59e0b"
              emissiveIntensity={0.22}
            />
          </mesh>
          {/* Tủy sống & Đám rối thần kinh cánh tay */}
          <mesh position={[0, 0.86, -0.14]}>
            <cylinderGeometry args={[0.038, 0.032, 2.15, 12]} />
            <meshStandardMaterial color="#fef08a" emissive="#facc15" emissiveIntensity={0.75} />
          </mesh>
          <mesh>
            <tubeGeometry args={[curves.nerveL, 36, 0.016, 8, false]} />
            <meshStandardMaterial color="#fef08a" emissive="#facc15" emissiveIntensity={0.85} />
          </mesh>
          <mesh>
            <tubeGeometry args={[curves.nerveR, 36, 0.016, 8, false]} />
            <meshStandardMaterial color="#fef08a" emissive="#facc15" emissiveIntensity={0.85} />
          </mesh>
        </group>
      )}

      {/* 4. HỆ HÔ HẤP — PHỔI PHẢI 3 THÙY & PHỔI TRÁI 2 THÙY CÓ VÂN MAO MẠCH */}
      {layers.respiratory && (
        <group position={[0, 0, ex * 0.35]} onClick={(e) => { e.stopPropagation(); onSelect('respiratory'); }}>
          {/* Khí quản & Vòng sụn chữ C */}
          <mesh position={[0, 1.56, 0.04]}>
            <cylinderGeometry args={[0.052, 0.056, 0.48, 16]} />
            <meshPhysicalMaterial color="#e2e8f0" roughness={0.3} clearcoat={0.7} />
          </mesh>
          {[1.4, 1.47, 1.54, 1.61, 1.68].map((y, i) => (
            <mesh key={i} position={[0, y, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.058, 0.011, 8, 20]} />
              <meshStandardMaterial color="#bae6fd" />
            </mesh>
          ))}

          {/* Phổi phải (3 thùy xếp chồng giải phẫu) */}
          <group ref={lungRRef} position={[-0.29 - ex * 0.48, 1.15, 0.05]}>
            <mesh position={[0.02, 0.2, 0]} scale={[0.72, 0.85, 0.72]}>
              <sphereGeometry args={[0.24, 24, 18]} />
              <meshPhysicalMaterial color={xray ? '#38bdf8' : '#e295a2'} map={xray ? null : lungTex.map} bumpMap={lungTex.bumpMap} bumpScale={0.04} transparent opacity={0.84} roughness={0.28} clearcoat={0.75} emissive="#e11d48" emissiveIntensity={glow('respiratory')} />
            </mesh>
            <mesh position={[-0.02, -0.02, 0.02]} scale={[0.84, 0.78, 0.76]}>
              <sphereGeometry args={[0.25, 24, 18]} />
              <meshPhysicalMaterial color={xray ? '#38bdf8' : '#d88594'} map={xray ? null : lungTex.map} bumpMap={lungTex.bumpMap} bumpScale={0.04} transparent opacity={0.84} roughness={0.28} clearcoat={0.75} emissive="#e11d48" emissiveIntensity={glow('respiratory')} />
            </mesh>
            <mesh position={[-0.03, -0.22, -0.02]} scale={[0.88, 0.72, 0.78]}>
              <sphereGeometry args={[0.24, 24, 18]} />
              <meshPhysicalMaterial color={xray ? '#38bdf8' : '#cf7888'} map={xray ? null : lungTex.map} bumpMap={lungTex.bumpMap} bumpScale={0.04} transparent opacity={0.84} roughness={0.28} clearcoat={0.75} emissive="#e11d48" emissiveIntensity={glow('respiratory')} />
            </mesh>
          </group>

          {/* Phổi trái (2 thùy, nhỏ hơn & có khuyết tim nhường chỗ cho trái tim GLB) */}
          <group ref={lungLRef} position={[0.31 + ex * 0.48, 1.15, 0.04]}>
            <mesh position={[-0.01, 0.14, 0]} scale={[0.72, 0.92, 0.72]}>
              <sphereGeometry args={[0.24, 24, 18]} />
              <meshPhysicalMaterial color={xray ? '#38bdf8' : '#e295a2'} map={xray ? null : lungTex.map} bumpMap={lungTex.bumpMap} bumpScale={0.04} transparent opacity={0.84} roughness={0.28} clearcoat={0.75} emissive="#e11d48" emissiveIntensity={glow('respiratory')} />
            </mesh>
            <mesh position={[0.04, -0.16, -0.01]} scale={[0.78, 0.82, 0.76]}>
              <sphereGeometry args={[0.23, 24, 18]} />
              <meshPhysicalMaterial color={xray ? '#38bdf8' : '#cf7888'} map={xray ? null : lungTex.map} bumpMap={lungTex.bumpMap} bumpScale={0.04} transparent opacity={0.84} roughness={0.28} clearcoat={0.75} emissive="#e11d48" emissiveIntensity={glow('respiratory')} />
            </mesh>
          </group>

          {/* Vòm cơ hoành */}
          <mesh ref={diaphragmRef} position={[0, 0.76, 0.05]} scale={[1.45, 0.32, 0.92]}>
            <sphereGeometry args={[0.31, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshPhysicalMaterial color="#fb7185" map={muscleTex.map} transparent opacity={0.65} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}

      {/* 5. HỆ TUẦN HOÀN — NHÚNG TRỰC TIẾP TRÁI TIM GIẢI PHẪU GLB THẬT */}
      {layers.circulatory && (
        <group position={[0, 0, ex * 0.58]}>
          <group ref={heartRef} position={[0.07, 1.12, 0.17]}>
            <HeartGlbBoundary fallback={<ProceduralHeartFallback glow={glow('circulatory')} onSelect={onSelect} />}>
              <Suspense fallback={<ProceduralHeartFallback glow={glow('circulatory')} onSelect={onSelect} />}>
                <RealHeartGLB onSelect={onSelect} />
              </Suspense>
            </HeartGlbBoundary>
          </group>
          <mesh onClick={(e) => { e.stopPropagation(); onSelect('circulatory'); }}>
            <tubeGeometry args={[curves.aorta, 48, 0.036, 14, false]} />
            <meshPhysicalMaterial color="#dc2626" roughness={0.22} clearcoat={0.9} emissive="#ef4444" emissiveIntensity={0.25} />
          </mesh>
          <mesh onClick={(e) => { e.stopPropagation(); onSelect('circulatory'); }}>
            <tubeGeometry args={[curves.venaCava, 32, 0.034, 14, false]} />
            <meshPhysicalMaterial color="#1d4ed8" roughness={0.22} clearcoat={0.9} emissive="#3b82f6" emissiveIntensity={0.25} />
          </mesh>
        </group>
      )}

      {/* 6. HỆ TIÊU HÓA CÓ VÂN MÔ HỮU CƠ */}
      {layers.digestive && (
        <group position={[0, -ex * 0.32, ex * 0.26]} onClick={(e) => { e.stopPropagation(); onSelect('digestive'); }}>
          <mesh position={[-0.2, 0.66, 0.14]} scale={[1.32, 0.58, 0.72]} rotation={[0, 0, 0.18]}>
            <sphereGeometry args={[0.22, 24, 18]} />
            <meshPhysicalMaterial color="#883018" map={organTex.map} bumpMap={organTex.bumpMap} bumpScale={0.025} roughness={0.28} clearcoat={0.85} emissive="#9a3412" emissiveIntensity={glow('digestive')} />
          </mesh>
          <mesh position={[-0.14, 0.53, 0.18]}>
            <sphereGeometry args={[0.058, 14, 12]} />
            <meshPhysicalMaterial color="#059669" roughness={0.2} clearcoat={0.9} emissive="#10b981" emissiveIntensity={0.45} />
          </mesh>
          <mesh position={[0.17, 0.58, 0.13]} rotation={[0, 0, -0.52]} scale={[0.92, 1.2, 0.74]}>
            <capsuleGeometry args={[0.115, 0.19, 12, 18]} />
            <meshPhysicalMaterial color="#e07a5f" map={organTex.map} bumpMap={organTex.bumpMap} bumpScale={0.03} roughness={0.28} clearcoat={0.75} emissive="#d97706" emissiveIntensity={glow('digestive')} />
          </mesh>
          <mesh>
            <tubeGeometry args={[curves.colon, 48, 0.058, 14, false]} />
            <meshPhysicalMaterial color="#b07d62" map={organTex.map} bumpMap={organTex.bumpMap} bumpScale={0.03} roughness={0.34} clearcoat={0.6} emissive="#16a34a" emissiveIntensity={glow('digestive') * 0.6} />
          </mesh>
          <mesh position={[0, 0.2, 0.11]} scale={[0.94, 0.74, 0.54]}>
            <torusKnotGeometry args={[0.2, 0.048, 84, 14, 2, 3]} />
            <meshPhysicalMaterial color="#e29578" map={organTex.map} bumpMap={organTex.bumpMap} bumpScale={0.03} roughness={0.3} clearcoat={0.7} emissive="#22c55e" emissiveIntensity={glow('digestive') * 0.5} />
          </mesh>
        </group>
      )}

      {/* Nhãn 3D tương tác (KHÔNG distanceFactor -> luôn nhỏ gọn sắc nét 11px) */}
      {Object.entries(ATLAS_SYSTEMS).map(([k, meta]) => {
        if (!layers[k]) return null;
        if (!showLabels && selected !== k) return null;
        return (
          <Html key={k} position={meta.pinPos} center zIndexRange={[10, 0]}>
            <button
              type="button"
              className={`bl-3d-pin${selected === k ? ' active' : ''}`}
              style={{ '--pin-col': meta.color }}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(k);
              }}
            >
              <i />
              <span>{meta.short}</span>
            </button>
          </Html>
        );
      })}
    </group>
  );
}

export default function HumanAtlas3DSim() {
  const [selected, setSelected] = useState('circulatory');
  const [explode, setExplode] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [xray, setXray] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [focusView, setFocusView] = useState(null);
  const [layers, setLayers] = useState({
    skeletal: true,
    muscular: true,
    nervous: true,
    circulatory: true,
    respiratory: true,
    digestive: true,
  });

  const sel = ATLAS_SYSTEMS[selected] || ATLAS_SYSTEMS.circulatory;

  const pickSystem = (key, flyTo = false) => {
    setSelected(key);
    if (flyTo && ATLAS_SYSTEMS[key]?.cam) {
      setAutoRotate(false);
      setFocusView({ ...ATLAS_SYSTEMS[key].cam, _t: Date.now() });
    }
  };

  const isolateSystem = (key) => {
    const next = {};
    Object.keys(ATLAS_SYSTEMS).forEach((k) => { next[k] = k === key; });
    setLayers(next);
    pickSystem(key, true);
  };

  const showAll = () => {
    const next = {};
    Object.keys(ATLAS_SYSTEMS).forEach((k) => { next[k] = true; });
    setLayers(next);
    setFocusView({ position: [0.25, 0.55, 5.4], target: [0, 0.4, 0], _t: Date.now() });
  };

  return (
    <div className="bl-grid-2">
      <div>
        <div className="bl-tabs">
          <button type="button" className="bl-tab" onClick={showAll}>Toàn thân (6 hệ)</button>
          <button type="button" className="bl-tab" onClick={() => isolateSystem(selected)}>Cô lập hệ đang chọn</button>
          <button type="button" className={`bl-tab${xray ? ' on' : ''}`} onClick={() => setXray((v) => !v)}>
            {xray ? 'X-Quang Hologram: Bật' : 'Chế độ X-Quang'}
          </button>
          <button type="button" className={`bl-tab${showLabels ? ' on' : ''}`} onClick={() => setShowLabels((v) => !v)}>
            {showLabels ? 'Nhãn 3D: Bật' : 'Nhãn 3D: Tắt'}
          </button>
          <button type="button" className={`bl-tab${autoRotate ? ' on' : ''}`} onClick={() => setAutoRotate((v) => !v)}>
            {autoRotate ? 'Tự xoay: Bật' : 'Tự xoay: Tắt'}
          </button>
        </div>

        <BioCanvas3D
          camera={{ position: [0.25, 0.55, 5.4], fov: 42 }}
          focusView={focusView}
          height={495}
          studioTheme={xray ? 'holo' : 'deep'}
          shadowY={-2.55}
          badge={xray ? 'Medical X-Ray Hologram 3D' : 'Human Atlas 3D · Tim GLB · Phổi 3/2 thùy · Não Gyri'}
        >
          <HumanBodyScene
            layers={layers}
            explode={explode}
            selected={selected}
            onSelect={(k) => pickSystem(k, true)}
            autoRotate={autoRotate}
            xray={xray}
            showLabels={showLabels}
          />
        </BioCanvas3D>
      </div>

      <div className="bl-controls">
        <div className="bl-panel bl-highlight-card" style={{ '--card-accent': sel.color }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{ width: 13, height: 13, borderRadius: '50%', background: sel.color, boxShadow: `0 0 10px ${sel.color}` }} />
              <h4 style={{ margin: 0 }}>{sel.name}</h4>
            </div>
            <button type="button" className="bl-mini-btn primary" onClick={() => pickSystem(selected, true)}>
              Zoom cận cảnh
            </button>
          </div>
          <p style={{ margin: 0, fontSize: '0.83rem', lineHeight: 1.58 }}>{sel.desc}</p>
        </div>

        <div className="bl-panel">
          <h4>Tách lớp Giải phẫu &amp; Bật/Tắt Hệ cơ quan</h4>
          <label className="bl-slider-row" style={{ marginBottom: 8 }}>
            <header><span>Tách rời cấu trúc (Explode View)</span><b>{explode}%</b></header>
            <input type="range" min={0} max={100} step={5} value={explode} onChange={(e) => setExplode(Number(e.target.value))} />
          </label>
          <div className="bl-check-list">
            {Object.entries(ATLAS_SYSTEMS).map(([key, meta]) => (
              <div
                key={key}
                className="bl-check-chip"
                style={selected === key ? { borderColor: meta.color, background: 'rgba(47,107,255,0.14)' } : undefined}
              >
                <input
                  type="checkbox"
                  checked={!!layers[key]}
                  onChange={() => setLayers((l) => ({ ...l, [key]: !l[key] }))}
                />
                <button
                  type="button"
                  onClick={() => pickSystem(key, true)}
                  style={{ border: 0, background: 'transparent', color: 'inherit', font: 'inherit', padding: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                >
                  <i style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color, display: 'inline-block' }} />
                  {meta.short}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
