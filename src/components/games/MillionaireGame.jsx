import { useState, useEffect } from 'react';
import GameBar from './GameBar.jsx';
import QuestionBankPicker from './QuestionBankPicker.jsx';
import sound from '../../lib/gameSound.js';
import {
  SvgTrophy,
  SvgRobot,
  SvgAudience,
  SvgLightbulb,
} from './ClassroomGameIcons.jsx';
import '../../styles/classroom-games.css';

const MONEY_LADDER = [
  { level: 1, prize: '200.000 đ' },
  { level: 2, prize: '400.000 đ' },
  { level: 3, prize: '600.000 đ' },
  { level: 4, prize: '1.000.000 đ' },
  { level: 5, prize: '2.000.000 đ', milestone: true },
  { level: 6, prize: '3.000.000 đ' },
  { level: 7, prize: '6.000.000 đ' },
  { level: 8, prize: '10.000.000 đ' },
  { level: 9, prize: '14.000.000 đ' },
  { level: 10, prize: '22.000.000 đ', milestone: true },
  { level: 11, prize: '30.000.000 đ' },
  { level: 12, prize: '40.000.000 đ' },
  { level: 13, prize: '60.000.000 đ' },
  { level: 14, prize: '85.000.000 đ' },
  { level: 15, prize: '150.000.000 đ', milestone: true },
];

const DEFAULT_15_QUESTIONS = [
  { q: 'Ký hiệu hóa học của khí Oxy là gì?', options: ['O', 'O₂', 'O₃', 'Ox'], correct: 1, explain: 'Đơn chất khí oxy tồn tại dưới dạng phân tử O₂.' },
  { q: 'Nước nguyên chất sôi ở bao nhiêu độ C ở áp suất 1 atm?', options: ['90°C', '95°C', '100°C', '110°C'], correct: 2, explain: 'Nhiệt độ sôi chuẩn của nước là 100°C.' },
  { q: 'Khí nào cần thiết cho sự hô hấp của con người và động vật?', options: ['Cacbonic', 'Oxy', 'Nitơ', 'Hidro'], correct: 1, explain: 'Khí oxy duy trì sự sống và sự hô hấp.' },
  { q: 'Kim loại nào có trong thành phần của hemoglobin trong máu?', options: ['Đồng', 'Kẽm', 'Sắt', 'Canxi'], correct: 2, explain: 'Sắt (Fe) là thành phần cấu tạo hồng cầu.' },
  { q: 'Dung dịch nào có pH bằng 7 ở 25°C?', options: ['Nước cất tinh khiết', 'Nước chanh', 'Nước xà phòng', 'Giấm ăn'], correct: 0, explain: 'Nước cất trung tính có pH = 7.' },
  { q: 'Chất nào sau đây là oxit lưỡng tính?', options: ['Na₂O', 'Al₂O₃', 'CaO', 'SO₂'], correct: 1, explain: 'Al₂O₃ phản ứng được cả với axit và dung dịch kiềm.' },
  { q: 'Phản ứng este hóa giữa axit axetic và ancol etylic tạo ra chất gì?', options: ['Metyl axetat', 'Etyl axetat', 'Axit fomic', 'Acrolein'], correct: 1, explain: 'CH₃COOH + C₂H₅OH ⇄ CH₃COOC₂H₅ + H₂O.' },
  { q: 'Chất nào được dùng để sản xuất cồn y tế diệt khuẩn 70°?', options: ['Metanol', 'Etanol', 'Glixerol', 'Phenol'], correct: 1, explain: 'Etanol (C₂H₅OH) 70° có tác dụng diệt khuẩn mạnh nhất.' },
  { q: 'Kim loại có nhiệt độ nóng chảy cao nhất được dùng làm dây tóc bóng đèn là?', options: ['Platin', 'Vonfram (W)', 'Titan', 'Molypden'], correct: 1, explain: 'Vonfram nóng chảy ở 3422°C.' },
  { q: 'Nguyên tố halogen nào có độ âm điện lớn nhất trong bảng tuần hoàn?', options: ['Clo (Cl)', 'Brom (Br)', 'Iot (I)', 'Flo (F)'], correct: 3, explain: 'Flo (F) có độ âm điện xấp xỉ 3.98 theo thang Pauling.' },
  { q: 'Đồng phân hình học cis-trans xuất hiện khi hợp chất hữu cơ có đặc điểm gì?', options: ['Có liên kết ba', 'Có vòng 6 cạnh', 'Có nối đôi và các nhóm thế ở mỗi C khác nhau', 'Có liên kết hidro'], correct: 2, explain: 'Điều kiện cần có liên kết đôi C=C và mỗi nguyên tử C nối với hai nhóm thế khác nhau.' },
  { q: 'Chất làm mất màu dung dịch thuốc tím KMnO₄ ở nhiệt độ thường là chất nào?', options: ['Metan', 'Benzen', 'Etylen', 'Etan'], correct: 2, explain: 'Etylen có liên kết đôi làm mất màu tím của dung dịch KMnO₄.' },
  { q: 'Hằng số Faraday (F) có giá trị xấp xỉ bao nhiêu C/mol?', options: ['96.500', '6.023 × 10²³', '8.314', '22.4'], correct: 0, explain: 'Hằng số Faraday F ≈ 96500 C/mol electron.' },
  { q: 'Chất nào là polyme thiên nhiên được ong dùng xây tổ?', options: ['Sáp ong', 'Tơ tằm', 'Cao su thiên nhiên', 'Cellulose'], correct: 0, explain: 'Sáp ong là este của monoancol cao và axit béo mạch dài.' },
  { q: 'Ai là người đầu tiên tìm ra định luật bảo toàn khối lượng trong hóa học?', options: ['John Dalton', 'Mikhail Lomonosov & Lavoisier', 'Robert Boyle', 'Ernest Rutherford'], correct: 1, explain: 'Lomonosov (1748) và Lavoisier (1789) đặt nền móng cho Hóa học hiện đại.' },
];

export default function MillionaireGame() {
  const [questions, setQuestions] = useState(() => {
    try {
      const saved = localStorage.getItem('cs-game:millionaire:questions');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_15_QUESTIONS;
  });

  const [currentLevel, setCurrentLevel] = useState(1);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [lockedAnswer, setLockedAnswer] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isWinner, setIsWinner] = useState(false);

  const [used5050, setUsed5050] = useState(false);
  const [usedAI, setUsedAI] = useState(false);
  const [usedAudience, setUsedAudience] = useState(false);

  const [hiddenOptions, setHiddenOptions] = useState([]);
  const [aiModal, setAiModal] = useState(false);
  const [audienceModal, setAudienceModal] = useState(false);
  const [audienceStats, setAudienceStats] = useState(null);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [paused, setPaused] = useState(false);

  const currQ = questions[(currentLevel - 1) % questions.length] || DEFAULT_15_QUESTIONS[0];

  useEffect(() => {
    try {
      localStorage.setItem('cs-game:millionaire:questions', JSON.stringify(questions));
    } catch {}
  }, [questions]);

  const handlePickOption = (idx) => {
    if (lockedAnswer || gameOver || revealed || paused) return;
    setSelectedAnswer(idx);
    sound.ding();
  };

  const handleLockIn = () => {
    if (selectedAnswer === null || lockedAnswer || gameOver || revealed) return;
    setLockedAnswer(true);

    setTimeout(() => {
      setRevealed(true);
      const isCorrect = selectedAnswer === currQ.correct;

      if (isCorrect) {
        sound.correct();
        if (currentLevel === 15) {
          setTimeout(() => {
            sound.cheer();
            sound.win();
            setIsWinner(true);
            setGameOver(true);
          }, 1500);
        } else {
          setTimeout(() => {
            setCurrentLevel((lvl) => lvl + 1);
            setSelectedAnswer(null);
            setLockedAnswer(false);
            setRevealed(false);
            setHiddenOptions([]);
          }, 2200);
        }
      } else {
        sound.wrong();
        setTimeout(() => {
          setGameOver(true);
        }, 1500);
      }
    }, 1800);
  };

  const handleUse5050 = () => {
    if (used5050 || lockedAnswer || revealed) return;
    setUsed5050(true);
    sound.ding();

    const correctIdx = currQ.correct;
    const wrongIndices = [0, 1, 2, 3].filter((i) => i !== correctIdx);
    const shuffled = wrongIndices.sort(() => 0.5 - Math.random());
    setHiddenOptions([shuffled[0], shuffled[1]]);
  };

  const handleUseAI = () => {
    if (usedAI || lockedAnswer || revealed) return;
    setUsedAI(true);
    sound.turbo();
    setAiModal(true);
  };

  const handleUseAudience = () => {
    if (usedAudience || lockedAnswer || revealed) return;
    setUsedAudience(true);
    sound.wheel();

    const correct = currQ.correct;
    const correctPercent = Math.floor(65 + Math.random() * 25);
    const remaining = 100 - correctPercent;
    const p1 = Math.floor(Math.random() * remaining);
    const p2 = Math.floor(Math.random() * (remaining - p1));
    const p3 = remaining - p1 - p2;

    const stats = [0, 0, 0, 0];
    stats[correct] = correctPercent;
    const wrongSlots = [0, 1, 2, 3].filter((i) => i !== correct);
    stats[wrongSlots[0]] = p1;
    stats[wrongSlots[1]] = p2;
    stats[wrongSlots[2]] = p3;

    setAudienceStats(stats);
    setAudienceModal(true);
  };

  const handleRestart = () => {
    setCurrentLevel(1);
    setSelectedAnswer(null);
    setLockedAnswer(false);
    setRevealed(false);
    setGameOver(false);
    setIsWinner(false);
    setUsed5050(false);
    setUsedAI(false);
    setUsedAudience(false);
    setHiddenOptions([]);
    sound.ding();
  };

  const getGuaranteedPrize = () => {
    if (currentLevel > 10) return '22.000.000 đ';
    if (currentLevel > 5) return '2.000.000 đ';
    return '0 đ';
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
        <div className="cg-badge">GAMESHOW TRUYỀN HÌNH · AI LÀ TRIỆU PHÚ</div>
        <h1 className="cg-title">Chem Millionaire Studio</h1>
        <p className="cg-subtitle">
          15 câu hỏi hóa học cân não. 3 quyền trợ giúp thông minh cùng trợ lý ELEC AI!
        </p>
      </header>

      {/* Main Studio Arena: Questions + Ladder */}
      <div className="mil-studio-layout">
        <div className="mil-main-stage">
          {/* 3 Trợ giúp */}
          <div className="mil-lifelines-bar">
            <button
              type="button"
              className={`lifeline-btn ${used5050 ? 'used' : ''}`}
              onClick={handleUse5050}
              disabled={used5050 || lockedAnswer || revealed}
            >
              <span className="btn-lbl">50:50 (Loại 2 sai)</span>
            </button>

            <button
              type="button"
              className={`lifeline-btn ${usedAI ? 'used' : ''}`}
              onClick={handleUseAI}
              disabled={usedAI || lockedAnswer || revealed}
            >
              <SvgRobot size={18} color="#38bdf8" />
              <span className="btn-lbl">Hỏi ELEC AI</span>
            </button>

            <button
              type="button"
              className={`lifeline-btn ${usedAudience ? 'used' : ''}`}
              onClick={handleUseAudience}
              disabled={usedAudience || lockedAnswer || revealed}
            >
              <SvgAudience size={18} color="#10b981" />
              <span className="btn-lbl">Ý kiến cả lớp</span>
            </button>
          </div>

          {/* Question Box */}
          <div className="mil-question-card">
            <div className="mil-q-ribbon">
              <span>CÂU HỎI SỐ {currentLevel} / 15</span>
              <strong style={{ color: '#f59e0b' }}>
                MỨC THƯỞNG: {MONEY_LADDER[currentLevel - 1].prize}
              </strong>
            </div>

            <h2 className="mil-question-text">{currQ.q}</h2>

            <div className="mil-options-diamond">
              {currQ.options.map((opt, idx) => {
                const isHidden = hiddenOptions.includes(idx);
                const isSelected = selectedAnswer === idx;
                const isCorrect = idx === currQ.correct;

                let optClass = 'mil-opt-btn';
                if (isHidden) optClass += ' opt-hidden';
                if (isSelected) optClass += lockedAnswer ? ' opt-locked' : ' opt-selected';
                if (revealed) {
                  if (isCorrect) optClass += ' opt-correct';
                  else if (isSelected && !isCorrect) optClass += ' opt-wrong';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    className={optClass}
                    onClick={() => handlePickOption(idx)}
                    disabled={isHidden || lockedAnswer || revealed}
                  >
                    <span className="opt-letter">{['A', 'B', 'C', 'D'][idx]}</span>
                    <span className="opt-val">{opt}</span>
                  </button>
                );
              })}
            </div>

            {selectedAnswer !== null && !revealed && (
              <div className="mil-lock-action animate-fade-in">
                <button
                  type="button"
                  className="mil-lock-btn"
                  onClick={handleLockIn}
                  disabled={lockedAnswer}
                >
                  {lockedAnswer ? 'ĐANG CHỜ KẾT QUẢ…' : 'CHỐT ĐÁP ÁN NÀY'}
                </button>
              </div>
            )}

            {revealed && currQ.explain && (
              <div className="cg-explain-box animate-fade-in" style={{ marginTop: '0.5rem' }}>
                <SvgLightbulb size={20} color="#f59e0b" />
                <p className="explain-text">{currQ.explain}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Arena: 15-Level Prize Ladder */}
        <aside className="mil-ladder-card">
          <h3 className="ladder-title">Thang tiền thưởng</h3>
          <div className="ladder-list">
            {[...MONEY_LADDER].reverse().map((item) => {
              const isCurrent = item.level === currentLevel;
              const isPast = item.level < currentLevel;

              let itemClass = 'ladder-row';
              if (item.milestone) itemClass += ' milestone';
              if (isCurrent) itemClass += ' current-row';
              if (isPast) itemClass += ' past-row';

              return (
                <div key={item.level} className={itemClass}>
                  <span style={{ width: '22px' }}>{item.level}</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>◆</span>
                  <span>{item.prize}</span>
                </div>
              );
            })}
          </div>
        </aside>
      </div>

      {/* AI Modal */}
      {aiModal && (
        <div className="cg-modal-backdrop">
          <div className="cg-victory-modal animate-pop" style={{ maxWidth: 540, textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <SvgRobot size={24} color="#38bdf8" />
              <h3 className="victory-title" style={{ fontSize: '1.25rem' }}>ELEC AI Trợ giúp</h3>
            </div>
            <p className="victory-desc" style={{ marginTop: '0.5rem' }}>
              Theo cơ sở dữ liệu hóa học, đáp án chính xác là phương án{' '}
              <strong style={{ color: '#0284c7' }}>
                {['A', 'B', 'C', 'D'][currQ.correct]}: {currQ.options[currQ.correct]}
              </strong>
              . {currQ.explain}
            </p>
            <div className="victory-actions">
              <button
                type="button"
                className="cg-btn-primary"
                onClick={() => setAiModal(false)}
              >
                Cảm ơn AI, đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audience Poll Modal */}
      {audienceModal && audienceStats && (
        <div className="cg-modal-backdrop">
          <div className="cg-victory-modal animate-pop" style={{ maxWidth: 520, textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <SvgAudience size={24} color="#10b981" />
              <h3 className="victory-title" style={{ fontSize: '1.25rem' }}>Ý kiến bình chọn cả lớp</h3>
            </div>
            <div style={{ display: 'flex', gap: '1rem', width: '100%', marginTop: '1.5rem', justifyContent: 'center' }}>
              {['A', 'B', 'C', 'D'].map((letter, i) => (
                <div key={letter} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', flex: 1 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{audienceStats[i]}%</span>
                  <div style={{ width: '100%', height: '140px', background: 'var(--surface-2, #f1f5f9)', borderRadius: '8px', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
                    <div style={{ width: '100%', height: `${audienceStats[i]}%`, background: '#10b981', transition: 'height 0.5s ease' }} />
                  </div>
                  <strong style={{ fontSize: '1rem' }}>{letter}</strong>
                </div>
              ))}
            </div>
            <div className="victory-actions" style={{ marginTop: '1rem' }}>
              <button
                type="button"
                className="cg-btn-primary"
                onClick={() => setAudienceModal(false)}
              >
                Tiếp tục cuộc chơi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over / Victory Modal */}
      {gameOver && (
        <div className="cg-modal-backdrop">
          <div className="cg-victory-modal animate-pop">
            <SvgTrophy size={64} color={isWinner ? '#f59e0b' : '#64748b'} />
            <h2 className="victory-title">
              {isWinner ? 'CHÚC MỪNG TÂN TRIỆU PHÚ HÓA HỌC!' : 'CUỘC CHƠI DỪNG LẠI!'}
            </h2>
            <p className="victory-desc">
              {isWinner
                ? 'Bạn đã vượt qua xuất sắc cả 15 câu hỏi và rinh về 150.000.000 đ tiền thưởng!'
                : `Bạn dừng chân tại câu hỏi số ${currentLevel}. Phần thưởng an toàn: ${getGuaranteedPrize()}`}
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
                Đổi bộ đề 15 câu
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
          Chơi lại từ câu 1
        </button>
        <a href="#games" className="cg-action-btn btn-ghost">
          ← Danh sách Games
        </a>
      </footer>

      {showBankPicker && (
        <QuestionBankPicker
          mode="list"
          maxCount={15}
          onApply={(picked) => {
            if (picked && picked.length >= 10) {
              setQuestions(picked);
              handleRestart();
            } else {
              alert('Cần ít nhất 10-15 câu hỏi cho gameshow!');
            }
            setShowBankPicker(false);
          }}
          onClose={() => setShowBankPicker(false)}
        />
      )}
    </div>
  );
}
