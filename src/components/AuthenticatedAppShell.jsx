import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import '../styles/app-shell-styles.js';
import ErrorBoundary from './ErrorBoundary.jsx';
import PetWidget from './PetWidget.jsx';
import ChatWidget from './ChatWidget.jsx';
import MobileHeader from './MobileHeader.jsx';
import BottomNav from './BottomNav.jsx';
import DesktopNav from './DesktopNav.jsx';
import StudySheet from './StudySheet.jsx';
import CommandPalette from './CommandPalette.jsx';
import SiteFooter from './SiteFooter.jsx';
import LiveSessionBanner from './LiveSessionBanner.jsx';
import SystemAnnouncementBanner from './SystemAnnouncementBanner.jsx';
import GlobalPushBanner from './GlobalPushBanner.jsx';
import OutOfCreditsModal from './OutOfCreditsModal.jsx';
import FeedbackModal from './FeedbackModal.jsx';
import CreditTopUp from './CreditTopUp.jsx';
import StreakModal from './StreakModal.jsx';
import OceanGlassIconDefs from './OceanGlassIconDefs.jsx';
import ElecIntroLoader, { PageLoader } from './ElecIntroLoader.jsx';
import { useTeacherPro } from '../hooks/useTeacherPro.js';
import { isAdmin } from '../lib/isAdmin.js';
import { initSubmitQueue } from '../lib/submitQueue.js';
import { initServerClock } from '../lib/serverClock.js';
import {
  getUserRole,
  peekPostAuthRedirect,
  consumePostAuthRedirect,
} from '../lib/userRole.js';
import { getUserProfile } from '../lib/userProfileService.js';
import { getCredits, onCreditsChange } from '../lib/creditService.js';
import { setExamAiUserId } from '../lib/examAiUtils.js';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase.js';
import { supabase } from '../lib/supabase.js';
import {
  IconHome, IconCalc, IconMicroscope, IconScale,
  IconTimer, IconCalendar, IconNote, IconTarget, IconQuiz, IconGamepad,
  IcoBook,
} from './Icons.jsx';

const OnboardingSurveyModal = lazy(() => import('./OnboardingSurveyModal.jsx'));

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

const NAV_TOOLS_GROUPS = [
  {
    group: 'Học tập & Khảo thí',
    tools: [
      { id: 'roadmap', label: 'Lộ trình KHTN', desc: 'Tiến độ & mục tiêu 3 môn', Icon: IcoBook },
      { id: 'casio', label: 'Máy tính fx-580VN X', desc: 'Mô phỏng Casio 50 phím · 8 chế độ', Icon: IconCalc },
      { id: 'formulas', label: 'Công thức KHTN', desc: 'Tra cứu công thức Lý — Hóa — Sinh', Icon: IconCalc },
      { id: 'analyze', label: 'Phân tích & Hợp chất', desc: 'Nhận diện chất, phản ứng & hiện tượng', Icon: IconMicroscope },
      { id: 'balance', label: 'Cân bằng PTHH', desc: 'Cân bằng bằng đại số tuyến tính', Icon: IconScale },
      { id: 'quiz', label: 'Ôn tập Quiz', desc: 'Quiz thông minh + SRS đa môn', Icon: IconQuiz },
      { id: 'notebook', label: 'Sổ tay lỗi sai', desc: 'Câu sai tự động phân loại theo môn', Icon: IconNotebook },
      { id: 'doc-studio', label: 'AI Doc Studio', desc: 'Học & tạo quiz từ tài liệu', Icon: IconNote },
      { id: 'chalkboard', label: 'Bảng phấn 3D', desc: 'Hình không gian & kiểm định cơ học', Icon: IconScale },
      { id: 'notes', label: 'Ghi chú', desc: 'Note dán trên canvas', Icon: IconNote },
    ],
  },
  {
    group: 'Tiện ích & Hướng nghiệp',
    tools: [
      { id: 'admission', label: 'Tra cứu điểm chuẩn', desc: 'Đo độ vừa sức khối A00, B00, A01, D07', Icon: IconTarget },
      { id: 'career', label: 'Hướng nghiệp AI', desc: 'Test RIASEC & định hướng ngành', Icon: IcoBook },
      { id: 'schedule', label: 'Thời khóa biểu', desc: 'Tự lập lịch học, nhắc đúng giờ', Icon: IconCalendar },
      { id: 'pomodoro', label: 'Clock Hub', desc: 'Pomodoro, hẹn giờ, báo thức', Icon: IconTimer },
      { id: 'exam', label: 'Kỳ thi', desc: 'Đếm ngược kỳ thi THPTQG & ĐGNL', Icon: IconCalendar },
      { id: 'grade', label: 'Tính điểm xét tuyển', desc: 'Tính GPA, điểm xét tuyển ĐH', Icon: IconTarget },
      { id: 'leaderboard', label: 'Bảng xếp hạng', desc: 'Vinh danh chuỗi lớp & học sinh', Icon: IconChart },
      { id: 'stats', label: 'Thống kê', desc: 'Tiến độ học tập & Elo 3 môn', Icon: IconChart },
    ],
  },
  {
    group: 'Giải trí & Trực quan',
    tools: [
      { id: 'physics-lab', label: 'Phòng Lab Vật lí Ảo', desc: 'Ném xiên, Mạch điện DC, Quang hình, Sóng 2D, Con lắc kép & Olympiad', Icon: IconMicroscope },
      { id: 'biology-lab', label: 'Phòng Lab Sinh học (20 Lab)', desc: 'Tế bào 3D, DNA 3D, Giải phẫu người 3D, Kính hiển vi ảo & Sinh thái học', Icon: IconMicroscope },
      { id: 'sim-lab', label: 'Mô phỏng Lý & Sinh', desc: 'Mạch RLC, Y-âng, Đột biến ADN & Punnett', Icon: IconMicroscope },
      { id: 'games', label: 'Trò chơi Khoa học', desc: 'Game tương tác KHTN & lab ảo', Icon: IconGamepad },
      { id: 'table', label: 'Bảng tuần hoàn', desc: '118 nguyên tố tương tác chuẩn IUPAC', Icon: IconHome },
    ],
  },
];

export default function AuthenticatedAppShell({
  page,
  hashTick,
  setHashTick,
  readPage,
  theme,
  setTheme,
  user,
  logout,
  profileReady,
  settings,
  renderPage,
}) {
  const pro = useTeacherPro();
  const [surveyOpen, setSurveyOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [toolOpen, setToolOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [askLogout, setAskLogout] = useState(false);
  const [userRole, setUserRole] = useState('student');
  const [credits, setCredits] = useState(null);
  const [virtualExamActive, setVirtualExamActive] = useState(false);
  const [isMobileScreen, setIsMobileScreen] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );
  const dlgRef = useRef(null);
  const navRef = useRef(null);
  const progRef = useRef(null);
  const handledEntryRedirectRef = useRef(false);

  const effectiveRole =
    pro?.isPro && pro?.isTeacherPro !== false
      ? 'teacher'
      : (userRole === 'teacher' || getUserRole(user) === 'teacher' ? 'teacher' : userRole);
  const isTeacherAccount = Boolean(effectiveRole === 'teacher' || isAdmin(user));

  useEffect(() => {
    initSubmitQueue();
    initServerClock();
  }, []);

  useEffect(() => {
    const onResize = () => setIsMobileScreen(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    setMenu(false);
    setToolOpen(false);
    window.dispatchEvent(new CustomEvent('elec-close-nav-dropdowns'));
  }, [page]);

  useEffect(() => {
    const onVexMode = (e) => setVirtualExamActive(!!e.detail?.active);
    window.addEventListener('elec-virtual-exam-mode', onVexMode);
    return () => window.removeEventListener('elec-virtual-exam-mode', onVexMode);
  }, []);

  useEffect(() => {
    const onManualOpen = () => setSurveyOpen(true);
    window.addEventListener('elec-open-onboarding-survey', onManualOpen);
    return () => window.removeEventListener('elec-open-onboarding-survey', onManualOpen);
  }, []);

  /* ============ ONBOARDING SURVEY AUTO-OPEN ============ */
  useEffect(() => {
    if (!user?.uid || !profileReady) return;
    if (page.startsWith('exam/') || page === 'admin' || page === 'classroom' || page === 'auth-action') return;
    if (peekPostAuthRedirect() === 'classroom') return;
    const prof = getUserProfile(user.uid, user);
    if (isTeacherAccount || prof?.survey?.role === 'teacher') return;
    if (!prof?.survey?.completed && !prof?.survey?.skippedAt) {
      setSurveyOpen(true);
    }
  }, [user?.uid, profileReady, page, user, isTeacherAccount]);

  /* ============ LOAD CREDITS ============ */
  useEffect(() => {
    if (!user?.uid) { setCredits(null); setExamAiUserId(null); return; }
    setExamAiUserId(user.uid);
    getCredits(user.uid).then((c) => setCredits(c.balance)).catch(() => {});
    const unsub = onCreditsChange(user.uid, (data) => setCredits(data.balance));
    const onCreditEvt = (e) => {
      if (e.detail?.balance != null) {
        setCredits(e.detail.balance);
      } else if (e.detail?.delta != null) {
        setCredits((prev) => (prev != null ? prev + e.detail.delta : e.detail.delta));
      }
    };
    window.addEventListener('cs-credit-update', onCreditEvt);
    return () => { unsub(); window.removeEventListener('cs-credit-update', onCreditEvt); };
  }, [user?.uid]);

  /* ============ LOAD ROLE ============ */
  useEffect(() => {
    if (!user?.uid) {
      setUserRole('student');
      return undefined;
    }

    const saveLocalRole = (role) => {
      setUserRole(role);
      try {
        const meta = JSON.parse(localStorage.getItem('cs-user-meta') || '{}');
        meta[user.uid] = { ...(meta[user.uid] || {}), role };
        localStorage.setItem('cs-user-meta', JSON.stringify(meta));
      } catch { /* ignore */ }
    };

    if (pro?.isPro && pro?.isTeacherPro !== false) {
      saveLocalRole('teacher');
      return undefined;
    }

    setUserRole(getUserRole(user));

    let alive = true;
    const syncRoleFromServer = async () => {
      try {
        const { data: prof } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.uid)
          .maybeSingle();
        if (!alive) return;
        if (prof?.role === 'teacher') {
          saveLocalRole('teacher');
          return;
        }
      } catch { /* ignore */ }

      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (!alive) return;
        if (snap.exists()) {
          const remoteRole = snap.data()?.role;
          if (remoteRole === 'teacher' || (remoteRole === 'student' && getUserRole(user) !== 'teacher')) {
            saveLocalRole(remoteRole);
          }
        }
      } catch (e) {
        console.warn('Không load được role:', e);
      }
    };

    syncRoleFromServer();
    const onRoleUpdate = () => {
      if (pro?.isPro && pro?.isTeacherPro !== false) {
        saveLocalRole('teacher');
      } else {
        setUserRole(getUserRole(user));
      }
    };
    window.addEventListener('user-profile-change', onRoleUpdate);
    return () => {
      alive = false;
      window.removeEventListener('user-profile-change', onRoleUpdate);
    };
  }, [user?.uid, pro?.isPro, pro?.isTeacherPro]);

  /* ============ POST-AUTH TEACHER REDIRECT ============ */
  useEffect(() => {
    if (!user?.uid || page === 'auth-action') return;
    const pendingTarget = peekPostAuthRedirect();
    const effectiveTeacher = Boolean(
      isTeacherAccount ||
      getUserRole(user) === 'teacher' ||
      (pro?.isPro && pro?.isTeacherPro !== false)
    );
    const currentRoute = window.location.hash.replace(/^#\/?/, '').split(/[/?]/)[0];
    const onEntryOrHome = !currentRoute || currentRoute === 'home' || currentRoute === 'login' || currentRoute === 'register';

    if (pendingTarget === 'classroom') {
      if (effectiveTeacher) {
        consumePostAuthRedirect();
        handledEntryRedirectRef.current = true;
        setSurveyOpen(false);
        if (window.location.hash !== '#classroom') {
          history.replaceState(null, '', '#classroom');
          setHashTick((t) => t + 1);
        }
        window.scrollTo(0, 0);
      } else if (profileReady) {
        consumePostAuthRedirect();
        handledEntryRedirectRef.current = true;
        if (onEntryOrHome) {
          history.replaceState(null, '', '#home');
          setHashTick((t) => t + 1);
        }
      }
      return;
    }

    if (!handledEntryRedirectRef.current) {
      if (effectiveTeacher && onEntryOrHome) {
        handledEntryRedirectRef.current = true;
        setSurveyOpen(false);
        if (window.location.hash !== '#classroom') {
          history.replaceState(null, '', '#classroom');
          setHashTick((t) => t + 1);
        }
        window.scrollTo(0, 0);
      } else if (profileReady || !onEntryOrHome) {
        handledEntryRedirectRef.current = true;
        if (pendingTarget) consumePostAuthRedirect();
        const isRealRoute = currentRoute !== '' && currentRoute !== 'login' && currentRoute !== 'register' && readPage() !== '404';
        const keep = window.location.hash.startsWith('#exam/') || isRealRoute;
        if (!keep && window.location.hash !== '#home') history.replaceState(null, '', '#home');
        setHashTick((t) => t + 1);
        window.scrollTo(0, 0);
      }
    }
  }, [user, page, isTeacherAccount, profileReady, pro?.isPro, pro?.isTeacherPro, readPage, setHashTick]);

  /* ============ LOGOUT DIALOG ============ */
  useEffect(() => {
    const d = dlgRef.current;
    if (!d) return;
    if (askLogout && !d.open) d.showModal();
    if (!askLogout && d.open) d.close();
  }, [askLogout]);

  /* ============ SCROLL PROGRESS & KEY/CLICK ============ */
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 12);
      const h = document.documentElement.scrollHeight - window.innerHeight;
      if (progRef.current) {
        progRef.current.style.transform = `scaleX(${h > 0 ? Math.min(1, window.scrollY / h) : 0})`;
      }
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
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDocClick);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDocClick);
    };
  }, []);

  const isExamMode = page.startsWith('exam/');
  const isAdminMode = page === 'admin';
  const pageCtx = { isTeacherAccount, credits };

  if (isExamMode) {
    return (
      <Suspense fallback={<PageLoader />}>
        {renderPage(pageCtx)}
      </Suspense>
    );
  }

  if (isAdminMode && isAdmin(user)) {
    return (
      <Suspense fallback={<PageLoader />}>
        {renderPage(pageCtx)}
      </Suspense>
    );
  }

  if (settings?.maintenanceMode && !isAdmin(user)) {
    return (
      <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 24, background: 'var(--bg, #0b1120)', color: 'var(--ink, #f8fafc)', textAlign: 'center' }}>
        <div style={{ maxWidth: 460, padding: '32px 28px', borderRadius: 24, background: 'var(--panel, rgba(255,255,255,0.06))', border: '1px solid var(--line, rgba(255,255,255,0.14))', display: 'grid', gap: 14, justifyItems: 'center' }}>
          <img src="/img/elec/elec-wink.png" alt="ELEC AI" width={84} height={84} style={{ width: 84, height: 84, objectFit: 'contain' }} />
          <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800 }}>Hệ thống đang bảo trì nâng cấp</h1>
          <p style={{ margin: 0, opacity: 0.8, lineHeight: 1.6, fontSize: '0.92rem' }}>
            {settings.siteName || 'ELEC AI'} đang cập nhật dữ liệu và cải thiện hiệu năng. Vui lòng quay lại sau ít phút nhé!
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{ padding: '10px 22px', borderRadius: 999, border: 0, background: '#2563eb', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
          >
            Kiểm tra lại
          </button>
        </div>
      </div>
    );
  }

  const featureDisabledLabel = !isAdmin(user)
    ? (page === 'ai' && settings?.enableAI === false ? 'Trợ lý AI (ELEC AI)'
      : (page === 'games' || page.startsWith('games/')) && settings?.enableGames === false ? 'Trò chơi Khoa học'
      : page === 'quiz' && settings?.enableQuiz === false ? 'Ôn tập (Quiz)'
      : null)
    : null;

  const isAiPage = page === 'ai' && !featureDisabledLabel;
  const isTeacherPage = page === 'classroom' && isTeacherAccount;
  const isVirtualExamRoom = (page === 'quiz' || page === 'virtual-exams') && (virtualExamActive || (typeof document !== 'undefined' && document.body?.dataset?.virtualExamActive === '1'));
  const isFocusStudioPage = page === 'pomodoro' || page === 'tap-trung';
  const isLab3dPage = page === 'games/lab-3d' && !featureDisabledLabel;
  const isFullPage = isAiPage || isTeacherPage || isVirtualExamRoom || isLab3dPage;
  const hidePageChrome = isFullPage || isFocusStudioPage;

  return (
    <div data-page={page} className={isVirtualExamRoom ? 'is-virtual-exam-fullscreen' : isFocusStudioPage ? 'is-focus-fullscreen' : undefined}>
      <OceanGlassIconDefs />
      {!isVirtualExamRoom && !isFocusStudioPage && !isLab3dPage && (
        <a
          className="skip-link"
          href="#main"
          onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}
        >Bỏ qua điều hướng</a>
      )}
      {!hidePageChrome && <div className="scroll-progress" ref={progRef} aria-hidden="true" />}

      {!isFullPage && settings?.enablePet !== false && <PetWidget />}
      {!isVirtualExamRoom && !isFocusStudioPage && !isLab3dPage && settings?.enableChat !== false && <ChatWidget />}
      {!hidePageChrome && (
        <div className="elec-global-bottom-blur" aria-hidden="true">
          <div className="elec-blur-layer l1" />
          <div className="elec-blur-layer l2" />
          <div className="elec-blur-layer l3" />
          <div className="elec-blur-layer l4" />
          <div className="elec-blur-fade" />
        </div>
      )}
      <OutOfCreditsModal />
      <FeedbackModal />
      <CreditTopUp userId={user?.uid} onCreditUpdate={(newBal) => setCredits(newBal)} />
      <StreakModal />
      {surveyOpen && (
        <Suspense fallback={null}>
          <OnboardingSurveyModal
            open={surveyOpen}
            onClose={() => setSurveyOpen(false)}
          />
        </Suspense>
      )}

      {!isVirtualExamRoom && !isLab3dPage && <SystemAnnouncementBanner />}
      {!isVirtualExamRoom && !isLab3dPage && <LiveSessionBanner />}
      <GlobalPushBanner />

      <ElecIntroLoader />

      {!hidePageChrome && isMobileScreen && (
        <MobileHeader
          page={page}
          theme={theme}
          isPro={Boolean(pro.isPro && pro.isTeacherPro !== false)}
          userRole={effectiveRole}
          credits={credits}
          onSearch={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
          onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          onMenu={() => setMenu(true)}
        />
      )}

      {!hidePageChrome && !isMobileScreen && (
        <DesktopNav
          page={page}
          theme={theme}
          scrolled={scrolled}
          isAdmin={isAdmin(user)}
          isPro={Boolean(pro.isPro && pro.isTeacherPro !== false)}
          userRole={effectiveRole}
          credits={credits}
          toolOpen={toolOpen}
          onToolOpen={setToolOpen}
          tools={NAV_TOOLS_GROUPS}
          navRef={navRef}
          onSearch={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
          onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          onLogout={() => setAskLogout(true)}
        />
      )}

      <StudySheet
        open={menu}
        onClose={() => setMenu(false)}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      />

      <main id="main" tabIndex={-1}>
        <ErrorBoundary resetKey={hashTick}>
          <Suspense fallback={<PageLoader />}>
            {featureDisabledLabel ? (
              <section className="wrap" style={{ padding: '48px 16px', textAlign: 'center', maxWidth: 520, margin: '0 auto' }}>
                <h2 style={{ marginBottom: 8 }}>{featureDisabledLabel} đang tạm bảo trì</h2>
                <p style={{ opacity: 0.78, marginBottom: 18 }}>
                  Quản trị viên đang tạm khóa tính năng này để nâng cấp. Vui lòng quay lại sau!
                </p>
                <a href="#home" style={{ display: 'inline-block', padding: '10px 20px', borderRadius: 999, background: '#2563eb', color: '#fff', fontWeight: 700, textDecoration: 'none' }}>
                  Về trang chủ
                </a>
              </section>
            ) : renderPage(pageCtx)}
          </Suspense>
        </ErrorBoundary>
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

      {!hidePageChrome && !isMobileScreen && <SiteFooter />}

      {!hidePageChrome && isMobileScreen && (
        <BottomNav
          page={page}
          userRole={effectiveRole}
          isPro={Boolean(pro.isPro && pro.isTeacherPro !== false)}
          onOpenMore={() => setMenu(true)}
        />
      )}

      {!isVirtualExamRoom && <CommandPalette />}
    </div>
  );
}
