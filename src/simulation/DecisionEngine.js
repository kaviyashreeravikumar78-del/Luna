import { ResourceEngine } from './ResourceEngine.js';
import { CrewHealthEngine } from './CrewHealthEngine.js';
import { FacilityEngine } from './FacilityEngine.js';

/**
 * LUNA: Mission Survival - Decision & Consequence Resolution Engine
 * Applies player decisions to the game state deterministically and audits all outcomes.
 */
export class DecisionEngine {
  /**
   * Applies a player's decision to current resources, facilities, and crew
   * @param {Object} event Current day's mission event definition
   * @param {string} decisionId Selected decision ID ('choice_1_a', etc.)
   * @param {Object} currentState { resources, facilities, crew }
   * @returns {Object} { updatedResources, updatedFacilities, updatedCrew, resultSummary }
   */
  static applyDecision(event, decisionId, currentState) {
    const decision = event.decisions.find(d => d.id === decisionId);
    if (!decision) {
      throw new Error(`Invalid decision ID: ${decisionId} for event ${event.id}`);
    }

    const { consequences } = decision;

    // 1. Update Resources
    const updatedResources = { ...currentState.resources };
    const resourceChanges = [];
    if (consequences.resources) {
      Object.entries(consequences.resources).forEach(([key, delta]) => {
        const prev = updatedResources[key] ?? 100;
        const next = ResourceEngine.clamp(prev + delta);
        updatedResources[key] = next;
        resourceChanges.push({
          resource: key,
          prev,
          next,
          delta: next - prev
        });
      });
    }

    // 2. Update Facilities
    const updatedFacilities = { ...currentState.facilities };
    const facilityChanges = [];
    if (consequences.facilities) {
      Object.entries(consequences.facilities).forEach(([facId, delta]) => {
        if (updatedFacilities[facId]) {
          const prev = updatedFacilities[facId].condition ?? 100;
          const updated = FacilityEngine.applyConditionDelta(updatedFacilities[facId], delta);
          updatedFacilities[facId] = updated;
          facilityChanges.push({
            facilityId: facId,
            name: updated.name,
            prev,
            next: updated.condition,
            delta: updated.condition - prev,
            status: updated.status
          });
        }
      });
    }

    // 3. Update Crew Health
    const updatedCrew = { ...currentState.crew };
    const crewChanges = [];
    if (Array.isArray(consequences.crew)) {
      consequences.crew.forEach(cImpact => {
        if (updatedCrew[cImpact.id]) {
          const { updated, logEntry } = CrewHealthEngine.applyHealthDelta(
            updatedCrew[cImpact.id],
            cImpact.healthDelta,
            cImpact.reason
          );
          updatedCrew[cImpact.id] = updated;
          crewChanges.push(logEntry);
        }
      });
    }

    // Structured Result Summary
    const resultSummary = {
      eventTitle: event.title,
      sol: event.sol,
      decisionId: decision.id,
      decisionLabel: decision.label,
      tag: decision.tag,
      logText: consequences.logText,
      resourceChanges,
      facilityChanges,
      crewChanges,
      timestamp: new Date().toISOString()
    };

    return {
      updatedResources,
      updatedFacilities,
      updatedCrew,
      resultSummary
    };
  }
}
