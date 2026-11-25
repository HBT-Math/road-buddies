// Writes assets/branding/icon-192.png and icon-512.png from the Enrich logo (or a placeholder star).
// Needs Playwright (dev only):  node tools/make-icons.cjs   (with a local server on :8080)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
(async () => {
  const base = process.argv[2] || 'http://localhost:8080';
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`${base}/tools/make-icons.html`);
  const { fromLogo, icons } = await page.evaluate(() => window.makeIcons());
  for (const [size, url] of Object.entries(icons)) {
    const file = path.join(__dirname, '..', 'assets', 'branding', `icon-${size}.png`);
    fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
    console.log('wrote', path.relative(process.cwd(), file));
  }
  console.log(fromLogo ? 'Made from the Enrich logo.' : 'Logo missing: wrote placeholder icons. Re-run after adding the logo.');
  await browser.close();
})();
