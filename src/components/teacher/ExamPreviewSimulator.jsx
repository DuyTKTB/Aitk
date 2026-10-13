/* ============================================================
   ExamPreviewSimulator.jsx — Bộ Xem Trước & Mô Phỏng Đề Thi Đa Môn
   ------------------------------------------------------------
   HỖ TRỢ ĐA MÔN: Toán, Lý, Hóa, Sinh, Văn, Anh, Sử, Địa, GDCD,
                  Tin, Công nghệ, KHTN + môn tự đặt tên.
   ------------------------------------------------------------
   4 chế độ: Mô phỏng thi | Bản in A4 | Đảo 4 mã đề | Bảng đặc tả
   ------------------------------------------------------------
   v2 (đa môn + fix):
     • FIX #3: Đảo mã đề GIỮ NGUYÊN NHÓM ĐỘ KHÓ, chỉ xáo trong
       từng nhóm NB/TH/VD/VDC → không làm lệch độ khó giữa các mã.
     • MỚI: Hiển thị đúng 3 loại câu:
       - single_choice: A/B/C/D
       - true_false: 4 ý a/b/c/d Đ/S
       - short_answer: ô nhập đáp án
     • MỚI: In A4 hỗ trợ đa môn — MathText chỉ bật cho môn
       getSubject(subject).math = true.
     • MỚI: Chấm điểm đúng theo từng loại câu.
     • MỚI: Bảng đặc tả hiển thị cột "Loại câu".
     • MỚI: In A4 có header/footer chuẩn Bộ GD&ĐT (đa môn).
   ============================================================ */
import { useState, useEffect, useMemo } from 'react';
import MathText from '../MathText.jsx';
import sound from '../../lib/gameSound.js';
import { getSubject } from '../../lib/subjects.js';
import { normLevel, LEVEL_INFO } from '../../lib/matrixAiService.js';
import { QUESTION_TYPES } from '../../lib/examAiUtils.js';

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
const IcoSpark = (p) => <Svg {...p}><path d="M12 2l2.4 5.6L20 10l-5.6 2.4L12 18l-2.4-5.6L4 10l5.6-2.4z" /></Svg>;
const IcoPlay = (p) => <Svg {...p}><polygon points="5 3 19 12 5 21 5 3" /></Svg>;

/* ============ PRNG ============ */
/* Mulberry32 — xáo có hạt giống, tái tạo được */
function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Fisher-Yates shuffle */
function shuffleFisherYates(array, prng) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ============================================================
   FIX #3: ĐẢO MÃ ĐỀ GIỮ NGUYÊN NHÓM ĐỘ KHÓ
   ------------------------------------------------------------
   Trước: xáo thứ tự câu lung tung → mã 101 và 102 có độ khó
           khác nhau ở đầu bài → không công bằng.
   Sau:   chia câu theo 4 nhóm (NB/TH/VD/VDC), xáo TRONG từng
           nhóm, rồi ghép theo thứ tự NB → TH → VD → VDC.
   ============================================================ */
function generateShuffledVersions(questions = [], count = 4) {
  const codeList = ['101', '102', '103', '104'].slice(0, count);

  // Chia câu theo nhóm độ khó (giữ thứ tự gốc trong mỗi nhóm)
  const groups = { nb: [], th: [], vd: [], vdc: [] };
  questions.forEach((q, idx) => {
    const lv = normLevel(q.level);
    groups[lv].push({ q, origIdx: idx });
  });

  return codeList.map((code, codeIdx) => {
    const seed = parseInt(code, 10) * 10007 + 37;
    const prng = mulberry32(seed);

    // 1. Xáo thứ tự CÂU trong từng nhóm độ khó
    const shuffledByLevel = {};
    ['nb', 'th', 'vd', 'vdc'].forEach((lv) => {
      const group = groups[lv];
      shuffledByLevel[lv] = codeIdx === 0
        ? group
        : shuffleFisherYates(group, prng);
    });

    // 2. Ghép lại: NB → TH → VD → VDC
    const orderedWithOrig = [
      ...shuffledByLevel.nb,
      ...shuffledByLevel.th,
      ...shuffledByLevel.vd,
      ...shuffledByLevel.vdc,
    ];

    // 3. Xáo phương án A/B/C/D cho từng câu single_choice
    const finalQuestions = orderedWithOrig.map(({ q, origIdx }) => {
      // true_false/short_answer: giữ nguyên
      if (q.type === 'true_false' || q.type === 'short_answer') {
        return { ...q, originalIndex: origIdx + 1, _origQuestion: q };
      }

      const origOpts = [...(q.options || [])];
      const origCorrectIdx = q.correct ?? 0;
      const correctText = origOpts[origCorrectIdx];

      const qPrng = mulberry32(seed + (origIdx + 1) * 313);
      const optIndices = origOpts.map((_, i) => i);
      const shuffledOptIndices = codeIdx === 0
        ? optIndices
        : shuffleFisherYates(optIndices, qPrng);

      const newOpts = shuffledOptIndices.map((i) => origOpts[i]);
      const newCorrect = newOpts.indexOf(correctText);

      return {
        ...q,
        options: newOpts,
        correct: newCorrect >= 0 ? newCorrect : 0,
        origCorrect: origCorrectIdx,
        originalIndex: origIdx + 1,
        _origQuestion: q,
      };
    });

    // 4. Bản đồ ánh xạ 2 chiều
    const origToNew = {};
    const newToOrig = {};
    finalQuestions.forEach((q, newIdx) => {
      const origNum = q.originalIndex;
      const newNum = newIdx + 1;
      const type = q.type || 'single_choice';

      if (type === 'single_choice') {
        const newLetter = String.fromCharCode(65 + q.correct);
        const origLetter = String.fromCharCode(65 + (q.origCorrect ?? 0));
        origToNew[origNum] = { newNum, newLetter, origLetter, type };
        newToOrig[newNum] = { origNum, newLetter, origLetter, type };
      } else {
        origToNew[origNum] = { newNum, type };
        newToOrig[newNum] = { origNum, type };
      }
    });

    return {
      code,
      questions: finalQuestions,
      origToNew,
      newToOrig,
    };
  });
}

/* ============================================================
   CHẤM ĐIỂM THEO TỪNG LOẠI CÂU
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
      // Chấm lũy tiến: mỗi ý đúng = pts/4
      if (Array.isArray(ans) && q.statements?.length === 4) {
        const rightCount = ans.filter((v, k) => v === q.statements[k].answer).length;
        const partial = (rightCount / 4) * pts;
        earnedPoints += partial;
        if (rightCount === 4) correctCount++;
        isCorrect = rightCount === 4;
      }
    } else if (type === 'short_answer') {
      const norm = (s) => String(s || '').replace(/\s+/g, '').replace(/[.]/g, ',').toLowerCase();
      const userAns = norm(ans);
      isCorrect = (q.accepted || []).some((a) => norm(a) === userAns);
      if (isCorrect) { correctCount++; earnedPoints += pts; }
    }

    details.push({ idx, type, isCorrect, points: isCorrect ? pts : 0 });
  });

  const score10 = maxPoints > 0 ? Math.round((earnedPoints / maxPoints) * 100) / 10 : 0;
  return { correctCount, totalCount: questions.length, earnedPoints, maxPoints, score10, details };
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

  // Shuffle state
  const [activeCode, setActiveCode] = useState('101');
  const [shuffledExams, setShuffledExams] = useState(() => generateShuffledVersions(questions, 4));

  useEffect(() => {
    setShuffledExams(generateShuffledVersions(questions, 4));
  }, [questions]);

  useEffect(() => {
    if (simSubmitted || simTimeLeft <= 0) return undefined;
    const t = setInterval(() => setSimTimeLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [simSubmitted, simTimeLeft]);

  const handleSubmitSimulation = () => {
    const result = gradeSimulation(questions, simAnswers);
    setSimScore(result);
    setSimSubmitted(true);
    sound.cheer();
  };

  const currentQ = questions[simActiveQ];

  return (
    <div
      style={{
        position: embedded ? 'relative' : 'fixed',
        inset: embedded ? 'auto' : 0,
        width: '100%',
        height: embedded ? '100%' : '100%',
        minHeight: embedded ? '580px' : 'auto',
        zIndex: embedded ? 1 : 99999,
        background: embedded ? 'var(--t-surface-1, #0b132b)' : 'rgba(11, 19, 43, 0.85)',
        backdropFilter: embedded ? 'none' : 'blur(16px)',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: embedded ? 18 : 0,
        overflow: 'hidden',
      }}
    >
      {/* HEADER */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.8rem 1.25rem',
        background: '#0b132b',
        borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
        color: '#fff',
        flexWrap: 'wrap',
        gap: '0.75rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
          <strong style={{ fontSize: '1.15rem', color: '#38bdf8', whiteSpace: 'nowrap' }}>
            ELEC AI Exam Studio
          </strong>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {examTitle} · {subject} · {questions.length} câu · {duration} phút
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', background: '#1c2541', padding: '0.3rem', borderRadius: 12, flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`vt-btn sm ${tab === 'sim' ? 'primary' : ''}`}
            onClick={() => setTab('sim')}
          >
            <IcoSim size={15} /> Mô phỏng thi
          </button>
          <button
            type="button"
            className={`vt-btn sm ${tab === 'print' ? 'primary' : ''}`}
            onClick={() => setTab('print')}
          >
            <IcoPrinter size={15} /> Bản in A4
          </button>
          <button
            type="button"
            className={`vt-btn sm ${tab === 'shuffle' ? 'primary' : ''}`}
            onClick={() => setTab('shuffle')}
          >
            <IcoShuffle size={15} /> Đảo 4 mã đề
          </button>
          <button
            type="button"
            className={`vt-btn sm ${tab === 'specs' ? 'primary' : ''}`}
            onClick={() => setTab('specs')}
          >
            <IcoTable size={15} /> Bảng đặc tả
          </button>
        </div>

        {onClose && (
          <button
            type="button"
            className="vt-btn sm"
            onClick={onClose}
            aria-label="Đóng"
          >
            <IcoX size={14} /> Đóng
          </button>
        )}
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: 'var(--bg, #f8fafc)' }}>
        {/* ============================================================
            TAB 1: MÔ PHỎNG THI
           ============================================================ */}
        {tab === 'sim' && (
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '1.5rem' }}>
            <div style={{
              background: 'var(--panel, #fff)',
              borderRadius: 20,
              padding: '1.8rem',
              border: '1px solid var(--line, rgba(0,0,0,0.1))',
              boxShadow: '0 8px 30px rgba(0,0,0,0.05)',
            }}>
              {currentQ ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0284c7' }}>
                      Câu {simActiveQ + 1} / {questions.length} ({currentQ.points || 1} điểm)
                    </span>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: 8,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: '#e0f2fe',
                        color: '#0369a1',
                      }}>
                        {LEVEL_INFO[normLevel(currentQ.level)]?.label?.toUpperCase() || 'THÔNG HIỂU'}
                      </span>
                      {currentQ.type === 'true_false' && (
                        <span style={{ padding: '0.2rem 0.6rem', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700, background: '#fce7f3', color: '#be185d' }}>
                          ĐÚNG/SAI
                        </span>
                      )}
                      {currentQ.type === 'short_answer' && (
                        <span style={{ padding: '0.2rem 0.6rem', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700, background: '#e0e7ff', color: '#4f46e5' }}>
                          TRẢ LỜI NGẮN
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                    {useMath ? <MathText text={currentQ.q} /> : currentQ.q}
                  </div>

                  {/* ===== single_choice ===== */}
                  {(currentQ.type === 'single_choice' || !currentQ.type) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {(currentQ.options || []).map((opt, oIdx) => {
                        const isChosen = simAnswers[simActiveQ] === oIdx;
                        const isCorrect = currentQ.correct === oIdx;
                        const letter = String.fromCharCode(65 + oIdx);
                        let bg = 'var(--surface-2, #f8fafc)';
                        let border = 'var(--line, rgba(0,0,0,0.1))';
                        if (isChosen) { bg = '#e0f2fe'; border = '#0284c7'; }
                        if (simSubmitted) {
                          if (isCorrect) { bg = '#dcfce7'; border = '#16a34a'; }
                          else if (isChosen && !isCorrect) { bg = '#fee2e2'; border = '#ef4444'; }
                        }
                        return (
                          <div
                            key={oIdx}
                            onClick={() => {
                              if (!simSubmitted) {
                                setSimAnswers((prev) => ({ ...prev, [simActiveQ]: oIdx }));
                                sound.ding();
                              }
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.8rem',
                              padding: '0.85rem 1.1rem',
                              borderRadius: 14,
                              background: bg,
                              border: `1.5px solid ${border}`,
                              cursor: simSubmitted ? 'default' : 'pointer',
                              fontSize: '0.95rem',
                            }}
                          >
                            <strong style={{
                              width: 24,
                              height: 24,
                              borderRadius: 50,
                              background: isChosen ? '#0284c7' : '#cbd5e1',
                              color: '#fff',
                              display: 'grid',
                              placeItems: 'center',
                              fontSize: '0.8rem',
                              flexShrink: 0,
                            }}>
                              {letter}
                            </strong>
                            <span style={{ flex: 1 }}>
                              {useMath ? <MathText text={opt} /> : opt}
                            </span>
                            {simSubmitted && isCorrect && (
                              <span style={{ color: '#16a34a', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                <IcoCheck size={14} /> Đáp án đúng
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* ===== true_false ===== */}
                  {currentQ.type === 'true_false' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {(currentQ.statements || []).map((st, sIdx) => {
                        const userAns = (simAnswers[simActiveQ] || [])[sIdx];
                        const correct = st.answer;
                        const letter = 'abcd'[sIdx];
                        return (
                          <div
                            key={sIdx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              padding: '0.85rem 1.1rem',
                              borderRadius: 14,
                              background: 'var(--surface-2, #f8fafc)',
                              border: '1px solid var(--line, rgba(0,0,0,0.1))',
                              flexWrap: 'wrap',
                            }}
                          >
                            <strong style={{ color: '#0284c7' }}>{letter})</strong>
                            <span style={{ flex: 1, minWidth: 160 }}>
                              {useMath ? <MathText text={st.text} /> : st.text}
                            </span>
                            <div style={{ display: 'flex', gap: '0.3rem' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  if (simSubmitted) return;
                                  const next = [...(simAnswers[simActiveQ] || [])];
                                  next[sIdx] = true;
                                  setSimAnswers((prev) => ({ ...prev, [simActiveQ]: next }));
                                  sound.ding();
                                }}
                                style={{
                                  padding: '0.4rem 0.9rem',
                                  borderRadius: 8,
                                  fontWeight: 700,
                                  fontSize: '0.82rem',
                                  background: userAns === true
                                    ? (simSubmitted ? (correct ? '#dcfce7' : '#fee2e2') : '#dcfce7')
                                    : 'var(--panel, #fff)',
                                  border: `1.5px solid ${userAns === true ? (simSubmitted ? (correct ? '#16a34a' : '#ef4444') : '#16a34a') : 'var(--line)'}`,
                                  color: userAns === true ? (simSubmitted ? (correct ? '#16a34a' : '#dc2626') : '#16a34a') : 'var(--mut)',
                                  cursor: simSubmitted ? 'default' : 'pointer',
                                }}
                              >
                                Đúng
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (simSubmitted) return;
                                  const next = [...(simAnswers[simActiveQ] || [])];
                                  next[sIdx] = false;
                                  setSimAnswers((prev) => ({ ...prev, [simActiveQ]: next }));
                                  sound.ding();
                                }}
                                style={{
                                  padding: '0.4rem 0.9rem',
                                  borderRadius: 8,
                                  fontWeight: 700,
                                  fontSize: '0.82rem',
                                  background: userAns === false
                                    ? (simSubmitted ? (correct ? '#dcfce7' : '#fee2e2') : '#fee2e2')
                                    : 'var(--panel, #fff)',
                                  border: `1.5px solid ${userAns === false ? (simSubmitted ? (correct ? '#16a34a' : '#ef4444') : '#dc2626') : 'var(--line)'}`,
                                  color: userAns === false ? (simSubmitted ? (correct ? '#16a34a' : '#dc2626') : '#dc2626') : 'var(--mut)',
                                  cursor: simSubmitted ? 'default' : 'pointer',
                                }}
                              >
                                Sai
                              </button>
                            </div>
                            {simSubmitted && (
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: 6,
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                background: correct ? '#dcfce7' : '#fee2e2',
                                color: correct ? '#16a34a' : '#dc2626',
                              }}>
                                {correct ? 'Đúng' : 'Sai'}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* ===== short_answer ===== */}
                  {currentQ.type === 'short_answer' && (
                    <div>
                      <input
                        type="text"
                        value={simAnswers[simActiveQ] || ''}
                        onChange={(e) => {
                          if (simSubmitted) return;
                          setSimAnswers((prev) => ({ ...prev, [simActiveQ]: e.target.value }));
                        }}
                        placeholder="Nhập đáp án của bạn..."
                        disabled={simSubmitted}
                        style={{
                          width: '100%',
                          padding: '0.9rem 1.1rem',
                          borderRadius: 12,
                          border: `1.5px solid ${simSubmitted ? (currentQ.accepted?.some((a) => String(a).replace(/\s+/g, '').toLowerCase() === String(simAnswers[simActiveQ] || '').replace(/\s+/g, '').toLowerCase()) ? '#16a34a' : '#ef4444') : 'var(--line, rgba(0,0,0,0.1))'}`,
                          background: simSubmitted
                            ? (currentQ.accepted?.some((a) => String(a).replace(/\s+/g, '').toLowerCase() === String(simAnswers[simActiveQ] || '').replace(/\s+/g, '').toLowerCase()) ? '#dcfce7' : '#fee2e2')
                            : 'var(--panel, #fff)',
                          fontSize: '1.1rem',
                          fontWeight: 600,
                          outline: 0,
                          fontFamily: 'inherit',
                        }}
                      />
                      {simSubmitted && (
                        <div style={{ marginTop: '0.75rem', padding: '0.65rem 1rem', borderRadius: 10, background: '#f0fdf4', border: '1px solid #16a34a', color: '#15803d', fontWeight: 600, fontSize: '0.88rem' }}>
                          Đáp án được chấp nhận: <strong>{(currentQ.accepted || []).join(' | ')}</strong>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Lời giải */}
                  {simSubmitted && currentQ.explain && (
                    <div style={{
                      marginTop: '1.5rem',
                      padding: '1rem',
                      background: '#f0fdf4',
                      borderRadius: 12,
                      borderLeft: '4px solid #16a34a',
                      fontSize: '0.9rem',
                      color: '#166534',
                      lineHeight: 1.6,
                    }}>
                      <strong>Lời giải chi tiết: </strong>
                      {useMath ? <MathText text={currentQ.explain} /> : currentQ.explain}
                    </div>
                  )}

                  {/* Navigation */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
                    <button
                      type="button"
                      className="vt-btn"
                      disabled={simActiveQ === 0}
                      onClick={() => setSimActiveQ((i) => Math.max(0, i - 1))}
                    >
                      Câu trước
                    </button>
                    <button
                      type="button"
                      className="vt-btn primary"
                      disabled={simActiveQ === questions.length - 1}
                      onClick={() => setSimActiveQ((i) => Math.min(questions.length - 1, i + 1))}
                    >
                      Câu tiếp theo
                    </button>
                  </div>
                </>
              ) : null}
            </div>

            {/* SIDEBAR */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: '#0f172a', color: '#fff', borderRadius: 18, padding: '1.2rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                  <IcoClock size={16} /> THỜI GIAN CÒN LẠI
                </span>
                <strong style={{ fontSize: '2.2rem', color: '#38bdf8', letterSpacing: '0.05em', fontFamily: 'monospace' }}>
                  {Math.floor(simTimeLeft / 60)}:{(simTimeLeft % 60).toString().padStart(2, '0')}
                </strong>
              </div>

              <div style={{ background: 'var(--panel, #fff)', borderRadius: 18, padding: '1.2rem', border: '1px solid var(--line, rgba(0,0,0,0.1))' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--mut)', display: 'block', marginBottom: '0.8rem' }}>
                  Bảng câu hỏi ({Object.keys(simAnswers).length}/{questions.length})
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.45rem' }}>
                  {questions.map((_, idx) => {
                    const isAnswered = simAnswers[idx] !== undefined && simAnswers[idx] !== '';
                    const isCurrent = simActiveQ === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSimActiveQ(idx)}
                        style={{
                          height: 38,
                          borderRadius: 10,
                          border: isCurrent ? '2px solid #0284c7' : '1px solid var(--line, rgba(0,0,0,0.1))',
                          background: isAnswered ? '#0284c7' : 'var(--surface-2, #f8fafc)',
                          color: isAnswered ? '#fff' : 'var(--ink, #0f172a)',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                {!simSubmitted ? (
                  <button
                    type="button"
                    className="vt-btn primary"
                    style={{ width: '100%', marginTop: '1.25rem', padding: '0.75rem', borderRadius: 12, fontWeight: 800 }}
                    onClick={handleSubmitSimulation}
                  >
                    Nộp Bài Chấm Thử
                  </button>
                ) : (
                  <div style={{ marginTop: '1.25rem', padding: '1rem', background: '#dcfce7', borderRadius: 12, textAlign: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 700 }}>ĐIỂM SỐ ĐẠT ĐƯỢC</span>
                    <strong style={{ fontSize: '2.4rem', color: '#15803d', display: 'block' }}>
                      {simScore?.score10} / 10
                    </strong>
                    <small style={{ color: '#166534' }}>
                      Đúng {simScore?.correctCount}/{simScore?.totalCount} câu
                      {simScore?.earnedPoints !== simScore?.maxPoints && (
                        <> · {Math.round(simScore?.earnedPoints * 10) / 10}/{simScore?.maxPoints} điểm</>
                      )}
                    </small>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            TAB 2: BẢN IN A4
           ============================================================ */}
        {tab === 'print' && (() => {
          const activeExamVersion = shuffledExams.find((e) => e.code === activeCode) || { questions };
          const printQuestions = activeExamVersion.questions || questions;

          return (
            <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="no-print" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--t-surface-1, #18181c)',
                padding: '0.85rem 1.25rem',
                borderRadius: 16,
                border: '1px solid var(--t-border, #2c2c34)',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--t-ink, #fff)' }}>
                    Mã đề in:
                  </span>
                  {shuffledExams.map((ex) => (
                    <button
                      key={ex.code}
                      type="button"
                      className={`vt-btn sm ${activeCode === ex.code ? 'primary' : ''}`}
                      onClick={() => setActiveCode(ex.code)}
                      style={{ padding: '0.35rem 0.85rem', borderRadius: 999 }}
                    >
                      Mã {ex.code}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="vt-btn primary sm"
                  onClick={() => window.print()}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: 999 }}
                >
                  <IcoPrinter size={15} /> In bản này (Ctrl + P)
                </button>
              </div>

              {/* TỜ ĐỀ A4 */}
              <div className="a4-printable-paper" style={{
                background: '#ffffff',
                color: '#000000',
                padding: '3.5rem 3rem',
                borderRadius: 8,
                boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                fontFamily: '"Times New Roman", Times, serif',
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  borderBottom: '2px solid #000',
                  paddingBottom: '1rem',
                  marginBottom: '1.5rem',
                }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem', textTransform: 'uppercase' }}>
                      SỞ GD&ĐT TỈNH / TRƯỜNG THPT
                    </p>
                    <p style={{ margin: '0.2rem 0', fontWeight: 700, fontSize: '1.05rem' }}>
                      {examTitle.toUpperCase()}
                    </p>
                    <p style={{ margin: 0, fontStyle: 'italic', fontSize: '0.9rem' }}>
                      Môn: {subject}
                    </p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem' }}>
                      KỲ THI ĐÁNH GIÁ NĂNG LỰC HỌC TẬP
                    </p>
                    <p style={{ margin: '0.2rem 0', fontWeight: 700 }}>NĂM HỌC 2025 - 2026</p>
                    <p style={{ margin: 0, fontStyle: 'italic', fontSize: '0.9rem' }}>
                      Thời gian làm bài: {duration} phút
                    </p>
                    <div style={{
                      display: 'inline-block',
                      border: '1.5px solid #000',
                      padding: '0.2rem 1rem',
                      marginTop: '0.4rem',
                      fontWeight: 800,
                    }}>
                      MÃ ĐỀ: {activeCode}
                    </div>
                  </div>
                </div>

                <p style={{ fontStyle: 'italic', fontSize: '0.92rem', marginBottom: '1.5rem' }}>
                  Họ và tên thí sinh: .................................................................... Số báo danh: ........................
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {printQuestions.map((q, idx) => {
                    const type = q.type || 'single_choice';
                    return (
                      <div key={idx} style={{ fontSize: '1.05rem', lineHeight: 1.6 }}>
                        <p style={{ margin: '0 0 0.4rem', fontWeight: 700 }}>
                          Câu {idx + 1}: <span style={{ fontWeight: 400 }}>
                            {useMath ? <MathText text={q.q} /> : q.q}
                          </span>
                        </p>

                        {type === 'single_choice' && (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem', paddingLeft: '1rem' }}>
                            {(q.options || []).map((opt, oIdx) => (
                              <div key={oIdx}>
                                <strong>{String.fromCharCode(65 + oIdx)}. </strong>
                                {useMath ? <MathText text={opt} /> : opt}
                              </div>
                            ))}
                          </div>
                        )}

                        {type === 'true_false' && (
                          <div style={{ paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            {(q.statements || []).map((st, sIdx) => (
                              <div key={sIdx} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                                <span>
                                  <strong>{'abcd'[sIdx]}) </strong>
                                  {useMath ? <MathText text={st.text} /> : st.text}
                                </span>
                                <span style={{ whiteSpace: 'nowrap' }}>Đ/S: ____</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {type === 'short_answer' && (
                          <div style={{ paddingLeft: '1rem' }}>
                            <span>Trả lời: ...................................................</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* BẢNG ĐÁP ÁN */}
                <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '2px dashed #666' }}>
                  <h4 style={{ margin: '0 0 0.8rem', textAlign: 'center', textTransform: 'uppercase' }}>
                    BẢNG ĐÁP ÁN THAM KHẢO (MÃ ĐỀ {activeCode})
                  </h4>

                  {/* Single choice answers */}
                  {printQuestions.some((q) => (q.type || 'single_choice') === 'single_choice') && (
                    <div style={{ marginBottom: '1rem' }}>
                      <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                        Phần trắc nghiệm:
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', border: '1px solid #000', textAlign: 'center' }}>
                        {printQuestions.map((q, idx) => {
                          if ((q.type || 'single_choice') !== 'single_choice') return null;
                          return (
                            <div key={idx} style={{ border: '1px solid #000', padding: '0.3rem' }}>
                              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{idx + 1}</div>
                              <div style={{ fontWeight: 800, color: '#b91c1c' }}>
                                {String.fromCharCode(65 + (q.correct || 0))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* True/False answers */}
                  {printQuestions.some((q) => q.type === 'true_false') && (
                    <div style={{ marginBottom: '1rem' }}>
                      <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                        Phần đúng/sai:
                      </p>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', border: '1px solid #000' }}>
                        <thead>
                          <tr style={{ background: '#f0f0f0' }}>
                            <th style={{ border: '1px solid #000', padding: '0.3rem' }}>Câu</th>
                            <th style={{ border: '1px solid #000', padding: '0.3rem' }}>a</th>
                            <th style={{ border: '1px solid #000', padding: '0.3rem' }}>b</th>
                            <th style={{ border: '1px solid #000', padding: '0.3rem' }}>c</th>
                            <th style={{ border: '1px solid #000', padding: '0.3rem' }}>d</th>
                          </tr>
                        </thead>
                        <tbody>
                          {printQuestions.map((q, idx) => {
                            if (q.type !== 'true_false') return null;
                            return (
                              <tr key={idx}>
                                <td style={{ border: '1px solid #000', padding: '0.3rem', textAlign: 'center', fontWeight: 700 }}>
                                  {idx + 1}
                                </td>
                                {(q.statements || []).map((st, sIdx) => (
                                  <td key={sIdx} style={{ border: '1px solid #000', padding: '0.3rem', textAlign: 'center', fontWeight: 700, color: '#b91c1c' }}>
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

                  {/* Short answer */}
                  {printQuestions.some((q) => q.type === 'short_answer') && (
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                        Phần trả lời ngắn:
                      </p>
                      <ul style={{ paddingLeft: '1.5rem', fontSize: '0.85rem', lineHeight: 1.6 }}>
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

                <div className="no-print" style={{ textAlign: 'center', marginTop: '2.5rem' }}>
                  <button
                    type="button"
                    className="vt-btn primary"
                    style={{
                      padding: '0.8rem 2.5rem',
                      fontSize: '1.05rem',
                      borderRadius: 999,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                    onClick={() => window.print()}
                  >
                    <IcoPrinter size={18} /> In Đề Thi Ngay (Mã {activeCode})
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ============================================================
            TAB 3: ĐẢO 4 MÃ ĐỀ
           ============================================================ */}
        {tab === 'shuffle' && (
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                  Bộ 4 Mã Đề Thi Hoán Vị (101 - 104)
                </h3>
                <p style={{ margin: '0.2rem 0 0', color: 'var(--mut)', fontSize: '0.88rem' }}>
                  Xáo thứ tự câu <strong>trong cùng nhóm độ khó</strong> — đảm bảo công bằng giữa các mã.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {shuffledExams.map((ex) => (
                  <button
                    key={ex.code}
                    type="button"
                    className={`vt-btn sm ${activeCode === ex.code ? 'primary' : ''}`}
                    onClick={() => setActiveCode(ex.code)}
                  >
                    Mã {ex.code}
                  </button>
                ))}
              </div>
            </div>

            <div style={{
              background: 'var(--panel, #fff)',
              borderRadius: 16,
              padding: '1.2rem',
              border: '1px solid var(--line, rgba(0,0,0,0.1))',
            }}>
              <h4 style={{ margin: '0 0 0.8rem', fontSize: '1rem', fontWeight: 800, color: '#0284c7' }}>
                Bảng Ma Trận Đối Chiếu Đáp Án
              </h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.88rem',
                  textAlign: 'center',
                }}>
                  <thead>
                    <tr style={{
                      background: 'var(--surface-2, #f8fafc)',
                      borderBottom: '2px solid var(--line, rgba(0,0,0,0.1))',
                    }}>
                      <th style={{ padding: '0.6rem' }}>Câu Gốc</th>
                      <th style={{ padding: '0.6rem', color: '#0284c7' }}>Mã 101</th>
                      <th style={{ padding: '0.6rem', color: '#16a34a' }}>Mã 102</th>
                      <th style={{ padding: '0.6rem', color: '#f59e0b' }}>Mã 103</th>
                      <th style={{ padding: '0.6rem', color: '#dc2626' }}>Mã 104</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map((_, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--line, rgba(0,0,0,0.06))' }}>
                        <td style={{ padding: '0.6rem 0.5rem', fontWeight: 700 }}>Câu {idx + 1}</td>
                        {shuffledExams.map((ex) => {
                          const mapping = ex.origToNew?.[idx + 1];
                          if (!mapping) return <td key={ex.code} style={{ padding: '0.6rem' }}>—</td>;
                          return (
                            <td key={ex.code} style={{ padding: '0.6rem 0.5rem' }}>
                              {mapping.type === 'single_choice' ? (
                                <>
                                  <strong style={{
                                    fontSize: '0.96rem',
                                    color: ex.code === '101' ? '#0284c7'
                                      : ex.code === '102' ? '#16a34a'
                                      : ex.code === '103' ? '#d97706'
                                      : '#dc2626',
                                  }}>
                                    {mapping.newLetter}
                                  </strong>
                                  <span style={{ fontSize: '0.74rem', color: 'var(--mut)', marginLeft: '0.4rem', fontWeight: 600 }}>
                                    (Câu {mapping.newNum})
                                  </span>
                                </>
                              ) : (
                                <span style={{ fontSize: '0.78rem', color: 'var(--mut)' }}>
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
              <p style={{ margin: '0.75rem 0 0', fontSize: '0.8rem', color: 'var(--mut)', fontStyle: 'italic' }}>
                * Câu trong cùng nhóm NB/TH/VD/VDC chỉ hoán vị trong nhóm — giữ nguyên độ khó giữa các mã.
              </p>
            </div>
          </div>
        )}

        {/* ============================================================
            TAB 4: BẢNG ĐẶC TẢ
           ============================================================ */}
        {tab === 'specs' && (
          <div style={{
            maxWidth: 1100,
            margin: '0 auto',
            background: 'var(--panel, #fff)',
            borderRadius: 18,
            padding: '1.5rem',
            border: '1px solid var(--line, rgba(0,0,0,0.1))',
          }}>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', fontWeight: 800, color: '#0284c7' }}>
              Bảng Đặc Tả Đề Thi & Yêu Cầu Cần Đạt (Chuẩn GDPT 2018)
            </h3>
            <p style={{ margin: '0 0 1.25rem', color: 'var(--mut)', fontSize: '0.88rem' }}>
              Môn {subject} · Lớp {matrix?.grade || '—'} · {questions.length} câu · {duration} phút
            </p>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{
                    background: 'var(--surface-2, #f8fafc)',
                    borderBottom: '2px solid var(--line, rgba(0,0,0,0.1))',
                  }}>
                    <th style={{ padding: '0.75rem', width: 60, textAlign: 'center' }}>Câu</th>
                    <th style={{ padding: '0.75rem', width: 100 }}>Loại</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Chuyên Đề</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Mức Độ</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Yêu Cầu Cần Đạt</th>
                    <th style={{ padding: '0.75rem', width: 80, textAlign: 'center' }}>Điểm</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((q, idx) => {
                    const lvMeta = LEVEL_INFO[normLevel(q.level)] || LEVEL_INFO.nb;
                    const type = q.type || 'single_choice';
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--line, rgba(0,0,0,0.06))' }}>
                        <td style={{ padding: '0.65rem', textAlign: 'center', fontWeight: 700 }}>{idx + 1}</td>
                        <td style={{ padding: '0.65rem' }}>
                          <span style={{
                            padding: '0.15rem 0.5rem',
                            borderRadius: 6,
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: type === 'single_choice' ? '#e0f2fe'
                              : type === 'true_false' ? '#fce7f3'
                              : '#e0e7ff',
                            color: type === 'single_choice' ? '#0369a1'
                              : type === 'true_false' ? '#be185d'
                              : '#4f46e5',
                          }}>
                            {type === 'single_choice' ? 'Trắc nghiệm'
                              : type === 'true_false' ? 'Đúng/Sai'
                              : 'Trả lời ngắn'}
                          </span>
                        </td>
                        <td style={{ padding: '0.65rem', fontWeight: 600 }}>{q.topic || 'Kiến thức trọng tâm'}</td>
                        <td style={{ padding: '0.65rem' }}>
                          <span style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: 6,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: lvMeta.bg,
                            color: lvMeta.color,
                          }}>
                            {lvMeta.label}
                          </span>
                        </td>
                        <td style={{ padding: '0.65rem', color: 'var(--mut)', lineHeight: 1.5 }}>
                          Học sinh vận dụng kiến thức chuyên đề "{q.topic || 'trọng tâm'}" để giải quyết yêu cầu.
                        </td>
                        <td style={{ padding: '0.65rem', textAlign: 'center', fontWeight: 800 }}>{q.points || 1}đ</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}