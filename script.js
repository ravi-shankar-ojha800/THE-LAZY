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
        },
        // Background Cinema Audio
        bgAudio: document.getElementById('bg-cinema-audio'),
        bgMusicEnabled: true,
        bgMusicStarted: false,
        initBgMusic() {
            if (this.bgMusicStarted || !this.bgAudio || !this.bgMusicEnabled) return;
            this.bgAudio.volume = 0;
            const playPromise = this.bgAudio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    this.bgMusicStarted = true;
                    gsap.to(this.bgAudio, { volume: 0.4, duration: 3 });
                }).catch(err => {
                    console.log("BG Music Autoplay blocked. Waiting for interaction.");
                });
            }
        },
        toggleBgMusic(forceState) {
            if (!this.bgAudio) return;
            this.bgMusicEnabled = forceState !== undefined ? forceState : !this.bgMusicEnabled;
            
            const toggleBtn = document.getElementById('toggle-bg-music');
            if (toggleBtn) {
                toggleBtn.classList.toggle('active', this.bgMusicEnabled);
            }

            if (this.bgMusicEnabled) {
                if (!this.bgMusicStarted) {
                    this.initBgMusic();
                } else {
                    this.bgAudio.play();
                    gsap.to(this.bgAudio, { volume: 0.4, duration: 1.5 });
                }
            } else {
                gsap.to(this.bgAudio, { volume: 0, duration: 1.5, onComplete: () => this.bgAudio.pause() });
            }
        }
    };

    document.addEventListener('click', (e) => {
        AudioEngine.init();
        AudioEngine.initAmbient();
        AudioEngine.initBgMusic();
    }, { once: false });

    document.addEventListener('mousedown', (e) => {
        AudioEngine.init();
        AudioEngine.initAmbient();
        AudioEngine.initBgMusic();
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

        // Start video playback immediately if applicable
        const isVideoPlaying = initHomiiVideoPlayback();

        // If video is playing, make transition snappier
        const outDur = isVideoPlaying ? 0.4 : 0.8;
        const inDur  = isVideoPlaying ? 0.6 : 1.8;

        gsap.to(viewIntro, {
            opacity: 0, scale: 0.96, filter: 'blur(18px)',
            duration: outDur, ease: "expo.inOut",
            onComplete: () => {
                viewIntro.classList.remove('active');
                viewIntro.style.filter = '';

                viewMenu.classList.add('active');
                viewMenu.style.opacity = 0;
                
                // Reduce blur if video is playing for immediate clarity
                const blurAmount = isVideoPlaying ? 'blur(4px)' : 'blur(28px)';
                gsap.set(viewMenu, { scale: 1.08, filter: blurAmount });

                gsap.to(viewMenu, {
                    opacity: 1, scale: 1, filter: 'blur(0px)',
                    duration: inDur, ease: "expo.out",
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
       ONE-TIME INTRO VIDEO (VIDEO PAGE)
       ================================================================ */
    function initHomiiVideoPlayback() {
        const homiiVideo = document.getElementById('homii-video');
        const slideBg   = document.getElementById('video-slide-bg');
        
        if (!homiiVideo || !slideBg) return false;

        // Session check (only once per page load/re-entry in SPA)
        if (window.homiiVideoPlayed) {
            homiiVideo.classList.add('hidden');
            slideBg.style.opacity = 1;
            return false;
        }

        // Setup video
        homiiVideo.classList.remove('hidden');
        gsap.set(homiiVideo, { opacity: 1 });
        gsap.set(slideBg, { opacity: 0 });
        
        homiiVideo.currentTime = 0;
        const playPromise = homiiVideo.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(err => {
                console.log("Homii video autoplay blocked:", err);
                skipHomiiVideo(); // Skip if blocked
            });
        }

        const onHomiiEnded = () => skipHomiiVideo();
        homiiVideo.addEventListener('ended', onHomiiEnded, { once: true });

        function skipHomiiVideo() {
            window.homiiVideoPlayed = true;
            
            // Smooth fade transition (300-600ms as requested)
            gsap.to(homiiVideo, {
                opacity: 0,
                duration: 0.6,
                ease: "power2.inOut",
                onComplete: () => {
                    homiiVideo.pause();
                    homiiVideo.classList.add('hidden');
                }
            });
            
            gsap.to(slideBg, {
                opacity: 1,
                duration: 0.6,
                ease: "power2.inOut"
            });
        }

        return true;
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
        if (window.currentVideoEditor?.cleanup) window.currentVideoEditor.cleanup();
        if (window.currentPhotoEditor?.cleanup) window.currentPhotoEditor.cleanup();
        if (window.currentPdfEditor?.cleanup) window.currentPdfEditor.cleanup();
        if (window.currentAudioEditor?.cleanup) window.currentAudioEditor.cleanup();
        if (window.currentCodeEditor?.cleanup) window.currentCodeEditor.cleanup();
        window.currentVideoEditor = null;
        window.currentPhotoEditor = null;
        window.currentPdfEditor = null;
        window.currentAudioEditor = null;
        window.currentCodeEditor = null;
        setTimeout(() => { toolOverlay.classList.add('hidden'); toolContentArea.innerHTML = ''; }, 500);
    });

    function injectToolContent(type) {
        let content = '';
        if (type === 'video') {
            content = `
<div class="bento-editor-wrapper">
    <div class="bento-bg"></div>
    
    <!-- TOP BENTO BAR: PROJECT WORKSPACE -->
    <div class="bento-top-nav">
        <div class="tn-pill">
            <span class="tn-item">File</span>
            <span class="tn-item">Edit</span>
            <span class="tn-item">View</span>
        </div>
        <div class="tn-pill" style="margin-left: 20px;">
            <span class="tn-item active">Editing</span>
            <span class="tn-item">Color</span>
            <span class="tn-item">Audio</span>
        </div>
        <div class="tn-pill" style="margin-left: auto;">
            <span class="tn-item"><button>↩ Undo</button></span>
            <span class="tn-item"><button>↪ Redo</button></span>
            <span class="tn-item">⚙ 1080p 60fps</span>
        </div>
    </div>

    <div class="bento-editor-core">
        
        <!-- LEFT BENTO BAR -->
        <div class="bento-panel bg-white bento-left-bar">
            <div class="bento-logo">✦</div>
            <div class="nav-icons">
                <button class="b-icon active" title="Pointer">⌂</button>
                <button class="b-icon" title="Media Bin">♡</button>
                <button class="b-icon" title="Razor Cut">✂</button>
                <button class="b-icon" title="Text & Titles">T</button>
                <button class="b-icon" title="Transitions">⛶</button>
                <button class="b-icon" title="Settings">⚙</button>
            </div>
            <div class="nav-bottom">
                <button class="b-icon">↪</button>
                <div class="b-avatar"><img src="assets/avatar.png" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iIzMzMyIvPjwvc3ZnPg=='" /></div>
            </div>
        </div>

        <!-- CENTER BENTO AREA -->
        <div class="bento-center-col">
            <!-- PREVIEW CANVAS -->
            <div class="bento-panel bg-dark bento-preview">
                <canvas id="composer-canvas" width="1280" height="720"></canvas>
                <div class="preview-prompt-bar">
                    <button class="prompt-icon" title="AI Features Menu">✦</button>
                    <input type="text" placeholder="Generate effect or search...">
                    <button style="border:none;background:transparent;cursor:pointer;">⛶</button>
                    <div class="play-controls">
                        <button class="b-play-btn" id="play-pause-btn">▶</button>
                        <span id="time-display" class="b-time">00:00:00</span>
                    </div>
                </div>
            </div>

            <!-- BOTTOM ROW -->
            <div class="bento-bottom-row">
                <!-- Properties -->
                <div class="bento-panel bg-white bento-controls">
                    <div class="bc-tabs">
                        <span class="active">STYLES</span>
                        <span>TEXT</span>
                        <span>AI TOOL</span>
                    </div>
                    <div class="bc-scrollable">
                        <h3 class="bento-title text-black">COLOR & GRADING</h3>
                        <div class="bento-sliders">
                            <div class="b-slider-row"><span>EXP</span><input type="range" id="adj-bright" min="-2" max="2" step="0.1" value="0"></div>
                            <div class="b-slider-row"><span>CRT</span><input type="range" id="adj-contrast" min="0" max="200" value="100"></div>
                            <div class="b-slider-row"><span>SAT</span><input type="range" id="adj-sat" min="0" max="200" value="100"></div>
                        </div>

                        <h3 class="bento-title text-black mt-3">TRANSFORM & SPEED</h3>
                        <div class="bento-sliders">
                            <div class="b-slider-row"><span>SCL</span><input type="range" id="adj-scale" min="10" max="200" value="100"></div>
                            <div class="b-slider-row"><span>POS</span><input type="range" id="adj-pos" value="50" min="0" max="100"></div>
                            <div class="b-slider-row"><span>ROT</span><input type="range" id="adj-rot" value="0" min="-180" max="180"></div>
                            <div class="b-slider-row"><span>SPD</span><input type="range" id="adj-spd" value="100" min="10" max="400"></div>
                            <div class="b-slider-row" style="display:none;"><input type="range" id="adj-opac" value="100"></div>
                        </div>

                        <h3 class="bento-title text-black mt-3">EFFECTS & TRANSITIONS</h3>
                        <div class="bento-pills">
                            <label class="fx-pill"><input type="checkbox" id="fx-blur"> BLUR</label>
                            <label class="fx-pill dark"><input type="checkbox" id="fx-glow"> GLOW</label>
                            <label class="fx-pill"><input type="checkbox" id="fx-vhs"> VHS GLITCH</label>
                            <label class="fx-pill dark"><input type="checkbox" id="fx-grain"> FILM GRAIN</label>
                            <label class="fx-pill"><input type="checkbox" id="fx-dissolve" style="display:none;">DISSOLVE</label>
                            <label class="fx-pill">SLIDE WIPE</label>
                        </div>
                        
                        <h3 class="bento-title text-black mt-3">AI CAPABILITIES</h3>
                        <div class="bento-pills">
                            <label class="fx-pill ai">Auto Cut Silence</label>
                            <label class="fx-pill ai">Auto Subtitles</label>
                            <label class="fx-pill ai dark" id="btn-remove-bg" style="cursor:pointer;">Remove Background</label>
                            <label class="fx-pill ai">Beat Sync</label>
                        </div>

                        <h3 class="bento-title text-black mt-3">TEXT & OVERLAYS</h3>
                        <div class="b-slider-row mt-1" style="margin-bottom:8px;"><button id="btn-add-text" style="width:100%; padding:8px; border-radius:10px; border:1px solid #ccc; background:#fff; cursor:pointer;" onclick="AudioEngine.playClick()">+ Add Text Layer</button></div>
                        <div class="bento-pills">
                            <label class="fx-pill">Typewriter</label>
                            <label class="fx-pill">Bounce Drop</label>
                            <label class="fx-pill dark">Screen Blend Mode</label>
                        </div>
                    </div>
                </div>

                <!-- Timeline -->
                <div class="bento-panel bg-dark bento-timeline-panel">
                    <div class="timeline-header">
                        <div class="th-left">
                            <span class="th-title">TIMELINE</span>
                            <div class="timeline-tools">
                                <button title="Selection Tool (V)" id="btn-tl-select">🖱️</button>
                                <button title="Razor Cut (C)" id="btn-tl-razor">✂️</button>
                                <button title="Delete Clip" id="btn-tl-delete">🗑️</button>
                                <button title="Toggle Snap (S)" id="btn-tl-snap">🧲</button>
                                <button title="Add Marker (M)" id="btn-tl-marker">📍</button>
                                <button title="Copy Clip" id="btn-copy-clip">⎘</button>
                                <button title="Paste Clip" id="btn-paste-clip">⎙</button>
                            </div>
                        </div>
                        <div class="th-tools">
                            <input type="range" id="tl-zoom" class="tl-zoom" title="Zoom Timeline" min="10" max="200" value="60">
                            <span class="audio-meter"><div class="meter-bar"><div class="meter-fill" id="meter-l"></div></div><div class="meter-bar"><div class="meter-fill" id="meter-r"></div></div></span>
                        </div>
                    </div>
                    <div class="timeline-ruler" id="seek-bar"></div>
                    <div class="timeline-tracks-area" id="timeline-container">
                        <div class="bento-playhead" id="playhead"><div class="playhead-tri"></div></div>
                        <div id="v3-track" style="display:none"></div>
                        <div class="b-track visual-track" id="t1-track">
                            <div class="tr-label">T1</div>
                        </div>
                        <div class="b-track visual-track" id="v2-track">
                            <div class="tr-label">V2</div>
                        </div>
                        <div class="b-track visual-track" id="visual-track">
                            <div class="tr-label">V1</div>
                        </div>
                        <div class="b-track audio-track" id="audio-track">
                            <div class="tr-label">A1</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- RIGHT BENTO AREA -->
        <div class="bento-right-col">
            <div class="bento-panel bg-white bento-search-wrap">
                <span class="search-icon">🔍</span>
                <input type="text" placeholder="Search Filter...">
            </div>
            
            <div class="bento-panel bg-silver bento-media-pool">
                <input type="file" id="media-upload" multiple accept="video/*,image/*,audio/*" style="display:none">
                <div class="bento-library" id="media-library" title="Drag & drop proxy media here">
                    <!-- Cards here -->
                </div>
                <div class="bento-library-shadow"></div>
                <button class="bento-export-btn get-inspired" onclick="document.getElementById('media-upload').click()">
                    <span class="inspire-text">GET INSPIRED</span>
                    <span class="inspire-circle"></span>
                    <div class="eg-shape dark" style="transform: rotate(-10deg) translateY(20px);">UPLOAD YOUR MEDIA</div>
                </button>
            </div>

            <div class="bento-panel bg-white bento-export" id="export-video-btn" style="cursor:pointer">
                <div style="display:flex; justify-content:space-between; align-items:center; z-index:2; position:relative;">
                    <h3 class="bento-title text-black" style="font-size:14px;">RENDER</h3>
                    <div class="export-settings text-black" style="font-size:9px; font-weight:800; background:#f0f0f0; padding:4px 8px; border-radius:10px;">MP4 • 1080p • HIGH</div>
                </div>
                <div class="export-graphics">
                     <div class="eg-shape red"></div>
                     <div class="eg-shape blue"></div>
                     <div class="eg-shape dark"></div>
                </div>
            </div>
        </div>

    </div>
</div>
            `;
            setTimeout(() => { if (typeof initVideoEditor === 'function') initVideoEditor(); }, 200);
        } else if (type === 'photo') {
            content = `
<div class="bento-editor-wrapper">
    <div class="bento-bg" style="background: radial-gradient(circle at 50% 50%, #2a2a35, #111116);"></div>
    
    <!-- TOP NAV -->
    <div class="bento-top-nav">
        <div class="tn-pill">
            <span class="tn-item">File</span>
            <span class="tn-item">Edit</span>
            <span class="tn-item">Image</span>
            <span class="tn-item">Select</span>
        </div>
        <div class="tn-pill" style="margin-left: 20px;">
            <span class="tn-item active">Retouch</span>
            <span class="tn-item">Color</span>
            <span class="tn-item">Masking</span>
        </div>
        <div class="tn-pill" style="margin-left: auto;">
            <span class="tn-item"><button>↩</button></span>
            <span class="tn-item"><button>↪</button></span>
            <span class="tn-item">⚙ 4K • 300DPI</span>
        </div>
    </div>

    <div class="bento-editor-core">
        
        <!-- LEFT BENTO BAR (TOOLS) -->
        <div class="bento-panel bg-white bento-left-bar">
            <div class="bento-logo">✧</div>
            <div class="nav-icons">
                <button class="b-icon active" title="Move Tool (V)">✥</button>
                <button class="b-icon" title="Crop & Straighten (C)">◩</button>
                <button class="b-icon" title="Magic Wand Select (W)">🪄</button>
                <button class="b-icon" title="Brush Tool (B)">🖌</button>
                <button class="b-icon" title="Heal & Clone (J)">🩹</button>
                <button class="b-icon" title="Text (T)">T</button>
                <button class="b-icon" title="Masking (M)">◒</button>
            </div>
            <div class="nav-bottom">
                <div style="border:2px solid #ccc; width:24px; height:24px; background:#000; border-radius:50%; margin-bottom:-8px; position:relative; z-index:2; cursor:pointer; box-shadow:0 2px 5px rgba(0,0,0,0.2);"></div>
                <div style="border:2px solid #aaa; width:24px; height:24px; background:#fff; border-radius:50%; cursor:pointer;"></div>
            </div>
        </div>

        <!-- CENTER AREA -->
        <div class="bento-center-col">
            <!-- PREVIEW CANVAS -->
            <div class="bento-panel bg-dark bento-preview">
                <!-- checkerboard background for transparency -->
                <div style="position:absolute; inset:0; background:repeating-conic-gradient(#1c1c1c 0% 25%, #151515 0% 50%) 50% / 30px 30px; z-index:0; opacity:0.8;"></div>
                
                <canvas id="photo-canvas" width="1080" height="1080" style="background:#fff; aspect-ratio:1/1; height:75%; width:auto; border-radius:8px; z-index:1; box-shadow: 0 10px 40px rgba(0,0,0,0.8);"></canvas>
                
                <div class="preview-prompt-bar">
                    <button class="prompt-icon">✧</button>
                    <input type="text" placeholder="Generate fill or remove object...">
                    <button style="border:none;background:transparent;cursor:pointer;opacity:0.6;">⛶</button>
                    <div class="play-controls">
                        <button class="b-play-btn" style="font-size:10px; font-weight:bold; width:auto; padding:0 12px; border-radius:100px;">100%</button>
                    </div>
                </div>
            </div>

            <!-- BOTTOM ROW (ADJUSTMENTS & LAYERS) -->
            <div class="bento-bottom-row">
                <!-- Properties / Adjustments -->
                <div class="bento-panel bg-white bento-controls">
                    <div class="bc-tabs">
                        <span class="active">ADJUST</span>
                        <span>FILTERS</span>
                        <span>AI RETOUCH</span>
                    </div>
                    <div class="bc-scrollable">
                        <h3 class="bento-title text-black">COLOR & LIGHT</h3>
                        <div class="bento-sliders">
                            <div class="b-slider-row"><span>EXP</span><input type="range" class="photo-rg"></div>
                            <div class="b-slider-row"><span>CON</span><input type="range" class="photo-rg"></div>
                            <div class="b-slider-row"><span>HLT</span><input type="range" class="photo-rg"></div>
                            <div class="b-slider-row"><span>SHA</span><input type="range" class="photo-rg"></div>
                            <div class="b-slider-row"><span>SAT</span><input type="range" class="photo-rg"></div>
                            <div class="b-slider-row"><span>TMP</span><input type="range" class="photo-rg"></div>
                        </div>

                        <h3 class="bento-title text-black mt-3">DETAILS & EFFECTS</h3>
                        <div class="bento-sliders">
                            <div class="b-slider-row"><span>SHP</span><input type="range" class="photo-rg"></div>
                            <div class="b-slider-row"><span>NOI</span><input type="range" class="photo-rg"></div>
                            <div class="b-slider-row"><span>VIG</span><input type="range" class="photo-rg"></div>
                        </div>

                        <h3 class="bento-title text-black mt-3">PRO MASKS & LUTs</h3>
                        <div class="bento-pills">
                            <label class="fx-pill dark">Linear Gradient</label>
                            <label class="fx-pill">Radial Brush</label>
                            <label class="fx-pill dark">Cinematic LUT</label>
                            <label class="fx-pill">B&W Film</label>
                        </div>
                        
                        <h3 class="bento-title text-black mt-3">AI CAPABILITIES</h3>
                        <div class="bento-pills">
                            <label class="fx-pill ai">Auto Enhance</label>
                            <label class="fx-pill ai dark">Background Remover</label>
                            <label class="fx-pill ai">Skin Retouch AI</label>
                            <label class="fx-pill ai">Object Eraser</label>
                        </div>
                    </div>
                </div>

                <!-- Layers Panel -->
                <div class="bento-panel bg-dark bento-timeline-panel" style="padding:0;">
                    <div class="timeline-header" style="padding:15px; border-bottom:1px solid rgba(255,255,255,0.05); margin:0;">
                        <span class="th-title" style="color:#fff; font-weight:700; font-size:12px; letter-spacing:1px;">LAYERS</span>
                        <div class="th-tools timeline-tools">
                            <button title="New Layer" style="width:28px;">＋</button>
                            <button title="Delete" style="width:28px;">🗑</button>
                            <button title="Blend Mode" style="width:28px;">◐</button>
                        </div>
                    </div>
                    
                    <div style="padding:15px; flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:10px;">
                        
                        <!-- Layer Item Selected -->
                        <div style="background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); border-radius:12px; padding:10px; display:flex; align-items:center; gap:10px; cursor:pointer; box-shadow:0 5px 15px rgba(0,0,0,0.3);">
                            <span style="opacity:0.8; font-size:12px;">👁</span>
                            <div style="width:36px; height:36px; background:#444; border-radius:6px; display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:bold;color:#fff;border:1px solid rgba(255,255,255,0.1);">T</div>
                            <div style="flex:1;">
                                <div style="color:#fff; font-size:11px; font-weight:600;">Post Title Text</div>
                                <div style="color:#aaa; font-size:9px;">Screen • 100%</div>
                            </div>
                            <span style="opacity:0.3; font-size:12px;">🔒</span>
                        </div>
                        
                        <!-- Layer Item -->
                        <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:12px; padding:10px; display:flex; align-items:center; gap:10px; cursor:pointer;">
                            <span style="opacity:0.5; font-size:12px;">👁</span>
                            <div style="width:36px; height:36px; background:linear-gradient(135deg, #FF6B6B, #4ECDC4); border-radius:6px; border:1px solid rgba(255,255,255,0.1);"></div>
                            <div style="flex:1;">
                                <div style="color:#fff; font-size:11px; font-weight:600;">Color Balance Adjust</div>
                                <div style="color:#aaa; font-size:9px;">Normal • 80%</div>
                            </div>
                        </div>

                        <!-- Layer Item Background -->
                        <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:12px; padding:10px; display:flex; align-items:center; gap:10px; cursor:pointer;">
                            <span style="opacity:0.5; font-size:12px;">👁</span>
                            <div style="width:36px; height:36px; background:#222; border-radius:6px; border:1px solid rgba(255,255,255,0.1); position:relative; overflow:hidden;">
                                <div style="position:absolute;inset:2px;background:#666;border-radius:4px;"></div>
                            </div>
                            <div style="flex:1;">
                                <div style="color:#fff; font-size:11px; font-weight:600;">Base Background</div>
                                <div style="color:#aaa; font-size:9px;">Normal • 100%</div>
                            </div>
                            <span style="opacity:0.8; color:#fff; font-size:12px;">🔒</span>
                        </div>

                    </div>
                </div>
            </div>
        </div>

        <!-- RIGHT BENTO AREA (ASSETS/EXPORT) -->
        <div class="bento-right-col">
            <div class="bento-panel bg-white bento-search-wrap">
                <span class="search-icon">🔍</span>
                <input type="text" placeholder="Search Assets & Overlays...">
            </div>
            
            <div class="bento-panel bg-silver bento-media-pool">
                <input type="file" id="photo-upload" accept="image/*" style="display:none">
                <div class="bento-library" id="photo-library" title="Drag & drop images here">
                    <div class="media-item" style="aspect-ratio:1/1;"><span>Portrait.jpg</span></div>
                    <div class="media-item" style="aspect-ratio:1/1;"><span>Texture.png</span></div>
                </div>
                <div class="bento-library-shadow"></div>
                <button class="bento-export-btn get-inspired" onclick="document.getElementById('photo-upload').click()">
                    <span class="inspire-text">ASSET LIBRARY</span>
                    <span class="inspire-circle"></span>
                    <div class="eg-shape dark" style="transform: rotate(5deg) translateY(20px);">IMPORT MEDIA</div>
                </button>
            </div>

            <div class="bento-panel bg-white bento-export" style="cursor:pointer">
                <div style="display:flex; justify-content:space-between; align-items:center; z-index:2; position:relative;">
                    <h3 class="bento-title text-black" style="font-size:14px;">EXPORT IMAGE</h3>
                    <div class="export-settings text-black" style="font-size:9px; font-weight:800; background:#f0f0f0; padding:4px 8px; border-radius:10px;">JPEG • 4K • 100%</div>
                </div>
                <div class="export-graphics">
                     <div class="eg-shape red" style="border-radius:50%; background:#ff4a8d;"></div>
                     <div class="eg-shape blue" style="border-radius:8px; background:#4a8dff;"></div>
                     <div class="eg-shape dark" style="border-radius:100px;"></div>
                </div>
            </div>
        </div>

    </div>
</div>
            `;
            setTimeout(() => { if (typeof initPhotoEditor === 'function') initPhotoEditor(); }, 200);
        } else if (type === 'pdf') {
            content = `
<div class="bento-editor-wrapper">
    <div class="bento-bg" style="background: radial-gradient(circle at 50% 50%, #1e2630, #0a0e14);"></div>
    
    <!-- TOP NAV -->
    <div class="bento-top-nav">
        <div class="tn-pill">
            <span class="tn-item">File</span>
            <span class="tn-item">Edit</span>
            <span class="tn-item">Document</span>
        </div>
        <div class="tn-pill" style="margin-left: 20px;">
            <span class="tn-item active">Read</span>
            <span class="tn-item">Annotate</span>
            <span class="tn-item">Security</span>
        </div>
        <div class="tn-pill" style="margin-left: auto;">
            <span class="tn-item"><button>↩</button></span>
            <span class="tn-item"><button>↪</button></span>
            <span class="tn-item">📄 A4 Portrait</span>
        </div>
    </div>

    <div class="bento-editor-core">
        
        <!-- LEFT BENTO BAR (TOOLS) -->
        <div class="bento-panel bg-white bento-left-bar">
            <div class="bento-logo" style="color:#d32f2f;">📄</div>
            <div class="nav-icons">
                <button class="b-icon active" title="Select (V)">✥</button>
                <button class="b-icon" title="Edit Text (T)">T</button>
                <button class="b-icon" title="Highlight (H)">🖍</button>
                <button class="b-icon" title="Draw (D)">🖋</button>
                <button class="b-icon" title="Add Image (I)">🖼</button>
                <button class="b-icon" title="Sign (S)">✍</button>
                <button class="b-icon" title="Lock/Password (P)">🔒</button>
            </div>
            <div class="nav-bottom">
                <button class="b-icon" style="background:rgba(211,47,47,0.1); color:#d32f2f; cursor:pointer;" onclick="AudioEngine.playClick()">✕</button>
            </div>
        </div>

        <!-- CENTER AREA -->
        <div class="bento-center-col">
            <!-- PREVIEW CANVAS -->
            <div class="bento-panel bg-dark bento-preview" style="background:#15181e;">
                <canvas id="pdf-canvas" width="800" height="1131" style="background:#fff; height:85%; width:auto; border-radius:2px; z-index:1; box-shadow: 0 10px 40px rgba(0,0,0,0.4); border:1px solid #ddd;"></canvas>
                
                <div class="preview-prompt-bar">
                    <button class="prompt-icon ai-btn" style="background:#d32f2f;">🔍</button>
                    <input type="text" placeholder="Search document or ask AI...">
                    <button style="border:none;background:transparent;cursor:pointer;opacity:0.6;">⛶</button>
                    <div class="play-controls">
                        <button class="b-play-btn" style="font-size:10px; font-weight:bold; width:auto; padding:0 12px; border-radius:100px;">FIT WIDTH</button>
                    </div>
                </div>
            </div>

            <!-- BOTTOM ROW -->
            <div class="bento-bottom-row">
                <!-- Properties -->
                <div class="bento-panel bg-white bento-controls">
                    <div class="bc-tabs">
                        <span class="active">EDIT</span>
                        <span>CONVERT</span>
                        <span>AI OCR</span>
                    </div>
                    <div class="bc-scrollable">
                        <h3 class="bento-title text-black">FONT & STYLES</h3>
                        <div class="bento-sliders" style="display:grid; grid-template-columns: 1fr 1fr; gap:5px;">
                            <button style="padding:6px; background:#f0f0f0; border:1px solid #ddd; border-radius:4px; font-size:11px; cursor:pointer; text-align:left;">Arial ▼</button>
                            <button style="padding:6px; background:#f0f0f0; border:1px solid #ddd; border-radius:4px; font-size:11px; cursor:pointer;">12 pt</button>
                            <div style="display:flex; justify-content:space-between; grid-column:span 2; margin-top:5px;">
                                <button style="width:30px; height:30px; background:#f0f0f0; border:none; font-weight:bold; cursor:pointer;">B</button>
                                <button style="width:30px; height:30px; background:#f0f0f0; border:none; font-style:italic; cursor:pointer;">I</button>
                                <button style="width:30px; height:30px; background:#f0f0f0; border:none; text-decoration:underline; cursor:pointer;">U</button>
                                <button style="width:30px; height:30px; background:#000; border:none; border-radius:50%; cursor:pointer;"></button>
                            </div>
                        </div>

                        <h3 class="bento-title text-black mt-3">PDF CONVERTER</h3>
                        <div class="bento-pills">
                            <label class="fx-pill">PDF to Word</label>
                            <label class="fx-pill">PDF to JPG</label>
                            <label class="fx-pill dark">Merge PDFs</label>
                            <label class="fx-pill">Split PDF</label>
                        </div>
                        
                        <h3 class="bento-title text-black mt-3">AI SUPERPOWERS</h3>
                        <div class="bento-pills">
                            <label class="fx-pill ai">Auto Summarize</label>
                            <label class="fx-pill ai dark">OCR (Image to Text)</label>
                            <label class="fx-pill ai">Grammar Check</label>
                            <label class="fx-pill ai">Translate</label>
                        </div>
                    </div>
                </div>

                <!-- Pages Panel -->
                <div class="bento-panel bg-dark bento-timeline-panel" style="padding:0;">
                    <div class="timeline-header" style="padding:15px; border-bottom:1px solid rgba(255,255,255,0.05); margin:0;">
                        <span class="th-title" style="color:#fff; font-weight:700; font-size:12px; letter-spacing:1px;">PAGES</span>
                        <div class="th-tools timeline-tools">
                            <button title="Add Blank Page" style="width:28px;">＋</button>
                            <button title="Delete Page" style="width:28px;">🗑</button>
                            <button title="Rotate Page" style="width:28px;">⟳</button>
                        </div>
                    </div>
                    
                    <div style="padding:15px; flex:1; overflow-y:auto; display:flex; gap:10px; overflow-x:auto;">
                        
                        <!-- Page 1 -->
                        <div class="pg-thumb" style="min-width:70px; display:flex; flex-direction:column; align-items:center; gap:5px; cursor:pointer;">
                            <div style="width:60px; height:85px; background:#fff; border-radius:4px; border:2px solid #2a69d1; box-shadow:0 4px 10px rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; position:relative;">
                                <div style="width:40px; height:2px; background:#eee; position:absolute; top:20px;"></div>
                                <div style="width:30px; height:2px; background:#eee; position:absolute; top:28px; left:10px;"></div>
                                <div style="width:40px; height:2px; background:#eee; position:absolute; top:36px;"></div>
                            </div>
                            <span style="font-size:9px; color:#fff;">1</span>
                        </div>
                        
                        <!-- Page 2 -->
                        <div class="pg-thumb" style="min-width:70px; display:flex; flex-direction:column; align-items:center; gap:5px; cursor:pointer; opacity:0.6;">
                            <div style="width:60px; height:85px; background:#fff; border-radius:4px; display:flex; align-items:center; justify-content:center;">
                                <span style="font-size:10px; color:#ccc;">BLANK</span>
                            </div>
                            <span style="font-size:9px; color:#fff;">2</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- RIGHT BENTO AREA (ASSETS/EXPORT) -->
        <div class="bento-right-col">
            <div class="bento-panel bg-white bento-search-wrap">
                <span class="search-icon">🔍</span>
                <input type="text" placeholder="Search Signatures & Stamps...">
            </div>
            
            <div class="bento-panel bg-silver bento-media-pool">
                <input type="file" id="pdf-upload" accept=".pdf,image/*" style="display:none">
                <div class="bento-library" id="pdf-library" title="Drag & drop PDF here">
                    <div class="media-item" style="aspect-ratio:1/1.4; background:#fff;">
                        <span style="bottom:10px; left:10px;">Contract.pdf</span>
                    </div>
                    <div class="media-item" style="aspect-ratio:1/1;">
                        <span style="bottom:10px; left:10px;">Signature.png</span>
                    </div>
                </div>
                <div class="bento-library-shadow"></div>
                <button class="bento-export-btn get-inspired" onclick="document.getElementById('pdf-upload').click()">
                    <span class="inspire-text">UPLOAD FILE</span>
                    <span class="inspire-circle" style="border-color:#ccc; color:#000;"></span>
                    <div class="eg-shape dark" style="transform: rotate(5deg) translateY(20px); background:#d32f2f;">IMPORT PDF</div>
                </button>
            </div>

            <div class="bento-panel bg-white bento-export" style="cursor:pointer">
                <div style="display:flex; justify-content:space-between; align-items:center; z-index:2; position:relative;">
                    <h3 class="bento-title text-black" style="font-size:14px;">EXPORT PDF</h3>
                    <div class="export-settings text-black" style="font-size:9px; font-weight:800; background:#f0f0f0; padding:4px 8px; border-radius:10px;">COMPRESSED • HIGH</div>
                </div>
                <div class="export-graphics">
                     <div class="eg-shape red" style="border-radius:2px; background:#d32f2f;"></div>
                     <div class="eg-shape blue" style="border-radius:2px; background:#ffca28; width:40px;"></div>
                     <div class="eg-shape dark" style="border-radius:2px; width:60px;"></div>
                </div>
            </div>
        </div>

    </div>
</div>
            `;
            setTimeout(() => { if (typeof initPdfEditor === 'function') initPdfEditor(); }, 200);
        } else if (type === 'audio') {
            content = `
<div class="au-wrapper">
    <div class="au-panel">
        
        <!-- Left Sidebar -->
        <div class="au-sidebar">
            <div class="au-logo">🎶</div>
            <div class="au-menu">
                <i class="au-icon active" title="Select (V)">✥</i>
                <i class="au-icon" title="Razor Cut (C)">✂️</i>
                <i class="au-icon" title="Volume / Gain (G)">◭</i>
                <i class="au-icon" title="Equalizer (E)">⎚</i>
                <i class="au-icon" title="Pitch (S)">∿</i>
                <i class="au-icon user-avatar" title="Audio Profile"></i>
            </div>
            <div class="au-bottom-nav">
                <div class="au-sidebar-pill">
                    <i class="au-icon" style="opacity:1;" title="Noise Reduction">🔇</i>
                </div>
            </div>
        </div>

        <!-- Center Main Content -->
        <div class="au-center">
            <div class="au-topbar">
                <button class="au-pill round" onclick="document.getElementById('audio-upload').click()">◀ Upload Audio</button>
                <div class="au-pill dark-pill" style="display:flex; align-items:center;">
                    <span>48kHz</span> <span style="opacity:0.3; padding:0 10px;">|</span> <span>24-Bit</span> <span style="margin-left:5px;">🎙</span>
                </div>
                <button class="au-pill round" onclick="document.getElementById('export-click').click()">Save Mix ▶</button>
                <input type="file" id="audio-upload" accept="audio/*" style="display:none">
            </div>

            <!-- The organic shaped image area -->
            <div class="au-hero">
                <div class="au-hero-content">
                    <div class="au-tag-box">
                        <span class="lbl" id="prompt-lbl">AI Studio Tool</span>
                        <span class="val" id="prompt-val">Vocal Isolation Engine ✨</span>
                    </div>
                    
                    <div class="au-date-box">
                        <span class="lbl" style="display:block;">BPM</span>
                        <span class="val">120</span>
                    </div>
                </div>
                
                <div class="au-glass-card">
                    <h2>STUDIO<br><span class="ylw">MIX</span></h2>
                    <div class="au-glass-stats"><span>♡ 997</span> <span>★ 7523</span> <span>🔖 4644</span></div>
                </div>
                
                <div class="au-round-trigger tr1" onclick="document.getElementById('prompt-val').innerText='Removing Noise...'">🔇</div>
                <div class="au-round-trigger tr2" onclick="document.getElementById('prompt-val').innerText='Auto Balancing EQ...'">⎚</div>
            </div>
        </div>

        <!-- Right Properties -->
        <div class="au-right">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                    <h4 class="au-r-title">Audio Engine</h4>
                    <span class="au-r-subtitle">📍 Studio, Recording Mode</span>
                </div>
            </div>
            
            <div class="au-badges">
                <span class="au-badge active">Voice</span>
                <span class="au-badge">Beat</span>
                <span class="au-badge">SFX</span>
            </div>

            <!-- Audio Player -->
            <div class="au-player">
                <div class="au-player-display" id="au-wave-screen">
                    <canvas id="audio-canvas" width="400" height="150" style="width:100%; height:100%;"></canvas>
                    <div id="audio-playhead" class="audio-playhead"></div>
                </div>
                <input type="range" class="au-slider" id="au-seek" min="0" max="100" value="0">
                <div class="au-player-ctrls">
                    <button type="button" class="audio-skip" data-dir="-1" style="background:none; border:none; color:#f7a600; cursor:pointer; font-size:16px;">⏪</button>
                    <button class="play-btn" id="audio-play-btn" style="background:none; border:none; color:#f7a600; cursor:pointer; font-size:18px;">▶</button>
                    <button type="button" class="audio-skip" data-dir="1" style="background:none; border:none; color:#f7a600; cursor:pointer; font-size:16px;">⏩</button>
                </div>
                <div class="audio-timeline-row" id="audio-timeline-grid"></div>
                <div class="audio-time-row"><span id="audio-time">00:00:00</span></div>
            </div>

            <!-- Years Active / Stats -->
            <div class="au-stats-row">
                <div>
                    <span class="asr-lbl">Master Volume</span>
                    <div class="asr-val" id="vol-display">80<span style="font-size:14px; color:#aaa;">%</span></div>
                </div>
                <div class="asr-circle">◷</div>
            </div>
            <input type="range" class="au-slider" id="audio-vol" min="0" max="150" value="80" style="margin-top:10px;">

            <div class="au-media-library">
                <div class="au-media-header">AUDIO LIBRARY</div>
                <div class="audio-library" id="audio-library"></div>
            </div>

            <div style="display:flex; gap:10px; margin-top:15px;">
                <div style="flex:1; background:rgba(255,255,255,0.04); padding:12px; border-radius:14px; display:flex; flex-direction:column; gap:8px;">
                    <span style="font-size:11px; color:#aaa; letter-spacing:0.08em;">LEFT METER</span>
                    <div style="background:rgba(255,255,255,0.08); border-radius:999px; overflow:hidden; height:10px;">
                        <div id="master-l" style="width:45%; height:100%; background:#f7a600;"></div>
                    </div>
                </div>
                <div style="flex:1; background:rgba(255,255,255,0.04); padding:12px; border-radius:14px; display:flex; flex-direction:column; gap:8px;">
                    <span style="font-size:11px; color:#aaa; letter-spacing:0.08em;">RIGHT METER</span>
                    <div style="background:rgba(255,255,255,0.08); border-radius:999px; overflow:hidden; height:10px;">
                        <div id="master-r" style="width:45%; height:100%; background:#f7a600;"></div>
                    </div>
                </div>
            </div>

            <div class="au-media">
                <div class="au-m-header">
                    <span>Export Audio</span>
                    <div class="au-m-arrows">◀ ▶</div>
                </div>
                <div class="au-circle-thumb" id="export-click" title="Export MP3" style="cursor:pointer; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:800; font-size:14px; text-shadow:0 0 10px #000; letter-spacing:1px; background:#f7a600;">
                    EXPORT
                </div>
            </div>
        </div>
        
    </div>
</div>
            `;
            setTimeout(() => { if (typeof initAudioEditor === 'function') initAudioEditor(); }, 200);
        } else if (type === 'code') {
            content = `
<div class="ide-wrapper">
    <!-- Navbar -->
    <div class="ide-nav">
        <div class="ide-logo">
            <span class="pixel-text" style="font-family: monospace; font-size:20px; font-weight:bold; color:#fff; text-shadow:0 0 10px #39ff14;">&lt;/&gt; PRO IDE</span>
        </div>
        <div class="ide-tabs">
            <button class="ide-tab active" data-file="html">index.html</button>
            <button class="ide-tab" data-file="css">style.css</button>
            <button class="ide-tab" data-file="js">script.js</button>
        </div>
        <div class="ide-actions">
            <button class="ide-btn ai text-glow"><span style="color:#39ff14;">✦</span> Auto-Fix AI</button>
            <button class="ide-btn run" id="ide-run-btn">▶ RUN LİVE</button>
            <button class="ide-btn export" id="ide-export-btn" onclick="document.getElementById('ide-run-btn').click();">EXPORT</button>
        </div>
    </div>

    <!-- Main Workspace -->
    <div class="ide-workspace">
        
        <!-- Sidebar Explorer -->
        <div class="ide-sidebar">
            <div class="ide-sb-title">EXPLORER</div>
            <ul class="ide-sb-list">
                <li class="active" data-file="html">📄 index.html</li>
                <li data-file="css">📄 style.css</li>
                <li data-file="js">📄 script.js</li>
            </ul>
        </div>

        <!-- Code Editor Area -->
        <div class="ide-editor-container">
            <div class="ide-lines" id="ide-lines">1</div>
            <div class="ide-code-layer">
                <!-- Syntax Highlight Layer -->
                <pre class="ide-syntax-overlay" id="ide-syntax" aria-hidden="true"></pre>
                <!-- Actual Textarea -->
                <textarea class="ide-textarea" id="ide-input" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off"></textarea>
            </div>
            
            <div class="ide-ai-suggestion" id="ide-ai-box" style="display:none;"></div>
        </div>

        <!-- Resizer -->
        <div class="ide-resizer" id="ide-resizer-v"></div>

        <!-- Output Area (Right side) -->
        <div class="ide-output-panel">
            <div class="ide-preview-header">
                <span>Live Preview</span>
                <span style="font-size:10px; color:#666;">Viewport: 100%</span>
            </div>
            <div class="ide-iframe-wrapper">
                <iframe id="ide-preview-frame"></iframe>
            </div>
            
            <!-- Resizer Horizontal -->
            <div class="ide-resizer-h" id="ide-resizer-h"></div>
            
            <!-- Console -->
            <div class="ide-console">
                <div class="ide-console-header">
                    <span>CONSOLE</span>
                    <button class="ide-btn" id="ide-clear-console" style="background:transparent; border:none; border-radius:4px; margin:0;">🚫</button>
                </div>
                <div class="ide-console-body" id="ide-console-out">
                    <div class="log">> IDE Initialized... Ready.</div>
                </div>
            </div>
        </div>

    </div>
</div>
            `;
            setTimeout(() => { if (typeof initCodeEditor === 'function') initCodeEditor(); }, 200);
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

    // Toggle Listeners
    document.querySelectorAll('.toggle-switch').forEach(toggle => {
        toggle.addEventListener('click', () => {
            AudioEngine.playClick();
            const id = toggle.id;
            
            if (id === 'toggle-bg-music') {
                AudioEngine.toggleBgMusic();
            } else {
                toggle.classList.toggle('active');
                // Other toggles handled here if needed
            }
        });
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
   PRO VIDEO EDITOR CLASS
   ==================================================================== */
function initVideoEditor() {
    // Prefer advanced editor from video-engine.js when available.
    if (window.ProVideoEditorAdvanced) {
        if (window.currentVideoEditor?.cleanup) window.currentVideoEditor.cleanup();
        window.currentVideoEditor = new window.ProVideoEditorAdvanced();
        return;
    }
    // Fallback to legacy editor in this file.
    window.currentVideoEditor = new ProVideoEditor();
}

class ProVideoEditor {
    constructor() {
        this.library = [];
        this.clips = [];
        this.currentTime = 0;
        this.isPlaying = false;
        this.duration = 15; // default 15s timeline
        this.selectedClipId = null;
        this.isMuted = false;
        this.scale = 60; // timeline px per sec

        this.canvas = document.getElementById('composer-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.libraryDiv = document.getElementById('media-library');

        // Audio Context for sync & export
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.audioDest = this.audioCtx.createMediaStreamDestination();

        this.visualTrack = document.getElementById('visual-track');
        this.audioTrack  = document.getElementById('audio-track');
        this.v2Track     = document.getElementById('v2-track');
        this.v3Track     = document.getElementById('v3-track');
        this.playhead    = document.getElementById('playhead');
        this.seekBar     = document.getElementById('seek-bar');
        this.timeDisplay = document.getElementById('time-display');
        this.playBtn     = document.getElementById('play-pause-btn');
        this.uploadInput = document.getElementById('media-upload');
        this.timelineContainer = document.getElementById('timeline-container');
        this.markerContainer = null;
        this.clipClipboard = null;
        this.snapEnabled = true;
        this.markers = [];
        
        this.meterL = document.getElementById('meter-l');
        this.meterR = document.getElementById('meter-r');

        this.bindEvents();
        this.renderLoop();
    }

    bindEvents() {
        if(this.uploadInput) {
            this.uploadInput.addEventListener('change', (e) => this.handleUpload(e));
        }
        
        if (this.libraryDiv) {
            this.libraryDiv.addEventListener('dragover', (e) => {
                e.preventDefault();
                this.libraryDiv.style.border = '2px dashed #1db954';
            });
            this.libraryDiv.addEventListener('dragleave', (e) => {
                e.preventDefault();
                this.libraryDiv.style.border = '';
            });
            this.libraryDiv.addEventListener('drop', (e) => {
                e.preventDefault();
                this.libraryDiv.style.border = '';
                if (e.dataTransfer.files.length > 0) {
                    this.handleUpload({ target: { files: e.dataTransfer.files } });
                }
            });
        }
        if(this.playBtn) {
            this.playBtn.addEventListener('click', () => this.togglePlayback());
        }

        if (this.seekBar) {
            this.seekBar.addEventListener('mousedown', (e) => this.startScrub(e));
        }
        if (this.timelineContainer) {
            this.timelineContainer.addEventListener('mousedown', (e) => {
                if (e.target.classList.contains('pro-track') || e.target.classList.contains('t-divider-grid') || e.target.id === 'timeline-container' || e.target.classList.contains('pro-clip-segment')) {
                    this.startScrub(e);
                }
            });
        }

        const exportBtn = document.getElementById('export-video-btn');
        if (exportBtn) exportBtn.addEventListener('click', () => this.exportSequence());

        // Binding sliders
        const binds = [
            { id: 'adj-bright', prop: 'brightness', unit: '' },
            { id: 'adj-contrast', prop: 'contrast', unit: '%' },
            { id: 'adj-sat', prop: 'saturation', unit: '%' },
            { id: 'adj-scale', prop: 'scale', unit: '%' },
            { id: 'adj-opac', prop: 'opacity', unit: '%' }
        ];

        binds.forEach(b => {
             const el = document.getElementById(b.id);
             if(el) {
                 el.addEventListener('input', (e) => {
                     const val = e.target.value;
                     const displayEl = document.getElementById(b.id.replace('adj-', 'val-')) || el.nextElementSibling;
                     if(displayEl && displayEl.tagName === 'SPAN') displayEl.innerText = val + b.unit;
                     if (this.selectedClipId) {
                         const clip = this.clips.find(c => c.id === this.selectedClipId);
                         if (clip) { clip.filters[b.prop] = parseFloat(val); this.drawFrame(); }
                     }
                 });
             }
        });

        // Toggles
        ['blur', 'glow', 'vhs', 'grain'].forEach(fx => {
            const el = document.getElementById(`fx-${fx}`);
            if(el) {
                el.addEventListener('change', (e) => {
                    if (this.selectedClipId) {
                        const clip = this.clips.find(c => c.id === this.selectedClipId);
                        if (clip) { clip.effects[fx] = e.target.checked; this.drawFrame(); }
                    }
                });
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        // Ensure AudioContext starts
        document.addEventListener('click', () => {
            if (this.audioCtx && this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }
        }, { once: true });

        // Extra UI bindings
        const bindsExtra = [
            { id: 'adj-pos', prop: 'pos', unit: '' },
            { id: 'adj-rot', prop: 'rotation', unit: '°' },
            { id: 'adj-spd', prop: 'speed', unit: '%' }
        ];

        bindsExtra.forEach(b => {
             const el = document.getElementById(b.id);
             if(el) {
                 el.addEventListener('input', (e) => {
                     const val = e.target.value;
                     if (this.selectedClipId) {
                         const clip = this.clips.find(c => c.id === this.selectedClipId);
                         if (clip) { 
                             if(b.prop === 'pos') {
                                clip.filters.x = (val - 50) * 10; // -500 to 500
                             } else if (b.prop === 'speed') {
                                clip.filters.speed = val / 100;
                                if(clip.mediaEl && clip.item.type !== 'image' && clip.item.type !== 'text') {
                                    clip.mediaEl.playbackRate = clip.filters.speed;
                                }
                             } else {
                                clip.filters[b.prop] = parseFloat(val); 
                             }
                             this.drawFrame(); 
                         }
                     }
                 });
             }
        });

        // Dissolve
        const fxDissolve = document.getElementById('fx-dissolve');
        if(fxDissolve) {
            fxDissolve.addEventListener('change', (e) => {
                if(this.selectedClipId) {
                    const clip = this.clips.find(c => c.id === this.selectedClipId);
                    if(clip) { clip.effects.dissolve = e.target.checked; this.drawFrame(); }
                }
            });
        }

        // Add Text Layer
        const btnAddText = document.getElementById('btn-add-text');
        if(btnAddText) {
            btnAddText.addEventListener('click', () => {
                const textStr = prompt("Enter text for overlay:", "SUPER BOLD TITLE");
                if(textStr) {
                    const item = { id: Date.now() + Math.random(), type: 'text', name: 'Text Layer', text: textStr, origDuration: 5 };
                    this.addToTimeline(item);
                }
            });
        }

        // Remove Background
        const btnRemoveBg = document.getElementById('btn-remove-bg');
        if(btnRemoveBg) {
            btnRemoveBg.addEventListener('click', () => {
                if(this.selectedClipId) {
                    const clip = this.clips.find(c => c.id === this.selectedClipId);
                    if(clip && clip.isVisual) {
                        clip.effects.removeBg = !clip.effects.removeBg;
                        btnRemoveBg.style.background = clip.effects.removeBg ? '#1db954' : '';
                        this.drawFrame();
                    }
                }
            });
        }

        // Timeline Zoom
        const tlZoom = document.getElementById('tl-zoom');
        if(tlZoom) {
            tlZoom.addEventListener('input', (e) => {
                this.scale = parseInt(e.target.value);
                this.renderTimeline();
            });
        }

        // Timeline tools
        const btnRazor = document.getElementById('btn-tl-razor');
        if(btnRazor) btnRazor.addEventListener('click', () => this.splitClip());
        
        const btnDel = document.getElementById('btn-tl-delete');
        if(btnDel) btnDel.addEventListener('click', () => this.deleteClip());

        const snapBtn = document.getElementById('btn-tl-snap');
        if(snapBtn) snapBtn.addEventListener('click', () => {
            this.snapEnabled = !this.snapEnabled;
            snapBtn.classList.toggle('active', this.snapEnabled);
        });

        const btnMarker = document.getElementById('btn-tl-marker');
        if(btnMarker) btnMarker.addEventListener('click', () => this.addMarker());

        const btnCopy = document.getElementById('btn-copy-clip');
        if(btnCopy) btnCopy.addEventListener('click', () => this.copyClip());

        const btnPaste = document.getElementById('btn-paste-clip');
        if(btnPaste) btnPaste.addEventListener('click', () => this.pasteClip());
        
        // Left Nav Tools mapping
        const navBtns = document.querySelectorAll('.bento-left-bar .nav-icons button');
        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                navBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                if(btn.title.includes('Razor Cut')) { this.splitClip(); }
                if(btn.title.includes('Media Bin')) { document.getElementById('media-upload').click(); }
                if(btn.title.includes('Text')) { if(btnAddText) btnAddText.click(); }
            });
        });
    }

    handleKeyDown(e) {
        if (!document.getElementById('tool-overlay').classList.contains('active')) return;
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        if (e.code === 'Space') {
            e.preventDefault();
            this.togglePlayback();
        }
        if ((e.code === 'Backspace' || e.code === 'Delete') && this.selectedClipId) {
            this.deleteClip();
        }
        // Split clip at playhead
        if (e.code === 'KeyC') {
            this.splitClip();
        }
    }

    startScrub(e) {
        if(!this.timelineContainer) return;
        const rect = this.timelineContainer.getBoundingClientRect();
        const sc = this.scale;
        
        const update = (ev) => {
            const x = ev.clientX - rect.left + this.timelineContainer.scrollLeft;
            this.seek((x / sc));
        };
        update(e);

        const onUp = () => {
            document.removeEventListener('mousemove', update);
            document.removeEventListener('mouseup', onUp);
        };
        document.addEventListener('mousemove', update);
        document.addEventListener('mouseup', onUp);
    }

    async handleUpload(e) {
        const files = Array.from(e.target.files);
        let emptyMsg = this.libraryDiv.querySelector('.media-empty');
        if (emptyMsg) emptyMsg.remove();
        
        for (let file of files) {
            const url = URL.createObjectURL(file);
            const type = file.type.split('/')[0];
            const item = { id: Date.now() + Math.random(), file, url, type, name: file.name, thumb: null, origDuration: 0 };
            
            if (type === 'video') {
                await this.generateVideoThumbnail(item);
                this.library.push(item);
                this.renderLib(item);
            } else if (type === 'audio') {
                const audio = document.createElement('audio');
                audio.src = url;
                await new Promise(r => {
                    audio.onloadedmetadata = () => {
                        item.origDuration = audio.duration;
                        r();
                    };
                });
                this.library.push(item);
                this.renderLib(item);
            } else if (type === 'image') {
                item.origDuration = 5;
                this.library.push(item);
                this.renderLib(item);
            }
        }
    }

    generateVideoThumbnail(item) {
        return new Promise((resolve) => {
            const video = document.createElement('video');
            video.src = item.url;
            video.muted = true;
            video.crossOrigin = "anonymous";
            video.currentTime = 1; // get frame at 1s
            video.onloadedmetadata = () => {
                item.origDuration = video.duration;
            };
            video.onseeked = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 160;
                canvas.height = 90;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                item.thumb = canvas.toDataURL('image/jpeg');
                resolve();
            };
            video.onerror = resolve; // fallback
        });
    }

    renderLib(item) {
        const el = document.createElement('div');
        el.className = 'media-item';
        
        if (item.type === 'video') {
            el.innerHTML = `<img src="${item.thumb}" style="width:100%; height:100%; object-fit:cover;"><span>${item.name}</span>`;
        } else if (item.type === 'image') {
            el.innerHTML = `<img src="${item.url}" style="width:100%; height:100%; object-fit:cover;"><span>${item.name}</span>`;
        } else {
            el.innerHTML = `<span class="aud-icon" style="font-size:24px; text-align:center; display:block; padding-top:10px;">🔊</span><span>${item.name}</span>`;
        }
        
        el.addEventListener('click', () => this.addToTimeline(item));
        this.libraryDiv.appendChild(el);
    }

    addToTimeline(item) {
        const isVisual = item.type === 'video' || item.type === 'image';
        let track = isVisual ? 'v1' : 'a1';
        let startAt = this.currentTime; // insert at playhead
        
        let mediaEl = null;
        let audioNode = null;
        
        if (item.type === 'text') {
            // Text has no media element
        } else if (item.type === 'video' || item.type === 'audio') {
            mediaEl = document.createElement(item.type);
            mediaEl.crossOrigin = "anonymous";
            mediaEl.src = item.url;
            mediaEl.preload = 'auto';
            if (item.type === 'video') mediaEl.muted = true; // Video tracks don't play audio directly out
            
            if (this.audioCtx && !mediaEl.muted) {
                try {
                    audioNode = this.audioCtx.createMediaElementSource(mediaEl);
                    audioNode.connect(this.audioCtx.destination);
                    audioNode.connect(this.audioDest);
                } catch(e) { console.error("Audio node error", e); }
            }
        } else if (item.type === 'image') {
            mediaEl = new Image();
            mediaEl.crossOrigin = "anonymous";
            mediaEl.src = item.url;
        }

        const clip = { 
            id: Date.now().toString() + Math.random(),
            item, mediaEl, audioNode, isVisual,
            startAt, duration: item.origDuration, trimStart: 0, track,
            color: isVisual ? '#2a69d1' : '#1db954',
            filters: { brightness: 0, contrast: 100, saturation: 100, volume: 100, scale: 100, opacity: 100, x: 0, y: 0, rotation: 0, speed: 1 },
            effects: { blur: false, glow: false, vhs: false, grain: false }
        };
        this.clips.push(clip);
        
        if (startAt + clip.duration > this.duration - 2) this.duration = startAt + clip.duration + 5;
        this.renderTimeline();
    }

    splitClip() {
        if (!this.selectedClipId) return;
        const clipIndex = this.clips.findIndex(c => c.id === this.selectedClipId);
        if (clipIndex === -1) return;
        const c = this.clips[clipIndex];
        
        if (this.currentTime > c.startAt && this.currentTime < c.startAt + c.duration) {
            const splitAt = this.snapEnabled ? Math.round((this.currentTime - c.startAt) * 10) / 10 : this.currentTime - c.startAt;
            const newDuration1 = splitAt;
            const newDuration2 = c.duration - newDuration1;
            const newTrimStart = c.trimStart + newDuration1;
            
            c.duration = newDuration1;
            
            let newMediaEl = null;
            let newAudioNode = null;
            if (c.item.type === 'video' || c.item.type === 'audio') {
                newMediaEl = document.createElement(c.item.type);
                newMediaEl.crossOrigin = "anonymous";
                newMediaEl.src = c.item.url;
                newMediaEl.preload = 'auto';
                if (c.item.type === 'video') newMediaEl.muted = true;
                
                try {
                    if (this.audioCtx && !newMediaEl.muted) {
                        newAudioNode = this.audioCtx.createMediaElementSource(newMediaEl);
                        newAudioNode.connect(this.audioCtx.destination);
                        newAudioNode.connect(this.audioDest);
                    }
                } catch(e) {}
            } else if (c.item.type === 'image') {
                newMediaEl = new Image();
                newMediaEl.crossOrigin = "anonymous";
                newMediaEl.src = c.item.url;
            }

            const c2 = {
                id: Date.now().toString() + Math.random(),
                item: c.item, mediaEl: newMediaEl, audioNode: newAudioNode, isVisual: c.isVisual,
                startAt: this.currentTime, duration: newDuration2, trimStart: newTrimStart, track: c.track,
                color: c.color,
                filters: JSON.parse(JSON.stringify(c.filters)),
                effects: JSON.parse(JSON.stringify(c.effects))
            };
            
            this.clips.push(c2);
            this.renderTimeline();
        }
    }

    addMarker() {
        const time = this.snapEnabled ? Math.round(this.currentTime * 10) / 10 : this.currentTime;
        this.markers.push({ id: 'm' + Date.now() + Math.random(), time });
        this.renderTimeline();
    }

    copyClip() {
        if (!this.selectedClipId) return;
        const clip = this.clips.find(c => c.id === this.selectedClipId);
        if (!clip) return;
        this.clipClipboard = JSON.parse(JSON.stringify({
            item: clip.item,
            track: clip.track,
            duration: clip.duration,
            filters: clip.filters,
            effects: clip.effects,
            trimStart: clip.trimStart,
            color: clip.color,
            isVisual: clip.isVisual
        }));
    }

    pasteClip() {
        if (!this.clipClipboard) return;
        const data = this.clipClipboard;
        const offset = this.snapEnabled ? Math.round(this.currentTime * 10) / 10 : this.currentTime;
        let mediaEl = null;
        let audioNode = null;

        if (data.item.type === 'video' || data.item.type === 'audio') {
            mediaEl = document.createElement(data.item.type);
            mediaEl.crossOrigin = "anonymous";
            mediaEl.src = data.item.url;
            mediaEl.preload = 'auto';
            if (data.item.type === 'video') mediaEl.muted = true;
            try {
                if (this.audioCtx && !mediaEl.muted) {
                    audioNode = this.audioCtx.createMediaElementSource(mediaEl);
                    audioNode.connect(this.audioCtx.destination);
                    audioNode.connect(this.audioDest);
                }
            } catch(e) {}
        } else if (data.item.type === 'image') {
            mediaEl = new Image();
            mediaEl.crossOrigin = "anonymous";
            mediaEl.src = data.item.url;
        }

        const clip = {
            id: Date.now().toString() + Math.random(),
            item: data.item, mediaEl, audioNode, isVisual: data.isVisual,
            startAt: offset, duration: data.duration, trimStart: data.trimStart, track: data.track,
            color: data.color,
            filters: JSON.parse(JSON.stringify(data.filters)),
            effects: JSON.parse(JSON.stringify(data.effects))
        };
        this.clips.push(clip);
        if (offset + clip.duration > this.duration - 2) this.duration = offset + clip.duration + 5;
        this.renderTimeline();
    }

    renderMarkers() {
        if (!this.timelineContainer) return;
        if (!this.markerContainer) {
            this.markerContainer = document.createElement('div');
            this.markerContainer.className = 'timeline-marker-layer';
            this.timelineContainer.appendChild(this.markerContainer);
        }
        this.markerContainer.innerHTML = '';
        this.markers.forEach(marker => {
            const mark = document.createElement('div');
            mark.className = 'timeline-marker';
            mark.style.left = (marker.time * this.scale) + 'px';
            mark.title = `Marker @ ${this.fmtTime(marker.time)}`;
            mark.addEventListener('click', (e) => {
                e.stopPropagation();
                this.seek(marker.time);
            });
            this.markerContainer.appendChild(mark);
        });
    }

    renderTimeline() {
        if(this.visualTrack) this.visualTrack.innerHTML = '<div class="tr-label">V1</div>';
        if(this.v2Track) this.v2Track.innerHTML = '<div class="tr-label">V2</div>';
        if(this.v3Track) this.v3Track.innerHTML = '<div class="tr-label">V3</div>';
        if(this.audioTrack) this.audioTrack.innerHTML = '<div class="tr-label">A1</div>';

        if(this.timelineContainer) this.timelineContainer.style.width = Math.max(800, this.duration * this.scale) + 'px';
        if(this.seekBar) this.seekBar.style.width = Math.max(800, this.duration * this.scale) + 'px';

        this.renderMarkers();

        this.clips.forEach(clip => {
            const el = document.createElement('div');
            el.className = `pro-clip-segment ${this.selectedClipId === clip.id ? 'selected' : ''}`;
            el.style.left  = (clip.startAt * this.scale) + 'px';
            el.style.width = (clip.duration * this.scale) + 'px';
            el.style.backgroundColor = clip.color;
            el.innerHTML = `<span class="clip-name">[${clip.item.type[0].toUpperCase()}] ${clip.item.name}</span><div class="clip-trim-l"></div><div class="clip-trim-r"></div>`;
            
            el.onmousedown = (e) => {
                e.stopPropagation();
                this.selectClip(clip.id);
                
                const isLeftEdge = e.target.classList.contains('clip-trim-l');
                const isRightEdge = e.target.classList.contains('clip-trim-r');
                
                let sX = e.clientX;
                let sStartAt = clip.startAt;
                let sDuration = clip.duration;
                let sTrimStart = clip.trimStart;
                
                const onMve = (ev) => {
                    let dx = (ev.clientX - sX) / this.scale;
                    if (isLeftEdge) {
                        let newStart = Math.max(0, sStartAt + dx);
                        let diff = newStart - sStartAt;
                        if (sDuration - diff > 0.5 && sTrimStart + diff >= 0) {
                            clip.startAt = newStart;
                            clip.duration = sDuration - diff;
                            clip.trimStart = sTrimStart + diff;
                        }
                    } else if (isRightEdge) {
                        let newDur = Math.max(0.5, sDuration + dx);
                        if (this.snapEnabled) newDur = Math.round(newDur * 10) / 10;
                        if (clip.trimStart + newDur <= clip.item.origDuration || clip.item.type === 'image') {
                            clip.duration = newDur;
                        }
                    } else {
                        let newStart = Math.max(0, sStartAt + dx);
                        if (this.snapEnabled) newStart = Math.round(newStart * 10) / 10;
                        clip.startAt = newStart;
                    }
                    el.style.left = (clip.startAt * this.scale) + 'px';
                    el.style.width = (clip.duration * this.scale) + 'px';
                    if (!this.isPlaying) this.drawFrame();
                };
                const onUp = () => { document.removeEventListener('mousemove', onMve); document.removeEventListener('mouseup', onUp); };
                document.addEventListener('mousemove', onMve);
                document.addEventListener('mouseup', onUp);
            };

            if (clip.track === 'v1' && this.visualTrack) this.visualTrack.appendChild(el);
            else if (clip.track === 'v2' && this.v2Track) this.v2Track.appendChild(el);
            else if (clip.track === 'v3' && this.v3Track) this.v3Track.appendChild(el);
            else if (this.audioTrack) this.audioTrack.appendChild(el);
        });
    }

    selectClip(id) {
        this.selectedClipId = id;
        this.renderTimeline();
        const c = this.clips.find(c => c.id === id);
        if(c) {
            const upd = (idStr, val) => { const el = document.getElementById(idStr); if(el) el.value = val; };
            const updT = (idStr, val) => { const el = document.getElementById(idStr); if(el) el.innerText = val; };
            upd('adj-bright', c.filters.brightness); 
            upd('adj-contrast', c.filters.contrast); 
            upd('adj-sat', c.filters.saturation);    
            upd('adj-scale', c.filters.scale);       
            upd('adj-opac', c.filters.opacity);      
            upd('adj-pos', (c.filters.x / 10) + 50);
            upd('adj-rot', c.filters.rotation);
            upd('adj-spd', c.filters.speed * 100);
            
            const fxChk = (idStr, val) => { const el = document.getElementById(idStr); if(el) el.checked = val; };
            fxChk('fx-blur', c.effects.blur);
            fxChk('fx-glow', c.effects.glow);
            fxChk('fx-vhs', c.effects.vhs);
            fxChk('fx-grain', c.effects.grain);
            fxChk('fx-dissolve', c.effects.dissolve);
            
            const btnRemoveBg = document.getElementById('btn-remove-bg');
            if(btnRemoveBg) btnRemoveBg.style.background = c.effects.removeBg ? '#1db954' : '';
        }
    }

    deleteClip() {
        if(!this.selectedClipId) return;
        const clip = this.clips.find(c => c.id === this.selectedClipId);
        if (clip && clip.mediaEl && typeof clip.mediaEl.pause === 'function') {
            clip.mediaEl.pause();
            clip.mediaEl.removeAttribute('src');
            clip.mediaEl.load();
        }
        this.clips = this.clips.filter(c => c.id !== this.selectedClipId);
        this.selectedClipId = null;
        this.renderTimeline();
        this.drawFrame();
    }

    togglePlayback() {
        this.isPlaying = !this.isPlaying;
        if(this.playBtn) this.playBtn.innerHTML = this.isPlaying ? '⏸' : '▶';
        this.lastTime = performance.now();
        if(this.audioCtx && this.audioCtx.state === 'suspended') this.audioCtx.resume();
        
        if(!this.isPlaying) {
            this.clips.forEach(clip => { if (clip.mediaEl && typeof clip.mediaEl.pause === 'function') clip.mediaEl.pause(); });
            if(this.meterL) this.meterL.style.height = '0%';
            if(this.meterR) this.meterR.style.height = '0%';
        }
    }

    seek(timeSeconds) {
        let t = Math.max(0, timeSeconds);
        this.currentTime = t;
        this.clips.forEach(clip => {
            if (clip.mediaEl && typeof clip.mediaEl.currentTime !== 'undefined') {
                if (this.currentTime >= clip.startAt && this.currentTime <= clip.startAt + clip.duration) {
                    clip.mediaEl.currentTime = clip.trimStart + (this.currentTime - clip.startAt);
                }
            }
        });
        if (!this.isPlaying) this.drawFrame();
    }

    fmtTime(s) {
        const h=Math.floor(s/3600), m=Math.floor((s%3600)/60), sc=Math.floor(s%60), f=Math.floor((s%1)*30);
        return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${sc.toString().padStart(2,'0')}:${f.toString().padStart(2,'0')}`;
    }

    renderLoop() {
        if (!this.canvas) return;
        if (this.isPlaying) {
            const now = performance.now();
            this.currentTime += (now - this.lastTime) / 1000;
            this.lastTime = now;
            if (this.currentTime >= this.duration) { this.currentTime = 0; this.togglePlayback(); }
            
            // Sync media times
            this.clips.forEach(clip => {
                if (clip.mediaEl && typeof clip.mediaEl.currentTime !== 'undefined') {
                    if (this.currentTime >= clip.startAt && this.currentTime <= clip.startAt + clip.duration) {
                        if (clip.mediaEl.paused) {
                            clip.mediaEl.currentTime = clip.trimStart + (this.currentTime - clip.startAt);
                            clip.mediaEl.play().catch(()=>{});
                        }
                        // Check if drift is too large
                        const expectedTime = clip.trimStart + (this.currentTime - clip.startAt);
                        if (Math.abs(clip.mediaEl.currentTime - expectedTime) > 0.2) {
                            clip.mediaEl.currentTime = expectedTime;
                        }
                    } else {
                        if (!clip.mediaEl.paused) clip.mediaEl.pause();
                    }
                }
            });
            
            // Audio Meters Mockup
            const audioClip = this.clips.find(c => !c.isVisual && this.currentTime >= c.startAt && this.currentTime <= c.startAt + c.duration);
            if(audioClip && this.meterL && this.meterR) {
                const vol = 40 + Math.random() * 50;
                this.meterL.style.height = `${vol}%`;
                this.meterR.style.height = `${vol - (Math.random()*10)}%`;
            } else if(this.meterL && this.meterR) {
                this.meterL.style.height = '5%';
                this.meterR.style.height = '5%';
            }
        }
        this.drawFrame();
        
        if(this.playhead) this.playhead.style.left = (this.currentTime * this.scale) + 'px';
        if(this.timeDisplay) this.timeDisplay.innerText = this.fmtTime(this.currentTime);
        
        this.animationRef = requestAnimationFrame(() => this.renderLoop());
    }

    drawFrame() {
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        const activeClips = this.clips.filter(c => c.isVisual && this.currentTime >= c.startAt && this.currentTime <= c.startAt + c.duration);
        activeClips.sort((a,b) => a.track.localeCompare(b.track)); // v1, v2, v3

        activeClips.forEach(c => {
            if (c.mediaEl) {
                const br = 100 + parseFloat(c.filters.brightness || 0)*50;
                let filterStr = `brightness(${br}%) contrast(${c.filters.contrast}%) saturate(${c.filters.saturation}%)`;
                if (c.effects.blur) filterStr += ' blur(12px)';
                this.ctx.filter = filterStr;
                
                this.ctx.globalAlpha = (c.filters.opacity !== undefined ? c.filters.opacity : 100) / 100;
                const sc = (c.filters.scale !== undefined ? c.filters.scale : 100) / 100;
                
                if (c.item.type === 'text') {
                    this.ctx.save();
                    this.ctx.translate(this.canvas.width/2 + c.filters.x, this.canvas.height/2 + c.filters.y);
                    this.ctx.rotate(c.filters.rotation * Math.PI / 180);
                    if (c.effects.glow) { this.ctx.shadowBlur = 40; this.ctx.shadowColor = c.color; }
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.font = `bold ${80 * sc}px 'Inter', sans-serif`;
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText(c.item.text, 0, 0);
                    this.ctx.restore();
                } else if (c.item.type === 'video' || (c.item.type === 'image' && c.mediaEl.complete)) {
                    const vW = c.item.type === 'video' ? c.mediaEl.videoWidth  : c.mediaEl.width;
                    const vH = c.item.type === 'video' ? c.mediaEl.videoHeight : c.mediaEl.height;
                    if (vW && vH) {
                        const s  = Math.min(this.canvas.width / vW, this.canvas.height / vH) * sc;
                        const dW = vW * s, dH = vH * s;
                        this.ctx.save();
                        if (c.effects.glow) { this.ctx.shadowBlur = 60; this.ctx.shadowColor = '#00f0ff'; }
                        
                        this.ctx.translate(this.canvas.width/2 + c.filters.x, this.canvas.height/2 + c.filters.y);
                        this.ctx.rotate(c.filters.rotation * Math.PI / 180);
                        
                        if (c.effects.removeBg) {
                            this.ctx.globalCompositeOperation = 'screen';
                        }
                        if (c.effects.dissolve) {
                            const edge = 1.0;
                            const tIn = this.currentTime - c.startAt;
                            const tOut = (c.startAt + c.duration) - this.currentTime;
                            if (tIn < edge) this.ctx.globalAlpha *= (tIn / edge);
                            else if (tOut < edge) this.ctx.globalAlpha *= (tOut / edge);
                        }
                        
                        this.ctx.drawImage(c.mediaEl, -dW/2, -dH/2, dW, dH);
                        this.ctx.globalCompositeOperation = 'source-over';
                        this.ctx.restore();
                    }
                }
                this.ctx.filter = 'none';
                this.ctx.globalAlpha = 1;
            }
        });
        
        // Static VHS overlay
        if(activeClips.some(c => c.effects.vhs)) {
            this.ctx.fillStyle = `rgba(255, 0, 0, ${Math.random()*0.1})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = `rgba(0, 255, 0, ${Math.random()*0.1})`;
            this.ctx.fillRect(0, 50 + Math.random()*200, this.canvas.width, 10);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '40px Courier New';
            this.ctx.fillText(`SP ${this.fmtTime(this.currentTime)}`, 50, 680);
        }
        
        // Film grain overlay
        if(activeClips.some(c => c.effects.grain)) {
            const idata = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            for (let i = 0; i < idata.data.length; i += 4) {
                const noise = (Math.random() - 0.5) * 40;
                idata.data[i] += noise;
                idata.data[i+1] += noise;
                idata.data[i+2] += noise;
            }
            this.ctx.putImageData(idata, 0, 0);
        }
    }

    async exportSequence() {
        const btn = document.getElementById('export-video-btn');
        const ogContent = btn.innerHTML;
        btn.innerHTML = '<div style="color:#000; font-weight:bold; width:100%; text-align:center;">RENDERING... <span id="render-pct">0%</span></div>';
        btn.classList.add('rendering');
        
        this.seek(0);
        if (this.isPlaying) this.togglePlayback();
        
        // Setup MediaRecorder
        const canvasStream = this.canvas.captureStream(30);
        
        // Combine audio and video streams
        const tracks = [...canvasStream.getVideoTracks()];
        if (this.audioDest && this.audioDest.stream.getAudioTracks().length > 0) {
            tracks.push(...this.audioDest.stream.getAudioTracks());
        }
        
        const stream = new MediaStream(tracks);
        
        let options = { mimeType: 'video/webm; codecs=vp9' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options = { mimeType: 'video/webm; codecs=vp8' };
        }
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options = { mimeType: 'video/mp4' };
        }
        
        let recorder;
        try {
            recorder = new MediaRecorder(stream, options);
        } catch(e) {
            recorder = new MediaRecorder(stream); // fallback to default
        }

        const chunks = [];
        recorder.ondataavailable = e => { if(e.data.size > 0) chunks.push(e.data); };
        
        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: recorder.mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `THE_LAZY_RENDER_${Date.now()}.webm`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            
            btn.innerHTML = '<div style="color:#fff; font-weight:bold; width:100%; text-align:center; background:#1db954; border-radius:10px; padding:10px;">✅ SUCCESS</div>';
            setTimeout(() => {
                btn.innerHTML = ogContent;
                btn.classList.remove('rendering');
            }, 3000);
        };
        
        recorder.start();
        
        // Real-time render loop for export
        const exportFps = 30;
        const frameTime = 1 / exportFps;
        
        if (this.audioCtx && this.audioCtx.state === 'suspended') this.audioCtx.resume();
        
        const renderNextFrame = () => {
            if (this.currentTime >= this.duration) {
                recorder.stop();
                this.clips.forEach(c => { if(c.mediaEl && !c.mediaEl.paused) c.mediaEl.pause(); });
                return;
            }
            
            this.seek(this.currentTime + frameTime);
            
            const pct = Math.round((this.currentTime / this.duration) * 100);
            const pctEl = document.getElementById('render-pct');
            if (pctEl) pctEl.innerText = `${pct}%`;
            
            requestAnimationFrame(renderNextFrame);
        };
        
        renderNextFrame();
    }

    cleanup() {
        if (this.animationRef) cancelAnimationFrame(this.animationRef);
        this.isPlaying = false;
        this.clips.forEach(c => { 
            if(c.mediaEl) {
                c.mediaEl.pause();
                c.mediaEl.removeAttribute('src');
                c.mediaEl.load();
            }
            if(c.audioNode) {
                c.audioNode.disconnect();
            }
        });
        this.library = [];
        this.clips = [];
    }
}


/* ====================================================================
   PRO PHOTO EDITOR CLASS
   ==================================================================== */
function initPhotoEditor() {
    window.currentPhotoEditor = new ProPhotoEditor();
}

class ProPhotoEditor {
    constructor() {
        this.canvas = document.getElementById('photo-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.uploadInput = document.getElementById('photo-upload');
        this.libraryDiv = document.getElementById('photo-library');

        this.imageLoaded = false;
        this.img = new Image();

        this.settings = {
            brightness: 100, contrast: 100, saturation: 100, sepia: 0, invert: 0, 
            blur: 0, hue: 0, grayscale: 0
        };

        this.activeTool = 'move';
        this.isDrawing = false;

        this.bindEvents();
        this.initWelcomeScreen();
    }

    initWelcomeScreen() {
        this.ctx.fillStyle = '#f0f0f0';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#888';
        this.ctx.font = 'bold 30px Inter';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('IMPORT MEDIA TO START', this.canvas.width/2, this.canvas.height/2);
    }

    bindEvents() {
        const sliders = document.querySelectorAll('.photo-rg');
        if (sliders.length >= 6) {
            this.mapSlider(sliders[0], 0, 200, 100, 'brightness');
            this.mapSlider(sliders[1], 0, 200, 100, 'contrast');
            this.mapSlider(sliders[2], 0, 100, 0, 'sepia');
            this.mapSlider(sliders[3], 0, 100, 0, 'grayscale');
            this.mapSlider(sliders[4], 0, 200, 100, 'saturation');
            this.mapSlider(sliders[5], -180, 180, 0, 'hue');
        }

        if (this.uploadInput) {
            this.uploadInput.addEventListener('change', (e) => this.handleUpload(e));
        }

        const renderBtn = document.querySelector('.bento-export');
        if (renderBtn) renderBtn.addEventListener('click', () => this.exportImage(renderBtn));

        const promptIcon = document.querySelector('.prompt-icon');
        const promptInput = document.querySelector('.preview-prompt-bar input');
        if (promptIcon && promptInput) {
            promptIcon.addEventListener('click', () => this.runAIFill(promptInput.value));
            promptInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this.runAIFill(promptInput.value);
            });
        }
        
        document.querySelectorAll('.b-icon').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.b-icon').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.activeTool = btn.title.split(' ')[0].toLowerCase();
            });
        });

        document.querySelectorAll('.bc-tabs span').forEach((tab, index) => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.bc-tabs span').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
            });
        });
        
        this.canvas.addEventListener('mousedown', (e) => { if(this.activeTool === 'brush') this.isDrawing = true; });
        this.canvas.addEventListener('mousemove', (e) => {
            if(!this.isDrawing || this.activeTool !== 'brush') return;
            const rect = this.canvas.getBoundingClientRect();
            const sx = this.canvas.width / rect.width;
            const sy = this.canvas.height / rect.height;
            const x = (e.clientX - rect.left) * sx;
            const y = (e.clientY - rect.top) * sy;
            this.ctx.fillStyle = 'rgba(255, 0, 100, 0.5)';
            this.ctx.beginPath();
            this.ctx.arc(x, y, 20, 0, Math.PI*2);
            this.ctx.fill();
        });
        window.addEventListener('mouseup', () => this.isDrawing = false);
        
        document.querySelectorAll('.fx-pill.ai').forEach(pill => {
            pill.addEventListener('click', () => {
                pill.style.background = '#2a69d1';
                pill.style.color = '#fff';
                setTimeout(() => {
                    pill.style.background = '';
                    pill.style.color = '';
                    this.runAIFill(pill.innerText);
                }, 800);
            });
        });
        
        document.querySelectorAll('.fx-pill:not(.ai)').forEach(pill => {
            pill.addEventListener('click', () => {
                if(pill.classList.contains('dark')) pill.classList.remove('dark');
                else pill.classList.add('dark');
                this.runFilterMock(pill.innerText);
            });
        });
    }

    mapSlider(el, min, max, val, prop) {
        el.min = min; el.max = max; el.value = val;
        el.addEventListener('input', (e) => {
            this.settings[prop] = parseFloat(e.target.value);
            this.renderCanvas();
        });
    }

    handleUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        
        const item = document.createElement('div');
        item.className = 'media-item';
        item.style.aspectRatio = '1/1';
        item.innerHTML = `<img src="${url}"><span>${file.name}</span>`;
        item.onclick = () => this.loadImage(url);
        this.libraryDiv.prepend(item);
        
        this.loadImage(url);
    }

    loadImage(url) {
        this.img.onload = () => {
            this.imageLoaded = true;
            this.renderCanvas();
        };
        this.img.src = url;
    }

    renderCanvas() {
        if (!this.imageLoaded) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const f = this.settings;
        this.ctx.filter = `brightness(${f.brightness}%) contrast(${f.contrast}%) saturate(${f.saturation}%) sepia(${f.sepia}%) grayscale(${f.grayscale}%) hue-rotate(${f.hue}deg)`;
        
        const s = Math.min(this.canvas.width / this.img.width, this.canvas.height / this.img.height);
        const w = this.img.width * s;
        const h = this.img.height * s;
        const x = (this.canvas.width - w) / 2;
        const y = (this.canvas.height - h) / 2;
        
        this.ctx.drawImage(this.img, x, y, w, h);
        this.ctx.filter = 'none';
    }

    runFilterMock(name) {
        if(!this.imageLoaded) return;
        this.ctx.fillStyle = `rgba(${Math.random()*100}, ${Math.random()*150}, ${Math.random()*255}, 0.2)`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    runAIFill(promptText) {
        const input = document.querySelector('.preview-prompt-bar input');
        if(input) input.value = 'Working AI... ✨';
        
        setTimeout(() => {
            if(input) input.value = '';
            this.ctx.fillStyle = `rgba(${Math.random()*255}, ${Math.random()*255}, ${Math.random()*255}, 0.3)`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 50px Inter';
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = '#000';
            this.ctx.shadowBlur = 10;
            this.ctx.fillText(`AI Applied: ${promptText}`, this.canvas.width/2, this.canvas.height/2);
            this.ctx.shadowBlur = 0;
        }, 1500);
    }

    exportImage(btn) {
        if(!this.imageLoaded) return;
        const h3 = btn.querySelector('.bento-title');
        const ogText = h3.innerText;
        h3.innerText = 'RENDERING...';
        setTimeout(() => {
            const a = document.createElement('a');
            a.download = 'Photo_Pro_Render.jpg';
            a.href = this.canvas.toDataURL('image/jpeg', 1.0);
            a.click();
            h3.innerText = '✅ SUCCESS';
            setTimeout(() => h3.innerText = ogText, 2000);
        }, 1200);
    }
}

/* ====================================================================
   PRO PDF EDITOR CLASS
   ==================================================================== */
function initPdfEditor() {
    window.currentPdfEditor = new ProPdfEditor();
}

class ProPdfEditor {
    constructor() {
        this.canvas = document.getElementById('pdf-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.libraryDiv = document.getElementById('pdf-library');
        this.uploadInput = document.getElementById('pdf-upload');

        this.pdfLoaded = false;
        this.texts = [
            { x: 100, y: 150, text: 'AGREEMENT CONTRACT', size: 30, bold: true },
            { x: 100, y: 220, text: 'This document serves as a binding agreement.', size: 16, bold: false },
            { x: 100, y: 300, text: 'Signature:', size: 16, bold: false }
        ];

        this.activeTool = 'move';
        this.isDrawing = false;
        this.drawings = [];
        this.currentDraw = [];

        this.bindEvents();
        this.renderBlank();
    }

    renderBlank() {
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#aaa';
        this.ctx.font = '24px Inter';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('IMPORT PDF TO START', this.canvas.width/2, this.canvas.height/2);
    }

    bindEvents() {
        if (this.uploadInput) {
            this.uploadInput.addEventListener('change', (e) => this.handleUpload(e));
        }

        const renderBtn = document.querySelector('.bento-export');
        if (renderBtn) renderBtn.addEventListener('click', () => this.exportPdf(renderBtn));

        const aiBtn = document.querySelector('.ai-btn');
        const promptInput = document.querySelector('.preview-prompt-bar input');
        if (aiBtn && promptInput) {
            aiBtn.addEventListener('click', () => this.runAIScan(promptInput.value));
            promptInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this.runAIScan(promptInput.value);
            });
        }
        
        document.querySelectorAll('.b-icon').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.b-icon').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const title = btn.title.toLowerCase();
                if (title.includes('draw')) this.activeTool = 'draw';
                else if (title.includes('highlight')) this.activeTool = 'highlight';
                else if (title.includes('text')) this.activeTool = 'text';
                else this.activeTool = 'move';
            });
        });
        
        this.canvas.addEventListener('mousedown', (e) => { 
            if(!this.pdfLoaded) return;
            if(this.activeTool === 'draw' || this.activeTool === 'highlight') {
                this.isDrawing = true;
                this.currentDraw = [this.getPos(e)];
            } else if (this.activeTool === 'text') {
                const pos = this.getPos(e);
                this.texts.push({ x: pos.x, y: pos.y, text: 'New Text Block', size:16, bold:false });
                this.renderCanvas();
            }
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if(!this.isDrawing || !this.pdfLoaded) return;
            const pos = this.getPos(e);
            this.currentDraw.push(pos);
            this.renderCanvas(); // Re-render to show active drawing
            
            // Draw current stroke on top immediately
            this.ctx.beginPath();
            this.ctx.moveTo(this.currentDraw[0].x, this.currentDraw[0].y);
            for(let i=1; i<this.currentDraw.length; i++) {
                this.ctx.lineTo(this.currentDraw[i].x, this.currentDraw[i].y);
            }
            if(this.activeTool === 'highlight') {
                this.ctx.strokeStyle = 'rgba(255, 235, 59, 0.5)';
                this.ctx.lineWidth = 20;
            } else {
                this.ctx.strokeStyle = '#000';
                this.ctx.lineWidth = 3;
            }
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.stroke();
        });
        
        window.addEventListener('mouseup', () => {
            if(this.isDrawing) {
                this.isDrawing = false;
                if(this.currentDraw.length > 0) {
                    this.drawings.push({ path: [...this.currentDraw], tool: this.activeTool });
                }
                this.currentDraw = [];
                this.renderCanvas();
            }
        });

        document.querySelectorAll('.fx-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                if(pill.classList.contains('ai')) this.runAIScan(pill.innerText);
                else {
                    pill.classList.toggle('dark');
                    if(this.pdfLoaded) this.renderCanvas();
                }
            });
        });
    }

    getPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
            y: (e.clientY - rect.top) * (this.canvas.height / rect.height)
        };
    }

    handleUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const item = document.createElement('div');
        item.className = 'media-item';
        item.style.aspectRatio = '1/1.4';
        item.style.background = '#fff';
        item.innerHTML = `<span style="bottom:10px; left:10px;">${file.name}</span>`;
        item.onclick = () => this.loadPdf();
        this.libraryDiv.prepend(item);
        
        this.loadPdf();
    }

    loadPdf() {
        this.pdfLoaded = true;
        this.renderCanvas();
    }

    renderCanvas() {
        if (!this.pdfLoaded) return;
        
        // Base PDF Page
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw Texts
        this.ctx.textAlign = 'left';
        this.ctx.fillStyle = '#000';
        this.texts.forEach(t => {
            this.ctx.font = `${t.bold?'bold':''} ${t.size}px Arial`;
            this.ctx.fillText(t.text, t.x, t.y);
        });

        // Draw Annotations
        this.drawings.forEach(d => {
            if(d.path.length === 0) return;
            this.ctx.beginPath();
            this.ctx.moveTo(d.path[0].x, d.path[0].y);
            for(let i=1; i<d.path.length; i++) this.ctx.lineTo(d.path[i].x, d.path[i].y);
            
            if(d.tool === 'highlight') {
                this.ctx.strokeStyle = 'rgba(255, 235, 59, 0.5)';
                this.ctx.lineWidth = 20;
            } else {
                this.ctx.strokeStyle = '#000';
                this.ctx.lineWidth = 3;
            }
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.stroke();
        });
    }

    runAIScan(promptText) {
        const input = document.querySelector('.preview-prompt-bar input');
        if(input) input.value = 'Running AI OCR... ✨';
        
        setTimeout(() => {
            if(input) input.value = '';
            if(!this.pdfLoaded) this.loadPdf();
            
            // Add a mock AI summary box
            this.ctx.fillStyle = 'rgba(211, 47, 47, 0.1)';
            this.ctx.fillRect(50, 400, this.canvas.width-100, 150);
            this.ctx.strokeStyle = '#d32f2f';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(50, 400, this.canvas.width-100, 150);
            
            this.ctx.fillStyle = '#d32f2f';
            this.ctx.font = 'bold 20px Inter';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`AI Analysis: ${promptText}`, 70, 440);
            this.ctx.fillStyle = '#333';
            this.ctx.font = '16px Inter';
            this.ctx.fillText('• Automatic text extraction complete.', 70, 480);
            this.ctx.fillText('• Grammar checks passed with 95% accuracy.', 70, 510);
        }, 1500);
    }

    exportPdf(btn) {
        if(!this.pdfLoaded) return;
        const h3 = btn.querySelector('.bento-title');
        const ogText = h3.innerText;
        h3.innerText = 'CONVERTING...';
        setTimeout(() => {
            const a = document.createElement('a');
            a.download = 'Document_Export.pdf'; // Mocks PDF download using img for now
            a.href = this.canvas.toDataURL('image/jpeg', 0.8);
            a.click();
            h3.innerText = '✅ SUCCESS';
            setTimeout(() => h3.innerText = ogText, 2000);
        }, 1200);
    }
}

/* ====================================================================
   PRO AUDIO EDITOR CLASS
   ==================================================================== */
function initAudioEditor() {
    window.currentAudioEditor = new ProAudioEditor();
}

class ProAudioEditor {
    constructor() {
        this.canvas = document.getElementById('audio-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        
        this.libraryDiv = document.getElementById('audio-library');
        this.uploadInput = document.getElementById('audio-upload');
        this.playBtn = document.getElementById('audio-play-btn');
        this.playhead = document.getElementById('audio-playhead');
        this.timeDisplay = document.getElementById('audio-time');
        this.seekInput = document.getElementById('au-seek');
        this.exportBtn = document.getElementById('export-click');
        this.skipButtons = Array.from(document.querySelectorAll('.audio-skip'));
        
        this.meterL = document.getElementById('master-l');
        this.meterR = document.getElementById('master-r');

        this.audio = new Audio();
        this.currentFile = null;
        this.currentURL = null;

        this.isPlaying = false;
        this.currentTime = 0;
        this.duration = 30; // 30 seconds default
        this.scale = Math.max(220, window.innerWidth * 0.25) / this.duration;
        
        this.vol = 0.8;
        this.audioLoaded = false;
        
        // Procedural Waveform Engine
        this.waveData = Array.from({length: 200}, () => Math.random() * 0.5 + 0.1);

        this.bindEvents();
        this.renderBlankCanvas();
    }

    renderBlankCanvas() {
        this.ctx.fillStyle = '#0a0d14';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#00f0ff';
        this.ctx.font = '24px Inter';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('IMPORT AUDIO TO START', this.canvas.width/2, this.canvas.height/2);
    }

    bindEvents() {
        if (this.uploadInput) {
            this.uploadInput.addEventListener('change', (e) => this.handleUpload(e));
        }

        if (this.exportBtn) {
            this.exportBtn.addEventListener('click', () => this.exportAudio(this.exportBtn));
        }

        if (this.playBtn) {
            this.playBtn.addEventListener('click', () => this.togglePlayback());
        }

        if (this.seekInput) {
            this.seekInput.addEventListener('input', (e) => {
                if (!this.audioLoaded) return;
                const seekValue = parseFloat(e.target.value) / 100;
                this.currentTime = Math.max(0, Math.min(this.duration, this.duration * seekValue));
                if (this.audio && !isNaN(this.currentTime)) {
                    this.audio.currentTime = this.currentTime;
                }
                this.updatePlayhead();
                this.drawWaveform();
            });
        }

        if (this.skipButtons.length) {
            this.skipButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const dir = parseInt(btn.dataset.dir, 10) || 0;
                    if (!this.audioLoaded) return;
                    this.currentTime = Math.max(0, Math.min(this.duration, this.currentTime + dir * 5));
                    this.audio.currentTime = this.currentTime;
                    this.updatePlayhead();
                    this.drawWaveform();
                });
            });
        }

        const promptVal = document.getElementById('prompt-val');
        document.querySelectorAll('.au-round-trigger').forEach(btn => {
            btn.addEventListener('click', () => {
                const promptText = promptVal ? promptVal.innerText : 'Audio intelligence';
                this.runAI(promptText);
            });
        });
        
        const volSlider = document.getElementById('audio-vol');
        if(volSlider) volSlider.addEventListener('input', (e) => {
            this.vol = e.target.value / 100;
            if (this.audio) this.audio.volume = this.vol;
        });

        document.querySelectorAll('.fx-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                if(pill.classList.contains('ai')) this.runAI(pill.innerText);
                else {
                    pill.classList.toggle('dark');
                }
            });
        });
        
        const grid = document.getElementById('audio-timeline-grid');
        if(grid) {
            grid.addEventListener('mousedown', (e) => {
                const rect = grid.getBoundingClientRect();
                const seekTo = ((e.clientX - rect.left) / rect.width) * this.duration;
                this.currentTime = Math.max(0, Math.min(seekTo, this.duration));
                if (this.audio) this.audio.currentTime = this.currentTime;
                this.updatePlayhead();
                if(!this.isPlaying) this.drawWaveform();
            });

            grid.addEventListener('dragover', (e) => {
                e.preventDefault();
                grid.style.background = 'rgba(255,255,255,0.06)';
            });
            grid.addEventListener('dragleave', () => {
                grid.style.background = '';
            });
            grid.addEventListener('drop', (e) => {
                e.preventDefault();
                grid.style.background = '';
                if (e.dataTransfer.files.length > 0) {
                    this.handleUpload({ target: { files: e.dataTransfer.files } });
                }
            });
        }

        this.audio.addEventListener('timeupdate', () => {
            if (!this.isPlaying) return;
            this.currentTime = this.audio.currentTime;
            this.updatePlayhead();
            this.drawWaveform();
        });

        this.audio.addEventListener('ended', () => {
            this.isPlaying = false;
            if(this.playBtn) this.playBtn.innerText = '▶';
        });
    }

    handleUpload(e) {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        files.forEach((file, index) => {
            const url = URL.createObjectURL(file);
            const item = document.createElement('div');
            item.className = 'media-item';
            item.style.cssText = 'aspect-ratio:auto; padding:15px; display:flex; align-items:center; background:#111; cursor:pointer; margin-bottom:10px;';
            item.innerHTML = `<span style="color:#00f0ff; font-size:12px; font-weight:600;">${file.name}</span>`;
            item.onclick = () => this.loadAudio(file, url);
            if (this.libraryDiv) this.libraryDiv.prepend(item);
            if (index === 0) this.loadAudio(file, url);
        });
    }

    loadAudio(file, url) {
        if (!file || !url) return;
        this.audioLoaded = true;
        this.currentFile = file;
        if (this.currentURL && this.currentURL !== url) {
            URL.revokeObjectURL(this.currentURL);
        }
        this.currentURL = url;
        this.audio.src = url;
        this.audio.preload = 'auto';
        this.audio.volume = this.vol;
        this.audio.crossOrigin = 'anonymous';

        this.audio.onloadedmetadata = () => {
            this.duration = Math.max(1, this.audio.duration);
            this.scale = Math.max(220, window.innerWidth * 0.25) / this.duration;
            this.currentTime = 0;
            this.updatePlayhead();
            this.drawWaveform();
            if (this.seekInput) {
                this.seekInput.value = '0';
            }
        };

        this.audio.onerror = () => {
            console.warn('Audio load error', file.name);
            this.audioLoaded = false;
        };
    }

    cleanup() {
        if(this.animationRef) cancelAnimationFrame(this.animationRef);
        this.isPlaying = false;
        if(this.audio) {
            this.audio.pause();
            this.audio.src = '';
        }
        if(this.currentURL) {
            URL.revokeObjectURL(this.currentURL);
            this.currentURL = null;
        }
    }

    togglePlayback() {
        if(!this.audioLoaded || !this.audio.src) return;
        this.isPlaying = !this.isPlaying;
        if(this.playBtn) this.playBtn.innerText = this.isPlaying ? 'PAUSE' : '▶';

        if(this.isPlaying) {
            this.audio.play().catch(() => {});
            this.lastTime = performance.now();
            this.playLoop();
        } else {
            this.audio.pause();
            if(this.animationRef) cancelAnimationFrame(this.animationRef);
            if(this.meterL) this.meterL.style.height = '10%';
            if(this.meterR) this.meterR.style.height = '10%';
        }
    }

    fmtTime(s) {
        const m = Math.floor(s/60).toString().padStart(2,'0');
        const sc = Math.floor(s%60).toString().padStart(2,'0');
        const ms = Math.floor((s%1)*100).toString().padStart(2,'0');
        return `${m}:${sc}:${ms}`;
    }

    updatePlayhead() {
        if(this.playhead) this.playhead.style.left = (this.currentTime * this.scale) + 'px';
        if(this.timeDisplay) this.timeDisplay.innerText = this.fmtTime(this.currentTime);
    }

    playLoop() {
        if(!this.isPlaying) return;
        if (!this.audio || this.audio.paused) return;

        this.currentTime = this.audio.currentTime;
        this.updatePlayhead();
        this.drawWaveform();

        if(this.meterL && this.meterR) {
            const hL = Math.min(100, Math.max(10, (Math.random() * 50 + 30) * this.vol));
            const hR = Math.min(100, Math.max(10, (Math.random() * 50 + 30) * this.vol));
            this.meterL.style.height = hL + '%';
            this.meterR.style.height = hR + '%';
            this.meterL.style.background = hL > 80 ? '#ffca28' : '#00f0ff';
            this.meterR.style.background = hR > 80 ? '#ffca28' : '#00f0ff';
        }

        this.animationRef = requestAnimationFrame(() => this.playLoop());
    }

    drawWaveform() {
        if(!this.audioLoaded) return;
        
        this.ctx.fillStyle = '#0a0d14';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw Grid
        this.ctx.strokeStyle = '#1e2836';
        this.ctx.lineWidth = 1;
        for(let i=0; i<this.canvas.width; i+=50) {
            this.ctx.beginPath(); this.ctx.moveTo(i, 0); this.ctx.lineTo(i, this.canvas.height); this.ctx.stroke();
        }
        
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;
        
        // Procedural Waveform
        const bars = 150;
        const barWidth = this.canvas.width / bars;
        
        for (let i = 0; i < bars; i++) {
            let amp = this.waveData[i % this.waveData.length];
            // Modulate slightly based on playback
            if (this.isPlaying) {
                amp += (Math.random() * 0.2 - 0.1) * this.vol;
            }
            
            const h = amp * this.canvas.height * 0.8 * this.vol;
            const x = i * barWidth;
            
            // Current playhead color logic
            const timeRatio = this.currentTime / this.duration;
            const barRatio = i / bars;
            
            if (barRatio < timeRatio) {
                this.ctx.fillStyle = '#00f0ff'; // Played portion
            } else {
                this.ctx.fillStyle = '#2a455a'; // Unplayed portion
            }
            
            this.ctx.fillRect(x, cy - h/2, barWidth - 1, h);
        }
        
        // Draw large central playhead indicator
        this.ctx.strokeStyle = '#ff3366';
        this.ctx.lineWidth = 2;
        const px = (this.currentTime / this.duration) * this.canvas.width;
        this.ctx.beginPath();
        this.ctx.moveTo(px, 0);
        this.ctx.lineTo(px, this.canvas.height);
        this.ctx.stroke();
    }

    runAI(promptText) {
        const input = document.querySelector('.preview-prompt-bar input');
        if(input) input.value = 'Analyzing audio profile... ✨';
        
        setTimeout(() => {
            if(input) input.value = '';
            if(!this.audioLoaded) this.loadAudio();
            
            // Modify waveform data to simulate cleanup
            this.waveData = this.waveData.map(val => val * 0.6); // Shrinks waveform indicating noise cleanup
            this.drawWaveform();
            
            this.ctx.fillStyle = '#00f0ff';
            this.ctx.font = 'bold 24px Inter';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(`AI Applied: ${promptText}`, this.canvas.width - 20, 40);
        }, 1500);
    }

    exportAudio(btn) {
        if(!this.audioLoaded || !this.currentFile) return;
        const h3 = btn.querySelector('.bento-title');
        const ogText = h3 ? h3.innerText : '';
        if (h3) h3.innerText = 'EXPORTING...';

        const downloadName = `Studio_Mix_Final.${this.currentFile.name.split('.').pop() || 'mp3'}`;
        const a = document.createElement('a');
        a.style.display = 'none';
        const exportUrl = this.currentURL || URL.createObjectURL(this.currentFile);
        a.href = exportUrl;
        a.download = downloadName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        if (h3) {
            h3.innerText = '✅ EXPORTED';
            setTimeout(() => h3.innerText = ogText, 2000);
        }
    }

    cleanup() {
        if(this.animationRef) cancelAnimationFrame(this.animationRef);
        this.isPlaying = false;
        if(this.audio) {
            this.audio.pause();
            this.audio.src = '';
        }
        if(this.currentURL) {
            URL.revokeObjectURL(this.currentURL);
            this.currentURL = null;
        }
    }
}

/* ====================================================================
   PRO CODE IDE EDITOR CLASS
   ==================================================================== */
function initCodeEditor() {
    window.currentCodeEditor = new ProCodeEditor();
}

class ProCodeEditor {
    constructor() {
        this.files = {
            'html': '<!DOCTYPE html>\\n<html>\\n<body>\\n  <div class="neon-card">\\n    <h1>Hello Developer</h1>\\n    <p>Edit me to see live IDE updates!</p>\\n    <button onclick="testLog()">Trigger Console</button>\\n  </div>\\n</body>\\n</html>',
            'css': 'body {\\n  background: #0f0f0f;\\n  color: #fff;\\n  font-family: sans-serif;\\n  display: flex;\\n  justify-content: center;\\n  align-items: center;\\n  height: 100vh;\\n  margin: 0;\\n}\\n\\n.neon-card {\\n  background: #111;\\n  padding: 40px;\\n  border-radius: 12px;\\n  box-shadow: 0 10px 40px rgba(57, 255, 20, 0.2);\\n  border: 1px solid #333;\\n  text-align: center;\\n}\\n\\nbutton {\\n  background: rgba(57, 255, 20, 0.2);\\n  color: #39ff14;\\n  border: 1px solid #39ff14;\\n  padding: 10px 20px;\\n  border-radius: 6px;\\n  cursor: pointer;\\n  font-weight: 700;\\n  margin-top: 15px;\\n  transition: 0.2s;\\n}\\n\\nbutton:hover {\\n  background: #39ff14;\\n  color: #000;\\n}',
            'js': 'console.log("Next-Gen Application Engine Starting...");\\n\\nfunction testLog() {\\n  console.warn("User triggered button at " + new Date().toLocaleTimeString());\\n}\\n\\nsetTimeout(() => {\\n  console.log("Ready!");\\n}, 1000);'
        };
        this.activeFile = 'html';
        
        this.input = document.getElementById('ide-input');
        this.syntax = document.getElementById('ide-syntax');
        this.linesContainer = document.getElementById('ide-lines');
        this.iframe = document.getElementById('ide-preview-frame');
        this.consoleOut = document.getElementById('ide-console-out');
        
        if(!this.input) return;

        this.bindEvents();
        this.switchFile('html');
        this.runCode();
        
        // Listen for console messages from iframe
        window.addEventListener('message', (e) => {
            if (e.data && e.data.type === 'ide-console') {
                this.logToConsole(e.data.log, 'info');
            } else if (e.data && e.data.type === 'ide-error') {
                this.logToConsole(e.data.log, 'err');
            } else if (e.data && e.data.type === 'ide-warn') {
                this.logToConsole(e.data.log, 'warn');
            }
        });
    }

    bindEvents() {
        document.querySelectorAll('.ide-tab, .ide-sb-list li').forEach(el => {
            el.addEventListener('click', (e) => {
                const file = e.currentTarget.getAttribute('data-file');
                this.switchFile(file);
            });
        });

        this.input.addEventListener('input', () => {
            this.files[this.activeFile] = this.input.value;
            this.updateSyntax();
            this.updateLines();
            // Automatically run after typing
            if(this.typingTimer) clearTimeout(this.typingTimer);
            this.typingTimer = setTimeout(() => this.runCode(), 800);
        });
        
        this.input.addEventListener('scroll', () => {
            if(this.syntax) {
                this.syntax.scrollTop = this.input.scrollTop;
                this.syntax.scrollLeft = this.input.scrollLeft;
            }
            if(this.linesContainer) this.linesContainer.scrollTop = this.input.scrollTop;
        });

        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = this.input.selectionStart;
                const end = this.input.selectionEnd;
                this.input.value = this.input.value.substring(0, start) + "  " + this.input.value.substring(end);
                this.input.selectionStart = this.input.selectionEnd = start + 2;
                this.input.dispatchEvent(new Event('input'));
            }
        });

        const runBtn = document.getElementById('ide-run-btn');
        if(runBtn) runBtn.addEventListener('click', () => this.runCode());
        
        const clcBtn = document.getElementById('ide-clear-console');
        if(clcBtn) clcBtn.addEventListener('click', () => {
            if(this.consoleOut) this.consoleOut.innerHTML = '';
        });
        
        const aiBtn = document.querySelector('.ide-btn.ai');
        if(aiBtn) aiBtn.addEventListener('click', () => {
            this.files[this.activeFile] += '\\n/* AI Suggestion: Refactored logic implemented. */';
            this.input.value = this.files[this.activeFile];
            this.updateSyntax();
            this.updateLines();
            this.logToConsole("AI analyzed and modified " + this.activeFile, "warn");
            this.runCode();
        });
    }

    switchFile(fileKey) {
        this.activeFile = fileKey;
        this.input.value = this.files[fileKey];
        
        document.querySelectorAll('.ide-tab, .ide-sb-list li').forEach(el => {
            el.classList.remove('active');
            if (el.getAttribute('data-file') === fileKey) el.classList.add('active');
        });
        
        setTimeout(() => {
            this.updateSyntax();
            this.updateLines();
        }, 10);
    }

    updateLines() {
        const linesCount = this.input.value.split('\\n').length;
        let linesHTML = '';
        for(let i=1; i<=linesCount; i++) linesHTML += i + '<br>';
        this.linesContainer.innerHTML = linesHTML;
    }

    updateSyntax() {
        let code = this.input.value;
        code = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        if (this.activeFile === 'html') {
            code = code.replace(new RegExp("(&lt;/?)([a-zA-Z0-9-]+)(&gt;)", "g"), '<span class="sw-tag">$1$2$3</span>');
            code = code.replace(new RegExp("([a-zA-Z-]+)=", "g"), '<span class="sw-attr">$1</span>=');
        } else if (this.activeFile === 'css') {
            code = code.replace(new RegExp("([a-zA-Z-]+)\\\\s*:", "g"), '<span class="sw-attr">$1</span>:');
        } else if (this.activeFile === 'js') {
            const kws = ['function', 'const', 'let', 'var', 'return', 'if', 'else', 'for', 'new'];
            kws.forEach(k => {
                code = code.replace(new RegExp("\\\\b" + k + "\\\\b", "g"), `<span class="sw-kw">${k}</span>`);
            });
            code = code.replace(new RegExp("(\\\"|'.*?'|')", "g"), '<span class="sw-str">$1</span>');
            code = code.replace(new RegExp("console\\\\.(log|warn|error)", "g"), '<span class="sw-fun">console.$1</span>');
        }
        
        // Match comments
        code = code.replace(new RegExp("(\\\\/\\\\/.*|\\\\/\\\\*[\\\\s\\\\S]*?\\\\*\\\\/)", "g"), '<span class="sw-comment">$1</span>');
        
        this.syntax.innerHTML = code;
    }

    runCode() {
        const html = this.files['html'];
        const css = `<style>${this.files['css']}</style>`;
        
        const consoleScript = `
            <script>
                const orgLog = console.log;
                const orgWarn = console.warn;
                const orgErr = console.error;
                console.log = function(...args) {
                    window.parent.postMessage({type: 'ide-console', log: args.join(' ')}, '*');
                    orgLog(...args);
                };
                console.warn = function(...args) {
                    window.parent.postMessage({type: 'ide-warn', log: args.join(' ')}, '*');
                    orgWarn(...args);
                };
                console.error = function(...args) {
                    window.parent.postMessage({type: 'ide-error', log: args.join(' ')}, '*');
                    orgErr(...args);
                };
                window.onerror = function(msg, url, line) {
                    window.parent.postMessage({type: 'ide-error', log: msg + ' at line ' + line}, '*');
                };
            <\/script>
        `;
        const js = `<script>${this.files['js']}<\/script>`;
        
        const content = css + consoleScript + html + js;
        
        this.consoleOut.innerHTML += '<div class="log" style="color:#666; font-style:italic;">> Compiling virtual bundle...</div>';
        this.consoleOut.scrollTop = this.consoleOut.scrollHeight;
        
        const blob = new Blob([content], {type: 'text/html'});
        this.iframe.src = URL.createObjectURL(blob);
    }

    logToConsole(msg, type='info') {
        const div = document.createElement('div');
        div.className = 'log ' + (type === 'err' ? 'log-err' : type === 'warn' ? 'log-warn' : '');
        div.innerHTML = `<span style="color:#555">[${new Date().toLocaleTimeString()}]</span> ${msg}`;
        this.consoleOut.appendChild(div);
        this.consoleOut.scrollTop = this.consoleOut.scrollHeight;
    }
}


/* ====================================================================
   PREMIUM VISUAL SYSTEM v5.0 — CLEAN JS ENHANCEMENT
   Minimal. Subtle. Apple-level restraint.
   ==================================================================== */

(function PremiumVisualEngine() {
    'use strict';

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        initSpectralAmbientSync();
        initCleanButtonRipples();
        initIntroKenBurns();
    }

    /* ================================================================
       1. SPECTRAL AMBIENT SYNC
       Background ambient layer subtly shifts hue to match active slide.
       Clean, barely perceptible — like the reference image's tonal depth.
    ================================================================ */
    function initSpectralAmbientSync() {
        const ambientEl = document.getElementById('ambient-lighting');
        if (!ambientEl) return;

        const spectralHues = {
            'video':  { h: 195, s: 60, l: 50 },   // cool cyan
            'photo':  { h: 28,  s: 60, l: 50 },   // warm amber
            'pdf':    { h: 0,   s: 0,  l: 75 },   // neutral silver
            'audio':  { h: 340, s: 65, l: 50 },   // rose
            'code':   { h: 258, s: 60, l: 60 },   // violet
        };

        const observer = new MutationObserver(() => {
            const activeSlide = document.querySelector('.slide.active');
            if (!activeSlide) return;
            const type = activeSlide.getAttribute('data-type');
            const hue  = spectralHues[type];
            if (!hue) return;

            // Very subtle — barely visible tint shift
            const color = `hsla(${hue.h}, ${hue.s}%, ${hue.l}%, 0.03)`;
            const glow  = `hsla(${hue.h}, ${hue.s}%, ${hue.l}%, 0.008)`;

            ambientEl.style.transition = 'background 2s cubic-bezier(0.22,1,0.36,1)';
            ambientEl.style.background = `radial-gradient(ellipse at 50% 50%, ${color} 0%, ${glow} 40%, transparent 65%)`;
        });

        const track = document.getElementById('slider-track');
        if (track) {
            observer.observe(track.parentElement, {
                attributes: true,
                subtree: true,
                attributeFilter: ['class']
            });
        }
    }

    /* ================================================================
       2. CLEAN BUTTON RIPPLES
       Subtle radial fade from click point — no heavy glow burst.
    ================================================================ */
    function initCleanButtonRipples() {
        // Inject keyframe once
        if (!document.getElementById('pvs-ripple-style')) {
            const style = document.createElement('style');
            style.id = 'pvs-ripple-style';
            style.textContent = `
                @keyframes btnRippleClean {
                    0%   { transform: translate(-50%, -50%) scale(0); opacity: 0.6; }
                    100% { transform: translate(-50%, -50%) scale(16); opacity: 0;  }
                }
            `;
            document.head.appendChild(style);
        }

        function addRipple(btn) {
            btn.addEventListener('click', function(e) {
                const rect = btn.getBoundingClientRect();
                const cx   = e.clientX - rect.left;
                const cy   = e.clientY - rect.top;

                const ripple = document.createElement('span');
                ripple.style.cssText = `
                    position: absolute;
                    left: ${cx}px; top: ${cy}px;
                    width: 6px; height: 6px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.25);
                    pointer-events: none;
                    z-index: 100;
                    animation: btnRippleClean 0.5s cubic-bezier(0.16,1,0.3,1) forwards;
                `;
                btn.appendChild(ripple);
                setTimeout(() => ripple.remove(), 550);
            });
        }

        const targets = document.querySelectorAll(
            '#btn-nav, #btn-start, #btn-continue, .glass-btn, .hero-btn'
        );

        targets.forEach(btn => {
            const pos = getComputedStyle(btn).position;
            if (pos === 'static') btn.style.position = 'relative';
            btn.style.overflow = 'hidden';
            addRipple(btn);
        });
    }

    /* ================================================================
       3. INTRO KEN BURNS
       Very subtle slow zoom on intro background media — cinematic
       but clean, like the reference image's understated elegance.
    ================================================================ */
    function initIntroKenBurns() {
        const viewIntro = document.getElementById('view-intro');
        if (!viewIntro) return;

        const observer = new MutationObserver(() => {
            if (viewIntro.classList.contains('active')) {
                playKenBurns();
                observer.disconnect();
            }
        });

        observer.observe(viewIntro, { attributes: true, attributeFilter: ['class'] });
    }

    function playKenBurns() {
        const vid = document.getElementById('intro-video');
        const img = document.getElementById('intro-image');

        [vid, img].forEach(el => {
            if (!el) return;
            el.style.transition = 'transform 8s cubic-bezier(0.16,1,0.3,1)';
            el.style.transform  = 'scale(1.06)';
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    el.style.transform = 'scale(1.01)';
                });
            });
        });

        // Subtle slow-drift loop on the intro fallback image
        setTimeout(() => {
            const introImg = document.getElementById('intro-image');
            if (!introImg || introImg.classList.contains('hidden')) return;
            let zoom = false;
            setInterval(() => {
                zoom = !zoom;
                introImg.style.transition = 'transform 14s ease-in-out';
                introImg.style.transform  = zoom ? 'scale(1.04)' : 'scale(1.01)';
            }, 14000);
        }, 4000);
    }

})();

/* ====================================================================
   ADD-ON: AUTOMATIC FULLSCREEN ENGINE
   ==================================================================== 
   Triggers Full Screen mode on the very first user interaction (click, 
   touch, or key press) anywhere on the page. This ensures the website 
   adjusts to the full display area as soon as the user starts engaging.
*/
(function() {
    const triggerFullscreen = () => {
        const doc = window.document;
        const docEl = doc.documentElement;

        // Compatibility for different browsers
        const requestFullScreen = docEl.requestFullscreen || 
                                docEl.mozRequestFullScreen || 
                                docEl.webkitRequestFullScreen || 
                                docEl.msRequestFullscreen;

        // Only request if not already in full screen
        if (!doc.fullscreenElement && 
            !doc.mozFullScreenElement && 
            !doc.webkitFullscreenElement && 
            !doc.msFullscreenElement) {
            
            if (requestFullScreen) {
                requestFullScreen.call(docEl).then(() => {
                    console.log("System: Fullscreen mode initiated.");
                }).catch(err => {
                    console.warn(`Fullscreen Blocked: ${err.message}. A user interaction is required.`);
                });
            }
        }
        
        // Cleanup: Remove listeners after the first successful or attempted interaction
        ['click', 'mousedown', 'touchstart', 'keydown'].forEach(evt => {
            window.removeEventListener(evt, triggerFullscreen, true);
        });
    };

    // Add listeners to window (using capture phase to ensure it runs early)
    ['click', 'mousedown', 'touchstart', 'keydown'].forEach(evt => {
        window.addEventListener(evt, triggerFullscreen, { once: true, capture: true });
    });
})();