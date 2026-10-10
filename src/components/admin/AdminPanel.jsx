import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { fetchGrades, fetchSubjects } from '../../lib/examApi.js';
import { supabase } from '../../lib/supabase.js';
import { IconLock, IconBack, IconRefresh } from './AdminIcons.jsx';
import { AdminUIProvider, ErrorBoundary, InlineAlert, PageLoader } from './AdminUI.jsx';
import { friendlyError } from './adminUtils.js';
import Dashboard from './Dashboard.jsx';
import ExamManager from './ExamManager.jsx';
import QuestionManager from './QuestionManager.jsx';
import UserManager from './UserManager.jsx';
import ActivityPage from './ActivityPage.jsx';
import SettingsPage from './SettingsPage.jsx';
import CreateExam from './CreateExam.jsx';
import GuidePage from './GuidePage.jsx';
import KeyManager from './KeyManager.jsx';
import ProUserManager from './ProUserManager.jsx';

/* ============================================================
   ROUTING: hash = #admin/<sub>
   sub ∈ { dashboard, exams, create, questions, keys, pro-users,
           users, activity, settings, guide }
   ============================================================ */
const VIEWS = ['dashboard', 'exams', 'create', 'questions', 'keys', 'pro-users', 'users', 'activity', 'settings', 'guide'];

function parseHash() {
  const h = (window.location.hash || '').replace(/^#/, '');
  if (!h.startsWith('admin')) return 'dashboard';
  const parts = h.split('/').filter(Boolean);
  const sub = parts[1] || 'dashboard';
  return VIEWS.includes(sub) ? sub : 'dashboard';
}

export default function AdminPanel() {
  return (
    <AdminUIProvider>
      <AdminGate />
    </AdminUIProvider>
  );
}

function AdminGate() {
  const { user } = useAuth();
  const [state, setState] = useState({ status: 'checking', error: null });

  const uid = user?.uid || user?.id;

  const check = useCallback(async () => {
    if (!uid) { setState({ status: 'denied', error: null }); return; }
    setState({ status: 'checking', error: null });
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', uid)
        .maybeSingle();
      if (error) throw error;
      setState({ status: data?.role === 'admin' ? 'admin' : 'denied', error: null });
    } catch (e) {
      console.error(e);
      setState({ status: 'error', error: friendlyError(e) });
    }
  }, [uid]);

  useEffect(() => { check(); }, [check]);

  if (state.status === 'checking') return <PageLoader text="Đang kiểm tra quyền…" />;
  if (!user) return <Denied title="Chưa đăng nhập" desc="Bạn cần đăng nhập để vào trang quản trị." />;
  if (state.status === 'error') {
    return (
      <Denied title="Không kiểm tra được quyền" desc={state.error}>
        <button type="button" className="adl-btn-primary" onClick={check}>
          <IconRefresh size={14} /> Thử lại
        </button>
      </Denied>
    );
  }
  if (state.status === 'denied') {
    return (
      <Denied
        title="Không có quyền truy cập"
        desc={`Tài khoản ${user.email || ''} chưa được cấp vai trò quản trị.`}
      />
    );
  }
  return <AdminApp />;
}

function AdminApp() {
  const [view, setView] = useState(parseHash);
  const [editId, setEditId] = useState(null);
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [catalogError, setCatalogError] = useState(null);

  /* Đồng bộ view <-> hash */
  useEffect(() => {
    const onHash = () => {
      const v = parseHash();
      setView(v);
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = useCallback((id, opts = {}) => {
    if (!VIEWS.includes(id)) return;
    const nextHash = id === 'dashboard' ? '#admin' : `#admin/${id}`;
    if (window.location.hash === nextHash) {
      // đã đúng hash → chỉ đổi state
      setView(id);
    } else {
      window.location.hash = nextHash;
    }
    setEditId(opts.editId ?? null);
  }, []);

  useEffect(() => {
    let alive = true;
    Promise.all([fetchGrades(), fetchSubjects()])
      .then(([g, s]) => {
        if (alive) {
          setGrades(g || []);
          setSubjects(s || []);
        }
      })
      .catch((e) => {
        console.error(e);
        if (alive) setCatalogError(friendlyError(e));
      });
    return () => { alive = false; };
  }, []);

  const openExam = (id) => navigate('exams', { editId: id });

  return (
    <>
      {catalogError && (
        <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 999 }}>
          <InlineAlert type="warn">
            Không tải được danh sách lớp/môn: {catalogError}. Chức năng tạo đề có thể bị hạn chế.
          </InlineAlert>
        </div>
      )}

      <ErrorBoundary resetKey={view + ':' + editId}>
        {view === 'dashboard'  && <Dashboard onNavigate={navigate} />}
        {view === 'exams'      && <ExamManager key={editId || 'list'} initialEditId={editId} onCreate={() => navigate('create')} />}
        {view === 'create'     && <CreateExamWrapper grades={grades} subjects={subjects} onDone={(id) => (id ? openExam(id) : navigate('exams'))} />}
        {view === 'questions'  && <QuestionManager onOpenExam={openExam} />}
        {view === 'keys'       && <KeyManager />}
        {view === 'pro-users'  && <ProUserManager />}
        {view === 'users'      && <UserManager />}
        {view === 'activity'   && <ActivityPage />}
        {view === 'settings'   && <SettingsPage />}
        {view === 'guide'      && <GuidePage onNavigate={navigate} />}
      </ErrorBoundary>
    </>
  );
}

/* CreateExam cần khung riêng để có shell */
function CreateExamWrapper({ grades, subjects, onDone }) {
  // CreateExam tự render nội dung, cần bọc trong AdminShell qua ExamManager hoặc dùng trực tiếp
  // Vì CreateExam không tự có shell, ta dùng component ExamManager-like
  return (
    <CreateExamWithShell grades={grades} subjects={subjects} onDone={onDone} />
  );
}

/* Bọc CreateExam trong AdminShell */
import AdminShell, { Topbar } from './AdminShell.jsx';
function CreateExamWithShell({ grades, subjects, onDone }) {
  return (
    <AdminShell active="create" onChange={(k) => { window.location.hash = `admin/${k}`; }}>
      <Topbar title="Tạo đề" subtitle="3 cách: AI, Import JSON, hoặc thủ công" />
      <CreateExam grades={grades} subjects={subjects} onDone={onDone} />
    </AdminShell>
  );
}

function Denied({ title, desc, children }) {
  return (
    <div className="vt" style={{ display: 'grid', placeItems: 'center', minHeight: '100dvh' }}>
      <div className="vt-card" style={{ maxWidth: 420, textAlign: 'center' }}>
        <span
          className="vt-list-ico"
          style={{ margin: '0 auto 1rem', width: 64, height: 64, background: 'linear-gradient(135deg, #f87171, #ef4444)' }}
        >
          <IconLock size={30} />
        </span>
        <h2 style={{ margin: '0 0 .5rem', font: '800 1.2rem var(--sans)' }}>{title}</h2>
        <p className="vt-muted" style={{ margin: '0 0 1.2rem' }}>{desc}</p>
        <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {children}
          <a href="#home" className="vt-btn">
            <IconBack size={14} /> Về trang chủ
          </a>
        </div>
      </div>
    </div>
  );
}