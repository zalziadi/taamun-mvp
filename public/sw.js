// Taamun service worker — handles push notifications + offline caching

const CACHE_VERSION = "taamun-v2";
const STATIC_CACHE = `${CACHE_VERSION}-static`;

// Static shell assets (cache-first)
const STATIC_ASSETS = [
  "/manifest.json",
  "/brand/favicon.svg",
  "/brand/logo-mark.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  // Clean up old caches
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("taamun-") && !k.startsWith(CACHE_VERSION))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle GETs
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Skip cross-origin, non-http, and API requests
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;
  if (url.pathname.startsWith("/_next/data/")) return;

  // Static assets: cache-first with network update
  if (
    STATIC_ASSETS.includes(url.pathname) ||
    url.pathname.startsWith("/brand/") ||
    url.pathname.startsWith("/_next/static/")
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // HTML pages: network-first with offline fallback
  if (request.destination === "document") {
    event.respondWith(networkFirst(request));
    return;
  }
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return cached || new Response("", { status: 504 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response("أنت غير متصل بالإنترنت. حاول مجدداً.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

// ── Push notifications (unchanged from v1.1) ──

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "تمعّن", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "تمعّن";
  const options = {
    body: data.body || "آية اليوم تنتظرك",
    icon: "/brand/favicon.svg",
    badge: "/brand/favicon.svg",
    dir: "rtl",
    lang: "ar",
    tag: data.tag || "taamun-reminder",
    requireInteraction: false,
    data: {
      url: data.url || "/",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientsArr) => {
        const existing = clientsArr.find((c) => c.url.includes(url));
        if (existing) return existing.focus();
        return self.clients.openWindow(url);
      })
  );
});
