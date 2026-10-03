﻿import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useLocalStorage } from './hooks.js';
const Home = lazy(() => import('./components/Home.jsx'));
const PeriodicTable = lazy(() => import('./components/PeriodicTable.jsx'));
const Pomodoro = lazy(() => import('./components/Pomodoro.jsx'));
const ExamCountdown = lazy(() => import('./components/ExamCountdown.jsx'));
const Notes = lazy(() => import('./components/Notes.jsx'));
const Quiz = lazy(() => import('./components/Quiz.jsx'));
const FormulaCalculator = lazy(() => import('./components/FormulaCalculator.jsx'));
const GradeCalculator = lazy(() => import('./components/GradeCalculator.jsx'));
const CompoundAnalyzer = lazy(() => import('./components/CompoundAnalyzer.jsx'));
const EquationBalancer = lazy(() => import('./components/EquationBalancer.jsx'));
const AIChat = lazy(() => import('./components/AIChat.jsx'));
const ProfilePage = lazy(() => import('./components/ProfilePage.jsx'));
const LoginPage = lazy(() => import('./components/LoginPage.jsx'));
const ToolsPage = lazy(() => import('./components/ToolsPage.jsx'));
const ExamDetail = lazy(() => import('./components/ExamDetail.jsx'));
const WrongNotebook = lazy(() => import('./components/WrongNotebook.jsx'));
const StatsPage = lazy(() => import('./components/StatsPage.jsx'));
const GameHub = lazy(() => import('./components/games/GameHub.jsx'));
const Chicken2D = lazy(() => import('./components/games/Chicken2D.jsx'));
const SlingshotGame = lazy(() => import('./components/games/SlingshotGame.jsx'));
const JeopardyGame = lazy(() => import('./components/games/JeopardyGame.jsx'));
const VirtualLab = lazy(() => import('./components/games/VirtualLab.jsx'));
const ElementBattle = lazy(() => import('./components/games/ElementBattle.jsx'));
const ChemSudoku = lazy(() => import('./components/games/ChemSudoku.jsx'));
const AdminLayout = lazy(() => import('./components/admin/AdminLayout.jsx'));
const Dashboard = lazy(() => import('./components/admin/Dashboard.jsx'));
const ExamManager = lazy(() => import('./components/admin/ExamManager.jsx'));
const QuestionManager = lazy(() => import('./components/admin/QuestionManager.jsx'));
const UserManager = lazy(() => import('./components/admin/UserManager.jsx'));
const ActivityPage = lazy(() => import('./components/admin/ActivityPage.jsx'));
const SettingsPage = lazy(() => import('./components/admin/SettingsPage.jsx'));
import PetWidget from './components/PetWidget.jsx';
import ChatWidget from './components/ChatWidget.jsx';
import MobileHeader from './components/MobileHeader.jsx';
import BottomNav from './components/BottomNav.jsx';
import DesktopNav from './components/DesktopNav.jsx';
import StudySheet from './components/StudySheet.jsx';
import CommandPalette from './components/CommandPalette.jsx';
import { useAuth } from './hooks/useAuth.jsx';
import './app-extra.css';
import './stats.css';
import './admin-dashboard.css';
import {
  IconHome, IconCalc, IconRobot, IconMicroscope, IconScale,
  IconTimer, IconCalendar, IconNote, IconTarget, IconQuiz, IconGamepad,
  IconTools, IconUser,
} from './components/Icons.jsx';

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
const PageLoader = () => (
  <div className="page-loader" role="status" aria-live="polite">
    <div className="page-loader-spinner" />
    <span>Đang tải…</span>
  </div>
);
const NAV_MAIN = [
  ['home', 'Trang chủ', IconHome],
  ['ai', 'CU AI', IconRobot],
  ['tools', 'Công cụ', IconTools],
  ['profile', 'Trang cá nhân', IconUser],
];

const NAV_TOOLS = [
  ['formulas', 'Công thức nhanh', IconCalc],
  ['analyze', 'Phân tích', IconMicroscope],
  ['balance', 'Cân bằng PTHH', IconScale],
  ['pomodoro', 'Pomodoro', IconTimer],
  ['exam', 'Kỳ thi', IconCalendar],
  ['notes', 'Ghi chú', IconNote],
  ['notebook', 'Sổ tay', IconNotebook],
  ['grade', 'Tính điểm', IconTarget],
  ['quiz', 'Ôn tập', IconQuiz],
  ['stats', 'Thống kê', IconChart],
  ['games', 'Trò chơi', IconGamepad],
];

const PAGES = [
  ...NAV_MAIN,
  ...NAV_TOOLS,
  ['table', 'Bảng tuần hoàn', null],
  ['admin', 'Quản trị', null],
];

const GAME_ROUTES = ['chicken', 'slingshot', 'jeopardy', 'lab', 'battle', 'sudoku'].map((g) => 'games/' + g);

const readPage = () => {
  if (typeof window === 'undefined') return 'home';
  const h = window.location.hash.slice(1);
  if (GAME_ROUTES.includes(h)) return h;
  if (h.startsWith('exam/')) return h;
  return PAGES.some((p) => p[0] === h) ? h : 'home';
};

const pageTitle = (page) => {
  const hit = PAGES.find((p) => p[0] === page);
  if (hit) return hit[1] + ' · A7 K60 DTA';
  if (page.startsWith('games/')) return 'Trò chơi · A7 K60 DTA';
  if (page.startsWith('exam/')) return 'Làm bài thi · A7 K60 DTA';
  return 'Trang chủ · A7 K60 DTA';
};

/* Meta description cho từng trang — SEO */
const pageMeta = (page) => {
  const metas = {
    home: 'Học Hóa học thông minh với AI, bảng tuần hoàn tương tác, quiz và trò chơi giáo dục.',
    ai: 'Trợ lý AI Hóa học — giải bài tập, phân tích ảnh đề, sinh câu hỏi ôn tập.',
    table: 'Bảng tuần hoàn 118 nguyên tố — lọc, tìm kiếm, xem chi tiết.',
    tools: 'Bộ công cụ học Hóa: cân bằng PTHH, tính mol, phân tích hợp chất.',
    formulas: 'Tra cứu công thức Hóa học nhanh chóng theo chủ đề.',
    balance: 'Cân bằng phương trình hóa học chính xác bằng đại số tuyến tính.',
    analyze: 'Phân tích hợp chất — nhận diện loại, tính chất, phản ứng đặc trưng.',
    quiz: 'Ôn tập Hóa học với quiz thông minh, lặp lại ngắt quãng.',
    games: 'Học Hóa qua trò chơi: bắt gà, bắn súng, phòng lab ảo, đấu nguyên tố.',
    profile: 'Trang cá nhân — quản lý tài khoản, thống kê học tập.',
  };
  return metas[page] || metas.home;
};

/* Kiểm tra quyền admin */
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

export default function App() {
  const { ready, isLoggedIn, user, logout } = useAuth();
  const [, setHashTick] = useState(0);
  const page = readPage();

  const [menu, setMenu] = useState(false);
  const [toolOpen, setToolOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [askLogout, setAskLogout] = useState(false);
  const dlgRef = useRef(null);
  const navRef = useRef(null);
  const progRef = useRef(null);
  const [adminTab, setAdminTab] = useState('dashboard');
  const [theme, setTheme] = useLocalStorage('cs-theme-v2', 'dark');

  /* ============ THEME ============ */
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === 'dark' ? '#030618' : '#f3f6ff';
  }, [theme]);

  /* ============ TITLE + META DESCRIPTION (SEO) ============ */
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

  /* Nếu user không phải admin mà vào #admin → đẩy về home */
  useEffect(() => {
    if (page === 'admin' && !isAdmin(user)) {
      window.location.hash = 'home';
    }
  }, [page, user]);

  /* Theo dõi login/logout để reset hash */
  const prevLoginRef = useRef(isLoggedIn);
  useEffect(() => {
    if (!prevLoginRef.current && isLoggedIn) {
      if (window.location.hash !== '#home') history.replaceState(null, '', '#home');
      setHashTick((t) => t + 1);
      window.scrollTo(0, 0);
    }
    if (prevLoginRef.current && !isLoggedIn) {
      if (window.location.hash !== '#home') history.replaceState(null, '', '#home');
      setHashTick((t) => t + 1);
    }
    prevLoginRef.current = isLoggedIn;
  }, [isLoggedIn]);

  /* Dialog logout */
  useEffect(() => {
    const d = dlgRef.current;
    if (!d) return;
    if (askLogout && !d.open) d.showModal();
    if (!askLogout && d.open) d.close();
  }, [askLogout]);

  /* Scroll progress bar */
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

  /* Hash change + keyboard + click outside */
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

  /* ============ RENDER GUARDS ============ */
  if (!ready) {
    return (
      <div className="loader">
        <span>A7 K60 DTA</span>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <Suspense fallback={<div className="loader"><span>A7 K60 DTA</span></div>}>
        <LoginPage />
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
    if (page.startsWith('exam/')) {
      return (
        <ExamDetail
          examId={page.replace('exam/', '')}
          onBack={() => { window.location.hash = 'tools'; }}
        />
      );
    }
    if (page === 'ai') return <AIChat />;
    if (page === 'formulas') return <FormulaCalculator />;
    if (page === 'analyze') return <CompoundAnalyzer />;
    if (page === 'balance') return <EquationBalancer />;
    if (page === 'pomodoro') return <Pomodoro />;
    if (page === 'exam') return <ExamCountdown />;
    if (page === 'notes') return <Notes />;
    if (page === 'notebook') return <WrongNotebook />;
    if (page === 'grade') return <GradeCalculator />;
    if (page === 'quiz') return <Quiz />;
    if (page === 'stats') return <StatsPage />;
    if (page === 'profile') return <ProfilePage />;
    if (page === 'games') return <GameHub />;
    if (page === 'games/chicken') return <Chicken2D />;
    if (page === 'games/slingshot') return <SlingshotGame />;
    if (page === 'games/jeopardy') return <JeopardyGame />;
    if (page === 'games/lab') return <VirtualLab />;
    if (page === 'games/battle') return <ElementBattle />;
    if (page === 'games/sudoku') return <ChemSudoku />;
    if (page === 'admin' && isAdmin(user)) {
      return (
        <AdminLayout active={adminTab} onNavigate={setAdminTab}>
          {adminTab === 'dashboard' && <Dashboard onNavigate={setAdminTab} />}
          {adminTab === 'exams' && <ExamManager />}
          {adminTab === 'questions' && <QuestionManager />}
          {adminTab === 'users' && <UserManager />}
          {adminTab === 'activity' && <ActivityPage />}
          {adminTab === 'settings' && <SettingsPage />}
        </AdminLayout>
      );
    }
    return <Home />;
  };

  /* ============ LAYOUT ============ */
  return (
    <>
      <a className="skip-link" href="#main">Bỏ qua điều hướng</a>
      <div className="scroll-progress" ref={progRef} aria-hidden="true" />

      {/* Widget nổi — luôn mount */}
      <PetWidget />
      <ChatWidget />

      {/* Loader ban đầu — ẩn sau 700ms */}
      <div className={'loader' + (loading ? '' : ' hide')} aria-hidden={!loading}>
        <span>A7 K60 DTA</span>
      </div>

      {/* Mobile header */}
      <MobileHeader
        page={page}
        theme={theme}
        onSearch={() => {
          if (window.location.hash !== '#table') window.location.hash = 'table';
          setTimeout(() => document.getElementById('search')?.focus(), 100);
        }}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        onMenu={() => setMenu(true)}
      />

      {/* Desktop nav */}
      <DesktopNav
        page={page}
        theme={theme}
        scrolled={scrolled}
        isAdmin={isAdmin(user)}
        onSearch={() => {
          if (window.location.hash !== '#table') window.location.hash = 'table';
          setTimeout(() => document.getElementById('search')?.focus(), 100);
        }}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        onLogout={() => setAskLogout(true)}
      />

      {/* Bottom sheet mobile */}
      <StudySheet open={menu} onClose={() => setMenu(false)} />

      {/* ============ MAIN CONTENT ============ */}
      <main id="main" tabIndex={-1}>
        <Suspense fallback={<PageLoader />}>
          {renderPage()}
        </Suspense>
      </main>

      {/* Logout dialog */}
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

      {/* Footer */}
      <footer className="foot">
        <div>
          <b>A7 K60 DTA</b>
          <p>bycode Duy TK</p>
        </div>
        <nav aria-label="Liên kết chân trang">
          <a href="#table">Bảng tuần hoàn</a>
          <a href="#formulas">Công thức nhanh</a>
          <a href="#balance">Cân bằng PTHH</a>
          <a href="#notebook">Sổ tay</a>
          <a href="#stats">Thống kê</a>
          <a href="#pomodoro">Pomodoro</a>
          <a href="#exam">Kỳ thi</a>
          <a href="#grade">Tính điểm</a>
          <a href="#games">Trò chơi</a>
        </nav>
        <small>© 2026 A7 K60 DTA — bycode Duy TK</small>
      </footer>

      {/* Bottom nav mobile */}
      <BottomNav page={page} />

      {/* Command palette — Ctrl/Cmd + K */}
      <CommandPalette />
    </>
  );
}