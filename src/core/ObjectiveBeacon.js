import * as THREE from 'three';

/**
 * Animated 3D Objective Beacon
 * A pulsing glowing cyan/amber ring on the ground with a bobbing floating arrow (▼)
 * clearly marking where the player needs to walk or interact.
 */
export class ObjectiveBeacon {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = "ObjectiveBeacon";
    this.group.visible = false;

    // 1. Ground Pulsing Ring
    const ringGeo = new THREE.TorusGeometry(1.3, 0.09, 12, 32);
    this.ringMat = new THREE.MeshBasicMaterial({
      color: 0x00E5FF,
      transparent: true,
      opacity: 0.85
    });
    this.ring = new THREE.Mesh(ringGeo, this.ringMat);
    this.ring.rotation.x = Math.PI / 2;
    this.ring.position.y = 0.08;
    this.group.add(this.ring);

    // 2. Inner glow disc
    const discGeo = new THREE.CircleGeometry(1.25, 32);
    this.discMat = new THREE.MeshBasicMaterial({
      color: 0x00E5FF,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide
    });
    this.disc = new THREE.Mesh(discGeo, this.discMat);
    this.disc.rotation.x = -Math.PI / 2;
    this.disc.position.y = 0.04;
    this.group.add(this.disc);

    // 3. Floating Bouncing 3D Chevron Arrow (pointing down)
    const arrowGeo = new THREE.ConeGeometry(0.35, 0.8, 16);
    this.arrowMat = new THREE.MeshStandardMaterial({
      color: 0xFFD166,
      emissive: 0xFFA500,
      emissiveIntensity: 0.6,
      roughness: 0.3,
      metalness: 0.8
    });
    this.arrow = new THREE.Mesh(arrowGeo, this.arrowMat);
    this.arrow.rotation.x = Math.PI; // point down
    this.arrow.position.y = 2.4;
    this.group.add(this.arrow);

    this.scene.add(this.group);
  }

  setPosition(x, y, z) {
    this.group.position.set(x, y, z);
  }

  showAt(x, y, z, color = 0x00E5FF) {
    this.group.position.set(x, y, z);
    this.setColor(color);
    this.group.visible = true;
  }

  hide() {
    this.group.visible = false;
  }

  setColor(hex) {
    this.ringMat.color.setHex(hex);
    this.discMat.color.setHex(hex);
  }

  update(delta, elapsedTime) {
    if (!this.group.visible) return;

    // Pulse ring size & opacity
    const pulse = Math.sin(elapsedTime * 4.0) * 0.12 + 1.0;
    this.ring.scale.set(pulse, pulse, 1);
    this.disc.scale.set(pulse, pulse, 1);
    this.ringMat.opacity = 0.75 + Math.sin(elapsedTime * 4.0) * 0.2;

    // Bob floating arrow
    this.arrow.position.y = 2.3 + Math.sin(elapsedTime * 3.5) * 0.3;
    this.arrow.rotation.y = elapsedTime * 2.0;
  }

  dispose() {
    if (this.group.parent) {
      this.group.parent.remove(this.group);
    }
    this.ring.geometry.dispose();
    this.ringMat.dispose();
    this.disc.geometry.dispose();
    this.discMat.dispose();
    this.arrow.geometry.dispose();
    this.arrowMat.dispose();
  }
}

/**
 * Animated click-to-move / tap-to-walk ripple effect on the 3D terrain
 */
export class ClickRippleEffect {
  constructor(scene) {
    this.scene = scene;
    this.ripples = [];
    this.geo = new THREE.RingGeometry(0.1, 0.45, 32);
    this.mat = new THREE.MeshBasicMaterial({
      color: 0x00E5FF,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });
  }

  spawn(x, y, z) {
    const mesh = new THREE.Mesh(this.geo, this.mat.clone());
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, y + 0.05, z);
    mesh.userData = { age: 0, maxAge: 0.45 };
    this.scene.add(mesh);
    this.ripples.push(mesh);
  }

  update(delta) {
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.userData.age += delta;
      const progress = r.userData.age / r.userData.maxAge;
      if (progress >= 1.0) {
        this.scene.remove(r);
        r.material.dispose();
        this.ripples.splice(i, 1);
      } else {
        const scale = 1.0 + progress * 2.4;
        r.scale.set(scale, scale, 1);
        r.material.opacity = (1.0 - progress) * 0.9;
      }
    }
  }

  dispose() {
    this.ripples.forEach(r => {
      this.scene.remove(r);
      r.material.dispose();
    });
    this.ripples = [];
    this.geo.dispose();
    this.mat.dispose();
  }
}
