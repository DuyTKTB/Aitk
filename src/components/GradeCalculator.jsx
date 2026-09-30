import { useState, useMemo, useEffect, useRef, useReducer } from 'react';
import { useLocalStorage, dayKey } from '../hooks.js';
import { mastery } from '../lib/srs.js';
import { ELEMENTS, norm } from '../data/elements.js';
import { Ico } from './QuizIcons.jsx';

/* ============================================================
   HẰNG SỐ
   ============================================================ */
const GROUPS = [['tx', 'Thường xuyên', 'TX'], ['gk', 'Giữa kỳ', 'GK'], ['ck', 'Cuối kỳ', 'CK']];
const TERMS = [['hk1', 'Học kỳ 1'], ['hk2', 'Học kỳ 2'], ['year', 'Cả năm']];

const PRESETS = [
  { name: '1/2/3', w: { tx: 1, gk: 2, ck: 3 }, n: { tx: 4, gk: 1, ck: 1 }, desc: 'Phổ biến: 4 TX, 1 GK, 1 CK' },
  { name: '1/1/2', w: { tx: 1, gk: 1, ck: 2 }, n: { tx: 3, gk: 1, ck: 1 }, desc: 'Một số trường: 3 TX, 1 GK, 1 CK' },
  { name: '1/2/2', w: { tx: 1, gk: 2, ck: 2 }, n: { tx: 3, gk: 1, ck: 1 }, desc: '3 TX, 1 GK, 1 CK' },
  { name: '1/1/3', w: { tx: 1, gk: 1, ck: 3 }, n: { tx: 3, gk: 1, ck: 1 }, desc: '3 TX, 1 GK, 1 CK' },
];

const RANKS = [
  { min: 9.0, label: 'Xuất sắc', color: 'var(--post)', hex: '#b7dc9a', gpa: 4.0, letter: 'A' },
  { min: 8.0, label: 'Giỏi', color: 'var(--metalloid)', hex: '#8fd6c4', gpa: 3.5, letter: 'B+' },
  { min: 6.5, label: 'Khá', color: 'var(--transition)', hex: '#f3e27a', gpa: 3.0, letter: 'B' },
  { min: 5.0, label: 'Trung bình', color: 'var(--alkaline)', hex: '#ffc46b', gpa: 2.0, letter: 'C' },
  { min: 3.5, label: 'Yếu', color: 'var(--alkali)', hex: '#ff9b85', gpa: 1.0, letter: 'D' },
  { min: 0, label: 'Kém', color: 'var(--actinide)', hex: '#c9c5b8', gpa: 0, letter: 'F' },
];

const COMMON = ['Toán', 'Ngữ văn', 'Tiếng Anh', 'Vật lí', 'Hóa học', 'Sinh học', 'Lịch sử', 'Địa lí'];

const COMBOS = [
  ['A00', 'Toán, Vật lí, Hóa học', ['toan', 'ly', 'hoa']],
  ['A01', 'Toán, Vật lí, Tiếng Anh', ['toan', 'ly', 'anh']],
  ['B00', 'Toán, Hóa học, Sinh học', ['toan', 'hoa', 'sinh']],
  ['C00', 'Ngữ văn, Lịch sử, Địa lí', ['van', 'su', 'dia']],
  ['D01', 'Toán, Ngữ văn, Tiếng Anh', ['toan', 'van', 'anh']],
  ['D07', 'Toán, Hóa học, Tiếng Anh', ['toan', 'hoa', 'anh']],
];
const SUBJ_KEYS = {
  toan: ['toan'], ly: ['vat li', 'vat ly', 'ly'], hoa: ['hoa', 'hoa hoc'], sinh: ['sinh', 'sinh hoc'],
  van: ['van', 'ngu van'], anh: ['anh', 'tieng anh', 'english'], su: ['lich su', 'su'], dia: ['dia', 'dia li', 'dia ly'],
};

const BACKUP_KEYS = [
  'cs-grade-v2', 'cs-grade-history-v2', 'cs-grade-adm', 'cs-srs-v2', 'cs-xp', 'cs-streak-v2',
  'cs-achievements', 'cs-quiz-stats', 'cs-wrong-bank', 'cs-quiz-prefs',
];

/* ============================================================
   TÍNH TOÁN
   ============================================================ */
const uid = () => Math.random().toString(36).slice(2, 9);
const num = (v) => {
  if (v === '' || v == null) return null;
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isNaN(n) ? NaN : n;
};
const valid = (n) => n !== null && !Number.isNaN(n) && n >= 0 && n <= 10;
const rnd = (x, mode) => { const f = mode === 'two' ? 100 : 10; return Math.round((x + 1e-9) * f) / f; };
const eps = (mode) => (mode === 'two' ? 0.005 : 0.05);
const rankOf = (s) => RANKS.find((r) => s >= r.min - 1e-9) || RANKS[RANKS.length - 1];
const blankSub = (name = '', w) => ({
  id: uid(), name, coef: 1, w: w || { tx: 1, gk: 2, ck: 3 }, tx: ['', '', '', ''], gk: [''], ck: [''], date: '',
});

function calc(sub, mode) {
  let sum = 0, wf = 0, wp = 0, bad = 0;
  for (const [k] of GROUPS) {
    const w = Number(sub.w[k]) || 0;
    for (const v of sub[k]) {
      const n = num(v);
      if (n === null) wp += w;
      else if (valid(n)) { sum += n * w; wf += w; }
      else bad++;
    }
  }
  const wt = wf + wp;
  const raw = wf > 0 ? sum / wf : null;
  return {
    sum, wf, wp, wt, bad, raw,
    score: raw === null ? null : rnd(raw, mode),
    worst: wt > 0 ? sum / wt : null,
    best: wt > 0 ? (sum + 10 * wp) / wt : null,
  };
}

/* điểm trung bình phần còn thiếu cần đạt để tổng kết ≥ target */
const needFor = (c, target, mode) => (c.wp > 0 ? ((target - eps(mode)) * c.wt - c.sum) / c.wp : null);

function termStats(subs, mode) {
  const rows = subs.map((s) => ({ s, c: calc(s, mode) }));
  let cf = 0, sf = 0, cAll = 0, base = 0, slope = 0;
  for (const { s, c } of rows) {
    const co = Number(s.coef) || 0;
    if (c.score !== null) { cf += co; sf += co * c.score; }
    if (c.wt > 0) { cAll += co; base += (co * c.sum) / c.wt; slope += (co * c.wp) / c.wt; }
  }
  const gpaRaw = cf > 0 ? sf / cf : null;
  return {
    rows, cAll, base, slope,
    gpa: gpaRaw === null ? null : rnd(gpaRaw, mode),
    worst: cAll > 0 ? base / cAll : null,
    best: cAll > 0 ? (base + 10 * slope) / cAll : null,
  };
}

const yearOf = (a, b, mode, ym) => (a != null && b != null ? rnd(ym === 'w2' ? (a + 2 * b) / 3 : (a + b) / 2, mode) : a ?? b ?? null);

const pendingText = (sub) =>
  GROUPS.map(([k, , short]) => {
    const n = sub[k].filter((v) => num(v) === null).length;
    return n ? (n > 1 ? `${short}×${n}` : short) : null;
  }).filter(Boolean).join(', ');

function fmt(score, st) {
  if (score == null) return '—';
  if (st.scale === '4') return rankOf(score).gpa.toFixed(1);
  if (st.scale === 'ab') return rankOf(score).letter;
  return score.toFixed(st.round === 'two' ? 2 : 1);
}

/* ============================================================
   TRẠNG THÁI (có hoàn tác)
   ============================================================ */
function initState() {
  const base = { term: 'hk1', round: 'one', yearMode: 'w2', scale: '10', sel: null, terms: { hk1: [], hk2: [] } };
  try {
    const old = JSON.parse(localStorage.getItem('cs-grade'));
    if (old && old.tx) {
      base.terms.hk1 = [{ ...blankSub('Môn 1', old.w), tx: old.tx, gk: old.gk, ck: old.ck }];
      return base;
    }
  } catch { /* bỏ qua */ }
  base.terms.hk1 = ['Toán', 'Hóa học', 'Ngữ văn'].map((n) => blankSub(n));
  return base;
}

function download(name, blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 500);
}

function drawReport({ title, gpaText, rank, rows, hide, st }) {
  const W = 1080, H = Math.max(900, 620 + rows.length * 78 + 90);
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  const F = '"Space Grotesk", system-ui, sans-serif';
  g.fillStyle = '#efece4'; g.fillRect(0, 0, W, H);
  g.fillStyle = rank ? rank.hex : '#c9c5b8'; g.fillRect(0, 0, W, 16);
  g.fillStyle = '#111';
  g.font = `600 36px ${F}`; g.fillText(title, 72, 110);
  g.font = `400 26px ${F}`; g.fillStyle = '#6b675e'; g.fillText('Điểm trung bình', 72, 180);
  g.fillStyle = '#111'; g.font = `700 210px ${F}`; g.fillText(gpaText, 64, 380);
  if (rank) {
    g.fillStyle = rank.hex;
    const w = 24 + rank.label.length * 20;
    g.beginPath(); g.roundRect(72, 420, w + 40, 64, 32); g.fill();
    g.fillStyle = '#111'; g.font = `700 30px ${F}`; g.fillText(rank.label, 96, 463);
  }
  let y = 580;
  rows.forEach((r, i) => {
    g.fillStyle = '#111'; g.font = `500 28px ${F}`;
    g.fillText(hide ? `Môn ${i + 1}` : r.name || `Môn ${i + 1}`, 72, y);
    g.textAlign = 'right'; g.font = `700 30px ${F}`; g.fillText(fmt(r.score, st), W - 72, y); g.textAlign = 'left';
    g.fillStyle = 'rgba(17,17,17,.12)'; g.beginPath(); g.roundRect(72, y + 18, W - 144, 14, 7); g.fill();
    g.fillStyle = rankOf(r.score).hex; g.beginPath(); g.roundRect(72, y + 18, Math.max(14, ((W - 144) * r.score) / 10), 14, 7); g.fill();
    y += 78;
  });
  g.fillStyle = '#6b675e'; g.font = `400 22px ${F}`;
  g.fillText(`A7 K60 DTA · CHEM STUDY · ${new Date().toLocaleDateString('vi-VN')}`, 72, H - 48);
  return cv;
}

/* ============================================================
   BIỂU ĐỒ ĐƯỜNG (SVG thuần)
   ============================================================ */
function LineChart({ pts, xMin, xMax, yMin = 0, yMax = 10, marker, label, w = 560, h = 220, xTicks }) {
  const P = { l: 32, r: 62, t: 12, b: 26 };
  const X = (x) => P.l + ((x - xMin) / (xMax - xMin || 1)) * (w - P.l - P.r);
  const Y = (y) => h - P.b - ((y - yMin) / (yMax - yMin || 1)) * (h - P.t - P.b);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${X(p.x).toFixed(1)} ${Y(p.y).toFixed(1)}`).join('');
  const bands = [...RANKS].reverse().map((r, i, arr) => ({ r, lo: r.min, hi: arr[i + 1] ? arr[i + 1].min : 10 }))
    .filter((b) => b.hi > yMin && b.lo < yMax);
  return (
    <svg className="gc-chart" viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label}>
      {bands.map(({ r, lo, hi }) => (
        <g key={r.label}>
          <rect x={P.l} width={w - P.l - P.r} y={Y(Math.min(hi, yMax))} height={Math.max(0, Y(Math.max(lo, yMin)) - Y(Math.min(hi, yMax)))} style={{ fill: r.color }} opacity=".22" />
          {lo >= yMin && lo > 0 && <line x1={P.l} x2={w - P.r} y1={Y(lo)} y2={Y(lo)} className="gc-grid" />}
          <text x={w - P.r + 6} y={Y(Math.min(hi, yMax) - 0.001) + 13} className="gc-tick">{r.label}</text>
        </g>
      ))}
      {[yMin, Math.round((yMin + yMax) / 2), yMax].map((v) => <text key={v} x={P.l - 6} y={Y(v) + 4} textAnchor="end" className="gc-tick">{v}</text>)}
      {(xTicks || []).map((t) => <text key={t.x} x={X(t.x)} y={h - 6} textAnchor="middle" className="gc-tick">{t.l}</text>)}
      {pts.length > 1 && <path d={d} className="gc-line" />}
      {pts.length === 1 && <circle cx={X(pts[0].x)} cy={Y(pts[0].y)} r="5" className="gc-dot" />}
      {pts.length > 2 && pts.map((p) => <circle key={p.x} cx={X(p.x)} cy={Y(p.y)} r="3.5" className="gc-dot" />)}
      {marker && <g><line x1={X(marker.x)} x2={X(marker.x)} y1={P.t} y2={h - P.b} className="gc-mark-line" /><circle cx={X(marker.x)} cy={Y(marker.y)} r="6.5" className="gc-mark" /></g>}
    </svg>
  );
}

/* ============================================================
   THẺ MÔN HỌC
   ============================================================ */
function SubjectCard({ sub, c, st, selected, onPatch, onRemove, onSelect, chem }) {
  const patch = (fn, key) => onPatch(sub.id, fn, key);
  const setCell = (k, i, v) => patch((x) => ({ ...x, [k]: x[k].map((o, j) => (j === i ? v : o)) }), `c${sub.id}${k}${i}`);
  const addCell = (k) => patch((x) => ({ ...x, [k]: [...x[k], ''] }));
  const delCell = (k, i) => patch((x) => ({ ...x, [k]: x[k].length > 1 ? x[k].filter((_, j) => j !== i) : [''] }));
  const applyPreset = (p) => patch((x) => {
    const y = { ...x, w: { ...p.w } };
    for (const [k] of GROUPS) { const a = [...y[k]]; while (a.length < p.n[k]) a.push(''); y[k] = a; }
    return y;
  });
  const onPaste = (k, i, e) => {
    const parts = e.clipboardData.getData('text').split(/[\s;]+/).filter(Boolean);
    if (parts.length < 2) return;
    e.preventDefault();
    patch((x) => {
      const a = [...x[k]];
      parts.forEach((p, j) => { a[i + j] = p.replace(',', '.'); });
      for (let j = 0; j < a.length; j++) if (a[j] === undefined) a[j] = '';
      return { ...x, [k]: a };
    });
  };
  const onKey = (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const all = [...document.querySelectorAll('.gc-cell .gc-in')];
    const nx = all[all.indexOf(e.target) + 1] || e.target;
    nx.focus(); nx.select?.();
  };
  const rank = c.score !== null ? rankOf(c.score) : null;
  const same = (p) => ['tx', 'gk', 'ck'].every((k) => Number(sub.w[k]) === p.w[k]);

  return (
    <article className={'gc-sub' + (selected ? ' sel' : '')}>
      <header className="gc-sub-h">
        <input className="gc-name" value={sub.name} placeholder="Tên môn" aria-label="Tên môn" onChange={(e) => patch((x) => ({ ...x, name: e.target.value }), 'n' + sub.id)} />
        <label className="gc-coef" title="Hệ số của môn khi tính điểm trung bình học kỳ">
          <span>Hệ số môn</span>
          <input type="number" min="0" step="0.5" value={sub.coef} onChange={(e) => patch((x) => ({ ...x, coef: e.target.value }), 'k' + sub.id)} />
        </label>
        <button type="button" className="gc-icon" onClick={onRemove} aria-label={`Xóa môn ${sub.name || ''}`}><Ico n="trash" size={16} /></button>
      </header>

      <div className="gc-presets" role="group" aria-label="Hệ số mẫu">
        {PRESETS.map((p) => (
          <button key={p.name} type="button" className={'chip' + (same(p) ? ' on' : '')} aria-pressed={same(p)} title={p.desc} onClick={() => applyPreset(p)}>{p.name}</button>
        ))}
      </div>

      {GROUPS.map(([k, label, short]) => (
        <div className="gc-group" key={k}>
          <div className="gc-group-h">
            <b>{short}</b><small>{label}</small>
            <label className="gc-w">hệ số
              <input type="number" min="0" step="0.5" value={sub.w[k]} onChange={(e) => patch((x) => ({ ...x, w: { ...x.w, [k]: e.target.value } }), `w${sub.id}${k}`)} aria-label={`Hệ số ${short}`} />
            </label>
          </div>
          <div className="gc-cells">
            {sub[k].map((v, i) => {
              const n = num(v);
              const bad = n !== null && !valid(n);
              return (
                <span className="gc-cell" key={i}>
                  <input className={'gc-in' + (bad ? ' bad' : '')} inputMode="decimal" value={v} placeholder="chưa có" aria-label={`${label} ${i + 1}`} aria-invalid={bad}
                    onChange={(e) => setCell(k, i, e.target.value)} onKeyDown={onKey} onPaste={(e) => onPaste(k, i, e)} />
                  <button type="button" className="gc-del" onClick={() => delCell(k, i)} aria-label="Xóa ô điểm"><Ico n="close" size={11} /></button>
                </span>
              );
            })}
            <button type="button" className="gc-add" onClick={() => addCell(k)} aria-label={`Thêm ô ${short}`}><Ico n="plus" size={14} /></button>
          </div>
        </div>
      ))}

      {c.bad > 0 && <p className="gc-warn"><Ico n="warn" size={14} /> {c.bad} ô ngoài khoảng 0–10, chưa được tính.</p>}

      <footer className="gc-sub-f">
        <div className="gc-sub-score" style={{ '--c': rank ? rank.color : 'var(--soft)' }}>
          <b>{fmt(c.score, st)}</b>
          <span>{rank ? rank.label : 'Chưa có điểm'}</span>
        </div>
        <div className="gc-sub-range">
          {c.wp > 0 && c.worst !== null && <small>Còn thiếu {pendingText(sub)}. Dự kiến {c.worst.toFixed(1)} đến {c.best.toFixed(1)}</small>}
          {c.wp === 0 && c.score !== null && <small>Đã nhập đủ điểm</small>}
          {chem != null && norm(sub.name).match(/(^|\s)hoa($|\s)/) && <small>Độ nhớ nguyên tố trong Quiz: {chem}%</small>}
        </div>
        <button type="button" className={'btn sm' + (selected ? ' primary' : '')} onClick={onSelect}><Ico n="sliders" size={14} /> Phân tích</button>
      </footer>
    </article>
  );
}

/* ============================================================
   PHÂN TÍCH MỘT MÔN
   ============================================================ */
function Analysis({ sub, c, ts, st, patch }) {
  const [v, setV] = useState(8);
  const mode = st.round;
  const scAt = (x) => (c.wt > 0 ? (c.sum + x * c.wp) / c.wt : null);
  const gpaAt = (x) => {
    let cf = 0, sf = 0;
    for (const { s, c: cc } of ts.rows) {
      const co = Number(s.coef) || 0;
      const val = s.id === sub.id ? (c.wt > 0 ? rnd(scAt(x), mode) : null) : cc.score;
      if (val !== null) { cf += co; sf += co * val; }
    }
    return cf > 0 ? rnd(sf / cf, mode) : null;
  };
  const pts = Array.from({ length: 21 }, (_, i) => ({ x: i / 2, y: scAt(i / 2) ?? 0 }));
  const cur = scAt(v);
  const rows = RANKS.slice(0, -1).map((r) => ({ r, x: needFor(c, r.min, mode) }));
  const top = rows.find((o) => o.x !== null && o.x <= 10);
  const days = sub.date ? Math.ceil((new Date(sub.date + 'T00:00:00') - new Date()) / 864e5) : null;

  if (c.wp === 0) {
    return <p className="gc-empty">Môn <b>{sub.name || 'này'}</b> đã nhập đủ điểm. Thêm một ô trống ở nhóm nào đó để xem các mốc cần đạt.</p>;
  }
  return (
    <div className="gc-an">
      <div className="gc-an-col">
        <h3 className="gc-h3">Cần bao nhiêu để đạt…</h3>
        <p className="gc-note">Điểm trung bình cần có ở phần còn thiếu ({pendingText(sub)}) để tổng kết đạt từng loại.</p>
        <ul className="gc-need">
          {rows.map(({ r, x }) => {
            const done = x <= 0, no = x > 10;
            return (
              <li key={r.label} className={done ? 'done' : no ? 'no' : ''}>
                <i style={{ background: r.color }} />
                <span>{r.label}<small>từ {r.min}</small></span>
                <b>{done ? 'Đã chắc chắn' : no ? 'Không thể' : '≥ ' + x.toFixed(2)}</b>
              </li>
            );
          })}
        </ul>
        {top && <p className="gc-note">Loại cao nhất còn khả thi: <b>{top.r.label}</b>{top.x > 0 ? ` (cần ≥ ${top.x.toFixed(2)})` : ''}.</p>}
        <label className="gc-date">Ngày thi cuối kỳ
          <input type="date" value={sub.date || ''} onChange={(e) => patch(sub.id, (x) => ({ ...x, date: e.target.value }), 'd' + sub.id)} />
        </label>
        {days !== null && <p className="gc-note">{days > 0 ? `Còn ${days} ngày.` : days === 0 ? 'Thi hôm nay.' : 'Đã qua ngày thi.'}{top && days > 0 && top.x > 0 ? ` Mục tiêu ${top.r.label}: ≥ ${top.x.toFixed(1)} điểm.` : ''}</p>}
      </div>

      <div className="gc-an-col">
        <h3 className="gc-h3">Nếu phần còn thiếu = <span className="gc-val">{v.toFixed(1)}</span></h3>
        <input className="gc-range" type="range" min="0" max="10" step="0.1" value={v} onChange={(e) => setV(+e.target.value)} aria-label="Điểm giả định cho phần còn thiếu" />
        <LineChart pts={pts} xMin={0} xMax={10} marker={{ x: v, y: cur }} label="Điểm tổng kết theo điểm giả định" xTicks={[0, 2.5, 5, 7.5, 10].map((x) => ({ x, l: x }))} />
        <div className="gc-sim">
          <div><small>Tổng kết môn</small><b>{fmt(rnd(cur, mode), st)}</b><span>{rankOf(rnd(cur, mode)).label}</span></div>
          <div><small>ĐTB học kỳ</small><b>{fmt(gpaAt(v), st)}</b><span>{gpaAt(v) !== null ? rankOf(gpaAt(v)).label : ''}</span></div>
        </div>
        <table className="gc-cmp">
          <thead><tr><th>Nếu =</th>{[5, 6, 7, 8, 9, 10].map((x) => <th key={x}>{x}</th>)}</tr></thead>
          <tbody>
            <tr><th>Môn</th>{[5, 6, 7, 8, 9, 10].map((x) => <td key={x} style={{ background: rankOf(rnd(scAt(x), mode)).color }}>{fmt(rnd(scAt(x), mode), st)}</td>)}</tr>
            <tr><th>ĐTB</th>{[5, 6, 7, 8, 9, 10].map((x) => <td key={x}>{fmt(gpaAt(x), st)}</td>)}</tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================================================
   KẾ HOẠCH CẢ HỌC KỲ
   ============================================================ */
function Planner({ ts, st }) {
  const [t, setT] = useState('8');
  const mode = st.round;
  const target = num(t);
  const ok = valid(target);
  const { cAll, base, slope } = ts;
  const x = ok && slope > 0 ? ((target - eps(mode)) * cAll - base) / slope : null;

  const invest = ts.rows.filter(({ s, c }) => c.wp > 0 && c.wt > 0)
    .map(({ s, c }) => ({ s, gain: ((Number(s.coef) || 0) / (cAll || 1)) * (c.wp / c.wt) }))
    .sort((a, b) => b.gain - a.gain).slice(0, 3);
  const drag = ts.gpa === null ? [] : ts.rows.filter(({ c }) => c.score !== null && c.score < ts.gpa)
    .map(({ s, c }) => ({ s, c, d: (Number(s.coef) || 0) * (ts.gpa - c.score) }))
    .sort((a, b) => b.d - a.d).slice(0, 3);

  let msg = 'Nhập mục tiêu từ 0 đến 10.';
  let tone = '';
  if (ok && slope === 0) msg = ts.gpa === null ? 'Chưa có điểm nào để lập kế hoạch.' : 'Đã nhập đủ điểm cho mọi môn. Không còn gì để lập kế hoạch.';
  else if (ok && x !== null) {
    if (x <= 0) { msg = 'Bạn đã chắc chắn đạt mục tiêu này.'; tone = 'ok'; }
    else if (x > 10) { msg = `Không thể đạt với điểm hiện tại. Tối đa chỉ được ${ts.best.toFixed(2)}.`; tone = 'no'; }
    else msg = `Các điểm còn thiếu của mọi môn cần trung bình ≥ ${x.toFixed(2)}.`;
  }

  return (
    <div className="gc-card">
      <h2 className="gc-h2"><Ico n="target" size={20} /> Kế hoạch đạt điểm trung bình học kỳ</h2>
      <div className="gc-plan-in">
        <label>Muốn ĐTB học kỳ
          <input inputMode="decimal" value={t} onChange={(e) => setT(e.target.value)} aria-invalid={!ok} />
        </label>
        <p className={'gc-plan-msg ' + tone} role="status">{msg}</p>
      </div>

      {ts.worst !== null && ts.best !== null && ts.slope > 0 && (
        <p className="gc-note">Khoảng có thể xảy ra: từ <b>{ts.worst.toFixed(2)}</b> (mọi điểm còn thiếu = 0) đến <b>{ts.best.toFixed(2)}</b> (mọi điểm còn thiếu = 10).</p>
      )}

      {x !== null && x > 0 && x <= 10 && (
        <ul className="gc-plan-list">
          {ts.rows.filter(({ c }) => c.wp > 0).map(({ s, c }) => (
            <li key={s.id}><span>{s.name || 'Môn'}<small>còn thiếu {pendingText(s)}</small></span><b>→ {fmt(rnd((c.sum + x * c.wp) / c.wt, st.round), st)}</b></li>
          ))}
        </ul>
      )}

      <div className="gc-two">
        <div>
          <h3 className="gc-h3">Đáng đầu tư nhất</h3>
          {invest.length ? (
            <ul className="gc-rank">
              {invest.map(({ s, gain }, i) => <li key={s.id}><span>{s.name || 'Môn'}</span><small>+{gain.toFixed(2)} ĐTB mỗi 1 điểm</small></li>)}
            </ul>
          ) : <p className="gc-note">Không còn điểm nào để cải thiện.</p>}
        </div>
        <div>
          <h3 className="gc-h3">Đang kéo ĐTB xuống</h3>
          {drag.length ? (
            <ul className="gc-rank">
              {drag.map(({ s, c }) => <li key={s.id}><span>{s.name || 'Môn'}</span><small>{fmt(c.score, st)} so với ĐTB {fmt(ts.gpa, st)}</small></li>)}
            </ul>
          ) : <p className="gc-note">Không có môn nào thấp hơn mức trung bình.</p>}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   ĐIỂM XÉT TUYỂN
   ============================================================ */
function Admission({ rows }) {
  const [a, setA] = useLocalStorage('cs-grade-adm', { combo: 'A00', v: ['', '', ''], bonus: '0', bench: '' });
  const combo = COMBOS.find((c) => c[0] === a.combo) || COMBOS[0];
  const names = combo[1].split(', ');
  const fill = () => {
    const v = combo[2].map((key) => {
      const hit = rows.find(({ s, c }) => c.score !== null && SUBJ_KEYS[key].some((k) => new RegExp('(^|\\s)' + k + '($|\\s)').test(norm(s.name))));
      return hit ? String(hit.c.score) : '';
    });
    setA({ ...a, v });
  };
  const vals = a.v.map(num);
  const all = vals.every(valid);
  const bonus = num(a.bonus) || 0;
  const total = all ? vals.reduce((x, y) => x + y, 0) + bonus : null;
  const bench = num(a.bench);

  return (
    <div className="gc-card">
      <h2 className="gc-h2"><Ico n="calc" size={20} /> Điểm xét tuyển 3 môn</h2>
      <div className="gc-chips">
        {COMBOS.map(([k, d]) => <button key={k} type="button" className={'chip' + (a.combo === k ? ' on' : '')} aria-pressed={a.combo === k} title={d} onClick={() => setA({ ...a, combo: k })}>{k}</button>)}
      </div>
      <div className="gc-adm">
        {names.map((n, i) => (
          <label key={n}>{n}
            <input inputMode="decimal" value={a.v[i]} placeholder="0–10" onChange={(e) => setA({ ...a, v: a.v.map((o, j) => (j === i ? e.target.value : o)) })} />
          </label>
        ))}
        <label>Điểm ưu tiên<input inputMode="decimal" value={a.bonus} onChange={(e) => setA({ ...a, bonus: e.target.value })} /></label>
        <label>Điểm chuẩn tham khảo<input inputMode="decimal" value={a.bench} placeholder="tùy chọn" onChange={(e) => setA({ ...a, bench: e.target.value })} /></label>
      </div>
      <div className="gc-adm-res">
        <div><small>Tổng điểm</small><b>{total === null ? '—' : total.toFixed(2)}</b></div>
        {total !== null && bench !== null && Number.isFinite(bench) && (
          <p className={'gc-plan-msg ' + (total >= bench ? 'ok' : 'no')}>{total >= bench ? `Cao hơn điểm chuẩn ${(total - bench).toFixed(2)}` : `Thiếu ${(bench - total).toFixed(2)} điểm so với điểm chuẩn`}</p>
        )}
        <button type="button" className="btn sm" onClick={fill}><Ico n="refresh" size={14} /> Lấy từ điểm các môn</button>
      </div>
      <p className="gc-note">Điểm ưu tiên và điểm chuẩn do bạn tự nhập, hãy đối chiếu với thông báo của trường.</p>
    </div>
  );
}

/* ============================================================
   MAIN
   ============================================================ */
export default function GradeCalculator() {
  const init = useMemo(initState, []);
  const [state, setState] = useLocalStorage('cs-grade-v2', init);
  const [history, setHistory] = useLocalStorage('cs-grade-history-v2', []);
  const [, setXp] = useLocalStorage('cs-xp', 0);
  const [recs] = useLocalStorage('cs-srs-v2', {});
  const [toast, setToast] = useState('');
  const [hideNames, setHideNames] = useState(false);
  const [, bump] = useReducer((n) => n + 1, 0);

  const stateRef = useRef(state);
  stateRef.current = state;
  const past = useRef([]);
  const future = useRef([]);
  const lastKey = useRef({ k: '', t: 0 });
  const fileRef = useRef(null);

  const commit = (updater, key = '') => {
    const prev = stateRef.current;
    const next = typeof updater === 'function' ? updater(prev) : updater;
    const now = Date.now();
    if (!(key && lastKey.current.k === key && now - lastKey.current.t < 900)) past.current = [...past.current.slice(-49), prev];
    lastKey.current = { k: key, t: now };
    future.current = [];
    stateRef.current = next;
    setState(next);
    bump();
  };
  const undo = () => {
    if (!past.current.length) return;
    future.current.push(stateRef.current);
    const p = past.current.pop();
    lastKey.current = { k: '', t: 0 };
    stateRef.current = p; setState(p); bump();
  };
  const redo = () => {
    if (!future.current.length) return;
    past.current.push(stateRef.current);
    const n = future.current.pop();
    stateRef.current = n; setState(n); bump();
  };
  useEffect(() => {
    const on = (e) => {
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || !(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); redo(); }
    };
    addEventListener('keydown', on);
    return () => removeEventListener('keydown', on);
  });
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3600);
    return () => clearTimeout(t);
  }, [toast]);

  const term = state.term;
  const isYear = term === 'year';
  const subs = state.terms[isYear ? 'hk1' : term] || [];
  const ts = useMemo(() => termStats(state.terms[isYear ? 'hk1' : term] || [], state.round), [state.terms, term, isYear, state.round]);
  const ts1 = useMemo(() => termStats(state.terms.hk1 || [], state.round), [state.terms, state.round]);
  const ts2 = useMemo(() => termStats(state.terms.hk2 || [], state.round), [state.terms, state.round]);

  const patchSub = (id, fn, key) => commit((s) => ({ ...s, terms: { ...s.terms, [s.term]: s.terms[s.term].map((x) => (x.id === id ? fn(x) : x)) } }), key);
  const addSub = (name = '') => commit((s) => ({ ...s, terms: { ...s.terms, [s.term]: [...s.terms[s.term], blankSub(name)] } }));
  const removeSub = (id) => commit((s) => ({ ...s, terms: { ...s.terms, [s.term]: s.terms[s.term].filter((x) => x.id !== id) } }));
  const copyFromHk1 = () => commit((s) => ({
    ...s, terms: { ...s.terms, hk2: s.terms.hk1.map((x) => ({ ...blankSub(x.name, { ...x.w }), coef: x.coef })) },
  }));
  const setOpt = (k, v) => commit((s) => ({ ...s, [k]: v }));

  const chem = useMemo(() => {
    const has = Object.keys(recs || {}).length;
    if (!has) return null;
    return Math.round(ELEMENTS.reduce((a, e) => a + (recs[e.atomicNumber] ? mastery(recs[e.atomicNumber]) : 0), 0) / ELEMENTS.length);
  }, [recs]);

  /* ---- cả năm ---- */
  const year = useMemo(() => {
    const names = [];
    const map = {};
    for (const [tk, list] of [['hk1', ts1.rows], ['hk2', ts2.rows]]) {
      for (const { s, c } of list) {
        const key = norm(s.name || '') || s.id;
        if (!map[key]) { map[key] = { name: s.name || 'Môn', coef: Number(s.coef) || 0 }; names.push(key); }
        map[key][tk] = c.score;
      }
    }
    const rows = names.map((k) => ({ ...map[k], score: yearOf(map[k].hk1 ?? null, map[k].hk2 ?? null, state.round, state.yearMode) }));
    let cf = 0, sf = 0;
    rows.forEach((r) => { if (r.score !== null) { cf += r.coef; sf += r.coef * r.score; } });
    return { rows, gpa: cf > 0 ? rnd(sf / cf, state.round) : null, gpaTerms: yearOf(ts1.gpa, ts2.gpa, state.round, state.yearMode) };
  }, [ts1, ts2, state.round, state.yearMode]);

  const heroGpa = isYear ? year.gpa : ts.gpa;
  const heroRank = heroGpa !== null ? rankOf(heroGpa) : null;
  const selId = subs.some((x) => x.id === state.sel) ? state.sel : subs[0]?.id;
  const selRow = ts.rows.find(({ s }) => s.id === selId);

  /* ---- lịch sử ---- */
  const hist = history.filter((h) => h.term === term);
  const trend = [...hist].reverse();
  const save = () => {
    if (ts.gpa === null) return;
    const prev = history.find((h) => h.term === term);
    const entry = {
      id: uid(), at: Date.now(), term, gpa: ts.gpa,
      rows: ts.rows.filter((r) => r.c.score !== null).map((r) => ({ name: r.s.name || 'Môn', score: r.c.score })),
      detail: JSON.parse(JSON.stringify(subs)),
    };
    setHistory([entry, ...history].slice(0, 40));
    if (prev && ts.gpa > prev.gpa) { setXp((x) => x + 20); setToast(`ĐTB tăng ${(ts.gpa - prev.gpa).toFixed(2)} so với lần lưu trước. +20 XP`); }
    else setToast('Đã lưu điểm học kỳ');
  };
  const restore = (h) => { commit((s) => ({ ...s, term: h.term, terms: { ...s.terms, [h.term]: JSON.parse(JSON.stringify(h.detail)) } })); setToast('Đã nạp lại bản đã lưu'); };

  /* ---- xuất / nhập ---- */
  const exportImage = () => {
    const rows = isYear ? year.rows.filter((r) => r.score !== null) : ts.rows.filter((r) => r.c.score !== null).map((r) => ({ name: r.s.name, score: r.c.score }));
    if (!rows.length || heroGpa === null) { setToast('Chưa có điểm để xuất ảnh'); return; }
    const cv = drawReport({ title: `Bảng điểm ${TERMS.find((t) => t[0] === term)[1]}`, gpaText: fmt(heroGpa, state), rank: heroRank, rows, hide: hideNames, st: state });
    cv.toBlob((b) => b && download(`bang-diem-${term}-${dayKey()}.png`, b));
  };
  const exportCSV = () => {
    const lines = [['Học kỳ', 'Môn', 'Hệ số môn', 'TX', 'GK', 'CK', 'Tổng kết']];
    for (const tk of ['hk1', 'hk2']) {
      for (const s of state.terms[tk] || []) lines.push([tk.toUpperCase(), s.name, s.coef, s.tx.join(' '), s.gk.join(' '), s.ck.join(' '), calc(s, state.round).score ?? '']);
    }
    const csv = lines.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n');
    download(`diem-${dayKey()}.csv`, new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
  };
  const exportJSON = (all) => {
    const data = all
      ? { kind: 'backup', version: 1, at: new Date().toISOString(), data: Object.fromEntries(BACKUP_KEYS.map((k) => [k, localStorage.getItem(k)]).filter((e) => e[1] !== null)) }
      : { kind: 'grade', version: 2, at: new Date().toISOString(), state, history };
    download(`${all ? 'chem-study-backup' : 'diem'}-${dayKey()}.json`, new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  };
  const importJSON = (ev) => {
    const f = ev.target.files[0];
    ev.target.value = '';
    if (!f) return;
    const rd = new FileReader();
    rd.onload = (e) => {
      try {
        const d = JSON.parse(e.target.result);
        if (!confirm('Ghi đè dữ liệu hiện tại bằng file này?')) return;
        if (d.kind === 'backup' && d.data) {
          for (const [k, v] of Object.entries(d.data)) {
            if (!BACKUP_KEYS.includes(k) || typeof v !== 'string') continue;
            localStorage.setItem(k, v);
            dispatchEvent(new CustomEvent('cs-ls', { detail: k }));
          }
        } else if (d.kind === 'grade' && d.state) {
          stateRef.current = d.state; setState(d.state); setHistory(d.history || []);
        } else throw new Error();
        past.current = []; future.current = []; bump();
        setToast('Đã nhập dữ liệu');
      } catch { alert('File không hợp lệ'); }
    };
    rd.readAsText(f);
  };

  const missing = COMMON.filter((n) => !subs.some((s) => norm(s.name) === norm(n)));
  const delta = trend.length > 1 ? trend[trend.length - 1].gpa - trend[trend.length - 2].gpa : null;

  /* ============================================================ */
  return (
    <section className="wrap narrow gc">
      <header className="gc-head">
        <h1>Tính <em>điểm</em></h1>
        <div className="gc-tools">
          <button type="button" className="btn sm icon" onClick={undo} disabled={!past.current.length} aria-label="Hoàn tác (Ctrl+Z)"><Ico n="undo" size={16} /></button>
          <button type="button" className="btn sm icon" onClick={redo} disabled={!future.current.length} aria-label="Làm lại (Ctrl+Y)"><Ico n="redo" size={16} /></button>
        </div>
      </header>

      {/* ===== Học kỳ ===== */}
      <div className="gc-tabs" role="tablist" aria-label="Học kỳ">
        {TERMS.map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={term === k} className={term === k ? 'on' : ''} onClick={() => setOpt('term', k)}>{l}</button>
        ))}
      </div>

      {/* ===== Tổng quan ===== */}
      <div className="gc-hero" style={{ '--c': heroRank ? heroRank.color : 'var(--soft)' }}>
        <div className="gc-hero-main">
          <small>{isYear ? 'Điểm trung bình cả năm' : `Điểm trung bình ${TERMS.find((t) => t[0] === term)[1].toLowerCase()}`}</small>
          <b>{fmt(heroGpa, state)}</b>
          {heroRank && <span className="gc-rank-chip">{heroRank.label}</span>}
        </div>
        <div className="gc-hero-side">
          {!isYear && ts.worst !== null && ts.slope > 0 && <p>Dự kiến từ <b>{ts.worst.toFixed(2)}</b> đến <b>{ts.best.toFixed(2)}</b> khi nhập đủ điểm</p>}
          {isYear && year.gpaTerms !== null && <p>Trung bình 2 học kỳ: <b>{fmt(year.gpaTerms, state)}</b></p>}
          {!isYear && delta !== null && <p className={delta >= 0 ? 'up' : 'down'}><Ico n="trend" size={14} /> {delta >= 0 ? '+' : ''}{delta.toFixed(2)} so với lần lưu trước</p>}
          <div className="gc-opts">
            <div className="gc-seg" role="group" aria-label="Thang điểm">
              {[['10', 'Thang 10'], ['4', 'Thang 4'], ['ab', 'Chữ']].map(([k, l]) => <button key={k} type="button" className={state.scale === k ? 'on' : ''} aria-pressed={state.scale === k} onClick={() => setOpt('scale', k)}>{l}</button>)}
            </div>
            <div className="gc-seg" role="group" aria-label="Làm tròn">
              {[['one', '1 số lẻ'], ['two', '2 số lẻ']].map(([k, l]) => <button key={k} type="button" className={state.round === k ? 'on' : ''} aria-pressed={state.round === k} onClick={() => setOpt('round', k)}>{l}</button>)}
            </div>
            {isYear && (
              <div className="gc-seg" role="group" aria-label="Cách tính cả năm">
                {[['w2', '(HK1 + 2×HK2) / 3'], ['avg', 'Trung bình cộng']].map(([k, l]) => <button key={k} type="button" className={state.yearMode === k ? 'on' : ''} aria-pressed={state.yearMode === k} onClick={() => setOpt('yearMode', k)}>{l}</button>)}
              </div>
            )}
          </div>
          {!isYear && <button type="button" className="btn primary" onClick={save} disabled={ts.gpa === null}><Ico n="save" size={16} /> Lưu điểm học kỳ</button>}
        </div>
      </div>

      {/* ===== Cả năm ===== */}
      {isYear && (
        <div className="gc-card">
          <h2 className="gc-h2"><Ico n="book" size={20} /> Điểm từng môn cả năm</h2>
          {year.rows.length ? (
            <table className="gc-year">
              <thead><tr><th>Môn</th><th>HK1</th><th>HK2</th><th>Cả năm</th></tr></thead>
              <tbody>
                {year.rows.map((r, i) => (
                  <tr key={i}>
                    <th>{r.name}</th><td>{fmt(r.hk1 ?? null, state)}</td><td>{fmt(r.hk2 ?? null, state)}</td>
                    <td><span className="gc-pill" style={{ background: r.score !== null ? rankOf(r.score).color : 'var(--soft)' }}>{fmt(r.score, state)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="gc-empty">Chưa có môn nào. Chuyển sang Học kỳ 1 để thêm môn và nhập điểm.</p>}
        </div>
      )}

      {/* ===== Danh sách môn ===== */}
      {!isYear && (
        <>
          <div className="gc-subs">
            {subs.map((s) => {
              const row = ts.rows.find((r) => r.s.id === s.id);
              return (
                <SubjectCard key={s.id} sub={s} c={row.c} st={state} selected={s.id === selId} chem={chem}
                  onPatch={patchSub} onRemove={() => removeSub(s.id)} onSelect={() => setOpt('sel', s.id)} />
              );
            })}
          </div>

          <div className="gc-addbar">
            <button type="button" className="btn sm" onClick={() => addSub('')}><Ico n="plus" size={14} /> Thêm môn</button>
            {missing.slice(0, 8).map((n) => <button key={n} type="button" className="chip" onClick={() => addSub(n)}>{n}</button>)}
            {term === 'hk2' && !subs.length && state.terms.hk1.length > 0 && <button type="button" className="btn sm" onClick={copyFromHk1}><Ico n="copy" size={14} /> Chép môn từ HK1</button>}
          </div>
          <p className="gc-note">Mẹo: dán một dãy điểm như <kbd>8 9 7.5 10</kbd> vào ô đầu tiên để tự chia thành nhiều ô. Nhấn Enter để sang ô kế. Ô để trống được coi là chưa thi.</p>

          {selRow && (
            <div className="gc-card">
              <h2 className="gc-h2"><Ico n="sliders" size={20} /> Phân tích môn {selRow.s.name || ''}</h2>
              <Analysis sub={selRow.s} c={selRow.c} ts={ts} st={state} patch={patchSub} />
            </div>
          )}

          <Planner ts={ts} st={state} />

          {/* ===== Xu hướng ===== */}
          <div className="gc-card">
            <h2 className="gc-h2"><Ico n="trend" size={20} /> Xu hướng điểm</h2>
            {trend.length ? (
              <>
                <LineChart pts={trend.map((h, i) => ({ x: i, y: h.gpa }))} xMin={0} xMax={Math.max(1, trend.length - 1)}
                  yMin={Math.max(0, Math.floor(Math.min(...trend.map((h) => h.gpa)) - 1))} yMax={Math.min(10, Math.ceil(Math.max(...trend.map((h) => h.gpa)) + 1))}
                  label="Điểm trung bình theo các lần lưu" xTicks={trend.map((h, i) => ({ x: i, l: new Date(h.at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) }))} />
                <ul className="gc-hist">
                  {hist.map((h) => (
                    <li key={h.id}>
                      <div><b>{h.gpa.toFixed(2)}</b><small>{new Date(h.at).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })} · {h.rows.length} môn</small></div>
                      <div className="gc-hist-a">
                        <button type="button" className="btn sm" onClick={() => restore(h)}>Nạp lại</button>
                        <button type="button" className="gc-icon" aria-label="Xóa bản lưu" onClick={() => setHistory(history.filter((x) => x.id !== h.id))}><Ico n="trash" size={15} /></button>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            ) : <p className="gc-empty">Chưa có bản lưu nào. Nhấn “Lưu điểm học kỳ” để bắt đầu theo dõi xu hướng.</p>}
          </div>
        </>
      )}

      <Admission rows={ts.rows} />

      {/* ===== Dữ liệu ===== */}
      <div className="gc-card">
        <h2 className="gc-h2"><Ico n="file" size={20} /> Xuất và sao lưu</h2>
        <label className="gc-check"><input type="checkbox" checked={hideNames} onChange={(e) => setHideNames(e.target.checked)} /> Ẩn tên môn trên ảnh (hiện Môn 1, Môn 2…)</label>
        <div className="gc-actions">
          <button type="button" className="btn sm" onClick={exportImage}><Ico n="image" size={15} /> Ảnh bảng điểm</button>
          <button type="button" className="btn sm" onClick={exportCSV}><Ico n="down" size={15} /> CSV</button>
          <button type="button" className="btn sm" onClick={() => exportJSON(false)}><Ico n="down" size={15} /> JSON điểm</button>
          <button type="button" className="btn sm" onClick={() => exportJSON(true)}><Ico n="down" size={15} /> Sao lưu toàn bộ app</button>
          <button type="button" className="btn sm" onClick={() => fileRef.current?.click()}><Ico n="up" size={15} /> Nhập file</button>
          <input ref={fileRef} type="file" accept=".json" hidden onChange={importJSON} />
        </div>
        <p className="gc-note">“Sao lưu toàn bộ” gồm điểm số, tiến độ Quiz, XP và thành tích. Nhập lại file này sẽ khôi phục tất cả.</p>
      </div>

      {toast && <div className="gc-toast" role="status">{toast}</div>}
    </section>
  );
}