// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .catch((err) => console.log('Service Worker Registration Failed:', err));
    });
}

window.addEventListener('load', () => {
    setTimeout(() => {
        const splash = document.getElementById('ios-splash-screen');
        if (splash) splash.classList.add('fade-out');
    }, 1200);
});

const embeddedFirebaseConfig = {
    apiKey: "", authDomain: "han-vocab.firebaseapp.com",
    databaseURL: "https://han-vocab-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "han-vocab", storageBucket: "han-vocab.firebasestorage.app",
    messagingSenderId: "461536815804", appId: "1:461536815804:web:16e6286e8bc13350c0beb9",
    measurementId: "G-8N7Y0Z8BFR"
};

let defaultVocabEN = [
    { en: "Apple", th: "แอปเปิ้ล", phonetic: "แอบ-เปิ้ล", emoji: "🍎", image: null, assignees: ["พูน", "เพลิน"] },
    { en: "Dog", th: "สุนัข", phonetic: "ด็อก", emoji: "🐶", image: null, assignees: ["พูน", "เพลิน"] },
    { en: "Cat", th: "แมว", phonetic: "แคท", emoji: "🐱", image: null, assignees: ["พูน", "เพลิน"] },
    { en: "Bird", th: "นก", phonetic: "เบิร์ด", emoji: "🐦", image: null, assignees: ["พูน", "เพลิน"] },
    { en: "Fish", th: "ปลา", phonetic: "ฟิช", emoji: "🐟", image: null, assignees: ["พูน", "เพลิน"] }
];

let defaultVocabTH = [
    { en: "Banana", th: "กล้วย", phonetic: "กล้วย", emoji: "🍌", image: null, assignees: ["พูน", "เพลิน"] },
    { en: "Elephant", th: "ช้าง", phonetic: "ช้าง", emoji: "🐘", image: null, assignees: ["พูน", "เพลิน"] },
    { en: "House", th: "บ้าน", phonetic: "บ้าน", emoji: "🏠", image: null, assignees: ["พูน", "เพลิน"] },
    { en: "Car", th: "รถยนต์", phonetic: "รถ-ยนต์", emoji: "🚗", image: null, assignees: ["พูน", "เพลิน"] },
    { en: "Sun", th: "พระอาทิตย์", phonetic: "พระ-อา-ทิตย์", emoji: "☀️", image: null, assignees: ["พูน", "เพลิน"] }
];

let defaultRewards = [
    { id: "1", name: "🍦 ไอศกรีม 1 ถ้วย", stars: 2, cost: 2, currencyType: "stars" },
    { id: "2", name: "🎮 เล่นเกม 15 นาที", stars: 3, cost: 3, currencyType: "trophies" },
    { id: "3", name: "🧸 ของขวัญพิเศษ 1 ชิ้น", stars: 5, cost: 5, currencyType: "stars" }
];

let defaultParentQuests = [
    { id: "1", title: "🧹 ช่วยเก็บของเล่นใส่กล่อง", stars: 2, skillType: "fitness", skillPoints: 5, assignees: ["พูน", "เพลิน"] },
    { id: "2", title: "📚 ทำการบ้านประจำวันเสร็จตรงเวลา", stars: 3, skillType: "knowledge", skillPoints: 5, assignees: ["พูน", "เพลิน"] }
];

let parentQuestsList = [];
let rewardsList = [];
let userInventoryList = []; 
let subjectMode = "EN"; 
let rawVocabList = []; 
let filteredVocabList = []; 
let notificationsList = [];
let currentIndex = 0;
let setCorrectAnswers = 0; 

// --- DUAL CURRENCY STATE ---
let totalStars = 0;
let totalTrophies = 0;

let isFlipped = false;
let currentResizedBase64 = null;

let currentUser = null; 
let pendingProfile = null;
let isParentUser = false;
let currentMainTab = 'quest';
let currentMiniGame = 'vocab';

let isDailyLimitEnabled = true;
let dailyLimitRounds = 3;
let todayPlayedRounds = 0;

let maxLevel = 20;
let currentChildEXP = 0;
let currentChildLevel = 1;
let levelAvatarsConfig = { 'พูน': {}, 'เพลิน': {} };
let selectedLvlConfigChild = 'พูน';

let userSkillsList = {
    'พูน': { knowledge: 0, fitness: 0, wealth: 0 },
    'เพลิน': { knowledge: 0, fitness: 0, wealth: 0 }
};

window.currentUserData = window.currentUserData || { plantLibrary: [] };

let dbRefVocabEN, dbRefVocabTH, dbRefNotify, dbRefRewards, dbRefParentQuests, dbRefDailyConfig, dbRefLevelConfig, dbRefUserSkills;
let isFirebaseActive = false;

// --- Firebase Listener Unsubscribe References ---
let unsubUserStars = null;
let unsubUserTrophies = null;
let unsubUserExp = null;
let unsubUserDailyRounds = null;
let unsubUserInventory = null;
let unsubUserPlantLibrary = null;
let unsubVocab = null;

function cleanupUserListeners() {
    if (unsubUserStars) { unsubUserStars(); unsubUserStars = null; }
    if (unsubUserTrophies) { unsubUserTrophies(); unsubUserTrophies = null; }
    if (unsubUserExp) { unsubUserExp(); unsubUserExp = null; }
    if (unsubUserDailyRounds) { unsubUserDailyRounds(); unsubUserDailyRounds = null; }
    if (unsubUserInventory) { unsubUserInventory(); unsubUserInventory = null; }
    if (unsubUserPlantLibrary) { unsubUserPlantLibrary(); unsubUserPlantLibrary = null; }
}

function attachVocabListener() {
    if (!isFirebaseActive) return;
    if (unsubVocab) { unsubVocab(); unsubVocab = null; }

    const { ref, onValue, set } = window.firebaseModules;
    const db = window.firebaseModules.getDatabase();
    dbRefVocabEN = ref(db, 'kids_vocab_en_shared');
    dbRefVocabTH = ref(db, 'kids_vocab_th_shared');

    const currentDbRef = subjectMode === 'EN' ? dbRefVocabEN : dbRefVocabTH;

    unsubVocab = onValue(currentDbRef, (snapshot) => {
        const data = snapshot.val();
        let parsedData = [];
        if (data) { parsedData = Array.isArray(data) ? data : Object.values(data); }
        if (parsedData.length > 0) {
            rawVocabList = parsedData;
        } else {
            rawVocabList = subjectMode === 'EN' ? [...defaultVocabEN] : [...defaultVocabTH];
            set(currentDbRef, rawVocabList);
        }
        if(typeof filterVocabForUser === 'function') filterVocabForUser();
        if(typeof updateCard === 'function') updateCard();
        if(typeof vocabSubMode !== 'undefined' && vocabSubMode === 'match' && typeof startMatchingGame === 'function') startMatchingGame();
    });
}

function switchSubjectMode(mode) {
    if (subjectMode === mode) return;
    subjectMode = mode;
    
    const btnEN = document.getElementById("mode-en-btn");
    const btnTH = document.getElementById("mode-th-btn");
    if (btnEN && btnTH) {
        if (mode === 'EN') {
            btnEN.className = "px-2.5 py-1 rounded-xl text-xs font-black bg-white text-pink-700 shadow-sm transition";
            btnTH.className = "px-2.5 py-1 rounded-xl text-xs font-black text-white hover:bg-white/20 transition";
        } else {
            btnTH.className = "px-2.5 py-1 rounded-xl text-xs font-black bg-white text-pink-700 shadow-sm transition";
            btnEN.className = "px-2.5 py-1 rounded-xl text-xs font-black text-white hover:bg-white/20 transition";
        }
    }

    currentIndex = 0; 
    setCorrectAnswers = 0;

    if (isFirebaseActive) {
        attachVocabListener();
    } else {
        const localData = localStorage.getItem(`kids_vocab_${subjectMode.toLowerCase()}_data`);
        rawVocabList = localData ? JSON.parse(localData) : (subjectMode === 'EN' ? [...defaultVocabEN] : [...defaultVocabTH]);
        if(typeof filterVocabForUser === 'function') filterVocabForUser();
        if(typeof updateCard === 'function') updateCard();
        if(typeof vocabSubMode !== 'undefined' && vocabSubMode === 'match' && typeof startMatchingGame === 'function') startMatchingGame();
    }
}

function getTodayDateString() {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth()+1}-${today.getDate()}`;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function calculateSkillLevel(points) {
    const pts = points || 0;
    const level = Math.min(5, Math.floor(pts / 10));
    const currentLevelPoints = pts % 10;
    return { level, currentLevelPoints, isMax: level >= 5 };
}

function initData() {
    const savedKey = localStorage.getItem("gemini_api_key");
    if (savedKey) document.getElementById("input-api-key").value = savedKey;

    const savedPin = localStorage.getItem("parent_pin") || "1234";
    document.getElementById("input-parent-pin").value = savedPin;

    const fbConfigStr = localStorage.getItem("firebase_config");
    if (fbConfigStr) {
        document.getElementById("input-firebase-config").value = fbConfigStr;
    } else if (embeddedFirebaseConfig && embeddedFirebaseConfig.apiKey) {
        document.getElementById("input-firebase-config").value = JSON.stringify(embeddedFirebaseConfig, null, 2);
    }

    isDailyLimitEnabled = localStorage.getItem("enable_daily_limit") !== "false";
    dailyLimitRounds = parseInt(localStorage.getItem("daily_limit_rounds") || "3", 10);
    maxLevel = parseInt(localStorage.getItem("max_level") || "20", 10);
    document.getElementById("input-max-level").value = maxLevel;

    const savedAvatars = localStorage.getItem("level_avatars_config");
    if (savedAvatars) levelAvatarsConfig = JSON.parse(savedAvatars);
    
    document.getElementById("input-enable-daily-limit").checked = isDailyLimitEnabled;
    document.getElementById("input-daily-limit-rounds").value = dailyLimitRounds;

    setTimeout(initFirebase, 300);

    // Auto-restore profile หากเคยล็อกอินไว้แล้ว
    const lastUser = localStorage.getItem("last_active_user");
    const lastIsParent = localStorage.getItem("last_is_parent") === "true";
    if (lastUser) {
        setProfile(lastUser, lastIsParent);
        document.getElementById("profile-modal").classList.add("hidden");
    } else {
        openProfileModal();
    }
}

function switchMainTab(tab) {
    if(typeof closeCameraForStory === 'function') closeCameraForStory();
    currentMainTab = tab;

    const navQuest = document.getElementById("nav-btn-quest");
    const navGame = document.getElementById("nav-btn-game");
    const navShop = document.getElementById("nav-btn-shop");
    const questSec = document.getElementById("main-quest-tab");
    const gameSec = document.getElementById("main-game-tab");
    const shopSec = document.getElementById("main-shop-tab");
    const langSwitchBox = document.getElementById("lang-switch-box");

    [navQuest, navGame, navShop].forEach(n => {
        if (n) { n.classList.remove("text-indigo-600"); n.classList.add("text-slate-400"); }
    });

    questSec.classList.add("hidden"); questSec.classList.remove("flex");
    gameSec.classList.add("hidden"); gameSec.classList.remove("flex");
    shopSec.classList.add("hidden"); shopSec.classList.remove("flex");
    langSwitchBox.classList.add("hidden");

    if (tab === 'quest') {
        if (navQuest) { navQuest.classList.remove("text-slate-400"); navQuest.classList.add("text-indigo-600"); }
        questSec.classList.remove("hidden"); questSec.classList.add("flex");
        if(typeof renderParentQuestsList === 'function') renderParentQuestsList();
    } else if (tab === 'game') {
        if (navGame) { navGame.classList.remove("text-slate-400"); navGame.classList.add("text-indigo-600"); }
        gameSec.classList.remove("hidden"); gameSec.classList.add("flex");
        if(typeof switchMiniGame === 'function') switchMiniGame(currentMiniGame);
    } else if (tab === 'shop') {
        if (navShop) { navShop.classList.remove("text-slate-400"); navShop.classList.add("text-indigo-600"); }
        shopSec.classList.remove("hidden"); shopSec.classList.add("flex");
        
        const qStarsEl = document.getElementById("quest-user-stars");
        if (qStarsEl) qStarsEl.innerText = `⭐ ${totalStars}`;
        
        const qTrophiesEl = document.getElementById("quest-user-trophies");
        if (qTrophiesEl) qTrophiesEl.innerText = `🏆 ${totalTrophies}`;
        
        const parentAddSec = document.getElementById("parent-add-reward-section");
        if (isParentUser) {
            parentAddSec.classList.remove("hidden");
        } else {
            parentAddSec.classList.add("hidden");
        }
        if(typeof switchRewardTab === 'function') switchRewardTab('shop');
        if(typeof renderRewardsList === 'function') renderRewardsList();
    }
    checkDailyLimitStatus();
}

function initFirebase() {
    const configStr = localStorage.getItem("firebase_config");
    let firebaseConfig = embeddedFirebaseConfig;

    if (configStr) {
        try { firebaseConfig = JSON.parse(configStr); } 
        catch(e) { console.error("Local config parse error, using embedded config", e); }
    }

    if (!firebaseConfig || !firebaseConfig.apiKey) {
        const localData = localStorage.getItem(`kids_vocab_${subjectMode.toLowerCase()}_data`);
        rawVocabList = localData ? JSON.parse(localData) : (subjectMode === 'EN' ? [...defaultVocabEN] : [...defaultVocabTH]);
        
        const localRewards = localStorage.getItem("kids_rewards_list");
        rewardsList = localRewards ? JSON.parse(localRewards) : [...defaultRewards];

        const localQuests = localStorage.getItem("kids_parent_quests");
        parentQuestsList = localQuests ? JSON.parse(localQuests) : [...defaultParentQuests];

        const localSkills = localStorage.getItem("kids_user_skills");
        if (localSkills) userSkillsList = JSON.parse(localSkills);

        if(typeof filterVocabForUser === 'function') filterVocabForUser();
        if(typeof updateCard === 'function') updateCard();
        if(typeof renderRewardsList === 'function') renderRewardsList();
        if(typeof renderParentQuestsList === 'function') renderParentQuestsList();
        renderUserSkillsUI();
        return;
    }

    try {
        const { initializeApp, getDatabase, ref, onValue, set } = window.firebaseModules;
        const app = initializeApp(firebaseConfig);
        const db = getDatabase(app);
        
        dbRefVocabEN = ref(db, 'kids_vocab_en_shared');
        dbRefVocabTH = ref(db, 'kids_vocab_th_shared');
        dbRefNotify = ref(db, 'kids_notifications');
        dbRefRewards = ref(db, 'kids_rewards');
        dbRefParentQuests = ref(db, 'kids_parent_quests');
        dbRefDailyConfig = ref(db, 'kids_daily_config');
        dbRefLevelConfig = ref(db, 'kids_level_config');
        dbRefUserSkills = ref(db, 'user_skills');

        onValue(dbRefDailyConfig, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                isDailyLimitEnabled = data.enabled;
                dailyLimitRounds = data.rounds;
                document.getElementById("input-enable-daily-limit").checked = isDailyLimitEnabled;
                document.getElementById("input-daily-limit-rounds").value = dailyLimitRounds;
                checkDailyLimitStatus();
            }
        });

        onValue(dbRefLevelConfig, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                maxLevel = data.maxLevel || 20;
                levelAvatarsConfig = data.levelAvatars || { 'พูน': {}, 'เพลิน': {} };
                document.getElementById("input-max-level").value = maxLevel;
                updateUserLevelAndAvatarDisplay();
            }
        });

        onValue(dbRefUserSkills, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                userSkillsList = data;
                renderUserSkillsUI();
            }
        });

        isFirebaseActive = true;
        attachVocabListener();

        onValue(dbRefRewards, (snapshot) => {
            const data = snapshot.val();
            let parsedRewards = [];
            if (data) { parsedRewards = Array.isArray(data) ? data : Object.values(data); }
            if (parsedRewards.length > 0) { rewardsList = parsedRewards; } 
            else { rewardsList = [...defaultRewards]; set(dbRefRewards, rewardsList); }
            if(typeof renderRewardsList === 'function') renderRewardsList();
        });

        onValue(dbRefParentQuests, (snapshot) => {
            const data = snapshot.val();
            let parsedQuests = [];
            if (data) { parsedQuests = Array.isArray(data) ? data : Object.values(data); }
            if (parsedQuests.length > 0) { parentQuestsList = parsedQuests; } 
            else { parentQuestsList = [...defaultParentQuests]; set(dbRefParentQuests, parentQuestsList); }
            if(typeof renderParentQuestsList === 'function') renderParentQuestsList();
        });

        onValue(dbRefNotify, (snapshot) => {
            const data = snapshot.val();
            notificationsList = [];
            if (data) {
                Object.keys(data).forEach(key => { notificationsList.push({ id: key, ...data[key] }); });
                notificationsList.sort((a, b) => b.timestamp - a.timestamp);
                document.getElementById("notify-badge").classList.remove("hidden");
                document.getElementById("notify-dot").classList.remove("hidden");
            }
            if(typeof renderNotifications === 'function') renderNotifications();
            if(typeof renderParentQuestsList === 'function') renderParentQuestsList();
        });

        if (currentUser) loadUserStars();

    } catch (e) {
        console.error("Firebase Error:", e);
    }
}

function openProfileModal() { document.getElementById("profile-modal").classList.remove("hidden"); }

function selectProfile(name, requiresPin) {
    if (requiresPin) {
        pendingProfile = name;
        document.getElementById("pin-target-name").innerText = `เข้าสู่ระบบสำหรับ ${name}`;
        document.getElementById("pin-input").value = "";
        document.getElementById("pin-modal").classList.remove("hidden");
    } else {
        setProfile(name, false);
        document.getElementById("profile-modal").classList.add("hidden");
    }
}

function verifyPin() {
    const pin = document.getElementById("pin-input").value.trim();
    const currentSavedPin = localStorage.getItem("parent_pin") || "1234";

    if (pin === currentSavedPin) {
        setProfile(pendingProfile, true);
        closePinModal();
        document.getElementById("profile-modal").classList.add("hidden");
    } else {
        alert(`รหัสผ่านไม่ถูกต้อง!`);
    }
}

function closePinModal() {
    document.getElementById("pin-modal").classList.add("hidden");
    pendingProfile = null;
}

function setProfile(name, isParent) {
    currentUser = name;
    isParentUser = isParent;

    // เซฟการจำค่าผู้ใช้ลง LocalStorage
    localStorage.setItem("last_active_user", name);
    localStorage.setItem("last_is_parent", isParent ? "true" : "false");

    document.getElementById("user-name").innerText = name;
    
    const avatarImages = { 
        'พ่อนะ': 'luigi.png', 
        'แม่พัด': 'rosalina.png', 
        'พูน': 'mario.png', 
        'เพลิน': 'peach.png' 
    };

    const avatarImgEl = document.getElementById("user-avatar-img");
    const avatarEmojiEl = document.getElementById("user-avatar");

    if (avatarImages[name]) {
        avatarImgEl.src = avatarImages[name];
        avatarImgEl.classList.remove("hidden");
        avatarEmojiEl.classList.add("hidden");
    } else {
        avatarEmojiEl.innerText = '👤';
        avatarEmojiEl.classList.remove("hidden");
        avatarImgEl.classList.add("hidden");
    }

    const addBtn = document.getElementById("btn-add-vocab");
    const btnKey = document.getElementById("btn-key");
    const parentControls = document.getElementById("parent-controls");
    const parentCreateQuestBox = document.getElementById("parent-create-quest-box");
    const parentManageStarsBox = document.getElementById("parent-manage-stars-box");
    const parentFilterBox = document.getElementById("parent-filter-box");

    if (isParent) {
        addBtn.classList.remove("hidden"); addBtn.classList.add("flex");
        btnKey.classList.remove("hidden"); btnKey.classList.add("flex");
        parentControls.classList.remove("hidden");
        if (parentCreateQuestBox) parentCreateQuestBox.classList.remove("hidden");
        if (parentManageStarsBox) parentManageStarsBox.classList.remove("hidden");
        if (parentFilterBox) parentFilterBox.classList.remove("hidden");
    } else {
        addBtn.classList.add("hidden"); addBtn.classList.remove("flex");
        btnKey.classList.add("hidden"); btnKey.classList.remove("flex");
        parentControls.classList.add("hidden");
        if (parentCreateQuestBox) parentCreateQuestBox.classList.add("hidden");
        if (parentManageStarsBox) parentManageStarsBox.classList.add("hidden");
        if (parentFilterBox) parentFilterBox.classList.add("hidden");
    }

    if (typeof switchVocabPlayMode === 'function') switchVocabPlayMode('cards');

    if(typeof filterVocabForUser === 'function') filterVocabForUser();
    currentIndex = 0;
    setCorrectAnswers = 0;
    loadUserStars();
    renderUserSkillsUI();
    if(typeof updateCard === 'function') updateCard();
    if(typeof renderParentQuestsList === 'function') renderParentQuestsList();
    if(typeof renderNotifications === 'function') renderNotifications();
    if(typeof renderPlantLibrary === 'function') renderPlantLibrary();
}

function saveUserData() {
    if (!currentUser) return;
    if (!window.currentUserData) window.currentUserData = {};
    const plantLib = window.currentUserData.plantLibrary || [];

    if (isFirebaseActive) {
        const { ref, set } = window.firebaseModules;
        const db = window.firebaseModules.getDatabase();
        set(ref(db, `user_plant_library/${currentUser}`), plantLib);
    } else {
        localStorage.setItem(`user_plant_library_${currentUser}`, JSON.stringify(plantLib));
    }
}

function addSkillPointsToUser(childName, skillType, points) {
    if (!childName || !skillType || points <= 0) return;
    
    if (!userSkillsList[childName]) {
        userSkillsList[childName] = { knowledge: 0, fitness: 0, wealth: 0 };
    }
    
    userSkillsList[childName][skillType] = (userSkillsList[childName][skillType] || 0) + points;

    if (isFirebaseActive) {
        const { ref, set } = window.firebaseModules;
        const db = window.firebaseModules.getDatabase();
        set(ref(db, `user_skills/${childName}`), userSkillsList[childName]);
    } else {
        localStorage.setItem("kids_user_skills", JSON.stringify(userSkillsList));
    }
    renderUserSkillsUI();
}

function renderUserSkillsUI() {
    const container = document.getElementById("user-stats-skills-container");
    if (!container) return;

    if (!currentUser || isParentUser) {
        container.classList.add("hidden");
        return;
    }
    container.classList.remove("hidden");

    const skills = userSkillsList[currentUser] || { knowledge: 0, fitness: 0, wealth: 0 };
    
    const skillConfig = [
        { key: 'knowledge', name: '🧠 ความรู้', color: 'bg-blue-500' },
        { key: 'fitness', name: '💪 พลังกาย', color: 'bg-emerald-500' },
        { key: 'wealth', name: '🪙 ความร่ำรวย', color: 'bg-amber-500' }
    ];

    let html = '';
    skillConfig.forEach(s => {
        const pts = skills[s.key] || 0;
        const lvlData = calculateSkillLevel(pts);
        const progressPct = lvlData.isMax ? 100 : (lvlData.currentLevelPoints / 10) * 100;

        html += `
            <div class="bg-white p-2.5 rounded-2xl border border-indigo-100 shadow-2xs space-y-1">
                <div class="flex justify-between items-center text-xs font-bold font-kids">
                    <span class="text-slate-700">${s.name}</span>
                    <span class="text-indigo-600">Lv.${lvlData.level} / 5 (${pts} แต้ม)</span>
                </div>
                <div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div class="${s.color} h-full transition-all duration-500 rounded-full" style="width: ${progressPct}%"></div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function calculateLevelFromEXP(exp) {
    let lvl = 1;
    let req = 200;
    let currentExpAcc = exp;
    while (currentExpAcc >= req && lvl < maxLevel) {
        currentExpAcc -= req;
        lvl++;
        req = lvl * 200;
    }
    return { level: lvl, currentLevelEXP: currentExpAcc, nextLevelReqEXP: req };
}

function loadUserStars() {
    cleanupUserListeners();
    if (!window.currentUserData) window.currentUserData = {};

    if (isFirebaseActive && currentUser) {
        const { ref, onValue } = window.firebaseModules;
        const db = window.firebaseModules.getDatabase();
        
        unsubUserStars = onValue(ref(db, `user_stars/${currentUser}`), (snapshot) => {
            const val = snapshot.val();
            totalStars = val !== null ? val : 0;
            const scoreEl = document.getElementById("score");
            if (scoreEl) scoreEl.innerText = totalStars;
            const qStarsEl = document.getElementById("quest-user-stars");
            if (qStarsEl) qStarsEl.innerText = `⭐ ${totalStars}`;
        });

        unsubUserTrophies = onValue(ref(db, `user_trophies/${currentUser}`), (snapshot) => {
            const val = snapshot.val();
            totalTrophies = val !== null ? val : 0;
            const trophyEl = document.getElementById("score-trophy");
            if (trophyEl) trophyEl.innerText = totalTrophies;
            const qTrophiesEl = document.getElementById("quest-user-trophies");
            if (qTrophiesEl) qTrophiesEl.innerText = `🏆 ${totalTrophies}`;
        });

        unsubUserExp = onValue(ref(db, `user_exp/${currentUser}`), (snapshot) => {
            const val = snapshot.val();
            currentChildEXP = val !== null ? val : 0;
            updateUserLevelAndAvatarDisplay();
        });

        unsubUserPlantLibrary = onValue(ref(db, `user_plant_library/${currentUser}`), (snapshot) => {
            const val = snapshot.val();
            let parsed = [];
            if (val) { parsed = Array.isArray(val) ? val : Object.values(val); }
            window.currentUserData.plantLibrary = parsed;
            if (typeof renderPlantLibrary === 'function') renderPlantLibrary();
        });

        const todayStr = getTodayDateString();
        unsubUserDailyRounds = onValue(ref(db, `user_daily_rounds/${currentUser}/${todayStr}`), (snapshot) => {
            const val = snapshot.val();
            todayPlayedRounds = val !== null ? val : 0;
            checkDailyLimitStatus();
        });

        if (isParentUser) {
            unsubUserInventory = onValue(ref(db, `user_inventory`), (snapshot) => {
                const val = snapshot.val();
                userInventoryList = [];
                if (val) {
                    Object.keys(val).forEach(childName => {
                        Object.keys(val[childName]).forEach(k => {
                            userInventoryList.push({ owner: childName, ...val[childName][k], originalInvId: val[childName][k].invId, invId: k });
                        });
                    });
                }
                if(typeof renderUserInventory === 'function') renderUserInventory();
            });
        } else {
            unsubUserInventory = onValue(ref(db, `user_inventory/${currentUser}`), (snapshot) => {
                const val = snapshot.val();
                userInventoryList = [];
                if (val) {
                    Object.keys(val).forEach(k => userInventoryList.push({ owner: currentUser, ...val[k], originalInvId: val[k].invId, invId: k }));
                }
                if(typeof renderUserInventory === 'function') renderUserInventory();
            });
        }
    } else {
        totalStars = parseInt(localStorage.getItem(`total_stars_${currentUser || 'guest'}`) || "0", 10);
        const scoreEl = document.getElementById("score");
        if (scoreEl) scoreEl.innerText = totalStars;
        const qStarsEl = document.getElementById("quest-user-stars");
        if (qStarsEl) qStarsEl.innerText = `⭐ ${totalStars}`;

        totalTrophies = parseInt(localStorage.getItem(`total_trophies_${currentUser || 'guest'}`) || "0", 10);
        const trophyEl = document.getElementById("score-trophy");
        if (trophyEl) trophyEl.innerText = totalTrophies;
        const qTrophiesEl = document.getElementById("quest-user-trophies");
        if (qTrophiesEl) qTrophiesEl.innerText = `🏆 ${totalTrophies}`;

        currentChildEXP = parseInt(localStorage.getItem(`user_exp_${currentUser || 'guest'}`) || "0", 10);
        updateUserLevelAndAvatarDisplay();

        const localPlantData = localStorage.getItem(`user_plant_library_${currentUser || 'guest'}`);
        window.currentUserData.plantLibrary = localPlantData ? JSON.parse(localPlantData) : [];
        if (typeof renderPlantLibrary === 'function') renderPlantLibrary();

        const todayStr = getTodayDateString();
        todayPlayedRounds = parseInt(localStorage.getItem(`daily_rounds_${currentUser}_${todayStr}`) || "0", 10);
        
        if (isParentUser) {
            userInventoryList = [];
            ['พูน', 'เพลิน'].forEach(c => {
                const localInv = localStorage.getItem(`user_inventory_${c}`);
                if (localInv) {
                    const parsed = JSON.parse(localInv);
                    parsed.forEach(item => userInventoryList.push({ ...item, owner: c }));
                }
            });
        } else {
            const localInv = localStorage.getItem(`user_inventory_${currentUser}`);
            userInventoryList = localInv ? JSON.parse(localInv).map(i => ({ ...i, owner: currentUser })) : [];
        }
        if(typeof renderUserInventory === 'function') renderUserInventory();
        checkDailyLimitStatus();
    }
}

function updateUserLevelAndAvatarDisplay() {
    const lvlData = calculateLevelFromEXP(currentChildEXP);
    currentChildLevel = lvlData.level;

    if (isParentUser || !currentUser) {
        document.getElementById("exp-bar-container").classList.add("hidden");
        document.getElementById("user-level-tag").classList.add("hidden");
    } else {
        document.getElementById("user-level-tag").innerText = `Lv.${currentChildLevel}`;
        document.getElementById("user-level-tag").classList.remove("hidden");
        document.getElementById("exp-bar-container").classList.remove("hidden");
        document.getElementById("exp-level-text").innerText = `Lv.${currentChildLevel}`;
        
        const pct = Math.min(100, Math.round((lvlData.currentLevelEXP / lvlData.nextLevelReqEXP) * 100));
        document.getElementById("exp-progress").style.width = `${pct}%`;
        document.getElementById("exp-val-text").innerText = `${lvlData.currentLevelEXP}/${lvlData.nextLevelReqEXP} EXP`;
    }

    const heroNameEl = document.getElementById("hero-user-name");
    const heroImgEl = document.getElementById("hero-avatar-img");
    const heroEmojiEl = document.getElementById("hero-avatar-emoji");
    const heroLvlBadgeEl = document.getElementById("hero-level-badge");
    const heroExpBar = document.getElementById("hero-exp-progress");
    const heroExpText = document.getElementById("hero-exp-text");

    if (heroNameEl) {
        if (isParentUser) {
            heroNameEl.innerText = `${currentUser || 'ผู้ปกครอง'} (โหมดผู้ปกครอง)`;
            heroLvlBadgeEl.innerText = `พ่อนะ / แม่พัด`;
            heroImgEl.classList.add("hidden");
            heroEmojiEl.classList.remove("hidden");
            heroEmojiEl.innerText = currentUser === 'แม่พัด' ? '👩‍💼' : '👨‍💼';
            document.getElementById("hero-exp-container").classList.add("hidden");
        } else {
            heroNameEl.innerText = `น้อง${currentUser || 'เด็กๆ'}`;
            heroLvlBadgeEl.innerText = `Lv.${currentChildLevel}`;
            document.getElementById("hero-exp-container").classList.remove("hidden");
            const pct = Math.min(100, Math.round((lvlData.currentLevelEXP / lvlData.nextLevelReqEXP) * 100));
            heroExpBar.style.width = `${pct}%`;
            heroExpText.innerText = `${lvlData.currentLevelEXP}/${lvlData.nextLevelReqEXP} EXP`;

            const childAvatars = levelAvatarsConfig[currentUser] || {};
            const customAvatarUrl = childAvatars[currentChildLevel];

            if (customAvatarUrl) {
                heroImgEl.src = customAvatarUrl;
                heroImgEl.classList.remove("hidden");
                heroEmojiEl.classList.add("hidden");
            } else {
                heroImgEl.classList.add("hidden");
                heroEmojiEl.classList.remove("hidden");
                heroEmojiEl.innerText = currentUser === 'เพลิน' ? '👧' : '👦';
            }
        }
    }
}

function addEXPToUser(amount) {
    if (isParentUser || !currentUser) return;
    currentChildEXP += amount;
    if (isFirebaseActive) {
        const { ref, set } = window.firebaseModules;
        const db = window.firebaseModules.getDatabase();
        set(ref(db, `user_exp/${currentUser}`), currentChildEXP);
    } else {
        localStorage.setItem(`user_exp_${currentUser || 'guest'}`, currentChildEXP.toString());
    }
    updateUserLevelAndAvatarDisplay();
}

function saveUserStars() {
    if (isFirebaseActive && currentUser) {
        const { ref, set } = window.firebaseModules;
        const db = window.firebaseModules.getDatabase();
        set(ref(db, `user_stars/${currentUser}`), totalStars);
    } else {
        localStorage.setItem(`total_stars_${currentUser || 'guest'}`, totalStars.toString());
    }
    const scoreEl = document.getElementById("score");
    if (scoreEl) scoreEl.innerText = totalStars;
    const qStarsEl = document.getElementById("quest-user-stars");
    if (qStarsEl) qStarsEl.innerText = `⭐ ${totalStars}`;
}

function saveUserTrophies() {
    if (isFirebaseActive && currentUser) {
        const { ref, set } = window.firebaseModules;
        const db = window.firebaseModules.getDatabase();
        set(ref(db, `user_trophies/${currentUser}`), totalTrophies);
    } else {
        localStorage.setItem(`total_trophies_${currentUser || 'guest'}`, totalTrophies.toString());
    }
    const trophyEl = document.getElementById("score-trophy");
    if (trophyEl) trophyEl.innerText = totalTrophies;
    const qTrophiesEl = document.getElementById("quest-user-trophies");
    if (qTrophiesEl) qTrophiesEl.innerText = `🏆 ${totalTrophies}`;
}

function incrementTodayRounds() {
    todayPlayedRounds += 1;
    const todayStr = getTodayDateString();
    if (isFirebaseActive && currentUser) {
        const { ref, set } = window.firebaseModules;
        const db = window.firebaseModules.getDatabase();
        set(ref(db, `user_daily_rounds/${currentUser}/${todayStr}`), todayPlayedRounds);
    } else {
        localStorage.setItem(`daily_rounds_${currentUser}_${todayStr}`, todayPlayedRounds.toString());
    }
    checkDailyLimitStatus();
}

function sendInAppNotification(type, payload) {
    if (!currentUser) return;
    try {
        let messageText = `👦 น้อง${currentUser} ทำกิจกรรมสำเร็จ!`;
        if (type === 'COMPLETED_BUILD') {
            messageText = `🏰 น้อง${currentUser} สร้าง Wonder สำเร็จในเกมสร้างเมือง (ใช้เวลา ${formatTime(payload.timeSec)}) 🏛️✨`;
        }

        const notifyData = {
            user: currentUser,
            type: type,
            text: messageText,
            timestamp: Date.now()
        };

        if (isFirebaseActive) {
            const { ref, push } = window.firebaseModules;
            const db = window.firebaseModules.getDatabase();
            push(ref(db, 'kids_notifications'), notifyData);
        } else {
            notificationsList.unshift({ id: Date.now().toString(), ...notifyData });
            localStorage.setItem('kids_notifications_local', JSON.stringify(notificationsList));
            if (typeof renderNotifications === 'function') renderNotifications();
        }
    } catch(e) {
        console.error("Error sending notification:", e);
    }
}

function checkDailyLimitStatus() {
    const limitBanner = document.getElementById("daily-limit-banner");
    const checkBtn = document.getElementById("btn-check-answer");
    const mathCombineBtn = document.querySelector("#game-math-container button[onclick='executeMathCombination()']");
    const storyGenBtn = document.getElementById("btn-generate-story");
    const tdBtns = document.querySelectorAll('.td-choice-btn');
    const tdUltBtn = document.getElementById('td-ultimate-btn');
    const buildCanvas = document.getElementById("townGameCanvas");
    const buildBtns = document.querySelectorAll('#controls button');
    const quotaText = document.getElementById("daily-quota-text");
    const limitRoundsText = document.getElementById("limit-rounds-text");

    if (limitRoundsText) limitRoundsText.innerText = dailyLimitRounds;

    if (!isParentUser && isDailyLimitEnabled) {
        if (quotaText) {
            quotaText.innerText = `โควต้ารวมวันนี้ ${todayPlayedRounds}/${dailyLimitRounds} รอบ`;
            quotaText.classList.remove("hidden");
        }
        if (todayPlayedRounds >= dailyLimitRounds) {
            if (limitBanner) limitBanner.classList.remove("hidden");
            if (checkBtn) { checkBtn.disabled = true; checkBtn.classList.add("opacity-50", "cursor-not-allowed"); }
            if (mathCombineBtn) { mathCombineBtn.disabled = true; mathCombineBtn.classList.add("opacity-50", "cursor-not-allowed"); }
            if (storyGenBtn) { storyGenBtn.disabled = true; storyGenBtn.classList.add("opacity-50", "cursor-not-allowed"); }
            if (tdBtns) tdBtns.forEach(btn => { btn.disabled = true; btn.classList.add("opacity-50", "cursor-not-allowed"); });
            if (tdUltBtn) { tdUltBtn.disabled = true; tdUltBtn.classList.add("opacity-50", "cursor-not-allowed"); }
            if (buildCanvas) { buildCanvas.style.pointerEvents = "none"; buildCanvas.classList.add("opacity-50"); }
            if (buildBtns) buildBtns.forEach(btn => { btn.disabled = true; btn.classList.add("opacity-50", "cursor-not-allowed"); });
        } else {
            if (limitBanner) limitBanner.classList.add("hidden");
            if (checkBtn) { checkBtn.disabled = false; checkBtn.classList.remove("opacity-50", "cursor-not-allowed"); }
            if (mathCombineBtn) { mathCombineBtn.disabled = false; mathCombineBtn.classList.remove("opacity-50", "cursor-not-allowed"); }
            if (storyGenBtn) { storyGenBtn.disabled = false; storyGenBtn.classList.remove("opacity-50", "cursor-not-allowed"); }
            if (tdBtns) tdBtns.forEach(btn => { btn.disabled = false; btn.classList.remove("opacity-50", "cursor-not-allowed"); });
            if (tdUltBtn) { tdUltBtn.disabled = false; tdUltBtn.classList.remove("opacity-50", "cursor-not-allowed"); }
            if (buildCanvas) { buildCanvas.style.pointerEvents = "auto"; buildCanvas.classList.remove("opacity-50"); }
            if (buildBtns) buildBtns.forEach(btn => { btn.disabled = false; btn.classList.remove("opacity-50", "cursor-not-allowed"); });
        }
    } else {
        if (limitBanner) limitBanner.classList.add("hidden");
        if (quotaText) quotaText.classList.add("hidden");
        if (checkBtn) { checkBtn.disabled = false; checkBtn.classList.remove("opacity-50", "cursor-not-allowed"); }
        if (mathCombineBtn) { mathCombineBtn.disabled = false; mathCombineBtn.classList.remove("opacity-50", "cursor-not-allowed"); }
        if (storyGenBtn) { storyGenBtn.disabled = false; storyGenBtn.classList.remove("opacity-50", "cursor-not-allowed"); }
        if (tdBtns) tdBtns.forEach(btn => { btn.disabled = false; btn.classList.remove("opacity-50", "cursor-not-allowed"); });
        if (tdUltBtn) { tdUltBtn.disabled = false; tdUltBtn.classList.remove("opacity-50", "cursor-not-allowed"); }
        if (buildCanvas) { buildCanvas.style.pointerEvents = "auto"; buildCanvas.classList.remove("opacity-50"); }
        if (buildBtns) buildBtns.forEach(btn => { btn.disabled = false; btn.classList.remove("opacity-50", "cursor-not-allowed"); });
    }
}

function updateStorageProgressBar() {
    let totalBytes = 0;
    for (let x in localStorage) {
        if (localStorage.hasOwnProperty(x)) { totalBytes += ((localStorage[x].length + x.length) * 2); }
    }
    const maxBytes = 5 * 1024 * 1024; 
    const currentMB = (totalBytes / (1024 * 1024)).toFixed(2);
    let percentage = (totalBytes / maxBytes) * 100;
    if (percentage > 100) percentage = 100;

    const storageText = document.getElementById("storage-text");
    const storageProgress = document.getElementById("storage-progress");

    if (storageText) storageText.innerText = `${currentMB} / 5.00 MB`;
    if (storageProgress) {
        storageProgress.style.width = `${percentage}%`;
        if (percentage > 85) storageProgress.className = "bg-rose-500 h-full transition-all duration-500 rounded-full";
        else if (percentage > 60) storageProgress.className = "bg-amber-500 h-full transition-all duration-500 rounded-full";
        else storageProgress.className = "bg-indigo-500 h-full transition-all duration-500 rounded-full";
    }
}

function openKeyModal() { 
    if (!isParentUser) { alert("เข้าใช้งานได้เฉพาะพ่อนะ และ แม่พัด เท่านั้นครับ!"); return; }
    updateStorageProgressBar();
    document.getElementById("key-modal").classList.remove("hidden"); 
}
function closeKeyModal() { document.getElementById("key-modal").classList.add("hidden"); }

function saveApiKey() {
    if (!isParentUser) return;

    const key = document.getElementById("input-api-key").value.trim();
    const newPin = document.getElementById("input-parent-pin").value.trim();
    const fbConfig = document.getElementById("input-firebase-config").value.trim();

    isDailyLimitEnabled = document.getElementById("input-enable-daily-limit").checked;
    dailyLimitRounds = parseInt(document.getElementById("input-daily-limit-rounds").value || "3", 10);
    localStorage.setItem("enable_daily_limit", isDailyLimitEnabled ? "true" : "false");
    localStorage.setItem("daily_limit_rounds", dailyLimitRounds.toString());

    if (isFirebaseActive && dbRefDailyConfig) {
        const { set } = window.firebaseModules;
        set(dbRefDailyConfig, { enabled: isDailyLimitEnabled, rounds: dailyLimitRounds });
    }

    if (key) localStorage.setItem("gemini_api_key", key); else localStorage.removeItem("gemini_api_key");
    if (newPin) {
        if (newPin.length === 4 && /^\d+$/.test(newPin)) localStorage.setItem("parent_pin", newPin);
        else { alert("กรุณากรอกรหัส PIN เป็นตัวเลข 4 หลักเท่านั้นครับ"); return; }
    }
    if (fbConfig) {
        localStorage.setItem("firebase_config", fbConfig);
        alert("บันทึกการตั้งค่าเรียบร้อยแล้ว! ระบบจะรีเฟรชหน้าเพื่อโหลดข้อมูลใหม่");
        window.location.reload();
        return;
    }

    alert("บันทึกการตั้งค่าเรียบร้อยแล้ว!");
    checkDailyLimitStatus();
    closeKeyModal();
}

function openLevelAvatarModal() {
    if (!isParentUser) return;
    closeKeyModal();
    if(typeof renderLevelAvatarList === 'function') renderLevelAvatarList();
    document.getElementById("level-avatar-modal").classList.remove("hidden");
}
function closeLevelAvatarModal() { document.getElementById("level-avatar-modal").classList.add("hidden"); }

function updateMaxLevelSetting() {
    if (!isParentUser) return;
    const val = parseInt(document.getElementById("input-max-level").value, 10);
    if (!isNaN(val) && val >= 1 && val <= 50) {
        maxLevel = val;
        saveLevelConfigToStorage();
        if(typeof renderLevelAvatarList === 'function') renderLevelAvatarList();
    }
}

function saveLevelConfigToStorage() {
    if (isFirebaseActive && dbRefLevelConfig) {
        const { set } = window.firebaseModules;
        set(dbRefLevelConfig, { maxLevel: maxLevel, levelAvatars: levelAvatarsConfig });
    } else {
        localStorage.setItem("max_level", maxLevel.toString());
        localStorage.setItem("level_avatars_config", JSON.stringify(levelAvatarsConfig));
    }
    updateUserLevelAndAvatarDisplay();
}

function switchLevelConfigChild(child) {
    selectedLvlConfigChild = child;
    const btnPoon = document.getElementById("lvl-btn-poon");
    const btnPloern = document.getElementById("lvl-btn-ploern");

    if (child === 'พูน') {
        btnPoon.className = "flex-1 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-xs";
        btnPloern.className = "flex-1 py-1.5 rounded-xl text-xs font-bold text-slate-600";
    } else {
        btnPloern.className = "flex-1 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-xs";
        btnPoon.className = "flex-1 py-1.5 rounded-xl text-xs font-bold text-slate-600";
    }
    if(typeof renderLevelAvatarList === 'function') renderLevelAvatarList();
}

function renderLevelAvatarList() {
    const container = document.getElementById("level-avatar-list");
    const childAvatars = levelAvatarsConfig[selectedLvlConfigChild] || {};
    let html = '';
    for (let i = 1; i <= maxLevel; i++) {
        const currentImg = childAvatars[i] || null;
        html += `
            <div class="bg-slate-50 border border-slate-200 rounded-2xl p-2.5 flex items-center justify-between gap-2 shadow-2xs">
                <div class="flex items-center gap-2">
                    <div class="w-9 h-9 rounded-xl overflow-hidden bg-white border border-slate-200 flex items-center justify-center">
                        ${currentImg ? `<img src="${currentImg}" class="w-full h-full object-cover">` : `<span class="text-[10px] text-slate-400 font-bold">No Img</span>`}
                    </div>
                    <span class="font-bold text-slate-700 text-xs font-kids">Level ${i}</span>
                </div>
                <div class="flex items-center gap-1.5">
                    <label class="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold px-2 py-1 rounded-xl text-[10px] shadow-2xs cursor-pointer">
                        📷 อัปโหลด
                        <input type="file" accept="image/*" class="hidden" onchange="handleLevelAvatarUpload(event, '${selectedLvlConfigChild}', ${i})">
                    </label>
                    ${currentImg ? `<button onclick="deleteLevelAvatar('${selectedLvlConfigChild}', ${i})" class="bg-rose-50 hover:bg-rose-100 text-rose-700 p-1 rounded-xl text-[10px] border border-rose-200 font-bold">🗑️</button>` : ''}
                </div>
            </div>
        `;
    }
    container.innerHTML = html;
}

function handleLevelAvatarUpload(event, child, lvl) {
    if (!isParentUser) return;
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement("canvas");
            const maxDim = 250;
            let width = img.width, height = img.height;
            if (width > height) {
                if (width > maxDim) { height = Math.round((height * maxDim) / width); width = maxDim; }
            } else {
                if (height > maxDim) { width = Math.round((width * maxDim) / height); height = maxDim; }
            }
            canvas.width = width; canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);

            if (!levelAvatarsConfig[child]) levelAvatarsConfig[child] = {};
            levelAvatarsConfig[child][lvl] = canvas.toDataURL("image/jpeg", 0.75);
            saveLevelConfigToStorage();
            renderLevelAvatarList();
            alert(`อัปโหลดรูปตัวละครของน้อง ${child} สำหรับ Level ${lvl} เรียบร้อยแล้ว!`);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function deleteLevelAvatar(child, lvl) {
    if (!isParentUser) return;
    if (confirm(`ลบรูปตัวละคร Level ${lvl} ของน้อง ${child} ใช่ไหม?`)) {
        if (levelAvatarsConfig[child] && levelAvatarsConfig[child][lvl]) {
            delete levelAvatarsConfig[child][lvl];
            saveLevelConfigToStorage();
            renderLevelAvatarList();
        }
    }
}
