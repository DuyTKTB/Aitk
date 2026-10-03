import { useState, useEffect, useRef, useMemo } from 'react';
import { useLocalStorage, dayKey } from '../hooks.js';
import {
  IcoClock, IcoFocus, IcoHourglass, IcoBell, IcoBellOff, IcoStopwatch, IcoGlobe,
  IcoPlay, IcoPause, IcoReset, IcoFlag, IcoPlus, IcoMinus,
  IcoChevUp, IcoChevDown, IcoChevLeft, IcoChevRight,
  IcoExpand, IcoShrink, IcoClose, IcoCheck,
  IcoEdit, IcoDots, IcoSun, IcoMoon, IcoSparkle, IcoTrash,
  IcoSettings, IcoTarget, IcoTrophy, IcoFire,
  IcoVolume, IcoVolumeOff, IcoMusic, IcoWind, IcoLeaf, IcoBook, IcoCoffee,
  IcoStar, IcoHeart, IcoCalendar, IcoFilter, IcoSearch,
  IcoChart, IcoInfo, IcoClipboard, IcoDownload, IcoUpload,
} from './ClockIcons.jsx';
import './clock-hub.css';

const TABS = [
  { id: 'focus',     label: 'Phiên tập trung',  Icon: IcoFocus,      color: '#4d86ff' },
  { id: 'timer',     label: 'Bộ hẹn giờ',        Icon: IcoHourglass,  color: '#22c55e' },
  { id: 'alarm',     label: 'Báo thức',           Icon: IcoBell,       color: '#f59e0b' },
  { id: 'stopwatch', label: 'Đồng hồ bấm giây',  Icon: IcoStopwatch,  color: '#ef4444' },
  { id: 'world',     label: 'Đồng hồ thế giới',  Icon: IcoGlobe,      color: '#8b5cf6' },
  { id: 'music',     label: 'Nhạc tập trung',    Icon: IcoMusic,      color: '#ec4899' },
  { id: 'breathing', label: 'Hít thở',            Icon: IcoWind,       color: '#06b6d4' },
  { id: 'countdown', label: 'Đếm ngược sự kiện', Icon: IcoCalendar,   color: '#10b981' },
  { id: 'sounds',    label: 'Âm thanh',           Icon: IcoVolume,     color: '#a855f7' },
  { id: 'stats',     label: 'Thống kê',           Icon: IcoChart,      color: '#f97316' },
];

const pad = (n) => String(n).padStart(2, '0');

/* ============ ÂM THANH ============ */
let audioCtx = null;
const getCtx = () => {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
};

function beep(freq = 880, dur = 0.15, vol = 0.3, type = 'sine') {
  try {
    const ctx = getCtx();
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

const SOUND_PRESETS = {
  classic: () => { beep(880, 0.15); setTimeout(() => beep(1100, 0.15), 180); setTimeout(() => beep(1320, 0.3), 360); },
  soft:    () => { beep(660, 0.3, 0.2, 'sine'); setTimeout(() => beep(880, 0.4, 0.2), 200); },
  chime:   () => { beep(1047, 0.2); setTimeout(() => beep(1319, 0.2), 150); setTimeout(() => beep(1568, 0.4), 300); },
  bell:    () => { beep(440, 1.0, 0.25, 'triangle'); },
  digital: () => { beep(1200, 0.08, 0.3, 'square'); setTimeout(() => beep(1200, 0.08, 0.3, 'square'), 120); setTimeout(() => beep(1200, 0.08, 0.3, 'square'), 240); },
  none:    () => {},
};

/* ============ NOTIFICATION ============ */
function notify(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try { new Notification(title, { body }); } catch { /* */ }
  }
}

/* ============================================================
   TAB 1: FOCUS — Pomodoro nâng cao
   ============================================================ */
const FOCUS_PRESETS = [
  { name: 'Cổ điển',   focus: 25, short: 5,  long: 15, icon: '🍅' },
  { name: 'Deep Work', focus: 50, short: 10, long: 20, icon: '🧠' },
  { name: 'Sprint',    focus: 90, short: 15, long: 30, icon: '⚡' },
  { name: 'Nhẹ nhàng', focus: 15, short: 3,  long: 10, icon: '🌱' },
];

function FocusTab({ soundPreset }) {
  const [cfg, setCfg] = useLocalStorage('cs-ch-focus-cfg', { focus: 25, short: 5, long: 15 });
  const [mode, setMode] = useState('focus');
  const [left, setLeft] = useState(cfg.focus * 60);
  const [run, setRun] = useState(false);
  const [cycle, setCycle] = useLocalStorage('cs-ch-focus-cycle', 0);
  const [history, setHistory] = useLocalStorage('cs-ch-focus-hist', {});
  const [autoNext, setAutoNext] = useLocalStorage('cs-ch-focus-auto', true);
  const [tasks, setTasks] = useLocalStorage('cs-ch-focus-tasks', []);
  const [taskInput, setTaskInput] = useState('');
  const [noteModal, setNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [notes, setNotes] = useLocalStorage('cs-ch-focus-notes', []);
  const endAt = useRef(0);

  const modes = [
    { key: 'focus', label: 'Tập trung', color: '#4d86ff', Icon: IcoFocus },
    { key: 'short', label: 'Nghỉ ngắn',  color: '#22c55e', Icon: IcoCoffee },
    { key: 'long',  label: 'Nghỉ dài',   color: '#8b5cf6', Icon: IcoMoon },
  ];

  useEffect(() => {
    if (!run) return undefined;
    endAt.current = Date.now() + left * 1000;
    const id = setInterval(() => {
      const l = Math.max(0, Math.round((endAt.current - Date.now()) / 1000));
      setLeft(l);
      if (l === 0) {
        clearInterval(id);
        setRun(false);
        SOUND_PRESETS[soundPreset]?.();
        if (mode === 'focus') {
          const k = dayKey();
          setHistory((h) => ({ ...h, [k]: (h[k] || 0) + 1 }));
          const newCycle = cycle + 1;
          setCycle(newCycle);
          notify('🎉 Hết giờ Focus', 'Nghỉ ngơi nào!');
          setNoteModal(true);
          if (autoNext) {
            const next = newCycle % 4 === 0 ? 'long' : 'short';
            setTimeout(() => { setMode(next); setLeft(cfg[next] * 60); }, 1500);
          }
        } else {
          notify('⏰ Hết giờ nghỉ', 'Quay lại Focus thôi!');
          if (autoNext) setTimeout(() => { setMode('focus'); setLeft(cfg.focus * 60); }, 1500);
        }
      }
    }, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line
  }, [run, mode, cfg, cycle, autoNext, soundPreset]);

  useEffect(() => {
    document.title = run
      ? `${pad(Math.floor(left / 60))}:${pad(left % 60)} — ${modes.find((m) => m.key === mode)?.label}`
      : 'A7 K60 DTA';
  }, [left, run, mode]);

  const pick = (m) => { setRun(false); setMode(m); setLeft(cfg[m] * 60); };
  const reset = () => { setRun(false); setLeft(cfg[mode] * 60); };
  const applyPreset = (p) => {
    setCfg({ focus: p.focus, short: p.short, long: p.long });
    setRun(false); setMode('focus'); setLeft(p.focus * 60);
  };
  const addTask = () => {
    if (!taskInput.trim()) return;
    setTasks([...tasks, { id: Date.now(), text: taskInput.trim(), done: false, pomos: 0 }]);
    setTaskInput('');
  };
  const toggleTask = (id) => setTasks((ts) => ts.map((t) => t.id === id ? { ...t, done: !t.done } : t));
  const incTask = (id) => setTasks((ts) => ts.map((t) => t.id === id ? { ...t, pomos: t.pomos + 1 } : t));
  const delTask = (id) => setTasks((ts) => ts.filter((t) => t.id !== id));
  const saveNote = () => {
    if (noteText.trim()) setNotes((n) => [{ id: Date.now(), text: noteText.trim(), at: new Date().toISOString() }, ...n].slice(0, 20));
    setNoteText(''); setNoteModal(false);
  };

  const total = cfg[mode] * 60;
  const progress = total > 0 ? (total - left) / total : 0;
  const currentMode = modes.find((m) => m.key === mode);
  const R = 130, C = 2 * Math.PI * R;
  const todayN = history[dayKey()] || 0;
  const dailyGoal = 8;
  const goalPct = Math.min(100, (todayN / dailyGoal) * 100);

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

  return (
    <div className="ch-focus-v2">
      {/* Preset row */}
      <div className="ch-focus-presets">
        {FOCUS_PRESETS.map((p) => {
          const on = cfg.focus === p.focus && cfg.short === p.short;
          return (
            <button
              key={p.name}
              type="button"
              className={'ch-preset-chip' + (on ? ' on' : '')}
              onClick={() => applyPreset(p)}
            >
              <span className="ch-preset-emoji">{p.icon}</span>
              <b>{p.name}</b>
              <small>{p.focus}/{p.short}/{p.long}</small>
            </button>
          );
        })}
      </div>

      {/* Mode tabs */}
      <div className="ch-mode-tabs">
        {modes.map((m) => {
          const Icon = m.Icon;
          const on = mode === m.key;
          return (
            <button
              key={m.key}
              type="button"
              className={'ch-mode-tab' + (on ? ' on' : '')}
              style={on ? { '--mode-color': m.color } : undefined}
              onClick={() => pick(m.key)}
            >
              <Icon size={16} />
              <span>{m.label}</span>
              <em>{cfg[m.key]}p</em>
            </button>
          );
        })}
      </div>

      <div className="ch-focus-main">
        {/* Timer ring */}
        <div className="ch-focus-ring-wrap">
          <svg viewBox="0 0 300 300" className="ch-focus-ring-svg">
            <circle cx="150" cy="150" r={R} className="ch-focus-ring-bg" />
            <circle
              cx="150"
              cy="150"
              r={R}
              className="ch-focus-ring-fg"
              style={{
                stroke: currentMode.color,
                strokeDasharray: C,
                strokeDashoffset: C * (1 - progress),
                transform: 'rotate(-90deg)',
                transformOrigin: '150px 150px',
                filter: `drop-shadow(0 0 16px ${currentMode.color})`,
              }}
            />
          </svg>
          <div className="ch-focus-time">
            <b>{pad(Math.floor(left / 60))}:{pad(left % 60)}</b>
            <small>{currentMode.label}</small>
            <em>Chu kỳ {cycle % 4}/4</em>
          </div>
        </div>

        {/* Controls */}
        <div className="ch-focus-controls">
          {run ? (
            <button className="ch-btn-primary ch-btn-lg" onClick={() => setRun(false)}>
              <IcoPause size={20} /> Tạm dừng
            </button>
          ) : (
            <button
              className="ch-btn-primary ch-btn-lg"
              onClick={() => { if (left === 0) setLeft(cfg[mode] * 60); setRun(true); }}
            >
              <IcoPlay size={20} /> Bắt đầu
            </button>
          )}
          <button className="ch-btn-icon-lg" onClick={reset} title="Đặt lại">
            <IcoReset size={18} />
          </button>
        </div>
      </div>

      {/* Daily goal + Stats */}
      <div className="ch-focus-stats">
        <div className="ch-stat-card">
          <div className="ch-stat-icon" style={{ background: 'linear-gradient(135deg, #4d86ff, #8b5cf6)' }}>
            <IcoTarget size={18} />
          </div>
          <div className="ch-stat-body">
            <small>Mục tiêu hôm nay</small>
            <b>{todayN}/{dailyGoal} phiên</b>
            <div className="ch-stat-bar">
              <i style={{ width: `${goalPct}%` }} />
            </div>
          </div>
        </div>
        <div className="ch-stat-card">
          <div className="ch-stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>
            <IcoFire size={18} />
          </div>
          <div className="ch-stat-body">
            <small>Chu kỳ hoàn thành</small>
            <b>{cycle} chu kỳ</b>
            <em>≈ {Math.round(cycle * cfg.focus / 60 * 10) / 10} giờ</em>
          </div>
        </div>
        <div className="ch-stat-card">
          <div className="ch-stat-icon" style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)' }}>
            <IcoTrophy size={18} />
          </div>
          <div className="ch-stat-body">
            <small>Tổng phiên hôm nay</small>
            <b>{todayN * cfg.focus} phút</b>
            <em>{todayN >= dailyGoal ? '🎉 Đạt mục tiêu!' : `Còn ${dailyGoal - todayN} phiên`}</em>
          </div>
        </div>
      </div>

      {/* Chart 7 ngày */}
      <div className="ch-card">
        <header className="ch-card-head">
          <h2><IcoChart size={16} /> 7 ngày gần nhất</h2>
          <span className="ch-badge">Đỉnh {maxN}</span>
        </header>
        <div className="ch-chart">
          {last7.map((d) => {
            const h = maxN > 0 ? (d.n / maxN) * 100 : 0;
            const isGoal = d.n >= dailyGoal;
            const isToday = d.key === dayKey();
            return (
              <div key={d.key} className={'ch-chart-col' + (isToday ? ' today' : '')}>
                <div className="ch-chart-bar-wrap">
                  {isGoal && <span className="ch-chart-crown">👑</span>}
                  <div className={'ch-chart-bar' + (isGoal ? ' goal' : '')} style={{ height: `${Math.max(4, h)}%` }}>
                    {d.n > 0 && <span>{d.n}</span>}
                  </div>
                </div>
                <small>{d.label}</small>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task list */}
      <div className="ch-card">
        <header className="ch-card-head">
          <h2><IcoTarget size={16} /> Task hôm nay</h2>
          <span className="ch-badge">{tasks.filter((t) => !t.done).length}/{tasks.length}</span>
        </header>
        <div className="ch-task-add">
          <input
            type="text"
            placeholder="Thêm task mới…"
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
          />
          <button type="button" className="ch-btn-primary" onClick={addTask} disabled={!taskInput.trim()}>
            <IcoPlus size={16} />
          </button>
        </div>
        {tasks.length === 0 ? (
          <p className="ch-empty">Chưa có task nào. Thêm task để bắt đầu! 🎯</p>
        ) : (
          <ul className="ch-tasks">
            {tasks.map((t) => (
              <li key={t.id} className={'ch-task' + (t.done ? ' done' : '')}>
                <button className="ch-task-check" onClick={() => toggleTask(t.id)}>
                  {t.done && <IcoCheck size={13} />}
                </button>
                <span className="ch-task-text">{t.text}</span>
                <span className="ch-task-pomos">🍅 {t.pomos}</span>
                {!t.done && (
                  <button className="ch-task-inc" onClick={() => incTask(t.id)} title="+1 phiên">
                    <IcoPlus size={12} />
                  </button>
                )}
                <button className="ch-task-del" onClick={() => delTask(t.id)}>
                  <IcoTrash size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Notes */}
      {notes.length > 0 && (
        <div className="ch-card">
          <header className="ch-card-head">
            <h2><IcoClipboard size={16} /> Ghi chú phiên</h2>
            <button className="ch-icon-btn" onClick={() => setNotes([])} title="Xóa tất cả">
              <IcoTrash size={14} />
            </button>
          </header>
          <ul className="ch-notes">
            {notes.map((n) => (
              <li key={n.id}>
                <small>{new Date(n.at).toLocaleString('vi-VN')}</small>
                <p>{n.text}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Note modal */}
      {noteModal && (
        <div className="ch-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setNoteModal(false)}>
          <div className="ch-modal">
            <header className="ch-modal-head">
              <h2><IcoSparkle size={18} /> Ghi chú phiên học</h2>
              <button className="ch-modal-x" onClick={() => setNoteModal(false)}>
                <IcoClose size={16} />
              </button>
            </header>
            <div className="ch-modal-body">
              <p className="ch-modal-hint">Vừa xong 1 phiên Focus! Bạn đã làm được gì?</p>
              <textarea
                autoFocus
                rows={4}
                placeholder="VD: Đã hiểu cách cân bằng phương trình phức tạp…"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />
            </div>
            <footer className="ch-modal-foot">
              <button className="ch-btn-ghost" onClick={() => setNoteModal(false)}>Bỏ qua</button>
              <button className="ch-btn-primary" onClick={saveNote}>
                <IcoCheck size={15} /> Lưu ghi chú
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   TAB 2: TIMER — Đa timer + tùy chỉnh
   ============================================================ */
const DEFAULT_TIMERS = [
  { id: 1, label: 'Pha trà',    total: 60 },
  { id: 2, label: 'Nghỉ mắt',   total: 180 },
  { id: 3, label: 'Nấu mì',     total: 300 },
  { id: 4, label: 'Học nhóm',   total: 600 },
];

function TimerCard({ timer, onRemove }) {
  const [left, setLeft] = useState(timer.total);
  const [run, setRun] = useState(false);
  const [label, setLabel] = useState(timer.label);
  const [editing, setEditing] = useState(false);
  const endAt = useRef(0);

  useEffect(() => {
    if (!run) return undefined;
    endAt.current = Date.now() + left * 1000;
    const id = setInterval(() => {
      const l = Math.max(0, Math.round((endAt.current - Date.now()) / 1000));
      setLeft(l);
      if (l === 0) {
        clearInterval(id);
        setRun(false);
        SOUND_PRESETS.classic();
        notify('⏰ Hết giờ', label);
      }
    }, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line
  }, [run]);

  const reset = () => { setRun(false); setLeft(timer.total); };
  const pct = timer.total > 0 ? (timer.total - left) / timer.total : 0;
  const R = 60, C = 2 * Math.PI * R;

  return (
    <div className="ch-timer-card">
      <header className="ch-timer-head">
        {editing ? (
          <input
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => e.key === 'Enter' && setEditing(false)}
            className="ch-timer-label-input"
          />
        ) : (
          <b onDoubleClick={() => setEditing(true)} title="Double click để sửa">{label}</b>
        )}
        <div className="ch-timer-actions">
          <button className="ch-icon-btn" onClick={() => setEditing(true)} title="Đổi tên">
            <IcoEdit size={13} />
          </button>
          <button className="ch-icon-btn" onClick={onRemove} title="Ẩn">
            <IcoClose size={13} />
          </button>
        </div>
      </header>

      <div className="ch-timer-ring-wrap">
        <svg viewBox="0 0 140 140" className="ch-timer-ring">
          <circle cx="70" cy="70" r={R} className="ch-timer-ring-bg" />
          <circle
            cx="70" cy="70" r={R} className="ch-timer-ring-fg"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - pct)}
            transform="rotate(-90 70 70)"
          />
        </svg>
        <div className="ch-timer-time">
          {pad(Math.floor(left / 3600))}:{pad(Math.floor((left % 3600) / 60))}:{pad(left % 60)}
        </div>
      </div>

      <div className="ch-timer-controls">
        <button
          className={'ch-timer-btn' + (run ? ' active' : '')}
          onClick={() => { if (left === 0) setLeft(timer.total); setRun((r) => !r); }}
        >
          {run ? <IcoPause size={18} /> : <IcoPlay size={18} />}
        </button>
        <button className="ch-timer-btn" onClick={reset}>
          <IcoReset size={18} />
        </button>
        <button className="ch-timer-btn" onClick={() => setLeft((l) => l + 60)}>
          <IcoPlus size={16} />
        </button>
        <button className="ch-timer-btn" onClick={() => setLeft((l) => Math.max(0, l - 60))}>
          <IcoMinus size={16} />
        </button>
      </div>
    </div>
  );
}

function TimerTab() {
  const [customTimers, setCustomTimers] = useLocalStorage('cs-ch-custom-timers', []);
  const [hidden, setHidden] = useState(new Set());
  const [newMin, setNewMin] = useState(5);
  const [newLabel, setNewLabel] = useState('');

  const allTimers = [...DEFAULT_TIMERS, ...customTimers];
  const visible = allTimers.filter((t) => !hidden.has(t.id));

  const addCustom = () => {
    if (!newLabel.trim() || newMin < 1) return;
    const t = { id: Date.now(), label: newLabel.trim(), total: newMin * 60 };
    setCustomTimers([...customTimers, t]);
    setNewLabel(''); setNewMin(5);
  };

  return (
    <div className="ch-timer-v2">
      <div className="ch-card ch-timer-creator">
        <header className="ch-card-head">
          <h2><IcoPlus size={16} /> Tạo timer mới</h2>
        </header>
        <div className="ch-timer-creator-form">
          <input
            type="text"
            placeholder="Tên timer (VD: Đọc sách)"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustom()}
          />
          <div className="ch-timer-creator-min">
            <button onClick={() => setNewMin((m) => Math.max(1, m - 1))}><IcoMinus size={14} /></button>
            <input
              type="number"
              min="1"
              max="180"
              value={newMin}
              onChange={(e) => setNewMin(Math.max(1, Math.min(180, +e.target.value || 1)))}
            />
            <span>phút</span>
            <button onClick={() => setNewMin((m) => Math.min(180, m + 1))}><IcoPlus size={14} /></button>
          </div>
          <button className="ch-btn-primary" onClick={addCustom} disabled={!newLabel.trim()}>
            <IcoPlus size={16} /> Tạo timer
          </button>
        </div>
      </div>

      <div className="ch-timer-grid">
        {visible.map((t) => (
          <TimerCard key={t.id} timer={t} onRemove={() => setHidden((h) => new Set([...h, t.id]))} />
        ))}
        {hidden.size > 0 && (
          <button className="ch-timer-add" onClick={() => setHidden(new Set())}>
            <IcoPlus size={24} />
            <span>Hiện lại tất cả ({hidden.size})</span>
          </button>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   TAB 3: ALARM — Nâng cao với lặp lại, nhãn, snooze
   ============================================================ */
function AlarmTab() {
  const [now, setNow] = useState(new Date());
  const [alarms, setAlarms] = useLocalStorage('cs-ch-alarms', []);
  const [showAdd, setShowAdd] = useState(false);
  const [newTime, setNewTime] = useState('07:00');
  const [newLabel, setNewLabel] = useState('');
  const [newDays, setNewDays] = useState([false, false, false, false, false, false, false]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Check alarms
  useEffect(() => {
    const hhmm = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    alarms.forEach((a) => {
      if (a.time + ':00' === hhmm && a.enabled) {
        SOUND_PRESETS.classic();
        notify('🔔 Báo thức!', a.label || a.time);
      }
    });
  }, [now, alarms]);

  const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  const addAlarm = () => {
    if (!newTime) return;
    setAlarms([...alarms, {
      id: Date.now(),
      time: newTime,
      label: newLabel.trim() || 'Báo thức',
      days: newDays,
      enabled: true,
      snooze: false,
    }]);
    setShowAdd(false);
    setNewTime('07:00'); setNewLabel(''); setNewDays([false, false, false, false, false, false, false]);
  };

  const toggleAlarm = (id) => setAlarms((as) => as.map((a) => a.id === id ? { ...a, enabled: !a.enabled } : a));
  const delAlarm = (id) => setAlarms((as) => as.filter((a) => a.id !== id));

  const nextAlarm = useMemo(() => {
    let closest = null, closestMs = Infinity;
    alarms.forEach((a) => {
      if (!a.enabled) return;
      const [h, m] = a.time.split(':').map(Number);
      const t = new Date();
      t.setHours(h, m, 0, 0);
      if (t <= now) t.setDate(t.getDate() + 1);
      const ms = t - now;
      if (ms < closestMs) { closestMs = ms; closest = { ...a, at: t, ms }; }
    });
    return closest;
  }, [alarms, now]);

  return (
    <div className="ch-alarm-v2">
      <div className="ch-card ch-alarm-hero">
        <div className="ch-alarm-hero-time">
          <b>{pad(now.getHours())}:{pad(now.getMinutes())}</b>
          <small>{pad(now.getSeconds())}</small>
        </div>
        <div className="ch-alarm-hero-date">
          {now.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
        </div>
        {nextAlarm && (
          <div className="ch-alarm-next">
            <IcoBell size={14} />
            <span>Báo thức tiếp theo:</span>
            <b>{nextAlarm.time}</b>
            <em>· {nextAlarm.label} · còn {Math.floor(nextAlarm.ms / 3600000)}h{Math.floor((nextAlarm.ms % 3600000) / 60000)}m</em>
          </div>
        )}
      </div>

      <div className="ch-card">
        <header className="ch-card-head">
          <h2><IcoBell size={16} /> Danh sách báo thức</h2>
          <button className="ch-btn-primary ch-btn-sm" onClick={() => setShowAdd(true)}>
            <IcoPlus size={14} /> Thêm
          </button>
        </header>

        {alarms.length === 0 ? (
          <p className="ch-empty">Chưa có báo thức nào. Nhấn "Thêm" để tạo! ⏰</p>
        ) : (
          <ul className="ch-alarms">
            {alarms.map((a) => (
              <li key={a.id} className={'ch-alarm-item' + (a.enabled ? ' on' : '')}>
                <div className="ch-alarm-item-info">
                  <b className="ch-alarm-item-time">{a.time}</b>
                  <div className="ch-alarm-item-meta">
                    <span>{a.label}</span>
                    {a.days.some((d) => d) && (
                      <small>{a.days.map((d, i) => d ? days[i] : '').filter(Boolean).join(' · ')}</small>
                    )}
                  </div>
                </div>
                <label className="ch-switch ch-switch-sm">
                  <input type="checkbox" checked={a.enabled} onChange={() => toggleAlarm(a.id)} />
                  <span className="ch-switch-slider" />
                </label>
                <button className="ch-alarm-item-del" onClick={() => delAlarm(a.id)}>
                  <IcoTrash size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showAdd && (
        <div className="ch-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="ch-modal">
            <header className="ch-modal-head">
              <h2><IcoBell size={18} /> Thêm báo thức</h2>
              <button className="ch-modal-x" onClick={() => setShowAdd(false)}>
                <IcoClose size={16} />
              </button>
            </header>
            <div className="ch-modal-body">
              <label className="ch-field">
                <span>Giờ báo</span>
                <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} autoFocus />
              </label>
              <label className="ch-field">
                <span>Nhãn</span>
                <input type="text" placeholder="VD: Uống thuốc" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} />
              </label>
              <div className="ch-field">
                <span>Lặp lại</span>
                <div className="ch-days-row">
                  {days.map((d, i) => (
                    <button
                      key={d}
                      type="button"
                      className={'ch-day-btn' + (newDays[i] ? ' on' : '')}
                      onClick={() => setNewDays((ds) => ds.map((x, j) => j === i ? !x : x))}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <footer className="ch-modal-foot">
              <button className="ch-btn-ghost" onClick={() => setShowAdd(false)}>Hủy</button>
              <button className="ch-btn-primary" onClick={addAlarm}>
                <IcoCheck size={15} /> Lưu báo thức
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   TAB 4: STOPWATCH — Có lịch sử, lưu, xuất
   ============================================================ */
function StopwatchTab() {
  const [running, setRunning] = useState(false);
  const [ms, setMs] = useState(0);
  const [laps, setLaps] = useState([]);
  const [saved, setSaved] = useLocalStorage('cs-ch-stopwatch-saved', []);
  const startRef = useRef(0);

  useEffect(() => {
    if (!running) return undefined;
    startRef.current = Date.now() - ms;
    const id = setInterval(() => setMs(Date.now() - startRef.current), 33);
    return () => clearInterval(id);
    // eslint-disable-next-line
  }, [running]);

  const reset = () => { setRunning(false); setMs(0); setLaps([]); };
  const addLap = () => { if (ms > 0) setLaps((l) => [{ n: l.length + 1, time: ms }, ...l]); };

  const fmt = (t) => {
    const h = Math.floor(t / 3600000);
    const m = Math.floor((t % 3600000) / 60000);
    const s = Math.floor((t % 60000) / 1000);
    const c = Math.floor((t % 1000) / 10);
    return `${pad(h)}:${pad(m)}:${pad(s)},${pad(c)}`;
  };

  const saveSession = () => {
    if (ms === 0) return;
    setSaved((s) => [{
      id: Date.now(),
      total: ms,
      laps: laps.length,
      at: new Date().toISOString(),
    }, ...s].slice(0, 10));
  };

  const hh = Math.floor(ms / 3600000);
  const mm = Math.floor((ms % 3600000) / 60000);
  const ss = Math.floor((ms % 60000) / 1000);
  const cs = Math.floor((ms % 1000) / 10);

  const minLap = laps.length > 1 ? Math.min(...laps.map((l, i) => i < laps.length - 1 ? l.time - laps[i + 1].time : l.time)) : 0;
  const maxLap = laps.length > 1 ? Math.max(...laps.map((l, i) => i < laps.length - 1 ? l.time - laps[i + 1].time : l.time)) : 0;

  return (
    <div className="ch-stopwatch-v2">
      <div className="ch-card ch-stopwatch-card">
        <div className="ch-stopwatch-actions-top">
          <button className="ch-icon-btn" onClick={saveSession} disabled={ms === 0} title="Lưu phiên">
            <IcoDownload size={16} />
          </button>
          <button className="ch-icon-btn" title="Toàn màn hình">
            <IcoExpand size={16} />
          </button>
        </div>

        <div className="ch-stopwatch-display">
          <b>{pad(hh)}</b><span>:</span>
          <b>{pad(mm)}</b><span>:</span>
          <b>{pad(ss)}</b><span>,</span>
          <b>{pad(cs)}</b>
        </div>

        <div className="ch-stopwatch-labels">
          <span>giờ</span><span>phút</span><span>giây</span>
        </div>

        <div className="ch-stopwatch-controls">
          <button className={'ch-round-btn ch-round-primary' + (running ? ' active' : '')}
            onClick={() => setRunning((r) => !r)}>
            {running ? <IcoPause size={22} /> : <IcoPlay size={22} />}
          </button>
          <button className="ch-round-btn" onClick={addLap} disabled={!running && ms === 0}>
            <IcoFlag size={20} />
          </button>
          <button className="ch-round-btn" onClick={reset} disabled={ms === 0}>
            <IcoReset size={20} />
          </button>
        </div>
      </div>

      {laps.length > 0 && (
        <div className="ch-card">
          <header className="ch-card-head">
            <h2><IcoFlag size={16} /> Laps ({laps.length})</h2>
            <div className="ch-lap-summary">
              <span>Nhanh: <b style={{ color: '#22c55e' }}>{fmt(minLap)}</b></span>
              <span>Chậm: <b style={{ color: '#ef4444' }}>{fmt(maxLap)}</b></span>
            </div>
          </header>
          <div className="ch-laps">
            <header>
              <span>Lần</span><span>Thời gian</span><span>Chênh</span>
            </header>
            <ul>
              {laps.map((lap, i) => {
                const prev = laps[i + 1];
                const delta = prev ? lap.time - prev.time : lap.time;
                const isMin = delta === minLap && laps.length > 1;
                const isMax = delta === maxLap && laps.length > 1;
                return (
                  <li key={lap.n} className={isMin ? 'lap-min' : isMax ? 'lap-max' : ''}>
                    <span>#{lap.n}</span>
                    <b>{fmt(lap.time)}</b>
                    <em>+{fmt(delta)}</em>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {saved.length > 0 && (
        <div className="ch-card">
          <header className="ch-card-head">
            <h2><IcoClipboard size={16} /> Phiên đã lưu</h2>
            <button className="ch-icon-btn" onClick={() => setSaved([])}>
              <IcoTrash size={14} />
            </button>
          </header>
          <ul className="ch-saved-sessions">
            {saved.map((s) => (
              <li key={s.id}>
                <b>{fmt(s.total)}</b>
                <small>{s.laps} laps · {new Date(s.at).toLocaleString('vi-VN')}</small>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   TAB 5: WORLD CLOCK
   ============================================================ */
const WORLD_CITIES = [
  { name: 'Hà Nội',   tz: 'Asia/Ho_Chi_Minh',    flag: '🇻🇳', local: true },
  { name: 'Tokyo',    tz: 'Asia/Tokyo',          flag: '🇯🇵' },
  { name: 'Singapore', tz: 'Asia/Singapore',     flag: '🇸🇬' },
  { name: 'Seoul',    tz: 'Asia/Seoul',          flag: '🇰🇷' },
  { name: 'Bắc Kinh', tz: 'Asia/Shanghai',       flag: '🇨🇳' },
  { name: 'Dubai',    tz: 'Asia/Dubai',          flag: '🇦🇪' },
  { name: 'Moscow',   tz: 'Europe/Moscow',       flag: '🇷🇺' },
  { name: 'Paris',    tz: 'Europe/Paris',        flag: '🇫🇷' },
  { name: 'London',   tz: 'Europe/London',       flag: '🇬🇧' },
  { name: 'New York', tz: 'America/New_York',    flag: '🇺🇸' },
  { name: 'Redmond',  tz: 'America/Los_Angeles', flag: '🇺🇸' },
  { name: 'Sydney',   tz: 'Australia/Sydney',    flag: '🇦🇺' },
];

function WorldClockTab() {
  const [now, setNow] = useState(new Date());
  const [query, setQuery] = useState('');

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const fmtCity = (tz) => {
    try {
      return new Intl.DateTimeFormat('vi-VN', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(now);
    } catch { return '--:--'; }
  };
  const fmtDay = (tz) => {
    try {
      return new Intl.DateTimeFormat('vi-VN', { timeZone: tz, weekday: 'short', day: '2-digit', month: '2-digit' }).format(now);
    } catch { return ''; }
  };
  const fmtFull = (tz) => {
    try {
      return new Intl.DateTimeFormat('vi-VN', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now);
    } catch { return ''; }
  };

  const filtered = WORLD_CITIES.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="ch-world-v2">
      <div className="ch-world-hero">
        <div className="ch-world-hero-loc">
          <IcoGlobe size={18} />
          <span>Hà Nội · Việt Nam</span>
        </div>
        <div className="ch-world-hero-time">
          <b>{fmtFull('Asia/Ho_Chi_Minh')}</b>
        </div>
        <div className="ch-world-hero-date">
          {now.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
        </div>
      </div>

      <div className="ch-world-search">
        <IcoSearch size={16} />
        <input
          type="text"
          placeholder="Tìm thành phố…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="ch-world-grid">
        {filtered.map((c) => {
          const hour = parseInt(fmtCity(c.tz).split(':')[0], 10);
          const isNight = hour < 6 || hour >= 18;
          return (
            <div key={c.name} className={'ch-world-card' + (c.local ? ' local' : '') + (isNight ? ' night' : '')}>
              <div className="ch-world-card-head">
                <span className="ch-world-flag">{c.flag}</span>
                <b>{c.name}</b>
                {c.local && <span className="ch-world-badge">Bạn</span>}
              </div>
              <div className="ch-world-time">{fmtCity(c.tz)}</div>
              <small className="ch-world-day">{fmtDay(c.tz)}</small>
              <div className="ch-world-bar">
                <i style={{ width: `${(hour / 24) * 100}%` }} />
              </div>
              <span className="ch-world-sun">{isNight ? '🌙' : '☀️'}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   TAB 6: MUSIC — Nhạc tập trung (Web Audio API)
   ============================================================ */
const MUSIC_TRACKS = [
  { id: 'rain',     name: 'Mưa rơi',      icon: '🌧️', desc: 'Tiếng mưa nhẹ nhàng' },
  { id: 'waves',    name: 'Sóng biển',    icon: '🌊', desc: 'Sóng vỗ bờ êm dịu' },
  { id: 'forest',   name: 'Rừng xanh',    icon: '🌲', desc: 'Tiếng chim hót' },
  { id: 'cafe',     name: 'Quán cafe',    icon: '☕', desc: 'Ồn ào nhẹ nhàng' },
  { id: 'fire',     name: 'Lò sưởi',      icon: '🔥', desc: 'Lửa cháy tí tách' },
  { id: 'wind',     name: 'Gió nhẹ',      icon: '🍃', desc: 'Gió thổi vi vu' },
  { id: 'white',    name: 'White noise',  icon: '⚪', desc: 'Tiếng ồn trắng' },
  { id: 'brown',    name: 'Brown noise',  icon: '🟤', desc: 'Tiếng ồn nâu' },
];

function MusicTab() {
  const [playing, setPlaying] = useState(null);
  const [volume, setVolume] = useState(0.3);
  const audioRef = useRef(null);
  const ctxRef = useRef(null);

  const startSound = (id) => {
    stopSound();
    try {
      const ctx = getCtx();
      ctxRef.current = ctx;
      const bufferSize = 2 * ctx.sampleRate;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);

      if (id === 'white') {
        for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
      } else if (id === 'brown') {
        let last = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (last + 0.02 * white) / 1.02;
          last = output[i];
          output[i] *= 3.5;
        }
      } else {
        // Mô phỏng tiếng mưa/sóng/gió bằng noise + filter
        for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const gainNode = ctx.createGain();
      gainNode.gain.value = volume;

      let filter = null;
      if (id === 'rain' || id === 'wind' || id === 'waves') {
        filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = id === 'rain' ? 3000 : id === 'wind' ? 800 : 500;
      } else if (id === 'fire' || id === 'cafe' || id === 'forest') {
        filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = id === 'fire' ? 1000 : id === 'cafe' ? 800 : 2000;
      }

      source.connect(filter || gainNode);
      if (filter) filter.connect(gainNode);
      gainNode.connect(ctx.destination);
      source.start();

      audioRef.current = { source, gain: gainNode };
      setPlaying(id);
    } catch { /* */ }
  };

  const stopSound = () => {
    if (audioRef.current) {
      try { audioRef.current.source.stop(); } catch { /* */ }
      audioRef.current = null;
    }
    setPlaying(null);
  };

  const changeVolume = (v) => {
    setVolume(v);
    if (audioRef.current?.gain) audioRef.current.gain.gain.value = v;
  };

  useEffect(() => () => stopSound(), []);

  return (
    <div className="ch-music-v2">
      <div className="ch-card">
        <header className="ch-card-head">
          <h2><IcoMusic size={16} /> Nhạc tập trung</h2>
          {playing && (
            <button className="ch-btn-primary ch-btn-sm" onClick={stopSound}>
              <IcoClose size={14} /> Dừng
            </button>
          )}
        </header>
        <p className="ch-card-desc">
          Chọn âm thanh để tăng cường tập trung. Sử dụng Web Audio API — không cần tải file.
        </p>

        <div className="ch-volume">
          <IcoVolumeOff size={14} />
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => changeVolume(+e.target.value)}
          />
          <IcoVolume size={14} />
          <span>{Math.round(volume * 100)}%</span>
        </div>

        <div className="ch-music-grid">
          {MUSIC_TRACKS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={'ch-music-card' + (playing === t.id ? ' on' : '')}
              onClick={() => playing === t.id ? stopSound() : startSound(t.id)}
            >
              <span className="ch-music-icon">{t.icon}</span>
              <b>{t.name}</b>
              <small>{t.desc}</small>
              <span className="ch-music-play">
                {playing === t.id ? <IcoPause size={16} /> : <IcoPlay size={16} />}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   TAB 7: BREATHING — Bài tập hít thở 4-7-8
   ============================================================ */
const BREATH_PATTERNS = [
  { id: '478',   name: '4-7-8',       desc: 'Thư giãn sâu',      inhale: 4, hold1: 7, exhale: 8, hold2: 0 },
  { id: 'box',   name: 'Box 4-4-4-4', desc: 'Cân bằng tinh thần', inhale: 4, hold1: 4, exhale: 4, hold2: 4 },
  { id: 'calm',  name: 'Calm 4-0-6',  desc: 'Bình tĩnh',         inhale: 4, hold1: 0, exhale: 6, hold2: 0 },
  { id: 'power', name: 'Power 6-0-2', desc: 'Tăng năng lượng',   inhale: 6, hold1: 0, exhale: 2, hold2: 0 },
];

function BreathingTab() {
  const [pattern, setPattern] = useState(BREATH_PATTERNS[0]);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState('idle'); // idle | inhale | hold1 | exhale | hold2
  const [counter, setCounter] = useState(0);
  const [cycles, setCycles] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!running) return undefined;

    const phases = [
      { name: 'inhale', dur: pattern.inhale },
      { name: 'hold1',  dur: pattern.hold1 },
      { name: 'exhale', dur: pattern.exhale },
      { name: 'hold2',  dur: pattern.hold2 },
    ].filter((p) => p.dur > 0);

    let phaseIdx = 0;
    let count = 0;
    setPhase(phases[0].name);
    setCounter(phases[0].dur);

    timerRef.current = setInterval(() => {
      count++;
      const currentPhase = phases[phaseIdx];
      const remaining = currentPhase.dur - count;

      if (remaining <= 0) {
        phaseIdx = (phaseIdx + 1) % phases.length;
        count = 0;
        if (phaseIdx === 0) setCycles((c) => c + 1);
        setPhase(phases[phaseIdx].name);
        setCounter(phases[phaseIdx].dur);
      } else {
        setCounter(remaining);
      }
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [running, pattern]);

  const stop = () => { setRunning(false); setPhase('idle'); setCounter(0); };
  const start = () => { setCycles(0); setRunning(true); };

  const phaseLabel = {
    idle: 'Sẵn sàng',
    inhale: 'Hít vào',
    hold1: 'Giữ',
    exhale: 'Thở ra',
    hold2: 'Giữ',
  }[phase];

  const phaseColor = {
    idle: '#94a3b8',
    inhale: '#4d86ff',
    hold1: '#8b5cf6',
    exhale: '#22c55e',
    hold2: '#f59e0b',
  }[phase];

  const scale = phase === 'inhale' ? 1.4 : phase === 'exhale' ? 0.7 : 1.0;

  return (
    <div className="ch-breathing-v2">
      <div className="ch-card">
        <header className="ch-card-head">
          <h2><IcoWind size={16} /> Bài tập hít thở</h2>
          <span className="ch-badge">{cycles} chu kỳ</span>
        </header>

        <div className="ch-breath-patterns">
          {BREATH_PATTERNS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={'ch-breath-pattern' + (pattern.id === p.id ? ' on' : '')}
              onClick={() => { setPattern(p); stop(); }}
            >
              <b>{p.name}</b>
              <small>{p.desc}</small>
            </button>
          ))}
        </div>

        <div className="ch-breath-stage">
          <div
            className={'ch-breath-circle' + (running ? ' animating' : '')}
            style={{
              transform: `scale(${running ? scale : 1})`,
              background: `radial-gradient(circle, ${phaseColor}40, ${phaseColor}10)`,
              borderColor: phaseColor,
              boxShadow: `0 0 60px ${phaseColor}60`,
            }}
          >
            <b style={{ color: phaseColor }}>{running ? counter : pattern.inhale}</b>
            <small>{running ? phaseLabel : 'Bắt đầu'}</small>
          </div>
        </div>

        <div className="ch-breath-controls">
          {running ? (
            <button className="ch-btn-primary ch-btn-lg" onClick={stop}>
              <IcoPause size={18} /> Dừng
            </button>
          ) : (
            <button className="ch-btn-primary ch-btn-lg" onClick={start}>
              <IcoPlay size={18} /> Bắt đầu
            </button>
          )}
        </div>

        <div className="ch-breath-info">
          <p>💡 <b>Hít vào</b> {pattern.inhale}s → {pattern.hold1 > 0 && <><b>Giữ</b> {pattern.hold1}s → </>}<b>Thở ra</b> {pattern.exhale}s{pattern.hold2 > 0 && <> → <b>Giữ</b> {pattern.hold2}s</>}</p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   TAB 8: COUNTDOWN — Đếm ngược đến sự kiện
   ============================================================ */
const DEFAULT_EVENTS = [
  { id: 1, name: 'Thi giữa kỳ Hóa', date: new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10), icon: '📝', color: '#ef4444' },
  { id: 2, name: 'Thi cuối kỳ',      date: new Date(Date.now() + 60 * 864e5).toISOString().slice(0, 10), icon: '🎓', color: '#8b5cf6' },
  { id: 3, name: 'Tết Nguyên Đán',   date: `${new Date().getFullYear() + 1}-01-29`, icon: '🧧', color: '#f59e0b' },
];

function CountdownTab() {
  const [events, setEvents] = useLocalStorage('cs-ch-events', DEFAULT_EVENTS);
  const [now, setNow] = useState(Date.now());
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [icon, setIcon] = useState('🎯');

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const addEvent = () => {
    if (!name.trim() || !date) return;
    setEvents([...events, { id: Date.now(), name: name.trim(), date, icon, color: '#4d86ff' }]);
    setName(''); setDate(''); setIcon('🎯'); setShowAdd(false);
  };

  const delEvent = (id) => setEvents((es) => es.filter((e) => e.id !== id));

  const calcDiff = (dateStr) => {
    const target = new Date(dateStr + 'T00:00:00');
    const diff = target - now;
    if (diff < 0) return { past: true, days: 0, hours: 0, min: 0, sec: 0 };
    const days = Math.floor(diff / 864e5);
    const hours = Math.floor((diff % 864e5) / 36e5);
    const min = Math.floor((diff % 36e5) / 6e4);
    const sec = Math.floor((diff % 6e4) / 1000);
    return { past: false, days, hours, min, sec };
  };

  const EMOJIS = ['🎯', '📝', '🎓', '🧧', '🎂', '✈️', '💍', '🏆', '📅', '❤️'];

  return (
    <div className="ch-countdown-v2">
      <div className="ch-card">
        <header className="ch-card-head">
          <h2><IcoCalendar size={16} /> Đếm ngược sự kiện</h2>
          <button className="ch-btn-primary ch-btn-sm" onClick={() => setShowAdd(true)}>
            <IcoPlus size={14} /> Thêm
          </button>
        </header>

        {events.length === 0 ? (
          <p className="ch-empty">Chưa có sự kiện nào. Nhấn "Thêm" để tạo! 📅</p>
        ) : (
          <div className="ch-events-grid">
            {events.map((e) => {
              const d = calcDiff(e.date);
              return (
                <div key={e.id} className="ch-event-card" style={{ '--event-color': e.color }}>
                  <button className="ch-event-del" onClick={() => delEvent(e.id)}>
                    <IcoTrash size={13} />
                  </button>
                  <span className="ch-event-icon">{e.icon}</span>
                  <h3>{e.name}</h3>
                  <small className="ch-event-date">
                    {new Date(e.date).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                  </small>
                  {d.past ? (
                    <div className="ch-event-past">Đã qua 🎉</div>
                  ) : (
                    <div className="ch-event-countdown">
                      <div className="ch-event-num">
                        <b>{d.days}</b><small>ngày</small>
                      </div>
                      <div className="ch-event-num">
                        <b>{pad(d.hours)}</b><small>giờ</small>
                      </div>
                      <div className="ch-event-num">
                        <b>{pad(d.min)}</b><small>phút</small>
                      </div>
                      <div className="ch-event-num">
                        <b>{pad(d.sec)}</b><small>giây</small>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAdd && (
        <div className="ch-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="ch-modal">
            <header className="ch-modal-head">
              <h2><IcoCalendar size={18} /> Thêm sự kiện</h2>
              <button className="ch-modal-x" onClick={() => setShowAdd(false)}>
                <IcoClose size={16} />
              </button>
            </header>
            <div className="ch-modal-body">
              <label className="ch-field">
                <span>Tên sự kiện</span>
                <input type="text" placeholder="VD: Thi cuối kỳ" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
              </label>
              <label className="ch-field">
                <span>Ngày</span>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </label>
              <div className="ch-field">
                <span>Icon</span>
                <div className="ch-emoji-picker">
                  {EMOJIS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      className={'ch-emoji-btn' + (icon === em ? ' on' : '')}
                      onClick={() => setIcon(em)}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <footer className="ch-modal-foot">
              <button className="ch-btn-ghost" onClick={() => setShowAdd(false)}>Hủy</button>
              <button className="ch-btn-primary" onClick={addEvent} disabled={!name.trim() || !date}>
                <IcoCheck size={15} /> Lưu
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   TAB 9: SOUNDS — Chọn âm thanh + Test
   ============================================================ */
const SOUND_OPTIONS = [
  { id: 'classic', name: 'Cổ điển',      icon: '🔔', desc: '3 nốt tăng dần' },
  { id: 'soft',    name: 'Nhẹ nhàng',    icon: '🎵', desc: '2 nốt êm dịu' },
  { id: 'chime',   name: 'Chuông gió',   icon: '🎐', desc: '3 nốt cao' },
  { id: 'bell',    name: 'Chuông',       icon: '🔕', desc: 'Nốt dài trầm' },
  { id: 'digital', name: 'Digital',      icon: '⏰', desc: '3 tiếng bíp' },
  { id: 'none',    name: 'Không',        icon: '🔇', desc: 'Im lặng' },
];

function SoundsTab({ soundPreset, setSoundPreset }) {
  return (
    <div className="ch-sounds-v2">
      <div className="ch-card">
        <header className="ch-card-head">
          <h2><IcoVolume size={16} /> Chọn âm thanh hết giờ</h2>
        </header>
        <p className="ch-card-desc">
          Âm thanh sẽ phát khi timer/báo thức/pomodoro kết thúc. Nhấn vào để nghe thử.
        </p>

        <div className="ch-sounds-grid">
          {SOUND_OPTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={'ch-sound-card' + (soundPreset === s.id ? ' on' : '')}
              onClick={() => { setSoundPreset(s.id); SOUND_PRESETS[s.id]?.(); }}
            >
              <span className="ch-sound-icon">{s.icon}</span>
              <b>{s.name}</b>
              <small>{s.desc}</small>
              {soundPreset === s.id && <span className="ch-sound-check"><IcoCheck size={14} /></span>}
            </button>
          ))}
        </div>
      </div>

      <div className="ch-card">
        <header className="ch-card-head">
          <h2><IcoInfo size={16} /> Thông tin</h2>
        </header>
        <ul className="ch-info-list">
          <li>🔔 Âm thanh được tạo bằng Web Audio API — không cần tải file</li>
          <li>💾 Lựa chọn được lưu vào localStorage</li>
          <li>🔕 Chọn "Không" nếu bạn muốn im lặng</li>
          <li>🎧 Bật âm lượng thiết bị trước khi nghe thử</li>
        </ul>
      </div>
    </div>
  );
}

/* ============================================================
   TAB 10: STATS — Thống kê tổng hợp
   ============================================================ */
function StatsTab() {
  const [focusHist] = useLocalStorage('cs-ch-focus-hist', {});
  const [stopSaved] = useLocalStorage('cs-ch-stopwatch-saved', []);
  const [alarms] = useLocalStorage('cs-ch-alarms', []);
  const [events] = useLocalStorage('cs-ch-events', DEFAULT_EVENTS);

  const last30 = useMemo(() => {
    const arr = [];
    for (let i = 29; i >= 0; i--) {
      const k = dayKey(Date.now() - i * 864e5);
      arr.push({ key: k, n: focusHist[k] || 0 });
    }
    return arr;
  }, [focusHist]);

  const totalSessions = Object.values(focusHist).reduce((a, b) => a + b, 0);
  const maxN = Math.max(1, ...last30.map((d) => d.n));
  const totalStopwatch = stopSaved.reduce((a, s) => a + s.total, 0);

  const fmtTime = (ms) => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return `${h}h ${m}m`;
  };

  return (
    <div className="ch-stats-v2">
      <div className="ch-stats-grid">
        <div className="ch-stat-big">
          <div className="ch-stat-big-icon" style={{ background: 'linear-gradient(135deg, #4d86ff, #8b5cf6)' }}>
            <IcoFocus size={22} />
          </div>
          <b>{totalSessions}</b>
          <small>Phiên tập trung</small>
        </div>
        <div className="ch-stat-big">
          <div className="ch-stat-big-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>
            <IcoStopwatch size={22} />
          </div>
          <b>{fmtTime(totalStopwatch)}</b>
          <small>Bấm giây</small>
        </div>
        <div className="ch-stat-big">
          <div className="ch-stat-big-icon" style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)' }}>
            <IcoBell size={22} />
          </div>
          <b>{alarms.length}</b>
          <small>Báo thức</small>
        </div>
        <div className="ch-stat-big">
          <div className="ch-stat-big-icon" style={{ background: 'linear-gradient(135deg, #ec4899, #a855f7)' }}>
            <IcoCalendar size={22} />
          </div>
          <b>{events.length}</b>
          <small>Sự kiện</small>
        </div>
      </div>

      <div className="ch-card">
        <header className="ch-card-head">
          <h2><IcoChart size={16} /> 30 ngày gần nhất</h2>
          <span className="ch-badge">Đỉnh {maxN}</span>
        </header>
        <div className="ch-chart-30">
          {last30.map((d) => {
            const h = maxN > 0 ? (d.n / maxN) * 100 : 0;
            return (
              <div key={d.key} className="ch-chart-30-col" title={`${d.key}: ${d.n} phiên`}>
                <div className="ch-chart-30-bar" style={{ height: `${Math.max(2, h)}%` }} />
              </div>
            );
          })}
        </div>
        <div className="ch-chart-30-labels">
          <span>30 ngày trước</span>
          <span>Hôm nay</span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MAIN CLOCK HUB
   ============================================================ */
export default function ClockHub() {
  const [tab, setTab] = useLocalStorage('cs-ch-tab', 'focus');
  const [collapsed, setCollapsed] = useState(false);
  const [zen, setZen] = useState(false);
  const [now, setNow] = useState(new Date());
  const [soundPreset, setSoundPreset] = useLocalStorage('cs-ch-sound-preset', 'classic');

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const currentTab = TABS.find((t) => t.id === tab) || TABS[0];

  const renderTab = () => {
    switch (tab) {
      case 'focus':     return <FocusTab soundPreset={soundPreset} />;
      case 'timer':     return <TimerTab />;
      case 'alarm':     return <AlarmTab />;
      case 'stopwatch': return <StopwatchTab />;
      case 'world':     return <WorldClockTab />;
      case 'music':     return <MusicTab />;
      case 'breathing': return <BreathingTab />;
      case 'countdown': return <CountdownTab />;
      case 'sounds':    return <SoundsTab soundPreset={soundPreset} setSoundPreset={setSoundPreset} />;
      case 'stats':     return <StatsTab />;
      default:          return <FocusTab soundPreset={soundPreset} />;
    }
  };

  return (
    <div className={'ch' + (zen ? ' zen' : '')} style={{ '--tab-color': currentTab.color }}>
      {!zen && (
        <aside className={'ch-side' + (collapsed ? ' collapsed' : '')}>
          <div className="ch-side-top">
            <div className="ch-side-brand">
              <span className="ch-side-logo">
                <IcoClock size={20} />
              </span>
              {!collapsed && (
                <div className="ch-side-brand-txt">
                  <b>Clock Hub</b>
                  <small>Đồng hồ tổng hợp</small>
                </div>
              )}
            </div>
            <button className="ch-side-collapse" onClick={() => setCollapsed((c) => !c)}>
              {collapsed ? <IcoChevRight size={14} /> : <IcoChevLeft size={14} />}
            </button>
          </div>

          <nav className="ch-side-nav">
            {TABS.map((t) => {
              const Icon = t.Icon;
              const on = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  className={'ch-side-item' + (on ? ' on' : '')}
                  style={on ? { '--item-color': t.color } : undefined}
                  onClick={() => setTab(t.id)}
                  title={t.label}
                >
                  <span className="ch-side-item-ico"><Icon size={18} /></span>
                  {!collapsed && <span className="ch-side-item-txt">{t.label}</span>}
                </button>
              );
            })}
          </nav>

          <div className="ch-side-foot">
            <div className="ch-side-clock">
              <b>{pad(now.getHours())}:{pad(now.getMinutes())}</b>
              <small>{pad(now.getSeconds())}</small>
            </div>
            {!collapsed && (
              <p className="ch-side-foot-lbl">
                {now.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })}
              </p>
            )}
          </div>
        </aside>
      )}

      <main className="ch-main">
        <header className="ch-main-head">
          <div className="ch-main-head-l">
            <h1 className="ch-main-title">
              <currentTab.Icon size={20} />
              {currentTab.label}
            </h1>
            <p className="ch-main-sub">
              {now.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>

          <div className="ch-main-head-r">
            <button className="ch-icon-btn" onClick={() => setZen((z) => !z)} title="Toàn màn hình">
              {zen ? <IcoShrink size={16} /> : <IcoExpand size={16} />}
            </button>
          </div>
        </header>

        <div className="ch-content">
          {renderTab()}
        </div>
      </main>
    </div>
  );
}