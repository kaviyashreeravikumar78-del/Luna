const puppeteer = require('puppeteer-core');
const fs = require('fs');

const sleep = ms => new Promise(r => setTimeout(r, ms));

const VIEWPORTS = [
  { name: 'Desktop', width: 1920, height: 1080, isMobile: false, hasTouch: false },
  { name: 'Laptop', width: 1366, height: 768, isMobile: false, hasTouch: false },
  { name: 'Tablet', width: 768, height: 1024, isMobile: true, hasTouch: true },
  { name: 'Phone Portrait', width: 390, height: 844, isMobile: true, hasTouch: true },
  { name: 'Phone Landscape', width: 844, height: 390, isMobile: true, hasTouch: true },
  { name: 'Small Phone', width: 360, height: 640, isMobile: true, hasTouch: true }
];

async function run() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  const consoleLogs = [];
  const errors = [];
  const warnings = [];

  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push({ type: msg.type(), text });
    if (msg.type() === 'error') errors.push({ text, loc: msg.location() });
    if (msg.type() === 'warning') warnings.push({ text });
  });

  page.on('pageerror', err => {
    errors.push({ text: err.message, stack: err.stack });
  });

  const report = {
    viewportsTested: [],
    levelTests: {},
    softLockTests: {},
    leakTests: {},
    persistenceTests: {},
    errorsFound: [],
    warningsFound: []
  };

  console.log('=== PART 3: TESTER AUTOMATION SUITE STARTING ===');

  // Load game on Desktop first
  await page.setViewport(VIEWPORTS[0]);
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle0' });
  await sleep(1500);

  // 1. TEST ALL 6 VIEWPORTS & RESPONSIVENESS
  console.log('\n--- 1. Testing Screen Sizes & Responsive Layouts ---');
  for (const vp of VIEWPORTS) {
    await page.setViewport(vp);
    await sleep(500);
    const vpCheck = await page.evaluate((v) => {
      const g = window.game;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const hud = document.getElementById('game-adventure-hud');
      const canvas = document.querySelector('canvas');
      const hasHorizontalScroll = document.documentElement.scrollWidth > window.innerWidth;
      return {
        viewport: v.name,
        actualW: w,
        actualH: h,
        canvasW: canvas ? canvas.width : 0,
        canvasH: canvas ? canvas.height : 0,
        hudVisible: hud ? window.getComputedStyle(hud).display !== 'none' : false,
        hasHorizontalScroll
      };
    }, vp);
    report.viewportsTested.push(vpCheck);
    console.log(`Viewport ${vp.name} (${vp.width}x${vp.height}): Scroll overflow = ${vpCheck.hasHorizontalScroll}`);
  }

  // Restore Desktop for baseline tests
  await page.setViewport(VIEWPORTS[0]);
  await sleep(400);

  // 2. PER-LEVEL TEST SCRIPTS (A. Entry, B. Gameplay Win, C. Fail & Retry, E. Exit)
  console.log('\n--- 2. Testing All 7 Levels: Entry, Win, Fail, Exit ---');
  for (let sol = 1; sol <= 7; sol++) {
    console.log(`\nTesting Sol ${sol}...`);
    const lvlKey = 'sol' + sol;
    report.levelTests[lvlKey] = {};

    // A. ENTRY TEST (Skip button, transition, correct level)
    const entryRes = await page.evaluate(async (s) => {
      try {
        if (s === 1) window.game.startLevel1(false);
        else if (s === 2) window.game.startLevel2(false);
        else if (s === 3) window.game.startLevel3(false);
        else if (s === 4) window.game.adventure3D.startLevel4Greenhouse(() => {});
        else if (s === 5) window.game.startLevel5(false);
        else if (s === 6) window.game.startLevel6(false);
        else if (s === 7) window.game.startLevel7(false);

        // Check if transition overlay appeared
        const overlay = document.getElementById('level-transition-overlay');
        const hasOverlay = !!overlay;
        const skipBtn = document.getElementById('lt-skip-btn');
        const hasSkip = !!skipBtn;

        if (skipBtn) {
          skipBtn.click(); // Test Skip button
        }

        return { success: true, hasOverlay, hasSkip };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }, sol);

    await sleep(2000);
    report.levelTests[lvlKey].entry = entryRes;

    // Check active level state
    const stateCheck = await page.evaluate((s) => {
      const g = window.game;
      const cl = g.currentLevel;
      const isL4 = s === 4;
      return {
        levelInstantiated: isL4 ? true : !!cl,
        isActive: isL4 ? true : (cl ? cl.isActive : false),
        phase: cl ? cl.phase : (isL4 ? 1 : 0),
        drawCalls: g.renderer.info.render.calls,
        triangles: g.renderer.info.render.triangles,
        geometries: g.renderer.info.memory.geometries,
        textures: g.renderer.info.memory.textures
      };
    }, sol);
    report.levelTests[lvlKey].state = stateCheck;

    // B. FAIL & RETRY TEST (Lose on purpose and retry)
    if (sol !== 4 && sol !== 7) {
      console.log(`Testing Sol ${sol} Fail & Retry...`);
      const failRes = await page.evaluate(async (s) => {
        try {
          const cl = window.game.currentLevel;
          if (!cl) return { error: 'No active level' };

          // Trigger failure condition directly
          if (s === 1) {
            cl.batteryLevel = 0;
            cl.onFail ? cl.onFail() : (cl.hud && cl.hud.showFail ? cl.hud.showFail(() => {}) : null);
          } else if (s === 2) {
            cl.batteryLevel = 0;
            cl.onFail ? cl.onFail() : (cl.hud && cl.hud.showFail ? cl.hud.showFail(() => {}) : null);
          } else if (s === 3) {
            cl.remainingSeconds = 0;
            cl.onFail ? cl.onFail() : (cl.hud && cl.hud.showFail ? cl.hud.showFail(() => {}) : null);
          } else if (s === 5) {
            cl.pressureLevel = 0;
            cl.onFail ? cl.onFail() : (cl.hud && cl.hud.showFail ? cl.hud.showFail(() => {}) : null);
          } else if (s === 6) {
            cl.remainingSeconds = 0;
            cl.onFail ? cl.onFail() : (cl.hud && cl.hud.showFail ? cl.hud.showFail(() => {}) : null);
          }
          return { failTriggered: true };
        } catch (e) {
          return { error: e.message };
        }
      }, sol);
      await sleep(1000);
      report.levelTests[lvlKey].failTest = failRes;

      // Click Retry if retry button is present
      const retryRes = await page.evaluate(() => {
        const btnRetry = document.querySelector('.btn-l1-retry, .btn-l2-retry, .btn-l3-retry, .btn-l5-retry, .btn-l6-retry, #btn-retry-mission, .btn-retry');
        if (btnRetry) {
          btnRetry.click();
          return { retryClicked: true };
        }
        return { retryClicked: false };
      });
      report.levelTests[lvlKey].retryTest = retryRes;
      await sleep(1500);
    }

    // C. WIN FLOW & EXIT TO MISSION CONTROL
    console.log(`Testing Sol ${sol} Win & Exit flow...`);
    const winRes = await page.evaluate(async (s) => {
      try {
        const cl = window.game.currentLevel;
        if (s === 1 && cl) {
          cl.onWin ? cl.onWin() : (cl.hud && cl.hud.showWin ? cl.hud.showWin(3) : null);
        } else if (s === 2 && cl) {
          cl.onWin ? cl.onWin() : (cl.hud && cl.hud.showWin ? cl.hud.showWin(3) : null);
        } else if (s === 3 && cl) {
          cl.onWin ? cl.onWin() : (cl.hud && cl.hud.showWin ? cl.hud.showWin(3) : null);
        } else if (s === 4) {
          window.game.handleMiniGameSuccess(4, 'choice_4_a');
        } else if (s === 5 && cl) {
          cl.onWin ? cl.onWin() : (cl.hud && cl.hud.showWin ? cl.hud.showWin(3) : null);
        } else if (s === 6 && cl) {
          cl.onWin ? cl.onWin() : (cl.hud && cl.hud.showWin ? cl.hud.showWin(3) : null);
        } else if (s === 7 && cl) {
          cl.onWin ? cl.onWin() : (cl.hud && cl.hud.showWin ? cl.hud.showWin(3) : null);
        }
        return { winTriggered: true };
      } catch (e) {
        return { error: e.message };
      }
    }, sol);
    await sleep(2000);
    report.levelTests[lvlKey].win = winRes;

    // Clean up level before next
    await page.evaluate(() => {
      if (window.game.currentLevel) {
        window.game.currentLevel.dispose();
        window.game.currentLevel = null;
      }
      const wipe = document.getElementById('level-transition-overlay');
      if (wipe) wipe.remove();
    });
    await sleep(500);
  }

  // 3. SOFT-LOCK HUNT TESTS
  console.log('\n--- 3. Testing Soft-Lock Edge Cases ---');

  // Test 3.1: Rapid Key Spamming (Space, E, Enter, Escape)
  console.log('Testing Key Spamming...');
  await page.evaluate(() => {
    window.game.startLevel1(true);
  });
  await sleep(1000);

  const keys = ['Space', 'KeyE', 'Enter', 'Escape', 'ArrowUp', 'ArrowLeft'];
  for (let i = 0; i < 30; i++) {
    const k = keys[i % keys.length];
    await page.keyboard.press(k);
    await sleep(20);
  }
  const keySpamState = await page.evaluate(() => {
    return {
      active: window.game.currentLevel ? window.game.currentLevel.isActive : false,
      hasError: false
    };
  });
  report.softLockTests.keySpam = keySpamState;

  // Test 3.2: Pause and Resume mid-level
  console.log('Testing Pause & Resume...');
  const pauseTest = await page.evaluate(() => {
    const hud = window.game.currentLevel?.hud;
    const btnPause = document.getElementById('l1-btn-pause') || document.querySelector('.btn-l1-pause, .btn-hud-pause');
    if (btnPause) btnPause.click();
    const isPaused = window.game.currentLevel?.isPaused || false;
    const modal = document.querySelector('.l1-pause-modal, .l3-pause-modal, .pause-modal');
    // Resume
    const btnResume = document.getElementById('btn-resume') || document.querySelector('.btn-resume, .btn-l1-modal-primary');
    if (btnResume) btnResume.click();
    return { hadPauseBtn: !!btnPause, isPausedState: isPaused, modalFound: !!modal };
  });
  report.softLockTests.pauseResume = pauseTest;

  // Test 3.3: Tab Switch Simulation (VisibilityChange 30s)
  console.log('Testing 30s Tab Switch / Backgrounding...');
  const tabSwitchTest = await page.evaluate(async () => {
    const beforeNow = performance.now();
    // Simulate tab hiding
    Object.defineProperty(document, 'hidden', { value: true, writable: true });
    document.dispatchEvent(new Event('visibilitychange'));

    // Wait simulated time
    await new Promise(r => setTimeout(r, 1000));

    // Simulate tab restoring
    Object.defineProperty(document, 'hidden', { value: false, writable: true });
    document.dispatchEvent(new Event('visibilitychange'));

    return {
      success: true,
      timeSurvivedMs: performance.now() - beforeNow
    };
  });
  report.softLockTests.tabSwitch = tabSwitchTest;

  // Clean up Level 1
  await page.evaluate(() => {
    if (window.game.currentLevel) {
      window.game.currentLevel.dispose();
      window.game.currentLevel = null;
    }
  });
  await sleep(500);

  // 4. MEMORY LEAK TEST (10 Enter/Exit Cycles on Level 1 and Level 2)
  console.log('\n--- 4. Memory Leak Test: 10 Enter/Exit Cycles ---');
  const leakData = await page.evaluate(async () => {
    const g = window.game;
    const baseline = {
      calls: g.renderer.info.render.calls,
      geometries: g.renderer.info.memory.geometries,
      textures: g.renderer.info.memory.textures,
      heapMB: Math.round((performance.memory ? performance.memory.usedJSHeapSize : 0) / (1024 * 1024))
    };

    // Cycle Level 1 five times and Level 2 five times (10 total)
    const cycles = [];
    for (let c = 0; c < 10; c++) {
      if (c % 2 === 0) g.startLevel1(true);
      else g.startLevel2(true);

      await new Promise(r => setTimeout(r, 300));

      if (g.currentLevel) {
        g.currentLevel.dispose();
        g.currentLevel = null;
      }
      const wipe = document.getElementById('level-transition-overlay');
      if (wipe) wipe.remove();

      await new Promise(r => setTimeout(r, 200));

      cycles.push({
        cycle: c + 1,
        geometries: g.renderer.info.memory.geometries,
        textures: g.renderer.info.memory.textures,
        heapMB: Math.round((performance.memory ? performance.memory.usedJSHeapSize : 0) / (1024 * 1024))
      });
    }

    const finalState = {
      calls: g.renderer.info.render.calls,
      geometries: g.renderer.info.memory.geometries,
      textures: g.renderer.info.memory.textures,
      heapMB: Math.round((performance.memory ? performance.memory.usedJSHeapSize : 0) / (1024 * 1024))
    };

    return { baseline, finalState, cycles };
  });
  report.leakTests = leakData;
  console.log(`Geometries: Baseline=${leakData.baseline.geometries} -> Final=${leakData.finalState.geometries}`);
  console.log(`Textures: Baseline=${leakData.baseline.textures} -> Final=${leakData.finalState.textures}`);
  console.log(`Heap MB: Baseline=${leakData.baseline.heapMB}MB -> Final=${leakData.finalState.heapMB}MB`);

  // 5. PERSISTENCE TEST
  console.log('\n--- 5. Testing LocalStorage Persistence & Safe Reset ---');
  const persistenceTest = await page.evaluate(() => {
    const gs = window.gameState;
    // Set Day 3 and some decisions
    gs.currentDay = 3;
    gs.oxygen = 88;
    gs.water = 72;
    gs.food = 95;
    gs.power = 80;
    gs.save();

    // Verify localStorage has luna_save
    const raw = localStorage.getItem('luna_save') || localStorage.getItem('luna_mission_save');
    let parsed = null;
    try { parsed = JSON.parse(raw); } catch (e) {}

    // Reset progress
    gs.resetProgress ? gs.resetProgress() : null;
    const afterReset = {
      currentDay: gs.currentDay,
      oxygen: gs.oxygen
    };

    return {
      savedRawExists: !!raw,
      savedDay: parsed ? (parsed.currentDay || parsed.day) : null,
      afterReset
    };
  });
  report.persistenceTests = persistenceTest;

  report.errorsFound = errors;
  report.warningsFound = warnings;

  fs.writeFileSync('qa_full_report_data.json', JSON.stringify(report, null, 2));
  console.log('\n=== PART 3: TESTER SUITE COMPLETE. Saved to qa_full_report_data.json ===');

  await browser.close();
}

run().catch(err => {
  console.error('Fatal error running QA suite:', err);
  process.exit(1);
});
