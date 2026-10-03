
const STORAGE_KEY = 'cs-quota';

/* Cấu trúc tier mặc định */
export const TIERS = {
  free: {
    key: 'free',
    name: 'Miễn phí',
    color: '#5d6a94',
    quotaText: 20,
    quotaImage: 5,
  },
  vip: {
    key: 'vip',
    name: 'CUAI VIP',
    color: '#ffb020',
    quotaText: Infinity,
    quotaImage: Infinity,
  },
};

/* Lấy ngày hôm nay dạng YYYY-MM-DD */
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/* Đọc quota từ localStorage */
const readQuota = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.date !== today()) return null;
    return data;
  } catch {
    return null;
  }
};

/* Ghi quota */
const writeQuota = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* localStorage bị chặn */
  }
};

/* Lấy tier hiện tại */
export const getTier = (tierOrKey) => {
  if (typeof tierOrKey === 'string') return TIERS[tierOrKey] || TIERS.free;
  if (tierOrKey && typeof tierOrKey === 'object' && tierOrKey.key) {
    return TIERS[tierOrKey.key] || TIERS.free;
  }
  return TIERS.free;
};

/* Lấy trạng thái quota hiện tại */
export const getQuota = (uid, tierOrKey) => {
  const tier = getTier(tierOrKey);
  const data = readQuota();
  const textUsed = data?.textUsed || 0;
  const imageUsed = data?.imageUsed || 0;

  return {
    tier: tier.key,
    quotaText: tier.quotaText,
    quotaImage: tier.quotaImage,
    textUsed,
    imageUsed,
    textLeft: tier.quotaText === Infinity ? Infinity : Math.max(0, tier.quotaText - textUsed),
    imageLeft: tier.quotaImage === Infinity ? Infinity : Math.max(0, tier.quotaImage - imageUsed),
  };
};

/* Kiểm tra còn lượt không */
export const canSend = (uid, tierOrKey, hasImage = false) => {
  const tier = getTier(tierOrKey);
  if (tier.key === 'vip') return true;

  const q = getQuota(uid, tier);
  if (hasImage) return q.imageLeft > 0;
  return q.textLeft > 0;
};

/* Tiêu thụ 1 lượt — TRẢ VỀ quota mới */
export const consumeQuota = (uid, tierOrKey, hasImage = false) => {
  const tier = getTier(tierOrKey);
  if (tier.key === 'vip') return getQuota(uid, tier);

  const data = readQuota() || { date: today(), textUsed: 0, imageUsed: 0 };

  if (hasImage) {
    if (data.imageUsed >= tier.quotaImage) return null;
    data.imageUsed += 1;
  } else {
    if (data.textUsed >= tier.quotaText) return null;
    data.textUsed += 1;
  }

  writeQuota(data);

  /* Phát sự kiện để component khác cập nhật */
  try {
    window.dispatchEvent(new CustomEvent('cs-quota-update'));
  } catch {
    /* */
  }

  return getQuota(uid, tier);
};

/* Reset quota (dùng cho testing) */
export const resetQuota = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('cs-quota-update'));
  } catch {
    /* */
  }
};

/* Alias để tương thích code cũ — KHÔNG phải hook */
export const useQuota = consumeQuota;