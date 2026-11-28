import { useState, useEffect, useRef, lazy, Suspense, useCallback, useMemo } from 'react';
import { isAdmin } from './lib/isAdmin.js'; // nguồn duy nhất (claims), thay cho bản cũ đọc VITE_ADMIN_EMAILS
import { CAMERA_GAMES } from './lib/cameraGames.js';
import { useLocalStorage } from './hooks.js';
import { PageLoader } from './components/ElecIntroLoader.jsx';
import { useAuth } from './hooks/useAuth.jsx';
import { useSettings } from './contexts/SettingsContext.jsx';
import { useSeoHead } from './hooks/useSeoHead.js';
import { clearPostAuthRedirect } from './lib/userRole.js';

/* ============ LAZY SHELLS & WIDGETS ============ */
const AuthenticatedAppShell = lazy(() => import('./components/AuthenticatedAppShell.jsx'));
const PublicToolShell = lazy(() => import('./components/PublicToolShell.jsx'));
const SystemAnnouncementBanner = lazy(() => import('./components/SystemAnnouncementBanner.jsx'));
const UniversityDetailModal = lazy(() => import('./components/aspiration/UniversityDetailModal.jsx'));
const VerifyEmailGate = lazy(() => import('./components/VerifyEmailGate.jsx'));
const AuthActionPage = lazy(() => import('./components/AuthActionPage.jsx'));

/* ============ LAZY PAGES ============ */
const Home = lazy(() => import('./components/Home.jsx'));
const Landing = lazy(() => import('./components/Landing.jsx'));
const PeriodicTable = lazy(() => import('./components/PeriodicTable.jsx'));
const ClockHub = lazy(() => import('./components/ClockHub.jsx'));
const Schedule = lazy(() => import('./components/Schedule.jsx'));
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
const RoadmapPage = lazy(() => import('./components/roadmap/RoadmapPage.jsx'));
const DedicatedLessonView = lazy(() => import('./components/roadmap/DedicatedLessonView.jsx'));
const LeaderboardPage = lazy(() => import('./components/LeaderboardPage.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));
const Feedback = lazy(() => import('./pages/Feedback.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));
const AdmissionLookup = lazy(() => import('./components/AdmissionLookup.jsx'));
const CareerPath = lazy(() => import('./components/CareerPath.jsx'));
const DocStudio = lazy(() => import('./components/DocStudio.jsx'));
const ChalkboardView = lazy(() => import('./components/ChalkboardView.jsx'));
const ScienceSimLab = lazy(() => import('./components/ScienceSimLab.jsx'));
const PhysicsLabPage = lazy(() => import('./features/physics/PhysicsLabPage.jsx'));
const BiologyLabPage = lazy(() => import('./features/biology/BiologyLabPage.jsx'));
const Casio580Page = lazy(() => import('./components/Casio580Page.jsx'));

/* ============ GAMES ============ */
const GameHub = lazy(() => import('./components/games/GameHub.jsx'));
const Chicken2D = lazy(() => import('./components/games/Chicken2D.jsx'));
const SlingshotGame = lazy(() => import('./components/games/SlingshotGame.jsx'));
const JeopardyGame = lazy(() => import('./components/games/JeopardyGame.jsx'));
const VirtualLab = lazy(() => import('./components/games/VirtualLab.jsx'));
const ElementBattle = lazy(() => import('./components/games/ElementBattle.jsx'));
const ChemSudoku = lazy(() => import('./components/games/ChemSudoku.jsx'));
const TugOfWarGame = lazy(() => import('./components/games/TugOfWarGame.jsx'));
const LuckyWheelGame = lazy(() => import('./components/games/LuckyWheelGame.jsx'));
const FlipPuzzleGame = lazy(() => import('./components/games/FlipPuzzleGame.jsx'));
const MillionaireGame = lazy(() => import('./components/games/MillionaireGame.jsx'));
const QuizRacingGame = lazy(() => import('./components/games/QuizRacingGame.jsx'));
const MinesweeperQuiz = lazy(() => import('./components/games/MinesweeperQuiz.jsx'));
const QuizDuel = lazy(() => import('./components/games/QuizDuel.jsx'));
const CameraGame = lazy(() => import('./components/games/CameraGame.jsx'));
const Lab3D = lazy(() => import('./features/lab3d/Lab3D.jsx'));

/* ============ CLASSROOM & ADMIN ============ */
const TeacherDashboard = lazy(() => import('./components/TeacherDashboard.jsx'));
const ExamJoin = lazy(() => import('./components/ExamJoin.jsx'));
const StudentClass = lazy(() => import('./components/StudentClass.jsx'));
const MyClasses = lazy(() => import('./components/MyClasses.jsx'));
const AdminPanel = lazy(() => import('./components/admin/AdminPanel.jsx'));

/* ============ ROUTES METADATA ============ */
const VALID_PAGES = new Set([
  'home', 'ai', 'tools', 'profile',
  'roadmap', 'casio', 'formulas', 'analyze', 'balance', 'quiz', 'notebook', 'doc-studio', 'chalkboard', 'notes',
  'admission', 'career', 'schedule', 'pomodoro', 'exam', 'grade', 'leaderboard', 'stats',
  'physics-lab', 'biology-lab', 'sim-lab', 'games', 'table',
  'admin', 'settings', 'feedback', 'classroom', 'my-classes', 'virtual-exams', 'study', 'truong', 'tap-trung',
]);

const GAME_ROUTES = [
  'chicken', 'slingshot', 'jeopardy', 'lab', 'battle', 'sudoku',
  'tugofwar', 'wheel', 'flip', 'millionaire', 'racing', 'mines', 'duel', 'lab-3d',
  ...CAMERA_GAMES.map((g) => g.id),
].map((g) => 'games/' + g);

const CLEAN_PATH_MAP = {
  'bang-tuan-hoan': 'table',
  'can-bang-phuong-trinh-hoa-hoc': 'balance',
  'cong-thuc-hoa-hoc': 'formulas',
  'lo-trinh-on-thi-thpt-quoc-gia': 'roadmap',
  'phong-thi-ao': 'virtual-exams',
  'tai-lieu-hoa-hoc': 'tools',
  'tinh-diem-xet-tuyen-dai-hoc': 'grade',
  'tro-ly-ai-giai-hoa': 'ai',
  'chinh-sua-ho-so': 'profile',
  'mua-credit': 'profile',
  'goi-cua-toi': 'profile',
  'tra-cuu-diem-chuan': 'admission',
  'dinh-huong-nghe-nghiep': 'career',
  'ai-doc-studio': 'doc-studio',
  'bang-phan-tuong-tac': 'chalkboard',
  'tro-choi-khoa-hoc': 'games',
  'bang-xep-hang': 'leaderboard',
  'quiz': 'quiz',
  'mo-phong-khtn': 'sim-lab',
  'phong-thi-nghiem-vat-li': 'physics-lab',
  'phong-thi-nghiem-sinh-hoc': 'biology-lab',
  'may-tinh-casio-580': 'casio',
  'tap-trung': 'pomodoro',
  'auth-action': 'auth-action',
};

const PUBLIC_SEO_PAGES = [
  'ai', 'table', 'balance', 'formulas', 'casio', 'roadmap', 'study', 'grade',
  'virtual-exams', 'tools', 'admission', 'career', 'doc-studio',
  'chalkboard', 'sim-lab', 'physics-lab', 'biology-lab', 'quiz', 'games', 'leaderboard', 'pomodoro', 'tap-trung', 'schedule',
];

const readPage = () => {
  if (typeof window === 'undefined') return 'home';

  const raw = (window.location.hash || '').replace(/^#\/?/, '').split('?')[0].replace(/^\/+/, '');
  const h = raw;
  if (h) {
    if (h === 'login' || h === 'register' || h === 'auth-action') return h;
    if (GAME_ROUTES.includes(h)) return h;
    if (h.startsWith('exam/')) return h;
    if (h === 'truong' || h.startsWith('truong/')) return h;
    if (h === 'admin' || h.startsWith('admin/')) return 'admin';
    if (h === 'main' || h === 'home') return 'home';
    if (VALID_PAGES.has(h)) return h;
  }

  const searchParams = new URLSearchParams(window.location.search || '');
  if (searchParams.get('oobCode') && searchParams.get('mode')) {
    return 'auth-action';
  }

  const path = (window.location.pathname || '').replace(/^\/+/, '').split('/')[0];
  if (CLEAN_PATH_MAP[path]) return CLEAN_PATH_MAP[path];

  if (!h || h === '' || h === 'home') return 'home';
  return '404';
};

/* ============ MAIN APP (LIGHTWEIGHT ROUTER ENTRY) ============ */
export default function App() {
  const { ready, profileReady, isLoggedIn, user, logout } = useAuth();
  const { settings } = useSettings();
  const [hashTick, setHashTick] = useState(0);
  const [theme, setTheme] = useLocalStorage('cs-theme-v2', 'dark');

  const rawPage = useMemo(() => readPage(), [hashTick]); // eslint-disable-line react-hooks/exhaustive-deps
  const page = !isLoggedIn && rawPage === '404' ? 'home' : rawPage;

  const needsEmailVerification = Boolean(
    isLoggedIn &&
    user &&
    !user.emailVerified &&
    user.providerData?.some((p) => p.providerId === 'password') &&
    !isAdmin(user)
  );

  /* ============ THEME ============ */
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === 'dark' ? '#030618' : '#f3f6ff';
  }, [theme]);

  useEffect(() => {
    const onToggleThemeEvt = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    window.addEventListener('elec-toggle-theme', onToggleThemeEvt);
    return () => window.removeEventListener('elec-toggle-theme', onToggleThemeEvt);
  }, [setTheme]);

  /* ============ DYNAMIC SEO ============ */
  useSeoHead(page);

  useEffect(() => {
    document.getElementById('main')?.focus({ preventScroll: true });
  }, [page]);

  /* ============ ADMIN GUARD ============ */
  useEffect(() => {
    if (!ready) return;
    if (page === 'admin' && !isAdmin(user)) {
      window.location.hash = 'home';
    }
  }, [ready, page, user]);

  /* ============ LOGOUT CLEANUP ============ */
  const prevLoginRef = useRef(isLoggedIn);
  useEffect(() => {
    if (prevLoginRef.current && !isLoggedIn) {
      clearPostAuthRedirect();
      if (window.location.hash !== '#home') history.replaceState(null, '', '#home');
      setHashTick((t) => t + 1);
    }
    prevLoginRef.current = isLoggedIn;
  }, [isLoggedIn]);

  /* ============ HASH LISTENER ============ */
  useEffect(() => {
    const syncSubjectFromHash = () => {
      try {
        const rawHash = window.location.hash || '';
        const qIdx = rawHash.indexOf('?');
        if (qIdx === -1) return;
        const params = new URLSearchParams(rawHash.slice(qIdx + 1));
        const subj = params.get('subject');
        if (subj && ['all', 'ly', 'hoa', 'sinh'].includes(subj)) {
          localStorage.setItem('elec-current-subject', subj);
          window.dispatchEvent(new CustomEvent('cs-ls', { detail: 'elec-current-subject' }));
          window.dispatchEvent(new CustomEvent('elec-subject-change', { detail: { subject: subj } }));
        }
      } catch {}
    };
    syncSubjectFromHash();
    const onHash = () => {
      syncSubjectFromHash();
      setHashTick((x) => x + 1);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = useCallback((target) => {
    if (!target) return;
    const next = target.replace(/^#/, '');
    if (window.location.hash === `#${next}`) {
      setHashTick((t) => t + 1);
    } else {
      window.location.hash = next;
    }
  }, []);

  /* ============ PAGE RENDERER ============ */
  const renderPage = useCallback(({ isTeacherAccount = false, credits = null } = {}) => {
    if (page === 'home') return <Home />;

    if (page === 'table') {
      return (
        <section className="wrap pt-page-wrap">
          <PeriodicTable />
        </section>
      );
    }

    if (page === 'tools') return <ToolsPage />;

    if (page === 'classroom') {
      return isTeacherAccount ? <TeacherDashboard /> : <StudentClass />;
    }
    if (page === 'my-classes') {
      return <MyClasses onNavigate={navigate} />;
    }

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
    if (page === 'pomodoro' || page === 'tap-trung') return <ClockHub />;
    if (page === 'schedule') return <Schedule />;
    if (page === 'exam') return <ExamCountdown />;
    if (page === 'notes') return <Notes />;
    if (page === 'notebook') return <WrongNotebook />;
    if (page === 'grade') return <GradeCalculator />;
    if (page === 'quiz' || page === 'virtual-exams') return <Quiz />;
    if (page === 'roadmap') return <RoadmapPage />;
    if (page === 'study') {
      const p = new URLSearchParams((window.location.hash.split('?')[1] || ''));
      const lesson = p.get('lesson') || 'ly-chuyen-dong-nem';
      const subject = p.get('subject') || 'ly';
      return (
        <DedicatedLessonView
          initialLessonId={lesson}
          initialSubject={subject}
          onBack={() => { window.location.hash = '#roadmap'; }}
          uid={user?.uid}
        />
      );
    }
    if (page === 'leaderboard') return <LeaderboardPage />;
    if (page === 'admission') return <AdmissionLookup />;
    if (page === 'career') return <CareerPath />;
    if (page === 'doc-studio') return <DocStudio />;
    if (page === 'chalkboard') return <ChalkboardView />;
    if (page === 'sim-lab') return <ScienceSimLab onNavigate={navigate} />;
    if (page === 'physics-lab') return <PhysicsLabPage onNavigate={navigate} />;
    if (page === 'biology-lab') return <BiologyLabPage onNavigate={navigate} />;
    if (page === 'casio') return <Casio580Page />;

    if (page === 'truong' || page.startsWith('truong/')) {
      const schoolId = page.startsWith('truong/') ? page.replace('truong/', '') : 'NEU';
      return (
        <>
          <Home />
          <UniversityDetailModal
            open={true}
            schoolId={schoolId || 'NEU'}
            uid={user?.uid}
            onClose={() => { window.location.hash = 'home'; }}
          />
        </>
      );
    }

    if (page === 'stats') return <StatsPage />;
    if (page === 'profile') return <ProfilePage credits={credits} />;
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
    if (page === 'games/tugofwar') return <TugOfWarGame />;
    if (page === 'games/wheel') return <LuckyWheelGame />;
    if (page === 'games/flip') return <FlipPuzzleGame />;
    if (page === 'games/millionaire') return <MillionaireGame />;
    if (page === 'games/racing') return <QuizRacingGame />;
    if (page === 'games/mines') return <MinesweeperQuiz onExit={() => navigate('games')} />;
    if (page === 'games/duel') return <QuizDuel />;
    if (page === 'games/lab-3d') return <Lab3D />;
    if (page.startsWith('games/cam-')) {
      return <CameraGame gameId={page.replace('games/', '')} onExit={() => navigate('games')} />;
    }

    if (page === 'admin' && isAdmin(user)) {
      return <AdminPanel />;
    }

    return <Home />;
  }, [page, navigate, theme, setTheme, user]);

  /* ============ GUARDS ============ */
  const hasLocalSessionHint = (() => {
    if (typeof window === 'undefined') return false;
    try {
      if (localStorage.getItem('elec-has-session') === '1') return true;
      for (let i = 0; i < localStorage.length; i += 1) {
        const k = localStorage.key(i) || '';
        if (k.startsWith('firebase:authUser:')) return true;
      }
    } catch { /* ignore */ }
    return false;
  })();

  const isGuestImmediateRoute =
    page === 'home' ||
    page === 'login' ||
    page === 'register' ||
    PUBLIC_SEO_PAGES.includes(page);

  if (!ready && (hasLocalSessionHint || !isGuestImmediateRoute)) {
    return null;
  }

  if (page === 'auth-action') {
    return (
      <Suspense fallback={<PageLoader />}>
        <AuthActionPage />
      </Suspense>
    );
  }

  if (!isLoggedIn) {
    if (PUBLIC_SEO_PAGES.includes(page)) {
      return (
        <Suspense fallback={<PageLoader />}>
          <PublicToolShell page={page} renderPage={renderPage} />
        </Suspense>
      );
    }

    return (
      <Suspense fallback={<PageLoader />}>
        <SystemAnnouncementBanner />
        <Landing
          theme={theme}
          onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          authOpen={page === 'login' || page === 'register' || page === 'profile' || page.startsWith('exam/')}
          authMode={page === 'register' ? 'register' : 'login'}
        />
      </Suspense>
    );
  }

  if (needsEmailVerification) {
    return (
      <Suspense fallback={<PageLoader />}>
        <VerifyEmailGate />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <AuthenticatedAppShell
        page={page}
        hashTick={hashTick}
        setHashTick={setHashTick}
        readPage={readPage}
        theme={theme}
        setTheme={setTheme}
        user={user}
        logout={logout}
        profileReady={profileReady}
        settings={settings}
        renderPage={renderPage}
      />
    </Suspense>
  );
}
