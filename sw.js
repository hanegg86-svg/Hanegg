// sw.js - Service Worker for Han Vocab & Learning Games
const CACHE_NAME = 'han-vocab-cache-v2';

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

// 1. ติดตั้ง Service Worker และบันทึกไฟล์แคชใหม่
self.addEventListener('install', (event) => {
    // บังคับให้ Service Worker ตัวใหม่ทำงานทันที ไม่ต้องรอปิดแท็บเก่า
    self.skipWaiting();
    
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Caching app shell & active minigames');
            return cache.addAll(ASSETS_TO_CACHE);
        }).catch((err) => {
            console.warn('[Service Worker] Pre-cache failed for some assets:', err);
        })
    );
});

// 2. เคลียร์แคชเก่าทั้งหมดทันทีที่ Service Worker ตัวใหม่ Activate
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
            // เข้าควบคุมหน้าเว็บทั้งหมดทันที
            return self.clients.claim();
        })
    );
});

// 3. ดักจับการ Request ไฟล์ (Network First หรือ Cache Fallback)
self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);

    // ข้ามการแคชสำหรับ Firebase Realtime Database, Gemini API และภายนอก
    if (
        event.request.method !== 'GET' ||
        requestUrl.origin !== self.location.origin ||
        requestUrl.pathname.includes('/v1beta/models') ||
        requestUrl.hostname.includes('firebaseio.com') ||
        requestUrl.hostname.includes('googleapis.com')
    ) {
        return;
    }

    // กลยุทธ์ Stale-While-Revalidate: ดึงจากแคชเพื่อความเร็ว แล้วอัปเดตจากเครือข่ายเบื้องหลัง
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

// 4. รับ Event การสั่งล้างแคชจากหน้าบ้าน (Manual Clear Cache Command)
self.addEventListener('message', (event) => {
    if (event.data && event.data.action === 'skipWaiting') {
        self.skipWaiting();
    } else if (event.data && event.data.action === 'clearCache') {
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => caches.delete(cache))
            );
        }).then(() => {
            if (event.ports && event.ports[0]) {
                event.ports[0].postMessage({ success: true });
            }
        });
    }
});
```[span_1](start_span)[span_1](end_span)

---

### สรุปรายการโค้ดที่ส่งมา:
* **`sw.js` (ฉบับเต็ม)**: ประกอบด้วยการจัดการ Cache Storage ทั้งหมด ได้แก่ การทำ Pre-cache ไฟล์ระบบ (`install`), การลบแคชเวอร์ชันเก่าทิ้งเมื่ออัปเดต (`activate`), การดักคำขอไฟล์แบบ Stale-While-Revalidate (`fetch`), และการรับคำสั่ง `clearCache` จากหน้าบ้านเพื่อล้างแคชทันที (`message`)[span_2](start_span)[span_2](end_span)

ไฟล์ถัดไปคือ **`core.js`** (ไฟล์หลักที่มีฟังก์ชัน `clearAppCacheAndReload()`) ให้ส่งโค้ดฉบับเต็มเลยไหมครับ?[span_3](start_span)[span_3](end_span)
