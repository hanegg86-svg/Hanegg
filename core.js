/* ==========================================================================
   CORE.JS - Application Core, State Management & Modal Controller
   ========================================================================== */

// Global Application State
let vocabList = [];
let currentIndex = 0;
let currentSubject = 'EN';
let currentProfile = 'พูน';
let pendingProfile = null;
let userStars = 0;
let userEXP = 0;
let userLevel = 1;

// --------------------------------------------------------------------------
// 1. INITIALIZATION & DATA LOADING
// --------------------------------------------------------------------------

function initData() {
    const savedProfile = localStorage.getItem('current_user_profile');
    if (savedProfile) {
        currentProfile = savedProfile;
    }

    loadUserData(currentProfile);

    // Hide Splash Screen
    setTimeout(() => {
        const splash = document.getElementById('ios-splash-screen');
        if (splash) {
            splash.classList.add('fade-out');
            setTimeout(() => splash.remove(), 500);
        }
    }, 1000);
}

function loadUserData(profileName) {
    currentProfile = profileName;
    localStorage.setItem('current_user_profile', profileName);

    userStars = parseInt(localStorage.getItem(`stars_${profileName}`) || '0', 10);
    userEXP = parseInt(localStorage.getItem(`exp_${profileName}`) || '0', 10);
    userLevel = calculateLevel(userEXP);

    updateHeaderUI();
    updateHeroUI();
    updateParentControlsUI();
}

function calculateLevel(exp) {
    return Math.floor(exp / 200) + 1;
}

function updateHeaderUI() {
    const nameElem = document.getElementById('user-name');
    const scoreElem = document.getElementById('score');
    const levelTag = document.getElementById('user-level-tag');
    const avatarEmoji = document.getElementById('user-avatar');

    if (nameElem) nameElem.innerText = currentProfile;
    if (scoreElem) scoreElem.innerText = userStars;
    if (levelTag) {
        levelTag.innerText = `Lv.${userLevel}`;
        levelTag.classList.remove('hidden');
    }

    if (avatarEmoji) {
        if (currentProfile === 'พ่อนะ') avatarEmoji.innerText = '👨‍💼';
        else if (currentProfile === 'แม่พัด') avatarEmoji.innerText = '👩‍💼';
        else if (currentProfile === 'พูน') avatarEmoji.innerText = '👦';
        else if (currentProfile === 'เพลิน') avatarEmoji.innerText = '👧';
        else avatarEmoji.innerText = '👤';
    }
}

function updateHeroUI() {
    const heroName = document.getElementById('hero-user-name');
    const heroLevel = document.getElementById('hero-level-badge');
    const heroExpText = document.getElementById('hero-exp-text');
    const heroExpBar = document.getElementById('hero-exp-progress');

    if (heroName) heroName.innerText = `${currentProfile} 🌟`;
    if (heroLevel) heroLevel.innerText = `Lv.${userLevel}`;

    const expInCurrentLevel = userEXP % 200;
    const progressPercent = Math.min(100, Math.max(0, (expInCurrentLevel / 200) * 100));

    if (heroExpText) heroExpText.innerText = `${expInCurrentLevel}/200`;
    if (heroExpBar) heroExpBar.style.width = `${progressPercent}%`;
}

function updateParentControlsUI() {
    const isParent = (currentProfile === 'พ่อนะ' || currentProfile === 'แม่พัด');
    
    const parentCreateQuest = document.getElementById('parent-create-quest-box');
    const parentManageStars = document.getElementById('parent-manage-stars-box');
    const parentAddReward = document.getElementById('parent-add-reward-section');
    const btnKey = document.getElementById('btn-key');

    if (parentCreateQuest) parentCreateQuest.classList.toggle('hidden', !isParent);
    if (parentManageStars) parentManageStars.classList.toggle('hidden', !isParent);
    if (parentAddReward) parentAddReward.classList.toggle('hidden', !isParent);
    if (btnKey) btnKey.classList.toggle('hidden', !isParent);
}


// --------------------------------------------------------------------------
// 2. PROFILE & AUTHENTICATION (AUTO CLOSE ALL MODALS ON VERIFICATION)
// --------------------------------------------------------------------------

function openProfileModal() {
    const modal = document.getElementById('profile-modal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function closeProfileModal() {
    const modal = document.getElementById('profile-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function selectProfile(name, isParent) {
    if (isParent) {
        pendingProfile = name;
        const pinModal = document.getElementById('pin-modal');
        const pinTarget = document.getElementById('pin-target-name');
        
        if (pinTarget) pinTarget.innerText = `เข้าสู่ระบบสำหรับ ${name}`;
        if (pinModal) {
            pinModal.classList.remove('hidden');
        }
    } else {
        loadUserData(name);
        closeProfileModal();
    }
}

function closePinModal() {
    const modal = document.getElementById('pin-modal');
    const pinInput = document.getElementById('pin-input');
    if (pinInput) pinInput.value = '';
    if (modal) modal.classList.add('hidden');
}

// 🟢 FIX: สั่งปิดทั้ง PIN Modal และ Profile Modal อัตโนมัติเมื่อรหัสถูกต้อง
function verifyPin() {
    const pinInput = document.getElementById('pin-input');
    const enteredPin = pinInput ? pinInput.value.trim() : '';
    const savedPin = localStorage.getItem('parent_pin') || '1234';

    if (enteredPin === savedPin) {
        currentProfile = pendingProfile || 'พ่อนะ';
        
        if (pinInput) pinInput.value = '';

        // 🟢 ปิดทั้งสอง Popup พร้อมกันทันที
        closePinModal();
        closeProfileModal();

        // โหลดข้อมูล UI ตามสิทธิ์
        loadUserData(currentProfile);

        if (typeof showToast === 'function') {
            showToast(`ยินดีต้อนรับ ${currentProfile}`);
        }
    } else {
        alert('รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
        if (pinInput) pinInput.value = '';
    }
}


// --------------------------------------------------------------------------
// 3. NOTIFICATION SYSTEM (FIXED OPEN & RENDER)
// --------------------------------------------------------------------------

// 🟢 FIX: ฟังก์ชันเปิดหน้าต่าง Notice และเรนเดอร์ข้อมูล
function openNotifyModal() {
    const modal = document.getElementById('notify-modal');
    if (!modal) return;

    modal.classList.remove('hidden');

    // เรนเดอร์รายการแจ้งเตือน
    renderNotificationList();

    // เคลียร์จุดแดง
    const badge = document.getElementById('notify-badge');
    const dot = document.getElementById('notify-dot');
    if (badge) badge.classList.add('hidden');
    if (dot) dot.classList.add('hidden');
}

function closeNotifyModal() {
    const modal = document.getElementById('notify-modal');
    if (modal) modal.classList.add('hidden');
}

function addNotification(title, message, icon = '🎈') {
    const logs = JSON.parse(localStorage.getItem('app_notify_logs') || '[]');
    const newLog = {
        id: Date.now(),
        title: title,
        message: message,
        icon: icon,
        time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    };

    logs.unshift(newLog);
    if (logs.length > 20) logs.pop();

    localStorage.setItem('app_notify_logs', JSON.stringify(logs));

    const badge = document.getElementById('notify-badge');
    const dot = document.getElementById('notify-dot');
    if (badge) badge.classList.remove('hidden');
    if (dot) dot.classList.remove('hidden');
}

function renderNotificationList() {
    const listContainer = document.getElementById('notify-list');
    if (!listContainer) return;

    const logs = JSON.parse(localStorage.getItem('app_notify_logs') || '[]');

    if (logs.length === 0) {
        listContainer.innerHTML = `<div class="text-center text-xs text-slate-400 py-8 font-kids">ยังไม่มีรายการแจ้งเตือนล่าสุด</div>`;
        return;
    }

    listContainer.innerHTML = logs.map(item => `
        <div class="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-2.5">
            <span class="text-lg">${item.icon || '🔔'}</span>
            <div class="flex-1">
                <div class="text-xs font-bold text-slate-800 font-kids">${item.title || 'แจ้งเตือน'}</div>
                <div class="text-[11px] font-bold text-slate-500 mt-0.5">${item.message || ''}</div>
                <div class="text-[9px] text-slate-400 mt-1 font-mono">${item.time || ''}</div>
            </div>
        </div>
    `).join('');
}

function clearAllNotifications() {
    localStorage.removeItem('app_notify_logs');
    renderNotificationList();
}


// --------------------------------------------------------------------------
// 4. NAVIGATION & TAB SWITCHING
// --------------------------------------------------------------------------

function switchMainTab(tabName) {
    const questTab = document.getElementById('main-quest-tab');
    const gameTab = document.getElementById('main-game-tab');
    const shopTab = document.getElementById('main-shop-tab');

    const btnQuest = document.getElementById('nav-btn-quest');
    const btnGame = document.getElementById('nav-btn-game');
    const btnShop = document.getElementById('nav-btn-shop');

    if (questTab) questTab.classList.add('hidden');
    if (gameTab) gameTab.classList.add('hidden');
    if (shopTab) shopTab.classList.add('hidden');

    [btnQuest, btnGame, btnShop].forEach(btn => {
        if (btn) {
            btn.classList.remove('text-indigo-600');
            btn.classList.add('text-slate-400');
        }
    });

    if (tabName === 'quest') {
        if (questTab) questTab.classList.remove('hidden');
        if (btnQuest) {
            btnQuest.classList.remove('text-slate-400');
            btnQuest.classList.add('text-indigo-600');
        }
    } else if (tabName === 'game') {
        if (gameTab) {
            gameTab.classList.remove('hidden');
            gameTab.classList.add('flex');
        }
        if (btnGame) {
            btnGame.classList.remove('text-slate-400');
            btnGame.classList.add('text-indigo-600');
        }
    } else if (tabName === 'shop') {
        if (shopTab) {
            shopTab.classList.remove('hidden');
            shopTab.classList.add('flex');
        }
        if (btnShop) {
            btnShop.classList.remove('text-slate-400');
            btnShop.classList.add('text-indigo-600');
        }
    }
}


// --------------------------------------------------------------------------
// 5. UTILITY & TOAST HELPERS
// --------------------------------------------------------------------------

function openKeyModal() {
    const modal = document.getElementById('key-modal');
    if (modal) modal.classList.remove('hidden');
}

function closeKeyModal() {
    const modal = document.getElementById('key-modal');
    if (modal) modal.classList.add('hidden');
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed top-16 left-1/2 -translate-x-1/2 bg-slate-800/90 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg z-[200] transition-all font-kids';
    toast.innerText = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}
