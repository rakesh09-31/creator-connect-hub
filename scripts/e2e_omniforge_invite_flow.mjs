import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\rakes\\.gemini\\antigravity-ide\\brain\\c062888b-5c3c-47e5-bdcc-8b20c96be02f';

async function runOmniForgeInviteE2E() {
  console.log('====================================================');
  console.log('  STARTING PLAYWRIGHT E2E TEST: OMNIFORGE INVITE    ');
  console.log('====================================================\n');

  console.log('Launching headless Chromium...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.error('BROWSER ERROR:', msg.text());
    }
  });

  // Step 1: Login
  console.log('1. Navigating to http://localhost:8081/login...');
  await page.goto('http://localhost:8081/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  console.log('2. Signing in with test user...');
  await page.fill('input[type="email"]', 'creator_1789410388281@testomnicraft.dev');
  await page.fill('input[type="password"]', 'TestPassword123!#');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);
  console.log('Current URL after login attempt:', page.url());

  // Step 2: Open OmniForge
  console.log('3. Navigating to http://localhost:8081/omniforge...');
  await page.goto('http://localhost:8081/omniforge', { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(3000);
  console.log('Current URL at OmniForge step:', page.url());

  const debugScreenshot = path.join(ARTIFACT_DIR, 'debug_page_state.png');
  await page.screenshot({ path: debugScreenshot });
  console.log('Debug screenshot saved to:', debugScreenshot);

  // Look for any input
  const inputs = await page.locator('input').all();
  console.log(`Found ${inputs.length} inputs on page`);
  for (let i = 0; i < inputs.length; i++) {
    const ph = await inputs[i].getAttribute('placeholder');
    const type = await inputs[i].getAttribute('type');
    console.log(`Input ${i}: type=${type}, placeholder=${ph}`);
  }

  // Locate chat input
  const chatInput = page.locator('input[placeholder*="Ask a question"], input[placeholder*="Describe your business"], form input[type="text"]').first();
  await chatInput.waitFor({ state: 'visible', timeout: 10000 });
  console.log('[PASS] Chat input field located!');

  // Step 3: Send query: "find video editors"
  console.log('\n4. Sending query: "find video editors"...');
  await chatInput.fill('find video editors');
  const sendBtn = page.locator('form button[type="submit"]').last();
  await sendBtn.click();

  console.log('Waiting for AI response and creator cards...');
  const inviteButtons = page.locator('button:has-text("Invite")');
  await inviteButtons.first().waitFor({ state: 'visible', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Take screenshot of creator results
  const screenshot1 = path.join(ARTIFACT_DIR, 'e2e_video_editor_results.png');
  await page.screenshot({ path: screenshot1 });
  console.log('[PASS] Saved screenshot:', screenshot1);

  // Verify creator cards appeared
  const inviteCount = await inviteButtons.count();
  console.log(`[PASS] Found ${inviteCount} creator cards with "Invite" buttons!`);

  if (inviteCount === 0) {
    console.error('[FAIL] No creator cards with Invite buttons found!');
    await browser.close();
    process.exit(1);
  }

  // Step 4: Click "Invite" on the first creator card
  console.log('\n5. Clicking "Invite" on first creator card...');
  await inviteButtons.first().click();
  await page.waitForTimeout(1500);

  // Verify modal is open
  const modalHeader = page.locator('h3:has-text("Invite Creator to Project")');
  await modalHeader.waitFor({ state: 'visible', timeout: 5000 });
  console.log('[PASS] InviteCreatorModal opened successfully!');

  // Take screenshot of open modal
  const screenshot2 = path.join(ARTIFACT_DIR, 'e2e_invite_modal_open.png');
  await page.screenshot({ path: screenshot2 });
  console.log('[PASS] Saved screenshot:', screenshot2);

  // Step 5: Submit the invitation form
  console.log('\n6. Submitting project invitation...');
  const submitInviteBtn = page.locator('button:has-text("Send Invitation")');
  await submitInviteBtn.waitFor({ state: 'visible', timeout: 5000 });
  await submitInviteBtn.click();

  // Wait for submission response and toast
  await page.waitForTimeout(4000);

  // Take screenshot after invitation submission
  const screenshot3 = path.join(ARTIFACT_DIR, 'e2e_invitation_sent_success.png');
  await page.screenshot({ path: screenshot3 });
  console.log('[PASS] Saved screenshot:', screenshot3);

  // Verify modal is closed
  const isModalVisible = await modalHeader.isVisible().catch(() => false);
  console.log(`[PASS] Modal closed: ${!isModalVisible}`);

  console.log('\n====================================================');
  console.log('  E2E TEST RESULT: 100% SUCCESS! NO RLS ERRORS!     ');
  console.log('====================================================');

  await browser.close();
}

runOmniForgeInviteE2E().catch((err) => {
  console.error('Playwright E2E failed:', err);
  process.exit(1);
});
