// Bộ icon SVG dùng chung (stroke 1.8, màu theo currentColor)
const P = {
  back: <path d="M19 12H5M12 19l-7-7 7-7" />,
  arrowRight: <path d="M5 12h14M12 5l7 7-7 7" />,
  close: <path d="M18 6L6 18M6 6l12 12" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  send: <path d="M12 19V5M5 12l7-7 7 7" />,
  star: <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5z" />,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></>,
  dice: <><rect x="4" y="4" width="16" height="16" rx="4.5" /><circle cx="9" cy="9" r="1.1" fill="currentColor" stroke="none" /><circle cx="15" cy="15" r="1.1" fill="currentColor" stroke="none" /><circle cx="15" cy="9" r="1.1" fill="currentColor" stroke="none" /><circle cx="9" cy="15" r="1.1" fill="currentColor" stroke="none" /></>,
  sparkle: <><path d="M10.5 4l1.8 5 5 1.8-5 1.8-1.8 5-1.8-5-5-1.8 5-1.8 1.8-5z" /><path d="M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8z" /></>,
  atom: <><ellipse cx="12" cy="12" rx="10" ry="4" /><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" /><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" /><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" /></>,
  plusminus: <path d="M12 3.5v8M8 7.5h8M8 18.5h8" />,
  flask: <><path d="M9 3h6M10 3v6l-5.6 9.4A2 2 0 0 0 6.1 21.5h11.8a2 2 0 0 0 1.7-3.1L14 9V3" /><path d="M7.6 15h8.8" /></>,
  bulb: <><path d="M9.5 18h5M10.5 21h3" /><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.2h5c0-.9.4-1.7 1.1-2.2A6 6 0 0 0 12 3z" /></>,
  trend: <path d="M3 17l6-6 4 4 8-8M15 7h6v6" />,
  scale: <><path d="M12 3v18M8 21h8M5 7h14" /><path d="M5 7l-3 7a3.5 3.5 0 0 0 6 0L5 7zM19 7l-3 7a3.5 3.5 0 0 0 6 0l-3-7z" /></>,
  link: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>,
  cap: <><path d="M2 9l10-5 10 5-10 5L2 9z" /><path d="M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5M22 9v6" /></>,
};

export default function Icon({ name, size = 18, fill = false, className = '', ...rest }) {
  return (
    <svg
      className={('ic ' + className).trim()} width={size} height={size} viewBox="0 0 24 24"
      fill={fill ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...rest}
    >
      {P[name]}
    </svg>
  );
}
