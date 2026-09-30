import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { ELEMENTS } from '../data/elements.js';
import { useLocalStorage, studyToday, liveStreak } from '../hooks.js';
import { pickNext, mastery, stats, isDue, srsReview } from '../lib/srs.js';
import { ACHIEVEMENTS, getLevel } from '../data/achievements.js';
import { sound } from '../lib/gameSound.js';

/* ============ MODES ============ */
const MODES = [
  ['auto',     '🤖 Tự động'],
  ['sym',      '🔤 Ký hiệu'],
  ['group',    '📊 Nhóm'],
  ['period',   '📅 Chu kỳ'],
  ['block',    '🧊 Khối'],
  ['mass',     '⚖️ Khối lượng'],
  ['config',   '⚛️ Cấu hình'],
];

const TIME_ATTACK_DURATION = 90; // giây

/* ============ HELPERS ============ */
const rnd = (a) => a[Math.floor(Math.random() * a.length)];

function makeDistractors(correct, kind, element) {
  const all = ELEMENTS.filter((e) => e.atomicNumber !== element.atomicNumber);

  switch (kind) {
    case 'sym':
      return all.map((e) => e.symbol);
    case 'group':
      return [1, 2, 13, 14, 15, 16, 17, 18];
    case 'period':
      return [1, 2, 3, 4, 5, 6, 7];
    case 'block':
      return ['s', 'p', 'd', 'f'];
    case 'mass':
      // Lấy khối lượng gần đúng ±20%
      const base = parseFloat(element.atomicMass);
      return all
        .map((e) => parseFloat(e.atomicMass))
        .filter((m) => Math.abs(m - base) / base < 0.4)
        .map((m) => m.toFixed(2));
    case 'config':
      // Lấy cấu hình của các nguyên tố gần
      return all
        .filter((e) => Math.abs(e.atomicNumber - element.atomicNumber) <= 5)
        .map((e) => e.electronConfiguration);
    default:
      return all.map((e) => e.symbol);
  }
}

function makeOptions(val, kind, element) {
  const pool = makeDistractors(val, kind, element);
  const opts = [val];
  const used = new Set([val]);
  let attempts = 0;

  while (opts.length < 4 && attempts < 100) {
    attempts++;
    const o = rnd(pool);
    if (!used.has(o)) {
      opts.push(o);
      used.add(o);
    }
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
    ? rnd(['sym', 'group', 'period', 'sym', 'sym', 'config'])
    : mode;

  const val = kind === 'sym' ? e.symbol
    : kind === 'group' ? e.group
    : kind === 'period' ? e.period
    : kind === 'block' ? e.block
    : kind === 'mass' ? e.atomicMass
    : kind === 'config' ? e.electronConfiguration
    : e.symbol;

  return { e, kind, val, opts: makeOptions(val, kind, e) };
}

/* ============ ACHIEVEMENT CHECKER ============ */
function checkAchievements(stats, unlocked) {
  const newUnlocks = [];
  ACHIEVEMENTS.forEach((a) => {
    if (!unlocked.includes(a.id) && a.check(stats)) {
      newUnlocks.push(a);
    }
  });
  return newUnlocks;
}

/* ============ MAIN ============ */
export default function Quiz() {
  // ==== Storage ====
  const [records, setRecords] = useLocalStorage('cs-srs-v2', {});
  const [streak, setStreak] = useLocalStorage('cs-streak-v2', { last: '', n: 0, total: 0 });
  const [xp, setXp] = useLocalStorage('cs-xp', 0);
  const [achievements, setAchievements] = useLocalStorage('cs-achievements', []);
  const [globalStats, setGlobalStats] = useLocalStorage('cs-quiz-stats', {
    totalCorrect: 0,
    totalWrong: 0,
    maxStreak: 0,
    dailyCount: 0,
    bestTimeAttack: null,
    lastDailyDate: null,
  });
  const [wrongBank, setWrongBank] = useLocalStorage('cs-wrong-bank', []); // nguyên tố hay sai

  // ==== State ====
  const [mode, setMode] = useState('auto');
  const [q, setQ] = useState(() => makeQuestion('auto', {}, null));
  const [pick, setPick] = useState(null);
  const [sc, setSc] = useState({ ok: 0, all: 0 });
  const [sessionStreak, setSessionStreak] = useState(0);
  const [timeAttack, setTimeAttack] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_ATTACK_DURATION);
  const [newAchievement, setNewAchievement] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [sessionAnswers, setSessionAnswers] = useState([]); // lịch sử câu trả lời phiên này
  const [flash, setFlash] = useState(null);

  const timerRef = useRef();

  const s = useMemo(() => stats(records, ELEMENTS), [records]);
  const levelInfo = useMemo(() => getLevel(xp), [xp]);

  /* ============ TIME ATTACK TIMER ============ */
  useEffect(() => {
    if (!timeAttack) return;
    if (timeLeft <= 0) {
      // Kết thúc
      setTimeAttack(false);
      sound.win?.();
      // Lưu best time
      const finalScore = sc.ok;
      if (!globalStats.bestTimeAttack || sc.all > (globalStats.bestTimeAttack?.score || 0)) {
        setGlobalStats({
          ...globalStats,
          bestTimeAttack: { score: sc.ok, total: sc.all, date: Date.now() },
        });
      }
      return;
    }
    timerRef.current = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [timeLeft, timeAttack]);

  /* ============ ACHIEVEMENT CHECKER ============ */
  useEffect(() => {
    const currentStats = {
      ...globalStats,
      mastered: s.mastered,
      streak: liveStreak(streak),
      maxStreak: globalStats.maxStreak,
    };
    const newUnlocks = checkAchievements(currentStats, achievements);
    if (newUnlocks.length > 0) {
      setAchievements([...achievements, ...newUnlocks.map((a) => a.id)]);
      setNewAchievement(newUnlocks[0]);
      sound.win?.();
      setTimeout(() => setNewAchievement(null), 4000);
    }
  }, [globalStats, s.mastered, streak, achievements]);

  /* ============ ANSWER HANDLER ============ */
  const answer = useCallback((o) => {
    if (pick !== null) return;

    setPick(o);
    const good = o === q.val;
    const z = q.e.atomicNumber;
    const cur = records[z] || { ef: 2.5, interval: 0, reps: 0, due: 0, lapses: 0 };

    // SM-2
    const quality = good ? 4 : 1;
    const next = srsReview(cur, quality);
    next.streak = good ? (cur.streak || 0) + 1 : 0;
    setRecords({ ...records, [z]: next });

    // XP
    const xpGain = good ? 10 + Math.min(20, sessionStreak * 2) : 2;
    setXp((prev) => prev + xpGain);

    // Score
    setSc((prev) => ({ ok: prev.ok + (good ? 1 : 0), all: prev.all + 1 }));
    setSessionStreak(good ? sessionStreak + 1 : 0);
    setStreak(studyToday(streak));

    // Global stats
    setGlobalStats((prev) => ({
      ...prev,
      totalCorrect: prev.totalCorrect + (good ? 1 : 0),
      totalWrong: prev.totalWrong + (good ? 0 : 1),
      maxStreak: Math.max(prev.maxStreak, sessionStreak + (good ? 1 : 0)),
    }));

    // Wrong bank
    if (!good && !wrongBank.includes(z)) {
      setWrongBank([...wrongBank, z]);
    } else if (good && wrongBank.includes(z)) {
      setWrongBank(wrongBank.filter((x) => x !== z));
    }

    // Session history
    setSessionAnswers((prev) => [...prev, {
      element: q.e,
      question: q,
      pick: o,
      correct: good,
      timestamp: Date.now(),
    }]);

    // Flash animation
    setFlash(good ? 'correct' : 'wrong');
    setTimeout(() => setFlash(null), 400);

    if (good) sound.correct?.();
    else sound.wrong?.();
  }, [pick, q, records, sessionStreak, streak, wrongBank, globalStats]);

  /* ============ NEXT QUESTION ============ */
  const go = useCallback((m = mode) => {
    setMode(m);
    setPick(null);
    setQ(makeQuestion(m, records, q?.e.atomicNumber));
  }, [mode, records, q]);

  /* ============ START TIME ATTACK ============ */
  const startTimeAttack = () => {
    setTimeAttack(true);
    setTimeLeft(TIME_ATTACK_DURATION);
    setSc({ ok: 0, all: 0 });
    setSessionStreak(0);
    setSessionAnswers([]);
    go('auto');
  };

  /* ============ KEYBOARD ============ */
  useEffect(() => {
    const onKey = (e) => {
      if (pick === null && ['1', '2', '3', '4'].includes(e.key)) {
        const idx = +e.key - 1;
        if (q?.opts[idx] !== undefined) answer(q.opts[idx]);
      }
      if (pick !== null && e.key === 'Enter') go(mode);
      if (e.key === 'Escape') {
        setShowStats(false);
        setShowAchievements(false);
        setShowReview(false);
      }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [pick, q, mode, answer, go]);

  /* ============ EXPORT / IMPORT ============ */
  const exportProgress = () => {
    const data = {
      version: 2,
      exportDate: new Date().toISOString(),
      records,
      streak,
      xp,
      achievements,
      globalStats,
      wrongBank,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chem-study-quiz-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importProgress = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.version) throw new Error('Invalid file');
        if (confirm('Ghi đè tiến độ hiện tại?')) {
          setRecords(data.records || {});
          setStreak(data.streak || { last: '', n: 0, total: 0 });
          setXp(data.xp || 0);
          setAchievements(data.achievements || []);
          setGlobalStats(data.globalStats || {});
          setWrongBank(data.wrongBank || []);
          alert('Đã nhập thành công!');
        }
      } catch {
        alert('File không hợp lệ');
      }
    };
    reader.readAsText(f);
    e.target.value = '';
  };

  /* ============ QUESTION TEXT ============ */
  const text = q && (() => {
    switch (q.kind) {
      case 'sym':
        return `Ký hiệu hóa học của "${q.e.vietnameseName}" (${q.e.name})?`;
      case 'group':
        return `${q.e.vietnameseName} (${q.e.symbol}) ở nhóm nào?`;
      case 'period':
        return `${q.e.vietnameseName} (${q.e.symbol}) ở chu kỳ nào?`;
      case 'block':
        return `${q.e.vietnameseName} (${q.e.symbol}) thuộc khối nào?`;
      case 'mass':
        return `Khối lượng nguyên tử của ${q.e.vietnameseName} (${q.e.symbol})?`;
      case 'config':
        return `Cấu hình electron của ${q.e.vietnameseName} (${q.e.symbol})?`;
      default:
        return '';
    }
  })();

  const rec = q ? records[q.e.atomicNumber] : null;
  const m = rec ? mastery(rec) : 0;

  /* ============ RENDER ============ */
  return (
    <section className="wrap narrow">
      {/* Flash overlay */}
      {flash && <div className={'quiz-flash quiz-flash-' + flash} aria-hidden="true" />}

      {/* Header với level bar */}
      <div className="quiz-header">
        <div>
          <h1>Ôn tập thông minh</h1>
          <p className="hint" style={{ margin: 0 }}>
            {levelInfo.current.icon || '⭐'} Level {levelInfo.current.lvl} · {levelInfo.current.title}
          </p>
        </div>
        <div className="quiz-xp">
          <div className="quiz-xp-bar">
            <i style={{ width: levelInfo.progress + '%' }} />
          </div>
          <small>{xp} / {levelInfo.next?.xp || xp} XP</small>
        </div>
      </div>

      {/* Action buttons */}
      <div className="quiz-toolbar">
        <button className="btn sm" onClick={() => setShowStats(true)} type="button">
          📊 Thống kê
        </button>
        <button className="btn sm" onClick={() => setShowAchievements(true)} type="button">
          🏆 Thành tích ({achievements.length}/{ACHIEVEMENTS.length})
        </button>
        {wrongBank.length > 0 && (
          <button className="btn sm" onClick={() => setShowReview(true)} type="button">
            📝 Ôn lại ({wrongBank.length})
          </button>
        )}
        <button
          className={'btn sm' + (timeAttack ? ' primary' : '')}
          onClick={startTimeAttack}
          type="button"
        >
          ⚡ Time Attack
        </button>
        <button className="btn sm" onClick={exportProgress} type="button">
          💾 Xuất
        </button>
        <label className="btn sm" style={{ cursor: 'pointer', margin: 0 }}>
          📂 Nhập
          <input type="file" accept=".json" hidden onChange={importProgress} />
        </label>
      </div>

      {/* Time Attack banner */}
      {timeAttack && (
        <div className="quiz-timeattack-banner">
          <div className="quiz-ta-info">
            <span>⚡ TIME ATTACK</span>
            <span className="quiz-ta-time">⏱ {timeLeft}s</span>
            <span>Đúng: {sc.ok}</span>
          </div>
          <div className="quiz-ta-bar">
            <i style={{ width: (timeLeft / TIME_ATTACK_DURATION) * 100 + '%' }} />
          </div>
          <button
            className="btn sm"
            onClick={() => { setTimeAttack(false); setTimeLeft(TIME_ATTACK_DURATION); }}
            type="button"
          >
            Dừng
          </button>
        </div>
      )}

      {/* Modes */}
      {!timeAttack && (
        <div className="tabs">
          {MODES.map(([k, l]) => (
            <button
              key={k}
              className={'chip' + (mode === k ? ' on' : '')}
              onClick={() => go(k)}
              type="button"
            >
              {l}
            </button>
          ))}
        </div>
      )}

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
        Streak phiên: {sessionStreak} ·
        Max: {globalStats.maxStreak}
      </p>

      {/* Question card */}
      {q && !timeAttack === false ? null : q && (
        <div className="card quiz-card">
          <div className="srs-mastery">
            <small>Độ nhớ: {m}%</small>
            <div className="bar"><i style={{ width: m + '%' }} /></div>
          </div>

          <h3 className="quiz-question">{text}</h3>

          <div className="opts">
            {q.opts.map((o, i) => {
              const isCorrect = o === q.val;
              const isPicked = o === pick;
              let cls = 'btn opt';
              if (pick !== null) {
                if (isCorrect) cls += ' good';
                else if (isPicked) cls += ' bad';
              }
              return (
                <button
                  key={o}
                  className={cls}
                  onClick={() => answer(o)}
                  disabled={pick !== null}
                  type="button"
                >
                  <small className="quiz-opt-key">{i + 1}</small>
                  <span>{o}</span>
                </button>
              );
            })}
          </div>

          {pick !== null && (
            <div className="row center" style={{ marginTop: '1rem' }}>
              <span className={'done' + (pick !== q.val ? ' done-bad' : '')}>
                {pick === q.val
                  ? `✓ Chính xác! +${10 + Math.min(20, sessionStreak * 2)} XP`
                  : `✗ Đáp án: ${q.val}`}
              </span>
              <button className="btn primary" onClick={() => go(mode)} type="button">
                Câu tiếp (Enter) →
              </button>
            </div>
          )}

          <p className="hint center" style={{ marginTop: '.6rem' }}>
            💡 Nhấn <kbd>1</kbd>-<kbd>4</kbd> để chọn nhanh, <kbd>Enter</kbd> để qua câu
          </p>
        </div>
      )}

      {/* ==== ACHIEVEMENT POPUP ==== */}
      {newAchievement && (
        <div className="quiz-achievement-popup">
          <span className="quiz-ach-icon">{newAchievement.icon}</span>
          <div>
            <b>Thành tích mới!</b>
            <span>{newAchievement.title}</span>
            <small>{newAchievement.desc}</small>
          </div>
        </div>
      )}

      {/* ==== STATS MODAL ==== */}
      {showStats && (
        <div className="backdrop" onMouseDown={(e) => e.target === e.currentTarget && setShowStats(false)}>
          <div className="quiz-modal" role="dialog">
            <div className="quiz-modal-head">
              <h2>📊 Thống kê học tập</h2>
              <button className="x" onClick={() => setShowStats(false)} type="button">×</button>
            </div>
            <div className="quiz-modal-body">
              <div className="quiz-stat-grid">
                <div className="quiz-stat-box">
                  <b>{globalStats.totalCorrect}</b>
                  <span>Câu đúng</span>
                </div>
                <div className="quiz-stat-box">
                  <b>{globalStats.totalWrong}</b>
                  <span>Câu sai</span>
                </div>
                <div className="quiz-stat-box">
                  <b>{globalStats.totalCorrect + globalStats.totalWrong > 0
                    ? Math.round((globalStats.totalCorrect / (globalStats.totalCorrect + globalStats.totalWrong)) * 100)
                    : 0}%</b>
                  <span>Độ chính xác</span>
                </div>
                <div className="quiz-stat-box">
                  <b>{globalStats.maxStreak}</b>
                  <span>Streak cao nhất</span>
                </div>
              </div>

              <h3 className="quiz-section-title">Tiến độ bảng tuần hoàn</h3>
              <div className="quiz-progress-grid">
                <div>
                  <span>Thành thạo</span>
                  <div className="bar"><i style={{ width: (s.mastered / s.total) * 100 + '%', background: 'var(--post)' }} /></div>
                  <small>{s.mastered}/{s.total}</small>
                </div>
                <div>
                  <span>Đang học</span>
                  <div className="bar"><i style={{ width: (s.learning / s.total) * 100 + '%', background: 'var(--alkaline)' }} /></div>
                  <small>{s.learning}/{s.total}</small>
                </div>
                <div>
                  <span>Chưa học</span>
                  <div className="bar"><i style={{ width: (s.fresh / s.total) * 100 + '%', background: 'var(--mut)' }} /></div>
                  <small>{s.fresh}/{s.total}</small>
                </div>
              </div>

              {globalStats.bestTimeAttack && (
                <>
                  <h3 className="quiz-section-title">⚡ Time Attack tốt nhất</h3>
                  <p>
                    Đúng <b>{globalStats.bestTimeAttack.score}</b>/{globalStats.bestTimeAttack.total} câu
                    trong {TIME_ATTACK_DURATION}s
                  </p>
                </>
              )}

              {wrongBank.length > 0 && (
                <>
                  <h3 className="quiz-section-title">⚠️ Nguyên tố hay sai ({wrongBank.length})</h3>
                  <div className="quiz-wrong-chips">
                    {wrongBank.slice(0, 20).map((z) => {
                      const el = ELEMENTS.find((e) => e.atomicNumber === z);
                      if (!el) return null;
                      return (
                        <span key={z} className="quiz-wrong-chip" title={el.vietnameseName}>
                          {el.symbol}
                        </span>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==== ACHIEVEMENTS MODAL ==== */}
      {showAchievements && (
        <div className="backdrop" onMouseDown={(e) => e.target === e.currentTarget && setShowAchievements(false)}>
          <div className="quiz-modal" role="dialog">
            <div className="quiz-modal-head">
              <h2>🏆 Thành tích</h2>
              <button className="x" onClick={() => setShowAchievements(false)} type="button">×</button>
            </div>
            <div className="quiz-modal-body">
              <p className="hint">
                Đã mở khóa {achievements.length}/{ACHIEVEMENTS.length}
              </p>
              <ul className="quiz-ach-list">
                {ACHIEVEMENTS.map((a) => {
                  const unlocked = achievements.includes(a.id);
                  return (
                    <li key={a.id} className={'quiz-ach-item' + (unlocked ? ' unlocked' : '')}>
                      <span className="quiz-ach-icon">{unlocked ? a.icon : '🔒'}</span>
                      <div>
                        <b>{a.title}</b>
                        <small>{a.desc}</small>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ==== REVIEW MODAL ==== */}
      {showReview && (
        <div className="backdrop" onMouseDown={(e) => e.target === e.currentTarget && setShowReview(false)}>
          <div className="quiz-modal" role="dialog">
            <div className="quiz-modal-head">
              <h2>📝 Ôn lại câu sai</h2>
              <button className="x" onClick={() => setShowReview(false)} type="button">×</button>
            </div>
            <div className="quiz-modal-body">
              <p className="hint">
                {wrongBank.length} nguyên tố bạn hay trả lời sai. Nhấn để xem chi tiết.
              </p>
              <div className="quiz-review-grid">
                {wrongBank.map((z) => {
                  const el = ELEMENTS.find((e) => e.atomicNumber === z);
                  if (!el) return null;
                  return (
                    <div key={z} className="quiz-review-card">
                      <b>{el.symbol}</b>
                      <span>{el.vietnameseName}</span>
                      <small>Z = {el.atomicNumber} · Nhóm {el.group} · Chu kỳ {el.period}</small>
                    </div>
                  );
                })}
              </div>
              <button
                className="btn primary"
                onClick={() => {
                  setWrongBank([]);
                  setShowReview(false);
                }}
                type="button"
                style={{ marginTop: '1rem' }}
              >
                ✓ Đã ôn xong
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}