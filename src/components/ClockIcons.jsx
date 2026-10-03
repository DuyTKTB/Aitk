/* SVG icons cho Clock Hub — stroke 1.75 */

const Svg = ({ size = 20, children, filled = false, sw = 1.75 }) => (
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

export const IcoClock = (p) => (
  <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>
);

export const IcoFocus = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
  </Svg>
);

export const IcoHourglass = (p) => (
  <Svg {...p}>
    <path d="M6 3h12M6 21h12M6 3v3c0 2 2 3 3 4l3 2 3-2c1-1 3-2 3-4V3M6 21v-3c0-2 2-3 3-4l3-2 3 2c1 1 3 2 3 4v3" />
  </Svg>
);

export const IcoBell = (p) => (
  <Svg {...p}>
    <path d="M6 8a6 6 0 0 1 12 0v5l1.5 3H4.5L6 13z" />
    <path d="M10 19a2 2 0 0 0 4 0" />
  </Svg>
);

export const IcoBellOff = (p) => (
  <Svg {...p}>
    <path d="M6 8a6 6 0 0 1 12 0v5l1.5 3H4.5L6 13z" />
    <path d="M10 19a2 2 0 0 0 4 0" />
    <path d="M3 3l18 18" />
  </Svg>
);

export const IcoStopwatch = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="13" r="8" />
    <path d="M12 9v4l2 2M9 3h6M12 3v2" />
  </Svg>
);

export const IcoGlobe = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.5 4 5.5 4 9s-1.5 6.5-4 9c-2.5-2.5-4-5.5-4-9s1.5-6.5 4-9z" />
  </Svg>
);

export const IcoPlay = (p) => <Svg {...p}><path d="M7 4l13 8-13 8z" /></Svg>;

export const IcoPause = (p) => (
  <Svg {...p}>
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </Svg>
);

export const IcoReset = (p) => (
  <Svg {...p}>
    <path d="M4 4v6h6" />
    <path d="M4 10a8 8 0 1 1 3 6.2" />
  </Svg>
);

export const IcoFlag = (p) => <Svg {...p}><path d="M4 22V4M4 4h12l-1 4 3 4H4" /></Svg>;

export const IcoPlus = (p) => <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>;

export const IcoMinus = (p) => <Svg {...p}><path d="M5 12h14" /></Svg>;

export const IcoChevUp = (p) => <Svg {...p}><path d="M6 15l6-6 6 6" /></Svg>;

export const IcoChevDown = (p) => <Svg {...p}><path d="M6 9l6 6 6-6" /></Svg>;

export const IcoChevLeft = (p) => <Svg {...p}><path d="M15 6l-6 6 6 6" /></Svg>;

export const IcoChevRight = (p) => <Svg {...p}><path d="M9 6l6 6-6 6" /></Svg>;

export const IcoExpand = (p) => (
  <Svg {...p}>
    <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />
  </Svg>
);

export const IcoShrink = (p) => (
  <Svg {...p}>
    <path d="M3 8h3a2 2 0 0 0 2-2V3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M21 16h-3a2 2 0 0 0-2 2v3" />
  </Svg>
);

export const IcoClose = (p) => <Svg {...p}><path d="M6 6l12 12M18 6L6 18" /></Svg>;

export const IcoCheck = (p) => <Svg {...p}><path d="M4 12l5 5L20 6" /></Svg>;

export const IcoEdit = (p) => (
  <Svg {...p}>
    <path d="M4 20h4L20 8l-4-4L4 16z" />
    <path d="M14 6l4 4" />
  </Svg>
);

export const IcoDots = (p) => (
  <Svg {...p}>
    <circle cx="5" cy="12" r="1.5" fill="currentColor" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    <circle cx="19" cy="12" r="1.5" fill="currentColor" />
  </Svg>
);

export const IcoSun = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </Svg>
);

export const IcoMoon = (p) => (
  <Svg {...p}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></Svg>
);

export const IcoSparkle = (p) => (
  <Svg {...p}>
    <path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z" />
    <path d="M19 15l.7 1.8L21.5 17.5l-1.8.7L19 20l-.7-1.8L16.5 17.5l1.8-.7z" />
  </Svg>
);

export const IcoTrash = (p) => (
  <Svg {...p}>
    <path d="M4 7h16M10 11v6M14 11v6" />
    <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
    <path d="M9 7V4h6v3" />
  </Svg>
);

export const IcoSettings = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" />
  </Svg>
);

export const IcoTarget = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
  </Svg>
);

export const IcoTrophy = (p) => (
  <Svg {...p}>
    <path d="M7 5h10v4a5 5 0 0 1-10 0z" />
    <path d="M7 6H4a3 3 0 0 0 3 3M17 6h3a3 3 0 0 1-3 3" />
    <path d="M9 18h6M12 14v4" />
  </Svg>
);

export const IcoFire = (p) => (
  <Svg {...p}>
    <path d="M12 2s4 4 4 8a4 4 0 0 1-8 0c0-2 1-3 1-3s-3 2-3 5a6 6 0 0 0 12 0c0-4-6-10-6-10z" />
  </Svg>
);

/* ============ ICONS MỚI ============ */

export const IcoVolume = (p) => (
  <Svg {...p}>
    <path d="M11 5L6 9H2v6h4l5 4z" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" />
  </Svg>
);

export const IcoVolumeOff = (p) => (
  <Svg {...p}>
    <path d="M11 5L6 9H2v6h4l5 4z" />
    <path d="M22 9l-6 6M16 9l6 6" />
  </Svg>
);

export const IcoMusic = (p) => (
  <Svg {...p}>
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </Svg>
);

export const IcoWind = (p) => (
  <Svg {...p}>
    <path d="M9.59 4.59A2 2 0 1 1 11 8H2M12.59 19.41A2 2 0 1 0 14 16H2M17.73 7.73A2.5 2.5 0 1 1 19.5 12H2" />
  </Svg>
);

export const IcoLeaf = (p) => (
  <Svg {...p}>
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </Svg>
);

export const IcoBook = (p) => (
  <Svg {...p}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </Svg>
);

export const IcoCoffee = (p) => (
  <Svg {...p}>
    <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4z" />
    <path d="M6 2v3M10 2v3M14 2v3" />
  </Svg>
);

export const IcoStar = ({ filled, ...p }) => (
  <Svg {...p} filled={filled}>
    <path d="M12 3l2.9 6.2 6.6.9-4.8 4.6 1.2 6.6L12 18.3 6.1 21.3l1.2-6.6L2.5 10l6.6-.9z" />
  </Svg>
);

export const IcoHeart = ({ filled, ...p }) => (
  <Svg {...p} filled={filled}>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </Svg>
);

export const IcoCalendar = (p) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </Svg>
);

export const IcoFilter = (p) => (
  <Svg {...p}><path d="M22 3H2l8 9.46V19l4 2v-8.54z" /></Svg>
);

export const IcoSearch = (p) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </Svg>
);

export const IcoChart = (p) => (
  <Svg {...p}>
    <path d="M3 3v18h18" />
    <rect x="7" y="12" width="3" height="6" />
    <rect x="12" y="8" width="3" height="10" />
    <rect x="17" y="14" width="3" height="4" />
  </Svg>
);

export const IcoInfo = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v.01M11 12h1v4h1" />
  </Svg>
);

export const IcoClipboard = (p) => (
  <Svg {...p}>
    <rect x="8" y="2" width="12" height="18" rx="2" />
    <path d="M16 2v4H8M4 6v14a2 2 0 0 0 2 2h12" />
  </Svg>
);

export const IcoDownload = (p) => (
  <Svg {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="M7 10l5 5 5-5M12 15V3" />
  </Svg>
);

export const IcoUpload = (p) => (
  <Svg {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="M17 8l-5-5-5 5M12 3v12" />
  </Svg>
);