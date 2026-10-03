/* SVG icons cho WrongNotebook — stroke 1.75 đồng bộ */

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

export const IcoBookOpen = (p) => (
  <Svg {...p}>
    <path d="M2 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H2z" />
    <path d="M22 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8z" />
  </Svg>
);

export const IcoBookMark = ({ filled, ...p }) => (
  <Svg {...p} filled={filled}>
    <path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16l-8-4-8 4z" />
  </Svg>
);

export const IcoX = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9 9l6 6M15 9l-6 6" />
  </Svg>
);

export const IcoCheck = (p) => (
  <Svg {...p}><path d="M4 12l5 5L20 6" /></Svg>
);

export const IcoCheckCircle = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12l3 3 5-6" />
  </Svg>
);

export const IcoSearch = (p) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-4.5-4.5" />
  </Svg>
);

export const IcoClose = (p) => (
  <Svg {...p}><path d="M6 6l12 12M18 6L6 18" /></Svg>
);

export const IcoTrash = (p) => (
  <Svg {...p}>
    <path d="M4 7h16M10 11v6M14 11v6" />
    <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
    <path d="M9 7V4h6v3" />
  </Svg>
);

export const IcoStar = ({ filled, ...p }) => (
  <Svg {...p} filled={filled}>
    <path d="M12 3l2.9 6.2 6.6.9-4.8 4.6 1.2 6.6L12 18.3 6.1 21.3l1.2-6.6L2.5 10l6.6-.9z" />
  </Svg>
);

export const IcoCopy = (p) => (
  <Svg {...p}>
    <rect x="8" y="8" width="12" height="12" rx="2" />
    <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
  </Svg>
);

export const IcoDownload = (p) => (
  <Svg {...p}>
    <path d="M12 3v12M7 10l5 5 5-5" />
    <path d="M5 21h14" />
  </Svg>
);

export const IcoUpload = (p) => (
  <Svg {...p}>
    <path d="M12 21V9M7 14l5-5 5 5" />
    <path d="M5 3h14" />
  </Svg>
);

export const IcoFilter = (p) => (
  <Svg {...p}><path d="M3 5h18l-7 8v6l-4 2v-8z" /></Svg>
);

export const IcoSort = (p) => (
  <Svg {...p}>
    <path d="M3 6h13M3 12h9M3 18h5" />
    <path d="M17 10l3-3 3 3M20 7v10" />
  </Svg>
);

export const IcoGrid = (p) => (
  <Svg {...p}>
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </Svg>
);

export const IcoList = (p) => (
  <Svg {...p}>
    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
  </Svg>
);

export const IcoShuffle = (p) => (
  <Svg {...p}>
    <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
  </Svg>
);

export const IcoPlay = (p) => (
  <Svg {...p}><path d="M6 4l14 8-14 8z" /></Svg>
);

export const IcoArrowDown = (p) => (
  <Svg {...p}><path d="M6 9l6 6 6-6" /></Svg>
);

export const IcoArrowUp = (p) => (
  <Svg {...p}><path d="M18 15l-6-6-6 6" /></Svg>
);

export const IcoSparkle = (p) => (
  <Svg {...p}>
    <path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z" />
    <path d="M19 15l.7 1.8L21.5 17.5l-1.8.7L19 20l-.7-1.8L16.5 17.5l1.8-.7z" />
  </Svg>
);

export const IcoBulb = (p) => (
  <Svg {...p}>
    <path d="M9 18h6M10 21h4" />
    <path d="M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z" />
  </Svg>
);

export const IcoStats = (p) => (
  <Svg {...p}>
    <path d="M3 3v18h18" />
    <rect x="7" y="12" width="3" height="6" />
    <rect x="12" y="8" width="3" height="10" />
    <rect x="17" y="14" width="3" height="4" />
  </Svg>
);

export const IcoClock = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Svg>
);

export const IcoFire = (p) => (
  <Svg {...p}>
    <path d="M12 2s4 4 4 8a4 4 0 0 1-8 0c0-2 1-3 1-3s-3 2-3 5a6 6 0 0 0 12 0c0-4-6-10-6-10z" />
  </Svg>
);

export const IcoTag = (p) => (
  <Svg {...p}>
    <path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z" />
    <circle cx="7.5" cy="7.5" r="1.5" />
  </Svg>
);

export const IcoEye = (p) => (
  <Svg {...p}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);

export const IcoEdit = (p) => (
  <Svg {...p}>
    <path d="M4 20h4L20 8l-4-4L4 16z" />
    <path d="M14 6l4 4" />
  </Svg>
);

export const IcoNote = (p) => (
  <Svg {...p}>
    <path d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
    <path d="M14 3v6h6M8 13h8M8 17h5" />
  </Svg>
);

export const IcoInfo = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v.01M11 12h1v4h1" />
  </Svg>
);