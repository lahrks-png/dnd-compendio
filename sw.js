const CACHE_NAME = 'dnd-compendium-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Installazione Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aperta');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Attivazione Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Cancellazione cache vecchia:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Intercettazione delle richieste
self.addEventListener('fetch', (event) => {
  // Ignora richieste Firebase e API esterne
  if (
    event.request.url.includes('firebase') ||
    event.request.url.includes('gstatic') ||
    event.request.url.includes('googleapis') ||
    event.request.url.includes('cdn.tailwindcss') ||
    event.request.url.includes('unpkg.com')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - restituisci la risposta dalla cache
        if (response) {
          return response;
        }

        // Clona la richiesta
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then((response) => {
          // Verifica se la risposta è valida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clona la risposta
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
  );
});

// Gestione messaggi
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});