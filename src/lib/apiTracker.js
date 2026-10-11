/* ====== API TRACKER — Đếm số lượt gọi API ====== */
/* Lưu vào localStorage, phát event 'cs-api-update' khi có thay đổi */

const STORAGE_KEY = 'cs-api-usage';

export const API_LIMITS = {
  gemini: { name: 'Gemini', color: '#4285f4', rpd: 1500 },
  groq:   { name: 'Groq',   color: '#f55036', rpd: 14400 },
  agnes:  { name: 'Agnes',  color: '#7c3aed', rpd: 5000 },  // ← Thêm dòng này
};

function read() {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : null;
    if (!data || data.day !== today) {
      return { day: today, providers: {} };
    }
    return data;
  } catch {
    return { day: today, providers: {} };
  }
}

function write(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event('cs-api-update'));
  } catch { /* localStorage bị chặn */ }
}

/** Ghi nhận 1 lượt gọi API. isError=true nếu request thất bại. */
export function trackRequest(provider, isError = false) {
  const data = read();
  const p = data.providers[provider] || { used: 0, errors: 0 };
  p.used += 1;
  if (isError) p.errors += 1;
  data.providers[provider] = p;
  write(data);
}

/** Lấy số liệu đã dùng của từng provider hôm nay */
export function getUsage() {
  const data = read();
  const out = { day: data.day, providers: {} };

  for (const [key, limit] of Object.entries(API_LIMITS)) {
    const p = data.providers[key] || { used: 0, errors: 0 };
    const remaining = Math.max(0, limit.rpd - p.used);
    const percent = limit.rpd > 0 ? (p.used / limit.rpd) * 100 : 0;

    let status = 'ok';
    if (percent >= 90) status = 'critical';
    else if (percent >= 70) status = 'warning';

    out.providers[key] = {
      name: limit.name,
      color: limit.color,
      used: p.used,
      errors: p.errors,
      rpd: limit.rpd,
      remaining,
      percent,
      status,
    };
  }
  return out;
}

/** Reset bộ đếm. Không truyền provider → reset tất cả */
export function resetUsage(provider) {
  const data = read();
  if (provider) {
    delete data.providers[provider];
  } else {
    data.providers = {};
  }
  write(data);
}