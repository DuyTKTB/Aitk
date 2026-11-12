/* ============================================================
   DedicatedLessonView.jsx — MÀN HÌNH BÀI HỌC CHUYÊN SÂU ELEC AI
   ------------------------------------------------------------
   Giao diện toàn trang (Split-View) gồm 2 cột độc lập:
     • Cột trái: Sidebar Mục lục theo chương (Accordion các bài học + 4 mục con)
     • Cột phải: Khung nội dung lý thuyết, thẻ công thức, thẻ Flashcard, bộ câu hỏi 2026
     • Thanh đáy: Nút "Hoàn thành bài học", "Bài tiếp theo" và nút Chạm AI
     • Tích hợp: Hướng dẫn ôn thi đúng cách, Audio Podcast tóm tắt, Sổ tay ghim công thức
   ============================================================ */

import { useState, useMemo, useRef, useEffect } from 'react';
import { DEDICATED_LESSONS, findLessonById } from '../../data/dedicatedLessonsData.js';
import { getInfographicsForTopic } from '../../data/knowledgeManifest.js';
import { readAspirations } from '../../lib/aspirationStore.js';
import { getUserAspirationsState } from '../../lib/aspirationService.js';
import StudyMethodologyGuideModal from './StudyMethodologyGuideModal.jsx';
import MathText from '../MathText.jsx';
import PracticeRunner from './PracticeRunner.jsx';
import ChalkboardView from '../ChalkboardView.jsx';
import { formatMathAndChemSymbols } from '../../lib/chemFormulaFormatter.js';
import '../../styles/dedicated-lesson.css';

const IcoCheck = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/* Biểu tượng SVG thuần không emoji */
const IcoMindmap = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="5" r="3" />
    <circle cx="5" cy="19" r="3" />
    <circle cx="19" cy="19" r="3" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <path d="M12 12L5 16" />
    <path d="M12 12l7 4" />
  </svg>
);

const IcoNote = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

/* Biểu tượng SVG thuần không emoji */
const IcoBack = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const IcoChevronDown = ({ isOpen = false }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
    aria-hidden="true"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const IcoCircle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
  </svg>
);

const IcoCheckCircle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const IcoRedX = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }}>
    <circle cx="12" cy="12" r="10" fill="#fee2e2" stroke="#ef4444" strokeWidth="1.5" />
    <path d="M15 9l-6 6M9 9l6 6" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const IcoSpark = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2L14.4 8.6L21 11L14.4 13.4L12 20L9.6 13.4L3 11L9.6 8.6L12 2Z" />
  </svg>
);

const IcoPlay = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <polygon points="6 4 20 12 6 20 6 4" />
  </svg>
);

const IcoPause = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <rect x="5" y="4" width="4" height="16" rx="1" />
    <rect x="15" y="4" width="4" height="16" rx="1" />
  </svg>
);

const IcoBook = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const IcoBookOpen = ({ size = 15, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

const IcoFlask = ({ size = 15, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M10 2v7.31L4.17 19.16A2 2 0 0 0 5.89 22h12.22a2 2 0 0 0 1.72-2.84L14 9.31V2" />
    <path d="M8.5 2h7" />
    <path d="M7 16h10" />
  </svg>
);

const IcoCards = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

const IcoCompass = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
);

const IcoVolume = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
);

const IcoQuestion = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const IcoStar = ({ filled = false }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? '#f59e0b' : 'none'} stroke={filled ? '#f59e0b' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const IcoZap = ({ size = 15, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const IcoTarget = ({ size = 15, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
  </svg>
);

const IcoBrain = ({ size = 15, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04" />
  </svg>
);

const IcoLightbulb = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M9 18h6" />
    <path d="M10 22h4" />
    <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5.76.76 1.23 1.52 1.41 2.5" />
  </svg>
);

const IcoAlertTriangle = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const IcoDownload = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const IcoClose = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IcoSearch = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const SUBJECT_LABELS = {
  ly: 'Vật lí',
  hoa: 'Hóa học',
  sinh: 'Sinh học',
};

export default function DedicatedLessonView({
  initialLessonId = 'ly-chuyen-dong-nem',
  initialSubject = 'ly',
  initialPractice = false,
  onBack,
  onAi,
  uid,
}) {
  const [currentSubject, setCurrentSubject] = useState(() => {
    if (initialSubject && DEDICATED_LESSONS[initialSubject]) return initialSubject;
    const hit = findLessonById(initialLessonId);
    return hit ? hit.subjectKey : 'ly';
  });

  const [currentLessonId, setCurrentLessonId] = useState(initialLessonId);
  const [openChapterIds, setOpenChapterIds] = useState({});
  const [activeSubSection, setActiveSubSection] = useState('formula');
  const [completedLessonIds, setCompletedLessonIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('elec-completed-lessons') || '[]');
    } catch { return []; }
  });

  /* Chế độ xem trong bài: 'theory' | 'flashcard' | 'questions' | 'practice' */
  const [viewMode, setViewMode] = useState(initialPractice ? 'practice' : 'theory');
  const [guideOpen, setGuideOpen] = useState(false);

  /* Audio player state */
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  /* Sổ tay công thức đã lưu (Bookmarks) */
  const [bookmarkedFormulas, setBookmarkedFormulas] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('elec-bookmarked-formulas') || '[]');
    } catch { return []; }
  });
  const [formulaFilter, setFormulaFilter] = useState('all'); // 'all' | 'saved'

  /* Flashcard state */
  const [activeFcIndex, setActiveFcIndex] = useState(0);
  const [isFcFlipped, setIsFcFlipped] = useState(false);
  const [masteredFcIds, setMasteredFcIds] = useState([]);

  /* Question state for interactive 2026 questions */
  const [mcqSelected, setMcqSelected] = useState({});
  const [tfAnswers, setTfAnswers] = useState({});
  const [saInputs, setSaInputs] = useState({});
  const [saSubmitted, setSaSubmitted] = useState({});
  const [questionFilter, setQuestionFilter] = useState('all'); // 'all' | 'basic' | 'applied' | 'advanced'

  /* Sổ tay ghi chú cá nhân theo bài học */
  const [showNotesDrawer, setShowNotesDrawer] = useState(false);
  const [personalNotes, setPersonalNotes] = useState(() => {
    try {
      return localStorage.getItem(`elec-notes-${initialLessonId}`) || '';
    } catch { return ''; }
  });
  const [noteSavedBadge, setNoteSavedBadge] = useState(false);
  const [selectedModalImage, setSelectedModalImage] = useState(null);

  const canvasRef = useRef(null);

  // Thông tin nguyện vọng đang theo đuổi (tự động đọc trực tiếp từ State Nguyện vọng)
  const aspirationInfo = useMemo(() => {
    try {
      const state = getUserAspirationsState(uid);
      const active = state?.activeAspiration;
      if (active?.school?.code) {
        return {
          schoolName: `${active.school.code} – ${active.school.name}`,
          schoolCode: active.school.code,
          majorName: (active.major?.name || '').replace(/^ngành\s+/i, ''),
          targetScore: String(active.targetScore ?? (state?.targetScore || '24.75')),
          scale: String(state?.exam?.scale || '30'),
        };
      }
      const asp = readAspirations(uid);
      const topWish = asp?.wishes?.[0] || {};
      const code = topWish.code || 'BKA';
      const rawUni = topWish.uni || 'Đại Học Bách Khoa Hà Nội';
      const cleanUni = rawUni.startsWith(code) ? rawUni : `${code} – ${rawUni}`;
      return {
        schoolName: cleanUni,
        schoolCode: code,
        majorName: (topWish.major || 'Kỹ thuật Điều khiển & Tự động hóa').replace(/^ngành\s+/i, ''),
        targetScore: String(topWish.s2025 || topWish.targetScore || '24.75'),
        scale: '30',
      };
    } catch {
      return {
        schoolName: 'BKA – Đại Học Bách Khoa Hà Nội',
        schoolCode: 'BKA',
        majorName: 'Kỹ thuật Điều khiển & Tự động hóa',
        targetScore: '24.75',
        scale: '30',
      };
    }
  }, [uid]);

  // Tự động tải ghi chú tương ứng khi chuyển bài học
  useEffect(() => {
    try {
      setPersonalNotes(localStorage.getItem(`elec-notes-${currentLessonId}`) || '');
    } catch { setPersonalNotes(''); }
  }, [currentLessonId]);

  const handleSaveNote = (text) => {
    setPersonalNotes(text);
    try {
      localStorage.setItem(`elec-notes-${currentLessonId}`, text);
      setNoteSavedBadge(true);
      setTimeout(() => setNoteSavedBadge(false), 2000);
    } catch {}
  };

  // Cập nhật khi prop thay đổi từ ngoài vào
  useEffect(() => {
    if (initialLessonId) {
      setCurrentLessonId(initialLessonId);
      const hit = findLessonById(initialLessonId);
      if (hit?.subjectKey) {
        setCurrentSubject(hit.subjectKey);
      }
    }
    if (typeof initialPractice === 'boolean') {
      setViewMode(initialPractice ? 'practice' : 'theory');
    }
  }, [initialLessonId, initialPractice]);

  // Lấy danh sách chương của môn hiện tại
  const chapters = useMemo(() => DEDICATED_LESSONS[currentSubject] || DEDICATED_LESSONS.ly, [currentSubject]);

  // Tìm bài học đang active
  const currentLesson = useMemo(() => {
    for (const ch of chapters) {
      const hit = ch.lessons.find((l) => l.id === currentLessonId);
      if (hit) return { ...hit, chapter: ch, infographics: hit.infographics || getInfographicsForTopic(ch.chapterId) };
    }
    const firstCh = chapters[0];
    const firstLesson = firstCh?.lessons[0];
    return firstLesson ? { ...firstLesson, chapter: firstCh, infographics: firstLesson.infographics || getInfographicsForTopic(firstCh.chapterId) } : null;
  }, [chapters, currentLessonId]);

  const currentLessonInfographics = useMemo(() => {
    if (currentLesson?.infographics && currentLesson.infographics.length > 0) {
      return currentLesson.infographics;
    }
    if (currentLesson?.chapter?.chapterId) {
      return getInfographicsForTopic(currentLesson.chapter.chapterId);
    }
    return [];
  }, [currentLesson]);

  // Tự động mở accordion chứa bài học hiện tại
  useEffect(() => {
    if (currentLesson?.chapter?.chapterId) {
      setOpenChapterIds((prev) => ({
        ...prev,
        [currentLesson.chapter.chapterId]: true,
      }));
    }
  }, [currentLesson?.chapter?.chapterId]);

  // Cuộn canvas lên đầu khi đổi bài học
  useEffect(() => {
    if (canvasRef.current) canvasRef.current.scrollTop = 0;
    setActiveFcIndex(0);
    setIsFcFlipped(false);
  }, [currentLessonId]);

  const toggleChapter = (chId) => {
    setOpenChapterIds((prev) => ({
      ...prev,
      [chId]: !prev[chId],
    }));
  };

  const selectLesson = (lessonId) => {
    setCurrentLessonId(lessonId);
    setViewMode('theory');
    setIsPlayingAudio(false);
  };

  const scrollToSubSection = (secId) => {
    setActiveSubSection(secId);
    setViewMode('theory');
    setTimeout(() => {
      const targetEl = document.getElementById(`sec-${secId}`);
      if (!targetEl) return;
      if (canvasRef.current && canvasRef.current.scrollHeight > canvasRef.current.clientHeight + 10) {
        const canvasTop = canvasRef.current.getBoundingClientRect().top;
        const targetTop = targetEl.getBoundingClientRect().top;
        const scrollPos = canvasRef.current.scrollTop + (targetTop - canvasTop) - 20;
        canvasRef.current.scrollTo({ top: Math.max(0, scrollPos), behavior: 'smooth' });
      } else {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  const handleCompleteLesson = () => {
    if (!currentLesson?.id) return;
    const nextList = [...new Set([...completedLessonIds, currentLesson.id])];
    setCompletedLessonIds(nextList);
    try {
      localStorage.setItem('elec-completed-lessons', JSON.stringify(nextList));
    } catch {}
    handleNextLesson();
  };

  const handleNextLesson = () => {
    if (!currentLesson) return;
    const allLessons = chapters.flatMap((c) => c.lessons);
    const curIdx = allLessons.findIndex((l) => l.id === currentLesson.id);
    if (curIdx >= 0 && curIdx < allLessons.length - 1) {
      selectLesson(allLessons[curIdx + 1].id);
    }
  };

  const toggleBookmarkFormula = (formulaStr) => {
    const next = bookmarkedFormulas.includes(formulaStr)
      ? bookmarkedFormulas.filter((f) => f !== formulaStr)
      : [...bookmarkedFormulas, formulaStr];
    setBookmarkedFormulas(next);
    try {
      localStorage.setItem('elec-bookmarked-formulas', JSON.stringify(next));
    } catch {}
  };

  const toggleAudio = () => {
    setIsPlayingAudio((p) => !p);
  };

  const isCompleted = completedLessonIds.includes(currentLesson?.id);

  // Danh sách công thức sau khi lọc
  const displayFormulas = useMemo(() => {
    const list = currentLesson?.formulas || [];
    if (formulaFilter === 'saved') {
      return list.filter((f) => bookmarkedFormulas.includes(f.formula || f.displayLatex));
    }
    return list;
  }, [currentLesson?.formulas, formulaFilter, bookmarkedFormulas]);

  const flashcards = currentLesson?.flashcards || [];
  const currentCard = flashcards[activeFcIndex];

  // Chuẩn hoá ngân hàng câu hỏi 2026 từ lesson (tương thích sampleQuestions / exam2026Questions / practiceQuestions)
  const allQuestions = useMemo(() => {
    const list = currentLesson?.sampleQuestions || currentLesson?.exam2026Questions || currentLesson?.practiceQuestions || [];
    return list.map((q, idx) => ({
      ...q,
      id: q.id || `q-${currentLesson?.id || 'les'}-${idx}`,
      prompt: q.prompt || q.question || '',
      type: q.type || 'mcq',
      level: q.level || 'Thông hiểu',
      targetExam: q.targetExam || 'THPTQG 2026',
      options: q.options || [],
      correct: typeof q.correct === 'number' ? q.correct : 0,
      subQuestions: q.subQuestions || [],
      correctAnswer: q.correctAnswer || '',
      unit: q.unit || '',
      solution: q.solution || q.explain || '',
      trapAlert: q.trapAlert || '',
      fastTip: q.fastTip || '',
    }));
  }, [currentLesson]);

  // Lọc câu hỏi 2026 theo ngưỡng điểm mục tiêu
  const filteredSampleQuestions = useMemo(() => {
    if (questionFilter === 'basic') return allQuestions.filter((q) => q.level === 'Nhận biết' || q.level === 'Thông hiểu');
    if (questionFilter === 'applied') return allQuestions.filter((q) => q.level === 'Vận dụng');
    if (questionFilter === 'advanced') return allQuestions.filter((q) => q.level === 'Vận dụng cao' || (q.targetExam && (q.targetExam.includes('TSA') || q.targetExam.includes('BKA'))));
    return allQuestions;
  }, [allQuestions, questionFilter]);

  return (
    <div className="ns9-dedicated-study-page">
      {/* ── THANH TIÊU ĐỀ TRÊN CÙNG (TOP BAR) ── */}
      <header className="ns9-study-topbar">
        <div className="ns9-study-topbar-left">
          <button
            type="button"
            className="ns9-study-back-btn"
            onClick={onBack}
            aria-label="Quay lại lộ trình học tập"
          >
            <IcoBack />
            <span>Quay lại lộ trình</span>
          </button>

          <nav className="ns9-study-breadcrumbs" aria-label="Đường dẫn bài học">
            <span className="crumb-sub">{SUBJECT_LABELS[currentSubject] || 'Khoa học'}</span>
            <span className="crumb-sep">/</span>
            <span className="crumb-chapter">{formatMathAndChemSymbols(currentLesson?.chapter?.chapterName || 'Chương')}</span>
            <span className="crumb-sep">/</span>
            <b className="crumb-lesson">{formatMathAndChemSymbols(currentLesson?.title || 'Bài học')}</b>
          </nav>
        </div>

        <div className="ns9-study-topbar-right">
          {/* Chuyển đổi môn nhanh */}
          <div className="ns9-study-sub-pills" role="tablist" aria-label="Chọn môn học">
            {Object.entries(SUBJECT_LABELS).map(([k, label]) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={currentSubject === k}
                className={`ns9-sub-pill ${currentSubject === k ? 'is-active' : ''}`}
                onClick={() => {
                  setCurrentSubject(k);
                  const firstOfSubject = DEDICATED_LESSONS[k]?.[0]?.lessons?.[0]?.id;
                  if (firstOfSubject) selectLesson(firstOfSubject);
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Dải chuyển đổi chế độ xem thông minh */}
          <div className="ns9-view-modes-strip" role="tablist" aria-label="Chế độ học">
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'theory'}
              className={`ns9-vmode-btn ${viewMode === 'theory' ? 'is-active' : ''}`}
              onClick={() => setViewMode('theory')}
              title="Lý thuyết & Công thức"
            >
              <IcoBookOpen size={14} />
              <span>Lý thuyết</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'mindmap'}
              className={`ns9-vmode-btn ${viewMode === 'mindmap' ? 'is-active' : ''}`}
              onClick={() => setViewMode('mindmap')}
              title="Sơ đồ tư duy 1 trang"
            >
              <IcoMindmap />
              <span>Sơ đồ tư duy</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'flashcard'}
              className={`ns9-vmode-btn ${viewMode === 'flashcard' ? 'is-active' : ''}`}
              onClick={() => setViewMode('flashcard')}
              title="Thẻ ghi nhớ Flashcard"
            >
              <IcoCards />
              <span>Flashcard</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'questions'}
              className={`ns9-vmode-btn ${viewMode === 'questions' ? 'is-active' : ''}`}
              onClick={() => setViewMode('questions')}
              title="Bộ câu hỏi ma trận 2026 (3 dạng)"
            >
              <IcoTarget size={14} />
              <span>Đề 2026</span>
              <span className="ns9-vmode-badge">{allQuestions.length}</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'practice'}
              className={`ns9-vmode-btn ${viewMode === 'practice' ? 'is-active' : ''}`}
              onClick={() => setViewMode('practice')}
              title="Luyện tập trắc nghiệm trực tiếp"
            >
              <IcoZap size={14} />
              <span>Luyện tập</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'chalkboard'}
              className={`ns9-vmode-btn ${viewMode === 'chalkboard' ? 'is-active' : ''}`}
              onClick={() => setViewMode('chalkboard')}
              title="Mô phỏng Bảng phấn 3D"
            >
              <IcoFlask size={14} />
              <span>Bảng 3D</span>
            </button>
          </div>

          {/* Nút mở cẩm nang Hướng dẫn ôn đúng cách */}
          <button
            type="button"
            className="ns9-asp-guide-trigger"
            onClick={() => setGuideOpen(true)}
            title="Xem cẩm nang hướng dẫn ôn thi đúng cách"
          >
            <IcoCompass />
            <span>Hướng dẫn ôn đúng cách</span>
          </button>
        </div>
      </header>

      {/* ── BỐ CỤC 2 CỘT TÁCH BIỆT (SPLIT-VIEW) ── */}
      <div className="ns9-study-workspace">
        {/* ── CỘT TRÁI: SIDEBAR MỤC LỤC CHƯƠNG & BÀI HỌC ── */}
        <aside className="ns9-study-sidebar" aria-label="Danh sách bài học">
          <div className="ns9-sidebar-inner">
            {chapters.map((ch) => {
              const isOpen = !!openChapterIds[ch.chapterId];
              return (
                <div key={ch.chapterId} className="ns9-sidebar-chapter">
                  {/* Tiêu đề chương Accordion */}
                  <button
                    type="button"
                    className="ns9-chapter-accordion-head"
                    onClick={() => toggleChapter(ch.chapterId)}
                    aria-expanded={isOpen}
                  >
                    <div className="ns9-ch-head-left">
                      <span className="ns9-ch-number">{ch.chapterNum}</span>
                      <b className="ns9-ch-title">{formatMathAndChemSymbols(ch.chapterName)}</b>
                      <small className="ns9-ch-badge">{ch.lessons.length} bài</small>
                    </div>
                    <IcoChevronDown isOpen={isOpen} />
                  </button>

                  {/* Danh sách bài học của chương */}
                  {isOpen && (
                    <div className="ns9-chapter-lesson-list">
                      {ch.lessons.map((lesson) => {
                        const isActive = lesson.id === currentLesson?.id;

                        return (
                          <div
                            key={lesson.id}
                            className={`ns9-sidebar-lesson-item ${isActive ? 'is-active' : ''}`}
                          >
                            <div
                              className="ns9-lesson-head"
                              onClick={() => selectLesson(lesson.id)}
                              role="button"
                              tabIndex={0}
                            >
                              {!isActive && (
                                <div className="ns9-inactive-circle" aria-hidden="true" />
                              )}
                              <div className="ns9-lesson-info">
                                <h4 className="ns9-lesson-title">{formatMathAndChemSymbols(lesson.title)}</h4>
                                <span className="ns9-lesson-meta">
                                  {lesson.questionsCount} câu · {lesson.durationMinutes} phút
                                </span>
                              </div>
                            </div>

                            {/* 4 Mục con chỉ hiển thị bên dưới thẻ đang active */}
                            {isActive && (
                              <ul className="ns9-active-sub-anchors">
                                <li
                                  className={activeSubSection === 'concept' ? 'is-current' : ''}
                                  onClick={(e) => { e.stopPropagation(); scrollToSubSection('concept'); }}
                                >
                                  <span>• Khái niệm chính</span>
                                </li>
                                <li
                                  className={activeSubSection === 'algo' ? 'is-current' : ''}
                                  onClick={(e) => { e.stopPropagation(); scrollToSubSection('algo'); }}
                                >
                                  <span>• Quy trình làm bài</span>
                                </li>
                                <li
                                  className={activeSubSection === 'formula' ? 'is-current' : ''}
                                  onClick={(e) => { e.stopPropagation(); scrollToSubSection('formula'); }}
                                >
                                  <span>• Công thức cần nhớ</span>
                                </li>
                                {currentLessonInfographics.length > 0 && (
                                  <li
                                    className={activeSubSection === 'infographics' ? 'is-current' : ''}
                                    onClick={(e) => { e.stopPropagation(); scrollToSubSection('infographics'); }}
                                  >
                                    <span>• Sơ đồ &amp; Infographic ({currentLessonInfographics.length})</span>
                                  </li>
                                )}
                                <li
                                  className={activeSubSection === 'traps' ? 'is-current' : ''}
                                  onClick={(e) => { e.stopPropagation(); scrollToSubSection('traps'); }}
                                >
                                  <span>• Lỗi thường gặp</span>
                                </li>
                              </ul>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* ── CỘT PHẢI: KHUNG NỘI DUNG CHÍNH (CHUẨN 100% GIAO DIỆN HỌC THỰC TẾ) ── */}
        <main className="ns9-study-canvas" ref={canvasRef}>
          {viewMode === 'chalkboard' && (
            <div className="ns9-canvas-practice-wrap" style={{ padding: '1rem' }}>
              <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 className="ns9-pure-sec-heading">Mô phỏng Bảng phấn 3D: {formatMathAndChemSymbols(currentLesson?.title)}</h3>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
                    Dựng hình học không gian, xoay 3D và đối chiếu kiểm định cơ học trực quan
                  </p>
                </div>
                <button
                  type="button"
                  className="ns9-pure-back-link"
                  onClick={() => setViewMode('theory')}
                >
                  &larr; Quay lại lý thuyết
                </button>
              </div>
              <ChalkboardView height={480} />
            </div>
          )}

          {viewMode === 'practice' && (
            <div className="ns9-canvas-practice-wrap">
              <div className="ns9-practice-header-bar">
                <div>
                  <h3 className="ns9-pure-sec-heading">Luyện tập trắc nghiệm: {formatMathAndChemSymbols(currentLesson?.title)}</h3>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
                    Biên soạn bám sát cấu trúc ma trận đề thi GDPT 2026 ({currentLesson?.questionsCount || 30} câu)
                  </p>
                </div>
                <button
                  type="button"
                  className="ns9-pure-back-link"
                  onClick={() => setViewMode('theory')}
                >
                  &larr; Quay lại lý thuyết &amp; công thức
                </button>
              </div>
              <PracticeRunner
                chapterId={currentLesson?.chapter?.chapterId || 'c10-atom'}
                chapterName={currentLesson?.title || 'Bài tập'}
                uid={uid}
                mode="fresh"
                size={Math.min(15, currentLesson?.questionsCount || 10)}
                level="all"
                onAi={onAi}
                onDone={() => handleCompleteLesson()}
                onClose={() => setViewMode('theory')}
              />
            </div>
          )}

          {viewMode === 'theory' && (
            <article className="ns9-pure-content-flow">
              {/* LỘ TRÌNH ÔN TẬP LOGIC 4 BƯỚC CHUẨN SƯ PHẠM ELEC AI (GDPT 2018) */}
              <section className="ns9-lesson-pipeline-banner" aria-label="Quy trình ôn tập logic 4 bước">
                <div className="ns9-pipeline-badge-tag">
                  <IcoSpark />
                  <span>QUY TRÌNH ÔN TẬP LOGIC CHUẨN SƯ PHẠM ELEC AI (GDPT 2018)</span>
                </div>
                <div className="ns9-pipeline-cards-grid">
                  <button
                    type="button"
                    className="ns9-pl-card is-active"
                    onClick={() => scrollToSubSection('concept')}
                    title="Bước 1: Nắm vững khái niệm cốt lõi, công thức trọng tâm và sơ đồ tư duy"
                  >
                    <div className="ns9-pl-step-num">BƯỚC 1</div>
                    <div className="ns9-pl-step-icon"><IcoBook /></div>
                    <div className="ns9-pl-step-title">Lý thuyết &amp; Mindmap</div>
                    <div className="ns9-pl-step-desc">Khái niệm, công thức &amp; Sơ đồ tư duy trực quan</div>
                  </button>

                  <button
                    type="button"
                    className="ns9-pl-card"
                    onClick={() => setViewMode('practice')}
                    title="Bước 2: Luyện trắc nghiệm phân tầng từ Nhận biết đến Vận dụng"
                  >
                    <div className="ns9-pl-step-num">BƯỚC 2</div>
                    <div className="ns9-pl-step-icon"><IcoZap size={22} /></div>
                    <div className="ns9-pl-step-title">Luyện 3 cấp độ</div>
                    <div className="ns9-pl-step-desc">Trắc nghiệm phân tầng NB &ndash; TH &ndash; VD chuẩn đề 2026</div>
                  </button>

                  <button
                    type="button"
                    className="ns9-pl-card"
                    onClick={() => setViewMode('flashcard')}
                    title="Bước 3: Ghi nhớ phản xạ nhanh bằng Flashcard và loại trừ bẫy đề thi"
                  >
                    <div className="ns9-pl-step-num">BƯỚC 3</div>
                    <div className="ns9-pl-step-icon"><IcoBrain size={22} /></div>
                    <div className="ns9-pl-step-title">Flashcard &amp; Bẫy thi</div>
                    <div className="ns9-pl-step-desc">Phản xạ nhanh &amp; Tránh các bẫy thường gặp</div>
                  </button>

                  <button
                    type="button"
                    className="ns9-pl-card"
                    onClick={() => setViewMode('questions')}
                    title="Bước 4: Ôn tập các câu hỏi thi 2026 chuẩn 3 dạng"
                  >
                    <div className="ns9-pl-step-num">BƯỚC 4</div>
                    <div className="ns9-pl-step-icon"><IcoTarget size={22} /></div>
                    <div className="ns9-pl-step-title">Đề thi 2026 (3 dạng)</div>
                    <div className="ns9-pl-step-desc">Nhiều lựa chọn, Đúng/Sai, Trả lời ngắn ({allQuestions.length} câu)</div>
                  </button>
                </div>
              </section>

              {/* 1. KHÁI NIỆM CHÍNH */}
              {currentLesson?.concepts && currentLesson.concepts.length > 0 && (
                <section id="sec-concept" className="ns9-pure-section">
                  <h3 className="ns9-pure-sec-heading">Khái niệm chính</h3>
                  <div className="ns9-pure-concepts-list">
                    {currentLesson.concepts.map((c, i) => (
                      <div key={i} className="ns9-pure-concept-block">
                        {(c.title || c.term) && (
                          <h4 className="ns9-pure-concept-title">
                            <MathText text={c.title || c.term} />
                          </h4>
                        )}
                        <p className="ns9-pure-concept-desc">
                          <MathText text={c.desc || c.definition || ''} />
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* 2. QUY TRÌNH LÀM BÀI */}
              {currentLesson?.algorithms && currentLesson.algorithms.length > 0 && (
                <section id="sec-algo" className="ns9-pure-section">
                  <h3 className="ns9-pure-sec-heading">Quy trình làm bài</h3>
                  <div className="ns9-pure-algo-list">
                    {currentLesson.algorithms.map((al, idx) => {
                      const stepNum = al.step || idx + 1;
                      const stepTitle = al.title || `Bước ${stepNum}`;
                      const stepInstruction = al.instruction || al.detail || '';
                      return (
                        <div key={stepNum} className="ns9-pure-algo-row">
                          <span className="ns9-pure-step-badge">Bước {stepNum}</span>
                          <div className="ns9-pure-step-body">
                            <b><MathText text={stepTitle} />:</b>{' '}
                            <span><MathText text={stepInstruction} /></span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* 3. CÔNG THỨC CẦN NHỚ (CHUẨN 100% ẢNH THỰC TẾ) */}
              <section id="sec-formula" className="ns9-pure-section">
                <h3 className="ns9-pure-sec-heading">Công thức cần nhớ</h3>
                <div className="ns9-pure-formula-stream">
                  {(currentLesson?.formulas || []).map((f, idx) => {
                    const label = f.label || f.name || '';
                    const mathCode = f.displayLatex || f.formula || '';
                    const notes = f.notes || f.usage || '';
                    return (
                      <div key={idx} className="ns9-pure-formula-block">
                        {label && (
                          <p className="ns9-pure-formula-label">
                            <MathText text={label} />
                          </p>
                        )}
                        <div className="ns9-pure-formula-box">
                          <MathText text={mathCode.startsWith('$$') ? mathCode : `$$${mathCode}$$`} />
                        </div>
                        {notes && (
                          <p className="ns9-pure-formula-notes" style={{ margin: '6px 0 0', fontSize: 13, color: '#475569' }}>
                            <MathText text={`* ${notes}`} />
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* 3.5 SƠ ĐỒ TƯ DUY & INFOGRAPHIC SGK CHUYÊN SÂU */}
              {currentLessonInfographics.length > 0 && (
                <section id="sec-infographics" className="ns9-pure-section">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <h3 className="ns9-pure-sec-heading" style={{ margin: 0 }}>
                      Sơ đồ tóm tắt &amp; Infographic chuẩn SGK
                    </h3>
                    <span style={{ color: '#2563eb', background: '#eff6ff', padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
                      {currentLessonInfographics.length} sơ đồ trực quan
                    </span>
                  </div>
                  <div className="ns9-infographics-grid">
                    {currentLessonInfographics.map((info) => (
                      <div
                        key={info.id}
                        className="ns9-infographic-card"
                        onClick={() => setSelectedModalImage(info)}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="ns9-info-img-wrapper">
                          <img src={info.url} alt={info.title} loading="lazy" />
                          <span className="ns9-info-zoom-hint"><IcoSearch size={14} /> <span>Xem phóng to / Tải về</span></span>
                        </div>
                        <div className="ns9-info-content">
                          <h4 className="ns9-info-title">{info.title}</h4>
                          {info.desc && <p className="ns9-info-desc">{info.desc}</p>}
                          {info.tags && info.tags.length > 0 && (
                            <div className="ns9-info-tags">
                              {info.tags.map((t, idx) => (
                                <span key={idx} className="ns9-info-tag">#{t}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* 4. LỖI THƯỜNG GẶP (TRAPS & NÉ BẪY) */}
              {currentLesson?.traps && currentLesson.traps.length > 0 && (
                <section id="sec-traps" className="ns9-pure-section">
                  <h3 className="ns9-pure-sec-heading">Lỗi thường gặp &amp; Cách né bẫy</h3>
                  <ul className="ns9-pure-traps-list">
                    {currentLesson.traps.map((trapItem, tIdx) => {
                      const trapTitle = typeof trapItem === 'string' ? trapItem : (trapItem.trap || trapItem.title || '');
                      const trapAvoid = typeof trapItem === 'object' ? (trapItem.avoid || '') : '';
                      return (
                        <li key={tIdx} className="ns9-pure-trap-row" style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start', background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 8, padding: '10px 14px', marginBottom: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                            <IcoRedX />
                            <span className="ns9-pure-trap-text" style={{ fontWeight: 600, color: '#991b1b' }}>
                              <MathText text={trapTitle} />
                            </span>
                          </div>
                          {trapAvoid && (
                            <div style={{ marginLeft: 26, fontSize: 13, color: '#166534', background: '#f0fdf4', padding: '6px 10px', borderRadius: 6, border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <IcoCheck size={14} />
                              <span><b>Cách né bẫy:</b> <MathText text={trapAvoid} /></span>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}

              {/* THANH ĐÁY HÀNH ĐỘNG (CHUẨN ẢNH THỰC TẾ) */}
              <div className="ns9-pure-footer-action">
                <button
                  type="button"
                  className={`ns9-pure-complete-btn ${isCompleted ? 'is-done' : ''}`}
                  onClick={handleCompleteLesson}
                >
                  {isCompleted ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <IcoCheck size={14} />
                      <span>Đã hoàn thành bài học</span>
                    </span>
                  ) : (
                    <span>Hoàn thành bài học</span>
                  )}
                </button>
                <button
                  type="button"
                  className="ns9-pure-next-link"
                  onClick={handleNextLesson}
                >
                  <span>Bài tiếp theo</span>
                  <span aria-hidden="true">&rsaquo;</span>
                </button>
              </div>
            </article>
          )}

          {/* ── CHẾ ĐỘ 2: SƠ ĐỒ TƯ DUY 1 TRANG (MINDMAP & FLASH-SHEET) ── */}
          {viewMode === 'mindmap' && (
            <div className="ns9-canvas-article ns9-mindmap-view">
              <div className="ns9-mindmap-hero">
                <div className="ns9-mmh-left">
                  <span className="ns9-mmh-badge">SƠ ĐỒ TƯ DUY 1 TRANG · GDPT 2026</span>
                  <h3>Bản đồ kiến thức cốt lõi: {formatMathAndChemSymbols(currentLesson?.title)}</h3>
                  <p>Hệ thống hoá toàn bộ mối liên hệ đại lượng, công thức suy diễn và các bẫy đề thi trọng tâm {aspirationInfo.schoolCode}.</p>
                </div>
                <button
                  type="button"
                  className="ns9-btn-ai"
                  onClick={() => onAi?.(`Vẽ sơ đồ tư duy phân nhánh chi tiết cho bài học "${currentLesson?.title}" (${SUBJECT_LABELS[currentSubject] || 'KHTN'}) kèm các ví dụ thực tiễn`)}
                >
                  <IcoSpark />
                  <span>AI Mở rộng sơ đồ</span>
                </button>
              </div>

              <div className="ns9-mindmap-grid">
                {/* Khối 1: Khái niệm & Bản chất cốt lõi */}
                <div className="ns9-mm-node concept">
                  <div className="ns9-mm-node-head">
                    <span className="node-num">1</span>
                    <h4>Khái niệm &amp; Bản chất</h4>
                  </div>
                  <div className="ns9-mm-node-body">
                    {(currentLesson?.concepts || []).map((c, i) => (
                      <div key={i} className="ns9-mm-pill">
                        <b><MathText text={c.title || c.term || ''} />:</b> <MathText text={c.desc || c.definition || ''} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Khối 2: Quy trình phân tích các bước */}
                <div className="ns9-mm-node process">
                  <div className="ns9-mm-node-head">
                    <span className="node-num">2</span>
                    <h4>Quy trình phân tích</h4>
                  </div>
                  <div className="ns9-mm-node-body">
                    {(currentLesson?.algorithms || []).map((al, idx) => {
                      const stepNum = al.step || idx + 1;
                      const stepTitle = al.title || `Bước ${stepNum}`;
                      const stepInstruction = al.instruction || al.detail || '';
                      return (
                        <div key={stepNum} className="ns9-mm-step">
                          <span className="step-tag">B{stepNum}</span>
                          <div>
                            <b><MathText text={stepTitle} /></b>
                            <p><MathText text={stepInstruction} /></p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Khối 3: Công thức bứt phá (KaTeX) */}
                <div className="ns9-mm-node formulas">
                  <div className="ns9-mm-node-head">
                    <span className="node-num">3</span>
                    <h4>Công thức then chốt</h4>
                  </div>
                  <div className="ns9-mm-node-body">
                    {(currentLesson?.formulas || []).slice(0, 4).map((f, i) => {
                      const label = f.label || f.name || '';
                      const mathCode = f.displayLatex || f.formula || '';
                      return (
                        <div key={i} className="ns9-mm-formula-card">
                          {label && <span className="formula-label"><MathText text={label} /></span>}
                          <div className="formula-math">
                            <MathText text={mathCode.startsWith('$$') ? mathCode : `$$${mathCode}$$`} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Khối 4: Bẫy trắc nghiệm & Mẹo 15s */}
                <div className="ns9-mm-node traps">
                  <div className="ns9-mm-node-head">
                    <span className="node-num">4</span>
                    <h4>Bẫy đề thi &amp; Mẹo 15s</h4>
                  </div>
                  <div className="ns9-mm-node-body">
                    {(currentLesson?.traps || []).slice(0, 4).map((tr, i) => {
                      const trapTitle = typeof tr === 'string' ? tr : (tr.trap || tr.title || '');
                      const trapAvoid = typeof tr === 'object' ? (tr.avoid || '') : '';
                      return (
                        <div key={i} className="ns9-mm-trap-item" style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                            <IcoRedX />
                            <span><MathText text={trapTitle} /></span>
                          </div>
                          {trapAvoid && (
                            <small style={{ marginLeft: 24, color: '#15803d', fontWeight: 600 }}>
                              Tránh bẫy: <MathText text={trapAvoid} />
                            </small>
                          )}
                        </div>
                      );
                    })}
                    <div className="ns9-mm-tip-box">
                      <IcoZap size={14} /> <b>Mẹo nhẩm 15s:</b> Luôn xác định rõ điều kiện biên, kiểm tra đơn vị đo và phân tích độc lập các yếu tố thành phần.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── CHẾ ĐỘ 3: THẺ NHỚ FLASHCARD LẬT 2 MẶT (SRS) ── */}
          {viewMode === 'flashcard' && (
            <div className="ns9-canvas-article">
              {flashcards.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                  <p>Bài học này đang được AI tổng hợp thẻ ghi nhớ Flashcard.</p>
                </div>
              ) : (
                <div className="ns9-flashcard-stage">
                  <div className="ns9-fc-progress-bar">
                    <span>Thẻ {activeFcIndex + 1} / {flashcards.length}</span>
                    <span>Đã thuộc: {masteredFcIds.length}/{flashcards.length}</span>
                  </div>

                  {/* Thẻ 3D lật mặt */}
                  <div
                    className={`ns9-card-3d-wrap ${isFcFlipped ? 'is-flipped' : ''}`}
                    onClick={() => setIsFcFlipped((f) => !f)}
                  >
                    <div className="ns9-card-inner">
                      {/* Mặt trước */}
                      <div className="ns9-card-face ns9-card-front">
                        <span className="ns9-fc-tag">MẶT TRƯỚC · CÂU HỎI / KHÁI NIỆM</span>
                        <h3><MathText text={currentCard?.front} /></h3>
                        {currentCard?.hint && (
                          <small style={{ marginTop: 10, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <IcoLightbulb size={13} />
                            <span>Gợi ý: <MathText text={currentCard.hint} /></span>
                          </small>
                        )}
                        <span className="ns9-fc-flip-hint">Chạm vào thẻ để lật xem đáp án &amp; công thức ↻</span>
                      </div>

                      {/* Mặt sau */}
                      <div className="ns9-card-face ns9-card-back">
                        <span className="ns9-fc-tag">MẶT SAU · CÔNG THỨC &amp; ĐÁP ÁN</span>
                        <div className="ns9-fc-formula-box">
                          <MathText text={currentCard?.back} />
                        </div>
                        <span className="ns9-fc-flip-hint">Chạm vào thẻ để quay lại mặt trước ↺</span>
                      </div>
                    </div>
                  </div>

                  {/* Nút hành động đánh giá độ nhớ */}
                  <div className="ns9-fc-actions-row">
                    <button
                      type="button"
                      className="ns9-fc-btn-unlearned"
                      onClick={() => {
                        setIsFcFlipped(false);
                        setActiveFcIndex((i) => (i + 1) % flashcards.length);
                      }}
                    >
                      <IcoClose size={13} />
                      <span>Cần ôn lại</span>
                    </button>
                    <button
                      type="button"
                      className="ns9-fc-btn-learned"
                      onClick={() => {
                        if (currentCard?.id && !masteredFcIds.includes(currentCard.id)) {
                          setMasteredFcIds([...masteredFcIds, currentCard.id]);
                        }
                        setIsFcFlipped(false);
                        setActiveFcIndex((i) => (i + 1) % flashcards.length);
                      }}
                    >
                      <IcoCheckCircle />
                      <span>Đã thuộc lòng</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── CHẾ ĐỘ 4: BỘ CÂU HỎI THI 2026 NÂNG CẤP ── */}
          {viewMode === 'questions' && (
            <div className="ns9-canvas-article">
              {(!allQuestions || allQuestions.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                  <p>Hệ thống đang đồng bộ câu hỏi mới nhất từ ngân hàng đề thi 2026.</p>
                </div>
              ) : (
                <div className="ns9-questions-2026-wrap">
                  {/* THANH LỌC CÂU HỎI THEO NGƯỠNG ĐIỂM MA TRẬN ĐỀ */}
                  <div className="ns9-q-filter-strip">
                    <span className="ns9-qfs-label">Phân loại ma trận đề:</span>
                    {[
                      ['all', `Tất cả (${allQuestions.length})`],
                      ['basic', 'Nhận biết & Thông hiểu (Mốc 6.5+)'],
                      ['applied', 'Vận dụng (Mốc 8.0+)'],
                      ['advanced', `Vận dụng cao (Mốc 9.0+ Ma trận ${aspirationInfo.schoolCode})`],
                    ].map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        className={`ns9-q-filter-pill ${questionFilter === key ? 'is-active' : ''}`}
                        onClick={() => setQuestionFilter(key)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {filteredSampleQuestions.length === 0 ? (
                    <div className="ns9-empty-state" style={{ padding: '24px 16px', margin: '16px 0' }}>
                      <p>Chưa có câu hỏi thuộc ngưỡng này. Chọn &ldquo;Tất cả&rdquo; để xem đầy đủ bộ câu hỏi.</p>
                      <button
                        type="button"
                        className="ns9-sub-pill is-active"
                        onClick={() => setQuestionFilter('all')}
                        style={{ marginTop: 8 }}
                      >
                        Xem tất cả câu hỏi
                      </button>
                    </div>
                  ) : (
                    filteredSampleQuestions.map((qItem, qIdx) => {
                      const levelClass = qItem.level === 'Nhận biết'
                      ? 'level-nhan-biet'
                      : qItem.level === 'Thông hiểu'
                        ? 'level-thong-hieu'
                        : qItem.level === 'Vận dụng'
                          ? 'level-van-dung'
                          : 'level-van-dung-cao';

                    return (
                      <article key={qItem.id || qIdx} className="ns9-q-card">
                        <div className="ns9-q-head">
                          <span className="ns9-q-type-badge">
                            {qItem.type === 'mcq' ? 'Dạng 1: Nhiều lựa chọn' : qItem.type === 'true_false' ? 'Dạng 2: Đúng / Sai' : 'Dạng 3: Trả lời ngắn'}
                          </span>
                          <span className={`ns9-q-level-badge ${levelClass}`}>
                            {qItem.level}
                          </span>
                          <span className="ns9-q-exam-tag">{qItem.targetExam}</span>
                        </div>

                        <p className="ns9-q-prompt">
                          <b>Câu {qIdx + 1}:</b> <MathText text={qItem.prompt} />
                        </p>

                        {/* DẠNG 1: TRẮC NGHIỆM 4 PHƯƠNG ÁN */}
                        {qItem.type === 'mcq' && (
                          <div className="ns9-q-options-grid">
                            {qItem.options.map((opt, oIdx) => {
                              const isPicked = mcqSelected[qItem.id] === oIdx;
                              const isAnswered = typeof mcqSelected[qItem.id] === 'number';
                              const isRight = isAnswered && oIdx === qItem.correct;
                              const isWrong = isAnswered && isPicked && oIdx !== qItem.correct;

                              return (
                                <button
                                  key={oIdx}
                                  type="button"
                                  className={`ns9-q-option-btn ${isPicked ? 'is-selected' : ''} ${isRight ? 'is-correct' : ''} ${isWrong ? 'is-wrong' : ''}`}
                                  onClick={() => setMcqSelected({ ...mcqSelected, [qItem.id]: oIdx })}
                                >
                                  <b>{String.fromCharCode(65 + oIdx)}.</b>
                                  <span><MathText text={opt} /></span>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* DẠNG 2: TRẮC NGHIỆM ĐÚNG / SAI 4 Ý */}
                        {qItem.type === 'true_false' && (
                          <div className="ns9-tf-subitems">
                            {qItem.subQuestions.map((sub) => {
                              const userPick = tfAnswers[sub.id];
                              return (
                                <div key={sub.id} className="ns9-tf-row">
                                  <div className="ns9-tf-statement">
                                    <MathText text={sub.statement} />
                                    {typeof userPick === 'boolean' && (
                                      <small style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4, color: userPick === sub.isTrue ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                                        {userPick === sub.isTrue ? <IcoCheck size={12} /> : <IcoClose size={12} />}
                                        <span>{userPick === sub.isTrue ? 'Đúng theo đáp án: ' : 'Sai: '}{sub.explain}</span>
                                      </small>
                                    )}
                                  </div>
                                  <div className="ns9-tf-btns">
                                    <button
                                      type="button"
                                      className={`ns9-tf-btn pick-true ${userPick === true ? 'on' : ''}`}
                                      onClick={() => setTfAnswers({ ...tfAnswers, [sub.id]: true })}
                                    >
                                      Đúng
                                    </button>
                                    <button
                                      type="button"
                                      className={`ns9-tf-btn pick-false ${userPick === false ? 'on' : ''}`}
                                      onClick={() => setTfAnswers({ ...tfAnswers, [sub.id]: false })}
                                    >
                                      Sai
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* DẠNG 3: TRẮC NGHIỆM TRẢ LỜI NGẮN */}
                        {qItem.type === 'short_answer' && (
                          <div className="ns9-sa-input-row">
                            <input
                              type="text"
                              className="ns9-sa-input"
                              placeholder="Nhập số đáp số..."
                              value={saInputs[qItem.id] || ''}
                              onChange={(e) => setSaInputs({ ...saInputs, [qItem.id]: e.target.value })}
                            />
                            <button
                              type="button"
                              className="ns9-sa-check-btn"
                              onClick={() => setSaSubmitted({ ...saSubmitted, [qItem.id]: true })}
                            >
                              Kiểm tra
                            </button>
                            {saSubmitted[qItem.id] && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 700, color: String(saInputs[qItem.id] || '').trim() === qItem.correctAnswer ? '#16a34a' : '#dc2626' }}>
                                {String(saInputs[qItem.id] || '').trim() === qItem.correctAnswer ? (
                                  <>
                                    <IcoCheck size={13} />
                                    <span>Chính xác!</span>
                                  </>
                                ) : (
                                  <>
                                    <IcoClose size={13} />
                                    <span>Đáp số chuẩn: {qItem.correctAnswer} {qItem.unit || ''}</span>
                                  </>
                                )}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Thẻ Lời giải chi tiết + Bẫy + Mẹo nhanh */}
                        {qItem.solution && (
                          <div className="ns9-solution-card">
                            <h5><IcoLightbulb size={15} /> <span>Lời giải chi tiết &amp; Phương pháp:</span></h5>
                            <div className="ns9-sol-steps">
                              {String(qItem.solution)
                                .replace(/\\n/g, '\n')
                                .split('\n')
                                .map((line) => line.trim())
                                .filter(Boolean)
                                .map((line, lIdx) => (
                                  <p key={lIdx}><MathText text={line} /></p>
                                ))}
                            </div>

                            {qItem.trapAlert && (
                              <div className="ns9-sol-trap-box">
                                <IcoAlertTriangle size={14} /> <span><b>Cảnh báo bẫy hay mắc:</b> <MathText text={qItem.trapAlert} /></span>
                              </div>
                            )}

                            {qItem.fastTip && (
                              <div className="ns9-sol-tip-box">
                                <IcoZap size={14} /> <span><b>Mẹo giải nhanh 15s:</b> <MathText text={qItem.fastTip} /></span>
                              </div>
                            )}
                          </div>
                        )}
                      </article>
                    );
                  }))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ── NÚT TRÒN GIAO TIẾP VỚI GIA SƯ AI NỔI GÓC DƯỚI (CHẠM AI) ── */}
      <button
        type="button"
        className="ns9-floating-ai-touch-btn"
        onClick={() => onAi?.(`Giải thích và hướng dẫn làm bài tập chuyên sâu về bài học "${currentLesson?.title}"`)}
        title="Chạm AI để đặt câu hỏi trực tiếp"
      >
        <IcoSpark />
        <span>Chạm AI</span>
      </button>

      {/* ── MODAL CẨM NANG HƯỚNG DẪN ÔN ĐÚNG CÁCH ── */}
      <StudyMethodologyGuideModal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        targetSchool={aspirationInfo.schoolCode}
        targetScore={aspirationInfo.targetScore}
      />

      {/* ── LIGHTBOX MODAL PHÓNG TO INFOGRAPHIC ── */}
      {selectedModalImage && (
        <div className="ns9-lightbox-overlay" onClick={() => setSelectedModalImage(null)}>
          <div className="ns9-lightbox-header" onClick={(e) => e.stopPropagation()}>
            <div className="ns9-lightbox-title-box">
              <h3>{selectedModalImage.title}</h3>
              <p>{selectedModalImage.desc || 'Sơ đồ tóm tắt kiến thức chuẩn CT GDPT 2018'}</p>
            </div>
            <div className="ns9-lightbox-actions">
              <a
                href={selectedModalImage.url}
                download
                target="_blank"
                rel="noreferrer"
                className="ns9-lightbox-btn"
                title="Tải ảnh về máy"
              >
                <IcoDownload size={14} />
                <span>Tải về</span>
              </a>
              <button
                type="button"
                className="ns9-lightbox-btn close-btn"
                onClick={() => setSelectedModalImage(null)}
                aria-label="Đóng cửa sổ"
              >
                <IcoClose size={14} />
                <span>Đóng</span>
              </button>
            </div>
          </div>
          <div className="ns9-lightbox-body" onClick={() => setSelectedModalImage(null)}>
            <img
              src={selectedModalImage.url}
              alt={selectedModalImage.title}
              className="ns9-lightbox-image"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
