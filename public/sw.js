// Minimal service worker — exists primarily to satisfy PWA installability
// criteria in browsers that require an active worker before showing the
// install prompt. Deliberately does NOT cache the app shell or assets: this
// app is under active development and Vite's hashed filenames already get
// correct long-lived HTTP caching from the browser, so a hand-rolled cache
// here would risk serving stale JS/CSS after a deploy.
//
// skipWaiting + clients.claim so a new worker takes over immediately on
// update instead of leaving a tab stuck on an old one.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // Intentional no-op passthrough — not calling event.respondWith() means
  // every request just goes to the network as normal.
});
