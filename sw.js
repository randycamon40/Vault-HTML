
const CACHE = "vault-pro-v3-pwa-clean";
const ASSETS_CORE = ["./", "./manifest.json", "./icon-192.png", "./icon-512.png", "./privacy.html", "./terms.html"];

self.addEventListener("install", e => {
  // langsung aktif tanpa nunggu
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS_CORE))
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))
    ).then(()=>self.clients.claim())
  );
});

// terima pesan skip waiting dari client
self.addEventListener("message", e => {
  if(e.data && e.data.type === 'SKIP_WAITING'){
    self.skipWaiting();
  }
});

self.addEventListener("fetch", e => {
  const req = e.request;
  const url = new URL(req.url);

  // Untuk navigasi / index.html -> network-first biar update langsung
  if(req.mode === 'navigate' || url.pathname.endsWith('index.html') || url.pathname === '/' || url.pathname.endsWith('/')){
    e.respondWith(
      fetch(req)
        .then(res => {
          // simpan versi baru ke cache
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(req, clone));
          return res;
        })
        .catch(() => {
          // offline fallback
          return caches.match(req).then(r => r || caches.match('./index.html'));
        })
    );
    return;
  }

  // Untuk asset lain (icon, manifest) -> cache-first, fallback network
  if(req.method === 'GET'){
    e.respondWith(
      caches.match(req).then(cached => {
        if(cached) return cached;
        return fetch(req).then(res => {
          // cache kan asset baru
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(req, clone));
          return res;
        }).catch(()=>cached);
      })
    );
  }
});
