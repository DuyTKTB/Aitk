/* settings.js — cài đặt cục bộ. Theme KHÔNG nằm ở đây: App đã quản lý theme
   và truyền {theme, onToggleTheme} xuống (giống GuestBar), Settings dùng lại. */
import { useSyncExternalStore } from 'react';

const KEY = 'cs-settings-v1';
const DEFAULT = { reduceMotion: false };
let cache = DEFAULT;
try { cache = { ...DEFAULT, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { /* */ }

const subs = new Set();
export function applySettings(s = cache) {
  const el = document.documentElement;
  if (s.reduceMotion) el.setAttribute('data-motion', 'reduced'); else el.removeAttribute('data-motion');
}
export function setSetting(patch) {
  cache = { ...cache, ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch { /* */ }
  applySettings();
  subs.forEach((f) => f());
}
export const useSettings = () =>
  useSyncExternalStore((cb) => { subs.add(cb); return () => subs.delete(cb); }, () => cache, () => DEFAULT);

/** Gom mọi key cs-* thành 1 file JSON cho người dùng tải về */
export function exportData() {
  const out = {};
  for (let i = 0; i < localStorage.length; i += 1) {
    const k = localStorage.key(i);
    if (k && k.startsWith('cs-') && k !== 'cs-feedback-queue') {
      try { out[k] = JSON.parse(localStorage.getItem(k)); } catch { out[k] = localStorage.getItem(k); }
    }
  }
  const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'cuai-du-lieu-' + new Date().toISOString().slice(0, 10) + '.json' });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
