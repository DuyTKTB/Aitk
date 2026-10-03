import { Fragment, useEffect, useRef, useState, useMemo } from 'react';
import PeriodicTable from './PeriodicTable.jsx';
import AIMark from './AIMark.jsx';
import DotOrb from './DotOrb.jsx';
import HeroLindy from './HeroLindy.jsx';
import {
  IconAtom, IconScale, IconCalc, IconFlask, IconArrowUpRight,
  IcoImage, IcoSend, IcoSparkle,
} from './Icons.jsx';
import { WordMarquee, BentoTools, TodayBody, LabBody, RoadBody, FaqSection, useGreeting } from './HomePlus.jsx';

/* ============================================================
   Home.jsx — trang chủ
   Style: ./nav-home-v2.css (các class hm-*) + fx.css (Split, Rolling, QuoteStage)
   ============================================================ */

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

/* Đây là một chuỗi bước thật → có đánh số */
const STEPS = [
  { title: 'Học', href: '#table', cta: 'Mở bảng tuần hoàn', body: 'Bảng tuần hoàn tương tác, công thức nhanh, phân tích hợp chất — mọi thứ bạn cần để hiểu Hóa học từ gốc.' },
  { title: 'Luyện', href: '#quiz', cta: 'Bắt đầu ôn tập', body: 'Quiz thông minh theo phương pháp lặp lại ngắt quãng. Nhớ lâu hơn, quên ít hơn, không cần cày cuốc.' },
  { title: 'Hỏi', href: '#ai', cta: 'Hỏi trợ lý AI', body: 'Trợ lý AI giải đề, giảng lý thuyết, sinh câu hỏi ôn tập. Như có gia sư riêng, sẵn sàng bất cứ lúc nào.' },
];

const STATEMENT =
  'Hóa học không phải là thứ để học thuộc. Hiểu bản chất, luyện đúng cách, hỏi khi cần — phần còn lại để chúng mình lo.';

const STATS = [
  { num: 'AI', label: 'Trợ lý', sub: 'Sẵn sàng 24/7' },
  { num: 118, label: 'Nguyên tố', sub: 'Bảng tuần hoàn đầy đủ' },
  { num: 9, label: 'Công cụ', sub: 'Từ mol tới pH' },
  { num: 6, label: 'Trò chơi', sub: 'Vừa chơi vừa học' },
];

const QUOTES = [
  { text: 'Không có gì mất đi, không có gì được tạo ra, mọi thứ chỉ biến đổi.', author: 'Antoine Lavoisier', role: 'Cha đẻ Hóa học hiện đại (diễn giải)' },
  { text: 'Trong cuộc sống không có gì đáng sợ, chỉ có những điều cần được hiểu.', author: 'Marie Curie', role: 'Nobel Vật lý và Hóa học (thường được trích dẫn)' },
  { text: 'Cách tốt nhất để có một ý tưởng hay là có thật nhiều ý tưởng.', author: 'Linus Pauling', role: 'Nobel Hóa học và Hòa bình (thường được trích dẫn)' },
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
  const chars = useMemo(() => Array.from(text), [text]);
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
  }, [chars, speed]);
  return chars.slice(0, n).join('');
}

/* ---------- Thành phần nhỏ ---------- */
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

/* Tiêu đề mỗi phần: tiêu đề bên trái, mô tả bên phải */
function Head({ title, lead, n, tag }) {
  return (
    <header className="hm-head">
      <div className="hm-head-l">
        {tag && <span className="hm-tag"><i>{n}</i>{tag}</span>}
        <h2 className="hm-h2"><Split text={title} /></h2>
      </div>
      {lead && <p className="hm-sublead">{lead}</p>}
    </header>
  );
}

/* Thẻ xếp chồng: mỗi thẻ dính lại ở đỉnh và thu nhỏ nhẹ khi thẻ sau đè lên.
   Tự tắt trên mobile (≤ 720px) và khi bật "giảm chuyển động". */
function useCardStack(ref) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;
    const cards = [...root.children];
    let raf = 0;
    const navH = () =>
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 56;

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
        c.style.top = Math.min(navH() + 24, vh - c.offsetHeight) + 'px';
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

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [grade, setGrade] = useState('Lớp 11');
  const [hint, setHint] = useState(0);
  const [ph, setPh] = useState(0);

  const stackRef = useRef(null);
  useCardStack(stackRef);
  const { hello, name, date } = useGreeting();

  const typing = prompt.trim().length > 0;
  const bubbleText = typing ? 'Mình đang đọc câu hỏi của bạn…' : HINTS[hint];
  const bubbleTyped = useTypewriter(bubbleText, 26);
  const phTyped = useTypewriter(PLACEHOLDERS[ph], 30);

  useEffect(() => {
    const a = setInterval(() => setHint((i) => (i + 1) % HINTS.length), 4800);
    const b = setInterval(() => setPh((i) => (i + 1) % PLACEHOLDERS.length), 4200);
    return () => { clearInterval(a); clearInterval(b); };
  }, []);

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
      <section className="hm-hero" onPointerMove={trackHero}>
        <div className="hm-hero-bg" aria-hidden="true" />

        <div className="hm-wrap hm-hero-inner">
          <div className="hm-copy">
            <p className="hm-badge">
              <span className="hm-badge-dot"><IcoSparkle size={13} /></span>
              Trợ lý AI Hóa học, bám sát chương trình 10–12
            </p>

            <h1 className="hm-h1">
              <Split text="Học *Hóa *học" base={150} />
              <br />
              <Rolling words={ROLL} />
            </h1>

            <p className="hm-lead">
              Hỏi AI bất cứ điều gì về Hóa học — giải đề, giảng lý thuyết, sinh câu hỏi ôn tập.
            </p>

            <div className="hm-ask">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={onKey}
                placeholder={phTyped}
                aria-label="Câu hỏi cho trợ lý AI"
                rows={2}
              />
              <div className="hm-ask-bar">
                <div className="hm-ask-left">
                  <button
                    className="hm-ask-btn"
                    type="button"
                    title="Chụp đề / gửi ảnh"
                    aria-label="Chụp đề hoặc gửi ảnh"
                    onClick={() => goToAI(undefined, true)}
                  >
                    <IcoImage size={18} />
                  </button>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    aria-label="Chọn lớp"
                  >
                    {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <button
                  className="hm-ask-send"
                  onClick={() => goToAI()}
                  disabled={!typing}
                  type="button"
                  aria-label="Gửi câu hỏi"
                >
                  <IcoSend size={18} />
                </button>
              </div>
            </div>

            <div className="hm-quick" role="group" aria-label="Gợi ý câu hỏi">
              {QUICK_PROMPTS.map((q) => (
                <button key={q.text} type="button" onClick={() => goToAI(q.text)}>
                  <q.Icon size={15} />
                  {q.text}
                </button>
              ))}
            </div>

            <p className="hm-meta">
              <span><b>24/7</b>luôn sẵn sàng</span>
              <span><b>0đ</b>miễn phí cho học sinh</span>
            </p>
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
            <AIMark look mode={typing ? 'think' : 'idle'} />

            {CHIPS.map((c) => (
              <span key={c.s} className={'hx-chip' + (c.accent ? ' acc' : '')} style={c.style} aria-hidden="true">
                <small>{c.n}</small>
                {c.s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ================= MOCKUP CHAT ================= */}
      <HeroLindy />

      {/* ================= MARQUEE CHỮ LỚN ================= */}
      <WordMarquee words={WORDS} />


      {/* ================= THẺ XẾP CHỒNG ================= */}
      <div className="stack-cards" ref={stackRef}>

      {/* ----- Hôm nay ----- */}
      <section className="stack-card">
<div className="hm-stack-in">
        <Head n="01" tag="Hôm nay" title={`${hello}, *${name}.`} lead={`${date}. Đây là những việc nên làm tiếp theo.`} />
        <TodayBody grade={grade} />
      </div>
      </section>

      {/* ----- 3 bước ----- */}
      <section className="stack-card">
<div className="hm-stack-in">
        <Head n="02" tag="Triết lý" title="Ba bước, *một *hành *trình" lead={STATEMENT} />
        <div className="hm-steps">
          {STEPS.map((s, i) => (
            <a key={s.title} href={s.href} className="hm-step">
              <span className="hm-step-n" aria-hidden="true">{i + 1}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
              <span className="hm-step-cta">
                {s.cta}
                <IconArrowUpRight size={15} />
              </span>
            </a>
          ))}
        </div>
      </div>
      </section>

      {/* ================= BẢNG TUẦN HOÀN ================= */}
      <section className="stack-card">
<div className="hm-stack-in">
        <Head
          n="03" tag="Bảng tuần hoàn" title="Bảng tuần hoàn *tương *tác"
          lead="118 nguyên tố với đầy đủ thông tin: khối lượng, cấu hình electron, trạng thái, độ âm điện. Lọc theo nhóm, chu kỳ, phân loại — tìm kiếm tức thì."
        />
        <div className="hm-panel featured-table">
          <PeriodicTable preview />
        </div>
        <p className="hm-more"><a className="btn" href="#table">Mở bảng đầy đủ</a></p>
      </div>
      </section>

      {/* ================= BỘ CÔNG CỤ ================= */}
      <section className="stack-card" id="tools">
<div className="hm-stack-in">
        <Head n="04" tag="Bộ công cụ" title="Chín công cụ, *một *mục *tiêu" lead="Mỗi ô là một công cụ đang chạy thật. Rê chuột để xem, bấm để mở." />
        <BentoTools />
      </div>
      </section>

      {/* ----- Phòng thí nghiệm ----- */}
      <section className="stack-card">
<div className="hm-stack-in">
        <Head n="05" tag="Phòng thí nghiệm" title="Phòng thí nghiệm *trong *túi *bạn" lead="Kéo thanh pH hoặc chọn một chất quen thuộc, xem chất chỉ thị vạn năng đổi màu theo nồng độ H⁺." />
        <LabBody grade={grade} />
      </div>
      </section>

      {/* ----- Lộ trình ----- */}
      <section className="stack-card">
<div className="hm-stack-in">
        <Head n="06" tag="Lộ trình" title="Lộ trình *theo *từng *lớp" lead="Chọn lớp của bạn để xem nên học gì và dùng công cụ nào. Bấm vào chủ đề để nhờ AI tóm tắt." />
        <RoadBody grade={grade} setGrade={setGrade} />
      </div>
      </section>

      </div>

      {/* ================= SỐ LIỆU ================= */}
      <section className="hm-wrap">
        <div className="hm-stats">
          {STATS.map((s) => (
            <div key={s.label} className="hm-stat">
              <span className="hm-stat-num">{typeof s.num === 'number' ? <CountUp to={s.num} /> : s.num}</span>
              <span className="hm-stat-label">{s.label}</span>
              <span className="hm-stat-sub">{s.sub}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ================= TRÍCH DẪN ================= */}
      <section className="hm-wrap hm-section">
        <Head title="Từ những bộ óc vĩ đại" />
        <QuoteStage />
      </section>

      <FaqSection />

      {/* ================= CTA — 3 CARD: VIP | CHÍNH | QR ================= */}
      <section className="cta-grid">

        <aside className="cta-side vip-card">
          <div className="cta-side-head">
            <span className="cta-side-badge">VIP</span>
            <h3>Gói VIP</h3>
          </div>
          <p className="cta-side-desc">
            Đang chuẩn bị: hỏi AI không giới hạn, bộ đề chuyên sâu theo lớp và xử lý ưu tiên.
          </p>
          <ul className="vip-list">
            <li>✓ Hỏi AI không giới hạn</li>
            <li>✓ Ưu tiên xử lý nhanh</li>
            <li>✓ Bộ đề theo lớp</li>
            <li>✓ Không quảng cáo</li>
          </ul>
          <button className="btn primary cta-side-btn" type="button" disabled>Sắp ra mắt</button>
          <span className="cta-side-note">Sẽ mở đăng ký trong thời gian tới</span>
        </aside>

        <div className="cta-card">
          <div className="cta-mark">
            <AIMark look mode="talk" />
          </div>
          <p className="slogan center" style={{ justifyContent: 'center' }}>
            Bắt đầu ngay — miễn phí cho học sinh
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
            <a className="btn primary" href="#ai">Hỏi AI ngay</a>
            <a className="btn" href="#table">Bảng tuần hoàn</a>
            <a className="btn" href="#games">Chơi game</a>
          </div>
        </div>

        <aside className="cta-side qr-card">
          <div className="cta-side-head">
            <span className="cta-side-badge heart">♥</span>
            <h3>Ủng hộ dự án</h3>
          </div>
          <p className="cta-side-desc">
            Quét mã QR để ủng hộ mình duy trì server và phát triển thêm tính năng mới.
          </p>
          <div className="qr-box">
            <img src="/img/qr.png" alt="Mã QR ủng hộ dự án" loading="lazy" />
          </div>
          <p className="cta-side-note">Cảm ơn bạn rất nhiều</p>
        </aside>

      </section>
    </>
  );
}