// sw.js - Service Worker สำหรับจัดการ Offline Cache และบังคับเคลียร์แคชเวอร์ชันเก่าทันที (Force Clear)

const CACHE_NAME = 'kids-vocab-v7';

// รายการไฟล์ทั้งหมดที่ต้องดึงมาเก็บใน Cache เพื่อใช้งานแบบออฟไลน์
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './Icon.png',
    './Icon.png?v=5',
    './luigi.png',
    './rosalina.png',
    './mario.png',
    './peach.png',
    './core.js?v=5',
    './quest-shop.js?v=5',
    './minigames-main.js?v=5',
    './game-vocab.js?v=5',
    './game-math.js?v=5',
    './game-rpg.js?v=5',
    './game-story.js?v=5',
    './game-td.js?v=5',
    './game-number-dungeon.js?v=5',
    './game-build2.js',
    './game-plant.js?v=5'
];

// 1. ขั้นตอน Install: บังคับให้ Service Worker ตัวใหม่เปิดใช้งานทันที (skipWaiting)
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Caching all app assets (v7)');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// 2. ขั้นตอน Activate: กวาดล้างแคชเก่าทิ้งทั้งหมด และเข้ายึดการควบคุมทุกแท็บทันที (clients.claim)
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => {
            return self.clients.claim();
        })
    );
});

// 3. ขั้นตอน Fetch: ดึงหน้าหลัก (index.html) จาก Network ก่อนเสมอเพื่อรับ UI ล่าสุด
self.addEventListener('fetch', (event) => {
    // ข้ามการแคชคำขอไปยัง Google Gemini API และ Firebase Database
    if (event.request.url.includes('generativelanguage.googleapis.com') || 
        event.request.url.includes('firebaseio.com') ||
        event.request.url.includes('googleapis.com')) {
        return;
    }

    // สำหรับคำขอหน้าหลักและ Navigation: ดึงจาก Network ก่อนเสมอ หากออฟไลน์จึงเปิดจากแคช
    if (event.request.mode === 'navigate' || event.request.url.endsWith('index.html') || event.request.url.endsWith('/')) {
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
                    return caches.match('./index.html').then((res) => res || caches.match('./'));
                })
        );
        return;
    }

    // สำหรับไฟล์ Assets อื่นๆ: ตรวจสอบจาก Cache ก่อน หากไม่มีจึงดึงจาก Network
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request).then((networkResponse) => {
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }

                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return networkResponse;
            });
        })
    );
});
