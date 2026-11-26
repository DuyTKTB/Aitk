/* sw.js — service worker.
   Tăng VERSION mỗi lần phát hành để làm mới cache cũ.
   - Điều hướng: mạng trước, rớt thì dùng bản đã lưu, cuối cùng /offline.html
   - File tĩnh cùng origin: trả bản cache ngay, cập nhật nền (stale-while-revalidate)
   - /api/* và mọi request không phải GET: KHÔNG đụng (chat ELECAI, phản hồi, đăng nhập) */
const VERSION = 'v7';
const SHELL = `ELECAI-shell-${VERSION}`;
const ASSETS = `ELECAI-assets-${VERSION}`;
const PRECACHE = ['/', '/offline.html', '/manifest.json', '/favicon.ico', '/img/logo.png'];
const STATIC_INFO_PATHS = new Set([
  '/nha-sang-lap', '/nha-sang-lap.html',
  '/gioi-thieu', '/gioi-thieu.html',
  '/chinh-sach-bao-mat', '/chinh-sach-bao-mat.html',
  '/dieu-khoan-su-dung', '/dieu-khoan-su-dung.html',
  '/tro-ly-ai-giai-hoa', '/tro-ly-ai-giai-hoa.html',
  '/phong-thi-ao', '/phong-thi-ao.html',
  '/bang-tuan-hoan', '/bang-tuan-hoan.html',
  '/can-bang-phuong-trinh-hoa-hoc', '/can-bang-phuong-trinh-hoa-hoc.html',
  '/lo-trinh-on-thi-thpt-quoc-gia', '/lo-trinh-on-thi-thpt-quoc-gia.html',
  '/cong-thuc-hoa-hoc', '/cong-thuc-hoa-hoc.html',
  '/tai-lieu-hoa-hoc', '/tai-lieu-hoa-hoc.html',
  '/tinh-diem-xet-tuyen-dai-hoc', '/tinh-diem-xet-tuyen-dai-hoc.html',
  '/tra-cuu-diem-chuan', '/tra-cuu-diem-chuan.html',
  '/dinh-huong-nghe-nghiep', '/dinh-huong-nghe-nghiep.html',
  '/tro-choi-khoa-hoc', '/tro-choi-khoa-hoc.html',
  '/ai-doc-studio', '/ai-doc-studio.html',
  '/bang-phan-tuong-tac', '/bang-phan-tuong-tac.html',
  '/quiz', '/quiz.html',
  '/bang-xep-hang', '/bang-xep-hang.html',
  '/mo-phong-khtn', '/mo-phong-khtn.html',
]);

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
  if (
    req.method !== 'GET' ||
    url.origin !== location.origin ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/__/')
  ) return;

  if (req.mode === 'navigate') {
    if (
      STATIC_INFO_PATHS.has(url.pathname) ||
      url.pathname === '/cong-dong' ||
      url.pathname.startsWith('/cong-dong/') ||
      url.pathname.startsWith('/chu-de/')
    ) {
      e.respondWith(fetch(req).catch(async () => (await caches.match(req)) || (await caches.match('/offline.html'))));
      return;
    }
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (url.pathname === '/') {
            const copy = res.clone();
            caches.open(SHELL).then((c) => c.put('/', copy));
          }
          return res;
        })
        .catch(async () => (await caches.match('/')) || (await caches.match('/offline.html')))
    );
    return;
  }

  if (/\.(js|css|woff2?|png|jpe?g|svg|webp|avif|wasm|ico)$/.test(url.pathname)) {
    e.respondWith(
      caches.open(ASSETS).then(async (cache) => {
        const hit = await cache.match(req);
        const net = fetch(req).then((res) => { if (res.ok) cache.put(req, res.clone()); return res; }).catch(() => hit);
        return hit || net;
      })
    );
  }
});

/* Khi người dùng bấm vào Thông báo đẩy (Push Notification / @mọi người) */
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const targetUrl = (e.notification?.data && e.notification.data.url) || '/#home';
  const targetTab = (e.notification?.data && e.notification.data.channel) || 'community';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({ type: 'OPEN_COMMUNITY', tab: targetTab });
          return;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return undefined;
    })
  );
});
