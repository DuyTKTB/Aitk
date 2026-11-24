
import {
  Home as JiggHome,
  Book as JiggBook,
  Bookmark as JiggBookmark,
  Bot as JiggBot,
  Briefcase as JiggBriefcase,
  Calculator as JiggCalculator,
  Calendar as JiggCalendar,
  Camera as JiggCamera,
  Clock as JiggClock,
  Cube as JiggCube,
  Diamond as JiggDiamond,
  Download as JiggDownload,
  Eye as JiggEye,
  Feather as JiggFeather,
  Flash as JiggFlash,
  Folder as JiggFolder,
  Globe as JiggGlobe,
  Key as JiggKey,
  Laptop as JiggLaptop,
  Lightbulb as JiggLightbulb,
  Lock as JiggLock,
  Mail as JiggMail,
  Message as JiggMessage,
  Palette as JiggPalette,
  Pin as JiggPin,
  PuzzlePiece as JiggPuzzle,
  Rocket as JiggRocket,
  Saved as JiggSaved,
  Send as JiggSend,
  Star as JiggStar,
  Trophy as JiggTrophy,
  Upload as JiggUpload,
  WeatherMoon as JiggMoon,
  Bell as JiggBell,
  Handshake as JiggHandshake,
} from './jiggicons';

const JiggGlass = ({ Icon, size = 18, className = '', style, ...rest }) => {
  const px = Math.round(Number(size) || 18);
  return (
    <span
      className={`jigg-ocean-glass ${className}`.trim()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: px,
        height: px,
        flexShrink: 0,
        verticalAlign: 'middle',
        lineHeight: 0,
        ...style,
      }}
      aria-hidden="true"
    >
      <Icon variant="glass" size={px} animate="hover" {...rest} />
    </span>
  );
};

const duo = { fill: 'currentColor', fillOpacity: 0.14 };
const dot = { fill: 'currentColor', stroke: 'none' };

export const Svg = ({ size = 18, children, className = '', ...p }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={1.75}
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    className={`anim-ico-svg ${className}`.trim()}
    {...p}
  >
    {children}
  </svg>
);
export const IconHome = (p) => <JiggGlass Icon={JiggHome} {...p} />;

export const IconAtom = ({ className = '', ...p }) => (
  <Svg className={`anim-ico-atom ${className}`} {...p}>
    <ellipse cx="12" cy="12" rx="9.5" ry="3.8" />
    <ellipse cx="12" cy="12" rx="9.5" ry="3.8" transform="rotate(60 12 12)" />
    <ellipse cx="12" cy="12" rx="9.5" ry="3.8" transform="rotate(120 12 12)" />
    <circle cx="12" cy="12" r="2" {...dot} />
  </Svg>
);

export const IconFlask = ({ className = '', ...p }) => (
  <Svg className={`anim-ico-flask ${className}`} {...p}>
    <path d="M7.4 14H16.6L19 18.2a1.8 1.8 0 0 1-1.6 2.7H6.6A1.8 1.8 0 0 1 5 18.2z" {...duo} stroke="none" />
    <path d="M9.5 3.5h5M10.2 3.5v5.6L5 18.2a1.8 1.8 0 0 0 1.6 2.7h10.8a1.8 1.8 0 0 0 1.6-2.7L13.8 9.1V3.5" />
    <circle cx="10.8" cy="17.2" r=".8" {...dot} />
    <circle cx="14" cy="18.2" r=".6" {...dot} />
  </Svg>
);

export const IconCalc = (p) => <JiggGlass Icon={JiggCalculator} {...p} />;

export const IconElecBrand = ({ size = 18, className = '', style, ...p }) => {
  const px = Math.round(Number(size) || 18);
  const visualSize = Math.max(16, px + 3);
  return (
    <span
      className={`anim-ico-svg anim-ico-robot anim-ico-ai elec-brand-ico-wrap ${className}`.trim()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: visualSize,
        height: visualSize,
        flexShrink: 0,
        verticalAlign: 'middle',
        lineHeight: 0,
        ...style,
      }}
      aria-hidden="true"
      {...p}
    >
      <img
        src="/img/elec-emblem.png"
        alt=""
        width={visualSize}
        height={visualSize}
        draggable={false}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
          filter: 'drop-shadow(0 0 1.2px rgba(255, 255, 255, 0.85))',
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      />
    </span>
  );
};

export const IconRobot = IconElecBrand;

export const IconMicroscope = ({ className = '', ...p }) => (
  <Svg className={`anim-ico-microscope ${className}`} {...p}>
    <path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z" {...duo} />
    <path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3M6 18h8M3 22h18M14 22a7 7 0 1 0 0-14h-1M9 14h2" />
  </Svg>
);

export const IconScale = ({ className = '', ...p }) => (
  <Svg className={`anim-ico-scale ${className}`} {...p}>
    <path d="M5 7 2.3 13.3a3 3 0 0 0 5.4 0Z" {...duo} />
    <path d="M19 7l-2.7 6.3a3 3 0 0 0 5.4 0Z" {...duo} />
    <path d="M12 3.5v17M8 20.5h8M5 7h14" />
  </Svg>
);

export const IconTimer = (p) => <JiggGlass Icon={JiggClock} {...p} />;

export const IconCalendar = (p) => <JiggGlass Icon={JiggCalendar} {...p} />;

export const IconNote = (p) => <JiggGlass Icon={JiggFeather} {...p} />;

export const IconTarget = (p) => <JiggGlass Icon={JiggRocket} {...p} />;

export const IconQuiz = (p) => <JiggGlass Icon={JiggSaved} {...p} />;

export const IconGamepad = (p) => <JiggGlass Icon={JiggPuzzle} {...p} />;

export const IconTools = (p) => <JiggGlass Icon={JiggCube} {...p} />;

export const IconSun = ({ className = '', ...p }) => (
  <Svg className={`anim-ico-sun ${className}`} {...p}>
    <circle cx="12" cy="12" r="4" {...duo} />
    <path d="M12 2.5v2M12 19.5v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2.5 12h2M19.5 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Svg>
);

export const IconMoon = (p) => <JiggGlass Icon={JiggMoon} {...p} />;

export const IconMenu = (p) => (<Svg {...p}><path d="M4 7h16M4 12h11M4 17h16" /></Svg>);
export const IconClose = ({ className = '', ...p }) => (
  <Svg className={`anim-ico-close ${className}`} {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);

export const IconSearch = ({ className = '', ...p }) => (
  <Svg className={`anim-ico-search ${className}`} {...p}>
    <circle cx="11" cy="11" r="6.5" {...duo} />
    <path d="m20 20-4.2-4.2" />
  </Svg>
);

export const IconUser = ({ className = '', ...p }) => (
  <Svg className={`anim-ico-user ${className}`} {...p}>
    <circle cx="12" cy="8" r="4" {...duo} />
    <path d="M4.5 20.5c.4-3.8 3.4-6 7.5-6s7.1 2.2 7.5 6" />
  </Svg>
);

export const IconLogout = ({ className = '', ...p }) => (
  <Svg className={`anim-ico-logout ${className}`} {...p}>
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

export const IconChevronDown = ({ className = '', ...p }) => (<Svg className={`anim-ico-chevron ${className}`} {...p}><path d="M6 9l6 6 6-6" /></Svg>);
export const IcoChevronDown = IconChevronDown;

export const IconChevronRight = ({ className = '', ...p }) => (<Svg className={`anim-ico-arrow ${className}`} {...p}><path d="M9 6l6 6-6 6" /></Svg>);
export const IcoChevronRight = IconChevronRight;

export const IconArrowRight = ({ className = '', ...p }) => (<Svg className={`anim-ico-arrow ${className}`} {...p}><path d="M5 12h14M13 5l7 7-7 7" /></Svg>);
export const IcoArrowRight = IconArrowRight;

export const IconArrowLeft = ({ className = '', ...p }) => (<Svg className={`anim-ico-arrow ${className}`} {...p}><path d="M19 12H5M11 5l-7 7 7 7" /></Svg>);
export const IcoArrowLeft = IconArrowLeft;

export const IconPlus = ({ className = '', ...p }) => (<Svg className={`anim-ico-plus ${className}`} {...p}><path d="M12 5v14M5 12h14" /></Svg>);
export const IcoPlus = IconPlus;

export const IconMinus = (p) => (<Svg {...p}><path d="M5 12h14" /></Svg>);
export const IcoMinus = IconMinus;

export const IconCheck = (p) => (<Svg {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></Svg>);
export const IcoCheck = IconCheck;

export const IconX = IconClose;
export const IcoX = IconClose;

export const IconStar = ({ on, ...p }) => <JiggGlass Icon={JiggStar} {...p} />;
export const IcoStar = IconStar;

export const IconBookmark = ({ on, ...p }) => <JiggGlass Icon={JiggBookmark} {...p} />;
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

export const IconBell = (p) => <JiggGlass Icon={JiggBell} {...p} />;
export const IcoBell = IconBell;

export const IconMail = (p) => <JiggGlass Icon={JiggMail} {...p} />;
export const IcoMail = IconMail;

export const IconSettings = ({ className = '', ...p }) => (
  <Svg className={`anim-ico-settings anim-ico-tools ${className}`} {...p}>
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

export const IconEye = (p) => <JiggGlass Icon={JiggEye} {...p} />;
export const IcoEye = IconEye;

export const IconTrash = ({ className = '', ...p }) => (
  <Svg className={`anim-ico-trash ${className}`} {...p}>
    <path d="M4 7h16M10 11v6M14 11v6" />
    <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
    <path d="M9 7V4h6v3" />
  </Svg>
);
export const IcoTrash = IconTrash;

export const IconEdit = (p) => <JiggGlass Icon={JiggFeather} {...p} />;
export const IcoEdit = IconEdit;

export const IconTrophy = (p) => <JiggGlass Icon={JiggTrophy} {...p} />;
export const IcoTrophy = IconTrophy;

export const IconClock = IconTimer;
export const IcoClock = IconTimer;

export const IconBook = (p) => <JiggGlass Icon={JiggBook} {...p} />;
export const IcoBook = IconBook;

export const IconChart = ({ className = '', ...p }) => (
  <Svg className={`anim-ico-chart ${className}`} {...p}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20V8" />
  </Svg>
);
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
export const IconSend = (p) => <JiggGlass Icon={JiggSend} {...p} />;
export const IcoSend = IconSend;

export const IconSparkle = (p) => <JiggGlass Icon={JiggDiamond} {...p} />;
export const IcoSparkle = IconSparkle;

export const IcoBrain = (p) => <JiggGlass Icon={JiggBot} {...p} />;

export const IcoCamera = (p) => <JiggGlass Icon={JiggCamera} {...p} />;

export const IcoChat = (p) => <JiggGlass Icon={JiggMessage} {...p} />;

export const IcoCrown = (p) => <JiggGlass Icon={JiggTrophy} {...p} />;

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

export const IconAlert = (p) => (
  <Svg {...p}>
    <path d="M12 9v4M12 17h.01" />
    <path d="M10.3 3.6 1.8 18.2A2 2 0 0 0 3.5 21h17a2 2 0 0 0 1.7-2.8L13.7 3.6a2 2 0 0 0-3.4 0Z" {...duo} />
  </Svg>
);
export const IcoAlert = IconAlert;

export const IconZap = (p) => <JiggGlass Icon={JiggFlash} {...p} />;
export const IcoZap = IconZap;

export const IconPin = (p) => <JiggGlass Icon={JiggPin} {...p} />;
export const IcoPin = IconPin;

export const IconBulb = (p) => <JiggGlass Icon={JiggLightbulb} {...p} />;
export const IcoBulb = IconBulb;

export const IconLock = (p) => <JiggGlass Icon={JiggLock} {...p} />;
export const IcoLock = IconLock;

export const IconFile = (p) => (
  <Svg {...p}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" {...duo} />
    <polyline points="14 2 14 8 20 8" />
  </Svg>
);
export const IcoFile = IconFile;

export const IconFolder = (p) => <JiggGlass Icon={JiggFolder} {...p} />;
export const IcoFolder = IconFolder;

export const IconShield = (p) => (
  <Svg {...p}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" {...duo} />
  </Svg>
);
export const IcoShield = IconShield;

export const IconSave = (p) => <JiggGlass Icon={JiggSaved} {...p} />;
export const IcoSave = IconSave;

export const IconDownload = (p) => <JiggGlass Icon={JiggDownload} {...p} />;
export const IcoDownload = IconDownload;

export const IconUpload = (p) => <JiggGlass Icon={JiggUpload} {...p} />;
export const IcoUpload = IconUpload;

export const IconInfinity = (p) => (
  <Svg {...p}>
    <path d="M18.178 8c5.096 0 5.096 8 0 8-2.678 0-4.498-2.667-6.178-5.333C10.32 8 8.5 8 5.822 8c-5.096 0-5.096 8 0 8 2.678 0 4.498-2.667 6.178-5.333C13.68 16 15.5 16 18.178 16Z" />
  </Svg>
);

export const IconBan = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="10" />
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
  </Svg>
);
