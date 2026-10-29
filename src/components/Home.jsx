import { useEffect, useMemo, useState } from 'react';
import AIMark from './AIMark.jsx';
import { askAI, useGreeting } from './HomePlus.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { useProgress } from '../lib/progress.js';
import { DEFAULT_LEVEL, getLevel } from '../data/roadmap.js';
import { readStore, sessionsToEvents, subscribeRoadmap } from '../lib/roadmapStore.js';
import { cardStats, subscribeCards } from '../lib/flashcardStore.js';
import { dueSummary } from '../lib/reviewQueue.js';
import { summarizeEvents, buildChapterViews } from '../lib/roadmapEngine.js';
import { getUserAspirationsState, subscribeAspirationChanges } from '../lib/aspirationService.js';
import AspirationRoadmapHub from './roadmap/AspirationRoadmapHub.jsx';
import '../styles/home-apple-bento.css';
import '../styles/home-aurora.css';
import '../styles/roadmap-upgrade.css';

/* ============================================================
   Home.jsx — DASHBOARD HỌC SINH (GIAI ĐOẠN 4 · TRỌNG TÂM LỘ TRÌNH + AI)
   ------------------------------------------------------------
   Bố cục gọn gàng, đặt LỘ TRÌNH CÁ NHÂN HÓA và TRỢ LÝ AI làm trung tâm:
   1. Banner Cá nhân + Trợ lý AI giải bài tập nhanh (kèm Chip Nguyện vọng đang chọn)
   2. Thẻ Trung tâm "Lộ trình của em":
      • 4 chỉ số trên 1 hàng: Điểm dự đoán / Mục tiêu / Tiến độ / Điểm năng lực (Elo)
      • Biểu đồ đường tương tác (Điểm | Elo, zoom, ghim mốc)
      • Nhận xét của Gia sư AI & Nút hành động chính nổi bật "Luyện tập ngay"
   3. Ba thẻ lối tắt chiến lược (chuẩn 9Study):
      • Lộ trình mục tiêu
      • Lộ trình cá nhân hóa
      • Luyện tập bằng AI
   4. Cụm Lớp học & Công cụ Hóa học truy cập nhanh.
   ============================================================ */

const SUGGEST = [
  'Giải từng bước bài toán Ester thủy phân trong kiềm',
  'Cân bằng phản ứng oxi hóa - khử Fe + HNO₃ loãng',
  'Tóm tắt trọng tâm Điện hóa học Lớp 12',
];

const ico = (d, sw = 1.9) => ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);
const IcoCamera = ico(<><path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" /><circle cx="12" cy="12.5" r="3.5" /></>);
const IcoQuiz = ico(<><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7v.5M12 17h.01" /></>);
const IcoBalance = ico(<path d="M12 3v18M3 7h18M7 7l-3 7a3 3 0 0 0 6 0L7 7zM17 7l-3 7a3 3 0 0 0 6 0l-3-7z" />);
const IcoChart = ico(<><path d="M3 3v18h18" /><path d="M7 14l3-3 3 3 5-6" /></>);
const IcoSend = ico(<path d="M12 19V5M5 12l7-7 7 7" />, 2.2);
const IcoUsers = ico(<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.4c2.2.6 3.5 2.5 3.5 5.6" /></>);
const IcoLink = ico(<><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>);
const IcoCal = ico(<><rect x="3.5" y="5" width="17" height="15.5" rx="3.5" /><path d="M8 3v4M16 3v4M3.5 10h17" /></>);
const IcoTimer = ico(<><circle cx="12" cy="13.5" r="7.5" /><path d="M12 9.5v4l2.5 1.5M9.5 3h5" /></>);
const IcoGrid = ico(<><rect x="3.5" y="3.5" width="7" height="7" rx="2" /><rect x="13.5" y="3.5" width="7" height="7" rx="2" /><rect x="3.5" y="13.5" width="7" height="7" rx="2" /><rect x="13.5" y="13.5" width="7" height="7" rx="2" /></>);
const IcoGame = ico(<><rect x="2.5" y="7" width="19" height="11" rx="5.5" /><path d="M7.5 10.5v4M5.5 12.5h4M15.5 11.5h.01M18 13.5h.01" /></>);
const IcoSpark = ico(<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z" />);
const IcoArrow = ico(<path d="M7 17L17 7M9 7h8v8" />, 2.2);
const IcoFormula = ico(<><rect x="4" y="3.5" width="16" height="17" rx="3.5" /><path d="M8 8h8M8 12.5h2M13 12.5h3M8 16.5h2M13 16.5h3" /></>);
const IcoTarget = ico(<><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" /></>);
const IcoRoute = ico(<><circle cx="6" cy="19" r="3" /><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" /><circle cx="18" cy="5" r="3" /></>);

function goAI(payload) {
  try {
    localStorage.setItem('cs-ai-pending', JSON.stringify({ ...payload, t: Date.now() }));
  } catch { /* */ }
  location.hash = 'ai';
}

/* ============================================================
   1. BANNER CÁ NHÂN + TRỢ LÝ AI HỌC TẬP
   ============================================================ */
function PersonalAiHero({ hello, name, activeAsp, activeExam }) {
  const [val, setVal] = useState('');
  const submit = (e) => {
    e?.preventDefault();
    if (!val.trim()) return;
    goAI({ text: val.trim() });
  };
  const today = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <article className="bento-card bento-hero ns9-home-hero">
      <div className="bento-hero-orbs" aria-hidden="true"><i /><i /><i /></div>

      <div className="ns9-home-hero-top">
        <header className="bento-hero-header">
          <div className="bento-ai-avatar">
            <AIMark size={42} animate title="ELEC AI Tutor" />
          </div>
          <div className="bento-hero-title">
            <p className="bento-date">{today}</p>
            <h1>{hello}, {name}!</h1>
          </div>
        </header>

        {/* Chip Trường + Ngành Nguyện vọng đang chọn */}
        <a
          href="#roadmap"
          className="ns9-home-wish-chip"
          title="Xem chi tiết lộ trình chinh phục nguyện vọng"
        >
          <span className="ns9-wish-badge">
            {activeAsp ? `NV${activeAsp.priority}` : activeExam?.name || 'THPTQG'}
          </span>
          <div className="ns9-home-wish-txt">
            {activeAsp ? (
              <>
                <b>{activeAsp?.school?.code || 'ĐH'} · {activeAsp?.school?.name || 'Trường Đại học'}</b>
                <small>Ngành {(activeAsp?.major?.name || 'Ngành xét tuyển').replace(/^ngành\s+/i, '')} · Tổ hợp {activeAsp?.block || 'A00'} · Mục tiêu {activeAsp?.targetScore ?? 24}đ</small>
              </>
            ) : (
              <>
                <b>Chưa chọn trường Nguyện vọng 1</b>
                <small>Bấm để chọn trường &amp; nhận lộ trình Hóa cá nhân hóa</small>
              </>
            )}
          </div>
          <IcoArrow size={15} />
        </a>
      </div>

      {/* Khung hỏi nhanh Gia sư AI ngay tại Trang chủ */}
      <form className="bento-composer ns9-home-composer" onSubmit={submit}>
        <label htmlFor="bento-ask-input" className="sr-only">Hỏi Gia sư ELEC AI</label>
        <textarea
          id="bento-ask-input"
          rows={2}
          value={val}
          placeholder="Hỏi Gia sư ELEC AI: Dán đề bài Hóa để giải từng bước, cân bằng phương trình, hoặc nhờ AI tạo đề ôn tập theo chương yếu…"
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) submit(e);
          }}
        />
        <div className="bento-composer-footer">
          <div className="bento-chips-list">
            <button
              type="button"
              className="bento-chip"
              onClick={() => goAI({ action: 'capture' })}
            >
              <IcoCamera size={14} /> Chụp ảnh đề bài
            </button>
            {SUGGEST.map((s) => (
              <button key={s} type="button" className="bento-chip" onClick={() => setVal(s)}>
                {s}
              </button>
            ))}
          </div>
          <button type="submit" className="bento-send-btn" disabled={!val.trim()} aria-label="Gửi câu hỏi cho ELECAI">
            <IcoSend size={18} />
          </button>
        </div>
      </form>
    </article>
  );
}

/* ============================================================
   3. BA THẺ LỐI TẮT CHIẾN LƯỢC (CHUẨN 9STUDY GIAI ĐOẠN 4)
   ============================================================ */
function StrategicShortcuts({ activeAsp, dueTotal }) {
  const cards = [
    {
      href: '#roadmap',
      badge: activeAsp ? `Mục tiêu ${activeAsp.school.code}` : 'Trọng tâm thi ĐH',
      title: 'Lộ trình mục tiêu',
      desc: activeAsp
        ? `Chinh phục từng chuyên đề Hóa bám sát mốc điểm ${activeAsp.targetScore} của ${activeAsp.school.name}.`
        : 'Hệ thống 22 chuyên đề Hóa THPT kèm trọng số câu hỏi trong đề thi thật và bài luyện 3 cấp độ.',
      cta: 'Vào lộ trình chuyên đề',
      Icon: IcoTarget,
      tone: 'blue',
    },
    {
      href: dueTotal > 0 ? '#notebook' : '#roadmap?tab=timeline',
      badge: dueTotal > 0 ? `${dueTotal} câu cần sửa sai` : 'Tháng → Tuần → Ngày',
      title: 'Lộ trình cá nhân hóa',
      desc: dueTotal > 0
        ? `Ưu tiên xử lý ${dueTotal} câu bạn từng làm sai trong Sổ tay lỗi và bám sát kế hoạch 4 tuần tới.`
        : 'Kế hoạch học tập tự động theo quỹ thời gian rảnh mỗi tuần, tự tăng tốc ở các chủ đề đang yếu.',
      cta: dueTotal > 0 ? 'Mở Sổ tay lỗi sai' : 'Xem kế hoạch từng tuần',
      Icon: IcoRoute,
      tone: 'purple',
    },
    {
      href: '#ai',
      badge: 'Gia sư 24/7',
      title: 'Luyện tập bằng AI',
      desc: 'Giải thích bài tập từng bước (xưng mình – bạn), chấm bài tự luận bằng ảnh chụp và sinh câu hỏi theo lỗ hổng.',
      cta: 'Mở Trợ lý AI',
      Icon: IcoSpark,
      tone: 'teal',
    },
  ];

  return (
    <section className="ns9-shortcuts-grid" aria-label="Ba lối tắt lộ trình và AI">
      {cards.map((c) => (
        <a key={c.title} href={c.href} className={`ns9-shortcut-card tone-${c.tone}`}>
          <div className="ns9-sc-top">
            <span className="ns9-sc-icon">
              <c.Icon size={22} />
            </span>
            <span className="ns9-sc-badge">{c.badge}</span>
          </div>
          <h3>{c.title}</h3>
          <p>{c.desc}</p>
          <span className="ns9-sc-cta">
            <span>{c.cta}</span>
            <IcoArrow size={15} />
          </span>
        </a>
      ))}
    </section>
  );
}

/* ============================================================
   4. THANH CÔNG CỤ HÓA HỌC & LỚP HỌC GỌN GÀNG
   ============================================================ */
const QUICK_TOOLS = [
  { href: '#quiz', Icon: IcoQuiz, label: 'Phòng luyện tập', tone: 'orange' },
  { href: '#table', Icon: IcoGrid, label: 'Bảng tuần hoàn', tone: 'teal' },
  { href: '#balance', Icon: IcoBalance, label: 'Cân bằng PTHH', tone: 'green' },
  { href: '#formulas', Icon: IcoFormula, label: 'Công thức nhanh', tone: 'blue' },
  { href: '#schedule', Icon: IcoCal, label: 'Thời khóa biểu', tone: 'purple' },
  { href: '#pomodoro', Icon: IcoTimer, label: 'Pomodoro 25p', tone: 'pink' },
  { href: '#games', Icon: IcoGame, label: 'Trò chơi Hóa', tone: 'yellow' },
  { href: '#stats', Icon: IcoChart, label: 'Thống kê', tone: 'indigo' },
];

function parseExamToken(raw) {
  const m = /exam\/([^\s?#/]+)/i.exec(raw || '');
  return m ? decodeURIComponent(m[1]) : null;
}

function ClassroomAndToolsBar() {
  const [val, setVal] = useState('');
  const [err, setErr] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const t = parseExamToken(val);
    if (!t) {
      setErr('Chưa nhận ra link đề thi hợp lệ.');
      return;
    }
    setErr('');
    location.hash = 'exam/' + t;
  };

  return (
    <section className="ns9-home-bottom-grid" aria-label="Công cụ Hóa học và Lớp học">
      <div className="ns9-tools-card">
        <div className="ns9-tools-head">
          <b>Công cụ bổ trợ môn Hóa</b>
          <a href="#tools">Xem tất cả công cụ ›</a>
        </div>
        <nav className="bento-quick" aria-label="Truy cập nhanh">
          <button type="button" className="bento-qbtn tone-gray" onClick={() => goAI({ action: 'capture' })}>
            <i><IcoCamera size={16} /></i>Chụp đề giải ngay
          </button>
          {QUICK_TOOLS.map(({ href, Icon, label, tone }) => (
            <a key={label} href={href} className={`bento-qbtn tone-${tone}`}>
              <i><Icon size={16} /></i>{label}
            </a>
          ))}
        </nav>
      </div>

      <article className="bento-card bento-classroom tone-orange ns9-classroom-compact">
        <div className="bento-widget-title">
          <span className="bento-wt">
            <i className="bento-wt-ico"><IcoUsers size={16} /></i>
            Phòng thi &amp; Lớp học
          </span>
          <a href="#my-classes">Lớp của tôi</a>
        </div>
        <p className="bento-note">Dán đường link đề thi giáo viên giao để vào làm bài ngay.</p>
        <form onSubmit={submit}>
          <div className="bento-input-pill">
            <IcoLink size={18} />
            <input
              type="text"
              inputMode="url"
              autoComplete="off"
              value={val}
              placeholder="Dán link đề cô giáo gửi..."
              onChange={(e) => { setVal(e.target.value); if (err) setErr(''); }}
            />
            <button type="submit" disabled={!val.trim()}>Vào thi</button>
          </div>
          {err && <p className="bento-err">{err}</p>}
        </form>
      </article>
    </section>
  );
}

/* ============================================================
   TRANG CHỦ HỌC SINH (ĐÁNH TRỌNG TÂM LỘ TRÌNH + AI)
   ============================================================ */
export default function Home() {
  const { hello, name } = useGreeting();
  const { user } = useAuth();
  const uid = user?.uid || null;
  useProgress(); // giữ đồng bộ tiến trình chung

  const [tick, setTick] = useState(0);

  useEffect(() => subscribeRoadmap(() => setTick((n) => n + 1)), []);
  useEffect(() => subscribeCards(() => setTick((n) => n + 1)), []);
  useEffect(() => subscribeAspirationChanges(() => setTick((n) => n + 1)), []);

  const gradeKey = useMemo(() => {
    try {
      return localStorage.getItem('cs-home-grade') || DEFAULT_LEVEL;
    } catch {
      return DEFAULT_LEVEL;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  const level = useMemo(() => getLevel(gradeKey), [gradeKey]);

  const roadmapSnapshot = useMemo(() => {
    const store = uid ? readStore(uid) : { sessions: [] };
    const events = sessionsToEvents(store.sessions || []);
    const summaries = summarizeEvents(events);
    const view = buildChapterViews(level, summaries, Date.now());
    const due = uid ? dueSummary(uid, events) : { total: 0, byTopic: {} };
    const cards = uid ? cardStats(uid, Date.now()) : { due: 0 };
    const aspState = getUserAspirationsState(uid);
    return {
      events,
      view,
      dueTotal: due.total,
      cardsDue: cards.due,
      activeAsp: aspState.activeAspiration || aspState.aspirations[0] || null,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, level, tick]);

  const handleOpenChapterFromHome = (chapterId) => {
    if (!chapterId) {
      window.location.hash = 'roadmap';
      return;
    }
    window.location.hash = `roadmap?chapter=${encodeURIComponent(chapterId)}`;
  };

  const handleAiStrategyFromHome = (rmData) => {
    const asp = rmData?.activeAsp;
    const targetLine = asp
      ? `Nguyện vọng 1: ${asp?.school?.code || 'ĐH'} - ${asp?.school?.name || 'Trường Đại học'} (${asp?.major?.name || 'Ngành xét tuyển'}), Điểm mục tiêu ${asp?.targetScore ?? 24}/${rmData.examScale} (Môn Hóa cần đạt ${rmData.targetChem10}/10).`
      : 'Mục tiêu: Chinh phục kỳ thi THPT Quốc gia môn Hóa học.';
    askAI(
      `Đóng vai Gia sư Hóa ELEC AI (xưng "mình – bạn"), hãy lập kế hoạch học tập tuần này giúp mình bám sát mục tiêu:\n${targetLine}\n`
      + `Điểm Hóa dự đoán hiện tại: ${rmData?.hasEvidence ? rmData.predictedChem10 : 'Chưa đo'}/10 · Tiến độ: ${rmData?.paceStatus}.`,
      gradeKey,
    );
  };

  return (
    <div className="db-bento-wrap ns9-home-wrap">
      <div className="db-bento-ambient" aria-hidden="true" />

      <div className="ns9-home-container">
        {/* 1. BANNER CÁ NHÂN + TRỢ LÝ AI NỔI BẬT */}
        <PersonalAiHero
          hello={hello}
          name={name}
          activeAsp={roadmapSnapshot.activeAsp}
        />

        {/* 2. THẺ TRUNG TÂM "LỘ TRÌNH CỦA EM" (4 CHỈ SỐ + BIỂU ĐỒ ĐIỂM/ELO + CTA CHÍNH) */}
        <AspirationRoadmapHub
          uid={uid}
          overview={roadmapSnapshot.view.overview}
          chapters={roadmapSnapshot.view.chapters}
          dueTotal={roadmapSnapshot.dueTotal}
          cardsDue={roadmapSnapshot.cardsDue}
          events={roadmapSnapshot.events}
          hideTopBanner
          onOpenChapter={handleOpenChapterFromHome}
          onPracticeChapter={handleOpenChapterFromHome}
          onReviewChapter={handleOpenChapterFromHome}
          onAiStrategy={handleAiStrategyFromHome}
          onOpenDiagnostic={() => { window.location.hash = 'roadmap?mode=diagnostic'; }}
        />

        {/* 3. BA THẺ LỐI TẮT CHIẾN LƯỢC: LỘ TRÌNH MỤC TIÊU · LỘ TRÌNH CÁ NHÂN HÓA · LUYỆN TẬP BẰNG AI */}
        <StrategicShortcuts
          activeAsp={roadmapSnapshot.activeAsp}
          dueTotal={roadmapSnapshot.dueTotal}
        />

        {/* 4. CỤM LỚP HỌC & CÔNG CỤ BỔ TRỢ */}
        <ClassroomAndToolsBar />
      </div>
    </div>
  );
}
