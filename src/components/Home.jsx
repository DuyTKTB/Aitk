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
import AspirationAiStrategyModal from './aspiration/AspirationAiStrategyModal.jsx';
import ElecTutorOnboardingModal from './aspiration/ElecTutorOnboardingModal.jsx';
import DiagnosticTestModal from './roadmap/DiagnosticTestModal.jsx';
import { useCurrentSubject } from './SubjectSwitcher.jsx';
import { getUniversityCover } from '../data/universityCovers.js';
import { getUserProfile, USER_PROFILE_CHANGE_EVENT } from '../lib/userProfileService.js';
import UserAvatar from './UserAvatar.jsx';
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
      • Gia sư KHTN ELEC AI 24/7
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
const IcoPhysics = ico(<><ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(-30 12 12)" /><ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(30 12 12)" /><circle cx="12" cy="12" r="2" fill="currentColor" /></>);
const IcoBio = ico(<><path d="M4 4c4 4 12 4 16 0M4 20c4-4 12-4 16 0" /><line x1="6" y1="8" x2="18" y2="8" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="6" y1="16" x2="18" y2="16" /></>);
const IcoWave = ico(<path d="M2 12c2.5-6 5.5-6 8 0s5.5 6 8 0 4-3 4-3" />);
const IcoCircuit = ico(<><rect x="6" y="8" width="12" height="8" rx="2" /><path d="M2 12h4M18 12h4M10 8V5M14 8V5" /></>);
const IcoDna = ico(<><path d="M6 3c3 4 9 4 12 0M6 21c3-4 9-4 12 0M7 8h10M9 12h6M7 16h10" /></>);

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

/* ── Câu hỏi gợi ý học sinh thường gặp trong đề thi THPTQG theo từng môn (Nhãn ngắn gọn, click điền câu hỏi đầy đủ) ── */
const SUBJECT_PROMPT_PILLS = {
  all: [
    { label: 'Dao động con lắc', prompt: 'Giải bài toán con lắc lò xo dao động điều hòa' },
    { label: 'Cân bằng PTHH', prompt: 'Cân bằng phản ứng Fe + HNO₃ loãng bằng phương pháp thăng bằng e' },
    { label: 'Cấu trúc gen ADN', prompt: 'Tính số liên kết hiđrô và chiều dài gen ADN' },
    { label: 'Cộng hưởng RLC', prompt: 'Mạch điện xoay chiều RLC nối tiếp có hiện tượng cộng hưởng điện' },
  ],
  ly: [
    { label: 'Dao động điều hòa', prompt: 'Viết phương trình dao động điều hòa x = A cos(ωt + φ)' },
    { label: 'Mạch xoay chiều RLC', prompt: 'Tính tổng trở Z và hệ số công suất cosφ mạch xoay chiều RLC' },
    { label: 'Giao thoa Y-âng', prompt: 'Giải bài toán giao thoa ánh sáng qua khe Y-âng (khoảng vân i)' },
    { label: 'Bảo toàn cơ năng', prompt: 'Định luật bảo toàn cơ năng và động lượng trong va chạm' },
  ],
  hoa: [
    { label: 'Thủy phân Este', prompt: 'Giải từng bước bài toán Ester thủy phân trong kiềm' },
    { label: 'Fe + HNO₃ loãng', prompt: 'Cân bằng phản ứng Fe + HNO₃ loãng sinh hỗn hợp NO, N₂O' },
    { label: 'Pin & Điện hóa', prompt: 'Tóm tắt trọng tâm Điện hóa học & Pin Galvani Lớp 12' },
    { label: 'Este 9+ nâng cao', prompt: 'Phương pháp giải bài toán Este đa chức nâng cao 9+' },
  ],
  sinh: [
    { label: 'Gen & Liên kết H', prompt: 'Tính số nucleotit từng loại và số liên kết hiđrô của gen ADN' },
    { label: 'Quy luật Men-đen', prompt: 'Quy luật Men-đen: tỉ lệ phân li kiểu gen và kiểu hình đời F2' },
    { label: 'Hardy - Weinberg', prompt: 'Định luật Hardy - Weinberg và bài toán cân bằng di truyền' },
    { label: 'Phiên mã & Dịch mã', prompt: 'Quá trình phiên mã mARN và dịch mã tổng hợp protein' },
  ],
};

const SUBJECT_TAGLINES = {
  all: 'Trợ lý Khoa học Tự nhiên · Luyện thi THPTQG toàn diện',
  ly: 'Trợ lý Vật lí · Dao động cơ, Sóng & Mạch điện RLC',
  hoa: 'Trợ lý Hóa học · Hóa hữu cơ, Este & Phản ứng Oxi hóa - Khử',
  sinh: 'Trợ lý Sinh học · Di truyền học, Cấu trúc ADN & Tiến hóa',
};

/* ============================================================
   B. UNIFIED AI CAMPUS HERO: AI CHÍNH LÊN ĐẦU, BÊN CẠNH LÀ HÌNH ẢNH
   - Bên trái: AI Composer thông minh, OCR, Quick chips, Lời chào, Hồ sơ
   - Bên phải:
     + Nếu ĐÃ chọn nguyện vọng: Ảnh khuôn viên thực tế của trường đó (getUniversityCover(code)), mascot chào, badge điểm
     + Nếu CHƯA chọn nguyện vọng: Thiệp mời "Cánh Cổng Đại Học Mơ Ước" kèm nút "+ Chọn trường mục tiêu" (KHÔNG HIỆN ẢNH BẤT KỲ TRƯỜNG NÀO!)
   ============================================================ */
function UnifiedAiCampusHero({ hello, name, activeAsp, onOpenWishHero }) {
  const [val, setVal] = useState('');
  const { user } = useAuth();
  const uid = user?.uid || null;
  const [profile, setProfile] = useState(() => getUserProfile(uid));

  useEffect(() => {
    const onProfile = () => setProfile(getUserProfile(uid));
    window.addEventListener(USER_PROFILE_CHANGE_EVENT, onProfile);
    return () => window.removeEventListener(USER_PROFILE_CHANGE_EVENT, onProfile);
  }, [uid]);

  const { subject } = useCurrentSubject();
  const pills = SUBJECT_PROMPT_PILLS[subject] || SUBJECT_PROMPT_PILLS.all;

  // Lịch sử hỏi đáp gần đây (đọc từ companion sessions trong localStorage hoặc danh sách đề xuất chuẩn KHTN)
  const [recentChats, setRecentChats] = useState(() => {
    try {
      const raw = localStorage.getItem(`cs-elec-companion-sessions:${uid}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.slice(0, 3).map((s) => ({
            id: s.id,
            title: s.title || 'Câu hỏi luyện thi KHTN',
            subject: (s.title?.toLowerCase().includes('hóa') || s.title?.toLowerCase().includes('este') || s.title?.toLowerCase().includes('pthh')) ? 'hoa' : (s.title?.toLowerCase().includes('lý') || s.title?.toLowerCase().includes('dao động') || s.title?.toLowerCase().includes('rlc')) ? 'ly' : (s.title?.toLowerCase().includes('sinh') || s.title?.toLowerCase().includes('gen') || s.title?.toLowerCase().includes('adn')) ? 'sinh' : 'khtn',
            time: 'Gần đây',
            prompt: s.messages?.[0]?.text || s.title,
          }));
        }
      }
    } catch { /* */ }
    return [
      { id: 'rc_1', title: 'Cân bằng PTHH Fe + HNO₃ loãng sinh NO', subject: 'hoa', time: 'Hôm nay', prompt: 'Cân bằng phản ứng Fe + HNO₃ loãng bằng phương pháp thăng bằng electron' },
      { id: 'rc_2', title: 'Dao động con lắc lò xo & đồ thị li độ', subject: 'ly', time: 'Hôm qua', prompt: 'Phương pháp giải đồ thị li độ - thời gian của con lắc lò xo' },
      { id: 'rc_3', title: 'Quy luật di truyền Men-đen & liên kết gen', subject: 'sinh', time: '2 ngày trước', prompt: 'Tính xác suất kiểu hình đời F2 trong quy luật phân li độc lập Men-đen' },
    ];
  });

  const [mascotQuoteIdx, setMascotQuoteIdx] = useState(0);
  const MASCOT_QUOTES = [
    'Cần giải bài nào cứ dán vào đây nha!',
    'Chụp ảnh đề bài là mình giải từng bước!',
    'Luyện tập mỗi ngày, đỗ nguyện vọng 1!',
    'Có gì khó, cứ hỏi Gia sư ELEC AI nhé!'
  ];

  const submit = (e) => {
    e?.preventDefault();
    if (!val.trim()) return;
    goAI({ text: val.trim() });
  };

  const handleSelectRecentChat = (item) => {
    if (item?.prompt) {
      setVal(item.prompt);
    }
  };

  const displayName = profile?.fullName || user?.displayName || name || 'Học viên';
  const avatarInitials = useMemo(() => {
    if (displayName) {
      const parts = displayName.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return displayName.slice(0, 2).toUpperCase();
    }
    return 'HV';
  }, [displayName]);

  // Kiểm tra chính xác xem người dùng đã thực sự chọn trường nguyện vọng hay chưa
  const hasAspiration = Boolean(
    activeAsp?.school?.code &&
    activeAsp?.school?.name &&
    activeAsp.school.name !== 'Chưa chọn trường' &&
    activeAsp.school.code !== 'NONE'
  );

  const schoolCode = hasAspiration ? activeAsp.school.code : null;
  const schoolName = hasAspiration ? activeAsp.school.name : '';
  const majorName = hasAspiration
    ? (activeAsp?.major?.name || 'Ngành xét tuyển').replace(/^ngành\s+/i, '')
    : '';
  const coverUrl = hasAspiration ? getUniversityCover(schoolCode) : null;

  return (
    <section className="ns9-unified-hero" aria-label="ELEC AI & Mục tiêu Đại học">
      {/* ── CỘT TRÁI: AI CHÍNH TRỌNG TÂM LÊN ĐẦU (GỌN GÀNG, ĐẲNG CẤP) ── */}
      <article className="ns9-uh-ai-col">
        {/* Hàng 1: User Profile & Trạng thái Trợ lý */}
        <div className="ns9-uh-user-row">
          <div className="ns9-uh-avatar" title={displayName} style={{ padding: 0, overflow: 'hidden', background: 'transparent' }}>
            <UserAvatar user={user} photoURL={profile?.avatarUrl || profile?.avatar || user?.photoURL} size={58} title={displayName} />
          </div>
          <div className="ns9-uh-meta">
            <div className="ns9-uh-hello-line">
              <span className="ns9-uh-greeting">{hello}, <b>{displayName}</b>!</span>
              <span className="ns9-uh-ai-live">
                <span className="ns9-uh-ai-pulse" />
                ELEC AI
              </span>
            </div>
            {/* Pill Nguyện vọng hoặc Nhắc chọn mục tiêu */}
            <button
              type="button"
              className={`ns9-uh-wish-pill ${hasAspiration ? 'is-set' : 'is-empty'}`}
              onClick={onOpenWishHero}
              title={hasAspiration ? 'Bấm để xem Phân tích Chiến lược AI cho nguyện vọng này' : 'Bấm để chọn trường mục tiêu và cá nhân hóa lộ trình'}
            >
              <span className={`ns9-uh-pill-tag ${hasAspiration ? '' : 'empty'}`}>
                {hasAspiration ? `NV${activeAsp.priority || 1}` : 'MỤC TIÊU'}
              </span>
              <span className="ns9-uh-pill-name">
                {hasAspiration ? `${schoolCode} · ${schoolName}` : 'Chưa đặt trường mục tiêu'}
              </span>
              {hasAspiration && majorName && (
                <span className="ns9-uh-pill-major">({majorName})</span>
              )}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Hàng giữa: Lịch sử đã hỏi gần đây & Linh vật trang trí sinh động */}
        <div className="ns9-uh-mid-area">
          <div className="ns9-uh-recent-chats">
            <div className="ns9-uh-recent-head">
              <span className="ns9-uh-recent-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>Lịch sử đã hỏi gần đây</span>
              </span>
              <button
                type="button"
                className="ns9-uh-open-companion-link"
                onClick={() => window.dispatchEvent(new CustomEvent('elec-open-companion'))}
                title="Mở toàn bộ sổ tay trò chuyện & kế hoạch tuần"
              >
                <span>Sổ tay AI</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            <div className="ns9-uh-recent-list">
              {recentChats.map((rc) => (
                <button
                  key={rc.id}
                  type="button"
                  className="ns9-uh-recent-item"
                  onClick={() => handleSelectRecentChat(rc)}
                  title={`Bấm để điền câu hỏi: ${rc.prompt || rc.title}`}
                >
                  <span className={`ns9-uh-recent-tag tag-${rc.subject}`}>
                    {rc.subject === 'hoa' ? 'Hóa' : rc.subject === 'ly' ? 'Lý' : rc.subject === 'sinh' ? 'Sinh' : 'KHTN'}
                  </span>
                  <span className="ns9-uh-recent-text">{rc.title}</span>
                  <span className="ns9-uh-recent-time">{rc.time}</span>
                </button>
              ))}
            </div>
          </div>

          <div
            className="ns9-uh-mascot-deco"
            onClick={() => setMascotQuoteIdx((prev) => (prev + 1) % MASCOT_QUOTES.length)}
            title="Bấm vào linh vật ELEC AI để đổi lời nhắc học tập!"
            style={{ cursor: 'pointer' }}
          >
            <div className="ns9-uh-mascot-speech">
              <span>{MASCOT_QUOTES[mascotQuoteIdx]}</span>
            </div>
            <img
              src="/img/elec/elec-cool.png"
              alt="Linh vật ELEC AI"
              className="ns9-uh-mascot-sticker"
              loading="lazy"
            />
          </div>
        </div>

        {/* Hàng 2: Khung hỏi nhanh Gia sư AI tinh gọn */}
        <form className="ns9-uh-composer" onSubmit={submit}>
          <label htmlFor="unified-ai-input" className="sr-only">Hỏi Trợ lý ELEC AI</label>
          <div className="ns9-uh-input-wrap">
            <textarea
              id="unified-ai-input"
              rows={2}
              value={val}
              placeholder="Hỏi Gia sư ELEC AI: Dán đề bài Lý, Hóa, Sinh, phương pháp giải, bẫy trắc nghiệm..."
              onChange={(e) => setVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) submit(e);
              }}
            />
            <button
              type="submit"
              className="ns9-uh-send-btn"
              disabled={!val.trim()}
              aria-label="Gửi câu hỏi"
              title="Gửi câu hỏi cho ELEC AI"
            >
              <IcoSend size={16} />
            </button>
          </div>

          <div className="ns9-uh-chips-bar" role="toolbar" aria-label="Gợi ý câu hỏi nhanh">
            <button
              type="button"
              className="ns9-uh-chip-ocr"
              onClick={() => goAI({ action: 'capture' })}
              title="Mở camera hoặc tải ảnh đề bài để AI nhận diện OCR và giải từng bước"
            >
              <IcoCamera size={14} />
              <span>Chụp ảnh OCR</span>
            </button>
            {pills.slice(0, 4).map((p) => (
              <button
                key={p.label}
                type="button"
                className="ns9-uh-chip"
                onClick={() => setVal(p.prompt)}
                title={p.prompt}
              >
                {p.label}
              </button>
            ))}
          </div>
        </form>
      </article>

      {/* ── CỘT PHẢI: BÊN CẠNH AI LÀ HÌNH ẢNH ── */}
      <aside className="ns9-uh-visual-col" aria-label="Hình ảnh trường đại học mục tiêu">
        {hasAspiration ? (
          /* TRƯỜNG HỢP 1: ĐÃ CHỌN TRƯỜNG -> HIỆN ẢNH KHUÔN VIÊN TRƯỜNG ĐÓ */
          <div
            className="ns9-uh-cover-card"
            onClick={onOpenWishHero}
            title={`Bấm để xem phân tích chiến lược tuyển sinh ${schoolName}`}
          >
            <img
              src={coverUrl}
              alt={`Khuôn viên ${schoolName}`}
              className="ns9-uh-cover-photo"
              loading="eager"
            />
            <div className="ns9-uh-cover-vignette" />
            <div className="ns9-uh-cover-badge">
              <span className="ns9-uh-cb-school">{schoolCode} · {schoolName}</span>
              {activeAsp?.targetScore && (
                <span className="ns9-uh-cb-score">Mục tiêu {activeAsp.targetScore}đ</span>
              )}
            </div>
            <div className="ns9-uh-cover-mascot">
              <img
                src="/img/elec/elec-hello.png"
                alt="Linh vật ELEC AI"
                className="ns9-uh-mascot-img"
              />
            </div>
          </div>
        ) : (
          /* TRƯỜNG HỢP 2: CHƯA CHỌN TRƯỜNG -> SHOWCASE CÁNH CỔNG ĐẠI HỌC MƠ ƯỚC CAO CẤP */
          <div
            className="ns9-uh-unselected-card"
            onClick={onOpenWishHero}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onOpenWishHero()}
            title="Bấm để chọn trường Đại học mục tiêu và mở khóa lộ trình cá nhân hóa"
          >
            <div className="ns9-uh-unsel-aurora" aria-hidden="true" />

            <div className="ns9-uh-unsel-main">
              <div className="ns9-uh-unsel-head">
                <span className="ns9-uh-unsel-badge">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                  </svg>
                  <span>Cánh Cổng Đại Học Mơ Ước</span>
                </span>
                <span className="ns9-uh-unsel-tag">Xu hướng 2025 – 2027</span>
              </div>

              <h3 className="ns9-uh-unsel-title">Mục tiêu Đại học của bạn là gì?</h3>
              <p className="ns9-uh-unsel-desc">
                Khóa trường mơ ước để ELEC AI tính điểm chuẩn 3 năm gần nhất, tỷ lệ chọi và cá nhân hóa lịch học 7 ngày đầu tiên.
              </p>

              <div className="ns9-uh-unsel-univ-chips" aria-label="Gợi ý trường mục tiêu tiêu biểu">
                <span className="ns9-uh-univ-chip" title="Bách Khoa Hà Nội · Chuẩn 24.75đ">
                  <span className="ns9-uh-uc-code">BKA</span>
                  <span className="ns9-uh-uc-score">24.75đ</span>
                </span>
                <span className="ns9-uh-univ-chip" title="Đại học Ngoại Thương · Chuẩn 27.50đ">
                  <span className="ns9-uh-uc-code">FTU</span>
                  <span className="ns9-uh-uc-score">27.50đ</span>
                </span>
                <span className="ns9-uh-univ-chip" title="Đại học Y Hà Nội · Chuẩn 28.00đ">
                  <span className="ns9-uh-uc-code">HMU</span>
                  <span className="ns9-uh-uc-score">28.00đ</span>
                </span>
                <span className="ns9-uh-univ-chip" title="Đại học Kinh Tế Quốc Dân · Chuẩn 26.80đ">
                  <span className="ns9-uh-uc-code">NEU</span>
                  <span className="ns9-uh-uc-score">26.80đ</span>
                </span>
              </div>

              <div className="ns9-uh-unsel-action-row">
                <button type="button" className="ns9-uh-choose-btn" tabIndex={-1}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                    <circle cx="12" cy="12" r="2" />
                  </svg>
                  <span>Đặt trường mục tiêu của bạn</span>
                  <IcoArrow size={13} />
                </button>
                <span className="ns9-uh-unsel-subtip">Miễn phí · Đổi bất kỳ lúc nào</span>
              </div>
            </div>

            <div className="ns9-uh-unsel-mascot-box">
              <div className="ns9-uh-unsel-speech">
                <span>Cùng Elec đặt mục tiêu nào! ✨</span>
              </div>
              <img
                src="/img/elec/elec-hello.png"
                alt="Linh vật ELEC AI"
                className="ns9-uh-mascot-img"
                loading="eager"
              />
              <div className="ns9-uh-mascot-pedestal" aria-hidden="true" />
            </div>
          </div>
        )}
      </aside>
    </section>
  );
}

/* ============================================================
   C. BA THẺ BENTO TRỌNG TÂM VỚI HÌNH LINH VẬT ELEC ĐỨNG ĐẸP MẮT
   ============================================================ */
function HomeBentoThreeCards() {
  const cards = [
    {
      title: 'Lộ trình mục tiêu',
      desc: 'Xem chi tiết các mốc, phân tích khoảng cách tới mục tiêu.',
      cta: 'Xem ngay',
      href: '#roadmap',
      img: '/img/elec/elec-fighting.png',
      alt: 'Elec Quyết Tâm Mục Tiêu',
      tone: 'blue',
    },
    {
      title: 'Lộ trình cá nhân hóa',
      desc: 'Kế hoạch cá nhân hóa theo ngày, tuần, tháng.',
      cta: 'Xem ngay',
      href: '#roadmap?tab=timeline',
      img: '/img/elec/elec-think.png',
      alt: 'Elec Suy Nghĩ Kế Hoạch',
      tone: 'teal',
    },
    {
      title: 'Luyện tập ELEC AI',
      desc: 'Phân tích điểm mạnh, yếu và gợi ý cải thiện.',
      cta: 'Luyện tập ngay',
      href: '#ai',
      img: '/img/elec/elec-happy.png',
      alt: 'Elec Vui Vẻ Luyện Tập',
      tone: 'purple',
    },
  ];

  return (
    <section className="ns9-three-bento-grid" aria-label="3 Lộ trình học tập trọng tâm">
      {cards.map((c) => (
        <a key={c.title} href={c.href} className={`ns9-three-card tone-${c.tone}`}>
          <div className="ns9-tc-body">
            <h3 className="ns9-tc-title">{c.title}</h3>
            <p className="ns9-tc-desc">{c.desc}</p>
            <span className="ns9-tc-cta">
              <span>{c.cta}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </span>
          </div>
          <div className="ns9-tc-mascot-wrap">
            <img src={c.img} alt={c.alt} className="ns9-tc-mascot-img" loading="lazy" />
          </div>
        </a>
      ))}
    </section>
  );
}

/* ============================================================
   2. BỐN TRỤ CỘT CHIẾN LƯỢC CHINH PHỤC THPT QUỐC GIA (4-PILLARS)
   ============================================================ */
function StrategicPillars({ activeAsp, dueTotal }) {
  const cards = [
    {
      href: '#virtual-exams',
      badge: 'Độc quyền 2027 · Chuẩn Bộ KHTN',
      title: 'Phòng thi ảo KHTN 2027',
      desc: 'Bộ đề thi thử 3 môn Lý — Hóa — Sinh chuẩn ma trận 2027, bấm giờ thi thật, AI giám sát & chấm OMR tức thì.',
      cta: 'Vào phòng thi ảo',
      Icon: IcoExam,
      tone: 'orange',
    },
    {
      href: '#roadmap',
      badge: activeAsp ? `Mục tiêu ${activeAsp.school.code}` : 'Chuyên đề KHTN trọng tâm',
      title: 'Lộ trình kiến thức 3 môn',
      desc: activeAsp
        ? `Chinh phục từng chuyên đề Lý — Hóa — Sinh bám sát mốc điểm ${activeAsp.targetScore}đ của ${activeAsp.school.name}.`
        : 'Hệ thống chuyên đề Vật lí, Hóa học, Sinh học THPT bám sát cấu trúc thi kèm bài luyện 3 cấp độ.',
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
        : 'Thuật toán lặp lại ngắt quãng tự động lưu các câu làm sai và nhắc ôn đúng thời điểm cho cả 3 môn.',
      cta: dueTotal > 0 ? 'Mở Sổ tay lỗi sai' : 'Xem kế hoạch ôn tập',
      Icon: IcoNotebook,
      tone: 'purple',
    },
    {
      href: '#ai',
      badge: 'Gia sư AI 1-on-1',
      title: 'Luyện tập cùng ELEC AI',
      desc: 'Giải thích bài tập Lý — Hóa — Sinh từng bước, phân tích bẫy trắc nghiệm và sinh đề ôn theo chuyên đề yếu.',
      cta: 'Mở Trợ lý AI',
      Icon: IcoSpark,
      tone: 'teal',
    },
  ];

  return (
    <section className="ns9-shortcuts-grid four-cols" aria-label="Bốn trụ cột chiến lược luyện thi Khoa học Tự nhiên">
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
   3. MA TRẬN HỌC TẬP & THỰC HÀNH KHOA HỌC TỰ NHIÊN (KHTN MATRIX)
   ============================================================ */
const MATRIX_GROUPS = [
  {
    id: 'physics',
    tag: 'Môn Vật lí',
    tone: 'blue',
    title: 'Cơ — Điện — Quang & Sóng',
    mascot: '/img/elec/elec-super-saiyan.png',
    mascotMood: 'Năng lượng cực đại!',
    items: [
      {
        href: '#formulas',
        Icon: IcoPhysics,
        title: 'Sổ tay công thức Vật lí',
        desc: 'Công thức giải nhanh dao động, sóng cơ, mạch RLC, thấu kính',
        tone: 'blue',
      },
      {
        href: '#formulas',
        Icon: IcoWave,
        title: 'Mô phỏng Dao động & Sóng',
        desc: 'Tính toán tần số, chu kỳ con lắc, tổng trở Z và cộng hưởng điện',
        tone: 'teal',
      },
      {
        href: '#roadmap',
        Icon: IcoCircuit,
        title: 'Lộ trình 14 chuyên đề Vật lí',
        desc: 'Bao phủ động học, động lực học, sóng cơ đến vật lí hạt nhân',
        tone: 'purple',
      },
    ],
  },
  {
    id: 'chemistry',
    tag: 'Môn Hóa học',
    tone: 'teal',
    title: 'Vô cơ — Hữu cơ & Phản ứng',
    mascot: '/img/elec/elec-wink.png',
    mascotMood: 'Phản ứng kỳ diệu!',
    items: [
      {
        href: '#table',
        Icon: IcoTable,
        title: 'Bảng tuần hoàn 118 nguyên tố',
        desc: 'Tra cứu cấu hình e, độ âm điện, tính chất chu kỳ & nhóm',
        tone: 'teal',
      },
      {
        href: '#balance',
        Icon: IcoBalance,
        title: 'Cân bằng PTHH thông minh',
        desc: 'Cân bằng phản ứng Oxi hóa - Khử bằng đại số tuyến tính',
        tone: 'blue',
      },
      {
        href: '#analyze',
        Icon: IcoFlask,
        title: 'Phân tích hợp chất & Nhận biết',
        desc: 'Nhận diện chất, thuốc thử đặc trưng, hiện tượng kết tủa',
        tone: 'purple',
      },
    ],
  },
  {
    id: 'biology',
    tag: 'Môn Sinh học',
    tone: 'purple',
    title: 'Di truyền — Tế bào & Khảo thí',
    mascot: '/img/elec/elec-think.png',
    mascotMood: 'Tư duy di truyền!',
    items: [
      {
        href: '#formulas',
        Icon: IcoBio,
        title: 'Di truyền phân tử & ADN',
        desc: 'Tính số nucleotit, liên kết hiđrô, chiều dài gen và chu kỳ xoắn',
        tone: 'purple',
      },
      {
        href: '#roadmap',
        Icon: IcoDna,
        title: 'Quy luật Men-đen & Quần thể',
        desc: 'Khung Punnett, phép lai phân tích, cân bằng Hardy - Weinberg',
        tone: 'teal',
      },
      {
        href: '#grade',
        Icon: IcoGrade,
        title: 'Dự toán điểm khối thi & GPA',
        desc: 'Tính điểm tổ hợp xét tuyển A00, B00, KHTN vào các trường ĐH',
        tone: 'orange',
      },
    ],
  },
];

function ChemistryStudyMatrix() {
  return (
    <section className="ns9-matrix-wrap" aria-label="Ma trận Công cụ Khoa học Tự nhiên THPT">
      <div className="ns9-matrix-header">
        <div className="ns9-matrix-title-wrap">
          <span className="ns9-matrix-badge">Hệ sinh thái KHTN toàn diện</span>
          <h2>Ma trận học tập 3 môn Khoa học Tự nhiên</h2>
          <p>
            Bộ công cụ chuyên biệt hỗ trợ toàn diện: từ giải nhanh con lắc &amp; mạch điện (Vật lí), cân bằng PTHH &amp; bảng tuần hoàn (Hóa học) đến di truyền ADN &amp; quy luật Men-đen (Sinh học).
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
              <div className="ns9-col-head-text">
                <span className={`ns9-col-tag tone-${group.tone}`}>{group.tag}</span>
                <h3>{group.title}</h3>
              </div>
              {group.mascot && (
                <div className="ns9-col-mascot-wrap" title={group.mascotMood || `Elec ${group.tag}`}>
                  <img
                    src={group.mascot}
                    alt={`Elec ${group.tag}`}
                    className="ns9-col-mascot-img"
                    loading="lazy"
                  />
                </div>
              )}
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
const KHTN_DISCOVERY_BANK = [
  // --- HÓA HỌC ---
  {
    subject: 'Hóa học',
    badge: 'Nguyên tố hôm nay',
    symbol: 'C',
    codeText: 'Z = 6',
    name: 'Carbon',
    category: 'Hóa học · Phi kim',
    spec1Label: 'Số hiệu Z',
    spec1Val: '6',
    spec2Label: 'Nguyên tử khối',
    spec2Val: '12,011 g/mol',
    spec3Label: 'Cấu hình electron',
    spec3Val: '[He] 2s² 2p²',
    fact: 'Cốt lõi của toàn bộ Hóa học Hữu cơ và sự sống. Kim cương và than chì là hai dạng thù hình nổi tiếng nhất.',
    link: '#table',
    linkText: 'Mở Bảng tuần hoàn 118 nguyên tố',
  },
  {
    subject: 'Hóa học',
    badge: 'Nguyên tố hôm nay',
    symbol: 'Fe',
    codeText: 'Z = 26',
    name: 'Iron (Sắt)',
    category: 'Hóa học · Kim loại chuyển tiếp',
    spec1Label: 'Số hiệu Z',
    spec1Val: '26',
    spec2Label: 'Nguyên tử khối',
    spec2Val: '55,845 g/mol',
    spec3Label: 'Cấu hình electron',
    spec3Val: '[Ar] 3d⁶ 4s²',
    fact: 'Thành phần cốt lõi của hemoglobin trong hồng cầu giúp vận chuyển oxy nuôi cơ thể.',
    link: '#table',
    linkText: 'Mở Bảng tuần hoàn 118 nguyên tố',
  },
  {
    subject: 'Hóa học',
    badge: 'Nguyên tố hôm nay',
    symbol: 'H',
    codeText: 'Z = 1',
    name: 'Hydrogen',
    category: 'Hóa học · Phi kim',
    spec1Label: 'Số hiệu Z',
    spec1Val: '1',
    spec2Label: 'Nguyên tử khối',
    spec2Val: '1,008 g/mol',
    spec3Label: 'Cấu hình electron',
    spec3Val: '1s¹',
    fact: 'Nguyên tố nhẹ nhất và dồi dào nhất trong vũ trụ. Nhiên liệu sạch tương lai khi cháy chỉ thải ra nước H₂O.',
    link: '#table',
    linkText: 'Mở Bảng tuần hoàn 118 nguyên tố',
  },
  // --- VẬT LÍ ---
  {
    subject: 'Vật lí',
    badge: 'Hằng số & Thuyết tương đối',
    symbol: 'c',
    codeText: '3·10⁸ m/s',
    name: 'Vận tốc ánh sáng',
    category: 'Vật lí · Quang học & Hạt nhân',
    spec1Label: 'Ký hiệu hằng số',
    spec1Val: 'c',
    spec2Label: 'Giá trị trong chân không',
    spec2Val: '≈ 300.000 km/s',
    spec3Label: 'Hệ thức liên hệ',
    spec3Val: 'E = mc² (Năng lượng nghỉ)',
    fact: 'Tốc độ cực hạn của vũ trụ. Ánh sáng từ Mặt Trời mất khoảng 8 phút 20 giây để chạm tới bề mặt Trái Đất.',
    link: '#formulas',
    linkText: 'Mở Sổ tay công thức Vật lí',
  },
  {
    subject: 'Vật lí',
    badge: 'Dao động điều hòa',
    symbol: 'T',
    codeText: '2π√(m/k)',
    name: 'Chu kỳ con lắc lò xo',
    category: 'Vật lí · Dao động cơ học',
    spec1Label: 'Khối lượng m',
    spec1Val: 'kg',
    spec2Label: 'Độ cứng k',
    spec2Val: 'N/m',
    spec3Label: 'Tần số góc',
    spec3Val: 'ω = √(k/m) (rad/s)',
    fact: 'Chu kỳ dao động điều hòa của con lắc lò xo độc lập với biên độ dao động A và gia tốc trọng trường g.',
    link: '#formulas',
    linkText: 'Mở Máy tính dao động điều hòa',
  },
  {
    subject: 'Vật lí',
    badge: 'Hiện tượng cộng hưởng',
    symbol: 'Z',
    codeText: 'Z_min = R',
    name: 'Mạch điện xoay chiều RLC',
    category: 'Vật lí · Dòng điện xoay chiều',
    spec1Label: 'Điều kiện cộng hưởng',
    spec1Val: 'Z_L = Z_C',
    spec2Label: 'Hệ số công suất',
    spec2Val: 'cosφ = 1 (cực đại)',
    spec3Label: 'Tần số cộng hưởng',
    spec3Val: 'f = 1 / (2π√(LC))',
    fact: 'Khi cộng hưởng điện, cường độ dòng điện trong mạch đạt cực đại I_max = U/R, điện áp cùng pha với dòng điện.',
    link: '#formulas',
    linkText: 'Mở Máy tính mạch xoay chiều RLC',
  },
  // --- SINH HỌC ---
  {
    subject: 'Sinh học',
    badge: 'Di truyền phân tử',
    symbol: 'ADN',
    codeText: 'A=T, G≡X',
    name: 'Nguyên tắc bổ sung',
    category: 'Sinh học · Cấu trúc Gen & ADN',
    spec1Label: 'Liên kết A - T',
    spec1Val: '2 liên kết hiđrô',
    spec2Label: 'Liên kết G - X',
    spec2Val: '3 liên kết hiđrô',
    spec3Label: 'Khoảng cách cặp nu',
    spec3Val: '3,4 Å (0,34 nm)',
    fact: 'Nguyên tắc bổ sung đảm bảo thông tin di truyền được nhân đôi chính xác tuyệt đối qua các thế hệ tế bào.',
    link: '#formulas',
    linkText: 'Mở Máy tính cấu trúc Gen & ADN',
  },
  {
    subject: 'Sinh học',
    badge: 'Mã di truyền',
    symbol: 'AUG',
    codeText: '64 Codon',
    name: 'Bộ ba mở đầu (Start Codon)',
    category: 'Sinh học · Dịch mã & Protein',
    spec1Label: 'Vị trí trên mARN',
    spec1Val: 'Đầu 5\'',
    spec2Label: 'Axit amin mã hóa',
    spec2Val: 'Methionine (Met)',
    spec3Label: 'Bộ ba kết thúc',
    spec3Val: 'UAA, UAG, UGA',
    fact: 'Toàn bộ sinh giới dùng chung một bảng mã di truyền, minh chứng thuyết phục về nguồn gốc chung của sự sống.',
    link: '#roadmap',
    linkText: 'Xem Lộ trình chuyên đề Sinh học',
  },
  {
    subject: 'Sinh học',
    badge: 'Quy luật Men-đen',
    symbol: '3:1',
    codeText: 'Aa × Aa',
    name: 'Quy luật phân li độc lập',
    category: 'Sinh học · Di truyền học cá thể',
    spec1Label: 'Tỉ lệ kiểu gen',
    spec1Val: '1 AA : 2 Aa : 1 aa',
    spec2Label: 'Tỉ lệ kiểu hình',
    spec2Val: '3 Trội : 1 Lặn',
    spec3Label: 'Khung phân tích',
    spec3Val: 'Bảng Punnett',
    fact: 'Gregor Mendel đặt nền móng cho di truyền học hiện đại qua các thí nghiệm lai đậu Hà Lan năm 1865.',
    link: '#roadmap',
    linkText: 'Xem Chuyên đề quy luật Men-đen',
  },
];

const DAILY_QUIZ_BANK = [
  // Hóa học
  {
    subject: 'Hóa học',
    q: 'Khi thủy phân phenyl axetat (CH₃COOC₆H₅) trong dung dịch NaOH dư đun nóng, tỉ lệ mol este : NaOH phản ứng là bao nhiêu?',
    o: ['1 : 1', '1 : 2', '1 : 3', '2 : 1'],
    a: 1,
    ex: 'Phenyl axetat là este của phenol. Phản ứng tạo 2 muối: CH₃COONa + C₆H₅ONa + H₂O nên tỉ lệ mol phản ứng là 1 : 2.',
  },
  {
    subject: 'Hóa học',
    q: 'Kim loại nào sau đây có tính dẫn điện tốt nhất trong các kim loại?',
    o: ['Đồng (Cu)', 'Bạc (Ag)', 'Vàng (Au)', 'Nhôm (Al)'],
    a: 1,
    ex: 'Thứ tự dẫn điện giảm dần: Ag > Cu > Au > Al > Fe. Bạc (Ag) dẫn điện tốt nhất.',
  },
  {
    subject: 'Hóa học',
    q: 'Dung dịch chất nào sau đây làm quỳ tím chuyển sang màu xanh?',
    o: ['Axit axetic', 'Anilin', 'Metylamin', 'Glyxin'],
    a: 2,
    ex: 'Metylamin (CH₃NH₂) có tính bazơ mạnh hơn amoniac nên làm quỳ tím hóa xanh; anilin có tính bazơ rất yếu không đổi màu quỳ.',
  },
  {
    subject: 'Hóa học',
    q: 'Kim loại Fe thụ động (không tác dụng) trong dung dịch nào sau đây ở nhiệt độ thường?',
    o: ['HCl loãng', 'H₂SO₄ loãng', 'HNO₃ đặc, nguội', 'CuSO₄'],
    a: 2,
    ex: 'Fe, Al, Cr bị thụ động hóa trong HNO₃ đặc nguội và H₂SO₄ đặc nguội do tạo màng oxit bảo vệ.',
  },
  // Vật lí
  {
    subject: 'Vật lí',
    q: 'Một con lắc lò xo gồm vật nặng m và lò xo có độ cứng k. Chu kỳ dao động điều hòa của con lắc là:',
    o: ['T = 2π√(k/m)', 'T = 2π√(m/k)', 'T = (1/2π)√(k/m)', 'T = 2π√(l/g)'],
    a: 1,
    ex: 'Công thức chu kỳ dao động con lắc lò xo: T = 2π√(m/k). Con lắc đơn mới là T = 2π√(l/g).',
  },
  {
    subject: 'Vật lí',
    q: 'Trong mạch điện xoay chiều RLC nối tiếp, hiện tượng cộng hưởng điện xảy ra khi nào?',
    o: ['Z_L = Z_C', 'Z_L > Z_C', 'R = Z_L', 'Z_L · Z_C = R²'],
    a: 0,
    ex: 'Hiện tượng cộng hưởng xảy ra khi cảm kháng bằng dung kháng Z_L = Z_C (tức ωL = 1/(ωC)), lúc này tổng trở Z_min = R.',
  },
  {
    subject: 'Vật lí',
    q: 'Trong thí nghiệm giao thoa ánh sáng Y-âng, khoảng vân i được xác định bằng công thức nào?',
    o: ['i = λa / D', 'i = λD / a', 'i = aD / λ', 'i = λ / (aD)'],
    a: 1,
    ex: 'Khoảng vân i = λD / a, trong đó λ là bước sóng ánh sáng, D là khoảng cách từ 2 khe đến màn, a là khoảng cách giữa 2 khe.',
  },
  {
    subject: 'Vật lí',
    q: 'Vận tốc truyền sóng v, bước sóng λ và chu kỳ T liên hệ với nhau theo công thức:',
    o: ['λ = v / T', 'λ = v · T', 'v = λ · T', 'λ = v · f²'],
    a: 1,
    ex: 'Bước sóng là quãng đường sóng truyền được trong một chu kỳ: λ = v·T = v/f.',
  },
  // Sinh học
  {
    subject: 'Sinh học',
    q: 'Theo nguyên tắc bổ sung trong cấu trúc phân tử ADN mạch kép, cặp bazơ nitơ nào liên kết bằng 3 liên kết hiđrô?',
    o: ['A và T', 'A và U', 'G và X', 'T và G'],
    a: 2,
    ex: 'Trên phân tử ADN, A liên kết với T bằng 2 liên kết hiđrô; G liên kết với X bằng 3 liên kết hiđrô.',
  },
  {
    subject: 'Sinh học',
    q: 'Trong các bộ ba mã di truyền trên phân tử mARN, bộ ba nào sau đây là bộ ba mở đầu quá trình dịch mã?',
    o: ['UAA', 'AUG', 'UAG', 'UGA'],
    a: 1,
    ex: 'AUG là bộ ba mở đầu (mã hóa Methionine ở sinh vật nhân thực). UAA, UAG, UGA là 3 bộ ba kết thúc không mã hóa axit amin.',
  },
  {
    subject: 'Sinh học',
    q: 'Cho phép lai P: Aa × Aa (trội hoàn toàn). Tỉ lệ phân li kiểu hình ở thế hệ con F₁ là:',
    o: ['1 Trội : 1 Lặn', '3 Trội : 1 Lặn', '100% Trội', '9 Trội : 7 Lặn'],
    a: 1,
    ex: 'Phép lai Aa × Aa cho tỉ lệ kiểu gen 1 AA : 2 Aa : 1 aa, do gen A trội hoàn toàn nên tỉ lệ kiểu hình là 3 Trội : 1 Lặn (75% : 25%).',
  },
];

function DailyDiscoverySection() {
  // Widget A: Tri thức KHTN hôm nay
  const [elemIdx, setElemIdx] = useState(() => Math.floor(Math.random() * KHTN_DISCOVERY_BANK.length));
  const curElem = KHTN_DISCOVERY_BANK[elemIdx];

  const handleNextElem = () => {
    setElemIdx((prev) => (prev + 1) % KHTN_DISCOVERY_BANK.length);
  };

  // Widget B: Thử thách KHTN 10 giây
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
    <section className="ns9-discovery-wrap" aria-label="Góc khám phá và micro-learning Khoa học Tự nhiên mỗi ngày">
      <div className="ns9-discovery-grid">
        {/* THẺ A: TRI THỨC KHTN HÔM NAY */}
        <article className="ns9-disc-card ns9-elem-card">
          {/* Linh vật trang trí góc thẻ */}
          <div className="ns9-elem-mascot-sticker" title="Elec Khám phá KHTN">
            <img src="/img/elec/elec-heart-eyes.png" alt="Elec Yêu KHTN" className="ns9-elem-sticker-img" />
          </div>

          <div className="ns9-disc-head">
            <span className="ns9-disc-badge">{curElem.badge} · {curElem.subject}</span>
            <button
              type="button"
              className="ns9-disc-ghost"
              onClick={handleNextElem}
              title="Khám phá một tri thức KHTN ngẫu nhiên khác"
            >
              <IcoRefresh size={14} />
              <span>Đổi chủ đề</span>
            </button>
          </div>

          <div className="ns9-element-main">
            <div className="ns9-element-tile" aria-hidden="true">
              <small>{curElem.codeText}</small>
              <b>{curElem.symbol}</b>
              <span>{curElem.subject}</span>
            </div>
            <div className="ns9-element-title">
              <h3>{curElem.name}</h3>
              <p className="ns9-element-cat">{curElem.category}</p>
            </div>
          </div>

          <dl className="ns9-element-specs">
            <div>
              <dt>{curElem.spec1Label}</dt>
              <dd>{curElem.spec1Val}</dd>
            </div>
            <div>
              <dt>{curElem.spec2Label}</dt>
              <dd>{curElem.spec2Val}</dd>
            </div>
            <div className="full-width">
              <dt>{curElem.spec3Label}</dt>
              <dd>{curElem.spec3Val}</dd>
            </div>
          </dl>

          <p className="ns9-element-fact">
            <b>Bạn có biết?</b> {curElem.fact}
          </p>

          <a href={curElem.link} className="ns9-element-cta">
            <span>{curElem.linkText}</span>
            <IcoArrow size={14} />
          </a>
        </article>

        {/* THẺ B: THỬ THÁCH KHTN 10 GIÂY */}
        <article className="ns9-disc-card ns9-quiz-card">
          <div className="ns9-disc-head">
            <span className="ns9-disc-badge" style={{ background: 'rgba(255, 149, 0, 0.12)', color: '#ff9500' }}>
              Thử sức 10 giây · {curQ.subject}
            </span>
            <span className="ns9-quiz-score-tag">
              Đúng: <b>{stats.ok}/{stats.total}</b> · Chuỗi: <b>{stats.streak}</b>
            </span>
          </div>

          {/* Linh vật tương tác theo trạng thái trả lời trắc nghiệm */}
          <div className="ns9-quiz-mascot-row">
            {picked === null && (
              <>
                <img src="/img/elec/elec-suspicious.png" alt="Elec Soi Bẫy" className="ns9-quiz-mascot-img" />
                <span className="ns9-quiz-speech-bubble">Coi chừng bị gài bẫy đó nha! Chọn nhanh xem nào!</span>
              </>
            )}
            {picked !== null && picked === curQ.a && (
              <>
                <img src="/img/elec/elec-celebrate.png" alt="Elec Ăn Mừng" className="ns9-quiz-mascot-img" />
                <span className="ns9-quiz-speech-bubble is-right">Chuẩn không cần chỉnh! +10 XP xuất sắc!</span>
              </>
            )}
            {picked !== null && picked !== curQ.a && (
              <>
                <img src="/img/elec/elec-fighting.png" alt="Elec Cố Lên" className="ns9-quiz-mascot-img" />
                <span className="ns9-quiz-speech-bubble is-wrong">Tiếc quá! Đọc giải thích bên dưới để nhớ dai nhé!</span>
              </>
            )}
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
      <div className="ns9-ch-mascot-box">
        <img src="/img/elec/elec-hello.png" alt="Elec Waving" className="ns9-ch-mascot-img" />
        <div className="ns9-ch-speech-bubble">Nhập mã vào thi cùng lớp nè!</div>
      </div>

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
  const [heroStratModalOpen, setHeroStratModalOpen] = useState(false);
  const [heroOnboardModalOpen, setHeroOnboardModalOpen] = useState(false);
  const [homeDiagOpen, setHomeDiagOpen] = useState(false);

  useEffect(() => subscribeRoadmap(() => setTick((n) => n + 1)), []);
  useEffect(() => subscribeCards(() => setTick((n) => n + 1)), []);
  useEffect(() => subscribeAspirationChanges(() => setTick((n) => n + 1)), []);
  useEffect(() => {
    const onOpenAsp = () => setHeroOnboardModalOpen(true);
    window.addEventListener('elec-open-aspirations-modal', onOpenAsp);
    return () => window.removeEventListener('elec-open-aspirations-modal', onOpenAsp);
  }, []);

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
      aspirations: aspState.aspirations || [],
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
    if (rmData?.customPrompt) {
      askAI(rmData.customPrompt, gradeKey);
      return;
    }
    const asp = rmData?.activeAsp;
    const targetLine = asp
      ? `Nguyện vọng 1: ${asp?.school?.code || 'ĐH'} - ${asp?.school?.name || 'Trường Đại học'} (${asp?.major?.name || 'Ngành xét tuyển'}), Điểm mục tiêu ${asp?.targetScore ?? 24}/${rmData.examScale} (Môn KHTN cần đạt ${rmData.targetChem10}/10).`
      : 'Mục tiêu: Chinh phục kỳ thi THPT Quốc gia các môn Khoa học Tự nhiên.';
    askAI(
      `Đóng vai Gia sư KHTN ELEC AI (xưng "mình – bạn"), hãy lập kế hoạch học tập tuần này giúp mình bám sát mục tiêu:\n${targetLine}\n` +
      `Điểm KHTN dự đoán hiện tại: ${rmData?.hasEvidence ? rmData.predictedChem10 : 'Chưa đo'}/10 · Tiến độ: ${rmData?.paceStatus}.`,
      gradeKey,
    );
  };

  const handleOpenWishHero = () => {
    if (roadmapSnapshot.activeAsp) {
      setHeroStratModalOpen(true);
    } else {
      setHeroOnboardModalOpen(true);
    }
  };

  return (
    <div className="db-bento-wrap ns9-home-wrap">
      <div className="db-bento-ambient" aria-hidden="true" />

      <div className="ns9-home-container">
        {/* 1. UNIFIED AI CAMPUS HERO: AI CHÍNH LÊN ĐẦU, BÊN CẠNH LÀ HÌNH ẢNH (CHỈ HIỆN ẢNH KHI ĐÃ CHỌN TRƯỜNG) */}
        <UnifiedAiCampusHero
          hello={hello}
          name={name}
          activeAsp={roadmapSnapshot.activeAsp}
          onOpenWishHero={handleOpenWishHero}
        />

        {/* 3. THẺ "LỘ TRÌNH CỦA EM": 4 CHỈ SỐ VÀNG + BIỂU ĐỒ NĂNG LỰC */}
        <AspirationRoadmapHub
          uid={uid}
          overview={roadmapSnapshot.view.overview}
          chapters={roadmapSnapshot.view.chapters}
          dueTotal={roadmapSnapshot.dueTotal}
          cardsDue={roadmapSnapshot.cardsDue}
          events={roadmapSnapshot.events}
          hideTopBanner
          hideQuickNavTrio
          onOpenChapter={handleOpenChapterFromHome}
          onPracticeChapter={handleOpenChapterFromHome}
          onReviewChapter={handleOpenChapterFromHome}
          onAiStrategy={handleAiStrategyFromHome}
          onOpenDiagnostic={() => setHomeDiagOpen(true)}
        />

        {/* 4. BA THẺ BENTO TRỌNG TÂM VỚI LINH VẬT ELEC 3 TƯ THẾ ĐẸP MẮT */}
        <HomeBentoThreeCards />

        {/* 6. MA TRẬN HỌC TẬP & THỰC HÀNH KHOA HỌC TỰ NHIÊN CHUYÊN SÂU */}
        <ChemistryStudyMatrix />

        {/* 7. GÓC KHÁM PHÁ & MICRO-LEARNING KHOA HỌC TỰ NHIÊN MỖI NGÀY */}
        <DailyDiscoverySection />

        {/* 8. PHÒNG THI & LỚP HỌC TRỰC TUYẾN */}
        <ClassroomAndJoinBar />
      </div>

      {/* Modal AI Chiến lược khi bấm vào thẻ Nguyện vọng 1 ở Hero */}
      <AspirationAiStrategyModal
        isOpen={heroStratModalOpen}
        onClose={() => setHeroStratModalOpen(false)}
        uid={uid}
        activeAspiration={roadmapSnapshot.activeAsp}
        aspirations={roadmapSnapshot.aspirations}
        overview={roadmapSnapshot.view.overview}
        events={roadmapSnapshot.events}
        predictedScore={24.5}
        targetScore={roadmapSnapshot.activeAsp?.targetScore || 24.5}
        examScale={30}
        onAskAiTutor={(prompt) => askAI(prompt, gradeKey)}
        onStrategyApplied={() => setTick((n) => n + 1)}
      />

      {/* Modal Onboarding chọn nguyện vọng nếu chưa có NV */}
      <ElecTutorOnboardingModal
        open={heroOnboardModalOpen}
        uid={uid}
        onClose={() => setHeroOnboardModalOpen(false)}
        onCompleted={() => setTick((n) => n + 1)}
        onStartDiagnostic={() => {
          setHeroOnboardModalOpen(false);
          setHomeDiagOpen(true);
        }}
      />

      {/* Modal Test chẩn đoán đầu vào (12 câu) chuẩn ma trận */}
      <DiagnosticTestModal
        open={homeDiagOpen}
        uid={uid}
        levelKey={gradeKey}
        chapters={roadmapSnapshot.view?.chapters || []}
        onClose={() => setHomeDiagOpen(false)}
        onCompleted={() => {
          setTick((n) => n + 1);
        }}
      />
    </div>
  );
}
