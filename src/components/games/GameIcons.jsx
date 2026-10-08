/* ============================================================
   GameIcons — bộ icon SVG dùng chung cho các game (thay emoji)
   Dùng:  <GIcon name="freeze" />   (cỡ theo font-size xung quanh)
          <GIcon name="trophy" size={24} title="Chiến thắng" />
   Kiểu nét: stroke 1.8, bo tròn — cùng phong cách icon ở GameHub.
   ============================================================ */

const P = {
  /* vật phẩm & trạng thái */
  freeze:  <><path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5L4.2 16.5"/><path d="M9.5 4.5L12 7l2.5-2.5M9.5 19.5L12 17l2.5 2.5"/></>,
  slow:    <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  shield:  <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>,
  star:    <path d="M12 3l2.7 5.8 6.3.7-4.7 4.3 1.3 6.2L12 17l-5.6 3 1.3-6.2L3 9.5l6.3-.7z"/>,
  wind:    <path d="M3 8h11a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h8"/>,
  hourglass: <path d="M7 3h10M7 21h10M8 3c0 5 4 5 4 9s-4 4-4 9M16 3c0 5-4 5-4 9s4 4 4 9"/>,
  timer:   <><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/></>,
  perfect: <><circle cx="12" cy="9" r="6"/><path d="M9 9l2 2 4-4M8.5 14.5L7 21l5-2.5 5 2.5-1.5-6.5"/></>,
  fire:    <path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z"/>,
  bolt:    <path d="M13 2L4 14h7l-1 8 9-12h-7z"/>,
  target:  <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></>,
  sword:   <path d="M14.5 3.5l6 6-11 11-6-6zM3 21l3-3M14 7l3 3"/>,
  heart:   <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>,
  plus:    <path d="M12 5v14M5 12h14"/>,
  check:   <path d="M5 12l5 5 9-10"/>,
  cross:   <path d="M6 6l12 12M18 6L6 18"/>,
  trophy:  <><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/></>,
  sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>,
  bulb:    <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z"/>,
  pencil:  <path d="M4 20l4-1 11-11-3-3L5 16zM14 6l3 3"/>,
  warning: <path d="M12 3l10 18H2zM12 10v5M12 18h.01"/>,
  /* người chơi */
  user:    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/>,
  users:   <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>,
  robot:   <><rect x="5" y="8" width="14" height="10" rx="2"/><path d="M12 8V4M9 20v-2M15 20v-2"/><circle cx="9.5" cy="13" r="1" fill="currentColor"/><circle cx="14.5" cy="13" r="1" fill="currentColor"/></>,
  chart:   <path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>,
  /* phòng thí nghiệm */
  flask:   <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9V3"/>,
  beaker:  <path d="M6 3h12M7 3l1 17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-17"/>,
  tube:    <path d="M9 3h6M10 3v14a2 2 0 0 0 4 0V3"/>,
  stir:    <path d="M12 3a3 3 0 0 0-3 3c0 2 1.5 3 3 3s3-1 3-3a3 3 0 0 0-3-3zM12 9v12"/>,
  trash:   <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>,
  goggles: <path d="M3 10h18v5a3 3 0 0 1-3 3h-3l-1.5-2h-3L9 18H6a3 3 0 0 1-3-3zM8 10V8M16 10V8"/>,
  drop:    <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>,
  cloud:   <path d="M7 18a4 4 0 0 1-.5-8A6 6 0 0 1 18 11a3.5 3.5 0 0 1-.5 7z"/>,
  solid:   <path d="M12 3l7 9-7 9-7-9z"/>,
  /* điều khiển */
  pause:   <path d="M8 5v14M16 5v14"/>,
  play:    <path d="M7 4l13 8-13 8z"/>,
  volume:  <path d="M4 9v6h4l5 4V5L8 9zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>,
  volumeOff: <path d="M4 9v6h4l5 4V5L8 9zM17 9l5 6M22 9l-5 6"/>,
  expand:  <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>,
  shrink:  <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>,
};

export const ICON_NAMES = Object.keys(P);

export function GIcon({ name, size = '1em', title, className = '' }) {
  const body = P[name];
  if (!body) return null;
  return (
    <svg
      className={('gx-icon ' + className).trim()}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : 'true'}
      aria-label={title}
    >
      {body}
    </svg>
  );
}

export default GIcon;
