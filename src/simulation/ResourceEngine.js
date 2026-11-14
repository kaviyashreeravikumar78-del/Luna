import { SIMULATION_CONFIG } from '../data/simulationConfig.js';

/**
 * LUNA: Mission Survival - Resource Consumption & Depletion Engine
 * Computes deterministic daily resource changes, clamps 0-100, and evaluates alerts.
 */
export class ResourceEngine {
  /**
   * Clamps a resource percentage strictly to [0, 100]
   */
  static clamp(val) {
    return Math.min(100, Math.max(0, Math.round(val)));
  }

  /**
   * Applies daily baseline consumption to the current resources
   * @param {Object} currentResources { oxygen, water, food, power }
   * @returns {Object} { newResources, deltas }
   */
  static applyDailyConsumption(currentResources) {
    const rates = SIMULATION_CONFIG.dailyConsumption;
    const newResources = {};
    const deltas = {};

    ['oxygen', 'water', 'food', 'power'].forEach(resKey => {
      const burn = rates[resKey] || 5;
      const initial = currentResources[resKey] ?? 100;
      const updated = this.clamp(initial - burn);

      newResources[resKey] = updated;
      deltas[resKey] = updated - initial;
    });

    return { newResources, deltas };
  }

  /**
   * Evaluates the status tier for a resource percentage
   * @param {number} value (0 - 100)
   * @returns {Object} Tier definition { label, color, min }
   */
  static getTier(value) {
    const v = Number(value);
    const tiers = SIMULATION_CONFIG.resourceTiers;

    if (v >= tiers.excellent.min) return tiers.excellent;
    if (v >= tiers.stable.min) return tiers.stable;
    if (v >= tiers.warning.min) return tiers.warning;
    if (v >= tiers.critical.min) return tiers.critical;
    return tiers.depleted;
  }

  /**
   * Identifies all active resource warnings and depletion notices
   * @param {Object} resources
   * @returns {Array<Object>} List of warning objects
   */
  static evaluateWarnings(resources) {
    const warnings = [];

    ['oxygen', 'water', 'food', 'power'].forEach(key => {
      const val = resources[key] ?? 100;
      const tier = this.getTier(val);

      if (val === 0) {
        warnings.push({
          type: 'depleted',
          resource: key,
          level: 'critical',
          message: `CRITICAL ALERT: ${key.toUpperCase()} has been completely depleted (0%)!`,
          color: '#7B2CBF'
        });
      } else if (val < 40) {
        warnings.push({
          type: 'low',
          resource: key,
          level: 'warning',
          message: `WARNING: ${key.toUpperCase()} is running critically low (${val}%)!`,
          color: '#FF3B30'
        });
      }
    });

    return warnings;
  }
}
