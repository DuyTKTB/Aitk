import { useEffect, useState } from 'react';

/* ============================================================
   useLandingFx.js — hiệu ứng chuột + hiệu ứng xuất hiện cho Landing
   - Con trỏ vòng tròn (ring) + chấm (dot) + quầng sáng aurora theo chuột
   - Ring phóng to trên link/nút, hiện nhãn khi phần tử có data-cursor="..."
   - Spotlight theo chuột + viền sáng trên thẻ (bento, FAQ, tính năng...)
   - Nghiêng 3D (tilt) cho phần tử có data-tilt
   - Ripple khi bấm nút .lp-btn
   - Nút nổi (.lp-fab, .lp-ico) hút nhẹ về phía chuột
   - Thẻ xuất hiện lần lượt khi cuộn tới (stagger), bay lên/xuống theo chiều lăn
   - Hiệu ứng lăn chuột: parallax chiều sâu, thẻ lệch theo tốc độ, vòng con trỏ giãn + mũi tên ↓/↑, ảnh mở dần
   Chỉ bật trên thiết bị có chuột (pointer: fine) và khi không bật
   "giảm chuyển động". Con trỏ hệ thống vẫn giữ nguyên.
   ============================================================ */

const CARD = '.bt, .lm-item, .lp-faq-item, .lm-trust > div, .lm-shot-frame, .lp-vpoints li';
const LINKISH = 'a, button, [role="tab"], label, summary, input, textarea, select';
const MAG = '.lp-fab, .lp-ico, .lp-expand';
const CLIP = '.lm-shot-frame';
const PAR = [['.lm-shot', 0.07], ['.lm-head', -0.04], ['.lm-ring-wrap', 0.06], ['.lm-live-wrap', 0.05], ['.lm-career-copy', -0.05]];
const REVEAL = '.bt, .lm-trust > div, .lm-steps-v li, .lp-vpoints li, .lp-stats > div';

const mq = (q) => typeof window !== 'undefined' && window.matchMedia(q).matches;

function mk(cls, parent) {
  const el = document.createElement('div');
  el.className = cls;
  el.setAttribute('aria-hidden', 'true');
  parent.appendChild(el);
  return el;
}

export function useLandingFx(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const reduced = mq('(prefers-reduced-motion: reduce)');
    const fine = mq('(pointer: fine)') && mq('(hover: hover)');
    const cleanups = [];

    /* ---------- 1. Xuất hiện lần lượt khi cuộn ---------- */
    if (!reduced && 'IntersectionObserver' in window) {
      const items = Array.from(root.querySelectorAll(REVEAL));
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add('fx-in'); io.unobserve(e.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
      items.forEach((el) => {
        const sibs = Array.from(el.parentElement.children).filter((c) => c.matches(REVEAL));
        el.style.setProperty('--i', String(Math.max(0, sibs.indexOf(el))));
        el.classList.add('fx-rv');
        io.observe(el);
      });
      cleanups.push(() => io.disconnect());
    }

    /* ---------- 1b. Hiệu ứng khi lăn chuột: hướng cuộn, parallax, vận tốc ---------- */
    if (!reduced) {
      if ('IntersectionObserver' in window) {
        const io2 = new IntersectionObserver((entries) => {
          entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('fx-in'); io2.unobserve(e.target); } });
        }, { threshold: 0.2 });
        root.querySelectorAll(CLIP).forEach((el) => { el.classList.add('fx-clip'); io2.observe(el); });
        cleanups.push(() => io2.disconnect());
      }
      const pars = [];
      PAR.forEach(([sel, k]) => root.querySelectorAll(sel).forEach((el) => { el.classList.add('fx-par'); pars.push([el, k]); }));
      let lastY = window.scrollY, sv = 0, sraf = 0, idle = 0;
      const sloop = () => {
        sraf = 0;
        const y = window.scrollY, vh = window.innerHeight;
        const d = y - lastY; lastY = y;
        if (Math.abs(d) > 0.5) root.dataset.dir = d > 0 ? 'down' : 'up';
        sv += (d - sv) * 0.2;
        const wv = Math.max(-1, Math.min(1, sv / 40));
        root.style.setProperty('--wv', Math.abs(wv).toFixed(3));
        pars.forEach(([el, k]) => {
          const r = el.getBoundingClientRect();
          if (r.bottom < -200 || r.top > vh + 200) return;
          const off = (r.top + r.height / 2 - vh / 2) * -k;
          el.style.setProperty('--shift', Math.max(-60, Math.min(60, off)).toFixed(1) + 'px');
        });
        const ring = root.querySelector('.fx-ring');
        if (ring) {
          const on = Math.abs(sv) > 2;
          ring.classList.toggle('is-scroll', on);
          if (on) ring.setAttribute('data-d', sv > 0 ? '↓' : '↑');
        }
        if (Math.abs(sv) > 0.15) sraf = requestAnimationFrame(sloop);
        else root.style.setProperty('--wv', '0');
      };
      const onScrollFx = () => { if (!sraf) sraf = requestAnimationFrame(sloop); };
      window.addEventListener('scroll', onScrollFx, { passive: true });
      onScrollFx();
      cleanups.push(() => {
        window.removeEventListener('scroll', onScrollFx);
        if (sraf) cancelAnimationFrame(sraf);
        pars.forEach(([el]) => { el.classList.remove('fx-par'); el.style.removeProperty('--shift'); });
        root.querySelectorAll('.fx-clip').forEach((el) => el.classList.remove('fx-clip'));
      });
    }

    if (!fine || reduced) return () => cleanups.forEach((f) => f());

    /* ---------- 2. Con trỏ ---------- */
    const glow = mk('lp-cursor', root);
    const ring = mk('fx-ring', root);
    const dot = mk('fx-dot', root);
    const label = document.createElement('span');
    ring.appendChild(label);

    let tx = -200, ty = -200, rx = tx, ry = ty, gx = tx, gy = ty, raf = 0, seen = false;

    const loop = () => {
      raf = 0;
      rx += (tx - rx) * 0.2; ry += (ty - ry) * 0.2;
      gx += (tx - gx) * 0.07; gy += (ty - gy) * 0.07;
      ring.style.transform = `translate3d(${rx.toFixed(1)}px,${ry.toFixed(1)}px,0)`;
      glow.style.transform = `translate3d(${gx.toFixed(1)}px,${gy.toFixed(1)}px,0)`;
      if (Math.abs(tx - rx) > 0.15 || Math.abs(ty - ry) > 0.15 || Math.abs(tx - gx) > 0.15 || Math.abs(ty - gy) > 0.15) {
        raf = requestAnimationFrame(loop);
      }
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };

    const setState = (target) => {
      const lab = target && target.closest && target.closest('[data-cursor]');
      const link = target && target.closest && target.closest(LINKISH);
      const text = lab ? lab.getAttribute('data-cursor') : '';
      if (label.textContent !== text) label.textContent = text;
      ring.classList.toggle('has-label', !!text);
      ring.classList.toggle('is-link', !!link && !text);
      const field = target && target.closest && target.closest('input, textarea');
      ring.classList.toggle('is-text', !!field);
    };

    /* ---------- 3. Spotlight, tilt, hút nam châm ---------- */
    let lastCard = null;
    const ensureGlow = (card) => {
      if (card.__fx) return;
      card.__fx = true;
      card.classList.add('fx-card');
      const g = mk('fx-glow', card);
      g.style.cssText = 'position:absolute;inset:0;pointer-events:none'; /* an toàn kể cả khi CSS chưa nạp: không chiếm ô grid/flex */
      card.prepend(g); /* đứng đầu để không phá các selector :last-child có sẵn */
    };

    const onMove = (e) => {
      tx = e.clientX; ty = e.clientY;
      dot.style.transform = `translate3d(${tx}px,${ty}px,0)`;
      if (!seen) { seen = true; rx = gx = tx; ry = gy = ty; root.classList.add('fx-on'); }
      kick();

      const t = e.target;
      setState(t);

      const card = t.closest ? t.closest(CARD) : null;
      if (lastCard && lastCard !== card) resetTilt(lastCard);
      lastCard = card;
      if (card) {
        ensureGlow(card);
        const r = card.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        card.style.setProperty('--sx', x.toFixed(0) + 'px');
        card.style.setProperty('--sy', y.toFixed(0) + 'px');
        if (card.hasAttribute('data-tilt')) {
          const k = Number(card.getAttribute('data-tilt')) || 5;
          card.style.setProperty('--try', (((x / r.width) - 0.5) * 2 * k).toFixed(2) + 'deg');
          card.style.setProperty('--trx', (((y / r.height) - 0.5) * -2 * k).toFixed(2) + 'deg');
        }
      }

      const mag = t.closest ? t.closest(MAG) : null;
      if (mag) {
        const r = mag.getBoundingClientRect();
        mag.style.setProperty('--fmx', ((e.clientX - (r.left + r.width / 2)) * 0.25).toFixed(1) + 'px');
        mag.style.setProperty('--fmy', ((e.clientY - (r.top + r.height / 2)) * 0.25).toFixed(1) + 'px');
        mag.__mag = true;
      }
      if (root.__lastMag && root.__lastMag !== mag) {
        root.__lastMag.style.removeProperty('--fmx'); root.__lastMag.style.removeProperty('--fmy');
      }
      root.__lastMag = mag;

      ring.classList.toggle('is-hidden', !!document.querySelector('dialog[open]'));
    };

    function resetTilt(card) {
      card.style.removeProperty('--trx');
      card.style.removeProperty('--try');
    }

    const onDown = (e) => {
      ring.classList.add('is-down');
      const b = e.target.closest ? e.target.closest('.lp-btn') : null;
      if (b) {
        const r = b.getBoundingClientRect();
        const s = document.createElement('span');
        s.className = 'fx-ripple';
        const d = Math.max(r.width, r.height) * 2;
        s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
        b.appendChild(s);
        setTimeout(() => s.remove(), 700);
      }
    };
    const onUp = () => ring.classList.remove('is-down');
    const onLeave = () => { root.classList.remove('fx-on'); seen = false; if (lastCard) resetTilt(lastCard); };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);

    cleanups.push(() => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      if (raf) cancelAnimationFrame(raf);
      [glow, ring, dot].forEach((n) => n.remove());
      root.querySelectorAll('.fx-glow').forEach((n) => { n.parentElement.__fx = false; n.remove(); });
      root.classList.remove('fx-on');
    });

    return () => cleanups.forEach((f) => f());
  }, [rootRef]);
}

/* ============================================================
   Scrollspy: trả về id mục đang xem để tô sáng menu
   ============================================================ */
export function useScrollSpy(ids) {
  const [active, setActive] = useState('');
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return undefined;
    const seen = new Map();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => seen.set(e.target.id, e.isIntersecting));
      const hit = ids.find((id) => seen.get(id));
      setActive(hit || '');
    }, { rootMargin: '-40% 0px -55% 0px' });
    ids.forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, [ids]);
  return active;
}