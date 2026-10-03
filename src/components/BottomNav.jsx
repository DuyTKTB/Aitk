import { useEffect } from 'react';
import { IconHome, IconCalc, IconTools, IconUser } from './Icons.jsx';
import AIMark from './AIMark.jsx';

/* ============================================================
   BottomNav.jsx — thanh điều hướng mobile (≤ 720px)
   - 5 cột bằng nhau, nhãn luôn hiện → dễ đọc, dễ bấm
   - AI nằm giữa, nổi lên thành nút tròn (hành động chính của web)
   - Chỉ báo trượt (CSS transform) theo mục đang chọn
   Style: ./nav-home-v2.css
   ============================================================ */

const ITEMS = [
  { id: 'home', label: 'Trang chủ', icon: <IconHome size={22} /> },
  { id: 'formulas', label: 'Công thức', icon: <IconCalc size={22} /> },
  { id: 'ai', label: 'AI', icon: <AIMark size={26} animate={false} style={{ overflow: 'visible' }} />, hero: true },
  { id: 'tools', label: 'Công cụ', icon: <IconTools size={22} /> },
  { id: 'profile', label: 'Cá nhân', icon: <IconUser size={22} /> },
];

/* Các trang con thuộc "Công cụ" */
const TOOL_PAGES = new Set([
  'tools', 'table', 'analyze', 'balance', 'pomodoro', 'exam',
  'notes', 'notebook', 'grade', 'quiz', 'stats', 'games',
]);

const idOf = (page) => {
  if (ITEMS.some((i) => i.id === page)) return page;
  if (TOOL_PAGES.has(page) || page.startsWith('games/') || page.startsWith('exam/')) return 'tools';
  return null; // vd: admin
};

const NON_TEXT = /^(checkbox|radio|file|button|submit|reset|range|color|image)$/;
const isTextField = (el) => Boolean(el) && (
  (el.tagName === 'INPUT' && !NON_TEXT.test(el.type || 'text'))
  || el.tagName === 'TEXTAREA'
  || el.isContentEditable
);

export default function BottomNav({ page }) {
  /* Bàn phím hiện (đang gõ) → ẩn thanh nav để ô nhập sát đáy màn hình */
  useEffect(() => {
    let t = 0;
    const on = (e) => { if (isTextField(e.target)) document.body.classList.add('kb-open'); };
    const off = () => {
      clearTimeout(t);
      t = setTimeout(() => { if (!isTextField(document.activeElement)) document.body.classList.remove('kb-open'); }, 80);
    };
    addEventListener('focusin', on);
    addEventListener('focusout', off);
    return () => {
      clearTimeout(t);
      removeEventListener('focusin', on);
      removeEventListener('focusout', off);
      document.body.classList.remove('kb-open');
    };
  }, []);

  const buzz = () => { try { navigator.vibrate?.(8); } catch { /* */ } };

  const current = idOf(page);
  const idx = ITEMS.findIndex((i) => i.id === current);
  const showInd = idx >= 0 && !ITEMS[idx].hero; // nút AI tự có vòng sáng riêng

  return (
    <nav className="bn" aria-label="Điều hướng di động" style={{ '--i': Math.max(idx, 0) }}>
      <span className={'bn-ind' + (showInd ? ' show' : '')} aria-hidden="true" />
      {ITEMS.map(({ id, label, icon, hero }) => {
        const on = id === current;
        return (
          <a
            key={id}
            href={'#' + id}
            className={'bn-item' + (hero ? ' bn-ai' : '') + (on ? ' on' : '')}
            aria-label={label}
            aria-current={on ? 'page' : undefined}
            onClick={buzz}
          >
            <span className="bn-ico">{icon}</span>
            <span className="bn-label">{label}</span>
          </a>
        );
      })}
    </nav>
  );
}