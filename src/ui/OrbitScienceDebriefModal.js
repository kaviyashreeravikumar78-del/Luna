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
        speechText: "Beep boop! Commander, you plugged in our solar array! Here is the science: The Moon has no atmosphere or clouds, so sunlight is thirty percent stronger than on Earth! But here is the challenge: the Moon rotates so slowly that daytime lasts fourteen Earth days of pure sunshine, followed by fourteen Earth days of freezing darkness! By plugging in our heavy cables, you allowed our solar panels to charge giant lithium batteries so our base stays warm and powered through the long lunar night!",
        facts: [
          { icon: "☀️", label: "Supercharged Sunlight", text: "Without air or clouds, photovoltaic cells turn unfiltered space sunlight directly into clean electricity." },
          { icon: "🔋", label: "The 14-Day Night", text: "Batteries must store enough power to survive 354 hours of continuous freezing lunar darkness (-130°C)." }
        ]
      },
      2: {
        title: "💧 Why Water Leaks Are Deadly in the Lunar Vacuum!",
        solTag: "SOL 2 COMPLETE",
        nextText: "Continue to Sol 3 ➔",
        speechText: "Chirp! Fantastic work sealing that leaking pipe! Here is why that was critical: In the vacuum of space, there is zero air pressure! Liquid water cannot exist outside—it boils and vaporizes into gas almost instantly! On our lunar base, every single drop is precious. We use closed-loop recyclers to purify ninety-eight percent of our water from breath and moisture. Fixing that leak saved our drinking water and our oxygen supply!",
        facts: [
          { icon: "🌌", label: "Vacuum Evaporation", text: "At zero atmospheric pressure, liquid water boils instantly even at freezing temperatures." },
          { icon: "🔄", label: "Closed-Loop Recycling", text: "Water is also split by electricity into hydrogen and breathable oxygen for our astronaut suits!" }
        ]
      },
      3: {
        title: "☀️ How Real NASA Solar Storms & Moon Shelters Work!",
        solTag: "SOL 3 COMPLETE",
        nextText: "Continue to Sol 4 ➔",
        speechText: "Alarm cleared! All astronauts are safe in the bunker! Here is the science behind our NASA alert: On May 10, 2024, NASA satellites detected real Solar Energetic Particles shooting from the Sun at near the speed of light! Earth has an invisible magnetic field that protects us, creating beautiful northern lights. But the Moon has no magnetic field! That is why we built our bunker with thick titanium and moon soil—it acts like heavy armor to absorb the radiation!",
        facts: [
          { icon: "🛰️", label: "Real NASA Telemetry", text: "Recorded by NOAA & NASA GOES satellites during the historic May 2024 Solar Cycle 25 storm." },
          { icon: "🛡️", label: "Moon Soil Armor", text: "Packing lunar dirt (regolith) over our habitat blocks dangerous cosmic rays and energetic protons." }
        ]
      },
      4: {
        title: "🌱 How Plants Grow on the Moon Without Soil!",
        solTag: "SOL 4 COMPLETE",
        nextText: "Continue to Sol 5 ➔",
        speechText: "Yum! Fresh space strawberries and carrots! Did you know plants on the Moon do not need dirt? We use hydroponics! Plant roots sit directly in water enriched with liquid minerals like nitrogen and potassium. Special LED grow lights give them the exact purple and red light waves they need to grow. Even better: plants breathe in the carbon dioxide our astronauts exhale, and make fresh oxygen for us to breathe!",
        facts: [
          { icon: "💧", label: "Hydroponic Farming", text: "Grows crops using 90% less water than traditional Earth farming, with zero soil required." },
          { icon: "🔄", label: "Space Symbiosis", text: "Astronauts exhale carbon dioxide that plants need, and plants produce fresh oxygen for astronauts!" }
        ]
      },
      5: {
        title: "📡 Talking Across 384,000 Kilometers of Space!",
        solTag: "SOL 5 COMPLETE",
        nextText: "Continue to Sol 6 ➔",
        speechText: "Loud and clear! Signal locked with Earth! Here is how our radio dish works: Earth is nearly four hundred thousand kilometers away! Radio waves travel at the speed of light—three hundred thousand kilometers every second—so a message takes about one point three seconds to reach Earth. By curving our dish like a mirror, all the radio waves focus into one laser-sharp beam aimed straight at NASA's Deep Space Network!",
        facts: [
          { icon: "⚡", label: "Speed of Light Delay", text: "Radio signals take 1.28 seconds to travel from the Moon to Earth at lightspeed." },
          { icon: "🎯", label: "Parabolic Focusing", text: "Curved dish reflectors focus invisible microwave signals so they do not scatter into deep space." }
        ]
      },
      6: {
        title: "🚜 Why Water Ice in Dark Moon Craters is Rocket Fuel!",
        solTag: "SOL 6 COMPLETE",
        nextText: "Continue to Sol 7 ➔",
        speechText: "Whoo-hoo! That rover expedition was epic! You found real water ice! Deep inside craters at the Moon's South Pole, the Sun never shines, and temperatures drop to minus two hundred and forty degrees Celsius! This ancient ice has stayed frozen for billions of years. We melt it for drinking water, and we use electricity to split it into hydrogen and oxygen—which is actual rocket fuel to fly astronauts to Mars!",
        facts: [
          { icon: "❄️", label: "Permanent Shadow Craters", text: "South Pole craters like Shackleton block all sunlight, preserving comet ice for billions of years." },
          { icon: "🚀", label: "Lunar Rocket Fuel", text: "Splitting water into liquid hydrogen and oxygen creates clean rocket propellant right on the Moon!" }
        ]
      },
      7: {
        title: "🏆 Humanity's Permanent Foothold on the Moon!",
        solTag: "MISSION COMPLETE",
        nextText: "View Final Commander Report 🏆",
        speechText: "Congratulations Commander! You survived all seven days! What you accomplished is the blueprint for real human exploration! By proving that four astronauts can generate power, recycle water, shelter from solar radiation, grow fresh crops, communicate with Earth, and mine lunar resources, Outpost LUNA-01 proves that humans can live on another world permanently! Next stop: planet Mars!",
        facts: [
          { icon: "🌕", label: "Artemis Generation", text: "NASA's Artemis program plans to establish permanent sustainable human colonies at the lunar South Pole." },
          { icon: "🔴", label: "Stepping Stone to Mars", text: "Life-support technologies mastered on the Moon will take humanity on the first crewed journey to Mars!" }
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
