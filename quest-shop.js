// --- QUESTS AND REWARDS SHOP SYSTEM ---

// Daily Bonus Claim Function
function claimDailyChestBonus() {
    const todayStr = new Date().toISOString().split('T')[0];
    const chestClaimKey = `daily_chest_claimed_${currentProfile}_${todayStr}`;
    
    if (localStorage.getItem(chestClaimKey) === 'true') {
        alert("🎁 หนูเปิดกล่องสมบัติประจำวันไปแล้วนะจ๊ะ มาใหม่พรุ่งนี้นะ!");
        return;
    }
    
    const bonusStars = 1;
    totalStars += bonusStars;
    saveUserStars();
    addEXPToUser(50);
    
    localStorage.setItem(chestClaimKey, 'true');
    
    alert(`🎉 ยินดีด้วย! เจ้ากล้วย Nano Banana มอบโบนัสพิเศษให้หนู 🌟 +${bonusStars} ดาว และ +50 EXP!`);
    renderParentQuestsList();
}

function renderParentQuestsList() {
    const container = document.getElementById('parent-quests-list');
    if (!container) return;

    if (!parentQuests || parentQuests.length === 0) {
        container.innerHTML = `
            <div class="text-center text-xs text-purple-400 py-6 font-bold bg-purple-50/50 rounded-2xl border border-dashed border-purple-200">
                ยังไม่มีภารกิจจากคุณพ่อคุณแม่ในขณะนี้ ✨
            </div>
        `;
        return;
    }

    // Filter quests for current child user
    const filteredQuests = parentQuests.filter(q => {
        if (!q.assignedTo || q.assignedTo.length === 0) return true;
        if (currentProfile === 'พ่อนะ' || currentProfile === 'แม่พัด') return true;
        return q.assignedTo.includes(currentProfile);
    });

    if (filteredQuests.length === 0) {
        container.innerHTML = `
            <div class="text-center text-xs text-purple-400 py-6 font-bold bg-purple-50/50 rounded-2xl border border-dashed border-purple-200">
                ไม่มีภารกิจสำหรับ ${currentProfile} ในตอนนี้ 🎈
            </div>
        `;
        return;
    }

    const isParent = (currentProfile === 'พ่อนะ' || currentProfile === 'แม่พัด');

    container.innerHTML = filteredQuests.map((quest) => {
        const assignedText = (!quest.assignedTo || quest.assignedTo.length === 0) 
            ? 'ทุกคน' 
            : quest.assignedTo.join(', ');

        return `
            <div class="bg-gradient-to-r from-purple-50 via-pink-50 to-amber-50 border-2 border-purple-100 rounded-2xl p-3 flex items-center justify-between shadow-2xs hover:shadow-md transition">
                <div class="flex items-center gap-2.5">
                    <div class="w-10 h-10 bg-white rounded-xl border border-purple-200 flex items-center justify-center text-xl shadow-xs">
                        🎯
                    </div>
                    <div>
                        <h4 class="font-black text-xs text-slate-800 font-kids">${quest.title}</h4>
                        <div class="flex items-center gap-1.5 mt-0.5">
                            <span class="text-[10px] font-black text-amber-600 bg-amber-100/80 px-2 py-0.5 rounded-full">
                                ⭐ +${quest.stars} ดาว
                            </span>
                            <span class="text-[9px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-100">
                                👤 ${assignedText}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="flex items-center gap-1">
                    ${isParent ? `
                        <button onclick="openAssignModal('${quest.id}')" class="p-1.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition" title="มอบหมาย">
                            <i data-lucide="user-check" class="w-3.5 h-3.5"></i>
                        </button>
                        <button onclick="deleteParentQuest('${quest.id}')" class="p-1.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition" title="ลบภารกิจ">
                            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                        </button>
                    ` : ''}
                    
                    <button onclick="requestCompleteQuest('${quest.id}')" class="bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-black px-3 py-1.5 rounded-xl text-xs shadow-xs border border-white transition font-kids">
                        ส่งภารกิจ 🚀
                    </button>
                </div>
            </div>
        `;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

function createNewParentQuest() {
    const titleInput = document.getElementById('new-quest-title');
    const starsInput = document.getElementById('new-quest-stars');
    const poonCheck = document.getElementById('quest-assign-poon');
    const ploernCheck = document.getElementById('quest-assign-ploern');

    if (!titleInput || !starsInput) return;

    const title = titleInput.value.trim();
    const stars = parseInt(starsInput.value) || 1;

    if (!title) {
        alert("กรุณากรอกชื่อภารกิจครับ");
        return;
    }

    const assignedTo = [];
    if (poonCheck && poonCheck.checked) assignedTo.push('พูน');
    if (ploernCheck && ploernCheck.checked) assignedTo.push('เพลิน');

    const newQuest = {
        id: 'quest_' + Date.now(),
        title: title,
        stars: stars,
        assignedTo: assignedTo,
        createdBy: currentProfile,
        createdAt: new Date().toISOString()
    };

    if (!parentQuests) parentQuests = [];
    parentQuests.unshift(newQuest);

    saveParentQuests();
    renderParentQuestsList();

    titleInput.value = '';
    starsInput.value = '';
    alert("✨ เพิ่มภารกิจเรียบร้อยแล้ว!");
}

function deleteParentQuest(questId) {
    if (!confirm("คุณพ่อ/คุณแม่ ต้องการลบภารกิจนี้ใช่ไหมครับ?")) return;

    parentQuests = parentQuests.filter(q => q.id !== questId);
    saveParentQuests();
    renderParentQuestsList();
}

function requestCompleteQuest(questId) {
    const quest = parentQuests.find(q => q.id === questId);
    if (!quest) return;

    if (currentProfile === 'พ่อนะ' || currentProfile === 'แม่พัด') {
        alert("คุณพ่อ/คุณแม่สามารถอนุมัติภารกิจผ่านรายการแจ้งเตือนได้ครับ");
        return;
    }

    // Add star and exp
    totalStars += quest.stars;
    saveUserStars();
    addEXPToUser(100);

    // Create notification for parents
    const notifyItem = {
        id: 'notify_' + Date.now(),
        type: 'quest_complete',
        childName: currentProfile,
        title: `พิชิตภารกิจ: ${quest.title}`,
        starsEarned: quest.stars,
        timestamp: new Date().toISOString()
    };

    if (!parentNotifications) parentNotifications = [];
    parentNotifications.unshift(notifyItem);
    saveParentNotifications();

    alert(`🎉 เก่งมากน้อง${currentProfile}! หนูทำภารกิจ "${quest.title}" สำเร็จ รับไปเลย ⭐ +${quest.stars} ดาว และ +100 EXP!`);
    renderParentQuestsList();
}

function adjustChildStars(isAdding) {
    const childSelect = document.getElementById('manage-star-child');
    const countInput = document.getElementById('manage-star-count');
    const reasonInput = document.getElementById('manage-star-reason');

    if (!childSelect || !countInput) return;

    const childName = childSelect.value;
    const count = parseInt(countInput.value) || 0;
    const reason = reasonInput ? reasonInput.value.trim() : '';

    if (count <= 0) {
        alert("กรุณาระบุจำนวนดาวให้ถูกต้องครับ");
        return;
    }

    const starKey = `user_stars_${childName}`;
    let currentChildStars = parseInt(localStorage.getItem(starKey)) || 0;

    if (isAdding) {
        currentChildStars += count;
    } else {
        currentChildStars = Math.max(0, currentChildStars - count);
    }

    localStorage.setItem(starKey, currentChildStars.toString());

    if (currentProfile === childName) {
        totalStars = currentChildStars;
        updateScoreDisplay();
    }

    // Save notification
    const notifyItem = {
        id: 'notify_' + Date.now(),
        type: isAdding ? 'star_added' : 'star_removed',
        childName: childName,
        title: `${isAdding ? 'ได้รับดาวเพิ่ม' : 'ถูกหักดาว'} ${count} ดวง${reason ? ` (${reason})` : ''}`,
        starsEarned: isAdding ? count : -count,
        timestamp: new Date().toISOString()
    };

    if (!parentNotifications) parentNotifications = [];
    parentNotifications.unshift(notifyItem);
    saveParentNotifications();

    countInput.value = '';
    if (reasonInput) reasonInput.value = '';

    alert(`✨ ${isAdding ? 'เพิ่ม' : 'ลด'}ดาวให้ น้อง${childName} เรียบร้อยแล้ว (รวมเป็น ${currentChildStars} ดาว)`);
}

function openAssignModal(questId) {
    const quest = parentQuests.find(q => q.id === questId);
    if (!quest) return;

    document.getElementById('assign-quest-id').value = questId;
    document.getElementById('assign-quest-title').innerText = quest.title;

    document.getElementById('reassign-poon').checked = quest.assignedTo.includes('พูน');
    document.getElementById('reassign-ploern').checked = quest.assignedTo.includes('เพลิน');

    document.getElementById('assign-quest-modal').classList.remove('hidden');
}

function closeAssignModal() {
    document.getElementById('assign-quest-modal').classList.add('hidden');
}

function saveQuestAssignment() {
    const questId = document.getElementById('assign-quest-id').value;
    const quest = parentQuests.find(q => q.id === questId);
    if (!quest) return;

    const assignedTo = [];
    if (document.getElementById('reassign-poon').checked) assignedTo.push('พูน');
    if (document.getElementById('reassign-ploern').checked) assignedTo.push('เพลิน');

    quest.assignedTo = assignedTo;
    saveParentQuests();
    renderParentQuestsList();
    closeAssignModal();
}

function saveParentQuests() {
    localStorage.setItem('parent_quests_data', JSON.stringify(parentQuests));
    if (window.firebaseModules && window.db) {
        const { ref, set } = window.firebaseModules;
        set(ref(window.db, 'parent_quests'), parentQuests);
    }
}

function saveParentNotifications() {
    localStorage.setItem('parent_notifications_data', JSON.stringify(parentNotifications));
    if (window.firebaseModules && window.db) {
        const { ref, set } = window.firebaseModules;
        set(ref(window.db, 'parent_notifications'), parentNotifications);
    }
}

// Rewards Shop Methods
function switchRewardTab(tabName) {
    const shopView = document.getElementById('reward-shop-view');
    const invView = document.getElementById('reward-inventory-view');
    const shopBtn = document.getElementById('shop-tab-btn');
    const invBtn = document.getElementById('inventory-tab-btn');

    if (tabName === 'shop') {
        shopView.classList.remove('hidden');
        invView.classList.add('hidden');
        shopBtn.className = "flex-1 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-xs transition";
        invBtn.className = "flex-1 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition";
    } else {
        shopView.classList.add('hidden');
        invView.classList.remove('hidden');
        invBtn.className = "flex-1 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-xs transition";
        shopBtn.className = "flex-1 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition";
        renderInventoryList();
    }
}

function renderRewardsShopList() {
    const container = document.getElementById('rewards-list-container');
    const userStarSpan = document.getElementById('quest-user-stars');

    if (userStarSpan) userStarSpan.innerText = `⭐ ${totalStars}`;
    if (!container) return;

    if (!rewardItems || rewardItems.length === 0) {
        container.innerHTML = `
            <div class="text-center text-xs text-slate-400 py-6 font-bold">
                ยังไม่มีของรางวัลในร้านค้า
            </div>
        `;
        return;
    }

    const isParent = (currentProfile === 'พ่อนะ' || currentProfile === 'แม่พัด');

    container.innerHTML = rewardItems.map((item) => {
        const canAfford = totalStars >= item.stars;

        return `
            <div class="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between shadow-2xs">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-amber-100 text-amber-800 rounded-xl flex items-center justify-center text-xl font-bold border border-amber-200">
                        🎁
                    </div>
                    <div>
                        <h4 class="font-bold text-xs text-slate-800 font-kids">${item.name}</h4>
                        <span class="text-[10px] font-black text-amber-500 font-kids">⭐ ใช้ ${item.stars} ดาว</span>
                    </div>
                </div>

                <div class="flex items-center gap-1">
                    ${isParent ? `
                        <button onclick="deleteRewardItem('${item.id}')" class="p-1.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition" title="ลบรางวัล">
                            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                        </button>
                    ` : ''}

                    <button onclick="redeemReward('${item.id}')" ${!canAfford ? 'disabled' : ''} class="${canAfford ? 'bg-amber-500 hover:bg-amber-600 text-white active:scale-95' : 'bg-slate-200 text-slate-400 cursor-not-allowed'} font-bold px-3 py-1.5 rounded-xl text-xs shadow-2xs transition font-kids">
                        ${canAfford ? 'แลกเลย 🎉' : 'ดาวไม่พอ'}
                    </button>
                </div>
            </div>
        `;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

function addNewRewardItem() {
    const nameInput = document.getElementById('new-reward-name');
    const starsInput = document.getElementById('new-reward-stars');

    if (!nameInput || !starsInput) return;

    const name = nameInput.value.trim();
    const stars = parseInt(starsInput.value) || 1;

    if (!name) {
        alert("กรุณากรอกชื่อของรางวัลครับ");
        return;
    }

    const newItem = {
        id: 'reward_' + Date.now(),
        name: name,
        stars: stars
    };

    if (!rewardItems) rewardItems = [];
    rewardItems.push(newItem);

    saveRewardItems();
    renderRewardsShopList();

    nameInput.value = '';
    starsInput.value = '';
    alert("✨ เพิ่มของรางวัลเรียบร้อยแล้ว!");
}

function deleteRewardItem(itemId) {
    if (!confirm("คุณพ่อ/คุณแม่ ต้องการลบของรางวัลนี้ใช่ไหมครับ?")) return;

    rewardItems = rewardItems.filter(r => r.id !== itemId);
    saveRewardItems();
    renderRewardsShopList();
}

function redeemReward(itemId) {
    const item = rewardItems.find(r => r.id === itemId);
    if (!item) return;

    if (totalStars < item.stars) {
        alert("ดาวสะสมยังไม่พอครับ ลองทำภารกิจเพิ่มดูนะ!");
        return;
    }

    if (!confirm(`คุณหนูต้องการใช้ ⭐ ${item.stars} ดาว เพื่อแลก "${item.name}" ใช่ไหมครับ?`)) return;

    totalStars -= item.stars;
    saveUserStars();

    const myRedeemedItem = {
        id: 'inv_' + Date.now(),
        name: item.name,
        stars: item.stars,
        redeemedAt: new Date().toISOString()
    };

    const invKey = `user_inventory_${currentProfile}`;
    let myInv = JSON.parse(localStorage.getItem(invKey)) || [];
    myInv.unshift(myRedeemedItem);
    localStorage.setItem(invKey, JSON.stringify(myInv));

    // Create notification
    const notifyItem = {
        id: 'notify_' + Date.now(),
        type: 'reward_redeem',
        childName: currentProfile,
        title: `แลกของรางวัล: ${item.name}`,
        starsEarned: -item.stars,
        timestamp: new Date().toISOString()
    };

    if (!parentNotifications) parentNotifications = [];
    parentNotifications.unshift(notifyItem);
    saveParentNotifications();

    alert(`🎉 แลกรางวัล "${item.name}" เรียบร้อยแล้ว! นำไปยื่นให้คุณพ่อคุณแม่ได้เลยครับ`);
    renderRewardsShopList();
}

function renderInventoryList() {
    const container = document.getElementById('inventory-list-container');
    if (!container) return;

    const invKey = `user_inventory_${currentProfile}`;
    const myInv = JSON.parse(localStorage.getItem(invKey)) || [];

    if (myInv.length === 0) {
        container.innerHTML = `
            <div class="text-center text-xs text-slate-400 py-8 font-bold">
                ยังไม่มีของรางวัลในกระเป๋า
            </div>
        `;
        return;
    }

    container.innerHTML = myInv.map((item) => `
        <div class="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-3 flex items-center justify-between shadow-2xs">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center text-xl font-bold shadow-2xs">
                    🎈
                </div>
                <div>
                    <h4 class="font-bold text-xs text-indigo-950 font-kids">${item.name}</h4>
                    <span class="text-[10px] text-indigo-500 font-bold">ใช้ไป ⭐ ${item.stars} ดาว</span>
                </div>
            </div>
            <span class="text-[10px] bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-bold">
                พร้อมรับรางวัล ✨
            </span>
        </div>
    `).join('');
}

function saveRewardItems() {
    localStorage.setItem('reward_items_data', JSON.stringify(rewardItems));
    if (window.firebaseModules && window.db) {
        const { ref, set } = window.firebaseModules;
        set(ref(window.db, 'reward_items'), rewardItems);
    }
}
