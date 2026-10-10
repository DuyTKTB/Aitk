/* ============================================================
   TIER — Quản lý gói sử dụng (Free / VIP)
   Lưu trên FIRESTORE: /users/{uid}.tier
   ============================================================ */
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase.js';

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
const CACHE_MS = 60 * 1000;

/* ============================================================
   Lấy tier của user từ Firestore
   ============================================================ */
export async function getTier(uid) {
  if (!uid) return TIERS.free;

  const c = cache.get(uid);
  if (c && Date.now() - c.t < CACHE_MS) return c.tier;

  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) {
      cache.set(uid, { tier: TIERS.free, t: Date.now() });
      return TIERS.free;
    }
    const data = snap.data();
    const key = (data?.tier || 'free').toString().toLowerCase();
    const tier = TIERS[key] || TIERS.free;
    cache.set(uid, { tier, t: Date.now() });
    return tier;
  } catch (e) {
    console.warn('Lỗi đọc tier:', e);
    return TIERS.free;
  }
}

/* Xóa cache */
export function clearTierCache(uid) {
  if (uid) cache.delete(uid);
  else cache.clear();
}

/* ============================================================
   Lấy thông tin đầy đủ
   ============================================================ */
export async function getTierInfo(uid) {
  if (!uid) return { tier: 'free', note: '', upgradedAt: null };

  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return { tier: 'free', note: '', upgradedAt: null };
    const data = snap.data();
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
   Sync info user (đã có useAuth làm rồi, giữ để tương thích)
   ============================================================ */
export async function syncUserInfo(user) {
  if (!user?.uid) return;
  try {
    const ref = doc(db, 'users', user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        uid: user.uid,
        displayName: user.displayName || '',
        email: user.email || '',
        tier: 'free',
        createdAt: new Date().toISOString(),
      });
    }
  } catch {}
}

/* ============================================================
   Admin: set tier cho user
   ============================================================ */
export async function setUserTier(uid, tierKey) {
  if (!uid) return { ok: false };
  try {
    await updateDoc(doc(db, 'users', uid), {
      tier: tierKey,
      upgradedAt: new Date().toISOString(),
    });
    clearTierCache(uid);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

/* ============================================================
   Quota theo tier
   ============================================================ */
export function getQuotaForTier(tier) {
  return {
    quotaText: tier.unlimitedText ? Infinity : tier.quotaText,
    quotaImage: tier.quotaImage,
    unlimitedText: tier.unlimitedText,
  };
}