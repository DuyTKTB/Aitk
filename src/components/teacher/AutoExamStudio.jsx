/* ============================================================
   AutoExamStudio.jsx — AI Studio Tạo Đề & Ma Trận Đề Thi
   Mô phỏng 100% quy trình chuyên nghiệp của autoexam.ai:
   - Split-screen: Cột trái phỏng vấn AI hỏi rất kĩ, Cột phải Ma trận & Workspace
   - Hỏi từng bước: Khối lớp -> Số câu & thời gian -> Cấu trúc đề 2025
   - Bước phân tích Steps Trace có blue pulse
   - Bảng Ma trận đề thi chuẩn Bộ GD&ĐT & Bloom
   - Sinh câu hỏi bám sát từng ô ma trận, lưu trực tiếp vào lớp
   ============================================================ */
import { useState, useRef, useEffect, useMemo } from 'react';
import MathText from '../MathText.jsx';
import { useAuth } from '../../hooks/useAuth.jsx';
import { createExam } from '../../lib/classroom.js';
import { planMatrixWithAI, generateQuestionsFromApprovedMatrix, refineMatrixWithAI, askPedagogyAI } from '../../lib/matrixAiService.js';
import { readFile, validateFiles, fmtSize } from '../../lib/fileReader.js';
import sound from '../../lib/gameSound.js';
import ExamPreviewSimulator from './ExamPreviewSimulator.jsx';
import '../../styles/autoexam-studio.css';

/* ============ ICONS ============ */
const Svg = ({ size = 16, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const IcoSpark = (p) => <Svg {...p}><path d="M12 2l2.4 5.6L20 10l-5.6 2.4L12 18l-2.4-5.6L4 10l5.6-2.4z" /></Svg>;
const IcoSend = (p) => <Svg {...p}><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></Svg>;
const IcoPaperclip = (p) => <Svg {...p}><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></Svg>;
const IcoSim = (p) => <Svg {...p}><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></Svg>;
const IcoPrinter = (p) => <Svg {...p}><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></Svg>;
const IcoLightbulb = (p) => <Svg {...p}><path d="M9 18h6" /><path d="M10 22h4" /><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5.64.78 1.08 1.6 1.41 2.5" /></Svg>;
const IcoCheck = (p) => <Svg {...p}><polyline points="20 6 9 17 4 12" /></Svg>;
const IcoTable = (p) => <Svg {...p}><path d="M3 3h18v18H3z" /><path d="M3 9h18" /><path d="M3 15h18" /><path d="M9 3v18" /><path d="M15 3v18" /></Svg>;
const IcoRocket = (p) => <Svg {...p}><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" /></Svg>;
const IcoBook = (p) => <Svg {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></Svg>;
const IcoEye = (p) => <Svg {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></Svg>;
const IcoEdit = (p) => <Svg {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></Svg>;

// CAROUSEL DATA (Như hình 2, 3, 4)
const CAROUSEL_SLIDES = [
  {
    icon: <IcoBook size={32} />,
    title: 'Yêu cầu AI đúng ý tưởng',
    desc: 'Hãy mô tả rõ ý tưởng, mục tiêu và cấu trúc đề thi để AI tạo đúng mong muốn. AI hỗ trợ nhiều dạng câu hỏi như Trắc nghiệm, Đúng/Sai, Điền từ, Sắp xếp, Trả lời ngắn và Tự luận.',
  },
  {
    icon: <IcoSpark size={32} />,
    title: 'Trao đổi với AI trước khi tạo đề',
    desc: 'Bật Chat mode để mô tả chi tiết mục tiêu và cấu trúc đề. Giúp đề đúng ý hơn, chuẩn hóa bám sát chương trình GDPT 2018.',
  },
  {
    icon: <IcoTable size={32} />,
    title: 'Lập Ma trận đề thi chuẩn Bộ GD&ĐT',
    desc: 'Hệ thống tự động quy đổi và phân bổ số câu, điểm số thành 4 mức độ nhận thức: Nhận biết, Thông hiểu, Vận dụng và Vận dụng cao.',
  },
  {
    icon: <IcoRocket size={32} />,
    title: 'Lưu & quản lý phiên bản',
    desc: 'Khi có thay đổi, người dùng chỉ cần nhấn "Lưu đề thi" hoặc "Xuất bản" để đồng bộ ngay lập tức vào phòng thi của học sinh.',
  },
];

function parseExamIntent(text) {
  const t = String(text || '');
  const count = t.match(/(\d+)\s*câu/i);
  const duration = t.match(/(\d+)\s*(phút|phut)/i);
  const grade = t.match(/lớp\s*(\d{1,2})/i);
  return {
    count: count ? Number(count[1]) : null,
    duration: duration ? Number(duration[1]) : null,
    grade: grade ? grade[1] : null,
  };
}

export default function AutoExamStudio({
  classes = [],
  initialClass = null,
  classInsights,
  onDone,
  onCancel,
}) {
  const { user } = useAuth();
  const [selectedClassId, setSelectedClassId] = useState(initialClass?.id || classes[0]?.id || '');
  const [topic, setTopic] = useState('Bài tính số mol');
  const [inputMessage, setInputMessage] = useState('');
  const [activeHubTab, setActiveHubTab] = useState('exam'); // exam | sheet | lecture | chat

  // Interview state (Hỏi rất kĩ)
  const [step, setStep] = useState(1); // 1: grade, 2: count & duration, 3: format, 4: matrix ready, 5: questions generated
  const [selectedGrade, setSelectedGrade] = useState('11');
  const [selectedCount, setSelectedCount] = useState(10);
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [selectedFormat, setSelectedFormat] = useState('Chuyên đề Hóa học');

  // Matrix and questions
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [matrixData, setMatrixData] = useState(null);
  const [matrixMode, setMatrixMode] = useState('bogddt'); // bogddt | bloom
  const [questions, setQuestions] = useState([]);
  const [viewMode, setViewMode] = useState('matrix'); // matrix | preview
  const [showSimulator, setShowSimulator] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [editNote, setEditNote] = useState('');
  const [studioError, setStudioError] = useState('');
  const fileInputRef = useRef(null);

  // Carousel
  const [carouselIdx, setCarouselIdx] = useState(0);

  const insightText = classInsights?.forAi || '';

  // Chat message history
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'user',
      text: 'Bài tính số mol',
    },
    {
      role: 'ai',
      text: 'Để tạo đề chuẩn, mình cần làm rõ vài điểm nhé:',
    },
  ]);

  const feedEndRef = useRef(null);
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, step, analyzing, generating]);

  // Tự động xoay Carousel slide
  useEffect(() => {
    if (matrixData) return;
    const t = setInterval(() => {
      setCarouselIdx((i) => (i + 1) % CAROUSEL_SLIDES.length);
    }, 4500);
    return () => clearInterval(t);
  }, [matrixData]);

  const pushChat = (msg) => setChatMessages((prev) => [...prev, msg]);

  const handleSelectGrade = (g) => {
    setSelectedGrade(g);
    sound.ding();
    setChatMessages((prev) => [
      ...prev,
      { role: 'summary', text: `Dành cho học sinh lớp ${g}` },
      { role: 'ai', text: 'Đề gồm bao nhiêu câu và thời lượng làm bài?' },
    ]);
    setStep(2);
  };

  // Xử lý chọn số câu & thời lượng
  const handleSelectCount = (cnt, dur) => {
    setSelectedCount(cnt);
    setSelectedDuration(dur);
    sound.ding();
    setChatMessages((prev) => [
      ...prev,
      { role: 'summary', text: `Đề gồm: ${cnt} câu · Thời lượng: ${dur} phút` },
      { role: 'ai', text: 'Bạn muốn cấu trúc đề theo định dạng nào?' },
    ]);
    setStep(3);
  };

  const handleSelectFormatAndPlanMatrix = async (fmt) => {
    setSelectedFormat(fmt);
    sound.ding();
    setStep(4);
    setAnalyzing(true);
    setStudioError('');

    setChatMessages((prev) => [
      ...prev,
      { role: 'summary', text: `Định dạng: ${fmt}` },
      { role: 'trace_loading', text: insightText ? 'Đang đọc dữ liệu lớp và lập ma trận...' : 'Đang phân tích yêu cầu và lập ma trận...' },
    ]);

    try {
      const planned = await planMatrixWithAI({
        topic,
        grade: selectedGrade,
        subject: 'Hóa học',
        count: selectedCount,
        duration: selectedDuration,
        format: fmt,
        intent: activeHubTab === 'sheet' ? 'sheet' : activeHubTab === 'lecture' ? 'lecture' : 'exam',
        classInsights: insightText,
        files: attachedFiles,
      });

      setMatrixData(planned);
      sound.cheer();

      setChatMessages((prev) => [
        ...prev.filter((m) => m.role !== 'trace_loading'),
        {
          role: 'trace_done',
          title: `Ma trận ${planned.totalQuestions || selectedCount} câu — xác nhận để sinh đề`,
          steps: [
            insightText ? 'Đã đọc điểm yếu từ bài nộp của lớp.' : 'Đã đọc yêu cầu chủ đề và khối lớp.',
            attachedFiles.length ? `Đã dùng ${attachedFiles.length} tài liệu đính kèm.` : 'Phân bổ 4 mức nhận biết → vận dụng cao.',
            planned.source === 'fallback' ? 'AI chưa phản hồi — đang dùng khung dự phòng, bạn vẫn chỉnh được.' : 'Ma trận do AI lập theo khảo thí GDPT 2018.',
            'Xem bảng bên phải rồi bấm Xác nhận & Sinh đề.',
          ],
        },
        {
          role: 'ai_advice',
          text: planned.aiPedagogicalAdvice || `Đã lập ma trận ${selectedCount} câu / ${selectedDuration} phút. Xem bảng rồi xác nhận để sinh câu hỏi.`,
        },
      ]);
    } catch (e) {
      console.error(e);
      const msg = e.message || 'Không lập được ma trận.';
      setStudioError(msg);
      setChatMessages((prev) => [
        ...prev.filter((m) => m.role !== 'trace_loading'),
        { role: 'ai', text: `Không lập được ma trận: ${msg}` },
      ]);
      setStep(3);
    } finally {
      setAnalyzing(false);
    }
  };

  // Bấm "Xác nhận & Sinh đề"
  const handleConfirmAndGenerateQuestions = async () => {
    if (!matrixData) return;
    setGenerating(true);
    sound.ding();

    setChatMessages((prev) => [
      ...prev,
      { role: 'user', text: 'Xác nhận & Sinh đề' },
      { role: 'ai', text: 'Đang tiến hành biên soạn câu hỏi bám sát 100% Ma trận đã duyệt... Vui lòng chờ vài giây!' },
    ]);

    try {
      const qList = await generateQuestionsFromApprovedMatrix({
        matrix: matrixData,
      });
      setQuestions(qList);
      setStep(5);
      setViewMode('preview');
      sound.cheer();

      setChatMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: `🎉 Đã hoàn tất biên soạn ${qList.length} câu hỏi theo đúng ma trận! Bạn có thể xem trước, chỉnh sửa đáp án bên phải và bấm "Xuất bản" để mở phòng thi.`,
        },
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  // Gửi tin nhắn tự do từ ô chat
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const text = inputMessage.trim();
    if (!text || analyzing || generating) return;

    sound.ding();
    setInputMessage('');
    setChatMessages((prev) => [...prev, { role: 'user', text }]);

    if (!matrixData) {
      setTopic(text);
      handleSelectFormatAndPlanMatrix(text);
    } else {
      // Yêu cầu chỉnh sửa ma trận hoặc câu hỏi
      setAnalyzing(true);
      setTimeout(async () => {
        const updated = await planMatrixWithAI({
          topic: `${topic} (${text})`,
          grade: selectedGrade,
          subject: 'Hóa học',
          count: selectedCount,
          duration: selectedDuration,
          customPrompt: text,
        });
        setMatrixData(updated);
        setAnalyzing(false);
        sound.cheer();
        setChatMessages((prev) => [
          ...prev,
          { role: 'ai', text: `Đã cập nhật lại ma trận theo yêu cầu: "${text}". Mời bạn kiểm tra bảng ma trận bên phải!` },
        ]);
      }, 1000);
    }
  };

  // Xuất bản đề thi vào Firestore
  const handlePublishExam = async () => {
    if (!questions.length) {
      alert('Chưa có câu hỏi nào để xuất bản.');
      return;
    }
    if (!selectedClassId) {
      alert('Vui lòng chọn 1 lớp học ở thanh trên cùng bên phải để gán đề thi.');
      return;
    }

    try {
      const targetClass = classes.find((c) => c.id === selectedClassId);
      await createExam({
        teacherId: user.uid,
        teacherName: user.displayName || user.email || 'Giáo viên',
        classId: selectedClassId,
        title: matrixData?.title || `Đề ${topic} Lớp ${selectedGrade}`,
        description: `Đề thi biên soạn theo ma trận chuẩn Bộ GD&ĐT 2025 gồm ${questions.length} câu.`,
        duration: selectedDuration,
        questions,
        showAnswerAfter: true,
        allowRetry: false,
        shuffle: true,
      });

      sound.fanfare();
      alert(`Đã xuất bản đề thi thành công vào lớp ${targetClass?.name || ''}!`);
      onDone?.();
    } catch (err) {
      alert('Lỗi xuất bản: ' + err.message);
    }
  };

  return (
    <div className="aes-container">
      {/* ============================================================
          1. HEADER GIAO DIỆN KIỂU AUTOEXAM.AI
          ============================================================ */}
      <div className="aes-hub-head">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="aes-greeting">
            Xin chào, thầy/cô {user?.displayName?.split(' ')?.pop() || user?.email?.split('@')?.[0] || 'Giáo viên'} 👋
          </h1>
          {onCancel && (
            <button type="button" className="vt-btn sm" onClick={onCancel}>
              ← Quay lại Dashboard
            </button>
          )}
        </div>

        {/* 4 Tabs trung tâm của AutoExam */}
        <div className="aes-hub-tabs">
          <button
            type="button"
            className={`aes-hub-tab ${activeHubTab === 'exam' ? 'active' : ''}`}
            onClick={() => setActiveHubTab('exam')}
          >
            <IcoBook size={16} /> Đề thi & Ma trận (AI Studio)
          </button>
          <button
            type="button"
            className={`aes-hub-tab ${activeHubTab === 'sheet' ? 'active' : ''}`}
            onClick={() => { setActiveHubTab('sheet'); setTopic('Phiếu bài tập luyện tập'); }}
          >
            <IcoTable size={16} /> Phiếu bài tập
          </button>
          <button
            type="button"
            className={`aes-hub-tab ${activeHubTab === 'lecture' ? 'active' : ''}`}
            onClick={() => { setActiveHubTab('lecture'); setTopic('Bài giảng lý thuyết & ví dụ minh họa'); }}
          >
            <IcoSpark size={16} /> Bài giảng lý thuyết
          </button>
          <button
            type="button"
            className={`aes-hub-tab ${activeHubTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveHubTab('chat')}
          >
            <IcoLightbulb size={16} /> Trợ lý Sư phạm AI
          </button>
        </div>
      </div>

      {/* ============================================================
          2. STUDIO SPLIT VIEW: TRÁI CHAT INTERVIEW — PHẢI MA TRẬN
          ============================================================ */}
      <div className="aes-studio">
        {/* ---------------- CỘT TRÁI: AI CHAT INTERVIEW ---------------- */}
        <div className="aes-left-pane">
          <div className="aes-left-head">
            <div className="aes-left-title">
              <IcoSpark size={18} />
              <span>{topic} ▾</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--mut)', fontWeight: 600 }}>
              AI Studio v2.5
            </span>
          </div>

          <div className="aes-left-feed">
            {chatMessages.map((msg, i) => {
              if (msg.role === 'user') {
                return (
                  <div key={i} className="aes-msg-user">
                    {msg.text}
                  </div>
                );
              }
              if (msg.role === 'summary') {
                return (
                  <div key={i} className="aes-summary-badge">
                    <span>{msg.text}</span>
                  </div>
                );
              }
              if (msg.role === 'trace_loading') {
                return (
                  <div key={i} className="aes-steps-trace">
                    <div className="aes-trace-header">
                      <div className="aes-pulse-dot" />
                      <span>{msg.text}</span>
                    </div>
                  </div>
                );
              }
              if (msg.role === 'trace_done') {
                return (
                  <div key={i} className="aes-steps-trace">
                    <div className="aes-trace-header">
                      <span>✓ {msg.title}</span>
                    </div>
                    {msg.steps.map((st, sidx) => (
                      <div key={sidx} className="aes-trace-item">
                        {st}
                      </div>
                    ))}
                  </div>
                );
              }
              if (msg.role === 'ai_advice') {
                return (
                  <div key={i} className="aes-msg-ai" style={{ background: '#f5f3ff', padding: '0.85rem 1rem', borderRadius: 16 }}>
                    {msg.text}
                  </div>
                );
              }
              return (
                <div key={i} className="aes-msg-ai">
                  {msg.text}
                </div>
              );
            })}

            {/* BƯỚC 1: HỎI KHỐI LỚP (1/3) */}
            {step === 1 && (
              <div className="aes-interview-card">
                <div className="aes-interview-head">
                  <span>Bài tập dành cho học sinh lớp mấy?</span>
                  <span className="aes-interview-step">1/3</span>
                </div>
                <div className="aes-interview-options">
                  {['8', '9', '10', '11', '12'].map((g, idx) => (
                    <button
                      key={g}
                      type="button"
                      className="aes-option-btn"
                      onClick={() => handleSelectGrade(g)}
                    >
                      <span>{idx + 1}. Lớp {g}</span>
                      <span>›</span>
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.2rem' }}>
                  <button
                    type="button"
                    style={{ border: 0, background: 'none', color: '#94a3b8', fontSize: '0.78rem', cursor: 'pointer' }}
                    onClick={() => handleSelectGrade('11')}
                  >
                    Bỏ qua
                  </button>
                </div>
              </div>
            )}

            {/* BƯỚC 2: HỎI SỐ CÂU & THỜI LƯỢNG (2/3) */}
            {step === 2 && (
              <div className="aes-interview-card">
                <div className="aes-interview-head">
                  <span>Đề gồm bao nhiêu câu & thời lượng thi?</span>
                  <span className="aes-interview-step">2/3</span>
                </div>
                <div className="aes-interview-options">
                  <button type="button" className="aes-option-btn" onClick={() => handleSelectCount(10, 30)}>
                    <span>1. 10 câu (30 phút - Kiểm tra 1 tiết ngắn)</span>
                    <span>›</span>
                  </button>
                  <button type="button" className="aes-option-btn" onClick={() => handleSelectCount(20, 45)}>
                    <span>2. 20 câu (45 phút - Kiểm tra 1 tiết chuẩn)</span>
                    <span>›</span>
                  </button>
                  <button type="button" className="aes-option-btn" onClick={() => handleSelectCount(28, 50)}>
                    <span>3. 28 câu (50 phút - Chuẩn định dạng Bộ GD&ĐT 2025)</span>
                    <span>›</span>
                  </button>
                  <button type="button" className="aes-option-btn" onClick={() => handleSelectCount(40, 90)}>
                    <span>4. 40 câu (90 phút - Thi học kì / Thi thử tốt nghiệp)</span>
                    <span>›</span>
                  </button>
                </div>
              </div>
            )}

            {/* BƯỚC 3: HỎI CẤU TRÚC VÀ ĐỊNH DẠNG (3/3) */}
            {step === 3 && (
              <div className="aes-interview-card">
                <div className="aes-interview-head">
                  <span>Cấu trúc phân bổ và mức độ đề?</span>
                  <span className="aes-interview-step">3/3</span>
                </div>
                <div className="aes-interview-options">
                  <button
                    type="button"
                    className="aes-option-btn"
                    onClick={() => handleSelectFormatAndPlanMatrix('Chuẩn GDPT 2018 (Trắc nghiệm + Trả lời ngắn)')}
                  >
                    <span>1. Chuẩn GDPT 2018 (Trắc nghiệm + Trả lời ngắn)</span>
                    <span>›</span>
                  </button>
                  <button
                    type="button"
                    className="aes-option-btn"
                    onClick={() => handleSelectFormatAndPlanMatrix('100% Trắc nghiệm 4 lựa chọn (Cơ bản đến Vận dụng)')}
                  >
                    <span>2. 100% Trắc nghiệm 4 lựa chọn</span>
                    <span>›</span>
                  </button>
                  <button
                    type="button"
                    className="aes-option-btn"
                    onClick={() => handleSelectFormatAndPlanMatrix('Đề thi phân hóa rèn luyện kỹ năng')}
                  >
                    <span>3. Đề rèn luyện nâng cao tư duy số liệu</span>
                    <span>›</span>
                  </button>
                </div>
              </div>
            )}

            {/* BƯỚC 4: ĐÃ CÓ MA TRẬN -> HỘP HÀNH ĐỘNG SINH ĐỀ */}
            {step >= 4 && matrixData && (
              <div className="aes-action-box">
                <strong>Bạn muốn làm gì tiếp theo?</strong>
                <button
                  type="button"
                  className="aes-btn-confirm-gen"
                  onClick={handleConfirmAndGenerateQuestions}
                  disabled={generating}
                >
                  <IcoRocket size={18} />
                  <span>{generating ? 'Đang soạn đề theo ma trận...' : '1. Xác nhận & Sinh đề (Gợi ý)'}</span>
                </button>
                <div className="aes-action-edit-input">
                  <input
                    type="text"
                    placeholder="Hoặc yêu cầu chỉnh sửa: Ví dụ: thêm 2 câu nâng cao..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setInputMessage(e.currentTarget.value);
                        handleSendMessage();
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <button type="button" onClick={() => handleConfirmAndGenerateQuestions()}>
                    Gửi
                  </button>
                </div>
              </div>
            )}

            <div ref={feedEndRef} />
          </div>

          {/* Ô gõ chat dưới cùng */}
          <form className="aes-left-inputbar" onSubmit={handleSendMessage}>
            <button
              type="button"
              className="aes-icon-btn"
              title="Đính kèm tài liệu"
              onClick={() => alert('Đã sẵn sàng tải file tài liệu, giáo án Word/PDF')}
            >
              <IcoPaperclip size={17} />
            </button>
            <button
              type="button"
              className="aes-icon-btn"
              title="Gợi ý câu lệnh mẫu"
              onClick={() => setInputMessage('Soạn đề trắc nghiệm tính số mol và bảo toàn khối lượng lớp 11')}
            >
              <IcoLightbulb size={17} />
            </button>
            <textarea
              rows={1}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Nhập tin nhắn... (hoặc yêu cầu chỉnh sửa đề)"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <button type="submit" className="aes-btn-send" style={{ padding: '0.55rem 1rem' }}>
              <IcoSend size={15} />
            </button>
          </form>
        </div>

        {/* ---------------- CỘT PHẢI: WORKSPACE & LIVE MATRIX ---------------- */}
        <div className="aes-right-pane">
          <div className="aes-right-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <span className="aes-status-pill">
                <span className="dot" />
                {analyzing ? 'Đang phân tích...' : generating ? 'Đang sinh câu hỏi...' : matrixData ? 'Ma trận sẵn sàng' : 'Chờ yêu cầu'}
              </span>

              {classes.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--mut)' }}>Lớp học:</span>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    style={{
                      padding: '0.3rem 0.6rem',
                      borderRadius: 8,
                      border: '1px solid var(--line, rgba(0,0,0,0.1))',
                      fontSize: '0.82rem',
                      background: 'var(--surface-2, #f8fafc)',
                    }}
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="aes-right-actions">
              {questions.length > 0 && (
                <>
                  <button
                    type="button"
                    className="vt-btn sm"
                    onClick={() => setViewMode(viewMode === 'matrix' ? 'preview' : 'matrix')}
                  >
                    <IcoEye size={14} /> {viewMode === 'matrix' ? 'Xem câu hỏi' : 'Xem ma trận'}
                  </button>
                  <button
                    type="button"
                    className="vt-btn sm"
                    style={{ background: 'linear-gradient(135deg, #0284c7, #2563eb)', color: '#fff', border: 'none', fontWeight: 700 }}
                    onClick={() => setShowSimulator(true)}
                    title="Mở bộ mô phỏng học sinh làm bài thi, bản in A4 và đảo 4 mã đề"
                  >
                    <IcoSim size={14} /> Mô phỏng & In A4
                  </button>
                </>
              )}
              <button
                type="button"
                className="aes-btn-publish"
                onClick={handlePublishExam}
                disabled={!questions.length}
              >
                <IcoRocket size={14} /> Xuất bản vào Lớp
              </button>
            </div>
          </div>

          <div className="aes-right-body">
            {/* TRƯỜNG HỢP 1: CHƯA CÓ MA TRẬN -> CAROUSEL WALKTHROUGH */}
            {!matrixData && (
              <div className="aes-carousel-card">
                <div className="aes-carousel-icon">
                  {CAROUSEL_SLIDES[carouselIdx].icon}
                </div>
                <h3>{CAROUSEL_SLIDES[carouselIdx].title}</h3>
                <p>{CAROUSEL_SLIDES[carouselIdx].desc}</p>
                <div className="aes-carousel-dots">
                  {CAROUSEL_SLIDES.map((_, i) => (
                    <div
                      key={i}
                      className={`aes-dot ${carouselIdx === i ? 'active' : ''}`}
                      onClick={() => setCarouselIdx(i)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* TRƯỜNG HỢP 2: ĐÃ CÓ MA TRẬN & ĐANG XEM MA TRẬN (HÌNH 5) */}
            {matrixData && viewMode === 'matrix' && (
              <div className="aes-matrix-wrap">
                <div className="aes-matrix-header">
                  <div>
                    <h2 className="aes-matrix-title">
                      <IcoTable size={20} color="#7e22ce" />
                      <span>Ma trận đề thi</span>
                      <span style={{ fontSize: '0.85rem', color: '#7e22ce', fontWeight: 600 }}>
                        ({matrixData.totalQuestions} câu, {matrixData.parts?.length || 2} phần)
                      </span>
                    </h2>
                    <div className="aes-matrix-badges" style={{ marginTop: '0.4rem' }}>
                      <span className="aes-mbadge">🧪 {matrixData.subject}</span>
                      <span className="aes-mbadge">🎓 Lớp {matrixData.grade}</span>
                      <span className="aes-mbadge">⏱️ {matrixData.duration} phút</span>
                      <span className="aes-mbadge" style={{ color: '#16a34a' }}>💯 10 điểm</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button
                      type="button"
                      className={`vt-btn sm ${matrixMode === 'bogddt' ? 'primary' : ''}`}
                      onClick={() => setMatrixMode('bogddt')}
                    >
                      Bộ GD&ĐT
                    </button>
                    <button
                      type="button"
                      className={`vt-btn sm ${matrixMode === 'bloom' ? 'primary' : ''}`}
                      onClick={() => setMatrixMode('bloom')}
                    >
                      Bloom (AI)
                    </button>
                  </div>
                </div>

                {/* BẢNG MA TRẬN CHI TIẾT */}
                <div className="aes-matrix-tablewrap">
                  <table className="aes-matrix-table">
                    <thead>
                      <tr>
                        <th style={{ width: '38%', textAlign: 'left' }}>Chủ đề / Nội dung</th>
                        <th className="aes-th-nb">{matrixMode === 'bogddt' ? 'Nhận biết' : 'Remembering'}</th>
                        <th className="aes-th-th">{matrixMode === 'bogddt' ? 'Thông hiểu' : 'Understanding'}</th>
                        <th className="aes-th-vd">{matrixMode === 'bogddt' ? 'Vận dụng' : 'Applying'}</th>
                        <th className="aes-th-vdc">{matrixMode === 'bogddt' ? 'Vận dụng cao' : 'Analyzing'}</th>
                        <th className="aes-th-tot">Tổng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matrixData.parts?.map((part, pidx) => (
                        <>
                          <tr key={`p-${pidx}`} className="aes-row-part">
                            <td colSpan={6}>{part.partName}</td>
                          </tr>
                          {part.topics?.map((top, tidx) => {
                            const rowCount = (top.nb.count || 0) + (top.th.count || 0) + (top.vd.count || 0) + (top.vdc.count || 0);
                            const rowPts = Math.round(((top.nb.points || 0) + (top.th.points || 0) + (top.vd.points || 0) + (top.vdc.points || 0)) * 10) / 10;
                            return (
                              <tr key={`t-${pidx}-${tidx}`}>
                                <td>{top.name}</td>
                                <td style={{ textAlign: 'center' }}>
                                  {top.nb.count > 0 ? (
                                    <>
                                      <span className="aes-cell-val">{top.nb.count}</span>
                                      <span className="aes-cell-pts">[{top.nb.points}đ]</span>
                                    </>
                                  ) : '—'}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  {top.th.count > 0 ? (
                                    <>
                                      <span className="aes-cell-val">{top.th.count}</span>
                                      <span className="aes-cell-pts">[{top.th.points}đ]</span>
                                    </>
                                  ) : '—'}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  {top.vd.count > 0 ? (
                                    <>
                                      <span className="aes-cell-val">{top.vd.count}</span>
                                      <span className="aes-cell-pts">[{top.vd.points}đ]</span>
                                    </>
                                  ) : '—'}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  {top.vdc.count > 0 ? (
                                    <>
                                      <span className="aes-cell-val">{top.vdc.count}</span>
                                      <span className="aes-cell-pts">[{top.vdc.points}đ]</span>
                                    </>
                                  ) : '—'}
                                </td>
                                <td style={{ textAlign: 'center', fontWeight: 800 }}>
                                  {rowCount} [{rowPts}đ]
                                </td>
                              </tr>
                            );
                          })}
                        </>
                      ))}

                      {/* HÀNG TỔNG CỘNG */}
                      <tr className="aes-row-total">
                        <td><strong>Tổng cộng</strong></td>
                        <td style={{ textAlign: 'center', color: '#047857' }}>
                          <span className="aes-cell-val">{matrixData.summary?.nb.count} câu</span>
                          <span className="aes-cell-pts">[{matrixData.summary?.nb.points}đ]</span>
                        </td>
                        <td style={{ textAlign: 'center', color: '#0369a1' }}>
                          <span className="aes-cell-val">{matrixData.summary?.th.count} câu</span>
                          <span className="aes-cell-pts">[{matrixData.summary?.th.points}đ]</span>
                        </td>
                        <td style={{ textAlign: 'center', color: '#b45309' }}>
                          <span className="aes-cell-val">{matrixData.summary?.vd.count} câu</span>
                          <span className="aes-cell-pts">[{matrixData.summary?.vd.points}đ]</span>
                        </td>
                        <td style={{ textAlign: 'center', color: '#b91c1c' }}>
                          <span className="aes-cell-val">{matrixData.summary?.vdc.count} câu</span>
                          <span className="aes-cell-pts">[{matrixData.summary?.vdc.points}đ]</span>
                        </td>
                        <td style={{ textAlign: 'center', color: '#7e22ce' }}>
                          <span className="aes-cell-val">{matrixData.summary?.total.count} câu</span>
                          <span className="aes-cell-pts">[10.0đ]</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span className="aes-matrix-footer">
                    * Ma trận được quy đổi về 4 mức độ nhận thức theo quy định khảo thí của Bộ GD&ĐT 2025.
                  </span>
                  <button
                    type="button"
                    className="vt-btn sm primary"
                    onClick={handleConfirmAndGenerateQuestions}
                    disabled={generating}
                  >
                    <IcoRocket size={14} /> {generating ? 'Đang sinh câu hỏi...' : 'Xác nhận & Bắt đầu sinh đề ngay'}
                  </button>
                </div>
              </div>
            )}

            {/* TRƯỜNG HỢP 3: XEM BỘ CÂU HỎI ĐÃ SINH THEO MA TRẬN */}
            {questions.length > 0 && viewMode === 'preview' && (
              <div className="aes-exam-preview">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                      Bộ đề thi ({questions.length} câu hỏi bám sát ma trận)
                    </h3>
                    <p style={{ margin: '0.2rem 0 0', color: 'var(--mut)', fontSize: '0.85rem' }}>
                      Được phân bổ theo 4 mức độ nhận thức. Giáo viên có thể bấm chọn đáp án đúng hoặc sửa nội dung.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                      type="button"
                      className="vt-btn sm"
                      onClick={() => setViewMode('matrix')}
                    >
                      <IcoTable size={14} /> Trở về xem Ma trận
                    </button>
                    <button
                      type="button"
                      className="vt-btn sm primary"
                      style={{ background: 'linear-gradient(135deg, #0284c7, #2563eb)', color: '#fff' }}
                      onClick={() => setShowSimulator(true)}
                    >
                      <IcoSim size={14} /> Mô phỏng & In A4 / Đảo 4 mã đề
                    </button>
                  </div>
                </div>

                {questions.map((q, idx) => {
                  const levelClass = q.level?.includes('cao') ? 'vdc' : q.level?.includes('van dung') ? 'vd' : q.level?.includes('thong hieu') ? 'th' : 'nb';
                  return (
                    <article key={q.id || idx} className="aes-question-card">
                      <div className="aes-q-head">
                        <span className="aes-q-title">Câu {idx + 1} ({q.points || 1.0} điểm)</span>
                        <div className="aes-q-badges">
                          <span className={`aes-badge-level ${levelClass}`}>
                            {q.level?.toUpperCase() || 'NHẬN BIẾT'}
                          </span>
                          {q.topic && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--mut)', background: 'var(--surface-2)', padding: '0.15rem 0.5rem', borderRadius: 6 }}>
                              {q.topic}
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ fontSize: '0.92rem', lineHeight: 1.6 }}>
                        <MathText text={q.q} />
                      </div>

                      <div className="aes-q-options">
                        {(q.options || []).map((opt, oIdx) => {
                          const isCorrect = q.correct === oIdx;
                          const letter = String.fromCharCode(65 + oIdx);
                          return (
                            <div
                              key={oIdx}
                              className={`aes-opt-item ${isCorrect ? 'correct' : ''}`}
                              onClick={() => {
                                setQuestions((prev) =>
                                  prev.map((item, itemIdx) => (itemIdx === idx ? { ...item, correct: oIdx } : item))
                                );
                              }}
                              title="Bấm để đổi đáp án đúng"
                            >
                              <strong>{letter}.</strong>
                              <MathText text={opt} />
                              {isCorrect && <IcoCheck size={14} style={{ marginLeft: 'auto' }} />}
                            </div>
                          );
                        })}
                      </div>

                      {q.explain && (
                        <div className="aes-q-explain">
                          <strong>Lời giải chi tiết: </strong>
                          <MathText text={q.explain} />
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL MÔ PHỎNG THI, BẢN IN A4 & ĐẢO 4 MÃ ĐỀ */}
      {showSimulator && (
        <ExamPreviewSimulator
          exam={{
            title: topic || 'Đề kiểm tra Hóa học',
            duration: selectedDuration || 30,
          }}
          questions={questions}
          matrix={matrixData}
          onClose={() => setShowSimulator(false)}
        />
      )}
    </div>
  );
}
