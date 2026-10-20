/* =========================================================
   HTML Vault Pro — Service Worker
   Strategi:
   - Navigation (buka app)  : network-first  → fallback cache
   - Asset statis           : stale-while-revalidate
   - Request non-GET / beda origin : dilewatkan
   ========================================================= */

const VERSION = "1.0.1";
const STATIC_CACHE  = "vault-static-"  + VERSION;
const RUNTIME_CACHE = "vault-runtime-" + VERSION;

/* Path relatif terhadap lokasi sw.js → aman untuk deploy di root maupun subfolder */
const PRECACHE = [
  "./",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

/* ---------- INSTALL ---------- */
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    await Promise.allSettled(
      PRECACHE.map((url) => cache.add(new Request(url, { cache: "reload" })))
    );
  })());
});

/* ---------- ACTIVATE ---------- */
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE)
        .map((k) => caches.delete(k))
    );
    if (self.registration.navigationPreload) {
      try { await self.registration.navigationPreload.disable(); } catch (e) {}
    }
    await self.clients.claim();
  })());
});

/* ---------- MESSAGE ---------- */
self.addEventListener("message", (event) => {
  const data = event.data;
  if (data === "SKIP_WAITING") self.skipWaiting();
  if (data && data.type === "CLEAR_CACHE") {
    event.waitUntil(
      caches.keys().then((keys) =>
        Promise.all(keys.map((k) => caches.delete(k)))
      )
    );
  }
});

/* ---------- FETCH ---------- */
self.addEventListener("fetch", (event) => {
  const req = event.request;

  if (req.method !== "GET") return;

  const url = new URL(req.url);

  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith("/sw.js")) return;
  if (req.headers.has("range")) return;

  if (req.mode === "navigate") {
    event.respondWith(networkFirst(req));
    return;
  }

  event.respondWith(staleWhileRevalidate(req));
});

/* ---------- STRATEGI ---------- */

async function networkFirst(req) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone()).catch(() => {});
    return res;
  } catch (err) {
    const hit = await cache.match(req);
    if (hit) return hit;

    const shell =
      (await caches.match("./")) ||
      (await caches.match("./index.html"));
    if (shell) return shell;

    return new Response(
      '<!doctype html><meta charset="utf-8"><title>Offline</title>' +
      '<body style="font:15px system-ui;padding:40px;text-align:center">' +
      "<h2>Offline</h2><p>Aplikasi belum tersimpan di cache. Buka sekali saat online.</p>",
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(req);

  const network = fetch(req)
    .then((res) => {
      if (res && res.ok && res.type === "basic") {
        cache.put(req, res.clone()).catch(() => {});
      }
      return res;
    })
    .catch(() => null);

  if (cached) return cached;

  const res = await network;
  if (res) return res;

  return new Response("", { status: 504, statusText: "Offline" });
}