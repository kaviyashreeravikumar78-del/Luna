import * as THREE from 'three';
import { CONFIG } from '../game/config.js';
import { MISSION_DATA } from '../data/mission.js';

/**
 * Creates 4 procedural articulated 3D astronauts matching the reference aesthetic
 * @returns {Object} Astronauts group and list of animated characters
 */
export function createAstronauts() {
  const group = new THREE.Group();
  group.name = "Astronauts_Crew";

  const suitMat = new THREE.MeshStandardMaterial({
    color: CONFIG.colors.astronautSuit,
    roughness: 0.45,
    metalness: 0.1,
    flatShading: true,
  });

  const visorMat = new THREE.MeshStandardMaterial({
    color: 0x141B2D,
    roughness: 0.1,
    metalness: 0.9,
  });

  const backpackMat = new THREE.MeshStandardMaterial({
    color: CONFIG.colors.astronautBackpack,
    roughness: 0.5,
  });

  const jointMat = new THREE.MeshStandardMaterial({
    color: 0x4A5568,
    roughness: 0.7,
  });

  /**
   * Builds one articulated procedural astronaut character
   */
  function buildAstronaut(crewData, startPos, startRotY) {
    const astro = new THREE.Group();
    astro.name = `Astronaut_${crewData.name.replace(/\s+/g, '_')}`;
    astro.position.set(startPos.x, startPos.y, startPos.z);
    astro.rotation.y = startRotY;
    astro.userData = {
      isAstronaut: true,
      crewInfo: crewData,
      initialPos: { ...startPos },
      walkCycle: Math.random() * Math.PI * 2,
    };

    const scale = 0.55; // Cute miniature proportion matching visual reference
    astro.scale.set(scale, scale, scale);

    // 1. Torso
    const torsoGeo = new THREE.BoxGeometry(0.7, 0.85, 0.45);
    const torso = new THREE.Mesh(torsoGeo, suitMat);
    torso.position.y = 1.35;
    torso.castShadow = true;
    astro.add(torso);

    // Chest control unit / mission badge
    const badgeGeo = new THREE.BoxGeometry(0.3, 0.25, 0.08);
    const badgeMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(crewData.avatarColor || 0x3A86FF),
      roughness: 0.3,
    });
    const badge = new THREE.Mesh(badgeGeo, badgeMat);
    badge.position.set(0, 1.45, 0.26);
    astro.add(badge);

    // 2. Helmet & Visor
    const helmetGeo = new THREE.SphereGeometry(0.38, 16, 16);
    const helmet = new THREE.Mesh(helmetGeo, suitMat);
    helmet.position.y = 2.05;
    helmet.castShadow = true;
    astro.add(helmet);

    // Glossy curved visor faceplate
    const visorGeo = new THREE.SphereGeometry(0.28, 16, 12, 0, Math.PI, 0, Math.PI * 0.7);
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.rotation.x = -Math.PI * 0.15;
    visor.position.set(0, 2.05, 0.18);
    astro.add(visor);

    // 3. Life Support Backpack (PLSS)
    const packGeo = new THREE.BoxGeometry(0.55, 0.8, 0.3);
    const pack = new THREE.Mesh(packGeo, backpackMat);
    pack.position.set(0, 1.35, -0.36);
    pack.castShadow = true;
    astro.add(pack);

    // Oxygen cylinders on backpack
    [-0.15, 0.15].forEach(ox => {
      const oxyGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.65, 8);
      const oxyMat = new THREE.MeshStandardMaterial({ color: 0xE2E8F0, metalness: 0.6 });
      const oxy = new THREE.Mesh(oxyGeo, oxyMat);
      oxy.position.set(ox, 1.4, -0.52);
      astro.add(oxy);
    });

    // 4. Articulated Arms (Pivots at shoulder)
    // Left Arm
    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(-0.48, 1.65, 0);
    const armGeo = new THREE.CylinderGeometry(0.12, 0.11, 0.6, 8);
    const leftArmMesh = new THREE.Mesh(armGeo, suitMat);
    leftArmMesh.position.y = -0.3;
    leftArmMesh.castShadow = true;
    leftArmPivot.add(leftArmMesh);
    astro.add(leftArmPivot);

    // Right Arm
    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(0.48, 1.65, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, suitMat);
    rightArmMesh.position.y = -0.3;
    rightArmMesh.castShadow = true;
    rightArmPivot.add(rightArmMesh);
    astro.add(rightArmPivot);

    // 5. Articulated Legs (Pivots at hip)
    // Left Leg
    const leftLegPivot = new THREE.Group();
    leftLegPivot.position.set(-0.22, 0.95, 0);
    const legGeo = new THREE.CylinderGeometry(0.14, 0.13, 0.7, 8);
    const leftLegMesh = new THREE.Mesh(legGeo, suitMat);
    leftLegMesh.position.y = -0.35;
    leftLegMesh.castShadow = true;
    leftLegPivot.add(leftLegMesh);

    // Boot
    const bootGeo = new THREE.BoxGeometry(0.26, 0.2, 0.38);
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x333F48, roughness: 0.8 });
    const leftBoot = new THREE.Mesh(bootGeo, bootMat);
    leftBoot.position.set(0, -0.68, 0.06);
    leftBoot.castShadow = true;
    leftLegPivot.add(leftBoot);
    astro.add(leftLegPivot);

    // Right Leg
    const rightLegPivot = new THREE.Group();
    rightLegPivot.position.set(0.22, 0.95, 0);
    const rightLegMesh = new THREE.Mesh(legGeo, suitMat);
    rightLegMesh.position.y = -0.35;
    rightLegMesh.castShadow = true;
    rightLegPivot.add(rightLegMesh);

    const rightBoot = new THREE.Mesh(bootGeo, bootMat);
    rightBoot.position.set(0, -0.68, 0.06);
    rightBoot.castShadow = true;
    rightLegPivot.add(rightBoot);
    astro.add(rightLegPivot);

    astro.userData.leftArm = leftArmPivot;
    astro.userData.rightArm = rightArmPivot;
    astro.userData.leftLeg = leftLegPivot;
    astro.userData.rightLeg = rightLegPivot;

    return astro;
  }

  // Position 4 crew members across the colony
  const crewPositions = [
    // 1. Cmdr. Elena Rostova - Near the Habitat entrance steps
    { pos: { x: 0.6, y: 0.3, z: 0.8 }, rotY: -Math.PI * 0.2 },
    // 2. Dr. Marcus Chen - Near the Research Lab
    { pos: { x: 3.8, y: 0.3, z: 2.8 }, rotY: -Math.PI * 0.6 },
    // 3. Lt. Mateo Alvarez - Near the Solar Array inspection pad
    { pos: { x: -1.6, y: 0.3, z: 2.2 }, rotY: Math.PI * 0.35 },
    // 4. Dr. Sarah Lindqvist - Standing right beside Greenhouse Beta stairs (matches reference image!)
    { pos: { x: 2.4, y: 0.3, z: 5.2 }, rotY: -Math.PI * 0.25 },
  ];

  const animatedAstronauts = [];

  MISSION_DATA.crew.forEach((crewMember, idx) => {
    const config = crewPositions[idx];
    const astronaut = buildAstronaut(crewMember, config.pos, config.rotY);
    group.add(astronaut);
    animatedAstronauts.push(astronaut);
  });

  return {
    group,
    astronauts: animatedAstronauts,
  };
}
