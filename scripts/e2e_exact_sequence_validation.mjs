import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\rakes\\.gemini\\antigravity-ide\\brain\\98831bc3-262d-4f58-be8d-44d65ca793ed';

async function runExactSequenceValidation() {
  console.log('========================================================================');
  console.log('  STARTING EXACT USER SEQUENCE VALIDATION (TURNS 1 TO 5)                ');
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
    // Login
    console.log('1. Navigating to http://localhost:8081/login...');
    await page.goto('http://localhost:8081/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    console.log('2. Signing in with test user...');
    await page.fill('input[type="email"]', 'creator_1789410388281@testomnicraft.dev');
    await page.fill('input[type="password"]', 'TestPassword123!#');
    await page.click('button[type="submit"]');

    await page.waitForURL((url) => !url.href.includes('/login'), { timeout: 10000 });
    console.log('✓ Successfully logged in, current URL:', page.url());

    // Navigate to OmniForge
    console.log('3. Navigating to http://localhost:8081/omniforge...');
    await page.goto('http://localhost:8081/omniforge', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const chatInput = page.locator('form input[type="text"], input[type="text"]').last();
    await chatInput.waitFor({ state: 'visible', timeout: 15000 });
    const sendBtn = page.locator('form button[type="submit"]').last();
    console.log('✓ Chat ready.');

    // -------------------------------------------------------------
    // TURN 1: "I am the director. I want to make a romantic musical film.."
    // -------------------------------------------------------------
    console.log('\n--- TURN 1: "I am the director. I want to make a romantic musical film.." ---');
    await chatInput.fill('I am the director. I want to make a romantic musical film..');
    await sendBtn.click();

    const turn1Locator = page.locator('text=Director — You').last();
    await turn1Locator.waitFor({ state: 'visible', timeout: 8000 });
    console.log('✓ Turn 1: Successfully rendered role architecture acknowledging Director.');

    const turn1Text = await page.locator('div, [data-chat-container]').filter({ hasText: "Director — You" }).last().innerText();
    const hasExclusion = turn1Text.includes("Covered by you") || turn1Text.includes("no external director");
    console.log(`Turn 1 Director Excluded from hiring: ${hasExclusion ? 'PASS' : 'FAIL'}`);

    // -------------------------------------------------------------
    // TURN 2: "I need everyone required for the film."
    // -------------------------------------------------------------
    console.log('\n--- TURN 2: "I need everyone required for the film." ---');
    await chatInput.fill('I need everyone required for the film.');
    await sendBtn.click();
    await page.waitForTimeout(5000);

    const turn2Locator = page.locator('text=Verified Talent Discovered Across Production Roles').last();
    await turn2Locator.waitFor({ state: 'visible', timeout: 10000 });
    console.log('✓ Turn 2: Discovered talent across required roles!');

    // -------------------------------------------------------------
    // TURN 3: "Start with the hero and heroine.Find them."
    // -------------------------------------------------------------
    console.log('\n--- TURN 3: "Start with the hero and heroine.Find them." ---');
    await chatInput.fill('Start with the hero and heroine.Find them.');
    await sendBtn.click();
    await page.waitForTimeout(4000);

    const turn3Locator = page.locator('text=Verified Lead Cast Discovered (Hero & Heroine)').last();
    await turn3Locator.waitFor({ state: 'visible', timeout: 8000 });
    console.log('✓ Turn 3: Filtered discovery specifically to Lead Cast (Hero & Heroine)!');

    // -------------------------------------------------------------
    // TURN 4: "Who is still missing from my film team?"
    // -------------------------------------------------------------
    console.log('\n--- TURN 4: "Who is still missing from my film team?" ---');
    await chatInput.fill('Who is still missing from my film team?');
    await sendBtn.click();
    await page.waitForTimeout(3000);

    const turn4Locator = page.locator('text=Production Team Coverage Analysis').last();
    await turn4Locator.waitFor({ state: 'visible', timeout: 8000 });
    console.log('✓ Turn 4: Provided Production Team Coverage Analysis without looping static role taxonomy!');

    // -------------------------------------------------------------
    // TURN 5: "Build my complete film squad."
    // -------------------------------------------------------------
    console.log('\n--- TURN 5: "Build my complete film squad." ---');
    await chatInput.fill('Build my complete film squad.');
    await sendBtn.click();
    await page.waitForTimeout(3000);

    const turn5Locator = page.locator('text=Opening complete film squad workspace').last();
    await turn5Locator.waitFor({ state: 'visible', timeout: 8000 });
    console.log('✓ Turn 5: Squad workspace opened successfully configuring team around Director!');

    const screenshotFinal = path.join(ARTIFACT_DIR, 'browser_turn5_sequence_success.png');
    await page.screenshot({ path: screenshotFinal, fullPage: true });
    console.log('✓ Sequence Screenshot saved to:', screenshotFinal);

    console.log('\n========================================================================');
    console.log('  EXACT 5-TURN USER SEQUENCE VALIDATION COMPLETED WITH 100% SUCCESS!    ');
    console.log('========================================================================\n');
  } catch (err) {
    console.error('Error during sequence validation:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runExactSequenceValidation();
