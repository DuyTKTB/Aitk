import { useEffect, useRef, useState } from 'react';
import {
  IconHome, IconRobot, IconTools, IconUser,
  IconCalc, IconMicroscope, IconScale, IconTimer,
  IconCalendar, IconNote, IconTarget, IconQuiz, IconGamepad,
} from './Icons.jsx';

/* ============ ICONS ============ */
const IconClass = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);
const IconNotebook = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="M9 3v18" />
  </svg>
);
const IconChart = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 20V10M10 20V4M16 20v-7M22 20V8" />
  </svg>
);

const IconAtom = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="1.6" />
    <ellipse cx="12" cy="12" rx="10" ry="4" />
    <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
    <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
  </svg>
);
const IconSearch = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" />
  </svg>
);
const IconArrow = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
const IconDash = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

const NAV_TOOLS = [
  ['table', 'Bảng tuần hoàn', IconAtom, '118 nguyên tố, lọc và tìm kiếm'],
  ['formulas', 'Công thức nhanh', IconCalc, 'Mol, pH, vô cơ, hữu cơ'],
  ['analyze', 'Phân tích', IconMicroscope, 'Phân tích hợp chất'],
  ['balance', 'Cân bằng PTHH', IconScale, 'Nhập phương trình, ra hệ số'],
  ['pomodoro', 'Pomodoro', IconTimer, 'Tập trung sâu, nghỉ đúng lúc'],
  ['exam', 'Kỳ thi', IconCalendar, 'Đếm ngược tới ngày thi'],
  ['notes', 'Ghi chú', IconNote, 'Lưu ý tưởng khi học'],
  ['notebook', 'Sổ tay', IconNotebook, 'Các câu đã làm sai'],
  ['grade', 'Tính điểm', IconTarget, 'Cần bao nhiêu để đạt mục tiêu'],
  ['quiz', 'Ôn tập', IconQuiz, 'Quiz giúp nhớ lâu hơn'],
  ['stats', 'Thống kê', IconChart, 'Theo dõi tiến độ học'],
  ['games', 'Trò chơi', IconGamepad, '6 trò chơi hóa học'],
];

export default function DesktopNav({
  page,
  theme,
  scrolled,
  isAdmin,
  isPro,
  userRole,
  onSearch,
  onToggleTheme,
  onLogout,
}) {
  const [toolOpen, setToolOpen] = useState(false);
  const wrapRef = useRef(null);

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
      <nav className="nav-apple">
        {/* ============ LOGO ============ */}
        <a className="nav-logo" href="#home" aria-label="Trang chủ">
          <img
            src="/img/logo.png"
            alt="A7 K60 DTA"
            className="nav-logo-img"
            onError={(e) => {
              // Fallback nếu không tải được ảnh
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling.style.display = 'inline-flex';
            }}
          />
          <span className="nav-logo-dot" aria-hidden="true" />
          <span className="logo-text">A7 K60 DTA</span>
        </a>

        <div className="nav-links">
          {/* Trang chủ */}
          <a
            href="#home"
            className={'nav-item' + (page === 'home' ? ' active' : '')}
          >
            <span className="nav-ico"><IconHome size={15} /></span>
            <span className="nav-label">Trang chủ</span>
          </a>

          {/* CU AI */}
          <a
            href="#ai"
            className={'nav-item' + (page === 'ai' ? ' active' : '')}
          >
            <span className="nav-ico"><IconRobot size={15} /></span>
            <span className="nav-label">CU AI</span>
          </a>

          {/* Công cụ dropdown */}
          <div className="nav-drop">
            <button
              type="button"
              className={
                'nav-item has-drop' +
                (NAV_TOOLS.some(([id]) => id === page) ? ' active' : '')
              }
              onClick={() => setToolOpen((s) => !s)}
              aria-expanded={toolOpen}
            >
              <span className="nav-ico"><IconTools size={15} /></span>
              <span className="nav-label">Công cụ</span>
            </button>
            {toolOpen && (
              <div className="nav-drop-menu open nav-drop-tools">
                <div className="nav-mega-head">
                  <span className="nav-mega-title">Công cụ học tập</span>
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
                      <IconDash size={16} /> Trang quản trị
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Lớp học — giáo viên PRO */}
          {isTeacher && (
            <a
              href="#classroom"
              className={'nav-item' + (page === 'classroom' ? ' active' : '')}
            >
              <span className="nav-ico"><IconClass size={15} /></span>
              <span className="nav-label">Quản lý lớp</span>
            </a>
          )}

          {/* Lớp học — học sinh */}
          {isStudent && (
            <a
              href="#my-classes"
              className={'nav-item' + (page === 'my-classes' ? ' active' : '')}
            >
              <span className="nav-ico"><IconClass size={15} /></span>
              <span className="nav-label">Lớp học</span>
            </a>
          )}

          {/* Trang cá nhân */}
          <a
            href="#profile"
            className={'nav-item' + (page === 'profile' ? ' active' : '')}
          >
            <span className="nav-ico"><IconUser size={15} /></span>
            <span className="nav-label">Trang cá nhân</span>
          </a>
        </div>

        <div className="nav-actions">
          {/* Tìm kiếm */}
          <button
            type="button"
            className="nav-search-pill"
            onClick={onSearch}
            aria-label="Tìm nguyên tố"
          >
            <IconSearch size={15} />
            <span className="nav-search-text">Tìm nguyên tố</span>
            <kbd>Ctrl K</kbd>
          </button>

          {/* Đổi theme */}
          <button
            type="button"
            className="nav-icon-btn"
            onClick={onToggleTheme}
            aria-label="Đổi chủ đề"
            title="Đổi chủ đề"
          >
            {theme === 'dark' ? (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
              </svg>
            ) : (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          {/* Đăng xuất */}
          <button
            type="button"
            className="nav-icon-btn nav-logout"
            onClick={onLogout}
            aria-label="Đăng xuất"
            title="Đăng xuất"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </nav>
    </div>
  );
}