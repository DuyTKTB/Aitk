/* ============================================================
   Atom3DViewer.jsx — Trình mô phỏng 3D WebGL (Three.js) cho từng nguyên tố
   3 chế độ 3D thật (kéo xoay 360°, cuộn phóng to/nhỏ, tạm dừng):
   1. Nguyên tử 3D (Bohr): Hạt nhân proton/neutron + các lớp vỏ nghiêng 3D + electron hóa trị nổi bật
   2. Obitan lượng tử 3D (s / p / d / f): Đám mây xác suất sóng hàm cầu 3D (1600 hạt phát sáng)
   3. Mạng tinh thể / Phân tử 3D: BCC, FCC, HCP, Kim cương, Phân tử 2 nguyên tử, Khí đơn nguyên tử
   ============================================================ */

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const SHELL_NAMES = 'KLMNOPQ';

export function shellsOfConfig(cfg = '') {
  const s = [];
  for (const m of String(cfg).matchAll(/(\d)([spdf])([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g)) {
    const count = +[...m[3]].map((c) => SUP.indexOf(c)).join('');
    s[m[1] - 1] = (s[m[1] - 1] || 0) + count;
  }
  return Array.from(s, (v) => v || 0);
}

const CRYSTAL_LABELS = {
  bcc: 'Lập phương tâm khối (BCC)',
  fcc: 'Lập phương tâm diện (FCC)',
  hcp: 'Lục phương xếp chặt (HCP)',
  diamond: 'Tứ diện kim cương',
  diatomic: 'Phân tử 2 nguyên tử (X₂)',
  monatomic: 'Khí đơn nguyên tử',
};

function createSoftParticleTexture() {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.78)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

function buildBohrGroup(e, shells) {
  const root = new THREE.Group();
  const animItems = [];

  // 1. Cụm hạt nhân 3D (Proton đỏ san hô + Neutron xanh bạc)
  const nucGroup = new THREE.Group();
  const nucleonCount = Math.min(26, Math.max(1, e.atomicNumber === 1 ? 1 : Math.min(26, Math.round(e.atomicNumber * 0.9 + 2))));
  const pGeo = new THREE.SphereGeometry(nucleonCount === 1 ? 0.34 : 0.21, 18, 18);
  const pMat = new THREE.MeshStandardMaterial({
    color: 0xf43f5e,
    emissive: 0x9f1239,
    emissiveIntensity: 0.45,
    roughness: 0.28,
    metalness: 0.25,
  });
  const nMat = new THREE.MeshStandardMaterial({
    color: 0x93c5fd,
    emissive: 0x1d4ed8,
    emissiveIntensity: 0.35,
    roughness: 0.32,
    metalness: 0.25,
  });

  for (let i = 0; i < nucleonCount; i++) {
    const mesh = new THREE.Mesh(pGeo, i % 2 === 0 ? pMat : nMat);
    if (nucleonCount > 1) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / nucleonCount);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const r = 0.24 + (i % 3) * 0.08;
      mesh.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
    }
    nucGroup.add(mesh);
  }
  root.add(nucGroup);

  // Vỏ sáng mờ quanh hạt nhân
  const coreHalo = new THREE.Mesh(
    new THREE.SphereGeometry(0.68, 20, 20),
    new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
    })
  );
  root.add(coreHalo);

  // 2. Các lớp vỏ electron nghiêng 3D
  const eGeo = new THREE.SphereGeometry(0.11, 14, 14);
  const innerMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.85,
    roughness: 0.15,
  });
  const valenceMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: 0xd97706,
    emissiveIntensity: 0.95,
    roughness: 0.15,
  });

  const maxShells = shells.length || 1;
  const maxRadius = 2.65;
  const minRadius = 0.92;

  shells.forEach((count, idx) => {
    const isValence = idx === maxShells - 1;
    const radius =
      maxShells === 1
        ? 1.55
        : minRadius + (idx / (maxShells - 1)) * (maxRadius - minRadius);

    const shellPivot = new THREE.Group();
    // Nghiêng các lớp vỏ theo góc 3D hài hòa để thấy rõ chiều sâu
    const tiltX = ((idx % 3) - 1) * 0.48 + (idx === 0 ? 0.35 : 0);
    const tiltZ = ((idx % 2 === 0 ? 1 : -1) * 0.36) + idx * 0.14;
    shellPivot.rotation.set(tiltX, idx * 0.4, tiltZ);

    const ringGeo = new THREE.TorusGeometry(radius, isValence ? 0.017 : 0.011, 10, 84);
    const ringMat = new THREE.MeshBasicMaterial({
      color: isValence ? 0xfbbf24 : 0x60a5fa,
      transparent: true,
      opacity: isValence ? 0.48 : 0.24,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    shellPivot.add(ring);

    const spinner = new THREE.Group();
    const visibleElectrons = Math.min(count, 32);
    for (let k = 0; k < visibleElectrons; k++) {
      const a = (2 * Math.PI * k) / visibleElectrons;
      const eMesh = new THREE.Mesh(eGeo, isValence ? valenceMat : innerMat);
      eMesh.position.set(radius * Math.cos(a), radius * Math.sin(a), 0);
      spinner.add(eMesh);
    }
    shellPivot.add(spinner);
    root.add(shellPivot);

    animItems.push({
      obj: spinner,
      speed: (idx % 2 === 0 ? 1 : -1) * (1.25 / (1 + idx * 0.38)),
    });
  });

  return { root, animItems };
}

function buildOrbitalCloudGroup(blockType) {
  const root = new THREE.Group();
  const count = 1750;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  const cPos = new THREE.Color(blockType === 's' ? 0x38bdf8 : blockType === 'p' ? 0x6366f1 : blockType === 'd' ? 0xa855f7 : 0xec4899);
  const cNeg = new THREE.Color(blockType === 's' ? 0x818cf8 : blockType === 'p' ? 0xf43f5e : blockType === 'd' ? 0x22d3ee : 0xfbbf24);

  let i = 0;
  let guard = 0;
  while (i < count && guard < 60000) {
    guard++;
    const x = (Math.random() * 2 - 1) * 2.4;
    const y = (Math.random() * 2 - 1) * 2.4;
    const z = (Math.random() * 2 - 1) * 2.4;
    const r = Math.sqrt(x * x + y * y + z * z);
    if (r < 0.08 || r > 2.35) continue;

    const nx = x / r;
    const ny = y / r;
    const nz = z / r;
    let psi = 0;

    if (blockType === 's') {
      psi = Math.exp(-r * 1.15);
    } else if (blockType === 'p') {
      // Obitan p_z hai thùy đối xứng dọc trục Y/Z
      psi = ny * r * Math.exp(-r * 1.12);
    } else if (blockType === 'd') {
      // Obitan d_xy 4 thùy cánh hoa
      psi = nx * ny * r * r * Math.exp(-r * 1.38) * 2.2;
    } else {
      // Obitan f_xyz 8 thùy lập thể
      psi = nx * ny * nz * r * r * r * Math.exp(-r * 1.52) * 5.2;
    }

    const prob = Math.min(1, psi * psi * (blockType === 's' ? 1.8 : 2.8));
    if (Math.random() > prob) continue;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    const col = psi >= 0 ? cPos : cNeg;
    colors[i * 3] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
    i++;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const tex = createSoftParticleTexture();
  const mat = new THREE.PointsMaterial({
    size: 0.14,
    map: tex,
    vertexColors: true,
    transparent: true,
    opacity: 0.92,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const points = new THREE.Points(geo, mat);
  root.add(points);

  // Hệ trục tọa độ mảnh (x, y, z) để học sinh hình dung không gian obitan
  const axisMat = new THREE.LineBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.35 });
  const makeAxis = (a, b) => new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), axisMat);
  root.add(makeAxis(new THREE.Vector3(-2.3, 0, 0), new THREE.Vector3(2.3, 0, 0)));
  root.add(makeAxis(new THREE.Vector3(0, -2.3, 0), new THREE.Vector3(0, 2.3, 0)));
  root.add(makeAxis(new THREE.Vector3(0, 0, -2.3), new THREE.Vector3(0, 0, 2.3)));

  // Hạt nhân sáng ở tâm
  const centerDot = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 14, 14),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  root.add(centerDot);

  return { root, animItems: [], extraDisposables: [tex] };
}

function addBondCylinder(group, p1, p2, radius, mat) {
  const dir = new THREE.Vector3().subVectors(p2, p1);
  const len = dir.length();
  const geo = new THREE.CylinderGeometry(radius, radius, len, 10);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(p1).add(p2).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  group.add(mesh);
}

function buildCrystalGroup(e) {
  const root = new THREE.Group();
  const type = e.crystal || 'bcc';
  const baseHex = e.cpk && /^#[0-9a-f]{6}$/i.test(e.cpk) ? parseInt(e.cpk.slice(1), 16) : 0x60a5fa;
  const atomMat = new THREE.MeshStandardMaterial({
    color: baseHex,
    emissive: baseHex,
    emissiveIntensity: 0.22,
    roughness: 0.24,
    metalness: 0.55,
  });
  const bondMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    roughness: 0.35,
    metalness: 0.3,
    transparent: true,
    opacity: 0.72,
  });

  if (type === 'diatomic') {
    const geo = new THREE.SphereGeometry(0.68, 28, 28);
    const a = new THREE.Mesh(geo, atomMat);
    const b = new THREE.Mesh(geo, atomMat);
    a.position.set(-0.78, 0, 0);
    b.position.set(0.78, 0, 0);
    root.add(a, b);
    addBondCylinder(root, new THREE.Vector3(-0.78, 0, 0), new THREE.Vector3(0.78, 0, 0), 0.14, bondMat);
    return { root, animItems: [] };
  }

  if (type === 'monatomic') {
    const box = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(2.6, 2.6, 2.6)),
      new THREE.LineBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.35 })
    );
    root.add(box);
    const geo = new THREE.SphereGeometry(0.28, 20, 20);
    const coords = [
      [-0.7, 0.5, 0.4], [0.8, -0.4, 0.6], [-0.4, -0.7, -0.5],
      [0.5, 0.7, -0.6], [0.0, 0.0, 0.1], [-0.8, 0.1, -0.8],
    ];
    coords.forEach(([x, y, z]) => {
      const m = new THREE.Mesh(geo, atomMat);
      m.position.set(x, y, z);
      root.add(m);
    });
    return { root, animItems: [] };
  }

  const s = 1.05;
  const corners = [];
  for (const x of [-s, s]) {
    for (const y of [-s, s]) {
      for (const z of [-s, s]) {
        corners.push(new THREE.Vector3(x, y, z));
      }
    }
  }

  if (type === 'hcp') {
    const geo = new THREE.SphereGeometry(0.24, 20, 20);
    const r = 1.18;
    const h = 0.95;
    const topPts = [];
    const botPts = [];
    for (let k = 0; k < 6; k++) {
      const a = (Math.PI / 3) * k;
      topPts.push(new THREE.Vector3(r * Math.cos(a), h, r * Math.sin(a)));
      botPts.push(new THREE.Vector3(r * Math.cos(a), -h, r * Math.sin(a)));
    }
    const all = [
      ...topPts,
      ...botPts,
      new THREE.Vector3(0, h, 0),
      new THREE.Vector3(0, -h, 0),
      new THREE.Vector3(0.58, 0, 0.34),
      new THREE.Vector3(-0.58, 0, 0.34),
      new THREE.Vector3(0, 0, -0.66),
    ];
    all.forEach((p) => {
      const m = new THREE.Mesh(geo, atomMat);
      m.position.copy(p);
      root.add(m);
    });
    for (let k = 0; k < 6; k++) {
      addBondCylinder(root, topPts[k], topPts[(k + 1) % 6], 0.035, bondMat);
      addBondCylinder(root, botPts[k], botPts[(k + 1) % 6], 0.035, bondMat);
      addBondCylinder(root, topPts[k], botPts[k], 0.03, bondMat);
    }
    return { root, animItems: [] };
  }

  // Khung ô mạng lập phương (BCC / FCC / Diamond)
  const wire = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(s * 2, s * 2, s * 2)),
    new THREE.LineBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.42 })
  );
  root.add(wire);

  const atomGeo = new THREE.SphereGeometry(type === 'diamond' ? 0.22 : 0.25, 22, 22);
  corners.forEach((p) => {
    const m = new THREE.Mesh(atomGeo, atomMat);
    m.position.copy(p);
    root.add(m);
  });

  if (type === 'bcc') {
    const center = new THREE.Vector3(0, 0, 0);
    const cm = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 24), atomMat);
    root.add(cm);
    corners.forEach((p) => addBondCylinder(root, center, p, 0.035, bondMat));
  } else if (type === 'fcc' || type === 'diamond') {
    const faces = [
      new THREE.Vector3(s, 0, 0), new THREE.Vector3(-s, 0, 0),
      new THREE.Vector3(0, s, 0), new THREE.Vector3(0, -s, 0),
      new THREE.Vector3(0, 0, s), new THREE.Vector3(0, 0, -s),
    ];
    faces.forEach((p) => {
      const m = new THREE.Mesh(atomGeo, atomMat);
      m.position.copy(p);
      root.add(m);
    });
    if (type === 'diamond') {
      const inner = [
        new THREE.Vector3(s * 0.5, s * 0.5, s * 0.5),
        new THREE.Vector3(-s * 0.5, -s * 0.5, s * 0.5),
        new THREE.Vector3(-s * 0.5, s * 0.5, -s * 0.5),
        new THREE.Vector3(s * 0.5, -s * 0.5, -s * 0.5),
      ];
      inner.forEach((p) => {
        const m = new THREE.Mesh(atomGeo, atomMat);
        m.position.copy(p);
        root.add(m);
        [...corners, ...faces].forEach((n) => {
          if (p.distanceTo(n) < s * 0.95) {
            addBondCylinder(root, p, n, 0.045, bondMat);
          }
        });
      });
    }
  }

  return { root, animItems: [] };
}

export default function Atom3DViewer({ element }) {
  const mountRef = useRef(null);
  const [mode, setMode] = useState('bohr'); // 'bohr' | 'orbital' | 'crystal'
  const [orbitalBlock, setOrbitalBlock] = useState(element?.block || 's');
  const [paused, setPaused] = useState(false);
  const [webglFailed, setWebglFailed] = useState(false);

  const pausedRef = useRef(false);
  pausedRef.current = paused;

  useEffect(() => {
    setOrbitalBlock(element?.block || 's');
  }, [element?.atomicNumber, element?.block]);

  const shells = shellsOfConfig(element?.electronConfiguration || '');

  useEffect(() => {
    const container = mountRef.current;
    if (!container || !element) return undefined;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch {
      setWebglFailed(true);
      return undefined;
    }

    setWebglFailed(false);
    const width = container.clientWidth || 300;
    const height = container.clientHeight || 250;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0.4, 6.4);

    // Ánh sáng studio 3 chiều
    scene.add(new THREE.AmbientLight(0xffffff, 0.72));
    const keyLight = new THREE.DirectionalLight(0xe0f2fe, 1.45);
    keyLight.position.set(5, 6, 7);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x818cf8, 0.9);
    rimLight.position.set(-6, -4, -5);
    scene.add(rimLight);

    const built =
      mode === 'orbital'
        ? buildOrbitalCloudGroup(orbitalBlock)
        : mode === 'crystal'
          ? buildCrystalGroup(element)
          : buildBohrGroup(element, shells);

    const stage = built.root;
    scene.add(stage);

    // Kéo chuột xoay 360° & cuộn zoom mượt mà
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let rotX = 0.25;
    let rotY = 0.35;
    let zoomZ = 6.4;

    const onDown = (ev) => {
      dragging = true;
      const pt = ev.touches ? ev.touches[0] : ev;
      lastX = pt.clientX;
      lastY = pt.clientY;
    };
    const onMove = (ev) => {
      if (!dragging) return;
      const pt = ev.touches ? ev.touches[0] : ev;
      rotY += (pt.clientX - lastX) * 0.011;
      rotX += (pt.clientY - lastY) * 0.011;
      rotX = Math.max(-1.45, Math.min(1.45, rotX));
      lastX = pt.clientX;
      lastY = pt.clientY;
    };
    const onUp = () => { dragging = false; };
    const onWheel = (ev) => {
      ev.preventDefault();
      zoomZ = Math.max(3.6, Math.min(10.5, zoomZ + ev.deltaY * 0.004));
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onDown);
    dom.addEventListener('touchstart', onDown, { passive: true });
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || 300;
      const h = container.clientHeight || 250;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    let rafId = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      if (!pausedRef.current) {
        if (!dragging) rotY += dt * 0.38;
        built.animItems.forEach((item) => {
          item.obj.rotation.z += dt * item.speed;
        });
      }
      stage.rotation.x += (rotX - stage.rotation.x) * 0.14;
      stage.rotation.y += (rotY - stage.rotation.y) * 0.14;
      camera.position.z += (zoomZ - camera.position.z) * 0.14;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      dom.removeEventListener('mousedown', onDown);
      dom.removeEventListener('touchstart', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchend', onUp);
      dom.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);
      if (built.extraDisposables) {
        built.extraDisposables.forEach((d) => d.dispose?.());
      }
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [element?.atomicNumber, mode, orbitalBlock]);

  return (
    <div className="a3d-wrap">
      <div className="a3d-mode-bar" role="tablist" aria-label="Chế độ mô phỏng 3D">
        <button type="button" className={`a3d-tab ${mode === 'bohr' ? 'is-on' : ''}`} onClick={() => setMode('bohr')}>
          Nguyên tử 3D
        </button>
        <button type="button" className={`a3d-tab ${mode === 'orbital' ? 'is-on' : ''}`} onClick={() => setMode('orbital')}>
          Obitan {orbitalBlock}
        </button>
        <button type="button" className={`a3d-tab ${mode === 'crystal' ? 'is-on' : ''}`} onClick={() => setMode('crystal')}>
          Tinh thể 3D
        </button>
      </div>

      <div className="a3d-stage">
        {webglFailed ? (
          <div className="a3d-fallback">
            <span>Trình duyệt chưa hỗ trợ WebGL 3D — đang hiển thị vỏ electron: {shells.join(' · ')}</span>
          </div>
        ) : (
          <div ref={mountRef} className="a3d-canvas-host" title="Kéo chuột để xoay 360°, cuộn để thu phóng" />
        )}

        <div className="a3d-overlay-top">
          <span className="a3d-badge">
            {mode === 'bohr'
              ? `Bohr 3D · ${shells.length} lớp vỏ`
              : mode === 'orbital'
                ? `Đám mây xác suất obitan ${orbitalBlock}`
                : CRYSTAL_LABELS[element?.crystal] || 'Mạng tinh thể 3D'}
          </span>
          <button
            type="button"
            className="a3d-ctrl-btn"
            onClick={() => setPaused((p) => !p)}
            title={paused ? 'Tiếp tục xoay' : 'Tạm dừng'}
          >
            {paused ? 'Phát' : 'Dừng'}
          </button>
        </div>

        <div className="a3d-overlay-foot">
          {mode === 'orbital' ? (
            <div className="a3d-orb-pills">
              {['s', 'p', 'd', 'f'].map((b) => (
                <button
                  key={b}
                  type="button"
                  className={`a3d-orb-btn ${orbitalBlock === b ? 'is-on' : ''}`}
                  onClick={() => setOrbitalBlock(b)}
                >
                  Khối {b}
                </button>
              ))}
            </div>
          ) : (
            <span className="a3d-drag-hint">Kéo xoay 360° · Cuộn để phóng to</span>
          )}
        </div>
      </div>

      {/* Thanh tóm tắt các lớp vỏ K L M N O P Q */}
      <div className="emb-pills">
        {shells.map((c, i) => (
          <span key={i} className={`emb-pill ${i === shells.length - 1 ? 'is-valence' : ''}`}>
            <b>{SHELL_NAMES[i]}</b>{c}
          </span>
        ))}
      </div>
    </div>
  );
}
