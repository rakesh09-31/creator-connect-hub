import { chromium } from 'playwright';

async function listReturnedCards() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto('http://localhost:8081/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.fill('input[type="email"]', 'creator_1789410388281@testomnicraft.dev');
  await page.fill('input[type="password"]', 'TestPassword123!#');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);

  await page.goto('http://localhost:8081/omniforge', { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(3000);

  const chatInput = page.locator('input[placeholder*="Ask a question"], input[placeholder*="Describe your business"], form input[type="text"]').first();
  await chatInput.fill('find video editors');
  const sendBtn = page.locator('form button[type="submit"]').last();
  await sendBtn.click();

  const inviteButtons = page.locator('button:has-text("Invite")');
  await inviteButtons.first().waitFor({ state: 'visible', timeout: 35000 });
  await page.waitForTimeout(2000);

  // Extract all creator names/handles from the cards
  const cards = page.locator('div:has(button:has-text("Invite")), div:has(button:has-text("Invite Pending"))');
  const count = await inviteButtons.count();
  console.log(`Found ${count} invite buttons.`);

  // Let's print the text of cards
  const cardTexts = await page.locator('span:has-text("@")').allInnerTexts();
  console.log('Creator handles found on page:', cardTexts);

  await browser.close();
}

listReturnedCards().catch(console.error);
