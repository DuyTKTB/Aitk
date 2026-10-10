/* ============================================================
   AdminIcons.jsx — Bộ icon SVG dùng chung cho khu quản trị
   Không emoji, không icon font. Chỉ SVG thuần, kế thừa currentColor.
   ============================================================ */
const Svg = ({ size = 18, children, filled = false, sw = 1.8, className, title }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    role={title ? 'img' : undefined}
    aria-hidden={title ? undefined : 'true'}
    aria-label={title}
    focusable="false"
  >
    {children}
  </svg>
);

/* ============================================================
   NHÓM 1: ĐIỀU HƯỚNG
   ============================================================ */
export const IconDashboard = (p) => (
  <Svg {...p}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </Svg>
);

export const IconHome = (p) => (
  <Svg {...p}>
    <path d="M4 11l8-7 8 7v9H4z" />
    <path d="M10 20v-6h4v6" />
  </Svg>
);

export const IconBack = (p) => (
  <Svg {...p}>
    <path d="M15 6l-6 6 6 6" />
  </Svg>
);

export const IconChevron = (p) => (
  <Svg {...p}>
    <path d="M9 6l6 6-6 6" />
  </Svg>
);

export const IconChevronDown = (p) => (
  <Svg {...p}>
    <path d="M6 9l6 6 6-6" />
  </Svg>
);

/* ============================================================
   NHÓM 2: ĐỀ THI / CÂU HỎI
   ============================================================ */
export const IconExam = (p) => (
  <Svg {...p}>
    <path d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
    <path d="M14 3v6h6" />
    <path d="M8 13h8M8 17h5" />
  </Svg>
);

export const IconQuestion = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9 9a3 3 0 0 1 6 0c0 1.5-2 2-2 4" />
    <circle cx="12" cy="17" r=".6" fill="currentColor" />
  </Svg>
);
export const IconHelp = IconQuestion;

export const IconBook = (p) => (
  <Svg {...p}>
    <path d="M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2z" />
    <path d="M4 20a2 2 0 0 0 2 1h13v-3" />
    <path d="M8 7h7" />
  </Svg>
);

export const IconFileText = (p) => (
  <Svg {...p}>
    <path d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
    <path d="M14 3v6h6M8 13h8M8 17h8M8 9h3" />
  </Svg>
);

/* ============================================================
   NHÓM 3: NGƯỜI DÙNG / KEY PRO
   ============================================================ */
export const IconUsers = (p) => (
  <Svg {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M2.5 20c.6-3.4 3.3-5.5 6.5-5.5S15 16.6 15.6 20" />
    <circle cx="17" cy="9" r="2.6" />
    <path d="M16 14.5c2.4.3 4.3 2.1 4.8 4.8" />
  </Svg>
);

export const IconUser = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M4.5 20c.7-4 3.5-6 7.5-6s6.8 2 7.5 6" />
  </Svg>
);

export const IconUserCheck = (p) => (
  <Svg {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2 21c.7-4 3.5-6 7-6s6.3 2 7 6" />
    <path d="M17 12l2 2 4-4" />
  </Svg>
);

export const IconKey = (p) => (
  <Svg {...p}>
    <circle cx="7.5" cy="15.5" r="4.5" />
    <path d="M21 2l-9.6 9.6M15.5 7.5l3 3L22 7l-3-3" />
  </Svg>
);

export const IconCrown = (p) => (
  <Svg {...p}>
    <path d="M3 8l4 4 5-8 5 8 4-4v11H3z" />
    <circle cx="12" cy="20" r=".8" fill="currentColor" />
  </Svg>
);

export const IconCalendar = (p) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </Svg>
);

export const IconHourglass = (p) => (
  <Svg {...p}>
    <path d="M6 2h12M6 22h12M6 2v4c0 3 3 5 6 6-3 1-6 3-6 6v4M18 2v4c0 3-3 5-6 6 3 1 6 3 6 6v4" />
  </Svg>
);

export const IconExtend = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
    <path d="M19 4v3h-3" />
  </Svg>
);

export const IconRevoke = (p) => (
  <Svg {...p}>
    <path d="M4 7h16M10 11v6M14 11v6" />
    <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
    <path d="M9 7V4h6v3" />
    <path d="M3 3l18 18" strokeWidth="2.2" />
  </Svg>
);

/* ============================================================
   NHÓM 4: HÀNH ĐỘNG
   ============================================================ */
export const IconPlus = (p) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const IconSearch = (p) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M20 20l-4.2-4.2" />
  </Svg>
);

export const IconEdit = (p) => (
  <Svg {...p}>
    <path d="M4 20h4L20 8l-4-4L4 16z" />
    <path d="M14 6l4 4" />
  </Svg>
);

export const IconTrash = (p) => (
  <Svg {...p}>
    <path d="M4 7h16M10 11v6M14 11v6" />
    <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
    <path d="M9 7V4h6v3" />
  </Svg>
);

export const IconSave = (p) => (
  <Svg {...p}>
    <path d="M5 4h11l3 3v13H5z" />
    <path d="M8 4v5h7V4M8 20v-6h8v6" />
  </Svg>
);

export const IconCopy = (p) => (
  <Svg {...p}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V6a2 2 0 0 1 2-2h8" />
  </Svg>
);

export const IconUpload = (p) => (
  <Svg {...p}>
    <path d="M12 16V4M7 9l5-5 5 5" />
    <path d="M4 20h16" />
  </Svg>
);

export const IconDownload = (p) => (
  <Svg {...p}>
    <path d="M12 4v12M7 11l5 5 5-5" />
    <path d="M4 20h16" />
  </Svg>
);

export const IconRefresh = (p) => (
  <Svg {...p}>
    <path d="M20 11a8 8 0 0 0-14.300-4.200L4 8.500M4 4v4.500h4.500" />
    <path d="M4 13a8 8 0 0 0 14.300 4.200L20 15.500M20 20v-4.500h-4.500" />
  </Svg>
);

export const IconClose = (p) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);

export const IconFilter = (p) => (
  <Svg {...p}>
    <path d="M3 5h18l-7 8v6l-4-2v-4z" />
  </Svg>
);

export const IconLink = (p) => (
  <Svg {...p}>
    <path d="M10 14a4 4 0 0 0 5.700 0l3-3a4 4 0 0 0-5.700-5.700l-1 1" />
    <path d="M14 10a4 4 0 0 0-5.700 0l-3 3a4 4 0 0 0 5.700 5.700l1-1" />
  </Svg>
);

export const IconExternal = (p) => (
  <Svg {...p}>
    <path d="M14 4h6v6M20 4l-9 9" />
    <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </Svg>
);

/* ============================================================
   NHÓM 5: TRẠNG THÁI / THÔNG BÁO
   ============================================================ */
export const IconCheck = (p) => (
  <Svg {...p}>
    <path d="M5 12.500l4.500 4.500L19 7.500" />
  </Svg>
);

export const IconCheckCircle = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12.500l3 3 5-6" />
  </Svg>
);

export const IconAlert = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.500v5" />
    <circle cx="12" cy="16.200" r=".6" fill="currentColor" />
  </Svg>
);

export const IconWarning = (p) => (
  <Svg {...p}>
    <path d="M12 4l9 16H3z" />
    <path d="M12 10v4" />
    <circle cx="12" cy="17.200" r=".6" fill="currentColor" />
  </Svg>
);

export const IconInfo = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v.01M11 12h1v4h1" />
  </Svg>
);

export const IconBell = (p) => (
  <Svg {...p}>
    <path d="M6 8a6 6 0 0 1 12 0v5l1.5 3H4.5L6 13z" />
    <path d="M10 19a2 2 0 0 0 4 0" />
  </Svg>
);

export const IconMail = (p) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7l9 6 9-6" />
  </Svg>
);

export const IconLock = (p) => (
  <Svg {...p}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </Svg>
);

export const IconShield = (p) => (
  <Svg {...p}>
    <path d="M12 3l8 3v6c0 5-3.500 8-8 9-4.500-1-8-4-8-9V6z" />
  </Svg>
);

export const IconBan = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M5.600 5.600l12.800 12.800" />
  </Svg>
);

/* ============================================================
   NHÓM 6: DỮ LIỆU / HIỂN THỊ
   ============================================================ */
export const IconChart = (p) => (
  <Svg {...p}>
    <line x1="4" y1="20" x2="4" y2="10" />
    <line x1="10" y1="20" x2="10" y2="4" />
    <line x1="16" y1="20" x2="16" y2="12" />
    <line x1="22" y1="20" x2="22" y2="8" />
  </Svg>
);

export const IconActivity = (p) => (
  <Svg {...p}>
    <path d="M3 12h4l2-6 4 12 2-6h6" />
  </Svg>
);

export const IconTrendUp = (p) => (
  <Svg {...p}>
    <path d="M3 17l6-6 4 4 8-8" />
    <path d="M14 7h7v7" />
  </Svg>
);

export const IconTrendDown = (p) => (
  <Svg {...p}>
    <path d="M3 7l6 6 4-4 8 8" />
    <path d="M14 17h7v-7" />
  </Svg>
);

export const IconEye = (p) => (
  <Svg {...p}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);

export const IconEyeOff = (p) => (
  <Svg {...p}>
    <path d="M2 12s3.5-7 10-7c2 0 3.700.6 5.200 1.500M22 12s-3.500 7-10 7c-2 0-3.700-.6-5.200-1.500" />
    <path d="M9.900 9.900a3 3 0 0 0 4.200 4.200" />
    <path d="M4 4l16 16" />
  </Svg>
);

export const IconGrid = (p) => (
  <Svg {...p}>
    <rect x="4" y="4" width="7" height="7" rx="1.500" />
    <rect x="13" y="4" width="7" height="7" rx="1.500" />
    <rect x="4" y="13" width="7" height="7" rx="1.500" />
    <rect x="13" y="13" width="7" height="7" rx="1.500" />
  </Svg>
);

export const IconList = (p) => (
  <Svg {...p}>
    <path d="M9 6h11M9 12h11M9 18h11" />
    <path d="M4 6h.01M4 12h.01M4 18h.01" />
  </Svg>
);

export const IconLayers = (p) => (
  <Svg {...p}>
    <path d="M12 3l9 5-9 5-9-5z" />
    <path d="M3 13l9 5 9-5" />
  </Svg>
);

export const IconDatabase = (p) => (
  <Svg {...p}>
    <ellipse cx="12" cy="6" rx="8" ry="3" />
    <path d="M4 6v6c0 1.700 3.600 3 8 3s8-1.300 8-3V6" />
    <path d="M4 12v6c0 1.700 3.600 3 8 3s8-1.300 8-3v-6" />
  </Svg>
);

export const IconCode = (p) => (
  <Svg {...p}>
    <path d="M8 8l-4 4 4 4M16 8l4 4-4 4M14 5l-4 14" />
  </Svg>
);

/* ============================================================
   NHÓM 7: BIỂU TƯỢNG / TRANG TRÍ
   ============================================================ */
export const IconTrophy = (p) => (
  <Svg {...p}>
    <path d="M7 5h10v4a5 5 0 0 1-10 0z" />
    <path d="M7 6H4a3 3 0 0 0 3 3M17 6h3a3 3 0 0 1-3 3" />
    <path d="M9 18h6M12 14v4" />
  </Svg>
);

export const IconClock = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Svg>
);

export const IconSparkle = (p) => (
  <Svg {...p}>
    <path d="M11 3l1.800 5.200L18 10l-5.200 1.800L11 17l-1.800-5.200L4 10l5.200-1.800z" />
    <path d="M19 15l.8 2.200L22 18l-2.200.8L19 21l-.8-2.200L16 18l2.200-.8z" />
  </Svg>
);

export const IconBolt = (p) => (
  <Svg {...p}>
    <path d="M13 3L5 13h6l-1 8 8-10h-6z" />
  </Svg>
);

export const IconStar = (p) => (
  <Svg {...p}>
    <path d="M12 3.500l2.600 5.400 5.900.8-4.300 4.100 1 5.800-5.200-2.800-5.200 2.800 1-5.800L3.500 9.700l5.900-.8z" />
  </Svg>
);

export const IconTarget = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
  </Svg>
);

export const IconBulb = (p) => (
  <Svg {...p}>
    <path d="M9 18h6M10 21h4" />
    <path d="M12 3a6 6 0 0 0-3.500 10.900c.6.500 1 1.200 1 2.100h5c0-.9.400-1.600 1-2.100A6 6 0 0 0 12 3z" />
  </Svg>
);

export const IconFlask = (p) => (
  <Svg {...p}>
    <path d="M9 3h6M10 3v6L4.500 19a1.500 1.500 0 0 0 1.300 2h12.400a1.500 1.500 0 0 0 1.300-2L14 9V3" />
    <path d="M7.500 15h9" />
  </Svg>
);

export const IconImage = (p) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="9" cy="10" r="1.600" />
    <path d="M3 17l5-4 4 3 3-2 6 5" />
  </Svg>
);

export const IconCamera = (p) => (
  <Svg {...p}>
    <path d="M4 8h3l1.500-2h7L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
    <circle cx="12" cy="13.500" r="3.500" />
  </Svg>
);

export const IconKeyboard = (p) => (
  <Svg {...p}>
    <rect x="2.500" y="6" width="19" height="12" rx="2" />
    <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10" />
  </Svg>
);

/* ============================================================
   NHÓM 8: CÀI ĐẶT / ĐĂNG XUẤT
   ============================================================ */
export const IconSettings = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" />
  </Svg>
);

export const IconLogout = (p) => (
  <Svg {...p}>
    <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
    <path d="M10 17l-5-5 5-5M5 12h12" />
  </Svg>
);