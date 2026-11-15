import { BUILDINGS_DATA } from '../data/buildings.js';
import { orbit } from '../components/Orbit.js';

/**
 * Super Friendly, Kid-Friendly 8-Step Base Tour Guide
 * Powered exclusively by the REAL animated ORBIT Moon Buddy component.
 * No duplicate boxes, no fake glowing cyan circles - ONLY the real cute robot!
 */
export const TUTORIAL_STEPS = [
  {
    stepIndex: 1,
    title: "Hi, Commander! I'm ORBIT! 👋",
    buildingId: null,
    cameraPos: { x: 23, y: 19, z: 27 },
    cameraTarget: { x: 0, y: 1, z: 0 },
    emotion: 'happy',
    gesture: 'wave',
    message: "Welcome to our Moon base! Follow me, I'll show you around our 6 super-cool base stations!",
  },
  {
    stepIndex: 2,
    title: "1. Main Space House 🏠",
    buildingId: "habitat",
    cameraPos: BUILDINGS_DATA.habitat.cameraView.position,
    cameraTarget: BUILDINGS_DATA.habitat.cameraView.target,
    emotion: 'excited',
    gesture: 'point',
    message: "Here is our main house! This is where our 4 astronaut friends sleep, eat, and stay safe and warm.",
  },
  {
    stepIndex: 3,
    title: "2. Plant Greenhouses 🌱",
    buildingId: "greenhouse",
    cameraPos: BUILDINGS_DATA.greenhouse.cameraView.position,
    cameraTarget: BUILDINGS_DATA.greenhouse.cameraView.target,
    emotion: 'happy',
    gesture: 'point',
    message: "Look inside the clear glass dome! We grow sweet plants that make fresh oxygen for us to breathe!",
  },
  {
    stepIndex: 4,
    title: "3. Sun Power Panels ⚡",
    buildingId: "solar_array",
    cameraPos: BUILDINGS_DATA.solar_array.cameraView.position,
    cameraTarget: BUILDINGS_DATA.solar_array.cameraView.target,
    emotion: 'thinking',
    gesture: 'point',
    message: "These shiny blue panels soak up warm sunlight and turn it into clean electricity for the whole base!",
  },
  {
    stepIndex: 5,
    title: "4. Moon Science Lab 🔬",
    buildingId: "research_lab",
    cameraPos: BUILDINGS_DATA.research_lab.cameraView.position,
    cameraTarget: BUILDINGS_DATA.research_lab.cameraView.target,
    emotion: 'thinking',
    gesture: 'point',
    message: "Scientists work inside this lab using lasers to inspect sparkling Moon rocks and hidden ice water!",
  },
  {
    stepIndex: 6,
    title: "5. Space Radio Dish 📡",
    buildingId: "antenna",
    cameraPos: BUILDINGS_DATA.antenna.cameraView.position,
    cameraTarget: BUILDINGS_DATA.antenna.cameraView.target,
    emotion: 'excited',
    gesture: 'point',
    message: "This giant silver dish beams video calls across 384,000 km straight home to Earth!",
  },
  {
    stepIndex: 7,
    title: "6. Moon Rover Buggy 🚜",
    buildingId: "rover",
    cameraPos: BUILDINGS_DATA.rover.cameraView.position,
    cameraTarget: BUILDINGS_DATA.rover.cameraView.target,
    emotion: 'celebrate',
    gesture: 'celebrate',
    message: "Meet Pathfinder, our 6-wheel space truck! It climbs steep craters and never gets stuck!",
  },
  {
    stepIndex: 8,
    title: "You're Ready to Explore! 🌟",
    buildingId: null,
    cameraPos: { x: 18, y: 16, z: 22 },
    cameraTarget: { x: 0, y: 1, z: 0 },
    emotion: 'happy',
    gesture: 'wave',
    message: "All systems nominal! Use W, A, S, D or Arrow keys to walk around. Click any building to explore!",
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
    this.isRunning = false;
  }

  start(force = false) {
    if (!force && typeof localStorage !== 'undefined' && localStorage.getItem(this.storageKey) === 'true') {
      return;
    }
    this.currentStep = 0;
    this.isRunning = true;
    this.renderStep();
  }

  renderStep() {
    const step = TUTORIAL_STEPS[this.currentStep];
    if (!step) return;

    const isLast = this.currentStep === TUTORIAL_STEPS.length - 1;

    // Smoothly fly 3D camera to frame the building
    if (step.cameraPos && step.cameraTarget) {
      this.cameraManager.flyTo(step.cameraPos, step.cameraTarget, 1100);
    }

    // Highlight active building in 3D scene
    if (this.interactionManager) {
      this.interactionManager.highlightBuilding(step.buildingId);
    }

    // Position real ORBIT companion in top-right area
    orbit.flyTo(window.innerWidth - 200, 100);

    // Speak with real ORBIT Moon Buddy component
    orbit.say(step.message, {
      emotion: step.emotion || 'happy',
      gesture: step.gesture || 'point',
      showNextBtn: true,
      nextBtnText: isLast ? "Let's Play! 🚀" : "Next ➔",
      onComplete: () => {
        this.nextStep();
      }
    });

    if (this.onStepChange) {
      this.onStepChange(this.currentStep);
    }
  }

  nextStep() {
    if (this.currentStep < TUTORIAL_STEPS.length - 1) {
      this.currentStep++;
      this.renderStep();
    } else {
      this.complete();
    }
  }

  prevStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.renderStep();
    }
  }

  skip() {
    this.complete();
  }

  complete() {
    this.isRunning = false;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.storageKey, 'true');
    }

    orbit.clearPoint();
    orbit.setEmotion('happy');
    orbit.setGesture('wave');

    // Fly safely back to corner dock
    orbit.flyTo(window.innerWidth - 185, window.innerHeight - 245);

    if (this.interactionManager) {
      this.interactionManager.highlightBuilding(null);
    }
    this.cameraManager.reset(1200);

    // Friendly walking instruction from the robot
    setTimeout(() => {
      orbit.say("Use W, A, S, D or the Arrow keys to walk around and explore our base!", {
        emotion: 'happy',
        gesture: 'wave'
      });
    }, 1300);

    if (this.onComplete) {
      this.onComplete();
    }
  }

  replay() {
    this.start(true);
  }
}
