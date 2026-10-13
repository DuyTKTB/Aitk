/* ============================================================
   PillTabs.jsx — Điều khiển chuyển tab dạng viên thuốc capsule
   Props:
     - tabs: Array<{ key, label, count, icon, tone }>
     - active: string (key đang chọn)
     - onChange: (key) => void
     - tone: 'default' | 'lime'
   ============================================================ */
import React from 'react';

export default function PillTabs({
  tabs = [],
  active,
  onChange,
  tone = 'default',
  className = '',
  style = {},
}) {
  return (
    <div className={`t-pill-tabs ${className}`.trim()} role="tablist" style={style}>
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        const tabTone = tab.tone || tone;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`t-pill-tab ${isActive ? `active ${tabTone !== 'default' ? `tone-${tabTone}` : ''}` : ''}`}
            onClick={() => onChange?.(tab.key)}
          >
            {tab.icon && <span aria-hidden="true">{tab.icon}</span>}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '0.1rem 0.45rem',
                  borderRadius: 999,
                  background: isActive ? 'rgba(0,0,0,0.15)' : 'var(--t-surface-3)',
                  fontWeight: 700,
                  marginLeft: 2,
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
