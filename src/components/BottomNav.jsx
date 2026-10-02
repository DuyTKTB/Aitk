import { useEffect } from 'react';
import { IconHome, IconAtom, IconTools, IconUser } from './Icons.jsx';
import AIMark from './AIMark.jsx';

/* ============================================================
   BottomNav.jsx — thanh điều hướng mobile kiểu "pill mở rộng"
   Mục đang chọn nở ra thành viên thuốc trắng có chữ, các mục còn lại chỉ có icon.
   Style: ./bottom-nav-pill.css  (import cuối cùng trong main.jsx)
   ============================================================ */

const ITEMS = [
  { id: 'home', label: 'Trang chủ', icon: <IconHome size={19} /> },
  { id: 'table', label: 'Bảng TH', icon: <IconAtom size={19} /> },
  { id: 'ai', label: 'AI', icon: <AIMark size={21} animate={false} style={{ overflow: 'visible' }} /> },
  { id: 'tools', label: 'Công cụ', icon: <IconTools size={19} /> },
  { id: 'profile', label: 'Cá nhân', icon: <IconUser size={19} /> },
];

const NON_TEXT = /^(checkbox|radio|file|button|submit|reset|range|color|image)$/;
const isTextField = (el) => Boolean(el) && (
  (el.tagName === 'INPUT' && !NON_TEXT.test(el.type || 'text'))
  || el.tagName === 'TEXTAREA'
  || el.isContentEditable
);

export default function BottomNav({ page }) {
  /* Khi bàn phím hiện (đang gõ) → ẩn thanh nav, để ô nhập sát đáy màn hình */
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

  return (
    <nav className="pnav" aria-label="Điều hướng di động">
      {ITEMS.map(({ id, label, icon }) => {
        const active = page === id || (id === 'tools' && page.startsWith('games/'));
        return (
          <a
            key={id}
            href={'#' + id}
            className={'pnav-item' + (active ? ' on' : '')}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
            onClick={buzz}
          >
            <span className="pnav-ico">{icon}</span>
            <span className="pnav-label">{label}</span>
          </a>
        );
      })}
    </nav>
  );
}
