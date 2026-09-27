import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { getPalette } from '../../../lib/threeUtils';

export default function ChickenModel({
  text,
  color = '#f5f0e0',
  dead = false,
  highlight = false,
  theme = 'light',
  onClick,
}) {
  const group = useRef();
  const t = useRef(0);
  const pal = getPalette(theme);

  useFrame((_, dt) => {
    if (!group.current) return;
    if (dead) {
      group.current.rotation.z = Math.min(Math.PI / 2, group.current.rotation.z + dt * 4);
      group.current.position.y = Math.max(-0.3, group.current.position.y - dt * 1.5);
      return;
    }
    t.current += dt;
    group.current.position.y = Math.abs(Math.sin(t.current * 6)) * 0.08;
    if (highlight) {
      group.current.rotation.z = Math.sin(t.current * 12) * 0.18;
    } else {
      group.current.rotation.z *= 0.9;
    }
  });

  return (
    <group ref={group} onClick={onClick}>
      {/* Body */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.8, 0.7, 1.0]} />
        <meshToonMaterial color={color} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.95, 0.5]}>
        <sphereGeometry args={[0.32, 12, 12]} />
        <meshToonMaterial color={color} />
      </mesh>

      {/* Beak */}
      <mesh position={[0, 0.92, 0.82]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.1, 0.22, 4]} />
        <meshToonMaterial color={pal.category.alkaline} />
      </mesh>

      {/* Comb */}
      {[-0.12, 0, 0.12].map((dx, i) => (
        <mesh key={i} position={[dx, 1.28, 0.5]}>
          <boxGeometry args={[0.1, 0.18, 0.1]} />
          <meshToonMaterial color={pal.acc} />
        </mesh>
      ))}

      {/* Eyes */}
      {[-0.12, 0.12].map((dx, i) => (
        <mesh key={i} position={[dx, 1.02, 0.78]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshBasicMaterial color="#111" />
        </mesh>
      ))}

      {/* Wings */}
      {[-0.42, 0.42].map((x, i) => (
        <mesh key={i} position={[x, 0.55, 0]}>
          <boxGeometry args={[0.06, 0.35, 0.55]} />
          <meshToonMaterial color={color} />
        </mesh>
      ))}

      {/* Legs */}
      {[-0.2, 0.2].map((x, i) => (
        <mesh key={i} position={[x, 0.12, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 0.25, 6]} />
          <meshToonMaterial color={pal.category.alkaline} />
        </mesh>
      ))}

      {/* Sign đáp án — viền đen, nền trắng, chữ đen */}
      <group position={[0, 1.6, 0]}>
        <mesh position={[0, 0, -0.005]}>
          <planeGeometry args={[1.5, 0.6]} />
          <meshBasicMaterial color="#111" side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[1.42, 0.52]} />
          <meshBasicMaterial color="#efece4" side={THREE.DoubleSide} />
        </mesh>
        <Text
          position={[0, 0, 0.01]}
          fontSize={0.32}
          color="#111"
          anchorX="center"
          anchorY="middle"
        >
          {text}
        </Text>
      </group>
    </group>
  );
}