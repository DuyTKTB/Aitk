/* ============================================================
   useScrollMotion.js — đặt tại src/lib/useScrollMotion.js
   Lenis (cuộn mượt) + GSAP ScrollTrigger (scrub) cho trang chủ.
   Cài:  npm i gsap lenis

   Markup yêu cầu (Home.jsx đã có sẵn):
     <div class="stack" ref={rootRef}>
       <div class="panel" data-stack [data-glow]>
         <div class="panel-skew"><div class="panel-inner" data-stack-inner> … </div></div>
       </div>
       …
     </div>
   ============================================================ */
import { useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

const mq = (q) => typeof window !== 'undefined' && window.matchMedia(q).matches;

/* [selector, tốc độ, trục]  —  <1 chậm hơn nội dung (nền), >1 nhanh hơn (tiền cảnh) */
const PARALLAX = [
  ['.hero-home-blob-1', 0.3, 'y'],
  ['.hero-home-blob-2', 0.45, 'y'],
  ['.hero-home-blob-3', 0.2, 'y'],
  ['.hero-mascot', 1.08, 'y'],
  ['.fx-marqs .fx-marq:not(.rev)', 0.45, 'x'],
  ['.fx-marqs .fx-marq.rev', 1.55, 'x'],
  ['.fx-quote-mark', 0.5, 'y'],
  ['.cta-mark', 1.12, 'y'],
];

/* Hiện dần + trượt lên theo tiến độ cuộn */
const REVEAL = '.fx-lead, .fx-step, .fx-tool, .stat-card, .fx-quote-tabs, .cta-final .lead, .cta-actions, .manifesto-card';

/* Phần tử có ảnh/khối lớn: mở clip-path theo cuộn */
const CLIP = '.featured-table, .stats-grid, .fx-quote';

/* Phần tử nghiêng 3D theo chuột: [selector, góc tối đa] */
const TILT = [['.fx-tool', 4], ['.fx-tool.big', 3], ['.manifesto-card', 3]];

/* Nút bị "hút" theo con trỏ */
const MAGNETIC = '.btn, .hero-input-send, .fx-tool-cta';

export default function useScrollMotion(rootRef) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    if (mq('(prefers-reduced-motion: reduce)')) return undefined;

    const fine = mq('(hover: hover) and (pointer: fine)');
    const small = mq('(max-width: 720px)');
    const html = document.documentElement;
    const off = []; // dọn dẹp

    html.classList.add('has-stack');
    off.push(() => html.classList.remove('has-stack'));

    /* ---------- 1. Lenis ⇄ ScrollTrigger ---------- */
    const lenis = new Lenis({
      lerp: 0.09,
      smoothWheel: true,
      wheelMultiplier: 0.95,
      allowNestedScroll: true,
    });
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (t) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    off.push(() => { gsap.ticker.remove(tick); lenis.destroy(); });

    const ctx = gsap.context(() => {
      const panels = gsap.utils.toArray('[data-stack]', root);

      /* ---------- 2. Layout sticky: panel cao hơn màn hình sẽ ghim ở ĐÁY ---------- */
      const layout = () => {
        const vh = window.innerHeight;
        panels.forEach((p, i) => {
          const h = p.offsetHeight;
          p.style.zIndex = String(i + 1);
          p.style.top = Math.min(0, vh - h) + 'px';
          const inner = p.querySelector('[data-stack-inner]');
          if (inner) inner.style.transformOrigin = `50% ${h > vh ? h - vh / 2 : h / 2}px`;
        });
      };
      layout();
      ScrollTrigger.addEventListener('refreshInit', layout);
      off.push(() => ScrollTrigger.removeEventListener('refreshInit', layout));

      /* ---------- 3. Stack depth (scrub theo tiến độ panel kế tiếp) ---------- */
      const blur = small ? 0 : 1;
      panels.forEach((p, i) => {
        const inner = p.querySelector('[data-stack-inner]');
        const next = panels[i + 1];
        const after = panels[i + 2];
        if (!inner || !next) return;
        gsap.fromTo(
          inner,
          { scale: 1, y: 0, opacity: 1, filter: 'blur(0px)' },
          {
            scale: 0.96, y: -22, opacity: 0.85, filter: `blur(${blur}px)`, ease: 'none',
            scrollTrigger: { trigger: next, start: 'top bottom', end: 'top top', scrub: true, invalidateOnRefresh: true },
          },
        );
        if (after) {
          gsap.fromTo(
            inner,
            { scale: 0.96, y: -22, opacity: 0.85, filter: `blur(${blur}px)` },
            {
              scale: 0.92, y: -40, opacity: 0.65, filter: `blur(${blur * 3}px)`, ease: 'none', immediateRender: false,
              scrollTrigger: { trigger: after, start: 'top bottom', end: 'top top', scrub: true, invalidateOnRefresh: true },
            },
          );
        }
      });

      /* ---------- 4. Parallax (CSS var → thuộc tính `translate`, không đụng `transform`) ---------- */
      PARALLAX.forEach(([sel, speed, axis]) => {
        root.querySelectorAll(sel).forEach((el) => {
          const panel = el.closest('[data-stack]') || el;
          const first = panel === panels[0];
          const d = (1 - speed) * (axis === 'x' ? 90 : 110);
          const v = axis === 'x' ? '--px' : '--py';
          el.classList.add('sm-p');
          gsap.fromTo(
            el,
            { [v]: `${-d}px` },
            {
              [v]: `${d}px`, ease: 'none',
              scrollTrigger: { trigger: panel, start: first ? 'top top' : 'top bottom', end: 'bottom top', scrub: true },
            },
          );
        });
      });

      /* ---------- 5. Reveal chữ: tiêu đề chạy theo cuộn ---------- */
      root.querySelectorAll('.fx-title .fx-split').forEach((sp) => {
        const words = sp.querySelectorAll('.fx-s');
        if (!words.length) return;
        sp.classList.add('on'); // tắt animation giờ của IntersectionObserver, scrub thay thế
        gsap.fromTo(
          words,
          { yPercent: 105, rotate: 4, opacity: 0 },
          {
            yPercent: 0, rotate: 0, opacity: 1, ease: 'none', stagger: 0.12,
            scrollTrigger: { trigger: sp, start: 'top 92%', end: 'top 58%', scrub: true },
          },
        );
      });

      /* ---------- 6. Reveal khối: lên 50px + hiện dần ---------- */
      root.querySelectorAll(REVEAL).forEach((el) => {
        el.classList.add('sm-r');
        gsap.fromTo(
          el,
          { '--ry': '50px', opacity: 0 },
          {
            '--ry': '0px', opacity: 1, ease: 'none',
            scrollTrigger: { trigger: el, start: 'top 94%', end: 'top 64%', scrub: true },
          },
        );
      });

      /* ---------- 7. Clip-path reveal + scale 1.06 → 1 ---------- */
      root.querySelectorAll(CLIP).forEach((el) => {
        gsap.fromTo(
          el,
          { clipPath: 'inset(60px 40px round 24px)', scale: 1.06, opacity: 0.4 },
          {
            clipPath: 'inset(-60px -60px round 24px)', scale: 1, opacity: 1, ease: 'none',
            scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 55%', scrub: true },
          },
        );
      });

      /* ---------- 8. Velocity skew (rất nhẹ, ≤ 1.2°) ---------- */
      if (!small) {
        const skewers = gsap.utils.toArray('.panel-skew', root).map((el) => gsap.quickTo(el, 'skewY', { duration: 0.6, ease: 'power3.out' }));
        let idle = 0;
        lenis.on('scroll', ({ velocity }) => {
          const s = gsap.utils.clamp(-1.2, 1.2, velocity * -0.05);
          skewers.forEach((f) => f(s));
          clearTimeout(idle);
          idle = setTimeout(() => skewers.forEach((f) => f(0)), 90);
        });
        off.push(() => clearTimeout(idle));
      }

      /* ---------- 9. Tương tác chuột (chỉ desktop có con trỏ) ---------- */
      if (fine) {
        const glows = panels.filter((p) => p.hasAttribute('data-glow'));
        let gRaf = 0;
        let gEvt = null;
        const glowMove = (e) => {
          gEvt = e;
          if (gRaf) return;
          gRaf = requestAnimationFrame(() => {
            gRaf = 0;
            glows.forEach((p) => {
              const r = p.getBoundingClientRect();
              const inside = gEvt.clientY >= r.top && gEvt.clientY <= r.bottom;
              p.classList.toggle('glow-on', inside);
              if (inside) {
                gsap.to(p, { '--gx': gEvt.clientX - r.left + 'px', '--gy': gEvt.clientY - r.top + 'px', duration: 0.6, ease: 'power3.out', overwrite: 'auto' });
              }
            });
          });
        };
        window.addEventListener('pointermove', glowMove, { passive: true });
        off.push(() => { window.removeEventListener('pointermove', glowMove); cancelAnimationFrame(gRaf); });
        TILT.forEach(([sel, max]) => {
          root.querySelectorAll(sel).forEach((el) => {
            gsap.set(el, { transformPerspective: 900 });
            const rx = gsap.quickTo(el, 'rotationX', { duration: 0.5, ease: 'power3.out' });
            const ry = gsap.quickTo(el, 'rotationY', { duration: 0.5, ease: 'power3.out' });
            const move = (e) => {
              const r = el.getBoundingClientRect();
              ry((((e.clientX - r.left) / r.width) - 0.5) * 2 * max);
              rx(-(((e.clientY - r.top) / r.height) - 0.5) * 2 * max);
            };
            const leave = () => { rx(0); ry(0); };
            el.addEventListener('pointermove', move);
            el.addEventListener('pointerleave', leave);
            off.push(() => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); });
          });
        });
        const mags = [...root.querySelectorAll(MAGNETIC)];
        mags.forEach((m) => m.classList.add('sm-m'));
        let mRaf = 0;
        let mEvt = null;
        const magMove = (e) => {
          mEvt = e;
          if (mRaf) return;
          mRaf = requestAnimationFrame(() => {
            mRaf = 0;
            mags.forEach((m) => {
              const r = m.getBoundingClientRect();
              const dx = mEvt.clientX - (r.left + r.width / 2);
              const dy = mEvt.clientY - (r.top + r.height / 2);
              const near = Math.abs(dx) < r.width / 2 + 70 && Math.abs(dy) < r.height / 2 + 70;
              gsap.to(m, { '--mgx': near ? dx * 0.28 + 'px' : '0px', '--mgy': near ? dy * 0.28 + 'px' : '0px', duration: near ? 0.35 : 0.6, ease: near ? 'power3.out' : 'elastic.out(1, 0.5)', overwrite: 'auto' });
            });
          });
        };
        window.addEventListener('pointermove', magMove, { passive: true });
        off.push(() => { window.removeEventListener('pointermove', magMove); cancelAnimationFrame(mRaf); });
      }

      /* ---------- 10. Đo lại khi layout đổi (font, bảng tuần hoàn, resize) ---------- */
      let rt = 0;
      const refresh = () => { clearTimeout(rt); rt = setTimeout(() => ScrollTrigger.refresh(), 160); };
      const ro = new ResizeObserver(refresh);
      panels.forEach((p) => ro.observe(p));
      document.fonts?.ready?.then(refresh);
      off.push(() => { clearTimeout(rt); ro.disconnect(); });
    }, root);

    off.push(() => ctx.revert());
    return () => { for (let i = off.length - 1; i >= 0; i--) off[i](); };
  }, [rootRef]);
}
