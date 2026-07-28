const CACHE_NAME = 'kids-vocab-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './Icon.png',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@latest'
];

// ติดตั้ง Service Worker และ Cache ไฟล์พื้นฐาน
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// ดึงข้อมูลจาก Cache เมื่อ Offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
