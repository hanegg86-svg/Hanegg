// ==========================================
// --- PWA SERVICE WORKER (UPDATED CACHE) ---
// ==========================================
const CACHE_NAME = 'kids-vocab-v6'; // ✨ ขยับเป็น v6 เพื่ออัปเดต UI หน้าสร้างเมือง
const ASSETS_TO_CACHE = [
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
    
    // 🎵 ไฟล์เสียงดนตรีประกอบ (อัปเดตใหม่)
    './bgm.mp3',

    // รูปภาพสิ่งปลูกสร้าง
    './house_lvl1.png', './house_lvl2.png', './house_lvl3.png',
    './farm_lvl1.png', './farm_lvl2.png', './farm_lvl3.png',
    './lumber_lvl1.png', './lumber_lvl2.png', './lumber_lvl3.png',
    // รูปอวาตาร์ตัวละคร
    './luigi.png', './rosalina.png', './mario.png', './peach.png'
];

self.addEventListener('install', (event) => {
    self.skipWaiting(); // บังคับให้ SW ตัวใหม่ทำงานทันที
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        })
    );
    self.clients.claim(); // บังคับเตะ Cache เก่าทิ้ง
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || fetch(event.request);
        })
    );
});
