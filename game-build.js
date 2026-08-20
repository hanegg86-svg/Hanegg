// ==========================================
// --- MINI TOWN BUILDER: HARD MODE ENGINE ---
// ==========================================

// Preload รูปภาพสิ่งปลูกสร้างตามเลเวล (.png)
const buildingImages = {
    house: ['./house_lvl1.png', './house_lvl2.png', './house_lvl3.png'].map(src => { const img = new Image(); img.src = src; return img; }),
    farm: ['./farm_lvl1.png', './farm_lvl2.png', './farm_lvl3.png'].map(src => { const img = new Image(); img.src = src; return img; }),
    lumber: ['./lumber_lvl1.png', './lumber_lvl2.png', './lumber_lvl3.png'].map(src => { const img = new Image(); img.src = src; return img; })
};

// 🎵 ระบบเสียง BGM
let bgmAudio = new Audio('./bgm.mp3');
bgmAudio.loop = true;
let isBgmMuted = localStorage.getItem('kids_vocab_bgm_muted') === 'true';
bgmAudio.muted = isBgmMuted;
let hasBgmStarted = false;

let buildCanvas, buildCtx;
let buildAnimationId = null;
let buildIntervalId = null;

// Game State
let GRID_SIZE = 4;
let TILE_SIZE = 80;

let resources = { wood: 25, gold: 50, food: 15 };
let currentTool = 'select';
let selectedTile = null;
let movingFromTile = null; // ตัวแปรสำหรับย้ายตึก
let gameTime = 0;
let isBuildGameOver = false;
let isImmersiveMode = false;

let currentEvent = 'normal';
let eventTimer = 30;

let grid = Array(8).fill(null).map(() => Array(8).fill(null));
let clearedCount = 0;

const BUILD_TIME = {
    house: [4, 8, 14],
    lumber: [5, 10, 15],
    farm: [4, 8, 14],
    wonder: [25],
    clearTree: 4,
    clearRock: 6,
    clearBanana: 4
};

const OBSTACLES = {
    tree: { name: 'ต้นไม้', emoji: '🌲', reqWorker: 1, cost: { gold: 15 }, reward: { wood: 15 } },
    rock: { name: 'ก้อนหิน', emoji: '🪨', reqWorker: 2, cost: { wood: 20 }, reward: { gold: 25 } },
    banana: { name: 'ดงกล้วย', emoji: '🍌', reqWorker: 1, cost: { gold: 10 }, reward: { food: 15 } }
};

const BUILDINGS = {
    house: {
        name: 'บ้าน', emoji: '🏠', reqWorkers: 0,
        upgrades: [
            { level: 1, prod: "+🪙1 / -🌾1 (มอบ 👷แรงงาน +1)", workers: 1 },
            { level: 2, prod: "+🪙3 / -🌾2 (มอบ 👷แรงงาน +2)", cost: { gold: 60, wood: 40 }, workers: 2 },
            { level: 3, prod: "+🪙8 / -🌾4 (มอบ 👷แรงงาน +4)", cost: { gold: 200, wood: 100 }, workers: 4 }
        ]
    },
    lumber: {
        name: 'โรงไม้', emoji: '🪓', reqWorkers: 1,
        upgrades: [
            { level: 1, prod: "+🪵2" },
            { level: 2, prod: "+🪵4", cost: { gold: 80 } },
            { level: 3, prod: "+🪵9", cost: { gold: 220, food: 30 } }
        ]
    },
    farm: {
        name: 'ฟาร์ม', emoji: '🌾', reqWorkers: 1,
        upgrades: [
            { level: 1, prod: "+🌾2" },
            { level: 2, prod: "+🌾5", cost: { wood: 50 } },
            { level: 3, prod: "+🌾12", cost: { gold: 150, wood: 80 } }
        ]
    },
    wonder: { name: 'Wonder', emoji: '🏛️', reqWorkers: 5 }
};

let currentQuestIndex = 0;
const quests = [
    {
        title: "🎯 ภารกิจ 1: เอาชีวิตรอด",
        desc: "สร้างบ้าน 1 หลัง และสะสมเงินครบ 🪙 150",
        check: () => countBuildings('house') >= 1 && resources.gold >= 150,
        reward: () => alert("🎉 สำเร็จ! ปลดล็อกการอัพเกรดสิ่งก่อสร้าง Lv.2")
    },
    {
        title: "🎯 ภารกิจ 2: ขยายอาณาเขต",
        desc: "ถางสิ่งกีดขวาง 2 ช่อง และสะสมอาหาร 🌾 50",
        check: () => resources.food >= 50 && countCleared() >= 2,
        reward: () => {
            expandGrid(6);
            alert("🎉 สำเร็จ! ขยายตารางเมืองเป็น 6x6");
        }
    },
    {
        title: "🎯 ภารกิจ 3: พัฒนาขั้นสูง",
        desc: "อัพเกรดสิ่งก่อสร้างระดับ Lv.3 อย่างน้อย 1 แห่ง",
        check: () => hasLevel3Building(),
        reward: () => {
            expandGrid(8);
            alert("🎉 สำเร็จ! ขยายตารางเมืองเป็น 8x8 และปลดล็อก Wonder!");
        }
    },
    {
        title: "🏆 ชัยชนะสูงสุด: Wonder Era",
        desc: "สร้าง Wonder ใช้ 🪙2,500 / 🪵1,500 / 🌾1,000",
        check: () => hasWonder(),
        reward: () => triggerVictory()
    }
];

function initTownBuilderGame() {
    buildCanvas = document.getElementById('townGameCanvas');
    if (!buildCanvas) return;
    buildCtx = buildCanvas.getContext('2d');

    GRID_SIZE = 4;
    resources = { wood: 25, gold: 50, food: 15 };
    currentTool = 'select';
    selectedTile = null;
    movingFromTile = null; 
    gameTime = 0;
    isBuildGameOver = false;
    currentEvent = 'normal';
    eventTimer = 30;
    clearedCount = 0;
    currentQuestIndex = 0;

    grid = Array(8).fill(null).map(() => Array(8).fill(null));
    initObstacles();

    resizeBuildCanvas();

    buildCanvas.onclick = handleBuildCanvasClick;

    if (buildIntervalId) clearInterval(buildIntervalId);
    buildIntervalId = setInterval(buildGameTick, 1000);

    if (buildAnimationId) cancelAnimationFrame(buildAnimationId);
    drawBuildCanvas();

    initBGMUI(); // โหลด UI เสียง BGM
    updateBuildUI();
    updateActionPanel();
}

// 🎵 ฟังก์ชันจัดการ BGM
function initBGMUI() {
    let bgmBtn = document.getElementById('btn-toggle-bgm');
    if (!bgmBtn) {
        const controlsDiv = document.getElementById('bgm-btn-container'); // เปลี่ยนมาเล็งที่กล่องใหม่
        if (controlsDiv) {
            bgmBtn = document.createElement('button');
            bgmBtn.id = 'btn-toggle-bgm';
            bgmBtn.onclick = toggleBGM;
            // บังคับให้ปุ่มกว้างเต็มกล่องที่เตรียมไว้
            bgmBtn.className = 'w-full h-full text-[11px] font-extrabold rounded-xl shadow-xs transition';
            controlsDiv.appendChild(bgmBtn);
        }
    }
    updateBGMButton();
}

function toggleBGM() {
    isBgmMuted = !isBgmMuted;
    bgmAudio.muted = isBgmMuted;
    localStorage.setItem('kids_vocab_bgm_muted', isBgmMuted);
    updateBGMButton();
    if (!isBgmMuted && !hasBgmStarted) {
        bgmAudio.play().catch(e => console.log("รอให้ผู้เล่นกดที่กระดานก่อนเล่นเสียง"));
        hasBgmStarted = true;
    }
}

function updateBGMButton() {
    const btn = document.getElementById('btn-toggle-bgm');
    if (btn) {
        btn.innerHTML = isBgmMuted ? '🔇 ปิดเสียง' : '🔊 เปิดเสียง';
        // อัปเดตสีตามสถานะ โดยรักษาขนาด w-full h-full ไว้
        btn.className = isBgmMuted 
            ? 'w-full h-full bg-slate-600 hover:bg-slate-700 text-white font-extrabold rounded-xl text-[11px] shadow-xs transition'
            : 'w-full h-full bg-indigo-500 hover:bg-indigo-600 text-white font-extrabold rounded-xl text-[11px] shadow-xs transition';
    }
}

function resizeBuildCanvas() {
    if (!buildCanvas) return;
    const containerWidth = Math.min(window.innerWidth - 40, 320);
    TILE_SIZE = containerWidth / GRID_SIZE;
    buildCanvas.width = containerWidth;
    buildCanvas.height = containerWidth;
}

function toggleImmersiveMode() {
    isImmersiveMode = !isImmersiveMode;

    const mainHeader = document.getElementById("main-header");
    const expBar = document.getElementById("exp-bar-container");
    const miniGameTabBar = document.getElementById("minigames-tab-bar");
    const bottomNav = document.getElementById("main-bottom-nav");
    const floatBtn = document.getElementById("btn-add-vocab");
    const buildContainer = document.getElementById("game-build-container");
    const toggleBtn = document.getElementById("btn-toggle-ui");
    const floatRestoreBtn = document.getElementById("float-restore-ui-btn");

    if (isImmersiveMode) {
        if (mainHeader) mainHeader.style.setProperty('display', 'none', 'important');
        if (expBar) expBar.style.setProperty('display', 'none', 'important');
        if (miniGameTabBar) miniGameTabBar.style.setProperty('display', 'none', 'important');
        if (bottomNav) bottomNav.style.setProperty('display', 'none', 'important');
        if (floatBtn) floatBtn.style.setProperty('display', 'none', 'important');

        if (buildContainer) {
            buildContainer.classList.remove("max-h-[calc(100vh-160px)]", "pb-12", "pb-24");
            buildContainer.classList.add("max-h-screen", "pb-4");
        }
        if (toggleBtn) toggleBtn.innerHTML = "👁️ แสดงแถบ";
        if (floatRestoreBtn) floatRestoreBtn.style.setProperty('display', 'flex', 'important');
    } else {
        if (mainHeader) mainHeader.style.removeProperty('display');
        if (expBar) expBar.style.removeProperty('display');
        if (miniGameTabBar) miniGameTabBar.style.removeProperty('display');
        if (bottomNav) bottomNav.style.removeProperty('display');
        if (floatBtn) floatBtn.style.removeProperty('display');

        if (buildContainer) {
            buildContainer.classList.add("max-h-[calc(100vh-160px)]", "pb-24");
            buildContainer.classList.remove("max-h-screen", "pb-4");
        }
        if (toggleBtn) toggleBtn.innerHTML = "👁️ ซ่อนแถบ";
        if (floatRestoreBtn) floatRestoreBtn.style.setProperty('display', 'none', 'important');
    }

    setTimeout(resizeBuildCanvas, 100);
}

function initObstacles() {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (r === 0 && c === 0) continue; 
            const rand = Math.random();
            if (rand < 0.20) grid[r][c] = { type: 'obstacle', obsType: 'tree' };
            else if (rand < 0.32) grid[r][c] = { type: 'obstacle', obsType: 'rock' };
            else if (rand < 0.44) grid[r][c] = { type: 'obstacle', obsType: 'banana' };
        }
    }
}

function countCleared() { return clearedCount; }

function getWorkerStats() {
    let totalWorkers = 0;
    let usedWorkers = 0;

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const item = grid[r][c];
            if (!item) continue;

            if (item.type === 'house' && !item.isBuilding) {
                totalWorkers += BUILDINGS.house.upgrades[item.level - 1].workers;
            } else if (item.type === 'lumber' || item.type === 'farm') {
                usedWorkers += 1;
            } else if (item.type === 'wonder') {
                usedWorkers += 5;
            }

            if (item.isClearing) {
                usedWorkers += OBSTACLES[item.obsType].reqWorker;
            }
        }
    }
    return { free: totalWorkers - usedWorkers, total: totalWorkers, used: usedWorkers };
}

function selectTool(tool) {
    if (movingFromTile) cancelMove(); 
    currentTool = tool;
    document.querySelectorAll('#controls button').forEach(btn => btn.classList.remove('active'));
    const targetBtn = document.getElementById(`btn-${tool}`);
    if (targetBtn) targetBtn.classList.add('active');
    updateActionPanel();
}

function handleBuildCanvasClick(e) {
    // 🎵 ลอจิกเริ่มเล่นเพลงตอนกดจอครั้งแรก
    if (!hasBgmStarted && !isBgmMuted) {
        bgmAudio.play().catch(err => console.log(err));
        hasBgmStarted = true;
    }

    if (isBuildGameOver) return;
    const rect = buildCanvas.getBoundingClientRect();
    const c = Math.floor((e.clientX - rect.left) / TILE_SIZE);
    const r = Math.floor((e.clientY - rect.top) / TILE_SIZE);

    if (r >= GRID_SIZE || c >= GRID_SIZE) return;

    if (movingFromTile) {
        selectedTile = { r, c };
        updateActionPanel();
        return;
    }

    if (currentTool === 'select') {
        selectedTile = { r, c };
        updateActionPanel();
    } else {
        buildStructure(r, c, currentTool);
    }
}

function startMovingBuilding(r, c) {
    movingFromTile = { r, c };
    selectedTile = { r, c };
    updateActionPanel();
}

function cancelMove() {
    movingFromTile = null;
    updateActionPanel();
}

function confirmMove() {
    if (!movingFromTile || !selectedTile) return;
    const fromR = movingFromTile.r;
    const fromC = movingFromTile.c;
    const toR = selectedTile.r;
    const toC = selectedTile.c;

    if (grid[toR][toC] !== null) return; 

    grid[toR][toC] = grid[fromR][fromC];
    grid[fromR][fromC] = null;
    
    movingFromTile = null;
    updateActionPanel();
    updateBuildUI();
}

// 💰 คำนวณเงินคืนครึ่งราคา (Refund 50%)
function getRefund(type, level) {
    let totalWood = 0, totalGold = 0, totalFood = 0;
    
    // ต้นทุนฐาน เลเวล 1
    if (type === 'house') totalWood += 20;
    if (type === 'lumber') totalGold += 30;
    if (type === 'farm') totalWood += 15;

    // บวกต้นทุนอัพเกรดสะสม
    for (let i = 1; i < level; i++) {
        let cost = BUILDINGS[type].upgrades[i].cost;
        if (cost) {
            if (cost.wood) totalWood += cost.wood;
            if (cost.gold) totalGold += cost.gold;
            if (cost.food) totalFood += cost.food;
        }
    }

    // หาร 2 ปัดเศษลง
    return {
        wood: Math.floor(totalWood / 2),
        gold: Math.floor(totalGold / 2),
        food: Math.floor(totalFood / 2)
    };
}

// 💰 ฟังก์ชันขายสิ่งปลูกสร้าง
function sellBuilding(r, c) {
    const item = grid[r][c];
    if (!item || item.isBuilding || item.type === 'wonder') return;

    // ⚠️ ลอจิกเช็คแรงงานติดลบ กรณีขายบ้าน
    if (item.type === 'house') {
        const wStats = getWorkerStats();
        const lostWorkers = BUILDINGS.house.upgrades[item.level - 1].workers;
        if (wStats.total - lostWorkers < wStats.used) {
            alert("❌ ไม่สามารถขายบ้านได้! ต้องเรียกคนงานกลับมาจากโรงไม้/ฟาร์มก่อน (แรงงานจะไม่พอ)");
            return;
        }
    }

    const refund = getRefund(item.type, item.level);
    let refundMsg = [];
    if (refund.wood > 0) refundMsg.push(`🪵${refund.wood}`);
    if (refund.gold > 0) refundMsg.push(`🪙${refund.gold}`);
    if (refund.food > 0) refundMsg.push(`🌾${refund.food}`);

    if (confirm(`คุณต้องการขาย ${BUILDINGS[item.type].name} Lv.${item.level} ใช่หรือไม่?\nคุณจะได้ทรัพยากรคืน: ${refundMsg.join(' ')}`)) {
        resources.wood += refund.wood;
        resources.gold += refund.gold;
        resources.food += refund.food;
        
        grid[r][c] = null;
        selectedTile = null;
        
        updateBuildUI();
        updateActionPanel();
    }
}

function buildStructure(r, c, type) {
    if (grid[r][c] !== null) {
        selectedTile = { r, c };
        updateActionPanel();
        return;
    }

    const wStats = getWorkerStats();
    const reqW = BUILDINGS[type].reqWorkers || 0;

    if (wStats.free < reqW) {
        alert(`แรงงานไม่พอ! ต้องการ 👷${reqW} คน`);
        return;
    }

    if (type === 'house' && resources.wood >= 20) {
        resources.wood -= 20;
        grid[r][c] = { type: 'house', level: 1, isBuilding: true, buildTimer: BUILD_TIME.house[0], maxBuildTime: BUILD_TIME.house[0] };
    } else if (type === 'lumber' && resources.gold >= 30) {
        resources.gold -= 30;
        grid[r][c] = { type: 'lumber', level: 1, isBuilding: true, buildTimer: BUILD_TIME.lumber[0], maxBuildTime: BUILD_TIME.lumber[0] };
    } else if (type === 'farm' && resources.wood >= 15) {
        resources.wood -= 15;
        grid[r][c] = { type: 'farm', level: 1, isBuilding: true, buildTimer: BUILD_TIME.farm[0], maxBuildTime: BUILD_TIME.farm[0] };
    } else if (type === 'wonder') {
        if (currentQuestIndex < 3) {
            alert("ต้องทำเควสปลดล็อก Wonder ก่อน!");
            return;
        }
        if (resources.gold >= 2500 && resources.wood >= 1500 && resources.food >= 1000) {
            resources.gold -= 2500; resources.wood -= 1500; resources.food -= 1000;
            grid[r][c] = { type: 'wonder', level: 1, isBuilding: true, buildTimer: BUILD_TIME.wonder[0], maxBuildTime: BUILD_TIME.wonder[0] };
        } else {
            alert("ทรัพยากรไม่พอสร้าง Wonder!");
        }
    }
    selectedTile = { r, c };
    updateBuildUI();
    updateActionPanel();
}

function clearObstacle(r, c) {
    const item = grid[r][c];
    if (!item || item.type !== 'obstacle' || item.isClearing) return;

    const obs = OBSTACLES[item.obsType];
    const wStats = getWorkerStats();

    if (wStats.free < obs.reqWorker) {
        alert(`แรงงานไม่พอ! ต้องการ 👷${obs.reqWorker} คน`);
        return;
    }

    if (canAfford(obs.cost)) {
        deductCost(obs.cost);
        item.isClearing = true;
        const timeKey = item.obsType === 'tree' ? 'clearTree' : (item.obsType === 'rock' ? 'clearRock' : 'clearBanana');
        item.clearTimer = BUILD_TIME[timeKey];
        updateBuildUI();
        updateActionPanel();
    } else {
        alert("ทรัพยากรไม่พอ!");
    }
}

function upgradeBuilding(r, c) {
    const item = grid[r][c];
    if (!item || item.level >= 3 || item.type === 'wonder' || item.isBuilding) return;

    const nextUpgrade = BUILDINGS[item.type].upgrades[item.level];
    if (canAfford(nextUpgrade.cost)) {
        deductCost(nextUpgrade.cost);
        item.isBuilding = true;
        item.targetLevel = item.level + 1;
        item.buildTimer = BUILD_TIME[item.type][item.level];
        updateBuildUI();
        updateActionPanel();
    } else {
        alert("ทรัพยากรไม่พอสำหรับการอัพเกรด!");
    }
}

function canAfford(cost) {
    if (!cost) return true;
    if (cost.gold && resources.gold < cost.gold) return false;
    if (cost.wood && resources.wood < cost.wood) return false;
    if (cost.food && resources.food < cost.food) return false;
    return true;
}

function deductCost(cost) {
    if (!cost) return;
    if (cost.gold) resources.gold -= cost.gold;
    if (cost.wood) resources.wood -= cost.wood;
    if (cost.food) resources.food -= cost.food;
}

function buildGameTick() {
    if (isBuildGameOver) return;

    gameTime++;
    eventTimer--;

    if (eventTimer <= 0) {
        triggerDisasterEvent();
        eventTimer = 30;
    }

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const item = grid[r][c];
            if (!item) continue;

            if (item.isClearing) {
                item.clearTimer--;
                if (item.clearTimer <= 0) {
                    const obs = OBSTACLES[item.obsType];
                    if (obs.reward.wood) resources.wood += obs.reward.wood;
                    if (obs.reward.gold) resources.gold += obs.reward.gold;
                    if (obs.reward.food) resources.food += obs.reward.food;
                    grid[r][c] = null;
                    clearedCount++;
                }
                continue;
            }

            if (item.isBuilding) {
                item.buildTimer--;
                if (item.buildTimer <= 0) {
                    item.isBuilding = false;
                    if (item.targetLevel) {
                        item.level = item.targetLevel;
                        delete item.targetLevel;
                    }
                }
                continue;
            }

            if (item.type === 'house') {
                const foodReq = item.level === 1 ? 1 : (item.level === 2 ? 2 : 4);
                const goldGain = item.level === 1 ? 1 : (item.level === 2 ? 3 : 8);
                if (resources.food >= foodReq) {
                    resources.gold += goldGain;
                    resources.food -= foodReq;
                }
            } else if (item.type === 'lumber') {
                let woodGain = item.level === 1 ? 2 : (item.level === 2 ? 4 : 9);
                if (currentEvent === 'fire') woodGain = Math.floor(woodGain / 2); // 🔥 เกิดไฟไหม้ ผลิตไม้ลดลง 50%
                resources.wood += woodGain;
            } else if (item.type === 'farm') {
                let farmGain = item.level === 1 ? 2 : (item.level === 2 ? 5 : 12);
                if (currentEvent === 'drought') farmGain = Math.floor(farmGain / 2);
                resources.food += farmGain;
            }
        }
    }

    checkQuestProgress();
    updateBuildUI();
    if (selectedTile) updateActionPanel();
}

function triggerDisasterEvent() {
    const roll = Math.random();
    const banner = document.getElementById('event-banner');
    if (!banner) return;
    banner.style.display = 'block';

    if (roll < 0.35) {
        currentEvent = 'drought';
        banner.className = 'w-full px-3 py-1.5 rounded-xl text-xs font-bold mb-2 bg-orange-600 text-white shadow-xs text-center';
        banner.innerText = '⚠️ เกิดภัยแล้ง! ฟาร์มผลิตอาหารลดลง 50% (30 วินาที)';
    } else if (roll < 0.70) {
        currentEvent = 'fire';
        banner.className = 'w-full px-3 py-1.5 rounded-xl text-xs font-bold mb-2 bg-rose-600 text-white shadow-xs animate-pulse text-center';
        banner.innerText = '🔥 เกิดไฟไหม้! โรงไม้ผลิตไม้ลดลง 50% (30 วินาที)';
    } else {
        currentEvent = 'normal';
        banner.className = 'w-full px-3 py-1.5 rounded-xl text-xs font-bold mb-2 bg-emerald-600 text-white shadow-xs text-center';
        banner.innerText = '☀️ สภาพอากาศปกติ';
    }
}

function checkQuestProgress() {
    if (currentQuestIndex < quests.length) {
        const q = quests[currentQuestIndex];
        if (q.check()) {
            q.reward();
            currentQuestIndex++;
            if (currentQuestIndex < quests.length) updateQuestUI();
        }
    }
}

function updateQuestUI() {
    const qTitle = document.getElementById('quest-title');
    const qStep = document.getElementById('quest-step');
    const qDesc = document.getElementById('quest-desc');

    if (!qTitle || !qStep || !qDesc) return;

    if (currentQuestIndex < quests.length) {
        const q = quests[currentQuestIndex];
        qTitle.innerText = q.title;
        qStep.innerText = `${currentQuestIndex + 1}/${quests.length}`;
        qDesc.innerText = q.desc;
    } else {
        qTitle.innerText = "🏆 เคลียร์ภารกิจสำเร็จ!";
        qDesc.innerText = "คุณเอาชนะโหมด Hard ได้สำเร็จ!";
    }
}

function countBuildings(type) {
    let count = 0;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (grid[r][c] && grid[r][c].type === type && !grid[r][c].isBuilding) count++;
        }
    }
    return count;
}

function hasLevel3Building() {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (grid[r][c] && grid[r][c].level === 3 && !grid[r][c].isBuilding) return true;
        }
    }
    return false;
}

function hasWonder() {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (grid[r][c] && grid[r][c].type === 'wonder' && !grid[r][c].isBuilding) return true;
        }
    }
    return false;
}

function expandGrid(newSize) {
    GRID_SIZE = newSize;
    resizeBuildCanvas();
}

// 🌟 ระบบบันทึกและแสดงสถิติ Leaderboard ลง Firebase 🌟
function triggerVictory() {
    isBuildGameOver = true;
    if (buildIntervalId) clearInterval(buildIntervalId);

    if (typeof totalStars !== 'undefined') totalStars += 3;
    if (typeof saveUserStars === 'function') saveUserStars();

    if (typeof addEXPToUser === 'function') addEXPToUser(200);
    if (typeof incrementTodayRounds === 'function') incrementTodayRounds();

    if (typeof addSkillPointsToUser === 'function' && typeof currentUser !== 'undefined') {
        addSkillPointsToUser(currentUser, 'wealth', 10);
    }

    if (typeof sendInAppNotification === 'function') {
        sendInAppNotification('COMPLETED_BUILD', { timeSec: gameTime });
    }

    const vicText = document.getElementById('victory-text');
    const vicModal = document.getElementById('victory-modal');
    if (vicText) vicText.innerText = `ชนะในเวลา ${formatTime(gameTime)}! รับ ⭐+3, +200 EXP ✨ และ 🪙+10`;
    if (vicModal) vicModal.style.display = 'flex';

    saveAndFetchBuildLeaderboard(gameTime);
}

function saveAndFetchBuildLeaderboard(timeSec) {
    const leaderContainer = document.getElementById('leaderboard-container');
    if (leaderContainer) {
        leaderContainer.innerHTML = `<div class="text-xs text-amber-300 font-bold py-2"><span class="spinner"></span> กำลังบันทึกและโหลดสถิติ...</div>`;
    }

    if (!window.firebaseModules) return;
    const { getDatabase, ref, push, set, get } = window.firebaseModules;
    const db = getDatabase();

    const playerName = (typeof currentUser !== 'undefined' && currentUser) ? currentUser : "นักสร้างเมือง";
    const leaderRef = ref(db, 'leaderboards/build');

    const newRunRef = push(leaderRef);
    set(newRunRef, {
        name: playerName,
        timeSec: timeSec,
        timestamp: Date.now()
    }).then(() => {
        fetchBuildLeaderboard(leaderRef, get);
    }).catch(() => {
        fetchBuildLeaderboard(leaderRef, get);
    });
}

function fetchBuildLeaderboard(leaderRef, getFn) {
    getFn(leaderRef).then((snapshot) => {
        let list = [];
        if (snapshot.exists()) {
            const data = snapshot.val();
            Object.values(data).forEach(item => list.push(item));
        }
        list.sort((a, b) => a.timeSec - b.timeSec);
        renderLeaderboardUI(list.slice(0, 5));
    }).catch(() => {
        renderLeaderboardUI([]);
    });
}

function renderLeaderboardUI(topList) {
    const leaderContainer = document.getElementById('leaderboard-container');
    if (!leaderContainer) return;

    let html = `
        <div class="w-full bg-slate-800/90 p-2.5 rounded-2xl border border-amber-500/40 text-left">
            <div class="text-xs font-bold text-amber-400 mb-1.5 flex items-center justify-between font-kids">
                <span>🏆 อันดับสร้างเมืองเร็วที่สุด (Top 5)</span>
            </div>
            <div class="space-y-1">
    `;

    if (topList.length === 0) {
        html += `<div class="text-[11px] text-slate-400 text-center py-2">ยังไม่มีข้อมูลสถิติ</div>`;
    } else {
        topList.forEach((item, idx) => {
            const medal = idx === 0 ? '🥇' : (idx === 1 ? '🥈' : (idx === 2 ? '🥉' : `#${idx + 1}`));
            html += `
                <div class="flex justify-between items-center bg-slate-900/80 px-2.5 py-1 rounded-xl text-[11px] font-bold text-slate-200 border border-slate-700/50">
                    <div class="flex items-center gap-1.5">
                        <span class="text-xs">${medal}</span>
                        <span class="text-amber-200 font-kids truncate max-w-[110px]">${item.name}</span>
                    </div>
                    <span class="text-emerald-400 font-mono font-extrabold">${formatTime(item.timeSec)}</span>
                </div>
            `;
        });
    }

    html += `</div></div>`;
    leaderContainer.innerHTML = html;
}

function restartBuildGame() {
    const vicModal = document.getElementById('victory-modal');
    if (vicModal) vicModal.style.display = 'none';
    initTownBuilderGame();
}

function formatTime(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

function updateBuildUI() {
    const wStats = getWorkerStats();
    const woodEl = document.getElementById('wood');
    const goldEl = document.getElementById('gold');
    const foodEl = document.getElementById('food');
    const workersEl = document.getElementById('workers');
    const timerEl = document.getElementById('timer');

    if (woodEl) woodEl.innerText = resources.wood;
    if (goldEl) goldEl.innerText = resources.gold;
    if (foodEl) foodEl.innerText = resources.food;
    if (workersEl) workersEl.innerText = `${wStats.free}/${wStats.total}`;
    if (timerEl) timerEl.innerText = formatTime(gameTime);

    updateQuestUI();
}

function updateActionPanel() {
    const panel = document.getElementById('panel-content');
    if (!panel) return;

    if (movingFromTile) {
        if (!selectedTile) return;
        const { r, c } = selectedTile;
        if (r === movingFromTile.r && c === movingFromTile.c) {
            panel.innerHTML = `
                <span class="text-sky-400 text-xs font-bold">แตะพื้นที่เป้าหมาย(สีเขียว) เพื่อย้ายไปที่นั่น</span><br>
                <button class="mt-2 bg-slate-500 hover:bg-slate-600 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs shadow-xs active:scale-95 transition" onclick="cancelMove()">❌ ยกเลิก</button>
            `;
        } else if (grid[r][c] === null) {
            panel.innerHTML = `
                <span class="text-emerald-400 text-xs font-bold">🟢 พื้นที่ว่าง สามารถวางได้!</span><br>
                <div class="mt-2 flex justify-center gap-2">
                    <button class="bg-slate-500 hover:bg-slate-600 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs shadow-xs active:scale-95 transition" onclick="cancelMove()">❌ ยกเลิก</button>
                    <button class="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs shadow-xs active:scale-95 transition" onclick="confirmMove()">✅ ยืนยันการวาง</button>
                </div>
            `;
        } else {
            panel.innerHTML = `
                <span class="text-rose-400 text-xs font-bold">🔴 พื้นที่นี้มีสิ่งกีดขวาง วางไม่ได้</span><br>
                <button class="mt-2 bg-slate-500 hover:bg-slate-600 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs shadow-xs active:scale-95 transition" onclick="cancelMove()">❌ ยกเลิก</button>
            `;
        }
        return;
    }

    if (!selectedTile) {
        panel.innerHTML = `<span class="text-slate-400 text-xs font-bold">คลิกเลือกช่องบนตารางเพื่อสั่งการ</span>`;
        return;
    }

    const { r, c } = selectedTile;
    const item = grid[r][c];

    if (!item) {
        panel.innerHTML = `<span class="text-slate-400 text-xs font-bold">พื้นที่ว่าง - เลือกสิ่งก่อสร้างด้านบนเพื่อสร้าง</span>`;
        return;
    }

    if (item.type === 'obstacle') {
        const obs = OBSTACLES[item.obsType];
        if (item.isClearing) {
            panel.innerHTML = `<div class="font-bold text-amber-300 text-xs">🔨 กำลังถาง${obs.name}...</div><div class="text-xs text-white">เหลือเวลา: ${item.clearTimer}s</div>`;
        } else {
            let costStr = [];
            if (obs.cost.gold) costStr.push(`🪙${obs.cost.gold}`);
            if (obs.cost.wood) costStr.push(`🪵${obs.cost.wood}`);
            let rewardStr = [];
            if (obs.reward.wood) rewardStr.push(`🪵+${obs.reward.wood}`);
            if (obs.reward.gold) rewardStr.push(`🪙+${obs.reward.gold}`);
            if (obs.reward.food) rewardStr.push(`🌾+${obs.reward.food}`);

            panel.innerHTML = `
                <div class="font-bold text-amber-400 text-xs mb-1">${obs.emoji} ${obs.name}</div>
                <div class="text-[11px] text-slate-200 mb-2 font-bold">ใช้: 👷${obs.reqWorker} คน | จ่าย: ${costStr.join(' ')} (ได้: ${rewardStr.join(' ')})</div>
                <button class="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold px-3 py-1.5 rounded-xl text-xs shadow-xs active:scale-95 transition" onclick="clearObstacle(${r}, ${c})">🪓 ถางพื้นที่</button>
            `;
        }
        return;
    }

    if (item.isBuilding) {
        panel.innerHTML = `<div class="font-bold text-amber-300 text-xs">🔨 กำลังสร้าง/อัพเกรด...</div><div class="text-xs text-white">เหลือเวลา: ${item.buildTimer}s</div>`;
        return;
    }

    const bInfo = BUILDINGS[item.type];
    let html = `<div class="font-bold text-amber-400 text-xs mb-1">${bInfo.emoji} ${bInfo.name} Lv.${item.level}</div>`;

    if (item.type === 'house') {
        html += `<div class="text-[11px] text-slate-200 font-bold">ให้แรงงาน: +${bInfo.upgrades[item.level - 1].workers} คน</div>`;
    }

    // 🌟 จัดกลุ่มปุ่มคำสั่งต่างๆ
    html += `<div class="flex flex-wrap gap-1.5 mt-2">`;

    if (item.level < 3 && item.type !== 'wonder') {
        const nextUpgrade = bInfo.upgrades[item.level];
        let costStr = [];
        if (nextUpgrade.cost.gold) costStr.push(`🪙${nextUpgrade.cost.gold}`);
        if (nextUpgrade.cost.wood) costStr.push(`🪵${nextUpgrade.cost.wood}`);

        html += `<div class="w-full text-[11px] text-slate-300 mb-1 font-bold">ถัดไป: ${nextUpgrade.prod} (${BUILD_TIME[item.type][item.level]}s)</div>`;
        html += `<button class="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs shadow-xs active:scale-95 transition" onclick="upgradeBuilding(${r}, ${c})">⬆️ อัพเกรด (${costStr.join(' ')})</button>`;
    } else {
        html += `<div class="w-full text-[11px] text-emerald-400 font-bold mb-1">ระดับสูงสุด</div>`;
        if (item.level === 3 && item.type !== 'wonder') {
            html += `<button class="bg-sky-500 hover:bg-sky-600 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs shadow-xs active:scale-95 transition" onclick="startMovingBuilding(${r}, ${c})">🔀 ย้ายตำแหน่ง</button>`;
        }
    }

    // 💰 เพิ่มปุ่มขาย (Sell) สำหรับสิ่งก่อสร้างที่สร้างเสร็จแล้ว (ไม่ใช่ Wonder)
    if (item.type !== 'wonder') {
        const refund = getRefund(item.type, item.level);
        let refundMsg = [];
        if (refund.wood > 0) refundMsg.push(`🪵${refund.wood}`);
        if (refund.gold > 0) refundMsg.push(`🪙${refund.gold}`);
        if (refund.food > 0) refundMsg.push(`🌾${refund.food}`);
        
        html += `<button class="bg-rose-500 hover:bg-rose-600 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs shadow-xs active:scale-95 transition" onclick="sellBuilding(${r}, ${c})">💰 ขายคืน (${refundMsg.join(' ')})</button>`;
    }

    html += `</div>`; // ปิด flex

    panel.innerHTML = html;
}

function drawBuildCanvas() {
    if (!buildCtx || !buildCanvas) return;

    buildCtx.clearRect(0, 0, buildCanvas.width, buildCanvas.height);

    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            buildCtx.strokeStyle = '#4a7a35';
            buildCtx.lineWidth = 1;
            buildCtx.strokeRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);

            if (movingFromTile && movingFromTile.r === r && movingFromTile.c === c) {
                buildCtx.fillStyle = 'rgba(33, 150, 243, 0.4)';
                buildCtx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                buildCtx.strokeStyle = '#2196f3';
                buildCtx.lineWidth = 2;
                buildCtx.strokeRect(c * TILE_SIZE + 1, r * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE - 2);
            }

            if (selectedTile && selectedTile.r === r && selectedTile.c === c) {
                if (movingFromTile && !(r === movingFromTile.r && c === movingFromTile.c)) {
                    if (grid[r][c] === null) {
                        buildCtx.fillStyle = 'rgba(76, 175, 80, 0.4)'; 
                        buildCtx.strokeStyle = '#4caf50';
                    } else {
                        buildCtx.fillStyle = 'rgba(244, 67, 54, 0.4)'; 
                        buildCtx.strokeStyle = '#f44336';
                    }
                } else {
                    buildCtx.fillStyle = 'rgba(255, 235, 59, 0.3)';
                    buildCtx.strokeStyle = '#ffd54f';
                }
                buildCtx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                buildCtx.lineWidth = 2;
                buildCtx.strokeRect(c * TILE_SIZE + 1, r * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE - 2);
            }

            const item = grid[r][c];
            if (item) {
                if (item.type === 'obstacle') {
                    buildCtx.fillStyle = '#3a532c';
                    buildCtx.fillRect(c * TILE_SIZE + 2, r * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                    buildCtx.font = `${TILE_SIZE * 0.45}px sans-serif`;
                    buildCtx.textAlign = 'center';
                    buildCtx.textBaseline = 'middle';
                    buildCtx.fillText(OBSTACLES[item.obsType].emoji, c * TILE_SIZE + TILE_SIZE / 2, r * TILE_SIZE + TILE_SIZE / 2);

                    if (item.isClearing) {
                        buildCtx.fillStyle = 'rgba(0,0,0,0.5)';
                        buildCtx.fillRect(c * TILE_SIZE + 2, r * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                        buildCtx.font = `bold ${TILE_SIZE * 0.3}px sans-serif`;
                        buildCtx.fillStyle = '#fff';
                        buildCtx.fillText(`🔨${item.clearTimer}s`, c * TILE_SIZE + TILE_SIZE / 2, r * TILE_SIZE + TILE_SIZE / 2);
                    }
                } else {
                    const typeImgs = buildingImages[item.type];
                    const imgObj = (typeImgs && typeImgs[item.level - 1]) ? typeImgs[item.level - 1] : null;

                    if (imgObj && imgObj.complete && imgObj.naturalWidth !== 0) {
                        const pad = 2;
                        buildCtx.drawImage(imgObj, c * TILE_SIZE + pad, r * TILE_SIZE + pad, TILE_SIZE - (pad * 2), TILE_SIZE - (pad * 2));
                    } else {
                        buildCtx.fillStyle = '#43a047';
                        if (item.type === 'house') buildCtx.fillStyle = '#e91e63';
                        if (item.type === 'lumber') buildCtx.fillStyle = '#795548';
                        if (item.type === 'farm') buildCtx.fillStyle = '#fbc02d';
                        if (item.type === 'wonder') buildCtx.fillStyle = '#8e24aa';

                        buildCtx.fillRect(c * TILE_SIZE + 2, r * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);

                        buildCtx.font = `${TILE_SIZE * 0.45}px sans-serif`;
                        buildCtx.textAlign = 'center';
                        buildCtx.textBaseline = 'middle';
                        buildCtx.fillText(BUILDINGS[item.type].emoji, c * TILE_SIZE + TILE_SIZE / 2, r * TILE_SIZE + TILE_SIZE / 2);
                    }

                    if (item.isBuilding) {
                        buildCtx.fillStyle = 'rgba(0,0,0,0.6)';
                        buildCtx.fillRect(c * TILE_SIZE + 2, r * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                        buildCtx.font = `bold ${TILE_SIZE * 0.3}px sans-serif`;
                        buildCtx.fillStyle = '#ffd54f';
                        buildCtx.fillText(`🔨${item.buildTimer}s`, c * TILE_SIZE + TILE_SIZE / 2, r * TILE_SIZE + TILE_SIZE / 2);
                    } else if (item.type !== 'wonder') {
                        buildCtx.font = `bold ${Math.max(9, TILE_SIZE * 0.22)}px sans-serif`;
                        buildCtx.fillStyle = '#ffffff';
                        buildCtx.fillText(`v${item.level}`, c * TILE_SIZE + TILE_SIZE - 8, r * TILE_SIZE + TILE_SIZE - 6);
                    }
                }
            }
        }
    }
    buildAnimationId = requestAnimationFrame(drawBuildCanvas);
}
