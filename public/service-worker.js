// Retire the legacy cache-first worker. An HTML fallback must not replace API
// failures or pin users to an archived demonstration build.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('obra360-')) await caches.delete(key);
    }
    await self.clients.claim();
    await self.registration.unregister();
  })());
});
