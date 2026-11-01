import { motion } from 'motion/react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useLiveStreak } from '../hooks.js';
import StudyGoalNavDropdown from './aspiration/StudyGoalNavDropdown.jsx';
import UserProfileNavDropdown from './UserProfileNavDropdown.jsx';
import { LOGO_GLIDE_TRANSITION, useElecIntro } from './ElecIntroLoader.jsx';
import '../styles/nav-dropdowns.css';

/* ============================================================
   MOBILE HEADER — chỉ hiện trên mobile (< 768px)
   Bố cục tối ưu, không tràn ở 360px:
     [Logo] [Mục tiêu kỳ thi] [🔥 Chuỗi] [⚡ XP] [Tìm kiếm] [Theme] [Menu]
   ============================================================ */
export default function MobileHeader({ page, theme, userRole = 'student', isPro = false, credits, onSearch, onToggleTheme }) {
  const { user, logout } = useAuth();
  const { count: streakCount, isToday: hasStreakToday } = useLiveStreak();
  const { playing: introPlaying } = useElecIntro();
  const isTeacher = isPro && userRole === 'teacher';

  return (
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

      {/* ----- GIỮA: Nút chọn Kỳ thi & Nguyện vọng (học sinh) ----- */}
      {!isTeacher && (
        <div className="mhead-goal-slot">
          <StudyGoalNavDropdown uid={user?.uid} autoOpenForNewStudent={false} />
        </div>
      )}

      {/* ----- BÊN PHẢI: Chuỗi 🔥 + XP ⚡ + Tìm kiếm + Theme + Profile ----- */}
      <div className="mhead-right">
        {/* Chip chuỗi ngày lửa cam */}
        <a
          href="#leaderboard"
          className={`mhead-streak-pill ${hasStreakToday ? 'is-active' : 'is-idle'}`}
          onClick={(e) => {
            window.dispatchEvent(new CustomEvent('elec-close-nav-dropdowns'));
            if (window.location.hash === '#leaderboard') {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
              window.dispatchEvent(new HashChangeEvent('hashchange'));
            }
          }}
          title={hasStreakToday ? `Chuỗi ${streakCount} ngày (Đã giữ chuỗi 🔥) — Xem Bảng xếp hạng` : `Chuỗi ${streakCount} ngày (Chưa học) — Xem Bảng xếp hạng`}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className={`mhead-streak-svg anim-ico-svg anim-ico-flame ${hasStreakToday ? 'active' : 'idle'}`} aria-hidden="true">
            <path d="M12 2c1.5 3.5 4 5.5 4 9a4 4 0 0 1-8 0c0-1.5.5-3 1.2-4.2C8 8.5 6 11 6 14a6 6 0 0 0 12 0c0-5-3.5-8.5-6-12z" />
          </svg>
          <span>{streakCount}</span>
        </a>

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
          <span>{credits != null ? (credits >= 1000 ? `${(credits / 1000).toFixed(1)}k` : credits) : '0'}</span>
        </button>

        {/* Nút tìm kiếm nhanh mở Command Palette toàn màn hình */}
        <button
          type="button"
          className="mhead-btn mhead-search-btn"
          onClick={onSearch}
          aria-label="Tìm kiếm nhanh toàn hệ thống"
          title="Tìm kiếm nhanh toàn hệ thống"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className="anim-ico-svg anim-ico-search" aria-hidden="true">
            <circle cx="11" cy="11" r="7.5" />
            <line x1="20.5" y1="20.5" x2="16.2" y2="16.2" />
          </svg>
        </button>

        {/* Avatar Profile Dropdown */}
        <UserProfileNavDropdown
          user={user}
          page={page}
          isTeacher={isTeacher}
          onLogout={logout}
        />
      </div>
    </header>
  );
}
