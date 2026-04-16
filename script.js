/* ====================================================================
   THE LAZY — Main JavaScript Logic v3.0
   Cinematic Portfolio Edition
   ==================================================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* ================================================================
       AUDIO ENGINE
       ================================================================ */
    const AudioEngine = {
        ctx: null,
        init() {
            if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            if (this.ctx.state === 'suspended') this.ctx.resume();
        },
        playHover() {
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.frequency.setValueAtTime(500, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(280, this.ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.012, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.1);
        },
        playClick() {
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.frequency.setValueAtTime(700, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.18);
            gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.18);
        },
        noiseNode: null,
        noiseGain: null,
        initAmbient() {
            if (!this.ctx) this.init();
            if (this.noiseNode) return;
            const bufferSize = 2 * this.ctx.sampleRate;
            const buf = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const out = buf.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) out[i] = Math.random() * 2 - 1;
            this.noiseNode = this.ctx.createBufferSource();
            this.noiseNode.buffer = buf;
            this.noiseNode.loop = true;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 120;
            this.noiseGain = this.ctx.createGain();
            this.noiseGain.gain.value = 0.003;
            this.noiseNode.connect(filter);
            filter.connect(this.noiseGain);
            this.noiseGain.connect(this.ctx.destination);
            this.noiseNode.start();
        },
        modulateAmbient(intensity) {
            if (this.noiseGain) {
                gsap.to(this.noiseGain.gain, { value: 0.003 + intensity * 0.012, duration: 2 });
            }
        }
    };

    document.addEventListener('mousedown', (e) => {
        AudioEngine.init();
        AudioEngine.initAmbient();
        createRipple(e);
    });

    function createRipple(e) {
        const ripple = document.createElement('div');
        ripple.className = 'click-ripple';
        ripple.style.left = `${e.clientX}px`;
        ripple.style.top = `${e.clientY}px`;
        document.body.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    }

    /* ================================================================
       CUSTOM CURSOR & PARALLAX
       ================================================================ */
    const cursorDot  = document.querySelector('.cursor-dot');
    const cursorRing = document.querySelector('.cursor-ring');

    let lastX = 0, lastY = 0, lastTime = Date.now(), speed = 0;

    const xDot  = gsap.quickTo(cursorDot,  "x", { duration: 0.12, ease: "power3", force3D: true });
    const yDot  = gsap.quickTo(cursorDot,  "y", { duration: 0.12, ease: "power3", force3D: true });
    const xRing = gsap.quickTo(cursorRing, "x", { duration: 0.55, ease: "power3", force3D: true });
    const yRing = gsap.quickTo(cursorRing, "y", { duration: 0.55, ease: "power3", force3D: true });

    const bgLayers = document.querySelectorAll('.bg-layer');

    document.addEventListener('mousemove', (e) => {
        const now = Date.now();
        const dt = Math.max(1, now - lastTime);
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        speed = Math.sqrt(dx * dx + dy * dy) / dt;
        lastX = e.clientX;
        lastY = e.clientY;
        lastTime = now;

        const dur = Math.min(0.55, Math.max(0.1, 0.55 - speed * 0.18));
        gsap.to(cursorRing, { duration: dur, scale: 1 + speed * 0.08, rotation: dx * 0.08, ease: "power2.out" });

        // Kinetic typography
        document.querySelectorAll('.kinetic-char').forEach(char => {
            const rect = char.getBoundingClientRect();
            const cX = rect.left + rect.width / 2;
            const cY = rect.top + rect.height / 2;
            const dist = Math.hypot(e.clientX - cX, e.clientY - cY);
            const maxDist = 180;
            if (dist < maxDist) {
                const power = (maxDist - dist) / maxDist;
                gsap.to(char, {
                    x: (cX - e.clientX) * power * 0.18,
                    y: (cY - e.clientY) * power * 0.18,
                    scale: 1 + power * 0.25,
                    skewX: (cX - e.clientX) * power * 0.04,
                    duration: 0.35, ease: "power2.out"
                });
            } else {
                gsap.to(char, { x: 0, y: 0, scale: 1, skewX: 0, duration: 0.6, ease: "power2.out" });
            }
        });

        xDot(e.clientX); yDot(e.clientY);
        xRing(e.clientX); yRing(e.clientY);

        // Parallax on BG layers
        const px = (e.clientX / window.innerWidth - 0.5) * 28;
        const py = (e.clientY / window.innerHeight - 0.5) * 28;
        bgLayers.forEach(bg => gsap.to(bg, { x: px, y: py, duration: 1.8, ease: "power2.out" }));

        // Smart ambient light
        const lighting = document.getElementById('ambient-lighting');
        if (lighting) lighting.style.background = `radial-gradient(circle at ${e.clientX}px ${e.clientY}px, rgba(255,255,255,0.05) 0%, transparent 45%)`;
    });

    /* ── Magnetic Buttons ────────────────────────────────────────── */
    function initMagnetic(el) {
        if (!el || el._magneticBound) return;
        el._magneticBound = true;
        el.addEventListener('mouseenter', () => {
            document.body.classList.add('cursor-hover');
            AudioEngine.playHover();
        });
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            gsap.to(el, { x: x * 0.42, y: y * 0.42, rotationX: -(y * 0.18), rotationY: x * 0.18, duration: 0.65, ease: "power4.out", scale: 1.06, transformPerspective: 1000, force3D: true });
            gsap.to(cursorRing, { scale: 1.4, opacity: 0.35, backgroundColor: '#fff', duration: 0.3 });
            gsap.to(cursorDot,  { scale: 0, duration: 0.3 });
        });
        el.addEventListener('mouseleave', () => {
            document.body.classList.remove('cursor-hover');
            gsap.to(el, { x: 0, y: 0, rotationX: 0, rotationY: 0, duration: 1.4, ease: "elastic.out(1.1, 0.4)", scale: 1 });
            gsap.to(cursorRing, { scale: 1, opacity: 1, backgroundColor: 'transparent', duration: 0.4, ease: "power2.out" });
            gsap.to(cursorDot,  { scale: 1, duration: 0.4, ease: "power2.out" });
        });
        el.addEventListener('mousedown', () => { AudioEngine.playClick(); AudioEngine.modulateAmbient(1); gsap.to(el, { scale: 0.95, duration: 0.1 }); });
        el.addEventListener('mouseup', () =>  { AudioEngine.modulateAmbient(0); gsap.to(el, { scale: 1.06, duration: 0.3, ease: "back.out(2)" }); });
    }

    document.querySelectorAll('button, .magnetic-btn, .nav-link').forEach(initMagnetic);

    /* ── Kinetic text init (slides h1) ─────────────────────────── */
    document.querySelectorAll('.slide-content h1').forEach(h1 => {
        const text = h1.innerText;
        h1.innerHTML = '';
        [...text].forEach(c => {
            const span = document.createElement('span');
            span.innerText = c === ' ' ? '\u00A0' : c;
            span.className = 'kinetic-char';
            h1.appendChild(span);
        });
    });

    /* ================================================================
       PRELOADER
       ================================================================ */
    const preloader = document.getElementById('preloader');
    const progressBar = preloader.querySelector('.progress');
    const loaderPct  = document.getElementById('loader-percent');

    // Animated percentage counter
    let pct = 0;
    const pctInterval = setInterval(() => {
        pct = Math.min(100, pct + Math.random() * 8 + 2);
        if (loaderPct) loaderPct.textContent = Math.round(pct) + '%';
        if (pct >= 100) clearInterval(pctInterval);
    }, 60);

    gsap.to(progressBar, {
        width: '100%',
        duration: 2,
        ease: "power2.inOut",
        onComplete: () => {
            gsap.to(preloader, {
                opacity: 0,
                duration: 1,
                delay: 0.3,
                onComplete: () => {
                    preloader.style.display = 'none';
                    startHeroAnimation();
                }
            });
        }
    });

    /* ================================================================
       HERO ANIMATION — Cinematic stagger entry
       ================================================================ */
    function startHeroAnimation() {
        // Ken Burns effect on background image
        gsap.fromTo('#hero-bg-img',
            { scale: 1.12, opacity: 0 },
            { scale: 1.04, opacity: 1, duration: 3, ease: "power2.out" }
        );

        // Continuous slow Ken Burns loop
        gsap.to('#hero-bg-img', {
            scale: 1.08,
            duration: 12,
            ease: "none",
            delay: 3,
            yoyo: true,
            repeat: -1
        });

        // Staggered left-side entry
        const tl = gsap.timeline({ delay: 0.4 });

        tl.to('#hero-eyebrow', {
            opacity: 1, y: 0, duration: 1, ease: "power3.out"
        })
        .to('.hero-name .char-reveal', {
            opacity: 1, y: 0, rotateX: 0, filter: 'blur(0px)',
            duration: 1.2,
            stagger: 0.06,
            ease: "power4.out"
        }, "-=0.6")
        .to('#hero-tagline', {
            opacity: 1, x: 0, duration: 1, ease: "power3.out"
        }, "-=0.6")
        .to('#hero-cta-wrap', {
            opacity: 1, y: 0, duration: 1, ease: "power3.out"
        }, "-=0.5")
        .to('#hero-meta', {
            opacity: 1, y: 0, duration: 1, ease: "power3.out"
        }, "-=0.5")
        .to('#hero-scroll-hint', {
            opacity: 1, duration: 1.2, ease: "power2.out"
        }, "-=0.4");

        // Floating nav slides in after hero
        setTimeout(() => {
            const nav = document.getElementById('floating-nav');
            nav.classList.remove('hidden');
            requestAnimationFrame(() => nav.classList.add('nav-visible'));
        }, 2200);

        // Periodic lightning on name chars
        function triggerLightning() {
            const chars = document.querySelectorAll('.hero-name .char-reveal');
            gsap.to(chars, {
                filter: 'drop-shadow(0 0 25px #fff)',
                duration: 0.08,
                stagger: 0.015,
                repeat: 1,
                yoyo: true
            });
        }
        setInterval(triggerLightning, 5000 + Math.random() * 4000);
    }

    /* ================================================================
       NAVIGATION / VIEW MANAGEMENT
       ================================================================ */
    const viewHome  = document.getElementById('view-home');
    const viewIntro = document.getElementById('view-intro');
    const viewMenu  = document.getElementById('view-menu');

    const btnEnter   = document.getElementById('btn-enter');
    const btnExplore = document.getElementById('btn-explore');
    const btnContinue = document.getElementById('btn-continue');

    // "Explore Work" scrolls the About section
    if (btnExplore) {
        btnExplore.addEventListener('click', () => {
            AudioEngine.playClick();
            openAboutSection();
        });
    }

    // Home → Intro
    btnEnter.addEventListener('click', () => {
        const docElm = document.documentElement;
        if (docElm.requestFullscreen) docElm.requestFullscreen().catch(() => {});
        else if (docElm.webkitRequestFullscreen) docElm.webkitRequestFullscreen().catch(() => {});

        AudioEngine.playClick();

        gsap.to(viewHome, {
            opacity: 0, scale: 0.96, filter: 'blur(18px)',
            duration: 0.8, ease: "expo.inOut",
            onComplete: () => {
                viewHome.classList.remove('active');
                viewHome.style.scale = '';
                viewHome.style.filter = '';

                viewIntro.classList.add('active');
                viewIntro.style.opacity = 0;
                gsap.set(viewIntro, { scale: 1.08, filter: 'blur(18px)' });

                handleIntroSequence();

                gsap.to(viewIntro, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.8, ease: "expo.out" });
            }
        });
    });

    // Intro → Menu
    btnContinue.addEventListener('click', () => {
        AudioEngine.playClick();

        gsap.to(viewIntro, {
            opacity: 0, scale: 0.96, filter: 'blur(18px)',
            duration: 0.8, ease: "expo.inOut",
            onComplete: () => {
                viewIntro.classList.remove('active');
                viewIntro.style.filter = '';

                viewMenu.classList.add('active');
                viewMenu.style.opacity = 0;
                gsap.set(viewMenu, { scale: 1.08, filter: 'blur(28px)' });

                gsap.to(viewMenu, {
                    opacity: 1, scale: 1, filter: 'blur(0px)',
                    duration: 1.8, ease: "expo.out",
                    onComplete: () => {
                        document.getElementById('bottom-floating-ui').classList.remove('hidden');
                        gsap.fromTo('#bottom-floating-ui',
                            { y: 50, opacity: 0 },
                            { y: 0, opacity: 1, duration: 1, ease: "power3.out" }
                        );

                        // First slide typography reveal
                        const h1 = document.querySelector('.slide[data-index="0"] .slide-content h1');
                        gsap.fromTo(h1,
                            { opacity: 0, scale: 0.92, filter: 'blur(16px)' },
                            { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.5, ease: "expo.out" }
                        );

                        const centerText = document.getElementById('center-typography');
                        gsap.fromTo(centerText,
                            { opacity: 0, letterSpacing: '0.2em' },
                            { opacity: 0.7, letterSpacing: '0.8em', duration: 2, ease: "expo.out", delay: 0.4 }
                        );
                    }
                });
            }
        });
    });

    /* ================================================================
       INTRO SEQUENCE
       ================================================================ */
    function handleIntroSequence() {
        const video       = document.getElementById('intro-video');
        const fallbackImg = document.getElementById('intro-image');
        const uiIntro     = document.querySelector('.ui-intro');

        video.classList.remove('hidden');
        gsap.set(video, { opacity: 1 });
        fallbackImg.classList.add('hidden');
        uiIntro.classList.add('hidden');
        uiIntro.classList.remove('active-btn-shown');

        video.currentTime = 0;
        const playPromise = video.play();
        if (playPromise !== undefined) playPromise.catch(err => console.log("Autoplay blocked:", err));

        const endHandler = () => skipToImage();
        video.removeEventListener('ended', endHandler);
        video.addEventListener('ended', endHandler);

        function skipToImage() {
            fallbackImg.style.opacity = 0;
            fallbackImg.classList.remove('hidden');
            gsap.to(fallbackImg, {
                opacity: 1, duration: 1.5, ease: "power2.inOut",
                onComplete: () => {
                    video.pause();
                    video.classList.add('hidden');
                    showContinueButton(uiIntro);
                }
            });
        }

        let lastVideoTime = -1, checks = 0;
        const checkInterval = setInterval(() => {
            checks++;
            if (uiIntro.classList.contains('active-btn-shown')) { clearInterval(checkInterval); return; }
            if (checks > 3 && video.currentTime === lastVideoTime) {
                clearInterval(checkInterval);
                skipToImage();
            }
            lastVideoTime = video.currentTime;
        }, 1000);
    }

    function showContinueButton(uiContainer) {
        uiContainer.classList.remove('hidden');
        uiContainer.classList.add('active-btn-shown');
        gsap.fromTo(uiContainer, { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 1, ease: "power2.out" });
    }

    /* ================================================================
       MENU SLIDER
       ================================================================ */
    const sliderTrack = document.getElementById('slider-track');
    const slides      = document.querySelectorAll('.slide');
    const dots        = document.querySelectorAll('.slide-indicator .dot');
    const btnNav      = document.getElementById('btn-nav');
    const btnStart    = document.getElementById('btn-start');

    let currentSlide = 0;
    const totalSlides = slides.length;

    const spectralMap = {
        'video':  { color: '#00d4ff', glow: 'rgba(0, 212, 255, 0.06)' },
        'photo':  { color: '#ff8c42', glow: 'rgba(255, 140, 66,  0.06)' },
        'pdf':    { color: '#d0d0d0', glow: 'rgba(255, 255, 255, 0.06)' },
        'audio':  { color: '#ff2d78', glow: 'rgba(255, 45,  120, 0.06)' },
        'code':   { color: '#7b61ff', glow: 'rgba(123, 97,  255, 0.06)' }
    };

    slides[0].classList.add('active');

    btnNav.addEventListener('click', () => {
        currentSlide = currentSlide < totalSlides - 1 ? currentSlide + 1 : 0;
        updateSlider();
    });

    function updateSlider() {
        const transformValue = `translateX(-${currentSlide * 20}%)`;

        gsap.to(sliderTrack, {
            transform: transformValue, duration: 1.4, ease: "expo.inOut"
        });

        // Update dot indicator
        dots.forEach((dot, i) => dot.classList.toggle('active', i === currentSlide));
        slides.forEach((slide, i) => slide.classList.toggle('active', i === currentSlide));

        // Spectral color sync
        const activeType = slides[currentSlide].getAttribute('data-type');
        const theme = spectralMap[activeType];
        document.documentElement.style.setProperty('--module-color', theme.color);
        document.documentElement.style.setProperty('--module-glow', theme.glow);

        // Liquid blur on slide change
        sliderTrack.style.filter = 'url(#liquid-goo) blur(18px)';
        gsap.to(sliderTrack, { filter: 'none', duration: 1.4, ease: "expo.out", delay: 0.4 });

        // Typography reveal for active slide
        const activeSlide = slides[currentSlide];
        const chars = activeSlide.querySelectorAll('.kinetic-char');
        if (chars.length) {
            gsap.fromTo(chars,
                { opacity: 0, y: 50, filter: 'blur(24px) brightness(2)', scale: 1.2 },
                { opacity: 1, y: 0, filter: 'blur(0px) brightness(1)', scale: 1, duration: 1.6, stagger: 0.055, ease: "expo.out", delay: 0.25 }
            );
        }

        // Center typography update
        const centerText = document.getElementById('center-typography');
        gsap.to(centerText, {
            opacity: 0, y: 12, duration: 0.35,
            onComplete: () => {
                centerText.innerText = activeType.toUpperCase() + " INTERFACE";
                gsap.to(centerText, { opacity: 0.7, y: 0, letterSpacing: '0.6em', duration: 0.8, ease: "power3.out" });
            }
        });

        btnNav.innerHTML = currentSlide === totalSlides - 1 ? "BACK" : "NEXT";
    }

    /* ================================================================
       TOOL MODAL
       ================================================================ */
    const toolOverlay    = document.getElementById('tool-overlay');
    const btnCloseTool   = document.getElementById('btn-close-tool');
    const toolContentArea = document.getElementById('tool-content-area');

    btnStart.addEventListener('click', () => {
        const activeType = slides[currentSlide].getAttribute('data-type');
        injectToolContent(activeType);
        toolOverlay.classList.remove('hidden');
        toolOverlay.classList.add('active');
    });

    btnCloseTool.addEventListener('click', () => {
        toolOverlay.classList.remove('active');
        if (window.currentVideoEditor) { window.currentVideoEditor.cleanup(); window.currentVideoEditor = null; }
        setTimeout(() => { toolOverlay.classList.add('hidden'); toolContentArea.innerHTML = ''; }, 500);
    });

    function injectToolContent(type) {
        let content = '';
        if (type === 'video') {
            content = `
                <div class="video-editor-layout">
                    <div class="editor-main">
                        <div class="preview-area">
                            <canvas id="composer-canvas" width="1280" height="720"></canvas>
                            <div class="player-controls">
                                <button id="play-pause-btn" class="icon-btn">▶</button>
                                <span id="time-display">00:00 / 00:00</span>
                                <input type="range" id="seek-bar" min="0" max="100" value="0" step="0.1">
                                <button id="mute-btn" class="icon-btn">🔊</button>
                            </div>
                        </div>
                        <div class="timeline-area">
                            <div class="timeline-tools">
                                <span>Timeline</span>
                                <div><button class="action-btn" id="delete-clip-btn">Delete</button></div>
                            </div>
                            <div class="timeline-container" id="timeline-container">
                                <div class="playhead" id="playhead"></div>
                                <div class="timeline-track visual-track" id="visual-track"></div>
                                <div class="timeline-track audio-track" id="audio-track"></div>
                            </div>
                        </div>
                    </div>
                    <div class="editor-sidebar">
                        <input type="file" id="media-upload" multiple accept="video/*,image/*,audio/*" style="display:none">
                        <button class="control-btn upload-btn" onclick="document.getElementById('media-upload').click()">+ Upload Media</button>
                        <div class="media-library" id="media-library"><p class="empty-text">No media uploaded</p></div>
                        <div class="settings-panel">
                            <h3>Adjustments (Selected Clip)</h3>
                            <div class="adjustment-group">
                                <label>Brightness <span id="val-bright">100%</span></label>
                                <input type="range" id="adj-bright" min="0" max="200" value="100">
                            </div>
                            <div class="adjustment-group">
                                <label>Contrast <span id="val-contrast">100%</span></label>
                                <input type="range" id="adj-contrast" min="0" max="200" value="100">
                            </div>
                            <div class="adjustment-group">
                                <label>Saturation <span id="val-sat">100%</span></label>
                                <input type="range" id="adj-sat" min="0" max="200" value="100">
                            </div>
                            <div class="adjustment-group">
                                <label>Volume <span id="val-vol">100%</span></label>
                                <input type="range" id="adj-vol" min="0" max="100" value="100">
                            </div>
                            <h3>Effects</h3>
                            <div class="effect-toggles">
                                <label><input type="checkbox" id="fx-fadein"> Fade In (1s)</label>
                                <label><input type="checkbox" id="fx-fadeout"> Fade Out (1s)</label>
                            </div>
                        </div>
                        <button class="control-btn export-btn" id="export-video-btn">Export Video</button>
                    </div>
                </div>
            `;
            setTimeout(() => { if (typeof initVideoEditor === 'function') initVideoEditor(); }, 100);
        } else if (type === 'photo') {
            content = `<div class="tool-grid"><div class="tool-preview">[Canvas View Mock]</div><div class="tool-controls"><button class="control-btn">Upload Image</button><button class="control-btn">Crop & Resize</button><button class="control-btn">Color Grading</button><button class="control-btn" style="background:#fff;color:#000;">Download JPG</button></div></div>`;
        } else if (type === 'pdf') {
            content = `<div class="tool-grid"><div class="tool-preview">[PDF Preview Mock]</div><div class="tool-controls"><button class="control-btn">JPG/PNG to PDF</button><button class="control-btn">Compress PDF</button><button class="control-btn">Lock PDF</button><button class="control-btn" style="background:#fff;color:#000;">Download PDF</button></div></div>`;
        } else if (type === 'audio') {
            content = `<div class="tool-grid"><div class="tool-preview">[Audio Waveform Mock]</div><div class="tool-controls"><button class="control-btn">Upload Audio</button><button class="control-btn">Trim Audio</button><button class="control-btn">Change Format</button><button class="control-btn" style="background:#fff;color:#000;">Export</button></div></div>`;
        } else if (type === 'code') {
            content = `<div class="tool-grid"><div class="code-editor-layout"><textarea class="fake-code" placeholder="<html>\n  <body>\n    <h1>Hello World</h1>\n  </body>\n</html>"></textarea><textarea class="fake-code" placeholder="body { background: #080808; color: #f0f0f0; }"></textarea></div><div class="tool-preview">[Live Browser Preview Mock]</div></div>`;
        }
        toolContentArea.innerHTML = content;
    }

    /* ================================================================
       FLOATING DOCK
       ================================================================ */
    const btnDockSettings  = document.getElementById('dock-btn-settings');
    const btnDockSearch    = document.getElementById('dock-btn-search');
    const settingsPanelDock = document.getElementById('system-settings-panel');

    btnDockSettings.addEventListener('click', () => {
        AudioEngine.playClick();
        settingsPanelDock.classList.remove('hidden-panel');
    });

    btnDockSearch.addEventListener('click', () => {
        AudioEngine.playClick();
        window.open('https://www.google.com', '_blank');
    });

    /* ================================================================
       FLOATING NAV — links
       ================================================================ */
    const navAboutBtn = document.getElementById('nav-about');
    const btnAboutTop = document.getElementById('btn-about-top');

    function openAboutSection() {
        const about = document.getElementById('about-section');
        about.classList.remove('hidden');
        setTimeout(() => {
            about.classList.add('active');
            animateAboutSection();
        }, 50);
    }

    [navAboutBtn, btnAboutTop].forEach(btn => {
        if (btn) btn.addEventListener('click', () => { AudioEngine.playClick(); openAboutSection(); });
    });

    const navHomeBtn = document.getElementById('nav-home');
    if (navHomeBtn) {
        navHomeBtn.addEventListener('click', () => {
            AudioEngine.playClick();
            // Just highlight, page is already home
        });
    }

    const navPortfolioBtn = document.getElementById('nav-portfolio');
    if (navPortfolioBtn) {
        navPortfolioBtn.addEventListener('click', () => {
            AudioEngine.playClick();
            openAboutSection();
        });
    }

    /* ================================================================
       ABOUT SECTION ANIMATIONS
       ================================================================ */
    function animateAboutSection() {
        const tl = gsap.timeline({ delay: 0.15 });

        // Left column stagger
        tl.to('.about-eyebrow',      { opacity: 1, x: 0, duration: 0.8, ease: "power3.out" })
          .to('.about-title',        { opacity: 1, x: 0, duration: 0.9, ease: "power3.out" }, "-=0.5")
          .to('.about-contact-row',  { opacity: 1, x: 0, duration: 0.7, ease: "power3.out" }, "-=0.5")
          .to('.about-bio',          { opacity: 1, x: 0, duration: 0.7, ease: "power3.out" }, "-=0.4")
          .to('.about-social-row',   { opacity: 1, x: 0, duration: 0.7, ease: "power3.out" }, "-=0.4")
          // Right portrait
          .to('#about-right',        { opacity: 1, x: 0, duration: 1,   ease: "power3.out" }, "-=0.8")
          // Skills section
          .fromTo('.skills-section', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }, "-=0.2");

        // Animate skill bars after delay
        setTimeout(() => {
            document.querySelectorAll('.skill-bar-fill').forEach(bar => {
                const width = bar.getAttribute('data-width');
                bar.style.width = width + '%';
            });
        }, 1200);
    }

    /* ================================================================
       SEMI-CIRCLE MENU
       ================================================================ */
    const semiMenuContainer = document.getElementById('semi-menu-container');
    const btnToolMenu       = document.getElementById('btn-tool-menu');
    const semiItems         = Array.from(document.querySelectorAll('.semi-item'));
    const semiShockwave     = document.getElementById('semi-shockwave');
    let   semiMenuActive    = false;

    function positionSemiItems() {
        const n          = semiItems.length;
        const RADIUS     = 310;
        const SVG_W      = 700;
        const SVG_H      = 360;
        const CX         = SVG_W / 2;
        const CY         = SVG_H;
        const MARGIN_DEG = 12;
        const START_DEG  = 180 + MARGIN_DEG;
        const END_DEG    = 360 - MARGIN_DEG;

        semiItems.forEach((item, i) => {
            const fraction = n === 1 ? 0.5 : i / (n - 1);
            const deg = START_DEG + fraction * (END_DEG - START_DEG);
            const rad = (deg * Math.PI) / 180;
            const xSvg = CX + RADIUS * Math.cos(rad);
            const ySvg = CY + RADIUS * Math.sin(rad);
            item.style.left      = `${(xSvg / SVG_W) * 100}%`;
            item.style.top       = `${(ySvg / SVG_H) * 100}%`;
            item.style.transform = 'translate(-50%, -50%)';
        });
    }

    positionSemiItems();
    window.addEventListener('resize', positionSemiItems);

    function openSemiMenu() {
        semiMenuActive = true;
        semiMenuContainer.classList.remove('hidden');
        semiMenuContainer.classList.add('semi-active');

        document.getElementById('app-container').classList.add('cinematic-blur');
        const uiMenu = document.querySelector('.ui-menu');
        if (uiMenu) gsap.to(uiMenu, { opacity: 0, scale: 0.95, duration: 0.4, ease: 'power2.in', pointerEvents: 'none' });

        gsap.fromTo(semiMenuContainer,
            { opacity: 0, scale: 0.82, y: 40 },
            { opacity: 1, scale: 1, y: 0, duration: 0.7, ease: 'expo.out' }
        );
        gsap.fromTo('.arc-pipe-body',   { strokeDasharray: '0 2200' }, { strokeDasharray: '2200 0', duration: 0.85, ease: 'power3.inOut' });
        gsap.fromTo('.arc-glow-outer',  { strokeDasharray: '0 2200' }, { strokeDasharray: '2200 0', duration: 0.85, ease: 'power3.inOut', delay: 0.05 });
        gsap.fromTo(semiItems,
            { scale: 0, opacity: 0, y: 20 },
            { scale: 1, opacity: 1, y: 0, duration: 0.5, stagger: { amount: 0.32, from: 'center' }, ease: 'back.out(1.6)', delay: 0.16 }
        );
        AudioEngine.modulateAmbient(0.8);
    }

    function closeSemiMenu() {
        semiMenuActive = false;
        semiMenuContainer.classList.remove('semi-active');

        document.getElementById('app-container').classList.remove('cinematic-blur');
        const uiMenu = document.querySelector('.ui-menu');
        if (uiMenu) gsap.to(uiMenu, { opacity: 1, scale: 1, duration: 0.6, ease: 'power2.out', pointerEvents: 'auto' });

        gsap.to(semiItems, { scale: 0, opacity: 0, y: 14, duration: 0.28, stagger: { amount: 0.22, from: 'edges' }, ease: 'power2.in' });
        gsap.to(semiMenuContainer, { opacity: 0, scale: 0.88, y: 28, duration: 0.42, ease: 'power2.inOut', delay: 0.10,
            onComplete: () => { if (!semiMenuActive) semiMenuContainer.classList.add('hidden'); }
        });
        AudioEngine.modulateAmbient(0);
    }

    btnToolMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        AudioEngine.playClick();
        semiMenuActive ? closeSemiMenu() : openSemiMenu();
    });

    document.addEventListener('click', (e) => {
        if (semiMenuActive && !semiMenuContainer.contains(e.target) && e.target !== btnToolMenu) closeSemiMenu();
    });

    semiItems.forEach(item => {
        item.addEventListener('mouseenter', () => { document.body.classList.add('cursor-hover'); AudioEngine.playHover(); });
        item.addEventListener('mouseleave', () => { document.body.classList.remove('cursor-hover'); });

        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const url   = item.getAttribute('data-url');
            const shell = item.querySelector('.semi-icon-shell');

            AudioEngine.playClick();
            gsap.fromTo(shell, { boxShadow: '0 0 0 0 rgba(255,255,255,0)' }, { boxShadow: '0 0 55px 18px rgba(255,255,255,0.4)', duration: 0.14, yoyo: true, repeat: 1, ease: 'power2.out' });

            const iRect = item.getBoundingClientRect();
            const wRect = semiMenuContainer.getBoundingClientRect();
            const sx = iRect.left + iRect.width / 2 - wRect.left;
            const sy = iRect.top + iRect.height / 2 - wRect.top;

            gsap.set(semiShockwave, { left: sx, top: sy, xPercent: -50, yPercent: -50, scale: 0, opacity: 1, position: 'absolute' });
            semiShockwave.style.left = `${sx}px`;
            semiShockwave.style.top  = `${sy}px`;
            gsap.fromTo(semiShockwave, { scale: 0, opacity: 0.9 }, { scale: 80, opacity: 0, duration: 0.8, ease: 'power2.out' });
            gsap.to('#view-menu', { x: 3, y: 3, duration: 0.04, repeat: 3, yoyo: true, ease: 'none' });

            setTimeout(() => { window.open(url, '_blank'); closeSemiMenu(); }, 520);
        });
    });

    /* ================================================================
       TOOLTIP ENGINE
       ================================================================ */
    const tooltip = document.getElementById('global-tooltip');

    const dockTriggers = {
        'dock-btn-settings': 'CORE CONFIG',
        'dock-btn-search':   'SEARCH WEB',
        'btn-tool-menu':     'TOOL MENU',
        'btn-about-top':     'INTEL',
        'nav-about':         'ABOUT',
        'nav-home':          'HOME',
        'nav-portfolio':     'PORTFOLIO'
    };

    document.querySelectorAll('.dock-icon-btn, .dock-center-btn, .nav-corner-btn, .nav-link').forEach(btn => {
        btn.addEventListener('mouseenter', (e) => {
            const label = dockTriggers[btn.id];
            if (!label) return;
            tooltip.innerText = label;
            tooltip.classList.remove('hidden');
            requestAnimationFrame(() => tooltip.classList.add('active'));
        });
        btn.addEventListener('mousemove', (e) => {
            tooltip.style.left = (e.clientX + 16) + 'px';
            tooltip.style.top  = (e.clientY - 28) + 'px';
        });
        btn.addEventListener('mouseleave', () => {
            tooltip.classList.remove('active');
            setTimeout(() => tooltip.classList.add('hidden'), 300);
        });
    });

    /* ================================================================
       CLOSE HANDLERS
       ================================================================ */
    const closeHandlers = [
        { btn: 'btn-close-tool',     target: 'tool-overlay',         type: 'hidden' },
        { btn: 'btn-close-settings', target: 'system-settings-panel', type: 'hidden-panel' },
        { btn: 'btn-close-about',    target: 'about-section',         type: 'hidden' }
    ];

    closeHandlers.forEach(h => {
        const el = document.getElementById(h.btn);
        if (el) {
            el.addEventListener('click', () => {
                AudioEngine.playClick();
                const panel = document.getElementById(h.target);
                if (h.type === 'hidden-panel') {
                    panel.classList.add('hidden-panel');
                } else {
                    panel.classList.remove('active');

                    // Reset about animations when closing
                    if (h.target === 'about-section') {
                        gsap.set(['.about-eyebrow', '.about-title', '.about-contact-row', '.about-bio', '.about-social-row'],
                            { opacity: 0, x: -20 });
                        gsap.set('#about-right', { opacity: 0, x: 20 });
                        // Reset skill bars
                        document.querySelectorAll('.skill-bar-fill').forEach(bar => bar.style.width = '0%');
                    }
                    setTimeout(() => panel.classList.add('hidden'), 500);
                }
            });
        }
    });

    /* ================================================================
       CURSOR HOVER ON DOCK / NAV ITEMS
       ================================================================ */
    [btnDockSettings, btnDockSearch, btnToolMenu, navAboutBtn, btnAboutTop]
        .filter(Boolean)
        .forEach(el => {
            el.addEventListener('mouseenter', () => { document.body.classList.add('cursor-hover'); AudioEngine.playHover(); });
            el.addEventListener('mouseleave', () => { document.body.classList.remove('cursor-hover'); });
        });

});

/* ====================================================================
   VIDEO EDITOR CLASS
   ==================================================================== */
function initVideoEditor() {
    window.currentVideoEditor = new VideoEditor();
}

class VideoEditor {
    constructor() {
        this.library = [];
        this.clips = [];
        this.currentTime = 0;
        this.isPlaying = false;
        this.duration = 10;
        this.selectedClipId = null;
        this.isMuted = false;

        this.canvas     = document.getElementById('composer-canvas');
        this.ctx        = this.canvas.getContext('2d');
        this.libraryDiv = document.getElementById('media-library');
        this.visualTrack = document.getElementById('visual-track');
        this.audioTrack  = document.getElementById('audio-track');
        this.playhead    = document.getElementById('playhead');
        this.seekBar     = document.getElementById('seek-bar');
        this.timeDisplay = document.getElementById('time-display');
        this.playBtn     = document.getElementById('play-pause-btn');
        this.uploadInput = document.getElementById('media-upload');
        this.timelineContainer = document.getElementById('timeline-container');

        this.bindEvents();
        this.renderLoop();
    }

    bindEvents() {
        this.uploadInput.addEventListener('change', (e) => this.handleUpload(e));
        this.playBtn.addEventListener('click', () => this.togglePlayback());
        this.seekBar.addEventListener('input', (e) => this.seek(e.target.value));
        document.getElementById('mute-btn').addEventListener('click', () => this.toggleMute());
        document.getElementById('delete-clip-btn').addEventListener('click', () => this.deleteSelectedClip());
        document.getElementById('export-video-btn').addEventListener('click', () => this.exportVideo());

        const updateAdj = (id, prop, unit) => {
            document.getElementById(id).addEventListener('input', (e) => {
                const val = e.target.value;
                document.getElementById(id.replace('adj-', 'val-')).innerText = val + unit;
                if (this.selectedClipId) {
                    const clip = this.clips.find(c => c.id === this.selectedClipId);
                    if (clip) clip.filters[prop] = val;
                }
            });
        };
        updateAdj('adj-bright', 'brightness', '%');
        updateAdj('adj-contrast', 'contrast', '%');
        updateAdj('adj-sat', 'saturation', '%');
        updateAdj('adj-vol', 'volume', '%');

        ['fadein', 'fadeout'].forEach(fx => {
            document.getElementById(`fx-${fx}`).addEventListener('change', (e) => {
                if (this.selectedClipId) {
                    const clip = this.clips.find(c => c.id === this.selectedClipId);
                    if (clip) clip.effects[fx === 'fadein' ? 'fadeIn' : 'fadeOut'] = e.target.checked;
                }
            });
        });

        this.timelineContainer.addEventListener('mousedown', (e) => {
            if (e.target === this.visualTrack || e.target === this.audioTrack || e.target === this.timelineContainer) {
                const rect = this.timelineContainer.getBoundingClientRect();
                const clickX = e.clientX - rect.left + this.timelineContainer.scrollLeft;
                this.seek((clickX / this.timelineContainer.scrollWidth) * 100);
            }
        });
    }

    handleUpload(e) {
        const files = Array.from(e.target.files);
        if (this.library.length === 0) this.libraryDiv.innerHTML = '';
        files.forEach(file => {
            const url  = URL.createObjectURL(file);
            const type = file.type.split('/')[0];
            const item = { id: Date.now() + Math.random(), file, url, type };
            if (type === 'video' || type === 'audio') {
                const media = document.createElement(type);
                media.src = url;
                media.onloadedmetadata = () => { item.duration = media.duration; this.library.push(item); this.renderLibraryItem(item); };
            } else if (type === 'image') {
                item.duration = 5;
                this.library.push(item);
                this.renderLibraryItem(item);
            }
        });
    }

    renderLibraryItem(item) {
        const el = document.createElement('div');
        el.className = 'media-item';
        if (item.type === 'video')       el.innerHTML = `<video src="${item.url}" muted></video>`;
        else if (item.type === 'image')  el.innerHTML = `<img src="${item.url}">`;
        else if (item.type === 'audio')  el.innerHTML = `🎵<br>Audio`;
        el.addEventListener('click', () => this.addToTimeline(item));
        this.libraryDiv.appendChild(el);
    }

    addToTimeline(item) {
        const isVisual = item.type === 'video' || item.type === 'image';
        let startAt = 0;
        this.clips.filter(c => c.isVisual === isVisual).forEach(c => {
            if (c.startAt + c.duration > startAt) startAt = c.startAt + c.duration;
        });
        let mediaEl = null;
        if (item.type === 'video' || item.type === 'audio') {
            mediaEl = document.createElement(item.type);
            mediaEl.src = item.url;
            mediaEl.preload = 'auto';
            mediaEl.muted = item.type === 'video';
        } else if (item.type === 'image') {
            mediaEl = new Image();
            mediaEl.src = item.url;
        }
        const clip = { id: Date.now().toString() + Math.random(), item, mediaEl, isVisual, startAt, duration: item.duration, filters: { brightness: 100, contrast: 100, saturation: 100, volume: 100 }, effects: { fadeIn: false, fadeOut: false } };
        this.clips.push(clip);
        const endAt = startAt + clip.duration;
        if (endAt > this.duration) this.duration = endAt + 2;
        this.renderTimeline();
    }

    renderTimeline() {
        this.visualTrack.innerHTML = '';
        this.audioTrack.innerHTML = '';
        const scale = 50;
        this.timelineContainer.style.minWidth = (this.duration * scale) + 'px';
        this.clips.forEach(clip => {
            const el = document.createElement('div');
            el.className = `clip-element ${clip.item.type}-clip ${this.selectedClipId === clip.id ? 'selected' : ''}`;
            el.style.left  = (clip.startAt * scale) + 'px';
            el.style.width = (clip.duration * scale) + 'px';
            el.innerText = clip.item.file.name.substring(0, 10);
            el.addEventListener('click', (e) => { e.stopPropagation(); this.selectClip(clip.id); });
            if (clip.isVisual) this.visualTrack.appendChild(el);
            else this.audioTrack.appendChild(el);
        });
    }

    selectClip(id) {
        this.selectedClipId = id;
        this.renderTimeline();
        const clip = this.clips.find(c => c.id === id);
        if (clip) {
            document.getElementById('adj-bright').value    = clip.filters.brightness;
            document.getElementById('val-bright').innerText = clip.filters.brightness + '%';
            document.getElementById('adj-contrast').value  = clip.filters.contrast;
            document.getElementById('val-contrast').innerText = clip.filters.contrast + '%';
            document.getElementById('adj-sat').value       = clip.filters.saturation;
            document.getElementById('val-sat').innerText   = clip.filters.saturation + '%';
            document.getElementById('adj-vol').value       = clip.filters.volume;
            document.getElementById('val-vol').innerText   = clip.filters.volume + '%';
            document.getElementById('fx-fadein').checked  = clip.effects.fadeIn;
            document.getElementById('fx-fadeout').checked = clip.effects.fadeOut;
        }
    }

    deleteSelectedClip() {
        if (!this.selectedClipId) return;
        this.clips = this.clips.filter(c => c.id !== this.selectedClipId);
        this.selectedClipId = null;
        this.renderTimeline();
    }

    togglePlayback() {
        this.isPlaying = !this.isPlaying;
        this.playBtn.innerText = this.isPlaying ? '⏸' : '▶';
        this.lastTime = performance.now();
        this.clips.forEach(clip => { if (clip.mediaEl && typeof clip.mediaEl.pause === 'function') clip.mediaEl.pause(); });
    }

    seek(percent) {
        this.currentTime = (percent / 100) * this.duration;
        this.clips.forEach(clip => {
            if (clip.mediaEl && typeof clip.mediaEl.currentTime !== 'undefined') {
                if (this.currentTime >= clip.startAt && this.currentTime <= clip.startAt + clip.duration)
                    clip.mediaEl.currentTime = this.currentTime - clip.startAt;
            }
        });
        if (!this.isPlaying) this.drawFrame();
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        document.getElementById('mute-btn').innerText = this.isMuted ? '🔇' : '🔊';
    }

    renderLoop() {
        if (!this.canvas) return;
        if (this.isPlaying) {
            const now   = performance.now();
            const delta = (now - this.lastTime) / 1000;
            this.currentTime += delta;
            this.lastTime = now;
            if (this.currentTime > this.duration) { this.currentTime = 0; this.togglePlayback(); }
        }
        this.drawFrame();
        this.seekBar.value = (this.currentTime / this.duration) * 100;
        this.playhead.style.left = (this.currentTime * 50) + 'px';
        const fmt = (t) => `${Math.floor(t / 60).toString().padStart(2, '0')}:${Math.floor(t % 60).toString().padStart(2, '0')}`;
        this.timeDisplay.innerText = `${fmt(this.currentTime)} / ${fmt(this.duration)}`;
        this.animationRef = requestAnimationFrame(() => this.renderLoop());
    }

    drawFrame() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        const visualClip = this.clips.find(c => c.isVisual && this.currentTime >= c.startAt && this.currentTime <= c.startAt + c.duration);
        if (visualClip) {
            const timeInClip = this.currentTime - visualClip.startAt;
            if (visualClip.item.type === 'video' && this.isPlaying) {
                if (visualClip.mediaEl.paused) visualClip.mediaEl.play();
            } else if (visualClip.item.type === 'video') {
                visualClip.mediaEl.pause();
                visualClip.mediaEl.currentTime = timeInClip;
            }
            this.ctx.filter = `brightness(${visualClip.filters.brightness}%) contrast(${visualClip.filters.contrast}%) saturate(${visualClip.filters.saturation}%)`;
            let alpha = 1;
            if (visualClip.effects.fadeIn && timeInClip < 1) alpha = timeInClip;
            if (visualClip.effects.fadeOut && visualClip.duration - timeInClip < 1) alpha = visualClip.duration - timeInClip;
            this.ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
            if (visualClip.item.type === 'video' || (visualClip.item.type === 'image' && visualClip.mediaEl.complete)) {
                const vW = visualClip.item.type === 'video' ? visualClip.mediaEl.videoWidth  : visualClip.mediaEl.width;
                const vH = visualClip.item.type === 'video' ? visualClip.mediaEl.videoHeight : visualClip.mediaEl.height;
                if (vW && vH) {
                    const s  = Math.min(this.canvas.width / vW, this.canvas.height / vH);
                    const dW = vW * s, dH = vH * s;
                    this.ctx.drawImage(visualClip.mediaEl, (this.canvas.width - dW) / 2, (this.canvas.height - dH) / 2, dW, dH);
                }
            }
            this.ctx.filter = 'none';
            this.ctx.globalAlpha = 1;
        } else {
            this.clips.forEach(c => { if (c.item.type === 'video' && c.mediaEl && !c.mediaEl.paused) c.mediaEl.pause(); });
        }
        this.clips.filter(c => !c.isVisual || (c.isVisual && c.item.type === 'video')).forEach(clip => {
            if (this.currentTime >= clip.startAt && this.currentTime <= clip.startAt + clip.duration) {
                const t = this.currentTime - clip.startAt;
                if (clip.mediaEl) {
                    if (!clip.isVisual) {
                        clip.mediaEl.volume = this.isMuted ? 0 : clip.filters.volume / 100;
                        if (this.isPlaying && clip.mediaEl.paused) { clip.mediaEl.currentTime = t; clip.mediaEl.play().catch(() => {}); }
                        else if (!this.isPlaying && !clip.mediaEl.paused) clip.mediaEl.pause();
                    } else if (clip.item.type === 'video' && !this.isMuted) {
                        clip.mediaEl.muted = this.isMuted;
                        clip.mediaEl.volume = clip.filters.volume / 100;
                    }
                }
            } else {
                if (clip.mediaEl && !clip.mediaEl.paused) clip.mediaEl.pause();
            }
        });
    }

    exportVideo() {
        alert("Exporting Video... (Basic Browser Processing)");
        const stream = this.canvas.captureStream(30);
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        const chunks = [];
        recorder.ondataavailable = e => chunks.push(e.data);
        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            const url  = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'export_the_lazy.webm'; a.click();
            URL.revokeObjectURL(url);
            const btn = document.getElementById('export-video-btn');
            btn.innerText = 'Export Video';
            btn.style.background = '#fff';
            btn.style.pointerEvents = 'auto';
        };
        this.isPlaying = false;
        this.seek(0);
        const btn = document.getElementById('export-video-btn');
        btn.innerText = 'Processing...';
        btn.style.background = '#555';
        btn.style.pointerEvents = 'none';
        recorder.start();
        this.isPlaying = true;
        this.lastTime = performance.now();
        const checkEnd = setInterval(() => {
            if (this.currentTime >= this.duration - 0.5 || !this.isPlaying) { recorder.stop(); this.isPlaying = false; clearInterval(checkEnd); }
        }, 500);
    }

    cleanup() {
        if (this.animationRef) cancelAnimationFrame(this.animationRef);
        this.isPlaying = false;
        this.clips.forEach(c => { if (c.mediaEl) { c.mediaEl.pause(); c.mediaEl.src = ''; } });
        this.library = [];
        this.clips = [];
        this.canvas = null;
    }
}
