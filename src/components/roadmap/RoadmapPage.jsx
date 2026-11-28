/* ============================================================
   RoadmapPage.jsx — ELEC ROADMAP STUDIO PRO (SIÊU VIP · GDPT 2018)
   ------------------------------------------------------------
   Kiến trúc 3 vùng gọn gàng ("3-Giây Hiểu Ngay"):
     1. Command Deck (Bàn điều khiển Thủ khoa): Nguyện vọng 1 + Điểm dự đoán
        có trọng số tách 3 phần (Phần I · II · III) + Nhiệm vụ hôm nay.
     2. Unified Studio Toolbar: 1 thanh duy nhất chọn Môn (ưu tiên Tổ hợp
        Nguyện vọng), Khối lớp, 4 chế độ xem (Lộ trình · Bản đồ DAG ·
        Kế hoạch 4 tuần · Sổ lỗi sai), Tìm kiếm & Lọc trạng thái.
     3. Workspace 2 cột: Trái (70%) Dây lộ trình 5 chặng / Bản đồ DAG
        tương tác; Phải (30%) Cột Thanh tra chuyên đề cố định.
   ============================================================ */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import '../../styles/roadmap-upgrade.css';
import { useAuth } from '../../hooks/useAuth.jsx';
import { askAI } from '../HomePlus.jsx';
import {
  CURRICULUM_NODES,
  SUBJECT_META,
  SUBJECT_ORDER,
  getChapterMeta,
  getCurriculumChapters,
} from '../../data/curriculumDag.js';
import {
  loadEvidence, invalidateEvidence, loadBankCoverage,
} from '../../lib/roadmapEvidence.js';
import {
  readStore, readStageCheckpoints, subscribeRoadmap, sessionsToEvents,
} from '../../lib/roadmapStore.js';
import { cardStats, dueCards, subscribeCards } from '../../lib/flashcardStore.js';
import { dueSummary } from '../../lib/reviewQueue.js';
import {
  summarizeEvents, buildChapterViews, buildAiContext, weekProgress,
} from '../../lib/roadmapEngine.js';
import { buildAutoRoadmapData } from '../../lib/autoRoadmapEngine.js';
import { subscribeAspirationChanges } from '../../lib/aspirationService.js';
import KnowledgeMap from './KnowledgeMap.jsx';
import ChapterSheet from './ChapterSheet.jsx';
import DedicatedLessonView from './DedicatedLessonView.jsx';
import { findLessonByChapterId } from '../../data/dedicatedLessonsData.js';
import BankTagger from './BankTagger.jsx';
import StudyPlanCard from './StudyPlanCard.jsx';
import FlashcardSession from './FlashcardSession.jsx';
import { IconZap } from '../Icons.jsx';
import AspirationRoadmapHub from './AspirationRoadmapHub.jsx';
import { SpacedRepetitionMilestones } from './AdaptiveRoadmapShowcase.jsx';
import WindingRoadmapTrail from './WindingRoadmapTrail.jsx';
import RoadmapCommandDeck from './RoadmapCommandDeck.jsx';
import ChapterInspectorPanel from './ChapterInspectorPanel.jsx';
import DiagnosticTestModal from './DiagnosticTestModal.jsx';
import StudyMethodologyGuideModal from './StudyMethodologyGuideModal.jsx';
import KnowledgeBookshelfView from './KnowledgeBookshelfView.jsx';
import { isAdmin } from '../../lib/isAdmin.js';
import { getUserRole } from '../../lib/userRole.js';
import { useCurrentSubject } from '../SubjectSwitcher.jsx';
import '../../styles/roadmap-page.css';
import '../../styles/roadmap-page-v2.css';
import '../../styles/roadmap-upgrade.css';
import '../../styles/roadmap-studio-pro.css';
import '../../styles/apple-cobalt-polish.css';
import '../../styles/roadmap-polish-2026.css';

const GRADE_KEY = 'cs-roadmap-grade-v2';

const readGradeFilter = () => {
  try {
    const raw = localStorage.getItem(GRADE_KEY);
    if (['all', '10', '11', '12'].includes(raw)) return raw;
    return 'all';
  } catch {
    return 'all';
  }
};

const hashParams = () => {
  try {
    return new URLSearchParams((window.location.hash.split('?')[1] || ''));
  } catch {
    return new URLSearchParams();
  }
};

const norm = (s) => String(s || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd');

/* Bộ SVG sắc nét — 0 emoji */
const Svg = ({ size = 15, children }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.65"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const IcoFlask = () => (
  <Svg size={14}>
    <path d="M10 2v7.3L4.4 18.2A2 2 0 0 0 6.1 21h11.8a2 2 0 0 0 1.7-2.8L14 9.3V2" />
    <line x1="8.5" y1="2" x2="15.5" y2="2" />
  </Svg>
);

const IcoBolt = () => (
  <Svg size={14}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </Svg>
);

const IcoDna = () => (
  <Svg size={14}>
    <path d="M2 15c6.7-6 13.3 0 20-6" />
    <path d="M2 9c6.7 6 13.3 0 20 6" />
    <path d="M9 22c1.8-2 2.5-4 2.8-6" />
    <path d="M15 2c-1.8 2-2.5 4-2.8 6" />
  </Svg>
);

const IcoRoute = () => (
  <Svg size={14}>
    <circle cx="6" cy="19" r="3" />
    <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
    <circle cx="18" cy="5" r="3" />
  </Svg>
);

const IcoGraph = () => (
  <Svg size={14}>
    <circle cx="5" cy="6" r="2.5" />
    <circle cx="19" cy="6" r="2.5" />
    <circle cx="12" cy="18" r="2.5" />
    <line x1="7.2" y1="7.3" x2="10.5" y2="15.7" />
    <line x1="16.8" y1="7.3" x2="13.5" y2="15.7" />
    <line x1="7.5" y1="6" x2="16.5" y2="6" />
  </Svg>
);

const IcoCalendar = () => (
  <Svg size={14}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </Svg>
);

const IcoAlertBook = () => (
  <Svg size={14}>
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </Svg>
);

const IcoBookshelf = () => (
  <Svg size={14}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </Svg>
);

const IcoSearch = () => (
  <Svg size={14}>
    <circle cx="11" cy="11" r="7.5" />
    <line x1="20.5" y1="20.5" x2="16.4" y2="16.4" />
  </Svg>
);

const IcoCompass = () => (
  <Svg size={14}>
    <circle cx="12" cy="12" r="9.5" />
    <polygon points="16.2 7.8 14.1 14.1 7.8 16.2 9.9 9.9 16.2 7.8" />
  </Svg>
);

const IcoCheck = () => (
  <Svg size={13}>
    <polyline points="20 6 9 17 4 12" />
  </Svg>
);

const IcoSparkles = () => (
  <Svg size={13}>
    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
  </Svg>
);

const IcoArrowRight = () => (
  <Svg size={14}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </Svg>
);

const renderSubIcon = (sub) => {
  if (sub === 'ly') return <IcoBolt />;
  if (sub === 'sinh') return <IcoDna />;
  return <IcoFlask />;
};

export default function RoadmapPage() {
  const { user } = useAuth();
  const uid = user?.uid || null;
  const { subject: globalSubject, setSubject: setGlobalSubject } = useCurrentSubject();

  const [subjectKey, setSubjectKey] = useState(() => (
    SUBJECT_META[globalSubject] ? globalSubject : 'hoa'
  ));
  const [gradeFilter, setGradeFilter] = useState(readGradeFilter); // 'all' | '10' | '11' | '12'
  const [activeTab, setActiveTab] = useState('trail'); // 'trail' | 'dag' | 'timeline' | 'wrong' | 'study'
  const [selectedChapterId, setSelectedChapterId] = useState(null);
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState(false);

  const [dedicatedLessonId, setDedicatedLessonId] = useState(null);
  const [dedicatedSubject, setDedicatedSubject] = useState('hoa');
  const [dedicatedPractice, setDedicatedPractice] = useState(false);

  const [showHubOverview, setShowHubOverview] = useState(false);
  const [groupFilter, setGroupFilter] = useState('all'); // 'all' | 'priority' | 'learning' | 'mastered'
  const [query, setQuery] = useState('');
  const [data, setData] = useState({
    remoteEvents: [], remoteAttempts: [], sessions: [], goal: null, issues: [],
    bank: null, loading: true, error: null,
  });
  const [checkpoints, setCheckpoints] = useState(() => readStageCheckpoints(uid));
  const [now, setNow] = useState(() => Date.now());
  const [cardTick, setCardTick] = useState(0);
  const [aspTick, setAspTick] = useState(0);
  const [dueQids, setDueQids] = useState(null);
  const searchRef = useRef(null);
  const [sheetId, setSheetId] = useState(null);
  const [sheetMode, setSheetMode] = useState(null);
  const [tick, setTick] = useState(0);
  const [taggerOpen, setTaggerOpen] = useState(false);
  const [diagOpen, setDiagOpen] = useState(false);
  const [checkpointStage, setCheckpointStage] = useState(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const alive = useRef(true);

  const canCurate = isAdmin(user) || getUserRole(user) === 'teacher';

  useEffect(() => {
    if (SUBJECT_META[globalSubject] && globalSubject !== subjectKey) {
      setSubjectKey(globalSubject);
    }
  }, [globalSubject, subjectKey]);

  const load = useCallback((force = false) => {
    setCheckpoints(readStageCheckpoints(uid));
    if (!uid) {
      setData({
        remoteEvents: [], remoteAttempts: [], sessions: [], goal: null,
        issues: [], bank: null, loading: false, error: null,
      });
      return;
    }
    setData((d) => ({ ...d, loading: true, error: null }));
    Promise.all([loadEvidence(uid, { force }), loadBankCoverage()])
      .then(([r, bank]) => {
        if (!alive.current) return;
        setData({
          sessions: r.sessions || [],
          goal: r.goal || null,
          issues: r.issues || [],
          remoteEvents: r.remoteEvents || [],
          remoteAttempts: r.remoteAttempts || [],
          bank,
          loading: false,
          error: null,
        });
      })
      .catch((e) => {
        if (!alive.current) return;
        setData((d) => ({ ...d, loading: false, error: e?.message || 'Không tải được dữ liệu học tập' }));
      });
  }, [uid]);

  useEffect(() => {
    alive.current = true;
    load(false);
    return () => { alive.current = false; };
  }, [load, tick]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => subscribeCards(() => setCardTick((n) => n + 1)), []);
  useEffect(() => subscribeAspirationChanges(() => setAspTick((n) => n + 1)), []);

  useEffect(() => subscribeRoadmap(() => {
    setCheckpoints(readStageCheckpoints(uid));
    if (!uid) return;
    const store = readStore(uid);
    setData((d) => ({ ...d, sessions: store.sessions, goal: store.goal }));
  }), [uid]);

  const resolveLessonForChapter = useCallback((id) => {
    const meta = getChapterMeta(id);
    const dedId = meta?.dedicatedChapterId || id;
    const hit = findLessonByChapterId(dedId) || findLessonByChapterId(id);
    if (hit) return hit;
    const fallbackSub = meta?.subject || subjectKey || 'hoa';
    const firstOfSub = getCurriculumChapters(fallbackSub, 'all')[0];
    return findLessonByChapterId(firstOfSub?.dedicatedChapterId || 'c10-atom');
  }, [subjectKey]);

  /* Deep link #roadmap?chapter=... | ?tab=wrong | ?tab=dag | ?lesson=... | ?mode=diagnostic */
  useEffect(() => {
    const apply = () => {
      const p = hashParams();
      const id = p.get('chapter');
      const lesson = p.get('lesson');
      const sub = p.get('subject');
      const tabParam = p.get('tab');
      const modeParam = p.get('mode');
      if (sub && SUBJECT_META[sub]) setSubjectKey(sub);
      if (tabParam && ['trail', 'dag', 'timeline', 'wrong', 'study', 'bookshelf', 'library', 'kien-thuc'].includes(tabParam)) {
        setActiveTab(['library', 'kien-thuc'].includes(tabParam) ? 'bookshelf' : tabParam);
      } else if (tabParam === 'subjects') {
        setActiveTab('trail');
      }
      if (modeParam === 'diagnostic') {
        setCheckpointStage(null);
        setDiagOpen(true);
      }
      if (lesson) {
        setDedicatedLessonId(lesson);
        if (sub && SUBJECT_META[sub]) setDedicatedSubject(sub);
        setActiveTab('study');
      } else if (id) {
        const meta = getChapterMeta(id);
        if (meta?.subject) setSubjectKey(meta.subject);
        const hitLesson = resolveLessonForChapter(id);
        if (hitLesson) {
          setDedicatedLessonId(hitLesson.id);
          setDedicatedSubject(hitLesson.subjectKey);
          setActiveTab('study');
        }
      }
    };
    apply();
    window.addEventListener('hashchange', apply);
    return () => window.removeEventListener('hashchange', apply);
  }, [resolveLessonForChapter]);

  /* Danh sách chuyên đề chuẩn DAG cho môn đang chọn */
  const subjectChaptersAll = useMemo(() => (
    getCurriculumChapters(subjectKey, 'all').map((n) => ({
      id: n.id,
      name: n.name,
      desc: n.desc,
      prereq: n.prereq,
      bank: true,
      grade: n.grade,
      subjectKey: n.subject,
    }))
  ), [subjectKey]);

  const subjectCounts = useMemo(() => ({
    hoa: CURRICULUM_NODES.filter((n) => n.subject === 'hoa').length,
    ly: CURRICULUM_NODES.filter((n) => n.subject === 'ly').length,
    sinh: CURRICULUM_NODES.filter((n) => n.subject === 'sinh').length,
  }), []);

  const levelKey = gradeFilter === 'all' ? 'Trọn bộ THPT' : `Lớp ${gradeFilter}`;
  const subjectMeta = SUBJECT_META[subjectKey] || SUBJECT_META.hoa;

  const levelAll = useMemo(() => ({
    key: levelKey,
    grade: gradeFilter === 'all' ? 0 : Number(gradeFilter),
    goal: `Lộ trình ${subjectMeta.name} chuẩn GDPT 2018 (${subjectMeta.structureLabel}).`,
    chapters: subjectChaptersAll,
  }), [levelKey, gradeFilter, subjectMeta, subjectChaptersAll]);

  const localEvents = useMemo(() => sessionsToEvents(data.sessions), [data.sessions]);
  const events = useMemo(
    () => data.remoteEvents.concat(localEvents).slice(-3000),
    [data.remoteEvents, localEvents],
  );
  const summaries = useMemo(() => summarizeEvents(events), [events]);

  const view = useMemo(
    () => buildChapterViews(levelAll, summaries, now),
    [levelAll, summaries, now],
  );

  const weekCount = useMemo(() => weekProgress(events, now), [events, now]);
  const cards = useMemo(
    () => (uid ? cardStats(uid, now) : { total: 0, due: 0, byLevel: { 1: 0, 2: 0, 3: 0 } }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uid, cardTick, now],
  );
  const due = useMemo(() => dueSummary(uid, events), [uid, events]);
  const dueTotal = due.total;
  const dueByTopic = due.byTopic;

  const autoRoadmap = useMemo(
    () => buildAutoRoadmapData({
      uid,
      subjectKey,
      overview: view.overview,
      chapters: view.chapters,
      events,
      dueByTopic,
      dueTotal,
      cardsDue: cards.due,
      now,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uid, subjectKey, view, events, dueByTopic, dueTotal, cards.due, now, aspTick],
  );

  const filteredChapters = useMemo(() => {
    const q = norm(query).trim();
    return autoRoadmap.enrichedChapters.filter((c) => {
      if (gradeFilter !== 'all' && Number(c.chapter.grade) !== Number(gradeFilter)) return false;
      if (groupFilter !== 'all' && c.groupKey !== groupFilter) return false;
      if (!q) return true;
      return norm(c.chapter.name).includes(q) || norm(c.chapter.desc).includes(q);
    });
  }, [autoRoadmap.enrichedChapters, gradeFilter, groupFilter, query]);

  /* Tự động chọn 1 chuyên đề hợp lệ cho Sticky Inspector */
  useEffect(() => {
    const exists = filteredChapters.some((c) => c.chapter.id === selectedChapterId);
    if (!exists) {
      const preferred = autoRoadmap.primaryAction?.chapterId;
      const inFiltered = filteredChapters.find((c) => c.chapter.id === preferred);
      setSelectedChapterId(inFiltered?.chapter?.id || filteredChapters[0]?.chapter?.id || null);
    }
  }, [filteredChapters, selectedChapterId, autoRoadmap.primaryAction]);

  const selectedChapterView = useMemo(
    () => autoRoadmap.enrichedChapters.find((c) => c.chapter.id === selectedChapterId)
      || filteredChapters[0]
      || null,
    [autoRoadmap.enrichedChapters, filteredChapters, selectedChapterId],
  );

  const sheetView = sheetId ? view.chapters.find((c) => c.chapter.id === sheetId) : null;

  const pickSubject = (nextSub) => {
    if (!SUBJECT_META[nextSub]) return;
    setSubjectKey(nextSub);
    setGlobalSubject(nextSub);
    setMobileInspectorOpen(false);
  };

  const pickGrade = (g) => {
    setGradeFilter(g);
    try {
      localStorage.setItem(GRADE_KEY, g);
      window.dispatchEvent(new CustomEvent('cs-ls', { detail: GRADE_KEY }));
    } catch { /* ignore */ }
  };

  const syncChapterHash = (id) => {
    try {
      const [base, q = ''] = window.location.hash.split('?');
      const p = new URLSearchParams(q);
      if (id) p.set('chapter', id); else p.delete('chapter');
      const rest = p.toString();
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${base || '#roadmap'}${rest ? `?${rest}` : ''}`);
    } catch { /* ignore */ }
  };

  const openChapter = (id) => {
    if (!id) return;
    const hitLesson = resolveLessonForChapter(id);
    if (hitLesson) {
      setDedicatedLessonId(hitLesson.id);
      setDedicatedSubject(hitLesson.subjectKey);
    }
    setDedicatedPractice(false);
    setMobileInspectorOpen(false);
    setActiveTab('study');
    syncChapterHash(id);
  };

  const practiceChapter = (id, practiceMode = 'fresh') => {
    if (!id) return;
    const hitLesson = resolveLessonForChapter(id);
    if (hitLesson) {
      setDedicatedLessonId(hitLesson.id);
      setDedicatedSubject(hitLesson.subjectKey);
    }
    setDedicatedPractice(practiceMode === 'fresh' || practiceMode === 'review');
    setMobileInspectorOpen(false);
    setActiveTab('study');
    syncChapterHash(id);
  };

  const selectChapterFromUi = (id) => {
    if (!id) return;
    const meta = getChapterMeta(id);
    if (meta?.subject && meta.subject !== subjectKey) {
      setSubjectKey(meta.subject);
      setGlobalSubject(meta.subject);
    }
    setSelectedChapterId(id);
    if (typeof window !== 'undefined' && window.innerWidth <= 1080) {
      setMobileInspectorOpen(true);
    }
  };

  const openCasioStudio = () => {
    window.location.hash = '#casio';
  };

  const closeSheet = () => {
    setSheetId(null);
    setSheetMode(null);
    setActiveTab('trail');
    setDedicatedLessonId(null);
    setDedicatedPractice(false);
    syncChapterHash(null);
  };

  const reviewCards = () => {
    if (!uid) return;
    const ids = dueCards(uid, { now, limit: 10 }).map((c) => c.qid);
    if (ids.length) setDueQids(ids);
  };

  const aiStrategy = (rmData) => {
    if (rmData?.customPrompt) {
      askAI(rmData.customPrompt, levelKey);
      return;
    }
    const ctx = buildAiContext({
      levelKey, level: levelAll, chapterViews: view.chapters, overview: view.overview,
      extra: { weekCount, weekGoal: data.goal },
    });
    const asp = rmData?.activeAsp;
    const nv1Line = asp
      ? `Nguyện vọng: ${asp.school.code} - ${asp.school.name} · Ngành ${asp.major.name} (Tổ hợp ${asp.block}, Mục tiêu môn ${subjectMeta.name}: ${rmData.targetSubject10}/10).`
      : `Môn đang ôn: ${subjectMeta.name} (Chuẩn đề 2025–2026: ${subjectMeta.structureLabel}).`;
    askAI(
      `Đóng vai gia sư ${subjectMeta.name} ELEC AI (xưng "mình – bạn"), dựa trên dữ liệu học tập dưới đây, hãy tư vấn 5 bước ngắn gọn:\n`
      + '1) Nhận xét dự báo điểm 3 phần (Phần I · Phần II Đúng/Sai · Phần III Điền số).\n'
      + '2) Chọn 2 chuyên đề trọng số cao nhất cần cày tuần này để tăng điểm nhanh nhất.\n'
      + '3) Lịch học gợi ý mỗi ngày (30–40 phút).\n'
      + '4) Cách vá các lỗ hổng kiến thức gốc.\n'
      + '5) Động viên ngắn gọn.\n\n'
      + `=== HỒ SƠ ===\n${nv1Line}\n\n=== DỮ LIỆU CHUYÊN ĐỀ ===\n${ctx}`,
      levelKey,
    );
  };

  const aiChapter = (chapter, kind = 'summary', qItem = null) => {
    if (!chapter) return;
    if (kind === 'explain' && qItem) {
      const rightOpt = qItem.options?.[qItem.correct] || '';
      askAI(
        `Giải thích từng bước câu hỏi trắc nghiệm chuyên đề "${chapter.name}" (${subjectMeta.name}), xưng "mình – bạn":\n`
        + `Câu hỏi: ${qItem.q}\n`
        + `Các lựa chọn: ${(qItem.options || []).map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join(' · ')}\n`
        + `Đáp án đúng: ${rightOpt}\n`
        + 'Hãy giải thích vì sao đáp án đó đúng, vì sao các phương án còn lại sai, và nêu mẹo nhớ nhanh.',
        levelKey,
      );
      return;
    }
    const stat = view.chapters.find((c) => c.chapter.id === chapter.id);
    const line = stat?.summary
      ? `Mình đã làm ${stat.summary.correct}/${stat.summary.answers} câu đúng ở chương này (thành thạo ${stat.mastery.score}%).`
      : 'Mình mới bắt đầu học chương này.';
    askAI(
      `Tóm tắt kiến thức trọng tâm chuyên đề "${chapter.name}" (${subjectMeta.name} · chuẩn GDPT 2018) trong 8 gạch đầu dòng sắc nét, `
      + 'chỉ ra 3 bẫy hay gặp ở Phần II Đúng/Sai và 2 bài mẫu Phần III Trả lời ngắn kèm lời giải từng bước. '
      + line,
      levelKey,
    );
  };

  const refresh = () => {
    if (uid) invalidateEvidence(uid);
    setTick((t) => t + 1);
  };

  const topWrongChapterId = autoRoadmap.wrongByChapter[0]?.chapterId
    || autoRoadmap.primaryAction?.chapterId
    || view.chapters[0]?.chapter?.id;

  const trackSet = useMemo(() => new Set(autoRoadmap.trackSubjects || []), [autoRoadmap.trackSubjects]);

  /* Phòng học lý thuyết & luyện tập chuyên sâu */
  if (activeTab === 'study') {
    return (
      <div className="ns9-dedicated-study-container">
        <DedicatedLessonView
          initialLessonId={dedicatedLessonId || 'c10-atom-1'}
          initialSubject={dedicatedSubject || subjectKey}
          initialPractice={dedicatedPractice}
          onBack={() => {
            setActiveTab('trail');
            setDedicatedLessonId(null);
            setDedicatedPractice(false);
            syncChapterHash(null);
          }}
          onAi={(prompt) => askAI(prompt, levelKey)}
          uid={uid}
        />
      </div>
    );
  }

  return (
    <div className="rm rm-pro-page">
      {/* ── VÙNG 1: COMMAND DECK (BÀN ĐIỀU KHIỂN THỦ KHOA — 3-GIÂY HIỂU NGAY) ── */}
      <RoadmapCommandDeck
        autoRoadmap={autoRoadmap}
        subjectMeta={subjectMeta}
        masteredCount={autoRoadmap.masteredChapters.length}
        totalCount={autoRoadmap.enrichedChapters.length}
        dueTotal={dueTotal}
        showHubOverview={showHubOverview}
        onToggleHubOverview={() => setShowHubOverview((v) => !v)}
        onStartMission={(chId, mode) => practiceChapter(chId, mode)}
        onJumpDetour={(rootId) => selectChapterFromUi(rootId)}
        onOpenDiagnostic={() => {
          setCheckpointStage(null);
          setDiagOpen(true);
        }}
      />

      {/* Biểu đồ tiến bộ Điểm / Elo & Quản lý Nguyện vọng (Mở khi bấm nút "Biểu đồ & NV") */}
      {showHubOverview && (
        <AspirationRoadmapHub
          uid={uid}
          overview={view.overview}
          chapters={view.chapters}
          dueTotal={dueTotal}
          cardsDue={cards.due}
          events={events}
          now={now}
          onOpenChapter={openChapter}
          onPracticeChapter={(id) => practiceChapter(id, 'fresh')}
          onReviewChapter={(id) => practiceChapter(id, 'review')}
          onReviewCards={reviewCards}
          onAiStrategy={aiStrategy}
          onOpenDiagnostic={() => {
            setCheckpointStage(null);
            setDiagOpen(true);
          }}
          onTabSelect={(tab) => {
            if (tab === 'study') {
              openChapter(autoRoadmap.primaryAction?.chapterId || view.chapters[0]?.chapter?.id);
              return;
            }
            setActiveTab(tab === 'subjects' ? 'trail' : tab);
          }}
        />
      )}

      {data.error && (
        <div className="rm-banner err" role="alert">
          <b>Không tải được dữ liệu học tập</b>
          <span>{data.error}</span>
          <button type="button" className="rm-btn sm" onClick={refresh}>Thử lại</button>
        </div>
      )}

      {/* ── VÙNG 2: UNIFIED STUDIO TOOLBAR (2 HÀNG CÂN ĐỐI · TRÁI CHỌN CHẾ ĐỘ · PHẢI TÌM & LỌC) ── */}
      <div className="rm-pro-toolbar rm-pro-toolbar-v2" role="region" aria-label="Thanh điều khiển lộ trình">
        {/* Hàng 1: Chọn Môn KHTN (trái) · Lọc Khối lớp + Cẩm nang (phải) */}
        <div className="rm-pro-tb-row">
          <div className="rm-pro-sub-tabs" role="tablist" aria-label="Chọn môn Khoa học Tự nhiên">
            {SUBJECT_ORDER.map((sub) => {
              const meta = SUBJECT_META[sub];
              const inTrack = autoRoadmap.activeAsp && trackSet.has(sub);
              return (
                <button
                  key={sub}
                  type="button"
                  role="tab"
                  aria-selected={subjectKey === sub}
                  className={`rm-pro-sub-btn ${subjectKey === sub ? 'is-active' : ''}`}
                  onClick={() => pickSubject(sub)}
                >
                  {renderSubIcon(sub)}
                  <span>{meta.name}</span>
                  {inTrack && (
                    <span className="rm-pro-track-tag" title={`Môn thuộc tổ hợp ${autoRoadmap.activeAsp.block}`}>
                      {autoRoadmap.activeAsp.block}
                    </span>
                  )}
                  <span className="rm-pro-sub-cnt">{subjectCounts[sub]}</span>
                </button>
              );
            })}
          </div>

          <div className="rm-pro-tb-right">
            {(activeTab === 'trail' || activeTab === 'dag') && (
              <div className="rm-pro-grade-pills" role="group" aria-label="Lọc khối lớp">
                {[
                  ['all', 'Cả 3 lớp'],
                  ['10', 'Lớp 10'],
                  ['11', 'Lớp 11'],
                  ['12', 'Lớp 12'],
                ].map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    className={`rm-pro-grade-btn ${gradeFilter === val ? 'is-active' : ''}`}
                    onClick={() => pickGrade(val)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              className="rm-pro-ghost-btn rm-pro-guide-btn"
              onClick={() => setGuideOpen(true)}
              title="Cẩm nang phương pháp ôn thi 2025–2026"
            >
              <img src="/img/elec/elec-happy.png" alt="" className="rm-pro-tab-sticker" aria-hidden="true" />
              <IcoCompass />
              <span>Cẩm nang</span>
            </button>
          </div>
        </div>

        {/* Hàng 2: 5 Chế độ xem (trái) · Tìm chuyên đề + Lọc trạng thái (phải) */}
        <div className="rm-pro-tb-row rm-pro-tb-row-bottom">
          <div className="rm-pro-mode-tabs" role="tablist" aria-label="Chế độ xem lộ trình">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'trail'}
              className={`rm-pro-mode-btn ${activeTab === 'trail' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('trail')}
            >
              <img src="/img/elec/elec-hello.png" alt="" className="rm-pro-tab-sticker" aria-hidden="true" />
              <IcoRoute />
              <span>Lộ trình</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'dag'}
              className={`rm-pro-mode-btn ${activeTab === 'dag' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('dag')}
            >
              <img src="/img/elec/elec-think.png" alt="" className="rm-pro-tab-sticker" aria-hidden="true" />
              <IcoGraph />
              <span>Bản đồ DAG</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'timeline'}
              className={`rm-pro-mode-btn ${activeTab === 'timeline' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('timeline')}
            >
              <img src="/img/elec/elec-fighting.png" alt="" className="rm-pro-tab-sticker" aria-hidden="true" />
              <IcoCalendar />
              <span>4 tuần</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'wrong'}
              className={`rm-pro-mode-btn ${activeTab === 'wrong' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('wrong')}
            >
              <img src="/img/elec/elec-wink.png" alt="" className="rm-pro-tab-sticker" aria-hidden="true" />
              <IcoAlertBook />
              <span>Sổ sai</span>
              {dueTotal > 0 && <span className="rm-pro-mode-badge">{dueTotal}</span>}
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'bookshelf'}
              className={`rm-pro-mode-btn ${activeTab === 'bookshelf' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('bookshelf')}
              title="Thư viện Kệ sách 3D KHTN (16 giáo trình Hoá · Vật lí · Sinh học)"
            >
              <img src="/img/elec/elec-cool.png" alt="" className="rm-pro-tab-sticker" aria-hidden="true" />
              <IcoBookshelf />
              <span>Kệ sách</span>
            </button>
          </div>

          {(activeTab === 'trail' || activeTab === 'dag') && (
            <div className="rm-pro-tb-right">
              <div className="rm-pro-search-box">
                <IcoSearch />
                <input
                  ref={searchRef}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Tìm chuyên đề ${subjectMeta.name}...`}
                  aria-label={`Tìm chuyên đề ${subjectMeta.name}`}
                />
              </div>

              <select
                className="rm-pro-filter-select"
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                aria-label="Lọc theo trạng thái học"
              >
                <option value="all">Tất cả ({autoRoadmap.enrichedChapters.length})</option>
                <option value="priority">Cần ưu tiên ({autoRoadmap.priorityChapters.length})</option>
                <option value="learning">Đang luyện ({autoRoadmap.learningChapters.length})</option>
                <option value="mastered">Đã vững ({autoRoadmap.masteredChapters.length})</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ── VÙNG 3: WORKSPACE 2 CỘT (LỘ TRÌNH / DAG + STICKY INSPECTOR) ── */}
      {(activeTab === 'trail' || activeTab === 'dag') && (
        <div className="rm-pro-workspace">
          <div className="rm-pro-canvas">
            {activeTab === 'trail' ? (
              <WindingRoadmapTrail
                chapters={filteredChapters}
                subjectKey={subjectKey}
                selectedId={selectedChapterView?.chapter?.id || null}
                checkpoints={checkpoints}
                onSelectChapter={selectChapterFromUi}
                onOpenChapter={openChapter}
                onStartCheckpoint={(stageObj) => {
                  setCheckpointStage(stageObj);
                  setDiagOpen(true);
                }}
              />
            ) : (
              <KnowledgeMap
                chapters={filteredChapters}
                selectedId={selectedChapterView?.chapter?.id || null}
                onSelect={selectChapterFromUi}
                onOpen={openChapter}
              />
            )}
          </div>

          <ChapterInspectorPanel
            chapterView={selectedChapterView}
            onSelectChapter={(id) => {
              const meta = getChapterMeta(id);
              if (meta?.subject && meta.subject !== subjectKey) {
                setSubjectKey(meta.subject);
                setGlobalSubject(meta.subject);
              }
              if (gradeFilter !== 'all' && meta?.grade && Number(gradeFilter) !== meta.grade) {
                setGradeFilter('all');
              }
              setSelectedChapterId(id);
            }}
            onOpenChapter={openChapter}
            onPracticeChapter={practiceChapter}
            onOpenLesson={(lesId, subKey, chId) => {
              setDedicatedLessonId(lesId);
              if (subKey) setDedicatedSubject(subKey);
              setDedicatedPractice(false);
              setMobileInspectorOpen(false);
              setActiveTab('study');
              if (chId) syncChapterHash(chId);
            }}
            onAiChapter={aiChapter}
            onOpenCasio={openCasioStudio}
            mobileOpen={mobileInspectorOpen}
            onCloseMobile={() => setMobileInspectorOpen(false)}
          />
        </div>
      )}

      {/* ── TAB KẾ HOẠCH 4 TUẦN ── */}
      {activeTab === 'timeline' && (
        <section className="ns9-timeline-section" aria-label="Lộ trình tự động theo tuần và ngày">
          <div className="ns9-timeline-intro">
            <div>
              <h3>Lộ trình 4 tuần môn {subjectMeta.name} (Mục tiêu {autoRoadmap.targetSubject10}/10đ)</h3>
              <p>
                Tự động phân bổ dựa trên quỹ thời gian <b>{autoRoadmap.schedule.weeklyFreeHours} giờ/tuần</b> và ưu tiên các chuyên đề trọng số cao nhất trong đề <b>{autoRoadmap.activeExam.name}</b>.
              </p>
            </div>
            <span className={`ns9-pace-pill tone-${autoRoadmap.paceTone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {autoRoadmap.isAccelerating ? (
                <><IconZap size={13} /> Chế độ Tăng tốc ({autoRoadmap.recommendedQuestionsPerSession} câu/buổi)</>
              ) : (
                `Nhịp độ chuẩn (${autoRoadmap.recommendedQuestionsPerSession} câu/buổi)`
              )}
            </span>
          </div>

          <div className="ns9-weeks-grid">
            {autoRoadmap.milestones.map((wk) => (
              <div key={wk.weekNum} className="ns9-week-card">
                <div className="ns9-week-head">
                  <div>
                    <span className="ns9-week-badge">{wk.title}</span>
                    <h4>{wk.phaseLabel}</h4>
                  </div>
                  <div className="ns9-week-expected">
                    <span>Điểm kỳ vọng</span>
                    <b>{wk.expectedChemScore} / 10đ</b>
                  </div>
                </div>

                <ul className="ns9-day-tasks">
                  {wk.days.map((d, idx) => (
                    <li key={idx} className={`ns9-day-item type-${d.type}`}>
                      <div className="ns9-day-meta">
                        <b>{d.dayLabel}</b>
                        <span className="ns9-day-tag">{d.badge}</span>
                      </div>
                      <p className="ns9-day-title">{d.title}</p>
                      {d.chapterId && (
                        <button
                          type="button"
                          className="ns9-day-action"
                          onClick={() => practiceChapter(d.chapterId, d.type === 'review' ? 'review' : 'fresh')}
                        >
                          <span>Làm ngay ({d.questionCount} câu)</span>
                          <IcoArrowRight />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <StudyPlanCard
            chapters={view.chapters}
            dueByTopic={dueByTopic}
            uid={uid}
            levelKey={levelKey}
            onOpenChapter={openChapter}
          />
        </section>
      )}

      {/* ── TAB SỔ LỖI SAI & ÔN NGẮT QUÃNG ── */}
      {activeTab === 'wrong' && (
        <section className="ns9-wrong-section" aria-label="Sổ lỗi sai theo chương và thẻ ghi nhớ">
          <div className="ns9-wrong-hero">
            <div>
              <h3>Sổ lỗi sai &amp; Ôn tập chống quên ({subjectMeta.name})</h3>
              <p>
                Hệ thống tự động gom các câu trả lời sai theo từng chuyên đề {subjectMeta.name} để bạn vá đúng lỗ hổng trước kỳ thi.
              </p>
            </div>
            <div className="ns9-wrong-hero-btns">
              <button
                type="button"
                className="ns9-primary-cta-btn"
                onClick={() => practiceChapter(topWrongChapterId, dueTotal > 0 ? 'review' : 'fresh')}
              >
                <span>Luyện lại 10 câu sai</span>
                <IcoArrowRight />
              </button>
              {cards.due > 0 && (
                <button type="button" className="ns9-btn-outline" onClick={reviewCards}>
                  Lật {cards.due} thẻ Flashcard đến hạn
                </button>
              )}
            </div>
          </div>

          <SpacedRepetitionMilestones
            dueTotal={dueTotal}
            cardsDue={cards.due}
            wrongCount={autoRoadmap.wrongByChapter.length}
            onTriggerReview={() => practiceChapter(topWrongChapterId, dueTotal > 0 ? 'review' : 'fresh')}
          />

          {autoRoadmap.wrongByChapter.length === 0 ? (
            <div className="ns9-empty-state">
              <b>Hiện chưa có câu trả lời sai tồn đọng ở môn {subjectMeta.name}!</b>
              <p>
                Khi bạn luyện tập ở từng chuyên đề, mọi câu sai sẽ tự động được lưu kèm lời giải chi tiết và lịch nhắc ôn chống quên.
              </p>
              <button
                type="button"
                className="ns9-ch-btn-primary"
                onClick={() => practiceChapter(autoRoadmap.primaryAction?.chapterId || view.chapters[0]?.chapter?.id, 'fresh')}
              >
                <span>Bắt đầu luyện 10 câu ngay</span>
                <IcoArrowRight />
              </button>
            </div>
          ) : (
            <div className="ns9-wrong-list">
              {autoRoadmap.wrongByChapter.map((item) => (
                <div key={item.chapterId} className="ns9-wrong-row">
                  <div className="ns9-wrong-info">
                    <b>{item.chapterName}</b>
                    <small>
                      Độ chính xác hiện tại: <b>{item.accuracyPct}%</b> · Có <b>{item.wrongCount} câu cần khắc phục</b>
                    </small>
                  </div>
                  <div className="ns9-wrong-actions">
                    <button
                      type="button"
                      className="ns9-ch-btn-ghost"
                      onClick={() => openChapter(item.chapterId)}
                    >
                      Xem lại lý thuyết
                    </button>
                    <button
                      type="button"
                      className="ns9-ch-btn-primary"
                      onClick={() => practiceChapter(item.chapterId, 'review')}
                    >
                      <span>Luyện lại câu sai</span>
                      <IcoArrowRight />
                    </button>
                  </div>
                </div>
              ))}

              {autoRoadmap.wrongQuestionsList && autoRoadmap.wrongQuestionsList.length > 0 && (
                <div className="ns9-wrong-questions-block">
                  <div className="ns9-wq-head">
                    <h4>Chi tiết từng câu đã làm sai ({autoRoadmap.wrongQuestionsList.length} câu)</h4>
                    <span>Xem lại đáp án đúng hoặc nhờ AI giảng từng bước</span>
                  </div>

                  <div className="ns9-wq-cards">
                    {autoRoadmap.wrongQuestionsList.map((wq, idx) => (
                      <article key={wq.qid} className="ns9-wq-card">
                        <div className="ns9-wq-top">
                          <span className="ns9-ch-index">{wq.chapterTitle}</span>
                          <span className="ns9-wq-err-tag">Sai {wq.wrongTimes} lần</span>
                        </div>

                        <p className="ns9-wq-question">
                          <b>Câu {idx + 1}:</b> {wq.q}
                        </p>

                        {wq.correctAnswer && (
                          <div className="ns9-wq-ans-box">
                            <span className="ns9-wq-right" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                              <IcoCheck />
                              <span>Đáp án đúng: <b>{wq.correctAnswer}</b></span>
                            </span>
                            {wq.distractors.length > 0 && (
                              <small className="ns9-wq-distractors">
                                Phương án nhiễu: {wq.distractors.join(' · ')}
                              </small>
                            )}
                          </div>
                        )}

                        {wq.explain && (
                          <p className="ns9-wq-explain">
                            <b>Giải thích:</b> {wq.explain}
                          </p>
                        )}

                        <div className="ns9-wq-actions">
                          <button
                            type="button"
                            className="ns9-btn-ai"
                            onClick={() => aiChapter(
                              { id: wq.topicId, name: wq.chapterTitle },
                              'explain',
                              { q: wq.q, options: wq.options, correct: 0 },
                            )}
                          >
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <IcoSparkles />
                              <span>Nhờ AI giảng từng bước</span>
                            </span>
                          </button>
                          {wq.topicId && (
                            <button
                              type="button"
                              className="ns9-ch-btn-ghost"
                              onClick={() => practiceChapter(wq.topicId, 'review')}
                            >
                              Luyện lại chương này
                            </button>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* ── TAB KỆ SÁCH KIẾN THỨC & GIÁO TRÌNH TƯƠNG TÁC (8 TẦNG KỆ · 89 ĐẦU SÁCH) ── */}
      {activeTab === 'bookshelf' && (
        <section className="ns9-bookshelf-section" aria-label="Thư viện Kệ sách Kiến thức và Giáo trình tương tác">
          <KnowledgeBookshelfView
            subjectKey={subjectKey}
            onOpenChapterLesson={(subKey, chId) => {
              if (subKey && SUBJECT_META[subKey] && subKey !== subjectKey) {
                setSubjectKey(subKey);
                setGlobalSubject(subKey);
              }
              if (chId) {
                openChapter(chId);
              } else {
                setActiveTab('trail');
              }
            }}
            onAskAiTopic={(promptText) => askAI(promptText)}
          />
        </section>
      )}

      {/* Công cụ Giáo viên / Admin */}
      {canCurate && data.bank && data.bank.untagged > 0 && (
        <div className="ns9-teacher-bar">
          <span>Công cụ Giáo viên: Còn {data.bank.untagged}/{data.bank.total} câu hỏi trên máy chủ chưa gắn mã chương.</span>
          <button type="button" className="rm-btn sm" onClick={() => setTaggerOpen(true)}>
            Gắn chuyên đề ({data.bank.untagged})
          </button>
        </div>
      )}

      {taggerOpen && canCurate && (
        <BankTagger
          onClose={() => setTaggerOpen(false)}
          onSaved={() => {
            invalidateEvidence(uid);
            setTick((t) => t + 1);
          }}
        />
      )}

      {dueQids && createPortal(
        <div className="rm-sheet-backdrop" onClick={() => setDueQids(null)} role="presentation">
          <div
            className="rm-sheet rm-sheet-slim"
            role="dialog"
            aria-modal="true"
            aria-label="Ôn thẻ ghi nhớ đến hạn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rm-sheet-grip" aria-hidden="true" />
            <div className="rm-sheet-body">
              <FlashcardSession
                chapterId={null}
                chapterName=""
                uid={uid}
                size={10}
                qids={dueQids}
                onClose={() => { setDueQids(null); setCardTick((n) => n + 1); }}
                onDone={() => setCardTick((n) => n + 1)}
              />
            </div>
          </div>
        </div>,
        document.body,
      )}

      <DiagnosticTestModal
        open={diagOpen}
        uid={uid}
        levelKey={levelKey}
        subjectKey={subjectKey}
        chapters={view.chapters}
        checkpointStage={checkpointStage}
        onClose={() => {
          setDiagOpen(false);
          setCheckpointStage(null);
        }}
        onCompleted={() => {
          setCheckpoints(readStageCheckpoints(uid));
          setCardTick((n) => n + 1);
          setAspTick((n) => n + 1);
        }}
      />

      <StudyMethodologyGuideModal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
      />

      {sheetView && (
        <ChapterSheet
          view={sheetView}
          levelKey={levelKey}
          uid={uid}
          initialMode={sheetMode}
          dueCount={dueByTopic[sheetView.chapter.id] || 0}
          onClose={closeSheet}
          onOpenChapter={openChapter}
          onAi={(kind, qItem) => aiChapter(sheetView.chapter, kind, qItem)}
          onRefresh={() => setCardTick((n) => n + 1)}
        />
      )}
    </div>
  );
}
