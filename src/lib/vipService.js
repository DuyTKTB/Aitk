/* ============================================================
   vipService.js — Quản lý trạng thái VIP từ Firestore
   ============================================================ */
import { fetchPlan } from '../services/api.js';

/* Cache trong RAM, tránh gọi Firestore nhiều lần */
let cachedStatus = null;
let cacheTime = 0;
const CACHE_TTL = 30 * 1000; // 30 giây

/* ============================================================
   Lấy trạng thái VIP đầy đủ
   Trả về: {
     vip: boolean,
     plan: string,
     until: Date | null,
     daysLeft: number | null,
     isAdmin: boolean,
     source: string,
   }
   ============================================================ */
export async function getVipStatus(force = false) {
  const now = Date.now();
  if (!force && cachedStatus && now - cacheTime < CACHE_TTL) {
    return cachedStatus;
  }

  try {
    const plan = await fetchPlan();

    let until = null;
    let daysLeft = null;

    if (plan?.until) {
      const d = new Date(plan.until);
      if (!Number.isNaN(d.getTime())) {
        until = d;
        const diff = d.getTime() - now;
        daysLeft = Math.max(0, Math.ceil(diff / 86400000));
      }
    }

    // VIP còn hạn nếu: plan.vip = true VÀ (không có until HOẶC until > now)
    const vipActive = Boolean(plan?.vip) && (until === null || until.getTime() > now);

    const status = {
      vip: vipActive,
      plan: plan?.plan || 'free',
      until,
      daysLeft,
      isAdmin: Boolean(plan?.isAdmin),
      source: plan?.source || 'unknown',
      expired: Boolean(plan?.vip) && until !== null && until.getTime() <= now,
    };

    cachedStatus = status;
    cacheTime = now;
    return status;
  } catch (e) {
    console.warn('[vipService] getVipStatus error:', e);
    return {
      vip: false,
      plan: 'free',
      until: null,
      daysLeft: null,
      isAdmin: false,
      source: 'error',
      expired: false,
    };
  }
}

/* ============================================================
   Xóa cache khi có thay đổi VIP (sau khi nạp tiền, admin cấp)
   ============================================================ */
export function invalidateVipCache() {
  cachedStatus = null;
  cacheTime = 0;
}

/* ============================================================
   Kiểm tra nhanh: user có VIP đang hoạt động không?
   ============================================================ */
export async function isVipActive() {
  const s = await getVipStatus();
  return s.vip;
}

/* ============================================================
   Format còn bao lâu — "Còn 180 ngày", "Còn 3 giờ", "Hết hạn hôm nay"
   ============================================================ */
export function formatRemaining(daysLeft) {
  if (daysLeft === null || daysLeft === undefined) return null;
  if (daysLeft > 30) {
    const months = Math.floor(daysLeft / 30);
    return `Còn khoảng ${months} tháng`;
  }
  if (daysLeft > 1) return `Còn ${daysLeft} ngày`;
  if (daysLeft === 1) return 'Còn 1 ngày';
  return 'Hết hạn hôm nay';
}

/* ============================================================
   Format ngày hết hạn — "14/04/2027"
   ============================================================ */
export function formatExpiry(date) {
  if (!date || !(date instanceof Date)) return null;
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

/* ============================================================
   Lắng nghe sự kiện VIP thay đổi từ localStorage
   ============================================================ */
export function onVipChange(callback) {
  const handler = () => {
    invalidateVipCache();
    callback();
  };
  window.addEventListener('cs-vip-update', handler);
  return () => window.removeEventListener('cs-vip-update', handler);
}