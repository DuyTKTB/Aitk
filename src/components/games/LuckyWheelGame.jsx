import { useState, useEffect, useRef } from 'react';
import GameBar from './GameBar.jsx';
import QuestionBankPicker from './QuestionBankPicker.jsx';
import sound from '../../lib/gameSound.js';
import {
  SvgGift,
  SvgQuestion,
  SvgSkull,
  SvgDouble,
  SvgWheelPin,
  SvgLightbulb,
} from './ClassroomGameIcons.jsx';
import '../../styles/classroom-games.css';

/* Default wheel segments without emojis */
const DEFAULT_SEGMENTS = [
  { id: '1', text: '+100 Điểm', color: '#0284c7', type: 'points', val: 100 },
  { id: '2', text: 'Thử thách', color: '#8b5cf6', type: 'question', val: 0 },
  { id: '3', text: '+200 Điểm', color: '#10b981', type: 'points', val: 200 },
  { id: '4', text: 'Hộp quà', color: '#f59e0b', type: 'gift', val: 300 },
  { id: '5', text: 'Mất lượt', color: '#ef4444', type: 'lose', val: 0 },
  { id: '6', text: 'Nhân đôi ×2', color: '#ec4899', type: 'double', val: 0 },
  { id: '7', text: '+500 Điểm', color: '#eab308', type: 'points', val: 500 },
  { id: '8', text: 'Câu hỏi VIP', color: '#6366f1', type: 'question', val: 0 },
];

/* Default Student List */
const DEFAULT_STUDENTS = [
  'Nguyễn Văn An',
  'Trần Thị Bình',
  'Lê Hoàng Cường',
  'Phạm Minh Dũng',
  'Đỗ Thảo Hương',
  'Vũ Quốc Khánh',
  'Bùi Ngọc Lan',
  'Hoàng Tuấn Nam',
];

const DEFAULT_QUESTIONS = [
  {
    q: 'Kim loại nào sau đây phản ứng mãnh liệt với nước ở nhiệt độ thường?',
    options: ['Natri (Na)', 'Đồng (Cu)', 'Bạc (Ag)', 'Sắt (Fe)'],
    correct: 0,
    explain: 'Natri tác dụng với nước sinh ra NaOH và khí H₂, phản ứng tỏa nhiều nhiệt.',
  },
  {
    q: 'Dung dịch nào có pH < 7 ở 25°C?',
    options: ['Nước vôi trong Ca(OH)₂', 'Dung dịch giấm ăn (CH₃COOH)', 'Nước muối NaCl', 'Dung dịch xút NaOH'],
    correct: 1,
    explain: 'Giấm ăn là dung dịch axit axetic có tính axit nên pH < 7.',
  },
  {
    q: 'Khí gas đun nấu gia đình chủ yếu là hỗn hợp của chất nào?',
    options: ['Metan & Etan', 'Propan & Butan', 'Etylen & Axetylen', 'Hidro & Cacbonic'],
    correct: 1,
    explain: 'LPG (khí dầu mỏ hóa lỏng) là hỗn hợp propan (C₃H₈) và butan (C₄H₁₀).',
  },
  {
    q: 'Muối ăn hàng ngày có công thức hóa học là gì?',
    options: ['NaHCO₃', 'Na₂CO₃', 'NaCl', 'CaCl₂'],
    correct: 2,
    explain: 'Muối ăn là Natri clorua (NaCl).',
  },
];

export default function LuckyWheelGame() {
  const [mode, setMode] = useState('challenge');
  const [segments] = useState(DEFAULT_SEGMENTS);
  const [students, setStudents] = useState(() => {
    try {
      const saved = localStorage.getItem('cs-game:wheel:students');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_STUDENTS;
  });
  const [questions, setQuestions] = useState(() => {
    try {
      const saved = localStorage.getItem('cs-game:wheel:questions');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_QUESTIONS;
  });

  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [resultItem, setResultItem] = useState(null);
  const [totalScore, setTotalScore] = useState(0);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [revealedAnswer, setRevealedAnswer] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [studentText, setStudentText] = useState(students.join('\n'));
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [paused, setPaused] = useState(false);

  const canvasRef = useRef(null);

  const activeItems = mode === 'challenge'
    ? segments
    : students.map((name, i) => ({
        id: `s-${i}`,
        text: name,
        color: `hsl(${(i * 360) / Math.max(students.length, 1)}, 70%, 50%)`,
        type: 'student',
        val: 0,
      }));

  useEffect(() => {
    try {
      localStorage.setItem('cs-game:wheel:students', JSON.stringify(students));
    } catch {}
  }, [students]);

  useEffect(() => {
    try {
      localStorage.setItem('cs-game:wheel:questions', JSON.stringify(questions));
    } catch {}
  }, [questions]);

  /* Vẽ Vòng quay trên Canvas */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const radius = width / 2 - 12;
    const cx = width / 2;
    const cy = height / 2;
    const count = activeItems.length;
    if (count === 0) return;

    ctx.clearRect(0, 0, width, height);
    const arc = (2 * Math.PI) / count;

    activeItems.forEach((item, i) => {
      const angle = i * arc;

      // Nan quạt
      ctx.beginPath();
      ctx.fillStyle = item.color;
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, angle, angle + arc);
      ctx.lineTo(cx, cy);
      ctx.fill();

      // Viền chia nan
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.stroke();

      // Chữ nhãn
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.font = count > 12 ? 'bold 12px sans-serif' : 'bold 14px sans-serif';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 4;
      ctx.translate(cx, cy);
      ctx.rotate(angle + arc / 2);
      ctx.textAlign = 'right';
      ctx.fillText(item.text, radius - 26, 5);
      ctx.restore();
    });

    // Vành kim loại ngoài cùng
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
    ctx.lineWidth = 8;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.stroke();

    // Nút tròn trung tâm
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, 2 * Math.PI);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#38bdf8';
    ctx.stroke();

    // Tâm sáng
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, 2 * Math.PI);
    ctx.fillStyle = '#38bdf8';
    ctx.fill();
  }, [activeItems]);

  const handleSpin = () => {
    if (spinning || activeItems.length === 0 || paused) return;

    setSpinning(true);
    setResultItem(null);
    setShowQuestionModal(false);

    sound.wheel();

    const count = activeItems.length;
    const targetIndex = Math.floor(Math.random() * count);
    const arcDegrees = 360 / count;

    const targetSliceCenter = targetIndex * arcDegrees + arcDegrees / 2;
    const extraRounds = 5 + Math.floor(Math.random() * 3);
    const spinDegrees = extraRounds * 360 + (360 - targetSliceCenter) + 270;

    const newRotation = rotation + spinDegrees;
    setRotation(newRotation);

    setTimeout(() => {
      setSpinning(false);
      const landed = activeItems[targetIndex];
      setResultItem(landed);

      if (landed.type === 'points') {
        sound.ding();
        setTotalScore((s) => s + landed.val);
      } else if (landed.type === 'gift') {
        sound.cheer();
        setTotalScore((s) => s + landed.val);
      } else if (landed.type === 'double') {
        sound.turbo();
        setTotalScore((s) => Math.max(100, s * 2));
      } else if (landed.type === 'lose') {
        sound.wrong();
      } else if (landed.type === 'question') {
        sound.ding();
        const randQ = questions[Math.floor(Math.random() * questions.length)] || DEFAULT_QUESTIONS[0];
        setActiveQuestion(randQ);
        setSelectedAnswer(null);
        setRevealedAnswer(false);
        setShowQuestionModal(true);
      } else if (landed.type === 'student') {
        sound.cheer();
      }
    }, 4500);
  };

  const handleAnswerQuestion = (idx) => {
    if (revealedAnswer || !activeQuestion) return;
    setSelectedAnswer(idx);
    setRevealedAnswer(true);

    if (idx === activeQuestion.correct) {
      sound.correct();
      setTotalScore((s) => s + 200);
    } else {
      sound.wrong();
    }
  };

  const handleSaveStudents = () => {
    const list = studentText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    if (list.length >= 2) {
      setStudents(list);
      setShowConfig(false);
      sound.ding();
    } else {
      alert('Vui lòng nhập ít nhất 2 học sinh!');
    }
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
        <div className="cg-badge">VÒNG QUAY MAY MẮN · VISION PRO STUDIO</div>
        <h1 className="cg-title">Lucky Wheel Studio</h1>
        <p className="cg-subtitle">
          Quay số gọi tên học sinh ngẫu nhiên hoặc bốc điểm thưởng, quà may mắn & câu hỏi thử thách!
        </p>
      </header>

      {/* Mode Switcher Tabs */}
      <div className="cg-tab-row">
        <button
          type="button"
          className={`cg-tab-btn ${mode === 'challenge' ? 'active' : ''}`}
          onClick={() => {
            if (!spinning) {
              setMode('challenge');
              setResultItem(null);
            }
          }}
        >
          <SvgGift size={18} color={mode === 'challenge' ? '#ffffff' : '#f59e0b'} />
          Thử thách & Quà tặng
        </button>
        <button
          type="button"
          className={`cg-tab-btn ${mode === 'students' ? 'active' : ''}`}
          onClick={() => {
            if (!spinning) {
              setMode('students');
              setResultItem(null);
            }
          }}
        >
          Gọi tên học sinh ({students.length})
        </button>
      </div>

      {/* Wheel Stage */}
      <div className="lw-stage-card">
        {mode === 'challenge' && (
          <div className="lw-score-badge">
            <span className="badge-lbl">ĐIỂM TỔNG CỘNG</span>
            <span className="badge-val">{totalScore}</span>
          </div>
        )}

        <div className="lw-wheel-wrapper">
          {/* Top Indicator Arrow */}
          <div className="lw-pointer-arrow">
            <SvgWheelPin size={32} color="#ef4444" />
          </div>

          {/* Rotating Canvas */}
          <div
            className="lw-canvas-rotator"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? 'transform 4.5s cubic-bezier(0.15, 0.9, 0.25, 1)' : 'none',
            }}
          >
            <canvas ref={canvasRef} width={440} height={440} className="lw-wheel-canvas" />
          </div>
        </div>

        {/* Spin Action Button */}
        <div className="lw-spin-center-action">
          <button
            type="button"
            className={`lw-spin-btn ${spinning ? 'is-spinning' : ''}`}
            onClick={handleSpin}
            disabled={spinning || paused}
          >
            {spinning ? 'ĐANG QUAY…' : 'QUAY NGAY'}
          </button>
        </div>

        {/* Result Announcement Pill */}
        {resultItem && !spinning && (
          <div className="lw-result-card animate-pop">
            <div className="res-icon">
              {resultItem.type === 'gift' && <SvgGift size={24} color="#f59e0b" />}
              {resultItem.type === 'lose' && <SvgSkull size={24} color="#ef4444" />}
              {resultItem.type === 'double' && <SvgDouble size={24} color="#ec4899" />}
              {resultItem.type === 'question' && <SvgQuestion size={24} color="#8b5cf6" />}
              {resultItem.type === 'points' && <SvgGift size={24} color="#0284c7" />}
              {resultItem.type === 'student' && <SvgGift size={24} color="#10b981" />}
            </div>
            <div className="res-text">
              <span className="res-title">Kết quả vòng quay:</span>
              <strong className="res-bold">{resultItem.text}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Question Challenge Modal */}
      {showQuestionModal && activeQuestion && (
        <div className="cg-modal-backdrop">
          <div className="cg-question-box animate-pop" style={{ maxWidth: 650 }}>
            <div className="cg-q-header">
              <span className="q-badge">CÂU HỎI THỬ THÁCH VÒNG QUAY (+200 ĐIỂM)</span>
              <button
                type="button"
                className="cg-action-btn"
                style={{ padding: '0.2rem 0.6rem' }}
                onClick={() => setShowQuestionModal(false)}
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

            {revealedAnswer && (
              <div className="cg-explain-box animate-fade-in">
                <SvgLightbulb size={20} color="#f59e0b" />
                <p className="explain-text">{activeQuestion.explain || 'Chính xác!'}</p>
                <button
                  type="button"
                  className="cg-btn-primary"
                  style={{ marginTop: '0.5rem', width: '100%' }}
                  onClick={() => setShowQuestionModal(false)}
                >
                  Đóng & Tiếp tục quay
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Student List Config Modal */}
      {showConfig && (
        <div className="cg-modal-backdrop">
          <div className="cg-victory-modal animate-pop" style={{ maxWidth: 520, textAlign: 'left' }}>
            <h3 className="victory-title" style={{ fontSize: '1.25rem' }}>Danh sách học sinh quay tên</h3>
            <p className="victory-desc">Mỗi học sinh một dòng. Nhập hoặc dán từ Excel:</p>
            <textarea
              style={{
                width: '100%',
                borderRadius: '12px',
                padding: '0.75rem',
                border: '1px solid var(--line, #ccc)',
                background: 'var(--surface-2, #f8fafc)',
                color: 'var(--ink, #000)',
                fontFamily: 'inherit',
                fontSize: '0.9rem',
                boxSizing: 'border-box',
              }}
              rows={8}
              value={studentText}
              onChange={(e) => setStudentText(e.target.value)}
              placeholder="Nguyễn Văn A&#10;Trần Thị B&#10;Lê Văn C"
            />
            <div className="victory-actions">
              <button type="button" className="cg-btn-primary" onClick={handleSaveStudents}>
                Lưu danh sách ({studentText.split('\n').filter(Boolean).length} bạn)
              </button>
              <button
                type="button"
                className="cg-btn-secondary"
                onClick={() => setShowConfig(false)}
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Controls */}
      <footer className="cg-footer-actions">
        {mode === 'students' && (
          <button
            type="button"
            className="cg-action-btn"
            onClick={() => {
              setStudentText(students.join('\n'));
              setShowConfig(true);
            }}
          >
            Sửa danh sách học sinh
          </button>
        )}
        <button
          type="button"
          className="cg-action-btn"
          onClick={() => setShowBankPicker(true)}
        >
          Ngân hàng câu hỏi ({questions.length})
        </button>
        <button
          type="button"
          className="cg-action-btn"
          onClick={() => {
            setTotalScore(0);
            setResultItem(null);
            sound.ding();
          }}
        >
          Đặt lại điểm số
        </button>
        <a href="#games" className="cg-action-btn btn-ghost">
          ← Danh sách Games
        </a>
      </footer>

      {showBankPicker && (
        <QuestionBankPicker
          mode="list"
          maxCount={30}
          onApply={(picked) => {
            if (picked && picked.length > 0) {
              setQuestions(picked);
              sound.ding();
            }
            setShowBankPicker(false);
          }}
          onClose={() => setShowBankPicker(false)}
        />
      )}
    </div>
  );
}
