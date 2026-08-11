// ==========================================
// --- MINI GAMES SWITCHER ---
// ==========================================
function switchMiniGame(subGame) {
    currentMiniGame = subGame;

    const btnVocab = document.getElementById("game-subtab-vocab");
    const btnMath = document.getElementById("game-subtab-math");
    const btnStory = document.getElementById("game-subtab-story");
    const btnTd = document.getElementById("game-subtab-td");
    const btnDungeon = document.getElementById("game-subtab-dungeon");

    const vocabContainer = document.getElementById("game-vocab-container");
    const mathContainer = document.getElementById("game-math-container");
    const storyContainer = document.getElementById("game-story-container");
    const tdContainer = document.getElementById("game-td-container");
    const dungeonContainer = document.getElementById("game-dungeon-container");

    const langSwitchBox = document.getElementById("lang-switch-box");

    const activeClass = "flex-1 py-1.5 px-2 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-xs transition whitespace-nowrap";
    const inactiveClass = "flex-1 py-1.5 px-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition whitespace-nowrap";

    [btnVocab, btnMath, btnStory, btnTd, btnDungeon].forEach(b => { if (b) b.className = inactiveClass; });
    [vocabContainer, mathContainer, storyContainer, tdContainer, dungeonContainer].forEach(c => {
        if (c) { c.classList.add("hidden"); c.classList.remove("flex"); }
    });

    if (langSwitchBox) langSwitchBox.classList.add("hidden");

    if (subGame === 'vocab') {
        if (btnVocab) btnVocab.className = activeClass;
        if (vocabContainer) { vocabContainer.classList.remove("hidden"); vocabContainer.classList.add("flex"); }
        if (langSwitchBox) langSwitchBox.classList.remove("hidden");
    } else if (subGame === 'math') {
        if (btnMath) btnMath.className = activeClass;
        if (mathContainer) { mathContainer.classList.remove("hidden"); mathContainer.classList.add("flex"); }
        if (typeof generateMathPuzzle === "function") generateMathPuzzle();
    } else if (subGame === 'story') {
        if (btnStory) btnStory.className = activeClass;
        if (storyContainer) { storyContainer.classList.remove("hidden"); storyContainer.classList.add("flex"); }
        if (typeof initStoryTabState === "function") initStoryTabState();
    } else if (subGame === 'td') {
        if (btnTd) btnTd.className = activeClass;
        if (tdContainer) { tdContainer.classList.remove("hidden"); tdContainer.classList.add("flex"); }
        if (typeof initMathTDGame === "function") initMathTDGame();
    } else if (subGame === 'dungeon') {
        if (btnDungeon) btnDungeon.className = activeClass;
        if (dungeonContainer) { dungeonContainer.classList.remove("hidden"); dungeonContainer.classList.add("flex"); }
        if (typeof initNumberDungeon === "function") initNumberDungeon();
    }
    if (typeof checkDailyLimitStatus === "function") checkDailyLimitStatus();
}

function restartSession() {
    const modal = document.getElementById("completion-modal");
    if (modal) modal.classList.add("hidden");

    if (currentMiniGame === 'math') { 
        if (typeof mathQuestionIndex !== "undefined") mathQuestionIndex = 1; 
        if (typeof generateMathPuzzle === "function") generateMathPuzzle(); 
    } 
    else if (currentMiniGame === 'story') { 
        if (typeof openStoryCreator === "function") openStoryCreator(); 
    } 
    else if (currentMiniGame === 'td') { 
        if (typeof initMathTDGame === "function") initMathTDGame(); 
    } 
    else if (currentMiniGame === 'dungeon') { 
        if (typeof initNumberDungeon === "function") initNumberDungeon(); 
    } 
    else { 
        if (typeof setCorrectAnswers !== "undefined") setCorrectAnswers = 0; 
        if (typeof filteredVocabList !== "undefined" && typeof shuffleArray === "function") shuffleArray(filteredVocabList); 
        if (typeof currentIndex !== "undefined") currentIndex = 0; 
        if (typeof updateCard === "function") updateCard(); 
    }
}
