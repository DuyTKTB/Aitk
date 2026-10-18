/* ============================================================
   Scene.jsx — CẢNH 3D PHÒNG LAB (React Three Fiber)
   Phòng 3D thật: sàn, tường, cửa sổ, đèn, bàn thí nghiệm, kệ hóa
   chất, tủ hút, bồn rước, biển an toàn. Dụng cụ thủy tinh procedural
   với mức chất lỏng + màu thay đổi theo engine.
   ============================================================ */
import { useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

/* ---------- TEXTURE procedural (không cần file ngoài) ---------- */
function tileTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const x = c.getContext('2d');
  x.fillStyle = '#b9c2cb'; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    const g = x.createLinearGradient(i*128, j*128, i*128+128, j*128+128);
    g.addColorStop(0, '#c3ccd4'); g.addColorStop(1, '#aeb8c2');
    x.fillStyle = g; x.fillRect(i*128+2, j*128+2, 124, 124);
    x.fillStyle = 'rgba(255,255,255,0.06)';
    for (let k = 0; k < 30; k++) x.fillRect(i*128+2+Math.random()*120, j*128+2+Math.random()*120, 2, 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(5, 4); t.anisotropy = 4;
  return t;
}

function benchTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = '#1e262e'; x.fillRect(0, 0, 256, 256);
  x.fillStyle = 'rgba(255,255,255,0.10)';
  for (let k = 0; k < 700; k++) x.fillRect(Math.random()*256, Math.random()*256, 1.5, 1.5);
  x.fillStyle = 'rgba(0,0,0,0.25)';
  for (let k = 0; k < 300; k++) x.fillRect(Math.random()*256, Math.random()*256, 1.5, 1.5);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 1);
  return t;
}

function periodicTexture() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 288;
  const x = c.getContext('2d');
  x.fillStyle = '#f8fafc'; x.fillRect(0, 0, 512, 288);
  x.fillStyle = '#0f172a'; x.font = 'bold 22px sans-serif'; x.fillText('BẢNG TUẦN HOÀN', 150, 30);
  const groups = ['#f87171','#fbbf24','#4ade80','#38bdf8','#818cf8','#c084fc','#f472b6','#94a3b8'];
  for (let col = 0; col < 18; col++) for (let row = 0; row < 7; row++) {
    if ((col === 0 && row > 0) || (col === 17 && row > 1)) continue;
    if (row === 6 && col > 1) continue;
    x.fillStyle = groups[(col + row) % 8];
    x.globalAlpha = 0.85;
    x.fillRect(14 + col * 27, 45 + row * 30, 24, 26);
    x.globalAlpha = 1;
    x.strokeStyle = '#e2e8f0'; x.strokeRect(14 + col * 27, 45 + row * 30, 24, 26);
  }
  return new THREE.CanvasTexture(c);
}

/* ---------- CAMERA PRESETS ---------- */
export const VIEWS = {
  room: { pos: [0, 3.4, 6.4], target: [0, 1.1, 0] },
  bench: { pos: [0, 1.9, 1.7], target: [0, 1.15, -0.2] },
  close: { pos: [0, 1.45, 0.55], target: [0, 1.18, -0.35] },
};

const ROOM = { w: 10, d: 8, h: 3.2 };

/* ---------- FPS CONTROLS — pointer lock + raycast tương tác ---------- */
function FPSControls({ enabled, keysRef, onHover, onUse, interactRef }) {
  const { camera, gl } = useThree();
  const yaw = useRef(0); const pitch = useRef(0);
  const ray = useMemo(() => new THREE.Raycaster(), []);
  const rayTimer = useRef(0);

  useEffect(() => {
    if (!enabled) return undefined;
    const canvas = gl.domElement;
    const lock = () => canvas.requestPointerLock?.();
    const onMove = (e) => {
      if (document.pointerLockElement !== canvas) return;
      yaw.current -= e.movementX * 0.0022;
      pitch.current = THREE.MathUtils.clamp(pitch.current - e.movementY * 0.0022, -1.15, 1.15);
    };
    const onLockChange = () => {
      if (document.pointerLockElement !== canvas) onHover?.(null);
    };
    canvas.addEventListener('click', lock);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('pointerlockchange', onLockChange);
    return () => {
      canvas.removeEventListener('click', lock);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('pointerlockchange', onLockChange);
      if (document.pointerLockElement === canvas) document.exitPointerLock?.();
    };
  }, [enabled, gl, onHover]);

  /* E = dùng dụng cụ đang ngắm */
  useEffect(() => {
    if (!enabled) return undefined;
    const onKey = (e) => { if (e.key.toLowerCase() === 'e') onUse?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled, onUse]);

  useFrame((_, dt) => {
    if (!enabled) return;
    const k = keysRef.current || {};
    const speed = (k.shift ? 2.6 : 1.5) * dt;
    const fwd = new THREE.Vector3(-Math.sin(yaw.current), 0, -Math.cos(yaw.current));
    const right = new THREE.Vector3(-fwd.z, 0, fwd.x);
    const move = new THREE.Vector3();
    if (k.w) move.add(fwd); if (k.s) move.sub(fwd);
    if (k.d) move.add(right); if (k.a) move.sub(right);
    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(speed);
      camera.position.set(
        THREE.MathUtils.clamp(camera.position.x + move.x, -ROOM.w / 2 + 0.5, ROOM.w / 2 - 0.5),
        1.62,
        THREE.MathUtils.clamp(camera.position.z + move.z, -ROOM.d / 2 + 0.5, ROOM.d / 2 - 0.5)
      );
    }
    camera.quaternion.setFromEuler(new THREE.Euler(pitch.current, yaw.current, 0, 'YXZ'));

    /* Raycast từ tâm màn hình → dụng cụ đang ngắm */
    rayTimer.current += dt;
    if (rayTimer.current > 0.12 && interactRef?.current) {
      rayTimer.current = 0;
      ray.setFromCamera(new THREE.Vector2(0, 0), camera);
      const hits = ray.intersectObjects(interactRef.current.children, true);
      let id = null;
      for (const h of hits) {
        let o = h.object;
        while (o && !o.userData?.instrumentId) o = o.parent;
        if (o) { id = o.userData.instrumentId; break; }
      }
      onHover?.(id);
    }
  });
  return null;
}

function CameraRig({ view, focus, walk, keysRef }) {
  const { camera, controls } = useThree();
  const target = useRef(new THREE.Vector3(...VIEWS.room.target));
  const desired = useRef(new THREE.Vector3(...VIEWS.room.pos));

  useEffect(() => {
    const v = focus ? focus.view : VIEWS[view];
    if (!v) return;
    desired.current.set(...v.pos);
    target.current.set(...v.target);
  }, [view, focus]);

  useFrame((state, dt) => {
    /* FPS mode điều khiển camera trực tiếp — CameraRig nhường quyền */
    if (walk) return;
    /* Orbit mode: WASD dịch chuyển camera + target cùng lúc, kẹp trong phòng */
    if (keysRef?.current) {
      const k = keysRef.current;
      const speed = (k.shift ? 3.2 : 1.8) * dt;
      const dir = new THREE.Vector3();
      if (k.w) dir.z -= 1;
      if (k.s) dir.z += 1;
      if (k.a) dir.x -= 1;
      if (k.d) dir.x += 1;
      if (dir.lengthSq() > 0) {
        dir.normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), state.camera.rotation.y);
        desired.current.addScaledVector(dir, speed);
        target.current.addScaledVector(dir, speed);
      }
      desired.current.x = THREE.MathUtils.clamp(desired.current.x, -ROOM.w / 2 + 0.6, ROOM.w / 2 - 0.6);
      desired.current.z = THREE.MathUtils.clamp(desired.current.z, -ROOM.d / 2 + 0.6, ROOM.d / 2 - 0.6);
      desired.current.y = 1.65;
    }
    camera.position.lerp(desired.current, Math.min(1, dt * 4));
    if (controls) controls.target.lerp(target.current, Math.min(1, dt * 4));
  });

  return (
    <OrbitControls
      makeDefault
      enabled={!walk}
      enablePan={false}
      minDistance={0.5}
      maxDistance={8.5}
      maxPolarAngle={Math.PI / 2.05}
      minPolarAngle={0.15}
    />
  );
}

/* ---------- CHẤT LỎNG + HIỆU ỨNG ---------- */
function Liquid({ radius, fill, color, bubbles, gasType, stir }) {
  const h = Math.max(0.02, fill * 0.55);
  const bubblesRef = useRef();
  const liquidRef = useRef();
  const seeds = useMemo(() => Array.from({ length: 18 }, () => ({
    a: Math.random() * Math.PI * 2, r: Math.random() * radius * 0.7, t: Math.random(),
  })), [radius]);
  const bSize = gasType === 'H2' ? 0.009 : gasType === 'CO2' ? 0.016 : 0.013;

  useFrame((_, dt) => {
    if (liquidRef.current && stir) liquidRef.current.rotation.y += dt * 6;
    if (!bubbles || !bubblesRef.current) return;
    for (let i = 0; i < seeds.length; i++) {
      const m = bubblesRef.current.children[i];
      if (!m) continue;
      seeds[i].t += dt * (gasType === 'CO2' ? 1.1 : 1.6);
      if (seeds[i].t > 1) seeds[i].t = 0;
      const y = -h / 2 + seeds[i].t * h;
      m.position.set(Math.cos(seeds[i].a) * seeds[i].r, y, Math.sin(seeds[i].a) * seeds[i].r);
      m.scale.setScalar(0.4 + seeds[i].t * 0.9);
    }
  });

  return (
    <group>
      <group ref={liquidRef}>
      <mesh position={[0, -0.275 + h / 2, 0]}>
        <cylinderGeometry args={[radius * 0.96, radius * 0.96, h, 24]} />
        <meshStandardMaterial color={color} transparent opacity={0.82} roughness={0.15} metalness={0} />
      </mesh>
      {bubbles && (
        <group ref={bubblesRef}>
          {seeds.map((_, i) => (
            <mesh key={i}>
              <sphereGeometry args={[bSize, 8, 8]} />
              <meshStandardMaterial color="#ffffff" transparent opacity={0.7} />
            </mesh>
          ))}
        </group>
      )}
      </group>
    </group>
  );
}

/* Dòng chất lỏng khi đang rót */
function PourStream({ active, color = '#cfe3f2' }) {
  if (!active) return null;
  return (
    <group position={[0.14, 0.44, 0.1]} rotation={[0, 0, -0.5]}>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.32, 8]} />
        <meshStandardMaterial color={color} transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

function Precipitate({ radius, color }) {
  return (
    <mesh position={[0, -0.245, 0]}>
      <cylinderGeometry args={[radius * 0.94, radius * 0.94, 0.035, 24]} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  );
}

/* Glass dùng chung: cylinder trong suốt */
/* Bình tam giác thật: LatheGeometry có cổ + miệng loe */
function ErlenmeyerGlass(props) {
  const geo = useMemo(() => {
    const pts = [
      new THREE.Vector2(0.001, 0), new THREE.Vector2(0.108, 0), new THREE.Vector2(0.112, 0.015),
      new THREE.Vector2(0.112, 0.028), new THREE.Vector2(0.052, 0.26), new THREE.Vector2(0.05, 0.3),
      new THREE.Vector2(0.058, 0.3), new THREE.Vector2(0.058, 0.345), new THREE.Vector2(0.046, 0.345),
      new THREE.Vector2(0.046, 0.305), new THREE.Vector2(0.04, 0.3), new THREE.Vector2(0.04, 0.27),
      new THREE.Vector2(0.104, 0.045), new THREE.Vector2(0.001, 0.045),
    ];
    return new THREE.LatheGeometry(pts, 32);
  }, []);
  return <mesh geometry={geo} {...props}><meshPhysicalMaterial color="#e8f2f8" transparent opacity={0.3} roughness={0.05} metalness={0} transmission={0.65} thickness={0.04} ior={1.45} side={THREE.DoubleSide} /></mesh>;
}

/* Cốc có mỏ rót */
function BeakerGlass(props) {
  const geo = useMemo(() => {
    const pts = [
      new THREE.Vector2(0.001, 0), new THREE.Vector2(0.082, 0), new THREE.Vector2(0.085, 0.01),
      new THREE.Vector2(0.085, 0.25), new THREE.Vector2(0.088, 0.258), new THREE.Vector2(0.094, 0.262),
      new THREE.Vector2(0.088, 0.266), new THREE.Vector2(0.082, 0.27), new THREE.Vector2(0.082, 0.255),
      new THREE.Vector2(0.078, 0.255), new THREE.Vector2(0.078, 0.01), new THREE.Vector2(0.001, 0.01),
    ];
    return new THREE.LatheGeometry(pts, 32);
  }, []);
  return <mesh geometry={geo} {...props}><meshPhysicalMaterial color="#e8f2f8" transparent opacity={0.3} roughness={0.05} metalness={0} transmission={0.65} thickness={0.04} ior={1.45} side={THREE.DoubleSide} /></mesh>;
}

function Glass({ radius = 0.09, height = 0.26, ...props }) {
  return (
    <mesh {...props}>
      <cylinderGeometry args={[radius, radius, height, 28, 1, true]} />
      <meshPhysicalMaterial color="#e8f2f8" transparent opacity={0.28} roughness={0.05} metalness={0} transmission={0.6} thickness={0.05} />
    </mesh>
  );
}

/* ---------- INSTRUMENTS ---------- */
function Beaker({ data, onSelect, selected, gasType, pouring }) {
  const fill = Math.min(1, data.volume / data.maxMl);
  return (
    <group
      position={data.position}
      userData={{ instrumentId: data.id }}
      onClick={(e) => { e.stopPropagation(); onSelect(data.id); }}
      onPointerOver={() => document.body.style.cursor = 'pointer'}
      onPointerOut={() => document.body.style.cursor = 'auto'}
    >
      <BeakerGlass position={[0, 0, 0]} />
      {fill > 0 && <Liquid radius={0.085} fill={fill} color={data.color} bubbles={!!gasType || !!data.stir} gasType={gasType} stir={!!data.stir} />}
      <PourStream active={pouring} color={data.pourColor || '#cfe3f2'} />
      {data.precipitates?.map((p, i) => <Precipitate key={i} radius={0.085} color={p.color} />)}
      <mesh position={[0, 0.262, 0]}>
        <torusGeometry args={[0.085, 0.004, 8, 24]} />
        <meshStandardMaterial color="#dfe9f3" transparent opacity={0.5} />
      </mesh>
      {selected && <HighlightRing y={0.32} r={0.11} />}
    </group>
  );
}

function Erlenmeyer({ data, onSelect, selected, gasType, pouring }) {
  const fill = Math.min(1, data.volume / data.maxMl);
  return (
    <group position={data.position} onClick={(e) => { e.stopPropagation(); onSelect(data.id); }} userData={{ instrumentId: data.id }}>
      <ErlenmeyerGlass position={[0, 0, 0]} />
      {fill > 0 && <Liquid radius={0.1} fill={fill * 0.8} color={data.color} bubbles={!!gasType || !!data.stir} gasType={gasType} stir={!!data.stir} />}
      <PourStream active={pouring} color={data.pourColor || '#cfe3f2'} />
      {data.precipitates?.map((p, i) => <Precipitate key={i} radius={0.105} color={p.color} />)}
      {selected && <HighlightRing y={0.34} r={0.13} />}
    </group>
  );
}

function GraduatedCylinder({ data, onSelect, selected, gasType, pouring }) {
  const fill = Math.min(1, data.volume / data.maxMl);
  return (
    <group position={data.position} onClick={(e) => { e.stopPropagation(); onSelect(data.id); }} userData={{ instrumentId: data.id }}>
      <Glass radius={0.045} height={0.34} position={[0, 0.17, 0]} />
      <mesh position={[0, 0.008, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.016, 24]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.4} />
      </mesh>
      {fill > 0 && <Liquid radius={0.045} fill={fill} color={data.color} bubbles={!!gasType} gasType={gasType} />}
      <PourStream active={pouring} color={data.pourColor || '#cfe3f2'} />
      {selected && <HighlightRing y={0.4} r={0.08} />}
    </group>
  );
}

function TestTubeRack({ onSelect, selected, tubes }) {
  return (
    <group position={[-1.15, 0.905, -0.25]} onClick={(e) => { e.stopPropagation(); onSelect('testtube'); }} userData={{ instrumentId: 'testtube' }}>
      <mesh position={[0, 0.025, 0]}>
        <boxGeometry args={[0.34, 0.05, 0.16]} />
        <meshStandardMaterial color="#8a6748" roughness={0.7} />
      </mesh>
      {[-0.1, 0, 0.1].map((x, i) => (
        <mesh key={i} position={[x, 0.08, 0]}>
          <cylinderGeometry args={[0.028, 0.028, 0.16, 18, 1, true]} />
          <meshPhysicalMaterial color="#e8f2f8" transparent opacity={0.3} transmission={0.6} />
        </mesh>
      ))}
      {tubes[0] && <mesh position={[-0.1, 0.1, 0]}><cylinderGeometry args={[0.024, 0.024, 0.06, 16]} /><meshStandardMaterial color={tubes[0].color} transparent opacity={0.85} /></mesh>}
      {tubes[1] && <mesh position={[0, 0.1, 0]}><cylinderGeometry args={[0.024, 0.024, 0.06, 16]} /><meshStandardMaterial color={tubes[1].color} transparent opacity={0.85} /></mesh>}
      {selected === 'testtube' && <HighlightRing y={0.22} r={0.22} color="#f59e0b" />}
    </group>
  );
}

function Burner({ lit, position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.055, 0.065, 0.04, 20]} />
        <meshStandardMaterial color="#5b6570" metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.055, 0]}>
        <cylinderGeometry args={[0.02, 0.028, 0.03, 16]} />
        <meshStandardMaterial color="#4b5563" metalness={0.7} roughness={0.35} />
      </mesh>
      {lit && (
        <mesh position={[0, 0.09, 0]}>
          <coneGeometry args={[0.018, 0.07, 12]} />
          <meshStandardMaterial color="#60a5fa" emissive="#3b82f6" emissiveIntensity={1.6} transparent opacity={0.85} />
        </mesh>
      )}
    </group>
  );
}

function HighlightRing({ y = 0.3, r = 0.12, color = '#5b6cff' }) {
  const ref = useRef();
  useFrame((s) => { if (ref.current) ref.current.rotation.z = s.clock.elapsedTime; });
  return (
    <mesh ref={ref} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[r, 0.008, 8, 32]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.4} />
    </mesh>
  );
}

/* ---------- PHÒNG ---------- */
function Room() {
  const floorTex = useMemo(() => tileTexture(), []);
  const benchTex = useMemo(() => benchTexture(), []);
  const periodic = useMemo(() => periodicTexture(), []);
  const bottles = [
    { label: 'HCl', color: '#dbe7f4' }, { label: 'H2SO4', color: '#e8eef4' },
    { label: 'NaOH', color: '#e6ecf2' }, { label: 'CuSO4', color: '#3b8fe0' },
    { label: 'AgNO3', color: '#eef3f6' }, { label: 'Quỳ', color: '#8b5cf6' },
  ];
  return (
    <group>
      {/* Sàn gạch + tường */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[ROOM.w, ROOM.d]} />
        <meshStandardMaterial map={floorTex} roughness={0.35} metalness={0.08} />
      </mesh>
      {/* Chân tường */}
      {[[-ROOM.w/2, 0, Math.PI/2, ROOM.d], [ROOM.w/2, 0, -Math.PI/2, ROOM.d], [0, -ROOM.d/2, 0, ROOM.w]].map(([x, z, ry, len], i) => (
        <mesh key={i} position={[x, 0.07, z]} rotation={[0, ry, 0]}>
          <boxGeometry args={[len, 0.14, 0.03]} />
          <meshStandardMaterial color="#8a94a0" roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[0, ROOM.h / 2, -ROOM.d / 2]}>
        <planeGeometry args={[ROOM.w, ROOM.h]} />
        <meshStandardMaterial color="#e9edf2" roughness={0.9} />
      </mesh>
      <mesh position={[-ROOM.w / 2, ROOM.h / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[ROOM.d, ROOM.h]} />
        <meshStandardMaterial color="#e4e9ef" roughness={0.9} />
      </mesh>
      <mesh position={[ROOM.w / 2, ROOM.h / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[ROOM.d, ROOM.h]} />
        <meshStandardMaterial color="#e4e9ef" roughness={0.9} />
      </mesh>
      <mesh position={[0, ROOM.h, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROOM.w, ROOM.d]} />
        <meshStandardMaterial color="#f4f6f8" roughness={1} />
      </mesh>

      {/* Cửa sổ (tường sau) */}
      {[-2.2, 2.2].map((x) => (
        <mesh key={x} position={[x, 1.9, -ROOM.d / 2 + 0.02]}>
          <planeGeometry args={[1.7, 1.3]} />
          <meshStandardMaterial color="#cfe4f7" emissive="#9ec9ee" emissiveIntensity={0.5} />
        </mesh>
      ))}

      {/* Bàn thí nghiệm trung tâm — mặt đá hoa cương */}
      <mesh position={[0, 0.45, -0.35]} receiveShadow>
        <boxGeometry args={[4.2, 0.06, 1.0]} />
        <meshStandardMaterial map={benchTex} roughness={0.25} metalness={0.1} />
      </mesh>
      {/* Ghế đẩu lab */}
      {[-1.6, 0, 1.6].map((x) => (
        <group key={x} position={[x, 0, 0.35]}>
          <mesh position={[0, 0.55, 0]} castShadow>
            <cylinderGeometry args={[0.19, 0.19, 0.05, 20]} />
            <meshStandardMaterial color="#33414f" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.28, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.5, 12]} />
            <meshStandardMaterial color="#6b7682" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.03, 0]}>
            <cylinderGeometry args={[0.22, 0.22, 0.04, 20]} />
            <meshStandardMaterial color="#4a5560" metalness={0.6} roughness={0.4} />
          </mesh>
        </group>
      ))}
      {/* Bảng tuần hoàn trên tường */}
      <mesh position={[0, 1.9, -ROOM.d / 2 + 0.04]}>
        <planeGeometry args={[1.9, 1.07]} />
        <meshStandardMaterial map={periodic} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.2, -0.35]}>
        <boxGeometry args={[4.0, 0.4, 0.8]} />
        <meshStandardMaterial color="#3f4c5a" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.75, -0.7]}>
        <boxGeometry args={[4.2, 0.03, 0.02]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Kệ hóa chất phía tường sau */}
      <mesh position={[0, 1.75, -3.35]}>
        <boxGeometry args={[3.6, 0.05, 0.45]} />
        <meshStandardMaterial color="#6b5b4a" roughness={0.8} />
      </mesh>
      {bottles.map((b, i) => (
        <group key={b.label} position={[-1.45 + i * 0.58, 1.9, -3.35]}>
          <mesh>
            <cylinderGeometry args={[0.055, 0.06, 0.2, 16]} />
            <meshPhysicalMaterial color={b.color} transparent opacity={0.75} roughness={0.1} transmission={0.4} />
          </mesh>
          <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.035, 12]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
          <Text position={[0, -0.17, 0.02]} fontSize={0.06} color="#334155" anchorX="center">{b.label}</Text>
        </group>
      ))}

      {/* Tủ hút hóa chất */}
      <group position={[3.4, 0, -2.4]}>
        <mesh position={[0, 1.1, 0]}>
          <boxGeometry args={[1.4, 2.2, 0.8]} />
          <meshStandardMaterial color="#d7dde3" roughness={0.6} />
        </mesh>
        <mesh position={[0, 1.55, 0.41]}>
          <planeGeometry args={[1.1, 0.9]} />
          <meshPhysicalMaterial color="#bcd7ea" transparent opacity={0.35} transmission={0.5} />
        </mesh>
        <Text position={[0, 2.28, 0.41]} fontSize={0.1} color="#475569" anchorX="center">TỦ HÚT</Text>
      </group>

      {/* Bồn rửa */}
      <group position={[-3.4, 0, -2.4]}>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[1.0, 1.0, 0.7]} />
          <meshStandardMaterial color="#cdd4da" roughness={0.6} />
        </mesh>
        <mesh position={[0, 1.01, 0]}>
          <boxGeometry args={[0.5, 0.06, 0.35]} />
          <meshStandardMaterial color="#9aa5ae" metalness={0.5} roughness={0.4} />
        </mesh>
        <Text position={[0, 1.25, 0.36]} fontSize={0.09} color="#475569" anchorX="center">BỒN RỬA</Text>
      </group>

      {/* Thùng rác hóa chất */}
      <group position={[3.8, 0, 1.6]}>
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.22, 0.19, 0.6, 16]} />
          <meshStandardMaterial color="#facc15" roughness={0.6} />
        </mesh>
        <Text position={[0, 0.75, 0]} fontSize={0.07} color="#854d0e" anchorX="center">CHẤT THẢI</Text>
      </group>

      {/* Biển cảnh báo an toàn */}
      <group position={[-3.9, 2.0, -1.0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh><planeGeometry args={[0.42, 0.42]} /><meshStandardMaterial color="#fee2e2" /></mesh>
        <mesh position={[0, 0.06, 0.01]}><planeGeometry args={[0.34, 0.1]} /><meshStandardMaterial color="#ef4444" /></mesh>
        <Text position={[0, -0.1, 0.01]} fontSize={0.06} color="#991b1b" anchorX="center">CHÚ Ý AN TOÀN</Text>
      </group>

      {/* Đèn trần */}
      {[-1.8, 1.8].map((x) => (
        <mesh key={x} position={[x, ROOM.h - 0.05, -0.5]}>
          <boxGeometry args={[1.2, 0.04, 0.4]} />
          <meshStandardMaterial color="#ffffff" emissive="#f8fafc" emissiveIntensity={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function BenchSpotLight() {
  return (
    <spotLight
      position={[0, 2.8, 0.6]} angle={0.7} penumbra={0.8} intensity={22} distance={5}
      color="#eef4ff"
      target-position={[0, 1.1, -0.35]}
    />
  );
}

/* ================= SCENE ROOT ================= */
export default function LabScene({
  vessels = [], selected, onSelect, view, focus, walk, keysRef, quality = 'high',
  burnerLit = false, testTubes = [], phDisplay = null,
  onFpsHover, onFpsUse, interactRef,
}) {
  const shadowOn = quality !== 'low';
  return (
    <Canvas
      shadows={shadowOn}
      dpr={quality === 'high' ? [1, 1.75] : [0.8, 1.2]}
      camera={{ position: VIEWS.room.pos, fov: 55, near: 0.1, far: 60 }}
      gl={{ antialias: quality !== 'low', powerPreference: 'high-performance' }}
      onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; }}
    >
      <color attach="background" args={['#cdd7e0']} />
      <fog attach="fog" args={['#cdd7e0', 12, 26]} />
      <ambientLight intensity={0.75} />
      <directionalLight position={[3, 5, 4]} intensity={0.9} castShadow={shadowOn} shadow-mapSize={[1024, 1024]} />
      <pointLight position={[-1.8, 2.9, -0.5]} intensity={0.5} />
      <pointLight position={[1.8, 2.9, -0.5]} intensity={0.5} />

      <Room />

      <BenchSpotLight />
      <ContactShadows position={[0, 0.47, -0.35]} scale={5} blur={2.2} opacity={0.35} far={1.2} />

      <group ref={interactRef}>
        {vessels.map((c) => {
          const gasActive = c.gas && (!c.gas.until || Date.now() < c.gas.until);
          const props = { data: c, onSelect, selected: selected === c.id, gasType: gasActive ? c.gas.gas : null, pouring: !!c.pouring };
          if (c.kind === 'erlenmeyer') return <Erlenmeyer key={c.id} {...props} />;
          if (c.kind === 'cylinder') return <GraduatedCylinder key={c.id} {...props} />;
          return <Beaker key={c.id} {...props} />;
        })}
        <TestTubeRack onSelect={onSelect} selected={selected} tubes={testTubes} />
      </group>

      <Burner lit={burnerLit} position={[1.45, 0.48, -0.35]} />

      {/* Cân điện tử */}
      <group position={[-1.45, 0.48, -0.35]}>
        <mesh position={[0, 0.03, 0]}>
          <boxGeometry args={[0.3, 0.06, 0.26]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.062, -0.09]}>
          <boxGeometry args={[0.12, 0.04, 0.03]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
      </group>

      {/* Máy đo pH */}
      <group position={[-0.35, 0.48, -0.35]}>
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[0.18, 0.1, 0.14]} />
          <meshStandardMaterial color="#1e293b" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.16, 0]}>
          <cylinderGeometry args={[0.006, 0.006, 0.14, 8]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.7} />
        </mesh>
        <Text position={[0, 0.052, 0.075]} fontSize={0.045} color="#4ade80" anchorX="center">
          {phDisplay != null ? phDisplay.toFixed(1) : '--'}
        </Text>
      </group>

      <CameraRig view={view} focus={focus} walk={walk} keysRef={keysRef} />
      <FPSControls enabled={walk} keysRef={keysRef} onHover={onFpsHover} onUse={onFpsUse} interactRef={interactRef} />
    </Canvas>
  );
}
