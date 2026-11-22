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

const SUBPAGE_TITLES = {
  'table': 'Bảng tuần hoàn IUPAC',
  'sim-lab': 'Lab Mô phỏng Lý & Sinh',
  'chalkboard': 'Bảng phấn 3D & Voice AI',
  'notebook': 'Sổ tay lỗi sai & Đề 5 Phút',
  'admission': 'Điểm chuẩn & Độ vừa sức',
  'career': 'Hướng nghiệp AI (RIASEC)',
  'doc-studio': 'AI Doc Studio',
  'formulas': 'Sổ tay Công thức KHTN',
  'balance': 'Cân bằng PTHH',
  'analyze': 'Phân tích Hợp chất',
  'pomodoro': 'Đồng hồ Pomodoro & Thi',
  'schedule': 'Thời khóa biểu KHTN',
  'stats': 'Thống kê Năng lực Elo',
  'grade': 'Tính điểm Xét tuyển ĐH',
  'notes': 'Ghi chú học tập',
  'games': 'Trò chơi Khoa học',
  'profile': 'Hồ sơ cá nhân',
  'settings': 'Cài đặt ứng dụng',
  'leaderboard': 'Bảng xếp hạng Toàn quốc',
  'feedback': 'Góp ý & Báo lỗi',
  'tools': 'Kho công cụ KHTN',
  'exam': 'Đếm ngược Kỳ thi THPT',
};

const MAIN_TAB_PAGES = new Set([
  '',
  'home',
  'virtual-exams',
  'quiz',
  'roadmap',
  'classroom',
  'my-classes',
]);

const SUBJECT_STRIP_PAGES = new Set([
  '',
  'home',
  'virtual-exams',
  'quiz',
  'roadmap',
  'formulas',
  'notebook',
]);

/* ============================================================
   MOBILE HEADER — chỉ hiện trên mobile (< 768px)
   Chuẩn Native iOS / Super-App:
     - Màn hình chính (Main Tabs): [Logo]   [Chuỗi] [XP] [Chat] [Tìm] [Avatar]
     - Màn hình con (Sub-screens): [< Quay lại]   [Tên màn hình]   [Tiện ích] [AI]
     - Thanh chọn môn Segmented Control: chỉ hiện ở các màn hình học tập KHTN
   ============================================================ */
export default function MobileHeader({ page, theme, userRole = 'student', isPro = false, credits, onSearch, onToggleTheme, onMenu }) {
  const { user, logout } = useAuth();
  const { count: streakCount, isToday: hasStreakToday } = useLiveStreak();
  const { playing: introPlaying } = useElecIntro();
  const isTeacher = Boolean(isPro || userRole === 'teacher');

  const cleanPage = (page || 'home').split('?')[0];
  const isMainTab = MAIN_TAB_PAGES.has(cleanPage);
  const showSubjectStrip = SUBJECT_STRIP_PAGES.has(cleanPage);
  const subpageTitle = SUBPAGE_TITLES[cleanPage]
    || (cleanPage.startsWith('games/') ? 'Trò chơi Khoa học' : null)
    || (cleanPage.startsWith('truong/') ? 'Chi tiết Trường Đại học' : null)
    || 'Tiện ích ELEC AI';

  const handleBack = () => {
    if (window.history.length > 2) {
      window.history.back();
    } else {
      window.location.hash = '#home';
    }
  };

  return (
    <div className="mhead-sticky-container">
      {isMainTab ? (
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

          {/* ----- BÊN PHẢI: Chuỗi + XP + Chat + Tìm kiếm + Avatar ----- */}
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
              title={hasStreakToday ? `Chuỗi ${streakCount} ngày (Đã giữ chuỗi hôm nay)` : `Chuỗi ${streakCount} ngày (Chưa học hôm nay)`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={`mhead-streak-svg anim-ico-svg anim-ico-flame ${hasStreakToday ? 'active' : 'idle'}`} aria-hidden="true">
                <path d="M12 2.2C14.8 5.4 18.5 8.7 18.5 14A6.5 6.5 0 0 1 5.5 14C5.5 11.4 6.8 9.2 8.2 7.8C8.2 9.5 9.1 10.6 10.2 11.1C9.7 8.2 10.4 4.9 12 2.2Z" fill={hasStreakToday || streakCount > 0 ? '#f97316' : '#94a3b8'} />
                <path d="M12.2 11.2C13.6 12.6 14.6 13.9 14.6 15.6A2.6 2.6 0 0 1 9.4 15.6C9.4 14.2 10.3 12.7 12.2 11.2Z" fill={hasStreakToday || streakCount > 0 ? '#fde047' : '#cbd5e1'} />
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
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="anim-ico-svg anim-ico-zap" aria-hidden="true">
                <path d="M13.3 2.3 4.9 13.2h6.3l-1 8.5L19.1 10.8h-6.3l.5-8.5Z" fill="currentColor" />
                <path d="M13 4.8 7.8 11.8h4.1l-.4 4.5 5-5.5h-3.9l.4-6Z" fill="#38bdf8" opacity="0.55" />
              </svg>
              <span>{formatCompactCredits(credits)}</span>
            </button>

            {/* Nút Chat cộng đồng học tập ELEC AI trên Mobile */}
            <button
              type="button"
              className="mhead-btn mhead-icon-circle"
              onClick={() => window.dispatchEvent(new CustomEvent('elec-open-community-chat'))}
              aria-label="Chat cộng đồng học tập ELEC AI"
              title="Chat cộng đồng học tập ELEC AI"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M16.8 11.8a2.2 2.2 0 0 1-2.2 2.2H7L3.5 17V5.2A2.2 2.2 0 0 1 5.7 3h8.9a2.2 2.2 0 0 1 2.2 2.2v6.6Z" />
                <path d="M7.2 7.6h5.6M7.2 10.3h3.6" />
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
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" className="anim-ico-svg anim-ico-search" aria-hidden="true">
                <circle cx="8.8" cy="8.8" r="5.3" />
                <path d="m12.8 12.8 3.9 3.9" />
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
      ) : (
        /* ----- CHẾ ĐỘ NATIVE SUB-SCREEN NAVIGATION BAR ----- */
        <header className="mhead-bar mhead-subpage-bar" style={{ display: 'flex' }}>
          <button
            type="button"
            className="mhead-back-btn"
            onClick={handleBack}
            aria-label="Quay lại"
          >
            <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m12.5 5-5 5 5 5" />
            </svg>
            <span>Quay lại</span>
          </button>

          <h1 className="mhead-subpage-title">{subpageTitle}</h1>

          <div className="mhead-subpage-actions">
            <a href="#ai" className="mhead-subpage-ico-btn is-ai" aria-label="Hỏi Gia sư AI" title="Mở Gia sư AI">
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 2.3C9.45 6.35 11.65 8.55 15.7 9C11.65 9.45 9.45 11.65 9 15.7C8.55 11.65 6.35 9.45 2.3 9C6.35 8.55 8.55 6.35 9 2.3Z" />
                <path d="M15.7 12.6C15.95 14.05 16.75 14.85 18.2 15.1C16.75 15.35 15.95 16.15 15.7 17.6C15.45 16.15 14.65 15.35 13.2 15.1C14.65 14.85 15.45 14.05 15.7 12.6Z" fill="currentColor" stroke="none" />
              </svg>
            </a>
            {typeof onMenu === 'function' && (
              <button
                type="button"
                className="mhead-subpage-ico-btn"
                onClick={onMenu}
                aria-label="Mở menu tiện ích"
                title="Chuyển nhanh công cụ khác"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="3" width="5.6" height="5.6" rx="1.6" />
                  <rect x="11.4" y="3" width="5.6" height="5.6" rx="1.6" />
                  <rect x="3" y="11.4" width="5.6" height="5.6" rx="1.6" />
                  <rect x="11.4" y="11.4" width="5.6" height="5.6" rx="1.6" />
                </svg>
              </button>
            )}
          </div>
        </header>
      )}

      {/* Dải chọn môn KHTN trên mobile (chỉ hiện ở các màn hình học tập KHTN) */}
      {showSubjectStrip && (
        <div className="mhead-subject-strip">
          <SubjectSwitcher compact />
        </div>
      )}
    </div>
  );
}
