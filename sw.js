// App-shell offline cache. Uploaded PDFs, annotations and study data live in IndexedDB.
const CACHE = 'prep-os-shell-v3-google';
const ASSETS = ['./','./index.html','./styles.css','./manifest.webmanifest','./icons/icon.svg','./curriculum.json','./js/app.js','./js/cloud.js','./cloud-config.js','./js/db.js','./js/engine.js','./js/questions.js'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok) { const clone = response.clone(); caches.open(CACHE).then(c => c.put(event.request, clone)); }
    return response;
  }).catch(() => caches.match(event.request)));
});
