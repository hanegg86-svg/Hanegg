const CACHE_NAME = 'kids-vocab-v1';

// รายการไฟล์ที่ต้องการ Cache ไว้ในเครื่อง เพื่อให้เปิดแอปตอนไม่มีเน็ตได้
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './Icon.png',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@latest',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js'
];

// 1. Install Event: โหลดไฟล์สำคัญเก็บลง Cache ทันทีที่ติดตั้ง Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching all app assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate Event: เคลียร์ Cacheเก่า เมื่อมีการอัปเดตเวอร์ชันใหม่
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

// 3. Fetch Event: กลยุทธ์ Network First falling back to Cache
// พยายามดึงข้อมูลสดจากเน็ตก่อน ถ้าไม่มีเน็ต (Offline) ถึงจะดึงไฟล์จาก Cache ในเครื่องมาแสดง
self.addEventListener('fetch', (event) => {
  // ข้ามการแคช Request ของ Realtime Database หรือ API ข้างนอกที่เป็น POST/PUT
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // ถ้าต่อเน็ตได้ ให้ก๊อปปี้ไฟล์ล่าสุดเก็บลง Cache ไว้ด้วย
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // ถ้าเน็ตหลุด/Offline ให้ดึงไฟล์จาก Cache มาใช้แทน
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // กรณีเปิดหน้าแรกตอน Offline
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
