import { useState, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import SceneWrapper from './three/SceneWrapper';
import ChickenModel from './three/ChickenModel';
import QuestionEditor from './QuestionEditor';
import GameOverModal from './GameOverModal';
import { GAME_PRESETS } from '../../data/gamePresets';
import { sound } from '../../lib/gameSound';
import GameBar from './GameBar';
import { GIcon } from './GameIcons';
import { getPalette } from '../../lib/threeUtils';

const FIELD = { minX: -8, maxX: 8, minZ: -5, maxZ: 5 };

const DEFAULT_CONFIG = {
  speed: 1,
  chickenCount: 5,
  timeLimit: 30,
  playerName: '',
};

const SPEED_PRESETS = [
  { key: 'slow',   label: 'Chậm',   mult: 0.6 },
  { key: 'normal', label: 'Vừa',    mult: 1.0 },
  { key: 'fast',   label: 'Nhanh',  mult: 1.6 },
  { key: 'insane', label: 'Điên',   mult: 2.4 },
];

function Chicken({ data, theme, speedMult, onHit }) {
  const ref = useRef();
  const vel = useRef(new THREE.Vector3(0, 0, 0));
  const turnTimer = useRef(0);

  useFrame((_, dt) => {
    if (!ref.current || data.answered) return;
    const p = ref.current.position;

    turnTimer.current -= dt;
    if (turnTimer.current <= 0) {
      turnTimer.current = 0.8 + Math.random() * 0.7;
      const a = Math.random() * Math.PI * 2;
      const speed = (1.2 + Math.random() * 0.8) * speedMult;
      vel.current.set(Math.cos(a) * speed, 0, Math.sin(a) * speed);
    }

    p.x += vel.current.x * dt;
    p.z += vel.current.z * dt;

    if (p.x < FIELD.minX || p.x > FIELD.maxX) {
      vel.current.x *= -1;
      p.x = Math.max(FIELD.minX, Math.min(FIELD.maxX, p.x));
    }
    if (p.z < FIELD.minZ || p.z > FIELD.maxZ) {
      vel.current.z *= -1;
      p.z = Math.max(FIELD.minZ, Math.min(FIELD.maxZ, p.z));
    }

    ref.current.rotation.y = Math.atan2(vel.current.x, vel.current.z);
  });

  const handleClick = (e) => {
    e.stopPropagation();
    if (data.answered) return;
    onHit(data);
  };

  return (
    <group ref={ref} position={[data.x, 0, data.z]}>
      <ChickenModel
        text={data.text}
        dead={data.dead}
        highlight={data.highlight}
        theme={theme}
        onClick={handleClick}
      />
    </group>
  );
}

export default function ChickenGame3D() {
  const [questions, setQuestions] = useState(() => {
    try {
      const raw = localStorage.getItem('cs-game:chicken:questions');
      return raw ? JSON.parse(raw) : GAME_PRESETS.chicken;
    } catch {
      return GAME_PRESETS.chicken;
    }
  });

  const [config, setConfig] = useState(() => {
    try {
      const raw = localStorage.getItem('cs-game:chicken:config');
      return raw ? { ...DEFAULT_CONFIG, ...JSON.parse(raw) } : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  const [leaderboard, setLeaderboard] = useState(() => {
    try {
      const raw = localStorage.getItem('cs-game:chicken:leaderboard');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [phase, setPhase] = useState('setup');
  const [qIndex, setQIndex] = useState(0);
  const [chickens, setChickens] = useState([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [lives, setLives] = useState(3);
  const [theme, setTheme] = useState('light');
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const read = () => setTheme(document.documentElement.dataset.theme || 'light');
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => mo.disconnect();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('cs-game:chicken:questions', JSON.stringify(questions));
    } catch {}
  }, [questions]);

  useEffect(() => {
    try {
      localStorage.setItem('cs-game:chicken:config', JSON.stringify(config));
    } catch {}
  }, [config]);

  useEffect(() => {
    try {
      localStorage.setItem('cs-game:chicken:leaderboard', JSON.stringify(leaderboard));
    } catch {}
  }, [leaderboard]);

  useEffect(() => {
    if (phase !== 'playing') return;
    if (!config.timeLimit) return;
    if (timeLeft <= 0) {
      setChickens((cs) =>
        cs.map((c) => ({ ...c, answered: true, highlight: c.correct }))
      );
      sound.wrong();
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
  }, [timeLeft, phase]);

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

    return answers.map((a, i) => ({
      id: `${idx}-${i}-${Date.now()}`,
      text: a.text,
      correct: a.correct,
      dead: false,
      answered: false,
      highlight: false,
      x: THREE.MathUtils.randFloat(FIELD.minX + 1, FIELD.maxX - 1),
      z: THREE.MathUtils.randFloat(FIELD.minZ + 1, FIELD.maxZ - 1),
    }));
  };

  const startGame = () => {
    if (!questions.length) return;
    setScore(0);
    setCombo(0);
    setLives(3);
    setQIndex(0);
    setTimeLeft(config.timeLimit || 0);
    setPhase('playing');
    setChickens(buildQuestion(0));
  };

  const nextQuestion = (currentIdx) => {
    const next = currentIdx + 1;
    if (next >= questions.length) {
      endGame(true);
      return;
    }
    setQIndex(next);
    setChickens(buildQuestion(next));
    setTimeLeft(config.timeLimit || 0);
  };

  const onHit = (chicken) => {
    if (chicken.answered) return;

    if (chicken.correct) {
      sound.correct();
      setChickens((cs) =>
        cs.map((c) =>
          c.id === chicken.id
            ? { ...c, dead: true, answered: true }
            : { ...c, answered: true }
        )
      );
      const bonus = Math.round(100 * (1 + combo * 0.1));
      setScore((s) => s + bonus);
      setCombo((c) => c + 1);
      setTimeout(() => nextQuestion(qIndex), 900);
    } else {
      sound.wrong();
      setChickens((cs) =>
        cs.map((c) => ({ ...c, answered: true, highlight: c.correct }))
      );
      setCombo(0);
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
    if (won) sound.win();
    else sound.lose();

    if (config.playerName.trim() && score > 0) {
      const entry = { name: config.playerName.trim(), score, date: Date.now() };
      const next = [...leaderboard, entry]
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
      setLeaderboard(next);
    }
  };

  useEffect(() => {
    if (phase !== 'playing') return;
    const onKey = (e) => {
      const idx = parseInt(e.key, 10) - 1;
      if (idx >= 0 && idx < chickens.length) {
        const c = chickens[idx];
        if (c && !c.answered) onHit(c);
      }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [phase, chickens, combo, lives, qIndex]);

  const q = questions[qIndex];
  const pal = getPalette(theme);
  const activePreset = SPEED_PRESETS.find(
    (p) => Math.abs(p.mult - config.speed) < 0.05
  );
  const update = (key, val) => setConfig({ ...config, [key]: val });

  /* ==================== SETUP SCREEN ==================== */
  if (phase === 'setup') {
    return (
      <section className="wrap">
        <a href="#games" className="btn sm" style={{ marginBottom: '1.5rem' }}>
          ← Danh sách trò chơi
        </a>

        <p className="slogan" style={{ marginBottom: '.6rem' }}>
          Trò chơi 01 — Phản xạ
        </p>
        <h1 style={{ marginBottom: '2.5rem' }}>
          Bắt <em>gà</em>
        </h1>

        {/* ===== 01 NGƯỜI CHƠI ===== */}
        <div className="setup-block">
          <div className="setup-num">01</div>
          <div className="setup-content">
            <h3 className="setup-title">Người chơi</h3>
            <label>
              Tên (dùng để lưu bảng xếp hạng)
              <input
                value={config.playerName}
                onChange={(e) => update('playerName', e.target.value)}
                maxLength={20}
                placeholder="Vd: Minh Anh"
              />
            </label>
          </div>
        </div>

        {/* ===== 02 CÂU HỎI ===== */}
        <div className="setup-block">
          <div className="setup-num">02</div>
          <div className="setup-content">
            <h3 className="setup-title">Câu hỏi</h3>
            <QuestionEditor
              game="chicken"
              questions={questions}
              onChange={setQuestions}
              maxQuestions={30}
            />
          </div>
        </div>

        {/* ===== 03 TỐC ĐỘ & ĐỘ KHÓ ===== */}
        <div className="setup-block">
          <div className="setup-num">03</div>
          <div className="setup-content">
            <h3 className="setup-title">Tốc độ & Độ khó</h3>

            <div className="setup-sub">
              <p className="hint" style={{ margin: 0 }}>Tốc độ gà chạy</p>
              <div className="chips" style={{ marginTop: '.5rem' }}>
                {SPEED_PRESETS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    className={'chip' + (activePreset?.key === p.key ? ' on' : '')}
                    onClick={() => update('speed', p.mult)}
                  >
                    {p.label} ×{p.mult}
                  </button>
                ))}
              </div>
              <label style={{ marginTop: '.8rem' }}>
                Tinh chỉnh (× {config.speed.toFixed(2)})
                <input
                  type="range"
                  min="0.3"
                  max="3"
                  step="0.1"
                  value={config.speed}
                  onChange={(e) => update('speed', parseFloat(e.target.value))}
                />
              </label>
            </div>

            <div className="setup-sub">
              <p className="hint" style={{ margin: 0 }}>Số gà mỗi câu (bằng số đáp án)</p>
              <div className="chips" style={{ marginTop: '.5rem' }}>
                {[3, 4, 5, 6].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={'chip' + (config.chickenCount === n ? ' on' : '')}
                    onClick={() => update('chickenCount', n)}
                  >
                    {n} gà
                  </button>
                ))}
              </div>
            </div>

            <div className="setup-sub">
              <p className="hint" style={{ margin: 0 }}>Thời gian mỗi câu</p>
              <div className="chips" style={{ marginTop: '.5rem' }}>
                {[0, 10, 15, 20, 30, 45].map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={'chip' + (config.timeLimit === t ? ' on' : '')}
                    onClick={() => update('timeLimit', t)}
                  >
                    {t === 0 ? 'Không giới hạn' : `${t}s`}
                  </button>
                ))}
              </div>
            </div>

            <div className="setup-sub" style={{ marginTop: '.6rem' }}>
              <button
                className="btn sm"
                type="button"
                onClick={() =>
                  setConfig({
                    ...config,
                    speed: 1,
                    chickenCount: 5,
                    timeLimit: 30,
                  })
                }
              >
                Khôi phục cài đặt
              </button>
            </div>
          </div>
        </div>

        {/* ===== 04 BẢNG XẾP HẠNG ===== */}
        <div className="setup-block">
          <div className="setup-num">04</div>
          <div className="setup-content">
            <h3 className="setup-title">Bảng xếp hạng</h3>
            {leaderboard.length === 0 ? (
              <p className="hint" style={{ margin: 0 }}>
                Chưa có ai chơi. Hãy là người đầu tiên!
              </p>
            ) : (
              <ol className="leaderboard">
                {leaderboard.map((e, i) => (
                  <li key={i}>
                    <b>{e.name}</b>
                    <span>{e.score}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        {/* ===== STICKY START BAR ===== */}
        <div className="game-start-bar">
          <div className="game-start-info">
            <div>
              <small>Tốc độ</small>
              <b>×{config.speed.toFixed(1)}</b>
            </div>
            <div>
              <small>Số gà</small>
              <b>{config.chickenCount}</b>
            </div>
            <div>
              <small>Thời gian</small>
              <b>{config.timeLimit ? config.timeLimit + 's' : '∞'}</b>
            </div>
            <div>
              <small>Câu hỏi</small>
              <b>{questions.length}</b>
            </div>
          </div>
          <button
            className="btn primary"
            onClick={startGame}
            disabled={questions.length === 0}
            type="button"
          >
            Bắt đầu chơi →
          </button>
        </div>
      </section>
    );
  }

  /* ==================== PLAYING ==================== */
  if (phase === 'playing') {
    return (
      <section className="wrap">
        <GameBar />
        <div className="game-hud">
          <span className="hud-item">Câu <b>{qIndex + 1}</b>/{questions.length}</span>
          <span className="hud-item">Combo <b>×{combo}</b></span>
          <span className="hud-item hud-lives">{'●'.repeat(Math.max(0, lives))}</span>
          {config.timeLimit > 0 && (
            <span
              className="hud-item"
              style={{
                color: timeLeft <= 5 ? 'var(--acc)' : 'var(--ink)',
                fontWeight: 700,
              }}
            >
              <GIcon name="timer" /> {timeLeft}s
            </span>
          )}
          <span className="hud-item hud-score">Điểm {score}</span>
        </div>

        <div className="game-question">{q?.question}</div>

        {config.timeLimit > 0 && (
          <div className="bar" style={{ marginTop: 0, marginBottom: '.8rem' }}>
            <i
              style={{
                width: (timeLeft / config.timeLimit) * 100 + '%',
                background: timeLeft <= 5 ? 'var(--acc)' : 'var(--ink)',
                transition: 'width 1s linear',
              }}
            />
          </div>
        )}

        <SceneWrapper theme={theme} camera={{ position: [0, 11, 12], fov: 45 }}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[18, 12]} />
            <meshToonMaterial color={pal.grass} />
          </mesh>
          {chickens.map((c) => (
            <Chicken
              key={c.id}
              data={c}
              theme={theme}
              speedMult={config.speed}
              onHit={onHit}
            />
          ))}
        </SceneWrapper>

        <div className="row center" style={{ marginTop: '1rem' }}>
          <button className="btn" onClick={() => setPhase('setup')} type="button">
            ← Dừng
          </button>
        </div>
      </section>
    );
  }

  /* ==================== OVER ==================== */
  return (
    <section className="wrap">
      <GameOverModal
        title={lives <= 0 ? 'Hết mạng' : 'Hoàn thành'}
        score={score}
        onRestart={() => setPhase('setup')}
        extra={
          <p className="hint center">
            Bạn đã hoàn thành <b>{qIndex + (lives > 0 ? 1 : 0)}/{questions.length}</b> câu.
          </p>
        }
      />
    </section>
  );
}