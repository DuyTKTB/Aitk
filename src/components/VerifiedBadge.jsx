import { useEffect, useState } from 'react';
import { getTier } from '../lib/tier.js';

/* ============================================================
   VERIFIED BADGE — Tick xanh cho user VIP
   - Tự động fetch tier từ uid nếu không truyền prop
   - Cache global để không spam API
   ============================================================ */

const tierCache = new Map();

export function useUserTier(uid) {
  const [isVip, setIsVip] = useState(() => tierCache.get(uid) || false);

  useEffect(() => {
    if (!uid) {
      setIsVip(false);
      return;
    }
    let cancelled = false;

    // Cache có sẵn → dùng luôn
    if (tierCache.has(uid)) {
      setIsVip(tierCache.get(uid));
      return;
    }

    getTier(uid).then((t) => {
      if (cancelled) return;
      const vip = t?.key === 'vip';
      tierCache.set(uid, vip);
      setIsVip(vip);
    });

    return () => {
      cancelled = true;
    };
  }, [uid]);

  return isVip;
}

/* ============================================================
   COMPONENT — SVG tick xanh
   ============================================================ */
export default function VerifiedBadge({
  uid,
  isVip: isVipProp,
  size = 14,
  title = 'Tài khoản VIP đã xác minh',
  className = '',
}) {
  const isVipFromHook = useUserTier(isVipProp === undefined ? uid : null);
  const isVip = isVipProp !== undefined ? isVipProp : isVipFromHook;

  if (!isVip) return null;

  return (
    <span
      className={'verified-badge ' + className}
      title={title}
      aria-label={title}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
        {/* Ngôi sao 8 cánh */}
        <path
          d="M12 1.5l2.7 2.5 3.6-.7 1.4 3.4 3.3 1.6-1 3.5 1 3.5-3.3 1.6-1.4 3.4-3.6-.7L12 22.5l-2.7-2.5-3.6.7-1.4-3.4-3.3-1.6 1-3.5-1-3.5 3.3-1.6L4.7 3.3l3.6.7L12 1.5z"
          fill="#1d9bf0"
        />
        {/* Tick trắng */}
        <path
          d="M7.5 12.2l3 3 6-6"
          stroke="#fff"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </span>
  );
}