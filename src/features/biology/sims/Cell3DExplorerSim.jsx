import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import BioCanvas3D from '../components/BioCanvas3D.jsx';
import { getOrganicTextures } from '../components/bioMaterials.js';

const ORGANELLES = {
  membrane: {
    name: 'Màng sinh chất (Lớp kép Phospholipid)',
    short: 'Màng sinh chất',
    color: '#38bdf8',
    both: true,
    pinPos: [2.25, 0.72, 0.52],
    cam: { position: [3.8, 1.4, 4.8], target: [0, 0, 0] },
    structure: 'Cấu trúc khảm động gồm lớp kép phospholipid kị nước ở giữa, cholesterol ổn định màng và các kênh protein xuyên màng.',
    fn: 'Bao bọc tế bào, vận chuyển chọn lọc ion/chất tan (thụ động & chủ động qua kênh protein), tiếp nhận tín hiệu tế bào.',
  },
  cellWall: {
    name: 'Thành tế bào Cellulose',
    short: 'Thành cellulose',
    color: '#16a34a',
    plantOnly: true,
    pinPos: [2.38, 1.38, 0.85],
    cam: { position: [4.2, 1.8, 5.2], target: [0, 0, 0] },
    structure: 'Lớp vỏ cứng dày bao ngoài màng sinh chất, đan chéo từ các vi sợi cellulose và có cầu sinh chất nối giữa các tế bào.',
    fn: 'Quy định hình dạng ổn định cho tế bào thực vật, bảo vệ cơ học và ngăn tế bào bị vỡ trong môi trường nhược trương.',
  },
  nucleus: {
    name: 'Nhân tế bào (Nucleus)',
    short: 'Nhân tế bào',
    color: '#8b5cf6',
    both: true,
    pinPos: [0, 0.96, 0.35],
    cam: { position: [0.6, 0.85, 3.2], target: [0, 0.16, 0] },
    structure: 'Màng nhân kép đục hàng nghìn lỗ nhân (nuclear pores), bên trong chứa dịch nhân, sợi nhiễm sắc chất (DNA + histone) và nhân con đậm đặc.',
    fn: 'Trung tâm điều khiển mọi hoạt động sống của tế bào; lưu giữ, nhân đôi DNA và phiên mã thông tin di truyền.',
  },
  mitochondria: {
    name: 'Ti thể (Mitochondria)',
    short: 'Ti thể',
    color: '#f97316',
    both: true,
    pinPos: [1.22, -0.74, 0.72],
    cam: { position: [2.3, -0.45, 2.7], target: [1.15, -0.75, 0.65] },
    structure: 'Màng kép: màng ngoài nhẵn, màng trong gấp nếp sâu tạo các mào (cristae) mang hệ enzyme chuỗi truyền electron; có DNA vòng & ribosome 70S riêng.',
    fn: '“Nhà máy năng lượng” của tế bào: thực hiện hô hấp hiếu khí tạo phần lớn ATP (30–32 ATP/glucose).',
  },
  chloroplast: {
    name: 'Lục lạp (Chloroplast)',
    short: 'Lục lạp',
    color: '#22c55e',
    plantOnly: true,
    pinPos: [-1.42, -0.22, -0.42],
    cam: { position: [-2.8, 0.25, 2.8], target: [-1.3, -0.22, -0.5] },
    structure: 'Màng kép bao quanh chất nền stroma chứa các chồng túi dẹt tilacoit (grana) giàu diệp lục, nối nhau bằng phiến stroma.',
    fn: 'Hấp thụ năng lượng ánh sáng mặt trời thực hiện quang hợp tổng hợp chất hữu cơ (glucose) và giải phóng O₂.',
  },
  vacuole: {
    name: 'Không bào trung tâm (Central Vacuole)',
    short: 'Không bào lớn',
    color: '#06b6d4',
    plantOnly: true,
    pinPos: [0.88, -0.05, 0.42],
    cam: { position: [2.8, 0.6, 3.8], target: [0.75, -0.08, 0] },
    structure: 'Túi lớn có màng đơn (tonoplast), chiếm 50–80% thể tích tế bào thực vật trưởng thành, chứa dịch không bào giàu nước & ion.',
    fn: 'Dự trữ nước, ion khoáng, sắc tố, chất thải và duy trì áp suất trương giúp cây đứng vững.',
  },
  er: {
    name: 'Lưới nội chất (ER hạt & trơn)',
    short: 'Lưới nội chất',
    color: '#ec4899',
    both: true,
    pinPos: [-1.1, 0.28, 0.85],
    cam: { position: [-2.4, 0.9, 3.0], target: [-0.4, 0.16, 0.2] },
    structure: 'Hệ thống túi dẹt gấp nếp nối liền màng nhân; Lưới nội chất hạt (Rough ER) đính dày đặc hạt ribosome trên bề mặt.',
    fn: 'ER hạt tổng hợp protein tiết & protein màng; ER trơn tổng hợp lipid, chuyển hóa đường và khử độc (rất phát triển ở tế bào gan).',
  },
  golgi: {
    name: 'Bộ máy Golgi',
    short: 'Bộ máy Golgi',
    color: '#eab308',
    both: true,
    pinPos: [0.28, -1.16, 0.96],
    cam: { position: [1.4, -1.2, 3.0], target: [0.28, -1.05, 0.85] },
    structure: 'Chồng túi dẹt màng đơn xếp song song uốn cong (cisternae) kèm hàng loạt túi tiết nảy chồi hai đầu.',
    fn: 'Phân loại, sửa đổi (gắn đường tạo glycoprotein), đóng gói và phân phối sản phẩm đến đúng đích hoặc xuất bào.',
  },
  lysosome: {
    name: 'Lysosome & Trung thể',
    short: 'Lysosome',
    color: '#ef4444',
    animalOnly: true,
    pinPos: [-1.14, 0.84, 0.84],
    cam: { position: [-2.5, 1.25, 2.8], target: [-0.95, 0.95, 0.6] },
    structure: 'Lysosome là túi màng đơn chứa >40 enzyme thủy phân (pH ~5); Trung thể gồm 2 ống trung tử xếp vuông góc 90° tạo thoi phân bào.',
    fn: 'Lysosome tiêu hóa nội bào, phân hủy bào quan già & vi khuẩn xâm nhập; Trung thể tổ chức vi ống phân chia NST.',
  },
  ribosome: {
    name: 'Ribosome (80S — Tự do & Đính ER)',
    short: 'Ribosome',
    color: '#f8fafc',
    both: true,
    pinPos: [0.76, 0.95, 1.1],
    cam: { position: [1.8, 1.4, 3.3], target: [0.3, 0.6, 0.5] },
    structure: 'Bào quan KHÔNG có màng bao bọc, gồm tiểu phần lớn và tiểu phần nhỏ cấu tạo từ rRNA và protein.',
    fn: 'Trực tiếp dịch mã đọc bộ ba codon trên mRNA để lắp ráp chuỗi polypeptide (protein).',
  },
};

const NO_RAYCAST = () => null;

/* ── Wrapper tương tác vật thể 3D: Hover phóng nhẹ + đổi con trỏ chuột + Click chọn ── */
function InteractiveOrganelle({ id, selected, hovered, onHover, onSelect, children, position = [0, 0, 0], explodeDir = [0, 0, 0], explode = 0 }) {
  const ref = useRef(null);
  const isHot = selected === id || hovered === id;

  useFrame((_, dt) => {
    if (!ref.current) return;
    const targetScale = hovered === id ? 1.12 : selected === id ? 1.06 : 1.0;
    ref.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), Math.min(1, dt * 10));
    const ex = explode / 100;
    ref.current.position.set(
      position[0] + explodeDir[0] * ex,
      position[1] + explodeDir[1] * ex,
      position[2] + explodeDir[2] * ex
    );
  });

  return (
    <group
      ref={ref}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(id);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        onHover((cur) => (cur === id ? null : cur));
        document.body.style.cursor = 'auto';
      }}
    >
      {children}
      {/* Vòng highlight nhỏ khi hover/chọn */}
      {isHot && null}
    </group>
  );
}

function RibosomeCloud({ isPlant, emissiveIntensity, onClick, onHover }) {
  const meshRef = useRef(null);
  const count = 90;
  const positions = useMemo(() => {
    const arr = [];
    const nucX = isPlant ? -0.95 : 0;
    const nucY = isPlant ? 0.35 : 0.16;
    for (let i = 0; i < count; i++) {
      if (i < 52) {
        const ang = (i / 52) * Math.PI * 1.35 + 0.3;
        const rad = 0.94 + (i % 3) * 0.15;
        const dy = ((i % 7) - 3) * 0.085;
        arr.push([nucX + Math.cos(ang) * rad, nucY + dy, Math.sin(ang) * rad * 0.85]);
      } else {
        const k = i - 52;
        const phi = Math.acos(1 - (2 * (k + 0.5)) / 38);
        const theta = Math.PI * (1 + Math.sqrt(5)) * k;
        const r = 1.34 + (k % 4) * 0.16;
        arr.push([
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.cos(phi) * 0.78,
          r * Math.sin(phi) * Math.sin(theta) * 0.82,
        ]);
      }
    }
    return arr;
  }, [isPlant]);

  useEffect(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();
    positions.forEach(([x, y, z], i) => {
      dummy.position.set(x, y, z);
      dummy.scale.setScalar(0.8 + (i % 5) * 0.08);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [positions]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[null, null, count]}
      onClick={onClick}
      onPointerOver={(e) => { e.stopPropagation(); onHover('ribosome'); document.body.style.cursor = 'pointer'; }}
      onPointerOut={(e) => { e.stopPropagation(); onHover((c) => (c === 'ribosome' ? null : c)); document.body.style.cursor = 'auto'; }}
    >
      <sphereGeometry args={[0.044, 10, 8]} />
      <meshStandardMaterial color="#f8fafc" roughness={0.3} emissive="#bae6fd" emissiveIntensity={emissiveIntensity + 0.25} />
    </instancedMesh>
  );
}

function DetailedMitochondrion({ position, rotation, emissiveIntensity, organTex }) {
  const cristaeCurve = useMemo(() => {
    const pts = [
      new THREE.Vector3(-0.09, -0.35, 0.01),
      new THREE.Vector3(0.1, -0.25, 0.04),
      new THREE.Vector3(-0.1, -0.15, -0.02),
      new THREE.Vector3(0.1, -0.05, 0.04),
      new THREE.Vector3(-0.1, 0.05, -0.02),
      new THREE.Vector3(0.1, 0.15, 0.04),
      new THREE.Vector3(-0.09, 0.25, -0.02),
      new THREE.Vector3(0.08, 0.35, 0.01),
    ];
    return new THREE.CatmullRomCurve3(pts);
  }, []);

  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <capsuleGeometry args={[0.22, 0.48, 16, 28]} />
        <meshPhysicalMaterial
          color="#ea580c"
          map={organTex.map}
          bumpMap={organTex.bumpMap}
          bumpScale={0.025}
          roughness={0.22}
          clearcoat={0.95}
          transparent
          opacity={0.76}
          emissive="#f97316"
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      <mesh>
        <tubeGeometry args={[cristaeCurve, 48, 0.05, 10, false]} />
        <meshPhysicalMaterial color="#fde047" roughness={0.28} clearcoat={0.6} emissive="#fb923c" emissiveIntensity={emissiveIntensity + 0.4} />
      </mesh>
    </group>
  );
}

function DetailedChloroplast({ position, rotation, emissiveIntensity, organTex }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh scale={[1.48, 0.72, 0.94]}>
        <sphereGeometry args={[0.29, 28, 22]} />
        <meshPhysicalMaterial
          color="#16a34a"
          map={organTex.map}
          bumpMap={organTex.bumpMap}
          bumpScale={0.02}
          roughness={0.18}
          clearcoat={1}
          transparent
          opacity={0.58}
          emissive="#22c55e"
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      {[-0.2, -0.05, 0.1, 0.24].map((gx, i) => (
        <group key={i} position={[gx, 0, i % 2 === 0 ? 0.04 : -0.04]}>
          {[-0.075, -0.025, 0.025, 0.075].map((gy, j) => (
            <mesh key={j} position={[0, gy, 0]}>
              <cylinderGeometry args={[0.072, 0.072, 0.028, 16]} />
              <meshStandardMaterial color="#4ade80" roughness={0.32} emissive="#16a34a" emissiveIntensity={emissiveIntensity + 0.3} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.015, 0.015, 0.48, 8]} />
        <meshStandardMaterial color="#86efac" emissive="#4ade80" emissiveIntensity={0.45} />
      </mesh>
    </group>
  );
}

function DetailedNucleus({ emissiveIntensity, organTex }) {
  const chromatinCurve = useMemo(() => {
    const pts = [];
    for (let i = 0; i < 32; i++) {
      const t = i / 31;
      const a = t * Math.PI * 6;
      const r = 0.2 + 0.25 * Math.sin(t * Math.PI);
      pts.push(new THREE.Vector3(Math.cos(a) * r, (t - 0.5) * 0.7, Math.sin(a) * r));
    }
    return new THREE.CatmullRomCurve3(pts);
  }, []);

  const poreCoords = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 24; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / 24);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const R = 0.8;
      arr.push([R * Math.sin(phi) * Math.cos(theta), R * Math.cos(phi), R * Math.sin(phi) * Math.sin(theta)]);
    }
    return arr;
  }, []);

  return (
    <group>
      <mesh>
        <sphereGeometry args={[0.79, 40, 32, 0, Math.PI * 1.52]} />
        <meshPhysicalMaterial
          color="#6d28d9"
          map={organTex.map}
          bumpMap={organTex.bumpMap}
          bumpScale={0.032}
          roughness={0.28}
          metalness={0.08}
          clearcoat={0.9}
          side={THREE.DoubleSide}
          transparent
          opacity={0.9}
          emissive="#7c3aed"
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      {poreCoords.map((pos, idx) => (
        <mesh key={idx} position={pos}>
          <sphereGeometry args={[0.042, 10, 8]} />
          <meshStandardMaterial color="#e9d5ff" emissive="#a855f7" emissiveIntensity={0.65} />
        </mesh>
      ))}
      <mesh>
        <tubeGeometry args={[chromatinCurve, 84, 0.023, 8, false]} />
        <meshStandardMaterial color="#f3e8ff" emissive="#c084fc" emissiveIntensity={0.65} />
      </mesh>
      <mesh position={[0.14, 0.08, 0.14]}>
        <sphereGeometry args={[0.25, 28, 22]} />
        <meshPhysicalMaterial color="#c4b5fd" bumpMap={organTex.bumpMap} bumpScale={0.025} roughness={0.2} clearcoat={1} emissive="#a855f7" emissiveIntensity={emissiveIntensity + 0.55} />
      </mesh>
    </group>
  );
}

function CellScene({ mode, visible, selected, hovered, onHover, onSelect, cutaway, explode, autoRotate, showLabels }) {
  const groupRef = useRef(null);
  const isPlant = mode === 'plant';

  const memTex = useMemo(() => getOrganicTextures('membrane', 3), []);
  const cytoTex = useMemo(() => getOrganicTextures('cytoplasm', 1), []);
  const organTex = useMemo(() => getOrganicTextures('organ', 2), []);

  const channelPositions = useMemo(() => {
    const arr = [];
    const up = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < 12; i++) {
      const phi = 0.5 + (i % 3) * 0.72;
      const theta = (i / 12) * Math.PI * 1.45 + 0.15;
      const R = 2.34;
      const v = new THREE.Vector3(R * Math.sin(phi) * Math.cos(theta), R * Math.cos(phi), R * Math.sin(phi) * Math.sin(theta));
      const q = new THREE.Quaternion().setFromUnitVectors(up, v.clone().normalize());
      arr.push({ pos: [v.x, v.y, v.z], quat: q });
    }
    return arr;
  }, []);

  useFrame((_, dt) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += dt * 0.18;
    }
  });

  const emit = (key) => (hovered === key ? 0.85 : selected === key ? 0.58 : 0.12);
  const labelKeys = isPlant
    ? ['nucleus', 'chloroplast', 'vacuole', 'mitochondria', 'golgi']
    : ['nucleus', 'mitochondria', 'er', 'golgi', 'lysosome'];
  const ex = explode / 100;

  return (
    <group ref={groupRef}>
      {/* Thành tế bào (raycast=NO_RAYCAST để KHÔNG bao giờ chặn click vào bào quan bên trong!) */}
      {isPlant && visible.cellWall && (
        <RoundedBox args={[4.66, 3.38, 3.38]} radius={0.36} smoothness={6} raycast={NO_RAYCAST}>
          <meshPhysicalMaterial
            color="#15803d"
            bumpMap={organTex.bumpMap}
            bumpScale={0.03}
            transparent
            opacity={cutaway ? 0.15 : 0.3}
            roughness={0.35}
            clearcoat={0.75}
            emissive="#16a34a"
            emissiveIntensity={emit('cellWall')}
            depthWrite={false}
          />
        </RoundedBox>
      )}

      {/* Màng sinh chất trong suốt (raycast=NO_RAYCAST để click/hover xuyên thẳng vào Nhân, Ti thể, Golgi, ER, Lysosome!) */}
      {visible.membrane && (
        <group>
          {isPlant ? (
            <RoundedBox args={[4.28, 3.04, 3.04]} radius={0.28} smoothness={6} raycast={NO_RAYCAST}>
              <meshPhysicalMaterial
                color="#38bdf8"
                map={memTex.map}
                bumpMap={memTex.bumpMap}
                bumpScale={0.025}
                transparent
                opacity={cutaway ? 0.13 : 0.25}
                roughness={0.14}
                clearcoat={1}
                iridescence={0.7}
                emissive="#0ea5e9"
                emissiveIntensity={emit('membrane')}
                depthWrite={false}
              />
            </RoundedBox>
          ) : (
            <>
              <mesh raycast={NO_RAYCAST}>
                <sphereGeometry args={[2.34, 56, 40, 0, cutaway ? Math.PI * 1.48 : Math.PI * 2]} />
                <meshPhysicalMaterial
                  color="#38bdf8"
                  map={memTex.map}
                  bumpMap={memTex.bumpMap}
                  bumpScale={0.03}
                  transparent
                  opacity={cutaway ? 0.28 : 0.36}
                  roughness={0.14}
                  metalness={0.05}
                  clearcoat={1}
                  iridescence={0.8}
                  side={THREE.DoubleSide}
                  emissive="#0284c7"
                  emissiveIntensity={emit('membrane')}
                  depthWrite={false}
                />
              </mesh>
              {cutaway && (
                <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={NO_RAYCAST}>
                  <circleGeometry args={[2.28, 48]} />
                  <meshPhysicalMaterial map={cytoTex.map} transparent opacity={0.3} roughness={0.22} side={THREE.DoubleSide} depthWrite={false} />
                </mesh>
              )}
              {/* Các kênh Protein xuyên màng CÓ THỂ CLICK để chọn Màng sinh chất! */}
              {channelPositions.map((ch, idx) => (
                <mesh
                  key={idx}
                  position={ch.pos}
                  quaternion={ch.quat}
                  onClick={(e) => { e.stopPropagation(); onSelect('membrane'); }}
                  onPointerOver={(e) => { e.stopPropagation(); onHover('membrane'); document.body.style.cursor = 'pointer'; }}
                  onPointerOut={(e) => { e.stopPropagation(); onHover((c) => (c === 'membrane' ? null : c)); document.body.style.cursor = 'auto'; }}
                >
                  <cylinderGeometry args={[0.078, 0.078, 0.24, 10]} />
                  <meshStandardMaterial color="#f472b6" emissive="#ec4899" emissiveIntensity={hovered === 'membrane' ? 1.1 : 0.45} />
                </mesh>
              ))}
            </>
          )}
        </group>
      )}

      {/* Nhân tế bào (tương tác hover + click trực tiếp) */}
      {visible.nucleus && (
        <InteractiveOrganelle
          id="nucleus"
          selected={selected}
          hovered={hovered}
          onHover={onHover}
          onSelect={onSelect}
          position={isPlant ? [-0.95, 0.35, 0.12] : [0, 0.16, 0]}
          explodeDir={[0, 0.55, 0]}
          explode={explode}
        >
          <DetailedNucleus emissiveIntensity={emit('nucleus')} organTex={organTex} />
        </InteractiveOrganelle>
      )}

      {/* Không bào trung tâm (Thực vật) */}
      {isPlant && visible.vacuole && (
        <InteractiveOrganelle
          id="vacuole"
          selected={selected}
          hovered={hovered}
          onHover={onHover}
          onSelect={onSelect}
          position={[0.8, -0.08, -0.05]}
          explodeDir={[0.75, 0, 0]}
          explode={explode}
        >
          <mesh scale={[1.2, 0.95, 0.88]}>
            <sphereGeometry args={[0.92, 36, 26]} />
            <meshPhysicalMaterial
              color="#06b6d4"
              bumpMap={memTex.bumpMap}
              bumpScale={0.015}
              transparent
              opacity={0.5}
              roughness={0.06}
              clearcoat={1}
              iridescence={0.65}
              emissive="#22d3ee"
              emissiveIntensity={emit('vacuole')}
            />
          </mesh>
        </InteractiveOrganelle>
      )}

      {/* 3 Ti thể (tương tác trực tiếp) */}
      {visible.mitochondria && (
        <InteractiveOrganelle
          id="mitochondria"
          selected={selected}
          hovered={hovered}
          onHover={onHover}
          onSelect={onSelect}
          explodeDir={[0.75, -0.55, 0.5]}
          explode={explode}
        >
          {[
            [isPlant ? -1.2 : 1.18, -0.76, 0.68, [0.4, 0.8, 0.2]],
            [isPlant ? 0.12 : -1.28, -0.85, -0.52, [-0.5, 0.2, 0.7]],
            [isPlant ? -0.35 : 0.92, 1.08, -0.58, [0.2, -0.4, 0.5]],
          ].map(([x, y, z, rot], idx) => (
            <DetailedMitochondrion key={idx} position={[x, y, z]} rotation={rot} emissiveIntensity={emit('mitochondria')} organTex={organTex} />
          ))}
        </InteractiveOrganelle>
      )}

      {/* 4 Lục lạp (Thực vật) */}
      {isPlant && visible.chloroplast && (
        <InteractiveOrganelle
          id="chloroplast"
          selected={selected}
          hovered={hovered}
          onHover={onHover}
          onSelect={onSelect}
          explodeDir={[-0.75, -0.35, 0.4]}
          explode={explode}
        >
          {[
            [-1.38, -0.25, -0.72, [0.2, 0.4, 0.15]],
            [1.48, 0.85, 0.55, [-0.3, 0.9, 0.2]],
            [-0.15, -1.02, 0.86, [0.4, -0.5, 0.25]],
            [0.86, -0.96, 0.78, [-0.2, 0.3, -0.3]],
          ].map(([x, y, z, rot], idx) => (
            <DetailedChloroplast key={idx} position={[x, y, z]} rotation={rot} emissiveIntensity={emit('chloroplast')} organTex={organTex} />
          ))}
        </InteractiveOrganelle>
      )}

      {/* Lưới nội chất (tương tác trực tiếp) */}
      {visible.er && (
        <InteractiveOrganelle
          id="er"
          selected={selected}
          hovered={hovered}
          onHover={onHover}
          onSelect={onSelect}
          position={isPlant ? [-0.95, 0.35, 0.12] : [0, 0.16, 0]}
          explodeDir={[-0.65, 0.2, 0.55]}
          explode={explode}
        >
          {[0.96, 1.1, 1.24, 1.36].map((rad, idx) => (
            <mesh key={idx} rotation={[Math.PI / 2.25 + idx * 0.22, idx * 0.36, 0.2]}>
              <torusGeometry args={[rad, 0.072, 14, 42, Math.PI * 1.22]} />
              <meshPhysicalMaterial color="#db2777" bumpMap={organTex.bumpMap} bumpScale={0.025} roughness={0.26} clearcoat={0.75} emissive="#f472b6" emissiveIntensity={emit('er')} />
            </mesh>
          ))}
        </InteractiveOrganelle>
      )}

      {/* Bộ máy Golgi (tương tác trực tiếp) */}
      {visible.golgi && (
        <InteractiveOrganelle
          id="golgi"
          selected={selected}
          hovered={hovered}
          onHover={onHover}
          onSelect={onSelect}
          position={isPlant ? [-0.25, 1.0, 0.68] : [0.28, -1.08, 0.86]}
          explodeDir={[0.25, -0.75, 0.65]}
          explode={explode}
        >
          {[-0.18, -0.09, 0, 0.09, 0.18].map((dy, idx) => (
            <mesh key={idx} position={[0, dy, 0]} scale={[1.4 - Math.abs(idx - 2) * 0.14, 0.16, 0.74]}>
              <sphereGeometry args={[0.35, 24, 16]} />
              <meshPhysicalMaterial color="#eab308" bumpMap={organTex.bumpMap} bumpScale={0.02} roughness={0.24} clearcoat={0.85} emissive="#facc15" emissiveIntensity={emit('golgi')} />
            </mesh>
          ))}
          {[[-0.58, 0.04, 0.1], [0.6, -0.06, 0.12], [0.44, 0.24, 0.16], [-0.46, -0.2, 0.14]].map(([vx, vy, vz], i) => (
            <mesh key={i} position={[vx, vy, vz]}>
              <sphereGeometry args={[0.072, 14, 12]} />
              <meshStandardMaterial color="#fef08a" emissive="#facc15" emissiveIntensity={0.5} />
            </mesh>
          ))}
        </InteractiveOrganelle>
      )}

      {/* Lysosome & Trung thể (Động vật) */}
      {!isPlant && visible.lysosome && (
        <InteractiveOrganelle
          id="lysosome"
          selected={selected}
          hovered={hovered}
          onHover={onHover}
          onSelect={onSelect}
          explodeDir={[-0.75, 0.6, 0.55]}
          explode={explode}
        >
          {[[-1.12, 0.76, 0.76], [1.28, 0.25, 0.86], [-0.88, -0.36, 1.15]].map(([x, y, z], idx) => (
            <group key={idx} position={[x, y, z]}>
              <mesh>
                <sphereGeometry args={[0.21, 24, 18]} />
                <meshPhysicalMaterial color="#dc2626" bumpMap={organTex.bumpMap} bumpScale={0.02} roughness={0.18} clearcoat={0.95} transparent opacity={0.8} emissive="#ef4444" emissiveIntensity={emit('lysosome')} />
              </mesh>
              <mesh position={[0.04, 0.02, 0.04]}>
                <sphereGeometry args={[0.08, 12, 10]} />
                <meshStandardMaterial color="#fecaca" emissive="#f87171" emissiveIntensity={0.65} />
              </mesh>
            </group>
          ))}
          <group position={[-0.78, 1.18, 0.42]}>
            <mesh rotation={[0, 0, 0.2]}>
              <cylinderGeometry args={[0.075, 0.075, 0.34, 9]} />
              <meshStandardMaterial color="#fb7185" emissive="#e11d48" emissiveIntensity={emit('lysosome') + 0.25} />
            </mesh>
            <mesh position={[0.16, -0.05, 0.06]} rotation={[Math.PI / 2, 0.2, 0]}>
              <cylinderGeometry args={[0.075, 0.075, 0.34, 9]} />
              <meshStandardMaterial color="#fb7185" emissive="#e11d48" emissiveIntensity={emit('lysosome') + 0.25} />
            </mesh>
          </group>
        </InteractiveOrganelle>
      )}

      {/* 90 hạt Ribosome */}
      {visible.ribosome && (
        <RibosomeCloud
          isPlant={isPlant}
          emissiveIntensity={emit('ribosome')}
          onHover={onHover}
          onClick={(e) => { e.stopPropagation(); onSelect('ribosome'); }}
        />
      )}

      {/* Nhãn 3D CỐ ĐỊNH KÍCH THƯỚC (KHÔNG distanceFactor -> KHÔNG BAO GIỜ PHÌNH TO CHE HÌNH) */}
      {labelKeys.map((k) => {
        const meta = ORGANELLES[k];
        if (!meta || !visible[k]) return null;
        const isHot = hovered === k || selected === k;
        if (!showLabels && !isHot) return null;
        const pos = [meta.pinPos[0] * (1 + ex * 0.25), meta.pinPos[1] * (1 + ex * 0.25), meta.pinPos[2]];
        return (
          <Html key={k} position={pos} center zIndexRange={[10, 0]} style={{ pointerEvents: 'auto' }}>
            <button
              type="button"
              className={`bl-3d-pin${isHot ? ' active' : ''}`}
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

export default function Cell3DExplorerSim() {
  const [mode, setMode] = useState('animal');
  const [selected, setSelected] = useState('nucleus');
  const [hovered, setHovered] = useState(null);
  const [cutaway, setCutaway] = useState(true);
  const [explode, setExplode] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [showLabels, setShowLabels] = useState(false); // Mặc định chỉ hiện nhãn gọn của bào quan đang chọn/hover!
  const [focusView, setFocusView] = useState(null);
  const [visible, setVisible] = useState({
    membrane: true,
    cellWall: true,
    nucleus: true,
    mitochondria: true,
    chloroplast: true,
    vacuole: true,
    er: true,
    golgi: true,
    lysosome: true,
    ribosome: true,
  });

  const activeOrganelles = Object.entries(ORGANELLES).filter(([, meta]) =>
    mode === 'plant' ? !meta.animalOnly : !meta.plantOnly
  );
  const activeKey = hovered || selected;
  const selMeta = ORGANELLES[activeKey] || ORGANELLES.nucleus;

  const pickOrganelle = (key, flyTo = false) => {
    setSelected(key);
    if (flyTo && ORGANELLES[key]?.cam) {
      setAutoRotate(false);
      setFocusView({ ...ORGANELLES[key].cam, _t: Date.now() });
    }
  };

  const toggleVis = (k) => setVisible((v) => ({ ...v, [k]: !v[k] }));

  return (
    <div className="bl-grid-2">
      <div>
        <div className="bl-tabs">
          <button
            type="button"
            className={`bl-tab${mode === 'animal' ? ' on' : ''}`}
            onClick={() => { setMode('animal'); if (ORGANELLES[selected]?.plantOnly) setSelected('nucleus'); }}
          >
            Tế bào Động vật (3D)
          </button>
          <button
            type="button"
            className={`bl-tab${mode === 'plant' ? ' on' : ''}`}
            onClick={() => { setMode('plant'); if (ORGANELLES[selected]?.animalOnly) setSelected('chloroplast'); }}
          >
            Tế bào Thực vật (3D)
          </button>
          <button type="button" className={`bl-tab${cutaway ? ' on' : ''}`} onClick={() => setCutaway((c) => !c)}>
            {cutaway ? 'Mặt cắt: Bật' : 'Mặt cắt: Tắt'}
          </button>
          <button type="button" className={`bl-tab${showLabels ? ' on' : ''}`} onClick={() => setShowLabels((l) => !l)}>
            {showLabels ? 'Hiện tất cả nhãn' : 'Nhãn thông minh'}
          </button>
          <button type="button" className={`bl-tab${autoRotate ? ' on' : ''}`} onClick={() => setAutoRotate((r) => !r)}>
            {autoRotate ? 'Tự xoay: Bật' : 'Tự xoay: Tắt'}
          </button>
        </div>

        <BioCanvas3D
          camera={{ position: [0.4, 1.3, 6.2], fov: 40 }}
          focusView={focusView}
          height={490}
          studioTheme="medical"
          badge={
            hovered
              ? `Đang trỏ: ${ORGANELLES[hovered]?.short} (Bấm để phóng cận cảnh)`
              : mode === 'plant'
                ? 'Tế bào Thực vật 3D · Bấm trực tiếp bào quan'
                : 'Tế bào Động vật 3D · Bấm trực tiếp bào quan'
          }
        >
          <CellScene
            mode={mode}
            visible={visible}
            selected={selected}
            hovered={hovered}
            onHover={setHovered}
            onSelect={(k) => pickOrganelle(k, true)}
            cutaway={cutaway}
            explode={explode}
            autoRotate={autoRotate}
            showLabels={showLabels}
          />
        </BioCanvas3D>
      </div>

      <div className="bl-controls">
        <div className="bl-panel bl-highlight-card" style={{ '--card-accent': selMeta.color }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 11, height: 11, borderRadius: '50%', background: selMeta.color, boxShadow: `0 0 8px ${selMeta.color}`, flexShrink: 0 }} />
              <h4 style={{ margin: 0 }}>{selMeta.name}</h4>
            </div>
            <button type="button" className="bl-mini-btn primary" onClick={() => pickOrganelle(selected, true)}>
              Zoom
            </button>
          </div>
          <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.56 }}>
            <strong>Cấu tạo:</strong> {selMeta.structure}
          </p>
          <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.56 }}>
            <strong>Chức năng:</strong> {selMeta.fn}
          </p>
        </div>

        <div className="bl-panel">
          <h4>Tách bung &amp; Ẩn/Hiện Bào quan</h4>
          <label className="bl-slider-row">
            <header><span>Tách bung bào quan (Explode View)</span><b>{explode}%</b></header>
            <input type="range" min={0} max={100} step={5} value={explode} onChange={(e) => setExplode(Number(e.target.value))} />
          </label>
          <div className="bl-check-list">
            {activeOrganelles.map(([key, meta]) => (
              <div
                key={key}
                className="bl-check-chip"
                style={selected === key ? { borderColor: meta.color, background: 'rgba(16,185,129,0.14)' } : undefined}
              >
                <input
                  type="checkbox"
                  checked={!!visible[key]}
                  onChange={() => toggleVis(key)}
                  aria-label={`Hiện ${meta.name}`}
                />
                <button
                  type="button"
                  onClick={() => pickOrganelle(key, true)}
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
