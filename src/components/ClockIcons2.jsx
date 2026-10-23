/* Icon SVG bổ sung cho Clock Hub — thay thế toàn bộ emoji.
   Cùng phong cách với ClockIcons.jsx: nét 1.75, bo tròn, kế thừa màu chữ (currentColor). */

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

/* ---- Mẫu Pomodoro ---- */
export const IcoTomato = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="14" r="7" />
    <path d="M12 7c-1.5-1.1-3.2-1.1-4.7 0M12 7c1.5-1.1 3.2-1.1 4.7 0M12 7V4M12 4c1 1 2.4 1 3.5.4" />
  </Svg>
);
export const IcoBrain = (p) => (
  <Svg {...p}>
    <path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 3 3 3 0 0 0 1.5 2.6A3 3 0 0 0 7 18a3 3 0 0 0 5 1V5a2.5 2.5 0 0 0-3-1z" />
    <path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 3 3 3 0 0 1-1.5 2.6A3 3 0 0 1 17 18a3 3 0 0 1-5 1" />
  </Svg>
);
export const IcoBolt = (p) => <Svg {...p}><path d="M13 2L4 14h7l-1 8 9-12h-7z" /></Svg>;
export const IcoSprout = (p) => (
  <Svg {...p}>
    <path d="M12 21v-9" />
    <path d="M12 12c0-4 3-6 7-6 0 4-3 6-7 6z" />
    <path d="M12 14c0-3-2.5-5-6-5 0 3.5 2.5 5 6 5z" />
  </Svg>
);

/* ---- Âm thanh môi trường ---- */
export const IcoCloudRain = (p) => (
  <Svg {...p}>
    <path d="M7 16a4.5 4.5 0 0 1-.5-9A6 6 0 0 1 18 8a4 4 0 0 1 0 8" />
    <path d="M8 19l-1 2M12 19l-1 2M16 19l-1 2" />
  </Svg>
);
export const IcoWaves = (p) => (
  <Svg {...p}>
    <path d="M3 8c2 0 2-2 4.5-2S10 8 12 8s2.5-2 4.5-2S19 8 21 8" />
    <path d="M3 13c2 0 2-2 4.5-2S10 13 12 13s2.5-2 4.5-2S19 13 21 13" />
    <path d="M3 18c2 0 2-2 4.5-2S10 18 12 18s2.5-2 4.5-2S19 18 21 18" />
  </Svg>
);
export const IcoTree = (p) => (
  <Svg {...p}>
    <path d="M12 3l5 7h-3l4 6H6l4-6H7z" />
    <path d="M12 16v5" />
  </Svg>
);
export const IcoNoiseRing = (p) => <Svg {...p}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /></Svg>;
export const IcoNoiseFill = (p) => <Svg {...p}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" fill="currentColor" /></Svg>;

/* ---- Âm báo ---- */
export const IcoChime = (p) => (
  <Svg {...p}>
    <path d="M5 5h14" />
    <path d="M8 5v9M12 5v12M16 5v7" />
    <path d="M7 14h2M11 17h2M15 12h2" />
  </Svg>
);
export const IcoAlarmClock = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="13" r="7" />
    <path d="M12 9v4l2 2M5 4L3 6M19 4l2 2" />
  </Svg>
);

/* ---- Sự kiện đếm ngược ---- */
export const IcoPencil = (p) => (
  <Svg {...p}><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="M13.5 6.5l4 4" /></Svg>
);
export const IcoGradCap = (p) => (
  <Svg {...p}><path d="M2 9l10-5 10 5-10 5z" /><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" /></Svg>
);
export const IcoEnvelope = (p) => (
  <Svg {...p}><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 8l9 6 9-6" /></Svg>
);
export const IcoCake = (p) => (
  <Svg {...p}>
    <path d="M4 20h16M5 20v-6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6" />
    <path d="M5 16c2 1.5 4 1.5 7 0s5-1.5 7 0" />
    <path d="M12 12V8M12 8c-1-1-1-2 0-3 1 1 1 2 0 3z" />
  </Svg>
);
export const IcoPlane = (p) => <Svg {...p}><path d="M21 3L3 11l7 3 3 7z" /><path d="M10 14L21 3" /></Svg>;
export const IcoRing = (p) => <Svg {...p}><circle cx="12" cy="15" r="6" /><path d="M9 6l3-3 3 3-3 3z" /></Svg>;

/* ---- Ghi chú thông tin ---- */
export const IcoBulb = (p) => (
  <Svg {...p}>
    <path d="M9 18h6M10 21h4" />
    <path d="M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z" />
  </Svg>
);
export const IcoSave = (p) => (
  <Svg {...p}>
    <path d="M5 3h11l4 4v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
    <path d="M8 3v5h7V3M8 21v-7h8v7" />
  </Svg>
);
export const IcoHeadphones = (p) => (
  <Svg {...p}>
    <path d="M4 15v-3a8 8 0 0 1 16 0v3" />
    <rect x="3" y="14" width="4" height="7" rx="2" />
    <rect x="17" y="14" width="4" height="7" rx="2" />
  </Svg>
);
