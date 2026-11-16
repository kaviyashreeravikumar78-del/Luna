import { orbitVoice } from '../audio/OrbitVoice.js';

/**
 * LUNA: Mission Survival - ORBIT Robot Science & Theory Debrief
 * Displays an animated robotic dialogue after completing each level,
 * explaining the real-world lunar science, physics, and engineering theory
 * with authentic robotic voice narration.
 */
export class OrbitScienceDebriefModal {
  constructor() {
    this.element = this.createDOM();
    document.body.appendChild(this.element);
    this.currentSol = 1;
    this.onProceedCallback = null;
  }

  createDOM() {
    const overlay = document.createElement('div');
    overlay.id = 'orbit-science-debrief-modal';
    overlay.className = 'orbit-debrief-overlay';
    overlay.style.display = 'none';

    overlay.innerHTML = `
      <div class="orbit-debrief-card">
        <!-- Robot Header with Animated ORBIT Avatar -->
        <div class="orbit-debrief-robot-row">
          <div class="orbit-avatar-frame">
            <div class="orbit-avatar-antenna">
              <span class="orbit-antenna-bulb"></span>
            </div>
            <div class="orbit-avatar-body">
              <div class="orbit-avatar-face">
                <span class="orbit-eye orbit-eye-left"></span>
                <span class="orbit-eye orbit-eye-right"></span>
                <div class="orbit-mouth-wave">
                  <span></span><span></span><span></span><span></span><span></span>
                </div>
              </div>
            </div>
          </div>

          <div class="orbit-robot-meta">
            <div class="orbit-debrief-tag">
              <span>🤖 ORBIT SCIENCE DEBRIEF</span>
              <span class="orbit-sol-pill" id="debrief-sol-tag">SOL 1 COMPLETE</span>
            </div>
            <h2 class="orbit-debrief-title" id="debrief-title">How Solar Power Works on the Moon!</h2>
            <div class="orbit-voice-status" id="debrief-voice-status">
              <span class="voice-pulse-dot"></span>
              <span id="debrief-voice-text">ORBIT is speaking...</span>
            </div>
          </div>
        </div>

        <!-- Science Explanation Body -->
        <div class="orbit-debrief-body">
          <div class="orbit-speech-bubble">
            <p id="debrief-text" class="orbit-speech-text">
              Loading science debrief...
            </p>
          </div>

          <!-- Did You Know? Facts Grid -->
          <div class="orbit-facts-grid" id="debrief-facts-grid">
            <!-- Dynamically populated -->
          </div>
        </div>

        <!-- Action Footer -->
        <div class="orbit-debrief-footer">
          <button id="btn-debrief-replay" class="btn-debrief-replay" title="Listen to ORBIT explain again">
            <span>🔁 Hear Again</span>
          </button>
          <button id="btn-debrief-proceed" class="btn-debrief-proceed">
            <span id="debrief-btn-text">Continue to Sol 2 🚀</span>
          </button>
        </div>
      </div>
    `;

    // Button event listeners
    overlay.querySelector('#btn-debrief-replay').addEventListener('click', () => {
      this.replayVoice();
    });

    overlay.querySelector('#btn-debrief-proceed').addEventListener('click', () => {
      this.hide();
      if (this.onProceedCallback) {
        this.onProceedCallback();
      }
    });

    return overlay;
  }

  getTheoryData(sol) {
    const theories = {
      1: {
        title: "⚡ How Solar Power Works on the Moon!",
        solTag: "SOL 1 COMPLETE",
        nextText: "Continue to Sol 2 ➔",
        speechText: "Beep boop! Commander, you cleared the dust and powered up our solar array! Here is the real NASA science: The Moon has zero atmosphere and no clouds, so unfiltered space sunlight is thirty percent stronger than on Earth! But the Moon rotates very slowly: daytime lasts fourteen Earth days of blazing sunshine, followed by fourteen Earth days of freezing darkness at minus one hundred and thirty degrees! By cleaning our panels, you allowed the cells to store clean electricity into high-capacity batteries so our base stays warm through the long lunar night!",
        facts: [
          { icon: "☀️", label: "Supercharged Solar Flux", text: "Without clouds or air, photovoltaic cells capture 1,361 Watts per square meter of pure solar energy." },
          { icon: "🧹", label: "Apollo Dust Problem", text: "Lunar dust (regolith) is razor-sharp glass created by meteor impacts. NASA uses Electrodynamic Dust Shields to shake it off!" },
          { icon: "🔋", label: "The 14-Day Lunar Night", text: "Batteries must store enough power to sustain outpost life support through 354 hours of continuous freezing darkness." }
        ]
      },
      2: {
        title: "💧 Why Crater Ice is Rocket Fuel for Deep Space!",
        solTag: "SOL 2 COMPLETE",
        nextText: "Continue to Sol 3 ➔",
        speechText: "Whoo-hoo! Commander, your rover expedition found real water ice in the dark crater! Here is the science: At the Moon's South Pole, craters like Shackleton have rims that block all sunlight. Inside these permanent shadows, temperatures drop to minus two hundred and thirty degrees Celsius—colder than the surface of Pluto! NASA missions like LCROSS and the VIPER rover proved that ancient comets deposited millions of tons of water ice here. We melt it for crew drinking water, and split it with electricity into liquid hydrogen and oxygen—actual rocket fuel to fly astronauts to Mars!",
        facts: [
          { icon: "❄️", label: "Permanent Shadow Craters", text: "Sunlight never reaches crater bottoms, preserving pure comet water ice frozen for over two billion years." },
          { icon: "🚀", label: "In-Situ Rocket Fuel", text: "Electrolysis splits lunar H2O into liquid hydrogen fuel and liquid oxygen oxidizer right on the Moon!" },
          { icon: "🚜", label: "VIPER & LCROSS Missions", text: "NASA kinetic impactors and robotic prospector rovers map water ice concentrations beneath the lunar surface." }
        ]
      },
      3: {
        title: "☀️ Real NASA DONKI Space Weather & Radiation Shelters!",
        solTag: "SOL 3 COMPLETE",
        nextText: "Continue to Sol 4 ➔",
        speechText: "Alarm cleared! All four astronauts are safely inside the shielded bunker! Here is the real NASA dataset science behind today's mission: We linked directly to NASA's Space Weather Database of Notifications, Knowledge, and Information—called DONKI! On May 10, 2024, NASA's ACE and SOHO spacecraft recorded one of the most powerful coronal mass ejections in twenty years! Earth's magnetic field deflects these particles, creating polar auroras. But the Moon has NO global magnetic shield! That is why lunar astronauts shelter under meters of packed lunar regolith and electromagnetic shields to absorb cosmic radiation!",
        facts: [
          { icon: "🛰️", label: "Verified NASA DONKI Telemetry", text: "Real space weather event 2024-05-09T13:59:00-SEP-001 measured by the ACE/EPAM satellite instrument at 15.8 to 39.8 MeV." },
          { icon: "🛡️", label: "Lunar Regolith Shielding", text: "Piling 2 to 3 meters of lunar dirt over titanium habitat domes blocks harmful galactic cosmic rays and solar energetic protons." },
          { icon: "⚡", label: "No Moon Magnetic Field", text: "Unlike Earth, the Moon lacks a liquid iron core dynamo, leaving the surface exposed to direct solar radiation bursts." }
        ]
      },
      4: {
        title: "🌱 How Plants Grow on the Moon Without Soil!",
        solTag: "SOL 4 COMPLETE",
        nextText: "Continue to Sol 5 ➔",
        speechText: "Yum! Fresh lunar strawberries, carrots, and wheat for dinner! Did you know space plants do not need soil? We use hydroponics! Plant roots sit directly in water enriched with liquid nitrogen, phosphorus, and potassium. Specialized LED grow lights emit tuned purple and red wavelengths to drive photosynthesis at maximum efficiency. Even better: our astronaut crew exhales carbon dioxide that the plants need, and the plants produce fresh breathable oxygen for the crew—a perfect closed-loop ecosystem!",
        facts: [
          { icon: "💧", label: "Hydroponic Nutrient Film", text: "Grows vibrant crops using 90% less water than traditional Earth farming, with zero soil required." },
          { icon: "💡", label: "NASA Veggie & APH", text: "Tested aboard the International Space Station, custom LED wavelengths accelerate plant growth by 200%." },
          { icon: "🔄", label: "Closed-Loop Symbiosis", text: "Crew respiration provides CO2 for photosynthesis; plants synthesize fresh oxygen and nutrients for the astronauts." }
        ]
      },
      5: {
        title: "🛡️ Habitat Safety, Micrometeoroids & ECLSS Life Support!",
        solTag: "SOL 5 COMPLETE",
        nextText: "Continue to Sol 6 ➔",
        speechText: "Pressure stabilized! Both air leaks sealed and normal atmosphere restored! Here is why airlocks and hulls are critical: In space, tiny micrometeoroids travel at twenty kilometers per second—ten times faster than a rifle bullet! NASA spacecraft use multi-layered Whipple bumpers that shatter and absorb space debris. Our Environmental Control and Life Support System (ECLSS) monitors atmospheric pressure, scrubs exhaled carbon dioxide, and recycles ninety-eight percent of all moisture into pure water!",
        facts: [
          { icon: "☄️", label: "Whipple Bumper Shields", text: "Spaced layers of Kevlar and aluminum shatter hypervelocity micrometeoroids before they puncture the pressure cabin." },
          { icon: "💨", label: "ECLSS Life Support", text: "Maintains 101.3 kPa cabin pressure, 21% oxygen, and removes trace toxic contaminants around the clock." },
          { icon: "🚨", label: "Fast-Acting Sealants", text: "Airtight polymer foams seal puncture holes immediately to prevent explosive cabin depressurization." }
        ]
      },
      6: {
        title: "📡 Communicating Across 384,000 km of Deep Space!",
        solTag: "SOL 6 COMPLETE",
        nextText: "Continue to Sol 7 ➔",
        speechText: "Loud and clear! Signal locked with Earth! Here is how our deep space radio dish works: Earth is nearly four hundred thousand kilometers away! Radio and laser waves travel at the speed of light—three hundred thousand kilometers every second—which means every message takes one point three seconds to cross the void. Our curved parabolic dish focuses microwaves into a tight beam aimed directly at NASA's Deep Space Network dishes in California, Spain, and Australia, or connects via NASA's experimental Deep Space Optical Communications laser!",
        facts: [
          { icon: "⚡", label: "1.28-Second Light Delay", text: "Radio waves travel at 300,000 km/s, creating a perceptible 2.6-second round-trip communication lag with Earth." },
          { icon: "🛰️", label: "NASA Deep Space Network", text: "Giant 70-meter parabolic antennas at Goldstone, Madrid, and Canberra provide continuous 24/7 planetary tracking." },
          { icon: "🔬", label: "Laser Optical Uplink (DSOC)", text: "NASA's newest laser transmitters beam ultra-high-definition scientific telemetry at speeds exceeding 267 Mbps!" }
        ]
      },
      7: {
        title: "🏆 Artemis Base Camp: Humanity's Permanent Foothold!",
        solTag: "MISSION COMPLETE",
        nextText: "View Final Commander Certificate 🏆",
        speechText: "Outstanding leadership Commander! You survived all seven days and proved that Outpost LUNA-01 is fully sustainable! What you accomplished is the official roadmap for NASA's Artemis program: establishing permanent human settlements at the lunar South Pole! By mastering solar generation, crater ice mining, space radiation sheltering, hydroponic food production, life-support maintenance, and interplanetary communications, you demonstrated that humanity can thrive on another world—and unlocked the gateway to planet Mars!",
        facts: [
          { icon: "🌕", label: "Artemis Accords & Base Camp", text: "An international coalition establishing permanent, peaceful, sustainable research bases on the Moon." },
          { icon: "⛏️", label: "ISRU (In-Situ Resource Utilization)", text: "Using local lunar regolith and ice to build bases and produce fuel eliminates costly resupply launches from Earth." },
          { icon: "🔴", label: "Gateway to Planet Mars", text: "Every survival technology tested on Outpost LUNA-01 directly prepares humanity for the 3-year crewed mission to Mars!" }
        ]
      }
    };

    return theories[sol] || theories[1];
  }

  show(sol, onProceed) {
    this.currentSol = sol;
    this.onProceedCallback = onProceed;

    const data = this.getTheoryData(sol);

    // Populate DOM elements
    this.element.querySelector('#debrief-sol-tag').textContent = data.solTag;
    this.element.querySelector('#debrief-title').textContent = data.title;
    this.element.querySelector('#debrief-text').textContent = data.speechText;
    this.element.querySelector('#debrief-btn-text').textContent = data.nextText;

    // Populate Facts
    const factsGrid = this.element.querySelector('#debrief-facts-grid');
    factsGrid.innerHTML = data.facts.map(f => `
      <div class="orbit-fact-card">
        <span class="orbit-fact-icon">${f.icon}</span>
        <div class="orbit-fact-content">
          <strong class="orbit-fact-label">${f.label}</strong>
          <span class="orbit-fact-desc">${f.text}</span>
        </div>
      </div>
    `).join('');

    // Update voice indicator
    const voiceStatus = this.element.querySelector('#debrief-voice-status');
    const voiceText = this.element.querySelector('#debrief-voice-text');
    voiceStatus.style.display = 'flex';
    voiceText.textContent = 'ORBIT is speaking...';

    // Show modal with animation
    this.element.style.display = 'flex';

    // Speak real voice aloud
    this.currentSpeechText = data.speechText;
    this.replayVoice();
  }

  replayVoice() {
    if (!this.currentSpeechText) return;

    const voiceStatus = this.element.querySelector('#debrief-voice-status');
    const voiceText = this.element.querySelector('#debrief-voice-text');
    voiceStatus.style.display = 'flex';
    voiceText.textContent = 'ORBIT is speaking...';

    orbitVoice.speak(this.currentSpeechText, () => {
      voiceText.textContent = 'Voice debrief completed ✅';
      setTimeout(() => {
        if (voiceStatus) voiceStatus.style.opacity = '0.7';
      }, 1000);
    });
  }

  hide() {
    orbitVoice.stop();
    this.element.style.display = 'none';
  }
}
