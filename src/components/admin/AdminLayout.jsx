import { useAuth } from '../../hooks/useAuth.jsx';
import {
  IconDashboard, IconExam, IconQuestion, IconUsers, IconActivity,
  IconSettings, IconBell, IconMail, IconLogout, IconBack,
} from './AdminIcons.jsx';

const MENU = [
  { id: 'dashboard', name: 'Dashboard', Icon: IconDashboard, color: 'var(--nonmetal)' },
  { id: 'exams', name: 'Đề thi', Icon: IconExam, color: 'var(--post)' },
  { id: 'questions', name: 'Câu hỏi', Icon: IconQuestion, color: 'var(--alkaline)' },
  { id: 'users', name: 'Người dùng', Icon: IconUsers, color: 'var(--noble)' },
  { id: 'activity', name: 'Hoạt động', Icon: IconActivity, color: 'var(--metalloid)' },
  { id: 'settings', name: 'Cài đặt', Icon: IconSettings, color: 'var(--actinide)' },
];

export default function AdminLayout({ active, onNavigate, children }) {
  const { user, logout } = useAuth();
  const current = MENU.find((m) => m.id === active);

  return (
    <div className="adl">
      {/* ============ SIDEBAR ============ */}
      <aside className="adl-side">
        <div className="adl-brand">
          <span className="adl-brand-dot" />
          <div>
            <b>A7 K60 DTA</b>
            <small>Quản trị</small>
          </div>
        </div>

        <nav className="adl-menu" aria-label="Menu quản trị">
          {MENU.map((m) => (
            <button
              key={m.id}
              type="button"
              className={'adl-menu-item' + (active === m.id ? ' on' : '')}
              onClick={() => onNavigate(m.id)}
              style={{ '--menu-color': m.color }}
            >
              <span className="adl-menu-ico">
                <m.Icon size={18} />
              </span>
              <span className="adl-menu-name">{m.name}</span>
            </button>
          ))}
        </nav>

        <div className="adl-side-foot">
          <div className="adl-user">
            <div className="adl-avatar">
              {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
            </div>
            <div className="adl-user-info">
              <b>{user?.displayName || user?.email?.split('@')[0] || 'User'}</b>
              <small>Quản trị viên</small>
            </div>
          </div>

          <button type="button" className="adl-logout" onClick={logout}>
            <IconLogout size={16} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* ============ MAIN ============ */}
      <div className="adl-main">
        <header className="adl-topbar">
          <div className="adl-topbar-left">
            <nav className="adl-crumb" aria-label="Breadcrumb">
              <a href="#home" className="adl-crumb-link">
                <IconBack size={14} />
                <span>Trang chủ</span>
              </a>
              <i>›</i>
              <span>Quản trị</span>
              <i>›</i>
              <b>{current?.name || 'Dashboard'}</b>
            </nav>
            <h1 className="adl-page-title">{current?.name || 'Dashboard'}</h1>
            <p className="adl-page-sub">
              {new Date().toLocaleDateString('vi-VN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>

          <div className="adl-topbar-actions">
            <button className="adl-icon-btn" type="button" aria-label="Thông báo">
              <IconBell size={18} />
            </button>
            <button className="adl-icon-btn" type="button" aria-label="Tin nhắn">
              <IconMail size={18} />
            </button>
          </div>
        </header>

        <main className="adl-content">{children}</main>
      </div>
    </div>
  );
}