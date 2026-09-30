import { useState, useEffect, useRef } from 'react';
import QuestionEditor from './QuestionEditor';
import GameOverModal from './GameOverModal';
import { GAME_PRESETS } from '../../data/gamePresets';
import { sound } from '../../lib/gameSound';

const FIELD_W = 900;
const FIELD_H = 560;
const CHICKEN_W = 110;
const CHICKEN_H = 130;
const PADDING = 40;

const DEFAULT_CONFIG = {
  speed: 1,
  chickenCount: 5,
  timeLimit: 30,
  playerName: '',
  twoPlayer: false,
  p2Name: '',
  powerups: true,
  difficultyRamp: false,
};

const SPEED_PRESETS = [
  { key: 'slow',   label: 'Chậm',  mult: 0.6 },
  { key: 'normal', label: 'Vừa',   mult: 1.0 },
  { key: 'fast',   label: 'Nhanh', mult: 1.6 },
  { key: 'insane', label: 'Điên',  mult: 2.4 },
];

const POWER_TYPES = [
  { key: 'freeze', icon: '❄', label: 'Đóng băng cả sân', duration: 3, msg: (p) => `❄ Đóng băng ${p.duration}s!` },
  { key: 'slow',   icon: '🐌', label: 'Làm chậm cả sân', duration: 4, msg: (p) => `🐌 Làm chậm ${p.duration}s!` },
  { key: 'shield', icon: '🛡', label: 'Thêm 1 mạng',     msg: () => '🛡 +1 mạng!' },
  { key: 'bonus',  icon: '★', label: 'Điểm thưởng',      points: 80, msg: (p) => `★ +${p.points} điểm!` },
];

// Mỗi gà có một tông màu lông hơi khác nhau cho sân thêm sống động
const BODY_TINTS_LIGHT = ['#f5f0e0', '#efe6c9', '#e9d9b0', '#f2eadb', '#e3d5ad'];
const BODY_TINTS_DARK  = ['#e8e3d5', '#ded4b8', '#cfc19a', '#e2d9c6', '#d6c9a4'];

/* ===== SVG CHICKEN (nâng cấp: đuôi lông, cánh chi tiết, chớp mắt, bóng đổ) ===== */
function ChickenSVG({ dead, highlight, frozen, theme, tint, eyeSeed = 0 }) {
  const ink = theme === 'dark' ? '#f1eee6' : '#111';
  const body = tint || (theme === 'dark' ? '#e8e3d5' : '#f5f0e0');
  const acc = theme === 'dark' ? '#d4ff3a' : '#ff4d1a';
  const beak = theme === 'dark' ? '#7a4a12' : '#ffc46b';

  return (
    <svg
      viewBox="0 0 110 130"
      width={CHICKEN_W}
      height={CHICKEN_H}
      style={{
        transform: dead ? 'rotate(90deg) translateY(-10px)' : 'none',
        transition: 'transform .4s ease, opacity .3s, filter .3s',
        opacity: dead ? 0.4 : 1,
        animation: highlight ? 'chicken-shake .2s infinite' : 'none',
        filter: frozen ? 'grayscale(.5) brightness(1.15) saturate(.6)' : 'none',
      }}
    >
      {/* Đuôi lông */}
      <path d="M20 62 Q4 50 8 34 Q18 46 26 58Z" fill={acc} stroke={ink} strokeWidth="2.5" />
      <path d="M22 68 Q6 62 6 48 Q16 58 27 65Z" fill={body} stroke={ink} strokeWidth="2" opacity=".9" />

      {/* Thân */}
      <rect x="20" y="55" width="70" height="50" fill={body} stroke={ink} strokeWidth="3" />
      {/* Cánh (có vân lông) */}
      <path d="M26 62 L46 62 L42 96 L26 92Z" fill={body} stroke={ink} strokeWidth="2.5" />
      <path d="M30 68 L30 88 M35 66 L35 90 M40 65 L40 92" stroke={ink} strokeWidth="1.2" opacity=".5" />

      {/* Đầu */}
      <circle cx="55" cy="42" r="22" fill={body} stroke={ink} strokeWidth="3" />
      {/* Mào */}
      <path
        d="M45 22 L48 12 L52 22 L58 12 L62 22 L68 12 L70 22"
        fill={acc}
        stroke={ink}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Mỏ */}
      <polygon points="75,42 92,47 75,52" fill={beak} stroke={ink} strokeWidth="2.5" />
      {/* Yếm */}
      <path d="M60 50 Q64 58 58 62 Q54 56 56 50Z" fill={acc} stroke={ink} strokeWidth="2" />
      {/* Mắt — chớp theo chu kỳ riêng */}
      <ellipse
        cx="62" cy="38" rx="3" ry={dead ? 0.5 : 3}
        fill={ink}
        style={{ animation: dead ? 'none' : `chicken-blink ${2.6 + eyeSeed}s ease-in-out infinite` }}
      />

      {/* Chân */}
      <rect x="18" y="65" width="15" height="30" fill={body} stroke={ink} strokeWidth="2.5" />
      <rect x="77" y="65" width="15" height="30" fill={body} stroke={ink} strokeWidth="2.5" />
      <line x1="40" y1="105" x2="40" y2="125" stroke={beak} strokeWidth="4" strokeLinecap="round" />
      <line x1="70" y1="105" x2="70" y2="125" stroke={beak} strokeWidth="4" strokeLinecap="round" />
      <line x1="32" y1="125" x2="48" y2="125" stroke={ink} strokeWidth="3" strokeLinecap="round" />
      <line x1="62" y1="125" x2="78" y2="125" stroke={ink} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/* ===== NGÔI SAO VẬT PHẨM (gà vàng mang power-up) ===== */
function PowerBadge({ power }) {
  return <div className="power-badge" title={power.label}>{power.icon}</div>;
}

/* ===== TRANG TRÍ SÂN: mây trôi + bụi cỏ ===== */
function FieldDecor() {
  return (
    <>
      <svg className="field-cloud c1" viewBox="0 0 100 40" width="90"><ellipse cx="30" cy="24" rx="28" ry="14" /><ellipse cx="60" cy="18" rx="22" ry="16" /></svg>
      <svg className="field-cloud c2" viewBox="0 0 100 40" width="70"><ellipse cx="30" cy="24" rx="24" ry="12" /><ellipse cx="58" cy="20" rx="18" ry="14" /></svg>
      <svg className="field-grass" viewBox="0 0 900 24" preserveAspectRatio="none">
        {Array.from({ length: 30 }).map((_, i) => (
          <path key={i} d={`M${i * 30 + 6} 24 Q${i * 30 + 10} 4 ${i * 30 + 14} 24`} />
        ))}
      </svg>
    </>
  );
}

/* ===== CHICKEN WRAPPER (di chuyển + đông cứng/làm chậm theo buff) ===== */
function Chicken({ data, theme, speedMult, buffsRef, onHit }) {
  const ref = useRef();
  const posRef = useRef({ x: data.x, y: data.y });
  const velRef = useRef({ x: 0, y: 0 });
  const turnTimerRef = useRef(0);
  const rafRef = useRef();
  const eyeSeed = useRef(Math.random() * 2).current;

  useEffect(() => {
    if (data.answered || data.collected) return;

    let lastTime = performance.now();

    const tick = (now) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const buffs = buffsRef.current;
      const frozen = now < buffs.freezeUntil;
      const slowed = now < buffs.slowUntil;

      if (!frozen) {
        const localMult = speedMult * (slowed ? 0.4 : 1);
        turnTimerRef.current -= dt;
        if (turnTimerRef.current <= 0) {
          turnTimerRef.current = 0.8 + Math.random() * 0.7;
          const a = Math.random() * Math.PI * 2;
          const speed = (140 + Math.random() * 80) * localMult;
          velRef.current.x = Math.cos(a) * speed;
          velRef.current.y = Math.sin(a) * speed;
        }

        const p = posRef.current;
        const v = velRef.current;
        p.x += v.x * dt;
        p.y += v.y * dt;

        if (p.x < PADDING) { p.x = PADDING; v.x *= -1; }
        if (p.x > FIELD_W - CHICKEN_W - PADDING) { p.x = FIELD_W - CHICKEN_W - PADDING; v.x *= -1; }
        if (p.y < PADDING) { p.y = PADDING; v.y *= -1; }
        if (p.y > FIELD_H - CHICKEN_H - PADDING) { p.y = FIELD_H - CHICKEN_H - PADDING; v.y *= -1; }

        if (ref.current) {
          ref.current.style.transform = `translate(${posRef.current.x}px, ${posRef.current.y}px) scaleX(${v.x < 0 ? -1 : 1})`;
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [data.answered, data.collected, speedMult, buffsRef]);

  const handleClick = () => {
    if (data.answered || data.collected) return;
    onHit(data);
  };

  const now = performance.now();
  const frozen = now < buffsRef.current.freezeUntil;

  return (
    <div
      ref={ref}
      className={'chicken-2d' + (data.isBonus ? ' is-bonus' : '') + (data.collected ? ' collected' : '')}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        cursor: data.answered || data.collected ? 'default' : 'pointer',
        zIndex: data.highlight ? 10 : 1,
        pointerEvents: data.answered || data.collected ? 'none' : 'auto',
      }}
      onClick={handleClick}
    >
      <div className="chicken-shadow" />
      <ChickenSVG
        dead={data.dead}
        highlight={data.highlight}
        frozen={frozen && !data.isBonus}
        theme={theme}
        tint={data.tint}
        eyeSeed={eyeSeed}
      />
      {data.isBonus ? (
        <div className="chicken-sign bonus"><PowerBadge power={data.power} /></div>
      ) : (
        <div className="chicken-sign">{data.text}</div>
      )}
    </div>
  );
}

/* ===== MAIN ===== */
export default function Chicken2D() {
  const [questions, setQuestions] = useState(() => {
    try {
      const raw = localStorage.getItem('cs-game:chicken:questions');
      return raw ? JSON.parse(raw) : GAME_PRESETS.chicken;
    } catch { return GAME_PRESETS.chicken; }
  });

  const [config, setConfig] = useState(() => {
    try {
      const raw = localStorage.getItem('cs-game:chicken:config');
      return raw ? { ...DEFAULT_CONFIG, ...JSON.parse(raw) } : DEFAULT_CONFIG;
    } catch { return DEFAULT_CONFIG; }
  });

  const [leaderboard, setLeaderboard] = useState(() => {
    try {
      const raw = localStorage.getItem('cs-game:chicken:leaderboard');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  const [phase, setPhase] = useState('setup');
  const [qIndex, setQIndex] = useState(0);
  const [chickens, setChickens] = useState([]);
  const [scores, setScores] = useState([0, 0]);        // [p1, p2] — p2 chỉ dùng khi twoPlayer
  const [turn, setTurn] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [lives, setLives] = useState(3);
  const [theme, setTheme] = useState('light');
  const [timeLeft, setTimeLeft] = useState(0);
  const [flash, setFlash] = useState(null);        // 'correct' | 'wrong' | null
  const [shake, setShake] = useState(false);
  const [comboBanner, setComboBanner] = useState(null);
  const [powerBanner, setPowerBanner] = useState(null);
  const [floats, setFloats] = useState([]);         // điểm bay lên

  const buffsRef = useRef({ freezeUntil: 0, slowUntil: 0 });
  const bannerTimer = useRef();
  const powerBannerTimer = useRef();

  useEffect(() => {
    const read = () => setTheme(document.documentElement.dataset.theme || 'light');
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => mo.disconnect();
  }, []);

  useEffect(() => {
    try { localStorage.setItem('cs-game:chicken:questions', JSON.stringify(questions)); } catch {}
  }, [questions]);

  useEffect(() => {
    try { localStorage.setItem('cs-game:chicken:config', JSON.stringify(config)); } catch {}
  }, [config]);

  useEffect(() => {
    try { localStorage.setItem('cs-game:chicken:leaderboard', JSON.stringify(leaderboard)); } catch {}
  }, [leaderboard]);

  useEffect(() => {
    if (phase !== 'playing') return;
    if (!config.timeLimit) return;
    if (timeLeft <= 0) {
      setChickens((cs) => cs.map((c) => (c.isBonus ? c : { ...c, answered: true, highlight: c.correct })));
      sound.wrong();
      triggerWrong();
      setCombo(0);
      const newLives = lives - 1;
      setLives(newLives);
      setTimeout(() => {
        if (newLives <= 0) endGame(false);
        else nextQuestion(qIndex);
      }, 1500);
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase]);

  const rampMultiplier = (idx) => {
    if (!config.difficultyRamp || !questions.length) return 1;
    return 1 + (idx / questions.length) * 0.7; // tăng dần tới +70% tốc độ ở câu cuối
  };

  const pickTint = () => {
    const pool = theme === 'dark' ? BODY_TINTS_DARK : BODY_TINTS_LIGHT;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const buildQuestion = (idx) => {
    const q = questions[idx];
    if (!q) return [];

    const totalAnswers = Math.max(2, Math.min(6, config.chickenCount));
    const wrongPool = [...(q.wrong || [])];
    while (wrongPool.length < totalAnswers - 1) {
      wrongPool.push(`— ${wrongPool.length + 1}`);
    }

    const answers = [
      { text: q.correct, correct: true },
      ...wrongPool.slice(0, totalAnswers - 1).map((t) => ({ text: t, correct: false })),
    ].sort(() => Math.random() - 0.5);

    const list = answers.map((a, i) => ({
      id: `${idx}-${i}-${Date.now()}`,
      text: a.text,
      correct: a.correct,
      dead: false,
      answered: false,
      highlight: false,
      collected: false,
      isBonus: false,
      tint: pickTint(),
      x: PADDING + Math.random() * (FIELD_W - CHICKEN_W - PADDING * 2),
      y: PADDING + Math.random() * (FIELD_H - CHICKEN_H - PADDING * 2),
    }));

    // Gà vàng vật phẩm — chỉ từ câu 2 trở đi, xác suất 40%
    if (config.powerups && idx > 0 && Math.random() < 0.4) {
      const power = POWER_TYPES[Math.floor(Math.random() * POWER_TYPES.length)];
      list.push({
        id: `${idx}-bonus-${Date.now()}`,
        isBonus: true,
        power,
        dead: false,
        answered: false,
        collected: false,
        highlight: false,
        x: PADDING + Math.random() * (FIELD_W - CHICKEN_W - PADDING * 2),
        y: PADDING + Math.random() * (FIELD_H - CHICKEN_H - PADDING * 2),
      });
    }

    return list;
  };

  const startGame = () => {
    if (!questions.length) return;
    setScores([0, 0]); setCombo(0); setMaxCombo(0); setMistakes(0); setLives(3); setQIndex(0); setTurn(0);
    buffsRef.current = { freezeUntil: 0, slowUntil: 0 };
    setTimeLeft(config.timeLimit || 0);
    setPhase('playing');
    setChickens(buildQuestion(0));
  };

  const nextQuestion = (currentIdx) => {
    const next = currentIdx + 1;
    if (next >= questions.length) { endGame(true); return; }
    setQIndex(next);
    if (config.twoPlayer) setTurn((t) => 1 - t);
    setChickens(buildQuestion(next));
    setTimeLeft(config.timeLimit || 0);
  };

  const spawnFloat = (x, y, text, color) => {
    const id = Math.random().toString(36).slice(2);
    setFloats((f) => [...f, { id, x, y, text, color }]);
    setTimeout(() => setFloats((f) => f.filter((it) => it.id !== id)), 900);
  };

  const triggerWrong = () => {
    setFlash('wrong');
    setShake(true);
    setTimeout(() => setFlash(null), 400);
    setTimeout(() => setShake(false), 420);
  };

  const triggerCorrectFlash = () => {
    setFlash('correct');
    setTimeout(() => setFlash(null), 350);
  };

  const showComboBanner = (n) => {
    clearTimeout(bannerTimer.current);
    setComboBanner(`COMBO ×${n}!`);
    bannerTimer.current = setTimeout(() => setComboBanner(null), 1300);
  };

  const showPowerBanner = (text) => {
    clearTimeout(powerBannerTimer.current);
    setPowerBanner(text);
    powerBannerTimer.current = setTimeout(() => setPowerBanner(null), 1600);
  };

  const collectPower = (chicken) => {
    setChickens((cs) => cs.map((c) => (c.id === chicken.id ? { ...c, collected: true } : c)));
    spawnFloat(chicken.x + CHICKEN_W / 2, chicken.y, chicken.power.icon, 'gold');
    const p = chicken.power;
    if (p.key === 'freeze') buffsRef.current.freezeUntil = performance.now() + p.duration * 1000;
    else if (p.key === 'slow') buffsRef.current.slowUntil = performance.now() + p.duration * 1000;
    else if (p.key === 'shield') setLives((l) => Math.min(5, l + 1));
    else if (p.key === 'bonus') {
      if (config.twoPlayer) setScores((s) => { const n = [...s]; n[turn] += p.points; return n; });
      else setScores((s) => { const n = [...s]; n[0] += p.points; return n; });
    }
    showPowerBanner(p.msg(p));
    sound.correct?.();
    setTimeout(() => setChickens((cs) => cs.filter((c) => c.id !== chicken.id)), 350);
  };

  const onHit = (chicken) => {
    if (chicken.answered || chicken.collected) return;

    if (chicken.isBonus) { collectPower(chicken); return; }

    if (chicken.correct) {
      sound.correct();
      triggerCorrectFlash();
      setChickens((cs) =>
        cs.map((c) => (c.id === chicken.id ? { ...c, dead: true, answered: true } : c.isBonus ? c : { ...c, answered: true }))
      );
      const bonus = Math.round(100 * (1 + combo * 0.1));
      const who = config.twoPlayer ? turn : 0;
      setScores((s) => { const n = [...s]; n[who] += bonus; return n; });
      spawnFloat(chicken.x + CHICKEN_W / 2, chicken.y, `+${bonus}`, 'var(--acc)');
      setCombo((c) => {
        const nc = c + 1;
        setMaxCombo((m) => Math.max(m, nc));
        if (nc > 0 && nc % 5 === 0) showComboBanner(nc);
        return nc;
      });
      setTimeout(() => nextQuestion(qIndex), 900);
    } else {
      sound.wrong();
      triggerWrong();
      setChickens((cs) => cs.map((c) => (c.isBonus ? c : { ...c, answered: true, highlight: c.correct })));
      setCombo(0);
      setMistakes((m) => m + 1);
      const newLives = lives - 1;
      setLives(newLives);
      setTimeout(() => {
        if (newLives <= 0) endGame(false);
        else nextQuestion(qIndex);
      }, 1400);
    }
  };

  const endGame = (won) => {
    setPhase('over');
    if (won) sound.win(); else sound.lose();
    const finalScore = config.twoPlayer ? Math.max(scores[0], scores[1]) : scores[0];
    if (!config.twoPlayer && config.playerName.trim() && finalScore > 0) {
      const entry = { name: config.playerName.trim(), score: finalScore, date: Date.now() };
      const next = [...leaderboard, entry].sort((a, b) => b.score - a.score).slice(0, 10);
      setLeaderboard(next);
    }
  };

  useEffect(() => {
    if (phase !== 'playing') return;
    const answerChickens = chickens.filter((c) => !c.isBonus);
    const onKey = (e) => {
      const idx = parseInt(e.key, 10) - 1;
      if (idx >= 0 && idx < answerChickens.length) {
        const c = answerChickens[idx];
        if (c && !c.answered) onHit(c);
      }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, chickens, combo, lives, qIndex, turn]);

  const q = questions[qIndex];
  const activePreset = SPEED_PRESETS.find((p) => Math.abs(p.mult - config.speed) < 0.05);
  const update = (key, val) => setConfig({ ...config, [key]: val });
  const effectiveSpeed = config.speed * rampMultiplier(qIndex);

  // Huy hiệu cuối game
  const buildBadges = () => {
    const badges = [];
    if (mistakes === 0) badges.push({ icon: '💯', label: 'Hoàn hảo — không sai câu nào' });
    if (maxCombo >= 10) badges.push({ icon: '🔥', label: `Chuỗi combo khủng ×${maxCombo}` });
    else if (maxCombo >= 5) badges.push({ icon: '⚡', label: `Chuỗi combo tốt ×${maxCombo}` });
    if (config.timeLimit > 0 && config.timeLimit <= 15) badges.push({ icon: '⏱', label: 'Hoàn thành ở tốc độ cao' });
    return badges;
  };

  /* SETUP */
  if (phase === 'setup') {
    return (
      <section className="wrap">
        <a href="#games" className="btn sm" style={{ marginBottom: '1.5rem' }}>← Danh sách trò chơi</a>
        <p className="slogan" style={{ marginBottom: '.6rem' }}>Trò chơi 01 — Phản xạ</p>
        <h1 style={{ marginBottom: '2.5rem' }}>Bắt <em>gà</em></h1>

        <div className="setup-block">
          <div className="setup-num">01</div>
          <div className="setup-content">
            <h3 className="setup-title">Người chơi</h3>
            <label>
              Tên (dùng để lưu bảng xếp hạng)
              <input value={config.playerName} onChange={(e) => update('playerName', e.target.value)} maxLength={20} placeholder="Vd: Minh Anh" disabled={config.twoPlayer} />
            </label>

            <div className="setup-sub">
              <label className="row" style={{ cursor: 'pointer', gap: '.5rem' }}>
                <input type="checkbox" checked={config.twoPlayer} onChange={(e) => update('twoPlayer', e.target.checked)} />
                <span style={{ textTransform: 'none', letterSpacing: 0, fontFamily: 'var(--sans)', fontSize: '.9rem', color: 'var(--ink)' }}>
                  Chế độ 2 người chơi luân phiên (chung mạng, riêng điểm)
                </span>
              </label>
              {config.twoPlayer && (
                <label style={{ marginTop: '.6rem' }}>
                  Tên người chơi 2
                  <input value={config.p2Name} onChange={(e) => update('p2Name', e.target.value)} maxLength={20} placeholder="Vd: Gia Bảo" />
                </label>
              )}
            </div>
          </div>
        </div>

        <div className="setup-block">
          <div className="setup-num">02</div>
          <div className="setup-content">
            <h3 className="setup-title">Câu hỏi</h3>
            <QuestionEditor game="chicken" questions={questions} onChange={setQuestions} maxQuestions={30} />
          </div>
        </div>

        <div className="setup-block">
          <div className="setup-num">03</div>
          <div className="setup-content">
            <h3 className="setup-title">Tốc độ & Độ khó</h3>

            <div className="setup-sub">
              <p className="hint" style={{ margin: 0 }}>Tốc độ gà chạy</p>
              <div className="chips" style={{ marginTop: '.5rem' }}>
                {SPEED_PRESETS.map((p) => (
                  <button key={p.key} type="button" className={'chip' + (activePreset?.key === p.key ? ' on' : '')} onClick={() => update('speed', p.mult)}>
                    {p.label} ×{p.mult}
                  </button>
                ))}
              </div>
              <label style={{ marginTop: '.8rem' }}>
                Tinh chỉnh (× {config.speed.toFixed(2)})
                <input type="range" min="0.3" max="3" step="0.1" value={config.speed} onChange={(e) => update('speed', parseFloat(e.target.value))} />
              </label>
            </div>

            <div className="setup-sub">
              <p className="hint" style={{ margin: 0 }}>Số gà mỗi câu</p>
              <div className="chips" style={{ marginTop: '.5rem' }}>
                {[3, 4, 5, 6].map((n) => (
                  <button key={n} type="button" className={'chip' + (config.chickenCount === n ? ' on' : '')} onClick={() => update('chickenCount', n)}>{n} gà</button>
                ))}
              </div>
            </div>

            <div className="setup-sub">
              <p className="hint" style={{ margin: 0 }}>Thời gian mỗi câu</p>
              <div className="chips" style={{ marginTop: '.5rem' }}>
                {[0, 10, 15, 20, 30, 45].map((t) => (
                  <button key={t} type="button" className={'chip' + (config.timeLimit === t ? ' on' : '')} onClick={() => update('timeLimit', t)}>
                    {t === 0 ? 'Không giới hạn' : `${t}s`}
                  </button>
                ))}
              </div>
            </div>

            <div className="setup-sub">
              <label className="row" style={{ cursor: 'pointer', gap: '.5rem' }}>
                <input type="checkbox" checked={config.difficultyRamp} onChange={(e) => update('difficultyRamp', e.target.checked)} />
                <span style={{ textTransform: 'none', letterSpacing: 0, fontFamily: 'var(--sans)', fontSize: '.9rem', color: 'var(--ink)' }}>
                  Độ khó tăng dần — gà chạy nhanh hơn qua từng câu
                </span>
              </label>
            </div>

            <div className="setup-sub">
              <label className="row" style={{ cursor: 'pointer', gap: '.5rem' }}>
                <input type="checkbox" checked={config.powerups} onChange={(e) => update('powerups', e.target.checked)} />
                <span style={{ textTransform: 'none', letterSpacing: 0, fontFamily: 'var(--sans)', fontSize: '.9rem', color: 'var(--ink)' }}>
                  Gà vàng vật phẩm (❄ đóng băng · 🐌 làm chậm · 🛡 +mạng · ★ điểm thưởng)
                </span>
              </label>
            </div>

            <div className="setup-sub" style={{ marginTop: '.6rem' }}>
              <button className="btn sm" type="button" onClick={() => setConfig({ ...config, speed: 1, chickenCount: 5, timeLimit: 30, difficultyRamp: false, powerups: true })}>Khôi phục cài đặt</button>
            </div>
          </div>
        </div>

        <div className="setup-block">
          <div className="setup-num">04</div>
          <div className="setup-content">
            <h3 className="setup-title">Bảng xếp hạng</h3>
            {leaderboard.length === 0 ? (
              <p className="hint" style={{ margin: 0 }}>Chưa có ai chơi. Hãy là người đầu tiên!</p>
            ) : (
              <ol className="leaderboard">
                {leaderboard.map((e, i) => (<li key={i}><b>{e.name}</b><span>{e.score}</span></li>))}
              </ol>
            )}
          </div>
        </div>

        <div className="game-start-bar">
          <div className="game-start-info">
            <div><small>Tốc độ</small><b>×{config.speed.toFixed(1)}</b></div>
            <div><small>Số gà</small><b>{config.chickenCount}</b></div>
            <div><small>Thời gian</small><b>{config.timeLimit ? config.timeLimit + 's' : '∞'}</b></div>
            <div><small>Câu hỏi</small><b>{questions.length}</b></div>
          </div>
          <button className="btn primary" onClick={startGame} disabled={questions.length === 0} type="button">Bắt đầu chơi →</button>
        </div>
      </section>
    );
  }

  /* PLAYING */
  if (phase === 'playing') {
    const scoreLabel = config.twoPlayer
      ? `${config.playerName.trim() || 'P1'} ${scores[0]} · ${config.p2Name.trim() || 'P2'} ${scores[1]}`
      : `Điểm ${scores[0]}`;

    return (
      <section className="wrap">
        <div className="game-hud">
          <span className="hud-item">Câu <b>{qIndex + 1}</b>/{questions.length}</span>
          <span className="hud-item">Combo <b>×{combo}</b></span>
          <span className="hud-item hud-lives">
            {Array.from({ length: Math.max(lives, 0) }).map((_, i) => <span key={i} className="life-heart">♥</span>)}
            {Array.from({ length: Math.max(3 - lives, 0) }).map((_, i) => <span key={'e' + i} className="life-heart empty">♡</span>)}
          </span>
          {config.timeLimit > 0 && (
            <span className="hud-item" style={{ color: timeLeft <= 5 ? 'var(--acc)' : 'var(--ink)', fontWeight: 700 }}>⏱ {timeLeft}s</span>
          )}
          <span className="hud-item hud-score">{scoreLabel}</span>
        </div>

        {config.twoPlayer && (
          <div className="turn-badge">Lượt của <b>{turn === 0 ? (config.playerName.trim() || 'Người chơi 1') : (config.p2Name.trim() || 'Người chơi 2')}</b></div>
        )}

        <div className="game-question">{q?.question}</div>

        {config.timeLimit > 0 && (
          <div className="bar" style={{ marginTop: 0, marginBottom: '.8rem' }}>
            <i style={{ width: (timeLeft / config.timeLimit) * 100 + '%', background: timeLeft <= 5 ? 'var(--acc)' : 'var(--ink)', transition: 'width 1s linear' }} />
          </div>
        )}

        <div className={'chicken-field' + (shake ? ' shake' : '')} style={{ width: FIELD_W, height: FIELD_H }}>
          <FieldDecor />
          {chickens.map((c) => (
            <Chicken key={c.id} data={c} theme={theme} speedMult={effectiveSpeed} buffsRef={buffsRef} onHit={onHit} />
          ))}

          {floats.map((f) => (
            <div key={f.id} className="float-score" style={{ left: f.x, top: f.y, color: f.color }}>{f.text}</div>
          ))}

          {flash && <div className={'field-flash ' + flash} />}
          {comboBanner && <div className="combo-banner">{comboBanner}</div>}
          {powerBanner && <div className="power-toast">{powerBanner}</div>}
        </div>

        <div className="row center" style={{ marginTop: '1rem' }}>
          <button className="btn" onClick={() => setPhase('setup')} type="button">← Dừng</button>
        </div>
      </section>
    );
  }

  /* OVER */
  const badges = buildBadges();
  const winnerLine = config.twoPlayer
    ? scores[0] === scores[1]
      ? 'Hòa!'
      : `${scores[0] > scores[1] ? (config.playerName.trim() || 'Người chơi 1') : (config.p2Name.trim() || 'Người chơi 2')} thắng!`
    : null;

  return (
    <section className="wrap">
      <GameOverModal
        title={lives <= 0 ? 'Hết mạng' : 'Hoàn thành'}
        score={config.twoPlayer ? Math.max(scores[0], scores[1]) : scores[0]}
        onRestart={() => setPhase('setup')}
        extra={
          <>
            {config.twoPlayer ? (
              <div className="twoplayer-result">
                <div className={scores[0] >= scores[1] ? 'tp-row winner' : 'tp-row'}><span>{config.playerName.trim() || 'Người chơi 1'}</span><b>{scores[0]}</b></div>
                <div className={scores[1] > scores[0] ? 'tp-row winner' : 'tp-row'}><span>{config.p2Name.trim() || 'Người chơi 2'}</span><b>{scores[1]}</b></div>
                <p className="hint center" style={{ marginTop: '.4rem' }}>{winnerLine}</p>
              </div>
            ) : (
              <p className="hint center">Bạn đã hoàn thành <b>{qIndex + (lives > 0 ? 1 : 0)}/{questions.length}</b> câu.</p>
            )}
            {badges.length > 0 && (
              <ul className="achv-list">
                {badges.map((b, i) => (
                  <li key={i} className="achv-item"><span className="achv-icon">{b.icon}</span>{b.label}</li>
                ))}
              </ul>
            )}
          </>
        }
      />
    </section>
  );
}