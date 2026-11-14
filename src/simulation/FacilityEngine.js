import { SIMULATION_CONFIG } from '../data/simulationConfig.js';

/**
 * LUNA: Mission Survival - Facility Condition & Operational Integrity Engine
 * Evaluates facility condition ratings, status tiers, and infrastructure wear.
 */
export class FacilityEngine {
  static clamp(val) {
    return Math.min(100, Math.max(0, Math.round(val)));
  }

  /**
   * Evaluates the operational tier for a facility condition percentage
   */
  static getTier(condition) {
    const c = Number(condition);
    const tiers = SIMULATION_CONFIG.facilityTiers;

    if (c >= tiers.operational.min) return tiers.operational;
    if (c >= tiers.degraded.min) return tiers.degraded;
    if (c >= tiers.critical.min) return tiers.critical;
    return tiers.offline;
  }

  /**
   * Applies condition change to a facility
   * @param {Object} facility
   * @param {number} delta
   * @returns {Object} Updated facility object
   */
  static applyConditionDelta(facility, delta) {
    const prev = facility.condition ?? 100;
    const next = this.clamp(prev + delta);
    const tier = this.getTier(next);

    return {
      ...facility,
      condition: next,
      status: tier.label,
      statusColor: tier.color,
      isOperational: (next >= 40)
    };
  }

  /**
   * Evaluates consequences of low electrical power on colony facilities
   * @param {Object} facilities Object map of 5 facilities
   * @param {number} powerLevel Current power percentage (0 - 100)
   * @returns {Object} { updatedFacilities, facilityLogs }
   */
  static evaluatePowerImpact(facilities, powerLevel) {
    const updatedFacilities = { ...facilities };
    const facilityLogs = [];
    const penalties = SIMULATION_CONFIG.depletionPenalties;

    if (powerLevel === 0) {
      // Total blackout shuts down greenhouse heating and lab
      ['greenhouse', 'research_lab'].forEach(fId => {
        if (updatedFacilities[fId]) {
          const updated = this.applyConditionDelta(updatedFacilities[fId], penalties.powerDepleted.conditionDelta);
          updatedFacilities[fId] = updated;
          facilityLogs.push({
            facilityId: fId,
            name: updated.name,
            reason: penalties.powerDepleted.reason,
            delta: penalties.powerDepleted.conditionDelta,
            newCondition: updated.condition
          });
        }
      });
    } else if (powerLevel < 40) {
      // Brownout degrades research lab
      if (updatedFacilities.research_lab) {
        const updated = this.applyConditionDelta(updatedFacilities.research_lab, penalties.powerWarning.conditionDelta);
        updatedFacilities.research_lab = updated;
        facilityLogs.push({
          facilityId: 'research_lab',
          name: updated.name,
          reason: penalties.powerWarning.reason,
          delta: penalties.powerWarning.conditionDelta,
          newCondition: updated.condition
        });
      }
    }

    return { updatedFacilities, facilityLogs };
  }
}
