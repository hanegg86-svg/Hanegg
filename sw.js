const CACHE_NAME = 'kids-app-v2'; // <--- เปลี่ยนเวอร์ชันตรงนี้เพื่อบังคับล้างแคชเดิม

const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './core.js',
  './quest-shop.js',
  './minigames-main.js',
  './game-vocab.js',
  './game-math.js',
  './game-rpg.js',
  './game-story.js',
  './game-td.js',
  './game-number-dungeon.js',
  './game-build.js',
  // --- เพิ่มรายชื่อรูปภาพสิ่งก่อสร้างใหม่ ---
  './house_lvl1.png',
  './house_lvl2.png',
  './house_lvl3.png',
  './lumber_lvl1.png',
  './lumber_lvl2.png',
  './lumber_lvl3.png',
  './farm_lvl1.png',
  './farm_lvl2.png',
  './farm_lvl3.png'
];

// ติดตั้ง Service Worker และบันทึกไฟล์ลง Cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// ลบ Cache เวอร์ชันเก่าทิ้งเมื่อมีการอัปเดต CACHE_NAME ใหม่
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// ดึงข้อมูลจาก Cache หรือ Network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
