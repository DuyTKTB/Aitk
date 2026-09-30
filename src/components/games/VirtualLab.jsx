import { useState, useEffect, useRef, useCallback } from 'react';
import { CHEMICALS, findReaction, LAB_MISSIONS, SAFETY_TIPS } from '../../data/reactions';
import { sound } from '../../lib/gameSound';

const MAX_SLOTS = 3;

// Hiệu ứng phản ứng
function ReactionEffect({ reaction, onDone }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (!reaction) return;
    const eff = reaction.effect;
    const count = Math.min(30, eff.intensity * 6);
    const newParticles = Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: 50 + (Math.random() - 0.5) * 60,
      y: 50 + (Math.random() - 0.5) * 40,
      vx: (Math.random() - 0.5) * 2,
      vy: -Math.random() * 3 - 1,
      size: 3 + Math.random() * 5,
      delay: Math.random() * 0.5,
    }));
    setParticles(newParticles);

    const t = setTimeout(() => {
      onDone();
    }, 2500);
    return () => clearTimeout(t);
  }, [reaction, onDone]);

  if (!reaction) return null;

  const eff = reaction.effect;
  const effClass = `lab-effect-${eff.type}`;

  return (
    <div className={'lab-effect ' + effClass} aria-hidden="true">
      <div className="lab-effect-flash" style={{ background: eff.color }} />
      {particles.map((p) => (
        <div
          key={p.id}
          className="lab-particle"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            '--vx': `${p.vx}px`,
            '--vy': `${p.vy * 40}px`,
            '--size': `${p.size}px`,
            '--delay': `${p.delay}s`,
            background: eff.color,
          }}
        />
      ))}
      {eff.type === 'bubble' && (
        <>
          {Array.from({ length: eff.intensity * 3 }).map((_, i) => (
            <div key={`b${i}`} className="lab-bubble" style={{
              left: `${30 + Math.random() * 40}%`,
              bottom: '20%',
              '--delay': `${i * 0.15}s`,
              '--size': `${6 + Math.random() * 10}px`,
            }} />
          ))}
        </>
      )}
      {eff.steam && (
        <div className="lab-steam">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="lab-steam-puff" style={{ '--delay': `${i * 0.2}s` }} />
          ))}
        </div>
      )}
    </div>
  );
}

// Slot chứa hóa chất
function LabSlot({ chem, onRemove, theme }) {
  if (!chem) {
    return (
      <div className="lab-slot lab-slot-empty">
        <span>+</span>
        <small>Trống</small>
      </div>
    );
  }
  const c = CHEMICALS[chem];
  return (
    <div className="lab-slot lab-slot-filled" style={{ '--chem-color': c.color }}>
      <button className="lab-slot-x" onClick={onRemove} aria-label="Xóa">×</button>
      <div className="lab-slot-formula">{c.formula}</div>
      <div className="lab-slot-name">{c.name}</div>
      <div className="lab-slot-state">{c.state === 'gas' ? '☁' : c.state === 'liquid' ? '💧' : '◇'}</div>
    </div>
  );
}

export default function VirtualLab() {
  const [phase, setPhase] = useState('play'); // play | reacting | result
  const [slots, setSlots] = useState([null, null, null]);
  const [activeReaction, setActiveReaction] = useState(null);
  const [history, setHistory] = useState([]);
  const [discovered, setDiscovered] = useState([]);
  const [currentMission, setCurrentMission] = useState(null);
  const [missionsDone, setMissionsDone] = useState([]);
  const [score, setScore] = useState(0);
  const [theme, setTheme] = useState('light');
  const [filter, setFilter] = useState('all');
  const [showSafety, setShowSafety] = useState(false);

  const benchRef = useRef(null);

  useEffect(() => {
    const read = () => setTheme(document.documentElement.dataset.theme || 'light');
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => mo.disconnect();
  }, []);

  // Load progress
  useEffect(() => {
    try {
      const raw = localStorage.getItem('cs-game:lab:progress');
      if (raw) {
        const data = JSON.parse(raw);
        setDiscovered(data.discovered || []);
        setMissionsDone(data.missionsDone || []);
        setScore(data.score || 0);
      }
    } catch {}
  }, []);

  // Save progress
  useEffect(() => {
    try {
      localStorage.setItem('cs-game:lab:progress', JSON.stringify({
        discovered, missionsDone, score,
      }));
    } catch {}
  }, [discovered, missionsDone, score]);

  const addChemical = (key) => {
    if (phase === 'reacting') return;
    const firstEmpty = slots.findIndex((s) => s === null);
    if (firstEmpty === -1) return;
    const next = [...slots];
    next[firstEmpty] = key;
    setSlots(next);
    sound.click?.();
  };

  const removeChemical = (idx) => {
    if (phase === 'reacting') return;
    const next = [...slots];
    next[idx] = null;
    setSlots(next);
  };

  const clearBench = () => {
    if (phase === 'reacting') return;
    setSlots([null, null, null]);
  };

  const mix = useCallback(() => {
    const keys = slots.filter(Boolean);
    if (keys.length < 2) {
      sound.wrong?.();
      return;
    }

    const rxn = findReaction(keys);
    if (!rxn) {
      sound.wrong?.();
      setPhase('result');
      setActiveReaction({
        noReaction: true,
        equation: 'Không có phản ứng xảy ra',
        note: 'Các chất này không phản ứng với nhau ở điều kiện thường.',
        inputs: keys,
      });
      return;
    }

    sound.correct?.();
    setPhase('reacting');
    setActiveReaction(rxn);

    // Cập nhật lịch sử
    setHistory((h) => [{ ...rxn, timestamp: Date.now() }, ...h].slice(0, 20));

    // Đánh dấu phát hiện
    if (!discovered.includes(rxn.equation)) {
      setDiscovered((d) => [...d, rxn.equation]);
      setScore((s) => s + 10);
    }

    // Kiểm tra nhiệm vụ
    if (currentMission) {
      const missionKeys = [...currentMission.required].sort();
      const inputKeys = [...keys].sort();
      const match = missionKeys.length === inputKeys.length &&
                    missionKeys.every((k, i) => k === inputKeys[i]);
      if (match && !missionsDone.includes(currentMission.id)) {
        setMissionsDone((m) => [...m, currentMission.id]);
        setScore((s) => s + 50);
      }
    }
  }, [slots, discovered, currentMission, missionsDone]);

  const onEffectDone = () => {
    setPhase('result');
  };

  const closeResult = () => {
    setActiveReaction(null);
    setSlots([null, null, null]);
    setPhase('play');
    setCurrentMission(null);
  };

  // Filter chemicals
  const filteredChems = Object.entries(CHEMICALS).filter(([k, v]) => {
    if (filter === 'all') return true;
    return v.type === filter;
  });

  const TYPE_FILTERS = [
    { key: 'all', label: 'Tất cả' },
    { key: 'metal', label: 'Kim loại' },
    { key: 'nonmetal', label: 'Phi kim' },
    { key: 'acid', label: 'Axit' },
    { key: 'base', label: 'Bazơ' },
    { key: 'salt', label: 'Muối' },
    { key: 'oxide', label: 'Oxit' },
  ];

  return (
    <section className="wrap lab-page">
      <a href="#games" className="btn sm" style={{ marginBottom: '1.5rem' }}>← Danh sách trò chơi</a>

      <p className="slogan" style={{ marginBottom: '.6rem' }}>Trò chơi 04 — Thí nghiệm</p>
      <h1 style={{ marginBottom: '1rem' }}>Phòng thí nghiệm <em>ảo</em></h1>
      <p className="hint" style={{ maxWidth: 620, marginBottom: '2rem' }}>
        Kéo hóa chất vào bàn thí nghiệm, bấm "Trộn" để xem phản ứng. Khám phá 12+ phản ứng hóa học, hoàn thành nhiệm vụ để ghi điểm.
      </p>

      <div className="lab-layout">
        {/* ==== CỘT TRÁI: BÀN THÍ NGHIỆM ==== */}
        <div className="lab-bench-col">
          {/* Nhiệm vụ */}
          <div className="lab-mission">
            <div className="lab-mission-head">
              <span className="lab-mission-label">Nhiệm vụ</span>
              {currentMission && (
                <button className="x" onClick={() => setCurrentMission(null)} type="button">×</button>
              )}
            </div>
            {currentMission ? (
              <>
                <h4 className="lab-mission-title">{currentMission.title}</h4>
                <p className="lab-mission-desc">{currentMission.desc}</p>
                <div className="lab-mission-req">
                  {currentMission.required.map((k) => (
                    <span key={k} className="lab-req-chip" style={{ '--c': CHEMICALS[k].color }}>
                      {CHEMICALS[k].formula}
                    </span>
                  ))}
                </div>
                <p className="hint" style={{ margin: '.5rem 0 0' }}>💡 {currentMission.hint}</p>
              </>
            ) : (
              <>
                <h4 className="lab-mission-title">Chọn nhiệm vụ</h4>
                <div className="lab-mission-list">
                  {LAB_MISSIONS.slice(0, 4).map((m) => {
                    const done = missionsDone.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        className={'lab-mission-btn' + (done ? ' done' : '')}
                        onClick={() => { setCurrentMission(m); setSlots([null, null, null]); }}
                        type="button"
                      >
                        <span className="lab-mission-num">{done ? '✓' : `0${m.difficulty}`}</span>
                        <span>{m.title}</span>
                      </button>
                    );
                  })}
                  <button
                    className="lab-mission-btn lab-mission-more"
                    onClick={() => document.querySelector('.lab-more-missions')?.scrollIntoView({ behavior: 'smooth' })}
                    type="button"
                  >
                    <span className="lab-mission-num">+</span>
                    <span>Xem tất cả ({LAB_MISSIONS.length})</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Bàn thí nghiệm */}
          <div className="lab-bench" ref={benchRef}>
            <div className="lab-bench-head">
              <span className="lab-bench-label">Bàn thí nghiệm</span>
              <button
                className="btn sm"
                onClick={clearBench}
                disabled={phase === 'reacting' || slots.every((s) => !s)}
                type="button"
              >
                Xóa hết
              </button>
            </div>

            <div className="lab-slots">
              {slots.map((s, i) => (
                <LabSlot key={i} chem={s} onRemove={() => removeChemical(i)} theme={theme} />
              ))}
            </div>

            {/* Hiệu ứng */}
            {phase === 'reacting' && activeReaction && (
              <ReactionEffect reaction={activeReaction} onDone={onEffectDone} />
            )}

            <button
              className="btn primary lab-mix-btn"
              onClick={mix}
              disabled={phase === 'reacting' || slots.filter(Boolean).length < 2}
              type="button"
            >
              {phase === 'reacting' ? '⚗ Đang phản ứng...' : '⚗ TRỘN'}
            </button>

            <p className="hint center" style={{ margin: '.4rem 0 0' }}>
              Chọn ít nhất 2 hóa chất để trộn
            </p>
          </div>

          {/* Lịch sử */}
          {history.length > 0 && (
            <div className="lab-history">
              <h4 className="lab-section-title">Phản ứng đã thực hiện ({history.length})</h4>
              <ul className="lab-history-list">
                {history.slice(0, 5).map((h, i) => (
                  <li key={i}>
                    <button
                      className="lab-history-item"
                      onClick={() => {
                        setSlots([h.inputs[0], h.inputs[1] || null, null]);
                      }}
                      type="button"
                    >
                      <b>{h.equation}</b>
                      <small>{h.note}</small>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* ==== CỘT PHẢI: KHO HÓA CHẤT ==== */}
        <div className="lab-shelf">
          <div className="lab-shelf-head">
            <h3 className="lab-section-title" style={{ margin: 0 }}>Kho hóa chất</h3>
            <span className="lab-shelf-count">{Object.keys(CHEMICALS).length} chất</span>
          </div>

          <div className="lab-filters">
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.key}
                className={'chip' + (filter === f.key ? ' on' : '')}
                onClick={() => setFilter(f.key)}
                type="button"
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="lab-chems">
            {filteredChems.map(([key, c]) => (
              <button
                key={key}
                className="lab-chem"
                onClick={() => addChemical(key)}
                disabled={phase === 'reacting' || slots.every((s) => s !== null)}
                style={{ '--chem-color': c.color }}
                type="button"
                title={`${c.name} (${c.formula})`}
              >
                <span className="lab-chem-formula">{c.formula}</span>
                <span className="lab-chem-name">{c.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tất cả nhiệm vụ */}
      <div className="lab-more-missions" style={{ marginTop: '3rem' }}>
        <h3 className="lab-section-title">Tất cả nhiệm vụ ({missionsDone.length}/{LAB_MISSIONS.length})</h3>
        <div className="lab-missions-grid">
          {LAB_MISSIONS.map((m) => {
            const done = missionsDone.includes(m.id);
            return (
              <button
                key={m.id}
                className={'lab-mission-card' + (done ? ' done' : '')}
                onClick={() => {
                  setCurrentMission(m);
                  setSlots([null, null, null]);
                  window.scrollTo({ top: 200, behavior: 'smooth' });
                }}
                type="button"
              >
                <div className="lab-mission-card-head">
                  <span className="lab-mission-num">{done ? '✓' : `0${m.difficulty}`}</span>
                  <span className="lab-mission-diff">{'★'.repeat(m.difficulty)}</span>
                </div>
                <h4>{m.title}</h4>
                <p>{m.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bảng thành tích */}
      <div className="lab-stats">
        <div className="lab-stat">
          <b>{discovered.length}</b>
          <span>Phản ứng khám phá</span>
        </div>
        <div className="lab-stat">
          <b>{missionsDone.length}/{LAB_MISSIONS.length}</b>
          <span>Nhiệm vụ hoàn thành</span>
        </div>
        <div className="lab-stat">
          <b>{score}</b>
          <span>Điểm</span>
        </div>
      </div>

      {/* Modal kết quả */}
      {phase === 'result' && activeReaction && (
        <div className="backdrop" onMouseDown={(e) => e.target === e.currentTarget && closeResult()}>
          <div className="lab-result-modal" role="dialog" aria-modal="true">
            {activeReaction.noReaction ? (
              <>
                <div className="lab-result-head lab-result-none">
                  <span className="lab-result-icon">😐</span>
                  <h2>Không phản ứng</h2>
                </div>
                <div className="lab-result-body">
                  <p className="lab-result-eq lab-result-eq-none">{activeReaction.equation}</p>
                  <p className="lab-result-note">{activeReaction.note}</p>
                </div>
              </>
            ) : (
              <>
                <div className="lab-result-head">
                  <span className="lab-result-icon">⚗</span>
                  <h2>Phản ứng xảy ra!</h2>
                </div>
                <div className="lab-result-body">
                  <p className="lab-result-eq">{activeReaction.equation}</p>

                  <div className="lab-result-section">
                    <span className="lab-result-label">Hiện tượng</span>
                    <p>{activeReaction.note}</p>
                  </div>

                  <div className="lab-result-section">
                    <span className="lab-result-label">Sản phẩm</span>
                    <div className="lab-result-products">
                      {activeReaction.outputs.map((k) => (
                        <span key={k} className="lab-product-chip">
                          {CHEMICALS[k]?.formula || k}
                          <small>{CHEMICALS[k]?.name}</small>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className={'lab-result-safety danger-' + (activeReaction.danger || 1)}>
                    <span>⚠</span>
                    <span>{SAFETY_TIPS[activeReaction.danger || 1]}</span>
                  </div>
                </div>
              </>
            )}
            <div className="lab-result-foot">
              <button className="btn primary" onClick={closeResult} type="button">
                Tiếp tục →
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}