﻿﻿﻿import { useState, useEffect, useRef, lazy, Suspense, useCallback, useMemo } from 'react';
import { useLocalStorage } from './hooks.js';

/* ============ LAZY PAGES ============ */
const Home = lazy(() => import('./components/Home.jsx'));
const Landing = lazy(() => import('./components/Landing.jsx'));
const PeriodicTable = lazy(() => import('./components/PeriodicTable.jsx'));
const ClockHub = lazy(() => import('./components/ClockHub.jsx'));
const ExamCountdown = lazy(() => import('./components/ExamCountdown.jsx'));
const Notes = lazy(() => import('./components/Notes.jsx'));
const Quiz = lazy(() => import('./components/Quiz.jsx'));
const FormulaCalculator = lazy(() => import('./components/FormulaCalculator.jsx'));
const GradeCalculator = lazy(() => import('./components/GradeCalculator.jsx'));
const CompoundAnalyzer = lazy(() => import('./components/CompoundAnalyzer.jsx'));
const EquationBalancer = lazy(() => import('./components/EquationBalancer.jsx'));
const AIChat = lazy(() => import('./components/AIChat.jsx'));
const ProfilePage = lazy(() => import('./components/ProfilePage.jsx'));
const ToolsPage = lazy(() => import('./components/ToolsPage.jsx'));
const WrongNotebook = lazy(() => import('./components/WrongNotebook.jsx'));
const StatsPage = lazy(() => import('./components/StatsPage.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));
const Feedback = lazy(() => import('./pages/Feedback.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

/* ============ GAMES ============ */
const GameHub = lazy(() => import('./components/games/GameHub.jsx'));
const Chicken2D = lazy(() => import('./components/games/Chicken2D.jsx'));
const SlingshotGame = lazy(() => import('./components/games/SlingshotGame.jsx'));
const JeopardyGame = lazy(() => import('./components/games/JeopardyGame.jsx'));
const VirtualLab = lazy(() => import('./components/games/VirtualLab.jsx'));
const ElementBattle = lazy(() => import('./components/games/ElementBattle.jsx'));
const ChemSudoku = lazy(() => import('./components/games/ChemSudoku.jsx'));

/* ============ CLASSROOM ============ */
const TeacherDashboard = lazy(() => import('./components/TeacherDashboard.jsx'));
const ExamJoin = lazy(() => import('./components/ExamJoin.jsx'));
const StudentClass = lazy(() => import('./components/StudentClass.jsx'));
const MyClasses = lazy(() => import('./components/MyClasses.jsx'));

/* ============ ADMIN ============ */
const AdminPanel = lazy(() => import('./components/admin/AdminPanel.jsx'));

/* ============ WIDGETS ============ */
import PetWidget from './components/PetWidget.jsx';
import ChatWidget from './components/ChatWidget.jsx';
import MobileHeader from './components/MobileHeader.jsx';
import BottomNav from './components/BottomNav.jsx';
import DesktopNav from './components/DesktopNav.jsx';
import StudySheet from './components/StudySheet.jsx';
import CommandPalette from './components/CommandPalette.jsx';
import SiteFooter from './components/SiteFooter.jsx';
import LiveSessionBanner from './components/LiveSessionBanner.jsx';

/* ============ HOOKS + LIB ============ */
import { useAuth } from './hooks/useAuth.jsx';
import { useTeacherPro } from './hooks/useTeacherPro.js';
import { getUserRole } from './lib/userRole.js';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './lib/firebase.js';

/* ============ CSS ============ */
import './app-extra.css';
import './stats.css';
import './admin-dashboard.css';
import './admin-upgrade.css';
import './styles/classroom.css';
import './styles/teacher-pro.css';

/* ============ ICONS ============ */
import {
  IconHome, IconCalc, IconRobot, IconMicroscope, IconScale,
  IconTimer, IconCalendar, IconNote, IconTarget, IconQuiz, IconGamepad,
  IconTools, IconUser,
} from './components/Icons.jsx';

/* ============ LOCAL ICONS ============ */
const IconNotebook = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="M9 3v18" />
    <path d="M12 8h5M12 12h5M12 16h5" />
  </svg>
);

const IconChart = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 20V10M10 20V4M16 20v-7M22 20V8" />
  </svg>
);

const IconClass = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2z" />
    <path d="M4 20a2 2 0 0 0 2 1h13v-3" />
    <path d="M8 7h7" />
  </svg>
);

const PageLoader = () => (
  <div className="page-loader" role="status" aria-live="polite">
    <div className="page-loader-spinner" />
    <span>Đang tải…</span>
  </div>
);

/* ============ NAV CONFIG ============ */
const NAV_MAIN = [
  ['home', 'Trang chủ', IconHome],
  ['ai', 'CU AI', IconRobot],
  ['tools', 'Công cụ', IconTools],
  ['profile', 'Trang cá nhân', IconUser],
];

/* Mega menu — chia nhóm 3 cột */
const NAV_TOOLS_GROUPS = [
  {
    group: 'Học tập',
    tools: [
      { id: 'formulas', label: 'Công thức nhanh', desc: 'Tra cứu công thức theo chủ đề', Icon: IconCalc },
      { id: 'analyze', label: 'Phân tích hợp chất', desc: 'Nhận diện loại, tính chất, phản ứng', Icon: IconMicroscope },
      { id: 'balance', label: 'Cân bằng PTHH', desc: 'Cân bằng bằng đại số tuyến tính', Icon: IconScale },
      { id: 'quiz', label: 'Ôn tập', desc: 'Quiz thông minh + SRS', Icon: IconQuiz },
      { id: 'notebook', label: 'Sổ tay lỗi', desc: 'Câu sai tự động ghi vào', Icon: IconNotebook },
      { id: 'notes', label: 'Ghi chú', desc: 'Note dán trên canvas', Icon: IconNote },
    ],
  },
  {
    group: 'Tiện ích',
    tools: [
      { id: 'pomodoro', label: 'Clock Hub', desc: 'Pomodoro, hẹn giờ, báo thức', Icon: IconTimer },
      { id: 'exam', label: 'Kỳ thi', desc: 'Đếm ngược kỳ thi', Icon: IconCalendar },
      { id: 'grade', label: 'Tính điểm', desc: 'Tính GPA, xét tuyển', Icon: IconTarget },
      { id: 'stats', label: 'Thống kê', desc: 'Tiến độ học tập', Icon: IconChart },
    ],
  },
  {
    group: 'Giải trí',
    tools: [
      { id: 'games', label: 'Trò chơi', desc: '7 game học Hóa', Icon: IconGamepad },
      { id: 'table', label: 'Bảng tuần hoàn', desc: '118 nguyên tố tương tác', Icon: IconHome },
    ],
  },
];

/* Flat list — dùng cho PAGES + pageTitle */
const NAV_TOOLS_FLAT = NAV_TOOLS_GROUPS.flatMap((g) => g.tools.map((t) => [t.id, t.label]));

const PAGES = [
  ...NAV_MAIN,
  ...NAV_TOOLS_FLAT,
  ['table', 'Bảng tuần hoàn', null],
  ['admin', 'Quản trị', null],
  ['settings', 'Cài đặt', null],
  ['feedback', 'Phản hồi', null],
  ['classroom', 'Lớp học', null],
  ['my-classes', 'Lớp học của tôi', IconClass],
];

const GAME_ROUTES = ['chicken', 'slingshot', 'jeopardy', 'lab', 'battle', 'sudoku'].map((g) => 'games/' + g);

/* ============ PAGE ROUTING HELPERS ============ */
const readPage = () => {
  if (typeof window === 'undefined') return 'home';
  const h = window.location.hash.slice(1);
  if (h === 'login' || h === 'register') return h;
  if (GAME_ROUTES.includes(h)) return h;
  if (h.startsWith('exam/')) return h;
  if (h === 'admin' || h.startsWith('admin/')) return 'admin';
  if (h === '' || h === 'main') return 'home';
  return PAGES.some((p) => p[0] === h) ? h : '404';
};

const pageTitle = (page) => {
  if (page === '404') return 'Không tìm thấy trang · A7 K60 DTA';
  const hit = PAGES.find((p) => p[0] === page);
  if (hit) return hit[1] + ' · A7 K60 DTA';
  if (page.startsWith('games/')) return 'Trò chơi · A7 K60 DTA';
  if (page.startsWith('exam/')) return 'Làm bài thi · A7 K60 DTA';
  return 'Trang chủ · A7 K60 DTA';
};

const pageMeta = (page) => {
  const metas = {
    home: 'Học Hóa học thông minh với AI, bảng tuần hoàn tương tác, quiz và trò chơi giáo dục.',
    ai: 'Trợ lý AI Hóa học — giải bài tập, phân tích ảnh đề, sinh câu hỏi ôn tập.',
    table: 'Bảng tuần hoàn 118 nguyên tố — lọc, tìm kiếm, xem chi tiết.',
    tools: 'Bộ công cụ học Hóa: cân bằng PTHH, tính mol, phân tích hợp chất.',
    formulas: 'Tra cứu công thức Hóa học nhanh chóng theo chủ đề.',
    balance: 'Cân bằng phương trình hóa học chính xác bằng đại số tuyến tính.',
    analyze: 'Phân tích hợp chất — nhận diện loại, tính chất, phản ứng đặc trưng.',
    pomodoro: 'Clock Hub — Đồng hồ tổng hợp: Pomodoro, hẹn giờ, báo thức, bấm giây, đồng hồ thế giới.',
    quiz: 'Ôn tập Hóa học với quiz thông minh, lặp lại ngắt quãng.',
    games: 'Học Hóa qua trò chơi: bắt gà, bắn súng, phòng lab ảo, đấu nguyên tố.',
    profile: 'Trang cá nhân — quản lý tài khoản, thống kê học tập.',
    classroom: 'Quản lý lớp học — tạo lớp, giao đề, quản lý học sinh.',
    'my-classes': 'Tham gia lớp học — dán key lớp hoặc link đề cô giáo gửi.',
    admin: 'Trang quản trị hệ thống — quản lý đề thi, người dùng, key PRO.',
  };
  return metas[page] || metas.home;
};

const isAdmin = (user) => {
  if (!user) return false;
  if (user.isAdmin === true) return true;
  if (user.role === 'admin') return true;
  const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return ADMIN_EMAILS.includes(user.email);
};

/* ============ MAIN APP ============ */
export default function App() {
  const { ready, isLoggedIn, user, logout } = useAuth();
  const pro = useTeacherPro();
  const [hashTick, setHashTick] = useState(0);

  const rawPage = useMemo(() => readPage(), [hashTick]); // eslint-disable-line react-hooks/exhaustive-deps
  const page = !isLoggedIn && rawPage === '404' ? 'home' : rawPage;

  const [menu, setMenu] = useState(false);
  const [toolOpen, setToolOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [askLogout, setAskLogout] = useState(false);
  const [userRole, setUserRole] = useState('student');
  const dlgRef = useRef(null);
  const navRef = useRef(null);
  const progRef = useRef(null);
  const [theme, setTheme] = useLocalStorage('cs-theme-v2', 'dark');

  /* ============ LOAD ROLE ============ */
  useEffect(() => {
    if (!user?.uid) {
      setUserRole('student');
      return;
    }
    setUserRole(getUserRole(user));
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const role = snap.data()?.role || 'student';
          setUserRole(role);
          const meta = JSON.parse(localStorage.getItem('cs-user-meta') || '{}');
          meta[user.uid] = { ...(meta[user.uid] || {}), role };
          localStorage.setItem('cs-user-meta', JSON.stringify(meta));
        }
      } catch (e) {
        console.warn('Không load được role:', e);
      }
    })();
  }, [user?.uid]);

  /* ============ THEME ============ */
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === 'dark' ? '#030618' : '#f3f6ff';
  }, [theme]);

  /* ============ TITLE + META ============ */
  useEffect(() => {
    document.title = pageTitle(page);
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = pageMeta(page);
    document.getElementById('main')?.focus({ preventScroll: true });
  }, [page]);

  /* ============ ADMIN GUARD ============ */
  useEffect(() => {
    if (page === 'admin' && !isAdmin(user)) {
      window.location.hash = 'home';
    }
  }, [page, user]);

  /* ============ LOGIN/LOGOUT RESET ============ */
  const prevLoginRef = useRef(isLoggedIn);
  useEffect(() => {
    if (!prevLoginRef.current && isLoggedIn) {
      const keep = window.location.hash.startsWith('#exam/');
      if (!keep && window.location.hash !== '#home') history.replaceState(null, '', '#home');
      setHashTick((t) => t + 1);
      window.scrollTo(0, 0);
    }
    if (prevLoginRef.current && !isLoggedIn) {
      if (window.location.hash !== '#home') history.replaceState(null, '', '#home');
      setHashTick((t) => t + 1);
    }
    prevLoginRef.current = isLoggedIn;
  }, [isLoggedIn]);

  /* ============ LOGOUT DIALOG ============ */
  useEffect(() => {
    const d = dlgRef.current;
    if (!d) return;
    if (askLogout && !d.open) d.showModal();
    if (!askLogout && d.open) d.close();
  }, [askLogout]);

  /* ============ SCROLL PROGRESS ============ */
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 12);
      const h = document.documentElement.scrollHeight - window.innerHeight;
      if (progRef.current) {
        progRef.current.style.transform = `scaleX(${h > 0 ? Math.min(1, window.scrollY / h) : 0})`;
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ============ HASH + KEYBOARD + CLICK ============ */
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    const onHash = () => {
      setHashTick((x) => x + 1);
      setMenu(false);
      setToolOpen(false);
      window.scrollTo(0, 0);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setToolOpen(false);
        setMenu(false);
      }
    };
    const onDocClick = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setToolOpen(false);
        setMenu(false);
      }
    };
    window.addEventListener('hashchange', onHash);
    window.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDocClick);
    return () => {
      clearTimeout(t);
      window.removeEventListener('hashchange', onHash);
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDocClick);
    };
  }, []);

  /* ============ NAVIGATE (dùng cho MyClasses) ============ */
  const navigate = useCallback((target) => {
    if (!target) return;
    const next = target.replace(/^#/, '');
    if (window.location.hash === `#${next}`) {
      setHashTick((t) => t + 1);
    } else {
      window.location.hash = next;
    }
  }, []);

  /* ============ LAYOUT MODES ============ */
  const isExamMode = page.startsWith('exam/');
  const isAdminMode = page === 'admin';

  /* ============ GUARDS ============ */
  if (!ready) {
    return (
      <div className="loader">
        <span>A7 K60 DTA</span>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Landing
          theme={theme}
          onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          authOpen={page !== 'home'}
          authMode={page === 'register' ? 'register' : 'login'}
        />
      </Suspense>
    );
  }

  /* ============ PAGE ROUTING ============ */
  const renderPage = () => {
    if (page === 'home') return <Home />;

    if (page === 'table') {
      return (
        <section className="wrap">
          <h1>Bảng tuần hoàn</h1>
          <PeriodicTable />
        </section>
      );
    }

    if (page === 'tools') return <ToolsPage />;

    /* ============ CLASSROOM ROUTES ============ */
    if (page === 'classroom') {
      if (pro.isPro || isAdmin(user)) return <TeacherDashboard />;
      return <StudentClass />;
    }
    if (page === 'my-classes') {
      return <MyClasses onNavigate={navigate} />;
    }

    /* ============ EXAM MODE ============ */
    if (page.startsWith('exam/')) {
      return (
        <ExamJoin
          token={page.replace('exam/', '')}
          onExit={() => { window.location.hash = 'home'; }}
        />
      );
    }

    if (page === 'ai') return <AIChat />;
    if (page === 'formulas') return <FormulaCalculator />;
    if (page === 'analyze') return <CompoundAnalyzer />;
    if (page === 'balance') return <EquationBalancer />;
    if (page === 'pomodoro') return <ClockHub />;
    if (page === 'exam') return <ExamCountdown />;
    if (page === 'notes') return <Notes />;
    if (page === 'notebook') return <WrongNotebook />;
    if (page === 'grade') return <GradeCalculator />;
    if (page === 'quiz') return <Quiz />;
    if (page === 'stats') return <StatsPage />;
    if (page === 'profile') return <ProfilePage />;
    if (page === 'settings') return <Settings theme={theme} onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />;
    if (page === 'feedback') return <Feedback />;
    if (page === '404') return <NotFound />;
    if (page === 'games') return <GameHub />;
    if (page === 'games/chicken') return <Chicken2D />;
    if (page === 'games/slingshot') return <SlingshotGame />;
    if (page === 'games/jeopardy') return <JeopardyGame />;
    if (page === 'games/lab') return <VirtualLab />;
    if (page === 'games/battle') return <ElementBattle />;
    if (page === 'games/sudoku') return <ChemSudoku />;

    if (page === 'admin' && isAdmin(user)) {
      return <AdminPanel />;
    }

    return <Home />;
  };

  /* ============ EXAM MODE LAYOUT ============ */
  if (isExamMode) {
    return (
      <Suspense fallback={<PageLoader />}>
        {renderPage()}
      </Suspense>
    );
  }

  /* ============ ADMIN MODE LAYOUT ============ */
  if (isAdminMode && isAdmin(user)) {
    return (
      <Suspense fallback={<PageLoader />}>
        {renderPage()}
      </Suspense>
    );
  }

  /* ============ LAYOUT CHÍNH ============ */
  return (
    <>
      <a className="skip-link" href="#main">Bỏ qua điều hướng</a>
      <div className="scroll-progress" ref={progRef} aria-hidden="true" />

      <PetWidget />
      <ChatWidget />

      <LiveSessionBanner />

      <div className={'loader' + (loading ? '' : ' hide')} aria-hidden={!loading}>
        <span>A7 K60 DTA</span>
      </div>

      <MobileHeader
        page={page}
        theme={theme}
        isPro={pro.isPro}
        userRole={userRole}
        onSearch={() => {
          if (window.location.hash !== '#table') window.location.hash = 'table';
          setTimeout(() => document.getElementById('search')?.focus(), 100);
        }}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        onMenu={() => setMenu(true)}
      />

      <DesktopNav
        page={page}
        theme={theme}
        scrolled={scrolled}
        isAdmin={isAdmin(user)}
        isPro={pro.isPro}
        userRole={userRole}
        toolOpen={toolOpen}
        onToolOpen={setToolOpen}
        tools={NAV_TOOLS_GROUPS}
        navRef={navRef}
        onSearch={() => {
          if (window.location.hash !== '#table') window.location.hash = 'table';
          setTimeout(() => document.getElementById('search')?.focus(), 100);
        }}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        onLogout={() => setAskLogout(true)}
      />

      <StudySheet open={menu} onClose={() => setMenu(false)} />

      <main id="main" tabIndex={-1}>
        <Suspense fallback={<PageLoader />}>
          {renderPage()}
        </Suspense>
      </main>

      <dialog
        ref={dlgRef}
        className="app-dialog"
        onClose={() => setAskLogout(false)}
        onClick={(e) => e.target === dlgRef.current && setAskLogout(false)}
      >
        <h3>Đăng xuất?</h3>
        <p>Tài khoản <b>{user?.displayName || user?.email}</b> sẽ thoát khỏi thiết bị này.</p>
        <div className="app-dialog-actions">
          <button type="button" onClick={() => setAskLogout(false)}>Ở lại</button>
          <button type="button" className="danger" onClick={logout}>Đăng xuất</button>
        </div>
      </dialog>

      <SiteFooter />

      <BottomNav page={page} userRole={userRole} isPro={pro.isPro} />

      <CommandPalette />
    </>
  );
}