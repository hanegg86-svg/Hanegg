// ==========================================
// --- RPG SYSTEM STATE & MANAGEMENT ---
// ==========================================

let playerRPG = JSON.parse(localStorage.getItem('player_rpg')) || {
    skills: {
        hintVision: 0,   // สกิลคำใบ้พิเศษจาก AI เมื่อส่องหาของไม่เจอ
        timeWarp: 0,     // ข้ามภารกิจถ่ายรูปได้ (ใช้คูลดาวน์)
        expBoost: 0,     // สกิลเพิ่ม % EXP Bonus
        doubleStar: 0    // โอกาสได้ดาว x2 เมื่ออ่านจบเรื่อง
    }
};

function saveRPGState() {
    localStorage.setItem('player_rpg', JSON.stringify(playerRPG));
}

function getSkillLevel(skillKey) {
    return (playerRPG.skills && playerRPG.skills[skillKey]) ? playerRPG.skills[skillKey] : 0;
}

function updateRPGUI() {
    // ดึงค่า Level / EXP จากระบบหลักของ core.js
    const lvlData = calculateLevelFromEXP(currentChildEXP);
    const availableSP = Math.max(0, (currentChildLevel - 1) - (
        getSkillLevel('hintVision') + 
        getSkillLevel('timeWarp') + 
        getSkillLevel('expBoost') + 
        getSkillLevel('doubleStar')
    ));

    // อัปเดต Display บนหน้าอ่านนิทาน
    const rpgLevelEl = document.getElementById("rpg-level-display");
    const rpgExpTextEl = document.getElementById("rpg-exp-text");
    const rpgExpBarEl = document.getElementById("rpg-exp-bar");
    const rpgSpBadgeEl = document.getElementById("rpg-sp-badge");

    if (rpgLevelEl) rpgLevelEl.innerText = lvlData.level;
    if (rpgExpTextEl) rpgExpTextEl.innerText = `${lvlData.currentLevelEXP} / ${lvlData.nextLevelReqEXP} EXP`;
    if (rpgExpBarEl) {
        const pct = Math.min(100, Math.round((lvlData.currentLevelEXP / lvlData.nextLevelReqEXP) * 100));
        rpgExpBarEl.style.width = `${pct}%`;
    }

    if (rpgSpBadgeEl) {
        if (availableSP > 0) {
            rpgSpBadgeEl.innerText = availableSP;
            rpgSpBadgeEl.classList.remove("hidden");
        } else {
            rpgSpBadgeEl.classList.add("hidden");
        }
    }

    // อัปเดต Modal Tree
    const spModalCount = document.getElementById("rpg-modal-sp-count");
    if (spModalCount) spModalCount.innerText = availableSP;

    const skills = [
        { key: 'hintVision', max: 3 },
        { key: 'timeWarp', max: 3 },
        { key: 'expBoost', max: 3 },
        { key: 'doubleStar', max: 3 }
    ];

    skills.forEach(s => {
        const lvlEl = document.getElementById(`skill-lvl-${s.key}`);
        const btnEl = document.getElementById(`btn-upgrade-${s.key}`);
        const curLvl = getSkillLevel(s.key);

        if (lvlEl) lvlEl.innerText = `Lv. ${curLvl} / ${s.max}`;
        if (btnEl) {
            if (curLvl >= s.max) {
                btnEl.disabled = true;
                btnEl.innerText = "MAX";
                btnEl.className = "px-3 py-1.5 bg-slate-200 border-2 border-slate-300 text-slate-400 font-black text-xs rounded-xl cursor-not-allowed shadow-none";
            } else if (availableSP <= 0) {
                btnEl.disabled = true;
                btnEl.innerText = "อัปเกรด";
                btnEl.className = "px-3 py-1.5 bg-slate-100 border-2 border-slate-300 text-slate-400 font-black text-xs rounded-xl cursor-not-allowed shadow-none";
            } else {
                btnEl.disabled = false;
                btnEl.innerText = "อัปเกรด (+1 SP)";
                // --- ปุ่มสีส้มทองขอบหนาสไตล์มาริโอ้ ---
                btnEl.className = "px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-amber-950 border-2 border-amber-600 font-black text-xs rounded-xl shadow-[0_4px_0_0_#b45309] active:scale-95 active:translate-y-1 active:shadow-none transition-all";
            }
        }
    });
}

function learnSkill(skillKey) {
    const availableSP = Math.max(0, (currentChildLevel - 1) - (
        getSkillLevel('hintVision') + 
        getSkillLevel('timeWarp') + 
        getSkillLevel('expBoost') + 
        getSkillLevel('doubleStar')
    ));

    if (availableSP <= 0) {
        alert("❌ พอยต์สกิลไม่พอครับ! ต้องสะสม EXP อัปเลเวลก่อนนะ");
        return;
    }

    if (getSkillLevel(skillKey) >= 3) {
        alert("🔹 สกิลนี้อัปเกรดถึงระดับสูงสุดแล้วครับ!");
        return;
    }

    playerRPG.skills[skillKey] = getSkillLevel(skillKey) + 1;
    saveRPGState();
    updateRPGUI();
    alert("🎉 อัปเกรดทักษะเวทมนตร์สำเร็จ!");
}

function openSkillTreeModal() {
    updateRPGUI();
    document.getElementById("rpg-skill-modal").classList.remove("hidden");
}

function closeSkillTreeModal() {
    document.getElementById("rpg-skill-modal").classList.add("hidden");
}

function useSkipMissionSkill() {
    const timeWarpLvl = getSkillLevel('timeWarp');
    if (timeWarpLvl <= 0) {
        alert("🔒 หนูยังไม่ได้เรียนสกิล 'คาถาข้ามเวลา' ครับ!");
        return;
    }

    if (confirm("✨ ต้องการใช้คาถาข้ามเวลาเพื่อผ่านภารกิจถ่ายรูปนี้เลยไหม?")) {
        alert("🪄 ปิ๊ง! เวทมนตร์ข้ามเวลาทำงาน ผ่านภารกิจถ่ายรูปสำเร็จแล้ว!");
        if (generatedStoryData && generatedStoryData.pages[currentStoryPage]) {
            generatedStoryData.pages[currentStoryPage].isPassed = true;
            if (typeof closeCameraForStory === 'function') closeCameraForStory();
            currentStoryPage++;
            if (typeof renderStoryPage === 'function') renderStoryPage();
        }
    }
}
