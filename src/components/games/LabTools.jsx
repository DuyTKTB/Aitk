/* ============================================================
   LabTools — Kệ hóa chất kéo thả + toolbar + tooltip
   - ChemBottle: lọ SVG vẽ tay (rắn/lỏng/khí)
   - ChemCard: thẻ kéo thả (drag & drop HTML5)
   - FilterBar: chip lọc theo loại chất
   - VesselToolbar: chọn dụng cụ + thêm dụng cụ mới
   - ChemTooltip: tooltip hiển thị thông tin chất
   ============================================================ */
import { useState, useRef, useEffect, useCallback } from 'react';
import { CHEMICALS } from '../../data/reactions';
import { chemInfo } from '../../lib/labEngine';

/* ============================================================
   1) LỌ HÓA CHẤT SVG — vẽ bằng path, đẹp như thật
   ============================================================ */
export function ChemBottle({ chemKey, size = 52 }) {
  const c = CHEMICALS[chemKey];
  if (!c) return null;

  const isGas = c.state === 'gas';
  const isSolid = c.state === 'solid';
  const fill = c.color;

  return (
    <svg
      width={size}
      height={size * 1.15}
      viewBox="0 0 60 70"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id={`lbg-${chemKey}`} x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".65" />
          <stop offset=".4" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#fff" stopOpacity=".3" />
        </linearGradient>
      </defs>

      {/* Nắp lọ */}
      <rect x="22" y="2" width="16" height="7" rx="1.5" fill="#1a1a1a" />
      <rect x="20" y="9" width="20" height="4" rx="1" fill="#333" />

      {/* Thân lọ */}
      <path
        d="M18 14 L18 60 Q18 66 24 66 L36 66 Q42 66 42 60 L42 14 Z"
        fill="rgba(255,255,255,.25)"
        stroke="#1a1a1a"
        strokeWidth="1.6"
      />

      {/* Nội dung */}
      {isSolid ? (
        <>
          {/* Chất rắn: hạt ở đáy */}
          <path d="M18 50 L42 50 L42 60 Q42 66 36 66 L24 66 Q18 66 18 60 Z" fill={fill} opacity=".92" />
          <circle cx="25" cy="48" r="3" fill={fill} stroke="#1a1a1a" strokeWidth=".8" />
          <circle cx="34" cy="46" r="3.5" fill={fill} stroke="#1a1a1a" strokeWidth=".8" />
          <circle cx="29" cy="44" r="2.5" fill={fill} stroke="#1a1a1a" strokeWidth=".8" />
        </>
      ) : isGas ? (
        <>
          {/* Khí: bong bóng mờ */}
          <circle cx="30" cy="36" r="11" fill={fill} opacity=".18" />
          <circle cx="24" cy="46" r="4" fill={fill} opacity=".35" />
          <circle cx="36" cy="50" r="3" fill={fill} opacity=".35" />
          <circle cx="30" cy="56" r="3.5" fill={fill} opacity=".35" />
        </>
      ) : (
        <>
          {/* Lỏng: dung dịch */}
          <path d="M18 34 L42 34 L42 60 Q42 66 36 66 L24 66 Q18 66 18 60 Z" fill={fill} opacity=".88" />
          <line x1="19" y1="34" x2="41" y2="34" stroke="#fff" strokeWidth="1.5" opacity=".6" />
        </>
      )}

      {/* Ánh sáng thủy tinh */}
      <path
        d="M18 14 L18 60 Q18 66 24 66 L36 66 Q42 66 42 60 L42 14 Z"
        fill={`url(#lbg-${chemKey})`}
        pointerEvents="none"
      />

      {/* Nhãn giấy */}
      <rect
        x="21" y="22"
        width="18" height="10"
        rx="1"
        fill="#efece4"
        stroke="#1a1a1a"
        strokeWidth=".7"
        opacity=".95"
      />
    </svg>
  );
}

/* ============================================================
   2) THẺ HÓA CHẤT KÉO THẢ
   ============================================================ */
const STATE_LABEL = { solid: '◆ Rắn', liquid: '💧 Lỏng', gas: '☁ Khí' };

export function ChemCard({ chemKey, disabled, onClick, onDragStart, onDragEnd, onMouseEnter, onMouseLeave }) {
  const c = CHEMICALS[chemKey];
  if (!c) return null;

  return (
    <button
      type="button"
      className="lk-chem"
      draggable={!disabled}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/chem', chemKey);
        e.dataTransfer.effectAllowed = 'copy';
        onDragStart?.(chemKey, e);
      }}
      onDragEnd={onDragEnd}
      onClick={() => onClick?.(chemKey)}
      onMouseEnter={(e) => onMouseEnter?.(chemKey, e)}
      onMouseLeave={onMouseLeave}
      disabled={disabled}
      title={`${c.name} (${c.formula})`}
    >
      <ChemBottle chemKey={chemKey} size={40} />
      <span className="lk-chem-formula">{c.formula}</span>
      <span className="lk-chem-name">{c.name}</span>
      <span className="lk-chem-state">{STATE_LABEL[c.state]}</span>
    </button>
  );
}

/* ============================================================
   3) BỘ LỌC CHẤT
   ============================================================ */
const FILTERS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'metal', label: 'Kim loại' },
  { key: 'acid', label: 'Axit' },
  { key: 'base', label: 'Bazơ' },
  { key: 'salt', label: 'Muối' },
  { key: 'oxide', label: 'Oxit' },
  { key: 'gas', label: 'Khí' },
  { key: 'indicator', label: 'Chỉ thị' },
];

export function FilterBar({ value, onChange }) {
  return (
    <div className="lk-filters">
      {FILTERS.map((f) => (
        <button
          key={f.key}
          type="button"
          className={value === f.key ? 'on' : ''}
          onClick={() => onChange(f.key)}
        >{f.label}</button>
      ))}
    </div>
  );
}

/* ============================================================
   4) TOOLTIP HÓA HỌC — hiện khi hover chất
   ============================================================ */
export function ChemTooltip({ chemKey, anchor }) {
  const info = chemKey ? chemInfo(chemKey) : null;
  if (!info || !anchor) return null;
  const padding = 16;
  const W = 240;
  let left = anchor.x + padding;
  let top = anchor.y + padding;
  if (left + W > window.innerWidth - 8) left = anchor.x - W - padding;
  if (top + 180 > window.innerHeight - 8) top = anchor.y - 180 - padding;

  return (
    <div
      className="lk-tip"
      style={{ left, top, width: W }}
      role="tooltip"
    >
      <div className="lk-tip-title">{info.name}</div>
      <div className="lk-tip-row"><span>CTPT</span><b>{info.formula}</b></div>
      <div className="lk-tip-row"><span>Khối lượng mol</span><b>{info.molarMass} g/mol</b></div>
      <div className="lk-tip-row"><span>Trạng thái</span><b>{STATE_LABEL[info.state]}</b></div>
      <div className="lk-tip-row"><span>Loại</span><b>{info.type}</b></div>
      <div className="lk-tip-row"><span>Phản ứng</span><b>{info.reactions}</b></div>
    </div>
  );
}

/* ============================================================
   5) KỆ HÓA CHẤT (trái) — ghép FilterBar + grid ChemCard
   ============================================================ */
export function ChemShelf({
  disabled = false,
  onClickChem,
  maxedOut = false,
}) {
  const [filter, setFilter] = useState('all');
  const [tip, setTip] = useState({ key: null, x: 0, y: 0 });

  const list = Object.entries(CHEMICALS).filter(([k, c]) => {
    if (filter === 'all') return true;
    return c.type === filter;
  });

  const handleEnter = (key, e) => {
    setTip({ key, x: e.clientX, y: e.clientY });
  };
  const handleMove = useCallback((e) => {
    setTip((t) => (t.key ? { ...t, x: e.clientX, y: e.clientY } : t));
  }, []);
  const handleLeave = () => setTip({ key: null, x: 0, y: 0 });

  useEffect(() => {
    if (!tip.key) return;
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, [tip.key, handleMove]);

  return (
    <aside className="lk-shelf">
      <div className="lk-shelf-head">
        <h3>Kho hóa chất</h3>
        <span className="lk-shelf-count">{list.length}/{Object.keys(CHEMICALS).length}</span>
      </div>

      <FilterBar value={filter} onChange={setFilter} />

      <div className="lk-chems">
        {list.map(([key]) => (
          <ChemCard
            key={key}
            chemKey={key}
            disabled={disabled || maxedOut}
            onClick={onClickChem}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
          />
        ))}
      </div>

      {tip.key && <ChemTooltip chemKey={tip.key} anchor={{ x: tip.x, y: tip.y }} />}
    </aside>
  );
}

/* ============================================================
   6) TOOLBAR DỤNG CỤ (giữa) — chọn dụng cụ, thêm/xóa
   ============================================================ */
export const TOOL_TYPES = [
  { key: 'beaker', label: 'Cốc', icon: '🥃' },
  { key: 'flask', label: 'Bình tam giác', icon: '🧪' },
  { key: 'tube', label: 'Ống nghiệm', icon: '🧬' },
];

export function VesselToolbar({
  activeType = 'beaker',
  onActiveTypeChange,
  onAddVessel,
  onToggleHeat,
  onToggleStir,
  onDump,
  onDumpAll,
  onClear,
  heat = false,
  stir = false,
  hasContents = false,
  vesselCount = 0,
  maxVessels = 4,
  goggles = true,
  onToggleGoggles,
}) {
  return (
    <div className="lk-toolbar">
      {/* Chọn dụng cụ đang active */}
      <div className="lk-tool-group" role="group" aria-label="Chọn dụng cụ">
        {TOOL_TYPES.map((t) => (
          <button
            key={t.key}
            type="button"
            className={activeType === t.key ? 'on' : ''}
            onClick={() => onActiveTypeChange?.(t.key)}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Thêm dụng cụ mới */}
      <button
        type="button"
        className="lk-toggle"
        onClick={onAddVessel}
        disabled={vesselCount >= maxVessels}
        title={vesselCount >= maxVessels ? 'Bàn đã đầy' : 'Thêm dụng cụ mới vào bàn'}
      >
        ➕ Thêm dụng cụ ({vesselCount}/{maxVessels})
      </button>

      <div className="lk-tool-divider" />

      {/* Hành động */}
      <button
        type="button"
        className={'lk-toggle' + (heat ? ' on' : '')}
        onClick={onToggleHeat}
        disabled={!hasContents}
        title="Bật/tắt đèn cồn cho dụng cụ đang chọn"
      >
        🔥 Đèn cồn {heat ? 'BẬT' : 'tắt'}
      </button>

      <button
        type="button"
        className="lk-toggle"
        onClick={onToggleStir}
        disabled={!hasContents}
        title="Khuấy dụng cụ đang chọn"
      >
        🥄 Khuấy
      </button>

      <button
        type="button"
        className="lk-toggle"
        onClick={onDump}
        disabled={!hasContents}
        title="Đổ bỏ dụng cụ đang chọn"
      >
        🗑 Đổ bỏ
      </button>

      <label className="lk-toggle" style={{ cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={goggles}
          onChange={(e) => onToggleGoggles?.(e.target.checked)}
          style={{ width: 'auto' }}
        />
        🥽 Kính bảo hộ
      </label>

      <div className="lk-tool-right">
        <button
          type="button"
          className="lk-toggle"
          onClick={onDumpAll}
          disabled={vesselCount === 0}
        >🗑 Tất cả</button>
      </div>
    </div>
  );
}

/* ============================================================
   7) HOOK KÉO THẢ — dùng cho toàn sân thí nghiệm
   ============================================================ */
export function useDragDrop({ onDrop, onDragEnter, onDragLeave } = {}) {
  const [dragging, setDragging] = useState(false);
  const dragCounter = useRef(0);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleOver = (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    };

    const handleEnter = (e) => {
      e.preventDefault();
      dragCounter.current += 1;
      if (dragCounter.current === 1) {
        setDragging(true);
        onDragEnter?.();
      }
    };

    const handleLeave = () => {
      dragCounter.current = Math.max(0, dragCounter.current - 1);
      if (dragCounter.current === 0) {
        setDragging(false);
        onDragLeave?.();
      }
    };

    const handleDrop = (e) => {
      e.preventDefault();
      dragCounter.current = 0;
      setDragging(false);
      const key = e.dataTransfer.getData('text/chem');
      if (key) onDrop?.(key, e);
    };

    el.addEventListener('dragover', handleOver);
    el.addEventListener('dragenter', handleEnter);
    el.addEventListener('dragleave', handleLeave);
    el.addEventListener('drop', handleDrop);

    return () => {
      el.removeEventListener('dragover', handleOver);
      el.removeEventListener('dragenter', handleEnter);
      el.removeEventListener('dragleave', handleLeave);
      el.removeEventListener('drop', handleDrop);
    };
  }, [onDrop, onDragEnter, onDragLeave]);

  return { ref, dragging };
}

/* ============================================================
   8) HOOK TÌM DỤNG CỤ TỪ TỌA ĐỘ CHUỘT (khi thả hóa chất)
   Dùng để biết user thả vào cốc nào
   ============================================================ */
export function hitTestVessels(vessels, VESSEL_SHAPES, clientX, clientY, svgEl) {
  if (!svgEl) return null;
  const rect = svgEl.getBoundingClientRect();
  const viewBox = svgEl.viewBox.baseVal;
  const scaleX = viewBox.width / rect.width;
  const scaleY = viewBox.height / rect.height;
  const vx = (clientX - rect.left) * scaleX;
  const vy = (clientY - rect.top) * scaleY;
  for (let i = vessels.length - 1; i >= 0; i--) {
    const v = vessels[i];
    const shape = VESSEL_SHAPES[v.type];
    if (!shape) continue;
    if (
      vx >= v.x && vx <= v.x + shape.w &&
      vy >= v.y && vy <= v.y + shape.h + 40
    ) {
      return v.id;
    }
  }
  return null;
}