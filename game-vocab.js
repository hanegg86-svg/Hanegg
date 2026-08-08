// ==========================================
// --- VOCAB & SPELLING GAME ---
// ==========================================
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
        filterVocabForUser(); updateCard();
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
    document.getElementById("summary-total-count").innerText = "5 / 5 คำ";
    document.getElementById("summary-stars-earned").innerText = "⭐ 1 ดวง";
    document.getElementById("summary-stars-earned").className = "text-sm text-amber-500 font-bold";
    document.getElementById("summary-exp-earned").innerText = "+100 EXP ✨";
    document.getElementById("summary-saved-badge").innerText = "✅ บันทึกดาวสะสมและแจ้งเตือนคุณพ่อคุณแม่เรียบร้อย!";
    document.getElementById("summary-saved-badge").className = "bg-emerald-50 text-emerald-800 text-xs font-bold p-2.5 rounded-xl border border-emerald-200";
    document.getElementById("completion-subtitle").innerText = `🎉 น้อง${currentUser || 'เด็กๆ'} ท่องถูกครบชุด 5 คำแล้ว!`;
    document.getElementById("completion-modal").classList.remove("hidden");

    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(`เก่งมากเลยครับ ${currentUser || ''} ตอบถูกครบ 5 คำ รับไปเลย 1 ดาว และ 100 EXP`);
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
}

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
    const textUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`;

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
    const imagePrompt = `วาดรูปภาพการ์ตูนน่ารักๆ สำหรับเด็ก ของคำว่า "${targetWord}" ลายเส้นคลีนๆ 2D vector clipart พื้นหลังสีขาว isolated **ข้อสำคัญ: ห้ามใส่ตัวอักษร ข้อความ หรือคำศัพท์ใดๆ ลงในภาพเด็ดขาด (No text, no letters, no words)**`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(imagePrompt).then(() => {
            alert(`ก๊อปปี้คำสั่งเจนรูปแล้ว!\n\nกำลังเปิด Gemini... เมื่อถึงหน้าเว็บ ให้กด "วาง (Paste)" เพื่อเจนรูปได้เลยครับ`);
            window.open("https://gemini.google.com/app", "_blank");
        }).catch(() => { window.open("https://gemini.google.com/app", "_blank"); });
    } else { window.open("https://gemini.google.com/app", "_blank"); }
}

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
