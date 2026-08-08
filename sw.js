// Path: ./sw.js

// ปรับเวอร์ชันเป็น v9 เพื่อบังคับเคลียร์แคชและโหลดสคริปต์ game-td.js ใหม่
const CACHE_NAME = 'kids-vocab-v9';

// รายการไฟล์ที่ต้องการให้ Service Worker ทำการแคชไว้ใช้งานออฟไลน์
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
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@latest',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js'
];

// 1. Install Event: โหลดและบันทึกไฟล์สคริปต์ทั้งหมดลงใน Cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching updated app assets v9');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate Event: เคลียร์ Cache เวอร์ชันเก่าทิ้งทันทีเมื่อมีการอัปเดตระบบ
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event: พยายามดึงข้อมูลจาก Network ก่อน หากไม่มีเน็ตให้ดึงจาก Cache
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
