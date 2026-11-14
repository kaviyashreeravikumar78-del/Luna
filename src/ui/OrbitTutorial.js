import { BUILDINGS_DATA } from '../data/buildings.js';
import { orbitVoice } from '../audio/OrbitVoice.js';

/**
 * Super Friendly, Kid-Friendly 8-Step Tutorial Guide powered by ORBIT
 */
export const TUTORIAL_STEPS = [
  {
    stepIndex: 1,
    title: "Hi, Commander! I'm ORBIT! 👋",
    buildingId: null,
    cameraPos: { x: 23, y: 19, z: 27 },
    cameraTarget: { x: 0, y: 1, z: 0 },
    orbitPos: { x: 2.5, y: 3.5, z: 5.0 },
    message: "Welcome to our Moon base! I am your friendly floating robot buddy. Follow me! I'll show you around all 6 super-cool places in our base!",
  },
  {
    stepIndex: 2,
    title: "1. Main Space House 🏠",
    buildingId: "habitat",
    cameraPos: BUILDINGS_DATA.habitat.cameraView.position,
    cameraTarget: BUILDINGS_DATA.habitat.cameraView.target,
    orbitPos: BUILDINGS_DATA.habitat.orbitTarget,
    message: "Here is our main house! This is where our 4 astronaut friends sleep, eat, and stay safe and warm. Look at the big oval window and the front airlock door!",
  },
  {
    stepIndex: 3,
    title: "2. Plant Greenhouses 🌱",
    buildingId: "greenhouse",
    cameraPos: BUILDINGS_DATA.greenhouse.cameraView.position,
    cameraTarget: BUILDINGS_DATA.greenhouse.cameraView.target,
    orbitPos: BUILDINGS_DATA.greenhouse.orbitTarget,
    message: "Look inside the clear glass tunnel! We are growing sweet green plants and mini trees. They make fresh, clean oxygen air for us to breathe every day!",
  },
  {
    stepIndex: 4,
    title: "3. Sun Power Panels ⚡",
    buildingId: "solar_array",
    cameraPos: BUILDINGS_DATA.solar_array.cameraView.position,
    cameraTarget: BUILDINGS_DATA.solar_array.cameraView.target,
    orbitPos: BUILDINGS_DATA.solar_array.orbitTarget,
    message: "These big shiny blue panels soak up warm sunlight! They turn sunshine into clean electricity to light up our rooms and keep all our machines humming.",
  },
  {
    stepIndex: 5,
    title: "4. Moon Science Lab 🔬",
    buildingId: "research_lab",
    cameraPos: BUILDINGS_DATA.research_lab.cameraView.position,
    cameraTarget: BUILDINGS_DATA.research_lab.cameraView.target,
    orbitPos: BUILDINGS_DATA.research_lab.orbitTarget,
    message: "Our clever scientists work inside this lab! Look through the glowing blue window—they use lasers to inspect sparkling Moon rocks and discover hidden ice water!",
  },
  {
    stepIndex: 6,
    title: "5. Space Radio Dish 📡",
    buildingId: "antenna",
    cameraPos: BUILDINGS_DATA.antenna.cameraView.position,
    cameraTarget: BUILDINGS_DATA.antenna.cameraView.target,
    orbitPos: BUILDINGS_DATA.antenna.orbitTarget,
    message: "See this giant silver dish perched on the rocks? It flashes its red light and sends video calls straight across space to our families on planet Earth!",
  },
  {
    stepIndex: 7,
    title: "6. Moon Rover Buggy 🚜",
    buildingId: "rover",
    cameraPos: BUILDINGS_DATA.rover.cameraView.position,
    cameraTarget: BUILDINGS_DATA.rover.cameraView.target,
    orbitPos: BUILDINGS_DATA.rover.orbitTarget,
    message: "Meet Pathfinder, our 6-wheel space truck! With its blue solar wings and bright headlights, it can drive up steep Moon craters and never gets stuck in the dirt!",
  },
  {
    stepIndex: 8,
    title: "You're Ready to Explore! 🌟",
    buildingId: null,
    cameraPos: { x: 18, y: 16, z: 22 },
    cameraTarget: { x: 0, y: 1, z: 0 },
    orbitPos: { x: 2.5, y: 3.5, z: 5.0 },
    message: "Great job, Commander! You can spin the camera around with your mouse, zoom in close, and click on any building to see its details. Have fun on the Moon!",
  }
];

export class OrbitTutorial {
  constructor(cameraManager, interactionManager, onStepChangeCallback, onCompleteCallback) {
    this.cameraManager = cameraManager;
    this.interactionManager = interactionManager;
    this.onStepChange = onStepChangeCallback;
    this.onComplete = onCompleteCallback;
    this.currentStep = 0;
    this.storageKey = 'luna_orbit_tutorial_completed';

    this.createDOM();
  }

  createDOM() {
    this.container = document.createElement('div');
    this.container.className = 'orbit-tutorial-box';
    this.container.style.display = 'none';

    this.container.innerHTML = `
      <div class="orbit-avatar-badge">
        <div class="orbit-eye-pulse"></div>
        <span class="orbit-label">O.R.B.I.T.</span>
        <button class="btn-voice-toggle" id="orbit-voice-toggle" title="Toggle Robot Voice">
          ${orbitVoice.isMuted ? '🔇 Muted' : '🔊 Voice ON'}
        </button>
      </div>
      <div class="orbit-dialogue-content">
        <div class="orbit-step-counter" id="orbit-step-counter">Step 1 of 8</div>
        <h4 class="orbit-step-title" id="orbit-step-title">Welcome</h4>
        <p class="orbit-message-text" id="orbit-message-text">Message</p>
        <div class="orbit-btn-row">
          <button class="btn-orbit-secondary" id="orbit-back-btn">← Back</button>
          <button class="btn-orbit-skip" id="orbit-skip-btn">Skip Tour</button>
          <button class="btn-orbit-primary" id="orbit-next-btn">Next →</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.container);

    this.container.querySelector('#orbit-back-btn').addEventListener('click', () => this.prevStep());
    this.container.querySelector('#orbit-next-btn').addEventListener('click', () => this.nextStep());
    this.container.querySelector('#orbit-skip-btn').addEventListener('click', () => this.skip());

    const voiceBtn = this.container.querySelector('#orbit-voice-toggle');
    voiceBtn.addEventListener('click', () => {
      const active = orbitVoice.toggleMute();
      voiceBtn.textContent = active ? '🔊 Voice ON' : '🔇 Muted';
      if (active) {
        const step = TUTORIAL_STEPS[this.currentStep];
        if (step) orbitVoice.speak(step.message);
      }
    });
  }

  start(force = false) {
    if (!force && localStorage.getItem(this.storageKey) === 'true') {
      return; // Already completed and not explicitly requested
    }
    this.currentStep = 0;
    this.container.style.display = 'flex';
    this.renderStep();
  }

  renderStep() {
    const step = TUTORIAL_STEPS[this.currentStep];
    if (!step) return;

    this.container.querySelector('#orbit-step-counter').textContent = `Step ${step.stepIndex} of ${TUTORIAL_STEPS.length}`;
    this.container.querySelector('#orbit-step-title').textContent = step.title;
    this.container.querySelector('#orbit-message-text').textContent = step.message;

    // Button states
    const backBtn = this.container.querySelector('#orbit-back-btn');
    const nextBtn = this.container.querySelector('#orbit-next-btn');
    backBtn.disabled = this.currentStep === 0;

    if (this.currentStep === TUTORIAL_STEPS.length - 1) {
      nextBtn.textContent = "Let's Play! 🚀";
    } else {
      nextBtn.textContent = 'Next →';
    }

    // Move camera to clearly frame the object
    if (step.cameraPos && step.cameraTarget) {
      this.cameraManager.flyTo(step.cameraPos, step.cameraTarget, 1100);
    }

    // Highlight active building with 3D beacon
    if (this.interactionManager) {
      this.interactionManager.highlightBuilding(step.buildingId);
    }

    // Notify Game to move 3D ORBIT robot
    if (this.onStepChange && step.orbitPos) {
      this.onStepChange(step.orbitPos);
    }

    // Speak message with friendly robot voice
    orbitVoice.speak(step.message);
  }

  nextStep() {
    orbitVoice.stop();
    if (this.currentStep < TUTORIAL_STEPS.length - 1) {
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
    if (this.interactionManager) {
      this.interactionManager.highlightBuilding(null);
    }
    this.cameraManager.reset(1200);
    if (this.onComplete) {
      this.onComplete();
    }
  }

  replay() {
    this.start(true);
  }
}
