// ==========================================
// --- NUMBER DUNGEON MINIGAME SYSTEM (5x5 GRID) ---
// ==========================================

let dungeonGridSize = 5; // ขยายกระดานเป็น 5x5 (25 ช่อง)
let dungeonPlayerX = 0;
let dungeonPlayerY = 0;
let dungeonScore = 10;
let dungeonHP = 1;
let dungeonTargetScore = 150;
let dungeonMap = [];

function initNumberDungeon() {
    startDungeonGame('easy');
}

function startDungeonGame(diff) {
    // เช็กโควต้ารอบเล่นประจำวันก่อนเริ่มเกม
    if (typeof isParentUser !== 'undefined' && typeof isDailyLimitEnabled !== 'undefined' && typeof todayPlayedRounds !== 'undefined' && typeof dailyLimitRounds !== 'undefined') {
        if (!isParentUser && isDailyLimitEnabled && todayPlayedRounds >= dailyLimitRounds) {
            alert(`🛑 หนูเล่นครบโควต้ารวม ${dailyLimitRounds} รอบประจำวันแล้วนะ พักสายตาก่อนแล้วมาเล่นใหม่พรุ่งนี้นะครับ!`);
            return;
        }
    }

    dungeonScore = 10;
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
            } else if (r === 4 && c === 4) { // ทางออกประตูอยู่ที่มุมขวาล่าง (4,4)
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
            
            // --- ใช้คลาส Tailwind ผสมสำหรับปุ่ม 3D แทน inline style เดิม ---
            btn.className = "w-full h-[48px] rounded-xl flex flex-col items-center justify-center font-bold text-[11px] transition-all ";
            
            if (isPlayerHere) {
                // ช่องที่เรายืนอยู่ (สีฟ้าโดดเด่น)
                btn.className += "bg-sky-500 border-2 border-sky-700 text-white shadow-[0_4px_0_0_#0369a1] scale-105 z-10 ";
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
                btn.innerHTML = `<span>${cell.text}</span>`;
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

    dungeonPlayerX = r;
    dungeonPlayerY = c;
    const cell = dungeonMap[r][c];

    if (cell.type === 'add') {
        dungeonScore += cell.val;
    } else if (cell.type === 'mul') {
        dungeonScore *= cell.val;
    } else if (cell.type === 'monster') {
        dungeonScore -= cell.val;
    }

    cell.type = 'empty';
    cell.text = '✨';
    cell.val = 0;

    renderDungeonUI();

    // 💡 ยกเลิกเงื่อนไข Game Over เมื่อคะแนนติดลบ เพื่อให้เดินเล่นต่อได้ตลอด
    if (r === 4 && c === 4) { // ตรวจสอบเมื่อถึงทางออกที่ช่อง (4,4)
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

function showCompletionModalDungeon() {
    totalStars += 1;
    saveUserStars();
    addEXPToUser(100);
    incrementTodayRounds(); // บันทึกเพิ่มจำนวนรอบที่เล่นประจำวัน

    document.getElementById("summary-total-count").innerText = "พิชิต Number Dungeon 5x5!";
    document.getElementById("summary-stars-earned").innerText = "⭐ 1 ดวง";
    document.getElementById("summary-stars-earned").className = "text-sm text-amber-500 font-bold";
    document.getElementById("summary-exp-earned").innerText = "+100 EXP ✨";
    document.getElementById("summary-saved-badge").innerText = "✅ บันทึกดาวสะสมและแจ้งเตือนคุณพ่อคุณแม่เรียบร้อย!";
    document.getElementById("summary-saved-badge").className = "bg-emerald-50 text-emerald-800 text-xs font-bold p-2.5 rounded-xl border border-emerald-200";
    document.getElementById("completion-subtitle").innerText = `🎉 น้อง${currentUser || 'เด็กๆ'} พิชิตดันเจี้ยนสำเร็จแล้ว!`;
    document.getElementById("completion-modal").classList.remove("hidden");

    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(`เก่งมากเลยครับ ${currentUser || ''} พิชิตดันเจี้ยนสำเร็จ รับไปเลย 1 ดาว`);
        utterance.lang = 'th-TH';
        window.speechSynthesis.speak(utterance);
    }
}
