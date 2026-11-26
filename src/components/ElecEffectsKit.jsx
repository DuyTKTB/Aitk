import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import './elec-effects.css';

/* ==========================================================================
   1. AQUARIUM / LENS THEME TOGGLE (Dark/Light switch)
   ========================================================================== */
export function AquariumThemeToggle({ theme = 'dark', onToggle, className = '' }) {
  const isLight = theme === 'light';
  return (
    <button
      type="button"
      className={`efx-aqua-toggle ${isLight ? 'is-light' : 'is-dark'} ${className}`.trim()}
      onClick={onToggle}
      role="switch"
      aria-checked={!isLight}
      aria-label={isLight ? 'Chuyển sang giao diện tối' : 'Chuyển sang giao diện sáng'}
      title={isLight ? 'Chuyển sang giao diện tối' : 'Chuyển sang giao diện sáng'}
    >
      <span className="efx-aqua-scene" aria-hidden="true">
        <span className="efx-aqua-star s1" />
        <span className="efx-aqua-star s2" />
        <span className="efx-aqua-star s3" />
        <span className="efx-aqua-cloud" />
        <span className="efx-aqua-water" />
        <span className="efx-aqua-bubble b1" />
        <span className="efx-aqua-bubble b2" />
      </span>
      <span className="efx-aqua-knob" aria-hidden="true">
        {isLight ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2.4" strokeLinecap="round">
            <circle cx="12" cy="12" r="4.5" fill="#fef08a" />
            <path d="M12 2.5v2M12 19.5v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2.5 12h2M19.5 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="#1e3a8a" stroke="#0f172a" strokeWidth="1.6">
            <path d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10Z" />
          </svg>
        )}
      </span>
    </button>
  );
}

/* ==========================================================================
   2. SPOTLIGHT NAV BEAM (tracks active tab inside DesktopNav .nav-links)
   ========================================================================== */
export function NavSpotlightBeam({ containerRef, activeKey }) {
  const [beam, setBeam] = useState({ x: 0, w: 0, show: false });

  useLayoutEffect(() => {
    const update = () => {
      const box = containerRef?.current;
      if (!box) return;
      const activeEl = box.querySelector('.nav-item.active');
      if (!activeEl) {
        setBeam((b) => (b.show ? { ...b, show: false } : b));
        return;
      }
      const boxRect = box.getBoundingClientRect();
      const itemRect = activeEl.getBoundingClientRect();
      if (itemRect.width <= 0) {
        setBeam((b) => (b.show ? { ...b, show: false } : b));
        return;
      }
      setBeam({
        x: Math.round(itemRect.left - boxRect.left + 8),
        w: Math.max(24, Math.round(itemRect.width - 16)),
        show: true,
      });
    };

    update();
    const raf = requestAnimationFrame(update);
    window.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', update);
    };
  }, [containerRef, activeKey]);

  return (
    <span
      className="efx-nav-spotlight"
      aria-hidden="true"
      style={{
        transform: `translateX(${beam.x}px)`,
        width: `${beam.w}px`,
        opacity: beam.show ? 1 : 0,
      }}
    />
  );
}

/* ==========================================================================
   3. AI GLOW ORBIT BUTTON + CHARGE PARTICLE GENERATE BUTTON
   ========================================================================== */
export function AiGlowButton({ as = 'button', href, onClick, children, className = '', ...rest }) {
  const Tag = as === 'a' ? 'a' : 'button';
  return (
    <span className={`efx-glow-wrap ${className}`.trim()}>
      <Tag
        className="efx-glow-btn"
        href={Tag === 'a' ? href : undefined}
        type={Tag === 'button' ? (rest.type || 'button') : undefined}
        onClick={onClick}
        {...rest}
      >
        {children}
      </Tag>
    </span>
  );
}

export function ChargeGenerateButton({
  label = 'Hỏi ELEC AI ngay',
  loadingLabel = 'Đang nạp suy luận AI…',
  doneLabel = 'Sẵn sàng mở trợ lý AI ✓',
  onComplete,
}) {
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const hoveredRef = useRef(false);
  const [phase, setPhase] = useState('idle'); // idle | charging | done
  const [pct, setPct] = useState(0);
  const [waves, setWaves] = useState([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let w = 0;
    let h = 0;
    const dots = [];

    const resize = () => {
      const rect = stage.getBoundingClientRect();
      w = Math.max(240, Math.floor(rect.width));
      h = Math.max(160, Math.floor(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      dots.length = 0;
      const gap = 22;
      for (let x = gap / 2; x < w; x += gap) {
        for (let y = gap / 2; y < h; y += gap) {
          dots.push({ ox: x, oy: y, x, y, vx: 0, vy: 0, phase: Math.random() * Math.PI * 2 });
        }
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const draw = (t) => {
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h / 2;
      const pull = hoveredRef.current ? 1 : 0;

      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        const dx = cx - d.ox;
        const dy = cy - d.oy;
        const dist = Math.hypot(dx, dy);
        const radius = 155;

        let tx = d.ox;
        let ty = d.oy;
        let alpha = 0.24;
        let r = 1.45;

        if (pull && dist < radius && dist > 26) {
          const factor = (1 - dist / radius) * 0.42;
          const swirl = Math.sin(t * 0.004 + d.phase) * 5;
          tx = d.ox + dx * factor - (dy / dist) * swirl;
          ty = d.oy + dy * factor + (dx / dist) * swirl;
          alpha = 0.35 + (1 - dist / radius) * 0.6;
          r = 1.6 + (1 - dist / radius) * 1.1;
        }

        d.x += (tx - d.x) * 0.14;
        d.y += (ty - d.y) * 0.14;

        ctx.beginPath();
        ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
        ctx.fillStyle = pull && dist < radius ? `rgba(56, 189, 248, ${alpha})` : `rgba(148, 163, 184, ${alpha})`;
        ctx.fill();
      }

      if (!reduced) raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const trigger = () => {
    if (phase === 'charging') return;
    setPhase('charging');
    setPct(0);
    const id = Date.now();
    setWaves((prev) => [...prev.slice(-2), id]);
    setTimeout(() => setWaves((prev) => prev.filter((k) => k !== id)), 800);

    let p = 0;
    const iv = setInterval(() => {
      p += 12;
      if (p >= 100) {
        clearInterval(iv);
        setPct(100);
        setPhase('done');
        onComplete?.();
        setTimeout(() => {
          setPhase('idle');
          setPct(0);
        }, 1600);
      } else {
        setPct(p);
      }
    }, 65);
  };

  return (
    <div
      className="efx-charge-stage"
      ref={stageRef}
      onMouseEnter={() => { hoveredRef.current = true; }}
      onMouseLeave={() => { hoveredRef.current = false; }}
    >
      <canvas ref={canvasRef} className="efx-charge-canvas" aria-hidden="true" />
      {waves.map((id) => (
        <span key={id} className="efx-charge-shockwave" aria-hidden="true" />
      ))}
      <button
        type="button"
        className={`efx-charge-btn ${phase === 'charging' ? 'is-charging' : ''} ${phase === 'done' ? 'is-done' : ''}`}
        onClick={trigger}
      >
        <span
          className="efx-charge-sweep"
          style={{ transform: `scaleX(${phase === 'idle' ? 0 : pct / 100})` }}
          aria-hidden="true"
        />
        <span style={{ position: 'relative', zIndex: 2, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M13 2 4 14h7l-1 8 10-12h-7l0-8Z" />
          </svg>
          {phase === 'charging' ? `${loadingLabel} ${pct}%` : phase === 'done' ? doneLabel : label}
        </span>
      </button>
    </div>
  );
}

/* ==========================================================================
   4. ARC CHARGE ELECTRIC LOADER (On-brand ELEC plasma lightning progress)
   ========================================================================== */
export function ArcChargeLoader({
  progress = null,
  label = 'ELEC Plasma Engine đang phân tích tài liệu…',
  sublabel = 'Xử lý công thức KaTeX · Bảo toàn nguyên tố · Tạo Flashcard',
  autoLoop = false,
}) {
  const canvasRef = useRef(null);
  const [simPct, setSimPct] = useState(18);

  useEffect(() => {
    if (typeof progress === 'number') return undefined;
    const iv = setInterval(() => {
      setSimPct((p) => {
        if (autoLoop) return p >= 100 ? 8 : p + 2;
        return p >= 94 ? 94 : p + Math.max(1, Math.round((95 - p) * 0.08));
      });
    }, 110);
    return () => clearInterval(iv);
  }, [progress, autoLoop]);

  const pct = typeof progress === 'number' ? Math.max(0, Math.min(100, Math.round(progress))) : simPct;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;

    const getHue = (p) => {
      if (p < 33) return { core: '#fef08a', glow: '#f59e0b' }; // amber
      if (p < 66) return { core: '#bae6fd', glow: '#38bdf8' }; // electric blue
      if (p < 88) return { core: '#ddd6fe', glow: '#8b5cf6' }; // violet
      return { core: '#a7f3d0', glow: '#34d399' }; // mint
    };

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(200, Math.floor(rect.width));
      const h = Math.max(60, Math.floor(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const midY = h / 2;
      const padX = 16;
      const endX = padX + ((w - padX * 2) * pct) / 100;
      const palette = getHue(pct);

      // Base rail
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(padX, midY);
      ctx.lineTo(w - padX, midY);
      ctx.stroke();

      // Dual jagged plasma arcs
      const drawArc = (amp, width, color, blur) => {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.shadowColor = palette.glow;
        ctx.shadowBlur = blur;
        ctx.beginPath();
        ctx.moveTo(padX, midY);
        const segs = Math.max(8, Math.floor((endX - padX) / 14));
        for (let i = 1; i < segs; i++) {
          const x = padX + ((endX - padX) * i) / segs;
          const jitter = reduced ? 0 : (Math.random() - 0.5) * amp;
          ctx.lineTo(x, midY + jitter);
        }
        ctx.lineTo(endX, midY);
        ctx.stroke();
        ctx.restore();
      };

      drawArc(18, 3.2, palette.glow, 16);
      drawArc(9, 1.5, palette.core, 8);

      // Leading plasma head + sparks
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = palette.glow;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(endX, midY, 4.2, 0, Math.PI * 2);
      ctx.fill();
      if (!reduced) {
        for (let s = 0; s < 5; s++) {
          const sx = endX + (Math.random() - 0.5) * 20;
          const sy = midY + (Math.random() - 0.5) * 24;
          ctx.fillStyle = palette.core;
          ctx.fillRect(sx, sy, 2, 2);
        }
      }
      ctx.restore();

      if (!reduced) raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [pct]);

  return (
    <div className="efx-arc-card" role="status" aria-live="polite">
      <div className="efx-arc-head">
        <span className="efx-arc-badge">
          <span className="efx-arc-dot" />
          ELEC ARC CHARGE
        </span>
        <span className="efx-arc-pct">{pct}%</span>
      </div>
      <canvas ref={canvasRef} className="efx-arc-canvas" aria-hidden="true" />
      <div className="efx-arc-sub">
        <span>{label}</span>
        <small style={{ opacity: 0.7 }}>{sublabel}</small>
      </div>
    </div>
  );
}

/* ==========================================================================
   5. PDF PARSE SMART SCANNER (Exam/Document OCR region detection)
   ========================================================================== */
const DEFAULT_PDF_REGIONS = [
  { id: 'r1', tag: 'ĐỀ BÀI', title: 'Câu 18 (THPTQG Vật lí — Dao động)', preview: 'x = 6cos(4πt - π/3) cm. Tìm v_max và a_max?', field: 'Chuyên đề', value: 'Dao động điều hòa · Lớp 11/12', conf: '99.4%' },
  { id: 'r2', tag: 'CÔNG THỨC', title: 'Trích xuất KaTeX tự động', preview: 'v_max = ωA = 24π cm/s · a_max = ω²A', field: 'KaTeX OCR', value: 'v_max = 75.4 cm/s | a_max = 9.47 m/s²', conf: '99.8%' },
  { id: 'r3', tag: 'PTHH', title: 'Phản ứng Oxi hóa – Khử (Hóa 12)', preview: 'Fe + HNO3(loãng) → Fe(NO3)3 + NO↑ + H2O', field: 'Cân bằng Gauss', value: '1 : 4 : 1 : 1 : 2 (Chất khử: Fe)', conf: '100%' },
  { id: 'r4', tag: 'ĐÁP ÁN', title: 'Đánh giá bẫy & Sổ tay SRS', preview: 'Đáp án đúng: B · Độ khó Elo 1520', field: 'Đồng bộ SRS', value: 'Tự tạo 4 Flashcard + 1 Quiz SM-2', conf: '98.9%' },
];

export function PdfParseScanner({ regions = DEFAULT_PDF_REGIONS, compact = false }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [tab, setTab] = useState('fields'); // fields | json
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing) return undefined;
    const iv = setInterval(() => {
      setActiveIdx((i) => (i + 1) % regions.length);
    }, 2100);
    return () => clearInterval(iv);
  }, [playing, regions.length]);

  const laserTop = `${18 + activeIdx * 21}%`;
  const activeRegion = regions[activeIdx] || regions[0];

  const jsonPreview = JSON.stringify(
    {
      engine: 'ELEC-Vision-OCR-v3',
      active_region: activeRegion.tag,
      confidence: activeRegion.conf,
      extracted: regions.reduce((acc, r) => {
        acc[r.field] = r.value;
        return acc;
      }, {}),
    },
    null,
    2
  );

  return (
    <div className="efx-pdf-grid">
      <div className="efx-pdf-sheet">
        <div className="efx-pdf-laser" style={{ top: laserTop }} aria-hidden="true" />
        <div className="efx-pdf-sheet-head">
          <span>DE_THI_THU_KHTN_2026.PDF</span>
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            style={{ border: 0, background: 'rgba(2,132,199,0.12)', color: '#0369a1', borderRadius: 999, padding: '3px 9px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
          >
            {playing ? '● Đang quét' : '▶ Tiếp tục quét'}
          </button>
        </div>

        {regions.map((r, i) => (
          <div
            key={r.id}
            className={`efx-pdf-region ${i === activeIdx ? 'is-active' : i < activeIdx ? 'is-scanned' : ''}`}
            onClick={() => { setActiveIdx(i); setPlaying(false); }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') { setActiveIdx(i); setPlaying(false); } }}
          >
            <span className="efx-pdf-region-tag">{r.tag}</span>
            <strong>{r.title}</strong>
            <small>{r.preview}</small>
          </div>
        ))}
      </div>

      {!compact && (
        <div className="efx-pdf-inspector">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <div className="efx-pdf-tabs">
              <button type="button" className={tab === 'fields' ? 'on' : ''} onClick={() => setTab('fields')}>
                Trích xuất ({regions.length})
              </button>
              <button type="button" className={tab === 'json' ? 'on' : ''} onClick={() => setTab('json')}>
                JSON
              </button>
            </div>
            <span className="efx-pdf-conf">OCR {activeRegion.conf}</span>
          </div>

          {tab === 'fields' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {regions.map((r, i) => (
                <div
                  key={r.id}
                  className={`efx-pdf-field-row ${i === activeIdx ? 'is-active' : ''}`}
                  onClick={() => { setActiveIdx(i); setPlaying(false); }}
                  style={{ cursor: 'pointer' }}
                >
                  <div>
                    <div style={{ fontSize: 11, opacity: 0.65, fontWeight: 700 }}>{r.field}</div>
                    <div style={{ fontWeight: 600 }}>{r.value}</div>
                  </div>
                  <span className="efx-pdf-conf">{r.conf}</span>
                </div>
              ))}
            </div>
          ) : (
            <pre className="efx-pdf-json">{jsonPreview}</pre>
          )}
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   6. ENERGY MORPH & BEAMFALL ANALYTICS WIDGET
   ========================================================================== */
const WEEK_BARS = [
  { d: 'T2', v: 46 },
  { d: 'T3', v: 64 },
  { d: 'T4', v: 58 },
  { d: 'T5', v: 82 },
  { d: 'T6', v: 76 },
  { d: 'T7', v: 94 },
  { d: 'CN', v: 88 },
];

export function EnergyMorphWidget({ masteryPct = 86, elo = 1680 }) {
  const [view, setView] = useState('orb'); // orb | bars | gauge

  return (
    <div className="efx-morph-card">
      <span className="efx-beamfall" aria-hidden="true" />
      <div className="efx-morph-head">
        <div>
          <div style={{ fontSize: 11.5, fontWeight: 700, opacity: 0.68, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Phân tích năng lực KHTN
          </div>
          <div style={{ fontSize: 17, fontWeight: 800 }}>
            {view === 'orb' ? 'Độ thành thạo GDPT 2018' : view === 'bars' ? 'Chuỗi 7 ngày ôn luyện' : 'Xếp hạng Elo mục tiêu'}
          </div>
        </div>
        <div className="efx-morph-pills" role="tablist">
          <button type="button" className={view === 'orb' ? 'on' : ''} onClick={() => setView('orb')}>Năng lượng</button>
          <button type="button" className={view === 'bars' ? 'on' : ''} onClick={() => setView('bars')}>7 ngày</button>
          <button type="button" className={view === 'gauge' ? 'on' : ''} onClick={() => setView('gauge')}>Elo</button>
        </div>
      </div>

      <div className="efx-morph-body">
        {view === 'orb' && (
          <div className="efx-morph-orb">
            <span className="efx-morph-liquid" style={{ top: `${Math.max(12, 100 - masteryPct)}%` }} />
            <div className="efx-morph-orb-val">
              <b>{masteryPct}%</b>
              <span>Lý · Hóa · Sinh</span>
            </div>
          </div>
        )}

        {view === 'bars' && (
          <div className="efx-morph-bars">
            {WEEK_BARS.map((b) => (
              <div key={b.d} className="efx-morph-bar-col">
                <div className="efx-morph-bar-fill" style={{ height: `${b.v}%` }} title={`${b.d}: ${b.v}% mục tiêu`} />
                <small>{b.d}</small>
              </div>
            ))}
          </div>
        )}

        {view === 'gauge' && (
          <div style={{ textAlign: 'center' }}>
            <svg width="210" height="118" viewBox="0 0 210 118" aria-label={`Điểm Elo ${elo}`}>
              <defs>
                <linearGradient id="efxEloGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="55%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>
              <path d="M 22 104 A 83 83 0 0 1 188 104" fill="none" stroke="rgba(148,163,184,0.22)" strokeWidth="14" strokeLinecap="round" />
              <path d="M 22 104 A 83 83 0 0 1 174 56" fill="none" stroke="url(#efxEloGrad)" strokeWidth="14" strokeLinecap="round" />
              <text x="105" y="88" textAnchor="middle" fill="currentColor" fontSize="28" fontWeight="800">{elo}</text>
              <text x="105" y="108" textAnchor="middle" fill="currentColor" opacity="0.65" fontSize="11.5" fontWeight="600">Top 5% · Mục tiêu 9+ THPTQG</text>
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
   7. ELEC LOGIN MASCOT (Bé Elec chính chủ) + OTP VERIFY SWEEP
   ========================================================================== */
export function PipLoginMascot({ email = '', focusField = 'idle', showPass = false, hasError = false, isSuccess = false }) {
  const emailLen = Math.min(email.length, 28);
  const lookX = focusField === 'email' ? -18 + (emailLen / 28) * 36 : focusField === 'otp' ? 0 : 0;
  const lookY = focusField === 'email' || focusField === 'otp' ? 12 : 0;
  const headTilt = focusField === 'email' ? -5 + (emailLen / 28) * 10 : hasError ? -4 : 0;
  const badEmail = focusField === 'email' && email.length > 3 && !email.includes('@');
  const coverEyes = focusField === 'password' && !showPass;
  const peekEye = focusField === 'password' && showPass;

  const statusText = isSuccess
    ? 'Chào mừng trở lại ELEC AI!'
    : hasError
      ? 'Ối, kiểm tra lại thông tin nhé!'
      : coverEyes
        ? 'Bé Elec đang bịt mắt bảo mật mật khẩu…'
        : peekEye
          ? 'Bé Elec hé 1 mắt một xíu thôi!'
          : badEmail
            ? 'Hình như thiếu ký tự @ trong email nè?'
            : focusField === 'otp'
              ? 'Nhập đủ 6 chữ số OTP để xác thực nhé!'
              : 'Bé Elec chào mừng bạn đến ELEC AI';

  const ink = '#1d4fb8';

  return (
    <div className="efx-pip-wrap" aria-hidden="true">
      <svg className="efx-pip-svg" viewBox="80 10 480 460">
        <defs>
          <radialGradient id="efx-ec-iris" cx="50%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#6cb4ff" />
            <stop offset="100%" stopColor="#0a5fd6" />
          </radialGradient>
          <linearGradient id="efx-ec-head" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="70%" stopColor="#f3f8ff" />
            <stop offset="100%" stopColor="#d9e9ff" />
          </linearGradient>
          <linearGradient id="efx-ec-blue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b9bff" />
            <stop offset="100%" stopColor="#0a6ae6" />
          </linearGradient>
          <linearGradient id="efx-ec-hair" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2f86f5" />
            <stop offset="100%" stopColor="#0d4fc9" />
          </linearGradient>
          <clipPath id="efx-ec-hc">
            <ellipse cx="320" cy="270" rx="215" ry="185" />
          </clipPath>
          <clipPath id="efx-ec-mc">
            <path d="M290,346 Q320,338 350,346 Q348,390 320,390 Q292,390 290,346Z" />
          </clipPath>
        </defs>

        <g className="efx-elec-bob" strokeLinejoin="round" strokeLinecap="round">
          {/* Head group with subtle tilt */}
          <g style={{ transformOrigin: '320px 380px', transform: `rotate(${headTilt.toFixed(1)}deg)`, transition: 'transform 0.2s ease-out' }}>
            {/* Main white head */}
            <ellipse cx="320" cy="270" rx="215" ry="185" fill="url(#efx-ec-head)" stroke={ink} strokeWidth="6" />

            {/* 3 iconic blue hair tufts */}
            <g fill="url(#efx-ec-hair)" stroke={ink} strokeWidth="5.5">
              <ellipse cx="250" cy="96" rx="42" ry="64" transform="rotate(-28 250 96)" />
              <ellipse cx="400" cy="100" rx="40" ry="60" transform="rotate(30 400 100)" />
              <ellipse cx="324" cy="70" rx="44" ry="70" transform="rotate(4 324 70)" />
              <path d="M168,200 Q180,120 320,112 Q460,120 472,200 Z" />
            </g>
            <ellipse cx="306" cy="52" rx="10" ry="22" transform="rotate(8 306 52)" fill="#fff" opacity=".35" />

            {/* Iconic ELEC AI blue headband */}
            <g clipPath="url(#efx-ec-hc)">
              <path d="M90,176 Q320,146 550,172 L552,238 Q320,214 88,244 Z" fill="url(#efx-ec-blue)" stroke={ink} strokeWidth="5.5" />
              <path d="M90,166 Q320,136 550,162 L550,176 Q320,150 90,180Z" fill="#fff" opacity=".18" />
            </g>
            <text
              x="320"
              y="219"
              textAnchor="middle"
              transform="rotate(-1.2 320 205)"
              fontFamily="'Be Vietnam Pro', Poppins, Arial, sans-serif"
              fontWeight="800"
              fontSize="40"
              fill="#fff"
              letterSpacing="2"
            >
              ELEC AI
            </text>

            {/* Rosy cheeks */}
            <ellipse cx="186" cy="354" rx="34" ry="21" fill="#ffa8bd" opacity={coverEyes || isSuccess ? '.92' : '.72'} />
            <ellipse cx="454" cy="354" rx="34" ry="21" fill="#ffa8bd" opacity={coverEyes || isSuccess ? '.92' : '.72'} />

            {/* Eyes */}
            {isSuccess ? (
              <>
                <path d="M218,322 Q250,282 282,322" fill="none" stroke="#13306b" strokeWidth="11" />
                <path d="M358,322 Q390,282 422,322" fill="none" stroke="#13306b" strokeWidth="11" />
                <path d="M126,118 L135,140 157,149 135,158 126,180 117,158 95,149 117,140Z" fill="#ffd45e" />
                <path d="M512,96 L519,112 535,119 519,126 512,142 505,126 489,119 505,112Z" fill="#34d399" />
              </>
            ) : hasError ? (
              <g stroke="#13306b" strokeWidth="10">
                <path d="M226,294 L274,316 L226,336" fill="none" />
                <path d="M414,294 L366,316 L414,336" fill="none" />
                {/* Cute sweat drop */}
                <path d="M482,252 Q498,278 482,292 Q466,278 482,252Z" fill="#7dd3fc" stroke={ink} strokeWidth="4" />
              </g>
            ) : (
              <g style={{ transform: `translate(${lookX.toFixed(1)}px, ${lookY.toFixed(1)}px)`, transition: 'transform 0.16s ease-out' }}>
                <g>
                  <ellipse cx="250" cy="312" rx="34" ry="39" fill="url(#efx-ec-iris)" />
                  <ellipse cx="253" cy="318" rx="19" ry="23" fill="#13306b" />
                  <circle cx="241" cy="298" r="11" fill="#fff" />
                  <circle cx="262" cy="330" r="5.5" fill="#fff" />
                  <circle cx="264" cy="304" r="3" fill="#fff" opacity=".8" />
                </g>
                <g>
                  <ellipse cx="390" cy="312" rx="34" ry="39" fill="url(#efx-ec-iris)" />
                  <ellipse cx="393" cy="318" rx="19" ry="23" fill="#13306b" />
                  <circle cx="381" cy="298" r="11" fill="#fff" />
                  <circle cx="402" cy="330" r="5.5" fill="#fff" />
                  <circle cx="404" cy="304" r="3" fill="#fff" opacity=".8" />
                </g>
              </g>
            )}

            {/* Mouth */}
            {badEmail || hasError ? (
              <g>
                <ellipse cx="320" cy="364" rx="13" ry="15" fill="#b02a47" />
                <ellipse cx="320" cy="371" rx="7" ry="6" fill="#ff8aa0" />
              </g>
            ) : (
              <g>
                <path d="M290,346 Q320,338 350,346 Q348,390 320,390 Q292,390 290,346Z" fill="#b02a47" />
                <g clipPath="url(#efx-ec-mc)">
                  <ellipse cx="320" cy="392" rx="22" ry="15" fill="#ff8aa0" />
                </g>
                <path d="M290,346 Q320,338 350,346 Q348,390 320,390 Q292,390 290,346Z" fill="none" stroke="#7d1d33" strokeWidth="4.5" />
              </g>
            )}
          </g>

          {/* Iconic white gloved hands of Bé Elec — lift smoothly to cover eyes on password */}
          <g style={{ transition: 'transform 0.34s cubic-bezier(0.34, 1.56, 0.64, 1)', transform: coverEyes ? 'translate(58px, -112px) rotate(12deg)' : peekEye ? 'translate(38px, -46px) rotate(4deg)' : 'translate(0px, 0px)' }}>
            <circle cx="192" cy="422" r="42" fill="#fff" stroke={ink} strokeWidth="6" />
            <ellipse cx="228" cy="404" rx="14" ry="20" transform="rotate(-24 228 404)" fill="#fff" stroke={ink} strokeWidth="5.5" />
            <circle cx="192" cy="422" r="36" fill="#fff" />
          </g>
          <g style={{ transition: 'transform 0.34s cubic-bezier(0.34, 1.56, 0.64, 1)', transform: coverEyes ? 'translate(-58px, -112px) rotate(-12deg)' : peekEye ? 'translate(-58px, -112px) rotate(-12deg)' : 'translate(0px, 0px)' }}>
            <circle cx="448" cy="422" r="42" fill="#fff" stroke={ink} strokeWidth="6" />
            <ellipse cx="412" cy="404" rx="14" ry="20" transform="rotate(24 412 404)" fill="#fff" stroke={ink} strokeWidth="5.5" />
            <circle cx="448" cy="422" r="36" fill="#fff" />
          </g>
        </g>
      </svg>
      <span className="efx-pip-status">{statusText}</span>
    </div>
  );
}
export const ElecLoginMascot = PipLoginMascot;

export function OtpVerifySweep({ value = '' }) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 6);
  const complete = digits.length === 6;
  return (
    <div className={`efx-otp-boxes ${complete ? 'is-complete' : ''}`} aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => (
        <span key={i} className={`efx-otp-cell ${digits[i] ? 'filled' : ''}`}>
          {digits[i] || '·'}
        </span>
      ))}
    </div>
  );
}

/* ==========================================================================
   LANDING INTERACTIVE FX SHOWCASE (Spotlight Tabs + 4 Live Interactive Demos)
   ========================================================================== */
const FX_TABS = [
  { id: 'pdf', label: 'Quét đề PDF & OCR' },
  { id: 'arc', label: 'Nạp điện Arc Charge' },
  { id: 'morph', label: 'Biến hình Elo & Beam' },
  { id: 'cta', label: 'Nút AI Hút Hạt' },
];

export function ElecFxShowcase({ onTryAi }) {
  const [tab, setTab] = useState('pdf');
  const tabsRef = useRef(null);
  const [pill, setPill] = useState({ x: 0, w: 0 });

  useLayoutEffect(() => {
    const update = () => {
      const box = tabsRef.current;
      if (!box) return;
      const btn = box.querySelector('.efx-spotlight-tab.on');
      if (!btn) return;
      const br = box.getBoundingClientRect();
      const ir = btn.getBoundingClientRect();
      setPill({ x: Math.round(ir.left - br.left), w: Math.round(ir.width) });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [tab]);

  return (
    <section className="efx-showcase" aria-label="Trải nghiệm tương tác công nghệ ELEC AI">
      <div className="efx-showcase-head">
        <span className="efx-showcase-kicker">ELEC INTERACTIVE ENGINE · LIVE DEMO</span>
        <h2>Chạm thử các tương tác thông minh trên ELEC AI</h2>
        <p>Tất cả hiệu ứng được viết thuần Canvas &amp; GPU, chạy mượt 60fps trên cả điện thoại lẫn máy tính.</p>
      </div>

      <div className="efx-spotlight-tabs-wrap">
        <div className="efx-spotlight-tabs" ref={tabsRef} role="tablist">
          <span
            className="efx-spotlight-pill"
            style={{ transform: `translateX(${pill.x}px)`, width: `${pill.w}px` }}
            aria-hidden="true"
          />
          {FX_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={`efx-spotlight-tab ${tab === t.id ? 'on' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="efx-showcase-panel">
        {tab === 'pdf' && <PdfParseScanner />}
        {tab === 'arc' && (
          <ArcChargeLoader
            autoLoop
            label="Đang phân tích đề thi & cân bằng phương trình hóa học…"
            sublabel="Đổi màu hồ quang điện theo tiến độ 0% → 100%"
          />
        )}
        {tab === 'morph' && <EnergyMorphWidget masteryPct={88} elo={1720} />}
        {tab === 'cta' && (
          <ChargeGenerateButton
            label="Rê chuột hút hạt & bấm mở ELEC AI"
            loadingLabel="Đang khởi động gia sư KHTN…"
            doneLabel="Đã sẵn sàng — Mở ELEC AI!"
            onComplete={() => onTryAi?.()}
          />
        )}
      </div>
    </section>
  );
}
