/* ============================================================
   API Tracker — Đếm request đã gửi, tính quota còn lại
   Lưu trong localStorage, reset theo ngày
   ============================================================ */

const TRACK_KEY = 'cs-api-tracker';

// Giới hạn free tier (cập nhật khi Google/Groq đổi chính sách)
export const API_LIMITS = {
  gemini: {
    name: 'Google Gemini',
    rpm: 10,          // Requests Per Minute
    rpd: 1500,        // Requests Per Day
    tpm: 250000,      // Tokens Per Minute (ước lượng)
    color: '#4285F4',
    model: 'gemini-flash-latest',
  },
  groq: {
    name: 'Groq',
    rpm: 30,
    rpd: 14400,       // Cho llama-3.1-8b, gpt-oss thấp hơn
    tpm: 6000,
    color: '#F55036',
    model: 'openai/gpt-oss-120b',
  },
};

const today = () => new Date().toISOString().slice(0, 10);

function readStore() {
  try {
    const raw = localStorage.getItem(TRACK_KEY);
    const data = raw ? JSON.parse(raw) : null;
    if (!data || data.day !== today()) {
      return { day: today(), gemini: { count: 0, errors: 0 }, groq: { count: 0, errors: 0 } };
    }
    return data;
  } catch {
    return { day: today(), gemini: { count: 0, errors: 0 }, groq: { count: 0, errors: 0 } };
  }
}

function writeStore(data) {
  try {
    localStorage.setItem(TRACK_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('cs-api-update'));
  } catch { /* */ }
}

/** Ghi nhận 1 request đã gửi */
export function trackRequest(provider, isError = false) {
  const data = readStore();
  if (!data[provider]) data[provider] = { count: 0, errors: 0 };
  if (isError) {
    data[provider].errors = (data[provider].errors || 0) + 1;
  } else {
    data[provider].count = (data[provider].count || 0) + 1;
  }
  writeStore(data);
}

/** Lấy thống kê hiện tại */
export function getUsage() {
  const data = readStore();
  const result = {};

  for (const [key, limit] of Object.entries(API_LIMITS)) {
    const used = data[key]?.count || 0;
    const errors = data[key]?.errors || 0;
    const remaining = Math.max(0, limit.rpd - used);
    const pct = Math.min(100, (used / limit.rpd) * 100);

    result[key] = {
      ...limit,
      used,
      errors,
      remaining,
      percent: pct,
      status: pct >= 90 ? 'critical' : pct >= 70 ? 'warning' : 'ok',
    };
  }

  return { day: data.day, providers: result };
}

/** Reset thủ công (khi đổi key hoặc reset quota) */
export function resetUsage(provider = null) {
  const data = readStore();
  if (provider) {
    data[provider] = { count: 0, errors: 0 };
  } else {
    for (const key of Object.keys(API_LIMITS)) {
      data[key] = { count: 0, errors: 0 };
    }
  }
  writeStore(data);
}

/** Hook để React tự update khi có request mới */
export function useApiUsage() {
  const [usage, setUsage] = React.useState(getUsage);

  React.useEffect(() => {
    const onUpdate = () => setUsage(getUsage());
    window.addEventListener('cs-api-update', onUpdate);
    return () => window.removeEventListener('cs-api-update', onUpdate);
  }, []);

  return usage;
}

// Cần import React nếu file không phải .jsx
import React from 'react';