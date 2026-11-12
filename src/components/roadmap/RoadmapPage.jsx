/* ============================================================
   RoadmapPage.jsx — TRANG "LỘ TRÌNH HỌC TẬP CÁ NHÂN HÓA" (CHUẨN ELEC AI)
   ------------------------------------------------------------
   Thiết kế tinh gọn, thực tế, dễ hiểu ngay từ cái nhìn đầu tiên:
   1. Thẻ "Lộ trình của em" (AspirationRoadmapHub):
      • Nguyện vọng đang chọn + 4 chỉ số (Điểm dự đoán, Mục tiêu, Tiến độ, Elo)
      • Biểu đồ đường Điểm | Elo + 1 Nút hành động chính duy nhất "Luyện tập ngay"
   2. Ba chế độ xem gọn gàng bằng Tab (không nhồi nhét quá 5 khối trên màn hình):
      • Tab 1 — "Chuyên đề Hóa học" (Thẻ chương: thanh tiến độ,
        độ chính xác %, trọng số đề thi thật, nút "Vào học" & "Lý thuyết")
      • Tab 2 — "Kế hoạch theo tuần" (Lộ trình tự động Tháng -> Tuần -> Ngày kèm điểm kỳ vọng)
      • Tab 3 — "Sổ lỗi sai & Ôn tập" (Gom câu sai theo chương, nút "Luyện lại 10 câu sai")
   ============================================================ */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import { askAI } from '../HomePlus.jsx';
import {
  ROADMAP_LEVELS, LEVEL_KEYS, DEFAULT_LEVEL, getLevel, findChapter,
} from '../../data/roadmap.js';
import {
  loadEvidence, invalidateEvidence, loadBankCoverage, localAttemptsOf,
} from '../../lib/roadmapEvidence.js';
import {
  readStore, subscribeRoadmap, sessionsToEvents,
} from '../../lib/roadmapStore.js';
import { cardStats, dueCards, subscribeCards } from '../../lib/flashcardStore.js';
import { dueSummary } from '../../lib/reviewQueue.js';
import {
  summarizeEvents, buildChapterViews, buildAiContext,
  weekProgress,
} from '../../lib/roadmapEngine.js';
import { buildAutoRoadmapData } from '../../lib/autoRoadmapEngine.js';
import { subscribeAspirationChanges } from '../../lib/aspirationService.js';
import KnowledgeMap from './KnowledgeMap.jsx';
import ChapterSheet from './ChapterSheet.jsx';
import DedicatedLessonView from './DedicatedLessonView.jsx';
import { findLessonById, findLessonByChapterId, findLessonsByChapter, DEDICATED_LESSONS } from '../../data/dedicatedLessonsData.js';
import BankTagger from './BankTagger.jsx';
import StudyPlanCard from './StudyPlanCard.jsx';
import FlashcardSession from './FlashcardSession.jsx';
import { IconZap } from '../Icons.jsx';
import AspirationRoadmapHub from './AspirationRoadmapHub.jsx';
import DiagnosticTestModal from './DiagnosticTestModal.jsx';
import StudyMethodologyGuideModal from './StudyMethodologyGuideModal.jsx';
import { isAdmin } from '../../lib/isAdmin.js';
import { getUserRole } from '../../lib/userRole.js';
import { formatMathAndChemSymbols } from '../../lib/chemFormulaFormatter.js';
import '../../styles/roadmap-page.css';
import '../../styles/roadmap-page-v2.css';
import '../../styles/roadmap-upgrade.css';

const LEVEL_KEY = 'cs-home-grade';

const readLevel = () => {
  try {
    const g = localStorage.getItem(LEVEL_KEY);
    if (g === 'all') return 'all';
    return LEVEL_KEYS.indexOf(g) >= 0 ? g : 'all';
  } catch { return 'all'; }
};

const hashParams = () => {
  try {
    return new URLSearchParams((window.location.hash.split('?')[1] || ''));
  } catch { return new URLSearchParams(); }
};

const norm = (s) => String(s || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd');

/* Bộ biểu tượng SVG vector chuẩn nét — Không dùng Emoji */
const IcoBook = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const IcoBookOpen = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

const IcoGlobe = ({ size = 15, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const IcoFlask = ({ size = 15, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M10 2v7.31L4.35 18.2A2 2 0 0 0 6.07 21h11.86a2 2 0 0 0 1.72-2.8L14 9.31V2" />
    <line x1="8.5" y1="2" x2="15.5" y2="2" />
    <line x1="6.8" y1="15" x2="17.2" y2="15" />
  </svg>
);

const IcoZap = ({ size = 15, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const IcoDna = ({ size = 15, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M2 15c6.667-6 13.333 0 20-6" />
    <path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993" />
    <path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993" />
    <path d="M17 6l-2.5-2.5" />
    <path d="M14 8l-1-1" />
    <path d="M7 18l2.5 2.5" />
    <path d="M3.5 14.5l.5.5" />
    <path d="M20 9.5l.5.5" />
    <path d="M6.5 12.5l1 1" />
    <path d="M16.5 10.5l1 1" />
    <path d="M10 16l1.5 1.5" />
    <path d="M2 9c6.667 6 13.333 0 20 6" />
  </svg>
);

const IcoSparkles = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
  </svg>
);

const IcoClock = ({ size = 12, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IcoCheck = ({ size = 13, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IcoTarget = ({ size = 12, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
  </svg>
);

const IcoAlertTriangle = ({ size = 12, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const IcoCalendar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const IcoAlertBook = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
  </svg>
);

const IcoSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IcoArrowRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const IcoStudy = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

const IcoCompass = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
);

export default function RoadmapPage() {
  const { user } = useAuth();
  const uid = user?.uid || null;

  const [levelKey, setLevelKey] = useState(readLevel);
  const [subjectFilter, setSubjectFilter] = useState('all'); // 'all' | 'hoa' | 'ly' | 'sinh'
  const [activeTab, setActiveTab] = useState('subjects'); // 'subjects' | 'timeline' | 'wrong' | 'study'
  const [dedicatedLessonId, setDedicatedLessonId] = useState(null);
  const [dedicatedSubject, setDedicatedSubject] = useState('ly');
  const [dedicatedPractice, setDedicatedPractice] = useState(false);
  const [displayMode, setDisplayMode] = useState('cards'); // 'cards' | 'map'
  const [groupFilter, setGroupFilter] = useState('all'); // 'all' | 'priority' | 'learning' | 'mastered'
  const [query, setQuery] = useState('');
  const [data, setData] = useState({
    remoteEvents: [], remoteAttempts: [], sessions: [], goal: null, issues: [],
    bank: null, loading: true, error: null,
  });
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
  const [guideOpen, setGuideOpen] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState(() => new Set());
  const alive = useRef(true);

  const toggleExpandLessons = useCallback((chId) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chId)) next.delete(chId);
      else next.add(chId);
      return next;
    });
  }, []);

  const canCurate = isAdmin(user) || getUserRole(user) === 'teacher';

  const load = useCallback((force = false) => {
    if (!uid) {
      setData({ remoteEvents: [], remoteAttempts: [], sessions: [], goal: null, issues: [], bank: null, loading: false, error: null });
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
    if (!uid) return;
    const store = readStore(uid);
    setData((d) => ({ ...d, sessions: store.sessions, goal: store.goal }));
  }), [uid]);

  /* Deep link #roadmap?chapter=... | ?tab=wrong | ?tab=study | ?lesson=... | ?mode=diagnostic */
  useEffect(() => {
    const apply = () => {
      const p = hashParams();
      const id = p.get('chapter');
      const lesson = p.get('lesson');
      const sub = p.get('subject');
      const lv = p.get('level');
      const tabParam = p.get('tab');
      const modeParam = p.get('mode');
      if (lv && LEVEL_KEYS.indexOf(lv) >= 0) setLevelKey(lv);
      if (tabParam && ['subjects', 'timeline', 'wrong', 'study'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
      if (modeParam === 'diagnostic') {
        setDiagOpen(true);
      }
      if (lesson) {
        setDedicatedLessonId(lesson);
        if (sub) setDedicatedSubject(sub);
        setActiveTab('study');
      } else if (id) {
        const hitLesson = findLessonByChapterId(id);
        if (hitLesson) {
          setDedicatedLessonId(hitLesson.id);
          setDedicatedSubject(hitLesson.subjectKey);
          setActiveTab('study');
        } else {
          setDedicatedLessonId('ly-chuyen-dong-nem');
          setDedicatedSubject('ly');
          setActiveTab('study');
        }
      }
    };
    apply();
    window.addEventListener('hashchange', apply);
    return () => window.removeEventListener('hashchange', apply);
  }, []);

  const allHoaChapters = useMemo(() => {
    return ROADMAP_LEVELS.filter((l) => l.grade > 0).flatMap((l) => l.chapters.map((c) => ({ ...c, subjectKey: 'hoa' })));
  }, []);

  const lyChapters = useMemo(() => {
    return (DEDICATED_LESSONS.ly || []).map((ch, idx) => {
      let g = ch.grade;
      if (!g) {
        if (ch.chapterId.includes('donghoc') || ch.chapterId.includes('dongluc')) g = 10;
        else if (ch.chapterId.includes('daodong') || ch.chapterId.includes('song') || ch.chapterId.includes('dientruong') || ch.chapterId.includes('tutruong')) g = 11;
        else g = 12;
      }
      return {
        id: ch.chapterId,
        name: ch.chapterName,
        desc: ch.lessons[0]?.desc || 'Kiến thức cốt lõi, công thức và phương pháp giải Vật lí.',
        prereq: idx > 0 ? [DEDICATED_LESSONS.ly[idx - 1].chapterId] : [],
        bank: true,
        grade: g,
        subjectKey: 'ly',
      };
    });
  }, []);

  const sinhChapters = useMemo(() => {
    return (DEDICATED_LESSONS.sinh || []).map((ch, idx) => {
      let g = ch.grade;
      if (!g) {
        if (ch.chapterId.includes('tebao')) g = 10;
        else g = 12;
      }
      return {
        id: ch.chapterId,
        name: ch.chapterName,
        desc: ch.lessons[0]?.desc || 'Lý thuyết di truyền, sinh thái, tế bào và bài tập trắc nghiệm Sinh học.',
        prereq: idx > 0 ? [DEDICATED_LESSONS.sinh[idx - 1].chapterId] : [],
        bank: true,
        grade: g,
        subjectKey: 'sinh',
      };
    });
  }, []);

  const subjectCounts = useMemo(() => {
    const filterByLevel = (list) => {
      if (levelKey === 'all') return list.length;
      if (levelKey === 'Lớp 10') return list.filter((c) => c.grade === 10 || c.id?.startsWith('c10-') || c.id?.includes('10')).length;
      if (levelKey === 'Lớp 11') return list.filter((c) => c.grade === 11 || c.id?.startsWith('c11-') || c.id?.includes('11')).length;
      if (levelKey === 'Lớp 12') return list.filter((c) => c.grade === 12 || c.id?.startsWith('c12-') || c.id?.includes('12')).length;
      return list.length;
    };
    const hoa = filterByLevel(allHoaChapters);
    const ly = filterByLevel(lyChapters);
    const sinh = filterByLevel(sinhChapters);
    return {
      all: hoa + ly + sinh,
      hoa,
      ly,
      sinh,
    };
  }, [levelKey, allHoaChapters, lyChapters, sinhChapters]);

  const activeLevelChapters = useMemo(() => {
    let pool = [];
    if (subjectFilter === 'hoa') {
      pool = allHoaChapters;
    } else if (subjectFilter === 'ly') {
      pool = lyChapters;
    } else if (subjectFilter === 'sinh') {
      pool = sinhChapters;
    } else {
      pool = [...allHoaChapters, ...lyChapters, ...sinhChapters];
    }

    if (levelKey === 'all') {
      return pool;
    }
    if (levelKey === 'Lớp 10') {
      return pool.filter((c) => c.grade === 10 || c.id?.startsWith('c10-') || c.id?.includes('10'));
    }
    if (levelKey === 'Lớp 11') {
      return pool.filter((c) => c.grade === 11 || c.id?.startsWith('c11-') || c.id?.includes('11'));
    }
    if (levelKey === 'Lớp 12') {
      return pool.filter((c) => c.grade === 12 || c.id?.startsWith('c12-') || c.id?.includes('12'));
    }
    if (levelKey === 'Đại học') {
      const hit = ROADMAP_LEVELS.find((l) => l.key === 'Đại học');
      return hit ? hit.chapters : [];
    }
    return pool;
  }, [subjectFilter, levelKey, allHoaChapters, lyChapters, sinhChapters]);

  const level = useMemo(() => {
    return {
      key: levelKey,
      grade: levelKey === 'all' ? 0 : (levelKey === 'Lớp 10' ? 10 : (levelKey === 'Lớp 11' ? 11 : 12)),
      goal: levelKey === 'all'
        ? 'Luyện thi THPT Quốc gia & ĐGNL: Toàn diện kiến thức Khoa học Tự nhiên (Vật lí — Hóa học — Sinh học).'
        : `Lộ trình chinh phục mục tiêu kiến thức ${levelKey}.`,
      chapters: activeLevelChapters,
    };
  }, [levelKey, activeLevelChapters]);

  const localEvents = useMemo(
    () => sessionsToEvents(data.sessions),
    [data.sessions],
  );
  const events = useMemo(
    () => data.remoteEvents.concat(localEvents).slice(-3000),
    [data.remoteEvents, localEvents],
  );
  const summaries = useMemo(
    () => summarizeEvents(events),
    [events],
  );

  const view = useMemo(
    () => buildChapterViews(level, summaries, now),
    [level, summaries, now],
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
      overview: view.overview,
      chapters: view.chapters,
      events,
      dueByTopic,
      dueTotal,
      cardsDue: cards.due,
      now,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uid, view, events, dueByTopic, dueTotal, cards.due, now, aspTick],
  );

  const sheetView = sheetId ? view.chapters.find((c) => c.chapter.id === sheetId) : null;

  const filteredChapters = useMemo(() => {
    const q = norm(query).trim();
    return autoRoadmap.enrichedChapters.filter((c) => {
      if (groupFilter !== 'all' && c.groupKey !== groupFilter) return false;
      if (!q) return true;
      return norm(c.chapter.name).includes(q) || norm(c.chapter.desc).includes(q);
    });
  }, [autoRoadmap.enrichedChapters, groupFilter, query]);

  const pickLevel = (k) => {
    if (k !== 'all' && LEVEL_KEYS.indexOf(k) < 0) return;
    setLevelKey(k);
    try { localStorage.setItem(LEVEL_KEY, k); } catch { /* */ }
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
    const hitLesson = findLessonByChapterId(id);
    if (hitLesson) {
      setDedicatedLessonId(hitLesson.id);
      setDedicatedSubject(hitLesson.subjectKey);
    } else {
      setDedicatedLessonId('ly-chuyen-dong-nem');
      setDedicatedSubject('ly');
    }
    setDedicatedPractice(false);
    setActiveTab('study');
    syncChapterHash(id);
  };

  const closeSheet = () => {
    setSheetId(null);
    setSheetMode(null);
    setActiveTab('subjects');
    setDedicatedLessonId(null);
    setDedicatedPractice(false);
    syncChapterHash(null);
  };

  const practiceChapter = (id, practiceMode = 'fresh') => {
    if (!id) return;
    const hitLesson = findLessonByChapterId(id);
    if (hitLesson) {
      setDedicatedLessonId(hitLesson.id);
      setDedicatedSubject(hitLesson.subjectKey);
    } else {
      setDedicatedLessonId('ly-chuyen-dong-nem');
      setDedicatedSubject('ly');
    }
    setDedicatedPractice(practiceMode === 'fresh' || practiceMode === 'review');
    setActiveTab('study');
    syncChapterHash(id);
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
      levelKey, level, chapterViews: view.chapters, overview: view.overview,
      extra: { weekCount, weekGoal: data.goal },
    });
    const asp = rmData?.activeAsp;
    const nv1Line = asp
      ? `Nguyện vọng đang chọn: ${asp.school.code} - ${asp.school.name} · Ngành ${asp.major.name} (Tổ hợp ${asp.block}, Điểm mục tiêu: ${asp.targetScore}/${rmData.examScale}, Môn KHTN cần đạt: ${rmData.targetChem10}/10).`
      : 'Chưa chọn trường Nguyện vọng cụ thể.';
    askAI(
      'Đóng vai gia sư Khoa học Tự nhiên ELEC AI (xưng "mình – bạn"), dựa trên hồ sơ nguyện vọng và dữ liệu học tập dưới đây, hãy tư vấn ngắn gọn 5 bước:\n'
      + '1) Nhận xét khoảng cách điểm hiện tại so với mục tiêu Nguyện vọng.\n'
      + '2) Chỉ ra 2 chuyên đề KHTN trọng tâm (Vật lí, Hóa học hoặc Sinh học) cần ưu tiên cày ngay tuần này để tăng điểm nhanh nhất.\n'
      + '3) Lịch học gợi ý mỗi ngày (30–40 phút).\n'
      + '4) Cách khắc phục các câu hay sai.\n'
      + '5) Động viên ngắn gọn.\n\n'
      + `=== HỒ SƠ MỤC TIÊU ===\n${nv1Line}\n\n=== DỮ LIỆU CHUYÊN ĐỀ ===\n${ctx}`,
      levelKey,
    );
  };

  const aiChapter = (chapter, kind = 'summary', qItem = null) => {
    if (!chapter) return;
    if (kind === 'explain' && qItem) {
      const rightOpt = qItem.options?.[qItem.correct] || '';
      askAI(
        `Giải thích từng bước câu hỏi trắc nghiệm chuyên đề "${chapter.name}" (${levelKey}), xưng "mình – bạn":\n`
        + `Câu hỏi: ${qItem.q}\n`
        + `Các lựa chọn: ${(qItem.options || []).map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join(' · ')}\n`
        + `Đáp án đúng: ${rightOpt}\n`
        + 'Hãy giải thích từng bước vì sao đáp án đó đúng, vì sao các phương án còn lại sai, và nêu mẹo nhớ nhanh.',
        levelKey,
      );
      return;
    }
    const stat = view.chapters.find((c) => c.chapter.id === chapter.id);
    const line = stat?.summary
      ? `Mình đã làm ${stat.summary.correct}/${stat.summary.answers} câu đúng ở chương này (thành thạo ${stat.mastery.score}%).`
      : 'Mình mới bắt đầu học chương này.';
    askAI(
      `Tóm tắt kiến thức trọng tâm chương "${chapter.name}" (${levelKey}) trong 8 gạch đầu dòng dễ nhớ nhất, `
      + 'nêu 3 bẫy trắc nghiệm học sinh hay sai và 3 câu hỏi vận dụng kèm lời giải từng bước. '
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

  if (activeTab === 'study') {
    return (
      <div className="ns9-dedicated-study-container">
        <DedicatedLessonView
          initialLessonId={dedicatedLessonId || 'ly-chuyen-dong-nem'}
          initialSubject={dedicatedSubject || 'ly'}
          initialPractice={dedicatedPractice}
          onBack={() => {
            setActiveTab('subjects');
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
    <div className="rm ns9-page">
      {/* ── KHỐI 1: BANNER NGUYỆN VỌNG & THẺ "LỘ TRÌNH CỦA EM" (NHƯ ẢNH 9 & 10) ── */}
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
        onOpenDiagnostic={() => setDiagOpen(true)}
        onTabSelect={(tab) => {
          if (tab === 'study') {
            setDedicatedLessonId('ly-chuyen-dong-nem');
            setDedicatedSubject('ly');
            setDedicatedPractice(false);
          }
          setActiveTab(tab);
        }}
      />

      {data.error && (
        <div className="rm-banner err" role="alert">
          <b>Không tải được dữ liệu học tập</b>
          <span>{data.error}</span>
          <button type="button" className="rm-btn sm" onClick={refresh}>Thử lại</button>
        </div>
      )}

      {/* ── KHỐI 2: THANH CHUYỂN ĐỔI 3 CHẾ ĐỘ XEM & CHỌN KHỐI LỚP ── */}
      <div className="ns9-nav-strip">
        <div className="ns9-main-tabs" role="tablist" aria-label="Chế độ xem lộ trình">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'subjects'}
            className={`ns9-tab-btn ${activeTab === 'subjects' ? 'on' : ''}`}
            onClick={() => setActiveTab('subjects')}
          >
            <img src="/img/elec/elec-cool.png" alt="" className="ns9-tab-mascot" />
            <span>Lộ trình theo chuyên đề</span>
            <small className="ns9-tab-badge">{autoRoadmap.enrichedChapters.length}</small>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'timeline'}
            className={`ns9-tab-btn ${activeTab === 'timeline' ? 'on' : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            <img src="/img/elec/elec-think.png" alt="" className="ns9-tab-mascot" />
            <span>Kế hoạch từng tuần</span>
            <small className="ns9-tab-badge">4 tuần</small>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'wrong'}
            className={`ns9-tab-btn ${activeTab === 'wrong' ? 'on' : ''}`}
            onClick={() => setActiveTab('wrong')}
          >
            <img src="/img/elec/elec-fighting.png" alt="" className="ns9-tab-mascot" />
            <span>Sổ lỗi sai &amp; Ôn tập</span>
            {dueTotal > 0 && <small className="ns9-tab-badge warn">{dueTotal}</small>}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'study'}
            className={`ns9-tab-btn ${activeTab === 'study' ? 'on' : ''}`}
            onClick={() => {
              setDedicatedLessonId('ly-chuyen-dong-nem');
              setDedicatedSubject('ly');
              setDedicatedPractice(false);
              setActiveTab('study');
            }}
          >
            <img src="/img/elec/elec-happy.png" alt="" className="ns9-tab-mascot" />
            <span>Phòng học lý thuyết &amp; Công thức</span>
            <small className="ns9-tab-badge">Chuyên sâu</small>
          </button>
        </div>

        <div className="ns9-grade-picker" role="tablist" aria-label="Chọn khối lớp Khoa học Tự nhiên">
          <button
            type="button"
            role="tab"
            aria-selected={levelKey === 'all'}
            className={levelKey === 'all' ? 'on' : ''}
            onClick={() => pickLevel('all')}
          >
            <IcoSparkles size={14} />
            <span>Trọn bộ THPT (Tất cả)</span>
          </button>
          {LEVEL_KEYS.map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={k === levelKey}
              className={k === levelKey ? 'on' : ''}
              onClick={() => pickLevel(k)}
            >
              {k}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="ns9-asp-guide-trigger"
          onClick={() => setGuideOpen(true)}
          style={{ marginLeft: 8 }}
          title="Xem cẩm nang hướng dẫn ôn thi đúng cách"
        >
          <IcoCompass />
          <span>Hướng dẫn ôn đúng cách</span>
        </button>
      </div>

      {/* ============================================================
         TAB 1: LỘ TRÌNH THEO CHUYÊN ĐỀ (CHUẨN ELEC AI)
         ============================================================ */}
      {activeTab === 'subjects' && (
        <section className="ns9-subjects-section" aria-label="Lộ trình theo chuyên đề Khoa học Tự nhiên">
          {/* Thanh chuyển đổi phân môn Khoa học Tự nhiên (KHTN: Vật lí — Hóa học — Sinh học) */}
          <div className="ns9-subject-tabs" role="tablist" aria-label="Chọn môn học Khoa học Tự nhiên">
            {[
              { id: 'all', label: 'Toàn bộ KHTN', icon: <IcoGlobe size={15} />, badge: `${subjectCounts.all} chuyên đề` },
              { id: 'hoa', label: 'Hóa học', icon: <IcoFlask size={15} />, badge: `${subjectCounts.hoa} chuyên đề` },
              { id: 'ly', label: 'Vật lí', icon: <IcoZap size={15} />, badge: `${subjectCounts.ly} chuyên đề` },
              { id: 'sinh', label: 'Sinh học', icon: <IcoDna size={15} />, badge: `${subjectCounts.sinh} chuyên đề` },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={subjectFilter === s.id}
                className={`ns9-subject-tab ${subjectFilter === s.id ? 'is-active' : ''}`}
                onClick={() => setSubjectFilter(s.id)}
              >
                <span className="ns9-subtab-icon">{s.icon}</span>
                <span className="ns9-subtab-label">{s.label}</span>
                <span className="ns9-subtab-badge">{s.badge}</span>
              </button>
            ))}
          </div>

          <div className="ns9-filter-bar">
            <div className="ns9-group-pills" role="group" aria-label="Lọc theo mức độ ưu tiên">
              {[
                ['all', `Tất cả (${autoRoadmap.enrichedChapters.length})`],
                ['priority', `Cần ưu tiên (${autoRoadmap.priorityChapters.length})`],
                ['learning', `Đang luyện (${autoRoadmap.learningChapters.length})`],
                ['mastered', `Đã vững (${autoRoadmap.masteredChapters.length})`],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={groupFilter === key ? 'on' : ''}
                  onClick={() => setGroupFilter(key)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="ns9-filter-right">
              <div className="ns9-search-input">
                <IcoSearch />
                <input
                  ref={searchRef}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm chuyên đề (VD: Ester, Điện hóa, Kim loại...)"
                  aria-label="Tìm chuyên đề Hóa học"
                />
              </div>

              <div className="ns9-view-toggle" role="group" aria-label="Kiểu hiển thị">
                <button
                  type="button"
                  className={displayMode === 'cards' ? 'on' : ''}
                  onClick={() => setDisplayMode('cards')}
                >
                  Thẻ chương
                </button>
                <button
                  type="button"
                  className={displayMode === 'map' ? 'on' : ''}
                  onClick={() => setDisplayMode('map')}
                >
                  Sơ đồ cây
                </button>
              </div>
            </div>
          </div>

          {displayMode === 'map' ? (
            <KnowledgeMap chapters={filteredChapters} onOpen={openChapter} onPractice={practiceChapter} />
          ) : filteredChapters.length === 0 ? (
            <div className="ns9-empty-state">
              <b>Không tìm thấy chuyên đề phù hợp</b>
              <p>Hãy thử chuyển bộ lọc về &ldquo;Tất cả&rdquo; hoặc xóa từ khóa tìm kiếm.</p>
              <button
                type="button"
                className="ns9-btn-outline"
                onClick={() => { setGroupFilter('all'); setQuery(''); }}
              >
                Xem tất cả chuyên đề
              </button>
            </div>
          ) : (
            <div className="ns9-chapter-grid">
              {filteredChapters.map((c) => {
                const subLessons = findLessonsByChapter(c.chapter.id);
                const isExpanded = expandedChapters.has(c.chapter.id);
                const isLy = c.chapter.subjectKey === 'ly';
                const isSinh = c.chapter.subjectKey === 'sinh';
                const subjectClass = isLy ? 'sub-ly' : (isSinh ? 'sub-sinh' : 'sub-hoa');

                return (
                  <article
                    key={c.chapter.id}
                    className={`ns9-chapter-card tone-${c.studentTone} ${subjectClass}`}
                  >
                    <div className="ns9-ch-top">
                      <div className="ns9-ch-badges">
                        <span className={`ns9-ch-subject-tag ${subjectClass}`}>
                          {isLy ? <IcoZap size={12} /> : (isSinh ? <IcoDna size={12} /> : <IcoFlask size={12} />)}
                          <span>{isLy ? 'Vật lí' : (isSinh ? 'Sinh học' : 'Hóa học')}</span>
                        </span>
                        <span className="ns9-ch-index">Chương {c.orderIndex}</span>
                      </div>
                      <span className="ns9-ch-exam-tag" title="Số lượng câu hỏi trong đề thi THPT Quốc gia">
                        <IcoTarget size={12} />
                        <span>{c.questionsInExam} · {c.weightLabel}</span>
                      </span>
                    </div>

                    <h3 className="ns9-ch-title" onClick={() => openChapter(c.chapter.id)} title="Bấm để vào học chuyên sâu">
                      {formatMathAndChemSymbols(c.chapter.name)}
                    </h3>
                    <p className="ns9-ch-desc">{formatMathAndChemSymbols(c.chapter.desc)}</p>

                    {/* Lộ trình ôn tập logic 4 bước chuẩn GDPT 2018 (Zero-overflow Grid) */}
                    <div className="ns9-ch-pipeline" aria-label="Lộ trình ôn tập logic 4 bước">
                      <div className="ns9-pipe-header">
                        <span className="ns9-pipe-label">
                          <IcoZap size={12} />
                          <span>Lộ trình ôn tập 4 bước</span>
                        </span>
                        <span className="ns9-pipe-subhint">Bấm bước để học</span>
                      </div>
                      <div className="ns9-pipe-grid">
                        <button
                          type="button"
                          className="ns9-pipe-step"
                          onClick={() => openChapter(c.chapter.id)}
                          title="Bước 1: Lý thuyết & Sơ đồ tư duy (Infographics / Mindmap)"
                        >
                          <span className="ns9-pipe-num">1</span>
                          <span className="ns9-pipe-txt">Lý thuyết</span>
                        </button>
                        <button
                          type="button"
                          className="ns9-pipe-step"
                          onClick={() => practiceChapter(c.chapter.id, 'fresh')}
                          title="Bước 2: Luyện trắc nghiệm 3 cấp độ (Nhận biết – Thông hiểu – Vận dụng)"
                        >
                          <span className="ns9-pipe-num">2</span>
                          <span className="ns9-pipe-txt">Luyện tập</span>
                        </button>
                        <button
                          type="button"
                          className="ns9-pipe-step"
                          onClick={() => openChapter(c.chapter.id)}
                          title="Bước 3: Flashcards phản xạ công thức & Bẫy trắc nghiệm"
                        >
                          <span className="ns9-pipe-num">3</span>
                          <span className="ns9-pipe-txt">Flashcard</span>
                        </button>
                        <button
                          type="button"
                          className={`ns9-pipe-step ${c.wrongDue > 0 ? 'step-warning' : ''}`}
                          onClick={() => practiceChapter(c.chapter.id, c.wrongDue > 0 ? 'review' : 'fresh')}
                          title={c.wrongDue > 0 ? `Bước 4: Ôn tập ${c.wrongDue} câu hay làm sai` : 'Bước 4: Đề kiểm tra năng lực'}
                        >
                          <span className="ns9-pipe-num">{c.wrongDue > 0 ? <IcoAlertTriangle size={11} /> : '4'}</span>
                          <span className="ns9-pipe-txt">{c.wrongDue > 0 ? `Ôn sai (${c.wrongDue})` : 'Kiểm tra'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Danh sách bài học con chi tiết theo chương (Layout 2 dòng, không cắt chữ) */}
                    {subLessons.length > 0 && (
                      <div className="ns9-ch-lessons-box">
                        <div className="ns9-ch-lessons-header">
                          <span className="ns9-ch-lessons-title">
                            <IcoBookOpen size={13} />
                            <span>Bài học chi tiết ({subLessons.length} bài)</span>
                          </span>
                          {subLessons.length > 2 && (
                            <button
                              type="button"
                              className="ns9-ch-lessons-toggle"
                              onClick={() => toggleExpandLessons(c.chapter.id)}
                              aria-expanded={isExpanded}
                            >
                              {isExpanded ? 'Thu gọn ▴' : `Xem thêm (${subLessons.length}) ▾`}
                            </button>
                          )}
                        </div>
                        <div className="ns9-ch-lessons-list">
                          {(isExpanded ? subLessons : subLessons.slice(0, 2)).map((les) => (
                            <button
                              key={les.id}
                              type="button"
                              className="ns9-ch-lesson-pill"
                              onClick={() => {
                                setDedicatedLessonId(les.id);
                                if (les.subjectKey) setDedicatedSubject(les.subjectKey);
                                setDedicatedPractice(false);
                                setActiveTab('study');
                                syncChapterHash(c.chapter.id);
                              }}
                              title={`Học bài: ${les.title}`}
                            >
                              <div className="ns9-les-row-top">
                                <span className="ns9-les-idx">Bài {les.lessonIndex}</span>
                                <span className="ns9-les-title">{formatMathAndChemSymbols(les.title)}</span>
                              </div>
                              <div className="ns9-les-row-sub">
                                <span className="ns9-les-meta">
                                  <IcoClock size={11} />
                                  <span>{les.duration || '25p'} · {les.practiceCount || 8} câu</span>
                                </span>
                                {les.tag && <span className="ns9-les-tag">{les.tag}</span>}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Thanh tiến độ & Độ chính xác % (Chuẩn ELEC AI) */}
                    <div className="ns9-ch-progress-block">
                      <div className="ns9-ch-stats-row">
                        <span>
                          Tiến độ: <b>{c.completionPct}%</b> ({c.answers}/20 câu)
                        </span>
                        <span>
                          Chính xác: <b className={`acc-${c.studentTone}`}>{c.answers > 0 ? `${c.accuracyPct}%` : '—'}</b>
                        </span>
                      </div>
                      <div className="ns9-ch-bar-track" aria-hidden="true">
                        <i style={{ width: `${Math.max(c.answers > 0 ? 8 : 0, c.completionPct)}%` }} />
                      </div>
                    </div>

                    <div className="ns9-ch-footer">
                      <span className={`ns9-ch-status tone-${c.studentTone}`}>
                        {c.studentStatus}
                      </span>

                      <div className="ns9-ch-btns">
                        <button
                          type="button"
                          className="ns9-ch-btn-ghost"
                          onClick={() => openChapter(c.chapter.id)}
                          title="Xem lý thuyết, công thức & sơ đồ tư duy"
                        >
                          <IcoBookOpen size={13} />
                          <span>Lý thuyết</span>
                        </button>
                        <button
                          type="button"
                          className="ns9-ch-btn-primary"
                          onClick={() => practiceChapter(c.chapter.id, c.wrongDue > 0 ? 'review' : 'fresh')}
                        >
                          <span>{c.wrongDue > 0 ? `Ôn ${c.wrongDue} câu sai` : 'Vào học'}</span>
                          <IcoArrowRight />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ============================================================
         TAB 2: LỘ TRÌNH TỰ ĐỘNG (THÁNG → TUẦN → NGÀY)
         ============================================================ */}
      {activeTab === 'timeline' && (
        <section className="ns9-timeline-section" aria-label="Lộ trình tự động theo tuần và ngày">
          <div className="ns9-timeline-intro">
            <div>
              <h3>Lộ trình 4 tuần chinh phục mục tiêu ({autoRoadmap.targetChem10}/10 điểm Hóa)</h3>
              <p>
                Tự động phân bổ dựa trên quỹ thời gian <b>{autoRoadmap.schedule.weeklyFreeHours} giờ/tuần</b> và ưu tiên các chuyên đề xuất hiện nhiều nhất trong đề thi <b>{autoRoadmap.activeExam.name}</b>.
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

          {/* Công cụ xuất lịch Google Calendar (.ics) / Markdown */}
          <StudyPlanCard
            chapters={view.chapters}
            dueByTopic={dueByTopic}
            uid={uid}
            levelKey={levelKey}
            onOpenChapter={openChapter}
          />
        </section>
      )}

      {/* ============================================================
         TAB 3: SỔ LỖI SAI & ÔN NGẮT QUÃNG (SRS)
         ============================================================ */}
      {activeTab === 'wrong' && (
        <section className="ns9-wrong-section" aria-label="Sổ lỗi sai theo chương và thẻ ghi nhớ">
          <div className="ns9-wrong-hero">
            <div>
              <h3>Sổ lỗi sai &amp; Ôn tập chống quên</h3>
              <p>
                Hệ thống tự động gom toàn bộ các câu bạn làm sai theo từng chương Hóa học để bạn luyện lại đúng chỗ hổng kiến thức.
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
                <button
                  type="button"
                  className="ns9-btn-outline"
                  onClick={reviewCards}
                >
                  Lật {cards.due} thẻ Flashcard đến hạn
                </button>
              )}
            </div>
          </div>

          {autoRoadmap.wrongByChapter.length === 0 ? (
            <div className="ns9-empty-state">
              <b>Hiện chưa có câu trả lời sai nào tồn đọng!</b>
              <p>
                Khi bạn làm bài luyện tập ở từng chương, những câu trả lời sai sẽ tự động được lưu vào đây kèm giải thích chi tiết.
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

              {/* CHI TIẾT TỪNG CÂU HỎI ĐÃ LÀM SAI + LỜI GIẢI TỪNG BƯỚC & HỎI AI */}
              {autoRoadmap.wrongQuestionsList && autoRoadmap.wrongQuestionsList.length > 0 && (
                <div className="ns9-wrong-questions-block">
                  <div className="ns9-wq-head">
                    <h4>Chi tiết từng câu hỏi bạn đã trả lời sai ({autoRoadmap.wrongQuestionsList.length} câu)</h4>
                    <span>Xem lại đáp án đúng, giải thích bản chất hoặc nhờ AI giảng lại từng bước</span>
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
                              <IcoCheck size={13} />
                              <span>Đáp án đúng: <b>{wq.correctAnswer}</b></span>
                            </span>
                            {wq.distractors.length > 0 && (
                              <small className="ns9-wq-distractors">
                                Các phương án gây nhiễu: {wq.distractors.join(' · ')}
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
                              <IcoSparkles size={13} />
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

      {/* Nút quản trị ngân hàng câu hỏi chỉ hiển thị cho Giáo viên / Admin */}
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
        chapters={view.chapters}
        onClose={() => setDiagOpen(false)}
        onCompleted={() => {
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
