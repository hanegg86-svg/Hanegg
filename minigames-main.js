// ==========================================
// --- MINI GAMES SWITCHER ---
// ==========================================
function switchMiniGame(subGame) {
    currentMiniGame = subGame;

    const btnVocab = document.getElementById("game-subtab-vocab");
    const btnMath = document.getElementById("game-subtab-math");
    const btnStory = document.getElementById("game-subtab-story");
    const btnTd = document.getElementById("game-subtab-td");
    const btnDungeon = document.getElementById("game-subtab-dungeon"); // [เพิ่มปุ่มใหม่]

    const vocabContainer = document.getElementById("game-vocab-container");
    const mathContainer = document.getElementById("game-math-container");
    const storyContainer = document.getElementById("game-story-container");
    const tdContainer = document.getElementById("game-td-container");
    const dungeonContainer = document.getElementById("game-dungeon-container"); // [เพิ่ม Container ใหม่]

    const langSwitchBox = document.getElementById("lang-switch-box");

    const activeClass = "flex-1 py-1.5 px-2 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-xs transition whitespace-nowrap";
    const inactiveClass = "flex-1 py-1.5 px-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition whitespace-nowrap";

    [btnVocab, btnMath, btnStory, btnTd, btnDungeon].forEach(b => { if (b) b.className = inactiveClass; });
    [vocabContainer, mathContainer, storyContainer, tdContainer, dungeonContainer].forEach(c => {
        if (c) { c.classList.add("hidden"); c.classList.remove("flex"); }
    });

    langSwitchBox.classList.add("hidden");

    if (subGame === 'vocab') {
        if (btnVocab) btnVocab.className = activeClass;
        vocabContainer.classList.remove("hidden"); vocabContainer.classList.add("flex");
        langSwitchBox.classList.remove("hidden");
    } else if (subGame === 'math') {
        if (btnMath) btnMath.className = activeClass;
        mathContainer.classList.remove("hidden"); mathContainer.classList.add("flex");
        generateMathPuzzle();
    } else if (subGame === 'story') {
        if (btnStory) btnStory.className = activeClass;
        storyContainer.classList.remove("hidden"); storyContainer.classList.add("flex");
        initStoryTabState();
    } else if (subGame === 'td') {
        if (btnTd) btnTd.className = activeClass;
        tdContainer.classList.remove("hidden"); tdContainer.classList.add("flex");
        initMathTDGame();
    } else if (subGame === 'dungeon') { // [เงื่อนไขสลับสวิตช์เกมใหม่]
        if (btnDungeon) btnDungeon.className = activeClass;
        dungeonContainer.classList.remove("hidden"); dungeonContainer.classList.add("flex");
        initNumberDungeon();
    }
    checkDailyLimitStatus();
}

function restartSession() {
    document.getElementById("completion-modal").classList.add("hidden");
    if (currentMiniGame === 'math') { mathQuestionIndex = 1; generateMathPuzzle(); } 
    else if (currentMiniGame === 'story') { openStoryCreator(); } 
    else if (currentMiniGame === 'td') { initMathTDGame(); } 
    else if (currentMiniGame === 'dungeon') { initNumberDungeon(); } // [เพิ่มการ Restart ของเกมดันเจี้ยน]
    else { setCorrectAnswers = 0; shuffleArray(filteredVocabList); currentIndex = 0; updateCard(); }
}
