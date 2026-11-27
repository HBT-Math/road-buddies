// Browser smoke test (dev only, needs Playwright):  npm run e2e
// Serves the game, makes a player, plays World 1 to the end, then checks the game reloads with the network off.
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  const file = fs.existsSync(p) && fs.statSync(p).isDirectory() ? path.join(p, 'index.html') : p;
  if (!file.startsWith(ROOT) || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

const check = (ok, msg) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) process.exitCode = 1; };

server.listen(0, async () => {
  const url = `http://localhost:${server.address().port}/?debug`;
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1024, height: 768 }, hasTouch: true });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(url);
    check(await page.title() === 'Enrich Program - Rayhan School', 'page title');
    await page.waitForSelector('.presents img');
    check(await page.locator('.presents img').count() >= 1, 'opening shows the logos');
    await page.mouse.click(5, 5);
    await page.locator('.face-card').first().click();
    await page.locator('.swatch').nth(3).click();
    await page.locator('.big-go').click({ force: true });
    await page.locator('.theme-card').first().click();
    await page.waitForSelector('.hub-card');
    check(await page.locator('.hub-card').count() === 4, 'home hub shows 4 games');
    await page.locator('.hub-card').first().click();
    await page.waitForSelector('.world-node');
    check(await page.locator('.world-node').count() === 7, 'world map shows 7 worlds');
    await page.locator('.world-node').first().click({ force: true });

    // play the whole world: steer with the keyboard to the right gate each time
    const st = () => page.evaluate(() => { const s = window.roadBuddies.view.debug?.world.state; return s && { phase: s.phase, lane: s.lane, values: s.gate?.values, answer: s.gate?.q.answer }; });
    let gates = 0;
    while (gates < 12) {
      await page.waitForFunction(() => { const s = window.roadBuddies.view.debug?.world.state; return !s || s.phase === 'hold' || s.phase === 'ended'; }, null, { timeout: 30000 });
      const s = await st();
      if (!s || s.phase === 'ended') break;
      const target = s.values.indexOf(s.answer) - 1;
      for (let l = s.lane; l !== target; l += Math.sign(target - l)) await page.keyboard.press(target > l ? 'ArrowRight' : 'ArrowLeft');
      await page.keyboard.press('ArrowUp');
      await page.waitForFunction(() => window.roadBuddies.view.debug?.world.state.phase !== 'hold', null, { timeout: 10000 });
      gates++;
    }
    await page.waitForSelector('.results', { timeout: 30000 });
    check(gates === 10, `played 10 gates (${gates})`);
    check(await page.locator('.big-stars .star.on').count() === 3, '3 stars for 10 first-try answers');
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('roadbuddies.v1')).profiles[0].progress.pack1.p1w1.stars);
    check(saved === 3, 'progress saved');

    // offline: wait for the service worker, cut the network, reload
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await page.waitForFunction(() => navigator.serviceWorker.controller, null, { timeout: 10000 });
    await context.setOffline(true);
    await page.reload();
    await page.waitForSelector('.presents', { timeout: 10000 });
    await page.mouse.click(5, 5);
    await page.waitForSelector('.hub-card', { timeout: 5000 });
    check(true, 'game loads and runs offline');
    await context.setOffline(false);
    check(errors.length === 0, `no page errors${errors.length ? ': ' + errors.join(' | ') : ''}`);
  } catch (e) {
    check(false, e.message.split('\n')[0]);
  } finally {
    await browser.close();
    server.close();
  }
});
