import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useLiveStreak } from '../hooks.js';
import UserProfileNavDropdown from './UserProfileNavDropdown.jsx';
import StudyGoalNavDropdown from './aspiration/StudyGoalNavDropdown.jsx';
import { LOGO_GLIDE_TRANSITION, useElecIntro } from './ElecIntroLoader.jsx';
import '../styles/nav-dropdowns.css';
import {
  IconHome, IconRobot, IconTools,
  IconCalc, IconMicroscope, IconScale, IconTimer,
  IconCalendar, IconTarget, IconQuiz, IconGamepad, IcoBook,
} from './Icons.jsx';

/* ============ CUSTOM SVG ICONS (100% SVG THUẦN, ZERO EMOJI) ============ */
const IconClass = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"
    className={`anim-ico-svg anim-ico-class ${className}`} aria-hidden="true">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

const IconNotebook = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"
    className={`anim-ico-svg anim-ico-notebook ${className}`} aria-hidden="true">
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="M9 3v18" />
    <path d="M12 8h4M12 12h4" />
  </svg>
);

const IconChart = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"
    className={`anim-ico-svg anim-ico-chart ${className}`} aria-hidden="true">
    <path d="M4 20V10M10 20V4M16 20v-7M22 20V8" />
  </svg>
);

const IconAtom = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"
    className={`anim-ico-svg anim-ico-atom ${className}`} aria-hidden="true">
    <circle cx="12" cy="12" r="1.6" />
    <ellipse cx="12" cy="12" rx="10" ry="4" />
    <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
    <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
  </svg>
);

const IconFlask = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className={`anim-ico-svg ${className}`} aria-hidden="true">
    <path d="M10 2v6L4.5 18A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-3L14 8V2" />
    <path d="M8.5 2h7" />
    <line x1="7" y1="16" x2="17" y2="16" strokeDasharray="1.5 2" />
  </svg>
);

const IconDna = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className={`anim-ico-svg ${className}`} aria-hidden="true">
    <path d="M6 3c0 6 12 12 12 18" />
    <path d="M18 3c0 6-12 12-12 18" />
    <line x1="7.2" y1="7.5" x2="16.8" y2="7.5" />
    <line x1="9" y1="12" x2="15" y2="12" />
    <line x1="7.2" y1="16.5" x2="16.8" y2="16.5" />
  </svg>
);

const IconPhysics = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className={`anim-ico-svg ${className}`} aria-hidden="true">
    <circle cx="12" cy="12" r="2.4" fill="currentColor" />
    <ellipse cx="12" cy="12" rx="9.5" ry="3.8" transform="rotate(30 12 12)" />
    <ellipse cx="12" cy="12" rx="9.5" ry="3.8" transform="rotate(-30 12 12)" />
  </svg>
);

const IconSparkles = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className={`anim-ico-svg ${className}`} aria-hidden="true">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const IconFolder = ({ size = 15, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className={`anim-ico-svg ${className}`} aria-hidden="true">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const IconSearch = ({ size = 15, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className={`anim-ico-svg anim-ico-search ${className}`} aria-hidden="true">
    <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" />
  </svg>
);

const IconArrow = ({ size = 15, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
    className={`anim-ico-svg anim-ico-arrow ${className}`} aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const IconDash = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"
    className={`anim-ico-svg anim-ico-dashboard ${className}`} aria-hidden="true">
    <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

/* ============ CÔNG CỤ PHÂN CHIA THEO TỆP MÔN KHTN ============ */
export const SUBJECT_TOOL_GROUPS = [
  {
    id: 'hoa',
    title: 'Môn Hóa học',
    badge: 'Tệp Hóa học',
    color: '#0284c7',
    tintBg: 'rgba(2, 132, 199, 0.1)',
    tintText: '#0284c7',
    Icon: IconFlask,
    description: 'Bảng tuần hoàn tương tác, cân bằng PTHH đại số, phân tích chất & công thức Hóa',
    tools: [
      {
        id: 'table',
        name: 'Bảng tuần hoàn IUPAC',
        desc: '118 nguyên tố tương tác, cấu hình electron & độ âm điện',
        Icon: IconAtom,
        href: '#table',
      },
      {
        id: 'balance',
        name: 'Cân bằng PTHH',
        desc: 'Cân bằng phương trình hóa học bằng đại số & bảo toàn',
        Icon: IconScale,
        href: '#balance',
      },
      {
        id: 'analyze',
        name: 'Phân tích & Tra cứu',
        desc: 'Nhận diện chất, phản ứng hóa học & hiện tượng thực tế',
        Icon: IconMicroscope,
        href: '#analyze',
      },
      {
        id: 'formulas',
        name: 'Sổ tay công thức Hóa',
        desc: 'Nồng độ mol, bảo toàn khối lượng, mol e, pH dung dịch',
        Icon: IconCalc,
        href: '#formulas',
      },
    ],
  },
  {
    id: 'ly',
    title: 'Môn Vật lí',
    badge: 'Tệp Vật lí',
    color: '#7c3aed',
    tintBg: 'rgba(124, 58, 237, 0.1)',
    tintText: '#7c3aed',
    Icon: IconPhysics,
    description: 'Công thức Cơ - Sóng - Điện, Lab ảo 3D & Máy tính chu kỳ dao động cùng AI',
    tools: [
      {
        id: 'formulas',
        name: 'Sổ tay công thức Vật lí',
        desc: 'Dao động điều hòa, Sóng cơ, Dòng điện xoay chiều, Hạt nhân',
        Icon: IconCalc,
        href: '#formulas',
      },
      {
        id: 'games/lab-3d',
        name: 'Phòng Lab ảo & Mô phỏng 3D',
        desc: 'Thí nghiệm con lắc lò xo, khúc xạ ánh sáng & mạch LC',
        Icon: IconMicroscope,
        href: '#games/lab-3d',
      },
      {
        id: 'ai',
        name: 'Máy tính & Giải bài tập Vật lí',
        desc: 'Tính chu kỳ, trở kháng RLC, năng lượng dao động cùng AI',
        Icon: IconRobot,
        href: '#ai',
      },
    ],
  },
  {
    id: 'sinh',
    title: 'Môn Sinh học',
    badge: 'Tệp Sinh học',
    color: '#059669',
    tintBg: 'rgba(5, 150, 105, 0.1)',
    tintText: '#059669',
    Icon: IconDna,
    description: 'Di truyền Men-đen, Cấu trúc ADN & Cân bằng định luật Hardy - Weinberg',
    tools: [
      {
        id: 'formulas',
        name: 'Sổ tay công thức Sinh học',
        desc: 'Tính số nu A-T-G-X, liên kết hiđrô, phiên mã mRNA & dịch mã',
        Icon: IconCalc,
        href: '#formulas',
      },
      {
        id: 'ai',
        name: 'Trợ lý Di truyền & Men-đen',
        desc: 'Giải bài tập lai Men-đen, tương tác gen & di truyền quần thể',
        Icon: IconRobot,
        href: '#ai',
      },
      {
        id: 'notebook',
        name: 'Sổ tay bẫy lý thuyết Sinh',
        desc: 'Ghi chú câu sai, bẫy trắc nghiệm di truyền học & sinh thái',
        Icon: IconNotebook,
        href: '#notebook',
      },
    ],
  },
  {
    id: 'suite',
    title: 'KHTN & Học tập thông minh',
    badge: 'Tệp KHTN',
    color: '#2563eb',
    tintBg: 'rgba(37, 99, 235, 0.1)',
    tintText: '#2563eb',
    Icon: IconSparkles,
    description: 'Bộ công cụ ôn luyện toàn diện: Phòng thi ảo 3 môn, Sổ tay lỗi sai, Pomodoro & Lịch học',
    tools: [
      {
        id: 'virtual-exams',
        name: 'Phòng thi ảo KHTN',
        desc: 'Đề thi THPTQG & ĐGNL 3 môn chuẩn Bộ GD&ĐT',
        Icon: IconQuiz,
        href: '#virtual-exams',
      },
      {
        id: 'ai',
        name: 'Trợ lý AI KHTN',
        desc: 'Gia sư AI giải chi tiết bài tập Vật lí, Hóa học, Sinh học',
        Icon: IconRobot,
        href: '#ai',
      },
      {
        id: 'notebook',
        name: 'Sổ tay lỗi sai 3 môn',
        desc: 'Tự động lưu câu sai và phân tích nguyên nhân sai',
        Icon: IconNotebook,
        href: '#notebook',
      },
      {
        id: 'pomodoro',
        name: 'Clock Hub (Pomodoro)',
        desc: 'Hẹn giờ tập trung sâu 25/5 & đồng hồ đếm ngược ngày thi',
        Icon: IconTimer,
        href: '#pomodoro',
      },
      {
        id: 'schedule',
        name: 'Thời khóa biểu KHTN',
        desc: 'Lập kế hoạch phân bổ thời gian học 3 môn Lý - Hóa - Sinh',
        Icon: IconCalendar,
        href: '#schedule',
      },
      {
        id: 'stats',
        name: 'Thống kê năng lực',
        desc: 'Phân tích điểm số dự đoán & Elo chi tiết theo từng môn',
        Icon: IconChart,
        href: '#stats',
      },
      {
        id: 'quiz',
        name: 'Quiz phản xạ ngắt quãng',
        desc: 'Ôn tập lặp lại ngắt quãng (SRS) nhớ kiến thức lâu hơn',
        Icon: IconTarget,
        href: '#quiz',
      },
      {
        id: 'games',
        name: 'Trò chơi Khoa học',
        desc: 'Kéo co, đua xe, vòng quay & đấu trí kiến thức KHTN',
        Icon: IconGamepad,
        href: '#games',
      },
    ],
  },
];

const FOLDER_TABS = [
  { id: 'all', label: 'Tất cả (KHTN)', Icon: IconFolder, color: '#2563eb', mascot: '/img/elec/elec-cool.png' },
  { id: 'hoa', label: 'Hóa học', Icon: IconFlask, color: '#0284c7', mascot: '/img/elec/elec-think.png' },
  { id: 'ly', label: 'Vật lí', Icon: IconPhysics, color: '#7c3aed', mascot: '/img/elec/elec-fighting.png' },
  { id: 'sinh', label: 'Sinh học', Icon: IconDna, color: '#059669', mascot: '/img/elec/elec-happy.png' },
  { id: 'suite', label: 'KHTN & Học tập', Icon: IconSparkles, color: '#2563eb', mascot: '/img/elec/elec-celebrate.png' },
];

const ALL_TOOL_IDS = SUBJECT_TOOL_GROUPS.flatMap((g) => g.tools.map((t) => t.id));

export default function DesktopNav({
  page,
  theme,
  scrolled,
  isAdmin,
  isPro,
  userRole,
  credits,
  toolOpen: toolOpenProp,
  onToolOpen,
  navRef,
  onSearch,
  onToggleTheme,
  onLogout,
}) {
  const [localToolOpen, setLocalToolOpen] = useState(false);
  const [toolFolder, setToolFolder] = useState('all');
  const localRef = useRef(null);
  const toolOpen = toolOpenProp !== undefined ? toolOpenProp : localToolOpen;
  const setToolOpen = onToolOpen || setLocalToolOpen;
  const wrapRef = navRef || localRef;
  const { user, isLoggedIn } = useAuth();
  const { count: streakCount, isToday: hasStreakToday } = useLiveStreak();
  const { playing: introPlaying } = useElecIntro();


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

  const isTeacher = Boolean(isPro || userRole === 'teacher');
  const isStudent = userRole === 'student';

  return (
    <div className={'nav-wrap' + (scrolled ? ' scrolled' : '')} ref={wrapRef}>
      <nav className="nav-apple" aria-label="Điều hướng chính">
        {/* ============ CỤM TRÁI: LOGO ELEC AI + MỤC TIÊU HỌC TẬP ============ */}
        <div className="nav-left-cluster">
          <a className="nav-logo" href="#home" aria-label="Trang chủ ELEC AI">
            {!introPlaying && (
              <motion.div
                layoutId="elec-brand-logo"
                transition={{ layout: LOGO_GLIDE_TRANSITION }}
                className="nav-logo-motion-wrap"
              >
                <img
                  src="/img/logo.png"
                  alt="ELEC AI"
                  className="nav-logo-img"
                />
              </motion.div>
            )}
          </a>

          {/* Pill Kép: Mục tiêu học tập & Nguyện vọng 1-2-3 (Thi THPTQG | ANND) */}
          <StudyGoalNavDropdown uid={user?.uid} autoOpenForNewStudent={false} />
        </div>

        {/* ============ CỤM GIỮA: 5 MỤC ĐIỀU HƯỚNG CỐT LÕI + MENU PHỤ ============ */}
        <div className="nav-links">
          {/* 1. Trang chủ */}
          <a
            href="#home"
            className={'nav-item' + (page === 'home' ? ' active' : '')}
          >
            <span className="nav-ico"><IconHome size={15} className="anim-ico-svg anim-ico-home" /></span>
            <span className="nav-label">Trang chủ</span>
          </a>

          {/* 2. Phòng thi ảo (có nhãn HOT) */}
          <a
            href="#virtual-exams"
            className={'nav-item ns9-nav-virtual-exam' + (page === 'quiz' || page === 'virtual-exams' ? ' active' : '')}
          >
            <span className="ns9-nav-hot-badge" aria-hidden="true">HOT</span>
            <span className="nav-ico"><IconQuiz size={15} className="anim-ico-svg anim-ico-quiz anim-ico-cap" /></span>
            <span className="nav-label">Phòng thi ảo</span>
          </a>

          {/* 3. Lộ trình */}
          <a
            href="#roadmap"
            className={'nav-item' + (page === 'roadmap' ? ' active' : '')}
          >
            <span className="nav-ico"><IcoBook size={15} className="anim-ico-svg anim-ico-book anim-ico-roadmap" /></span>
            <span className="nav-label">Lộ trình</span>
          </a>

          {/* 4. Lớp học */}
          {isTeacher ? (
            <a
              href="#classroom"
              className={'nav-item' + (page === 'classroom' ? ' active' : '')}
            >
              <span className="nav-ico"><IconClass size={15} className="anim-ico-svg anim-ico-class" /></span>
              <span className="nav-label">Quản lý lớp</span>
            </a>
          ) : (
            <a
              href="#my-classes"
              className={'nav-item' + (page === 'my-classes' || page === 'classroom' ? ' active' : '')}
            >
              <span className="nav-ico"><IconClass size={15} className="anim-ico-svg anim-ico-class" /></span>
              <span className="nav-label">Lớp học</span>
            </a>
          )}

          {/* Menu phụ: Gom toàn bộ Công cụ theo từng tệp môn học KHTN */}
          <div className="nav-drop">
            <button
              type="button"
              className={
                'nav-item has-drop' +
                (ALL_TOOL_IDS.includes(page) ? ' active' : '')
              }
              onClick={() => setToolOpen((s) => !s)}
              aria-expanded={toolOpen}
              aria-label="Mở menu Công cụ theo môn Khoa học Tự nhiên"
            >
              <span className="nav-ico"><IconTools size={15} className="anim-ico-svg anim-ico-tools" /></span>
              <span className="nav-label">Công cụ</span>
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="nav-drop-chevron-svg"
                style={{
                  transition: 'transform 0.24s cubic-bezier(0.2, 0.8, 0.2, 1)',
                  transform: toolOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  marginLeft: '2px',
                  opacity: 0.85,
                }}
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {toolOpen && (
              <div className="nav-drop-menu open nav-drop-tools">
                <div className="nav-mega-head">
                  <div className="nav-mega-title-wrap">
                    <h3 className="nav-mega-title">Hệ sinh thái công cụ Khoa học Tự nhiên &amp; AI</h3>
                    <p className="nav-mega-subtitle">Phân chia rõ ràng theo từng phân môn Hóa học · Vật lí · Sinh học · KHTN</p>
                  </div>
                  <a href="#tools" className="nav-mega-all" onClick={() => setToolOpen(false)}>
                    Xem tất cả công cụ
                    <span className="nav-mega-all-ico"><IconArrow size={15} /></span>
                  </a>
                </div>

                {/* Thanh tab chọn tệp môn học */}
                <div className="nav-tools-folder-tabs" role="tablist" aria-label="Chọn tệp môn học">
                  {FOLDER_TABS.map((tab) => {
                    const TabIcon = tab.Icon;
                    const isActive = toolFolder === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        className={`nav-tools-folder-tab ${isActive ? 'is-active' : ''}`}
                        style={{ '--tab-color': tab.color }}
                        onClick={() => setToolFolder(tab.id)}
                      >
                        {tab.mascot ? (
                          <img src={tab.mascot} alt="" className="nav-tools-folder-mascot" />
                        ) : (
                          <TabIcon size={14} />
                        )}
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Danh sách các tệp môn học */}
                <div className="nav-tools-folder-content">
                  {SUBJECT_TOOL_GROUPS.filter((g) => toolFolder === 'all' || toolFolder === g.id).map((group) => {
                    const GroupIcon = group.Icon;
                    return (
                      <div key={group.id} className="nav-tools-folder-section">
                        <div className="nav-tools-folder-header">
                          <div className="nav-tools-folder-title-left">
                            <span
                              className="nav-tools-folder-badge"
                              style={{ background: group.tintBg, color: group.tintText }}
                            >
                              <GroupIcon size={13} style={{ marginRight: 4 }} />
                              {group.badge}
                            </span>
                            <h4 className="nav-tools-folder-title">{group.title}</h4>
                          </div>
                          <span className="nav-tools-folder-desc">{group.description}</span>
                        </div>
                        <div className="nav-tools-grid-2col">
                          {group.tools.map((tool) => {
                            const ToolIcon = tool.Icon;
                            const isToolActive = page === tool.id;
                            return (
                              <a
                                key={tool.name}
                                href={tool.href}
                                className={`nav-tool-item-bento ${isToolActive ? 'active' : ''}`}
                                onClick={() => setToolOpen(false)}
                              >
                                <span
                                  className="nav-tool-bento-icon"
                                  style={{ background: group.tintBg, color: group.tintText }}
                                >
                                  <ToolIcon size={18} />
                                </span>
                                <span className="nav-tool-bento-info">
                                  <span className="nav-tool-bento-title">{tool.name}</span>
                                  <span className="nav-tool-bento-desc">{tool.desc}</span>
                                </span>
                                <span className="nav-tool-bento-arrow" aria-hidden="true">
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 18 15 12 9 6" />
                                  </svg>
                                </span>
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {isAdmin && (
                  <div className="nav-mega-foot">
                    <a href="#admin" className="nav-mega-admin" onClick={() => setToolOpen(false)}>
                      <IconDash size={15} /> Trang quản trị hệ thống
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ============ CỤM PHẢI: STREAK + ĐIỂM AI + BỘ 4 ICON TIỆN ÍCH (SEARCH, THEME, BELL, AVATAR) ============ */}
        <div className="nav-actions">
          <button
            type="button"
            className={`ns9-nav-streak-pill ${hasStreakToday ? 'is-active' : 'is-idle'}`}
            title={hasStreakToday ? `Chuỗi ${streakCount} ngày (Đã giữ chuỗi hôm nay) — Bấm xem Bảo vệ chuỗi & Nhận thưởng` : `Chuỗi ${streakCount} ngày (Chưa học hôm nay) — Bấm xem Bảo vệ chuỗi & Nhận thưởng`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.dispatchEvent(new CustomEvent('elec-close-nav-dropdowns'));
              window.dispatchEvent(new CustomEvent('elec-open-streak-modal'));
            }}
            style={{ cursor: 'pointer', pointerEvents: 'auto' }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill={hasStreakToday ? '#ea580c' : '#f97316'}
              style={{ opacity: hasStreakToday ? 1 : 0.75, pointerEvents: 'none' }}
              className={`ns9-streak-svg anim-ico-svg anim-ico-flame ${hasStreakToday ? 'active' : 'idle'}`}
              aria-hidden="true"
            >
              <path d="M12 2c1.5 3.5 4 5.5 4 9a4 4 0 0 1-8 0c0-1.5.5-3 1.2-4.2C8 8.5 6 11 6 14a6 6 0 0 0 12 0c0-5-3.5-8.5-6-12z" />
            </svg>
            <span style={{ pointerEvents: 'none' }}>{streakCount}</span>
          </button>

          {credits != null && (
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('elec-open-credit-topup'))}
              className="nav-credit-pill"
              title={`Điểm AI: ${credits.toLocaleString('vi-VN')} điểm — Bấm để nạp ELEC AI Credit`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="anim-ico-svg anim-ico-zap" aria-hidden="true">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <span>{credits >= 10000000 ? `${(credits / 1000000).toFixed(1)}M` : credits.toLocaleString('vi-VN')}</span>
            </button>
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
              <IconSearch size={16} className="anim-ico-svg anim-ico-search" />
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
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="anim-ico-svg anim-ico-sun" aria-hidden="true">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="anim-ico-svg anim-ico-moon" aria-hidden="true">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            {/* 3. Nút Chat cộng đồng học tập ELEC AI (Hỏi bài, thảo luận, giao lưu) */}
            <button
              type="button"
              className="nav-action-icon-btn nav-companion-msg-btn"
              onClick={() => { window.dispatchEvent(new CustomEvent('elec-open-community-chat')); }}
              aria-label="Chat cộng đồng học tập ELEC AI"
              title="Chat cộng đồng học tập ELEC AI (Hỏi bài, giao lưu & học nhóm)"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                <circle cx="8" cy="10" r="1.2" fill="currentColor" />
                <circle cx="12" cy="10" r="1.2" fill="currentColor" />
                <circle cx="16" cy="10" r="1.2" fill="currentColor" />
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
