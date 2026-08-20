// ==========================================
// --- PWA SERVICE WORKER (UPDATED CACHE) ---
// ==========================================
const CACHE_NAME = 'kids-vocab-v7'; // ✨ ขยับเป็น v7
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
    './game-build2.js', // ✨ เปลี่ยนมาจำไฟล์ชื่อใหม่
    
    // 🎵 ไฟล์เสียงดนตรีประกอบ
    './bgm.mp3',

    // รูปภาพสิ่งปลูกสร้าง
    './house_lvl1.png', './house_lvl2.png', './house_lvl3.png',
    './farm_lvl1.png', './farm_lvl2.png', './farm_lvl3.png',
    './lumber_lvl1.png', './lumber_lvl2.png', './lumber_lvl3.png',
    // รูปอวาตาร์ตัวละคร
    './luigi.png', './rosalina.png', './mario.png', './peach.png'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
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
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || fetch(event.request);
        })
    );
});
