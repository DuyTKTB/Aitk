import { useState, useEffect } from 'react';
import GameBar from './GameBar.jsx';
import QuestionBankPicker from './QuestionBankPicker.jsx';
import sound from '../../lib/gameSound.js';
import {
  SvgTrophy,
  SvgFlag,
  SvgTimer,
  SvgLightbulb,
  SvgPullRope,
} from './ClassroomGameIcons.jsx';
import '../../styles/classroom-games.css';

const DEFAULT_QUESTIONS = [
  {
    q: 'Kim loại nào dẫn điện tốt nhất trong các kim loại sau?',
    options: ['Copper (Cu)', 'Silver (Ag)', 'Gold (Au)', 'Aluminium (Al)'],
    correct: 1,
    explain: 'Silver (Ag) là kim loại có độ dẫn điện và dẫn nhiệt cao nhất.',
  },
  {
    q: 'Khí nào chiếm thể tích lớn nhất trong không khí quyển Trái Đất?',
    options: ['Oxy (O₂)', 'Nitơ (N₂)', 'Cacbonic (CO₂)', 'Argon (Ar)'],
    correct: 1,
    explain: 'Nitơ (N₂) chiếm khoảng 78% thể tích không khí.',
  },
  {
    q: 'Dung dịch làm quỳ tím chuyển sang màu đỏ là gì?',
    options: ['Dung dịch Axit', 'Dung dịch Bazơ', 'Dung dịch Muối ăn', 'Nước cất'],
    correct: 0,
    explain: 'Axit làm quỳ tím hóa đỏ (pH < 7).',
  },
  {
    q: 'Công thức hóa học của vôi sống là gì?',
    options: ['CaCO₃', 'CaO', 'Ca(OH)₂', 'CaCl₂'],
    correct: 1,
    explain: 'CaO là Canxi oxit (vôi sống), còn CaCO₃ là đá vôi.',
  },
  {
    q: 'Chất nào sau đây là kim loại kiềm nhóm IA?',
    options: ['Magnesium (Mg)', 'Calcium (Ca)', 'Sodium (Na)', 'Aluminium (Al)'],
    correct: 2,
    explain: 'Sodium (Na) thuộc nhóm IA (kim loại kiềm).',
  },
  {
    q: 'Phản ứng tỏa nhiệt là phản ứng có đặc điểm gì?',
    options: ['Hấp thụ nhiệt từ môi trường', 'Giải phóng năng lượng dưới dạng nhiệt', 'Không thay đổi nhiệt độ', 'Làm lạnh môi trường'],
    correct: 1,
    explain: 'Phản ứng tỏa nhiệt (ΔH < 0) giải phóng nhiệt lượng ra môi trường.',
  },
  {
    q: 'Hợp chất hữu cơ nào sau đây là este?',
    options: ['CH₃COOH', 'C₂H₅OH', 'CH₃COOC₂H₅', 'CH₃CHO'],
    correct: 2,
    explain: 'Etyl axetat (CH₃COOC₂H₅) là este có mùi thơm hoa quả.',
  },
  {
    q: 'Kim loại duy nhất ở thể lỏng ở nhiệt độ phòng là gì?',
    options: ['Lead (Pb)', 'Mercury (Hg)', 'Zinc (Zn)', 'Tin (Sn)'],
    correct: 1,
    explain: 'Mercury (Hg) nóng chảy ở -38.83°C nên ở thể lỏng ở nhiệt độ thường.',
  },
  {
    q: 'Chất nào làm quỳ tím chuyển sang màu xanh?',
    options: ['HCl', 'H₂SO₄', 'NaOH', 'NaCl'],
    correct: 2,
    explain: 'Dung dịch kiềm NaOH làm quỳ tím hóa xanh.',
  },
  {
    q: 'Nguyên tố phổ biến nhất trong vỏ Trái Đất là gì?',
    options: ['Silicon (Si)', 'Oxy (O)', 'Iron (Fe)', 'Aluminium (Al)'],
    correct: 1,
    explain: 'Oxy chiếm gần 47% khối lượng vỏ Trái Đất.',
  },
];

export default function TugOfWarGame() {
  const [config] = useState(() => {
    try {
      const saved = localStorage.getItem('cs-game:tugofwar:config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { timer: 25, winThreshold: 4, teamRed: 'Đội Đỏ', teamBlue: 'Đội Xanh' };
  });

  const baseTimer = config.timer || 25;
  const winThreshold = config.winThreshold || 4;
  const teamNames = { red: config.teamRed || 'Đội Đỏ', blue: config.teamBlue || 'Đội Xanh' };

  const [questions, setQuestions] = useState(() => {
    try {
      const saved = localStorage.getItem('cs-game:tugofwar:questions');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_QUESTIONS;
  });

  const [currentTurn, setCurrentTurn] = useState('red');
  const [ropePosition, setRopePosition] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [winner, setWinner] = useState(null);
  const [score, setScore] = useState({ red: 0, blue: 0 });
  const [isPulling, setIsPulling] = useState(false);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [timer, setTimer] = useState(baseTimer);
  const [paused, setPaused] = useState(false);

  const currQ = questions[questionIndex % questions.length] || DEFAULT_QUESTIONS[0];

  useEffect(() => {
    try {
      localStorage.setItem('cs-game:tugofwar:questions', JSON.stringify(questions));
    } catch {}
  }, [questions]);

  useEffect(() => {
    if (winner || paused || revealed) return;
    if (timer <= 0) {
      handleTimeout();
      return;
    }
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer, winner, paused, revealed]);

  const handleTimeout = () => {
    sound.wrong();
    setRevealed(true);
    setTimeout(() => {
      nextTurn();
    }, 2200);
  };

  const nextTurn = () => {
    setSelectedOption(null);
    setRevealed(false);
    setTimer(baseTimer);
    setCurrentTurn((t) => (t === 'red' ? 'blue' : 'red'));
    setQuestionIndex((i) => i + 1);
  };

  const handleSelectOption = (idx) => {
    if (revealed || winner || paused) return;
    setSelectedOption(idx);
    setRevealed(true);

    const isCorrect = idx === currQ.correct;

    if (isCorrect) {
      sound.correct();
      sound.pull();
      setIsPulling(true);
      setTimeout(() => setIsPulling(false), 900);

      const step = currentTurn === 'red' ? -1 : 1;
      const nextPos = ropePosition + step;
      setRopePosition(nextPos);
      setScore((s) => ({ ...s, [currentTurn]: s[currentTurn] + 100 }));

      if (nextPos <= -winThreshold) {
        sound.cheer();
        sound.win();
        setWinner('red');
        return;
      } else if (nextPos >= winThreshold) {
        sound.cheer();
        sound.win();
        setWinner('blue');
        return;
      }
    } else {
      sound.wrong();
    }

    setTimeout(() => {
      nextTurn();
    }, 2200);
  };

  const handleRestart = () => {
    setRopePosition(0);
    setCurrentTurn('red');
    setWinner(null);
    setSelectedOption(null);
    setRevealed(false);
    setTimer(baseTimer);
    setScore({ red: 0, blue: 0 });
    setQuestionIndex(0);
    sound.ding();
  };

  const ropeShiftPercent = (ropePosition / winThreshold) * 45;

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
        <div className="cg-badge">KÉO CO TRI THỨC · ĐỐI KHÁNG ĐỒNG ĐỘI</div>
        <h1 className="cg-title">Tug of War Challenge</h1>
        <p className="cg-subtitle">
          Chia 2 đội Red & Blue. Đội nào trả lời đúng sẽ kéo dây thừng về phía mình!
        </p>
      </header>

      {/* Scoreboard and Turn Indicator */}
      <div className="cg-stats-row">
        <div className={`cg-team-pill team-red ${currentTurn === 'red' ? 'active-turn' : ''}`}>
          <div className="team-avatar-icon icon-red">
            <SvgFlag size={18} color="#ef4444" />
          </div>
          <div className="team-info">
            <span className="team-name">{teamNames.red}</span>
            <span className="team-pts">{score.red} điểm</span>
          </div>
          {currentTurn === 'red' && <span className="turn-tag">ĐẾN LƯỢT</span>}
        </div>

        <div className="cg-timer-pill">
          <SvgTimer size={18} color={timer <= 5 ? '#ef4444' : 'currentColor'} />
          <span className={`timer-num ${timer <= 5 ? 'urgent' : ''}`}>{timer}s</span>
        </div>

        <div className={`cg-team-pill team-blue ${currentTurn === 'blue' ? 'active-turn' : ''}`}>
          {currentTurn === 'blue' && <span className="turn-tag">ĐẾN LƯỢT</span>}
          <div className="team-info text-right">
            <span className="team-name">{teamNames.blue}</span>
            <span className="team-pts">{score.blue} điểm</span>
          </div>
          <div className="team-avatar-icon icon-blue">
            <SvgFlag size={18} color="#0284c7" />
          </div>
        </div>
      </div>

      {/* Tug of War Arena */}
      <div className="tow-arena-card">
        <div className="tow-field">
          {/* Red Team side */}
          <div className={`tow-squad squad-red ${currentTurn === 'red' ? 'pulling' : ''}`}>
            <div className="squad-figures-svg">
              <SvgPullRope size={36} color="#ef4444" />
            </div>
            <div className="squad-label">TEAM ĐỎ</div>
          </div>

          {/* Rope & Central Ribbon */}
          <div className="tow-rope-wrapper">
            <div className="tow-rope-track">
              <div className="marker marker-center" />
              <div className="marker marker-red" />
              <div className="marker marker-blue" />
            </div>

            <div
              className={`tow-rope ${isPulling ? 'rope-strain' : ''}`}
              style={{ transform: `translateX(${ropeShiftPercent}%)` }}
            >
              <div className="rope-ribbon">
                <SvgFlag size={24} color="#f59e0b" />
              </div>
            </div>
          </div>

          {/* Blue Team side */}
          <div className={`tow-squad squad-blue ${currentTurn === 'blue' ? 'pulling' : ''}`}>
            <div className="squad-figures-svg">
              <SvgPullRope size={36} color="#0284c7" />
            </div>
            <div className="squad-label">TEAM XANH</div>
          </div>
        </div>

        {/* Rope gauge indicator */}
        <div className="tow-gauge-bar">
          <div
            className="gauge-progress red-gauge"
            style={{ width: `${Math.max(0, -ropePosition) * 25}%` }}
          />
          <div className="gauge-center-notch" />
          <div
            className="gauge-progress blue-gauge"
            style={{ width: `${Math.max(0, ropePosition) * 25}%` }}
          />
        </div>
        <div className="tow-gauge-text">
          {ropePosition === 0 && 'Dây đang ở vị trí cân bằng giữa 2 đội'}
          {ropePosition < 0 && `Đội Đỏ đang kéo lệch ${Math.abs(ropePosition)}/${WIN_THRESHOLD} nấc`}
          {ropePosition > 0 && `Đội Xanh đang kéo lệch ${ropePosition}/${WIN_THRESHOLD} nấc`}
        </div>
      </div>

      {/* Question Card */}
      {!winner && (
        <div className={`cg-question-box ${currentTurn === 'red' ? 'turn-border-red' : 'turn-border-blue'}`}>
          <div className="cg-q-header">
            <span className="q-badge">CÂU {(questionIndex % questions.length) + 1} / {questions.length}</span>
            <span className="q-turn-announce">
              Lượt thi: <strong>{currentTurn === 'red' ? teamNames.red : teamNames.blue}</strong>
            </span>
          </div>

          <h2 className="cg-question-text">{currQ.q}</h2>

          <div className="cg-options-grid">
            {currQ.options.map((opt, idx) => {
              const isPicked = selectedOption === idx;
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
                  <span className="opt-letter">{String.fromCharCode(65 + idx)}</span>
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

      {/* Winner Overlay */}
      {winner && (
        <div className="cg-modal-backdrop">
          <div className="cg-victory-modal animate-pop">
            <SvgTrophy size={64} color="#f59e0b" />
            <h2 className="victory-title">
              {winner === 'red' ? teamNames.red : teamNames.blue} VÔ ĐỊCH!
            </h2>
            <p className="victory-desc">
              Kéo đổ đối thủ xuất sắc với tỉ số {score[winner]} điểm. Chúc mừng chiến thắng!
            </p>
            <div className="victory-actions">
              <button type="button" className="cg-btn-primary" onClick={handleRestart}>
                Chơi ván mới
              </button>
              <button
                type="button"
                className="cg-btn-secondary"
                onClick={() => setShowBankPicker(true)}
              >
                Đổi bộ câu hỏi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Control Buttons Footer */}
      <footer className="cg-footer-actions">
        <button
          type="button"
          className="cg-action-btn"
          onClick={() => setShowBankPicker(true)}
        >
          Ngân hàng câu hỏi ({questions.length})
        </button>
        <button type="button" className="cg-action-btn" onClick={handleRestart}>
          Reset ván đấu
        </button>
        <a href="#games" className="cg-action-btn btn-ghost">
          ← Danh sách Games
        </a>
      </footer>

      {/* Question Bank Picker Modal */}
      {showBankPicker && (
        <QuestionBankPicker
          mode="list"
          maxCount={30}
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
