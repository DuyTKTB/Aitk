/* ============================================================
   RoadmapPage.jsx — TRANG "LỘ TRÌNH HỌC TẬP CÁ NHÂN HÓA" (CHUẨN 9STUDY)
   ------------------------------------------------------------
   Thiết kế tinh gọn, thực tế, dễ hiểu ngay từ cái nhìn đầu tiên:
   1. Thẻ "Lộ trình của em" (AspirationRoadmapHub):
      • Nguyện vọng đang chọn + 4 chỉ số (Điểm dự đoán, Mục tiêu, Tiến độ, Elo)
      • Biểu đồ đường Điểm | Elo + 1 Nút hành động chính duy nhất "Luyện tập ngay"
   2. Ba chế độ xem gọn gàng bằng Tab (không nhồi nhét quá 5 khối trên màn hình):
      • Tab 1 — "Chuyên đề Hóa học" (Thẻ chương như ảnh 11 của 9Study: thanh tiến độ,
        độ chính xác %, trọng số đề thi thật, nút "Vào học" & "Lý thuyết")
      • Tab 2 — "Kế hoạch theo tuần" (Lộ trình tự động Tháng -> Tuần -> Ngày kèm điểm kỳ vọng)
      • Tab 3 — "Sổ lỗi sai & Ôn tập" (Gom câu sai theo chương, nút "Luyện lại 10 câu sai")
   ============================================================ */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import { askAI } from '../HomePlus.jsx';
import {
  LEVEL_KEYS, DEFAULT_LEVEL, getLevel, findChapter,
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
import BankTagger from './BankTagger.jsx';
import StudyPlanCard from './StudyPlanCard.jsx';
import FlashcardSession from './FlashcardSession.jsx';
import { IconZap } from '../Icons.jsx';
import AspirationRoadmapHub from './AspirationRoadmapHub.jsx';
import DiagnosticTestModal from './DiagnosticTestModal.jsx';
import { isAdmin } from '../../lib/isAdmin.js';
import { getUserRole } from '../../lib/userRole.js';
import '../../styles/roadmap-page.css';
import '../../styles/roadmap-page-v2.css';
import '../../styles/roadmap-upgrade.css';

const LEVEL_KEY = 'cs-home-grade';

const readLevel = () => {
  try {
    const g = localStorage.getItem(LEVEL_KEY);
    return LEVEL_KEYS.indexOf(g) >= 0 ? g : DEFAULT_LEVEL;
  } catch { return DEFAULT_LEVEL; }
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

/* Bộ biểu tượng SVG gọn sắc nét */
const IcoBook = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
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

export default function RoadmapPage() {
  const { user } = useAuth();
  const uid = user?.uid || null;

  const [levelKey, setLevelKey] = useState(readLevel);
  const [activeTab, setActiveTab] = useState('subjects'); // 'subjects' | 'timeline' | 'wrong'
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
  const alive = useRef(true);

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

  /* Deep link #roadmap?chapter=... | ?tab=wrong | ?mode=diagnostic */
  useEffect(() => {
    const apply = () => {
      const p = hashParams();
      const id = p.get('chapter');
      const lv = p.get('level');
      const tabParam = p.get('tab');
      const modeParam = p.get('mode');
      if (lv && LEVEL_KEYS.indexOf(lv) >= 0) setLevelKey(lv);
      if (tabParam && ['subjects', 'timeline', 'wrong'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
      if (modeParam === 'diagnostic') {
        setDiagOpen(true);
      }
      if (!id) return;
      const hit = findChapter(id);
      if (!hit) return;
      setLevelKey(hit.level.key);
      setSheetId(hit.chapter.id);
    };
    apply();
    window.addEventListener('hashchange', apply);
    return () => window.removeEventListener('hashchange', apply);
  }, []);

  const level = useMemo(() => getLevel(levelKey), [levelKey]);

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
    if (LEVEL_KEYS.indexOf(k) < 0) return;
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
    const hit = findChapter(id);
    if (hit) setLevelKey(hit.level.key);
    setSheetMode(null);
    setSheetId(id);
    syncChapterHash(id);
  };

  const closeSheet = () => {
    setSheetId(null);
    setSheetMode(null);
    syncChapterHash(null);
  };

  const practiceChapter = (id, practiceMode = 'fresh') => {
    if (!id) return;
    openChapter(id);
    setSheetMode(practiceMode);
  };

  const reviewCards = () => {
    if (!uid) return;
    const ids = dueCards(uid, { now, limit: 10 }).map((c) => c.qid);
    if (ids.length) setDueQids(ids);
  };

  const aiStrategy = (rmData) => {
    const ctx = buildAiContext({
      levelKey, level, chapterViews: view.chapters, overview: view.overview,
      extra: { weekCount, weekGoal: data.goal },
    });
    const asp = rmData?.activeAsp;
    const nv1Line = asp
      ? `Nguyện vọng đang chọn: ${asp.school.code} - ${asp.school.name} · Ngành ${asp.major.name} (Tổ hợp ${asp.block}, Điểm mục tiêu: ${asp.targetScore}/${rmData.examScale}, Môn Hóa cần đạt: ${rmData.targetChem10}/10).`
      : 'Chưa chọn trường Nguyện vọng cụ thể.';
    askAI(
      'Đóng vai gia sư Hóa ELEC AI (xưng "mình – bạn"), dựa trên hồ sơ nguyện vọng và dữ liệu học tập dưới đây, hãy tư vấn ngắn gọn 5 bước:\n'
      + '1) Nhận xét khoảng cách điểm hiện tại so với mục tiêu Nguyện vọng.\n'
      + '2) Chỉ ra 2 chuyên đề Hóa học trọng tâm cần ưu tiên cày ngay tuần này để tăng điểm nhanh nhất.\n'
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
            <IcoBook />
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
            <IcoCalendar />
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
            <IcoAlertBook />
            <span>Sổ lỗi sai &amp; Ôn tập</span>
            {dueTotal > 0 && <small className="ns9-tab-badge warn">{dueTotal}</small>}
          </button>
        </div>

        <div className="ns9-grade-picker" role="tablist" aria-label="Chọn khối lớp Hóa học">
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
      </div>

      {/* ============================================================
         TAB 1: LỘ TRÌNH THEO CHUYÊN ĐỀ (NHƯ ẢNH 11 CỦA 9STUDY)
         ============================================================ */}
      {activeTab === 'subjects' && (
        <section className="ns9-subjects-section" aria-label="Lộ trình theo chuyên đề Hóa học">
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
              {filteredChapters.map((c) => (
                <article
                  key={c.chapter.id}
                  className={`ns9-chapter-card tone-${c.studentTone}`}
                >
                  <div className="ns9-ch-top">
                    <span className="ns9-ch-index">Chương {c.orderIndex}</span>
                    <span className="ns9-ch-exam-tag">
                      {c.weightLabel} · {c.questionsInExam}
                    </span>
                  </div>

                  <h3 className="ns9-ch-title" onClick={() => openChapter(c.chapter.id)}>
                    {c.chapter.name}
                  </h3>
                  <p className="ns9-ch-desc">{c.chapter.desc}</p>

                  {/* Thanh tiến độ & Độ chính xác % (Chuẩn ảnh 11 của 9Study) */}
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
                      >
                        Lý thuyết
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
              ))}
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
                            <span className="ns9-wq-right">✓ Đáp án đúng: <b>{wq.correctAnswer}</b></span>
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
                            <span>✦ Nhờ AI giảng từng bước</span>
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
