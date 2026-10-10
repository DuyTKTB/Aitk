/* sw.js — service worker.
   Tăng VERSION mỗi lần phát hành để làm mới cache cũ.
   - Điều hướng: mạng trước, rớt thì dùng bản đã lưu, cuối cùng /offline.html
   - File tĩnh cùng origin: trả bản cache ngay, cập nhật nền (stale-while-revalidate)
   - /api/* và mọi request không phải GET: KHÔNG đụng (chat CUAI, phản hồi, đăng nhập) */
const VERSION = 'v1';
const SHELL = `cuai-shell-${VERSION}`;
const ASSETS = `cuai-assets-${VERSION}`;
const PRECACHE = ['/', '/offline.html', '/manifest.webmanifest', '/logo.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(PRECACHE)));
  // KHÔNG skipWaiting ở đây: chờ người dùng bấm "Tải lại" để khỏi mất bài đang làm
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => ![SHELL, ASSETS].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (e) => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/')) return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(SHELL).then((c) => c.put('/', copy)); return res; })
        .catch(async () => (await caches.match('/')) || (await caches.match('/offline.html')))
    );
    return;
  }

  if (/\.(js|css|woff2?|png|jpe?g|svg|webp|ico)$/.test(url.pathname)) {
    e.respondWith(
      caches.open(ASSETS).then(async (cache) => {
        const hit = await cache.match(req);
        const net = fetch(req).then((res) => { if (res.ok) cache.put(req, res.clone()); return res; }).catch(() => hit);
        return hit || net;
      })
    );
  }
});
