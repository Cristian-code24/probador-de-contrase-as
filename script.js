document.addEventListener('DOMContentLoaded', () => {

    // --- UTILS: Funciones básicas ---
    const getEl = (id) => document.getElementById(id);
    const setText = (id, text) => {
        const el = getEl(id);
        if (el) el.innerText = text;
    };

    // --- 1. SPOTLIGHT EFFECT & THEME ---
    const cards = document.querySelectorAll('.glass-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', e => {
            requestAnimationFrame(() => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);
            });
        });
    });

    const themeToggle = getEl('theme-toggle');
    const html = document.documentElement;

    // Tema
    if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        html.setAttribute('data-theme', 'dark');
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const current = html.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            html.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
        });
    }

    // --- 2. PASSWORD ANALYZER (NIVEL CIBERSEGURIDAD) ---
    const pwdInput = getEl('password-input');
    const strengthBar = getEl('strength-bar');
    const strengthText = getEl('strength-text');
    const entropyText = getEl('entropy-text');
    const recContainer = getEl('recommendations');
    const hashDisplay = getEl('hash-display');

    const commonPasswords = ["password", "123456", "12345678", "1234", "qwerty", "admin", "welcome", "login", "manchester", "barcelona", "realmadrid", "iloveyou", "dragon", "monkey", "charlie", "hunter", "sunshine", "princess"];
    const keyboardPatterns = ["qwerty", "asdfgh", "zxcvbn", "qazwsx", "1q2w3e", "poiuyt", "lkjhgf", "mnbvcx"];

    if (pwdInput) {
        pwdInput.addEventListener('input', analyzeAdvanced);
    }

    async function analyzeAdvanced() {
        const val = pwdInput.value;
        if (!val) { resetAnalyzer(); return; }

        const len = val.length;
        
        // 1. Análisis de Caracteres
        const hasLower = /[a-z]/.test(val);
        const hasUpper = /[A-Z]/.test(val);
        const hasNum = /[0-9]/.test(val);
        const hasSym = /[^a-zA-Z0-9]/.test(val);
        
        updateChecklist('lower', hasLower);
        updateChecklist('upper', hasUpper);
        updateChecklist('num', hasNum);
        updateChecklist('sym', hasSym);
        updateChecklist('len', len >= 12);

        // 2. Cálculo de Entropía Base
        let pool = 0;
        if (hasLower) pool += 26;
        if (hasUpper) pool += 26;
        if (hasNum) pool += 10;
        if (hasSym) pool += 33;
        if (pool === 0) pool = 1;

        let entropy = len * Math.log2(pool);

        // 3. Penalizaciones Avanzadas (Hacking Heuristics)
        let warnings = [];
        let penalty = 0;

        // Normalización para detectar Leet Speak (Ej: @dmin -> admin)
        const normalized = val.toLowerCase()
            .replace(/@/g, 'a').replace(/4/g, 'a')
            .replace(/3/g, 'e')
            .replace(/1/g, 'i').replace(/!/g, 'i')
            .replace(/0/g, 'o')
            .replace(/5/g, 's').replace(/\$/g, 's')
            .replace(/7/g, 't');

        if (commonPasswords.some(pass => normalized.includes(pass))) {
            penalty += 20;
            warnings.push("DICCIONARIO: Palabra común o Leet Speak detectado.");
            entropy = Math.min(entropy, 35); // Límite duro de seguridad
        }

        if (keyboardPatterns.some(pat => normalized.includes(pat))) {
            penalty += 15;
            warnings.push("PATRÓN FÍSICO: Secuencia de teclado (ej. qwerty).");
        }

        if (/(.)\1{2,}/.test(val)) {
            penalty += 10;
            warnings.push("REPETICIÓN: Evita caracteres consecutivos.");
        }

        if (/^[0-9]+$/.test(val) || /^[a-zA-Z]+$/.test(val)) {
            penalty += 10;
            warnings.push("VARIEDAD: Mezcla letras y números.");
        }

        entropy = Math.max(0, Math.round(entropy - penalty));

        // 4. Hash SHA-256
        if (hashDisplay) {
            const hash = await sha256(val);
            hashDisplay.innerHTML = `<small style="opacity:0.6; font-family:monospace;">SHA-256 (Hash en BD):</small><br><span style="color:var(--accent, #00d2ff); font-size:0.8em;">${hash}</span>`;
        }

        // 5. Actualizar UI
        if (entropyText) entropyText.innerText = `${entropy} bits`;
        
        updateCrackTimes(entropy);
        updateVisuals(entropy);
        showRecommendations(warnings, len, hasSym, hasNum, hasUpper);
    }

    // --- FUNCIONES DE SOPORTE QUE FALTABAN ---

    async function sha256(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    function updateChecklist(type, active) {
        const el = document.querySelector(`.check-item[data-check="${type}"]`);
        if (el) {
            if (active) el.classList.add('active');
            else el.classList.remove('active');
        }
    }

    function updateCrackTimes(bits) {
        const speedHackerLaptop = 50e6;       // 50 MH/s
        const speedGamingPC = 10e9;           // 10 GH/s
        const speedMiningFarm = 1e12;         // 1 TH/s

        // 2 elevado a la potencia de entropy
        const combinations = Math.pow(2, bits); 
        
        const tLaptop = combinations / speedHackerLaptop;
        const tGaming = combinations / speedGamingPC;
        const tFarm = combinations / speedMiningFarm;

        setText('time-human', formatTime(tLaptop)); 
        setText('time-gpu', formatTime(tGaming));
        setText('time-super', formatTime(tFarm));
    }

    function formatTime(seconds) {
        if (seconds <= 0.0001) return "Instantáneo";
        if (!isFinite(seconds)) return "Siglos";
        
        const units = [
            { label: 'siglos', val: 3153600000 },
            { label: 'años', val: 31536000 },
            { label: 'días', val: 86400 },
            { label: 'h', val: 3600 },
            { label: 'min', val: 60 },
            { label: 's', val: 1 }
        ];

        for (let unit of units) {
            if (seconds >= unit.val) {
                const count = Math.round(seconds / unit.val);
                return `${count} ${unit.label}`;
            }
        }
        return "Instantáneo";
    }

    function updateVisuals(bits) {
        if (!strengthBar || !strengthText) return;

        let color = "#ff4d4d"; // Rojo
        let width = "10%";
        let text = "Muy Débil";

        if (bits > 40) { width = "30%"; color = "#ffa600"; text = "Débil"; }
        if (bits > 60) { width = "50%"; color = "#ffd700"; text = "Media"; }
        if (bits > 80) { width = "75%"; color = "#2ecc71"; text = "Fuerte"; }
        if (bits > 110) { width = "100%"; color = "#00d2ff"; text = "Impenetrable"; }

        strengthBar.style.width = width;
        strengthBar.style.backgroundColor = color;
        strengthBar.style.boxShadow = `0 0 15px ${color}`;
        strengthText.innerText = text;
        strengthText.style.color = color;
    }

    function showRecommendations(warnings, len, sym, num, upper) {
        if (!recContainer) return;
        recContainer.innerHTML = "";
        
        let recs = [...warnings];
        if (len < 12) recs.push("Longitud recomendada: 12+ caracteres.");
        if (!sym) recs.push("Faltan símbolos especiales (!@#).");
        if (!num) recs.push("Faltan números.");
        if (!upper) recs.push("Faltan mayúsculas.");
        
        recs.forEach(r => {
            const div = document.createElement('div');
            div.className = 'rec-item';
            div.innerHTML = `<span>⚠️</span> ${r}`;
            recContainer.appendChild(div);
        });
    }

    function resetAnalyzer() {
        if (strengthBar) strengthBar.style.width = "0%";
        if (strengthText) strengthText.innerText = "Esperando...";
        if (entropyText) entropyText.innerText = "0 bits";
        if (hashDisplay) hashDisplay.innerText = "";
        ['time-human', 'time-gpu', 'time-super'].forEach(id => setText(id, '-'));
        if (recContainer) recContainer.innerHTML = "";
        document.querySelectorAll('.check-item').forEach(el => el.classList.remove('active'));
    }

    // --- 3. PASSWORD GENERATOR ---
    const lenRange = getEl('length-range');
    const lenVal = getEl('length-val');
    const genBtn = getEl('btn-generate');
    const copyBtn = getEl('btn-copy');
    const genResult = getEl('gen-result');

    if (lenRange && lenVal) {
        lenRange.addEventListener('input', (e) => {
            lenVal.innerText = e.target.value;
        });
    }

    if (genBtn) {
        genBtn.addEventListener('click', () => {
            const length = parseInt(lenRange.value) || 16;
            const useUpper = getEl('gen-upper')?.checked;
            const useNum = getEl('gen-num')?.checked;
            const useSym = getEl('gen-sym')?.checked;

            let chars = "abcdefghijklmnopqrstuvwxyz";
            if (useUpper) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            if (useNum) chars += "0123456789";
            if (useSym) chars += "!@#$%^&*()_+-=[]{}|;:,.<>?";

            let password = "";
            const array = new Uint32Array(length);
            window.crypto.getRandomValues(array);

            for (let i = 0; i < length; i++) {
                password += chars[array[i] % chars.length];
            }

            if (genResult) genResult.value = password;
            // Auto-analizar la generada
            if (pwdInput) {
                pwdInput.value = password;
                analyzeAdvanced();
            }
        });
    }

    if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
            if (!genResult || !genResult.value) return;
            try {
                await navigator.clipboard.writeText(genResult.value);
                const originalHTML = copyBtn.innerHTML;
                copyBtn.innerHTML = "✔️"; // Check simple
                setTimeout(() => copyBtn.innerHTML = originalHTML, 2000);
            } catch (err) {
                console.error(err);
                alert("Copia manual requerida");
            }
        });
    }

    // --- 4. EMAIL SIMULATOR ---
    const emailBtn = getEl('btn-create-email');
    const emailArea = getEl('email-area');
    const emailTimer = getEl('email-timer');
    const emailDisplay = getEl('temp-email-text');
    let timerInterval;

    if (emailBtn) {
        emailBtn.addEventListener('click', () => {
            if (emailArea) emailArea.classList.remove('hidden');
            
            const randomStr = Math.random().toString(36).substring(2, 8);
            const domain = ["temp.lock", "secure.dev", "ghost.net"][Math.floor(Math.random()*3)];
            if (emailDisplay) emailDisplay.innerText = `${randomStr}@${domain}`;
            
            clearInterval(timerInterval);
            let timeLeft = 600; // 10 min
            
            const updateTimer = () => {
                const m = Math.floor(timeLeft / 60);
                const s = timeLeft % 60;
                if (emailTimer) emailTimer.innerText = `${m}:${s < 10 ? '0'+s : s}`;
            };
            
            updateTimer();
            timerInterval = setInterval(() => {
                timeLeft--;
                updateTimer();
                if (timeLeft <= 0) {
                    clearInterval(timerInterval);
                    if (emailDisplay) emailDisplay.innerText = "EXPIRADO";
                }
            }, 1000);
        });
    }
});