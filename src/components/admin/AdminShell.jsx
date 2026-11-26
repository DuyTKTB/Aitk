/* ============================================================
   AdminShell.jsx — Khung quản trị đồng bộ + Command Palette (Ctrl+K)
   ------------------------------------------------------------
   Dùng lại DashFrame từ DashShell. Topbar re-export từ DashShell.
   Modal/ConfirmDialog/Toast → lấy từ AdminUI.jsx (nguồn duy nhất).
   ============================================================ */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { DashFrame, Topbar, Donut, TrendChart, Avatar, tsMs, fmtMMSS, fmtClock, downloadCsv } from '../DashShell.jsx';
import {
  IconDashboard, IconExam, IconQuestion, IconUsers, IconActivity, IconSettings,
  IconBook, IconSparkle, IconKey, IconCrown, IconUserCheck, IconSearch, IconClose,
  IconKeyboard, IconBell, IconChart, IconShield,
} from './AdminIcons.jsx';

/* ============================================================
   MENU ADMIN & NHÓM LIÊN KẾT NHANH
   ============================================================ */
export const ADMIN_MENU = [
  { key: 'dashboard',  label: 'Tổng quan',        Icon: IconDashboard, group: 1, desc: 'Số liệu hệ thống, hạn mức API & cảnh báo đề trống' },
  { key: 'exams',      label: 'Đề thi',           Icon: IconExam,      group: 2, desc: 'Quản lý, xuất JSON/CSV, ẩn/hiện và nhân bản đề' },
  { key: 'create',     label: 'Tạo đề',           Icon: IconSparkle,   group: 2, desc: 'Tạo đề bằng AI, Import JSON hoặc tạo thủ công' },
  { key: 'questions',  label: 'Câu hỏi',          Icon: IconQuestion,  group: 2, desc: 'Ngân hàng câu hỏi toàn hệ thống, sửa nhanh & lọc lỗi' },
  { key: 'keys',       label: 'Key & Voucher',    Icon: IconKey,       group: 3, badge: 'key', desc: 'Phát hành Key GV PRO (999k/năm), HS VIP (299k/năm), Voucher & Credit' },
  { key: 'pro-users',  label: 'VIP & PRO',        Icon: IconCrown,     group: 3, badge: 'pro', desc: 'Quản lý Giáo viên PRO (999k/năm) & Học sinh VIP (299k/năm)' },
  { key: 'users',      label: 'Người dùng',       Icon: IconUsers,     group: 3, desc: 'Phân quyền, đồng bộ Firestore & Reset dùng thử GV' },
  { key: 'finance',    label: 'Tài chính & Health', Icon: IconChart,   group: 3, desc: 'Doanh thu MRR/ARR, Sổ cái Credit AI & Kiểm tra sức khỏe máy chủ' },
  { key: 'reports',    label: 'Báo lỗi & Góp ý',  Icon: IconBell,      group: 4, badge: 'reports', desc: 'Tiếp nhận, xử lý và phản hồi báo lỗi của học sinh & giáo viên' },
  { key: 'audit',      label: 'Kiểm toán',        Icon: IconShield,    group: 4, desc: 'Nhật ký kiểm toán bất biến mọi thao tác nhạy cảm của Admin' },
  { key: 'activity',   label: 'Hoạt động',        Icon: IconActivity,  group: 4, desc: 'Nhật ký làm bài của học sinh, phổ điểm & chi tiết câu' },
  { key: 'settings',   label: 'Cài đặt',          Icon: IconSettings,  group: 4, desc: 'Bảng giá VIP/PRO, thông báo, bảo trì, sao lưu & khôi phục' },
  { key: 'guide',      label: 'Hướng dẫn',        Icon: IconBook,      group: 4, desc: 'Quy trình chuẩn, mẫu JSON & xử lý sự cố' },
];

const GROUP_LABELS = {
  1: 'Tổng quan',
  2: 'Nội dung & Đề thi',
  3: 'Kinh doanh & User',
  4: 'Vận hành & Hệ thống',
};

const GROUP_TABS = {
  2: [
    { key: 'exams',     label: 'Danh sách Đề thi',   Icon: IconExam },
    { key: 'create',    label: 'Tạo & Import Đề',    Icon: IconSparkle },
    { key: 'questions', label: 'Ngân hàng Câu hỏi',  Icon: IconQuestion },
  ],
  3: [
    { key: 'keys',      label: 'Key & Voucher',      Icon: IconKey },
    { key: 'pro-users', label: 'Thuê bao VIP/PRO',   Icon: IconCrown },
    { key: 'users',     label: 'Tất cả Người dùng',  Icon: IconUsers },
    { key: 'finance',   label: 'Tài chính & Health', Icon: IconChart },
  ],
  4: [
    { key: 'reports',   label: 'Báo lỗi & Góp ý',    Icon: IconBell },
    { key: 'audit',     label: 'Kiểm toán',          Icon: IconShield },
    { key: 'activity',  label: 'Nhật ký Hoạt động',  Icon: IconActivity },
    { key: 'settings',  label: 'Cài đặt & Sao lưu',  Icon: IconSettings },
    { key: 'guide',     label: 'Hướng dẫn',          Icon: IconBook },
  ],
};

let cachedBadges = { key: null, pro: null, reports: null };
const badgeListeners = new Set();
export function setGlobalAdminBadges(next) {
  cachedBadges = { ...cachedBadges, ...next };
  badgeListeners.forEach((fn) => fn(cachedBadges));
}

/* ============================================================
   ADMIN SHELL
   ============================================================ */
export default function AdminShell({ active, onChange, badges = {}, sideNote, children }) {
  const { user } = useAuth();
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState('');
  const [cmdIdx, setCmdIdx] = useState(0);
  const [liveBadges, setLiveBadges] = useState(() => cachedBadges);
  const cmdInputRef = useRef(null);

  useEffect(() => { setCmdIdx(0); }, [cmdQuery, cmdOpen]);

  useEffect(() => {
    const onBadge = (next) => setLiveBadges({ ...next });
    badgeListeners.add(onBadge);
    setLiveBadges({ ...cachedBadges });
    return () => { badgeListeners.delete(onBadge); };
  }, []);

  const mergedBadges = useMemo(() => ({
    key: badges.key !== undefined ? badges.key : liveBadges.key,
    pro: badges.pro !== undefined ? badges.pro : liveBadges.pro,
    reports: badges.reports !== undefined ? badges.reports : liveBadges.reports,
  }), [badges, liveBadges]);

  const items = useMemo(() => ADMIN_MENU.map((m) => ({
    key: m.key,
    label: m.label,
    Icon: m.Icon,
    group: GROUP_LABELS[m.group] || null,
    badge: m.badge ? mergedBadges[m.badge] || null : null,
    live: false,
  })), [mergedBadges]);

  const currentItem = ADMIN_MENU.find((m) => m.key === active);
  const siblingTabs = currentItem ? GROUP_TABS[currentItem.group] : null;

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen((v) => !v);
        setCmdQuery('');
      } else if (e.key === 'Escape' && cmdOpen) {
        setCmdOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cmdOpen]);

  useEffect(() => {
    if (cmdOpen) {
      setTimeout(() => cmdInputRef.current?.focus(), 20);
    }
  }, [cmdOpen]);

  const navigateTo = (key) => {
    setCmdOpen(false);
    if (onChange) onChange(key);
    else window.location.hash = key === 'dashboard' ? 'admin' : `admin/${key}`;
  };

  const cmdActions = useMemo(() => {
    const base = ADMIN_MENU.map((m) => ({
      id: `nav-${m.key}`,
      label: m.label,
      sub: m.desc,
      Icon: m.Icon,
      badge: m.badge ? mergedBadges[m.badge] : null,
      run: () => navigateTo(m.key),
    }));
    base.push(
      {
        id: 'act-classroom',
        label: 'Sang khu vực Quản lý Lớp học (Giáo viên)',
        sub: 'Mở bảng điều khiển lớp học, phòng thi trực tiếp & chấm bài',
        Icon: IconUserCheck,
        run: () => { setCmdOpen(false); window.location.hash = 'classroom'; },
      },
    );
    const q = cmdQuery.trim().toLowerCase();
    if (!q) return base;
    return base.filter((a) => a.label.toLowerCase().includes(q) || (a.sub || '').toLowerCase().includes(q));
  }, [cmdQuery, mergedBadges]); // eslint-disable-line react-hooks/exhaustive-deps

  const extraNav = (
    <div className="ad-extra-nav">
      <div className="t-rail-group-divider" />
      <div className="t-rail-group-label">Lối tắt</div>
      <button
        type="button"
        className="t-rail-btn"
        onClick={() => { setCmdOpen(true); setCmdQuery(''); }}
        title="Tìm nhanh & chuyển trang (Ctrl + K)"
      >
        <span className="t-rail-btn-icon"><IconSearch size={18} /></span>
        <span className="t-rail-btn-label">Lệnh nhanh</span>
        <kbd className="ad-rail-kbd">⌘K</kbd>
      </button>
      <button
        type="button"
        className="t-rail-btn"
        onClick={() => { window.location.hash = 'classroom'; }}
        title="Sang trang quản lý lớp học"
      >
        <span className="t-rail-btn-icon"><IconUserCheck size={18} /></span>
        <span className="t-rail-btn-label">Quản lý lớp</span>
      </button>
    </div>
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
      user={user}
      roleLabel="Quản trị viên"
      onOpenCommandPalette={() => { setCmdOpen(true); setCmdQuery(''); }}
      onOpenProfile={() => navigateTo('users')}
    >
      {/* Thanh chuyển nhanh theo cụm chức năng + nút Ctrl+K (chỉ hiện ở các trang nhóm con) */}
      {siblingTabs && (
        <div className="ad-context-bar">
          <nav className="ad-context-tabs" aria-label="Chuyển nhanh trong nhóm">
            {siblingTabs.map((t) => {
              const isOn = t.key === active;
              const badgeVal = t.key === 'keys' ? mergedBadges.key : t.key === 'pro-users' ? mergedBadges.pro : t.key === 'reports' ? mergedBadges.reports : null;
              return (
                <button
                  key={t.key}
                  type="button"
                  className={'ad-context-tab' + (isOn ? ' on' : '')}
                  onClick={() => navigateTo(t.key)}
                >
                  <span>{t.label}</span>
                  {badgeVal ? <em className="ad-context-badge">{badgeVal}</em> : null}
                </button>
              );
            })}
          </nav>

          <div className="ad-context-right">
            <button
              type="button"
              className="ad-cmd-trigger"
              onClick={() => { setCmdOpen(true); setCmdQuery(''); }}
              title="Mở bảng điều khiển nhanh (Ctrl + K)"
            >
              <IconSearch size={13} />
              <span>Tìm trang & lệnh nhanh…</span>
              <kbd>Ctrl K</kbd>
            </button>
          </div>
        </div>
      )}

      {children}

      {/* Modal Command Palette (Ctrl + K) */}
      {cmdOpen && (
        <div className="adl-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setCmdOpen(false)}>
          <div className="ad-cmd-modal" role="dialog" aria-modal="true" aria-label="Tìm kiếm và lệnh nhanh">
            <div className="ad-cmd-search">
              <IconSearch size={16} />
              <input
                ref={cmdInputRef}
                type="text"
                value={cmdQuery}
                onChange={(e) => setCmdQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown' && cmdActions.length > 0) {
                    e.preventDefault();
                    setCmdIdx((i) => (i + 1) % cmdActions.length);
                  } else if (e.key === 'ArrowUp' && cmdActions.length > 0) {
                    e.preventDefault();
                    setCmdIdx((i) => (i - 1 + cmdActions.length) % cmdActions.length);
                  } else if (e.key === 'Enter' && cmdActions.length > 0) {
                    e.preventDefault();
                    (cmdActions[cmdIdx] || cmdActions[0]).run();
                  }
                }}
                placeholder="Gõ tên trang hoặc chức năng cần mở (VD: tạo đề, key pro, tài chính, kiểm toán, báo lỗi)…"
              />
              <button type="button" className="vt-icon-btn" onClick={() => setCmdOpen(false)} aria-label="Đóng">
                <IconClose size={14} />
              </button>
            </div>
            <div className="ad-cmd-list">
              {cmdActions.length === 0 ? (
                <p className="vt-muted" style={{ padding: '1.2rem', textAlign: 'center', margin: 0 }}>
                  Không tìm thấy lệnh phù hợp.
                </p>
              ) : (
                cmdActions.map((a, idx) => (
                  <button
                    key={a.id}
                    type="button"
                    className={'ad-cmd-item' + (idx === cmdIdx ? ' first' : '')}
                    onMouseEnter={() => setCmdIdx(idx)}
                    onClick={a.run}
                  >
                    <span className="ad-cmd-ico"><a.Icon size={17} /></span>
                    <span className="ad-cmd-body">
                      <b>{a.label}</b>
                      <small>{a.sub}</small>
                    </span>
                    {a.badge ? <span className="vt-chip soon">{a.badge}</span> : null}
                  </button>
                ))
              )}
            </div>
            <footer className="ad-cmd-foot">
              <span><IconKeyboard size={13} /> Nhấn <kbd>Enter</kbd> để mở mục đầu tiên · <kbd>Esc</kbd> để đóng</span>
            </footer>
          </div>
        </div>
      )}
    </DashFrame>
  );
}

/* Re-export — KHÔNG re-export Modal/ConfirmDialog (dùng từ AdminUI.jsx) */
export { Topbar, Donut, TrendChart, Avatar, tsMs, fmtMMSS, fmtClock, downloadCsv };
