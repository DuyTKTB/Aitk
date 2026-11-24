/* ============================================================
   OceanGlassIconDefs.jsx — Hệ thống SVG Gradient & Filter Thuỷ Tinh Xanh Biển
   Phong cách Jiggicons Glass (Frosted Translucent Ocean Blue) áp dụng toàn trang.
   ============================================================ */

export default function OceanGlassIconDefs() {
  return (
    <svg
      width="0"
      height="0"
      aria-hidden="true"
      focusable="false"
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', pointerEvents: 'none' }}
    >
      <defs>
        {/* 1. Lớp nền thuỷ tinh trong suốt xanh biển (Frosted Ocean Glass Fill) */}
        <linearGradient id="elec-ocean-glass-fill" x1="12%" y1="6%" x2="88%" y2="94%">
          <stop offset="0%" stopColor="#BAE6FD" stopOpacity="0.88" />
          <stop offset="45%" stopColor="#38BDF8" stopOpacity="0.56" />
          <stop offset="100%" stopColor="#0284C7" stopOpacity="0.78" />
        </linearGradient>

        {/* 2. Viền thuỷ tinh bắt sáng (Specular Ocean Stroke) */}
        <linearGradient id="elec-ocean-glass-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7DD3FC" />
          <stop offset="42%" stopColor="#0EA5E9" />
          <stop offset="100%" stopColor="#0369A1" />
        </linearGradient>

        {/* 3. Chấm sáng nổi khối (Ocean Pearl Dot) */}
        <linearGradient id="elec-ocean-glass-dot" x1="15%" y1="10%" x2="85%" y2="90%">
          <stop offset="0%" stopColor="#E0F2FE" />
          <stop offset="55%" stopColor="#0EA5E9" />
          <stop offset="100%" stopColor="#075985" />
        </linearGradient>

        {/* 4. Phiên bản thuỷ tinh trắng-xanh cho icon nằm trên nền xanh đậm/button active */}
        <linearGradient id="elec-ocean-glass-on-dark-fill" x1="10%" y1="8%" x2="90%" y2="92%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.72" />
          <stop offset="55%" stopColor="#BAE6FD" stopOpacity="0.44" />
          <stop offset="100%" stopColor="#7DD3FC" stopOpacity="0.65" />
        </linearGradient>

        <linearGradient id="elec-ocean-glass-on-dark-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#E0F2FE" />
          <stop offset="100%" stopColor="#BAE6FD" />
        </linearGradient>

        {/* 5. Bộ lọc ánh sáng thuỷ tinh 3D mềm (Soft Ocean Glass Depth) */}
        <filter id="elec-ocean-glass-shadow" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="1.4" stdDeviation="1.4" floodColor="#0284C7" floodOpacity="0.32" />
        </filter>
      </defs>
    </svg>
  );
}
