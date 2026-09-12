// Enchant Advisor's offline service worker.
//
// The whole app is static (no backend, no per-user data — see PROJECT.md),
// so caching everything genuinely means it keeps working with no
// connection after the first visit, not just satisfying the "installable"
// checkbox. Strategy is stale-while-revalidate: answer instantly from
// cache when we have it, while quietly refreshing that cache from the
// network in the background for next time.
//
// Bump CACHE_NAME whenever a deploy should force everyone's cached copy to
// be dropped (old caches are cleaned up automatically on activate).
const CACHE_NAME = "enchant-advisor-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response.ok) cache.put(event.request, response.clone());
          return response;
        })
        .catch(() => cached);
      return cached ?? networkFetch;
    })
  );
});
