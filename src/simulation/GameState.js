import { SIMULATION_CONFIG } from '../data/simulationConfig.js';
import { MISSION_EVENTS } from '../events/eventDefinitions.js';
import { ResourceEngine } from './ResourceEngine.js';
import { CrewHealthEngine } from './CrewHealthEngine.js';
import { FacilityEngine } from './FacilityEngine.js';
import { DecisionEngine } from './DecisionEngine.js';
import { MissionResult } from './MissionResult.js';
import { donkiService } from '../nasa/DonkiService.js';
import { RadiationAlert } from '../nasa/RadiationAlert.js';

/**
 * LUNA: Mission Survival - Central Game State Manager (Observable Singleton)
 * Coordinates the 7-day survival engine, localStorage persistence, and UI synchronization.
 */
export class GameState {
  constructor() {
    this.listeners = new Set();
    this.storageKey = SIMULATION_CONFIG.storageKey;
    this.initDefaultState();
    this.load();
  }

  initDefaultState() {
    this.currentDay = 1;
    this.maxDays = SIMULATION_CONFIG.maxDays;
    this.missionStatus = 'active'; // 'active' | 'completed' | 'failed'

    // Resources (0 - 100)
    this.resources = {
      oxygen: 100,
      water: 100,
      food: 100,
      power: 100,
    };

    // Four Astronauts
    this.crew = {
      evelyn: {
        id: 'evelyn',
        name: 'Dr. Evelyn Vance',
        role: 'Mission Commander',
        avatarColor: '#D95736',
        health: 100,
        status: 'Healthy',
        statusColor: '#06D6A0',
        conditionReason: 'Nominal vital signs'
      },
      marcus: {
        id: 'marcus',
        name: 'Marcus Diaz',
        role: 'Chief Systems Engineer',
        avatarColor: '#3A86FF',
        health: 100,
        status: 'Healthy',
        statusColor: '#06D6A0',
        conditionReason: 'Nominal vital signs'
      },
      aris: {
        id: 'aris',
        name: 'Dr. Aris Thorne',
        role: 'Astrobiologist',
        avatarColor: '#68B255',
        health: 100,
        status: 'Healthy',
        statusColor: '#06D6A0',
        conditionReason: 'Nominal vital signs'
      },
      maya: {
        id: 'maya',
        name: 'Maya Lin',
        role: 'Communications Specialist',
        avatarColor: '#E8B76B',
        health: 100,
        status: 'Healthy',
        statusColor: '#06D6A0',
        conditionReason: 'Nominal vital signs'
      }
    };

    // Five Facilities
    this.facilities = {
      habitat: {
        id: 'habitat',
        name: 'Main Habitat Hub',
        icon: '🏠',
        condition: 100,
        status: 'Operational',
        statusColor: '#06D6A0'
      },
      solar_array: {
        id: 'solar_array',
        name: 'Photovoltaic Solar Farm',
        icon: '⚡',
        condition: 100,
        status: 'Operational',
        statusColor: '#06D6A0'
      },
      greenhouse: {
        id: 'greenhouse',
        name: 'Hydroponic Bio-Domes',
        icon: '🌱',
        condition: 100,
        status: 'Operational',
        statusColor: '#06D6A0'
      },
      research_lab: {
        id: 'research_lab',
        name: 'Lunar Geological Laboratory',
        icon: '🔬',
        condition: 100,
        status: 'Operational',
        statusColor: '#06D6A0'
      },
      antenna: {
        id: 'antenna',
        name: 'Space Radio Dish (Deep Space Uplink)',
        icon: '📡',
        condition: 100,
        status: 'Operational',
        statusColor: '#06D6A0'
      }
    };

    this.eventHistory = [];
    this.decisionHistory = [];
    this.dayProcessed = { 1: true }; // Tracks consumption per day to avoid duplicate deductions
    this.currentDayDecided = false;
    this.currentDayEvent = MISSION_EVENTS[1];
    this.lastDecisionResult = null;
    this.nasaTelemetry = null;
    this.warnings = [];
    this.finalReport = null;
  }

  // --- Observer Pattern ---
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.warnings = ResourceEngine.evaluateWarnings(this.resources);
    this.listeners.forEach(fn => {
      try {
        fn(this);
      } catch (err) {
        console.error("Error in GameState listener:", err);
      }
    });
  }

  // --- Persistence ---
  save() {
    try {
      const payload = {
        version: 3,
        currentDay: this.currentDay,
        maxDays: this.maxDays,
        missionStatus: this.missionStatus,
        resources: this.resources,
        crew: this.crew,
        facilities: this.facilities,
        eventHistory: this.eventHistory,
        decisionHistory: this.decisionHistory,
        dayProcessed: this.dayProcessed,
        currentDayDecided: this.currentDayDecided,
        lastDecisionResult: this.lastDecisionResult,
        finalReport: this.finalReport
      };
      localStorage.setItem(this.storageKey, JSON.stringify(payload));
    } catch (e) {
      console.warn("Could not save GameState to localStorage:", e);
    }
  }

  load() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return;

      const parsed = JSON.parse(stored);
      if (parsed.version === 3) {
        this.currentDay = parsed.currentDay || 1;
        this.maxDays = parsed.maxDays || 7;
        this.missionStatus = parsed.missionStatus || 'active';
        this.resources = parsed.resources || this.resources;
        this.crew = parsed.crew || this.crew;
        this.facilities = parsed.facilities || this.facilities;
        this.eventHistory = parsed.eventHistory || [];
        this.decisionHistory = parsed.decisionHistory || [];
        this.dayProcessed = parsed.dayProcessed || { 1: true };
        this.currentDayDecided = parsed.currentDayDecided || false;
        this.lastDecisionResult = parsed.lastDecisionResult || null;
        this.finalReport = parsed.finalReport || null;
        this.currentDayEvent = MISSION_EVENTS[this.currentDay] || null;
      }
    } catch (e) {
      console.warn("Could not load GameState from localStorage, starting fresh:", e);
      this.initDefaultState();
    }
  }

  /**
   * Resets mission back to Sol 1
   */
  reset() {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (e) {}
    this.initDefaultState();
    this.save();
    this.notify();
  }

  /**
   * Applies the selected decision for the current day's event
   * @param {string} decisionId 
   * @returns {Object} Result summary
   */
  applyDecision(decisionId) {
    if (this.currentDayDecided) {
      console.warn("Decision for today has already been applied. Returning existing result.");
      return this.lastDecisionResult || {
        logText: "Orders for today have already been executed.",
        tag: "Completed",
        consequences: {}
      };
    }

    const event = this.currentDayEvent || MISSION_EVENTS[this.currentDay];
    if (!event) throw new Error("No active event found for Sol " + this.currentDay);

    const { updatedResources, updatedFacilities, updatedCrew, resultSummary } = DecisionEngine.applyDecision(
      event,
      decisionId,
      {
        resources: this.resources,
        facilities: this.facilities,
        crew: this.crew
      }
    );

    this.resources = updatedResources;
    this.facilities = updatedFacilities;
    this.crew = updatedCrew;
    this.currentDayDecided = true;
    this.lastDecisionResult = resultSummary;
    this.decisionHistory.push(resultSummary);
    this.eventHistory.push({
      sol: this.currentDay,
      eventId: event.id,
      title: event.title,
      decisionId,
      resultText: resultSummary.logText
    });

    // Check if any critical condition occurred
    this.evaluateMissionStatus();

    this.save();
    this.notify();

    return resultSummary;
  }

  /**
   * Advances the mission to the next Sol (e.g. Sol 1 -> Sol 2)
   */
  advanceDay() {
    // If today was not decided yet, auto-decide with default choice so player is NEVER blocked!
    if (!this.currentDayDecided && this.currentDay <= this.maxDays) {
      try {
        const defaultChoice = `choice_${this.currentDay}_a`;
        this.applyDecision(defaultChoice);
      } catch (e) {
        this.currentDayDecided = true;
      }
    }

    // Check if already completed Day 7
    if (this.currentDay >= this.maxDays) {
      this.missionStatus = 'completed';
      this.finalReport = MissionResult.evaluate(this);
      this.save();
      this.notify();
      return { completed: true, report: this.finalReport };
    }

    // Move to next Sol
    this.currentDay += 1;
    this.currentDayDecided = false;
    this.lastDecisionResult = null;
    this.currentDayEvent = MISSION_EVENTS[this.currentDay];

    // Apply baseline daily consumption strictly ONCE for the new Sol
    if (!this.dayProcessed[this.currentDay]) {
      const { newResources } = ResourceEngine.applyDailyConsumption(this.resources);
      this.resources = newResources;
      this.dayProcessed[this.currentDay] = true;

      // Apply low-resource biological & facility penalties
      const { updatedCrew } = CrewHealthEngine.evaluateResourcePenalties(this.crew, this.resources);
      this.crew = updatedCrew;

      const { updatedFacilities } = FacilityEngine.evaluatePowerImpact(this.facilities, this.resources.power);
      this.facilities = updatedFacilities;
    }

    this.evaluateMissionStatus();
    this.save();
    this.notify();

    return { completed: false, currentDay: this.currentDay };
  }

  /**
   * Directly jumps to any Sol (1-7)
   */
  jumpToDay(targetDay) {
    const day = Math.max(1, Math.min(this.maxDays, targetDay));
    this.currentDay = day;
    this.currentDayDecided = false;
    this.currentDayEvent = MISSION_EVENTS[day] || null;
    this.save();
    this.notify();
    return this.currentDay;
  }

  /**
   * Evaluates if mission has failed or reached conclusion
   */
  evaluateMissionStatus() {
    const allCrewDead = Object.values(this.crew).every(c => c.health <= 0);
    const anyResourceZero = Object.values(this.resources).some(r => r <= 0);

    if (allCrewDead) {
      this.missionStatus = 'failed';
      this.finalReport = MissionResult.evaluate(this);
    } else if (this.currentDay >= 7 && this.currentDayDecided) {
      this.missionStatus = 'completed';
      this.finalReport = MissionResult.evaluate(this);
    }
  }

  /**
   * Asynchronously retrieves NASA DONKI SEP telemetry for Day 3
   */
  async getNASASepAlert() {
    if (this.nasaTelemetry) return this.nasaTelemetry;
    const raw = await donkiService.fetchSepEvent();
    this.nasaTelemetry = RadiationAlert.createAlertPackage(raw);
    return this.nasaTelemetry;
  }
}

// Global Singleton Instance
export const gameState = new GameState();
