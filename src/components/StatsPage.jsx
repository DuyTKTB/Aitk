/* ============================================================
   StatsPage.jsx — Thống kê học tập cá nhân
   ------------------------------------------------------------
   Nguồn: Supabase exam_attempts (lượt làm đã hoàn thành).
   - Bộ lọc: khoảng thời gian (7/30/90 ngày, tất cả) + môn học
   - So sánh với kỳ trước (số lượt, điểm TB)
   - Mục tiêu điểm tự đặt (lưu máy), dùng để tô màu + gợi ý môn cần ôn
   - Xu hướng điểm theo ngày, cơ cấu đúng/sai/bỏ trống,
     hiệu suất theo môn (có xu hướng), heatmap 14 tuần,
     lịch sử có sắp xếp + xem thêm, xuất CSV
   ============================================================ */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { supabase } from '../lib/supabase.js';
import { useGamification } from '../hooks/useGamification.js';
import './stats-aurora.css';

/* ---------- Icon SVG ---------- */
const P = {
  trend: ['M3 17l6-6 4 4 8-8', 'M15 7h6v6'],
  target: ['M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z', 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z', 'M12 12h.01'],
  list: ['M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1z', 'M8 6H6a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-2', 'M9 14l2 2 4-4'],
  award: ['M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12z', 'M8.5 14L7 21l5-3 5 3-1.5-7'],
  help: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7', 'M12 17h.01'],
  clock: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M12 7v5l3 2'],
  fire: ['M12 2c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-5 3-7 0 2 1 3 2 3 0-2 0-4 0-6z'],
  download: ['M12 4v11', 'M7 11l5 5 5-5', 'M5 20h14'],
  refresh: ['M4 4v6h6', 'M20 20v-6h-6', 'M20 10A8 8 0 0 0 6 6L4 10', 'M4 14a8 8 0 0 0 14 4l2-4'],
  up: ['M12 19V5', 'M6 11l6-6 6 6'],
  down: ['M12 5v14', 'M6 13l6 6 6-6'],
  minus: ['M5 12h14'],
  plus: ['M12 5v14', 'M5 12h14'],
  alert: ['M12 9v4', 'M12 17h.01', 'M12 3l10 18H2L12 3z'],
  play: ['M6 4l14 8-14 8z'],
  book: ['M4 4h6v16H4z', 'M14 4h6v16h-6z'],
  check: ['M5 12l5 5L20 7'],
  calendar: ['M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', 'M16 2v4M8 2v4M3 10h18'],
};
const Ic = ({ n, size = 18, sw = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {P[n].map((d, i) => <path key={i} d={d} />)}
  </svg>
);

/* ---------- Hằng số + tiện ích ---------- */
const RANGES = [
  { id: '7', label: '7 ngày', days: 7 },
  { id: '30', label: '30 ngày', days: 30 },
  { id: '90', label: '90 ngày', days: 90 },
  { id: 'all', label: 'Tất cả', days: null },
];
const MODE_LABEL = { exam: 'Thi thử', practice: 'Luyện tập', quiz: 'Ôn tập', review: 'Ôn tập' };
const HEAT_WEEKS = 14;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const mean = (arr) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0);
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, String(v)); } catch { /* bỏ qua */ } },
};
const dayStart = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
const fmtDur = (sec) => {
  if (!sec) return '—';
  if (sec < 60) return `${Math.round(sec)} giây`;
  if (sec < 3600) return `${Math.round(sec / 60)} phút`;
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return m ? `${h} giờ ${m} phút` : `${h} giờ`;
};
const fmtDate = (t) => new Date(t).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
const fmtTime = (t) => new Date(t).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

/* Tổng hợp một danh sách lượt làm (đã chuẩn hóa) */
function summarize(list) {
  const n = list.length;
  if (!n) return { n: 0, avg: null, best: null, q: 0, correct: 0, wrong: 0, blank: 0, sec: 0 };
  return {
    n,
    avg: Math.round(mean(list.map((a) => a.pct))),
    best: Math.max(...list.map((a) => a.pct)),
    q: list.reduce((s, a) => s + a.total, 0),
    correct: list.reduce((s, a) => s + a.correct, 0),
    wrong: list.reduce((s, a) => s + a.wrong, 0),
    blank: list.reduce((s, a) => s + a.blank, 0),
    sec: list.reduce((s, a) => s + a.sec, 0),
  };
}

/* Đường cong mượt (Catmull-Rom → Bézier), giữ y trong khung */
function smoothPath(p, yMin, yMax) {
  if (p.length < 2) return '';
  const cy = (v) => Math.min(yMax, Math.max(yMin, v));
  let d = `M${p[0].x},${p[0].y}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] || p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] || p2;
    d += ` C${p1.x + (p2.x - p0.x) / 6},${cy(p1.y + (p2.y - p0.y) / 6)} ${p2.x - (p3.x - p1.x) / 6},${cy(p2.y - (p3.y - p1.y) / 6)} ${p2.x},${p2.y}`;
  }
  return d;
}

/* ---------- Thành phần nhỏ ---------- */
function Delta({ cur, prev }) {
  if (cur == null || prev == null) return null;
  const d = cur - prev;
  if (d === 0) return <span className="st-delta flat"><Ic n="minus" size={11} sw={2.4} />0</span>;
  return (
    <span className={'st-delta ' + (d > 0 ? 'up' : 'down')}>
      <Ic n={d > 0 ? 'up' : 'down'} size={11} sw={2.4} />{d > 0 ? '+' : ''}{d}
    </span>
  );
}

function Kpi({ icon, tone, label, value, sub, delta }) {
  return (
    <div className="st-card st-kpi" data-tone={tone}>
      <span className="st-ico"><Ic n={icon} size={20} /></span>
      <div className="st-kpi-body">
        <small>{label}</small>
        <div className="st-kpi-row"><b>{value}</b>{delta}</div>
        {sub && <em>{sub}</em>}
      </div>
    </div>
  );
}

function TrendChart({ pts, xmin, xmax, goal }) {
  const [hi, setHi] = useState(null);
  const W = 640, H = 240;
  const pad = { l: 36, r: 16, t: 14, b: 28 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const span = Math.max(1, xmax - xmin);
  const X = (t) => (pts.length === 1 && xmax === xmin ? pad.l + iw / 2 : pad.l + ((t - xmin) / span) * iw);
  const Y = (v) => pad.t + (1 - v / 100) * ih;
  const P2 = pts.map((p) => ({ ...p, x: X(p.t), y: Y(p.v) }));
  const line = smoothPath(P2, pad.t, H - pad.b);
  const base = H - pad.b;
  const area = P2.length > 1 ? `${line} L${P2[P2.length - 1].x},${base} L${P2[0].x},${base} Z` : '';
  const ticks = [0, 1, 2, 3].map((i) => xmin + (span * i) / 3);

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const vx = ((e.clientX - r.left) / r.width) * W;
    let best = 0;
    P2.forEach((p, i) => { if (Math.abs(p.x - vx) < Math.abs(P2[best].x - vx)) best = i; });
    setHi(best);
  };
  const h = hi != null ? P2[hi] : null;

  return (
    <div className="st-chart" onPointerMove={onMove} onPointerLeave={() => setHi(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Biểu đồ điểm theo ngày">
        <defs>
          <linearGradient id="st-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f8dff" stopOpacity=".34" />
            <stop offset="100%" stopColor="#8b7cff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="st-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#4f8dff" />
            <stop offset="100%" stopColor="#8b7cff" />
          </linearGradient>
        </defs>
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={W - pad.r} y1={Y(v)} y2={Y(v)} className="st-grid" />
            <text x={pad.l - 8} y={Y(v) + 4} textAnchor="end" className="st-axis">{v}</text>
          </g>
        ))}
        <line x1={pad.l} x2={W - pad.r} y1={Y(goal)} y2={Y(goal)} className="st-goal-line" />
        <text x={W - pad.r} y={Y(goal) - 6} textAnchor="end" className="st-goal-txt">Mục tiêu {goal}%</text>
        {ticks.map((t, i) => (
          <text key={i} x={X(t)} y={H - 8} textAnchor={i === 0 ? 'start' : i === 3 ? 'end' : 'middle'} className="st-axis">{fmtDate(t)}</text>
        ))}
        {area && <path d={area} fill="url(#st-area)" />}
        {line && <path d={line} className="st-line" stroke="url(#st-line)" />}
        {P2.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={hi === i ? 6 : 4} className={'st-dot' + (hi === i ? ' on' : '')} />
        ))}
      </svg>
      {h && (
        <div className="st-tip" style={{ left: `${(h.x / W) * 100}%`, top: `${(h.y / H) * 100}%` }}>
          <b>{h.v}%</b>
          <span>{fmtDate(h.t)} · {h.n} lượt</span>
        </div>
      )}
    </div>
  );
}

function Donut({ correct, wrong, blank }) {
  const total = correct + wrong + blank;
  const R = 54, C = 2 * Math.PI * R;
  const segs = [
    { k: 'ok', v: correct, label: 'Đúng' },
    { k: 'err', v: wrong, label: 'Sai' },
    { k: 'blank', v: blank, label: 'Bỏ trống' },
  ];
  let off = 0;
  return (
    <div className="st-donut">
      <div className="st-donut-ring">
        <svg viewBox="0 0 140 140" role="img" aria-label="Cơ cấu đúng, sai, bỏ trống">
          <circle cx="70" cy="70" r={R} className="st-donut-bg" />
          {total > 0 && segs.map((s) => {
            const len = (s.v / total) * C;
            const el = s.v > 0 && (
              <circle key={s.k} cx="70" cy="70" r={R} className={'st-donut-seg ' + s.k}
                strokeDasharray={`${Math.max(0, len - 2)} ${C - Math.max(0, len - 2)}`} strokeDashoffset={-off} />
            );
            off += len;
            return el;
          })}
        </svg>
        <div className="st-donut-mid"><b>{total ? Math.round((correct / total) * 100) : 0}%</b><small>đúng</small></div>
      </div>
      <ul className="st-legend">
        {segs.map((s) => (
          <li key={s.k}>
            <i className={s.k} />
            <span>{s.label}</span>
            <b>{s.v}</b>
            <small>{total ? Math.round((s.v / total) * 100) : 0}%</small>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Heatmap({ counts }) {
  const today0 = dayStart(Date.now());
  const dow = (new Date(today0).getDay() + 6) % 7; // 0 = Thứ 2
  const monday = new Date(today0);
  monday.setDate(monday.getDate() - dow - (HEAT_WEEKS - 1) * 7);
  const cells = [];
  let active = 0, total = 0;
  for (let w = 0; w < HEAT_WEEKS; w++) {
    for (let d = 0; d < 7; d++) {
      const dt = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + w * 7 + d);
      const t = dt.getTime();
      if (t > today0) { cells.push({ key: `${w}-${d}`, future: true }); continue; }
      const n = counts.get(t) || 0;
      if (n) { active++; total += n; }
      cells.push({ key: `${w}-${d}`, n, l: n === 0 ? 0 : n === 1 ? 1 : n === 2 ? 2 : n <= 4 ? 3 : 4, label: `${dt.toLocaleDateString('vi-VN')}: ${n} lượt` });
    }
  }
  return (
    <div>
      <div className="st-heat-wrap">
        <div className="st-heat-days" aria-hidden="true"><span>T2</span><span /><span>T4</span><span /><span>T6</span><span /><span>CN</span></div>
        <div className="st-heat" role="img" aria-label={`Hoạt động ${HEAT_WEEKS} tuần gần đây`}>
          {cells.map((c) => (c.future ? <i key={c.key} className="future" /> : <i key={c.key} data-l={c.l} title={c.label} />))}
        </div>
      </div>
      <div className="st-heat-foot">
        <span><b>{active}</b> ngày có học · <b>{total}</b> lượt trong {HEAT_WEEKS} tuần</span>
        <span className="st-heat-legend">Ít <i data-l="0" /><i data-l="1" /><i data-l="2" /><i data-l="3" /><i data-l="4" /> Nhiều</span>
      </div>
    </div>
  );
}

/* ---------- Trang chính ---------- */
export default function StatsPage() {
  const { user } = useAuth();
  const gamif = useGamification();
  const uid = user?.uid || user?.id;

  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);
  const [range, setRangeState] = useState(() => (RANGES.some((r) => r.id === store.get('cs-stats-range', '30')) ? store.get('cs-stats-range', '30') : '30'));
  const [subject, setSubject] = useState('all');
  const [goal, setGoalState] = useState(() => clamp(parseInt(store.get('cs-stats-goal', '70'), 10) || 70, 30, 100));
  const [sort, setSort] = useState('new');
  const [shown, setShown] = useState(10);

  const setRange = (id) => { setRangeState(id); store.set('cs-stats-range', id); };
  const setGoal = (v) => { const n = clamp(v, 30, 100); setGoalState(n); store.set('cs-stats-goal', n); };

  useEffect(() => {
    if (!uid) return undefined;
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const { data, error: err } = await supabase
          .from('exam_attempts')
          .select(`
            id, score, correct_count, wrong_count, blank_count,
            total_questions, time_spent, started_at, mode,
            exam:exams(id, title, subject:subjects(name, code), grade:grades(name))
          `)
          .eq('user_id', uid)
          .eq('is_completed', true)
          .order('started_at', { ascending: false })
          .limit(500);
        if (err) throw err;
        if (alive) setAttempts(data || []);
      } catch (e) {
        if (alive) setError(e?.message || 'Không tải được dữ liệu.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [uid, tick]);

  useEffect(() => { setShown(10); }, [range, subject, sort]);

  /* Chuẩn hóa dữ liệu một lần */
  const valid = useMemo(() => attempts
    .filter((a) => a.total_questions > 0 && a.started_at)
    .map((a) => {
      const total = a.total_questions;
      const correct = a.correct_count || 0;
      let wrong = a.wrong_count;
      let blank = a.blank_count;
      if (wrong == null && blank == null) { wrong = Math.max(0, total - correct); blank = 0; }
      else if (wrong == null) { blank = blank || 0; wrong = Math.max(0, total - correct - blank); }
      else if (blank == null) { wrong = wrong || 0; blank = Math.max(0, total - correct - wrong); }
      else { wrong = wrong || 0; blank = blank || 0; }
      return {
        id: a.id,
        t: new Date(a.started_at).getTime(),
        pct: Math.round((correct / total) * 100),
        total, correct, wrong, blank,
        sec: Number(a.time_spent) || 0,
        mode: a.mode,
        title: a.exam?.title || 'Đề thi',
        subject: a.exam?.subject?.name || 'Khác',
        grade: a.exam?.grade?.name || '',
      };
    })
    .sort((x, y) => y.t - x.t), [attempts]);

  const allSubjects = useMemo(() => {
    const m = new Map();
    valid.forEach((a) => m.set(a.subject, (m.get(a.subject) || 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([name, n]) => ({ name, n }));
  }, [valid]);

  const view = useMemo(() => {
    const days = RANGES.find((r) => r.id === range)?.days ?? null;
    const now = new Date();
    const mk = (back) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - back).getTime();
    const start = days ? mk(days - 1) : 0;
    const prevStart = days ? mk(2 * days - 1) : 0;
    const pass = (a) => subject === 'all' || a.subject === subject;

    const inRange = valid.filter((a) => a.t >= start);
    const cur = inRange.filter(pass);
    const prev = days ? valid.filter((a) => a.t >= prevStart && a.t < start && pass(a)) : [];

    /* Theo môn: tính trên cả khoảng thời gian, không phụ thuộc môn đang lọc */
    const bySubj = new Map();
    inRange.forEach((a) => { if (!bySubj.has(a.subject)) bySubj.set(a.subject, []); bySubj.get(a.subject).push(a); });
    const subjects = [...bySubj.entries()].map(([name, list]) => {
      const s = summarize(list);
      let trend = null;
      if (list.length >= 4) {
        const d = mean(list.slice(0, 3).map((a) => a.pct)) - mean(list.slice(3).map((a) => a.pct));
        trend = Math.abs(d) >= 3 ? Math.round(d) : 0;
      }
      return { name, n: s.n, avg: s.avg, best: s.best, trend };
    }).sort((a, b) => b.n - a.n);

    /* Chuỗi điểm theo ngày cho biểu đồ */
    const byDay = new Map();
    cur.forEach((a) => { const k = dayStart(a.t); if (!byDay.has(k)) byDay.set(k, []); byDay.get(k).push(a.pct); });
    const pts = [...byDay.entries()].sort((a, b) => a[0] - b[0]).map(([t, v]) => ({ t, v: Math.round(mean(v)), n: v.length }));
    const xmax = dayStart(Date.now());
    const xmin = days ? start : (pts[0]?.t ?? xmax);

    /* Heatmap theo môn đang lọc, độc lập khoảng thời gian */
    const counts = new Map();
    valid.filter(pass).forEach((a) => { const k = dayStart(a.t); counts.set(k, (counts.get(k) || 0) + 1); });

    return { days, cur, prev, sum: summarize(cur), prevSum: summarize(prev), subjects, pts, xmin, xmax, counts };
  }, [valid, range, subject]);

  const { cur, sum, prevSum } = view;
  const tone = (pct) => (pct >= goal ? 'ok' : pct >= Math.max(0, goal - 20) ? 'warn' : 'err');
  const rangeLabel = RANGES.find((r) => r.id === range)?.label || '';

  const weakSubjects = view.subjects.filter((s) => s.avg < goal).sort((a, b) => a.avg - b.avg);
  const weakAttempts = useMemo(() => cur.filter((a) => a.pct < goal).sort((a, b) => a.pct - b.pct).slice(0, 4), [cur, goal]);

  const history = useMemo(() => {
    const list = [...cur];
    if (sort === 'high') list.sort((a, b) => b.pct - a.pct || b.t - a.t);
    if (sort === 'low') list.sort((a, b) => a.pct - b.pct || b.t - a.t);
    return list;
  }, [cur, sort]);

  const exportCsv = useCallback(() => {
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const head = ['Ngày', 'Giờ', 'Đề', 'Môn', 'Khối', 'Chế độ', 'Đúng', 'Sai', 'Bỏ trống', 'Tổng câu', 'Điểm %', 'Thời gian (giây)'];
    const rows = cur.map((a) => [
      new Date(a.t).toLocaleDateString('vi-VN'), fmtTime(a.t), a.title, a.subject, a.grade,
      MODE_LABEL[a.mode] || a.mode || '', a.correct, a.wrong, a.blank, a.total, a.pct, a.sec,
    ]);
    const csv = '\uFEFF' + [head, ...rows].map((r) => r.map(esc).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `thong-ke-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [cur]);

  const xp = gamif?.xp || 0;
  const level = gamif?.level || 1;
  const hasAny = valid.length > 0;

  /* ----- Trạng thái tải / lỗi ----- */
  if (loading) {
    return (
      <div className="st">
        <div className="st-wrap" aria-busy="true">
          <div className="st-skel" style={{ height: 44, width: 220, marginBottom: 18 }} />
          <div className="st-grid-kpi">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="st-skel" style={{ height: 96 }} />)}</div>
          <div className="st-skel" style={{ height: 300, marginTop: 16 }} />
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="st">
        <div className="st-wrap">
          <div className="st-card st-state">
            <span className="st-ico big err"><Ic n="alert" size={28} /></span>
            <h2>Không tải được thống kê</h2>
            <p>{error}</p>
            <button className="st-btn primary" onClick={() => setTick((n) => n + 1)}><Ic n="refresh" size={15} /> Thử lại</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="st">
      <div className="st-wrap">
        {/* ----- Đầu trang ----- */}
        <header className="st-head">
          <div>
            <h1>Thống kê</h1>
            {hasAny && <p>{cur.length} lượt làm · {rangeLabel}{subject !== 'all' ? ` · ${subject}` : ''}</p>}
          </div>
          <div className="st-chips">
            <div className="st-chip" title={`${100 - (xp % 100)} XP nữa lên cấp ${level + 1}`}>
              <span className="st-ico sm lvl"><b>{level}</b></span>
              <div>
                <small>Cấp độ · {xp} XP</small>
                <i><u style={{ width: `${xp % 100}%` }} /></i>
              </div>
            </div>
            <div className="st-chip">
              <span className="st-ico sm fire"><Ic n="fire" size={16} /></span>
              <div><small>Chuỗi học</small><b>{gamif?.streak || 0} ngày</b></div>
            </div>
            <button className="st-icon-btn" onClick={() => setTick((n) => n + 1)} aria-label="Tải lại"><Ic n="refresh" size={16} /></button>
          </div>
        </header>

        {!hasAny ? (
          <div className="st-card st-state">
            <span className="st-ico big"><Ic n="trend" size={28} /></span>
            <h2>Chưa có dữ liệu</h2>
            <p>Hoàn thành một bài kiểm tra hoặc đề thi để xem thống kê tại đây.</p>
            <div className="st-state-actions">
              <a className="st-btn primary" href="#quiz"><Ic n="book" size={15} /> Ôn tập</a>
            </div>
          </div>
        ) : (
          <>
            {/* ----- Bộ lọc ----- */}
            <div className="st-toolbar">
              <div className="st-seg" role="group" aria-label="Khoảng thời gian">
                {RANGES.map((r) => (
                  <button key={r.id} className={range === r.id ? 'on' : ''} aria-pressed={range === r.id} onClick={() => setRange(r.id)}>{r.label}</button>
                ))}
              </div>
              <div className="st-goal" title="Điểm mục tiêu: dùng để tô màu và gợi ý môn cần ôn">
                <span><Ic n="target" size={15} /> Mục tiêu</span>
                <button onClick={() => setGoal(goal - 5)} aria-label="Giảm mục tiêu"><Ic n="minus" size={13} sw={2.2} /></button>
                <b>{goal}%</b>
                <button onClick={() => setGoal(goal + 5)} aria-label="Tăng mục tiêu"><Ic n="plus" size={13} sw={2.2} /></button>
              </div>
              <button className="st-btn" onClick={exportCsv} disabled={!cur.length}><Ic n="download" size={15} /> Xuất CSV</button>
            </div>
            {allSubjects.length > 1 && (
              <div className="st-subj-chips" role="group" aria-label="Lọc theo môn">
                <button className={subject === 'all' ? 'on' : ''} aria-pressed={subject === 'all'} onClick={() => setSubject('all')}>Tất cả môn</button>
                {allSubjects.map((s) => (
                  <button key={s.name} className={subject === s.name ? 'on' : ''} aria-pressed={subject === s.name} onClick={() => setSubject(subject === s.name ? 'all' : s.name)}>
                    {s.name}<em>{s.n}</em>
                  </button>
                ))}
              </div>
            )}

            {!cur.length ? (
              <div className="st-card st-state">
                <span className="st-ico big"><Ic n="calendar" size={28} /></span>
                <h2>Không có lượt làm nào</h2>
                <p>Chưa có bài hoàn thành trong khoảng và môn đang chọn.</p>
                <div className="st-state-actions">
                  <button className="st-btn primary" onClick={() => { setRange('all'); setSubject('all'); }}>Xem tất cả</button>
                </div>
              </div>
            ) : (
              <>
                {/* ----- Chỉ số chính ----- */}
                <div className="st-grid-kpi">
                  <Kpi icon="list" tone="blue" label="Lượt làm" value={sum.n}
                    delta={view.days && prevSum.n ? <Delta cur={sum.n} prev={prevSum.n} /> : null}
                    sub={view.days ? `${prevSum.n} lượt kỳ trước` : `${sum.q} câu`} />
                  <Kpi icon="trend" tone="violet" label="Điểm trung bình" value={`${sum.avg}%`}
                    delta={view.days && prevSum.n ? <Delta cur={sum.avg} prev={prevSum.avg} /> : null}
                    sub={sum.avg >= goal ? 'Đạt mục tiêu' : `Thiếu ${goal - sum.avg}% so với mục tiêu`} />
                  <Kpi icon="award" tone="amber" label="Cao nhất" value={`${sum.best}%`} sub={`Thấp nhất ${Math.min(...cur.map((a) => a.pct))}%`} />
                  <Kpi icon="help" tone="green" label="Câu đúng" value={`${sum.correct}/${sum.q}`} sub={`${sum.q ? Math.round((sum.correct / sum.q) * 100) : 0}% chính xác`} />
                  <Kpi icon="clock" tone="pink" label="Thời gian làm" value={fmtDur(sum.sec)} sub={sum.sec && sum.q ? `≈ ${Math.round(sum.sec / sum.q)} giây/câu` : null} />
                </div>

                {/* ----- Xu hướng + cơ cấu ----- */}
                <div className="st-row">
                  <section className="st-card st-span-8">
                    <h3>Điểm theo ngày</h3>
                    <TrendChart pts={view.pts} xmin={view.xmin} xmax={view.xmax} goal={goal} />
                  </section>
                  <section className="st-card st-span-4">
                    <h3>Cơ cấu câu trả lời</h3>
                    <Donut correct={sum.correct} wrong={sum.wrong} blank={sum.blank} />
                  </section>
                </div>

                {/* ----- Theo môn + cần ôn ----- */}
                <div className="st-row">
                  <section className="st-card st-span-7">
                    <h3>Hiệu suất theo môn</h3>
                    <ul className="st-subjects">
                      {view.subjects.map((s) => (
                        <li key={s.name}>
                          <button className={subject === s.name ? 'on' : ''} onClick={() => setSubject(subject === s.name ? 'all' : s.name)} title="Bấm để lọc theo môn này">
                            <span className="st-subj-name"><b>{s.name}</b><small>{s.n} lượt · cao nhất {s.best}%</small></span>
                            <span className="st-bar">
                              <i className={tone(s.avg)} style={{ width: `${s.avg}%` }} />
                              <u style={{ left: `${goal}%` }} />
                            </span>
                            <span className="st-subj-avg">
                              <b>{s.avg}%</b>
                              {s.trend != null && s.trend !== 0 && (
                                <em className={s.trend > 0 ? 'up' : 'down'}><Ic n={s.trend > 0 ? 'up' : 'down'} size={10} sw={2.6} />{Math.abs(s.trend)}</em>
                              )}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                  <section className="st-card st-span-5">
                    <h3>Cần ôn tập</h3>
                    {!weakSubjects.length && !weakAttempts.length ? (
                      <p className="st-okline"><Ic n="check" size={16} sw={2.2} /> Mọi môn và mọi đề đều đạt mục tiêu {goal}%.</p>
                    ) : (
                      <>
                        {weakSubjects.length > 0 && (
                          <ul className="st-weak">
                            {weakSubjects.map((s) => (
                              <li key={s.name}>
                                <b>{s.name}</b>
                                <span>TB {s.avg}% · thiếu {goal - s.avg}%</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        {weakAttempts.length > 0 && (
                          <>
                            <small className="st-sub">Đề điểm thấp nhất</small>
                            <ul className="st-weak low">
                              {weakAttempts.map((a) => (
                                <li key={a.id}>
                                  <b>{a.title}</b>
                                  <span className={'st-pill ' + tone(a.pct)}>{a.pct}%</span>
                                </li>
                              ))}
                            </ul>
                          </>
                        )}
                        <a className="st-btn primary" href="#quiz"><Ic n="play" size={13} /> Ôn tập ngay</a>
                      </>
                    )}
                  </section>
                </div>

                {/* ----- Heatmap ----- */}
                <section className="st-card">
                  <h3>Hoạt động {HEAT_WEEKS} tuần gần đây</h3>
                  <Heatmap counts={view.counts} />
                </section>

                {/* ----- Lịch sử ----- */}
                <section className="st-card">
                  <div className="st-card-head">
                    <h3>Lịch sử làm bài</h3>
                    <div className="st-seg sm" role="group" aria-label="Sắp xếp">
                      {[['new', 'Mới nhất'], ['high', 'Điểm cao'], ['low', 'Điểm thấp']].map(([id, label]) => (
                        <button key={id} className={sort === id ? 'on' : ''} aria-pressed={sort === id} onClick={() => setSort(id)}>{label}</button>
                      ))}
                    </div>
                  </div>
                  <ul className="st-history">
                    {history.slice(0, shown).map((a) => (
                      <li key={a.id}>
                        <span className={'st-score ' + tone(a.pct)}>{a.pct}%</span>
                        <div className="st-hist-main">
                          <b>{a.title}</b>
                          <small>{a.subject}{a.grade ? ` · ${a.grade}` : ''}{a.mode ? ` · ${MODE_LABEL[a.mode] || a.mode}` : ''}</small>
                          <span className="st-mini" title={`${a.correct} đúng · ${a.wrong} sai · ${a.blank} bỏ trống`}>
                            <i className="ok" style={{ flex: a.correct }} /><i className="err" style={{ flex: a.wrong }} /><i className="blank" style={{ flex: a.blank }} />
                          </span>
                        </div>
                        <div className="st-hist-side">
                          <b>{a.correct}/{a.total}</b>
                          <small>{fmtDate(a.t)} · {fmtTime(a.t)}</small>
                          {a.sec > 0 && <small>{fmtDur(a.sec)}</small>}
                        </div>
                      </li>
                    ))}
                  </ul>
                  {history.length > shown && (
                    <button className="st-btn more" onClick={() => setShown((n) => n + 10)}>
                      Xem thêm ({history.length - shown})
                    </button>
                  )}
                </section>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}