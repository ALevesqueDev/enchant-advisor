// Serves the offline service worker (see the script body below for its own
// header comment on the caching strategy) as a dynamic route instead of a
// static public/sw.js file, specifically so CACHE_NAME always embeds the
// CURRENT app version automatically. A real user report (2026-09-13)
// traced back to this: the static file's CACHE_NAME was a hand-typed
// constant that never got bumped across 13 deploys this session, so
// returning visitors kept seeing a stale cached copy on their first load
// after every single release (stale-while-revalidate answers instantly
// from whatever's cached, then refreshes in the background for NEXT
// time) -- silent, easy to forget, and it already recurred. Deriving
// CACHE_NAME from APP_VERSION here means every version bump automatically
// invalidates the old cache, with nothing left to remember by hand.
import { APP_VERSION } from "@/lib/version";

// The generated script only depends on APP_VERSION (a build-time
// constant), so it's identical for every request until the next deploy --
// force static generation rather than re-running GET() on every request.
export const dynamic = "force-static";

function serviceWorkerScript(cacheName: string): string {
  return `// Enchant Advisor's offline service worker.
//
// The whole app is static (no backend, no per-user data -- see
// PROJECT.md), so caching everything genuinely means it keeps working
// with no connection after the first visit, not just satisfying the
// "installable" checkbox. Strategy is stale-while-revalidate: answer
// instantly from cache when we have it, while quietly refreshing that
// cache from the network in the background for next time.
//
// CACHE_NAME is generated (see src/app/sw.js/route.ts) from the app's own
// version, so every release automatically drops everyone's old cache --
// nothing to remember to bump by hand.
const CACHE_NAME = ${JSON.stringify(cacheName)};

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
`;
}

export async function GET() {
  return new Response(serviceWorkerScript(`enchant-advisor-v${APP_VERSION}`), {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      // A service worker script itself must never be aggressively cached --
      // the whole point of versioning CACHE_NAME per release is defeated if
      // the browser (or an edge cache) keeps serving yesterday's copy of
      // THIS file. Match the no-cache posture browsers already apply to
      // same-URL service worker scripts by convention.
      "Cache-Control": "no-cache",
    },
  });
}
