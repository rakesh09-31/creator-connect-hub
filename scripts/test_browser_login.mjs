import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\rakes\\.gemini\\antigravity-ide\\brain\\8dccd48b-d19e-4218-a5f9-9d51e5b85396';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  console.log('Navigating to login...');
  await page.goto('http://localhost:8081/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  await page.fill('input[type="email"]', 'creator_1789410388281@testomnicraft.dev');
  await page.fill('input[type="password"]', 'TestPassword123!#');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);

  console.log('Navigating to omniforge...');
  await page.goto('http://localhost:8081/omniforge', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  console.log('URL:', page.url());
  const inputs = await page.locator('input').all();
  console.log('Inputs found:', inputs.length);
  for (let i = 0; i < inputs.length; i++) {
    const ph = await inputs[i].getAttribute('placeholder');
    const type = await inputs[i].getAttribute('type');
    console.log(`Input ${i}: type=${type}, placeholder=${ph}`);
  }

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'debug_omniforge_page.png') });
  console.log('Screenshot saved: debug_omniforge_page.png');

  await browser.close();
}

run();
