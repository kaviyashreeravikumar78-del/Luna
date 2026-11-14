/**
 * LUNA: Mission Survival - Radiation Alert Integrator
 * Combines authentic NASA DONKI space-weather data with simulated educational lunar gameplay.
 */
export class RadiationAlert {
  /**
   * Prepares the Day 3 NASA Space Weather Alert package
   * @param {Object} sepTelemetry Parsed telemetry from donkiService
   * @returns {Object} Structured educational alert package
   */
  static createAlertPackage(sepTelemetry) {
    const isReal = (sepTelemetry.sourceStatus === 'REAL_NASA_DATASET' || sepTelemetry.sourceStatus === 'LIVE_NASA_DATA');

    return {
      title: "🚨 NASA SPACE WEATHER ALERT: Solar Energetic Particle (SEP) Event",
      sol: 3,
      category: "Space Weather Telemetry",
      severity: "High (Simulated Exposure)",
      dataSource: isReal ? "NASA DONKI Database (Verified May 2024 Dataset)" : "NASA DONKI Demonstration Scenario",
      sourceStatus: sepTelemetry.sourceStatus,
      sourceUrl: sepTelemetry.sourceUrl,
      eventId: sepTelemetry.eventId,
      eventTime: sepTelemetry.eventTime,
      formattedDate: sepTelemetry.formattedDate,
      eventType: sepTelemetry.eventType || 'Solar Energetic Particle (SEP)',
      instruments: sepTelemetry.instruments,
      linkedActivities: sepTelemetry.linkedActivities,
      submissionTime: sepTelemetry.submissionTime,
      rawJson: sepTelemetry.rawJson,
      educationalExplainer: sepTelemetry.educationalExplainer,
    };
  }
}
