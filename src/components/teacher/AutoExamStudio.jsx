/* ============================================================
   AutoExamStudio.jsx — AI Studio (v5, chat-first + split workspace)
   ------------------------------------------------------------
   v5 (fix + upgrade):
     • MỚI: Lưu lịch sử chat + ma trận + câu hỏi vào localStorage
     • MỚI: Nút "Xóa lịch sử" ở header
     • FIX: Logo AIMark to hơn (140px), có mode động (think/orbit/idle)
     • Giữ nguyên: chat-first flow, split workspace, resizer, AI actions
   ============================================================ */
import React, { useState, useRef, useEffect, useMemo, Fragment } from 'react';
import MathText from '../MathText.jsx';
import { useAuth } from '../../hooks/useAuth.jsx';
import { createExam, defaultProctor } from '../../lib/classroom.js';
import {
  planMatrixWithAI,
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
} from '../../lib/matrixAiService.js';
import { addQuestion, addQuestionsBatch } from '../../lib/questionBank.js';
import { PRESET_SAMPLE_EXAMS } from '../../lib/sampleExamsData.js';
import { readFile, validateFiles, fmtSize } from '../../lib/fileReader.js';
import sound from '../../lib/gameSound.js';
import ExamPreviewSimulator from './ExamPreviewSimulator.jsx';
import AIMark from '../AIMark.jsx';

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
const IcoSpark = (p) => <Svg {...p}><path d="M12 2l2.4 5.6L20 10l-5.6 2.4L12 18l-2.4-5.6L4 10l5.6-2.4z" /></Svg>;
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

/* ============ QUICK PROMPTS CAPSULES ============ */
const QUICK_PROMPT_CHIPS = [
  {
    title: 'Kiểm tra 15 phút: Este & Lipit',
    sub: 'Lớp 12 · 10 câu phân hóa · 15 phút',
    prompt: 'Kiểm tra 15 phút: Este & Lipit lớp 12, 10 câu',
  },
  {
    title: 'Đề 45 phút chuẩn 2025: Cân bằng hóa học',
    sub: 'Lớp 11 · 20 câu GDPT 2018 · 45 phút',
    prompt: 'Đề 45 phút chuẩn 2025: Cân bằng hóa học 11, 20 câu',
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
];

/* ============================================================
   MAIN
   ============================================================ */
export default function AutoExamStudio({
  classes = [],
  initialClass = null,
  classInsights,
  onDone,
  onCancel,
}) {
  const { user } = useAuth();

  const [selectedClassId, setSelectedClassId] = useState(initialClass?.id || classes[0]?.id || '');
  const [topic, setTopic] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [activeHubTab, setActiveHubTab] = useState('exam');

  // Interview flow
  const [step, setStep] = useState(0);
  const [selectedGrade, setSelectedGrade] = useState('11');
  const [selectedCount, setSelectedCount] = useState(10);
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [selectedFormat, setSelectedFormat] = useState('Chuẩn GDPT 2018 (Trắc nghiệm + Trả lời ngắn)');

  // AI state
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
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
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [toast, setToast] = useState(null);

  // Publish options
  const [publishTitle, setPublishTitle] = useState('');
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
  const insightText = classInsights?.forAi || '';
  const weakTopic = classInsights?.weakestTopics?.[0];

  const showToast = (message, type = 'info') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 3200);
  };

  const greetingData = useMemo(() => {
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
    const rawName = user?.displayName?.trim()?.split(/\s+/)?.pop() || user?.email?.split('@')?.[0] || 'thầy cô';
    const teacherName = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();
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

  /* ============ ⭐ LƯU / LOAD LỊCH SỬ CHAT ============ */
  // Load khi mount
  useEffect(() => {
    try {
      const savedChat = localStorage.getItem('aes_chat_history');
      const savedMatrix = localStorage.getItem('aes_matrix');
      const savedQuestions = localStorage.getItem('aes_questions');
      const savedTopic = localStorage.getItem('aes_topic');
      const savedStep = localStorage.getItem('aes_step');
      const savedSlots = localStorage.getItem('aes_slots');

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
        if (step > 0) localStorage.setItem('aes_step', String(step));
        if (slots.grade || slots.count || slots.duration) {
          localStorage.setItem('aes_slots', JSON.stringify(slots));
        }
      } catch (e) {
        console.warn('[AutoExamStudio] Save lịch sử fail:', e);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [chatMessages, matrixData, questions, topic, step, slots]);

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
        try { localStorage.setItem('aes_split_ratio', next.toFixed(3)); } catch {}
        return next;
      });
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setSplitRatio((r) => {
        const next = Math.min(0.65, r + 0.02);
        try { localStorage.setItem('aes_split_ratio', next.toFixed(3)); } catch {}
        return next;
      });
    }
  };

  /* ============ FILE HANDLING ============ */
  const handleFileSelect = async (e) => {
    const fileList = Array.from(e.target.files || []);
    if (!fileList.length) return;
    try {
      const valid = validateFiles(fileList);
      const loaded = await Promise.all(valid.map((f) => readFile(f)));
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
  const proceedInterview = ({ grade, count, duration, topic: t, format }) => {
    const shape = inferExamShape({ count, duration });
    setSlots({ grade, count: shape.count, duration: shape.duration });
    if (grade) setSelectedGrade(grade);
    if (shape.count) setSelectedCount(shape.count);
    if (shape.duration) setSelectedDuration(shape.duration);

    if (!grade) {
      setChatMessages((prev) => [...prev, { role: 'ai', text: 'Bài tập này dành cho học sinh lớp mấy?' }]);
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
      targetTopic: t, grade, count: shape.count, duration: shape.duration,
      ...(format ? { format } : {}),
    });
  };

  const handleSelectGrade = (g) => {
    sound.ding();
    setChatMessages((prev) => [...prev, { role: 'summary', text: `Dành cho học sinh lớp ${g}` }]);
    proceedInterview({ grade: g, count: slots.count, duration: slots.duration, topic });
  };

  const handleSelectCount = (cnt, dur) => {
    setSelectedCount(cnt);
    setSelectedDuration(dur);
    setSlots((sl) => ({ ...sl, count: cnt, duration: dur }));
    sound.ding();
    setChatMessages((prev) => [
      ...prev,
      { role: 'summary', text: `Đề gồm: ${cnt} câu · Thời lượng: ${dur} phút` },
      { role: 'ai', text: 'Thầy/cô muốn cấu trúc đề theo định dạng nào?' },
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
  } = {}) => {
    sound.ding();
    setStep(4);
    setAnalyzing(true);
    abortControllerRef.current = new AbortController();

    const cleanTopic = targetTopic || 'Kiến thức trọng tâm Hóa học';
    setTopic(cleanTopic);

    setChatMessages((prev) => [
      ...prev,
      { role: 'summary', text: `Định dạng: ${format}` },
      {
        role: 'trace_loading',
        text: insightText
          ? 'Đang đọc dữ liệu điểm yếu của lớp và lập ma trận khảo thí...'
          : 'Đang phân tích chương trình GDPT 2018 và lập ma trận...',
      },
    ]);

    try {
      const planned = await planMatrixWithAI({
        topic: cleanTopic,
        grade,
        subject: 'Hóa học',
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
          title: `Đã lập ma trận ${planned.totalQuestions || count} câu chuẩn Bộ GD&ĐT`,
          steps: [
            insightText ? 'Đã tích hợp điểm yếu từ bài nộp của lớp.' : 'Đã phân tích mục tiêu chuẩn kiến thức.',
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

  /* ============ CHỈNH MA TRẬN ============ */
  const handleRefineMatrix = async (instruction) => {
    if (!instruction?.trim() || !matrixData) return;
    setAnalyzing(true);
    abortControllerRef.current = new AbortController();

    setChatMessages((prev) => [
      ...prev,
      { role: 'user', text: instruction },
      { role: 'trace_loading', text: `Đang điều chỉnh ma trận theo yêu cầu...` },
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
        signal: abortControllerRef.current.signal,
      });

      setQuestions(qList);
      setStep(5);
      setWorkspaceTab('questions');
      sound.cheer();
      showToast(`Đã hoàn thành biên soạn ${qList.length} câu hỏi!`, 'success');

      setChatMessages((prev) => [
        ...prev.filter((m) => m.role !== 'trace_loading'),
        {
          role: 'ai',
          text: `Đã hoàn tất ${qList.length} câu hỏi theo ma trận đã duyệt! Thầy/cô có thể kiểm tra từng câu bên phải, nhờ AI đổi phương án nhiễu hoặc xuất bản vào Lớp.`,
        },
        { role: 'chips', items: ['Viết lại câu 1 khó hơn', 'Đổi phương án nhiễu câu 2', 'Viết lại câu 3 súc tích hơn'] },
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
        ? await regenerateDistractorsWithAI({ question: targetQ, grade: selectedGrade, subject: 'Hóa học' })
        : await rewriteQuestionWithAI({ question: targetQ, instruction: text, grade: selectedGrade, subject: 'Hóa học' });
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

  /* ============ GỬI TIN NHẮN ============ */
  const handleSendMessage = async (overrideText) => {
    const text = (typeof overrideText === 'string' ? overrideText : inputMessage).trim();
    if (!text) return;
    if (analyzing || generating) {
      showToast('AI đang xử lý. Bấm "Dừng AI" nếu muốn hủy rồi gửi lại.', 'info');
      return;
    }

    setInputMessage('');
    sound.ding();

    if (questions.length > 0) {
      const cmd = parseQuestionCommand(text, questions.length);
      if (cmd) { handleChatQuestionEdit(cmd, text); return; }
    }

    if (matrixData) {
      handleRefineMatrix(text);
      return;
    }

    const intent = parseExamIntent(text);
    setChatMessages((prev) => [...prev, { role: 'user', text }]);

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
      : intent.topic || weakTopic?.topic || 'Kiến thức trọng tâm Hóa học';
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
      grade: intent.grade || slots.grade,
      count: intent.count || slots.count,
      duration: intent.duration || slots.duration,
      topic: nextTopic,
      format: intent.format,
    });
  };

  /* ============ NẠP ĐỀ MẪU ============ */
  const handleLoadSampleExam = (sample) => {
    if (!sample) return;
    setTopic(sample.title);
    setSelectedGrade(sample.grade || '11');
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
        subject: 'Hóa học',
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
        subject: 'Hóa học',
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
        subject: 'Hóa học',
      });
      setPedagogyInsights((prev) => ({
        ...prev,
        [idx]: { ...insight, loading: false, open: true },
      }));
    } catch (err) {
      setPedagogyInsights((prev) => ({
        ...prev,
        [idx]: {
          trap: 'Học sinh hay nhầm lẫn tỉ lệ mol và bảo toàn khối lượng.',
          teachingTip: 'Nhắc học sinh viết nhẩm phương trình ion thu gọn trước.',
          loading: false,
          open: true,
        },
      }));
    }
  };

  const handleSaveQuestionToBank = async (idx) => {
    if (!user?.uid || !questions[idx] || savingBankIdx !== null) return;
    const q = questions[idx];
    setSavingBankIdx(idx);
    try {
      await addQuestion({
        teacherId: user.uid,
        ...q,
        subject: 'Hóa học',
        grade: Number(selectedGrade) || 11,
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
    setIsSavingAllToBank(true);
    try {
      const res = await addQuestionsBatch({
        teacherId: user.uid,
        questions: questions.map((q) => ({
          ...q,
          subject: 'Hóa học',
          grade: Number(selectedGrade) || 11,
        })),
        skipDuplicates: true,
      });
      sound.cheer();
      showToast(`Đã lưu ${res.count} câu vào Ngân hàng (bỏ qua ${res.skipped} câu trùng)`, 'success');
      setSavedBankKeys(new Set(questions.map((_, i) => i)));
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
    setQuestions((prev) => prev.map((item, i) => (i === idx ? editForm : item)));
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

  /* ============ ⭐ XÓA LỊCH SỬ ============ */
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
      localStorage.removeItem('aes_step');
      localStorage.removeItem('aes_slots');
      localStorage.removeItem('aes_draft');
    } catch (e) { /* */ }
    sound.ding();
    showToast('Đã xóa lịch sử. Sẵn sàng tạo đề mới!', 'success');
  };

  /* ============ XUẤT BẢN ============ */
  const handleOpenPublishModal = () => {
    if (!questions.length) { showToast('Chưa có câu hỏi nào', 'error'); return; }
    if (!selectedClassId) { showToast('Chọn lớp để gán đề', 'error'); return; }
    setShowPublishModal(true);
  };

  const handleExecutePublish = async () => {
    if (!selectedClassId || !questions.length) return;
    setIsPublishing(true);
    try {
      const targetClass = classes.find((c) => c.id === selectedClassId);
      await createExam({
        teacherId: user.uid,
        teacherName: user.displayName || user.email || 'Giáo viên',
        classId: selectedClassId,
        title: publishTitle || matrixData?.title || `Đề ${topic || 'Hóa học'} Lớp ${selectedGrade}`,
        description: `Đề khảo thí ${questions.length} câu phân hóa 4 mức độ GDPT 2018.`,
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
      showToast(`Đã xuất bản vào lớp ${targetClass?.name || ''}`, 'success');
      setTimeout(() => onDone?.(), 1200);
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

          <div className="aes-composer-wrap">
            <div className="aes-composer">
              <textarea
                ref={inputRef}
                rows={2}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Nhập yêu cầu tạo đề (VD: Đề 20 câu 45p lớp 10 cấu tạo nguyên tử)..."
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
                >
                  <IcoPaperclip size={16} />
                </button>
                <button
                  type="button"
                  className="aes-composer-btn"
                  onClick={() => {
                    const preset = PRESET_SAMPLE_EXAMS?.[0];
                    if (preset) handleLoadSampleExam(preset);
                  }}
                  title="Nạp đề mẫu chuẩn Bộ GD&ĐT"
                >
                  <IcoTemplate size={16} />
                </button>
                <div style={{ flex: 1 }} />
                <button
                  type="button"
                  className="aes-composer-send"
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim()}
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
              ).concat(QUICK_PROMPT_CHIPS).slice(0, 4).map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="aes-quick-chip"
                  onClick={() => handleSendMessage(chip.prompt)}
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
          accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg,.xlsx,.xls"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AIMark size={26} animate={analyzing || generating} />
            <strong>AI Khảo thí</strong>
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {(chatMessages.length > 0 || matrixData || questions.length > 0) && (
              <button
                type="button"
                className="aes-icon-btn"
                onClick={handleClearHistory}
                title="Xóa toàn bộ lịch sử và bắt đầu mới"
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
                    <button key={it} type="button" className="aes-chip-suggest"
                      disabled={analyzing || generating}
                      onClick={() => handleSendMessage(it)}>
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
                {['8', '9', '10', '11', '12'].map((g) => (
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
                  onClick={() => { setSelectedFormat('Chuẩn GDPT 2018'); handlePlanMatrix({ format: 'Chuẩn GDPT 2018' }); }}
                >
                  <span>Chuẩn GDPT 2018 (Trắc nghiệm + Trả lời ngắn)</span>
                  <span className="aes-opt-arrow">&rsaquo;</span>
                </button>
                <button
                  type="button"
                  className="aes-opt-btn"
                  onClick={() => { setSelectedFormat('Trắc nghiệm 4 lựa chọn'); handlePlanMatrix({ format: 'Trắc nghiệm 4 lựa chọn' }); }}
                >
                  <span>100% Trắc nghiệm 4 lựa chọn</span>
                  <span className="aes-opt-arrow">&rsaquo;</span>
                </button>
                <button
                  type="button"
                  className="aes-opt-btn"
                  onClick={() => { setSelectedFormat('Phân hóa nâng cao'); handlePlanMatrix({ format: 'Phân hóa nâng cao' }); }}
                >
                  <span>Phân hóa rèn luyện tư duy sâu</span>
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
                <IcoFile size={13} />
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
            accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg,.xlsx,.xls"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />

          <button
            type="button"
            className="aes-icon-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Đính kèm tài liệu"
          >
            <IcoPaperclip size={16} />
          </button>
          <button
            type="button"
            className="aes-icon-btn"
            onClick={() => {
              const preset = PRESET_SAMPLE_EXAMS?.[0];
              if (preset) handleLoadSampleExam(preset);
            }}
            title="Kho đề mẫu"
          >
            <IcoTemplate size={16} />
          </button>

          <textarea
            rows={1}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={matrixData ? 'Chỉnh sửa ma trận (VD: Tăng 2 câu vận dụng)...' : 'Nhập yêu cầu...'}
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
            disabled={analyzing || generating || !inputMessage.trim()}
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
                        <div className="aes-q-edit-opts">
                          {(editForm.options || []).map((opt, oIdx) => (
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

                        <div className="aes-q-opts">
                          {(q.options || []).map((opt, oIdx) => {
                            const isCorrect = q.correct === oIdx;
                            return (
                              <div
                                key={oIdx}
                                className={`aes-q-opt ${isCorrect ? 'correct' : ''}`}
                                onClick={() => {
                                  setQuestions((prev) =>
                                    prev.map((item, i2) => (i2 === idx ? { ...item, correct: oIdx } : item))
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

                        {q.explain && (
                          <div className="aes-q-explain">
                            <strong>Lời giải chi tiết:</strong>
                            <MathText text={q.explain} />
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
                  title: publishTitle || topic || 'Đề kiểm tra',
                  duration: selectedDuration,
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
          exam={{ title: publishTitle || topic, duration: selectedDuration }}
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
              <h3>Xuất bản đề thi vào Lớp</h3>
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
                <IcoRocket size={14} /> {isPublishing ? 'Đang xuất bản...' : 'Xuất bản ngay'}
              </button>
            </div>
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