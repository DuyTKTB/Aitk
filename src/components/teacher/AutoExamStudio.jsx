/* ============================================================
   AutoExamStudio.jsx — AI Studio (v6.1, chat-first + split workspace)
   ------------------------------------------------------------
   v6.1 (fix + tích hợp):
     • MỚI: Nhận prop `onGenerated` để đẩy dữ liệu sang form thủ công
       (khi được nhúng trong CreateExamPage).
     • FIX #4: Phân biệt rõ lệnh sửa câu hỏi vs. lệnh sửa ma trận.
       Có fallback thông báo khi không hiểu lệnh.
     • FIX: Disable hoàn toàn textarea + nút gửi khi AI đang xử lý.
     • Giữ nguyên: lưu lịch sử chat + ma trận + câu hỏi vào localStorage,
       logo AIMark động, resizer, AI actions.
   ============================================================ */
import React, { useState, useRef, useEffect, useMemo, Fragment } from 'react';
import MathText from '../MathText.jsx';
import { useAuth } from '../../hooks/useAuth.jsx';
import { createExam, defaultProctor } from '../../lib/classroom.js';
import {
  planMatrixWithAI,
  parseTeacherCustomMatrixWithAI,
  generateQuestionsFromApprovedMatrix,
  refineMatrixWithAI,
  normLevel,
  LEVEL_INFO,
  parseExamIntent,
  inferExamShape,
  parseQuestionCommand,
  rewriteQuestionWithAI,
  regenerateDistractorsWithAI,
  getPedagogicalInsightForQuestion,
  parseLocalCommand,
  verifyQuestionsWithAI,
  applyVerifySuggestion,
  suggestFormat,
  THPT_GRADES,
  FORMAT_GDPT,
  FORMAT_GDPT_ADV,
  FORMAT_MCQ,
} from '../../lib/matrixAiService.js';
import { addQuestion, addQuestionsBatch } from '../../lib/questionBank.js';
import { PRESET_SAMPLE_EXAMS } from '../../lib/sampleExamsData.js';
import { readFile, validateFiles, fmtSize } from '../../lib/fileReader.js';
import { exportToWord, exportBundleZip } from '../../lib/examExport.js';
import { generateShuffledVersions } from '../../lib/examShuffle.js';
import sound from '../../lib/gameSound.js';
import ExamPreviewSimulator from './ExamPreviewSimulator.jsx';
import AIMark from '../AIMark.jsx';
import { IconAlert } from '../Icons.jsx';
import { ElecFlaskBrandSvg } from './ElecBrandMark.jsx';

import '../../styles/autoexam-studio.css';

/* ============ SVG ICONS ============ */
const Svg = ({ size = 16, children, className = '' }) => (
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
    className={className}
  >
    {children}
  </svg>
);
const IcoSpark = ({ size = 16, className = '', style }) => (
  <ElecFlaskBrandSvg size={size} variant="current" className={className} style={style} />
);
const IcoSend = (p) => <Svg {...p}><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></Svg>;
const IcoPaperclip = (p) => <Svg {...p}><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></Svg>;
const IcoSim = (p) => <Svg {...p}><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></Svg>;
const IcoTable = (p) => <Svg {...p}><path d="M3 3h18v18H3z" /><path d="M3 9h18" /><path d="M3 15h18" /><path d="M9 3v18" /><path d="M15 3v18" /></Svg>;
const IcoRocket = (p) => <Svg {...p}><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" /></Svg>;
const IcoEye = (p) => <Svg {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></Svg>;
const IcoCheck = (p) => <Svg {...p}><polyline points="20 6 9 17 4 12" /></Svg>;
const IcoStop = (p) => <Svg {...p}><rect x="6" y="6" width="12" height="12" rx="2" /></Svg>;
const IcoClose = (p) => <Svg {...p}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></Svg>;
const IcoFile = (p) => <Svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></Svg>;
const IcoTemplate = (p) => <Svg {...p}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></Svg>;
const IcoPrinter = (p) => <Svg {...p}><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></Svg>;
const IcoShuffle = (p) => <Svg {...p}><polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" /><polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /><line x1="4" y1="4" x2="9" y2="9" /></Svg>;
const IcoMaximize = (p) => <Svg {...p}><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" /></Svg>;
const IcoWand = (p) => <Svg {...p}><path d="M14.5 4l2.5 2.5L7 16.5 4.5 14z" /><path d="M19 3l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" /></Svg>;
const IcoRefresh = (p) => <Svg {...p}><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></Svg>;
const IcoLightbulb = (p) => <Svg {...p}><path d="M9 18h6" /><path d="M10 22h4" /><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .5 2.5 1.5 3.5.76.76 1.23 1.52 1.41 2.5" /></Svg>;
const IcoBookmark = (p) => <Svg {...p}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></Svg>;
const IcoEdit = (p) => <Svg {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></Svg>;
const IcoTrash = (p) => <Svg {...p}><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></Svg>;
const IcoMatrix = (p) => (
  <Svg {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18" />
    <path d="M3 15h18" />
    <path d="M9 3v18" />
    <path d="M15 3v18" />
  </Svg>
);
const IcoUpload = (p) => (
  <Svg {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </Svg>
);
const IcoDownload = (p) => (
  <Svg {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </Svg>
);
const IcoMic = (p) => (
  <Svg {...p}>
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </Svg>
);

/* ============ THPT SUBJECTS ============ */
export const THPT_SUBJECTS = ['Hóa học', 'Sinh học', 'Vật lý', 'Toán học'];

/* ============ QUICK PROMPTS CAPSULES BY SUBJECT ============ */
const SUBJECT_QUICK_CHIPS = {
  'Hóa học': [
    {
      title: 'Dựng theo ma trận riêng của tôi',
      sub: 'Tải file Word/Excel/Ảnh hoặc dán ma trận của thầy/cô',
      prompt: 'Phân tích và dựng đề theo ma trận riêng của tôi',
      isCustomMatrix: true,
    },
    {
      title: 'Kiểm tra 15 phút: Este & Lipit',
      sub: 'Lớp 12 · 10 câu phân hóa · 15 phút',
      prompt: 'Kiểm tra 15 phút: Este & Lipit lớp 12, 10 câu',
    },
    {
      title: 'Đề 45 phút chuẩn 2025: Cân bằng hóa học',
      sub: 'Lớp 11 · 20 câu GDPT 2018 · 45 phút',
      prompt: 'Đề 45 phút chuẩn 2025: Cân bằng hóa học lớp 11, 20 câu',
    },
    {
      title: 'Đề 10 câu ôn tập: Cấu tạo nguyên tử & BTH',
      sub: 'Lớp 10 · 10 câu chuẩn GDPT 2018 · 25 phút',
      prompt: 'Đề 10 câu 25 phút lớp 10 cấu tạo nguyên tử và bảng tuần hoàn',
    },
    {
      title: 'Phiếu bài tập: Nồng độ mol & dung dịch',
      sub: 'Lớp 10 · 10 câu củng cố · 25 phút',
      prompt: 'Phiếu bài tập 10 câu: Nồng độ mol lớp 10',
    },
    {
      title: 'Đề thi thử THPTQG: Hóa học phân hóa sâu',
      sub: 'Lớp 12 · 28 câu chuẩn Bộ GD&ĐT · 50 phút',
      prompt: 'Đề thi thử THPTQG: 28 câu phân hóa sâu Hóa học 12',
    },
  ],
  'Sinh học': [
    {
      title: 'Dựng theo ma trận riêng của tôi',
      sub: 'Tải file Word/Excel/Ảnh hoặc dán ma trận của thầy/cô',
      prompt: 'Phân tích và dựng đề theo ma trận riêng của tôi',
      isCustomMatrix: true,
    },
    {
      title: 'Kiểm tra 15 phút: Di truyền phân tử & ADN',
      sub: 'Lớp 12 · 10 câu phân hóa · 15 phút',
      prompt: 'Kiểm tra 15 phút: Di truyền phân tử, nhân đôi ADN và mã di truyền lớp 12, 10 câu',
    },
    {
      title: 'Đề 45 phút chuẩn 2025: Quy luật Menđen',
      sub: 'Lớp 12 · 20 câu GDPT 2018 · 45 phút',
      prompt: 'Đề 45 phút chuẩn 2025: Quy luật di truyền của Menđen lớp 12, 20 câu',
    },
    {
      title: 'Đề 10 câu ôn tập: Tế bào nhân thực & Ti thể',
      sub: 'Lớp 10 · 10 câu chuẩn GDPT 2018 · 25 phút',
      prompt: 'Đề 10 câu 25 phút lớp 10 cấu trúc tế bào nhân thực và bào quan',
    },
    {
      title: 'Phiếu bài tập: Quang hợp & Hô hấp thực vật',
      sub: 'Lớp 11 · 10 câu củng cố · 25 phút',
      prompt: 'Phiếu bài tập 10 câu: Quang hợp và trao đổi nước ở thực vật lớp 11',
    },
    {
      title: 'Đề thi thử THPTQG: Sinh học phân hóa sâu',
      sub: 'Lớp 12 · 28 câu chuẩn Bộ GD&ĐT · 50 phút',
      prompt: 'Đề thi thử THPTQG: 28 câu phân hóa sâu Sinh học 12',
    },
  ],
  'Vật lý': [
    {
      title: 'Dựng theo ma trận riêng của tôi',
      sub: 'Tải file Word/Excel/Ảnh hoặc dán ma trận của thầy/cô',
      prompt: 'Phân tích và dựng đề theo ma trận riêng của tôi',
      isCustomMatrix: true,
    },
    {
      title: 'Kiểm tra 15 phút: Dao động điều hòa',
      sub: 'Lớp 12 · 10 câu phân hóa · 15 phút',
      prompt: 'Kiểm tra 15 phút: Dao động điều hòa và con lắc lò xo lớp 12, 10 câu',
    },
    {
      title: 'Đề 45 phút chuẩn 2025: Sóng cơ & Giao thoa',
      sub: 'Lớp 12 · 20 câu GDPT 2018 · 45 phút',
      prompt: 'Đề 45 phút chuẩn 2025: Sóng cơ và giao thoa sóng lớp 12, 20 câu',
    },
    {
      title: 'Đề 10 câu ôn tập: Động học & Định luật Newton',
      sub: 'Lớp 10 · 10 câu chuẩn GDPT 2018 · 25 phút',
      prompt: 'Đề 10 câu 25 phút lớp 10 chuyển động thẳng biến đổi đều và các định luật Newton',
    },
    {
      title: 'Phiếu bài tập: Điện trường & Định luật Coulomb',
      sub: 'Lớp 11 · 10 câu củng cố · 25 phút',
      prompt: 'Phiếu bài tập 10 câu: Điện trường và tụ điện lớp 11',
    },
    {
      title: 'Đề thi thử THPTQG: Vật lý chuẩn 3 phần Bộ',
      sub: 'Lớp 12 · 28 câu phân hóa sâu · 50 phút',
      prompt: 'Đề thi thử THPTQG: 28 câu phân hóa sâu Vật lý 12',
    },
  ],
  'Toán học': [
    {
      title: 'Dựng theo ma trận riêng của tôi',
      sub: 'Tải file Word/Excel/Ảnh hoặc dán ma trận của thầy/cô',
      prompt: 'Phân tích và dựng đề theo ma trận riêng của tôi',
      isCustomMatrix: true,
    },
    {
      title: 'Kiểm tra 15 phút: Tính đơn điệu & Cực trị',
      sub: 'Lớp 12 · 10 câu phân hóa · 15 phút',
      prompt: 'Kiểm tra 15 phút: Tính đơn điệu và cực trị hàm số lớp 12, 10 câu',
    },
    {
      title: 'Đề 45 phút chuẩn 2025: Khảo sát hàm số',
      sub: 'Lớp 12 · 20 câu GDPT 2018 · 45 phút',
      prompt: 'Đề 45 phút chuẩn 2025: Khảo sát sự biến thiên và đồ thị hàm số lớp 12, 20 câu',
    },
    {
      title: 'Đề 10 câu ôn tập: Mệnh đề & Bất phương trình',
      sub: 'Lớp 10 · 10 câu chuẩn GDPT 2018 · 25 phút',
      prompt: 'Đề 10 câu 25 phút lớp 10 mệnh đề tập hợp và hệ bất phương trình bậc nhất hai ẩn',
    },
    {
      title: 'Phiếu bài tập: Cấp số cộng & Cấp số nhân',
      sub: 'Lớp 11 · 10 câu củng cố · 25 phút',
      prompt: 'Phiếu bài tập 10 câu: Dãy số, cấp số cộng và cấp số nhân lớp 11',
    },
    {
      title: 'Đề thi thử THPTQG: Toán học chuẩn 2025',
      sub: 'Lớp 12 · 22 câu chuẩn cấu trúc mới · 90 phút',
      prompt: 'Đề thi thử THPTQG chuẩn 2025 môn Toán 12',
    },
  ],
};

/* Regex phát hiện lệnh sửa ma trận */
const MATRIX_REFINE_RE = /ma trận|matrix|cấu trúc|tỷ lệ|mức độ|thêm\s+\d+\s+câu|bớt\s+\d+\s+câu|giảm\s+\d+\s+câu|tăng\s+\d+\s+câu|nhận biết|thông hiểu|vận dụng/i;

/* ============================================================
   MAIN
   ============================================================ */
export default function AutoExamStudio({
  classes = [],
  initialClass = null,
  classInsights,
  initialPreset = null,
  onGenerated,   // ⭐ Prop mới: đẩy dữ liệu sang form thủ công
  onDone,
  onCancel,
}) {
  const { user } = useAuth();

  const [selectedClassId, setSelectedClassId] = useState(initialClass?.id || classes[0]?.id || '');
  const [selectedSubject, setSelectedSubject] = useState(() => {
    const s = initialClass?.subject || classes[0]?.subject;
    if (s) {
      if (/sinh/i.test(s)) return 'Sinh học';
      if (/hóa|hoa/i.test(s)) return 'Hóa học';
      if (/lý|vật/i.test(s)) return 'Vật lý';
      if (/toán|toan/i.test(s)) return 'Toán học';
      return s;
    }
    return 'Hóa học';
  });
  const [topic, setTopic] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [activeHubTab] = useState('exam');

  // Đồng bộ lớp khi danh sách classes tải xong hoặc initialClass thay đổi
  useEffect(() => {
    if (initialClass?.id && !selectedClassId) {
      setSelectedClassId(initialClass.id);
      return;
    }
    if (classes?.length && (!selectedClassId || !classes.some((c) => c.id === selectedClassId))) {
      const preferred = initialClass?.id && classes.some((c) => c.id === initialClass.id)
        ? initialClass.id
        : classes[0].id;
      setSelectedClassId(preferred || '');
    }
  }, [classes, initialClass?.id, selectedClassId]);

  // Cập nhật môn học và khối lớp THPT khi chọn lớp khác
  useEffect(() => {
    const c = classes.find((cls) => cls.id === selectedClassId) || initialClass;
    if (c?.subject) {
      if (/sinh/i.test(c.subject)) setSelectedSubject('Sinh học');
      else if (/hóa|hoa/i.test(c.subject)) setSelectedSubject('Hóa học');
      else if (/lý|vật/i.test(c.subject)) setSelectedSubject('Vật lý');
      else if (/toán|toan/i.test(c.subject)) setSelectedSubject('Toán học');
      else setSelectedSubject(c.subject);
    }
    const gStr = c?.grade ? String(c.grade) : '';
    if (THPT_GRADES.includes(gStr)) {
      setSelectedGrade(gStr);
    }
  }, [selectedClassId, classes, initialClass]);

  // Interview flow
  const [step, setStep] = useState(0);
  const [selectedGrade, setSelectedGrade] = useState(() => {
    const g = String(initialClass?.grade || classes[0]?.grade || '12');
    return THPT_GRADES.includes(g) ? g : '12';
  });
  const [selectedCount, setSelectedCount] = useState(10);
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [selectedFormat, setSelectedFormat] = useState(FORMAT_GDPT);

  // AI state
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [genProgress, setGenProgress] = useState({ done: 0, total: 0 });
  const [matrixData, setMatrixData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [workspaceTab, setWorkspaceTab] = useState('matrix');

  // Split resizer
  const [splitRatio, setSplitRatio] = useState(() => {
    try {
      const saved = localStorage.getItem('aes_split_ratio');
      const num = saved ? parseFloat(saved) : 0.40;
      return Number.isFinite(num) && num >= 0.25 && num <= 0.65 ? num : 0.40;
    } catch {
      return 0.40;
    }
  });
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const splitContainerRef = useRef(null);

  // Question AI actions
  const [rewriteModalIdx, setRewriteModalIdx] = useState(null);
  const [rewritePrompt, setRewritePrompt] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);
  const [regeneratingDistractorsIdx, setRegeneratingDistractorsIdx] = useState(null);
  const [pedagogyInsights, setPedagogyInsights] = useState({});
  const [savingBankIdx, setSavingBankIdx] = useState(null);
  const [savedBankKeys, setSavedBankKeys] = useState(() => new Set());
  const [isSavingAllToBank, setIsSavingAllToBank] = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editForm, setEditForm] = useState(null);

  // UI
  const [showSimulator, setShowSimulator] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showCustomMatrixModal, setShowCustomMatrixModal] = useState(false);
  const [customMatrixInputText, setCustomMatrixInputText] = useState('');
  const [customMatrixFiles, setCustomMatrixFiles] = useState([]);
  const [customMatrixGrade, setCustomMatrixGrade] = useState('12');
  const [customMatrixSubject, setCustomMatrixSubject] = useState(selectedSubject);
  const customMatrixFileInputRef = useRef(null);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [toast, setToast] = useState(null);

  // Xuất file & Voice Speech-to-Text & Lightbox
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const speechRecognitionRef = useRef(null);

  // Publish options
  const [publishTitle, setPublishTitle] = useState('');
  const [publishGradeType, setPublishGradeType] = useState('');
  const [publishShuffle, setPublishShuffle] = useState(true);
  const [publishCamera, setPublishCamera] = useState('off');
  const [cameraChecks, setCameraChecks] = useState({
    noFace: true, multiFace: true, lookAway: true, handRaise: true, phoneLike: true,
  });
  const [publishShowAnswer, setPublishShowAnswer] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);

  // Refs
  const fileInputRef = useRef(null);
  const feedEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  const [chatMessages, setChatMessages] = useState([]);
  const [slots, setSlots] = useState({ grade: null, count: null, duration: null });
  const notesRef = useRef('');

  const showWorkspace = Boolean(matrixData || questions.length > 0 || analyzing || generating || chatMessages.length > 0 || step > 0);

  // Lọc insight bài nộp của lớp — chỉ nhận đúng môn hiện tại để tránh lẫn lộn môn học
  const insightText = useMemo(() => {
    if (!classInsights) return '';
    const c = classes.find((cls) => cls.id === selectedClassId) || initialClass;
    if (c?.subject) {
      const clsSubj = c.subject.toLowerCase();
      const curSubj = selectedSubject.toLowerCase();
      if (!clsSubj.includes(curSubj) && !curSubj.includes(clsSubj)) {
        return '';
      }
    }
    const txt = classInsights?.forAi || '';
    if (/cities\s+of|unit\s+\d+|grammar|vocabulary|reading\s+comprehension/i.test(txt)) {
      return '';
    }
    return txt;
  }, [classInsights, selectedSubject, selectedClassId, classes, initialClass]);

  // Lọc điểm yếu nhất của lớp theo môn đang chọn
  const weakTopic = useMemo(() => {
    if (!classInsights?.weakestTopics?.length) return null;
    const item = classInsights.weakestTopics[0];
    if (!item?.topic) return null;
    const topicLower = item.topic.toLowerCase();

    const c = classes.find((cls) => cls.id === selectedClassId) || initialClass;
    if (c?.subject) {
      const clsSubj = c.subject.toLowerCase();
      const curSubj = selectedSubject.toLowerCase();
      if (!clsSubj.includes(curSubj) && !curSubj.includes(clsSubj)) {
        return null;
      }
    }

    if (/cities|future|unit\s+\d+|test\s+\d+|english|reading|grammar|vocabulary/i.test(topicLower)) {
      return null;
    }
    if (selectedSubject === 'Hóa học') {
      if (/dna|rna|gen\b|di\s*truyền|menđen|nhiễm\s*sắc|ti\s*thể|riboxom|ribosome|nguyên\s*phân|giảm\s*phân|quần\s*thể|hệ\s*sinh\s*thái/i.test(topicLower)) {
        return null;
      }
    } else if (selectedSubject === 'Sinh học') {
      if (/este|lipit|amino|cacbohidrat|kim\s*loại|halogen|anken|ankin|axit|bazo|điện\s*phân|dung\s*dịch|mol\b|cân\s*bằng\s*hóa/i.test(topicLower)) {
        return null;
      }
    }
    return item;
  }, [classInsights, selectedSubject, selectedClassId, classes, initialClass]);

  const isBusy = analyzing || generating;

  const showToast = (message, type = 'info') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 3200);
  };

  const greetingData = useMemo(() => {
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
    const rawDisplay = user?.displayName?.trim() || '';
    const emailName = user?.email?.split('@')?.[0] || '';
    const teacherName = rawDisplay || emailName || 'thầy cô';
    return { timeGreeting, teacherName };
  }, [user]);

  // Bloom cognitive summary visual
  const bloomSummary = useMemo(() => {
    if (matrixData?.summary) {
      const s = matrixData.summary;
      const total = matrixData.totalQuestions || 1;
      const nbCnt = s.nb?.count || 0;
      const thCnt = s.th?.count || 0;
      const vdCnt = s.vd?.count || 0;
      const vdcCnt = s.vdc?.count || 0;
      return {
        nb: { count: nbCnt, pts: s.nb?.points || 0, pct: Math.round((nbCnt / total) * 100) },
        th: { count: thCnt, pts: s.th?.points || 0, pct: Math.round((thCnt / total) * 100) },
        vd: { count: vdCnt, pts: s.vd?.points || 0, pct: Math.round((vdCnt / total) * 100) },
        vdc: { count: vdcCnt, pts: s.vdc?.points || 0, pct: Math.round((vdcCnt / total) * 100) },
      };
    }
    if (questions.length > 0) {
      const total = questions.length;
      let nbCnt = 0, thCnt = 0, vdCnt = 0, vdcCnt = 0;
      let nbPts = 0, thPts = 0, vdPts = 0, vdcPts = 0;
      questions.forEach((q) => {
        const lv = normLevel(q.level);
        const pts = Number(q.points) || 0.5;
        if (lv === 'vdc') { vdcCnt++; vdcPts += pts; }
        else if (lv === 'vd') { vdCnt++; vdPts += pts; }
        else if (lv === 'th') { thCnt++; thPts += pts; }
        else { nbCnt++; nbPts += pts; }
      });
      return {
        nb: { count: nbCnt, pts: Math.round(nbPts * 10) / 10, pct: Math.round((nbCnt / total) * 100) },
        th: { count: thCnt, pts: Math.round(thPts * 10) / 10, pct: Math.round((thCnt / total) * 100) },
        vd: { count: vdCnt, pts: Math.round(vdPts * 10) / 10, pct: Math.round((vdCnt / total) * 100) },
        vdc: { count: vdcCnt, pts: Math.round(vdcPts * 10) / 10, pct: Math.round((vdcCnt / total) * 100) },
      };
    }
    return null;
  }, [matrixData, questions]);

  // Auto scroll
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, step, analyzing, generating]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  // Sync publish title
  useEffect(() => {
    if (matrixData?.title) setPublishTitle(matrixData.title);
    else if (topic) setPublishTitle(`Đề kiểm tra ${topic} — Lớp ${selectedGrade}`);
  }, [matrixData, topic, selectedGrade]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  /* Tự động điền gợi ý tạo đề ôn bù hổng từ InsightPanel nếu có initialPreset hoặc remedial preset */
  useEffect(() => {
    let preset = initialPreset;
    if (!preset) {
      try {
        const stored = localStorage.getItem('aes_remedial_preset');
        if (stored) {
          preset = JSON.parse(stored);
          localStorage.removeItem('aes_remedial_preset');
        }
      } catch {}
    }
    if (!preset) return;
    if (preset.subject) {
      if (/sinh/i.test(preset.subject)) setSelectedSubject('Sinh học');
      else if (/hóa|hoa/i.test(preset.subject)) setSelectedSubject('Hóa học');
      else if (/lý|vật/i.test(preset.subject)) setSelectedSubject('Vật lý');
      else if (/toán|toan/i.test(preset.subject)) setSelectedSubject('Toán học');
    }
    const topicsStr = Array.isArray(preset.topics) && preset.topics.length
      ? preset.topics.join(', ')
      : preset.title || preset.topic || 'Ôn tập củng cố';
    const cnt = Number(preset.count) || 10;
    const promptStr = `Tạo đề ôn tập ${cnt} câu chuyên đề: ${topicsStr}. ${preset.hint || ''}`.trim();
    setTopic(topicsStr);
    setSelectedCount(cnt);
    setInputMessage(promptStr);
    inputRef.current?.focus();
    showToast(`Đã nạp đề ôn bù điểm yếu: "${topicsStr}"`, 'info');
  }, [initialPreset]);

  /* ============ LƯU / LOAD LỊCH SỬ CHAT ============ */
  useEffect(() => {
    try {
      const savedChat = localStorage.getItem('aes_chat_history');
      const savedMatrix = localStorage.getItem('aes_matrix');
      const savedQuestions = localStorage.getItem('aes_questions');
      const savedTopic = localStorage.getItem('aes_topic');
      const savedStep = localStorage.getItem('aes_step');
      const savedSlots = localStorage.getItem('aes_slots');
      const savedSubject = localStorage.getItem('aes_subject');

      if (!initialClass?.subject && savedSubject && THPT_SUBJECTS.includes(savedSubject)) {
        setSelectedSubject(savedSubject);
      }
      if (savedChat) {
        const parsed = JSON.parse(savedChat);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setChatMessages(parsed.slice(-50));
        }
      }
      if (savedMatrix) setMatrixData(JSON.parse(savedMatrix));
      if (savedQuestions) {
        const q = JSON.parse(savedQuestions);
        if (Array.isArray(q) && q.length > 0) setQuestions(q);
      }
      if (savedTopic) setTopic(savedTopic);
      if (savedStep) setStep(Number(savedStep) || 0);
      if (savedSlots) setSlots(JSON.parse(savedSlots));
    } catch (e) {
      console.warn('[AutoExamStudio] Load lịch sử fail:', e);
    }
  }, []);

  // Save khi có thay đổi (debounced 800ms)
  useEffect(() => {
    if (chatMessages.length === 0 && !matrixData && questions.length === 0) return;
    const timer = setTimeout(() => {
      try {
        if (chatMessages.length > 0) {
          localStorage.setItem('aes_chat_history', JSON.stringify(chatMessages.slice(-50)));
        }
        if (matrixData) {
          localStorage.setItem('aes_matrix', JSON.stringify(matrixData));
        }
        if (questions.length > 0) {
          localStorage.setItem('aes_questions', JSON.stringify(questions));
        }
        if (topic) localStorage.setItem('aes_topic', topic);
        if (selectedSubject) localStorage.setItem('aes_subject', selectedSubject);
        if (step > 0) localStorage.setItem('aes_step', String(step));
        if (slots.grade || slots.count || slots.duration) {
          localStorage.setItem('aes_slots', JSON.stringify(slots));
        }
      } catch (e) {
        console.warn('[AutoExamStudio] Save lịch sử fail:', e);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [chatMessages, matrixData, questions, topic, selectedSubject, step, slots]);

  /* ============ DRAGGABLE RESIZER ============ */
  const handleSplitPointerDown = (e) => {
    e.preventDefault();
    setIsDraggingSplit(true);
    const container = splitContainerRef.current;
    if (!container) return;

    const onPointerMove = (moveEvt) => {
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0) return;
      const clientX = moveEvt.clientX;
      const newRatio = (clientX - rect.left) / rect.width;
      const clamped = Math.min(0.65, Math.max(0.25, newRatio));
      setSplitRatio(clamped);
    };

    const onPointerUp = () => {
      setIsDraggingSplit(false);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      setSplitRatio((final) => {
        try {
          localStorage.setItem('aes_split_ratio', final.toFixed(3));
        } catch {
          // ignore
        }
        return final;
      });
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const handleSplitDoubleClick = () => {
    setSplitRatio(0.40);
    try {
      localStorage.setItem('aes_split_ratio', '0.400');
    } catch {
      // ignore
    }
    sound.ding();
  };

  const handleSplitKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setSplitRatio((r) => {
        const next = Math.max(0.25, r - 0.02);
        try { localStorage.setItem('aes_split_ratio', next.toFixed(3)); } catch { /* ignore */ }
        return next;
      });
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setSplitRatio((r) => {
        const next = Math.min(0.65, r + 0.02);
        try { localStorage.setItem('aes_split_ratio', next.toFixed(3)); } catch { /* ignore */ }
        return next;
      });
    }
  };

  /* ============ FILE HANDLING ============ */
  const handleFileSelect = async (e) => {
    const fileList = Array.from(e.target.files || []);
    if (!fileList.length) return;
    try {
      const errs = validateFiles(fileList);
      if (errs && errs.length > 0) {
        showToast(errs[0], 'error');
        return;
      }
      const loaded = await Promise.all(fileList.map((f) => readFile(f)));
      setAttachedFiles((prev) => [...prev, ...loaded]);
      showToast(`Đã đính kèm ${loaded.length} tệp tài liệu`, 'success');
      sound.ding();
    } catch (err) {
      showToast(err.message || 'Lỗi đọc tệp', 'error');
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveFile = (idx) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCustomMatrixFileSelect = async (e) => {
    const fileList = Array.from(e.target.files || []);
    if (!fileList.length) return;
    try {
      const errs = validateFiles(fileList);
      if (errs && errs.length > 0) {
        showToast(errs[0], 'error');
        return;
      }
      const loaded = await Promise.all(fileList.map((f) => readFile(f)));
      setCustomMatrixFiles((prev) => [...prev, ...loaded]);
      showToast(`Đã đính kèm ${loaded.length} tệp ma trận`, 'success');
      sound.ding();
    } catch (err) {
      showToast(err.message || 'Lỗi đọc tệp ma trận', 'error');
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const showCustomMatrixModalRef = useRef(showCustomMatrixModal);
  useEffect(() => {
    showCustomMatrixModalRef.current = showCustomMatrixModal;
  }, [showCustomMatrixModal]);

  // Window drag & drop listener — cho phép kéo thả file vào bất kỳ đâu trên màn hình
  useEffect(() => {
    let dragCounter = 0;

    const handleWindowDragEnter = (e) => {
      e.preventDefault();
      const types = Array.from(e.dataTransfer?.types || []);
      if (types.includes('Files')) {
        dragCounter += 1;
        setIsDraggingFile(true);
      }
    };

    const handleWindowDragOver = (e) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
    };

    const handleWindowDragLeave = (e) => {
      e.preventDefault();
      dragCounter = Math.max(0, dragCounter - 1);
      if (dragCounter === 0) {
        setIsDraggingFile(false);
      }
    };

    const handleWindowDrop = (e) => {
      e.preventDefault();
      dragCounter = 0;
      setIsDraggingFile(false);
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        if (showCustomMatrixModalRef.current) {
          handleCustomMatrixFileSelect({ target: { files } });
        } else {
          handleFileSelect({ target: { files } });
        }
      }
    };

    window.addEventListener('dragenter', handleWindowDragEnter);
    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('dragleave', handleWindowDragLeave);
    window.addEventListener('drop', handleWindowDrop);

    return () => {
      window.removeEventListener('dragenter', handleWindowDragEnter);
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('dragleave', handleWindowDragLeave);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, []);

  const handleExecuteCustomMatrix = () => {
    if (!customMatrixInputText.trim() && !customMatrixFiles.length && !attachedFiles.length) {
      showToast('Vui lòng tải file ma trận hoặc dán nội dung ma trận', 'error');
      return;
    }
    const txt = customMatrixInputText.trim();
    const fls = customMatrixFiles.length ? customMatrixFiles : attachedFiles;
    const targetGrade = customMatrixGrade || selectedGrade || '12';
    const targetSubject = customMatrixSubject || selectedSubject || 'Hóa học';
    setShowCustomMatrixModal(false);
    setCustomMatrixInputText('');
    setCustomMatrixFiles([]);
    setSelectedGrade(targetGrade);
    setSelectedSubject(targetSubject);
    handleParseTeacherCustomMatrix({ text: txt, files: fls, grade: targetGrade, subject: targetSubject });
  };

  /* ============ XUẤT FILE WORD (.docx) & TẢI 4 MÃ ĐỀ (.zip) ============ */
  const handleDownloadDocx = async () => {
    if (!questions.length) return;
    setIsExportingDocx(true);
    try {
      showToast('Đang khởi tạo file Word (.docx) chuẩn Bộ GD&ĐT...', 'info');
      await exportToWord({
        examTitle: publishTitle || topic || `Đề kiểm tra ${selectedSubject}`,
        subject: selectedSubject,
        grade: selectedGrade,
        duration: selectedDuration,
        code: '101',
        questions,
        includeAnswers: true,
        headerInfo: {
          deptName: 'SỞ GIÁO DỤC VÀ ĐÀO TẠO',
          schoolName: 'TRƯỜNG THPT',
          examName: publishTitle || topic || 'ĐỀ KIỂM TRA ĐỊNH KỲ',
          subject: selectedSubject.toUpperCase(),
          grade: selectedGrade,
          duration: selectedDuration,
        },
      });
      showToast('Đã tải xuống file Word (.docx) thành công!', 'success');
      sound.cheer();
    } catch (err) {
      showToast(`Lỗi xuất file Word: ${err.message}`, 'error');
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handleDownloadZip = async () => {
    if (!questions.length) return;
    setIsExportingZip(true);
    try {
      showToast('Đang hoán vị đảo 4 mã đề & đóng gói ZIP...', 'info');
      const versions = generateShuffledVersions(questions, 4, {
        keepDifficultyGroups: true,
        shufflePart1: true,
        shufflePart2: true,
        shufflePart3: true,
      });
      await exportBundleZip({
        examTitle: publishTitle || topic || `Đề kiểm tra ${selectedSubject} chuẩn Bộ GD&ĐT`,
        versions,
        originalQuestions: questions,
        subject: selectedSubject,
        grade: selectedGrade,
        duration: selectedDuration,
        headerInfo: {
          deptName: 'SỞ GIÁO DỤC VÀ ĐÀO TẠO',
          schoolName: 'TRƯỜNG THPT',
          examName: publishTitle || topic || 'ĐỀ KIỂM TRA ĐỊNH KỲ',
          subject: selectedSubject.toUpperCase(),
          grade: selectedGrade,
          duration: selectedDuration,
        },
      });
      showToast('Đã tải xuống trọn bộ 4 mã đề (ZIP) thành công!', 'success');
      sound.cheer();
    } catch (err) {
      showToast(`Lỗi tạo file ZIP: ${err.message}`, 'error');
    } finally {
      setIsExportingZip(false);
    }
  };

  /* ============ VOICE SPEECH-TO-TEXT ============ */
  const handleToggleVoice = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      showToast('Trình duyệt chưa hỗ trợ nhận diện giọng nói. Bạn hãy dùng Chrome hoặc Edge nhé.', 'error');
      return;
    }
    if (isListeningVoice) {
      if (speechRecognitionRef.current) {
        try { speechRecognitionRef.current.stop(); } catch {}
      }
      setIsListeningVoice(false);
      return;
    }
    try {
      const rec = new SpeechRec();
      rec.lang = 'vi-VN';
      rec.interimResults = false;
      rec.continuous = false;
      rec.onstart = () => {
        setIsListeningVoice(true);
        showToast('Đang lắng nghe... Thầy/cô hãy nói yêu cầu tạo đề nhé!', 'info');
      };
      rec.onresult = (e) => {
        const spoken = e.results?.[0]?.[0]?.transcript;
        if (spoken) {
          setInputMessage((prev) => (prev ? `${prev.trim()} ${spoken}` : spoken));
          sound.ding();
          showToast(`Đã nhận diện: "${spoken}"`, 'success');
        }
      };
      rec.onerror = (e) => {
        setIsListeningVoice(false);
        if (e.error !== 'no-speech') {
          showToast(`Lỗi giọng nói: ${e.error}`, 'error');
        }
      };
      rec.onend = () => {
        setIsListeningVoice(false);
      };
      speechRecognitionRef.current = rec;
      rec.start();
    } catch (err) {
      setIsListeningVoice(false);
      showToast('Không khởi động được micro', 'error');
    }
  };

  /* ============ HỦY TIẾN TRÌNH ============ */
  const handleCancelProcess = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setAnalyzing(false);
    setGenerating(false);
    showToast('Đã dừng tiến trình AI', 'info');
    setChatMessages((prev) => [
      ...prev.filter((m) => m.role !== 'trace_loading'),
      { role: 'ai', text: 'Thầy/cô đã dừng. Có thể gửi yêu cầu khác bất cứ lúc nào.' },
    ]);
  };

  /* ============ CHỌN BƯỚC INTERVIEW ============ */
  const proceedInterview = ({ grade, count, duration, topic: t, format, subject }) => {
    const curSubj = subject || selectedSubject;
    const shape = inferExamShape({ count, duration });
    setSlots({ grade, count: shape.count, duration: shape.duration });
    if (grade) setSelectedGrade(grade);
    if (shape.count) setSelectedCount(shape.count);
    if (shape.duration) setSelectedDuration(shape.duration);

    if (!grade) {
      setChatMessages((prev) => [...prev, { role: 'ai', text: `Bài tập môn ${curSubj} này dành cho học sinh lớp mấy?` }]);
      setStep(1);
      return;
    }
    if (!shape.count || !shape.duration) {
      setChatMessages((prev) => [...prev, { role: 'ai', text: 'Đề gồm bao nhiêu câu và thời lượng làm bài?' }]);
      setStep(2);
      return;
    }
    if (shape.inferred) {
      setChatMessages((prev) => [
        ...prev,
        { role: 'summary', text: `AI tự đề xuất: ${shape.count} câu · ${shape.duration} phút (có thể chỉnh sau)` },
      ]);
    }
    handlePlanMatrix({
      targetTopic: t,
      grade,
      count: shape.count,
      duration: shape.duration,
      subject: curSubj,
      ...(format ? { format } : {}),
    });
  };

  const handleSelectGrade = (g) => {
    sound.ding();
    setChatMessages((prev) => [...prev, { role: 'summary', text: `Dành cho học sinh lớp ${g}` }]);
    proceedInterview({ grade: g, count: slots.count, duration: slots.duration, topic, subject: selectedSubject });
  };

  const handleSelectCount = (cnt, dur) => {
    setSelectedCount(cnt);
    setSelectedDuration(dur);
    setSlots((sl) => ({ ...sl, count: cnt, duration: dur }));
    sound.ding();
    setChatMessages((prev) => [
      ...prev,
      { role: 'summary', text: `Đề gồm: ${cnt} câu · Thời lượng: ${dur} phút` },
      { role: 'ai', text: `Thầy/cô muốn cấu trúc đề theo định dạng nào? (Gợi ý cho ${cnt} câu: ${suggestFormat(cnt).startsWith('Chuẩn') ? 'chuẩn thi 3 phần' : 'trắc nghiệm'})` },
    ]);
    setStep(3);
  };

  /* ============ LẬP MA TRẬN ============ */
  const handlePlanMatrix = async ({
    targetTopic = topic,
    grade = selectedGrade,
    count = selectedCount,
    duration = selectedDuration,
    format = selectedFormat,
    customPrompt = notesRef.current,
    subject = selectedSubject,
  } = {}) => {
    sound.ding();
    setStep(4);
    setAnalyzing(true);
    abortControllerRef.current = new AbortController();

    const cleanTopic = targetTopic || `Kiến thức trọng tâm ${subject}`;
    setTopic(cleanTopic);

    setChatMessages((prev) => [
      ...prev,
      { role: 'summary', text: `Môn: ${subject} · Lớp ${grade} · Định dạng: ${format}` },
      {
        role: 'trace_loading',
        text: insightText
          ? `Đang đọc dữ liệu điểm yếu môn ${subject} và lập ma trận khảo thí...`
          : `Đang phân tích chương trình GDPT 2018 môn ${subject} và lập ma trận...`,
      },
    ]);

    try {
      const planned = await planMatrixWithAI({
        topic: cleanTopic,
        grade,
        subject,
        count,
        duration,
        format,
        intent: activeHubTab === 'sheet' ? 'sheet' : activeHubTab === 'lecture' ? 'lecture' : 'exam',
        customPrompt,
        classInsights: insightText,
        files: attachedFiles,
        signal: abortControllerRef.current.signal,
      });

      setMatrixData(planned);
      setWorkspaceTab('matrix');
      sound.cheer();

      setChatMessages((prev) => [
        ...prev.filter((m) => m.role !== 'trace_loading'),
        {
          role: 'trace_done',
          title: `Đã lập ma trận môn ${subject} (${planned.totalQuestions || count} câu chuẩn Bộ GD&ĐT)`,
          steps: [
            insightText ? 'Đã tích hợp điểm yếu từ bài nộp của lớp.' : `Đã phân tích mục tiêu chuẩn kiến thức môn ${subject}.`,
            attachedFiles.length
              ? `Đã bám sát ${attachedFiles.length} tài liệu đính kèm.`
              : 'Đã cân đối 4 mức độ: Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao.',
            'Mời thầy/cô xem ma trận trực quan bên phải rồi bấm "Xác nhận & Sinh đề".',
          ],
        },
        {
          role: 'ai_advice',
          text: planned.aiPedagogicalAdvice ||
            `Đã lập ma trận ${count} câu / ${duration} phút cho chủ đề "${cleanTopic}". Thầy/cô có thể tinh chỉnh hoặc bấm xác nhận để sinh đề.`,
        },
        { role: 'chips', items: ['Tăng 2 câu vận dụng', 'Giảm 2 câu nhận biết', 'Thêm câu tính toán'] },
      ]);
    } catch (e) {
      if (e?.name === 'AbortError') return;
      console.error(e);
      const msg = e.message || 'Không lập được ma trận.';
      showToast(msg, 'error');
      setChatMessages((prev) => [
        ...prev.filter((m) => m.role !== 'trace_loading'),
        { role: 'ai', text: `Chưa thể lập ma trận: ${msg}. Thầy/cô vui lòng thử lại.` },
      ]);
      setStep(3);
    } finally {
      setAnalyzing(false);
    }
  };

  /* ============ DỰNG MA TRẬN RIÊNG CỦA GIÁO VIÊN ============ */
  const handleParseTeacherCustomMatrix = async ({
    text = '',
    files = attachedFiles,
    grade = selectedGrade,
    subject = selectedSubject,
  } = {}) => {
    sound.ding();
    setStep(4);
    setAnalyzing(true);
    abortControllerRef.current = new AbortController();

    const targetGrade = grade || selectedGrade || '12';
    const targetSubject = subject || selectedSubject || 'Hóa học';
    setSelectedGrade(targetGrade);
    setSelectedSubject(targetSubject);

    setChatMessages((prev) => [
      ...prev,
      {
        role: 'trace_loading',
        text: `Đang bóc tách và phân tích ma trận riêng môn ${targetSubject} của thầy/cô từ tài liệu...`,
      },
    ]);

    try {
      const parsed = await parseTeacherCustomMatrixWithAI({
        text,
        files,
        subject: targetSubject,
        grade: targetGrade,
        signal: abortControllerRef.current.signal,
      });

      setMatrixData(parsed);
      setTopic(parsed.title);
      setSelectedGrade(parsed.grade);
      setSelectedDuration(parsed.duration);
      setSelectedCount(parsed.totalQuestions);
      setWorkspaceTab('matrix');
      sound.cheer();

      const summary = parsed.summary || {};
      setChatMessages((prev) => [
        ...prev.filter((m) => m.role !== 'trace_loading'),
        {
          role: 'trace_done',
          title: `Đã dựng thành công ma trận riêng (${parsed.totalQuestions} câu · ${parsed.duration} phút)`,
          steps: [
            `Đã phân tích chính xác ${parsed.parts.length} phần thi từ ma trận của thầy/cô.`,
            `Phân bổ mức độ nhận thức: ${summary.nb?.count || 0} Nhận biết, ${summary.th?.count || 0} Thông hiểu, ${summary.vd?.count || 0} Vận dụng, ${summary.vdc?.count || 0} Vận dụng cao.`,
            'Mời thầy/cô xem bảng ma trận bên phải rồi bấm "Xác nhận & Sinh câu hỏi"!',
          ],
        },
        {
          role: 'ai_advice',
          text: parsed.aiPedagogicalAdvice ||
            `Đã hoàn thành dựng ma trận riêng theo cấu trúc thầy/cô gửi. Thầy/cô có thể kiểm tra từng ô bên phải hoặc bấm sinh câu hỏi ngay.`,
        },
        { role: 'chips', items: ['Xác nhận & Sinh câu hỏi theo ma trận', 'Tăng 2 câu vận dụng', 'Giảm 2 câu nhận biết'] },
      ]);
      showToast('Đã dựng thành công ma trận riêng!', 'success');
    } catch (e) {
      if (e?.name === 'AbortError') return;
      console.error(e);
      const msg = e.message || 'Không phân tích được ma trận riêng.';
      showToast(msg, 'error');
      setChatMessages((prev) => [
        ...prev.filter((m) => m.role !== 'trace_loading'),
        { role: 'ai', text: `Chưa thể dựng ma trận: ${msg}. Thầy/cô vui lòng kiểm tra lại file hoặc mô tả rõ hơn.` },
      ]);
      setStep(3);
    } finally {
      setAnalyzing(false);
    }
  };

  /* ============ CHỈNH MA TRẬN ============ */
  const handleRefineMatrix = async (instruction) => {
    if (!instruction?.trim() || !matrixData) return;
    setAnalyzing(true);
    abortControllerRef.current = new AbortController();

    setChatMessages((prev) => [
      ...prev,
      { role: 'user', text: instruction },
      { role: 'trace_loading', text: 'Đang điều chỉnh ma trận theo yêu cầu...' },
    ]);

    try {
      const updated = await refineMatrixWithAI({
        matrix: matrixData,
        instruction,
        classInsights: insightText,
        signal: abortControllerRef.current.signal,
      });
      setMatrixData(updated);
      sound.cheer();
      showToast('Đã cập nhật ma trận', 'success');
      setChatMessages((prev) => [
        ...prev.filter((m) => m.role !== 'trace_loading'),
        { role: 'ai', text: `Đã cập nhật ma trận theo yêu cầu: "${instruction}".` },
      ]);
    } catch (err) {
      if (err?.name === 'AbortError') return;
      showToast(err.message || 'Chưa thể chỉnh sửa', 'error');
      setChatMessages((prev) => [
        ...prev.filter((m) => m.role !== 'trace_loading'),
        { role: 'ai', text: `Lỗi: ${err.message}` },
      ]);
    } finally {
      setAnalyzing(false);
    }
  };

  /* ============ SINH CÂU HỎI ============ */
  const handleConfirmAndGenerateQuestions = async () => {
    if (!matrixData || generating) return;
    setGenerating(true);
    setGenProgress({ done: 0, total: 1 });
    abortControllerRef.current = new AbortController();
    sound.ding();

    setChatMessages((prev) => [
      ...prev,
      { role: 'user', text: 'Xác nhận & Sinh câu hỏi theo ma trận' },
      {
        role: 'trace_loading',
        text: `Đang biên soạn ${matrixData.totalQuestions || selectedCount} câu hỏi chuẩn hóa...`,
      },
    ]);

    try {
      const qList = await generateQuestionsFromApprovedMatrix({
        matrix: matrixData,
        files: attachedFiles,
        classInsights: insightText,
        onProgress: (done, total) => setGenProgress({ done, total }),
        onPartial: (part) => {
          setQuestions(part);
          setWorkspaceTab('questions');
        },
        signal: abortControllerRef.current.signal,
      });

      setQuestions(qList);
      setStep(5);
      setWorkspaceTab('questions');
      sound.cheer();
      showToast(`Đã hoàn thành biên soạn ${qList.length} câu hỏi!`, 'success');
      runVerify(qList, { silent: true });

      setChatMessages((prev) => [
        ...prev.filter((m) => m.role !== 'trace_loading'),
        {
          role: 'ai',
          text: `Đã hoàn tất ${qList.length} câu hỏi theo ma trận đã duyệt! Thầy/cô có thể kiểm tra từng câu bên phải, nhờ AI đổi phương án nhiễu hoặc xuất bản vào Lớp.`,
        },
        { role: 'chips', items: ['Viết lại câu 1 khó hơn', 'Đổi phương án nhiễu câu 2', 'Kiểm tra lại đáp án'] },
      ]);
    } catch (e) {
      if (e?.name === 'AbortError') return;
      console.error(e);
      showToast(e.message || 'Lỗi biên soạn câu hỏi', 'error');
      setChatMessages((prev) => [
        ...prev.filter((m) => m.role !== 'trace_loading'),
        { role: 'ai', text: `Có lỗi: ${e.message}. Thử lại.` },
      ]);
    } finally {
      setGenerating(false);
    }
  };

  /* ============ SOÁT ĐÁP ÁN BẰNG AI (chạy nền) ============ */
  const runVerify = async (list = questions, { silent = false } = {}) => {
    if (!list.length || verifying) return;
    setVerifying(true);
    try {
      const res = await verifyQuestionsWithAI({ questions: list, grade: selectedGrade, subject: selectedSubject });
      const byId = new Map(res.questions.map((q) => [q.id, q.verify]));
      setQuestions((prev) => prev.map((q) => (byId.has(q.id) ? { ...q, verify: byId.get(q.id) } : q)));
      const n = res.mismatches.length;
      if (n) {
        showToast(`AI nghi ngờ đáp án ${n} câu: ${res.mismatches.map((i) => i + 1).join(', ')}. Kiểm tra huy hiệu cảnh báo.`, 'error');
      } else if (!silent || res.checked) {
        showToast(`Đã soát ${res.checked}/${list.length} câu — đáp án khớp.`, 'success');
      }
      return res;
    } catch (e) {
      if (!silent) showToast(e.message || 'Không soát được đáp án', 'error');
      return null;
    } finally {
      setVerifying(false);
    }
  };

  /* ============ LỆNH NHANH (không gọi AI) ============ */
  const handleLocalCommand = async (cmd, text) => {
    setChatMessages((prev) => [...prev, { role: 'user', text }]);
    const say = (t) => setChatMessages((prev) => [...prev, { role: 'ai', text: t }]);
    if (cmd.type === 'outOfRange') { say(`Đề chỉ có ${questions.length} câu, không có câu ${cmd.n}.`); return; }
    if (cmd.type === 'delete') {
      setQuestions((prev) => prev.filter((_, i) => i !== cmd.index));
      say(`Đã xóa Câu ${cmd.index + 1}.`);
    } else if (cmd.type === 'setCorrect') {
      const q = questions[cmd.index];
      if ((q.type || 'single_choice') !== 'single_choice') { say(`Câu ${cmd.index + 1} không phải câu trắc nghiệm 4 lựa chọn.`); return; }
      setQuestions((prev) => prev.map((it, i) => (i === cmd.index ? { ...it, correct: cmd.option, verify: { status: 'unchecked' } } : it)));
      say(`Đã đặt đáp án đúng Câu ${cmd.index + 1} là ${'ABCD'[cmd.option]}.`);
    } else if (cmd.type === 'verify') {
      say('Đang cho AI giải lại từng câu để đối chiếu đáp án...');
      const res = await runVerify(questions);
      if (res) say(res.mismatches.length ? `AI không đồng ý đáp án ở: ${res.mismatches.map((i) => `Câu ${i + 1}`).join(', ')}. Mở tab Câu hỏi để xem và bấm "Theo AI" nếu thấy AI đúng.` : 'Tất cả đáp án đã khớp với lời giải độc lập của AI.');
    } else if (cmd.type === 'bank') {
      handleSaveAllToBank();
    } else if (cmd.type === 'publish') {
      handleOpenPublishModal();
    } else if (cmd.type === 'tab') {
      setWorkspaceTab(cmd.tab);
    }
  };

  /* ============ SỬA CÂU HỎI QUA CHAT ============ */
  const handleChatQuestionEdit = async (cmd, text) => {
    const idx = cmd.index;
    const targetQ = questions[idx];
    if (!targetQ) return;
    setAnalyzing(true);
    setChatMessages((prev) => [
      ...prev,
      { role: 'user', text },
      { role: 'trace_loading', text: cmd.kind === 'distractors' ? `Đang tạo lại phương án nhiễu Câu ${idx + 1}...` : `Đang viết lại Câu ${idx + 1}...` },
    ]);
    try {
      const updated = cmd.kind === 'distractors'
        ? await regenerateDistractorsWithAI({ question: targetQ, grade: selectedGrade, subject: selectedSubject })
        : await rewriteQuestionWithAI({ question: targetQ, instruction: text, grade: selectedGrade, subject: selectedSubject });
      setQuestions((prev) => prev.map((it, i) => (i === idx ? updated : it)));
      setWorkspaceTab('questions');
      sound.cheer();
      setChatMessages((prev) => [
        ...prev.filter((m) => m.role !== 'trace_loading'),
        { role: 'ai', text: `Đã cập nhật Câu ${idx + 1}. Thầy/cô xem kết quả ở tab "Câu hỏi" bên phải.` },
      ]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev.filter((m) => m.role !== 'trace_loading'),
        { role: 'ai', text: `Chưa sửa được Câu ${idx + 1}: ${err.message || 'lỗi không xác định'}. Thử lại nhé.` },
      ]);
    } finally {
      setAnalyzing(false);
    }
  };

  /* ============ GỬI TIN NHẮN (FIX #4) ============ */
  const handleSendMessage = async (overrideText) => {
    let text = (typeof overrideText === 'string' ? overrideText : inputMessage).trim();
    if (!text && attachedFiles.length === 0) return;

    if (isBusy) {
      showToast('AI đang xử lý. Vui lòng đợi hoặc bấm "Dừng AI".', 'info');
      return;
    }

    const hasExplicitMatrixFile = attachedFiles.length > 0 && attachedFiles.some((f) =>
      /ma\s*tr[ậa]n|matrix|cautruc|dacta|khung/i.test(f.name || '') || f.kind === 'image'
    );
    const mentionsMatrix = /ma\s*tr[ậa]n|b[ảa]ng\s*đ[ặa]c\s*t[ảa]|khung\s*ma\s*tr[ậa]n|g[ửu]i\s*ma\s*tr[ậa]n/i.test(text);

    if (!text && attachedFiles.length > 0) {
      text = hasExplicitMatrixFile
        ? 'Phân tích ma trận từ tài liệu đính kèm'
        : 'Tạo đề thi bám sát tài liệu đính kèm';
    }

    setInputMessage('');
    sound.ding();

    // Ưu tiên lệnh sửa câu hỏi khi đã có questions
    if (questions.length > 0) {
      const local = parseLocalCommand(text, questions.length);
      if (local) {
        handleLocalCommand(local, text);
        return;
      }
      const cmd = parseQuestionCommand(text, questions.length);
      if (cmd) {
        handleChatQuestionEdit(cmd, text);
        return;
      }
      if (matrixData && MATRIX_REFINE_RE.test(text)) {
        handleRefineMatrix(text);
        return;
      }
      setChatMessages((prev) => [
        ...prev,
        { role: 'user', text },
        {
          role: 'ai',
          text: 'Tôi chưa hiểu yêu cầu. Thầy/cô có thể:\n'
            + '• Sửa câu hỏi: "viết lại câu 3", "đổi phương án nhiễu câu 2", "câu 1 khó hơn"\n'
            + '• Lệnh nhanh: "xóa câu 5", "câu 2 đáp án là C", "kiểm tra lại đáp án", "xem bản in A4"\n'
            + '• Sửa ma trận: "tăng 2 câu vận dụng", "giảm 2 câu nhận biết"\n'
            + '• Hoặc bấm "Xóa lịch sử" để tạo đề mới.',
        },
      ]);
      return;
    }

    // Chưa có questions nhưng có ma trận → sinh đề hoặc refine ma trận
    if (matrixData) {
      if (/xác nhận|sinh câu hỏi|sinh đề|bắt đầu sinh/i.test(text)) {
        handleConfirmAndGenerateQuestions();
        return;
      }
      handleRefineMatrix(text);
      return;
    }

    // Kiểm tra nếu giáo viên gửi ma trận riêng (qua file đính kèm hoặc văn bản mô tả ma trận)
    const isCustomMatrix = mentionsMatrix || (hasExplicitMatrixFile && !/đề\s+\d+\s+câu/i.test(text));

    if (isCustomMatrix && (attachedFiles.length > 0 || text.length > 15)) {
      setChatMessages((prev) => [...prev, { role: 'user', text: text || 'Phân tích ma trận từ tài liệu đính kèm' }]);
      handleParseTeacherCustomMatrix({ text, files: attachedFiles });
      return;
    }

    const intent = parseExamIntent(text);
    if (intent.subject) {
      setSelectedSubject(intent.subject);
    }
    const targetSubj = intent.subject || selectedSubject;

    setChatMessages((prev) => [...prev, { role: 'user', text }]);
    if (intent.invalidGrade) {
      setChatMessages((prev) => [
        ...prev,
        { role: 'ai', text: `Công cụ này chỉ dành cho THPT (lớp 10, 11, 12). Lớp ${intent.invalidGrade} nằm ngoài phạm vi — thầy/cô chọn lại lớp 10, 11 hoặc 12 nhé.` },
      ]);
      if (!intent.grade) { setStep(1); return; }
    }

    const midInterview = step >= 1 && step <= 3 && topic;
    const hasSlot = intent.grade || intent.count || intent.duration;
    if (midInterview && !hasSlot) {
      notesRef.current = [notesRef.current, text].filter(Boolean).join('. ');
      setChatMessages((prev) => [
        ...prev,
        { role: 'summary', text: `Đã ghi nhận thêm yêu cầu: "${text}"` },
      ]);
      return;
    }

    const nextTopic = midInterview
      ? topic
      : intent.topic || weakTopic?.topic || `Kiến thức trọng tâm môn ${targetSubj}`;
    if (!midInterview) notesRef.current = text;
    setTopic(nextTopic);

    const detected = [
      intent.grade && `Lớp ${intent.grade}`,
      intent.count && `${intent.count} câu`,
      intent.duration && `${intent.duration} phút`,
    ].filter(Boolean).join(' · ');
    if (!midInterview) {
      setChatMessages((prev) => [
        ...prev,
        { role: 'summary', text: `Chủ đề: "${nextTopic}"${detected ? ` · ${detected}` : ''}` },
      ]);
    } else if (detected) {
      setChatMessages((prev) => [...prev, { role: 'summary', text: detected }]);
    }

    proceedInterview({
      grade: intent.grade || slots.grade || selectedGrade,
      count: intent.count || slots.count,
      duration: intent.duration || slots.duration,
      topic: nextTopic,
      format: intent.format,
      subject: targetSubj,
    });
  };

  /* ============ NẠP ĐỀ MẪU ============ */
  const handleLoadSampleExam = (sample) => {
    if (!sample) return;
    setTopic(sample.title);
    setSelectedGrade(THPT_GRADES.includes(String(sample.grade)) ? String(sample.grade) : '12');
    setSelectedDuration(sample.duration || 45);
    setQuestions(sample.questions || []);
    setWorkspaceTab('questions');
    sound.cheer();
    showToast(`Đã nạp: "${sample.title}"`, 'success');
    setChatMessages([
      { role: 'user', text: `Nạp đề mẫu: ${sample.title}` },
      { role: 'ai', text: `Đã nạp ${sample.questions.length} câu hỏi chuẩn Bộ GD&ĐT 2025. Thầy/cô có thể xem trước, in A4 hoặc xuất bản vào lớp.` },
    ]);
  };

  /* ============ QUESTION AI ACTIONS ============ */
  const handleExecuteRewrite = async () => {
    if (rewriteModalIdx === null || !questions[rewriteModalIdx]) return;
    const targetQ = questions[rewriteModalIdx];
    setIsRewriting(true);
    try {
      const rewritten = await rewriteQuestionWithAI({
        question: targetQ,
        instruction: rewritePrompt,
        grade: selectedGrade,
        subject: selectedSubject,
      });
      setQuestions((prev) => prev.map((item, idx) => (idx === rewriteModalIdx ? rewritten : item)));
      sound.cheer();
      showToast(`Đã viết lại Câu ${rewriteModalIdx + 1} thành công`, 'success');
      setRewriteModalIdx(null);
      setRewritePrompt('');
    } catch (err) {
      showToast(err.message || 'Lỗi khi viết lại câu hỏi', 'error');
    } finally {
      setIsRewriting(false);
    }
  };

  const handleRegenerateDistractors = async (idx) => {
    if (!questions[idx] || regeneratingDistractorsIdx !== null) return;
    setRegeneratingDistractorsIdx(idx);
    try {
      const updated = await regenerateDistractorsWithAI({
        question: questions[idx],
        grade: selectedGrade,
        subject: selectedSubject,
      });
      setQuestions((prev) => prev.map((item, i) => (i === idx ? updated : item)));
      sound.cheer();
      showToast(`Đã tái tạo 3 phương án nhiễu theo bẫy học sinh (Câu ${idx + 1})`, 'success');
    } catch (err) {
      showToast(err.message || 'Lỗi tạo phương án nhiễu', 'error');
    } finally {
      setRegeneratingDistractorsIdx(null);
    }
  };

  const handleTogglePedagogy = async (idx) => {
    const q = questions[idx];
    if (!q) return;
    const existing = pedagogyInsights[idx];
    if (existing?.open) {
      setPedagogyInsights((prev) => ({
        ...prev,
        [idx]: { ...prev[idx], open: false },
      }));
      return;
    }
    if (existing && !existing.loading) {
      setPedagogyInsights((prev) => ({
        ...prev,
        [idx]: { ...prev[idx], open: true },
      }));
      return;
    }

    setPedagogyInsights((prev) => ({
      ...prev,
      [idx]: { loading: true, open: true },
    }));

    try {
      const insight = await getPedagogicalInsightForQuestion({
        question: q,
        subject: selectedSubject,
      });
      setPedagogyInsights((prev) => ({
        ...prev,
        [idx]: { ...insight, loading: false, open: true },
      }));
    } catch {
      setPedagogyInsights((prev) => ({
        ...prev,
        [idx]: {
          trap: 'Học sinh hay nhầm lẫn kiến thức trọng tâm và các trường hợp ngoại lệ.',
          teachingTip: 'Nhắc học sinh đọc kỹ các từ khóa phủ định và dữ kiện bài toán.',
          loading: false,
          open: true,
        },
      }));
    }
  };

  const handleSaveQuestionToBank = async (idx) => {
    if (!user?.uid || !questions[idx] || savingBankIdx !== null) return;
    const q = questions[idx];
    if ((q.type || 'single_choice') !== 'single_choice') {
      showToast('Ngân hàng hiện chỉ lưu câu trắc nghiệm 4 lựa chọn.', 'info');
      return;
    }
    setSavingBankIdx(idx);
    try {
      await addQuestion({
        teacherId: user.uid,
        ...q,
        subject: selectedSubject,
        grade: Number(selectedGrade) || 12,
      });
      sound.cheer();
      setSavedBankKeys((prev) => new Set([...prev, idx]));
      showToast(`Đã lưu Câu ${idx + 1} vào Ngân hàng câu hỏi`, 'success');
    } catch (err) {
      showToast(err.message || 'Lỗi lưu câu hỏi', 'error');
    } finally {
      setSavingBankIdx(null);
    }
  };

  const handleSaveAllToBank = async () => {
    if (!user?.uid || !questions.length || isSavingAllToBank) return;
    const mcq = questions.filter((q) => (q.type || 'single_choice') === 'single_choice');
    if (!mcq.length) { showToast('Không có câu trắc nghiệm 4 lựa chọn để lưu.', 'info'); return; }
    setIsSavingAllToBank(true);
    try {
      const res = await addQuestionsBatch({
        teacherId: user.uid,
        questions: mcq.map((q) => ({
          ...q,
          subject: selectedSubject,
          grade: Number(selectedGrade) || 12,
        })),
        skipDuplicates: true,
      });
      sound.cheer();
      const skippedTypes = questions.length - mcq.length;
      showToast(`Đã lưu ${res.count} câu vào Ngân hàng (bỏ qua ${res.skipped} câu trùng${skippedTypes ? `, ${skippedTypes} câu Đúng/Sai–Trả lời ngắn chưa hỗ trợ` : ''})`, 'success');
      setSavedBankKeys(new Set(questions.map((q, i) => ((q.type || 'single_choice') === 'single_choice' ? i : -1)).filter((i) => i >= 0)));
    } catch (err) {
      showToast(err.message || 'Lỗi lưu ngân hàng', 'error');
    } finally {
      setIsSavingAllToBank(false);
    }
  };

  const handleStartEdit = (idx) => {
    setEditingIdx(idx);
    setEditForm({ ...questions[idx] });
  };

  const handleSaveEdit = (idx) => {
    if (!editForm) return;
    let next = { ...editForm, verify: { status: 'unchecked' } };
    if (next.type === 'short_answer') {
      const vi = String(next.answer || '').trim().replace('.', ',');
      next = { ...next, answer: vi, accepted: [...new Set([vi, vi.replace(',', '.')])].filter(Boolean) };
    }
    setQuestions((prev) => prev.map((item, i) => (i === idx ? next : item)));
    setEditingIdx(null);
    setEditForm(null);
    sound.ding();
    showToast(`Đã cập nhật nội dung Câu ${idx + 1}`, 'info');
  };

  const handleDeleteQuestion = (idx) => {
    if (!window.confirm(`Xóa Câu ${idx + 1}?`)) return;
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
    showToast(`Đã xóa Câu ${idx + 1}`, 'info');
  };

  /* ============ XÓA LỊCH SỬ ============ */
  const handleClearHistory = () => {
    if (!window.confirm('Xóa toàn bộ lịch sử trò chuyện, ma trận và đề đang làm?')) return;
    setChatMessages([]);
    setMatrixData(null);
    setQuestions([]);
    setTopic('');
    setStep(0);
    setSlots({ grade: null, count: null, duration: null });
    notesRef.current = '';
    try {
      localStorage.removeItem('aes_chat_history');
      localStorage.removeItem('aes_matrix');
      localStorage.removeItem('aes_questions');
      localStorage.removeItem('aes_topic');
      localStorage.removeItem('aes_subject');
      localStorage.removeItem('aes_step');
      localStorage.removeItem('aes_slots');
      localStorage.removeItem('aes_draft');
    } catch { /* ignore */ }
    sound.ding();
    showToast('Đã xóa lịch sử. Sẵn sàng tạo đề mới!', 'success');
  };

  /* ============ XUẤT BẢN ============ */
  const handleOpenPublishModal = () => {
    if (!questions.length) { showToast('Chưa có câu hỏi nào', 'error'); return; }
    setShowPublishModal(true);
  };

  const handleExecutePublish = async () => {
    if (!questions.length) return;
    setIsPublishing(true);
    try {
      // ⭐ FIX: Nếu có onGenerated → đẩy dữ liệu sang form thủ công
      if (typeof onGenerated === 'function') {
        onGenerated({
          questions,
          meta: {
            title: publishTitle || matrixData?.title || `Đề ${topic || selectedSubject} Lớp ${selectedGrade}`,
            description: `Đề ${questions.length} câu môn ${selectedSubject} phân hóa 4 mức độ GDPT 2018 (THPT lớp ${selectedGrade}).`,
            duration: selectedDuration,
            subject: selectedSubject,
            grade: selectedGrade,
            classId: selectedClassId || '',
            gradeType: publishGradeType,
          },
          warnings: questions.filter((q) => (q.warns || []).length > 0),
        });
        sound.cheer();
        setShowPublishModal(false);
        showToast('Đã chuyển sang tab Thủ công — kiểm tra và lưu đề', 'success');
        return;
      }

      // Fallback: gọi createExam trực tiếp (nếu không có onGenerated)
      const targetClass = classes.find((c) => c.id === selectedClassId);
      const targetClassId = targetClass?.id || '';
      const newExam = await createExam({
        teacherId: user.uid,
        teacherName: user.displayName || user.email || 'Giáo viên',
        classId: targetClassId,
        isDraft: !targetClassId,
        subject: selectedSubject,
        grade: selectedGrade,
        gradeType: publishGradeType,
        title: publishTitle || matrixData?.title || `Đề ${topic || selectedSubject} Lớp ${selectedGrade}`,
        description: `Đề khảo thí môn ${selectedSubject} ${questions.length} câu phân hóa 4 mức độ GDPT 2018.`,
        duration: selectedDuration,
        questions,
        showAnswerAfter: publishShowAnswer,
        allowRetry: false,
        shuffle: publishShuffle,
        proctor: {
          ...defaultProctor(),
          camera: publishCamera,
          cameraChecks: { ...defaultProctor().cameraChecks, ...cameraChecks },
        },
      });
      sound.cheer();
      setShowPublishModal(false);
      showToast(
        targetClassId
          ? `Đã xuất bản vào lớp ${targetClass?.name || ''}`
          : 'Đã lưu bản nháp vào Kho đề (chưa gắn lớp)',
        'success'
      );
      setTimeout(() => onDone?.(newExam), 1200);
    } catch (err) {
      showToast(`Lỗi xuất bản: ${err.message}`, 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  /* ============================================================
     RENDER: MÀN HÌNH CHAT-ONLY
     ============================================================ */
  if (!showWorkspace) {
    const activeChips = SUBJECT_QUICK_CHIPS[selectedSubject] || SUBJECT_QUICK_CHIPS['Hóa học'];
    return (
      <div className="aes-chat-only">
        <div className="aes-chat-center">
          <div className="aes-chat-hero">
            <div className="aes-hero-mark">
              <AIMark
                size={140}
                mode={analyzing ? 'think' : generating ? 'orbit' : 'idle'}
                look
                animate
              />
            </div>
            <h1>
              {greetingData.timeGreeting}, thầy/cô{' '}
              <span className="aes-name-gradient">{greetingData.teacherName}</span>
            </h1>
            <p>Hôm nay tôi hỗ trợ gì cho thầy cô?</p>
          </div>

          <div
            className={`aes-composer-wrap ${isDraggingFile ? 'dragging' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingFile(true);
            }}
            onDragLeave={() => setIsDraggingFile(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingFile(false);
              if (e.dataTransfer?.files?.length) {
                handleFileSelect({ target: { files: e.dataTransfer.files } });
              }
            }}
          >
            {/* THANH CHỌN MÔN HỌC & KHỐI LỚP TRỰC QUAN */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem', padding: '0 4px', flexWrap: 'wrap', gap: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--mut, #64748b)' }}>Môn học:</span>
                {THPT_SUBJECTS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setSelectedSubject(s);
                      sound.ding();
                    }}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '16px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      border: selectedSubject === s ? '1.5px solid #2563eb' : '1px solid rgba(0,0,0,0.12)',
                      background: selectedSubject === s ? '#eff6ff' : 'var(--panel, #ffffff)',
                      color: selectedSubject === s ? '#2563eb' : 'var(--ink, #334155)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: selectedSubject === s ? '0 1px 4px rgba(37,99,235,0.22)' : 'none',
                    }}
                    title={`Chuyển sang soạn đề môn ${s}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--mut, #64748b)' }}>Khối lớp:</span>
                {THPT_GRADES.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => {
                      setSelectedGrade(g);
                      sound.ding();
                    }}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '16px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      border: selectedGrade === g ? '1.5px solid #2563eb' : '1px solid rgba(0,0,0,0.12)',
                      background: selectedGrade === g ? '#eff6ff' : 'var(--panel, #ffffff)',
                      color: selectedGrade === g ? '#2563eb' : 'var(--ink, #334155)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: selectedGrade === g ? '0 1px 4px rgba(37,99,235,0.22)' : 'none',
                    }}
                    title={`Chọn soạn đề cho học sinh Khối lớp ${g}`}
                  >
                    Lớp {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="aes-composer">
              {attachedFiles.length > 0 && (
                <div className="aes-files-bar" style={{ borderRadius: '12px 12px 0 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  {attachedFiles.map((file, idx) => (
                    <div key={idx} className="aes-file-chip">
                      {file.kind === 'image' && file.dataUrl ? (
                        <img
                          src={file.dataUrl}
                          alt={file.name}
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 4,
                            objectFit: 'cover',
                            cursor: 'zoom-in',
                            border: '1px solid rgba(0,0,0,0.1)',
                          }}
                          onClick={() => setLightboxImage(file.dataUrl)}
                          title="Nhấp để xem ảnh phóng to"
                        />
                      ) : (
                        <IcoFile size={13} />
                      )}
                      <span>{file.name}</span>
                      <small>{fmtSize(file.size)}</small>
                      <button type="button" onClick={() => handleRemoveFile(idx)} aria-label="Xóa tệp">
                        <IcoClose size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <textarea
                ref={inputRef}
                rows={2}
                value={inputMessage}
                onChange={(e) => {
                  const val = e.target.value;
                  setInputMessage(val);
                  const m = val.match(/(?:lớp|lop|khối|khoi|k)\s*(1[0-2])\b/i);
                  if (m && THPT_GRADES.includes(m[1])) {
                    setSelectedGrade(m[1]);
                  }
                  if (/sinh\s*học|môn\s*sinh/i.test(val)) {
                    setSelectedSubject('Sinh học');
                  } else if (/hóa\s*học|môn\s*hóa/i.test(val)) {
                    setSelectedSubject('Hóa học');
                  } else if (/vật\s*lý|vật\s*lí|môn\s*lý/i.test(val)) {
                    setSelectedSubject('Vật lý');
                  } else if (/toán\s*học|môn\s*toán/i.test(val)) {
                    setSelectedSubject('Toán học');
                  }
                }}
                placeholder={
                  isBusy
                    ? 'AI đang xử lý...'
                    : `Nhập yêu cầu tạo đề môn ${selectedSubject} (VD: Đề 20 câu 45p lớp 10)...`
                }
                disabled={isBusy}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent?.isComposing) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <div className="aes-composer-bar">
                <button
                  type="button"
                  className="aes-composer-btn"
                  onClick={() => fileInputRef.current?.click()}
                  title="Đính kèm tài liệu (PDF, Word, ảnh đề thi)"
                  disabled={isBusy}
                >
                  <IcoPaperclip size={16} />
                </button>
                <button
                  type="button"
                  className="aes-composer-btn"
                  onClick={handleToggleVoice}
                  title={isListeningVoice ? 'Đang nghe... Nhấp để dừng' : 'Nhập yêu cầu bằng giọng nói (Tiếng Việt)'}
                  style={isListeningVoice ? { color: '#ef4444', background: 'rgba(239, 68, 68, 0.15)' } : {}}
                  aria-label="Nhập giọng nói"
                  disabled={isBusy}
                >
                  <IcoMic size={16} />
                </button>
                <button
                  type="button"
                  className="aes-composer-btn"
                  onClick={() => {
                    const preset = PRESET_SAMPLE_EXAMS?.[0];
                    if (preset) handleLoadSampleExam(preset);
                  }}
                  title="Nạp đề mẫu chuẩn Bộ GD&ĐT"
                  disabled={isBusy}
                >
                  <IcoTemplate size={16} />
                </button>
                <button
                  type="button"
                  className="aes-composer-btn"
                  onClick={() => {
                    setCustomMatrixGrade(selectedGrade);
                    setCustomMatrixSubject(selectedSubject);
                    setShowCustomMatrixModal(true);
                  }}
                  title="Gửi ma trận riêng của thầy/cô (Ảnh, Word, Excel, PDF)"
                  disabled={isBusy}
                  aria-label="Gửi ma trận riêng"
                >
                  <IcoMatrix size={16} />
                </button>
                <div style={{ flex: 1 }} />
                <button
                  type="button"
                  className="aes-composer-send"
                  onClick={() => handleSendMessage()}
                  disabled={(!inputMessage.trim() && attachedFiles.length === 0) || isBusy}
                  aria-label="Gửi yêu cầu"
                >
                  <IcoSend size={15} />
                </button>
              </div>
            </div>

            <div className="aes-quick-chips">
              {(weakTopic
                ? [{
                    title: `Ôn điểm yếu của lớp: ${weakTopic.topic}`,
                    sub: `Lớp đang đúng ${weakTopic.rate}% · AI bám sát dữ liệu bài nộp`,
                    prompt: `Đề ôn tập chuyên đề ${weakTopic.topic}, 10 câu`,
                  }]
                : []
              ).concat(activeChips).slice(0, 4).map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="aes-quick-chip"
                  onClick={() => {
                    if (chip.isCustomMatrix) {
                      setCustomMatrixGrade(selectedGrade);
                      setShowCustomMatrixModal(true);
                    } else {
                      handleSendMessage(chip.prompt);
                    }
                  }}
                  disabled={isBusy}
                >
                  <div className="aes-quick-chip-icon">
                    <IcoSpark size={16} />
                  </div>
                  <div className="aes-quick-chip-body">
                    <div className="aes-quick-chip-title">{chip.title}</div>
                    <div className="aes-quick-chip-sub">{chip.sub}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg,.webp,.xlsx,.xls"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />

        {/* OVERLAY KÉO THẢ TỆP */}
        {isDraggingFile && (
          <div
            style={{
              position: 'fixed',
              inset: '16px',
              zIndex: 99999,
              background: 'var(--panel, rgba(255, 255, 255, 0.94))',
              backdropFilter: 'blur(10px)',
              border: '3px dashed #2f6bff',
              borderRadius: '24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              boxShadow: '0 20px 50px rgba(47, 107, 255, 0.25)',
              pointerEvents: 'none',
            }}
          >
            <div style={{ color: '#2f6bff', transform: 'scale(1.3)' }}>
              <IcoUpload size={54} />
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--ink, #1e293b)' }}>
              Thả tệp vào đây để tải lên
            </div>
            <div style={{ fontSize: '0.95rem', color: 'var(--mut, #64748b)', maxWidth: '480px', textAlign: 'center', lineHeight: 1.5 }}>
              Hỗ trợ <b>ảnh chụp ma trận/đề thi</b> (.png, .jpg, .webp), file Word (.docx), Excel (.xlsx), PDF
            </div>
          </div>
        )}

        {/* LIGHTBOX MODAL XEM ẢNH PHÓNG TO */}
        {lightboxImage && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100000,
              background: 'rgba(0, 0, 0, 0.82)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
            }}
            onClick={() => setLightboxImage(null)}
          >
            <div
              style={{ position: 'relative', maxWidth: '94vw', maxHeight: '90vh' }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                style={{
                  position: 'absolute',
                  top: -38,
                  right: 0,
                  background: 'rgba(255, 255, 255, 0.25)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
                aria-label="Đóng"
              >
                <IcoClose size={16} />
              </button>
              <img
                src={lightboxImage}
                alt="Ảnh phóng to"
                style={{
                  maxWidth: '94vw',
                  maxHeight: '86vh',
                  objectFit: 'contain',
                  borderRadius: 14,
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
                }}
              />
            </div>
          </div>
        )}

        {toast && (
          <div className={`aes-toast ${toast.type}`}>
            {toast.type === 'success' && <IcoCheck size={15} />}
            {toast.type === 'error' && <IcoClose size={15} />}
            {toast.type === 'info' && <IcoSpark size={15} />}
            <span>{toast.message}</span>
          </div>
        )}
      </div>
    );
  }

  /* ============================================================
     RENDER: MÀN HÌNH CHIA 2 PANEL VỚI RESIZER
     ============================================================ */
  return (
    <div
      ref={splitContainerRef}
      className={`aes-studio-split ${isDraggingSplit ? 'is-resizing' : ''}`}
      style={{
        '--aes-split': `${(splitRatio * 100).toFixed(2)}% 8px minmax(0, 1fr)`,
        gridTemplateColumns: `${(splitRatio * 100).toFixed(2)}% 8px minmax(0, 1fr)`,
      }}
    >
      {/* LEFT: CHAT STUDIO */}
      <aside className="aes-left">
        <header className="aes-left-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AIMark size={26} animate={analyzing || generating} />
            <strong>AI Khảo thí</strong>
            <span
              style={{
                fontSize: '0.74rem',
                padding: '2px 8px',
                borderRadius: '12px',
                background: '#eff6ff',
                color: '#2563eb',
                fontWeight: 700,
                border: '1px solid #bfdbfe',
              }}
              title="Môn học và Khối lớp đang chọn"
            >
              {selectedSubject} · Lớp {selectedGrade}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <button
              type="button"
              className="aes-icon-btn"
              onClick={() => setShowCustomMatrixModal(true)}
              title="Gửi ma trận riêng của thầy/cô (Ảnh, Word, Excel, PDF)"
              disabled={isBusy}
              aria-label="Gửi ma trận riêng"
            >
              <IcoMatrix size={15} />
            </button>
            {(chatMessages.length > 0 || matrixData || questions.length > 0) && (
              <button
                type="button"
                className="aes-icon-btn"
                onClick={handleClearHistory}
                title="Xóa toàn bộ lịch sử và bắt đầu mới"
                aria-label="Xóa lịch sử"
              >
                <IcoTrash size={14} />
              </button>
            )}
            {(analyzing || generating) && (
              <button type="button" className="aes-btn-stop" onClick={handleCancelProcess}>
                <IcoStop size={13} /> Dừng AI
              </button>
            )}
          </div>
        </header>

        <div className="aes-left-feed">
          {chatMessages.map((msg, i) => {
            if (msg.role === 'user') {
              return <div key={i} className="aes-msg-user">{msg.text}</div>;
            }
            if (msg.role === 'summary') {
              return (
                <div key={i} className="aes-msg-summary">
                  <span>{msg.text}</span>
                </div>
              );
            }
            if (msg.role === 'trace_loading') {
              return (
                <div key={i} className="aes-msg-trace">
                  <div className="aes-trace-head">
                    <span className="aes-pulse-dot" />
                    <span>{msg.text}</span>
                  </div>
                  {generating && genProgress.total > 0 && (
                    <div className="aes-progress">
                      <div className="aes-progress-track">
                        <div
                          className="aes-progress-fill"
                          style={{ width: `${Math.round((genProgress.done / genProgress.total) * 100)}%` }}
                        />
                      </div>
                      <span>{genProgress.done}/{genProgress.total} đợt</span>
                    </div>
                  )}
                </div>
              );
            }
            if (msg.role === 'trace_done') {
              return (
                <div key={i} className="aes-msg-trace aes-msg-trace-done">
                  <div className="aes-trace-head">
                    <IcoCheck size={14} />
                    <span>{msg.title}</span>
                  </div>
                  {msg.steps.map((st, sidx) => (
                    <div key={sidx} className="aes-trace-item">{st}</div>
                  ))}
                </div>
              );
            }
            if (msg.role === 'chips') {
              return (
                <div key={i} className="aes-msg-chips">
                  {msg.items.map((it) => (
                    <button
                      key={it}
                      type="button"
                      className="aes-chip-suggest"
                      disabled={isBusy}
                      onClick={() => handleSendMessage(it)}
                    >
                      <IcoSpark size={12} /> {it}
                    </button>
                  ))}
                </div>
              );
            }
            if (msg.role === 'ai_advice') {
              return (
                <div key={i} className="aes-msg-advice">{msg.text}</div>
              );
            }
            return <div key={i} className="aes-msg-ai">{msg.text}</div>;
          })}

          {/* BƯỚC 1: HỎI LỚP */}
          {step === 1 && !matrixData && (
            <div className="aes-interview">
              <div className="aes-interview-head">
                <span>Bài tập dành cho học sinh lớp mấy?</span>
                <span className="aes-step">1/3</span>
              </div>
              <div className="aes-interview-opts">
                {THPT_GRADES.map((g) => (
                  <button key={g} type="button" className="aes-opt-btn" onClick={() => handleSelectGrade(g)}>
                    <span>Lớp {g}</span>
                    <span className="aes-opt-arrow">&rsaquo;</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* BƯỚC 2: SỐ CÂU & THỜI LƯỢNG */}
          {step === 2 && !matrixData && (
            <div className="aes-interview">
              <div className="aes-interview-head">
                <span>Đề gồm bao nhiêu câu & thời lượng?</span>
                <span className="aes-step">2/3</span>
              </div>
              <div className="aes-interview-opts">
                <button type="button" className="aes-opt-btn" onClick={() => handleSelectCount(10, 30)}>
                  <span>10 câu (30 phút)</span><span className="aes-opt-arrow">&rsaquo;</span>
                </button>
                <button type="button" className="aes-opt-btn" onClick={() => handleSelectCount(20, 45)}>
                  <span>20 câu (45 phút)</span><span className="aes-opt-arrow">&rsaquo;</span>
                </button>
                <button type="button" className="aes-opt-btn" onClick={() => handleSelectCount(28, 50)}>
                  <span>28 câu (50 phút - chuẩn Bộ GD&ĐT)</span><span className="aes-opt-arrow">&rsaquo;</span>
                </button>
                <button type="button" className="aes-opt-btn" onClick={() => handleSelectCount(40, 90)}>
                  <span>40 câu (90 phút - thi học kì)</span><span className="aes-opt-arrow">&rsaquo;</span>
                </button>
              </div>
            </div>
          )}

          {/* BƯỚC 3: ĐỊNH DẠNG */}
          {step === 3 && !matrixData && (
            <div className="aes-interview">
              <div className="aes-interview-head">
                <span>Cấu trúc và định dạng đề?</span>
                <span className="aes-step">3/3</span>
              </div>
              <div className="aes-interview-opts">
                <button
                  type="button"
                  className="aes-opt-btn"
                  onClick={() => { setSelectedFormat(FORMAT_GDPT); handlePlanMatrix({ format: FORMAT_GDPT, subject: selectedSubject }); }}
                >
                  <span>Chuẩn thi THPT 2025 (Trắc nghiệm + Đúng/Sai + Trả lời ngắn)</span>
                  <span className="aes-opt-arrow">&rsaquo;</span>
                </button>
                <button
                  type="button"
                  className="aes-opt-btn"
                  onClick={() => { setSelectedFormat(FORMAT_MCQ); handlePlanMatrix({ format: FORMAT_MCQ, subject: selectedSubject }); }}
                >
                  <span>100% Trắc nghiệm 4 lựa chọn</span>
                  <span className="aes-opt-arrow">&rsaquo;</span>
                </button>
                <button
                  type="button"
                  className="aes-opt-btn"
                  onClick={() => { setSelectedFormat(FORMAT_GDPT_ADV); handlePlanMatrix({ format: FORMAT_GDPT_ADV, subject: selectedSubject }); }}
                >
                  <span>Chuẩn 2025 · Phân hóa nâng cao (nhiều VD/VDC)</span>
                  <span className="aes-opt-arrow">&rsaquo;</span>
                </button>
              </div>
            </div>
          )}

          {/* HÀNH ĐỘNG SAU KHI CÓ MA TRẬN */}
          {step >= 4 && matrixData && (
            <div className="aes-action">
              <strong>Tiếp theo?</strong>
              <button
                type="button"
                className="aes-btn-primary"
                onClick={handleConfirmAndGenerateQuestions}
                disabled={generating}
              >
                <IcoRocket size={16} />
                <span>
                  {generating
                    ? `Đang biên soạn ${matrixData.totalQuestions} câu...`
                    : `Xác nhận & Sinh ${matrixData.totalQuestions} câu hỏi`}
                </span>
              </button>
              <div className="aes-action-input">
                <input
                  type="text"
                  placeholder="Hoặc yêu cầu chỉnh sửa: Thêm 2 câu nhận biết..."
                  disabled={isBusy}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = e.currentTarget.value;
                      if (val.trim()) { handleRefineMatrix(val.trim()); e.currentTarget.value = ''; }
                    }
                  }}
                />
              </div>
            </div>
          )}

          <div ref={feedEndRef} />
        </div>

        {/* Files đính kèm */}
        {attachedFiles.length > 0 && (
          <div className="aes-files-bar">
            {attachedFiles.map((file, idx) => (
              <div key={idx} className="aes-file-chip">
                {file.kind === 'image' && file.dataUrl ? (
                  <img
                    src={file.dataUrl}
                    alt={file.name}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      objectFit: 'cover',
                      cursor: 'zoom-in',
                      border: '1px solid rgba(0,0,0,0.1)',
                    }}
                    onClick={() => setLightboxImage(file.dataUrl)}
                    title="Nhấp để xem ảnh phóng to"
                  />
                ) : (
                  <IcoFile size={13} />
                )}
                <span>{file.name}</span>
                <small>{fmtSize(file.size)}</small>
                <button type="button" onClick={() => handleRemoveFile(idx)} aria-label="Xóa">
                  <IcoClose size={11} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Composer mini */}
        <div
          className={`aes-composer-mini ${isDraggingFile ? 'dragging' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
          onDragLeave={() => setIsDraggingFile(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDraggingFile(false);
            if (e.dataTransfer?.files?.length) {
              handleFileSelect({ target: { files: e.dataTransfer.files } });
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg,.webp,.xlsx,.xls"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />

          <button
            type="button"
            className="aes-icon-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Đính kèm tài liệu"
            disabled={isBusy}
          >
            <IcoPaperclip size={16} />
          </button>
          <button
            type="button"
            className="aes-icon-btn"
            onClick={handleToggleVoice}
            title={isListeningVoice ? 'Đang nghe... Nhấp để dừng' : 'Nhập yêu cầu bằng giọng nói (Tiếng Việt)'}
            style={isListeningVoice ? { color: '#ef4444', background: 'rgba(239, 68, 68, 0.15)' } : {}}
            disabled={isBusy}
            aria-label="Nhập giọng nói"
          >
            <IcoMic size={16} />
          </button>
          <button
            type="button"
            className="aes-icon-btn"
            onClick={() => {
              const preset = PRESET_SAMPLE_EXAMS?.[0];
              if (preset) handleLoadSampleExam(preset);
            }}
            title="Kho đề mẫu"
            disabled={isBusy}
          >
            <IcoTemplate size={16} />
          </button>
          <button
            type="button"
            className="aes-icon-btn"
            onClick={() => setShowCustomMatrixModal(true)}
            title="Gửi ma trận riêng của thầy/cô (Ảnh, Word, Excel hoặc dán bảng)"
            disabled={isBusy}
            style={{ color: '#2f6bff' }}
          >
            <IcoTable size={16} />
          </button>

          <textarea
            rows={1}
            value={inputMessage}
            onChange={(e) => {
              const val = e.target.value;
              setInputMessage(val);
              const m = val.match(/(?:lớp|lop|khối|khoi|k)\s*(1[0-2])\b/i);
              if (m && THPT_GRADES.includes(m[1])) {
                setSelectedGrade(m[1]);
              }
              if (/sinh\s*học|môn\s*sinh/i.test(val)) {
                setSelectedSubject('Sinh học');
              } else if (/hóa\s*học|môn\s*hóa/i.test(val)) {
                setSelectedSubject('Hóa học');
              } else if (/vật\s*lý|vật\s*lí|môn\s*lý/i.test(val)) {
                setSelectedSubject('Vật lý');
              } else if (/toán\s*học|môn\s*toán/i.test(val)) {
                setSelectedSubject('Toán học');
              }
            }}
            placeholder={
              isBusy
                ? 'AI đang xử lý...'
                : matrixData
                ? 'Chỉnh sửa ma trận (VD: Tăng 2 câu vận dụng)...'
                : `Nhập yêu cầu môn ${selectedSubject}...`
            }
            disabled={isBusy}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent?.isComposing) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />

          <button
            type="button"
            className="aes-composer-send"
            onClick={() => handleSendMessage()}
            disabled={isBusy || (!inputMessage.trim() && attachedFiles.length === 0)}
          >
            <IcoSend size={14} />
          </button>
        </div>
      </aside>

      {/* DRAGGABLE RESIZER BAR */}
      <div
        className={`aes-resizer ${isDraggingSplit ? 'active' : ''}`}
        role="separator"
        aria-orientation="vertical"
        aria-valuenow={Math.round(splitRatio * 100)}
        aria-valuemin={25}
        aria-valuemax={65}
        tabIndex={0}
        onPointerDown={handleSplitPointerDown}
        onDoubleClick={handleSplitDoubleClick}
        onKeyDown={handleSplitKeyDown}
        title="Kéo để chỉnh độ rộng · Nhấn đúp để đặt lại 40/60"
      >
        <div className="aes-resizer-handle" />
      </div>

      {/* RIGHT: WORKSPACE */}
      <main className="aes-right">
        <header className="aes-right-head">
          <div className="aes-right-status">
            <span className="aes-status-dot" />
            {analyzing ? 'Đang phân tích...'
              : generating ? `Đang biên soạn (${genProgress.done}/${genProgress.total || 1})...`
              : matrixData ? 'Ma trận sẵn sàng'
              : questions.length > 0 ? 'Bộ đề sẵn sàng'
              : 'Sẵn sàng'}
          </div>

          <div className="aes-workspace-tabs">
            <button
              type="button"
              className={`aes-ws-tab ${workspaceTab === 'matrix' ? 'on' : ''}`}
              onClick={() => setWorkspaceTab('matrix')}
            >
              <IcoTable size={13} /> Ma trận
            </button>
            <button
              type="button"
              className={`aes-ws-tab ${workspaceTab === 'questions' ? 'on' : ''}`}
              onClick={() => setWorkspaceTab('questions')}
              disabled={!questions.length}
            >
              <IcoEye size={13} /> Câu hỏi ({questions.length})
            </button>
            <button
              type="button"
              className={`aes-ws-tab ${workspaceTab === 'sim' ? 'on' : ''}`}
              onClick={() => setWorkspaceTab('sim')}
              disabled={!questions.length}
            >
              <IcoSim size={13} /> Mô phỏng
            </button>
            <button
              type="button"
              className={`aes-ws-tab ${workspaceTab === 'print' ? 'on' : ''}`}
              onClick={() => setWorkspaceTab('print')}
              disabled={!questions.length}
            >
              <IcoPrinter size={13} /> In A4
            </button>
            <button
              type="button"
              className={`aes-ws-tab ${workspaceTab === 'shuffle' ? 'on' : ''}`}
              onClick={() => setWorkspaceTab('shuffle')}
              disabled={!questions.length}
            >
              <IcoShuffle size={13} /> Đảo 4 mã đề
            </button>
          </div>

          <div className="aes-right-actions">
            {questions.length > 0 && (
              <button
                type="button"
                className="aes-btn-ghost"
                onClick={() => setShowSimulator(true)}
                title="Mở toàn màn hình"
              >
                <IcoMaximize size={14} />
              </button>
            )}
            <button
              type="button"
              className="aes-btn-publish"
              onClick={handleOpenPublishModal}
              disabled={!questions.length}
            >
              <IcoRocket size={14} /> Xuất bản vào Lớp
            </button>
          </div>
        </header>

        <div className="aes-right-body">
          {!matrixData && !questions.length && (
            <div className="aes-brief">
              <div className="aes-hero-mark"><AIMark size={72} animate={analyzing} /></div>
              <h2>{analyzing ? 'AI đang lập ma trận...' : 'Ma trận sẽ hiện ở đây'}</h2>
              <p>AI hỏi từng bước, chỉ hỏi phần còn thiếu.</p>
              <dl className="aes-brief-list">
                <div><dt>Chủ đề</dt><dd>{topic || '—'}</dd></div>
                <div><dt>Lớp</dt><dd>{slots.grade ? `Lớp ${slots.grade}` : '—'}</dd></div>
                <div><dt>Số câu</dt><dd>{slots.count || '—'}</dd></div>
                <div><dt>Thời lượng</dt><dd>{slots.duration ? `${slots.duration} phút` : '—'}</dd></div>
              </dl>
            </div>
          )}

          {/* TAB 1: MA TRẬN */}
          {workspaceTab === 'matrix' && matrixData && (
            <div className="aes-matrix">
              <div className="aes-matrix-head">
                <div>
                  <h2>Ma trận đề thi khảo thí</h2>
                  <p>{matrixData.totalQuestions} câu · Lớp {matrixData.grade} · {matrixData.duration} phút · Thang 10 điểm</p>
                </div>
              </div>

              {bloomSummary && (
                <div className="aes-bloom-visual">
                  <div className="aes-bloom-head">
                    <strong>Phân bổ mức độ nhận thức (Chuẩn GDPT 2018)</strong>
                    <span>Tổng {matrixData.totalQuestions} câu · 10 điểm</span>
                  </div>
                  <div className="aes-bloom-bar">
                    <div
                      className="aes-bloom-segment"
                      style={{ width: `${bloomSummary.nb.pct}%`, background: 'var(--t-bloom-nb, #22c55e)' }}
                      title={`Nhận biết: ${bloomSummary.nb.pct}%`}
                    />
                    <div
                      className="aes-bloom-segment"
                      style={{ width: `${bloomSummary.th.pct}%`, background: 'var(--t-bloom-th, #0284c7)' }}
                      title={`Thông hiểu: ${bloomSummary.th.pct}%`}
                    />
                    <div
                      className="aes-bloom-segment"
                      style={{ width: `${bloomSummary.vd.pct}%`, background: 'var(--t-bloom-vd, #d97706)' }}
                      title={`Vận dụng: ${bloomSummary.vd.pct}%`}
                    />
                    <div
                      className="aes-bloom-segment"
                      style={{ width: `${bloomSummary.vdc.pct}%`, background: 'var(--t-bloom-vdc, #dc2626)' }}
                      title={`Vận dụng cao: ${bloomSummary.vdc.pct}%`}
                    />
                  </div>
                  <div className="aes-bloom-pills">
                    <div className="aes-bloom-pill">
                      <span className="aes-bloom-dot" style={{ background: 'var(--t-bloom-nb, #22c55e)' }} />
                      <span>Nhận biết: <strong>{bloomSummary.nb.count}c ({bloomSummary.nb.pct}%)</strong></span>
                    </div>
                    <div className="aes-bloom-pill">
                      <span className="aes-bloom-dot" style={{ background: 'var(--t-bloom-th, #0284c7)' }} />
                      <span>Thông hiểu: <strong>{bloomSummary.th.count}c ({bloomSummary.th.pct}%)</strong></span>
                    </div>
                    <div className="aes-bloom-pill">
                      <span className="aes-bloom-dot" style={{ background: 'var(--t-bloom-vd, #d97706)' }} />
                      <span>Vận dụng: <strong>{bloomSummary.vd.count}c ({bloomSummary.vd.pct}%)</strong></span>
                    </div>
                    <div className="aes-bloom-pill">
                      <span className="aes-bloom-dot" style={{ background: 'var(--t-bloom-vdc, #dc2626)' }} />
                      <span>Vận dụng cao: <strong>{bloomSummary.vdc.count}c ({bloomSummary.vdc.pct}%)</strong></span>
                    </div>
                  </div>
                </div>
              )}

              <div className="aes-matrix-table-wrap">
                <table className="aes-matrix-table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left' }}>Chủ đề</th>
                      <th>Nhận biết</th>
                      <th>Thông hiểu</th>
                      <th>Vận dụng</th>
                      <th>Vận dụng cao</th>
                      <th>Tổng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matrixData.parts?.map((part, pidx) => (
                      <Fragment key={`part-${pidx}`}>
                        <tr className="aes-row-part">
                          <td colSpan={6}>{part.partName}</td>
                        </tr>
                        {part.topics?.map((top, tidx) => {
                          const rowCount = (top.nb?.count || 0) + (top.th?.count || 0) + (top.vd?.count || 0) + (top.vdc?.count || 0);
                          const rowPts = Math.round(((top.nb?.points || 0) + (top.th?.points || 0) + (top.vd?.points || 0) + (top.vdc?.points || 0)) * 10) / 10;
                          return (
                            <tr key={`topic-${pidx}-${tidx}`}>
                              <td>{top.name}</td>
                              <td>{top.nb?.count > 0 ? `${top.nb.count} [${top.nb.points}đ]` : '—'}</td>
                              <td>{top.th?.count > 0 ? `${top.th.count} [${top.th.points}đ]` : '—'}</td>
                              <td>{top.vd?.count > 0 ? `${top.vd.count} [${top.vd.points}đ]` : '—'}</td>
                              <td>{top.vdc?.count > 0 ? `${top.vdc.count} [${top.vdc.points}đ]` : '—'}</td>
                              <td><strong>{rowCount} [{rowPts}đ]</strong></td>
                            </tr>
                          );
                        })}
                      </Fragment>
                    ))}
                    <tr className="aes-row-total">
                      <td><strong>Tổng cộng</strong></td>
                      <td><strong>{matrixData.summary?.nb?.count || 0} [{matrixData.summary?.nb?.points || 0}đ]</strong></td>
                      <td><strong>{matrixData.summary?.th?.count || 0} [{matrixData.summary?.th?.points || 0}đ]</strong></td>
                      <td><strong>{matrixData.summary?.vd?.count || 0} [{matrixData.summary?.vd?.points || 0}đ]</strong></td>
                      <td><strong>{matrixData.summary?.vdc?.count || 0} [{matrixData.summary?.vdc?.points || 0}đ]</strong></td>
                      <td><strong>{matrixData.totalQuestions} câu [10đ]</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="aes-matrix-foot">
                <span>* Ma trận theo cấu trúc định dạng chuẩn của Bộ GD&ĐT Việt Nam (GDPT 2018).</span>
                <button
                  type="button"
                  className="aes-btn-primary"
                  onClick={handleConfirmAndGenerateQuestions}
                  disabled={generating}
                >
                  <IcoRocket size={14} />
                  {generating ? 'Đang biên soạn đề...' : 'Xác nhận & Biên soạn đề'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CÂU HỎI */}
          {workspaceTab === 'questions' && questions.length > 0 && (
            <div className="aes-questions">
              <div className="aes-questions-topbar">
                <div className="aes-questions-meta">
                  <span>Tổng số: <strong>{questions.length} câu</strong></span>
                  <span>Tổng điểm: <strong>10.0đ</strong></span>
                  {bloomSummary && (
                    <span style={{ color: 'var(--mut)', fontSize: 12 }}>
                      (NB: {bloomSummary.nb.count} · TH: {bloomSummary.th.count} · VD: {bloomSummary.vd.count} · VDC: {bloomSummary.vdc.count})
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="aes-btn-batch-save"
                  onClick={handleDownloadDocx}
                  disabled={isExportingDocx}
                  title="Tải đề thi + bảng ma trận + đáp án chi tiết về máy dưới dạng file Word (.docx)"
                  style={{ background: '#2563eb', color: '#fff', border: 'none' }}
                >
                  <IcoFile size={14} />
                  {isExportingDocx ? 'Đang xuất Word...' : 'Tải file Word (.docx)'}
                </button>
                <button
                  type="button"
                  className="aes-btn-batch-save"
                  onClick={handleDownloadZip}
                  disabled={isExportingZip}
                  title="Tự động đảo 4 mã đề (101, 102, 103, 104) + bảng ma trận & đáp án, đóng gói thành 1 file ZIP"
                  style={{ background: '#7c3aed', color: '#fff', border: 'none' }}
                >
                  <IcoDownload size={14} />
                  {isExportingZip ? 'Đang nén ZIP...' : 'Tải 4 mã đề (.zip)'}
                </button>
                <button
                  type="button"
                  className="aes-btn-batch-save"
                  onClick={() => runVerify(questions)}
                  disabled={verifying}
                  title="AI tự giải lại từng câu (không nhìn đáp án) để phát hiện đáp án sai"
                >
                  <IcoCheck size={14} />
                  {verifying ? 'Đang soát đáp án...' : 'Soát đáp án bằng AI'}
                </button>
                <button
                  type="button"
                  className="aes-btn-batch-save"
                  onClick={handleSaveAllToBank}
                  disabled={isSavingAllToBank}
                  title="Lưu toàn bộ danh sách câu hỏi vào Ngân hàng cá nhân"
                >
                  <IcoBookmark size={14} />
                  {isSavingAllToBank ? 'Đang lưu...' : 'Lưu tất cả vào Ngân hàng'}
                </button>
              </div>

              {questions.map((q, idx) => {
                const lvMeta = LEVEL_INFO[normLevel(q.level)] || LEVEL_INFO.nb;
                const ped = pedagogyInsights[idx];
                const isSaved = savedBankKeys.has(idx);
                const isEditing = editingIdx === idx;

                return (
                  <article key={q.id || idx} className="aes-q-card">
                    <div className="aes-q-head">
                      <span className="aes-q-num">Câu {idx + 1} ({q.points || 0.5}đ)</span>
                      <div className="aes-q-badges">
                        <span className="aes-badge" style={{ background: lvMeta.bg, color: lvMeta.color }}>
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background: lvMeta.color,
                              display: 'inline-block',
                            }}
                          />
                          {lvMeta.label}
                        </span>
                        {(q.type === 'true_false' || q.type === 'short_answer') && (
                          <span className="aes-badge">{q.type === 'true_false' ? 'Đúng/Sai' : 'Trả lời ngắn'}</span>
                        )}
                        {q.verify?.status === 'ok' && (
                          <span className="aes-badge" style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#16a34a' }} title="AI giải độc lập cho cùng đáp án">
                            <IcoCheck size={11} /> AI xác nhận
                          </span>
                        )}
                        {q.verify?.status === 'mismatch' && (
                          <span className="aes-badge" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: 4 }} title={q.verify.note || 'AI giải ra đáp án khác'}>
                            <IconAlert size={11} /> AI giải khác đáp án
                            <button
                              type="button"
                              style={{ marginLeft: 6, border: 0, background: 'transparent', color: 'inherit', textDecoration: 'underline', cursor: 'pointer', fontSize: 11 }}
                              onClick={() => { setQuestions((prev) => prev.map((it, i) => (i === idx ? applyVerifySuggestion(it) : it))); showToast(`Đã đổi đáp án Câu ${idx + 1} theo AI`, 'info'); }}
                            >
                              Theo AI
                            </button>
                          </span>
                        )}
                        {q.topic && <span className="aes-badge">{q.topic}</span>}
                        {isSaved && (
                          <span className="aes-badge" style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#16a34a' }}>
                            <IcoCheck size={11} /> Đã lưu ngân hàng
                          </span>
                        )}
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="aes-q-edit-box">
                        <label>
                          <small style={{ fontWeight: 600, color: 'var(--mut)' }}>Nội dung câu hỏi:</small>
                          <textarea
                            rows={3}
                            value={editForm.q}
                            onChange={(e) => setEditForm({ ...editForm, q: e.target.value })}
                          />
                        </label>
                        {editForm.type === 'true_false' && (
                          <div className="aes-q-edit-opts">
                            {(editForm.statements || []).map((st, k) => (
                              <div key={k} className="aes-q-edit-opt-item">
                                <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <strong>{'abcd'[k]})</strong>
                                  <select
                                    value={st.answer ? 'Đ' : 'S'}
                                    onChange={(e) => {
                                      const next = editForm.statements.map((x, j) => (j === k ? { ...x, answer: e.target.value === 'Đ' } : x));
                                      setEditForm({ ...editForm, statements: next });
                                    }}
                                  >
                                    <option value="Đ">Đúng</option>
                                    <option value="S">Sai</option>
                                  </select>
                                </label>
                                <input
                                  type="text"
                                  value={st.text}
                                  onChange={(e) => {
                                    const next = editForm.statements.map((x, j) => (j === k ? { ...x, text: e.target.value } : x));
                                    setEditForm({ ...editForm, statements: next });
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                        {editForm.type === 'short_answer' && (
                          <label>
                            <small style={{ fontWeight: 600, color: 'var(--mut)' }}>Đáp án (một số, dấu phẩy thập phân):</small>
                            <input
                              type="text"
                              value={editForm.answer || ''}
                              onChange={(e) => setEditForm({ ...editForm, answer: e.target.value })}
                            />
                          </label>
                        )}
                        <div className="aes-q-edit-opts">
                          {(editForm.type === 'true_false' || editForm.type === 'short_answer' ? [] : (editForm.options || [])).map((opt, oIdx) => (
                            <div key={oIdx} className="aes-q-edit-opt-item">
                              <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <input
                                  type="radio"
                                  name={`correct-${idx}`}
                                  checked={editForm.correct === oIdx}
                                  onChange={() => setEditForm({ ...editForm, correct: oIdx })}
                                />
                                <strong>{String.fromCharCode(65 + oIdx)}</strong>
                              </label>
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  const nextOpts = [...editForm.options];
                                  nextOpts[oIdx] = e.target.value;
                                  setEditForm({ ...editForm, options: nextOpts });
                                }}
                              />
                            </div>
                          ))}
                        </div>
                        <label>
                          <small style={{ fontWeight: 600, color: 'var(--mut)' }}>Lời giải chi tiết:</small>
                          <textarea
                            rows={2}
                            value={editForm.explain || ''}
                            onChange={(e) => setEditForm({ ...editForm, explain: e.target.value })}
                          />
                        </label>
                        <div className="aes-q-edit-foot">
                          <button
                            type="button"
                            className="aes-btn-ghost"
                            onClick={() => { setEditingIdx(null); setEditForm(null); }}
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            className="aes-btn-primary"
                            onClick={() => handleSaveEdit(idx)}
                          >
                            Lưu thay đổi
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="aes-q-text">
                          <MathText text={q.q} />
                        </div>

                        {q.type === 'true_false' && (
                          <div className="aes-q-opts">
                            {(q.statements || []).map((st, k) => (
                              <div
                                key={k}
                                className={`aes-q-opt ${st.answer ? 'correct' : ''}`}
                                onClick={() => setQuestions((prev) => prev.map((it, i) => (i === idx
                                  ? { ...it, statements: it.statements.map((x, j) => (j === k ? { ...x, answer: !x.answer } : x)), verify: { status: 'unchecked' } }
                                  : it)))}
                                title="Nhấp để đổi Đúng/Sai"
                              >
                                <strong>{'abcd'[k]})</strong>
                                <MathText text={st.text} />
                                <span style={{ marginLeft: 'auto', fontWeight: 700 }}>{st.answer ? 'Đúng' : 'Sai'}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {q.type === 'short_answer' && (
                          <div className="aes-q-opts">
                            <div className="aes-q-opt correct">
                              <strong>Đáp án:</strong>
                              <span>{q.answer}</span>
                              <IcoCheck size={14} />
                            </div>
                          </div>
                        )}
                        <div className="aes-q-opts">
                          {(q.type === 'true_false' || q.type === 'short_answer' ? [] : (q.options || [])).map((opt, oIdx) => {
                            const isCorrect = q.correct === oIdx;
                            return (
                              <div
                                key={oIdx}
                                className={`aes-q-opt ${isCorrect ? 'correct' : ''}`}
                                onClick={() => {
                                  setQuestions((prev) =>
                                    prev.map((item, i2) => (i2 === idx ? { ...item, correct: oIdx, verify: { status: 'unchecked' } } : item))
                                  );
                                  showToast(`Đã chọn đáp án ${String.fromCharCode(65 + oIdx)} cho Câu ${idx + 1}`, 'info');
                                }}
                                title="Nhấp để đổi đáp án đúng"
                              >
                                <strong>{String.fromCharCode(65 + oIdx)}.</strong>
                                <MathText text={opt} />
                                {isCorrect && <IcoCheck size={14} />}
                              </div>
                            );
                          })}
                        </div>

                        {(q.explain || q.work) && (
                          <div className="aes-q-explain">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                              <IcoLightbulb size={14} color="#0284c7" />
                              <strong style={{ color: '#0369a1' }}>Lời giải & Hướng dẫn chấm chi tiết:</strong>
                            </div>
                            {q.explain && <MathText text={q.explain} />}
                            {q.work && (
                              <div style={{ marginTop: '0.45rem', paddingTop: '0.45rem', borderTop: '1px dashed var(--bdr, #cbd5e1)', fontSize: '0.88rem', color: '#334155' }}>
                                <span style={{ fontWeight: 600, color: '#0369a1' }}>Các bước tính toán / Bản giải: </span>
                                <MathText text={q.work} />
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {ped?.open && (
                      <div className="aes-q-pedagogy">
                        <div className="aes-q-pedagogy-title">
                          <IcoLightbulb size={14} />
                          <span>Góc cố vấn sư phạm & Bẫy tâm lý học sinh:</span>
                        </div>
                        {ped.loading ? (
                          <span style={{ fontSize: 12, color: 'var(--mut)' }}>AI đang phân tích sai lầm học sinh...</span>
                        ) : (
                          <>
                            <div className="aes-q-pedagogy-item">
                              <strong>Bẫy nhận thức / Sai lầm phổ biến:</strong>
                              <span>{ped.trap}</span>
                            </div>
                            <div className="aes-q-pedagogy-item">
                              <strong>Mẹo giảng dạy / Câu hỏi gợi mở:</strong>
                              <span>{ped.teachingTip}</span>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    <div className="aes-q-actions">
                      <button
                        type="button"
                        className="aes-q-action-btn"
                        onClick={() => {
                          setRewriteModalIdx(idx);
                          setRewritePrompt('Bám sát thực tế hơn, viết lại tự nhiên');
                        }}
                        title="Yêu cầu AI viết lại hoặc thay đổi ngữ cảnh câu hỏi"
                      >
                        <IcoWand size={13} />
                        <span>AI Viết lại</span>
                      </button>

                      {(q.type || 'single_choice') === 'single_choice' && (
                      <button
                        type="button"
                        className="aes-q-action-btn"
                        onClick={() => handleRegenerateDistractors(idx)}
                        disabled={regeneratingDistractorsIdx === idx}
                        title="Tạo mới 3 phương án sai bám vào lỗi sai kinh điển của học sinh"
                      >
                        <IcoRefresh size={13} className={regeneratingDistractorsIdx === idx ? 'aes-pulse' : ''} />
                        <span>{regeneratingDistractorsIdx === idx ? 'Đang đổi...' : 'Đổi 3 phương án nhiễu'}</span>
                      </button>
                      )}

                      <button
                        type="button"
                        className={`aes-q-action-btn ${ped?.open ? 'active' : ''}`}
                        onClick={() => handleTogglePedagogy(idx)}
                        title="Xem bẫy học sinh và mẹo sư phạm"
                      >
                        <IcoLightbulb size={13} />
                        <span>{ped?.open ? 'Ẩn mẹo' : 'Bẫy HS & Mẹo dạy'}</span>
                      </button>

                      <button
                        type="button"
                        className={`aes-q-action-btn ${isSaved ? 'active' : ''}`}
                        onClick={() => handleSaveQuestionToBank(idx)}
                        disabled={savingBankIdx === idx || isSaved}
                        title="Lưu câu này vào Ngân hàng câu hỏi của bạn"
                      >
                        <IcoBookmark size={13} />
                        <span>{savingBankIdx === idx ? 'Đang lưu...' : isSaved ? 'Đã lưu' : 'Lưu ngân hàng'}</span>
                      </button>

                      <button
                        type="button"
                        className="aes-q-action-btn"
                        onClick={() => handleStartEdit(idx)}
                        title="Chỉnh sửa nội dung thủ công"
                      >
                        <IcoEdit size={13} />
                        <span>Sửa</span>
                      </button>

                      <button
                        type="button"
                        className="aes-q-action-btn"
                        style={{ marginLeft: 'auto', color: '#ef4444' }}
                        onClick={() => handleDeleteQuestion(idx)}
                        title="Xóa câu hỏi này"
                      >
                        <IcoTrash size={13} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* TAB 3, 4, 5: EMBEDDED SIMULATOR */}
          {(workspaceTab === 'sim' || workspaceTab === 'print' || workspaceTab === 'shuffle') && questions.length > 0 && (
            <div style={{ height: '100%', minHeight: 620 }}>
              <ExamPreviewSimulator
                embedded
                defaultTab={workspaceTab}
                exam={{
                  title: publishTitle || topic || `Đề kiểm tra ${selectedSubject}`,
                  duration: selectedDuration,
                  grade: selectedGrade,
                  subject: selectedSubject,
                }}
                questions={questions}
                matrix={matrixData}
                onClose={() => setWorkspaceTab('questions')}
              />
            </div>
          )}
        </div>
      </main>

      {/* MODAL TOÀN MÀN HÌNH */}
      {showSimulator && (
        <ExamPreviewSimulator
          exam={{
            title: publishTitle || topic || `Đề kiểm tra ${selectedSubject}`,
            duration: selectedDuration,
            grade: selectedGrade,
            subject: selectedSubject,
          }}
          questions={questions}
          matrix={matrixData}
          onClose={() => setShowSimulator(false)}
        />
      )}

      {/* MODAL AI VIẾT LẠI CÂU HỎI */}
      {rewriteModalIdx !== null && questions[rewriteModalIdx] && (
        <div className="aes-modal-backdrop" onClick={() => !isRewriting && setRewriteModalIdx(null)}>
          <div className="aes-modal" onClick={(e) => e.stopPropagation()}>
            <div className="aes-modal-head">
              <h3>Nhờ AI Viết lại Câu {rewriteModalIdx + 1}</h3>
              <button
                type="button"
                className="aes-modal-close"
                onClick={() => setRewriteModalIdx(null)}
                disabled={isRewriting}
              >
                <IcoClose size={16} />
              </button>
            </div>
            <div className="aes-modal-body">
              <div style={{ fontSize: 13, color: 'var(--mut)', lineHeight: 1.5 }}>
                Câu gốc: <em>"{questions[rewriteModalIdx].q}"</em>
              </div>
              <label className="aes-field">
                <span>Yêu cầu cho AI:</span>
                <input
                  type="text"
                  value={rewritePrompt}
                  onChange={(e) => setRewritePrompt(e.target.value)}
                  placeholder="VD: Viết lại bám sát bối cảnh đời sống thực tế..."
                />
              </label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  'Bám sát thí nghiệm thực tế',
                  'Giảm độ dài, câu từ súc tích',
                  'Tăng độ khó, bẫy tinh tế',
                  'Bổ sung số liệu thực nghiệm',
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    className="aes-badge"
                    style={{ cursor: 'pointer', border: 0 }}
                    onClick={() => setRewritePrompt(chip)}
                  >
                    + {chip}
                  </button>
                ))}
              </div>
            </div>
            <div className="aes-modal-foot">
              <button
                type="button"
                className="aes-btn-ghost"
                onClick={() => setRewriteModalIdx(null)}
                disabled={isRewriting}
              >
                Hủy
              </button>
              <button
                type="button"
                className="aes-btn-primary"
                onClick={handleExecuteRewrite}
                disabled={isRewriting}
              >
                <IcoWand size={14} />
                {isRewriting ? 'Đang viết lại...' : 'Viết lại ngay'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XUẤT BẢN */}
      {showPublishModal && (
        <div className="aes-modal-backdrop" onClick={() => setShowPublishModal(false)}>
          <div className="aes-modal" onClick={(e) => e.stopPropagation()}>
            <div className="aes-modal-head">
              <h3>{typeof onGenerated === 'function' ? 'Chuyển đề sang tab Thủ công' : 'Xuất bản đề thi vào Lớp'}</h3>
              <button type="button" className="aes-modal-close" onClick={() => setShowPublishModal(false)}>
                <IcoClose size={16} />
              </button>
            </div>

            <div className="aes-modal-body">
              <label className="aes-field">
                <span>Tiêu đề đề thi</span>
                <input type="text" value={publishTitle} onChange={(e) => setPublishTitle(e.target.value)} />
              </label>

              <div className="aes-row">
                <label className="aes-field">
                  <span>Lớp áp dụng</span>
                  <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}>
                    {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    <option value="">Lưu nháp cá nhân (chưa gắn lớp)</option>
                  </select>
                </label>
                <label className="aes-field">
                  <span>Thời lượng (phút)</span>
                  <input
                    type="number"
                    value={selectedDuration}
                    onChange={(e) => setSelectedDuration(Number(e.target.value) || 30)}
                  />
                </label>
              </div>

              <div className="aes-modal-info">
                <span>Tổng số câu: <strong>{questions.length}</strong></span>
                <span>Thang điểm: <strong>10.0đ</strong></span>
              </div>

              <label className="aes-field" style={{ marginTop: 10 }}>
                <span>Cột điểm vnEdu / SMAS (Thông tư 22)</span>
                <select value={publishGradeType} onChange={(e) => setPublishGradeType(e.target.value)}>
                  <option value="">Tự động nhận diện theo tiêu đề &amp; thời lượng</option>
                  <option value="tx">Thường xuyên — TX (Hệ số 1)</option>
                  <option value="dgk">Đánh giá giữa kỳ — ĐGK (Hệ số 2)</option>
                  <option value="ckk">Đánh giá cuối kỳ — CKK (Hệ số 3)</option>
                </select>
              </label>

              {typeof onGenerated !== 'function' && (
                <>
                  <div className="aes-modal-checks">
                    <label>
                      <input
                        type="checkbox"
                        checked={publishShuffle}
                        onChange={(e) => setPublishShuffle(e.target.checked)}
                      />
                      <span>Tự động đảo thứ tự câu & đáp án theo thuật toán PRNG</span>
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={publishShowAnswer}
                        onChange={(e) => setPublishShowAnswer(e.target.checked)}
                      />
                      <span>Cho học sinh xem lời giải chi tiết sau khi nộp bài</span>
                    </label>
                  </div>

                  <div className="aes-cam">
                    <span className="aes-cam-title">Camera giám sát khi thi</span>
                    <div className="aes-cam-opts" role="radiogroup" aria-label="Camera giám sát">
                      {[
                        ['off', 'Không dùng'],
                        ['optional', 'Khuyến khích'],
                        ['required', 'Bắt buộc'],
                      ].map(([val, label]) => (
                        <button
                          key={val}
                          type="button"
                          role="radio"
                          aria-checked={publishCamera === val}
                          className={`aes-cam-opt ${publishCamera === val ? 'on' : ''}`}
                          onClick={() => setPublishCamera(val)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    {publishCamera !== 'off' && (
                      <>
                        <div className="aes-cam-checks">
                          {[
                            ['noFace', 'Không thấy mặt'],
                            ['multiFace', 'Nhiều người'],
                            ['lookAway', 'Nhìn ra ngoài'],
                            ['handRaise', 'Giơ tay'],
                            ['phoneLike', 'Có điện thoại'],
                          ].map(([k, label]) => (
                            <label key={k}>
                              <input
                                type="checkbox"
                                checked={!!cameraChecks[k]}
                                onChange={(e) => setCameraChecks((c) => ({ ...c, [k]: e.target.checked }))}
                              />
                              <span>{label}</span>
                            </label>
                          ))}
                        </div>
                        <p className="aes-cam-note">
                          {publishCamera === 'required'
                            ? 'Học sinh phải cho phép camera mới vào làm bài được. '
                            : 'Học sinh có thể từ chối camera và vẫn làm bài. '}
                          Không ghi video, chỉ chụp ảnh nhỏ khi có sự kiện bất thường.
                        </p>
                      </>
                    )}
                  </div>
                </>
              )}

              {typeof onGenerated === 'function' && (
                <div className="aes-modal-info" style={{ background: 'rgba(59, 130, 246, 0.08)', borderRadius: 10, padding: '0.75rem 1rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--ink-2)', lineHeight: 1.5 }}>
                    Đề sẽ được chuyển sang tab <b>"Soạn thủ công"</b> để thầy/cô kiểm tra,
                    chỉnh sửa và cấu hình giám sát camera trước khi lưu chính thức vào lớp.
                  </span>
                </div>
              )}
            </div>

            <div className="aes-modal-foot">
              <button
                type="button"
                className="aes-btn-ghost"
                onClick={() => setShowPublishModal(false)}
                disabled={isPublishing}
              >
                Hủy
              </button>
              <button
                type="button"
                className="aes-btn-primary"
                onClick={handleExecutePublish}
                disabled={isPublishing}
              >
                <IcoRocket size={14} />{' '}
                {isPublishing
                  ? 'Đang xử lý...'
                  : typeof onGenerated === 'function'
                  ? 'Chuyển sang Thủ công'
                  : 'Xuất bản ngay'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GỬI MA TRẬN RIÊNG */}
      {showCustomMatrixModal && (
        <div className="aes-modal-backdrop" onClick={() => setShowCustomMatrixModal(false)}>
          <div className="aes-modal" style={{ maxWidth: '640px', width: '92%' }} onClick={(e) => e.stopPropagation()}>
            <div className="aes-modal-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ display: 'inline-flex', padding: '6px', borderRadius: '8px', background: 'rgba(47, 107, 255, 0.1)', color: '#2f6bff' }}>
                  <IcoTable size={18} />
                </span>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>Gửi Ma Trận Đề Thi Riêng Của Thầy/Cô</h3>
              </div>
              <button type="button" className="aes-modal-close" onClick={() => setShowCustomMatrixModal(false)}>
                <IcoClose size={16} />
              </button>
            </div>

            <div className="aes-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--mut, #6b7280)', lineHeight: 1.5 }}>
                Thầy/cô có thể <b>tải tệp tin ma trận</b> (file Word .docx, Excel .xlsx, PDF, hoặc <b>ảnh chụp ma trận</b>) hoặc <b>dán nội dung bảng ma trận</b> bên dưới. AI sẽ tự động phân tích và dựng đúng 100% cấu trúc của thầy/cô!
              </p>

              {/* TẢI TỆP MA TRẬN */}
              <div
                style={{
                  border: '2px dashed #93c5fd',
                  borderRadius: '14px',
                  padding: '1.2rem',
                  textAlign: 'center',
                  background: 'rgba(239, 246, 255, 0.6)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onClick={() => customMatrixFileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (e.dataTransfer?.files?.length) {
                    handleCustomMatrixFileSelect({ target: { files: e.dataTransfer.files } });
                  }
                }}
              >
                <input
                  ref={customMatrixFileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg,.webp,.xlsx,.xls"
                  style={{ display: 'none' }}
                  onChange={handleCustomMatrixFileSelect}
                />
                <div style={{ color: '#2f6bff', marginBottom: '0.4rem' }}>
                  <IcoFile size={28} />
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b' }}>
                  Bấm để chọn hoặc kéo thả file ma trận vào đây
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '3px' }}>
                  Hỗ trợ: Ảnh chụp bảng ma trận, file Word (.docx), Excel (.xlsx), PDF
                </div>
              </div>

              {/* DANH SÁCH FILE ĐÃ CHỌN */}
              {customMatrixFiles.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                  {customMatrixFiles.map((f, fi) => (
                    <div
                      key={fi}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.35rem 0.65rem',
                        borderRadius: '8px',
                        background: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: '#1e40af',
                      }}
                    >
                      {f.kind === 'image' && f.dataUrl ? (
                        <img
                          src={f.dataUrl}
                          alt={f.name}
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 4,
                            objectFit: 'cover',
                            cursor: 'zoom-in',
                            border: '1px solid rgba(0,0,0,0.1)',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setLightboxImage(f.dataUrl);
                          }}
                          title="Bấm xem ảnh phóng to"
                        />
                      ) : (
                        <IcoFile size={13} />
                      )}
                      <span>{f.name}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCustomMatrixFiles((prev) => prev.filter((_, i) => i !== fi));
                        }}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#93c5fd', padding: 0, display: 'inline-flex', alignItems: 'center' }}
                        aria-label="Xóa tệp"
                      >
                        <IcoClose size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* DÁN NỘI DUNG VĂN BẢN */}
              <label className="aes-field" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 700 }}>Hoặc dán nội dung / mô tả bảng ma trận:</span>
                <textarea
                  rows={4}
                  value={customMatrixInputText}
                  onChange={(e) => setCustomMatrixInputText(e.target.value)}
                  placeholder="Ví dụ: Đề 20 câu 45p lớp 11 gồm:
- Phần I: Trắc nghiệm 12 câu (6 NB, 4 TH, 2 VD) về Cân bằng hóa học
- Phần II: Đúng/sai 4 câu (2 TH, 2 VD)
- Phần III: Trả lời ngắn 4 câu (2 VD, 2 VDC)..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    lineHeight: 1.5,
                    fontFamily: 'inherit',
                  }}
                />
              </label>

              {/* MÔN HỌC & KHỐI LỚP */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 700 }}>Môn học:</span>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {THPT_SUBJECTS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setCustomMatrixSubject(s)}
                        style={{
                          padding: '0.35rem 0.85rem',
                          borderRadius: '8px',
                          border: customMatrixSubject === s ? '2px solid #2f6bff' : '1px solid #cbd5e1',
                          background: customMatrixSubject === s ? '#eff6ff' : '#fff',
                          color: customMatrixSubject === s ? '#2f6bff' : '#475569',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 700 }}>Dành cho khối lớp:</span>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {THPT_GRADES.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setCustomMatrixGrade(g)}
                        style={{
                          padding: '0.35rem 0.85rem',
                          borderRadius: '8px',
                          border: customMatrixGrade === g ? '2px solid #2f6bff' : '1px solid #cbd5e1',
                          background: customMatrixGrade === g ? '#eff6ff' : '#fff',
                          color: customMatrixGrade === g ? '#2f6bff' : '#475569',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                        }}
                      >
                        Lớp {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="aes-modal-foot">
              <button
                type="button"
                className="aes-btn-ghost"
                onClick={() => setShowCustomMatrixModal(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="aes-btn-primary"
                onClick={handleExecuteCustomMatrix}
                style={{ background: 'linear-gradient(135deg, #2f6bff 0%, #8b5cf6 100%)', border: 'none', color: '#fff' }}
              >
                <IcoRocket size={14} /> AI Phân Tích & Dựng Ma Trận Ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY KÉO THẢ TỆP */}
      {isDraggingFile && (
        <div
          style={{
            position: 'fixed',
            inset: '16px',
            zIndex: 99999,
            background: 'var(--panel, rgba(255, 255, 255, 0.94))',
            backdropFilter: 'blur(10px)',
            border: '3px dashed #2f6bff',
            borderRadius: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            boxShadow: '0 20px 50px rgba(47, 107, 255, 0.25)',
            pointerEvents: 'none',
          }}
        >
          <div style={{ color: '#2f6bff', transform: 'scale(1.3)' }}>
            <IcoUpload size={54} />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--ink, #1e293b)' }}>
            Thả tệp vào đây để tải lên
          </div>
          <div style={{ fontSize: '0.95rem', color: 'var(--mut, #64748b)', maxWidth: '480px', textAlign: 'center', lineHeight: 1.5 }}>
            Hỗ trợ <b>ảnh chụp ma trận/đề thi</b> (.png, .jpg, .webp), file Word (.docx), Excel (.xlsx), PDF
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL XEM ẢNH PHÓNG TO */}
      {lightboxImage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100000,
            background: 'rgba(0, 0, 0, 0.82)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={() => setLightboxImage(null)}
        >
          <div
            style={{ position: 'relative', maxWidth: '94vw', maxHeight: '90vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              style={{
                position: 'absolute',
                top: -38,
                right: 0,
                background: 'rgba(255, 255, 255, 0.25)',
                border: 'none',
                color: '#fff',
                borderRadius: '50%',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              aria-label="Đóng"
            >
              <IcoClose size={16} />
            </button>
            <img
              src={lightboxImage}
              alt="Ảnh phóng to"
              style={{
                maxWidth: '94vw',
                maxHeight: '86vh',
                objectFit: 'contain',
                borderRadius: 14,
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
              }}
            />
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className={`aes-toast ${toast.type}`}>
          {toast.type === 'success' && <IcoCheck size={15} />}
          {toast.type === 'error' && <IcoClose size={15} />}
          {toast.type === 'info' && <IcoSpark size={15} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}