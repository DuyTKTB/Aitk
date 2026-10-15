/* ============================================================
   ExamPreviewSimulator.jsx — Bộ Xem Trước & Mô Phỏng Đề Thi (v5.1)
   ------------------------------------------------------------
   v5.1 (cleanup):
     • XÓA 3 hàm trùng lặp mulberry32, shuffleFisherYates,
       generateShuffledVersions khỏi file — nay import từ
       ../../lib/examShuffle.js để đảm bảo single source of truth.
     • Giữ nguyên: tab Mô phỏng, In A4, Phiếu OMR, Đảo mã, Đặc tả,
       chỉnh sửa, phím tắt, tải Word/PDF.
   ============================================================ */
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import MathText from '../MathText.jsx';
import { generateShuffledVersions } from '../../lib/examShuffle.js';
import sound from '../../lib/gameSound.js';
import { getSubject } from '../../lib/subjects.js';
import { normLevel, LEVEL_INFO } from '../../lib/matrixAiService.js';
import { exportToWord, exportToPDF } from '../../lib/examExport.js';
import { printOmrSheetA4, printMultipleOmrSheets } from '../../lib/omrSheetGenerator.js';
import '../../styles/exam-preview-simulator.css';

/* ============ SVG ICONS ============ */
const Svg = ({ size = 16, children }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const IcoClock = (p) => <Svg {...p}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></Svg>;
const IcoPrinter = (p) => <Svg {...p}><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></Svg>;
const IcoShuffle = (p) => <Svg {...p}><polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" /><polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /><line x1="4" y1="4" x2="9" y2="9" /></Svg>;
const IcoCheck = (p) => <Svg {...p}><polyline points="20 6 9 17 4 12" /></Svg>;
const IcoTable = (p) => <Svg {...p}><path d="M3 3h18v18H3z" /><path d="M3 9h18" /><path d="M3 15h18" /><path d="M9 3v18" /><path d="M15 3v18" /></Svg>;
const IcoSim = (p) => <Svg {...p}><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></Svg>;
const IcoX = (p) => <Svg {...p}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></Svg>;
const IcoFlag = (p) => <Svg {...p}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></Svg>;
const IcoRefresh = (p) => <Svg {...p}><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></Svg>;
const IcoChevronLeft = (p) => <Svg {...p}><polyline points="15 18 9 12 15 6" /></Svg>;
const IcoChevronRight = (p) => <Svg {...p}><polyline points="9 18 15 12 9 6" /></Svg>;
const IcoSend = (p) => <Svg {...p}><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></Svg>;
const IcoEdit = (p) => <Svg {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></Svg>;
const IcoSave = (p) => <Svg {...p}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></Svg>;
const IcoFileWord = (p) => <Svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><path d="M8 13l1.5 4 1.5-4 1.5 4 1.5-4" /></Svg>;
const IcoFilePdf = (p) => <Svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><path d="M9 15h1.5a1.5 1.5 0 0 0 0-3H9v6" /><path d="M14 18v-6h1.5a1.5 1.5 0 0 1 1.5 1.5v3A1.5 1.5 0 0 1 15.5 18H14z" /></Svg>;
const IcoClipboard = (p) => (
  <Svg {...p}>
    <path d="M9 2h6a2 2 0 0 1 2 2v2H7V4a2 2 0 0 1 2-2z" />
    <path d="M16 6h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2" />
    <path d="M8 12h8M8 16h5" />
  </Svg>
);

/* NOTE: mulberry32, shuffleFisherYates, generateShuffledVersions
   nay được import từ ../../lib/examShuffle.js (single source of truth). */

/* ============================================================
   CHẤM ĐIỂM
   ============================================================ */
function gradeSimulation(questions, answers) {
  let correctCount = 0;
  let earnedPoints = 0;
  let maxPoints = 0;
  const details = [];

  questions.forEach((q, idx) => {
    const pts = Number(q.points) || 1;
    maxPoints += pts;

    const type = q.type || 'single_choice';
    const ans = answers[idx];
    let isCorrect = false;

    if (type === 'single_choice') {
      isCorrect = ans === q.correct;
      if (isCorrect) { correctCount++; earnedPoints += pts; }
    } else if (type === 'true_false') {
      if (Array.isArray(ans) && q.statements?.length === 4) {
        const rightCount = ans.filter((v, k) => v === q.statements[k].answer).length;
        const partial = (rightCount / 4) * pts;
        earnedPoints += partial;
        if (rightCount === 4) correctCount++;
        isCorrect = rightCount === 4;
      }
    } else if (type === 'short_answer') {
      const norm = (s) =>
        String(s || '').replace(/\s+/g, '').replace(/[.]/g, ',').toLowerCase();
      const userAns = norm(ans);
      isCorrect = (q.accepted || []).some((a) => norm(a) === userAns);
      if (isCorrect) { correctCount++; earnedPoints += pts; }
    }

    details.push({ idx, type, isCorrect, points: isCorrect ? pts : 0 });
  });

  const score10 = maxPoints > 0 ? Math.round((earnedPoints / maxPoints) * 100) / 10 : 0;
  return { correctCount, totalCount: questions.length, earnedPoints, maxPoints, score10, details };
}

function fmtTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function ExamPreviewSimulator({
  exam = {},
  questions = [],
  matrix = null,
  onClose,
  defaultTab = 'sim',
  embedded = false,
}) {
  const [tab, setTab] = useState(defaultTab || 'sim');
  const examTitle = exam.title || matrix?.title || 'Đề kiểm tra';
  const duration = exam.duration || matrix?.duration || 30;
  const subject = exam.subject || matrix?.subject || 'Hóa học';
  const subjectInfo = useMemo(() => getSubject(subject), [subject]);
  const useMath = subjectInfo.math;

  // Sim state
  const [simAnswers, setSimAnswers] = useState({});
  const [simActiveQ, setSimActiveQ] = useState(0);
  const [simTimeLeft, setSimTimeLeft] = useState(duration * 60);
  const [simSubmitted, setSimSubmitted] = useState(false);
  const [simScore, setSimScore] = useState(null);
  const [flagged, setFlagged] = useState({});
  const [showSidebar, setShowSidebar] = useState(false);

  // Shuffle state
  const [activeCode, setActiveCode] = useState('101');
  const [shuffledExams, setShuffledExams] = useState(() =>
    generateShuffledVersions(questions, 4)
  );

  // Edit state
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    examTitle: exam.title || matrix?.title || 'Đề kiểm tra',
    subject: exam.subject || matrix?.subject || 'Hóa học',
    duration: exam.duration || matrix?.duration || 30,
    questions: [...questions],
  });
  const [exporting, setExporting] = useState(null);
  const paperRef = useRef(null);

  const questionsRef = useRef(questions);
  const durationRef = useRef(duration);

  useEffect(() => {
    setShuffledExams(generateShuffledVersions(questions, 4));
    questionsRef.current = questions;
  }, [questions]);

  useEffect(() => {
    durationRef.current = duration;
    setSimTimeLeft(duration * 60);
  }, [duration]);

  /* ---------- TOAST ---------- */
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  /* ---------- TIMER ---------- */
  useEffect(() => {
    if (simSubmitted || simTimeLeft <= 0) return undefined;
    const t = setInterval(() => {
      setSimTimeLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          setTimeout(() => {
            const result = gradeSimulation(questionsRef.current, simAnswers);
            setSimScore(result);
            setSimSubmitted(true);
            sound.cheer();
          }, 0);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [simSubmitted, simTimeLeft, simAnswers]);

  /* ---------- SUBMIT ---------- */
  const handleSubmitSimulation = useCallback(() => {
    const result = gradeSimulation(questionsRef.current, simAnswers);
    setSimScore(result);
    setSimSubmitted(true);
    sound.cheer();
  }, [simAnswers]);

  /* ---------- RESET ---------- */
  const handleReset = useCallback(() => {
    setSimAnswers({});
    setSimActiveQ(0);
    setSimTimeLeft(duration * 60);
    setSimSubmitted(false);
    setSimScore(null);
    setFlagged({});
    sound.ding();
  }, [duration]);

  /* ---------- FLAG ---------- */
  const toggleFlag = useCallback((idx) => {
    setFlagged((prev) => ({ ...prev, [idx]: !prev[idx] }));
    sound.ding();
  }, []);

  /* ---------- KEYBOARD ---------- */
  useEffect(() => {
    if (tab !== 'sim' || simSubmitted || editMode) return undefined;
    const handler = (e) => {
      if (e.target.matches('input, textarea')) return;
      const key = e.key;
      if (['1', '2', '3', '4'].includes(key)) {
        e.preventDefault();
        const idx = parseInt(key, 10) - 1;
        const q = questions[simActiveQ];
        if (q && (q.type === 'single_choice' || !q.type) && q.options?.[idx] !== undefined) {
          setSimAnswers((prev) => ({ ...prev, [simActiveQ]: idx }));
          sound.ding();
        }
      }
      if (key === 'ArrowLeft') {
        e.preventDefault();
        setSimActiveQ((i) => Math.max(0, i - 1));
      }
      if (key === 'ArrowRight') {
        e.preventDefault();
        setSimActiveQ((i) => Math.min(questions.length - 1, i + 1));
      }
      if (key === 'f' || key === 'F') {
        e.preventDefault();
        toggleFlag(simActiveQ);
      }
      if (key === ' ') {
        e.preventDefault();
        if (window.confirm('Nộp bài và chấm điểm?')) {
          handleSubmitSimulation();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [tab, simSubmitted, simActiveQ, questions, toggleFlag, handleSubmitSimulation, editMode]);

  /* ---------- EXPORT WORD/PDF ---------- */
  const handleExportWord = async () => {
    try {
      setExporting('word');
      await exportToWord({
        examTitle: editData.examTitle,
        subject: editData.subject,
        duration: editData.duration,
        code: activeCode,
        questions: editData.questions,
        includeAnswers: true,
      });
      sound.cheer();
      showToast('Đã tải file Word', 'success');
    } catch (err) {
      console.error(err);
      alert('Lỗi xuất Word: ' + err.message);
    } finally {
      setExporting(null);
    }
  };

  const handleExportPDF = async () => {
    try {
      setExporting('pdf');
      await exportToPDF({
        element: paperRef.current,
        examTitle: editData.examTitle,
        code: activeCode,
      });
      sound.cheer();
      showToast('Đã tải file PDF', 'success');
    } catch (err) {
      console.error(err);
      alert('Lỗi xuất PDF: ' + err.message);
    } finally {
      setExporting(null);
    }
  };

  /* ---------- OMR ---------- */
  const handlePrintOMR = () => {
    printOmrSheetA4({
      questions: editData.questions,
      title: 'PHIẾU TRẢ LỜI TRẮC NGHIỆM',
      code: activeCode,
      examTitle: editData.examTitle,
      subject: editData.subject,
      duration: editData.duration,
    });
    sound.cheer();
  };

  const handlePrintAllOMR = () => {
    const variants = shuffledExams.map((ex) => ({
      code: ex.code,
      questions: ex.questions,
    }));
    if (variants.length === 0) {
      showToast('Chưa có mã đề nào. Vào tab "Đảo mã" trước.', 'error');
      return;
    }
    const ok = window.confirm(
      `In ${variants.length} phiếu OMR cho các mã đề: ${variants.map((v) => v.code).join(', ')}?\n\n` +
      `Mỗi mã sẽ mở 1 cửa sổ riêng. Bạn cần cho phép popup.`
    );
    if (!ok) return;
    printMultipleOmrSheets(variants, {
      title: 'PHIẾU TRẢ LỜI TRẮC NGHIỆM',
      examTitle: editData.examTitle,
      subject: editData.subject,
      duration: editData.duration,
    });
    sound.cheer();
  };

  /* ---------- EDIT ---------- */
  const handleSaveEdit = () => {
    sound.cheer();
    setEditMode(false);
    showToast('Đã lưu thay đổi', 'success');
  };

  const handleCancelEdit = () => {
    setEditData({
      examTitle: exam.title || matrix?.title || 'Đề kiểm tra',
      subject: exam.subject || matrix?.subject || 'Hóa học',
      duration: exam.duration || matrix?.duration || 30,
      questions: [...questions],
    });
    setEditMode(false);
  };

  const currentQ = questions[simActiveQ];
  const answeredCount = Object.keys(simAnswers).filter((k) => {
    const v = simAnswers[k];
    if (Array.isArray(v)) return v.some((x) => x !== undefined);
    return v !== undefined && v !== '';
  }).length;

  const timeClass = simTimeLeft < 60 ? 'critical' : simTimeLeft < 300 ? 'urgent' : '';

  /* ---------- OMR stats ---------- */
  const omrStats = useMemo(() => {
    const questions = editData.questions || [];
    const single = questions.filter((q) => (q.type || 'single_choice') === 'single_choice').length;
    const tf = questions.filter((q) => q.type === 'true_false').length;
    const sa = questions.filter((q) => q.type === 'short_answer').length;
    return { single, tf, sa, total: questions.length };
  }, [editData.questions]);

  return (
    <div className={`eps-root ${embedded ? 'embedded' : 'fullscreen'}`}>
      {/* HEADER */}
      <header className="eps-header">
        <div className="eps-header-left">
          <strong className="eps-brand">ELEC AI Exam Studio</strong>
          <span className="eps-meta">
            {editData.examTitle} · {editData.subject} · {editData.questions.length} câu · {editData.duration} phút
          </span>
        </div>

        <div className="eps-tabs">
          <button
            type="button"
            className={`eps-tab ${tab === 'sim' ? 'on' : ''}`}
            onClick={() => setTab('sim')}
          >
            <IcoSim size={14} /> Mô phỏng
          </button>
          <button
            type="button"
            className={`eps-tab ${tab === 'print' ? 'on' : ''}`}
            onClick={() => setTab('print')}
          >
            <IcoPrinter size={14} /> In A4
          </button>
          <button
            type="button"
            className={`eps-tab ${tab === 'omr' ? 'on' : ''}`}
            onClick={() => setTab('omr')}
          >
            <IcoClipboard size={14} /> Phiếu OMR
          </button>
          <button
            type="button"
            className={`eps-tab ${tab === 'shuffle' ? 'on' : ''}`}
            onClick={() => setTab('shuffle')}
          >
            <IcoShuffle size={14} /> Đảo mã
          </button>
          <button
            type="button"
            className={`eps-tab ${tab === 'specs' ? 'on' : ''}`}
            onClick={() => setTab('specs')}
          >
            <IcoTable size={14} /> Đặc tả
          </button>
        </div>

        <div className="eps-header-actions">
          <button
            type="button"
            className={`eps-edit-btn ${editMode ? 'on' : ''}`}
            onClick={() => setEditMode((v) => !v)}
            title="Chỉnh sửa nội dung đề"
          >
            <IcoEdit size={14} /> {editMode ? 'Đang sửa' : 'Chỉnh sửa'}
          </button>

          {onClose && (
            <button
              type="button"
              className="eps-close"
              onClick={onClose}
              aria-label="Đóng"
            >
              <IcoX size={14} /> Đóng
            </button>
          )}
        </div>
      </header>

      <div className="eps-body">
        {/* TAB 1: MÔ PHỎNG */}
        {tab === 'sim' && (
          <div className="eps-sim-layout">
            <div className="eps-q-card">
              {currentQ ? (
                <>
                  <div className="eps-q-head">
                    <span className="eps-q-num">
                      Câu {simActiveQ + 1} / {questions.length} ({currentQ.points || 1} điểm)
                    </span>
                    <div className="eps-q-badges">
                      <span className="eps-badge level">
                        {LEVEL_INFO[normLevel(currentQ.level)]?.label?.toUpperCase() || 'THÔNG HIỂU'}
                      </span>
                      {currentQ.type === 'true_false' && (
                        <span className="eps-badge tf">ĐÚNG/SAI</span>
                      )}
                      {currentQ.type === 'short_answer' && (
                        <span className="eps-badge sa">TRẢ LỜI NGẮN</span>
                      )}
                      <button
                        type="button"
                        className={`eps-flag-btn ${flagged[simActiveQ] ? 'on' : ''}`}
                        onClick={() => toggleFlag(simActiveQ)}
                        title="Đánh dấu câu này (F)"
                      >
                        <IcoFlag size={13} />
                        {flagged[simActiveQ] ? 'Bỏ đánh dấu' : 'Đánh dấu'}
                      </button>
                    </div>
                  </div>

                  <div className="eps-q-text">
                    {useMath ? <MathText text={currentQ.q} /> : currentQ.q}
                  </div>

                  {(currentQ.type === 'single_choice' || !currentQ.type) && (
                    <div className="eps-opts">
                      {(currentQ.options || []).map((opt, oIdx) => {
                        const isChosen = simAnswers[simActiveQ] === oIdx;
                        const isCorrect = currentQ.correct === oIdx;
                        let cls = 'eps-opt';
                        if (isChosen) cls += ' chosen';
                        if (simSubmitted && isCorrect) cls += ' correct';
                        else if (simSubmitted && isChosen && !isCorrect) cls += ' wrong';
                        if (simSubmitted) cls += ' locked';
                        return (
                          <div
                            key={oIdx}
                            className={cls}
                            onClick={() => {
                              if (!simSubmitted) {
                                setSimAnswers((prev) => ({ ...prev, [simActiveQ]: oIdx }));
                                sound.ding();
                              }
                            }}
                          >
                            <strong className="eps-opt-key">
                              {String.fromCharCode(65 + oIdx)}
                            </strong>
                            <span className="eps-opt-text">
                              {useMath ? <MathText text={opt} /> : opt}
                            </span>
                            {simSubmitted && isCorrect && (
                              <span style={{ color: '#16a34a', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <IcoCheck size={14} /> Đáp án đúng
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {currentQ.type === 'true_false' && (
                    <div className="eps-opts">
                      {(currentQ.statements || []).map((st, sIdx) => {
                        const userAns = (simAnswers[simActiveQ] || [])[sIdx];
                        const correct = st.answer;
                        const letter = 'abcd'[sIdx];
                        return (
                          <div key={sIdx} className="eps-tf-row">
                            <strong className="eps-tf-letter">{letter})</strong>
                            <span className="eps-tf-text">
                              {useMath ? <MathText text={st.text} /> : st.text}
                            </span>
                            <div className="eps-tf-actions">
                              <button
                                type="button"
                                className={`eps-tf-btn ${userAns === true ? 'on-true' : ''} ${simSubmitted && correct ? 'correct' : ''} ${simSubmitted && userAns === true && !correct ? 'wrong' : ''}`}
                                onClick={() => {
                                  if (simSubmitted) return;
                                  const next = [...(simAnswers[simActiveQ] || [])];
                                  next[sIdx] = true;
                                  setSimAnswers((prev) => ({ ...prev, [simActiveQ]: next }));
                                  sound.ding();
                                }}
                              >
                                Đúng
                              </button>
                              <button
                                type="button"
                                className={`eps-tf-btn ${userAns === false ? 'on-false' : ''} ${simSubmitted && !correct ? 'correct' : ''} ${simSubmitted && userAns === false && correct ? 'wrong' : ''}`}
                                onClick={() => {
                                  if (simSubmitted) return;
                                  const next = [...(simAnswers[simActiveQ] || [])];
                                  next[sIdx] = false;
                                  setSimAnswers((prev) => ({ ...prev, [simActiveQ]: next }));
                                  sound.ding();
                                }}
                              >
                                Sai
                              </button>
                            </div>
                            {simSubmitted && (
                              <span className={`eps-tf-result ${correct ? 'correct' : 'wrong'}`}>
                                {correct ? 'Đúng' : 'Sai'}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {currentQ.type === 'short_answer' && (
                    <div>
                      <input
                        type="text"
                        className="eps-input"
                        value={simAnswers[simActiveQ] || ''}
                        onChange={(e) => {
                          if (simSubmitted) return;
                          setSimAnswers((prev) => ({ ...prev, [simActiveQ]: e.target.value }));
                        }}
                        placeholder="Nhập đáp án của bạn..."
                        disabled={simSubmitted}
                      />
                      {simSubmitted && (
                        <div className="eps-input-result">
                          Đáp án được chấp nhận: <strong>{(currentQ.accepted || []).join(' | ')}</strong>
                        </div>
                      )}
                    </div>
                  )}

                  {simSubmitted && currentQ.explain && (
                    <div className="eps-explain">
                      <strong>Lời giải chi tiết: </strong>
                      {useMath ? <MathText text={currentQ.explain} /> : currentQ.explain}
                    </div>
                  )}

                  <div className="eps-nav">
                    <button
                      type="button"
                      className="eps-nav-btn"
                      disabled={simActiveQ === 0}
                      onClick={() => setSimActiveQ((i) => Math.max(0, i - 1))}
                    >
                      <IcoChevronLeft size={14} /> Câu trước
                    </button>
                    <button
                      type="button"
                      className="eps-nav-btn primary"
                      disabled={simActiveQ === questions.length - 1}
                      onClick={() => setSimActiveQ((i) => Math.min(questions.length - 1, i + 1))}
                    >
                      Câu tiếp theo <IcoChevronRight size={14} />
                    </button>
                  </div>
                </>
              ) : null}
            </div>

            <aside className={`eps-sidebar ${showSidebar ? 'open' : ''}`}>
              <button
                type="button"
                className="eps-sidebar-toggle"
                onClick={() => setShowSidebar((v) => !v)}
              >
                <IcoTable size={14} /> Bảng câu hỏi ({answeredCount}/{questions.length})
              </button>

              <div className="eps-timer-card">
                <span className="eps-timer-label">
                  <IcoClock size={14} /> Thời gian còn lại
                </span>
                <strong className={`eps-timer-value ${timeClass}`}>
                  {fmtTime(simTimeLeft)}
                </strong>
              </div>

              <div className="eps-answer-grid">
                <div className="eps-answer-grid-head">
                  <span>Bảng câu hỏi</span>
                  <span>{answeredCount}/{questions.length}</span>
                </div>

                <div className="eps-answer-cells">
                  {questions.map((_, idx) => {
                    const ans = simAnswers[idx];
                    const isAnswered = Array.isArray(ans)
                      ? ans.some((x) => x !== undefined)
                      : ans !== undefined && ans !== '';
                    const isCurrent = simActiveQ === idx;
                    const isFlagged = flagged[idx];
                    let cls = 'eps-answer-cell';
                    if (isAnswered) cls += ' answered';
                    if (isCurrent) cls += ' current';
                    if (isFlagged) cls += ' flagged';
                    return (
                      <button
                        key={idx}
                        type="button"
                        className={cls}
                        onClick={() => {
                          setSimActiveQ(idx);
                          setShowSidebar(false);
                        }}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                <div className="eps-legend">
                  <span><i className="eps-legend-dot answered" /> Đã làm</span>
                  <span><i className="eps-legend-dot current" /> Đang xem</span>
                  <span><i className="eps-legend-dot flagged" /> Đánh dấu</span>
                </div>

                {!simSubmitted ? (
                  <button
                    type="button"
                    className="eps-submit-btn"
                    onClick={handleSubmitSimulation}
                  >
                    <IcoSend size={14} /> Nộp bài chấm thử (Space)
                  </button>
                ) : (
                  <>
                    <div className="eps-result">
                      <span className="eps-result-label">Điểm số đạt được</span>
                      <strong className="eps-result-score">
                        {simScore?.score10} / 10
                      </strong>
                      <small>
                        Đúng {simScore?.correctCount}/{simScore?.totalCount} câu
                        {simScore?.earnedPoints !== simScore?.maxPoints && (
                          <> · {Math.round(simScore?.earnedPoints * 10) / 10}/{simScore?.maxPoints} điểm</>
                        )}
                      </small>
                    </div>
                    <button
                      type="button"
                      className="eps-reset-btn"
                      onClick={handleReset}
                    >
                      <IcoRefresh size={14} /> Làm lại
                    </button>
                  </>
                )}

                {!simSubmitted && (
                  <div className="eps-kbd-hint">
                    <span><kbd>1</kbd>-<kbd>4</kbd> chọn đáp án</span>
                    <span><kbd>←</kbd> <kbd>→</kbd> chuyển câu</span>
                    <span><kbd>F</kbd> đánh dấu</span>
                    <span><kbd>Space</kbd> nộp bài</span>
                  </div>
                )}
              </div>
            </aside>

            {showSidebar && (
              <div
                className="eps-sidebar-backdrop"
                onClick={() => setShowSidebar(false)}
                aria-hidden="true"
              />
            )}
          </div>
        )}

        {/* TAB 2: IN A4 */}
        {tab === 'print' && (() => {
          const activeExamVersion = shuffledExams.find((e) => e.code === activeCode) || { questions: editData.questions };
          const printQuestions = activeExamVersion.questions || editData.questions;

          return (
            <div className="eps-print-layout">
              <div className="eps-print-toolbar no-print">
                <div className="eps-print-codes">
                  <span>Mã đề in:</span>
                  {shuffledExams.map((ex) => (
                    <button
                      key={ex.code}
                      type="button"
                      className={`eps-print-code-btn ${activeCode === ex.code ? 'on' : ''}`}
                      onClick={() => setActiveCode(ex.code)}
                    >
                      Mã {ex.code}
                    </button>
                  ))}
                </div>
                <div className="eps-export-btns">
                  <button
                    type="button"
                    className="eps-print-btn word"
                    onClick={handleExportWord}
                    disabled={exporting === 'word'}
                  >
                    <IcoFileWord size={15} /> {exporting === 'word' ? 'Đang tạo...' : 'Tải Word'}
                  </button>
                  <button
                    type="button"
                    className="eps-print-btn pdf"
                    onClick={handleExportPDF}
                    disabled={exporting === 'pdf'}
                  >
                    <IcoFilePdf size={15} /> {exporting === 'pdf' ? 'Đang tạo...' : 'Tải PDF'}
                  </button>
                  <button
                    type="button"
                    className="eps-print-btn"
                    onClick={() => window.print()}
                  >
                    <IcoPrinter size={15} /> In (Ctrl + P)
                  </button>
                </div>
              </div>

              <div className="a4-printable-paper" ref={paperRef}>
                <div className="a4-head">
                  <div>
                    <p className="a4-school">SỞ GD&ĐT TỈNH / TRƯỜNG THPT</p>
                    <p className="a4-title">{editData.examTitle.toUpperCase()}</p>
                    <p className="a4-subject">Môn: {editData.subject}</p>
                  </div>
                  <div className="a4-head-right">
                    <p className="a4-kick">KỲ THI ĐÁNH GIÁ NĂNG LỰC HỌC TẬP</p>
                    <p className="a4-year">NĂM HỌC 2025 - 2026</p>
                    <p className="a4-duration">Thời gian làm bài: {editData.duration} phút</p>
                    <div className="a4-code-box">MÃ ĐỀ: {activeCode}</div>
                  </div>
                </div>

                <p className="a4-student-line">
                  Họ và tên thí sinh: .................................................................... Số báo danh: ........................
                </p>

                <div className="a4-questions">
                  {printQuestions.map((q, idx) => {
                    const type = q.type || 'single_choice';
                    return (
                      <div key={idx} className="a4-q">
                        <p className="a4-q-title">
                          <strong>Câu {idx + 1}:</strong>{' '}
                          <span>{useMath ? <MathText text={q.q} /> : q.q}</span>
                        </p>

                        {type === 'single_choice' && (
                          <div className="a4-opts">
                            {(q.options || []).map((opt, oIdx) => (
                              <div key={oIdx} className="a4-opt">
                                <strong>{String.fromCharCode(65 + oIdx)}. </strong>
                                {useMath ? <MathText text={opt} /> : opt}
                              </div>
                            ))}
                          </div>
                        )}

                        {type === 'true_false' && (
                          <div className="a4-tf">
                            {(q.statements || []).map((st, sIdx) => (
                              <div key={sIdx} className="a4-tf-row">
                                <span>
                                  <strong>{'abcd'[sIdx]}) </strong>
                                  {useMath ? <MathText text={st.text} /> : st.text}
                                </span>
                                <span className="a4-tf-ds">Đ/S: ____</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {type === 'short_answer' && (
                          <div className="a4-sa">
                            <span>Trả lời: ...................................................</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="a4-answers">
                  <h4 className="a4-answers-title">BẢNG ĐÁP ÁN THAM KHẢO (MÃ ĐỀ {activeCode})</h4>

                  {printQuestions.some((q) => (q.type || 'single_choice') === 'single_choice') && (
                    <div className="a4-answers-block">
                      <p className="a4-answers-sub">Phần trắc nghiệm:</p>
                      <div className="a4-answers-grid">
                        {printQuestions.map((q, idx) => {
                          if ((q.type || 'single_choice') !== 'single_choice') return null;
                          return (
                            <div key={idx} className="a4-answers-cell">
                              <div className="a4-answers-num">{idx + 1}</div>
                              <div className="a4-answers-letter">
                                {String.fromCharCode(65 + (q.correct || 0))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {printQuestions.some((q) => q.type === 'true_false') && (
                    <div className="a4-answers-block">
                      <p className="a4-answers-sub">Phần đúng/sai:</p>
                      <table className="a4-tf-table">
                        <thead>
                          <tr>
                            <th>Câu</th>
                            <th>a</th>
                            <th>b</th>
                            <th>c</th>
                            <th>d</th>
                          </tr>
                        </thead>
                        <tbody>
                          {printQuestions.map((q, idx) => {
                            if (q.type !== 'true_false') return null;
                            return (
                              <tr key={idx}>
                                <td className="a4-tf-num">{idx + 1}</td>
                                {(q.statements || []).map((st, sIdx) => (
                                  <td key={sIdx} className="a4-tf-ans">
                                    {st.answer ? 'Đ' : 'S'}
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {printQuestions.some((q) => q.type === 'short_answer') && (
                    <div className="a4-answers-block">
                      <p className="a4-answers-sub">Phần trả lời ngắn:</p>
                      <ul className="a4-sa-list">
                        {printQuestions.map((q, idx) => {
                          if (q.type !== 'short_answer') return null;
                          return (
                            <li key={idx}>
                              <strong>Câu {idx + 1}:</strong> {(q.accepted || []).join(' hoặc ')}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* TAB 3: PHIẾU OMR */}
        {tab === 'omr' && (
          <div className="eps-omr-layout">
            <div className="eps-omr-head">
              <h3 className="eps-omr-title">Phiếu Trả Lời Trắc Nghiệm (OMR)</h3>
              <p className="eps-omr-sub">
                In phiếu A4 cho HS tô bút chì. Hệ thống tự align qua 4 fiducial marks khi chấm bằng
                module PaperGrading.
              </p>
            </div>

            <div className="eps-omr-info-grid">
              <div className="eps-omr-info-card">
                <div className="eps-omr-info-icon"><IcoCheck size={20} /></div>
                <div>
                  <b>{omrStats.total} câu</b>
                  <small>
                    {omrStats.single} TN · {omrStats.tf} Đ/S · {omrStats.sa} TLN
                  </small>
                </div>
              </div>
              <div className="eps-omr-info-card">
                <div className="eps-omr-info-icon"><IcoClipboard size={20} /></div>
                <div>
                  <b>4 fiducial marks</b>
                  <small>4 góc phiếu để máy scan align chính xác</small>
                </div>
              </div>
              <div className="eps-omr-info-card">
                <div className="eps-omr-info-icon"><IcoPrinter size={20} /></div>
                <div>
                  <b>Chuẩn A4</b>
                  <small>In 1 mặt · SBD 6 chữ số · Mã đề 3 chữ số</small>
                </div>
              </div>
            </div>

            <div className="eps-omr-actions">
              <button
                type="button"
                className="eps-omr-btn primary"
                onClick={handlePrintOMR}
              >
                <IcoPrinter size={16} /> In phiếu OMR (Mã {activeCode})
              </button>

              <button
                type="button"
                className="eps-omr-btn ghost"
                onClick={handlePrintAllOMR}
              >
                <IcoPrinter size={16} /> In tất cả {shuffledExams.length} mã
              </button>
            </div>

            <div className="eps-omr-note">
              <b>💡 Hướng dẫn:</b>
              <ol>
                <li>In phiếu OMR ra giấy A4 (khuyến nghị <b>1 mặt</b>, giấy trắng mịn).</li>
                <li>Phát cho HS kèm đề thi (HS làm bài trên đề, tô đáp án vào phiếu).</li>
                <li>Thu phiếu → vào <b>Chấm phiếu A4</b> → upload ảnh/chụp ảnh.</li>
                <li>Hệ thống tự align qua fiducial marks và chấm điểm.</li>
              </ol>
            </div>
          </div>
        )}

        {/* TAB 4: ĐẢO MÃ ĐỀ */}
        {tab === 'shuffle' && (
          <div className="eps-shuffle-layout">
            <div className="eps-shuffle-head">
              <div>
                <h3 className="eps-shuffle-title">Bộ 4 Mã Đề Thi Hoán Vị (101 - 104)</h3>
                <p className="eps-shuffle-sub">
                  Xáo thứ tự câu <strong>trong cùng nhóm độ khó</strong> — đảm bảo công bằng giữa các mã.
                </p>
              </div>
              <div className="eps-shuffle-tabs">
                {shuffledExams.map((ex) => (
                  <button
                    key={ex.code}
                    type="button"
                    className={`eps-shuffle-tab ${activeCode === ex.code ? 'on' : ''}`}
                    onClick={() => setActiveCode(ex.code)}
                  >
                    Mã {ex.code}
                  </button>
                ))}
              </div>
            </div>

            <div className="eps-shuffle-card">
              <h4 className="eps-shuffle-card-title">Bảng Ma Trận Đối Chiếu Đáp Án</h4>
              <div className="eps-shuffle-table-wrap">
                <table className="eps-shuffle-table">
                  <thead>
                    <tr>
                      <th>Câu Gốc</th>
                      <th style={{ color: '#0284c7' }}>Mã 101</th>
                      <th style={{ color: '#16a34a' }}>Mã 102</th>
                      <th style={{ color: '#f59e0b' }}>Mã 103</th>
                      <th style={{ color: '#dc2626' }}>Mã 104</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map((_, idx) => (
                      <tr key={idx}>
                        <td className="eps-shuffle-orig">Câu {idx + 1}</td>
                        {shuffledExams.map((ex) => {
                          const mapping = ex.origToNew?.[idx + 1];
                          if (!mapping) return <td key={ex.code}>—</td>;
                          const color =
                            ex.code === '101'
                              ? '#0284c7'
                              : ex.code === '102'
                              ? '#16a34a'
                              : ex.code === '103'
                              ? '#d97706'
                              : '#dc2626';
                          return (
                            <td key={ex.code}>
                              {mapping.type === 'single_choice' ? (
                                <>
                                  <strong style={{ fontSize: '0.96rem', color }}>
                                    {mapping.newLetter}
                                  </strong>
                                  <span className="eps-shuffle-mapping">
                                    (Câu {mapping.newNum})
                                  </span>
                                </>
                              ) : (
                                <span className="eps-shuffle-mapping">
                                  {mapping.type === 'true_false' ? 'Đ/S' : 'TLN'} · Câu {mapping.newNum}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="eps-shuffle-note">
                * Câu trong cùng nhóm NB/TH/VD/VDC chỉ hoán vị trong nhóm — giữ nguyên độ khó giữa các mã.
              </p>
            </div>
          </div>
        )}

        {/* TAB 5: ĐẶC TẢ */}
        {tab === 'specs' && (
          <div className="eps-specs-layout">
            <h3 className="eps-specs-title">Bảng Đặc Tả Đề Thi & Yêu Cầu Cần Đạt (Chuẩn GDPT 2018)</h3>
            <p className="eps-specs-sub">
              Môn {editData.subject} · Lớp {matrix?.grade || '—'} · {editData.questions.length} câu · {editData.duration} phút
            </p>

            <div className="eps-specs-table-wrap">
              <table className="eps-specs-table">
                <thead>
                  <tr>
                    <th style={{ width: 60 }}>Câu</th>
                    <th style={{ width: 110 }}>Loại</th>
                    <th>Chuyên Đề</th>
                    <th style={{ width: 130 }}>Mức Độ</th>
                    <th>Yêu Cầu Cần Đạt</th>
                    <th style={{ width: 80 }}>Điểm</th>
                  </tr>
                </thead>
                <tbody>
                  {editData.questions.map((q, idx) => {
                    const lvMeta = LEVEL_INFO[normLevel(q.level)] || LEVEL_INFO.nb;
                    const type = q.type || 'single_choice';
                    return (
                      <tr key={idx}>
                        <td className="eps-specs-num">{idx + 1}</td>
                        <td>
                          <span className={`eps-specs-type ${type}`}>
                            {type === 'single_choice'
                              ? 'Trắc nghiệm'
                              : type === 'true_false'
                              ? 'Đúng/Sai'
                              : 'Trả lời ngắn'}
                          </span>
                        </td>
                        <td className="eps-specs-topic">{q.topic || 'Kiến thức trọng tâm'}</td>
                        <td>
                          <span
                            className="eps-specs-level"
                            style={{ background: lvMeta.bg, color: lvMeta.color }}
                          >
                            {lvMeta.label}
                          </span>
                        </td>
                        <td className="eps-specs-desc">
                          Học sinh vận dụng kiến thức chuyên đề "{q.topic || 'trọng tâm'}" để giải quyết yêu cầu.
                        </td>
                        <td className="eps-specs-points">{q.points || 1}đ</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* EDIT PANEL */}
      {editMode && (
        <>
          <div
            className="eps-edit-backdrop"
            onClick={handleCancelEdit}
            aria-hidden="true"
          />
          <aside className="eps-edit-panel">
            <header className="eps-edit-panel-head">
              <h3>Chỉnh sửa nội dung đề</h3>
              <button
                type="button"
                className="eps-edit-panel-close"
                onClick={handleCancelEdit}
                aria-label="Đóng"
              >
                <IcoX size={16} />
              </button>
            </header>

            <div className="eps-edit-panel-body">
              <div className="eps-edit-section">
                <h4 className="eps-edit-section-title">Thông tin chung</h4>

                <label className="eps-edit-field">
                  <span>Tiêu đề đề thi</span>
                  <input
                    type="text"
                    value={editData.examTitle}
                    onChange={(e) => setEditData({ ...editData, examTitle: e.target.value })}
                  />
                </label>

                <div className="eps-edit-row">
                  <label className="eps-edit-field">
                    <span>Môn học</span>
                    <input
                      type="text"
                      value={editData.subject}
                      onChange={(e) => setEditData({ ...editData, subject: e.target.value })}
                    />
                  </label>
                  <label className="eps-edit-field">
                    <span>Thời gian (phút)</span>
                    <input
                      type="number"
                      value={editData.duration}
                      onChange={(e) =>
                        setEditData({ ...editData, duration: Number(e.target.value) || 30 })
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="eps-edit-section">
                <h4 className="eps-edit-section-title">
                  Câu hỏi ({editData.questions.length})
                </h4>

                {editData.questions.map((q, idx) => (
                  <div key={idx} className="eps-edit-q">
                    <div className="eps-edit-q-head">
                      <strong>Câu {idx + 1}</strong>
                      <span className="eps-edit-q-points">({q.points || 1}đ)</span>
                    </div>

                    <label className="eps-edit-field">
                      <span>Nội dung câu hỏi</span>
                      <textarea
                        rows={3}
                        value={q.q || ''}
                        onChange={(e) => {
                          const next = [...editData.questions];
                          next[idx] = { ...next[idx], q: e.target.value };
                          setEditData({ ...editData, questions: next });
                        }}
                      />
                    </label>

                    {(q.type || 'single_choice') === 'single_choice' &&
                      Array.isArray(q.options) && (
                        <div className="eps-edit-opts">
                          {q.options.map((opt, oIdx) => (
                            <div key={oIdx} className="eps-edit-opt">
                              <label className="eps-edit-opt-radio">
                                <input
                                  type="radio"
                                  name={`correct-${idx}`}
                                  checked={q.correct === oIdx}
                                  onChange={() => {
                                    const next = [...editData.questions];
                                    next[idx] = { ...next[idx], correct: oIdx };
                                    setEditData({ ...editData, questions: next });
                                  }}
                                />
                                <strong>{String.fromCharCode(65 + oIdx)}</strong>
                              </label>
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  const next = [...editData.questions];
                                  const opts = [...next[idx].options];
                                  opts[oIdx] = e.target.value;
                                  next[idx] = { ...next[idx], options: opts };
                                  setEditData({ ...editData, questions: next });
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      )}

                    <label className="eps-edit-field">
                      <span>Lời giải</span>
                      <textarea
                        rows={2}
                        value={q.explain || ''}
                        onChange={(e) => {
                          const next = [...editData.questions];
                          next[idx] = { ...next[idx], explain: e.target.value };
                          setEditData({ ...editData, questions: next });
                        }}
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <footer className="eps-edit-panel-foot">
              <button
                type="button"
                className="eps-nav-btn"
                onClick={handleCancelEdit}
              >
                Hủy
              </button>
              <button
                type="button"
                className="eps-nav-btn primary"
                onClick={handleSaveEdit}
              >
                <IcoSave size={14} /> Lưu thay đổi
              </button>
            </footer>
          </aside>
        </>
      )}

      {/* LOCAL TOAST */}
      {toast && (
        <div className={`eps-toast ${toast.type}`}>
          {toast.type === 'success' && <IcoCheck size={14} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}