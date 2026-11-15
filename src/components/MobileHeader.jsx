import { motion } from 'motion/react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useLiveStreak } from '../hooks.js';
import UserProfileNavDropdown from './UserProfileNavDropdown.jsx';
import SubjectSwitcher from './SubjectSwitcher.jsx';
import { LOGO_GLIDE_TRANSITION, useElecIntro } from './ElecIntroLoader.jsx';
import '../styles/nav-dropdowns.css';

function formatCompactCredits(val) {
  const num = Number(val);
  if (!Number.isFinite(num) || num <= 0) return '0';
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (num >= 10_000) return `${Math.round(num / 1_000)}k`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(num);
}

/* ============================================================
   MOBILE HEADER — chỉ hiện trên mobile (< 768px)
   Bố cục tinh gọn, chuẩn Apple HIG, không tràn ở 320px–430px:
     [Logo ELEC AI]          [Chuỗi] [XP] [Chat] [Tìm] [Theme] [Avatar]
     [Thanh chọn môn KHTN: KHTN | Vật lí | Hóa học | Sinh học]
   ============================================================ */
export default function MobileHeader({ page, theme, userRole = 'student', isPro = false, credits, onSearch, onToggleTheme }) {
  const { user, logout } = useAuth();
  const { count: streakCount, isToday: hasStreakToday } = useLiveStreak();
  const { playing: introPlaying } = useElecIntro();
  const isTeacher = Boolean(isPro || userRole === 'teacher');

  return (
    <div className="mhead-sticky-container">
      <header className="mhead-bar" style={{ display: 'flex' }}>
        {/* ----- BÊN TRÁI: Logo ELEC AI ----- */}
        <a href="#home" className="mhead-logo" aria-label="Trang chủ ELEC AI">
          {!introPlaying && (
            <motion.div
              layoutId="elec-brand-logo"
              transition={{ layout: LOGO_GLIDE_TRANSITION }}
              className="nav-logo-motion-wrap"
            >
              <img
                src="/img/logo.png"
                alt="ELEC AI"
              />
            </motion.div>
          )}
        </a>

        {/* ----- BÊN PHẢI: Chuỗi + XP + Chat + Tìm kiếm + Theme + Profile ----- */}
        <div className="mhead-right">
          {/* Chip chuỗi ngày lửa cam */}
          <button
            type="button"
            className={`mhead-streak-pill ${hasStreakToday ? 'is-active' : 'is-idle'}`}
            onClick={(e) => {
              e.preventDefault();
              window.dispatchEvent(new CustomEvent('elec-close-nav-dropdowns'));
              window.dispatchEvent(new CustomEvent('elec-open-streak-modal'));
            }}
            title={hasStreakToday ? `Chuỗi ${streakCount} ngày (Đã giữ chuỗi hôm nay) — Xem Bảo vệ chuỗi` : `Chuỗi ${streakCount} ngày (Chưa học) — Xem Bảo vệ chuỗi`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className={`mhead-streak-svg anim-ico-svg anim-ico-flame ${hasStreakToday ? 'active' : 'idle'}`} aria-hidden="true">
              <path d="M12 2c1.5 3.5 4 5.5 4 9a4 4 0 0 1-8 0c0-1.5.5-3 1.2-4.2C8 8.5 6 11 6 14a6 6 0 0 0 12 0c0-5-3.5-8.5-6-12z" />
            </svg>
            <span>{streakCount}</span>
          </button>

          {/* Chip XP / Credits */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('elec-open-credit-topup'))}
            className="mhead-credit-pill"
            title="Điểm AI / XP của bạn — Bấm nạp ELEC AI Credit"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="anim-ico-svg anim-ico-zap" aria-hidden="true">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span>{formatCompactCredits(credits)}</span>
          </button>

          {/* Nút Chat cộng đồng học tập ELEC AI trên Mobile */}
          <button
            type="button"
            className="mhead-btn mhead-icon-circle"
            onClick={() => window.dispatchEvent(new CustomEvent('elec-open-community-chat'))}
            aria-label="Chat cộng đồng học tập ELEC AI"
            title="Chat cộng đồng học tập ELEC AI (Hỏi bài, giao lưu & học nhóm)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <circle cx="8" cy="10" r="1.1" fill="currentColor" />
              <circle cx="12" cy="10" r="1.1" fill="currentColor" />
              <circle cx="16" cy="10" r="1.1" fill="currentColor" />
            </svg>
          </button>

          {/* Nút tìm kiếm nhanh mở Command Palette toàn màn hình */}
          <button
            type="button"
            className="mhead-btn mhead-icon-circle mhead-search-btn"
            onClick={onSearch}
            aria-label="Tìm kiếm nhanh toàn hệ thống"
            title="Tìm kiếm nhanh toàn hệ thống"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className="anim-ico-svg anim-ico-search" aria-hidden="true">
              <circle cx="11" cy="11" r="7.5" />
              <line x1="20.5" y1="20.5" x2="16.2" y2="16.2" />
            </svg>
          </button>

          {/* Nút Đổi giao diện Sáng / Tối nhanh trên Mobile */}
          {typeof onToggleTheme === 'function' && (
            <button
              type="button"
              className="mhead-btn mhead-icon-circle"
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
              title={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
            >
              {theme === 'dark' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
          )}

          {/* Avatar Profile Dropdown */}
          <UserProfileNavDropdown
            user={user}
            page={page}
            isTeacher={isTeacher}
            onLogout={logout}
          />
        </div>
      </header>

      {/* Dải chọn môn KHTN trên mobile */}
      <div className="mhead-subject-strip">
        <SubjectSwitcher compact />
      </div>
    </div>
  );
}
