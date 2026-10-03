import { useState, useEffect, useRef, useMemo } from 'react';
import { useLocalStorage, studyToday, dayKey } from '../hooks.js';
import {
  IcoPlay, IcoPause, IcoReset, IcoExpand, IcoShrink, IcoFocus,
  IcoCoffee, IcoMoon, IcoVolume, IcoVolumeOff, IcoBell, IcoBellOff,
  IcoZap, IcoChart, IcoClock, IcoFire, IcoTrophy, IcoTarget, IcoCheck,
  IcoClose, IcoPlus, IcoTrash, IcoNote, IcoSparkle, IcoBulb, IcoInfo,
  IcoHeadphones, IcoSettings,
} from './PomodoroIcons.jsx';
import './pomodoro-v2.css';

/* ============================================================
   CONSTANTS
   ============================================================ */
const MODES = [
  { key: 'focus', label: 'Tập trung', shortLabel: 'Focus', color: '#4d86ff', Icon: IcoFocus },
  { key: 'short', label: 'Nghỉ ngắn', shortLabel: 'Nghỉ ngắn', color: '#22c55e', Icon: IcoCoffee },
  { key: 'long', label: 'Nghỉ dài', shortLabel: 'Nghỉ dài', color: '#8b5cf6', Icon: IcoMoon },
];

const PRESETS = [
  { name: 'Cổ điển', focus: 25, short: 5, long: 15, desc: '25/5/15 · Pomodoro gốc' },
  { name: 'Deep work', focus: 50, short: 10, long: 20, desc: '50/10/20 · Tập trung sâu' },
  { name: 'Nhẹ nhàng', focus: 15, short: 3, long: 10, desc: '15/3/10 · Cho người mới' },
  { name: 'Sprint', focus: 90, short: 15, long: 30, desc: '90/15/30 · Cho dự án lớn' },
];

const AMBIENT_SOUNDS = [
  { id: 'none', label: 'Không', emoji: '🔇' },
  { id: 'rain', label: 'Mưa rơi', emoji: '🌧️' },
  { id: 'cafe', label: 'Quán cafe', emoji: '☕' },
  { id: 'forest', label: 'Rừng xanh', emoji: '🌲' },
  { id: 'waves', label: 'Sóng biển', emoji: '🌊' },
];

const pad = (n) => String(n).padStart(2, '0');

function beep(freq = 880, dur = 0.15, vol = 0.3, type = 'sine') {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = type;
    gain.gain.value = vol;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.stop(ctx.currentTime + dur);
  } catch { /* */ }
}

function playDoneSound() {
  beep(880, 0.15);
  setTimeout(() => beep(1100, 0.15), 180);
  setTimeout(() => beep(1320, 0.3), 360);
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function Pomodoro() {
  const [cfg, setCfg] = useLocalStorage('cs-pomodoro', { focus: 25, short: 5, long: 15 });
  const [sessions, setSessions] = useLocalStorage('cs-sessions', 0);
  const [history, setHistory] = useLocalStorage('cs-pomo-history', {});
  const [, setStreak] = useLocalStorage('cs-streak', { last: '', n: 0, total: 0 });
  const [notify, setNotify] = useLocalStorage('cs-pomo-notify', false);
  const [sound, setSound] = useLocalStorage('cs-pomo-sound', true);
  const [autoNext, setAutoNext] = useLocalStorage('cs-pomo-autonext', true);
  const [dailyGoal, setDailyGoal] = useLocalStorage('cs-pomo-goal', 8);
  const [tasks, setTasks] = useLocalStorage('cs-pomo-tasks', []);
  const [zen, setZen] = useState(false);

  const [mode, setMode] = useState('focus');
  const [left, setLeft] = useState(cfg.focus * 60);
  const [run, setRun] = useState(false);
  const [doneMsg, setDoneMsg] = useState('');
  const [cycleCount, setCycleCount] = useState(0);

  // Task modal
  const [taskModal, setTaskModal] = useState(false);
  const [taskText, setTaskText] = useState('');
  const [taskEst, setTaskEst] = useState(1);

  // Session note
  const [noteModal, setNoteModal] = useState(false);
  const [sessionNote, setSessionNote] = useState('');

  const endAt = useRef(0);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  useEffect(() => {
    if (notify && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [notify]);

  const notifyUser = (title, body) => {
    if (notify && 'Notification' in window && Notification.permission === 'granted') {
      try { new Notification(title, { body, icon: '/favicon.ico' }); } catch { /* */ }
    }
  };

  /* ============ TIMER LOOP ============ */
  useEffect(() => {
    if (!run) return undefined;
    endAt.current = Date.now() + left * 1000;
    const id = setInterval(() => {
      const l = Math.max(0, Math.round((endAt.current - Date.now()) / 1000));
      setLeft(l);
      if (l === 0) {
        clearInterval(id);
        setRun(false);
        const m = modeRef.current;
        if (sound) playDoneSound();

        if (m === 'focus') {
          setSessions((s) => s + 1);
          setStreak(studyToday);
          const k = dayKey();
          setHistory((h) => ({ ...h, [k]: (h[k] || 0) + 1 }));
          const newCycle = cycleCount + 1;
          setCycleCount(newCycle);
          const next = newCycle % 4 === 0 ? 'long' : 'short';
          setDoneMsg(`Hoàn thành 1 phiên Focus! Nghỉ ${next === 'long' ? 'dài' : 'ngắn'} thôi.`);
          notifyUser('🎉 Hết giờ Focus', 'Nghỉ ngơi nào!');
          setNoteModal(true);
          if (autoNext) {
            setTimeout(() => {
              setMode(next);
              setLeft(cfg[next] * 60);
            }, 1500);
          }
        } else {
          setDoneMsg('Hết giờ nghỉ! Quay lại Focus nào.');
          notifyUser('⏰ Hết giờ nghỉ', 'Quay lại Focus thôi!');
          if (autoNext) {
            setTimeout(() => {
              setMode('focus');
              setLeft(cfg.focus * 60);
            }, 1500);
          }
        }
      }
    }, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line
  }, [run]);

  /* ============ DOC TITLE ============ */
  useEffect(() => {
    if (run) {
      const m = MODES.find((x) => x.key === mode);
      document.title = `${pad(Math.floor(left / 60))}:${pad(left % 60)} — ${m.shortLabel}`;
    } else {
      document.title = 'A7 K60 DTA — bycode Duy TK';
    }
    return () => { document.title = 'A7 K60 DTA — bycode Duy TK'; };
  }, [left, run, mode]);

  /* ============ KEYBOARD ============ */
  useEffect(() => {
    const onKey = (e) => {
      if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setDoneMsg('');
        if (left === 0) setLeft(cfg[mode] * 60);
        setRun((r) => !r);
      }
      if (e.key === 'Escape') setZen(false);
      if (e.key === 'r' || e.key === 'R') {
        setRun(false);
        setDoneMsg('');
        setLeft(cfg[mode] * 60);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [left, mode, cfg]);

  /* ============ ACTIONS ============ */
  const pick = (m) => {
    setRun(false);
    setDoneMsg('');
    setMode(m);
    setLeft(cfg[m] * 60);
  };

  const update = (k, v) => {
    const n = Math.min(180, Math.max(1, Math.round(+v) || 1));
    setCfg({ ...cfg, [k]: n });
    if (k === mode && !run) setLeft(n * 60);
  };

  const reset = () => {
    setRun(false);
    setDoneMsg('');
    setLeft(cfg[mode] * 60);
  };

  const applyPreset = (p) => {
    setCfg({ focus: p.focus, short: p.short, long: p.long });
    setRun(false);
    setMode('focus');
    setLeft(p.focus * 60);
    setDoneMsg(`Đã áp dụng preset "${p.name}"`);
    setTimeout(() => setDoneMsg(''), 2000);
  };

  const addTask = () => {
    if (!taskText.trim()) return;
    setTasks([
      ...tasks,
      { id: Date.now(), text: taskText.trim(), est: taskEst, done: 0, doneFlag: false },
    ]);
    setTaskText('');
    setTaskEst(1);
    setTaskModal(false);
  };

  const toggleTaskDone = (id) => {
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, doneFlag: !t.doneFlag } : t)));
  };

  const incrementTask = (id) => {
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, done: t.done + 1 } : t)));
  };

  const removeTask = (id) => {
    setTasks((ts) => ts.filter((t) => t.id !== id));
  };

  const saveNote = () => {
    setNoteModal(false);
    setSessionNote('');
    setDoneMsg('Đã lưu ghi chú phiên học!');
    setTimeout(() => setDoneMsg(''), 2000);
  };

  const total = cfg[mode] * 60;
  const progress = total > 0 ? (total - left) / total : 0;
  const R = 120;
  const C = 2 * Math.PI * R;
  const dash = C * (1 - progress);
  const currentMode = MODES.find((m) => m.key === mode);

  /* ============ STATS ============ */
  const last7 = useMemo(() => {
    const arr = [];
    for (let i = 6; i >= 0; i--) {
      const k = dayKey(Date.now() - i * 864e5);
      arr.push({
        key: k,
        n: history[k] || 0,
        label: new Date(k).toLocaleDateString('vi-VN', { weekday: 'short' }),
      });
    }
    return arr;
  }, [history]);
  const maxN = Math.max(1, ...last7.map((d) => d.n), dailyGoal);
  const todayN = history[dayKey()] || 0;
  const goalPct = dailyGoal > 0 ? Math.min(100, (todayN / dailyGoal) * 100) : 0;

  /* ============ RENDER ============ */
  return (
    <div className={'pomo' + (zen ? ' zen' : '')}>
      <div className="pomo-wrap">
        {/* ============ HEADER ============ */}
        <header className="pomo-head">
          <div className="pomo-head-l">
            <span className="pomo-badge">
              <IcoClock size={14} />
              Pomodoro
            </span>
            <h1 className="pomo-title">Tập trung sâu, nghỉ đúng lúc</h1>
            <p className="pomo-sub">
              Phiên Focus hôm nay: <b>{todayN}</b> · Tổng: <b>{sessions}</b> · Chu kỳ:{' '}
              <b>{cycleCount % 4}/4</b>
            </p>
          </div>

          <div className="pomo-head-r">
            <button
              type="button"
              className="pomo-btn pomo-btn-ghost"
              onClick={() => setTaskModal(true)}
              title="Thêm task"
            >
              <IcoPlus size={15} />
              <span>Task</span>
            </button>
            <button
              type="button"
              className="pomo-btn pomo-btn-ghost"
              onClick={() => setZen(true)}
              title="Chế độ toàn màn hình"
            >
              <IcoExpand size={15} />
              <span>Toàn màn hình</span>
            </button>
          </div>
        </header>

        {/* ============ MODE TABS ============ */}
        {!zen && (
          <div className="pomo-tabs">
            {MODES.map((m) => {
              const Icon = m.Icon;
              const on = mode === m.key;
              return (
                <button
                  key={m.key}
                  type="button"
                  className={'pomo-tab' + (on ? ' on' : '')}
                  style={on ? { '--pomo-tab-color': m.color } : undefined}
                  onClick={() => pick(m.key)}
                >
                  <Icon size={16} />
                  <span>{m.shortLabel}</span>
                  <em>{cfg[m.key]}p</em>
                </button>
              );
            })}
          </div>
        )}

        {/* ============ MAIN TIMER ============ */}
        <div className="pomo-main">
          <div className="pomo-ring-wrap">
            <svg viewBox="0 0 280 280" className="pomo-ring" aria-hidden="true">
              <defs>
                <linearGradient id="pomo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={currentMode.color} />
                  <stop offset="100%" stopColor={currentMode.color} stopOpacity="0.7" />
                </linearGradient>
              </defs>
              <circle cx="140" cy="140" r={R} className="pomo-ring-bg" />
              <circle
                cx="140"
                cy="140"
                r={R}
                className="pomo-ring-fg"
                style={{
                  stroke: currentMode.color,
                  strokeDasharray: C,
                  strokeDashoffset: dash,
                  transform: 'rotate(-90deg)',
                  transformOrigin: '140px 140px',
                  filter: `drop-shadow(0 0 12px ${currentMode.color})`,
                }}
              />
            </svg>
            <div className="pomo-time" role="timer" aria-live="off">
              <b>{pad(Math.floor(left / 60))}:{pad(left % 60)}</b>
              <small>{currentMode.label}</small>
            </div>
          </div>

          {/* Controls */}
          <div className="pomo-controls">
            {run ? (
              <button className="pomo-btn-primary" onClick={() => setRun(false)}>
                <IcoPause size={20} />
                Tạm dừng
              </button>
            ) : (
              <button
                className="pomo-btn-primary"
                onClick={() => {
                  setDoneMsg('');
                  if (left === 0) setLeft(cfg[mode] * 60);
                  setRun(true);
                }}
              >
                <IcoPlay size={20} />
                Bắt đầu
              </button>
            )}
            <button className="pomo-btn-icon" onClick={reset} title="Đặt lại">
              <IcoReset size={18} />
            </button>
            {zen && (
              <button
                className="pomo-btn-icon"
                onClick={() => setZen(false)}
                title="Thoát toàn màn hình"
              >
                <IcoShrink size={18} />
              </button>
            )}
          </div>

          {doneMsg && (
            <div className="pomo-done-msg">
              <IcoSparkle size={16} />
              {doneMsg}
            </div>
          )}
        </div>

        {/* ============ TASK LIST ============ */}
        {!zen && tasks.length > 0 && (
          <section className="pomo-card">
            <header className="pomo-card-head">
              <IcoTarget size={16} />
              <h3>Task hôm nay</h3>
              <span className="pomo-card-count">{tasks.filter((t) => !t.doneFlag).length}/{tasks.length}</span>
            </header>
            <ul className="pomo-tasks">
              {tasks.map((t) => (
                <li key={t.id} className={'pomo-task' + (t.doneFlag ? ' done' : '')}>
                  <button
                    type="button"
                    className="pomo-task-check"
                    onClick={() => toggleTaskDone(t.id)}
                    aria-label="Đánh dấu xong"
                  >
                    {t.doneFlag ? <IcoCheck size={14} /> : null}
                  </button>
                  <div className="pomo-task-body">
                    <p className="pomo-task-text">{t.text}</p>
                    <div className="pomo-task-pomodoros">
                      {Array.from({ length: t.est }).map((_, i) => (
                        <span key={i} className={i < t.done ? 'on' : ''} />
                      ))}
                      <span className="pomo-task-count">{t.done}/{t.est}</span>
                    </div>
                  </div>
                  {!t.doneFlag && (
                    <button
                      type="button"
                      className="pomo-task-inc"
                      onClick={() => incrementTask(t.id)}
                      title="Thêm 1 phiên"
                    >
                      <IcoPlus size={13} />
                    </button>
                  )}
                  <button
                    type="button"
                    className="pomo-task-del"
                    onClick={() => removeTask(t.id)}
                    aria-label="Xóa task"
                  >
                    <IcoTrash size={13} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ============ GOAL ============ */}
        {!zen && (
          <section className="pomo-card">
            <header className="pomo-card-head">
              <IcoTrophy size={16} />
              <h3>Mục tiêu hôm nay</h3>
              <span className="pomo-card-count">{todayN}/{dailyGoal} phiên</span>
            </header>
            <div className="pomo-goal">
              <div className="pomo-goal-bar">
                <i style={{ width: `${goalPct}%` }} />
              </div>
              <p className="pomo-goal-label">
                {goalPct >= 100 ? 'Đã đạt mục tiêu hôm nay!' : `Còn ${dailyGoal - todayN} phiên nữa`}
              </p>
            </div>
            <div className="pomo-goal-setting">
              <label>
                <span>Mục tiêu</span>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(Math.max(1, Math.min(30, +e.target.value || 1)))}
                />
                <small>phiên/ngày</small>
              </label>
            </div>
          </section>
        )}

        {/* ============ CHART 7 NGÀY ============ */}
        {!zen && (
          <section className="pomo-card">
            <header className="pomo-card-head">
              <IcoChart size={16} />
              <h3>7 ngày gần nhất</h3>
              <span className="pomo-card-count">Đỉnh {maxN}</span>
            </header>
            <div className="pomo-chart">
              {last7.map((d) => {
                const h = maxN > 0 ? (d.n / maxN) * 100 : 0;
                const isGoal = d.n >= dailyGoal;
                const isToday = d.key === dayKey();
                return (
                  <div
                    key={d.key}
                    className={'pomo-chart-col' + (isToday ? ' today' : '')}
                    title={`${d.key}: ${d.n} phiên`}
                  >
                    <div className="pomo-chart-bar-wrap">
                      {isGoal && <span className="pomo-chart-crown"><IcoTrophy size={11} /></span>}
                      <div
                        className={'pomo-chart-bar' + (isGoal ? ' goal' : '')}
                        style={{ height: `${Math.max(4, h)}%` }}
                      >
                        {d.n > 0 && <span>{d.n}</span>}
                      </div>
                    </div>
                    <small>{d.label}</small>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ============ PRESETS ============ */}
        {!zen && (
          <section className="pomo-card">
            <header className="pomo-card-head">
              <IcoZap size={16} />
              <h3>Mẫu nhanh</h3>
            </header>
            <div className="pomo-presets">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  className="pomo-preset"
                  onClick={() => applyPreset(p)}
                  title={p.desc}
                >
                  <b>{p.name}</b>
                  <small>{p.desc}</small>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ============ SETTINGS ============ */}
        {!zen && (
          <section className="pomo-card">
            <header className="pomo-card-head">
              <IcoSettings size={16} />
              <h3>Cấu hình</h3>
            </header>
            <div className="pomo-settings">
              {MODES.map((m) => {
                const Icon = m.Icon;
                return (
                  <label key={m.key} className="pomo-setting">
                    <span className="pomo-setting-label">
                      <Icon size={14} />
                      {m.label}
                    </span>
                    <input
                      type="number"
                      min="1"
                      max="180"
                      value={cfg[m.key]}
                      onChange={(e) => update(m.key, e.target.value)}
                    />
                    <small>phút</small>
                  </label>
                );
              })}
            </div>

            <div className="pomo-toggles">
              <label className="pomo-toggle">
                <input
                  type="checkbox"
                  checked={sound}
                  onChange={(e) => setSound(e.target.checked)}
                />
                <span className="pomo-toggle-ico">
                  {sound ? <IcoVolume size={15} /> : <IcoVolumeOff size={15} />}
                </span>
                <span>Âm thanh khi hết giờ</span>
              </label>
              <label className="pomo-toggle">
                <input
                  type="checkbox"
                  checked={notify}
                  onChange={(e) => setNotify(e.target.checked)}
                />
                <span className="pomo-toggle-ico">
                  {notify ? <IcoBell size={15} /> : <IcoBellOff size={15} />}
                </span>
                <span>Thông báo desktop</span>
              </label>
              <label className="pomo-toggle">
                <input
                  type="checkbox"
                  checked={autoNext}
                  onChange={(e) => setAutoNext(e.target.checked)}
                />
                <span className="pomo-toggle-ico">
                  <IcoZap size={15} />
                </span>
                <span>Tự động chuyển chế độ</span>
              </label>
            </div>
          </section>
        )}

        {/* ============ HINTS ============ */}
        {!zen && (
          <div className="pomo-hints">
            <p>
              <kbd>Space</kbd> Bắt đầu/Tạm dừng · <kbd>R</kbd> Đặt lại ·{' '}
              <kbd>Esc</kbd> Thoát toàn màn hình
            </p>
          </div>
        )}
      </div>

      {/* ============ TASK MODAL ============ */}
      {taskModal && (
        <div
          className="pomo-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setTaskModal(false)}
        >
          <div className="pomo-modal">
            <header className="pomo-modal-head">
              <h2>
                <IcoPlus size={18} />
                Thêm task mới
              </h2>
              <button
                type="button"
                className="pomo-modal-x"
                onClick={() => setTaskModal(false)}
                aria-label="Đóng"
              >
                <IcoClose size={16} />
              </button>
            </header>
            <div className="pomo-modal-body">
              <label className="pomo-field">
                <span>Nội dung task</span>
                <input
                  type="text"
                  value={taskText}
                  onChange={(e) => setTaskText(e.target.value)}
                  placeholder="VD: Hoàn thành chương Este"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && addTask()}
                />
              </label>
              <label className="pomo-field">
                <span>Số phiên dự kiến</span>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={taskEst}
                  onChange={(e) => setTaskEst(Math.max(1, Math.min(20, +e.target.value || 1)))}
                />
              </label>
            </div>
            <footer className="pomo-modal-foot">
              <button
                type="button"
                className="pomo-btn pomo-btn-ghost"
                onClick={() => setTaskModal(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="pomo-btn pomo-btn-primary"
                onClick={addTask}
                disabled={!taskText.trim()}
              >
                <IcoCheck size={15} />
                Thêm task
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* ============ SESSION NOTE MODAL ============ */}
      {noteModal && (
        <div
          className="pomo-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setNoteModal(false)}
        >
          <div className="pomo-modal">
            <header className="pomo-modal-head">
              <h2>
                <IcoNote size={18} />
                Ghi chú phiên học
              </h2>
              <button
                type="button"
                className="pomo-modal-x"
                onClick={() => setNoteModal(false)}
                aria-label="Đóng"
              >
                <IcoClose size={16} />
              </button>
            </header>
            <div className="pomo-modal-body">
              <p className="pomo-note-hint">
                <IcoBulb size={14} />
                Vừa xong 1 phiên Focus. Bạn đã làm được gì?
              </p>
              <label className="pomo-field">
                <span>Ghi chú (không bắt buộc)</span>
                <textarea
                  value={sessionNote}
                  onChange={(e) => setSessionNote(e.target.value)}
                  placeholder="VD: Đã hiểu cách cân bằng phương trình phức tạp…"
                  rows={4}
                  autoFocus
                />
              </label>
            </div>
            <footer className="pomo-modal-foot">
              <button
                type="button"
                className="pomo-btn pomo-btn-ghost"
                onClick={() => setNoteModal(false)}
              >
                Bỏ qua
              </button>
              <button
                type="button"
                className="pomo-btn pomo-btn-primary"
                onClick={saveNote}
              >
                <IcoCheck size={15} />
                Lưu ghi chú
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}