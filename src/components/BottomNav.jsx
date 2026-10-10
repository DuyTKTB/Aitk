import { useEffect } from 'react';
import { IconHome, IconCalc, IconTools, IconUser } from './Icons.jsx';
import AIMark from './AIMark.jsx';

/* ============================================================
   BottomNav — mobile (≤ 720px)
   5 mục: Trang chủ | Lớp/Công thức | AI (giữa, nổi) | Công cụ | Cá nhân
   ============================================================ */

const IconClass = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

const TOOL_PAGES = new Set([
  'tools', 'table', 'analyze', 'balance', 'pomodoro', 'exam',
  'notes', 'notebook', 'grade', 'quiz', 'stats', 'games',
]);

const CLASS_PAGES = new Set(['classroom', 'my-classes']);

const idOf = (page, hasClassTab) => {
  if (page === 'home') return 'home';
  if (page === 'ai') return 'ai';
  if (hasClassTab && CLASS_PAGES.has(page)) return 'class';
  if (TOOL_PAGES.has(page) || page.startsWith('games/') || page.startsWith('exam/')) return 'tools';
  if (page === 'profile') return 'profile';
  return null;
};

const NON_TEXT = /^(checkbox|radio|file|button|submit|reset|range|color|image)$/;
const isTextField = (el) => Boolean(el) && (
  (el.tagName === 'INPUT' && !NON_TEXT.test(el.type || 'text'))
  || el.tagName === 'TEXTAREA'
  || el.isContentEditable
);

export default function BottomNav({ page, userRole = 'student', isPro = false }) {
  const isTeacher = isPro && userRole === 'teacher';
  const isStudent = userRole === 'student';
  const showClassTab = isTeacher || isStudent;

  const classHash = isTeacher ? '#classroom' : '#my-classes';
  const classLabel = isTeacher ? 'Quản lý' : 'Lớp học';

  const ITEMS = [
    { id: 'home', label: 'Trang chủ', href: '#home', icon: <IconHome size={22} /> },
    {
      id: 'class',
      label: showClassTab ? classLabel : 'Công thức',
      href: showClassTab ? classHash : '#formulas',
      icon: showClassTab ? <IconClass size={22} /> : <IconCalc size={22} />,
    },
    {
      id: 'ai',
      label: 'AI',
      href: '#ai',
      icon: <AIMark size={26} animate={false} style={{ overflow: 'visible' }} />,
      hero: true,
    },
    { id: 'tools', label: 'Công cụ', href: '#tools', icon: <IconTools size={22} /> },
    { id: 'profile', label: 'Cá nhân', href: '#profile', icon: <IconUser size={22} /> },
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
  const showInd = idx >= 0 && !ITEMS[idx].hero;

  return (
    <nav className="bn" aria-label="Điều hướng di động" style={{ '--i': Math.max(idx, 0) }}>
      <span className={'bn-ind' + (showInd ? ' show' : '')} aria-hidden="true" />
      {ITEMS.map(({ id, label, href, icon, hero }) => {
        const on = id === current;
        return (
          <a
            key={id}
            href={href}
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