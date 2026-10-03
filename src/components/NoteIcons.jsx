/* SVG icons cho Notes page — đồng bộ stroke 1.75 */

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

export const IcoPlus = (p) => (
  <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>
);

export const IcoSearch = (p) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-4.5-4.5" />
  </Svg>
);

export const IcoHeart = ({ filled, ...p }) => (
  <Svg {...p} filled={filled}>
    <path d="M12 20.5S3.5 14.5 3.5 8.5a5 5 0 0 1 8.5-3.5 5 5 0 0 1 8.5 3.5c0 6-8.5 12-8.5 12z" />
  </Svg>
);

export const IcoEdit = (p) => (
  <Svg {...p}>
    <path d="M4 20h4L20 8l-4-4L4 16z" />
    <path d="M14 6l4 4" />
  </Svg>
);

export const IcoTrash = (p) => (
  <Svg {...p}>
    <path d="M4 7h16M10 11v6M14 11v6" />
    <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
    <path d="M9 7V4h6v3" />
  </Svg>
);

export const IcoClose = (p) => (
  <Svg {...p}><path d="M6 6l12 12M18 6L6 18" /></Svg>
);

export const IcoCheck = (p) => (
  <Svg {...p}><path d="M4 12l5 5L20 6" /></Svg>
);

export const IcoPin = ({ filled, ...p }) => (
  <Svg {...p} filled={filled}>
    <path d="M12 17v5M9 3h6l-1 6 3 3v2H7v-2l3-3z" />
  </Svg>
);

export const IcoCopy = (p) => (
  <Svg {...p}>
    <rect x="8" y="8" width="12" height="12" rx="2" />
    <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
  </Svg>
);

export const IcoShare = (p) => (
  <Svg {...p}>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
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

export const IcoMove = (p) => (
  <Svg {...p}>
    <path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3" />
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

export const IcoUser = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1-4 4-6 8-6s7 2 8 6" />
  </Svg>
);

export const IcoClock = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Svg>
);

export const IcoFlame = (p) => (
  <Svg {...p}>
    <path d="M12 2s4 4 4 8a4 4 0 0 1-8 0c0-2 1-3 1-3s-3 2-3 5a6 6 0 0 0 12 0c0-4-6-10-6-10z" />
  </Svg>
);

export const IcoSparkle = (p) => (
  <Svg {...p}>
    <path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z" />
    <path d="M19 15l.7 1.8L21.5 17.5l-1.8.7L19 20l-.7-1.8L16.5 17.5l1.8-.7z" />
  </Svg>
);

export const IcoTag = (p) => (
  <Svg {...p}>
    <path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z" />
    <circle cx="7.5" cy="7.5" r="1.5" />
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

export const IcoEye = (p) => (
  <Svg {...p}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);

export const IcoReply = (p) => (
  <Svg {...p}>
    <path d="M9 14l-5-5 5-5" />
    <path d="M4 9h10a6 6 0 0 1 6 6v4" />
  </Svg>
);

export const IcoInfo = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v.01M11 12h1v4h1" />
  </Svg>
);