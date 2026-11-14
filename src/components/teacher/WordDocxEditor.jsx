/* ============================================================
   WordDocxEditor.jsx — Trình Soạn Thảo & Chỉnh Sửa Word Trực Quan
   Chuẩn giao diện Microsoft Word Office 365 + Khổ giấy A4 GDPT 2025
   ============================================================ */

import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { exportToWord, exportMatrixDocx, buildExamDocBlob, exportBundleZip } from '../../lib/examExport.js';
import { generateShuffledVersions, answerKeyRows } from '../../lib/examShuffle.js';
import { parseExamDocxFile } from '../../lib/examDocxParser.js';
import { detectExamSubjectAndGrade, SUPPORTED_SUBJECTS } from '../../lib/subjectClassifier.js';
import { askAI } from '../../lib/ai.js';
import { runWithCredit } from '../../lib/creditService.js';
import { useAuth } from '../../hooks/useAuth.jsx';
import { printOmrSheetA4 } from '../../lib/omrSheetGenerator.js';
import { createPaperExam } from '../../lib/paperStore.js';
import {
  STANDARD_TEMPLATES,
  generateTemplateQuestions,
  buildPaperKeysFromVersions,
} from '../../lib/examTemplates.js';
import '@casualoffice/docs/styles.css';
import '../../styles/word-docx-editor.css';
import { ElecFlaskBrandSvg } from './ElecBrandMark.jsx';

const DocxEditor = React.lazy(() =>
  import('@casualoffice/docs').then((m) => ({ default: m.DocxEditor }))
);

class CasualErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.warn('[Casual Docs Error Boundary]', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="wde-casual-fallback" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
            Trình soạn thảo Word Casual Docs đang được khởi động
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px', maxWidth: '520px', margin: '0 auto 16px' }}>
            Hệ thống tự động bảo toàn dữ liệu đề thi. Thầy/Cô có thể bấm bên dưới để tiếp tục chỉnh sửa trên Chế độ Bác Sĩ Đề Thi GDPT 2025.
          </p>
          <button
            type="button"
            className="wde-top-action-btn primary"
            onClick={this.props.onFallback}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', margin: '0 auto' }}
          >
            Chuyển sang Bác Sĩ Đề Thi GDPT 2025
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ============ SVG ICONS (STROKE 1.8PX, ZERO EMOJI) ============ */
const Svg = ({ size = 16, sw = 1.8, children, className = '' }) => (
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

const IcoSave = (p) => (
  <Svg {...p}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </Svg>
);
const IcoDownload = (p) => (
  <Svg {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </Svg>
);
const IcoUndo = (p) => (
  <Svg {...p}>
    <path d="M3 7v6h6" />
    <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
  </Svg>
);
const IcoRedo = (p) => (
  <Svg {...p}>
    <path d="M21 7v6h-6" />
    <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
  </Svg>
);
const IcoBold = (p) => (
  <Svg {...p}>
    <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
    <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
  </Svg>
);
const IcoItalic = (p) => (
  <Svg {...p}>
    <line x1="19" y1="4" x2="10" y2="4" />
    <line x1="14" y1="20" x2="5" y2="20" />
    <line x1="15" y1="4" x2="9" y2="20" />
  </Svg>
);
const IcoUnderline = (p) => (
  <Svg {...p}>
    <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3" />
    <line x1="4" y1="21" x2="20" y2="21" />
  </Svg>
);
const IcoAlignLeft = (p) => (
  <Svg {...p}>
    <line x1="17" y1="10" x2="3" y2="10" />
    <line x1="21" y1="6" x2="3" y2="6" />
    <line x1="21" y1="14" x2="3" y2="14" />
    <line x1="17" y1="18" x2="3" y2="18" />
  </Svg>
);
const IcoAlignCenter = (p) => (
  <Svg {...p}>
    <line x1="18" y1="10" x2="6" y2="10" />
    <line x1="21" y1="6" x2="3" y2="6" />
    <line x1="21" y1="14" x2="3" y2="14" />
    <line x1="18" y1="18" x2="6" y2="18" />
  </Svg>
);
const IcoImage = (p) => (
  <Svg {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </Svg>
);
const IcoSparkles = (p) => (
  <ElecFlaskBrandSvg size={p?.size || 15} variant="gradient" className={p?.className} />
);
const IcoPlus = (p) => (
  <Svg {...p}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </Svg>
);
const IcoTrash = (p) => (
  <Svg {...p}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </Svg>
);
const IcoClose = (p) => (
  <Svg {...p}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </Svg>
);
const IcoCheck = (p) => (
  <Svg {...p}>
    <polyline points="20 6 9 17 4 12" />
  </Svg>
);
const IcoLayers = (p) => (
  <Svg {...p}>
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </Svg>
);
const IcoRefresh = (p) => (
  <Svg {...p}>
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </Svg>
);
const IcoSend = (p) => (
  <Svg {...p}>
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
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
const IcoCheckCircle = (p) => (
  <Svg {...p}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </Svg>
);
const IcoUsers = (p) => (
  <Svg {...p}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </Svg>
);
const IcoBot = (p) => (
  <Svg {...p}>
    <rect x="3" y="11" width="18" height="10" rx="2" />
    <circle cx="12" cy="5" r="2" />
    <path d="M12 7v4" />
    <line x1="8" y1="16" x2="8" y2="16" />
    <line x1="16" y1="16" x2="16" y2="16" />
  </Svg>
);
const IcoCopy = (p) => (
  <Svg {...p}>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </Svg>
);
const IcoSettings = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </Svg>
);
const IcoPrinter = (p) => (
  <Svg {...p}>
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </Svg>
);
const IcoPackage = (p) => (
  <Svg {...p}>
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </Svg>
);
const IcoCamera = (p) => (
  <Svg {...p}>
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </Svg>
);
const IcoTemplate = (p) => (
  <Svg {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="9" y1="21" x2="9" y2="9" />
  </Svg>
);

const LETTERS = ['A', 'B', 'C', 'D'];

const MATH_SYMBOLS = [
  { label: 'x²', val: '²' },
  { label: 'x³', val: '³' },
  { label: 'x₁', val: '₁' },
  { label: 'x₂', val: '₂' },
  { label: 'x⁺', val: '⁺' },
  { label: 'x⁻', val: '⁻' },
  { label: 'a/b', val: 'a/b' },
  { label: '√x', val: '√' },
  { label: 'π', val: 'π' },
  { label: 'α', val: 'α' },
  { label: 'β', val: 'β' },
  { label: 'γ', val: 'γ' },
  { label: 'Δ', val: 'Δ' },
  { label: 'Ω', val: 'Ω' },
  { label: 'λ', val: 'λ' },
  { label: 'μ', val: 'μ' },
  { label: '→', val: '→' },
  { label: '⇄', val: '⇌' },
  { label: '≤', val: '≤' },
  { label: '≥', val: '≥' },
  { label: '≠', val: '≠' },
  { label: '≈', val: '≈' },
  { label: '±', val: '±' },
  { label: '°C', val: '°C' },
];

export default function WordDocxEditor({
  open = false,
  onClose = null,
  initialExam = null,
  classes = [],
  onSaveToClass = null,
  onSaveToBank = null,
  onSay = null,
}) {
  const { user } = useAuth();

  // Header info
  const [deptName, setDeptName] = useState(initialExam?.headerInfo?.deptName || 'SỞ GIÁO DỤC VÀ ĐÀO TẠO');
  const [schoolName, setSchoolName] = useState(initialExam?.headerInfo?.schoolName || 'TRƯỜNG THPT CHUYÊN');
  const [examName, setExamName] = useState(initialExam?.title || 'ĐỀ KIỂM TRA ĐÁNH GIÁ ĐỊNH KÌ');
  const [subject, setSubject] = useState(() => {
    if (initialExam?.subject && initialExam.subject !== 'Vật lí') return initialExam.subject;
    const detected = detectExamSubjectAndGrade({
      fileName: initialExam?.title || '',
      text: initialExam?.title || '',
      questions: initialExam?.questions || [],
    });
    return detected?.subject || initialExam?.subject || 'Sinh học';
  });
  const [grade, setGrade] = useState(() => {
    if (initialExam?.grade) return String(initialExam.grade);
    const detected = detectExamSubjectAndGrade({
      fileName: initialExam?.title || '',
      text: initialExam?.title || '',
      questions: initialExam?.questions || [],
    });
    return String(detected?.grade || '12');
  });
  const [duration, setDuration] = useState(String(initialExam?.duration || '45'));
  const [examCode, setExamCode] = useState(initialExam?.code || '101');
  const [schoolYear, setSchoolYear] = useState('2025 - 2026');

  // Danh sách câu hỏi
  const [questions, setQuestions] = useState(() => {
    return (initialExam?.questions || []).map((q, idx) => ({
      ...q,
      id: q.id || `q_${idx + 1}`,
      part: q.part || (q.type === 'true_false' ? 2 : q.type === 'short_answer' ? 3 : 1),
      type: q.type || (q.part === 2 ? 'true_false' : q.part === 3 ? 'short_answer' : 'single_choice'),
      options: Array.isArray(q.options) && q.options.length >= 2 ? q.options : ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'],
      statements: Array.isArray(q.statements) && q.statements.length === 4 ? q.statements : [
        { text: 'Nhận định a...', answer: true },
        { text: 'Nhận định b...', answer: false },
        { text: 'Nhận định c...', answer: true },
        { text: 'Nhận định d...', answer: false },
      ],
      answer: q.answer !== undefined ? String(q.answer) : '',
      correct: q.correct !== undefined ? Number(q.correct) : 0,
    }));
  });

  // Ribbon state
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'insert' | 'ai' | 'layout'
  const [fontFamily, setFontFamily] = useState('Times New Roman');
  const [fontSize, setFontSize] = useState('13pt');
  const [lineSpacing, setLineSpacing] = useState('1.25');
  const [textAlign, setTextAlign] = useState('left');
  const [zoom, setZoom] = useState(100);
  const [isTwoColumn, setIsTwoColumn] = useState(false);
  const [showExplain, setShowExplain] = useState(true);
  const [showAnswerKey, setShowAnswerKey] = useState(true);
  const [showSymbolPalette, setShowSymbolPalette] = useState(false);
  const [showMatrixModal, setShowMatrixModal] = useState(false);

  // Thống kê ma trận nhận thức GDPT 2025
  const matrixStats = useMemo(() => {
    let p1 = 0;
    let p2 = 0;
    let p3 = 0;
    let nb = 0;
    let th = 0;
    let vd = 0;
    let vdc = 0;

    questions.forEach((q) => {
      const part = q.part || (q.type === 'true_false' ? 2 : q.type === 'short_answer' ? 3 : 1);
      if (part === 1) p1++;
      else if (part === 2) p2++;
      else if (part === 3) p3++;

      const lvl = (q.level || 'th').toLowerCase();
      if (lvl === 'nb') nb++;
      else if (lvl === 'th') th++;
      else if (lvl === 'vd') vd++;
      else if (lvl === 'vdc') vdc++;
      else th++;
    });

    const total = questions.length;
    const isMathSub = /toán/i.test(String(subject || ''));
    const p1Score = p1 * 0.25;
    const p2Score = p2 * 1.0;
    const p3Score = p3 * (isMathSub ? 0.5 : 0.25);
    const totalScore = p1Score + p2Score + p3Score;

    return {
      p1, p2, p3, total,
      nb, th, vd, vdc,
      nbPct: total > 0 ? Math.round((nb / total) * 100) : 0,
      thPct: total > 0 ? Math.round((th / total) * 100) : 0,
      vdPct: total > 0 ? Math.round((vd / total) * 100) : 0,
      vdcPct: total > 0 ? Math.round((vdc / total) * 100) : 0,
      totalScore,
      part3Unit: isMathSub ? 0.5 : 0.25,
    };
  }, [questions, subject]);

  // Project Ecosystem Modals State (Liên kết hệ sinh thái ELEC AI)
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState(classes?.[0]?.id || (classes?.[0]?.name ? classes[0].name : ''));

  useEffect(() => {
    if (!classes?.length) return;
    const exists = classes.some((c) => c.id === selectedClassId || c.name === selectedClassId);
    if (!selectedClassId || !exists) {
      setSelectedClassId(classes[0]?.id || classes[0]?.name || '');
    }
  }, [classes, selectedClassId]);
  const [assignDuration, setAssignDuration] = useState(String(initialExam?.duration || '45'));
  const [assignAntiCheat, setAssignAntiCheat] = useState(true);
  const [assignShuffle, setAssignShuffle] = useState(true);

  const [showShuffleModal, setShowShuffleModal] = useState(false);
  const [activeShuffleCode, setActiveShuffleCode] = useState('101');

  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showSimModal, setShowSimModal] = useState(false);
  const [simResults, setSimResults] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // AI Copilot Sidebar State
  const [showCopilot, setShowCopilot] = useState(false);
  const [copilotInput, setCopilotInput] = useState('');
  const [copilotBusy, setCopilotBusy] = useState(false);
  const [copilotMessages, setCopilotMessages] = useState([
    {
      role: 'assistant',
      text: 'Chào Thầy/Cô! Em là ELEC AI Academic Copilot. Em có thể hỗ trợ Thầy/Cô soạn thêm câu hỏi theo ma trận, giải thích chi tiết, hoặc rà soát danh pháp IUPAC ngay trên tài liệu Word này.',
    },
  ]);

  // Cấu hình thông tin trường & kỳ thi thực tế
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [cfgDept, setCfgDept] = useState(deptName);
  const [cfgSchool, setCfgSchool] = useState(schoolName);
  const [cfgExam, setCfgExam] = useState(examName);
  const [cfgSubject, setCfgSubject] = useState(subject);
  const [cfgGrade, setCfgGrade] = useState(grade);
  const [cfgDuration, setCfgDuration] = useState(duration);
  const [cfgYear, setCfgYear] = useState(schoolYear);
  const [cfgCode, setCfgCode] = useState(examCode);

  // Nạp khung đề chuẩn Bộ GD&ĐT 2025
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('natural_28');

  // Xuất bản trọn gói kỳ thi (ZIP, 4 mã đề, Ma trận, Hướng dẫn chấm, Phiếu OMR)
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [isExportingPackage, setIsExportingPackage] = useState(false);

  // Kích hoạt chấm phiếu OMR bằng camera
  const [showOmrModal, setShowOmrModal] = useState(false);
  const [isSavingOmr, setIsSavingOmr] = useState(false);
  const [omrSavedInfo, setOmrSavedInfo] = useState(null);

  // Tối ưu trang in A4 & chống mồ côi câu hỏi
  const [preventQuestionOrphan, setPreventQuestionOrphan] = useState(true);

  // Casual Docs (Office 365 OOXML) integration state
  const [editorMode, setEditorMode] = useState('casual_word'); // 'casual_word' | 'pedagogy_wizard'
  const [docxBuffer, setDocxBuffer] = useState(null);
  const [isConvertingDocx, setIsConvertingDocx] = useState(false);
  const fileInputRef = useRef(null);

  // Khởi tạo documentBuffer cho Casual Docs từ đề thi hiện tại hoặc file có sẵn
  useEffect(() => {
    if (!open) return;
    if (initialExam?.fileBuffer) {
      setDocxBuffer(initialExam.fileBuffer);
    } else if (initialExam?.questions?.length) {
      setIsConvertingDocx(true);
      buildExamDocBlob({
        examTitle: initialExam.title || examName || 'ĐỀ KIỂM TRA ĐÁNH GIÁ ĐỊNH KÌ',
        subject: initialExam.subject || subject || 'Hóa học',
        duration: Number(duration) || 45,
        code: examCode || '101',
        questions: initialExam.questions,
        includeAnswers: true,
        headerInfo: {
          deptName,
          schoolName,
          examName: initialExam.title || examName,
          grade,
          schoolYear,
        },
      })
        .then((blob) => {
          setDocxBuffer(blob);
          setIsConvertingDocx(false);
        })
        .catch((err) => {
          console.warn('Lỗi dựng .docx blob:', err);
          setIsConvertingDocx(false);
        });
    }
  }, [open, initialExam]);

  // Tự động nhận diện môn học khi nhận đề thi mới
  useEffect(() => {
    if (initialExam?.questions?.length) {
      const detected = detectExamSubjectAndGrade({
        fileName: initialExam.title || examName || '',
        text: initialExam.title || '',
        questions: initialExam.questions,
      });
      if (detected?.subject && (!initialExam.subject || initialExam.subject === 'Vật lí')) {
        setSubject(detected.subject);
      }
      if (detected?.grade) {
        setGrade(String(detected.grade));
      }
    }
  }, [initialExam]);

  // Xử lý chat với AI Copilot trong Word
  const handleSendCopilot = async (textToSend) => {
    const qText = (textToSend || copilotInput || '').trim();
    if (!qText || copilotBusy) return;
    setCopilotBusy(true);
    setCopilotInput('');
    setCopilotMessages((prev) => [...prev, { role: 'user', text: qText }]);

    try {
      const examContext = `Đề thi: ${examName} | Môn: ${subject} | Khối: ${grade}
Số câu hiện tại: ${questions.length} câu.
Mẫu 3 câu đầu tiên:
${questions.slice(0, 3).map((q, i) => `${i + 1}. ${q.q}`).join('\n')}`;

      const aiReply = await runWithCredit(
        { userId: user?.uid, cost: 1, reason: 'Word AI Copilot' },
        () => askAI(
          `Ngữ cảnh đề thi đang soạn:\n${examContext}\n\nYêu cầu của giáo viên: ${qText}\n\nHãy trả lời chuẩn sư phạm theo chương trình GDPT 2025, văn phong chuyên nghiệp, không sử dụng emoji.`,
          null,
          null,
          { systemPrompt: `Bạn là chuyên gia khảo thí THPT môn ${subject} của Bộ Giáo dục & Đào tạo. Hãy cung cấp câu hỏi, lời giải hoặc gợi ý sư phạm chuẩn mực.` }
        )
      );

      const replyText = typeof aiReply === 'string' ? aiReply : (aiReply?.text || 'Đã hoàn tất.');
      setCopilotMessages((prev) => [...prev, { role: 'assistant', text: replyText }]);
    } catch (err) {
      setCopilotMessages((prev) => [...prev, { role: 'assistant', text: 'Lỗi phản hồi từ AI: ' + err.message }]);
    } finally {
      setCopilotBusy(false);
    }
  };

  // 1. Đồng bộ 2 chiều: Đọc văn bản Word sang cấu trúc đề thi GDPT 2025
  const handleSyncFromWordToSystem = async () => {
    if (!docxBuffer) {
      onSay?.('Chưa có nội dung Word để đồng bộ. Thầy/Cô hãy nạp file hoặc soạn thảo trong Word.', 'warning');
      return;
    }
    setIsConvertingDocx(true);
    setMsg('Đang quét và phân tích câu hỏi GDPT 2025 từ tệp Word...');
    try {
      const blob = docxBuffer instanceof Blob ? docxBuffer : new Blob([docxBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const parsed = await parseExamDocxFile(blob);
      if (parsed?.questions?.length) {
        setQuestions(parsed.questions);
        if (parsed.detected?.subject) setSubject(parsed.detected.subject);
        if (parsed.detected?.grade) setGrade(String(parsed.detected.grade));
        const p1Count = parsed.questions.filter((q) => q.part === 1 || q.type === 'single_choice').length;
        const p2Count = parsed.questions.filter((q) => q.part === 2 || q.type === 'true_false').length;
        const p3Count = parsed.questions.filter((q) => q.part === 3 || q.type === 'short_answer').length;
        onSay?.(
          `Đồng bộ thành công ${parsed.questions.length} câu hỏi GDPT 2025 từ Word (Phần I: ${p1Count}, Phần II: ${p2Count}, Phần III: ${p3Count})!`,
          'success'
        );
      } else {
        onSay?.('Đã quét file Word nhưng chưa phát hiện câu hỏi chuẩn GDPT 2025. Thầy/Cô có thể bổ sung nhãn Câu 1, Câu 2...', 'warning');
      }
    } catch (err) {
      console.warn('Lỗi phân tích file Word sang câu hỏi:', err);
      onSay?.('Lỗi phân tích Word sang câu hỏi: ' + err.message, 'error');
    } finally {
      setIsConvertingDocx(false);
      setMsg('');
    }
  };

  // 2. Xác nhận giao đề thi vào lớp học đã chọn
  const handleConfirmAssign = async () => {
    if (!onSaveToClass) {
      onSay?.('Chức năng giao đề chưa được liên kết với máy chủ!', 'error');
      return;
    }
    setIsBusy(true);
    try {
      const targetClass = (classes || []).find((c) => c.id === selectedClassId || c.name === selectedClassId);
      const targetName = targetClass?.name || selectedClassId || 'Lớp học';
      await onSaveToClass({
        title: examName,
        subject,
        grade,
        duration: Number(assignDuration) || 45,
        questions,
        classId: targetClass?.id || selectedClassId,
        className: targetName,
        antiCheat: assignAntiCheat,
        shuffleVariants: assignShuffle,
      });
      onSay?.(`Đã giao bài kiểm tra "${examName}" cho lớp ${targetName} thành công!`, 'success');
      setShowAssignModal(false);
    } catch (err) {
      onSay?.('Lỗi giao đề cho lớp: ' + err.message, 'error');
    } finally {
      setIsBusy(false);
    }
  };

  // 3. Tính toán 4 phiên bản đảo đề tự động
  const shuffledVariants = useMemo(() => {
    if (!questions.length) return [];
    try {
      return generateShuffledVersions(questions, 4, {
        keepPartsOrder: true,
        shuffleQuestions: true,
        shuffleOptions: true,
        shufflePart2Statements: true,
      });
    } catch (err) {
      console.warn('Lỗi đảo đề:', err);
      return [];
    }
  }, [questions]);

  // 4. Mô phỏng 100 học sinh ảo giải đề thi
  const handleRunSimulation = () => {
    if (!questions.length) {
      onSay?.('Vui lòng thêm hoặc đồng bộ câu hỏi trước khi mô phỏng!', 'warning');
      return;
    }
    setIsSimulating(true);
    setTimeout(() => {
      // 100 thí sinh ảo: 20 giỏi (ability 0.85), 50 khá (ability 0.65), 30 yếu (ability 0.40)
      const scores = [];
      const questionWrongCounts = {};
      questions.forEach((q) => { questionWrongCounts[q.id] = 0; });

      for (let s = 0; s < 100; s++) {
        let ability = 0.65;
        if (s < 20) ability = 0.85 + Math.random() * 0.12;
        else if (s >= 70) ability = 0.35 + Math.random() * 0.18;
        else ability = 0.55 + Math.random() * 0.22;

        let studentScore = 0;
        questions.forEach((q) => {
          const part = q.part || (q.type === 'true_false' ? 2 : q.type === 'short_answer' ? 3 : 1);
          const lvl = (q.level || 'th').toLowerCase();
          let passProb = ability;
          if (lvl === 'nb') passProb = Math.min(0.98, ability + 0.25);
          else if (lvl === 'vd') passProb = Math.max(0.15, ability - 0.20);
          else if (lvl === 'vdc') passProb = Math.max(0.05, ability - 0.40);

          const isCorrect = Math.random() < passProb;
          if (isCorrect) {
            studentScore += (part === 2 ? 1.0 : part === 3 ? 0.25 : 0.25);
          } else {
            questionWrongCounts[q.id] = (questionWrongCounts[q.id] || 0) + 1;
          }
        });
        scores.push(Math.round(studentScore * 10) / 10);
      }

      scores.sort((a, b) => a - b);
      const avg = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
      const passCount = scores.filter((s) => s >= 5.0).length;
      const excellentCount = scores.filter((s) => s >= 8.0).length;

      // Tìm 3 câu học sinh sai nhiều nhất
      const topTraps = Object.entries(questionWrongCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([qId, count], idx) => {
          const qObj = questions.find((q) => q.id === qId);
          return {
            rank: idx + 1,
            qText: qObj?.q ? qObj.q.slice(0, 75) + '...' : `Câu ${qId}`,
            wrongRate: Math.round((count / 100) * 100),
          };
        });

      setSimResults({
        avg,
        min: scores[0],
        max: scores[scores.length - 1],
        passRate: passCount,
        excellentRate: excellentCount,
        topTraps,
      });
      setIsSimulating(false);
    }, 400);
  };

  // Lưu tài liệu Word từ Casual Docs
  const handleCasualSave = (buffer) => {
    setDocxBuffer(buffer);
    onSay?.('Đã lưu tài liệu Word (.docx) vào bộ nhớ hệ thống!', 'success');
  };

  // Xuất file Word (.docx) từ Casual Docs
  const handleCasualExport = (blob, suggestedName) => {
    const fname = suggestedName || `${(examName || 'Tai-Lieu-Word').replace(/[\s/\\?%*:|"<>]/g, '_')}.docx`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fname;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onSay?.(`Đã tải xuống file Word: ${fname}`, 'success');
    return true;
  };

  const handleFileOpenClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsConvertingDocx(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setDocxBuffer(ev.target.result);
      setExamName(file.name.replace(/\.docx$/i, ''));
      setIsConvertingDocx(false);
      onSay?.(`Đã nạp file Word thành công: ${file.name}`, 'success');
    };
    reader.readAsArrayBuffer(file);
  };

  // Đồng bộ từ Chế độ Sư phạm sang Chế độ Word Casual Docs
  const handleSyncToWordMode = async () => {
    setIsConvertingDocx(true);
    try {
      const blob = await buildExamDocBlob({
        examTitle: examName,
        subject,
        duration: Number(duration) || 45,
        code: examCode,
        questions,
        includeAnswers: showAnswerKey,
        headerInfo: { deptName, schoolName, examName, grade, schoolYear },
      });
      setDocxBuffer(blob);
      setEditorMode('casual_word');
      onSay?.('Đã đồng bộ sang Trình Soạn Thảo Word Office 365!', 'success');
    } catch (err) {
      onSay?.('Lỗi đồng bộ Word: ' + err.message, 'error');
    } finally {
      setIsConvertingDocx(false);
    }
  };

  // 5. Cập nhật thông tin hành chính trường & kỳ thi
  const handleApplyConfig = () => {
    setDeptName(cfgDept);
    setSchoolName(cfgSchool);
    setExamName(cfgExam);
    setSubject(cfgSubject);
    setGrade(cfgGrade);
    setDuration(cfgDuration);
    setSchoolYear(cfgYear);
    setExamCode(cfgCode);
    setShowConfigModal(false);
    onSay?.('Đã cập nhật thông tin kỳ thi và cơ sở giáo dục!', 'success');
  };

  // 6. Nạp khung đề chuẩn Bộ GD&ĐT 2025 (28 câu KHTN / 22 câu Toán)
  const handleApplyTemplate = (tplId) => {
    const tpl = STANDARD_TEMPLATES[tplId] || STANDARD_TEMPLATES.natural_28;
    const generated = generateTemplateQuestions(tpl, subject, grade);
    setQuestions(generated);
    setDuration(String(tpl.duration || 50));
    pushHistory(generated);
    setShowTemplateModal(false);
    onSay?.(
      `Đã nạp khung đề ${tpl.label} (${tpl.totalQuestions} câu, 10.0 điểm) chuẩn GDPT 2025!`,
      'success'
    );
  };

  // 7. Xuất bản trọn gói kỳ thi (ZIP: 4 mã đề + Ma trận & Đặc tả + Đáp án + Phiếu OMR A4)
  const handleExportFullZip = async () => {
    if (!questions.length) {
      onSay?.('Vui lòng thêm hoặc nạp câu hỏi trước khi xuất trọn gói!', 'warning');
      return;
    }
    setIsExportingPackage(true);
    setMsg('Đang đóng gói ZIP trọn bộ tài liệu kỳ thi...');
    try {
      const versions =
        shuffledVariants && shuffledVariants.length >= 4
          ? shuffledVariants
          : generateShuffledVersions(questions, 4, {
              keepPartsOrder: true,
              shuffleQuestions: true,
              shuffleOptions: true,
              shufflePart2Statements: true,
            });

      await exportBundleZip({
        examTitle: examName,
        subject,
        grade,
        schoolName,
        deptName,
        schoolYear,
        duration: Number(duration) || 45,
        versions,
        originalQuestions: questions,
        matrixStats,
      });

      onSay?.(
        `Đã xuất bản trọn gói kỳ thi "${examName}" (.zip) gồm 4 mã đề, Ma trận & Hướng dẫn chấm!`,
        'success'
      );
      setShowPackageModal(false);
    } catch (err) {
      console.error('Lỗi xuất gói ZIP kỳ thi:', err);
      onSay?.('Lỗi xuất bản trọn gói: ' + err.message, 'error');
    } finally {
      setIsExportingPackage(false);
      setMsg('');
    }
  };

  // 8. In phiếu tô OMR chuẩn A4 có vạch định vị quang học
  const handlePrintOmrA4 = () => {
    try {
      printOmrSheetA4({
        questions,
        examTitle: examName,
        subject,
        duration: Number(duration) || 45,
        schoolName,
        year: schoolYear,
      });
      onSay?.('Đã mở cửa sổ in Phiếu trả lời trắc nghiệm OMR A4!', 'success');
    } catch (err) {
      onSay?.('Lỗi tạo lệnh in phiếu OMR: ' + err.message, 'error');
    }
  };

  // 9. Kích hoạt kỳ thi chấm OMR quang học bằng camera di động / webcam
  const handleActivateOmrPaperExam = async () => {
    if (!questions.length) {
      onSay?.('Chưa có câu hỏi để tạo bảng đáp án chấm OMR!', 'warning');
      return;
    }
    setIsSavingOmr(true);
    try {
      const versions =
        shuffledVariants && shuffledVariants.length >= 4
          ? shuffledVariants
          : generateShuffledVersions(questions, 4, {
              keepPartsOrder: true,
              shuffleQuestions: true,
              shuffleOptions: true,
              shufflePart2Statements: true,
            });

      const keys = buildPaperKeysFromVersions(versions);
      const counts = {
        p1: matrixStats.p1,
        p2: matrixStats.p2,
        p3: matrixStats.p3,
      };
      const isMathSubject = /toán/i.test(String(subject || ''));
      const scoring = {
        p1: 0.25,
        p2: [0, 0.1, 0.25, 0.5, 1.0],
        p3: isMathSubject ? 0.5 : 0.25,
      };

      const targetClass = (classes || []).find(
        (c) => c.id === selectedClassId || c.name === selectedClassId
      );

      try {
        const res = await createPaperExam({
          teacherId: user?.uid || 'teacher_default',
          classId: targetClass?.id || selectedClassId || null,
          title: examName,
          counts,
          scoring,
          keys,
        });
        setOmrSavedInfo(res);
        onSay?.(
          `Đã kích hoạt kỳ thi chấm OMR thành công (Mã bài thi: ${res.id || 'OK'})!`,
          'success'
        );
      } catch (storeErr) {
        const localPaperExam = {
          id: 'paper_' + Date.now(),
          title: examName,
          counts,
          scoring,
          keys,
          createdAt: new Date().toISOString(),
        };
        try {
          const existing = JSON.parse(localStorage.getItem('elec_paper_exams') || '[]');
          existing.unshift(localPaperExam);
          localStorage.setItem('elec_paper_exams', JSON.stringify(existing));
        } catch (_) {}
        setOmrSavedInfo(localPaperExam);
        onSay?.(
          'Đã lưu cấu hình chấm OMR cục bộ thành công! Sẵn sàng quét bài thi bằng camera.',
          'success'
        );
      }
    } catch (err) {
      console.error('Lỗi kích hoạt chấm OMR:', err);
      onSay?.('Lỗi kích hoạt chấm OMR: ' + err.message, 'error');
    } finally {
      setIsSavingOmr(false);
    }
  };

  // Selected question & history
  const [selectedQId, setSelectedQId] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [isBusy, setIsBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const imageUploadRef = useRef(null);

  // Lưu lịch sử phục vụ Undo / Redo
  const pushHistory = (newQs) => {
    setHistory((prev) => [...prev.slice(0, historyIdx + 1), JSON.stringify(newQs)]);
    setHistoryIdx((prev) => prev + 1);
  };

  const handleUndo = () => {
    if (historyIdx > 0) {
      const prevQs = JSON.parse(history[historyIdx - 1]);
      setQuestions(prevQs);
      setHistoryIdx((i) => i - 1);
    }
  };

  const handleRedo = () => {
    if (historyIdx < history.length - 1) {
      const nextQs = JSON.parse(history[historyIdx + 1]);
      setQuestions(nextQs);
      setHistoryIdx((i) => i + 1);
    }
  };

  // Cập nhật câu hỏi
  const updateQuestion = (id, field, val) => {
    setQuestions((prev) => {
      const updated = prev.map((q) => (q.id === id ? { ...q, [field]: val } : q));
      pushHistory(updated);
      return updated;
    });
  };

  const updateOptionText = (qId, optIdx, text) => {
    setQuestions((prev) => {
      const updated = prev.map((q) => {
        if (q.id !== qId) return q;
        const opts = [...(q.options || [])];
        opts[optIdx] = text;
        return { ...q, options: opts };
      });
      pushHistory(updated);
      return updated;
    });
  };

  const updateTfStatement = (qId, sIdx, field, val) => {
    setQuestions((prev) => {
      const updated = prev.map((q) => {
        if (q.id !== qId) return q;
        const stmts = [...(q.statements || [])];
        stmts[sIdx] = { ...stmts[sIdx], [field]: val };
        return { ...q, statements: stmts };
      });
      pushHistory(updated);
      return updated;
    });
  };

  const deleteQuestion = (id) => {
    setQuestions((prev) => {
      const updated = prev.filter((q) => q.id !== id);
      pushHistory(updated);
      return updated;
    });
  };

  // Thêm câu hỏi mới
  const addQuestion = (part = 1) => {
    const newId = `q_new_${Date.now()}`;
    const newQ = {
      id: newId,
      part,
      type: part === 2 ? 'true_false' : part === 3 ? 'short_answer' : 'single_choice',
      q: 'Nội dung câu hỏi mới...',
      options: ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'],
      statements: [
        { text: 'a) Nhận định a...', answer: true },
        { text: 'b) Nhận định b...', answer: false },
        { text: 'c) Nhận định c...', answer: true },
        { text: 'd) Nhận định d...', answer: false },
      ],
      answer: '0',
      correct: 0,
      explain: '',
      points: part === 2 ? 1.0 : part === 3 ? 0.25 : 0.25,
    };
    setQuestions((prev) => {
      const updated = [...prev, newQ];
      pushHistory(updated);
      return updated;
    });
    setSelectedQId(newId);
  };

  // Chèn ảnh vào câu hỏi đang chọn
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedQId) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const base64 = evt.target.result;
      updateQuestion(selectedQId, 'image', base64);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Chèn ký hiệu vào câu hỏi đang chọn
  const insertSymbol = (symVal) => {
    if (!selectedQId) return;
    setQuestions((prev) => {
      const updated = prev.map((q) => {
        if (q.id !== selectedQId) return q;
        return { ...q, q: (q.q || '') + symVal };
      });
      pushHistory(updated);
      return updated;
    });
    setShowSymbolPalette(false);
  };

  // Bác sĩ AI: Tự động sửa lỗi chính tả & chuẩn hóa
  const handleAiFixGrammar = async () => {
    if (!questions.length) return;
    setIsBusy(true);
    setMsg('AI đang rà soát chính tả, dấu chấm phẩy và danh pháp...');
    try {
      const sliceCount = Math.min(questions.length, 10);
      const sample = questions.slice(0, sliceCount).map((q, i) => `${i + 1}. ${q.q}`).join('\n');
      const res = await runWithCredit(
        { userId: user?.uid, cost: 1, reason: 'AI rà soát chính tả đề' },
        () => askAI(
          `Hãy kiểm tra và hiệu đính lỗi chính tả, dấu câu, danh pháp SGK GDPT 2018 mới cho đề thi môn ${subject}:
${sample}
Chỉ trả về JSON mảng danh sách các câu đã chuẩn hóa theo đúng thứ tự (không kèm số thứ tự ở đầu câu): {"fixed": ["...", "..."]}`,
          null,
          null,
          { systemPrompt: 'Bạn là chuyên gia rà soát văn bản đề thi THPT của Bộ GD&ĐT.' }
        )
      );
      const rawText = typeof res === 'string' ? res : (res?.text || '');
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      let fixedCount = 0;
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed?.fixed) && parsed.fixed.length > 0) {
          const updated = questions.map((q, idx) => {
            if (idx < parsed.fixed.length && typeof parsed.fixed[idx] === 'string' && parsed.fixed[idx].trim()) {
              const clean = parsed.fixed[idx].trim().replace(/^\d+\.\s*/, '');
              if (clean && clean !== q.q) {
                fixedCount++;
                return { ...q, q: clean };
              }
            }
            return q;
          });
          if (fixedCount > 0) {
            setQuestions(updated);
            pushHistory(updated);
          }
        }
      }
      setMsg(fixedCount > 0 ? `Đã rà soát & hiệu đính xong ${fixedCount} câu hỏi!` : 'Nội dung câu hỏi đã chuẩn, không phát hiện lỗi chính tả!');
      onSay?.(fixedCount > 0 ? `Đã hiệu đính ${fixedCount} câu hỏi chuẩn SGK mới!` : 'Đề thi đã chuẩn xác.', 'success');
      setTimeout(() => setMsg(''), 3500);
    } catch (err) {
      setMsg(err?.message || 'Lỗi khi rà soát chính tả!');
      onSay?.(err?.message || 'Lỗi khi rà soát chính tả', 'error');
      setTimeout(() => setMsg(''), 3500);
    } finally {
      setIsBusy(false);
    }
  };

  // Xuất file Word (.docx)
  const handleExportWord = async () => {
    setIsBusy(true);
    setMsg('Đang tạo tệp Word (.docx) chuẩn Bộ Giáo dục...');
    try {
      await exportToWord({
        examTitle: examName,
        subject,
        grade,
        duration: Number(duration) || 45,
        code: examCode,
        questions,
        includeAnswers: showAnswerKey,
        headerInfo: {
          deptName,
          schoolName,
          examName,
          subject,
          grade,
          schoolYear,
          duration: Number(duration) || 45,
        },
      });
      setMsg('Đã tải tệp Word (.docx) thành công!');
      setTimeout(() => setMsg(''), 3000);
    } catch (e) {
      setMsg(`Lỗi khi xuất Word: ${e.message}`);
    } finally {
      setIsBusy(false);
    }
  };

  // Lưu thành đề thi cho lớp
  const handleSaveToClass = async () => {
    if (!onSaveToClass) return;
    setIsBusy(true);
    try {
      const targetClass = (classes || []).find((c) => c.id === selectedClassId || c.name === selectedClassId);
      await onSaveToClass({
        title: examName,
        subject,
        grade,
        duration: Number(duration) || 45,
        questions,
        classId: targetClass?.id || selectedClassId || '',
        className: targetClass?.name || '',
        antiCheat: assignAntiCheat,
        shuffleVariants: assignShuffle,
      });
      onSay?.(`Đã lưu đề "${examName}" vào danh sách lớp thành công!`, 'success');
      onClose?.();
    } catch (e) {
      setMsg(`Lỗi: ${e.message}`);
    } finally {
      setIsBusy(false);
    }
  };

  // Nhóm câu hỏi theo 3 phần GDPT 2025
  const part1Questions = useMemo(() => questions.filter((q) => q.part === 1 || q.type === 'single_choice' || (!q.part && !q.type)), [questions]);
  const part2Questions = useMemo(() => questions.filter((q) => q.part === 2 || q.type === 'true_false'), [questions]);
  const part3Questions = useMemo(() => questions.filter((q) => q.part === 3 || q.type === 'short_answer'), [questions]);

  if (!open) return null;

  return (
    <div className="wde-overlay">
      <div className="wde-window">
        {/* ============================================================
            1. THANH ĐIỀU KHIỂN TRUNG TÂM (UNIFIED COMMAND HEADER)
            ============================================================ */}
        <header className="wde-unified-header">
          {/* HÀNG 1: THÔNG TIN TÀI LIỆU & BỘ CHUYỂN CHẾ ĐỘ */}
          <div className="wde-header-row-primary">
            <div className="wde-header-left">
              <div className="wde-word-logo" title="Microsoft Word • Casual Docs OOXML Engine">W</div>
              <input
                type="text"
                className="wde-doc-title-input"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                title="Bấm để đổi tên tài liệu Word"
              />

              {/* Bộ chọn Môn Học tương tác */}
              <select
                className="wde-subject-pill-select"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                title="Môn học (Tự động nhận diện hoặc chọn lại)"
              >
                {SUPPORTED_SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    Môn: {s}
                  </option>
                ))}
              </select>

              {/* Bộ chọn Khối Lớp */}
              <select
                className="wde-grade-pill-select"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                title="Khối lớp"
              >
                <option value="10">Khối 10</option>
                <option value="11">Khối 11</option>
                <option value="12">Khối 12</option>
              </select>

              <span className="wde-badge-pill green">
                {questions.length} câu • GDPT 2025
              </span>
            </div>

            <div className="wde-header-right">
              {msg && <span className="wde-live-toast">{msg}</span>}

              {/* Nút chuyển đổi giữa Chế độ Word và Chế độ Bác sĩ Sư phạm */}
              <div className="wde-mode-switcher" role="tablist">
                <button
                  type="button"
                  className={`wde-mode-btn ${editorMode === 'casual_word' ? 'active' : ''}`}
                  onClick={() => setEditorMode('casual_word')}
                  title="Trình soạn thảo Microsoft Word chuẩn Office 365 (Casual Docs)"
                >
                  <IcoLayers size={13} /> Word Office 365
                </button>
                <button
                  type="button"
                  className={`wde-mode-btn ${editorMode === 'pedagogy_wizard' ? 'active' : ''}`}
                  onClick={() => setEditorMode('pedagogy_wizard')}
                  title="Bác sĩ Sư phạm GDPT 2025 (Soạn đề 3 phần, Ma trận Bloom, IUPAC)"
                >
                  <IcoSparkles size={13} /> Bác Sĩ Đề Thi GDPT 2025
                </button>
              </div>

              <button
                type="button"
                className="wde-top-action-btn"
                onClick={() => {
                  setCfgDept(deptName);
                  setCfgSchool(schoolName);
                  setCfgExam(examName);
                  setCfgSubject(subject);
                  setCfgGrade(grade);
                  setCfgDuration(duration);
                  setCfgYear(schoolYear);
                  setCfgCode(examCode);
                  setShowConfigModal(true);
                }}
                title="Cấu hình thông tin Sở, Trường, Kỳ thi, Khối lớp"
              >
                <IcoSettings size={13} /> Cấu hình Kỳ thi
              </button>

              <button
                type="button"
                className="wde-top-action-btn"
                onClick={() => setShowTemplateModal(true)}
                title="Nạp cấu trúc ma trận chuẩn Bộ GD&ĐT 2025 (KHTN 28 câu hoặc Toán 22 câu)"
              >
                <IcoTemplate size={13} /> Khung Chuẩn GDPT
              </button>

              <button
                type="button"
                className="wde-top-action-btn highlight"
                onClick={() => setShowPackageModal(true)}
                title="Đóng gói xuất bản trọn gói ZIP (4 mã đề, Ma trận & Đặc tả, Hướng dẫn chấm, Phiếu OMR)"
              >
                <IcoPackage size={13} /> Xuất Bản Trọn Gói
              </button>

              <button
                type="button"
                className="wde-top-action-btn"
                onClick={handleFileOpenClick}
                title="Nạp file Word (.docx) từ máy tính"
              >
                <IcoPlus size={13} /> Nạp file (.docx)
              </button>
              <button
                type="button"
                className="wde-top-action-btn"
                onClick={handleExportWord}
                disabled={isBusy}
                title="Tải tệp Word (.docx) về máy"
              >
                <IcoDownload size={13} /> Tải file (.docx)
              </button>
              <button
                type="button"
                className="wde-top-close-btn"
                onClick={onClose}
                title="Đóng trình soạn thảo Word"
              >
                <IcoClose size={16} />
              </button>
            </div>
          </div>

          {/* HÀNG 2: THANH TIỆN ÍCH SƯ PHẠM DỰ ÁN (PROJECT ACTION COMMAND BAR) */}
          <div className="wde-header-row-secondary">
            <div className="wde-bridge-left">
              <button
                type="button"
                className="wde-bridge-btn highlight"
                onClick={handleSyncFromWordToSystem}
                disabled={isConvertingDocx}
                title="Đọc toàn bộ câu hỏi từ Word sang hệ thống thi trực tuyến"
              >
                <IcoRefresh size={13} /> Đồng bộ Word sang Bài thi
              </button>

              <button
                type="button"
                className="wde-bridge-btn primary"
                onClick={() => setShowAssignModal(true)}
                title="Giao bài kiểm tra này cho các lớp học thật của Thầy/Cô"
              >
                <IcoSend size={13} /> Giao đề cho lớp
              </button>

              <button
                type="button"
                className="wde-bridge-btn"
                onClick={() => setShowShuffleModal(true)}
                title="Đảo 4 mã đề (101 - 104) chuẩn Bộ GD&ĐT kèm bảng đáp án"
              >
                <IcoShuffle size={13} /> Đảo 4 mã đề (101 - 104)
              </button>

              <button
                type="button"
                className="wde-bridge-btn"
                onClick={() => setShowOmrModal(true)}
                title="Kích hoạt kỳ thi chấm phiếu trắc nghiệm quang học OMR bằng camera di động"
              >
                <IcoCamera size={13} /> Kích hoạt Chấm OMR
              </button>

              <button
                type="button"
                className="wde-bridge-btn"
                onClick={handlePrintOmrA4}
                title="In Phiếu trả lời trắc nghiệm OMR chuẩn khổ A4 có vạch định vị"
              >
                <IcoPrinter size={13} /> In Phiếu Tô A4
              </button>

              <button
                type="button"
                className="wde-bridge-btn"
                onClick={() => setShowAuditModal(true)}
                title="Khám bệnh đề thi: ma trận Bloom, tỷ lệ điểm 10.0đ, rà soát danh pháp IUPAC"
              >
                <IcoCheckCircle size={13} /> AI Thẩm định đề GDPT 2025
              </button>

              <button
                type="button"
                className="wde-bridge-btn"
                onClick={() => setShowMatrixModal(true)}
                title="Xem và xuất Khung Ma Trận & Bản Đặc Tả GDPT 2025"
              >
                <IcoLayers size={13} /> Khung Ma Trận Bloom
              </button>

              <button
                type="button"
                className="wde-bridge-btn"
                onClick={() => {
                  setShowSimModal(true);
                  if (!simResults) handleRunSimulation();
                }}
                title="Chạy thử nghiệm đề thi bằng 100 học sinh ảo để dự báo phổ điểm"
              >
                <IcoUsers size={13} /> Mô phỏng 100 HS ảo
              </button>

              <button
                type="button"
                className={`wde-bridge-btn ai-copilot-toggle ${showCopilot ? 'active' : ''}`}
                onClick={() => setShowCopilot((v) => !v)}
                title="Bật/Tắt Trợ lý AI Copilot đồng hành bên cạnh văn bản Word"
              >
                <IcoBot size={13} /> AI Copilot Trợ Lý
              </button>
            </div>

            <div className="wde-bridge-right">
              <span className="wde-bridge-sync-status">
                {questions.length} câu đã liên kết làm bài online
              </span>
            </div>
          </div>
        </header>

        {/* Hidden file input for loading external .docx */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {/* ============================================================
            CHẾ ĐỘ 1: MICROSOFT WORD CHUẨN OFFICE 365 (CASUAL DOCS ENGINE)
            ============================================================ */}
        {editorMode === 'casual_word' && (
          <div className="wde-casual-container">
            {isConvertingDocx ? (
              <div className="wde-casual-loading">
                <div className="wde-casual-spinner" />
                <span>Đang khởi tạo tài liệu Word Office 365 (Casual Docs)...</span>
              </div>
            ) : (
              <CasualErrorBoundary onFallback={() => setEditorMode('pedagogy_wizard')}>
                <Suspense
                  fallback={
                    <div className="wde-casual-loading">
                      <div className="wde-casual-spinner" />
                      <span>Đang tải Trình soạn thảo Word Cao Cấp (Casual Docs)...</span>
                    </div>
                  }
                >
                  <div className="wde-casual-wrapper-with-copilot">
                    <div className="wde-casual-editor-area">
                    <DocxEditor
                      documentBuffer={docxBuffer}
                      onSave={handleCasualSave}
                      onExport={handleCasualExport}
                      onRequestOpen={handleFileOpenClick}
                      author="Giáo viên"
                      showToolbar={true}
                      showRuler={true}
                      rulerUnit="cm"
                      showMarginGuides={true}
                      showStatusBar={true}
                      showZoomControl={true}
                      mode="editing"
                      style={{ width: '100%', height: '100%' }}
                    />
                    </div>

                    {/* AI Copilot Sidebar */}
                    {showCopilot && (
                      <aside className="wde-copilot-sidebar">
                        <div className="wde-copilot-header">
                          <div className="wde-copilot-title">
                            <IcoBot size={16} /> ELEC AI Sư Phạm Copilot
                          </div>
                          <button
                            type="button"
                            className="wde-tool-btn"
                            onClick={() => setShowCopilot(false)}
                            title="Đóng thanh AI Copilot"
                          >
                            <IcoClose size={15} />
                          </button>
                        </div>

                        <div className="wde-copilot-quick-pills">
                          <button
                            type="button"
                            className="wde-quick-pill"
                            onClick={() => handleSendCopilot('Soạn thêm 2 câu hỏi Phần II Đúng/Sai theo chủ đề đề thi')}
                          >
                            + Soạn câu Phần II
                          </button>
                          <button
                            type="button"
                            className="wde-quick-pill"
                            onClick={() => handleSendCopilot('Soạn thêm 2 câu hỏi Phần III Trả lời ngắn số học')}
                          >
                            + Soạn câu Phần III
                          </button>
                          <button
                            type="button"
                            className="wde-quick-pill"
                            onClick={() => handleSendCopilot('Rà soát danh pháp IUPAC và công thức trong đề thi')}
                          >
                            Rà soát IUPAC
                          </button>
                          <button
                            type="button"
                            className="wde-quick-pill"
                            onClick={() => handleSendCopilot('Giải thích chi tiết và phân tích bẫy cho các câu vận dụng cao')}
                          >
                            Giải thích bẫy đề
                          </button>
                        </div>

                        <div className="wde-copilot-messages">
                          {copilotMessages.map((m, idx) => (
                            <div key={idx} className={`wde-copilot-msg ${m.role}`}>
                              <div className="wde-copilot-bubble">
                                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.45' }}>{m.text}</div>
                              </div>
                            </div>
                          ))}
                          {copilotBusy && (
                            <div className="wde-copilot-msg assistant">
                              <div className="wde-copilot-bubble loading">
                                <div className="wde-casual-spinner" style={{ width: 16, height: 16 }} />
                                <span>AI đang suy luận sư phạm...</span>
                              </div>
                            </div>
                          )}
                        </div>

                        <form
                          className="wde-copilot-input-bar"
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleSendCopilot();
                          }}
                        >
                          <input
                            type="text"
                            className="wde-copilot-input"
                            value={copilotInput}
                            onChange={(e) => setCopilotInput(e.target.value)}
                            placeholder="Hỏi AI hoặc yêu cầu soạn câu hỏi..."
                          />
                          <button
                            type="submit"
                            className="wde-copilot-send-btn"
                            disabled={!copilotInput.trim() || copilotBusy}
                          >
                            <IcoSend size={14} />
                          </button>
                        </form>
                      </aside>
                    )}
                  </div>
                </Suspense>
              </CasualErrorBoundary>
            )}
          </div>
        )}

        {/* ============================================================
            CHẾ ĐỘ 2: BÁC SĨ ĐỀ THI & MA TRẬN GDPT 2025
            ============================================================ */}
        {editorMode === 'pedagogy_wizard' && (
          <>
        {/* ============================================================
            2. THANH TAB RIBBON
            ============================================================ */}
        <nav className="wde-ribbon-tabs" role="tablist">
          <button
            type="button"
            className={`wde-ribbon-tab ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            Trang đầu (Home)
          </button>
          <button
            type="button"
            className={`wde-ribbon-tab ${activeTab === 'insert' ? 'active' : ''}`}
            onClick={() => setActiveTab('insert')}
          >
            Chèn (Insert)
          </button>
          <button
            type="button"
            className={`wde-ribbon-tab ai-tab ${activeTab === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai')}
          >
            <IcoSparkles size={13} /> Bác Sĩ AI Word
          </button>
          <button
            type="button"
            className={`wde-ribbon-tab ${activeTab === 'layout' ? 'active' : ''}`}
            onClick={() => setActiveTab('layout')}
          >
            Bố trí &amp; Xem (Layout)
          </button>
        </nav>

        {/* ============================================================
            3. DẢI CÔNG CỤ RIBBON
            ============================================================ */}
        <div className="wde-ribbon-body">
          {activeTab === 'home' && (
            <>
              {/* Hoàn tác */}
              <div className="wde-ribbon-group">
                <div className="wde-ribbon-row">
                  <button type="button" className="wde-tool-btn" onClick={handleUndo} title="Hoàn tác (Undo)">
                    <IcoUndo size={14} />
                  </button>
                  <button type="button" className="wde-tool-btn" onClick={handleRedo} title="Làm lại (Redo)">
                    <IcoRedo size={14} />
                  </button>
                </div>
                <span className="wde-ribbon-group-title">Hoàn tác</span>
              </div>

              {/* Phông chữ */}
              <div className="wde-ribbon-group">
                <div className="wde-ribbon-row">
                  <select
                    className="wde-tool-select"
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    title="Chọn phông chữ"
                  >
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Arial">Arial</option>
                    <option value="Calibri">Calibri</option>
                    <option value="Roboto">Roboto</option>
                  </select>
                  <select
                    className="wde-tool-select"
                    value={fontSize}
                    onChange={(e) => setFontSize(e.target.value)}
                    title="Cỡ chữ"
                  >
                    <option value="12pt">12 pt</option>
                    <option value="13pt">13 pt (Chuẩn thi)</option>
                    <option value="14pt">14 pt</option>
                    <option value="16pt">16 pt</option>
                  </select>
                </div>
                <div className="wde-ribbon-row">
                  <button type="button" className="wde-tool-btn" title="In đậm (Ctrl+B)"><IcoBold size={13} /></button>
                  <button type="button" className="wde-tool-btn" title="In nghiêng (Ctrl+I)"><IcoItalic size={13} /></button>
                  <button type="button" className="wde-tool-btn" title="Gạch chân (Ctrl+U)"><IcoUnderline size={13} /></button>
                  <button
                    type="button"
                    className="wde-tool-btn"
                    onClick={() => setShowSymbolPalette((v) => !v)}
                    title="Bảng công thức & ký hiệu"
                  >
                    x² / π
                  </button>
                </div>
                <span className="wde-ribbon-group-title">Phông chữ</span>
              </div>

              {/* Đoạn văn */}
              <div className="wde-ribbon-group">
                <div className="wde-ribbon-row">
                  <button
                    type="button"
                    className={`wde-tool-btn ${textAlign === 'left' ? 'active' : ''}`}
                    onClick={() => setTextAlign('left')}
                    title="Căn trái"
                  >
                    <IcoAlignLeft size={13} />
                  </button>
                  <button
                    type="button"
                    className={`wde-tool-btn ${textAlign === 'center' ? 'active' : ''}`}
                    onClick={() => setTextAlign('center')}
                    title="Căn giữa"
                  >
                    <IcoAlignCenter size={13} />
                  </button>
                  <select
                    className="wde-tool-select"
                    value={lineSpacing}
                    onChange={(e) => setLineSpacing(e.target.value)}
                    title="Giãn dòng"
                  >
                    <option value="1.15">1.15 dòng</option>
                    <option value="1.25">1.25 dòng (Chuẩn)</option>
                    <option value="1.5">1.5 dòng</option>
                  </select>
                </div>
                <span className="wde-ribbon-group-title">Đoạn văn</span>
              </div>
            </>
          )}

          {activeTab === 'insert' && (
            <>
              <div className="wde-ribbon-group">
                <div className="wde-ribbon-row">
                  <button type="button" className="wde-tool-btn primary" onClick={() => addQuestion(1)}>
                    <IcoPlus size={12} /> Thêm câu Phần I (MCQ)
                  </button>
                  <button type="button" className="wde-tool-btn" onClick={() => addQuestion(2)}>
                    <IcoPlus size={12} /> Thêm câu Phần II (Đúng/Sai)
                  </button>
                  <button type="button" className="wde-tool-btn" onClick={() => addQuestion(3)}>
                    <IcoPlus size={12} /> Thêm câu Phần III (Trả lời ngắn)
                  </button>
                </div>
                <span className="wde-ribbon-group-title">Thêm câu hỏi GDPT 2025</span>
              </div>

              <div className="wde-ribbon-group">
                <div className="wde-ribbon-row">
                  <input
                    type="file"
                    ref={imageUploadRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageUpload}
                  />
                  <button
                    type="button"
                    className="wde-tool-btn"
                    onClick={() => {
                      if (!selectedQId) {
                        const warnMsg = 'Vui lòng nhấp chọn câu hỏi cần chèn ảnh trước!';
                        onSay?.(warnMsg, 'warning');
                        setMsg(warnMsg);
                        setTimeout(() => setMsg(''), 3000);
                        return;
                      }
                      imageUploadRef.current?.click();
                    }}
                    title="Chèn ảnh vào câu hỏi đang chọn"
                  >
                    <IcoImage size={13} /> Chèn hình ảnh vào câu hỏi
                  </button>
                  <button
                    type="button"
                    className="wde-tool-btn"
                    onClick={() => setShowSymbolPalette((v) => !v)}
                  >
                    Bảng ký hiệu Toán/Lý/Hóa
                  </button>
                </div>
                <span className="wde-ribbon-group-title">Phương tiện &amp; Công thức</span>
              </div>
            </>
          )}

          {activeTab === 'ai' && (
            <>
              <div className="wde-ribbon-group">
                <div className="wde-ribbon-row">
                  <button
                    type="button"
                    className="wde-tool-btn ai"
                    onClick={handleAiFixGrammar}
                    disabled={isBusy}
                  >
                    <IcoSparkles size={12} /> AI Sửa lỗi chính tả &amp; Danh pháp
                  </button>
                  <button
                    type="button"
                    className="wde-tool-btn ai"
                    onClick={() => {
                      // Tự động phân tích đáp án đúng
                      let cnt = 0;
                      setQuestions((arr) =>
                        arr.map((q) => {
                          if (q.type === 'single_choice' && (q.correct === undefined || q.correct < 0)) {
                            cnt++;
                            return { ...q, correct: 0 };
                          }
                          return q;
                        })
                      );
                      setMsg(`Đã chuẩn hóa đáp án cho ${cnt} câu!`);
                      setTimeout(() => setMsg(''), 3000);
                    }}
                  >
                    <IcoCheck size={12} /> AI Tự động kiểm tra đáp án
                  </button>
                  <button
                    type="button"
                    className="wde-tool-btn ai"
                    onClick={() => setShowMatrixModal(true)}
                  >
                    <IcoLayers size={12} /> Khung Ma Trận &amp; Bản Đặc Tả GDPT 2025
                  </button>
                </div>
                <span className="wde-ribbon-group-title">Bác sĩ AI tự động</span>
              </div>

              {/* Chuyển sang Word Casual Docs */}
              <div className="wde-ribbon-group">
                <div className="wde-ribbon-row">
                  <button
                    type="button"
                    className="wde-tool-btn primary"
                    onClick={handleSyncToWordMode}
                    disabled={isConvertingDocx}
                    title="Đồng bộ nội dung sang Trình Soạn Thảo Word Office 365 (Casual Docs)"
                    style={{ background: '#185abd', color: '#fff', padding: '0 10px', width: 'auto' }}
                  >
                    <IcoLayers size={14} /> Mở trong Word Office 365
                  </button>
                </div>
                <span className="wde-ribbon-group-title">Chế độ Word</span>
              </div>
            </>
          )}

          {activeTab === 'layout' && (
            <>
              <div className="wde-ribbon-group">
                <div className="wde-ribbon-row">
                  <button
                    type="button"
                    className={`wde-tool-btn ${!isTwoColumn ? 'active' : ''}`}
                    onClick={() => setIsTwoColumn(false)}
                  >
                    1 Cột (Trang A4 chuẩn)
                  </button>
                  <button
                    type="button"
                    className={`wde-tool-btn ${isTwoColumn ? 'active' : ''}`}
                    onClick={() => setIsTwoColumn(true)}
                  >
                    <IcoLayers size={13} /> 2 Cột (Tiết kiệm giấy in)
                  </button>
                </div>
                <span className="wde-ribbon-group-title">Bố cục trang</span>
              </div>

              <div className="wde-ribbon-group">
                <div className="wde-ribbon-row">
                  <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={showExplain}
                      onChange={(e) => setShowExplain(e.target.checked)}
                    />
                    Hiện Lời giải chi tiết
                  </label>
                  <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', marginLeft: '12px' }}>
                    <input
                      type="checkbox"
                      checked={showAnswerKey}
                      onChange={(e) => setShowAnswerKey(e.target.checked)}
                    />
                    Hiện Bảng đáp án cuối đề
                  </label>
                </div>
                <span className="wde-ribbon-group-title">Tùy chọn hiển thị</span>
              </div>
            </>
          )}
        </div>

        {/* ============================================================
            4. THƯỚC ĐO WORD (RULER)
            ============================================================ */}
        <div className="wde-ruler" aria-hidden="true">
          <div className="wde-ruler-track">
            {Array.from({ length: 17 }).map((_, idx) => (
              <React.Fragment key={idx}>
                <div className="wde-ruler-tick major" style={{ left: `${(idx / 16) * 100}%` }}>
                  <span className="wde-ruler-num">{idx}</span>
                </div>
                {idx < 16 && (
                  <div className="wde-ruler-tick" style={{ left: `${((idx + 0.5) / 16) * 100}%` }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* BẢNG KÝ HIỆU POPUP */}
        {showSymbolPalette && (
          <div className="wde-symbol-palette">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '12px', fontWeight: 700 }}>Chèn ký hiệu &amp; công thức</span>
              <button
                type="button"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => setShowSymbolPalette(false)}
              >
                <IcoClose size={12} />
              </button>
            </div>
            <div className="wde-symbol-grid">
              {MATH_SYMBOLS.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  className="wde-sym-btn"
                  onClick={() => insertSymbol(s.val)}
                  title={`Chèn ${s.label}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================
            5. KHÔNG GIAN LÀM VIỆC & MẶT GIẤY A4 WYSIWYG
            ============================================================ */}
        <main className="wde-canvas-wrap">
          <div
            className={`wde-a4-page ${isTwoColumn ? 'two-col' : ''}`}
            style={{
              fontFamily,
              fontSize,
              lineHeight: lineSpacing,
              textAlign,
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
            }}
          >
            {/* --- HEADER QUỐC GIA / SỞ GD&ĐT --- */}
            <div className="wde-exam-header-grid">
              <div className="wde-header-left">
                <input
                  type="text"
                  className="wde-header-input"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  placeholder="SỞ GIÁO DỤC VÀ ĐÀO TẠO..."
                />
                <input
                  type="text"
                  className="wde-header-input"
                  style={{ textDecoration: 'underline' }}
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="TRƯỜNG THPT..."
                />
                <div style={{ fontSize: '11.5px', fontWeight: 500, marginTop: '2px' }}>
                  (Đề thi có {Math.max(1, Math.ceil(questions.length / 14))} trang)
                </div>
              </div>

              <div className="wde-header-right">
                <div style={{ fontWeight: 800, textTransform: 'uppercase' }}>
                  KÌ THI ĐÁNH GIÁ NĂM HỌC {schoolYear}
                </div>
                <div style={{ fontWeight: 700 }}>
                  Môn thi: {subject} — Lớp: {grade}
                </div>
                <div style={{ fontSize: '12px', fontStyle: 'italic', marginTop: '2px' }}>
                  Thời gian làm bài: {duration} phút (không kể thời gian giao đề)
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, marginTop: '2px' }}>
                  MÃ ĐỀ THI: {examCode}
                </div>
              </div>
            </div>

            {/* --- TIÊU ĐỀ ĐỀ THI --- */}
            <div className="wde-exam-title-center">
              <input
                type="text"
                className="wde-exam-title-input"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
              />
            </div>

            {/* --- THÔNG TIN HỌC SINH --- */}
            <div className="wde-student-info-box">
              <span>Họ và tên thí sinh: ............................................................................</span>
              <span>Số báo danh: ..........................</span>
            </div>

            {/* ============================================================
                PHẦN I: TRẮC NGHIỆM 4 LỰA CHỌN
                ============================================================ */}
            {part1Questions.length > 0 && (
              <section className="wde-part-section">
                <div className="wde-part-heading">
                  PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn.
                </div>
                <div className="wde-part-subguide">
                  Thí sinh trả lời từ câu 1 đến câu {part1Questions.length}. Mỗi câu hỏi thí sinh chỉ chọn một phương án.
                </div>

                {part1Questions.map((q, idx) => {
                  const isSelected = selectedQId === q.id;
                  return (
                    <div
                      key={q.id}
                      className={`wde-question-box ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => setSelectedQId(q.id)}
                    >
                      {/* Floating mini toolbar */}
                      <div className="wde-q-floating-bar">
                        <button
                          type="button"
                          className="wde-q-action-mini"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedQId(q.id);
                            imageUploadRef.current?.click();
                          }}
                          title="Chèn ảnh"
                        >
                          <IcoImage size={11} />
                        </button>
                        <button
                          type="button"
                          className="wde-q-action-mini danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteQuestion(q.id);
                          }}
                          title="Xóa câu này"
                        >
                          <IcoTrash size={11} />
                        </button>
                      </div>

                      <div className="wde-stem-row">
                        <span className="wde-q-num-label">Câu {idx + 1}.</span>
                        <select
                          className="wde-q-level-select"
                          value={q.level || 'th'}
                          onChange={(e) => updateQuestion(q.id, 'level', e.target.value)}
                          title="Mức độ nhận thức GDPT 2025"
                        >
                          <option value="nb">[NB] Nhận biết</option>
                          <option value="th">[TH] Thông hiểu</option>
                          <option value="vd">[VD] Vận dụng</option>
                          <option value="vdc">[VDC] Vận dụng cao</option>
                        </select>
                        <textarea
                          className="wde-q-stem-textarea"
                          value={q.q || ''}
                          rows={2}
                          onChange={(e) => updateQuestion(q.id, 'q', e.target.value)}
                          placeholder="Nhập nội dung câu hỏi..."
                        />
                      </div>

                      {/* Ảnh minh họa nếu có */}
                      {q.image && (
                        <div className="wde-q-image-wrap">
                          <img src={q.image} alt={`Hình câu ${idx + 1}`} className="wde-q-img-preview" />
                          <div className="wde-q-img-tools">
                            <button
                              type="button"
                              className="wde-q-action-mini danger"
                              onClick={() => updateQuestion(q.id, 'image', null)}
                              title="Xóa ảnh này"
                            >
                              <IcoTrash size={11} /> Xóa ảnh
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 4 phương án A, B, C, D */}
                      <div className="wde-options-grid">
                        {(q.options || []).map((optText, oIdx) => {
                          const isCorrect = q.correct === oIdx;
                          return (
                            <div
                              key={oIdx}
                              className={`wde-opt-item ${isCorrect ? 'is-correct' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQuestion(q.id, 'correct', oIdx);
                              }}
                              title="Nhấp vào chữ cái để chọn làm đáp án đúng"
                            >
                              <span className="wde-opt-letter">{LETTERS[oIdx]}.</span>
                              <input
                                type="text"
                                className="wde-opt-input"
                                value={optText}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => updateOptionText(q.id, oIdx, e.target.value)}
                              />
                            </div>
                          );
                        })}
                      </div>

                      {/* Lời giải chi tiết */}
                      {showExplain && (
                        <div className="wde-explain-box">
                          <div className="wde-explain-title">Hướng dẫn giải chi tiết:</div>
                          <textarea
                            className="wde-explain-textarea"
                            value={q.explain || ''}
                            rows={1}
                            onChange={(e) => updateQuestion(q.id, 'explain', e.target.value)}
                            placeholder="Nhập lời giải chi tiết cho câu hỏi..."
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </section>
            )}

            {/* ============================================================
                PHẦN II: TRẮC NGHIỆM ĐÚNG / SAI (4 Ý a, b, c, d)
                ============================================================ */}
            {part2Questions.length > 0 && (
              <section className="wde-part-section">
                <div className="wde-part-heading">
                  PHẦN II. Câu trắc nghiệm đúng sai.
                </div>
                <div className="wde-part-subguide">
                  Thí sinh trả lời từ câu 1 đến câu {part2Questions.length}. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai.
                </div>

                {part2Questions.map((q, idx) => {
                  const isSelected = selectedQId === q.id;
                  return (
                    <div
                      key={q.id}
                      className={`wde-question-box ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => setSelectedQId(q.id)}
                    >
                      <div className="wde-q-floating-bar">
                        <button
                          type="button"
                          className="wde-q-action-mini danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteQuestion(q.id);
                          }}
                          title="Xóa câu này"
                        >
                          <IcoTrash size={11} />
                        </button>
                      </div>

                      <div className="wde-stem-row">
                        <span className="wde-q-num-label">Câu {idx + 1}.</span>
                        <select
                          className="wde-q-level-select"
                          value={q.level || 'th'}
                          onChange={(e) => updateQuestion(q.id, 'level', e.target.value)}
                          title="Mức độ nhận thức GDPT 2025"
                        >
                          <option value="nb">[NB] Nhận biết</option>
                          <option value="th">[TH] Thông hiểu</option>
                          <option value="vd">[VD] Vận dụng</option>
                          <option value="vdc">[VDC] Vận dụng cao</option>
                        </select>
                        <textarea
                          className="wde-q-stem-textarea"
                          value={q.q || ''}
                          rows={2}
                          onChange={(e) => updateQuestion(q.id, 'q', e.target.value)}
                          placeholder="Đề dẫn bài toán hoặc bối cảnh thí nghiệm..."
                        />
                      </div>

                      {q.image && (
                        <div className="wde-q-image-wrap">
                          <img src={q.image} alt={`Hình câu ${idx + 1}`} className="wde-q-img-preview" />
                          <button
                            type="button"
                            className="wde-q-action-mini danger"
                            onClick={() => updateQuestion(q.id, 'image', null)}
                          >
                            <IcoTrash size={11} /> Xóa ảnh
                          </button>
                        </div>
                      )}

                      {/* 4 nhận định a, b, c, d */}
                      <div className="wde-tf-statements-wrap">
                        {(q.statements || []).map((st, sIdx) => {
                          const letter = ['a', 'b', 'c', 'd'][sIdx];
                          return (
                            <div key={sIdx} className="wde-tf-row">
                              <span className="wde-tf-letter">{letter})</span>
                              <input
                                type="text"
                                className="wde-tf-text-input"
                                value={st.text || ''}
                                onChange={(e) => updateTfStatement(q.id, sIdx, 'text', e.target.value)}
                              />
                              <button
                                type="button"
                                className={`wde-tf-toggle-btn ${st.answer ? 'true' : 'false'}`}
                                onClick={() => updateTfStatement(q.id, sIdx, 'answer', !st.answer)}
                                title="Bấm để đổi Đúng / Sai"
                              >
                                {st.answer ? 'Đúng' : 'Sai'}
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {showExplain && (
                        <div className="wde-explain-box">
                          <div className="wde-explain-title">Hướng dẫn giải chi tiết:</div>
                          <textarea
                            className="wde-explain-textarea"
                            value={q.explain || ''}
                            rows={1}
                            onChange={(e) => updateQuestion(q.id, 'explain', e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </section>
            )}

            {/* ============================================================
                PHẦN III: TRẮC NGHIỆM TRẢ LỜI NGẮN
                ============================================================ */}
            {part3Questions.length > 0 && (
              <section className="wde-part-section">
                <div className="wde-part-heading">
                  PHẦN III. Câu trắc nghiệm trả lời ngắn.
                </div>
                <div className="wde-part-subguide">
                  Thí sinh trả lời từ câu 1 đến câu {part3Questions.length}.
                </div>

                {part3Questions.map((q, idx) => {
                  const isSelected = selectedQId === q.id;
                  return (
                    <div
                      key={q.id}
                      className={`wde-question-box ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => setSelectedQId(q.id)}
                    >
                      <div className="wde-q-floating-bar">
                        <button
                          type="button"
                          className="wde-q-action-mini danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteQuestion(q.id);
                          }}
                          title="Xóa câu này"
                        >
                          <IcoTrash size={11} />
                        </button>
                      </div>

                      <div className="wde-stem-row">
                        <span className="wde-q-num-label">Câu {idx + 1}.</span>
                        <select
                          className="wde-q-level-select"
                          value={q.level || 'vd'}
                          onChange={(e) => updateQuestion(q.id, 'level', e.target.value)}
                          title="Mức độ nhận thức GDPT 2025"
                        >
                          <option value="nb">[NB] Nhận biết</option>
                          <option value="th">[TH] Thông hiểu</option>
                          <option value="vd">[VD] Vận dụng</option>
                          <option value="vdc">[VDC] Vận dụng cao</option>
                        </select>
                        <textarea
                          className="wde-q-stem-textarea"
                          value={q.q || ''}
                          rows={2}
                          onChange={(e) => updateQuestion(q.id, 'q', e.target.value)}
                          placeholder="Bài toán tính toán yêu cầu điền số..."
                        />
                      </div>

                      {q.image && (
                        <div className="wde-q-image-wrap">
                          <img src={q.image} alt={`Hình câu ${idx + 1}`} className="wde-q-img-preview" />
                          <button
                            type="button"
                            className="wde-q-action-mini danger"
                            onClick={() => updateQuestion(q.id, 'image', null)}
                          >
                            <IcoTrash size={11} /> Xóa ảnh
                          </button>
                        </div>
                      )}

                      <div className="wde-sa-wrap">
                        <span className="wde-sa-label">Đáp số điền:</span>
                        <input
                          type="text"
                          className="wde-sa-input"
                          value={q.answer || ''}
                          onChange={(e) => updateQuestion(q.id, 'answer', e.target.value)}
                          placeholder="VD: 12,5"
                        />
                      </div>

                      {showExplain && (
                        <div className="wde-explain-box">
                          <div className="wde-explain-title">Hướng dẫn giải chi tiết:</div>
                          <textarea
                            className="wde-explain-textarea"
                            value={q.explain || ''}
                            rows={1}
                            onChange={(e) => updateQuestion(q.id, 'explain', e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </section>
            )}

            {/* KẾT THÚC ĐỀ */}
            <div style={{ textAlign: 'center', fontWeight: 700, margin: '24px 0 12px 0', fontSize: '13px' }}>
              ------------------- HẾT -------------------
              <div style={{ fontStyle: 'italic', fontWeight: 400, marginTop: '2px', fontSize: '12px' }}>
                Thí sinh không được sử dụng tài liệu. Cán bộ coi thi không giải thích gì thêm.
              </div>
            </div>

            {/* BẢNG ĐÁP ÁN CUỐI ĐỀ */}
            {showAnswerKey && (
              <div className="wde-answer-key-section">
                <div style={{ fontWeight: 800, textTransform: 'uppercase', textAlign: 'center', marginBottom: 6 }}>
                  BẢNG ĐÁP ÁN THAM KHẢO (MÃ ĐỀ {examCode})
                </div>

                {part1Questions.length > 0 && (
                  <table className="wde-key-table">
                    <thead>
                      <tr>
                        <th colSpan={Math.min(part1Questions.length, 10)}>Phần I: Trắc nghiệm 4 lựa chọn</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {part1Questions.slice(0, 10).map((_, i) => (
                          <td key={i} style={{ fontWeight: 700 }}>Câu {i + 1}</td>
                        ))}
                      </tr>
                      <tr>
                        {part1Questions.slice(0, 10).map((q, i) => (
                          <td key={i} style={{ color: '#185abd', fontWeight: 800 }}>
                            {q.correct >= 0 ? LETTERS[q.correct] : '-'}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </main>

        {/* ============================================================
            6. CHÂN TRANG WORD (STATUS BAR)
            ============================================================ */}
        <footer className="wde-statusbar">
          <div className="wde-statusbar-left">
            <span>Trang 1 / {Math.max(1, Math.ceil(questions.length / 14))}</span>
            <span>Tổng {questions.length} câu ({part1Questions.length} P.I • {part2Questions.length} P.II • {part3Questions.length} P.III)</span>
            <span>Ngôn ngữ: Tiếng Việt (Chuẩn GDPT 2025)</span>
          </div>

          <div className="wde-statusbar-right">
            <span>Thu phóng: {zoom}%</span>
            <input
              type="range"
              min="75"
              max="140"
              step="5"
              className="wde-zoom-slider"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              title="Thu phóng trang A4"
            />
          </div>
        </footer>

                  </>
        )}

        {/* ============================================================
            MODAL 1: GIAO ĐỀ CHO LỚP HỌC (ELEC AI CLASS ASSIGNMENT)
            ============================================================ */}
        {showAssignModal && (
          <div className="wde-matrix-modal-backdrop" onClick={() => setShowAssignModal(false)}>
            <div className="wde-matrix-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
              <div className="wde-matrix-header">
                <div className="wde-matrix-title">
                  <IcoSend size={16} /> Giao Bài Kiểm Tra Trực Tiếp Cho Lớp Học
                </div>
                <button type="button" className="wde-tool-btn" onClick={() => setShowAssignModal(false)}>
                  <IcoClose size={16} />
                </button>
              </div>

              <div className="wde-matrix-body" style={{ padding: '20px' }}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Chọn lớp nhận bài kiểm tra:
                  </label>
                  <select
                    className="wde-doc-title-input"
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff' }}
                  >
                    {(classes && classes.length > 0) ? (
                      classes.map((cls) => (
                        <option key={cls.id || cls.name} value={cls.id || cls.name}>
                          {cls.name} {cls.grade ? `(Khối ${cls.grade})` : ''} • {cls.members?.length || cls.studentCount || (cls.students?.length) || 0} học sinh
                        </option>
                      ))
                    ) : (
                      <option value="">-- Chưa có lớp nào (sẽ lưu vào Kho cá nhân) --</option>
                    )}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                      Thời gian làm bài:
                    </label>
                    <select
                      className="wde-doc-title-input"
                      value={assignDuration}
                      onChange={(e) => setAssignDuration(e.target.value)}
                      style={{ width: '100%', padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff' }}
                    >
                      <option value="15">15 phút (Kiểm tra 15p)</option>
                      <option value="45">45 phút (1 tiết)</option>
                      <option value="50">50 phút (Chuẩn TN THPT)</option>
                      <option value="90">90 phút (Thi học kỳ)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                      Quy mô đề thi:
                    </label>
                    <div style={{ padding: '8px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12.5px', color: '#1e293b' }}>
                      {questions.length} câu ({matrixStats.totalScore}đ)
                    </div>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', marginBottom: 16 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#1e293b', marginBottom: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={assignShuffle}
                      onChange={(e) => setAssignShuffle(e.target.checked)}
                    />
                    Tự động chia 4 mã đề (101, 102, 103, 104) chống nhìn bài
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#1e293b', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={assignAntiCheat}
                      onChange={(e) => setAssignAntiCheat(e.target.checked)}
                    />
                    Bật giám sát gian lận (Cảnh báo chuyển tab & chụp ảnh phòng thi)
                  </label>
                </div>

                <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                  Học sinh trong lớp chỉ cần vào mục "Phòng Thi", nhập mã đề hoặc bấm vào bài kiểm tra để bắt đầu làm bài. Điểm số sẽ tự động đồng bộ vào Bảng Điểm Lớp.
                </div>
              </div>

              <div className="wde-matrix-footer">
                <button type="button" className="wde-action-btn" onClick={() => setShowAssignModal(false)}>
                  Hủy
                </button>
                <button
                  type="button"
                  className="wde-action-btn primary"
                  onClick={handleConfirmAssign}
                  disabled={isBusy}
                  style={{ background: '#185abd', color: '#fff' }}
                >
                  <IcoSend size={13} /> Xác nhận Giao Đề Ngay
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            MODAL 2: ĐẢO 4 MÃ ĐỀ TỰ ĐỘNG (101 - 104)
            ============================================================ */}
        {showShuffleModal && (
          <div className="wde-matrix-modal-backdrop" onClick={() => setShowShuffleModal(false)}>
            <div className="wde-matrix-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '780px' }}>
              <div className="wde-matrix-header">
                <div className="wde-matrix-title">
                  <IcoShuffle size={16} /> Đảo 4 Mã Đề Tự Động Chuẩn Bộ Giáo Dục & Đào Tạo
                </div>
                <button type="button" className="wde-tool-btn" onClick={() => setShowShuffleModal(false)}>
                  <IcoClose size={16} />
                </button>
              </div>

              <div className="wde-matrix-body" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                  {['101', '102', '103', '104'].map((code) => (
                    <button
                      key={code}
                      type="button"
                      className={`wde-mode-btn ${activeShuffleCode === code ? 'active' : ''}`}
                      onClick={() => setActiveShuffleCode(code)}
                      style={{ padding: '6px 14px', fontSize: '13px' }}
                    >
                      Mã Đề {code}
                    </button>
                  ))}
                </div>

                {shuffledVariants.length > 0 ? (
                  <div>
                    {(() => {
                      const curVar = shuffledVariants.find((v) => String(v.code) === activeShuffleCode) || shuffledVariants[0];
                      const curQs = curVar.questions || [];
                      return (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                              Mã đề {curVar.code} • {curQs.length} câu hỏi • Đã hoán vị câu & đáp án
                            </span>
                            <button
                              type="button"
                              className="wde-bridge-btn primary"
                              onClick={async () => {
                                await exportToWord({
                                  deptName,
                                  schoolName,
                                  examName: `${examName} - Mã ${curVar.code}`,
                                  subject,
                                  grade,
                                  duration,
                                  code: curVar.code,
                                  schoolYear,
                                  questions: curQs,
                                  includeAnswers: false,
                                });
                              }}
                            >
                              <IcoDownload size={13} /> Tải đề Mã {curVar.code} (.docx)
                            </button>
                          </div>

                          <div style={{ maxHeight: '320px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#f8fafc', padding: '10px' }}>
                            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr style={{ background: '#e2e8f0', textAlign: 'left' }}>
                                  <th style={{ padding: '6px 8px', width: '60px' }}>Câu</th>
                                  <th style={{ padding: '6px 8px' }}>Nội dung câu hỏi tóm tắt</th>
                                  <th style={{ padding: '6px 8px', width: '80px' }}>Đáp án</th>
                                </tr>
                              </thead>
                              <tbody>
                                {curQs.slice(0, 15).map((q, idx) => (
                                  <tr key={q.id || idx} style={{ borderBottom: '1px solid #edf2f7' }}>
                                    <td style={{ padding: '6px 8px', fontWeight: 600 }}>Câu {idx + 1}</td>
                                    <td style={{ padding: '6px 8px', color: '#475569' }}>{q.q ? q.q.slice(0, 80) : ''}...</td>
                                    <td style={{ padding: '6px 8px', fontWeight: 700, color: '#185abd' }}>
                                      {q.part === 2 ? 'Đ/S 4 ý' : q.part === 3 ? (q.answer || 'Tự luận') : LETTERS[q.correct || 0]}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                    Chưa có câu hỏi để đảo đề. Thầy/Cô hãy nạp hoặc soạn ít nhất 4 câu hỏi.
                  </div>
                )}
              </div>

              <div className="wde-matrix-footer">
                <button type="button" className="wde-action-btn" onClick={() => setShowShuffleModal(false)}>
                  Đóng
                </button>
                <button
                  type="button"
                  className="wde-action-btn primary"
                  onClick={async () => {
                    for (const v of shuffledVariants) {
                      await exportToWord({
                        deptName,
                        schoolName,
                        examName: `${examName} - Mã ${v.code}`,
                        subject,
                        grade,
                        duration,
                        code: v.code,
                        schoolYear,
                        questions: v.questions,
                        includeAnswers: true,
                      });
                    }
                    onSay?.('Đã xuất toàn bộ 4 mã đề Word kèm đáp án!', 'success');
                  }}
                  disabled={!shuffledVariants.length}
                >
                  <IcoDownload size={13} /> Tải Trọn Bộ 4 Mã Đề (.docx)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            MODAL 3: AI BÁC SĨ THẨM ĐỊNH ĐỀ THI GDPT 2025
            ============================================================ */}
        {showAuditModal && (
          <div className="wde-matrix-modal-backdrop" onClick={() => setShowAuditModal(false)}>
            <div className="wde-matrix-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
              <div className="wde-matrix-header">
                <div className="wde-matrix-title">
                  <IcoCheckCircle size={16} /> Bác Sĩ AI: Thẩm Định Cấu Trúc & Phán Xét Sư Phạm
                </div>
                <button type="button" className="wde-tool-btn" onClick={() => setShowAuditModal(false)}>
                  <IcoClose size={16} />
                </button>
              </div>

              <div className="wde-matrix-body" style={{ padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: 16 }}>
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#166534', fontWeight: 600 }}>Phần I (Nhiều Lựa Chọn)</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#15803d' }}>{matrixStats.p1} / 18 câu</div>
                    <div style={{ fontSize: '11px', color: '#4b5563' }}>{(matrixStats.p1 * 0.25).toFixed(2)} / 4.50 điểm</div>
                  </div>
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#1e40af', fontWeight: 600 }}>Phần II (Đúng/Sai)</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#1d4ed8' }}>{matrixStats.p2} / 4 câu</div>
                    <div style={{ fontSize: '11px', color: '#4b5563' }}>{(matrixStats.p2 * 1.0).toFixed(2)} / 4.00 điểm</div>
                  </div>
                  <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#6b21a8', fontWeight: 600 }}>Phần III (Trả Lời Ngắn)</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#7e22ce' }}>{matrixStats.p3} / 6 câu</div>
                    <div style={{ fontSize: '11px', color: '#4b5563' }}>{(matrixStats.p3 * (matrixStats.part3Unit ?? 0.25)).toFixed(2)} / {(6 * (matrixStats.part3Unit ?? 0.25)).toFixed(2)} điểm</div>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Tổng điểm đề thi:</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: matrixStats.totalScore === 10 ? '#15803d' : '#b45309' }}>
                      {matrixStats.totalScore.toFixed(2)} / 10.00 điểm {matrixStats.totalScore === 10 ? '(Chuẩn tuyệt đối)' : '(Chưa tròn 10 điểm)'}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Phân bố Bloom: Nhận biết: {matrixStats.nbPct}% • Thông hiểu: {matrixStats.thPct}% • Vận dụng: {matrixStats.vdPct}% • Vận dụng cao: {matrixStats.vdcPct}%
                  </div>
                </div>

                <div style={{ border: '1px solid #fee2e2', background: '#fff5f5', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#b91c1c', marginBottom: 4 }}>
                    Đánh giá chất lượng đề từ ELEC AI:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#7f1d1d' }}>
                    {matrixStats.p1 !== 18 && <li>Phần I nên đủ 18 câu theo quy chuẩn đề tốt nghiệp THPT mới.</li>}
                    {matrixStats.p2 !== 4 && <li>Phần II nên đủ 4 câu (mỗi câu 4 ý a, b, c, d).</li>}
                    {matrixStats.p3 !== 6 && <li>Phần III nên đủ 6 câu trả lời ngắn dạng số hoặc thuật ngữ.</li>}
                    {matrixStats.totalScore === 10 && <li>Đề thi đạt chuẩn 10.00 điểm phân hóa toàn diện.</li>}
                  </ul>
                </div>
              </div>

              <div className="wde-matrix-footer">
                <button type="button" className="wde-action-btn" onClick={() => setShowAuditModal(false)}>
                  Đóng
                </button>
                <button
                  type="button"
                  className="wde-action-btn primary"
                  onClick={handleAiFixGrammar}
                  disabled={isBusy}
                >
                  <IcoSparkles size={13} /> AI Tự Động Sửa Lỗi & Chuẩn Hóa
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            MODAL 4: MÔ PHỎNG 100 HỌC SINH ẢO (VIRTUAL EXAM SIMULATOR)
            ============================================================ */}
        {showSimModal && (
          <div className="wde-matrix-modal-backdrop" onClick={() => setShowSimModal(false)}>
            <div className="wde-matrix-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
              <div className="wde-matrix-header">
                <div className="wde-matrix-title">
                  <IcoUsers size={16} /> Mô Phỏng 100 Học Sinh Ảo Giải Đề Thi Trong 3 Giây
                </div>
                <button type="button" className="wde-tool-btn" onClick={() => setShowSimModal(false)}>
                  <IcoClose size={16} />
                </button>
              </div>

              <div className="wde-matrix-body" style={{ padding: '20px' }}>
                {isSimulating ? (
                  <div style={{ textAlign: 'center', padding: '30px' }}>
                    <div className="wde-casual-spinner" style={{ margin: '0 auto 12px' }} />
                    <div style={{ fontSize: '13px', color: '#475569' }}>
                      Đang mô phỏng 100 thí sinh ảo (Giỏi, Khá, Trung bình, Yếu) làm bài...
                    </div>
                  </div>
                ) : simResults ? (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: 16 }}>
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Điểm trung bình</div>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: '#185abd' }}>{simResults.avg}</div>
                      </div>
                      <div style={{ background: 'var(--t-ok-soft, rgba(5, 150, 105, 0.1))', border: '1px solid rgba(5, 150, 105, 0.3)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: 'var(--t-ok, #166534)' }}>Tỷ lệ đạt (&gt;= 5.0)</div>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--t-ok, #15803d)' }}>{simResults.passRate}%</div>
                      </div>
                      <div style={{ background: 'rgba(124, 58, 237, 0.11)', border: '1px solid rgba(124, 58, 237, 0.3)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: 'var(--t-accent-2, #6b21a8)' }}>Tỷ lệ giỏi (&gt;= 8.0)</div>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--t-accent-2, #7e22ce)' }}>{simResults.excellentRate}%</div>
                      </div>
                      <div style={{ background: 'var(--t-warn-soft, rgba(217, 119, 6, 0.11))', border: '1px solid rgba(217, 119, 6, 0.35)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: 'var(--t-warn, #92400e)' }}>Biên độ điểm</div>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--t-warn, #b45309)' }}>{simResults.min} - {simResults.max}</div>
                      </div>
                    </div>

                    <div style={{ background: 'var(--t-surface-1, #f8fafc)', border: '1px solid var(--t-border, #e2e8f0)', borderRadius: '8px', padding: '12px' }}>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--t-ink, #1e293b)', marginBottom: 8 }}>
                        Top 3 câu hỏi học sinh hay bị lừa / sai nhiều nhất:
                      </div>
                      {simResults.topTraps && simResults.topTraps.length > 0 ? (
                        simResults.topTraps.map((trap) => (
                          <div key={trap.rank} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '5px 0', borderBottom: '1px solid var(--t-border, #f1f5f9)' }}>
                            <span style={{ color: 'var(--t-ink-2, #475569)' }}>Top {trap.rank}: {trap.qText}</span>
                            <span style={{ fontWeight: 700, color: 'var(--t-bad, #dc2626)' }}>{trap.wrongRate}% thí sinh sai</span>
                          </div>
                        ))
                      ) : (
                        <div style={{ fontSize: '12px', color: '#64748b' }}>Không có câu hỏi nào bị nghẽn tư duy nghiêm trọng.</div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="wde-matrix-footer">
                <button type="button" className="wde-action-btn" onClick={() => setShowSimModal(false)}>
                  Đóng
                </button>
                <button type="button" className="wde-action-btn primary" onClick={handleRunSimulation} disabled={isSimulating}>
                  Chạy lại mô phỏng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            MODAL 5: CẤU HÌNH THÔNG TIN KỲ THI & CƠ SỞ GIÁO DỤC
            ============================================================ */}
        {showConfigModal && (
          <div className="wde-matrix-modal-backdrop" onClick={() => setShowConfigModal(false)}>
            <div className="wde-matrix-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
              <div className="wde-matrix-header">
                <div className="wde-matrix-title">
                  <IcoSettings size={16} /> Cấu Hình Thông Tin Kỳ Thi &amp; Cơ Sở Giáo Dục
                </div>
                <button type="button" className="wde-tool-btn" onClick={() => setShowConfigModal(false)}>
                  <IcoClose size={16} />
                </button>
              </div>

              <div className="wde-matrix-body" style={{ padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      Cơ quan quản lý (Sở GD&amp;ĐT):
                    </label>
                    <input
                      type="text"
                      className="wde-copilot-input"
                      value={cfgDept}
                      onChange={(e) => setCfgDept(e.target.value)}
                      placeholder="SỞ GIÁO DỤC VÀ ĐÀO TẠO..."
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      Tên trường THPT / Trung tâm:
                    </label>
                    <input
                      type="text"
                      className="wde-copilot-input"
                      value={cfgSchool}
                      onChange={(e) => setCfgSchool(e.target.value)}
                      placeholder="TRƯỜNG THPT..."
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Tên kỳ thi / Đợt kiểm tra:
                  </label>
                  <input
                    type="text"
                    className="wde-copilot-input"
                    value={cfgExam}
                    onChange={(e) => setCfgExam(e.target.value)}
                    placeholder="ĐỀ KIỂM TRA ĐÁNH GIÁ ĐỊNH KỲ..."
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      Môn thi:
                    </label>
                    <select
                      className="wde-copilot-input"
                      value={cfgSubject}
                      onChange={(e) => setCfgSubject(e.target.value)}
                    >
                      {SUPPORTED_SUBJECTS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      Khối lớp:
                    </label>
                    <select
                      className="wde-copilot-input"
                      value={cfgGrade}
                      onChange={(e) => setCfgGrade(e.target.value)}
                    >
                      <option value="10">Lớp 10</option>
                      <option value="11">Lớp 11</option>
                      <option value="12">Lớp 12</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      Thời gian (phút):
                    </label>
                    <input
                      type="number"
                      className="wde-copilot-input"
                      value={cfgDuration}
                      onChange={(e) => setCfgDuration(e.target.value)}
                      min="15"
                      max="180"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      Mã đề gốc:
                    </label>
                    <input
                      type="text"
                      className="wde-copilot-input"
                      value={cfgCode}
                      onChange={(e) => setCfgCode(e.target.value)}
                      placeholder="101"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Năm học:
                  </label>
                  <input
                    type="text"
                    className="wde-copilot-input"
                    value={cfgYear}
                    onChange={(e) => setCfgYear(e.target.value)}
                    placeholder="2025 - 2026"
                  />
                </div>
              </div>

              <div className="wde-matrix-footer">
                <button type="button" className="wde-action-btn" onClick={() => setShowConfigModal(false)}>
                  Hủy
                </button>
                <button type="button" className="wde-action-btn primary" onClick={handleApplyConfig}>
                  <IcoCheck size={13} /> Lưu Cấu Hình
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            MODAL 6: NẠP KHUNG ĐỀ CHUẨN BỘ GIÁO DỤC & ĐÀO TẠO 2025
            ============================================================ */}
        {showTemplateModal && (
          <div className="wde-matrix-modal-backdrop" onClick={() => setShowTemplateModal(false)}>
            <div className="wde-matrix-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px' }}>
              <div className="wde-matrix-header">
                <div className="wde-matrix-title">
                  <IcoTemplate size={16} /> Nạp Khung Đề Chuẩn Bộ Giáo Dục &amp; Đào Tạo 2025
                </div>
                <button type="button" className="wde-tool-btn" onClick={() => setShowTemplateModal(false)}>
                  <IcoClose size={16} />
                </button>
              </div>

              <div className="wde-matrix-body" style={{ padding: '20px' }}>
                <p style={{ fontSize: '13px', color: '#475569', marginBottom: '16px' }}>
                  Chọn khung cấu trúc định dạng chuẩn GDPT 2025 để hệ thống tự động sinh cấu trúc câu hỏi 3 phần tròn 10.00 điểm:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {Object.entries(STANDARD_TEMPLATES).map(([tplKey, tpl]) => {
                    const isSelected = selectedTemplateId === tplKey;
                    return (
                      <div
                        key={tplKey}
                        onClick={() => setSelectedTemplateId(tplKey)}
                        style={{
                          border: isSelected ? '2px solid #185abd' : '1px solid #cbd5e1',
                          borderRadius: '8px',
                          padding: '14px 16px',
                          background: isSelected ? '#f0f7ff' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: isSelected ? '#185abd' : '#1e293b' }}>
                            {tpl.name}
                          </span>
                          <span style={{ fontSize: '12px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: isSelected ? '#dbeafe' : '#f1f5f9', color: isSelected ? '#1e40af' : '#475569' }}>
                            {tpl.duration} phút • {tpl.totalQuestions} câu • 10.0 điểm
                          </span>
                        </div>
                        <div style={{ fontSize: '12.5px', color: '#475569', marginBottom: '8px' }}>
                          Áp dụng cho: <strong>{tpl.subjects.join(', ')}</strong>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '11.5px', color: '#64748b' }}>
                          <div style={{ background: '#f8fafc', padding: '6px 8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                            Phần I: <strong>{tpl.parts.part1.count} câu</strong> ({tpl.parts.part1.points} đ)
                          </div>
                          <div style={{ background: '#f8fafc', padding: '6px 8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                            Phần II: <strong>{tpl.parts.part2.count} câu</strong> ({tpl.parts.part2.points} đ)
                          </div>
                          <div style={{ background: '#f8fafc', padding: '6px 8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                            Phần III: <strong>{tpl.parts.part3.count} câu</strong> ({tpl.parts.part3.points} đ)
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="wde-matrix-footer">
                <button type="button" className="wde-action-btn" onClick={() => setShowTemplateModal(false)}>
                  Hủy
                </button>
                <button
                  type="button"
                  className="wde-action-btn primary"
                  onClick={() => handleApplyTemplate(selectedTemplateId)}
                >
                  <IcoCheck size={13} /> Nạp Khung Này Vào Đề
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            MODAL 7: XUẤT BẢN TRỌN GÓI HỒ SƠ KỲ THI (FULL BUNDLE ZIP)
            ============================================================ */}
        {showPackageModal && (
          <div className="wde-matrix-modal-backdrop" onClick={() => setShowPackageModal(false)}>
            <div className="wde-matrix-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
              <div className="wde-matrix-header">
                <div className="wde-matrix-title">
                  <IcoPackage size={16} /> Xuất Bản Trọn Gói Hồ Sơ Kỳ Thi Chuẩn Bộ GD&amp;ĐT
                </div>
                <button type="button" className="wde-tool-btn" onClick={() => setShowPackageModal(false)}>
                  <IcoClose size={16} />
                </button>
              </div>

              <div className="wde-matrix-body" style={{ padding: '20px' }}>
                <p style={{ fontSize: '13px', color: '#334155', marginBottom: '14px', lineHeight: '1.5' }}>
                  Hệ thống tự động biên soạn và nén 1 tệp ZIP duy nhất chứa đầy đủ toàn bộ hồ sơ khảo thí theo quy chế thi THPT hiện hành:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px' }}>
                    <div style={{ fontWeight: 700, fontSize: '12.5px', color: '#1e293b', marginBottom: '4px' }}>
                      4 Mã Đề Hoán Vị (.docx)
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                      Mã 101, 102, 103, 104 in sẵn tiêu đề Sở/Trường, không lộ đáp án cho học sinh.
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px' }}>
                    <div style={{ fontWeight: 700, fontSize: '12.5px', color: '#1e293b', marginBottom: '4px' }}>
                      Đáp Án Chi Tiết (.docx)
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                      4 file đề thi tích hợp sẵn bảng đáp án và lời giải sư phạm cho ban giám khảo.
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px' }}>
                    <div style={{ fontWeight: 700, fontSize: '12.5px', color: '#1e293b', marginBottom: '4px' }}>
                      Khung Ma Trận &amp; Bản Đặc Tả
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                      Định dạng chuẩn Bloom (Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao) 10.0 điểm.
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px' }}>
                    <div style={{ fontWeight: 700, fontSize: '12.5px', color: '#1e293b', marginBottom: '4px' }}>
                      Phiếu Trả Lời OMR Chuẩn A4
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                      Tệp HTML có sẵn 4 góc fiducial mark để in ra giấy cho học sinh tô bút chì.
                    </div>
                  </div>
                </div>

                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '10px 14px', fontSize: '12.5px', color: '#1e40af' }}>
                  Đề thi hiện tại: <strong>{examName}</strong> | Môn: <strong>{subject}</strong> | Khối: <strong>{grade}</strong> ({questions.length} câu, {matrixStats.totalScore.toFixed(2)} điểm)
                </div>
              </div>

              <div className="wde-matrix-footer">
                <button type="button" className="wde-action-btn" onClick={() => setShowPackageModal(false)}>
                  Đóng
                </button>
                <button
                  type="button"
                  className="wde-action-btn primary"
                  onClick={handleExportFullZip}
                  disabled={isExportingPackage || !questions.length}
                >
                  <IcoDownload size={13} /> {isExportingPackage ? 'Đang đóng gói...' : 'Tải Bộ Hồ Sơ (.zip)'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            MODAL 8: KÍCH HOẠT CHẤM THI QUANG HỌC OMR BẰNG CAMERA
            ============================================================ */}
        {showOmrModal && (
          <div className="wde-matrix-modal-backdrop" onClick={() => setShowOmrModal(false)}>
            <div className="wde-matrix-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
              <div className="wde-matrix-header">
                <div className="wde-matrix-title">
                  <IcoCamera size={16} /> Kích Hoạt Chấm Phiếu OMR Bằng Camera
                </div>
                <button type="button" className="wde-tool-btn" onClick={() => setShowOmrModal(false)}>
                  <IcoClose size={16} />
                </button>
              </div>

              <div className="wde-matrix-body" style={{ padding: '20px' }}>
                <p style={{ fontSize: '13px', color: '#334155', marginBottom: '14px', lineHeight: '1.5' }}>
                  Liên kết trực tiếp với mô-đun Camera Scanner của ELEC AI. Sau khi kích hoạt, Thầy/Cô chỉ cần đưa camera điện thoại hoặc webcam lên phiếu làm bài A4 của học sinh để quét điểm tức thì.
                </p>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px', marginBottom: '14px' }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
                    Quy chuẩn thang điểm chấm OMR GDPT 2025:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#475569', lineHeight: '1.6' }}>
                    <li>Phần I: <strong>{matrixStats.p1} câu</strong> (0.25 điểm / câu)</li>
                    <li>Phần II: <strong>{matrixStats.p2} câu</strong> (Đúng 1 ý: 0.1đ; 2 ý: 0.25đ; 3 ý: 0.5đ; 4 ý: 1.0đ)</li>
                    <li>Phần III: <strong>{matrixStats.p3} câu</strong> ({(matrixStats.part3Unit ?? 0.25).toFixed(2)} điểm / câu trả lời ngắn)</li>
                    <li>Bảng đáp án: Tự động tổng hợp từ 4 mã đề hoán vị (101 - 104).</li>
                  </ul>
                </div>

                {omrSavedInfo && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '10px 14px', marginBottom: '14px', fontSize: '12.5px', color: '#166534' }}>
                    Đã kích hoạt thành công mã kỳ thi: <strong>{omrSavedInfo.id}</strong>. Thầy/Cô có thể vào mục Chấm Điểm OMR trên thanh menu để quét bài ngay.
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className="wde-bridge-btn"
                    onClick={handlePrintOmrA4}
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    <IcoPrinter size={13} /> In Ngay Phiếu Tô A4 Cho Học Sinh
                  </button>
                </div>
              </div>

              <div className="wde-matrix-footer">
                <button type="button" className="wde-action-btn" onClick={() => setShowOmrModal(false)}>
                  Đóng
                </button>
                <button
                  type="button"
                  className="wde-action-btn primary"
                  onClick={handleActivateOmrPaperExam}
                  disabled={isSavingOmr || !questions.length}
                >
                  <IcoCheck size={13} /> {isSavingOmr ? 'Đang kích hoạt...' : 'Kích Hoạt Chấm OMR Ngay'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Khung Ma Trận & Bản Đặc Tả GDPT 2025 */}
        {showMatrixModal && (
          <div className="wde-matrix-modal-backdrop" onClick={() => setShowMatrixModal(false)}>
            <div className="wde-matrix-modal" onClick={(e) => e.stopPropagation()}>
              <div className="wde-matrix-header">
                <div className="wde-matrix-title">
                  Khung Ma Trận &amp; Bản Đặc Tả Đề Kiểm Tra GDPT 2025
                </div>
                <button
                  type="button"
                  className="wde-tool-btn"
                  onClick={() => setShowMatrixModal(false)}
                >
                  <IcoClose size={16} />
                </button>
              </div>

              <div className="wde-matrix-body">
                <div style={{ marginBottom: 12 }}>
                  <strong>{examName}</strong> — Môn: <strong>{subject}</strong> | Khối: <strong>{grade}</strong>
                </div>

                <table className="wde-matrix-table">
                  <thead>
                    <tr>
                      <th>Cấu trúc đề</th>
                      <th>Số câu</th>
                      <th>Điểm / câu</th>
                      <th>Tổng điểm</th>
                      <th>Tỷ lệ</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ textAlign: 'left', fontWeight: 600 }}>Phần I: Trắc nghiệm 4 lựa chọn</td>
                      <td>{matrixStats.p1}</td>
                      <td>0.25 đ</td>
                      <td>{(matrixStats.p1 * 0.25).toFixed(2)} đ</td>
                      <td>{matrixStats.total > 0 ? Math.round((matrixStats.p1 / matrixStats.total) * 100) : 0}%</td>
                    </tr>
                    <tr>
                      <td style={{ textAlign: 'left', fontWeight: 600 }}>Phần II: Đúng / Sai (4 ý a-b-c-d)</td>
                      <td>{matrixStats.p2}</td>
                      <td>1.00 đ</td>
                      <td>{(matrixStats.p2 * 1.0).toFixed(2)} đ</td>
                      <td>{matrixStats.total > 0 ? Math.round((matrixStats.p2 / matrixStats.total) * 100) : 0}%</td>
                    </tr>
                    <tr>
                      <td style={{ textAlign: 'left', fontWeight: 600 }}>Phần III: Trả lời ngắn</td>
                      <td>{matrixStats.p3}</td>
                      <td>{(/toán/i.test(String(subject || '')) ? 0.5 : 0.25).toFixed(2)} đ</td>
                      <td>{(matrixStats.p3 * (/toán/i.test(String(subject || '')) ? 0.5 : 0.25)).toFixed(2)} đ</td>
                      <td>{matrixStats.total > 0 ? Math.round((matrixStats.p3 / matrixStats.total) * 100) : 0}%</td>
                    </tr>
                    <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                      <td style={{ textAlign: 'left' }}>TỔNG CỘNG</td>
                      <td>{matrixStats.total} câu</td>
                      <td>-</td>
                      <td>{matrixStats.totalScore.toFixed(2)} đ</td>
                      <td>100%</td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ marginTop: 16, marginBottom: 8, fontWeight: 700 }}>
                  Phân bố Mức độ Nhận thức Bloom (Chuẩn GDPT 2025):
                </div>

                <table className="wde-matrix-table">
                  <thead>
                    <tr>
                      <th>Mức độ</th>
                      <th>Số câu</th>
                      <th>Tỷ lệ thực tế</th>
                      <th>Khuyến nghị GDPT 2025</th>
                      <th>Đánh giá</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>[NB] Nhận biết</td>
                      <td>{matrixStats.nb}</td>
                      <td>{matrixStats.nbPct}%</td>
                      <td>30% - 40%</td>
                      <td>{matrixStats.nbPct >= 25 && matrixStats.nbPct <= 45 ? 'Phù hợp' : 'Cần cân đối'}</td>
                    </tr>
                    <tr>
                      <td>[TH] Thông hiểu</td>
                      <td>{matrixStats.th}</td>
                      <td>{matrixStats.thPct}%</td>
                      <td>30%</td>
                      <td>{matrixStats.thPct >= 20 && matrixStats.thPct <= 40 ? 'Phù hợp' : 'Cần cân đối'}</td>
                    </tr>
                    <tr>
                      <td>[VD] Vận dụng</td>
                      <td>{matrixStats.vd}</td>
                      <td>{matrixStats.vdPct}%</td>
                      <td>20% - 30%</td>
                      <td>{matrixStats.vdPct >= 15 && matrixStats.vdPct <= 35 ? 'Phù hợp' : 'Cần cân đối'}</td>
                    </tr>
                    <tr>
                      <td>[VDC] Vận dụng cao</td>
                      <td>{matrixStats.vdc}</td>
                      <td>{matrixStats.vdcPct}%</td>
                      <td>10%</td>
                      <td>{matrixStats.vdcPct <= 15 ? 'Phù hợp' : 'Khá khó'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="wde-matrix-footer">
                <button
                  type="button"
                  className="wde-action-btn"
                  onClick={() => setShowMatrixModal(false)}
                >
                  Đóng
                </button>
                <button
                  type="button"
                  className="wde-action-btn primary"
                  onClick={async () => {
                    const content = `
# KHUNG MA TRẬN ĐỀ THI
## Môn: ${subject} - Khối: ${grade}
- Phần I (Trắc nghiệm 4 lựa chọn): ${matrixStats.p1} câu (${(matrixStats.p1 * 0.25).toFixed(2)} điểm)
- Phần II (Đúng/Sai): ${matrixStats.p2} câu (${(matrixStats.p2 * 1.0).toFixed(2)} điểm)
- Phần III (Trả lời ngắn): ${matrixStats.p3} câu (${(matrixStats.p3 * (matrixStats.part3Unit ?? 0.25)).toFixed(2)} điểm)
- Tổng điểm: ${matrixStats.totalScore.toFixed(2)} điểm

### Phân bố mức độ nhận thức Bloom:
- Nhận biết: ${matrixStats.nb} câu (${matrixStats.nbPct}%)
- Thông hiểu: ${matrixStats.th} câu (${matrixStats.thPct}%)
- Vận dụng: ${matrixStats.vd} câu (${matrixStats.vdPct}%)
- Vận dụng cao: ${matrixStats.vdc} câu (${matrixStats.vdcPct}%)

# BẢN ĐẶC TẢ CHI TIẾT
${questions.map((q, idx) => `Câu ${idx + 1} (${(q.level || 'th').toUpperCase()}): ${q.q ? q.q.slice(0, 80) : ''}...`).join('\n')}
                    `.trim();

                    await exportMatrixDocx({
                      title: `Ma-Tran-${examName}`,
                      content,
                      subject,
                      grade,
                      schoolName,
                    });
                    setMsg('Đã xuất Khung Ma Trận ra file Word (.docx) thành công!');
                    setTimeout(() => setMsg(''), 3000);
                  }}
                >
                  <IcoDownload size={13} /> Xuất Ma Trận ra Word (.docx)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
