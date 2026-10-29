import { useEffect } from 'react';
import { IconHome } from './Icons.jsx';

/* ============================================================
   BottomNav — mobile (≤ 768px)
   Chuẩn 5 mục cân đối theo Phương án A:
   1. Trang chủ | 2. Phòng thi ảo | 3. Lộ trình | 4. Lớp học | 5. Thêm (Hồ sơ, Công cụ)
   ============================================================ */

const IconGradCap = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

const IconRoadmap = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="3.5" />
    <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22" />
  </svg>
);

const IconClass = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
    <path d="M6 6h10" />
    <path d="M6 10h10" />
    <path d="M6 14h6" />
  </svg>
);

const IconGridMore = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3.5" y="3.5" width="6.5" height="6.5" rx="2" />
    <rect x="14" y="3.5" width="6.5" height="6.5" rx="2" />
    <rect x="14" y="14" width="6.5" height="6.5" rx="2" />
    <rect x="3.5" y="14" width="6.5" height="6.5" rx="2" />
  </svg>
);

const CLASS_PAGES = new Set(['classroom', 'my-classes']);
const EXAM_PAGES = new Set(['virtual-exams', 'quiz', 'exam']);

const idOf = (page, hasClassTab) => {
  if (page === 'home' || !page) return 'home';
  if (EXAM_PAGES.has(page) || page.startsWith('exam/')) return 'virtual-exams';
  if (page === 'roadmap') return 'roadmap';
  if (hasClassTab && CLASS_PAGES.has(page)) return 'class';
  return 'more';
};

const NON_TEXT = /^(checkbox|radio|file|button|submit|reset|range|color|image)$/;
const isTextField = (el) => Boolean(el) && (
  (el.tagName === 'INPUT' && !NON_TEXT.test(el.type || 'text'))
  || el.tagName === 'TEXTAREA'
  || el.isContentEditable
);

export default function BottomNav({ page, userRole = 'student', isPro = false, onOpenMore }) {
  const isTeacher = isPro && userRole === 'teacher';
  const isStudent = userRole === 'student';
  const showClassTab = isTeacher || isStudent;

  const classHash = isTeacher ? '#classroom' : '#my-classes';
  const classLabel = isTeacher ? 'Quản lý' : 'Lớp học';

  const ITEMS = [
    { id: 'home', label: 'Trang chủ', href: '#home', icon: <IconHome size={20} /> },
    {
      id: 'virtual-exams',
      label: 'Phòng thi',
      href: '#virtual-exams',
      icon: <IconGradCap size={20} />,
      badge: 'HOT',
    },
    { id: 'roadmap', label: 'Lộ trình', href: '#roadmap', icon: <IconRoadmap size={20} /> },
    {
      id: 'class',
      label: showClassTab ? classLabel : 'Lớp học',
      href: showClassTab ? classHash : '#my-classes',
      icon: <IconClass size={20} />,
    },
    {
      id: 'more',
      label: 'Thêm',
      href: '#more',
      icon: <IconGridMore size={20} />,
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

  const current = idOf(page, showClassTab);
  const idx = ITEMS.findIndex((i) => i.id === current);
  const showInd = idx >= 0;

  return (
    <nav className="bn" aria-label="Điều hướng di động" style={{ '--i': Math.max(idx, 0) }}>
      <span className={'bn-ind' + (showInd ? ' show' : '')} aria-hidden="true" />
      {ITEMS.map(({ id, label, href, icon, badge, isAction }) => {
        const on = id === current;
        return (
          <a
            key={id}
            href={href}
            className={'bn-item' + (on ? ' on' : '')}
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
              {badge && <span className="bn-badge-dot">{badge}</span>}
            </span>
            <span className="bn-label">{label}</span>
          </a>
        );
      })}
    </nav>
  );
}