import { useState, useEffect, useRef, useMemo } from 'react';
import { useLocalStorage, studyToday, dayKey } from '../hooks.js';

const MODES = [
  { key: 'focus', label: 'Focus', color: 'var(--acc)' },
  { key: 'short', label: 'Nghỉ ngắn', color: 'var(--metalloid)' },
  { key: 'long', label: 'Nghỉ dài', color: 'var(--noble)' },
];

const PRESETS = [
  { name: '25/5/15', focus: 25, short: 5, long: 15, desc: 'Cổ điển' },
  { name: '50/10/20', focus: 50, short: 10, long: 20, desc: 'Deep work' },
  { name: '15/3/10', focus: 15, short: 3, long: 10, desc: 'Nhẹ nhàng' },
];

const pad = (n) => String(n).padStart(2, '0');
function beep(freq = 880, dur = 0.15, vol = 0.3) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.value = vol;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.stop(ctx.currentTime + dur);
  } catch {}
}

function playDoneSound() {
  beep(880, 0.15);
  setTimeout(() => beep(1100, 0.15), 180);
  setTimeout(() => beep(1320, 0.3), 360);
}

function playTick() {
  beep(660, 0.05, 0.1);
}

export default function Pomodoro() {
  const [cfg, setCfg] = useLocalStorage('cs-pomodoro', { focus: 25, short: 5, long: 15 });
  const [sessions, setSessions] = useLocalStorage('cs-sessions', 0);
  const [history, setHistory] = useLocalStorage('cs-pomo-history', {});
  const [, setStreak] = useLocalStorage('cs-streak', { last: '', n: 0, total: 0 });
  const [notify, setNotify] = useLocalStorage('cs-pomo-notify', false);
  const [sound, setSound] = useLocalStorage('cs-pomo-sound', true);
  const [autoNext, setAutoNext] = useLocalStorage('cs-pomo-autonext', true);
  const [zen, setZen] = useState(false);

  const [mode, setMode] = useState('focus');
  const [left, setLeft] = useState(cfg.focus * 60);
  const [run, setRun] = useState(false);
  const [doneMsg, setDoneMsg] = useState('');
  const [cycleCount, setCycleCount] = useState(0); // số phiên focus trong chu kỳ hiện tại

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
      try { new Notification(title, { body, icon: '/favicon.ico' }); } catch {}
    }
  };
  useEffect(() => {
    if (!run) return;
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
          setDoneMsg(`✓ Hoàn thành 1 phiên Focus! Nghỉ ${next === 'long' ? 'dài' : 'ngắn'} thôi.`);
          notifyUser('🎉 Hết giờ Focus', 'Nghỉ ngơi nào!');
          if (autoNext) {
            setTimeout(() => {
              setMode(next);
              setLeft(cfg[next] * 60);
            }, 1500);
          }
        } else {
          setDoneMsg('✓ Hết giờ nghỉ! Quay lại Focus nào.');
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
  }, [run]);
  useEffect(() => {
    if (run) {
      document.title = `${pad(Math.floor(left / 60))}:${pad(left % 60)} — ${MODES.find(m => m.key === mode).label}`;
    } else {
      document.title = 'A7 K60 DTA — bycode Duy TK';
    }
    return () => { document.title = 'A7 K60 DTA — bycode Duy TK'; };
  }, [left, run, mode]);
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
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [left, mode, cfg]);

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
  };
  const total = cfg[mode] * 60;
  const progress = total > 0 ? (total - left) / total : 0;
  const R = 120;
  const C = 2 * Math.PI * R;
  const dash = C * (1 - progress);
  const last7 = useMemo(() => {
    const arr = [];
    for (let i = 6; i >= 0; i--) {
      const k = dayKey(Date.now() - i * 864e5);
      arr.push({ key: k, n: history[k] || 0, label: new Date(k).toLocaleDateString('vi-VN', { weekday: 'short' }) });
    }
    return arr;
  }, [history]);
  const maxN = Math.max(1, ...last7.map((d) => d.n));
  const todayN = history[dayKey()] || 0;

  return (
    <section className={'wrap narrow' + (zen ? ' zen' : '')}>
      <h1>Pomodoro</h1>

      {!zen && (
        <>
          <div className="tabs" role="tablist">
            {MODES.map((m) => (
              <button
                key={m.key}
                role="tab"
                aria-selected={mode === m.key}
                className={'chip' + (mode === m.key ? ' on' : '')}
                onClick={() => pick(m.key)}
              >
                {m.label}
              </button>
            ))}
            <button className="chip" onClick={() => setZen(true)} title="Focus mode">⛶</button>
          </div>
        </>
      )}

      {/* Đồng hồ vòng tròn */}
      <div className="pomo-ring-wrap">
        <svg viewBox="0 0 280 280" className="pomo-ring" aria-hidden="true">
          <circle cx="140" cy="140" r={R} className="ring-bg" />
          <circle
            cx="140" cy="140" r={R}
            className="ring-fg"
            style={{
              stroke: MODES.find((m) => m.key === mode).color,
              strokeDasharray: C,
              strokeDashoffset: dash,
              transform: 'rotate(-90deg)',
              transformOrigin: '140px 140px',
            }}
          />
        </svg>
        <div className="pomo-time" role="timer" aria-live="off">
          <b>{pad(Math.floor(left / 60))}:{pad(left % 60)}</b>
          <small>{MODES.find((m) => m.key === mode).label}</small>
        </div>
      </div>

      <div className="row center">
        {run ? (
          <button className="btn primary big" onClick={() => setRun(false)}>
            ⏸ TẠM DỪNG
          </button>
        ) : (
          <button
            className="btn primary big"
            onClick={() => {
              setDoneMsg('');
              if (left === 0) setLeft(cfg[mode] * 60);
              setRun(true);
            }}
          >
            ▶ BẮT ĐẦU
          </button>
        )}
        <button className="btn" onClick={reset}>↺ ĐẶT LẠI</button>
        {zen && <button className="btn" onClick={() => setZen(false)}>THOÁT ⛶</button>}
      </div>

      {doneMsg && (
        <p className="done big-done" role="status">
          {doneMsg}
        </p>
      )}

      {!zen && (
        <>
          <p className="hint center">
            Phiên Focus hôm nay: <b>{todayN}</b> · Tổng: <b>{sessions}</b> · Chu kỳ: <b>{cycleCount % 4}/4</b>
          </p>

          {/* Mini bar chart 7 ngày */}
          <div className="card">
            <h3>📊 7 ngày gần nhất</h3>
            <div className="bar7">
              {last7.map((d) => (
                <div key={d.key} className="bar7-col" title={`${d.key}: ${d.n} phiên`}>
                  <div className="bar7-fill" style={{ height: `${(d.n / maxN) * 100}%` }}>
                    {d.n > 0 && <span>{d.n}</span>}
                  </div>
                  <small>{d.label}</small>
                </div>
              ))}
            </div>
          </div>

          {/* Presets */}
          <div className="card" style={{ marginTop: '1rem' }}>
            <h3>⚡ Mẫu nhanh</h3>
            <div className="row">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  className="chip"
                  onClick={() => applyPreset(p)}
                  title={p.desc}
                >
                  {p.name} — {p.desc}
                </button>
              ))}
            </div>
          </div>

          {/* Cấu hình */}
          <div className="card settings" style={{ marginTop: '1rem' }}>
            {MODES.map((m) => (
              <label key={m.key}>
                {m.label} (phút)
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={cfg[m.key]}
                  onChange={(e) => update(m.key, e.target.value)}
                />
              </label>
            ))}
          </div>

          <div className="card" style={{ marginTop: '1rem' }}>
            <h3>⚙️ Tuỳ chọn</h3>
            <label className="switch-row">
              <input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} />
              <span> Âm thanh khi hết giờ</span>
            </label>
            <label className="switch-row">
              <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
              <span> Thông báo desktop</span>
            </label>
            <label className="switch-row">
              <input type="checkbox" checked={autoNext} onChange={(e) => setAutoNext(e.target.checked)} />
              <span> Tự động chuyển chế độ</span>
            </label>
          </div>

          <p className="hint center" style={{ marginTop: '1rem' }}>
            💡 Nhấn <kbd>Space</kbd> để start/pause · <kbd>⛶</kbd> để vào chế độ tập trung
          </p>
        </>
      )}
    </section>
  );
}