# LUNA: MISSION SURVIVAL – MODULE 1: GAME FOUNDATION & 3D VISUAL ENVIRONMENT
### Comprehensive Technical Guide & Beginner Learning Companion

---

## 1. What Module 1 Does

**Module 1: Game Foundation and Visual Environment** provides the foundational core of **LUNA: Mission Survival**. It creates an interactive, real-time 3D lunar outpost environment situated on the South Pole's Shackleton Crater Rim. 

Instead of relying on flat 2D images, mockups, or static illustrations, Module 1 constructs an authentic 3D world in the browser using **Three.js** and **Vite**.

### Core Deliverables of Module 1:
1. **Screen 1 (Welcome Screen)**: A cinematic landing interface with dynamic 3D background camera rotation, celestial bodies (Earth, ringed planet, starfield), game title, and mission start trigger.
2. **Screen 2 (Mission Briefing)**: A friendly command interface presenting mission parameters for Expedition LUNA-01 (7-day duration, 4 assigned astronauts with biometrics, life support objectives).
3. **Screen 2.5 (How to Play with ORBIT)**: A dedicated, kid-friendly guide where ORBIT explains the 4 basic controls (Look Around in 3D, Zoom Close & Far, Click to Explore, and Ask ORBIT for a Tour).
4. **Screen 3 (Interactive 3D Lunar Colony)**: A stylized low-poly lunar base featuring:
   - Elevated orange-red regolith platform with sintered bedrock foundations, craters, and rocky cliffs.
   - Six individual interactive 3D facilities: **Main Space House (HAB-01)**, **Plant Greenhouse Bio-Domes**, **Sun Power Panels**, **Moon Science Lab**, **Space Radio Dish**, and **Moon Rover Buggy (Pathfinder)**.
   - Four procedural astronaut characters with idle animations (breathing, arm swaying, walking).
   - Dynamic 3D hovering arrow beacon and halo ring indicating the exact building being explained.
   - Atmospheric environmental effects: floating low-gravity dust particles, blinking beacon lights, solar tracking, and rotating celestial bodies.
5. **ORBIT Robotic Assistant**: A floating 3D companion robot with glowing cyan eyes and an interactive 8-step guided tutorial that introduces the commander to every structure, camera angle, and mission protocol.
6. **Interactive Selection & Telemetry**: Three.js `Raycaster` mouse hover highlights, dynamic HUD tooltips, and slide-in structural information cards detailing vital survival specifications.
7. **Smooth Camera Controls**: `OrbitControls` with customized polar and distance limits that prevent underground clipping, smooth cubic-bezier camera transitions (`flyTo`), and quick camera reset.
8. **Module 2 Integration Boundary**: A clean "Mission Control – Coming Soon!" modal preview that connects Module 1's visual foundation to future gameplay modules without introducing premature resource loops.

---

## 2. What Three.js Is

**Three.js** is an open-source, lightweight JavaScript library that makes it easy to create and display animated 3D computer graphics inside any modern web browser without needing browser plugins or heavy external engines.

Under the hood, Three.js uses **WebGL** (Web Graphics Library), an API that communicates directly with your computer's graphics processing unit (GPU). Writing raw WebGL requires hundreds of lines of complex low-level code (shader programs, vertex buffers, matrix math) just to draw a single colored triangle. Three.js acts as a friendly, high-level abstraction layer, providing intuitive objects like `Scene`, `PerspectiveCamera`, `Mesh`, `BoxGeometry`, `StandardMaterial`, and `DirectionalLight`.

---

## 3. Why We Selected Three.js for This Project

| Feature | Three.js (Selected) | 2D Canvas / Phaser / HTML-CSS | Heavy 3D Engines (Unity / Unreal) |
| :--- | :--- | :--- | :--- |
| **Rendering** | Real hardware-accelerated 3D WebGL | Flat 2D pixel coordinates or CSS transforms | Heavy WebAssembly / WebGPU bundles |
| **File Size & Load Time** | Lightweight (~500 KB minified), instant start | Low file size, but flat visual depth | Massive downloads (50 MB – 200 MB), slow loading |
| **Perspective & Camera** | Free 360° orbit, zoom, pitch, and cinematic fly-to | Static isometric viewing angle | Full 3D, but high development overhead |
| **Interactivity** | True 3D geometric raycasting on individual objects | 2D bounding boxes or invisible buttons | Complex physics and engine setups |
| **Maintainability** | Clean modular vanilla JavaScript with Vite | Complex CSS layers or monolithic 2D spritesheets | Requires specialized IDE and export toolchains |

Three.js strikes the optimal balance: it gives **real 3D depth, dynamic lighting, real shadows, and free camera exploration**, while remaining **100% vanilla JavaScript, lightweight, fast, and beginner-friendly**.

---

## 4. Difference Between 2D and 3D Rendering

```
2D Coordinate System (X, Y)           3D Coordinate System (X, Y, Z)
   (0,0) ------> +X                             +Y (Up)
     |                                           ^
     |                                           |
     v                                           |
    +Y (Down)                                    +-----> +X (Right)
                                                /
                                               /
                                              v +Z (Toward Camera)
```

1. **Dimensions**:
   - **2D Rendering**: Uses two axes—Horizontal ($X$) and Vertical ($Y$). Depth does not exist mathematically; illusions of depth must be manually drawn by artists using isometric angles or parallax layers.
   - **3D Rendering**: Uses three axes—Width ($X$), Height ($Y$), and Depth ($Z$). Objects have true physical volumes in space.
2. **Camera Perspective**:
   - In 2D, scaling an image makes it look bigger or smaller, but you cannot walk around behind it.
   - In 3D, the camera has a field of view ($FOV$), position, and target. As the camera moves closer or rotates, the GPU computes foreshortening and perspective projection automatically.
3. **Lighting & Shadows**:
   - In 2D, shadows and highlights are painted directly into the image.
   - In 3D, light rays are calculated dynamically. If a building stands between the Sun and the regolith ground, Three.js calculates and casts an authentic soft shadow on the ground in real time.

---

## 5. What a Scene Is

In Three.js, a `Scene` is a virtual 3D universe container. Everything you want the player to see—terrain, buildings, astronauts, lights, stars, and cameras—must be added to the scene using `scene.add(object)`.

In our project (`src/game/Game.js`):
```javascript
// Initializing the 3D scene
this.scene = new THREE.Scene();

// Adding objects into the virtual world
this.scene.add(this.terrain);
this.scene.add(this.habitat);
this.scene.add(this.greenhouse);
```
If an object is not added to the scene, the GPU will not render it.

---

## 6. What a Camera Is

A `Camera` determines what portion of the 3D scene is visible to the player and how it is projected onto the 2D computer screen.

In LUNA, we use a `PerspectiveCamera`, which mimics the human eye: objects further away appear smaller, while closer objects appear larger.

```javascript
this.camera = new THREE.PerspectiveCamera(
  CONFIG.camera.fov,                        // Field of View (42 degrees)
  window.innerWidth / window.innerHeight,  // Aspect ratio (width / height)
  CONFIG.camera.near,                       // Near clipping plane (0.1 units)
  CONFIG.camera.far                         // Far clipping plane (500 units)
);
```

### Clipping Planes:
- Anything closer than `near` (0.1 units) is clipped (invisible).
- Anything farther than `far` (500 units) is clipped.
- The region between near and far is called the **Viewing Frustum**.

---

## 7. What a Renderer Is

The `Renderer` (`THREE.WebGLRenderer`) is the engine component that takes the `Scene` and the `Camera`, performs all mathematical matrix transformations, calculates lighting and shadow maps, and draws the final 2D pixels onto an HTML `<canvas>` element.

```javascript
this.renderer = new THREE.WebGLRenderer({
  antialias: true,                 // Smooths jagged edges on 3D models
  powerPreference: 'high-performance'
});
this.renderer.setSize(window.innerWidth, window.innerHeight);
this.renderer.outputColorSpace = THREE.SRGBColorSpace; // Accurate color reproduction
this.renderer.shadowMap.enabled = true;                // Enables real-time shadow casting
this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Soft realistic shadow edges
```

---

## 8. What Geometry and Materials Mean

Every visible 3D object in Three.js is represented as a `Mesh`:

$$\text{Mesh} = \text{Geometry (Shape)} + \text{Material (Appearance)}$$

### Geometry:
The mathematical definition of the shape—a collection of 3D coordinates called **vertices**, connected by lines called **edges** to form triangular **faces**.
- `BoxGeometry(width, height, depth)` – Cubes and rectangular panels.
- `CylinderGeometry(radiusTop, radiusBottom, height, segments)` – Habitat towers, rocket stages, pipes.
- `SphereGeometry(radius, widthSegments, heightSegments)` – Helmets, planets, robot heads.
- `TorusGeometry(radius, tube)` – Crater rims, airlock rings.
- `DodecahedronGeometry(radius)` – Faceted low-poly lunar rocks.

### Materials:
Determine how the surface reacts to light:
- `MeshStandardMaterial`: Physically based material that accurately responds to directional light, ambient light, roughness, and metalness.
- `MeshPhysicalMaterial`: Advanced material with optical transmission and index of refraction ($IOR$) used for our transparent curved greenhouse domes.
- `MeshBasicMaterial`: Unaffected by lighting, used for glowing LEDs, laser beams, and stars.

---

## 9. How 3D Objects Are Created

To create a modular 3D building, we group several geometric meshes into a `THREE.Group`. A group allows all child parts (walls, doors, windows, lights) to move, rotate, and scale together as a single unified structure.

Example from `src/objects/Habitat.js`:
```javascript
export function createHabitat() {
  const group = new THREE.Group();
  group.name = "Building_Habitat";
  group.userData = { buildingId: "habitat", buildingName: "Main Habitat Hub (HAB-01)" };

  // 1. Create cylinder body
  const bodyGeo = new THREE.CylinderGeometry(2.4, 2.7, 5.0, 24);
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xE6EAF0, roughness: 0.35 });
  const body = new THREE.Mesh(bodyGeo, whiteMat);
  body.position.y = 4.5;
  body.castShadow = true;
  group.add(body);

  // 2. Add cupola window, foundation legs, and airlock
  // ...
  return group;
}
```

---

## 10. How the Lunar Terrain Is Created

The lunar platform in `src/world/createTerrain.js` is inspired by the elevated isometric diamond aesthetic:

1. **Floating Platform Block**:
   - Built using a high-density `BoxGeometry(26, 0.6, 26, 16, 1, 16)`.
   - The top vertices are procedurally perturbed using sine and cosine waves to produce natural regolith dunes and undulating surface topography:
     $$\Delta y = \sin(0.4x) \cdot \cos(0.4z) \cdot 0.08$$
   - Colored with warm lunar regolith orange (`#D95736`).
2. **Sub-surface Foundation Base**:
   - A dark sintered bedrock foundation block (`#6E2514`) extends downwards with beveled collar trims.
3. **Rear Rocky Ridge / Cliffs**:
   - Multiple `DodecahedronGeometry` meshes with `flatShading: true` are stacked at the rear corner of the base, creating faceted low-poly lunar cliffs that frame the habitat and antenna.
4. **Craters**:
   - Created with flattened `TorusGeometry` for the elevated rim and a darkened `CircleGeometry` for the recessed shadow floor.
5. **Scattered Boulders**:
   - Varied low-poly rocks placed around pathways with random rotations and scales.

---

## 11. How the Six Buildings Are Created

Each structure is an independent, procedural Three.js component:

1. **Main Habitat Hub (`Habitat.js`)**:
   - Modular cylindrical crew module with conical roof cap.
   - Four angled silver support legs with circular footpads.
   - Dark oval observation cupola window with metallic trim ring.
   - Pressurized airlock transfer port with status LED and access steps leading to the regolith.
   - Connecting pressurized tunnel tube with structural ribs.
2. **Hydroponic Bio-Domes (`Greenhouse.js`)**:
   - Curved semi-cylindrical transparent tunnel dome using `MeshPhysicalMaterial` with optical transmission.
   - White structural rib arches along the tunnel length.
   - White geometric entrance bulkheads with airlock doors, steps, and identification decal ("01-1").
   - Interior tiered hydroponic trays with rich soil.
   - Seven miniature trees/plants per row with brown trunks and vibrant green crowns.
   - Overhead LED grow light strips casting a soft interior botanical glow.
   - Two greenhouses: **Alpha** (flank) and **Beta** (front entrance with stairs).
3. **Photovoltaic Solar Farm (`SolarArray.js`)**:
   - An array of 11 dark-blue triple-junction monocrystalline solar panels mounted in angled rows.
   - Dual support posts with silver pivot joints.
   - Substation power accumulator with glowing cyan LED.
   - Subtle procedural sun-tracking orientation adjustments in the render loop.
4. **Lunar Geological Laboratory (`ResearchLab.js`)**:
   - Futuristic white modular science pod with muted blue equipment housing.
   - Wide panoramic observation window displaying interior cyan cleanroom illumination.
   - Rooftop laser spectrometer pylon and optical turret.
   - Specimen airlock hatch and dual cryogenic coolant tanks.
5. **Deep Space Uplink Terminal (`Antenna.js`)**:
   - Steerable parabolic dish mounted atop an elevated rock pedestal.
   - High-gain parabolic bowl with tripod support struts and central feed horn receptor.
   - Blinking red/blue beacon LED on the mast peak.
   - Continuous gentle azimuth oscillation tracking Earth.
6. **LUNA Surface Rover-01 (`LunarRover.js`)**:
   - Rugged titanium chassis with six independent in-hub electric drive wheels.
   - White pressurized cabin with angled dark windshield.
   - Dual blue photovoltaic solar panel wings mounted at an angle.
   - Rooftop sensor mast and dual forward LED headlights with translucent light cones.

---

## 12. How Raycaster Detects Clicked Objects

When the player moves the mouse or taps the screen, the 2D cursor coordinate $(x, y)$ must be projected into 3D space to determine which building was targeted.

This is handled by `THREE.Raycaster` in `src/interactions/ObjectInteraction.js`:

```
Screen (2D Pointer: X, Y)
       |
       v
Normalize Coordinates: [-1, +1]
       |
       v
Three.js Raycaster.setFromCamera(pointer, camera)
       |
       v
Cast virtual ray from Camera into 3D Scene
       |
       v
Check intersection against all Mesh children
       |
       +---> Found hit? Read hit.object.userData.buildingId
```

### Hover Highlighting & Tooltip:
When a building is intersected:
1. All meshes inside that building group are highlighted by setting their material `emissive` color to glowing cyan (`0x00D2FF`) with an intensity of `0.45`.
2. A floating HUD tooltip appears adjacent to the pointer displaying the facility's icon, name, and "Click to Inspect" callout.
3. The cursor switches to `pointer`.
4. When the mouse leaves the building, original emissive values are restored.

---

## 13. How Camera Controls Work

Camera navigation is managed by `ColonyCameraManager` in `src/interactions/CameraControls.js`:

1. **OrbitControls**:
   - Left click / touch drag: Rotates azimuth and elevation angles around the base.
   - Right click / two-finger drag: Pans target position.
   - Scroll wheel / pinch: Zooms in and out.
2. **Boundary Protections**:
   - `minDistance = 8` and `maxDistance = 60`: Prevents zooming through buildings or getting lost in deep space.
   - `maxPolarAngle = Math.PI * 0.44`: Prevents the camera from dipping beneath the horizontal ground plane and seeing under the platform.
3. **Smooth Camera Flight (`flyTo`)**:
   - When inspecting buildings or navigating the ORBIT tutorial, the camera smoothly glides from its current position to the building's optimal inspection viewpoint using cubic-bezier easing:
     $$t_{\text{smooth}} = \begin{cases} 4t^3 & \text{if } t < 0.5 \\ 1 - \frac{(-2t + 2)^3}{2} & \text{if } t \ge 0.5 \end{cases}$$
4. **Reset Camera**:
   - Clicking "🎥 Reset View" returns the camera smoothly to the default isometric overview (`x: 18, y: 16, z: 22`).

---

## 14. How Animations Work

Animations in Three.js do not use CSS keyframes; they are driven dynamically inside the game loop by updating numerical object properties ($x, y, z$ position, rotation, opacity, or light intensity) on every single frame.

| Entity | Animated Property | Mathematical Formula / Mechanism |
| :--- | :--- | :--- |
| **Welcome Camera** | Slow panoramic orbit | $x = \sin(\omega t) \cdot R$, $z = \cos(\omega t) \cdot R$ |
| **Earth** | Planetary rotation | `earthGroup.rotation.y += speed * delta` |
| **Ringed Planet** | Axial drift | `planetGroup.rotation.y += 0.015 * delta` |
| **Dust Particles** | Regolith drift | Each particle moves by $(v_x, v_y, v_z)$; wraps around platform |
| **Antenna Dish** | Azimuth scan | $\theta = \sin(0.4t) \cdot 0.6 \text{ rad}$ |
| **Antenna Beacon** | LED blink | Light intensity alternates on 2.5 Hz frequency cycle |
| **Astronauts** | Breathing / Arm sway | Suit $y = y_0 + \sin(2t) \cdot 0.03$; arm rotation sways $\pm 0.2 \text{ rad}$ |
| **ORBIT Robot** | Floating hover | Levitation $y = 3.2 + \sin(2.2t) \cdot 0.25$; yaw $\sin(0.8t) \cdot 0.35$ |
| **Solar Panels** | Sun tracking | Panels gently adjust tilt angle over time |

---

## 15. What `requestAnimationFrame` Does

`requestAnimationFrame(callback)` is a native browser API that requests the browser to call a specified function to update an animation before the next repaint.

```javascript
animate() {
  requestAnimationFrame(this.animate); // Re-queues the loop for the next frame
  
  const delta = this.clock.getDelta(); // Time elapsed since last frame in seconds
  this.cameraManager.update();         // Updates camera damping and transitions
  this.renderer.render(this.scene, this.camera); // Draws the frame
}
```

### Why It Is Superior to `setInterval`:
1. **Screen Synchronization**: Synchronizes perfectly with your display monitor's refresh rate (e.g. 60Hz, 120Hz, 144Hz) for ultra-smooth motion without screen tearing.
2. **CPU/Battery Optimization**: Pauses automatically when the user switches browser tabs or minimizes the window, preventing unnecessary battery and CPU drain.

---

## 16. How ORBIT's Tutorial Works

The robotic assistant ORBIT provides an interactive 8-step orientation:

1. **Step Progression**:
   - Step 1: Welcome to Outpost LUNA-01.
   - Step 2: Main Habitat Hub (HAB-01).
   - Step 3: Hydroponic Bio-Domes.
   - Step 4: Photovoltaic Solar Farm.
   - Step 5: Lunar Geological Laboratory.
   - Step 6: Deep Space Uplink Terminal.
   - Step 7: LUNA Surface Rover-01.
   - Step 8: Ready for Mission Control.
2. **Camera Coordination**:
   - Each tutorial step contains a designated `cameraPos` and `cameraTarget`. Advancing the tutorial triggers `cameraManager.flyTo(...)` to smoothly frame the building.
3. **Visual Highlighting**:
   - `interactionManager.highlightBuilding(step.buildingId)` activates the glowing cyan emissive outline on the discussed structure.
4. **User Controls**:
   - Includes `Next →`, `← Back`, `Skip`, and step counter (`Step X of 8`).
5. **Persistence**:
   - On completion, `localStorage.setItem('luna_orbit_tutorial_completed', 'true')` ensures the tutorial does not annoyingly auto-play on future page visits.
   - Players can replay it at any time by clicking "🤖 ORBIT Guide" in the top HUD.

---

## 17. Project File Structure & Responsibilities

```
luna/
├── index.html                   # HTML entry point hosting #canvas-container
├── package.json                 # Project dependencies (three, vite)
├── vite.config.js               # Development server configuration
├── documentation/
│   └── module_1_game_foundation.md  # This complete technical documentation
└── src/
    ├── main.js                  # Application entry point; initializes Game
    ├── styles/
    │   └── style.css            # Sci-fi HUD styles, fonts, animations, glassmorphism
    ├── game/
    │   ├── config.js            # Color constants, camera limits, platform sizing
    │   └── Game.js              # Central controller, render loop, scene assembly
    ├── world/
    │   ├── createTerrain.js     # Regolith platform, craters, bedrock, low-poly rocks
    │   ├── createEnvironment.js # Deep space fog, starfield, Earth, ringed planet, dust
    │   └── createLighting.js    # Sun directional light, ambient fill, point lights
    ├── objects/
    │   ├── Habitat.js           # Main crew living quarters (HAB-01)
    │   ├── Greenhouse.js        # Alpha & Beta bio-domes with interior plants and stairs
    │   ├── SolarArray.js        # Dual-axis tracking photovoltaic solar panels
    │   ├── ResearchLab.js       # Geological science pod with laser spectrometer
    │   ├── Antenna.js           # Deep space communication dish & blinking beacon
    │   ├── LunarRover.js        # 6-wheel surface rover with solar wings & headlights
    │   ├── Astronaut.js         # 4 articulated suited astronauts with idle animations
    │   └── OrbitRobot.js        # 3D floating companion robot
    ├── interactions/
    │   ├── CameraControls.js    # OrbitControls, boundary clamps, smooth flyTo tweens
    │   └── ObjectInteraction.js # Raycaster hover highlights, tooltips, click selection
    ├── data/
    │   ├── buildings.js         # Structural specs, telemetry, descriptions, camera views
    │   └── mission.js           # Mission LUNA-01 details, 4 crew member profiles
    └── ui/
        ├── Navigation.js        # Screen state manager (Welcome -> Briefing -> Colony -> MC)
        ├── InformationPanel.js  # Slide-in modal card showing facility telemetry
        └── OrbitTutorial.js     # 8-step guided tutorial with dialog bubble
```

---

## 18. Important Functions and Variables

| Function / Variable | Location | Purpose |
| :--- | :--- | :--- |
| `new Game(container)` | `src/game/Game.js` | Initializes Three.js renderer, camera, scene, world assets, and render loop. |
| `animate()` | `src/game/Game.js` | Core `requestAnimationFrame` loop driving continuous 3D rendering and physics. |
| `CONFIG` | `src/game/config.js` | Centralized design tokens (hex colors, camera bounds, platform sizing). |
| `BUILDINGS_DATA` | `src/data/buildings.js` | Telemetry specs, operational status, descriptions, and camera viewpoints for all 6 buildings. |
| `createTerrain(scene)` | `src/world/createTerrain.js` | Procedurally generates regolith platform, vertex dunes, craters, and low-poly cliffs. |
| `createLighting(scene)` | `src/world/createLighting.js` | Configures shadow-casting directional sunlight, ambient fill, and localized point lights. |
| `flyTo(pos, lookAt, duration)` | `src/interactions/CameraControls.js` | Smooth cubic-bezier camera tweening between two viewpoints in 3D space. |
| `getIntersectedBuilding()` | `src/interactions/ObjectInteraction.js` | Casts ray from 2D screen pointer into 3D scene to identify intersected building objects. |
| `applyHighlight(buildingId)` | `src/interactions/ObjectInteraction.js` | Applies glowing cyan emissive shader highlight to all meshes in the selected building. |
| `switchScreen(screenName)` | `src/ui/Navigation.js` | Seamlessly switches between Welcome, Briefing, Colony HUD, and Mission Control screens. |
| `start(force)` | `src/ui/OrbitTutorial.js` | Launches the 8-step ORBIT tutorial, moving the camera and displaying dialog bubbles. |

---

## 19. How the Application Flows (Welcome to Colony)

```
[ User Opens Application: http://127.0.0.1:5173 ]
                       │
                       ▼
            [ Screen 1: Welcome ]
  • Dynamic 3D panoramic camera orbiting colony in background
  • Title, tagline, friendly mission parameters displayed
  • User clicks "START ADVENTURE 🚀"
                       │
                       ▼
        [ Screen 2: Mission Briefing ]
  • Camera glides into close base perspective
  • Meet the 4 astronaut friends (Elena, Marcus, Mateo, Sarah)
  • User clicks "HOW TO PLAY WITH ORBIT 🤖 →"
                       │
                       ▼
   [ Screen 2.5: How to Play with ORBIT ]
  • ORBIT explains the 4 basic controls:
    1. 🖱️ Look Around in 3D
    2. 🔍 Zoom Close & Far
    3. 👆 Click to Explore
    4. 🤖 Ask ORBIT Anytime
  • User clicks "LET'S GO TO THE MOON BASE! 🚀"
                       │
                       ▼
         [ Screen 3: 3D Lunar Colony ]
  • Free OrbitControls unlocked (rotate, pan, zoom)
  • Top HUD active (Day 1/7, 4/4 Happy, Power 100%)
  • ORBIT Assistant introduces the 6 facilities with 3D hovering pointer arrow!
  • Hover over buildings: Cyan glow + 3D pointer + tooltip
  • Click any building / bottom dock: Slide-in Telemetry Info Card
  • Click "🎥 Reset View": Camera glides back to isometric overview
  • Click "🚀 Mission Control": Opens Module 2 preview screen
```

---

## 20. How to Run the Project

### Prerequisites:
- **Node.js**: v18.0 or newer (tested on Node v22.18.0).
- **npm**: v9.0 or newer.

### Steps:
1. Open a terminal in the project directory:
   ```bash
   cd "c:\Users\KAVIYA SRI R\Desktop\Luna"
   ```
2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```
3. Start the Vite local development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to:
   ```
   http://127.0.0.1:5173/
   ```

---

## 21. How to Test the Project

Follow this verification checklist:

1. **Rendering & Console**:
   - Open browser developer tools (`F12` -> Console tab).
   - Verify there are **zero errors** and no missing module warnings.
2. **Screen 1 (Welcome)**:
   - Confirm the 3D scene renders behind the title.
   - Confirm the camera smoothly orbits the base.
   - Click **"START MISSION →"**; ensure screen transitions to Briefing.
3. **Screen 2 (Briefing)**:
   - Confirm all 4 crew cards render with badges, roles, and status.
   - Click **"INITIALIZE COLONY VIEW →"**; confirm transition into the 3D colony.
4. **3D Scene & Six Buildings**:
   - Verify that all six facilities are present:
     - Main Habitat (central white tower with cupola and legs)
     - Hydroponic Bio-Domes (curved transparent domes with green trees and stairs)
     - Photovoltaic Solar Farm (angled blue panels on stands)
     - Geological Laboratory (pod with blue accents and rooftop turret)
     - Deep Space Uplink Terminal (elevated parabolic dish and blinking red LED)
     - Lunar Rover (6 wheels, white cabin, solar wings, headlights)
5. **Interactions & Raycasting**:
   - Hover the mouse over each structure. Confirm the structure glows cyan and a tooltip appears.
   - Click any building. Confirm the **Information Panel** opens displaying facility details and telemetry.
   - Click **"🎯 Focus Camera"** in the panel to inspect the building closely.
   - Click **"✕"** or **"Done"** to close the panel.
6. **ORBIT Tutorial**:
   - Click **"🤖 ORBIT Guide"** in the top HUD.
   - Click **"Next →"** through all 8 steps. Confirm the camera flies to each building in sequence and highlights it.
   - Confirm clicking **"Finish ✓"** or **"Skip"** returns the camera smoothly to the default overview.
7. **Camera Controls**:
   - Drag with left mouse button to rotate around the base.
   - Scroll mouse wheel to zoom in and out. Confirm the camera cannot clip underground.
   - Click **"🎥 Reset View"**; confirm the camera returns to the default angle.
8. **Module 2 Boundary**:
   - Click **"🚀 Mission Control"** in the top HUD.
   - Confirm the Module 2 preview card appears. Click **"← Return to 3D Colony"** to return.

---

## 22. Beginner-Friendly Viva Questions & Answers

### Q1: What is the purpose of Module 1 in LUNA: Mission Survival?
**Answer**: Module 1 establishes the visual foundation and interactive 3D environment for the game. It provides the welcome interface, mission briefing, an authentic 3D lunar base with six interactive facilities, four astronaut characters, smooth camera controls, and the ORBIT tutorial. Complex survival mechanics (resource depletion equations, NASA API) are intentionally reserved for Module 2.

### Q2: Why did we use Three.js instead of building the scene with 2D HTML/CSS or images?
**Answer**: Three.js provides genuine hardware-accelerated 3D rendering using WebGL. This allows players to freely orbit around buildings, zoom in, observe dynamic sunlight and soft shadows, and interact with individual 3D objects via raycasting. Flat HTML/CSS or 2D images cannot provide true perspective depth or 360-degree interactive camera movement.

### Q3: What is a Mesh in Three.js?
**Answer**: A `Mesh` is a 3D object formed by combining a **Geometry** (which defines its physical mathematical shape and vertices) and a **Material** (which defines how its surface appears and reflects light). For example, a solar panel is a mesh combining a `BoxGeometry` with a dark-blue reflective `MeshStandardMaterial`.

### Q4: How does Three.js know which 3D building the player clicked on with their 2D mouse?
**Answer**: By using `THREE.Raycaster`. The raycaster takes the 2D cursor coordinates on the screen, casts a virtual straight ray from the camera lens forward into the 3D scene, and detects which object's triangular faces intersect that ray. We read `object.userData.buildingId` from the intersected object to identify the facility.

### Q5: How do we prevent the 3D camera from clipping underneath the lunar ground?
**Answer**: In `OrbitControls`, we configure `controls.maxPolarAngle = Math.PI * 0.44`. The polar angle measures the vertical tilt from directly overhead ($0$) to directly below ($\pi$). Limiting the maximum angle to approximately $79^\circ$ prevents the camera from rotating below the level of the regolith platform.

### Q6: What does `requestAnimationFrame` do in the game loop?
**Answer**: `requestAnimationFrame` tells the web browser to execute our `animate()` function immediately before the next screen repaint. It synchronizes with the monitor's refresh rate (typically 60Hz or higher) for stutter-free animation and automatically throttles execution when the tab is hidden, conserving system resources.

### Q7: Why are all 3D assets in this project generated procedurally instead of loading external `.gltf` or `.obj` files?
**Answer**: Procedural construction uses native Three.js mathematical primitives (`CylinderGeometry`, `BoxGeometry`, `SphereGeometry`, `TorusGeometry`, etc.) and built-in materials. This eliminates external file dependencies, prevents asset loading 404 errors, enables instant loading times, and allows precise programmatic control over every vertex, light, and material color.

### Q8: How does the ORBIT assistant tutorial remember if the player has already finished it?
**Answer**: When the tutorial completes or is skipped, we execute `localStorage.setItem('luna_orbit_tutorial_completed', 'true')`. On future visits, the code checks `localStorage.getItem(...)`. If true, the tutorial will not auto-launch, but the player can always re-trigger it manually by clicking the "ORBIT Guide" button.
