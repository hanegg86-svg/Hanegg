// sw.js - Service Worker for Han Vocab & Learning Games
const CACHE_NAME = 'han-vocab-cache-v4';

// รายการไฟล์ที่ต้องการทำ Pre-cache (ตัด Asset ของ Town Builder ออกทั้งหมดแล้ว)
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './core.js',
    './game-vocab.js',
    './game-math.js',
    './game-td.js',
    './game-plant.js',
    './game-rpg.js',
    './game-farm.js',
    './mario.png',
    './luigi.png',
    './peach.png',
    './rosalina.png',
    './mushroom.png',
    './turtle.png',
    './boss.png'
];

// 1. ติดตั้ง Service Worker และบังคับเปิดใช้งานทันที
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Caching app shell & active minigames v4');
            return cache.addAll(ASSETS_TO_CACHE);
        }).catch((err) => {
            console.warn('[Service Worker] Pre-cache failed for some assets:', err);
        })
    );
});

// 2. ล้างแคชเวอร์ชันเก่าทั้งหมดทันทีที่ Activate และเข้าควบคุมหน้าเว็บทันที
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache completely:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => {
            return self.clients.claim();
        }).then(() => {
            // แจ้ง Client ทุกหน้าที่เปิดอยู่ให้ทราบว่ามีการอัปเดตเวอร์ชันใหม่
            return self.clients.matchAll().then((clients) => {
                clients.forEach((client) => {
                    client.postMessage({ action: 'cacheUpdated', version: CACHE_NAME });
                });
            });
        })
    );
});

// 3. ดักจับการ Request ไฟล์ (Network First หรือ Stale-While-Revalidate)
self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);

    // ข้ามการแคชสำหรับ Firebase Realtime Database, Gemini API และบริการภายนอก
    if (
        event.request.method !== 'GET' ||
        requestUrl.origin !== self.location.origin ||
        requestUrl.pathname.includes('/v1beta/models') ||
        requestUrl.hostname.includes('firebaseio.com') ||
        requestUrl.hostname.includes('googleapis.com')
    ) {
        return;
    }

    // กลยุทธ์ Stale-While-Revalidate: คืนแคชก่อนเพื่อความรวดเร็ว และอัปเดตไฟล์ใหม่จากเครือข่ายเบื้องหลัง
    event.respondWith(
        caches.open(CACHE_NAME).then(async (cache) => {
            const cachedResponse = await cache.match(event.request);
            
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    cache.put(event.request, networkResponse.clone());
                }
                return networkResponse;
            }).catch(() => {
                return cachedResponse;
            });

            return cachedResponse || fetchPromise;
        })
    );
});

// 4. รับคำสั่งล้างแคชแบบ Manual จากหน้าต่างตั้งค่าผู้ปกครอง
self.addEventListener('message', (event) => {
    if (event.data && event.data.action === 'skipWaiting') {
        self.skipWaiting();
    } else if (event.data && event.data.action
