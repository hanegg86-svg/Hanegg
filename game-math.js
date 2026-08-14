// ==========================================
// --- MATH COMBINATION GAME VARIABLES ---
// ==========================================
let mathDifficulty = 'easy'; 
let mathQuestionIndex = 1; 
let mathInitialNumbers = []; 
let mathCurrentNumbers = []; 
let mathTargetNumber = 0; 
let mathSelectedNum1Idx = null; 
let mathSelectedOp = null; 
let mathSelectedNum2Idx = null;

// --- Variable สำหรับ Bomb Mode & Quota ---
let isBombActive = false; 
let mathBombQuota = 2; // จำกัดการใช้ระเบิด 2 ครั้งต่อเกม (5 ข้อ)

function setMathDifficulty(diff) {
    mathDifficulty = diff;
    const easyBtn = document.getElementById("math-diff-easy"), medBtn = document.getElementById("math-diff-medium"), hardBtn = document.getElementById("math-diff-hard"), diffTag = document.getElementById("math-diff-tag");
    
    // --- เปลี่ยนสไตล์ปุ่มเป็น 3D มาริโอ้ ---
    const activeClass = "flex-1 py-1.5 rounded-xl text-[11px] font-black text-white shadow-[0_4px_0_0_rgba(0,0,0,0.2)] border-2 transition-all active:translate-y-1 active:shadow-none ";
    const inactiveClass = "flex-1 py-1.5 rounded-xl text-[11px] font-black bg-white text-slate-700 hover:bg-slate-50 shadow-[0_4px_0_0_#cbd5e1] border-2 border-slate-300 transition-all active:translate-y-1 active:shadow-none ";

    easyBtn.className = inactiveClass; medBtn.className = inactiveClass; hardBtn.className = inactiveClass;

    if (diff === 'easy') { easyBtn.className = activeClass + "bg-emerald-500 border-emerald-700"; diffTag.innerText = "บวกลบ (4 ตัว)"; diffTag.className = "text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full font-kids border border-emerald-200"; } 
    else if (diff === 'medium') { medBtn.className = activeClass + "bg-indigo-500 border-indigo-700"; diffTag.innerText = "บวกลบคูณหาร (4 ตัว)"; diffTag.className = "text-[10px] font-bold text-indigo-800 bg-indigo-100 px-2.5 py-0.5 rounded-full font-kids border border-indigo-200"; } 
    else { hardBtn.className = activeClass + "bg-rose-500 border-rose-700"; diffTag.innerText = "บวกลบคูณหาร (5 ตัว)"; diffTag.className = "text-[10px] font-bold text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-full font-kids border border-rose-200"; }
    mathQuestionIndex = 1; 
    mathBombQuota = 2; // รีเซ็ตโควต้าระเบิดเมื่อเปลี่ยนระดับความยาก
    generateMathPuzzle();
}

function generateMathPuzzle() {
    let count = mathDifficulty === 'hard' ? 5 : 4, allowMulDiv = mathDifficulty !== 'easy';
    let nums = [];
    for (let i = 0; i < count; i++) { nums.push(Math.floor(Math.random() * 9) + 1); }
    let tempNums = [...nums], ops = allowMulDiv ? ['+', '-', '*', '/'] : ['+', '-'];
    while (tempNums.length > 1) {
        let num1 = tempNums.splice(Math.floor(Math.random() * tempNums.length), 1)[0];
        let num2 = tempNums.splice(Math.floor(Math.random() * tempNums.length), 1)[0];
        let op = ops[Math.floor(Math.random() * ops.length)], res = 0;
        if (op === '+') res = num1 + num2; else if (op === '-') res = Math.abs(num1 - num2); else if (op === '*') res = num1 * num2; else if (op === '/') { if (num2 !== 0 && num1 % num2 === 0) res = num1 / num2; else res = num1 + num2; }
        tempNums.push(res);
    }
    mathTargetNumber = tempNums[0];
    if (mathTargetNumber <= 0 || mathTargetNumber > 100) { generateMathPuzzle(); return; }
    mathInitialNumbers = [...nums]; mathCurrentNumbers = [...nums];
    isBombActive = false;
    
    // รีเซ็ตโควต้าระเบิดเป็น 2 ครั้ง ถ้าเป็นข้อแรกของเกม
    if (mathQuestionIndex === 1) {
        mathBombQuota = 2;
    }

    resetMathSelection(); renderMathBoard();
}

function renderMathBoard() {
    document.getElementById("math-target-number").innerText = mathTargetNumber;
    document.getElementById("math-progress-text").innerText = `ข้อที่: ${mathQuestionIndex} / 5`;
    document.getElementById("math-numbers-left-tag").innerText = `เหลือ ${mathCurrentNumbers.length} ตัว`;

    // อัปเดตข้อความจำนวนระเบิดที่เหลือบนปุ่ม
    const bombBtnText = document.getElementById("math-bomb-btn-text");
    if (bombBtnText) {
        bombBtnText.innerText = `💣 ระเบิด (${mathBombQuota})`;
    }

    const mulBtn = document.getElementById("math-op-mul"), divBtn = document.getElementById("math-op-div");
    if (mathDifficulty === 'easy') { mulBtn.classList.add("hidden"); divBtn.classList.add("hidden"); } else { mulBtn.classList.remove("hidden"); divBtn.classList.remove("hidden"); }

    const container = document.getElementById("math-numbers-container");
    container.innerHTML = "";
    mathCurrentNumbers.forEach((num, index) => {
        const btn = document.createElement("button");
        
        // --- เปลี่ยนบล็อกตัวเลขให้เป็น 3D กดได้ ---
        btn.className = `w-12 h-12 rounded-2xl font-black text-lg text-white shadow-[0_4px_0_0_rgba(0,0,0,0.2)] border-2 flex items-center justify-center transition-all active:translate-y-1 active:shadow-none font-kids transform `;
        
        if (isBombActive) {
            btn.className += "bg-rose-500 border-rose-700 hover:bg-rose-600 animate-pulse scale-105";
        } else if (mathSelectedNum1Idx === index || mathSelectedNum2Idx === index) {
            btn.className += "bg-pink-500 border-pink-700 scale-105"; // สีพีชตอนโดนเลือก
        } else {
            btn.className += "bg-indigo-500 border-indigo-700 hover:bg-indigo-600";
        }
        
        btn.innerText = num; 
        btn.onclick = () => selectMathNumber(index);
        container.appendChild(btn);
    });
    updateMathFormulaDisplay();
}

function selectMathNumber(index) {
    if (isBombActive) {
        useBombOnNumber(index);
        return;
    }

    if (mathSelectedNum1Idx === null) mathSelectedNum1Idx = index;
    else if (mathSelectedNum1Idx === index) { mathSelectedNum1Idx = null; mathSelectedOp = null; mathSelectedNum2Idx = null; } 
    else if (mathSelectedOp === null) mathSelectedNum1Idx = index;
    else if (mathSelectedNum2Idx === index) mathSelectedNum2Idx = null;
    else mathSelectedNum2Idx = index;
    renderMathBoard();
}

function toggleBombMode() {
    if (mathBombQuota <= 0) {
        alert("⚠️ หนูใช้สิทธิ์ตัวช่วยระเบิดครบ 2 ครั้งของรอบนี้แล้วครับ!");
        return;
    }
    if (mathCurrentNumbers.length <= 1) {
        alert("⚠️ ไม่สามารถระเบิดได้แล้วครับ ต้องเหลือตัวเลขอย่างน้อย 1 ตัว!");
        return;
    }
    isBombActive = !isBombActive;
    resetMathSelection();
    renderMathBoard();
}

function useBombOnNumber(index) {
    if (mathBombQuota <= 0) return;

    const removedNum = mathCurrentNumbers[index];
    mathCurrentNumbers.splice(index, 1);
    mathBombQuota--; // หักโควต้าระเบิดออก 1 ครั้ง
    isBombActive = false;
    resetMathSelection();
    renderMathBoard();
    
    alert(`💥 ระเบิดตัวเลข ${removedNum} เรียบร้อย! (เหลือระเบิดอีก ${mathBombQuota} ครั้ง)`);
    checkMathWinCondition();
}

function selectMathOperator(op) {
    if (isBombActive) isBombActive = false;
    if (mathSelectedNum1Idx === null) { alert("กรุณาแตะเลือกตัวเลขแรกก่อนครับ!"); return; }
    mathSelectedOp = op; renderMathBoard();
}

function updateMathFormulaDisplay() {
    const formulaEl = document.getElementById("math-formula-text");
    if (isBombActive) {
        formulaEl.innerText = "💣 แตะเลือกตัวเลขที่ต้องการระเบิดทิ้ง!";
        formulaEl.className = "text-rose-600 font-bold text-sm animate-pulse font-kids";
        return;
    }

    let num1Str = mathSelectedNum1Idx !== null ? mathCurrentNumbers[mathSelectedNum1Idx] : "";
    let opStr = mathSelectedOp !== null ? mathSelectedOp : "";
    let num2Str = mathSelectedNum2Idx !== null ? mathCurrentNumbers[mathSelectedNum2Idx] : "";
    if (!num1Str) { formulaEl.innerText = "แตะตัวเลขและเครื่องหมายเพื่อผสม"; formulaEl.className = "text-slate-400 font-bold text-xs"; } 
    else { formulaEl.innerText = `${num1Str} ${opStr} ${num2Str}`.trim(); formulaEl.className = "text-indigo-950 font-bold text-2xl tracking-wider font-kids"; }
}

function executeMathCombination() {
    if (!isParentUser && isDailyLimitEnabled && todayPlayedRounds >= dailyLimitRounds) { alert(`🛑 หนูเล่นครบโควต้ารวม ${dailyLimitRounds} รอบประจำวันแล้วนะ พักสายตาก่อนแล้วมาเล่นใหม่พรุ่งนี้นะครับ!`); return; }
    if (mathSelectedNum1Idx === null || mathSelectedOp === null || mathSelectedNum2Idx === null) { alert("กรุณาเลือก [ตัวเลขที่ 1] [เครื่องหมาย] และ [ตัวเลขที่ 2] ให้ครบก่อนผสมครับ!"); return; }

    let n1 = mathCurrentNumbers[mathSelectedNum1Idx], n2 = mathCurrentNumbers[mathSelectedNum2Idx], result = 0;
    if (mathSelectedOp === '+') result = n1 + n2; else if (mathSelectedOp === '-') result = Math.abs(n1 - n2); else if (mathSelectedOp === '×') result = n1 * n2; else if (mathSelectedOp === '÷') { if (n2 === 0 || n1 % n2 !== 0) { alert("หารไม่ลงตัวหรือไม่สามารถหารด้วย 0 ได้ครับ!"); return; } result = n1 / n2; }

    let firstIdx = Math.max(mathSelectedNum1Idx, mathSelectedNum2Idx), secondIdx = Math.min(mathSelectedNum1Idx, mathSelectedNum2Idx);
    mathCurrentNumbers.splice(firstIdx, 1); mathCurrentNumbers.splice(secondIdx, 1); mathCurrentNumbers.push(result);
    resetMathSelection(); renderMathBoard(); checkMathWinCondition();
}

function checkMathWinCondition() {
    if (mathCurrentNumbers[0] === mathTargetNumber) {
        if (mathCurrentNumbers.length === 1) {
            setTimeout(() => {
                alert("🎉 ถูกต้องแล้วเก่งมากครับ! ใช้ตัวเลขครบทุกตัวและผสมได้เป้าหมายพอดี!");
                if (mathQuestionIndex >= 5) triggerMathCompletionModal(); else { mathQuestionIndex++; generateMathPuzzle(); }
            }, 150);
        } else { setTimeout(() => { alert(`💡 ได้ผลลัพธ์เท่ากับ ${mathTargetNumber} แล้วก็จริง... แต่ยังเหลือตัวเลขอีก ${mathCurrentNumbers.length - 1} ตัว!\n\nกติกาบังคับให้ต้องใช้ตัวเลข "ครบทุกตัว" ถึงจะผ่านนะครับ ลองผสมต่อดูนะ!`); }, 100); }
    }
}

function resetMathSelection() { mathSelectedNum1Idx = null; mathSelectedOp = null; mathSelectedNum2Idx = null; }
function resetCurrentMathQuestion() { isBombActive = false; mathCurrentNumbers = [...mathInitialNumbers]; resetMathSelection(); renderMathBoard(); }
function skipMathQuestion() { if (confirm("ต้องการข้ามข้อนี้ใช่หรือไม่?")) generateMathPuzzle(); }

function triggerMathCompletionModal() {
    totalStars += 1; saveUserStars(); addEXPToUser(100); incrementTodayRounds(); 
    mathQuestionIndex = 1; 
    mathBombQuota = 2; // รีเซ็ตโควต้าระเบิดหลังจบเกม
    document.getElementById("summary-total-count").innerText = "5 / 5 ข้อ";
    document.getElementById("summary-stars-earned").innerText = "⭐ 1 ดวง";
    document.getElementById("summary-stars-earned").className = "text-sm text-amber-500 font-bold";
    document.getElementById("summary-exp-earned").innerText = "+100 EXP ✨";
    document.getElementById("summary-saved-badge").innerText = "✅ บันทึกดาวสะสมและแจ้งเตือนคุณพ่อคุณแม่เรียบร้อย!";
    document.getElementById("summary-saved-badge").className = "bg-emerald-50 text-emerald-800 text-xs font-bold p-2.5 rounded-xl border border-emerald-200";
    document.getElementById("completion-subtitle").innerText = `🎉 เล่นเกมคิดเลขผสมคำตอบถูกครบ 5 ข้อแล้ว!`;
    document.getElementById("completion-modal").classList.remove("hidden");
    sendInAppNotification('COMPLETED_MATH', { diff: mathDifficulty, score: 5 });
}
