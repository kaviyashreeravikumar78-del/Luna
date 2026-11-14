import * as THREE from 'three';
import { CONFIG } from '../game/config.js';

/**
 * Creates authentic, stylized 3D lunar colony surface infrastructure:
 * - Landing Pad & Autonomous Robotic Cargo Lander
 * - Cryogenic Life Support Tank Farm (LOX & H2O Silos)
 * - Surface Power Conduits & Junction Relay Hubs
 * - Perimeter High-Mast LED Floodlights
 * - Colony Expedition Flag & Commemorative Plaque
 * - Modular Cargo Pallets & Sci-Fi Supply Crates
 * - Seismic & Meteorological Science Sensor Posts
 * - Automated Core Drill Rig & Glowing Lunar Crystals
 *
 * @param {THREE.Scene} scene
 * @returns {Object} References to animated decorative elements
 */
export function createColonyDecorations(scene) {
  const decorationsGroup = new THREE.Group();
  decorationsGroup.name = "Colony_Surface_Decorations";

  // Animated elements storage for Game loop
  const animatedLights = [];
  const animatedBeacons = [];
  let sensorSpindle = null;
  let flagMesh = null;

  // Shared Materials
  const metalWhiteMat = new THREE.MeshStandardMaterial({
    color: CONFIG.colors.habitatWhite,
    roughness: 0.35,
    metalness: 0.3,
    flatShading: true,
  });

  const darkSteelMat = new THREE.MeshStandardMaterial({
    color: 0x2A323D,
    roughness: 0.6,
    metalness: 0.7,
    flatShading: true,
  });

  const goldFoilMat = new THREE.MeshStandardMaterial({
    color: 0xF5BA42,
    roughness: 0.25,
    metalness: 0.85,
    flatShading: true,
  });

  const hazardYellowMat = new THREE.MeshStandardMaterial({
    color: 0xFFB703,
    roughness: 0.4,
  });

  const cyanEmissiveMat = new THREE.MeshBasicMaterial({ color: 0x00E5FF });
  const amberEmissiveMat = new THREE.MeshBasicMaterial({ color: 0xFFB703 });
  const greenEmissiveMat = new THREE.MeshBasicMaterial({ color: 0x00FF88 });

  // =========================================================================
  // 1. LUNAR LANDING PAD & ROBOTIC CARGO LANDER (Spaceport Sector)
  // =========================================================================
  const padGroup = new THREE.Group();
  padGroup.name = "Sector_LandingPad";
  padGroup.position.set(-12.5, 0.35, 9.5);

  // Octagonal Landing Deck
  const padGeo = new THREE.CylinderGeometry(4.6, 4.8, 0.4, 8);
  const padMat = new THREE.MeshStandardMaterial({
    color: 0x1E252E,
    roughness: 0.75,
    metalness: 0.4,
    flatShading: true,
  });
  const padDeck = new THREE.Mesh(padGeo, padMat);
  padDeck.receiveShadow = true;
  padDeck.castShadow = true;
  padGroup.add(padDeck);

  // Beveled outer collar ring with caution yellow trim
  const collarGeo = new THREE.RingGeometry(4.2, 4.6, 8);
  const collar = new THREE.Mesh(collarGeo, hazardYellowMat);
  collar.rotation.x = -Math.PI / 2;
  collar.position.y = 0.21;
  collar.receiveShadow = true;
  padGroup.add(collar);

  // Inner White Touchdown Circle
  const targetRingGeo = new THREE.RingGeometry(2.4, 2.7, 24);
  const targetRingMat = new THREE.MeshBasicMaterial({ color: 0xE6EDF5 });
  const targetRing = new THREE.Mesh(targetRingGeo, targetRingMat);
  targetRing.rotation.x = -Math.PI / 2;
  targetRing.position.y = 0.22;
  padGroup.add(targetRing);

  // Landing Cross / Hazard Markings
  const crossGeo1 = new THREE.PlaneGeometry(0.35, 3.8);
  const cross1 = new THREE.Mesh(crossGeo1, targetRingMat);
  cross1.rotation.x = -Math.PI / 2;
  cross1.position.y = 0.22;
  padGroup.add(cross1);

  const crossGeo2 = new THREE.PlaneGeometry(3.8, 0.35);
  const cross2 = new THREE.Mesh(crossGeo2, targetRingMat);
  cross2.rotation.x = -Math.PI / 2;
  cross2.position.y = 0.22;
  padGroup.add(cross2);

  // 8 Perimeter Runway Strobe Beacons
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + (Math.PI / 8);
    const radius = 4.4;
    const postGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.3, 8);
    const post = new THREE.Mesh(postGeo, darkSteelMat);
    post.position.set(Math.cos(angle) * radius, 0.25, Math.sin(angle) * radius);
    post.castShadow = true;
    padGroup.add(post);

    const isCyan = (i % 2 === 0);
    const bulbGeo = new THREE.SphereGeometry(0.1, 8, 8);
    const bulbMat = new THREE.MeshBasicMaterial({
      color: isCyan ? 0x00E5FF : 0xFFA000,
    });
    const bulb = new THREE.Mesh(bulbGeo, bulbMat);
    bulb.position.set(Math.cos(angle) * radius, 0.42, Math.sin(angle) * radius);
    padGroup.add(bulb);

    animatedLights.push({
      mesh: bulb,
      mat: bulbMat,
      isCyan,
      phase: i * 0.4,
    });
  }

  // --- Robotic Cargo Lander (Descent Module) resting on the pad ---
  const lander = new THREE.Group();
  lander.name = "Cargo_Lander_Module";
  lander.position.set(0, 0.2, 0);

  // Lander Hexagonal Core Body
  const bodyGeo = new THREE.CylinderGeometry(1.2, 1.45, 1.6, 6);
  const landerBody = new THREE.Mesh(bodyGeo, metalWhiteMat);
  landerBody.position.y = 1.6;
  landerBody.castShadow = true;
  landerBody.receiveShadow = true;
  lander.add(landerBody);

  // Gold Thermal Insulation Foil Skirt
  const skirtGeo = new THREE.CylinderGeometry(1.46, 1.6, 0.6, 6);
  const skirt = new THREE.Mesh(skirtGeo, goldFoilMat);
  skirt.position.y = 0.95;
  skirt.castShadow = true;
  lander.add(skirt);

  // Upper Avionics Dome
  const domeGeo = new THREE.SphereGeometry(0.9, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const dome = new THREE.Mesh(domeGeo, metalWhiteMat);
  dome.position.y = 2.4;
  dome.castShadow = true;
  lander.add(dome);

  // Main Rocket Bell Nozzle underneath
  const nozzleGeo = new THREE.CylinderGeometry(0.2, 0.5, 0.5, 12, 1, true);
  const nozzle = new THREE.Mesh(nozzleGeo, darkSteelMat);
  nozzle.position.y = 0.45;
  lander.add(nozzle);

  // 4 Hydraulic Landing Legs & Footpads
  for (let l = 0; l < 4; l++) {
    const legAngle = (l / 4) * Math.PI * 2 + (Math.PI / 4);
    const legGroup = new THREE.Group();
    legGroup.rotation.y = legAngle;

    // Strut
    const strutGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.5, 8);
    const strut = new THREE.Mesh(strutGeo, darkSteelMat);
    strut.position.set(1.1, 0.65, 0);
    strut.rotation.z = -Math.PI * 0.22;
    strut.castShadow = true;
    legGroup.add(strut);

    // Footpad
    const padFootGeo = new THREE.CylinderGeometry(0.3, 0.35, 0.08, 12);
    const footpad = new THREE.Mesh(padFootGeo, goldFoilMat);
    footpad.position.set(1.7, 0.04, 0);
    footpad.castShadow = true;
    legGroup.add(footpad);

    lander.add(legGroup);
  }

  // Dual Spherical Propellant Tanks (Silver with orange hazard band)
  [-1.05, 1.05].forEach(xOff => {
    const tankGeo = new THREE.SphereGeometry(0.38, 14, 14);
    const tankMat = new THREE.MeshStandardMaterial({
      color: 0xDCE3EA,
      roughness: 0.3,
      metalness: 0.8,
    });
    const tank = new THREE.Mesh(tankGeo, tankMat);
    tank.position.set(xOff, 1.45, 0);
    tank.castShadow = true;
    lander.add(tank);
  });

  // Folded Solar Wings on Lander
  [-1.4, 1.4].forEach(xOff => {
    const wingGeo = new THREE.BoxGeometry(0.06, 1.0, 0.7);
    const wingMat = new THREE.MeshStandardMaterial({
      color: CONFIG.colors.solarPanelBlue,
      roughness: 0.2,
      metalness: 0.8,
    });
    const wing = new THREE.Mesh(wingGeo, wingMat);
    wing.position.set(xOff, 1.8, 0);
    wing.castShadow = true;
    lander.add(wing);
  });

  // Blinking green top telemetry beacon
  const topBeaconGeo = new THREE.SphereGeometry(0.1, 8, 8);
  const topBeacon = new THREE.Mesh(topBeaconGeo, greenEmissiveMat);
  topBeacon.position.set(0, 2.95, 0);
  lander.add(topBeacon);
  animatedBeacons.push(topBeacon);

  padGroup.add(lander);
  decorationsGroup.add(padGroup);

  // =========================================================================
  // 2. CRYOGENIC LIFE SUPPORT TANK FARM (LOX & Water Reserve)
  // =========================================================================
  const tankFarm = new THREE.Group();
  tankFarm.name = "Sector_CryogenicTankFarm";
  tankFarm.position.set(-11.5, 0.35, -4.5);

  // Foundation Plinth
  const plinthGeo = new THREE.BoxGeometry(5.4, 0.32, 4.0);
  const plinth = new THREE.Mesh(plinthGeo, darkSteelMat);
  plinth.position.y = 0.16;
  plinth.receiveShadow = true;
  plinth.castShadow = true;
  tankFarm.add(plinth);

  // Grated Walkway Trim
  const grateGeo = new THREE.BoxGeometry(5.0, 0.05, 3.6);
  const grateMat = new THREE.MeshStandardMaterial({
    color: 0x485666,
    roughness: 0.7,
    metalness: 0.6,
  });
  const grate = new THREE.Mesh(grateGeo, grateMat);
  grate.position.y = 0.34;
  tankFarm.add(grate);

  // Two Liquid Oxygen (LOX) Spherical Tanks
  [-1.4, 0.2].forEach((xOff, idx) => {
    const sphereGroup = new THREE.Group();
    sphereGroup.position.set(xOff, 1.55, -0.4);

    // Support Saddle Cradle (4 steel posts)
    const saddleGeo = new THREE.BoxGeometry(1.6, 0.2, 1.6);
    const saddle = new THREE.Mesh(saddleGeo, darkSteelMat);
    saddle.position.y = -0.9;
    saddle.castShadow = true;
    sphereGroup.add(saddle);

    // Spherical Pressure Vessel
    const sphereGeo = new THREE.SphereGeometry(1.15, 24, 24);
    const sphere = new THREE.Mesh(sphereGeo, metalWhiteMat);
    sphere.castShadow = true;
    sphere.receiveShadow = true;
    sphereGroup.add(sphere);

    // Cyan Oxygen Identification Band
    const bandGeo = new THREE.TorusGeometry(1.16, 0.06, 8, 24);
    const bandMat = new THREE.MeshStandardMaterial({
      color: 0x00E5FF,
      roughness: 0.3,
      emissive: 0x006688,
    });
    const band = new THREE.Mesh(bandGeo, bandMat);
    band.rotation.x = Math.PI / 2;
    sphereGroup.add(band);

    // Relief valve assembly
    const valveGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.4, 8);
    const valve = new THREE.Mesh(valveGeo, darkSteelMat);
    valve.position.y = 1.25;
    sphereGroup.add(valve);

    tankFarm.add(sphereGroup);
  });

  // Vertical Water Reclamation Silo (H2O Reserves)
  const siloGroup = new THREE.Group();
  siloGroup.position.set(1.6, 1.8, 0.2);

  const siloBodyGeo = new THREE.CylinderGeometry(0.85, 0.85, 2.6, 20);
  const siloBody = new THREE.Mesh(siloBodyGeo, metalWhiteMat);
  siloBody.castShadow = true;
  siloBody.receiveShadow = true;
  siloGroup.add(siloBody);

  // Silo Cap (Dome)
  const siloCapGeo = new THREE.SphereGeometry(0.85, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2);
  const siloCap = new THREE.Mesh(siloCapGeo, metalWhiteMat);
  siloCap.position.y = 1.3;
  siloGroup.add(siloCap);

  // Blue Water Identification Rings
  [-0.6, 0.4].forEach(yPos => {
    const ringGeo = new THREE.TorusGeometry(0.86, 0.05, 8, 20);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x0088FF,
      roughness: 0.3,
      emissive: 0x003388,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = yPos;
    siloGroup.add(ring);
  });

  tankFarm.add(siloGroup);

  // Pressurized Connecting Pipes
  const pipeMat = new THREE.MeshStandardMaterial({
    color: 0x7E8C9E,
    roughness: 0.3,
    metalness: 0.8,
  });
  const mainPipeGeo = new THREE.CylinderGeometry(0.09, 0.09, 3.4, 8);
  const mainPipe = new THREE.Mesh(mainPipeGeo, pipeMat);
  mainPipe.rotation.z = Math.PI / 2;
  mainPipe.position.set(-0.2, 0.65, 0.9);
  tankFarm.add(mainPipe);

  decorationsGroup.add(tankFarm);

  // =========================================================================
  // 3. GROUND UTILITY CONDUITS & ENERGY CABLES
  // =========================================================================
  const conduitGroup = new THREE.Group();
  conduitGroup.name = "Ground_Utility_Conduits";

  const conduitMat = new THREE.MeshStandardMaterial({
    color: 0x222C38,
    roughness: 0.6,
    metalness: 0.5,
  });
  const energyStripMat = new THREE.MeshBasicMaterial({ color: 0x00E5FF });

  const createConduitRun = (startX, startZ, endX, endZ) => {
    const dx = endX - startX;
    const dz = endZ - startZ;
    const len = Math.sqrt(dx * dx + dz * dz);
    const angle = Math.atan2(dx, dz);

    const pipeGeo = new THREE.BoxGeometry(0.28, 0.16, len);
    const pipe = new THREE.Mesh(pipeGeo, conduitMat);
    pipe.position.set((startX + endX) / 2, 0.42, (startZ + endZ) / 2);
    pipe.rotation.y = angle;
    pipe.receiveShadow = true;
    pipe.castShadow = true;
    conduitGroup.add(pipe);

    // Glowing energy core line
    const coreGeo = new THREE.BoxGeometry(0.08, 0.04, len);
    const core = new THREE.Mesh(coreGeo, energyStripMat);
    core.position.set((startX + endX) / 2, 0.51, (startZ + endZ) / 2);
    core.rotation.y = angle;
    conduitGroup.add(core);
  };

  // Junction Hub Box
  const createJunctionBox = (x, z) => {
    const boxGeo = new THREE.BoxGeometry(0.65, 0.35, 0.65);
    const box = new THREE.Mesh(boxGeo, darkSteelMat);
    box.position.set(x, 0.48, z);
    box.castShadow = true;
    conduitGroup.add(box);

    const indicatorGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const indicator = new THREE.Mesh(indicatorGeo, greenEmissiveMat);
    indicator.position.set(x, 0.68, z);
    conduitGroup.add(indicator);
  };

  // Conduits linking Solar Farm -> Habitat -> Lab -> Tank Farm
  createConduitRun(-2.8, 3.8, 0.0, 0.8);
  createConduitRun(0.0, 0.8, 0.0, -1.5);
  createConduitRun(0.0, 0.8, 4.2, 1.8);
  createConduitRun(-2.8, 3.8, -8.0, 2.5);
  createConduitRun(-8.0, 2.5, -10.5, -2.5);

  createJunctionBox(0.0, 0.8);
  createJunctionBox(-8.0, 2.5);

  decorationsGroup.add(conduitGroup);

  // =========================================================================
  // 4. COLONY EXPEDITION FLAG & COMMEMORATIVE PLAQUE
  // =========================================================================
  const flagGroup = new THREE.Group();
  flagGroup.name = "Colony_Expedition_Flag";
  flagGroup.position.set(-1.2, 0.35, 2.2);

  // Base Pedestal
  const basePlinthGeo = new THREE.CylinderGeometry(0.6, 0.75, 0.25, 8);
  const basePlinth = new THREE.Mesh(basePlinthGeo, darkSteelMat);
  basePlinth.position.y = 0.12;
  basePlinth.receiveShadow = true;
  flagGroup.add(basePlinth);

  // Commemorative Plaque
  const plaqueGeo = new THREE.BoxGeometry(0.4, 0.15, 0.05);
  const plaque = new THREE.Mesh(plaqueGeo, goldFoilMat);
  plaque.position.set(0, 0.22, 0.36);
  plaque.rotation.x = -Math.PI * 0.15;
  flagGroup.add(plaque);

  // Silver Flagpole
  const poleGeo = new THREE.CylinderGeometry(0.04, 0.05, 3.8, 8);
  const poleMat = new THREE.MeshStandardMaterial({
    color: 0xDCE3EA,
    roughness: 0.3,
    metalness: 0.85,
  });
  const pole = new THREE.Mesh(poleGeo, poleMat);
  pole.position.y = 1.9;
  pole.castShadow = true;
  flagGroup.add(pole);

  // Gold Ball Finial
  const finialGeo = new THREE.SphereGeometry(0.1, 10, 10);
  const finial = new THREE.Mesh(finialGeo, goldFoilMat);
  finial.position.y = 3.85;
  flagGroup.add(finial);

  // Stylized Stiffened Space Flag (LUNA-01 crest colors: navy and orange)
  const flagGeo = new THREE.PlaneGeometry(1.4, 0.9, 8, 4);
  // Add subtle wave ripple to fabric geometry
  const flagPos = flagGeo.attributes.position;
  for (let i = 0; i < flagPos.count; i++) {
    const u = flagPos.getX(i);
    flagPos.setZ(i, Math.sin(u * 3.5) * 0.08);
  }
  flagGeo.computeVertexNormals();

  const flagMat = new THREE.MeshStandardMaterial({
    color: 0xD95736,
    roughness: 0.65,
    side: THREE.DoubleSide,
    flatShading: true,
  });
  flagMesh = new THREE.Mesh(flagGeo, flagMat);
  flagMesh.position.set(0.72, 3.25, 0);
  flagMesh.castShadow = true;
  flagGroup.add(flagMesh);

  // Mini ground spotlight pointing up at the flag
  const spotGeo = new THREE.ConeGeometry(0.12, 0.2, 8);
  const spot = new THREE.Mesh(spotGeo, darkSteelMat);
  spot.position.set(0.4, 0.1, 0.4);
  spot.rotation.x = Math.PI * 0.75;
  flagGroup.add(spot);

  decorationsGroup.add(flagGroup);

  // =========================================================================
  // 5. HIGH-MAST LED FLOODLIGHT TOWERS (Perimeter Illumination)
  // =========================================================================
  const towersGroup = new THREE.Group();
  towersGroup.name = "Perimeter_Floodlight_Towers";

  const towerPositions = [
    { x: -16.2, z: 6.2, rotY: Math.PI * 0.15 },
    { x: 4.8, z: 15.0, rotY: -Math.PI * 0.35 },
    { x: 15.2, z: 5.2, rotY: Math.PI * 0.8 },
  ];

  towerPositions.forEach((tp, idx) => {
    const tower = new THREE.Group();
    tower.position.set(tp.x, 0.35, tp.z);
    tower.rotation.y = tp.rotY;

    // Concrete Footing Block
    const footingGeo = new THREE.BoxGeometry(0.8, 0.4, 0.8);
    const footing = new THREE.Mesh(footingGeo, darkSteelMat);
    footing.position.y = 0.2;
    footing.receiveShadow = true;
    tower.add(footing);

    // Tapered Mast
    const mastGeo = new THREE.CylinderGeometry(0.08, 0.14, 4.6, 8);
    const mast = new THREE.Mesh(mastGeo, darkSteelMat);
    mast.position.y = 2.5;
    mast.castShadow = true;
    tower.add(mast);

    // Crossbar Head
    const crossbarGeo = new THREE.BoxGeometry(1.1, 0.12, 0.18);
    const crossbar = new THREE.Mesh(crossbarGeo, darkSteelMat);
    crossbar.position.y = 4.8;
    tower.add(crossbar);

    // Dual LED Floodlight Heads
    [-0.35, 0.35].forEach(xOff => {
      const lampHousingGeo = new THREE.BoxGeometry(0.3, 0.2, 0.25);
      const housing = new THREE.Mesh(lampHousingGeo, metalWhiteMat);
      housing.position.set(xOff, 4.65, 0.12);
      housing.rotation.x = Math.PI * 0.18; // Angled down towards colony
      housing.castShadow = true;
      tower.add(housing);

      // Emissive LED Face
      const lensGeo = new THREE.PlaneGeometry(0.26, 0.16);
      const lens = new THREE.Mesh(lensGeo, cyanEmissiveMat);
      lens.position.set(xOff, 4.61, 0.25);
      lens.rotation.x = Math.PI * 0.18;
      tower.add(lens);
    });

    // Localized down-light
    const towerLight = new THREE.PointLight(0xBDE8FF, 1.4, 11);
    towerLight.position.set(0, 4.5, 1.0);
    tower.add(towerLight);

    towersGroup.add(tower);
  });

  decorationsGroup.add(towersGroup);

  // =========================================================================
  // 6. MODULAR CARGO PALLETS & SCI-FI SUPPLY CRATES
  // =========================================================================
  const cratesGroup = new THREE.Group();
  cratesGroup.name = "Modular_Supply_Crates";

  const crateMatBlue = new THREE.MeshStandardMaterial({
    color: 0x2A629A,
    roughness: 0.45,
    metalness: 0.2,
    flatShading: true,
  });
  const crateMatOrange = new THREE.MeshStandardMaterial({
    color: 0xD95736,
    roughness: 0.45,
    metalness: 0.2,
    flatShading: true,
  });
  const crateMatWhite = new THREE.MeshStandardMaterial({
    color: 0xE6EDF5,
    roughness: 0.4,
    metalness: 0.3,
    flatShading: true,
  });

  const createCrate = (x, y, z, sx, sy, sz, mat, rotY = 0) => {
    const geo = new THREE.BoxGeometry(sx, sy, sz);
    const crate = new THREE.Mesh(geo, mat);
    crate.position.set(x, y + sy / 2, z);
    crate.rotation.y = rotY;
    crate.castShadow = true;
    crate.receiveShadow = true;
    cratesGroup.add(crate);
  };

  // Stack near Habitat entrance
  createCrate(2.4, 0.35, 0.8, 0.7, 0.5, 0.5, crateMatBlue, 0.1);
  createCrate(2.5, 0.85, 0.8, 0.6, 0.45, 0.45, crateMatWhite, -0.2);
  createCrate(3.2, 0.35, 0.7, 0.5, 0.6, 0.5, crateMatOrange, 0.3);

  // Tool cases near Rover
  createCrate(-2.2, 0.35, 7.8, 0.8, 0.4, 0.5, crateMatOrange, -0.4);
  createCrate(-2.8, 0.35, 8.2, 0.5, 0.5, 0.5, crateMatWhite, 0.2);

  // Science canisters near Research Lab
  createCrate(7.8, 0.35, 4.2, 0.6, 0.4, 0.4, crateMatBlue, 0.15);
  createCrate(8.4, 0.35, 4.0, 0.5, 0.55, 0.5, crateMatWhite, -0.3);

  // Cargo pallets near Landing Pad
  createCrate(-9.2, 0.35, 11.8, 0.9, 0.6, 0.6, crateMatOrange, 0.2);
  createCrate(-8.6, 0.35, 12.6, 0.7, 0.5, 0.5, crateMatBlue, -0.1);

  decorationsGroup.add(cratesGroup);

  // =========================================================================
  // 7. AUXILIARY SCIENCE SENSOR STATIONS (Seismic & Weather)
  // =========================================================================
  const sensorsGroup = new THREE.Group();
  sensorsGroup.name = "Auxiliary_Science_Sensors";

  // Station Alpha: Deep Crater Seismic Sensor Tripod
  const seismicStation = new THREE.Group();
  seismicStation.position.set(-14.2, 0.35, -10.2);

  // Tripod Legs
  for (let t = 0; t < 3; t++) {
    const tAngle = (t / 3) * Math.PI * 2;
    const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 6);
    const leg = new THREE.Mesh(legGeo, darkSteelMat);
    leg.position.set(Math.cos(tAngle) * 0.35, 0.55, Math.sin(tAngle) * 0.35);
    leg.rotation.x = Math.sin(tAngle) * 0.3;
    leg.rotation.z = -Math.cos(tAngle) * 0.3;
    leg.castShadow = true;
    seismicStation.add(leg);
  }

  // Sensor Core & Ground Spike
  const sensorCoreGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.5, 10);
  const sensorCore = new THREE.Mesh(sensorCoreGeo, metalWhiteMat);
  sensorCore.position.y = 1.05;
  sensorCore.castShadow = true;
  seismicStation.add(sensorCore);

  const spikeGeo = new THREE.ConeGeometry(0.06, 0.8, 6);
  const spike = new THREE.Mesh(spikeGeo, darkSteelMat);
  spike.position.y = 0.4;
  spike.rotation.x = Math.PI;
  seismicStation.add(spike);

  // Blinking Green Telemetry LED
  const seismicDiodeGeo = new THREE.SphereGeometry(0.07, 8, 8);
  const seismicDiode = new THREE.Mesh(seismicDiodeGeo, greenEmissiveMat);
  seismicDiode.position.y = 1.35;
  seismicStation.add(seismicDiode);
  animatedBeacons.push(seismicDiode);

  sensorsGroup.add(seismicStation);

  // Station Beta: Cliffside Weather & Solar Wind Anemometer Mast
  const weatherStation = new THREE.Group();
  weatherStation.position.set(12.5, 3.4, -10.5);

  const weatherMastGeo = new THREE.CylinderGeometry(0.05, 0.08, 2.2, 8);
  const weatherMast = new THREE.Mesh(weatherMastGeo, darkSteelMat);
  weatherMast.position.y = 1.1;
  weatherStation.add(weatherMast);

  // Rotating Sensor Spindle (Anemometer Cups)
  sensorSpindle = new THREE.Group();
  sensorSpindle.position.y = 2.2;

  for (let c = 0; c < 3; c++) {
    const cAngle = (c / 3) * Math.PI * 2;
    const armGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 6);
    const arm = new THREE.Mesh(armGeo, darkSteelMat);
    arm.rotation.z = Math.PI / 2;
    arm.rotation.y = cAngle;
    sensorSpindle.add(arm);

    const cupGeo = new THREE.SphereGeometry(0.08, 8, 8, 0, Math.PI);
    const cup = new THREE.Mesh(cupGeo, metalWhiteMat);
    cup.position.set(Math.cos(cAngle) * 0.32, 0, Math.sin(cAngle) * 0.32);
    sensorSpindle.add(cup);
  }

  weatherStation.add(sensorSpindle);
  sensorsGroup.add(weatherStation);

  decorationsGroup.add(sensorsGroup);

  // =========================================================================
  // 8. CORE DRILL RIG & GLOWING LUNAR MINERAL CRYSTALS
  // =========================================================================
  const drillGroup = new THREE.Group();
  drillGroup.name = "Core_Drill_Rig_And_Crystals";
  drillGroup.position.set(8.5, 0.35, 1.2);

  // Drill Rig A-Frame
  const drillFrameGeo = new THREE.BoxGeometry(0.1, 1.6, 0.1);
  const frameLeg1 = new THREE.Mesh(drillFrameGeo, darkSteelMat);
  frameLeg1.position.set(-0.35, 0.8, 0);
  frameLeg1.rotation.z = -0.2;
  frameLeg1.castShadow = true;
  drillGroup.add(frameLeg1);

  const frameLeg2 = new THREE.Mesh(drillFrameGeo, darkSteelMat);
  frameLeg2.position.set(0.35, 0.8, 0);
  frameLeg2.rotation.z = 0.2;
  frameLeg2.castShadow = true;
  drillGroup.add(frameLeg2);

  // Motor Housing
  const motorGeo = new THREE.BoxGeometry(0.5, 0.4, 0.4);
  const motor = new THREE.Mesh(motorGeo, metalWhiteMat);
  motor.position.y = 1.2;
  motor.castShadow = true;
  drillGroup.add(motor);

  // Drill Auger
  const augerGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.1, 8);
  const auger = new THREE.Mesh(augerGeo, darkSteelMat);
  auger.position.y = 0.55;
  drillGroup.add(auger);

  // Glowing Lunar Mineral Crystals (Faceted sample stones)
  const crystalMatAmber = new THREE.MeshStandardMaterial({
    color: 0xFFA000,
    emissive: 0x995500,
    roughness: 0.2,
    metalness: 0.1,
    flatShading: true,
  });

  const crystalMatCyan = new THREE.MeshStandardMaterial({
    color: 0x00E5FF,
    emissive: 0x006688,
    roughness: 0.2,
    metalness: 0.1,
    flatShading: true,
  });

  const crystals = [
    { x: 0.8, z: 0.4, s: 0.22, mat: crystalMatCyan },
    { x: 0.95, z: 0.2, s: 0.18, mat: crystalMatAmber },
    { x: 0.7, z: -0.1, s: 0.15, mat: crystalMatCyan },
  ];

  crystals.forEach(c => {
    const cGeo = new THREE.OctahedronGeometry(c.s, 0);
    const cMesh = new THREE.Mesh(cGeo, c.mat);
    cMesh.position.set(c.x, 0.15, c.z);
    cMesh.rotation.set(0.3, 0.5, 0.2);
    cMesh.castShadow = true;
    drillGroup.add(cMesh);
  });

  decorationsGroup.add(drillGroup);

  scene.add(decorationsGroup);

  return {
    group: decorationsGroup,
    animatedLights,
    animatedBeacons,
    sensorSpindle,
    flagMesh,
  };
}
