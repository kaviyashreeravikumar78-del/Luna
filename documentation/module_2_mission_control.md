# LUNA: MISSION SURVIVAL – MODULE 2: MISSION CONTROL
### Comprehensive Technical Documentation & Beginner Guide

---

## 1. What Module 2 Does

**Module 2: Mission Control** extends the LUNA lunar survival simulation by introducing the Commander's central operational command deck. While Module 1 established the physical 3D lunar base environment, Module 2 provides the mission oversight interface where the player monitors:

1. **Colony Vital Resources**: Real-time status, capacities, and supporting facilities for **Oxygen**, **Water**, **Food**, and **Power** (all at 100% *Excellent*).
2. **Expedition Astronaut Personnel**: The health, biometric vitals, current station activities, and background dossiers for all four astronauts (**Dr. Evelyn Vance**, **Marcus Diaz**, **Dr. Aris Thorne**, and **Maya Lin**).
3. **Surface Base Facilities**: The operational condition, engineering specs, and linked resources for the 5 surface buildings, complete with a direct **"View in 3D Colony"** link.
4. **Seven-Day Mission Progression Timeline**: An interactive mission schedule spanning **Sol 1** (*Initial Deployment*, active) through **Sol 7** (*Mission Completion*, locked/upcoming).
5. **Interactive 3D Holographic Display**: A Three.js animated wireframe lunar globe with orbital tracking rings seamlessly embedded inside the Mission Control deck.
6. **ORBIT Mission Control Orientation**: A dedicated 5-step guided tour where the robotic assistant explains every section of the command deck with glowing section highlights.

---

## 2. How Mission Control Connects With Module 1

Mission Control does not replace or duplicate Module 1; it connects directly with the live 3D colony:

```
┌────────────────────────────────────────────────────────┐
│                      GAME INSTANCE                     │
├──────────────────────────┬─────────────────────────────┤
│   MODULE 1: 3D COLONY    │  MODULE 2: MISSION CONTROL  │
│  • Three.js Scene        │  • Command Deck Overlay     │
│  • Procedural Terrain    │  • 3D Holographic Globe     │
│  • 6 3D Buildings        │  • Resource Monitoring Grid │
│  • 4 Animated Astronauts │  • 4 Crew Dossier Cards     │
│  • OrbitControls Camera  │  • 5 Facility Status Cards  │
│  • 3D Pointer Beacon     │  • 7-Day Mission Timeline   │
└────────────┬─────────────┴───────────────▲─────────────┘
             │                             │
             │   "🚀 Mission Control"      │
             ├─────────────────────────────┘
             │
             │   "← Return to 3D Colony"
             │   "🎥 View in 3D Colony"
             ▼
```

1. **State Preservation**: The underlying Three.js scene, animations, and lighting keep running in the background. No page reload or object destruction occurs when entering or leaving Mission Control.
2. **Camera Handoff**: When a player clicks **"View in 3D Colony"** on any facility card in Mission Control (e.g. *Main Habitat*), the application:
   - Dismisses the Mission Control overlay.
   - Restores the 3D Colony camera view.
   - Smoothly glides the camera directly to that facility using `cameraManager.flyTo(...)`.
   - Activates the 3D glowing pointer arrow above the building.
   - Opens the building's Information Panel in the colony.

---

## 3. How the Mission Header Works

The Mission Header (`src/ui/MissionHeader.js`) sits at the top of the command deck, providing high-level situational awareness:

* **Mission Identity**: Displays `LUNA-01: MISSION CONTROL`.
* **Telemetry Badges**:
  - `STATUS: OPERATIONAL` (Glowing green pulse pill)
  - `LOCATION: Lunar South Pole`
  - `TIMELINE: DAY 1 OF 7` (Highlighted in warm gold)
  - `CREW: 4 / 4 HEALTHY` (Highlighted in cyan)
* **Action Buttons**:
  - `🤖 Explain Dashboard`: Replays ORBIT's 5-step Mission Control tutorial.
  - `← Return to 3D Colony`: Smoothly returns the player to the active 3D lunar base.

---

## 4. How Resource Information Is Stored

Resource specifications are decoupled from the UI code and stored in `src/data/resources.js` as an array of structured JavaScript objects:

```javascript
export const RESOURCES_DATA = [
  {
    id: "oxygen",
    name: "Breathable Oxygen",
    icon: "💨",
    percentage: 100,
    status: "Excellent",
    color: "#00E5FF",
    shortDesc: "Fresh breathable air pumped into living quarters and research pods.",
    fullDesc: "Humans cannot survive on the airless Moon without constant, clean oxygen...",
    relatedFacilityId: "habitat",
    relatedFacilityName: "Main Habitat & Greenhouses",
    metrics: [
      { label: "Current Level", value: "100% (21% O2, 78% N2)" },
      { label: "Atmospheric Pressure", value: "101.3 kPa (Sea Level Standard)" },
      { label: "CO2 Scrubbing", value: "Active & 100% Nominal" },
      { label: "Daily Production", value: "+14.2 kg O2 / Day (from Plants)" }
    ]
  },
  // Water, Food, Power...
];
```

---

## 5. How Progress Bars Are Calculated and Displayed

Each resource card features a dynamic HTML/CSS visual progress bar:

```html
<div class="res-progress-track">
  <div class="res-progress-fill" style="width: ${res.percentage}%; background: ${res.color}"></div>
</div>
```

* The container `.res-progress-track` has a rounded pill shape with a semi-transparent dark background.
* The inner bar `.res-progress-fill` has its CSS width bound directly to `${res.percentage}%`.
* A CSS box-shadow (`box-shadow: 0 0 10px currentColor`) creates an authentic neon illumination effect.

---

## 6. How Resource Status Labels Work

Status labels are calculated using a pure helper function `getResourceStatus(percentage)`:

```javascript
export function getResourceStatus(percentage) {
  if (percentage >= 100) return { label: "Excellent", class: "status-excellent" };
  if (percentage >= 70) return { label: "Stable", class: "status-stable" };
  if (percentage >= 40) return { label: "Warning", class: "status-warning" };
  return { label: "Critical", class: "status-critical" };
}
```

* **100%**: *Excellent* (`#06D6A0` emerald green badge).
* **70%–99%**: *Stable* (`#00E5FF` cyan badge).
* **40%–69%**: *Warning* (`#E8B76B` amber badge).
* **Below 40%**: *Critical* (`#FF3B30` red badge).

In Module 2, all four vital resources begin at 100% capacity, giving an initial status of **Excellent**.

---

## 7. How Astronaut Profiles Are Represented

Astronaut profiles are declared in `src/data/crew.js`. Each astronaut has:
* **Identification**: Full name and operational job title.
* **Biometrics**: Health percentage (100%), resting heart rate (bpm), blood oxygen saturation ($SpO_2$), and pressurized suit seal.
* **Activity & Location**: What the astronaut is actively doing and which facility they are currently assigned to.
* **Biography**: A comprehensive background story explaining their training and expertise.
* **Responsibilities**: A bulleted checklist of daily operational duties.

---

## 8. How Crew Health Information Is Displayed

In the Crew Monitoring grid (`src/ui/CrewPanel.js`):
1. **Health Pill**: Displays `100% HEALTH` in glowing emerald text.
2. **Health Track Bar**: A colored meter beneath the avatar displaying health capacity.
3. **Current Activity Callout**: A highlighted sub-panel showing real-time duties:
   - *Dr. Evelyn Vance*: "Supervising colony operations."
   - *Marcus Diaz*: "Inspecting life-support systems."
   - *Dr. Aris Thorne*: "Monitoring greenhouse research."
   - *Maya Lin*: "Checking communication systems."

---

## 9. How Facility Status Is Stored and Displayed

The five monitored facilities are stored in `src/data/facilities.js`:
1. **Main Habitat Hub (HAB-01)**
2. **Photovoltaic Solar Farm**
3. **Hydroponic Bio-Domes**
4. **Lunar Geological Laboratory**
5. **Deep Space Uplink Terminal**

Each card displays:
* Facility name and descriptive emoji icon.
* Operational badge (`● Operational` with pulsating animation).
* Structural condition index (`100% Integrity`).
* Linked survival resource (*e.g. Oxygen, Electrical Power, Food, Water*).
* An interactive **"Inspect →"** button.

---

## 10. How the Seven-Day Timeline Works

The mission timeline (`src/data/timeline.js`) defines the expedition roadmap:

| Sol | Title | Status | Primary Focus |
| :--- | :--- | :--- | :--- |
| **Day 1** | Initial Deployment | **Active (Current)** | Power-up, life-support activation, crew safety check |
| **Day 2** | Base Inspection | Locked / Upcoming | Outer dome inspection, airlock seal tests |
| **Day 3** | Space Weather Monitoring | Locked / Upcoming | Solar wind & cosmic radiation measurements |
| **Day 4** | Resource Management | Locked / Upcoming | Closed-loop filter balancing & oxygen cycle |
| **Day 5** | Research Operations | Locked / Upcoming | Underground crater ice core drilling |
| **Day 6** | External Exploration | Locked / Upcoming | Long-range surface expedition with Pathfinder Rover |
| **Day 7** | Mission Completion | Locked / Upcoming | Final system diagnostics, data archiving & debrief |

### Non-Advancing Interaction:
Clicking any day opens a rich objective modal. Clicking future locked days (Days 2–7) explains the planned tasks but **does not trigger day advancement**, preserving the strict Module 2 scope boundary.

---

## 11. How Clicking Cards Opens Information Panels

All interactive cards (Resources, Crew, Facilities, and Timeline Days) follow an event-driven modal pattern:
1. Each card DOM element has a data attribute (e.g. `data-resource-id="oxygen"`).
2. A click listener catches the event and looks up the corresponding record in the data module.
3. The modal DOM template is populated with the record's details.
4. The modal overlay switches to `display: flex` and the CSS class `.active` triggers smooth hardware-accelerated scaling and fade-in animations:
   ```css
   .mc-modal-overlay.active .mc-modal-card {
     transform: scale(1);
   }
   ```
5. Modals close cleanly when clicking **✕**, **Close**, or clicking outside the card on the backdrop.

---

## 12. How the "View in Colony" Feature Works

Inside any facility's detail modal (e.g. *Main Habitat*), players can click **"🎥 View in 3D Colony →"**:

```javascript
this.modal.querySelector('#fac-modal-view-colony').addEventListener('click', () => {
  if (this.currentFacilityId && this.options.onViewInColony) {
    this.closeModal();
    this.options.onViewInColony(this.currentFacilityId);
  }
});
```

When clicked, the handler in `src/game/Game.js`:
1. Hides the Mission Control deck: `this.missionControl.hide()`.
2. Switches the UI state to the 3D Colony: `this.navigation.switchScreen('colony')`.
3. Coordinates the camera tween: `this.cameraManager.flyTo(bData.cameraView.position, bData.cameraView.target, 1200)`.
4. Spawns the 3D glowing down-arrow pointer and halo ring above the target building: `this.interaction.highlightBuilding(facilityId)`.
5. Opens the colony information panel: `this.infoPanel.show(facilityId)`.

---

## 13. How ORBIT's Mission Control Tutorial Works

The robotic assistant ORBIT provides a dedicated 5-step tutorial in `src/ui/MissionControlOrbitGuide.js`:

1. **Step 1**: *Welcome to Mission Control!* (Highlights top header, mission identity, and Day 1).
2. **Step 2**: *Vital Colony Resources* (Highlights the 4 resource cards).
3. **Step 3**: *Your Astronaut Crew* (Highlights the 4 crew profile cards).
4. **Step 4**: *Base Facilities & 3D Link* (Highlights the facility monitoring grid).
5. **Step 5**: *Seven-Day Mission Timeline* (Highlights the 7-day progression track).

### Animated Section Highlights:
During each step, the corresponding section receives the `.mc-tutorial-highlighted` CSS class, which adds a glowing cyan animated border and scrolls the section smoothly into the center of the screen.

### Persistence:
On completion, `localStorage.setItem('luna_mc_tutorial_completed', 'true')` ensures the guide does not auto-popup repeatedly. Players can re-trigger it at any time by clicking **`🤖 Explain Dashboard`** in the header.

---

## 14. What Each New File Does

| File | Purpose |
| :--- | :--- |
| `src/data/resources.js` | Data declarations for Oxygen, Water, Food, and Power, plus status calculation helpers. |
| `src/data/crew.js` | Biographies, responsibilities, activities, and biometric metrics for the 4 astronauts. |
| `src/data/facilities.js` | Specifications, purposes, and conditions for the 5 monitored surface facilities. |
| `src/data/timeline.js` | Daily objectives, descriptions, and active/locked states for the 7 mission sols. |
| `src/ui/MissionHeader.js` | Top navigation bar with mission telemetry, return button, and ORBIT tour button. |
| `src/ui/ResourcePanel.js` | Visual card grid for the 4 resources with progress bars and detail modal. |
| `src/ui/CrewPanel.js` | 4 astronaut profile cards with health bars, activity callouts, and dossier modal. |
| `src/ui/FacilityPanel.js` | 5 facility status cards with "View in 3D Colony" camera handoff. |
| `src/ui/TimelinePanel.js` | 7-day mission progression track with active/locked indicators and objective modal. |
| `src/ui/MissionControlOrbitGuide.js` | 5-step tutorial with speech bubbles, section highlighting, and step navigation. |
| `src/scenes/MissionControlScene.js` | Master scene coordinator embedding the 3D holographic wireframe moon. |
| `src/styles/mission-control.css` | Complete stylesheet for Mission Control, glassmorphic modals, and responsive layout. |

---

## 15. Important Functions and Variables

| Function / Variable | Location | Purpose |
| :--- | :--- | :--- |
| `new MissionControlScene(options)` | `src/scenes/MissionControlScene.js` | Constructs the command deck, mounts child panels, and initializes the 3D hologram. |
| `init3DHologram()` | `src/scenes/MissionControlScene.js` | Sets up a Three.js WebGL scene with a rotating wireframe moon, orbital rings, and satellite marker. |
| `getResourceStatus(percentage)` | `src/data/resources.js` | Converts numeric percentages into status labels (*Excellent, Stable, Warning, Critical*). |
| `openModal(id)` | Multiple Panels | Populates and presents the glassmorphic detail modal for the selected entity. |
| `onViewInColony(facilityId)` | `src/game/Game.js` | Cross-module bridge that transitions from Mission Control directly to a focused 3D building view. |
| `highlightSection(sectionId)` | `src/ui/MissionControlOrbitGuide.js` | Applies pulsing cyan neon box-shadow to the active tutorial section and scrolls it into view. |

---

## 16. How Navigation Works

```
[ Welcome Screen ]
       │  "START ADVENTURE 🚀"
       ▼
[ Mission Briefing ]
       │  "HOW TO PLAY WITH ORBIT 🤖 →"
       ▼
[ How to Play Guide ]
       │  "LET'S GO TO THE MOON BASE! 🚀"
       ▼
[ 3D Lunar Colony Scene ] ◄─────────────────────────────────────┐
       │                                                        │
       │  "🚀 Mission Control"                                  │
       ▼                                                        │
[ Mission Control Deck ]                                        │
       │                                                        │
       ├──── "← Return to 3D Colony" ───────────────────────────┤
       │                                                        │
       └──── Facility Modal: "🎥 View in 3D Colony →" ──────────┘
             (Centers camera, highlights 3D building, opens panel)
```

---

## 17. How to Run the Application

The Vite development server runs on `127.0.0.1:5173`:

1. Open your browser and navigate to:
   ```
   http://127.0.0.1:5173/
   ```
2. If restarting the local server from the terminal:
   ```powershell
   cd "c:\Users\KAVIYA SRI R\Desktop\Luna"
   npm run dev
   ```

---

## 18. How to Test Module 2

Follow this verification plan:

1. **Enter Mission Control**:
   - Start from the Welcome screen, proceed through Briefing and How to Play into the 3D Colony.
   - Click the **`🚀 Mission Control`** button in the top HUD.
   - Confirm Mission Control opens with a smooth fade-in.
2. **Inspect 3D Holographic Display**:
   - Confirm the 3D wireframe Moon and golden orbital rings are rotating inside the top status banner.
3. **Verify Header**:
   - Confirm mission is `LUNA-01`, location is `Lunar South Pole`, day is `DAY 1 OF 7`, and crew is `4 / 4 HEALTHY`.
4. **Test Resource Monitoring**:
   - Verify Oxygen, Water, Food, and Power all display `100%` and `Excellent`.
   - Click each card to open its detail modal; verify description, related facility, and metrics. Close with **Done**.
5. **Test Crew Monitoring**:
   - Verify all 4 astronaut profiles are visible (*Evelyn Vance, Marcus Diaz, Aris Thorne, Maya Lin*).
   - Confirm health bars show `100% HEALTH` and activities are displayed.
   - Click any profile to view biography, vitals, and mission responsibilities.
6. **Test Facility Monitoring & "View in Colony"**:
   - Verify all 5 facilities display `Operational` and `100%`.
   - Click **Main Habitat Hub**, then click **`🎥 View in 3D Colony →`**.
   - Confirm the game returns to the 3D colony, the camera flies smoothly to the Habitat, the 3D arrow beacon pulses above it, and the Habitat info panel opens.
   - Click **`🚀 Mission Control`** to re-enter.
7. **Test Seven-Day Timeline**:
   - Confirm Day 1 is marked `CURRENT SOL` (active).
   - Confirm Days 2–7 are marked `LOCKED`.
   - Click Day 1 to view objectives; click Day 3 to view locked notice. Confirm the active day does not change.
8. **Test ORBIT Mission Control Guide**:
   - Click **`🤖 Explain Dashboard`** in the header.
   - Step through all 5 steps with **`Next →`**.
   - Verify that the Header, Resources, Crew, Facilities, and Timeline sections glow cyan in turn.
   - Click **`Got it! ✓`** to finish.
9. **Return to Colony**:
   - Click **`← Return to 3D Colony`** in the header. Confirm you return to the active 3D base without reloading.

---

## 19. Beginner-Friendly Viva Questions & Answers

### Q1: What is the main purpose of Module 2 in LUNA: Mission Survival?
**Answer**: Module 2 provides the Commander's central monitoring deck. It allows the player to monitor colony resources (Oxygen, Water, Food, Power), astronaut crew health and duties, facility operating conditions, and the 7-day mission timeline, while also providing a bridge back into the 3D colony scene.

### Q2: How does Mission Control integrate with Three.js?
**Answer**: Mission Control integrates with Three.js in two key ways:
1. It features an embedded Three.js WebGL holographic display showing a rotating wireframe Moon and orbit rings.
2. It interacts directly with the primary Three.js camera and scene via the **"View in 3D Colony"** feature, which smoothly flies the camera to any chosen building and activates a 3D visual beacon above it.

### Q3: Why are resource values currently static at 100% in Module 2?
**Answer**: Module 2 is focused exclusively on the monitoring UI and visual foundation of Mission Control. Dynamic consumption equations, depletion formulas, and hazard simulations are intentionally reserved for Module 3 to ensure each module is built, tested, and verified with clear architectural boundaries.

### Q4: How does the "View in Colony" button work without page reloading?
**Answer**: Both Module 1 and Module 2 run inside the same single-page application. When "View in Colony" is clicked, JavaScript toggles the CSS `.active` class on the Mission Control layer to hide it, calls `cameraManager.flyTo(...)` on the existing Three.js camera, triggers `interaction.highlightBuilding(...)`, and opens the colony info card. No page reloads or asset re-downloads take place.

### Q5: How does ORBIT's tutorial highlight specific sections of Mission Control?
**Answer**: Each tutorial step has a `targetSectionId` (*e.g. `mc-section-resources`*). The guide function retrieves the DOM element, attaches the `.mc-tutorial-highlighted` class (which renders a cyan neon glow and outline), and calls `.scrollIntoView({ behavior: 'smooth', block: 'center' })` to bring that section directly into the player's view.
