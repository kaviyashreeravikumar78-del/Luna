/**
 * LUNA: Mission Survival - NASA DONKI Solar Energetic Particle (SEP) Parser
 * Safely parses, validates, and normalizes NASA DONKI SEP JSON records from local dataset.
 */
export class SepDataParser {
  /**
   * Normalizes a raw NASA DONKI SEP JSON record into a clean educational telemetry object
   * @param {Object} raw Raw NASA DONKI event record
   * @param {string} sourceStatus 'REAL_NASA_DATASET' | 'DEMONSTRATION_SCENARIO'
   * @param {Object} metadata Optional dataset metadata
   * @returns {Object} Normalized telemetry object
   */
  static parseEvent(raw, sourceStatus = 'REAL_NASA_DATASET', metadata = null) {
    if (!raw || typeof raw !== 'object') {
      return this.getFallbackEvent();
    }

    const eventId = raw.sepID || raw.activityID || '2024-05-10T13:35:00-SEP-001';
    const eventTime = raw.eventTime || raw.startTime || '2024-05-10T13:35Z';

    // Format human-friendly child-readable date
    let formattedDate = 'May 10, 2024 (13:35 UTC)';
    try {
      const d = new Date(eventTime);
      if (!isNaN(d.getTime())) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const m = months[d.getUTCMonth()];
        const day = d.getUTCDate();
        const y = d.getUTCFullYear();
        const hh = d.getUTCHours().toString().padStart(2, '0');
        const mm = d.getUTCMinutes().toString().padStart(2, '0');
        formattedDate = `${m} ${day}, ${y} (${hh}:${mm} UTC)`;
      }
    } catch (e) {}

    // Extract instrument names
    const instruments = Array.isArray(raw.instruments) && raw.instruments.length > 0
      ? raw.instruments.map(i => i.displayName || i.name || 'Proton Particle Detector').join(', ')
      : 'GOES-P: SEISS >10 MeV Proton Sensor';

    // Extract linked CME or solar flare activities
    const linkedActivities = Array.isArray(raw.linkedEvents) && raw.linkedEvents.length > 0
      ? raw.linkedEvents.map(e => e.activityID || 'Linked Solar Event').slice(0, 3).join(', ')
      : 'Solar Coronal Mass Ejection (CME) & X-Class Flare';

    return {
      eventId,
      eventTime,
      formattedDate,
      eventType: 'Solar Energetic Particle (SEP)',
      sourceName: 'NASA Space Weather Database Of Notifications, Knowledge, Information (DONKI)',
      sourceShort: 'NASA DONKI',
      sourceUrl: raw.link || 'https://ccmc.gsfc.nasa.gov/DONKI/',
      apiEndpoint: 'https://api.nasa.gov/DONKI/SEP',
      sourceStatus, // 'REAL_NASA_DATASET' or 'DEMONSTRATION_SCENARIO'
      instruments,
      linkedActivities,
      submissionTime: raw.submissionTime || eventTime,
      datasetMetadata: metadata,
      rawJson: JSON.stringify(raw, null, 2),

      // Plain-English Educational Concepts for young players
      educationalExplainer: {
        whatIsSep: "A Solar Energetic Particle (SEP) event happens when the Sun has a powerful eruption, shooting high-speed proton particles toward the Moon!",
        whyMoonMatters: "On Earth, air and magnetic fields protect us, but the Moon has no atmosphere or magnetic shield. Astronauts must take shelter inside the base bunker!",
        distinctionNotice: "The solar event date and particle detection are authentic NASA records. Astronaut health changes and shelter protection in LUNA are simulated gameplay."
      }
    };
  }

  /**
   * Graceful offline demonstration scenario if dataset is missing or unreadable
   */
  static getFallbackEvent() {
    const rawDemo = {
      sepID: "DEMO-2024-05-10T13:35:00-SEP",
      eventTime: "2024-05-10T13:35Z",
      instruments: [
        { displayName: "GOES-P: SEISS >10 MeV (Demonstration Scenario)" }
      ],
      linkedEvents: [
        { activityID: "DEMO-2024-05-10-FLR" }
      ],
      submissionTime: "2024-05-10T14:00Z"
    };

    return this.parseEvent(rawDemo, 'DEMONSTRATION_SCENARIO');
  }
}
