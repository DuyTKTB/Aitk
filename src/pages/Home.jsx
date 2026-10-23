import { useEffect, useState } from 'react';
import AIMark from './AIMark.jsx';
import { askAI, useGreeting } from './HomePlus.jsx';
import { Badge, Button, EmptyState } from '../ui/index.jsx';
import { timeAgo, useProgress } from '../lib/progress.js';
import { elementOfDay } from '../lib/elementOfDay.js';
import { colorOf, eventsOn, toMin, doneKey, fmtDur, useSchedule } from '../lib/schedule.js';
import '../styles/home-apple-bento.css';

/* ============================================================
   Home.jsx — TRANG CHỦ KÍNH MỜ PASTEL KIỂU APPLE
   Bố cục (lưới 12 cột):
   1. Hero ELECAI + ô hỏi nhanh   |  Mục tiêu hôm nay (vòng tiến độ)
   2. 4 tính năng chính (ô lớn)
   3. Hàng nút truy cập nhanh (công cụ)
   4. Lịch hôm nay                |  Tập trung
   5. 4 số liệu học tập
   6. Lộ trình                    |  Nguyên tố của ngày
   7. Học tiếp                    |  Phòng thi & lớp học
   8. Khu trò chơi
   Màu mỗi thẻ truyền qua biến --t (R,G,B) bằng class tone-*.
   ============================================================ */

const DOW = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const SUGGEST = [
  'Cân bằng Fe + O₂ → Fe₂O₃',
  'Tóm tắt Este – Lipit',
  'Vì sao kim loại kiềm hoạt động mạnh?',
];

const ico = (d, sw = 1.9) => ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);
const IcoCamera = ico(<><path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" /><circle cx="12" cy="12.5" r="3.5" /></>);
const IcoQuiz = ico(<><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7v.5M12 17h.01" /></>);
const IcoBalance = ico(<path d="M12 3v18M3 7h18M7 7l-3 7a3 3 0 0 0 6 0L7 7zM17 7l-3 7a3 3 0 0 0 6 0l-3-7z" />);
const IcoChart = ico(<><path d="M3 3v18h18" /><path d="M7 14l3-3 3 3 5-6" /></>);
const IcoSend = ico(<path d="M12 19V5M5 12l7-7 7 7" />, 2.2);
const IcoUsers = ico(<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.4c2.2.6 3.5 2.5 3.5 5.6" /></>);
const IcoLink = ico(<><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>);
const IcoFlame = ico(<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.2 2-4.2.2 1.4.9 2.2 1.7 2.7C10.4 8.6 10.6 5.6 12 3z" />);
const IcoCal = ico(<><rect x="3.5" y="5" width="17" height="15.5" rx="3.5" /><path d="M8 3v4M16 3v4M3.5 10h17" /></>);
const IcoTimer = ico(<><circle cx="12" cy="13.5" r="7.5" /><path d="M12 9.5v4l2.5 1.5M9.5 3h5" /></>);
const IcoGrid = ico(<><rect x="3.5" y="3.5" width="7" height="7" rx="2" /><rect x="13.5" y="3.5" width="7" height="7" rx="2" /><rect x="3.5" y="13.5" width="7" height="7" rx="2" /><rect x="13.5" y="13.5" width="7" height="7" rx="2" /></>);
const IcoGame = ico(<><rect x="2.5" y="7" width="19" height="11" rx="5.5" /><path d="M7.5 10.5v4M5.5 12.5h4M15.5 11.5h.01M18 13.5h.01" /></>);
const IcoSpark = ico(<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z" />);
const IcoPlus = ico(<path d="M12 5v14M5 12h14" />, 2.2);
const IcoArrow = ico(<path d="M7 17L17 7M9 7h8v8" />, 2.2);
const IcoFormula = ico(<><rect x="4" y="3.5" width="16" height="17" rx="3.5" /><path d="M8 8h8M8 12.5h2M13 12.5h3M8 16.5h2M13 16.5h3" /></>);
const IcoMicro = ico(<><path d="M9 3h4l1 6H8l1-6zM11 9v4" /><path d="M6 21h12M8 21c0-3 2-5 5-5a5 5 0 0 0 0-8" /></>);
const IcoNote = ico(<><path d="M6 3.5h9l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19V5A1.5 1.5 0 0 1 6 3.5z" /><path d="M14.5 3.5V8H19M8.5 12.5h7M8.5 16h5" /></>);
const IcoTarget = ico(<><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" /></>);
const IcoCountdown = ico(<><rect x="3.5" y="5" width="17" height="15.5" rx="3.5" /><path d="M8 3v4M16 3v4M3.5 10h17M12 13v3l2 1" /></>);
const IcoBook = ico(<><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15z" /><path d="M4 20.5A2.5 2.5 0 0 0 6.5 22H20v-4" /></>);
const IcoAtom = ico(<><circle cx="12" cy="12" r="1.6" /><ellipse cx="12" cy="12" rx="9" ry="3.6" /><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(60 12 12)" /><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(120 12 12)" /></>, 1.5);

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

/* Tiêu đề thẻ: ô biểu tượng màu + tên + liên kết phụ */
function WTitle({ Icon, title, href, link }) {
  return (
    <div className="bento-widget-title">
      <span className="bento-wt">
        {Icon && <i className="bento-wt-ico"><Icon size={16} /></i>}
        {title}
      </span>
      {href && <a href={href}>{link}</a>}
    </div>
  );
}

/* ============================================================
   1. HERO
   ============================================================ */
function HeroBento({ p, hello, name }) {
  const [val, setVal] = useState('');
  const submit = (e) => {
    e?.preventDefault();
    if (!val.trim()) return;
    goAI({ text: val.trim() });
  };
  const today = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <article className="bento-card bento-hero">
      <div className="bento-hero-orbs" aria-hidden="true"><i /><i /><i /></div>
      <header className="bento-hero-header">
        <div className="bento-ai-avatar">
          <AIMark size={40} animate title="ELECAI Intelligence" />
        </div>
        <div className="bento-hero-title">
          <p className="bento-date">{today}</p>
          <h1>{hello}, {name}</h1>
        </div>
      </header>
      <p className="bento-hero-bubble">{ELECAISays(p)}</p>

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
              <button key={s} type="button" className="bento-chip" onClick={() => setVal(s)}>
                {s}
              </button>
            ))}
          </div>
          <button type="submit" className="bento-send-btn" disabled={!val.trim()} aria-label="Gửi câu hỏi cho ELECAI">
            <IcoSend size={18} />
          </button>
        </div>
      </form>
    </article>
  );
}

/* ============================================================
   2. MỤC TIÊU HÔM NAY
   ============================================================ */
function TodayBento({ p }) {
  const done = p.today >= p.goal;
  const pct = Math.min(100, Math.round((p.today / p.goal) * 100));

  return (
    <article className="bento-card bento-today-widget tone-green">
      <WTitle Icon={IcoTarget} title="Mục tiêu hôm nay" href="#settings" link="Tùy chỉnh" />

      <div className="bento-ring-row">
        <div
          className={`bento-ring ${done ? 'done' : ''}`}
          style={{ '--p': pct }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <b className="num">{p.today}</b>
          <small className="num">/ {p.goal} câu</small>
        </div>
        <div className="bento-ring-text">
          <b>{done ? 'Đã hoàn thành' : `Còn ${p.goal - p.today} câu`}</b>
          <span>{done ? 'Tuyệt vời, giữ nhịp nhé!' : 'để đạt mục tiêu hôm nay'}</span>
          {done && <Badge tone="ok">Hoàn thành</Badge>}
        </div>
      </div>

      <ol className="bento-week-dots" aria-label="7 ngày gần đây">
        {p.week.map((d) => (
          <li key={d.key} className={`bento-week-dot-item ${d.count ? 'active' : ''} ${d.today ? 'today' : ''}`}>
            <div className="bento-dot-circle" title={d.count ? `${d.count} câu` : 'Chưa học'} />
            <small>{DOW[d.dow]}</small>
          </li>
        ))}
      </ol>
    </article>
  );
}

/* ============================================================
   3. BỐN TÍNH NĂNG CHÍNH + HÀNG TRUY CẬP NHANH
   ============================================================ */
const FEATURES = [
  { href: '#ai', Icon: IcoSpark, title: 'Hỏi ELECAI', desc: 'Giải bài và giải thích từng bước', tone: 'purple' },
  { href: '#schedule', Icon: IcoCal, title: 'Thời khóa biểu', desc: 'Tự lập lịch học, nhắc đúng giờ', tone: 'blue' },
  { href: '#quiz', Icon: IcoQuiz, title: 'Quiz nhanh', desc: 'Ôn tập thông minh theo SRS', tone: 'orange' },
  { href: '#pomodoro', Icon: IcoTimer, title: 'Tập trung', desc: 'Pomodoro và đồng hồ học tập', tone: 'pink' },
];

function FeaturesBento() {
  return (
    <section className="bento-features" aria-label="Tính năng chính">
      {FEATURES.map(({ href, Icon, title, desc, tone }) => (
        <a key={title} href={href} className={`bento-feature tone-${tone}`}>
          <span className="bento-feature-go"><IcoArrow size={15} /></span>
          <span className="bento-feature-ico"><Icon size={28} /></span>
          <span className="bento-feature-text">
            <b>{title}</b>
            <small>{desc}</small>
          </span>
        </a>
      ))}
    </section>
  );
}

const QUICK = [
  { href: '#balance', Icon: IcoBalance, label: 'Cân bằng PTHH', tone: 'green' },
  { href: '#table', Icon: IcoGrid, label: 'Bảng tuần hoàn', tone: 'teal' },
  { href: '#formulas', Icon: IcoFormula, label: 'Công thức nhanh', tone: 'blue' },
  { href: '#analyze', Icon: IcoMicro, label: 'Phân tích hợp chất', tone: 'purple' },
  { href: '#games', Icon: IcoGame, label: 'Trò chơi', tone: 'yellow' },
  { href: '#stats', Icon: IcoChart, label: 'Thống kê', tone: 'indigo' },
  { href: '#exam', Icon: IcoCountdown, label: 'Đếm ngược kỳ thi', tone: 'pink' },
  { href: '#grade', Icon: IcoBook, label: 'Tính điểm', tone: 'orange' },
  { href: '#notes', Icon: IcoNote, label: 'Ghi chú', tone: 'teal' },
];

function QuickBento() {
  return (
    <nav className="bento-quick" aria-label="Truy cập nhanh">
      <button type="button" className="bento-qbtn tone-gray" onClick={() => goAI({ action: 'capture' })}>
        <i><IcoCamera size={16} /></i>Chụp đề
      </button>
      {QUICK.map(({ href, Icon, label, tone }) => (
        <a key={label} href={href} className={`bento-qbtn tone-${tone}`}>
          <i><Icon size={16} /></i>{label}
        </a>
      ))}
    </nav>
  );
}

/* ============================================================
   4. LỊCH HÔM NAY (đọc từ Thời khóa biểu)
   ============================================================ */
function ScheduleBento() {
  const { events, done } = useSchedule();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const list = eventsOn(events, now);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const isDone = (ev) => !!done[doneKey(ev.id, now)];
  const doneCount = list.filter(isDone).length;
  const current = list.find((e) => nowMin >= toMin(e.start) && nowMin < toMin(e.end));
  const next = list.find((e) => toMin(e.start) > nowMin);
  const shown = list.filter((e) => toMin(e.end) > nowMin || !isDone(e)).slice(0, 4);
  const pct = list.length ? Math.round((doneCount / list.length) * 100) : 0;

  let headline = 'Chưa có lịch hôm nay';
  let sub = 'Tự lập thời khóa biểu để học đều mỗi ngày.';
  if (current) {
    headline = current.title;
    sub = `Đang diễn ra · còn ${fmtDur(toMin(current.end) - nowMin)}, kết thúc lúc ${current.end}`;
  } else if (next) {
    headline = next.title;
    sub = `Tiếp theo lúc ${next.start} · còn ${fmtDur(toMin(next.start) - nowMin)}`;
  } else if (list.length) {
    headline = 'Bạn đã hết lịch hôm nay';
    sub = `${doneCount}/${list.length} hoạt động đã hoàn thành`;
  }

  return (
    <article className="bento-card bento-schedule tone-blue">
      <WTitle Icon={IcoCal} title="Lịch hôm nay" href="#schedule" link="Mở thời khóa biểu" />

      <div className="bento-sch-top">
        <div className="bento-sch-text">
          <h3>{current && <i className="bento-live" />}{headline}</h3>
          <p>{sub}</p>
        </div>
        {list.length > 0 && (
          <div className="bento-sch-ring" style={{ '--p': pct }} aria-label={`Hoàn thành ${pct}%`}>
            <b className="num">{pct}%</b>
          </div>
        )}
      </div>

      {list.length === 0 ? (
        <a className="bento-sch-empty" href="#schedule">
          <span><IcoPlus size={18} /></span>
          Tạo thời khóa biểu đầu tiên
        </a>
      ) : (
        <ul className="bento-sch-list">
          {shown.map((ev) => (
            <li
              key={ev.id}
              className={`${ev === current ? 'live' : ''} ${isDone(ev) ? 'done' : ''}`}
              style={{ '--t': colorOf(ev.color).rgb }}
            >
              <i />
              <time className="num">{ev.start}</time>
              <span>{ev.title}</span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

/* ============================================================
   5. TẬP TRUNG
   ============================================================ */
function FocusBento() {
  const { events } = useSchedule();
  return (
    <article className="bento-card bento-focus tone-pink">
      <WTitle Icon={IcoTimer} title="Tập trung" href="#pomodoro" link="Clock Hub" />
      <div className="bento-focus-body">
        <div className="bento-focus-time" aria-hidden="true">
          <b className="num">25</b>
          <small>phút</small>
        </div>
        <div>
          <h3>Học theo nhịp 25 phút</h3>
          <p>Bật Pomodoro để giữ nhịp học và nghỉ, rồi đánh dấu xong từng mục trong lịch.</p>
        </div>
      </div>
      <div className="bento-focus-actions">
        <a className="bento-pill-btn primary" href="#pomodoro">Bắt đầu tập trung</a>
        <a className="bento-pill-btn" href="#schedule">{events.length ? 'Xem lịch' : 'Lập lịch'}</a>
      </div>
    </article>
  );
}

/* ============================================================
   6. SỐ LIỆU HỌC TẬP
   ============================================================ */
function Spark({ week }) {
  const max = Math.max(1, ...week.map((d) => d.count));
  const pts = week.map((d, i) => `${(i / 6) * 100},${28 - (d.count / max) * 24}`).join(' ');
  return (
    <svg className="bento-spark" viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StatsBento({ p }) {
  const nextText = p.lv.next ? `${p.xp}/${p.lv.next.xp} XP` : `${p.xp} XP`;

  return (
    <section className="bento-stats-strip" aria-label="Thống kê học tập">
      <div className="bento-stat-box tone-orange">
        <span className="bento-stat-label">Chuỗi ngày</span>
        <div className="bento-stat-val num"><IcoFlame size={26} /> {p.streak}</div>
        <span className="bento-stat-sub">{p.streak ? 'ngày liên tiếp' : 'Học hôm nay để bắt đầu'}</span>
      </div>

      <div className="bento-stat-box tone-green">
        <span className="bento-stat-label">Độ chính xác</span>
        <div className="bento-stat-val num">{p.accuracy === null ? '–' : `${p.accuracy}%`}</div>
        <span className="bento-stat-sub num">{p.answered ? `${p.answered} câu đã giải` : 'Chưa có dữ liệu'}</span>
      </div>

      <div className="bento-stat-box tone-blue">
        <span className="bento-stat-label">7 ngày qua</span>
        <div className="bento-stat-val num">
          {p.week.reduce((a, d) => a + d.count, 0)} <small>câu</small>
        </div>
        <Spark week={p.week} />
      </div>

      <div className="bento-stat-box tone-purple">
        <span className="bento-stat-label">Cấp độ {p.lv.lvl}</span>
        <div className="bento-stat-val bento-stat-val--text">{p.lv.title}</div>
        <span className="bento-stat-sub num">{nextText}</span>
      </div>
    </section>
  );
}

/* ============================================================
   7. LỘ TRÌNH THEO LỚP
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
    <article className="bento-card bento-roadmap tone-purple">
      <WTitle Icon={IcoBook} title="Lộ trình kiến thức" />

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

      <p className="bento-road-goal">{r.goal}</p>

      <div className="bento-topic-pills">
        {r.topics.map((t, i) => (
          <button
            key={t}
            type="button"
            className="bento-topic-btn"
            onClick={() => askAI(`Tóm tắt kiến thức trọng tâm chương "${t}" Hóa học ${grade} kèm 3 câu hỏi trắc nghiệm ôn tập`, grade)}
          >
            <span className="num">{i + 1}</span> {t}
          </button>
        ))}
      </div>
    </article>
  );
}

/* ============================================================
   8. NGUYÊN TỐ CỦA NGÀY
   ============================================================ */
function ElementBento() {
  const e = elementOfDay();

  return (
    <article className="bento-card bento-element-card tone-teal">
      <WTitle Icon={IcoAtom} title="Nguyên tố của ngày" href="#table" link="Bảng tuần hoàn" />

      <div className="bento-el-badge">
        <div className="bento-el-symbol-box">
          <small>{e.z}</small>
          <b>{e.s}</b>
          <span>{e.m}</span>
        </div>
        <div className="bento-el-details">
          <h3>{e.n}</h3>
          <p>{e.fact}</p>
        </div>
      </div>
    </article>
  );
}

/* ============================================================
   9. HỌC TIẾP
   ============================================================ */
function RecentBento({ p }) {
  return (
    <article className="bento-card bento-recent tone-blue">
      <WTitle Icon={IcoSpark} title="Học tiếp" href="#quiz" link="Kho đề Quiz" />
      {p.isEmpty ? (
        <EmptyState
          title="Chưa có hoạt động nào"
          text="Hỏi ELECAI một câu hoặc làm bài quiz đầu tiên để bắt đầu lưu lại tiến trình học tập của bạn."
          action={<Button variant="primary" href="#quiz">Làm quiz đầu tiên</Button>}
        />
      ) : (
        <ul className="bento-recent-list">
          {p.recent.slice(0, 4).map((r) => (
            <li key={r.id}>
              <a href={'#' + (r.hash || 'ai')}>
                <span>{r.title}</span>
                <time className="num">{timeAgo(r.t)}</time>
              </a>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

/* ============================================================
   10. PHÒNG THI & LỚP HỌC
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
    <article className="bento-card bento-classroom tone-orange">
      <WTitle Icon={IcoUsers} title="Phòng thi và lớp học" href="#my-classes" link="Lớp của tôi" />
      <p className="bento-note">Dán đường link đề thi giáo viên gửi để bắt đầu làm bài ngay.</p>

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
        {err && <p className="bento-err">{err}</p>}
      </form>

      <a href="#my-classes" className="bento-text-link">
        Hoặc tham gia lớp học bằng mã lớp
      </a>
    </article>
  );
}

/* ============================================================
   11. TRÒ CHƠI
   ============================================================ */
const GAME_LIST = [
  ['chicken', 'Bắt gà 3D', 'yellow'],
  ['slingshot', 'Ná cao su', 'orange'],
  ['jeopardy', 'Jeopardy', 'blue'],
  ['lab', 'Phòng lab ảo', 'teal'],
  ['battle', 'Đấu nguyên tố', 'pink'],
  ['sudoku', 'Sudoku Hóa', 'purple'],
];

function GamesBento() {
  return (
    <article className="bento-card bento-games tone-yellow">
      <WTitle Icon={IcoGame} title="Khu trò chơi Hóa học" href="#games" link="Xem tất cả" />
      <div className="bento-games-grid">
        {GAME_LIST.map(([id, name, tone]) => (
          <a key={id} href={'#games/' + id} className={`bento-game-pill tone-${tone}`}>
            <i />{name}
          </a>
        ))}
      </div>
    </article>
  );
}

/* ============================================================
   TRANG CHỦ
   ============================================================ */
export default function Home() {
  const { hello, name } = useGreeting();
  const p = useProgress();

  return (
    <div className="db-bento-wrap">
      <div className="db-bento-ambient" aria-hidden="true" />
      <div className="bento-grid">
        <HeroBento p={p} hello={hello} name={name} />
        <TodayBento p={p} />

        <FeaturesBento />
        <QuickBento />

        <ScheduleBento />
        <FocusBento />

        <StatsBento p={p} />

        <RoadmapBento />
        <ElementBento />

        <RecentBento p={p} />
        <ClassroomBento />

        <GamesBento />
      </div>
    </div>
  );
}