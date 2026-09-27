import { useState, useMemo, useEffect } from 'react';
import { ELEMENTS } from '../data/elements.js';
import { useLocalStorage, studyToday, liveStreak } from '../hooks.js';
import { pickNext, mastery, stats, isDue } from '../lib/srs.js';

const MODES = [
  ['auto', ' Tự động'],
  ['sym', 'Tên → ký hiệu'],
  ['group', 'Đoán nhóm'],
  ['period', 'Đoán chu kỳ'],
];

const rnd = (a) => a[Math.floor(Math.random() * a.length)];

function makeOptions(val, kind) {
  const all = kind === 'sym'
    ? ELEMENTS.map((x) => x.symbol)
    : Array.from({ length: kind === 'group' ? 18 : 7 }, (_, i) => i + 1);
  const opts = [val];
  while (opts.length < 4) {
    const o = rnd(all);
    if (!opts.includes(o)) opts.push(o);
  }
  return opts.sort(() => Math.random() - 0.5);
}

function makeQuestion(mode, records, lastZ) {
  let e;
  if (mode === 'auto') {
    e = pickNext(ELEMENTS, records, lastZ);
  } else {
    const pool = mode === 'group' ? ELEMENTS.filter((x) => x.group) : ELEMENTS;
    e = pool.filter((x) => x.atomicNumber !== lastZ)[Math.floor(Math.random() * (pool.length - 1))] || rnd(pool);
  }

  const kind = mode === 'auto'
    ? (e.group ? rnd(['sym', 'group', 'period']) : 'sym')
    : mode;

  const val = kind === 'sym' ? e.symbol : kind === 'group' ? e.group : e.period;
  return { e, kind, val, opts: makeOptions(val, kind) };
}

export default function Quiz() {
  const [records, setRecords] = useLocalStorage('cs-srs', {});
  const [streak, setStreak] = useLocalStorage('cs-streak', { last: '', n: 0, total: 0 });
  const [mode, setMode] = useState('auto');
  const [q, setQ] = useState(() => makeQuestion('auto', {}, null));
  const [pick, setPick] = useState(null);
  const [sc, setSc] = useState({ ok: 0, all: 0 });
  const [sessionStreak, setSessionStreak] = useState(0);

  const s = useMemo(() => stats(records, ELEMENTS), [records]);

  const go = (m) => {
    setMode(m);
    setPick(null);
    setQ(makeQuestion(m, records, q?.e.atomicNumber));
  };

  const answer = (o) => {
    if (pick !== null) return;
    setPick(o);
    const good = o === q.val;
    const z = q.e.atomicNumber;
    const cur = records[z] || { ef: 2.5, interval: 0, reps: 0, due: 0, lapses: 0 };

    // SM-2: đúng = quality 4, sai = quality 1
    const quality = good ? 4 : 1;
    const next = srsReview(cur, quality);
    setRecords({ ...records, [z]: next });

    setSc({ ok: sc.ok + (good ? 1 : 0), all: sc.all + 1 });
    setSessionStreak(good ? sessionStreak + 1 : 0);
    setStreak(studyToday(streak));
  };

  // Keyboard: 1-4 chọn đáp án, Enter → câu tiếp
  useEffect(() => {
    const onKey = (e) => {
      if (pick === null && ['1', '2', '3', '4'].includes(e.key)) {
        const idx = +e.key - 1;
        if (q?.opts[idx] !== undefined) answer(q.opts[idx]);
      }
      if (pick !== null && e.key === 'Enter') go(mode);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [pick, q, mode]);

  const text = q && (q.kind === 'sym'
    ? `Ký hiệu hóa học của “${q.e.vietnameseName}” (${q.e.name})?`
    : `${q.e.vietnameseName} (${q.e.symbol}) nằm ở ${q.kind === 'group' ? 'nhóm' : 'chu kỳ'} nào?`);

  const rec = q ? records[q.e.atomicNumber] : null;
  const m = rec ? mastery(rec) : 0;

  return (
    <section className="wrap narrow">
      <h1>Ôn tập thông minh</h1>

      <div className="tabs">
        {MODES.map(([k, l]) => (
          <button
            key={k}
            className={'chip' + (mode === k ? ' on' : '')}
            onClick={() => go(k)}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Stats bar */}
      <div className="srs-stats">
        <div><b>{s.mastered}</b><span>Thành thạo</span></div>
        <div><b>{s.learning}</b><span>Đang học</span></div>
        <div><b>{s.fresh}</b><span>Chưa học</span></div>
        <div><b>{s.due}</b><span>Đến hạn</span></div>
      </div>

      <p className="hint center">
        🔥 Chuỗi {liveStreak(streak)} ngày ·
        Đúng {sc.ok}/{sc.all} ·
        Streak phiên: {sessionStreak}
      </p>

      {q && (
        <div className="card">
          <div className="srs-mastery">
            <small>Độ nhớ: {m}%</small>
            <div className="bar"><i style={{ width: m + '%' }} /></div>
          </div>

          <h3>{text}</h3>
          <div className="opts">
            {q.opts.map((o, i) => (
              <button
                key={o}
                className={'btn opt' + (pick !== null ? (o === q.val ? ' good' : o === pick ? ' bad' : '') : '')}
                onClick={() => answer(o)}
              >
                <small style={{ display: 'block', opacity: .5, fontSize: '.6em' }}>{i + 1}</small>
                {o}
              </button>
            ))}
          </div>

          {pick !== null && (
            <div className="row center" style={{ marginTop: '1rem' }}>
              <span className="done">
                {pick === q.val ? '✓ Chính xác!' : `Đáp án: ${q.val}`}
              </span>
              <button className="btn primary" onClick={() => go(mode)}>
                Câu tiếp (Enter)
              </button>
            </div>
          )}

          <p className="hint center" style={{ marginTop: '.6rem' }}>
            💡 Nhấn 1-4 để chọn nhanh, Enter để qua câu
          </p>
        </div>
      )}
    </section>
  );
}

// SM-2 inline để không cần import lại
function srsReview(rec, q) {
  const DAY = 86400000;
  const r = { ...rec };
  if (q < 3) {
    r.lapses = (r.lapses || 0) + 1;
    r.reps = 0;
    r.interval = 1;
    r.ef = Math.max(1.3, (r.ef || 2.5) - 0.2);
    r.due = Date.now() + DAY;
  } else {
    r.reps = (r.reps || 0) + 1;
    if (r.reps === 1) r.interval = 1;
    else if (r.reps === 2) r.interval = 6;
    else r.interval = Math.round((r.interval || 1) * (r.ef || 2.5));
    r.ef = Math.max(1.3, (r.ef || 2.5) + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
    r.due = Date.now() + r.interval * DAY;
  }
  return r;
}