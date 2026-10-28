import { chromium } from 'playwright';

async function debugInviteFailure() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', (msg) => {
    console.log(`[BROWSER ${msg.type().toUpperCase()}]:`, msg.text());
  });

  page.on('response', async (response) => {
    if (response.status() >= 400) {
      console.log(`[HTTP ERROR ${response.status()}]: ${response.url()}`);
      try {
        const body = await response.text();
        console.log(`[RESPONSE BODY]:`, body);
      } catch (e) {}
    }
  });

  // Login
  await page.goto('http://localhost:8081/login', { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="email"]', 'creator_1789410388281@testomnicraft.dev');
  await page.fill('input[type="password"]', 'TestPassword123!#');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  // Navigate to omniforge
  await page.goto('http://localhost:8081/omniforge', { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(3000);

  const chatInput = page.locator('input[placeholder*="Ask a question"], input[placeholder*="Describe your business"], form input[type="text"]').first();
  await chatInput.fill('find video editors');
  const sendBtn = page.locator('form button[type="submit"]').last();
  await sendBtn.click();

  const inviteButtons = page.locator('button:has-text("Invite")');
  await inviteButtons.first().waitFor({ state: 'visible', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Click invite on first card
  await inviteButtons.first().click();
  await page.waitForTimeout(1000);

  // Click submit
  const submitInviteBtn = page.locator('button:has-text("Send Invitation")');
  await submitInviteBtn.click();
  await page.waitForTimeout(4000);

  await browser.close();
}

debugInviteFailure().catch(console.error);
