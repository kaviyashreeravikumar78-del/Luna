import { orbitVoice } from '../audio/OrbitVoice.js';

/**
 * LUNA: Mission Survival - Module 2: Dedicated 5-Step Mission Control ORBIT Guide
 */
export const MC_TUTORIAL_STEPS = [
  {
    stepIndex: 1,
    targetSectionId: "mc-section-header",
    title: "Welcome to Mission Control! 🚀",
    message: "Commander, welcome to your central command deck! Look up at the top bar—it shows your mission name (LUNA-01), your location at the Moon's South Pole, and confirms that all 4 crew members are safe on Day 1!",
  },
  {
    stepIndex: 2,
    targetSectionId: "mc-section-resources",
    title: "1. Vital Colony Resources 💧",
    message: "Here are our four vital survival resources: Oxygen, Water, Food, and Power! All are at 100% Excellent right now. Click any resource card anytime to learn where it comes from and how it works!",
  },
  {
    stepIndex: 3,
    targetSectionId: "mc-section-crew",
    title: "2. Your Astronaut Crew 👩‍🚀",
    message: "Meet your 4 space friends: Commander Evelyn, Chief Engineer Marcus, Astrobiologist Aris, and Communications Specialist Maya! Their health is 100% full. Click any astronaut to read their bio and daily activities!",
  },
  {
    stepIndex: 4,
    targetSectionId: "mc-section-facilities",
    title: "3. Base Facilities & 3D Link 🏛️",
    message: "This section monitors our 5 main surface buildings. Everything is 100% Operational! If you click a building, you can press 'View in 3D Colony' to immediately fly the 3D camera right to it on the Moon!",
  },
  {
    stepIndex: 5,
    targetSectionId: "mc-section-timeline",
    title: "4. Seven-Day Mission Timeline 🗓️",
    message: "Here is your 7-day survival timeline! Day 1 is active right now. Days 2 through 7 are locked for future adventures. Whenever you're ready, click 'Return to 3D Colony' at the top to explore the Moon base again!",
  }
];

export class MissionControlOrbitGuide {
  constructor(onCompleteCallback) {
    this.onComplete = onCompleteCallback;
    this.currentStep = 0;
    this.storageKey = 'luna_mc_tutorial_completed';
    this.createDOM();
  }

  createDOM() {
    this.container = document.createElement('div');
    this.container.className = 'mc-orbit-guide-box';
    this.container.style.display = 'none';

    this.container.innerHTML = `
      <div class="orbit-avatar-badge">
        <div class="orbit-eye-pulse"></div>
        <span class="orbit-label">O.R.B.I.T.</span>
        <button class="btn-voice-toggle" id="mc-voice-toggle" title="Toggle Robot Voice">
          ${orbitVoice.isMuted ? '🔇 Muted' : '🔊 Voice ON'}
        </button>
      </div>
      <div class="orbit-dialogue-content">
        <div class="orbit-step-counter" id="mc-orbit-counter">Step 1 of 5</div>
        <h4 class="orbit-step-title" id="mc-orbit-title">Welcome</h4>
        <p class="orbit-message-text" id="mc-orbit-text">Message</p>
        <div class="orbit-btn-row">
          <button class="btn-orbit-secondary" id="mc-orbit-back">← Back</button>
          <button class="btn-orbit-skip" id="mc-orbit-skip">Skip</button>
          <button class="btn-orbit-primary" id="mc-orbit-next">Next →</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.container);

    this.container.querySelector('#mc-orbit-back').addEventListener('click', () => this.prevStep());
    this.container.querySelector('#mc-orbit-next').addEventListener('click', () => this.nextStep());
    this.container.querySelector('#mc-orbit-skip').addEventListener('click', () => this.skip());

    const voiceBtn = this.container.querySelector('#mc-voice-toggle');
    voiceBtn.addEventListener('click', () => {
      const active = orbitVoice.toggleMute();
      voiceBtn.textContent = active ? '🔊 Voice ON' : '🔇 Muted';
      if (active) {
        const step = MC_TUTORIAL_STEPS[this.currentStep];
        if (step) orbitVoice.speak(step.message);
      }
    });
  }

  start(force = false) {
    if (!force && localStorage.getItem(this.storageKey) === 'true') {
      return;
    }
    this.currentStep = 0;
    this.container.style.display = 'flex';
    this.renderStep();
  }

  renderStep() {
    const step = MC_TUTORIAL_STEPS[this.currentStep];
    if (!step) return;

    this.container.querySelector('#mc-orbit-counter').textContent = `Step ${step.stepIndex} of ${MC_TUTORIAL_STEPS.length}`;
    this.container.querySelector('#mc-orbit-title').textContent = step.title;
    this.container.querySelector('#mc-orbit-text').textContent = step.message;

    const backBtn = this.container.querySelector('#mc-orbit-back');
    const nextBtn = this.container.querySelector('#mc-orbit-next');
    backBtn.disabled = this.currentStep === 0;

    if (this.currentStep === MC_TUTORIAL_STEPS.length - 1) {
      nextBtn.textContent = 'Got it! ✓';
    } else {
      nextBtn.textContent = 'Next →';
    }

    // Highlight target section
    this.highlightSection(step.targetSectionId);

    // Speak message with robot voice
    orbitVoice.speak(step.message);
  }

  highlightSection(sectionId) {
    // Remove existing highlights
    document.querySelectorAll('.mc-tutorial-highlighted').forEach(el => {
      el.classList.remove('mc-tutorial-highlighted');
    });

    if (sectionId) {
      const el = document.getElementById(sectionId);
      if (el) {
        el.classList.add('mc-tutorial-highlighted');
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  nextStep() {
    orbitVoice.stop();
    if (this.currentStep < MC_TUTORIAL_STEPS.length - 1) {
      this.currentStep++;
      this.renderStep();
    } else {
      this.complete();
    }
  }

  prevStep() {
    orbitVoice.stop();
    if (this.currentStep > 0) {
      this.currentStep--;
      this.renderStep();
    }
  }

  skip() {
    orbitVoice.stop();
    this.complete();
  }

  complete() {
    orbitVoice.stop();
    localStorage.setItem(this.storageKey, 'true');
    this.container.style.display = 'none';
    document.querySelectorAll('.mc-tutorial-highlighted').forEach(el => {
      el.classList.remove('mc-tutorial-highlighted');
    });
    if (this.onComplete) this.onComplete();
  }

  replay() {
    this.start(true);
  }
}
