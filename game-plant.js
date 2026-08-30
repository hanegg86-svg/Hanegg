// game-plant.js - ระบบมินิเกมสำรวจพรรณไม้ด้วย AI พร้อมระบบตรวจจับและอัปเกรดต้นไม้ซ้ำ

let plantStream = null;
let plantCapturedBase64 = null;
let currentPlantResult = null;
let currentPlantFilter = 'all';

// 1. เปิดกล้องสำหรับสแกนพรรณไม้
async function startPlantCamera() {
    const video = document.getElementById('plant-webcam');
    const placeholder = document.getElementById('plant-cam-placeholder');
    const previewImg = document.getElementById('plant-preview-img');
    const btnStart = document.getElementById('btn-start-plant-cam');
    const btnCapture = document.getElementById('btn-capture-plant-cam');

    try {
        plantStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "environment" } }
        });
        video.srcObject = plantStream;
        video.classList.remove('hidden');
        placeholder.classList.add('hidden');
        previewImg.classList.add('hidden');
        btnStart.classList.add('hidden');
        btnCapture.classList.remove('hidden');
    } catch (err) {
        alert("ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตการใช้งานกล้องในเบราว์เซอร์");
        console.error("Camera error:", err);
    }
}

// 2. ถ่ายภาพจาก กล้อง WebCam
function capturePlantPhoto() {
    const video = document.getElementById('plant-webcam');
    const previewImg = document.getElementById('plant-preview-img');
    const btnStart = document.getElementById('btn-start-plant-cam');
    const btnCapture = document.getElementById('btn-capture-plant-cam');

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    plantCapturedBase64 = canvas.toDataURL('image/jpeg', 0.85);

    if (plantStream) {
        plantStream.getTracks().forEach(track => track.stop());
        plantStream = null;
    }

    video.classList.add('hidden');
    previewImg.src = plantCapturedBase64;
    previewImg.classList.remove('hidden');
    btnStart.classList.remove('hidden');
    btnCapture.classList.add('hidden');
}

// 3. เลือกไฟล์รูปภาพจากคลังรูป
function handlePlantFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        plantCapturedBase64 = e.target.result;

        const video = document.getElementById('plant-webcam');
        const placeholder = document.getElementById('plant-cam-placeholder');
        const previewImg = document.getElementById('plant-preview-img');

        if (plantStream) {
            plantStream.getTracks().forEach(track => track.stop());
            plantStream = null;
        }

        video.classList.add('hidden');
        placeholder.classList.add('hidden');
        previewImg.src = plantCapturedBase64;
        previewImg.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

// 4. วิเคราะห์พรรณไม้ด้วย Gemini API (ระบุ Model: Gemini Flash Lite 3.5)
async function analyzePlantWithAI() {
    if (!plantCapturedBase64) {
        alert("กรุณาถ่ายรูปหรือเลือกรูปภาพต้นไม้ก่อนครับ");
        return;
    }

    const apiKey = localStorage.getItem('gemini_api_key') || window.geminiApiKey;
    if (!apiKey) {
        alert("กรุณาตั้งค่า Gemini API Key ในเมนูตั้งค่าก่อนใช้งานครับ");
        return;
    }

    const loadingEl = document.getElementById('plant-ai-loading');
    const resultBox = document.getElementById('plant-result-box');
    const btnAnalyze = document.getElementById('btn-analyze-plant');

    loadingEl.classList.remove('hidden');
    resultBox.classList.add('hidden');
    btnAnalyze.disabled = true;

    const base64Data = plantCapturedBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    const prompt = `วิเคราะห์รูปภาพพรรณไม้หรือดอกไม้นี้ และตอบกลับในรูปแบบ JSON วัตถุบริสุทธิ์เท่านั้น (ไม่เอา markdown หรือ text อื่น):
{
  "nameTh": "ชื่อต้นไม้ภาษาไทย",
  "nameSci": "ชื่อวิทยาศาสตร์ (Scientific Name)",
  "category": "เลือกจาก: ไม้ดอก / ไม้ใบ / แคคตัส / ไม้ผล / พืชผักสวนครัว / อื่นๆ",
  "care": "อธิบายการดูแลสั้นๆ เหมาะสำหรับเด็ก (เช่น รดน้ำวันละครั้ง ชอบแดดปานกลาง)",
  "toxicity": "ปลอดภัยสำหรับสัตว์เลี้ยงและเด็กหรือไม่ (เช่น ปลอดภัย / มีพิษหากรับประทาน)",
  "highlight": "จุดเด่นหรือประโยชน์สั้นๆ 1 ประโยค"
}`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: prompt },
                        { inline_data: { mime_type: "image/jpeg", data: base64Data } }
                    ]
                }]
            })
        });

        const data = await response.json();
        let textResult = data.candidates[0].content.parts[0].text;
        textResult = textResult.replace(/```json/g, '').replace(/```/g, '').trim();

        currentPlantResult = JSON.parse(textResult);
        currentPlantResult.image = plantCapturedBase64;

        document.getElementById('plant-res-name').innerText = currentPlantResult.nameTh || "ไม่ทราบชื่อ";
        document.getElementById('plant-res-sci').innerText = currentPlantResult.nameSci || "-";
        document.getElementById('plant-res-cat').innerText = currentPlantResult.category || "ไม้ใบ";
        document.getElementById('plant-res-care').innerText = currentPlantResult.care || "-";
        document.getElementById('plant-res-tox').innerText = currentPlantResult.toxicity || "ปลอดภัย";
        document.getElementById('plant-res-high').innerText = currentPlantResult.highlight || "-";

        resultBox.classList.remove('hidden');
    } catch (err) {
        console.error("Plant AI Error:", err);
        alert("ไม่สามารถวิเคราะห์รูปภาพได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
        loadingEl.classList.add('hidden');
        btnAnalyze.disabled = false;
    }
}

// 5. บันทึกลงคลังพรรณไม้ (พร้อมระบบเรียกคืนโปรไฟล์อัตโนมัติหากหลุด)
function savePlantToLibrary() {
    if (!currentPlantResult) return;

    // กู้คืนโปรไฟล์ผู้ใช้จาก LocalStorage หากค่า currentUser เป็น null
    if (!currentUser) {
        const lastUser = localStorage.getItem("last_active_user");
        const lastIsParent = localStorage.getItem("last_is_parent") === "true";
        if (lastUser && typeof setProfile === 'function') {
            setProfile(lastUser, lastIsParent);
        } else {
            alert("กรุณาเลือกผู้ใช้ก่อนบันทึกครับ");
            if (typeof openProfileModal === 'function') openProfileModal();
            return;
        }
    }

    if (!window.currentUserData) {
        window.currentUserData = { plantLibrary: [] };
    }

    if (!window.currentUserData.plantLibrary) {
        window.currentUserData.plantLibrary = [];
    }

    const library = window.currentUserData.plantLibrary;

    const normSci = (currentPlantResult.nameSci || '').toLowerCase().trim();
    const normTh = (currentPlantResult.nameTh || '').replace(/^(ต้น|ดอก)/, '').trim().toLowerCase();

    const existingIndex = library.findIndex(item => {
        const itemSci = (item.nameSci || '').toLowerCase().trim();
        const itemTh = (item.nameTh || '').replace(/^(ต้น|ดอก)/, '').trim().toLowerCase();
        
        return (normSci && itemSci === normSci) || (normTh && itemTh === normTh);
    });

    if (existingIndex !== -1) {
        // กรณีซ้ำ: อัปเกรดการ์ดแต่ไม่แจก EXP
        const existingPlant = library[existingIndex];
        existingPlant.count = (existingPlant.count || 1) + 1;
        existingPlant.level = (existingPlant.level || 1) + 1;
        existingPlant.lastUpdated = new Date().toISOString();
        existingPlant.image = currentPlantResult.image;

        alert(`🌿 หนูเคยสะสม [${existingPlant.nameTh}] ไปแล้ว!\n✨ อัปเกรดการ์ดเป็น Lv.${existingPlant.level} (สแกนแล้ว ${existingPlant.count} ครั้ง)\n(ถ่ายต้นไม้ซ้ำชนิดเดิม จะไม่ได้ EXP เพิ่มนะครับ)`);

    } else {
        // กรณีชนิดใหม่: เพิ่มเข้าคลัง +10 EXP และตรวจสอบเงื่อนไขรับดาวเมื่อครบทุก 10 ชนิด
        const newPlant = {
            id: 'plant_' + Date.now(),
            nameTh: currentPlantResult.nameTh,
            nameSci: currentPlantResult.nameSci,
            category: currentPlantResult.category,
            care: currentPlantResult.care,
            toxicity: currentPlantResult.toxicity,
            highlight: currentPlantResult.highlight,
            image: currentPlantResult.image,
            level: 1,
            count: 1,
            createdAt: new Date().toISOString()
        };

        library.push(newPlant);

        const uniqueCount = library.length;
        const bonusEXP = 10; // ให้ 10 EXP สำหรับชนิดใหม่
        if (typeof addEXPToUser === 'function') addEXPToUser(bonusEXP);

        if (uniqueCount % 10 === 0) {
            if (typeof addStar === 'function') {
                addStar();
            } else if (typeof saveUserStars === 'function') {
                totalStars += 1;
                saveUserStars();
            }
            alert(`🎉 ยินดีด้วย! สะสมพรรณไม้ชนิดใหม่ครบ ${uniqueCount} ชนิดแล้ว!\n⭐ รับดาวสะสม +1 ดวง และ +${bonusEXP} EXP!`);
        } else {
            const leftToStar = 10 - (uniqueCount % 10);
            alert(`🎉 บันทึก [${newPlant.nameTh}] ชนิดใหม่สำเร็จ!\n✨ รับ +${bonusEXP} EXP (สะสมอีก ${leftToStar} ชนิดเพื่อรับดาว ⭐)`);
        }
    }

    if (typeof saveUserData === 'function') saveUserData();

    document.getElementById('plant-result-box').classList.add('hidden');
    currentPlantResult = null;
    renderPlantLibrary();
}

// 6. แสดงรายการคลังพรรณไม้
function renderPlantLibrary() {
    const container = document.getElementById('plant-library-list');
    const uniqueCountTag = document.getElementById('plant-unique-count-tag');
    if (!container) return;

    const library = (window.currentUserData && window.currentUserData.plantLibrary) ? window.currentUserData.plantLibrary : [];

    const uniqueCount = library.length;
    const progressToStar = uniqueCount % 10;
    if (uniqueCountTag) {
        uniqueCountTag.innerText = `สะสมได้ ${uniqueCount} ชนิด (${progressToStar}/10 สู่ดาว ⭐ ดอกถัดไป)`;
    }

    let filtered = library;
    if (currentPlantFilter !== 'all') {
        filtered = library.filter(item => item.category === currentPlantFilter);
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="text-center py-6 text-slate-400 font-bold text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                🌱 ยังไม่มีพรรณไม้ในหมวดนี้ ถ่ายรูปสแกนสะสมเลย!
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(item => `
        <div class="bg-white border border-slate-200 hover:border-emerald-300 p-2.5 rounded-2xl flex items-center justify-between shadow-2xs transition">
            <div class="flex items-center gap-2.5 overflow-hidden cursor-pointer" onclick="openPlantDetailModal('${item.id}')">
                <img src="${item.image}" class="w-12 h-12 object-cover rounded-xl border border-slate-100 flex-shrink-0">
                <div class="truncate">
                    <div class="flex items-center gap-1.5">
                        <span class="font-extrabold text-slate-800 text-xs truncate font-kids">${item.nameTh}</span>
                        <span class="bg-emerald-100 text-emerald-800 font-black text-[9px] px-1.5 py-0.2 rounded-md">Lv.${item.level || 1}</span>
                    </div>
                    <p class="text-[10px] text-slate-400 italic truncate">${item.nameSci || '-'}</p>
                    <span class="text-[9px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full inline-block mt-0.5">${item.category || 'ไม้ใบ'}</span>
                </div>
            </div>

            <div class="flex items-center gap-1.5">
                <button onclick="openPlantDetailModal('${item.id}')" class="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold p-2 rounded-xl text-xs transition">
                    👁️
                </button>
                <button onclick="deletePlantItem('${item.id}')" class="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold p-2 rounded-xl text-xs transition">
                    🗑️
                </button>
            </div>
        </div>
    `).join('');
}

// 7. ฟิลเตอร์หมวดหมู่
function setPlantFilter(category, btnEl) {
    currentPlantFilter = category;
    document.querySelectorAll('.plant-filter-btn').forEach(btn => {
        btn.classList.remove('bg-emerald-600', 'text-white');
        btn.classList.add('bg-slate-100', 'text-slate-600');
    });

    if (btnEl) {
        btnEl.classList.remove('bg-slate-100', 'text-slate-600');
        btnEl.classList.add('bg-emerald-600', 'text-white');
    }

    renderPlantLibrary();
}

// 8. เปิด/ปิด Modal ดูรายละเอียด
function openPlantDetailModal(plantId) {
    const library = (window.currentUserData && window.currentUserData.plantLibrary) ? window.currentUserData.plantLibrary : [];
    const plant = library.find(p => p.id === plantId);
    if (!plant) return;

    document.getElementById('modal-plant-img').src = plant.image;
    document.getElementById('modal-plant-name').innerText = `${plant.nameTh} (Lv.${plant.level || 1})`;
    document.getElementById('modal-plant-sci').innerText = plant.nameSci || '-';
    document.getElementById('modal-plant-cat').innerText = plant.category || 'ไม้ใบ';
    document.getElementById('modal-plant-care').innerText = plant.care || '-';
    document.getElementById('modal-plant-tox').innerText = plant.toxicity || '-';
    document.getElementById('modal-plant-high').innerText = plant.highlight || '-';

    document.getElementById('plant-detail-modal').classList.remove('hidden');
}

function closePlantDetailModal() {
    document.getElementById('plant-detail-modal').classList.add('hidden');
}

// 9. ลบพรรณไม้ออกจากคลัง
function deletePlantItem(plantId) {
    if (!confirm("คุณต้องการลบพรรณไม้นี้ออกจากคลังหรือไม่?")) return;

    if (window.currentUserData && window.currentUserData.plantLibrary) {
        window.currentUserData.plantLibrary = window.currentUserData.plantLibrary.filter(p => p.id !== plantId);
        if (typeof saveUserData === 'function') saveUserData();
        renderPlantLibrary();
    }
}
