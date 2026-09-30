/* ============================================================
   LabScene v3 — Vẽ NHIỀU dụng cụ trên cùng bàn thí nghiệm
   Mỗi dụng cụ có contents/heat/temp/fx riêng
   ============================================================ */
import { useMemo } from 'react';
import { CHEMICALS } from '../../data/reactions';

/* ---------- ĐỊNH NGHĨA DỤNG CỤ ---------- */
const VESSEL_SHAPES = {
  beaker: {
    label: 'Cốc',
    w: 160,
    h: 200,
    outline: 'M 20 30 L 20 180 Q 20 200 40 200 L 120 200 Q 140 200 140 180 L 140 30',
    inner: 'M 24 34 L 24 178 Q 24 196 42 196 L 118 196 Q 136 196 136 178 L 136 34',
    x0: 28, x1: 132,
    yTop: 34, yBottom: 194,
    centerX: 80,
    mark: [80, 120, 160],
  },
  flask: {
    label: 'Bình tam giác',
    w: 180,
    h: 220,
    outline: 'M 70 20 L 70 90 L 20 180 Q 15 200 40 200 L 140 200 Q 165 200 160 180 L 110 90 L 110 20',
    inner: 'M 74 24 L 74 90 L 24 180 Q 20 196 42 196 L 138 196 Q 160 196 156 180 L 106 90 L 106 24',
    x0: 34, x1: 146,
    yTop: 24, yBottom: 194,
    centerX: 90,
    mark: [],
  },
  tube: {
    label: 'Ống nghiệm',
    w: 90,
    h: 220,
    outline: 'M 25 20 L 25 190 Q 25 215 45 215 Q 65 215 65 190 L 65 20',
    inner: 'M 28 24 L 28 190 Q 28 212 45 212 Q 62 212 62 190 L 62 24',
    x0: 32, x1: 58,
    yTop: 24, yBottom: 210,
    centerX: 45,
    mark: [],
  },
};

/* Trộn màu dung dịch */
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

  const hasBase = Object.keys(contents).some((k) => CHEMICALS[k]?.type === 'base');
  const hasAcid = Object.keys(contents).some((k) => CHEMICALS[k]?.type === 'acid');
  if (contents.PP > 0 && hasBase) { r = 224; g = 48; b = 140; }
  else if (contents.Quy > 0 && hasAcid) { r = 229; g = 56; b = 59; }
  else if (contents.Quy > 0 && hasBase) { r = 58; g = 91; b = 217; }

  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

function solidsIn(contents) {
  return Object.entries(contents).filter(([k]) => {
    const c = CHEMICALS[k];
    if (!c) return false;
    if (c.state === 'solid') return true;
    return ['AgCl', 'BaSO4', 'PbI2', 'CuOH2', 'FeOH3', 'MgOH2'].includes(k);
  });
}

/* ---------- VẼ 1 DỤNG CỤ ---------- */
function Vessel({
  vessel, contents = {}, heat = false, stir = false, temp = 25,
  fx = null, pour = null, dragging = false, isSelected = false,
  onSelect, x = 0,
}) {
  const V = VESSEL_SHAPES[vessel] || VESSEL_SHAPES.beaker;
  const liquidColor = useMemo(() => mixColor(contents), [contents]);
  const solids = useMemo(() => solidsIn(contents), [contents]);
  const totalUnits = Object.values(contents).reduce((s, v) => s + v, 0);
  const liquidLevel = Math.min(1, totalUnits / 6);
  const { x0, x1, yTop, yBottom, centerX } = V;
  const maxFill = (yBottom - yTop) * 0.82;
  const liquidTop = yBottom - maxFill * liquidLevel;

  const boiling = heat && temp >= 95 && totalUnits > 0;
  const bubbleCount =
    fx?.kind === 'bubble' ? Math.min(20, (fx.intensity || 3) * 4) :
    boiling ? 8 : 0;

  const precipitating = fx?.kind === 'precip' || fx?.kind === 'precipitate';
  const precipColor = fx?.color || '#ffffff';
  const steaming = (heat && temp > 60) || fx?.steam;

  const burnerX = centerX;
  const burnerY = yBottom + 22;

  const clipId = `lk-clip-${vessel}-${x}`;

  return (
    <g
      transform={`translate(${x} 0)`}
      style={{ cursor: 'pointer' }}
      onClick={onSelect}
    >
      {/* Highlight khi được chọn */}
      {isSelected && (
        <rect
          x={-8} y={10}
          width={V.w + 16} height={V.h + 40}
          rx="16"
          fill="none"
          stroke="var(--acc)"
          strokeWidth="2"
          strokeDasharray="6 4"
          opacity=".6"
          pointerEvents="none"
        />
      )}

      <defs>
        <clipPath id={clipId}>
          <path d={V.inner + ' Z'} />
        </clipPath>
        <linearGradient id={`glass-${clipId}`} x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".55" />
          <stop offset=".35" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#fff" stopOpacity=".25" />
        </linearGradient>
      </defs>

      {/* Đèn cồn */}
      <g>
        <rect x={burnerX - 22} y={burnerY - 22} width="44" height="22" rx="6"
          fill="#c9ccd1" stroke="var(--ink)" strokeWidth="2.5" />
        <rect x={burnerX - 8} y={burnerY - 48} width="16" height="28"
          fill="#9aa4ad" stroke="var(--ink)" strokeWidth="2.5" />
        {heat && (
          <g className="lk-flame-group">
            <path d={`M ${burnerX} ${burnerY - 48} C ${burnerX - 20} ${burnerY - 64} ${burnerX - 12} ${burnerY - 84} ${burnerX} ${burnerY - 102} C ${burnerX + 12} ${burnerY - 84} ${burnerX + 20} ${burnerY - 64} ${burnerX} ${burnerY - 48} Z`}
              fill="#ff7a1a" opacity=".93" />
            <path d={`M ${burnerX} ${burnerY - 48} C ${burnerX - 10} ${burnerY - 58} ${burnerX - 6} ${burnerY - 72} ${burnerX} ${burnerY - 84} C ${burnerX + 6} ${burnerY - 72} ${burnerX + 10} ${burnerY - 58} ${burnerX} ${burnerY - 48} Z`}
              fill="#4aa3ff" />
          </g>
        )}
      </g>

      {/* Nội dung bên trong cốc */}
      <g clipPath={`url(#${clipId})`}>
        {liquidColor && liquidLevel > 0 && (
          <>
            <rect
              x={x0 - 30} y={liquidTop}
              width={x1 - x0 + 60} height={yBottom - liquidTop + 30}
              fill={liquidColor} opacity=".82"
            />
            <rect x={x0 - 30} y={liquidTop} width={x1 - x0 + 60} height="3"
              fill="#fff" opacity=".5" />
          </>
        )}

        {solids.flatMap(([k, v]) =>
          Array.from({ length: Math.min(14, v * 4) }).map((_, i) => (
            <circle
              key={`${k}-${i}`}
              cx={x0 + 6 + ((i * 37 + k.charCodeAt(0) * 11) % Math.max(20, x1 - x0 - 12))}
              cy={yBottom - 8 - ((i * 13 + k.length * 7) % 22)}
              r={3 + (i % 3) * 0.5}
              fill={precipitating && i === 0 ? precipColor : (CHEMICALS[k]?.color || '#ccc')}
              stroke="var(--ink)" strokeWidth=".7" opacity=".95"
            />
          ))
        )}

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

        {stir && (
          <g className="lk-stirrer" style={{ transformOrigin: `${centerX}px ${yTop}px` }}>
            <line x1={centerX} y1={yTop - 60} x2={centerX} y2={yBottom - 20}
              stroke="var(--ink)" strokeWidth="4" strokeLinecap="round" />
          </g>
        )}
      </g>

      {/* Viền thủy tinh */}
      <path d={V.outline} fill={`url(#glass-${clipId})`}
        stroke="var(--ink)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Vạch chia */}
      {V.mark.map((y) => (
        <g key={y}>
          <line x1={x0 - 12} x2={x0 - 2} y1={y} y2={y} stroke="var(--ink)" strokeWidth="1.4" opacity=".55" />
          <line x1={x1 + 2} x2={x1 + 12} y1={y} y2={y} stroke="var(--ink)" strokeWidth="1.4" opacity=".55" />
        </g>
      ))}

      {/* Hiệu ứng */}
      {fx?.kind === 'fire' && (
        <g className="lk-flame-group" transform={`translate(${centerX} ${yBottom})`}>
          <path d="M 0 -10 C -35 -40 -25 -80 0 -120 C 25 -80 35 -40 0 -10 Z" fill="#ff7a1a" opacity=".93" />
          <path d="M 0 -10 C -18 -35 -10 -65 0 -95 C 10 -65 18 -35 0 -10 Z" fill="#ffe14a" />
        </g>
      )}

      {fx?.kind === 'flash' && (
        <circle cx={centerX} cy={yBottom - 60} r="140" fill="url(#lk-flash)" className="lk-burst" />
      )}

      {fx?.kind === 'glow' && [0, 1, 2].map((i) => (
        <circle key={i} cx={centerX} cy={yBottom - 20} r={20}
          fill="none" stroke="#ff9b4a" strokeWidth="3"
          className="lk-ring" style={{ animationDelay: i * 0.35 + 's' }} />
      ))}

      {steaming && [0, 1, 2, 3].map((i) => (
        <circle key={`steam-${i}`}
          cx={centerX - 20 + i * 14} cy={liquidTop - 20} r={7}
          className="lk-steam" style={{ animationDelay: i * 0.45 + 's' }} />
      ))}

      {/* Đổ hóa chất */}
      {pour && (
        <g>
          <rect x={centerX + 8} y={30} width={5}
            height={Math.max(20, yTop - 30)} rx="2.5"
            fill={pour.color} className="lk-pour" />
          <g transform={`translate(${centerX + 20} 20) rotate(-140)`}>
            <rect x="-5" y="0" width="10" height="9" fill="var(--ink)" />
            <path d="M -5 9 h10 l8 10 v34 h-26 v-34 z" fill={pour.color}
              stroke="var(--ink)" strokeWidth="2.5" />
          </g>
        </g>
      )}

      {/* Chữ "Kéo hóa chất..." nếu trống */}
      {!totalUnits && !dragging && (
        <text x={centerX} y={yBottom - 60} textAnchor="middle" fontSize="12"
          fill="var(--mut)" fontFamily="var(--mono)" pointerEvents="none">
          Kéo hóa chất
        </text>
      )}
    </g>
  );
}

/* ---------- MAIN — VẼ TẤT CẢ DỤNG CỤ ---------- */
export default function LabScene({
  vessels = [],           // [{ id, vessel, contents, heat, stir, temp, fx, pour }]
  selectedId = null,
  onSelect,
  dragging = false,
}) {
  const COUNT = vessels.length;
  const GAP = 40;
  const PADDING_X = 60;

  // Tính chiều rộng mỗi dụng cụ
  const vesselWidth = 220;
  const totalWidth = Math.max(900, PADDING_X * 2 + COUNT * vesselWidth + (COUNT - 1) * GAP);
  const viewBoxWidth = totalWidth;
  const viewBoxHeight = 480;
  const tableTop = 380;
  const burnerOffset = 22;

  return (
    <svg
      className="lk-scene"
      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
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
      </defs>

      {/* Mặt bàn */}
      <rect x="0" y={tableTop} width={viewBoxWidth} height="60"
        fill="#b98a55" stroke="var(--ink)" strokeWidth="3" />
      <path d={`M0 ${tableTop + 16} H${viewBoxWidth} M0 ${tableTop + 32} H${viewBoxWidth}`}
        stroke="var(--ink)" strokeWidth="1" opacity=".25" />

      {/* Vẽ từng dụng cụ */}
      {vessels.map((v, i) => {
        const V = VESSEL_SHAPES[v.vessel] || VESSEL_SHAPES.beaker;
        // Căn giữa theo chiều rộng dụng cụ
        const cellX = PADDING_X + i * (vesselWidth + GAP);
        const vesselX = cellX + (vesselWidth - V.w) / 2;
        const vesselY = tableTop - V.h + burnerOffset - 10;

        return (
          <g key={v.id} transform={`translate(0 ${vesselY})`}>
            <Vessel
              vessel={v.vessel}
              contents={v.contents || {}}
              heat={v.heat}
              stir={v.stir}
              temp={v.temp ?? 25}
              fx={v.fx}
              pour={v.pour}
              dragging={dragging}
              isSelected={selectedId === v.id}
              onSelect={() => onSelect?.(v.id)}
              x={vesselX}
            />
          </g>
        );
      })}

      {/* Nếu chưa có dụng cụ */}
      {vessels.length === 0 && (
        <text x={viewBoxWidth / 2} y={200} textAnchor="middle"
          fontSize="16" fill="var(--mut)" fontFamily="var(--mono)">
          Chưa có dụng cụ nào — bấm "Thêm dụng cụ" để bắt đầu
        </text>
      )}
    </svg>
  );
}