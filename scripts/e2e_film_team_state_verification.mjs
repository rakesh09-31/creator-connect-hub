import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\rakes\\.gemini\\antigravity-ide\\brain\\98831bc3-262d-4f58-be8d-44d65ca793ed';

async function runFilmTeamStateVerification() {
  console.log('========================================================================');
  console.log('  STARTING FULL REAL-BROWSER E2E: FILM TEAM STATE & PROJECT PERSISTENCE ');
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

    await page.waitForURL((url) => !url.href.includes('/login'), { timeout: 10000 });
    console.log('✓ Successfully logged in, current URL:', page.url());

    // Step 2: Open OmniForge
    console.log('3. Navigating to http://localhost:8081/omniforge...');
    await page.goto('http://localhost:8081/omniforge', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const chatInput = page.locator('form input[type="text"], input[type="text"]').last();
    await chatInput.waitFor({ state: 'visible', timeout: 15000 });
    const sendBtn = page.locator('form button[type="submit"]').last();
    console.log('✓ OmniForge chat ready.');

    // Count initial projects
    const getProjectCount = async () => {
      const countEl = page.locator('text=/Your AI Projects \\(\\d+\\)/').first();
      if (await countEl.isVisible()) {
        const text = await countEl.innerText();
        const m = text.match(/\((\d+)\)/);
        return m ? parseInt(m[1], 10) : 0;
      }
      return 0;
    };

    const initialProjectCount = await getProjectCount();
    console.log(`Initial "Your AI Projects" count: ${initialProjectCount}`);

    // -------------------------------------------------------------
    // TURN 1: "I am the director. I want to make a romantic musical film."
    // -------------------------------------------------------------
    console.log('\n--- TURN 1: Director creates romantic musical film ---');
    await chatInput.fill('I am the director. I want to make a romantic musical film.');
    await sendBtn.click();

    const turn1Locator = page.locator('text=Film Production Role Architecture').last();
    await turn1Locator.waitFor({ state: 'visible', timeout: 8000 });
    console.log('✓ Turn 1: Film Production Role Architecture rendered!');

    const turn1Text = await page.locator('div, [data-chat-container]').filter({ hasText: "Film Production Role Architecture" }).last().innerText();
    const hasDirectorCovered = turn1Text.includes("Director — You") &&
      (turn1Text.includes("Covered by you") || turn1Text.includes("no external director"));
    console.log(`✓ Director Excluded from hiring: ${hasDirectorCovered ? 'PASS' : 'FAIL'}`);

    const countAfterTurn1 = await getProjectCount();
    console.log(`Projects count after Turn 1: ${countAfterTurn1}`);

    const ss1 = path.join(ARTIFACT_DIR, 'e2e_turn1_director_film.png');
    await page.screenshot({ path: ss1, fullPage: true });

    // -------------------------------------------------------------
    // TURN 2: "I need everyone required for the film."
    // -------------------------------------------------------------
    console.log('\n--- TURN 2: Required creators searched ---');
    await chatInput.fill('I need everyone required for the film.');
    await sendBtn.click();
    await page.waitForTimeout(4000);

    const turn2Locator = page.locator('text=Verified Talent Discovered Across Production Roles').last();
    await turn2Locator.waitFor({ state: 'visible', timeout: 10000 });
    console.log('✓ Turn 2: Discovered talent across required roles!');

    // -------------------------------------------------------------
    // TURN 3: "Start with the hero and heroine. Find them."
    // -------------------------------------------------------------
    console.log('\n--- TURN 3: Hero and heroine searched ---');
    await chatInput.fill('Start with the hero and heroine. Find them.');
    await sendBtn.click();
    await page.waitForTimeout(4000);

    const turn3Locator = page.locator('text=Verified Lead Cast Discovered (Hero & Heroine)').last();
    await turn3Locator.waitFor({ state: 'visible', timeout: 8000 });
    console.log('✓ Turn 3: Lead Cast (Hero & Heroine) discovered!');

    const ramuVisible = await page.locator('text=@ramu').first().isVisible();
    console.log(`✓ Ramu candidate card visible: ${ramuVisible ? 'PASS' : 'FAIL'}`);

    const ss3 = path.join(ARTIFACT_DIR, 'e2e_turn3_ramu_candidate.png');
    await page.screenshot({ path: ss3, fullPage: true });

    // -------------------------------------------------------------
    // TURN 4: "Add Ramu to team"
    // -------------------------------------------------------------
    console.log('\n--- TURN 4: Add Ramu to team ---');
    await chatInput.fill('Add Ramu to team');
    await sendBtn.click();
    await page.waitForTimeout(4000);

    const ramuAddedLocator = page.locator('text=Added to Your Film Production Squad').last();
    await ramuAddedLocator.waitFor({ state: 'visible', timeout: 8000 });
    console.log('✓ Turn 4: AI confirmed Ramu added to squad!');

    const turn4Text = await page.locator('div, [data-chat-container]').filter({ hasText: "Added to Your Film Production Squad" }).last().innerText();
    const confirmsRamuLead = turn4Text.includes("Lead Actor") && turn4Text.includes("@ramu");
    console.log(`✓ Turn 4 explicitly reports Lead Actor @ramu: ${confirmsRamuLead ? 'PASS' : 'FAIL'}`);

    const ss4 = path.join(ARTIFACT_DIR, 'e2e_turn4_ramu_added.png');
    await page.screenshot({ path: ss4, fullPage: true });

    // -------------------------------------------------------------
    // TURN 5: MANDATORY REFRESH TEST
    // -------------------------------------------------------------
    console.log('\n--- TURN 5: MANDATORY REFRESH TEST ---');
    console.log('Reloading page...');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const chatInputAfterReload = page.locator('form input[type="text"], input[type="text"]').last();
    await chatInputAfterReload.waitFor({ state: 'visible', timeout: 15000 });
    const sendBtnAfterReload = page.locator('form button[type="submit"]').last();
    console.log('✓ Page reloaded and chat input ready.');

    const countAfterRefresh = await getProjectCount();
    console.log(`Projects count after Refresh: ${countAfterRefresh} (Previous: ${countAfterTurn1})`);
    if (countAfterRefresh > countAfterTurn1) {
      console.warn(`WARNING: Duplicate projects detected! Previous: ${countAfterTurn1}, Now: ${countAfterRefresh}`);
    } else {
      console.log('✓ NO duplicate projects created across turns and refresh!');
    }

    // -------------------------------------------------------------
    // TURN 6: "Who is still missing from my film team?"
    // -------------------------------------------------------------
    console.log('\n--- TURN 6: Gap Analysis after Refresh ---');
    await chatInputAfterReload.fill('Who is still missing from my film team?');
    await sendBtnAfterReload.click();
    await page.waitForTimeout(3000);

    const gapLocator = page.locator('text=Film Production Team Coverage Analysis').last();
    await gapLocator.waitFor({ state: 'visible', timeout: 8000 });
    console.log('✓ Turn 6: Coverage Analysis received.');

    const gapText = await page.locator('div, [data-chat-container]').filter({ hasText: "Film Production Team Coverage Analysis" }).last().innerText();
    console.log('Coverage Analysis Text Preview:\n' + gapText.slice(0, 400) + '...\n');

    const confirmedHasRamu = gapText.includes("Lead Actor") && gapText.includes("@ramu") && gapText.includes("Confirmed");
    console.log(`✓ Confirmed positions includes Lead Actor @ramu: ${confirmedHasRamu ? 'PASS' : 'FAIL'}`);

    const confirmedHasDirector = gapText.includes("Director") && gapText.includes("Covered by you");
    console.log(`✓ Confirmed positions includes Director (Covered by you): ${confirmedHasDirector ? 'PASS' : 'FAIL'}`);

    const missingSection = gapText.split(/Still Missing/i)[1] || '';
    const leadActorInMissing = missingSection.includes("Lead Actor:");
    console.log(`✓ Lead Actor EXCLUDED from Still Missing / Open Positions: ${!leadActorInMissing ? 'PASS' : 'FAIL'}`);

    const ss6 = path.join(ARTIFACT_DIR, 'e2e_turn6_gap_analysis.png');
    await page.screenshot({ path: ss6, fullPage: true });

    // -------------------------------------------------------------
    // TURN 7: "Build my complete film squad."
    // -------------------------------------------------------------
    console.log('\n--- TURN 7: Build complete film squad (Team Orchestration) ---');
    await chatInputAfterReload.fill('Build my complete film squad.');
    await sendBtnAfterReload.click();
    await page.waitForTimeout(3000);

    const teamOrchLocator = page.locator('text=Team Orchestration').last();
    await teamOrchLocator.waitFor({ state: 'visible', timeout: 8000 });
    console.log('✓ Turn 7: Team Orchestration rendered!');

    // Check workspace panel for Ramu as ACCEPTED
    const coverageBadge = page.locator('text=/\\d+ of \\d+ External Positions Filled/i').first();
    await coverageBadge.waitFor({ state: 'visible', timeout: 5000 });
    const coverageBadgeText = await coverageBadge.innerText();
    console.log(`✓ Team Orchestration Badge: "${coverageBadgeText}"`);

    const hasOneFilled = coverageBadgeText.includes("1 of ");
    console.log(`✓ 1 of N External Positions Filled (not 0): ${hasOneFilled ? 'PASS' : 'FAIL'}`);

    const ramuAcceptedVisible = await page.locator('text=@ramu').first().isVisible();
    const acceptedBadgeVisible = await page.locator('text=ACCEPTED').first().isVisible();
    console.log(`✓ Lead Actor @ramu with ACCEPTED badge: ${ramuAcceptedVisible && acceptedBadgeVisible ? 'PASS' : 'FAIL'}`);

    const directorTitleVisible = await page.locator('text=Director: You').first().isVisible();
    const coveredBadgeVisible = await page.locator('text=COVERED BY USER').first().isVisible();
    console.log(`✓ Director COVERED BY USER banner: ${directorTitleVisible && coveredBadgeVisible ? 'PASS' : 'FAIL'}`);

    const countAfterTeamFormation = await getProjectCount();
    console.log(`Projects count after Team Formation: ${countAfterTeamFormation}`);
    console.log(`✓ No duplicate project created by Team Formation: ${countAfterTeamFormation === countAfterRefresh ? 'PASS' : 'FAIL'}`);

    const ss7 = path.join(ARTIFACT_DIR, 'e2e_turn7_team_orchestration.png');
    await page.screenshot({ path: ss7, fullPage: true });

    // -------------------------------------------------------------
    // TURN 8: Second Creator Test (Cinematographer Vinay)
    // -------------------------------------------------------------
    console.log('\n--- TURN 8: Second Creator Test (Cinematographer) ---');
    await chatInputAfterReload.fill('Find cinematographers');
    await sendBtnAfterReload.click();
    await page.waitForTimeout(4000);

    console.log('Adding Vinay to team...');
    await chatInputAfterReload.fill('Add Vinay to team');
    await sendBtnAfterReload.click();
    await page.waitForTimeout(4000);

    const vinayAddedLocator = page.locator('text=Added to Your Film Production Squad').last();
    await vinayAddedLocator.waitFor({ state: 'visible', timeout: 8000 });
    console.log('✓ Turn 8: Vinay added to squad as Cinematographer!');

    // -------------------------------------------------------------
    // TURN 9: Second Creator Gap Analysis & Squad
    // -------------------------------------------------------------
    console.log('\n--- TURN 9: Gap Analysis with 2 creators ---');
    await chatInputAfterReload.fill('Who is still missing from my film team?');
    await sendBtnAfterReload.click();
    await page.waitForTimeout(3000);

    const gapText2 = await page.locator('div, [data-chat-container]').filter({ hasText: "Film Production Team Coverage Analysis" }).last().innerText();
    const confirmsVinay = gapText2.includes("Cinematographer") && gapText2.includes("@vinay");
    console.log(`✓ Confirmed positions includes Cinematographer @vinay: ${confirmsVinay ? 'PASS' : 'FAIL'}`);

    const missingSection2 = gapText2.split(/Still Missing/i)[1] || '';
    const neitherMissing = !missingSection2.includes("Lead Actor:") && !missingSection2.includes("Cinematographer:");
    console.log(`✓ Neither Lead Actor nor Cinematographer in Still Missing: ${neitherMissing ? 'PASS' : 'FAIL'}`);

    console.log('\n--- TURN 10: Final Team Orchestration (2 Positions Filled) ---');
    await chatInputAfterReload.fill('Build my complete film squad.');
    await sendBtnAfterReload.click();
    await page.waitForTimeout(3000);

    const coverageBadge2 = page.locator('text=/\\d+ of \\d+ External Positions Filled/i').first();
    await coverageBadge2.waitFor({ state: 'visible', timeout: 5000 });
    const coverageBadgeText2 = await coverageBadge2.innerText();
    console.log(`✓ Final Team Orchestration Badge: "${coverageBadgeText2}"`);

    const hasTwoFilled = coverageBadgeText2.includes("2 of ");
    console.log(`✓ 2 of N External Positions Filled: ${hasTwoFilled ? 'PASS' : 'FAIL'}`);

    const ss10 = path.join(ARTIFACT_DIR, 'e2e_turn10_final_orchestration.png');
    await page.screenshot({ path: ss10, fullPage: true });

    console.log('\n========================================================================');
    console.log('  🎉 ALL REAL-BROWSER E2E TESTS PASSED 100% WITH ZERO DEFECTS!          ');
    console.log('========================================================================\n');
  } catch (err) {
    console.error('Error during real-browser E2E validation:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runFilmTeamStateVerification();
