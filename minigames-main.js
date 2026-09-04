// ==========================================
// --- MINI GAMES SWITCHER ---
// ==========================================
function switchMiniGame(subGame) {
    if (subGame !== 'build' && typeof stopTownBuilderGame === 'function') {
        stopTownBuilderGame();
    }
    if (subGame !== 'vocab' && typeof stopVocabCamera === 'function') {
        stopVocabCamera();
    }
    if (subGame !== 'plant' && typeof stopPlantCamera === 'function') {
        stopPlantCamera();
    }

    currentMiniGame = subGame;

    const btnVocab = document.getElementById("game-subtab-vocab");
    const btnMath = document.getElementById("game-subtab-math");
    const btnStory = document.getElementById("game-subtab-story");
    const btnTd = document.getElementById("game-subtab-td");
    const btnDungeon = document.getElementById("game-subtab-dungeon");
    const btnBuild = document.getElementById("game-subtab-build");
    const btnPlant = document.getElementById("game-subtab-plant");
    const btnPet = document.getElementById("game-subtab-pet");

    const vocabContainer = document.getElementById("game-vocab-container");
    const mathContainer = document.getElementById("game-math-container");
    const storyContainer = document.getElementById("game-story-container");
    const tdContainer = document.getElementById("game-td-container");
    const dungeonContainer = document.getElementById("game-dungeon-container");
    const buildContainer = document.getElementById("game-build-container");
    const plantContainer = document.getElementById("game-plant-container");
    const petContainer = document.getElementById("game-pet-container");

    const langSwitchBox = document.getElementById("lang-switch-box");

    const activeClass = "flex-1 py-2 px-3 rounded-2xl text-xs font-black bg-pink-500 text-white shadow-[0_4px_0_0_#be185d] border-2 border-pink-700 transition-all active:translate-y-1 active:shadow-none whitespace-nowrap";
    const inactiveClass = "flex-1 py-2 px-3 rounded-2xl text-xs font-black bg-white text-slate-700 hover:bg-slate-50 shadow-[0_4px_0_0_#cbd5e1] border-2 border-slate-300 transition-all active:translate-y-1 active:shadow-none whitespace-nowrap";

    [btnVocab, btnMath, btnStory, btnTd, btnDungeon, btnBuild, btnPlant, btnPet].forEach(b => { if (b) b.className = inactiveClass; });
    [vocabContainer, mathContainer, storyContainer, tdContainer, dungeonContainer, buildContainer, plantContainer, petContainer].forEach(c => {
        if (c) { c.classList.add("hidden"); c.classList.remove("flex"); }
    });

    if (langSwitchBox) langSwitchBox.classList.add("hidden");

    if (subGame === 'vocab') {
        if (btnVocab) btnVocab.className = activeClass;
        if (vocabContainer) { vocabContainer.classList.remove("hidden"); vocabContainer.classList.add("flex"); }
        if (langSwitchBox) langSwitchBox.classList.remove("hidden");
        if (typeof vocabSubMode !== "undefined" && vocabSubMode === 'photo' && typeof startVocabCamera === "function") {
            startVocabCamera();
        }
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
    } else if (subGame === 'build') {
        if (btnBuild) btnBuild.className = activeClass;
        if (buildContainer) { buildContainer.classList.remove("hidden"); buildContainer.classList.add("flex"); }
        if (typeof initTownBuilderGame === "function") initTownBuilderGame();
    } else if (subGame === 'plant') {
        if (btnPlant) btnPlant.className = activeClass;
        if (plantContainer) { plantContainer.classList.remove("hidden"); plantContainer.classList.add("flex"); }
        if (typeof renderPlantLibrary === "function") renderPlantLibrary();
        if (typeof initPlantGame === "function") initPlantGame();
    } else if (subGame === 'pet') {
        if (btnPet) btnPet.className = activeClass;
        if (petContainer) { petContainer.classList.remove("hidden"); petContainer.classList.add("flex"); }
        if (typeof initPetGame === "function") initPetGame();
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
    else if (currentMiniGame === 'build') {
        if (typeof initTownBuilderGame === "function") initTownBuilderGame();
    }
    else if (currentMiniGame === 'plant') {
        if (typeof renderPlantLibrary === "function") renderPlantLibrary();
        if (typeof initPlantGame === "function") initPlantGame();
    }
    else if (currentMiniGame === 'pet') {
        if (typeof initPetGame === "function") initPetGame();
    }
    else { 
        if (typeof vocabSubMode !== "undefined" && vocabSubMode === 'photo') {
            photoCorrectCount = 0;
            if (typeof updateCard === "function") updateCard();
        } else {
            if (typeof setCorrectAnswers !== "undefined") setCorrectAnswers = 0; 
            if (typeof filteredVocabList !== "undefined" && typeof shuffleArray === "function") shuffleArray(filteredVocabList); 
            if (typeof currentIndex !== "undefined") currentIndex = 0; 
            if (typeof updateCard === "function") updateCard(); 
        }
    }
}
