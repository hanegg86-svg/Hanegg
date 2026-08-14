// Path: ./game-td.js
// ==========================================
// --- MATH HERO TD GAME ENGINE (WITH CUSTOM IMAGES & 3D UI) ---
// ==========================================

// --- โหลดรูปภาพมอนสเตอร์ ---
const imgMushroom = new Image();
imgMushroom.src = "mushroom.png";

const imgTurtle = new Image();
imgTurtle.src = "turtle.png";

const imgBoss = new Image();
imgBoss.src = "boss.png";

let tdCanvas, tdCtx, tdChoiceBtns, tdQuestionDisplay, tdUltBtn, tdUltCountDisplay;
let tdHp = 10, tdScore = 0, tdWave = 1, tdTotalKillsInWave = 0, tdUltimateCount = 1, tdIsGameCleared = false;
let tdCoins = 0, tdSlowTimer = 0, tdFreezeTimer = 0;
let tdMultiShotUnlocked = false; 
let tdAutoTurretUnlocked = false; 
let tdTotalAnswersCount = 0;     
let tdWrongCount = 0, tdShakeTimer = 0;
let tdEnemies = [], tdParticles = [], tdSlashes = [], tdSpawnTimer = 0, tdCurrentTarget = null, tdCurrentChoices = [];
let tdWaveNoticeTimer = 120, tdWaveNoticeText = "WAVE 1", tdAnimationRequestId = null;

// ตัวแปรควบคุมสปอว์นใน Boss Wave 14 (0=Minions, 1=Boss, 2=AfterBoss, 3=FinishedSpawn)
let tdBossWaveStage = 0; 
let tdMinionsSpawnedCount = 0;

// ตัวแปรระดับความยาก ('easy' หรือ 'hard')
let tdDifficulty = 'easy';

const tdPath = [
    {x: -30, y: 180}, {x: 180, y: 180}, {x: 180, y: 80},
    {x: 420, y: 80}, {x: 420, y: 230}, {x: 500, y: 230}
];
const tdHero = { x: 535, y: 230, slashAnim: 0 };
const tdTurretPos = { x: 300, y: 150 };

function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y, x + width, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

function setTDDifficulty(diff) {
    tdDifficulty = diff;
    const easyBtn = document.getElementById("td-diff-easy");
    const hardBtn = document.getElementById("td-diff-hard");
    
    // --- เปลี่ยนสไตล์ปุ่มเป็น 3D มาริโอ้ ---
    const activeClass = "flex-1 py-1.5 rounded-xl text-[11px] font-black text-white shadow-[0_4px_0_0_rgba(0,0,0,0.2)] border-2 transition-all active:translate-y-1 active:shadow-none ";
    const inactiveClass = "flex-1 py-1.5 rounded-xl text-[11px] font-black bg-white text-slate-700 hover:bg-slate-50 shadow-[0_4px_0_0_#cbd5e1] border-2 border-slate-300 transition-all active:translate-y-1 active:shadow-none ";

    if (easyBtn && hardBtn) {
        if (diff === 'easy') {
            easyBtn.className = activeClass + "bg-emerald-500 border-emerald-700";
            hardBtn.className = inactiveClass;
        } else {
            hardBtn.className = activeClass + "bg-rose-500 border-rose-700";
            easyBtn.className = inactiveClass;
        }
    }
    initMathTDGame();
}

function getTargetKillsForWave(wave) {
    if (wave <= 2) return 7;      
    if (wave <= 4) return 8;      
    if (wave <= 13) return 10;
    return 7; // Wave 14: ลูกน้อง 5 ตัว + บอสใหญ่ 1 ตัว + ตัวปิดท้าย 1 ตัว
}

function getCoinRewardForWave(wave) {
    if (wave >= 11) return 25; 
    if (wave >= 7) return 20;  
    if (wave >= 4) return 15;  
    return 10;                 
}

class TDEnemy {
    constructor(isBoss = false) {
        this.x = tdPath[0].x;
        this.y = tdPath[0].y;
        this.pathIndex = 0;
        
        this.isBoss = isBoss;
        this.maxHp = isBoss ? 10 : 1;
        this.hp = this.maxHp;

        // สุ่มเลือกว่าลูกน้องจะเป็นเห็ดหรือเต่า
        this.enemyType = Math.random() > 0.5 ? 'mushroom' : 'turtle';

        const speedMultiplier = (tdDifficulty === 'easy') ? 0.7 : 1.0;
        let speedBase = ((0.6 + (tdWave - 1) * 0.12) * speedMultiplier) * 1.265;
        if (this.isBoss) speedBase *= 0.225; 

        this.baseSpeed = speedBase;
        this.speed = this.baseSpeed;
        this.size = isBoss ? 50 : 22; 
        this.id = Math.random();
        
        const qData = this.generateMathProblem(tdWave);
        this.question = qData.question;
        this.answer = qData.answer;

        this.progress = 0;
        this.dead = false;
        this.penaltyTimer = 0;
    }

    resetQuestion() {
        const qData = this.generateMathProblem(tdWave);
        this.question = qData.question;
        this.answer = qData.answer;
    }

    generateMathProblem(currentWave) {
        let availableOps = ['+'];
        if (tdDifficulty === 'easy') {
            if (currentWave >= 2) availableOps.push('-');
        } else {
            if (currentWave >= 3) availableOps.push('-');
            if (currentWave >= 6) availableOps.push('×');
            if (currentWave >= 8) availableOps.push('÷');
            if (currentWave >= 13) availableOps.push('^');
        }

        const op = availableOps[Math.floor(Math.random() * availableOps.length)];
        let num1, num2, question, answer;

        if (op === '+') {
            const max = 10 + currentWave * 3;
            num1 = Math.floor(Math.random() * max) + 1;
            num2 = Math.floor(Math.random() * max) + 1;
            question = `${num1} + ${num2}`; answer = num1 + num2;
        } else if (op === '-') {
            const max = 15 + currentWave * 3;
            num1 = Math.floor(Math.random() * max) + 5;
            num2 = Math.floor(Math.random() * (num1 - 1)) + 1;
            question = `${num1} - ${num2}`; answer = num1 - num2;
        } else if (op === '×') {
            num1 = Math.floor(Math.random() * 10) + 2;
            num2 = Math.floor(Math.random() * 10) + 2;
            question = `${num1} × ${num2}`; answer = num1 * num2;
        } else if (op === '÷') {
            num2 = Math.floor(Math.random() * 9) + 2;
            answer = Math.floor(Math.random() * 10) + 2;
            num1 = num2 * answer;
            question = `${num1} ÷ ${num2}`;
        } else if (op === '^') {
            num1 = Math.floor(Math.random() * 5) + 1;
            num2 = Math.floor(Math.random() * 2) + 2;
            answer = Math.pow(num1, num2);
            
            const superscriptMap = { '2': '²', '3': '³' };
            question = `${num1}${superscriptMap[num2] || '^' + num2}`;
        }
        return { question, answer };
    }

    update(aheadEnemy) {
        if (this.pathIndex >= tdPath.length - 1) {
            if (!this.dead) {
                this.dead = true;
                if (!tdIsGameCleared && tdHp > 0) {
                    tdHp -= this.isBoss ? 5 : 1; 
                    if (tdHp < 0) tdHp = 0;
                    const hpEl = document.getElementById('td-hp');
                    if (hpEl) hpEl.innerText = tdHp;
                }
                checkGameEndState();
            }
            return;
        }

        const target = tdPath[this.pathIndex + 1];
        const dx = target.x - this.x, dy = target.y - this.y;
        const dist = Math.hypot(dx, dy);

        let currentSpeed = this.baseSpeed;

        if (tdFreezeTimer > 0) {
            currentSpeed = 0;
        } else if (tdSlowTimer > 0) {
            currentSpeed *= 0.5;
        }

        if (this.penaltyTimer > 0 && tdFreezeTimer <= 0) {
            currentSpeed *= 2.0;
            this.penaltyTimer--;
        }

        if (aheadEnemy) {
            const distToAhead = Math.hypot(aheadEnemy.x - this.x, aheadEnemy.y - this.y);
            const minGap = this.isBoss ? 140 : 110;
            if (distToAhead < minGap && this.penaltyTimer <= 0) {
                currentSpeed = Math.max(0, aheadEnemy.speed * (distToAhead / minGap));
            }
        }
        this.speed = currentSpeed;

        if (dist < this.speed) {
            this.x = target.x; this.y = target.y;
            this.pathIndex++;
        } else {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        }
        this.progress = this.pathIndex * 1000 + (1000 - dist);
    }

    draw(isTarget) {
        tdCtx.save();
        tdCtx.translate(this.x, this.y);

        if (this.penaltyTimer > 0) {
            tdCtx.shadowColor = '#FF70A6'; 
            tdCtx.shadowBlur = 18;
        }

        // --- เลือกว่าจะวาดรูปไหน ---
        let imgToDraw;
        if (this.isBoss) {
            imgToDraw = imgBoss;
        } else if (this.enemyType === 'turtle') {
            imgToDraw = imgTurtle;
        } else {
            imgToDraw = imgMushroom;
        }

        const imgSize = this.isBoss ? this.size * 2.8 : this.size * 2.5; 
        
        // ถ้ารูปโหลดเสร็จแล้ว ให้วาดรูป
        if (imgToDraw.complete && imgToDraw.naturalHeight !== 0) {
            if (isTarget) {
                tdCtx.shadowColor = '#FFD166';
                tdCtx.shadowBlur = 15;
            }
            tdCtx.drawImage(imgToDraw, -imgSize/2, -imgSize/2, imgSize, imgSize);
        } else {
            // ถ้ารูปยังไม่มา ให้วาดวงกลมสำรองไปก่อน
            tdCtx.fillStyle = this.isBoss ? '#4A00E0' : '#FF85A1';
            tdCtx.beginPath();
            tdCtx.arc(0, 0, this.size, 0, Math.PI * 2);
            tdCtx.fill();
        }

        // --- วาดหลอดเลือด (เฉพาะบอส) ---
        if (this.isBoss) {
            const barWidth = 90;
            const barHeight = 10;
            tdCtx.fillStyle = '#000000';
            tdCtx.fillRect(-barWidth / 2, -this.size - 25, barWidth, barHeight);
            tdCtx.fillStyle = '#FF0055';
            tdCtx.fillRect(-barWidth / 2, -this.size - 25, (barWidth * (this.hp / this.maxHp)), barHeight);
            tdCtx.strokeStyle = '#FFFFFF';
            tdCtx.lineWidth = 1.5;
            tdCtx.strokeRect(-barWidth / 2, -this.size - 25, barWidth, barHeight);
        }
        tdCtx.restore();

        // --- วาดป้ายโจทย์คณิตศาสตร์ ---
        const textMargin = 10;
        tdCtx.font = 'bold 18px Quicksand, Arial';
        const displayQuestion = (this.penaltyTimer > 0) ? "!! SPEED 2x !!" : (this.isBoss ? `[HP:${this.hp}/10] ${this.question}` : this.question);
        const textWidth = tdCtx.measureText(displayQuestion).width;

        let boxY = this.y - (this.isBoss ? 85 : 65);
        if (boxY - 30 < 5) boxY = 5 + 30;

        tdCtx.fillStyle = (this.penaltyTimer > 0) ? '#FF477E' : (isTarget ? 'rgba(255, 209, 102, 0.95)' : 'rgba(255, 255, 255, 0.9)');
        drawRoundedRect(tdCtx, this.x - (textWidth / 2) - textMargin, boxY - 26, textWidth + (textMargin * 2), 28, 8);
        tdCtx.fill();
        if (isTarget || this.penaltyTimer > 0) {
            tdCtx.strokeStyle = '#FFFFFF'; tdCtx.lineWidth = 2; tdCtx.stroke();
        }

        tdCtx.fillStyle = (isTarget && this.penaltyTimer <= 0) ? '#2D3748' : (this.penaltyTimer > 0 ? '#FFFFFF' : '#4A5568');
        tdCtx.textAlign = 'center';
        tdCtx.fillText(displayQuestion, this.x, boxY - 6);
    }
}

function initMathTDGame() {
    tdCanvas = document.getElementById('tdCanvas');
    if (!tdCanvas) return;
    tdCtx = tdCanvas.getContext('2d');
    tdChoiceBtns = document.querySelectorAll('.td-choice-btn');
    tdQuestionDisplay = document.getElementById('td-target-question');
    tdUltBtn = document.getElementById('td-ultimate-btn');
    tdUltCountDisplay = document.getElementById('td-ult-count');

    if (tdUltBtn) {
        tdUltBtn.onclick = useTDUltimate;
    }

    tdHp = 10; tdScore = 0; tdWave = 1; tdTotalKillsInWave = 0; tdIsGameCleared = false;
    tdCoins = 0;
    tdUltimateCount = 1;
    tdMultiShotUnlocked = false; 
    tdAutoTurretUnlocked = false; 
    tdTotalAnswersCount = 0;
    tdSlowTimer = 0; tdFreezeTimer = 0;
    tdWrongCount = 0; tdShakeTimer = 0; tdEnemies = []; tdParticles = []; tdSlashes = []; tdSpawnTimer = 0;
    tdCurrentTarget = null; tdWaveNoticeTimer = 120; tdWaveNoticeText = "WAVE 1";

    tdBossWaveStage = 0;
    tdMinionsSpawnedCount = 0;

    const hpEl = document.getElementById('td-hp'); if (hpEl) hpEl.innerText = tdHp;
    const waveEl = document.getElementById('td-wave'); if (waveEl) waveEl.innerText = `${tdWave}/14`;
    const killsEl = document.getElementById('td-kills'); if (killsEl) killsEl.innerText = tdTotalKillsInWave;
    const scoreEl = document.getElementById('td-score'); if (scoreEl) scoreEl.innerText = tdScore;

    updateTDCoinsUI();
    updateTDUltUI();

    if (typeof checkDailyLimitStatus === 'function') {
        checkDailyLimitStatus();
    }

    if (tdAnimationRequestId) cancelAnimationFrame(tdAnimationRequestId);
    tdGameLoop();
}

function updateTDCoinsUI() {
    const coinEl = document.getElementById('td-coins');
    if (coinEl) coinEl.innerText = tdCoins;

    const bowBtn = document.getElementById('td-buy-bow-btn');
    const bowText = document.getElementById('td-buy-bow-text');
    if (bowBtn && bowText) {
        if (tdMultiShotUnlocked) {
            bowText.innerText = "MAX";
            bowBtn.classList.add("opacity-50");
        } else {
            bowText.innerText = "🪙 400";
            bowBtn.classList.remove("opacity-50");
        }
    }

    const turretBtn = document.getElementById('td-buy-turret-btn');
    const turretText = document.getElementById('td-buy-turret-text');
    if (turretBtn && turretText) {
        if (tdAutoTurretUnlocked) {
            turretText.innerText = "MAX";
            turretBtn.classList.add("opacity-50");
        } else {
            turretText.innerText = "🪙 400";
            turretBtn.classList.remove("opacity-50");
        }
    }
}

function buyTDFreeze() {
    if (tdCoins < 100) { alert("เหรียญไม่พอครับ! (ต้องใช้ 100 เหรียญ)"); return; }
    tdCoins -= 100;
    tdFreezeTimer = 300; 
    updateTDCoinsUI();
}

function buyTDHeart() {
    if (tdCoins < 200) { alert("เหรียญไม่พอครับ! (ต้องใช้ 200 เหรียญ)"); return; }
    tdCoins -= 200;
    tdHp += 3;
    const hpEl = document.getElementById('td-hp'); if (hpEl) hpEl.innerText = tdHp;
    updateTDCoinsUI();
}

function buyTDUltimate() {
    if (tdCoins < 300) { alert("เหรียญไม่พอครับ! (ต้องใช้ 300 เหรียญ)"); return; }
    tdCoins -= 300;
    tdUltimateCount += 1;
    updateTDUltUI();
    updateTDCoinsUI();
}

function buyTDUpgradeTower() {
    if (tdMultiShotUnlocked) { alert("หนูอัปเกรดธนูยิง 2 ตัวถาวรแล้วครับ!"); return; }
    if (tdCoins < 400) { alert("เหรียญไม่พอครับ! (ต้องใช้ 400 เหรียญ)"); return; }
    tdCoins -= 400;
    tdMultiShotUnlocked = true;
    updateTDCoinsUI();
    alert("🏹 อัปเกรดตัวเราสำเร็จ! ฮีโร่จะยิงโจมตีทีเดียว 2 หัวใจถาวรแล้วครับ!");
}

function buyTDAutoTurret() {
    if (tdAutoTurretUnlocked) { alert("คุณมีป้อมช่วยตีแล้วครับ!"); return; }
    if (tdCoins < 400) { alert("เหรียญไม่พอครับ! (ต้องใช้ 400 เหรียญ)"); return; }
    tdCoins -= 400;
    tdAutoTurretUnlocked = true;
    updateTDCoinsUI();
    alert("🏰 ซื้อป้อมช่วยตีสำเร็จ! ป้อมจะช่วยยิงมอนสเตอร์รองทุกๆ การเลือกตอบ 2 ครั้ง!");
}

function drawTDHero() {
    tdCtx.save();
    tdCtx.translate(tdHero.x, tdHero.y);

    let swordAngle = -Math.PI / 3;
    if (tdHero.slashAnim > 0) {
        swordAngle += Math.sin(tdHero.slashAnim) * 1.8;
        tdHero.slashAnim -= 0.15;
    }

    tdCtx.fillStyle = '#FF70A6';
    tdCtx.beginPath(); tdCtx.moveTo(0, -10); tdCtx.lineTo(25, -20); tdCtx.lineTo(20, 20); tdCtx.lineTo(0, 10); tdCtx.fill();

    tdCtx.fillStyle = '#E2E8F0';
    tdCtx.beginPath(); tdCtx.moveTo(-15, -15); tdCtx.lineTo(-5, -15); tdCtx.lineTo(-5, 15); tdCtx.lineTo(-10, 22); tdCtx.lineTo(-15, 15); tdCtx.closePath(); tdCtx.fill();
    tdCtx.strokeStyle = '#FFD166'; tdCtx.lineWidth = 2; tdCtx.stroke();

    tdCtx.fillStyle = '#4EA8DE';
    tdCtx.beginPath(); tdCtx.arc(0, 0, 18, 0, Math.PI * 2); tdCtx.fill();
    tdCtx.strokeStyle = '#FFFFFF'; tdCtx.lineWidth = 2; tdCtx.stroke();

    tdCtx.fillStyle = '#708090';
    tdCtx.beginPath(); tdCtx.arc(-2, -2, 14, 0, Math.PI * 2); tdCtx.fill();
    tdCtx.fillStyle = '#FFD166'; tdCtx.fillRect(-12, -5, 10, 4);

    tdCtx.fillStyle = '#FF70A6';
    tdCtx.beginPath(); tdCtx.moveTo(-2, -16); tdCtx.lineTo(8, -25); tdCtx.lineTo(12, -14); tdCtx.fill();

    tdCtx.save();
    tdCtx.rotate(swordAngle);
    tdCtx.shadowColor = '#4EA8DE'; tdCtx.shadowBlur = 10;

    tdCtx.fillStyle = '#FFFFFF';
    tdCtx.beginPath(); tdCtx.moveTo(0, -5); tdCtx.lineTo(40, -5); tdCtx.lineTo(48, 0); tdCtx.lineTo(40, 5); tdCtx.lineTo(0, 5); tdCtx.closePath(); tdCtx.fill();
    tdCtx.fillStyle = '#FFD166'; tdCtx.fillRect(-3, -10, 6, 20);
    tdCtx.fillStyle = '#708090'; tdCtx.fillRect(-10, -3, 8, 6);
    tdCtx.restore();

    tdCtx.restore();
}

function drawTDAutoTurret() {
    if (!tdAutoTurretUnlocked) return;
    tdCtx.save();
    tdCtx.translate(tdTurretPos.x, tdTurretPos.y);

    tdCtx.fillStyle = '#475569';
    tdCtx.beginPath(); tdCtx.arc(0, 0, 20, 0, Math.PI * 2); tdCtx.fill();
    tdCtx.strokeStyle = '#94A3B8'; tdCtx.lineWidth = 3; tdCtx.stroke();

    tdCtx.fillStyle = '#38BDF8';
    tdCtx.beginPath(); tdCtx.arc(0, 0, 12, 0, Math.PI * 2); tdCtx.fill();
    
    tdCtx.fillStyle = '#0F172A';
    tdCtx.fillRect(-4, -18, 8, 10);

    tdCtx.restore();
}

function createTDExplosion(x, y, count = 15, color = '#FF70A6') {
    for (let i = 0; i < count; i++) {
        tdParticles.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * 12, vy: (Math.random() - 0.5) * 12,
            life: 1.0, color: color
        });
    }
}

function createTDSlashWave(startX, startY, targetX, targetY) {
    tdSlashes.push({ x1: startX, y1: startY, x2: targetX, y2: targetY, life: 1.0 });
}

function checkGameEndState() {
    const targetKills = getTargetKillsForWave(tdWave);
    if (tdWave >= 14) {
        if (tdBossWaveStage === 3 && tdEnemies.length === 0) {
            if (tdHp > 0) {
                setTimeout(() => { 
                    tdIsGameCleared = true; 
                }, 100);
            }
        }
    } else {
        if (tdTotalKillsInWave >= targetKills) {
            nextTDWave();
        }
    }
}

function useTDUltimate() {
    if (tdUltimateCount <= 0) {
        alert("จำนวนระเบิดหมดแล้ว! สามารถซื้อเพิ่มได้ในร้านค้าครับ");
        return;
    }

    if (tdEnemies.length === 0 || tdIsGameCleared || tdHp <= 0) return;

    tdUltimateCount--;
    updateTDUltUI();
    tdShakeTimer = 20;

    createTDExplosion(tdHero.x, tdHero.y, 40, '#FFD166');
    const coinReward = getCoinRewardForWave(tdWave);

    for (let i = tdEnemies.length - 1; i >= 0; i--) {
        const enemy = tdEnemies[i];
        createTDExplosion(enemy.x, enemy.y, 25, '#FF70A6');

        if (enemy.isBoss) {
            enemy.hp -= 1; 
            
            if (enemy.hp <= 0) {
                enemy.dead = true;
                tdEnemies.splice(i, 1);
                tdScore += 200;
                tdCoins += 100;
                tdTotalKillsInWave += 1;
            } else {
                enemy.resetQuestion();
            }
        } else {
            enemy.dead = true;
            tdEnemies.splice(i, 1);
            tdScore += 10;
            tdCoins += coinReward;
            tdTotalKillsInWave += 1;
        }
    }

    tdCurrentTarget = null;

    const scoreEl = document.getElementById('td-score'); if (scoreEl) scoreEl.innerText = tdScore;
    const killsEl = document.getElementById('td-kills'); if (killsEl) killsEl.innerText = tdTotalKillsInWave;
    updateTDCoinsUI();

    checkGameEndState();
}

function updateTDUltUI() {
    if (tdUltCountDisplay) tdUltCountDisplay.innerText = tdUltimateCount;
    if (tdUltBtn) {
        const isDisabled = tdUltimateCount <= 0;
        tdUltBtn.disabled = isDisabled;

        if (isDisabled) {
            tdUltBtn.classList.add("opacity-50", "cursor-not-allowed");
        } else {
            tdUltBtn.classList.remove("opacity-50", "cursor-not-allowed");
        }
    }
}

function updateTDTargetAndChoices() {
    if (tdEnemies.length === 0) {
        tdCurrentTarget = null;
        if (tdQuestionDisplay) tdQuestionDisplay.innerText = tdIsGameCleared ? "ชนะแล้ว!" : (tdHp <= 0 ? "จบเกมแล้ว" : "รอศัตรู...");
        if (tdChoiceBtns) tdChoiceBtns.forEach(btn => btn.innerText = "-");
        return;
    }

    const isCurrentTargetAlive = tdCurrentTarget && tdEnemies.some(e => e.id === tdCurrentTarget.id && !e.dead);
    if (!isCurrentTargetAlive) {
        const sortedEnemies = [...tdEnemies].sort((a, b) => b.progress - a.progress);
        tdCurrentTarget = sortedEnemies[0];
        if (tdQuestionDisplay) tdQuestionDisplay.innerText = `เป้าหมาย: ${tdCurrentTarget.question} = ?`;
        generateTDChoices(tdCurrentTarget.answer);
    }
}

function generateTDChoices(correctAnswer) {
    const choices = new Set();
    choices.add(correctAnswer);

    while (choices.size < 3) {
        const offset = (Math.floor(Math.random() * 5) + 1) * (Math.random() < 0.5 ? 1 : -1);
        const wrongAnswer = correctAnswer + offset;
        if (wrongAnswer >= 0) choices.add(wrongAnswer);
    }

    tdCurrentChoices = Array.from(choices).sort(() => Math.random() - 0.5);
    if (tdChoiceBtns) {
        tdChoiceBtns.forEach((btn, index) => {
            btn.innerText = tdCurrentChoices[index];
            btn.style.backgroundColor = '#38bdf8';
        });
    }
}

function selectTDChoice(index) {
    if (!tdCurrentTarget || tdIsGameCleared || tdHp <= 0) return;

    const selectedValue = tdCurrentChoices[index];
    const targetEnemy = tdCurrentTarget;

    tdTotalAnswersCount++;

    if (selectedValue === targetEnemy.answer) {
        tdHero.slashAnim = Math.PI;

        createTDSlashWave(tdHero.x, tdHero.y, targetEnemy.x, targetEnemy.y);
        createTDExplosion(targetEnemy.x, targetEnemy.y);

        let damage = tdMultiShotUnlocked ? 2 : 1; 
        targetEnemy.hp -= damage;

        if (targetEnemy.hp <= 0) {
            targetEnemy.dead = true;
            tdEnemies = tdEnemies.filter(e => e.id !== targetEnemy.id);
            tdTotalKillsInWave += 1;
            tdScore += targetEnemy.isBoss ? 200 : 10;
            tdCoins += targetEnemy.isBoss ? 100 : getCoinRewardForWave(tdWave);
        } else {
            targetEnemy.resetQuestion();
        }

        if (tdMultiShotUnlocked && tdEnemies.length > 0 && !targetEnemy.isBoss) {
            const sortedEnemies = [...tdEnemies].sort((a, b) => b.progress - a.progress);
            const secondTarget = sortedEnemies.find(e => e.id !== targetEnemy.id);
            if (secondTarget) {
                createTDSlashWave(tdHero.x, tdHero.y, secondTarget.x, secondTarget.y);
                createTDExplosion(secondTarget.x, secondTarget.y);
                
                secondTarget.hp -= 1;
                if (secondTarget.hp <= 0) {
                    secondTarget.dead = true;
                    tdEnemies = tdEnemies.filter(e => e.id !== secondTarget.id);
                    tdTotalKillsInWave += 1;
                    tdScore += 10;
                    tdCoins += getCoinRewardForWave(tdWave);
                } else {
                    secondTarget.resetQuestion();
                }
            }
        }

        const scoreEl = document.getElementById('td-score'); if (scoreEl) scoreEl.innerText = tdScore;
        const killsEl = document.getElementById('td-kills'); if (killsEl) killsEl.innerText = tdTotalKillsInWave;
        updateTDCoinsUI();

        tdCurrentTarget = null;
        checkGameEndState();

    } else {
        if (tdCurrentTarget) tdCurrentTarget.penaltyTimer = 35;
        tdShakeTimer = 15;
        tdWrongCount++;
        if (tdWrongCount % 3 === 0 && tdHp > 0) {
            tdHp--;
            const hpEl = document.getElementById('td-hp'); if (hpEl) hpEl.innerText = tdHp;
        }

        if (tdChoiceBtns && tdChoiceBtns[index]) {
            tdChoiceBtns[index].style.backgroundColor = '#f43f5e';
            setTimeout(() => {
                if (tdChoiceBtns[index]) tdChoiceBtns[index].style.backgroundColor = '#38bdf8';
            }, 300);
        }
    }

    if (tdAutoTurretUnlocked && tdTotalAnswersCount % 2 === 0 && tdEnemies.length > 0) {
        const sortedEnemies = [...tdEnemies].sort((a, b) => b.progress - a.progress);
        
        let turretTarget = (sortedEnemies.length > 1) ? sortedEnemies[1] : sortedEnemies[0];

        if (turretTarget) {
            createTDSlashWave(tdTurretPos.x, tdTurretPos.y, turretTarget.x, turretTarget.y);
            createTDExplosion(turretTarget.x, turretTarget.y, 15, '#38BDF8');
            
            turretTarget.hp -= 1;
            
            if (turretTarget.hp <= 0) {
                turretTarget.dead = true;
                tdEnemies = tdEnemies.filter(e => e.id !== turretTarget.id);
                tdTotalKillsInWave += 1;
                tdScore += turretTarget.isBoss ? 200 : 10;
                tdCoins += turretTarget.isBoss ? 100 : getCoinRewardForWave(tdWave);
            } else {
                turretTarget.resetQuestion();
            }

            const scoreEl = document.getElementById('td-score'); if (scoreEl) scoreEl.innerText = tdScore;
            const killsEl = document.getElementById('td-kills'); if (killsEl) killsEl.innerText = tdTotalKillsInWave;
            updateTDCoinsUI();

            checkGameEndState();
        }
    }
}

function nextTDWave() {
    tdWave++; 
    tdTotalKillsInWave = 0; 

    if (tdWave === 14) {
        tdBossWaveStage = 0;
        tdMinionsSpawnedCount = 0;
        tdWaveNoticeText = "🔥 FINAL BOSS WAVE! 🔥";
    } else {
        tdWaveNoticeText = `WAVE ${tdWave} CLEAR!`;
    }

    const waveEl = document.getElementById('td-wave'); if (waveEl) waveEl.innerText = `${tdWave}/14`;
    const killsEl = document.getElementById('td-kills'); if (killsEl) killsEl.innerText = tdTotalKillsInWave;
    const hpEl = document.getElementById('td-hp'); if (hpEl) hpEl.innerText = tdHp;

    tdWaveNoticeTimer = 120;
}

function drawTDPath() {
    tdCtx.beginPath();
    tdCtx.moveTo(tdPath[0].x, tdPath[0].y);
    for (let i = 1; i < tdPath.length; i++) tdCtx.lineTo(tdPath[i].x, tdPath[i].y);
    tdCtx.strokeStyle = '#E2E8F0';
    tdCtx.lineWidth = 32;
    tdCtx.lineCap = 'round';
    tdCtx.lineJoin = 'round';
    tdCtx.stroke();
}

function triggerTDCompletionModal(finalScore) {
    let starsEarned = 0;
    if (tdDifficulty === 'easy') {
        if (tdIsGameCleared || finalScore >= 500) starsEarned = 1;
    } else {
        if (finalScore >= 1000) starsEarned = 3;
        else if (finalScore >= 800) starsEarned = 2;
        else if (finalScore >= 500) starsEarned = 1;
    }

    if (starsEarned > 0) {
        if (typeof totalStars !== 'undefined') totalStars += starsEarned;
        if (typeof saveUserStars === 'function') saveUserStars();
        if (typeof addEXPToUser === 'function') addEXPToUser(starsEarned * 50);
        if (typeof incrementTodayRounds === 'function') incrementTodayRounds();

        const countEl = document.getElementById("summary-total-count"); if (countEl) countEl.innerText = `${finalScore} คะแนน (Math TD - ${tdDifficulty.toUpperCase()})`;
        const starsEl = document.getElementById("summary-stars-earned"); if (starsEl) { starsEl.innerText = `⭐ ${starsEarned} ดวง`; starsEl.className = "text-sm text-amber-500 font-bold"; }
        const expEl = document.getElementById("summary-exp-earned"); if (expEl) expEl.innerText = `+${starsEarned * 50} EXP ✨`;
        const modal = document.getElementById("completion-modal"); if (modal) modal.classList.remove("hidden");
    }
}

function tdGameLoop() {
    if (!tdCtx) return;
    tdCtx.clearRect(0, 0, tdCanvas.width, tdCanvas.height);

    if (tdSlowTimer > 0) tdSlowTimer--;
    if (tdFreezeTimer > 0) tdFreezeTimer--;

    tdCtx.save();
    if (tdShakeTimer > 0) {
        const shakeX = (Math.random() - 0.5) * 14;
        const shakeY = (Math.random() - 0.5) * 14;
        tdCtx.translate(shakeX, shakeY);
        tdShakeTimer--;
    }

    drawTDPath();
    drawTDHero();
    drawTDAutoTurret();

    if (!tdIsGameCleared && tdHp > 0) {
        if (tdWave >= 14) { 
            tdSpawnTimer++;
            if (tdSpawnTimer > 90) {
                if (tdBossWaveStage === 0) {
                    tdEnemies.push(new TDEnemy(false));
                    tdMinionsSpawnedCount++;
                    if (tdMinionsSpawnedCount >= 5) {
                        tdBossWaveStage = 1;
                    }
                    tdSpawnTimer = 0;
                } 
                else if (tdBossWaveStage === 1) {
                    tdEnemies.push(new TDEnemy(true)); 
                    tdBossWaveStage = 2;
                    tdSpawnTimer = 0;
                } 
                else if (tdBossWaveStage === 2) {
                    tdEnemies.push(new TDEnemy(false));
                    tdBossWaveStage = 3;
                    tdSpawnTimer = 0;
                }
            }
        } else {
            const baseInterval = (tdDifficulty === 'easy') ? 220 : 180;
            const spawnRate = Math.max(baseInterval - (tdWave - 1) * 12, 80);
            tdSpawnTimer++;
            if (tdSpawnTimer > spawnRate) {
                tdEnemies.push(new TDEnemy(false));
                tdSpawnTimer = 0;
            }
        }
    }

    for (let i = 0; i < tdEnemies.length; i++) {
        const aheadEnemy = tdEnemies[i - 1] || null;
        tdEnemies[i].update(aheadEnemy);
    }

    for (let i = tdEnemies.length - 1; i >= 0; i--) {
        if (tdEnemies[i].dead) {
            if (tdCurrentTarget && tdCurrentTarget.id === tdEnemies[i].id) tdCurrentTarget = null;
            tdEnemies.splice(i, 1);
        }
    }

    updateTDTargetAndChoices();

    tdEnemies.forEach(enemy => {
        const isTarget = tdCurrentTarget && enemy.id === tdCurrentTarget.id;
        enemy.draw(isTarget);
    });

    for (let i = tdSlashes.length - 1; i >= 0; i--) {
        const s = tdSlashes[i];
        tdCtx.beginPath(); tdCtx.moveTo(s.x1, s.y1); tdCtx.lineTo(s.x2, s.y2);
        tdCtx.strokeStyle = `rgba(78, 168, 222, ${s.life})`;
        tdCtx.lineWidth = 8 * s.life;
        tdCtx.stroke();
        s.life -= 0.15;
        if (s.life <= 0) tdSlashes.splice(i, 1);
    }

    for (let i = tdParticles.length - 1; i >= 0; i--) {
        const p = tdParticles[i];
        p.x += p.vx; p.vy += p.vy; p.life -= 0.05;
        tdCtx.fillStyle = p.color;
        tdCtx.globalAlpha = Math.max(0, p.life);
        tdCtx.fillRect(p.x, p.y, 5, 5);
        tdCtx.globalAlpha = 1.0;
        if (p.life <= 0) tdParticles.splice(i, 1);
    }

    if (tdWaveNoticeTimer > 0 && !tdIsGameCleared && tdHp > 0) {
        tdCtx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        tdCtx.fillRect(0, 150, tdCanvas.width, 80);
        tdCtx.fillStyle = '#FF70A6';
        tdCtx.font = 'bold 36px Quicksand, Arial';
        tdCtx.textAlign = 'center';
        tdCtx.fillText(tdWaveNoticeText, tdCanvas.width / 2, 202);
        tdWaveNoticeTimer--;
    }

    tdCtx.restore();

    if (tdIsGameCleared && tdEnemies.length === 0) {
        tdCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        tdCtx.fillRect(0, 0, tdCanvas.width, tdCanvas.height);
        tdCtx.fillStyle = '#FF70A6';
        tdCtx.font = 'bold 44px Quicksand, Arial';
        tdCtx.textAlign = 'center';
        tdCtx.fillText('🏆 VICTORY! 🏆', tdCanvas.width / 2, tdCanvas.height / 2 - 20);
        tdCtx.fillStyle = '#4A5568';
        tdCtx.font = '20px Quicksand, Arial';
        tdCtx.fillText('คุณคือปรมาจารย์คณิตศาสตร์!', tdCanvas.width / 2, tdCanvas.height / 2 + 20);
        tdCtx.fillText(`Final Score: ${tdScore}`, tdCanvas.width / 2, tdCanvas.height / 2 + 55);

        if (tdAnimationRequestId) cancelAnimationFrame(tdAnimationRequestId);
        triggerTDCompletionModal(tdScore);
        return;
    }

    if (tdHp > 0) {
        tdAnimationRequestId = requestAnimationFrame(tdGameLoop);
    } else {
        tdCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        tdCtx.fillRect(0, 0, tdCanvas.width, tdCanvas.height);
        tdCtx.fillStyle = '#FF477E';
        tdCtx.font = 'bold 40px Quicksand, Arial';
        tdCtx.textAlign = 'center';
        tdCtx.fillText('GAME OVER', tdCanvas.width / 2, tdCanvas.height / 2 - 20);
        tdCtx.fillStyle = '#4A5568';
        tdCtx.font = '20px Quicksand, Arial';
        tdCtx.fillText(`Wave Reached: ${tdWave}/14`, tdCanvas.width / 2, tdCanvas.height / 2 + 20);
        tdCtx.fillText(`Final Score: ${tdScore}`, tdCanvas.width / 2, tdCanvas.height / 2 + 50);

        if (tdAnimationRequestId) cancelAnimationFrame(tdAnimationRequestId);
        triggerTDCompletionModal(tdScore);
    }
}
