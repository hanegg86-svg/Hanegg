// ==========================================
// --- VOCAB, BULK HANDWRITING CHECKER & MATCHING ---
// ==========================================

let vocabSubMode = 'cards'; // 'cards' | 'photo' | 'match'
let matchCardsList = [];
let selectedMatchCards = [];
let matchedPairsCount = 0;

let tempOcrBase64 = null;
let ocrExtractedList = [];

let parentViewFilter = 'all'; // 'all' | 'พูน' | 'เพลิน'
let vocabSortMode = 'newest'; // 'newest' | 'oldest' | 'random'

// --- BULK PHOTO HUNT / HANDWRITING CHECKER STATE ---
let currentBulkSet = 1; // 1 | 2 (เซตที่ 1 หรือ เซตที่ 2)
let parentCustomSets = {
    EN: { 'พูน': { set1: [], set2: [] }, 'เพลิน': { set1: [], set2: [] } },
    TH: { 'พูน': { set1: [], set2: [] }, 'เพลิน': { set1: [], set2: [] } }
};
let editingCustomSetTab = 1;
let editingCustomSetChild = 'พูน';
let tempSelectedSet1 = [];
let tempSelectedSet2 = [];

let bulkPhotoVocabItems = []; // เก็บชุดคำศัพท์ 5 คำประจำรอบ
let vocabMediaStream = null;
let capturedPhotoBase64 = null;

function loadParentCustomSets() {
    try {
        const saved = localStorage.getItem('kids_parent_custom_sets');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.EN || parsed.TH) {
                parentCustomSets = parsed;
            } else {
                parentCustomSets.EN = parsed;
            }
        }
        if (!parentCustomSets.EN) parentCustomSets.EN = { 'พูน': { set1: [], set2: [] }, 'เพลิน': { set1: [], set2: [] } };
        if (!parentCustomSets.TH) parentCustomSets.TH = { 'พูน': { set1: [], set2: [] }, 'เพลิน': { set1: [], set2: [] } };
    } catch (e) {
        console.error("Error loading custom sets:", e);
    }
}

function saveParentCustomSets() {
    try {
        localStorage.setItem('kids_parent_custom_sets', JSON.stringify(parentCustomSets));
    } catch (e) {
        console.error("Error saving custom sets:", e);
    }
}

function switchVocabPlayMode(mode) {
    vocabSubMode = mode;
    const cardsBtn = document.getElementById("vocab-mode-cards");
    const photoBtn = document.getElementById("vocab-mode-photo");
    const matchBtn = document.getElementById("vocab-mode-match");

    const flashcardSec = document.getElementById("flashcard-section");
    const photoSec = document.getElementById("photo-hunt-section");
    const matchingSec = document.getElementById("matching-section");

    const activeClass = "flex-1 py-1.5 rounded-xl text-xs font-black bg-white border-2 border-indigo-200 text-indigo-900 shadow-[0_3px_0_0_#c7d2fe] transition-all active:translate-y-1 active:shadow-none";
    const inactiveClass = "flex-1 py-1.5 rounded-xl text-xs font-black text-indigo-700 hover:bg-white/50 border-2 border-transparent transition-all";

    [cardsBtn, photoBtn, matchBtn].forEach(btn => { if (btn) btn.className = inactiveClass; });

    const manageSetsBtn = document.getElementById("btn-manage-custom-sets");
    if (manageSetsBtn) {
        if (isParentUser) manageSetsBtn.classList.remove("hidden");
        else manageSetsBtn.classList.add("hidden");
    }

    if (mode === 'cards') {
        stopVocabCamera();
        if (cardsBtn) cardsBtn.className = activeClass;
        if (flashcardSec) flashcardSec.classList.remove("hidden");
        if (photoSec) photoSec.classList.add("hidden");
        if (matchingSec) matchingSec.classList.add("hidden");
    } else if (mode === 'photo') {
        if (photoBtn) photoBtn.className = activeClass;
        if (flashcardSec) flashcardSec.classList.add("hidden");
        if (photoSec) photoSec.classList.remove("hidden");
        if (matchingSec) matchingSec.classList.add("hidden");
        loadParentCustomSets();
        setupBulkPhotoSheet();
        startVocabCamera();
    } else if (mode === 'match') {
        stopVocabCamera();
        if (matchBtn) matchBtn.className = activeClass;
        if (flashcardSec) flashcardSec.classList.add("hidden");
        if (photoSec) photoSec.classList.add("hidden");
        if (matchingSec) matchingSec.classList.remove("hidden");
        startMatchingGame();
    }
}

function changeParentViewFilter(val) {
    parentViewFilter = val;
    filterVocabForUser();
    currentIndex = 0;
    updateCard();
    if (vocabSubMode === 'photo') setupBulkPhotoSheet();
    if (vocabSubMode === 'match') startMatchingGame();
}

function changeVocabSortMode(val) {
    vocabSortMode = val;
    filterVocabForUser();
    currentIndex = 0;
    updateCard();
    if (vocabSubMode === 'photo') setupBulkPhotoSheet();
    if (vocabSubMode === 'match') startMatchingGame();
}

function filterVocabForUser() {
    let baseList = [...rawVocabList];

    if (isParentUser) {
        if (parentViewFilter === 'พูน' || parentViewFilter === 'เพลิน') {
            baseList = baseList.filter(item => {
                if (!item.assignees || item.assignees.length === 0) return true;
                return item.assignees.includes(parentViewFilter);
            });
        }
    } else if (currentUser) {
        baseList = baseList.filter(item => {
            if (!item.assignees || item.assignees.length === 0) return true;
            return item.assignees.includes(currentUser);
        });
    }

    if (vocabSortMode === 'newest') {
        filteredVocabList = baseList.reverse();
    } else if (vocabSortMode === 'oldest') {
        filteredVocabList = baseList;
    } else if (vocabSortMode === 'random') {
        filteredVocabList = shuffleArray(baseList);
    } else {
        filteredVocabList = baseList.reverse();
    }
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

    const badgeEl = document.getElementById("target-assigned-badge");
    if (badgeEl) {
        const assignees = item.assignees || [];
        if (assignees.length === 0 || (assignees.includes("พูน") && assignees.includes("เพลิน"))) {
            badgeEl.innerText = "🎯 เรียนได้ทุกคน";
            badgeEl.className = "text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-bold border border-indigo-100";
        } else if (assignees.includes("พูน")) {
            badgeEl.innerText = "👦 สำหรับน้องพูน";
            badgeEl.className = "text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-bold border border-blue-100";
        } else if (assignees.includes("เพลิน")) {
            badgeEl.innerText = "👧 สำหรับน้องเพลิน";
            badgeEl.className = "text-xs bg-pink-50 text-pink-700 px-2.5 py-1 rounded-full font-bold border border-pink-100";
        }
    }

    checkDailyLimitStatus();
}

// --------------------------------------------------------
// --- BULK HANDWRITING CHECKER & PARENT CUSTOM SETS ---
// --------------------------------------------------------

function switchBulkPhotoSet(setNum) {
    currentBulkSet = setNum;
    const btnSet1 = document.getElementById("btn-photo-set1");
    const btnSet2 = document.getElementById("btn-photo-set2");

    const activeClass = "px-3 py-1 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-2xs transition";
    const inactiveClass = "px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition";

    if (setNum === 1) {
        if (btnSet1) btnSet1.className = activeClass;
        if (btnSet2) btnSet2.className = inactiveClass;
    } else {
        if (btnSet1) btnSet1.className = inactiveClass;
        if (btnSet2) btnSet2.className = activeClass;
    }

    setupBulkPhotoSheet();
}

function setupBulkPhotoSheet() {
    if (!filteredVocabList || filteredVocabList.length === 0) return;

    loadParentCustomSets();
    const activeChild = (currentUser === 'พูน' || currentUser === 'เพลิน') ? currentUser : (parentViewFilter !== 'all' ? parentViewFilter : 'พูน');
    const modeSets = parentCustomSets[subjectMode] ? parentCustomSets[subjectMode][activeChild] : null;
    const customListKeys = (modeSets && modeSets[`set${currentBulkSet}`]) ? modeSets[`set${currentBulkSet}`] : [];

    let matchedCustomItems = [];
    if (customListKeys && customListKeys.length > 0) {
        customListKeys.forEach(wordKey => {
            const found = rawVocabList.find(x => x.en === wordKey || x.th === wordKey);
            if (found) matchedCustomItems.push(found);
        });
    }

    if (matchedCustomItems.length > 0) {
        bulkPhotoVocabItems = matchedCustomItems.slice(0, 5);
    } else {
        if (vocabSortMode === 'random') {
            const shuffled = [...filteredVocabList];
            shuffleArray(shuffled);
            bulkPhotoVocabItems = shuffled.slice(0, Math.min(5, filteredVocabList.length));
        } else {
            bulkPhotoVocabItems = filteredVocabList.slice(0, Math.min(5, filteredVocabList.length));
        }
    }

    const listContainer = document.getElementById("bulk-5-items-list");
    if (!listContainer) return;

    listContainer.innerHTML = bulkPhotoVocabItems.map((item, idx) => {
        let visualHtml = item.image 
            ? `<img src="${item.image}" class="w-8 h-8 object-cover rounded-lg border border-indigo-100">`
            : `<span class="text-2xl">${item.emoji || '🍎'}</span>`;

        return `
            <div class="bg-white border border-indigo-100 p-2 rounded-xl flex flex-col items-center justify-between shadow-2xs">
                <span class="text-[10px] font-black text-indigo-800 font-kids">ข้อ ${idx + 1}</span>
                <div class="my-1 flex items-center justify-center">${visualHtml}</div>
                <button onclick="speakSingleBulkWord(${idx})" class="w-full bg-sky-50 active:bg-sky-100 text-sky-700 font-bold p-1 rounded-lg border border-sky-200 text-[10px] flex items-center justify-center gap-1">
                    <i data-lucide="volume-2" class="w-3 h-3"></i>
                </button>
            </div>
        `;
    }).join('');

    const resultsBox = document.getElementById("bulk-results-box");
    if (resultsBox) resultsBox.classList.add("hidden");
    retakeVocabPhoto();
    lucide.createIcons();
}

// --------------------------------------------------------
// --- PARENT MODAL FOR CUSTOM SET SELECTION (5 WORDS) ---
// --------------------------------------------------------

function openCustomSetModal() {
    if (!isParentUser) return;
    loadParentCustomSets();
    editingCustomSetChild = (parentViewFilter === 'เพลิน') ? 'เพลิน' : 'พูน';
    const selectChild = document.getElementById("select-custom-set-child");
    if (selectChild) selectChild.value = editingCustomSetChild;

    const langBadge = document.getElementById("custom-set-lang-tag");
    if (langBadge) {
        langBadge.innerText = subjectMode === 'EN' ? '🇬🇧 EN' : '🇹🇭 TH';
    }

    editingCustomSetTab = 1;
    const currentChildModeSets = parentCustomSets[subjectMode] ? parentCustomSets[subjectMode][editingCustomSetChild] : null;

    tempSelectedSet1 = currentChildModeSets?.set1 ? [...currentChildModeSets.set1] : [];
    tempSelectedSet2 = currentChildModeSets?.set2 ? [...currentChildModeSets.set2] : [];

    switchCustomSetEditTab(1);
    document.getElementById("custom-set-modal").classList.remove("hidden");
}

function closeCustomSetModal() {
    document.getElementById("custom-set-modal").classList.add("hidden");
}

function changeCustomSetChild(childName) {
    editingCustomSetChild = childName;
    const currentChildModeSets = parentCustomSets[subjectMode] ? parentCustomSets[subjectMode][editingCustomSetChild] : null;

    tempSelectedSet1 = currentChildModeSets?.set1 ? [...currentChildModeSets.set1] : [];
    tempSelectedSet2 = currentChildModeSets?.set2 ? [...currentChildModeSets.set2] : [];
    switchCustomSetEditTab(editingCustomSetTab);
}

function switchCustomSetEditTab(tabNum) {
    editingCustomSetTab = tabNum;
    const tab1Btn = document.getElementById("custom-set-tab-1");
    const tab2Btn = document.getElementById("custom-set-tab-2");

    const activeClass = "flex-1 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-xs";
    const inactiveClass = "flex-1 py-1.5 rounded-xl text-xs font-bold text-slate-600";

    if (tabNum === 1) {
        if (tab1Btn) tab1Btn.className = activeClass;
        if (tab2Btn) tab2Btn.className = inactiveClass;
    } else {
        if (tab1Btn) tab1Btn.className = inactiveClass;
        if (tab2Btn) tab2Btn.className = activeClass;
    }

    renderCustomSetPicker();
}

function renderCustomSetPicker() {
    const pickerContainer = document.getElementById("custom-set-vocab-picker");
    const set1Count = document.getElementById("set1-count");
    const set2Count = document.getElementById("set2-count");

    if (set1Count) set1Count.innerText = tempSelectedSet1.length;
    if (set2Count) set2Count.innerText = tempSelectedSet2.length;

    if (!pickerContainer) return;
    const currentTempList = editingCustomSetTab === 1 ? tempSelectedSet1 : tempSelectedSet2;

    const childVocabList = rawVocabList.filter(item => {
        if (!item.assignees || item.assignees.length === 0) return true;
        return item.assignees.includes(editingCustomSetChild);
    });

    pickerContainer.innerHTML = childVocabList.map(item => {
        const itemKey = item.en || item.th;
        const isChecked = currentTempList.includes(itemKey);
        let visualHtml = item.image 
            ? `<img src="${item.image}" class="w-7 h-7 object-cover rounded-lg border">`
            : `<span class="text-xl">${item.emoji || '🍎'}</span>`;

        return `
            <label class="flex items-center gap-2.5 p-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition">
                <input type="checkbox" onchange="toggleCustomSetWord('${itemKey}')" ${isChecked ? 'checked' : ''} class="w-4 h-4 text-indigo-600 rounded">
                ${visualHtml}
                <div class="flex-1 min-w-0">
                    <span class="font-bold text-xs text-indigo-900">${item.en}</span>
                    <span class="text-[11px] text-slate-500 font-medium">(${item.th})</span>
                </div>
            </label>
        `;
    }).join('');
}

function toggleCustomSetWord(wordKey) {
    let targetList = editingCustomSetTab === 1 ? tempSelectedSet1 : tempSelectedSet2;
    const index = targetList.indexOf(wordKey);

    if (index > -1) {
        targetList.splice(index, 1);
    } else {
        if (targetList.length >= 5) {
            alert("สามารถเลือกจัดคำศัพท์ได้สูงสุดเซตละ 5 คำเท่านั้นครับ!");
            renderCustomSetPicker();
            return;
        }
        targetList.push(wordKey);
    }

    if (editingCustomSetTab === 1) tempSelectedSet1 = targetList;
    else tempSelectedSet2 = targetList;

    renderCustomSetPicker();
}

function saveCustomSets() {
    if (!parentCustomSets[subjectMode]) {
        parentCustomSets[subjectMode] = {};
    }
    if (!parentCustomSets[subjectMode][editingCustomSetChild]) {
        parentCustomSets[subjectMode][editingCustomSetChild] = { set1: [], set2: [] };
    }

    parentCustomSets[subjectMode][editingCustomSetChild].set1 = [...tempSelectedSet1];
    parentCustomSets[subjectMode][editingCustomSetChild].set2 = [...tempSelectedSet2];

    saveParentCustomSets();
    const modeLabel = subjectMode === 'EN' ? 'ภาษาอังกฤษ' : 'ภาษาไทย';
    alert(`🎉 บันทึกการจัดเซตคำศัพท์ ${modeLabel} สำหรับ น้อง${editingCustomSetChild} เรียบร้อยแล้วครับ!`);
    closeCustomSetModal();
    setupBulkPhotoSheet();
}

function speakSingleBulkWord(index) {
    if (!bulkPhotoVocabItems || !bulkPhotoVocabItems[index]) return;
    const item = bulkPhotoVocabItems[index];
    let rawText = subjectMode === 'EN' ? item.en : item.th;
    let lang = subjectMode === 'EN' ? 'en-US' : 'th-TH';

    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(rawText);
        utterance.lang = lang; utterance.rate = 0.85; utterance.pitch = 1.1;
        window.speechSynthesis.speak(utterance);
    }
}

function speakAll5Words() {
    if (!bulkPhotoVocabItems || bulkPhotoVocabItems.length === 0) return;
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    bulkPhotoVocabItems.forEach((item, idx) => {
        const rawText = subjectMode === 'EN' ? item.en : item.th;
        const lang = subjectMode === 'EN' ? 'en-US' : 'th-TH';

        const utteranceIntro = new SpeechSynthesisUtterance(`ข้อ ${idx + 1}`);
        utteranceIntro.lang = 'th-TH'; utteranceIntro.rate = 0.9;
        
        const utteranceWord = new SpeechSynthesisUtterance(rawText);
        utteranceWord.lang = lang; utteranceWord.rate = 0.8;

        window.speechSynthesis.speak(utteranceIntro);
        window.speechSynthesis.speak(utteranceWord);
    });
}

async function startVocabCamera() {
    const video = document.getElementById("vocab-camera-stream");
    if (!video) return;
    try {
        if (vocabMediaStream) stopVocabCamera();
        vocabMediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "environment" } },
            audio: false
        });
        video.srcObject = vocabMediaStream;
    } catch (err) {
        console.error("Camera access error:", err);
        alert("ไม่สามารถเปิดกล้องได้ กรุณายินยอมให้เข้าถึงกล้องถ่ายรูปครับ");
    }
}

function stopVocabCamera() {
    if (vocabMediaStream) {
        vocabMediaStream.getTracks().forEach(track => track.stop());
        vocabMediaStream = null;
    }
}

function captureVocabPhoto() {
    const video = document.getElementById("vocab-camera-stream");
    const preview = document.getElementById("vocab-photo-preview");
    const overlay = document.getElementById("vocab-camera-overlay");
    const btnSnap = document.getElementById("btn-snap-photo");
    const btnRetake = document.getElementById("btn-retake-photo");
    const btnAnalyze = document.getElementById("btn-analyze-photo");

    if (!video || !video.videoWidth) return;

    const canvas = document.createElement("canvas");
    const maxDim = 800;
    let w = video.videoWidth, h = video.videoHeight;
    if (w > h) { if (w > maxDim) { h = Math.round((h * maxDim) / w); w = maxDim; } } 
    else { if (h > maxDim) { w = Math.round((w * maxDim) / h); h = maxDim; } }

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, w, h);

    capturedPhotoBase64 = canvas.toDataURL("image/jpeg", 0.8);
    preview.src = capturedPhotoBase64;

    video.classList.add("hidden");
    preview.classList.remove("hidden");
    if (overlay) overlay.classList.add("hidden");

    btnSnap.classList.add("hidden");
    btnRetake.classList.remove("hidden");
    btnAnalyze.classList.remove("hidden");
}

function retakeVocabPhoto() {
    capturedPhotoBase64 = null;
    const video = document.getElementById("vocab-camera-stream");
    const preview = document.getElementById("vocab-photo-preview");
    const overlay = document.getElementById("vocab-camera-overlay");
    const btnSnap = document.getElementById("btn-snap-photo");
    const btnRetake = document.getElementById("btn-retake-photo");
    const btnAnalyze = document.getElementById("btn-analyze-photo");

    if (video) video.classList.remove("hidden");
    if (preview) preview.classList.add("hidden");
    if (overlay) overlay.classList.remove("hidden");

    if (btnSnap) btnSnap.classList.remove("hidden");
    if (btnRetake) btnRetake.classList.add("hidden");
    if (btnAnalyze) btnAnalyze.classList.add("hidden");
}

async function verifyPhotoWithGeminiAI() {
    if (!bulkPhotoVocabItems || bulkPhotoVocabItems.length === 0) return;
    if (!capturedPhotoBase64) { alert("กรุณาถ่ายรูปกระดาษคำตอบก่อนครับ!"); return; }

    if (!isParentUser && isDailyLimitEnabled && todayPlayedRounds >= dailyLimitRounds) {
        alert(`🛑 หนูเล่นครบโควต้ารวม ${dailyLimitRounds} รอบประจำวันแล้วนะ พักสายตาก่อนแล้วมาเล่นใหม่พรุ่งนี้นะครับ!`);
        return;
    }

    const apiKey = localStorage.getItem("gemini_api_key");
    if (!apiKey) { alert("กรุณาแจ้งพ่อนะหรือแม่พัดให้ช่วยตั้งค่า Gemini API Key ก่อนครับ"); return; }

    const loadingBox = document.getElementById("photo-ai-loading");
    const btnAnalyze = document.getElementById("btn-analyze-photo");
    if (loadingBox) loadingBox.classList.remove("hidden");
    if (btnAnalyze) btnAnalyze.disabled = true;

    const base64Data = capturedPhotoBase64.split(',')[1];
    const textUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`;

    const targetWordsPromptList = bulkPhotoVocabItems.map((item, idx) => `ข้อ ${idx + 1}: ${subjectMode === 'EN' ? item.en : item.th}`).join('\n');

    const prompt = `วิเคราะห์รูปภาพกระดาษลายมือนี้สำหรับตรวจแบบฝึกหัดสะกดคำของเด็ก:
กระดาษนี้มีย่อหน้า/บรรทัดที่เขียนสะกดคำตามโจทย์เป้าหมาย ${bulkPhotoVocabItems.length} ข้อดังนี้:
${targetWordsPromptList}

หน้าที่ของคุณ:
1. อ่านตัวอักษรลายมือบนกระดาษสำหรับข้อ 1 ถึงข้อ ${bulkPhotoVocabItems.length}
2. ตรวจสอบว่าคำที่เขียนสะกดถูกต้องตรงตามโจทย์เป้าหมายหรือไม่ (ยืดหยุ่นเรื่องตัวพิมพ์เล็ก/ใหญ่)
3. หากข้อใดเขียนสะกดผิด หรืออ่านไม่ได้ ให้ระบุคำที่อ่านได้ และอธิบายสั้นๆ ว่าขาดตัวอักษรใด

ตอบกลับเป็น JSON รูปแบบนี้เท่านั้น ห้ามใส่ markdown หรือข้อความอื่น:
{
  "results": [
    {"no": 1, "written": "คำที่อ่านได้", "correct": true, "reason": "สะกดถูกต้องเรียบร้อย"},
    {"no": 2, "written": "คำที่อ่านได้", "correct": false, "reason": "ขาดตัวอักษร k ไป 1 ตัว"}
  ],
  "totalCorrect": ${bulkPhotoVocabItems.length},
  "feedback": "คำแนะนำภาษาไทยสั้นๆ ให้อ่านเข้าใจง่ายสำหรับเด็ก"
}`;

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
                generationConfig: { temperature: 0.1 }
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        const rawText = data.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim();
        const evalResult = JSON.parse(rawText);

        renderBulkChecklistResults(evalResult);

        if (evalResult.totalCorrect >= bulkPhotoVocabItems.length) {
            alert(`🎉 เก่งมากเลยครับ! สะกดถูกครบทั้งหมด ${evalResult.totalCorrect}/${bulkPhotoVocabItems.length} ข้อ!`);
            triggerPhotoHuntCompletionModal();
        } else {
            alert(`📝 ผลการตรวจ: สะกดถูก ${evalResult.totalCorrect}/${bulkPhotoVocabItems.length} ข้อครับ!\nลองดูข้อที่ผิดในตาราง แล้วแก้ไขคำบนกระดาษเพื่อถ่ายส่งตรวจอีกครั้งนะ`);
        }
    } catch (error) {
        alert("เกิดข้อผิดพลาดในการตรวจสอบกระดาษคำตอบ: " + (error.message || "กรุณาลองใหม่อีกครั้ง"));
    } finally {
        if (loadingBox) loadingBox.classList.add("hidden");
        if (btnAnalyze) btnAnalyze.disabled = false;
    }
}

function renderBulkChecklistResults(evalResult) {
    const resultsBox = document.getElementById("bulk-results-box");
    const resultsList = document.getElementById("bulk-results-list");
    if (!resultsBox || !resultsList) return;

    resultsList.innerHTML = evalResult.results.map(r => {
        const targetItem = bulkPhotoVocabItems[r.no - 1];
        const targetWord = subjectMode === 'EN' ? targetItem.en : targetItem.th;
        const icon = r.correct ? "🟢" : "🔴";
        const statusClass = r.correct ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-rose-700 bg-rose-50 border-rose-200";

        return `
            <div class="p-2 rounded-xl border ${statusClass} flex items-center justify-between">
                <div>
                    <span>${icon} ข้อ ${r.no}: </span>
                    <span class="font-black">${targetWord}</span>
                    <span class="text-[10px] opacity-80">(อ่านได้: "${r.written || '-'}")</span>
                </div>
                <span class="text-[10px] font-medium">${r.reason || ''}</span>
            </div>
        `;
    }).join('');

    resultsBox.classList.remove("hidden");
}

function triggerPhotoHuntCompletionModal() {
    totalStars += 2;
    saveUserStars();
    addEXPToUser(150);
    incrementTodayRounds();

    const modeLabel = subjectMode === 'EN' ? 'EN' : 'TH';
    document.getElementById("summary-total-count").innerText = `สำเร็จภารกิจสะกดคำ 5 ข้อ (${modeLabel})!`;
    document.getElementById("summary-stars-earned").innerText = "⭐ 2 ดวง";
    document.getElementById("summary-stars-earned").className = "text-sm text-amber-500 font-bold";
    document.getElementById("summary-exp-earned").innerText = "+150 EXP ✨";
    document.getElementById("summary-saved-badge").innerText = "✅ บันทึกดาวสะสม ⭐⭐ และแจ้งเตือนผู้ปกครองเรียบร้อย!";
    document.getElementById("summary-saved-badge").className = "bg-emerald-50 text-emerald-800 text-xs font-bold p-2.5 rounded-xl border border-emerald-200";
    document.getElementById("completion-subtitle").innerText = `🎉 น้อง${currentUser || 'เด็กๆ'} สุดยอดมาก เขียนสะกดคำถูกต้องครบ 5 ข้อ!`;
    document.getElementById("completion-modal").classList.remove("hidden");

    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(`เก่งมากเลยครับ ${currentUser || ''} รับไปเลย 2 ดาว และ 150 EXP`);
        utterance.lang = 'th-TH';
        window.speechSynthesis.speak(utterance);
    }
    sendInAppNotification('COMPLETED_SET', { setNum: `ภารกิจสะกดคำ ${modeLabel} เซตที่ ${currentBulkSet} (รับ 2 ดาว)` });
}

// ------------------------------------------
// --- MATCHING GAME LOGIC ---
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
    let rawText, lang;

    if (subjectMode === 'EN') {
        rawText = isFlipped ? item.th : item.en;
        lang = isFlipped ? 'th-TH' : 'en-US';
    } else {
        rawText = isFlipped ? item.en : item.th;
        lang = isFlipped ? 'en-US' : 'th-TH';
    }

    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(rawText);
        utterance.lang = lang; utterance.rate = 0.85;
        window.speechSynthesis.speak(utterance);
    }
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
        if (vocabSubMode === 'photo') setupBulkPhotoSheet();
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
    if (vocabSubMode === 'photo') setupBulkPhotoSheet();
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

    let prompt = "";
    if (subjectMode === 'EN') {
        prompt = `วิเคราะห์รูปภาพนี้ ดึงคำศัพท์ภาษาอังกฤษที่พบในรูปภาพ หรือวัตถุหลักๆ ในรูปภาพออกมาเป็นรายการคำศัพท์สำหรับเด็ก พร้อมคำแปลภาษาไทย คำอ่านทับศัพท์ภาษาไทย และเลือก Emoji 1 ตัวที่ตรงกับคำนั้นมากที่สุด 
        ตอบกลับเป็น JSON Array ของ Object รูปแบบนี้เท่านั้น ห้ามใส่คำอธิบายเพิ่มเติม:
        [{"en": "Apple", "th": "แอปเปิ้ล", "phonetic": "แอป-เปิ้ล", "emoji": "🍎"}]`;
    } else {
        prompt = `วิเคราะห์รูปภาพนี้ ดึงคำศัพท์ภาษาไทยที่พบในรูปภาพ (เช่น ในตาราง Word List หรือข้อความภาษาไทยในรูป) ออกมาเป็นรายการคำศัพท์สำหรับเด็ก พร้อมแปลเป็นภาษาอังกฤษ และสร้าง "คำอ่านแบบเว้นวรรคให้อ่านง่ายสำหรับเด็ก" (phonetic) รวมทั้งเลือก Emoji 1 ตัวที่ตรงกับคำนั้นมากที่สุด
        ตอบกลับเป็น JSON Array ของ Object รูปแบบนี้เท่านั้น ห้ามใส่คำอธิบายเพิ่มเติม:
        [{"th": "ตระหนก", "en": "Panic", "phonetic": "ตระ-หนก", "emoji": "😨"}]`;
    }

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

    container.innerHTML = ocrExtractedList.map((item, index) => {
        const mainText = subjectMode === 'EN' ? item.en : item.th;
        const subText = subjectMode === 'EN' ? item.th : (item.en || item.th);
        return `
            <div class="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                <input type="checkbox" id="ocr-check-${index}" checked class="w-5 h-5 accent-indigo-600 rounded">
                <span class="text-2xl">${item.emoji || '💡'}</span>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                        <span class="font-black text-indigo-900 text-sm">${mainText}</span>
                        <span class="text-xs text-slate-400">[ ${item.phonetic || subText} ]</span>
                    </div>
                    <div class="text-xs font-bold text-slate-600">${subText}</div>
                </div>
            </div>
        `;
    }).join('');
}

function saveSelectedOcrVocab() {
    let addedCount = 0;
    
    // อ่านค่าผู้เรียนจาก Checkbox ที่เลือกไว้ใน Modal
    const assignees = [];
    if (document.getElementById("assign-poon") && document.getElementById("assign-poon").checked) {
        assignees.push("พูน");
    }
    if (document.getElementById("assign-ploern") && document.getElementById("assign-ploern").checked) {
        assignees.push("เพลิน");
    }

    // หากไม่ได้เลือกไว้เลย ให้กำหนดค่าเริ่มต้นสำหรับทุกคน
    if (assignees.length === 0) {
        assignees.push("พูน", "เพลิน");
    }

    ocrExtractedList.forEach((item, index) => {
        const checkbox = document.getElementById(`ocr-check-${index}`);
        if (checkbox && checkbox.checked) {
            const exists = rawVocabList.some(x => {
                if (subjectMode === 'EN') return x.en && item.en && x.en.toLowerCase() === item.en.toLowerCase();
                return x.th && item.th && x.th.trim() === item.th.trim();
            });

            if (!exists) {
                rawVocabList.push({
                    en: item.en ? item.en.trim() : "",
                    th: item.th ? item.th.trim() : "",
                    phonetic: item.phonetic || item.th || "",
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
        if (vocabSubMode === 'photo') setupBulkPhotoSheet();
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
