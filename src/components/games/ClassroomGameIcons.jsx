import React from 'react';

/* ============================================================
   ClassroomGameIcons — Bộ SVG Vector sắc nét chuẩn Apple HIG
   Không dùng bất kỳ ký tự emoji nào.
   ============================================================ */

export const SvgTrophy = ({ size = 24, color = '#f59e0b' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.45 1-1 1H8v4h8v-4h-1c-.55 0-1-.45-1-1v-2.34" />
    <path d="M18 4H6v7a6 6 0 0 0 12 0V4z" fill={color} fillOpacity="0.15" />
  </svg>
);

export const SvgFlag = ({ size = 20, color = '#ef4444' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <line x1="4" y1="22" x2="4" y2="15" stroke="currentColor" strokeWidth="2" />
  </svg>
);

export const SvgTimer = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <polyline points="12 6 12 12 16 14" />
    <path d="M12 2v2" />
  </svg>
);

export const SvgLightbulb = ({ size = 20, color = '#eab308' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18h6" />
    <path d="M10 22h4" />
    <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5.76.76 1.23 1.52 1.41 2.5" />
  </svg>
);

export const SvgPullRope = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="5" r="3" />
    <path d="M3 21l3-7 4 2 2-4" />
    <circle cx="18" cy="5" r="3" />
    <path d="M21 21l-3-7-4 2-2-4" />
    <path d="M2 13h20" stroke="#f59e0b" strokeWidth="3" />
  </svg>
);

export const SvgWheelPin = ({ size = 24, color = '#ef4444' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="#ffffff" strokeWidth="1.5">
    <polygon points="12 22 6 8 18 8" />
    <circle cx="12" cy="7" r="4" fill="#ffffff" />
  </svg>
);

export const SvgGift = ({ size = 20, color = '#f59e0b' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 12 20 22 4 22 4 12" />
    <rect x="2" y="7" width="20" height="5" />
    <line x1="12" y1="22" x2="12" y2="7" />
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
  </svg>
);

export const SvgQuestion = ({ size = 20, color = '#8b5cf6' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="3" />
  </svg>
);

export const SvgDouble = ({ size = 20, color = '#ec4899' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill={color} fillOpacity="0.2" />
  </svg>
);

export const SvgSkull = ({ size = 20, color = '#ef4444' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="12" r="1.5" fill={color} />
    <circle cx="15" cy="12" r="1.5" fill={color} />
    <path d="M8 20v-2h8v2" />
    <path d="M12 2a9 9 0 0 0-9 9c0 3.2 1.7 6 4.3 7.5L8 20h8l.7-1.5C19.3 17 21 14.2 21 11a9 9 0 0 0-9-9z" />
  </svg>
);

export const SvgKey = ({ size = 20, color = '#f59e0b' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-1.5 1.5L14 9l-1.5-1.5L11 9l-1.5-1.5L8 9" />
    <circle cx="7.5" cy="15.5" r="5.5" />
  </svg>
);

export const SvgRaceCar = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 15h18l-2-5H5l-2 5z" fill={color} fillOpacity="0.25" />
    <circle cx="7" cy="17" r="2.5" fill="#1e293b" />
    <circle cx="17" cy="17" r="2.5" fill="#1e293b" />
    <path d="M19 12h2a2 2 0 0 1 2 2v1h-3" />
    <path d="M5 12H3a2 2 0 0 0-2 2v1h3" />
  </svg>
);

export const SvgNitro = ({ size = 20, color = '#f97316' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="#ef4444" strokeWidth="1.5">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);

export const SvgRobot = ({ size = 20, color = '#38bdf8' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2" />
    <circle cx="12" cy="5" r="2" />
    <path d="M12 7v4" />
    <line x1="8" y1="16" x2="8.01" y2="16" strokeWidth="3" />
    <line x1="16" y1="16" x2="16.01" y2="16" strokeWidth="3" />
  </svg>
);

export const SvgAudience = ({ size = 20, color = '#10b981' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export const SvgPuzzlePiece = ({ size = 24, color = '#8b5cf6' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19.439 7.85c0-1.57.802-2.54 1.561-2.54V4a2 2 0 0 0-2-2h-1.31c0 .76-.97 1.56-2.54 1.56-1.57 0-2.54-.8-2.54-1.56H11a2 2 0 0 0-2 2v1.31c.76 0 1.56.97 1.56 2.54 0 1.57-.8 2.54-1.56 2.54H4a2 2 0 0 0-2 2v1.31c.76 0 1.56.97 1.56 2.54 0 1.57-.8 2.54-1.56 2.54V20a2 2 0 0 0 2 2h1.31c0-.76.97-1.56 2.54-1.56 1.57 0 2.54.8 2.54 1.56H13a2 2 0 0 0 2-2v-1.31c-.76 0-1.56-.97-1.56-2.54 0-1.57.8-2.54 1.56-2.54H20a2 2 0 0 0 2-2v-1.31c-.76 0-1.56-.97-1.56-2.54z" />
  </svg>
);
