/**
 * LUNA: Mission Survival - NASA DONKI Space Weather Alert Panel
 * Compact, attractive educational NASA telemetry panel embedded in Day 3 Solar Particle Event.
 * Formatted cleanly for children with authentic NASA records and clear simulation notices.
 */
export class NASAAlertPanel {
  /**
   * Generates the small, attractive NASA information panel component
   * @param {Object} alertPackage Output from RadiationAlert.createAlertPackage
   * @returns {HTMLElement} Container
   */
  static render(alertPackage) {
    const container = document.createElement('div');
    container.className = 'nasa-compact-alert-panel';

    const isRealData = (alertPackage.sourceStatus === 'REAL_NASA_DATASET' || alertPackage.sourceStatus === 'LIVE_NASA_DATA');
    const badgeText = isRealData ? '● REAL NASA DATASET' : '● DEMONSTRATION SCENARIO';
    const badgeClass = isRealData ? 'nasa-badge-real' : 'nasa-badge-demo';

    container.innerHTML = `
      <div class="nasa-compact-header">
        <div class="nasa-compact-brand">
          <span class="nasa-compact-logo">🛰️ NASA DONKI</span>
          <span class="nasa-compact-tag">SPACE WEATHER ALERT</span>
        </div>
        <span class="nasa-compact-status ${badgeClass}">${badgeText}</span>
      </div>

      <div class="nasa-compact-grid">
        <div class="nasa-compact-item">
          <span class="nasa-compact-label">📅 Solar Event Date:</span>
          <span class="nasa-compact-val text-gold">${alertPackage.formattedDate || alertPackage.eventTime}</span>
        </div>
        <div class="nasa-compact-item">
          <span class="nasa-compact-label">⚡ Event Type:</span>
          <span class="nasa-compact-val text-cyan">${alertPackage.eventType || 'Solar Energetic Particle (SEP)'}</span>
        </div>
        <div class="nasa-compact-item">
          <span class="nasa-compact-label">🛰️ Source:</span>
          <span class="nasa-compact-val">NASA DONKI (api.nasa.gov)</span>
        </div>
        <div class="nasa-compact-item">
          <span class="nasa-compact-label">🔬 Detector:</span>
          <span class="nasa-compact-val">${alertPackage.instruments || 'GOES Proton Sensor'}</span>
        </div>
      </div>

      <!-- Short Child-Friendly Explanation -->
      <div class="nasa-kid-box">
        <span class="nasa-kid-icon">☀️💨</span>
        <p class="nasa-kid-text">
          ${alertPackage.educationalExplainer?.whatIsSep || 'The Sun had a huge eruption, shooting high-speed proton particles toward the Moon!'}
          ${alertPackage.educationalExplainer?.whyMoonMatters || 'Because the Moon has no air or magnetic shield, we must shelter inside the base bunker!'}
        </p>
      </div>

      <!-- Clear Indication of Simulated Gameplay -->
      <div class="nasa-sim-disclaimer">
        ℹ️ <strong>Scientific Accuracy Notice:</strong> The solar event date and particle detection are real NASA records. Astronaut health changes and shelter protection effectiveness are <strong>simulated gameplay</strong>.
      </div>

      <div class="nasa-portal-row">
        <a href="${alertPackage.sourceUrl || 'https://ccmc.gsfc.nasa.gov/DONKI/'}" target="_blank" rel="noopener noreferrer" class="nasa-portal-link">
          Explore NASA DONKI Portal ↗
        </a>
      </div>
    `;

    return container;
  }
}
