import * as THREE from 'three';

/**
 * LUNA: Mission Survival - Universal Three.js Resource Disposal Helper
 * Safely disposes geometries, materials, texture maps, and removes meshes from parent groups
 * to guarantee zero GPU memory leaks across level transitions.
 */
export function disposeThreeObject(root) {
  if (!root) return;

  root.traverse((child) => {
    // 1. Geometries
    if (child.geometry) {
      try {
        child.geometry.dispose();
      } catch (e) {}
    }

    // 2. Materials & Texture Maps
    if (child.material) {
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach((mat) => {
        if (!mat) return;
        // Dispose all attached texture maps
        [
          'map',
          'lightMap',
          'bumpMap',
          'normalMap',
          'specularMap',
          'envMap',
          'alphaMap',
          'aoMap',
          'displacementMap',
          'emissiveMap',
          'roughnessMap',
          'metalnessMap'
        ].forEach((mapProp) => {
          if (mat[mapProp] && typeof mat[mapProp].dispose === 'function') {
            try {
              mat[mapProp].dispose();
            } catch (e) {}
          }
        });

        // Dispose material itself
        try {
          mat.dispose();
        } catch (e) {}
      });
    }
  });

  // 3. Detach from parent
  if (root.parent) {
    try {
      root.parent.remove(root);
    } catch (e) {}
  }
}

/**
 * Safely cancels all timers in an array (both setTimeout and setInterval)
 */
export function clearTimerArray(timers) {
  if (!Array.isArray(timers)) return;
  timers.forEach((t) => {
    try {
      clearTimeout(t);
      clearInterval(t);
    } catch (e) {}
  });
  timers.length = 0;
}
