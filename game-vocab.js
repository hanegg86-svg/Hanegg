// ==========================================
// --- VOCAB & SPELLING & MATCHING GAME ---
// ==========================================

let vocabSubMode = 'cards'; // 'cards' | 'spell' | 'match'
let matchCardsList = [];
let selectedMatchCards = [];
let matchedPairsCount = 0;

let tempOcrBase64 = null;
let ocrExtractedList = [];

function switchVocabPlayMode(mode) {
    vocabSubMode = mode;
    const cardsBtn = document.getElementById("vocab-mode-cards");
    const spellBtn = document.getElementById("vocab-mode-spell");
    const matchBtn = document.getElementById("vocab-mode-match");

    const flashcardSec = document.getElementById("flashcard-section");
    const spellingSec = document.getElementById("spelling-section");
    const matchingSec = document.getElementById("matching-section");

    const activeClass = "flex-1 py-1.5 rounded-xl text-xs font-black bg-white border-2 border-indigo-200 text-indigo-900 shadow-[0_3px_0_0_#c7d2fe] transition-all active:translate-y-1 active:shadow-none";
    const inactiveClass = "flex-1 py-1.5 rounded-xl text-xs font-black text-indigo-700 hover:bg-white/50 border-2 border-transparent transition-all";

    [cardsBtn, spellBtn, matchBtn].forEach(btn => { if (btn) btn.className = inactiveClass; });

    if (mode === 'cards') {
        if (cardsBtn) cardsBtn.className = activeClass;
        if (flashcardSec) flashcardSec.classList.remove("hidden");
        if (spellingSec) spellingSec.classList.add("hidden");
        if (matchingSec) matchingSec.classList.add("hidden");
    } else if (mode === 'spell') {
        if (spellBtn) spellBtn.className = activeClass;
        if (flashcardSec) flashcardSec.classList.add("hidden");
        if (spellingSec) spellingSec.classList.remove("hidden");
        if (matchingSec) matchingSec.classList.add("hidden");
    } else if (mode === 'match') {
        if (matchBtn) matchBtn.className = activeClass;
        if (flashcardSec) flashcardSec.classList.add("hidden");
        if (spellingSec) spellingSec.classList.add("hidden");
        if (matchingSec) matchingSec.classList.remove("hidden");
        startMatchingGame();
    }
}

function switchSubjectMode(mode) {
    subjectMode = mode;
    const enBtn = document.getElementById("mode-en-btn");
    const thBtn = document.getElementById("mode-th-btn");

    if (mode === 'EN') {
        enBtn.className = "px-2.5 py-1 rounded-xl text-xs font-black bg-white text-indigo-900 shadow transition";
        thBtn.className = "px-2.5 py-1 rounded-xl text-xs font-black text-white hover:bg-white/20 transition";
    } else {
        thBtn.className = "px-2.5 py-1 rounded-xl text-xs font-black bg-white text-indigo-900 shadow transition";
        enBtn.className = "px-2.5 py-1 rounded-xl text-xs font-black text-white hover:bg-white/20 transition";
    }

    currentIndex = 0; setCorrectAnswers = 0;
    if (isFirebaseActive) { initFirebase(); } 
    else {
        const localData = localStorage.getItem(`kids_vocab_${subjectMode.toLowerCase()}_data`);
        rawVocabList = localData ? JSON.parse(localData) : (mode === 'EN' ? [...defaultVocabEN] : [...defaultVocabTH]);
        filterVocabForUser(); 
        updateCard();
        if (vocabSubMode === 'match') startMatchingGame();
    }
}

function filterVocabForUser() {
    if (isParentUser || !currentUser) {
        filteredVocabList = [...rawVocabList];
    } else {
        filteredVocabList = rawVocabList.filter(item => {
            if (!item.assignees || item.assignees.length === 0) return true;
            return item.assignees.includes(currentUser);
        });
    }
    shuffleArray(filteredVocabList);
}

function saveToStorage() { 
    if (isFirebaseActive) {
        const { set } = window.firebaseModules;
        const currentDbRef = subjectMode === 'EN' ? dbRefVocabEN : dbRefVocabTH;
        if (currentDbRef) set(currentDbRef, rawVocabList);
    } else {
        localStorage.setItem(`kids_vocab_${subjectMode.toLowerCase()}_data`, JSON.stringify(rawVocabList)); 
    }
}

function renderSpelledLetters(word) {
    if (!word) return '';
    return word.split('').map(char => {
        if (char === ' ') return '<span class="letter-space"></span>';
        return `<span class="letter-box">${char.toUpperCase()}</span>`;
    }).join('');
}

function renderBlankLetters(word) {
    if (!word) return '';
    return word.split('').map(char => {
        if (char === ' ') return '<span class="letter-space"></span>';
        return `<span class="blank-box"></span>`;
    }).join('');
}

function updateCard() {
    if (!filteredVocabList || filteredVocabList.length === 0) {
        document.getElementById("card-word-main").innerHTML = "ไม่มีคำศัพท์";
        document.getElementById("card-word-sub").innerText = "กรุณาเพิ่มคำศัพท์ใหม่";
        return;
    }
    if (currentIndex >= filteredVocabList.length) currentIndex = 0;
    const item = filteredVocabList[currentIndex];
    isFlipped = false;
    document.getElementById("card-inner").classList.remove("card-flipped");

    const emojiEl = document.getElementById("card-emoji");
    const imgEl = document.getElementById("card-img");
    const emojiBackEl = document.getElementById("card-emoji-back");
    const imgBackEl = document.getElementById("card-img-back");

    if (item.image) {
        [emojiEl, emojiBackEl].forEach(el => el.classList.add("hidden"));
        [imgEl, imgBackEl].forEach(el => { el.classList.remove("hidden"); el.src = item.image; });
    } else {
        [imgEl, imgBackEl].forEach(el => el.classList.add("hidden"));
        [emojiEl, emojiBackEl].forEach(el => { el.classList.remove("hidden"); el.innerText = item.emoji || "💡"; });
    }

    if (subjectMode === 'EN') {
        document.getElementById("card-word-main").innerHTML = renderSpelledLetters(item.en);
        document.getElementById("card-word-sub").innerText = item.th;
        document.getElementById("card-phonetic").innerText = `[ ${item.phonetic || item.th} ]`;
    } else {
        document.getElementById("card-word-main").innerHTML = renderSpelledLetters(item.th);
        document.getElementById("card-word-sub").innerText = item.en !== item.th ? item.en : "คำภาษาไทย";
        document.getElementById("card-phonetic").innerText = `[ ${item.phonetic || item.th} ]`;
    }

    const spellEmoji = document.getElementById("spell-card-emoji");
    const spellImg = document.getElementById("spell-card-img");
    if (item.image) {
        spellEmoji.classList.add("hidden"); spellImg.classList.remove("hidden"); spellImg.src = item.image;
    } else {
        spellImg.classList.add("hidden"); spellEmoji.classList.remove("hidden"); spellEmoji.innerText = item.emoji || "💡";
    }

    if (subjectMode === 'EN') {
        document.getElementById("spell-card-title").innerText = item.th;
        document.getElementById("spell-card-subtitle").innerHTML = renderBlankLetters(item.en);
        document.getElementById("spell-input").placeholder = "พิมพ์คำศัพท์ภาษาอังกฤษ...";
    } else {
        document.getElementById("spell-card-title").innerText = item.en;
        document.getElementById("spell-card-subtitle").innerHTML = renderBlankLetters(item.th);
        document.getElementById("spell-input").placeholder = "พิมพ์คำภาษาไทย...";
    }

    const posInSet = (currentIndex % 5) + 1;
    const currentSetNum = Math.floor(currentIndex / 5) + 1;
    document.getElementById("set-progress-text").innerText = `ชุดที่ ${currentSetNum} (คำที่ ${posInSet}/5)`;
    document.getElementById("spell-input").value = "";
    document.getElementById("speech-status").innerText = "";
    checkDailyLimitStatus();
}

function checkSpellingAnswer() {
    if (filteredVocabList.length === 0) return;
    if (!isParentUser && isDailyLimitEnabled && todayPlayedRounds >= dailyLimitRounds) {
        alert(`🛑 หนูเล่นครบโควต้ารวม ${dailyLimitRounds} รอบประจำวันแล้วนะ พักสายตาก่อนแล้วมาเล่นใหม่พรุ่งนี้นะครับ!`); return;
    }

    const inputVal = document.getElementById("spell-input").value.trim().toLowerCase();
    const currentItem = filteredVocabList[currentIndex];
    const targetVal = (subjectMode === 'EN' ? currentItem.en : currentItem.th).trim().toLowerCase();
    if (!inputVal) { alert("กรุณาพิมพ์สะกดคำก่อนนะครับ!"); return; }

    const cleanedInput = inputVal.replace(/[\s\-]/g, '');
    const cleanedTarget = targetVal.replace(/[\s\-]/g, '');

    if (cleanedInput === cleanedTarget) {
        alert(`🎉 ถูกต้องแล้วครับเก่งมาก! ${currentItem.en} = ${currentItem.th}`);
        setCorrectAnswers += 1;
        const isEndOfSet = ((currentIndex + 1) % 5 === 0) || (currentIndex === filteredVocabList.length - 1);
        if (isEndOfSet) {
            if (setCorrectAnswers >= 5 || setCorrectAnswers === (filteredVocabList.length % 5)) { triggerCompletionModal(); } 
            else { alert(`จบชุดแล้ว! ท่องถูกไป ${setCorrectAnswers}/5 คำ (พยายามอีกนิดเพื่อเก็บ 1 ดาวนะครับ)`); setCorrectAnswers = 0; nextCard(); }
        } else { nextCard(); }
    } else { alert(`❌ ยังไม่ถูกต้อง ลองใหม่อีกครั้งนะครับ!`); }
}

// ------------------------------------------
// --- MATCHING GAME LOGIC (ปรับเป็น 8 คู่) ---
// ------------------------------------------
function startMatchingGame() {
    if (!filteredVocabList || filteredVocabList.length < 2) {
        const container = document.getElementById("match-cards-container");
        if (container) container.innerHTML = `<div class="col-span-2 text-center text-slate-400 py-10 font-bold">ต้องมีคำศัพท์อย่างน้อย 2 คำเพื่อเล่นเกมจับคู่ครับ</div>`;
        return;
    }

    selectedMatchCards = [];
    matchedPairsCount = 0;

    const targetPairsCount = Math.min(8, filteredVocabList.length);
    const shuffledList = [...filteredVocabList];
    shuffleArray(shuffledList);
    const selectedVocab = shuffledList.slice(0, targetPairsCount);

    matchCardsList = [];
    selectedVocab.forEach((item, idx) => {
        matchCardsList.push({
            id: `en-${idx}`, pairId: idx, type: 'EN', text: item.en,
            emoji: item.emoji, image: item.image, spokenText: item.en, lang: 'en-US'
        });
        matchCardsList.push({
            id: `th-${idx}`, pairId: idx, type: 'TH', text: item.th,
            emoji: item.emoji, image: item.image, spokenText: item.th, lang: 'th-TH'
        });
    });

    shuffleArray(matchCardsList);
    renderMatchingCards();
    updateMatchProgress();
}

function renderMatchingCards() {
    const container = document.getElementById("match-cards-container");
    if (!container) return;

    container.innerHTML = matchCardsList.map(card => {
        let contentHtml = '';
        if (card.type === 'EN') {
            if (card.image) {
                contentHtml = `<img src="${card.image}" class="w-10 h-10 object-cover rounded-xl mb-1 pointer-events-none"><span class="font-extrabold text-indigo-900 text-sm font-kids pointer-events-none">${card.text}</span>`;
            } else {
                contentHtml = `<span class="text-2xl mb-0.5 pointer-events-none">${card.emoji || '💡'}</span><span class="font-extrabold text-indigo-900 text-sm font-kids pointer-events-none">${card.text}</span>`;
            }
        } else {
            contentHtml = `<span class="font-extrabold text-purple-900 text-base font-kids pointer-events-none">${card.text}</span>`;
        }

        return `
            <button id="match-btn-${card.id}" onclick="handleMatchCardClick('${card.id}')" class="match-card bg-white border-2 border-slate-300 rounded-2xl p-3 flex flex-col items-center justify-center min-h-[85px] shadow-[0_4px_0_0_#cbd5e1] hover:border-indigo-400 active:translate-y-1 active:shadow-none transition-all text-center">
                ${contentHtml}
            </button>
        `;
    }).join('');
}

function handleMatchCardClick(cardId) {
    if (!isParentUser && isDailyLimitEnabled && todayPlayedRounds >= dailyLimitRounds) {
        alert(`🛑 หนูเล่นครบโควต้ารวม ${dailyLimitRounds} รอบประจำวันแล้วนะ พักสายตาก่อนแล้วมาเล่นใหม่พรุ่งนี้นะครับ!`);
        return;
    }

    const card = matchCardsList.find(c => c.id === cardId);
    if (!card) return;

    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(card.spokenText);
        utterance.lang = card.lang; utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    }

    if (selectedMatchCards.length === 1 && selectedMatchCards[0].id === cardId) {
        selectedMatchCards = [];
        const btn = document.getElementById(`match-btn-${cardId}`);
        if (btn) btn.classList.remove("selected");
        return;
    }

    selectedMatchCards.push(card);
    const btn = document.getElementById(`match-btn-${cardId}`);
    if (btn) btn.classList.add("selected");

    if (selectedMatchCards.length === 2) {
        const [card1, card2] = selectedMatchCards;

        if (card1.pairId === card2.pairId && card1.type !== card2.type) {
            matchedPairsCount++;
            updateMatchProgress();

            setTimeout(() => {
                const btn1 = document.getElementById(`match-btn-${card1.id}`);
                const btn2 = document.getElementById(`match-btn-${card2.id}`);
                if (btn1) btn1.classList.add("matched");
                if (btn2) btn2.classList.add("matched");
                selectedMatchCards = [];

                const totalPairs = Math.min(8, Math.floor(matchCardsList.length / 2));
                if (matchedPairsCount >= totalPairs) {
                    setTimeout(() => { triggerCompletionModal(); }, 500);
                }
            }, 300);

        } else {
            setTimeout(() => {
                const btn1 = document.getElementById(`match-btn-${card1.id}`);
                const btn2 = document.getElementById(`match-btn-${card2.id}`);
                if (btn1) btn1.classList.remove("selected");
                if (btn2) btn2.classList.remove("selected");
                selectedMatchCards = [];
            }, 600);
        }
    }
}

function updateMatchProgress() {
    const totalPairs = Math.min(8, Math.floor(matchCardsList.length / 2));
    const remaining = totalPairs - matchedPairsCount;
    const progressText = document.getElementById("match-progress-text");
    if (progressText) {
        progressText.innerText = `จับคู่คำศัพท์ (เหลือ ${remaining} คู่ จากทั้งหมด ${totalPairs} คู่)`;
    }
}

function flipCard() { if (filteredVocabList.length === 0) return; isFlipped = !isFlipped; document.getElementById("card-inner").classList.toggle("card-flipped", isFlipped); }
function nextCard() { if (filteredVocabList.length === 0) return; currentIndex = (currentIndex + 1) % filteredVocabList.length; updateCard(); }
function prevCard() { if (filteredVocabList.length === 0) return; currentIndex = (currentIndex - 1 + filteredVocabList.length) % filteredVocabList.length; updateCard(); }
function addStar() { if (filteredVocabList.length === 0) return; nextCard(); }

function speakCurrentWord() {
    if (filteredVocabList.length === 0) return;
    const item = filteredVocabList[currentIndex];
    let rawText = isFlipped ? item.th : item.en;
    let lang = isFlipped ? 'th-TH' : 'en-US';
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(rawText);
        utterance.lang = lang; utterance.rate = 0.85;
        window.speechSynthesis.speak(utterance);
    }
}

function speakCurrentWordPrompt() {
    if (!filteredVocabList || filteredVocabList.length === 0) return;
    const item = filteredVocabList[currentIndex];
    let rawText = subjectMode === 'EN' ? item.en : item.th;
    let lang = subjectMode === 'EN' ? 'en-US' : 'th-TH';
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(rawText);
        utterance.lang = lang; utterance.rate = 0.85; utterance.pitch = 1.1;
        window.speechSynthesis.speak(utterance);
    } else { alert("เบราว์เซอร์นี้ยังไม่รองรับระบบอ่านออกเสียงครับ"); }
}

function triggerCompletionModal() {
    totalStars += 1;
    saveUserStars();
    addEXPToUser(100);
    incrementTodayRounds();
    document.getElementById("summary-total-count").innerText = "สำเร็จแล้ว!";
    document.getElementById("summary-stars-earned").innerText = "⭐ 1 ดวง";
    document.getElementById("summary-stars-earned").className = "text-sm text-amber-500 font-bold";
    document.getElementById("summary-exp-earned").innerText = "+100 EXP ✨";
    document.getElementById("summary-saved-badge").innerText = "✅ บันทึกดาวสะสมและแจ้งเตือนคุณพ่อคุณแม่เรียบร้อย!";
    document.getElementById("summary-saved-badge").className = "bg-emerald-50 text-emerald-800 text-xs font-bold p-2.5 rounded-xl border border-emerald-200";
    document.getElementById("completion-subtitle").innerText = `🎉 น้อง${currentUser || 'เด็กๆ'} เก่งมาก เล่นสำเร็จแล้ว!`;
    document.getElementById("completion-modal").classList.remove("hidden");

    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(`เก่งมากเลยครับ ${currentUser || ''} รับไปเลย 1 ดาว และ 100 EXP`);
        utterance.lang = 'th-TH'; window.speechSynthesis.speak(utterance);
    }
    sendInAppNotification('COMPLETED_SET', { setNum: Math.floor(currentIndex / 5) + 1 });
}

function openAddModal() {
    if (!isParentUser) return;
    document.getElementById("modal-title").innerText = `เพิ่มคำศัพท์ใหม่ (${subjectMode}) 📝`;
    document.getElementById("edit-index").value = "-1";
    document.getElementById("vocab-form").reset();
    document.getElementById("assign-poon").checked = true;
    document.getElementById("assign-ploern").checked = true;
    document.getElementById("input-img").value = ""; 
    document.getElementById("img-preview-container").classList.add("hidden");
    currentResizedBase64 = null;
    document.getElementById("add-modal").classList.remove("hidden");
}

function editCurrentCard() {
    if (!isParentUser || filteredVocabList.length === 0) return;
    const item = filteredVocabList[currentIndex];
    const rawIndex = rawVocabList.findIndex(x => x === item || (x.en === item.en && x.th === item.th));
    if (rawIndex === -1) return;
    document.getElementById("modal-title").innerText = "แก้ไขคำศัพท์ ✏️";
    document.getElementById("edit-index").value = rawIndex;
    document.getElementById("input-en").value = item.en;
    document.getElementById("input-th").value = item.th;
    document.getElementById("input-phonetic").value = item.phonetic || item.th;
    document.getElementById("input-img").value = ""; 
    const assignees = item.assignees || ["พูน", "เพลิน"];
    document.getElementById("assign-poon").checked = assignees.includes("พูน");
    document.getElementById("assign-ploern").checked = assignees.includes("เพลิน");

    if (item.image) {
        currentResizedBase64 = item.image;
        document.getElementById("img-preview").src = item.image;
        document.getElementById("img-preview-container").classList.remove("hidden");
        document.getElementById("img-size-info").innerText = "รูปภาพเดิม";
    } else {
        currentResizedBase64 = null;
        document.getElementById("img-preview-container").classList.add("hidden");
    }
    document.getElementById("add-modal").classList.remove("hidden");
}

function deleteCurrentCard() {
    if (!isParentUser || filteredVocabList.length === 0) return;
    const item = filteredVocabList[currentIndex];
    const rawIndex = rawVocabList.findIndex(x => x === item || (x.en === item.en && x.th === item.th));
    if (rawIndex === -1) return;

    if (confirm(`คุณต้องการลบคำศัพท์ "${item.en}" (${item.th}) ใช่หรือไม่?`)) {
        rawVocabList.splice(rawIndex, 1);
        saveToStorage(); filterVocabForUser();
        if (currentIndex >= filteredVocabList.length) currentIndex = Math.max(0, filteredVocabList.length - 1);
        updateCard();
        if (vocabSubMode === 'match') startMatchingGame();
    }
}

function closeModal() {
    document.getElementById("add-modal").classList.add("hidden");
    document.getElementById("vocab-form").reset();
    document.getElementById("input-img").value = ""; 
    document.getElementById("img-preview-container").classList.add("hidden");
    currentResizedBase64 = null;
    const btn = document.getElementById("ai-btn");
    btn.disabled = false; btn.innerHTML = `<i data-lucide="sparkles" class="w-3 h-3"></i> แปล Gemini ✨`; btn.classList.remove('opacity-70');
    lucide.createIcons();
}

function handleFormSubmit(e) {
    e.preventDefault();
    if (!isParentUser) return;
    const editIndex = parseInt(document.getElementById("edit-index").value, 10);
    const en = document.getElementById("input-en").value.trim();
    const th = document.getElementById("input-th").value.trim();
    const phonetic = document.getElementById("input-phonetic").value.trim() || th;
    const assignees = [];
    if (document.getElementById("assign-poon").checked) assignees.push("พูน");
    if (document.getElementById("assign-ploern").checked) assignees.push("เพลิน");

    if (!en || !th) return;
    const vocabItem = { en, th, phonetic, emoji: "✨", image: currentResizedBase64, assignees: assignees };
    if (editIndex >= 0 && editIndex < rawVocabList.length) rawVocabList[editIndex] = vocabItem;
    else rawVocabList.push(vocabItem);

    saveToStorage(); filterVocabForUser(); closeModal();
    currentIndex = filteredVocabList.findIndex(x => x.en === en && x.th === th);
    if (currentIndex === -1) currentIndex = 0;
    updateCard();
    if (vocabSubMode === 'match') startMatchingGame();
}

// ==========================================
// --- AI INTEGRATION (GEMINI 3.5 FLASH LITE) ---
// ==========================================

async function askGeminiAI() {
    const enInput = document.getElementById("input-en").value.trim();
    const thInput = document.getElementById("input-th").value.trim();
    const apiKey = localStorage.getItem("gemini_api_key");
    if (!apiKey) { alert("กรุณาแจ้งพ่อนะหรือแม่พัดให้ช่วยตั้งค่า Gemini API Key ก่อนครับ"); return; }

    let prompt = "";
    if (subjectMode === 'EN') {
        if (!enInput) { alert("กรุณาใส่คำศัพท์ภาษาอังกฤษก่อนครับ"); return; }
        prompt = `แปลคำศัพท์ภาษาอังกฤษสำหรับเด็ก คำว่า "${enInput}" เป็นภาษาไทย และขอ "คำอ่านทับศัพท์เสียงอ่านภาษาอังกฤษเป็นภาษาไทย" ตอบกลับเป็น JSON รูปแบบนี้เท่านั้น: {"th": "คำแปลไทย", "phonetic": "คำอ่านทับศัพท์ไทย"}`;
    } else {
        if (!thInput) { alert("กรุณาใส่คำศัพท์ภาษาไทยก่อนครับ"); return; }
        prompt = `แปลคำศัพท์ภาษาไทยสำหรับเด็ก คำว่า "${thInput}" เป็นภาษาอังกฤษ และขอ "คำอ่านภาษาไทยแบบเว้นวรรคให้อ่านง่ายสำหรับเด็ก" ตอบกลับเป็น JSON รูปแบบนี้เท่านั้น: {"en": "English Word", "phonetic": "คำ-อ่าน-ไทย"}`;
    }

    const btn = document.getElementById("ai-btn");
    btn.disabled = true; btn.innerHTML = `<span class="spinner"></span> Gemini กำลังสร้าง...`; btn.classList.add('opacity-70');
    
    // ⚡ ENDPOINT MODEL: Gemini 3.5 Flash Lite
    const textUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(textUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.1 } }) });
        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        const result = JSON.parse(data.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim());
        if (subjectMode === 'EN') {
            if (result.th) document.getElementById("input-th").value = result.th;
            if (result.phonetic) document.getElementById("input-phonetic").value = result.phonetic;
        } else {
            if (result.en) document.getElementById("input-en").value = result.en;
            if (result.phonetic) document.getElementById("input-phonetic").value = result.phonetic;
        }
    } catch (error) { alert("เกิดข้อผิดพลาดในการเชื่อมต่อ AI: " + (error.message || "กรุณาตรวจสอบ API Key")); } 
    finally { btn.disabled = false; btn.innerHTML = `<i data-lucide="sparkles" class="w-3 h-3"></i> แปล Gemini ✨`; btn.classList.remove('opacity-70'); lucide.createIcons(); }
}

function openGeminiForImage() {
    const targetWord = document.getElementById("input-en").value.trim() || document.getElementById("input-th").value.trim();
    if (!targetWord) { alert("กรุณาพิมพ์คำศัพท์ก่อนครับ"); return; }
    
    // 🍄 IMAGE PROMPT: ธีม Super Mario World สำหรับเด็ก
    const imagePrompt = `A cute vibrant 3D digital illustration in iconic Super Mario World style for kids, featuring "${targetWord}". Bright saturated colors, cheerful Nintendo game art aesthetic, Mushroom Kingdom background elements, clear isolated focus on the main subject. **CRITICAL REQUIREMENT: NO TEXT, NO LETTERS, NO WORDS IN THE IMAGE AT ALL.**`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(imagePrompt).then(() => {
            alert(`ก๊อปปี้คำสั่งเจนรูป (ธีม Mario 🍄) เรียบร้อย!\n\nกำลังเปิด Gemini... เมื่อถึงหน้าเว็บ ให้กด "วาง (Paste)" เพื่อเจนรูปได้เลยครับ`);
            window.open("https://gemini.google.com/app", "_blank");
        }).catch(() => { window.open("https://gemini.google.com/app", "_blank"); });
    } else { window.open("https://gemini.google.com/app", "_blank"); }
}

// ==========================================
// --- IMAGE TO VOCAB (OCR & BULK INSERT) ---
// ==========================================

function openOcrModal() {
    if (!isParentUser) return;
    document.getElementById("ocr-upload-section").classList.remove("hidden");
    document.getElementById("ocr-result-section").classList.add("hidden");
    document.getElementById("ocr-img-preview-container").classList.add("hidden");
    document.getElementById("ocr-file-input").value = "";
    tempOcrBase64 = null;
    ocrExtractedList = [];
    document.getElementById("ocr-modal").classList.remove("hidden");
}

function closeOcrModal() {
    document.getElementById("ocr-modal").classList.add("hidden");
}

function handleOcrImageSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement("canvas");
            const maxDim = 800;
            let width = img.width, height = img.height;
            if (width > height) { if (width > maxDim) { height = Math.round((height * maxDim) / width); width = maxDim; } } 
            else { if (height > maxDim) { width = Math.round((width * maxDim) / height); height = maxDim; } }
            canvas.width = width; canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);
            
            tempOcrBase64 = canvas.toDataURL("image/jpeg", 0.8);
            document.getElementById("ocr-img-preview").src = tempOcrBase64;
            document.getElementById("ocr-img-preview-container").classList.remove("hidden");
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

async function scanImageWithGemini() {
    const apiKey = localStorage.getItem("gemini_api_key");
    if (!apiKey) { alert("กรุณาตั้งค่า Gemini API Key ก่อนครับ"); return; }
    if (!tempOcrBase64) return;

    const btn = document.getElementById("ocr-scan-btn");
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> Gemini 3.5 Flash Lite กำลังวิเคราะห์รูป...`;

    const prompt = `วิเคราะห์รูปภาพนี้ ดึงคำศัพท์ภาษาอังกฤษที่พบในรูปภาพ หรือวัตถุหลักๆ ในรูปภาพออกมาเป็นรายการคำศัพท์สำหรับเด็ก พร้อมคำแปลภาษาไทย คำอ่านทับศัพท์ภาษาไทย และเลือก Emoji 1 ตัวที่ตรงกับคำนั้นมากที่สุด 
    ตอบกลับเป็น JSON Array ของ Object รูปแบบนี้เท่านั้น ห้ามใส่คำอธิบายเพิ่มเติม:
    [{"en": "Apple", "th": "แอปเปิ้ล", "phonetic": "แอป-เปิ้ล", "emoji": "🍎"}]`;

    const base64Data = tempOcrBase64.split(',')[1];
    const textUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(textUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: prompt },
                        { inline_data: { mime_type: "image/jpeg", data: base64Data } }
                    ]
                }],
                generationConfig: { temperature: 0.2 }
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        const rawText = data.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim();
        ocrExtractedList = JSON.parse(rawText);

        renderOcrPreviewList();
        document.getElementById("ocr-upload-section").classList.add("hidden");
        document.getElementById("ocr-result-section").classList.remove("hidden");

    } catch (error) {
        alert("เกิดข้อผิดพลาดในการวิเคราะห์รูปภาพ: " + (error.message || "กรุณาลองใหม่อีกครั้ง"));
    } finally {
        btn.disabled = false;
        btn.innerHTML = `✨ สกัดคำศัพท์ด้วย Gemini 3.5 Flash Lite`;
    }
}

function renderOcrPreviewList() {
    const container = document.getElementById("ocr-items-list");
    document.getElementById("ocr-count").innerText = ocrExtractedList.length;

    container.innerHTML = ocrExtractedList.map((item, index) => `
        <div class="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            <input type="checkbox" id="ocr-check-${index}" checked class="w-5 h-5 accent-indigo-600 rounded">
            <span class="text-2xl">${item.emoji || '💡'}</span>
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                    <span class="font-black text-indigo-900 text-sm">${item.en}</span>
                    <span class="text-xs text-slate-400">[ ${item.phonetic || item.th} ]</span>
                </div>
                <div class="text-xs font-bold text-slate-600">${item.th}</div>
            </div>
        </div>
    `).join('');
}

function saveSelectedOcrVocab() {
    let addedCount = 0;
    const assignees = ["พูน", "เพลิน"];

    ocrExtractedList.forEach((item, index) => {
        const checkbox = document.getElementById(`ocr-check-${index}`);
        if (checkbox && checkbox.checked) {
            const exists = rawVocabList.some(x => x.en.toLowerCase() === item.en.toLowerCase());
            if (!exists) {
                rawVocabList.push({
                    en: item.en,
                    th: item.th,
                    phonetic: item.phonetic || item.th,
                    emoji: item.emoji || "✨",
                    image: null,
                    assignees: assignees
                });
                addedCount++;
            }
        }
    });

    if (addedCount > 0) {
        saveToStorage();
        filterVocabForUser();
        currentIndex = rawVocabList.length - 1;
        updateCard();
        if (vocabSubMode === 'match') startMatchingGame();
        alert(`🎉 เพิ่มคำศัพท์ใหม่สำเร็จทั้งหมด ${addedCount} คำเรียบร้อยแล้วครับ!`);
    } else {
        alert("ไม่ได้เลือกคำศัพท์ใหม่ หรือมีคำศัพท์เหล่านี้ในระบบอยู่แล้วครับ");
    }

    closeOcrModal();
}

// ==========================================
// --- IMAGE RESIZING & HELPER FUNCTIONS ---
// ==========================================

function processResizedBase64(base64Src) {
    const img = new Image();
    img.onload = function() {
        const canvas = document.createElement("canvas");
        const maxDim = 300; let width = img.width, height = img.height;
        if (width > height) { if (width > maxDim) { height = Math.round((height * maxDim) / width); width = maxDim; } } 
        else { if (height > maxDim) { width = Math.round((width * maxDim) / height); height = maxDim; } }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        currentResizedBase64 = canvas.toDataURL("image/jpeg", 0.7);
        const previewImg = document.getElementById("img-preview");
        previewImg.src = currentResizedBase64;
        document.getElementById("img-preview-container").classList.remove("hidden");
        document.getElementById("img-size-info").innerText = `เตรียมรูปเรียบร้อย ✨ (${width}x${height}px, ~${Math.round((currentResizedBase64.length * (3/4)) / 1024)}KB)`;
    };
    img.src = base64Src;
}

function previewAndResizeImage(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) { processResizedBase64(e.target.result); };
    reader.readAsDataURL(file);
}
