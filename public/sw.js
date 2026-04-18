// Taamun service worker — handles push notifications

self.addEventListener("install", (event) => {
  // Skip waiting to activate immediately
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  // Take control of all pages immediately
  event.waitUntil(self.clients.claim());
});

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
        // Focus existing tab if open
        const existing = clientsArr.find((c) => c.url.includes(url));
        if (existing) return existing.focus();
        // Otherwise open new
        return self.clients.openWindow(url);
      })
  );
});
