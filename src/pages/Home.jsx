import { useState } from 'react';
import AIMark from './AIMark.jsx';
import { askAI, useGreeting } from './HomePlus.jsx';
import { Badge, Button, EmptyState } from '../ui/index.jsx';
import { timeAgo, useProgress } from '../lib/progress.js';
import { elementOfDay } from '../lib/elementOfDay.js';
import ElecCrew from '../components/ElecCrew.jsx';
import '../styles/home-apple-bento.css';

/* ============================================================
   Home.jsx — DASHBOARD BENTO GRID CHUẨN APPLE KEYNOTE
   Thiết kế 12 cột Bento Grid:
   1. Hero Bento (Apple Intelligence Greeting & Prompt Bar)
   2. Today Fitness Widget (Tiến độ & 7 ngày Activity)
   3. Quick Shortcuts (4 ô Squircle)
   4. Stats Strip (4 ô số liệu)
   5. Roadmap Bento (Lộ trình phân lớp với iOS Segmented Control)
   6. Element of the Day (Thẻ titan Apple Card)
   7. Classroom & Exam Hub (Vào phòng thi)
   8. Game Hub (Khu trò chơi Hóa học)
   ============================================================ */

const DOW = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const SUGGEST = [
  'Cân bằng Fe + O₂ → Fe₂O₃',
  'Tóm tắt Este – Lipit',
  'Vì sao kim loại kiềm hoạt động mạnh?',
];

const ico = (d) => ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);
const IcoCamera = ico(<><path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" /><circle cx="12" cy="12.5" r="3.5" /></>);
const IcoQuiz = ico(<><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7v.5M12 17h.01" /></>);
const IcoBalance = ico(<path d="M12 3v18M3 7h18M7 7l-3 7a3 3 0 0 0 6 0L7 7zM17 7l-3 7a3 3 0 0 0 6 0l-3-7z" />);
const IcoChart = ico(<><path d="M3 3v18h18" /><path d="M7 14l3-3 3 3 5-6" /></>);
const IcoSend = ico(<path d="M12 19V5M5 12l7-7 7 7" />);
const IcoUsers = ico(<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.4c2.2.6 3.5 2.5 3.5 5.6" /></>);
const IcoLink = ico(<><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>);
const IcoFlame = ico(<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.2 2-4.2.2 1.4.9 2.2 1.7 2.7C10.4 8.6 10.6 5.6 12 3z" />);

function goAI(payload) {
  try {
    localStorage.setItem('cs-ai-pending', JSON.stringify({ ...payload, t: Date.now() }));
  } catch { /* */ }
  location.hash = 'ai';
}

function ELECAISays(p) {
  const left = p.goal - p.today;
  if (p.isEmpty) return 'Mình là ELECAI. Đặt câu hỏi Hóa học bất kỳ để bắt đầu buổi học nhé.';
  if (p.today >= p.goal) return 'Bạn đã hoàn thành xuất sắc mục tiêu hôm nay! Thử thêm bài thử thách không?';
  if (p.today === 0 && p.streak >= 3) return `Chuỗi ${p.streak} ngày đang chờ bạn. Làm vài câu để giữ lửa nhé!`;
  if (p.today > 0) return `Chỉ còn ${left} câu nữa là hoàn thành mục tiêu ngày. Cố lên nhé!`;
  const h = new Date().getHours();
  return h < 11
    ? 'Buổi sáng là thời điểm não bộ tiếp thu kiến thức tốt nhất. Bắt đầu ngay thôi!'
    : h < 18
    ? 'Hôm nay bạn muốn cùng ELECAI ôn luyện chương nào?'
    : 'Ôn nhẹ một vài kiến thức trọng tâm trước khi nghỉ ngơi nhé.';
}

/* ============================================================
   BENTO 1: HERO APPLE INTELLIGENCE (Banner & Prompt Bar)
   ============================================================ */
function HeroBento({ p, hello, name }) {
  const [val, setVal] = useState('');
  const submit = (e) => {
    e?.preventDefault();
    if (!val.trim()) return;
    goAI({ text: val.trim() });
  };

  return (
    <article className="bento-card bento-hero">
      <div className="bento-hero-header">
        <div className="bento-ai-avatar">
          <AIMark size={38} animate title="ELECAI Intelligence" />
        </div>
        <div className="bento-hero-title">
          <h1>{hello}, {name}</h1>
          <p className="bento-hero-bubble">{ELECAISays(p)}</p>
        </div>
      </div>

      <form className="bento-composer" onSubmit={submit}>
        <label htmlFor="bento-ask-input" className="sr-only">Hỏi ELECAI</label>
        <textarea
          id="bento-ask-input"
          rows={2}
          value={val}
          placeholder="Hỏi bài tập Hóa, cân bằng phương trình, giải thích hiện tượng hoặc xin đề trắc nghiệm…"
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) submit(e);
          }}
        />
        <div className="bento-composer-footer">
          <div className="bento-chips-list">
            {SUGGEST.map((s) => (
              <button
                key={s}
                type="button"
                className="bento-chip"
                onClick={() => setVal(s)}
              >
                {s}
              </button>
            ))}
          </div>
          <button
            type="submit"
            className="bento-send-btn"
            disabled={!val.trim()}
            aria-label="Gửi câu hỏi cho ELECAI"
          >
            <IcoSend size={18} />
          </button>
        </div>
      </form>
    </article>
  );
}

/* ============================================================
   BENTO 2: FITNESS & ACTIVITY TRACKER (Hôm nay)
   ============================================================ */
function TodayBento({ p }) {
  const done = p.today >= p.goal;
  const pct = Math.min(100, Math.round((p.today / p.goal) * 100));

  return (
    <article className="bento-card bento-today-widget">
      <div>
        <div className="bento-widget-title">
          <span>Mục tiêu hôm nay</span>
          <a href="#settings">Tùy chỉnh</a>
        </div>
        <div className="bento-today-score">
          <b className="num">{p.today}</b>
          <span className="num">/ {p.goal} câu</span>
          {done && <Badge tone="ok">Hoàn thành</Badge>}
        </div>
        <div className="bento-progress-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className={`bento-progress-fill ${done ? 'done' : ''}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div>
        <div className="bento-widget-title" style={{ marginBottom: '0.5rem' }}>
          <span>Chuỗi hoạt động 7 ngày</span>
        </div>
        <ol className="bento-week-dots">
          {p.week.map((d) => (
            <li
              key={d.key}
              className={`bento-week-dot-item ${d.count ? 'active' : ''} ${d.today ? 'today' : ''}`}
            >
              <div className="bento-dot-circle" title={d.count ? `${d.count} câu` : 'Chưa học'} />
              <small>{DOW[d.dow]}</small>
            </li>
          ))}
        </ol>
      </div>
    </article>
  );
}

/* ============================================================
   BENTO 3: 4 SHORTCUT CAPSULES
   ============================================================ */
const SHORTCUTS = [
  { href: '#ai', Icon: IcoCamera, label: 'Chụp đề AI', desc: 'Nhận diện & giải bài bằng ảnh', onClick: () => goAI({ action: 'capture' }) },
  { href: '#quiz', Icon: IcoQuiz, label: 'Quiz nhanh', desc: 'Luyện tập thông minh SRS' },
  { href: '#balance', Icon: IcoBalance, label: 'Cân bằng PTHH', desc: 'Giải đại số từng bước' },
  { href: '#stats', Icon: IcoChart, label: 'Thống kê', desc: 'Theo dõi sự tiến bộ' },
];

function ShortcutsBento() {
  return (
    <section className="bento-shortcuts-row" aria-label="Lối tắt truy cập nhanh">
      {SHORTCUTS.map(({ href, Icon, label, desc, onClick }) => (
        <a
          key={label}
          href={href}
          className="bento-shortcut-item"
          onClick={onClick ? (e) => { e.preventDefault(); onClick(); } : undefined}
        >
          <div className="bento-shortcut-icon">
            <Icon size={22} />
          </div>
          <div className="bento-shortcut-info">
            <b>{label}</b>
            <small>{desc}</small>
          </div>
        </a>
      ))}
    </section>
  );
}

/* ============================================================
   BENTO 4: STATS STRIP
   ============================================================ */
function Spark({ week }) {
  const max = Math.max(1, ...week.map((d) => d.count));
  const pts = week.map((d, i) => `${(i / 6) * 100},${28 - (d.count / max) * 24}`).join(' ');
  return (
    <svg style={{ width: '100%', height: '24px' }} viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={pts} fill="none" stroke="var(--acc)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StatsBento({ p }) {
  const nextText = p.lv.next ? `${p.xp}/${p.lv.next.xp} XP` : `${p.xp} XP`;

  return (
    <section className="bento-stats-strip" aria-label="Thống kê học tập">
      <div className="bento-stat-box">
        <span className="bento-stat-label">Chuỗi ngày (Streak)</span>
        <div className="bento-stat-val streak num">
          <IcoFlame size={24} /> {p.streak}
        </div>
        <span className="bento-stat-sub">{p.streak ? 'ngày liên tiếp duy trì' : 'Học hôm nay để bắt đầu'}</span>
      </div>

      <div className="bento-stat-box">
        <span className="bento-stat-label">Độ chính xác</span>
        <div className="bento-stat-val num">
          {p.accuracy === null ? '–' : `${p.accuracy}%`}
        </div>
        <span className="bento-stat-sub num">{p.answered ? `${p.answered} câu đã giải` : 'Chưa có dữ liệu'}</span>
      </div>

      <div className="bento-stat-box">
        <span className="bento-stat-label">7 ngày qua</span>
        <div className="bento-stat-val num">
          {p.week.reduce((a, d) => a + d.count, 0)} <small style={{ fontSize: '0.9rem', color: 'var(--mut)' }}>câu</small>
        </div>
        <Spark week={p.week} />
      </div>

      <div className="bento-stat-box">
        <span className="bento-stat-label">Cấp độ {p.lv.lvl}</span>
        <div className="bento-stat-val" style={{ fontSize: '1.3rem' }}>
          {p.lv.title}
        </div>
        <span className="bento-stat-sub num">{nextText}</span>
      </div>
    </section>
  );
}

/* ============================================================
   BENTO 5: ROADMAP THEO LỚP (iOS Segmented Control)
   ============================================================ */
const ROAD = {
  'Lớp 10': { goal: 'Vững nền tảng: Cấu tạo nguyên tử, bảng tuần hoàn, liên kết và phản ứng.', topics: ['Cấu tạo nguyên tử', 'Bảng tuần hoàn', 'Liên kết hóa học', 'Phản ứng oxi hóa – khử', 'Năng lượng hóa học', 'Tốc độ phản ứng', 'Nhóm halogen'] },
  'Lớp 11': { goal: 'Mở rộng sang cân bằng hóa học, nitơ – lưu huỳnh và hóa hữu cơ.', topics: ['Cân bằng hóa học', 'Nitơ và lưu huỳnh', 'Đại cương hóa hữu cơ', 'Hiđrocacbon', 'Ancol và phenol', 'Anđehit – axit cacboxylic'] },
  'Lớp 12': { goal: 'Về đích: Hệ thống kiến thức, luyện đề thi tốt nghiệp THPT Quốc gia.', topics: ['Este – lipit', 'Cacbohiđrat', 'Amin, protein', 'Polime', 'Pin điện & điện phân', 'Đại cương kim loại', 'Nhôm & kiềm thổ', 'Sắt & hợp chất'] },
  'Đại học': { goal: 'Nâng lên tư duy định lượng: Nhiệt động, động hóa học và hóa phân tích.', topics: ['Hóa đại cương', 'Nhiệt động hóa học', 'Động hóa học', 'Cân bằng ion', 'Hóa phân tích'] },
};
const GRADE_KEY = 'cs-home-grade';
function readGrade() {
  try {
    const g = localStorage.getItem(GRADE_KEY);
    return ROAD[g] ? g : 'Lớp 11';
  } catch {
    return 'Lớp 11';
  }
}

function RoadmapBento() {
  const [grade, setGrade] = useState(readGrade);
  const pick = (g) => {
    setGrade(g);
    try { localStorage.setItem(GRADE_KEY, g); } catch { /* */ }
  };
  const r = ROAD[grade];

  return (
    <article className="bento-card bento-roadmap">
      <div className="bento-widget-title">
        <span>Lộ trình kiến thức</span>
        <span style={{ textTransform: 'none', color: 'var(--mut)', fontSize: '0.8rem' }}>Chọn khối lớp</span>
      </div>

      <div className="bento-segmented-control" role="tablist">
        {Object.keys(ROAD).map((g) => (
          <button
            key={g}
            type="button"
            role="tab"
            aria-selected={g === grade}
            className={`bento-segmented-btn ${g === grade ? 'active' : ''}`}
            onClick={() => pick(g)}
          >
            {g}
          </button>
        ))}
      </div>

      <p style={{ margin: '0.25rem 0 0.75rem', fontSize: 'var(--fs-sm)', color: 'var(--mut)', lineHeight: 1.5 }}>
        {r.goal}
      </p>

      <div className="bento-topic-pills">
        {r.topics.map((t, i) => (
          <button
            key={t}
            type="button"
            className="bento-topic-btn"
            onClick={() => askAI(`Tóm tắt kiến thức trọng tâm chương "${t}" Hóa học ${grade} kèm 3 câu hỏi trắc nghiệm ôn tập`, grade)}
          >
            <span className="num">{i + 1}.</span> {t}
          </button>
        ))}
      </div>
    </article>
  );
}

/* ============================================================
   BENTO 6: ELEMENT OF THE DAY (Titanium Apple Card)
   ============================================================ */
function ElementBento() {
  const e = elementOfDay();

  return (
    <article className="bento-card bento-element-card">
      <div className="bento-widget-title">
        <span>Nguyên tố của ngày</span>
        <a href="#table">Xem bảng tuần hoàn →</a>
      </div>

      <div className="bento-el-badge">
        <div className="bento-el-symbol-box">
          <small>{e.z}</small>
          <b>{e.s}</b>
          <span>{e.m}</span>
        </div>
        <div className="bento-el-details">
          <h3>{e.n} ({e.s})</h3>
          <p>{e.fact}</p>
        </div>
      </div>
    </article>
  );
}

/* ============================================================
   BENTO 7: CLASSROOM & EXAM CARD
   ============================================================ */
function parseExamToken(raw) {
  const m = /exam\/([^\s?#/]+)/i.exec(raw || '');
  return m ? decodeURIComponent(m[1]) : null;
}

function ClassroomBento() {
  const [val, setVal] = useState('');
  const [err, setErr] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const t = parseExamToken(val);
    if (!t) {
      setErr('Chưa nhận ra link đề thi hợp lệ.');
      return;
    }
    setErr('');
    location.hash = 'exam/' + t;
  };

  return (
    <article className="bento-card bento-classroom">
      <div className="bento-widget-title">
        <span>Phòng thi & Lớp học</span>
        <a href="#my-classes">Lớp của tôi</a>
      </div>
      <p style={{ margin: 0, fontSize: 'var(--fs-xs)', color: 'var(--mut)' }}>
        Dán đường link đề thi giáo viên gửi để bắt đầu làm bài ngay:
      </p>

      <form onSubmit={submit}>
        <div className="bento-input-pill">
          <IcoLink size={18} />
          <input
            type="text"
            inputMode="url"
            autoComplete="off"
            value={val}
            placeholder="Dán link đề cô giáo gửi..."
            onChange={(e) => { setVal(e.target.value); if (err) setErr(''); }}
          />
          <button type="submit" disabled={!val.trim()}>Vào thi</button>
        </div>
        {err && <p style={{ color: 'var(--err)', fontSize: '0.75rem', margin: '0 0 0.5rem' }}>{err}</p>}
      </form>

      <a
        href="#my-classes"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--acc)', fontSize: 'var(--fs-xs)', textDecoration: 'none', fontWeight: 500 }}
      >
        <IcoUsers size={16} /> Hoặc tham gia lớp học bằng mã lớp
      </a>
    </article>
  );
}

/* ============================================================
   BENTO 8: GAME HUB
   ============================================================ */
const GAME_LIST = [
  ['chicken', 'Bắt gà 3D'],
  ['slingshot', 'Ná cao su'],
  ['jeopardy', 'Jeopardy'],
  ['lab', 'Phòng lab ảo'],
  ['battle', 'Đấu nguyên tố'],
  ['sudoku', 'Sudoku Hóa'],
];

function GamesBento() {
  return (
    <article className="bento-card bento-games">
      <div className="bento-widget-title">
        <span>Khu trò chơi Hóa học</span>
        <a href="#games">Xem tất cả 7 game →</a>
      </div>
      <div className="bento-games-grid">
        {GAME_LIST.map(([id, name]) => (
          <a key={id} href={'#games/' + id} className="bento-game-pill">
            {name}
          </a>
        ))}
      </div>
    </article>
  );
}

/* ============================================================
   BENTO 9: RECENT & REVIEW (Học tiếp & Câu sai)
   ============================================================ */
function RecentBento({ p }) {
  return (
    <article className="bento-card col-span-7">
      <div className="bento-widget-title">
        <span>Học tiếp</span>
        <a href="#quiz">Kho đề Quiz</a>
      </div>
      {p.isEmpty ? (
        <EmptyState
          title="Chưa có hoạt động nào"
          text="Hỏi ELECAI một câu hoặc làm bài quiz đầu tiên để bắt đầu lưu lại tiến trình học tập của bạn."
          action={<Button variant="primary" href="#quiz">Làm quiz đầu tiên</Button>}
        />
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {p.recent.slice(0, 4).map((r) => (
            <li key={r.id}>
              <a
                href={'#' + (r.hash || 'ai')}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--r-md)',
                  background: 'var(--surface-2)',
                  color: 'var(--ink)',
                  textDecoration: 'none',
                  fontSize: 'var(--fs-sm)',
                  transition: 'background var(--dur-1) var(--ease)',
                }}
              >
                <span style={{ fontWeight: 500 }}>{r.title}</span>
                <time className="num" style={{ fontSize: 'var(--fs-xs)', color: 'var(--mut)' }}>{timeAgo(r.t)}</time>
              </a>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

/* ============================================================
   BENTO 10: QUICK TOOLS LIST
   ============================================================ */
const TOOL_LIST = [
  ['#table', 'Bảng tuần hoàn'],
  ['#formulas', 'Công thức nhanh'],
  ['#analyze', 'Phân tích hợp chất'],
  ['#balance', 'Cân bằng PTHH'],
  ['#pomodoro', 'Clock Hub'],
  ['#exam', 'Đếm ngược kỳ thi'],
  ['#grade', 'Tính điểm GPA'],
  ['#notes', 'Ghi chú học tập'],
];

function ToolsBento() {
  return (
    <article className="bento-card col-span-5">
      <div className="bento-widget-title">
        <span>Bộ công cụ tiện ích</span>
        <a href="#tools">Tất cả công cụ →</a>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginTop: '0.25rem' }}>
        {TOOL_LIST.map(([href, name]) => (
          <a
            key={href}
            href={href}
            style={{
              padding: '0.55rem 0.75rem',
              borderRadius: 'var(--r-md)',
              background: 'var(--surface-2)',
              color: 'var(--ink)',
              textDecoration: 'none',
              fontSize: 'var(--fs-xs)',
              fontWeight: 500,
              textAlign: 'center',
              transition: 'all var(--dur-1) var(--ease)',
            }}
          >
            {name}
          </a>
        ))}
      </div>
    </article>
  );
}

/* ============================================================
   MAIN EXPORT: DASHBOARD BENTO GRID
   ============================================================ */
export default function Home() {
  const { hello, name } = useGreeting();
  const p = useProgress();

  return (
    <div className="db-bento-wrap">
      <div className="db-bento-ambient" aria-hidden="true" />
      <div className="bento-grid">
        {/* Hàng 1: Hero Apple Intelligence (8 cột) + Today Widget (4 cột) */}
        <HeroBento p={p} hello={hello} name={name} />
        <TodayBento p={p} />

        {/* Hàng 2: 4 Lối tắt Squircle (12 cột) */}
        <ShortcutsBento />

        {/* Hàng 3: 4 Ô số liệu học tập (12 cột) */}
        <StatsBento p={p} />

        {/* Hàng 4: Lộ trình khối lớp (7 cột) + Nguyên tố hôm nay (5 cột) */}
        <RoadmapBento />
        <ElementBento />

        {/* Hàng 5: Lớp học & Phòng thi (6 cột) + Khu trò chơi (6 cột) */}
        <ClassroomBento />
        <GamesBento />

        {/* Hàng 6: Học tiếp (7 cột) + Công cụ (5 cột) */}
        <RecentBento p={p} />
        <ToolsBento />
      </div>
      {/* Đội linh vật Elec: đi lại, vẫy tay, nhảy múa dọc đáy trang */}
      <ElecCrew />
    </div>
  );
}