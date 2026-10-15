/* ============================================================
   CameraGame.jsx — ENGINE TRÒ CHƠI CAMERA (Apple style)
   ------------------------------------------------------------
   Camera LUÔN render (không conditional) → stream không bị mất khi đổi phase.
   Giao diện: thẻ trắng sạch, viền mảnh, bo góc, bóng đổ nhẹ — giống Teacher.
   Quy tắc SVG-only ✓
   ============================================================ */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGameCamera } from '../../hooks/useGameCamera.js';
import { CAMERA_GAME_BY_ID, CAMERA_GAMES } from '../../lib/cameraGames.js';
import { fetchBankQuestions, fetchMyBankQuestions, pickRandom } from '../../lib/gameQuestionBank.js';
import { useAuth } from '../../hooks/useAuth.jsx';
import GameOverModal from './GameOverModal.jsx';

/* ---------- ICONS (SVG-only) ---------- */
const Ico = ({ d, size = 20, sw = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);
const ICONS = {
  hand: 'M7 11V5a1.5 1.5 0 0 1 3 0v6M10 11V3.5a1.5 1.5 0 0 1 3 0V11M13 11V5a1.5 1.5 0 0 1 3 0v7M16 10.5l1.8-1.8a1.4 1.4 0 0 1 2 2L14 17c-1.5 1.5-4 2-6.5 1L4 15.5',
  eye: 'M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z M12 12m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0',
  lean: 'M12 3v18M5 8l7-5 7 5M3 21h18',
  smile: 'M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18zM9 10h.01M15 10h.01M8.5 14s1.3 2.2 3.5 2.2 3.5-2.2 3.5-2.2',
  snow: 'M12 2v20M3.5 7l17 10M20.5 7l-17 10M12 6l3-3M12 6L9 3M12 18l3 3M12 18l-3 3',
  hide: 'M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6zM4 4l16 16',
  duo: 'M9 11a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7zM2 21v-1a6 6 0 0 1 12 0v1M17 11a3.5 3.5 0 1 0 0-7M22 21v-1a6 6 0 0 0-5-5.9',
  bolt: 'M13 2 4 14h6l-1 8 9-12h-6l1-8z',
  exercise: 'M12 3v6M4.5 21 12 9l7.5 12M3 3h18',
  squat: 'M12 21a5 5 0 1 1 0-10 5 5 0 0 1 0 10zM12 2v6M5 21h14',
  clap: 'M8 3v9M16 3v9M4 12h16M12 12v9',
  cam: 'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  back: 'M15 18l-6-6 6-6',
  play: 'M5 3l14 9-14 9V3z',
};

const MODE_HINT = {
  fingers: 'Giơ số ngón = thứ tự phương án',
  look: 'Nhìn về phía phương án đúng',
  point: 'Chỉ ngón trỏ về phía phương án',
  lean: 'Nghiêng người sang phía phương án',
  smile: 'Chọn đáp án rồi cười tươi',
  freeze: 'Trả lời rồi ĐỨNG IM 4 giây',
  hide: 'RỜI KHUNG khi thám tử bật đèn',
  faces: 'Cần 2 người trong khung',
  hands: 'Đèn xanh bật mới giơ tay',
  exercise: 'Làm động tác thể dục theo lệnh',
  emotion: 'Diễn đúng biểu cảm AI ra lệnh',
  stare: 'Nhìn chăm camera không chớp mắt',
  squat: 'SQUAT hạ người xuống',
  clap: 'Vỗ tay 3 cái',
};

const CORRECT_BONUS = { exercise: 50, emotion: 50, stare: 80, squat: 40, clap: 60 };
const CHALLENGE_MS = { exercise: 7000, emotion: 6000, stare: 8000, squat: 6000, clap: 6000 };

/* ---------- Reusable inline styles (Apple) ---------- */
const A = {
  page: { minHeight: '100dvh', background: 'var(--t-bg, #f4f6fb)', color: 'var(--t-ink, #0f172a)', fontFamily: 'var(--t-font-sans, -apple-system, sans-serif)', WebkitFontSmoothing: 'antialiased' },
  wrap: { maxWidth: 860, margin: '0 auto', padding: '1.2rem 1rem 2.5rem' },
  card: { background: 'var(--t-surface-2, #fff)', border: '1px solid var(--t-border, rgba(100,120,180,.16))', borderRadius: 'var(--t-r-lg, 20px)', boxShadow: 'var(--t-shadow-sm)' },
  btnPrimary: { padding: '.65rem 1.4rem', borderRadius: 'var(--t-r-pill, 999px)', border: 'none', background: 'var(--t-accent, #5b6cff)', color: 'var(--t-accent-ink, #fff)', font: '700 .88rem var(--t-font-sans)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '.45rem' },
  btnGhost: { padding: '.55rem 1.1rem', borderRadius: 'var(--t-r-pill, 999px)', border: '1px solid var(--t-border)', background: 'transparent', color: 'var(--t-ink)', font: '600 .82rem var(--t-font-sans)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '.4rem' },
  label: { font: '700 .66rem var(--t-font-sans)', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--t-ink-faint, #94a3b8)' },
};

function MathTextish({ text }) {
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

function CamChip({ on, label }) {
  return (
    <span style={{
      padding: '.18rem .5rem', borderRadius: 999, font: '700 .64rem var(--t-font-sans)',
      background: on ? 'rgba(34,197,94,.15)' : 'rgba(100,120,180,.08)',
      color: on ? 'var(--t-status-ok, #16a34a)' : 'var(--t-ink-faint, #94a3b8)',
      border: `1px solid ${on ? 'rgba(34,197,94,.3)' : 'var(--t-border, rgba(100,120,180,.16))'}`,
    }}>
      {label}
    </span>
  );
}

/* ================= GAME ================= */
export default function CameraGame({ gameId, onExit }) {
  const game = CAMERA_GAME_BY_ID[gameId] || CAMERA_GAMES[0];
  const [phase, setPhase] = useState('intro');
  const [questions, setQuestions] = useState([]);
  const [loadingQ, setLoadingQ] = useState(false);
  const [qErr, setQErr] = useState('');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [streak, setStreak] = useState(0);
  const [qi, setQi] = useState(0);
  const [locked, setLocked] = useState(null);
  const [verdict, setVerdict] = useState(null);
  const [hold, setHold] = useState(0);
  const [slotHint, setSlotHint] = useState(-1);
  const [challenge, setChallenge] = useState('');
  const [challengePhase, setChallengePhase] = useState(null);
  const [hideWatch, setHideWatch] = useState(false);
  const [gate, setGate] = useState(false);
  const [gateWon, setGateWon] = useState(false);
  const [gateLate, setGateLate] = useState(false);

  const { user } = useAuth();
  const cam = useGameCamera({ mode: game.mode, enabled: phase !== 'over' });
  const { signals } = cam;

  const lockedRef = useRef(null); lockedRef.current = locked;
  const holdRef = useRef(0);
  const challengeRef = useRef({ startedAt: 0, progress: 0, claps: 0, lastClap: 0 });

  const resetRound = useCallback(() => {
    setLocked(null); setVerdict(null); setHold(0); setSlotHint(-1);
    setChallenge(''); setChallengePhase(null);
    setHideWatch(false); setGate(false); setGateWon(false); setGateLate(false);
    holdRef.current = 0; challengeRef.current = { startedAt: 0, progress: 0, claps: 0, lastClap: 0 };
  }, []);

  const advance = useCallback(() => {
    resetRound();
    setQi((v) => v + 1);
    setLives((l) => (l <= 0 ? 0 : l));
  }, [resetRound]);

  const loadQ = useCallback(async () => {
    setLoadingQ(true); setQErr('');
    try {
      const [supaRes, myQ] = await Promise.all([
        fetchBankQuestions({ maxAnswerLen: 70, minWrong: 1, pool: 300 }),
        fetchMyBankQuestions(user?.uid),
      ]);
      const pool = [
        ...(Array.isArray(myQ) ? myQ : []),
        ...(Array.isArray(supaRes?.eligible) ? supaRes.eligible : []),
      ];
      const pick = pickRandom(pool, 10);
      if (!pick.length) setQErr('Ngân hàng câu hỏi trống — hãy xuất bản đề hoặc thêm câu vào ngân hàng trước.');
      setQuestions(pick);
    } catch (e) {
      setQErr(e.message || 'Không tải được câu hỏi.');
    } finally {
      setLoadingQ(false);
    }
  }, [user?.uid]);

  useEffect(() => { if (phase === 'intro' && !questions.length && !loadingQ && !qErr) loadQ(); }, [phase, user?.uid]); // eslint-disable-line

  const start = () => { setScore(0); setLives(3); setStreak(0); setQi(0); resetRound(); setPhase('play'); };

  const q = questions[qi] || null;
  const opts = useMemo(() => {
    if (!q) return [];
    const right = { text: q.correct, isRight: true };
    const wrong = (q.wrong || []).map((t) => ({ text: t, isRight: false }));
    if (game.mode === 'lean') return [right, wrong[0] || { text: '—', isRight: false }].sort(() => Math.random() - 0.5);
    if (game.mode === 'look' || game.mode === 'point') return [right, ...wrong.slice(0, 2)].sort(() => Math.random() - 0.5);
    return [right, ...wrong].sort(() => Math.random() - 0.5);
  }, [q, game.mode]);

  const settle = useCallback((idx) => {
    const chosen = opts[idx];
    const ok = !!chosen?.isRight;
    setLocked(idx);
    setVerdict(ok ? 'right' : 'wrong');
    if (ok) { setScore((s) => s + 100 + streak * 10); setStreak((s) => s + 1); }
    else { setStreak(0); setLives((l) => l - 1); }
    setHold(0); setSlotHint(-1);

    if (!ok) { setTimeout(() => advance(), 1100); return; }
    if (game.mode === 'freeze') { setChallengePhase('run'); challengeRef.current.startedAt = Date.now(); setTimeout(() => advance(), 4000); return; }
    if (game.mode === 'hide') { setHideWatch(true); return; }
    if (game.mode === 'smile' || game.mode === 'faces') return;
    if (game.mode in CHALLENGE_MS) {
      const moves = ['Giơ 2 tay cao quá đầu', 'Dang 2 tay rộng hết cỡ', 'Buông 2 tay xuôi thân người'];
      const emos = ['VUI — CƯỜI TƯƠI', 'NGẮC NHIÊN — MỞ MIỆNG', 'NHÍNH MŨI — ÉO MÔI', 'NGHIÊM TÚC — HẠ LÔNG MÀY'];
      setChallenge(
        game.mode === 'exercise' ? moves[Math.floor(Math.random() * moves.length)]
          : game.mode === 'emotion' ? emos[Math.floor(Math.random() * emos.length)]
            : game.mode === 'stare' ? 'NHÌN CHĂM CAMERA — KHÔNG CHỚP MẮT'
              : game.mode === 'squat' ? 'SQUAT — HẠ NGƯỜI XUỐNG'
                : 'VỖ TAY 3 CÁI'
      );
      setChallengePhase('run');
      challengeRef.current = { startedAt: Date.now(), progress: 0, claps: 0, lastClap: 0 };
      return;
    }
    setTimeout(() => advance(), 1100);
  }, [opts, streak, game.mode, advance]);

  const settleRef = useRef(null); settleRef.current = settle;

  /* ============================================================
     TICK — chạy liên tục khi đang chơi (kể cả locked: có mode chốt
     bằng camera SAU khi chọn đáp án)
     ============================================================ */
  useEffect(() => {
    if (phase !== 'play' || !q) return undefined;

    const iv = setInterval(() => {
      const m = game.mode;
      const s = signals;
      const isLocked = lockedRef.current != null;

      /* ---- A. chốt đáp án bằng camera (khi CHƯA lock) ---- */
      if (!isLocked) {
        if (m === 'fingers') {
          if (s.fingersUp > 0) {
            const idx = s.fingersUp - 1;
            if (idx < opts.length) {
              setSlotHint(idx);
              holdRef.current = Math.min(1, holdRef.current + 120 / (game.holdMs || 2200));
              setHold(holdRef.current);
              if (holdRef.current >= 1) { settleRef.current(idx); return; }
            } else { setSlotHint(-1); holdRef.current = 0; setHold(0); }
          } else { setSlotHint(-1); holdRef.current = 0; setHold(0); }
        }

        if (m === 'look' || m === 'point') {
          const x = (m === 'point' ? s.indexX : s.noseX) ?? null;
          let slot = -1;
          if (x != null) { if (x < -0.3) slot = 0; else if (x > 0.3) slot = 2; else slot = 1; }
          setSlotHint(slot);
          if (slot >= 0) {
            holdRef.current = Math.min(1, holdRef.current + 120 / (game.holdMs || 1800));
            setHold(holdRef.current);
            if (holdRef.current >= 1) { settleRef.current(slot); return; }
          } else { holdRef.current = 0; setHold(0); }
        }

        if (m === 'lean') {
          let slot = -1;
          if (s.noseX < -0.5) slot = 0; else if (s.noseX > 0.5) slot = 1;
          setSlotHint(slot);
          if (slot >= 0) {
            holdRef.current = Math.min(1, holdRef.current + 120 / (game.holdMs || 1400));
            setHold(holdRef.current);
            if (holdRef.current >= 1) { settleRef.current(slot); return; }
          } else { holdRef.current = 0; setHold(0); }
        }
      }

      /* ---- B. THỬ THÁCH camera sau khi trả lời đúng ---- */
      if (isLocked && challengePhase === 'run') {
        const el = challengeRef.current;
        const dt = Date.now() - el.startedAt;
        let hit = false;

        if (m === 'exercise') {
          if (challenge.includes('cao quá đầu')) hit = s.faces > 0 && s.wristY != null && s.wristY < s.noseY - 0.02;
          else if (challenge.includes('rộng')) hit = s.handPresent && s.spread > 0.55;
          else if (challenge.includes('xuôi')) hit = s.faces > 0 && s.wristY != null && s.wristY > 0.72;
          if (hit) el.progress = Math.min(1, el.progress + 120 / 2500);
          setHold(el.progress);
          if (dt > 7000) { setChallengePhase('fail'); setTimeout(advance, 900); return; }
          if (el.progress >= 1) { setChallengePhase('ok'); setScore((v) => v + CORRECT_BONUS.exercise); setTimeout(advance, 900); return; }
        }

        if (m === 'emotion') {
          if (challenge.startsWith('VUI')) hit = s.smile > 0.5;
          else if (challenge.startsWith('NGẮC')) hit = s.jaw > 0.45 && s.brow > 0.35;
          else if (challenge.startsWith('NHÍNH')) hit = s.pucker > 0.5;
          else if (challenge.startsWith('NGHIÊM')) hit = s.browDown > 0.45 && s.smile < 0.25;
          if (hit) el.progress = Math.min(1, el.progress + 120 / 2000);
          setHold(el.progress);
          if (dt > 6000) { setChallengePhase('fail'); setTimeout(advance, 900); return; }
          if (el.progress >= 1) { setChallengePhase('ok'); setScore((v) => v + CORRECT_BONUS.emotion); setTimeout(advance, 900); return; }
        }

        if (m === 'stare') {
          if (s.blink > 0.5) { setChallengePhase('fail'); setTimeout(advance, 900); return; }
          setHold(Math.min(1, dt / 8000));
          if (dt > 8000) { setChallengePhase('ok'); setScore((v) => v + CORRECT_BONUS.stare); setTimeout(advance, 900); return; }
        }

        if (m === 'squat') {
          if (s.noseY > 0.62) el.progress = Math.min(1, el.progress + 120 / 2000);
          setHold(el.progress);
          if (dt > 6000) { setChallengePhase('fail'); setTimeout(advance, 900); return; }
          if (el.progress >= 1) { setChallengePhase('ok'); setScore((v) => v + CORRECT_BONUS.squat); setTimeout(advance, 900); return; }
        }

        if (m === 'clap') {
          if (s.handPresent && s.spread > 0 && s.spread < 0.16 && Date.now() - el.lastClap > 350) {
            el.claps++; el.lastClap = Date.now();
          }
          el.progress = Math.min(1, el.claps / 3);
          setHold(el.progress);
          if (el.claps >= 3) { setChallengePhase('ok'); setScore((v) => v + CORRECT_BONUS.clap); setTimeout(advance, 900); return; }
          if (dt > 6000) { setChallengePhase('fail'); setTimeout(advance, 900); return; }
        }
      }

      /* ---- C. smile: cười để chốt (sau khi trả lời đúng) ---- */
      if (m === 'smile' && isLocked && verdictRef.current === 'right' && challengePhase === null) {
        if (s.smile > 0.35) { setScore((v) => v + 30); advance(); }
      }

      /* ---- C2. faces: cần 2 NGƯỜI trong khung để chốt điểm kép ---- */
      if (m === 'faces' && isLocked && verdictRef.current === 'right' && challengePhase === null) {
        if (s.faces >= 2) {
          holdRef.current = Math.min(1, holdRef.current + 120 / 1500);
          setHold(holdRef.current);
          if (holdRef.current >= 1) { setScore((v) => v + 50); advance(); }
        } else { holdRef.current = 0; setHold(0); }
      }

      /* ---- D. hide — thám tử quan sát: nấp 3 giây → thắng, lộ mặt → mất mạng ---- */
      if (m === 'hide' && hideWatch) {
        if (s.faces > 0) {
          setHideWatch(false);
          setVerdict('caught');
          setLives((l) => l - 1);
          holdRef.current = 0; setHold(0);
          setTimeout(advance, 1100);
        } else {
          holdRef.current = Math.min(1, holdRef.current + 120 / 3000);
          setHold(holdRef.current);
          if (holdRef.current >= 1) {
            setHideWatch(false);
            setScore((v) => v + 40);
            advance();
          }
        }
      }

      /* ---- E. hands — đèn xanh → giơ tay ---- */
      if (m === 'hands' && gate && !gateWon && !gateLate) {
        if (s.fingersUp >= 4) { setGateWon(true); setGate(false); }
      }
    }, 120);
    return () => clearInterval(iv);
  }, [phase, q, signals, opts, game.mode, game.holdMs, challenge, challengePhase, hideWatch, gate, gateWon, gateLate]); // eslint-disable-line

  /* ---- mode hands: hẹn đèn xanh ---- */
  useEffect(() => {
    if (phase !== 'play' || game.mode !== 'hands' || !q || locked != null || gate) return undefined;
    const wait = setTimeout(() => { setGate(true); setTimeout(() => setGateLate(true), 2000); }, 2000 + Math.random() * 3000);
    return () => clearTimeout(wait);
  }, [qi, phase, game.mode, q, gate]); // eslint-disable-line

  const answerClick = (idx) => {
    if (locked != null) return;
    if (game.mode === 'fingers' || game.mode === 'look' || game.mode === 'point' || game.mode === 'lean') return;
    settle(idx);
  };

  const camOk = cam.status === 'ready';
  const over = lives <= 0;
  const verdictRef = useRef(null); verdictRef.current = verdict;

  /* ================= RENDER ================= */
  if (phase === 'over') {
    return <GameOverModal title={`${game.name} — Kết thúc`} score={score} onRestart={start} />;
  }

  return (
    <div style={A.page}>
      <div style={A.wrap}>
        {/* ===== HEAD ===== */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem', marginBottom: '1rem' }}>
          <button
            type="button"
            onClick={() => (phase === 'play' ? setPhase('over') : onExit?.())}
            title="Thoát"
            style={{ width: 38, height: 38, borderRadius: 'var(--t-r-md, 14px)', border: '1px solid var(--t-border)', background: 'var(--t-surface-2, #fff)', color: 'var(--t-ink)', cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0 }}
          >
            <Ico d={ICONS.back} size={17} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ margin: 0, font: '800 1.05rem var(--t-font-sans)', color: 'var(--t-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {game.name} <em style={{ color: game.color, fontStyle: 'italic' }}>{game.titleEm}</em>
            </h1>
            <small style={{ color: 'var(--t-ink-muted, #64748b)', font: '600 .74rem var(--t-font-sans)' }}>{game.tag}</small>
          </div>
          {phase === 'play' && (
            <div style={{ display: 'flex', gap: '.7rem', alignItems: 'center', flexShrink: 0 }}>
              <span style={{ font: '800 1.05rem var(--t-font-sans)', color: 'var(--t-accent, #5b6cff)', fontVariantNumeric: 'tabular-nums' }}>{score}</span>
              <span style={{ display: 'flex', gap: 2.5 }}>
                {[0, 1, 2].map((i) => (
                  <span key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: i < lives ? 'var(--t-status-ok, #16a34a)' : 'var(--t-border)' }} />
                ))}
              </span>
            </div>
          )}
        </div>

        {/* ===== CAMERA — LUÔN RENDER (không conditional) ===== */}
        <div style={{
          position: 'relative', borderRadius: 'var(--t-r-lg, 20px)', overflow: 'hidden',
          background: '#0b1020', aspectRatio: '4/3', maxWidth: 420,
          margin: phase === 'play' ? '0 auto 1rem' : '0 0 -9999px',
          height: phase === 'play' ? 'auto' : 0,
          opacity: camOk ? 1 : 0.15,
          border: `1px solid ${camOk ? 'var(--t-border)' : 'transparent'}`,
          display: phase === 'intro' ? 'none' : 'block',
        }}>
          <video
            ref={cam.videoRef}
            muted playsInline autoPlay
            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
          />
          {cam.status !== 'ready' && (
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#94a3b8', textAlign: 'center', padding: '.8rem', font: '600 .78rem var(--t-font-sans)' }}>
              {cam.status === 'loading' ? 'Đang mở camera…' : cam.error || 'Camera chưa sẵn sàng'}
            </div>
          )}
          {camOk && phase === 'play' && (
            <div style={{ position: 'absolute', left: 10, bottom: 10, display: 'flex', gap: '.3rem', flexWrap: 'wrap' }}>
              <CamChip on={signals.faces > 0} label={`${signals.faces} mặt`} />
              {(game.mode === 'fingers' || game.mode === 'hands') && <CamChip on={signals.fingersUp > 0} label={`${signals.fingersUp} ngón`} />}
              {game.mode === 'smile' && <CamChip on={signals.smile > 0.35} label="cười" />}
              {game.mode === 'stare' && <CamChip on={signals.blink < 0.3} label="nhìn" />}
            </div>
          )}
        </div>

        {/* ===== INTRO ===== */}
        {phase === 'intro' && (
          <div style={{ ...A.card, textAlign: 'center', padding: '1.8rem 1.4rem' }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: `${game.color}18`, color: game.color, display: 'grid', placeItems: 'center', margin: '0 auto .75rem' }}>
              <Ico d={ICONS[game.iconKey] || ICONS.bolt} size={30} sw={1.6} />
            </div>
            <h2 style={{ margin: '0 0 .3rem', font: '800 1.25rem var(--t-font-sans)', color: 'var(--t-ink)' }}>
              {game.name} <em style={{ color: game.color, fontStyle: 'italic' }}>{game.titleEm}</em>
            </h2>
            <p style={{ maxWidth: 500, margin: '0 auto .8rem', color: 'var(--t-ink-muted, #64748b)', font: '500 .88rem var(--t-font-sans)', lineHeight: 1.55 }}>{game.desc}</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 auto 1rem', maxWidth: 400, textAlign: 'left', display: 'grid', gap: '.3rem', color: 'var(--t-ink-2, #334155)', font: '500 .82rem var(--t-font-sans)' }}>
              <li style={{ display: 'flex', gap: '.4rem', alignItems: 'center' }}>
                <Ico d={ICONS.cam} size={14} /> Cần camera — không chơi được khi chặn quyền
              </li>
              <li>• 10 câu hỏi từ ngân hàng đề đã xuất bản</li>
              <li>• 3 mạng — sai đáp án hoặc vi phạm trừ mạng</li>
            </ul>
            {qErr ? (
              <p style={{ color: 'var(--t-status-err, #dc2626)', font: '600 .85rem var(--t-font-sans)', marginBottom: '.8rem' }}>{qErr}</p>
            ) : (
              <button type="button" onClick={start} disabled={loadingQ} style={{ ...A.btnPrimary, opacity: loadingQ ? 0.6 : 1 }}>
                <Ico d={ICONS.play} size={15} /> {loadingQ ? 'Đang nạp…' : 'Bắt đầu chơi'}
              </button>
            )}
          </div>
        )}

        {/* ===== PLAY ===== */}
        {phase === 'play' && (
          <>
            {/* CÂU HỎI + ĐÁP ÁN */}
            <div style={{ ...A.card, padding: '1.1rem 1.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '.6rem', marginBottom: '.65rem' }}>
                <span style={{ ...A.label, fontSize: '.62rem' }}>
                  Câu {qi + 1}/{questions.length}
                </span>
                <span style={{ font: '600 .72rem var(--t-font-sans)', color: 'var(--t-ink-faint, #94a3b8)', fontStyle: 'italic' }}>
                  {MODE_HINT[game.mode]}
                </span>
              </div>

              <div style={{ font: '700 1rem var(--t-font-sans)', color: 'var(--t-ink)', lineHeight: 1.5, marginBottom: '.75rem' }}>
                {q ? <MathTextish text={q.question} /> : '…'}
              </div>

              <div style={{ display: 'grid', gap: '.45rem' }}>
                {opts.map((o, i) => {
                  const camSlot = game.mode === 'look' || game.mode === 'point'
                    ? (i === 0 ? 'trái' : i === 1 ? 'giữa' : 'phải')
                    : game.mode === 'fingers' ? `giơ ${i + 1} ngón`
                      : game.mode === 'lean' ? (i === 0 ? 'TRÁI' : 'PHẢI') : null;
                  const isHint = slotHint === i && locked == null;
                  const isLocked = locked === i;
                  const isRight = isLocked && verdict === 'right';
                  const isWrong = isLocked && verdict === 'wrong';

                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={locked != null}
                      onClick={() => answerClick(i)}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: '.55rem', padding: '.65rem .85rem',
                        borderRadius: 'var(--t-r-md, 14px)', cursor: locked != null ? 'default' : 'pointer',
                        border: `1.5px solid ${
                          isRight ? 'var(--t-status-ok, #16a34a)'
                            : isWrong ? 'var(--t-status-err, #dc2626)'
                              : isHint ? game.color : 'var(--t-border, rgba(100,120,180,.16))'
                        }`,
                        background: isRight ? 'var(--t-status-ok-subtle, #dcfce7)'
                          : isWrong ? 'var(--t-status-err-subtle, #fee2e2)'
                            : isHint ? `color-mix(in srgb, ${game.color} 8%, var(--t-surface-2))`
                              : 'var(--t-surface-2, #fff)',
                        color: 'var(--t-ink)', textAlign: 'left', font: '600 .88rem var(--t-font-sans)',
                        lineHeight: 1.4, transition: 'border-color .15s, background .15s',
                      }}
                    >
                      <b style={{ font: '800 .78rem var(--t-font-sans)', color: isRight ? 'var(--t-status-ok)' : isWrong ? 'var(--t-status-err)' : 'var(--t-accent)', minWidth: 18, flexShrink: 0, marginTop: 1 }}>
                        {String.fromCharCode(65 + i)}
                      </b>
                      <span style={{ flex: 1, minWidth: 0 }}><MathTextish text={o.text} /></span>
                      {camSlot && (
                        <small style={{ color: isHint ? game.color : 'var(--t-ink-faint)', font: '700 .68rem var(--t-font-sans)', flexShrink: 0, marginTop: 1 }}>
                          {camSlot}
                        </small>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Hold progress bar */}
              {hold > 0 && (locked == null || game.mode === 'hide') && (
                <div style={{ height: 5, borderRadius: 999, background: 'var(--t-surface-3)', overflow: 'hidden', marginTop: '.65rem' }}>
                  <div style={{ width: `${Math.round(hold * 100)}%`, height: '100%', background: game.color, borderRadius: 'inherit', transition: 'width .1s linear' }} />
                </div>
              )}

              {/* Feedback */}
              <div style={{ marginTop: '.65rem', display: 'grid', gap: '.35rem' }}>
                {verdict === 'right' && locked != null && game.mode === 'smile' && (
                  <p style={{ margin: 0, font: '700 .82rem var(--t-font-sans)', color: 'var(--t-accent)' }}>Cười tươi lên camera để chốt điểm!</p>
                )}
                {verdict === 'right' && locked != null && game.mode === 'faces' && (
                  <p style={{ margin: 0, font: '700 .82rem var(--t-font-sans)', color: 'var(--t-accent)' }}>Gọi thêm 1 người vào khung camera để nhận +50 điểm kép!</p>
                )}
                {verdict === 'caught' && (
                  <p style={{ margin: 0, font: '700 .82rem var(--t-font-sans)', color: 'var(--t-status-err)' }}>Bị thám tử bắt — trừ 1 mạng!</p>
                )}
                {verdict === 'right' && locked != null && game.mode === 'hide' && (
                  <p style={{ margin: 0, font: '700 .82rem var(--t-font-sans)', color: 'var(--t-accent)' }}>RỜI KHUNG CAMERA ngay — nấp 3 giây để nhận +40!</p>
                )}
                {challengePhase === 'run' && challenge && (
                  <p style={{ margin: 0, font: '800 .92rem var(--t-font-sans)', color: 'var(--t-accent)', textAlign: 'center', padding: '.5rem', background: 'var(--t-accent-subtle)', borderRadius: 'var(--t-r-md)' }}>
                    {challenge.includes('NHÌN') ? challenge : `LÀM NGAY: ${challenge}`}
                  </p>
                )}
                {challengePhase === 'ok' && (
                  <p style={{ margin: 0, font: '700 .82rem var(--t-font-sans)', color: 'var(--t-status-ok)', textAlign: 'center' }}>
                    Hoàn thành thử thách! +{CORRECT_BONUS[game.mode] || 0} điểm
                  </p>
                )}
                {challengePhase === 'fail' && (
                  <p style={{ margin: 0, font: '700 .82rem var(--t-font-sans)', color: 'var(--t-status-warn)', textAlign: 'center' }}>
                    Hết thời gian — không có thưởng
                  </p>
                )}
                {game.mode === 'hands' && gate && !gateWon && locked == null && (
                  <p style={{ margin: 0, font: '800 .95rem var(--t-font-sans)', color: 'var(--t-status-ok)', textAlign: 'center', padding: '.4rem', background: 'var(--t-status-ok-subtle)', borderRadius: 'var(--t-r-md)' }}>
                    GIƠ TAY NGAY!
                  </p>
                )}
                {game.mode === 'hands' && gateLate && !gateWon && locked == null && (
                  <p style={{ margin: 0, font: '700 .82rem var(--t-font-sans)', color: 'var(--t-status-warn)', textAlign: 'center' }}>
                    Chậm mất rồi — câu này bỏ qua
                  </p>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ height: 4, borderRadius: 999, background: 'var(--t-surface-3)', overflow: 'hidden', marginTop: '.8rem' }}>
              <div style={{
                width: `${Math.min(100, ((qi + 1) / Math.max(questions.length, 1)) * 100)}%`,
                height: '100%', background: 'var(--t-accent, #5b6cff)', borderRadius: 'inherit',
                transition: 'width .3s ease',
              }} />
            </div>
          </>
        )}
      </div>

      {over && <GameOverModal title={`${game.name} — Kết thúc`} score={score} onRestart={start} />}
    </div>
  );
}
