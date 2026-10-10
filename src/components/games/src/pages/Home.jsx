import { useState } from 'react';
import { useGreeting } from '../HomePlus.jsx';
import { Button, Card, CardHead, EmptyState, Badge } from '../ui/index.jsx';
import { TOPICS, timeAgo, useProgress } from '../lib/progress.js';
import './home-dashboard.css';

/* ============================================================
   Home.jsx — Trang chủ sau đăng nhập, dạng dashboard.
   Một việc chính: hỏi CUAI. Mọi thứ còn lại để quay lại học tiếp.

     ┌───────────────────────────┬────────────────┐
     │ Chào, {tên}               │                │
     │ [ Ô hỏi CUAI ]            │ Hôm nay        │
     │ 4 lối tắt                 │ (mục tiêu+tuần)│
     │ Học tiếp (gần đây)        │ Nắm vững theo  │
     │                           │ chương         │
     └───────────────────────────┴────────────────┘
   Mobile: một cột, đúng thứ tự trên.
   ============================================================ */

const DOW = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const SUGGEST = ['Cân bằng Fe + O₂ → Fe₂O₃', 'Tóm tắt chương Este – Lipit', 'Vì sao kim loại kiềm hoạt động mạnh?'];

const ico = (d) => (p) => (
  <svg width={p.size || 20} height={p.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);
const IcoCamera = ico(<><path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" /><circle cx="12" cy="12.5" r="3.5" /></>);
const IcoQuiz = ico(<><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7v.5M12 17h.01" /></>);
const IcoBalance = ico(<path d="M12 3v18M3 7h18M7 7l-3 7a3 3 0 0 0 6 0L7 7zM17 7l-3 7a3 3 0 0 0 6 0l-3-7z" />);
const IcoChart = ico(<><path d="M3 3v18h18" /><path d="M7 14l3-3 3 3 5-6" /></>);
const IcoSend = ico(<path d="M12 19V5M5 12l7-7 7 7" />);

/* ---- chuyển sang CUAI, giữ nguyên hợp đồng localStorage cũ ---- */
function goAI(payload) {
  try { localStorage.setItem('cs-ai-pending', JSON.stringify({ ...payload, t: Date.now() })); } catch { /* */ }
  location.hash = 'ai';
}

function Composer() {
  const [val, setVal] = useState('');
  const submit = (e) => { e?.preventDefault(); goAI({ text: val.trim() }); };
  return (
    <form className="db-composer" onSubmit={submit}>
      <label htmlFor="db-ask" className="sr-only">Hỏi CUAI</label>
      <textarea
        id="db-ask" rows={2} value={val} placeholder="Hỏi CUAI một bài Hóa, một khái niệm, hoặc xin 5 câu trắc nghiệm…"
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) submit(e); }}
      />
      <div className="db-composer-bar">
        <div className="db-chips">
          {SUGGEST.map((s) => <button key={s} type="button" onClick={() => setVal(s)}>{s}</button>)}
        </div>
        <Button variant="primary" type="submit" icon aria-label="Gửi cho CUAI"><IcoSend /></Button>
      </div>
    </form>
  );
}

const SHORTCUTS = [
  { href: '#ai', Icon: IcoCamera, label: 'Chụp đề', desc: 'Gửi ảnh cho CUAI', onClick: () => goAI({ action: 'capture' }) },
  { href: '#quiz', Icon: IcoQuiz, label: 'Quiz', desc: 'Luyện nhanh' },
  { href: '#balance', Icon: IcoBalance, label: 'Cân bằng PTHH', desc: 'Từng bước' },
  { href: '#stats', Icon: IcoChart, label: 'Thống kê', desc: 'Tiến độ của bạn' },
];

function Shortcuts() {
  return (
    <nav className="db-shortcuts" aria-label="Lối tắt">
      {SHORTCUTS.map(({ href, Icon, label, desc, onClick }) => (
        <a key={label} href={href} onClick={onClick ? (e) => { e.preventDefault(); onClick(); } : undefined}>
          <Icon /><span><b>{label}</b><small>{desc}</small></span>
        </a>
      ))}
    </nav>
  );
}

function TodayCard({ p }) {
  const pct = Math.min(100, Math.round((p.today / p.goal) * 100));
  return (
    <Card className="db-today">
      <CardHead title="Hôm nay" action={<a href="#settings">Đổi mục tiêu</a>} />
      <p className="db-today-line">
        <b className="num">{p.today}</b><span className="num"> / {p.goal} câu</span>
        {p.streak > 0 && <Badge tone="ok">{p.streak} ngày liên tiếp</Badge>}
      </p>
      <div className="db-bar" role="progressbar" aria-valuemin={0} aria-valuemax={p.goal} aria-valuenow={Math.min(p.today, p.goal)} aria-label="Tiến độ mục tiêu hôm nay">
        <i style={{ width: pct + '%' }} />
      </div>
      <ol className="db-week" aria-label="7 ngày gần nhất">
        {p.week.map((d) => (
          <li key={d.key} className={(d.count ? 'on ' : '') + (d.today ? 'today' : '')}>
            <span className="db-dot" /><small>{DOW[d.dow]}</small>
            <span className="sr-only">{d.count ? `${d.count} câu` : 'chưa học'}</span>
          </li>
        ))}
      </ol>
    </Card>
  );
}

/* Ô chương dạng ô nguyên tố: độ đậm = mức nắm vững; nét đứt = chưa học */
function TopicsCard({ p }) {
  const open = (id) => { try { localStorage.setItem('cs-quiz-topic', id); } catch { /* */ } location.hash = 'quiz'; };
  return (
    <Card className="db-topics">
      <CardHead title="Nắm vững theo chương" />
      <ul>
        {TOPICS.map((t) => {
          const d = p.topics[t.id];
          const pct = d ? Math.round(d.m * 100) : null;
          return (
            <li key={t.id}>
              <button type="button" onClick={() => open(t.id)} className={d ? (pct >= 55 ? 'hi' : '') : 'new'} style={d ? { '--m': pct + '%' } : undefined}
                aria-label={`${t.name}: ${d ? pct + '% — luyện thêm' : 'chưa học — bắt đầu'}`}>
                <small className="num">{d ? pct : '–'}</small>
                <b>{t.abbr}</b>
                <span>{t.name}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function RecentCard({ p }) {
  return (
    <Card className="db-recent">
      <CardHead title="Học tiếp" />
      {p.isEmpty ? (
        <EmptyState
          title="Chưa có hoạt động nào"
          text="Hỏi CUAI một câu hoặc làm vài câu quiz, phần này sẽ giúp bạn quay lại đúng chỗ đang học."
          action={<Button variant="primary" href="#quiz">Làm quiz đầu tiên</Button>}
        />
      ) : (
        <ul>
          {p.recent.slice(0, 5).map((r) => (
            <li key={r.id}>
              <a href={'#' + (r.hash || 'ai')}><span>{r.title}</span><time className="num">{timeAgo(r.t)}</time></a>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default function Home() {
  const { hello, name } = useGreeting();
  const p = useProgress();
  return (
    <div className="db">
      <header className="db-head">
        <h1>{hello}, {name}</h1>
        <p>{p.today >= p.goal ? 'Bạn đã đạt mục tiêu hôm nay.' : `Còn ${p.goal - p.today} câu nữa là đạt mục tiêu hôm nay.`}</p>
      </header>
      <div className="db-grid">
        <div className="db-main">
          <Composer />
          <Shortcuts />
          <RecentCard p={p} />
        </div>
        <aside className="db-side">
          <TodayCard p={p} />
          <TopicsCard p={p} />
        </aside>
      </div>
    </div>
  );
}
