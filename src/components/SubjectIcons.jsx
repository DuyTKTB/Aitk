
const Svg = ({ size = 22, children }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);
export const IconMath = (p) => (
  <Svg {...p}>
    <path d="M12 21L5 5" />
    <path d="M12 21L19 5" />
    <circle cx="12" cy="4" r="1.6" />
    <path d="M7.5 15h9" />
    <path d="M9 11h6" />
  </Svg>
);
export const IconLiterature = (p) => (
  <Svg {...p}>
    <path d="M3 5a2 2 0 0 1 2-2h6v18H5a2 2 0 0 1-2-2z" />
    <path d="M21 5a2 2 0 0 0-2-2h-6v18h6a2 2 0 0 0 2-2z" />
    <path d="M7 8h2M15 8h2" />
  </Svg>
);
export const IconEnglish = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
  </Svg>
);
export const IconPhysics = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="1.8" fill="currentColor" />
    <ellipse cx="12" cy="12" rx="9" ry="3.8" />
    <ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(60 12 12)" />
    <ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(120 12 12)" />
  </Svg>
);
export const IconChemistry = (p) => (
  <Svg {...p}>
    <path d="M9 3h6" />
    <path d="M10 3v6L4.5 19a2 2 0 0 0 1.8 3h11.4a2 2 0 0 0 1.8-3L14 9V3" />
    <path d="M7.5 15h9" />
    <circle cx="10.5" cy="17.5" r=".6" fill="currentColor" />
    <circle cx="14" cy="18" r=".5" fill="currentColor" />
  </Svg>
);
export const IconBiology = (p) => (
  <Svg {...p}>
    <path d="M8 4c4 2 6 6 6 10a6 6 0 0 1-6 6" />
    <path d="M16 4c-4 2-6 6-6 10a6 6 0 0 0 6 6" />
    <path d="M9 8h6M9 12h6M9 16h6" />
  </Svg>
);
export const IconHistory = (p) => (
  <Svg {...p}>
    <path d="M3 10L12 4l9 6" />
    <path d="M5 10v9M9 10v9M15 10v9M19 10v9" />
    <path d="M3 19h18" />
    <path d="M10 19v-4h4v4" />
  </Svg>
);
export const IconGeography = (p) => (
  <Svg {...p}>
    <path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" />
    <path d="M9 4v14M15 6v14" />
  </Svg>
);
export const IconInformatics = (p) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="13" rx="2" />
    <path d="M8 21h8M12 17v4" />
    <path d="M8 9l-2 2 2 2M16 9l2 2-2 2M13 8l-2 8" />
  </Svg>
);
export const IconTech = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4l1.4-1.4M17 7l1.4-1.4" />
  </Svg>
);
export const IconShield = (p) => (
  <Svg {...p}>
    <path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" />
    <path d="M9 12l2 2 4-4" />
  </Svg>
);
export const IconCompass = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M15.5 8.5L13 13l-4.5 2.5L11 11z" fill="currentColor" fillOpacity=".15" />
    <path d="M15.5 8.5L13 13l-4.5 2.5L11 11z" />
  </Svg>
);
export const IconDefault = ({ size, grade }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <text
      x="12"
      y="16.5"
      textAnchor="middle"
      fontFamily="var(--sans, system-ui)"
      fontSize={grade && grade.length > 1 ? 10 : 13}
      fontWeight="700"
      fill="currentColor"
    >
      {grade || '10'}
    </text>
  </svg>
);
const SUBJECT_MAP = {
  toan: IconMath,
  van: IconLiterature,
  anh: IconEnglish,
  ly: IconPhysics,
  hoa: IconChemistry,
  sinh: IconBiology,
  su: IconHistory,
  dia: IconGeography,
  tin: IconInformatics,
  cn: IconTech,
  gdqp: IconShield,
  hdtn: IconCompass,
  ktpl: IconShield,
};
export const SUBJECT_COLOR = {
  toan: '#f3e27a',      // vàng
  van: '#f2b6c6',       // hồng
  anh: '#a7c4f2',       // xanh dương nhạt
  ly: '#8fd6c4',        // xanh ngọc
  hoa: '#b7dc9a',       // xanh lá
  sinh: '#e6b3e0',      // hồng tím
  su: '#c9c5b8',        // nâu xám
  dia: '#ffc46b',       // vàng cam
  tin: '#c1b4f0',       // tím
  cn: '#ffc46b',        // vàng cam
  gdqp: '#c9c5b8',      // nâu xám
  hdtn: '#e6b3e0',      // hồng tím
  ktpl: '#ff9b85',      // cam đỏ
};
export function SubjectIcon({ subject, grade, size = 22 }) {
  const Comp = SUBJECT_MAP[subject];
  if (!Comp) return <IconDefault size={size} grade={grade} />;
  return <Comp size={size} />;
}

export function subjectColor(subject) {
  return SUBJECT_COLOR[subject] || 'var(--acc)';
}