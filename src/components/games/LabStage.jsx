/* ============================================================
   LabStage — SVG bàn thí nghiệm LabXchange-style
   - Nhiều dụng cụ (cốc/bình/ống) cùng lúc trên bàn
   - Mỗi dụng cụ có: chất lỏng đổi màu theo pH, sóng nước,
     bong bóng, kết tủa, đèn cồn riêng, nhãn tên
   - ViewBox 900×560, tọa độ tính tay khớp nhau
   - Không cần import engine — nhận props từ LabTool → render
   ============================================================ */
import { useMemo } from 'react';
import { CHEMICALS } from '../../data/reactions';
import { analyzePH, INDICATORS } from '../../lib/labEngine';

/* ---------- ĐỊNH NGHĨA HÌNH DÁNG DỤNG CỤ ----------
   Mỗi vessel có:
   - label     : tên hiển thị
   - w, h      : kích thước ngoài (để đặt vị trí)
   - outline   : path viền ngoài
   - inner     : path dùng cho clip (lòng chứa)
   - bounds    : { x0, x1, yTop, yBottom } — vùng lòng
   - centerX   : tâm để đặt đèn cồn / đũa khuấy
   - markLine  : có vạch chia độ không
*/
export const VESSEL_SHAPES = {
  beaker: {
    label: 'Cốc',
    w: 120, h: 160,
    outline: 'M 10 20 L 10 140 Q 10 155 25 155 L 95 155 Q 110 155 110 140 L 110 20',
    inner: 'M 14 24 L 14 138 Q 14 151 27 151 L 93 151 Q 106 151 106 138 L 106 24',
    bounds: { x0: 18, x1: 102, yTop: 24, yBottom: 148 },
    centerX: 60,
    markLine: true,
    capacity: 6,
  },
  flask: {
    label: 'Bình tam giác',
    w: 140, h: 175,
    outline: 'M 55 10 L 55 70 L 15 145 Q 10 165 35 165 L 105 165 Q 130 165 125 145 L 85 70 L 85 10',
    inner: 'M 59 14 L 59 70 L 19 145 Q 15 161 37 161 L 103 161 Q 125 161 121 145 L 81 70 L 81 14',
    bounds: { x0: 24, x1: 116, yTop: 14, yBottom: 158 },
    centerX: 70,
    markLine: false,
    capacity: 5,
  },
  tube: {
    label: 'Ống nghiệm',
    w: 70, h: 180,
    outline: 'M 20 10 L 20 155 Q 20 175 40 175 Q 60 175 60 155 L 60 10',
    inner: 'M 23 13 L 23 155 Q 23 172 40 172 Q 57 172 57 155 L 57 13',
    bounds: { x0: 27, x1: 53, yTop: 13, yBottom: 168 },
    centerX: 40,
    markLine: false,
    capacity: 3,
  },
};

/* ---------- Trộn màu dung dịch ---------- */
function mixColor(contents) {
  const liquids = Object.entries(contents).filter(([k]) => {
    const c = CHEMICALS[k];
    return c && (c.state === 'liquid' || c.type === 'acid' || c.type === 'base' || c.type === 'indicator');
  });
  const total = liquids.reduce((s, [, v]) => s + v, 0);
  if (!total) return null;

  let r = 0, g = 0, b = 0;
  liquids.forEach(([k, v]) => {
    const hex = CHEMICALS[k].color.replace('#', '');
    const n = parseInt(hex, 16);
    r += ((n >> 16) & 255) * v;
    g += ((n >> 8) & 255) * v;
    b += (n & 255) * v;
  });
  r /= total; g /= total; b /= total;
  return { r, g, b };
}

/* Áp dụng chỉ thị màu lên màu nền */
function applyIndicators({ r, g, b }, contents, ph) {
  if (contents.PP > 0) {
    const c = INDICATORS.PP.color(ph);
    if (c) {
      const hex = c.replace('#', '');
      const n = parseInt(hex, 16);
      return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
    }
  }
  if (contents.Quy > 0) {
    const c = INDICATORS.Quy.color(ph);
    if (c) {
      const hex = c.replace('#', '');
      const n = parseInt(hex, 16);
      return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
    }
  }
  return { r, g, b };
}

/* ---------- 1 DỤNG CỤ TRÊN BÀN ---------- */
function Vessel({
  id,
  type,
  x, y,
  contents = {},
  heat = false,
  stir = false,
  temp = 25,
  fx = null,
  pour = null,
  label,
  selected,
  onSelect,
  onRemove,
}) {
  const shape = VESSEL_SHAPES[type];
  if (!shape) return null;

  const { x0, x1, yTop, yBottom, centerX } = shape.bounds;
  const totalUnits = Object.values(contents).reduce((s, v) => s + v, 0);
  const fillRatio = Math.min(1, totalUnits / shape.capacity);

  const ph = useMemo(() => analyzePH(contents).ph, [contents]);
  const rawColor = useMemo(() => mixColor(contents), [contents]);
  const liquidColor = useMemo(() => {
    if (!rawColor) return null;
    const c = applyIndicators(rawColor, contents, ph);
    return `rgb(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)})`;
  }, [rawColor, contents, ph]);

  const maxFill = (yBottom - yTop) * 0.85;
  const liquidTop = yBottom - maxFill * fillRatio;

  const boiling = heat && temp >= 95 && totalUnits > 0;
  const bubbleCount =
    fx?.kind === 'bubble' ? Math.min(20, (fx.intensity || 3) * 4) :
    boiling ? 8 : 0;

  const solids = Object.entries(contents).filter(([k]) => {
    const c = CHEMICALS[k];
    if (!c) return false;
    if (c.state === 'solid') return true;
    return ['AgCl', 'BaSO4', 'PbI2', 'CuOH2', 'FeOH3', 'MgOH2'].includes(k);
  });

  const precipitating = fx?.kind === 'precip' || fx?.kind === 'precipitate';
  const precipColor = fx?.color || '#ffffff';
  const steaming = (heat && temp > 60) || fx?.steam;
  const burnerX = centerX;
  const burnerY = shape.h - 25;

  const clipId = `lk-clip-${id}`;

  return (
    <g transform={`translate(${x} ${y})`} onClick={onSelect} style={{ cursor: 'pointer' }}>
      {/* Vùng chọn (bắt click) */}
      <rect
        x={0} y={0}
        width={shape.w} height={shape.h + 40}
        fill="transparent"
        style={{ pointerEvents: 'all' }}
      />

      {/* Highlight khi được chọn */}
      {selected && (
        <rect
          x={-6} y={-6}
          width={shape.w + 12} height={shape.h + 52}
          rx="14"
          fill="none"
          stroke="var(--acc)"
          strokeWidth="2.5"
          strokeDasharray="6 4"
          opacity=".7"
        />
      )}

      <defs>
        <clipPath id={clipId}>
          <path d={shape.inner + ' Z'} />
        </clipPath>
        <linearGradient id={`glass-${id}`} x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".55" />
          <stop offset=".35" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#fff" stopOpacity=".25" />
        </linearGradient>
      </defs>

      {/* ===== ĐÈN CỒN ===== */}
      <g transform={`translate(${burnerX} 0)`}>
        {/* Thân đèn */}
        <rect x={-20} y={shape.h + 15} width="40" height="18" rx="5" fill="#c9ccd1" stroke="var(--ink)" strokeWidth="2" />
        {/* Cổ */}
        <rect x={-7} y={shape.h - 3} width="14" height="22" fill="#9aa4ad" stroke="var(--ink)" strokeWidth="2" />
        {/* Ngọn lửa */}
        {heat && (
          <g className="lk-flame">
            <path
              d={`M 0 ${shape.h - 3} C -18 ${shape.h - 20} -12 ${shape.h - 38} 0 ${shape.h - 55} C 12 ${shape.h - 38} 18 ${shape.h - 20} 0 ${shape.h - 3} Z`}
              fill="#ff7a1a"
              opacity=".93"
            />
            <path
              d={`M 0 ${shape.h - 3} C -9 ${shape.h - 15} -6 ${shape.h - 28} 0 ${shape.h - 42} C 6 ${shape.h - 28} 9 ${shape.h - 15} 0 ${shape.h - 3} Z`}
              fill="#4aa3ff"
            />
          </g>
        )}
      </g>

      {/* ===== LÒNG DỤNG CỤ ===== */}
      <g clipPath={`url(#${clipId})`}>
        {/* Chất lỏng */}
        {liquidColor && fillRatio > 0 && (
          <>
            <rect
              x={x0 - 20}
              y={liquidTop}
              width={x1 - x0 + 40}
              height={yBottom - liquidTop + 30}
              fill={liquidColor}
              opacity=".82"
            />
            {/* Sóng mặt thoáng */}
            <rect
              x={x0 - 20}
              y={liquidTop}
              width={x1 - x0 + 40}
              height="3"
              fill="#fff"
              opacity=".5"
              className="lk-wave"
            />
          </>
        )}

        {/* Hạt rắn / kết tủa */}
        {solids.flatMap(([k, v]) =>
          Array.from({ length: Math.min(12, v * 4) }).map((_, i) => {
            const seed = k.charCodeAt(0) * 13 + i * 7;
            const cx = x0 + 4 + (seed % Math.max(20, x1 - x0 - 8));
            const cy = yBottom - 8 - (seed % 20);
            return (
              <circle
                key={`${k}-${i}`}
                cx={cx}
                cy={cy}
                r={2 + (i % 3) * 0.6}
                fill={precipitating && i === 0 ? precipColor : (CHEMICALS[k]?.color || '#ccc')}
                stroke="var(--ink)"
                strokeWidth=".7"
                opacity=".9"
              />
            );
          })
        )}

        {/* Bong bóng */}
        {bubbleCount > 0 && (
          <>
            {Array.from({ length: bubbleCount }).map((_, i) => (
              <circle
                key={`b-${fx?.id || 'x'}-${i}`}
                className="lk-bub"
                cx={x0 + 8 + ((i * 37) % Math.max(20, x1 - x0 - 16))}
                cy={yBottom - 6}
                r={2 + (i % 3)}
                style={{
                  '--dx': ((i % 5) - 2) * 4 + 'px',
                  '--top': `${liquidTop - yBottom - 20}px`,
                  animationDelay: i * 0.09 + 's',
                  animationDuration: 1 + (i % 4) * 0.25 + 's',
                }}
              />
            ))}
          </>
        )}

        {/* Đũa khuấy */}
        {stir && (
          <g className="lk-stirrer" style={{ transformOrigin: `${centerX}px ${yTop}px` }}>
            <line
              x1={centerX} y1={yTop - 60}
              x2={centerX} y2={yBottom - 20}
              stroke="var(--ink)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </g>
        )}
      </g>

      {/* Viền thủy tinh */}
      <path
        d={shape.outline}
        fill={`url(#glass-${id})`}
        stroke="var(--ink)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Vạch chia độ */}
      {shape.markLine && type === 'beaker' && [40, 70, 100, 130].map((y) => (
        <g key={y}>
          <line x1={x0 - 8} x2={x0 - 2} y1={y} y2={y} stroke="var(--ink)" strokeWidth="1.2" opacity=".5" />
          <line x1={x1 + 2} x2={x1 + 8} y1={y} y2={y} stroke="var(--ink)" strokeWidth="1.2" opacity=".5" />
        </g>
      ))}

      {/* ===== HIỆU ỨNG ===== */}
      {fx?.kind === 'fire' && (
        <g className="lk-flame">
          <path
            d={`M ${centerX} ${yTop + 40} C ${centerX - 30} ${yTop - 10} ${centerX - 20} ${yTop - 60} ${centerX} ${yTop - 90} C ${centerX + 20} ${yTop - 60} ${centerX + 30} ${yTop - 10} ${centerX} ${yTop + 40} Z`}
            fill="#ff7a1a"
            opacity=".9"
          />
          <path
            d={`M ${centerX} ${yTop + 40} C ${centerX - 15} ${yTop} ${centerX - 8} ${yTop - 40} ${centerX} ${yTop - 65} C ${centerX + 8} ${yTop - 40} ${centerX + 15} ${yTop} ${centerX} ${yTop + 40} Z`}
            fill="#ffe14a"
          />
        </g>
      )}

      {fx?.kind === 'flash' && (
        <circle
          cx={centerX}
          cy={yBottom - 50}
          r="100"
          fill="url(#lk-flash)"
          className="lk-burst"
        />
      )}

      {fx?.kind === 'glow' && [0, 1, 2].map((i) => (
        <circle
          key={i}
          cx={centerX}
          cy={yBottom - 15}
          r={18}
          fill="none"
          stroke="#ff9b4a"
          strokeWidth="2.5"
          className="lk-ring"
          style={{ animationDelay: i * 0.35 + 's' }}
        />
      ))}

      {/* Khói */}
      {steaming && [0, 1, 2, 3].map((i) => (
        <circle
          key={`steam-${i}`}
          cx={centerX - 15 + i * 10}
          cy={liquidTop - 15}
          r={6}
          className="lk-steam"
          style={{ animationDelay: i * 0.45 + 's' }}
        />
      ))}

      {/* ===== ĐỔ HÓA CHẤT ===== */}
      {pour && (
        <g>
          <rect
            x={centerX + 6}
            y={-20}
            width="4"
            height={Math.max(20, yTop + 20)}
            rx="2"
            fill={pour.color}
            className="lk-pour"
          />
          <g transform={`translate(${centerX + 16} -30) rotate(-140)`}>
            <rect x="-4" y="0" width="8" height="7" fill="var(--ink)" />
            <path d="M -4 7 h8 l7 9 v30 h-22 v-30 z" fill={pour.color} stroke="var(--ink)" strokeWidth="2" />
          </g>
        </g>
      )}

      {/* ===== NHÃN ===== */}
      <g transform={`translate(${shape.w / 2} ${shape.h + 46})`}>
        {/* Nhãn tên */}
        <rect
          x={-42} y={-12}
          width="84" height="22"
          rx="11"
          fill="var(--bg)"
          stroke="var(--ink)"
          strokeWidth="1.5"
          opacity=".95"
        />
        <text
          x="0" y="4"
          textAnchor="middle"
          fontSize="11"
          fill="var(--ink)"
          fontFamily="var(--mono)"
          fontWeight="700"
        >{label || shape.label}</text>
      </g>

      {/* Nút xóa — góc trên phải */}
      {onRemove && (
        <g
          transform={`translate(${shape.w - 6} -10)`}
          style={{ cursor: 'pointer', pointerEvents: 'all' }}
          onClick={(e) => { e.stopPropagation(); onRemove(id); }}
        >
          <circle r="11" fill="var(--bg)" stroke="var(--ink)" strokeWidth="1.5" />
          <path d="M -4 -4 L 4 4 M 4 -4 L -4 4" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}

      {/* Nhãn nhiệt độ (nếu có đèn cồn) */}
      {heat && (
        <text
          x={shape.w / 2}
          y={shape.h + 74}
          textAnchor="middle"
          fontSize="10"
          fill="var(--acc)"
          fontFamily="var(--mono)"
          fontWeight="700"
        >{Math.round(temp)}°C</text>
      )}
    </g>
  );
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function LabStage({
  vessels = [],       // [{ id, type, x, y, contents, heat, temp, fx, pour }]
  selectedId,
  onSelect,
  onRemove,
  onDropChemical,    // (vesselId, chemKey) => void
  dragging = false,
  globalTemp = 25,
  sceneWidth = 900,
  sceneHeight = 560,
}) {
  return (
    <svg
      className="lk-scene"
      viewBox={`0 0 ${sceneWidth} ${sceneHeight}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Bàn thí nghiệm"
    >
      <defs>
        <radialGradient id="lk-flash">
          <stop offset="0" stopColor="#fff" />
          <stop offset=".4" stopColor="#ffd44a" stopOpacity=".85" />
          <stop offset="1" stopColor="#ff7a1a" stopOpacity="0" />
        </radialGradient>
        <pattern id="lk-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--soft)" strokeWidth="1" opacity=".35" />
        </pattern>
      </defs>

      {/* Nền lưới ô vuông */}
      <rect width={sceneWidth} height={sceneHeight} fill="url(#lk-grid)" opacity=".5" />

      {/* ===== MẶT BÀN ===== */}
      <rect
        x="0" y={sceneHeight - 80}
        width={sceneWidth} height="80"
        fill="#b98a55"
        stroke="var(--ink)"
        strokeWidth="3"
      />
      {/* Vân gỗ */}
      <path
        d={`M0 ${sceneHeight - 60} H${sceneWidth} M0 ${sceneHeight - 40} H${sceneWidth} M0 ${sceneHeight - 20} H${sceneWidth}`}
        stroke="var(--ink)"
        strokeWidth="1"
        opacity=".2"
      />

      {/* ===== CÁC DỤNG CỤ ===== */}
      {vessels.map((v) => (
        <Vessel
          key={v.id}
          id={v.id}
          type={v.type}
          x={v.x}
          y={v.y}
          contents={v.contents || {}}
          heat={v.heat}
          stir={v.stir}
          temp={v.temp ?? globalTemp}
          fx={v.fx}
          pour={v.pour}
          label={v.label}
          selected={selectedId === v.id}
          onSelect={() => onSelect?.(v.id)}
          onRemove={onRemove}
        />
      ))}

      {/* ===== HINT KHI RỖNG ===== */}
      {vessels.length === 0 && (
        <g transform={`translate(${sceneWidth / 2} ${sceneHeight / 2 - 40})`}>
          <rect
            x="-140" y="-30"
            width="280" height="60"
            rx="30"
            fill="var(--bg)"
            stroke="var(--soft)"
            strokeWidth="2"
            strokeDasharray="6 4"
          />
          <text
            x="0" y="6"
            textAnchor="middle"
            fontSize="14"
            fill="var(--mut)"
            fontFamily="var(--mono)"
          >Kéo dụng cụ vào bàn để bắt đầu</text>
        </g>
      )}

      {/* ===== DRAG HIGHLIGHT ===== */}
      {dragging && vessels.length > 0 && vessels.map((v) => (
        <rect
          key={`drop-${v.id}`}
          x={v.x - 10}
          y={v.y - 10}
          width={(VESSEL_SHAPES[v.type]?.w || 100) + 20}
          height={(VESSEL_SHAPES[v.type]?.h || 150) + 80}
          rx="16"
          fill="none"
          stroke="var(--acc)"
          strokeWidth="2.5"
          strokeDasharray="8 6"
          opacity=".6"
          style={{ pointerEvents: 'none' }}
        />
      ))}
    </svg>
  );
}