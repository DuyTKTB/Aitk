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
   Home.jsx — TRANG CHỦ HỌC SINH THPT CHUẨN KHOA HỌC & HIỆN ĐẠI
   (ELEC AI - Hệ thống Luyện thi Hóa học Quốc Gia)
   ------------------------------------------------------------
   Bố cục Bento Grid 6 tầng khoa học theo phương pháp sư phạm:
   1. Hero Command Center: Lời chào cá nhân, đếm ngược THPTQG 2026/2027,
      thẻ mục tiêu Nguyện vọng 1 & Trợ lý Gia sư AI giải đề tức thì (Camera OCR).
   2. Hub Lộ trình & Biểu đồ Năng lực (AspirationRoadmapHub):
      4 chỉ số vàng (Điểm dự đoán / Mục tiêu / Tiến độ / Elo), biểu đồ tương tác SVG.
   3. 4 Trụ Cột Chiến Lược (Strategic Pillars):
      • Phòng thi ảo THPTQG 2027 (Độc quyền chuẩn ma trận)
      • Lộ trình 22 chuyên đề trọng tâm
      • Sổ tay lỗi sai & Spaced Repetition (SRS)
      • Gia sư Hóa ELEC AI 24/7
   4. Ma trận Công cụ Hóa học Chuyên sâu (Chemistry Study Matrix):
      3 phân hệ: Lý thuyết & Tra cứu | Tính toán & Cân bằng | Tối ưu & Rèn luyện.
   5. Góc Khám Phá & Micro-Learning Mỗi Ngày (Daily Discovery):
      • Nguyên tố hôm nay (Z, ký hiệu, cấu hình e, ứng dụng đời sống & đề thi)
      • Thử thách Hóa học 10 giây (Trắc nghiệm nhanh, feedback tức thì, streak)
   6. Phòng Thi Lớp Học & Nhập Mã Thi Nhanh (Classroom Quick Join).
   ============================================================ */

/* ── Bộ Icon SVG Chuẩn Apple Bento ── */
const ico = (d, sw = 1.9) => ({ size = 20, className = '' }) => (
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
    {d}
  </svg>
);

const IcoCamera = ico(<><path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" /><circle cx="12" cy="12.5" r="3.5" /></>);
const IcoSend = ico(<path d="M12 19V5M5 12l7-7 7 7" />, 2.2);
const IcoArrow = ico(<path d="M7 17L17 7M9 7h8v8" />, 2.2);
const IcoSpark = ico(<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z" />);
const IcoTarget = ico(<><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" /></>);
const IcoRoute = ico(<><circle cx="6" cy="19" r="3" /><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" /><circle cx="18" cy="5" r="3" /></>);
const IcoExam = ico(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></>);
const IcoNotebook = ico(<><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /><path d="M8 7h8" /><path d="M8 11h6" /></>);
const IcoTable = ico(<><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M3 15h18" /><path d="M9 3v18" /><path d="M15 3v18" /></>);
const IcoBalance = ico(<path d="M12 3v18M3 7h18M7 7l-3 7a3 3 0 0 0 6 0L7 7zM17 7l-3 7a3 3 0 0 0 6 0l-3-7z" />);
const IcoFormula = ico(<><rect x="4" y="3.5" width="16" height="17" rx="3.5" /><path d="M8 8h8M8 12.5h2M13 12.5h3M8 16.5h2M13 16.5h3" /></>);
const IcoFlask = ico(<path d="M10 2v7.31L4.69 17.5A2 2 0 0 0 6.36 21h11.28a2 2 0 0 0 1.67-3.5L14 9.31V2h-4zM8.5 2h7" />);
const IcoCalc = ico(<><rect x="4" y="2" width="16" height="20" rx="3" /><line x1="8" y1="6" x2="16" y2="6" /><line x1="16" y1="14" x2="16" y2="18" /><path d="M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M8 18h.01M12 18h.01" /></>);
const IcoGrade = ico(<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>);
const IcoTimer = ico(<><circle cx="12" cy="13.5" r="7.5" /><path d="M12 9.5v4l2.5 1.5M9.5 3h5" /></>);
const IcoCal = ico(<><rect x="3.5" y="5" width="17" height="15.5" rx="3.5" /><path d="M8 3v4M16 3v4M3.5 10h17" /></>);
const IcoGame = ico(<><rect x="2.5" y="7" width="19" height="11" rx="5.5" /><path d="M7.5 10.5v4M5.5 12.5h4M15.5 11.5h.01M18 13.5h.01" /></>);
const IcoTrophy = ico(<><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.45 1-1 1H7" /><path d="M14 14.66V17c0 .55.45 1 1 1h2" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2z" /></>);
const IcoUsers = ico(<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.4c2.2.6 3.5 2.5 3.5 5.6" /></>);
const IcoLink = ico(<><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>);
const IcoCheck = ico(<polyline points="20 6 9 17 4 12" />, 2.4);
const IcoX = ico(<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>, 2.4);
const IcoRefresh = ico(<><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></>);
const IcoHourglass = ico(<><path d="M5 22h14" /><path d="M5 2h14" /><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" /><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" /></>);

/* ── Điều hướng nhanh sang AI ── */
function goAI(payload) {
  try {
    localStorage.setItem('cs-ai-pending', JSON.stringify({ ...payload, t: Date.now() }));
  } catch { /* */ }
  window.location.hash = 'ai';
}

/* ── Tính toán ngày thi THPT Quốc Gia (Tự động 2026 / 2027) ── */
function getExamCountdown() {
  const now = new Date();
  const year = now.getFullYear();
  let examDate = new Date(year, 5, 26, 7, 30, 0); // Ngày 26/06
  if (now.getTime() > examDate.getTime()) {
    examDate = new Date(year + 1, 5, 26, 7, 30, 0);
  }
  const diffMs = examDate.getTime() - now.getTime();
  const days = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  return {
    days,
    targetYear: examDate.getFullYear(),
    dateStr: `26/06/${examDate.getFullYear()}`,
  };
}

/* ── Câu hỏi gợi ý học sinh thường gặp trong đề thi THPTQG ── */
const PROMPT_SUGGESTIONS = [
  'Giải từng bước bài toán Ester thủy phân trong kiềm',
  'Cân bằng phản ứng Fe + HNO₃ loãng sinh hỗn hợp NO, N₂O',
  'Tóm tắt trọng tâm Điện hóa học & Pin Galvani Lớp 12',
  'Phương pháp giải bài toán Este đa chức nâng cao 9+',
];

/* ============================================================
   1. HERO COMMAND CENTER (LỜI CHÀO, ĐẾM NGƯỢC, NV1 & AI COMPOSER)
   ============================================================ */
function PersonalAiHero({ hello, name, activeAsp }) {
  const [val, setVal] = useState('');
  const countdown = useMemo(() => getExamCountdown(), []);

  const submit = (e) => {
    e?.preventDefault();
    if (!val.trim()) return;
    goAI({ text: val.trim() });
  };

  const todayStr = useMemo(() => {
    return new Date().toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, []);

  return (
    <article className="bento-card bento-hero ns9-home-hero">
      <div className="bento-hero-orbs" aria-hidden="true"><i /><i /><i /></div>

      <div className="ns9-home-hero-top">
        <header className="bento-hero-header">
          <div className="bento-ai-avatar">
            <AIMark size={44} animate title="ELEC AI Chemistry Tutor" />
          </div>
          <div className="bento-hero-title">
            <div className="ns9-hero-meta-row">
              <span className="bento-date">{todayStr}</span>
              <a
                href="#virtual-exams"
                className="ns9-countdown-pill"
                title={`Kỳ thi THPT Quốc Gia ${countdown.targetYear} diễn ra vào ${countdown.dateStr}. Bấm để vào phòng thi thử ngay!`}
              >
                <span className="ns9-countdown-dot" />
                <IcoHourglass size={13} />
                <span>Kỳ thi THPTQG {countdown.targetYear}: <b>Còn {countdown.days} ngày</b></span>
                <IcoArrow size={12} />
              </a>
            </div>
            <h1>{hello}, {name}!</h1>
          </div>
        </header>

        {/* Thẻ chip Nguyện vọng 1 đang chinh phục */}
        <a
          href="#roadmap"
          className="ns9-home-wish-chip"
          title="Xem chi tiết lộ trình và ma trận kiến thức cho nguyện vọng này"
        >
          <span className="ns9-wish-badge">
            {activeAsp ? `NV${activeAsp.priority || 1}` : 'THPTQG'}
          </span>
          <div className="ns9-home-wish-txt">
            {activeAsp ? (
              <>
                <b>{activeAsp?.school?.code || 'ĐH'} · {activeAsp?.school?.name || 'Trường Đại học mục tiêu'}</b>
                <small>
                  {(activeAsp?.major?.name || 'Ngành xét tuyển').replace(/^ngành\s+/i, '')} · Khối {activeAsp?.block || 'A00'} · Mục tiêu {activeAsp?.targetScore ?? 24}đ
                </small>
              </>
            ) : (
              <>
                <b>Chưa đặt mục tiêu Nguyện vọng 1</b>
                <small>Bấm vào đây để chọn trường ĐH &amp; nhận lộ trình điểm số tối ưu</small>
              </>
            )}
          </div>
          <IcoArrow size={15} />
        </a>
      </div>

      {/* Khung hỏi nhanh Gia sư AI với Camera OCR và Smart Prompt */}
      <form className="bento-composer ns9-home-composer" onSubmit={submit}>
        <label htmlFor="home-ai-input" className="sr-only">Hỏi Gia sư ELEC AI</label>
        <textarea
          id="home-ai-input"
          rows={2}
          value={val}
          placeholder="Hỏi Gia sư ELEC AI: Dán đề bài Hóa để giải từng bước, cân bằng phản ứng khó, hoặc nhờ AI phân tích bẫy trắc nghiệm..."
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
              title="Mở camera hoặc tải ảnh đề bài để AI nhận diện OCR và giải từng bước"
            >
              <IcoCamera size={14} /> Chụp ảnh đề bài (OCR)
            </button>
            {PROMPT_SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                className="bento-chip"
                onClick={() => setVal(s)}
              >
                {s}
              </button>
            ))}
          </div>
          <button
            type="submit"
            className="bento-send-btn"
            disabled={!val.trim()}
            aria-label="Gửi câu hỏi cho ELEC AI"
          >
            <IcoSend size={18} />
          </button>
        </div>
      </form>
    </article>
  );
}

/* ============================================================
   2. BỐN TRỤ CỘT CHIẾN LƯỢC CHINH PHỤC THPT QUỐC GIA (4-PILLARS)
   ============================================================ */
function StrategicPillars({ activeAsp, dueTotal }) {
  const cards = [
    {
      href: '#virtual-exams',
      badge: 'Độc quyền 2027 · Chuẩn Bộ',
      title: 'Phòng thi ảo THPTQG 2027',
      desc: 'Bộ đề thi thử độc quyền 28 câu chuẩn ma trận 2027, bấm giờ thi thật, AI giám sát & chấm OMR tức thì.',
      cta: 'Vào phòng thi ảo',
      Icon: IcoExam,
      tone: 'orange',
    },
    {
      href: '#roadmap',
      badge: activeAsp ? `Mục tiêu ${activeAsp.school.code}` : '22 Chuyên đề trọng tâm',
      title: 'Lộ trình kiến thức mục tiêu',
      desc: activeAsp
        ? `Chinh phục từng chuyên đề Hóa bám sát mốc điểm ${activeAsp.targetScore}đ của ${activeAsp.school.name}.`
        : 'Hệ thống 22 chuyên đề Hóa THPT bám sát cấu trúc đề thi thật kèm bài luyện 3 cấp độ.',
      cta: 'Vào lộ trình chuyên đề',
      Icon: IcoTarget,
      tone: 'blue',
    },
    {
      href: dueTotal > 0 ? '#notebook' : '#roadmap?tab=timeline',
      badge: dueTotal > 0 ? `${dueTotal} câu cần sửa sai` : 'Spaced Repetition SRS',
      title: 'Sổ tay lỗi sai thông minh',
      desc: dueTotal > 0
        ? `Ưu tiên xử lý ${dueTotal} câu bạn từng làm sai trong Sổ tay lỗi để không bao giờ mất điểm oan.`
        : 'Thuật toán lặp lại ngắt quãng tự động lưu các câu làm sai và nhắc ôn đúng thời điểm.',
      cta: dueTotal > 0 ? 'Mở Sổ tay lỗi sai' : 'Xem kế hoạch ôn tập',
      Icon: IcoNotebook,
      tone: 'purple',
    },
    {
      href: '#ai',
      badge: 'Gia sư AI 1-on-1',
      title: 'Luyện tập cùng ELEC AI',
      desc: 'Giải thích bài tập từng bước (xưng mình – bạn), bắt bẫy trắc nghiệm và sinh đề ôn theo chuyên đề yếu.',
      cta: 'Mở Trợ lý AI',
      Icon: IcoSpark,
      tone: 'teal',
    },
  ];

  return (
    <section className="ns9-shortcuts-grid four-cols" aria-label="Bốn trụ cột chiến lược luyện thi Hóa học">
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
            <IcoArrow size={14} />
          </span>
        </a>
      ))}
    </section>
  );
}

/* ============================================================
   3. MA TRẬN HỌC TẬP & THỰC HÀNH HÓA HỌC (CHEMISTRY STUDY MATRIX)
   ============================================================ */
const MATRIX_GROUPS = [
  {
    id: 'theory',
    tag: 'Phân hệ 01',
    tone: 'teal',
    title: 'Lý thuyết & Tra cứu',
    items: [
      {
        href: '#table',
        Icon: IcoTable,
        title: 'Bảng tuần hoàn 118 nguyên tố',
        desc: 'Tra cứu cấu hình e, độ âm điện, chu kỳ & nhóm',
        tone: 'teal',
      },
      {
        href: '#formulas',
        Icon: IcoFormula,
        title: 'Thư viện công thức nhanh',
        desc: 'Công thức giải nhanh este, điện phân, pH',
        tone: 'blue',
      },
      {
        href: '#analyze',
        Icon: IcoFlask,
        title: 'Phân tích hợp chất & Nhận biết',
        desc: 'Nhận diện chất, thuốc thử đặc trưng, kết tủa',
        tone: 'purple',
      },
    ],
  },
  {
    id: 'calc',
    tag: 'Phân hệ 02',
    tone: 'blue',
    title: 'Tính toán & Cân bằng tự động',
    items: [
      {
        href: '#balance',
        Icon: IcoBalance,
        title: 'Cân bằng PTHH thông minh',
        desc: 'Cân bằng phản ứng Oxi hóa - Khử bằng đại số',
        tone: 'blue',
      },
      {
        href: '#formulas',
        Icon: IcoCalc,
        title: 'Máy tính Hóa học & Nồng độ',
        desc: 'Tính mol, CM, C%, khối lượng mol & pH',
        tone: 'teal',
      },
      {
        href: '#grade',
        Icon: IcoGrade,
        title: 'Dự toán điểm xét tuyển & GPA',
        desc: 'Tính điểm khối A00, B00, D07 vào các trường ĐH',
        tone: 'orange',
      },
    ],
  },
  {
    id: 'utils',
    tag: 'Phân hệ 03',
    tone: 'purple',
    title: 'Tối ưu & Rèn luyện',
    items: [
      {
        href: '#pomodoro',
        Icon: IcoTimer,
        title: 'Clock Hub & Pomodoro 25p',
        desc: 'Rèn luyện tập trung cao độ, bấm giờ giải đề',
        tone: 'purple',
      },
      {
        href: '#schedule',
        Icon: IcoCal,
        title: 'Thời khóa biểu học tập',
        desc: 'Lập lịch tự động cân đối thời gian các môn',
        tone: 'blue',
      },
      {
        href: '#games',
        Icon: IcoGame,
        title: 'Trò chơi Hóa học (7 game)',
        desc: 'Rèn phản xạ nhớ nguyên tố & phản ứng vui vẻ',
        tone: 'orange',
      },
      {
        href: '#leaderboard',
        Icon: IcoTrophy,
        title: 'Bảng vàng thành tích',
        desc: 'Vinh danh chuỗi ngày học chăm & điểm thi thử',
        tone: 'yellow',
      },
    ],
  },
];

function ChemistryStudyMatrix() {
  return (
    <section className="ns9-matrix-wrap" aria-label="Ma trận Công cụ Hóa học THPT">
      <div className="ns9-matrix-header">
        <div className="ns9-matrix-title-wrap">
          <span className="ns9-matrix-badge">Bộ công cụ chuyên sâu</span>
          <h2>Ma trận học tập &amp; Thực hành Hóa học</h2>
          <p>
            Phân hệ công cụ chuyên biệt hỗ trợ từ tra cứu cấu tạo chất, cân bằng phản ứng đến rèn luyện tư duy thi ĐH.
          </p>
        </div>
        <a href="#tools" className="ns9-matrix-all-btn">
          <span>Tất cả công cụ</span>
          <IcoArrow size={14} />
        </a>
      </div>

      <div className="ns9-matrix-grid">
        {MATRIX_GROUPS.map((group) => (
          <div key={group.id} className={`ns9-matrix-col col-${group.id}`}>
            <div className="ns9-col-head">
              <span className={`ns9-col-tag tone-${group.tone}`}>{group.tag}</span>
              <h3>{group.title}</h3>
            </div>
            <div className="ns9-col-cards">
              {group.items.map((item) => (
                <a
                  key={item.title}
                  href={item.href}
                  className="ns9-matrix-item"
                  style={{ '--t': item.tone === 'blue' ? '10, 132, 255' : item.tone === 'purple' ? '175, 82, 222' : item.tone === 'orange' ? '255, 149, 0' : '48, 190, 85' }}
                >
                  <span className="ns9-matrix-icon">
                    <item.Icon size={18} />
                  </span>
                  <div className="ns9-matrix-info">
                    <b>{item.title}</b>
                    <small>{item.desc}</small>
                  </div>
                  <span className="ns9-matrix-arr">
                    <IcoArrow size={14} />
                  </span>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============================================================
   4. GÓC KHÁM PHÁ & MICRO-LEARNING MỖI NGÀY (DAILY DISCOVERY)
   ============================================================ */
const ELEMENTS_BANK = [
  { z: 1, s: 'H', name: 'Hydrogen', m: '1,008', cfg: '1s¹', cat: 'Phi kim', fact: 'Nguyên tố nhẹ nhất vũ trụ. H₂ là nhiên liệu sạch tương lai khi cháy chỉ tạo ra H₂O.' },
  { z: 6, s: 'C', name: 'Carbon', m: '12,011', cfg: '[He] 2s² 2p²', cat: 'Phi kim', fact: 'Cốt lõi của toàn bộ Hóa học Hữu cơ. Kim cương và than chì là hai dạng thù hình nổi tiếng.' },
  { z: 7, s: 'N', name: 'Nitrogen', m: '14,007', cfg: '[He] 2s² 2p³', cat: 'Phi kim', fact: 'Chiếm 78% khí quyển. Liên kết ba N≡N rất bền nên ở nhiệt độ thường N₂ khá trơ về mặt hóa học.' },
  { z: 8, s: 'O', name: 'Oxygen', m: '15,999', cfg: '[He] 2s² 2p⁴', cat: 'Phi kim', fact: 'Duy trì sự sống và sự cháy. Ozon (O₃) ở tầng bình lưu bảo vệ Trái Đất khỏi tia cực tím UV.' },
  { z: 11, s: 'Na', name: 'Sodium', m: '22,990', cfg: '[Ne] 3s¹', cat: 'Kim loại kiềm', fact: 'Phản ứng mãnh liệt với nước tạo dung dịch NaOH và giải phóng khí H₂. Bảo quản ngâm trong dầu hỏa.' },
  { z: 12, s: 'Mg', name: 'Magnesium', m: '24,305', cfg: '[Ne] 3s²', cat: 'Kim loại kiềm thổ', fact: 'Cháy với ngọn lửa trắng chói lòa và là nguyên tử kim loại trung tâm trong phân tử diệp lục.' },
  { z: 13, s: 'Al', name: 'Aluminium', m: '26,982', cfg: '[Ne] 3s² 3p¹', cat: 'Kim loại sau chuyển tiếp', fact: 'Kim loại phổ biến nhất vỏ Trái Đất; tự sinh màng oxit Al₂O₃ cực mỏng và bền bảo vệ bề mặt.' },
  { z: 26, s: 'Fe', name: 'Iron', m: '55,845', cfg: '[Ar] 3d⁶ 4s²', cat: 'Kim loại chuyển tiếp', fact: 'Thành phần cốt lõi của hemoglobin vận chuyển oxy trong máu. Có 2 mức oxi hóa phổ biến +2 và +3.' },
  { z: 29, s: 'Cu', name: 'Copper', m: '63,546', cfg: '[Ar] 3d¹⁰ 4s¹', cat: 'Kim loại chuyển tiếp', fact: 'Dẫn điện xuất sắc chỉ sau bạc (Ag). Dung dịch muối Cu²⁺ thường mang màu xanh lam đặc trưng.' },
  { z: 47, s: 'Ag', name: 'Silver', m: '107,87', cfg: '[Kr] 4d¹⁰ 5s¹', cat: 'Kim loại chuyển tiếp', fact: 'Dẫn điện và dẫn nhiệt tốt nhất trong tất cả các kim loại. Phản ứng tráng bạc dùng để nhận biết andehit.' },
];

const DAILY_QUIZ_BANK = [
  {
    q: 'Khi thủy phân phenyl axetat (CH₃COOC₆H₅) trong dung dịch NaOH dư đun nóng, tỉ lệ mol este : NaOH phản ứng là bao nhiêu?',
    o: ['1 : 1', '1 : 2', '1 : 3', '2 : 1'],
    a: 1,
    ex: 'Phenyl axetat là este của phenol. Phản ứng tạo 2 muối: CH₃COONa + C₆H₅ONa + H₂O nên tỉ lệ mol phản ứng là 1 : 2.',
  },
  {
    q: 'Kim loại nào sau đây có tính dẫn điện tốt nhất trong các kim loại?',
    o: ['Đồng (Cu)', 'Bạc (Ag)', 'Vàng (Au)', 'Nhôm (Al)'],
    a: 1,
    ex: 'Thứ tự dẫn điện giảm dần: Ag > Cu > Au > Al > Fe. Bạc (Ag) dẫn điện tốt nhất.',
  },
  {
    q: 'Dung dịch chất nào sau đây làm quỳ tím chuyển sang màu xanh?',
    o: ['Axit axetic', 'Anilin', 'Metylamin', 'Glyxin'],
    a: 2,
    ex: 'Metylamin (CH₃NH₂) có tính bazơ mạnh hơn amoniac nên làm quỳ tím hóa xanh; anilin có tính bazơ rất yếu không đổi màu quỳ.',
  },
  {
    q: 'Chất nào sau đây thuộc loại đisaccarit?',
    o: ['Glucozơ', 'Fructozơ', 'Saccarozơ', 'Tinh bột'],
    a: 2,
    ex: 'Saccarozơ (C₁₂H₂₂O₁₁) là đisaccarit được cấu tạo từ 1 gốc α-glucozơ và 1 gốc β-fructozơ.',
  },
  {
    q: 'Kim loại Fe thụ động (không tác dụng) trong dung dịch nào sau đây ở nhiệt độ thường?',
    o: ['HCl loãng', 'H₂SO₄ loãng', 'HNO₃ đặc, nguội', 'CuSO₄'],
    a: 2,
    ex: 'Fe, Al, Cr bị thụ động hóa trong HNO₃ đặc nguội và H₂SO₄ đặc nguội do tạo màng oxit bảo vệ.',
  },
];

function DailyDiscoverySection() {
  // Widget A: Nguyên tố hôm nay
  const [elemIdx, setElemIdx] = useState(() => Math.floor(Math.random() * ELEMENTS_BANK.length));
  const curElem = ELEMENTS_BANK[elemIdx];

  const handleNextElem = () => {
    setElemIdx((prev) => (prev + 1) % ELEMENTS_BANK.length);
  };

  // Widget B: Thử thách Hóa học 10 giây
  const [qIdx, setQIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [stats, setStats] = useState({ ok: 0, total: 0, streak: 0 });

  const curQ = DAILY_QUIZ_BANK[qIdx % DAILY_QUIZ_BANK.length];

  const handlePick = (idx) => {
    if (picked !== null) return;
    setPicked(idx);
    const isRight = idx === curQ.a;
    setStats((s) => ({
      ok: s.ok + (isRight ? 1 : 0),
      total: s.total + 1,
      streak: isRight ? s.streak + 1 : 0,
    }));
  };

  const handleNextQ = () => {
    setPicked(null);
    setQIdx((idx) => idx + 1);
  };

  return (
    <section className="ns9-discovery-wrap" aria-label="Góc khám phá và micro-learning Hóa học mỗi ngày">
      <div className="ns9-discovery-grid">
        {/* THẺ A: NGUYÊN TỐ HÔM NAY */}
        <article className="ns9-disc-card ns9-elem-card">
          <div className="ns9-disc-head">
            <span className="ns9-disc-badge">Nguyên tố hôm nay</span>
            <button
              type="button"
              className="ns9-disc-ghost"
              onClick={handleNextElem}
              title="Khám phá một nguyên tố ngẫu nhiên khác"
            >
              <IcoRefresh size={14} />
              <span>Đổi nguyên tố</span>
            </button>
          </div>

          <div className="ns9-element-main">
            <div className="ns9-element-tile" aria-hidden="true">
              <small>{curElem.z}</small>
              <b>{curElem.s}</b>
              <span>{curElem.m}</span>
            </div>
            <div className="ns9-element-title">
              <h3>{curElem.name}</h3>
              <p className="ns9-element-cat">{curElem.cat}</p>
            </div>
          </div>

          <dl className="ns9-element-specs">
            <div>
              <dt>Số hiệu Z</dt>
              <dd>{curElem.z}</dd>
            </div>
            <div>
              <dt>Nguyên tử khối</dt>
              <dd>{curElem.m} g/mol</dd>
            </div>
            <div className="full-width">
              <dt>Cấu hình electron</dt>
              <dd>{curElem.cfg}</dd>
            </div>
          </dl>

          <p className="ns9-element-fact">
            <b>Bạn có biết?</b> {curElem.fact}
          </p>

          <a href="#table" className="ns9-element-cta">
            <span>Mở Bảng tuần hoàn tương tác</span>
            <IcoArrow size={14} />
          </a>
        </article>

        {/* THẺ B: THỬ THÁCH HÓA HỌC 10 GIÂY */}
        <article className="ns9-disc-card ns9-quiz-card">
          <div className="ns9-disc-head">
            <span className="ns9-disc-badge" style={{ background: 'rgba(255, 149, 0, 0.12)', color: '#ff9500' }}>
              Thử sức 10 giây
            </span>
            <span className="ns9-quiz-score-tag">
              Đúng: <b>{stats.ok}/{stats.total}</b> · Chuỗi: <b>{stats.streak}</b>
            </span>
          </div>

          <h3 className="ns9-quiz-qtext">{curQ.q}</h3>

          <div className="ns9-quiz-options" role="group" aria-label="Đáp án trắc nghiệm">
            {curQ.o.map((optText, optIdx) => {
              let optClass = 'ns9-quiz-opt';
              if (picked !== null) {
                if (optIdx === curQ.a) optClass += ' opt-right';
                else if (optIdx === picked) optClass += ' opt-wrong';
                else optClass += ' opt-dim';
              }
              return (
                <button
                  key={optText}
                  type="button"
                  className={optClass}
                  onClick={() => handlePick(optIdx)}
                  disabled={picked !== null}
                >
                  <span className="ns9-opt-letter">{'ABCD'[optIdx]}</span>
                  <span className="ns9-opt-label">{optText}</span>
                  {picked !== null && optIdx === curQ.a && <IcoCheck size={16} />}
                  {picked !== null && optIdx === picked && optIdx !== curQ.a && <IcoX size={16} />}
                </button>
              );
            })}
          </div>

          {picked !== null && (
            <div className="ns9-quiz-feedback">
              <p style={{ margin: 0 }}>
                <b>{picked === curQ.a ? 'Chính xác!' : 'Chưa chính xác.'}</b> {curQ.ex}
              </p>
            </div>
          )}

          <div className="ns9-quiz-actions">
            {picked !== null ? (
              <button type="button" className="ns9-quiz-next-btn" onClick={handleNextQ}>
                Câu tiếp theo ›
              </button>
            ) : (
              <span style={{ fontSize: '12px', color: 'var(--mut)' }}>
                Chọn đáp án nhanh để kiểm tra phản xạ lý thuyết
              </span>
            )}
            <a href="#quiz" className="ns9-quiz-more-link">
              <span>Luyện thêm ở phòng Trắc nghiệm</span>
              <IcoArrow size={13} />
            </a>
          </div>
        </article>
      </div>
    </section>
  );
}

/* ============================================================
   5. PHÒNG THI & LỚP HỌC TRỰC TUYẾN (CLASSROOM QUICK JOIN)
   ============================================================ */
function parseExamToken(raw) {
  const m = /exam\/([^\s?#/]+)/i.exec(raw || '');
  return m ? decodeURIComponent(m[1]) : null;
}

function ClassroomAndJoinBar() {
  const [val, setVal] = useState('');
  const [err, setErr] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const token = parseExamToken(val) || val.trim();
    if (!token) {
      setErr('Vui lòng nhập link hoặc mã đề thi hợp lệ.');
      return;
    }
    setErr('');
    window.location.hash = 'exam/' + encodeURIComponent(token);
  };

  return (
    <section className="ns9-classroom-hub-card" aria-label="Phòng thi và lớp học trực tuyến">
      <div className="ns9-ch-left">
        <h3>
          <IcoUsers size={20} />
          <span>Vào phòng thi &amp; Lớp học của giáo viên</span>
        </h3>
        <p>
          Dán đường link đề thi hoặc nhập mã phòng thi do thầy cô giao để vào làm bài có bấm giờ ngay lập tức.
        </p>
      </div>

      <form className="ns9-ch-form" onSubmit={submit}>
        <div className="ns9-ch-pill">
          <IcoLink size={18} />
          <input
            type="text"
            inputMode="url"
            autoComplete="off"
            value={val}
            placeholder="Dán link đề cô gửi (VD: https://.../#exam/xyz) hoặc nhập mã đề..."
            onChange={(e) => {
              setVal(e.target.value);
              if (err) setErr('');
            }}
          />
          <button type="submit" disabled={!val.trim()}>
            Vào thi ngay
          </button>
        </div>
        {err && <p className="bento-err" style={{ margin: '6px 0 0 14px' }}>{err}</p>}
      </form>
    </section>
  );
}

/* ============================================================
   TRANG CHỦ TỔNG THỂ (HOÀN CHỈNH BENTO GRID)
   ============================================================ */
export default function Home() {
  const { hello, name } = useGreeting();
  const { user } = useAuth();
  const uid = user?.uid || null;
  useProgress(); // Giữ đồng bộ tiến trình học tập

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
      `Đóng vai Gia sư Hóa ELEC AI (xưng "mình – bạn"), hãy lập kế hoạch học tập tuần này giúp mình bám sát mục tiêu:\n${targetLine}\n` +
      `Điểm Hóa dự đoán hiện tại: ${rmData?.hasEvidence ? rmData.predictedChem10 : 'Chưa đo'}/10 · Tiến độ: ${rmData?.paceStatus}.`,
      gradeKey,
    );
  };

  return (
    <div className="db-bento-wrap ns9-home-wrap">
      <div className="db-bento-ambient" aria-hidden="true" />

      <div className="ns9-home-container">
        {/* 1. HERO COMMAND CENTER: LỜI CHÀO, ĐẾM NGƯỢC THPTQG, NV1 VÀ AI COMPOSER */}
        <PersonalAiHero
          hello={hello}
          name={name}
          activeAsp={roadmapSnapshot.activeAsp}
        />

        {/* 2. HUB LỘ TRÌNH VÀNG: 4 CHỈ SỐ + BIỂU ĐỒ ĐIỂM/ELO TƯƠNG TÁC + CTA CHIẾN LƯỢC */}
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

        {/* 3. BỐN TRỤ CỘT CHIẾN LƯỢC: PHÒNG THI ẢO 2027 · LỘ TRÌNH MỤC TIÊU · SỔ TAY LỖI SAI · GIA SƯ AI */}
        <StrategicPillars
          activeAsp={roadmapSnapshot.activeAsp}
          dueTotal={roadmapSnapshot.dueTotal}
        />

        {/* 4. MA TRẬN HỌC TẬP & THỰC HÀNH HÓA HỌC CHUYÊN SÂU */}
        <ChemistryStudyMatrix />

        {/* 5. GÓC KHÁM PHÁ & MICRO-LEARNING HÓA HỌC MỖI NGÀY */}
        <DailyDiscoverySection />

        {/* 6. PHÒNG THI & LỚP HỌC TRỰC TUYẾN */}
        <ClassroomAndJoinBar />
      </div>
    </div>
  );
}
