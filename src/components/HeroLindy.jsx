import { useEffect, useRef, useState } from 'react';
import AIMark from './AIMark.jsx';
import './HeroLindy.css';

/* ============================================================
   DỮ LIỆU
   ============================================================ */

/* Mỗi channel có bộ câu hỏi + trả lời riêng */
const CHANNELS = [
  {
    id: 'troly',
    label: '# trợ-lý-ai',
    members: '2,300 học sinh',
    qa: [
      {
        q: 'Cân bằng giúp mình PTHH: Fe + O₂ → Fe₂O₃',
        a: {
          steps: '1 bước · 2s',
          text: 'Cân bằng xong: 4Fe + 3O₂ → 2Fe₂O₃. Kiểm tra: Fe 4=4, O 6=6 ✓',
        },
      },
      {
        q: 'Tính pH của dung dịch HCl 0,01M',
        a: {
          steps: '1 bước · 2s',
          text: 'HCl là axit mạnh, phân ly hoàn toàn. [H⁺] = 0,01M → pH = -log(0,01) = 2.',
        },
      },
      {
        q: 'Giải thích định luật bảo toàn khối lượng',
        a: {
          steps: '1 bước · 3s',
          text: 'Trong phản ứng hóa học, tổng khối lượng chất tham gia = tổng khối lượng chất tạo thành. Vì nguyên tử chỉ sắp xếp lại, không sinh ra hay mất đi.',
        },
      },
      {
        q: 'Tính số mol của 5,6g Fe (M = 56)',
        a: {
          steps: '1 bước · 1s',
          text: 'n = m / M = 5,6 / 56 = 0,1 mol. Vậy 5,6g Fe có 0,1 mol nguyên tử Fe.',
        },
      },
    ],
  },
  {
    id: 'bangtuầnhoàn',
    label: '# bảng-tuần-hoàn',
    members: '1,850 học sinh',
    qa: [
      {
        q: 'Nguyên tố nào có độ âm điện lớn nhất?',
        a: {
          steps: '1 bước · 2s',
          text: 'Flo (F) có độ âm điện lớn nhất — 3,98 theo thang Pauling. Kế tiếp là Oxi (3,44) và Clo (3,16).',
        },
      },
      {
        q: 'Vì sao kim loại kiềm hoạt động mạnh?',
        a: {
          steps: '2 bước · 4s',
          text: 'Kim loại kiềm (Li, Na, K…) có 1 electron lớp ngoài cùng, dễ nhường để đạt cấu hình bền → tính khử rất mạnh.',
        },
      },
      {
        q: 'Sắt thuộc nhóm nào trong bảng tuần hoàn?',
        a: {
          steps: '1 bước · 1s',
          text: 'Fe (Z=26) thuộc nhóm VIIIB, chu kỳ 4, là kim loại chuyển tiếp. Cấu hình: [Ar]3d⁶4s².',
        },
      },
    ],
  },
  {
    id: 'canbang',
    label: '# cân-bằng-pthh',
    members: '980 học sinh',
    qa: [
      {
        q: 'Cân bằng: Al + HCl → AlCl₃ + H₂',
        a: {
          steps: '1 bước · 3s',
          text: '2Al + 6HCl → 2AlCl₃ + 3H₂. Kiểm tra Al 2=2, H 6=6, Cl 6=6 ✓',
        },
      },
      {
        q: 'Cân bằng: C₃H₈ + O₂ → CO₂ + H₂O',
        a: {
          steps: '1 bước · 4s',
          text: 'C₃H₈ + 5O₂ → 3CO₂ + 4H₂O. C 3=3, H 8=8, O 10=10 ✓',
        },
      },
      {
        q: 'Cân bằng: KMnO₄ + HCl → KCl + MnCl₂ + Cl₂ + H₂O',
        a: {
          steps: '2 bước · 6s',
          text: '2KMnO₄ + 16HCl → 2KCl + 2MnCl₂ + 5Cl₂ + 8H₂O. Đây là phản ứng oxi hóa – khử kinh điển.',
        },
      },
    ],
  },
  {
    id: 'ontap',
    label: '# ôn-tập',
    members: '1,200 học sinh',
    qa: [
      {
        q: 'Sinh 5 câu trắc nghiệm về Este – Lipit',
        a: {
          steps: '5 câu · độ khó tăng dần',
          text: 'Đã tạo xong 5 câu trắc nghiệm Este – Lipit kèm đáp án và giải thích chi tiết.',
          file: { badge: 'QUIZ', title: 'este-lipit-quiz.pdf', sub: '5 câu · có lời giải' },
        },
      },
      {
        q: 'Tóm tắt chương Ancol – Phenol',
        a: {
          steps: '1 bước · 5s',
          text: 'Ancol: R–OH, có nhóm –OH gắn C no. Phenol: C₆H₅–OH, –OH gắn trực tiếp vòng benzen. Phenol có tính axit yếu, tác dụng NaOH; ancol thì không.',
        },
      },
      {
        q: 'Công thức tính số đồng phân ankan?',
        a: {
          steps: '1 bước · 3s',
          text: 'Ankan CₙH₂ₙ₊₂: n=1→1, n=2→1, n=3→1, n=4→2, n=5→3, n=6→5, n=7→9, n=8→18, n=9→35, n=10→75 đồng phân.',
        },
      },
    ],
  },
];

/* Icon app bay */
const Icons = {
  stripe: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18" /></svg>),
  gmail:  (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 7 9-7" /></svg>),
  github: (<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.5.5.09.66-.22.66-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02.8-.22 1.65-.33 2.5-.33.85 0 1.7.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85V21c0 .27.16.59.67.48A10.01 10.01 0 0 0 22 12c0-5.52-4.48-10-10-10z" /></svg>),
  slack:  (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 3v8M9 21v-8M3 9h8M21 9h-8M3 15h8M21 15h-8" /></svg>),
  notion: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 8v8M12 8v8M16 8v8" /></svg>),
  zapier: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19" /></svg>),
};

const FLOATING = [
  { key: 'stripe',  top: '14%', left: '4%',  delay: '0s',    size: 46, rotate: -8 },
  { key: 'gmail',   top: '20%', right: '4%', delay: '-2s',   size: 52, rotate: 6 },
  { key: 'github',  top: '48%', left: '1%',  delay: '-4s',   size: 48, rotate: -5 },
  { key: 'slack',   top: '62%', right: '2%', delay: '-1s',   size: 42, rotate: 10 },
  { key: 'notion',  top: '38%', right: '12%',delay: '-3s',   size: 40, rotate: -6 },
  { key: 'zapier',  top: '30%', left: '16%', delay: '-2.5s', size: 40, rotate: -10 },
];

const AI_NAME = 'CUAI';

export default function HeroLindy() {
  const [activeCh, setActiveCh] = useState(0);
  const [activeQA, setActiveQA] = useState(0);
  const [typing, setTyping] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const timersRef = useRef([]);
  const scrollRef = useRef(null);

  const channel = CHANNELS[activeCh];
  const qa = channel.qa[activeQA];

  /* Khi đổi channel → reset về câu hỏi đầu */
  useEffect(() => {
    setActiveQA(0);
    setShowAnswer(false);
    setTyping(false);
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, [activeCh]);

  /* Khi ấn câu hỏi mới → chạy typing rồi hiện trả lời */
  const askQuestion = (idx) => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setActiveQA(idx);
    setShowAnswer(false);
    setTyping(true);
    timersRef.current.push(
      setTimeout(() => {
        setTyping(false);
        setShowAnswer(true);
      }, 1600)
    );
  };

  /* Auto scroll khi có nội dung mới */
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [showAnswer, typing, activeQA]);

  return (
    <section className="hl-wrap">
      {/* Logo AIMark bên TRÁI — chỉ desktop */}
      <div className="hl-logo hl-logo-left" aria-hidden="true">
        <AIMark size={280} look mode="idle" title="" />
      </div>
      {/* Logo AIMark bên PHẢI — chỉ desktop */}
      <div className="hl-logo hl-logo-right" aria-hidden="true">
        <AIMark size={240} look mode="think" title="" />
      </div>

      {/* Icon bay */}
      <div className="hl-floating" aria-hidden="true">
        {FLOATING.map((f) => (
          <div
            key={f.key}
            className="hl-float-item"
            style={{
              top: f.top, left: f.left, right: f.right,
              '--delay': f.delay,
              '--size': f.size + 'px',
              '--rotate': f.rotate + 'deg',
            }}
          >
            <div className="hl-float-inner">{Icons[f.key]}</div>
          </div>
        ))}
      </div>

      <div className="hl-mockup">
        {/* Sidebar — click đổi channel */}
        <aside className="hl-sidebar">
          <div className="hl-sidebar-head">
            <span>Học Hóa</span>
            <span className="hl-sidebar-dot">·</span>
          </div>
          <p className="hl-sidebar-label">Channels</p>
          <nav>
            {CHANNELS.map((c, i) => (
              <button
                key={c.id}
                type="button"
                className={'hl-nav' + (i === activeCh ? ' on' : '')}
                onClick={() => setActiveCh(i)}
              >
                {c.label}
              </button>
            ))}
            <div className="hl-nav disabled" />
            <div className="hl-nav disabled" />
          </nav>
        </aside>

        {/* Main */}
        <main className="hl-main">
          <header className="hl-main-head">
            <span className="hl-channel">{channel.label}</span>
            <span className="hl-members">{channel.members}</span>
            <div className="hl-avatars">
              <i /><i /><i /><i />
              <span className="hl-more">+99</span>
            </div>
          </header>

          <div className="hl-messages" ref={scrollRef}>
            {/* Câu hỏi hiện tại (user) */}
            <div className="hl-msg show">
              <div className="hl-msg-avatar user blur-1">
                <span className="hl-blob b1" />
                <span className="hl-blob b2" />
                <span className="hl-blob b3" />
              </div>
              <div className="hl-msg-body">
                <div className="hl-msg-meta">
                  <b>Nguyễn Duy Tk</b>
                  <time>8:47 AM</time>
                </div>
                <div className="hl-msg-text">{qa.q}</div>
              </div>
            </div>

            {/* AI đang gõ */}
            {typing && (
              <div className="hl-msg show">
                <div className="hl-msg-avatar ai">
                  <AIMark size={26} animate={false} title={AI_NAME} />
                </div>
                <div className="hl-msg-body">
                  <div className="hl-msg-meta">
                    <b>{AI_NAME}</b>
                    <span className="hl-tag">APP</span>
                  </div>
                  <div className="hl-typing">
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}

            {/* AI trả lời */}
            {showAnswer && (
              <div className="hl-msg show">
                <div className="hl-msg-avatar ai">
                  <AIMark size={26} animate={false} title={AI_NAME} />
                </div>
                <div className="hl-msg-body">
                  <div className="hl-msg-meta">
                    <b>{AI_NAME}</b>
                    <span className="hl-tag">APP</span>
                    <time>8:47 AM</time>
                  </div>
                  {qa.a.steps && <div className="hl-msg-steps">{qa.a.steps}</div>}
                  <div className="hl-msg-text">{qa.a.text}</div>

                  {qa.a.file && (
                    <div className="hl-file">
                      <div className="hl-file-badge">{qa.a.file.badge}</div>
                      <div className="hl-file-info">
                        <b>{qa.a.file.title}</b>
                        <span>{qa.a.file.sub}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Hàng câu hỏi gợi ý — click để đổi */}
          <div className="hl-asks">
            <span className="hl-asks-label">Hỏi nhanh:</span>
            {channel.qa.map((item, i) => (
              <button
                key={i}
                type="button"
                className={'hl-ask' + (i === activeQA ? ' on' : '')}
                onClick={() => askQuestion(i)}
              >
                {item.q}
              </button>
            ))}
          </div>

          <div className="hl-input" role="button" tabIndex={0}>
            <span>Nhắn cho {AI_NAME}…</span>
            <span className="hl-input-send">↑</span>
          </div>
        </main>
      </div>
    </section>
  );
}