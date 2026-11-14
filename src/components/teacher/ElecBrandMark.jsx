import React, { useId, useState } from 'react';

const ELEC_MOOD_FILES = {
  default: '/img/elec/elec-default.png',
  happy: '/img/elec/elec-happy.png',
  think: '/img/elec/elec-think.png',
  wink: '/img/elec/elec-wink.png',
  hello: '/img/elec/elec-hello.png',
  cool: '/img/elec/elec-cool.png',
  celebrate: '/img/elec/elec-celebrate.png',
  fighting: '/img/elec/elec-fighting.png',
  suspicious: '/img/elec/elec-suspicious.png',
  love: '/img/elec/elec-love.png',
  'super-saiyan': '/img/elec/elec-super-saiyan.png',
};

export const ELEC_BRAND_LOGOMARK_SRC = '/img/logo.png';

/**
 * Signature ELEC AI Logomark (/img/logo.png) framed in a crisp circular white
 * medallion so it renders faithfully across Light & Dark themes and solid badges,
 * with a pure vector SVG fallback if the static image is unavailable.
 */
export function ElecFlaskBrandSvg({
  size = 20,
  variant = 'gradient',
  className = '',
  style,
}) {
  const uid = useId().replace(/:/g, '');
  const [imgErr, setImgErr] = useState(false);

  const isMono = variant === 'current';
  const isColoredBg = variant === 'white' || variant === 'duo';

  if (imgErr) {
    const gradId = `elec-lm-fb-${uid}`;
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 36 36"
        fill="none"
        className={className}
        style={style}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradId} x1="6" y1="6" x2="30" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
        </defs>
        <path
          d="M17.5 27.4C13.8 24.8 9.2 23.2 4.6 22.6L4.4 27.6C10.2 29.4 14.0 30.8 17.5 32.6ZM18.5 27.4C22.2 24.8 26.8 23.2 31.4 22.6L31.6 27.6C25.8 29.4 22.0 30.8 18.5 32.6Z"
          fill={isMono ? 'currentColor' : isColoredBg ? '#ffffff' : `url(#${gradId})`}
          fillOpacity={isMono ? 0.35 : 0.85}
        />
        <path
          d="M14.1 4.4H21.9M15.4 4.4V11.4L9.8 22.2C9.1 23.6 9.8 25.0 11.6 25.1H24.4C26.2 25.0 26.9 23.6 26.2 22.2L20.6 11.4V4.4"
          stroke={isMono ? 'currentColor' : isColoredBg ? '#ffffff' : `url(#${gradId})`}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <ellipse cx="18" cy="14.2" rx="14.2" ry="5.2" transform="rotate(-30 18 14.2)" stroke={isMono ? 'currentColor' : isColoredBg ? '#bae6fd' : '#38bdf8'} strokeWidth="1.2" />
        <ellipse cx="18" cy="14.2" rx="14.2" ry="5.2" transform="rotate(30 18 14.2)" stroke={isMono ? 'currentColor' : isColoredBg ? '#bae6fd' : '#38bdf8'} strokeWidth="1.2" />
      </svg>
    );
  }

  return (
    <span
      className={className ? `elec-logomark-seal ${className}` : 'elec-logomark-seal'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: '999px',
        background: '#ffffff',
        overflow: 'hidden',
        flexShrink: 0,
        verticalAlign: 'middle',
        boxShadow: isColoredBg
          ? '0 1px 3px rgba(15, 23, 42, 0.22)'
          : isMono
            ? '0 0 0 1px rgba(148, 163, 184, 0.22)'
            : 'none',
        ...style,
      }}
      aria-hidden="true"
    >
      <img
        src={ELEC_BRAND_LOGOMARK_SRC}
        alt=""
        draggable={false}
        onError={() => setImgErr(true)}
        style={{
          width: '90%',
          height: '90%',
          objectFit: 'contain',
          display: 'block',
          transform: 'translateY(1.5%)',
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      />
    </span>
  );
}

export const ElecLogoMarkSvg = ElecFlaskBrandSvg;

/**
 * Renders official ELEC AI character mascot PNGs from /img/elec with safe default fallback.
 */
export function ElecMascot({
  mood = 'hello',
  size = 64,
  alt,
  className = '',
  style,
}) {
  const [fallback, setFallback] = useState(false);
  const src = fallback ? ELEC_MOOD_FILES.default : (ELEC_MOOD_FILES[mood] || ELEC_MOOD_FILES.default);

  return (
    <img
      src={src}
      alt={alt || `ELEC Mascot (${mood})`}
      width={size}
      height={size}
      draggable={false}
      className={className}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        userSelect: 'none',
        pointerEvents: 'none',
        flexShrink: 0,
        ...style,
      }}
      onError={() => {
        if (!fallback) setFallback(true);
      }}
    />
  );
}

const SUBJECT_ALIASES = [
  [/^(toan|toan hoc|math|mathematics)$/i, 'Toán học'],
  [/^(hoa|hoa hoc|chem|chemistry)$/i, 'Hóa học'],
  [/^(ly|vat ly|vat li|physics)$/i, 'Vật lý'],
  [/^(sinh|sinh hoc|biology)$/i, 'Sinh học'],
  [/^(khtn|khoa hoc tu nhien)$/i, 'Khoa học tự nhiên'],
  [/^(van|ngu van|literature)$/i, 'Ngữ văn'],
  [/^(anh|tieng anh|english)$/i, 'Tiếng Anh'],
  [/^(su|lich su|history)$/i, 'Lịch sử'],
  [/^(dia|dia ly|dia li|geography)$/i, 'Địa lý'],
  [/^(tin|tin hoc|it|informatics)$/i, 'Tin học'],
  [/^(gdcd|giao duc cong dan)$/i, 'GDCD'],
  [/^(ktpl|gdktpl|gdkt&pl|giao duc kinh te va phap luat)$/i, 'GDKT&PL'],
  [/^(cong nghe)$/i, 'Công nghệ'],
];

function stripVietnameseDiacritics(input) {
  return String(input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Canonicalizes Vietnamese subject labels so abbreviations ("Hóa", "Vật lí", "KHTN")
 * aggregate accurately across teacher profile, exams, and subject classes.
 */
export function normalizeSubjectName(raw) {
  const trimmed = String(raw || '').replace(/\s+/g, ' ').trim();
  if (!trimmed) return '';
  const ascii = stripVietnameseDiacritics(trimmed)
    .replace(/^mon\s+/i, '')
    .trim();
  for (const [pattern, canonical] of SUBJECT_ALIASES) {
    if (pattern.test(ascii)) return canonical;
  }
  return trimmed;
}

export function subjectsMatch(a, b) {
  const na = normalizeSubjectName(a);
  const nb = normalizeSubjectName(b);
  if (!na || !nb) return false;
  return na.toLowerCase() === nb.toLowerCase();
}

/**
 * Deduplicates unique student entries across multiple classes (GVCN + linked GVBM classes).
 */
export function countUniqueStudentsInClasses(classList = []) {
  const uniqueKeys = new Set();
  let fallbackTotal = 0;
  for (const cls of classList) {
    if (!cls) continue;
    const members = Array.isArray(cls.members) ? cls.members : [];
    if (members.length > 0) {
      members.forEach((m, idx) => {
        const key = m?.uid || m?.userId || m?.email || `${cls.id || 'c'}-${m?.name || idx}`;
        uniqueKeys.add(String(key));
      });
    } else if (Number.isFinite(Number(cls.studentCount))) {
      fallbackTotal += Math.max(0, Number(cls.studentCount));
    }
  }
  return uniqueKeys.size > 0 ? uniqueKeys.size : fallbackTotal;
}
