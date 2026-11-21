/* ============================================================
   SpeedDuelModal.jsx — Đấu Trường Tốc Độ 1v1 (5 Câu · 90 Giây)
   - Rút câu hỏi thật từ ngân hàng đề VIRTUAL_EXAMS (Hóa / Lý / Sinh / KHTN)
   - Đấu trực tiếp với Boss AI "Bé Elec 8.5+" có thanh tiến độ đua thời gian thực
   - Hệ số Combo (x2..x5), giải thích tức thì và cộng Lực chiến + ELO thật
   ============================================================ */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { VIRTUAL_EXAMS } from '../data/virtualExamsBank.js';
import {
  recordCombatPowerOnce,
  recordStudentEloOnce,
} from '../lib/studentAnalytics.js';
import MathText from './MathText.jsx';
import '../styles/student-v9-upgrades.css';

const DUEL_QUESTIONS_COUNT = 5;
const DUEL_SECONDS = 90;

function pickDuelPool(subjectFilter = 'all') {
  const pool = [];
  for (const exam of VIRTUAL_EXAMS) {
    if (subjectFilter !== 'all' && exam.subject && exam.subject !== subjectFilter && exam.subject !== 'all') {
      continue;
    }
    const list = Array.isArray(exam.questions) ? exam.questions : [];
    for (const q of list) {
      const opts = Array.isArray(q.options) ? q.options : null;
      const text = q.q || q.question;
      const ansIdx = Number.isInteger(q.correct) ? q.correct : (Number.isInteger(q.answer) ? q.answer : -1);
      if (!text || !opts || opts.length !== 4 || ansIdx < 0 || ansIdx > 3) continue;
      pool.push({
        id: `${exam.id}-${q.id || pool.length}`,
        subject: exam.subject || 'all',
        text,
        options: opts,
        correctIdx: ansIdx,
        explanation: q.explanation || '',
      });
    }
  }
  // Fisher-Yates shuffle
  const copy = [...pool];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, DUEL_QUESTIONS_COUNT).map((item) => {
    const indexed = item.options.map((text, idx) => ({ text, isCorrect: idx === item.correctIdx }));
    for (let i = indexed.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
    }
    return {
      ...item,
      shuffledOptions: indexed,
    };
  });
}

export default function SpeedDuelModal({ open, onClose, uid = 'guest' }) {
  const [subject, setSubject] = useState('all');
  const [phase, setPhase] = useState('lobby'); // 'lobby' | 'playing' | 'done'
  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [secLeft, setSecLeft] = useState(DUEL_SECONDS);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [bossScore, setBossScore] = useState(0);
  const [bossProgress, setBossProgress] = useState(0);
  const [rewards, setRewards] = useState(null);
  const duelKeyRef = useRef('');

  useEffect(() => {
    if (!open) {
      setPhase('lobby');
      setPicked(null);
    }
  }, [open]);

  // Countdown + Boss AI ticking
  useEffect(() => {
    if (!open || phase !== 'playing') return undefined;
    const t = setInterval(() => {
      setSecLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          setPhase('done');
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    const bossTick = setInterval(() => {
      setBossProgress((p) => {
        if (p >= 100) return 100;
        const step = 4 + Math.random() * 5;
        const next = Math.min(100, p + step);
        setBossScore(Math.round((next / 100) * 440));
        return next;
      });
    }, 1600);

    return () => {
      clearInterval(t);
      clearInterval(bossTick);
    };
  }, [open, phase]);

  // Record real ELO + Lực chiến once duel ends
  useEffect(() => {
    if (phase !== 'done' || questions.length === 0) return;
    const pct = Math.round((correctCount / questions.length) * 100);
    const wrongCount = Math.max(0, questions.length - correctCount);
    const eloRes = recordStudentEloOnce({
      uid,
      attemptKey: duelKeyRef.current,
      pct,
      totalQuestions: questions.length,
    });
    const powerRes = recordCombatPowerOnce({
      uid,
      attemptKey: duelKeyRef.current,
      correctCount,
      wrongCount,
    });
    setRewards({ eloRes, powerRes, pct });
  }, [phase, questions.length, correctCount, uid]);

  const startDuel = () => {
    const pickedQs = pickDuelPool(subject);
    if (!pickedQs.length) return;
    duelKeyRef.current = `duel-${Date.now()}`;
    setQuestions(pickedQs);
    setIdx(0);
    setPicked(null);
    setSecLeft(DUEL_SECONDS);
    setScore(0);
    setCorrectCount(0);
    setCombo(0);
    setMaxCombo(0);
    setBossScore(0);
    setBossProgress(0);
    setRewards(null);
    setPhase('playing');
  };

  const currentQ = questions[idx];

  const handleAnswer = (optIdx) => {
    if (picked !== null || !currentQ) return;
    setPicked(optIdx);
    const isRight = currentQ.shuffledOptions[optIdx]?.isCorrect;
    if (isRight) {
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      setMaxCombo((m) => Math.max(m, nextCombo));
      setCorrectCount((c) => c + 1);
      const speedBonus = Math.min(35, Math.round(secLeft / 3));
      setScore((s) => s + 80 + nextCombo * 15 + speedBonus);
    } else {
      setCombo(0);
    }
  };

  const nextQuestion = () => {
    if (idx + 1 >= questions.length) {
      setPhase('done');
    } else {
      setIdx((i) => i + 1);
      setPicked(null);
    }
  };

  const playerWin = useMemo(() => score >= bossScore && correctCount >= 3, [score, bossScore, correctCount]);

  if (!open) return null;

  return (
    <div className="s9-duel-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="s9-duel-modal" role="dialog" aria-label="Đấu trường tốc độ 1v1">
        <header className="s9-duel-head">
          <div className="s9-duel-head-l">
            <img src="/img/elec/elec-fighting.png" alt="Bé Elec Arena" />
            <div>
              <span className="s9-duel-tag">ĐẤU TRƯỜNG TỐC ĐỘ 1V1</span>
              <h3>Thách đấu Boss AI — 5 Câu · 90 Giây</h3>
            </div>
          </div>
          <button type="button" className="s9-duel-close" onClick={onClose} aria-label="Đóng">
            ✕
          </button>
        </header>

        {phase === 'lobby' && (
          <div className="s9-duel-lobby">
            <p className="s9-duel-desc">
              Đua tốc độ 5 câu trắc nghiệm ngẫu nhiên với <b>Boss Bé Elec (mục tiêu 8.5+)</b>. Trả lời đúng liên tiếp để kích hoạt <b>Combo điểm</b> và nhận thưởng <b>Lực chiến + ELO thật</b> vào hồ sơ.
            </p>
            <div className="s9-duel-subjects">
              {[
                { id: 'all', label: 'Tổng hợp KHTN' },
                { id: 'ly', label: 'Vật lí' },
                { id: 'sinh', label: 'Sinh học' },
                { id: 'hoa', label: 'Hóa học' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`s9-duel-sub-pill ${subject === s.id ? 'active' : ''}`}
                  onClick={() => setSubject(s.id)}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <button type="button" className="s9-duel-start-btn" onClick={startDuel}>
              Bắt đầu trận đấu ngay →
            </button>
          </div>
        )}

        {phase === 'playing' && currentQ && (
          <div className="s9-duel-body">
            {/* Live Race Bar */}
            <div className="s9-duel-race">
              <div className="s9-duel-racer">
                <div className="s9-duel-racer-top">
                  <b>Bạn ({score}đ)</b>
                  <span>{combo >= 2 ? `Combo x${combo}` : `Câu ${idx + 1}/${questions.length}`}</span>
                </div>
                <div className="s9-duel-track">
                  <i className="you" style={{ width: `${Math.round(((idx + (picked !== null ? 1 : 0)) / questions.length) * 100)}%` }} />
                </div>
              </div>
              <div className="s9-duel-clock">{secLeft}s</div>
              <div className="s9-duel-racer">
                <div className="s9-duel-racer-top">
                  <b>Boss Elec ({bossScore}đ)</b>
                  <span>AI 8.5+</span>
                </div>
                <div className="s9-duel-track">
                  <i className="boss" style={{ width: `${Math.round(bossProgress)}%` }} />
                </div>
              </div>
            </div>

            <div className="s9-duel-qbox">
              <MathText as="p" className="s9-duel-qtext">{currentQ.text}</MathText>
              <div className="s9-duel-opts">
                {currentQ.shuffledOptions.map((opt, oIdx) => {
                  let stateCls = '';
                  if (picked !== null) {
                    if (opt.isCorrect) stateCls = 'is-correct';
                    else if (picked === oIdx) stateCls = 'is-wrong';
                    else stateCls = 'is-dim';
                  }
                  return (
                    <button
                      key={oIdx}
                      type="button"
                      className={`s9-duel-opt ${stateCls}`}
                      disabled={picked !== null}
                      onClick={() => handleAnswer(oIdx)}
                    >
                      <b>{String.fromCharCode(65 + oIdx)}.</b>
                      <MathText as="span">{opt.text}</MathText>
                    </button>
                  );
                })}
              </div>

              {picked !== null && (
                <div className="s9-duel-feedback">
                  {currentQ.explanation && <MathText as="p">{currentQ.explanation}</MathText>}
                  <button type="button" className="s9-duel-next-btn" onClick={nextQuestion}>
                    {idx + 1 >= questions.length ? 'Xem kết quả trận đấu →' : 'Câu tiếp theo →'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {phase === 'done' && (
          <div className="s9-duel-result">
            <img
              src={playerWin ? '/img/elec/elec-celebrate.png' : '/img/elec/elec-fighting.png'}
              alt="Kết quả trận đấu"
            />
            <h4>{playerWin ? 'Chiến thắng Boss AI xuất sắc!' : 'Trận đấu rất căng thẳng — Thử phục thù nhé!'}</h4>
            <p>
              Bạn đạt <b>{score} điểm</b> ({correctCount}/{questions.length} câu đúng · Max Combo x{maxCombo}) so với Boss AI <b>{bossScore} điểm</b>.
            </p>
            {rewards && (
              <div className="s9-duel-rewards">
                <span>Lực chiến: <b>+{rewards.powerRes.earned}</b></span>
                <span>ELO: <b>{rewards.eloRes.delta >= 0 ? `+${rewards.eloRes.delta}` : rewards.eloRes.delta}</b> ({rewards.eloRes.nextElo})</span>
              </div>
            )}
            <div className="s9-duel-res-actions">
              <button type="button" className="s9-duel-start-btn" onClick={startDuel}>
                Đấu ván mới
              </button>
              <button type="button" className="s9-duel-ghost-btn" onClick={onClose}>
                Đóng
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
