
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

export const IconImage = (p) => (
  <Svg {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2.5" {...duo} />
    <circle cx="8.5" cy="8.5" r="1.6" {...dot} />
    <path d="m21 15-5-5L5 21" />
  </Svg>
);
export const IcoImage = IconImage;

export const IconArrowUpRight = (p) => (<Svg {...p}><path d="M7 17 17 7M8 7h9v9" /></Svg>);
export const IcoArrowUpRight = IconArrowUpRight;

export const IconChevronDown = (p) => (<Svg {...p}><path d="M6 9l6 6 6-6" /></Svg>);
export const IcoChevronDown = IconChevronDown;

export const IconChevronRight = (p) => (<Svg {...p}><path d="M9 6l6 6-6 6" /></Svg>);
export const IcoChevronRight = IconChevronRight;

export const IconArrowRight = (p) => (<Svg {...p}><path d="M5 12h14M13 5l7 7-7 7" /></Svg>);
export const IcoArrowRight = IconArrowRight;

export const IconArrowLeft = (p) => (<Svg {...p}><path d="M19 12H5M11 5l-7 7 7 7" /></Svg>);
export const IcoArrowLeft = IconArrowLeft;

export const IconPlus = (p) => (<Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>);
export const IcoPlus = IconPlus;

export const IconMinus = (p) => (<Svg {...p}><path d="M5 12h14" /></Svg>);
export const IcoMinus = IconMinus;

export const IconCheck = (p) => (<Svg {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></Svg>);
export const IcoCheck = IconCheck;

export const IconX = IconClose;
export const IcoX = IconClose;

export const IconStar = ({ size = 18, on, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"
    fill={on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.75}
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9 6.8 19.7l1-5.9L3.5 9.7l5.9-.8z" />
  </svg>
);
export const IcoStar = IconStar;

export const IconBookmark = ({ size = 18, on, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"
    fill={on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.75}
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    <path d="M6 3h12v18l-6-4-6 4z" />
  </svg>
);
export const IcoBookmark = IconBookmark;

export const IconCopy = (p) => (
  <Svg {...p}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V6a2 2 0 0 1 2-2h9" />
  </Svg>
);
export const IcoCopy = IconCopy;

export const IconShare = (p) => (
  <Svg {...p}>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="M8.6 10.7l6.8-4.4M8.6 13.3l6.8 4.4" />
  </Svg>
);
export const IcoShare = IconShare;

export const IconBell = (p) => (
  <Svg {...p}>
    <path d="M6 8a6 6 0 0 1 12 0v5l1.5 3H4.5L6 13z" {...duo} />
    <path d="M10 19a2 2 0 0 0 4 0" />
  </Svg>
);
export const IcoBell = IconBell;

export const IconMail = (p) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" {...duo} />
    <path d="M3 7l9 6 9-6" />
  </Svg>
);
export const IcoMail = IconMail;

export const IconSettings = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" {...duo} />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" />
  </Svg>
);
export const IcoSettings = IconSettings;

export const IconDashboard = (p) => (
  <Svg {...p}>
    <rect x="3" y="3" width="7" height="9" {...duo} />
    <rect x="14" y="3" width="7" height="5" {...duo} />
    <rect x="14" y="12" width="7" height="9" {...duo} />
    <rect x="3" y="16" width="7" height="5" {...duo} />
  </Svg>
);
export const IcoDashboard = IconDashboard;

export const IconExam = (p) => (
  <Svg {...p}>
    <path d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" {...duo} />
    <path d="M14 3v6h6M8 13h8M8 17h5" />
  </Svg>
);
export const IcoExam = IconExam;

export const IconQuestion = (p) => IconQuiz(p);
export const IcoQuestion = IconQuiz;

export const IconUsers = (p) => (
  <Svg {...p}>
    <circle cx="9" cy="8" r="3.2" {...duo} />
    <path d="M2.5 20c.6-3.4 3.3-5.5 6.5-5.5S15 16.6 15.6 20" />
    <circle cx="17" cy="9" r="2.6" {...duo} />
    <path d="M16 14.5c2.4.3 4.3 2.1 4.8 4.8" />
  </Svg>
);
export const IcoUsers = IconUsers;

export const IconActivity = (p) => (<Svg {...p}><path d="M3 12h4l2-6 4 12 2-6h6" /></Svg>);
export const IcoActivity = IconActivity;

export const IconTrendUp = (p) => (<Svg {...p}><path d="M3 17l6-6 4 4 8-8M14 7h7v7" /></Svg>);
export const IcoTrendUp = IconTrendUp;

export const IconTrendDown = (p) => (<Svg {...p}><path d="M3 7l6 6 4-4 8 8M14 17h7v-7" /></Svg>);
export const IcoTrendDown = IconTrendDown;

export const IconEye = (p) => (
  <Svg {...p}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" {...duo} />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);
export const IcoEye = IconEye;

export const IconTrash = (p) => (
  <Svg {...p}>
    <path d="M4 7h16M10 11v6M14 11v6" />
    <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
    <path d="M9 7V4h6v3" />
  </Svg>
);
export const IcoTrash = IconTrash;

export const IconEdit = (p) => (
  <Svg {...p}>
    <path d="M4 20h4L20 8l-4-4L4 16z" {...duo} />
    <path d="M14 6l4 4" />
  </Svg>
);
export const IcoEdit = IconEdit;

export const IconTrophy = (p) => (
  <Svg {...p}>
    <path d="M7 5h10v4a5 5 0 0 1-10 0z" {...duo} />
    <path d="M7 6H4a3 3 0 0 0 3 3M17 6h3a3 3 0 0 1-3 3" />
    <path d="M9 18h6M12 14v4" />
  </Svg>
);
export const IcoTrophy = IconTrophy;

export const IconClock = IconTimer;
export const IcoClock = IconTimer;

export const IconBook = (p) => (
  <Svg {...p}>
    <path d="M4 5a2 2 0 0 1 2-2h5v18H6a2 2 0 0 1-2-2z" {...duo} />
    <path d="M20 5a2 2 0 0 0-2-2h-5v18h5a2 2 0 0 0 2-2z" />
  </Svg>
);
export const IcoBook = IconBook;

export const IconChart = (p) => (<Svg {...p}><path d="M4 20V10M10 20V4M16 20v-7M22 20V8" /></Svg>);
export const IcoChart = IconChart;

export const IconTag = (p) => (
  <Svg {...p}>
    <path d="M3 12V4h8l9 9-8 8z" {...duo} />
    <circle cx="7.5" cy="7.5" r="1.2" {...dot} />
  </Svg>
);
export const IcoTag = IconTag;

export const IconFilter = (p) => (<Svg {...p}><path d="M3 5h18l-7 8v5l-4 2v-7z" /></Svg>);
export const IcoFilter = IconFilter;

export const IconList = (p) => (
  <Svg {...p}>
    <path d="M8 6h13M8 12h13M8 18h13" />
    <circle cx="4" cy="6" r="1" {...dot} />
    <circle cx="4" cy="12" r="1" {...dot} />
    <circle cx="4" cy="18" r="1" {...dot} />
  </Svg>
);
export const IcoList = IconList;

export const IconGrid = (p) => (
  <Svg {...p}>
    <rect x="3" y="3" width="7" height="7" {...duo} />
    <rect x="14" y="3" width="7" height="7" {...duo} />
    <rect x="3" y="14" width="7" height="7" {...duo} />
    <rect x="14" y="14" width="7" height="7" {...duo} />
  </Svg>
);
export const IcoGrid = IconGrid;

export const IconPlay = (p) => (<Svg {...p}><path d="M8 5v14l11-7z" fill="currentColor" /></Svg>);
export const IcoPlay = IconPlay;
export const IconSend = (p) => (
  <Svg {...p}>
    <path d="M22 2 11 13" />
    <path d="M22 2 15 22l-4-9-9-4z" {...duo} />
  </Svg>
);
export const IcoSend = IconSend;

export const IconSparkle = ({ size = 18, ...p }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={1.75}
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}
  >
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
    <path d="M12 8.5 13.2 11l2.5 1-2.5 1L12 15.5 10.8 13l-2.5-1 2.5-1z" fill="currentColor" stroke="none" />
  </svg>
);
export const IcoSparkle = IconSparkle;

export const IcoBrain = (p) => (
  <Svg {...p}>
    <path d="M9.5 3.5A3 3 0 0 0 6.6 6a3.2 3.2 0 0 0-1.9 4.6A3.3 3.3 0 0 0 6 16.8 3 3 0 0 0 9.5 20.5V3.5Z" {...duo} />
    <path d="M14.5 3.5A3 3 0 0 1 17.4 6a3.2 3.2 0 0 1 1.9 4.6 3.3 3.3 0 0 1-1.3 6.2 3 3 0 0 1-3.5 3.7V3.5Z" {...duo} />
    <path d="M9.5 9H8M9.5 14H8.2M14.5 9H16M14.5 14h1.3" />
  </Svg>
);

export const IcoCamera = (p) => (
  <Svg {...p}>
    <path d="M4 8h3l1.6-2.5h6.8L17 8h3a1 1 0 0 1 1 1v9.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" {...duo} />
    <circle cx="12" cy="13.5" r="3.5" />
  </Svg>
);

export const IcoChat = (p) => (
  <Svg {...p}>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 13.5Z" {...duo} />
    <path d="M8.5 8.5h7M8.5 11.5h4.5" />
  </Svg>
);

export const IcoCrown = (p) => (
  <Svg {...p}>
    <path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5Z" {...duo} />
    <path d="M5.5 19h13" />
  </Svg>
);

export const IcoRefresh = (p) => (
  <Svg {...p}>
    <path d="M20 11a8 8 0 0 0-14.3-4.2L4 8.5M4 4v4.5h4.5" />
    <path d="M4 13a8 8 0 0 0 14.3 4.2L20 15.5M20 20v-4.5h-4.5" />
  </Svg>
);

export const IcoStop = (p) => (
  <Svg {...p}>
    <rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor" />
  </Svg>
);
export const IcoClose = IconClose;
export const IcoSearch = IconSearch;
export const IcoUser = IconUser;
export const IcoLogout = IconLogout;
export const IcoChevron = IconChevronDown; // AIChat tự xoay bằng class .open