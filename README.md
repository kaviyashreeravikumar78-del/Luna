# 🌕 LUNA: Mission Survival
### 🚀 3D Lunar Colony Survival Adventure & NASA DONKI Space Weather Integration

> **NASA International Space Apps Challenge Project**  
> An interactive, child-friendly 3D lunar base survival game built with **Three.js**, **JavaScript**, and **Vite**, powered by authentic **NASA DONKI** space weather observations.

---

## 🌟 Overview

In **LUNA**, players take command of **Outpost LUNA-01** at the lunar South Pole (Shackleton Rim). Over seven simulated lunar days (Sols), players maintain critical life-support systems, guide four astronauts, and respond to dynamic lunar challenges through direct 3D character action and exploration.

### 🎮 Key Features
- **Module 1 – Interactive 3D Lunar Outpost:** 6 fully modeled surface structures (Habitat, 2 Biodomes, Solar Panel Farm, Steerable Parabolic Radio Dish, Geology Lab, and 6-wheel Pathfinder Rover), realistic Moon terrain, rotating Earth, orbiting space station, and drifting cosmic dust particles.
- **Module 2 – Mission Control Center:** Hydrodynamic resource dials (Oxygen, Water, Food, Power), 4 astronaut profiles with real-time animated ECG heartbeat waves, 5 facility telemetry monitors, and a 3D holographic wireframe moon.
- **Module 3 – Action-Based 3D Survival Mini-Games:** Physical character movement and tasks—walk Commander Vance to clear regolith dust from solar panels, fix habitat water pipe micro-leaks, evacuate crew into radiation shelters, cultivate greenhouse crops, align deep space radio arrays, and drive the lunar rover to harvest cryogenic ice.
- **Robot ORBIT Science Debrief with Real Voice:** After every level, robot assistant ORBIT appears with animated optic eyes and real-time audio equalizer mouth waves, speaking the real planetary science theory aloud using browser speech synthesis, accompanied by interactive "Did You Know?" fact pills.

---

## 🛰️ NASA Data & Resource Integration

This project integrates authentic astronomical data from the **NASA Space Weather Database Of Notifications, Knowledge, Information (DONKI)**:
- **API Endpoint:** `https://api.nasa.gov/DONKI/SEP`
- **Solar Energetic Particle (SEP) Record:** `2024-05-10T13:35:00-SEP-001` (Historic Solar Superstorm of May 10, 2024 during Solar Cycle 25 maximum).
- **Detecting Spacecraft & Instrument:** `GOES-P: SEISS Proton Detector` (>10 MeV channels).
- **Mission Integration:** Day 3 (Sol 3: Solar Radiation Storm) alerts the colony to the inbound high-speed proton stream, prompting immediate crew evacuation into the regolith-shielded bunker.
- **Scientific Accuracy & Ethics:** Real astronomical event data is cited with full provenance, while astronaut physiological consequences are clearly labeled as simulated gameplay.

---

## 🛠️ Technology Stack
- **3D Graphics Engine:** Three.js (WebGL)
- **Frontend / Bundler:** Vanilla JavaScript (ES Modules), HTML5, CSS3, Vite
- **Voice & Sound FX:** Web Speech API (`SpeechSynthesis`), Web Audio API (`AudioContext` oscillators)
- **NASA Data Automation:** Node.js fetching script (`scripts/fetch_nasa_sep.js`)

---

## 🚀 Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Start local development server
npm run dev

# 3. Build for production deployment
npm run build
```

Open `http://localhost:5173` in your web browser.

---

## 📄 License
Created for the **NASA Space Apps Challenge**. All NASA datasets are public domain courtesy of NASA/CCMC.
