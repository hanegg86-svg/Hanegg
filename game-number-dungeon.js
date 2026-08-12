// ==========================================
// --- NUMBER DUNGEON MINIGAME SYSTEM (5x5 GRID) ---
// ==========================================

let dungeonGridSize = 5; // ขยายกระดานเป็น 5x5 (25 ช่อง)[span_1](start_span)[span_1](end_span)
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
    // เช็กโควต้ารอบเล่นประจำวันก่อนเริ่มเกม[span_2](start_span)[span_2](end_span)
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
        // สุ่มตั้งเป้าหมายคะแนนหลักให้อยู่ระหว่าง 300 - 400[span_3](start_span)[span_3](end_span)
        dungeonTargetScore = Math.floor(Math.random() * 101) + 300; 
        const minTarget = dungeonTargetScore - 25;
        const maxTarget = dungeonTargetScore + 25;
        
        const tag = document.getElementById('nd-diff-tag');
        if (tag) tag.innerText = `ระดับยากพิเศษ 🔥 (เป้าหมาย: ${minTarget} - ${maxTarget})`;
    } else {
        dungeonTargetScore = 150;
        const minTarget = dungeonTargetScore - 25;
        const maxTarget = dungeonTargetScore + 25;
        
        const tag = document.getElementById('nd-diff-tag');
        if (tag) tag.innerText = `ระดับท้าทาย ⚡ (เป้าหมาย: ${minTarget} - ${maxTarget})`;
    }

    // สร้างแผนที่ตาราง 5x5[span_4](start_span)[span_4](end_span)
    dungeonMap = [];
    for (let r = 0; r < dungeonGridSize; r++) {
        let row = [];
        for (let c = 0; c < dungeonGridSize; c++) {
            if (r === 0 && c === 0) {
                row.push({ type: 'start', val: 0, text: '🧙‍♂️' });
            } else if (r === 4 && c === 4) { // ทางออกประตูอยู่ที่มุมขวาล่าง (4,4)[span_5](start_span)[span_5](end_span)
                row.push({ type: 'exit', val: 0, text: '🚪' });
            } else {
                let rand = Math.random();
                if (diff === 'hard') {
                    if (rand < 0.35) {
                        let num = Math.floor(Math.random() * 25) + 10; // +10 ถึง +34[span_6](start_span)[span_6](end_span)
                        row.push({ type: 'add', val: num, text: `+${num}` });
                    } else if (rand < 0.65) {
                        let num = Math.floor(Math.random() * 2) + 2; // ×2 ถึง ×3[span_7](start_span)[span_7](end_span)
                        row.push({ type: 'mul', val: num, text: `×${num}` });
                    } else {
                        let num = Math.floor(Math.random() * 50) + 20; // 👾 -20 ถึง -69[span_8](start_span)[span_8](end_span)
                        row.push({ type: 'monster', val: num, text: `👾 -${num}` });
                    }
                } else {
                    if (rand < 0.45) {
                        let num = Math.floor(Math.random() * 12) + 3;[span_9](start_span)[span_9](end_span)
                        row.push({ type: 'add', val: num, text: `+${num}` });
                    } else if (rand < 0.7) {
                        let num = Math.floor(Math.random() * 2) + 2;[span_10](start_span)[span_10](end_span)
                        row.push({ type: 'mul', val: num, text: `×${num}` });
                    } else {
                        let num = Math.floor(Math.random() * 25) + 10;[span_11](start_span)[span_11](end_span)
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

    if (hpText) hpText.innerText = dungeonHP;[span_12](start_span)[span_12](end_span)
    if (scoreText) scoreText.innerText = dungeonScore;[span_13](start_span)[span_13](end_span)
    
    // แสดงช่วงเป้าหมาย (+/- 25) ให้ผู้เล่นเห็นบน UI
    if (targetText) {
        const minTarget = dungeonTargetScore - 25;
        const maxTarget = dungeonTargetScore + 25;
        targetText.innerText = `${minTarget} - ${maxTarget}`;
    }

    const board = document.getElementById('nd-grid-board') || document.getElementById('dungeon-grid-board');[span_14](start_span)[span_14](end_span)
    if (!board) return;
    
    // ตรวจสอบสถานะ Daily Limit[span_15](start_span)[span_15](end_span)
    const isQuotaExceeded = (typeof isParentUser !== 'undefined' && !isParentUser && isDailyLimitEnabled && todayPlayedRounds >= dailyLimitRounds);

    // กำหนดการแสดงผล CSS Grid เป็น 5 คอลัมน์[span_16](start_span)[span_16](end_span)
    board.className = "grid grid-cols-5 gap-1.5 w-full max-w-[340px] mx-auto py-2";[span_17](start_span)[span_17](end_span)
    board.innerHTML = '';

    for (let r = 0; r < dungeonGridSize; r++) {
        for (let c = 0; c < dungeonGridSize; c++) {
            const cell = dungeonMap[r][c];[span_18](start_span)[span_18](end_span)
            const isPlayerHere = (r === dungeonPlayerX && c === dungeonPlayerY);[span_19](start_span)[span_19](end_span)
            
            // กฎบีบเส้นทางเดิน: เดินได้เฉพาะ ขวา (c + 1) หรือ ลง (r + 1)[span_20](start_span)[span_20](end_span)
            const canMoveRight = (r === dungeonPlayerX && c === dungeonPlayerY + 1);[span_21](start_span)[span_21](end_span)
            const canMoveDown = (r === dungeonPlayerX + 1 && c === dungeonPlayerY);[span_22](start_span)[span_22](end_span)
            const isSelectablePath = (canMoveRight || canMoveDown) && !isQuotaExceeded;[span_23](start_span)[span_23](end_span)

            const btn = document.createElement('button');
            let bgClass = "bg-slate-800 border-slate-700 text-slate-300";[span_24](start_span)[span_24](end_span)
            
            if (isPlayerHere) {
                bgClass = "bg-indigo-600 border-indigo-400 text-white font-extrabold ring-2 ring-indigo-300 animate-pulse";[span_25](start_span)[span_25](end_span)
            } else if (isSelectablePath) {
                bgClass = "bg-purple-900/80 hover:bg-purple-700 border-purple-400 text-purple-100 cursor-pointer active:scale-95 shadow-md";[span_26](start_span)[span_26](end_span)
            } else {
                bgClass = "bg-slate-950/60 border-slate-900 text-slate-600 cursor-not-allowed opacity-60";[span_27](start_span)[span_27](end_span)
            }

            btn.className = `h-12 rounded-xl border flex flex-col items-center justify-center font-bold text-[10px] transition duration-150 ${bgClass}`;[span_28](start_span)[span_28](end_span)
            if (isQuotaExceeded) btn.disabled = true;[span_29](start_span)[span_29](end_span)

            if (isPlayerHere) {
                btn.innerHTML = `<span class="text-sm">🧙‍♂️</span><span class="text-[8px] font-extrabold">${dungeonScore}</span>`;[span_30](start_span)[span_30](end_span)
            } else {
                btn.innerHTML = `<span class="font-kids">${cell.text}</span>`;[span_31](start_span)[span_31](end_span)
            }

            btn.onclick = () => {
                if (isSelectablePath) moveDungeonPlayer(r, c);[span_32](start_span)[span_32](end_span)
            };

            board.appendChild(btn);
        }
    }
}

function moveDungeonPlayer(r, c) {
    // บล็อกการเคลื่อนที่หากเล่นเกินโควต้า[span_33](start_span)[span_33](end_span)
    if (typeof isParentUser !== 'undefined' && typeof isDailyLimitEnabled !== 'undefined' && typeof todayPlayedRounds !== 'undefined' && typeof dailyLimitRounds !== 'undefined') {
        if (!isParentUser && isDailyLimitEnabled && todayPlayedRounds >= dailyLimitRounds) {
            alert(`🛑 หนูเล่นครบโควต้ารวม ${dailyLimitRounds} รอบประจำวันแล้วนะ พักสายตาก่อนแล้วมาเล่นใหม่พรุ่งนี้นะครับ!`);
            return;
        }
    }

    dungeonPlayerX = r;
    dungeonPlayerY = c;
    const cell = dungeonMap[r][c];[span_34](start_span)[span_34](end_span)

    if (cell.type === 'add') {
        dungeonScore += cell.val;[span_35](start_span)[span_35](end_span)
    } else if (cell.type === 'mul') {
        dungeonScore *= cell.val;[span_36](start_span)[span_36](end_span)
    } else if (cell.type === 'monster') {
        dungeonScore -= cell.val;[span_37](start_span)[span_37](end_span)
    }

    cell.type = 'empty';[span_38](start_span)[span_38](end_span)
    cell.text = '✨';[span_39](start_span)[span_39](end_span)
    cell.val = 0;[span_40](start_span)[span_40](end_span)

    renderDungeonUI();

    if (dungeonScore <= 0) {
        setTimeout(() => {
            alert("💥 คะแนนลดจนหมด! พ่ายแพ้ในดันเจี้ยน");[span_41](start_span)[span_41](end_span)
            startDungeonGame('easy');[span_42](start_span)[span_42](end_span)
        }, 100);
    } else if (r === 4 && c === 4) { // ตรวจสอบเมื่อถึงทางออกที่ช่อง (4,4)[span_43](start_span)[span_43](end_span)
        const minTarget = dungeonTargetScore - 25;
        const maxTarget = dungeonTargetScore + 25;

        // เช็กว่าคะแนนอยู่ในช่วง [dungeonTargetScore - 25, dungeonTargetScore + 25] หรือไม่
        if (dungeonScore >= minTarget && dungeonScore <= maxTarget) {
            setTimeout(() => {
                showCompletionModalDungeon();[span_44](start_span)[span_44](end_span)
            }, 100);
        } else {
            setTimeout(() => {
                if (dungeonScore < minTarget) {
                    alert(`🚪 ถึงทางออกแล้ว แต่คะแนนน้อยเกินไป! (ต้องได้ช่วง ${minTarget} - ${maxTarget} คะแนน)`);
                } else {
                    alert(`🚪 ถึงทางออกแล้ว แต่คะแนนเกินเป้าหมาย! (ต้องได้ช่วง ${minTarget} - ${maxTarget} คะแนน)`);
                }
            }, 100);
        }
    }
}

function showCompletionModalDungeon() {
    totalStars += 1;[span_45](start_span)[span_45](end_span)
    saveUserStars();[span_46](start_span)[span_46](end_span)
    addEXPToUser(100);[span_47](start_span)[span_47](end_span)
    incrementTodayRounds(); // บันทึกเพิ่มจำนวนรอบที่เล่นประจำวัน[span_48](start_span)[span_48](end_span)

    document.getElementById("summary-total-count").innerText = "พิชิต Number Dungeon 5x5!";[span_49](start_span)[span_49](end_span)
    document.getElementById("summary-stars-earned").innerText = "⭐ 1 ดวง";[span_50](start_span)[span_50](end_span)
    document.getElementById("summary-stars-earned").className = "text-sm text-amber-500 font-bold";[span_51](start_span)[span_51](end_span)
    document.getElementById("summary-exp-earned").innerText = "+100 EXP ✨";[span_52](start_span)[span_52](end_span)
    document.getElementById("summary-saved-badge").innerText = "✅ บันทึกดาวสะสมและแจ้งเตือนคุณพ่อคุณแม่เรียบร้อย!";[span_53](start_span)[span_53](end_span)
    document.getElementById("summary-saved-badge").className = "bg-emerald-50 text-emerald-800 text-xs font-bold p-2.5 rounded-xl border border-emerald-200";[span_54](start_span)[span_54](end_span)
    document.getElementById("completion-subtitle").innerText = `🎉 น้อง${currentUser || 'เด็กๆ'} พิชิตดันเจี้ยนสำเร็จแล้ว!`;[span_55](start_span)[span_55](end_span)
    document.getElementById("completion-modal").classList.remove("hidden");[span_56](start_span)[span_56](end_span)

    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();[span_57](start_span)[span_57](end_span)
        const utterance = new SpeechSynthesisUtterance(`เก่งมากเลยครับ ${currentUser || ''} พิชิตดันเจี้ยนสำเร็จ รับไปเลย 1 ดาว`);[span_58](start_span)[span_58](end_span)
        utterance.lang = 'th-TH';[span_59](start_span)[span_59](end_span)
        window.speechSynthesis.speak(utterance);[span_60](start_span)[span_60](end_span)
    }
}
