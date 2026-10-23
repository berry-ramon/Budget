/* =========================================================
   POCKET PLAN SERVICE WORKER
   ---------------------------------------------------------
   - Precaches the app shell (skips any missing files).
   - Network-first for HTML so content updates ship.
   - Cache-first for static assets.
   - Ignores cross-origin requests.
   - Never caches failed responses.
   ========================================================= */

const CACHE = "pocket-plan-v2";
const SHELL = [
  "/",
  "/index.html",
  "/manifest.json",
  "/assets/icons/favicon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        Promise.all(
          SHELL.map((url) =>
            cache.add(url).catch((err) => {
              console.warn("[SW] skipped precache:", url, err);
            }),
          ),
        ),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.protocol === "blob:") return;

  /* Network-first for HTML so content stays fresh */
  const isHtml =
    request.mode === "navigate" ||
    request.headers.get("accept")?.includes("text/html");

  if (isHtml) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put("/index.html", copy));
          return response;
        })
        .catch(() =>
          caches
            .match("/index.html")
            .then((cached) => cached || Response.error()),
        ),
    );
    return;
  }

  /* Cache-first for static assets */
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok && response.type === "basic") {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        }),
    ),
  );
});
