import { useState, useEffect, useMemo } from 'react';
import GameOverModal from './GameOverModal';
import { sound } from '../../lib/gameSound';

const DEFAULT_CATEGORIES = [
  {
    name: 'Ký hiệu',
    questions: [
      { q: 'Ký hiệu của Natri?', a: 'Na', v: 100 },
      { q: 'Ký hiệu của Sắt?', a: 'Fe', v: 200 },
      { q: 'Ký hiệu của Vàng?', a: 'Au', v: 300 },
      { q: 'Ký hiệu của Bạc?', a: 'Ag', v: 400 },
      { q: 'Ký hiệu của Thủy ngân?', a: 'Hg', v: 500 },
    ],
  },
  {
    name: 'Công thức',
    questions: [
      { q: 'Công thức của nước?', a: 'H2O', v: 100 },
      { q: 'Công thức của muối ăn?', a: 'NaCl', v: 200 },
      { q: 'Công thức của axit sunfuric?', a: 'H2SO4', v: 300 },
      { q: 'Công thức của đá vôi?', a: 'CaCO3', v: 400 },
      { q: 'Công thức của amoniac?', a: 'NH3', v: 500 },
    ],
  },
  {
    name: 'Phản ứng',
    questions: [
      { q: 'Kim loại + axit → ?', a: 'Muối + H2', v: 100 },
      { q: 'Axit + bazơ → ?', a: 'Muối + H2O', v: 200 },
      { q: 'Oxit bazơ + nước → ?', a: 'Bazơ', v: 300 },
      { q: 'Oxit axit + nước → ?', a: 'Axit', v: 400 },
      { q: 'Muối + muối → ?', a: '2 muối mới (nếu có kết tủa)', v: 500 },
    ],
  },
  {
    name: 'Hiện tượng',
    questions: [
      { q: 'Quỳ tím gặp axit?', a: 'Hóa đỏ', v: 100 },
      { q: 'Quỳ tím gặp bazơ?', a: 'Hóa xanh', v: 200 },
      { q: 'Dung dịch CuSO4 có màu?', a: 'Xanh lam', v: 300 },
      { q: 'Kết tủa Fe(OH)3 có màu?', a: 'Nâu đỏ', v: 400 },
      { q: 'Khí CO2 làm đục nước vôi trong?', a: 'Đúng (tạo CaCO3↓)', v: 500 },
    ],
  },
];

const TEAM_COLORS = ['#ff9b85', '#a7c4f2', '#b7dc9a', '#ffc46b'];
const MAX_TEAMS = 4;
const MIN_TEAMS = 2;

const SPECIAL_TILES = {
  double: { label: '×2', bg: '#ffc46b', desc: 'Nhân đôi điểm' },
  steal:  { label: 'CƯỚP', bg: '#ff9b85', desc: 'Cướp điểm đội khác' },
  skip:   { label: 'MẤT LƯỢT', bg: '#c9c5b8', desc: 'Mất lượt ngay' },
};

const randomSpecial = () => {
  const r = Math.random();
  if (r < 0.1) return 'double';
  if (r < 0.2) return 'steal';
  if (r < 0.28) return 'skip';
  return null;
};

export default function JeopardyGame() {
  const [phase, setPhase] = useState('setup');
  const [teams, setTeams] = useState([
    { id: 1, name: 'Đội 1', score: 0, color: TEAM_COLORS[0] },
    { id: 2, name: 'Đội 2', score: 0, color: TEAM_COLORS[1] },
  ]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [tiles, setTiles] = useState([]); // { catIdx, qIdx, used, special }
  const [activeTile, setActiveTile] = useState(null);
  const [answerRevealed, setAnswerRevealed] = useState(false);
  const [winner, setWinner] = useState(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('cs-game:jeopardy:teams');
      if (raw) setTeams(JSON.parse(raw));
    } catch {}
    try {
      const raw = localStorage.getItem('cs-game:jeopardy:categories');
      if (raw) setCategories(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem('cs-game:jeopardy:teams', JSON.stringify(teams)); } catch {}
  }, [teams]);
  useEffect(() => {
    try { localStorage.setItem('cs-game:jeopardy:categories', JSON.stringify(categories)); } catch {}
  }, [categories]);

  /* ===== BUILD BOARD ===== */
  const buildBoard = () => {
    const t = [];
    for (let c = 0; c < categories.length; c++) {
      for (let q = 0; q < categories[c].questions.length; q++) {
        t.push({
          catIdx: c,
          qIdx: q,
          used: false,
          special: randomSpecial(),
        });
      }
    }
    setTiles(t);
  };

  const startGame = () => {
    if (!categories.length || teams.length < MIN_TEAMS) return;
    buildBoard();
    setTeams((ts) => ts.map((t) => ({ ...t, score: 0 })));
    setCurrentTurn(0);
    setActiveTile(null);
    setAnswerRevealed(false);
    setWinner(null);
    setPhase('playing');
  };

  /* ===== TEAM MANAGEMENT ===== */
  const addTeam = () => {
    if (teams.length >= MAX_TEAMS) return;
    setTeams([...teams, {
      id: Date.now(),
      name: `Đội ${teams.length + 1}`,
      score: 0,
      color: TEAM_COLORS[teams.length],
    }]);
  };

  const removeTeam = (id) => {
    if (teams.length <= MIN_TEAMS) return;
    setTeams(teams.filter((t) => t.id !== id));
  };

  const updateTeamName = (id, name) => {
    setTeams(teams.map((t) => (t.id === id ? { ...t, name } : t)));
  };

  /* ===== TILE CLICK ===== */
  const openTile = (tile) => {
    if (tile.used || activeTile) return;
    sound.click();
    const cat = categories[tile.catIdx];
    const q = cat.questions[tile.qIdx];
    if (tile.special === 'skip') {
      sound.wrong();
      const nextTurn = (currentTurn + 1) % teams.length;
      setCurrentTurn(nextTurn);
      setTiles((ts) => ts.map((t) =>
        t.catIdx === tile.catIdx && t.qIdx === tile.qIdx
          ? { ...t, used: true, special: 'skip' }
          : t
      ));
      return;
    }

    setActiveTile(tile);
    setAnswerRevealed(false);
  };

  const closeTile = () => {
    setActiveTile(null);
    setAnswerRevealed(false);
  };

  const markCorrect = () => {
    if (!activeTile) return;
    const cat = categories[activeTile.catIdx];
    const q = cat.questions[activeTile.qIdx];
    let points = q.v;

    if (activeTile.special === 'double') points *= 2;

    if (activeTile.special === 'steal') {
      const otherTeams = teams.filter((_, i) => i !== currentTurn).sort((a, b) => b.score - a.score);
      const victim = otherTeams[0];
      const stolen = Math.min(victim?.score || 0, points);
      setTeams((ts) =>
        ts.map((t, i) => {
          if (i === currentTurn) return { ...t, score: t.score + points };
          if (t.id === victim?.id) return { ...t, score: t.score - stolen };
          return t;
        })
      );
    } else {
      setTeams((ts) => ts.map((t, i) => (i === currentTurn ? { ...t, score: t.score + points } : t)));
    }

    sound.correct();
    setTiles((ts) => ts.map((t) =>
      t.catIdx === activeTile.catIdx && t.qIdx === activeTile.qIdx
        ? { ...t, used: true }
        : t
    ));
    setTimeout(() => {
      closeTile();
      checkEnd();
    }, 800);
  };

  const markWrong = () => {
    if (!activeTile) return;
    sound.wrong();
    setTiles((ts) => ts.map((t) =>
      t.catIdx === activeTile.catIdx && t.qIdx === activeTile.qIdx
        ? { ...t, used: true }
        : t
    ));
    setCurrentTurn((currentTurn + 1) % teams.length);
    setTimeout(() => {
      closeTile();
      checkEnd();
    }, 600);
  };

  const skipTurn = () => {
    if (!activeTile) return;
    sound.click();
    setTiles((ts) => ts.map((t) =>
      t.catIdx === activeTile.catIdx && t.qIdx === activeTile.qIdx
        ? { ...t, used: true }
        : t
    ));
    setCurrentTurn((currentTurn + 1) % teams.length);
    closeTile();
  };

  const checkEnd = () => {
    setTiles((ts) => {
      const allUsed = ts.every((t) => t.used);
      if (allUsed) {
        setTimeout(() => {
          setWinner([...teams].sort((a, b) => b.score - a.score)[0]);
          setPhase('over');
          sound.win();
        }, 400);
      }
      return ts;
    });
  };

  const remaining = useMemo(() => tiles.filter((t) => !t.used).length, [tiles]);
  const activeCat = activeTile ? categories[activeTile.catIdx] : null;
  const activeQ = activeTile ? activeCat.questions[activeTile.qIdx] : null;

  /* ============ SETUP ============ */
  if (phase === 'setup') {
    return (
      <section className="wrap">
        <a href="#games" className="btn sm" style={{ marginBottom: '1.5rem' }}>← Danh sách trò chơi</a>
        <p className="slogan" style={{ marginBottom: '.6rem' }}>Trò chơi 03 — Đội nhóm</p>
        <h1 style={{ marginBottom: '2.5rem' }}>Chọn ô <em>may mắn</em></h1>

        <div className="setup-block">
          <div className="setup-num">01</div>
          <div className="setup-content">
            <h3 className="setup-title">Đội chơi ({teams.length}/{MAX_TEAMS})</h3>
            <div className="team-list">
              {teams.map((t, i) => (
                <div key={t.id} className="team-row">
                  <span className="team-dot" style={{ background: t.color }} />
                  <input
                    value={t.name}
                    onChange={(e) => updateTeamName(t.id, e.target.value)}
                    maxLength={20}
                    placeholder={`Đội ${i + 1}`}
                  />
                  {teams.length > MIN_TEAMS && (
                    <button className="x" onClick={() => removeTeam(t.id)} type="button" aria-label="Xóa đội">×</button>
                  )}
                </div>
              ))}
            </div>
            {teams.length < MAX_TEAMS && (
              <button className="btn sm" onClick={addTeam} type="button" style={{ marginTop: '.6rem' }}>
                + Thêm đội
              </button>
            )}
          </div>
        </div>

        <div className="setup-block">
          <div className="setup-num">02</div>
          <div className="setup-content">
            <h3 className="setup-title">Bộ câu hỏi</h3>
            <p className="hint">
              4 chủ đề × 5 câu = 20 ô. Câu hỏi có sẵn, bạn có thể chơi ngay.
            </p>
            <div className="jeopardy-preview">
              {categories.map((c, i) => (
                <div key={i} className="jeopardy-preview-col">
                  <div className="jeopardy-preview-cat">{c.name}</div>
                  {c.questions.map((q, j) => (
                    <div key={j} className="jeopardy-preview-cell">{q.v}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="setup-block">
          <div className="setup-num">03</div>
          <div className="setup-content">
            <h3 className="setup-title">Ô đặc biệt</h3>
            <ul className="hint" style={{ paddingLeft: '1.2rem', lineHeight: 1.8 }}>
              <li><b style={{ background: SPECIAL_TILES.double.bg, padding: '0 .3rem' }}>×2</b> — Nhân đôi điểm ô đó (10% cơ hội)</li>
              <li><b style={{ background: SPECIAL_TILES.steal.bg, padding: '0 .3rem' }}>CƯỚP</b> — Cướp điểm từ đội đang dẫn đầu (10% cơ hội)</li>
              <li><b style={{ background: SPECIAL_TILES.skip.bg, padding: '0 .3rem' }}>MẤT LƯỢT</b> — Chuyển lượt ngay khi mở (8% cơ hội)</li>
            </ul>
          </div>
        </div>

        <div className="game-start-bar">
          <div className="game-start-info">
            <div><small>Đội</small><b>{teams.length}</b></div>
            <div><small>Chủ đề</small><b>{categories.length}</b></div>
            <div><small>Số ô</small><b>20</b></div>
          </div>
          <button className="btn primary" onClick={startGame} disabled={teams.length < MIN_TEAMS} type="button">
            Bắt đầu chơi →
          </button>
        </div>
      </section>
    );
  }

  /* ============ PLAYING ============ */
  if (phase === 'playing') {
    return (
      <section className="wrap">
        {/* Scoreboard */}
        <div className="jeopardy-scores">
          {teams.map((t, i) => (
            <div
              key={t.id}
              className={'jeopardy-team' + (i === currentTurn ? ' active' : '')}
              style={{ '--tc': t.color }}
            >
              <span className="jeopardy-team-name">{t.name}</span>
              <span className="jeopardy-team-score">{t.score}</span>
              {i === currentTurn && <span className="jeopardy-team-turn">●</span>}
            </div>
          ))}
        </div>

        <p className="hint center">Còn {remaining} ô chưa mở</p>

        {/* Board */}
        <div className="jeopardy-board">
          {categories.map((cat, cIdx) => (
            <div key={cIdx} className="jeopardy-col">
              <div className="jeopardy-cat">{cat.name}</div>
              {cat.questions.map((q, qIdx) => {
                const tile = tiles.find((t) => t.catIdx === cIdx && t.qIdx === qIdx);
                if (!tile) return null;
                const special = tile.special ? SPECIAL_TILES[tile.special] : null;
                return (
                  <button
                    key={qIdx}
                    className={'jeopardy-cell' + (tile.used ? ' used' : '')}
                    onClick={() => openTile(tile)}
                    disabled={tile.used}
                    type="button"
                  >
                    {tile.used
                      ? '—'
                      : special
                        ? <span className="jeopardy-special" style={{ background: special.bg }}>{special.label}</span>
                        : q.v
                    }
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Modal */}
        {activeTile && activeQ && (
          <div className="backdrop" onMouseDown={(e) => e.target === e.currentTarget && closeTile()}>
            <div className="jeopardy-modal" role="dialog" aria-modal="true">
              <div className="jeopardy-modal-head">
                <span className="jeopardy-modal-cat">{activeCat.name}</span>
                <span className="jeopardy-modal-val">
                  {activeQ.v}{activeTile.special === 'double' && ' ×2'}
                  {activeTile.special === 'steal' && ' 🔥 CƯỚP'}
                </span>
              </div>

              <div className="jeopardy-modal-body">
                <p className="jeopardy-question">{activeQ.q}</p>

                {answerRevealed && (
                  <p className="jeopardy-answer">
                    <b>Đáp án:</b> {activeQ.a}
                  </p>
                )}
              </div>

              <div className="jeopardy-modal-actions">
                {!answerRevealed ? (
                  <button className="btn primary" onClick={() => setAnswerRevealed(true)} type="button">
                    Hiện đáp án
                  </button>
                ) : (
                  <>
                    <button className="btn primary" onClick={markCorrect} type="button">✓ Đúng</button>
                    <button className="btn" onClick={markWrong} type="button">✗ Sai</button>
                  </>
                )}
                <button className="btn" onClick={skipTurn} type="button">Bỏ qua</button>
              </div>
            </div>
          </div>
        )}
      </section>
    );
  }

  /* ============ OVER ============ */
  const ranking = [...teams].sort((a, b) => b.score - a.score);

  return (
    <section className="wrap">
      <div className="backdrop">
        <div className="gameover-modal" style={{ maxWidth: 520 }}>
          <h2>🏆 Kết thúc</h2>
          <div style={{ margin: '1.5rem 0' }}>
            {ranking.map((t, i) => (
              <div key={t.id} className="jeopardy-rank-row" style={{ '--tc': t.color }}>
                <span className="jeopardy-rank-num">{i + 1}</span>
                <span className="jeopardy-rank-name">{t.name}</span>
                <span className="jeopardy-rank-score">{t.score}</span>
              </div>
            ))}
          </div>
          <div className="row center" style={{ marginTop: '1.5rem' }}>
            <button className="btn primary" onClick={() => setPhase('setup')} type="button">Chơi lại</button>
            <a className="btn" href="#games">← Danh sách</a>
          </div>
        </div>
      </div>
    </section>
  );
}