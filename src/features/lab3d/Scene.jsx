/* ============================================================
   Scene.jsx — CẢNH 3D PHÒNG LAB (React Three Fiber)
   Phòng 3D thật: sàn, tường, cửa sổ, đèn, bàn thí nghiệm, kệ hóa
   chất tương tác, tủ hút, bồn rửa, cân điện tử, máy đo pH, đèn cồn.
   Dụng cụ thủy tinh procedural với mức chất lỏng, chất rắn, kết tủa,
   bọt khí và hơi nước nóng theo đúng vật lý / hóa học.
   ============================================================ */
import { useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { CHEMS } from './engine.js';

/* ---------- TEXTURE procedural (không cần file ngoài) ---------- */
function tileTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const x = c.getContext('2d');
  x.fillStyle = '#b9c2cb'; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    const g = x.createLinearGradient(i * 128, j * 128, i * 128 + 128, j * 128 + 128);
    g.addColorStop(0, '#c3ccd4'); g.addColorStop(1, '#aeb8c2');
    x.fillStyle = g; x.fillRect(i * 128 + 2, j * 128 + 2, 124, 124);
    x.fillStyle = 'rgba(255,255,255,0.06)';
    for (let k = 0; k < 30; k++) x.fillRect(i * 128 + 2 + Math.random() * 120, j * 128 + 2 + Math.random() * 120, 2, 2);
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
  for (let k = 0; k < 700; k++) x.fillRect(Math.random() * 256, Math.random() * 256, 1.5, 1.5);
  x.fillStyle = 'rgba(0,0,0,0.25)';
  for (let k = 0; k < 300; k++) x.fillRect(Math.random() * 256, Math.random() * 256, 1.5, 1.5);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 1);
  return t;
}

function periodicTexture() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 288;
  const x = c.getContext('2d');
  x.fillStyle = '#f8fafc'; x.fillRect(0, 0, 512, 288);
  x.fillStyle = '#0f172a'; x.font = 'bold 22px sans-serif'; x.fillText('BẢNG TUẦN HOÀN', 150, 30);
  const groups = ['#f87171', '#fbbf24', '#4ade80', '#38bdf8', '#818cf8', '#c084fc', '#f472b6', '#94a3b8'];
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
  room: { pos: [0, 2.85, 5.4], target: [0, 0.9, -0.2] },
  bench: { pos: [0, 1.38, 1.45], target: [0, 0.65, -0.32] },
  close: { pos: [0, 0.95, 0.42], target: [0, 0.64, -0.35] },
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

  useEffect(() => {
    if (!enabled) return undefined;
    const onKey = (e) => {
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key.toLowerCase() === 'e') onUse?.();
    };
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
        1.55,
        THREE.MathUtils.clamp(camera.position.z + move.z, -ROOM.d / 2 + 0.5, ROOM.d / 2 - 0.5)
      );
    }
    camera.quaternion.setFromEuler(new THREE.Euler(pitch.current, yaw.current, 0, 'YXZ'));

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
    if (focus?.pos) {
      const [fx, fy, fz] = focus.pos;
      desired.current.set(fx, fy + 0.36, fz + 0.65);
      target.current.set(fx, fy + 0.14, fz);
      return;
    }
    const v = focus?.view || VIEWS[view] || VIEWS.room;
    desired.current.set(...v.pos);
    target.current.set(...v.target);
  }, [view, focus]);

  useFrame((state, dt) => {
    if (walk) return;
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
    }
    camera.position.lerp(desired.current, Math.min(1, dt * 4.5));
    if (controls) controls.target.lerp(target.current, Math.min(1, dt * 4.5));
  });

  return (
    <OrbitControls
      makeDefault
      enabled={!walk}
      enablePan={false}
      minDistance={0.35}
      maxDistance={8.5}
      maxPolarAngle={Math.PI / 2.02}
      minPolarAngle={0.12}
    />
  );
}

/* ---------- CHẤT LỎNG + BỌT KHÍ + HƠI NƯỚC + CHẤT RẮN ---------- */
function Liquid({ radius, maxH = 0.21, fill, color, bubbles, gasType, stir }) {
  const h = Math.max(0.014, Math.min(1, fill) * maxH);
  const baseY = 0.012;
  const bubblesRef = useRef();
  const liquidRef = useRef();
  const seeds = useMemo(() => Array.from({ length: 16 }, () => ({
    a: Math.random() * Math.PI * 2, r: Math.random() * radius * 0.68, t: Math.random(),
  })), [radius]);
  const bSize = gasType === 'H2' ? 0.006 : gasType === 'CO2' ? 0.01 : 0.008;

  useFrame((_, dt) => {
    if (liquidRef.current && stir) liquidRef.current.rotation.y += dt * 6;
    if (!bubbles || !bubblesRef.current) return;
    for (let i = 0; i < seeds.length; i++) {
      const m = bubblesRef.current.children[i];
      if (!m) continue;
      seeds[i].t += dt * (gasType === 'CO2' ? 1.15 : 1.7);
      if (seeds[i].t > 1) seeds[i].t = 0;
      const y = baseY + seeds[i].t * h;
      m.position.set(Math.cos(seeds[i].a) * seeds[i].r, y, Math.sin(seeds[i].a) * seeds[i].r);
      m.scale.setScalar(0.45 + seeds[i].t * 0.75);
    }
  });

  return (
    <group ref={liquidRef}>
      <mesh position={[0, baseY + h / 2, 0]}>
        <cylinderGeometry args={[radius * 0.94, radius * 0.94, h, 24]} />
        <meshStandardMaterial color={color} transparent opacity={0.84} roughness={0.15} metalness={0.02} />
      </mesh>
      {/* Mặt thoáng meniscus */}
      <mesh position={[0, baseY + h, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius * 0.94, 24]} />
        <meshStandardMaterial color={color} transparent opacity={0.92} roughness={0.08} />
      </mesh>
      {bubbles && (
        <group ref={bubblesRef}>
          {seeds.map((_, i) => (
            <mesh key={i}>
              <sphereGeometry args={[bSize, 8, 8]} />
              <meshStandardMaterial color="#ffffff" transparent opacity={0.78} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

/* Hơi nước bốc lên khi nhiệt độ >= 52°C */
function SteamVapor({ active, topY = 0.26, radius = 0.06 }) {
  const ref = useRef();
  const clouds = useMemo(() => Array.from({ length: 7 }, (_, i) => ({
    x: (Math.random() - 0.5) * radius,
    z: (Math.random() - 0.5) * radius,
    t: i / 7,
  })), [radius]);

  useFrame((_, dt) => {
    if (!active || !ref.current) return;
    for (let i = 0; i < clouds.length; i++) {
      const m = ref.current.children[i];
      if (!m) continue;
      clouds[i].t += dt * 0.55;
      if (clouds[i].t > 1) clouds[i].t = 0;
      const p = clouds[i].t;
      m.position.set(clouds[i].x * (1 + p * 0.8), topY + p * 0.16, clouds[i].z * (1 + p * 0.8));
      m.scale.setScalar(0.5 + p * 1.1);
      m.material.opacity = (1 - p) * 0.28;
    }
  });

  if (!active) return null;
  return (
    <group ref={ref}>
      {clouds.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.018, 8, 8]} />
          <meshStandardMaterial color="#f1f5f9" transparent opacity={0.22} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

/* Chất rắn (đinh sắt, dây đồng, kẽm hạt, đá vôi, lá nhôm) dưới đáy cốc */
function SolidPieces({ contents = [], precipitates = [], radius = 0.07 }) {
  const solids = contents.filter((c) => CHEMS[c.id]?.state === 'solid' && (c.gram || 0) > 0.02);
  if (!solids.length) return null;
  // Nếu có kết-bám (Cu bám trên Fe/Zn hoặc Ag bám trên Cu), lấy màu lớp bám
  const coating = precipitates.find((p) => p.formula === 'Cu' || p.formula === 'Ag');

  return (
    <group position={[0, 0.02, 0]}>
      {solids.map((s) => {
        const chem = CHEMS[s.id];
        const scale = Math.max(0.45, Math.min(1.25, (s.gram || 2) / (chem.solidGram || 3)));
        const matColor = coating ? coating.color : chem.color;
        if (chem.shape === 'nail') {
          return (
            <mesh key={s.id} position={[0, 0.028 * scale, 0]} rotation={[0.2, 0.4, -0.85]} scale={scale}>
              <cylinderGeometry args={[0.0055, 0.004, 0.11, 10]} />
              <meshStandardMaterial color={matColor} metalness={0.75} roughness={0.3} />
            </mesh>
          );
        }
        if (chem.shape === 'strip') {
          return (
            <mesh key={s.id} position={[0, 0.015, 0]} rotation={[0.3, 0.5, -0.6]} scale={scale}>
              <boxGeometry args={[0.055, 0.004, 0.016]} />
              <meshStandardMaterial color={matColor} metalness={0.65} roughness={0.35} />
            </mesh>
          );
        }
        // Hạt rắn (CaCO3, Zn_gran)
        return (
          <group key={s.id} scale={scale}>
            {[[-0.018, 0, -0.01], [0.016, 0, 0.012], [0.002, 0, -0.018], [-0.008, 0, 0.016]].map(([gx, gy, gz], idx) => (
              <mesh key={idx} position={[gx * (radius / 0.07), gy, gz * (radius / 0.07)]}>
                <dodecahedronGeometry args={[0.011, 0]} />
                <meshStandardMaterial color={matColor} roughness={0.65} metalness={chem.cat === 'kim-loai' ? 0.6 : 0.1} />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}

/* Dòng chất lỏng khi đang rót */
function PourStream({ active, color = '#cfe3f2', topY = 0.26 }) {
  if (!active) return null;
  return (
    <group position={[0.08, topY + 0.06, 0.04]} rotation={[0, 0, -0.35]}>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.008, 0.006, 0.22, 10]} />
        <meshStandardMaterial color={color} transparent opacity={0.68} />
      </mesh>
    </group>
  );
}

/* Kết tủa lắng ở đúng đáy trong lòng cốc (y = 0.016) */
function Precipitate({ radius, color, index = 0 }) {
  return (
    <mesh position={[0, 0.015 + index * 0.012, 0]}>
      <cylinderGeometry args={[radius * 0.91, radius * 0.91, 0.022, 24]} />
      <meshStandardMaterial color={color} roughness={0.88} transparent opacity={0.94} />
    </mesh>
  );
}

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

/* Cốc có mỏ rót + vạch chia ml */
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
  return (
    <group {...props}>
      <mesh geometry={geo}>
        <meshPhysicalMaterial color="#e8f2f8" transparent opacity={0.3} roughness={0.05} metalness={0} transmission={0.65} thickness={0.04} ior={1.45} side={THREE.DoubleSide} />
      </mesh>
      {/* Vạch chia độ 50, 100, 150, 200 mL */}
      {[0.055, 0.105, 0.155, 0.205].map((y, idx) => (
        <mesh key={idx} position={[0, y, 0.0855]}>
          <boxGeometry args={[0.022, 0.0025, 0.001]} />
          <meshBasicMaterial color="#e2e8f0" transparent opacity={0.75} />
        </mesh>
      ))}
    </group>
  );
}

function Glass({ radius = 0.09, height = 0.26, ...props }) {
  return (
    <mesh {...props}>
      <cylinderGeometry args={[radius, radius, height, 28, 1, true]} />
      <meshPhysicalMaterial color="#e8f2f8" transparent opacity={0.28} roughness={0.05} metalness={0} transmission={0.6} thickness={0.05} />
    </mesh>
  );
}

/* Nhãn nổi 3D phía trên dụng cụ đang chọn */
function VesselFloatingBadge({ y = 0.38, data }) {
  const vol = Math.round(data.volume || 0);
  const temp = Math.round(data.temp || 25);
  return (
    <group position={[0, y, 0]}>
      <Text position={[0, 0.035, 0]} fontSize={0.032} color="#f8fafc" anchorX="center" outlineWidth={0.003} outlineColor="#0f172a">
        {data.shortName || data.name}
      </Text>
      <Text position={[0, 0, 0]} fontSize={0.025} color="#93c5fd" anchorX="center" outlineWidth={0.0025} outlineColor="#0f172a">
        {`${vol}/${data.maxMl} mL · pH ${(data.pH ?? 7).toFixed(1)} · ${temp}°C`}
      </Text>
    </group>
  );
}

/* ---------- INSTRUMENTS ---------- */
function Beaker({ data, onSelect, selected, gasType, pouring }) {
  const fill = Math.min(1, (data.volume || 0) / data.maxMl);
  const nonCoatingPrecips = (data.precipitates || []).filter((p) => p.formula !== 'Cu' && p.formula !== 'Ag');
  return (
    <group
      position={data.position}
      userData={{ instrumentId: data.id }}
      onClick={(e) => { e.stopPropagation(); onSelect(data.id, data.position); }}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; }}
    >
      <BeakerGlass position={[0, 0, 0]} />
      {fill > 0 && <Liquid radius={0.08} maxH={0.22} fill={fill} color={data.color} bubbles={!!gasType || !!data.stir} gasType={gasType} stir={!!data.stir} />}
      <SolidPieces contents={data.contents} precipitates={data.precipitates} radius={0.072} />
      <PourStream active={pouring} color={data.pourColor || '#cfe3f2'} topY={0.27} />
      <SteamVapor active={(data.temp || 25) >= 52 && fill > 0} topY={0.27} radius={0.06} />
      {nonCoatingPrecips.map((p, i) => <Precipitate key={i} index={i} radius={0.078} color={p.color} />)}
      <mesh position={[0, 0.262, 0]}>
        <torusGeometry args={[0.084, 0.0035, 8, 24]} />
        <meshStandardMaterial color="#dfe9f3" transparent opacity={0.5} />
      </mesh>
      {selected && <HighlightRing y={0.31} r={0.105} />}
      {selected && <VesselFloatingBadge y={0.37} data={data} />}
    </group>
  );
}

function Erlenmeyer({ data, onSelect, selected, gasType, pouring }) {
  const fill = Math.min(1, (data.volume || 0) / data.maxMl);
  const nonCoatingPrecips = (data.precipitates || []).filter((p) => p.formula !== 'Cu' && p.formula !== 'Ag');
  return (
    <group
      position={data.position}
      userData={{ instrumentId: data.id }}
      onClick={(e) => { e.stopPropagation(); onSelect(data.id, data.position); }}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; }}
    >
      <ErlenmeyerGlass position={[0, 0, 0]} />
      {fill > 0 && <Liquid radius={0.088 * (1 - fill * 0.25)} maxH={0.21} fill={fill} color={data.color} bubbles={!!gasType || !!data.stir} gasType={gasType} stir={!!data.stir} />}
      <SolidPieces contents={data.contents} precipitates={data.precipitates} radius={0.08} />
      <PourStream active={pouring} color={data.pourColor || '#cfe3f2'} topY={0.34} />
      <SteamVapor active={(data.temp || 25) >= 52 && fill > 0} topY={0.35} radius={0.04} />
      {nonCoatingPrecips.map((p, i) => <Precipitate key={i} index={i} radius={0.095} color={p.color} />)}
      {selected && <HighlightRing y={0.36} r={0.115} />}
      {selected && <VesselFloatingBadge y={0.42} data={data} />}
    </group>
  );
}

function GraduatedCylinder({ data, onSelect, selected, gasType, pouring }) {
  const fill = Math.min(1, (data.volume || 0) / data.maxMl);
  const nonCoatingPrecips = (data.precipitates || []).filter((p) => p.formula !== 'Cu' && p.formula !== 'Ag');
  return (
    <group
      position={data.position}
      userData={{ instrumentId: data.id }}
      onClick={(e) => { e.stopPropagation(); onSelect(data.id, data.position); }}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; }}
    >
      <Glass radius={0.044} height={0.33} position={[0, 0.17, 0]} />
      <mesh position={[0, 0.008, 0]}>
        <cylinderGeometry args={[0.068, 0.068, 0.016, 24]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.4} />
      </mesh>
      {fill > 0 && <Liquid radius={0.041} maxH={0.29} fill={fill} color={data.color} bubbles={!!gasType || !!data.stir} gasType={gasType} stir={!!data.stir} />}
      <SolidPieces contents={data.contents} precipitates={data.precipitates} radius={0.036} />
      <PourStream active={pouring} color={data.pourColor || '#cfe3f2'} topY={0.34} />
      {nonCoatingPrecips.map((p, i) => <Precipitate key={i} index={i} radius={0.04} color={p.color} />)}
      {selected && <HighlightRing y={0.37} r={0.075} />}
      {selected && <VesselFloatingBadge y={0.43} data={data} />}
    </group>
  );
}

/* Giá 3 ống nghiệm tương tác thực tế đặt đúng trên mặt bàn (y = 0.48) */
function TestTubeRack({ tubes = [], selected, onSelect }) {
  const rackPos = [-1.05, 0.48, -0.32];
  return (
    <group position={rackPos}>
      {/* Đế gỗ và giá đỡ */}
      <mesh position={[0, 0.014, 0]}>
        <boxGeometry args={[0.36, 0.028, 0.14]} />
        <meshStandardMaterial color="#7c5836" roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.11, 0]}>
        <boxGeometry args={[0.36, 0.016, 0.12]} />
        <meshStandardMaterial color="#8a6748" roughness={0.75} />
      </mesh>
      {[-0.16, 0.16].map((x, idx) => (
        <mesh key={idx} position={[x, 0.062, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.095, 10]} />
          <meshStandardMaterial color="#6b4c30" roughness={0.8} />
        </mesh>
      ))}

      {/* 3 Ống nghiệm thật (tube1, tube2, tube3) */}
      {tubes.map((t, i) => {
        const tx = -0.1 + i * 0.1;
        const fill = Math.min(1, (t.volume || 0) / (t.maxMl || 30));
        const isSel = selected === t.id;
        const gasActive = t.gas && (!t.gas.until || Date.now() < t.gas.until);
        const worldPos = [rackPos[0] + tx, rackPos[1], rackPos[2]];
        return (
          <group
            key={t.id}
            position={[tx, 0.022, 0]}
            userData={{ instrumentId: t.id }}
            onClick={(e) => { e.stopPropagation(); onSelect(t.id, worldPos); }}
            onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
            onPointerOut={() => { document.body.style.cursor = 'auto'; }}
          >
            {/* Thân ống nghiệm */}
            <mesh position={[0, 0.09, 0]}>
              <cylinderGeometry args={[0.024, 0.024, 0.18, 20, 1, true]} />
              <meshPhysicalMaterial color="#e8f2f8" transparent opacity={0.32} transmission={0.62} roughness={0.05} side={THREE.DoubleSide} />
            </mesh>
            {/* Đáy tròn ống nghiệm */}
            <mesh position={[0, 0.004, 0]}>
              <sphereGeometry args={[0.0235, 16, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
              <meshPhysicalMaterial color="#e8f2f8" transparent opacity={0.32} transmission={0.62} />
            </mesh>
            {fill > 0 && (
              <Liquid
                radius={0.022}
                maxH={0.145}
                fill={fill}
                color={t.color}
                bubbles={!!gasActive || !!t.stir}
                gasType={gasActive ? t.gas.gas : null}
                stir={!!t.stir}
              />
            )}
            <SolidPieces contents={t.contents} precipitates={t.precipitates} radius={0.018} />
            {(t.precipitates || []).filter((p) => p.formula !== 'Cu' && p.formula !== 'Ag').map((p, pi) => (
              <Precipitate key={pi} index={pi} radius={0.021} color={p.color} />
            ))}
            <PourStream active={!!t.pouring} color={t.pourColor || '#cfe3f2'} topY={0.19} />
            <Text position={[0, 0.2, 0.026]} fontSize={0.02} color={isSel ? '#60a5fa' : '#cbd5e1'} anchorX="center">
              {`Ống ${i + 1}`}
            </Text>
            {isSel && <HighlightRing y={0.21} r={0.042} color="#38bdf8" />}
            {isSel && <VesselFloatingBadge y={0.27} data={t} />}
          </group>
        );
      })}
    </group>
  );
}

/* Đèn cồn tương tác (click để Bật/Tắt) + ngọn lửa 2 tầng lung linh */
function Burner({ lit, position, onToggle }) {
  const flameRef = useRef();
  useFrame((state) => {
    if (!lit || !flameRef.current) return;
    const t = state.clock.elapsedTime;
    flameRef.current.scale.y = 1 + Math.sin(t * 18) * 0.12 + Math.cos(t * 27) * 0.06;
    flameRef.current.rotation.z = Math.sin(t * 11) * 0.06;
  });

  return (
    <group
      position={position}
      onClick={(e) => { e.stopPropagation(); onToggle?.(); }}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; }}
    >
      <mesh position={[0, 0.025, 0]}>
        <cylinderGeometry args={[0.058, 0.068, 0.05, 20]} />
        <meshStandardMaterial color="#475569" metalness={0.65} roughness={0.32} />
      </mesh>
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.018, 0.026, 0.028, 16]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.25} />
      </mesh>
      {lit && (
        <group ref={flameRef} position={[0, 0.1, 0]}>
          {/* Ngọn lửa ngoài vàng cam */}
          <mesh position={[0, 0.012, 0]}>
            <coneGeometry args={[0.022, 0.085, 14]} />
            <meshStandardMaterial color="#fb923c" emissive="#f97316" emissiveIntensity={2.1} transparent opacity={0.82} />
          </mesh>
          {/* Lõi lửa trong xanh */}
          <mesh position={[0, -0.005, 0]}>
            <coneGeometry args={[0.012, 0.045, 12]} />
            <meshStandardMaterial color="#60a5fa" emissive="#3b82f6" emissiveIntensity={2.4} transparent opacity={0.9} />
          </mesh>
          <pointLight position={[0, 0.08, 0]} color="#fb923c" intensity={1.1} distance={1.6} />
        </group>
      )}
      <Text position={[0, -0.01, 0.085]} fontSize={0.022} color={lit ? '#fb923c' : '#94a3b8'} anchorX="center">
        {lit ? 'ĐÈN CỒN: ĐANG CHÁY' : 'ĐÈN CỒN (BẤM ĐỂ BẬT)'}
      </Text>
    </group>
  );
}

function HighlightRing({ y = 0.3, r = 0.12, color = '#5b6cff' }) {
  const ref = useRef();
  useFrame((s) => { if (ref.current) ref.current.rotation.z = s.clock.elapsedTime * 1.4; });
  return (
    <mesh ref={ref} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[r, 0.006, 8, 32]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} />
    </mesh>
  );
}

/* ---------- PHÒNG & KỆ HÓA CHẤT TƯƠNG TÁC ---------- */
function Room({ onPickChem, selectedChem, onWashSelected }) {
  const floorTex = useMemo(() => tileTexture(), []);
  const benchTex = useMemo(() => benchTexture(), []);
  const periodic = useMemo(() => periodicTexture(), []);
  const bottles = [
    { id: 'HCl', label: 'HCl', color: '#dbe7f4' },
    { id: 'H2SO4', label: 'H2SO4', color: '#e8eef4' },
    { id: 'NaOH', label: 'NaOH', color: '#e6ecf2' },
    { id: 'NH3', label: 'NH3', color: '#e0f2fe' },
    { id: 'CuSO4', label: 'CuSO4', color: '#3b8fe0' },
    { id: 'FeCl3', label: 'FeCl3', color: '#c98a3d' },
    { id: 'AlCl3', label: 'AlCl3', color: '#f1f5f9' },
    { id: 'AgNO3', label: 'AgNO3', color: '#eef3f6' },
    { id: 'BaCl2', label: 'BaCl2', color: '#f3f7fb' },
    { id: 'KMnO4', label: 'KMnO4', color: '#9333ea' },
  ];
  return (
    <group>
      {/* Sàn gạch + tường */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[ROOM.w, ROOM.d]} />
        <meshStandardMaterial map={floorTex} roughness={0.35} metalness={0.08} />
      </mesh>
      {[[-ROOM.w / 2, 0, Math.PI / 2, ROOM.d], [ROOM.w / 2, 0, -Math.PI / 2, ROOM.d], [0, -ROOM.d / 2, 0, ROOM.w]].map(([x, z, ry, len], i) => (
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
      {[-2.4, 2.4].map((x) => (
        <mesh key={x} position={[x, 1.9, -ROOM.d / 2 + 0.02]}>
          <planeGeometry args={[1.6, 1.3]} />
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
      <mesh position={[0, 2.05, -ROOM.d / 2 + 0.04]}>
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

      {/* Kệ hóa chất tương tác trên tường sau (click để chọn nhanh hóa chất) */}
      <mesh position={[0, 1.32, -3.35]}>
        <boxGeometry args={[4.1, 0.05, 0.45]} />
        <meshStandardMaterial color="#6b5b4a" roughness={0.8} />
      </mesh>
      {bottles.map((b, i) => {
        const isPicked = selectedChem === b.id;
        return (
          <group
            key={b.id}
            position={[-1.8 + i * 0.4, 1.46, -3.35]}
            onClick={(e) => { e.stopPropagation(); onPickChem?.(b.id); }}
            onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
            onPointerOut={() => { document.body.style.cursor = 'auto'; }}
          >
            <mesh>
              <cylinderGeometry args={[0.048, 0.054, 0.19, 16]} />
              <meshPhysicalMaterial color={b.color} transparent opacity={0.82} roughness={0.1} transmission={0.35} />
            </mesh>
            <mesh position={[0, 0.11, 0]}>
              <cylinderGeometry args={[0.018, 0.018, 0.032, 12]} />
              <meshStandardMaterial color={isPicked ? '#3b82f6' : '#475569'} />
            </mesh>
            <Text position={[0, -0.15, 0.04]} fontSize={0.048} color={isPicked ? '#2563eb' : '#1e293b'} anchorX="center">
              {b.label}
            </Text>
          </group>
        );
      })}

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

      {/* Bồn rửa (bấm để rửa sạch dụng cụ đang chọn) */}
      <group
        position={[-3.4, 0, -2.4]}
        onClick={(e) => { e.stopPropagation(); onWashSelected?.(); }}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[1.0, 1.0, 0.7]} />
          <meshStandardMaterial color="#cdd4da" roughness={0.6} />
        </mesh>
        <mesh position={[0, 1.01, 0]}>
          <boxGeometry args={[0.5, 0.06, 0.35]} />
          <meshStandardMaterial color="#9aa5ae" metalness={0.5} roughness={0.4} />
        </mesh>
        <Text position={[0, 1.25, 0.36]} fontSize={0.08} color="#2563eb" anchorX="center">BỒN RỬA (BẤM ĐỂ RỬA CỐC)</Text>
      </group>

      {/* Thùng rác hóa chất */}
      <group
        position={[3.8, 0, 1.6]}
        onClick={(e) => { e.stopPropagation(); onWashSelected?.(); }}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.22, 0.19, 0.6, 16]} />
          <meshStandardMaterial color="#facc15" roughness={0.6} />
        </mesh>
        <Text position={[0, 0.75, 0]} fontSize={0.07} color="#854d0e" anchorX="center">THU HỒI HÓA CHẤT</Text>
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
  burnerLit = false, onToggleBurner, testTubes = [], phDisplay = null, scaleMass = 0,
  onMeasurePH, onPickChem, selectedChem, onWashSelected,
  onFpsHover, onFpsUse, interactRef,
}) {
  const shadowOn = quality !== 'low';
  const phColor = phDisplay == null ? '#4ade80' : phDisplay < 6.5 ? '#f87171' : phDisplay > 7.5 ? '#60a5fa' : '#4ade80';

  return (
    <Canvas
      shadows={shadowOn}
      dpr={quality === 'high' ? [1, 1.75] : [0.8, 1.2]}
      camera={{ position: VIEWS.room.pos, fov: 52, near: 0.1, far: 60 }}
      gl={{ antialias: quality !== 'low', powerPreference: 'high-performance' }}
      onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; }}
    >
      <color attach="background" args={['#cdd7e0']} />
      <fog attach="fog" args={['#cdd7e0', 12, 26]} />
      <ambientLight intensity={0.78} />
      <directionalLight position={[3, 5, 4]} intensity={0.95} castShadow={shadowOn} shadow-mapSize={[1024, 1024]} />
      <pointLight position={[-1.8, 2.9, -0.5]} intensity={0.5} />
      <pointLight position={[1.8, 2.9, -0.5]} intensity={0.5} />

      <Room onPickChem={onPickChem} selectedChem={selectedChem} onWashSelected={onWashSelected} />

      <BenchSpotLight />
      <ContactShadows position={[0, 0.481, -0.35]} scale={5} blur={2.2} opacity={0.35} far={1.2} />

      <group ref={interactRef}>
        {vessels.map((c) => {
          const gasActive = c.gas && (!c.gas.until || Date.now() < c.gas.until);
          const props = {
            data: c,
            onSelect,
            selected: selected === c.id,
            gasType: gasActive ? c.gas.gas : null,
            pouring: !!c.pouring,
          };
          if (c.kind === 'erlenmeyer') return <Erlenmeyer key={c.id} {...props} />;
          if (c.kind === 'cylinder') return <GraduatedCylinder key={c.id} {...props} />;
          return <Beaker key={c.id} {...props} />;
        })}
        <TestTubeRack onSelect={onSelect} selected={selected} tubes={testTubes} />
      </group>

      <Burner lit={burnerLit} position={[1.38, 0.48, -0.35]} onToggle={onToggleBurner} />

      {/* Cân điện tử hiển thị khối lượng thật (g) */}
      <group position={[-1.58, 0.48, -0.35]}>
        <mesh position={[0, 0.028, 0]}>
          <boxGeometry args={[0.28, 0.055, 0.24]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.058, -0.02]}>
          <cylinderGeometry args={[0.095, 0.095, 0.008, 24]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.75} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.032, 0.121]}>
          <planeGeometry args={[0.16, 0.032]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        <Text position={[0, 0.032, 0.123]} fontSize={0.022} color="#38bdf8" anchorX="center">
          {`${Number(scaleMass || 0).toFixed(1)} g`}
        </Text>
        <Text position={[0, -0.005, 0.14]} fontSize={0.018} color="#cbd5e1" anchorX="center">
          CÂN ĐIỆN TỬ
        </Text>
      </group>

      {/* Máy đo pH kỹ thuật số (click để đo pH ngay) */}
      <group
        position={[-0.28, 0.48, -0.42]}
        onClick={(e) => { e.stopPropagation(); onMeasurePH?.(); }}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[0.17, 0.1, 0.13]} />
          <meshStandardMaterial color="#1e293b" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.006, 0.006, 0.13, 8]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.7} />
        </mesh>
        <Text position={[0, 0.054, 0.068]} fontSize={0.036} color={phColor} anchorX="center">
          {phDisplay != null ? `pH ${phDisplay.toFixed(1)}` : 'pH --'}
        </Text>
      </group>

      <CameraRig view={view} focus={focus} walk={walk} keysRef={keysRef} />
      <FPSControls enabled={walk} keysRef={keysRef} onHover={onFpsHover} onUse={onFpsUse} interactRef={interactRef} />
    </Canvas>
  );
}
