// ==========================================
// --- MATH COMBINATION GAME VARIABLES ---
// ==========================================
let mathDifficulty = 'easy'; let mathQuestionIndex = 1; let mathInitialNumbers = []; let mathCurrentNumbers = []; let mathTargetNumber = 0; let mathSelectedNum1Idx = null; let mathSelectedOp = null; let mathSelectedNum2Idx = null;

function setMathDifficulty(diff) {
    mathDifficulty = diff;
    const easyBtn = document.getElementById("math-diff-easy"), medBtn = document.getElementById("math-diff-medium"), hardBtn = document.getElementById("math-diff-hard"), diffTag = document.getElementById("math-diff-tag");
    const activeClass = "flex-1 py-1 rounded-xl text-[11px] font-black text-white shadow-xs transition ", inactiveClass = "flex-1 py-1 rounded-xl text-[11px] font-black text-slate-600 hover:bg-slate-200 transition";
    easyBtn.className = inactiveClass; medBtn.className = inactiveClass; hardBtn.className = inactiveClass;

    if (diff === 'easy') { easyBtn.className = activeClass + "bg-emerald-500"; diffTag.innerText = "บวกลบ (4 ตัว)"; diffTag.className = "text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full font-kids"; } 
    else if (diff === 'medium') { medBtn.className = activeClass + "bg-indigo-500"; diffTag.innerText = "บวกลบคูณหาร (4 ตัว)"; diffTag.className = "text-[10px] font-bold text-indigo-800 bg-indigo-100 px-2.5 py-0.5 rounded-full font-kids"; } 
    else { hardBtn.className = activeClass + "bg-rose-500"; diffTag.innerText = "บวกลบคูณหาร (5 ตัว)"; diffTag.className = "text-[10px] font-bold text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-full font-kids"; }
    mathQuestionIndex = 1; generateMathPuzzle();
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
    resetMathSelection(); renderMathBoard();
}

function renderMathBoard() {
    document.getElementById("math-target-number").innerText = mathTargetNumber;
    document.getElementById("math-progress-text").innerText = `ข้อที่: ${mathQuestionIndex} / 5`;
    document.getElementById("math-numbers-left-tag").innerText = `เหลือ ${mathCurrentNumbers.length} ตัว`;

    const mulBtn = document.getElementById("math-op-mul"), divBtn = document.getElementById("math-op-div");
    if (mathDifficulty === 'easy') { mulBtn.classList.add("hidden"); divBtn.classList.add("hidden"); } else { mulBtn.classList.remove("hidden"); divBtn.classList.remove("hidden"); }

    const container = document.getElementById("math-numbers-container");
    container.innerHTML = "";
    mathCurrentNumbers.forEach((num, index) => {
        const btn = document.createElement("button");
        btn.className = `w-11 h-11 rounded-full font-bold text-base text-white shadow-xs flex items-center justify-center bubble-btn font-kids `;
        if (mathSelectedNum1Idx === index || mathSelectedNum2Idx === index) btn.className += "bg-indigo-600 ring-2 ring-indigo-300 scale-105";
        else btn.className += "bg-indigo-500 hover:bg-indigo-600";
        btn.innerText = num; btn.onclick = () => selectMathNumber(index);
        container.appendChild(btn);
    });
    updateMathFormulaDisplay();
}

function selectMathNumber(index) {
    if (mathSelectedNum1Idx === null) mathSelectedNum1Idx = index;
    else if (mathSelectedNum1Idx === index) { mathSelectedNum1Idx = null; mathSelectedOp = null; mathSelectedNum2Idx = null; } 
    else if (mathSelectedOp === null) mathSelectedNum1Idx = index;
    else if (mathSelectedNum2Idx === index) mathSelectedNum2Idx = null;
    else mathSelectedNum2Idx = index;
    renderMathBoard();
}

function selectMathOperator(op) {
    if (mathSelectedNum1Idx === null) { alert("กรุณาแตะเลือกตัวเลขแรกก่อนครับ!"); return; }
    mathSelectedOp = op; renderMathBoard();
}

function updateMathFormulaDisplay() {
    const formulaEl = document.getElementById("math-formula-text");
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
function resetCurrentMathQuestion() { mathCurrentNumbers = [...mathInitialNumbers]; resetMathSelection(); renderMathBoard(); }
function skipMathQuestion() { if (confirm("ต้องการข้ามข้อนี้ใช่หรือไม่?")) generateMathPuzzle(); }

function triggerMathCompletionModal() {
    totalStars += 1; saveUserStars(); addEXPToUser(100); incrementTodayRounds(); mathQuestionIndex = 1;
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
