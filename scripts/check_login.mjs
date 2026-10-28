import { chromium } from 'playwright';

async function check() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:8081/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  console.log('Login URL:', page.url());
  await page.fill('input[type="email"]', 'creator_1789410388281@testomnicraft.dev');
  await page.fill('input[type="password"]', 'TestPassword123!#');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);
  console.log('After submit URL:', page.url());
  await page.goto('http://localhost:8081/omniforge', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  console.log('After omniforge URL:', page.url());
  const inputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input')).map(i => ({ type: i.type, placeholder: i.placeholder, id: i.id, className: i.className }));
  });
  console.log('Inputs found:', JSON.stringify(inputs, null, 2));
  await page.screenshot({ path: 'test_omniforge_login.png' });
  await browser.close();
}

check().catch(console.error);
