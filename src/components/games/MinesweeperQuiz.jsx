/* ============================================================
   MinesweeperQuiz.jsx — "DÒ MÌN KIẾN THỨC"
   ------------------------------------------------------------
   Cơ chế (lấy cảm hứng thể loại dò mìn kinh điển — code & thiết kế tự viết):
   • Lưới 4×4, 5 ô chứa MÌN, còn lại an toàn.
   • Bấm 1 ô:
       - Ô AN TOÀN  → câu hỏi thường (dễ/vừa) — đúng +100, sai -1 mạng
       - Ô MÌN      → câu hỏi GỠ MÌN (khó) — đúng +150 & gỡ mìn, sai -1 mạng
   • Mở hết các ô an toàn → thưởng 300 + qua ván mới (mìn nhiều hơn).
   • 3 mạng — câu hỏi lấy từ ngân hàng đề đã xuất bản (Supabase).
   ============================================================ */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchBankQuestions, pickRandom } from '../../lib/gameQuestionBank.js';
import GameOverModal from './GameOverModal.jsx';

const SIZE = 4;          // 4×4 = 16 ô
const MINES_PER_ROUND = [4, 5, 6, 7];   // mìn tăng theo ván

const mk = { card: { background: 'var(--t-surface-2, #fff)', border: '1px solid var(--t-border)', borderRadius: 'var(--t-r-lg, 20px)', padding: '1rem 1.1rem', boxShadow: 'var(--t-shadow-sm)' } };
const Ico = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);
const IC = {
  mine: 'M12 7a5 5 0 0 1 5 5c0 2-1 3-1 4H8c0-1-1-2-1-4a5 5 0 0 1 5-5zM12 3v2M5 12H3M21 12h-2M12 2l1.5 2',
  flag: 'M5 21V4c4-2 8 2 12 0v9c-4 2-8-2-12 0M5 21V4',
  back: 'M15 18l-6-6 6-6',
  shield: 'M12 3l7 3v6c0 4.2-2.9 7.9-7 9-4.1-1.1-7-4.8-7-9V6l7-3z',
  play: 'M5 3l14 9-14 9V3z',
};

export default function MinesweeperQuiz({ onExit }) {
  const [phase, setPhase] = useState('intro');        // intro | play | question | over
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [grid, setGrid] = useState(null);             // [{mine, revealed, defused}]
  const [picked, setPicked] = useState(null);         // index ô đang hỏi
  const [q, setQ] = useState(null);                   // câu hỏi hiện tại
  const [qKind, setQKind] = useState('normal');       // normal | defuse
  const [pool, setPool] = useState({ easy: [], hard: [] });
  const [loadingQ, setLoadingQ] = useState(false);
  const [qErr, setQErr] = useState('');
  const [pickedOpt, setPickedOpt] = useState(null);
  const [verdict, setVerdict] = useState(null);
  const [cleared, setCleared] = useState(0);

  /* ---- nạp câu hỏi: chia 2 kho dễ/khó ---- */
  const loadQ = useCallback(async () => {
    setLoadingQ(true); setQErr('');
    try {
      const pool = await fetchBankQuestions({ maxAnswerLen: 80, minWrong: 1, pool: 400 });
      const easy = pool.filter((x) => x.difficulty === 'easy' || x.difficulty === 'medium');
      const hard = pool.filter((x) => x.difficulty === 'hard' || x.difficulty === 'extreme');
      setPool({ easy: easy.length ? easy : pool, hard: hard.length ? hard : pool });
    } catch (e) {
      setQErr(e.message || 'Không tải được câu hỏi.');
    } finally {
      setLoadingQ(false);
    }
  }, []);

  useEffect(() => { if ((phase === 'intro' || phase === 'play') && !pool.easy.length && !loadingQ && !qErr) loadQ(); }, [phase]); // eslint-disable-line

  const newRound = useCallback((r) => {
    const cells = Array.from({ length: SIZE * SIZE }, (_, i) => ({ i, mine: false }));
    const mines = MINES_PER_ROUND[Math.min(r, MINES_PER_ROUND.length - 1)];
    const idx = [...cells.keys()].sort(() => Math.random() - 0.5).slice(0, mines);
    idx.forEach((i) => (cells[i].mine = true));
    setGrid(cells.map((c) => ({ ...c, revealed: false, defused: false })));
    setPicked(null); setQ(null); setPickedOpt(null); setVerdict(null);
  }, []);

  const startGame = () => {
    setRound(0); setScore(0); setLives(3); setCleared(0);
    setPhase('play');
    newRound(0);
  };

  const safeLeft = useMemo(() => (grid || []).filter((c) => !c.mine && !c.revealed).length, [grid]);

  const openCell = (i) => {
    if (!grid || grid[i].revealed || picked != null) return;
    const isMine = grid[i].mine;
    setPicked(i);
    setQKind(isMine ? 'defuse' : 'normal');
    const bank = isMine ? pool.hard : pool.easy;
    setQ(pickRandom(bank, 1)[0] || pickRandom(pool.easy, 1)[0] || null);
    setPickedOpt(null); setVerdict(null);
    setPhase('question');
  };

  const answer = (oi) => {
    if (picked == null || !q) return;
    const opts = q.options || [];
    const ok = oi === q.correct;
    setPickedOpt(oi);
    setVerdict(ok ? 'right' : 'wrong');

    setTimeout(() => {
      if (ok) {
        const pts = qKind === 'defuse' ? 150 : 100;
        setScore((s) => s + pts + round * 25);
        if (qKind === 'defuse') {
          setGrid((g) => g.map((c, k) => (k === picked ? { ...c, defused: true, revealed: true, mine: false } : c)));
        } else {
          setGrid((g) => g.map((c, k) => (k === picked ? { ...c, revealed: true } : c)));
        }
      } else {
        setLives((l) => l - 1);
        if (qKind === 'defuse') {
          setGrid((g) => g.map((c, k) => (k === picked ? { ...c, revealed: true } : c)));
        }
      }
      setPicked(null); setQ(null); setPickedOpt(null); setVerdict(null);
      setPhase('play');
    }, 1100);
  };

  /* ---- ván mới khi dò hết ô an toàn ---- */
  useEffect(() => {
    if (phase !== 'play' || !grid) return;
    const safeLeft2 = grid.filter((c) => !c.mine && !c.revealed).length;
    if (safeLeft2 === 0) {
      setCleared((c) => c + 1);
      setScore((s) => s + 300);
      const r = round + 1;
      setRound(r);
      setTimeout(() => newRound(r), 900);
    }
  }, [grid, phase]); // eslint-disable-line

  if (lives <= 0 && phase !== 'over') {
    return (
      <GameOverModal
        title="Dò Mìn Kiến thức — Kết thúc"
        score={score}
        extra={cleared > 0 ? `Đã dọn ${cleared} bảng` : undefined}
        onRestart={startGame}
      />
    );
  }

  /* ================= RENDER ================= */
  const shell = (children) => (
    <div style={{ minHeight: '100dvh', background: 'var(--t-bg, #f4f6fb)', color: 'var(--t-ink, #0f172a)', fontFamily: 'var(--t-font-sans, sans-serif)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '1rem 1rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.8rem', marginBottom: '.8rem' }}>
          <button
            type="button"
            onClick={() => (phase === 'intro' ? onExit?.() : setPhase('over'))}
            style={{ width: 40, height: 40, borderRadius: 12, border: '1px solid var(--t-border)', background: 'var(--t-surface-2, #fff)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
            title="Thoát"
          >
            <Ico d={IC.back} size={18} />
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, font: '800 1.15rem var(--t-font-sans)' }}>Dò Mìn <em style={{ color: '#10b981', fontStyle: 'italic' }}>Kiến thức</em></h1>
            <small style={{ color: 'var(--t-ink-muted, #64748b)', font: '600 .76rem var(--t-font-sans)' }}>
              Ván {round + 1} · {MINES_PER_ROUND[Math.min(round, MINES_PER_ROUND.length - 1)]} quả mìn · {safeLeft} ô an toàn còn lại
            </small>
          </div>
          <div style={{ textAlign: 'right' }}>
            <b style={{ font: '800 1.05rem var(--t-font-sans)', color: 'var(--t-accent, #5b6cff)' }}>{score}</b>
            <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end', marginTop: 3 }}>
              {[0, 1, 2].map((i) => (
                <span key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: i < lives ? 'var(--t-status-ok, #22c55e)' : 'var(--t-border, #ccc)' }} />
              ))}
            </div>
          </div>
        </div>
        {children}
      </div>
    </div>
  );

  /* ---- INTRO ---- */
  if (phase === 'intro') {
    return shell(
      <div style={{ ...mk.card, textAlign: 'center', padding: '1.6rem' }}>
        <div style={{ width: 68, height: 68, borderRadius: 20, background: 'rgba(16,185,129,.14)', color: '#10b981', display: 'grid', placeItems: 'center', margin: '0 auto .8rem' }}>
          <Ico d={IC.mine} size={34} />
        </div>
        <h2 style={{ margin: '0 0 .4rem', font: '800 1.3rem var(--t-font-sans)' }}>Dò Mìn <em style={{ color: '#10b981', fontStyle: 'italic' }}>Kiến thức</em></h2>
        <p style={{ maxWidth: 520, margin: '0 auto .9rem', color: 'var(--t-ink-muted, #64748b)', font: '500 .9rem var(--t-font-sans)', lineHeight: 1.55 }}>
          Lưới 4×4 có <b>mìn ẩn</b>. Bấm ô an toàn → trả lời câu hỏi thường.
          Dính <b>ô mìn</b> → phải gỡ bằng câu hỏi <b>độ khó cao</b> — gỡ được +150 điểm!
          Dọn sạch ô an toàn để qua ván mới, mìn nhiều hơn.
        </p>
        {qErr ? (
          <p style={{ color: 'var(--t-status-err, #dc2626)', font: '600 .85rem var(--t-font-sans)' }}>{qErr}</p>
        ) : (
          <button
            type="button"
            onClick={() => { startGame(); }}
            disabled={loadingQ}
            style={{ padding: '.7rem 1.6rem', borderRadius: 'var(--t-r-pill)', border: 'none', background: '#10b981', color: '#fff', font: '800 .95rem var(--t-font-sans)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '.5rem', opacity: loadingQ ? 0.6 : 1 }}
          >
            <Ico d={IC.play} size={16} /> {loadingQ ? 'Đang nạp câu hỏi…' : 'Bắt đầu dò'}
          </button>
        )}
      </div>
    );
  }

  /* ---- QUESTION ---- */
  if (phase === 'question' && picked != null && q) {
    const opts = q.options || [];
    return shell(
      <div style={{ display: 'grid', gap: '.8rem' }}>
        <div style={{ ...mk.card, borderLeft: `3px solid ${qKind === 'defuse' ? 'var(--t-status-err, #dc2626)' : '#10b981'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.5rem' }}>
            <span style={{
              padding: '.2rem .6rem', borderRadius: 999, font: '800 .72rem var(--t-font-sans)',
              background: qKind === 'defuse' ? 'var(--t-status-err-subtle, #fee2e2)' : 'rgba(16,185,129,.14)',
              color: qKind === 'defuse' ? 'var(--t-status-err, #dc2626)' : '#10b981',
            }}>
              {qKind === 'defuse' ? '💣 GỠ MÌN — câu khó (+150)' : '✅ Ô an toàn — câu thường (+100)'}
            </span>
          </div>
          <div style={{ font: '700 1.05rem var(--t-font-sans)', lineHeight: 1.5 }}>
            <Mathish text={q.question} />
          </div>
        </div>

        <div style={{ display: 'grid', gap: '.5rem' }}>
          {opts.map((o, i) => (
            <button
              key={i}
              type="button"
              disabled={pickedOpt != null}
              onClick={() => answer(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: '.6rem', padding: '.75rem .9rem',
                borderRadius: 'var(--t-r-md)', cursor: pickedOpt != null ? 'default' : 'pointer',
                border: `1.5px solid ${pickedOpt === i ? (verdict === 'right' ? 'var(--t-status-ok)' : 'var(--t-status-err)') : 'var(--t-border)'}`,
                background: pickedOpt === i
                  ? (verdict === 'right' ? 'var(--t-status-ok-subtle, #dcfce7)' : 'var(--t-status-err-subtle, #fee2e2)')
                  : 'var(--t-surface-2, #fff)',
                color: 'var(--t-ink)', textAlign: 'left', font: '600 .92rem var(--t-font-sans)',
              }}
            >
              <b style={{ color: 'var(--t-accent, #5b6cff)' }}>{String.fromCharCode(65 + i)}</b>
              <Mathish text={o} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ---- PLAY: lưới mìn ---- */
  return shell(
    <div style={{ display: 'grid', gap: '.8rem' }}>
      <div style={{ ...mk.card, padding: '.8rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${SIZE}, 1fr)`, gap: '.45rem' }}>
          {(grid || []).map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={() => openCell(i)}
              disabled={c.revealed || picked != null || qKind === 'defuse'}
              style={{
                aspectRatio: '1', borderRadius: 12, cursor: c.revealed ? 'default' : 'pointer',
                border: '1.5px solid ' + (c.revealed
                  ? (c.mine && !c.defused ? 'var(--t-status-err)' : '#10b981')
                  : 'var(--t-border)'),
                background: c.revealed
                  ? (c.mine && !c.defused ? 'var(--t-status-err-subtle, #fee2e2)' : '#d1fae5')
                  : 'var(--t-surface-3)',
                display: 'grid', placeItems: 'center',
                color: c.mine ? 'var(--t-status-err)' : '#10b981',
                fontSize: c.revealed ? 0 : 18, fontWeight: 800,
                opacity: c.revealed ? 0.9 : 1,
                transition: 'transform .1s ease',
              }}
              onMouseEnter={(e) => { if (!c.revealed) e.currentTarget.style.transform = 'scale(1.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
            >
              {c.revealed
                ? (c.mine && !c.defused ? <Ico d={IC.mine} size={22} /> : c.defused ? <Ico d={IC.shield} size={20} /> : <Ico d={IC.flag} size={20} />)
                : '?'}
            </button>
          ))}
        </div>
        <p style={{ margin: '.7rem 0 0', font: '600 .78rem var(--t-font-sans)', color: 'var(--t-ink-muted, #64748b)', textAlign: 'center' }}>
          Ô <b style={{ color: '#10b981' }}>xanh</b> = đã dò an toàn · Ô <b style={{ color: 'var(--t-status-err)' }}>đỏ gờ</b> = mìn đã gỡ bằng câu khó · Ô "?" chưa dò
        </p>
      </div>

      <div style={{ display: 'grid', gap: '.4rem' }}>
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
          <span style={{ padding: '.3rem .7rem', borderRadius: 999, background: 'var(--t-surface-3)', font: '600 .76rem var(--t-font-sans)', color: 'var(--t-ink-muted)' }}>
            Ván {round + 1} — dọn sạch {SIZE * SIZE - MINES_PER_ROUND[Math.min(round, MINES_PER_ROUND.length - 1)]} ô an toàn để nhận +300
          </span>
        </div>
      </div>
    </div>
  );
}

/* render $...$ LaTeX tối giản (giống CameraGame) */
function Mathish({ text }) {
  const parts = String(text || '').split(/(\$[^$]+\$)/g);
  return (
    <span>
      {parts.map((p, i) => (
        p.startsWith('$') && p.length > 2
          ? <i key={i} style={{ fontStyle: 'italic', fontFamily: 'Georgia, serif' }}>
              {p.replaceAll('$', '')
                .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1)/($2)')
                .replace(/\\sqrt\{([^{}]*)\}/g, '√($1)')
                .replace(/\^2/g, '²').replace(/\^3/g, '³')
                .replace(/\\(left|right|;|,|quad| )/g, ' ')}
            </i>
          : <span key={i}>{p}</span>
      ))}
    </span>
  );
}
