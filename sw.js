// ==========================================
// --- SERVICE WORKER (FULL PWA CACHE MANAGER) ---
// ==========================================

const CACHE_NAME = 'kids-vocab-v7'; // อัปเดตเป็น v7 เพื่อบังคับล้างแคชเก่าและโหลดหน้า index.html ใหม่ล่าสุด

// รายการไฟล์ทั้งหมดในแอปเพื่อรองรับการใช้งานแบบ Offline 100%
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './Icon.png?v=2',
    
    // Core & System Scripts (ระบุ ?v=2 ให้ตรงกับ index.html)
    './core.js?v=2',
    './quest-shop.js?v=2',
    './minigames-main.js?v=2',
    
    // Mini-Game Scripts
    './game-vocab.js?v=2',
    './game-math.js?v=2',
    './game-rpg.js?v=2',
    './game-story.js?v=2',
    './game-td.js?v=2',
    './game-number-dungeon.js?v=2',
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

    // ปรับเป็น Network-First Strategy: ดึงไฟล์ใหม่ล่าสุดจากเซิร์ฟเวอร์ก่อนเสมอ
    event.respondWith(
        fetch(event.request).then((response) => {
            if (response && response.status === 200 && response.type === 'basic') {
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });
            }
            return response;
        }).catch(() => {
            // หากไม่มีอินเทอร์เน็ต ค่อยดึงไฟล์จาก Cache ในเครื่องมาใช้งานแทน
            return caches.match(event.request);
        })
    );
});
