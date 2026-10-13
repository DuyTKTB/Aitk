/* ============================================================
   BentoCard.jsx — Thẻ Bento cao cấp (HubSpot CRM Workspace)
   Props:
     - notch: boolean | ReactNode (mũi tên ↗ cắt vào góc trên-phải)
     - onNotchClick: function
     - tone: 'default' | 'lime' | 'glass' | 'dark' | 'outline'
     - interactive: boolean (hover float effect)
     - className, style, children, onClick
   ============================================================ */
import React from 'react';

const IcoArrowUpRight = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="7" y1="17" x2="17" y2="7" />
    <polyline points="7 7 17 7 17 17" />
  </svg>
);

export default function BentoCard({
  notch = false,
  onNotchClick,
  notchTitle = 'Xem chi tiết',
  tone = 'default',
  interactive = false,
  className = '',
  style = {},
  children,
  onClick,
  ...props
}) {
  const toneClass = tone !== 'default' ? `tone-${tone}` : '';
  const interClass = interactive || onClick ? 'interactive' : '';

  return (
    <article
      className={`t-bento-card ${toneClass} ${interClass} ${className}`.trim()}
      style={style}
      onClick={onClick}
      {...props}
    >
      {notch && (
        <button
          type="button"
          className="t-card-notch-btn"
          title={notchTitle}
          aria-label={notchTitle}
          onClick={(e) => {
            e.stopPropagation();
            if (onNotchClick) onNotchClick(e);
            else if (onClick) onClick(e);
          }}
        >
          {typeof notch === 'object' && React.isValidElement(notch) ? notch : <IcoArrowUpRight size={15} />}
        </button>
      )}
      {children}
    </article>
  );
}
