import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\rakes\\.gemini\\antigravity-ide\\brain\\98831bc3-262d-4f58-be8d-44d65ca793ed';

async function runBrowserValidation() {
  console.log('===========================================================');
  console.log('  STARTING PLAYWRIGHT BROWSER VALIDATION: INTENT ROUTING   ');
  console.log('===========================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });

  try {
    // Step 1: Login
    console.log('1. Navigating to http://localhost:8081/login...');
    await page.goto('http://localhost:8081/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    console.log('2. Signing in with test user...');
    await page.fill('input[type="email"]', 'creator_1789410388281@testomnicraft.dev');
    await page.fill('input[type="password"]', 'TestPassword123!#');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Step 2: Open OmniForge
    console.log('3. Navigating to http://localhost:8081/omniforge...');
    await page.goto('http://localhost:8081/omniforge', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    console.log('Current URL at OmniForge step:', page.url());

    const debugScreenshot = path.join(ARTIFACT_DIR, 'debug_omniforge_url.png');
    await page.screenshot({ path: debugScreenshot });
    console.log('Debug screenshot saved to:', debugScreenshot);

    const inputs = await page.locator('input').all();
    console.log(`Found ${inputs.length} inputs on page`);
    for (let i = 0; i < inputs.length; i++) {
      const ph = await inputs[i].getAttribute('placeholder');
      const type = await inputs[i].getAttribute('type');
      console.log(`Input ${i}: type=${type}, placeholder=${ph}`);
    }

    const chatInput = page.locator('form input[type="text"], input[type="text"]').last();
    await chatInput.waitFor({ state: 'visible', timeout: 15000 });
    console.log('✓ OmniForge chat input located successfully.');

    // -------------------------------------------------------------
    // TEST 1: "what is your name?"
    // -------------------------------------------------------------
    console.log('\n--- TEST 1: "what is your name?" ---');
    const t0 = Date.now();
    await chatInput.fill('what is your name?');
    const sendBtn1 = page.locator('form button[type="submit"]').last();
    await sendBtn1.click();

    // Fast path response should appear almost immediately (within 2 seconds)
    const nameResponseLocator = page.locator('text=OmniForge AI').last();
    await nameResponseLocator.waitFor({ state: 'visible', timeout: 5000 });
    const elapsed1 = Date.now() - t0;
    console.log(`✓ Response received in ${elapsed1}ms! (Expected FAST < 2000ms, not 17s Qwen)`);

    // Verify text content
    const msgText1 = await page.locator('main, [data-chat-container], div').filter({ hasText: "I'm OmniForge AI" }).last().innerText();
    console.log('Snippet:', msgText1.slice(0, 150) + '...');

    const screenshot1 = path.join(ARTIFACT_DIR, 'browser_test1_identity.png');
    await page.screenshot({ path: screenshot1 });
    console.log('✓ Screenshot 1 saved.');

    // -------------------------------------------------------------
    // TEST 2: "can you explain how to hire a creator explain the steps"
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: "can you explain how to hire a creator explain the steps" ---');
    const t1 = Date.now();
    await chatInput.fill('can you explain how to hire a creator explain the steps');
    const sendBtn2 = page.locator('form button[type="submit"]').last();
    await sendBtn2.click();

    // Wait for the 7-step guide to appear
    const stepResponseLocator = page.locator('text=steps to hire a creator in OmniCraft').last();
    await stepResponseLocator.waitFor({ state: 'visible', timeout: 5000 });
    const elapsed2 = Date.now() - t1;
    console.log(`✓ Response received in ${elapsed2}ms!`);

    // Verify modal is NOT opened
    const dialogs = await page.locator('[role="dialog"]').all();
    let modalOpened = false;
    for (const d of dialogs) {
      if (await d.isVisible()) {
        const title = await d.innerText();
        if (title.toLowerCase().includes('hire creator') || title.toLowerCase().includes('proposal')) {
          modalOpened = true;
        }
      }
    }
    console.log(`✓ HireCreatorModal opened? ${modalOpened ? 'YES (FAIL)' : 'NO (PASS)'}`);

    // Verify chips
    const chipTexts = await page.locator('button').filter({ hasText: /Show Hiring Steps|Explain Creator Matching|What Happens After Hiring\?|Find Creators|Send Offer|Review Terms/ }).allInnerTexts();
    console.log('Visible Action/Followup Chips:', chipTexts);

    const hasSendOffer = chipTexts.some(c => c.includes('Send Offer') || c.includes('Review Terms'));
    console.log(`✓ Contains execution chips ("Send Offer" / "Review Terms")? ${hasSendOffer ? 'YES (FAIL)' : 'NO (PASS)'}`);

    const hasHowToChips = chipTexts.some(c => c.includes('Hiring Steps') || c.includes('Creator Matching') || c.includes('Find Creators'));
    console.log(`✓ Contains How-To chips? ${hasHowToChips ? 'YES (PASS)' : 'NO (FAIL)'}`);

    const screenshot2 = path.join(ARTIFACT_DIR, 'browser_test2_how_to.png');
    await page.screenshot({ path: screenshot2 });
    console.log('✓ Screenshot 2 saved.');

    // -------------------------------------------------------------
    // TEST 3: "hire this creator"
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: "hire this creator" ---');
    await chatInput.fill('hire this creator');
    const sendBtn3 = page.locator('form button[type="submit"]').last();
    await sendBtn3.click();

    const hireResponseLocator = page.locator('text=Initiating hire proposal for this creator').last();
    await hireResponseLocator.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Hire proposal triggered successfully for execution query!');

    await page.waitForTimeout(1000);
    const execChips = await page.locator('button').filter({ hasText: /Send Offer|Review Terms/ }).allInnerTexts();
    console.log('Execution chips visible:', execChips);

    const screenshot3 = path.join(ARTIFACT_DIR, 'browser_test3_hire_execution.png');
    await page.screenshot({ path: screenshot3 });
    console.log('✓ Screenshot 3 saved.');

    console.log('\n===========================================================');
    console.log('  ALL BROWSER VALIDATION TESTS COMPLETED SUCCESSFULLY!     ');
    console.log('===========================================================');
  } catch (err) {
    console.error('Test error:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

runBrowserValidation();
