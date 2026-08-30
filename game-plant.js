// ==========================================
// --- MINI GAME: PLANT & FLOWER SCANNER AI ---
// ==========================================

let plantStream = null;
let currentPlantBase64 = "";
let currentPlantData = null;
let plantFilter = 'all';

// ย่อขนาดรูปสูงสุดไม่เกิน 400px และบีบอัดคุณภาพเหลือ 30% (0.3)
function compressPlantImage(src, maxWidth = 400, maxHeight = 400, quality = 0.3) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = Math.round((width * maxHeight) / height);
                    height = maxHeight;
                }
            }

            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = width;
            tempCanvas.height = height;
            const ctx = tempCanvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = tempCanvas.toDataURL('image/jpeg', quality);
            resolve(compressedDataUrl);
        };
        img.src = src;
    });
}

async function startPlantCamera() {
    try {
        const preview = document.getElementById('plant-preview-img');
        const webcam = document.getElementById('plant-webcam');
        const startCamBtn = document.getElementById('btn-start-plant-cam');
        const captureBtn = document.getElementById('btn-capture-plant-cam');

        if (preview) preview.classList.add('hidden');
        
        plantStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            audio: false
        });
        if (webcam) {
            webcam.srcObject = plantStream;
            webcam.classList.remove('hidden');
        }
        if (startCamBtn) startCamBtn.classList.add('hidden');
        if (captureBtn) captureBtn.classList.remove('hidden');
    } catch (err) {
        alert('ไม่สามารถเข้าถึงกล้องได้: ' + err.message);
    }
}

async function capturePlantPhoto() {
    if (!plantStream) return;
    const webcam = document.getElementById('plant-webcam');
    const canvas = document.createElement('canvas');
    canvas.width = webcam.videoWidth || 640;
    canvas.height = webcam.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(webcam, 0, 0, canvas.width, canvas.height);

    const rawDataUrl = canvas.toDataURL('image/jpeg');
    const compressedDataUrl = await compressPlantImage(rawDataUrl, 400, 400, 0.3);

    const preview = document.getElementById('plant-preview-img');
    if (preview) {
        preview.src = compressedDataUrl;
        preview.classList.remove('hidden');
    }
    currentPlantBase64 = compressedDataUrl.split(',')[1];
    stopPlantCamera();
}

function stopPlantCamera() {
    if (plantStream) {
        plantStream.getTracks().forEach(track => track.stop());
        plantStream = null;
    }
    const webcam = document.getElementById('plant-webcam');
    const startCamBtn = document.getElementById('btn-start-plant-cam');
    const captureBtn = document.getElementById('btn-capture-plant-cam');

    if (webcam) webcam.classList.add('hidden');
    if (startCamBtn) startCamBtn.classList.remove('hidden');
    if (captureBtn) captureBtn.classList.add('hidden');
}

async function handlePlantFileSelect(event) {
    stopPlantCamera();
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = async function(e) {
            const compressedDataUrl = await compressPlantImage(e.target.result, 400, 400, 0.3);
            const preview = document.getElementById('plant-preview-img');
            if (preview) {
                preview.src = compressedDataUrl;
                preview.classList.remove('hidden');
            }
            currentPlantBase64 = compressedDataUrl.split(',')[1];
        };
        reader.readAsDataURL(file);
    }
}

async function analyzePlantWithAI() {
    const apiKey = localStorage.getItem("gemini_api_key");
    if (!apiKey) {
        alert('กรุณากรอก Gemini API Key ในเมนูตั้งค่าก่อนครับ');
        openKeyModal();
        return;
    }

    if (!currentPlantBase64) {
        alert('กรุณาเลือกรูปภาพหรือถ่ายรูปต้นไม้/ดอกไม้ก่อนครับ');
        return;
    }

    const analyzeBtn = document.getElementById('btn-analyze-plant');
    const loadingEl = document.getElementById('plant-ai-loading');
    const resultDiv = document.getElementById('plant-result-box');

    if (analyzeBtn) { analyzeBtn.disabled = true; analyzeBtn.classList.add('opacity-50'); }
    if (loadingEl) loadingEl.classList.remove('hidden');
    if (resultDiv) resultDiv.classList.add('hidden');

    const modelName = "gemini-3.5-flash-lite";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const promptText = `วิเคราะห์ภาพต้นไม้หรือดอกไม้นี้แล้วตอบกลับเป็นรูปแบบ JSON ภาษาไทยเท่านั้น โดยใช้โครงสร้างตามนี้:
{
    "commonName": "ชื่อภาษาไทยหรือชื่อสามัญ",
    "scientificName": "ชื่อวิทยาศาสตร์",
    "category": "ระบุหมวดหมู่จากตัวเลือกนี้เท่านั้น: ไม้ดอก, ไม้ใบ, แคคตัส, ไม้ผล, หรือ อื่นๆ",
    "careGuide": "อธิบายวิธีการดูแลสั้นๆ (ปริมาณแสงแดด การให้น้ำ และชนิดดิน)",
    "toxicity": "ระบุความปลอดภัยว่าเป็นพิษต่อเด็ก สุนัข หรือแมวหรือไม่",
    "highlights": "อธิบายจุดเด่น ประโยชน์ หรือความหมายสิริมงคล"
}`;

    const payload = {
        contents: [
            {
                parts: [
                    { text: promptText },
                    {
                        inline_data: {
                            mime_type: "image/jpeg",
                            data: currentPlantBase64
                        }
                    }
                ]
            }
        ],
        generationConfig: {
            response_mime_type: "application/json"
        }
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.error) {
            alert('เกิดข้อผิดพลาดจาก API: ' + data.error.message);
        } else {
            const textResult = data.candidates[0].content.parts[0].text;
            const plantInfo = JSON.parse(textResult);

            currentPlantData = {
                id: Date.now().toString(),
                ...plantInfo,
                image: 'data:image/jpeg;base64,' + currentPlantBase64,
                timestamp: new Date().toLocaleDateString('th-TH')
            };

            document.getElementById('plant-res-name').innerText = plantInfo.commonName || "ไม่ทราบชื่อ";
            document.getElementById('plant-res-sci').innerText = plantInfo.scientificName || "-";
            document.getElementById('plant-res-cat').innerText = plantInfo.category || "-";
            document.getElementById('plant-res-care').innerText = plantInfo.careGuide || "-";
            document.getElementById('plant-res-tox').innerText = plantInfo.toxicity || "-";
            document.getElementById('plant-res-high').innerText = plantInfo.highlights || "-";

            if (resultDiv) resultDiv.classList.remove('hidden');
        }
    } catch (error) {
        alert('เกิดข้อผิดพลาดในการวิเคราะห์: ' + error.message);
    } finally {
        if (analyzeBtn) { analyzeBtn.disabled = false; analyzeBtn.classList.remove('opacity-50'); }
        if (loadingEl) loadingEl.classList.add('hidden');
    }
}

function getChildPlantLibraryKey(childName) {
    const user = childName || currentUser || 'guest';
    return `plant_library_${user}`;
}

function getChildPlantMilestoneKey(childName) {
    const user = childName || currentUser || 'guest';
    return `plant_milestones_${user}`;
}

function savePlantToLibrary() {
    if (!currentPlantData) return;
    const child = currentUser || 'พูน';
    const storageKey = getChildPlantLibraryKey(child);
    let library = JSON.parse(localStorage.getItem(storageKey) || '[]');

    library.unshift(currentPlantData);
    localStorage.setItem(storageKey, JSON.stringify(library));

    if (isFirebaseActive) {
        const { ref, set } = window.firebaseModules;
        const db = window.firebaseModules.getDatabase();
        set(ref(db, `plant_library/${child}`), library);
    }

    alert(`บันทึก ${currentPlantData.commonName} ลงคลังเรียบร้อยแล้ว!`);
    
    // ตรวจสอบเงื่อนไขสะสมพรรณไม้ครบทุกๆ 10 ชนิดเพื่อรับ 1 ดาว ⭐ + 100 EXP
    checkPlantMilestoneReward(child, library);

    renderPlantLibrary();
    document.getElementById('plant-result-box').classList.add('hidden');
}

function checkPlantMilestoneReward(childName, libraryList) {
    if (!childName || isParentUser) return;

    // คำนวณจำนวนชนิดที่ไม่ซ้ำกัน
    const uniqueSpecies = new Set();
    libraryList.forEach(item => {
        const key = (item.scientificName && item.scientificName !== '-') ? item.scientificName.toLowerCase() : item.commonName.trim();
        if (key) uniqueSpecies.add(key);
    });

    const uniqueCount = uniqueSpecies.size;
    const milesKey = getChildPlantMilestoneKey(childName);
    let awardedMilestones = JSON.parse(localStorage.getItem(milesKey) || '[]');

    // สะสมครบทุกๆ 10 ชนิด รับ 1 ดาว + 100 EXP
    const targetMilestoneLevel = Math.floor(uniqueCount / 10);

    if (targetMilestoneLevel > 0) {
        let newlyAwarded = 0;
        for (let i = 1; i <= targetMilestoneLevel; i++) {
            const milestoneTarget = i * 10;
            if (!awardedMilestones.includes(milestoneTarget)) {
                awardedMilestones.push(milestoneTarget);
                newlyAwarded++;
            }
        }

        if (newlyAwarded > 0) {
            localStorage.setItem(milesKey, JSON.stringify(awardedMilestones));
            const totalStarsEarned = newlyAwarded * 1;
            const totalExpEarned = newlyAwarded * 100;

            totalStars += totalStarsEarned;
            saveUserStars();
            addEXPToUser(totalExpEarned);

            sendInAppNotification('PLANT_MILESTONE', {
                count: uniqueCount,
                stars: totalStarsEarned,
                exp: totalExpEarned
            });

            alert(`🎉 ยินดีด้วยน้อง ${childName}!\nสะสมพรรณไม้ครบ ${targetMilestoneLevel * 10} ชนิดแล้ว!\n⭐ ได้รับ +${totalStarsEarned} ดาว และ ✨ +${totalExpEarned} EXP!`);
        }
    }
}

function deletePlantFromLibrary(event, index) {
    event.stopPropagation();
    const child = currentUser || 'พูน';
    const storageKey = getChildPlantLibraryKey(child);
    let library = JSON.parse(localStorage.getItem(storageKey) || '[]');
    library.splice(index, 1);
    localStorage.setItem(storageKey, JSON.stringify(library));

    if (isFirebaseActive) {
        const { ref, set } = window.firebaseModules;
        const db = window.firebaseModules.getDatabase();
        set(ref(db, `plant_library/${child}`), library);
    }
    renderPlantLibrary();
}

function setPlantFilter(category, btnElement) {
    plantFilter = category;
    document.querySelectorAll('.plant-filter-btn').forEach(btn => {
        btn.className = "plant-filter-btn px-3 py-1 text-xs font-bold bg-slate-100 text-slate-600 rounded-full transition hover:bg-slate-200";
    });
    btnElement.className = "plant-filter-btn px-3 py-1 text-xs font-bold bg-emerald-600 text-white rounded-full shadow-xs transition";
    renderPlantLibrary();
}

function renderPlantLibrary() {
    const libraryList = document.getElementById('plant-library-list');
    const badgeCountEl = document.getElementById('plant-unique-count-tag');
    if (!libraryList) return;

    const child = currentUser || 'พูน';
    const storageKey = getChildPlantLibraryKey(child);
    let library = JSON.parse(localStorage.getItem(storageKey) || '[]');

    const uniqueSpecies = new Set();
    library.forEach(item => {
        const key = (item.scientificName && item.scientificName !== '-') ? item.scientificName.toLowerCase() : item.commonName.trim();
        if (key) uniqueSpecies.add(key);
    });

    if (badgeCountEl) {
        badgeCountEl.innerText = `สะสมได้ ${uniqueSpecies.size} ชนิด (${uniqueSpecies.size % 10}/10 สู่ดาว ⭐ ดอกถัดไป)`;
    }

    let filteredLibrary = library;
    if (plantFilter !== 'all') {
        filteredLibrary = library.filter(item => item.category && item.category.includes(plantFilter));
    }

    if (filteredLibrary.length === 0) {
        libraryList.innerHTML = '<p class="text-center text-slate-400 text-xs py-6 font-bold">ไม่พบรายการพรรณไม้ในหมวดหมู่นี้</p>';
        return;
    }

    libraryList.innerHTML = filteredLibrary.map((item, index) => {
        const originalIndex = library.indexOf(item);
        return `
            <div class="bg-white border border-slate-200 rounded-2xl p-2.5 flex items-center gap-3 shadow-2xs hover:shadow-xs transition cursor-pointer" onclick="openPlantDetailModal(${originalIndex})">
                <img src="${item.image}" alt="${item.commonName}" class="w-16 h-16 object-cover rounded-xl border border-slate-100 flex-shrink-0">
                <div class="flex-1 min-w-0">
                    <h4 class="font-bold text-slate-800 text-xs truncate font-kids">${item.commonName}</h4>
                    <p class="text-[10px] text-slate-400 italic truncate">${item.scientificName || '-'}</p>
                    <div class="flex items-center gap-1 mt-1">
                        <span class="bg-emerald-50 text-emerald-700 text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-100">${item.category || 'พรรณไม้'}</span>
                        <span class="text-[9px] text-slate-400">${item.timestamp || ''}</span>
                    </div>
                </div>
                <button onclick="deletePlantFromLibrary(event, ${originalIndex})" class="bg-rose-50 text-rose-700 hover:bg-rose-100 p-1.5 rounded-xl text-xs font-bold border border-rose-200 flex-shrink-0">🗑️</button>
            </div>
        `;
    }).join('');
}

function openPlantDetailModal(index) {
    const child = currentUser || 'พูน';
    const storageKey = getChildPlantLibraryKey(child);
    let library = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const item = library[index];
    if (!item) return;

    document.getElementById('modal-plant-img').src = item.image;
    document.getElementById('modal-plant-name').innerText = item.commonName || "ไม่ทราบชื่อ";
    document.getElementById('modal-plant-sci').innerText = item.scientificName || "-";
    document.getElementById('modal-plant-cat').innerText = item.category || "-";
    document.getElementById('modal-plant-care').innerText = item.careGuide || "-";
    document.getElementById('modal-plant-tox').innerText = item.toxicity || "-";
    document.getElementById('modal-plant-high').innerText = item.highlights || "-";

    document.getElementById('plant-detail-modal').classList.remove('hidden');
}

function closePlantDetailModal() {
    document.getElementById('plant-detail-modal').classList.add('hidden');
}

function initPlantGame() {
    renderPlantLibrary();
}
