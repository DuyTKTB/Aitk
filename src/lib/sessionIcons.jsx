/* ============================================================
   sessionIcons.jsx — SVG icons cho Live Exam Session
   ------------------------------------------------------------
   Quy ước:
   • size prop, mặc định 18
   • stroke="currentColor" → ăn màu từ parent
   • strokeWidth mặc định 1.8, có thể override
   • aria-hidden="true" cho icon trang trí
   • Không dùng emoji, không dùng icon font
   ============================================================ */

const base = (size, strokeWidth) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
});

/* ============================================================
   A) ICONS TRẠNG THÁI / LIVE
   ============================================================ */

/** Chấm tròn đặc — dùng cho "LIVE" (kèm CSS pulse) */
export const IcoDot = ({ size = 10 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
  </svg>
);

/** Vòng tròn rỗng — dùng cho trạng thái chờ / offline */
export const IcoCircle = ({ size = 18, strokeWidth = 1.8 }) => (
  <svg {...base(size, strokeWidth)}>
    <circle cx="12" cy="12" r="9" />
  </svg>
);

/** Tia sóng — phát trực tiếp */
export const IcoBroadcast = ({ size = 18, strokeWidth = 1.8 }) => (
  <svg {...base(size, strokeWidth)}>
    <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
    <path d="M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7" />
    <path d="M5.5 5.5a9 9 0 0 0 0 13M18.5 5.5a9 9 0 0 1 0 13" />
  </svg>
);

/* ============================================================
   B) ICONS CAMERA / GIÁM SÁT
   ============================================================ */

/** Camera tĩnh (như code cũ) */
export const IcoCamera = ({ size = 18, strokeWidth = 1.8 }) => (
  <svg {...base(size, strokeWidth)}>
    <path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" />
    <circle cx="12" cy="12.5" r="3.5" />
  </svg>
);

/** Camera có dấu gạch chéo — tắt / mất kết nối */
export const IcoCameraOff = ({ size = 18, strokeWidth = 1.8 }) => (
  <svg {...base(size, strokeWidth)}>
    <path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" />
    <circle cx="12" cy="12.5" r="3.5" />
    <line x1="3" y1="3" x2="21" y2="21" />
  </svg>
);

/** Video / Webcam — dùng cho "Xem camera" */
export const IcoVideo = ({ size = 18, strokeWidth = 1.8 }) => (
  <svg {...base(size, strokeWidth)}>
    <rect x="2" y="6" width="14" height="12" rx="2" />
    <path d="M22 8l-6 4 6 4V8z" />
  </svg>
);

/** Màn hình lớn / giám sát nhiều camera */
export const IcoMonitor = ({ size = 18, strokeWidth = 1.8 }) => (
  <svg {...base(size, strokeWidth)}>
    <rect x="2" y="4" width="20" height="14" rx="2" />
    <path d="M8 22h8M12 18v4" />
  </svg>
);

/** Grid camera 2×2 — màn hình giám sát */
export const IcoGrid = ({ size = 18, strokeWidth = 1.8 }) => (
  <svg {...base(size, strokeWidth)}>
    <rect x="3" y="3" width="7" height="7" rx="1.2" />
    <rect x="14" y="3" width="7" height="7" rx="1.2" />
    <rect x="3" y="14" width="7" height="7" rx="1.2" />
    <rect x="14" y="14" width="7" height="7" rx="1.2" />
  </svg>
);

/* ============================================================
   C) ICONS CẢNH BÁO / VI PHẠM
   ============================================================ */

/** Tam giác cảnh báo có dấu chấm than */
export const IcoAlert = ({ size = 18, strokeWidth = 1.8 }) => (
  <svg {...base(size, strokeWidth)}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

/** Khiên — an toàn / bảo vệ */
export const IcoShield = ({ size = 18, strokeWidth = 1.8 }) => (
  <svg {...base(size, strokeWidth)}>
    <path d="M12 2L4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z" />
  </svg>
);

/** Khiên có dấu chấm than — mất an toàn */
export const IcoShieldAlert = ({ size = 18, strokeWidth = 1.8 }) => (
  <svg {...base(size, strokeWidth)}>
    <path d="M12 2L4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z" />
    <line x1="12" y1="8" x2="12" y2="13" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

/** Dấu X trong vòng tròn — lỗi / vi phạm nặng */
export const IcoError = ({ size = 18, strokeWidth = 1.8 }) => (
  <svg {...base(size, strokeWidth)}>
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

/** Dấu chấm than trong vòng tròn — cảnh báo */
export const IcoWarning = ({ size = 18, strokeWidth = 1.8 }) => (
  <svg {...base(size, strokeWidth)}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

/** Mắt có gạch chéo — nhìn ra ngoài / không thấy mặt */
export const IcoEyeOff = ({ size = 18, strokeWidth = 1.8 }) => (
  <svg {...base(size, strokeWidth)}>
    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-6 0-10-7-10-7a18.45 18.45 0 0 1 4.06-4.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c6 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19" />
    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

/** Người có dấu X — nhiều khuôn mặt */
export const IcoUserX = ({ size = 18, strokeWidth = 1.8 }) => (
  <svg {...base(size, strokeWidth)}>
    <circle cx="9" cy="8" r="4" />
    <path d="M2 21c0-4 3-7 7-7" />
    <line x1="17" y1="11" x2="22" y2="16" />
    <line x1="22" y1="11" x2="17" y2="16" />
  </svg>
);

/** Bàn tay — cử chỉ bất thường */
export const IcoHand = ({ size = 18, strokeWidth = 1.8 }) => (
  <svg {...base(size, strokeWidth)}>
    <path d="M18 11V6a2 2 0 0 0-4 0v5" />
    <path d="M14 10V4a2 2 0 0 0-4 0v8" />
    <path d="M10 10.5V6a2 2 0 0 0-4 0v8" />
    <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
  </svg>
);

/** Điện thoại — vật thể lạ */
export const IcoPhone = ({ size = 18, strokeWidth = 1.8 }) => (
  <svg {...base(size, strokeWidth)}>
    <rect x="6" y="2" width="12" height="20" rx="2.5" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
);

/* ============================================================
   D) ICONS HÀNH ĐỘNG
   ============================================================ */

/** Play — bắt đầu thi */
export const IcoPlay = ({ size = 18, strokeWidth = 1.8 }) => (
  <svg {...base(size, strokeWidth)}>
    <polygon points="6 4 20 12 6 20 6 4" fill="currentColor" />
  </svg>
);

/** Stop vuông — kết thúc */
export const IcoStop = ({ size = 18, strokeWidth = 1.8 }) => (
  <svg {...base(size, strokeWidth)}>
    <rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor" stroke="none" />
  </svg>
);

/** Pause — tạm dừng */
export const IcoPause = ({ size = 18, strokeWidth = 1.8 }) => (
  <svg {...base(size, strokeWidth)}>
    <rect x="7" y="5" width="3.5" height="14" rx="1" fill="currentColor" stroke="none" />
    <rect x="13.5" y="5" width="3.5" height="14" rx="1" fill="currentColor" stroke="none" />
  </svg>
);

/** Refresh — làm mới / tải lại */
export const IcoRefresh = ({ size = 18, strokeWidth = 1.8 }) => (
  <svg {...base(size, strokeWidth)}>
    <path d="M21 12a9 9 0 1 1-3-6.7" />
    <polyline points="21 4 21 10 15 10" />
  </svg>
);

/** Download — tải báo cáo */
export const IcoDownload = ({ size = 18, strokeWidth = 1.8 }) => (
  <svg {...base(size, strokeWidth)}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

/** Search — tìm kiếm HS */
export const IcoSearch = ({ size = 18, strokeWidth = 1.8 }) => (
  <svg {...base(size, strokeWidth)}>
    <circle cx="11" cy="11" r="7" />
    <line x1="20" y1="20" x2="16.5" y2="16.5" />
  </svg>
);

/** Filter — bộ lọc */
export const IcoFilter = ({ size = 18, strokeWidth = 1.8 }) => (
  <svg {...base(size, strokeWidth)}>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

/** Close — đóng */
export const IcoClose = ({ size = 18, strokeWidth = 1.8 }) => (
  <svg {...base(size, strokeWidth)}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

/** Chevron xuống — dropdown */
export const IcoChevron = ({ size = 14, strokeWidth = 2 }) => (
  <svg {...base(size, strokeWidth)}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

/** Chevron phải */
export const IcoChevronRight = ({ size = 14, strokeWidth = 2 }) => (
  <svg {...base(size, strokeWidth)}>
    <polyline points="9 6 15 12 9 18" />
  </svg>
);

/** Arrow left — quay lại */
export const IcoArrowLeft = ({ size = 18, strokeWidth = 2 }) => (
  <svg {...base(size, strokeWidth)}>
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

/** Maximize — mở full màn hình */
export const IcoMaximize = ({ size = 18, strokeWidth = 1.8 }) => (
  <svg {...base(size, strokeWidth)}>
    <path d="M8 3H5a2 2 0 0 0-2 2v3" />
    <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
    <path d="M3 16v3a2 2 0 0 0 2 2h3" />
    <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
  </svg>
);

/** Minimize — thu nhỏ */
export const IcoMinimize = ({ size = 18, strokeWidth = 1.8 }) => (
  <svg {...base(size, strokeWidth)}>
    <path d="M4 14h3a2 2 0 0 1 2 2v3" />
    <path d="M20 10h-3a2 2 0 0 1-2-2V5" />
    <path d="M14 10l7-7" />
    <path d="M3 21l7-7" />
  </svg>
);

/** User kick — đuổi khỏi phòng */
export const IcoUserKick = ({ size = 18, strokeWidth = 1.8 }) => (
  <svg {...base(size, strokeWidth)}>
    <circle cx="9" cy="8" r="4" />
    <path d="M2 21c0-4 3-7 7-7h2" />
    <line x1="16" y1="14" x2="22" y2="20" />
    <line x1="22" y1="14" x2="16" y2="20" />
  </svg>
);

/** Bell — thông báo */
export const IcoBell = ({ size = 18, strokeWidth = 1.8 }) => (
  <svg {...base(size, strokeWidth)}>
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

/** Clock — thời gian */
export const IcoClock = ({ size = 18, strokeWidth = 1.8 }) => (
  <svg {...base(size, strokeWidth)}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

/** Users — nhóm HS */
export const IcoUsers = ({ size = 18, strokeWidth = 1.8 }) => (
  <svg {...base(size, strokeWidth)}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

/** User đơn — 1 HS */
export const IcoUser = ({ size = 18, strokeWidth = 1.8 }) => (
  <svg {...base(size, strokeWidth)}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
  </svg>
);

/** Check trong vòng tròn — đã nộp */
export const IcoCheckCircle = ({ size = 18, strokeWidth = 1.8 }) => (
  <svg {...base(size, strokeWidth)}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="8 12 11 15 16 9" />
  </svg>
);

/** Book — đề thi */
export const IcoBook = ({ size = 18, strokeWidth = 1.8 }) => (
  <svg {...base(size, strokeWidth)}>
    <path d="M4 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4z" />
    <line x1="8" y1="7" x2="16" y2="7" />
    <line x1="8" y1="11" x2="16" y2="11" />
    <line x1="8" y1="15" x2="12" y2="15" />
  </svg>
);

/** Chart — thống kê */
export const IcoChart = ({ size = 18, strokeWidth = 1.8 }) => (
  <svg {...base(size, strokeWidth)}>
    <line x1="4" y1="20" x2="4" y2="10" />
    <line x1="10" y1="20" x2="10" y2="4" />
    <line x1="16" y1="20" x2="16" y2="12" />
    <line x1="22" y1="20" x2="22" y2="8" />
  </svg>
);

/* ============================================================
   E) ICON MAP — dùng cho violation type
   ============================================================ */
export const VIOLATION_META = {
  tab_hidden:        { Icon: IcoEyeOff,    label: 'Chuyển tab',              severity: 'hard' },
  window_blur:       { Icon: IcoEyeOff,    label: 'Mất tiêu điểm cửa sổ',    severity: 'hard' },
  exit_fullscreen:   { Icon: IcoMinimize,  label: 'Thoát toàn màn hình',     severity: 'hard' },
  no_face:           { Icon: IcoUserX,     label: 'Không thấy khuôn mặt',    severity: 'hard' },
  multi_face:        { Icon: IcoUsers,     label: 'Nhiều khuôn mặt',         severity: 'hard' },
  camera_lost:       { Icon: IcoCameraOff, label: 'Mất camera',              severity: 'hard' },
  look_away:         { Icon: IcoEyeOff,    label: 'Nhìn ra ngoài',           severity: 'soft' },
  hand_raise:        { Icon: IcoHand,      label: 'Cử chỉ tay bất thường',   severity: 'soft' },
  phone_like:        { Icon: IcoPhone,     label: 'Vật thể lạ',              severity: 'soft' },
  copy:              { Icon: IcoError,     label: 'Sao chép',                severity: 'soft' },
  paste:             { Icon: IcoError,     label: 'Dán',                     severity: 'soft' },
  cut:               { Icon: IcoError,     label: 'Cắt',                     severity: 'soft' },
  contextmenu:       { Icon: IcoWarning,   label: 'Chuột phải',              severity: 'soft' },
  devtools_shortcut: { Icon: IcoWarning,   label: 'Mở DevTools',             severity: 'soft' },
};

/**
 * Lấy metadata cho 1 loại vi phạm.
 * Fallback nếu type không có trong map.
 */
export function violationMeta(type) {
  return VIOLATION_META[type] || {
    Icon: IcoAlert,
    label: type || 'Vi phạm',
    severity: 'soft',
  };
}

/**
 * Lấy icon component cho trạng thái HS.
 */
export function statusIcon(status) {
  switch (status) {
    case 'submitted': return IcoCheckCircle;
    case 'kicked':    return IcoUserKick;
    case 'examining': return IcoVideo;
    case 'joined':    return IcoUser;
    default:          return IcoCircle;
  }
}
/* ============================================================
   F) ICONS UI — copy, trash, download, edit, refresh, search
   (bổ sung vì LiveProctorView / TeacherDashboard cần)
   ============================================================ */

/** Copy — 2 tờ giấy chồng nhau */
export const IcoCopy = ({ size = 18, strokeWidth = 1.8 }) => (
  <svg {...base(size, strokeWidth)}>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

/** Trash — thùng rác */
export const IcoTrash = ({ size = 18, strokeWidth = 1.8 }) => (
  <svg {...base(size, strokeWidth)}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
  </svg>
);

/** Edit — bút chì */
export const IcoEdit = ({ size = 18, strokeWidth = 1.8 }) => (
  <svg {...base(size, strokeWidth)}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

/** Upload cloud — tải lên */
export const IcoUploadCloud = ({ size = 18, strokeWidth = 1.8 }) => (
  <svg {...base(size, strokeWidth)}>
    <polyline points="16 16 12 12 8 16" />
    <line x1="12" y1="12" x2="12" y2="21" />
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
  </svg>
);

/** User plus — thêm người */
export const IcoUserPlus = ({ size = 18, strokeWidth = 1.8 }) => (
  <svg {...base(size, strokeWidth)}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <line x1="20" y1="8" x2="20" y2="14" />
    <line x1="23" y1="11" x2="17" y2="11" />
  </svg>
);

/** Key — chìa khoá */
export const IcoKey = ({ size = 18, strokeWidth = 1.8 }) => (
  <svg {...base(size, strokeWidth)}>
    <circle cx="7.5" cy="15.5" r="5.5" />
    <path d="M21 2l-9.6 9.6M15.5 7.5l3 3L22 7l-3-3" />
  </svg>
);

/** Wifi — online */
export const IcoWifi = ({ size = 18, strokeWidth = 1.8 }) => (
  <svg {...base(size, strokeWidth)}>
    <path d="M5 12.55a11 11 0 0 1 14.08 0" />
    <path d="M1.42 9a16 16 0 0 1 21.16 0" />
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
    <line x1="12" y1="20" x2="12.01" y2="20" />
  </svg>
);

/** Wifi off — offline */
export const IcoWifiOff = ({ size = 18, strokeWidth = 1.8 }) => (
  <svg {...base(size, strokeWidth)}>
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
    <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
    <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
    <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
    <line x1="12" y1="20" x2="12.01" y2="20" />
  </svg>
);

/** Clock alert — đồng hồ cảnh báo */
export const IcoClockAlert = ({ size = 18, strokeWidth = 1.8 }) => (
  <svg {...base(size, strokeWidth)}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

/** File text — báo cáo */
export const IcoFileText = ({ size = 18, strokeWidth = 1.8 }) => (
  <svg {...base(size, strokeWidth)}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

/** Play circle — bắt đầu phiên */
export const IcoPlayCircle = ({ size = 18, strokeWidth = 1.8 }) => (
  <svg {...base(size, strokeWidth)}>
    <circle cx="12" cy="12" r="10" />
    <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
  </svg>
);