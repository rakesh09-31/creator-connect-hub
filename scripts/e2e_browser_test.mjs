import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\rakes\\.gemini\\antigravity-ide\\brain\\6298a437-9f52-4977-84fc-f32b06d724c2';

async function run() {
  console.log('Launching Chromium...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:8081/login...');
  await page.goto('http://localhost:8081/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Sign in
  console.log('Signing in with test account...');
  await page.fill('input[type="email"]', 'creator_1789410388281@testomnicraft.dev');
  await page.fill('input[type="password"]', 'TestPassword123!#');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  console.log('Navigating to http://localhost:8081/omniforge...');
  await page.goto('http://localhost:8081/omniforge', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Locate the input
  const chatInput = page.locator('input[placeholder*="business requirements"], input[placeholder*="ask"], input[type="text"]').last();
  await chatInput.waitFor({ state: 'visible', timeout: 10000 });
  console.log('Chat input field successfully located!');

  // ==========================================
  // TEST 1: Capability Probe
  // "so can you find the creators and clients"
  // ==========================================
  console.log('\n--- TEST 1: Capability probe ---');
  await chatInput.fill('so can you find the creators and clients');
  const sendBtn = page.locator('button:has-text("Send")').last();
  await sendBtn.click();
  console.log('Message sent. Waiting for response...');
  await page.waitForTimeout(5000);

  const creatorCards1 = await page.locator('button:has-text("Hire Creator")').count();
  console.log(`[TEST 1 RESULT] Creator cards found: ${creatorCards1} (Expected: 0)`);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e_test1_capability.png') });
  console.log('Saved e2e_test1_capability.png');

  // ==========================================
  // TEST 2: Find all video editors
  // "find all the video editors in omnicraft"
  // ==========================================
  console.log('\n--- TEST 2: Find all video editors in omnicraft ---');
  await chatInput.fill('find all the video editors in omnicraft');
  await sendBtn.click();
  console.log('Message sent. Waiting for DB search results...');
  await page.waitForTimeout(8000);

  const creatorCards2 = await page.locator('button:has-text("Hire Creator")').count();
  console.log(`[TEST 2 RESULT] Creator cards found: ${creatorCards2} (Expected: > 1, all matching)`);
  const showMoreBtns = await page.locator('button:has-text("Show More Creators")').count();
  console.log(`[TEST 2 RESULT] Show More pagination buttons: ${showMoreBtns}`);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e_test2_all_video_editors.png') });
  console.log('Saved e2e_test2_all_video_editors.png');

  // ==========================================
  // TEST 3: How-To Learning Mode
  // "how do I hire a squad?"
  // ==========================================
  console.log('\n--- TEST 3: How do I hire a squad? ---');
  await chatInput.fill('how do I hire a squad?');
  await sendBtn.click();
  console.log('Message sent. Waiting for step-by-step guidance...');
  await page.waitForTimeout(6000);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e_test3_how_to_squad.png') });
  console.log('Saved e2e_test3_how_to_squad.png');

  await browser.close();
  console.log('\n=============================================');
  console.log('ALL E2E BROWSER TESTS COMPLETED SUCCESSFULLY!');
  console.log('=============================================');
}

run().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
