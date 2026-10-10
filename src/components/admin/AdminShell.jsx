/* ============================================================
   AdminShell.jsx — Khung Vitality cho khu quản trị
   ------------------------------------------------------------
   Dùng lại DashFrame / Topbar / Modal / ConfirmDialog / Avatar /
   Donut / TrendChart từ DashShell để đồng bộ với TeacherDashboard.
   Sidebar có thêm nút "Sang quản lý lớp" để nhảy tab.
   ============================================================ */
import {
  DashFrame, Topbar, Modal, ConfirmDialog, Donut, TrendChart, Avatar,
  tsMs, fmtMMSS, fmtClock, downloadCsv,
} from '../DashShell.jsx';
import {
  IconDashboard, IconExam, IconQuestion, IconUsers, IconActivity, IconSettings,
  IconBook, IconSparkle, IconKey, IconCrown, IconUserCheck, IconHome,
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
   ADMIN SHELL — bọc content trong DashFrame
   props:
     active       key đang chọn
     onChange     callback khi đổi tab
     badges       { key: number, pro: number } — số lượng hiển thị
     user         user object (để hiện tên + check admin)
     sideNote     JSX phụ (tuỳ chọn)
     children     nội dung chính
   ============================================================ */
export default function AdminShell({ active, onChange, badges = {}, sideNote, children }) {
  const items = ADMIN_MENU.map((m) => ({
    key: m.key,
    label: m.label,
    Icon: m.Icon,
    badge: m.badge ? badges[m.badge] || null : null,
    live: false,
  }));

  const goTeacher = () => {
    window.location.hash = 'classroom';
  };

  const extraNav = (
    <button
      type="button"
      className="vt-nav-item"
      onClick={goTeacher}
      title="Sang trang quản lý lớp học"
    >
      <IconUserCheck size={18} />
      <span>Quản lý lớp</span>
    </button>
  );

  return (
    <DashFrame
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

/* Re-export để component con dùng luôn */
export {
  Topbar, Modal, ConfirmDialog, Donut, TrendChart, Avatar,
  tsMs, fmtMMSS, fmtClock, downloadCsv,
};