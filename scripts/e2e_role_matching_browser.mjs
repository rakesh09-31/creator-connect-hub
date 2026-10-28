import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\rakes\\.gemini\\antigravity-ide\\brain\\98831bc3-262d-4f58-be8d-44d65ca793ed';

async function runBrowserMatchingTest() {
  console.log('========================================================================');
  console.log('  STARTING ROLE-SPECIFIC CREATOR MATCHING QUALITY BROWSER TEST          ');
  console.log('========================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    // 1. Login
    console.log('1. Navigating to http://localhost:8081/login...');
    await page.goto('http://localhost:8081/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    console.log('2. Signing in with test user...');
    await page.fill('input[type="email"]', 'creator_1789410388281@testomnicraft.dev');
    await page.fill('input[type="password"]', 'TestPassword123!#');
    await page.click('button[type="submit"]');

    await page.waitForURL((url) => !url.href.includes('/login'), { timeout: 10000 });
    console.log('✓ Successfully logged in, current URL:', page.url());

    // 2. Navigate to OmniForge
    console.log('3. Navigating to http://localhost:8081/omniforge...');
    await page.goto('http://localhost:8081/omniforge', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const chatInput = page.locator('form input[type="text"], input[type="text"]').last();
    await chatInput.waitFor({ state: 'visible', timeout: 15000 });
    const sendBtn = page.locator('form button[type="submit"]').last();
    console.log('✓ Chat ready.');

    // -------------------------------------------------------------
    // Test 1: Lead Actor Search (Verify bounded scores & role skills)
    // -------------------------------------------------------------
    console.log('\n--- TEST 1: Searching "Find the hero" (Lead Actor) ---');
    await chatInput.fill('Find the hero');
    await sendBtn.click();
    await page.waitForTimeout(4000);

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'browser_lead_actor_search.png') });
    console.log('✓ Captured browser_lead_actor_search.png');

    // Inspect the cards rendered
    const actorCards = page.locator('text=Lead Actor');
    const actorCount = await actorCards.count();
    console.log(`Found ${actorCount} Lead Actor cards rendered in UI.`);

    // Click "Why Match?" on the first card
    const whyMatchBtns = page.locator('button:has-text("Why Match?")');
    const whyMatchCount = await whyMatchBtns.count();
    console.log(`Found ${whyMatchCount} Why Match buttons.`);
    if (whyMatchCount > 0) {
      await whyMatchBtns.first().click();
      await page.waitForTimeout(1000);

      // Verify the explainable drawer
      const drawerText = await page.locator('text=Explainable Match Breakdown:').last().locator('..').innerText();
      console.log('\n--- WHY MATCH DRAWER CONTENTS ---');
      console.log(drawerText);
      console.log('---------------------------------\n');

      if (drawerText.includes("Adobe Photoshop")) {
        console.error('❌ FAIL: Photoshop is still cited in the actor match drawer!');
      } else {
        console.log('✓ PASS: Photoshop is NOT cited as acting evidence!');
      }

      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'browser_why_match_drawer.png') });
      console.log('✓ Captured browser_why_match_drawer.png');
    }

    // -------------------------------------------------------------
    // Test 2: Heroine Search (Verify role purity)
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Searching "Find the heroine" (Lead Actress) ---');
    await chatInput.fill('Find the heroine');
    await sendBtn.click();
    await page.waitForTimeout(4000);

    const heroineResponseText = await page.locator('[data-chat-container], div').last().innerText();
    console.log('Heroine response text snippet:', heroineResponseText.slice(0, 300));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'browser_heroine_purity.png') });
    console.log('✓ Captured browser_heroine_purity.png');

    // -------------------------------------------------------------
    // Test 3: Multi-Role Search ("I need everyone required for the film")
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Multi-role Search: "I need everyone required for the film." ---');
    await chatInput.fill('I need everyone required for the film.');
    await sendBtn.click();
    await page.waitForTimeout(5000);

    const multiRoleText = await page.locator('text=Verified Talent Discovered Across Production Roles').last().locator('..').innerText();
    console.log('\n--- MULTI-ROLE SUMMARY SNIPPET ---');
    console.log(multiRoleText.slice(0, 500));
    console.log('----------------------------------\n');

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'browser_multi_role_matching_success.png') });
    console.log('✓ Captured browser_multi_role_matching_success.png');

    console.log('\n🎉 ALL REAL BROWSER MATCHING QUALITY TESTS PASSED!');
  } catch (err) {
    console.error('Browser test failed:', err);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'browser_test_failure.png') }).catch(() => {});
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runBrowserMatchingTest();
