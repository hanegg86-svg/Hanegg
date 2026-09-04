// ==========================================
// --- MINI GAME: HABIT PET COMPANION ---
// ==========================================

const PET_SKILL_CONFIG = {
    knowledge: {
        name: 'ผลึกปัญญา',
        icon: '🔮',
        statKey: 'mind',
        statName: 'สมาธิ/ปัญญา',
        color: 'from-blue-400 to-indigo-600',
        textColor: 'text-indigo-600',
        bgColor: 'bg-indigo-50',
        borderColor: 'border-indigo-200'
    },
    fitness: {
        name: 'ผลไม้พลังงาน',
        icon: '🍎',
        statKey: 'energy',
        statName: 'พลังกาย',
        color: 'from-emerald-400 to-teal-600',
        textColor: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200'
    },
    wealth: {
        name: 'น้ำทิพย์มั่งคั่ง',
        icon: '🍯',
        statKey: 'happiness',
        statName: 'ความสุข/วินัย',
        color: 'from-amber-400 to-yellow-600',
        textColor: 'text-amber-600',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200'
    }
};

let currentPetData = {
    name: 'โนว่า',
    level: 1,
    exp: 0,
    maxExp: 100,
    stage: 'เบบี้ดรอป',
    form: 'baby',
    energy: 70,
    mind: 70,
    happiness: 70,
    lastDecayTime: Date.now(),
    inventory: {
        knowledge: 1,
        fitness: 1,
        wealth: 1
    }
};

let petAudioContext = null;

function playPetSound(type) {
    try {
        if (!petAudioContext) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            petAudioContext = new AudioContext();
        }
        const now = petAudioContext.currentTime;
        if (type === 'pop') {
            const osc = petAudioContext.createOscillator();
            const gain = petAudioContext.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.connect(gain);
            gain.connect(petAudioContext.destination);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'levelup') {
            [440, 554.37, 659.25, 880].forEach((freq, i) => {
                const osc = petAudioContext.createOscillator();
                const gain = petAudioContext.createGain();
                osc.type = 'triangle';
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0.15, now + i * 0.1);
                gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.25);
                osc.connect(gain);
                gain.connect(petAudioContext.destination);
                osc.start(now + i * 0.1);
                osc.stop(now + i * 0.1 + 0.25);
            });
        }
    } catch (e) {
        console.warn('Audio Context Error:', e);
    }
}

function initPetGame() {
    if (!currentUser || isParentUser) {
        renderPetParentOrGuestView();
        return;
    }
    loadPetData();
}

function renderPetParentOrGuestView() {
    const dialogueBox = document.getElementById('pet-dialogue-text');
    const petTitle = document.getElementById('pet-name-badge');
    if (isParentUser) {
        if (dialogueBox) dialogueBox.innerText = 'สวัสดีคุณพ่อคุณแม่! มอบหมายภารกิจพร้อมแต้ม Skill ให้เด็กๆ เพื่อให้ลูกนำไอเทมมาเลี้ยงสัตว์เลี้ยงคู่หูได้ที่นี่ครับ ✨';
        if (petTitle) petTitle.innerText = '🐾 สวนสัตว์เลี้ยงคู่หู (โหมดผู้ปกครอง)';
    } else {
        if (dialogueBox) dialogueBox.innerText = 'กรุณาเลือกโปรไฟล์น้องพูน หรือ น้องเพลิน ก่อนเข้ามาเล่นกับสัตว์เลี้ยงนะ!';
    }
}

function loadPetData() {
    if (!currentUser || isParentUser) return;

    if (isFirebaseActive) {
        const { ref, onValue } = window.firebaseModules;
        const db = window.firebaseModules.getDatabase();
        const petRef = ref(db, `user_pet/${currentUser}`);

        onValue(petRef, (snapshot) => {
            const val = snapshot.val();
            if (val) {
                currentPetData = { ...currentPetData, ...val };
                if (!currentPetData.inventory) {
                    currentPetData.inventory = { knowledge: 0, fitness: 0, wealth: 0 };
                }
            } else {
                currentPetData = {
                    name: currentUser === 'เพลิน' ? 'ลูน่า' : 'โนว่า',
                    level: 1,
                    exp: 0,
                    maxExp: 100,
                    stage: 'เบบี้ดรอป',
                    form: 'baby',
                    energy: 80,
                    mind: 80,
                    happiness: 80,
                    lastDecayTime: Date.now(),
                    inventory: { knowledge: 1, fitness: 1, wealth: 1 }
                };
                savePetData();
            }
            evaluatePetEvolution();
            renderPetUI();
        }, { onlyOnce: true });
    } else {
        const local = localStorage.getItem(`kids_pet_${currentUser}`);
        if (local) {
            try {
                currentPetData = JSON.parse(local);
            } catch (e) {
                console.error(e);
            }
        } else {
            currentPetData = {
                name: currentUser === 'เพลิน' ? 'ลูน่า' : 'โนว่า',
                level: 1,
                exp: 0,
                maxExp: 100,
                stage: 'เบบี้ดรอป',
                form: 'baby',
                energy: 80,
                mind: 80,
                happiness: 80,
                lastDecayTime: Date.now(),
                inventory: { knowledge: 1, fitness: 1, wealth: 1 }
            };
            savePetData();
        }
        evaluatePetEvolution();
        renderPetUI();
    }
}

function savePetData() {
    if (!currentUser || isParentUser) return;

    if (isFirebaseActive) {
        const { ref, set } = window.firebaseModules;
        const db = window.firebaseModules.getDatabase();
        set(ref(db, `user_pet/${currentUser}`), currentPetData);
    } else {
        localStorage.setItem(`kids_pet_${currentUser}`, JSON.stringify(currentPetData));
    }
}

// Hook สำหรับเชื่อมโยงแต้มสกิลเมื่อภารกิจผ่านการอนุมัติ
function addPetRewardFromSkill(childName, skillType, skillPoints) {
    if (!childName || !skillType || skillType === 'none' || skillPoints <= 0) return;

    const itemsEarned = Math.max(1, Math.round(skillPoints / 5));

    if (isFirebaseActive) {
        const { ref, runTransaction } = window.firebaseModules;
        const db = window.firebaseModules.getDatabase();
        const petInvRef = ref(db, `user_pet/${childName}/inventory/${skillType}`);

        runTransaction(petInvRef, (curr) => {
            return (curr || 0) + itemsEarned;
        });
    } else {
        const localKey = `kids_pet_${childName}`;
        const data = JSON.parse(localStorage.getItem(localKey) || '{}');
        if (!data.inventory) data.inventory = { knowledge: 0, fitness: 0, wealth: 0 };
        data.inventory[skillType] = (data.inventory[skillType] || 0) + itemsEarned;
        localStorage.setItem(localKey, JSON.stringify(data));
    }

    if (currentUser === childName) {
        currentPetData.inventory[skillType] = (currentPetData.inventory[skillType] || 0) + itemsEarned;
        renderPetUI();
        triggerPetAIReaction(`เจ้านายทำภารกิจสำเร็จ ได้รับ ${PET_SKILL_CONFIG[skillType].name} x${itemsEarned} มาให้หนูด้วย!`);
    }
}

function evaluatePetEvolution() {
    const skills = (userSkillsList && userSkillsList[currentUser]) || { knowledge: 0, fitness: 0, wealth: 0 };
    const k = skills.knowledge || 0;
    const f = skills.fitness || 0;
    const w = skills.wealth || 0;

    if (currentPetData.level >= 5) {
        if (k > f && k > w) {
            currentPetData.stage = 'ภูติปราชญ์เวทมนตร์ (Sage)';
            currentPetData.form = 'sage';
        } else if (f > k && f > w) {
            currentPetData.stage = 'มังกรนักรบพลังกาย (Warrior)';
            currentPetData.form = 'warrior';
        } else if (w > k && w > f) {
            currentPetData.stage = 'กิเลนทองคำแห่งวินัย (Royal)';
            currentPetData.form = 'royal';
        } else {
            currentPetData.stage = 'เทพพิทักษ์สูงสุด (Guardian)';
            currentPetData.form = 'guardian';
        }
    } else if (currentPetData.level >= 3) {
        currentPetData.stage = 'สไลม์วัยซน (Teen)';
        currentPetData.form = 'teen';
    } else {
        currentPetData.stage = 'เบบี้ดรอป (Baby)';
        currentPetData.form = 'baby';
    }
}

function feedPet(skillType) {
    if (!currentPetData.inventory || (currentPetData.inventory[skillType] || 0) <= 0) {
        alert(`ยังไม่มีไอเทม ${PET_SKILL_CONFIG[skillType].name} ครับ! ทำภารกิจสายนี้เพื่อรับเพิ่มนะ`);
        return;
    }

    currentPetData.inventory[skillType] -= 1;
    playPetSound('pop');

    if (skillType === 'knowledge') {
        currentPetData.mind = Math.min(100, currentPetData.mind + 25);
    } else if (skillType === 'fitness') {
        currentPetData.energy = Math.min(100, currentPetData.energy + 25);
    } else if (skillType === 'wealth') {
        currentPetData.happiness = Math.min(100, currentPetData.happiness + 25);
    }

    addPetExp(35);
    savePetData();
    renderPetUI();
    triggerPetAIReaction(`เจ้านายให้ ${PET_SKILL_CONFIG[skillType].name} แก่ฉัน อร่อยและมีประโยชน์มาก`);
}

function addPetExp(amount) {
    currentPetData.exp += amount;
    if (currentPetData.exp >= currentPetData.maxExp) {
        currentPetData.exp -= currentPetData.maxExp;
        currentPetData.level += 1;
        currentPetData.maxExp = Math.round(currentPetData.maxExp * 1.35);
        playPetSound('levelup');
        evaluatePetEvolution();
        triggerPetAIReaction(`เลเวลอัปเป็น Lv.${currentPetData.level} แล้ว! ตัวโตขึ้นอีกขั้น`);
    }
}

function touchPet() {
    playPetSound('pop');
    const petSvg = document.getElementById('pet-avatar-svg');
    if (petSvg) {
        petSvg.classList.add('scale-110');
        setTimeout(() => petSvg.classList.remove('scale-110'), 200);
    }
    triggerPetAIReaction('เจ้านายแตะสัมผัสตัวเล่นด้วยความเอ็นดู');
}

async function triggerPetAIReaction(eventDescription) {
    const dialogueBox = document.getElementById('pet-dialogue-text');
    if (!dialogueBox) return;

    dialogueBox.innerText = 'กำลังส่งเสียงร้อง... ✨';

    const localFallbacks = [
        `แง้วๆ ขอบคุณนะน้อง${currentUser}! หนูมีความสุขจังเลย`,
        `ฮึดสู้มาก! ทำภารกิจแล้วอย่าลืมพักผ่อนด้วยนะเจ้านาย`,
        `ออร่ารอบตัวหนูกำลังเปล่งประกายเลย ขอบคุณที่ดูแลหนูนะ!`,
        `เติบโตไปด้วยกันนะคนเก่ง! วันนี้ทำภารกิจครบหรือยังเอ่ย?`
    ];

    const apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) {
        dialogueBox.innerText = localFallbacks[Math.floor(Math.random() * localFallbacks.length)];
        return;
    }

    try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`;
        const prompt = `คุณคือสัตว์เลี้ยงดิจิทัลแสนรู้ชื่อ ${currentPetData.name} วัย ${currentPetData.stage} เป็นคู่หูของเด็กชื่อ ${currentUser} มีนิสัยน่ารัก ซื่อสัตย์ อบอุ่น และคอยให้กำลังใจเด็กในการเรียนรู้และทำภารกิจประจำวัน ตอบกลับเด็กเป็นภาษาไทยสั้นๆ 1 ประโยค (ไม่เกิน 20 คำ) สำหรับเหตุการณ์นี้: "${eventDescription}"`;

        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }]
            })
        });

        if (!res.ok) throw new Error('Gemini API Error');
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        dialogueBox.innerText = text || localFallbacks[0];
    } catch (e) {
        dialogueBox.innerText = localFallbacks[Math.floor(Math.random() * localFallbacks.length)];
    }
}

function renderPetUI() {
    if (isParentUser || !currentUser) return;

    // Header Info
    const petTitle = document.getElementById('pet-name-badge');
    const petStage = document.getElementById('pet-stage-badge');
    const petLvl = document.getElementById('pet-level-badge');
    if (petTitle) petTitle.innerText = `🐾 สัตว์เลี้ยงของน้อง${currentUser}: ${currentPetData.name}`;
    if (petStage) petStage.innerText = currentPetData.stage;
    if (petLvl) petLvl.innerText = `Lv. ${currentPetData.level}`;

    // EXP Bar
    const expFill = document.getElementById('pet-exp-fill');
    const expVal = document.getElementById('pet-exp-val');
    if (expFill) expFill.style.width = `${Math.min(100, Math.round((currentPetData.exp / currentPetData.maxExp) * 100))}%`;
    if (expVal) expVal.innerText = `${currentPetData.exp} / ${currentPetData.maxExp} EXP`;

    // 3 Meters
    const meterEnergy = document.getElementById('pet-meter-energy');
    const meterMind = document.getElementById('pet-meter-mind');
    const meterHappiness = document.getElementById('pet-meter-happiness');
    if (meterEnergy) meterEnergy.style.width = `${currentPetData.energy}%`;
    if (meterMind) meterMind.style.width = `${currentPetData.mind}%`;
    if (meterHappiness) meterHappiness.style.width = `${currentPetData.happiness}%`;

    // Inventory Counts
    const countK = document.getElementById('pet-item-count-knowledge');
    const countF = document.getElementById('pet-item-count-fitness');
    const countW = document.getElementById('pet-item-count-wealth');
    if (countK) countK.innerText = `x${currentPetData.inventory.knowledge || 0}`;
    if (countF) countF.innerText = `x${currentPetData.inventory.fitness || 0}`;
    if (countW) countW.innerText = `x${currentPetData.inventory.wealth || 0}`;

    // Visual SVG Styling based on Form
    const bodyCircle = document.getElementById('pet-svg-body');
    const crown = document.getElementById('pet-svg-crown');
    const wings = document.getElementById('pet-svg-wings');

    if (bodyCircle) {
        if (currentPetData.form === 'sage') {
            bodyCircle.setAttribute('fill', '#818cf8');
            if (crown) crown.classList.remove('hidden');
            if (wings) wings.classList.add('hidden');
        } else if (currentPetData.form === 'warrior') {
            bodyCircle.setAttribute('fill', '#34d399');
            if (crown) crown.classList.add('hidden');
            if (wings) wings.classList.remove('hidden');
        } else if (currentPetData.form === 'royal') {
            bodyCircle.setAttribute('fill', '#fbbf24');
            if (crown) crown.classList.remove('hidden');
            if (wings) wings.classList.add('hidden');
        } else if (currentPetData.form === 'guardian') {
            bodyCircle.setAttribute('fill', '#c084fc');
            if (crown) crown.classList.remove('hidden');
            if (wings) wings.classList.remove('hidden');
        } else if (currentPetData.form === 'teen') {
            bodyCircle.setAttribute('fill', '#60a5fa');
            if (crown) crown.classList.add('hidden');
            if (wings) wings.classList.add('hidden');
        } else {
            bodyCircle.setAttribute('fill', '#f472b6');
            if (crown) crown.classList.add('hidden');
            if (wings) wings.classList.add('hidden');
        }
    }
}
