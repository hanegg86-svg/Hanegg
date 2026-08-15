// ==========================================
// --- AI STORYTELLER VARIABLES ---
// ==========================================
let selectedStoryHero = 'พูนและเพลิน', selectedStoryTheme = 'อวกาศ', selectedStoryPet = 'หุ่นยนต์จิ๋ว', selectedStoryLang = 'TH', generatedStoryData = null, currentStoryPage = 0, cameraMediaStream = null;

function initStoryTabState() { selectStoryLang('TH'); selectStoryHero(currentUser === 'เพลิน' ? 'เพลิน' : 'พูน'); selectStoryTheme('อวกาศ'); selectStoryPet('หุ่นยนต์จิ๋ว'); openStoryCreator(); }
function openStoryCreator() { closeCameraForStory(); document.getElementById("story-creator-box").classList.remove("hidden"); document.getElementById("story-reader-box").classList.add("hidden"); document.getElementById("story-reader-box").classList.remove("flex"); }

function selectStoryLang(lang) {
    selectedStoryLang = lang;
    const activeClass = "flex-1 py-1.5 rounded-xl text-xs font-black bg-indigo-600 border-2 border-indigo-800 text-white shadow-[0_4px_0_0_#3730a3] transition-all active:translate-y-1 active:shadow-none";
    const inactiveClass = "flex-1 py-1.5 rounded-xl text-xs font-black bg-white border-2 border-slate-300 text-slate-700 shadow-[0_4px_0_0_#cbd5e1] hover:bg-slate-50 transition-all active:translate-y-1 active:shadow-none";
    
    document.getElementById("story-lang-th").className = lang === 'TH' ? activeClass : inactiveClass;
    document.getElementById("story-lang-en").className = lang === 'EN' ? activeClass : inactiveClass;
}

function selectStoryHero(hero) {
    selectedStoryHero = hero;
    const normal = "p-2.5 rounded-2xl border-2 border-slate-300 bg-white hover:bg-slate-50 flex flex-col items-center transition-all shadow-[0_4px_0_0_#cbd5e1] active:translate-y-1 active:shadow-none";
    const active = "p-2.5 rounded-2xl border-2 border-pink-600 bg-pink-100 flex flex-col items-center transition-all shadow-[0_4px_0_0_#be185d] scale-105 active:translate-y-1 active:shadow-none";
    document.getElementById("story-hero-poon").className = hero === 'พูน' ? active : normal;
    document.getElementById("story-hero-ploern").className = hero === 'เพลิน' ? active : normal;
    document.getElementById("story-hero-both").className = hero === 'พูนและเพลิน' ? active : normal;
}

function selectStoryTheme(theme) {
    selectedStoryTheme = theme;
    const normal = "p-2 rounded-xl border-2 border-slate-300 bg-white hover:bg-slate-50 flex items-center gap-2 text-xs font-black text-slate-700 shadow-[0_4px_0_0_#cbd5e1] transition-all active:translate-y-1 active:shadow-none";
    const active = "p-2 rounded-xl border-2 border-indigo-600 bg-indigo-100 flex items-center gap-2 text-xs font-black text-indigo-900 shadow-[0_4px_0_0_#4f46e5] scale-105 transition-all active:translate-y-1 active:shadow-none";
    document.getElementById("story-theme-space").className = theme === 'อวกาศ' ? active : normal;
    document.getElementById("story-theme-magic").className = theme === 'เมืองเวทมนตร์' ? active : normal;
    document.getElementById("story-theme-dino").className = theme === 'ดินแดนไดโนเสาร์' ? active : normal;
    document.getElementById("story-theme-ocean").className = theme === 'เมืองใต้ทะเล' ? active : normal;
}

function selectStoryPet(pet) {
    selectedStoryPet = pet;
    const normal = "p-2 rounded-xl border-2 border-slate-300 bg-white hover:bg-slate-50 flex flex-col items-center text-xs font-black text-slate-700 shadow-[0_4px_0_0_#cbd5e1] transition-all active:translate-y-1 active:shadow-none";
    const active = "p-2 rounded-xl border-2 border-amber-500 bg-amber-50 flex flex-col items-center transition-all shadow-[0_4px_0_0_#d97706] scale-105 active:translate-y-1 active:shadow-none";
    document.getElementById("story-pet-dog").className = pet === 'เจ้าหมาน้อย' ? active : normal;
    document.getElementById("story-pet-robot").className = pet === 'หุ่นยนต์จิ๋ว' ? active : normal;
    document.getElementById("story-pet-cat").className = pet === 'เจ้าแมวเหมียว' ? active : normal;
}

async function generateAIStory() {
    if (!isParentUser && isDailyLimitEnabled && todayPlayedRounds >= dailyLimitRounds) { alert(`🛑 หนูเล่นครบโควต้ารวม ${dailyLimitRounds} รอบประจำวันแล้วครับ! พักสายตาก่อนแล้วมาเล่นใหม่พรนี้นะครับ 🎈`); return; }
    const apiKey = localStorage.getItem("gemini_api_key");
    if (!apiKey) { alert("กรุณาให้คุณพ่อคุณแม่ช่วยตั้งค่า Gemini API Key ให้ก่อนสร้างนิทานครับ!"); return; }

    const btnGen = document.getElementById("btn-generate-story");
    btnGen.disabled = true; btnGen.innerHTML = `<span class="spinner"></span> Gemini AI กำลังแต่งเกมนิทาน...`;

    let langInstruction = selectedStoryLang === 'EN' ? "Write the story in SIMPLE EASY ENGLISH for kids." : "แต่งนิทานเป็นภาษาไทยที่อ่านง่าย สนุกสนานสำหรับเด็ก";

    // สุ่มแกนเรื่องหลัก (Plot Variations) เพื่อลดความซ้ำซ้อนของนิทานในแต่ละ Category
    const plotVariations = [
        "ภารกิจกอบกู้สมบัติลับที่หายไปตามตำนานโบราณ",
        "การหลบหนีจากการไล่ล่าของสิ่งมีชีวิตจอมซนที่ชอบขโมยของ",
        "การแข่งขันกับเวลาเพื่อช่วยเหลือเพื่อนใหม่ที่กำลังหลงทาง",
        "การไขปริศนาจากแผนที่ลึกลับที่บังเอิญค้นพบ",
        "การรวบรวมชิ้นส่วนพลังงานวิเศษเพื่อซ่อมแซมยานพาหนะและหาทางกลับบ้าน"
    ];
    const randomPlot = plotVariations[Math.floor(Math.random() * plotVariations.length)];

    const prompt = `แต่งนิทานสนุกๆ สไตล์ Scavenger Hunt ตามล่าหาไอเทมจริงรอบบ้าน ความยาว 10 หน้า พอดีสำหรับเด็ก:
ตัวละครหลัก: ${selectedStoryHero} | สถานที่ผจญภัย: ${selectedStoryTheme} | เพื่อนร่วมทาง: ${selectedStoryPet} | พล็อตเรื่องหลัก: ${randomPlot} | ภาษา: ${langInstruction}
กฎสำคัญสำหรับระบบถ่ายรูปหาของ (Item Hunt):
- ในหน้า 2, 4, 6, 8 จะต้องเป็นหน้าที่มี "ภารกิจถ่ายรูปหาไอเทมจริงรอบบ้าน"
- ให้สุ่มสิ่งของในบ้านที่มีความหลากหลาย จากคลังตัวอย่างต่อไปนี้: [แก้วน้ำ, ช้อน, หมอน, ผ้าเช็ดหน้า, ร่ม, หูฟัง, นาฬิกา, ขวดน้ำ, หวี, ส้ม, กล้วย, แอปเปิ้ล, ขนม, กล่องนม, ดินสอ, ยางลบ, ไม้บรรทัด, สีไม้, สมุด, กรรไกรป้าน, รองเท้า, ถุงเท้า, หมวก, แว่นตา, ตุ๊กตา, รถของเล่น, บล็อกตัวต่อ, ลูกบอล]
- ห้ามเลือกสิ่งของซ้ำกัน
- กำหนดค่า "targetItemTH" (ชื่อภาษาไทย) และ "targetItemEN" (ชื่อภาษาอังกฤษ)

กฎสำหรับการแสดงภาพประกอบ (Images & Emojis):
- คุณมีคลังรูปภาพตัวละครและไอเทมดังนี้ ให้สุ่มเลือกใช้ให้สอดคล้องกับเนื้อเรื่องในแต่ละหน้า (ถ้ามีตัวละครหรือฉากที่ตรงกัน):
  - "mario.png" (มาริโอ้)
  - "luigi.png" (ลุยจิ)
  - "peach.png" (เจ้าหญิงพีช)
  - "rosalina.png" (เจ้าหญิงโรซาลิน่า)
  - "dk.png" (ดองกี้คอง)
  - "bowser_jr.png" (บาวเซอร์จูเนียร์)
  - "question_block.png" (บล็อกปริศนา)
- หากหน้าที่แต่งมีตัวละครหรือไอเทมที่ตรงกับรูปภาพ ให้ระบุชื่อไฟล์รูปภาพนั้นใน key "image" (ตัวอย่าง: "image": "mario.png")
- หากหน้าที่แต่งไม่มีรูปภาพที่ตรงกัน ให้ปล่อย key "image" เป็น null แล้วใส่แค่ "emoji"
ตอบกลับเป็น JSON รูปแบบนี้เท่านั้น (ห้ามมี markdown):
{"title": "ชื่อเรื่องนิทาน", "pages": [{"page": 1, "text": "...", "emoji": "🚀", "image": "mario.png"}, {"page": 2, "text": "...", "emoji": "🔍", "image": null, "isItemHunt": true, "targetItemTH": "แก้วน้ำ", "targetItemEN": "water cup"}]}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`;
    try {
        const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.85 } }) });
        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        generatedStoryData = JSON.parse(data.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim());
        currentStoryPage = 0; renderStoryPage();
        document.getElementById("story-creator-box").classList.add("hidden");
        document.getElementById("story-reader-box").classList.remove("hidden");
        document.getElementById("story-reader-box").classList.add("flex");
    } catch (error) { alert("ไม่สามารถสร้างนิทานได้: " + (error.message || "กรุณาแจ้งพ่อนะหรือแม่พัดให้ตรวจสอบการตั้งค่าครับ")); } 
    finally { btnGen.disabled = false; btnGen.innerHTML = `✨ เนรมิตเกมนิทานถ่ายรูปส่องของ 📸`; }
}

function renderStoryPage() {
    if (!generatedStoryData || !generatedStoryData.pages) return;
    const pageData = generatedStoryData.pages[currentStoryPage];
    document.getElementById("story-title-display").innerText = generatedStoryData.title || "นิทาน AI";
    document.getElementById("story-page-indicator").innerText = `หน้า ${currentStoryPage + 1} / ${generatedStoryData.pages.length}`;
    document.getElementById("story-text-display").innerText = pageData.text;
    
    const emojiEl = document.getElementById("story-image-emoji");
    const imgEl = document.getElementById("story-image-pic");
    
    if (pageData.image && pageData.image !== "null" && pageData.image.trim() !== "") {
        emojiEl.classList.add("hidden");
        imgEl.classList.remove("hidden");
        imgEl.src = pageData.image; 
    } else {
        imgEl.classList.add("hidden");
        emojiEl.classList.remove("hidden");
        emojiEl.innerText = pageData.emoji || "📖";
    }

    // อัปเดต RPG Header UI ทุกครั้งที่เปลี่ยนหน้า
    if (typeof updateRPGUI === 'function') updateRPGUI();

    const btnPrev = document.getElementById("btn-prev-story"), btnNext = document.getElementById("btn-next-story"), missionBox = document.getElementById("story-item-mission-box");
    btnPrev.disabled = currentStoryPage === 0; btnPrev.style.opacity = currentStoryPage === 0 ? "0.5" : "1";

    if (pageData.isItemHunt && !pageData.isPassed) {
        document.getElementById("story-item-target-text").innerText = selectedStoryLang === 'EN' ? `Mission Target: ${pageData.targetItemEN}` : `ต้องถ่ายรูป: ${pageData.targetItemTH}`;
        
        // เช็กแสดงปุ่มใช้สกิล Skip ถ่ายรูป
        const btnSkipSkill = document.getElementById("btn-skill-skip-mission");
        if (btnSkipSkill) {
            if (typeof getSkillLevel === 'function' && getSkillLevel('timeWarp') > 0) {
                btnSkipSkill.classList.remove("hidden");
            } else {
                btnSkipSkill.classList.add("hidden");
            }
        }

        missionBox.classList.remove("hidden"); btnNext.classList.add("hidden"); 
    } else {
        missionBox.classList.add("hidden"); btnNext.classList.remove("hidden");
        if (currentStoryPage === generatedStoryData.pages.length - 1) {
            btnNext.innerText = selectedStoryLang === 'EN' ? "Victory & Finish! 🏆" : "พิชิตเกมอ่านจบแล้ว! 🏆";
            btnNext.className = "bg-emerald-500 text-white font-bold py-2 px-3 rounded-xl text-xs shadow-xs flex items-center gap-1 animate-bounce";
        } else {
            btnNext.innerText = selectedStoryLang === 'EN' ? "Next →" : "ถัดไป →";
            btnNext.className = "bg-indigo-600 text-white font-bold py-2 px-3 rounded-xl text-xs shadow-xs flex items-center gap-1";
        }
    }
}

async function startCameraForStory() {
    const pageData = generatedStoryData.pages[currentStoryPage];
    document.getElementById("camera-target-name").innerText = selectedStoryLang === 'EN' ? pageData.targetItemEN : pageData.targetItemTH;
    document.getElementById("story-reader-box").classList.add("hidden");
    document.getElementById("story-camera-box").classList.remove("hidden");
    document.getElementById("story-camera-box").classList.add("flex");
    try {
        cameraMediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        document.getElementById("camera-stream").srcObject = cameraMediaStream;
    } catch (err) { alert("ไม่สามารถเปิดกล้องได้ กรุณากดอนุญาตให้สิทธิ์ใช้งานกล้องกับแอปพลิเคชันครับ"); closeCameraForStory(); }
}

function closeCameraForStory() {
    if (cameraMediaStream) { cameraMediaStream.getTracks().forEach(track => track.stop()); cameraMediaStream = null; }
    const camBox = document.getElementById("story-camera-box");
    if (camBox) { camBox.classList.add("hidden"); camBox.classList.remove("flex"); }
    const readerBox = document.getElementById("story-reader-box");
    if (readerBox && generatedStoryData) readerBox.classList.remove("hidden");
}

async function captureAndAnalyzeStoryImage() {
    const apiKey = localStorage.getItem("gemini_api_key");
    if (!apiKey) { alert("กรุณาแจ้งพ่อนะหรือแม่พัดให้ช่วยตั้งค่า Gemini API Key ก่อนครับ"); return; }

    const videoEl = document.getElementById("camera-stream"), btnPhoto = document.getElementById("btn-take-photo"), loadingBox = document.getElementById("camera-loading");
    btnPhoto.disabled = true; btnPhoto.classList.add("opacity-50"); loadingBox.classList.remove("hidden");

    const canvas = document.createElement("canvas");
    canvas.width = videoEl.videoWidth || 640; canvas.height = videoEl.videoHeight || 480;
    canvas.getContext("2d").drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    const base64Data = canvas.toDataURL("image/jpeg", 0.75).split(",")[1];
    const targetItemName = generatedStoryData.pages[currentStoryPage].targetItemTH;

    // เช็กระดับสกิล Hint Vision เพื่อสั่งให้ AI ให้คำใบ้เสริม
    const hintSkillLevel = (typeof getSkillLevel === 'function') ? getSkillLevel('hintVision') : 0;
    let hintInstruction = hintSkillLevel > 0 
        ? `หากหาไม่เจอ ให้เขียนช่อง "hint" ใบ้จุดที่มักจะพบของสิ่งนี้ในบ้านสำหรับเด็กสั้นๆ` 
        : ``;

    const prompt = `วิเคราะห์รูปภาพนี้อย่างละเอียดและตรงไปตรงมา: ในรูปภาพนี้มีสิ่งของหรือวัตถุที่ตรงกับ หรือใกล้เคียงกับคำว่า "${targetItemName}" หรือไม่? ${hintInstruction} ตอบกลับเป็น JSON รูปแบบนี้เท่านั้น: {"found": true/false, "detected_object": "ระบุสิ่งที่เห็นในภาพเป็นภาษาไทย", "comment": "คำชมเชยสั้นๆ เหมาะสำหรับเด็ก", "hint": "คำใบ้สั้นๆ (ถ้าหาไม่เจอ)"}`;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: "image/jpeg", data: base64Data } }] }] }) });
        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        const result = JSON.parse(data.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim());

        if (result.found) {
            alert(`🎉 ถูกต้องแล้วครับเก่งมากๆ! AI ตรวจเจอ ${result.detected_object} แล้ว!\n\n💬 ${result.comment}`);
            generatedStoryData.pages[currentStoryPage].isPassed = true;
            closeCameraForStory(); currentStoryPage++; renderStoryPage();
        } else { 
            let alertMsg = `❌ AI เห็นเป็น "${result.detected_object || 'ยังไม่ชัดเจน'}" ยังไม่ตรงกับ ${targetItemName} ครับ ลองขยับส่องให้ชัดเจนแล้วถ่ายใหม่อีกครั้งนะ!`;
            if (result.hint) alertMsg += `\n\n💡 คำใบ้จากดวงตานักสำรวจ: ${result.hint}`;
            alert(alertMsg); 
        }
    } catch (err) { alert("เกิดข้อผิดพลาดในการวิเคราะห์รูปภาพ: " + (err.message || "กรุณาตรวจสอบการเชื่อมต่อ")); } 
    finally { btnPhoto.disabled = false; btnPhoto.classList.remove("opacity-50"); loadingBox.classList.add("hidden"); }
}

function nextStoryPage() {
    if (!generatedStoryData) return;
    if (currentStoryPage < generatedStoryData.pages.length - 1) { currentStoryPage++; renderStoryPage(); } 
    else { triggerStoryCompletionModal(); }
}

function prevStoryPage() { if (currentStoryPage > 0) { currentStoryPage--; renderStoryPage(); } }

function speakStoryPageText() {
    if (!generatedStoryData || !generatedStoryData.pages) return;
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(generatedStoryData.pages[currentStoryPage].text);
        utterance.lang = selectedStoryLang === 'EN' ? 'en-US' : 'th-TH'; utterance.rate = 0.85;
        window.speechSynthesis.speak(utterance);
    }
}

function triggerStoryCompletionModal() {
    incrementTodayRounds(); 

    // --- คำนวณ RPG Bonus (EXP / Stars) ---
    const expBoostLevel = (typeof getSkillLevel === 'function') ? getSkillLevel('expBoost') : 0;
    const doubleStarLevel = (typeof getSkillLevel === 'function') ? getSkillLevel('doubleStar') : 0;

    let baseEXP = 150;
    let bonusEXP = Math.round(baseEXP * (expBoostLevel * 0.15)); // เพิ่ม 15% ต่อระดับสกิล
    let totalEarnedEXP = baseEXP + bonusEXP;

    let earnedStars = 1;
    let doubleStarTriggered = false;
    if (doubleStarLevel > 0 && Math.random() < (doubleStarLevel * 0.25)) { // โอกาส 25% ต่อระดับสกิล
        earnedStars = 2;
        doubleStarTriggered = true;
    }

    totalStars += earnedStars; 
    saveUserStars(); 
    addEXPToUser(totalEarnedEXP);

    document.getElementById("summary-stars-earned").innerText = `⭐ ${earnedStars} ดวง ${doubleStarTriggered ? '(🌟 โบนัสดาว x2!)' : ''}`;
    document.getElementById("summary-stars-earned").className = "text-sm text-amber-500 font-bold";
    document.getElementById("summary-exp-earned").innerText = `+${totalEarnedEXP} EXP ✨ ${bonusEXP > 0 ? `(โบนัส +${bonusEXP})` : ''}`;
    document.getElementById("summary-saved-badge").innerText = "✅ บันทึกดาวสะสมและแจ้งเตือนคุณพ่อคุณแม่เรียบร้อย!";
    document.getElementById("summary-saved-badge").className = "bg-emerald-50 text-emerald-800 text-xs font-bold p-2.5 rounded-xl border border-emerald-200";

    sendInAppNotification('COMPLETED_STORY', { title: generatedStoryData.title, lang: selectedStoryLang });
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const msg = selectedStoryLang === 'EN' ? `Awesome job ${currentUser || ''}! You found all items and completed the adventure story!` : `เก่งมากเลยครับ ${currentUser || ''} ถ่ายรูปส่องตามหาไอเทมครบทุกภารกิจ พิชิตเกมนิทานจบ 10 หน้า รับไปเลย ${earnedStars} ดาว`;
        const utterance = new SpeechSynthesisUtterance(msg); utterance.lang = selectedStoryLang === 'EN' ? 'en-US' : 'th-TH';
        window.speechSynthesis.speak(utterance);
    }

    document.getElementById("summary-total-count").innerText = "พิชิตเกมนิทานถ่ายรูป AI!";
    document.getElementById("completion-subtitle").innerText = `🎉 น้อง${currentUser || 'เด็กๆ'} ถ่ายรูปหาไอเทมอ่านนิทานเรื่อง "${generatedStoryData.title}" จบเรียบร้อย!`;
    document.getElementById("completion-modal").classList.remove("hidden");
}
