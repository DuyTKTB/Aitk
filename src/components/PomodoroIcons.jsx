/* SVG icons cho toàn bộ ứng dụng — stroke 1.75, phong cách Apple */

const Svg = ({ size = 18, children, filled = false, sw = 1.75 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

export const IcoPlay = (p) => <Svg {...p}><path d="M6 4l14 8-14 8z" /></Svg>;
export const IcoPause = (p) => (
  <Svg {...p}><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></Svg>
);
export const IcoReset = (p) => (
  <Svg {...p}><path d="M4 4v6h6" /><path d="M4 10a8 8 0 1 1 3 6.2" /></Svg>
);
export const IcoExpand = (p) => (
  <Svg {...p}><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" /></Svg>
);
export const IcoShrink = (p) => (
  <Svg {...p}><path d="M3 8h3a2 2 0 0 0 2-2V3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M21 16h-3a2 2 0 0 0-2 2v3" /></Svg>
);
export const IcoFocus = (p) => (
  <Svg {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" /></Svg>
);
export const IcoCoffee = (p) => (
  <Svg {...p}><path d="M17 8h1a4 4 0 0 1 0 8h-1" /><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z" /><path d="M6 2v3M10 2v3M14 2v3" /></Svg>
);
export const IcoMoon = (p) => (
  <Svg {...p}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></Svg>
);
export const IcoVolume = (p) => (
  <Svg {...p}><path d="M11 5L6 9H2v6h4l5 4z" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" /></Svg>
);
export const IcoVolumeOff = (p) => (
  <Svg {...p}><path d="M11 5L6 9H2v6h4l5 4z" /><path d="M22 9l-6 6M16 9l6 6" /></Svg>
);
export const IcoBell = (p) => (
  <Svg {...p}><path d="M6 8a6 6 0 0 1 12 0v5l1.5 3H4.5L6 13z" /><path d="M10 19a2 2 0 0 0 4 0" /></Svg>
);
export const IcoBellOff = (p) => (
  <Svg {...p}><path d="M6 8a6 6 0 0 1 12 0v5l1.5 3H4.5L6 13z" /><path d="M10 19a2 2 0 0 0 4 0" /><path d="M3 3l18 18" /></Svg>
);
export const IcoZap = (p) => <Svg {...p}><path d="M13 2L3 14h8l-1 8 10-12h-8z" /></Svg>;
export const IcoChart = (p) => (
  <Svg {...p}><path d="M3 3v18h18" /><rect x="7" y="12" width="3" height="6" /><rect x="12" y="8" width="3" height="10" /><rect x="17" y="14" width="3" height="4" /></Svg>
);
export const IcoClock = (p) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>;
export const IcoTrophy = (p) => (
  <Svg {...p}><path d="M7 5h10v4a5 5 0 0 1-10 0z" /><path d="M7 6H4a3 3 0 0 0 3 3M17 6h3a3 3 0 0 1-3 3" /><path d="M9 18h6M12 14v4" /></Svg>
);
export const IcoTarget = (p) => (
  <Svg {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /></Svg>
);
export const IcoCheck = (p) => <Svg {...p}><path d="M4 12l5 5L20 6" /></Svg>;
export const IcoClose = (p) => <Svg {...p}><path d="M6 6l12 12M18 6L6 18" /></Svg>;
export const IcoPlus = (p) => <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>;
export const IcoTrash = (p) => (
  <Svg {...p}><path d="M4 7h16M10 11v6M14 11v6" /><path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" /><path d="M9 7V4h6v3" /></Svg>
);
export const IcoEdit = (p) => (
  <Svg {...p}><path d="M4 20h4L20 8l-4-4L4 16z" /><path d="M14 6l4 4" /></Svg>
);
export const IcoNote = (p) => (
  <Svg {...p}><path d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" /><path d="M14 3v6h6M8 13h8M8 17h5" /></Svg>
);
export const IcoSparkle = (p) => (
  <Svg {...p}><path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z" /><path d="M19 15l.7 1.8L21.5 17.5l-1.8.7L19 20l-.7-1.8L16.5 17.5l1.8-.7z" /></Svg>
);
export const IcoBulb = (p) => (
  <Svg {...p}><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z" /></Svg>
);
export const IcoInfo = (p) => (
  <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 8v.01M11 12h1v4h1" /></Svg>
);
export const IcoSettings = (p) => (
  <Svg {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></Svg>
);
export const IcoCalendar = (p) => (
  <Svg {...p}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></Svg>
);
export const IcoChevronLeft = (p) => <Svg {...p}><path d="M15 18l-6-6 6-6" /></Svg>;
export const IcoChevronRight = (p) => <Svg {...p}><path d="M9 18l6-6-6-6" /></Svg>;
export const IcoArrowRight = (p) => <Svg {...p}><path d="M5 12h14M12 5l7 7-7 7" /></Svg>;
export const IcoHome = (p) => <Svg {...p}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></Svg>;
export const IcoFire = (p) => (
  <Svg {...p}><path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.2 2-4.2.2 1.4.9 2.2 1.7 2.7C10.4 8.6 10.6 5.6 12 3z" /></Svg>
);
export const IcoHeadphones = (p) => (
  <Svg {...p}><path d="M4 15v-3a8 8 0 0 1 16 0v3" /><rect x="3" y="14" width="4" height="7" rx="2" /><rect x="17" y="14" width="4" height="7" rx="2" /></Svg>
);