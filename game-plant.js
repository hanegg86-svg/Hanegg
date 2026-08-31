// game-plant.js - ระบบมินิเกมสำรวจพรรณไม้ด้วย AI พร้อมระบบตรวจจับและอัปเกรดต้นไม้ซ้ำ

let plantStream = null;
let plantCapturedBase64 = null;
let currentPlantResult = null;
let currentPlantFilter = 'all';

// ฟังก์ชันกลางสำหรับย่อขนาดและบีบอัดรูปภาพให้อยู่ในเกณฑ์ไม่เกิน 50 KB
function compressImageToLimit(imgSource, maxDim = 320, maxKb = 50) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        let width = imgSource.videoWidth || imgSource.naturalWidth || imgSource.width || 320;
        let height = imgSource.videoHeight || imgSource.naturalHeight || imgSource.height || 240;

        if (width > height) {
            if (width > maxDim) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
            }
        } else {
            if (height > maxDim) {
                width = Math.round((height * maxDim) / height);
                height = maxDim;
            }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(imgSource, 0, 0, width, height);

        let quality = 0.75;
        let resultBase64 = canvas.toDataURL('image/jpeg', quality);

        while (quality > 0.2) {
            const sizeKb = (resultBase64.length * 0.75) / 1024;
            if (sizeKb <= maxKb) break;
            quality -= 0.1;
            resultBase64 = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(resultBase64);
    });
}

// ฟังก์ชันสำหรับผู้ปกครอง: บีบอัดรูปพรรณไม้เก่าทั้งหมดของเด็กๆ (พูน และ เพลิน) ให้เหลือ <= 50 KB
async function batchOptimizeOldPlantImages() {
    if (!isParentUser) {
        alert("เฉพาะ พ่อนะ และ แม่พัด เท่านั้นที่ใช้งานฟังก์ชันนี้ได้ครับ!");
        return;
    }

    if (!confirm("คุณต้องการบีบอัดรูปพรรณไม้เก่าทั้งหมดของน้องพูนและน้องเพลินให้เหลือไม่เกิน 50 KB ใช่หรือไม่?")) return;

    let optimizedCount = 0;
    const children = ['พูน', 'เพลิน'];

    for (let child of children) {
        let childLibrary = [];
        if (isFirebaseActive) {
            try {
                const { ref, get } = window.firebaseModules;
                const db = window.firebaseModules.getDatabase();
                const snapshot = await get(ref(db, `user_plant_library/${child}`));
                const val = snapshot.val();
                if (val) {
                    childLibrary = Array.isArray(val) ? val : Object.values(val);
                }
            } catch (e) {
                console.error(`Error fetching plant library for ${child}:`, e);
            }
        } else {
            const localData = localStorage.getItem(`user_plant_library_${child}`);
            if (localData) {
                try { childLibrary = JSON.parse(localData); } catch (e) {}
            }
        }

        if (childLibrary && childLibrary.length > 0) {
            let updated = false;
            for (let plant of childLibrary) {
                if (plant.image && plant.image.startsWith('data:image')) {
                    await new Promise((resolve) => {
                        const img = new Image();
                        img.onload = async () => {
                            const compressed = await compressImageToLimit(img, 320, 50);
                            plant.image = compressed;
                            optimizedCount++;
                            updated = true;
                            resolve();
                        };
                        img.onerror = () => resolve();
                        img.src = plant.image;
                    });
                }
            }

            if (updated) {
                if (isFirebaseActive) {
                    const { ref, set } = window.firebaseModules;
                    const db = window.firebaseModules.getDatabase();
                    await set(ref(db, `user_plant_library/${child}`), childLibrary);
                }
                localStorage.setItem(`user_plant_library_${child}`, JSON.stringify(childLibrary));
            }
        }
    }

    if (typeof loadUserStars === 'function') loadUserStars();
    alert(`🎉 บีบอัดรูปภาพพรรณไม้เก่าของเด็กๆ สำเร็จทั้งหมด ${optimizedCount} รูป! ประหยัดพื้นที่จัดเก็บเรียบร้อยแล้ว`);
}

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

// 2. ถ่ายภาพจาก กล้อง WebCam พร้อมบีบอัดภาพให้อยู่ในเกณฑ์ <= 50 KB
async function capturePlantPhoto() {
    const video = document.getElementById('plant-webcam');
    const previewImg = document.getElementById('plant-preview-img');
    const btnStart = document.getElementById('btn-start-plant-cam');
    const btnCapture = document.getElementById('btn-capture-plant-cam');

    plantCapturedBase64 = await compressImageToLimit(video, 320, 50);

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

// 3. เลือกไฟล์รูปภาพจากคลังรูป พร้อมบีบอัดภาพให้อยู่ในเกณฑ์ <= 50 KB
function handlePlantFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const img = new Image();
        img.onload = async function () {
            plantCapturedBase64 = await compressImageToLimit(img, 320, 50);

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
        img.src = e.target.result;
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

    const nameTh = (currentPlantResult.nameTh || "").trim();
    if (!nameTh || nameTh === "ไม่ทราบชื่อ" || nameTh === "-" || nameTh.toLowerCase() === "unknown") {
        alert("⚠️ ไม่สามารถระบุชนิดพรรณไม้ได้ชัดเจน กรุณาลองถ่ายรูปใหม่อีกครั้งให้ชัดเจนครับ");
        return;
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
        const existingPlant = library[existingIndex];
        existingPlant.count = (existingPlant.count || 1) + 1;
        existingPlant.level = (existingPlant.level || 1) + 1;
        existingPlant.lastUpdated = new Date().toISOString();
        existingPlant.image = currentPlantResult.image;

        alert(`🌿 หนูเคยสะสม [${existingPlant.nameTh}] ไปแล้ว!\n✨ อัปเกรดการ์ดเป็น Lv.${existingPlant.level} (สแกนแล้ว ${existingPlant.count} ครั้ง)\n(ชนิดซ้ำเดิม ไม่ได้รับ EXP เพิ่มเติม)`);

    } else {
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
        const bonusEXP = 10;
        if (typeof addEXPToUser === 'function') addEXPToUser(bonusEXP);

        if (uniqueCount % 10 === 0) {
            if (typeof addStar === 'function') addStar();
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

// 6. แสดงรายการคลังพรรณไม้ พร้อมควบคุมการแสดงผลปุ่มผู้ปกครอง
function renderPlantLibrary() {
    const container = document.getElementById('plant-library-list');
    const uniqueCountTag = document.getElementById('plant-unique-count-tag');
    const parentToolsBox = document.getElementById('parent-plant-tools-box');

    if (parentToolsBox) {
        if (isParentUser) {
            parentToolsBox.classList.remove('hidden');
        } else {
            parentToolsBox.classList.add('hidden');
        }
    }

    if (!container) return;

    const library = (window.currentUserData && window.currentUserData.plantLibrary) ? window.currentUserData.plantLibrary : [];

    const uniqueCount = library.length;
    const progressToStar = uniqueCount % 10;
    if (uniqueCountTag) {
        if (isParentUser) {
            uniqueCountTag.innerText = `คลังรวมเด็กๆ ${uniqueCount} รายการ (พ่อนะ/แม่พัด)`;
        } else {
            uniqueCountTag.innerText = `สะสมได้ ${uniqueCount} ชนิด (${progressToStar}/10 สู่ดาว ⭐ ดอกถัดไป)`;
        }
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
                        ${item.owner ? `<span class="bg-indigo-100 text-indigo-800 font-bold text-[9px] px-1.5 py-0.2 rounded-md">ของ: ${item.owner}</span>` : ''}
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

    if (isParentUser) {
        const library = (window.currentUserData && window.currentUserData.plantLibrary) ? window.currentUserData.plantLibrary : [];
        const targetPlant = library.find(p => p.id === plantId);
        const targetOwner = targetPlant ? targetPlant.owner : null;

        if (targetOwner) {
            if (isFirebaseActive) {
                const { ref, get, set } = window.firebaseModules;
                const db = window.firebaseModules.getDatabase();
                get(ref(db, `user_plant_library/${targetOwner}`)).then(snapshot => {
                    let childLib = snapshot.val() || [];
                    if (!Array.isArray(childLib)) childLib = Object.values(childLib);
                    childLib = childLib.filter(p => p.id !== plantId);
                    set(ref(db, `user_plant_library/${targetOwner}`), childLib);
                    localStorage.setItem(`user_plant_library_${targetOwner}`, JSON.stringify(childLib));
                });
            } else {
                let localLib = JSON.parse(localStorage.getItem(`user_plant_library_${targetOwner}`) || "[]");
                localLib = localLib.filter(p => p.id !== plantId);
                localStorage.setItem(`user_plant_library_${targetOwner}`, JSON.stringify(localLib));
                if (typeof loadUserStars === 'function') loadUserStars();
            }
        }
    } else {
        if (window.currentUserData && window.currentUserData.plantLibrary) {
            window.currentUserData.plantLibrary = window.currentUserData.plantLibrary.filter(p => p.id !== plantId);
            if (typeof saveUserData === 'function') saveUserData();
            renderPlantLibrary();
        }
    }
}
