/* ============================================================
   AdminShell.jsx — Khung Vitality cho khu quản trị
   ------------------------------------------------------------
   Dùng lại DashFrame từ DashShell. Topbar re-export từ DashShell.
   Modal/ConfirmDialog/Toast → lấy từ AdminUI.jsx (nguồn duy nhất).
   ============================================================ */
import { DashFrame, Topbar, Donut, TrendChart, Avatar, tsMs, fmtMMSS, fmtClock, downloadCsv } from '../DashShell.jsx';
import {
  IconDashboard, IconExam, IconQuestion, IconUsers, IconActivity, IconSettings,
  IconBook, IconSparkle, IconKey, IconCrown, IconUserCheck,
} from './AdminIcons.jsx';

/* ============================================================
   MENU ADMIN
   ============================================================ */
export const ADMIN_MENU = [
  { key: 'dashboard',  label: 'Tổng quan',     Icon: IconDashboard, group: 1 },
  { key: 'exams',      label: 'Đề thi',        Icon: IconExam,      group: 1 },
  { key: 'create',     label: 'Tạo đề',        Icon: IconSparkle,   group: 1 },
  { key: 'questions',  label: 'Câu hỏi',       Icon: IconQuestion,  group: 1 },
  { key: 'keys',       label: 'Key giáo viên', Icon: IconKey,       group: 2, badge: 'key' },
  { key: 'pro-users',  label: 'Giáo viên PRO', Icon: IconCrown,     group: 2, badge: 'pro' },
  { key: 'users',      label: 'Người dùng',    Icon: IconUsers,     group: 3 },
  { key: 'activity',   label: 'Hoạt động',     Icon: IconActivity,  group: 3 },
  { key: 'settings',   label: 'Cài đặt',       Icon: IconSettings,  group: 3 },
  { key: 'guide',      label: 'Hướng dẫn',     Icon: IconBook,      group: 4 },
];

/* ============================================================
   ADMIN SHELL
   ============================================================ */
export default function AdminShell({ active, onChange, badges = {}, sideNote, children }) {
  const items = ADMIN_MENU.map((m) => ({
    key: m.key,
    label: m.label,
    Icon: m.Icon,
    badge: m.badge ? badges[m.badge] || null : null,
    live: false,
  }));

  const extraNav = (
    <button
      type="button"
      className="t-rail-btn"
      onClick={() => { window.location.hash = 'classroom'; }}
      title="Sang trang quản lý lớp học"
    >
      <span className="t-rail-btn-icon"><IconUserCheck size={20} /></span>
      <span className="t-rail-btn-label">Quản lý lớp</span>
    </button>
  );

  return (
    <DashFrame
      className="ad-scope"
      items={items}
      active={active}
      onChange={onChange}
      onExit={() => { window.location.hash = ''; }}
      exitLabel="Về trang chủ"
      sideNote={sideNote}
      extraNav={extraNav}
    >
      {children}
    </DashFrame>
  );
}

/* Re-export — KHÔNG re-export Modal/ConfirmDialog (dùng từ AdminUI.jsx) */
export { Topbar, Donut, TrendChart, Avatar, tsMs, fmtMMSS, fmtClock, downloadCsv };