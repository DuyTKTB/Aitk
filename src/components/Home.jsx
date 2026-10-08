import { Fragment, lazy, Suspense, useEffect, useRef, useState } from 'react';
import HeroLindy from './HeroLindy.jsx';
import { IcoSparkle } from './Icons.jsx';
import { HeroNet, useSpotlight, useGreeting } from './HomePlus.jsx';
import './home-pro.css';
import './home-lindy.css';

/* ============================================================
   Home.jsx — Trang chủ khi đã đăng nhập
   Cấu trúc:
     1. HeroLindy — mockup chat AI
     2. Quick Actions — 4 nút vào việc chính
     3. CTA "Bắt đầu khám phá" → CUAI
   ============================================================ */

const PeriodicTable = lazy(() => import('./PeriodicTable.jsx'));

const ROLL = ['thông minh hơn.', 'nhanh hơn.', 'vui hơn.', 'nhớ lâu hơn.'];

const reduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (!('IntersectionObserver' in window)) { setOn(true); return undefined; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setOn(true); io.disconnect(); }
    }, { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, on];
}

function Split({ text, base = 0, step = 55 }) {
  const [ref, on] = useInView(0.3);
  return (
    <span
      ref={ref}
      className={'fx-split' + (on ? ' on' : '')}
      style={{ '--base': base + 'ms', '--step': step + 'ms' }}
    >
      <span className="fx-sr">{text.replace(/\*/g, '')}</span>
      {text.split(' ').map((w, i) => (
        <Fragment key={i}>
          <span className="fx-wm" aria-hidden="true">
            <span className="fx-s" style={{ '--i': i }}>
              {w.startsWith('*') ? <span className="fx-shimmer">{w.slice(1)}</span> : w}
            </span>
          </span>{' '}
        </Fragment>
      ))}
    </span>
  );
}

function Rolling({ words }) {
  const [s, setS] = useState({ i: 0, p: -1 });
  useEffect(() => {
    if (reduced()) return undefined;
    const t = setInterval(() => setS((c) => ({ i: (c.i + 1) % words.length, p: c.i })), 2600);
    return () => clearInterval(t);
  }, [words.length]);
  return (
    <span className="hm-roll">
      {words.map((w, k) => (
        <span
          key={w}
          aria-hidden={k !== s.i}
          className={'hm-roll-w' + (k === s.i ? ' in' : k === s.p ? ' out' : '')}
        >
          {w}
        </span>
      ))}
    </span>
  );
}

function trackHero(e) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--hx', e.clientX - r.left + 'px');
  e.currentTarget.style.setProperty('--hy', e.clientY - r.top + 'px');
}

/* ============================================================
   QUICK ACTIONS — 4 nút vào việc chính
   ============================================================ */
const IcoCamera = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" />
    <circle cx="12" cy="12.5" r="3.5" />
  </svg>
);

const IcoQuiz = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7v.5" />
    <path d="M12 17h.01" />
  </svg>
);

const IcoBalance = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3v18M3 7h18M7 7l-3 7a3 3 0 0 0 6 0L7 7zM17 7l-3 7a3 3 0 0 0 6 0l-3-7z" />
  </svg>
);

const IcoChart = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 3v18h18" />
    <path d="M7 14l3-3 3 3 5-6" />
  </svg>
);

const IcoArrow = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

const IcoRocket = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 15c-3 3-3 6-3 6s3 0 6-3M14.5 9.5 12 12M9 15l-3-3s3-2 4-6 8-3 8-3-1 7-3 8-6 4-6 4z" />
    <circle cx="15" cy="9" r="1.5" />
  </svg>
);

const QUICK_ACTIONS = [
  {
    id: 'capture',
    Icon: IcoCamera,
    label: 'Chụp đề',
    desc: 'Gửi ảnh đề cho AI',
    color: 'blue',
    action: () => {
      try { localStorage.setItem('cs-ai-pending', JSON.stringify({ action: 'capture', t: Date.now() })); } catch { /* */ }
      location.hash = 'ai';
    },
  },
  {
    id: 'quiz',
    Icon: IcoQuiz,
    label: 'Quiz',
    desc: 'Luyện tập nhanh',
    color: 'purple',
    action: () => { location.hash = 'quiz'; },
  },
  {
    id: 'balance',
    Icon: IcoBalance,
    label: 'Cân bằng',
    desc: 'Cân bằng PTHH',
    color: 'green',
    action: () => { location.hash = 'balance'; },
  },
  {
    id: 'progress',
    Icon: IcoChart,
    label: 'Tiến độ',
    desc: 'Xem thống kê',
    color: 'orange',
    action: () => { location.hash = 'stats'; },
  },
];

function QuickActions() {
  const [ref, on] = useInView(0.1);

  return (
    <section ref={ref} className={'hp-quick-section' + (on ? ' in' : '')}>
      <div className="hp-quick-head">
        <h2>Bắt đầu nhanh</h2>
        <p>Chọn một hành động để vào việc ngay</p>
      </div>
      <div className="hp-quick-grid">
        {QUICK_ACTIONS.map(({ id, Icon, label, desc, color, action }, i) => (
          <button
            key={id}
            type="button"
            className={'hp-quick-btn hp-quick-' + color}
            style={{ '--i': i }}
            onClick={action}
          >
            <span className="hp-quick-ico">
              <Icon size={22} />
            </span>
            <span className="hp-quick-text">
              <b>{label}</b>
              <small>{desc}</small>
            </span>
            <span className="hp-quick-arrow" aria-hidden="true">
              <IcoArrow size={16} />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ============================================================
   CTA — Bắt đầu khám phá CUAI
   ============================================================ */
function ExploreCTA() {
  const [ref, on] = useInView(0.15);

  const goToAI = () => {
    try {
      localStorage.setItem('cs-ai-pending', JSON.stringify({ text: '', t: Date.now() }));
    } catch { /* */ }
    location.hash = 'ai';
  };

  return (
    <section ref={ref} className={'hp-explore' + (on ? ' in' : '')}>
      <div className="hp-explore-glow" aria-hidden="true" />
      <div className="hp-explore-inner">
        <span className="hp-explore-badge">
          <IcoSparkle size={14} />
          Trợ lý AI
        </span>
        <h2>
          Sẵn sàng <em>khám phá</em>?
        </h2>
        <p>
          Hỏi AI bất cứ điều gì về Hóa học — giải đề, giảng lý thuyết, sinh quiz.
          Bắt đầu cuộc trò chuyện đầu tiên của bạn ngay bây giờ.
        </p>
        <button
          type="button"
          className="hp-explore-btn"
          onClick={goToAI}
        >
          <IcoRocket size={20} />
          <span>Bắt đầu khám phá</span>
          <IcoArrow size={18} />
        </button>
      </div>
    </section>
  );
}

/* ============================================================
   MAIN
   ============================================================ */
export default function Home() {
  const { hello, name } = useGreeting();
  useSpotlight();

  return (
    <div className="hp">
      {/* 1. KHUNG CHAT AI */}
      <section className="hm-hero-lindy" onPointerMove={trackHero}>
        <div className="hm-hero-bg" aria-hidden="true"><HeroNet /></div>

        <div className="hm-wrap hm-hero-lindy-head">
          <p className="hm-badge">
            <span className="hm-badge-dot"><IcoSparkle size={13} /></span>
            {hello}, {name}
          </p>
          <h1 className="hm-h1">
            <Split text="Học *Hóa *học" base={100} />
            <br />
            <Rolling words={ROLL} />
          </h1>
        </div>

        <HeroLindy />
      </section>

      {/* 2. QUICK ACTIONS — 4 nút vào việc chính */}
      <QuickActions />

      {/* 3. CTA — Bắt đầu khám phá CUAI */}
      <ExploreCTA />
    </div>
  );
}