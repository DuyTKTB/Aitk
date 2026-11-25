/* ============================================================
   LabRealismFX.jsx — HỆ THỐNG ĐỒ HỌA CHẤT LỎNG, ÁNH SÁNG STUDIO &
   HIỆU ỨNG PHẢN ỨNG HÓA HỌC CHÂN THỰC (WebGL / R3F)
   - LabStudioEnvironment: IBL phản chiếu kính borosilicate & inox thật
   - RealisticPourEffect: Chai nghiêng rót + dòng nước parabol + bọt bắn + gợn sóng
   - RealisticLiquid: Mực nước dâng mượt, pha màu mượt, mặt thoáng lấp lánh,
     hình nón chuẩn cho bình tam giác, bọt khí sủi + lớp bọt bề mặt + mây khuếch tán
   - PrecipitateVFX: Tinh thể kết tủa lơ lửng rơi xoáy (đặc biệt Mưa Vàng PbI2 ánh kim)
   - GasPlumeVFX: Luồng khí NO2 nâu đỏ, hơi nước nóng & sương phản ứng tỏa nhiệt
   ============================================================ */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';

/* ---------- 1. MÔI TRƯỜNG PHẢN CHIẾU STUDIO (IBL KHÉP KÍN, KHÔNG CẦN FILE NGOÀI) ---------- */
export function LabStudioEnvironment({ lightMode = 'day' }) {
  const isDark = lightMode === 'dark';
  const isCyber = lightMode === 'cyber';
  const topIntensity = isDark ? 0.45 : isCyber ? 1.35 : 2.3;
  const sideIntensity = isDark ? 0.35 : isCyber ? 1.1 : 1.75;

  return (
    <Environment resolution={256} frames={1}>
      {/* Đèn hộp trần phòng thí nghiệm phản chiếu vệt sáng dài lên thành cốc thủy tinh */}
      <Lightformer
        form="rect"
        intensity={topIntensity}
        color={isCyber ? '#dbeafe' : '#ffffff'}
        position={[0, 5, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[9, 3.2, 1]}
      />
      <Lightformer
        form="rect"
        intensity={topIntensity * 0.85}
        color="#f8fafc"
        position={[0, 4.5, -3]}
        rotation={[Math.PI / 2.4, 0, 0]}
        scale={[8, 1.8, 1]}
      />
      {/* Cửa sổ ánh sáng tự nhiên bên trái & phải tạo đường viền Fresnel cực sắc trên thủy tinh */}
      <Lightformer
        form="rect"
        intensity={sideIntensity}
        color={isCyber ? '#60a5fa' : '#e0f2fe'}
        position={[-6, 2.2, 1.5]}
        rotation={[0, Math.PI / 2, 0]}
        scale={[5, 3.2, 1]}
      />
      <Lightformer
        form="rect"
        intensity={sideIntensity * 0.9}
        color={isCyber ? '#a78bfa' : '#fef3c7'}
        position={[6, 2.2, 1.5]}
        rotation={[0, -Math.PI / 2, 0]}
        scale={[5, 3.2, 1]}
      />
      {/* Ánh sáng ngược phía sau giúp dung dịch trong suốt (CuSO4, KMnO4, nước) phát sáng trong veo */}
      <Lightformer
        form="ring"
        intensity={isDark ? 0.6 : 1.25}
        color="#e0f2fe"
        position={[0, 2.2, -5.5]}
        scale={[4.5, 4.5, 1]}
      />
      {/* Ánh phản xạ nền ấm nhẹ từ mặt sàn */}
      <Lightformer
        form="rect"
        intensity={isDark ? 0.15 : 0.45}
        color="#cbd5e1"
        position={[0, -3, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[10, 10, 1]}
      />
    </Environment>
  );
}

/* ---------- 2. CHẤT LỎNG CHÂN THỰC (DÂNG MƯỢT · PHA MÀU MƯỢT · SỦI BỌT · MÂY KHUẾCH TÁN) ---------- */
export function RealisticLiquid({
  radiusBottom = 0.075,
  radiusTopAtMax = null,
  maxH = 0.22,
  baseY = 0.014,
  fill = 0,
  color = '#dbeafe',
  bubbles = false,
  gasType = null,
  stir = false,
  pouring = false,
  reactionFx = null,
}) {
  const groupRef = useRef();
  const bodyRef = useRef();
  const bodyMatRef = useRef();
  const surfaceRef = useRef();
  const surfaceMatRef = useRef();
  const rimRef = useRef();
  const foamRef = useRef();
  const swirlRef = useRef();
  const bubblesRef = useRef();

  const currentFillRef = useRef(Math.max(0.01, fill));
  const currentColorRef = useRef(new THREE.Color(color || '#dbeafe'));
  const targetColor = useMemo(() => new THREE.Color(color || '#dbeafe'), [color]);

  const seeds = useMemo(() => Array.from({ length: 28 }, (_, i) => ({
    a: (i / 28) * Math.PI * 2 + (i % 3) * 0.41,
    r: (0.14 + ((i * 37) % 100) / 130) * Math.min(radiusBottom, radiusTopAtMax || radiusBottom) * 0.85,
    t: (i / 28),
    spd: 0.9 + (i % 5) * 0.26,
    sz: 0.65 + (i % 4) * 0.24,
  })), [radiusBottom, radiusTopAtMax]);

  const foamSeeds = useMemo(() => Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    const rr = 0.35 + (i % 3) * 0.22;
    return { x: Math.cos(a) * rr, z: Math.sin(a) * rr, s: 0.7 + (i % 4) * 0.25 };
  }), []);

  const isConical = radiusTopAtMax != null && Math.abs(radiusTopAtMax - radiusBottom) > 0.004;
  const rBottom = radiusBottom * 0.95;
  const rTopMax = (radiusTopAtMax ?? radiusBottom) * 0.95;
  const bubbleBaseSize = gasType === 'CO2' || gasType === 'O2' ? 0.0068 : gasType === 'H2' ? 0.0048 : 0.0056;
  const isClearWater = color === '#eef6fc' || color === '#dfe9f3' || color === '#f3f7fb' || color === '#eef4fa';

  useFrame((state, dt) => {
    const step = Math.min(dt, 0.06);
    const t = state.clock.elapsedTime;

    // 1. Mực nước dâng / hạ mượt mà theo vật lý thay vì nhảy đột ngột
    const targetF = Math.max(0, Math.min(1, fill));
    currentFillRef.current = THREE.MathUtils.lerp(currentFillRef.current, targetF, Math.min(1, step * 5.2));
    const f = Math.max(0.015, currentFillRef.current);
    const h = f * maxH;
    const rTop = isConical ? THREE.MathUtils.lerp(rBottom, rTopMax, f) : rBottom;

    // 2. Pha màu khuếch tán mượt mà khi phản ứng xảy ra
    currentColorRef.current.lerp(targetColor, Math.min(1, step * 3.2));
    if (bodyMatRef.current) bodyMatRef.current.color.copy(currentColorRef.current);
    if (surfaceMatRef.current) surfaceMatRef.current.color.copy(currentColorRef.current);

    if (bodyRef.current) {
      bodyRef.current.position.y = baseY + h / 2;
      bodyRef.current.scale.set(1, Math.max(0.02, h), 1);
    }
    if (surfaceRef.current) {
      surfaceRef.current.position.y = baseY + h + 0.001;
      const waveTiltX = pouring ? Math.sin(t * 16) * 0.065 : stir ? Math.sin(t * 11) * 0.045 : Math.sin(t * 1.8) * 0.006;
      const waveTiltZ = pouring ? Math.cos(t * 14) * 0.065 : stir ? Math.cos(t * 11) * 0.045 : Math.cos(t * 1.4) * 0.006;
      surfaceRef.current.rotation.set(-Math.PI / 2 + waveTiltX, 0, waveTiltZ);
      const scaleR = rTop / rBottom;
      surfaceRef.current.scale.set(scaleR, scaleR, 1);
    }
    if (rimRef.current) {
      rimRef.current.position.y = baseY + h + 0.002;
      const scaleR = rTop / rBottom;
      rimRef.current.scale.set(scaleR, scaleR, 1);
    }
    if (groupRef.current && stir) {
      groupRef.current.rotation.y += step * 5.5;
    }

    // 3. Bọt khí sủi tăng tốc hướng lên & dao động lắc ngang
    if (bubblesRef.current) {
      bubblesRef.current.visible = Boolean(bubbles || gasType);
      if (bubbles || gasType) {
        const speedBoost = gasType === 'O2' ? 2.4 : gasType === 'CO2' ? 1.65 : gasType === 'H2' ? 1.9 : 1.1;
        for (let i = 0; i < seeds.length; i++) {
          const m = bubblesRef.current.children[i];
          if (!m) continue;
          const s = seeds[i];
          s.t += step * s.spd * speedBoost;
          if (s.t > 1) s.t = 0;
          const y = baseY + 0.006 + s.t * Math.max(0.02, h - 0.008);
          const radialLimit = isConical ? THREE.MathUtils.lerp(1, rTop / rBottom, s.t) : 1;
          const wobble = Math.sin(t * 8 + i) * 0.004;
          m.position.set(
            Math.cos(s.a) * s.r * radialLimit + wobble,
            y,
            Math.sin(s.a) * s.r * radialLimit - wobble
          );
          m.scale.setScalar(s.sz * (0.45 + s.t * 0.85));
        }
      }
    }

    // 4. Lớp bọt sủi trên bề mặt nước (rõ khi sủi khí CO2 / O2 / H2 hoặc đang rót mạnh)
    if (foamRef.current) {
      const showFoam = Boolean(gasType || pouring);
      foamRef.current.visible = showFoam;
      if (showFoam) {
        foamRef.current.position.y = baseY + h + 0.004;
        const foamScale = (rTop / rBottom) * (gasType === 'O2' ? 1.15 : 0.95);
        foamRef.current.scale.set(foamScale, gasType === 'O2' ? 1.45 : 0.9, foamScale);
        foamRef.current.rotation.y = t * 1.4;
      }
    }

    // 5. Đám mây khuếch tán màu sắc khi vừa xảy ra phản ứng hóa học (~2.8 giây)
    if (swirlRef.current) {
      const age = reactionFx?.ts ? (Date.now() - reactionFx.ts) / 1000 : 99;
      if (age < 2.8) {
        swirlRef.current.visible = true;
        const p = age / 2.8;
        swirlRef.current.position.y = baseY + h * (0.35 + p * 0.35);
        swirlRef.current.rotation.y = t * 3.8;
        const sc = (0.35 + p * 0.85) * (rTop / rBottom);
        swirlRef.current.scale.set(sc, 0.5 + p * 0.7, sc);
        if (swirlRef.current.material) {
          swirlRef.current.material.opacity = (1 - p) * 0.62;
        }
      } else {
        swirlRef.current.visible = false;
      }
    }
  });

  if (fill <= 0.001) return null;

  const initTopR = isConical ? THREE.MathUtils.lerp(rBottom, rTopMax, Math.min(1, fill)) : rBottom;

  return (
    <group ref={groupRef}>
      {/* Khối nước vật lý trong suốt, khúc xạ IOR 1.333 như nước thật */}
      <mesh ref={bodyRef} position={[0, baseY + (fill * maxH) / 2, 0]} scale={[1, Math.max(0.02, fill * maxH), 1]}>
        <cylinderGeometry args={[initTopR, rBottom, 1, 36]} />
        <meshPhysicalMaterial
          ref={bodyMatRef}
          color={color}
          transparent
          opacity={isClearWater ? 0.54 : 0.82}
          transmission={isClearWater ? 0.65 : 0.28}
          ior={1.333}
          thickness={0.12}
          roughness={0.06}
          metalness={0.02}
          clearcoat={1}
          clearcoatRoughness={0.05}
          envMapIntensity={1.55}
        />
      </mesh>

      {/* Mặt thoáng nước lấp lánh có gợn sóng nhẹ */}
      <mesh ref={surfaceRef} position={[0, baseY + fill * maxH + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[rBottom, 36]} />
        <meshPhysicalMaterial
          ref={surfaceMatRef}
          color={color}
          transparent
          opacity={isClearWater ? 0.62 : 0.9}
          roughness={0.04}
          metalness={0.05}
          clearcoat={1}
          clearcoatRoughness={0.02}
          envMapIntensity={1.9}
        />
      </mesh>

      {/* Viền lõm mao dẫn (Meniscus) sáng óng nơi mặt nước tiếp xúc thành thủy tinh */}
      <mesh ref={rimRef} position={[0, baseY + fill * maxH + 0.002, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[rBottom * 0.985, 0.0022, 8, 36]} />
        <meshStandardMaterial color="#ffffff" emissive="#e0f2fe" emissiveIntensity={0.45} transparent opacity={0.68} />
      </mesh>

      {/* Bọt khí sủi dày đặc theo loại khí (H2 / CO2 / O2 / NO2 nâu đỏ) */}
      <group ref={bubblesRef} visible={false}>
        {seeds.map((_, i) => (
          <mesh key={i}>
            <sphereGeometry args={[bubbleBaseSize, 8, 8]} />
            <meshPhysicalMaterial
              color={gasType === 'NO2' ? '#b45309' : gasType === 'O2' ? '#e0f2fe' : '#ffffff'}
              roughness={0.08}
              transmission={gasType === 'NO2' ? 0.1 : 0.4}
              transparent
              opacity={gasType === 'NO2' ? 0.88 : 0.82}
            />
          </mesh>
        ))}
      </group>

      {/* Lớp bọt trắng nổi trên mặt thoáng khi sủi khí / đang rót */}
      <group ref={foamRef} visible={false}>
        {foamSeeds.map((fs, i) => (
          <mesh key={i} position={[fs.x * rBottom * 0.72, 0, fs.z * rBottom * 0.72]}>
            <sphereGeometry args={[0.009 * fs.s, 8, 8]} />
            <meshStandardMaterial
              color={gasType === 'NO2' ? '#d97706' : '#f8fafc'}
              roughness={0.35}
              transparent
              opacity={0.78}
            />
          </mesh>
        ))}
      </group>

      {/* Đám mây màu xoáy khuếch tán khi phản ứng vừa kích hoạt */}
      <mesh ref={swirlRef} visible={false}>
        <torusKnotGeometry args={[rBottom * 0.42, rBottom * 0.14, 36, 8, 2, 3]} />
        <meshStandardMaterial
          color={reactionFx?.color || color}
          emissive={reactionFx?.color || color}
          emissiveIntensity={0.65}
          transparent
          opacity={0.55}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/* ---------- 3. HIỆU ỨNG RÓT NƯỚC CHUẨN VẬT LÝ (CHAI NGHIÊNG + DÒNG PARABOL + BỌT BẮN + GỢN SÓNG) ---------- */
export function RealisticPourEffect({
  active = false,
  color = '#cfe3f2',
  topY = 0.27,
  surfaceY = 0.08,
  vesselRadius = 0.075,
}) {
  const bottleRef = useRef();
  const streamMatRef = useRef();
  const splashRef = useRef();
  const ripple1Ref = useRef();
  const ripple2Ref = useRef();
  const elapsedRef = useRef(0);

  // Đường cong dòng nước rơi theo trọng lực (parabol từ miệng chai đổ thẳng vào tâm cốc)
  const streamGeo = useMemo(() => {
    const startX = vesselRadius + 0.07;
    const startY = topY + 0.085;
    const endY = Math.max(0.025, Math.min(topY - 0.02, surfaceY));
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(startX, startY, 0),
      new THREE.Vector3(startX * 0.56, startY - 0.015, 0),
      new THREE.Vector3(startX * 0.2, (startY + endY) * 0.55, 0),
      new THREE.Vector3(0.004, endY, 0),
    ]);
    return new THREE.TubeGeometry(curve, 24, 0.0052, 10, false);
  }, [topY, surfaceY, vesselRadius]);

  useEffect(() => () => streamGeo.dispose(), [streamGeo]);

  const drops = useMemo(() => Array.from({ length: 14 }, (_, i) => ({
    a: (i / 14) * Math.PI * 2 + 0.2,
    spd: 0.85 + (i % 4) * 0.25,
    phase: i / 14,
    reach: 0.022 + (i % 3) * 0.012,
  })), []);

  useFrame((state, dt) => {
    if (!active) {
      elapsedRef.current = 0;
      return;
    }
    elapsedRef.current += dt;
    const t = state.clock.elapsedTime;

    // 1. Chai hóa chất xuất hiện và nghiêng rót mượt mà (-108 độ)
    if (bottleRef.current) {
      const tilt = Math.min(1, elapsedRef.current * 4.5);
      bottleRef.current.rotation.z = THREE.MathUtils.lerp(0.15, 1.88, tilt) + Math.sin(t * 7) * 0.025;
      bottleRef.current.position.y = topY + 0.145 - tilt * 0.025;
    }

    // 2. Dòng nước óng ánh rung nhẹ theo tốc độ chảy
    if (streamMatRef.current) {
      streamMatRef.current.opacity = 0.72 + Math.sin(t * 28) * 0.12;
    }

    // 3. 14 giọt bắn tung tóe hình vòng cung nhỏ ngay mặt thoáng
    if (splashRef.current) {
      const impactY = Math.max(0.025, Math.min(topY - 0.02, surfaceY));
      for (let i = 0; i < drops.length; i++) {
        const m = splashRef.current.children[i];
        if (!m) continue;
        const d = drops[i];
        const p = (t * 2.8 * d.spd + d.phase) % 1;
        const r = p * d.reach;
        const dy = Math.sin(p * Math.PI) * 0.032;
        m.position.set(Math.cos(d.a) * r, impactY + dy, Math.sin(d.a) * r);
        m.scale.setScalar((1 - p * 0.7) * 0.9);
      }
    }

    // 4. Hai vòng gợn sóng đồng tâm lan rộng trên mặt nước
    const impactY = Math.max(0.025, Math.min(topY - 0.02, surfaceY)) + 0.002;
    if (ripple1Ref.current) {
      const p1 = (t * 2.1) % 1;
      ripple1Ref.current.position.y = impactY;
      ripple1Ref.current.scale.setScalar(0.18 + p1 * 0.85);
      ripple1Ref.current.material.opacity = (1 - p1) * 0.72;
    }
    if (ripple2Ref.current) {
      const p2 = (t * 2.1 + 0.5) % 1;
      ripple2Ref.current.position.y = impactY;
      ripple2Ref.current.scale.setScalar(0.18 + p2 * 0.85);
      ripple2Ref.current.material.opacity = (1 - p2) * 0.72;
    }
  });

  if (!active) return null;

  return (
    <group>
      {/* Chai thủy tinh nghiêng rót thật ngay phía trên miệng cốc */}
      <group ref={bottleRef} position={[vesselRadius + 0.115, topY + 0.14, 0]}>
        <mesh>
          <cylinderGeometry args={[0.032, 0.034, 0.11, 18]} />
          <meshPhysicalMaterial
            color="#e2eef8"
            transparent
            opacity={0.42}
            transmission={0.68}
            ior={1.47}
            roughness={0.05}
            clearcoat={1}
          />
        </mesh>
        {/* Chất lỏng bên trong chai đang rót */}
        <mesh position={[0, -0.01, 0]}>
          <cylinderGeometry args={[0.027, 0.029, 0.072, 16]} />
          <meshPhysicalMaterial color={color} transparent opacity={0.82} roughness={0.1} />
        </mesh>
        {/* Cổ chai rót */}
        <mesh position={[0, 0.068, 0]}>
          <cylinderGeometry args={[0.013, 0.019, 0.036, 14]} />
          <meshPhysicalMaterial color="#e2eef8" transparent opacity={0.5} transmission={0.6} roughness={0.06} />
        </mesh>
      </group>

      {/* Dòng nước cong parabol chảy mịn vào giữa cốc */}
      <mesh geometry={streamGeo}>
        <meshPhysicalMaterial
          ref={streamMatRef}
          color={color}
          emissive={color}
          emissiveIntensity={0.14}
          transparent
          opacity={0.78}
          roughness={0.05}
          clearcoat={1}
          ior={1.333}
        />
      </mesh>

      {/* Các giọt nước bắn li ti tại điểm chạm mặt nước */}
      <group ref={splashRef}>
        {drops.map((_, i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.0042, 8, 8]} />
            <meshPhysicalMaterial color={color} transparent opacity={0.88} roughness={0.08} />
          </mesh>
        ))}
      </group>

      {/* 2 vòng sóng gợn lan tỏa trên mặt nước */}
      <mesh ref={ripple1Ref} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[vesselRadius * 0.72, 0.0022, 8, 32]} />
        <meshStandardMaterial color="#ffffff" emissive="#e0f2fe" emissiveIntensity={0.45} transparent opacity={0.65} />
      </mesh>
      <mesh ref={ripple2Ref} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[vesselRadius * 0.72, 0.002, 8, 32]} />
        <meshStandardMaterial color="#ffffff" emissive="#e0f2fe" emissiveIntensity={0.45} transparent opacity={0.65} />
      </mesh>
    </group>
  );
}

/* ---------- 4. KẾT TỦA RƠI XOÁY LẤP LÁNH & ĐÁY LẮNG TỰ NHIÊN (ĐẶC BIỆT MƯA VÀNG PbI2) ---------- */
export function PrecipitateVFX({ radius = 0.075, color = '#f8fafc', formula = '', index = 0, liquidHeight = 0.14 }) {
  const flakesRef = useRef();
  const isGoldenRain = formula === 'PbI2';

  const flakes = useMemo(() => Array.from({ length: isGoldenRain ? 36 : 22 }, (_, i) => ({
    a: (i / 24) * Math.PI * 2 + (i % 5) * 0.37,
    r: (0.1 + ((i * 29) % 100) / 120) * radius * 0.82,
    t: (i / (isGoldenRain ? 36 : 22)),
    spd: isGoldenRain ? 0.18 + (i % 4) * 0.05 : 0.24 + (i % 4) * 0.06,
    sz: isGoldenRain ? 0.0055 : 0.0068,
  })), [radius, isGoldenRain]);

  useFrame((state, dt) => {
    if (!flakesRef.current) return;
    const t = state.clock.elapsedTime;
    const maxY = Math.max(0.05, liquidHeight);
    for (let i = 0; i < flakes.length; i++) {
      const m = flakesRef.current.children[i];
      if (!m) continue;
      const fl = flakes[i];
      fl.t = (fl.t + dt * fl.spd) % 1;
      const y = 0.02 + (1 - fl.t) * maxY;
      const swirlA = fl.a + t * (isGoldenRain ? 0.8 : 0.45);
      m.position.set(Math.cos(swirlA) * fl.r, y, Math.sin(swirlA) * fl.r);
      m.rotation.set(t * 2 + i, t * 1.5, i);
    }
  });

  return (
    <group>
      {/* Đám tinh thể kết tủa lơ lửng rơi xoáy chậm rãi */}
      <group ref={flakesRef}>
        {flakes.map((fl, i) => (
          <mesh key={i}>
            {isGoldenRain ? (
              <cylinderGeometry args={[fl.sz, fl.sz, 0.0014, 6]} />
            ) : (
              <dodecahedronGeometry args={[fl.sz, 0]} />
            )}
            <meshStandardMaterial
              color={color}
              emissive={isGoldenRain ? '#facc15' : '#000000'}
              emissiveIntensity={isGoldenRain ? 0.45 : 0}
              metalness={isGoldenRain ? 0.88 : 0.08}
              roughness={isGoldenRain ? 0.14 : 0.78}
              transparent
              opacity={0.92}
            />
          </mesh>
        ))}
      </group>

      {/* Lớp kết tủa lắng tự nhiên dạng vòm mềm ở đáy cốc (không cứng nhắc như đĩa phẳng) */}
      <mesh position={[0, 0.015 + index * 0.009, 0]} scale={[1, 0.24, 1]}>
        <sphereGeometry args={[radius * 0.9, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={color}
          metalness={isGoldenRain ? 0.72 : 0.04}
          roughness={isGoldenRain ? 0.24 : 0.9}
          transparent
          opacity={0.95}
        />
      </mesh>
    </group>
  );
}

/* ---------- 5. KHÓI KHÍ PHẢN ỨNG (NO2 NÂU ĐỎ, HƠI NƯỚC NÓNG, SƯƠNG O2) ---------- */
export function GasPlumeVFX({ active = false, topY = 0.27, radius = 0.055, gasType = null }) {
  const ref = useRef();
  const puffs = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    x: (Math.sin(i * 7.3) * 0.5) * radius,
    z: (Math.cos(i * 5.9) * 0.5) * radius,
    t: i / 12,
    spd: 0.48 + (i % 4) * 0.12,
  })), [radius]);

  useFrame((state, dt) => {
    if (!active || !ref.current) return;
    const time = state.clock.elapsedTime;
    for (let i = 0; i < puffs.length; i++) {
      const m = ref.current.children[i];
      if (!m) continue;
      puffs[i].t = (puffs[i].t + dt * puffs[i].spd) % 1;
      const p = puffs[i].t;
      m.position.set(
        puffs[i].x * (1 + p * 1.4) + Math.sin(time * 2.5 + i) * 0.012,
        topY + p * 0.24,
        puffs[i].z * (1 + p * 1.4) + Math.cos(time * 2.1 + i) * 0.012
      );
      m.scale.setScalar(0.55 + p * 1.65);
      m.material.opacity = (1 - p) * (gasType === 'NO2' ? 0.48 : 0.26);
    }
  });

  if (!active) return null;
  const plumeColor = gasType === 'NO2' ? '#b45309' : gasType === 'O2' ? '#e0f2fe' : '#f1f5f9';

  return (
    <group ref={ref}>
      {puffs.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.022, 10, 10]} />
          <meshStandardMaterial color={plumeColor} transparent opacity={0.28} depthWrite={false} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}
