﻿import { useState, useEffect, useRef } from 'react';
import { useLocalStorage } from './hooks.js';
import Home from './components/Home.jsx';
import PeriodicTable from './components/PeriodicTable.jsx';
import Pomodoro from './components/Pomodoro.jsx';
import ExamCountdown from './components/ExamCountdown.jsx';
import Notes from './components/Notes.jsx';
import PetWidget from './components/PetWidget.jsx';
import ChatWidget from './components/ChatWidget.jsx';
import Quiz from './components/Quiz.jsx';
import FormulaCalculator from './components/FormulaCalculator.jsx';
import GradeCalculator from './components/GradeCalculator.jsx';
import CompoundAnalyzer from './components/CompoundAnalyzer.jsx';
import EquationBalancer from './components/EquationBalancer.jsx';
import GameHub from './components/games/GameHub.jsx';
import Chicken2D from './components/games/Chicken2D.jsx';
import SlingshotGame from './components/games/SlingshotGame.jsx';
import JeopardyGame from './components/games/JeopardyGame.jsx';
import AIChat from './components/AIChat.jsx';
import VirtualLab from './components/games/VirtualLab.jsx';
import ElementBattle from './components/games/ElementBattle.jsx';
import ChemSudoku from './components/games/ChemSudoku.jsx';
import { useAuth } from './hooks/useAuth.jsx';
import LoginPage from './components/LoginPage.jsx';
import ProfilePage from './components/ProfilePage.jsx';
import './app-extra.css';
import MobileHeader from './components/MobileHeader.jsx';
import AIMark from './components/AIMark.jsx';
import ToolsPage from './components/ToolsPage.jsx';
import {
  IconHome, IconAtom, IconCalc, IconRobot, IconMicroscope, IconScale,
  IconTimer, IconCalendar, IconNote, IconTarget, IconQuiz, IconGamepad,
  IconTools, IconSun, IconMoon, IconMenu, IconClose, IconUser,
} from './components/Icons.jsx';

const NAV_MAIN = [
  ['home', 'Trang chủ', IconHome],
  ['ai', 'CU AI', IconRobot],
  ['table', 'Bảng tuần hoàn', IconAtom],
  ['tools', 'Công cụ', IconTools],
];

const NAV_TOOLS = [
  ['analyze', 'Phân tích', IconMicroscope],
  ['balance', 'Cân bằng PTHH', IconScale],
  ['pomodoro', 'Pomodoro', IconTimer],
  ['exam', 'Kỳ thi', IconCalendar],
  ['notes', 'Ghi chú', IconNote],
  ['grade', 'Tính điểm', IconTarget],
  ['quiz', 'Ôn tập', IconQuiz],
  ['games', 'Trò chơi', IconGamepad],
  ['profile', 'Trang cá nhân', IconUser],
];

const NAV_BOTTOM = [
  ['home', 'Trang chủ', IconHome],
  ['table', 'Bảng TH', IconAtom],
  ['ai', 'AI', 'aimark'],
  ['games', 'Trò chơi', IconGamepad],
  ['profile', 'Cá nhân', IconUser],
];

const PAGES = [...NAV_MAIN, ...NAV_TOOLS];

const GAME_ROUTES = ['chicken', 'slingshot', 'jeopardy', 'lab', 'battle', 'sudoku'].map((g) => 'games/' + g);

const readPage = () => {
  const h = location.hash.slice(1);
  if (GAME_ROUTES.includes(h)) return h;
  return PAGES.some((p) => p[0] === h) ? h : 'home';
};

const pageTitle = (page) => {
  const hit = PAGES.find((p) => p[0] === page);
  return (hit ? hit[1] : page.startsWith('games/') ? 'Trò chơi' : 'Trang chủ') + ' · A7 K60 DTA';
};

export default function App() {
  const { ready, isLoggedIn, user, logout } = useAuth();

  const [page, setPage] = useState(readPage);
  const [menu, setMenu] = useState(false);
  const [toolOpen, setToolOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [askLogout, setAskLogout] = useState(false);
  const dlgRef = useRef(null);
  const navRef = useRef(null);
  const progRef = useRef(null);

  const [theme, setTheme] = useLocalStorage('cs-theme-v2', 'dark');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    document.title = pageTitle(page);
    document.getElementById('main')?.focus({ preventScroll: true });
  }, [page]);

  useEffect(() => {
    const d = dlgRef.current;
    if (!d) return;
    if (askLogout && !d.open) d.showModal();
    if (!askLogout && d.open) d.close();
  }, [askLogout]);

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

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);

    const onHash = () => {
      setPage(readPage());
      setMenu(false);
      setToolOpen(false);
      window.scrollTo(0, 0);
    };

    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (location.hash !== '#table') location.hash = 'table';
        setTimeout(() => document.getElementById('search')?.focus(), 60);
      }
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

  const isToolPage = NAV_TOOLS.some(([id]) => id === page);

  if (!ready) {
    return (
      <div className="loader">
        <span>A7 K60 DTA</span>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginPage />;
  }

  return (
    <>
      <a className="skip-link" href="#main">Bỏ qua điều hướng</a>
      <div className="scroll-progress" ref={progRef} aria-hidden="true" />
      <PetWidget />
      <ChatWidget />

      <div className={'loader' + (loading ? '' : ' hide')} aria-hidden={!loading}>
        <span>A7 K60 DTA</span>
      </div>

      <MobileHeader
        page={page}
        theme={theme}
        onSearch={() => {
          if (location.hash !== '#table') location.hash = 'table';
          setTimeout(() => document.getElementById('search')?.focus(), 100);
        }}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        onMenu={() => setMenu(true)}
      />

      <header className={'nav-wrap' + (scrolled ? ' scrolled' : '')} ref={navRef}>
        <div className="nav-apple">
          <a className="nav-logo" href="#home" aria-label="Trang chủ">
            <span className="logo-text">A7 K60 DTA</span>
          </a>

          <nav className="nav-links" aria-label="Điều hướng chính">
            {NAV_MAIN.map(([id, label, Icon]) => (
              <a
                key={id}
                href={'#' + id}
                className={'nav-item' + (page === id ? ' active' : '')}
                aria-current={page === id ? 'page' : undefined}
                title={label}
              >
                <span className="nav-ico" aria-hidden="true"><Icon /></span>
                <span className="nav-label">{label}</span>
              </a>
            ))}
            {/* ĐÃ XÓA DROPDOWN "CÔNG CỤ" — vì đã có mục riêng trong NAV_MAIN */}
          </nav>

          <div className="nav-actions">
            <button
              className="nav-icon-btn"
              onClick={() => setAskLogout(true)}
              type="button"
              aria-label="Đăng xuất"
              title={`Đăng xuất (${user?.displayName || user?.email || ''})`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>

            <button
              className="nav-icon-btn"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              type="button"
              aria-label={theme === 'dark' ? 'Bật chế độ sáng' : 'Bật chế độ tối'}
              title={theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
            >
              {theme === 'dark' ? <IconSun /> : <IconMoon />}
            </button>

            <button
              className="nav-icon-btn nav-burger"
              onClick={(e) => {
                e.stopPropagation();
                setToolOpen(false);
                setMenu((m) => !m);
              }}
              aria-expanded={menu}
              type="button"
              aria-label="Mở menu"
            >
              {menu ? <IconClose /> : <IconMenu />}
            </button>
          </div>
        </div>

        <div className={'nav-sheet' + (menu ? ' open' : '')} role="menu" aria-hidden={!menu}>
          <p className="nav-sheet-label">Điều hướng</p>
          <div className="nav-sheet-grid">
            {NAV_MAIN.map(([id, label, Icon]) => (
              <a
                key={id}
                href={'#' + id}
                role="menuitem"
                tabIndex={menu ? 0 : -1}
                className={page === id ? 'active' : undefined}
                onClick={() => setMenu(false)}
              >
                <span aria-hidden="true"><Icon /></span>
                {label}
              </a>
            ))}
          </div>
          <p className="nav-sheet-label">Công cụ</p>
          <div className="nav-sheet-grid">
            {NAV_TOOLS.map(([id, label, Icon]) => (
              <a
                key={id}
                href={'#' + id}
                role="menuitem"
                tabIndex={menu ? 0 : -1}
                className={page === id || (id === 'games' && page.startsWith('games/')) ? 'active' : undefined}
                onClick={() => setMenu(false)}
              >
                <span aria-hidden="true"><Icon /></span>
                {label}
              </a>
            ))}
          </div>

          <p className="nav-sheet-label">Tài khoản</p>
          <div className="nav-sheet-grid">
            <button type="button" className="sheet-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              <span>
                {theme === 'dark' ? <IconSun /> : <IconMoon />}
              </span>
              {theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
            </button>
            <button type="button" className="sheet-btn danger" onClick={() => { setMenu(false); setAskLogout(true); }}>
              <span aria-hidden="true">↪</span>
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1}>
        {page === 'home' && <Home />}
        {page === 'table' && (
          <section className="wrap">
            <h1>Bảng tuần hoàn</h1>
            <PeriodicTable />
          </section>
        )}
        {page === 'tools' && <ToolsPage />}
        <div style={{ display: page === 'ai' ? 'block' : 'none' }}>
          <AIChat />
        </div>
        {page === 'formulas' && <FormulaCalculator />}
        {page === 'analyze' && <CompoundAnalyzer />}
        {page === 'balance' && <EquationBalancer />}
        {page === 'pomodoro' && <Pomodoro />}
        {page === 'exam' && <ExamCountdown />}
        {page === 'notes' && <Notes />}
        {page === 'grade' && <GradeCalculator />}
        {page === 'quiz' && <Quiz />}
        {page === 'profile' && <ProfilePage />}

        {page === 'games' && <GameHub />}
        {page === 'games/chicken' && <Chicken2D />}
        {page === 'games/slingshot' && <SlingshotGame />}
        {page === 'games/jeopardy' && <JeopardyGame />}
        {page === 'games/lab' && <VirtualLab />}
        {page === 'games/battle' && <ElementBattle />}
        {page === 'games/sudoku' && <ChemSudoku />}
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

      <footer className="foot">
        <div>
          <b>A7 K60 DTA</b>
          <p>bycode Duy TK</p>
        </div>
        <nav aria-label="Liên kết chân trang">
          <a href="#table">Bảng tuần hoàn</a>
          <a href="#formulas">Công thức nhanh</a>
          <a href="#balance">Cân bằng PTHH</a>
          <a href="#pomodoro">Pomodoro</a>
          <a href="#exam">Kỳ thi</a>
          <a href="#grade">Tính điểm</a>
          <a href="#games">Trò chơi</a>
        </nav>
        <small>© 2026 A7 K60 DTA — bycode Duy TK</small>
      </footer>

      <nav className="bottom-nav" aria-label="Điều hướng di động">
        {NAV_BOTTOM.map(([id, label, Icon]) => {
          const isActive =
            page === id ||
            (id === 'games' && page.startsWith('games/'));
          return (
            <a
              key={id}
              href={'#' + id}
              className={'bnav-item' + (isActive ? ' active' : '')}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="bnav-icon">
                {Icon === 'aimark' ? <AIMark size={24} animate={false} /> : <Icon />}
              </span>
              <span className="bnav-label">{label}</span>
            </a>
          );
        })}
      </nav>
    </>
  );
}