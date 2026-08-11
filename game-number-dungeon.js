// ==========================================
// --- NUMBER DUNGEON MINIGAME SYSTEM ---
// ==========================================

let dungeonGridSize = 3;
let dungeonPlayerX = 0;
let dungeonPlayerY = 0;
let dungeonScore = 10;
let dungeonHP = 1;
let dungeonTargetScore = 50;
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
        dungeonTargetScore = 100;
        document.getElementById('nd-diff-tag').innerText = "ระดับยาก";
    } else {
        dungeonTargetScore = 50;
        document.getElementById('nd-diff-tag').innerText = "ระดับทั่วไป";
    }

    // สร้างแผนที่ตาราง 3x3
    dungeonMap = [];
    for (let r = 0; r < dungeonGridSize; r++) {
        let row = [];
        for (let c = 0; c < dungeonGridSize; c++) {
            if (r === 0 && c === 0) {
                row.push({ type: 'start', val: 0, text: '🧙‍♂️' });
            } else if (r === 2 && c === 2) {
                row.push({ type: 'exit', val: 0, text: '🚪' });
            } else {
                // สุ่มการ์ดในดันเจี้ยน: บวกเลข, คูณเลข, หรือมอนสเตอร์
                let rand = Math.random();
                if (rand < 0.45) {
                    let num = Math.floor(Math.random() * 8) + 2;
                    row.push({ type: 'add', val: num, text: `+${num}` });
                } else if (rand < 0.7) {
                    let num = Math.floor(Math.random() * 2) + 2;
                    row.push({ type: 'mul', val: num, text: `×${num}` });
                } else {
                    let num = Math.floor(Math.random() * 15) + 5;
                    row.push({ type: 'monster', val: num, text: `👾 -${num}` });
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
    board.innerHTML = '';

    for (let r = 0; r < dungeonGridSize; r++) {
        for (let c = 0; c < dungeonGridSize; c++) {
            const cell = dungeonMap[r][c];
            const isPlayerHere = (r === dungeonPlayerX && c === dungeonPlayerY);
            
            // เช็กว่าติดกับผู้เล่นหรือไม่ (เดินได้เฉพาะแนวตั้ง/แนวนอนที่ติดกัน)
            const isAdjacent = (Math.abs(r - dungeonPlayerX) + Math.abs(c - dungeonPlayerY)) === 1;

            const btn = document.createElement('button');
            let bgClass = "bg-slate-800 border-slate-700 text-slate-300";
            
            if (isPlayerHere) {
                bgClass = "bg-indigo-600 border-indigo-400 text-white font-extrabold ring-2 ring-indigo-300 animate-pulse";
            } else if (isAdjacent) {
                bgClass = "bg-purple-900/60 hover:bg-purple-800 border-purple-500 text-purple-200 cursor-pointer active:scale-95";
            } else {
                bgClass = "bg-slate-950/50 border-slate-800 text-slate-600 cursor-not-allowed";
            }

            btn.className = `h-16 rounded-2xl border-2 flex flex-col items-center justify-center font-bold text-xs transition duration-150 ${bgClass}`;
            
            if (isPlayerHere) {
                btn.innerHTML = `<span class="text-xl">🧙‍♂️</span><span class="text-[10px]">${dungeonScore}</span>`;
            } else {
                btn.innerHTML = `<span class="text-xs font-kids">${cell.text}</span>`;
            }

            btn.onclick = () => {
                if (isAdjacent) moveDungeonPlayer(r, c);
            };

            board.appendChild(btn);
        }
    }
}

function moveDungeonPlayer(r, c) {
    dungeonPlayerX = r;
    dungeonPlayerY = c;
    const cell = dungeonMap[r][c];

    // คำนวณผลลัพธ์ตามประเภทของช่อง
    if (cell.type === 'add') {
        dungeonScore += cell.val;
    } else if (cell.type === 'mul') {
        dungeonScore *= cell.val;
    } else if (cell.type === 'monster') {
        dungeonScore -= cell.val;
    }

    // เคลียร์ช่องที่เดินผ่านแล้วให้กลายเป็นช่องว่าง
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
    } else if (r === 2 && c === 2) {
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
        alert("🎉 พิชิต Number Dungeon สำเร็จแล้ว!");
    }
}
