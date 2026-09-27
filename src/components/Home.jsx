import { useState } from 'react';
import PeriodicTable from './PeriodicTable.jsx';

const TOOLS = [
  ['ai', 'Trợ lý AI', 'Chụp đề, hỏi đáp, sinh câu hỏi — gia sư 24/7'],
  ['table', 'Bảng tuần hoàn', '118 nguyên tố, lọc và tìm kiếm tức thì'],
  ['balance', 'Cân bằng PTHH', 'Nhập phương trình, ra hệ số ngay lập tức'],
  ['pomodoro', 'Pomodoro', 'Tập trung sâu, nghỉ đúng lúc'],
  ['exam', 'Kỳ thi', 'Đếm ngược tới ngày quyết định'],
  ['grade', 'Tính điểm', 'Biết cần bao nhiêu để đạt mục tiêu'],
  ['quiz', 'Ôn tập', 'Quiz thông minh, nhớ lâu hơn'],
  ['formulas', 'Công thức nhanh', 'Nhập số, ra đáp án — mol, pH, vô cơ, hữu cơ'],
  ['games', 'Trò chơi', 'Bắt gà, bắn súng, chọn ô — giáo viên tự nhập câu hỏi'],
];

const WORDS = ['Hiđro', 'Oxi', 'Cacbon', 'Vàng', 'Sắt', 'Neon', 'Silic', 'Heli', 'Natri', 'Bạc'];

const QUICK_PROMPTS = [
  { icon: '⚖️', text: 'Giải thích định luật bảo toàn khối lượng' },
  { icon: '🧪', text: 'Sinh 5 câu hỏi về bảng tuần hoàn' },
  { icon: '📊', text: 'Cách cân bằng phương trình Fe + O2' },
  { icon: '📐', text: 'Giải thích công thức tính pH' },
];

const CLASSES = ['Lớp 10', 'Lớp 11', 'Lớp 12', 'Đại học'];

const MANIFESTO = [
  {
    num: '01',
    title: 'Học',
    body: 'Bảng tuần hoàn tương tác, công thức nhanh, phân tích hợp chất — mọi thứ bạn cần để hiểu Hóa học từ gốc.',
  },
  {
    num: '02',
    title: 'Luyện',
    body: 'Quiz thông minh theo phương pháp lặp lại ngắt quãng. Nhớ lâu hơn, quên ít hơn, không cần cày cuốc.',
  },
  {
    num: '03',
    title: 'Hỏi',
    body: 'Trợ lý AI giải đề, giảng lý thuyết, sinh câu hỏi ôn tập. Như có gia sư riêng 24/7, miễn phí.',
  },
];

const STATS = [
  { num: 'AI', label: 'Trợ lý', sub: 'Miễn phí 24/7' },
  { num: '118', label: 'Nguyên tố', sub: 'Bảng tuần hoàn đầy đủ' },
  { num: '9', label: 'Công cụ', sub: 'Từ mol tới pH' },
  { num: '3', label: 'Trò chơi', sub: 'Tương tác vui' },
];

const QUOTES = [
  {
    text: 'Không có gì mất đi, không có gì được tạo ra, mọi thứ chỉ biến đổi.',
    author: 'Antoine Lavoisier',
    role: 'Cha đẻ Hóa học hiện đại',
  },
  {
    text: 'Hóa học là môn học của sự thay đổi và biến hóa không ngừng.',
    author: 'Marie Curie',
    role: 'Nobel Vật lý & Hóa học',
  },
  {
    text: 'Điều quan trọng là không ngừng đặt câu hỏi. Tò mò là gốc của mọi tri thức.',
    author: 'Albert Einstein',
    role: 'Nobel Vật lý',
  },
];

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [grade, setGrade] = useState('Lớp 11');

  const loop = [...WORDS, ...WORDS];

  const goToAI = (text) => {
    const q = (text ?? prompt).trim();
    if (!q) return;
    try {
      localStorage.setItem('cs-ai-pending', JSON.stringify({ text: q, grade, t: Date.now() }));
    } catch {}
    location.hash = 'ai';
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      goToAI();
    }
  };

  return (
    <>
      {/* ================= HERO ================= */}
      <section className="hero-home">
        <div className="hero-home-inner">
          <p className="hero-home-slogan">
            <span className="hero-home-dot">●</span>
            Mới — Trợ lý AI Hóa học
          </p>

          <h1 className="hero-home-title">
            Học <em>Hóa học</em><br />
            thông minh hơn.
          </h1>

          <p className="hero-home-lead">
            Hỏi AI bất cứ điều gì về Hóa học — giải đề, giảng lý thuyết, sinh câu hỏi ôn tập.
          </p>

          {/* Ô CHAT AI */}
          <div className="hero-input-wrap">
            <textarea
              className="hero-input"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={onKey}
              placeholder="Hỏi AI bất cứ điều gì về Hóa học…"
              rows={2}
            />
            <div className="hero-input-bar">
              <div className="hero-input-left">
                <button className="hero-input-btn" type="button" title="Chụp ảnh" onClick={() => goToAI()}>
                  📎
                </button>
                <select
                  className="hero-input-select"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  aria-label="Chọn lớp"
                >
                  {CLASSES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <button
                className="hero-input-send"
                onClick={() => goToAI()}
                disabled={!prompt.trim()}
                type="button"
                aria-label="Gửi"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* QUICK PROMPTS */}
          <div className="hero-quick">
            {QUICK_PROMPTS.map((q, i) => (
              <button
                key={i}
                className="hero-quick-btn"
                onClick={() => goToAI(q.text)}
                type="button"
              >
                <span className="hero-quick-icon">{q.icon}</span>
                <span className="hero-quick-text">{q.text}</span>
              </button>
            ))}
          </div>

          {/* META */}
          <div className="hero-home-meta">
            <span><b>AI</b> trợ lý</span>
            <span><b>118</b> nguyên tố</span>
            <span><b>9</b> công cụ</span>
            <span><b>0đ</b> miễn phí</span>
          </div>
        </div>

        {/* BACKGROUND */}
        <div className="hero-home-bg" aria-hidden="true">
          <div className="hero-home-blob hero-home-blob-1" />
          <div className="hero-home-blob hero-home-blob-2" />
          <div className="hero-home-blob hero-home-blob-3" />
          <div className="hero-home-grid" />
        </div>
      </section>

      {/* ================= MARQUEE ================= */}
      <div className="marq" aria-hidden="true">
        <div>{loop.map((w, i) => <span key={i}>{w}</span>)}</div>
      </div>

      {/* ================= MANIFESTO ================= */}
      <section className="wrap manifesto">
        <p className="slogan">Triết lý</p>
        <h2 className="section-title">
          Ba bước, <em>một hành trình</em>
        </h2>

        <div className="manifesto-grid">
          {MANIFESTO.map((m) => (
            <article key={m.num} className="manifesto-card">
              <div className="manifesto-num">{m.num}</div>
              <h3 className="manifesto-title">{m.title}</h3>
              <p className="manifesto-body">{m.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ================= FEATURED ================= */}
      <section className="wrap featured">
        <div className="featured-head">
          <p className="slogan">Tính năng chính</p>
          <h2 className="section-title">
            Bảng tuần hoàn <em>tương tác</em>
          </h2>
          <p className="lead" style={{ fontSize: '1rem', maxWidth: 620 }}>
            118 nguyên tố với đầy đủ thông tin: khối lượng, cấu hình electron,
            trạng thái, độ âm điện. Lọc theo nhóm, chu kỳ, phân loại — tìm kiếm tức thì.
          </p>
        </div>

        <div className="featured-table">
          <PeriodicTable preview />
        </div>
      </section>

      {/* ================= TOOLS ================= */}
      <section id="tools" className="wrap">
        <p className="slogan" style={{ marginTop: '2rem' }}>Bộ công cụ</p>
        <h2 className="section-title">
          Chín công cụ, <em>một mục tiêu</em>
        </h2>

        <div className="tools">
          {TOOLS.map(([id, title, desc]) => (
            <a key={id} href={'#' + id} className="card tool">
              <h3>{title}</h3>
              <p>{desc}</p>
            </a>
          ))}
        </div>
      </section>

      {/* ================= STATS ================= */}
      <section className="wrap stats-section">
        <div className="stats-grid">
          {STATS.map((s) => (
            <div key={s.label} className="stat-card">
              <span className="stat-num">{s.num}</span>
              <span className="stat-label">{s.label}</span>
              <span className="stat-sub">{s.sub}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ================= QUOTES ================= */}
      <section className="wrap quotes-section">
        <p className="slogan">Trích dẫn</p>
        <h2 className="section-title">
          Từ những <em>bộ óc vĩ đại</em>
        </h2>

        <div className="quotes-grid">
          {QUOTES.map((q, i) => (
            <blockquote key={i} className="quote-card">
              <p className="quote-text">“{q.text}”</p>
              <footer className="quote-footer">
                <b className="quote-author">{q.author}</b>
                <span className="quote-role">{q.role}</span>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="wrap narrow cta-final">
        <p className="slogan center" style={{ justifyContent: 'center' }}>
          Bắt đầu ngay — miễn phí, không cần tài khoản
        </p>
        <h2 className="cta-title">
          Sẵn sàng <em>chinh phục</em><br />
          Hóa học?
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