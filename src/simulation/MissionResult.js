/**
 * LUNA: Mission Survival - Final Expedition Evaluation Engine
 * Evaluates performance after Sol 7 and generates a comprehensive mission rating.
 */
export class MissionResult {
  /**
   * Computes the final mission outcome and performance grade
   * @param {Object} gameState Full GameState snapshot
   * @returns {Object} Comprehensive evaluation debrief
   */
  static evaluate(gameState) {
    const { resources, crew, facilities, decisionHistory, currentDay } = gameState;

    // Check survival criteria
    const allCrewUnconscious = Object.values(crew).every(a => a.health <= 0);
    const anyResourceDepleted = Object.values(resources).some(r => r <= 0);
    const averageHealth = Math.round(Object.values(crew).reduce((acc, c) => acc + c.health, 0) / 4);
    const averageFacility = Math.round(Object.values(facilities).reduce((acc, f) => acc + f.condition, 0) / 5);
    const averageResource = Math.round(Object.values(resources).reduce((acc, r) => acc + r, 0) / 4);

    let status = 'Mission Successful';
    let statusClass = 'success';
    let outcomeTitle = 'MISSION ACCOMPLISHED! 🏆';
    let grade = 'Rank A';
    let narrative = '';

    if (allCrewUnconscious || (anyResourceDepleted && averageHealth < 30)) {
      status = 'Mission Failed';
      statusClass = 'failed';
      outcomeTitle = 'EXPEDITION ABORTED / CRITICAL EMERGENCY ❌';
      grade = 'Rank F';
      narrative = 'Colony life-support suffered catastrophic failure before expedition completion. Emergency Earth rescue shuttle dispatched.';
    } else if (anyResourceDepleted || averageHealth < 50 || averageFacility < 50) {
      status = 'Mission Successful with Warnings';
      statusClass = 'warning';
      outcomeTitle = 'MISSION COMPLETED WITH ADVERSITY ⚠️';
      grade = 'Rank B';
      narrative = 'The four astronauts persevered through intense lunar hardships. The base sustained noticeable equipment wear, but all crew survived the 7 simulated days.';
    } else if (averageHealth >= 85 && averageResource >= 60 && averageFacility >= 75) {
      status = 'Mission Successful';
      statusClass = 'exceptional';
      outcomeTitle = 'OUTSTANDING LUNAR EXPEDITION! 🌟';
      grade = 'Rank S';
      narrative = 'Exemplary command performance! Outpost LUNA-01 maintained pristine life-support, healthy astronaut vitals, and operational facilities across all seven simulated days.';
    } else {
      status = 'Mission Successful';
      statusClass = 'success';
      outcomeTitle = 'MISSION ACCOMPLISHED! 🏆';
      grade = 'Rank A';
      narrative = 'Solid commander leadership. All four astronauts return home safely with full geological data and intact facilities.';
    }

    return {
      status,
      statusClass,
      outcomeTitle,
      grade,
      narrative,
      daysSurvived: currentDay >= 7 ? 7 : currentDay,
      stats: {
        averageHealth,
        averageFacility,
        averageResource,
        oxygen: resources.oxygen,
        water: resources.water,
        food: resources.food,
        power: resources.power,
      },
      crewSummary: Object.values(crew).map(c => ({
        name: c.name,
        role: c.role,
        health: c.health,
        status: c.status
      })),
      facilitySummary: Object.values(facilities).map(f => ({
        name: f.name,
        condition: f.condition,
        status: f.status
      })),
      totalDecisions: decisionHistory.length,
      nasaContribution: "Day 3 Space-Weather response utilized authentic NASA DONKI Solar Energetic Particle telemetry."
    };
  }
}
