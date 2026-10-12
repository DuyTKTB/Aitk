/* ============================================================
   ExamPreviewSimulator.jsx — Bộ Xem Trước & Mô Phỏng Đề Thi Đa Năng
   - Chế độ 1: 📱 Mô phỏng học sinh thi thật (Student Exam Simulator)
   - Chế độ 2: 📄 Bản in A4 chuẩn Bộ GD&ĐT (National Print Preview)
   - Chế độ 3: 🔀 Đảo 4 mã đề tự động (101 - 104) & Bảng đáp án đối chiếu
   - Chế độ 4: 📊 Bảng đặc tả đề thi (Specification Table & Competencies)
   ============================================================ */
import { useState, useEffect } from 'react';
import MathText from '../MathText.jsx';
import sound from '../../lib/gameSound.js';

const Svg = ({ size = 16, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const IcoClock = (p) => <Svg {...p}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></Svg>;
const IcoPrinter = (p) => <Svg {...p}><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></Svg>;
const IcoShuffle = (p) => <Svg {...p}><polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" /><polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /><line x1="4" y1="4" x2="9" y2="9" /></Svg>;
const IcoCheck = (p) => <Svg {...p}><polyline points="20 6 9 17 4 12" /></Svg>;
const IcoTable = (p) => <Svg {...p}><path d="M3 3h18v18H3z" /><path d="M3 9h18" /><path d="M3 15h18" /><path d="M9 3v18" /><path d="M15 3v18" /></Svg>;
const IcoSim = (p) => <Svg {...p}><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></Svg>;

// Thuật toán đảo đề khoa học sinh 4 mã đề
function generateShuffledVersions(questions = [], count = 4) {
  const codeList = ['101', '102', '103', '104'].slice(0, count);
  return codeList.map((code, seed) => {
    // Đảo câu hỏi dựa theo seed
    const shuffledQ = questions.map((q, idx) => {
      const origOpts = [...(q.options || [])];
      const correctText = origOpts[q.correct];

      // Đảo thứ tự đáp án A B C D theo chu kỳ hoán vị
      const shift = (seed + idx) % (origOpts.length || 1);
      const newOpts = [...origOpts.slice(shift), ...origOpts.slice(0, shift)];
      const newCorrect = newOpts.indexOf(correctText);

      return {
        ...q,
        options: newOpts,
        correct: newCorrect >= 0 ? newCorrect : 0,
        originalIndex: idx + 1,
      };
    });

    // Đảo thứ tự câu trong đề
    const permuted = [...shuffledQ];
    for (let i = permuted.length - 1; i > 0; i--) {
      const j = (i * (seed + 3) + 7) % (i + 1);
      [permuted[i], permuted[j]] = [permuted[j], permuted[i]];
    }

    return {
      code,
      questions: permuted,
    };
  });
}

export default function ExamPreviewSimulator({
  exam = {},
  questions = [],
  matrix = null,
  onClose,
  defaultTab = 'sim',
}) {
  const [tab, setTab] = useState(defaultTab || 'sim'); // sim | print | shuffle | specs
  const examTitle = exam.title || matrix?.title || 'Đề kiểm tra Hóa học 11';
  const duration = exam.duration || matrix?.duration || 30;

  // Simulator State
  const [simAnswers, setSimAnswers] = useState({});
  const [simActiveQ, setSimActiveQ] = useState(0);
  const [simTimeLeft, setSimTimeLeft] = useState(duration * 60);
  const [simSubmitted, setSimSubmitted] = useState(false);
  const [simScore, setSimScore] = useState(null);

  // Shuffler State
  const [activeCode, setActiveCode] = useState('101');
  const [shuffledExams, setShuffledExams] = useState(() => generateShuffledVersions(questions, 4));

  useEffect(() => {
    setShuffledExams(generateShuffledVersions(questions, 4));
  }, [questions]);

  // Đồng hồ đếm ngược Simulator
  useEffect(() => {
    if (simSubmitted || simTimeLeft <= 0) return;
    const t = setInterval(() => setSimTimeLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [simSubmitted, simTimeLeft]);

  // Nộp bài thi thử
  const handleSubmitSimulation = () => {
    let correctCount = 0;
    let earnedPoints = 0;
    let maxPoints = 0;

    questions.forEach((q, idx) => {
      const pts = Number(q.points) || 1;
      maxPoints += pts;
      if (simAnswers[idx] === q.correct) {
        correctCount++;
        earnedPoints += pts;
      }
    });

    const score10 = maxPoints > 0 ? Math.round((earnedPoints / maxPoints) * 100) / 10 : 0;
    setSimScore({
      correctCount,
      totalCount: questions.length,
      earnedPoints,
      maxPoints,
      score10,
    });
    setSimSubmitted(true);
    sound.fanfare();
  };

  const currentQ = questions[simActiveQ];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(11, 19, 43, 0.85)', backdropFilter: 'blur(16px)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* TOP HEADER THANH CÔNG CỤ */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.8rem 1.5rem', background: '#0b132b', borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
        color: '#ffffff', flexWrap: 'wrap', gap: '0.75rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <strong style={{ fontSize: '1.15rem', color: '#38bdf8' }}>
            ELEC AI Exam Studio
          </strong>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            {examTitle} · {questions.length} câu · {duration} phút
          </span>
        </div>

        {/* 4 Chế độ xem trước */}
        <div style={{ display: 'flex', gap: '0.4rem', background: '#1c2541', padding: '0.3rem', borderRadius: 12 }}>
          <button
            type="button"
            className={`vt-btn sm ${tab === 'sim' ? 'primary' : ''}`}
            onClick={() => setTab('sim')}
          >
            <IcoSim size={15} /> Mô Phỏng Học Sinh Thi
          </button>
          <button
            type="button"
            className={`vt-btn sm ${tab === 'print' ? 'primary' : ''}`}
            onClick={() => setTab('print')}
          >
            <IcoPrinter size={15} /> Bản In A4 Bộ GD&ĐT
          </button>
          <button
            type="button"
            className={`vt-btn sm ${tab === 'shuffle' ? 'primary' : ''}`}
            onClick={() => setTab('shuffle')}
          >
            <IcoShuffle size={15} /> Đảo 4 Mã Đề (101-104)
          </button>
          <button
            type="button"
            className={`vt-btn sm ${tab === 'specs' ? 'primary' : ''}`}
            onClick={() => setTab('specs')}
          >
            <IcoTable size={15} /> Bảng Đặc Tả Đề Thi
          </button>
        </div>

        <button type="button" className="vt-btn sm" onClick={onClose}>
          ✕ Đóng Xem Trước
        </button>
      </header>

      {/* NỘI DUNG CHÍNH THEO TỪNG CHẾ ĐỘ */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: 'var(--bg, #f8fafc)' }}>
        {/* ============================================================
            CHẾ ĐỘ 1: MÔ PHỎNG HỌC SINH LÀM BÀI THI (STUDENT SIMULATOR)
            ============================================================ */}
        {tab === 'sim' && (
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '1.5rem' }}>
            {/* Cột trái: Nội dung câu hỏi đang làm */}
            <div style={{ background: 'var(--panel, #fff)', borderRadius: 20, padding: '1.8rem', border: '1px solid var(--line, rgba(0,0,0,0.1))', boxShadow: '0 8px 30px rgba(0,0,0,0.05)' }}>
              {currentQ ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0284c7' }}>
                      Câu {simActiveQ + 1} / {questions.length} ({currentQ.points || 1} điểm)
                    </span>
                    <span style={{ padding: '0.2rem 0.6rem', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700, background: '#e0f2fe', color: '#0369a1' }}>
                      {currentQ.level?.toUpperCase() || 'THÔNG HIỂU'}
                    </span>
                  </div>

                  <div style={{ fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                    <MathText text={currentQ.q} />
                  </div>

                  {/* 4 Lựa chọn A, B, C, D */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {(currentQ.options || []).map((opt, oIdx) => {
                      const isChosen = simAnswers[simActiveQ] === oIdx;
                      const isCorrect = currentQ.correct === oIdx;
                      const letter = String.fromCharCode(65 + oIdx);

                      let bg = 'var(--surface-2, #f8fafc)';
                      let border = 'var(--line, rgba(0,0,0,0.1))';
                      if (isChosen) {
                        bg = '#e0f2fe';
                        border = '#0284c7';
                      }
                      if (simSubmitted) {
                        if (isCorrect) {
                          bg = '#dcfce7';
                          border = '#16a34a';
                        } else if (isChosen && !isCorrect) {
                          bg = '#fee2e2';
                          border = '#ef4444';
                        }
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
                            display: 'flex', alignItems: 'center', gap: '0.8rem',
                            padding: '0.85rem 1.1rem', borderRadius: 14,
                            background: bg, border: `1.5px solid ${border}`,
                            cursor: simSubmitted ? 'default' : 'pointer',
                            fontSize: '0.95rem',
                          }}
                        >
                          <strong style={{ width: 24, height: 24, borderRadius: 50, background: isChosen ? '#0284c7' : '#cbd5e1', color: '#fff', display: 'grid', placeItems: 'center', fontSize: '0.8rem' }}>
                            {letter}
                          </strong>
                          <MathText text={opt} />
                          {simSubmitted && isCorrect && <span style={{ marginLeft: 'auto', color: '#16a34a', fontWeight: 800 }}>✓ Đáp án đúng</span>}
                        </div>
                      );
                    })}
                  </div>

                  {/* Lời giải chi tiết sau khi nộp bài */}
                  {simSubmitted && currentQ.explain && (
                    <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f0fdf4', borderRadius: 12, borderLeft: '4px solid #16a34a', fontSize: '0.9rem', color: '#166534', lineHeight: 1.6 }}>
                      <strong>Lời giải chi tiết: </strong>
                      <MathText text={currentQ.explain} />
                    </div>
                  )}

                  {/* Nút lùi / tiến câu */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
                    <button
                      type="button"
                      className="vt-btn"
                      disabled={simActiveQ === 0}
                      onClick={() => setSimActiveQ((i) => Math.max(0, i - 1))}
                    >
                      ← Câu trước
                    </button>
                    <button
                      type="button"
                      className="vt-btn primary"
                      disabled={simActiveQ === questions.length - 1}
                      onClick={() => setSimActiveQ((i) => Math.min(questions.length - 1, i + 1))}
                    >
                      Câu tiếp theo →
                    </button>
                  </div>
                </>
              ) : null}
            </div>

            {/* Cột phải: Bảng số câu hỏi & Nộp bài */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Đồng hồ đếm ngược */}
              <div style={{ background: '#0f172a', color: '#fff', borderRadius: 18, padding: '1.2rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                  <IcoClock size={16} /> THỜI GIAN CÒN LẠI
                </span>
                <strong style={{ fontSize: '2.2rem', color: '#38bdf8', letterSpacing: '0.05em', fontFamily: 'monospace' }}>
                  {Math.floor(simTimeLeft / 60)}:{(simTimeLeft % 60).toString().padStart(2, '0')}
                </strong>
              </div>

              {/* Bảng số câu hỏi */}
              <div style={{ background: 'var(--panel, #fff)', borderRadius: 18, padding: '1.2rem', border: '1px solid var(--line, rgba(0,0,0,0.1))' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--mut)', display: 'block', marginBottom: '0.8rem' }}>
                  Bảng câu hỏi ({Object.keys(simAnswers).length}/{questions.length} đã làm)
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.45rem' }}>
                  {questions.map((_, idx) => {
                    const isAnswered = simAnswers[idx] !== undefined;
                    const isCurrent = simActiveQ === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSimActiveQ(idx)}
                        style={{
                          height: 38, borderRadius: 10, border: isCurrent ? '2px solid #0284c7' : '1px solid var(--line, rgba(0,0,0,0.1))',
                          background: isAnswered ? '#0284c7' : 'var(--surface-2, #f8fafc)',
                          color: isAnswered ? '#fff' : 'var(--ink, #0f172a)',
                          fontWeight: 700, cursor: 'pointer',
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
                      Đúng {simScore?.correctCount}/{simScore?.totalCount} câu ({simScore?.earnedPoints}/{simScore?.maxPoints} điểm)
                    </small>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            CHẾ ĐỘ 2: BẢN IN A4 CHUẨN BỘ GIÁO DỤC & ĐÀO TẠO
            ============================================================ */}
        {tab === 'print' && (
          <div style={{ maxWidth: 860, margin: '0 auto', background: '#ffffff', color: '#000000', padding: '3.5rem 3rem', borderRadius: 8, boxShadow: '0 10px 40px rgba(0,0,0,0.15)', fontFamily: '"Times New Roman", Times, serif' }}>
            {/* Header bản in */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderBottom: '2px solid #000', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem', textTransform: 'uppercase' }}>
                  SỞ GD&ĐT TỈNH / TRƯỜNG THPT
                </p>
                <p style={{ margin: '0.2rem 0', fontWeight: 700, fontSize: '1.05rem' }}>
                  {examTitle.toUpperCase()}
                </p>
                <p style={{ margin: 0, fontStyle: 'italic', fontSize: '0.9rem' }}>
                  (Đề thi gồm có {Math.ceil(questions.length / 4)} trang)
                </p>
              </div>

              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem' }}>
                  KỲ THI ĐÁNH GIÁ NĂNG LỰC HỌC TẬP
                </p>
                <p style={{ margin: '0.2rem 0', fontWeight: 700 }}>
                  NĂM HỌC 2025 - 2026
                </p>
                <p style={{ margin: 0, fontStyle: 'italic', fontSize: '0.9rem' }}>
                  Thời gian làm bài: {duration} phút (Không kể phát đề)
                </p>
                <div style={{ display: 'inline-block', border: '1.5px solid #000', padding: '0.2rem 1rem', marginTop: '0.4rem', fontWeight: 800 }}>
                  MÃ ĐỀ: 101
                </div>
              </div>
            </div>

            <p style={{ fontStyle: 'italic', fontSize: '0.92rem', marginBottom: '1.5rem' }}>
              Họ và tên thí sinh: .................................................................... Số báo danh: ........................
            </p>

            {/* Nội dung câu hỏi bản in */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {questions.map((q, idx) => (
                <div key={idx} style={{ fontSize: '1.05rem', lineHeight: 1.6 }}>
                  <p style={{ margin: '0 0 0.4rem', fontWeight: 700 }}>
                    Câu {idx + 1}: <span style={{ fontWeight: 400 }}><MathText text={q.q} /></span>
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem', paddingLeft: '1rem' }}>
                    {(q.options || []).map((opt, oIdx) => (
                      <div key={oIdx}>
                        <strong>{String.fromCharCode(65 + oIdx)}. </strong>
                        <MathText text={opt} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Bảng đáp án cho giáo viên */}
            <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '2px dashed #666' }}>
              <h4 style={{ margin: '0 0 0.8rem', textAlign: 'center', textTransform: 'uppercase' }}>
                BẢNG ĐÁP ÁN THAM KHẢO (DÀNH CHO GIÁO VIÊN)
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', border: '1px solid #000', textAlign: 'center' }}>
                {questions.map((q, idx) => (
                  <div key={idx} style={{ border: '1px solid #000', padding: '0.3rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{idx + 1}</div>
                    <div style={{ fontWeight: 800, color: '#b91c1c' }}>{String.fromCharCode(65 + (q.correct || 0))}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Nút bấm in */}
            <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
              <button
                type="button"
                className="vt-btn primary"
                style={{ padding: '0.8rem 2.5rem', fontSize: '1.05rem', borderRadius: 999 }}
                onClick={() => window.print()}
              >
                🖨️ In Đề Thi Ngay (Ctrl + P)
              </button>
            </div>
          </div>
        )}

        {/* ============================================================
            CHẾ ĐỘ 3: ĐẢO 4 MÃ ĐỀ TỰ ĐỘNG (101 - 104)
            ============================================================ */}
        {tab === 'shuffle' && (
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                  Bộ 4 Mã Đề Thi Hoán Vị Tự Động (101 - 104)
                </h3>
                <p style={{ margin: '0.2rem 0 0', color: 'var(--mut)', fontSize: '0.88rem' }}>
                  Được xáo trộn thứ tự câu hỏi và thứ tự đáp án theo chu trình khoa học.
                </p>
              </div>

              {/* Tabs chọn mã đề */}
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

            {/* BẢNG ĐỐI CHIẾU ĐÁP ÁN 4 MÃ ĐỀ */}
            <div style={{ background: 'var(--panel, #fff)', borderRadius: 16, padding: '1.2rem', border: '1px solid var(--line, rgba(0,0,0,0.1))' }}>
              <h4 style={{ margin: '0 0 0.8rem', fontSize: '1rem', fontWeight: 800, color: '#0284c7' }}>
                Bảng Ma Trận Đối Chiếu Đáp Án Giữa 4 Mã Đề
              </h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'center' }}>
                  <thead>
                    <tr style={{ background: 'var(--surface-2, #f8fafc)', borderBottom: '2px solid var(--line, rgba(0,0,0,0.1))' }}>
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
                        <td style={{ padding: '0.5rem', fontWeight: 700 }}>Câu {idx + 1}</td>
                        {shuffledExams.map((ex) => {
                          const q = ex.questions[idx];
                          return (
                            <td key={ex.code} style={{ padding: '0.5rem', fontWeight: 800 }}>
                              {String.fromCharCode(65 + (q?.correct || 0))}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            CHẾ ĐỘ 4: BẢNG ĐẶC TẢ ĐỀ THI (SPECIFICATION TABLE)
            ============================================================ */}
        {tab === 'specs' && (
          <div style={{ maxWidth: 1100, margin: '0 auto', background: 'var(--panel, #fff)', borderRadius: 18, padding: '1.5rem', border: '1px solid var(--line, rgba(0,0,0,0.1))' }}>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', fontWeight: 800, color: '#0284c7' }}>
              Bảng Đặc Tả Đề Thi & Yêu Cầu Cần Đạt (Chuẩn GDPT 2018)
            </h3>
            <p style={{ margin: '0 0 1.25rem', color: 'var(--mut)', fontSize: '0.88rem' }}>
              Mô tả chi tiết chuẩn năng lực và chỉ số hành vi cho từng câu hỏi trong đề thi.
            </p>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-2, #f8fafc)', borderBottom: '2px solid var(--line, rgba(0,0,0,0.1))' }}>
                    <th style={{ padding: '0.75rem', width: 60, textAlign: 'center' }}>Câu</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Chuyên Đề / Nội Dung Kiến Thức</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Mức Độ Nhận Thức</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Yêu Cầu Cần Đạt (Năng Lực)</th>
                    <th style={{ padding: '0.75rem', width: 80, textAlign: 'center' }}>Điểm</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((q, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--line, rgba(0,0,0,0.06))' }}>
                      <td style={{ padding: '0.65rem', textAlign: 'center', fontWeight: 700 }}>{idx + 1}</td>
                      <td style={{ padding: '0.65rem', fontWeight: 600 }}>{q.topic || 'Kiến thức trọng tâm'}</td>
                      <td style={{ padding: '0.65rem' }}>
                        <span style={{ padding: '0.2rem 0.5rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700, background: '#e0f2fe', color: '#0369a1' }}>
                          {q.level?.toUpperCase() || 'THÔNG HIỂU'}
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem', color: 'var(--mut)', lineHeight: 1.5 }}>
                        Học sinh nhận biết và vận dụng định luật, công thức giải quyết bài toán liên quan đến {q.topic || 'chuyên đề'}.
                      </td>
                      <td style={{ padding: '0.65rem', textAlign: 'center', fontWeight: 800 }}>
                        {q.points || 1}đ
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
