/**
 * Neurovex Landing Page Logic
 * Handles: Live EEG Simulation, Scroll Animations, Mobile Menu, Sticky Nav
 */

document.addEventListener('DOMContentLoaded', () => {
    initScrollReveal();
    initStickyNav();
    initMobileMenu();
    initLiveDemo();
});

// --- 1. Scroll Reveal Animation ---
function initScrollReveal() {
    const revealElements = document.querySelectorAll('.reveal-on-scroll');

    // Safety check: if no elements, don't break
    if (revealElements.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-visible');
                // Optional: Stop observing once revealed
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    });

    revealElements.forEach(el => observer.observe(el));
}

// --- 2. Sticky Navigation ---
function initStickyNav() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 10) {
            navbar.classList.add('shadow-md', 'bg-surface-light/95');
            navbar.classList.remove('bg-surface-light/80');
        } else {
            navbar.classList.remove('shadow-md', 'bg-surface-light/95');
            navbar.classList.add('bg-surface-light/80');
        }
    });
}

// --- 3. Mobile Menu & Theme Toggle ---
function initMobileMenu() {
    // Mobile Menu Toggle
    const menuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-link');
    const menuIcon = menuBtn?.querySelector('.material-icons');

    if (menuBtn && mobileMenu) {
        const toggleMenu = () => {
            const isClosed = mobileMenu.classList.contains('translate-x-full');

            if (isClosed) {
                // Open
                mobileMenu.classList.remove('translate-x-full');
                document.body.style.overflow = 'hidden'; // Lock scroll
                if (menuIcon) menuIcon.textContent = 'close';
            } else {
                // Close
                mobileMenu.classList.add('translate-x-full');
                document.body.style.overflow = ''; // Restore scroll
                if (menuIcon) menuIcon.textContent = 'menu';
            }
        };

        menuBtn.addEventListener('click', toggleMenu);

        // Close menu when a link is clicked
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('translate-x-full');
                document.body.style.overflow = '';
                if (menuIcon) menuIcon.textContent = 'menu';
            });
        });
    }

    // Mobile Theme Toggle
    const mobileThemeBtn = document.getElementById('theme-toggle-mobile');
    if (mobileThemeBtn) {
        mobileThemeBtn.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
            const isDark = document.documentElement.classList.contains('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });
    }
}

// --- 4. Live EEG Demo Simulation ---
function initLiveDemo() {
    const canvas = document.getElementById('sim-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // UI Elements
    const valAtt = document.getElementById('val-attention');
    const valRel = document.getElementById('val-relaxation');
    const valFat = document.getElementById('val-fatigue');
    const btnFocus = document.getElementById('btn-focus');
    const btnRelax = document.getElementById('btn-relax');

    if (!btnFocus || !btnRelax) return;

    // State
    let mode = 'focus'; // 'focus' or 'relax'
    let dataBuffer = new Array(300).fill(0); // Waveform buffer
    let phase = 0;

    // Metric Targets
    let targetAtt = 85;
    let targetRel = 20;
    let currentAtt = 50;
    let currentRel = 50;

    // Elements for Status
    const elChannelCount = document.getElementById('val-channel-count');
    const elSignalInd = document.getElementById('ind-signal-status');
    const elSignalText = document.getElementById('val-signal-status');

    // Resize Canvas
    function resize() {
        const parent = canvas.parentElement;
        if (parent) {
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
        }
    }
    window.addEventListener('resize', resize);
    resize();

    // Interaction Config
    btnFocus.addEventListener('click', () => {
        mode = 'focus';
        targetAtt = 88; targetRel = 15;
        updateButtons();
    });

    btnRelax.addEventListener('click', () => {
        mode = 'relax';
        targetAtt = 25; targetRel = 92;
        updateButtons();
    });

    function updateButtons() {
        if (mode === 'focus') {
            btnFocus.classList.add('bg-primary', 'text-white', 'border-primary');
            btnFocus.classList.remove('bg-surface-light', 'text-text-sub', 'border-border-light');

            btnRelax.classList.remove('bg-medical-teal', 'text-white', 'border-medical-teal');
            btnRelax.classList.add('bg-surface-light', 'text-text-sub', 'border-border-light');
        } else {
            btnRelax.classList.add('bg-medical-teal', 'text-white', 'border-medical-teal');
            btnRelax.classList.remove('bg-surface-light', 'text-text-sub', 'border-border-light');

            btnFocus.classList.remove('bg-primary', 'text-white', 'border-primary');
            btnFocus.classList.add('bg-surface-light', 'text-text-sub', 'border-border-light');
        }
    }
    updateButtons(); // Init state

    // Animation Loop
    function loop() {
        requestAnimationFrame(loop);

        const isConnected = window.StitchState && window.StitchState.get('deviceStatus') === 'connected';

        // 1. Update Connection Status UI
        if (isConnected) {
            const channels = window.StitchState.get('channelCount') || 1;

            if (elChannelCount) elChannelCount.innerText = `CHANNEL: ${channels} ACTIVE`;

            if (elSignalInd) {
                elSignalInd.className = "w-2 h-2 rounded-full bg-green-500 animate-pulse";
            }
            if (elSignalText) {
                elSignalText.innerText = "SIGNAL: LIVE";
                elSignalText.className = "text-xs font-mono text-safe-emerald";
            }
        } else {
            if (elChannelCount) elChannelCount.innerText = "CHANNEL: --";

            if (elSignalInd) {
                elSignalInd.className = "w-2 h-2 rounded-full bg-gray-400";
            }
            if (elSignalText) {
                elSignalText.innerText = "SIGNAL: DISCONNECTED";
                elSignalText.className = "text-xs font-mono text-text-muted";
            }
        }

        // 2. Data Processing & Visualization
        if (isConnected) {
            // Use Real Data
            const state = window.StitchState.data;

            // Update Metrics from State
            if (valAtt) valAtt.innerText = state.brainStates.focus + '%';
            if (valRel) valRel.innerText = (100 - state.brainStates.stress) + '%';
            if (valFat) valFat.innerText = state.brainStates.fatigue + '%';

            // Raw Signal (Real-time 250Hz chunks come in, but we just visualize the latest buffer for smoothness)
            const newSignal = state.rawSignal;

            // To prevent super fast flickering, we might want to just push the new signal into our buffer
            // But since handleData overwrites rawSignal each time, we need to detect IF it's new.
            // For this simpler implementation, let's just use the latest chunk to fill our visual buffer 
            // similar to a sliding window.

            if (newSignal && newSignal.length > 0) {
                // Take the last N samples to fill/scroll the buffer
                // Assuming 10Hz updates of ~25 samples
                const samplesToTake = Math.min(newSignal.length, 5); // Take 5 samples per frame roughly? 
                // Actually, loop runs at 60Hz, data comes at 10Hz. 
                // Better approach: StitchState accumulates? No, it replaces. 
                // Let's just grab the last chunk and scroll it in.

                // Simpler: Just scroll the buffer and add ONE sample from the "latest" signal 
                // cycling through it? No that's complex.

                // Let's just visualize the LAST received chunk stretched over the buffer? No.

                // Standard Rolling Buffer:
                // We need a persistent index or just push the whole chunk when it arrives?
                // But this loop is 60fps.

                // Hack: We'll just take the middle sample of the latest chunk to drive the "pen"
                // Or better: Add a few samples from the chunk to the buffer.

                // Since we don't track "newness", let's just grab the last few points of the rawSignal
                // and push them. It might look a bit jittery but it's "Real".
                const latestPoints = newSignal.slice(-2); // Grab last 2 points
                latestPoints.forEach(p => {
                    dataBuffer.push(p); // value is usually roughly centered at 0?
                    dataBuffer.shift();
                });
            }

        } else {
            // FALLBACK TO SIMULATION (No Backend)

            // Update Metrics (Lerp)
            currentAtt += (targetAtt - currentAtt) * 0.05;
            currentRel += (targetRel - currentRel) * 0.05;

            if (valAtt) valAtt.innerText = Math.round(currentAtt) + '%';
            if (valRel) valRel.innerText = Math.round(currentRel) + '%';

            if (valFat) {
                const fatigue = 12 + Math.sin(Date.now() / 2000) * 5;
                valFat.innerText = Math.round(fatigue) + '%';
            }

            // Generate Waveform Data
            phase += 0.1;
            let val = 0;
            const intensity = currentAtt / 100;
            const beta = Math.sin(phase * 3.0) * 0.3 + Math.sin(phase * 1.0) * 0.1;
            const alpha = Math.sin(phase * 0.8) * 0.6 + Math.sin(phase * 0.2) * 0.2;
            val = (beta * intensity) + (alpha * (1 - intensity)) + (Math.random() - 0.5) * 0.1;

            dataBuffer.push(val);
            dataBuffer.shift();
        }

        // 3. Draw
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        // Theme Colors
        const isDark = document.documentElement.classList.contains('dark');

        let activeScore = isConnected ? window.StitchState.get('brainStates').focus : currentAtt;
        const lineColor = activeScore > 60 ? (isDark ? '#60A5FA' : '#2563EB') : (isDark ? '#22D3EE' : '#0ea5e9');

        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = lineColor;

        const step = w / (dataBuffer.length - 1);

        for (let i = 0; i < dataBuffer.length; i++) {
            const x = i * step;
            // Scale: Simulator output is ~ +/- 20-30. 
            // Sine wave sim is ~ +/- 1.0
            // We need to normalize based on source.

            let val = dataBuffer[i];

            if (isConnected) {
                // Real signal is larger, scale it down
                val = val / 25.0;
            }

            const y = h / 2 + val * (h / 4);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Glow effect
        if (isDark) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = lineColor;
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
    }
    loop();
}
