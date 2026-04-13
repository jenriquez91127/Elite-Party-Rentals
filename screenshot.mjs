import puppeteer, { KnownDevices } from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Usage:
//   node screenshot.mjs <url> [label]           — desktop 1280x900
//   node screenshot.mjs <url> [label] --mobile  — iPhone 13 emulation
//   node screenshot.mjs <url> [label] --both    — desktop + mobile, two files

const rawArgs  = process.argv.slice(2);
const flags    = rawArgs.filter(a => a.startsWith('--'));
const rest     = rawArgs.filter(a => !a.startsWith('--'));
const url      = rest[0] || 'http://localhost:3000';
const label    = rest[1] || '';

const mobileOnly = flags.includes('--mobile');
const both       = flags.includes('--both');

const iPhone = KnownDevices['iPhone 13'];

const screenshotDir = path.join(__dirname, 'temporary screenshots');
if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir);

function nextIndex() {
  const files = fs.readdirSync(screenshotDir);
  const nums = files.map(f => { const m = f.match(/^screenshot-(\d+)/); return m ? parseInt(m[1]) : 0; });
  return nums.length ? Math.max(...nums) + 1 : 1;
}

async function shoot(page, mode, idx) {
  if (mode === 'mobile') {
    await page.emulate(iPhone);
  } else {
    await page.setViewport({ width: 1280, height: 900 });
  }

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 800));
  // Force scroll-reveal elements visible (IntersectionObserver doesn't fire in headless)
  await page.evaluate(() => {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
  });

  const parts = ['screenshot', String(idx), mode];
  if (label) parts.push(label);
  const outPath = path.join(screenshotDir, parts.join('-') + '.png');

  await page.screenshot({ path: outPath, fullPage: true });
  console.log(`Saved: ${outPath}`);
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Users\\Juan\\.cache\\puppeteer\\chrome\\win64-146.0.7680.153\\chrome-win64\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  let idx = nextIndex();

  if (both) {
    await shoot(page, 'desktop', idx++);
    await shoot(page, 'mobile',  idx);
  } else if (mobileOnly) {
    await shoot(page, 'mobile', idx);
  } else {
    await shoot(page, 'desktop', idx);
  }

  await browser.close();
})();
