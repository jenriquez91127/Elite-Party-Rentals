const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const FILE = path.resolve(__dirname, 'index.html');
const OUT_DIR = path.resolve(__dirname, 'screenshots');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);

const VIEWPORTS = [
  { name: 'desktop',  width: 1440, height: 900  },
  { name: 'tablet',   width: 768,  height: 1024 },
  { name: 'mobile',   width: 390,  height: 844  },
];

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });

  for (const vp of VIEWPORTS) {
    const page = await browser.newPage();
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.goto(`file:///${FILE.replace(/\\/g, '/')}`, { waitUntil: 'networkidle0' });

    // Trigger all scroll-reveal elements (IntersectionObserver won't fire in headless)
    await page.evaluate(() => {
      document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
    });

    // Wait for fonts and animations to settle
    await new Promise(r => setTimeout(r, 1500));

    // Full-page screenshot
    const full = path.join(OUT_DIR, `${vp.name}-full.png`);
    await page.screenshot({ path: full, fullPage: true });
    console.log(`✓ ${vp.name} full-page  → screenshots/${vp.name}-full.png`);

    // Above-the-fold screenshot
    const fold = path.join(OUT_DIR, `${vp.name}-hero.png`);
    await page.screenshot({ path: fold, fullPage: false });
    console.log(`✓ ${vp.name} hero       → screenshots/${vp.name}-hero.png`);

    await page.close();
  }

  await browser.close();
  console.log('\nDone! All screenshots saved to /screenshots');
})();
