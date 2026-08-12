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
    dungeonScore = 10;
    dungeonHP = 1;
    dungeonPlayerX = 0;
    dungeonPlayerY = 0;
    dungeonGridSize = 5;
    
    if (diff === 'hard') {
        dungeonTargetScore = 300;
        const tag = document.getElementById('nd-diff-tag');
        if (tag) tag.innerText = "ระดับยากพิเศษ 🔥";
    } else {
        dungeonTargetScore = 150;
        const tag = document.getElementById('nd-diff-tag');
        if (tag) tag.innerText = "ระดับท้าทาย ⚡";
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
                        let num = Math.floor(Math.random() * 15) + 5;
                        row.push({ type: 'add', val: num, text: `+${num}` });
                    } else if (rand < 0.6) {
                        let num = Math.floor(Math.random() * 2) + 2;
                        row.push({ type: 'mul', val: num, text: `×${num}` });
                    } else {
                        let num = Math.floor(Math.random() * 40) + 15;
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
    if (targetText) targetText.innerText = dungeonTargetScore;

    const board = document.getElementById('nd-grid-board') || document.getElementById('dungeon-grid-board');
    if (!board) return;
    
    // กำหนดการแสดงผล CSS Grid เป็น 5 คอลัมน์
    board.className = "grid grid-cols-5 gap-1.5 w-full max-w-[340px] mx-auto py-2";
    board.innerHTML = '';

    for (let r = 0; r < dungeonGridSize; r++) {
        for (let c = 0; c < dungeonGridSize; c++) {
            const cell = dungeonMap[r][c];
            const isPlayerHere = (r === dungeonPlayerX && c === dungeonPlayerY);
            
            // กฎบีบเส้นทางเดิน: เดินได้เฉพาะ ขวา (c + 1) หรือ ลง (r + 1)
            const canMoveRight = (r === dungeonPlayerX && c === dungeonPlayerY + 1);
            const canMoveDown = (r === dungeonPlayerX + 1 && c === dungeonPlayerY);
            const isSelectablePath = canMoveRight || canMoveDown;

            const btn = document.createElement('button');
            let bgClass = "bg-slate-800 border-slate-700 text-slate-300";
            
            if (isPlayerHere) {
                bgClass = "bg-indigo-600 border-indigo-400 text-white font-extrabold ring-2 ring-indigo-300 animate-pulse";
            } else if (isSelectablePath) {
                bgClass = "bg-purple-900/80 hover:bg-purple-700 border-purple-400 text-purple-100 cursor-pointer active:scale-95 shadow-md";
            } else {
                bgClass = "bg-slate-950/60 border-slate-900 text-slate-600 cursor-not-allowed opacity-60";
            }

            btn.className = `h-12 rounded-xl border flex flex-col items-center justify-center font-bold text-[10px] transition duration-150 ${bgClass}`;
            
            if (isPlayerHere) {
                btn.innerHTML = `<span class="text-sm">🧙‍♂️</span><span class="text-[8px] font-extrabold">${dungeonScore}</span>`;
            } else {
                btn.innerHTML = `<span class="font-kids">${cell.text}</span>`;
            }

            btn.onclick = () => {
                if (isSelectablePath) moveDungeonPlayer(r, c);
            };

            board.appendChild(btn);
        }
    }
}

function moveDungeonPlayer(r, c) {
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

    if (dungeonScore <= 0) {
        setTimeout(() => {
            alert("💥 คะแนนลดจนหมด! พ่ายแพ้ในดันเจี้ยน");
            startDungeonGame('easy');
        }, 100);
    } else if (r === 4 && c === 4) { // ตรวจสอบการเข้าประตูทางออกที่ช่อง (4,4)
        if (dungeonScore >= dungeonTargetScore) {
            setTimeout(() => {
                showCompletionModalDungeon();
            }, 100);
        } else {
            setTimeout(() => {
                alert(`🚪 ถึงทางออกแล้ว แต่คะแนนยังไม่ถึงเป้าหมาย! (ต้องการ ${dungeonTargetScore} คะแนน)`);
            }, 100);
        }
    }
}

function showCompletionModalDungeon() {
    totalStars += 1;
    saveUserStars();
    addEXPToUser(100);
    incrementTodayRounds();

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
