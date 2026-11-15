import { orbit } from '../components/Orbit.js';

/**
 * LUNA: Mission Survival - Mission Control ORBIT Guided Tour
 * 5 short steps where ORBIT flies to each part of the screen, points, and speaks 1 short sentence:
 *  1. Day Timeline (Expedition Map)
 *  2. Resource Gauges (Life Support)
 *  3. Crew Cards (Astronauts)
 *  4. Base Facilities (Surface Buildings)
 *  5. Start Mission Pill Button (Action Bar)
 */
export const MC_GUIDE_STEPS = [
  {
    targetId: 'mc-section-timeline',
    emotion: 'happy',
    gesture: 'point',
    text: "Here is your 7-Sol expedition map with shiny stars to earn!"
  },
  {
    targetId: 'mc-section-resources',
    emotion: 'thinking',
    gesture: 'point',
    text: "These 4 big gauges monitor our Oxygen, Water, Food, and Power!"
  },
  {
    targetId: 'mc-section-crew',
    emotion: 'happy',
    gesture: 'wave',
    text: "Keep our 4 astronaut friends healthy and happy all week!"
  },
  {
    targetId: 'mc-section-facilities',
    emotion: 'excited',
    gesture: 'point',
    text: "These 5 base buildings keep our Moon colony running smoothly!"
  },
  {
    targetId: 'mc-survival-action-bar',
    emotion: 'celebrate',
    gesture: 'celebrate',
    text: "Click this big button to start today's physical mission! Have fun!"
  }
];

export class MissionControlOrbitGuide {
  constructor(onCompleteCallback = null) {
    this.onComplete = onCompleteCallback;
    this.currentStep = 0;
    this.storageKey = 'luna_mc_orbit_guide_seen';
    this.isRunning = false;
  }

  start(force = false) {
    if (!force && typeof localStorage !== 'undefined' && localStorage.getItem(this.storageKey) === 'true') {
      return;
    }
    this.currentStep = 0;
    this.isRunning = true;
    this.runStep();
  }

  replay() {
    this.start(true);
  }

  runStep() {
    if (!this.isRunning) return;
    if (this.currentStep >= MC_GUIDE_STEPS.length) {
      this.finish();
      return;
    }

    const step = MC_GUIDE_STEPS[this.currentStep];
    const isLast = this.currentStep === MC_GUIDE_STEPS.length - 1;
    const targetEl = document.getElementById(step.targetId);

    // Fly ORBIT near target element
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const rect = targetEl.getBoundingClientRect();
      const targetX = Math.max(20, Math.min(window.innerWidth - 200, rect.left + rect.width - 160));
      const targetY = Math.max(80, Math.min(window.innerHeight - 200, rect.top + 20));
      orbit.flyTo(targetX, targetY);
      orbit.pointAt(targetEl);
    }

    // Speak single short sentence with Next button on bubble
    orbit.say(step.text, {
      emotion: step.emotion,
      gesture: step.gesture,
      showNextBtn: true,
      nextBtnText: isLast ? "Let's Go! 🚀" : "Next ➔",
      onComplete: () => {
        if (!this.isRunning) return;
        this.currentStep++;
        if (this.currentStep < MC_GUIDE_STEPS.length) {
          this.runStep();
        } else {
          this.finish();
        }
      }
    });
  }

  finish() {
    this.isRunning = false;
    orbit.clearPoint();
    orbit.hideBubble();
    orbit.setEmotion('happy');
    orbit.setGesture('wave');

    // Fly safely back to corner
    orbit.flyTo(window.innerWidth - 185, window.innerHeight - 245);

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.storageKey, 'true');
    }

    if (this.onComplete) this.onComplete();
  }

  skip() {
    this.finish();
  }
}
