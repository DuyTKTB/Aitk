import React, { Component, Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, OrbitControls, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

function checkWebGL() {
  if (typeof document === 'undefined') return false;
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') || c.getContext('webgl') || c.getContext('experimental-webgl'));
  } catch {
    return false;
  }
}

class Canvas3DBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err) {
    console.warn('[BioCanvas3D]', err);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="bl-3d-fallback">
          <strong>Không khởi tạo được khung 3D WebGL</strong>
          <p>Trình duyệt hoặc thiết bị đang tắt tăng tốc phần cứng. Bạn vẫn có thể xem bảng thông tin cấu trúc bên cạnh.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ── Bộ điều khiển Camera Fly-To mượt (tự nhả ngay khi người dùng kéo xoay) ── */
function CameraFlyRig({ focusView, controlsRef }) {
  const { camera } = useThree();
  const activeRef = useRef(false);
  const goalPos = useRef(new THREE.Vector3());
  const goalTarget = useRef(new THREE.Vector3());

  useEffect(() => {
    if (!focusView || !Array.isArray(focusView.position)) return;
    goalPos.current.set(...focusView.position);
    if (Array.isArray(focusView.target)) {
      goalTarget.current.set(...focusView.target);
    } else {
      goalTarget.current.set(0, 0, 0);
    }
    activeRef.current = true;
  }, [focusView]);

  useEffect(() => {
    const ctrl = controlsRef.current;
    if (!ctrl) return undefined;
    const cancelFly = () => {
      activeRef.current = false;
    };
    ctrl.addEventListener('start', cancelFly);
    return () => ctrl.removeEventListener('start', cancelFly);
  }, [controlsRef]);

  useFrame((_, dt) => {
    if (!activeRef.current) return;
    const alpha = Math.min(1, dt * 4.5);
    camera.position.lerp(goalPos.current, alpha);
    if (controlsRef.current) {
      controlsRef.current.target.lerp(goalTarget.current, alpha);
      controlsRef.current.update();
    }
    if (camera.position.distanceTo(goalPos.current) < 0.04) {
      activeRef.current = false;
    }
  });

  return null;
}

const STUDIO_THEMES = {
  deep: {
    label: 'Lab Đêm',
    bg: '#040b18',
    grad: 'radial-gradient(circle at 50% 34%, #0f254a 0%, #050d1e 68%, #02050e 100%)',
    ambient: 0.42,
    sparkle: '#38bdf8',
  },
  medical: {
    label: 'Y Khoa',
    bg: '#071422',
    grad: 'radial-gradient(circle at 50% 30%, #12334d 0%, #081726 68%, #030a12 100%)',
    ambient: 0.52,
    sparkle: '#34d399',
  },
  holo: {
    label: 'Hologram',
    bg: '#040814',
    grad: 'radial-gradient(circle at 50% 38%, #1c1342 0%, #070d20 68%, #02040a 100%)',
    ambient: 0.36,
    sparkle: '#a78bfa',
  },
};

/**
 * BioCanvas3D — Khung Studio PBR chuẩn Y khoa:
 *  • Ánh sáng Studio 3 điểm + Rim Light + Environment Lightformers (100% offline)
 *  • Camera Fly-To nội suy mượt khi chọn cấu trúc hoặc đổi góc nhìn
 *  • Chụp ảnh mô hình 3D độ phân giải cao (Snapshot PNG) cho bài giảng / báo cáo
 */
export default function BioCanvas3D({
  children,
  camera = { position: [0, 1.3, 6.2], fov: 40 },
  focusView = null,
  height = 480,
  bg = null,
  studioTheme = 'deep',
  autoRotate = false,
  minDistance = 1.8,
  maxDistance = 14,
  showShadows = true,
  shadowY = -2.45,
  sparklesCount = 28,
  badge = '3D Medical Studio PBR',
  fallback = null,
}) {
  const [webglOk, setWebglOk] = useState(true);
  const [resetKey, setResetKey] = useState(0);
  const [themeKey, setThemeKey] = useState(studioTheme);
  const [manualView, setManualView] = useState(null);
  const controlsRef = useRef(null);
  const stageRef = useRef(null);

  useEffect(() => {
    setWebglOk(checkWebGL());
  }, []);

  const activeTheme = STUDIO_THEMES[themeKey] || STUDIO_THEMES.deep;
  const stageBg = bg || activeTheme.bg;
  const effectiveFocus = manualView || focusView;

  if (!webglOk) {
    return fallback || (
      <div className="bl-3d-fallback" style={{ minHeight: height }}>
        <strong>Thiết bị chưa bật WebGL 3D</strong>
        <p>Hãy bật tăng tốc phần cứng trong trình duyệt để xoay mô hình 3D 360°.</p>
      </div>
    );
  }

  const cycleTheme = () => {
    const keys = Object.keys(STUDIO_THEMES);
    setThemeKey(keys[(keys.indexOf(themeKey) + 1) % keys.length]);
  };

  const handleSnapshot = () => {
    const cvs = stageRef.current?.querySelector('canvas');
    if (!cvs) return;
    try {
      const url = cvs.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `elec-bio-3d-${Date.now()}.png`;
      a.click();
    } catch {
      /* ignore */
    }
  };

  const baseDist = Math.hypot(...(camera.position || [0, 1.3, 6.2]));

  return (
    <div
      ref={stageRef}
      className="bl-3d-stage"
      style={{ height, background: activeTheme.grad }}
    >
      {/* Top Studio HUD */}
      <div className="bl-3d-top-hud">
        <span className="bl-3d-badge">
          <i className="bl-3d-live-dot" />
          {badge}
        </span>
        <div className="bl-3d-hud-btns">
          <button
            type="button"
            className="bl-3d-hud-btn"
            onClick={() => setManualView({ position: [0, 0.35, baseDist], target: [0, 0, 0], _t: Date.now() })}
            title="Góc nhìn chính diện"
          >
            Chính diện
          </button>
          <button
            type="button"
            className="bl-3d-hud-btn"
            onClick={() => setManualView({ position: [baseDist * 0.72, baseDist * 0.36, baseDist * 0.65], target: [0, 0, 0], _t: Date.now() })}
            title="Góc nhìn 3/4 cận cảnh"
          >
            Góc 3/4
          </button>
          <button
            type="button"
            className="bl-3d-hud-btn"
            onClick={cycleTheme}
            title="Đổi phông ánh sáng Studio"
          >
            {activeTheme.label}
          </button>
          <button
            type="button"
            className="bl-3d-hud-btn"
            onClick={handleSnapshot}
            title="Lưu ảnh PNG chất lượng cao chèn vào bài giảng"
          >
            Chụp PNG
          </button>
          <button
            type="button"
            className="bl-3d-hud-btn"
            onClick={() => { setManualView(null); setResetKey((k) => k + 1); }}
            title="Đặt lại góc nhìn mặc định"
          >
            Reset
          </button>
        </div>
      </div>

      <Canvas3DBoundary fallback={fallback}>
        <Canvas
          key={resetKey}
          dpr={[1, 2]}
          camera={camera}
          shadows
          gl={{
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.15,
          }}
        >
          <fog attach="fog" args={[stageBg, 11, 28]} />

          {/* Medical Studio Multi-Point Lighting (Key + Cool Rim + Warm Subsurface Fill) */}
          <ambientLight intensity={activeTheme.ambient} />
          <hemisphereLight args={['#f0f9ff', '#0f172a', 0.85]} />
          <directionalLight
            position={[6, 8, 7]}
            intensity={1.95}
            color="#fff7ed"
            castShadow
            shadow-mapSize={[512, 512]}
          />
          <directionalLight position={[-7, 4, -5]} intensity={1.25} color="#38bdf8" />
          <pointLight position={[2, -4, 4]} intensity={0.75} color="#fb7185" distance={15} />
          <pointLight position={[-3, -3, 3]} intensity={0.55} color="#10b981" distance={14} />

          {/* Procedural PBR Reflections */}
          <Environment resolution={256} frames={1}>
            <Lightformer form="ring" intensity={2.5} position={[0, 8, 2]} scale={8} color="#e0f2fe" />
            <Lightformer form="rect" intensity={2.0} position={[8, 2, 5]} scale={[6, 10, 1]} color="#fff7ed" />
            <Lightformer form="rect" intensity={1.6} position={[-8, -1, -4]} scale={[8, 8, 1]} color="#38bdf8" />
            <Lightformer form="circle" intensity={1.2} position={[0, -6, 3]} scale={6} color="#10b981" />
          </Environment>

          <Suspense fallback={null}>
            {children}
            {sparklesCount > 0 && (
              <Sparkles
                count={sparklesCount}
                scale={[7.5, 6.2, 6.5]}
                size={1.4}
                speed={0.22}
                opacity={0.28}
                color={activeTheme.sparkle}
              />
            )}
            {showShadows && (
              <ContactShadows
                position={[0, shadowY, 0]}
                opacity={0.46}
                scale={10}
                blur={2.4}
                far={5.8}
                color="#020617"
              />
            )}
          </Suspense>

          <CameraFlyRig focusView={effectiveFocus} controlsRef={controlsRef} />
          <OrbitControls
            ref={controlsRef}
            makeDefault
            enableDamping
            dampingFactor={0.075}
            autoRotate={autoRotate}
            autoRotateSpeed={0.95}
            minDistance={minDistance}
            maxDistance={maxDistance}
          />
        </Canvas>
      </Canvas3DBoundary>

      <div className="bl-3d-overlay-hint">
        <span>Kéo xoay 360° · Cuộn phóng to · Bấm vào cấu trúc để camera tự động lướt cận cảnh</span>
      </div>
    </div>
  );
}
