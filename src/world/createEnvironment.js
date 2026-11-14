import * as THREE from 'three';
import { CONFIG } from '../game/config.js';

/**
 * Creates the deep space background, starfield, Earth, ringed celestial body, and floating dust
 * @param {THREE.Scene} scene 
 * @returns {Object} Animated environment objects
 */
export function createEnvironment(scene) {
  // 1. Scene Fog for atmospheric depth
  scene.fog = new THREE.FogExp2(CONFIG.colors.spaceNavy, 0.0075);
  scene.background = new THREE.Color(CONFIG.colors.spaceNavy);

  // 2. Starfield (1,800 twinkling stars)
  const starCount = 1800;
  const starGeo = new THREE.BufferGeometry();
  const starPositions = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);
  const starSizes = new Float32Array(starCount);

  const starColorChoices = [
    new THREE.Color(0xFFFFFF),
    new THREE.Color(0xD9E8FF),
    new THREE.Color(0xFFE8C8),
    new THREE.Color(0x8EE5FF),
  ];

  for (let i = 0; i < starCount; i++) {
    // Distribute stars on a wide hemisphere shell
    const r = 140 + Math.random() * 80;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 1.8) - 0.9); // Spread broadly

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = Math.abs(r * Math.cos(phi)) + 15; // Above horizon
    const z = r * Math.sin(phi) * Math.sin(theta);

    starPositions[i * 3] = x;
    starPositions[i * 3 + 1] = y;
    starPositions[i * 3 + 2] = z;

    const chosenColor = starColorChoices[Math.floor(Math.random() * starColorChoices.length)];
    starColors[i * 3] = chosenColor.r;
    starColors[i * 3 + 1] = chosenColor.g;
    starColors[i * 3 + 2] = chosenColor.b;

    starSizes[i] = 1.2 + Math.random() * 2.0;
  }

  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

  // Canvas circle texture for soft star glow
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.4, 'rgba(200, 225, 255, 0.8)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 32, 32);

  const starTexture = new THREE.CanvasTexture(canvas);

  const starMat = new THREE.PointsMaterial({
    size: 2.2,
    vertexColors: true,
    map: starTexture,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  // 3. Ringed Celestial World (matches the purple ringed planet in visual reference)
  const planetGroup = new THREE.Group();
  planetGroup.position.set(-52, 44, -70);

  // Planet body
  const planetGeo = new THREE.SphereGeometry(14, 32, 32);
  const planetMat = new THREE.MeshStandardMaterial({
    color: CONFIG.colors.distantPlanet,
    roughness: 0.65,
    metalness: 0.1,
    flatShading: true,
  });
  const planetSphere = new THREE.Mesh(planetGeo, planetMat);
  planetGroup.add(planetSphere);

  // Planet Rings
  const ringGeo = new THREE.RingGeometry(18, 27, 48);
  const ringMat = new THREE.MeshBasicMaterial({
    color: CONFIG.colors.ringColor,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.55,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI * 0.42;
  ring.rotation.y = Math.PI * 0.15;
  planetGroup.add(ring);

  // Secondary outer thin ring
  const ring2Geo = new THREE.RingGeometry(29, 32, 48);
  const ring2Mat = new THREE.MeshBasicMaterial({
    color: 0xD4B8E8,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.3,
  });
  const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
  ring2.rotation.x = Math.PI * 0.42;
  ring2.rotation.y = Math.PI * 0.15;
  planetGroup.add(ring2);

  scene.add(planetGroup);

  // 4. Earth in the sky (visible on the other celestial horizon)
  const earthGroup = new THREE.Group();
  earthGroup.position.set(65, 36, -55);

  const earthGeo = new THREE.SphereGeometry(8, 32, 32);
  const earthMat = new THREE.MeshStandardMaterial({
    color: CONFIG.colors.earthOcean,
    roughness: 0.5,
    metalness: 0.1,
    flatShading: false,
  });
  const earthSphere = new THREE.Mesh(earthGeo, earthMat);
  earthGroup.add(earthSphere);

  // Procedural Earth Continents
  const continentMat = new THREE.MeshStandardMaterial({
    color: 0x388E3C,
    roughness: 0.8,
  });
  for (let c = 0; c < 9; c++) {
    const patchGeo = new THREE.DodecahedronGeometry(1.6 + Math.random() * 1.5, 1);
    const patch = new THREE.Mesh(patchGeo, continentMat);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    patch.position.set(
      7.6 * Math.sin(phi) * Math.cos(theta),
      7.6 * Math.cos(phi),
      7.6 * Math.sin(phi) * Math.sin(theta)
    );
    patch.scale.set(1.4, 0.4, 1.4);
    patch.lookAt(earthGroup.position);
    earthGroup.add(patch);
  }

  // Earth Atmosphere Glow Ring
  const atmosphereGeo = new THREE.SphereGeometry(8.4, 32, 32);
  const atmosphereMat = new THREE.MeshBasicMaterial({
    color: 0x64B5F6,
    transparent: true,
    opacity: 0.22,
    side: THREE.BackSide,
  });
  const atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat);
  earthGroup.add(atmosphere);

  scene.add(earthGroup);

  // 5. Floating Dust Particles (Low-gravity lunar regolith motes)
  const dustCount = 180;
  const dustGeo = new THREE.BufferGeometry();
  const dustPositions = new Float32Array(dustCount * 3);
  const dustVelocities = [];

  for (let i = 0; i < dustCount; i++) {
    dustPositions[i * 3] = (Math.random() - 0.5) * 46;
    dustPositions[i * 3 + 1] = 0.5 + Math.random() * 10.0;
    dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 46;

    dustVelocities.push({
      x: (Math.random() - 0.5) * 0.008,
      y: (Math.random() - 0.5) * 0.006,
      z: (Math.random() - 0.5) * 0.008,
    });
  }

  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  const dustMat = new THREE.PointsMaterial({
    color: 0xFFE0BD,
    size: 0.18,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);

  // 6. Distant Lunar Orbital Station ("Gateway") in high orbit
  const spaceStation = new THREE.Group();
  spaceStation.name = "Distant_Lunar_Gateway";
  spaceStation.position.set(32, 54, -68);

  const stationMat = new THREE.MeshStandardMaterial({
    color: 0xE6EDF5,
    roughness: 0.35,
    metalness: 0.4,
  });
  const stationGoldMat = new THREE.MeshStandardMaterial({
    color: 0xF5BA42,
    roughness: 0.3,
    metalness: 0.8,
  });
  const stationSolarMat = new THREE.MeshStandardMaterial({
    color: 0x1A4480,
    roughness: 0.2,
    metalness: 0.7,
  });

  // Central Hub Cylinder
  const hubGeo = new THREE.CylinderGeometry(0.8, 0.8, 3.2, 12);
  const hub = new THREE.Mesh(hubGeo, stationMat);
  hub.rotation.z = Math.PI / 2;
  spaceStation.add(hub);

  // Docking Ring Module
  const dockGeo = new THREE.TorusGeometry(1.0, 0.2, 8, 16);
  const dock = new THREE.Mesh(dockGeo, stationGoldMat);
  dock.rotation.y = Math.PI / 2;
  spaceStation.add(dock);

  // Truss spine
  const trussGeo = new THREE.CylinderGeometry(0.12, 0.12, 8.5, 8);
  const truss = new THREE.Mesh(trussGeo, stationMat);
  spaceStation.add(truss);

  // Solar Wings (4 panels)
  [-3.2, 3.2].forEach(yOffset => {
    const wingGeo = new THREE.BoxGeometry(2.4, 1.2, 0.08);
    const wing = new THREE.Mesh(wingGeo, stationSolarMat);
    wing.position.set(0, yOffset, 0);
    wing.rotation.y = Math.PI * 0.2;
    spaceStation.add(wing);
  });

  // Strobe Navigation Light
  const strobeGeo = new THREE.SphereGeometry(0.15, 8, 8);
  const strobeMat = new THREE.MeshBasicMaterial({ color: 0x00FF88 });
  const strobe = new THREE.Mesh(strobeGeo, strobeMat);
  strobe.position.set(2.0, 0, 0);
  spaceStation.add(strobe);
  spaceStation.userData.strobe = strobe;

  scene.add(spaceStation);

  return {
    stars,
    planetGroup,
    earthGroup,
    spaceStation,
    dust,
    dustVelocities,
    dustPositions,
  };
}
