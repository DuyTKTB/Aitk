/* ============================================================
   Scene.jsx — PHÒNG THÍ NGHIỆM KHOA HỌC 3D CHÂN THỰC (R3F PBR)
   - IBL Studio Lighting (LabStudioEnvironment) cho kính borosilicate & inox
   - Kiến trúc phòng Lab hiện đại: gạch sứ bóng, gạch ốp tường subway,
     cửa sổ khung nhôm nhìn ra bầu trời & hàng cây, bàn đá epoxy có tủ
     & tay nắm inox, tủ hút có quạt quay & đèn trong, bồn rửa vòi cổ ngỗng
     chảy nước thật khi rửa cốc, đèn LED thả trần.
   - Đổ nước chuẩn vật lý (chai nghiêng + dòng parabol + bọt bắn + gợn sóng),
     nước khúc xạ IOR 1.333 dâng mượt & phản ứng kết tủa/khí/màu sống động.
   ============================================================ */
import { useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { CHEMS } from './engine.js';
import {
  LabStudioEnvironment,
  RealisticLiquid,
  RealisticPourEffect,
  PrecipitateVFX,
  GasPlumeVFX,
} from './LabRealismFX.jsx';
import {
  BuretteStation,
  MagneticStirrerPlate,
  FlameTestBurner,
  ElectrolysisStation,
  MoleculeHologramStation,
  OpticsPhysicsStation,
  MicroscopeProp,
} from './LabStations3D.jsx';

/* ---------- TEXTURE PROCEDURAL CHẤT LƯỢNG CAO ---------- */
function tileTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const x = c.getContext('2d');
  x.fillStyle = '#9aa5b1';
  x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const g = x.createLinearGradient(i * 128, j * 128, i * 128 + 128, j * 128 + 128);
      g.addColorStop(0, '#dde4ec');
      g.addColorStop(0.55, '#cfd8e2');
      g.addColorStop(1, '#c3ced9');
      x.fillStyle = g;
      x.fillRect(i * 128 + 2, j * 128 + 2, 124, 124);
      // Vân đá sứ mảnh chân thực
      x.strokeStyle = 'rgba(255,255,255,0.22)';
      x.lineWidth = 1;
      x.beginPath();
      x.moveTo(i * 128 + 12, j * 128 + 20 + ((i + j) * 17) % 60);
      x.bezierCurveTo(i * 128 + 48, j * 128 + 50, i * 128 + 80, j * 128 + 30, i * 128 + 116, j * 128 + 92);
      x.stroke();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(5, 4);
  t.anisotropy = 8;
  return t;
}

function subwayWallTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const x = c.getContext('2d');
  x.fillStyle = '#cbd5e1';
  x.fillRect(0, 0, 512, 512);
  const rows = 16;
  const cols = 4;
  const rh = 512 / rows;
  const cw = 512 / cols;
  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (cw / 2);
    for (let col = -1; col <= cols; col++) {
      const gx = col * cw + offset;
      const gy = r * rh;
      const shade = 244 + ((r * 7 + col * 11) % 7);
      x.fillStyle = `rgb(${shade}, ${shade + 2}, ${shade + 5})`;
      x.fillRect(gx + 1.5, gy + 1.5, cw - 3, rh - 3);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(6, 2.2);
  t.anisotropy = 4;
  return t;
}

function benchTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 512, 512);
  g.addColorStop(0, '#161f2b');
  g.addColorStop(1, '#1e2938');
  x.fillStyle = g;
  x.fillRect(0, 0, 512, 512);
  for (let k = 0; k < 2200; k++) {
    x.fillStyle = k % 3 === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(148,163,184,0.06)';
    x.fillRect(Math.random() * 512, Math.random() * 512, 1.8, 1.8);
  }
  for (let k = 0; k < 900; k++) {
    x.fillStyle = 'rgba(0,0,0,0.22)';
    x.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(4, 1);
  t.anisotropy = 4;
  return t;
}

function windowSkyTexture(lightMode = 'day') {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 384;
  const x = c.getContext('2d');
  const sky = x.createLinearGradient(0, 0, 0, 384);
  if (lightMode === 'dark') {
    sky.addColorStop(0, '#040814');
    sky.addColorStop(0.65, '#0f172a');
    sky.addColorStop(1, '#1e293b');
  } else if (lightMode === 'cyber') {
    sky.addColorStop(0, '#0f172a');
    sky.addColorStop(0.55, '#1e3a8a');
    sky.addColorStop(1, '#312e81');
  } else {
    sky.addColorStop(0, '#60a5fa');
    sky.addColorStop(0.55, '#bae6fd');
    sky.addColorStop(1, '#f0f9ff');
  }
  x.fillStyle = sky;
  x.fillRect(0, 0, 512, 384);

  if (lightMode === 'day') {
    // Mây nhẹ tự nhiên
    x.fillStyle = 'rgba(255,255,255,0.68)';
    [[110, 95, 58], [155, 88, 46], [340, 125, 64], [390, 118, 44]].forEach(([cx, cy, cr]) => {
      x.beginPath(); x.arc(cx, cy, cr, 0, Math.PI * 2); x.fill();
    });
  } else {
    // Đêm sao nhẹ
    x.fillStyle = 'rgba(255,255,255,0.75)';
    for (let i = 0; i < 45; i++) {
      x.fillRect((i * 73) % 500, (i * 41) % 210, 2, 2);
    }
  }
  // Bóng tán cây khuôn viên trường phía ngoài cửa sổ
  x.fillStyle = lightMode === 'day' ? '#4d7c58' : '#0f1d24';
  for (let i = 0; i < 12; i++) {
    x.beginPath();
    x.arc(i * 48, 355 + (i % 3) * 14, 52 + (i % 2) * 16, 0, Math.PI * 2);
    x.fill();
  }
  return new THREE.CanvasTexture(c);
}

function periodicTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 288;
  const x = c.getContext('2d');
  x.fillStyle = '#f8fafc';
  x.fillRect(0, 0, 512, 288);
  x.fillStyle = '#0f172a';
  x.font = 'bold 20px sans-serif';
  x.fillText('BẢNG TUẦN HOÀN NGUYÊN TỐ · IUPAC', 78, 28);
  const groups = ['#ef4444', '#f59e0b', '#22c55e', '#0ea5e9', '#6366f1', '#a855f7', '#ec4899', '#64748b'];
  for (let col = 0; col < 18; col++) {
    for (let row = 0; row < 7; row++) {
      if ((col === 0 && row > 0) || (col === 17 && row > 1)) continue;
      if (row === 6 && col > 1) continue;
      x.fillStyle = groups[(col + row) % 8];
      x.globalAlpha = 0.88;
      x.fillRect(14 + col * 27, 45 + row * 30, 24, 26);
      x.globalAlpha = 1;
      x.strokeStyle = '#ffffff';
      x.strokeRect(14 + col * 27, 45 + row * 30, 24, 26);
    }
  }
  return new THREE.CanvasTexture(c);
}

/* ---------- CAMERA PRESETS (Đa trạm Lab 3D Pro — căn khung logic từng trạm) ---------- */
export const VIEWS = {
  room: { pos: [0, 2.75, 5.2], target: [0, 0.92, -0.2] },
  bench: { pos: [0.06, 1.38, 1.62], target: [0.06, 0.68, -0.32] },
  titration: { pos: [0.88, 1.08, 0.54], target: [0.88, 0.78, -0.3] },
  electrolysis: { pos: [-1.72, 1.22, 0.35], target: [-3.3, 0.74, 0.35] },
  molecules: { pos: [1.72, 1.28, 0.35], target: [3.3, 0.94, 0.35] },
  optics: { pos: [0, 1.26, -0.82], target: [0, 0.78, -2.55] },
  close: { pos: [-0.46, 0.98, 0.44], target: [-0.46, 0.68, -0.32] },
};

const ROOM = { w: 10, d: 8, h: 3.3 };

/* ---------- FPS CONTROLS — pointer lock + raycast tương tác ---------- */
function FPSControls({ enabled, keysRef, onHover, onUse, interactRef }) {
  const { camera, gl } = useThree();
  const yaw = useRef(0);
  const pitch = useRef(0);
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
    if (k.w) move.add(fwd);
    if (k.s) move.sub(fwd);
    if (k.d) move.add(right);
    if (k.a) move.sub(right);
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
        if (o) {
          id = o.userData.instrumentId;
          break;
        }
      }
      onHover?.(id);
    }
  });
  return null;
}

function CameraRig({ view, focus, walk, keysRef }) {
  const { camera, controls } = useThree();
  const target = useRef(new THREE.Vector3(...VIEWS.bench.target));
  const desired = useRef(new THREE.Vector3(...VIEWS.bench.pos));
  const transitioningRef = useRef(true);

  useEffect(() => {
    transitioningRef.current = true;
    if (focus?.pos) {
      const [fx, fy, fz] = focus.pos;
      desired.current.set(fx, fy + 0.34, fz + 0.62);
      target.current.set(fx, fy + 0.14, fz);
      return;
    }
    const v = focus?.view || VIEWS[view] || VIEWS.bench;
    desired.current.set(...v.pos);
    target.current.set(...v.target);
  }, [view, focus]);

  useFrame((state, dt) => {
    if (walk) return;
    let movedByKeys = false;
    if (keysRef?.current) {
      const k = keysRef.current;
      const speed = (k.shift ? 3.2 : 1.8) * dt;
      const dir = new THREE.Vector3();
      if (k.w) dir.z -= 1;
      if (k.s) dir.z += 1;
      if (k.a) dir.x -= 1;
      if (k.d) dir.x += 1;
      if (dir.lengthSq() > 0) {
        movedByKeys = true;
        transitioningRef.current = true;
        dir.normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), state.camera.rotation.y);
        desired.current.copy(camera.position).addScaledVector(dir, speed);
        if (controls) target.current.copy(controls.target).addScaledVector(dir, speed);
        desired.current.x = THREE.MathUtils.clamp(desired.current.x, -ROOM.w / 2 + 0.6, ROOM.w / 2 - 0.6);
        desired.current.z = THREE.MathUtils.clamp(desired.current.z, -ROOM.d / 2 + 0.6, ROOM.d / 2 - 0.6);
      }
    }
    if (transitioningRef.current || movedByKeys) {
      camera.position.lerp(desired.current, Math.min(1, dt * 4.5));
      if (controls) controls.target.lerp(target.current, Math.min(1, dt * 4.5));
      if (
        !movedByKeys
        && camera.position.distanceToSquared(desired.current) < 0.0005
        && (!controls || controls.target.distanceToSquared(target.current) < 0.0005)
      ) {
        transitioningRef.current = false;
      }
    }
  });

  return (
    <OrbitControls
      makeDefault
      enabled={!walk}
      onStart={() => { transitioningRef.current = false; }}
      enablePan={false}
      minDistance={0.32}
      maxDistance={8.5}
      maxPolarAngle={Math.PI / 2.02}
      minPolarAngle={0.12}
    />
  );
}

/* ---------- CHẤT RẮN TRONG CỐC (Đinh sắt, dây đồng, kẽm, đá vôi, MnO2) ---------- */
function SolidPieces({ contents = [], precipitates = [], radius = 0.07 }) {
  const solids = contents.filter((c) => CHEMS[c.id]?.state === 'solid' && (c.gram || 0) > 0.02);
  if (!solids.length) return null;
  const coating = precipitates.find((p) => p.formula === 'Cu' || p.formula === 'Ag');

  return (
    <group position={[0, 0.02, 0]}>
      {solids.map((s) => {
        const chem = CHEMS[s.id];
        const scale = Math.max(0.45, Math.min(1.25, (s.gram || 2) / (chem.solidGram || 3)));
        const matColor = coating ? coating.color : chem.color;
        if (chem.shape === 'nail') {
          return (
            <mesh key={s.id} position={[0, 0.028 * scale, 0]} rotation={[0.2, 0.4, -0.85]} scale={scale} castShadow>
              <cylinderGeometry args={[0.0055, 0.004, 0.11, 12]} />
              <meshStandardMaterial color={matColor} metalness={0.85} roughness={0.22} />
            </mesh>
          );
        }
        if (chem.shape === 'strip') {
          return (
            <mesh key={s.id} position={[0, 0.015, 0]} rotation={[0.3, 0.5, -0.6]} scale={scale} castShadow>
              <boxGeometry args={[0.055, 0.004, 0.016]} />
              <meshStandardMaterial color={matColor} metalness={0.8} roughness={0.25} />
            </mesh>
          );
        }
        return (
          <group key={s.id} scale={scale}>
            {[[-0.018, 0, -0.01], [0.016, 0, 0.012], [0.002, 0, -0.018], [-0.008, 0, 0.016]].map(([gx, gy, gz], idx) => (
              <mesh key={idx} position={[gx * (radius / 0.07), gy, gz * (radius / 0.07)]} castShadow>
                <dodecahedronGeometry args={[0.011, 0]} />
                <meshStandardMaterial color={matColor} roughness={0.58} metalness={chem.cat === 'kim-loai' ? 0.72 : 0.12} />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}

/* ---------- THỦY TINH BOROSILICATE PYREX CHÂN THỰC ---------- */
function ErlenmeyerGlass(props) {
  const geo = useMemo(() => {
    const pts = [
      new THREE.Vector2(0.001, 0), new THREE.Vector2(0.108, 0), new THREE.Vector2(0.112, 0.015),
      new THREE.Vector2(0.112, 0.028), new THREE.Vector2(0.052, 0.26), new THREE.Vector2(0.05, 0.3),
      new THREE.Vector2(0.058, 0.3), new THREE.Vector2(0.058, 0.345), new THREE.Vector2(0.046, 0.345),
      new THREE.Vector2(0.046, 0.305), new THREE.Vector2(0.04, 0.3), new THREE.Vector2(0.04, 0.27),
      new THREE.Vector2(0.104, 0.045), new THREE.Vector2(0.001, 0.045),
    ];
    return new THREE.LatheGeometry(pts, 40);
  }, []);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <group {...props}>
      <mesh geometry={geo} castShadow>
        <meshPhysicalMaterial
          color="#f0f9ff"
          transparent
          opacity={0.28}
          roughness={0.03}
          metalness={0.02}
          transmission={0.78}
          thickness={0.035}
          ior={1.47}
          clearcoat={1}
          clearcoatRoughness={0.03}
          envMapIntensity={1.7}
          side={THREE.DoubleSide}
        />
      </mesh>
      {[0.08, 0.14, 0.2].map((y, idx) => (
        <mesh key={idx} position={[0, y, 0.095 - idx * 0.016]}>
          <boxGeometry args={[0.02, 0.0022, 0.001]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.72} />
        </mesh>
      ))}
    </group>
  );
}

function BeakerGlass(props) {
  const geo = useMemo(() => {
    const pts = [
      new THREE.Vector2(0.001, 0), new THREE.Vector2(0.082, 0), new THREE.Vector2(0.085, 0.01),
      new THREE.Vector2(0.085, 0.25), new THREE.Vector2(0.088, 0.258), new THREE.Vector2(0.094, 0.262),
      new THREE.Vector2(0.088, 0.266), new THREE.Vector2(0.082, 0.27), new THREE.Vector2(0.082, 0.255),
      new THREE.Vector2(0.078, 0.255), new THREE.Vector2(0.078, 0.01), new THREE.Vector2(0.001, 0.01),
    ];
    return new THREE.LatheGeometry(pts, 40);
  }, []);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <group {...props}>
      <mesh geometry={geo} castShadow>
        <meshPhysicalMaterial
          color="#f0f9ff"
          transparent
          opacity={0.28}
          roughness={0.03}
          metalness={0.02}
          transmission={0.78}
          thickness={0.035}
          ior={1.47}
          clearcoat={1}
          clearcoatRoughness={0.03}
          envMapIntensity={1.75}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Vạch chia mL in men trắng chuẩn PYREX */}
      {[0.055, 0.105, 0.155, 0.205].map((y, idx) => (
        <group key={idx} position={[0, y, 0.0858]}>
          <mesh>
            <boxGeometry args={[idx % 2 === 1 ? 0.026 : 0.018, 0.0022, 0.001]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.82} />
          </mesh>
        </group>
      ))}
      <Text position={[0.03, 0.222, 0.086]} fontSize={0.011} color="#ffffff" anchorX="center">
        250 mL
      </Text>
    </group>
  );
}

function Glass({ radius = 0.09, height = 0.26, ...props }) {
  return (
    <mesh {...props} castShadow>
      <cylinderGeometry args={[radius, radius, height, 32, 1, true]} />
      <meshPhysicalMaterial
        color="#f0f9ff"
        transparent
        opacity={0.26}
        roughness={0.03}
        metalness={0.02}
        transmission={0.76}
        thickness={0.03}
        ior={1.47}
        clearcoat={1}
        envMapIntensity={1.65}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function HighlightRing({ r = 0.115, color = '#2563eb' }) {
  const ref = useRef();
  useFrame((s) => {
    if (!ref.current) return;
    const pulse = 1 + Math.sin(s.clock.elapsedTime * 3) * 0.03;
    ref.current.scale.set(pulse, pulse, 1);
  });
  return (
    <mesh ref={ref} position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[r * 0.88, r, 48]} />
      <meshBasicMaterial color={color} transparent opacity={0.78} side={THREE.DoubleSide} />
    </mesh>
  );
}

/* ---------- 3 DỤNG CỤ CHÍNH + GIÁ 3 ỐNG NGHIỆM ---------- */
function Beaker({ data, onSelect, selected, gasType, pouring }) {
  const fill = Math.min(1, (data.volume || 0) / data.maxMl);
  const nonCoatingPrecips = (data.precipitates || []).filter((p) => p.formula !== 'Cu' && p.formula !== 'Ag');
  const surfaceY = 0.014 + fill * 0.22;
  const showPlume = ((data.temp || 25) >= 52 && fill > 0) || gasType === 'NO2' || gasType === 'O2';
  return (
    <group
      position={data.position}
      userData={{ instrumentId: data.id }}
      onClick={(e) => { e.stopPropagation(); onSelect(data.id, data.position); }}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; }}
    >
      <BeakerGlass position={[0, 0, 0]} />
      <RealisticLiquid
        radiusBottom={0.077}
        maxH={0.22}
        baseY={0.014}
        fill={fill}
        color={data.color}
        bubbles={!!gasType || !!data.stir}
        gasType={gasType}
        stir={!!data.stir}
        pouring={pouring}
        reactionFx={data.reactionFx}
      />
      <SolidPieces contents={data.contents} precipitates={data.precipitates} radius={0.072} />
      <RealisticPourEffect active={pouring} color={data.pourColor || '#cfe3f2'} topY={0.27} surfaceY={surfaceY} vesselRadius={0.077} />
      <GasPlumeVFX active={showPlume} topY={0.27} radius={0.055} gasType={gasType} />
      {nonCoatingPrecips.map((p, i) => (
        <PrecipitateVFX key={i} index={i} radius={0.074} color={p.color} formula={p.formula} liquidHeight={Math.max(0.06, fill * 0.2)} />
      ))}
      <mesh position={[0, 0.262, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.084, 0.003, 10, 32]} />
        <meshPhysicalMaterial color="#ffffff" transparent opacity={0.55} roughness={0.05} />
      </mesh>
      {selected && <HighlightRing r={0.104} />}
    </group>
  );
}

function Erlenmeyer({ data, onSelect, selected, gasType, pouring }) {
  const fill = Math.min(1, (data.volume || 0) / data.maxMl);
  const nonCoatingPrecips = (data.precipitates || []).filter((p) => p.formula !== 'Cu' && p.formula !== 'Ag');
  const surfaceY = 0.02 + fill * 0.21;
  const showPlume = ((data.temp || 25) >= 52 && fill > 0) || gasType === 'NO2' || gasType === 'O2';
  return (
    <group
      position={data.position}
      userData={{ instrumentId: data.id }}
      onClick={(e) => { e.stopPropagation(); onSelect(data.id, data.position); }}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; }}
    >
      <ErlenmeyerGlass position={[0, 0, 0]} />
      <RealisticLiquid
        radiusBottom={0.102}
        radiusTopAtMax={0.048}
        maxH={0.21}
        baseY={0.02}
        fill={fill}
        color={data.color}
        bubbles={!!gasType || !!data.stir}
        gasType={gasType}
        stir={!!data.stir}
        pouring={pouring}
        reactionFx={data.reactionFx}
      />
      <SolidPieces contents={data.contents} precipitates={data.precipitates} radius={0.08} />
      <RealisticPourEffect active={pouring} color={data.pourColor || '#cfe3f2'} topY={0.34} surfaceY={surfaceY} vesselRadius={0.052} />
      <GasPlumeVFX active={showPlume} topY={0.35} radius={0.036} gasType={gasType} />
      {nonCoatingPrecips.map((p, i) => (
        <PrecipitateVFX key={i} index={i} radius={0.095} color={p.color} formula={p.formula} liquidHeight={Math.max(0.06, fill * 0.19)} />
      ))}
      {selected && <HighlightRing r={0.125} />}
    </group>
  );
}

function GraduatedCylinder({ data, onSelect, selected, gasType, pouring }) {
  const fill = Math.min(1, (data.volume || 0) / data.maxMl);
  const nonCoatingPrecips = (data.precipitates || []).filter((p) => p.formula !== 'Cu' && p.formula !== 'Ag');
  const surfaceY = 0.018 + fill * 0.29;
  const showPlume = ((data.temp || 25) >= 52 && fill > 0) || gasType === 'NO2' || gasType === 'O2';
  return (
    <group
      position={data.position}
      userData={{ instrumentId: data.id }}
      onClick={(e) => { e.stopPropagation(); onSelect(data.id, data.position); }}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; }}
    >
      <Glass radius={0.044} height={0.33} position={[0, 0.17, 0]} />
      <mesh position={[0, 0.008, 0]} castShadow>
        <cylinderGeometry args={[0.068, 0.072, 0.016, 6]} />
        <meshPhysicalMaterial color="#e2eef8" transparent opacity={0.62} roughness={0.12} clearcoat={1} />
      </mesh>
      {[0.07, 0.13, 0.19, 0.25, 0.3].map((y, idx) => (
        <mesh key={idx} position={[0, y, 0.045]}>
          <boxGeometry args={[0.016, 0.002, 0.001]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.82} />
        </mesh>
      ))}
      <RealisticLiquid
        radiusBottom={0.041}
        maxH={0.29}
        baseY={0.018}
        fill={fill}
        color={data.color}
        bubbles={!!gasType || !!data.stir}
        gasType={gasType}
        stir={!!data.stir}
        pouring={pouring}
        reactionFx={data.reactionFx}
      />
      <SolidPieces contents={data.contents} precipitates={data.precipitates} radius={0.036} />
      <RealisticPourEffect active={pouring} color={data.pourColor || '#cfe3f2'} topY={0.34} surfaceY={surfaceY} vesselRadius={0.044} />
      <GasPlumeVFX active={showPlume} topY={0.34} radius={0.032} gasType={gasType} />
      {nonCoatingPrecips.map((p, i) => (
        <PrecipitateVFX key={i} index={i} radius={0.039} color={p.color} formula={p.formula} liquidHeight={Math.max(0.06, fill * 0.26)} />
      ))}
      {selected && <HighlightRing r={0.09} />}
    </group>
  );
}

function TestTubeRack({ tubes = [], selected, onSelect }) {
  const rackPos = [-1.16, 0.48, -0.32];
  return (
    <group position={rackPos}>
      {/* Giá gỗ sồi bóng hiện đại */}
      <mesh position={[0, 0.014, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.38, 0.028, 0.14]} />
        <meshStandardMaterial color="#8c6239" roughness={0.45} metalness={0.06} />
      </mesh>
      <mesh position={[0, 0.112, 0]} castShadow>
        <boxGeometry args={[0.38, 0.016, 0.12]} />
        <meshStandardMaterial color="#9c7044" roughness={0.45} metalness={0.06} />
      </mesh>
      {[-0.165, 0.165].map((x, idx) => (
        <mesh key={idx} position={[x, 0.062, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.098, 12]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.88} roughness={0.2} />
        </mesh>
      ))}

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
            <mesh position={[0, 0.092, 0]} castShadow>
              <cylinderGeometry args={[0.024, 0.024, 0.184, 24, 1, true]} />
              <meshPhysicalMaterial color="#f0f9ff" transparent opacity={0.28} transmission={0.76} ior={1.47} roughness={0.04} clearcoat={1} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, 0.004, 0]}>
              <sphereGeometry args={[0.0238, 18, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
              <meshPhysicalMaterial color="#f0f9ff" transparent opacity={0.28} transmission={0.76} ior={1.47} />
            </mesh>
            <RealisticLiquid
              radiusBottom={0.022}
              maxH={0.145}
              baseY={0.008}
              fill={fill}
              color={t.color}
              bubbles={!!gasActive || !!t.stir}
              gasType={gasActive ? t.gas.gas : null}
              stir={!!t.stir}
              pouring={!!t.pouring}
              reactionFx={t.reactionFx}
            />
            <SolidPieces contents={t.contents} precipitates={t.precipitates} radius={0.018} />
            {(t.precipitates || []).filter((p) => p.formula !== 'Cu' && p.formula !== 'Ag').map((p, pi) => (
              <PrecipitateVFX key={pi} index={pi} radius={0.021} color={p.color} formula={p.formula} liquidHeight={Math.max(0.04, fill * 0.13)} />
            ))}
            <RealisticPourEffect active={!!t.pouring} color={t.pourColor || '#cfe3f2'} topY={0.19} surfaceY={0.01 + fill * 0.14} vesselRadius={0.024} />
            {isSel && <HighlightRing r={0.034} />}
          </group>
        );
      })}
    </group>
  );
}

/* ---------- BỒN RỬA VÒI CỔ NGỖNG INOX + DÒNG NƯỚC CHẢY THẬT ---------- */
function WashSinkUnit({ washing = false, onWashSelected }) {
  const waterRef = useRef();
  const faucetGeo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 1.02, -0.22),
      new THREE.Vector3(0, 1.24, -0.22),
      new THREE.Vector3(0, 1.34, -0.1),
      new THREE.Vector3(0, 1.26, 0.02),
    ]);
    return new THREE.TubeGeometry(curve, 20, 0.014, 12, false);
  }, []);
  useEffect(() => () => faucetGeo.dispose(), [faucetGeo]);

  useFrame((state) => {
    if (!waterRef.current) return;
    waterRef.current.visible = washing;
    if (washing) {
      const t = state.clock.elapsedTime;
      waterRef.current.scale.x = 0.85 + Math.sin(t * 28) * 0.16;
      waterRef.current.scale.z = 0.85 + Math.cos(t * 24) * 0.16;
    }
  });

  return (
    <group
      position={[-3.4, 0, -2.4]}
      onClick={(e) => { e.stopPropagation(); onWashSelected?.(); }}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; }}
    >
      {/* Thân tủ bồn rửa */}
      <mesh position={[0, 0.48, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.08, 0.96, 0.74]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.45} metalness={0.08} />
      </mesh>
      {/* Mặt đá trên bồn rửa */}
      <mesh position={[0, 0.98, 0]}>
        <boxGeometry args={[1.12, 0.05, 0.78]} />
        <meshStandardMaterial color="#1e293b" roughness={0.28} metalness={0.18} />
      </mesh>
      {/* Chậu rửa inox âm */}
      <mesh position={[0, 1.01, 0.02]}>
        <boxGeometry args={[0.58, 0.02, 0.42]} />
        <meshStandardMaterial color="#64748b" metalness={0.88} roughness={0.22} />
      </mesh>
      {/* Vòi cổ ngỗng inox bóng */}
      <mesh geometry={faucetGeo} castShadow>
        <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.12} />
      </mesh>
      {/* Van nóng/lạnh */}
      <mesh position={[-0.1, 1.03, -0.22]}>
        <cylinderGeometry args={[0.022, 0.022, 0.04, 14]} />
        <meshStandardMaterial color="#ef4444" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0.1, 1.03, -0.22]}>
        <cylinderGeometry args={[0.022, 0.022, 0.04, 14]} />
        <meshStandardMaterial color="#3b82f6" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Dòng nước rửa chảy từ vòi xuống chậu */}
      <mesh ref={waterRef} position={[0, 1.135, 0.02]} visible={false}>
        <cylinderGeometry args={[0.009, 0.013, 0.24, 12]} />
        <meshPhysicalMaterial color="#bae6fd" transparent opacity={0.78} roughness={0.05} ior={1.333} />
      </mesh>
    </group>
  );
}

/* ---------- TỦ HÚT KHÍ ĐỘC CÓ QUẠT QUAY & ĐÈN LÀM VIỆC ---------- */
function FumeHoodUnit() {
  const fanRef = useRef();
  useFrame((_, dt) => {
    if (fanRef.current) fanRef.current.rotation.y += dt * 7;
  });
  return (
    <group position={[3.4, 0, -2.4]}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[1.45, 0.9, 0.85]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.5} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.92, 0]}>
        <boxGeometry args={[1.48, 0.06, 0.88]} />
        <meshStandardMaterial color="#1e293b" roughness={0.28} metalness={0.2} />
      </mesh>
      {/* Buồng hút kính trên */}
      <mesh position={[0, 1.58, -0.38]}>
        <boxGeometry args={[1.42, 1.28, 0.08]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.5} />
      </mesh>
      {[-0.68, 0.68].map((x) => (
        <mesh key={x} position={[x, 1.58, 0]}>
          <boxGeometry args={[0.08, 1.28, 0.82]} />
          <meshStandardMaterial color="#d7dde3" roughness={0.45} />
        </mesh>
      ))}
      <mesh position={[0, 2.24, 0]}>
        <boxGeometry args={[1.46, 0.14, 0.86]} />
        <meshStandardMaterial color="#475569" metalness={0.4} roughness={0.4} />
      </mesh>
      {/* Kính trượt cường lực */}
      <mesh position={[0, 1.66, 0.39]}>
        <planeGeometry args={[1.28, 0.86]} />
        <meshPhysicalMaterial color="#dff2ff" transparent opacity={0.28} transmission={0.75} roughness={0.05} ior={1.48} />
      </mesh>
      {/* Quạt hút xoay trên nóc */}
      <group ref={fanRef} position={[0, 2.34, 0]}>
        <mesh><boxGeometry args={[0.38, 0.02, 0.07]} /><meshStandardMaterial color="#94a3b8" metalness={0.8} /></mesh>
        <mesh rotation={[0, Math.PI / 2, 0]}><boxGeometry args={[0.38, 0.02, 0.07]} /><meshStandardMaterial color="#94a3b8" metalness={0.8} /></mesh>
      </group>
      <pointLight position={[0, 2.08, 0]} color="#e0f2fe" intensity={0.65} distance={2.2} />
    </group>
  );
}

/* ---------- PHÒNG THÍ NGHIỆM KIẾN TRÚC HIỆN ĐẠI ---------- */
function Room({ onPickChem, selectedChem, onWashSelected, lightMode = 'day', washing = false }) {
  const floorTex = useMemo(() => tileTexture(), []);
  const wallTex = useMemo(() => subwayWallTexture(), []);
  const benchTex = useMemo(() => benchTexture(), []);
  const periodic = useMemo(() => periodicTexture(), []);
  const skyTex = useMemo(() => windowSkyTexture(lightMode), [lightMode]);

  useEffect(() => () => {
    floorTex.dispose();
    wallTex.dispose();
    benchTex.dispose();
    periodic.dispose();
    if (typeof document !== 'undefined') document.body.style.cursor = 'auto';
  }, [floorTex, wallTex, benchTex, periodic]);

  useEffect(() => () => skyTex.dispose(), [skyTex]);

  const bottles = [
    { id: 'HCl', label: 'HCl', color: '#e0f2fe', amber: false },
    { id: 'H2SO4', label: 'H2SO4', color: '#f1f5f9', amber: false },
    { id: 'NaOH', label: 'NaOH', color: '#f1f5f9', amber: false },
    { id: 'NH3', label: 'NH3', color: '#dbeafe', amber: false },
    { id: 'CuSO4', label: 'CuSO4', color: '#2563eb', amber: false },
    { id: 'FeCl3', label: 'FeCl3', color: '#d97706', amber: true },
    { id: 'PbNO32', label: 'Pb(NO3)2', color: '#f8fafc', amber: false },
    { id: 'KI', label: 'KI', color: '#f8fafc', amber: true },
    { id: 'H2O2', label: 'H2O2', color: '#e0f2fe', amber: true },
    { id: 'KMnO4', label: 'KMnO4', color: '#9333ea', amber: true },
  ];

  const isDark = lightMode === 'dark';

  return (
    <group>
      {/* Sàn gạch sứ bóng phản chiếu ánh sáng nhẹ */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[ROOM.w, ROOM.d]} />
        <meshStandardMaterial map={floorTex} roughness={0.22} metalness={0.12} envMapIntensity={0.9} />
      </mesh>

      {/* Len chân tường tối màu */}
      {[[-ROOM.w / 2, 0, Math.PI / 2, ROOM.d], [ROOM.w / 2, 0, -Math.PI / 2, ROOM.d], [0, -ROOM.d / 2, 0, ROOM.w]].map(([x, z, ry, len], i) => (
        <mesh key={i} position={[x, 0.06, z]} rotation={[0, ry, 0]}>
          <boxGeometry args={[len, 0.12, 0.03]} />
          <meshStandardMaterial color="#334155" roughness={0.5} />
        </mesh>
      ))}

      {/* Tường sau ốp gạch sứ trắng phòng Lab hiện đại */}
      <mesh position={[0, ROOM.h / 2, -ROOM.d / 2]}>
        <planeGeometry args={[ROOM.w, ROOM.h]} />
        <meshStandardMaterial map={wallTex} color={isDark ? '#475569' : '#ffffff'} roughness={0.32} metalness={0.05} />
      </mesh>
      {/* Tường trái & phải tông xám kiến trúc sạch sẽ */}
      <mesh position={[-ROOM.w / 2, ROOM.h / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[ROOM.d, ROOM.h]} />
        <meshStandardMaterial color={isDark ? '#1e293b' : '#e8eef4'} roughness={0.75} />
      </mesh>
      <mesh position={[ROOM.w / 2, ROOM.h / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[ROOM.d, ROOM.h]} />
        <meshStandardMaterial color={isDark ? '#1e293b' : '#e8eef4'} roughness={0.75} />
      </mesh>
      {/* Trần phòng cách âm */}
      <mesh position={[0, ROOM.h, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROOM.w, ROOM.d]} />
        <meshStandardMaterial color={isDark ? '#0f172a' : '#f1f5f9'} roughness={0.9} />
      </mesh>

      {/* 2 Cửa sổ toàn cảnh khung nhôm tối + cảnh bầu trời & cây ngoài trời */}
      {[-2.85, 2.85].map((wx) => (
        <group key={wx} position={[wx, 2.02, -ROOM.d / 2 + 0.03]}>
          <mesh>
            <planeGeometry args={[2.0, 1.38]} />
            <meshStandardMaterial map={skyTex} emissive={isDark ? '#0f172a' : '#bae6fd'} emissiveIntensity={isDark ? 0.25 : 0.45} />
          </mesh>
          {/* Khung nhôm & đố cửa */}
          <mesh position={[0, 0.7, 0.02]}><boxGeometry args={[2.08, 0.06, 0.06]} /><meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} /></mesh>
          <mesh position={[0, -0.7, 0.02]}><boxGeometry args={[2.08, 0.07, 0.1]} /><meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} /></mesh>
          <mesh position={[-1.01, 0, 0.02]}><boxGeometry args={[0.06, 1.44, 0.06]} /><meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} /></mesh>
          <mesh position={[1.01, 0, 0.02]}><boxGeometry args={[0.06, 1.44, 0.06]} /><meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} /></mesh>
          <mesh position={[0, 0, 0.02]}><boxGeometry args={[0.035, 1.38, 0.04]} /><meshStandardMaterial color="#334155" metalness={0.7} /></mesh>
        </group>
      ))}

      {/* Bàn đảo thí nghiệm trung tâm — mặt đá Epoxy đen 4.6m + viền thép + tủ kéo có tay nắm inox */}
      <group position={[0, 0, -0.35]}>
        {/* Mặt đá Epoxy bóng mờ */}
        <mesh position={[0, 0.45, 0]} receiveShadow castShadow>
          <boxGeometry args={[4.6, 0.06, 1.12]} />
          <meshStandardMaterial map={benchTex} roughness={0.18} metalness={0.16} envMapIntensity={1.15} />
        </mesh>
        {/* Viền inox trước mặt bàn */}
        <mesh position={[0, 0.45, 0.564]}>
          <boxGeometry args={[4.62, 0.062, 0.012]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.18} />
        </mesh>
        {/* Dải LED hắt gầm bàn ánh sáng kiến trúc ấm dịu */}
        <mesh position={[0, 0.415, 0.51]}>
          <boxGeometry args={[4.3, 0.008, 0.014]} />
          <meshStandardMaterial color="#fef3c7" emissive="#fde68a" emissiveIntensity={isDark ? 0.9 : 0.35} />
        </mesh>
        {/* Thân tủ lab trắng-xám + 4 ngăn kéo có tay nắm nhôm */}
        <mesh position={[0, 0.21, 0]} receiveShadow>
          <boxGeometry args={[4.36, 0.42, 0.9]} />
          <meshStandardMaterial color="#334155" roughness={0.55} />
        </mesh>
        {[-1.56, -0.52, 0.52, 1.56].map((dx) => (
          <group key={dx} position={[dx, 0.22, 0.455]}>
            <mesh>
              <boxGeometry args={[0.96, 0.34, 0.02]} />
              <meshStandardMaterial color="#e2e8f0" roughness={0.38} metalness={0.05} />
            </mesh>
            <mesh position={[0, 0.1, 0.022]}>
              <boxGeometry args={[0.22, 0.018, 0.02]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.92} roughness={0.16} />
            </mesh>
          </group>
        ))}
        {/* Thanh chắn dụng cụ inox phía sau bàn */}
        <mesh position={[0, 0.75, -0.5]}>
          <boxGeometry args={[4.48, 0.022, 0.018]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.18} />
        </mesh>
      </group>

      {/* Ghế đẩu phòng Lab chân inox bóng */}
      {[-1.6, 0, 1.6].map((x) => (
        <group key={x} position={[x, 0, 0.42]}>
          <mesh position={[0, 0.52, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.17, 0.055, 24]} />
            <meshStandardMaterial color="#1e293b" roughness={0.42} />
          </mesh>
          <mesh position={[0, 0.26, 0]}>
            <cylinderGeometry args={[0.028, 0.028, 0.48, 14]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.92} roughness={0.15} />
          </mesh>
          <mesh position={[0, 0.025, 0]}>
            <cylinderGeometry args={[0.21, 0.22, 0.03, 24]} />
            <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.25} />
          </mesh>
        </group>
      ))}

      {/* Bảng tuần hoàn IUPAC có khung nhôm trên tường sau */}
      <group position={[0, 2.25, -ROOM.d / 2 + 0.04]}>
        <mesh><boxGeometry args={[2.02, 1.16, 0.03]} /><meshStandardMaterial color="#334155" metalness={0.6} roughness={0.35} /></mesh>
        <mesh position={[0, 0, 0.018]}>
          <planeGeometry args={[1.94, 1.08]} />
          <meshStandardMaterial map={periodic} roughness={0.6} />
        </mesh>
      </group>

      {/* Kệ kính hóa chất tương tác (bấm chai để chọn nhanh hóa chất) */}
      <group position={[0, 1.44, -3.55]}>
        <mesh>
          <boxGeometry args={[4.2, 0.032, 0.36]} />
          <meshPhysicalMaterial color="#dbeafe" transparent opacity={0.55} transmission={0.55} roughness={0.08} />
        </mesh>
        {bottles.map((b, i) => {
          const isPicked = selectedChem === b.id;
          return (
            <group
              key={b.id}
              position={[-1.8 + i * 0.4, 0.115, 0]}
              onClick={(e) => { e.stopPropagation(); onPickChem?.(b.id); }}
              onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
              onPointerOut={() => { document.body.style.cursor = 'auto'; }}
            >
              {/* Vỏ chai borosilicate trong hoặc nâu hổ phách */}
              <mesh castShadow>
                <cylinderGeometry args={[0.044, 0.048, 0.18, 20]} />
                <meshPhysicalMaterial
                  color={b.amber ? '#78350f' : '#e0f2fe'}
                  transparent
                  opacity={b.amber ? 0.68 : 0.35}
                  transmission={b.amber ? 0.35 : 0.72}
                  ior={1.47}
                  roughness={0.05}
                  clearcoat={1}
                />
              </mesh>
              {/* Mực hóa chất thật bên trong chai */}
              <mesh position={[0, -0.025, 0]}>
                <cylinderGeometry args={[0.038, 0.042, 0.11, 16]} />
                <meshPhysicalMaterial color={b.color} transparent opacity={0.85} roughness={0.1} />
              </mesh>
              {/* Nắp vặn phòng thí nghiệm */}
              <mesh position={[0, 0.105, 0]}>
                <cylinderGeometry args={[0.02, 0.02, 0.032, 14]} />
                <meshStandardMaterial color={isPicked ? '#2563eb' : '#1e293b'} roughness={0.35} />
              </mesh>
              {/* Nhãn giấy trắng gắn trên thân chai */}
              <mesh position={[0, 0, 0.047]}>
                <planeGeometry args={[0.072, 0.044]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.85} />
              </mesh>
              <Text position={[0, 0, 0.049]} fontSize={0.02} color={isPicked ? '#2563eb' : '#0f172a'} anchorX="center">
                {b.label}
              </Text>
            </group>
          );
        })}
      </group>

      <FumeHoodUnit />
      <WashSinkUnit washing={washing} onWashSelected={onWashSelected} />

      {/* Thùng thu hồi hóa chất an toàn */}
      <group
        position={[3.8, 0, 1.6]}
        onClick={(e) => { e.stopPropagation(); onWashSelected?.(); }}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        <mesh position={[0, 0.3, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.19, 0.6, 20]} />
          <meshStandardMaterial color="#eab308" roughness={0.45} />
        </mesh>
      </group>

      {/* Đèn LED thả trần kiểu phòng Lab nghiên cứu hiện đại */}
      {[-1.75, 1.75].map((x) => (
        <group key={x} position={[x, ROOM.h - 0.28, -0.35]}>
          <mesh>
            <boxGeometry args={[1.6, 0.045, 0.24]} />
            <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0, -0.024, 0]}>
            <boxGeometry args={[1.52, 0.01, 0.18]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive={lightMode === 'cyber' ? '#bae6fd' : '#ffffff'}
              emissiveIntensity={isDark ? 0.12 : 1.6}
            />
          </mesh>
          {[-0.65, 0.65].map((hx) => (
            <mesh key={hx} position={[hx, 0.14, 0]}>
              <cylinderGeometry args={[0.004, 0.004, 0.28, 6]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.85} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function BenchSpotLight({ lightMode = 'day' }) {
  const intensity = lightMode === 'dark' ? 3.2 : lightMode === 'cyber' ? 14 : 24;
  return (
    <spotLight
      position={[0, 2.85, 0.65]}
      angle={0.72}
      penumbra={0.82}
      intensity={intensity}
      distance={5.5}
      color={lightMode === 'cyber' ? '#dbeafe' : '#f8fafc'}
      target-position={[0, 0.9, -0.35]}
    />
  );
}

/* ---------- MÁY ĐO pH ĐỂ BÀN CÓ CÁNH TAY ĐIỆN CỰC & DÂY CÁP CONG ---------- */
function BenchtopPHMeter({ position = [-0.02, 0.48, -0.46], phDisplay = null, onMeasurePH }) {
  const phColor = phDisplay == null ? '#4ade80' : phDisplay < 6.5 ? '#f87171' : phDisplay > 7.5 ? '#60a5fa' : '#4ade80';
  const cableGeo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.06, 0.05, -0.04),
      new THREE.Vector3(0.11, 0.14, -0.04),
      new THREE.Vector3(0.04, 0.28, 0.02),
      new THREE.Vector3(-0.08, 0.27, 0.08),
    ]);
    return new THREE.TubeGeometry(curve, 18, 0.0035, 8, false);
  }, []);
  useEffect(() => () => cableGeo.dispose(), [cableGeo]);

  return (
    <group
      position={position}
      onClick={(e) => { e.stopPropagation(); onMeasurePH?.(); }}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; }}
    >
      {/* Thân máy nghiêng kiểu thiết bị phân tích phòng thí nghiệm */}
      <mesh position={[0, 0.042, 0]} castShadow>
        <boxGeometry args={[0.175, 0.084, 0.14]} />
        <meshStandardMaterial color="#0f172a" roughness={0.32} metalness={0.28} />
      </mesh>
      <mesh position={[0, 0.048, 0.072]} rotation={[-0.25, 0, 0]}>
        <planeGeometry args={[0.14, 0.052]} />
        <meshStandardMaterial color="#020617" />
      </mesh>
      <Text position={[0, 0.052, 0.075]} rotation={[-0.25, 0, 0]} fontSize={0.03} color={phColor} anchorX="center">
        {phDisplay != null ? `pH ${phDisplay.toFixed(2)}` : 'pH --'}
      </Text>
      {/* Trụ giá giữ điện cực có khớp xoay & điện cực thủy tinh */}
      <mesh position={[0.075, 0.14, -0.02]}>
        <cylinderGeometry args={[0.0055, 0.0055, 0.22, 10]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.92} roughness={0.16} />
      </mesh>
      <mesh position={[0.0, 0.24, 0.03]} rotation={[0, 0.55, Math.PI / 2]}>
        <cylinderGeometry args={[0.0045, 0.0045, 0.16, 8]} />
        <meshStandardMaterial color="#64748b" metalness={0.8} />
      </mesh>
      <mesh position={[-0.08, 0.2, 0.08]}>
        <cylinderGeometry args={[0.006, 0.005, 0.13, 10]} />
        <meshStandardMaterial color="#1e293b" roughness={0.35} />
      </mesh>
      <mesh position={[-0.08, 0.128, 0.08]}>
        <sphereGeometry args={[0.006, 10, 10]} />
        <meshPhysicalMaterial color="#38bdf8" transparent opacity={0.85} roughness={0.08} />
      </mesh>
      <mesh geometry={cableGeo}>
        <meshStandardMaterial color="#1e293b" roughness={0.55} />
      </mesh>
    </group>
  );
}

/* ---------- CÂN PHÂN TÍCH ĐIỆN TỬ CÓ LỒNG KÍNH CHẮN GIÓ ---------- */
function AnalyticalBalance({ position = [-1.82, 0.48, -0.34], scaleMass = 0 }) {
  return (
    <group position={position}>
      {/* Thân đế cân */}
      <mesh position={[0, 0.032, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.27, 0.064, 0.28]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.28} metalness={0.16} />
      </mesh>
      {/* Đĩa cân inox bóng */}
      <mesh position={[0, 0.068, -0.02]}>
        <cylinderGeometry args={[0.072, 0.072, 0.008, 28]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.12} />
      </mesh>
      {/* Lồng kính chắn gió 3 mặt chuẩn cân phân tích phòng Lab */}
      <mesh position={[0, 0.165, -0.115]}>
        <boxGeometry args={[0.22, 0.2, 0.006]} />
        <meshPhysicalMaterial color="#e0f2fe" transparent opacity={0.26} transmission={0.8} ior={1.48} roughness={0.04} />
      </mesh>
      {[-0.108, 0.108].map((sx) => (
        <mesh key={sx} position={[sx, 0.165, -0.02]}>
          <boxGeometry args={[0.006, 0.2, 0.19]} />
          <meshPhysicalMaterial color="#e0f2fe" transparent opacity={0.24} transmission={0.8} ior={1.48} roughness={0.04} />
        </mesh>
      ))}
      <mesh position={[0, 0.265, -0.02]}>
        <boxGeometry args={[0.226, 0.01, 0.196]} />
        <meshStandardMaterial color="#334155" metalness={0.65} roughness={0.3} />
      </mesh>
      {/* Màn hình LCD nghiêng phía trước */}
      <mesh position={[0, 0.036, 0.142]} rotation={[-0.2, 0, 0]}>
        <planeGeometry args={[0.17, 0.036]} />
        <meshStandardMaterial color="#020617" />
      </mesh>
      <Text position={[0, 0.038, 0.145]} rotation={[-0.2, 0, 0]} fontSize={0.022} color="#38bdf8" anchorX="center">
        {`${Number(scaleMass || 0).toFixed(2)} g`}
      </Text>
    </group>
  );
}

/* ================= SCENE ROOT ================= */
export default function LabScene({
  vessels = [], selected, onSelect, view, focus, walk, keysRef, quality = 'high',
  burnerLit = false, onToggleBurner, flameIon = 'default',
  testTubes = [], phDisplay = null, scaleMass = 0, latestEquation = '',
  onMeasurePH, onPickChem, selectedChem, onWashSelected, washing = false,
  onFpsHover, onFpsUse, interactRef,
  lightMode = 'day',
  buretteLevel = 50, buretteTitrant = 'NaOH', buretteDripping = false, onBuretteDrip,
  beakerStirring = false, beakerTemp = 25, onToggleStir,
  electrolyteId = 'CuSO4', electrolysisVoltage = 0,
  moleculeId = 'H2O', moleculeSpaceFill = false,
  laserMode = 'white', prismAngle = 0, pendulumLength = 0.42, gravity = 9.81, pendulumRunning = true,
  onOpenMicroscope, onJumpView,
}) {
  const shadowOn = quality !== 'low';
  const bgHex = lightMode === 'dark' ? '#060a14' : lightMode === 'cyber' ? '#0b1426' : '#c6d4e2';
  const ambIntensity = lightMode === 'dark' ? 0.14 : lightMode === 'cyber' ? 0.36 : 0.65;
  const dirIntensity = lightMode === 'dark' ? 0.22 : lightMode === 'cyber' ? 0.65 : 1.08;
  const titrantChem = CHEMS[buretteTitrant] || CHEMS.NaOH;

  return (
    <Canvas
      shadows={shadowOn}
      dpr={quality === 'high' ? [1, 2] : [0.8, 1.2]}
      camera={{ position: VIEWS.bench.pos, fov: 46, near: 0.08, far: 60 }}
      gl={{ antialias: quality !== 'low', powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = lightMode === 'dark' ? 0.96 : 1.08;
      }}
    >
      <color attach="background" args={[bgHex]} />
      <fog attach="fog" args={[bgHex, 11, 25]} />

      {/* Môi trường phản xạ Studio IBL giúp kính & nước trong suốt như ảnh chụp thật */}
      <LabStudioEnvironment lightMode={lightMode} />

      <ambientLight intensity={ambIntensity} color={lightMode === 'cyber' ? '#c7d2fe' : '#ffffff'} />
      <directionalLight
        position={[3.2, 5.4, 4.2]}
        intensity={dirIntensity}
        castShadow={shadowOn}
        shadow-mapSize={quality === 'high' ? [2048, 2048] : [1024, 1024]}
        shadow-bias={-0.0004}
      />
      <pointLight position={[-1.8, 2.8, -0.35]} intensity={lightMode === 'dark' ? 0.12 : 0.55} color={lightMode === 'cyber' ? '#60a5fa' : '#ffffff'} />
      <pointLight position={[1.8, 2.8, -0.35]} intensity={lightMode === 'dark' ? 0.12 : 0.55} color={lightMode === 'cyber' ? '#a78bfa' : '#ffffff'} />

      <Room
        onPickChem={onPickChem}
        selectedChem={selectedChem}
        onWashSelected={onWashSelected}
        lightMode={lightMode}
        washing={washing}
      />

      {/* Bảng kính ghi phương trình trực tiếp trên tường trái phòng Lab */}
      <group position={[-4.94, 1.82, -0.8]} rotation={[0, Math.PI / 2, 0]}>
        <mesh>
          <boxGeometry args={[1.9, 0.95, 0.02]} />
          <meshPhysicalMaterial color="#0f172a" roughness={0.12} metalness={0.2} clearcoat={1} />
        </mesh>
        <Text position={[0, 0.3, 0.018]} fontSize={0.055} color="#38bdf8" anchorX="center">
          PHƯƠNG TRÌNH GHI NHẬN TRỰC TIẾP
        </Text>
        <Text position={[0, 0.02, 0.018]} fontSize={0.068} maxWidth={1.72} textAlign="center" color="#f8fafc" anchorX="center">
          {latestEquation || 'Sẵn sàng thực hành — Chọn hóa chất hoặc bấm Phản ứng đẹp'}
        </Text>
      </group>

      <BenchSpotLight lightMode={lightMode} />
      <ContactShadows position={[0, 0.481, -0.35]} scale={5.4} blur={1.9} opacity={0.44} far={1.2} />

      {/* Tấm lót silicone chống trượt dưới Ống đong chia độ 100 mL */}
      <mesh position={[0.34, 0.4815, -0.35]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.105, 28]} />
        <meshStandardMaterial color="#1e3a5f" roughness={0.85} />
      </mesh>

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

      {/* TRẠM 1A: Burette chuẩn độ 50 mL với đế sứ trắng nằm đúng dưới Bình tam giác */}
      <BuretteStation
        position={[0.88, 0.48, -0.3]}
        levelMl={buretteLevel}
        titrantColor={titrantChem?.color || '#f4f7fa'}
        titrantLabel={`${titrantChem?.formula || 'NaOH'}`}
        dripping={buretteDripping}
        onDrip={onBuretteDrip}
      />

      {/* TRẠM 1B: Máy khuấy từ gia nhiệt đặt NỔI trên mặt bàn dưới Cốc thủy tinh */}
      <MagneticStirrerPlate
        position={[-0.46, 0.48, -0.32]}
        stirring={beakerStirring}
        temp={beakerTemp}
        onToggleStir={onToggleStir}
      />

      {/* TRẠM 1C: Đèn Bunsen + Kiềng 3 chân + Ống dẫn gas + Phổ ngọn lửa 8 ion */}
      <FlameTestBurner
        lit={burnerLit}
        flameIon={flameIon}
        position={[1.48, 0.48, -0.34]}
        onToggle={onToggleBurner}
      />

      {/* TRẠM 1D: Kính hiển vi quang học 3D góc phải bàn */}
      <MicroscopeProp position={[1.98, 0.48, -0.32]} onOpen={onOpenMicroscope} />

      {/* TRẠM 2 (TRÁI): Điện phân DC 0–12V & Mạ đồng 3D */}
      <ElectrolysisStation
        position={[-3.3, 0.48, 0.35]}
        electrolyteId={electrolyteId}
        voltage={electrolysisVoltage}
        onSelectStation={() => onJumpView?.('electrolysis')}
      />

      {/* TRẠM 3 (PHẢI): Hologram Phân tử VSEPR & Xoắn kép DNA */}
      <MoleculeHologramStation
        position={[3.3, 0.48, 0.35]}
        moleculeId={moleculeId}
        spaceFill={moleculeSpaceFill}
        onSelectStation={() => onJumpView?.('molecules')}
      />

      {/* TRẠM 4 (SAU): Quang học Laser–Lăng kính & Con lắc đơn 3D */}
      <OpticsPhysicsStation
        position={[0, 0.48, -2.55]}
        laserMode={laserMode}
        prismAngle={prismAngle}
        pendulumLength={pendulumLength}
        gravity={gravity}
        pendulumRunning={pendulumRunning}
        onSelectStation={() => onJumpView?.('optics')}
      />

      {/* Cân phân tích có lồng kính chắn gió góc trái bàn */}
      <AnalyticalBalance position={[-1.82, 0.48, -0.34]} scaleMass={scaleMass} />

      {/* Máy đo pH kỹ thuật số có cánh tay điện cực & dây cáp cong */}
      <BenchtopPHMeter position={[-0.02, 0.48, -0.46]} phDisplay={phDisplay} onMeasurePH={onMeasurePH} />

      <CameraRig view={view} focus={focus} walk={walk} keysRef={keysRef} />
      <FPSControls enabled={walk} keysRef={keysRef} onHover={onFpsHover} onUse={onFpsUse} interactRef={interactRef} />
    </Canvas>
  );
}
