import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  IconHome, IconRobot, IconTools, IconUser, IconCalc, IconMicroscope,
  IconScale, IconTimer, IconCalendar, IconNote, IconBook, IconTarget,
  IconQuiz, IconChart, IconGamepad, IconAtom, IconSearch, IconSun,
  IconMoon, IconLogout, IconDashboard, IconChevronDown, IconArrowRight,
} from './Icons.jsx';

/* ============================================================
   DesktopNav.jsx — thanh điều hướng máy tính (≥ 721px)
   - Chỉ báo xanh trượt theo mục đang chọn
   - "Công cụ" mở mega menu liệt kê đủ công cụ (hover hoặc bấm)
   - Nút tìm kiếm (Ctrl/⌘ + K) → bảng tuần hoàn
   Style: ./nav-home-v2.css
   ============================================================ */

const MAIN = [
  { id: 'home', label: 'Trang chủ', Icon: IconHome },
  { id: 'ai', label: 'CU AI', Icon: IconRobot },
  { id: 'tools', label: 'Công cụ', Icon: IconTools, mega: true },
  { id: 'profile', label: 'Trang cá nhân', Icon: IconUser },
];

const TOOLS = [
  { id: 'table', name: 'Bảng tuần hoàn', desc: '118 nguyên tố, lọc và tìm kiếm', Icon: IconAtom },
  { id: 'formulas', name: 'Công thức nhanh', desc: 'Mol, pH, vô cơ, hữu cơ', Icon: IconCalc },
  { id: 'analyze', name: 'Phân tích', desc: 'Phân tích hợp chất', Icon: IconMicroscope },
  { id: 'balance', name: 'Cân bằng PTHH', desc: 'Nhập phương trình, ra hệ số', Icon: IconScale },
  { id: 'pomodoro', name: 'Pomodoro', desc: 'Tập trung sâu, nghỉ đúng lúc', Icon: IconTimer },
  { id: 'exam', name: 'Kỳ thi', desc: 'Đếm ngược tới ngày thi', Icon: IconCalendar },
  { id: 'notes', name: 'Ghi chú', desc: 'Lưu ý tưởng khi học', Icon: IconNote },
  { id: 'notebook', name: 'Sổ tay', desc: 'Các câu đã làm sai', Icon: IconBook },
  { id: 'grade', name: 'Tính điểm', desc: 'Cần bao nhiêu để đạt mục tiêu', Icon: IconTarget },
  { id: 'quiz', name: 'Ôn tập', desc: 'Quiz giúp nhớ lâu hơn', Icon: IconQuiz },
  { id: 'stats', name: 'Thống kê', desc: 'Theo dõi tiến độ học', Icon: IconChart },
  { id: 'games', name: 'Trò chơi', desc: '6 trò chơi hóa học', Icon: IconGamepad },
];

const TOOL_IDS = new Set(['tools', ...TOOLS.map((t) => t.id)]);

/* Trang hiện tại thuộc mục nào trên thanh nav */
export const navActiveOf = (page) => {
  if (page === 'home' || page === 'ai' || page === 'profile') return page;
  if (TOOL_IDS.has(page) || page.startsWith('games/') || page.startsWith('exam/')) return 'tools';
  return null; // vd: admin
};

const isMac = () => typeof navigator !== 'undefined' && /mac|iphone|ipad/i.test(navigator.platform || '');
const canHover = () =>
  typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

export default function DesktopNav({ page, theme, scrolled, isAdmin, onSearch, onToggleTheme, onLogout }) {
  const active = navActiveOf(page);
  const rootRef = useRef(null);
  const linksRef = useRef(null);
  const itemRefs = useRef({});
  const triggerRef = useRef(null);
  const timer = useRef(0);

  const [open, setOpen] = useState(false);
  const [ind, setInd] = useState({ x: 0, w: 0, show: false });
  const [anim, setAnim] = useState(false);

  /* ----- chỉ báo trượt ----- */
  const measure = useCallback(() => {
    const box = linksRef.current;
    const el = itemRefs.current[active];
    if (!box || !el) {
      setInd((s) => (s.show ? { ...s, show: false } : s));
      return;
    }
    const b = box.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const x = Math.round(r.left - b.left);
    const w = Math.round(r.width);
    setInd((s) => (s.show && s.x === x && s.w === w ? s : { x, w, show: true }));
  }, [active]);

  useLayoutEffect(() => { measure(); }, [measure]);

  useEffect(() => {
    window.addEventListener('resize', measure);
    if (document.fonts?.ready) document.fonts.ready.then(measure);
    const raf = requestAnimationFrame(() => setAnim(true)); // bật transition sau lần đo đầu
    return () => {
      window.removeEventListener('resize', measure);
      cancelAnimationFrame(raf);
    };
  }, [measure]);

  /* ----- mega menu: mở/đóng ----- */
  const openNow = () => { clearTimeout(timer.current); setOpen(true); };
  const closeSoon = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), 180);
  };

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => {
      if (e.key === 'Escape') { setOpen(false); triggerRef.current?.focus(); }
    };
    const onHash = () => setOpen(false);
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    window.addEventListener('hashchange', onHash);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('hashchange', onHash);
    };
  }, [open]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const hoverIn = () => { if (canHover()) openNow(); };
  const hoverOut = () => { if (canHover()) closeSoon(); };

  return (
    <header className={'dn' + (scrolled ? ' scrolled' : '')} ref={rootRef}>
      <div className="dn-bar">
        <a className="dn-logo" href="#home" aria-label="Trang chủ">
          <img src="/img/logo.png" alt="A7K60 TK MEDIA" />
        </a>

        <nav className="dn-links" ref={linksRef} aria-label="Điều hướng chính">
          <span
            className={'dn-ind' + (anim ? ' anim' : '')}
            style={{ '--x': ind.x + 'px', '--w': ind.w + 'px', opacity: ind.show ? 1 : 0 }}
            aria-hidden="true"
          />
          {MAIN.map(({ id, label, Icon, mega }) => {
            const on = active === id;
            const common = {
              ref: (el) => { itemRefs.current[id] = el; if (mega) triggerRef.current = el; },
              className: 'dn-link' + (on ? ' on' : ''),
            };
            if (mega) {
              return (
                <button
                  key={id}
                  {...common}
                  type="button"
                  aria-haspopup="true"
                  aria-expanded={open}
                  aria-controls="dn-mega"
                  aria-current={on ? 'page' : undefined}
                  onClick={() => setOpen((o) => !o)}
                  onMouseEnter={hoverIn}
                  onMouseLeave={hoverOut}
                >
                  <Icon size={17} />
                  <span>{label}</span>
                  <IconChevronDown size={14} className={'dn-caret' + (open ? ' open' : '')} />
                </button>
              );
            }
            return (
              <a key={id} {...common} href={'#' + id} aria-current={on ? 'page' : undefined}>
                <Icon size={17} />
                <span>{label}</span>
              </a>
            );
          })}
        </nav>

        <div className="dn-actions">
          <button type="button" className="dn-search" onClick={onSearch} aria-label="Tìm nguyên tố">
            <IconSearch size={16} />
            <span className="dn-search-text">Tìm nguyên tố</span>
            <kbd>{isMac() ? '⌘K' : 'Ctrl K'}</kbd>
          </button>
          <button
            type="button"
            className="dn-icon"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
          >
            {theme === 'dark' ? <IconSun size={17} /> : <IconMoon size={17} />}
          </button>
          <button type="button" className="dn-icon" onClick={onLogout} aria-label="Đăng xuất">
            <IconLogout size={17} />
          </button>
        </div>

        {/* ----- MEGA MENU CÔNG CỤ ----- */}
        <div
          id="dn-mega"
          className={'dn-mega' + (open ? ' open' : '')}
          onMouseEnter={hoverIn}
          onMouseLeave={hoverOut}
        >
          <div className="dn-mega-head">
            <h2>Công cụ học tập</h2>
            <a className="dn-all" href="#tools">
              Xem tất cả công cụ
              <span className="dn-all-ar"><IconArrowRight size={15} /></span>
            </a>
          </div>
          <div className="dn-mega-grid">
            {TOOLS.map(({ id, name, desc, Icon }) => {
              const here = page === id || (id === 'games' && page.startsWith('games/'));
              return (
                <a
                  key={id}
                  href={'#' + id}
                  className={'dn-tool' + (here ? ' on' : '')}
                  aria-current={here ? 'page' : undefined}
                >
                  <span className="dn-tool-ico"><Icon size={19} /></span>
                  <span className="dn-tool-txt">
                    <b>{name}</b>
                    <small>{desc}</small>
                  </span>
                </a>
              );
            })}
          </div>
          {isAdmin && (
            <a className="dn-mega-admin" href="#admin">
              <IconDashboard size={16} /> Trang quản trị
            </a>
          )}
        </div>
      </div>
    </header>
  );
}