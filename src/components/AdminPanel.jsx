import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { fetchGrades, fetchSubjects } from '../lib/examApi.js';
import { supabase } from '../lib/supabase.js';
import { IconLock, IconBack, IconRefresh } from './admin/AdminIcons.jsx';
import { AdminUIProvider, ErrorBoundary, InlineAlert, PageLoader } from './admin/AdminUI.jsx';
import { friendlyError } from './admin/adminUtils.js';
import AdminLayout from './admin/AdminLayout.jsx';
import Dashboard from './admin/Dashboard.jsx';
import ExamManager from './admin/ExamManager.jsx';
import QuestionManager from './admin/QuestionManager.jsx';
import UserManager from './admin/UserManager.jsx';
import ActivityPage from './admin/ActivityPage.jsx';
import SettingsPage from './admin/SettingsPage.jsx';
import CreateExam from './admin/CreateExam.jsx';
import GuidePage from './admin/GuidePage.jsx';

const VIEW_KEY = 'cs-admin-view';
const VIEWS = ['dashboard', 'exams', 'create', 'questions', 'users', 'activity', 'settings', 'guide'];

function initialView() {
  try {
    const v = sessionStorage.getItem(VIEW_KEY);
    return VIEWS.includes(v) ? v : 'dashboard';
  } catch {
    return 'dashboard';
  }
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
  const [state, setState] = useState({ status: 'checking', error: null }); // checking | admin | denied | error
  const uid = user?.uid || user?.id;

  const check = useCallback(async () => {
    if (!uid) { setState({ status: 'denied', error: null }); return; }
    setState({ status: 'checking', error: null });
    try {
      const { data, error } = await supabase.from('profiles').select('role').eq('id', uid).maybeSingle();
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
        <button type="button" className="adl-btn-primary" onClick={check}><IconRefresh size={14} /> Thử lại</button>
      </Denied>
    );
  }
  if (state.status === 'denied') {
    return <Denied title="Không có quyền truy cập" desc={`Tài khoản ${user.email || ''} chưa được cấp vai trò quản trị.`} />;
  }
  return <AdminApp />;
}

function AdminApp() {
  const [view, setView] = useState(initialView);
  const [editId, setEditId] = useState(null);
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [catalogError, setCatalogError] = useState(null);

  useEffect(() => {
    let alive = true;
    Promise.all([fetchGrades(), fetchSubjects()])
      .then(([g, s]) => { if (alive) { setGrades(g || []); setSubjects(s || []); } })
      .catch((e) => { console.error(e); if (alive) setCatalogError(friendlyError(e)); });
    return () => { alive = false; };
  }, []);

  const navigate = useCallback((id, opts = {}) => {
    if (!VIEWS.includes(id)) return;
    setEditId(opts.editId ?? null);
    setView(id);
    try { sessionStorage.setItem(VIEW_KEY, id); } catch { /* bỏ qua */ }
    window.scrollTo({ top: 0 });
  }, []);

  const openExam = (id) => navigate('exams', { editId: id });

  return (
    <AdminLayout active={view} onNavigate={navigate}>
      {catalogError && <InlineAlert type="warn">Không tải được danh sách lớp/môn: {catalogError}. Chức năng tạo đề có thể bị hạn chế.</InlineAlert>}
      <ErrorBoundary resetKey={view + ':' + editId}>
        {view === 'dashboard' && <Dashboard onNavigate={navigate} />}
        {view === 'exams' && <ExamManager key={editId || 'list'} initialEditId={editId} onCreate={() => navigate('create')} />}
        {view === 'create' && <CreateExam grades={grades} subjects={subjects} onDone={(id) => (id ? openExam(id) : navigate('exams'))} />}
        {view === 'questions' && <QuestionManager onOpenExam={openExam} />}
        {view === 'users' && <UserManager />}
        {view === 'activity' && <ActivityPage />}
        {view === 'settings' && <SettingsPage />}
        {view === 'guide' && <GuidePage onNavigate={navigate} />}
      </ErrorBoundary>
    </AdminLayout>
  );
}

function Denied({ title, desc, children }) {
  return (
    <div className="adl-denied">
      <span className="adl-denied-ico"><IconLock size={30} /></span>
      <h2>{title}</h2>
      <p>{desc}</p>
      <div className="adl-denied-actions">
        {children}
        <a href="#home" className="adl-btn-outline"><IconBack size={14} /> Về trang chủ</a>
      </div>
    </div>
  );
}
