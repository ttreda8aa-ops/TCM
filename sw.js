/**
 * Service Worker - Offline Shell + System Notifications
 *
 * - Caches the app shell (folder or flat layout) so the platform opens offline.
 * - Caches the essential CDN libraries (Tailwind, Appwrite, export tools).
 * - Shows system notifications (especially on Android / mobile Chrome).
 * - Focuses/opens the app when a notification is clicked.
 */

const SW_VERSION = '20261105-3';
const CACHE_VERSION = 'tcm-shell-' + SW_VERSION;
const OFFLINE_FALLBACK = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>غير متصل</title>
<style>body{font-family:system-ui,sans-serif;background:#f8fafc;color:#0f172a;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px;text-align:center}
.box{max-width:420px;background:#fff;border:1px solid #e2e8f0;border-radius:20px;padding:32px;box-shadow:0 10px 30px rgba(2,132,199,.12)}
h1{font-size:20px;margin:0 0 10px}p{color:#475569;line-height:1.8;margin:0 0 18px}
button{background:linear-gradient(90deg,#0284c7,#9333ea);color:#fff;border:0;border-radius:12px;padding:12px 22px;font-size:15px;font-weight:700;cursor:pointer}</style></head>
<body><div class="box"><h1>لا يوجد اتصال بالإنترنت</h1>
<p>افتح المنصة مرة واحدة وأنت متصل حتى يتم حفظ الجدول والامتحانات على جهازك، بعدها ستفتح تلقائياً بدون إنترنت.</p>
<button onclick="location.reload()">إعادة المحاولة</button></div></body></html>`;

// Same-origin app shell. Both layouts are listed because the site is uploaded
// either as folders (js/, css/) or as flat files in the repository root.
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
  './favicon-32.png',
  './favicon-16.png',

  // Folder layout
  './css/custom.css',
  './js/appwrite-client.js',
  './js/notifications.js',
  './js/push.js',
  './js/pwa.js',
  './js/store.js',
  './js/auth.js',
  './js/ui.js',
  './js/landing.js',
  './js/student.js',
  './js/rep.js',
  './js/admin.js',
  './js/app.js',

  // Flat layout
  './custom.css',
  './appwrite-client.js',
  './notifications.js',
  './push.js',
  './pwa.js',
  './store.js',
  './auth.js',
  './ui.js',
  './landing.js',
  './student.js',
  './rep.js',
  './admin.js',
  './app.js'
];

// Essential third-party libraries. They are cached as opaque responses so the
// platform keeps its styling and export tools when the connection drops.
const EXTERNAL_ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/appwrite@14.0.1',
  'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

const EXTERNAL_HOSTS = [
  'cdn.tailwindcss.com',
  'cdn.jsdelivr.net',
  'cdnjs.cloudflare.com'
];

function isCacheable(response) {
  return !!response && (response.ok || response.type === 'opaque');
}

function isAllowedExternal(url) {
  return EXTERNAL_HOSTS.includes(url.hostname);
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);

    const cacheOne = async (url, options) => {
      try {
        const response = await fetch(url, options);
        if (isCacheable(response)) await cache.put(url, response);
      } catch (e) {
        // Missing file in the other layout (flat vs folders) - ignore.
      }
    };

    await Promise.all([
      ...CORE_ASSETS.map((url) => cacheOne(url, { cache: 'reload' })),
      ...EXTERNAL_ASSETS.map((url) => cacheOne(url, { mode: 'no-cors', cache: 'reload' }))
    ]);

    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key !== CACHE_VERSION && key.indexOf('tcm-') === 0)
        .map((key) => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_VERSION);
  let response = null;

  try {
    response = await fetch(request);
  } catch (e) {
    response = null;
  }

  if (response && response.ok) {
    const path = new URL(request.url).pathname;
    if (path.endsWith('/') || path.endsWith('/index.html')) {
      cache.put(request, response.clone());
    }
    return response;
  }

  // Network failed or returned an error page (proxy/offline): use the shell.
  return (
    (await cache.match(request)) ||
    (await cache.match('./index.html')) ||
    (await cache.match('./')) ||
    new Response(OFFLINE_FALLBACK, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    })
  );
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cached =
    (await cache.match(request)) ||
    (await cache.match(request, { ignoreSearch: true }));

  const network = fetch(request)
    .then(async (response) => {
      if (isCacheable(response)) await cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  if (cached) {
    // Refresh in the background without delaying the response.
    network.catch(() => null);
    return cached;
  }

  const fresh = await network;
  if (fresh && (fresh.ok || fresh.type === 'opaque' || fresh.status === 404)) {
    return fresh;
  }

  return new Response('', { status: 504, statusText: 'Offline' });
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Appwrite API and other dynamic cross-origin calls always go to the network.
  if (url.origin !== self.location.origin) {
    if (request.method !== 'GET' || !isAllowedExternal(url)) return;
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Never intercept the service worker file itself.
  if (url.pathname.endsWith('/sw.js')) return;

  // OneSignal owns its own workers. Let the browser fetch them directly so
  // updates and the root PWA worker never collide.
  if (/\/onesignalsdkworker\.js$/i.test(url.pathname)) return;
  if (url.pathname.includes('/push/onesignal/')) return;

  // The page probes js/app.js and css/custom.css with HEAD to detect the layout.
  // Answer from the cache so the correct layout is also used offline.
  if (request.method === 'HEAD') {
    event.respondWith(headFallback(request));
    return;
  }

  if (request.method !== 'GET') return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});

async function headFallback(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request, { ignoreMethod: true });
  if (cached) return new Response(null, { status: 200 });

  try {
    return await fetch(request);
  } catch (e) {
    return new Response(null, { status: 504, statusText: 'Offline' });
  }
}

// Allow the page to activate a waiting worker immediately after an update.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'PING') {
    const port = event.ports && event.ports[0];
    if (port) port.postMessage({ version: SW_VERSION, cache: CACHE_VERSION });
  }
});

// Web Push support (ready for a future push service).
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    payload = { body: event.data ? event.data.text() : '' };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'تنبيه أكاديمي جديد ⚠️', {
      body: payload.body || '',
      icon: './icon-192.png',
      badge: './icon-192.png',
      tag: payload.tag || 'academic_alert',
      renotify: true,
      dir: 'rtl',
      lang: 'ar',
      vibrate: [200, 100, 200],
      data: { url: payload.url || './index.html' }
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  notification.close();

  const targetUrl = (notification.data && notification.data.url) || self.registration.scope;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if ('navigate' in client && targetUrl) {
            return client.navigate(targetUrl).then((navigated) => {
              if (navigated && 'focus' in navigated) return navigated.focus();
              return client.focus();
            });
          }
          return client.focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});
