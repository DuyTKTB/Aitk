import { useState, useEffect, useRef, useCallback } from 'react';
import { ELEMENT_STATS, TYPE_CHART, MOVE_POOL, BATTLE_QUESTIONS } from '../../data/elementStats';
import GameOverModal from './GameOverModal';
import { sound } from '../../lib/gameSound';
import GameBar from './GameBar';
import { GIcon } from './GameIcons';

const ELEMENT_KEYS = Object.keys(ELEMENT_STATS);
function HpBar({ hp, maxHp, label, side = 'left' }) {
  const pct = Math.max(0, (hp / maxHp) * 100);
  const color = pct > 60 ? 'var(--post)' : pct > 30 ? 'var(--alkaline)' : 'var(--acc)';
  return (
    <div className={'eb-hp eb-hp-' + side}>
      <div className="eb-hp-head">
        <span>{label}</span>
        <span>{Math.max(0, hp)}/{maxHp}</span>
      </div>
      <div className="eb-hp-bar">
        <i style={{ width: pct + '%', background: color }} />
      </div>
    </div>
  );
}
function ElementSprite({ data, side, hit, theme }) {
  const stats = ELEMENT_STATS[data.key];
  if (!stats) return null;
  return (
    <div className={'eb-sprite eb-sprite-' + side + (hit ? ' hit' : '')}>
      <div className="eb-sprite-emoji">{stats.emoji}</div>
      <div className="eb-sprite-tile">
        <span className="eb-sprite-key">{data.key}</span>
        <span className="eb-sprite-name">{stats.name}</span>
      </div>
      <div className="eb-sprite-type" data-type={stats.type}>{stats.type}</div>
    </div>
  );
}

export default function ElementBattle() {
  const [phase, setPhase] = useState('select'); // select | pick | battle | question | over
  const [p1Key, setP1Key] = useState(null);
  const [p2Key, setP2Key] = useState(null);
  const [p1Hp, setP1Hp] = useState(0);
  const [p2Hp, setP2Hp] = useState(0);
  const [turn, setTurn] = useState(0);
  const [log, setLog] = useState([]);
  const [hitSide, setHitSide] = useState(null); // 'p1' | 'p2'
  const [selectedMove, setSelectedMove] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionTimer, setQuestionTimer] = useState(15);
  const [winner, setWinner] = useState(null);
  const [theme, setTheme] = useState('light');
  const [mode, setMode] = useState('ai'); // ai | pvp
  const [battleCount, setBattleCount] = useState(0);
  const logRef = useRef();

  useEffect(() => {
    const read = () => setTheme(document.documentElement.dataset.theme || 'light');
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => mo.disconnect();
  }, []);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [log]);

  const pushLog = useCallback((msg, type = 'info', icon = null) => {
    setLog((l) => [...l, { msg, type, icon, id: Date.now() + Math.random() }].slice(-30));
  }, []);

  const startBattle = () => {
    if (!p1Key || !p2Key) return;
    const s1 = ELEMENT_STATS[p1Key];
    const s2 = ELEMENT_STATS[p2Key];
    setP1Hp(s1.hp);
    setP2Hp(s2.hp);
    setTurn(0);
    setLog([]);
    setWinner(null);
    setPhase('battle');
    setBattleCount((c) => c + 1);
    pushLog(`${s1.name} (${p1Key}) đấu với ${s2.name} (${p2Key})!`, 'system', 'sword');
  };
  const pickAIOpponent = (playerKey) => {
    const pool = ELEMENT_KEYS.filter((k) => k !== playerKey);
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setP2Key(pick);
    return pick;
  };

  const chooseMove = (move) => {
    if (turn === 1 && mode === 'ai') return;
    setSelectedMove(move);

    if (move.id === 'shield') {
      executeMove(move, true);
      return;
    }
    const q = BATTLE_QUESTIONS[Math.floor(Math.random() * BATTLE_QUESTIONS.length)];
    const options = [q.a, ...q.wrong].sort(() => Math.random() - 0.5);
    setCurrentQuestion({ ...q, options });
    setQuestionTimer(15);
    setPhase('question');
  };
  useEffect(() => {
    if (phase !== 'question') return;
    if (questionTimer <= 0) {
      pushLog(`Hết giờ! ${turn === 0 ? 'P1' : 'P2'} không trả lời được.`, 'warn', 'timer');
      setPhase('battle');
      setSelectedMove(null);
      setCurrentQuestion(null);
      endTurn();
      return;
    }
    const id = setTimeout(() => setQuestionTimer((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [questionTimer, phase]);

  const answerQuestion = (choice) => {
    const correct = choice === currentQuestion.a;
    setPhase('battle');

    if (!correct) {
      pushLog(`Sai! Đáp án đúng: ${currentQuestion.a}`, 'warn', 'cross');
      setSelectedMove(null);
      setCurrentQuestion(null);
      sound.wrong?.();
      endTurn();
      return;
    }

    sound.correct?.();
    pushLog(`Đúng! ${currentQuestion.a}`, 'success', 'check');
    executeMove(selectedMove, true);
    setCurrentQuestion(null);
  };

  const executeMove = (move, success) => {
    const attackerKey = turn === 0 ? p1Key : p2Key;
    const defenderKey = turn === 0 ? p2Key : p1Key;
    const attackerStats = ELEMENT_STATS[attackerKey];
    const defenderStats = ELEMENT_STATS[defenderKey];

    if (move.id === 'shield') {
      const heal = move.heal;
      if (turn === 0) setP1Hp((h) => Math.min(attackerStats.hp, h + heal));
      else setP2Hp((h) => Math.min(attackerStats.hp, h + heal));
      pushLog(`${attackerStats.name} hồi ${heal} HP`, 'heal', 'heart');
      sound.correct?.();
      setTimeout(endTurn, 800);
      return;
    }
    if (Math.random() > move.accuracy) {
      pushLog(`${attackerStats.name} dùng ${move.name} nhưng trượt!`, 'warn', 'wind');
      sound.wrong?.();
      setTimeout(endTurn, 800);
      return;
    }
    const baseAtk = attackerStats.atk * move.atkMult;
    const defense = defenderStats.def;
    const typeMult = TYPE_CHART[attackerStats.type]?.[defenderStats.type] || 1;
    const variance = 0.85 + Math.random() * 0.3;
    const damage = Math.max(1, Math.round((baseAtk - defense * 0.5) * typeMult * variance));

    const effectiveness = typeMult >= 1.5 ? 'Rất hiệu quả!' : typeMult <= 0.5 ? 'Không hiệu quả...' : '';

    if (turn === 0) {
      setP2Hp((h) => Math.max(0, h - damage));
      setHitSide('p2');
    } else {
      setP1Hp((h) => Math.max(0, h - damage));
      setHitSide('p1');
    }
    setTimeout(() => setHitSide(null), 400);

    pushLog(
      `${attackerStats.name} dùng ${move.name} → ${damage} dmg ${effectiveness}`,
      typeMult >= 1.5 ? 'success' : typeMult <= 0.5 ? 'warn' : 'info',
      'sword'
    );
    sound.click?.();
    setTimeout(() => {
      const newP2Hp = turn === 0 ? Math.max(0, p2Hp - damage) : p2Hp;
      const newP1Hp = turn === 1 ? Math.max(0, p1Hp - damage) : p1Hp;
      if (newP2Hp <= 0 || newP1Hp <= 0) {
        const w = newP2Hp <= 0 ? p1Key : p2Key;
        setWinner(w);
        setPhase('over');
        sound.win?.();
        pushLog(`${ELEMENT_STATS[w].name} thắng!`, 'system', 'trophy');
        return;
      }
      endTurn();
    }, 900);
  };

  const endTurn = () => {
    const next = turn === 0 ? 1 : 0;
    setTurn(next);
    setSelectedMove(null);
    if (next === 1 && mode === 'ai') {
      setTimeout(() => aiTurn(), 900);
    }
  };

  const aiTurn = () => {
    const attackerKey = p2Key;
    const defenderKey = p1Key;
    const attackerStats = ELEMENT_STATS[attackerKey];
    const defenderStats = ELEMENT_STATS[defenderKey];
    const typeMult = TYPE_CHART[attackerStats.type]?.[defenderStats.type] || 1;
    let move;
    if (p2Hp < attackerStats.hp * 0.3 && Math.random() < 0.5) {
      move = MOVE_POOL.find((m) => m.id === 'shield');
    } else if (typeMult >= 1.5) {
      move = MOVE_POOL[Math.floor(Math.random() * 3)];
    } else {
      move = MOVE_POOL[Math.floor(Math.random() * MOVE_POOL.length)];
    }
    const aiCorrect = Math.random() < 0.7;
    if (move.id === 'shield') {
      const heal = move.heal;
      setP2Hp((h) => Math.min(attackerStats.hp, h + heal));
      pushLog(`${attackerStats.name} hồi ${heal} HP`, 'heal', 'heart');
      setTimeout(endTurn, 800);
      return;
    }

    if (!aiCorrect) {
      pushLog(`AI dùng ${move.name} nhưng trượt!`, 'warn', 'wind');
      sound.wrong?.();
      setTimeout(endTurn, 800);
      return;
    }

    if (Math.random() > move.accuracy) {
      pushLog(`AI dùng ${move.name} nhưng trượt!`, 'warn', 'wind');
      setTimeout(endTurn, 800);
      return;
    }

    const baseAtk = attackerStats.atk * move.atkMult;
    const defense = defenderStats.def;
    const variance = 0.85 + Math.random() * 0.3;
    const damage = Math.max(1, Math.round((baseAtk - defense * 0.5) * typeMult * variance));
    setP1Hp((h) => Math.max(0, h - damage));
    setHitSide('p1');
    setTimeout(() => setHitSide(null), 400);

    pushLog(`AI (${attackerStats.name}) dùng ${move.name} → ${damage} dmg`, 'warn', 'sword');

    setTimeout(() => {
      if (p1Hp - damage <= 0) {
        setWinner(p2Key);
        setPhase('over');
        sound.lose?.();
      } else {
        endTurn();
      }
    }, 900);
  };

  const reset = () => {
    setPhase('select');
    setP1Key(null);
    setP2Key(null);
    setP1Hp(0);
    setP2Hp(0);
    setLog([]);
    setWinner(null);
    setTurn(0);
  };

  /* ============ SELECT SCREEN ============ */
  if (phase === 'select') {
    return (
      <section className="wrap">
        <a href="#games" className="btn sm" style={{ marginBottom: '1.5rem' }}>← Danh sách trò chơi</a>
        <p className="slogan" style={{ marginBottom: '.6rem' }}>Trò chơi 05 — Chiến thuật</p>
        <h1 style={{ marginBottom: '1rem' }}>Đấu trường <em>nguyên tố</em></h1>
        <p className="hint" style={{ maxWidth: 620, marginBottom: '2rem' }}>
          Chọn nguyên tố đại diện, trả lời câu hỏi hóa học để tấn công. Type advantage ảnh hưởng lớn đến sát thương!
        </p>

        {/* Mode */}
        <div className="eb-mode">
          <button
            className={'eb-mode-btn' + (mode === 'ai' ? ' on' : '')}
            onClick={() => setMode('ai')}
            type="button"
          >
            <GIcon name="robot" /> Đấu với máy
          </button>
          <button
            className={'eb-mode-btn' + (mode === 'pvp' ? ' on' : '')}
            onClick={() => setMode('pvp')}
            type="button"
          >
            <GIcon name="users" /> 2 người chơi
          </button>
        </div>

        {/* Type chart */}
        <details className="eb-typechart">
          <summary><GIcon name="chart" /> Xem bảng khắc chế hệ</summary>
          <div className="eb-typechart-body">
            <p className="hint">1.5x = rất hiệu quả · 0.5x = không hiệu quả · 0.25x = gần như miễn nhiễm</p>
            <div className="eb-chart-grid">
              {Object.entries(TYPE_CHART).map(([atk, defs]) => (
                <div key={atk} className="eb-chart-row">
                  <b>{atk}</b>
                  <div>
                    {Object.entries(defs).map(([def, mult]) => (
                      mult !== 1 && (
                        <span
                          key={def}
                          className={'eb-chart-cell ' + (mult > 1 ? 'good' : 'bad')}
                          title={`${atk} → ${def}: ${mult}x`}
                        >
                          {def} {mult}×
                        </span>
                      )
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </details>

        {/* Chọn P1 */}
        <h3 className="eb-pick-title">
          <GIcon name="user" /> {mode === 'pvp' ? 'Người chơi 1 — Chọn nguyên tố' : 'Chọn nguyên tố của bạn'}
        </h3>
        <div className="eb-pick-grid">
          {ELEMENT_KEYS.map((k) => {
            const s = ELEMENT_STATS[k];
            return (
              <button
                key={k}
                className={'eb-pick-card' + (p1Key === k ? ' selected' : '')}
                onClick={() => { setP1Key(k); if (mode === 'ai') pickAIOpponent(k); }}
                type="button"
                data-type={s.type}
              >
                <div className="eb-pick-emoji">{s.emoji}</div>
                <div className="eb-pick-key">{k}</div>
                <div className="eb-pick-name">{s.name}</div>
                <div className="eb-pick-stats">
                  <span title="HP"><GIcon name="heart" /> {s.hp}</span>
                  <span title="ATK"><GIcon name="sword" /> {s.atk}</span>
                  <span title="DEF"><GIcon name="shield" /> {s.def}</span>
                  <span title="SPD"><GIcon name="wind" /> {s.spd}</span>
                </div>
                <div className="eb-pick-type">{s.type}</div>
              </button>
            );
          })}
        </div>

        {/* Chọn P2 (chỉ khi pvp) */}
        {mode === 'pvp' && (
          <>
            <h3 className="eb-pick-title"><GIcon name="users" /> Người chơi 2 — Chọn nguyên tố</h3>
            <div className="eb-pick-grid">
              {ELEMENT_KEYS.map((k) => {
                const s = ELEMENT_STATS[k];
                return (
                  <button
                    key={k}
                    className={'eb-pick-card' + (p2Key === k ? ' selected' : '') + (k === p1Key ? ' disabled' : '')}
                    onClick={() => k !== p1Key && setP2Key(k)}
                    disabled={k === p1Key}
                    type="button"
                    data-type={s.type}
                  >
                    <div className="eb-pick-emoji">{s.emoji}</div>
                    <div className="eb-pick-key">{k}</div>
                    <div className="eb-pick-name">{s.name}</div>
                    <div className="eb-pick-stats">
                      <span title="HP"><GIcon name="heart" /> {s.hp}</span>
                      <span title="ATK"><GIcon name="sword" /> {s.atk}</span>
                      <span title="DEF"><GIcon name="shield" /> {s.def}</span>
                      <span title="SPD"><GIcon name="wind" /> {s.spd}</span>
                    </div>
                    <div className="eb-pick-type">{s.type}</div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* AI auto-pick display */}
        {mode === 'ai' && p2Key && (
          <div className="eb-ai-pick">
            <span className="eb-ai-label"><GIcon name="robot" /> Máy chọn:</span>
            <div className="eb-ai-card">
              <span className="eb-pick-emoji">{ELEMENT_STATS[p2Key].emoji}</span>
              <b>{p2Key}</b>
              <span>{ELEMENT_STATS[p2Key].name}</span>
            </div>
          </div>
        )}

        <div className="game-start-bar">
          <div className="game-start-info">
            <div><small>Mode</small><b>{mode === 'ai' ? 'Đấu máy' : 'PvP'}</b></div>
            <div><small>P1</small><b>{p1Key || '—'}</b></div>
            <div><small>P2</small><b>{p2Key || '—'}</b></div>
          </div>
          <button
            className="btn primary"
            onClick={startBattle}
            disabled={!p1Key || !p2Key}
            type="button"
          >
            <GIcon name="sword" /> Vào trận →
          </button>
        </div>
      </section>
    );
  }

  /* ============ BATTLE ============ */
  if (phase === 'battle' || phase === 'question') {
    const s1 = ELEMENT_STATS[p1Key];
    const s2 = ELEMENT_STATS[p2Key];
    const activeMoves = MOVE_POOL.filter((m) => m.id !== 'shield' || true);

    return (
      <section className="wrap eb-battle">
        <GameBar />
        {/* Arena */}
        <div className="eb-arena">
          <div className="eb-side eb-side-left">
            <ElementSprite data={{ key: p1Key }} side="left" hit={hitSide === 'p1'} theme={theme} />
            <HpBar hp={p1Hp} maxHp={s1.hp} label={`P1 · ${s1.name}`} side="left" />
            {turn === 0 && phase === 'battle' && <span className="eb-turn-badge">LƯỢT</span>}
          </div>

          <div className="eb-vs">VS</div>

          <div className="eb-side eb-side-right">
            <ElementSprite data={{ key: p2Key }} side="right" hit={hitSide === 'p2'} theme={theme} />
            <HpBar hp={p2Hp} maxHp={s2.hp} label={`P2 · ${s2.name}`} side="right" />
            {turn === 1 && phase === 'battle' && mode === 'pvp' && <span className="eb-turn-badge">LƯỢT</span>}
            {turn === 1 && phase === 'battle' && mode === 'ai' && <span className="eb-turn-badge">AI...</span>}
          </div>
        </div>

        {/* Log */}
        <div className="eb-log" ref={logRef}>
          {log.map((l) => (
            <div key={l.id} className={'eb-log-line eb-log-' + l.type}>{l.icon && <GIcon name={l.icon} />} {l.msg}</div>
          ))}
        </div>

        {/* Moves */}
        {phase === 'battle' && (turn === 0 || mode === 'pvp') && (
          <div className="eb-moves">
            <h4 className="eb-moves-title">
              {turn === 0 ? 'Lượt của bạn — Chọn đòn' : 'Lượt P2 — Chọn đòn'}
            </h4>
            <div className="eb-moves-grid">
              {MOVE_POOL.map((m) => (
                <button
                  key={m.id}
                  className="eb-move"
                  onClick={() => chooseMove(m)}
                  type="button"
                >
                  <b>{m.name}</b>
                  <small>{m.desc}</small>
                  <div className="eb-move-meta">
                    {m.atkMult > 0 && <span><GIcon name="sword" /> {m.atkMult}×</span>}
                    {m.heal && <span><GIcon name="heart" /> +{m.heal}HP</span>}
                    <span><GIcon name="target" /> {Math.round(m.accuracy * 100)}%</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {phase === 'battle' && turn === 1 && mode === 'ai' && (
          <div className="eb-ai-thinking"><GIcon name="robot" /> AI đang suy nghĩ...</div>
        )}

        <div className="row center" style={{ marginTop: '1rem' }}>
          <button className="btn" onClick={reset} type="button">← Thoát trận</button>
        </div>

        {/* Question modal */}
        {phase === 'question' && currentQuestion && (
          <div className="backdrop">
            <div className="eb-question-modal" role="dialog" aria-modal="true">
              <div className="eb-question-head">
                <span><GIcon name="sword" /> Trả lời để tấn công</span>
                <span className={'eb-question-timer' + (questionTimer <= 5 ? ' urgent' : '')}>
                  <GIcon name="timer" /> {questionTimer}s
                </span>
              </div>
              <div className="eb-question-body">
                <p className="eb-question-text">{currentQuestion.q}</p>
                <div className="eb-question-options">
                  {currentQuestion.options.map((opt) => (
                    <button
                      key={opt}
                      className="eb-question-opt"
                      onClick={() => answerQuestion(opt)}
                      type="button"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    );
  }

  /* ============ OVER ============ */
  const winnerStats = winner ? ELEMENT_STATS[winner] : null;
  return (
    <section className="wrap">
      <GameOverModal
        title={winner ? <><GIcon name="trophy" /> {winnerStats.name} thắng!</> : 'Kết thúc'}
        score={winner === p1Key ? p1Hp : p1Hp > 0 ? p1Hp : 0}
        onRestart={reset}
        extra={
          <div className="eb-result">
            <div className="eb-result-row">
              <span className={'eb-result-team' + (winner === p1Key ? ' winner' : '')}>
                P1 · {ELEMENT_STATS[p1Key].name}
              </span>
              <b>{Math.max(0, p1Hp)}/{ELEMENT_STATS[p1Key].hp}</b>
            </div>
            <div className="eb-result-row">
              <span className={'eb-result-team' + (winner === p2Key ? ' winner' : '')}>
                P2 · {ELEMENT_STATS[p2Key].name}
              </span>
              <b>{Math.max(0, p2Hp)}/{ELEMENT_STATS[p2Key].hp}</b>
            </div>
          </div>
        }
      />
    </section>
  );
}