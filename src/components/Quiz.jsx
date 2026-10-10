import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { ELEMENTS, CATS, norm } from '../data/elements.js';
import { useLocalStorage, studyToday, liveStreak, dayKey } from '../hooks.js';
import { pickNext, mastery, stats, srsReview, freshRecord, isDue } from '../lib/srs.js';
import { ACHIEVEMENTS, getLevel } from '../data/achievements.js';
import { sound } from '../lib/gameSound.js';
import { recordActivity } from '../lib/progress.js';
import { Ico, AchIcon } from './QuizIcons.jsx';
import AIQuizGenerator from './AIQuizGenerator.jsx';
import './ai-quiz-generator.css';

/* ============================================================
   CẤU HÌNH
   ============================================================ */
const TOPICS = [
  ['auto', 'Tự động'], ['sym', 'Ký hiệu'], ['name', 'Tên'], ['z', 'Số hiệu'],
  ['group', 'Nhóm'], ['period', 'Chu kỳ'], ['block', 'Khối'], ['mass', 'Khối lượng'],
  ['config', 'Cấu hình e'], ['cat', 'Phân loại'], ['state', 'Trạng thái'],
  ['en', 'Độ âm điện'], ['valence', 'e hóa trị'], ['cmp', 'So sánh'],
];
const SCOPES = [
  ['all', 'Cả 118'], ['z20', '20 đầu'], ['a', 'Nhóm A'],
  ['p13', 'Chu kỳ 1–3'], ['due', 'Đến hạn'], ['weak', 'Hay sai'],
];
const KIND_LABEL = Object.fromEntries(TOPICS);
const TYPABLE = ['sym', 'name', 'z', 'group', 'period', 'block', 'valence'];
const TA_SECONDS = 90;
const SET_LEN = 10;
const LIVES = { hint: 2, half: 2, skip: 2 };

/* ============================================================
   HELPERS
   ============================================================ */
const catLabel = (k) => (CATS.find((c) => c[0] === k) || [0, k])[1];
const blockOf = (e) =>
  e.category === 'lanthanide' || e.category === 'actinide' ? 'f'
    : e.atomicNumber === 2 || e.group === 1 || e.group === 2 ? 's'
    : e.group >= 13 ? 'p' : 'd';

const seedRng = (str) => {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  let a = h >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
const pick = (arr, r) => arr[Math.floor(r() * arr.length)];
const shuffle = (arr, r) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
const massNum = (e) => parseFloat(String(e.atomicMass).replace(/[[\]]/g, ''));

const ELIGIBLE = {
  group: (e) => e.group != null,
  mass: (e) => !Number.isNaN(massNum(e)),
  en: (e) => e.electronegativity != null,
  valence: (e) => e.valenceElectrons != null,
};

const VALUE = {
  sym: (e) => e.symbol,
  name: (e) => e.vietnameseName,
  z: (e) => e.atomicNumber,
  group: (e) => e.group,
  period: (e) => e.period,
  block: (e) => blockOf(e),
  mass: (e) => e.atomicMass,
  config: (e) => e.shortConfiguration,
  cat: (e) => catLabel(e.category),
  state: (e) => e.stateAtRoomTemp,
  en: (e) => e.electronegativity.toFixed(2),
  valence: (e) => e.valenceElectrons,
};

function distractors(kind, e) {
  const others = ELEMENTS.filter((x) => x.atomicNumber !== e.atomicNumber && (ELIGIBLE[kind]?.(x) ?? true));
  switch (kind) {
    case 'group': return Array.from({ length: 18 }, (_, i) => i + 1);
    case 'period': return [1, 2, 3, 4, 5, 6, 7];
    case 'block': return ['s', 'p', 'd', 'f'];
    case 'cat': return CATS.map((c) => c[1]);
    case 'state': return ['Khí', 'Lỏng', 'Rắn'];
    case 'valence': return [1, 2, 3, 4, 5, 6, 7, 8];
    case 'z': return Array.from({ length: 17 }, (_, i) => e.atomicNumber - 8 + i).filter((n) => n >= 1 && n <= 118);
    case 'mass': { const b = massNum(e); return others.filter((x) => Math.abs(massNum(x) - b) / b < 0.4).map((x) => x.atomicMass); }
    case 'config': return others.filter((x) => Math.abs(x.atomicNumber - e.atomicNumber) <= 6).map((x) => x.shortConfiguration);
    case 'en': return others.map((x) => x.electronegativity.toFixed(2));
    case 'name': return others.map((x) => x.vietnameseName);
    default: return others.map((x) => x.symbol);
  }
}

function buildOptions(kind, e, correct, r) {
  const pool = shuffle(distractors(kind, e), r);
  const opts = [correct];
  for (const o of pool) { if (opts.length >= 4) break; if (!opts.includes(o)) opts.push(o); }
  return shuffle(opts, r);
}

function scopeList(scope, records, wrong) {
  switch (scope) {
    case 'z20': return ELEMENTS.filter((e) => e.atomicNumber <= 20);
    case 'a': return ELEMENTS.filter((e) => e.group != null && (e.group <= 2 || e.group >= 13));
    case 'p13': return ELEMENTS.filter((e) => e.period <= 3);
    case 'due': return ELEMENTS.filter((e) => records[e.atomicNumber] && isDue(records[e.atomicNumber]));
    case 'weak': return ELEMENTS.filter((e) => wrong.includes(e.atomicNumber));
    default: return ELEMENTS;
  }
}

function makeQuestion({ topic, list, records, lastZ, rng }) {
  const r = rng || Math.random;
  const kind = topic === 'auto'
    ? pick(['sym', 'name', 'group', 'period', 'block', 'cat', 'state', 'config', 'z', 'valence', 'en', 'cmp', 'sym', 'name'], r)
    : topic;

  if (kind === 'cmp') {
    const prop = r() < 0.5 ? 'electronegativity' : 'atomicRadius';
    const seen = new Set();
    const shown = shuffle(ELEMENTS.filter((x) => x[prop] != null), r).filter((x) => !seen.has(x[prop]) && seen.add(x[prop])).slice(0, 4);
    const dir = r() < 0.5 ? 'max' : 'min';
    const best = shown.reduce((a, b) => ((dir === 'max' ? b[prop] > a[prop] : b[prop] < a[prop]) ? b : a));
    return { e: best, kind, val: best.symbol, opts: shown.map((x) => x.symbol), prop, dir, shown };
  }

  const ok = ELIGIBLE[kind] || (() => true);
  let cand = list.filter((x) => ok(x) && x.atomicNumber !== lastZ);
  if (!cand.length) cand = ELEMENTS.filter(ok);
  const e = topic === 'auto' && !rng ? (pickNext(cand, records, lastZ) || pick(cand, r)) : pick(cand, r);
  const val = VALUE[kind](e);
  return { e, kind, val, opts: buildOptions(kind, e, val, r) };
}

function questionText(q) {
  const { e } = q;
  const n = `${e.vietnameseName} (${e.symbol})`;
  switch (q.kind) {
    case 'sym': return `Ký hiệu hóa học của ${e.vietnameseName} (${e.name})?`;
    case 'name': return `Nguyên tố có ký hiệu ${e.symbol} tên là gì?`;
    case 'z': return `Số hiệu nguyên tử của ${n}?`;
    case 'group': return `${n} ở nhóm nào?`;
    case 'period': return `${n} ở chu kỳ nào?`;
    case 'block': return `${n} thuộc khối nào (s, p, d, f)?`;
    case 'mass': return `Nguyên tử khối của ${n}?`;
    case 'config': return `Cấu hình electron rút gọn của ${n}?`;
    case 'cat': return `${n} thuộc loại nào?`;
    case 'state': return `${n} ở trạng thái nào ở nhiệt độ phòng?`;
    case 'en': return `Độ âm điện Pauling của ${n}?`;
    case 'valence': return `${n} có bao nhiêu electron hóa trị?`;
    case 'cmp': return `Nguyên tố nào có ${q.prop === 'electronegativity' ? 'độ âm điện' : 'bán kính nguyên tử'} ${q.dir === 'max' ? 'lớn nhất' : 'nhỏ nhất'}?`;
    default: return '';
  }
}

function hintText(q) {
  const { e } = q;
  switch (q.kind) {
    case 'sym': return `Số hiệu ${e.atomicNumber}, bắt đầu bằng chữ "${e.symbol[0]}"`;
    case 'name': return `Số hiệu ${e.atomicNumber}, tên bắt đầu bằng "${e.vietnameseName.slice(0, 2)}…"`;
    case 'z': return `Nằm ở chu kỳ ${e.period}`;
    case 'group': case 'period': case 'block': case 'valence': case 'config': return `Cấu hình: ${e.shortConfiguration}`;
    case 'cmp': return q.prop === 'electronegativity' ? 'Độ âm điện tăng dần từ trái sang phải, giảm dần từ trên xuống dưới' : 'Bán kính tăng dần từ phải sang trái, từ trên xuống dưới';
    default: return `Số hiệu ${e.atomicNumber}, ${catLabel(e.category).toLowerCase()}`;
  }
}

/* ============================================================
   COMPONENT CON
   ============================================================ */
function Ring({ value, max, label }) {
  const R = 26, C = 2 * Math.PI * R;
  return (
    <div className="qz-ring" role="timer" aria-label={`Còn ${value} giây`}>
      <svg viewBox="0 0 64 64" width="64" height="64">
        <circle cx="32" cy="32" r={R} className="qz-ring-bg" />
        <circle cx="32" cy="32" r={R} className="qz-ring-fg" strokeDasharray={C} strokeDashoffset={C * (1 - value / max)} />
      </svg>
      <b>{label ?? value}</b>
    </div>
  );
}

function ElementCard({ e }) {
  return (
    <div className="qz-elcard">
      <div className="qz-elcard-sym" style={{ background: `var(--${e.category})` }}>
        <small>{e.atomicNumber}</small>
        <b>{e.symbol}</b>
      </div>
      <dl>
        <div><dt>Tên</dt><dd>{e.vietnameseName} · {e.name}</dd></div>
        <div><dt>Nguyên tử khối</dt><dd>{e.atomicMass}</dd></div>
        <div><dt>Vị trí</dt><dd>{e.group ? `Nhóm ${e.group}` : 'Họ f'} · Chu kỳ {e.period} · Khối {blockOf(e)}</dd></div>
        <div><dt>Cấu hình</dt><dd className="qz-mono">{e.shortConfiguration}</dd></div>
        <div><dt>Loại</dt><dd>{catLabel(e.category)} · {e.stateAtRoomTemp}</dd></div>
      </dl>
    </div>
  );
}

function FlashDeck({ list, records, onRate, onExit }) {
  const [e, setE] = useState(() => pickNext(list, records, null) || list[0]);
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(0);

  const rate = useCallback((quality) => {
    if (!open) return;
    onRate(e, quality);
    setDone((d) => d + 1);
    setOpen(false);
    setE((prev) => pickNext(list, records, prev.atomicNumber) || list[Math.floor(Math.random() * list.length)]);
  }, [open, e, list, records, onRate]);

  useEffect(() => {
    const on = (ev) => {
      if (ev.key === ' ') { ev.preventDefault(); setOpen((o) => !o); }
      if (open && ['1', '2', '3', '4'].includes(ev.key)) rate([1, 3, 4, 5][+ev.key - 1]);
    };
    addEventListener('keydown', on);
    return () => removeEventListener('keydown', on);
  }, [open, rate]);

  const RATES = [['Quên', 1], ['Khó', 3], ['Được', 4], ['Dễ', 5]];
  return (
    <div className="qz-play">
      <div className="qz-play-top">
        <span className="qz-pill"><Ico n="cards" size={14} /> Thẻ ghi nhớ · {done} thẻ</span>
        <button className="btn sm" type="button" onClick={onExit}><Ico n="close" size={14} /> Thoát</button>
      </div>
      <button type="button" className={'qz-flip' + (open ? ' open' : '')} onClick={() => setOpen((o) => !o)} aria-label="Lật thẻ">
        <span className="qz-flip-face">
          <small>Nhớ lại: tên, vị trí, cấu hình</small>
          <b className="qz-flip-sym">{e.symbol}</b>
          <em><Ico n="flip" size={14} /> Nhấn Space để lật</em>
        </span>
        <span className="qz-flip-face back"><ElementCard e={e} /></span>
      </button>
      <div className={'qz-rates' + (open ? ' on' : '')}>
        {RATES.map(([l, v], i) => (
          <button key={l} type="button" className={'btn qz-rate r' + i} disabled={!open} onClick={() => rate(v)}>
            <kbd>{i + 1}</kbd> {l}
          </button>
        ))}
      </div>
    </div>
  );
}

function Heatmap({ records }) {
  return (
    <div className="qz-heat" role="img" aria-label="Bản đồ độ nhớ trên bảng tuần hoàn">
      {ELEMENTS.map((e) => {
        const rec = records[e.atomicNumber];
        const m = rec ? mastery(rec) : 0;
        return (
          <i
            key={e.atomicNumber}
            title={`${e.symbol} — ${m}%`}
            style={{ gridRow: e.row, gridColumn: e.col, '--m': m + '%', opacity: rec ? 1 : 0.45 }}
          >
            <span>{e.symbol}</span>
          </i>
        );
      })}
    </div>
  );
}

function Modal({ title, icon, onClose, children, wide }) {
  return (
    <div className="backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={'qz-modal' + (wide ? ' wide' : '')} role="dialog" aria-modal="true" aria-label={title}>
        <div className="qz-modal-head">
          <h2><Ico n={icon} size={20} /> {title}</h2>
          <button className="qz-x" type="button" onClick={onClose} aria-label="Đóng"><Ico n="close" size={18} /></button>
        </div>
        <div className="qz-modal-body">{children}</div>
      </div>
    </div>
  );
}

/* ============================================================
   MAIN
   ============================================================ */
export default function Quiz() {
  const [records, setRecords] = useLocalStorage('cs-srs-v2', {});
  const [streak, setStreak] = useLocalStorage('cs-streak-v2', { last: '', n: 0, total: 0 });
  const [xp, setXp] = useLocalStorage('cs-xp', 0);
  const [achievements, setAchievements] = useLocalStorage('cs-achievements', []);
  const [gs, setGs] = useLocalStorage('cs-quiz-stats', {
    totalCorrect: 0, totalWrong: 0, maxStreak: 0, dailyCount: 0, bestTimeAttack: null, lastDailyDate: null, byKind: {},
  });
  const [wrongBank, setWrongBank] = useLocalStorage('cs-wrong-bank', []);
  const [prefs, setPrefs] = useLocalStorage('cs-quiz-prefs', { topic: 'auto', scope: 'all', fmt: 'choice', sound: true });

  const [sess, setSess] = useState(null);
  const [q, setQ] = useState(null);
  const [pick_, setPick] = useState(null);
  const [last, setLast] = useState(null);
  const [typed, setTyped] = useState('');
  const [hint, setHint] = useState(false);
  const [hidden, setHidden] = useState([]);
  const [timeLeft, setTimeLeft] = useState(TA_SECONDS);
  const [result, setResult] = useState(null);
  const [toast, setToast] = useState(null);
  const [flash, setFlash] = useState(null);
  const [modal, setModal] = useState(null);
  const [deck, setDeck] = useState(false);

  const sessRef = useRef(null);
  const recRef = useRef(records);
  const gsRef = useRef(gs);
  const rngRef = useRef(null);
  const t0 = useRef(Date.now());
  const inputRef = useRef(null);
  sessRef.current = sess;
  recRef.current = records;
  gsRef.current = gs;

  const s = useMemo(() => stats(records, ELEMENTS), [records]);
  const level = useMemo(() => getLevel(xp), [xp]);
  const dailyDone = gs.lastDailyDate === dayKey();
  const acc = gs.totalCorrect + gs.totalWrong ? Math.round((gs.totalCorrect / (gs.totalCorrect + gs.totalWrong)) * 100) : 0;
  const sfx = (k) => prefs.sound && sound[k]?.();

  const scopeKey = sess?.scope || prefs.scope;
  const list = useMemo(() => {
    const l = scopeList(scopeKey, records, wrongBank);
    return l.length ? l : ELEMENTS;
  }, [scopeKey, records, wrongBank]);
  const scopeEmpty = scopeList(prefs.scope, records, wrongBank).length === 0;

  /* ---------- tạo câu hỏi ---------- */
  const nextQ = useCallback((lastZ) => {
    const cur = sessRef.current;
    const scope = cur?.scope || prefs.scope;
    const l = scopeList(scope, recRef.current, wrongBank);
    const nq = makeQuestion({
      topic: cur?.type === 'daily' ? 'auto' : prefs.topic,
      list: l.length ? l : ELEMENTS,
      records: recRef.current,
      lastZ,
      rng: cur?.type === 'daily' ? rngRef.current : null,
    });
    nq.fmt = prefs.fmt === 'type' && TYPABLE.includes(nq.kind) && cur?.type !== 'daily' ? 'type' : 'choice';
    setQ(nq);
    setPick(null); setLast(null); setTyped(''); setHint(false); setHidden([]);
    t0.current = Date.now();
  }, [prefs.topic, prefs.scope, prefs.fmt, wrongBank]);

  /* ---------- bắt đầu / kết thúc ---------- */
  const start = (type) => {
    if (type === 'flash') { setDeck(true); return; }
    const base = { type, startedAt: Date.now(), ok: 0, all: 0, streak: 0, best: 0, xp: 0, left: { ...LIVES }, answers: [] };
    if (type === 'set') base.len = SET_LEN;
    if (type === 'daily') { base.len = SET_LEN; rngRef.current = seedRng('cs-daily-' + dayKey()); }
    if (type === 'weak') { base.scope = 'weak'; base.len = SET_LEN; }
    sessRef.current = base;
    setSess(base); setResult(null); setTimeLeft(TA_SECONDS);
    nextQ(null);
  };

  const finish = useCallback(() => {
    const cur = sessRef.current;
    if (!cur) return;
    const dur = Math.round((Date.now() - cur.startedAt) / 1000);
    let bonus = 0, newBest = false;
    if (cur.type === 'daily' && gsRef.current.lastDailyDate !== dayKey()) {
      bonus = 50;
      setGs((g) => ({ ...g, dailyCount: (g.dailyCount || 0) + 1, lastDailyDate: dayKey() }));
    }
    if (cur.type === 'time') {
      const b = gsRef.current.bestTimeAttack;
      if (!b || cur.ok > b.score) { newBest = true; setGs((g) => ({ ...g, bestTimeAttack: { score: cur.ok, total: cur.all, date: Date.now() } })); }
    }
    if (bonus) setXp((x) => x + bonus);
    setResult({ ...cur, dur, bonus, newBest });
    setSess(null); setQ(null); sessRef.current = null;
    sound.win?.();
  }, [setGs, setXp]);

  /* ---------- đồng hồ Time Attack ---------- */
  useEffect(() => {
    if (sess?.type !== 'time') return;
    if (timeLeft <= 0) { finish(); return; }
    const t = setTimeout(() => setTimeLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [sess?.type, timeLeft, finish]);

  /* ---------- kiểm tra đáp án ---------- */
  const isRight = (o) => {
    if (!q) return false;
    if (q.fmt === 'type') {
      const a = norm(String(o));
      return a === norm(String(q.val)) || (q.kind === 'name' && a === norm(q.e.name));
    }
    return o === q.val;
  };

  const submit = (o) => {
    if (pick_ !== null || !q || !sess) return;
    const good = isRight(o);
    const z = q.e.atomicNumber;
    const secs = (Date.now() - t0.current) / 1000;
    const fast = good && secs < 5 && !hint;
    const gain = good ? Math.round((10 + Math.min(20, sess.streak * 2) + (fast ? 5 : 0)) * (hint ? 0.5 : 1)) : 2;
    const ns = good ? sess.streak + 1 : 0;

    setPick(o);
    setLast({ good, gain, fast, secs });
    setRecords((prev) => {
      const cur = prev[z] || freshRecord();
      return { ...prev, [z]: { ...srsReview(cur, good ? (hint ? 3 : 4) : 1), streak: good ? (cur.streak || 0) + 1 : 0 } };
    });
    setXp((x) => x + gain);
    setStreak(studyToday(streak));
    recordActivity({ type: 'quiz', title: 'Quiz nguyên tố', hash: 'quiz' });
    setGs((g) => {
      const k = g.byKind?.[q.kind] || { ok: 0, all: 0 };
      return {
        ...g,
        totalCorrect: g.totalCorrect + (good ? 1 : 0),
        totalWrong: g.totalWrong + (good ? 0 : 1),
        maxStreak: Math.max(g.maxStreak || 0, ns),
        byKind: { ...g.byKind, [q.kind]: { ok: k.ok + (good ? 1 : 0), all: k.all + 1 } },
      };
    });
    setWrongBank((w) => (!good && !w.includes(z) ? [...w, z] : good && w.includes(z) ? w.filter((x) => x !== z) : w));
    setSess((c) => ({
      ...c, ok: c.ok + (good ? 1 : 0), all: c.all + 1, streak: ns, best: Math.max(c.best, ns), xp: c.xp + gain,
      answers: [...c.answers, { q, pick: o, good }],
    }));
    setFlash(good ? 'ok' : 'bad');
    setTimeout(() => setFlash(null), 380);
    sfx(good ? 'correct' : 'wrong');
    if (sess.type === 'time') setTimeout(() => nextQ(z), 650);
  };

  const advance = () => {
    if (!sess) return;
    if (sess.len && sess.all >= sess.len) finish();
    else nextQ(q?.e.atomicNumber);
  };

  const useLife = (k) => {
    if (!q || pick_ !== null || !sess || sess.left[k] <= 0) return;
    if (k === 'hint') setHint(true);
    if (k === 'half') {
      const wrong = q.opts.filter((o) => o !== q.val);
      setHidden(shuffle(wrong, Math.random).slice(0, 2));
    }
    setSess((c) => ({ ...c, left: { ...c.left, [k]: c.left[k] - 1 } }));
    if (k === 'skip') nextQ(q.e.atomicNumber);
  };

  const rateCard = useCallback((e, quality) => {
    setRecords((prev) => ({ ...prev, [e.atomicNumber]: srsReview(prev[e.atomicNumber] || freshRecord(), quality) }));
    setXp((x) => x + (quality >= 3 ? 3 : 1));
    setStreak((st) => studyToday(st));
    recordActivity({ type: 'quiz', title: 'Ôn thẻ nguyên tố', hash: 'quiz' });
  }, [setRecords, setXp, setStreak]);

  /* ---------- thành tích ---------- */
  useEffect(() => {
    const cs = { ...gs, mastered: s.mastered, streak: liveStreak(streak), maxStreak: gs.maxStreak };
    const fresh = ACHIEVEMENTS.filter((a) => !achievements.includes(a.id) && a.check(cs));
    if (!fresh.length) return;
    setAchievements([...achievements, ...fresh.map((a) => a.id)]);
    setToast(fresh[0]);
    sfx('win');
    const t = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(t);
  }, [gs, s.mastered, streak, achievements]); // eslint-disable-line

  /* ---------- phím tắt ---------- */
  useEffect(() => {
    if (!sess || !q) return;
    const on = (e) => {
      const inField = e.target.tagName === 'INPUT';
      if (e.key === 'Escape') { setModal(null); return; }
      if (pick_ === null && !inField && q.fmt !== 'type') {
        if (['1', '2', '3', '4'].includes(e.key)) { const o = q.opts[+e.key - 1]; if (o !== undefined && !hidden.includes(o)) submit(o); }
        if (e.key.toLowerCase() === 'h') useLife('hint');
        if (e.key.toLowerCase() === 'f') useLife('half');
        if (e.key.toLowerCase() === 's') useLife('skip');
      }
      if (pick_ !== null && (e.key === 'Enter' || e.key === ' ') && sess.type !== 'time') { e.preventDefault(); advance(); }
    };
    addEventListener('keydown', on);
    return () => removeEventListener('keydown', on);
  });

  useEffect(() => { if (q?.fmt === 'type' && pick_ === null) inputRef.current?.focus(); }, [q, pick_]);

  /* ---------- xuất / nhập ---------- */
  const exportData = () => {
    const blob = new Blob([JSON.stringify({ version: 3, at: new Date().toISOString(), records, streak, xp, achievements, globalStats: gs, wrongBank, prefs }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `chem-study-quiz-${dayKey()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const importData = (ev) => {
    const f = ev.target.files[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = (e2) => {
      try {
        const d = JSON.parse(e2.target.result);
        if (!d.version) throw new Error();
        if (!confirm('Ghi đè tiến độ hiện tại bằng file này?')) return;
        setRecords(d.records || {}); setStreak(d.streak || { last: '', n: 0, total: 0 }); setXp(d.xp || 0);
        setAchievements(d.achievements || []); setGs({ ...gs, ...(d.globalStats || {}) }); setWrongBank(d.wrongBank || []);
        if (d.prefs) setPrefs(d.prefs);
      } catch { alert('File không hợp lệ'); }
    };
    rd.readAsText(f);
    ev.target.value = '';
  };

  const rec = q ? records[q.e.atomicNumber] : null;
  const m = rec ? mastery(rec) : 0;
  const playing = !!sess && !!q;
  const isType = q?.fmt === 'type';

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <section className="wrap narrow qz">
      {flash && <div className={'qz-flash ' + flash} aria-hidden="true" />}

      {/* ===== Đầu trang ===== */}
      <header className="qz-head">
        <div className="qz-head-l">
          <h1>Ôn tập <em>thông minh</em></h1>
          <p className="qz-level"><Ico n="rank" size={16} /> Cấp {level.current.lvl} · {level.current.title}</p>
        </div>
        <div className="qz-xp">
          <div className="qz-xp-bar" role="progressbar" aria-valuenow={Math.round(level.progress)} aria-valuemin="0" aria-valuemax="100"><i style={{ width: level.progress + '%' }} /></div>
          <small>{xp} / {level.next?.xp || xp} XP</small>
        </div>
      </header>

      {/* ===== Thanh công cụ ===== */}
      <div className="qz-tools">
        <button className="btn sm" type="button" onClick={() => setModal('stats')}><Ico n="chart" size={15} /> Thống kê</button>
        <button className="btn sm" type="button" onClick={() => setModal('ach')}><Ico n="trophy" size={15} /> Thành tích {achievements.length}/{ACHIEVEMENTS.length}</button>
        {wrongBank.length > 0 && <button className="btn sm" type="button" onClick={() => setModal('review')}><Ico n="review" size={15} /> Câu sai {wrongBank.length}</button>}
        <button
          className="btn sm qz-ai-btn"
          type="button"
          onClick={() => setModal('aigen')}
          title="AI đọc tài liệu và tạo đề riêng cho bạn"
        >
          <Ico n="sparkle" size={15} /> AI Tạo Đề <span className="vip-badge">VIP</span>
        </button>
        <span className="qz-grow" />
        <button className="btn sm icon" type="button" onClick={() => setPrefs({ ...prefs, sound: !prefs.sound })} aria-label={prefs.sound ? 'Tắt âm thanh' : 'Bật âm thanh'} aria-pressed={prefs.sound}><Ico n={prefs.sound ? 'sound' : 'mute'} size={16} /></button>
        <button className="btn sm icon" type="button" onClick={exportData} aria-label="Xuất tiến độ"><Ico n="down" size={16} /></button>
        <label className="btn sm icon" aria-label="Nhập tiến độ"><Ico n="up" size={16} /><input type="file" accept=".json" hidden onChange={importData} /></label>
      </div>

      {/* ===== Dải số liệu SRS ===== */}
      <div className="qz-strip">
        <div><b>{s.mastered}</b><span>Thành thạo</span></div>
        <div><b>{s.learning}</b><span>Đang học</span></div>
        <div><b>{s.fresh}</b><span>Chưa học</span></div>
        <div className={s.due ? 'hot' : ''}><b>{s.due}</b><span>Đến hạn</span></div>
        <div><b>{liveStreak(streak)}</b><span>Ngày liên tiếp</span></div>
      </div>

      {/* ===== MÀN HÌNH CHỜ: chọn chế độ ===== */}
      {!playing && !deck && (
        <>
          <div className="qz-modes">
            <button type="button" className="qz-mode daily" onClick={() => start('daily')}>
              <Ico n="calendar" size={22} />
              <b>Thử thách hôm nay</b>
              <span>{dailyDone ? 'Đã nhận thưởng — chơi lại không có XP thưởng' : '10 câu giống nhau cho mọi người · +50 XP'}</span>
              {dailyDone && <i className="qz-tick"><Ico n="check" size={14} /></i>}
            </button>
            <button type="button" className="qz-mode" onClick={() => start('free')}><Ico n="infinity" size={22} /><b>Luyện tự do</b><span>Không giới hạn số câu</span></button>
            <button type="button" className="qz-mode" onClick={() => start('set')}><Ico n="target" size={22} /><b>Bộ {SET_LEN} câu</b><span>Có tổng kết cuối bộ</span></button>
            <button type="button" className="qz-mode" onClick={() => start('time')}><Ico n="bolt" size={22} /><b>Time Attack</b><span>{TA_SECONDS} giây · tự chuyển câu{gs.bestTimeAttack ? ` · kỷ lục ${gs.bestTimeAttack.score}` : ''}</span></button>
            <button type="button" className="qz-mode" onClick={() => start('flash')}><Ico n="cards" size={22} /><b>Thẻ ghi nhớ</b><span>Lật thẻ, tự chấm mức nhớ</span></button>
            <button type="button" className="qz-mode" disabled={!wrongBank.length} onClick={() => start('weak')}><Ico n="review" size={22} /><b>Luyện câu sai</b><span>{wrongBank.length ? `${wrongBank.length} nguyên tố hay sai` : 'Chưa có câu sai nào'}</span></button>
          </div>

          <div className="qz-settings">
            <fieldset>
              <legend>Chủ đề</legend>
              <div className="qz-chips">
                {TOPICS.map(([k, l]) => (
                  <button key={k} type="button" className={'chip' + (prefs.topic === k ? ' on' : '')} aria-pressed={prefs.topic === k} onClick={() => setPrefs({ ...prefs, topic: k })}>{l}</button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend>Phạm vi nguyên tố</legend>
              <div className="qz-chips">
                {SCOPES.map(([k, l]) => (
                  <button key={k} type="button" className={'chip' + (prefs.scope === k ? ' on' : '')} aria-pressed={prefs.scope === k} onClick={() => setPrefs({ ...prefs, scope: k })}>{l}</button>
                ))}
              </div>
              {scopeEmpty && <p className="qz-note">Phạm vi này chưa có nguyên tố nào, quiz sẽ dùng cả 118 nguyên tố.</p>}
            </fieldset>
            <fieldset>
              <legend>Cách trả lời</legend>
              <div className="qz-seg" role="group">
                <button type="button" className={prefs.fmt === 'choice' ? 'on' : ''} aria-pressed={prefs.fmt === 'choice'} onClick={() => setPrefs({ ...prefs, fmt: 'choice' })}><Ico n="grid" size={15} /> Trắc nghiệm</button>
                <button type="button" className={prefs.fmt === 'type' ? 'on' : ''} aria-pressed={prefs.fmt === 'type'} onClick={() => setPrefs({ ...prefs, fmt: 'type' })}><Ico n="keyboard" size={15} /> Tự gõ</button>
              </div>
              {prefs.fmt === 'type' && <p className="qz-note">Chỉ áp dụng cho chủ đề có đáp án ngắn (ký hiệu, tên, số hiệu, nhóm, chu kỳ, khối, e hóa trị). Các chủ đề khác vẫn là trắc nghiệm.</p>}
            </fieldset>
          </div>

          <div className="qz-heat-wrap">
            <h2 className="qz-h2">Bản đồ độ nhớ</h2>
            <Heatmap records={records} />
            <p className="qz-note">Ô càng đậm là càng nhớ. Ô mờ là chưa học.</p>
          </div>
        </>
      )}

      {deck && (
        <FlashDeck list={list} records={records} onRate={rateCard} onExit={() => setDeck(false)} />
      )}

      {/* ===== ĐANG CHƠI ===== */}
      {playing && (
        <div className="qz-play">
          <div className="qz-play-top">
            <span className="qz-pill">
              {sess.type === 'time' ? <><Ico n="bolt" size={14} /> Time Attack</> : sess.type === 'daily' ? <><Ico n="calendar" size={14} /> Thử thách hôm nay</> : sess.type === 'weak' ? <><Ico n="review" size={14} /> Luyện câu sai</> : sess.type === 'set' ? <><Ico n="target" size={14} /> Bộ {SET_LEN} câu</> : <><Ico n="infinity" size={14} /> Luyện tự do</>}
            </span>
            <span className="qz-pill soft"><Ico n="check" size={14} /> {sess.ok}/{sess.all}</span>
            <span className={'qz-pill soft' + (sess.streak >= 3 ? ' fire' : '')}><Ico n="flame" size={14} /> {sess.streak}</span>
            <span className="qz-grow" />
            {sess.type === 'time' && <Ring value={Math.max(0, timeLeft)} max={TA_SECONDS} />}
            <button className="btn sm" type="button" onClick={() => (sess.all > 0 ? finish() : (setSess(null), setQ(null)))}><Ico n="close" size={14} /> {sess.all > 0 ? 'Kết thúc' : 'Thoát'}</button>
          </div>

          {sess.len && (
            <div className="qz-seglist" aria-label={`Câu ${Math.min(sess.all + 1, sess.len)} trên ${sess.len}`}>
              {Array.from({ length: sess.len }, (_, i) => {
                const a = sess.answers[i];
                return <i key={i} className={a ? (a.good ? 'ok' : 'bad') : i === sess.all ? 'cur' : ''} />;
              })}
            </div>
          )}

          <div className="qz-card">
            <div className="qz-card-meta">
              <span className="qz-kind">{KIND_LABEL[q.kind]}</span>
              <span className="qz-mastery" title={`Độ nhớ ${m}%`}><i style={{ width: m + '%' }} /></span>
              <small>{m}%</small>
            </div>

            <h2 className="qz-q">{questionText(q)}</h2>
            {hint && <p className="qz-hint"><Ico n="bulb" size={15} /> {hintText(q)}</p>}

            {isType ? (
              <form className="qz-type" onSubmit={(e) => { e.preventDefault(); if (typed.trim()) submit(typed.trim()); }}>
                <input ref={inputRef} value={typed} onChange={(e) => setTyped(e.target.value)} disabled={pick_ !== null} placeholder="Gõ đáp án rồi nhấn Enter" autoComplete="off" spellCheck="false" aria-label="Đáp án" />
                {pick_ === null && <button className="btn primary" type="submit" disabled={!typed.trim()}>Trả lời</button>}
              </form>
            ) : (
              <div className={'qz-opts' + (q.kind === 'config' || q.kind === 'name' || q.kind === 'cat' ? ' long' : '')}>
                {q.opts.map((o, i) => {
                  const right = o === q.val;
                  const gone = hidden.includes(o);
                  let cls = 'qz-opt';
                  if (pick_ !== null) cls += right ? ' good' : o === pick_ ? ' bad' : ' dim';
                  return (
                    <button key={String(o)} type="button" className={cls + (gone ? ' gone' : '')} disabled={pick_ !== null || gone} onClick={() => submit(o)}>
                      <kbd>{i + 1}</kbd>
                      <span>{q.kind === 'cmp' ? <><b>{o}</b></> : o}</span>
                      {pick_ !== null && right && <Ico n="check" size={20} className="qz-mark" />}
                      {pick_ !== null && !right && o === pick_ && <Ico n="cross" size={20} className="qz-mark" />}
                    </button>
                  );
                })}
              </div>
            )}

            {pick_ === null && sess.type !== 'time' && (
              <div className="qz-lives">
                <button type="button" className="qz-life" disabled={sess.left.hint <= 0 || hint} onClick={() => useLife('hint')}><Ico n="bulb" size={15} /> Gợi ý <em>{sess.left.hint}</em><kbd>H</kbd></button>
                {!isType && <button type="button" className="qz-life" disabled={sess.left.half <= 0 || hidden.length > 0} onClick={() => useLife('half')}><Ico n="half" size={15} /> 50:50 <em>{sess.left.half}</em><kbd>F</kbd></button>}
                <button type="button" className="qz-life" disabled={sess.left.skip <= 0} onClick={() => useLife('skip')}><Ico n="skip" size={15} /> Bỏ qua <em>{sess.left.skip}</em><kbd>S</kbd></button>
              </div>
            )}

            {pick_ !== null && last && (
              <div className={'qz-result ' + (last.good ? 'ok' : 'bad')} role="status">
                <div className="qz-result-l">
                  <Ico n={last.good ? 'check' : 'cross'} size={20} />
                  <div>
                    <b>{last.good ? 'Chính xác' : `Đáp án đúng: ${q.kind === 'cmp' ? q.val : String(q.val)}`}</b>
                    <small>{last.good ? `+${last.gain} XP${last.fast ? ' · trả lời nhanh +5' : ''}${hint ? ' · đã dùng gợi ý, XP giảm nửa' : ''}` : `+${last.gain} XP · nguyên tố này sẽ xuất hiện lại sớm hơn`}</small>
                  </div>
                </div>
                {sess.type !== 'time' && (
                  <button className="btn primary" type="button" onClick={advance} autoFocus>
                    {sess.len && sess.all >= sess.len ? 'Xem kết quả' : 'Câu tiếp'} <Ico n="arrow" size={16} />
                  </button>
                )}
              </div>
            )}

            {pick_ !== null && sess.type !== 'time' && (
              q.kind === 'cmp'
                ? <div className="qz-cmp">{q.shown.map((x) => <span key={x.symbol}><b>{x.symbol}</b> {q.prop === 'electronegativity' ? x.electronegativity : x.atomicRadius + ' pm'}</span>)}</div>
                : <ElementCard e={q.e} />
            )}
          </div>

          {sess.type !== 'time' && !isType && <p className="qz-keys"><kbd>1</kbd>–<kbd>4</kbd> chọn · <kbd>Enter</kbd> câu tiếp</p>}
        </div>
      )}

      {/* ===== KẾT QUẢ PHIÊN ===== */}
      {result && (
        <Modal title="Kết quả phiên" icon="trophy" onClose={() => setResult(null)}>
          <div className="qz-final">
            <div className="qz-final-score"><b>{result.ok}</b><span>/ {result.all} câu đúng</span></div>
            {result.newBest && <p className="qz-badge"><Ico n="star" size={14} /> Kỷ lục Time Attack mới</p>}
            <div className="qz-statgrid">
              <div><b>{result.all ? Math.round((result.ok / result.all) * 100) : 0}%</b><span>Chính xác</span></div>
              <div><b>{result.best}</b><span>Chuỗi đúng dài nhất</span></div>
              <div><b>+{result.xp + result.bonus}</b><span>XP{result.bonus ? ' (gồm thưởng ngày)' : ''}</span></div>
              <div><b>{result.dur}s</b><span>Thời gian</span></div>
            </div>
            {result.answers.some((a) => !a.good) && (
              <>
                <h3 className="qz-h3">Cần xem lại</h3>
                <ul className="qz-misses">
                  {result.answers.filter((a) => !a.good).map((a, i) => (
                    <li key={i}><b>{a.q.e.symbol}</b><span>{questionText(a.q)}</span><em>{String(a.q.val)}</em></li>
                  ))}
                </ul>
              </>
            )}
            <div className="qz-actions">
              <button className="btn primary" type="button" onClick={() => start(result.type)}><Ico n="refresh" size={16} /> Chơi lại</button>
              <button className="btn" type="button" onClick={() => setResult(null)}>Đóng</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ===== THỐNG KÊ ===== */}
      {modal === 'stats' && (
        <Modal title="Thống kê học tập" icon="chart" onClose={() => setModal(null)} wide>
          <div className="qz-statgrid">
            <div><b>{gs.totalCorrect}</b><span>Câu đúng</span></div>
            <div><b>{gs.totalWrong}</b><span>Câu sai</span></div>
            <div><b>{acc}%</b><span>Chính xác</span></div>
            <div><b>{gs.maxStreak}</b><span>Chuỗi đúng dài nhất</span></div>
          </div>
          <h3 className="qz-h3">Bản đồ độ nhớ</h3>
          <Heatmap records={records} />
          <h3 className="qz-h3">Độ chính xác theo chủ đề</h3>
          <ul className="qz-kinds">
            {Object.entries(gs.byKind || {}).sort((a, b) => a[1].ok / a[1].all - b[1].ok / b[1].all).map(([k, v]) => {
              const p = Math.round((v.ok / v.all) * 100);
              return <li key={k}><span>{KIND_LABEL[k] || k}</span><div className="qz-mastery"><i style={{ width: p + '%' }} /></div><small>{p}% · {v.all}</small></li>;
            })}
            {!Object.keys(gs.byKind || {}).length && <li className="qz-note">Trả lời vài câu để thấy thống kê theo chủ đề.</li>}
          </ul>
          {gs.bestTimeAttack && <p className="qz-note">Time Attack tốt nhất: đúng {gs.bestTimeAttack.score}/{gs.bestTimeAttack.total} câu trong {TA_SECONDS}s.</p>}
        </Modal>
      )}

      {/* ===== THÀNH TÍCH ===== */}
      {modal === 'ach' && (
        <Modal title="Thành tích" icon="trophy" onClose={() => setModal(null)}>
          <p className="qz-note">Đã mở khóa {achievements.length}/{ACHIEVEMENTS.length}</p>
          <ul className="qz-achs">
            {ACHIEVEMENTS.map((a) => {
              const on = achievements.includes(a.id);
              return (
                <li key={a.id} className={on ? 'on' : ''}>
                  <span className="qz-ach-ico"><AchIcon a={a} locked={!on} /></span>
                  <div><b>{a.title}</b><small>{a.desc}</small></div>
                </li>
              );
            })}
          </ul>
        </Modal>
      )}

      {/* ===== ÔN CÂU SAI ===== */}
      {modal === 'review' && (
        <Modal title="Nguyên tố hay sai" icon="review" onClose={() => setModal(null)}>
          <div className="qz-review">
            {wrongBank.map((z) => {
              const e = ELEMENTS.find((x) => x.atomicNumber === z);
              return e && (
                <div key={z} style={{ '--c': `var(--${e.category})` }}>
                  <small>{e.atomicNumber}</small><b>{e.symbol}</b><span>{e.vietnameseName}</span>
                </div>
              );
            })}
          </div>
          <div className="qz-actions">
            <button className="btn primary" type="button" onClick={() => { setModal(null); start('weak'); }}><Ico n="play" size={15} /> Luyện ngay</button>
            <button className="btn" type="button" onClick={() => { setWrongBank([]); setModal(null); }}>Xóa danh sách</button>
          </div>
        </Modal>
      )}

      {/* ===== AI TẠO ĐỀ (VIP) ===== */}
      {modal === 'aigen' && (
        <Modal title="AI Tạo Đề" icon="sparkle" onClose={() => setModal(null)} wide>
          <AIQuizGenerator onClose={() => setModal(null)} />
        </Modal>
      )}

      {/* ===== TOAST THÀNH TÍCH ===== */}
      {toast && (
        <div className="qz-toast" role="status">
          <span className="qz-ach-ico on"><AchIcon a={toast} /></span>
          <div><b>Mở khóa thành tích</b><span>{toast.title}</span><small>{toast.desc}</small></div>
        </div>
      )}
    </section>
  );
}