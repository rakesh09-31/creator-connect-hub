import { chromium } from 'playwright';

async function testLogin() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:8081/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await page.fill('input[type="email"]', 'creator_1789410388281@testomnicraft.dev');
  await page.fill('input[type="password"]', 'TestPassword123!#');
  await page.click('button[type="submit"]');
  console.log('Clicked submit. Waiting for URL to change...');
  try {
    await page.waitForURL((url) => !url.href.includes('/login'), { timeout: 10000 });
    console.log('Successfully navigated after login to:', page.url());
  } catch (e) {
    console.log('URL after wait:', page.url());
    const errText = await page.locator('.text-destructive, [role="alert"], p.text-red-500').allInnerTexts();
    console.log('Alert text on page:', errText);
  }
  await page.goto('http://localhost:8081/omniforge', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  console.log('OmniForge URL:', page.url());
  await browser.close();
}

testLogin();
