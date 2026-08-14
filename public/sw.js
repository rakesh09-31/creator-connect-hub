self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// A simple fetch listener is required by most browsers to trigger the PWA install prompt.
self.addEventListener('fetch', (event) => {
  // Let the browser handle the request naturally
  return;
});
