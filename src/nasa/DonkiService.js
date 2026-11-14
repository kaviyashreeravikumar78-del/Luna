import { SepDataParser } from './SepDataParser.js';
import nasaSepDataset from '../data/nasa_sep_events.json' with { type: 'json' };

/**
 * LUNA: Mission Survival - NASA DONKI Service
 * Provides genuine NASA Space Weather Solar Energetic Particle (SEP) data
 * sourced from the local JSON dataset (src/data/nasa_sep_events.json) for 100% offline reliability.
 */
export class DonkiService {
  constructor() {
    this.dataset = nasaSepDataset;
    this.cachedData = null;
  }

  /**
   * Retrieves an authentic NASA DONKI SEP record from the local dataset
   * @returns {Object} Normalized telemetry data
   */
  getSepDatasetEvent() {
    if (this.cachedData) {
      return this.cachedData;
    }

    try {
      if (this.dataset && Array.isArray(this.dataset.events) && this.dataset.events.length > 0) {
        // Find prominent peak event from May 10, 2024 solar superstorm, or use first record
        const peakEvent = this.dataset.events.find(e => e.sepID?.includes('2024-05-10T13:35')) || this.dataset.events[0];
        const parsed = SepDataParser.parseEvent(peakEvent, 'REAL_NASA_DATASET', this.dataset.metadata);
        this.cachedData = parsed;
        return parsed;
      }
    } catch (e) {
      console.warn("Could not parse local NASA dataset:", e);
    }

    // Gracefully handle missing/corrupted dataset without breaking game
    const fallback = SepDataParser.getFallbackEvent();
    this.cachedData = fallback;
    return fallback;
  }

  /**
   * Asynchronous accessor for compatibility with existing async calls
   * @returns {Promise<Object>} Normalized telemetry data
   */
  async fetchSepEvent() {
    return this.getSepDatasetEvent();
  }
}

export const donkiService = new DonkiService();
