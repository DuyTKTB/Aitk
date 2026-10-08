import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  SUDOKU_ELEMENTS,
  SUDOKU_PUZZLES,
  SUDOKU_HINTS,
  isValidMove,
  countEmpty,
  isComplete,
} from '../../data/sudokuPuzzles';
import { sound } from '../../lib/gameSound';
import GameBar from './GameBar';
import { GIcon } from './GameIcons';

const DIFFICULTIES = [
  { key: 'easy',   label: 'Dễ',    time: 0 },
  { key: 'medium', label: 'Vừa',   time: 0 },
  { key: 'hard',   label: 'Khó',   time: 0 },
];

export default function ChemSudoku() {
  const [phase, setPhase] = useState('menu'); // menu | playing | won
  const [difficulty, setDifficulty] = useState('easy');
  const [board, setBoard] = useState([]);
  const [initialBoard, setInitialBoard] = useState([]);
  const [selected, setSelected] = useState(null); // { row, col }
  const [mistakes, setMistakes] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [paused, setPaused] = useState(false);
  const [noteMode, setNoteMode] = useState(false);
  const [notes, setNotes] = useState({}); // { 'r,c': Set of values }
  const [wrongCells, setWrongCells] = useState({}); // { 'r,c': true }
  const [hintCell, setHintCell] = useState(null);
  const [theme, setTheme] = useState('light');
  const [bestTimes, setBestTimes] = useState({});

  useEffect(() => {
    const read = () => setTheme(document.documentElement.dataset.theme || 'light');
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => mo.disconnect();
  }, []);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('cs-game:sudoku:best');
      if (raw) setBestTimes(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    if (phase !== 'playing' || paused) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [phase, paused]);
  useEffect(() => { if (phase !== 'playing') setPaused(false); }, [phase]);
  const togglePause = () => { if (phase === 'playing') setPaused((p) => !p); };
  useEffect(() => {
    if (phase !== 'playing') return;
    const onKey = (e) => {
      if (!selected || paused) return;
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 9) {
        placeNumber(num);
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        clearCell();
      } else if (e.key === 'ArrowUp') {
        setSelected((s) => s && { row: Math.max(0, s.row - 1), col: s.col });
        e.preventDefault();
      } else if (e.key === 'ArrowDown') {
        setSelected((s) => s && { row: Math.min(8, s.row + 1), col: s.col });
        e.preventDefault();
      } else if (e.key === 'ArrowLeft') {
        setSelected((s) => s && { row: s.row, col: Math.max(0, s.col - 1) });
        e.preventDefault();
      } else if (e.key === 'ArrowRight') {
        setSelected((s) => s && { row: s.row, col: Math.min(8, s.col + 1) });
        e.preventDefault();
      }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [selected, phase, noteMode, notes, paused]);

  const startGame = (diff) => {
    const puzzle = SUDOKU_PUZZLES[diff].map((r) => [...r]);
    setBoard(puzzle);
    setInitialBoard(puzzle.map((r) => [...r]));
    setDifficulty(diff);
    setSelected(null);
    setMistakes(0);
    setHintsUsed(0);
    setSeconds(0);
    setPaused(false);
    setNotes({});
    setWrongCells({});
    setHintCell(null);
    setPhase('playing');
  };

  const placeNumber = (value) => {
    if (!selected) return;
    const { row, col } = selected;
    if (initialBoard[row][col] !== 0) return;

    if (noteMode) {
      const key = `${row},${col}`;
      setNotes((n) => {
        const set = new Set(n[key] || []);
        if (set.has(value)) set.delete(value);
        else set.add(value);
        return { ...n, [key]: set };
      });
      sound.click?.();
      return;
    }
    if (!isValidMove(board, row, col, value)) {
      sound.wrong?.();
      setWrongCells((w) => ({ ...w, [`${row},${col}`]: true }));
      setMistakes((m) => m + 1);
      setTimeout(() => {
        setWrongCells((w) => {
          const next = { ...w };
          delete next[`${row},${col}`];
          return next;
        });
      }, 800);
      return;
    }

    sound.correct?.();
    setWrongCells((w) => {
      const next = { ...w };
      delete next[`${row},${col}`];
      return next;
    });

    const next = board.map((r) => [...r]);
    next[row][col] = value;
    setBoard(next);
    setNotes((n) => {
      const copy = { ...n };
      delete copy[`${row},${col}`];
      return copy;
    });
    if (isComplete(next)) {
      setTimeout(() => {
        setPhase('won');
        sound.win?.();
        const key = difficulty;
        const current = bestTimes[key];
        if (!current || seconds < current) {
          const next = { ...bestTimes, [key]: seconds };
          setBestTimes(next);
          try { localStorage.setItem('cs-game:sudoku:best', JSON.stringify(next)); } catch {}
        }
      }, 500);
    }
  };

  const clearCell = () => {
    if (!selected) return;
    const { row, col } = selected;
    if (initialBoard[row][col] !== 0) return;
    const next = board.map((r) => [...r]);
    next[row][col] = 0;
    setBoard(next);
    setNotes((n) => {
      const copy = { ...n };
      delete copy[`${row},${col}`];
      return copy;
    });
  };

  const useHint = () => {
    if (phase !== 'playing') return;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === 0) {
          const solution = solveSudoku(board);
          if (solution) {
            setBoard(solution);
            setHintCell({ row: r, col: c });
            setHintsUsed((h) => h + 1);
            setMistakes((m) => m + 1);
            sound.correct?.();
            setTimeout(() => setHintCell(null), 2000);
            if (isComplete(solution)) {
              setTimeout(() => {
                setPhase('won');
                sound.win?.();
                const key = difficulty;
                const current = bestTimes[key];
                if (!current || seconds < current) {
                  const next = { ...bestTimes, [key]: seconds };
                  setBestTimes(next);
                  try { localStorage.setItem('cs-game:sudoku:best', JSON.stringify(next)); } catch {}
                }
              }, 500);
            }
            return;
          }
        }
      }
    }
  };

  const reset = () => {
    setBoard(initialBoard.map((r) => [...r]));
    setNotes({});
    setWrongCells({});
    setSelected(null);
    setMistakes(0);
    setHintsUsed(0);
  };

  const exit = () => {
    setPhase('menu');
    setBoard([]);
    setInitialBoard([]);
    setSelected(null);
  };
  const selectedNotes = selected ? notes[`${selected.row},${selected.col}`] : null;
  const selectedValue = selected ? board[selected.row]?.[selected.col] : 0;
  const isHighlighted = (r, c) => {
    if (!selected) return false;
    if (r === selected.row || c === selected.col) return true;
    const boxR = Math.floor(selected.row / 3) * 3;
    const boxC = Math.floor(selected.col / 3) * 3;
    if (r >= boxR && r < boxR + 3 && c >= boxC && c < boxC + 3) return true;
    return false;
  };

  const isSameValue = (r, c) => {
    if (!selected || selectedValue === 0) return false;
    return board[r][c] === selectedValue;
  };

  const emptyCount = useMemo(() => countEmpty(board), [board]);

  /* ============ MENU ============ */
  if (phase === 'menu') {
    return (
      <section className="wrap">
        <a href="#games" className="btn sm" style={{ marginBottom: '1.5rem' }}>← Danh sách trò chơi</a>
        <p className="slogan" style={{ marginBottom: '.6rem' }}>Trò chơi 06 — Logic</p>
        <h1 style={{ marginBottom: '1rem' }}>Sudoku <em>hóa học</em></h1>
        <p className="hint" style={{ maxWidth: 620, marginBottom: '2rem' }}>
          Điền 9 nguyên tố vào lưới 9×9 sao cho mỗi hàng, cột và ô 3×3 đều có đủ 9 nguyên tố.
        </p>

        {/* Element legend */}
        <div className="csd-legend">
          {SUDOKU_ELEMENTS.map((e, i) => (
            <div key={e.key} className="csd-legend-item">
              <span className="csd-legend-num">{i + 1}</span>
              <span className="csd-legend-sym" style={{ background: e.color }}>{e.symbol}</span>
              <span className="csd-legend-name">{e.name}</span>
            </div>
          ))}
        </div>

        <div className="csd-diff-grid">
          {DIFFICULTIES.map((d) => {
            const best = bestTimes[d.key];
            return (
              <button
                key={d.key}
                className="csd-diff-card"
                onClick={() => startGame(d.key)}
                type="button"
              >
                <h3>{d.label}</h3>
                <p>{best ? `Kỷ lục: ${formatTime(best)}` : 'Chưa có kỷ lục'}</p>
                <span className="csd-diff-play">Chơi →</span>
              </button>
            );
          })}
        </div>

        <div className="csd-rules">
          <h3 className="lab-section-title">Luật chơi</h3>
          <ul>
            <li>Mỗi hàng ngang có đủ 9 nguyên tố, không trùng</li>
            <li>Mỗi cột dọc có đủ 9 nguyên tố, không trùng</li>
            <li>Mỗi ô vuông 3×3 có đủ 9 nguyên tố, không trùng</li>
            <li>Sai 3 lần → có thể vẫn tiếp tục nhưng sẽ mất điểm</li>
            <li>Dùng gợi ý sẽ bị trừ thời gian</li>
          </ul>
        </div>
      </section>
    );
  }

  /* ============ PLAYING ============ */
  if (phase === 'playing') {
    return (
      <section className="wrap csd-game">
        <GameBar paused={paused} onTogglePause={togglePause} />
        {paused && (
          <div className="gx-pause" role="status" style={{ position: 'fixed', background: 'var(--bg)', backdropFilter: 'none' }}>
            <b>Tạm dừng</b>
            <small style={{ color: 'var(--mut)' }}>Bàn cờ được ẩn trong lúc dừng</small>
            <button className="btn primary" type="button" onClick={togglePause}>Tiếp tục</button>
          </div>
        )}
        <div className="csd-header">
          <button className="btn sm" onClick={exit} type="button">← Menu</button>
          <div className="csd-stats">
            <span className="csd-stat">
              <small>Thời gian</small>
              <b>{formatTime(seconds)}</b>
            </span>
            <span className="csd-stat">
              <small>Còn trống</small>
              <b>{emptyCount}</b>
            </span>
            <span className="csd-stat">
              <small>Sai</small>
              <b style={{ color: mistakes > 0 ? 'var(--acc)' : 'inherit' }}>{mistakes}</b>
            </span>
            <span className="csd-stat">
              <small>Gợi ý</small>
              <b>{hintsUsed}</b>
            </span>
          </div>
        </div>

        <div className="csd-layout">
          {/* Board */}
          <div className="csd-board">
            {board.map((row, r) => (
              <div key={r} className="csd-row">
                {row.map((val, c) => {
                  const isGiven = initialBoard[r][c] !== 0;
                  const isSel = selected?.row === r && selected?.col === c;
                  const isHl = isHighlighted(r, c);
                  const isSame = isSameValue(r, c);
                  const isWrong = wrongCells[`${r},${c}`];
                  const isHint = hintCell?.row === r && hintCell?.col === c;
                  const cellNotes = notes[`${r},${c}`];
                  const el = val > 0 ? SUDOKU_ELEMENTS[val - 1] : null;
                  const boxBorderR = (c + 1) % 3 === 0 && c < 8;
                  const boxBorderB = (r + 1) % 3 === 0 && r < 8;

                  return (
                    <button
                      key={c}
                      className={
                        'csd-cell' +
                        (isGiven ? ' given' : '') +
                        (isSel ? ' selected' : '') +
                        (isHl ? ' highlight' : '') +
                        (isSame ? ' same' : '') +
                        (isWrong ? ' wrong' : '') +
                        (isHint ? ' hint' : '') +
                        (boxBorderR ? ' br' : '') +
                        (boxBorderB ? ' bb' : '')
                      }
                      onClick={() => setSelected({ row: r, col: c })}
                      type="button"
                    >
                      {val > 0 ? (
                        <span
                          className="csd-cell-sym"
                          style={isGiven ? { background: el.color } : undefined}
                        >
                          {el.symbol}
                        </span>
                      ) : cellNotes && cellNotes.size > 0 ? (
                        <div className="csd-notes">
                          {[1,2,3,4,5,6,7,8,9].map((n) => (
                            <span key={n} className="csd-note">
                              {cellNotes.has(n) ? SUDOKU_ELEMENTS[n - 1].symbol : ''}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Side panel */}
          <div className="csd-panel">
            {/* Number pad */}
            <div className="csd-pad">
              {SUDOKU_ELEMENTS.map((e, i) => {
                const n = i + 1;
                const used = board.flat().filter((v) => v === n).length;
                const done = used >= 9;
                return (
                  <button
                    key={e.key}
                    className={'csd-pad-btn' + (done ? ' done' : '')}
                    onClick={() => placeNumber(n)}
                    disabled={!selected || initialBoard[selected.row]?.[selected.col] !== 0}
                    type="button"
                  >
                    <span className="csd-pad-sym" style={{ background: e.color }}>{e.symbol}</span>
                    <span className="csd-pad-count">{used}/9</span>
                  </button>
                );
              })}
            </div>

            {/* Actions */}
            <div className="csd-actions">
              <button
                className={'btn sm' + (noteMode ? ' primary' : '')}
                onClick={() => setNoteMode(!noteMode)}
                type="button"
              >
                <GIcon name="pencil" /> Ghi chú {noteMode ? 'ON' : 'OFF'}
              </button>
              <button className="btn sm" onClick={clearCell} disabled={!selected} type="button">
                ⌫ Xóa
              </button>
              <button className="btn sm" onClick={useHint} type="button">
                <GIcon name="bulb" /> Gợi ý
              </button>
              <button className="btn sm" onClick={reset} type="button">
                ↻ Chơi lại
              </button>
            </div>

            <p className="hint" style={{ marginTop: '1rem' }}>
              Dùng phím số 1-9 để điền, mũi tên để di chuyển. Bật "Ghi chú" để đánh dấu các số có thể.
            </p>
          </div>
        </div>
      </section>
    );
  }

  /* ============ WON ============ */
  return (
    <section className="wrap">
      <div className="backdrop">
        <div className="gameover-modal">
          <h2><GIcon name="trophy" /> Hoàn thành!</h2>
          <div className="grade-big">
            <span>THỜI GIAN</span>
            <b>{formatTime(seconds)}</b>
          </div>
          <div className="csd-win-stats">
            <div><small>Sai</small><b>{mistakes}</b></div>
            <div><small>Gợi ý</small><b>{hintsUsed}</b></div>
            <div><small>Độ khó</small><b>{DIFFICULTIES.find((d) => d.key === difficulty)?.label}</b></div>
          </div>
          <div className="row center" style={{ marginTop: '1.5rem' }}>
            <button className="btn primary" onClick={() => startGame(difficulty)} type="button">
              Chơi lại
            </button>
            <button className="btn" onClick={exit} type="button">← Menu</button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============ HELPERS ============ */
function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}
function solveSudoku(board) {
  const b = board.map((r) => [...r]);
  if (solve(b)) return b;
  return null;
}

function solve(b) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (b[r][c] === 0) {
        for (let n = 1; n <= 9; n++) {
          if (isValidMove(b, r, c, n)) {
            b[r][c] = n;
            if (solve(b)) return true;
            b[r][c] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}