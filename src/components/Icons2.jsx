/* Icons2 — icon cho Chat AI & hồ sơ. Cùng ngôn ngữ nét với Icons.jsx (dùng chung <Svg>). */
import { Svg } from './Icons.jsx';

const duo = { fill: 'currentColor', fillOpacity: 0.14 };
const w = (size, strokeWidth = 1.9) => ({ size, strokeWidth });

export const IcoPlus = ({ size = 16 }) => (<Svg {...w(size, 2.1)}><path d="M12 5v14M5 12h14" /></Svg>);
export const IcoChevron = ({ size = 12 }) => (<Svg {...w(size, 2.3)}><path d="m9 6 6 6-6 6" /></Svg>);
export const IcoMenu = ({ size = 18 }) => (<Svg {...w(size, 2)}><path d="M4 7h16M4 12h11M4 17h16" /></Svg>);
export const IcoClose = ({ size = 18 }) => (<Svg {...w(size, 2.1)}><path d="M6 6l12 12M18 6 6 18" /></Svg>);
export const IcoCheck = ({ size = 14 }) => (<Svg {...w(size, 2.4)}><path d="m5 12.5 4.5 4.5L19 7.5" /></Svg>);
export const IcoSend = ({ size = 18 }) => (<Svg {...w(size, 2.3)}><path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" /></Svg>);

export const IcoChat = ({ size = 16 }) => (
  <Svg {...w(size)}>
    <path d="M20 15.5a2 2 0 0 1-2 2H8l-4.5 3.5V6a2 2 0 0 1 2-2H18a2 2 0 0 1 2 2z" {...duo} />
  </Svg>
);

export const IcoTrash = ({ size = 14 }) => (
  <Svg {...w(size)}>
    <path d="m6 7 .8 12a2 2 0 0 0 2 1.9h6.4a2 2 0 0 0 2-1.9L18 7z" {...duo} />
    <path d="M4 7h16M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7M10 11v6M14 11v6" />
  </Svg>
);

export const IcoImage = ({ size = 18 }) => (
  <Svg {...w(size)}>
    <rect x="3.5" y="4" width="17" height="16" rx="3" {...duo} />
    <circle cx="9" cy="9.5" r="1.6" />
    <path d="M20.5 15.5 15.5 10.5 6 20" />
  </Svg>
);

export const IcoBrain = ({ size = 14 }) => (
  <Svg {...w(size)}>
    <path d="M9.5 2A3.5 3.5 0 0 0 6 5.5V6a3 3 0 0 0-2 5.2A3 3 0 0 0 6 17v.5a3.5 3.5 0 0 0 6 2.3V2.7A3.5 3.5 0 0 0 9.5 2z" {...duo} />
    <path d="M14.5 2A3.5 3.5 0 0 1 18 5.5V6a3 3 0 0 1 2 5.2A3 3 0 0 1 18 17v.5a3.5 3.5 0 0 1-6 2.3V2.7A3.5 3.5 0 0 1 14.5 2z" {...duo} />
  </Svg>
);

export const IcoCopy = ({ size = 14 }) => (
  <Svg {...w(size)}>
    <rect x="9" y="9" width="11" height="11" rx="2.5" {...duo} />
    <path d="M15 9V6.5A2.5 2.5 0 0 0 12.5 4h-6A2.5 2.5 0 0 0 4 6.5v6A2.5 2.5 0 0 0 6.5 15H9" />
  </Svg>
);

export const IcoUser = ({ size = 16 }) => (
  <Svg {...w(size)}>
    <circle cx="12" cy="8" r="4" {...duo} />
    <path d="M4.5 20.5c.4-3.8 3.4-6 7.5-6s7.1 2.2 7.5 6" />
  </Svg>
);

export const IcoCrown = ({ size = 16 }) => (
  <Svg {...w(size)}>
    <path d="M3.5 8.5 8 12l4-6.5 4 6.5 4.5-3.5L18.8 18H5.2Z" {...duo} />
    <path d="M5.5 20.5h13" />
  </Svg>
);

export const IcoLogout = ({ size = 16 }) => (
  <Svg {...w(size)}>
    <path d="M9 21H5.5A2.5 2.5 0 0 1 3 18.5v-13A2.5 2.5 0 0 1 5.5 3H9" />
    <path d="m16 16.5 4.5-4.5L16 7.5M20.5 12H9" />
  </Svg>
);

export const IcoSettings = ({ size = 16 }) => (
  <Svg {...w(size)}>
    <circle cx="12" cy="12" r="3" {...duo} />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </Svg>
);

export const IcoSparkle = ({ size = 14 }) => (
  <Svg {...w(size, 1.2)} fill="currentColor">
    <path d="M12 3.3c.8 5.4 3.3 7.9 8.7 8.7-5.4.8-7.9 3.3-8.7 8.7-.8-5.4-3.3-7.9-8.7-8.7 5.4-.8 7.9-3.3 8.7-8.7Z" />
  </Svg>
);

export const IcoMail = ({ size = 14 }) => (
  <Svg {...w(size)}>
    <rect x="3" y="5" width="18" height="14" rx="3" {...duo} />
    <path d="m3.5 7.5 7.4 5.4a2 2 0 0 0 2.2 0l7.4-5.4" />
  </Svg>
);

export const IcoCamera = ({ size = 18 }) => (
  <Svg {...w(size)}>
    <path d="M21 18.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2.5l1.7-2.5h5.6L16.5 7H19a2 2 0 0 1 2 2z" {...duo} />
    <circle cx="12" cy="13" r="3.6" />
  </Svg>
);
export const IcoRefresh = ({ size = 14 }) => (
  <Svg {...w(size)}>
    <path d="M20.5 12a8.5 8.5 0 1 1-2.6-6.1" />
    <path d="M21 4v5h-5" />
  </Svg>
);

export const IcoStop = ({ size = 18 }) => (
  <Svg {...w(size, 2)} fill="currentColor">
    <rect x="6.5" y="6.5" width="11" height="11" rx="2.5" />
  </Svg>
);

export const IcoSearch = ({ size = 14 }) => (
  <Svg {...w(size)}>
    <circle cx="11" cy="11" r="6.5" {...duo} />
    <path d="m20 20-3.6-3.6" />
  </Svg>
);