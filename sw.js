// sw.js - Service Worker สำหรับจัดการ Offline Cache ของแอป Kids Vocab

const CACHE_NAME = 'kids-vocab-v2';

// รายการไฟล์ทั้งหมดที่ต้องดึงมาเก็บใน Cache เพื่อใช้งานแบบออฟไลน์
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './Icon.png?v=2',
    './luigi.png',
    './rosalina.png',
    './mario.png',
    './peach.png',
    './core.js?v=2',
    './quest-shop.js?v=2',
    './minigames-main.js?v=2',
    './game-vocab.js?v=2',
    './game-math.js?v=2',
    './game-rpg.js?v=2',
    './game-story.js?v=2',
    './game-td.js?v=2',
    './game-number-dungeon.js?v=2',
    './game-build2.js',
    './game-plant.js?v=2'
];

// 1. ขั้นตอน Install: ทำการดาวน์โหลดและบันทึกไฟล์ลง Cache
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Caching all app assets');
            return cache.addAll(ASSETS_TO_CACHE);
        }).then(() => {
            return self.skipWaiting();
        })
    );
});

// 2. ขั้นตอน Activate: ทำความสะอาดลบ Cache เวอร์ชันเก่าทิ้ง
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

// 3. ขั้นตอน Fetch: ค้นหาไฟล์จาก Cache ก่อน หากไม่มีจึงดึงจาก Network
self.addEventListener('fetch', (event) => {
    // ข้ามการแคชคำขอไปยัง Google Gemini API และ Firebase Database
    if (event.request.url.includes('generativelanguage.googleapis.com') || 
        event.request.url.includes('firebaseio.com') ||
        event.request.url.includes('googleapis.com')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request).then((response) => {
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return response;
            });
        }).catch(() => {
            if (event.request.mode === 'navigate') {
                return caches.match('./index.html');
            }
        })
    );
});
