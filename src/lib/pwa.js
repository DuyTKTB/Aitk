/* pwa.js — đăng ký service worker, nhắc cập nhật, nút cài app, trạng thái mạng. */
import { useEffect, useState } from 'react';

export function registerSW({ onUpdate } = {}) {
  if (!('serviceWorker' in navigator) || !import.meta.env?.PROD) return;
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      const watch = (w) => w?.addEventListener('statechange', () => {
        if (w.state === 'installed' && navigator.serviceWorker.controller) onUpdate?.(() => w.postMessage('SKIP_WAITING'));
      });
      watch(reg.installing);
      reg.addEventListener('updatefound', () => watch(reg.installing));
      let reloaded = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => { if (!reloaded) { reloaded = true; location.reload(); } });
    } catch (e) { console.warn('SW lỗi:', e); }
  });
}

let deferred = null;
const listeners = new Set();
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; listeners.forEach((f) => f()); });
  window.addEventListener('appinstalled', () => { deferred = null; listeners.forEach((f) => f()); });
}

export function useInstall() {
  const [, tick] = useState(0);
  useEffect(() => { const f = () => tick((n) => n + 1); listeners.add(f); return () => listeners.delete(f); }, []);
  const standalone = typeof window !== 'undefined' && (matchMedia('(display-mode: standalone)').matches || navigator.standalone);
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  return {
    installed: !!standalone,
    canPrompt: !!deferred,
    iosHint: ios && !standalone,   // iOS không có prompt: hướng dẫn Chia sẻ → Thêm vào MH chính
    install: async () => { if (!deferred) return; deferred.prompt(); await deferred.userChoice; deferred = null; listeners.forEach((f) => f()); },
  };
}

export function useOnline() {
  const [on, setOn] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  useEffect(() => {
    const u = () => setOn(true), d = () => setOn(false);
    window.addEventListener('online', u); window.addEventListener('offline', d);
    return () => { window.removeEventListener('online', u); window.removeEventListener('offline', d); };
  }, []);
  return on;
}
