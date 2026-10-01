// components/Icons.jsx — bộ icon nét 1.75, lưới 24px, nền mờ (duotone) theo currentColor.
// Dùng như cũ: <IconHome />, <IconHome size={22} />, <IconHome className="x" />
const duo = { fill: 'currentColor', fillOpacity: 0.14 };
const dot = { fill: 'currentColor', stroke: 'none' };

export const Svg = ({ size = 18, children, ...p }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={1.75}
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}
  >
    {children}
  </svg>
);

export const IconHome = (p) => (
  <Svg {...p}>
    <path d="M4 10.8 12 4l8 6.8V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19z" {...duo} />
    <path d="M9.5 20.5v-5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v5" />
  </Svg>
);

export const IconAtom = (p) => (
  <Svg {...p}>
    <ellipse cx="12" cy="12" rx="9.5" ry="3.8" />
    <ellipse cx="12" cy="12" rx="9.5" ry="3.8" transform="rotate(60 12 12)" />
    <ellipse cx="12" cy="12" rx="9.5" ry="3.8" transform="rotate(120 12 12)" />
    <circle cx="12" cy="12" r="2" {...dot} />
  </Svg>
);

export const IconFlask = (p) => (
  <Svg {...p}>
    <path d="M7.4 14H16.6L19 18.2a1.8 1.8 0 0 1-1.6 2.7H6.6A1.8 1.8 0 0 1 5 18.2z" {...duo} stroke="none" />
    <path d="M9.5 3.5h5M10.2 3.5v5.6L5 18.2a1.8 1.8 0 0 0 1.6 2.7h10.8a1.8 1.8 0 0 0 1.6-2.7L13.8 9.1V3.5" />
    <circle cx="10.8" cy="17.2" r=".8" {...dot} />
    <circle cx="14" cy="18.2" r=".6" {...dot} />
  </Svg>
);

export const IconCalc = (p) => (
  <Svg {...p}>
    <rect x="4" y="3" width="16" height="18" rx="2.5" />
    <rect x="7.5" y="6.5" width="9" height="3.5" rx="1" {...duo} />
    <path d="M8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01M16 17.5h.01" strokeWidth={2.2} />
  </Svg>
);

export const IconRobot = (p) => (
  <Svg {...p}>
    <rect x="4" y="8.5" width="16" height="11.5" rx="3.5" {...duo} />
    <path d="M12 4.8v3.7M2 13v3M22 13v3M9.5 17.2h5" />
    <circle cx="12" cy="3.6" r="1.3" {...dot} />
    <circle cx="9" cy="13.5" r="1.2" {...dot} />
    <circle cx="15" cy="13.5" r="1.2" {...dot} />
  </Svg>
);

export const IconMicroscope = (p) => (
  <Svg {...p}>
    <path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z" {...duo} />
    <path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3M6 18h8M3 22h18M14 22a7 7 0 1 0 0-14h-1M9 14h2" />
  </Svg>
);

export const IconScale = (p) => (
  <Svg {...p}>
    <path d="M5 7 2.3 13.3a3 3 0 0 0 5.4 0Z" {...duo} />
    <path d="M19 7l-2.7 6.3a3 3 0 0 0 5.4 0Z" {...duo} />
    <path d="M12 3.5v17M8 20.5h8M5 7h14" />
  </Svg>
);

export const IconTimer = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="13.5" r="7.5" {...duo} />
    <path d="M12 9.5v4l2.5 1.5M9.5 2.5h5M18.6 6.4l1.3-1.3" />
  </Svg>
);

export const IconCalendar = (p) => (
  <Svg {...p}>
    <path d="M3.5 10V7.5A2.5 2.5 0 0 1 6 5h12a2.5 2.5 0 0 1 2.5 2.5V10z" {...duo} stroke="none" />
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
    <circle cx="8.5" cy="14.5" r="1" {...dot} />
    <circle cx="12" cy="14.5" r="1" {...dot} />
    <circle cx="15.5" cy="14.5" r="1" {...dot} />
  </Svg>
);

export const IconNote = (p) => (
  <Svg {...p}>
    <path d="M7 3h7.5L19 7.5V19a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" {...duo} />
    <path d="M14.5 3v3.5a1 1 0 0 0 1 1H19M8.5 12.5h7M8.5 16h4.5" />
  </Svg>
);

export const IconTarget = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" {...duo} />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.6" {...dot} />
  </Svg>
);

export const IconQuiz = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" {...duo} />
    <path d="M9.5 9.2a2.6 2.6 0 1 1 3.9 2.2c-.9.5-1.4 1-1.4 2" />
    <circle cx="12" cy="16.8" r="1" {...dot} />
  </Svg>
);

export const IconGamepad = (p) => (
  <Svg {...p}>
    <path d="M6.5 8h11a5 5 0 0 1 4.7 6.6l-.9 2.7a2.6 2.6 0 0 1-4.5.9L15 16.5H9l-1.8 1.7a2.6 2.6 0 0 1-4.5-.9l-.9-2.7A5 5 0 0 1 6.5 8Z" {...duo} />
    <path d="M8 11v3.5M6.25 12.75h3.5" />
    <circle cx="16" cy="12" r=".9" {...dot} />
    <circle cx="18" cy="14" r=".9" {...dot} />
  </Svg>
);

export const IconTools = (p) => (
  <Svg {...p}>
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" {...duo} />
  </Svg>
);

export const IconSun = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" {...duo} />
    <path d="M12 2.5v2M12 19.5v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2.5 12h2M19.5 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Svg>
);

export const IconMoon = (p) => (
  <Svg {...p}>
    <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" {...duo} />
  </Svg>
);

export const IconMenu = (p) => (<Svg {...p}><path d="M4 7h16M4 12h11M4 17h16" /></Svg>);
export const IconClose = (p) => (<Svg {...p}><path d="M6 6l12 12M18 6 6 18" /></Svg>);

export const IconSearch = (p) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6.5" {...duo} />
    <path d="m20 20-4.2-4.2" />
  </Svg>
);

export const IconUser = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="4" {...duo} />
    <path d="M4.5 20.5c.4-3.8 3.4-6 7.5-6s7.1 2.2 7.5 6" />
  </Svg>
);

export const IconLogout = (p) => (
  <Svg {...p}>
    <path d="M9 21H5.5A2.5 2.5 0 0 1 3 18.5v-13A2.5 2.5 0 0 1 5.5 3H9" />
    <path d="m16 16.5 4.5-4.5L16 7.5M20.5 12H9" />
  </Svg>
);