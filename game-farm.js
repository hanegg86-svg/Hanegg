// ==========================================
// --- COZY HARVEST (REAL-TIME IDLE FARM) ---
// ==========================================

class FarmSoundSynth {
    constructor() {
        this.ctx = null;
    }
    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) this.ctx = new AudioContext();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }
    playTill() {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.13);
    }
    playWater() {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.linearRampToValueAtTime(700, now + 0.08);
        osc.frequency.linearRampToValueAtTime(350, now + 0.18);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.19);
    }
    playPlant() {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(620, now + 0.1);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.11);
    }
    playHarvest() {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        [523.25, 659.25, 783.99].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.18, now + i * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.2);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + i * 0.06);
            osc.stop(now + i * 0.06 + 0.21);
        });
    }
    playCoin() {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77, now);
        osc.frequency.setValueAtTime(1318.51, now + 0.07);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.32);
    }
    playSpray() {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const bufferSize = this.ctx.sampleRate * 0.2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 3000;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(now);
    }
    playSquash() {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.1);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.11);
    }
    playThunder() {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(90, now);
        osc.frequency.linearRampToValueAtTime(30, now + 0.8);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.9);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.95);
    }
}

const farmSound = new FarmSoundSynth();

const FARM_CROPS_CONFIG = {
    lettuce: { id: 'lettuce', name: 'ผักกาดหอม', tierLabel: 'Tier 1', tierColor: 'bg-emerald-100 text-emerald-800', emoji: '🥬', seedCost: 10, sellPrice: 24, durationSec: 30 },
    carrot: { id: 'carrot', name: 'แครอทส้ม', tierLabel: 'Tier 1', tierColor: 'bg-emerald-100 text-emerald-800', emoji: '🥕', seedCost: 25, sellPrice: 65, durationSec: 75 },
    tomato: { id: 'tomato', name: 'มะเขือเทศฉ่ำ', tierLabel: 'Tier 2', tierColor: 'bg-sky-100 text-sky-800', emoji: '🍅', seedCost: 60, sellPrice: 165, durationSec: 180 },
    strawberry: { id: 'strawberry', name: 'สตรอว์เบอร์รี', tierLabel: 'Tier 2', tierColor: 'bg-sky-100 text-sky-800', emoji: '🍓', seedCost: 120, sellPrice: 340, durationSec: 360 },
    watermelon: { id: 'watermelon', name: 'แตงโมยักษ์', tierLabel: 'Tier 3', tierColor: 'bg-purple-100 text-purple-800', emoji: '🍉', seedCost: 300, sellPrice: 920, durationSec: 900 },
    durian: { id: 'durian', name: 'ทุเรียนหมอนทอง', tierLabel: 'Tier 4', tierColor: 'bg-amber-100 text-amber-900 border border-amber-300', emoji: '🍈', seedCost: 800, sellPrice: 2800, durationSec: 1800 },
    golden_apple: { id: 'golden_apple', name: 'แอปเปิลทองคำ', tierLabel: 'Tier 4', tierColor: 'bg-yellow-100 text-yellow-900 font-bold border border-yellow-400', emoji: '🍎✨', seedCost: 2000, sellPrice: 7500, durationSec: 3600 }
};

const FARM_SUPPLIES_CONFIG = {
    growth_fertilizer: { id: 'growth_fertilizer', name: 'ปุ๋ยเร่งโต ⚡', emoji: '🧪', cost: 45, type: 'consumable', desc: 'เร่งเวลาเติบโตที่เหลือลง 50% ทันที' },
    golden_fertilizer: { id: 'golden_fertilizer', name: 'ปุ๋ยทองคำนำโชค 🌟', emoji: '✨', cost: 150, type: 'consumable', desc: 'ผลผลิตในแปลงขายได้เป็น 2 เท่า (x2 Gold)' },
    pest_spray: { id: 'pest_spray', name: 'สเปรย์ไล่แมลง 🧴', emoji: '🧴', cost: 40, type: 'consumable', desc: 'กำจัดศัตรูพืชและคุ้มกันแมลง 10 นาที' },
    storm_shield: { id: 'storm_shield', name: 'ตาข่ายกันพายุ 🛡️', emoji: '🛡️', cost: 350, type: 'plot_upgrade', desc: 'ติดตั้งถาวรประจำแปลง ป้องกันพายุ 100%' }
};

const FARM_WINDMILL_CONFIG = [
    { level: 0, name: 'ยังไม่ได้สร้างกังหัน', desc: 'ต้องรดน้ำแปลงด้วยบัวรดน้ำเอง', cost: 200, intervalSec: 0, emoji: '🪓' },
    { level: 1, name: 'กังหันวิดน้ำ (Lv.1)', desc: 'รดน้ำแปลงที่ปลูกทุก 30 วินาที', cost: 650, intervalSec: 30, emoji: '💨' },
    { level: 2, name: 'กังหันไฮดรอลิก (Lv.2)', desc: 'รดน้ำแปลงที่ปลูกทุก 10 วินาที', cost: 1800, intervalSec: 10, emoji: '🌀' },
    { level: 3, name: 'สปริงเกลอร์ (Lv.3 สูงสุด)', desc: 'ดินชุ่มชื้นตลอดเวลา ไม่แห้งเลย!', cost: 0, intervalSec: 1, emoji: '⛲✨' }
];

const FARM_PLOT_UNLOCK_COSTS = [
    0, 0, 0, 0,
    80, 150, 250, 400,
    650, 950, 1400, 2000,
    2800, 3800, 5000, 7500
];

const FARM_DB_NAME = 'CozyHarvestAdvancedDB';
const FARM_DB_VERSION = 2;
let farmDbInstance = null;
let farmGameLoopInterval = null;
let farmAutoSaveInterval = null;

function openFarmDatabase() {
    return new Promise((resolve) => {
        const request = indexedDB.open(FARM_DB_NAME, FARM_DB_VERSION);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('gameSave')) {
                db.createObjectStore('gameSave', { keyPath: 'key' });
            }
        };
        request.onsuccess = (event) => {
            farmDbInstance = event.target.result;
            resolve(farmDbInstance);
        };
        request.onerror = () => resolve(null);
    });
}

function getFarmStorageKey() {
    return `player_farm_${currentUser || 'default'}`;
}

async function saveFarmStateToDB(state) {
    const key = getFarmStorageKey();
    if (!farmDbInstance) {
        try { localStorage.setItem(`cozy_harvest_${key}`, JSON.stringify(state)); } catch (e) {}
        return;
    }
    return new Promise((resolve) => {
        try {
            const tx = farmDbInstance.transaction('gameSave', 'readwrite');
            const store = tx.objectStore('gameSave');
            store.put({ key: key, data: state, updatedAt: Date.now() });
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => resolve(false);
        } catch (err) {
            resolve(false);
        }
    });
}

async function loadFarmStateFromDB() {
    const key = getFarmStorageKey();
    if (!farmDbInstance) {
        const local = localStorage.getItem(`cozy_harvest_${key}`);
        return local ? JSON.parse(local) : null;
    }
    return new Promise((resolve) => {
        try {
            const tx = farmDbInstance.transaction('gameSave', 'readonly');
            const store = tx.objectStore('gameSave');
            const req = store.get(key);
            req.onsuccess = () => {
                if (req.result && req.result.data) resolve(req.result.data);
                else {
                    const local = localStorage.getItem(`cozy_harvest_${key}`);
                    resolve(local ? JSON.parse(local) : null);
                }
            };
            req.onerror = () => resolve(null);
        } catch (err) {
            resolve(null);
        }
    });
}

function createInitialFarmState() {
    const plots = [];
    for (let i = 0; i < 16; i++) {
        plots.push({
            id: i,
            isUnlocked: i < 4,
            isTilled: false,
            isWatered: false,
            cropId: null,
            plantedAt: null,
            growthProgressSec: 0,
            hasPest: false,
            hasShield: false,
            isGoldenBonus: false,
            pestProtectedUntil: 0
        });
    }
    return {
        gold: 120,
        activeTool: 'hoe',
        selectedSeed: 'lettuce',
        speedMultiplier: 1,
        windmillLevel: 0,
        inventorySupplies: { growth_fertilizer: 1, golden_fertilizer: 0, pest_spray: 1 },
        seeds: { lettuce: 4, carrot: 2, tomato: 0, strawberry: 0, watermelon: 0, durian: 0, golden_apple: 0 },
        harvested: { lettuce: 0, carrot: 0, tomato: 0, strawberry: 0, watermelon: 0, durian: 0, golden_apple: 0 },
        plots: plots,
        lastTickTimestamp: Date.now(),
        stormState: 'calm',
        nextStormTimestamp: Date.now() + (180 + Math.random() * 120) * 1000,
        stormWarningStartedAt: null,
        dailyExchange: { date: '', count: 0 } // ระบบโควต้าแลกดาวประจำวัน
    };
}

let farmState = createInitialFarmState();

function showFarmToast(msg, type = 'info') {
    const banner = document.getElementById('farm-tool-hint');
    if (banner) {
        banner.innerText = msg;
        if (type === 'error') banner.className = 'text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200';
        else if (type === 'success') banner.className = 'text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200';
        else banner.className = 'text-[10px] font-normal text-stone-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200';
        
        setTimeout(() => {
            if (banner) {
                banner.className = 'text-[10px] font-normal text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200';
                updateFarmToolButtonsUI();
            }
        }, 3000);
    }
}

function createFarmFloatingText(elem, text, colorClass = 'text-amber-300') {
    if (!elem) return;
    const rect = elem.getBoundingClientRect();
    const floater = document.createElement('div');
    floater.className = `farm-floating-text ${colorClass} text-xs sm:text-sm drop-shadow-md`;
    floater.innerText = text;
    floater.style.left = `${rect.left + rect.width / 2}px`;
    floater.style.top = `${rect.top + rect.height / 3}px`;
    document.body.appendChild(floater);
    setTimeout(() => floater.remove(), 1200);
}

function formatFarmTimeRemaining(seconds) {
    if (seconds <= 0) return 'สุกแล้ว! ✨';
    const sec = Math.ceil(seconds);
    if (sec < 60) return `${sec}s`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s > 0 ? s + 's' : ''}`;
}

// อัปเดตข้อความปุ่มแลกดาวให้แสดงโควต้าคงเหลือในแต่ละวัน
function updateFarmExchangeButtonUI() {
    const todayStr = typeof getTodayDateString === 'function' ? getTodayDateString() : new Date().toISOString().slice(0, 10);
    if (!farmState.dailyExchange || farmState.dailyExchange.date !== todayStr) {
        farmState.dailyExchange = { date: todayStr, count: 0 };
    }
    const quotaTextEl = document.getElementById('farm-star-quota-text');
    if (quotaTextEl) {
        quotaTextEl.innerText = `(วันนี้ ${farmState.dailyExchange.count}/4 ดาว)`;
    }
}

// 🌟 ฟังก์ชันแลก 20,000 ทอง = 1 ดาว (จำกัดไม่เกิน 4 ดาวต่อวัน)
function exchangeFarmGoldToStar() {
    const todayStr = typeof getTodayDateString === 'function' ? getTodayDateString() : new Date().toISOString().slice(0, 10);
    if (!farmState.dailyExchange || farmState.dailyExchange.date !== todayStr) {
        farmState.dailyExchange = { date: todayStr, count: 0 };
    }

    if (farmState.dailyExchange.count >= 4) {
        alert('วันนี้หนูแลกดาวจากฟาร์มครบโควต้าสูงสุด 4 ดาวแล้วครับ! ⭐\nพรุ่งนี้ค่อยนำผลผลิตมาแลกใหม่นะครับ 🎈');
        return;
    }

    if (farmState.gold < 20000) {
        alert('เหรียญทองในฟาร์มไม่เพียงพอครับ! ต้องการ 🪙 20,000 เหรียญ เพื่อแลก 1 ดาว ⭐');
        return;
    }

    const currentUsed = farmState.dailyExchange.count;
    if (confirm(`คุณต้องการใช้ 🪙 20,000 เหรียญทองในฟาร์ม เพื่อแลก ⭐ 1 ดาว (+100 EXP) ใช่ไหมครับ?\n(แลกแล้ว ${currentUsed}/4 ดาวในวันนี้)`)) {
        farmState.gold -= 20000;
        farmState.dailyExchange.count += 1;
        updateFarmGoldDisplay();
        updateFarmExchangeButtonUI();
        triggerFarmAutoSave();

        // เพิ่มดาวและบันทึกลงระบบหลัก
        totalStars += 1;
        saveUserStars();
        addEXPToUser(100);

        // ส่งแจ้งเตือนไปยังผู้ปกครอง
        sendInAppNotification('MANUAL_STAR_ADJUST', {
            childName: currentUser || 'เด็กๆ',
            change: 1,
            reason: `แลกจากผลผลิตฟาร์มสุขใจ (ใช้ 20,000 เหรียญทอง 🪙 | วันนี้แลกแล้ว ${farmState.dailyExchange.count}/4 ดาว)`
        });

        farmSound.playHarvest();
        alert(`แลกรางวัลสำเร็จ! ได้รับ ⭐ 1 ดาว และ +100 EXP เรียบร้อยแล้วครับ 🎉\n(โควต้าฟาร์มวันนี้: ${farmState.dailyExchange.count}/4 ดาว)`);
        renderFarmInventoryUI();
    }
}

function checkFarmPestSpawns() {
    const now = Date.now();
    let newPestCount = 0;
    farmState.plots.forEach(plot => {
        if (!plot.isUnlocked || !plot.cropId || plot.hasPest) return;
        if (plot.pestProtectedUntil && plot.pestProtectedUntil > now) return;
        if (Math.random() < 0.015) {
            plot.hasPest = true;
            newPestCount++;
        }
    });
    if (newPestCount > 0) {
        showFarmToast(`🐛 ศัตรูพืชเข้ากัดกินในแปลง ${newPestCount} จุด!`, 'error');
        farmSound.playSquash();
    }
}

function updateFarmStormCycle() {
    const now = Date.now();
    const banner = document.getElementById('farm-storm-alert-banner');
    const timerCount = document.getElementById('farm-storm-timer-countdown');
    const skyOverlay = document.getElementById('farm-storm-sky-overlay');
    const weatherBadge = document.getElementById('farm-weather-badge');

    if (farmState.stormState === 'calm') {
        const timeToStorm = (farmState.nextStormTimestamp - now) / 1000;
        if (timeToStorm <= 40) {
            farmState.stormState = 'warning';
            farmState.stormWarningStartedAt = now;
            showFarmToast('⛈️ เมฆดำทะมึนกำลังรวมตัว! ตรวจสอบพายุจะพัดถล่มในอีกไม่ช้า', 'error');
            farmSound.playThunder();
        }
        if (weatherBadge) {
            weatherBadge.innerHTML = '☀️ ท้องฟ้าแจ่มใส';
            weatherBadge.className = 'bg-black/30 backdrop-blur px-2.5 py-0.5 rounded-full border border-white/10 text-amber-200';
        }
        if (banner) banner.classList.add('hidden');
        if (skyOverlay) skyOverlay.style.opacity = '0';
    }

    if (farmState.stormState === 'warning') {
        const remainingSec = Math.max(0, (farmState.nextStormTimestamp - now) / 1000);
        if (banner) banner.classList.remove('hidden');
        if (timerCount) timerCount.innerText = `00:${String(Math.ceil(remainingSec)).padStart(2, '0')}`;
        if (weatherBadge) {
            weatherBadge.innerHTML = '⚠️ ลมพายุกรรโชกแรง';
            weatherBadge.className = 'bg-purple-900/80 backdrop-blur px-2.5 py-0.5 rounded-full border border-purple-400 text-amber-300 animate-pulse';
        }
        if (skyOverlay) skyOverlay.style.opacity = '0.35';
        if (remainingSec <= 0) executeFarmStormStrike();
    }
}

function executeFarmStormStrike() {
    farmState.stormState = 'active';
    const banner = document.getElementById('farm-storm-alert-banner');
    const skyOverlay = document.getElementById('farm-storm-sky-overlay');
    const flashOverlay = document.getElementById('farm-storm-flash-overlay');
    const weatherBadge = document.getElementById('farm-weather-badge');

    if (banner) banner.classList.add('hidden');
    if (skyOverlay) skyOverlay.style.opacity = '0.75';
    if (weatherBadge) {
        weatherBadge.innerHTML = '⛈️ พายุพัดถล่ม!';
        weatherBadge.className = 'bg-rose-950/90 text-rose-300 px-2.5 py-0.5 rounded-full border border-rose-500 animate-bounce';
    }

    farmSound.playThunder();
    if (flashOverlay) {
        flashOverlay.style.opacity = '0.8';
        setTimeout(() => { flashOverlay.style.opacity = '0'; }, 150);
    }

    let destroyedPlots = 0;
    let protectedPlots = 0;

    farmState.plots.forEach(plot => {
        if (!plot.isUnlocked || !plot.cropId) return;
        if (plot.hasShield) {
            protectedPlots++;
        } else {
            if (Math.random() < 0.7) {
                plot.cropId = null;
                plot.growthProgressSec = 0;
                plot.isWatered = false;
                plot.isTilled = false;
                plot.hasPest = false;
                plot.isGoldenBonus = false;
                destroyedPlots++;
            }
        }
    });

    setTimeout(() => {
        if (destroyedPlots > 0) {
            showFarmToast(`🌪️ พายุพัดถล่มฟาร์ม! เสียหาย ${destroyedPlots} แปลง (ป้องกันได้ ${protectedPlots} แปลง)`, 'error');
        } else if (protectedPlots > 0) {
            showFarmToast(`🛡️ ตาข่ายกันพายุคุ้มกันผลผลิตปลอดภัย 100%!`, 'success');
        } else {
            showFarmToast(`⛈️ พายุพัดผ่านฟาร์มไปแล้วอย่างปลอดภัย`, 'info');
        }

        farmState.stormState = 'calm';
        farmState.nextStormTimestamp = Date.now() + (180 + Math.random() * 180) * 1000;
        if (skyOverlay) skyOverlay.style.opacity = '0';
        triggerFarmAutoSave();
        renderFarmPlotsUI();
    }, 2500);
}

let farmWindmillTickAccumulator = 0;
function updateFarmWindmillSystem(deltaSec) {
    const level = farmState.windmillLevel || 0;
    if (level <= 0) return;
    const config = FARM_WINDMILL_CONFIG[level];
    if (!config) return;

    if (level === 3) {
        farmState.plots.forEach(plot => {
            if (plot.isUnlocked && plot.isTilled && !plot.isWatered) plot.isWatered = true;
        });
        return;
    }

    farmWindmillTickAccumulator += deltaSec;
    if (farmWindmillTickAccumulator >= config.intervalSec) {
        farmWindmillTickAccumulator = 0;
        let wateredCount = 0;
        farmState.plots.forEach(plot => {
            if (plot.isUnlocked && plot.isTilled && !plot.isWatered && plot.cropId) {
                plot.isWatered = true;
                wateredCount++;
            }
        });
        if (wateredCount > 0) farmSound.playWater();
    }
}

function updateFarmRealTimeGrowth() {
    const now = Date.now();
    const elapsedDeltaSec = Math.max(0, (now - farmState.lastTickTimestamp) / 1000) * (farmState.speedMultiplier || 1);
    farmState.lastTickTimestamp = now;

    updateFarmWindmillSystem(elapsedDeltaSec);
    updateFarmStormCycle();
    checkFarmPestSpawns();

    let activePests = 0;
    farmState.plots.forEach(plot => {
        if (!plot.isUnlocked) return;
        if (plot.hasPest) { activePests++; return; }
        if (!plot.cropId) return;
        const cropConfig = FARM_CROPS_CONFIG[plot.cropId];
        if (!cropConfig) return;
        if (plot.isWatered) {
            plot.growthProgressSec = Math.min(cropConfig.durationSec, plot.growthProgressSec + elapsedDeltaSec);
        }
    });

    const pestBadge = document.getElementById('farm-pests-counter');
    if (pestBadge) {
        if (activePests > 0) {
            pestBadge.classList.remove('hidden');
            pestBadge.innerText = `🐛 ศัตรูพืช: ${activePests} แปลง!`;
        } else {
            pestBadge.classList.add('hidden');
        }
    }

    renderFarmPlotsUI();
}

function renderFarmPlotsUI() {
    const grid = document.getElementById('farm-plots-grid');
    if (!grid) return;
    grid.innerHTML = '';
    let unlockedCount = 0;

    farmState.plots.forEach(plot => {
        if (plot.isUnlocked) unlockedCount++;
        const plotCard = document.createElement('div');
        plotCard.className = 'relative aspect-square rounded-2xl flex flex-col items-center justify-between p-2 cursor-pointer transition transform active:scale-95 shadow-xs overflow-hidden select-none';

        if (!plot.isUnlocked) {
            const unlockCost = FARM_PLOT_UNLOCK_COSTS[plot.id] || 100;
            const canAfford = farmState.gold >= unlockCost;
            plotCard.className += ' bg-amber-950/80 border-2 border-dashed border-amber-600/70 justify-center gap-1';
            plotCard.innerHTML = `
                <div class="text-xl opacity-75">🔒</div>
                <div class="text-[10px] font-bold text-amber-200">แปลงที่ ${plot.id + 1}</div>
                <button class="px-2 py-0.5 rounded-lg text-[9px] font-black ${canAfford ? 'bg-amber-400 text-amber-950 animate-pulse' : 'bg-stone-700 text-stone-400'} shadow border border-amber-200">
                    🪙 ${unlockCost} ขยาย
                </button>
            `;
            plotCard.onclick = (e) => {
                e.stopPropagation();
                if (farmState.gold < unlockCost) {
                    showFarmToast(`ต้องการ 🪙 ${unlockCost} เหรียญ`, 'error');
                    return;
                }
                farmState.gold -= unlockCost;
                plot.isUnlocked = true;
                farmSound.playCoin();
                updateFarmGoldDisplay();
                triggerFarmAutoSave();
                renderFarmPlotsUI();
            };
            grid.appendChild(plotCard);
            return;
        }

        let soilClass = 'soil-untilled border-2 border-[#543820]';
        let soilStateBadge = 'รอพรวน';
        let badgeColor = 'bg-stone-800/70 text-stone-300';

        if (plot.isTilled) {
            if (plot.isWatered) {
                soilClass = 'soil-tilled-wet';
                soilStateBadge = 'ชุ่มชื้น 💧';
                badgeColor = 'bg-sky-950/80 text-sky-200 border border-sky-400/40';
            } else {
                soilClass = 'soil-tilled-dry';
                soilStateBadge = 'ดินแห้ง ☀️';
                badgeColor = 'bg-amber-950/80 text-amber-200 border border-amber-600/40';
            }
        }

        plotCard.className += ` ${soilClass}`;
        const shieldBadgeHtml = plot.hasShield ? `<span class="bg-blue-600 text-white text-[8px] px-1 py-0.2 rounded-full shadow border border-blue-300">🛡️</span>` : '';
        const goldenBadgeHtml = plot.isGoldenBonus ? `<span class="bg-amber-400 text-amber-950 text-[8px] px-1 py-0.2 rounded-full font-bold">🌟x2</span>` : '';

        if (!plot.cropId) {
            plotCard.innerHTML = `
                <div class="w-full flex justify-between items-center text-[8px] font-bold">
                    <span class="text-stone-300 flex items-center gap-0.5">#${plot.id + 1} ${shieldBadgeHtml}</span>
                    <span class="px-1 py-0.2 rounded-full ${badgeColor}">${soilStateBadge}</span>
                </div>
                <div class="text-2xl opacity-40 my-auto">${plot.isTilled ? (plot.isWatered ? '🕳️' : '🟤') : '🌿'}</div>
                <div class="text-[9px] font-bold text-white/90 bg-black/40 px-1.5 py-0.2 rounded">${plot.isTilled ? (plot.isWatered ? '🌱 หยอดเมล็ด' : '💧 รดน้ำ') : '⛏️ พรวนดิน'}</div>
            `;
        } else {
            const crop = FARM_CROPS_CONFIG[plot.cropId];
            const progressPercent = Math.min(100, (plot.growthProgressSec / crop.durationSec) * 100);
            const isReady = plot.growthProgressSec >= crop.durationSec;
            const timeLeftSec = Math.max(0, crop.durationSec - plot.growthProgressSec);

            let cropIcon = progressPercent >= 100 ? crop.emoji : (progressPercent >= 50 ? '🌿' : '🌱');

            const pestOverlayHtml = plot.hasPest ? `
                <div class="absolute inset-0 bg-rose-950/60 backdrop-blur-xs flex flex-col items-center justify-center p-1 z-20 animate-pulse">
                    <span class="text-2xl pest-active">🐛</span>
                    <span class="text-[8px] font-black text-rose-300 bg-rose-900 px-1 rounded mt-0.5">แตะไล่แมลง!</span>
                </div>
            ` : '';

            plotCard.innerHTML = `
                ${pestOverlayHtml}
                <div class="w-full flex justify-between items-center text-[8px] font-bold">
                    <span class="text-white drop-shadow flex items-center gap-0.5">#${plot.id + 1} ${crop.name} ${shieldBadgeHtml} ${goldenBadgeHtml}</span>
                    <span class="px-1 py-0.2 rounded-full ${badgeColor}">${plot.isWatered ? 'ชุ่มชื้น' : 'ขาดน้ำ!'}</span>
                </div>
                <div class="my-auto flex flex-col items-center">
                    <div class="text-2xl sm:text-3xl filter drop-shadow ${isReady ? 'ripe-bounce' : ''}">${cropIcon}</div>
                    ${isReady ? `<span class="mt-0.5 bg-amber-400 text-amber-950 font-black text-[8px] px-1.5 py-0.2 rounded-full shadow animate-bounce">🧺 เก็บเกี่ยว</span>` : ''}
                </div>
                <div class="w-full">
                    <div class="flex justify-between items-center text-[8px] font-bold text-white mb-0.5 drop-shadow">
                        <span>${Math.floor(progressPercent)}%</span>
                        <span>${plot.isWatered ? formatFarmTimeRemaining(timeLeftSec) : '💧 ขาดน้ำ'}</span>
                    </div>
                    <div class="w-full bg-black/60 rounded-full h-1.5 overflow-hidden p-0.5">
                        <div class="h-full rounded-full ${isReady ? 'bg-amber-400' : (plot.isWatered ? 'bg-emerald-400' : 'bg-rose-400')}" style="width: ${progressPercent}%"></div>
                    </div>
                </div>
            `;
        }

        plotCard.onclick = () => handleFarmPlotClick(plot, plotCard);
        grid.appendChild(plotCard);
    });

    const plotsCountEl = document.getElementById('farm-plots-count-display');
    if (plotsCountEl) plotsCountEl.innerText = `${unlockedCount} / 16`;
}

function handleFarmPlotClick(plot, plotElem) {
    if (plot.hasPest) {
        plot.hasPest = false;
        farmSound.playSquash();
        createFarmFloatingText(plotElem, 'ไล่แมลงแล้ว! 🥾', 'text-rose-300');
        triggerFarmAutoSave();
        renderFarmPlotsUI();
        return;
    }

    const tool = farmState.activeTool;

    if (tool === 'harvest' || (plot.cropId && plot.growthProgressSec >= FARM_CROPS_CONFIG[plot.cropId]?.durationSec)) {
        if (!plot.cropId) return;
        const crop = FARM_CROPS_CONFIG[plot.cropId];
        if (plot.growthProgressSec < crop.durationSec) {
            showFarmToast(`ต้น${crop.name} ยังไม่สุกเต็มที่!`, 'warn');
            return;
        }

        const harvestQty = plot.isGoldenBonus ? 2 : 1;
        farmState.harvested[plot.cropId] = (farmState.harvested[plot.cropId] || 0) + harvestQty;
        createFarmFloatingText(plotElem, `+${harvestQty} ${crop.emoji}`, 'text-emerald-300');
        farmSound.playHarvest();

        plot.cropId = null;
        plot.growthProgressSec = 0;
        plot.plantedAt = null;
        plot.isWatered = false;
        plot.isGoldenBonus = false;

        triggerFarmAutoSave();
        renderFarmPlotsUI();
        renderFarmInventoryUI();
        return;
    }

    if (tool === 'hoe') {
        if (plot.cropId) return;
        if (plot.isTilled) return;
        plot.isTilled = true;
        farmSound.playTill();
        createFarmFloatingText(plotElem, 'พรวนดิน ⛏️', 'text-amber-200');
        triggerFarmAutoSave();
        renderFarmPlotsUI();
        return;
    }

    if (tool === 'water') {
        if (!plot.isTilled) { showFarmToast('พรวนดินก่อนรดน้ำครับ', 'warn'); return; }
        if (plot.isWatered) return;
        plot.isWatered = true;
        farmSound.playWater();
        createFarmFloatingText(plotElem, 'รดน้ำ 💧', 'text-sky-300');
        triggerFarmAutoSave();
        renderFarmPlotsUI();
        return;
    }

    if (tool === 'plant') {
        if (!plot.isTilled) { showFarmToast('พรวนดินก่อนหยอดเมล็ด!', 'warn'); return; }
        if (plot.cropId) return;

        const cropKey = farmState.selectedSeed;
        if ((farmState.seeds[cropKey] || 0) <= 0) {
            showFarmToast(`เมล็ดพันธุ์ ${FARM_CROPS_CONFIG[cropKey].name} หมด!`, 'error');
            return;
        }

        farmState.seeds[cropKey]--;
        plot.cropId = cropKey;
        plot.plantedAt = Date.now();
        plot.growthProgressSec = 0;
        plot.hasPest = false;

        farmSound.playPlant();
        createFarmFloatingText(plotElem, 'ปลูก 🌱', 'text-emerald-300');
        triggerFarmAutoSave();
        renderFarmPlotsUI();
        renderFarmSeedsPills();
        renderFarmShopUI();
    }
}

function renderFarmSuppliesShopUI() {
    const container = document.getElementById('farm-supplies-items-list');
    if (!container) return;
    container.innerHTML = '';

    Object.values(FARM_SUPPLIES_CONFIG).forEach(item => {
        const canAfford = farmState.gold >= item.cost;
        const currentQty = item.type === 'consumable' ? (farmState.inventorySupplies[item.id] || 0) : null;

        const card = document.createElement('div');
        card.className = 'bg-stone-50 rounded-2xl p-2.5 border border-stone-200 flex items-center justify-between gap-2 shadow-2xs';
        card.innerHTML = `
            <div class="flex items-center gap-2">
                <div class="text-2xl p-1 bg-white rounded-xl border border-stone-200">${item.emoji}</div>
                <div>
                    <div class="font-extrabold text-stone-800 text-xs">${item.name}</div>
                    <div class="text-[10px] text-stone-500">${item.desc}</div>
                </div>
            </div>
            <div class="flex flex-col items-end gap-1">
                <button class="buy-sup-btn px-2.5 py-1 rounded-xl font-black text-[10px] shadow ${canAfford ? 'bg-amber-400 text-amber-950 active:scale-95' : 'bg-stone-200 text-stone-400 cursor-not-allowed'}">
                    🪙 ${item.cost}
                </button>
                ${item.type === 'consumable' && currentQty > 0 ? `<button class="use-sup-btn px-2 py-0.5 rounded-lg text-[9px] font-bold bg-emerald-600 text-white active:scale-95">ใช้ (${currentQty})</button>` : ''}
            </div>
        `;

        card.querySelector('.buy-sup-btn').onclick = () => {
            if (farmState.gold < item.cost) { showFarmToast('เหรียญทองไม่พอ', 'error'); return; }
            if (item.id === 'storm_shield') { openFarmItemApplyModal(item); return; }
            farmState.gold -= item.cost;
            farmState.inventorySupplies[item.id] = (farmState.inventorySupplies[item.id] || 0) + 1;
            farmSound.playCoin();
            updateFarmGoldDisplay();
            triggerFarmAutoSave();
            renderFarmSuppliesShopUI();
        };

        const useBtn = card.querySelector('.use-sup-btn');
        if (useBtn) useBtn.onclick = () => openFarmItemApplyModal(item);

        container.appendChild(card);
    });
}

function openFarmItemApplyModal(item) {
    const modal = document.getElementById('farm-item-apply-modal');
    const container = document.getElementById('farm-modal-plots-selection');
    if (!modal || !container) return;
    container.innerHTML = '';

    farmState.plots.forEach(plot => {
        if (!plot.isUnlocked) return;
        const btn = document.createElement('button');
        btn.className = 'p-1.5 rounded-xl border flex flex-col items-center justify-center text-[10px] font-bold active:scale-95 bg-emerald-50 border-emerald-300';
        btn.innerText = `แปลง #${plot.id + 1}`;
        btn.onclick = () => {
            modal.classList.add('hidden');
            if (item.id === 'storm_shield') {
                if (farmState.gold < item.cost) return;
                farmState.gold -= item.cost;
                plot.hasShield = true;
                farmSound.playCoin();
            } else if (item.id === 'growth_fertilizer') {
                farmState.inventorySupplies.growth_fertilizer--;
                if (plot.cropId) {
                    const c = FARM_CROPS_CONFIG[plot.cropId];
                    plot.growthProgressSec += (c.durationSec - plot.growthProgressSec) * 0.5;
                }
                farmSound.playPlant();
            } else if (item.id === 'golden_fertilizer') {
                farmState.inventorySupplies.golden_fertilizer--;
                plot.isGoldenBonus = true;
                farmSound.playHarvest();
            } else if (item.id === 'pest_spray') {
                farmState.inventorySupplies.pest_spray--;
                plot.hasPest = false;
                plot.pestProtectedUntil = Date.now() + 600 * 1000;
                farmSound.playSpray();
            }
            updateFarmGoldDisplay();
            triggerFarmAutoSave();
            renderFarmPlotsUI();
            renderFarmSuppliesShopUI();
        };
        container.appendChild(btn);
    });

    modal.classList.remove('hidden');
}

function renderFarmWindmillPanel() {
    const container = document.getElementById('farm-windmill-panel');
    if (!container) return;
    const currentLevel = farmState.windmillLevel || 0;
    const currentConfig = FARM_WINDMILL_CONFIG[currentLevel];
    const nextConfig = FARM_WINDMILL_CONFIG[currentLevel + 1];

    const hudIcon = document.getElementById('farm-windmill-hud-icon');
    const hudLvl = document.getElementById('farm-windmill-level-display');
    const actInd = document.getElementById('farm-windmill-active-indicator');

    if (hudIcon) hudIcon.innerText = currentConfig.emoji;
    if (hudLvl) hudLvl.innerText = currentLevel > 0 ? `Lv.${currentLevel}` : 'ไม่มีกังหัน';
    if (actInd) actInd.innerText = currentLevel > 0 ? `💨 กังหัน Lv.${currentLevel}` : '⚙️ กังหัน: ปิดใช้งาน';

    container.innerHTML = `
        <div class="bg-sky-50 border border-sky-300 rounded-2xl p-2.5 flex items-center gap-2">
            <span class="text-3xl ${currentLevel > 0 ? 'spin-windmill' : ''}">${currentConfig.emoji}</span>
            <div>
                <div class="text-xs font-black text-sky-900">${currentConfig.name}</div>
                <div class="text-[10px] text-stone-600">${currentConfig.desc}</div>
            </div>
        </div>
        ${nextConfig ? `
            <button id="farm-upgrade-windmill-btn" class="w-full py-2 rounded-xl font-black text-xs text-white shadow transition active:scale-95 ${farmState.gold >= nextConfig.cost ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-stone-300 text-stone-500 cursor-not-allowed'}">
                อัปเกรดเป็น ${nextConfig.name} (🪙 ${nextConfig.cost})
            </button>
        ` : `<div class="text-[10px] text-center font-bold text-amber-700 bg-amber-50 p-2 rounded-xl">กังหันน้ำอัปเกรดเต็มระดับสูงสุดแล้ว! 🏆</div>`}
    `;

    const upBtn = document.getElementById('farm-upgrade-windmill-btn');
    if (upBtn) {
        upBtn.onclick = () => {
            if (!nextConfig || farmState.gold < nextConfig.cost) return;
            farmState.gold -= nextConfig.cost;
            farmState.windmillLevel++;
            farmSound.playCoin();
            updateFarmGoldDisplay();
            triggerFarmAutoSave();
            renderFarmWindmillPanel();
            renderFarmPlotsUI();
        };
    }
}

function renderFarmShopUI() {
    const container = document.getElementById('farm-shop-items-list');
    if (!container) return;
    container.innerHTML = '';

    Object.values(FARM_CROPS_CONFIG).forEach(crop => {
        const userSeeds = farmState.seeds[crop.id] || 0;
        const canAfford = farmState.gold >= crop.seedCost;

        const card = document.createElement('div');
        card.className = 'bg-stone-50 rounded-2xl p-2 border border-stone-200 flex items-center justify-between gap-2 shadow-2xs';
        card.innerHTML = `
            <div class="flex items-center gap-2">
                <div class="text-2xl p-1 bg-white rounded-xl border border-stone-200">${crop.emoji}</div>
                <div>
                    <div class="font-extrabold text-stone-800 text-xs">${crop.name} <span class="text-[8px] px-1 rounded ${crop.tierColor}">${crop.tierLabel}</span></div>
                    <div class="text-[10px] text-stone-500">⏱️ ${formatFarmTimeRemaining(crop.durationSec)} | 💰 ${crop.sellPrice} | มี: ${userSeeds}</div>
                </div>
            </div>
            <button class="buy-crop-btn px-2.5 py-1 rounded-xl font-black text-[10px] shadow active:scale-95 ${canAfford ? 'bg-amber-400 text-amber-950' : 'bg-stone-200 text-stone-400 cursor-not-allowed'}">
                🪙 ${crop.seedCost}
            </button>
        `;

        card.querySelector('.buy-crop-btn').onclick = () => {
            if (farmState.gold < crop.seedCost) return;
            farmState.gold -= crop.seedCost;
            farmState.seeds[crop.id] = (farmState.seeds[crop.id] || 0) + 1;
            farmSound.playCoin();
            updateFarmGoldDisplay();
            triggerFarmAutoSave();
            renderFarmShopUI();
            renderFarmSeedsPills();
        };

        container.appendChild(card);
    });
}

function renderFarmInventoryUI() {
    const container = document.getElementById('farm-market-items-list');
    if (!container) return;
    container.innerHTML = '';
    let totalItems = 0;
    let totalValue = 0;

    Object.values(FARM_CROPS_CONFIG).forEach(crop => {
        const count = farmState.harvested[crop.id] || 0;
        totalItems += count;
        const val = count * crop.sellPrice;
        totalValue += val;

        const card = document.createElement('div');
        card.className = `rounded-2xl p-2 border flex items-center justify-between gap-2 shadow-2xs ${count > 0 ? 'bg-amber-50 border-amber-200' : 'bg-stone-50 border-stone-200 opacity-60'}`;
        card.innerHTML = `
            <div class="flex items-center gap-2">
                <span class="text-2xl">${crop.emoji}</span>
                <div>
                    <div class="font-extrabold text-xs text-stone-800">${crop.name} (มี ${count} ชิ้น)</div>
                    <div class="text-[10px] text-stone-500">ราคาชิ้นละ: 🪙 ${crop.sellPrice}</div>
                </div>
            </div>
            <button class="sell-crop-btn px-2.5 py-1 rounded-xl font-bold text-[10px] ${count > 0 ? 'bg-emerald-600 text-white active:scale-95' : 'bg-stone-200 text-stone-400'}" ${count <= 0 ? 'disabled' : ''}>
                ขาย (+🪙 ${crop.sellPrice})
            </button>
        `;

        if (count > 0) {
            card.querySelector('.sell-crop-btn').onclick = () => {
                farmState.harvested[crop.id]--;
                farmState.gold += crop.sellPrice;
                farmSound.playCoin();
                updateFarmGoldDisplay();
                triggerFarmAutoSave();
                renderFarmInventoryUI();
            };
        }

        container.appendChild(card);
    });

    const sellAllBtn = document.getElementById('farm-sell-all-btn');
    if (sellAllBtn) {
        sellAllBtn.disabled = totalItems === 0;
        sellAllBtn.innerText = `💰 ขายหมด (+🪙 ${totalValue})`;
        sellAllBtn.onclick = () => {
            if (totalItems === 0) return;
            farmState.gold += totalValue;
            Object.keys(farmState.harvested).forEach(k => farmState.harvested[k] = 0);
            farmSound.playCoin();
            updateFarmGoldDisplay();
            triggerFarmAutoSave();
            renderFarmInventoryUI();
        };
    }
}

function renderFarmSeedsPills() {
    const container = document.getElementById('farm-seed-pills-list');
    if (!container) return;
    container.innerHTML = '';

    Object.values(FARM_CROPS_CONFIG).forEach(crop => {
        const count = farmState.seeds[crop.id] || 0;
        const isSelected = farmState.selectedSeed === crop.id;
        const pill = document.createElement('button');
        pill.className = `px-2 py-0.5 rounded-xl text-[10px] font-bold flex items-center gap-1 active:scale-95 border ${isSelected ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-stone-100 text-stone-700 border-stone-200'}`;
        pill.innerHTML = `<span>${crop.emoji}</span><span>${crop.name}</span><span class="text-[9px] px-1 rounded-full ${isSelected ? 'bg-emerald-800' : 'bg-stone-200'}">${count}</span>`;
        pill.onclick = () => {
            farmState.selectedSeed = crop.id;
            farmState.activeTool = 'plant';
            updateFarmToolButtonsUI();
            renderFarmSeedsPills();
        };
        container.appendChild(pill);
    });
}

function updateFarmToolButtonsUI() {
    document.querySelectorAll('.farm-tool-btn').forEach(btn => {
        const tool = btn.getAttribute('data-farm-tool');
        if (tool === farmState.activeTool) {
            btn.className = 'farm-tool-btn flex flex-col items-center justify-center p-1.5 rounded-2xl border-2 border-emerald-500 bg-emerald-100 text-emerald-950 shadow-2xs active:scale-95';
        } else {
            btn.className = 'farm-tool-btn flex flex-col items-center justify-center p-1.5 rounded-2xl border-2 border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 active:scale-95';
        }
    });
}

function updateFarmGoldDisplay() {
    const el = document.getElementById('farm-gold-display');
    if (el) el.innerText = farmState.gold.toLocaleString();
}

let farmSaveTimeout = null;
function triggerFarmAutoSave() {
    clearTimeout(farmSaveTimeout);
    farmSaveTimeout = setTimeout(async () => {
        const statusEl = document.getElementById('farm-save-status');
        if (statusEl) statusEl.innerText = 'บันทึก... 💾';
        await saveFarmStateToDB(farmState);
        if (statusEl) statusEl.innerText = 'IndexedDB';
    }, 500);
}

function confirmFarmReset() {
    document.getElementById('farm-reset-modal').classList.add('hidden');
    farmState = createInitialFarmState();
    triggerFarmAutoSave();
    updateFarmGoldDisplay();
    updateFarmExchangeButtonUI();
    updateFarmToolButtonsUI();
    renderFarmSeedsPills();
    renderFarmPlotsUI();
    renderFarmShopUI();
    renderFarmSuppliesShopUI();
    renderFarmWindmillPanel();
    renderFarmInventoryUI();
}

async function initFarmGame() {
    await openFarmDatabase();
    const saved = await loadFarmStateFromDB();

    if (saved && saved.plots && saved.plots.length === 16) {
        farmState = {
            ...createInitialFarmState(),
            ...saved,
            inventorySupplies: { ...createInitialFarmState().inventorySupplies, ...(saved.inventorySupplies || {}) },
            dailyExchange: { ...createInitialFarmState().dailyExchange, ...(saved.dailyExchange || {}) }
        };
        const now = Date.now();
        const offlineSec = Math.max(0, (now - (farmState.lastTickTimestamp || now)) / 1000);
        farmState.plots.forEach(plot => {
            if (plot.isUnlocked && plot.cropId && plot.isWatered && !plot.hasPest) {
                const crop = FARM_CROPS_CONFIG[plot.cropId];
                if (crop) plot.growthProgressSec = Math.min(crop.durationSec, plot.growthProgressSec + offlineSec);
            }
        });
        farmState.lastTickTimestamp = now;
    }

    document.querySelectorAll('.farm-tool-btn').forEach(btn => {
        btn.onclick = () => {
            farmState.activeTool = btn.getAttribute('data-farm-tool');
            updateFarmToolButtonsUI();
        };
    });

    const farmTabs = [
        { btn: 'farm-tab-btn-shop', content: 'farm-tab-content-shop' },
        { btn: 'farm-tab-btn-supplies', content: 'farm-tab-content-supplies' },
        { btn: 'farm-tab-btn-facilities', content: 'farm-tab-content-facilities' },
        { btn: 'farm-tab-btn-market', content: 'farm-tab-content-market' }
    ];

    farmTabs.forEach(({ btn, content }) => {
        const b = document.getElementById(btn);
        if (b) {
            b.onclick = () => {
                farmTabs.forEach(t => {
                    const elB = document.getElementById(t.btn);
                    const elC = document.getElementById(t.content);
                    if (t.btn === btn) {
                        if (elB) elB.className = 'flex-1 py-1.5 rounded-xl font-bold text-xs bg-emerald-600 text-white shadow';
                        if (elC) { elC.classList.remove('hidden'); elC.classList.add('flex'); }
                    } else {
                        if (elB) elB.className = 'flex-1 py-1.5 rounded-xl font-bold text-xs text-stone-600 hover:bg-stone-100';
                        if (elC) { elC.classList.add('hidden'); elC.classList.remove('flex'); }
                    }
                });
            };
        }
    });

    const windmillHud = document.getElementById('farm-windmill-hud');
    if (windmillHud) windmillHud.onclick = () => document.getElementById('farm-tab-btn-facilities').click();

    const resetBtn = document.getElementById('farm-btn-open-reset');
    if (resetBtn) resetBtn.onclick = () => document.getElementById('farm-reset-modal').classList.remove('hidden');

    const turboBtn = document.getElementById('farm-turbo-toggle-btn');
    if (turboBtn) {
        const speeds = [1, 5, 10];
        let sIdx = 0;
        turboBtn.onclick = () => {
            sIdx = (sIdx + 1) % speeds.length;
            farmState.speedMultiplier = speeds[sIdx];
            document.getElementById('farm-turbo-indicator').innerText = `${speeds[sIdx]}x`;
        };
    }

    updateFarmGoldDisplay();
    updateFarmExchangeButtonUI();
    updateFarmToolButtonsUI();
    renderFarmSeedsPills();
    renderFarmPlotsUI();
    renderFarmShopUI();
    renderFarmSuppliesShopUI();
    renderFarmWindmillPanel();
    renderFarmInventoryUI();

    if (!farmGameLoopInterval) farmGameLoopInterval = setInterval(updateFarmRealTimeGrowth, 500);
    if (!farmAutoSaveInterval) farmAutoSaveInterval = setInterval(triggerFarmAutoSave, 10000);
}

function stopFarmGame() {
    if (farmGameLoopInterval) { clearInterval(farmGameLoopInterval); farmGameLoopInterval = null; }
    if (farmAutoSaveInterval) { clearInterval(farmAutoSaveInterval); farmAutoSaveInterval = null; }
    triggerFarmAutoSave();
}
