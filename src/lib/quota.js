import { getQuotaForTier } from './tier.js';

const STORAGE_PREFIX = 'cs-ai-quota';

function keyFor(uid) {
  return uid ? `${STORAGE_PREFIX}:${uid}` : STORAGE_PREFIX;
}

function today() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function load(uid) {
  try {
    const raw = localStorage.getItem(keyFor(uid));
    const data = raw ? JSON.parse(raw) : null;
    if (!data || data.date !== today()) {
      return { date: today(), text: 0, image: 0 };
    }
    return { date: data.date, text: data.text || 0, image: data.image || 0 };
  } catch {
    return { date: today(), text: 0, image: 0 };
  }
}

function save(uid, data) {
  try {
    localStorage.setItem(keyFor(uid), JSON.stringify(data));
    dispatchEvent(new CustomEvent('cs-quota-update'));
  } catch {}
}

/* ============================================================
   Lấy quota hiện tại theo tier
   @param uid  - user id
   @param tier - object tier (từ tier.js)
   ============================================================ */
export function getQuota(uid, tier) {
  const q = load(uid);
  const { quotaText, quotaImage, unlimitedText } = getQuotaForTier(
    tier || { quotaText: 18, quotaImage: 5, unlimitedText: false }
  );

  return {
    textUsed: q.text,
    imageUsed: q.image,
    textLeft: unlimitedText ? Infinity : Math.max(0, quotaText - q.text),
    imageLeft: Math.max(0, quotaImage - q.image),
    quotaText,
    quotaImage,
    unlimitedText,
    date: q.date,
  };
}

/* ============================================================
   Kiểm tra có thể gửi không
   ============================================================ */
export function canSend(uid, tier, hasImage) {
  const q = load(uid);
  const cfg = getQuotaForTier(tier);

  if (hasImage) return q.image < cfg.quotaImage;
  if (cfg.unlimitedText) return true;
  return q.text < cfg.quotaText;
}

/* ============================================================
   Đếm 1 lượt đã dùng
   ============================================================ */
export function useQuota(uid, tier, hasImage) {
  const q = load(uid);
  const cfg = getQuotaForTier(tier);

  if (hasImage) {
    if (q.image >= cfg.quotaImage) return null;
    q.image += 1;
  } else {
    if (!cfg.unlimitedText && q.text >= cfg.quotaText) return null;
    if (!cfg.unlimitedText) q.text += 1;
  }
  save(uid, q);
  return getQuota(uid, tier);
}

/* Reset (dùng khi test) */
export function resetQuota(uid) {
  save(uid, { date: today(), text: 0, image: 0 });
}

/* ============================================================
   Constants cho fallback (khi chưa load tier)
   ============================================================ */
export const QUOTA_TEXT = 18;
export const QUOTA_IMAGE = 5;