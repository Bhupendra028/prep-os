// Patch v4: network-first shell; preserve IndexedDB, PDFs and local study records.
const CACHE='prep-os-shell-v62-universal-20261108';
const ASSETS=['./','./index.html','./styles.css','./manifest.webmanifest','./icons/icon.svg','./curriculum.json','./js/app.js','./js/cloud.js','./js/drive.js','./js/sync.js','./drive-config.js','./cloud-config.js','./js/db.js','./js/engine.js','./js/questions.js'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('prep-os-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 const req=e.request; if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
 e.respondWith(fetch(req).then(r=>{if(r.ok){const copy=r.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(req,copy)));}return r;}).catch(async()=>{const c=await caches.match(req);if(c)return c;if(req.mode==='navigate')return caches.match('./index.html');return Response.error();}));
});
