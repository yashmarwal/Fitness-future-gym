const CACHE_NAME = "ff-shell-v1";
const OFFLINE_URL = "/offline.html";
const PRECACHE_URLS = [OFFLINE_URL, "/icon-192.png", "/icon-512.png"];

// Next.js's /_next/static/* files are content-hashed — a new build always
// means a new URL, never a changed one at the same URL — so "cache once,
// serve forever from here on" is exactly correct for these, unlike pages
// or API responses. This is what actually speeds up an installed PWA's
// cold launch (opened after being fully closed, which is what "start_url"
// in manifest.json boots into) after the very first install: the JS/CSS
// chunks come from Cache Storage instead of a fresh network fetch every
// single time. Separate cache name from CACHE_NAME (see activate below) so
// a shell-precache version bump doesn't wipe every asset a member already has.
const STATIC_ASSET_CACHE = "ff-static-assets-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  const keep = new Set([CACHE_NAME, STATIC_ASSET_CACHE]);
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => !keep.has(key)).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Network-first for page navigations, falling back to the offline page.
  // API calls and every other dynamic request are left to the network
  // as-is — this app has authenticated/dynamic content that must never be
  // served stale.
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // Cache-first for this app's own build output only (same-origin, under
  // /_next/static/). Never intercepts cross-origin requests (Google Fonts
  // already sets its own long-lived cache headers) or anything dynamic.
  if (
    event.request.method === "GET" &&
    url.origin === self.location.origin &&
    url.pathname.startsWith("/_next/static/")
  ) {
    event.respondWith(
      caches.open(STATIC_ASSET_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        const response = await fetch(event.request);
        if (response.ok) cache.put(event.request, response.clone());
        return response;
      })
    );
  }
});

// Web Push: the payload is whatever JSON pushNotifications.ts sent
// ({title, body, url}) — shown as a real OS-level notification even if the
// app isn't open. Falls back to sane defaults if the payload is missing or
// unparseable so a malformed push never surfaces as a blank notification.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }

  const title = data.title || "Fitness Future Gym";
  const options = {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: data.url || "/dashboard" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Tapping the notification focuses an already-open tab on that URL if one
// exists, otherwise opens a new one — the usual "resume the app" pattern.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
