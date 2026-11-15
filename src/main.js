import { Game } from './game/Game.js';
import { orbit } from './components/Orbit.js';
import './styles/style.css';

window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('canvas-container');
  if (!container) {
    console.error('Canvas mount container #canvas-container not found!');
    return;
  }

  try {
    const game = new Game(container);
    window.game = game; // Expose on window for convenience
    window.LUNA_GAME = game; // Expose on window for debugging & tests
    window.gameState = game.gameState; // Expose simulation GameState for tests
    window.ORBIT = orbit; // Expose ORBIT companion globally
    console.log('🚀 LUNA: Mission Survival initialized successfully in 3D with Three.js.');
  } catch (err) {
    console.error('Critical failure launching LUNA 3D engine:', err);
    container.innerHTML = `
      <div style="color: white; padding: 2rem; font-family: sans-serif; text-align: center;">
        <h2>Engine Initialization Error</h2>
        <p>${err.message}</p>
      </div>
    `;
  }
});
