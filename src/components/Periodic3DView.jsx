/* ============================================================
   Periodic3DView.jsx — Bảng Tuần Hoàn Không Gian 3D (Sphere / Helix / Grid / Table)
   Lấy cảm hứng từ Three.js css3d_periodictable trên GitHub, tối ưu mượt 60fps bằng GPU 3D
   - Kéo chuột xoay 360° mọi hướng, cuộn phóng to/thu nhỏ, tự động xoay
   - Bấm vào bất kỳ nguyên tố nào trong không gian 3D để mở phòng thí nghiệm chi tiết 3D + AI
   ============================================================ */

import { useEffect, useMemo, useRef, useState } from 'react';
import { ELEMENTS } from '../data/elements.js';

const LAYOUTS = [
  { id: 'sphere', label: 'Hình cầu 3D' },
  { id: 'helix', label: 'Xoắn ốc Helix' },
  { id: 'grid', label: 'Lập thể 3D' },
  { id: 'table', label: 'Bảng nổi 3D' },
];

function computeTransform(el, idx, layout) {
  const total = ELEMENTS.length;
  if (layout === 'table') {
    const x = (el.col - 10.5) * 66;
    const y = (el.row - 6.2) * 76;
    return `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0px)`;
  }

  if (layout === 'sphere') {
    const radius = 340;
    const phi = Math.acos(-1 + (2 * idx) / total);
    const theta = Math.sqrt(total * Math.PI) * phi;
    const rotY = (theta * 180) / Math.PI;
    const rotX = 90 - (phi * 180) / Math.PI;
    return `rotateY(${rotY.toFixed(1)}deg) rotateX(${rotX.toFixed(1)}deg) translateZ(${radius}px)`;
  }

  if (layout === 'helix') {
    const radius = 360;
    const theta = idx * 14.5; // độ
    const y = (idx - total / 2) * 6.2;
    return `rotateY(${theta.toFixed(1)}deg) translateY(${y.toFixed(1)}px) translateZ(${radius}px)`;
  }

  // grid: 6 cột x 5 hàng x 4 lớp chiều sâu
  const col = idx % 6;
  const row = Math.floor(idx / 6) % 5;
  const depth = Math.floor(idx / 30);
  const x = (col - 2.5) * 110;
  const y = (row - 2) * 105;
  const z = (depth - 1.5) * 165;
  return `translate3d(${x}px, ${y}px, ${z}px)`;
}

export default function Periodic3DView({ matches, onSelect }) {
  const [layout, setLayout] = useState('sphere');
  const [autoSpin, setAutoSpin] = useState(true);
  const [rot, setRot] = useState({ x: -12, y: 20 });
  const [scale, setScale] = useState(1);
  const [hovered, setHovered] = useState(null);

  const dragRef = useRef({ active: false, x: 0, y: 0, moved: false });

  useEffect(() => {
    if (!autoSpin) return undefined;
    let raf = 0;
    let last = performance.now();
    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!dragRef.current.active) {
        setRot((r) => ({ ...r, y: r.y + dt * 14 }));
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [autoSpin]);

  const items = useMemo(
    () =>
      ELEMENTS.map((el, idx) => ({
        el,
        transform: computeTransform(el, idx, layout),
      })),
    [layout]
  );

  const onPointerDown = (ev) => {
    dragRef.current = { active: true, x: ev.clientX, y: ev.clientY, moved: false };
  };

  const onPointerMove = (ev) => {
    if (!dragRef.current.active) return;
    const dx = ev.clientX - dragRef.current.x;
    const dy = ev.clientY - dragRef.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragRef.current.moved = true;
    dragRef.current.x = ev.clientX;
    dragRef.current.y = ev.clientY;
    setRot((r) => ({
      x: Math.max(-75, Math.min(75, r.x - dy * 0.35)),
      y: r.y + dx * 0.42,
    }));
  };

  const onPointerUp = () => {
    dragRef.current.active = false;
  };

  return (
    <div className="p3d-shell">
      <div className="p3d-toolbar">
        <div className="p3d-layouts" role="tablist" aria-label="Bố cục không gian 3D">
          {LAYOUTS.map((l) => (
            <button
              key={l.id}
              type="button"
              className={`p3d-btn ${layout === l.id ? 'is-on' : ''}`}
              onClick={() => {
                setLayout(l.id);
                if (l.id === 'table') {
                  setRot({ x: -8, y: 0 });
                  setAutoSpin(false);
                }
              }}
            >
              {l.label}
            </button>
          ))}
        </div>

        <div className="p3d-right-ctrls">
          <button
            type="button"
            className={`p3d-btn ${autoSpin ? 'is-on' : ''}`}
            onClick={() => setAutoSpin((s) => !s)}
          >
            {autoSpin ? 'Đang tự xoay' : 'Tự xoay 3D'}
          </button>
          <div className="p3d-zoom">
            <button type="button" onClick={() => setScale((s) => Math.max(0.55, +(s - 0.12).toFixed(2)))}>-</button>
            <span>{Math.round(scale * 100)}%</span>
            <button type="button" onClick={() => setScale((s) => Math.min(1.5, +(s + 0.12).toFixed(2)))}>+</button>
          </div>
        </div>
      </div>

      <div
        className={`p3d-viewport layout-${layout}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onWheel={(e) => {
          e.preventDefault();
          setScale((s) => Math.max(0.55, Math.min(1.5, +(s - e.deltaY * 0.0008).toFixed(2))));
        }}
      >
        <div
          className="p3d-world"
          style={{
            transform: `scale(${scale}) rotateX(${rot.x.toFixed(1)}deg) rotateY(${rot.y.toFixed(1)}deg)`,
          }}
        >
          {items.map(({ el, transform }) => {
            const on = !matches || matches.has(el.atomicNumber);
            return (
              <button
                key={el.atomicNumber}
                type="button"
                className={`p3d-tile ${on ? '' : 'is-dim'}`}
                style={{
                  '--tile-cat': `var(--${el.category})`,
                  transform,
                }}
                onMouseEnter={() => setHovered(el)}
                onClick={(ev) => {
                  if (dragRef.current.moved) return;
                  onSelect(el, ev);
                }}
              >
                <span className="p3d-z">{el.atomicNumber}</span>
                <strong className="p3d-sym">{el.symbol}</strong>
                <span className="p3d-name">{el.name}</span>
              </button>
            );
          })}
        </div>

        {/* Thẻ xem nhanh nguyên tố đang trỏ chuột trong không gian 3D */}
        <div className="p3d-hud-bottom">
          {hovered ? (
            <div className="p3d-hover-card">
              {hovered.image && <img src={hovered.image} alt={hovered.name} className="p3d-hover-img" />}
              <div>
                <strong>{hovered.symbol} — {hovered.name} (Z={hovered.atomicNumber})</strong>
                <span>{hovered.shortConfiguration} · {hovered.atomicMass} u · Khối {hovered.block}</span>
              </div>
            </div>
          ) : (
            <span className="p3d-hint">Kéo chuột xoay 360° không gian 3D · Bấm vào bất kỳ nguyên tố nào để xem mô hình 3D &amp; AI</span>
          )}
        </div>
      </div>
    </div>
  );
}
