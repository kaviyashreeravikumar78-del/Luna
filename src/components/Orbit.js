import { orbitVoice } from '../audio/OrbitVoice.js';
import '../styles/orbit.css';

/**
 * LUNA: Mission Survival - ORBIT The Hilarious Cosmic Moon Buddy
 * A friendly, funny, chubby lunar creature in an astronaut bubble helmet!
 * Features big sparkling cartoon eyes, blushing cheeks, wobbly spring antennas,
 * real-time voice-synced talking mouth, hilarious emotions, and paws that wave & point.
 */
export class Orbit {
  constructor(options = {}) {
    this.options = {
      autoMount: options.autoMount !== false,
      ...options
    };
    this.options.defaultPosition = options.defaultPosition || this.getDefaultPosition();

    this.currentEmotion = 'idle';
    this.currentGesture = 'none';
    this.isSpeaking = false;
    this.typewriterTimer = null;
    this.currentHighlightElement = null;

    this.createDOM();

    if (this.options.autoMount) {
      this.mount(document.body);
    }

    // Responsive orientation & screen resize handler
    window.addEventListener('resize', () => this.handleScreenResize());
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.handleScreenResize(), 150);
      setTimeout(() => this.handleScreenResize(), 350);
    });
  }

  getDefaultPosition() {
    const isMobileLandscape = (window.innerHeight <= 520 && window.innerWidth > window.innerHeight) || (window.innerWidth <= 950 && window.innerHeight <= 450);
    if (isMobileLandscape) {
      // In mobile landscape, keep ORBIT comfortably in the top-right safe zone
      // below the top HUD bar and completely away from bottom-right touch action buttons!
      return { x: Math.max(10, window.innerWidth - 105), y: 55 };
    }
    return { x: Math.max(10, window.innerWidth - 185), y: Math.max(10, window.innerHeight - 245) };
  }

  handleScreenResize() {
    const safe = this.getDefaultPosition();
    const isMobileLandscape = (window.innerHeight <= 520 && window.innerWidth > window.innerHeight) || (window.innerWidth <= 950 && window.innerHeight <= 450);

    if (!this.isSpeaking) {
      this.flyTo(safe.x, safe.y, 350);
    } else if (isMobileLandscape) {
      // Reposition to safe upper zone if currently hovering low
      if (this.currentPosition && this.currentPosition.y > 80) {
        this.flyTo(safe.x, safe.y, 350);
      }
    }
  }

  createDOM() {
    // 1. Master Floating Container
    this.container = document.createElement('div');
    this.container.id = 'orbit-companion';
    this.container.className = 'orbit-companion-container';
    this.container.style.transform = `translate(${this.options.defaultPosition.x}px, ${this.options.defaultPosition.y}px)`;

    // 2. Creature SVG Markup
    this.container.innerHTML = `
      <div class="orbit-robot-wrap state-idle gesture-none" id="orbit-robot-mesh" title="Click me for a funny reaction!">
        <svg viewBox="0 0 140 165" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <!-- Fluffy Face Gradient -->
            <radialGradient id="orbitFaceGrad" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stop-color="#FFFDF9"/>
              <stop offset="70%" stop-color="#FCE7D6"/>
              <stop offset="100%" stop-color="#F7C8A4"/>
            </radialGradient>

            <!-- Lunar Orange Ears & Suit Gradient -->
            <linearGradient id="orbitOrangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#F47752"/>
              <stop offset="100%" stop-color="#D95736"/>
            </linearGradient>

            <!-- Pearl White Suit -->
            <linearGradient id="orbitSuitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#FFFFFF"/>
              <stop offset="70%" stop-color="#E2E8F0"/>
              <stop offset="100%" stop-color="#CBD5E1"/>
            </linearGradient>

            <!-- Glass Helmet Reflection -->
            <linearGradient id="orbitHelmetGlass" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="rgba(0, 229, 255, 0.28)"/>
              <stop offset="50%" stop-color="rgba(16, 44, 73, 0.08)"/>
              <stop offset="100%" stop-color="rgba(0, 229, 255, 0.18)"/>
            </linearGradient>

            <!-- Star Glow Filter -->
            <filter id="orbitGoldGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"/>
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          <!-- ENTIRE ANIMATED CREATURE BODY GROUP -->
          <g class="orbit-svg-creature-group" id="orbit-creature-group">

            <!-- HOVER JETPACK THRUSTERS (Behind) -->
            <g id="orbit-thrusters">
              <rect x="42" y="118" width="16" height="18" rx="6" fill="#102C49"/>
              <rect x="82" y="118" width="16" height="18" rx="6" fill="#102C49"/>
              <!-- Twinkling Jetpack Stars -->
              <g class="orbit-thruster-star" transform="translate(50, 142)">
                <polygon points="0,-7 2,-2 7,0 2,2 0,7 -2,2 -7,0 -2,-2" fill="#00E5FF"/>
              </g>
              <g class="orbit-thruster-star" transform="translate(90, 142)">
                <polygon points="0,-7 2,-2 7,0 2,2 0,7 -2,2 -7,0 -2,-2" fill="#FFD166"/>
              </g>
            </g>

            <!-- BOUNCY SPRING ANTENNAS (Behind Helmet) -->
            <!-- Left Spring Antenna -->
            <g class="orbit-spring-antenna-left" id="orbit-antenna-l">
              <path d="M 52 28 Q 44 18 50 12 Q 56 6 48 2" fill="none" stroke="#64748B" stroke-width="2.5" stroke-linecap="round"/>
              <circle cx="48" cy="2" r="6.5" fill="#FFD166" filter="url(#orbitGoldGlow)" id="orbit-antenna-star-l"/>
            </g>
            <!-- Right Spring Antenna -->
            <g class="orbit-spring-antenna-right" id="orbit-antenna-r">
              <path d="M 88 28 Q 96 18 90 12 Q 84 6 92 2" fill="none" stroke="#64748B" stroke-width="2.5" stroke-linecap="round"/>
              <circle cx="92" cy="2" r="6.5" fill="#00E5FF" filter="url(#orbitGoldGlow)" id="orbit-antenna-star-r"/>
            </g>

            <!-- CHUBBY SPACE SUIT BODY -->
            <rect x="38" y="96" width="64" height="42" rx="20" fill="url(#orbitSuitGrad)" stroke="#94A3B8" stroke-width="2"/>
            <!-- Cute Orange Belly Badge -->
            <ellipse cx="70" cy="116" rx="16" ry="11" fill="url(#orbitOrangeGrad)"/>
            <circle cx="70" cy="116" r="4.5" fill="#FFD166"/>

            <!-- FLOATING PUFFY PAWS / HANDS -->
            <!-- Left Mitten Paw -->
            <g class="orbit-arm-left" id="orbit-arm-left">
              <circle cx="28" cy="108" r="11" fill="url(#orbitOrangeGrad)" stroke="#FFFFFF" stroke-width="2"/>
              <!-- Little thumb pad -->
              <circle cx="34" cy="103" r="4.5" fill="#FFB703"/>
            </g>
            <!-- Right Mitten Paw -->
            <g class="orbit-arm-right" id="orbit-arm-right">
              <circle cx="112" cy="108" r="11" fill="url(#orbitOrangeGrad)" stroke="#FFFFFF" stroke-width="2"/>
              <!-- Little thumb pad -->
              <circle cx="106" cy="103" r="4.5" fill="#FFB703"/>
            </g>

            <!-- CHUBBY FACE & HEAD (Inside Helmet) -->
            <!-- Floppy Orange Creature Ears -->
            <ellipse cx="32" cy="58" rx="10" ry="16" fill="url(#orbitOrangeGrad)" transform="rotate(-15, 32, 58)"/>
            <ellipse cx="33" cy="58" rx="5" ry="9" fill="#FFB703" transform="rotate(-15, 32, 58)"/>
            <ellipse cx="108" cy="58" rx="10" ry="16" fill="url(#orbitOrangeGrad)" transform="rotate(15, 108, 58)"/>
            <ellipse cx="107" cy="58" rx="5" ry="9" fill="#FFB703" transform="rotate(15, 108, 58)"/>

            <!-- Fluffy Round Creature Head -->
            <circle cx="70" cy="64" r="38" fill="url(#orbitFaceGrad)"/>

            <!-- ROSY BLUSHING CHEEKS -->
            <ellipse cx="45" cy="74" rx="7.5" ry="4.5" fill="#FF6584" class="orbit-blush-cheek" opacity="0.75"/>
            <ellipse cx="95" cy="74" rx="7.5" ry="4.5" fill="#FF6584" class="orbit-blush-cheek" opacity="0.75"/>

            <!-- CUTE BUTTON NOSE -->
            <ellipse cx="70" cy="69" rx="3.5" ry="2.5" fill="#D95736"/>

            <!-- DYNAMIC CARTOON EYES -->
            <g id="orbit-eyes-slot">
              <!-- Left Eye -->
              <g id="orbit-left-eye">
                <!-- White Sclera -->
                <ellipse cx="53" cy="61" rx="9" ry="11" fill="#FFFFFF" stroke="#102C49" stroke-width="1.8" class="orbit-eye orbit-eye-left"/>
                <!-- Shiny Dark Pupil -->
                <ellipse cx="54" cy="62" rx="6" ry="7.5" fill="#102C49" class="orbit-eye orbit-eye-left"/>
                <!-- Glossy White Catchlights -->
                <circle cx="56" cy="59" r="2.8" fill="#FFFFFF"/>
                <circle cx="52" cy="64" r="1.4" fill="#FFFFFF"/>
              </g>
              <!-- Right Eye -->
              <g id="orbit-right-eye">
                <!-- White Sclera -->
                <ellipse cx="87" cy="61" rx="9" ry="11" fill="#FFFFFF" stroke="#102C49" stroke-width="1.8" class="orbit-eye orbit-eye-right"/>
                <!-- Shiny Dark Pupil -->
                <ellipse cx="86" cy="62" rx="6" ry="7.5" fill="#102C49" class="orbit-eye orbit-eye-right"/>
                <!-- Glossy White Catchlights -->
                <circle cx="88" cy="59" r="2.8" fill="#FFFFFF"/>
                <circle cx="84" cy="64" r="1.4" fill="#FFFFFF"/>
              </g>
            </g>

            <!-- DYNAMIC EXPRESSIVE CARTOON MOUTH -->
            <g id="orbit-mouth-slot">
              <g id="orbit-creature-mouth" style="transform-origin: 70px 79px;">
                <!-- Happy Open Grin with Pink Tongue -->
                <path d="M 61 74 Q 70 85 79 74 Z" fill="#D95736" stroke="#102C49" stroke-width="1.6"/>
                <!-- Tongue -->
                <path d="M 64 78 Q 70 75 76 78 Q 70 83 64 78 Z" fill="#FF6584"/>
              </g>
            </g>

            <!-- CRYSTAL CLEAR BUBBLE ASTRONAUT HELMET -->
            <circle cx="70" cy="64" r="46" fill="url(#orbitHelmetGlass)" stroke="#94A3B8" stroke-width="2.5"/>
            <!-- Glass Specular Curved Glare -->
            <path d="M 38 42 Q 70 24 96 38" fill="none" stroke="rgba(255, 255, 255, 0.65)" stroke-width="4" stroke-linecap="round"/>
            <path d="M 46 48 Q 66 36 84 46" fill="none" stroke="rgba(255, 255, 255, 0.4)" stroke-width="2" stroke-linecap="round"/>

            <!-- Sweat drop for Worried mode (hidden by default) -->
            <g id="orbit-sweat-drop" style="display:none;" transform="translate(94, 38)">
              <path d="M 0,0 C -3,4 -4,8 0,11 C 4,8 3,4 0,0 Z" fill="#00E5FF" opacity="0.85"/>
            </g>

          </g>
        </svg>
      </div>

      <!-- COMIC-STYLE INTERACTIVE SPEECH BUBBLE -->
      <div class="orbit-speech-bubble-wrap tail-right" id="orbit-speech-bubble" style="right: 160px; top: 10px;">
        <div class="orbit-bubble-header">
          <div class="orbit-bubble-name-badge">
            <span class="orbit-bubble-dot"></span>
            <span>O.R.B.I.T. • Moon Buddy ⭐</span>
          </div>
          <div class="orbit-bubble-controls">
            <button class="orbit-bubble-btn-icon" id="orbit-btn-voice-toggle" title="Toggle Voice Sound">
              ${orbitVoice.isMuted ? '🔇 Muted' : '🔊 Voice ON'}
            </button>
            <button class="orbit-bubble-btn-icon" id="orbit-btn-close-bubble" title="Close Message">✕</button>
          </div>
        </div>

        <p class="orbit-bubble-text" id="orbit-bubble-msg">YAY! Hello Commander! I'm ORBIT, your bouncy Moon buddy!</p>

        <div class="orbit-bubble-footer" id="orbit-bubble-footer" style="display:none;">
          <button class="orbit-bubble-next-btn" id="orbit-btn-bubble-next">Next ➔</button>
        </div>
      </div>
    `;

    // 3. Pointer Line Canvas / Arrow
    this.pointerEl = document.createElement('div');
    this.pointerEl.className = 'orbit-pointer-arrow';
    this.pointerEl.innerHTML = `
      <svg width="42" height="42" viewBox="0 0 42 42">
        <polygon points="6,21 36,6 26,21 36,36" fill="#FFD166" stroke="#D95736" stroke-width="2"/>
      </svg>
    `;
    document.body.appendChild(this.pointerEl);

    // 4. Bind Internal Events
    this.bindEvents();
  }

  mount(parent = document.body) {
    if (!this.container.parentElement) {
      parent.appendChild(this.container);
    }
  }

  bindEvents() {
    // Click on creature triggers a hilarious giggle or goofy reaction
    const robotMesh = this.container.querySelector('#orbit-robot-mesh');
    robotMesh.addEventListener('click', () => {
      this.playTapReaction();
    });

    // Voice toggle inside bubble
    const voiceToggle = this.container.querySelector('#orbit-btn-voice-toggle');
    voiceToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const unmuted = orbitVoice.toggleMute();
      voiceToggle.textContent = unmuted ? '🔊 Voice ON' : '🔇 Muted';
      if (unmuted) {
        this.say("Yippee! Voice online! Can you hear me now, Commander?", { emotion: 'happy', gesture: 'wave' });
      }
    });

    // Close bubble
    const closeBtn = this.container.querySelector('#orbit-btn-close-bubble');
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hideBubble();
      this.stopSpeaking();
    });
  }

  playTapReaction() {
    const reactions = [
      { text: "HEHEHE! That tickles my space suit belly!", emotion: 'excited', gesture: 'celebrate' },
      { text: "BOING! Look at my springy antennas wobble!", emotion: 'happy', gesture: 'wave' },
      { text: "I did a funny bounce! Ready for more Moon fun?", emotion: 'excited', gesture: 'nod' },
      { text: "Did you know Moon dust smells like fireworks? True story!", emotion: 'thinking', gesture: 'none' },
      { text: "Whooooosh! I love floating in low lunar gravity!", emotion: 'happy', gesture: 'celebrate' }
    ];
    const pick = reactions[Math.floor(Math.random() * reactions.length)];
    this.say(pick.text, { emotion: pick.emotion, gesture: pick.gesture });
  }

  /**
   * Primary Speech & Animated Dialogue Method
   */
  say(text, options = {}) {
    const {
      emotion = 'happy',
      gesture = 'none',
      pointAt = null,
      onComplete = null,
      showNextBtn = false,
      nextBtnText = "Next ➔",
      autoClose = true,
      autoCloseDelay = 4200
    } = options;

    // 1. Set Emotion & Gesture
    this.setEmotion(emotion);
    this.setGesture(gesture);

    // 2. Point at target if provided
    if (pointAt) {
      this.pointAt(pointAt);
    } else {
      this.clearPoint();
    }

    // 3. Show Speech Bubble
    this.showBubble(text, { showNextBtn, nextBtnText, onNext: onComplete });

    // Auto-close bubble so instructions don't stay on screen forever
    if (autoClose && !showNextBtn) {
      if (this.bubbleAutoCloseTimer) clearTimeout(this.bubbleAutoCloseTimer);
      const estDuration = Math.max(autoCloseDelay, text.split(' ').length * 320 + 1200);
      this.bubbleAutoCloseTimer = setTimeout(() => {
        this.hideBubble();
      }, estDuration);
    }

    // 4. Trigger Voice & Animated Speech
    this.startSpeaking(text, () => {
      if (autoClose && !showNextBtn) {
        setTimeout(() => this.hideBubble(), 1000);
      }
      if (onComplete) onComplete();
    });
  }

  startSpeaking(text, onComplete) {
    this.isSpeaking = true;
    const robotMesh = this.container.querySelector('#orbit-robot-mesh');
    robotMesh.classList.add('state-talking');

    // Callback when speech concludes
    const handleEnd = () => {
      this.isSpeaking = false;
      robotMesh.classList.remove('state-talking');
      if (this.currentEmotion === 'idle' || this.currentEmotion === 'talking') {
        this.setEmotion('idle');
      }
      if (onComplete) onComplete();
    };

    // Callback on word boundary
    const handleBoundary = () => {
      robotMesh.classList.add('word-pop');
      setTimeout(() => {
        robotMesh.classList.remove('word-pop');
      }, 75);
    };

    // Callback on speech start
    const handleStart = () => {
      robotMesh.classList.add('state-talking');
    };

    // If voice is muted or SpeechSynthesis unavailable, run fallback timer
    if (orbitVoice.isMuted || !window.speechSynthesis) {
      const simulatedDuration = Math.max(1600, text.split(' ').length * 280);
      handleStart();
      setTimeout(handleEnd, simulatedDuration);
      return;
    }

    orbitVoice.speak(text, handleEnd, handleBoundary, handleStart);
  }

  stopSpeaking() {
    this.isSpeaking = false;
    orbitVoice.stop();
    const robotMesh = this.container.querySelector('#orbit-robot-mesh');
    if (robotMesh) robotMesh.classList.remove('state-talking');
    if (this.typewriterTimer) clearInterval(this.typewriterTimer);
  }

  /**
   * Sets Face Display Emotion (happy, excited, worried, thinking, sad, idle)
   */
  setEmotion(name) {
    this.currentEmotion = name;
    const robotMesh = this.container.querySelector('#orbit-robot-mesh');
    if (!robotMesh) return;

    robotMesh.classList.remove('state-idle', 'state-happy', 'state-excited', 'state-worried', 'state-thinking', 'state-sad');
    robotMesh.classList.add(`state-${name}`);

    const eyesSlot = this.container.querySelector('#orbit-eyes-slot');
    const mouthSlot = this.container.querySelector('#orbit-mouth-slot');
    const sweatDrop = this.container.querySelector('#orbit-sweat-drop');
    const antennaStarL = this.container.querySelector('#orbit-antenna-star-l');
    const antennaStarR = this.container.querySelector('#orbit-antenna-star-r');

    if (sweatDrop) {
      sweatDrop.style.display = (name === 'worried') ? 'block' : 'none';
    }

    if (antennaStarL && antennaStarR) {
      antennaStarL.setAttribute('fill', name === 'worried' ? '#FF3B30' : '#FFD166');
      antennaStarR.setAttribute('fill', name === 'worried' ? '#FF3B30' : '#00E5FF');
    }

    switch (name) {
      case 'happy':
        // Big joyful crinkly eyes ^ ^ + happy open smile
        eyesSlot.innerHTML = `
          <g>
            <path d="M 44 65 Q 53 52 62 65" fill="none" stroke="#102C49" stroke-width="4" stroke-linecap="round"/>
            <path d="M 78 65 Q 87 52 96 65" fill="none" stroke="#102C49" stroke-width="4" stroke-linecap="round"/>
          </g>
        `;
        mouthSlot.innerHTML = `
          <g id="orbit-creature-mouth" style="transform-origin: 70px 79px;">
            <path d="M 61 74 Q 70 85 79 74 Z" fill="#D95736" stroke="#102C49" stroke-width="1.8"/>
            <path d="M 64 78 Q 70 75 76 78 Q 70 84 64 78 Z" fill="#FF6584"/>
          </g>
        `;
        break;

      case 'excited':
        // Giant Starburst Eyes ⭐ ⭐ + laughing oval mouth + confetti!
        eyesSlot.innerHTML = `
          <g filter="url(#orbitGoldGlow)">
            <g transform="translate(53, 61)">
              <polygon points="0,-10 3,-3 10,0 3,3 0,10 -3,3 -10,0 -3,-3" fill="#FFD166"/>
              <circle cx="0" cy="0" r="3.5" fill="#FFFFFF"/>
            </g>
            <g transform="translate(87, 61)">
              <polygon points="0,-10 3,-3 10,0 3,3 0,10 -3,3 -10,0 -3,-3" fill="#FFD166"/>
              <circle cx="0" cy="0" r="3.5" fill="#FFFFFF"/>
            </g>
          </g>
        `;
        mouthSlot.innerHTML = `
          <g id="orbit-creature-mouth" style="transform-origin: 70px 79px;">
            <ellipse cx="70" cy="79" rx="8" ry="6.5" fill="#D95736" stroke="#102C49" stroke-width="1.8"/>
            <ellipse cx="70" cy="81.5" rx="5.5" ry="3.5" fill="#FF6584"/>
          </g>
        `;
        this.spawnConfetti();
        break;

      case 'worried':
        // Hilarious cartoon dizzy swirl eyes @ @ + funny wavy mouth + sweat drop!
        eyesSlot.innerHTML = `
          <g>
            <!-- Left Swirl -->
            <path d="M 53 61 m -6,0 a 6,6 0 1,0 12,0 a 6,6 0 1,0 -12,0 m 2.5,0 a 3.5,3.5 0 1,0 7,0 a 3.5,3.5 0 1,0 -7,0" fill="none" stroke="#FF3B30" stroke-width="2.5" stroke-linecap="round"/>
            <!-- Right Swirl -->
            <path d="M 87 61 m -6,0 a 6,6 0 1,0 12,0 a 6,6 0 1,0 -12,0 m 2.5,0 a 3.5,3.5 0 1,0 7,0 a 3.5,3.5 0 1,0 -7,0" fill="none" stroke="#FF3B30" stroke-width="2.5" stroke-linecap="round"/>
          </g>
        `;
        mouthSlot.innerHTML = `
          <g id="orbit-creature-mouth" style="transform-origin: 70px 79px;">
            <path d="M 62 79 Q 66 76 70 79 Q 74 82 78 79" fill="none" stroke="#FF3B30" stroke-width="3" stroke-linecap="round"/>
          </g>
        `;
        break;

      case 'thinking':
        // Puzzled face: eyes looking up-right, cute smirk :3
        eyesSlot.innerHTML = `
          <g>
            <ellipse cx="55" cy="58" rx="8.5" ry="10" fill="#FFFFFF" stroke="#102C49" stroke-width="1.8"/>
            <ellipse cx="58" cy="56" rx="5.5" ry="6.5" fill="#102C49"/>
            <circle cx="60" cy="54" r="2.5" fill="#FFFFFF"/>

            <ellipse cx="89" cy="58" rx="8.5" ry="10" fill="#FFFFFF" stroke="#102C49" stroke-width="1.8"/>
            <ellipse cx="92" cy="56" rx="5.5" ry="6.5" fill="#102C49"/>
            <circle cx="94" cy="54" r="2.5" fill="#FFFFFF"/>
          </g>
        `;
        mouthSlot.innerHTML = `
          <g id="orbit-creature-mouth" style="transform-origin: 70px 79px;">
            <!-- Cute cat-like smirk :3 right under nose -->
            <path d="M 63 78 Q 66.5 82 70 78 Q 73.5 82 77 78" fill="none" stroke="#102C49" stroke-width="2.5" stroke-linecap="round"/>
          </g>
        `;
        break;

      case 'sad':
        // Cute puppy eyes 🥺 with adorable pout
        eyesSlot.innerHTML = `
          <g>
            <ellipse cx="53" cy="62" rx="9" ry="11" fill="#FFFFFF" stroke="#102C49" stroke-width="1.8"/>
            <ellipse cx="53" cy="64" rx="7" ry="8" fill="#102C49"/>
            <circle cx="51" cy="60" r="3.8" fill="#FFFFFF"/>
            <circle cx="56" cy="66" r="2" fill="#FFFFFF"/>

            <ellipse cx="87" cy="62" rx="9" ry="11" fill="#FFFFFF" stroke="#102C49" stroke-width="1.8"/>
            <ellipse cx="87" cy="64" rx="7" ry="8" fill="#102C49"/>
            <circle cx="85" cy="60" r="3.8" fill="#FFFFFF"/>
            <circle cx="90" cy="66" r="2" fill="#FFFFFF"/>
          </g>
        `;
        mouthSlot.innerHTML = `
          <g id="orbit-creature-mouth" style="transform-origin: 70px 79px;">
            <path d="M 63 82 Q 70 76 77 82" fill="none" stroke="#102C49" stroke-width="2.5" stroke-linecap="round"/>
          </g>
        `;
        break;

      case 'idle':
      default:
        // Default big shiny curious cartoon eyes + friendly open smile
        eyesSlot.innerHTML = `
          <!-- Left Eye -->
          <g id="orbit-left-eye">
            <ellipse cx="53" cy="61" rx="9" ry="11" fill="#FFFFFF" stroke="#102C49" stroke-width="1.8" class="orbit-eye orbit-eye-left"/>
            <ellipse cx="54" cy="62" rx="6" ry="7.5" fill="#102C49" class="orbit-eye orbit-eye-left"/>
            <circle cx="56" cy="59" r="2.8" fill="#FFFFFF"/>
            <circle cx="52" cy="64" r="1.4" fill="#FFFFFF"/>
          </g>
          <!-- Right Eye -->
          <g id="orbit-right-eye">
            <ellipse cx="87" cy="61" rx="9" ry="11" fill="#FFFFFF" stroke="#102C49" stroke-width="1.8" class="orbit-eye orbit-eye-right"/>
            <ellipse cx="86" cy="62" rx="6" ry="7.5" fill="#102C49" class="orbit-eye orbit-eye-right"/>
            <circle cx="88" cy="59" r="2.8" fill="#FFFFFF"/>
            <circle cx="84" cy="64" r="1.4" fill="#FFFFFF"/>
          </g>
        `;
        mouthSlot.innerHTML = `
          <g id="orbit-creature-mouth" style="transform-origin: 70px 79px;">
            <path d="M 61 74 Q 70 84 79 74 Z" fill="#D95736" stroke="#102C49" stroke-width="1.6"/>
            <path d="M 64 78 Q 70 76 76 78 Q 70 83 64 78 Z" fill="#FF6584"/>
          </g>
        `;
        break;
    }
  }

  /**
   * Sets Arm / Paw Gesture (wave, point, celebrate, nod, none)
   */
  setGesture(name) {
    this.currentGesture = name;
    const robotMesh = this.container.querySelector('#orbit-robot-mesh');
    if (!robotMesh) return;

    robotMesh.classList.remove('gesture-none', 'gesture-wave', 'gesture-point', 'gesture-celebrate', 'gesture-nod');
    robotMesh.classList.add(`gesture-${name}`);

    if (name === 'celebrate') {
      this.spawnConfetti();
    }
  }

  /**
   * Celebrates with confetti burst, happy face, and high-pitched chirp
   */
  celebrate() {
    this.setEmotion('excited');
    this.setGesture('celebrate');
    orbitVoice.playChirp('activate');
    this.spawnConfetti();
    setTimeout(() => {
      this.setEmotion('happy');
      this.setGesture('none');
    }, 2400);
  }

  /**
   * Expresses warning alert
   */
  warn(text, onComplete = null) {
    this.say(text, { emotion: 'worried', gesture: 'none', onComplete });
  }

  /**
   * Expresses friendly hint
   */
  hint(text, onComplete = null) {
    this.say(text, { emotion: 'thinking', gesture: 'nod', onComplete });
  }

  /**
   * Highlights an element on the page and points hand toward it
   */
  pointAt(target) {
    this.clearPoint();

    let el = null;
    if (typeof target === 'string') {
      el = document.querySelector(target);
    } else if (target instanceof HTMLElement) {
      el = target;
    }

    if (!el) return;

    this.currentHighlightElement = el;
    el.classList.add('orbit-element-highlight');
    this.setGesture('point');

    // Position pointer arrow near target
    const rect = el.getBoundingClientRect();
    this.pointerEl.style.left = `${rect.left - 44}px`;
    this.pointerEl.style.top = `${rect.top + rect.height / 2 - 21}px`;
    this.pointerEl.classList.add('visible');
  }

  clearPoint() {
    if (this.currentHighlightElement) {
      this.currentHighlightElement.classList.remove('orbit-element-highlight');
      this.currentHighlightElement = null;
    }
    if (this.pointerEl) {
      this.pointerEl.classList.remove('visible');
    }
    if (this.currentGesture === 'point') {
      this.setGesture('none');
    }
  }

  /**
   * Smoothly flies ORBIT to target pixel coordinates
   */
  flyTo(x, y, duration = 650) {
    const isMobileLandscape = (window.innerHeight <= 520 && window.innerWidth > window.innerHeight) || (window.innerWidth <= 950 && window.innerHeight <= 450);
    let finalX = x;
    let finalY = y;

    if (isMobileLandscape) {
      // In mobile landscape, protect the bottom and right touch action areas!
      // If position is lower than 80px or near the right edge, safely pin it to upper safe zone:
      if (finalY > 80 || finalX > window.innerWidth - 160) {
        finalY = 55;
        finalX = Math.max(10, window.innerWidth - 105);
      }
    }

    this.currentPosition = { x: finalX, y: finalY };
    this.container.style.transition = `transform ${duration}ms cubic-bezier(0.2, 0.9, 0.3, 1.2)`;
    this.container.style.transform = `translate(${finalX}px, ${finalY}px)`;
  }

  /**
   * Automatically flies ORBIT adjacent to a DOM element without overlapping it
   */
  flyToElement(elementOrSelector, position = 'right') {
    let el = typeof elementOrSelector === 'string' ? document.querySelector(elementOrSelector) : elementOrSelector;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    let tx = rect.right + 25;
    let ty = rect.top - 20;

    // Boundary check so ORBIT never clips off screen
    if (tx + 165 > window.innerWidth) {
      tx = Math.max(10, rect.left - 175);
    }
    if (ty + 185 > window.innerHeight) {
      ty = Math.max(10, window.innerHeight - 205);
    }

    this.flyTo(tx, ty);
  }

  /**
   * Projects 3D world coordinates to screen space and flies ORBIT right next to the 3D target!
   */
  flyTo3D(worldPosition, camera, offset = { x: 45, y: -45 }, duration = 650) {
    if (!worldPosition || !camera) return;
    const v = worldPosition.clone().project(camera);
    if (v.z > 1) return; // Behind camera

    let sx = (v.x * 0.5 + 0.5) * window.innerWidth + (offset.x || 0);
    let sy = (-(v.y * 0.5) + 0.5) * window.innerHeight + (offset.y || 0);

    const isMobileLandscape = (window.innerHeight <= 520 && window.innerWidth > window.innerHeight) || (window.innerWidth <= 950 && window.innerHeight <= 450);
    if (isMobileLandscape) {
      sy = Math.max(35, Math.min(sy, 110));
      sx = Math.max(20, Math.min(sx, window.innerWidth - 110));
    } else {
      sx = Math.max(20, Math.min(sx, window.innerWidth - 180));
      sy = Math.max(50, Math.min(sy, window.innerHeight - 200));
    }

    this.flyTo(sx, sy, duration);
  }

  showBubble(text, { showNextBtn = false, nextBtnText = "Next ➔", onNext = null } = {}) {
    const bubble = this.container.querySelector('#orbit-speech-bubble');
    const msgEl = this.container.querySelector('#orbit-bubble-msg');
    const footer = this.container.querySelector('#orbit-bubble-footer');
    const nextBtn = this.container.querySelector('#orbit-btn-bubble-next');

    if (!bubble || !msgEl) return;

    // Clear previous typewriter
    if (this.typewriterTimer) clearInterval(this.typewriterTimer);

    // Typewriter effect
    msgEl.textContent = '';
    bubble.classList.add('visible');

    let idx = 0;
    const speed = 25; // ms per character
    this.typewriterTimer = setInterval(() => {
      idx++;
      msgEl.textContent = text.slice(0, idx);
      if (idx >= text.length) {
        clearInterval(this.typewriterTimer);
      }
    }, speed);

    // Next Button in bubble
    if (showNextBtn) {
      footer.style.display = 'flex';
      nextBtn.textContent = nextBtnText;
      nextBtn.onclick = (e) => {
        e.stopPropagation();
        this.hideBubble();
        this.stopSpeaking();
        if (onNext) onNext();
      };
    } else {
      footer.style.display = 'none';
    }
  }

  hideBubble() {
    const bubble = this.container.querySelector('#orbit-speech-bubble');
    if (bubble) bubble.classList.remove('visible');
    if (this.typewriterTimer) clearInterval(this.typewriterTimer);

    const isMobileLandscape = (window.innerHeight <= 520 && window.innerWidth > window.innerHeight) || (window.innerWidth <= 950 && window.innerHeight <= 450);
    if (isMobileLandscape) {
      const safe = this.getDefaultPosition();
      this.flyTo(safe.x, safe.y, 350);
    }
  }

  show() {
    this.container.classList.remove('hidden');
  }

  hide() {
    this.container.classList.add('hidden');
    this.stopSpeaking();
    this.clearPoint();
    this.hideBubble();
  }

  spawnConfetti() {
    const count = 30;
    const colors = ['#00E5FF', '#FFD166', '#D95736', '#06D6A0', '#FF6584'];
    const robotBox = this.container.querySelector('#orbit-robot-mesh');
    if (!robotBox) return;

    const rect = robotBox.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'orbit-confetti-particle';
      p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      p.style.left = `${cx}px`;
      p.style.top = `${cy}px`;

      const angle = Math.random() * Math.PI * 2;
      const dist = 50 + Math.random() * 95;
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist - 30;
      const trot = (Math.random() - 0.5) * 500;

      p.style.setProperty('--tx', `${tx}px`);
      p.style.setProperty('--ty', `${ty}px`);
      p.style.setProperty('--trot', `${trot}deg`);

      document.body.appendChild(p);
      setTimeout(() => p.remove(), 1250);
    }
  }

}

// Global Singleton Instance for easy importing across screens
export const orbit = new Orbit();
