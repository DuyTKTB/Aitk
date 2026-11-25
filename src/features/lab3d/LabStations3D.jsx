/* ============================================================
   LabStations3D.jsx — CÁC TRẠM THÍ NGHIỆM 3D LOGIC VẬT LÝ & CHẤT LƯỢNG CAO
   1. BuretteStation — Đế sứ trắng chuẩn độ đặt dưới bình + trụ + kẹp + van PTFE
   2. MagneticStirrerPlate — Máy khuấy từ gia nhiệt đặt NỔI trên mặt bàn (cốc đặt lên trên)
   3. FlameTestBurner — Đèn Bunsen + Kiềng 3 chân lưới tản nhiệt + Dây dẫn gas + Que thử ion
   4. ElectrolysisStation — Bàn chạm sàn + Dây dẫn cong thật nối cọc DC -> điện cực + electron chạy dọc dây
   5. MoleculeHologramStation — Bàn chạm sàn + Bệ chiếu Phân tử VSEPR & DNA
   6. OpticsPhysicsStation — Bàn chạm sàn + Ray quang học Laser–Lăng kính + Con lắc đơn 3D
   7. MicroscopeProp — Kính hiển vi quang học 3D chi tiết
   ============================================================ */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { ELECTROLYTES, FLAME_IONS, MOLECULES_3D } from './engine.js';

/* ---------- 1. TRẠM CHUẨN ĐỘ BURETTE 50 mL (ĐẾ SỨ TRẮNG ĐẶT DƯỚI BÌNH TAM GIÁC) ---------- */
export function BuretteStation({
  position = [0.88, 0.48, -0.3],
  levelMl = 50,
  titrantColor = '#f4f7fa',
  titrantLabel = 'NaOH',
  dripping = false,
  onDrip,
}) {
  const dropRef = useRef();
  const fill = Math.max(0.02, Math.min(1, levelMl / 50));

  useFrame((state) => {
    if (!dropRef.current) return;
    if (!dripping) {
      dropRef.current.visible = false;
      return;
    }
    dropRef.current.visible = true;
    const t = (state.clock.elapsedTime * 3.8) % 1;
    // Giọt rơi đúng từ đầu nhọn burette (y=0.39) vào miệng bình tam giác (y=0.22)
    dropRef.current.position.y = 0.388 - t * 0.21;
    const s = 0.8 + Math.sin(t * Math.PI) * 0.35;
    dropRef.current.scale.set(0.85, s * 1.25, 0.85);
  });

  return (
    <group position={position}>
      {/* Đế sứ trắng chuẩn độ (cao 0.022m -> bình tam giác đặt ngay trên ở y = 0.48 + 0.022 = 0.502) */}
      <mesh position={[0, 0.011, -0.02]} castShadow receiveShadow>
        <boxGeometry args={[0.28, 0.022, 0.3]} />
        <meshPhysicalMaterial color="#f8fafc" roughness={0.18} clearcoat={0.65} />
      </mesh>
      {/* Viền đế gang dưới cùng chống trượt */}
      <mesh position={[0, 0.002, -0.02]}>
        <boxGeometry args={[0.29, 0.005, 0.31]} />
        <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.5} />
      </mesh>
      {/* Ổ bắt trụ sắt phía sau đế */}
      <mesh position={[0, 0.032, -0.135]}>
        <cylinderGeometry args={[0.022, 0.026, 0.024, 16]} />
        <meshStandardMaterial color="#334155" metalness={0.75} roughness={0.3} />
      </mesh>
      {/* Trụ sắt đứng bằng thép không gỉ */}
      <mesh position={[0, 0.49, -0.135]} castShadow>
        <cylinderGeometry args={[0.0085, 0.0085, 0.92, 14]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.92} roughness={0.16} />
      </mesh>
      {/* Tay kẹp kép giữ ống burette đúng tâm bình tam giác */}
      <mesh position={[0, 0.68, -0.068]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.0065, 0.0065, 0.135, 10]} />
        <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.28} />
      </mesh>
      <mesh position={[0, 0.68, -0.135]}>
        <boxGeometry args={[0.026, 0.032, 0.03]} />
        <meshStandardMaterial color="#1e293b" metalness={0.65} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.68, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.019, 0.0045, 8, 20]} />
        <meshStandardMaterial color="#475569" metalness={0.75} roughness={0.28} />
      </mesh>

      {/* Thân ống thủy tinh burette 50 mL (đầu nhọn nằm gọn trên miệng bình tam giác y=0.38) */}
      <mesh position={[0, 0.66, 0]} castShadow>
        <cylinderGeometry args={[0.0145, 0.0145, 0.46, 22, 1, true]} />
        <meshPhysicalMaterial color="#f0f9ff" transparent opacity={0.32} transmission={0.76} ior={1.47} roughness={0.04} clearcoat={1} side={THREE.DoubleSide} />
      </mesh>
      {/* Vạch chia độ trên burette */}
      {[-0.17, -0.085, 0, 0.085, 0.17].map((dy, idx) => (
        <mesh key={idx} position={[0, 0.66 + dy, 0.015]}>
          <boxGeometry args={[0.013, 0.0022, 0.001]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
        </mesh>
      ))}
      {/* Cột chất lỏng chuẩn độ bên trong */}
      {levelMl > 0 && (
        <mesh position={[0, 0.44 + (fill * 0.42) / 2, 0]}>
          <cylinderGeometry args={[0.012, 0.012, fill * 0.42, 16]} />
          <meshPhysicalMaterial color={titrantColor} transparent opacity={0.82} roughness={0.08} ior={1.333} />
        </mesh>
      )}
      {/* Đầu nhọn nhỏ giọt */}
      <mesh position={[0, 0.405, 0]}>
        <cylinderGeometry args={[0.011, 0.0032, 0.048, 14]} />
        <meshPhysicalMaterial color="#e2eef8" transparent opacity={0.55} />
      </mesh>

      {/* Khóa van PTFE tương tác (bấm để nhỏ giọt chuẩn độ) */}
      <group
        position={[0, 0.432, 0]}
        onClick={(e) => { e.stopPropagation(); onDrip?.(); }}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.0075, 0.0075, 0.036, 12]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.3} />
        </mesh>
        <mesh position={[0.022, 0, 0]} rotation={[dripping ? 0 : Math.PI / 2, 0, 0]}>
          <boxGeometry args={[0.011, 0.032, 0.008]} />
          <meshStandardMaterial color={dripping ? '#22c55e' : '#3b82f6'} emissive={dripping ? '#16a34a' : '#2563eb'} emissiveIntensity={0.55} />
        </mesh>
      </group>

      {/* Giọt chất lỏng đang rơi vào bình */}
      <mesh ref={dropRef} position={[0, 0.32, 0]} visible={false}>
        <sphereGeometry args={[0.0068, 12, 12]} />
        <meshPhysicalMaterial color={titrantColor} emissive={titrantColor} emissiveIntensity={0.25} roughness={0.06} />
      </mesh>
    </group>
  );
}

/* ---------- 2. MÁY KHUẤY TỪ GIA NHIỆT (ĐẶT NỔI TRÊN BÀN y=0.48 -> ĐỈNH GỐM y=0.528) ---------- */
export function MagneticStirrerPlate({ position = [-0.46, 0.48, -0.32], stirring = false, temp = 25, onToggleStir }) {
  const barRef = useRef();
  useFrame((state) => {
    if (barRef.current && stirring) {
      barRef.current.rotation.y = state.clock.elapsedTime * 18;
    }
  });
  const hot = temp > 40;
  return (
    <group
      position={position}
      onClick={(e) => { e.stopPropagation(); onToggleStir?.(); }}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; }}
    >
      {/* Thân máy khuấy từ đặt nổi hẳn trên mặt bàn (cao 0.042m) */}
      <mesh position={[0, 0.021, 0.01]} castShadow receiveShadow>
        <boxGeometry args={[0.25, 0.042, 0.27]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.22} roughness={0.34} />
      </mesh>
      {/* Mặt điều khiển nghiêng màu than phía trước */}
      <mesh position={[0, 0.02, 0.146]} rotation={[-0.22, 0, 0]}>
        <boxGeometry args={[0.23, 0.036, 0.016]} />
        <meshStandardMaterial color="#0f172a" roughness={0.38} metalness={0.25} />
      </mesh>
      {/* 2 Núm vặn RPM & Nhiệt độ */}
      <mesh position={[-0.075, 0.02, 0.158]} rotation={[Math.PI / 2 - 0.22, 0, 0]}>
        <cylinderGeometry args={[0.011, 0.012, 0.014, 16]} />
        <meshStandardMaterial color="#3b82f6" metalness={0.4} roughness={0.3} />
      </mesh>
      <mesh position={[0.075, 0.02, 0.158]} rotation={[Math.PI / 2 - 0.22, 0, 0]}>
        <cylinderGeometry args={[0.011, 0.012, 0.014, 16]} />
        <meshStandardMaterial color="#f97316" metalness={0.4} roughness={0.3} />
      </mesh>
      {/* Mặt gốm gia nhiệt trắng phía trên (đỉnh ở local y = 0.048 -> world y = 0.528) */}
      <mesh position={[0, 0.045, 0]} receiveShadow>
        <cylinderGeometry args={[0.102, 0.106, 0.006, 32]} />
        <meshPhysicalMaterial
          color={hot ? '#fb923c' : '#f8fafc'}
          emissive={hot ? '#ea580c' : '#000000'}
          emissiveIntensity={hot ? 0.55 : 0}
          roughness={0.18}
          clearcoat={0.8}
        />
      </mesh>
      {/* Con cá khuấy từ PTFE xoay ngay trong lòng đáy cốc (y = 0.064) */}
      <mesh ref={barRef} position={[0, 0.064, 0]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.0055, 0.03, 6, 12]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} />
      </mesh>
      {/* Đèn báo LED & màn hình số */}
      <mesh position={[-0.042, 0.022, 0.156]}>
        <sphereGeometry args={[0.0045, 10, 10]} />
        <meshStandardMaterial color={stirring ? '#22c55e' : '#64748b'} emissive={stirring ? '#22c55e' : '#000'} emissiveIntensity={1.8} />
      </mesh>
      <Text position={[0.008, 0.022, 0.157]} fontSize={0.014} color={stirring ? '#4ade80' : '#38bdf8'} anchorX="center">
        {stirring ? '600 RPM' : `${Math.round(temp)}°C`}
      </Text>
    </group>
  );
}

/* ---------- 3. ĐÈN BUNSEN + KIỀNG 3 CHÂN + ỐNG DẪN GAS + PHỔ NGỌN LỬA 8 ION ---------- */
export function FlameTestBurner({ lit, flameIon = 'default', position = [1.48, 0.48, -0.34], onToggle }) {
  const flameRef = useRef();
  const ionData = useMemo(() => FLAME_IONS.find((f) => f.id === flameIon) || FLAME_IONS[0], [flameIon]);

  const gasHoseGeo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.035, -0.025),
      new THREE.Vector3(-0.04, 0.014, -0.14),
      new THREE.Vector3(0.02, 0.012, -0.28),
      new THREE.Vector3(0.02, 0.06, -0.36),
    ]);
    return new THREE.TubeGeometry(curve, 20, 0.0065, 10, false);
  }, []);
  useEffect(() => () => gasHoseGeo.dispose(), [gasHoseGeo]);

  useFrame((state) => {
    if (!lit || !flameRef.current) return;
    const t = state.clock.elapsedTime;
    flameRef.current.scale.y = 1 + Math.sin(t * 21) * 0.14 + Math.cos(t * 31) * 0.06;
    flameRef.current.scale.x = 1 + Math.cos(t * 17) * 0.06;
    flameRef.current.rotation.z = Math.sin(t * 13) * 0.05;
  });

  return (
    <group
      position={position}
      onClick={(e) => { e.stopPropagation(); onToggle?.(); }}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; }}
    >
      {/* Đế đèn Bunsen gang đúc */}
      <mesh position={[0, 0.014, 0]} castShadow>
        <cylinderGeometry args={[0.052, 0.066, 0.028, 24]} />
        <meshStandardMaterial color="#1e293b" metalness={0.72} roughness={0.32} />
      </mesh>
      {/* Ống đốt Bunsen mạ crôm & vòng chỉnh gió đồng thau */}
      <mesh position={[0, 0.082, 0]} castShadow>
        <cylinderGeometry args={[0.013, 0.015, 0.115, 18]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.92} roughness={0.16} />
      </mesh>
      <mesh position={[0, 0.042, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.022, 18]} />
        <meshStandardMaterial color="#d97706" metalness={0.82} roughness={0.24} />
      </mesh>

      {/* Dây dẫn gas cao su nối ra van gas đồng thau phía sau bàn */}
      <mesh geometry={gasHoseGeo}>
        <meshStandardMaterial color="#ea580c" roughness={0.68} />
      </mesh>
      <group position={[0.02, 0.04, -0.36]}>
        <mesh>
          <cylinderGeometry args={[0.018, 0.022, 0.08, 14]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.88} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.045, 0]}>
          <boxGeometry args={[0.046, 0.012, 0.012]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.35} />
        </mesh>
      </group>

      {/* Kiềng 3 chân bằng sắt đặt gọn quanh đèn Bunsen (khi không thử que ion) */}
      {flameIon === 'default' && (
        <group>
          <mesh position={[0, 0.195, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.088, 0.005, 8, 28]} />
            <meshStandardMaterial color="#334155" metalness={0.78} roughness={0.35} />
          </mesh>
          {/* Lưới tản nhiệt amiăng */}
          <mesh position={[0, 0.199, 0]}>
            <boxGeometry args={[0.145, 0.004, 0.145]} />
            <meshStandardMaterial color="#64748b" metalness={0.6} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.202, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.042, 20]} />
            <meshStandardMaterial color={lit ? '#fed7aa' : '#e2e8f0'} emissive={lit ? '#fb923c' : '#000'} emissiveIntensity={lit ? 0.55 : 0} />
          </mesh>
          {[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((ang, idx) => (
            <mesh
              key={idx}
              position={[Math.cos(ang) * 0.095, 0.098, Math.sin(ang) * 0.095]}
              rotation={[Math.sin(ang) * 0.1, 0, -Math.cos(ang) * 0.1]}
            >
              <cylinderGeometry args={[0.0045, 0.0045, 0.202, 8]} />
              <meshStandardMaterial color="#334155" metalness={0.78} roughness={0.35} />
            </mesh>
          ))}
        </group>
      )}

      {/* Que thử dây platin/nichrom đưa muối vào ngọn lửa khi chọn ion */}
      {flameIon !== 'default' && (
        <group position={[0.115, 0.18, 0]} rotation={[0, 0, -0.18]}>
          <mesh position={[0.055, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.0055, 0.0055, 0.11, 10]} />
            <meshStandardMaterial color="#1e293b" roughness={0.55} />
          </mesh>
          <mesh position={[-0.055, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.0018, 0.0018, 0.115, 8]} />
            <meshStandardMaterial color="#f1f5f9" metalness={0.95} roughness={0.12} />
          </mesh>
          <mesh position={[-0.115, 0, 0]}>
            <torusGeometry args={[0.008, 0.002, 8, 16]} />
            <meshStandardMaterial color={ionData.outer} emissive={ionData.outer} emissiveIntensity={lit ? 2.4 : 0.25} />
          </mesh>
        </group>
      )}

      {/* Ngọn lửa 2 tầng chuẩn bước sóng quang phổ thật */}
      {lit && (
        <group ref={flameRef} position={[0, 0.185, 0]}>
          <mesh position={[0, 0.02, 0]}>
            <coneGeometry args={[0.026, 0.12, 18]} />
            <meshStandardMaterial color={ionData.outer} emissive={ionData.outer} emissiveIntensity={2.8} transparent opacity={0.86} />
          </mesh>
          <mesh position={[0, -0.008, 0]}>
            <coneGeometry args={[0.014, 0.06, 14]} />
            <meshStandardMaterial color={ionData.inner} emissive={ionData.inner} emissiveIntensity={3.2} transparent opacity={0.94} />
          </mesh>
          <pointLight position={[0, 0.09, 0]} color={ionData.light} intensity={2.4} distance={2.5} />
        </group>
      )}
    </group>
  );
}

/* ---------- 4. TRẠM ĐIỆN PHÂN 3D (BÀN CHẠM SÀN + DÂY CÁP CONG THẬT NỐI CỌC -> ĐIỆN CỰC) ---------- */
export function ElectrolysisStation({
  position = [-3.3, 0.48, 0.35],
  rotation = [0, Math.PI / 2, 0],
  electrolyteId = 'CuSO4',
  voltage = 0,
  onSelectStation,
}) {
  const data = ELECTROLYTES[electrolyteId] || ELECTROLYTES.CuSO4;
  const currentA = voltage > 0 ? voltage / data.resistance : 0;
  const active = voltage > 0.5;
  const cathodeBubblesRef = useRef();
  const anodeBubblesRef = useRef();
  const electronRef = useRef();
  const platingRef = useRef();

  // Dây dẫn đỏ (+) nối từ cọc đỏ nguồn DC -> kẹp đầu Anot (+)
  const { redWireGeo, blackWireGeo, blackCurve } = useMemo(() => {
    const cRed = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.44, 0.055, 0.13),
      new THREE.Vector3(-0.44, 0.24, 0.16),
      new THREE.Vector3(-0.18, 0.39, 0.06),
      new THREE.Vector3(0.15, 0.36, 0),
      new THREE.Vector3(0.15, 0.325, 0),
    ]);
    const cBlack = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.28, 0.055, 0.13),
      new THREE.Vector3(-0.26, 0.26, 0.17),
      new THREE.Vector3(0.05, 0.42, 0.08),
      new THREE.Vector3(0.35, 0.37, 0),
      new THREE.Vector3(0.35, 0.325, 0),
    ]);
    return {
      redWireGeo: new THREE.TubeGeometry(cRed, 28, 0.005, 8, false),
      blackWireGeo: new THREE.TubeGeometry(cBlack, 28, 0.005, 8, false),
      blackCurve: cBlack,
    };
  }, []);
  useEffect(() => () => { redWireGeo.dispose(); blackWireGeo.dispose(); }, [redWireGeo, blackWireGeo]);

  const seeds = useMemo(
    () => Array.from({ length: 16 }, (_, i) => ({
      x: (Math.sin(i * 12.7) * 0.5) * 0.032,
      z: (Math.cos(i * 9.3) * 0.5) * 0.032,
      phase: (i / 16) * Math.PI * 2,
      speed: 0.45 + (i % 5) * 0.14,
    })),
    []
  );

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const rate = Math.min(2.6, 0.4 + currentA * 1.15);

    if (anodeBubblesRef.current) {
      anodeBubblesRef.current.visible = active && Boolean(data.anodeGas);
      if (active && data.anodeGas) {
        anodeBubblesRef.current.children.forEach((m, i) => {
          const s = seeds[i];
          const p = (t * s.speed * rate + s.phase) % 1;
          m.position.set(s.x, 0.04 + p * 0.21, s.z);
        });
      }
    }
    if (cathodeBubblesRef.current) {
      cathodeBubblesRef.current.visible = active && Boolean(data.cathodeGas);
      if (active && data.cathodeGas) {
        cathodeBubblesRef.current.children.forEach((m, i) => {
          const s = seeds[i];
          const p = (t * s.speed * rate * 1.35 + s.phase) % 1;
          m.position.set(s.x, 0.04 + p * 0.21, s.z);
        });
      }
    }
    // Hạt electron phát sáng chạy đúng theo đường cong dây dẫn đen!
    if (electronRef.current) {
      electronRef.current.visible = active;
      if (active) {
        electronRef.current.children.forEach((m, i) => {
          const p = (t * (0.35 + currentA * 0.45) + i / 7) % 1;
          const pt = blackCurve.getPoint(p);
          m.position.copy(pt);
        });
      }
    }
    if (platingRef.current) {
      const targetScale = active && data.platesCopper ? Math.min(1.65, 1 + currentA * 0.38) : 1;
      platingRef.current.scale.x = THREE.MathUtils.lerp(platingRef.current.scale.x, targetScale, dt * 1.2);
      platingRef.current.scale.z = THREE.MathUtils.lerp(platingRef.current.scale.z, targetScale, dt * 1.2);
    }
  });

  return (
    <group
      position={position}
      rotation={rotation}
      onClick={(e) => { e.stopPropagation(); onSelectStation?.(); }}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; }}
    >
      {/* Bàn phụ bên trái chạm sàn chuẩn (y=-0.48 -> 0) */}
      <mesh position={[0, -0.025, 0]} receiveShadow castShadow>
        <boxGeometry args={[1.36, 0.05, 0.7]} />
        <meshStandardMaterial color="#182230" roughness={0.22} metalness={0.18} />
      </mesh>
      <mesh position={[0, -0.265, 0]} receiveShadow>
        <boxGeometry args={[1.24, 0.43, 0.6]} />
        <meshStandardMaterial color="#334155" roughness={0.62} />
      </mesh>

      {/* Bộ nguồn DC 0–12V kỹ thuật số */}
      <group position={[-0.36, 0.11, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.34, 0.22, 0.24]} />
          <meshStandardMaterial color="#0f172a" roughness={0.36} metalness={0.35} />
        </mesh>
        <mesh position={[0, 0.04, 0.121]}>
          <planeGeometry args={[0.26, 0.085]} />
          <meshStandardMaterial color="#020617" />
        </mesh>
        <Text position={[-0.06, 0.042, 0.123]} fontSize={0.028} color="#38bdf8" anchorX="center">
          {`${voltage.toFixed(1)}V`}
        </Text>
        <Text position={[0.065, 0.042, 0.123]} fontSize={0.028} color="#4ade80" anchorX="center">
          {`${currentA.toFixed(2)}A`}
        </Text>
        <mesh position={[-0.08, -0.055, 0.128]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.024, 14]} />
          <meshStandardMaterial color="#ef4444" emissive={active ? '#dc2626' : '#000'} emissiveIntensity={0.65} />
        </mesh>
        <mesh position={[0.08, -0.055, 0.128]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.024, 14]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
      </group>

      {/* Dây cáp dẫn điện uốn cong tự nhiên cắm đúng cọc & kẹp cá sấu */}
      <mesh geometry={redWireGeo} castShadow>
        <meshStandardMaterial color="#ef4444" roughness={0.42} />
      </mesh>
      <mesh geometry={blackWireGeo} castShadow>
        <meshStandardMaterial color="#1e293b" roughness={0.42} />
      </mesh>
      <group ref={electronRef} visible={false}>
        {Array.from({ length: 7 }, (_, i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.01, 10, 10]} />
            <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={2.6} />
          </mesh>
        ))}
      </group>

      {/* Bể thủy tinh điện phân */}
      <group position={[0.25, 0, 0]}>
        <mesh position={[0, 0.15, 0]} castShadow>
          <boxGeometry args={[0.42, 0.3, 0.26]} />
          <meshPhysicalMaterial color="#f0f9ff" transparent opacity={0.28} transmission={0.76} ior={1.47} roughness={0.04} clearcoat={1} />
        </mesh>
        <mesh position={[0, 0.115, 0]}>
          <boxGeometry args={[0.39, 0.21, 0.23]} />
          <meshPhysicalMaterial color={data.color} transparent opacity={0.66} roughness={0.08} ior={1.333} />
        </mesh>

        {/* Thanh giá đỡ điện cực gác ngang trên miệng bể */}
        <mesh position={[0, 0.305, 0]}>
          <boxGeometry args={[0.44, 0.012, 0.04]} />
          <meshStandardMaterial color="#1e293b" roughness={0.4} />
        </mesh>

        {/* Anot (+) */}
        <group position={[-0.1, 0, 0]}>
          <mesh position={[0, 0.18, 0]}>
            <cylinderGeometry args={[0.014, 0.014, 0.3, 14]} />
            <meshStandardMaterial color="#334155" metalness={0.45} roughness={0.45} />
          </mesh>
          <group ref={anodeBubblesRef} visible={false}>
            {seeds.map((_, i) => (
              <mesh key={i}>
                <sphereGeometry args={[0.0062, 8, 8]} />
                <meshStandardMaterial color={data.anodeGas || '#fff'} emissive={data.anodeGas || '#fff'} emissiveIntensity={0.4} transparent opacity={0.85} />
              </mesh>
            ))}
          </group>
        </group>

        {/* Catot (−) có mạ đồng đỏ nếu CuSO4 */}
        <group position={[0.1, 0, 0]}>
          <mesh ref={platingRef} position={[0, 0.18, 0]}>
            <cylinderGeometry args={[0.014, 0.014, 0.3, 14]} />
            <meshStandardMaterial
              color={active && data.platesCopper ? '#c26938' : '#475569'}
              metalness={active && data.platesCopper ? 0.88 : 0.45}
              roughness={0.28}
            />
          </mesh>
          <group ref={cathodeBubblesRef} visible={false}>
            {seeds.map((_, i) => (
              <mesh key={i}>
                <sphereGeometry args={[0.0062, 8, 8]} />
                <meshStandardMaterial color={data.cathodeGas || '#fff'} transparent opacity={0.85} />
              </mesh>
            ))}
          </group>
        </group>
      </group>
    </group>
  );
}

/* ---------- 5. BỆ HOLOGRAM PHÂN TỬ 3D VSEPR & XOẮN KÉP DNA ---------- */
function BondCylinder({ a, b, order = 1 }) {
  const { mid, quat, len } = useMemo(() => {
    const va = new THREE.Vector3(...a);
    const vb = new THREE.Vector3(...b);
    const dir = vb.clone().sub(va);
    const length = dir.length();
    const midpoint = va.clone().add(vb).multiplyScalar(0.5);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    return { mid: midpoint, quat: q, len: length };
  }, [a, b]);

  if (order === 2) {
    return (
      <group position={mid} quaternion={quat}>
        <mesh position={[0.032, 0, 0]}>
          <cylinderGeometry args={[0.024, 0.024, len, 10]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.35} roughness={0.3} />
        </mesh>
        <mesh position={[-0.032, 0, 0]}>
          <cylinderGeometry args={[0.024, 0.024, len, 10]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.35} roughness={0.3} />
        </mesh>
      </group>
    );
  }
  return (
    <mesh position={mid} quaternion={quat}>
      <cylinderGeometry args={[0.03, 0.03, len, 10]} />
      <meshStandardMaterial color="#cbd5e1" metalness={0.35} roughness={0.3} />
    </mesh>
  );
}

function DNAHelix3D() {
  const pairs = useMemo(() => Array.from({ length: 16 }, (_, i) => {
    const t = (i / 15) * Math.PI * 2.8;
    const y = (i - 7.5) * 0.11;
    const r = 0.36;
    const a = [Math.cos(t) * r, y, Math.sin(t) * r];
    const b = [-Math.cos(t) * r, y, -Math.sin(t) * r];
    const palette = [['#38bdf8', '#f59e0b'], ['#22c55e', '#f43f5e']][i % 2];
    return { a, b, c1: palette[0], c2: palette[1] };
  }), []);

  return (
    <group scale={0.58}>
      {pairs.map((p, i) => (
        <group key={i}>
          <mesh position={p.a}>
            <sphereGeometry args={[0.075, 16, 16]} />
            <meshPhysicalMaterial color="#60a5fa" emissive="#2563eb" emissiveIntensity={0.45} roughness={0.18} clearcoat={0.8} />
          </mesh>
          <mesh position={p.b}>
            <sphereGeometry args={[0.075, 16, 16]} />
            <meshPhysicalMaterial color="#a855f7" emissive="#7c3aed" emissiveIntensity={0.45} roughness={0.18} clearcoat={0.8} />
          </mesh>
          <BondCylinder a={p.a} b={[0, p.a[1], 0]} />
          <BondCylinder a={[0, p.b[1], 0]} b={p.b} />
          <mesh position={[p.a[0] * 0.45, p.a[1], p.a[2] * 0.45]}>
            <sphereGeometry args={[0.052, 12, 12]} />
            <meshStandardMaterial color={p.c1} emissive={p.c1} emissiveIntensity={0.4} />
          </mesh>
          <mesh position={[p.b[0] * 0.45, p.b[1], p.b[2] * 0.45]}>
            <sphereGeometry args={[0.052, 12, 12]} />
            <meshStandardMaterial color={p.c2} emissive={p.c2} emissiveIntensity={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function MoleculeHologramStation({
  position = [3.3, 0.48, 0.35],
  rotation = [0, -Math.PI / 2, 0],
  moleculeId = 'H2O',
  spaceFill = false,
  onSelectStation,
}) {
  const molRef = useRef();
  const mol = useMemo(() => MOLECULES_3D.find((m) => m.id === moleculeId) || MOLECULES_3D[0], [moleculeId]);

  useFrame((state) => {
    if (!molRef.current) return;
    molRef.current.rotation.y = state.clock.elapsedTime * 0.55;
    molRef.current.position.y = 0.48 + Math.sin(state.clock.elapsedTime * 1.6) * 0.025;
  });

  return (
    <group
      position={position}
      rotation={rotation}
      onClick={(e) => { e.stopPropagation(); onSelectStation?.(); }}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; }}
    >
      {/* Bàn phụ bên phải chạm sàn chuẩn */}
      <mesh position={[0, -0.025, 0]} receiveShadow castShadow>
        <boxGeometry args={[1.36, 0.05, 0.7]} />
        <meshStandardMaterial color="#182230" roughness={0.22} metalness={0.18} />
      </mesh>
      <mesh position={[0, -0.265, 0]} receiveShadow>
        <boxGeometry args={[1.24, 0.43, 0.6]} />
        <meshStandardMaterial color="#334155" roughness={0.62} />
      </mesh>

      <mesh position={[0, 0.035, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.32, 0.07, 36]} />
        <meshStandardMaterial color="#0f172a" metalness={0.78} roughness={0.22} />
      </mesh>
      <mesh position={[0, 0.072, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.23, 0.0085, 10, 36]} />
        <meshStandardMaterial color="#38bdf8" emissive="#0ea5e9" emissiveIntensity={2.2} />
      </mesh>
      <pointLight position={[0, 0.35, 0]} color="#38bdf8" intensity={1.0} distance={2.2} />

      <group ref={molRef} position={[0, 0.48, 0]} scale={0.36}>
        {mol.isDNA ? (
          <DNAHelix3D />
        ) : (
          <>
            {mol.atoms.map((a, i) => (
              <mesh key={i} position={a.pos} castShadow>
                <sphereGeometry args={[a.r * (spaceFill ? 1.85 : 1), 24, 24]} />
                <meshPhysicalMaterial color={a.color} roughness={0.15} metalness={0.1} clearcoat={0.8} />
              </mesh>
            ))}
            {!spaceFill && mol.bonds.map(([i, j, ord], idx) => (
              <BondCylinder key={idx} a={mol.atoms[i].pos} b={mol.atoms[j].pos} order={ord} />
            ))}
          </>
        )}
      </group>
    </group>
  );
}

/* ---------- 6. TRẠM QUANG HỌC LASER–LĂNG KÍNH & CON LẮC ĐƠN 3D ---------- */
const RAINBOW_RAYS = [
  { color: '#ef4444', dy: 0.06, dz: -0.01 },
  { color: '#f97316', dy: 0.04, dz: 0 },
  { color: '#eab308', dy: 0.02, dz: 0.005 },
  { color: '#22c55e', dy: 0, dz: 0.01 },
  { color: '#06b6d4', dy: -0.02, dz: 0.015 },
  { color: '#3b82f6', dy: -0.04, dz: 0.02 },
  { color: '#8b5cf6', dy: -0.06, dz: 0.025 },
];

export function OpticsPhysicsStation({
  position = [0, 0.48, -2.55],
  laserMode = 'white',
  prismAngle = 0,
  pendulumLength = 0.42,
  gravity = 9.81,
  pendulumRunning = true,
  onSelectStation,
}) {
  const stringRef = useRef();
  const bobRef = useRef();
  const stateRef = useRef({ theta: 0.52, omega: 0 });

  useFrame((_, dt) => {
    if (!stringRef.current || !bobRef.current) return;
    const step = Math.min(dt, 0.05);
    if (pendulumRunning) {
      const L = Math.max(0.22, pendulumLength);
      const alpha = -(gravity / (L * 2.2)) * Math.sin(stateRef.current.theta);
      stateRef.current.omega += alpha * step;
      stateRef.current.omega *= 0.9992;
      stateRef.current.theta += stateRef.current.omega * step;
    }
    const th = stateRef.current.theta;
    stringRef.current.rotation.z = th;
    bobRef.current.position.set(
      Math.sin(th) * pendulumLength,
      0.56 - Math.cos(th) * pendulumLength,
      0
    );
  });

  const singleRayColor = laserMode === 'red' ? '#ef4444' : laserMode === 'green' ? '#22c55e' : '#3b82f6';
  const singleDeflect = laserMode === 'red' ? 0.05 : laserMode === 'green' ? 0 : -0.055;
  const angleRad = (prismAngle * Math.PI) / 180;

  return (
    <group
      position={position}
      onClick={(e) => { e.stopPropagation(); onSelectStation?.(); }}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; }}
    >
      {/* Bàn Quang học – Vật lý chạm sàn chuẩn */}
      <mesh position={[0, -0.025, 0]} receiveShadow castShadow>
        <boxGeometry args={[2.56, 0.05, 0.74]} />
        <meshStandardMaterial color="#182230" roughness={0.22} metalness={0.18} />
      </mesh>
      <mesh position={[0, -0.265, 0]} receiveShadow>
        <boxGeometry args={[2.4, 0.43, 0.62]} />
        <meshStandardMaterial color="#334155" roughness={0.62} />
      </mesh>

      {/* --- BÀN QUANG HỌC LASER & LĂNG KÍNH TÁN SẮC --- */}
      <group position={[-0.45, 0, 0]}>
        <mesh position={[0, 0.015, 0]}>
          <boxGeometry args={[1.34, 0.03, 0.11]} />
          <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.25} />
        </mesh>
        <group position={[-0.56, 0.14, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.032, 0.036, 0.16, 18]} />
            <meshStandardMaterial color="#0f172a" metalness={0.68} roughness={0.28} />
          </mesh>
          <mesh position={[0, -0.07, 0]}>
            <cylinderGeometry args={[0.012, 0.016, 0.12, 12]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.8} />
          </mesh>
        </group>

        <mesh position={[-0.24, 0.14, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.005, 0.005, 0.48, 8]} />
          <meshStandardMaterial
            color={laserMode === 'white' ? '#ffffff' : singleRayColor}
            emissive={laserMode === 'white' ? '#f8fafc' : singleRayColor}
            emissiveIntensity={3.2}
          />
        </mesh>

        {/* Đế xoay chia độ đặt dưới lăng kính */}
        <mesh position={[0.02, 0.036, 0]}>
          <cylinderGeometry args={[0.105, 0.11, 0.012, 28]} />
          <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.3} />
        </mesh>
        <group position={[0.02, 0.14, 0]} rotation={[0, angleRad, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.092, 0.092, 0.18, 3]} />
            <meshPhysicalMaterial color="#e0f2fe" transparent opacity={0.44} transmission={0.88} ior={1.54} roughness={0.03} clearcoat={1} />
          </mesh>
        </group>

        {laserMode === 'white' ? (
          RAINBOW_RAYS.map((r, idx) => (
            <group key={idx}>
              <mesh
                position={[0.31, 0.14 + r.dy * 0.55 - angleRad * 0.06, r.dz]}
                rotation={[0, 0, Math.PI / 2 + r.dy * 1.15 - angleRad * 0.25]}
              >
                <cylinderGeometry args={[0.0042, 0.0042, 0.54, 8]} />
                <meshStandardMaterial color={r.color} emissive={r.color} emissiveIntensity={3.0} />
              </mesh>
              <mesh position={[0.57, 0.14 + r.dy * 1.15 - angleRad * 0.12, r.dz]}>
                <boxGeometry args={[0.008, 0.024, 0.09]} />
                <meshStandardMaterial color={r.color} emissive={r.color} emissiveIntensity={2.4} />
              </mesh>
            </group>
          ))
        ) : (
          <mesh
            position={[0.31, 0.14 + singleDeflect * 0.6 - angleRad * 0.06, 0]}
            rotation={[0, 0, Math.PI / 2 + singleDeflect * 1.2 - angleRad * 0.25]}
          >
            <cylinderGeometry args={[0.005, 0.005, 0.54, 8]} />
            <meshStandardMaterial color={singleRayColor} emissive={singleRayColor} emissiveIntensity={3.2} />
          </mesh>
        )}

        <mesh position={[0.58, 0.18, 0]}>
          <boxGeometry args={[0.018, 0.28, 0.24]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.85} />
        </mesh>
      </group>

      {/* --- CON LẮC ĐƠN VẬT LÝ 3D --- */}
      <group position={[0.78, 0, 0]}>
        <mesh position={[0, 0.015, 0]}>
          <boxGeometry args={[0.28, 0.03, 0.2]} />
          <meshStandardMaterial color="#1e293b" metalness={0.65} roughness={0.35} />
        </mesh>
        <mesh position={[-0.1, 0.3, 0]}>
          <cylinderGeometry args={[0.01, 0.01, 0.56, 14]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.18} />
        </mesh>
        <mesh position={[0, 0.56, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.008, 0.008, 0.24, 14]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.18} />
        </mesh>

        <group ref={stringRef} position={[0, 0.56, 0]}>
          <mesh position={[0, -pendulumLength / 2, 0]}>
            <cylinderGeometry args={[0.003, 0.003, pendulumLength, 8]} />
            <meshStandardMaterial color="#e2e8f0" />
          </mesh>
        </group>

        <mesh ref={bobRef} position={[0, 0.56 - pendulumLength, 0]} castShadow>
          <sphereGeometry args={[0.036, 22, 22]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.9} roughness={0.15} />
        </mesh>
      </group>
    </group>
  );
}

/* ---------- 7. KÍNH HIỂN VI QUANG HỌC 3D (BẤM ĐỂ SOI MẪU VẬT) ---------- */
export function MicroscopeProp({ position = [1.98, 0.48, -0.32], onOpen }) {
  return (
    <group
      position={position}
      rotation={[0, -0.4, 0]}
      onClick={(e) => { e.stopPropagation(); onOpen?.(); }}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; }}
    >
      <mesh position={[0, 0.018, 0]} castShadow>
        <boxGeometry args={[0.16, 0.036, 0.22]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.28} metalness={0.22} />
      </mesh>
      <mesh position={[0, 0.04, 0.03]}>
        <cylinderGeometry args={[0.022, 0.024, 0.012, 18]} />
        <meshStandardMaterial color="#fef9c3" emissive="#fef08a" emissiveIntensity={2.0} />
      </mesh>
      <mesh position={[0, 0.145, -0.065]} rotation={[0.18, 0, 0]} castShadow>
        <boxGeometry args={[0.036, 0.23, 0.038]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.3} metalness={0.18} />
      </mesh>
      <mesh position={[0, 0.11, 0.025]}>
        <boxGeometry args={[0.13, 0.012, 0.12]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.12, 0.025]}>
        <boxGeometry args={[0.085, 0.004, 0.032]} />
        <meshPhysicalMaterial color="#bae6fd" transparent opacity={0.7} />
      </mesh>
      <mesh position={[0, 0.195, 0.025]}>
        <cylinderGeometry args={[0.032, 0.032, 0.018, 18]} />
        <meshStandardMaterial color="#1e293b" metalness={0.65} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.165, 0.025]}>
        <cylinderGeometry args={[0.008, 0.006, 0.048, 12]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.92} roughness={0.15} />
      </mesh>
      <mesh position={[0, 0.275, -0.015]} rotation={[0.52, 0, 0]} castShadow>
        <cylinderGeometry args={[0.018, 0.02, 0.14, 18]} />
        <meshStandardMaterial color="#0f172a" metalness={0.55} roughness={0.3} />
      </mesh>
    </group>
  );
}
