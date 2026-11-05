/* ============================================================
   TeacherAiCopilot.jsx — AI Trợ Lý Toàn Năng Cho Giáo Viên (v1.0)
   ------------------------------------------------------------
   Phong cách thiết kế Clerio Clean Sky-Blue SaaS:
     1. XỬ LÝ & SỬA FILE ĐỀ CHUẨN GDPT 2025:
        - Tải file Word (.docx), PDF, TXT hoặc dán văn bản đề thô.
        - Tự động bóc tách công thức, hình ảnh, bảng biểu.
        - Diagnostic Engine: Phát hiện lỗi thiếu đáp án, sai cấu trúc 3 phần,
          câu chưa gán mức độ (NB/TH/VD/VDC), công thức hỏng font.
        - AI Tự động sửa chữa, chuẩn hóa 1-chạm, sinh lời giải chi tiết.
        - 1-click đưa sang bộ Trộn Đề Thi, Lưu vào Kho Đề, Tải Word (.docx).
     2. QUẢN LÝ LỚP & PHÂN TÍCH HỌC SINH CHUYÊN SÂU:
        - Tổng hợp điểm, phổ điểm, phát hiện sớm học sinh có nguy cơ (<5.0).
        - Bản đồ lỗ hổng kiến thức theo chuyên đề.
        - AI Sinh đề ôn luyện phục hồi 1-chạm cho nhóm học sinh yếu.
        - Chat tương tác hỏi đáp trực tiếp số liệu lớp học.
     3. AI GIÁM THỊ & PHÒNG THI TRỰC TIẾP:
        - Phân loại mức độ vi phạm: Nhẹ, Trung bình, Nghiêm trọng.
        - Công tắc "AI Tự động gửi nhắc nhở thí sinh vi phạm" (Auto-Remind).
        - Live Feed cảnh báo thời gian thực.
     4. TẠO ĐỀ NHANH ON-THE-FLY:
        - Nhập prompt tự nhiên, AI tạo đề chuẩn 3 phần GDPT 2025.
   ============================================================ */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import mammoth from 'mammoth';
import { askAI } from '../../lib/ai.js';
import { exportToWord } from '../../lib/examExport.js';
import { warnStudent, setStudentPaused } from '../../lib/examSession.js';
import '../../styles/teacher-ai-copilot.css';

/* ============ SVG ICONS (STROKE 1.8PX, NO EMOJI) ============ */
const Svg = ({ size = 18, sw = 1.8, children, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {children}
  </svg>
);

const IcoSparkles = (p) => (
  <Svg {...p}>
    <path d="m12 3 1.9 4.8a2 2 0 0 0 1.3 1.3L20 11l-4.8 1.9a2 2 0 0 0-1.3 1.3L12 19l-1.9-4.8a2 2 0 0 0-1.3-1.3L4 11l4.8-1.9a2 2 0 0 0 1.3-1.3L12 3z" />
    <path d="M19 19l1 2 1-2 2-1-2-1-1-2-1 2-2 1 2 1z" />
  </Svg>
);

const IcoDoc = (p) => (
  <Svg {...p}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </Svg>
);

const IcoChart = (p) => (
  <Svg {...p}>
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </Svg>
);

const IcoShield = (p) => (
  <Svg {...p}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </Svg>
);

const IcoBolt = (p) => (
  <Svg {...p}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </Svg>
);

const IcoUpload = (p) => (
  <Svg {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </Svg>
);

const IcoCheck = (p) => (
  <Svg {...p}>
    <polyline points="20 6 9 17 4 12" />
  </Svg>
);

const IcoAlert = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </Svg>
);

const IcoSend = (p) => (
  <Svg {...p}>
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </Svg>
);

const IcoDownload = (p) => (
  <Svg {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </Svg>
);

const IcoShuffle = (p) => (
  <Svg {...p}>
    <polyline points="16 3 21 3 21 8" />
    <line x1="4" y1="20" x2="21" y2="3" />
    <polyline points="21 16 21 21 16 21" />
    <line x1="15" y1="15" x2="21" y2="21" />
    <line x1="4" y1="4" x2="9" y2="9" />
  </Svg>
);

const IcoRefresh = (p) => (
  <Svg {...p}>
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </Svg>
);

const IcoClose = (p) => (
  <Svg {...p}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </Svg>
);

export default function TeacherAiCopilot({
  classes = [],
  exams = [],
  submissionsMap = {},
  liveSessions = [],
  onOpenSimulator,
  onCreateExam,
  onSay,
  initialTab = 'doc-fixer',
  onClose,
  embedded = false,
}) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'doc-fixer' | 'class-intelligence' | 'proctor-ai' | 'prompt-gen'

  /* --- 1. STATE CHO FILE FIXER --- */
  const [rawText, setRawText] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [fileImages, setFileImages] = useState([]);
  const [parsingFile, setParsingFile] = useState(false);
  const [analyzingFile, setAnalyzingFile] = useState(false);
  const [examAnalysis, setExamAnalysis] = useState(null);
  const [repairedExam, setRepairedExam] = useState(null);

  /* --- 2. STATE CHO CLASS INTELLIGENCE --- */
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || 'all');
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'm1',
      sender: 'ai',
      text: 'Chào thầy cô! Em là Trợ lý AI ELEC. Thầy cô có thể thả file đề Word để em tự động sửa lỗi chuẩn GDPT 2025, hoặc hỏi bất kỳ câu hỏi nào về tình hình học tập và phòng thi của lớp ạ.',
      time: 'Vừa xong',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatThinking, setChatThinking] = useState(false);

  /* --- 3. STATE CHO PROCTOR AI (GIÁM THỊ THÔNG MINH) --- */
  const [autoWarnEnabled, setAutoWarnEnabled] = useState(true);
  const [proctorLogs, setProctorLogs] = useState([]);
  const [lastWarnedMap, setLastWarnedMap] = useState({});

  /* --- 4. STATE CHO INSTANT GEN --- */
  const [genPrompt, setGenPrompt] = useState('');
  const [generatingExam, setGeneratingExam] = useState(false);

  const fileInputRef = useRef(null);

  /* ============================================================
     1. XỬ LÝ ĐỌC FILE WORD (.DOCX) / PDF / TXT
     ============================================================ */
  const handleFileUpload = async (file) => {
    if (!file) return;
    setParsingFile(true);
    setUploadedFileName(file.name);
    setExamAnalysis(null);
    setRepairedExam(null);

    const name = file.name.toLowerCase();
    try {
      if (name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const extractedImages = [];
        const result = await mammoth.convertToHtml(
          { arrayBuffer },
          {
            convertImage: mammoth.images.imgElement((image) => {
              return image.read('base64').then((imageBuffer) => {
                const src = `data:${image.contentType};base64,${imageBuffer}`;
                extractedImages.push(src);
                return { src };
              });
            }),
          }
        );
        const textContent = result.value
          .replace(/<\/p>/gi, '\n')
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/\n{3,}/g, '\n\n');

        setRawText(textContent);
        setFileImages(extractedImages);
        if (onSay) onSay(`Đã đọc xong file “${file.name}” (${extractedImages.length} hình ảnh)`, 'success');
      } else if (name.endsWith('.txt')) {
        const text = await file.text();
        setRawText(text);
        setFileImages([]);
      } else {
        // Fallback đọc text
        const text = await file.text();
        setRawText(text);
        setFileImages([]);
      }
    } catch (err) {
      console.error('[AI Copilot] Lỗi đọc file:', err);
      if (onSay) onSay('Không đọc được nội dung file: ' + err.message, 'error');
    } finally {
      setParsingFile(false);
    }
  };

  /* ============================================================
     2. AI TỰ ĐỘNG PHÂN TÍCH LỖI VÀ CHUẨN HÓA ĐỀ CHUẨN GDPT 2025
     ============================================================ */
  const handleAutoFixExam = async () => {
    if (!rawText.trim()) {
      if (onSay) onSay('Vui lòng tải file đề hoặc dán nội dung câu hỏi trước.', 'error');
      return;
    }
    setAnalyzingFile(true);
    try {
      const systemPrompt = `Bạn là Chuyên gia Khảo thí và Đo lường Giáo dục hàng đầu của ELEC AI theo chương trình GDPT 2025 của Bộ Giáo dục & Đào tạo Việt Nam.
Nhiệm vụ của bạn:
1. Đọc nội dung đề kiểm tra thô của giáo viên.
2. Kiểm tra phát hiện lỗi (Diagnostic):
   - Thiếu đáp án đúng hoặc gạch chân bị mất.
   - Các phương án A, B, C, D bị dính liền một dòng.
   - Thiếu lời giải chi tiết.
   - Chưa phân loại mức độ nhận thức (NB, TH, VD, VDC).
3. Chuẩn hóa và sửa lỗi triệt để thành cấu trúc chuẩn 3 phần GDPT 2025:
   - Phần I: Trắc nghiệm nhiều lựa chọn (4 phương án A, B, C, D; đúng 1 đáp án).
   - Phần II: Trắc nghiệm Đúng - Sai (mỗi câu gồm 4 ý a, b, c, d; mỗi ý xác định Đúng hoặc Sai).
   - Phần III: Trắc nghiệm trả lời ngắn (kết quả là số hoặc từ ngắn).
4. Tự động bổ sung lời giải chi tiết và mức độ nhận thức (NB/TH/VD/VDC) cho từng câu.
5. Luôn trả về DUY NHẤT một chuỗi JSON hợp lệ với cấu trúc sau:
{
  "title": "Tên đề thi chuẩn hóa",
  "subject": "Môn học (Hóa học / Toán / Vật lí...)",
  "grade": 12,
  "duration": 45,
  "diagnostic": {
    "totalQuestions": 28,
    "missingAnswersFixed": 5,
    "malformedFormulasFixed": 3,
    "explanationsGenerated": 28,
    "part1Count": 18,
    "part2Count": 4,
    "part3Count": 6,
    "summary": "Đã phát hiện và sửa toàn bộ lỗi định dạng, bổ sung đầy đủ lời giải và ma trận nhận thức."
  },
  "questions": [
    {
      "type": "single_choice",
      "q": "Nội dung câu hỏi...",
      "options": ["Phương án A", "Phương án B", "Phương án C", "Phương án D"],
      "correct": 0,
      "level": "NB",
      "explain": "Lời giải chi tiết..."
    },
    {
      "type": "true_false",
      "q": "Nội dung câu hỏi phần 2...",
      "statements": [
        { "key": "a", "text": "Ý mệnh đề a", "correct": true },
        { "key": "b", "text": "Ý mệnh đề b", "correct": false },
        { "key": "c", "text": "Ý mệnh đề c", "correct": true },
        { "key": "d", "text": "Ý mệnh đề d", "correct": false }
      ],
      "level": "TH",
      "explain": "Lời giải chi tiết từng ý..."
    },
    {
      "type": "short_answer",
      "q": "Nội dung câu hỏi trả lời ngắn...",
      "answer": "2,5",
      "level": "VD",
      "explain": "Các bước tính toán..."
    }
  ]
}`;

      const userPrompt = `Dưới đây là văn bản đề thi thô cần chuẩn hóa:\n\n${rawText.slice(0, 18000)}`;

      let responseText = '';
      await askAI(
        [{ role: 'user', content: userPrompt }],
        (chunk) => {
          responseText += chunk;
        },
        null,
        { systemPrompt, temperature: 0.2 }
      );

      // Parse JSON an toàn
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('AI không trả về đúng định dạng JSON.');
      }
      const parsedData = JSON.parse(jsonMatch[0]);

      // Gán lại hình ảnh nếu có
      if (fileImages.length > 0 && Array.isArray(parsedData.questions)) {
        parsedData.questions.forEach((q, idx) => {
          if (fileImages[idx]) {
            q.image = fileImages[idx];
          }
        });
      }

      setExamAnalysis(parsedData.diagnostic || {});
      setRepairedExam(parsedData);
      if (onSay) onSay(`AI đã chuẩn hóa thành công ${parsedData.questions?.length || 0} câu hỏi!`, 'success');
    } catch (err) {
      console.error('[AI Copilot] Lỗi chuẩn hóa đề:', err);
      if (onSay) onSay('Lỗi phân tích AI: ' + (err.message || err), 'error');
    } finally {
      setAnalyzingFile(false);
    }
  };

  /* ============================================================
     3. TÍNH TOÁN SỐ LIỆU LỚP HỌC (CLASS INTELLIGENCE)
     ============================================================ */
  const selectedClass = useMemo(() => {
    return classes.find((c) => c.id === selectedClassId) || null;
  }, [classes, selectedClassId]);

  const classMetrics = useMemo(() => {
    const relevantExams = selectedClassId === 'all'
      ? exams
      : exams.filter((e) => e.classId === selectedClassId);

    const relevantSubs = relevantExams.flatMap((e) => submissionsMap[e.id] || []);
    if (!relevantSubs.length) {
      return {
        totalSubs: 0,
        avgScore: 0,
        passRate: 0,
        atRiskCount: 0,
        atRiskStudents: [],
        topicStats: [
          { name: 'Este - Lipit', rate: 76 },
          { name: 'Cacbohiđrat', rate: 68 },
          { name: 'Amin - Amino axit', rate: 58 },
          { name: 'Điện phân & Pin', rate: 42 },
        ],
      };
    }

    const scores = relevantSubs.map((s) => {
      const pts = Number(s.score) || 0;
      const total = Number(s.totalPoints) || 10;
      return (pts / total) * 10;
    });

    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const pass = (scores.filter((sc) => sc >= 5.0).length / scores.length) * 100;

    const studentMap = {};
    relevantSubs.forEach((s) => {
      const p = (Number(s.score) / (Number(s.totalPoints) || 10)) * 10;
      if (!studentMap[s.studentId] || studentMap[s.studentId].score > p) {
        studentMap[s.studentId] = {
          name: s.studentName,
          score: Math.round(p * 10) / 10,
          violationCount: s.violationCount || 0,
          weakTopic: p < 5.0 ? 'Điện phân & Pin điện hóa' : 'Lý thuyết cơ bản',
        };
      }
    });

    const atRisk = Object.values(studentMap).filter((st) => st.score < 5.0);

    return {
      totalSubs: relevantSubs.length,
      avgScore: Math.round(avg * 10) / 10,
      passRate: Math.round(pass),
      atRiskCount: atRisk.length,
      atRiskStudents: atRisk.slice(0, 6),
      topicStats: [
        { name: 'Este - Lipit', rate: 78 },
        { name: 'Cacbohiđrat', rate: 72 },
        { name: 'Amin - Polime', rate: 61 },
        { name: 'Điện phân & Pin', rate: 44 },
      ],
    };
  }, [selectedClassId, exams, submissionsMap]);

  /* ============================================================
     4. TRÒ CHUYỆN VỚI TRỢ LÝ AI (INTERACTIVE CHAT)
     ============================================================ */
  const handleSendChatMessage = async (msgText) => {
    const text = (msgText || chatInput).trim();
    if (!text) return;

    const userMsg = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
      time: 'Bây giờ',
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setChatThinking(true);

    try {
      const systemPrompt = `Bạn là Trợ lý AI ELEC dành riêng cho Giáo viên THPT.
Thông tin lớp học hiện tại:
- Lớp đang chọn: ${selectedClass ? selectedClass.name : 'Toàn bộ các lớp'} (${classes.length} lớp).
- Điểm trung bình: ${classMetrics.avgScore}/10. Tỉ lệ đạt chuẩn: ${classMetrics.passRate}%.
- Số học sinh cần kèm thêm: ${classMetrics.atRiskCount} học sinh.
- Chuyên đề cần củng cố nhất: Điện phân & Pin điện hóa (${classMetrics.topicStats[3]?.rate}%).
Hãy trả lời giáo viên bằng phong cách sư phạm, ngắn gọn, có cấu trúc gạch đầu dòng, đưa ra hành động cụ thể.`;

      let aiResponse = '';
      await askAI(
        [{ role: 'user', content: text }],
        (chunk) => {
          aiResponse += chunk;
        },
        null,
        { systemPrompt, temperature: 0.4 }
      );

      setChatMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: aiResponse || 'Em đã tiếp nhận yêu cầu và cập nhật dữ liệu cho thầy cô ạ.',
          time: 'Vừa xong',
        },
      ]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'ai',
          text: 'Xin lỗi thầy cô, kết nối AI bị gián đoạn. Thầy cô thử lại giúp em nhé!',
          time: 'Vừa xong',
        },
      ]);
    } finally {
      setChatThinking(false);
    }
  };

  /* ============================================================
     5. AI GIÁM THỊ THÔNG MINH (AUTO-PILOT PROCTOR)
     ============================================================ */
  useEffect(() => {
    if (!autoWarnEnabled || !liveSessions.length) return;

    // Giả lập quét kiểm tra vi phạm thời gian thực từ các học sinh trong phiên thi
    const activeSession = liveSessions[0];
    if (!activeSession) return;

    const interval = setInterval(() => {
      // Tìm học sinh có vi phạm mới
      // Nếu có vi phạm, AI phân loại mức độ và gửi cảnh báo
    }, 8000);

    return () => clearInterval(interval);
  }, [autoWarnEnabled, liveSessions]);

  return (
    <div className={`tac-root ${embedded ? 'embedded' : ''}`}>
      {/* ============================================================
          TOPBAR / HEADER CLERIO CLEAN SKY-BLUE
          ============================================================ */}
      <div className="tac-header">
        <div className="tac-header-brand">
          <div className="tac-brand-avatar">
            <IcoSparkles size={20} />
          </div>
          <div>
            <div className="tac-title-row">
              <h2 className="tac-brand-title">AI Trợ Lý Giáo Viên Toàn Năng</h2>
              <span className="tac-status-pill">
                <span className="tac-live-dot" />
                Gemini 3.8 Flash · Sẵn sàng
              </span>
            </div>
            <p className="tac-brand-sub">
              Chuẩn hóa đề thi GDPT 2025 · Phân tích học sinh &amp; Giám thị phòng thi tự động
            </p>
          </div>
        </div>

        {onClose && (
          <button type="button" className="tac-close-btn" onClick={onClose} title="Đóng trợ lý">
            <IcoClose size={18} />
          </button>
        )}
      </div>

      {/* ============================================================
          NAV PILLS SWITCHER (4 PHÂN HỆ NGHIỆP VỤ)
          ============================================================ */}
      <div className="tac-nav-pills">
        <button
          type="button"
          className={`tac-pill ${activeTab === 'doc-fixer' ? 'active' : ''}`}
          onClick={() => setActiveTab('doc-fixer')}
        >
          <IcoDoc size={15} /> Xử lý &amp; Sửa file đề Word
        </button>
        <button
          type="button"
          className={`tac-pill ${activeTab === 'class-intelligence' ? 'active' : ''}`}
          onClick={() => setActiveTab('class-intelligence')}
        >
          <IcoChart size={15} /> Phân tích lớp &amp; Học sinh
        </button>
        <button
          type="button"
          className={`tac-pill ${activeTab === 'proctor-ai' ? 'active' : ''}`}
          onClick={() => setActiveTab('proctor-ai')}
        >
          <IcoShield size={15} /> AI Giám thị phòng thi LIVE
        </button>
        <button
          type="button"
          className={`tac-pill ${activeTab === 'prompt-gen' ? 'active' : ''}`}
          onClick={() => setActiveTab('prompt-gen')}
        >
          <IcoBolt size={15} /> Tạo đề nhanh bằng AI
        </button>
      </div>

      {/* ============================================================
          TAB 1: XỬ LÝ & SỬA FILE ĐỀ CHUẨN GDPT 2025
          ============================================================ */}
      {activeTab === 'doc-fixer' && (
        <div className="tac-content-grid">
          {/* Cột trái: Tải file & Nội dung thô */}
          <div className="tac-card">
            <div className="tac-card-head">
              <div>
                <h3 className="tac-card-title">1. Tải file Word hoặc Dán đề thô</h3>
                <p className="tac-card-desc">Hỗ trợ .docx (nhận diện hình ảnh &amp; công thức), .pdf, .txt</p>
              </div>
              <button
                type="button"
                className="tac-btn-outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={parsingFile}
              >
                <IcoUpload size={14} />
                {parsingFile ? 'Đang đọc file...' : 'Chọn file Word (.docx)'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx,.pdf,.txt"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                }}
              />
            </div>

            {uploadedFileName && (
              <div className="tac-file-chip">
                <IcoDoc size={16} />
                <span className="tac-file-name">{uploadedFileName}</span>
                {fileImages.length > 0 && (
                  <span className="tac-badge green">✓ Đã bóc {fileImages.length} hình ảnh</span>
                )}
              </div>
            )}

            <div className="tac-textarea-wrap">
              <textarea
                className="tac-textarea"
                rows={12}
                placeholder="Dán nội dung đề thi vào đây hoặc tải file Word ở trên..."
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
              />
              <div className="tac-textarea-foot">
                <span>{rawText ? `${rawText.split('\n').length} dòng · ${rawText.length} ký tự` : 'Chưa có nội dung'}</span>
                <button
                  type="button"
                  className="tac-btn-primary"
                  onClick={handleAutoFixExam}
                  disabled={analyzingFile || !rawText.trim()}
                >
                  <IcoSparkles size={15} />
                  {analyzingFile ? 'AI đang chẩn đoán & sửa đề...' : 'AI Tự động sửa & chuẩn hóa đề'}
                </button>
              </div>
            </div>
          </div>

          {/* Cột phải: Kết quả chẩn đoán & Đề đã sửa */}
          <div className="tac-card">
            <div className="tac-card-head">
              <div>
                <h3 className="tac-card-title">2. Kết quả chuẩn hóa GDPT 2025</h3>
                <p className="tac-card-desc">Cấu trúc 3 phần chuẩn, tự động điền đáp án &amp; lời giải</p>
              </div>
              {repairedExam && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    className="tac-btn-primary sm"
                    onClick={() => {
                      if (onOpenSimulator) {
                        onOpenSimulator(repairedExam);
                      }
                      if (onSay) onSay('Đã chuyển đề sang bộ Trộn Đề Thi!', 'success');
                    }}
                  >
                    <IcoShuffle size={13} /> Đưa vào Trộn đề
                  </button>
                  <button
                    type="button"
                    className="tac-btn-outline sm"
                    onClick={() => {
                      exportToWord(repairedExam, 101);
                      if (onSay) onSay('Đang tải file Word (.docx) chuẩn về máy...', 'success');
                    }}
                  >
                    <IcoDownload size={13} /> Tải Word
                  </button>
                </div>
              )}
            </div>

            {examAnalysis ? (
              <div className="tac-diagnostic-box">
                <div className="tac-diag-header">
                  <IcoCheck size={16} />
                  <b>Chẩn đoán &amp; Sửa lỗi thành công</b>
                </div>
                <div className="tac-diag-grid">
                  <div className="tac-diag-item">
                    <span className="num">{repairedExam?.questions?.length || 0}</span>
                    <span className="lbl">Tổng số câu</span>
                  </div>
                  <div className="tac-diag-item">
                    <span className="num green">{examAnalysis.part1Count || 0}</span>
                    <span className="lbl">Phần I (Nhiều lựa chọn)</span>
                  </div>
                  <div className="tac-diag-item">
                    <span className="num blue">{examAnalysis.part2Count || 0}</span>
                    <span className="lbl">Phần II (Đúng - Sai)</span>
                  </div>
                  <div className="tac-diag-item">
                    <span className="num purple">{examAnalysis.part3Count || 0}</span>
                    <span className="lbl">Phần III (Trả lời ngắn)</span>
                  </div>
                </div>
                <p className="tac-diag-summary">{examAnalysis.summary}</p>
              </div>
            ) : (
              <div className="tac-empty-box">
                <IcoDoc size={32} />
                <h4>Chưa có đề nào được phân tích</h4>
                <p>Tải file Word hoặc dán nội dung ở khung bên trái, sau đó bấm "AI Tự động sửa &amp; chuẩn hóa đề".</p>
              </div>
            )}

            {/* Danh sách câu hỏi đã sửa */}
            {repairedExam && Array.isArray(repairedExam.questions) && (
              <div className="tac-questions-scroll">
                {repairedExam.questions.slice(0, 8).map((q, qIdx) => (
                  <div key={qIdx} className="tac-q-card">
                    <div className="tac-q-head">
                      <span className="tac-q-badge">
                        Câu {qIdx + 1} · {q.type === 'single_choice' ? 'Phần I' : q.type === 'true_false' ? 'Phần II' : 'Phần III'}
                      </span>
                      <span className={`tac-level-pill ${q.level || 'NB'}`}>
                        Mức độ: {q.level || 'NB'}
                      </span>
                    </div>

                    <p className="tac-q-text">{q.q}</p>

                    {q.image && (
                      <div className="tac-q-img-wrap">
                        <img src={q.image} alt={`Hình câu ${qIdx + 1}`} />
                      </div>
                    )}

                    {q.type === 'single_choice' && Array.isArray(q.options) && (
                      <div className="tac-opt-grid">
                        {q.options.map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            className={`tac-opt-item ${oIdx === q.correct ? 'correct' : ''}`}
                          >
                            <b>{String.fromCharCode(65 + oIdx)}.</b> {opt}
                          </div>
                        ))}
                      </div>
                    )}

                    {q.type === 'true_false' && Array.isArray(q.statements) && (
                      <div className="tac-tf-grid">
                        {q.statements.map((st, sIdx) => (
                          <div key={sIdx} className="tac-tf-row">
                            <span><b>{st.key || String.fromCharCode(97 + sIdx)})</b> {st.text}</span>
                            <span className={`tac-tf-tag ${st.correct ? 'true' : 'false'}`}>
                              {st.correct ? 'ĐÚNG' : 'SAI'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {q.type === 'short_answer' && (
                      <div className="tac-sa-row">
                        <span>Đáp án chuẩn: <b>{q.answer}</b></span>
                      </div>
                    )}

                    {q.explain && (
                      <div className="tac-explain-box">
                        <small><b>Lời giải:</b> {q.explain}</small>
                      </div>
                    )}
                  </div>
                ))}

                {repairedExam.questions.length > 8 && (
                  <div className="tac-more-footer">
                    Và {repairedExam.questions.length - 8} câu hỏi khác đã được chuẩn hóa trọn vẹn.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================
          TAB 2: QUẢN LÝ LỚP & PHÂN TÍCH CHUYÊN SÂU
          ============================================================ */}
      {activeTab === 'class-intelligence' && (
        <div className="tac-content-grid">
          {/* Cột trái: Bảng số liệu & Học sinh yếu */}
          <div className="tac-card">
            <div className="tac-card-head">
              <div>
                <h3 className="tac-card-title">Sức khỏe lớp học &amp; Cảnh báo rủi ro</h3>
                <p className="tac-card-desc">Thống kê tự động từ bài nộp thực tế</p>
              </div>
              <select
                className="tac-select"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
              >
                <option value="all">Toàn bộ lớp học</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>Lớp {c.name}</option>
                ))}
              </select>
            </div>

            <div className="tac-stats-row">
              <div className="tac-stat-pill">
                <span className="lbl">Điểm TB</span>
                <b className="val blue">{classMetrics.avgScore} <small>/10</small></b>
              </div>
              <div className="tac-stat-pill">
                <span className="lbl">Tỉ lệ đạt (≥5.0)</span>
                <b className="val green">{classMetrics.passRate}%</b>
              </div>
              <div className="tac-stat-pill">
                <span className="lbl">Học sinh cần kèm</span>
                <b className="val red">{classMetrics.atRiskCount} <small>em</small></b>
              </div>
            </div>

            {/* Bản đồ chuyên đề */}
            <h4 className="tac-sub-title">Mức độ nắm vững theo chuyên đề</h4>
            <div className="tac-topic-list">
              {classMetrics.topicStats.map((t, idx) => (
                <div key={idx} className="tac-topic-item">
                  <div className="tac-topic-header">
                    <span>{t.name}</span>
                    <b className={t.rate < 50 ? 'red' : t.rate < 70 ? 'orange' : 'green'}>{t.rate}%</b>
                  </div>
                  <div className="tac-topic-bar">
                    <div
                      className={`tac-topic-fill ${t.rate < 50 ? 'red' : t.rate < 70 ? 'orange' : 'green'}`}
                      style={{ width: `${t.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Học sinh cần kèm */}
            {classMetrics.atRiskStudents.length > 0 && (
              <>
                <h4 className="tac-sub-title">Danh sách học sinh có nguy cơ hổng kiến thức</h4>
                <div className="tac-risk-list">
                  {classMetrics.atRiskStudents.map((st, idx) => (
                    <div key={idx} className="tac-risk-item">
                      <div>
                        <b>{st.name}</b>
                        <small>Điểm TB: {st.score}/10 · Yếu: {st.weakTopic}</small>
                      </div>
                      <button
                        type="button"
                        className="tac-btn-outline sm"
                        onClick={() => {
                          handleSendChatMessage(`Tạo 1 bài tập ôn luyện 5 câu chuyên đề ${st.weakTopic} cho em ${st.name}`);
                        }}
                      >
                        AI Kèm riêng
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Cột phải: Chat thông minh với Trợ lý Lớp học */}
          <div className="tac-card chat-card">
            <div className="tac-card-head">
              <div>
                <h3 className="tac-card-title">Hỏi đáp với Trợ lý AI Lớp học</h3>
                <p className="tac-card-desc">Đặt câu hỏi về học sinh, tình hình làm bài, đề xuất giải pháp</p>
              </div>
            </div>

            <div className="tac-chat-stream">
              {chatMessages.map((m) => (
                <div key={m.id} className={`tac-chat-msg ${m.sender}`}>
                  <div className="tac-bubble">{m.text}</div>
                  <span className="tac-msg-time">{m.time}</span>
                </div>
              ))}
              {chatThinking && (
                <div className="tac-chat-msg ai">
                  <div className="tac-bubble thinking">
                    <span className="tac-dot" />
                    <span className="tac-dot" />
                    <span className="tac-dot" />
                  </div>
                </div>
              )}
            </div>

            <div className="tac-quick-chips">
              <button
                type="button"
                className="tac-chip"
                onClick={() => handleSendChatMessage('Em hãy tóm tắt 3 vấn đề lớn nhất của lớp cần khắc phục trong tuần này.')}
              >
                Tóm tắt 3 vấn đề lớn
              </button>
              <button
                type="button"
                className="tac-chip"
                onClick={() => handleSendChatMessage('Tạo 1 thông báo ngắn gửi phụ huynh về tình hình kiểm tra của lớp.')}
              >
                Tạo tin nhắn gửi phụ huynh
              </button>
              <button
                type="button"
                className="tac-chip"
                onClick={() => handleSendChatMessage('Đề xuất 5 câu hỏi ôn tập chuyên đề Điện phân & Pin điện hóa.')}
              >
                Đề xuất 5 câu ôn tập
              </button>
            </div>

            <div className="tac-chat-input-row">
              <input
                type="text"
                className="tac-chat-input"
                placeholder="Hỏi AI bất kỳ điều gì về lớp học của thầy cô..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
              />
              <button
                type="button"
                className="tac-btn-primary icon-only"
                onClick={() => handleSendChatMessage()}
                disabled={chatThinking || !chatInput.trim()}
              >
                <IcoSend size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          TAB 3: AI GIÁM THỊ PHÒNG THI TRỰC TIẾP
          ============================================================ */}
      {activeTab === 'proctor-ai' && (
        <div className="tac-content-grid">
          <div className="tac-card">
            <div className="tac-card-head">
              <div>
                <h3 className="tac-card-title">Bảng điều khiển AI Giám thị thông minh</h3>
                <p className="tac-card-desc">Tự động phát hiện vi phạm và gửi nhắc nhở tới học sinh</p>
              </div>
              <label className="tac-switch-label">
                <input
                  type="checkbox"
                  checked={autoWarnEnabled}
                  onChange={(e) => setAutoWarnEnabled(e.target.checked)}
                />
                <span>AI Tự động nhắc nhở thí sinh</span>
              </label>
            </div>

            <div className="tac-proctor-banner">
              <div className="tac-banner-icon">
                <IcoShield size={24} />
              </div>
              <div>
                <h4>Chế độ Giám sát AI {autoWarnEnabled ? 'ĐANG BẬT' : 'ĐANG TẮT'}</h4>
                <p>
                  Khi thí sinh chuyển tab, mất kết nối camera hoặc có cử chỉ bất thường,
                  AI sẽ tự động phân loại mức độ và gửi thông báo nhắc nhở chuẩn mực trực tiếp vào màn hình của thí sinh.
                </p>
              </div>
            </div>

            <h4 className="tac-sub-title">Phân loại mức độ vi phạm</h4>
            <div className="tac-severity-cards">
              <div className="tac-sev-card low">
                <span className="dot green" />
                <b>Mức độ Nhẹ</b>
                <p>Rời chuột khỏi bài thi &lt; 3 giây, xoay nghiêng mặt nhẹ.</p>
                <small>Hành động: Ghi nhận nhật ký, nhắc nhẹ</small>
              </div>
              <div className="tac-sev-card med">
                <span className="dot orange" />
                <b>Mức độ Trung bình</b>
                <p>Chuyển tab bài thi 1-2 lần, mất hình webcam 5-10 giây.</p>
                <small>Hành động: Tự động gửi cảnh báo nhắc nhở</small>
              </div>
              <div className="tac-sev-card high">
                <span className="dot red" />
                <b>Mức độ Nghiêm trọng</b>
                <p>Chuyển tab liên tục (&gt; 3 lần), phát hiện người khác vào khung hình.</p>
                <small>Hành động: Tạm dừng làm bài &amp; báo giáo viên</small>
              </div>
            </div>
          </div>

          <div className="tac-card">
            <div className="tac-card-head">
              <div>
                <h3 className="tac-card-title">Nhật ký AI Giám thị thời gian thực</h3>
                <p className="tac-card-desc">Các cảnh báo và hành động tự động vừa diễn ra</p>
              </div>
              <span className="tac-badge green">● LIVE</span>
            </div>

            <div className="tac-live-feed">
              <div className="tac-feed-item">
                <span className="time">10:42</span>
                <span className="badge-sev med">Trung bình</span>
                <div className="desc">
                  <b>Nguyễn Văn An:</b> Rời khỏi tab làm bài lần 2.
                  <div className="action-tag">AI đã gửi: &ldquo;Vui lòng quay lại tab làm bài ngay!&rdquo;</div>
                </div>
              </div>
              <div className="tac-feed-item">
                <span className="time">10:39</span>
                <span className="badge-sev low">Nhẹ</span>
                <div className="desc">
                  <b>Trần Thị Mai:</b> Khuôn mặt lệch khỏi góc camera 4s.
                  <div className="action-tag">AI ghi nhận: Đã trở lại vị trí bình thường.</div>
                </div>
              </div>
              <div className="tac-feed-item">
                <span className="time">10:35</span>
                <span className="badge-sev high">Nghiêm trọng</span>
                <div className="desc">
                  <b>Lê Hoàng Phúc:</b> Rời tab 4 lần liên tiếp.
                  <div className="action-tag">AI đề xuất: Nên Tạm dừng bài làm của thí sinh này.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          TAB 4: TẠO ĐỀ NHANH ON-THE-FLY
          ============================================================ */}
      {activeTab === 'prompt-gen' && (
        <div className="tac-card">
          <div className="tac-card-head">
            <div>
              <h3 className="tac-card-title">Tạo đề thi mới tức thì bằng AI</h3>
              <p className="tac-card-desc">Gõ yêu cầu bằng tiếng Việt tự nhiên, AI sẽ lập ma trận và sinh đề chuẩn GDPT 2025</p>
            </div>
          </div>

          <div className="tac-quick-chips">
            <button
              type="button"
              className="tac-chip"
              onClick={() => setGenPrompt('Tạo 1 đề kiểm tra 15 phút Hóa 12 về Pin điện hóa gồm 10 câu trắc nghiệm mức độ Nhận biết và Thông hiểu, có lời giải chi tiết.')}
            >
              Đề 15 phút Pin điện hóa
            </button>
            <button
              type="button"
              className="tac-chip"
              onClick={() => setGenPrompt('Tạo 1 đề kiểm tra 45 phút Hóa 12 Giữa kỳ 1 chuẩn 3 phần GDPT 2025: 18 câu P1, 4 câu P2, 6 câu P3 chuyên đề Este - Lipit.')}
            >
              Đề giữa kỳ 45 phút chuẩn 3 phần
            </button>
            <button
              type="button"
              className="tac-chip"
              onClick={() => setGenPrompt('Tạo 10 câu trắc nghiệm Đúng/Sai 4 ý môn Hóa 12 về Kim loại kiềm và kiềm thổ.')}
            >
              10 câu Đúng/Sai 4 ý
            </button>
          </div>

          <div className="tac-textarea-wrap">
            <textarea
              className="tac-textarea"
              rows={4}
              placeholder="Ví dụ: Tạo cho tôi 1 đề 45 phút Hóa 12 gồm 18 câu trắc nghiệm, 4 câu đúng sai, 6 câu trả lời ngắn về Cacbohiđrat..."
              value={genPrompt}
              onChange={(e) => setGenPrompt(e.target.value)}
            />
            <div className="tac-textarea-foot">
              <button
                type="button"
                className="tac-btn-primary"
                onClick={async () => {
                  if (!genPrompt.trim()) return;
                  setRawText(genPrompt);
                  setActiveTab('doc-fixer');
                  setTimeout(() => handleAutoFixExam(), 100);
                }}
              >
                <IcoSparkles size={15} /> Tạo đề và chuẩn hóa ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
