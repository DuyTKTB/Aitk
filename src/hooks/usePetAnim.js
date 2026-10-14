/* ============================================================
   usePetAnim — nhịp animation + chớp mắt dùng chung cho các skin
   - ~30fps thay vì 60fps
   - dừng khi tab bị ẩn
   - tắt hẳn khi người dùng bật "giảm chuyển động"
   ============================================================ */
import { useEffect, useState } from 'react';

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  !!window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function usePetAnim({ mood = 'normal', paused = false } = {}) {
  const [time, setTime] = useState(0);
  const [blink, setBlink] = useState(false);
  const reduced = prefersReduced();

  /* Nhịp thời gian */
  useEffect(() => {
    if (reduced || paused) return undefined;
    let raf;
    let last = 0;
    const start = performance.now();
    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      if (document.hidden) return;
      if (now - last < 33) return; // ~30fps
      last = now;
      setTime((now - start) / 1000);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced, paused]);

  /* Chớp mắt */
  useEffect(() => {
    if (reduced || paused || mood === 'hibernating' || mood === 'sleepy') return undefined;
    let t1;
    let t2;
    const schedule = () => {
      t1 = setTimeout(() => {
        setBlink(true);
        t2 = setTimeout(() => setBlink(false), 160);
        schedule();
      }, 2800 + Math.random() * 3200);
    };
    schedule();
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [mood, reduced, paused]);

  return { time: reduced ? 0 : time, blink };
}

export default usePetAnim;
