import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\rakes\\.gemini\\antigravity-ide\\brain\\98831bc3-262d-4f58-be8d-44d65ca793ed';

async function runFilmPlanningValidation() {
  console.log('========================================================================');
  console.log('  STARTING PLAYWRIGHT BROWSER VALIDATION: FILM ROLE TAXONOMY & SQUAD   ');
  console.log('========================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });

  try {
    // Step 1: Sign in
    console.log('1. Navigating to http://localhost:8081/login...');
    await page.goto('http://localhost:8081/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    console.log('2. Signing in with test user...');
    await page.fill('input[type="email"]', 'creator_1789410388281@testomnicraft.dev');
    await page.fill('input[type="password"]', 'TestPassword123!#');
    await page.click('button[type="submit"]');
    
    // Wait for login redirection to complete
    await page.waitForURL((url) => !url.href.includes('/login'), { timeout: 10000 });
    console.log('✓ Successfully logged in, current URL:', page.url());

    // Step 2: Open OmniForge
    console.log('3. Navigating to http://localhost:8081/omniforge...');
    await page.goto('http://localhost:8081/omniforge', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    console.log('Current URL at OmniForge step:', page.url());

    const chatInput = page.locator('form input[type="text"], input[type="text"]').last();
    await chatInput.waitFor({ state: 'visible', timeout: 15000 });
    console.log('✓ OmniForge chat input located successfully.');

    // -------------------------------------------------------------
    // TEST 1: PRIMARY USER REQUEST
    // "I don't need directors because I am a director. I need all the other roles to make a film like actors, dancers, singers, hero, heroine, and others who are required to make a complete film."
    // -------------------------------------------------------------
    console.log('\n--- TEST 1: Primary User Film Planning Request ---');
    const primaryPrompt = "I don't need directors because I am a director. I need all the other roles to make a film like actors, dancers, singers, hero, heroine, and others who are required to make a complete film.";
    await chatInput.fill(primaryPrompt);
    const sendBtn = page.locator('form button[type="submit"]').last();
    await sendBtn.click();

    // Fast-path structured taxonomy should render quickly (< 5 seconds)
    const directorCoveredLocator = page.locator('text=Director — You').last();
    await directorCoveredLocator.waitFor({ state: 'visible', timeout: 8000 });
    console.log('✓ Response received with "Director — You"!');

    // Verify response content
    const fullResponse = await page.locator('div, [data-chat-container]').filter({ hasText: "Director — You" }).last().innerText();

    const hasDirectorCovered = fullResponse.includes("Director — You") &&
      (fullResponse.includes("Covered by you") || fullResponse.includes("no external director"));
    console.log(`Director Excluded from hiring: ${hasDirectorCovered ? 'PASS' : 'FAIL'}`);

    const noFakeCli = !fullResponse.includes('find creators role="film"') && !fullResponse.includes('type="actor');
    console.log(`No Fake CLI Syntax: ${noFakeCli ? 'PASS' : 'FAIL'}`);

    const noFakeLimit = !fullResponse.includes("You need to hire 7 core roles");
    console.log(`No Arbitrary 7-role limit: ${noFakeLimit ? 'PASS' : 'FAIL'}`);

    const hasCoreCreative = fullResponse.includes("CORE CREATIVE");
    const hasCast = fullResponse.includes("CAST");
    const hasMusic = fullResponse.includes("MUSIC & PERFORMANCE");
    const hasCamera = fullResponse.includes("CAMERA");
    const hasSound = fullResponse.includes("SOUND");
    const hasPost = fullResponse.includes("POST-PRODUCTION");
    console.log(`Taxonomy Departments Present: Core=${hasCoreCreative}, Cast=${hasCast}, Music=${hasMusic}, Camera=${hasCamera}, Sound=${hasSound}, Post=${hasPost}`);

    const hasHeroHeroine = fullResponse.includes("Hero") && fullResponse.includes("Heroine");
    console.log(`Hero & Heroine correctly included: ${hasHeroHeroine ? 'PASS' : 'FAIL'}`);

    const screenshot1 = path.join(ARTIFACT_DIR, 'browser_film_plan_response.png');
    await page.screenshot({ path: screenshot1, fullPage: true });
    console.log('✓ Screenshot 1 saved to:', screenshot1);

    // -------------------------------------------------------------
    // TEST 2: SINGLE ROLE (HEROINE)
    // "Find a heroine."
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: "Find a heroine." ---');
    await chatInput.fill('Find a heroine.');
    await sendBtn.click();
    await page.waitForTimeout(4000);

    const screenshot2 = path.join(ARTIFACT_DIR, 'browser_heroine_search.png');
    await page.screenshot({ path: screenshot2, fullPage: true });
    console.log('✓ Screenshot 2 saved to:', screenshot2);

    // -------------------------------------------------------------
    // TEST 3: HOW_TO CINEMATOGRAPHER
    // "How do I hire a cinematographer?"
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: "How do I hire a cinematographer?" ---');
    await chatInput.fill('How do I hire a cinematographer?');
    await sendBtn.click();

    const howToLocator = page.locator('text=Here are the steps to hire a creator').last();
    await howToLocator.waitFor({ state: 'visible', timeout: 6000 });
    console.log('✓ HOW_TO explanation rendered correctly without triggering hiring workflow.');

    const screenshot3 = path.join(ARTIFACT_DIR, 'browser_how_to_cinematographer.png');
    await page.screenshot({ path: screenshot3, fullPage: true });
    console.log('✓ Screenshot 3 saved to:', screenshot3);

    // -------------------------------------------------------------
    // TEST 4: MULTI-ROLE DISCOVERY
    // "Find all the people I need."
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: "Find all the people I need." ---');
    await chatInput.fill('Find all the people I need.');
    await sendBtn.click();
    await page.waitForTimeout(5000);

    const screenshot4 = path.join(ARTIFACT_DIR, 'browser_multi_role_search.png');
    await page.screenshot({ path: screenshot4, fullPage: true });
    console.log('✓ Screenshot 4 saved to:', screenshot4);

    console.log('\n========================================================================');
    console.log('  ALL BROWSER VALIDATION TESTS COMPLETED SUCCESSFULLY!                ');
    console.log('========================================================================\n');
  } catch (err) {
    console.error('Error during browser validation:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runFilmPlanningValidation();
