import { useState, useEffect, useRef } from 'react';
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
import AIChat from './components/AIChat.jsx';

const NAV_MAIN = [
  ['home', 'Trang chủ'],
  ['table', 'Bảng tuần hoàn'],
  ['formulas', 'Công thức nhanh'],
];

const NAV_TOOLS = [
  ['ai', 'Trợ lý AI'],              // ← ĐỔI DÒNG NÀY
  ['analyze', 'Phân tích'],
  ['balance', 'Cân bằng PTHH'],
  ['pomodoro', 'Pomodoro'],
  ['exam', 'Kỳ thi'],
  ['notes', 'Ghi chú'],
  ['grade', 'Tính điểm'],
  ['quiz', 'Ôn tập'],
  ['games', 'Trò chơi'],
];

const PAGES = [...NAV_MAIN, ...NAV_TOOLS];

const readPage = () => {
  const h = location.hash.slice(1);

  if (h === 'games/chicken') return 'games/chicken';
  if (h === 'games/slingshot') return 'games/slingshot';
  if (h === 'games/jeopardy') return 'games/jeopardy';

  return PAGES.some((p) => p[0] === h) ? h : 'home';
};

export default function App() {
  const [page, setPage] = useState(readPage);
  const [menu, setMenu] = useState(false);
  const [toolOpen, setToolOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const navRef = useRef(null);

  const [theme, setTheme] = useLocalStorage(
    'cs-theme',
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

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

  // LOG để debug — mở Console xem page đang là gì
  useEffect(() => {
    console.log('[App] page =', page);
  }, [page]);

  return (
    <>
      <PetWidget />
      <ChatWidget />

      <div className={'loader' + (loading ? '' : ' hide')} aria-hidden={!loading}>
        <span>A7 K60 DTA</span>
      </div>

      <header className="nav" ref={navRef}>
        <a className="brand" href="#home">A7 K60 DTA</a>

        <nav className={'links' + (menu ? ' open' : '')} aria-label="Điều hướng chính">
          {NAV_MAIN.map(([id, label]) => (
            <a key={id} href={'#' + id} aria-current={page === id ? 'page' : undefined}>
              {label}
            </a>
          ))}

          <div className="navdrop">
            <button
              type="button"
              className="navdrop-btn"
              onClick={(e) => {
                e.stopPropagation();
                setToolOpen((o) => !o);
              }}
              aria-expanded={toolOpen}
              aria-haspopup="menu"
              aria-current={isToolPage ? 'page' : undefined}
            >
              Công cụ
            </button>

            {toolOpen && (
              <div className="navdrop-menu" role="menu">
                {NAV_TOOLS.map(([id, label]) => (
                  <a
                    key={id}
                    href={'#' + id}
                    role="menuitem"
                    aria-current={page === id ? 'page' : undefined}
                    onClick={() => {
                      setToolOpen(false);
                      setMenu(false);
                    }}
                  >
                    {label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </nav>

        <button
          className="btn icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          type="button"
          style={{ fontSize: '1.1rem', lineHeight: 1 }}
        >
          {theme === 'dark' ? '○' : '●'}
        </button>

        <button
          className="btn icon burger"
          onClick={() => setMenu(!menu)}
          aria-expanded={menu}
          type="button"
          style={{ fontSize: '1.4rem', lineHeight: 1 }}
        >
          ≡
        </button>
      </header>

      <main>
        {page === 'home' && <Home />}
        {page === 'table' && (
          <section className="wrap">
            <h1>Bảng tuần hoàn</h1>
            <PeriodicTable />
          </section>
        )}
        {page === 'ai' && <AIChat />}         {/* ← ĐỔI 'ai-chat' thành 'ai' */}
        {page === 'formulas' && <FormulaCalculator />}
        {page === 'analyze' && <CompoundAnalyzer />}
        {page === 'balance' && <EquationBalancer />}
        {page === 'pomodoro' && <Pomodoro />}
        {page === 'exam' && <ExamCountdown />}
        {page === 'notes' && <Notes />}
        {page === 'grade' && <GradeCalculator />}
        {page === 'quiz' && <Quiz />}

        {page === 'games' && <GameHub />}
        {page === 'games/chicken' && <Chicken2D />}
      </main>

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
    </>
  );
}