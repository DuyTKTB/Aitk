import { useState, useEffect, useRef, useCallback } from 'react';
import QuestionEditor from './QuestionEditor';
import GameOverModal from './GameOverModal';
import { sound } from '../../lib/gameSound';

const W = 900;
const H = 560;
const GROUND_Y = H - 60;
const GRAVITY = 900; // px/s^2
const MAX_POWER = 1400; // px/s
const SLING_X = 120;
const SLING_Y = GROUND_Y - 30;
const HIT_R = 36;

const DEFAULT_CONFIG = {
  playerName: '',
  targetCount: 4,
  timeLimit: 30,
  difficulty: 'normal',
  twoPlayer: false,
  p2Name: '',
  powerups: true,
  trajectoryHint: false,
  difficultyRamp: false,
};

const DIFFICULTY = [
  { key: 'easy',   label: 'Dễ',    mult: 0.85, windMult: 0 },
  { key: 'normal', label: 'Vừa',   mult: 1.0,  windMult: 1 },
  { key: 'hard',   label: 'Khó',   mult: 1.25, windMult: 2 },
];

const SLING_POWERS = [
  { key: 'calm',   icon: '🌬', label: 'Lặng gió',        msg: () => '🌬 Gió đã lặng!' },
  { key: 'time',   icon: '⏳', label: 'Cộng 8 giây',      seconds: 8, msg: (p) => `⏳ +${p.seconds}s!` },
  { key: 'shield', icon: '🛡', label: 'Thêm 1 mạng',      msg: () => '🛡 +1 mạng!' },
  { key: 'bonus',  icon: '★',  label: 'Điểm thưởng',      points: 100, msg: (p) => `★ +${p.points} điểm!` },
];

/* ===== BÓNG BAY BIA ===== */
function Balloon({ target, theme, sway }) {
  const ink = theme === 'dark' ? '#f1eee6' : '#111';
  const base = target.isBonus ? '#ffcc33' : target.correct ? '#b7dc9a' : '#a7c4f2';
  const hitColor = target.correct || target.isBonus ? '#ffd23f' : '#ff4d1a';
  const size = target.isBonus ? 60 : 68;
  const fill = target.hit ? hitColor : base;

  return (
    <div
      className={'sling-target' + (target.isBonus ? ' bonus' : '')}
      style={{
        position: 'absolute',
        left: target.x - size / 2,
        top: target.y - size / 2,
        width: size,
        height: size + 22,
        zIndex: 5,
        opacity: target.hit ? 0 : 1,
        transform: target.hit ? 'scale(.5)' : 'scale(1)',
        transition: 'opacity .35s ease, transform .35s ease',
        pointerEvents: 'none',
      }}
    >
      <div
        className="balloon-sway"
        style={{ animationDuration: `${2.4 + sway}s`, animationDelay: `-${sway}s` }}
      >
        <svg width={size} height={size + 14} viewBox="0 0 68 82">
          <ellipse cx="34" cy="34" rx="30" ry="34" fill={fill} stroke={ink} strokeWidth="3" />
          <ellipse cx="24" cy="20" rx="8" ry="12" fill="#fff" opacity=".35" />
          <polygon points="30,66 38,66 34,76" fill={fill} stroke={ink} strokeWidth="2" />
        </svg>
        <span className="balloon-label">{target.isBonus ? target.power.icon : target.text}</span>
      </div>
      {target.hit && (target.correct || target.isBonus) && (
        <div className="balloon-pop" />
      )}
      {target.hit && !target.correct && !target.isBonus && (
        <div className="balloon-crack">✕</div>
      )}
    </div>
  );
}

/* ===== CỜ HƯỚNG GIÓ ===== */
function WindSock({ wind }) {
  if (!wind) return null;
  const strength = Math.min(1, Math.abs(wind) / 250);
  const dir = wind > 0 ? 1 : -1;
  return (
    <div className="wind-sock" style={{ '--dir': dir }}>
      <svg width="34" height="34" viewBox="0 0 34 34" style={{ transform: `scaleX(${dir})` }}>
        <line x1="6" y1="4" x2="6" y2="30" stroke="var(--ink)" strokeWidth="2" />
        <path d="M6 6 L28 11 L18 14 L28 18 L6 22 Z" fill="var(--acc)" stroke="var(--ink)" strokeWidth="1.5" className="wind-flag" />
      </svg>
      <span>{Math.abs(Math.round(wind))}</span>
    </div>
  );
}

/* ===== MAIN ===== */
export default function SlingshotGame() {
  const [phase, setPhase] = useState('setup');
  const [questions, setQuestions] = useState(() => {
    try {
      const raw = localStorage.getItem('cs-game:slingshot:questions');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });
  const [config, setConfig] = useState(() => {
    try {
      const raw = localStorage.getItem('cs-game:slingshot:config');
      return raw ? { ...DEFAULT_CONFIG, ...JSON.parse(raw) } : DEFAULT_CONFIG;
    } catch { return DEFAULT_CONFIG; }
  });
  const [leaderboard, setLeaderboard] = useState(() => {
    try {
      const raw = localStorage.getItem('cs-game:slingshot:leaderboard');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  const [qIndex, setQIndex] = useState(0);
  const [targets, setTargets] = useState([]);
  const [scores, setScores] = useState([0, 0]);
  const [turn, setTurn] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [bullseyes, setBullseyes] = useState(0);
  const [lives, setLives] = useState(3);
  const [theme, setTheme] = useState('light');
  const [timeLeft, setTimeLeft] = useState(0);
  const [wind, setWind] = useState(0);
  const [flash, setFlash] = useState(null);
  const [shake, setShake] = useState(false);
  const [comboBanner, setComboBanner] = useState(null);
  const [powerBanner, setPowerBanner] = useState(null);
  const [floats, setFloats] = useState([]);

  // Aiming state
  const [aiming, setAiming] = useState(false);
  const [aimPos, setAimPos] = useState({ x: 0, y: 0 });
  const [projectile, setProjectile] = useState(null);
  const [trail, setTrail] = useState([]);

  const fieldRef = useRef(null);
  const rafRef = useRef();
  const projectileRef = useRef(null);
  const bannerTimer = useRef();
  const powerBannerTimer = useRef();

  // Theme
  useEffect(() => {
    const read = () => setTheme(document.documentElement.dataset.theme || 'light');
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => mo.disconnect();
  }, []);

  // Persist
  useEffect(() => {
    try { localStorage.setItem('cs-game:slingshot:questions', JSON.stringify(questions)); } catch {}
  }, [questions]);
  useEffect(() => {
    try { localStorage.setItem('cs-game:slingshot:config', JSON.stringify(config)); } catch {}
  }, [config]);
  useEffect(() => {
    try { localStorage.setItem('cs-game:slingshot:leaderboard', JSON.stringify(leaderboard)); } catch {}
  }, [leaderboard]);

  const diff = DIFFICULTY.find((d) => d.key === config.difficulty) || DIFFICULTY[1];

  const rollWind = (idx) => {
    if (diff.windMult <= 0) return 0;
    const ramp = config.difficultyRamp && questions.length ? 1 + (idx / questions.length) * 0.8 : 1;
    return (Math.random() - 0.5) * 200 * diff.windMult * ramp;
  };

  /* ===== BUILD QUESTION ===== */
  const buildTargets = useCallback((idx) => {
    const q = questions[idx];
    if (!q) return [];
    const total = Math.max(2, Math.min(6, config.targetCount));
    const wrongPool = [...(q.wrong || [])];
    while (wrongPool.length < total - 1) wrongPool.push(`— ${wrongPool.length + 1}`);

    const answers = [
      { text: q.correct, correct: true },
      ...wrongPool.slice(0, total - 1).map((t) => ({ text: t, correct: false })),
    ].sort(() => Math.random() - 0.5);

    const list = answers.map((a, i) => {
      const t = (i + 1) / (answers.length + 1);
      return {
        id: `${idx}-${i}`,
        text: a.text,
        correct: a.correct,
        isBonus: false,
        x: W * 0.5 + t * (W * 0.42) + (Math.random() - 0.5) * 40,
        y: GROUND_Y - 80 - Math.random() * 180,
        hit: false,
      };
    });

    if (config.powerups && idx > 0 && Math.random() < 0.35) {
      const power = SLING_POWERS[Math.floor(Math.random() * SLING_POWERS.length)];
      list.push({
        id: `${idx}-bonus`,
        isBonus: true,
        power,
        x: W * 0.5 + Math.random() * (W * 0.4),
        y: GROUND_Y - 60 - Math.random() * 200,
        hit: false,
      });
    }

    return list;
  }, [questions, config.targetCount, config.powerups]);

  /* ===== START ===== */
  const startGame = () => {
    if (!questions.length) return;
    setScores([0, 0]); setCombo(0); setMaxCombo(0); setMistakes(0); setBullseyes(0); setLives(3); setQIndex(0); setTurn(0);
    setTimeLeft(config.timeLimit || 0);
    setWind(rollWind(0));
    setPhase('playing');
    setTargets(buildTargets(0));
    setProjectile(null);
    setTrail([]);
  };

  const nextQuestion = (idx) => {
    const next = idx + 1;
    if (next >= questions.length) { endGame(true); return; }
    setQIndex(next);
    if (config.twoPlayer) setTurn((t) => 1 - t);
    setTargets(buildTargets(next));
    setProjectile(null);
    setTrail([]);
    setTimeLeft(config.timeLimit || 0);
    setWind(rollWind(next));
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

  /* ===== TIME ===== */
  useEffect(() => {
    if (phase !== 'playing' || !config.timeLimit) return;
    if (timeLeft <= 0) {
      sound.wrong();
      triggerWrong();
      setCombo(0);
      setMistakes((m) => m + 1);
      const nl = lives - 1;
      setLives(nl);
      setTargets((ts) => ts.map((t) => (t.isBonus ? t : { ...t, hit: true })));
      setTimeout(() => { if (nl <= 0) endGame(false); else nextQuestion(qIndex); }, 1200);
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase]);

  /* ===== PROJECTILE ANIMATION ===== */
  useEffect(() => {
    if (!projectile) return;
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const p = projectileRef.current;
      if (!p) return;

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += GRAVITY * dt;
      p.vx += wind * dt;
      p.rot = (p.rot || 0) + dt * 480;

      setTrail((tr) => [...tr.slice(-30), { x: p.x, y: p.y }]);

      for (const t of targets) {
        if (t.hit) continue;
        const dx = p.x - t.x;
        const dy = p.y - t.y;
        const dist2 = dx * dx + dy * dy;
        if (dist2 < HIT_R * HIT_R) {
          if (t.isBonus) collectPower(t);
          else handleHit(t, Math.sqrt(dist2));
          setProjectile(null);
          return;
        }
      }

      if (p.x > W + 100 || p.y > H + 100 || p.y < -200) {
        sound.wrong();
        setCombo(0);
        setProjectile(null);
        return;
      }

      setProjectile({ ...p });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectile?.id, wind, targets]);

  /* ===== VẬT PHẨM ===== */
  const collectPower = (t) => {
    setTargets((ts) => ts.map((x) => (x.id === t.id ? { ...x, hit: true } : x)));
    spawnFloat(t.x, t.y, t.power.icon, 'gold');
    const p = t.power;
    if (p.key === 'calm') setWind(0);
    else if (p.key === 'time' && config.timeLimit) setTimeLeft((tl) => tl + p.seconds);
    else if (p.key === 'shield') setLives((l) => Math.min(5, l + 1));
    else if (p.key === 'bonus') {
      const who = config.twoPlayer ? turn : 0;
      setScores((s) => { const n = [...s]; n[who] += p.points; return n; });
    }
    showPowerBanner(p.msg(p));
    sound.correct?.();
  };

  /* ===== HIT HANDLER (với chấm điểm theo độ chính xác) ===== */
  const handleHit = (t, dist) => {
    if (t.correct) {
      sound.correct();
      triggerCorrectFlash();
      setTargets((ts) => ts.map((x) => (x.id === t.id ? { ...x, hit: true } : t.isBonus ? x : { ...x, hit: true })));

      let tierMult = 1, tierLabel = null;
      if (dist < 14) { tierMult = 1.6; tierLabel = 'CHÍNH XÁC!'; setBullseyes((b) => b + 1); }
      else if (dist > 27) { tierMult = 0.75; tierLabel = 'Sát mép'; }

      const bonus = Math.round(100 * (1 + combo * 0.15) * tierMult);
      const who = config.twoPlayer ? turn : 0;
      setScores((s) => { const n = [...s]; n[who] += bonus; return n; });
      spawnFloat(t.x, t.y - 20, `+${bonus}`, 'var(--acc)');
      if (tierLabel) spawnFloat(t.x, t.y - 44, tierLabel, tierMult > 1 ? '#ffb020' : 'var(--mut)');

      setCombo((c) => {
        const nc = c + 1;
        setMaxCombo((m) => Math.max(m, nc));
        if (nc > 0 && nc % 5 === 0) showComboBanner(nc);
        return nc;
      });
      setTimeout(() => nextQuestion(qIndex), 800);
    } else {
      sound.wrong();
      triggerWrong();
      setTargets((ts) => ts.map((x) => (x.isBonus ? x : { ...x, hit: true })));
      setCombo(0);
      setMistakes((m) => m + 1);
      const nl = lives - 1;
      setLives(nl);
      setTimeout(() => { if (nl <= 0) endGame(false); else nextQuestion(qIndex); }, 1200);
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

  /* ===== AIMING ===== */
  const getLocalPos = (e) => {
    const rect = fieldRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerDown = (e) => {
    if (phase !== 'playing' || projectile) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setAiming(true);
    setAimPos(getLocalPos(e));
  };
  const onPointerMove = (e) => {
    if (!aiming) return;
    setAimPos(getLocalPos(e));
  };
  const onPointerUp = () => {
    if (!aiming) return;
    setAiming(false);

    const dx = SLING_X - aimPos.x;
    const dy = SLING_Y - aimPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 20) return;
    const power = Math.min(MAX_POWER, dist * 8);
    const angle = Math.atan2(dy, dx);

    const proj = {
      id: Date.now(),
      x: SLING_X,
      y: SLING_Y,
      vx: Math.cos(angle) * power * diff.mult,
      vy: Math.sin(angle) * power * diff.mult,
      rot: 0,
    };
    projectileRef.current = proj;
    setProjectile(proj);
    setTrail([]);
  };

  /* ===== DỰ BÁO ĐƯỜNG ĐẠN (chế độ hỗ trợ) ===== */
  const trajectoryPreview = () => {
    if (!config.trajectoryHint || !aiming) return [];
    const dx = SLING_X - aimPos.x;
    const dy = SLING_Y - aimPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 20) return [];
    const power = Math.min(MAX_POWER, dist * 8);
    const angle = Math.atan2(dy, dx);
    let x = SLING_X, y = SLING_Y;
    let vx = Math.cos(angle) * power * diff.mult;
    let vy = Math.sin(angle) * power * diff.mult;
    const pts = [];
    const dt = 0.045;
    for (let i = 0; i < 40; i++) {
      x += vx * dt; y += vy * dt; vy += GRAVITY * dt; vx += wind * dt;
      if (y > H || x > W + 50) break;
      pts.push({ x, y });
    }
    return pts;
  };

  const q = questions[qIndex];
  const diffLabel = diff.label;
  const update = (key, val) => setConfig({ ...config, [key]: val });

  const buildBadges = () => {
    const badges = [];
    if (mistakes === 0) badges.push({ icon: '💯', label: 'Hoàn hảo — không sai lần nào' });
    if (bullseyes >= 3) badges.push({ icon: '🎯', label: `Xạ thủ chính xác — ${bullseyes} lần bắn trúng tâm` });
    if (maxCombo >= 10) badges.push({ icon: '🔥', label: `Chuỗi combo khủng ×${maxCombo}` });
    else if (maxCombo >= 5) badges.push({ icon: '⚡', label: `Chuỗi combo tốt ×${maxCombo}` });
    return badges;
  };

  /* ============ SETUP ============ */
  if (phase === 'setup') {
    return (
      <section className="wrap">
        <a href="#games" className="btn sm" style={{ marginBottom: '1.5rem' }}>← Danh sách trò chơi</a>
        <p className="slogan" style={{ marginBottom: '.6rem' }}>Trò chơi 02 — Vật lý</p>
        <h1 style={{ marginBottom: '2.5rem' }}>Bắn <em>súng</em></h1>

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
            <QuestionEditor game="slingshot" questions={questions} onChange={setQuestions} maxQuestions={30} />
          </div>
        </div>

        <div className="setup-block">
          <div className="setup-num">03</div>
          <div className="setup-content">
            <h3 className="setup-title">Độ khó & Thời gian</h3>

            <div className="setup-sub">
              <p className="hint" style={{ margin: 0 }}>Độ khó (ảnh hưởng lực bắn + gió)</p>
              <div className="chips" style={{ marginTop: '.5rem' }}>
                {DIFFICULTY.map((d) => (
                  <button key={d.key} type="button" className={'chip' + (config.difficulty === d.key ? ' on' : '')} onClick={() => update('difficulty', d.key)}>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="setup-sub">
              <p className="hint" style={{ margin: 0 }}>Số bóng bay mỗi câu</p>
              <div className="chips" style={{ marginTop: '.5rem' }}>
                {[3, 4, 5, 6].map((n) => (
                  <button key={n} type="button" className={'chip' + (config.targetCount === n ? ' on' : '')} onClick={() => update('targetCount', n)}>
                    {n} bóng
                  </button>
                ))}
              </div>
            </div>

            <div className="setup-sub">
              <p className="hint" style={{ margin: 0 }}>Thời gian mỗi câu</p>
              <div className="chips" style={{ marginTop: '.5rem' }}>
                {[0, 15, 20, 30, 45].map((t) => (
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
                  Độ khó tăng dần — gió mạnh hơn qua từng câu
                </span>
              </label>
            </div>

            <div className="setup-sub">
              <label className="row" style={{ cursor: 'pointer', gap: '.5rem' }}>
                <input type="checkbox" checked={config.powerups} onChange={(e) => update('powerups', e.target.checked)} />
                <span style={{ textTransform: 'none', letterSpacing: 0, fontFamily: 'var(--sans)', fontSize: '.9rem', color: 'var(--ink)' }}>
                  Bóng bay vàng vật phẩm (🌬 lặng gió · ⏳ +giờ · 🛡 +mạng · ★ điểm thưởng)
                </span>
              </label>
            </div>

            <div className="setup-sub">
              <label className="row" style={{ cursor: 'pointer', gap: '.5rem' }}>
                <input type="checkbox" checked={config.trajectoryHint} onChange={(e) => update('trajectoryHint', e.target.checked)} />
                <span style={{ textTransform: 'none', letterSpacing: 0, fontFamily: 'var(--sans)', fontSize: '.9rem', color: 'var(--ink)' }}>
                  Chế độ hỗ trợ — hiện đường đạn dự đoán khi ngắm
                </span>
              </label>
            </div>

            <div className="setup-sub" style={{ marginTop: '.6rem' }}>
              <button className="btn sm" type="button" onClick={() => setConfig({ ...DEFAULT_CONFIG, playerName: config.playerName })}>
                Khôi phục cài đặt
              </button>
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
            <div><small>Độ khó</small><b>{diffLabel}</b></div>
            <div><small>Số bóng</small><b>{config.targetCount}</b></div>
            <div><small>Thời gian</small><b>{config.timeLimit ? config.timeLimit + 's' : '∞'}</b></div>
            <div><small>Câu hỏi</small><b>{questions.length}</b></div>
          </div>
          <button className="btn primary" onClick={startGame} disabled={questions.length === 0} type="button">
            Bắt đầu chơi →
          </button>
        </div>
      </section>
    );
  }

  /* ============ PLAYING ============ */
  if (phase === 'playing') {
    const ink = theme === 'dark' ? '#f1eee6' : '#111';
    const ground = theme === 'dark' ? '#2f5a1f' : '#b7dc9a';
    const preview = trajectoryPreview();
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

        <div
          ref={fieldRef}
          className={'sling-field sling-field-sky' + (shake ? ' shake' : '')}
          style={{
            position: 'relative', width: W, maxWidth: '100%', height: H,
            border: `2px solid ${ink}`,
            boxShadow: `6px 6px 0 ${ink}`, overflow: 'hidden',
            cursor: aiming ? 'grabbing' : 'crosshair',
            touchAction: 'none',
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <svg className="field-cloud c1" viewBox="0 0 100 40" width="90"><ellipse cx="30" cy="24" rx="28" ry="14" /><ellipse cx="60" cy="18" rx="22" ry="16" /></svg>
          <svg className="field-cloud c2" viewBox="0 0 100 40" width="70"><ellipse cx="30" cy="24" rx="24" ry="12" /><ellipse cx="58" cy="20" rx="18" ry="14" /></svg>

          {/* Mặt đất */}
          <div style={{ position: 'absolute', left: 0, right: 0, top: GROUND_Y, height: H - GROUND_Y, background: ground, borderTop: `2px solid ${ink}` }} />

          {wind !== 0 && <WindSock wind={wind} />}

          {/* Ná bắn */}
          <div className="sling-fork" style={{ left: SLING_X - 20, top: SLING_Y - 60 }}>
            <div className="sling-arm left" />
            <div className="sling-arm right" />
            {!aiming && !projectile && (
              <svg className="sling-band-rest" viewBox="0 0 40 30" width="40" height="30">
                <path d="M4 0 Q20 24 36 0" stroke={ink} strokeWidth="3" fill="none" />
              </svg>
            )}
          </div>

          {/* Dây ná khi kéo */}
          {aiming && (
            <svg width={W} height={H} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 8 }}>
              <line x1={SLING_X - 16} y1={SLING_Y - 58} x2={aimPos.x} y2={aimPos.y} stroke={ink} strokeWidth={2.5} opacity={0.7} />
              <line x1={SLING_X + 16} y1={SLING_Y - 58} x2={aimPos.x} y2={aimPos.y} stroke={ink} strokeWidth={2.5} opacity={0.7} />
              <line x1={SLING_X} y1={SLING_Y} x2={aimPos.x} y2={aimPos.y} stroke={ink} strokeWidth={1.5} strokeDasharray="6 4" opacity={0.35} />
            </svg>
          )}

          {/* Dự báo đường đạn */}
          {preview.length > 0 && (
            <svg width={W} height={H} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 7 }}>
              {preview.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={2} fill="var(--acc)" opacity={0.35} />
              ))}
            </svg>
          )}

          {/* Quả trứng khi kéo (trong túi ná) */}
          {aiming && (
            <div className="sling-egg" style={{ left: aimPos.x - 9, top: aimPos.y - 10 }} />
          )}

          {/* Trail */}
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 6 }}>
            {trail.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={2 + i * 0.12} fill="var(--acc)" opacity={(i / trail.length) * 0.6} />
            ))}
          </svg>

          {targets.map((t) => (<Balloon key={t.id} target={t} theme={theme} sway={(t.x % 7) / 3} />))}

          {projectile && (
            <div
              className="sling-egg flying"
              style={{ left: projectile.x - 9, top: projectile.y - 10, transform: `rotate(${projectile.rot || 0}deg)` }}
            />
          )}

          {floats.map((f) => (
            <div key={f.id} className="float-score" style={{ left: f.x, top: f.y, color: f.color }}>{f.text}</div>
          ))}

          {flash && <div className={'field-flash ' + flash} />}
          {comboBanner && <div className="combo-banner">{comboBanner}</div>}
          {powerBanner && <div className="power-toast">{powerBanner}</div>}

          {!aiming && !projectile && (
            <div className="sling-hint">Giữ chuột và kéo để ngắm — thả để bắn</div>
          )}
        </div>

        <div className="row center" style={{ marginTop: '1rem' }}>
          <button className="btn" onClick={() => setPhase('setup')} type="button">← Dừng</button>
        </div>
      </section>
    );
  }

  /* ============ OVER ============ */
  const badges = buildBadges();
  const winnerLine = config.twoPlayer
    ? scores[0] === scores[1] ? 'Hòa!' : `${scores[0] > scores[1] ? (config.playerName.trim() || 'Người chơi 1') : (config.p2Name.trim() || 'Người chơi 2')} thắng!`
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
                {badges.map((b, i) => (<li key={i} className="achv-item"><span className="achv-icon">{b.icon}</span>{b.label}</li>))}
              </ul>
            )}
          </>
        }
      />
    </section>
  );
}