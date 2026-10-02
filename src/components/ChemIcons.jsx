// src/components/ChemIcons.jsx
// Bộ SVG icon thuần — không dùng emoji. Kế thừa currentColor và size.

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const Svg = ({ size = 18, children, filled = false }) => (
  <svg {...base} width={size} height={size} fill={filled ? 'currentColor' : 'none'} aria-hidden="true">
    {children}
  </svg>
);

// ---------- Môn học ----------
export const IconMath = ({ size }) => (
  <Svg size={size}><path d="M4 20 20 4" /><path d="M4 4h6" /><path d="M14 20h6" /><circle cx="8" cy="17" r="1.2" /><circle cx="16" cy="7" r="1.2" /></Svg>
);
export const IconPhysics = ({ size }) => (
  <Svg size={size}><circle cx="12" cy="12" r="2.2" /><ellipse cx="12" cy="12" rx="9" ry="4" /><ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(60 12 12)" /><ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(120 12 12)" /></Svg>
);
export const IconChemistry = ({ size }) => (
  <Svg size={size}><path d="M10 3v6L5 19a1.5 1.5 0 0 0 1.3 2.3h11.4A1.5 1.5 0 0 0 19 19l-5-10V3" /><path d="M8.5 3h7" /><path d="M7 14h10" /></Svg>
);
export const IconBiology = ({ size }) => (
  <Svg size={size}><path d="M8 4c4 2 6 6 6 10a6 6 0 0 1-6 6" /><path d="M16 4c-4 2-6 6-6 10a6 6 0 0 0 6 6" /><path d="M12 4v16" /></Svg>
);
export const IconLiterature = ({ size }) => (
  <Svg size={size}><path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2z" /><path d="M8 3v18" /><path d="M11 8h5M11 12h5" /></Svg>
);
export const IconEnglish = ({ size }) => (
  <Svg size={size}><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></Svg>
);
export const IconHistory = ({ size }) => (
  <Svg size={size}><path d="M3 10 12 4l9 6" /><path d="M5 10v9h14v-9" /><path d="M9 19v-5h6v5" /></Svg>
);
export const IconGeography = ({ size }) => (
  <Svg size={size}><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3c4 4 4 14 0 18M12 3c-4 4-4 14 0 18" /></Svg>
);
export const IconInformatics = ({ size }) => (
  <Svg size={size}><rect x="3" y="4" width="18" height="14" rx="1.5" /><path d="M8 21h8M12 18v3" /><path d="M8 9l-2 2 2 2M16 9l2 2-2 2M13 8l-2 8" /></Svg>
);

// ---------- Hành động ----------
export const IconPlay = ({ size }) => (<Svg size={size}><path d="M8 5v14l11-7z" filled /></Svg>);
export const IconClock = ({ size }) => (<Svg size={size}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>);
export const IconList = ({ size }) => (<Svg size={size}><path d="M8 6h13M8 12h13M8 18h13" /><circle cx="4" cy="6" r="1" filled /><circle cx="4" cy="12" r="1" filled /><circle cx="4" cy="18" r="1" filled /></Svg>);
export const IconGrid = ({ size }) => (<Svg size={size}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></Svg>);
export const IconFilter = ({ size }) => (<Svg size={size}><path d="M3 5h18l-7 8v5l-4 2v-7z" /></Svg>);
export const IconCheck = ({ size }) => (<Svg size={size}><path d="M5 12.5l4.5 4.5L19 7.5" /></Svg>);
export const IconX = ({ size }) => (<Svg size={size}><path d="M6 6l12 12M18 6L6 18" /></Svg>);
export const IconStar = ({ size, on }) => (<Svg size={size} filled={on}><path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9 6.8 19.7l1-5.9L3.5 9.7l5.9-.8z" /></Svg>);
export const IconBookmark = ({ size, on }) => (<Svg size={size} filled={on}><path d="M6 3h12v18l-6-4-6 4z" /></Svg>);
export const IconCopy = ({ size }) => (<Svg size={size}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></Svg>);
export const IconShare = ({ size }) => (<Svg size={size}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 10.7l6.8-4.4M8.6 13.3l6.8 4.4" /></Svg>);
export const IconArrowRight = ({ size }) => (<Svg size={size}><path d="M5 12h14M13 5l7 7-7 7" /></Svg>);
export const IconArrowLeft = ({ size }) => (<Svg size={size}><path d="M19 12H5M11 5l-7 7 7 7" /></Svg>);
export const IconChevronDown = ({ size }) => (<Svg size={size}><path d="M6 9l6 6 6-6" /></Svg>);
export const IconSearch = ({ size }) => (<Svg size={size}><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></Svg>);
export const IconFlag = ({ size }) => (<Svg size={size}><path d="M6 3v18" /><path d="M6 4h11l-2 4 2 4H6" /></Svg>);
export const IconTrophy = ({ size }) => (<Svg size={size}><path d="M7 5h10v4a5 5 0 0 1-10 0z" /><path d="M7 6H4a3 3 0 0 0 3 3M17 6h3a3 3 0 0 1-3 3" /><path d="M9 18h6M12 14v4" /></Svg>);

// ---------- Hóa học ----------
export const IconFlask = ({ size }) => (<Svg size={size}><path d="M9 3h6v5l4.5 9.2A1.8 1.8 0 0 1 17.9 20H6.1a1.8 1.8 0 0 1-1.6-2.8L9 8z" /><path d="M7 13h10" /></Svg>);
export const IconAtom = ({ size }) => (<Svg size={size}><circle cx="12" cy="12" r="1.8" filled /><ellipse cx="12" cy="12" rx="9" ry="3.5" /><ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(60 12 12)" /><ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(120 12 12)" /></Svg>);
export const IconMolecule = ({ size }) => (<Svg size={size}><circle cx="6" cy="12" r="2.2" /><circle cx="18" cy="7" r="2.2" /><circle cx="18" cy="17" r="2.2" /><path d="M8 11l8-3M8 13l8 3" /></Svg>);
export const IconBond = ({ size }) => (<Svg size={size}><path d="M4 8h16M4 16h16" /><circle cx="4" cy="8" r="1.6" filled /><circle cx="20" cy="16" r="1.6" filled /></Svg>);
export const IconFormula = ({ size }) => (<Svg size={size}><path d="M5 5h6M8 5v14" /><path d="M15 9l5 6M20 9l-5 6" /></Svg>);
export const IconReaction = ({ size }) => (<Svg size={size}><path d="M4 12h7M13 12h7" /><path d="M10 8l2 4-2 4M14 8l-2 4 2 4" /></Svg>);
export const IconBalance = ({ size }) => (<Svg size={size}><path d="M12 3v18" /><path d="M4 7h16" /><path d="M6 7l-3 6h6zM18 7l-3 6h6z" /></Svg>);
export const IconGraph = ({ size }) => (<Svg size={size}><path d="M4 20V4M4 20h16" /><path d="M6 16c3 0 4-8 7-8s3 5 6 5" /></Svg>);

// ---------- Trạng thái ----------
export const IconStreak = ({ size }) => (<Svg size={size}><path d="M12 3c1 3 5 5 5 9a5 5 0 0 1-10 0c0-2 1-3 2-4 0 3 3 3 3 0 0-2-1-3 0-5z" /></Svg>);
export const IconTarget = ({ size }) => (<Svg size={size}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="1" filled /></Svg>);
export const IconLevel = ({ size }) => (<Svg size={size}><path d="M4 20V8M10 20V4M16 20v-8M22 20v-4" /></Svg>);
export const IconBook = ({ size }) => (<Svg size={size}><path d="M4 5a2 2 0 0 1 2-2h5v18H6a2 2 0 0 1-2-2z" /><path d="M20 5a2 2 0 0 0-2-2h-5v18h5a2 2 0 0 0 2-2z" /></Svg>);
export const IconNotebook = ({ size }) => (<Svg size={size}><rect x="5" y="3" width="14" height="18" rx="1.5" /><path d="M9 3v18" /><path d="M12 8h4M12 12h4" /></Svg>);
export const IconTag = ({ size }) => (<Svg size={size}><path d="M3 12V4h8l9 9-8 8z" /><circle cx="7.5" cy="7.5" r="1.2" filled /></Svg>);
export const IconCalendar = ({ size }) => (<Svg size={size}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></Svg>);
export const IconSpark = ({ size }) => (
  <Svg size={size}>
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
    <path d="M19 16l.6 1.7L21 18.3l-1.4.6L19 20l-.6-1.1L17 18.3l1.4-.6L19 16z" />
  </Svg>
);