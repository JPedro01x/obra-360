const CACHE_NAME = 'obra360-pwa-v1.0.0';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json'
];

// Service Worker Installation
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker Obra 360 PWA...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pré-carregando App Shell no Cache Storage...');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Service Worker Activation & Cache Cleanup
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Removendo cache antigo:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Interception with Network-First & Cache Fallback Strategies
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Bypass non-GET requests for background sync queue
  if (request.method !== 'GET') {
    return;
  }

  // API Requests Strategy: Network First, Fallback to Cache or Mock Offline Response
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(async () => {
          console.warn('[SW] Sem conexão com a API REST. Buscando no Cache offline...', request.url);
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // Return fallback JSON for offline state
          return new Response(
            JSON.stringify({
              status: 'OFFLINE_MODE',
              message: 'Modo Offline Ativo. Dados carregados do armazenamento local do canteiro de obras.',
              timestamp: new Date().toISOString()
            }),
            { headers: { 'Content-Type': 'application/json' } }
          );
        })
    );
    return;
  }

  // App Shell & Static Assets Strategy: Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse.clone()));
          }
          return networkResponse;
        })
        .catch(() => {
          console.log('[SW] Servindo asset do cache offline:', request.url);
        });

      return cachedResponse || fetchPromise || caches.match('/index.html');
    })
  );
});

// Background Sync for Offline Queue
self.addEventListener('sync', (event) => {
  if (event.tag === 'obra360-sync-queue') {
    console.log('[SW] Executando Sincronização em Segundo Plano (Background Sync)...');
    event.waitUntil(syncOfflineData());
  }
});

async function syncOfflineData() {
  console.log('[SW] Processando fila de itens criados offline...');
  // Logic to notify active tabs to process IndexedDB sync queue
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({ type: 'PROCESS_SYNC_QUEUE' });
  });
}
