// Path: ./sw.js
const CACHE_NAME = 'kids-vocab-v14'; // อัปเดตแคชเป็น v14 รวม Plant Scan AI Game

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './Icon.png',
  './core.js',
  './quest-shop.js',
  './minigames-main.js',
  './game-vocab.js',
  './game-math.js',
  './game-rpg.js',
  './game-story.js',
  './game-td.js',
  './game-number-dungeon.js',
  './game-build2.js',
  './game-plant.js',
  './mushroom.png',
  './turtle.png',
  './boss.png',
  './mario.png',
  './luigi.png',
  './peach.png',
  './rosalina.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
