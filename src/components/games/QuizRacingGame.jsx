import { useState, useEffect } from 'react';
import GameBar from './GameBar.jsx';
import QuestionBankPicker from './QuestionBankPicker.jsx';
import sound from '../../lib/gameSound.js';
import {
  SvgTrophy,
  SvgRaceCar,
  SvgNitro,
  SvgLightbulb,
} from './ClassroomGameIcons.jsx';
import '../../styles/classroom-games.css';

/* Default Racing Teams without emojis */
const INITIAL_TEAMS = [
  { id: 't1', name: 'Đội Đỏ (Red Fire)', color: '#ef4444', progress: 0, score: 0 },
  { id: 't2', name: 'Đội Xanh (Blue Speed)', color: '#0284c7', progress: 0, score: 0 },
  { id: 't3', name: 'Đội Vàng (Gold Lightning)', color: '#eab308', progress: 0, score: 0 },
  { id: 't4', name: 'Đội Tím (Purple Phantom)', color: '#8b5cf6', progress: 0, score: 0 },
];

const DEFAULT_QUESTIONS = [
  { q: 'Khí nào là nguyên nhân chính gây ra hiệu ứng nhà kính toàn cầu?', options: ['CO₂', 'O₂', 'N₂', 'H₂'], correct: 0, explain: 'Khí cacbonic (CO₂) hấp thụ bức xạ nhiệt hồng ngoại gây hiệu ứng nhà kính.' },
  { q: 'Chất nào làm mất tính cứng của nước cứng tạm thời khi đun sôi?', options: ['Ca(HCO₃)₂', 'CaCl₂', 'CaSO₄', 'MgCl₂'], correct: 0, explain: 'Ca(HCO₃)₂ nhiệt phân tạo CaCO₃ kết tủa lắng xuống.' },
  { q: 'Kim loại nào có tính khử mạnh nhất trong dãy điện hóa?', options: ['Potassium (K)', 'Sodium (Na)', 'Lithium (Li)', 'Calcium (Ca)'], correct: 2, explain: 'Lithium (Li) có thế điện cực chuẩn âm nhất (-3.04V).' },
  { q: 'Phân bón đạm cung cấp nguyên tố dinh dưỡng nào cho cây trồng?', options: ['Phosphorus (P)', 'Potassium (K)', 'Nitrogen (N)', 'Calcium (Ca)'], correct: 2, explain: 'Phân đạm cung cấp Nitơ thúc đẩy sự phát triển thân lá.' },
  { q: 'Dung dịch saccarozơ có phản ứng tráng bạc không?', options: ['Có', 'Không', 'Chỉ khi đun nóng với kiềm', 'Tùy nhiệt độ'], correct: 1, explain: 'Saccarozơ là đisaccarit không có nhóm -CHO tự do nên không tráng bạc.' },
  { q: 'Thành phần chính của khí thiên nhiên là gì?', options: ['Metan (CH₄)', 'Etylen (C₂H₄)', 'Axetylen (C₂H₂)', 'Propan (C₃H₈)'], correct: 0, explain: 'Metan chiếm từ 85 - 95% thể tích khí thiên nhiên.' },
  { q: 'Liên kết hóa học trong phân tử NaCl là liên kết gì?', options: ['Cộng hóa trị phân cực', 'Cộng hóa trị không phân cực', 'Liên kết ion', 'Liên kết kim loại'], correct: 2, explain: 'Na⁺ và Cl⁻ hút nhau bằng lực hút tĩnh điện liên kết ion.' },
  { q: 'Dung dịch iot (I₂) dùng để nhận biết chất nào tạo màu xanh tím?', options: ['Glucozơ', 'Tinh bột', 'Xenlulozơ', 'Protein'], correct: 1, explain: 'Iot chui vào cấu trúc xoắn của amilozơ tạo phức xanh tím đặc trưng.' },
  { q: 'Axit sunfuric đặc nguội thụ động hóa với những kim loại nào?', options: ['Cu, Ag', 'Fe, Al, Cr', 'Zn, Mg', 'Na, K'], correct: 1, explain: 'Fe, Al, Cr bị thụ động hóa trong H₂SO₄ đặc nguội và HNO₃ đặc nguội.' },
  { q: 'Kim loại nhẹ nhất có khối lượng riêng 0.534 g/cm³ là gì?', options: ['Aluminium', 'Lithium', 'Magnesium', 'Sodium'], correct: 1, explain: 'Liti là kim loại có khối lượng riêng nhỏ nhất.' },
];

const WIN_PROGRESS = 100;
export default function QuizRacingGame() {
  const [config] = useState(() => {
    try {
      const saved = localStorage.getItem('cs-game:racing:config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { defaultLanes: 2, stepProgress: 25 };
  });

  const [teamCount, setTeamCount] = useState(config.defaultLanes || 2);
  const stepProgress = config.stepProgress || 25;
  const [teams, setTeams] = useState(INITIAL_TEAMS);
  const [currentTurnIdx, setCurrentTurnIdx] = useState(0);
  const [questions, setQuestions] = useState(() => {
    try {
      const saved = localStorage.getItem('cs-game:racing:questions');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_QUESTIONS;
  });

  const [qIndex, setQIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [winnerTeam, setWinnerTeam] = useState(null);
  const [boostingTeamId, setBoostingTeamId] = useState(null);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [paused, setPaused] = useState(false);

  const activeTeams = teams.slice(0, teamCount);
  const currentTeam = activeTeams[currentTurnIdx % activeTeams.length];
  const currQ = questions[qIndex % questions.length] || DEFAULT_QUESTIONS[0];

  useEffect(() => {
    try {
      localStorage.setItem('cs-game:racing:questions', JSON.stringify(questions));
    } catch {}
  }, [questions]);

  const handleSelectOption = (idx) => {
    if (revealed || winnerTeam || paused) return;
    setSelectedAnswer(idx);
    setRevealed(true);

    const isCorrect = idx === currQ.correct;

    if (isCorrect) {
      sound.correct();
      sound.turbo();
      setBoostingTeamId(currentTeam.id);
      setTimeout(() => setBoostingTeamId(null), 1200);

      const nextProgress = Math.min(WIN_PROGRESS, currentTeam.progress + stepProgress);

      setTeams((prev) =>
        prev.map((t) =>
          t.id === currentTeam.id
            ? { ...t, progress: nextProgress, score: t.score + 100 }
            : t
        )
      );

      if (nextProgress >= WIN_PROGRESS) {
        setTimeout(() => {
          sound.cheer();
          sound.win();
          setWinnerTeam(currentTeam);
        }, 800);
        return;
      }
    } else {
      sound.wrong();
    }

    setTimeout(() => {
      setSelectedAnswer(null);
      setRevealed(false);
      setCurrentTurnIdx((i) => (i + 1) % activeTeams.length);
      setQIndex((q) => q + 1);
    }, 2200);
  };

  const handleRestart = () => {
    setTeams((prev) => prev.map((t) => ({ ...t, progress: 0, score: 0 })));
    setCurrentTurnIdx(0);
    setQIndex(0);
    setSelectedAnswer(null);
    setRevealed(false);
    setWinnerTeam(null);
    setBoostingTeamId(null);
    sound.ding();
  };

  return (
    <div className="classroom-game-container">
      {/* Top Controller Bar */}
      <GameBar
        paused={paused}
        onTogglePause={() => setPaused((p) => !p)}
        className="game-top-bar"
      />

      {/* Header */}
      <header className="cg-header">
        <div className="cg-badge">ĐUA XE TỐC ĐỘ · NITRO CHEMICAL GRAND PRIX</div>
        <h1 className="cg-title">Quiz Racing Championship</h1>
        <p className="cg-subtitle">
          Trả lời đúng kích hoạt Turbo Nitro phóng vút về đích. Đội nào cán đích 100% trước sẽ vô địch!
        </p>
      </header>

      {/* Teams and settings bar */}
      <div className="cg-stats-row">
        <div className="race-team-selector">
          <span style={{ fontSize: '0.85rem', fontWeight: 700, marginRight: '0.25rem' }}>Số làn đua:</span>
          {[2, 3, 4].map((cnt) => (
            <button
              key={cnt}
              type="button"
              className={`race-cnt-btn ${teamCount === cnt ? 'active' : ''}`}
              onClick={() => {
                setTeamCount(cnt);
                handleRestart();
              }}
            >
              {cnt} Đội
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <SvgRaceCar size={22} color={currentTeam?.color} />
          <span>
            Lượt đua: <strong style={{ color: currentTeam?.color }}>{currentTeam?.name}</strong>
          </span>
        </div>
      </div>

      {/* Race Track Arena */}
      <div className="race-arena-card">
        <div className="race-tracks-grid">
          {activeTeams.map((team, idx) => {
            const isTurn = team.id === currentTeam?.id;
            const isBoosting = team.id === boostingTeamId;

            return (
              <div
                key={team.id}
                className={`race-lane ${isTurn ? 'lane-active' : ''}`}
                style={{ '--team-color': team.color }}
              >
                {/* Lane Header */}
                <div className="lane-label">
                  <span style={{ color: 'var(--mut, #64748b)' }}>Làn {idx + 1}: <strong style={{ color: team.color }}>{team.name}</strong></span>
                  <span style={{ fontWeight: 800 }}>{team.progress}%</span>
                </div>

                {/* Track road */}
                <div className="lane-road">
                  <div className="road-marker marker-25" />
                  <div className="road-marker marker-50" />
                  <div className="road-marker marker-75" />

                  {/* Finish line */}
                  <div className="road-finish-line" />

                  {/* Racing Car SVG */}
                  <div
                    className={`race-car ${isBoosting ? 'car-nitro' : ''}`}
                    style={{
                      left: `calc(${team.progress}% * 0.88)`,
                      color: team.color,
                    }}
                  >
                    <SvgRaceCar size={32} color={team.color} />
                    {isBoosting && <SvgNitro size={22} color="#f97316" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Question Card */}
      {!winnerTeam && (
        <div
          className="cg-question-box animate-pop"
          style={{ borderColor: currentTeam?.color }}
        >
          <div className="cg-q-header">
            <span className="q-badge" style={{ background: currentTeam?.color, color: '#ffffff' }}>
              LƯỢT ĐUA: {currentTeam?.name.toUpperCase()}
            </span>
            <span className="q-turn-announce">
              Câu hỏi {(qIndex % questions.length) + 1} / {questions.length}
            </span>
          </div>

          <h2 className="cg-question-text">{currQ.q}</h2>

          <div className="cg-options-grid">
            {currQ.options.map((opt, idx) => {
              const isPicked = selectedAnswer === idx;
              const isCorrectOpt = idx === currQ.correct;
              let optClass = 'cg-option-btn';

              if (revealed) {
                if (isCorrectOpt) optClass += ' opt-correct';
                else if (isPicked && !isCorrectOpt) optClass += ' opt-wrong';
                else optClass += ' opt-disabled';
              }

              return (
                <button
                  key={idx}
                  type="button"
                  className={optClass}
                  onClick={() => handleSelectOption(idx)}
                  disabled={revealed}
                >
                  <span className="opt-letter">{['A', 'B', 'C', 'D'][idx]}</span>
                  <span className="opt-label">{opt}</span>
                </button>
              );
            })}
          </div>

          {revealed && currQ.explain && (
            <div className="cg-explain-box animate-fade-in">
              <SvgLightbulb size={20} color="#f59e0b" />
              <p className="explain-text">{currQ.explain}</p>
            </div>
          )}
        </div>
      )}

      {/* Winner Podium */}
      {winnerTeam && (
        <div className="cg-modal-backdrop">
          <div className="cg-victory-modal animate-pop">
            <SvgTrophy size={64} color="#f59e0b" />
            <h2 className="victory-title" style={{ color: winnerTeam.color }}>
              {winnerTeam.name.toUpperCase()} CÁN ĐÍCH VÔ ĐỊCH!
            </h2>
            <p className="victory-desc">
              Chiến thắng xuất sắc trên đường đua tốc độ với {winnerTeam.score} điểm tuyệt đối!
            </p>
            <div className="victory-actions">
              <button type="button" className="cg-btn-primary" onClick={handleRestart}>
                Khởi động cuộc đua mới
              </button>
              <button
                type="button"
                className="cg-btn-secondary"
                onClick={() => setShowBankPicker(true)}
              >
                Thay đổi đề câu hỏi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Controls */}
      <footer className="cg-footer-actions">
        <button
          type="button"
          className="cg-action-btn"
          onClick={() => setShowBankPicker(true)}
        >
          Ngân hàng câu hỏi ({questions.length})
        </button>
        <button type="button" className="cg-action-btn" onClick={handleRestart}>
          Đặt lại vạch xuất phát
        </button>
        <a href="#games" className="cg-action-btn btn-ghost">
          ← Danh sách Games
        </a>
      </footer>

      {showBankPicker && (
        <QuestionBankPicker
          mode="list"
          maxCount={25}
          onApply={(picked) => {
            if (picked && picked.length > 0) {
              setQuestions(picked);
              handleRestart();
            }
            setShowBankPicker(false);
          }}
          onClose={() => setShowBankPicker(false)}
        />
      )}
    </div>
  );
}
