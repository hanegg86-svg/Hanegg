// ==========================================
// --- SERVICE WORKER (FULL PWA CACHE MANAGER) ---
// ==========================================

const CACHE_NAME = 'kids-vocab-v3'; // อัปเดตเป็น v3 เพื่อล้างแคชเก่าที่สั่งล็อกแนวตั้ง[span_1](start_span)[span_1](end_span)

// รายการไฟล์ทั้งหมดในแอปเพื่อรองรับการใช้งานแบบ Offline 100%
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './Icon.png',
    
    // Core & System Scripts
    './core.js',
    './quest-shop.js',
    './minigames-main.js',
    
    // Mini-Game Scripts
    './game-vocab.js',
    './game-math.js',
    './game-rpg.js',
    './game-story.js',
    './game-td.js',
    './game-number-dungeon.js',
    './game-build2.js',

    // Character Avatars
    './mario.png',
    './peach.png',
    './luigi.png',
    './rosalina.png',

    // Town Builder Assets & Sound
    './bgm.mp3',
    './house_lvl1.png',
    './house_lvl2.png',
    './house_lvl3.png',
    './farm_lvl1.png',
    './farm_lvl2.png',
    './farm_lvl3.png',
    './lumber_lvl1.png',
    './lumber_lvl2.png',
    './lumber_lvl3.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return Promise.allSettled(
                ASSETS_TO_CACHE.map(url => cache.add(url).catch(err => console.warn(`Cache failed for: ${url}`, err)))
            );
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // รองรับเฉพาะ HTTP GET Request สำหรับ Cache Storage API เพื่อป้องกัน TypeError บน POST/PUT
    if (event.request.method !== 'GET') {
        return;
    }

    // ข้ามการ Cache API หรือ Firebase Requests
    if (event.request.url.includes('firebase') || event.request.url.includes('googleapis')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request).then((response) => {
                // บันทึกไฟล์ใหม่ๆ เข้า Cache อัตโนมัติเมื่อมีการโหลดครั้งแรก
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });
                return response;
            });
        }).catch(() => fetch(event.request))
    );
});
