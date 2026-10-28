import { chromium } from 'playwright';

async function testSteps() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:8081/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.fill('input[type="email"]', 'creator_1789410388281@testomnicraft.dev');
  await page.fill('input[type="password"]', 'TestPassword123!#');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);

  await page.goto('http://localhost:8081/omniforge', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

  const input = page.locator('form input[type="text"]').last();

  console.log('\n--- SENDING STEP 3: Find all cinema creators. ---');
  await input.fill('Find all cinema creators.');
  await input.press('Enter');
  await page.waitForTimeout(5000);

  let messages = await page.evaluate(() => Array.from(document.querySelectorAll('p, div, span')).filter(e => e.innerText && e.innerText.length > 20).map(e => e.innerText));
  console.log('STEP 3 TEXT (last 3):', messages.slice(-3));

  console.log('\n--- SENDING STEP 8: Choose the best hero. ---');
  await input.fill('Choose the best hero.');
  await input.press('Enter');
  await page.waitForTimeout(5000);

  messages = await page.evaluate(() => Array.from(document.querySelectorAll('p, div, span')).filter(e => e.innerText && e.innerText.length > 20).map(e => e.innerText));
  console.log('STEP 8 TEXT (last 3):', messages.slice(-3));

  await browser.close();
}

testSteps().catch(console.error);
