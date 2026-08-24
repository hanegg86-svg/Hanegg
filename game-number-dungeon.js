// game-number-dungeon.js
// ==========================================
// --- NUMBER DUNGEON MINIGAME SYSTEM (5x5 GRID WITH BOSS & SKILLS) ---
// ==========================================

let dungeonGridSize = 5; // ขยายกระดานเป็น 5x5 (25 ช่อง)
let dungeonPlayerX = 0;
let dungeonPlayerY = 0;
let dungeonScore = 10;
let dungeonHP = 1;
let dungeonTargetScore = 150;
let dungeonMap = [];
let dungeonCurrentDiff = 'easy';

// ดึงระดับทักษะของผู้เล่นปัจจุบัน
function getPlayerSkillsDungeon() {
    if (typeof currentUser === 'undefined' || !currentUser || (typeof isParentUser !== 'undefined' && isParentUser)) {
        return { knowledgeLvl: 0, fitnessLvl: 0, wealthLvl: 0 };
    }
    const skills = (typeof userSkillsList !== 'undefined' && userSkillsList[currentUser]) 
        ? userSkillsList[currentUser] 
        : { knowledge: 0, fitness: 0, wealth: 0 };

    const calcLvl = (pts) => typeof calculateSkillLevel === 'function' ? calculateSkillLevel(pts).level : Math.min(5, Math.floor((pts || 0) / 10));

    return {
        knowledgeLvl: calcLvl(skills.knowledge),
        fitnessLvl: calcLvl(skills.fitness),
        wealthLvl: calcLvl(skills.wealth)
    };
}

function initNumberDungeon() {
    startDungeonGame('easy');
}

function startDungeonGame(diff) {
    dungeonCurrentDiff = diff;

    // เช็กโควต้ารอบเล่นประจำวันก่อนเริ่มเกม
    if (typeof isParentUser !== 'undefined' && typeof isDailyLimitEnabled !== 'undefined' && typeof todayPlayedRounds !== 'undefined' && typeof dailyLimitRounds !== 'undefined') {
        if (!isParentUser && isDailyLimitEnabled && todayPlayedRounds >= dailyLimitRounds) {
            alert(`🛑 หนูเล่นครบโควต้ารวม ${dailyLimitRounds} รอบประจำวันแล้วนะ พักสายตาก่อนแล้วมาเล่นใหม่พรุ่งนี้นะครับ!`);
            return;
        }
    }

    const { knowledgeLvl, fitnessLvl, wealthLvl } = getPlayerSkillsDungeon();

    // คะแนนเริ่มต้นฐาน 10 + โบนัสจากทักษะความร่ำรวย (+5 ต่อระดับ)
    const baseScore = 10;
    const wealthBonus = wealthLvl * 5;
    dungeonScore = baseScore + wealthBonus;
    
    dungeonHP = 1;
    dungeonPlayerX = 0;
    dungeonPlayerY = 0;
    dungeonGridSize = 5;
    
    if (diff === 'hard') {
        // ระดับยาก: สุ่มเป้าหมายหลัก 300 - 400 (ช่วง +/- 50)
        dungeonTargetScore = Math.floor(Math.random() * 101) + 300; 
        const minTarget = dungeonTargetScore - 50;
        const maxTarget = dungeonTargetScore + 50;
        
        const tag = document.getElementById('nd-diff-tag');
        if (tag) tag.innerText = `ระดับยากพิเศษ 🔥 (เป้าหมาย: ${minTarget} - ${maxTarget})`;
    } else {
        // ระดับง่าย: เป้าหมายหลัก 150 (ช่วง +/- 75)
        dungeonTargetScore = 150;
        const minTarget = dungeonTargetScore - 75;
        const maxTarget = dungeonTargetScore + 75;
        
        const tag = document.getElementById('nd-diff-tag');
        if (tag) tag.innerText = `ระดับท้าทาย ⚡ (เป้าหมาย: ${minTarget} - ${maxTarget})`;
    }

    // สร้างแผนที่ตาราง 5x5
    dungeonMap = [];
    for (let r = 0; r < dungeonGridSize; r++) {
        let row = [];
        for (let c = 0; c < dungeonGridSize; c++) {
            if (r === 0 && c === 0) {
                row.push({ type: 'start', val: 0, text: '🧙‍♂️' });
            } else if (r === 4 && c === 3) {
                // บอสประจำดันเจี้ยนตั้งอยู่ที่ช่อง (4,3) ก่อนถึงทางออก
                row.push({ type: 'boss', val: 0, text: '👹 BOSS' });
            } else if (r === 4 && c === 4) {
                // ทางออกประตูอยู่ที่มุมขวาล่าง (4,4)
                row.push({ type: 'exit', val: 0, text: '🚪' });
            } else {
                let rand = Math.random();
                if (diff === 'hard') {
                    if (rand < 0.35) {
                        let num = Math.floor(Math.random() * 25) + 10; // +10 ถึง +34
                        row.push({ type: 'add', val: num, text: `+${num}` });
                    } else if (rand < 0.65) {
                        let num = Math.floor(Math.random() * 2) + 2; // ×2 ถึง ×3
                        row.push({ type: 'mul', val: num, text: `×${num}` });
                    } else {
                        let num = Math.floor(Math.random() * 50) + 20; // 👾 -20 ถึง -69
                        row.push({ type: 'monster', val: num, text: `👾 -${num}` });
                    }
                } else {
                    if (rand < 0.45) {
                        let num = Math.floor(Math.random() * 12) + 3;
                        row.push({ type: 'add', val: num, text: `+${num}` });
                    } else if (rand < 0.7) {
                        let num = Math.floor(Math.random() * 2) + 2;
                        row.push({ type: 'mul', val: num, text: `×${num}` });
                    } else {
                        let num = Math.floor(Math.random() * 25) + 10;
                        row.push({ type: 'monster', val: num, text: `👾 -${num}` });
                    }
                }
            }
        }
        dungeonMap.push(row);
    }

    renderDungeonUI();

    // แสดงแจ้งเตือนสรุปสิทธิประโยชน์ของ Skill ก่อนเข้าเล่น
    showSkillBriefingNotice(knowledgeLvl, fitnessLvl, wealthLvl, wealthBonus);
}

function showSkillBriefingNotice(kLvl, fLvl, wLvl, wBonus) {
    if (typeof currentUser === 'undefined' || !currentUser || (typeof isParentUser !== 'undefined' && isParentUser)) return;

    let skillMsgs = [];
    if (kLvl > 0) skillMsgs.push(`🧠 ความรู้ (Lv.${kLvl}): แสดงคะแนนล่วงหน้าบนปุ่มเดิน + ตัดตัวเลือกผิดเมื่อสู้บอส`);
    if (fLvl > 0) skillMsgs.push(`💪 พลังกาย (Lv.${fLvl}): ลดโดนหักคะแนนจากมอนสเตอร์/บอส ${Math.min(50, 20 + fLvl * 5)}%`);
    if (wLvl > 0) skillMsgs.push(`🪙 ความร่ำรวย (Lv.${wLvl}): ได้รับคะแนนเริ่มต้นเพิ่ม +${wBonus} คะแนน (รวมเป็น ${10 + wBonus})`);

    if (skillMsgs.length === 0) {
        skillMsgs.push("✨ พิชิตภารกิจพิเศษเพื่อสะสม Skill เพิ่มบัฟในดันเจี้ยนได้เลย!");
    }

    setTimeout(() => {
        alert(`🛡️ บัฟทักษะประจำตัวน้อง${currentUser}:\n\n` + skillMsgs.join('\n'));
    }, 150);
}

function calculatePreviewScore(targetCell) {
    let preview = dungeonScore;
    if (targetCell.type === 'add') preview += targetCell.val;
    else if (targetCell.type === 'mul') preview *= targetCell.val;
    else if (targetCell.type === 'monster') {
        const { fitnessLvl } = getPlayerSkillsDungeon();
        const reductionPct = Math.min(0.5, 0.20 + (fitnessLvl * 0.05));
        const penalty = Math.round(targetCell.val * (1 - reductionPct));
        preview -= penalty;
    }
    return preview;
}

function renderDungeonUI() {
    const hpText = document.getElementById('nd-hp-text');
    const scoreText = document.getElementById('nd-score-text');
    const targetText = document.getElementById('nd-target-text');

    if (hpText) hpText.innerText = dungeonHP;
    if (scoreText) scoreText.innerText = dungeonScore;
    
    // กำหนด Range ช่วงเป้าหมายตามระดับความยาก (ยาก = +/- 50, ง่าย = +/- 75)
    const currentDiffRange = (dungeonTargetScore >= 300) ? 50 : 75;
    const minTarget = dungeonTargetScore - currentDiffRange;
    const maxTarget = dungeonTargetScore + currentDiffRange;

    if (targetText) {
        targetText.innerText = `${minTarget} - ${maxTarget}`;
    }

    const board = document.getElementById('nd-grid-board') || document.getElementById('dungeon-grid-board');
    if (!board) return;
    
    // ตรวจสอบสถานะ Daily Limit
    const isQuotaExceeded = (typeof isParentUser !== 'undefined' && !isParentUser && isDailyLimitEnabled && todayPlayedRounds >= dailyLimitRounds);
    const { knowledgeLvl } = getPlayerSkillsDungeon();

    // บังคับการแสดงผล CSS Grid
    board.className = "w-full max-w-[340px] mx-auto my-3";
    board.style.display = "grid";
    board.style.gridTemplateColumns = "repeat(5, 1fr)";
    board.style.gap = "6px";
    board.style.minHeight = "250px";
    board.innerHTML = '';

    for (let r = 0; r < dungeonGridSize; r++) {
        for (let c = 0; c < dungeonGridSize; c++) {
            const cell = dungeonMap[r][c];
            const isPlayerHere = (r === dungeonPlayerX && c === dungeonPlayerY);
            
            // กฎการเคลื่อนที่: เดินย้อนกลับ/ไปข้างหน้า ได้ 4 ทิศทาง (ติดกับผู้เล่น 1 ช่อง)
            const isAdjacent = (Math.abs(r - dungeonPlayerX) + Math.abs(c - dungeonPlayerY)) === 1;
            const isSelectablePath = isAdjacent && !isQuotaExceeded;

            const btn = document.createElement('button');
            
            // ใช้คลาส Tailwind ผสมสำหรับปุ่ม 3D
            btn.className = "w-full h-[48px] rounded-xl flex flex-col items-center justify-center font-bold text-[11px] transition-all ";
            
            if (isPlayerHere) {
                // ช่องที่เรายืนอยู่ (สีฟ้าโดดเด่น)
                btn.className += "bg-sky-500 border-2 border-sky-700 text-white shadow-[0_4px_0_0_#0369a1] scale-105 z-10 ";
            } else if (cell.type === 'boss') {
                // ช่องบอส 👹 (สีแดงเข้มโดดเด่น)
                btn.className += isSelectablePath 
                    ? "bg-rose-600 border-2 border-rose-800 text-white shadow-[0_4px_0_0_#9f1239] cursor-pointer active:translate-y-1 hover:bg-rose-500 animate-pulse "
                    : "bg-rose-950 border-2 border-rose-900 text-rose-400 opacity-80 cursor-not-allowed ";
            } else if (isSelectablePath) {
                // ช่องที่เดินไปได้ (สีม่วง 3D กดเด้งได้)
                btn.className += "bg-purple-600 border-2 border-purple-800 text-white shadow-[0_4px_0_0_#581c87] cursor-pointer active:translate-y-1 active:shadow-none hover:bg-purple-500 ";
            } else {
                // ช่องที่เดินไม่ได้ (สีเทาเข้มแบนๆ)
                btn.className += "bg-slate-800 border-2 border-slate-900 text-slate-500 opacity-60 cursor-not-allowed ";
            }

            if (isQuotaExceeded) btn.disabled = true;

            if (isPlayerHere) {
                btn.innerHTML = `<span style="font-size:14px;">🧙‍♂️</span><span style="font-size:9px; font-weight:800;">${dungeonScore}</span>`;
            } else {
                let cellText = cell.text;
                // บัฟทักษะความรู้ (Knowledge Skill): แสดงคะแนนล่วงหน้าถ้าเดินไปช่องนั้น
                if (isSelectablePath && knowledgeLvl > 0 && cell.type !== 'boss' && cell.type !== 'exit') {
                    const previewVal = calculatePreviewScore(cell);
                    cellText += `<span style="font-size:8px; opacity:0.85; color:#fef08a;">(${previewVal})</span>`;
                }
                btn.innerHTML = `<span>${cellText}</span>`;
            }

            btn.onclick = () => {
                if (isSelectablePath) moveDungeonPlayer(r, c);
            };

            board.appendChild(btn);
        }
    }
}

function moveDungeonPlayer(r, c) {
    // บล็อกการเคลื่อนที่หากเล่นเกินโควต้า
    if (typeof isParentUser !== 'undefined' && typeof isDailyLimitEnabled !== 'undefined' && typeof todayPlayedRounds !== 'undefined' && typeof dailyLimitRounds !== 'undefined') {
        if (!isParentUser && isDailyLimitEnabled && todayPlayedRounds >= dailyLimitRounds) {
            alert(`🛑 หนูเล่นครบโควต้ารวม ${dailyLimitRounds} รอบประจำวันแล้วนะ พักสายตาก่อนแล้วมาเล่นใหม่พรุ่งนี้นะครับ!`);
            return;
        }
    }

    const cell = dungeonMap[r][c];

    // หากเดินเข้าช่องบอส 👹 ให้เปิดหน้าต่างท้าทายคิดเลขสู้บอส
    if (cell.type === 'boss') {
        openBossChallengeModal(r, c);
        return;
    }

    dungeonPlayerX = r;
    dungeonPlayerY = c;

    if (cell.type === 'add') {
        dungeonScore += cell.val;
    } else if (cell.type === 'mul') {
        dungeonScore *= cell.val;
    } else if (cell.type === 'monster') {
        // บัฟทักษะพลังกาย (Fitness Skill): ลดความเสียหายมอนสเตอร์
        const { fitnessLvl } = getPlayerSkillsDungeon();
        const reductionPct = Math.min(0.5, 0.20 + (fitnessLvl * 0.05));
        const finalMonsterDmg = Math.round(cell.val * (1 - reductionPct));
        dungeonScore -= finalMonsterDmg;
    }

    cell.type = 'empty';
    cell.text = '✨';
    cell.val = 0;

    renderDungeonUI();

    // ตรวจสอบเมื่อถึงทางออกที่ช่อง (4,4)
    if (r === 4 && c === 4) {
        const currentDiffRange = (dungeonTargetScore >= 300) ? 50 : 75;
        const minTarget = dungeonTargetScore - currentDiffRange;
        const maxTarget = dungeonTargetScore + currentDiffRange;

        // เช็กว่าคะแนนอยู่ในช่วงเป้าหมายหรือไม่
        if (dungeonScore >= minTarget && dungeonScore <= maxTarget) {
            setTimeout(() => {
                showCompletionModalDungeon();
            }, 100);
        } else {
            setTimeout(() => {
                if (dungeonScore < minTarget) {
                    alert(`🚪 ถึงทางออกแล้ว แต่คะแนนน้อยเกินไป! (${dungeonScore} คะแนน / ต้องได้ช่วง ${minTarget} - ${maxTarget})`);
                } else {
                    alert(`🚪 ถึงทางออกแล้ว แต่คะแนนเกินเป้าหมาย! (${dungeonScore} คะแนน / ต้องได้ช่วง ${minTarget} - ${maxTarget})`);
                }
            }, 100);
        }
    }
}

// ==========================================
// --- BOSS MATH CHALLENGE SYSTEM ---
// ==========================================

function openBossChallengeModal(targetR, targetC) {
    let modal = document.getElementById('nd-boss-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'nd-boss-modal';
        modal.className = "fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4";
        document.body.appendChild(modal);
    }

    const isHard = (dungeonCurrentDiff === 'hard');
    let num1, num2, num3, ans, questionText;
    
    if (isHard) {
        // โหมดยาก: โจทย์ผสม 2 ขั้นตอน (คูณ/หาร/บวกลบ)
        const opType = Math.random() < 0.5 ? 'mul_sub' : 'div_add';
        if (opType === 'mul_sub') {
            num1 = Math.floor(Math.random() * 8) + 3; // 3-10
            num2 = Math.floor(Math.random() * 5) + 2; // 2-6
            num3 = Math.floor(Math.random() * 15) + 5; // 5-19
            ans = (num1 * num2) - num3;
            questionText = `(${num1} × ${num2}) - ${num3} = ?`;
        } else {
            num2 = Math.floor(Math.random() * 4) + 2; // 2-5
            ans = Math.floor(Math.random() * 10) + 5; // 5-14
            num1 = num2 * ans;
            num3 = Math.floor(Math.random() * 20) + 10;
            ans = ans + num3;
            questionText = `(${num1} ÷ ${num2}) + ${num3} = ?`;
        }
    } else {
        // โหมดง่าย: โจทย์บวก-ลบ 2 จำนวน
        const isAdd = Math.random() < 0.5;
        if (isAdd) {
            num1 = Math.floor(Math.random() * 40) + 10;
            num2 = Math.floor(Math.random() * 40) + 10;
            ans = num1 + num2;
            questionText = `${num1} + ${num2} = ?`;
        } else {
            num1 = Math.floor(Math.random() * 50) + 30;
            num2 = Math.floor(Math.random() * 25) + 5;
            ans = num1 - num2;
            questionText = `${num1} - ${num2} = ?`;
        }
    }

    // สร้างตัวเลือกคำตอบ 3 ตัวเลือก
    let choices = [ans];
    while (choices.length < 3) {
        let offset = (Math.floor(Math.random() * 5) + 1) * (Math.random() < 0.5 ? 1 : -1);
        let wrongAns = ans + offset;
        if (wrongAns >= 0 && !choices.includes(wrongAns)) {
            choices.push(wrongAns);
        }
    }
    // สลับตำแหน่งตัวเลือก
    choices.sort(() => Math.random() - 0.5);

    const { knowledgeLvl } = getPlayerSkillsDungeon();
    // บัฟทักษะความรู้ (Knowledge Skill): ตัดตัวเลือกผิดออก 1 ตัวเลือก
    let disabledChoice = -1;
    if (knowledgeLvl >= 1) {
        const wrongChoices = choices.filter(c => c !== ans);
        disabledChoice = wrongChoices[Math.floor(Math.random() * wrongChoices.length)];
    }

    modal.innerHTML = `
        <div class="bg-slate-900 border-4 border-rose-600 p-5 rounded-3xl text-white max-w-xs w-full text-center shadow-2xl space-y-3">
            <div class="text-5xl animate-bounce">👹</div>
            <h3 class="font-kids text-lg font-black text-rose-400">ด่านปะทะบอสดันเจี้ยน!</h3>
            <p class="text-xs text-slate-300 font-bold">แก้โจทย์คณิตศาสตร์เพื่อปราบบอสและข้ามไปประตูทางออก!</p>
            
            <div class="bg-slate-950 p-4 rounded-2xl border border-rose-800">
                <span class="text-2xl font-black text-amber-300 font-kids">${questionText}</span>
            </div>

            ${knowledgeLvl >= 1 ? `<div class="text-[10px] text-yellow-300 font-bold bg-purple-900/60 py-1 rounded-xl border border-purple-700">🧠 ทักษะความรู้ช่วยตัด 1 ตัวเลือกผิดให้อัตโนมัติ!</div>` : ''}

            <div class="grid grid-cols-1 gap-2 pt-1">
                ${choices.map(c => {
                    const isDisabled = (c === disabledChoice);
                    return `
                        <button onclick="handleBossAnswer(${c}, ${ans}, ${targetR}, ${targetC})" 
                            ${isDisabled ? 'disabled' : ''} 
                            class="w-full py-2.5 rounded-xl font-extrabold text-sm transition ${
                                isDisabled 
                                    ? 'bg-slate-800 text-slate-600 border border-slate-700 opacity-40 cursor-not-allowed' 
                                    : 'bg-rose-600 hover:bg-rose-500 active:scale-95 text-white shadow-[0_4px_0_0_#9f1239]'
                            }">
                            ${c} ${isDisabled ? '❌ (ตัดออก)' : ''}
                        </button>
                    `;
                }).join('')}
            </div>
            
            <button onclick="closeBossModal()" class="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl text-xs font-bold transition">
                ถอยกลับก่อน 🔙
            </button>
        </div>
    `;

    modal.classList.remove('hidden');
}

function closeBossModal() {
    const modal = document.getElementById('nd-boss-modal');
    if (modal) modal.classList.add('hidden');
}

function handleBossAnswer(selected, correct, r, c) {
    closeBossModal();

    if (selected === correct) {
        alert("🎉 สุดยอดมาก! น้องแก้โจทย์สำเร็จ พิชิตบอสและเปิดทางผ่านประตูทางออกได้แล้ว! 🗝️✨");
        
        dungeonPlayerX = r;
        dungeonPlayerY = c;
        const cell = dungeonMap[r][c];
        cell.type = 'empty';
        cell.text = '✨';
        cell.val = 0;
        
        renderDungeonUI();
    } else {
        const { fitnessLvl } = getPlayerSkillsDungeon();
        const basePenalty = (dungeonCurrentDiff === 'hard') ? 30 : 15;
        const reductionPct = Math.min(0.5, 0.20 + (fitnessLvl * 0.05));
        const finalPenalty = Math.round(basePenalty * (1 - reductionPct));

        dungeonScore -= finalPenalty;
        alert(`💥 ตอบผิดนะ! โดนบอสโจมตีหักคะแนน -${finalPenalty} คะแนน (พลังกายช่วยลดความเสียหายแล้ว) ลองใหม่อีกครั้งนะ!`);
        renderDungeonUI();
    }
}

function showCompletionModalDungeon() {
    if (typeof totalGoldTrophies !== 'undefined') totalGoldTrophies += 1; else if (typeof totalTrophies !== 'undefined') totalTrophies += 1;
    if (typeof saveUserTrophies === 'function') saveUserTrophies();
    addEXPToUser(100);
    incrementTodayRounds(); // บันทึกเพิ่มจำนวนรอบที่เล่นประจำวัน

    document.getElementById("summary-total-count").innerText = "พิชิต Number Dungeon 5x5!";
    document.getElementById("summary-stars-earned").innerText = "🏆 ถ้วยทอง 1 ใบ";
    document.getElementById("summary-stars-earned").className = "text-sm text-amber-500 font-bold";
    document.getElementById("summary-exp-earned").innerText = "+100 EXP ✨";
    document.getElementById("summary-saved-badge").innerText = "✅ บันทึกถ้วยทองสะสมและแจ้งเตือนคุณพ่อคุณแม่เรียบร้อย!";
    document.getElementById("summary-saved-badge").className = "bg-emerald-50 text-emerald-800 text-xs font-bold p-2.5 rounded-xl border border-emerald-200";
    document.getElementById("completion-subtitle").innerText = `🎉 น้อง${currentUser || 'เด็กๆ'} พิชิตดันเจี้ยนสำเร็จแล้ว!`;
    document.getElementById("completion-modal").classList.remove("hidden");

    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(`เก่งมากเลยครับ ${currentUser || ''} พิชิตดันเจี้ยนสำเร็จ รับไปเลย ถ้วยทอง 1 ใบ`);
        utterance.lang = 'th-TH';
        window.speechSynthesis.speak(utterance);
    }
}
