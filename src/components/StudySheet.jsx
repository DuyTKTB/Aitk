import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { useLiveStreak } from '../hooks.js';
import {
  IconMicroscope, IconScale, IconTimer,
  IconCalendar, IconNote, IconTarget, IconQuiz,
  IconGamepad, IconUser, IconCalc,
  IconAtom, IconChart, IconClose, IconLogout,
  IconRobot,
} from './Icons.jsx';

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

const CORE_TOOLS = [
  { id: 'table', name: 'Bảng tuần hoàn', desc: '118 nguyên tố tương tác', Icon: IconAtom },
  { id: 'notebook', name: 'Sổ tay lỗi sai', desc: 'Luyện câu làm sai', Icon: IconNotebook },
  { id: 'formulas', name: 'Công thức nhanh', desc: 'Mol, pH, vô cơ, hữu cơ', Icon: IconCalc },
  { id: 'balance', name: 'Cân bằng PTHH', desc: 'Cân bằng phương trình', Icon: IconScale },
  { id: 'analyze', name: 'Phân tích hợp chất', desc: 'Nhận diện chất', Icon: IconMicroscope },
  { id: 'pomodoro', name: 'Clock Hub', desc: 'Pomodoro & hẹn giờ', Icon: IconTimer },
  { id: 'schedule', name: 'Thời khóa biểu', desc: 'Lịch học thông minh', Icon: IconCalendar },
  { id: 'grade', name: 'Tính điểm GPA', desc: 'Tính điểm học tập', Icon: IconTarget },
  { id: 'notes', name: 'Ghi chú', desc: 'Ghi chép bài học', Icon: IconNote },
  { id: 'quiz', name: 'Ôn tập Quiz', desc: 'Trắc nghiệm thông minh', Icon: IconQuiz },
  { id: 'games', name: 'Trò chơi Hóa', desc: '7 mini games giải trí', Icon: IconGamepad },
];

export default function StudySheet({ open, onClose }) {
  const { user, tier, logout } = useAuth();
  const { count: streakDays, hasStreakToday } = useLiveStreak();

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

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Học sinh';
  const initial = displayName.charAt(0).toUpperCase();
  const isVip = tier?.key === 'vip';

  return createPortal(
    <>
      <div className="ss-backdrop" onClick={onClose} aria-hidden="true" />

      <div className="ss-sheet" role="dialog" aria-modal="true" aria-label="Menu chức năng ELEC AI">
        <div className="ss-grabber" aria-hidden="true" />

        <header className="ss-head">
          <div className="ss-head-title-wrap">
            <h2>Khám phá & Tiện ích</h2>
            <span className="ss-head-subtitle">Toàn bộ tính năng học tập ELEC AI</span>
          </div>
          <button type="button" className="ss-close" onClick={onClose} aria-label="Đóng menu">
            <IconClose size={18} />
          </button>
        </header>

        <div className="ss-content-scroll">
          {/* ----- 1. THẺ HỒ SƠ NGƯỜI DÙNG NHANH ----- */}
          <div className="ss-profile-card">
            <div className="ss-avatar" style={{ '--av': '#2f6bff' }}>
              {user?.photoURL ? (
                <img src={user.photoURL} alt={displayName} />
              ) : (
                <span>{initial}</span>
              )}
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
                  🔥 {streakDays} ngày
                </span>
                <span className="ss-dot">•</span>
                <a href="#profile" className="ss-profile-link" onClick={onClose}>
                  Xem hồ sơ đầy đủ →
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
                <small>Giải Hóa từng bước & chấm bài tự động</small>
              </div>
            </a>

            <a href="#leaderboard" className="ss-hl-card ss-hl-lb" onClick={onClose}>
              <div className="ss-hl-icon lb">
                <IconChart size={22} />
              </div>
              <div className="ss-hl-info">
                <b>Bảng xếp hạng</b>
                <small>Vinh danh chuỗi lớp & học sinh bền bỉ</small>
              </div>
            </a>
          </div>

          {/* ----- 3. LƯỚI CÔNG CỤ HỌC TẬP ----- */}
          <div className="ss-section-label">Công cụ học tập & Tiện ích</div>
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
          <div className="ss-section-label">Hệ thống & Cài đặt</div>
          <div className="ss-system-row">
            <a href="#settings" className="ss-sys-btn" onClick={onClose}>
              <IconSettings size={17} />
              <span>Cài đặt</span>
            </a>
            <a href="#feedback" className="ss-sys-btn" onClick={onClose}>
              <IconChatHeart size={17} />
              <span>Góp ý & Báo lỗi</span>
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
