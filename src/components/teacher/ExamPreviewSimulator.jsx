/* ============================================================
   ExamPreviewSimulator.jsx — Bộ Xem Trước, Mô Phỏng & Đảo Đề (v6.0)
   ------------------------------------------------------------
   Quy trình 4 bước (4-Step Wizard):
     • Bước 1: Đề gốc & Đặc tả (Xem/chỉnh sửa câu hỏi, Bảng đặc tả GDPT 2018)
     • Bước 2: Cấu hình đảo đề (Toggles, 2/4/6/8 mã, Seed tái lập, Khóa câu, Mẫu đảo Presets)
     • Bước 3: Xem trước, Kiểm tra tự động, Mô phỏng & Dự đoán điểm
               (Auto-Validation 4 tiêu chí, Xem song song 2 mã đề, Ma trận đáp án chéo,
                Thi thử học sinh, Dự đoán phổ điểm & độ khó)
     • Bước 4: Xuất bản / Giao Phòng thi & Lịch sử đảo
               (In A4, OMR, Word/PDF/CSV, Gán mã đề tự động cho HS, Lịch sử & Hoàn tác)
   ============================================================ */
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import MathText from '../MathText.jsx';
import {
  generateShuffledVersions,
  answerKeyRows,
  findCollisions,
  validateShuffledVersions,
  hasPositionalOption,
  analyzePositionalOptions,
} from '../../lib/examShuffle.js';
import { downloadCsv } from '../DashShell.jsx';
import sound from '../../lib/gameSound.js';
import { getSubject } from '../../lib/subjects.js';
import { normLevel, LEVEL_INFO } from '../../lib/matrixAiService.js';
import { exportToWord, exportToPDF } from '../../lib/examExport.js';
import { printOmrSheetA4, printMultipleOmrSheets } from '../../lib/omrSheetGenerator.js';
import { scoreExam } from '../../lib/examScoring.js';
import { createPaperExam } from '../../lib/paperStore.js';
import { DEFAULT_SCORING, keyToStored } from '../../lib/paperGrade.js';
import { auth } from '../../lib/firebase.js';
import '../../styles/exam-preview-simulator.css';

/* ============ STORAGE KEYS ============ */
const PRESETS_STORAGE_KEY = 'cs-shuffle-presets-v1';
const HISTORY_STORAGE_KEY = 'cs-shuffle-history-v1';
const ASSIGNED_STORAGE_KEY = 'cs-assigned-shuffled-exams-v1';

const DEFAULT_SHUFFLE_PRESETS = [
  {
    id: 'preset-standard-4',
    name: 'Chuẩn Bộ GD&ĐT (4 mã · Giữ nhóm độ khó)',
    isDefault: true,
    config: {
      codeCount: 4,
      shuffleQuestions: true,
      shuffleOptions: true,
      keepDifficultyGroups: true,
      keepLinkedGroups: true,
      smartSpecialOptions: true,
    },
  },
  {
    id: 'preset-anti-cheat-8',
    name: 'Chống nhìn bài tối đa (8 mã · Đảo toàn đề)',
    isDefault: true,
    config: {
      codeCount: 8,
      shuffleQuestions: true,
      shuffleOptions: true,
      keepDifficultyGroups: false,
      keepLinkedGroups: true,
      smartSpecialOptions: true,
    },
  },
  {
    id: 'preset-options-only',
    name: 'Chỉ đảo đáp án A/B/C/D (Giữ nguyên thứ tự câu)',
    isDefault: true,
    config: {
      codeCount: 4,
      shuffleQuestions: false,
      shuffleOptions: true,
      keepDifficultyGroups: true,
      keepLinkedGroups: true,
      smartSpecialOptions: true,
    },
  },
];

const DEFAULT_MOCK_STUDENTS = [
  { id: 'hs-01', name: 'Nguyễn Minh An', code: 'HS001', seat: 'Bàn 1 - Trái' },
  { id: 'hs-02', name: 'Trần Hoàng Bách', code: 'HS002', seat: 'Bàn 1 - Phải' },
  { id: 'hs-03', name: 'Lê Ngọc Châu', code: 'HS003', seat: 'Bàn 2 - Trái' },
  { id: 'hs-04', name: 'Phạm Quốc Khánh', code: 'HS004', seat: 'Bàn 2 - Phải' },
  { id: 'hs-05', name: 'Hoàng Thảo Linh', code: 'HS005', seat: 'Bàn 3 - Trái' },
  { id: 'hs-06', name: 'Vũ Đức Minh', code: 'HS006', seat: 'Bàn 3 - Phải' },
  { id: 'hs-07', name: 'Đặng Phương Nam', code: 'HS007', seat: 'Bàn 4 - Trái' },
  { id: 'hs-08', name: 'Bùi Thanh Ngân', code: 'HS008', seat: 'Bàn 4 - Phải' },
  { id: 'hs-09', name: 'Đỗ Tuấn Kiệt', code: 'HS009', seat: 'Bàn 5 - Trái' },
  { id: 'hs-10', name: 'Ngô Bảo Trâm', code: 'HS010', seat: 'Bàn 5 - Phải' },
  { id: 'hs-11', name: 'Dương Gia Huy', code: 'HS011', seat: 'Bàn 6 - Trái' },
  { id: 'hs-12', name: 'Lý Khánh Vy', code: 'HS012', seat: 'Bàn 6 - Phải' },
];

/* ============ SVG ICONS (Nét mảnh chuẩn Apple HIG) ============ */
const Svg = ({ size = 16, children }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.85"
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
const IcoLock = (p) => <Svg {...p}><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></Svg>;
const IcoUnlock = (p) => <Svg {...p}><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" /></Svg>;
const IcoShieldCheck = (p) => <Svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" /></Svg>;
const IcoColumns = (p) => <Svg {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="12" y1="3" x2="12" y2="21" /></Svg>;
const IcoChart = (p) => <Svg {...p}><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></Svg>;
const IcoUsers = (p) => <Svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></Svg>;
const IcoHistory = (p) => <Svg {...p}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><polyline points="3 3 3 8 8 8" /><polyline points="12 7 12 12 15 15" /></Svg>;
const IcoBulb = (p) => <Svg {...p}><path d="M9 18h6" /><path d="M10 22h4" /><path d="M12 2a7 7 0 0 0-4 12.7c.6.4 1 1.1 1 1.8V17h6v-.5c0-.7.4-1.4 1-1.8A7 7 0 0 0 12 2z" /></Svg>;
const IcoSliders = (p) => <Svg {...p}><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" /></Svg>;
const IcoTrash = (p) => <Svg {...p}><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></Svg>;
const IcoUndo = (p) => <Svg {...p}><polyline points="9 14 4 9 9 4" /><path d="M20 20v-7a4 4 0 0 0-4-4H4" /></Svg>;
const IcoDownload = (p) => <Svg {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></Svg>;
const IcoAlert = (p) => <Svg {...p}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></Svg>;

const CODE_COLORS = [
  '#0284c7', '#16a34a', '#d97706', '#dc2626',
  '#7c3aed', '#0d9488', '#db2777', '#4f46e5',
];

/* ============================================================
   CHẤM ĐIỂM & DỰ ĐOÁN PHỔ ĐIỂM
   ============================================================ */
function gradeSimulation(questions, answers) {
  let earnedPoints = 0;
  let maxPoints = 0;
  const details = [];
  const { detail, correctCount } = scoreExam(questions, answers);
  questions.forEach((q, idx) => {
    const d = detail[idx];
    const pts = Number(q.points) || 1;
    maxPoints += pts;
    earnedPoints += d.earned;
    details.push({ idx, type: d.type, isCorrect: d.isCorrect, partial: d.partial, points: d.earned });
  });
  const score10 = maxPoints > 0 ? Math.round((earnedPoints / maxPoints) * 100) / 10 : 0;
  return { correctCount, totalCount: questions.length, earnedPoints, maxPoints, score10, details };
}

function fmtTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function computeExamPrediction(questions = [], duration = 45) {
  const total = questions.length || 1;
  const counts = { nb: 0, th: 0, vd: 0, vdc: 0 };
  let estMinutes = 0;

  questions.forEach((q) => {
    const lv = normLevel(q.level);
    counts[lv] = (counts[lv] || 0) + 1;
    const type = q.type || 'single_choice';
    const baseTime =
      lv === 'nb' ? 0.8 : lv === 'th' ? 1.4 : lv === 'vd' ? 2.4 : 3.6;
    const typeFactor = type === 'true_false' ? 1.5 : type === 'short_answer' ? 1.3 : 1.0;
    estMinutes += baseTime * typeFactor;
  });

  const pNb = counts.nb / total;
  const pTh = counts.th / total;
  const pVd = counts.vd / total;
  const pVdc = counts.vdc / total;

  // Expected accuracy by level for typical high school class
  const expectedScoreRatio =
    pNb * 0.88 + pTh * 0.72 + pVd * 0.50 + pVdc * 0.26;
  const avgScore = Math.max(3.2, Math.min(9.2, Math.round(expectedScoreRatio * 100) / 10));

  // Difficulty index on 1..10 scale
  const difficultyIndex = Math.round((pNb * 2.5 + pTh * 5.0 + pVd * 7.5 + pVdc * 9.5) * 10) / 10;
  const difficultyLabel =
    difficultyIndex < 4.2
      ? 'Cơ bản · Dễ đạt điểm cao'
      : difficultyIndex < 6.0
      ? 'Chuẩn THPT 2025 · Cân bằng'
      : difficultyIndex < 7.5
      ? 'Phân hóa khá - giỏi cao'
      : 'Rất khó · Tuyển chọn HSG';

  // Score distribution buckets: <5.0, 5.0-6.5, 6.5-8.0, 8.0-10
  const bUnder5 = Math.max(4, Math.min(45, Math.round((pVd * 28 + pVdc * 48 + (1 - expectedScoreRatio) * 20))));
  const b8To10 = Math.max(5, Math.min(45, Math.round((pNb * 26 + pTh * 18 - pVdc * 18 + 10))));
  const remaining = Math.max(10, 100 - bUnder5 - b8To10);
  const b65To8 = Math.round(remaining * 0.56);
  const b5To65 = Math.max(0, 100 - bUnder5 - b8To10 - b65To8);

  const passRate = 100 - bUnder5;
  const roundedEstMin = Math.max(5, Math.round(estMinutes));
  const timePressure =
    roundedEstMin > duration
      ? 'Căng thời gian (cần giảm câu VD/VDC hoặc tăng thời lượng)'
      : roundedEstMin < duration * 0.55
      ? 'Dư dả thời gian (học sinh hoàn thành sớm)'
      : 'Phù hợp với thời lượng quy định';

  return {
    counts,
    total: questions.length,
    avgScore,
    difficultyIndex,
    difficultyLabel,
    passRate,
    estMinutes: roundedEstMin,
    timePressure,
    buckets: [
      { label: '< 5.0 điểm (Chưa đạt)', pct: bUnder5, color: '#ef4444' },
      { label: '5.0 – 6.5 điểm (Trung bình)', pct: b5To65, color: '#f59e0b' },
      { label: '6.5 – 8.0 điểm (Khá)', pct: b65To8, color: '#0284c7' },
      { label: '8.0 – 10 điểm (Giỏi)', pct: b8To10, color: '#16a34a' },
    ],
  };
}

function readJsonStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJsonStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage quota errors
  }
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function ExamPreviewSimulator({
  exam = {},
  questions = [],
  matrix = null,
  classes = [],
  onClose,
  defaultTab = 'sim',
  initialWizardStep = null,
  onAssignShuffled,
  embedded = false,
}) {
  const [tab, setTab] = useState(defaultTab || 'sim');

  // Map tab <-> 4-Step Wizard step
  const derivedStepFromTab = (t) => {
    if (t === 'specs') return 1;
    if (t === 'config') return 2;
    if (t === 'shuffle' || t === 'compare' || t === 'sim' || t === 'predict') return 3;
    if (t === 'print' || t === 'omr' || t === 'assign') return 4;
    return 3;
  };
  const [wizardStep, setWizardStep] = useState(
    initialWizardStep || derivedStepFromTab(defaultTab || 'sim')
  );

  const handleSelectTab = useCallback((nextTab, explicitStep = null) => {
    setTab(nextTab);
    setWizardStep(explicitStep || derivedStepFromTab(nextTab));
  }, []);

  const handleSelectWizardStep = useCallback((stepNum) => {
    setWizardStep(stepNum);
    if (stepNum === 1) setTab('specs');
    else if (stepNum === 2) setTab('config');
    else if (stepNum === 3) {
      if (!['shuffle', 'compare', 'sim', 'predict'].includes(tab)) {
        setTab('shuffle');
      }
    } else if (stepNum === 4) {
      if (!['assign', 'print', 'omr'].includes(tab)) {
        setTab('assign');
      }
    }
  }, [tab]);

  // Edit state
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    examTitle: exam.title || matrix?.title || 'Đề kiểm tra',
    subject: exam.subject || matrix?.subject || 'Hóa học',
    duration: exam.duration || matrix?.duration || 30,
    questions: [...questions],
  });

  const subjectInfo = useMemo(() => getSubject(editData.subject), [editData.subject]);
  const useMath = subjectInfo.math;

  // Step 2: Shuffle configuration state
  const [shuffleConfig, setShuffleConfig] = useState({
    codeCount: 4,
    seedInput: String(exam.seed || '2025'),
    shuffleQuestions: true,
    shuffleOptions: true,
    keepDifficultyGroups: true,
    keepLinkedGroups: true,
    smartSpecialOptions: true,
  });
  const [lockedIndices, setLockedIndices] = useState([]);

  // Presets ("Mẫu đảo")
  const [presets, setPresets] = useState(() => {
    const saved = readJsonStorage(PRESETS_STORAGE_KEY, null);
    return Array.isArray(saved) && saved.length > 0 ? saved : DEFAULT_SHUFFLE_PRESETS;
  });
  const [newPresetName, setNewPresetName] = useState('');

  // Shuffle History ("Lịch sử đảo")
  const [shuffleHistory, setShuffleHistory] = useState(() =>
    readJsonStorage(HISTORY_STORAGE_KEY, [])
  );
  const [compareHistoryItem, setCompareHistoryItem] = useState(null);

  // Active codes & side-by-side preview state
  const [activeCode, setActiveCode] = useState('101');
  const [compareCodeB, setCompareCodeB] = useState('102');
  const [previewMode, setPreviewMode] = useState('single'); // 'single' | 'side-by-side'
  const [matrixMode, setMatrixMode] = useState('by-orig'); // 'by-orig' | 'by-code'

  // Generate shuffled versions reactively from editData.questions + shuffleConfig + lockedIndices
  const shuffledExams = useMemo(() => {
    return generateShuffledVersions(editData.questions, shuffleConfig.codeCount, {
      seedText: shuffleConfig.seedInput,
      shuffleQuestions: shuffleConfig.shuffleQuestions,
      shuffleOptions: shuffleConfig.shuffleOptions,
      keepDifficultyGroups: shuffleConfig.keepDifficultyGroups,
      keepLinkedGroups: shuffleConfig.keepLinkedGroups,
      smartSpecialOptions: shuffleConfig.smartSpecialOptions,
      lockedIndices,
    });
  }, [editData.questions, shuffleConfig, lockedIndices]);

  // Ensure activeCode and compareCodeB are always valid
  useEffect(() => {
    if (!shuffledExams.some((v) => v.code === activeCode)) {
      setActiveCode(shuffledExams[0]?.code || '101');
    }
    if (!shuffledExams.some((v) => v.code === compareCodeB)) {
      setCompareCodeB(shuffledExams[1]?.code || shuffledExams[0]?.code || '101');
    }
  }, [shuffledExams, activeCode, compareCodeB]);

  // Auto-Validation report
  const validationReport = useMemo(
    () => validateShuffledVersions(shuffledExams, editData.questions.length),
    [shuffledExams, editData.questions.length]
  );
  const collisions = validationReport.collisions;

  // Score & Difficulty prediction
  const prediction = useMemo(
    () => computeExamPrediction(editData.questions, editData.duration),
    [editData.questions, editData.duration]
  );

  // Sim state (supports testing any shuffled code!)
  const [simCode, setSimCode] = useState('101');
  const simQuestions = useMemo(() => {
    const found = shuffledExams.find((v) => v.code === simCode);
    return found?.questions || editData.questions;
  }, [shuffledExams, simCode, editData.questions]);

  const [simAnswers, setSimAnswers] = useState({});
  const [simActiveQ, setSimActiveQ] = useState(0);
  const [simTimeLeft, setSimTimeLeft] = useState((exam.duration || matrix?.duration || 30) * 60);
  const [simSubmitted, setSimSubmitted] = useState(false);
  const [simScore, setSimScore] = useState(null);
  const [flagged, setFlagged] = useState({});
  const [showSidebar, setShowSidebar] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);

  // Step 4: Assign to Exam Room & Auto-assign codes to students
  const [selectedClassId, setSelectedClassId] = useState(
    exam.classId || classes[0]?.id || 'default-class'
  );
  const [assignStrategy, setAssignStrategy] = useState('alternating'); // 'alternating' | 'random-balanced'
  const [assignSeed, setAssignSeed] = useState(1);
  const [assignedSuccess, setAssignedSuccess] = useState(null);

  const [exporting, setExporting] = useState(null);
  const paperRef = useRef(null);
  const simQuestionsRef = useRef(simQuestions);

  useEffect(() => {
    simQuestionsRef.current = simQuestions;
  }, [simQuestions]);

  useEffect(() => {
    setEditData({
      examTitle: exam.title || matrix?.title || 'Đề kiểm tra',
      subject: exam.subject || matrix?.subject || 'Hóa học',
      duration: exam.duration || matrix?.duration || 30,
      questions: [...questions],
    });
  }, [exam, matrix, questions]);

  useEffect(() => {
    setSimTimeLeft(editData.duration * 60);
  }, [editData.duration]);

  /* ---------- TOAST ---------- */
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  }, []);

  /* Đọc Mẫu đầu trang đề thi từ Hồ sơ Giáo viên (cs-teacher-exam-prefs-v1) */
  const teacherExamPrefs = useMemo(() => {
    const uid = auth?.currentUser?.uid || exam?.teacherId || 'guest';
    const fallback = {
      headerDeptName: 'SỞ GD&ĐT TỈNH / PHÒNG GD&ĐT',
      headerSchoolName: 'TRƯỜNG THPT CHUYÊN',
      headerSubjectGroup: '',
      headerExamMotto: 'KỲ THI ĐÁNH GIÁ NĂNG LỰC HỌC TẬP',
      footerSignature: 'Chúc các em bình tĩnh, tự tin và làm bài đạt kết quả cao nhất!',
      footerTeacherSign: '',
    };
    const saved = readJsonStorage(`cs-teacher-exam-prefs-v1:${uid}`, null)
      || readJsonStorage('cs-teacher-exam-prefs-v1:guest', null);
    return saved && typeof saved === 'object' ? { ...fallback, ...saved } : fallback;
  }, [exam?.teacherId]);

  const [sendingToOmr, setSendingToOmr] = useState(false);
  const handleSendKeysToPaperGrading = async () => {
    const uid = auth?.currentUser?.uid || exam?.teacherId;
    if (!uid) {
      showToast('Vui lòng đăng nhập tài khoản giáo viên để lưu bài chấm phiếu A4.', 'warn');
      return;
    }
    setSendingToOmr(true);
    try {
      const p1Count = editData.questions.filter((q) => (q.type || 'single_choice') === 'single_choice').length;
      const p2Count = editData.questions.filter((q) => q.type === 'true_false').length;
      const p3Count = editData.questions.filter((q) => q.type === 'short_answer').length;
      const counts = {
        p1: Math.max(1, p1Count || editData.questions.length),
        p2: p2Count,
        p3: p3Count,
      };
      const keys = {};
      shuffledExams.forEach((ver) => {
        const qs = ver.questions || [];
        const p1 = qs
          .filter((q) => (q.type || 'single_choice') === 'single_choice')
          .map((q) => (typeof q.correct === 'number' && q.correct >= 0 && q.correct < 4 ? 'ABCD'[q.correct] : 'A'));
        const p2 = qs
          .filter((q) => q.type === 'true_false')
          .map((q) => (q.statements || []).slice(0, 4).map((st) => (st.answer ? 'D' : 'S')));
        const p3 = qs
          .filter((q) => q.type === 'short_answer')
          .map((q) => (Array.isArray(q.accepted) && q.accepted.length ? q.accepted : [String(q.answer ?? '')]).filter(Boolean));
        keys[ver.code] = keyToStored({ p1, p2, p3 });
      });

      await createPaperExam({
        teacherId: uid,
        classId: selectedClassId !== 'default-class' ? selectedClassId : (exam.classId || null),
        title: `${editData.examTitle} (${shuffledExams.length} mã đề: 101–${100 + shuffledExams.length})`,
        counts,
        scoring: DEFAULT_SCORING,
        keys,
        sbdMap: {},
      });
      showToast(`Đã tạo bài chấm phiếu A4 với đủ đáp án của ${shuffledExams.length} mã đề!`, 'success');
    } catch (e) {
      showToast('Không đẩy được sang Chấm phiếu A4: ' + (e.message || e), 'error');
    } finally {
      setSendingToOmr(false);
    }
  };

  /* ---------- RECORD SHUFFLE HISTORY ---------- */
  const saveToShuffleHistory = useCallback(
    (customNote = '') => {
      const entry = {
        id: `shuf-${Date.now()}`,
        timestamp: new Date().toISOString(),
        examId: exam.id || 'custom-exam',
        examTitle: editData.examTitle,
        subject: editData.subject,
        questionCount: editData.questions.length,
        codeCount: shuffleConfig.codeCount,
        seedInput: shuffleConfig.seedInput,
        config: { ...shuffleConfig },
        lockedIndices: [...lockedIndices],
        codes: shuffledExams.map((v) => v.code),
        passedValidation: validationReport.passed,
        note: customNote || `${shuffleConfig.codeCount} mã đề · Seed "${shuffleConfig.seedInput}"`,
        firstCodePreview: (shuffledExams[1] || shuffledExams[0])?.questions
          ?.slice(0, 5)
          .map((q) => q.originalIndex),
      };
      setShuffleHistory((prev) => {
        const next = [entry, ...prev].slice(0, 20);
        writeJsonStorage(HISTORY_STORAGE_KEY, next);
        return next;
      });
      sound.ding();
      showToast('Đã lưu phiên bản đảo vào Lịch sử đảo đề', 'success');
    },
    [
      exam.id,
      editData.examTitle,
      editData.subject,
      editData.questions.length,
      shuffleConfig,
      lockedIndices,
      shuffledExams,
      validationReport.passed,
      showToast,
    ]
  );

  const handleGenerateNewRandomSeed = () => {
    const randomSeed = `S${Math.floor(100000 + Math.random() * 900000)}`;
    setShuffleConfig((prev) => ({ ...prev, seedInput: randomSeed }));
    sound.pop();
    showToast(`Đã tạo hạt giống ngẫu nhiên mới: ${randomSeed}`, 'info');
  };

  const handleRestoreHistory = (entry) => {
    if (!entry) return;
    setShuffleConfig({
      codeCount: entry.config?.codeCount || entry.codeCount || 4,
      seedInput: String(entry.config?.seedInput ?? entry.seedInput ?? '2025'),
      shuffleQuestions: entry.config?.shuffleQuestions ?? true,
      shuffleOptions: entry.config?.shuffleOptions ?? true,
      keepDifficultyGroups: entry.config?.keepDifficultyGroups ?? true,
      keepLinkedGroups: entry.config?.keepLinkedGroups ?? true,
      smartSpecialOptions: entry.config?.smartSpecialOptions ?? true,
    });
    setLockedIndices(Array.isArray(entry.lockedIndices) ? entry.lockedIndices : []);
    sound.cheer();
    showToast(`Đã khôi phục phiên đảo lúc ${new Date(entry.timestamp).toLocaleTimeString('vi-VN')}`, 'success');
  };

  const handleUndoLastShuffle = () => {
    if (shuffleHistory.length === 0) {
      showToast('Chưa có lịch sử đảo đề trước đó để hoàn tác', 'error');
      return;
    }
    handleRestoreHistory(shuffleHistory[0]);
  };

  /* ---------- PRESETS ("MẪU ĐẢO") ---------- */
  const handleApplyPreset = (preset) => {
    if (!preset?.config) return;
    setShuffleConfig((prev) => ({
      ...prev,
      ...preset.config,
    }));
    sound.pop();
    showToast(`Đã áp dụng mẫu đảo: "${preset.name}"`, 'success');
  };

  const handleSavePreset = () => {
    const trimmed = newPresetName.trim();
    if (!trimmed) {
      showToast('Vui lòng nhập tên Mẫu đảo trước khi lưu', 'error');
      return;
    }
    const newPreset = {
      id: `preset-${Date.now()}`,
      name: trimmed,
      isDefault: false,
      config: {
        codeCount: shuffleConfig.codeCount,
        shuffleQuestions: shuffleConfig.shuffleQuestions,
        shuffleOptions: shuffleConfig.shuffleOptions,
        keepDifficultyGroups: shuffleConfig.keepDifficultyGroups,
        keepLinkedGroups: shuffleConfig.keepLinkedGroups,
        smartSpecialOptions: shuffleConfig.smartSpecialOptions,
      },
    };
    const next = [...presets, newPreset];
    setPresets(next);
    writeJsonStorage(PRESETS_STORAGE_KEY, next);
    setNewPresetName('');
    sound.cheer();
    showToast(`Đã lưu mẫu đảo "${trimmed}"`, 'success');
  };

  const handleDeletePreset = (id) => {
    const next = presets.filter((p) => p.id !== id);
    setPresets(next);
    writeJsonStorage(PRESETS_STORAGE_KEY, next);
    showToast('Đã xóa mẫu đảo', 'info');
  };

  /* ---------- LOCK QUESTION POSITION ---------- */
  const toggleLockQuestion = (idx) => {
    setLockedIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx].sort((a, b) => a - b)
    );
    sound.ding();
  };

  /* ---------- TIMER ---------- */
  useEffect(() => {
    if (simSubmitted || simTimeLeft <= 0) return undefined;
    const t = setInterval(() => {
      setSimTimeLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          setTimeout(() => {
            const result = gradeSimulation(simQuestionsRef.current, simAnswers);
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
    const result = gradeSimulation(simQuestionsRef.current, simAnswers);
    setSimScore(result);
    setSimSubmitted(true);
    setConfirmModal(null);
    sound.cheer();
  }, [simAnswers]);

  const requestSubmitSimulation = useCallback(() => {
    const answered = Object.keys(simAnswers).filter((k) => {
      const v = simAnswers[k];
      if (Array.isArray(v)) return v.some((x) => x !== undefined);
      return v !== undefined && v !== '';
    }).length;
    const total = simQuestionsRef.current.length;
    const unanswered = Math.max(0, total - answered);
    setConfirmModal({
      title: 'Xác nhận nộp bài chấm thử',
      desc:
        unanswered > 0
          ? `Bạn đã làm ${answered}/${total} câu (còn ${unanswered} câu chưa trả lời). Bạn có chắc chắn muốn nộp bài và chấm điểm ngay?`
          : `Bạn đã hoàn thành đầy đủ ${total}/${total} câu. Nộp bài và xem kết quả chi tiết ngay?`,
      confirmLabel: 'Nộp bài & Chấm điểm',
      onConfirm: handleSubmitSimulation,
    });
  }, [simAnswers, handleSubmitSimulation]);

  /* ---------- RESET ---------- */
  const handleReset = useCallback(() => {
    setSimAnswers({});
    setSimActiveQ(0);
    setSimTimeLeft(editData.duration * 60);
    setSimSubmitted(false);
    setSimScore(null);
    setFlagged({});
    sound.ding();
  }, [editData.duration]);

  /* ---------- FLAG ---------- */
  const toggleFlag = useCallback((idx) => {
    setFlagged((prev) => ({ ...prev, [idx]: !prev[idx] }));
    sound.ding();
  }, []);

  /* ---------- KEYBOARD ---------- */
  useEffect(() => {
    if (tab !== 'sim' || simSubmitted || editMode || confirmModal) return undefined;
    const handler = (e) => {
      if (e.target.matches('input, textarea, select')) return;
      const key = e.key;
      if (['1', '2', '3', '4'].includes(key)) {
        e.preventDefault();
        const idx = parseInt(key, 10) - 1;
        const q = simQuestions[simActiveQ];
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
        setSimActiveQ((i) => Math.min(simQuestions.length - 1, i + 1));
      }
      if (key === 'f' || key === 'F') {
        e.preventDefault();
        toggleFlag(simActiveQ);
      }
      if (key === ' ') {
        e.preventDefault();
        requestSubmitSimulation();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [tab, simSubmitted, simActiveQ, simQuestions, toggleFlag, requestSubmitSimulation, editMode, confirmModal]);

  /* ---------- EXPORT WORD/PDF ---------- */
  const handleExportWord = async () => {
    try {
      setExporting('word');
      const activeVersion = shuffledExams.find((e) => e.code === activeCode) || {
        questions: editData.questions,
      };
      await exportToWord({
        examTitle: editData.examTitle,
        subject: editData.subject,
        duration: editData.duration,
        code: activeCode,
        questions: activeVersion.questions || editData.questions,
        includeAnswers: true,
      });
      sound.cheer();
      showToast(`Đã tải file Word (Mã đề ${activeCode})`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Lỗi xuất Word: ' + err.message, 'error');
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
      showToast(`Đã tải file PDF (Mã đề ${activeCode})`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Lỗi xuất PDF: ' + err.message, 'error');
    } finally {
      setExporting(null);
    }
  };

  const handleDownloadAnswerMatrixCsv = () => {
    const rows = [['Mã đề', 'Câu', 'Đáp án', 'Câu gốc'], ...answerKeyRows(shuffledExams)];
    downloadCsv(
      `dap-an-${(editData.examTitle || 'de').replace(/[^\p{L}\p{N}]+/gu, '-')}.csv`,
      rows
    );
    sound.cheer();
    showToast(`Đã tải bảng đáp án của ${shuffledExams.length} mã đề (CSV)`, 'success');
  };

  /* ---------- OMR ---------- */
  const handlePrintOMR = () => {
    const activeVersion = shuffledExams.find((e) => e.code === activeCode);
    printOmrSheetA4({
      questions: activeVersion?.questions || editData.questions,
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
      showToast('Chưa có mã đề nào.', 'error');
      return;
    }
    setConfirmModal({
      title: `In toàn bộ ${variants.length} phiếu OMR`,
      desc: `Hệ thống sẽ mở cửa sổ in cho các mã đề: ${variants.map((v) => v.code).join(', ')}. Hãy đảm bảo trình duyệt cho phép mở popup.`,
      confirmLabel: `In ${variants.length} phiếu OMR`,
      onConfirm: () => {
        setConfirmModal(null);
        printMultipleOmrSheets(variants, {
          title: 'PHIẾU TRẢ LỜI TRẮC NGHIỆM',
          examTitle: editData.examTitle,
          subject: editData.subject,
          duration: editData.duration,
        });
        sound.cheer();
      },
    });
  };

  /* ---------- STUDENT CODE ASSIGNMENT (STEP 4) ---------- */
  const selectedClassObj = useMemo(() => {
    return classes.find((c) => c.id === selectedClassId) || null;
  }, [classes, selectedClassId]);

  const classStudentList = useMemo(() => {
    if (Array.isArray(selectedClassObj?.students) && selectedClassObj.students.length > 0) {
      return selectedClassObj.students.map((st, idx) => ({
        id: st.id || `st-${idx + 1}`,
        name: st.name || st.fullName || `Học sinh ${idx + 1}`,
        code: st.code || st.studentCode || `HS${String(idx + 1).padStart(3, '0')}`,
        seat: st.seat || `Bàn ${Math.floor(idx / 2) + 1} - ${idx % 2 === 0 ? 'Trái' : 'Phải'}`,
      }));
    }
    return DEFAULT_MOCK_STUDENTS;
  }, [selectedClassObj]);

  const studentCodeAssignments = useMemo(() => {
    const codes = shuffledExams.map((v) => v.code);
    if (codes.length === 0) return [];
    return classStudentList.map((st, idx) => {
      let assignedCode;
      if (assignStrategy === 'alternating') {
        assignedCode = codes[(idx + assignSeed) % codes.length];
      } else {
        const hash = (idx * 17 + assignSeed * 31) % codes.length;
        assignedCode = codes[hash];
      }
      return {
        ...st,
        order: idx + 1,
        examCode: assignedCode,
      };
    });
  }, [classStudentList, shuffledExams, assignStrategy, assignSeed]);

  const handleExportStudentCodesCsv = () => {
    const rows = [
      ['STT', 'Mã HS', 'Họ và tên', 'Vị trí ngồi', 'Mã đề được giao', 'Đề thi'],
      ...studentCodeAssignments.map((r) => [
        r.order,
        r.code,
        r.name,
        r.seat,
        r.examCode,
        editData.examTitle,
      ]),
    ];
    downloadCsv(
      `phan-ma-de-${(selectedClassObj?.name || 'lop').replace(/[^\p{L}\p{N}]+/gu, '-')}.csv`,
      rows
    );
    sound.cheer();
    showToast('Đã tải danh sách phân công mã đề cho học sinh (CSV)', 'success');
  };

  const handleAssignToExamRoom = () => {
    const roomPin = String(Math.floor(100000 + Math.random() * 900000));
    const payload = {
      id: `assign-${Date.now()}`,
      assignedAt: new Date().toISOString(),
      roomPin,
      examId: exam.id || `exam-${Date.now()}`,
      examTitle: editData.examTitle,
      subject: editData.subject,
      duration: editData.duration,
      classId: selectedClassId,
      className: selectedClassObj?.name || 'Lớp 12A1',
      codeCount: shuffledExams.length,
      seedInput: shuffleConfig.seedInput,
      versions: shuffledExams.map((v) => ({
        code: v.code,
        seed: v.seed,
        questionCount: v.questions.length,
      })),
      studentAssignments: studentCodeAssignments,
    };

    const existing = readJsonStorage(ASSIGNED_STORAGE_KEY, []);
    writeJsonStorage(ASSIGNED_STORAGE_KEY, [payload, ...existing].slice(0, 30));
    saveToShuffleHistory(`Giao phòng thi ${payload.className} (PIN ${roomPin})`);
    setAssignedSuccess(payload);
    if (typeof onAssignShuffled === 'function') {
      onAssignShuffled(payload);
    }
    sound.cheer();
    showToast(`Đã giao ${shuffledExams.length} mã đề vào Phòng thi (${payload.className})!`, 'success');
  };

  /* ---------- EDIT ---------- */
  const handleSaveEdit = () => {
    sound.cheer();
    setEditMode(false);
    showToast('Đã lưu thay đổi nội dung đề', 'success');
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

  const currentQ = simQuestions[simActiveQ];
  const answeredCount = Object.keys(simAnswers).filter((k) => {
    const v = simAnswers[k];
    if (Array.isArray(v)) return v.some((x) => x !== undefined);
    return v !== undefined && v !== '';
  }).length;

  const timeClass = simTimeLeft < 60 ? 'critical' : simTimeLeft < 300 ? 'urgent' : '';

  /* ---------- OMR stats ---------- */
  const omrStats = useMemo(() => {
    const qs = editData.questions || [];
    const single = qs.filter((q) => (q.type || 'single_choice') === 'single_choice').length;
    const tf = qs.filter((q) => q.type === 'true_false').length;
    const sa = qs.filter((q) => q.type === 'short_answer').length;
    return { single, tf, sa, total: qs.length };
  }, [editData.questions]);

  const activeVersionObj = useMemo(
    () => shuffledExams.find((v) => v.code === activeCode) || shuffledExams[0],
    [shuffledExams, activeCode]
  );
  const compareVersionObj = useMemo(
    () => shuffledExams.find((v) => v.code === compareCodeB) || shuffledExams[1] || shuffledExams[0],
    [shuffledExams, compareCodeB]
  );

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

        {/* 4-STEP WIZARD BAR IN HEADER */}
        <nav className="eps-wizard-steps no-print" aria-label="Quy trình 4 bước">
          {[
            { step: 1, label: '1. Đề gốc & Đặc tả' },
            { step: 2, label: '2. Cấu hình đảo' },
            { step: 3, label: '3. Xem trước & Thi thử' },
            { step: 4, label: '4. Xuất bản & Giao đề' },
          ].map((item) => (
            <button
              key={item.step}
              type="button"
              className={`eps-wizard-step ${wizardStep === item.step ? 'active' : ''} ${wizardStep > item.step ? 'done' : ''}`}
              onClick={() => handleSelectWizardStep(item.step)}
            >
              <span className="eps-wizard-num">
                {wizardStep > item.step ? <IcoCheck size={12} /> : item.step}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="eps-header-actions">
          <button
            type="button"
            className="eps-edit-btn"
            onClick={handleUndoLastShuffle}
            title="Hoàn tác / Khôi phục lần đảo gần nhất"
          >
            <IcoUndo size={14} /> Hoàn tác
          </button>

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

      {/* SUB-NAVIGATION TABS */}
      <div className="eps-subbar no-print">
        <div className="eps-tabs">
          <button
            type="button"
            className={`eps-tab ${tab === 'specs' ? 'on' : ''}`}
            onClick={() => handleSelectTab('specs', 1)}
          >
            <IcoTable size={14} /> Đặc tả đề gốc
          </button>
          <button
            type="button"
            className={`eps-tab ${tab === 'config' ? 'on' : ''}`}
            onClick={() => handleSelectTab('config', 2)}
          >
            <IcoSliders size={14} /> Cấu hình đảo ({shuffleConfig.codeCount} mã)
          </button>
          <button
            type="button"
            className={`eps-tab ${tab === 'shuffle' ? 'on' : ''}`}
            onClick={() => handleSelectTab('shuffle', 3)}
          >
            <IcoShuffle size={14} /> Xem trước & Ma trận đáp án
          </button>
          <button
            type="button"
            className={`eps-tab ${tab === 'sim' ? 'on' : ''}`}
            onClick={() => handleSelectTab('sim', 3)}
          >
            <IcoSim size={14} /> Mô phỏng thi
          </button>
          <button
            type="button"
            className={`eps-tab ${tab === 'predict' ? 'on' : ''}`}
            onClick={() => handleSelectTab('predict', 3)}
          >
            <IcoChart size={14} /> Dự đoán điểm
          </button>
          <button
            type="button"
            className={`eps-tab ${tab === 'print' ? 'on' : ''}`}
            onClick={() => handleSelectTab('print', 4)}
          >
            <IcoPrinter size={14} /> In A4
          </button>
          <button
            type="button"
            className={`eps-tab ${tab === 'omr' ? 'on' : ''}`}
            onClick={() => handleSelectTab('omr', 4)}
          >
            <IcoClipboard size={14} /> Phiếu OMR
          </button>
          <button
            type="button"
            className={`eps-tab ${tab === 'assign' ? 'on' : ''}`}
            onClick={() => handleSelectTab('assign', 4)}
          >
            <IcoUsers size={14} /> Giao Phòng thi & Lịch sử
          </button>
        </div>

        {/* Quick Validation Status Pill */}
        <div className={`eps-valid-pill ${validationReport.passed ? 'ok' : 'warn'}`}>
          {validationReport.passed ? <IcoShieldCheck size={14} /> : <IcoAlert size={14} />}
          <span>
            {validationReport.passed
              ? `Đã kiểm định ${shuffledExams.length} mã đề · Không trùng · Khớp 100% đáp án`
              : `Cảnh báo: phát hiện ${collisions.length} cặp mã trùng`}
          </span>
        </div>
      </div>

      <div className="eps-body">
        {/* ============================================================
            BƯỚC 2: TAB CẤU HÌNH ĐẢO ĐỀ (CONFIG)
            ============================================================ */}
        {tab === 'config' && (
          <div className="eps-config-layout">
            <div className="eps-config-grid">
              {/* CỘT TRÁI: THAM SỐ THUẬT TOÁN & HẠT GIỐNG */}
              <div className="eps-shuffle-card">
                <div className="eps-card-head-row">
                  <div>
                    <h3 className="eps-shuffle-card-title">Bước 2 · Cấu Hình Thuật Toán Đảo Đề</h3>
                    <p className="eps-shuffle-sub">
                      Tùy chỉnh cách hoán vị câu hỏi, phương án A/B/C/D và hạt giống tái tạo đề.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="eps-nav-btn primary"
                    onClick={() => {
                      saveToShuffleHistory();
                      handleSelectTab('shuffle', 3);
                    }}
                  >
                    Sang Bước 3: Xem trước <IcoChevronRight size={14} />
                  </button>
                </div>

                {/* Số lượng mã đề */}
                <div className="eps-cfg-block">
                  <label className="eps-cfg-label">Số lượng mã đề cần sinh (101 → {100 + shuffleConfig.codeCount})</label>
                  <div className="eps-code-count-pills">
                    {[2, 4, 6, 8].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        className={`eps-count-btn ${shuffleConfig.codeCount === cnt ? 'on' : ''}`}
                        onClick={() => setShuffleConfig((prev) => ({ ...prev, codeCount: cnt }))}
                      >
                        <strong>{cnt} mã đề</strong>
                        <small>101 – {100 + cnt}</small>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hạt giống ngẫu nhiên (Random Seed) */}
                <div className="eps-cfg-block">
                  <label className="eps-cfg-label">
                    Hạt giống ngẫu nhiên (Random Seed — nhập lại đúng mã này để tái tạo đề giống 100%)
                  </label>
                  <div className="eps-seed-row">
                    <input
                      type="text"
                      className="eps-seed-input"
                      value={shuffleConfig.seedInput}
                      onChange={(e) =>
                        setShuffleConfig((prev) => ({ ...prev, seedInput: e.target.value }))
                      }
                      placeholder="Nhập chuỗi hoặc số hạt giống (VD: HK1-2025)..."
                    />
                    <button
                      type="button"
                      className="eps-nav-btn"
                      onClick={handleGenerateNewRandomSeed}
                    >
                      <IcoRefresh size={14} /> Ngẫu nhiên mới
                    </button>
                    <button
                      type="button"
                      className="eps-nav-btn"
                      onClick={() => saveToShuffleHistory()}
                    >
                      <IcoSave size={14} /> Lưu vào lịch sử
                    </button>
                  </div>
                </div>

                {/* 5 Toggles cấu hình */}
                <div className="eps-cfg-toggles">
                  <label className="eps-toggle-row">
                    <div>
                      <strong>Đảo thứ tự câu hỏi</strong>
                      <small>Hoán vị vị trí các câu hỏi giữa các mã đề 101..{100 + shuffleConfig.codeCount}</small>
                    </div>
                    <input
                      type="checkbox"
                      checked={shuffleConfig.shuffleQuestions}
                      onChange={(e) =>
                        setShuffleConfig((prev) => ({ ...prev, shuffleQuestions: e.target.checked }))
                      }
                    />
                  </label>

                  <label className="eps-toggle-row">
                    <div>
                      <strong>Đảo thứ tự đáp án A / B / C / D</strong>
                      <small>Hoán vị các lựa chọn trả lời và tự động cập nhật đáp án đúng</small>
                    </div>
                    <input
                      type="checkbox"
                      checked={shuffleConfig.shuffleOptions}
                      onChange={(e) =>
                        setShuffleConfig((prev) => ({ ...prev, shuffleOptions: e.target.checked }))
                      }
                    />
                  </label>

                  <label className="eps-toggle-row">
                    <div>
                      <strong>Giữ nguyên nhóm độ khó (NB → TH → VD → VDC)</strong>
                      <small>Đảm bảo câu dễ luôn nằm đầu đề và câu vận dụng cao nằm cuối đề</small>
                    </div>
                    <input
                      type="checkbox"
                      checked={shuffleConfig.keepDifficultyGroups}
                      onChange={(e) =>
                        setShuffleConfig((prev) => ({
                          ...prev,
                          keepDifficultyGroups: e.target.checked,
                        }))
                      }
                    />
                  </label>

                  <label className="eps-toggle-row">
                    <div>
                      <strong>Giữ nguyên nhóm câu liên kết / Đọc hiểu</strong>
                      <small>Các câu có chung đoạn văn hoặc chuyên đề liên kết (groupId) luôn đi liền nhau</small>
                    </div>
                    <input
                      type="checkbox"
                      checked={shuffleConfig.keepLinkedGroups}
                      onChange={(e) =>
                        setShuffleConfig((prev) => ({ ...prev, keepLinkedGroups: e.target.checked }))
                      }
                    />
                  </label>

                  <label className="eps-toggle-row highlight">
                    <div>
                      <strong>Xử lý thông minh phương án "Cả A và B đúng / Tất cả các đáp án trên"</strong>
                      <small>
                        Tự động phát hiện và khóa thứ tự A/B/C/D ở những câu có phương án phụ thuộc vị trí để tránh sai ngữ nghĩa
                      </small>
                    </div>
                    <input
                      type="checkbox"
                      checked={shuffleConfig.smartSpecialOptions}
                      onChange={(e) =>
                        setShuffleConfig((prev) => ({
                          ...prev,
                          smartSpecialOptions: e.target.checked,
                        }))
                      }
                    />
                  </label>
                </div>

                {/* Mẫu đảo (Presets) */}
                <div className="eps-cfg-block">
                  <label className="eps-cfg-label">Mẫu đảo đề lưu sẵn (Áp dụng 1 chạm)</label>
                  <div className="eps-preset-list">
                    {presets.map((p) => (
                      <div key={p.id} className="eps-preset-chip">
                        <button
                          type="button"
                          className="eps-preset-apply"
                          onClick={() => handleApplyPreset(p)}
                        >
                          <IcoShuffle size={13} />
                          <span>{p.name}</span>
                        </button>
                        {!p.isDefault && (
                          <button
                            type="button"
                            className="eps-preset-del"
                            onClick={() => handleDeletePreset(p.id)}
                            title="Xóa mẫu đảo này"
                          >
                            <IcoTrash size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="eps-seed-row" style={{ marginTop: '0.6rem' }}>
                    <input
                      type="text"
                      className="eps-seed-input"
                      value={newPresetName}
                      onChange={(e) => setNewPresetName(e.target.value)}
                      placeholder="Đặt tên mẫu cấu hình hiện tại (VD: Kiểm tra 15p khối 11)..."
                    />
                    <button
                      type="button"
                      className="eps-nav-btn"
                      onClick={handleSavePreset}
                    >
                      <IcoSave size={14} /> Lưu mẫu đảo
                    </button>
                  </div>
                </div>
              </div>

              {/* CỘT PHẢI: KHÓA VỊ TRÍ CÂU CỐ ĐỊNH & CẢNH BÁO PHƯƠNG ÁN ĐẶC BIỆT */}
              <div className="eps-shuffle-card">
                <div className="eps-card-head-row">
                  <div>
                    <h4 className="eps-shuffle-card-title">
                      Khóa Câu Cố Định Vị Trí ({lockedIndices.length}/{editData.questions.length} câu đã ghim)
                    </h4>
                    <p className="eps-shuffle-sub">
                      Câu được ghim sẽ đứng yên ở đúng số thứ tự gốc trên tất cả các mã đề.
                    </p>
                  </div>
                  <div className="eps-lock-quick-btns">
                    <button
                      type="button"
                      className="eps-mini-btn"
                      onClick={() => {
                        if (editData.questions.length > 0) {
                          const firstLast = [0];
                          if (editData.questions.length > 1) {
                            firstLast.push(editData.questions.length - 1);
                          }
                          setLockedIndices(firstLast);
                        }
                      }}
                    >
                      Ghim câu đầu & cuối
                    </button>
                    {lockedIndices.length > 0 && (
                      <button
                        type="button"
                        className="eps-mini-btn"
                        onClick={() => setLockedIndices([])}
                      >
                        Bỏ ghim tất cả
                      </button>
                    )}
                  </div>
                </div>

                <div className="eps-lock-list">
                  {editData.questions.map((q, idx) => {
                    const isLocked = lockedIndices.includes(idx);
                    const lvMeta = LEVEL_INFO[normLevel(q.level)] || LEVEL_INFO.nb;
                    const specialInfo = analyzePositionalOptions(q.options || []);
                    return (
                      <div
                        key={idx}
                        className={`eps-lock-item ${isLocked ? 'locked' : ''}`}
                      >
                        <button
                          type="button"
                          className={`eps-lock-toggle ${isLocked ? 'on' : ''}`}
                          onClick={() => toggleLockQuestion(idx)}
                          title={isLocked ? 'Bỏ ghim vị trí câu này' : 'Ghim cố định vị trí câu này'}
                        >
                          {isLocked ? <IcoLock size={14} /> : <IcoUnlock size={14} />}
                          <span>Câu {idx + 1}</span>
                        </button>

                        <div className="eps-lock-content">
                          <div className="eps-lock-qtext">
                            {useMath ? <MathText text={q.q} /> : q.q}
                          </div>
                          <div className="eps-lock-meta">
                            <span
                              className="eps-specs-level"
                              style={{ background: lvMeta.bg, color: lvMeta.color }}
                            >
                              {lvMeta.label}
                            </span>
                            {isLocked && (
                              <span className="eps-tag-locked">
                                <IcoLock size={11} /> Luôn ở vị trí Câu {idx + 1}
                              </span>
                            )}
                            {specialInfo.hasSpecial && (
                              <span className="eps-tag-special">
                                <IcoShieldCheck size={11} /> {specialInfo.reason}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            BƯỚC 3A: TAB MÔ PHỎNG THI THỬ (SIM)
            ============================================================ */}
        {tab === 'sim' && (
          <div className="eps-sim-layout">
            <div className="eps-q-card">
              {/* Thanh chọn mã đề muốn chạy thử */}
              <div className="eps-sim-code-bar">
                <span>Đang thi thử theo:</span>
                <div className="eps-shuffle-tabs">
                  {shuffledExams.map((ex) => (
                    <button
                      key={ex.code}
                      type="button"
                      className={`eps-shuffle-tab ${simCode === ex.code ? 'on' : ''}`}
                      onClick={() => {
                        setSimCode(ex.code);
                        handleReset();
                      }}
                    >
                      Mã {ex.code}
                    </button>
                  ))}
                </div>
              </div>

              {currentQ ? (
                <>
                  <div className="eps-q-head">
                    <span className="eps-q-num">
                      Câu {simActiveQ + 1} / {simQuestions.length} ({currentQ.points || 1} điểm)
                      {currentQ.originalIndex && simCode !== '101' && (
                        <small className="eps-orig-ref"> · Câu gốc #{currentQ.originalIndex}</small>
                      )}
                    </span>
                    <div className="eps-q-badges">
                      <span className="eps-badge level">
                        {LEVEL_INFO[normLevel(currentQ.level)]?.label?.toUpperCase() || 'THÔNG HIỂU'}
                      </span>
                      {currentQ.isPositionLocked && (
                        <span className="eps-badge locked">
                          <IcoLock size={11} /> Đã ghim vị trí
                        </span>
                      )}
                      {currentQ.optionLockedReason && (
                        <span className="eps-badge special" title={currentQ.optionLockedReason}>
                          <IcoShieldCheck size={11} /> Bảo vệ thứ tự A/B/C/D
                        </span>
                      )}
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
                  {currentQ.image && (
                    <img
                      src={currentQ.image}
                      alt={currentQ.imageAlt || 'Hình minh hoạ'}
                      style={{
                        display: 'block',
                        maxWidth: '100%',
                        maxHeight: 420,
                        margin: '.4rem auto 1rem',
                        objectFit: 'contain',
                        borderRadius: 10,
                        background: '#fff',
                      }}
                    />
                  )}

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
                              <span
                                style={{
                                  color: '#16a34a',
                                  fontWeight: 800,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
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
                      disabled={simActiveQ === simQuestions.length - 1}
                      onClick={() => setSimActiveQ((i) => Math.min(simQuestions.length - 1, i + 1))}
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
                <IcoTable size={14} /> Bảng câu hỏi ({answeredCount}/{simQuestions.length})
              </button>

              <div className="eps-timer-card">
                <span className="eps-timer-label">
                  <IcoClock size={14} /> Thời gian còn lại (Mã {simCode})
                </span>
                <strong className={`eps-timer-value ${timeClass}`}>
                  {fmtTime(simTimeLeft)}
                </strong>
              </div>

              <div className="eps-answer-grid">
                <div className="eps-answer-grid-head">
                  <span>Bảng câu hỏi</span>
                  <span>{answeredCount}/{simQuestions.length}</span>
                </div>

                <div className="eps-answer-cells">
                  {simQuestions.map((_, idx) => {
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
                    onClick={requestSubmitSimulation}
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

        {/* ============================================================
            BƯỚC 3B: DỰ ĐOÁN ĐIỂM & ĐỘ KHÓ TỔNG THỂ (PREDICT)
            ============================================================ */}
        {tab === 'predict' && (
          <div className="eps-shuffle-layout">
            <div className="eps-shuffle-head">
              <div>
                <h3 className="eps-shuffle-title">Dự Đoán Phổ Điểm & Độ Khó Tổng Thể</h3>
                <p className="eps-shuffle-sub">
                  Mô hình ước lượng từ ma trận nhận thức (NB / TH / VD / VDC) và thời lượng làm bài {editData.duration} phút.
                </p>
              </div>
              <button
                type="button"
                className="eps-nav-btn primary"
                onClick={() => handleSelectTab('assign', 4)}
              >
                Sang Bước 4: Giao đề & Xuất bản <IcoChevronRight size={14} />
              </button>
            </div>

            <div className="eps-predict-kpis">
              <div className="eps-predict-kpi">
                <span className="eps-predict-kpi-label">Điểm trung bình dự kiến</span>
                <strong className="eps-predict-kpi-val blue">{prediction.avgScore} / 10</strong>
                <small>Tỷ lệ đạt (≥ 5.0): ~{prediction.passRate}% học sinh</small>
              </div>
              <div className="eps-predict-kpi">
                <span className="eps-predict-kpi-label">Chỉ số độ khó tổng thể</span>
                <strong className="eps-predict-kpi-val purple">{prediction.difficultyIndex} / 10</strong>
                <small>{prediction.difficultyLabel}</small>
              </div>
              <div className="eps-predict-kpi">
                <span className="eps-predict-kpi-label">Thời gian hoàn thành dự kiến</span>
                <strong className="eps-predict-kpi-val green">
                  ~{prediction.estMinutes} / {editData.duration} phút
                </strong>
                <small>{prediction.timePressure}</small>
              </div>
            </div>

            <div className="eps-config-grid">
              <div className="eps-shuffle-card">
                <h4 className="eps-shuffle-card-title">Biểu Đồ Phổ Điểm Dự Kiến</h4>
                <div className="eps-dist-bars">
                  {prediction.buckets.map((b, i) => (
                    <div key={i} className="eps-dist-row">
                      <div className="eps-dist-meta">
                        <span>{b.label}</span>
                        <strong>{b.pct}%</strong>
                      </div>
                      <div className="eps-dist-track">
                        <div
                          className="eps-dist-fill"
                          style={{ width: `${b.pct}%`, background: b.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="eps-shuffle-card">
                <h4 className="eps-shuffle-card-title">Cấu Trúc Mức Độ Nhận Thức Trong Đề</h4>
                <div className="eps-dist-bars">
                  {[
                    { key: 'nb', label: 'Nhận biết (NB)', count: prediction.counts.nb, color: '#0284c7' },
                    { key: 'th', label: 'Thông hiểu (TH)', count: prediction.counts.th, color: '#16a34a' },
                    { key: 'vd', label: 'Vận dụng (VD)', count: prediction.counts.vd, color: '#d97706' },
                    { key: 'vdc', label: 'Vận dụng cao (VDC)', count: prediction.counts.vdc, color: '#dc2626' },
                  ].map((lv) => {
                    const pct = prediction.total > 0 ? Math.round((lv.count / prediction.total) * 100) : 0;
                    return (
                      <div key={lv.key} className="eps-dist-row">
                        <div className="eps-dist-meta">
                          <span>{lv.label}</span>
                          <strong>{lv.count} câu ({pct}%)</strong>
                        </div>
                        <div className="eps-dist-track">
                          <div
                            className="eps-dist-fill"
                            style={{ width: `${pct}%`, background: lv.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            BƯỚC 3C: XEM TRƯỚC SONG SONG, KIỂM TRA TỰ ĐỘNG & MA TRẬN ĐÁP ÁN (SHUFFLE)
            ============================================================ */}
        {tab === 'shuffle' && (
          <div className="eps-shuffle-layout">
            {/* 1. AUTO-VALIDATION BANNER (4 TIÊU CHÍ KIỂM ĐỊNH TỰ ĐỘNG) */}
            <div className={`eps-validation-banner ${validationReport.passed ? 'passed' : 'failed'}`}>
              <div className="eps-validation-head">
                <div className="eps-validation-title">
                  <IcoShieldCheck size={18} />
                  <strong>Báo Cáo Kiểm Định Tự Động ({shuffledExams.length} mã đề · Seed: {shuffleConfig.seedInput})</strong>
                </div>
                <div className="eps-validation-actions">
                  <button
                    type="button"
                    className="eps-mini-btn"
                    onClick={() => handleSelectTab('config', 2)}
                  >
                    <IcoSliders size={13} /> Tùy chỉnh cấu hình đảo
                  </button>
                  <button
                    type="button"
                    className="eps-mini-btn primary"
                    onClick={() => handleSelectTab('assign', 4)}
                  >
                    Sang Bước 4: Xuất bản / Giao đề <IcoChevronRight size={13} />
                  </button>
                </div>
              </div>

              <div className="eps-validation-checks">
                <div className={`eps-vcheck ${validationReport.allCountMatch ? 'ok' : 'err'}`}>
                  <span className="eps-vcheck-ico"><IcoCheck size={13} /></span>
                  <div>
                    <b>Đủ {editData.questions.length}/{editData.questions.length} câu hỏi</b>
                    <small>Tất cả {shuffledExams.length} mã đề đều bảo toàn 100% tập câu gốc</small>
                  </div>
                </div>

                <div className={`eps-vcheck ${validationReport.allAnswerKeysValid ? 'ok' : 'err'}`}>
                  <span className="eps-vcheck-ico"><IcoCheck size={13} /></span>
                  <div>
                    <b>Đáp án đúng khớp 100%</b>
                    <small>Tự động ánh xạ chính xác phương án đúng sau khi đảo A/B/C/D</small>
                  </div>
                </div>

                <div className={`eps-vcheck ${collisions.length === 0 ? 'ok' : 'err'}`}>
                  <span className="eps-vcheck-ico">
                    {collisions.length === 0 ? <IcoCheck size={13} /> : <IcoAlert size={13} />}
                  </span>
                  <div>
                    <b>{collisions.length === 0 ? 'Không có mã đề trùng nhau' : `Trùng ${collisions.length} cặp mã`}</b>
                    <small>
                      {collisions.length === 0
                        ? `Các mã 101–${100 + shuffledExams.length} khác biệt hoàn toàn`
                        : `Cặp trùng: ${collisions.map(([a, b]) => `${a}=${b}`).join(', ')}`}
                    </small>
                  </div>
                </div>

                <div className="eps-vcheck ok">
                  <span className="eps-vcheck-ico"><IcoCheck size={13} /></span>
                  <div>
                    <b>Bảo vệ phương án đặc biệt & câu ghim</b>
                    <small>
                      {validationReport.specialOptionsHandled} câu có "Cả A và B / Tất cả trên" · {validationReport.lockedQuestionsCount} câu ghim vị trí
                    </small>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. THANH CHUYỂN CHẾ ĐỘ XEM TRƯỚC: 1 MÃ ĐỀ vs SONG SONG 2 MÃ ĐỀ */}
            <div className="eps-shuffle-head">
              <div>
                <h3 className="eps-shuffle-title">
                  Bộ {shuffledExams.length} Mã Đề Thi Hoán Vị (101 – {100 + shuffledExams.length})
                </h3>
                <p className="eps-shuffle-sub">
                  Đối chiếu trực quan từng mã đề hoặc so sánh song song 2 mã đề cạnh nhau.
                </p>
              </div>

              <div className="eps-preview-mode-switch">
                <button
                  type="button"
                  className={`eps-shuffle-tab ${previewMode === 'single' ? 'on' : ''}`}
                  onClick={() => setPreviewMode('single')}
                >
                  Xem 1 mã đề
                </button>
                <button
                  type="button"
                  className={`eps-shuffle-tab ${previewMode === 'side-by-side' ? 'on' : ''}`}
                  onClick={() => setPreviewMode('side-by-side')}
                >
                  <IcoColumns size={14} /> So sánh song song 2 mã đề
                </button>
              </div>
            </div>

            {/* 3. KHUNG SO SÁNH SONG SONG 2 MÃ ĐỀ HOẶC XEM 1 MÃ ĐỀ */}
            <div className="eps-shuffle-card">
              <div className="eps-card-head-row">
                <div className="eps-shuffle-tabs">
                  <span className="eps-code-picker-label">
                    {previewMode === 'side-by-side' ? 'Mã đề cột trái:' : 'Chọn mã đề:'}
                  </span>
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

                {previewMode === 'side-by-side' && (
                  <div className="eps-shuffle-tabs">
                    <span className="eps-code-picker-label">Mã đề cột phải:</span>
                    {shuffledExams.map((ex) => (
                      <button
                        key={ex.code}
                        type="button"
                        className={`eps-shuffle-tab ${compareCodeB === ex.code ? 'on' : ''}`}
                        onClick={() => setCompareCodeB(ex.code)}
                      >
                        Mã {ex.code}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className={`eps-code-preview-grid ${previewMode === 'side-by-side' ? 'two-cols' : 'one-col'}`}>
                {[
                  activeVersionObj,
                  ...(previewMode === 'side-by-side' ? [compareVersionObj] : []),
                ].map((ver, colIdx) => {
                  if (!ver) return null;
                  return (
                    <div key={`${ver.code}-${colIdx}`} className="eps-code-column">
                      <div className="eps-code-col-head">
                        <strong>MÃ ĐỀ {ver.code}</strong>
                        <span>Seed #{ver.seed} · {ver.questions.length} câu</span>
                      </div>
                      <div className="eps-code-col-body">
                        {ver.questions.map((q, qIdx) => {
                          const type = q.type || 'single_choice';
                          return (
                            <div key={qIdx} className="eps-preview-q-item">
                              <div className="eps-preview-q-top">
                                <strong>Câu {qIdx + 1}</strong>
                                <span className="eps-preview-orig-tag">
                                  Gốc: Câu {q.originalIndex}
                                </span>
                                {q.isPositionLocked && (
                                  <span className="eps-tag-locked">
                                    <IcoLock size={11} /> Cố định vị trí
                                  </span>
                                )}
                                {q.optionLockedReason && (
                                  <span className="eps-tag-special">
                                    <IcoShieldCheck size={11} /> {q.optionLockedReason}
                                  </span>
                                )}
                              </div>
                              <div className="eps-preview-q-text">
                                {useMath ? <MathText text={q.q} /> : q.q}
                              </div>
                              {type === 'single_choice' && (
                                <div className="eps-preview-opts">
                                  {(q.options || []).map((opt, oIdx) => {
                                    const isAns = q.correct === oIdx;
                                    return (
                                      <div
                                        key={oIdx}
                                        className={`eps-preview-opt ${isAns ? 'correct' : ''}`}
                                      >
                                        <b>{String.fromCharCode(65 + oIdx)}.</b>{' '}
                                        <span>{useMath ? <MathText text={opt} /> : opt}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. BẢNG MA TRẬN ĐỐI CHIẾU ĐÁP ÁN CHÉO */}
            <div className="eps-shuffle-card">
              <div className="eps-card-head-row">
                <div>
                  <h4 className="eps-shuffle-card-title">Bảng Ma Trận Đối Chiếu Đáp Án Chéo</h4>
                  <p className="eps-shuffle-sub">
                    Tra cứu nhanh đáp án của toàn bộ {shuffledExams.length} mã đề (101 – {100 + shuffledExams.length}).
                  </p>
                </div>
                <div className="eps-shuffle-tabs">
                  <button
                    type="button"
                    className={`eps-shuffle-tab ${matrixMode === 'by-orig' ? 'on' : ''}`}
                    onClick={() => setMatrixMode('by-orig')}
                  >
                    Theo Câu gốc
                  </button>
                  <button
                    type="button"
                    className={`eps-shuffle-tab ${matrixMode === 'by-code' ? 'on' : ''}`}
                    onClick={() => setMatrixMode('by-code')}
                  >
                    Theo Câu trên từng Mã đề
                  </button>
                  <button
                    type="button"
                    className="eps-shuffle-tab"
                    onClick={handleDownloadAnswerMatrixCsv}
                  >
                    <IcoDownload size={13} /> Xuất CSV
                  </button>
                </div>
              </div>

              <div className="eps-shuffle-table-wrap">
                <table className="eps-shuffle-table">
                  <thead>
                    <tr>
                      <th>{matrixMode === 'by-orig' ? 'Câu Gốc' : 'Câu Trên Mã'}</th>
                      {shuffledExams.map((ex, cIdx) => (
                        <th key={ex.code} style={{ color: CODE_COLORS[cIdx % CODE_COLORS.length] }}>
                          Mã {ex.code}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {editData.questions.map((_, idx) => (
                      <tr key={idx}>
                        <td className="eps-shuffle-orig">Câu {idx + 1}</td>
                        {shuffledExams.map((ex, cIdx) => {
                          const color = CODE_COLORS[cIdx % CODE_COLORS.length];
                          if (matrixMode === 'by-orig') {
                            const mapping = ex.origToNew?.[idx + 1];
                            if (!mapping) return <td key={ex.code}>—</td>;
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
                          }
                          // matrixMode === 'by-code'
                          const mapping = ex.newToOrig?.[idx + 1];
                          if (!mapping) return <td key={ex.code}>—</td>;
                          return (
                            <td key={ex.code}>
                              {mapping.type === 'single_choice' ? (
                                <>
                                  <strong style={{ fontSize: '0.96rem', color }}>
                                    {mapping.newLetter}
                                  </strong>
                                  <span className="eps-shuffle-mapping">
                                    (Gốc #{mapping.origNum})
                                  </span>
                                </>
                              ) : (
                                <span className="eps-shuffle-mapping">
                                  {mapping.type === 'true_false' ? 'Đ/S' : 'TLN'} · Gốc #{mapping.origNum}
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
                * Các câu có phương án liên kết vị trí ("Cả A và B đúng", "Tất cả các đáp án trên") được hệ thống tự động cố định thứ tự đáp án để bảo toàn ngữ nghĩa.
              </p>
            </div>
          </div>
        )}

        {/* ============================================================
            BƯỚC 4A: IN A4 CHUẨN BỘ GD&ĐT (PRINT)
            ============================================================ */}
        {tab === 'print' && (() => {
          const activeExamVersion = shuffledExams.find((e) => e.code === activeCode) || {
            questions: editData.questions,
          };
          const printQuestions = activeExamVersion.questions || editData.questions;

          return (
            <div className="eps-print-layout">
              {collisions.length > 0 && (
                <p
                  className="no-print"
                  style={{
                    margin: '0 0 0.5rem',
                    padding: '0.5rem 0.7rem',
                    borderRadius: 10,
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    background: 'rgba(239, 68, 68, 0.08)',
                    color: '#b91c1c',
                    fontSize: '0.8rem',
                    lineHeight: 1.5,
                  }}
                >
                  Cảnh báo: mã đề {collisions.map(([a, b]) => `${a} và ${b}`).join(', ')} trùng nhau
                  hoàn toàn (cùng thứ tự câu và đáp án). Thêm câu hỏi hoặc bật đảo lựa chọn trước khi in.
                </p>
              )}
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
                  <button
                    type="button"
                    className="eps-print-code-btn"
                    style={{ borderStyle: 'dashed' }}
                    onClick={handleDownloadAnswerMatrixCsv}
                    title="Tải bảng đáp án của tất cả mã đề (CSV)"
                  >
                    Đáp án tất cả mã (CSV)
                  </button>
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
                    <p className="a4-school">
                      {teacherExamPrefs.headerDeptName ? `${teacherExamPrefs.headerDeptName} · ` : ''}
                      {teacherExamPrefs.headerSchoolName || 'TRƯỜNG THPT'}
                    </p>
                    {teacherExamPrefs.headerSubjectGroup && (
                      <p style={{ margin: '0 0 0.15rem', fontSize: '0.78rem', fontWeight: 700 }}>
                        {teacherExamPrefs.headerSubjectGroup}
                      </p>
                    )}
                    <p className="a4-title">{editData.examTitle.toUpperCase()}</p>
                    <p className="a4-subject">Môn: {editData.subject}</p>
                  </div>
                  <div className="a4-head-right">
                    <p className="a4-kick">{teacherExamPrefs.headerExamMotto || 'KỲ THI ĐÁNH GIÁ NĂNG LỰC HỌC TẬP'}</p>
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

                {(teacherExamPrefs.footerSignature || teacherExamPrefs.footerTeacherSign) && (
                  <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', fontSize: '0.86rem' }}>
                    <em style={{ color: '#334155' }}>
                      {teacherExamPrefs.footerSignature || '--- HẾT ---'}
                    </em>
                    {teacherExamPrefs.footerTeacherSign && (
                      <div style={{ textAlign: 'right', fontWeight: 700 }}>
                        <div>Giáo viên ra đề</div>
                        <div style={{ marginTop: '0.25rem' }}>{teacherExamPrefs.footerTeacherSign}</div>
                      </div>
                    )}
                  </div>
                )}

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

        {/* ============================================================
            BƯỚC 4B: PHIẾU OMR (OMR)
            ============================================================ */}
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

              <button
                type="button"
                className="eps-omr-btn primary"
                style={{ background: '#059669', borderColor: '#059669' }}
                onClick={handleSendKeysToPaperGrading}
                disabled={sendingToOmr}
                title="Tạo ngay bài chấm phiếu A4 chứa sẵn đáp án của toàn bộ mã đề đã đảo"
              >
                <IcoCheck size={16} /> {sendingToOmr ? 'Đang tạo bài chấm…' : `Đẩy ${shuffledExams.length} mã đáp án sang Chấm phiếu A4`}
              </button>
            </div>

            <div className="eps-omr-note">
              <b style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <IcoBulb size={16} /> Hướng dẫn:
              </b>
              <ol>
                <li>In phiếu OMR ra giấy A4 (khuyến nghị <b>1 mặt</b>, giấy trắng mịn).</li>
                <li>Phát cho HS kèm đề thi (HS làm bài trên đề, tô đáp án vào phiếu).</li>
                <li>Thu phiếu → vào <b>Chấm phiếu A4</b> → upload ảnh/chụp ảnh.</li>
                <li>Hệ thống tự align qua fiducial marks và chấm điểm.</li>
              </ol>
            </div>
          </div>
        )}

        {/* ============================================================
            BƯỚC 4C: GIAO PHÒNG THI, GÁN MÃ ĐỀ TỰ ĐỘNG & LỊCH SỬ ĐẢO (ASSIGN)
            ============================================================ */}
        {tab === 'assign' && (
          <div className="eps-shuffle-layout">
            <div className="eps-config-grid">
              {/* CỘT TRÁI: GIAO VÀO PHÒNG THI & PHÂN MÃ ĐỀ CHO HỌC SINH */}
              <div className="eps-shuffle-card">
                <div className="eps-card-head-row">
                  <div>
                    <h3 className="eps-shuffle-card-title">
                      Giao Thẳng Vào Phòng Thi & Gán Mã Đề Tự Động
                    </h3>
                    <p className="eps-shuffle-sub">
                      Hệ thống tự động chia đều {shuffledExams.length} mã đề (101 – {100 + shuffledExams.length}) cho danh sách học sinh, chống trùng mã đề hai bàn cạnh nhau.
                    </p>
                  </div>
                </div>

                <div className="eps-assign-controls">
                  <label className="eps-edit-field">
                    <span>Chọn lớp học nhận đề</span>
                    <select
                      className="eps-select"
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                    >
                      {classes.length > 0 ? (
                        classes.map((c) => (
                          <option key={c.id} value={c.id}>
                            Lớp {c.name} ({c.students?.length || 12} học sinh)
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="default-class">Lớp 12A1 — Chọn lọc (12 học sinh)</option>
                          <option value="class-12a2">Lớp 12A2 — Thực nghiệm (12 học sinh)</option>
                          <option value="class-11a1">Lớp 11A1 — Chuyên Hóa (12 học sinh)</option>
                        </>
                      )}
                    </select>
                  </label>

                  <label className="eps-edit-field">
                    <span>Chiến lược phân mã đề</span>
                    <select
                      className="eps-select"
                      value={assignStrategy}
                      onChange={(e) => setAssignStrategy(e.target.value)}
                    >
                      <option value="alternating">
                        Xen kẽ theo bàn ngồi (2 học sinh cạnh nhau luôn khác mã đề)
                      </option>
                      <option value="random-balanced">
                        Ngẫu nhiên cân bằng theo SBD
                      </option>
                    </select>
                  </label>
                </div>

                <div className="eps-assign-actions-row">
                  <button
                    type="button"
                    className="eps-nav-btn"
                    onClick={() => setAssignSeed((s) => s + 1)}
                  >
                    <IcoRefresh size={14} /> Đổi lượt gán mã
                  </button>
                  <button
                    type="button"
                    className="eps-nav-btn"
                    onClick={handleExportStudentCodesCsv}
                  >
                    <IcoDownload size={14} /> Tải danh sách phân mã (CSV)
                  </button>
                  <button
                    type="button"
                    className="eps-nav-btn primary"
                    onClick={handleAssignToExamRoom}
                  >
                    <IcoSend size={14} /> Giao {shuffledExams.length} mã đề vào Phòng thi
                  </button>
                </div>

                {assignedSuccess && (
                  <div className="eps-assign-success-banner">
                    <IcoCheck size={16} />
                    <div>
                      <strong>
                        Đã giao đề thành công cho {assignedSuccess.className} · Mã PIN phòng thi: {assignedSuccess.roomPin}
                      </strong>
                      <small>
                        Đã gán tự động {assignedSuccess.codeCount} mã đề cho {assignedSuccess.studentAssignments.length} học sinh lúc{' '}
                        {new Date(assignedSuccess.assignedAt).toLocaleTimeString('vi-VN')}.
                      </small>
                    </div>
                  </div>
                )}

                <div className="eps-shuffle-table-wrap" style={{ marginTop: '0.85rem', maxHeight: 320 }}>
                  <table className="eps-shuffle-table">
                    <thead>
                      <tr>
                        <th>STT</th>
                        <th>Mã HS</th>
                        <th style={{ textAlign: 'left' }}>Họ và tên</th>
                        <th>Vị trí chỗ ngồi</th>
                        <th>Mã đề được gán</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentCodeAssignments.map((st) => (
                        <tr key={st.id}>
                          <td>{st.order}</td>
                          <td><code>{st.code}</code></td>
                          <td style={{ textAlign: 'left', fontWeight: 700 }}>{st.name}</td>
                          <td>{st.seat}</td>
                          <td>
                            <span className="eps-assigned-code-badge">Mã {st.examCode}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* CỘT PHẢI: LỊCH SỬ CÁC LẦN ĐẢO & SO SÁNH / HOÀN TÁC */}
              <div className="eps-shuffle-card">
                <div className="eps-card-head-row">
                  <div>
                    <h3 className="eps-shuffle-card-title">
                      <IcoHistory size={16} /> Lịch Sử Các Lần Đảo Đề ({shuffleHistory.length})
                    </h3>
                    <p className="eps-shuffle-sub">
                      Khôi phục y hệt 100% bất kỳ lần đảo đề nào trước đó hoặc đối chiếu cấu hình.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="eps-mini-btn"
                    onClick={() => saveToShuffleHistory()}
                  >
                    <IcoSave size={13} /> Lưu phiên hiện tại
                  </button>
                </div>

                {shuffleHistory.length === 0 ? (
                  <div className="eps-history-empty">
                    Chưa có lịch sử đảo đề nào được lưu. Bấm <b>"Lưu phiên hiện tại"</b> hoặc <b>"Giao vào Phòng thi"</b> để lưu mốc lịch sử.
                  </div>
                ) : (
                  <div className="eps-history-list">
                    {shuffleHistory.map((item) => (
                      <div key={item.id} className="eps-history-item">
                        <div className="eps-history-main">
                          <strong>{item.examTitle}</strong>
                          <span>
                            {new Date(item.timestamp).toLocaleString('vi-VN')} · {item.codeCount} mã đề ({(item.codes || []).join(', ')}) · Seed: <code>{item.seedInput}</code>
                          </span>
                          {item.note && <small>{item.note}</small>}
                        </div>
                        <div className="eps-history-btns">
                          <button
                            type="button"
                            className="eps-mini-btn"
                            onClick={() => setCompareHistoryItem(item)}
                          >
                            So sánh
                          </button>
                          <button
                            type="button"
                            className="eps-mini-btn primary"
                            onClick={() => handleRestoreHistory(item)}
                          >
                            <IcoUndo size={12} /> Khôi phục
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {compareHistoryItem && (
                  <div className="eps-history-compare-box">
                    <div className="eps-card-head-row">
                      <strong>So sánh với bản lưu lúc {new Date(compareHistoryItem.timestamp).toLocaleTimeString('vi-VN')}</strong>
                      <button
                        type="button"
                        className="eps-mini-btn"
                        onClick={() => setCompareHistoryItem(null)}
                      >
                        Đóng
                      </button>
                    </div>
                    <div className="eps-history-compare-grid">
                      <div>
                        <small>Phiên hiện tại</small>
                        <p>{shuffleConfig.codeCount} mã · Seed: <b>{shuffleConfig.seedInput}</b></p>
                        <p>Ghim vị trí: {lockedIndices.length} câu</p>
                      </div>
                      <div>
                        <small>Bản lịch sử đã chọn</small>
                        <p>{compareHistoryItem.codeCount} mã · Seed: <b>{compareHistoryItem.seedInput}</b></p>
                        <p>Ghim vị trí: {(compareHistoryItem.lockedIndices || []).length} câu</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            BƯỚC 1: TAB BẢNG ĐẶC TẢ ĐỀ GỐC (SPECS)
            ============================================================ */}
        {tab === 'specs' && (
          <div className="eps-specs-layout">
            <div className="eps-card-head-row" style={{ marginBottom: '0.75rem' }}>
              <div>
                <h3 className="eps-specs-title">Bảng Đặc Tả Đề Thi & Yêu Cầu Cần Đạt (Chuẩn GDPT 2018)</h3>
                <p className="eps-specs-sub" style={{ margin: 0 }}>
                  Môn {editData.subject} · Lớp {matrix?.grade || exam?.grade || '—'} · {editData.questions.length} câu · {editData.duration} phút
                </p>
              </div>
              <button
                type="button"
                className="eps-nav-btn primary"
                onClick={() => handleSelectTab('config', 2)}
              >
                Sang Bước 2: Cấu hình đảo đề <IcoChevronRight size={14} />
              </button>
            </div>

            <div className="eps-specs-table-wrap">
              <table className="eps-specs-table">
                <thead>
                  <tr>
                    <th style={{ width: 60 }}>Câu</th>
                    <th style={{ width: 110 }}>Loại</th>
                    <th>Chuyên Đề</th>
                    <th style={{ width: 130 }}>Mức Độ</th>
                    <th>Yêu Cầu Cần Đạt & Ghi Chú Đảo</th>
                    <th style={{ width: 80 }}>Điểm</th>
                  </tr>
                </thead>
                <tbody>
                  {editData.questions.map((q, idx) => {
                    const lvMeta = LEVEL_INFO[normLevel(q.level)] || LEVEL_INFO.nb;
                    const type = q.type || 'single_choice';
                    const hasSpecial = hasPositionalOption(q.options || []);
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
                          {hasSpecial && (
                            <span className="eps-tag-special" style={{ marginLeft: 8 }}>
                              <IcoShieldCheck size={11} /> Có phương án liên kết vị trí
                            </span>
                          )}
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

      {/* INTERNAL CONFIRMATION MODAL (THAY THẾ WINDOW.CONFIRM) */}
      {confirmModal && (
        <div className="eps-modal-backdrop" onClick={() => setConfirmModal(null)}>
          <div className="eps-modal-card" onClick={(e) => e.stopPropagation()}>
            <h4 className="eps-modal-title">{confirmModal.title}</h4>
            <p className="eps-modal-desc">{confirmModal.desc}</p>
            <div className="eps-modal-actions">
              <button
                type="button"
                className="eps-nav-btn"
                onClick={() => setConfirmModal(null)}
              >
                Quay lại
              </button>
              <button
                type="button"
                className="eps-nav-btn primary"
                onClick={confirmModal.onConfirm}
              >
                <IcoCheck size={14} /> {confirmModal.confirmLabel || 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

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
