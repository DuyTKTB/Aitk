import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { useLiveStreak } from '../hooks.js';
import {
  IconMicroscope, IconScale, IconTimer,
  IconCalendar, IconNote, IconTarget, IconQuiz,
  IconGamepad, IconCalc,
  IconAtom, IconChart, IconClose, IconLogout,
  IconRobot,
} from './Icons.jsx';
import UserAvatar from './UserAvatar.jsx';

const IconNotebook = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="M9 3v18" />
    <path d="M12 8h4M12 12h4" />
  </svg>
);

const IconSettings = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const IconChatHeart = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <path d="M12 12.5c-1.5-1.2-2.5-2.2-2.5-3.2A1.5 1.5 0 0 1 12 8.2a1.5 1.5 0 0 1 2.5 1.1c0 1-1 2-2.5 3.2z" />
  </svg>
);

const IconFlame = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2c1.5 3.5 4 5.5 4 9a4 4 0 0 1-8 0c0-1.5.5-3 1.2-4.2C8 8.5 6 11 6 14a6 6 0 0 0 12 0c0-5-3.5-8.5-6-12z" />
  </svg>
);

const IconSun = ({ size = 17 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
);

const IconMoon = ({ size = 17 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const CORE_TOOLS = [
  { id: 'sim-lab', name: 'Mô phỏng Lý & Sinh', desc: 'Mạch RLC, Y-âng, Đột biến ADN', Icon: IconMicroscope },
  { id: 'chalkboard', name: 'Bảng phấn 3D', desc: 'Hình không gian & Voice Tutor', Icon: IconScale },
  { id: 'table', name: 'Bảng tuần hoàn', desc: '118 nguyên tố tương tác IUPAC', Icon: IconAtom },
  { id: 'notebook', name: 'Sổ tay lỗi sai', desc: 'Luyện câu sai & Đề 5 Phút', Icon: IconNotebook },
  { id: 'admission', name: 'Điểm chuẩn & Năng lực', desc: 'Đo độ vừa sức vào trường ĐH', Icon: IconTarget },
  { id: 'career', name: 'Hướng nghiệp AI', desc: 'Test RIASEC & định hướng ngành', Icon: IconNotebook },
  { id: 'doc-studio', name: 'AI Doc Studio', desc: 'Tạo quiz & học từ tài liệu', Icon: IconNote },
  { id: 'formulas', name: 'Công thức KHTN', desc: 'Sổ tay công thức Lý · Hóa · Sinh', Icon: IconCalc },
  { id: 'balance', name: 'Cân bằng PTHH', desc: 'Cân bằng phương trình đại số', Icon: IconScale },
  { id: 'analyze', name: 'Phân tích hợp chất', desc: 'Nhận diện chất & phản ứng', Icon: IconMicroscope },
  { id: 'pomodoro', name: 'Clock Hub', desc: 'Pomodoro & đồng hồ thi', Icon: IconTimer },
  { id: 'schedule', name: 'Thời khóa biểu', desc: 'Lịch học KHTN thông minh', Icon: IconCalendar },
  { id: 'stats', name: 'Thống kê năng lực', desc: 'Điểm Elo & tiến độ 3 môn', Icon: IconChart },
  { id: 'grade', name: 'Tính điểm xét tuyển', desc: 'Tính GPA & điểm khối A, B, D', Icon: IconTarget },
  { id: 'notes', name: 'Ghi chú', desc: 'Note dán học tập', Icon: IconNote },
  { id: 'games', name: 'Trò chơi Khoa học', desc: 'Mini game & Lab ảo 3D', Icon: IconGamepad },
];

export default function StudySheet({ open, onClose, theme = 'dark', onToggleTheme }) {
  const { user, tier, logout } = useAuth();
  const { count: streakDays, isToday: hasStreakToday } = useLiveStreak();

  useEffect(() => {
    if (!open) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Học sinh ELEC AI';
  const isVip = tier?.key === 'vip';

  return createPortal(
    <>
      <div className="ss-backdrop" onClick={onClose} aria-hidden="true" />

      <div className="ss-sheet" role="dialog" aria-modal="true" aria-label="Menu chức năng ELEC AI">
        <div className="ss-grabber" aria-hidden="true" />

        <header className="ss-head">
          <div className="ss-head-brand">
            <img
              src="/img/elec/elec-cool.png"
              alt="Bé Elec"
              className="ss-head-mascot"
            />
            <div className="ss-head-title-wrap">
              <h2>Khám phá &amp; Tiện ích KHTN</h2>
              <span className="ss-head-subtitle">Hệ sinh thái Vật lí · Hóa học · Sinh học cùng Bé Elec</span>
            </div>
          </div>
          <button type="button" className="ss-close" onClick={onClose} aria-label="Đóng menu">
            <IconClose size={18} />
          </button>
        </header>

        <div className="ss-content-scroll">
          {/* ----- 1. THẺ HỒ SƠ NGƯỜI DÙNG NHANH ----- */}
          <div className="ss-profile-card">
            <div className="ss-avatar" style={{ '--av': '#2f6bff', background: 'transparent' }}>
              <UserAvatar user={user} size={44} title={displayName} />
            </div>
            <div className="ss-profile-meta">
              <div className="ss-profile-name-row">
                <b>{displayName}</b>
                <span className={`ss-vip-badge ${isVip ? 'vip' : 'free'}`}>
                  {isVip ? 'VIP' : 'Free'}
                </span>
              </div>
              <div className="ss-profile-sub">
                <span className={`ss-streak-tag ${hasStreakToday ? 'active' : 'idle'}`}>
                  <IconFlame size={13} />
                  <span>{streakDays} ngày</span>
                </span>
                <span className="ss-dot">•</span>
                <a href="#profile" className="ss-profile-link" onClick={onClose}>
                  Xem hồ sơ đầy đủ
                </a>
              </div>
            </div>
          </div>

          {/* ----- 2. HAI LỐI VÀO NỔI BẬT: TRỢ LÝ AI & BẢNG XẾP HẠNG ----- */}
          <div className="ss-highlights-grid">
            <a href="#ai" className="ss-hl-card ss-hl-ai" onClick={onClose}>
              <div className="ss-hl-icon ai">
                <IconRobot size={22} />
              </div>
              <div className="ss-hl-info">
                <b>Trợ lý ELEC AI</b>
                <small>Giải Lý · Hóa · Sinh &amp; Chấm nháp viết tay</small>
              </div>
            </a>

            <a href="#leaderboard" className="ss-hl-card ss-hl-lb" onClick={onClose}>
              <div className="ss-hl-icon lb">
                <IconChart size={22} />
              </div>
              <div className="ss-hl-info">
                <b>Bảng xếp hạng</b>
                <small>Vinh danh chuỗi lớp &amp; học sinh toàn quốc</small>
              </div>
            </a>
          </div>

          {/* ----- 3. LƯỚI CÔNG CỤ HỌC TẬP ----- */}
          <div className="ss-section-label">Công cụ Khoa học Tự nhiên &amp; AI</div>
          <nav className="ss-list">
            {CORE_TOOLS.map(({ id, name, desc, Icon }) => (
              <a key={id} href={'#' + id} className="ss-item" onClick={onClose}>
                <span className="ss-item-ico"><Icon size={20} /></span>
                <div className="ss-item-text">
                  <span className="ss-item-name">{name}</span>
                  <span className="ss-item-desc">{desc}</span>
                </div>
              </a>
            ))}
          </nav>

          {/* ----- 4. HÀNG THAO TÁC HỆ THỐNG ----- */}
          <div className="ss-section-label">Giao diện &amp; Hệ thống</div>
          <div className="ss-system-row">
            {typeof onToggleTheme === 'function' && (
              <button
                type="button"
                className="ss-sys-btn"
                onClick={onToggleTheme}
              >
                {theme === 'dark' ? <IconSun size={17} /> : <IconMoon size={17} />}
                <span>{theme === 'dark' ? 'Giao diện Sáng' : 'Giao diện Tối'}</span>
              </button>
            )}
            <a href="#settings" className="ss-sys-btn" onClick={onClose}>
              <IconSettings size={17} />
              <span>Cài đặt</span>
            </a>
            <a href="#feedback" className="ss-sys-btn" onClick={onClose}>
              <IconChatHeart size={17} />
              <span>Góp ý &amp; Báo lỗi</span>
            </a>
            {user && (
              <button
                type="button"
                className="ss-sys-btn ss-logout-btn"
                onClick={() => {
                  onClose();
                  logout();
                }}
              >
                <IconLogout size={17} />
                <span>Đăng xuất</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
