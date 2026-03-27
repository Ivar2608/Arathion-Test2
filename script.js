// --- CONFIG & UTILS ---
const galleryConfig = {
    folder: '', 
    files: [
        'image1.png', 'image2.png', 'image3.png', 'image4.png',
        'image5.png', 'image6.png', 'image7.png', 'image8.png',
        'image9.png', 'image_A.png', 'image_B.png', 'image_C.png',
        'image_D.png', 'image_E.png', 'image_F.png', 'image_G.png', 'image_H.png'
    ] 
};

const STATE = { IDLE: 'IDLE', SURGE: 'SURGE', COOLDOWN: 'COOLDOWN' };
let currentState = STATE.IDLE;
let currentPageId = 'portal'; 
let isTransitioning = false; 

let idleTarget = 15; 
let idleCurrent = 15; 
let lastRandomChange = 0;
let currentRotation = 0; 

// --- PARTIKEL SYSTEM ---
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let particles = [];

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        const oldWidth = canvas.width;
        const oldHeight = canvas.height;
        resizeCanvas();
        if (Math.abs(oldWidth - canvas.width) > 100 || Math.abs(oldHeight - canvas.height) > 100) {
            initParticles();
        }
    }, 150);
});

resizeCanvas();

class Particle {
    constructor() {
        this.reset();
        this.y = Math.random() * canvas.height; 
    }
    reset() {
        this.x = Math.random() * canvas.width;
        this.isSpark = Math.random() > 0.65; 
        
        if (this.isSpark) {
            this.y = canvas.height + 10; 
            this.size = Math.random() * 1.5 + 0.8;
            this.speedX = (Math.random() - 0.5) * 1.2;
            this.speedY = (Math.random() * -1.5) - 0.5; 
            this.opacity = Math.random() * 0.6 + 0.4;
            this.color = Math.random() > 0.5 ? `rgba(139, 92, 246, ${this.opacity})` : `rgba(59, 130, 246, ${this.opacity})`;
            this.glowColor = Math.random() > 0.5 ? `rgba(139, 92, 246, ${this.opacity * 0.25})` : `rgba(59, 130, 246, ${this.opacity * 0.25})`;
        } else {
            this.y = Math.random() * -100; 
            this.size = Math.random() * 2 + 0.5;
            this.speedX = (Math.random() - 0.5) * 0.5;
            this.speedY = Math.random() * 0.5 + 0.2; 
            this.opacity = Math.random() * 0.4 + 0.1;
            this.color = `rgba(168, 162, 158, ${this.opacity})`; 
            this.glowColor = 'transparent';
        }
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        
        if (this.isSpark && this.y < -10) {
            this.reset();
        } else if (!this.isSpark && this.y > canvas.height + 10) {
            this.reset();
        }
    }
    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        if(this.isSpark) {
            ctx.fillStyle = this.glowColor;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 3.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function initParticles() {
    particles = [];
    const particleCount = window.innerWidth < 768 ? 60 : 150;
    for (let i = 0; i < particleCount; i++) { 
        particles.push(new Particle());
    }
}
initParticles();

function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
        p.update();
        p.draw();
    });
}

// --- ROUTING SYSTEM & HASH URLs ---
window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '');
    if (hash && document.getElementById(hash) && localStorage.getItem('hasEnteredRift') === 'true') {
        if (hash !== currentPageId) switchPage(hash, true);
    }
});

function initRouting() {
    const hasEntered = localStorage.getItem('hasEnteredRift') === 'true';
    const nav = document.getElementById('main-nav');
    const footer = document.getElementById('main-footer');
    const portalPage = document.getElementById('portal');
    const homePage = document.getElementById('home');
    const welcomeTitle = document.getElementById('welcome-title');
    
    let visits = parseInt(localStorage.getItem('visitCount') || '0');

    if (!hasEntered) {
        nav.style.display = 'none';
        footer.style.display = 'none';
        portalPage.style.display = 'flex';
        portalPage.classList.add('page-active');
        homePage.style.display = 'none';
        homePage.classList.remove('page-active');
        currentPageId = 'portal';
    } else {
        nav.style.display = 'flex'; 
        footer.style.display = 'flex';
        portalPage.style.display = 'none';
        portalPage.classList.remove('page-active');
        
        let targetHash = window.location.hash.replace('#', '');
        if(!targetHash || !document.getElementById(targetHash)) {
            targetHash = 'home';
        }
        
        const startPage = document.getElementById(targetHash) || homePage;
        startPage.style.display = 'block';
        startPage.classList.add('page-active');
        currentPageId = targetHash;
        
        visits++;
        localStorage.setItem('visitCount', visits);
        
        if (visits > 1) {
            welcomeTitle.innerText = "Willkommen zurück";
        } else {
            welcomeTitle.innerText = "Willkommen";
        }
        
        document.querySelectorAll('.nav-btn').forEach(btn => {
            const isBone = btn.dataset.target === 'char';
            const activeColor = isBone ? 'text-bone-400' : 'text-rift-400';
            const activeBorder = isBone ? 'border-bone-500' : 'border-rift-500';
            
            if(btn.dataset.target === targetHash) {
                btn.classList.add(activeColor, activeBorder); 
                btn.classList.remove('text-gray-400', 'border-transparent');
            } else {
                btn.classList.remove(activeColor, activeBorder); 
                btn.classList.add('text-gray-400', 'border-transparent');
            }
        });
    }
}

// --- EPIC PORTAL ENTRY ---
function enterRift() {
    if (currentState !== STATE.IDLE || isTransitioning) return;
    
    currentState = STATE.SURGE;
    isTransitioning = true;
    
    const loader = document.getElementById('rift-loader');
    const tear = document.getElementById('tear-element');
    const aura = document.getElementById('rift-aura');
    const text = document.getElementById('rift-text');
    const nav = document.getElementById('main-nav');
    const footer = document.getElementById('main-footer');
    
    document.querySelectorAll('.rift-surge-system').forEach(p => p.classList.add('system-surge'));
    
    tear.style.transition = 'none';
    tear.style.height = '0%';
    tear.style.width = '4px';
    tear.style.borderRadius = '100%';
    tear.style.boxShadow = '0 0 30px #fff,0 0 60px #c084fc,0 0 120px #3b82f6';
    tear.style.background = '#fff';
    
    aura.style.transition = 'none';
    aura.style.transform = 'translate(-50%, -50%) scale(1)';
    
    text.style.transition = 'none';
    text.style.opacity = '1';
    loader.classList.remove('animate-shake');
    
    loader.classList.add('active');

    setTimeout(() => {
        tear.style.transition = 'height 0.8s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.8s ease-out';
        tear.style.height = '150vh';
        aura.style.transition = 'transform 2s ease-in';
        aura.style.transform = 'translate(-50%, -50%) scale(50)';
        loader.classList.add('animate-shake'); 
    }, 2500);

    setTimeout(() => {
        tear.style.transition = 'width 0.5s cubic-bezier(0.8, 0, 0.2, 1), border-radius 0.5s, background 0.2s';
        tear.style.width = '300vw'; 
        tear.style.borderRadius = '0'; 
        tear.style.background = '#ffffff';
        tear.style.boxShadow = '0 0 200px #fff, 0 0 300px #c084fc';
        text.style.transition = 'opacity 0.2s';
        text.style.opacity = '0'; 
    }, 3800);

    setTimeout(() => {
        document.getElementById('portal').classList.remove('page-active');
        document.getElementById('portal').style.display = 'none';
        
        document.getElementById('home').style.display = 'block';
        requestAnimationFrame(() => document.getElementById('home').classList.add('page-active'));
        
        nav.style.display = 'flex';
        footer.style.display = 'flex';
        
        currentPageId = 'home';
        
        localStorage.setItem('hasEnteredRift', 'true');
        localStorage.setItem('visitCount', '1');
        document.getElementById('welcome-title').innerText = "Willkommen";
        
        document.querySelectorAll('.nav-btn').forEach(btn => {
            if(btn.dataset.target === 'home') {
                btn.classList.add('text-rift-400', 'border-rift-500'); 
                btn.classList.remove('text-gray-400', 'border-transparent');
            }
        });

        loader.classList.remove('animate-shake'); 
        startCooldown(); 
    }, 4200);

    setTimeout(() => {
        loader.style.transition = 'opacity 1.5s ease-out, visibility 1.5s ease-out';
        loader.classList.remove('active');
        
        setTimeout(() => {
            loader.style.transition = 'opacity 1s ease-out, visibility 1s ease-out'; 
            tear.style.transition = 'none';
            tear.style.height = '0%';
            tear.style.width = '4px';
            tear.style.borderRadius = '100%';
            isTransitioning = false; 
        }, 1500);
    }, 4800); 
}

// --- NORMAL MENU NAVIGATION ---
function switchPage(targetId, fromHashChange = false) {
    if (currentState === STATE.SURGE || targetId === currentPageId || isTransitioning) return;
    
    if (!fromHashChange && localStorage.getItem('hasEnteredRift') === 'true') {
        history.pushState(null, null, '#' + targetId);
    }

    isTransitioning = true;
    const currentPage = document.getElementById(currentPageId);
    const targetPage = document.getElementById(targetId);

    document.querySelectorAll('.nav-btn').forEach(btn => {
        const isBone = btn.dataset.target === 'char';
        const activeColor = isBone ? 'text-bone-400' : 'text-rift-400';
        const activeBorder = isBone ? 'border-bone-500' : 'border-rift-500';
        
        if(btn.dataset.target === targetId) {
            btn.classList.add(activeColor, activeBorder); 
            btn.classList.remove('text-gray-400', 'border-transparent');
        } else {
            btn.classList.remove(activeColor, activeBorder); 
            btn.classList.add('text-gray-400', 'border-transparent');
        }
    });
    
    document.querySelectorAll('.rift-surge-system').forEach(p => p.classList.add('system-surge'));
    
    if (currentPage) {
        currentPage.style.opacity = '0'; 
        setTimeout(() => {
            currentPage.classList.remove('page-active');
            currentPage.style.display = 'none';
            currentPage.style.opacity = '1'; 
            
            targetPage.style.display = 'block'; 
            targetPage.scrollTop = 0;
            requestAnimationFrame(() => targetPage.classList.add('page-active'));
            currentPageId = targetId;

            setTimeout(() => {
                document.querySelectorAll('.rift-surge-system').forEach(p => p.classList.remove('system-surge'));
                isTransitioning = false; 
            }, 300);

        }, 300); 
    }
}

// --- GALERIE RENDERER ---
function renderGallery() {
    const grid = document.getElementById('gallery-grid');
    if(!grid) return;
    grid.innerHTML = ''; 

    if(galleryConfig.files.length === 0) {
        grid.className = "flex flex-col items-center justify-center min-h-[400px] w-full col-span-3 text-center p-12 border border-dashed border-rift-900 bg-[#050205]";
        grid.innerHTML = `
            <div class="relative mb-6">
                <i data-lucide="hourglass" class="w-20 h-20 text-rift-900 absolute top-0 left-0 blur-sm animate-pulse"></i>
                <i data-lucide="hourglass" class="w-20 h-20 text-rift-500 relative z-10 opacity-80"></i>
            </div>
            <h3 class="font-magic text-4xl text-rift-400 mb-4 tracking-[0.2em] uppercase text-glow-rift">Coming Soon</h3>
            <p class="font-lore text-gray-400 text-xl italic">Der Staub formt langsam neue Echos...</p>
        `;
        if(typeof lucide !== 'undefined') { lucide.createIcons(); }
        return;
    }

    grid.className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8";

    galleryConfig.files.forEach((filename, index) => {
        const card = document.createElement('div');
        card.className = 'holo-card rounded-sm cursor-pointer group shadow-lg'; 
        card.style.animationDelay = `${index * 0.1}s`; 
        const title = filename.split('.')[0].replace(/[-_]/g, ' '); 
        const imgSrc = galleryConfig.folder ? `${galleryConfig.folder}${filename}` : filename;

        card.onclick = () => openImageModal(imgSrc, title);

        card.innerHTML = `
            <div class="relative w-full h-full overflow-hidden bg-black/50">
                <img src="${imgSrc}" alt="${title}" loading="lazy" class="holo-img" onerror="this.onerror=null; this.src='https://placehold.co/600x400/1c1917/a8a29e?text=Kein+Bild';">
                <div class="absolute inset-0 bg-rift-500/0 group-hover:bg-rift-500/20 transition-colors duration-500 flex items-center justify-center z-20">
                    <i data-lucide="zoom-in" class="text-white w-12 h-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]"></i>
                </div>
                </div>
        `;
        grid.appendChild(card);
    });
    
    if(typeof lucide !== 'undefined') { lucide.createIcons(); }
}

function openImageModal(src, title) {
    const modal = document.getElementById('image-modal');
    const img = document.getElementById('modal-img');
    img.src = src;
    modal.classList.remove('hidden-modal', 'pointer-events-none');
    modal.classList.add('opacity-100', 'pointer-events-auto');
}

function closeImageModal() {
    const modal = document.getElementById('image-modal');
    modal.classList.remove('opacity-100', 'pointer-events-auto');
    modal.classList.add('hidden-modal', 'pointer-events-none');
    setTimeout(() => { document.getElementById('modal-img').src = ''; }, 300);
}

// --- LOOP & PERFORMANCE OPTIMIERUNG ---
let animationFrameId;
let isTabActive = true;

document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        isTabActive = false;
        cancelAnimationFrame(animationFrameId); 
    } else {
        isTabActive = true;
        lastRandomChange = performance.now(); 
        updateLoop(performance.now()); 
    }
});

function updateLoop(timestamp) {
    if (!isTabActive) return; 

    drawParticles();
    if (currentState === STATE.IDLE) {
        updateIdle(timestamp);
    }
    animationFrameId = requestAnimationFrame(updateLoop);
}

function updateIdle(timestamp) {
    if (timestamp - lastRandomChange > 2000 + Math.random() * 3000) {
        if (Math.random() > 0.75) {
            idleTarget = 50 + Math.random() * 50; 
        } else {
            idleTarget = 10 + Math.random() * 20; 
        }
        lastRandomChange = timestamp;
    }

    const jitter = Math.sin(timestamp / 300) * 2;
    const activeTarget = idleTarget + jitter;
    idleCurrent += (activeTarget - idleCurrent) * 0.02; 
    updateUI(idleCurrent);
}

function updateUI(value) {
    const compass = document.getElementById('rune-compass');
    const riftValText = document.getElementById('rift-val');

    if (riftValText) {
        if(value > 60) riftValText.innerText = "Kritisch";
        else if(value > 30) riftValText.innerText = "Fluktuierend";
        else riftValText.innerText = "Ruhig";
    }

    if (compass) {
        currentRotation += (value * 0.05); 
        compass.style.transform = `rotate(${currentRotation}deg) scale(${1 + (value/300)}) translateZ(0)`;
    }
}

function startCooldown() {
    currentState = STATE.COOLDOWN;
    const pipes = document.querySelectorAll('.rift-surge-system');
    pipes.forEach(p => p.classList.remove('system-surge'));

    let startVal = 120;
    const endVal = 15; 
    let startTime = performance.now();

    function animateCooldown(timestamp) {
        if (currentState !== STATE.COOLDOWN) return;

        const progress = timestamp - startTime;
        const percent = Math.min(progress / 1500, 1);
        
        const ease = 1 - Math.pow(1 - percent, 3);
        const currentVal = startVal - ((startVal - endVal) * ease);
        
        idleCurrent = currentVal;
        updateUI(currentVal); 

        if (progress < 1500) {
            requestAnimationFrame(animateCooldown);
        } else {
            currentState = STATE.IDLE;
            idleCurrent = 15; 
            idleTarget = 15; 
            lastRandomChange = performance.now();
        }
    }
    requestAnimationFrame(animateCooldown);
}

const fieldInfos = {
    name: { title: "Name", text: "Der Name oder Rufname deiner Seele, mitsamt Titel falls zutreffend." },
    alter: { title: "Alter", text: "Wähle das Alter passend zu deinem Volk (maximal 5000 Jahre). Bedenke: Ein altes Wesen sieht auch entsprechend aus und trägt alte Lasten." },
    rasse: { title: "Blutlinie (Volk)", text: "Welchem Volk gehörst du an? Falls du von einer fremden Welt stammst, beschreibe deine Natur kurz." },
    klasse: { title: "Pfad des Kampfes", text: "Die Art, wie du im gnadenlosen Staub überlebst und kämpfst." },
    berufe: { title: "Handwerk", text: "Dein Beitrag zum Überleben der Gemeinschaft. Haupt-, Neben- und reine Erzähl-Berufe." },
    heiler: { title: "Heiler", text: "Verfügst du über die Kunst, Wunden zu schließen und vom Tode zu retten? (Zusätzlich zu anderen Berufen möglich)." },
    faehigkeit: { title: "Gabe", text: "Beherrschst du alte Magie, das Wandeln der Gestalt oder trägst du das Bluterbe der Vampire in dir?" },
    staerken: { title: "Eiserner Wille", text: "Geistige und charakterliche Stärken deiner Persönlichkeit (keine Spiel-Mechaniken!)." },
    schwaechen: { title: "Sprödes Fleisch", text: "Ängste, Schwächen und Fehler, die dich angreifbar machen." },
    beschreibung: { title: "Das Antlitz", text: "Wie gibst du dich? Was sehen die anderen Wanderer, wenn sie dir im Staub begegnen?" },
    hintergrund: { title: "Das alte Leben", text: "Wo kommst du her? Warum bist du durch den Riss geschritten? Erzähle von den Narben deiner Vergangenheit." },
    steam: { title: "Aura-Signatur (Steam)", text: "Die 17-stellige Steam64 ID, um deine Existenz am Portal zu legitimieren." },
    discord: { title: "Rufname (Discord)", text: "Dein Name in der Halle der Stimmen (Discord) zur Kommunikation mit den Architekten." },
    neueRasse: { title: "Vergessenes Blut", text: "Beschreibe das Aussehen, die Herkunft und die Eigenheiten dieses unbekannten Volkes." }
};

function openInfo(key) {
    const data = fieldInfos[key];
    if(!data) return;
    document.getElementById('info-modal-title').innerText = data.title;
    document.getElementById('info-modal-text').innerText = data.text;
    const modal = document.getElementById('field-info-modal');
    modal.classList.remove('hidden-modal', 'pointer-events-none');
    modal.classList.add('opacity-100', 'pointer-events-auto');
}

function closeInfoModal() {
    const modal = document.getElementById('field-info-modal');
    modal.classList.remove('opacity-100', 'pointer-events-auto');
    modal.classList.add('hidden-modal', 'pointer-events-none');
}

function toggleCustomRace() {
    const raceSelect = document.getElementById('charRace');
    const customContainer = document.getElementById('customRaceContainer');
    if (raceSelect.value === 'Neue Rasse') {
        customContainer.classList.remove('hidden');
    } else {
        customContainer.classList.add('hidden');
    }
}

// --- UTILS ---
function toggleMobile() {
    const menu = document.getElementById('mobile-menu');
    if (menu.classList.contains('opacity-0')) { 
        menu.classList.remove('opacity-0', 'pointer-events-none'); 
        menu.classList.add('opacity-100', 'pointer-events-auto'); 
    } else { 
        menu.classList.add('opacity-0', 'pointer-events-none'); 
        menu.classList.remove('opacity-100', 'pointer-events-auto'); 
    }
}

function navigateFromMobile(targetId) {
    if (currentState !== STATE.IDLE || isTransitioning) return; 
    if (targetId === currentPageId) {
        toggleMobile();
        return;
    }
    switchPage(targetId);
    setTimeout(() => {
        const menu = document.getElementById('mobile-menu');
        if (menu && menu.classList.contains('opacity-100')) {
            menu.classList.add('opacity-0', 'pointer-events-none');
            menu.classList.remove('opacity-100', 'pointer-events-auto');
        }
    }, 400); 
}

async function copyIP() {
    const ip = '178.63.47.190:7777';
    const msg = document.getElementById('ip-msg'); 
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(ip);
        } else {
            const el = document.createElement('textarea');
            el.value = ip;
            el.style.position = 'absolute';
            el.style.left = '-9999px';
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
        }
        if(msg) { 
            msg.innerText = "In den Geist geschrieben!";
            msg.className = "text-sm font-magic tracking-widest text-rift-400 opacity-0 h-5 transition-opacity uppercase";
            msg.style.opacity = 1; setTimeout(() => msg.style.opacity = 0, 2000); 
        }
    } catch (err) {
        if(msg) { 
            msg.innerText = "Fehler beim Erinnern!";
            msg.className = "text-sm font-magic tracking-widest text-red-500 opacity-0 h-5 transition-opacity uppercase";
            msg.style.opacity = 1; setTimeout(() => msg.style.opacity = 0, 2000); 
        }
    }
}

function val(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
}

async function copyCharacter() {
    const steamIdVal = val('steamID').trim();
    const charNameVal = val('charName').trim();
    
    const msg = document.getElementById('copy-msg');

        // 1. Prüfung: Fehlt die Steam-ID?
        if (!steamIdVal) {
            if(msg) {
                msg.innerText = ">> Die Aura-Signatur (Steam64) fehlt! <<";
                msg.className = "text-center text-red-500 font-magic tracking-widest text-lg mt-6 opacity-0 transition-opacity";
                msg.style.opacity = 1; 
                setTimeout(() => msg.style.opacity = 0, 4000);
            }
            return;
        }

        // 2. Prüfung: Fehlt der Name?
        if (!charNameVal) {
            if(msg) {
                msg.innerText = ">> Der Name deines Charakters fehlt! <<";
                msg.className = "text-center text-red-500 font-magic tracking-widest text-lg mt-6 opacity-0 transition-opacity";
                msg.style.opacity = 1; 
                setTimeout(() => msg.style.opacity = 0, 4000);
            }
            return;
        }

        // 3. Prüfung: Ist die Steam-ID exakt 17 Zahlen lang?
        if (!/^\d{17}$/.test(steamIdVal)) {
            if(msg) {
                msg.innerText = ">> Die Aura-Signatur (SteamID) muss exakt 17 Zahlen lang sein! Keine Buchstaben! <<";
                msg.className = "text-center text-red-500 font-magic tracking-widest text-lg mt-6 opacity-0 transition-opacity";
                msg.style.opacity = 1; 
                setTimeout(() => msg.style.opacity = 0, 5000);
            }
            return;
        }

    let raceValue = val('charRace');
    if (raceValue === 'Neue Rasse') {
        raceValue = `Unbekanntes Blut\n**Beschreibung:** ${val('charCustomRaceDesc')}`;
    }

    const text = `**Der Name:** ${val('charName')}
**Gezeichnete Jahre:** ${val('charAge')}
**Blut (Volk):** ${raceValue}
**Pfad (Klasse):** ${val('charClass')}
**Gabe (Fähigkeit):** ${val('charAbility')}

**Handwerk:**
Haupt: ${val('charMainProf')} | Neben: ${val('charSubProf')} | Ruf: ${val('charRpProf')} | Heiler: ${val('charHealer')}

**Eiserner Wille (Stärken):**
${val('charStrengths')}

**Sprödes Fleisch (Schwächen):**
${val('charWeaknesses')}

**Das Antlitz (Erscheinung):**
${val('charDescription')}

**Das alte Leben (Hintergrund):**
${val('charStory')}

**Aura-Signatur (Steam64):** ${val('steamID')}
**Rufname (Discord):** ${val('discordID')}`;
    
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
        } else {
            const el = document.createElement('textarea');
            el.value = text;
            el.style.position = 'absolute';
            el.style.left = '-9999px';
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
        }
        
        if(msg) { 
            msg.innerText = ">> Das Pergament wurde in den Geist überschrieben <<";
            msg.className = "text-center text-rift-400 font-magic tracking-widest text-lg mt-6 opacity-0 transition-opacity";
            msg.style.opacity = 1; setTimeout(() => msg.style.opacity = 0, 4000); 
        }
    } catch (err) {
        if(msg) { 
            msg.innerText = ">> Die Tinte ist verwischt. Bitte kopiere den Text per Hand. <<";
            msg.className = "text-center text-red-500 font-magic tracking-widest text-lg mt-6 opacity-0 transition-opacity";
            msg.style.opacity = 1; setTimeout(() => msg.style.opacity = 0, 5000); 
        }
        console.error("Clipboard Error:", err);
    }
}

const cookieBanner = document.getElementById('rift-cookie-banner');
setTimeout(() => {
    if (!localStorage.getItem('riftProtocolAccepted')) {
        if (cookieBanner) {
            cookieBanner.classList.remove('hidden');
            requestAnimationFrame(() => { cookieBanner.classList.remove('translate-y-[150%]'); });
        }
    }
}, 1500);

function acceptCookies() {
    localStorage.setItem('riftProtocolAccepted', 'true');
    if (cookieBanner) {
        cookieBanner.classList.add('translate-y-[150%]');
        setTimeout(() => { cookieBanner.classList.add('hidden'); }, 700);
    }
}

// --- AUTO-SAVE FÜR DIE SEELEN-INSCHRIFT ---
const charFormFields = [
    'steamID', 'discordID', 'charName', 'charAge', 'charRace', 
    'charClass', 'charAbility', 'charCustomRaceDesc', 'charMainProf', 
    'charSubProf', 'charRpProf', 'charHealer', 'charStrengths', 
    'charWeaknesses', 'charDescription', 'charStory'
];

function saveCharacterDraft() {
    const draftData = {};
    charFormFields.forEach(id => {
        const el = document.getElementById(id);
        if (el) draftData[id] = el.value;
    });
    localStorage.setItem('arathion_char_draft', JSON.stringify(draftData));
}

function loadCharacterDraft() {
    const savedDraft = localStorage.getItem('arathion_char_draft');
    if (savedDraft) {
        try {
            const draftData = JSON.parse(savedDraft);
            charFormFields.forEach(id => {
                const el = document.getElementById(id);
                if (el && draftData[id]) el.value = draftData[id];
            });
            if (typeof toggleCustomRace === 'function') toggleCustomRace();
        } catch (e) {
            console.error("Die alten Schriften konnten nicht entziffert werden:", e);
        }
    }
    
    charFormFields.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', saveCharacterDraft);
            el.addEventListener('change', saveCharacterDraft);
        }
    });
}

function clearCharacterDraft() {
    if (!confirm("Bist du sicher, dass du deinen gesamten Entwurf in die Asche werfen möchtest? Dies kann nicht rückgängig gemacht werden.")) {
        return;
    }
    localStorage.removeItem('arathion_char_draft');
    charFormFields.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (el.tagName === 'SELECT') el.selectedIndex = 0;
            else el.value = '';
        }
    });
    if (typeof toggleCustomRace === 'function') toggleCustomRace();
    
    const msg = document.getElementById('copy-msg');
    if (msg) {
        msg.innerText = ">> Die Inschrift wurde vom Wind verweht. <<";
        msg.className = "text-center text-red-500 font-magic tracking-widest text-lg mt-6 opacity-0 transition-opacity";
        msg.style.opacity = 1; 
        setTimeout(() => msg.style.opacity = 0, 4000);
    }
    
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

// --- DATENSCHUTZ: ALLES LÖSCHEN ---
function resetAllLocalStorage() {
    if (confirm("Möchtest du wirklich ALLE lokalen Daten löschen? Dies entfernt die Cookie-Zustimmung, überspringt das Portal beim nächsten Mal nicht mehr und löscht deinen ungespeicherten Charakter-Entwurf unwiderruflich!")) {
        try {
            localStorage.clear(); // Löscht rigoros alles von dieser Domain
            window.location.hash = ''; // Setzt den Hash zurück, um das Portal zu garantieren
            window.location.reload(); // Lädt die Seite hart neu
        } catch (e) {
            console.error("Speicherfehler:", e);
            alert("Fehler beim Löschen. Dein Browser blockiert möglicherweise den Zugriff auf den lokalen Speicher (z.B. durch strenge Datenschutzeinstellungen oder weil die Seite lokal ohne Server geöffnet wurde).");
        }
    }
}
// Init
document.addEventListener('DOMContentLoaded', () => { 
    initRouting(); 
    renderGallery(); 
    loadCharacterDraft(); 
    requestAnimationFrame(updateLoop); 
});
