import { useState } from 'react';
import AIMark from './AIMark.jsx';
import { useGreeting } from './HomePlus.jsx';
import { Badge, Button, Card, CardHead, EmptyState } from '../ui/index.jsx';
import { timeAgo, useProgress } from '../lib/progress.js';
import { elementOfDay } from '../lib/elementOfDay.js';
import './home-dashboard.css';

/* ============================================================
   Home.jsx — dashboard sau đăng nhập
   Đầu trang: CUAI chào + nhắn theo tình trạng học (thân thiện)
   Cột chính: ô hỏi · lối tắt · số liệu · học tiếp
   Cột phải : hôm nay · nên ôn · nắm vững theo chương · nguyên tố hôm nay
   ============================================================ */

const DOW = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const SUGGEST = ['Cân bằng Fe + O₂ → Fe₂O₃', 'Tóm tắt chương Este – Lipit', 'Vì sao kim loại kiềm hoạt động mạnh?'];

const ico = (d) => ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);
const IcoCamera = ico(<><path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" /><circle cx="12" cy="12.5" r="3.5" /></>);
const IcoQuiz = ico(<><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7v.5M12 17h.01" /></>);
const IcoBalance = ico(<path d="M12 3v18M3 7h18M7 7l-3 7a3 3 0 0 0 6 0L7 7zM17 7l-3 7a3 3 0 0 0 6 0l-3-7z" />);
const IcoChart = ico(<><path d="M3 3v18h18" /><path d="M7 14l3-3 3 3 5-6" /></>);
const IcoSend = ico(<path d="M12 19V5M5 12l7-7 7 7" />);
const IcoFlame = ico(<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.2 2-4.2.2 1.4.9 2.2 1.7 2.7C10.4 8.6 10.6 5.6 12 3z" />);

function goAI(payload) {
  try { localStorage.setItem('cs-ai-pending', JSON.stringify({ ...payload, t: Date.now() })); } catch { /* */ }
  location.hash = 'ai';
}

/* Lời nhắn của CUAI: dựa vào tình trạng thật của người học */
function cuaiSays(p) {
  const left = p.goal - p.today;
  if (p.isEmpty) return 'Mình là CUAI. Hỏi mình một bài Hóa bất kỳ để bắt đầu nhé.';
  if (p.today >= p.goal) return 'Xong mục tiêu hôm nay rồi. Muốn thử thêm một bài khó không?';
  if (p.today === 0 && p.streak >= 3) return `Chuỗi ${p.streak} ngày đang chờ bạn. Làm vài câu để giữ nó nhé.`;
  if (p.today > 0) return `Còn ${left} câu nữa là đạt mục tiêu. Bạn làm được.`;
  const h = new Date().getHours();
  return h < 11 ? 'Buổi sáng học dễ nhớ nhất. Bắt đầu bằng một câu nhé.' : h < 18 ? 'Hôm nay mình ôn chương nào đây?' : 'Tối nay ôn nhẹ vài câu trước khi nghỉ nhé.';
}

function Head({ p, hello, name }) {
  return (
    <header className="db-head">
      <div className="db-cuai"><AIMark size={46} animate title="CUAI" /></div>
      <div className="db-head-text">
        <h1>{hello}, {name}</h1>
        <p className="db-bubble" role="status">{cuaiSays(p)}</p>
      </div>
      <div className="db-level" title={`Cấp ${p.lv.lvl}: ${p.lv.title}`}>
        <b>Cấp {p.lv.lvl}</b><span>{p.lv.title}</span>
      </div>
    </header>
  );
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
        <div className="db-chips">{SUGGEST.map((s) => <button key={s} type="button" onClick={() => setVal(s)}>{s}</button>)}</div>
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

function Spark({ week }) {
  const max = Math.max(1, ...week.map((d) => d.count));
  const pts = week.map((d, i) => `${(i / 6) * 100},${28 - (d.count / max) * 24}`).join(' ');
  return (
    <svg className="db-spark" viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Stats({ p }) {
  const nextText = p.lv.next ? `${p.xp}/${p.lv.next.xp} XP lên cấp ${p.lv.next.lvl}` : `${p.xp} XP · cấp cao nhất`;
  return (
    <section className="db-stats" aria-label="Số liệu học tập">
      <div className="db-stat streak">
        <small>Chuỗi ngày</small>
        <b className="num"><IcoFlame size={20} />{p.streak}</b>
        <span>{p.streak ? 'ngày liên tiếp' : 'Học hôm nay để bắt đầu'}</span>
      </div>
      <div className="db-stat">
        <small>Độ chính xác</small>
        <b className="num">{p.accuracy === null ? '–' : p.accuracy + '%'}</b>
        <span className="num">{p.answered ? `${p.answered} câu đã làm` : 'Làm quiz để có số liệu'}</span>
      </div>
      <div className="db-stat">
        <small>7 ngày qua</small>
        <b className="num">{p.week.reduce((a, d) => a + d.count, 0)}<em> câu</em></b>
        <Spark week={p.week} />
      </div>
      <div className="db-stat">
        <small>Cấp {p.lv.lvl}</small>
        <b className="lv">{p.lv.title}</b>
        <div className="db-bar thin" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={p.lv.progress} aria-label="Tiến độ lên cấp"><i style={{ width: p.lv.progress + '%' }} /></div>
        <span className="num">{nextText}</span>
      </div>
    </section>
  );
}

function RecentCard({ p }) {
  return (
    <Card className="db-recent">
      <CardHead title="Học tiếp" />
      {p.isEmpty ? (
        <EmptyState title="Chưa có hoạt động nào" text="Hỏi CUAI một câu hoặc làm vài câu quiz, phần này sẽ giúp bạn quay lại đúng chỗ đang học."
          action={<Button variant="primary" href="#quiz">Làm quiz đầu tiên</Button>} />
      ) : (
        <ul>{p.recent.slice(0, 5).map((r) => (
          <li key={r.id}><a href={'#' + (r.hash || 'ai')}><span>{r.title}{r.n > 1 ? <> · <span className="num">{r.n} lượt</span></> : null}</span><time className="num">{timeAgo(r.t)}</time></a></li>
        ))}</ul>
      )}
    </Card>
  );
}

function TodayCard({ p }) {
  const done = p.today >= p.goal;
  const pct = Math.min(100, Math.round((p.today / p.goal) * 100));
  return (
    <Card className="db-today">
      <CardHead title="Hôm nay" action={<a href="#settings">Đổi mục tiêu</a>} />
      <p className="db-today-line">
        <b className="num">{p.today}</b><span className="num"> / {p.goal} câu</span>
        {done && <Badge tone="ok">Hoàn thành</Badge>}
      </p>
      <div className={'db-bar' + (done ? ' done' : '')} role="progressbar" aria-valuemin={0} aria-valuemax={p.goal} aria-valuenow={Math.min(p.today, p.goal)} aria-label="Tiến độ mục tiêu hôm nay"><i style={{ width: pct + '%' }} /></div>
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

function ReviewCard({ p }) {
  if (!p.wrongCount) return null;
  return (
    <Card className="db-review">
      <CardHead title="Nên ôn hôm nay" />
      <p>Bạn có <b className="num">{p.wrongCount}</b> nguyên tố từng trả lời sai. Ôn lại bây giờ để nhớ lâu hơn.</p>
      <Button variant="primary" href="#quiz">Ôn câu sai</Button>
    </Card>
  );
}

function MasteryCard({ p }) {
  const pct = Math.round((p.mastered / p.totalElements) * 100);
  return (
    <Card className="db-mastery">
      <CardHead title="Nguyên tố đã thành thạo" action={<a href="#table">Bảng tuần hoàn</a>} />
      <p className="db-mastery-line"><b className="num">{p.mastered}</b><span className="num"> / {p.totalElements}</span></p>
      <div className="db-bar" role="progressbar" aria-valuemin={0} aria-valuemax={p.totalElements} aria-valuenow={p.mastered} aria-label="Số nguyên tố đã thành thạo"><i style={{ width: pct + '%' }} /></div>
      <p className="db-legend">{p.mastered ? 'Tính theo lịch ôn lặp lại của Quiz.' : 'Làm Quiz để bắt đầu mở khóa từng nguyên tố.'}</p>
    </Card>
  );
}

function ElementCard() {
  const e = elementOfDay();
  return (
    <Card className="db-element" tight>
      <div className="db-el-cell" aria-hidden="true"><small>{e.z}</small><b>{e.s}</b><span>{e.m}</span></div>
      <div>
        <h2>Nguyên tố hôm nay: {e.n}</h2>
        <p>{e.fact}</p>
        <a href="#table">Xem trên bảng tuần hoàn</a>
      </div>
    </Card>
  );
}

export default function Home() {
  const { hello, name } = useGreeting();
  const p = useProgress();
  return (
    <div className="db">
      <div className="db-aurora" aria-hidden="true" />
      <Head p={p} hello={hello} name={name} />
      <div className="db-grid">
        <div className="db-main">
          <Composer />
          <Shortcuts />
          <Stats p={p} />
          <RecentCard p={p} />
        </div>
        <aside className="db-side">
          <TodayCard p={p} />
          <ReviewCard p={p} />
          <MasteryCard p={p} />
          <ElementCard />
        </aside>
      </div>
    </div>
  );
}