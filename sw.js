/* Popote — service worker.
   Bumper VERSION à CHAQUE déploiement, sinon le téléphone garde
   l'ancienne version en cache. */
const VERSION = "v6";
const CACHE_NAME = `popote-${VERSION}`;
const RUNTIME = "popote-cdn";   // SDK Firebase, gardé pour le hors-ligne

const ASSETS = [
  "./",
  "./index.html",
  "./style.css?v=6",
  "./js/app.js?v=6",
  "./js/data.js",
  "./js/store.js",
  "./js/sync.js",
  "./js/ui.js",
  "./js/motion.js",
  "./js/import.js",
  "./js/cook.js",
  "./js/photos.js",
  "./js/lexicon.js",
  "./js/lexicon-data.js",
  "./js/ocr.js",
  "./js/shop.js",
  "./js/bilan.js",
  "./firebase-config.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-180.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME && k !== RUNTIME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Coquille et modules : réseau d'abord (un déploiement se voit au
   prochain lancement), cache en secours hors ligne. Le SDK Firebase
   est versionné dans son URL : cache d'abord. Firestore lui-même
   (firestore.googleapis.com) ne passe jamais par ici. */
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;

  /* Le lecteur de captures (Tesseract) aussi : versionné, cache d'abord. */
  if ((url.hostname === "www.gstatic.com" && url.pathname.startsWith("/firebasejs/")) ||
      (url.hostname === "cdn.jsdelivr.net" && /@\d/.test(url.pathname))) {
    e.respondWith(caches.open(RUNTIME).then(async (c) => {
      const hit = await c.match(e.request);
      if (hit) return hit;
      const res = await fetch(e.request);
      if (res.ok) c.put(e.request, res.clone());
      return res;
    }));
    return;
  }

  if (url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) caches.open(CACHE_NAME).then((c) => c.put(e.request, res.clone()));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: false }).then((r) => r || caches.match("./index.html")))
  );
});
