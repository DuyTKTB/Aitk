/* ============================================================
   LabKit — Lọ hóa chất SVG + hook dùng chung cho Virtual Lab
   ============================================================ */
import { useState, useRef, useEffect } from 'react';
import { CHEMICALS } from '../../data/reactions';
import { GIcon } from './GameIcons';

/* ---------- Màu sắc cho lọ ---------- */
const STATE_ICON = { solid: 'solid', liquid: 'drop', gas: 'cloud' };
const STATE_LABEL = { solid: 'Rắn', liquid: 'Lỏng', gas: 'Khí' };

/* ---------- 1) LỌ HÓA CHẤT SVG ---------- */
export function ChemBottle({ chemKey, size = 56 }) {
  const c = CHEMICALS[chemKey];
  if (!c) return null;

  const isGas = c.state === 'gas';
  const isSolid = c.state === 'solid';
  const fillColor = c.color;

  return (
    <svg
      className="lk-bottle"
      width={size}
      height={size * 1.15}
      viewBox="0 0 60 70"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`lb-glass-${chemKey}`} x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".55" />
          <stop offset=".4" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#fff" stopOpacity=".25" />
        </linearGradient>
      </defs>

      {/* Nắp */}
      <rect x="20" y="4" width="20" height="8" rx="1.5" fill="#1a1a1a" />
      <rect x="18" y="12" width="24" height="4" rx="1" fill="#333" />

      {/* Thân lọ (thủy tinh) */}
      <path
        d="M18 16 L18 60 Q18 66 24 66 L36 66 Q42 66 42 60 L42 16 Z"
        fill="rgba(255,255,255,.2)"
        stroke="#1a1a1a"
        strokeWidth="1.8"
      />

      {/* Dung dịch bên trong */}
      {isSolid ? (
        <>
          <path d="M18 48 L42 48 L42 60 Q42 66 36 66 L24 66 Q18 66 18 60 Z" fill={fillColor} opacity=".9" />
          <circle cx="26" cy="46" r="3.5" fill={fillColor} stroke="#1a1a1a" strokeWidth=".8" />
          <circle cx="34" cy="44" r="4" fill={fillColor} stroke="#1a1a1a" strokeWidth=".8" />
          <circle cx="30" cy="42" r="3" fill={fillColor} stroke="#1a1a1a" strokeWidth=".8" />
        </>
      ) : isGas ? (
        <>
          <circle cx="30" cy="35" r="12" fill={fillColor} opacity=".15" />
          <circle cx="24" cy="45" r="4" fill={fillColor} opacity=".3" />
          <circle cx="36" cy="50" r="3" fill={fillColor} opacity=".3" />
          <circle cx="30" cy="55" r="3.5" fill={fillColor} opacity=".3" />
        </>
      ) : (
        <>
          <path d="M18 34 L42 34 L42 60 Q42 66 36 66 L24 66 Q18 66 18 60 Z" fill={fillColor} opacity=".85" />
          <line x1="19" y1="34" x2="41" y2="34" stroke="#fff" strokeWidth="1.5" opacity=".55" />
        </>
      )}

      {/* Ánh sáng thủy tinh */}
      <path d="M18 16 L18 60 Q18 66 24 66 L36 66 Q42 66 42 60 L42 16 Z" fill={`url(#lb-glass-${chemKey})`} pointerEvents="none" />

      {/* Nhãn giấy */}
      <rect x="20" y="22" width="20" height="12" rx="1" fill="#efece4" stroke="#1a1a1a" strokeWidth=".8" opacity=".95" />
    </svg>
  );
}

/* ---------- 2) THẺ HÓA CHẤT KÉO THẢ ---------- */
export function ChemCard({ chemKey, disabled, onClick, onDragStart }) {
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
        onDragStart?.(chemKey);
      }}
      onClick={() => onClick?.(chemKey)}
      disabled={disabled}
      title={`${c.name} (${c.formula})`}
    >
      <ChemBottle chemKey={chemKey} size={44} />
      <span className="lk-chem-formula">{c.formula}</span>
      <span className="lk-chem-name">{c.name}</span>
      <span className="lk-chem-state"><GIcon name={STATE_ICON[c.state]} /> {STATE_LABEL[c.state]}</span>
    </button>
  );
}

/* ---------- 3) HOOK REACTION TIMER ---------- */
export function useReactionTimer(trigger, ms = 2200) {
  const [active, setActive] = useState(trigger);
  const ref = useRef();
  useEffect(() => {
    clearTimeout(ref.current);
    setActive(trigger);
    if (trigger) ref.current = setTimeout(() => setActive(null), ms);
    return () => clearTimeout(ref.current);
  }, [trigger, ms]);
  return active;
}

/* ---------- 4) HOOK PHÁT HIỆN KÉO THẢ ---------- */
export function useDragDrop(onDrop) {
  const [dragging, setDragging] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleOver = (e) => { e.preventDefault(); setDragging(true); };
    const handleLeave = () => setDragging(false);
    const handleDrop = (e) => {
      e.preventDefault();
      setDragging(false);
      const key = e.dataTransfer.getData('text/chem');
      if (key) onDrop?.(key);
    };
    el.addEventListener('dragover', handleOver);
    el.addEventListener('dragleave', handleLeave);
    el.addEventListener('drop', handleDrop);
    return () => {
      el.removeEventListener('dragover', handleOver);
      el.removeEventListener('dragleave', handleLeave);
      el.removeEventListener('drop', handleDrop);
    };
  }, [onDrop]);

  return { ref, dragging };
}