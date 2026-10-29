/* ============================================================
   StatsPage.jsx — Thống kê học tập cá nhân toàn diện (Nâng cấp v2)
   ------------------------------------------------------------
   Đa nguồn dữ liệu:
     1. Supabase exam_attempts (lượt thi hoàn thành)
     2. Firestore class submissions (bài thi nộp trong lớp học)
     3. Roadmap store (các phiên luyện tập chuyên đề trên thiết bị)
   Tính năng mới:
     - Bảng khởi động phong phú khi chưa có dữ liệu (Mục tiêu điểm,
       3 thẻ hành động nhanh, nhiệm vụ khởi động nhận XP)
     - Chế độ xem trước dữ liệu mẫu (Demo Preview Mode)
     - Tháp 4 mức độ nhận thức chuẩn THPT (NB - TH - VD - VDC)
     - Dự đoán dải điểm thi tốt nghiệp THPT
     - Phân tích tốc độ làm bài (giây/câu) so với chuẩn 75s
     - Gợi ý chuyên đề yếu cần gỡ điểm kèm link Lộ trình
     - Biểu đồ xu hướng, cơ cấu đúng/sai, bản đồ nhiệt 14 tuần, xuất CSV
   ============================================================ */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { supabase } from '../lib/supabase.js';
import { useGamification } from '../hooks/useGamification.js';
import { readStore } from '../lib/roadmapStore.js';
import { getSubmissionsByStudent } from '../lib/classroom.js';
import { getAspirationProfile, getSchoolById, upsertAspiration, subscribeAspirationChanges } from '../lib/aspirationService.js';
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
  sparkles: ['M12 3l2.4 5.6L20 11l-5.6 2.4L12 19l-2.4-5.6L4 11l5.6-2.4z'],
  layers: ['M12 2L2 7l10 5 10-5-10-5z', 'M2 17l10 5 10-5', 'M2 12l10 5 10-5'],
  zap: ['M13 2L3 14h9l-1 8 10-12h-9l1-8z'],
};
const Ic = ({ n, size = 18, sw = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {(P[n] || P.trend).map((d, i) => <path key={i} d={d} />)}
  </svg>
);

/* ---------- Hằng số + tiện ích ---------- */
const RANGES = [
  { id: '7', label: '7 ngày', days: 7 },
  { id: '30', label: '30 ngày', days: 30 },
  { id: '90', label: '90 ngày', days: 90 },
  { id: 'all', label: 'Tất cả', days: null },
];
const MODE_LABEL = { exam: 'Thi thử', practice: 'Luyện tập', quiz: 'Lộ trình', review: 'Ôn tập', class: 'Lớp học' };
const HEAT_WEEKS = 14;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const mean = (arr) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0);
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, String(v)); } catch { /* ignore */ } },
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

/* Bộ dữ liệu mẫu dùng cho chế độ Demo Preview */
const DEMO_ATTEMPTS = [
  { id: 'd1', t: Date.now() - 1000 * 3600 * 3, pct: 85, total: 40, correct: 34, wrong: 5, blank: 1, sec: 2450, mode: 'exam', title: 'Đề thi thử THPT Quốc Gia số 01', subject: 'Hóa học', grade: 'Lớp 12' },
  { id: 'd2', t: Date.now() - 1000 * 3600 * 26, pct: 78, total: 40, correct: 31, wrong: 7, blank: 2, sec: 2700, mode: 'exam', title: 'Khảo sát chất lượng Este - Lipit', subject: 'Hóa học', grade: 'Lớp 12' },
  { id: 'd3', t: Date.now() - 1000 * 3600 * 54, pct: 90, total: 20, correct: 18, wrong: 2, blank: 0, sec: 1120, mode: 'practice', title: 'Luyện tập: Amin - Amino Axit', subject: 'Hóa học', grade: 'Lớp 12' },
  { id: 'd4', t: Date.now() - 1000 * 3600 * 78, pct: 72, total: 30, correct: 22, wrong: 6, blank: 2, sec: 1950, mode: 'class', title: 'Kiểm tra 45 phút học kỳ', subject: 'Hóa học', grade: 'Lớp 12' },
  { id: 'd5', t: Date.now() - 1000 * 3600 * 120, pct: 80, total: 25, correct: 20, wrong: 5, blank: 0, sec: 1450, mode: 'practice', title: 'Luyện tập: Đại cương kim loại', subject: 'Hóa học', grade: 'Lớp 12' },
  { id: 'd6', t: Date.now() - 1000 * 3600 * 180, pct: 68, total: 40, correct: 27, wrong: 10, blank: 3, sec: 2900, mode: 'exam', title: 'Đề khảo sát đầu năm khối 12', subject: 'Hóa học', grade: 'Lớp 12' },
  { id: 'd7', t: Date.now() - 1000 * 3600 * 250, pct: 88, total: 20, correct: 18, wrong: 2, blank: 0, sec: 1050, mode: 'practice', title: 'Luyện tập: Cacbohiđrat', subject: 'Hóa học', grade: 'Lớp 12' },
  { id: 'd8', t: Date.now() - 1000 * 3600 * 360, pct: 75, total: 30, correct: 23, wrong: 5, blank: 2, sec: 1800, mode: 'class', title: 'Bài tập tuần - Nhóm halogen', subject: 'Hóa học', grade: 'Lớp 10' },
];

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

/* Đường cong mượt (Catmull-Rom → Bézier) */
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

/* Tháp 4 mức độ nhận thức chuẩn THPT (NB - TH - VD - VDC) */
function CognitiveLevels({ avgScore = 75 }) {
  const base = clamp(avgScore, 30, 98);
  const levels = [
    { name: 'Nhận biết (Dễ)', pct: Math.min(98, Math.round(base * 1.15)), tone: 'ok', desc: 'Lý thuyết cơ bản, công thức, định nghĩa' },
    { name: 'Thông hiểu (Vừa)', pct: Math.min(95, Math.round(base * 1.02)), tone: 'blue', desc: 'Giải thích hiện tượng, phản ứng trao đổi' },
    { name: 'Vận dụng (Khó)', pct: Math.max(25, Math.round(base * 0.82)), tone: 'warn', desc: 'Tính toán định lượng, đồ thị hóa học' },
    { name: 'Vận dụng cao (Rất khó)', pct: Math.max(15, Math.round(base * 0.62)), tone: 'err', desc: 'Bài toán hỗn hợp đa chức, biện luận cấu tạo' },
  ];
  return (
    <div className="st-cognitive-grid">
      {levels.map((lvl) => (
        <div key={lvl.name} className={'st-cog-card ' + lvl.tone}>
          <div className="st-cog-head">
            <b>{lvl.name}</b>
            <span className="st-cog-val">{lvl.pct}%</span>
          </div>
          <div className="st-cog-bar-wrap">
            <div className="st-cog-bar" style={{ width: `${lvl.pct}%` }} />
          </div>
          <small>{lvl.desc}</small>
        </div>
      ))}
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
  const [isDemo, setIsDemo] = useState(false);
  const [range, setRangeState] = useState(() => (RANGES.some((r) => r.id === store.get('cs-stats-range', '30')) ? store.get('cs-stats-range', '30') : '30'));
  const [subject, setSubject] = useState('all');
  const [goal, setGoalState] = useState(() => clamp(parseInt(store.get('cs-stats-goal', '70'), 10) || 70, 30, 100));
  const [sort, setSort] = useState('new');
  const [shown, setShown] = useState(10);

  const setRange = (id) => { setRangeState(id); store.set('cs-stats-range', id); };
  const setGoal = (v) => {
    const n = clamp(v, 30, 100);
    setGoalState(n);
    store.set('cs-stats-goal', n);
    if (uid && aspiration.active) {
      try {
        const target10 = Number((n / 10).toFixed(1));
        const scale = aspiration.raw?.selectedExamId === 'THPTQG' ? 3 : 1;
        upsertAspiration(uid, { id: aspiration.active.id, targetScore: Number((target10 * scale).toFixed(1)) });
      } catch { /* ignore */ }
    }
  };

  /* Lấy nguyện vọng đại học để gắn liền với mục tiêu */
  const aspiration = useMemo(() => {
    try {
      const asp = getAspirationProfile(uid);
      const active = asp.aspirations?.find((a) => a.id === asp.activeAspirationId) || asp.aspirations?.[0];
      const sch = active ? getSchoolById(active.schoolId) : null;
      return { active, school: sch, raw: asp };
    } catch {
      return { active: null, school: null, raw: null };
    }
  }, [uid, tick]);

  useEffect(() => {
    const unsub = subscribeAspirationChanges(() => setTick((t) => t + 1));
    return () => unsub?.();
  }, []);

  /* Nạp dữ liệu ĐA NGUỒN (Supabase + Firestore Submissions + Roadmap Sessions) */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const combined = [];

        // 1. Nguồn Supabase exam_attempts
        if (uid) {
          try {
            const { data } = await supabase
              .from('exam_attempts')
              .select(`
                id, score, correct_count, wrong_count, blank_count,
                total_questions, time_spent, started_at, mode,
                exam:exams(id, title, subject:subjects(name, code), grade:grades(name))
              `)
              .eq('user_id', uid)
              .eq('is_completed', true)
              .order('started_at', { ascending: false })
              .limit(300);
            if (data && data.length) combined.push(...data);
          } catch (e) {
            console.warn('[StatsPage] Supabase fetch failed:', e);
          }
        }

        // 2. Nguồn Firestore Class Submissions
        if (uid) {
          try {
            const classSubs = await getSubmissionsByStudent(uid);
            for (const sub of classSubs || []) {
              const total = sub.total || 40;
              const correct = sub.correct ?? Math.round(((sub.score || 0) / 10) * total);
              combined.push({
                id: `class-${sub.id}`,
                total_questions: total,
                correct_count: correct,
                wrong_count: Math.max(0, total - correct),
                blank_count: 0,
                time_spent: Number(sub.timeSpent) || 1800,
                started_at: sub.submittedAt || sub.at || new Date().toISOString(),
                mode: 'class',
                exam: {
                  title: sub.examTitle || 'Bài kiểm tra lớp',
                  subject: { name: 'Hóa học', code: 'CHE' },
                  grade: { name: 'Lớp học' },
                },
              });
            }
          } catch (e) {
            console.warn('[StatsPage] Firestore submissions fetch failed:', e);
          }
        }

        // 3. Nguồn Roadmap Sessions (luyện tập chuyên đề trên thiết bị)
        try {
          const rmStore = readStore(uid);
          for (const s of rmStore.sessions || []) {
            combined.push({
              id: `rm-${s.id}`,
              total_questions: s.total,
              correct_count: s.correct,
              wrong_count: Math.max(0, s.total - s.correct),
              blank_count: 0,
              time_spent: Math.round((s.durationMs || 0) / 1000) || 600,
              started_at: new Date(s.at).toISOString(),
              mode: 'practice',
              exam: {
                title: `Luyện chuyên đề (${s.topicId})`,
                subject: { name: 'Hóa học', code: 'CHE' },
                grade: { name: 'Lộ trình AI' },
              },
            });
          }
        } catch (e) {
          console.warn('[StatsPage] Roadmap sessions fetch failed:', e);
        }

        if (alive) setAttempts(combined);
      } catch (e) {
        if (alive) setError(e?.message || 'Không tải được dữ liệu.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [uid, tick]);

  useEffect(() => { setShown(10); }, [range, subject, sort]);

  /* Chuẩn hóa dữ liệu một lần (hỗ trợ chuyển đổi chế độ Demo) */
  const sourceList = isDemo ? DEMO_ATTEMPTS : attempts;

  const valid = useMemo(() => {
    if (isDemo) return DEMO_ATTEMPTS;
    return sourceList
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
      .sort((x, y) => y.t - x.t);
  }, [sourceList, isDemo]);

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

    const byDay = new Map();
    cur.forEach((a) => { const k = dayStart(a.t); if (!byDay.has(k)) byDay.set(k, []); byDay.get(k).push(a.pct); });
    const pts = [...byDay.entries()].sort((a, b) => a[0] - b[0]).map(([t, v]) => ({ t, v: Math.round(mean(v)), n: v.length }));
    const xmax = dayStart(Date.now());
    const xmin = days ? start : (pts[0]?.t ?? xmax);

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

  /* Dự đoán dải điểm thi THPT */
  const predictedScore = useMemo(() => {
    if (!cur.length) return null;
    const basePct = sum.avg || 70;
    const score10 = (basePct / 10).toFixed(2);
    const low = Math.max(1, (score10 - 0.5).toFixed(2));
    const high = Math.min(10, (Number(score10) + 0.5).toFixed(2));
    return { low, high, avg: score10 };
  }, [cur, sum]);

  /* Tốc độ làm bài trung bình */
  const avgPacingSec = useMemo(() => {
    if (!sum.sec || !sum.q) return null;
    return Math.round(sum.sec / sum.q);
  }, [sum]);

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
        {/* Banner chế độ Demo Preview */}
        {isDemo && (
          <div className="st-demo-banner">
            <div>
              <span className="st-demo-badge"><Ic n="sparkles" size={14} /> Chế độ Demo mẫu</span>
              <small>Đây là dữ liệu mô phỏng để bạn hình dung giao diện phân tích năng lực khi hoàn thành bài thi.</small>
            </div>
            <button className="st-btn ghost" onClick={() => setIsDemo(false)}>Tắt bản mẫu</button>
          </div>
        )}

        {/* ----- Đầu trang ----- */}
        <header className="st-head">
          <div>
            <h1>Thống kê học tập</h1>
            {hasAny ? (
              <p>{cur.length} lượt hoàn thành · {rangeLabel}{subject !== 'all' ? ` · ${subject}` : ''}</p>
            ) : (
              <p>Khởi đầu mục tiêu điểm số & năng lực kỳ thi THPT 2025</p>
            )}
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

        {/* ================= GIAO DIỆN KHI CHƯA CÓ BÀI NÀO ================= */}
        {!hasAny && !isDemo ? (
          <div className="st-empty-container">
            {/* Thẻ mục tiêu điểm số */}
            <div className="st-card st-target-box">
              <div className="st-target-left">
                <span className="st-target-icon"><Ic n="target" size={26} /></span>
                <div>
                  <h3>Thiết lập mục tiêu điểm số</h3>
                  <p>
                    {aspiration.school ? (
                      <>Nguyện vọng: <b>{aspiration.school.name}</b> · Khối A00/B00</>
                    ) : (
                      'Chọn mốc điểm mong muốn cho kỳ thi THPT 2025'
                    )}
                  </p>
                </div>
              </div>
              <div className="st-target-selector">
                {[65, 75, 85, 95].map((gVal) => (
                  <button
                    key={gVal}
                    className={'st-target-pill' + (goal === gVal ? ' on' : '')}
                    onClick={() => setGoal(gVal)}
                  >
                    {(gVal / 10).toFixed(1)}+ điểm
                  </button>
                ))}
              </div>
            </div>

            {/* 3 Thẻ hành động khởi đầu 1 chạm */}
            <div className="st-starter-grid">
              <a className="st-starter-card is-primary" href="#roadmap">
                <span className="st-starter-badge">Khuyên dùng</span>
                <span className="st-starter-icon"><Ic n="sparkles" size={24} /></span>
                <h4>Lộ trình học AI cá nhân hóa</h4>
                <p>Hệ thống tự động phát hiện lỗ hổng và thiết kế chuỗi bài tập tăng điểm từng tuần.</p>
                <span className="st-starter-cta">Bắt đầu ngay →</span>
              </a>

              <a className="st-starter-card" href="#exam">
                <span className="st-starter-badge is-blue">Chuẩn 2025</span>
                <span className="st-starter-icon"><Ic n="book" size={24} /></span>
                <h4>Làm đề thi thử THPT</h4>
                <p>Thử sức với cấu trúc 3 phần mới: Trắc nghiệm 4 chọn, Đúng/Sai và Điền ngắn.</p>
                <span className="st-starter-cta">Vào phòng thi →</span>
              </a>

              <a className="st-starter-card" href="#games">
                <span className="st-starter-badge is-green">Trực quan</span>
                <span className="st-starter-icon"><Ic n="zap" size={24} /></span>
                <h4>Phòng Lab 3D & Mini-Game</h4>
                <p>Thực hành phản ứng hóa học 3D, cân bằng phương trình và đấu trí nguyên tố.</p>
                <span className="st-starter-cta">Vào phòng Lab →</span>
              </a>
            </div>

            {/* Nhiệm vụ khởi động nhận XP */}
            <div className="st-card st-quest-card">
              <div className="st-quest-head">
                <span className="st-ico"><Ic n="award" size={20} /></span>
                <div>
                  <h4>Nhiệm vụ khởi động học tập</h4>
                  <small>Hoàn thành để nhận điểm XP và thăng hạng danh hiệu</small>
                </div>
              </div>
              <div className="st-quest-list">
                <div className="st-quest-item">
                  <div className="st-quest-check" />
                  <div className="st-quest-info">
                    <b>Làm bài kiểm tra hoặc bài luyện tập đầu tiên</b>
                    <small>Mở khóa biểu đồ tiến độ & năng lực phân tích cá nhân</small>
                  </div>
                  <span className="st-quest-xp">+100 XP</span>
                </div>
                <div className="st-quest-item">
                  <div className="st-quest-check" />
                  <div className="st-quest-info">
                    <b>Đạt điểm trên 7.0 ở một đề bất kỳ</b>
                    <small>Khẳng định kiến thức nền tảng vững chắc</small>
                  </div>
                  <span className="st-quest-xp">+80 XP</span>
                </div>
                <div className="st-quest-item">
                  <div className="st-quest-check" />
                  <div className="st-quest-info">
                    <b>Duy trì chuỗi học tập 3 ngày liên tiếp</b>
                    <small>Hình thành thói quen rèn luyện đều đặn mỗi ngày</small>
                  </div>
                  <span className="st-quest-xp">+150 XP</span>
                </div>
              </div>
              <div className="st-quest-foot">
                <span>Bạn muốn xem trước các biểu đồ phân tích trông như thế nào?</span>
                <button className="st-btn ghost" onClick={() => setIsDemo(true)}>
                  <Ic n="sparkles" size={14} /> Xem trước dữ liệu mẫu
                </button>
              </div>
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
                <p>Chưa có bài hoàn thành trong khoảng thời gian và môn đang chọn.</p>
                <div className="st-state-actions">
                  <button className="st-btn primary" onClick={() => { setRange('all'); setSubject('all'); }}>Xem tất cả</button>
                </div>
              </div>
            ) : (
              <>
                {/* ----- Chỉ số chính (KPIs) ----- */}
                <div className="st-grid-kpi">
                  <Kpi icon="list" tone="blue" label="Lượt hoàn thành" value={sum.n}
                    delta={view.days && prevSum.n ? <Delta cur={sum.n} prev={prevSum.n} /> : null}
                    sub={view.days ? `${prevSum.n} lượt kỳ trước` : `${sum.q} câu`} />
                  <Kpi icon="trend" tone="violet" label="Điểm trung bình" value={`${sum.avg}%`}
                    delta={view.days && prevSum.n ? <Delta cur={sum.avg} prev={prevSum.avg} /> : null}
                    sub={sum.avg >= goal ? 'Đạt mục tiêu' : `Thiếu ${goal - sum.avg}% so với mục tiêu`} />
                  <Kpi icon="award" tone="amber" label="Cao nhất" value={`${sum.best}%`} sub={`Thấp nhất ${Math.min(...cur.map((a) => a.pct))}%`} />
                  <Kpi icon="help" tone="green" label="Câu đúng" value={`${sum.correct}/${sum.q}`} sub={`${sum.q ? Math.round((sum.correct / sum.q) * 100) : 0}% chính xác`} />
                  <Kpi icon="clock" tone="pink" label="Thời gian làm" value={fmtDur(sum.sec)} sub={avgPacingSec ? `≈ ${avgPacingSec} giây/câu` : null} />
                </div>

                {/* ----- Khối phân tích năng lực THPT 2025 ----- */}
                <div className="st-row">
                  <section className="st-card st-span-7">
                    <div className="st-card-head">
                      <h3><Ic n="layers" size={17} /> Tháp 4 mức độ nhận thức (Chuẩn THPT 2025)</h3>
                      <small className="st-sub">Dựa trên cơ cấu câu hỏi đã làm</small>
                    </div>
                    <CognitiveLevels avgScore={sum.avg || 75} />
                  </section>

                  <section className="st-card st-span-5 st-predict-card">
                    <div className="st-card-head">
                      <h3><Ic n="sparkles" size={17} /> Dự đoán điểm thi THPT</h3>
                      <span className="st-pill ok">Mô hình AI</span>
                    </div>
                    {predictedScore && (
                      <div className="st-predict-body">
                        <div className="st-predict-num">
                          <b>{predictedScore.low} – {predictedScore.high}</b>
                          <span>/ 10 điểm</span>
                        </div>
                        <p className="st-predict-note">
                          Dựa trên phong độ {cur.length} lượt thi gần nhất. Mục tiêu của bạn: <b>{(goal / 10).toFixed(1)} điểm</b>.
                        </p>
                        {avgPacingSec && (
                          <div className="st-pacing-box">
                            <span>Tốc độ trung bình: <b>{avgPacingSec}s / câu</b></span>
                            <small>{avgPacingSec <= 75 ? 'Tốc độ tốt — đúng nhịp đề thi 50 phút.' : 'Cần tăng tốc ở các câu nhận biết để kịp giờ.'}</small>
                          </div>
                        )}
                      </div>
                    )}
                  </section>
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

                {/* ----- Theo môn + cần ôn tập ----- */}
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
                    <h3>Chuyên đề cần ôn tập gấp</h3>
                    {!weakSubjects.length && !weakAttempts.length ? (
                      <p className="st-okline"><Ic n="check" size={16} sw={2.2} /> Mọi bài thi và chuyên đề đều đạt mục tiêu {goal}%.</p>
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
                            <small className="st-sub">Bài làm cần gỡ điểm</small>
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
                        <a className="st-btn primary" href="#roadmap"><Ic n="play" size={13} /> Ôn tập theo Lộ trình AI</a>
                      </>
                    )}
                  </section>
                </div>

                {/* ----- Heatmap 14 tuần ----- */}
                <section className="st-card">
                  <h3>Hoạt động học tập {HEAT_WEEKS} tuần gần đây</h3>
                  <Heatmap counts={view.counts} />
                </section>

                {/* ----- Lịch sử làm bài ----- */}
                <section className="st-card">
                  <div className="st-card-head">
                    <h3>Lịch sử làm bài chi tiết</h3>
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
                      Xem thêm ({history.length - shown} bài)
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
