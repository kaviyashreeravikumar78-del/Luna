/**
 * LUNA: Mission Survival - Module 3: Simulation Engine Balancing Configuration
 * Central tuning parameters for 7-day lunar colony survival.
 */
export const SIMULATION_CONFIG = {
  // Max duration of expedition
  maxDays: 7,

  // Storage key for persistent state
  storageKey: 'luna_mission_survival_state_v3',

  // Daily baseline resource consumption (in % points per day)
  dailyConsumption: {
    oxygen: 5,
    water: 6,
    food: 5,
    power: 7,
  },

  // Resource status tiers
  resourceTiers: {
    excellent: { min: 100, label: 'Excellent', color: '#00E5FF' },
    stable: { min: 70, label: 'Stable', color: '#06D6A0' },
    warning: { min: 40, label: 'Warning', color: '#E8B76B' },
    critical: { min: 1, label: 'Critical', color: '#FF3B30' },
    depleted: { min: 0, label: 'Depleted', color: '#7B2CBF' },
  },

  // Crew health status tiers
  crewTiers: {
    healthy: { min: 85, label: 'Healthy', color: '#06D6A0' },
    caution: { min: 60, label: 'Caution', color: '#E8B76B' },
    injured: { min: 30, label: 'Injured', color: '#F47752' },
    critical: { min: 1, label: 'Critical', color: '#FF3B30' },
    unconscious: { min: 0, label: 'Unconscious', color: '#7B2CBF' },
  },

  // Facility condition tiers
  facilityTiers: {
    operational: { min: 70, label: 'Operational', color: '#06D6A0' },
    degraded: { min: 40, label: 'Degraded', color: '#E8B76B' },
    critical: { min: 1, label: 'Critical', color: '#FF3B30' },
    offline: { min: 0, label: 'Offline', color: '#7B2CBF' },
  },

  // Low resource penalty impact on crew (per day when below warningMin)
  depletionPenalties: {
    oxygenWarning: { healthDelta: -4, reason: 'Hypoxia strain from low oxygen levels' },
    oxygenDepleted: { healthDelta: -20, reason: 'Severe asphyxiation emergency from depleted oxygen' },
    waterWarning: { healthDelta: -3, reason: 'Dehydration fatigue from restricted water' },
    waterDepleted: { healthDelta: -15, reason: 'Acute dehydration shock from depleted water reserves' },
    foodWarning: { healthDelta: -3, reason: 'Caloric deficiency and exhaustion from ration reduction' },
    foodDepleted: { healthDelta: -12, reason: 'Starvation weakness from depleted food rations' },
    powerWarning: { facilityId: 'research_lab', conditionDelta: -10, reason: 'Power brownouts forcing lab systems offline' },
    powerDepleted: { facilityId: 'greenhouse', conditionDelta: -25, reason: 'Total blackout disabling hydroponic grow lights and heaters' },
  }
};
