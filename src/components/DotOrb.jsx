import { useEffect, useRef } from 'react';

/* Quả cầu chấm xanh xoay chậm, bề mặt lượn sóng — không cần thư viện. */
const N = 1800;

export default function DotOrb({ className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return undefined;
    const ctx = cv.getContext('2d');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Các điểm phân bố đều trên mặt cầu (Fibonacci)
    const pts = Array.from({ length: N }, (_, i) => {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = Math.PI * (3 - Math.sqrt(5)) * i;
      return [Math.cos(th) * r, y, Math.sin(th) * r];
    });

    let size = 0;
    let raf = 0;
    let visible = true;

    const fit = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      size = cv.clientWidth;
      cv.width = cv.height = Math.round(size * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (t) => {
      ctx.clearRect(0, 0, size, size);
      const R = size * 0.4;
      const a = t * 0.00018;
      const ca = Math.cos(a), sa = Math.sin(a);
      const tilt = 0.35, ct = Math.cos(tilt), st = Math.sin(tilt);

      for (const [x0, y0, z0] of pts) {
        // làm méo nhẹ để bề mặt trông như sóng
        const k = 1
          + 0.16 * Math.sin(x0 * 2.6 + t * 0.0006) * Math.cos(y0 * 2.2 - t * 0.0005)
          + 0.08 * Math.sin(z0 * 3.4 + t * 0.0009);
        const x = x0 * k, y = y0 * k, z = z0 * k;

        const xr = x * ca + z * sa;            // xoay quanh trục Y
        const zr = -x * sa + z * ca;
        const yr = y * ct - zr * st;           // nghiêng quanh trục X
        const zz = y * st + zr * ct;

        const depth = Math.max(0, Math.min(1, (zz + 1.3) / 2.6));
        const alpha = zz > 0 ? 0.35 + depth * 0.65 : 0.12 + depth * 0.3;
        ctx.fillStyle = `rgba(${70 + depth * 60 | 0},${120 + depth * 90 | 0},255,${alpha})`;
        ctx.beginPath();
        ctx.arc(size / 2 + xr * R, size / 2 + yr * R, 0.6 + depth * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const loop = (t) => {
      if (visible) draw(t);
      raf = requestAnimationFrame(loop);
    };

    fit();
    if (reduce) {
      draw(4000);                              // 1 khung tĩnh
    } else {
      raf = requestAnimationFrame(loop);
    }

    const ro = new ResizeObserver(() => { fit(); if (reduce) draw(4000); });
    ro.observe(cv);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(cv);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return <canvas ref={ref} className={'dot-orb ' + className} aria-hidden="true" />;
}
