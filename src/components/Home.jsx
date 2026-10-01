import { Fragment, useEffect, useRef, useState } from 'react';
import PeriodicTable from './PeriodicTable.jsx';
import AIMark from './AIMark.jsx';
import DotOrb from './DotOrb.jsx';
import {
  IconRobot, IconAtom, IconScale, IconTimer, IconCalendar,
  IconCalc, IconQuiz, IconFlask, IconGamepad,
} from './Icons.jsx';
import { IcoImage, IcoSend, IcoSparkle } from './Icons2.jsx';

const TOOLS = [
  ['ai', 'Trợ lý AI', 'Chụp đề, hỏi đáp, sinh câu hỏi — gia sư 24/7', IconRobot],
  ['table', 'Bảng tuần hoàn', '118 nguyên tố, lọc và tìm kiếm tức thì', IconAtom],
  ['balance', 'Cân bằng PTHH', 'Nhập phương trình, ra hệ số ngay', IconScale],
  ['pomodoro', 'Pomodoro', 'Tập trung sâu, nghỉ đúng lúc', IconTimer],
  ['exam', 'Kỳ thi', 'Đếm ngược tới ngày quyết định', IconCalendar],
  ['grade', 'Tính điểm', 'Cần bao nhiêu để đạt mục tiêu', IconCalc],
  ['quiz', 'Ôn tập', 'Quiz thông minh, nhớ lâu hơn', IconQuiz],
  ['formulas', 'Công thức nhanh', 'Mol, pH, vô cơ, hữu cơ', IconFlask],
  ['games', 'Trò chơi', 'Giáo viên tự nhập câu hỏi', IconGamepad],
];

const WORDS = ['Hiđro', 'Oxi', 'Cacbon', 'Vàng', 'Sắt', 'Neon', 'Silic', 'Heli', 'Natri', 'Bạc'];
const ROLL = ['thông minh hơn.', 'nhanh hơn.', 'vui hơn.', 'nhớ lâu hơn.'];

const QUICK_PROMPTS = [
  { Icon: IconScale, text: 'Giải thích định luật bảo toàn khối lượng' },
  { Icon: IconAtom, text: 'Sinh 5 câu hỏi về bảng tuần hoàn' },
  { Icon: IconCalc, text: 'Cách cân bằng phương trình Fe + O2' },
  { Icon: IconFlask, text: 'Giải thích công thức tính pH' },
];

const PLACEHOLDERS = [
  'Hỏi AI bất cứ điều gì về Hóa học…',
  'Cân bằng giúp mình: Al + HCl → AlCl3 + H2',
  'Tính pH của dung dịch HCl 0,01M',
  'Sinh 10 câu trắc nghiệm về este',
];

const HINTS = [
  'Chào! Mình là trợ lý Hóa học 👋',
  'Mình đang nhìn theo con trỏ của bạn đó 👀',
  'Bấm vào mình thử xem — mình nhột lắm!',
  'Thử hỏi mình cách cân bằng Fe + O₂ nhé',
];

const CHIPS = [
  { s: 'H', n: 1, style: { top: '12%', left: '2%', '--d': '0s' } },
  { s: 'C', n: 6, style: { bottom: '16%', left: '6%', '--d': '-1.5s' } },
  { s: 'O', n: 8, style: { top: '50%', right: '-1%', '--d': '-3s' } },
  { s: 'Fe', n: 26, accent: true, style: { bottom: '6%', right: '14%', '--d': '-4.5s' } },
];

const CLASSES = ['Lớp 10', 'Lớp 11', 'Lớp 12', 'Đại học'];

const MANIFESTO = [
  { num: '01', title: 'Học', body: 'Bảng tuần hoàn tương tác, công thức nhanh, phân tích hợp chất — mọi thứ bạn cần để hiểu Hóa học từ gốc.' },
  { num: '02', title: 'Luyện', body: 'Quiz thông minh theo phương pháp lặp lại ngắt quãng. Nhớ lâu hơn, quên ít hơn, không cần cày cuốc.' },
  { num: '03', title: 'Hỏi', body: 'Trợ lý AI giải đề, giảng lý thuyết, sinh câu hỏi ôn tập. Như có gia sư riêng 24/7, miễn phí.' },
];

const STATEMENT =
  'Hóa học không phải là thứ để học thuộc. Hiểu bản chất, luyện đúng cách, hỏi khi cần — phần còn lại để chúng mình lo.';

const STATS = [
  { num: 'AI', label: 'Trợ lý', sub: 'Miễn phí 24/7' },
  { num: 118, label: 'Nguyên tố', sub: 'Bảng tuần hoàn đầy đủ' },
  { num: 9, label: 'Công cụ', sub: 'Từ mol tới pH' },
  { num: 3, label: 'Trò chơi', sub: 'Tương tác vui' },
];

const QUOTES = [
  { text: 'Không có gì mất đi, không có gì được tạo ra, mọi thứ chỉ biến đổi.', author: 'Antoine Lavoisier', role: 'Cha đẻ Hóa học hiện đại' },
  { text: 'Hóa học là môn học của sự thay đổi và biến hóa không ngừng.', author: 'Marie Curie', role: 'Nobel Vật lý & Hóa học' },
  { text: 'Điều quan trọng là không ngừng đặt câu hỏi. Tò mò là gốc của mọi tri thức.', author: 'Albert Einstein', role: 'Nobel Vật lý' },
];

const reduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Hooks ---------- */
function useInView(threshold = 0.2) {
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

function useTypewriter(text, speed = 28) {
  const [n, setN] = useState(0);
  const chars = Array.from(text);
  useEffect(() => {
    if (reduced()) { setN(chars.length); return undefined; }
    setN(0);
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setN(i);
      if (i >= chars.length) clearInterval(t);
    }, speed);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, speed]);
  return chars.slice(0, n).join('');
}

function Split({ text, as: Tag = 'span', start = 0, step = 55, base = 0, className = '' }) {
  const [ref, on] = useInView(0.3);
  const words = text.split(' ');
  return (
    <Tag
      ref={ref}
      className={'fx-split' + (on ? ' on' : '') + (className ? ' ' + className : '')}
      style={{ '--base': base + 'ms', '--step': step + 'ms' }}
    >
      <span className="fx-sr">{text.replace(/\*/g, '')}</span>
      {words.map((w, i) => {
        const hl = w.startsWith('*');
        return (
          <Fragment key={i}>
            <span className="fx-wm" aria-hidden="true">
              <span className="fx-s" style={{ '--i': start + i }}>
                {hl ? <span className="fx-shimmer">{w.slice(1)}</span> : w}
              </span>
            </span>{' '}
          </Fragment>
        );
      })}
    </Tag>
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
    <span className="fx-roll">
      {words.map((w, k) => (
        <span
          key={w}
          aria-hidden={k !== s.i}
          className={'fx-roll-w' + (k === s.i ? ' in' : k === s.p ? ' out' : '')}
        >
          {w}
        </span>
      ))}
    </span>
  );
}

function ScrollFill({ text }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const spans = [...el.children];
    if (reduced()) { spans.forEach((s) => { s.style.opacity = 1; }); return undefined; }
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (vh * 0.4 + r.height)));
      const k = p * (spans.length + 2);
      spans.forEach((s, i) => { s.style.opacity = (0.16 + 0.84 * Math.min(1, Math.max(0, k - i))).toFixed(2); });
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
    };
  }, []);
  return (
    <p ref={ref} className="fx-fill">
      {text.split(' ').map((w, i) => <span key={i}>{w + ' '}</span>)}
    </p>
  );
}

function CountUp({ to }) {
  const [ref, on] = useInView(0.5);
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!on) return undefined;
    if (reduced()) { setV(to); return undefined; }
    let raf;
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / 1200);
      setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [on, to]);
  return <span ref={ref}>{v}</span>;
}

function QuoteStage() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const next = () => setI((c) => (c + 1) % QUOTES.length);
  const q = QUOTES[i];
  return (
    <div
      className={'fx-quote' + (paused ? ' paused' : '')}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <span className="fx-quote-mark" aria-hidden="true">"</span>
      <blockquote key={i} className="fx-quote-body">
        <p className="fx-quote-text">
          {q.text.split(' ').map((w, k) => (
            <Fragment key={k}><span style={{ '--i': k }}>{w}</span>{' '}</Fragment>
          ))}
        </p>
        <footer><b>{q.author}</b><span>{q.role}</span></footer>
      </blockquote>
      <div className="fx-quote-tabs" role="tablist">
        {QUOTES.map((x, k) => (
          <button
            key={x.author}
            type="button"
            role="tab"
            aria-selected={k === i}
            className={k === i ? 'on' : ''}
            onClick={() => setI(k)}
          >
            {x.author}
            <span className="fx-bar" onAnimationEnd={k === i ? next : undefined} />
          </button>
        ))}
      </div>
    </div>
  );
}

/* Card xếp chồng: tự tính vị trí dính (card cao hơn màn hình vẫn đọc hết đáy)
   và đo mức bị card sau đè lên (--p: 0 → 1) để CSS làm tối/thu nhỏ nhẹ. */
function useCardStack(ref) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;
    const cards = [...root.children];
    let raf = 0;
    const navH = () =>
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 52;

    const update = () => {
      raf = 0;
      const off = window.matchMedia('(max-width: 720px)').matches || reduced();
      cards.forEach((c, i) => {
        const nx = cards[i + 1];
        if (off || !nx) { c.style.removeProperty('--p'); return; }
        const r = c.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, (r.bottom - nx.getBoundingClientRect().top) / r.height));
        c.style.setProperty('--p', p.toFixed(3));
      });
    };
    const layout = () => {
      const vh = window.innerHeight;
      cards.forEach((c) => {
        c.style.top = Math.min(navH() + 8, vh - c.offsetHeight) + 'px';
      });
      update();
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(update); };

    layout();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(layout) : null;
    cards.forEach((c) => ro && ro.observe(c));
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', layout);
    return () => {
      cancelAnimationFrame(raf);
      ro && ro.disconnect();
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', layout);
    };
  }, [ref]);
}

function trackHero(e) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--hx', e.clientX - r.left + 'px');
  e.currentTarget.style.setProperty('--hy', e.clientY - r.top + 'px');
}

function trackPointer(e) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  el.style.setProperty('--mx', e.clientX - r.left + 'px');
  el.style.setProperty('--my', e.clientY - r.top + 'px');
}

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [grade, setGrade] = useState('Lớp 11');
  const [hint, setHint] = useState(0);
  const [ph, setPh] = useState(0);

  const typing = prompt.trim().length > 0;
  const loop = [...WORDS, ...WORDS];
  const bubbleText = typing ? 'Mình đang đọc câu hỏi của bạn…' : HINTS[hint];
  const bubbleTyped = useTypewriter(bubbleText, 26);
  const phTyped = useTypewriter(PLACEHOLDERS[ph], 30);

  useEffect(() => {
    const a = setInterval(() => setHint((i) => (i + 1) % HINTS.length), 4800);
    const b = setInterval(() => setPh((i) => (i + 1) % PLACEHOLDERS.length), 4200);
    return () => { clearInterval(a); clearInterval(b); };
  }, []);

  const stackRef = useRef(null);
  useCardStack(stackRef);

  const goToAI = (text, force = false) => {
    const q = (text ?? prompt).trim();
    if (!q && !force) return;
    if (q) {
      try {
        localStorage.setItem('cs-ai-pending', JSON.stringify({ text: q, grade, t: Date.now() }));
      } catch { /* localStorage bị chặn */ }
    }
    location.hash = 'ai';
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); goToAI(); }
  };

  return (
    <>
      {/* ================= HERO ================= */}
      <section className="hero-home split" onPointerMove={trackHero}>
        <div className="hero-home-inner">
          <div className="hero-copy">
            <p className="hero-home-slogan">
              <span className="hero-home-dot"><IcoSparkle size={13} /></span>
              Mới — Trợ lý AI Hóa học
            </p>

            <h1 className="hero-home-title fx-h1">
              <Split text="Học *Hóa *học" base={150} />
              <br />
              <Rolling words={ROLL} />
            </h1>

            <p className="hero-home-lead">
              Hỏi AI bất cứ điều gì về Hóa học — giải đề, giảng lý thuyết, sinh câu hỏi ôn tập.
            </p>

            <div className="hero-input-wrap">
              <textarea
                className="hero-input"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={onKey}
                placeholder={phTyped}
                aria-label="Câu hỏi cho trợ lý AI"
                rows={2}
              />
              <div className="hero-input-bar">
                <div className="hero-input-left">
                  <button className="hero-input-btn" type="button" title="Chụp đề / gửi ảnh" aria-label="Chụp đề hoặc gửi ảnh" onClick={() => goToAI(undefined, true)}><IcoImage size={18} /></button>
                  <select className="hero-input-select" value={grade} onChange={(e) => setGrade(e.target.value)} aria-label="Chọn lớp">
                    {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <button className="hero-input-send" onClick={() => goToAI()} disabled={!typing} type="button" aria-label="Gửi">
                  <IcoSend size={18} />
                </button>
              </div>
            </div>

            <div className="hero-quick">
              {QUICK_PROMPTS.map((q, i) => (
                <button key={i} className="hero-quick-btn" onClick={() => goToAI(q.text)} type="button">
                  <span className="hero-quick-icon"><q.Icon size={16} /></span>
                  <span className="hero-quick-text">{q.text}</span>
                </button>
              ))}
            </div>

            <div className="hero-home-meta">
              <span><b>10–12</b> bám sát chương trình</span>
              <span><b>24/7</b> luôn sẵn sàng</span>
              <span><b>0đ</b> không cần tài khoản</span>
            </div>
          </div>

          <div className="hero-mascot">
            <span className="hero-mascot-ring" aria-hidden="true" />
            <span className="hero-mascot-ring r2" aria-hidden="true" />

            <div className="hx-bubble" aria-live="off">
              <span className="fx-typed">
                <span className="fx-ghost" aria-hidden="true">{bubbleText}</span>
                <span>{bubbleTyped}<i className="fx-caret" /></span>
              </span>
            </div>

            <DotOrb />
            <AIMark look mode={typing ? 'think' : 'idle'} title="Trợ lý AI Hóa học" />

            {CHIPS.map((c) => (
              <span key={c.s} className={'hx-chip' + (c.accent ? ' acc' : '')} style={c.style} aria-hidden="true">
                <small>{c.n}</small>
                {c.s}
              </span>
            ))}
          </div>
        </div>

        <div className="hero-home-bg" aria-hidden="true">
          <div className="hero-home-spot" />
          <div className="hero-home-blob hero-home-blob-1" />
          <div className="hero-home-blob hero-home-blob-2" />
          <div className="hero-home-blob hero-home-blob-3" />
          <div className="hero-home-grid" />
        </div>
      </section>

      {/* ================= MARQUEE 2 HÀNG ================= */}
      <div className="fx-marqs" aria-hidden="true">
        <div className="fx-marq"><div>{loop.map((w, i) => <span key={i}>{w}</span>)}</div></div>
        <div className="fx-marq rev"><div>{[...loop].reverse().map((w, i) => <span key={i}>{w}</span>)}</div></div>
      </div>

      {/* ================= STACK CARDS (CHỈ 3 CARD ĐẦU) ================= */}
      <div className="stack-cards" ref={stackRef}>

        {/* CARD 1: MANIFESTO */}
        <section className="stack-card">
          <div className="fx-head">
            <div>
              <p className="slogan"><span className="fx-idx">01</span>Triết lý</p>
              <h2 className="fx-title">
                <Split text="Ba bước," />{' '}
                <Split text="một hành trình" className="fx-hl" start={2} />
              </h2>
            </div>
            <ScrollFill text={STATEMENT} />
          </div>

          <div className="fx-steps">
            {MANIFESTO.map((m) => (
              <article key={m.num} className="manifesto-card fx-step">
                <div className="manifesto-num">{m.num}</div>
                <h3 className="manifesto-title">{m.title}</h3>
                <p className="manifesto-body">{m.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* CARD 2: FEATURED */}
        <section className="stack-card">
          <div className="fx-head">
            <div>
              <p className="slogan"><span className="fx-idx">02</span>Tính năng chính</p>
              <h2 className="fx-title">
                <Split text="Bảng tuần hoàn" />{' '}
                <Split text="tương tác" className="fx-hl" start={3} />
              </h2>
            </div>
            <p className="lead fx-lead">
              118 nguyên tố với đầy đủ thông tin: khối lượng, cấu hình electron, trạng thái, độ âm điện.
              Lọc theo nhóm, chu kỳ, phân loại — tìm kiếm tức thì.
            </p>
          </div>
          <div className="featured-table">
            <PeriodicTable preview />
          </div>
        </section>

        {/* CARD 3: TOOLS — CARD CUỐI CÙNG CỦA STACK */}
        <section className="stack-card" id="tools">
          <div className="fx-head solo">
            <div>
              <p className="slogan"><span className="fx-idx">03</span>Bộ công cụ</p>
              <h2 className="fx-title">
                <Split text="Chín công cụ," />{' '}
                <Split text="một mục tiêu" className="fx-hl" start={3} />
              </h2>
            </div>
          </div>

          <div className="fx-bento">
            {TOOLS.map(([id, title, desc, Icon], i) => (
              <a key={id} href={'#' + id} className={'fx-tool' + (i === 0 ? ' feat' : '')} onMouseMove={trackPointer}>
                <span className="fx-tool-ico"><Icon size={i === 0 ? 30 : 22} /></span>
                <h3>
                  <span className="fx-hr" data-text={title}><span>{title}</span></span>
                </h3>
                <p>{desc}</p>
                {i === 0 && <span className="fx-tool-cta">Thử ngay</span>}
                <span className="fx-tool-n" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <span className="fx-tool-go" aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        </section>

      </div>
      {/* ============ HẾT STACK ============ */}

      {/* ================= STATS ================= */}
      <section className="wrap stats-section">
        <div className="stats-grid">
          {STATS.map((s) => (
            <div key={s.label} className="stat-card">
              <span className="stat-num">{typeof s.num === 'number' ? <CountUp to={s.num} /> : s.num}</span>
              <span className="stat-label">{s.label}</span>
              <span className="stat-sub">{s.sub}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ================= QUOTES ================= */}
      <section className="wrap quotes-section">
        <div className="fx-head solo">
          <div>
            <p className="slogan"><span className="fx-idx">04</span>Trích dẫn</p>
            <h2 className="fx-title">
              <Split text="Từ những" />{' '}
              <Split text="bộ óc vĩ đại" className="fx-hl" start={2} />
            </h2>
          </div>
        </div>
        <QuoteStage />
      </section>

      {/* ================= CTA ================= */}
      <section className="wrap narrow cta-final cta-card">
        <div className="cta-mark">
          <AIMark look mode="talk" title="Trợ lý AI" />
        </div>
        <p className="slogan center" style={{ justifyContent: 'center' }}>
          Bắt đầu ngay — miễn phí, không cần tài khoản
        </p>
        <h2 className="cta-title fx-title fx-cta">
          <Split text="Sẵn sàng *chinh *phục" />
          <br />
          <Split text="Hóa học?" start={3} />
        </h2>
        <p className="lead center" style={{ margin: '0 auto 2rem', textAlign: 'center' }}>
          Hỏi AI, mở bảng tuần hoàn, chơi game, hoặc bắt đầu ôn tập thông minh.
        </p>
        <div className="row center cta-actions">
          <a className="btn primary" href="#ai">Hỏi AI ngay →</a>
          <a className="btn" href="#table">Bảng tuần hoàn</a>
          <a className="btn" href="#games">Chơi game</a>
        </div>
      </section>
    </>
  );
}