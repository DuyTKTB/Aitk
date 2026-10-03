import { createContext, useContext } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import {
  IconDashboard, IconExam, IconQuestion, IconUsers, IconActivity, IconSettings,
  IconBook, IconSparkle, IconLogout, IconBack, IconFlask,
} from './AdminIcons.jsx';

export const MENU = [
  { id: 'dashboard', name: 'Tổng quan', Icon: IconDashboard, color: 'var(--noble, #7a6ad8)', group: 1 },
  { id: 'exams', name: 'Đề thi', Icon: IconExam, color: 'var(--post, #6fb35a)', group: 1 },
  { id: 'create', name: 'Tạo đề', Icon: IconSparkle, color: 'var(--acc, #e2704f)', group: 1 },
  { id: 'questions', name: 'Câu hỏi', Icon: IconQuestion, color: 'var(--alkaline, #e0a43a)', group: 1 },
  { id: 'users', name: 'Người dùng', Icon: IconUsers, color: 'var(--noble, #7a6ad8)', group: 2 },
  { id: 'activity', name: 'Hoạt động', Icon: IconActivity, color: 'var(--nonmetal, #3aa6c7)', group: 2 },
  { id: 'settings', name: 'Cài đặt', Icon: IconSettings, color: 'var(--metalloid, #8a8f98)', group: 2 },
  { id: 'guide', name: 'Hướng dẫn', Icon: IconBook, color: 'var(--post, #6fb35a)', group: 3 },
];

/* Chống lồng khung: nếu AdminLayout đã có ở ngoài thì lớp trong chỉ trả nội dung */
const NestedCtx = createContext(false);

export default function AdminLayout({ active, onNavigate, children }) {
  const nested = useContext(NestedCtx);
  if (nested) return <>{children}</>;
  return <AdminLayoutInner active={active} onNavigate={onNavigate}>{children}</AdminLayoutInner>;
}

function AdminLayoutInner({ active, onNavigate, children }) {
  const { user, logout } = useAuth();
  const current = MENU.find((m) => m.id === active) || MENU[0];
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Quản trị viên';

  return (
    <NestedCtx.Provider value>
    <div className="adl">
      <a href="#adl-main" className="adl-skip">Bỏ qua menu</a>

      <aside className="adl-side">
        <div className="adl-brand">
          <span className="adl-brand-mark"><IconFlask size={18} /></span>
          <div>
            <b>A7 K60 DTA</b>
            <small>Khu quản trị</small>
          </div>
        </div>

        <nav className="adl-menu" aria-label="Menu quản trị">
          {MENU.map((m, i) => (
            <span key={m.id} className="adl-menu-wrap">
              {i > 0 && MENU[i - 1].group !== m.group && <hr className="adl-menu-sep" />}
              <button
                type="button"
                className={'adl-menu-item' + (active === m.id ? ' on' : '')}
                onClick={() => onNavigate(m.id)}
                style={{ '--menu-color': m.color }}
                aria-current={active === m.id ? 'page' : undefined}
              >
                <span className="adl-menu-ico"><m.Icon size={18} /></span>
                <span className="adl-menu-name">{m.name}</span>
              </button>
            </span>
          ))}
        </nav>

        <div className="adl-side-foot">
          <div className="adl-user">
            <div className="adl-avatar" aria-hidden="true">{displayName[0]?.toUpperCase() || 'U'}</div>
            <div className="adl-user-info">
              <b title={user?.email}>{displayName}</b>
              <small>Quản trị viên</small>
            </div>
          </div>
          <button type="button" className="adl-logout" onClick={logout}>
            <IconLogout size={16} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      <div className="adl-main">
        <header className="adl-topbar">
          <nav className="adl-crumb" aria-label="Đường dẫn">
            <a href="#home" className="adl-crumb-link">
              <IconBack size={14} />
              <span>Về trang chủ</span>
            </a>
            <i aria-hidden="true">/</i>
            <span>Quản trị</span>
            <i aria-hidden="true">/</i>
            <b>{current.name}</b>
          </nav>
          <h1 className="adl-page-title">{current.name}</h1>
          <p className="adl-page-sub">
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </header>

        <main id="adl-main" className="adl-content">{children}</main>
      </div>
    </div>
    </NestedCtx.Provider>
  );
}
