import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const MODEL_URL = '/models/heart-3d.glb';

/**
 * Tính nhịp tim "lub-dub" tự nhiên (~68 nhịp/phút) trong khoảng [0, 1].
 */
function heartbeatPulse(elapsedSec) {
  const cycle = (elapsedSec * 1.12) % 1;
  // Nhịp chính (lub) quanh t = 0.12 và nhịp phụ (dub) quanh t = 0.28
  const lub = Math.exp(-Math.pow((cycle - 0.12) / 0.045, 2));
  const dub = 0.58 * Math.exp(-Math.pow((cycle - 0.28) / 0.04, 2));
  return Math.min(1, lub + dub);
}

/**
 * Trình xem Trái tim 3D giải phẫu xoay mượt (Three.js + GLB thật, kéo để xoay 360°).
 */
export default function Heart3DViewer({ readiness = 0, isPro = false, fallback = null }) {
  const mountRef = useRef(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return undefined;

    let disposed = false;
    let rafId = 0;
    let renderer;
    let scene;
    let camera;
    let pmremGenerator;
    let envRT;
    let loadedRoot = null;
    let isVisible = true;

    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setStatus('error');
      return undefined;
    }

    const width = Math.max(container.clientWidth || 260, 180);
    const height = Math.max(container.clientHeight || 275, 180);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.touchAction = 'none';

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    scene = new THREE.Scene();

    // Studio PBR environment lighting (khối bóng mịn không cần tải thêm HDRI ngoài)
    pmremGenerator = new THREE.PMREMGenerator(renderer);
    envRT = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envRT.texture;

    camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
    camera.position.set(0, 0.08, 3.05);
    camera.lookAt(0, 0, 0);

    // 3-point lighting tôn màu đỏ cơ tim + xanh cobalt mạch máu
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffe4e6, 0.95);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 1.9);
    keyLight.position.set(2.8, 3.6, 3.8);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x3b82f6, 1.45);
    rimLight.position.set(-3.2, 1.8, -2.5);
    scene.add(rimLight);

    const coralFill = new THREE.PointLight(0xfb7185, 1.1, 10);
    coralFill.position.set(1.5, -2.2, 2.2);
    scene.add(coralFill);

    // Pivot group cho xoay 360° + kéo chuột + nhịp đập tim
    const pivot = new THREE.Group();
    scene.add(pivot);

    // Tương tác kéo xoay mượt với quán tính
    let isPointerDown = false;
    let lastX = 0;
    let lastY = 0;
    let velY = 0;
    let velX = 0;
    let targetRotX = 0.08;
    let rotY = 0.35;
    let rotX = 0.08;
    let baseScale = 1;

    const onPointerDown = (e) => {
      isPointerDown = true;
      lastX = e.clientX;
      lastY = e.clientY;
      velY = 0;
      velX = 0;
      setDragging(true);
      try {
        renderer.domElement.setPointerCapture?.(e.pointerId);
      } catch { /* ignore */ }
    };

    const onPointerMove = (e) => {
      if (!isPointerDown) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      velY = dx * 0.012;
      velX = dy * 0.008;
      rotY += velY;
      targetRotX = Math.max(-0.65, Math.min(0.65, targetRotX + velX));
    };

    const onPointerUp = (e) => {
      if (!isPointerDown) return;
      isPointerDown = false;
      setDragging(false);
      try {
        renderer.domElement.releasePointerCapture?.(e.pointerId);
      } catch { /* ignore */ }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    // Load mô hình trái tim giải phẫu .glb
    const loader = new GLTFLoader();
    loader.load(
      MODEL_URL,
      (gltf) => {
        if (disposed) return;
        const root = gltf.scene;

        // Căn tâm & chuẩn hóa tỉ lệ hiển thị
        const box = new THREE.Box3().setFromObject(root);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);

        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        baseScale = 1.52 / maxDim;
        root.position.set(-center.x * baseScale, -center.y * baseScale, -center.z * baseScale);
        root.scale.setScalar(baseScale);

        root.traverse((obj) => {
          if (obj.isMesh && obj.material) {
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            mats.forEach((mat) => {
              mat.envMapIntensity = 1.15;
              if (typeof mat.roughness === 'number') {
                mat.roughness = Math.min(mat.roughness, 0.72);
              }
              mat.needsUpdate = true;
            });
          }
        });

        loadedRoot = root;
        pivot.add(root);
        setStatus('ready');
      },
      undefined,
      () => {
        if (!disposed) setStatus('error');
      }
    );

    // Resize observer giữ tỷ lệ sắc nét trên mọi viewport
    let ro = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver((entries) => {
        if (disposed || !entries[0]) return;
        const { width: w, height: h } = entries[0].contentRect;
        if (w > 20 && h > 20) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      });
      ro.observe(container);
    }

    // Dừng render khi cuộn khỏi màn hình để tiết kiệm pin/GPU
    let io = null;
    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(
        (entries) => {
          isVisible = Boolean(entries[0]?.isIntersecting);
        },
        { threshold: 0.05 }
      );
      io.observe(container);
    }

    const clock = new THREE.Clock();
    let elapsed = 0;

    const animate = () => {
      if (disposed) return;
      rafId = requestAnimationFrame(animate);
      if (!isVisible || document.hidden) {
        clock.getDelta();
        return;
      }

      const dt = Math.min(clock.getDelta(), 0.05);
      elapsed += dt;

      if (!isPointerDown) {
        // Quán tính mượt + tự động xoay 360° đều
        velY *= 0.92;
        rotY += 0.56 * dt + velY;
        targetRotX += (0.08 - targetRotX) * Math.min(1, dt * 1.8);
      }
      rotX += (targetRotX - rotX) * Math.min(1, dt * 10);

      pivot.rotation.y = rotY;
      pivot.rotation.x = rotX + Math.sin(elapsed * 1.1) * 0.035;
      pivot.rotation.z = Math.cos(elapsed * 0.85) * 0.025;
      pivot.position.y = Math.sin(elapsed * 1.6) * 0.045;

      // Nhịp đập tim nhẹ nhàng chân thực
      if (loadedRoot) {
        const beat = 1 + heartbeatPulse(elapsed) * 0.034;
        pivot.scale.setScalar(beat);
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      ro?.disconnect();
      io?.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);

      if (loadedRoot) {
        loadedRoot.traverse((obj) => {
          if (obj.isMesh) {
            obj.geometry?.dispose?.();
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            mats.forEach((m) => {
              m?.map?.dispose?.();
              m?.normalMap?.dispose?.();
              m?.roughnessMap?.dispose?.();
              m?.metalnessMap?.dispose?.();
              m?.dispose?.();
            });
          }
        });
      }
      envRT?.dispose?.();
      pmremGenerator?.dispose?.();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  if (status === 'error' && fallback) {
    return fallback;
  }

  return (
    <div
      className={`pf-atlas-heart3d-wrap${dragging ? ' is-dragging' : ''}`}
      aria-label="Mô hình Trái tim 3D giải phẫu tương tác (kéo để xoay)"
      title="Kéo để xoay Trái tim 3D"
    >
      <div ref={mountRef} className="pf-atlas-heart3d-canvas" />

      {status === 'loading' && (
        <div className="pf-atlas-heart3d-loading" aria-hidden="true">
          <span className="pf-atlas-heart3d-spinner" />
          <small>Đang tải 3D…</small>
        </div>
      )}

      {status === 'ready' && (
        <div className="pf-atlas-heart3d-pill" aria-hidden="true">
          <strong>{readiness}%</strong>
          <span>{isPro ? 'ELEC VIP' : 'KHTN 3D'}</span>
        </div>
      )}
    </div>
  );
}
