// components/Icons.jsx
// Bộ icon SVG nét mảnh, kiểu Lucide/Apple — đồng bộ stroke 1.7

const base = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

export const IconHome = (p) => (
  <svg {...base} {...p}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
    <path d="M9.5 21v-6h5v6" />
  </svg>
);

export const IconAtom = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
    <ellipse cx="12" cy="12" rx="9" ry="3.8" />
    <ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(60 12 12)" />
    <ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(120 12 12)" />
  </svg>
);

export const IconFlask = (p) => (
  <svg {...base} {...p}>
    <path d="M9 3h6" />
    <path d="M10 3v6.5L4.8 18a2 2 0 0 0 1.8 3h10.8a2 2 0 0 0 1.8-3L14 9.5V3" />
    <path d="M7 15h10" />
  </svg>
);

export const IconCalc = (p) => (
  <svg {...base} {...p}>
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <path d="M8 7h8" />
    <path d="M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" />
  </svg>
);

export const IconRobot = (p) => (
  <svg {...base} {...p}>
    <rect x="4" y="8" width="16" height="12" rx="3" />
    <path d="M12 3v5" />
    <circle cx="12" cy="3" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="9" cy="14" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="15" cy="14" r="1.2" fill="currentColor" stroke="none" />
    <path d="M9.5 17.5h5" />
  </svg>
);

export const IconMicroscope = (p) => (
  <svg {...base} {...p}>
    <path d="M6 21h14" />
    <path d="M9 21V9a3 3 0 0 1 3-3h0" />
    <path d="M6 9h6" />
    <circle cx="17" cy="10" r="3.5" />
    <path d="M13.5 10h-2" />
    <path d="M14.5 20a7 7 0 0 0 3-5.5" />
  </svg>
);

export const IconScale = (p) => (
  <svg {...base} {...p}>
    <path d="M12 4v16" />
    <path d="M5 7h14" />
    <path d="M8 7 5 14h6L8 7Z" />
    <path d="M16 7l-3 7h6l-3-7Z" />
    <path d="M8 20h8" />
  </svg>
);

export const IconTimer = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="13" r="8" />
    <path d="M12 9v4l2.5 2" />
    <path d="M9 2h6" />
    <path d="M19 5.5 17 7.5" />
  </svg>
);

export const IconCalendar = (p) => (
  <svg {...base} {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18" />
    <path d="M8 3v4M16 3v4" />
    <circle cx="12" cy="15" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

export const IconNote = (p) => (
  <svg {...base} {...p}>
    <path d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
    <path d="M14 3v6h6" />
    <path d="M8 13h7M8 17h5" />
  </svg>
);

export const IconTarget = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

export const IconQuiz = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9a2.5 2.5 0 1 1 3.8 2.1c-.8.5-1.3 1-1.3 2" />
    <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const IconGamepad = (p) => (
  <svg {...base} {...p}>
    <path d="M6.5 8h11a5 5 0 0 1 4.7 6.6l-.9 2.7a2.6 2.6 0 0 1-4.5.9L15 16.5H9l-1.8 1.7a2.6 2.6 0 0 1-4.5-.9l-.9-2.7A5 5 0 0 1 6.5 8Z" />
    <path d="M8 11.5v3M6.5 13h3" />
    <circle cx="16" cy="12.5" r=".9" fill="currentColor" stroke="none" />
    <circle cx="18" cy="14.5" r=".9" fill="currentColor" stroke="none" />
  </svg>
);

export const IconTools = (p) => (
  <svg {...base} {...p}>
    <path d="M14.5 4.5a3.5 3.5 0 0 0 4.7 4.7L21 8v2.5a6.5 6.5 0 0 1-9.4 5.8l-4.7 4.7a2 2 0 0 1-2.8-2.8l4.7-4.7A6.5 6.5 0 0 1 14.5 4.5Z" />
  </svg>
);

export const IconSun = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

export const IconMoon = (p) => (
  <svg {...base} {...p}>
    <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
  </svg>
);

export const IconMenu = (p) => (
  <svg {...base} {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const IconClose = (p) => (
  <svg {...base} {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
export const IconSearch = (p) => (
  <svg {...base} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-4.3-4.3" />
  </svg>
);
export const IconUser = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
  </svg>
);