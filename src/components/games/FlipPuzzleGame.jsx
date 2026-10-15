import { useState, useEffect } from 'react';
import GameBar from './GameBar.jsx';
import QuestionBankPicker from './QuestionBankPicker.jsx';
import sound from '../../lib/gameSound.js';
import {
  SvgTrophy,
  SvgKey,
  SvgPuzzlePiece,
  SvgLightbulb,
  SvgQuestion,
} from './ClassroomGameIcons.jsx';
import '../../styles/classroom-games.css';

/* Default secret mystery packs */
const SECRET_PACKS = [
  {
    id: 'mendeleev',
    title: 'Dmitri Mendeleev (1834 - 1907)',
    keyword: 'MENDELEEV',
    hint: 'Nhà hóa học người Nga sáng lập Bảng tuần hoàn các nguyên tố hóa học năm 1869.',
    imageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80',
    color: '#0284c7',
  },
  {
    id: 'benzene',
    title: 'Cấu trúc Vòng Benzen C₆H₆',
    keyword: 'BENZEN',
    hint: 'Nhà hóa học Friedrich August Kekulé nằm mơ thấy con rắn cắn đuôi mình.',
    imageUrl: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&w=800&q=80',
    color: '#8b5cf6',
  },
  {
    id: 'curie',
    title: 'Marie Curie (1867 - 1934)',
    keyword: 'MARIE CURIE',
    hint: 'Nữ bác học duy nhất đạt 2 giải Nobel ở 2 lĩnh vực khoa học khác nhau (Vật lý và Hóa học).',
    imageUrl: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=800&q=80',
    color: '#ec4899',
  },
];

const DEFAULT_QUESTIONS_9 = [
  { q: 'Số hiệu nguyên tử của Carbon (C) là mấy?', options: ['4', '6', '12', '14'], correct: 1 },
  { q: 'Khí cười dùng trong y tế là hợp chất nào?', options: ['NO', 'NO₂', 'N₂O', 'NH₃'], correct: 2 },
  { q: 'Nước đá khô là trạng thái rắn của chất nào?', options: ['H₂O', 'CO₂', 'CH₄', 'SO₂'], correct: 1 },
  { q: 'Dung dịch Brom (Br₂) có màu gì đặc trưng?', options: ['Xanh lam', 'Tím', 'Da cam / Nâu đỏ', 'Vàng chanh'], correct: 2 },
  { q: 'Axit trong dạ dày người hỗ trợ tiêu hóa là gì?', options: ['H₂SO₄', 'HCl', 'HNO₃', 'CH₃COOH'], correct: 1 },
  { q: 'Nguyên tố nhẹ nhất trong vũ trụ là gì?', options: ['Helium', 'Hydrogen', 'Lithium', 'Carbon'], correct: 1 },
  { q: 'Kim loại nào cứng nhất thế giới?', options: ['Titanium', 'Tungsten', 'Chromium', 'Iron'], correct: 2 },
  { q: 'Dung dịch CuSO₄ trong nước có màu gì?', options: ['Xanh lam', 'Đỏ thẫm', 'Xanh lá mạ', 'Không màu'], correct: 0 },
  { q: 'Đơn vị đo lượng chất trong hóa học là gì?', options: ['Gam (g)', 'Lít (L)', 'Mol', 'Độ C'], correct: 2 },
];

export default function FlipPuzzleGame() {
  const [packIndex, setPackIndex] = useState(0);
  const activePack = SECRET_PACKS[packIndex % SECRET_PACKS.length];

  const [questions, setQuestions] = useState(() => {
    try {
      const saved = localStorage.getItem('cs-game:flip:questions');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_QUESTIONS_9;
  });

  const [revealedTiles, setRevealedTiles] = useState(Array(9).fill(false));
  const [activeTileIndex, setActiveTileIndex] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [revealedAnswer, setRevealedAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [showGuessModal, setShowGuessModal] = useState(false);
  const [guessInput, setGuessInput] = useState('');
  const [isVictory, setIsVictory] = useState(false);
  const [guessError, setGuessError] = useState('');
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('cs-game:flip:questions', JSON.stringify(questions));
    } catch {}
  }, [questions]);

  const allFlipped = revealedTiles.every(Boolean);

  useEffect(() => {
    if (allFlipped && !isVictory) {
      setIsVictory(true);
      sound.cheer();
      sound.win();
    }
  }, [allFlipped, isVictory]);

  const handleTileClick = (idx) => {
    if (revealedTiles[idx] || isVictory || paused) return;
    setActiveTileIndex(idx);
    setSelectedAnswer(null);
    setRevealedAnswer(false);
    sound.ding();
  };

  const handleAnswerQuestion = (ansIdx) => {
    if (revealedAnswer || activeTileIndex === null) return;
    setSelectedAnswer(ansIdx);
    setRevealedAnswer(true);

    const q = questions[activeTileIndex] || DEFAULT_QUESTIONS_9[0];
    const isCorrect = ansIdx === q.correct;

    if (isCorrect) {
      sound.correct();
      setTimeout(() => {
        setRevealedTiles((prev) => {
          const next = [...prev];
          next[activeTileIndex] = true;
          return next;
        });
        setScore((s) => s + 100);
        setActiveTileIndex(null);
      }, 1200);
    } else {
      sound.wrong();
      setTimeout(() => {
        setActiveTileIndex(null);
      }, 1500);
    }
  };

  const handleGuessSecret = (e) => {
    e.preventDefault();
    setGuessError('');

    const cleanInput = guessInput.trim().toUpperCase().replace(/\s+/g, ' ');
    const cleanSecret = activePack.keyword.toUpperCase().replace(/\s+/g, ' ');

    if (!cleanInput) return;

    if (cleanInput.includes(cleanSecret) || cleanSecret.includes(cleanInput)) {
      sound.cheer();
      sound.win();
      setRevealedTiles(Array(9).fill(true));
      setIsVictory(true);
      setShowGuessModal(false);
      const remainingTiles = revealedTiles.filter((x) => !x).length;
      setScore((s) => s + 500 + remainingTiles * 200);
    } else {
      sound.wrong();
      setGuessError('Từ khóa chưa chính xác. Hãy mở thêm mảnh ghép!');
    }
  };

  const handleRestart = (newPackIdx) => {
    if (typeof newPackIdx === 'number') setPackIndex(newPackIdx);
    setRevealedTiles(Array(9).fill(false));
    setActiveTileIndex(null);
    setSelectedAnswer(null);
    setRevealedAnswer(false);
    setIsVictory(false);
    setGuessInput('');
    setGuessError('');
    setScore(0);
    sound.ding();
  };

  const activeQuestion = activeTileIndex !== null ? questions[activeTileIndex] || DEFAULT_QUESTIONS_9[0] : null;

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
        <div className="cg-badge">LẬT MẢNH GHÉP · GIẢI MÃ BỨC TRANH BÍ MẬT</div>
        <h1 className="cg-title">Flip Mystery Puzzle</h1>
        <p className="cg-subtitle">
          Trả lời đúng từng câu hỏi để lật mở 9 mảnh ghép. Đoán đúng từ khóa bí mật để chiến thắng sớm!
        </p>
      </header>

      {/* Stats bar */}
      <div className="cg-stats-row">
        <div className="cg-team-pill">
          <SvgPuzzlePiece size={24} color="#8b5cf6" />
          <div className="team-info">
            <span className="team-name">Đã mở: {revealedTiles.filter(Boolean).length} / 9 mảnh</span>
            <span className="team-pts">Điểm tích lũy: {score}</span>
          </div>
        </div>

        <button
          type="button"
          className="fp-guess-btn"
          onClick={() => setShowGuessModal(true)}
          disabled={isVictory}
        >
          <SvgKey size={18} color="#ffffff" />
          ĐOÁN TỪ KHÓA BÍ MẬT
        </button>

        <div className="cg-team-pill">
          <SvgLightbulb size={24} color="#0284c7" />
          <div className="team-info">
            <span className="team-name">Độ dài từ khóa:</span>
            <span className="team-pts">{activePack.keyword.length} chữ cái</span>
          </div>
        </div>
      </div>

      {/* 3x3 Puzzle Arena */}
      <div className="fp-stage-card">
        <div className="fp-puzzle-board">
          {/* Background Secret Image */}
          <div
            className="fp-secret-image"
            style={{
              backgroundImage: `url(${activePack.imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {isVictory && (
              <div className="fp-image-overlay animate-fade-in">
                <div className="overlay-badge">BẬT MÍ BỨC TRANH BÍ MẬT</div>
                <h2 className="overlay-title">{activePack.title}</h2>
                <p className="overlay-hint">{activePack.hint}</p>
              </div>
            )}
          </div>

          {/* 3x3 Overlay Tiles */}
          <div className="fp-tiles-grid">
            {revealedTiles.map((isFlipped, idx) => {
              return (
                <div
                  key={idx}
                  className={`fp-tile ${isFlipped ? 'flipped' : ''}`}
                  onClick={() => handleTileClick(idx)}
                >
                  <div className="tile-inner">
                    <div className="tile-front">
                      <span className="tile-number">Mảnh {idx + 1}</span>
                      <SvgQuestion size={24} color="#94a3b8" />
                    </div>
                    <div className="tile-back" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal câu hỏi của mảnh ghép */}
      {activeTileIndex !== null && activeQuestion && (
        <div className="cg-modal-backdrop">
          <div className="cg-question-box animate-pop" style={{ maxWidth: 660 }}>
            <div className="cg-q-header">
              <span className="q-badge">MẢNH GHÉP SỐ {activeTileIndex + 1} (+100 ĐIỂM)</span>
              <button
                type="button"
                className="cg-action-btn"
                style={{ padding: '0.2rem 0.6rem' }}
                onClick={() => setActiveTileIndex(null)}
              >
                Đóng ✕
              </button>
            </div>

            <h2 className="cg-question-text">{activeQuestion.q}</h2>

            <div className="cg-options-grid">
              {activeQuestion.options.map((opt, idx) => {
                const isPicked = selectedAnswer === idx;
                const isCorrect = idx === activeQuestion.correct;
                let optClass = 'cg-option-btn';

                if (revealedAnswer) {
                  if (isCorrect) optClass += ' opt-correct';
                  else if (isPicked && !isCorrect) optClass += ' opt-wrong';
                  else optClass += ' opt-disabled';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    className={optClass}
                    onClick={() => handleAnswerQuestion(idx)}
                    disabled={revealedAnswer}
                  >
                    <span className="opt-letter">{String.fromCharCode(65 + idx)}</span>
                    <span className="opt-label">{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal đoán từ khóa bí mật */}
      {showGuessModal && (
        <div className="cg-modal-backdrop">
          <div className="cg-victory-modal animate-pop" style={{ maxWidth: 520, textAlign: 'left' }}>
            <h3 className="victory-title" style={{ fontSize: '1.3rem' }}>Đoán từ khóa bức tranh bí mật</h3>
            <p className="victory-desc">
              Nhập tên nhân vật, hiện tượng hoặc chất hóa học. Đoán đúng nhận thưởng lớn!
            </p>
            <form onSubmit={handleGuessSecret} style={{ width: '100%' }}>
              <input
                type="text"
                style={{
                  width: '100%',
                  borderRadius: '12px',
                  padding: '0.75rem 1rem',
                  border: '1px solid var(--line, #ccc)',
                  background: 'var(--surface-2, #f8fafc)',
                  color: 'var(--ink, #000)',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                }}
                placeholder="Nhập từ khóa..."
                value={guessInput}
                onChange={(e) => setGuessInput(e.target.value)}
                autoFocus
              />
              {guessError && (
                <div style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                  {guessError}
                </div>
              )}
              <div className="victory-actions" style={{ marginTop: '1.25rem' }}>
                <button type="submit" className="cg-btn-primary">
                  Xác nhận câu trả lời
                </button>
                <button
                  type="button"
                  className="cg-btn-secondary"
                  onClick={() => setShowGuessModal(false)}
                >
                  Đóng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Victory Celebration Modal */}
      {isVictory && (
        <div className="cg-modal-backdrop">
          <div className="cg-victory-modal animate-pop">
            <SvgTrophy size={64} color="#f59e0b" />
            <h2 className="victory-title">GIẢI MÃ THÀNH CÔNG!</h2>
            <p className="victory-desc">
              Bạn đã lật mở trọn vẹn bức tranh <strong>{activePack.title}</strong> với tổng điểm {score}!
            </p>
            <div className="victory-actions">
              <button
                type="button"
                className="cg-btn-primary"
                onClick={() => handleRestart((packIndex + 1) % SECRET_PACKS.length)}
              >
                Chủ đề tiếp theo
              </button>
              <button
                type="button"
                className="cg-btn-secondary"
                onClick={() => handleRestart(packIndex)}
              >
                Chơi lại chủ đề này
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <footer className="cg-footer-actions">
        <button
          type="button"
          className="cg-action-btn"
          onClick={() => handleRestart((packIndex + 1) % SECRET_PACKS.length)}
        >
          Đổi bức tranh ({packIndex + 1}/{SECRET_PACKS.length})
        </button>
        <button
          type="button"
          className="cg-action-btn"
          onClick={() => setShowBankPicker(true)}
        >
          Đổi ngân hàng câu hỏi
        </button>
        <button type="button" className="cg-action-btn" onClick={() => handleRestart(packIndex)}>
          Chơi lại từ đầu
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
            if (picked && picked.length >= 9) {
              setQuestions(picked);
              sound.ding();
            } else {
              alert('Cần ít nhất 9 câu hỏi cho 9 mảnh ghép!');
            }
            setShowBankPicker(false);
          }}
          onClose={() => setShowBankPicker(false)}
        />
      )}
    </div>
  );
}
