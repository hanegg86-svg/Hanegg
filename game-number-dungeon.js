// ==========================================
// --- NUMBER DUNGEON MINIGAME SYSTEM (5x5 GRID) ---
// ==========================================

let dungeonGridSize = 5; // กระดานขนาด 5x5 (25 ช่อง)
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
    
    if (diff === 'hard') {
        dungeonTargetScore = 300;
        document.getElementById('nd-diff-tag').innerText = "ระดับยากพิเศษ 🔥";
    } else {
        dungeonTargetScore = 150;
        document.getElementById('nd-diff-tag').innerText = "ระดับท้าทาย ⚡";
    }

    // สร้างแผนที่ตาราง 5x5
    dungeonMap = [];
    for (let r = 0; r < dungeonGridSize; r++) {
        let row = [];
        for (let c = 0; c < dungeonGridSize; c++) {
            if (r === 0 && c === 0) {
                row.push({ type: 'start', val: 0, text: '🧙‍♂️' });
            } else if (r === 4 && c === 4) {
                row.push({ type: 'exit', val: 0, text: '🚪' });
            } else {
                let rand = Math.random();
                if (diff === 'hard') {
                    // โหมดยาก: มอนสเตอร์หักคะแนนเยอะ สุ่มคูณและบวกลบเลขสูงขึ้น
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
                    // โหมดทั่วไป
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
    document.getElementById('nd-hp-text').innerText = dungeonHP;
    document.getElementById('nd-score-text').innerText = dungeonScore;
    document.getElementById('nd-target-text').innerText = dungeonTargetScore;

    const board = document.getElementById('nd-grid-board');
    if (!board) return;
    
    // ตั้งค่า CSS Grid เป็น 5 คอลัมน์
    board.className = "grid grid-cols-5 gap-1.5 w-full max-w-[340px] mx-auto py-2";
    board.innerHTML = '';

    for (let r = 0; r < dungeonGridSize; r++) {
        for (let c = 0; c < dungeonGridSize; c++) {
            const cell = dungeonMap[r][c];
            const isPlayerHere = (r === dungeonPlayerX && c === dungeonPlayerY);
            
            // กฎการเดิน: เดินได้เฉพาะ ขวา (c + 1) หรือ ลง (r + 1) เท่านั้น เพื่อบีบเส้นทางให้วางแผนล่วงหน้า
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

            btn.className = `h-14 rounded-xl border flex flex-col items-center justify-center font-bold text-[11px] transition duration-150 ${bgClass}`;
            
            if (isPlayerHere) {
                btn.innerHTML = `<span class="text-base">🧙‍♂️</span><span class="text-[9px] font-extrabold">${dungeonScore}</span>`;
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

    // คำนวณผลลัพธ์คะแนน
    if (cell.type === 'add') {
        dungeonScore += cell.val;
    } else if (cell.type === 'mul') {
        dungeonScore *= cell.val;
    } else if (cell.type === 'monster') {
        dungeonScore -= cell.val;
    }

    // เคลียร์ช่องที่เดินผ่านแล้ว
    cell.type = 'empty';
    cell.text = '✨';
    cell.val = 0;

    renderDungeonUI();

    // ตรวจสอบเงื่อนไขแพ้-ชนะ
    if (dungeonScore <= 0) {
        setTimeout(() => {
            alert("💥 คะแนนลดจนหมด! พ่ายแพ้ในดันเจี้ยน");
            startDungeonGame('easy');
        }, 100);
    } else if (r === 4 && c === 4) {
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
    if (typeof addStar === "function") {
        addStar(); // เรียกเปิด Modal มอบดาวสะสม
    } else {
        alert("🎉 พิชิต Number Dungeon 5x5 สำเร็จแล้ว!");
    }
}
