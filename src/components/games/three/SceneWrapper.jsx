import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { getPalette } from '../../../lib/threeUtils';

export default function SceneWrapper({
  children,
  camera = { position: [0, 11, 12], fov: 45 },
  theme = 'light',
  onPointerMissed,
}) {
  const pal = getPalette(theme);

  return (
    <div className="game-canvas">
      <Canvas
        camera={camera}
        dpr={[1, 1.5]}
        frameloop="always"
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'default',
          failIfMajorPerformanceCaveat: false,
          preserveDrawingBuffer: false,
        }}
        onCreated={({ gl }) => {
          // Bắt lỗi context lost, log ra console
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            console.warn('[ChemStudy] WebGL context lost — thử reload trang');
          });
          gl.domElement.addEventListener('webglcontextrestored', () => {
            console.info('[ChemStudy] WebGL context restored');
          });
        }}
        onPointerMissed={onPointerMissed}
        style={{ background: pal.bg }}
      >
        <color attach="background" args={[pal.bg]} />
        <ambientLight intensity={0.85} />
        <directionalLight position={[6, 10, 6]} intensity={0.7} />
        <Suspense fallback={null}>{children}</Suspense>
      </Canvas>
    </div>
  );
}