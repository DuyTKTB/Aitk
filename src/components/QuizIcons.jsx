/* Bộ icon SVG nét đơn (stroke) cho Quiz — không dùng emoji */
const P = {
  spark: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4" /><path d="M12 8l1.8 2.7L16.5 12l-2.7 1.3L12 16l-1.8-2.7L7.5 12l2.7-1.3z" /></>,
  chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
  trophy: <><path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4v1a3 3 0 0 0 4 3M16 6h4v1a3 3 0 0 1-4 3M12 13v4M8 20h8M9.5 17h5" /></>,
  review: <><path d="M4 5h11a3 3 0 0 1 3 3v11H7a3 3 0 0 1-3-3zM8 9h6M8 13h4" /></>,
  down: <><path d="M12 4v11M7 11l5 5 5-5M5 20h14" /></>,
  up: <><path d="M12 16V5M7 9l5-5 5 5M5 20h14" /></>,
  bulb: <><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" /></>,
  skip: <><path d="M5 5l9 7-9 7zM18 5v14" /></>,
  half: <><circle cx="12" cy="12" r="8.5" /><path d="M12 3.5v17" /><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor" stroke="none" opacity=".35" /></>,
  cards: <><rect x="3" y="6" width="14" height="14" rx="2" /><path d="M7 3h12a2 2 0 0 1 2 2v12" /></>,
  keyboard: <><rect x="2.5" y="6" width="19" height="12" rx="2" /><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10" /></>,
  target: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" fill="currentColor" /></>,
  flame: <><path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 .3 1.2 1 2 2 2 0-3-.5-5 1-8z" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></>,
  bolt: <><path d="M13 2L4 14h7l-1 8 9-12h-7z" /></>,
  check: <><path d="M4.5 12.5l5 5 10-11" /></>,
  cross: <><path d="M6 6l12 12M18 6L6 18" /></>,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  star: <><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 16.9 6.6 19.9l1-6.1L3.2 9.5l6.1-.9z" /></>,
  medal: <><circle cx="12" cy="14" r="5.5" /><path d="M8.5 9.5L6 3h4l2 4 2-4h4l-2.5 6.5" /></>,
  rank: <><path d="M12 3l8 4v5c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V7z" /><path d="M9 12l2 2 4-4" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M8 3v4M16 3v4M3.5 10h17" /></>,
  sound: <><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" /></>,
  mute: <><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5zM16 10l5 4M21 10l-5 4" /></>,
  refresh: <><path d="M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5" /></>,
  arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
  play: <><path d="M7 4.5l13 7.5-13 7.5z" /></>,
  close: <><path d="M6 6l12 12M18 6L6 18" /></>,
  flip: <><path d="M4 8h13l-3-3M20 16H7l3 3" /></>,
  atom: <><circle cx="12" cy="12" r="1.6" fill="currentColor" /><ellipse cx="12" cy="12" rx="9.5" ry="4" /><ellipse cx="12" cy="12" rx="9.5" ry="4" transform="rotate(60 12 12)" /><ellipse cx="12" cy="12" rx="9.5" ry="4" transform="rotate(120 12 12)" /></>,
  scale: <><path d="M12 4v16M6 20h12M5 8h14M5 8l-2.5 6a3 3 0 0 0 5 0zM19 8l-2.5 6a3 3 0 0 0 5 0z" /></>,
  grid: <><rect x="4" y="4" width="7" height="7" rx="1" /><rect x="13" y="4" width="7" height="7" rx="1" /><rect x="4" y="13" width="7" height="7" rx="1" /><rect x="13" y="13" width="7" height="7" rx="1" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  trash: <><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" /></>,
  undo: <><path d="M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3" /></>,
  redo: <><path d="M15 14l5-5-5-5M20 9H10a6 6 0 0 0 0 12h3" /></>,
  image: <><rect x="3.5" y="4.5" width="17" height="15" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="M4 17l5-4 4 3 3-2 4 3" /></>,
  trend: <><path d="M3 17l6-6 4 4 8-9M15 6h6v6" /></>,
  save: <><path d="M5 4h11l3 3v13H5zM8 4v5h7V4M8 20v-6h8v6" /></>,
  file: <><path d="M6 3h8l4 4v14H6zM14 3v4h4M9 13h6M9 17h6" /></>,
  sliders: <><path d="M4 7h9M17 7h3M4 17h3M11 17h9" /><circle cx="15" cy="7" r="2" /><circle cx="9" cy="17" r="2" /></>,
  warn: <><path d="M12 4l9 16H3zM12 10v4M12 17h.01" /></>,
  calc: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" /></>,
  book: <><path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h10" /></>,
  copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M3 20a6 6 0 0 1 12 0M16 4.5a3.5 3.5 0 0 1 0 7M21 20a6 6 0 0 0-4-5.6" /></>,
  infinity: <><path d="M8 8c-2.2 0-4 1.8-4 4s1.8 4 4 4c3 0 5-8 8-8 2.2 0 4 1.8 4 4s-1.8 4-4 4c-3 0-5-8-8-8z" /></>,
};

export function Ico({ n, size = 18, className = '', strokeWidth = 1.8 }) {
  return (
    <svg
      className={'qz-ico ' + className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {P[n] || P.star}
    </svg>
  );
}

/* Chọn icon SVG cho thành tích dựa trên id/tiêu đề (không phụ thuộc emoji trong achievements.js) */
export function achIconName(a) {
  const s = `${a.id} ${a.title}`.toLowerCase();
  if (/streak|chuỗi|ngày|day/.test(s)) return 'flame';
  if (/time|nhanh|speed|giây|attack/.test(s)) return 'bolt';
  if (/master|thành thạo|thanh thao/.test(s)) return 'star';
  if (/daily|hằng|hang/.test(s)) return 'calendar';
  if (/correct|đúng|dung|câu|first|đầu/.test(s)) return 'check';
  if (/level|cấp/.test(s)) return 'rank';
  return 'medal';
}

export function AchIcon({ a, locked, size = 20 }) {
  return <Ico n={locked ? 'lock' : achIconName(a)} size={size} />;
}