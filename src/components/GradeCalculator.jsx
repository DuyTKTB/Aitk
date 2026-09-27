import { useState, useMemo } from 'react';
import { useLocalStorage } from '../hooks.js';

const GROUPS = [
  { key: 'tx', label: 'Điểm thường xuyên (TX)' },
  { key: 'gk', label: 'Điểm giữa kỳ (GK)' },
  { key: 'ck', label: 'Điểm cuối kỳ (CK)' },
];

const PRESETS = [
  { name: '1/2/3', w: { tx: 1, gk: 2, ck: 3 }, desc: 'Phổ biến' },
  { name: '1/1/2', w: { tx: 1, gk: 1, ck: 2 }, desc: 'Một số trường' },
  { name: '1/2/2', w: { tx: 1, gk: 2, ck: 2 }, desc: 'THPT mới' },
  { name: '1/1/3', w: { tx: 1, gk: 1, ck: 3 } },
];

const RANKS = [
  { min: 9.0, label: 'Xuất sắc', color: 'var(--post)', gpa: 4.0 },
  { min: 8.0, label: 'Giỏi', color: 'var(--metalloid)', gpa: 3.5 },
  { min: 6.5, label: 'Khá', color: 'var(--transition)', gpa: 3.0 },
  { min: 5.0, label: 'Trung bình', color: 'var(--alkaline)', gpa: 2.0 },
  { min: 3.5, label: 'Yếu', color: 'var(--alkali)', gpa: 1.0 },
  { min: 0, label: 'Kém', color: 'var(--actinide)', gpa: 0 },
];

function rankOf(score) {
  return RANKS.find((r) => score >= r.min) || RANKS[RANKS.length - 1];
}

export default function GradeCalculator() {
  const [s, setS] = useLocalStorage('cs-grade', {
    tx: [''], gk: [''], ck: [''],
    w: { tx: 1, gk: 2, ck: 3 },
  });
  const [history, setHistory] = useLocalStorage('cs-grade-history', []);
  const [subject, setSubject] = useState('');

  const setScore = (k, i, v) => setS({ ...s, [k]: s[k].map((x, j) => (j === i ? v : x)) });
  const add = (k) => setS({ ...s, [k]: [...s[k], ''] });
  const del = (k, i) => setS({ ...s, [k]: s[k].length > 1 ? s[k].filter((_, j) => j !== i) : [''] });
  const setW = (k, v) => setS({ ...s, w: { ...s.w, [k]: v } });
  const applyPreset = (p) => setS({ ...s, w: { ...p.w } });

  const result = useMemo(() => {
    let sum = 0, weight = 0;
    for (const { key } of GROUPS) {
      const w = Number(s.w[key]) || 0;
      for (const v of s[key]) {
        const n = parseFloat(v);
        if (!isNaN(n) && n >= 0 && n <= 10) { sum += n * w; weight += w; }
      }
    }
    const score = weight > 0 ? sum / weight : null;
    return { score, weight };
  }, [s]);

  const displayScore = result.score !== null ? (Math.round(result.score * 10) / 10).toFixed(1) : '—';
  const rank = result.score !== null ? rankOf(result.score) : null;
  const formula = GROUPS.map((g) => `${g.key.toUpperCase()}×${s.w[g.key] || 0}`).join(' + ');

  const saveHistory = () => {
    if (result.score === null) return;
    const item = {
      id: Date.now().toString(36),
      subject: subject.trim() || 'Không tên',
      score: result.score,
      rank: rank.label,
      date: new Date().toLocaleDateString('vi-VN'),
      detail: { ...s },
    };
    setHistory([item, ...history].slice(0, 20));
  };

  const deleteHistory = (id) => setHistory(history.filter((x) => x.id !== id));

  return (
    <section className="wrap narrow">
      <h1>Tính điểm tổng kết</h1>

      <div className="card">
        <label>
          Tên môn (để lưu lịch sử)
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Hóa học, Toán..." />
        </label>

        {/* Presets hệ số */}
        <div className="row" style={{ marginTop: '.6rem' }}>
          <small className="hint" style={{ marginRight: '.4rem' }}>Hệ số:</small>
          {PRESETS.map((p) => (
            <button
              key={p.name}
              className={
                'chip' +
                (s.w.tx === p.w.tx && s.w.gk === p.w.gk && s.w.ck === p.w.ck ? ' on' : '')
              }
              onClick={() => applyPreset(p)}
              title={p.desc}
            >
              {p.name}
            </button>
          ))}
        </div>

        {GROUPS.map(({ key, label }) => (
          <fieldset key={key}>
            <legend>{label}</legend>
            <label className="wlab">
              Hệ số
              <input
                type="number"
                min="0"
                step="0.5"
                value={s.w[key]}
                onChange={(e) => setW(key, e.target.value)}
                aria-label={`Hệ số ${key.toUpperCase()}`}
              />
            </label>
            <div className="scores">
              {s[key].map((v, i) => (
                <span key={i} className="score">
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    inputMode="decimal"
                    value={v}
                    placeholder="0–10"
                    onChange={(e) => setScore(key, i, e.target.value)}
                    aria-label={`${label} ${i + 1}`}
                  />
                  <button className="x" onClick={() => del(key, i)} aria-label="Xóa điểm">×</button>
                </span>
              ))}
              <button className="btn sm" onClick={() => add(key)}>+ Thêm điểm</button>
            </div>
          </fieldset>
        ))}
      </div>

      {/* Result */}
      <div className="grade-result card" style={{ marginTop: '1.5rem' }}>
        <div className="grade-big">
          <span>ĐIỂM TỔNG KẾT</span>
          <b style={{ color: rank ? rank.color : 'var(--mut)' }}>{displayScore}</b>
          <small>({formula}) / tổng hệ số của các điểm đã nhập</small>
        </div>
        {rank && (
          <div className="grade-rank" style={{ background: rank.color }}>
            <b>{rank.label}</b>
            <span>GPA: {rank.gpa.toFixed(1)} / 4.0</span>
          </div>
        )}
        <button className="btn" onClick={saveHistory} disabled={result.score === null} style={{ marginTop: '.8rem' }}>
          💾 Lưu vào lịch sử
        </button>
      </div>

      {/* Target */}
      <Target s={s} current={result.score} />

      {/* Simulation */}
      <Simulation s={s} />

      {/* History */}
      {history.length > 0 && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h3>📚 Lịch sử tính điểm</h3>
          <ul className="history-list">
            {history.map((h) => (
              <li key={h.id}>
                <div>
                  <b>{h.subject}</b>
                  <small> · {h.date}</small>
                </div>
                <div className="row">
                  <span className="badge">{h.score.toFixed(1)} — {h.rank}</span>
                  <button className="x" onClick={() => deleteHistory(h.id)} aria-label="Xóa">×</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function Target({ s, current }) {
  const [t, setT] = useState('8');
  const target = parseFloat(t) || 0;

  const result = useMemo(() => {
    let sum = 0, w = 0;
    for (const k of ['tx', 'gk']) {
      const wk = Number(s.w[k]) || 0;
      for (const v of s[k]) { const n = parseFloat(v); if (!isNaN(n) && n >= 0 && n <= 10) { sum += n * wk; w += wk; } }
    }
    const wc = Number(s.w.ck) || 0;
    const need = wc > 0 ? (target * (w + wc) - sum) / wc : NaN;
    return { need, w, wc };
  }, [s, target]);

  const need = result.need;

  return (
    <div className="card" style={{ marginTop: '1.5rem' }}>
      <h3>🎯 Mục tiêu điểm tổng kết</h3>
      <label style={{ marginBottom: '.6rem' }}>
        Muốn đạt
        <input type="number" min="0" max="10" step="0.1" value={t} onChange={(e) => setT(e.target.value)} />
      </label>
      <p className="result" role="status">
        <span>ĐIỂM CK TỐI THIỂU CẦN ĐẠT</span>
        <b>{isNaN(need) ? '—' : need <= 0 ? '≤ 0' : need > 10 ? '>10' : need.toFixed(2)}</b>
        <small>
          {need > 10
            ? '❌ Không thể đạt mục tiêu với điểm TX/GK hiện tại'
            : need <= 0
              ? '✅ Bạn đã đạt mục tiêu'
              : '💪 Dựa trên điểm TX, GK đã nhập'}
        </small>
      </p>
    </div>
  );
}

function Simulation({ s }) {
  const [ck, setCk] = useState('8');
  const ckVal = parseFloat(ck) || 0;

  const score = useMemo(() => {
    let sum = 0, w = 0;
    for (const k of ['tx', 'gk']) {
      const wk = Number(s.w[k]) || 0;
      for (const v of s[k]) { const n = parseFloat(v); if (!isNaN(n) && n >= 0 && n <= 10) { sum += n * wk; w += wk; } }
    }
    const wc = Number(s.w.ck) || 0;
    if (wc > 0 && w + wc > 0) {
      sum += ckVal * wc;
      w += wc;
    }
    return w > 0 ? sum / w : null;
  }, [s, ckVal]);

  const rank = score !== null ? rankOf(score) : null;

  return (
    <div className="card" style={{ marginTop: '1.5rem' }}>
      <h3>🔮 Mô phỏng: Nếu CK = ?</h3>
      <label>
        Điểm CK giả định
        <input type="number" min="0" max="10" step="0.1" value={ck} onChange={(e) => setCk(e.target.value)} />
      </label>
      {score !== null && (
        <p className="result" role="status">
          <span>TỔNG KẾT DỰ KIẾN</span>
          <b style={{ color: rank?.color }}>{score.toFixed(1)}</b>
          <small>Xếp loại: {rank?.label} · GPA {rank?.gpa.toFixed(1)}</small>
        </p>
      )}
    </div>
  );
}