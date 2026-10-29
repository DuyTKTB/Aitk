import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useLiveStreak } from '../hooks.js';
import StudyGoalNavDropdown from './aspiration/StudyGoalNavDropdown.jsx';
import UserProfileNavDropdown from './UserProfileNavDropdown.jsx';
import {
  IconHome, IconRobot, IconTools,
  IconCalc, IconMicroscope, IconScale, IconTimer,
  IconCalendar, IconTarget, IconQuiz, IconGamepad, IcoBook,
} from './Icons.jsx';

/* ============ CUSTOM SVG ICONS ============ */
const IconClass = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

const IconNotebook = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="M9 3v18" />
    <path d="M12 8h4M12 12h4" />
  </svg>
);

const IconChart = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 20V10M10 20V4M16 20v-7M22 20V8" />
  </svg>
);

const IconAtom = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="1.6" />
    <ellipse cx="12" cy="12" rx="10" ry="4" />
    <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
    <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
  </svg>
);

const IconSearch = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" />
  </svg>
);

const IconArrow = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const IconDash = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

const NAV_TOOLS = [
  ['ai', 'Trợ lý ELEC AI', IconRobot, 'Giải bài tập Hóa & phân tích đề từng bước'],
  ['table', 'Bảng tuần hoàn', IconAtom, '118 nguyên tố, lọc và tìm kiếm'],
  ['notebook', 'Sổ tay lỗi sai', IconNotebook, 'Ôn lại các câu đã làm sai theo chương'],
  ['formulas', 'Công thức nhanh', IconCalc, 'Mol, pH, vô cơ, hữu cơ'],
  ['balance', 'Cân bằng PTHH', IconScale, 'Nhập phương trình, ra hệ số chuẩn'],
  ['analyze', 'Phân tích hợp chất', IconMicroscope, 'Nhận diện tính chất & phản ứng'],
  ['pomodoro', 'Clock Hub', IconTimer, 'Pomodoro tập trung sâu'],
  ['schedule', 'Thời khóa biểu', IconCalendar, 'Lập lịch học & theo dõi tiến độ'],
  ['exam', 'Đếm ngược kỳ thi', IconCalendar, 'Theo dõi số ngày tới kỳ thi'],
  ['grade', 'Tính điểm xét tuyển', IconTarget, 'Tính điểm cần đạt theo tổ hợp'],
  ['stats', 'Thống kê học tập', IconChart, 'Biểu đồ tiến độ & lịch sử làm bài'],
  ['games', 'Trò chơi Hóa học', IconGamepad, 'Phòng lab 3D & trò chơi luyện phản xạ'],
];

export default function DesktopNav({
  page,
  theme,
  scrolled,
  isAdmin,
  isPro,
  userRole,
  credits,
  onSearch,
  onToggleTheme,
  onLogout,
}) {
  const [toolOpen, setToolOpen] = useState(false);
  const wrapRef = useRef(null);
  const { user, isLoggedIn } = useAuth();
  const { count: streakCount, isToday: hasStreakToday } = useLiveStreak();

  useEffect(() => {
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setToolOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setToolOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const isTeacher = isPro && userRole === 'teacher';
  const isStudent = userRole === 'student';

  return (
    <div className={'nav-wrap' + (scrolled ? ' scrolled' : '')} ref={wrapRef}>
      <nav className="nav-apple" aria-label="Điều hướng chính">
        {/* ============ CỤM TRÁI: LOGO ELEC AI ============ */}
        <div className="nav-left-cluster">
          <a className="nav-logo" href="#home" aria-label="Trang chủ ELEC AI">
            <img
              src="/img/logo.png"
              alt="ELEC AI"
              className="nav-logo-img"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling.style.display = 'inline-flex';
              }}
            />
            <span className="nav-logo-dot" aria-hidden="true" />
            <span className="logo-text">ELEC AI</span>
          </a>
        </div>

        {/* ============ CỤM GIỮA: 5 MỤC ĐIỀU HƯỚNG CỐT LÕI + MENU PHỤ ============ */}
        <div className="nav-links">
          {/* 1. Trang chủ */}
          <a
            href="#home"
            className={'nav-item' + (page === 'home' ? ' active' : '')}
          >
            <span className="nav-ico"><IconHome size={15} /></span>
            <span className="nav-label">Trang chủ</span>
          </a>

          {/* 2. Phòng thi ảo (có nhãn HOT) */}
          <a
            href="#virtual-exams"
            className={'nav-item ns9-nav-virtual-exam' + (page === 'quiz' || page === 'virtual-exams' ? ' active' : '')}
          >
            <span className="ns9-nav-hot-badge" aria-hidden="true">HOT</span>
            <span className="nav-ico"><IconQuiz size={15} /></span>
            <span className="nav-label">Phòng thi ảo</span>
          </a>

          {/* 3. Lộ trình */}
          <a
            href="#roadmap"
            className={'nav-item' + (page === 'roadmap' ? ' active' : '')}
          >
            <span className="nav-ico"><IcoBook size={15} /></span>
            <span className="nav-label">Lộ trình</span>
          </a>

          {/* 4. Lớp học */}
          {isTeacher ? (
            <a
              href="#classroom"
              className={'nav-item' + (page === 'classroom' ? ' active' : '')}
            >
              <span className="nav-ico"><IconClass size={15} /></span>
              <span className="nav-label">Quản lý lớp</span>
            </a>
          ) : (
            <a
              href="#my-classes"
              className={'nav-item' + (page === 'my-classes' || page === 'classroom' ? ' active' : '')}
            >
              <span className="nav-ico"><IconClass size={15} /></span>
              <span className="nav-label">Lớp học</span>
            </a>
          )}

          {/* Menu phụ: Gom toàn bộ Công cụ, Bảng tuần hoàn, ELEC AI, Sổ tay... */}
          <div className="nav-drop">
            <button
              type="button"
              className={
                'nav-item has-drop' +
                (NAV_TOOLS.some(([id]) => id === page) ? ' active' : '')
              }
              onClick={() => setToolOpen((s) => !s)}
              aria-expanded={toolOpen}
              aria-label="Mở menu Công cụ và Trợ lý AI"
            >
              <span className="nav-ico"><IconTools size={15} /></span>
              <span className="nav-label">Công cụ</span>
            </button>
            {toolOpen && (
              <div className="nav-drop-menu open nav-drop-tools">
                <div className="nav-mega-head">
                  <span className="nav-mega-title">Hệ sinh thái công cụ học Hóa &amp; AI</span>
                  <a href="#tools" className="nav-mega-all" onClick={() => setToolOpen(false)}>
                    Xem tất cả công cụ
                    <span className="nav-mega-all-ico"><IconArrow size={15} /></span>
                  </a>
                </div>
                <div className="nav-mega-grid">
                  {NAV_TOOLS.map(([id, label, Icon, desc]) => (
                    <a
                      key={id}
                      href={'#' + id}
                      className={'nav-tool-item' + (page === id ? ' active' : '')}
                      onClick={() => setToolOpen(false)}
                    >
                      <span className="nav-tool-icon"><Icon size={18} /></span>
                      <span className="nav-tool-text">
                        <b>{label}</b>
                        {desc && <small>{desc}</small>}
                      </span>
                    </a>
                  ))}
                </div>
                {isAdmin && (
                  <div className="nav-mega-foot">
                    <a href="#admin" className="nav-mega-admin" onClick={() => setToolOpen(false)}>
                      <IconDash size={16} /> Trang quản trị hệ thống
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ============ CỤM PHẢI: MỤC TIÊU HỌC TẬP (VIỀN TRẮNG) + STREAK + ĐIỂM AI + TÌM KIẾM + AVATAR ============ */}
        <div className="nav-actions">
          {!isTeacher && (
            <StudyGoalNavDropdown
              uid={user?.uid}
              autoOpenForNewStudent={Boolean(isLoggedIn && isStudent)}
            />
          )}

          <a
            href="#leaderboard"
            className={`ns9-nav-streak-pill ${hasStreakToday ? 'is-active' : 'is-idle'}`}
            title={hasStreakToday ? `Chuỗi ${streakCount} ngày (Đã giữ chuỗi hôm nay 🔥) — Bấm xem Bảng xếp hạng` : `Chuỗi ${streakCount} ngày (Chưa học hôm nay) — Bấm xem Bảng xếp hạng`}
            onClick={(e) => {
              window.dispatchEvent(new CustomEvent('elec-close-nav-dropdowns'));
              if (window.location.hash === '#leaderboard') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                window.dispatchEvent(new HashChangeEvent('hashchange'));
              }
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className={`ns9-streak-svg ${hasStreakToday ? 'active' : 'idle'}`} aria-hidden="true">
              <path d="M12 2c1.5 3.5 4 5.5 4 9a4 4 0 0 1-8 0c0-1.5.5-3 1.2-4.2C8 8.5 6 11 6 14a6 6 0 0 0 12 0c0-5-3.5-8.5-6-12z" />
            </svg>
            <span>{streakCount}</span>
          </a>

          {credits != null && (
            <a
              href="#profile?tab=upgrade"
              className="nav-credit-pill"
              title="Số điểm AI của bạn"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <span>{credits.toLocaleString('vi-VN')}</span>
            </a>
          )}

          {/* Cụm 4 nút tiện ích gọn đẹp: Tìm kiếm (SVG) • Đổi giao diện • Thông báo • Avatar */}
          <div className="nav-actions-icons-cluster">
            {/* 1. Nút Tìm kiếm nhanh dạng icon tròn SVG (bấm mở Command Palette / Ctrl K) */}
            <button
              type="button"
              className="nav-action-icon-btn nav-search-btn"
              onClick={onSearch}
              aria-label="Tìm nhanh toàn hệ thống (Ctrl K)"
              title="Tìm nhanh toàn hệ thống (Ctrl K)"
            >
              <IconSearch size={16} />
            </button>

            {/* 2. Nút Đổi giao diện Sáng / Tối */}
            <button
              type="button"
              className="nav-action-icon-btn nav-theme-btn"
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
              title={theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
            >
              {theme === 'dark' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            {/* 3. Nút Chuông thông báo học tập */}
            <button
              type="button"
              className="nav-action-icon-btn nav-bell-btn"
              onClick={() => { window.location.hash = 'roadmap'; }}
              aria-label="Thông báo học tập"
              title="Thông báo học tập"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
            </button>

            {/* 4. Menu Avatar cá nhân dạng Dropdown */}
            <UserProfileNavDropdown
              user={user}
              page={page}
              isTeacher={isTeacher}
              onLogout={onLogout}
            />
          </div>
        </div>
      </nav>
    </div>
  );
}
