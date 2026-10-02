import { useEffect, useId, useRef } from 'react';

/* ============================================================
   AIMark.jsx — logo "con mắt" của trợ lý AI (bản viết lại, an toàn cho mobile)

   Vì sao bản cũ bị phình to / lệch trên điện thoại?
   • Con ngươi bị dịch chuyển bằng tọa độ con trỏ KHÔNG giới hạn.
   • Trên iOS Safari, CSS transform áp lên phần tử con của <svg> tính gốc toạ độ
     theo cả khung nhìn thay vì theo chính phần tử → hình bị phóng/lệch.
   Bản này:
   • Chỉ dùng thuộc tính transform của SVG (không dùng CSS transform).
   • Độ lệch ngươi luôn bị kẹp ≤ MAX px trong hệ toạ độ viewBox.
   • Màn hình cảm ứng: không bám theo ngón tay, chỉ liếc ngẫu nhiên nhẹ.
   • Tôn trọng prefers-reduced-motion.
   • Mọi nét đều nằm gọn trong viewBox 620×500 nên overflow:hidden không cắt mất gì.

   Props giữ nguyên như bản cũ:
   size (px chiều rộng) · mode 'idle' | 'think' | 'talk' · look · animate · className
   ============================================================ */

const VB_W = 620;
const VB_H = 500;
const CX = 330;
const CY = 285;
const MAX = 20; // độ lệch tối đa của con ngươi

export default function AIMark({
  size = 64,
  mode = 'idle',
  look = false,
  animate = true,
  className = '',
  style,
  ...rest
}) {
  const uid = useId().replace(/:/g, '');
  const svgRef = useRef(null);
  const pupilRef = useRef(null);

  /* ---------- Theo dõi con trỏ (chỉ desktop) / liếc ngẫu nhiên (cảm ứng) ---------- */
  useEffect(() => {
    if (!look || !animate || typeof window === 'undefined') return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;

    const coarse = window.matchMedia?.('(pointer: coarse)').matches;
    const cur = { x: 0, y: 0 };
    const tgt = { x: 0, y: 0 };
    let raf = 0;
    let timer = 0;

    const paint = () => {
      raf = 0;
      cur.x += (tgt.x - cur.x) * 0.22;
      cur.y += (tgt.y - cur.y) * 0.22;
      const el = pupilRef.current;
      if (el) el.setAttribute('transform', `translate(${cur.x.toFixed(2)} ${cur.y.toFixed(2)})`);
      if (Math.abs(tgt.x - cur.x) > 0.05 || Math.abs(tgt.y - cur.y) > 0.05) raf = requestAnimationFrame(paint);
    };
    const aim = (x, y) => {
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      const d = Math.hypot(x, y) || 1;
      const s = Math.min(d, MAX) / d; // kẹp độ dài vector ≤ MAX
      tgt.x = x * s;
      tgt.y = y * s;
      if (!raf) raf = requestAnimationFrame(paint);
    };

    const onMove = (e) => {
      const svg = svgRef.current;
      if (!svg) return;
      const r = svg.getBoundingClientRect();
      if (r.width < 2) return;
      const dx = e.clientX - (r.left + (r.width * CX) / VB_W);
      const dy = e.clientY - (r.top + (r.height * CY) / VB_H);
      const d = Math.hypot(dx, dy) || 1;
      const f = Math.min(1, d / 260) * MAX; // càng xa càng lệch, tối đa MAX
      aim((dx / d) * f, (dy / d) * f);
    };

    if (!coarse) {
      window.addEventListener('pointermove', onMove, { passive: true });
    } else {
      timer = window.setInterval(() => {
        aim((Math.random() - 0.5) * 2 * 14, (Math.random() - 0.5) * 2 * 9);
      }, 2600);
    }
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.clearInterval(timer);
      cancelAnimationFrame(raf);
    };
  }, [look, animate]);

  /* ---------- Hoạt ảnh SVG (SMIL) — hoạt động tốt trên Safari/Chrome ---------- */
  const fast = mode === 'talk';
  const busy = mode === 'think' || fast;
  const pulseDur = fast ? '.55s' : '1.2s';

  const h = Math.round((size * VB_H) / VB_W);

  return (
    <svg
      ref={svgRef}
      className={`ai-mark${look ? ' look' : ''}${className ? ' ' + className : ''}`}
      width={size}
      height={h}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Trợ lý AI"
      style={{ overflow: 'hidden', ...style }}
      {...rest}
    >
      <defs>
        <radialGradient id={`${uid}-iris`} cx="40%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#7aa7ff" />
          <stop offset="55%" stopColor="#2f6bff" />
          <stop offset="100%" stopColor="#1f45d6" />
        </radialGradient>
      </defs>

      {/* Quầng sáng nhẹ phía sau */}
      <circle cx={CX} cy={CY} r="190" style={{ fill: 'var(--acc, #2f6bff)' }} opacity=".08">
        {animate && (
          <animate attributeName="opacity" values=".05;.14;.05" dur={busy ? '1.6s' : '4.5s'} repeatCount="indefinite" />
        )}
      </circle>

      {/* Xúc tu: nhóm xoay nhẹ quanh thân (rotate quanh tâm bằng SMIL, không dùng CSS) */}
      <g fill="none" stroke="currentColor" strokeLinecap="round">
        {animate && (
          <animateTransform
            attributeName="transform"
            type="rotate"
            values={`0 ${CX} ${CY};2.5 ${CX} ${CY};0 ${CX} ${CY};-2.5 ${CX} ${CY};0 ${CX} ${CY}`}
            dur={busy ? '3s' : '7s'}
            repeatCount="indefinite"
          />
        )}
        <path d="M252 214C222 176 190 150 158 130" strokeWidth="24" />
        <circle cx="128" cy="112" r="40" strokeWidth="26" />

        <path d="M420 205C456 176 486 160 516 142" strokeWidth="20" />
        <circle cx="543" cy="128" r="26" strokeWidth="18" />

        <path d="M246 356C208 384 176 400 146 414" strokeWidth="20" />
        <circle cx="122" cy="426" r="28" strokeWidth="18" />
      </g>

      {/* Thân: vòng tròn dày */}
      <circle cx={CX} cy={CY} r="125" fill="none" stroke="currentColor" strokeWidth="58" />

      {/* Tròng mắt (nhấp nháy / đập nhịp theo trạng thái) */}
      <ellipse cx={CX} cy={CY} rx="66" ry="66" fill={`url(#${uid}-iris)`}>
        {animate && !busy && (
          <animate
            attributeName="ry"
            values="66;66;66;5;66;66"
            keyTimes="0;.62;.66;.69;.72;1"
            dur="5.6s"
            repeatCount="indefinite"
          />
        )}
        {animate && busy && (
          <>
            <animate attributeName="rx" values="62;70;62" dur={pulseDur} repeatCount="indefinite" />
            <animate attributeName="ry" values="62;70;62" dur={pulseDur} repeatCount="indefinite" />
          </>
        )}
      </ellipse>

      {/* Con ngươi — chỉ phần này di chuyển (đã kẹp ≤ MAX) */}
      <g ref={pupilRef}>
        <circle cx={CX} cy={CY} r="26" fill="#0b1020" />
        <circle cx={CX - 12} cy={CY - 14} r="9" fill="#fff" opacity=".92" />
      </g>
    </svg>
  );
}