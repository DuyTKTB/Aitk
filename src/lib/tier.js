/* ============================================================
   TIER — Quản lý gói sử dụng (Free / VIP)
   Lưu trên Firebase Realtime Database: /users/{uid}/tier.json
   - Free: 18 tin nhắn / 5 ảnh mỗi ngày
   - VIP:  không giới hạn chat / 30 ảnh mỗi ngày
   ============================================================ */

const DB = (import.meta.env.VITE_FIREBASE_DB_URL || '').replace(/\/$/, '');
const HAS_DB = /^https?:\/\//.test(DB);

export const TIERS = {
  free: {
    key: 'free',
    name: 'Free',
    icon: '🌱',
    quotaText: 18,
    quotaImage: 5,
    unlimitedText: false,
    color: '#8fd6c4',
    desc: 'Gói miễn phí — 18 tin nhắn và 5 ảnh mỗi ngày.',
  },
  vip: {
    key: 'vip',
    name: 'CUAI VIP',
    icon: '👑',
    quotaText: Infinity,
    quotaImage: 30,
    unlimitedText: true,
    color: '#ffb020',
    desc: 'Gói VIP — Chat không giới hạn, 30 ảnh mỗi ngày.',
  },
};

/* Cache tier để không spam API */
const cache = new Map();
const CACHE_MS = 60 * 1000; // 1 phút

/* ============================================================
   Lấy tier của user
   - Nếu chưa có trên DB → mặc định 'free'
   ============================================================ */
export async function getTier(uid) {
  if (!uid) return TIERS.free;

  // Cache còn hiệu lực
  const c = cache.get(uid);
  if (c && Date.now() - c.t < CACHE_MS) return c.tier;

  // Chưa cấu hình DB → mặc định free
  if (!HAS_DB) {
    cache.set(uid, { tier: TIERS.free, t: Date.now() });
    return TIERS.free;
  }

  try {
    const res = await fetch(`${DB}/users/${uid}/tier.json`);
    if (!res.ok) throw new Error('fetch failed');
    const data = await res.json();
    const key = (data?.tier || data || 'free').toString().toLowerCase();
    const tier = TIERS[key] || TIERS.free;
    cache.set(uid, { tier, t: Date.now() });
    return tier;
  } catch {
    return TIERS.free;
  }
}

/* Xóa cache (khi admin đổi tier) */
export function clearTierCache(uid) {
  if (uid) cache.delete(uid);
  else cache.clear();
}

/* ============================================================
   Lấy thông tin đầy đủ từ DB (tier + note + upgradedAt)
   ============================================================ */
export async function getTierInfo(uid) {
  if (!uid || !HAS_DB) return { tier: 'free', note: '', upgradedAt: null };

  try {
    const res = await fetch(`${DB}/users/${uid}.json`);
    if (!res.ok) return { tier: 'free', note: '', upgradedAt: null };
    const data = await res.json();
    return {
      tier: (data?.tier || 'free').toString().toLowerCase(),
      note: data?.note || '',
      upgradedAt: data?.upgradedAt || null,
      displayName: data?.displayName || '',
      email: data?.email || '',
    };
  } catch {
    return { tier: 'free', note: '', upgradedAt: null };
  }
}

/* ============================================================
   Lưu info cơ bản khi user đăng nhập lần đầu (để admin quản lý)
   ============================================================ */
export async function syncUserInfo(user) {
  if (!user?.uid || !HAS_DB) return;
  try {
    const ref = `${DB}/users/${user.uid}.json`;
    const check = await fetch(ref);
    const existing = check.ok ? await check.json() : null;

    const payload = {
      uid: user.uid,
      displayName: user.displayName || '',
      email: user.email || '',
      lastSeen: Date.now(),
    };

    // Nếu user chưa có trên DB → tạo mới với tier 'free'
    if (!existing) {
      payload.tier = 'free';
      payload.createdAt = Date.now();
    }

    await fetch(ref, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  } catch {}
}

/* ============================================================
   Đọc quota dựa theo tier (không đọc từ localStorage nữa)
   ============================================================ */
export function getQuotaForTier(tier) {
  return {
    quotaText: tier.unlimitedText ? Infinity : tier.quotaText,
    quotaImage: tier.quotaImage,
    unlimitedText: tier.unlimitedText,
  };
}
