import { useEffect } from 'react';

/* ============================================================
   BottomNav — mobile (≤ 768px)
   Chuẩn Apple iOS 18 Floating Glass Tab Bar:
   Bộ icon SF-Symbols 20×20 nét mảnh 1.6px đồng nhất, bỏ badge HOT rực rỡ
   ============================================================ */

const IconHomeBar = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
    stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"
    className={`nav-svg-pro ${className}`} aria-hidden="true">
    <path d="M3 8.8 10 3l7 5.8v6.8a1.7 1.7 0 0 1-1.7 1.7h-2.9v-4.1a2.4 2.4 0 0 0-4.8 0v4.1H4.7A1.7 1.7 0 0 1 3 15.6V8.8Z" />
  </svg>
);

const IconGradCap = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
    stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"
    className={`nav-svg-pro ${className}`} aria-hidden="true">
    <rect x="4" y="2.8" width="12" height="14.4" rx="2.4" />
    <path d="M7.5 6h5M7.2 11l1.9 1.9 3.8-4.1" />
  </svg>
);

const IconRoadmap = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
    stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"
    className={`nav-svg-pro ${className}`} aria-hidden="true">
    <circle cx="4.8" cy="14.5" r="2.1" />
    <circle cx="15.2" cy="5.5" r="2.1" />
    <path d="M6.9 14.5c3.5 0 2.6-9 6.2-9" />
  </svg>
);

const IconGridMore = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
    stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"
    className={`nav-svg-pro ${className}`} aria-hidden="true">
    <rect x="3" y="3" width="5.6" height="5.6" rx="1.6" />
    <rect x="11.4" y="3" width="5.6" height="5.6" rx="1.6" />
    <rect x="3" y="11.4" width="5.6" height="5.6" rx="1.6" />
    <rect x="11.4" y="11.4" width="5.6" height="5.6" rx="1.6" />
  </svg>
);

const EXAM_PAGES = new Set(['virtual-exams', 'quiz', 'exam']);

const idOf = (page) => {
  const clean = (page || 'home').split('?')[0];
  if (clean === 'home' || !clean) return 'home';
  if (EXAM_PAGES.has(clean) || clean.startsWith('exam/')) return 'virtual-exams';
  if (clean === 'ai') return 'ai';
  if (clean === 'roadmap') return 'roadmap';
  return 'more';
};

const NON_TEXT = /^(checkbox|radio|file|button|submit|reset|range|color|image)$/;
const isTextField = (el) => Boolean(el) && (
  (el.tagName === 'INPUT' && !NON_TEXT.test(el.type || 'text'))
  || el.tagName === 'TEXTAREA'
  || el.isContentEditable
);

export default function BottomNav({ page, onOpenMore }) {
  const ITEMS = [
    { id: 'home', label: 'Trang chủ', href: '#home', icon: <IconHomeBar size={19} /> },
    {
      id: 'virtual-exams',
      label: 'Phòng thi',
      href: '#virtual-exams',
      icon: <IconGradCap size={19} />,
      liveDot: true,
    },
    {
      id: 'ai',
      label: 'ELEC AI',
      href: '#ai',
      icon: (
        <img
          src="/img/logo.png"
          alt="ELEC AI"
          className="bn-ai-brand-logo"
          draggable="false"
        />
      ),
      isCenterAi: true,
    },
    {
      id: 'roadmap',
      label: 'Lộ trình',
      href: '#roadmap',
      icon: <IconRoadmap size={19} />,
    },
    {
      id: 'more',
      label: 'Tiện ích',
      href: '#more',
      icon: <IconGridMore size={19} />,
      isAction: true,
    },
  ];

  useEffect(() => {
    let t = 0;
    const on = (e) => { if (isTextField(e.target)) document.body.classList.add('kb-open'); };
    const off = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        if (!isTextField(document.activeElement)) document.body.classList.remove('kb-open');
      }, 80);
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

  const buzz = () => { try { navigator.vibrate?.(8); } catch {} };

  const current = idOf(page);
  const idx = ITEMS.findIndex((i) => i.id === current);
  const showInd = idx >= 0 && idx !== 2;

  return (
    <nav className="bn" aria-label="Điều hướng di động" style={{ '--i': Math.max(idx, 0) }}>
      <span className={'bn-ind' + (showInd ? ' show' : '')} aria-hidden="true" />
      {ITEMS.map(({ id, label, href, icon, liveDot, isAction, isCenterAi }) => {
        const on = id === current;
        return (
          <a
            key={id}
            href={href}
            className={'bn-item' + (isCenterAi ? ' bn-ai' : '') + (on ? ' on' : '')}
            aria-label={label}
            aria-current={on ? 'page' : undefined}
            onClick={(e) => {
              buzz();
              window.dispatchEvent(new CustomEvent('elec-close-nav-dropdowns'));
              if (isAction && onOpenMore) {
                e.preventDefault();
                onOpenMore();
              }
            }}
          >
            <span className="bn-ico">
              {icon}
              {liveDot && <span className="bn-live-dot" aria-hidden="true" />}
            </span>
            <span className="bn-label">{label}</span>
          </a>
        );
      })}
    </nav>
  );
}