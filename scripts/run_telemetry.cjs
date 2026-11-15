const puppeteer = require('puppeteer-core');
const fs = require('fs');

const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const errors = [];
  const warnings = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push({ text: msg.text(), loc: msg.location() });
    if (msg.type() === 'warning') warnings.push({ text: msg.text() });
  });
  page.on('pageerror', err => errors.push({ text: err.message }));

  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle0' });
  await sleep(1500);

  const results = {};

  async function samplePerf(name, durationFrames = 60) {
    return await page.evaluate(async (fCount) => {
      const g = window.game;
      const fTimes = [];
      let last = performance.now();
      for (let i = 0; i < fCount; i++) {
        await new Promise(r => requestAnimationFrame(r));
        const now = performance.now();
        fTimes.push(now - last);
        last = now;
      }
      const avg = 1000 / (fTimes.reduce((a, b) => a + b, 0) / fTimes.length);
      fTimes.sort((a, b) => b - a);
      const low1 = 1000 / fTimes[Math.floor(fTimes.length * 0.01) || 0];

      return {
        avgFps: Math.round(avg),
        low1Fps: Math.round(low1),
        calls: g.renderer.info.render.calls,
        triangles: g.renderer.info.render.triangles,
        geometries: g.renderer.info.memory.geometries,
        textures: g.renderer.info.memory.textures,
        heapMB: Math.round((performance.memory ? performance.memory.usedJSHeapSize : 0) / (1024 * 1024))
      };
    }, durationFrames);
  }

  // 1. Module 1: Colony View
  results.module1 = await samplePerf('Module 1 (Colony View)');

  // 2. Module 2: Mission Control
  await page.evaluate(() => {
    window.game.navigation.switchScreen('colony');
    window.game.missionControl.show();
  });
  await sleep(1200);
  results.missionControl = await samplePerf('Mission Control');

  // Close MC
  await page.evaluate(() => {
    window.game.missionControl.hide();
  });
  await sleep(500);

  // 3. Measure Levels 1 - 7
  for (let sol = 1; sol <= 7; sol++) {
    console.log('Testing Sol', sol);
    const startResult = await page.evaluate((s) => {
      try {
        if (s === 1) window.game.startLevel1(true);
        else if (s === 2) window.game.startLevel2(true);
        else if (s === 3) window.game.startLevel3(true);
        else if (s === 4) {
          window.game.adventure3D.startLevel4Greenhouse(() => {});
        }
        else if (s === 5) window.game.startLevel5(true);
        else if (s === 6) window.game.startLevel6(true);
        else if (s === 7) window.game.startLevel7(true);
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err.message, stack: err.stack };
      }
    }, sol);

    await sleep(2000);
    results['level' + sol] = {
      startResult,
      perf: await samplePerf('Level ' + sol)
    };

    // Clean up level before next
    await page.evaluate(() => {
      if (window.game.currentLevel) {
        window.game.currentLevel.dispose();
        window.game.currentLevel = null;
      }
      const wipe = document.getElementById('level-transition-overlay');
      if (wipe) wipe.remove();
    });
    await sleep(600);
  }

  results.errors = errors;
  results.warnings = warnings;

  fs.writeFileSync('telemetry_results.json', JSON.stringify(results, null, 2));
  console.log('Wrote telemetry_results.json successfully.');

  await browser.close();
})();
