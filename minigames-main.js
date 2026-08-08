// ==========================================
// --- MINI GAMES SWITCHER ---
// ==========================================
function switchMiniGame(subGame) {
    currentMiniGame = subGame;

    const btnVocab = document.getElementById("game-subtab-vocab");
    const btnMath = document.getElementById("game-subtab-math");
    const btnStory = document.getElementById("game-subtab-story");
    const btnTd = document.getElementById("game-subtab-td");

    const vocabContainer = document.getElementById("game-vocab-container");
    const mathContainer = document.getElementById("game-math-container");
    const storyContainer = document.getElementById("game-story-container");
    const tdContainer = document.getElementById("game-td-container");

    const langSwitchBox = document.getElementById("lang-switch-box");

    const activeClass = "flex-1 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-xs transition";
    const inactiveClass = "flex-1 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition";

    [btnVocab, btnMath, btnStory, btnTd].forEach(b => { if (b) b.className = inactiveClass; });
    [vocabContainer, mathContainer, storyContainer, tdContainer].forEach(c => {
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
    }
    checkDailyLimitStatus();
}

function restartSession() {
    document.getElementById("completion-modal").classList.add("hidden");
    if (currentMiniGame === 'math') { mathQuestionIndex = 1; generateMathPuzzle(); } 
    else if (currentMiniGame === 'story') { openStoryCreator(); } 
    else if (currentMiniGame === 'td') { initMathTDGame(); } 
    else { setCorrectAnswers = 0; shuffleArray(filteredVocabList); currentIndex = 0; updateCard(); }
}
