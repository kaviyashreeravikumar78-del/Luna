import { SIMULATION_CONFIG } from '../data/simulationConfig.js';

/**
 * LUNA: Mission Survival - Astronaut Health & Condition Engine
 * Evaluates astronaut vital signs, condition tiers, and medical change logs.
 */
export class CrewHealthEngine {
  static clamp(val) {
    return Math.min(100, Math.max(0, Math.round(val)));
  }

  /**
   * Returns the status tier and styling for an astronaut's health
   */
  static getTier(health) {
    const h = Number(health);
    const tiers = SIMULATION_CONFIG.crewTiers;

    if (h >= tiers.healthy.min) return tiers.healthy;
    if (h >= tiers.caution.min) return tiers.caution;
    if (h >= tiers.injured.min) return tiers.injured;
    if (h >= tiers.critical.min) return tiers.critical;
    return tiers.unconscious;
  }

  /**
   * Applies health change with full audit logging
   * @param {Object} astronaut Current astronaut state
   * @param {number} delta Positive or negative health change
   * @param {string} reason Plain English explanation
   * @returns {Object} Updated astronaut state + change event
   */
  static applyHealthDelta(astronaut, delta, reason) {
    const prev = astronaut.health ?? 100;
    const next = this.clamp(prev + delta);
    const tier = this.getTier(next);

    const logEntry = {
      astronautId: astronaut.id,
      name: astronaut.name,
      previousHealth: prev,
      currentHealth: next,
      delta: next - prev,
      status: tier.label,
      reason: reason || 'Routine mission strain',
      timestamp: new Date().toISOString()
    };

    const updated = {
      ...astronaut,
      health: next,
      status: tier.label,
      statusColor: tier.color,
      conditionReason: reason || astronaut.conditionReason || 'Nominal vital signs'
    };

    return { updated, logEntry };
  }

  /**
   * Evaluates biological consequences of low colony resources on crew
   * @param {Object} crew Object map of astronauts { evelyn, marcus, aris, maya }
   * @param {Object} resources { oxygen, water, food, power }
   * @returns {Object} { updatedCrew, healthLogs }
   */
  static evaluateResourcePenalties(crew, resources) {
    const updatedCrew = { ...crew };
    const healthLogs = [];
    const penalties = SIMULATION_CONFIG.depletionPenalties;

    // 1. Oxygen Shortage (Affects all 4 crew members)
    if (resources.oxygen === 0) {
      Object.keys(updatedCrew).forEach(id => {
        const { updated, logEntry } = this.applyHealthDelta(
          updatedCrew[id],
          penalties.oxygenDepleted.healthDelta,
          penalties.oxygenDepleted.reason
        );
        updatedCrew[id] = updated;
        healthLogs.push(logEntry);
      });
    } else if (resources.oxygen < 40) {
      Object.keys(updatedCrew).forEach(id => {
        const { updated, logEntry } = this.applyHealthDelta(
          updatedCrew[id],
          penalties.oxygenWarning.healthDelta,
          penalties.oxygenWarning.reason
        );
        updatedCrew[id] = updated;
        healthLogs.push(logEntry);
      });
    }

    // 2. Water Shortage (Affects Marcus & Maya)
    if (resources.water === 0) {
      ['marcus', 'maya'].forEach(id => {
        if (updatedCrew[id]) {
          const { updated, logEntry } = this.applyHealthDelta(
            updatedCrew[id],
            penalties.waterDepleted.healthDelta,
            penalties.waterDepleted.reason
          );
          updatedCrew[id] = updated;
          healthLogs.push(logEntry);
        }
      });
    } else if (resources.water < 40) {
      ['marcus', 'maya'].forEach(id => {
        if (updatedCrew[id]) {
          const { updated, logEntry } = this.applyHealthDelta(
            updatedCrew[id],
            penalties.waterWarning.healthDelta,
            penalties.waterWarning.reason
          );
          updatedCrew[id] = updated;
          healthLogs.push(logEntry);
        }
      });
    }

    // 3. Food Shortage (Affects Evelyn & Dr. Aris)
    if (resources.food === 0) {
      ['evelyn', 'aris'].forEach(id => {
        if (updatedCrew[id]) {
          const { updated, logEntry } = this.applyHealthDelta(
            updatedCrew[id],
            penalties.foodDepleted.healthDelta,
            penalties.foodDepleted.reason
          );
          updatedCrew[id] = updated;
          healthLogs.push(logEntry);
        }
      });
    } else if (resources.food < 40) {
      ['evelyn', 'aris'].forEach(id => {
        if (updatedCrew[id]) {
          const { updated, logEntry } = this.applyHealthDelta(
            updatedCrew[id],
            penalties.foodWarning.healthDelta,
            penalties.foodWarning.reason
          );
          updatedCrew[id] = updated;
          healthLogs.push(logEntry);
        }
      });
    }

    return { updatedCrew, healthLogs };
  }
}
