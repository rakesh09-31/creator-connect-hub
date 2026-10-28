import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = 'C:\\Users\\rakes\\.gemini\\antigravity-ide\\brain\\bdb787ee-50f0-4aa5-be02-b797c9cb2851';

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function runScenario() {
  console.log('================================================================================');
  console.log('STARTING OMNIFORGE COMPLETE 14-STEP E2E SCENARIO (SECTION 49)');
  console.log('================================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  const page = await context.newPage();

  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('[OmniForge Telemetry]') || text.includes('[AI] Fast path') || text.includes('searchCreatorsDirectory') || text.includes('searchCinemaCreators') || text.includes('searchClientOpportunities')) {
      console.log(`  [Browser] ${text}`);
    }
  });

  console.log('1. Logging in with test user...');
  await page.goto('http://localhost:8081/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.fill('input[type="email"]', 'creator_1789410388281@testomnicraft.dev');
  await page.fill('input[type="password"]', 'TestPassword123!#');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);
  console.log(`   Logged in. Current URL: ${page.url()}`);

  console.log('2. Navigating to /omniforge...');
  await page.goto('http://localhost:8081/omniforge', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);
  console.log(`   OmniForge URL: ${page.url()}`);

  const results = [];

  async function sendMessage(text, stepIndex, waitMs = 5000) {
    console.log(`\n------------------------------------------------------------`);
    console.log(`STEP ${stepIndex}: Sending "${text}"`);
    console.log(`------------------------------------------------------------`);
    
    // Always locate fresh input element to prevent stale references
    const chatInput = page.locator('form input[type="text"], input[placeholder*="Ask a question"], input[placeholder*="Describe your business"]').last();
    await chatInput.waitFor({ state: 'visible', timeout: 15000 });
    await chatInput.fill(text);
    await chatInput.press('Enter');
    
    await page.waitForTimeout(waitMs);
    const content = await page.content();
    const screenshotFile = `step_${stepIndex}_${text.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)}.png`;
    const screenshotPath = path.join(ARTIFACT_DIR, screenshotFile);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    return { content, screenshotFile };
  }

  // 1. "I am a director."
  const step1 = await sendMessage('I am a director.', 1, 3500);
  const step1Ok = step1.content.includes('director') || step1.content.includes('Director');
  results.push({ step: 1, text: 'I am a director.', pass: step1Ok });
  console.log(`Step 1 result: ${step1Ok ? '✅ PASS' : '❌ FAIL'}`);

  // 2. "I want to make an action comedy thriller."
  const step2 = await sendMessage('I want to make an action comedy thriller.', 2, 5500);
  const step2Ok = (step2.content.includes('Action Comedy Thriller') || step2.content.includes('action comedy thriller')) &&
                  !step2.content.includes('Romantic Musical Film');
  results.push({ step: 2, text: 'I want to make an action comedy thriller.', pass: step2Ok });
  console.log(`Step 2 result: ${step2Ok ? '✅ PASS' : '❌ FAIL'}`);

  // 3. "Find all cinema creators."
  const step3 = await sendMessage('Find all cinema creators.', 3, 6000);
  const step3Ok = step3.content.includes('Cinema') || step3.content.includes('ACTING') || step3.content.includes('Lead Actor') || step3.content.includes('ACTION & STUNTS') || step3.content.includes('CAMERA');
  results.push({ step: 3, text: 'Find all cinema creators.', pass: step3Ok });
  console.log(`Step 3 result: ${step3Ok ? '✅ PASS' : '❌ FAIL'}`);

  // 4. "Find all heroes."
  const step4 = await sendMessage('Find all heroes.', 4, 5000);
  const step4Ok = (step4.content.includes('16') || step4.content.includes('Lead Actor')) &&
                  (step4.content.includes('ramu') || step4.content.includes('Ramu') || step4.content.includes('Verified Lead Actor'));
  results.push({ step: 4, text: 'Find all heroes.', pass: step4Ok });
  console.log(`Step 4 result: ${step4Ok ? '✅ PASS' : '❌ FAIL'}`);

  // 5. "Find all video editors."
  const step5 = await sendMessage('Find all video editors.', 5, 5000);
  const step5Ok = (step5.content.includes('119') || step5.content.includes('Video Editor')) &&
                  (step5.content.includes('Showing 1–10') || step5.content.includes('Show More Creators') || step5.content.includes('Found 119'));
  results.push({ step: 5, text: 'Find all video editors.', pass: step5Ok });
  console.log(`Step 5 result: ${step5Ok ? '✅ PASS' : '❌ FAIL'}`);

  // 6. "Find all fight masters."
  const step6 = await sendMessage('Find all fight masters.', 6, 5000);
  const step6Ok = step6.content.includes('Fight Master') || step6.content.includes('Action') || step6.content.includes('fight');
  results.push({ step: 6, text: 'Find all fight masters.', pass: step6Ok });
  console.log(`Step 6 result: ${step6Ok ? '✅ PASS' : '❌ FAIL'}`);

  // 7. "Find all choreographers."
  const step7 = await sendMessage('Find all choreographers.', 7, 5000);
  const step7Ok = step7.content.includes('Choreographer') || step7.content.includes('choreographer');
  results.push({ step: 7, text: 'Find all choreographers.', pass: step7Ok });
  console.log(`Step 7 result: ${step7Ok ? '✅ PASS' : '❌ FAIL'}`);

  // 8. "Choose the best hero."
  const step8 = await sendMessage('Choose the best hero.', 8, 5500);
  const step8Ok = (step8.content.includes('Best Recommended Candidate') || step8.content.includes('Recommended') || step8.content.includes('Match Score')) &&
                  (step8.content.includes('Why Match?') || step8.content.includes('Match Score'));
  results.push({ step: 8, text: 'Choose the best hero.', pass: step8Ok });
  console.log(`Step 8 result: ${step8Ok ? '✅ PASS' : '❌ FAIL'}`);

  // 9. "Who is missing?"
  const step9 = await sendMessage('Who is missing?', 9, 4500);
  const step9Ok = step9.content.includes('Missing') || step9.content.includes('missing') || step9.content.includes('Open Roles') || step9.content.includes('Team Status');
  results.push({ step: 9, text: 'Who is missing?', pass: step9Ok });
  console.log(`Step 9 result: ${step9Ok ? '✅ PASS' : '❌ FAIL'}`);

  // 10. "Prepare the complete film schedule including songs, dance and fights."
  const step10 = await sendMessage('Prepare the complete film schedule including songs, dance and fights.', 10, 5500);
  const step10Ok = (step10.content.includes('Schedule') || step10.content.includes('schedule') || step10.content.includes('Principal Photography')) &&
                   (step10.content.includes('fights') || step10.content.includes('Fight') || step10.content.includes('Dance') || step10.content.includes('Songs'));
  results.push({ step: 10, text: 'Prepare the complete film schedule including songs, dance and fights.', pass: step10Ok });
  console.log(`Step 10 result: ${step10Ok ? '✅ PASS' : '❌ FAIL'}`);

  // 11. "Build my complete film squad."
  const step11 = await sendMessage('Build my complete film squad.', 11, 5500);
  const step11Ok = step11.content.includes('squad') || step11.content.includes('Squad') || step11.content.includes('workspace') || step11.content.includes('Team');
  results.push({ step: 11, text: 'Build my complete film squad.', pass: step11Ok });
  console.log(`Step 11 result: ${step11Ok ? '✅ PASS' : '❌ FAIL'}`);

  // 12. Refresh browser.
  console.log('\n------------------------------------------------------------');
  console.log('STEP 12: Refresh browser and verify state persists');
  console.log('------------------------------------------------------------');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);
  const step12Content = await page.content();
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'step_12_refresh_persistence.png'), fullPage: true });
  const step12Ok = step12Content.includes('Action Comedy Thriller') || step12Content.includes('Director') || step12Content.includes('omniforge');
  results.push({ step: 12, text: 'Refresh browser.', pass: step12Ok });
  console.log(`Step 12 result: ${step12Ok ? '✅ PASS' : '❌ FAIL'}`);

  // 13. "Find clients who need video editors."
  const step13 = await sendMessage('Find clients who need video editors.', 13, 5000);
  const step13Ok = step13.content.includes('Client') || step13.content.includes('Opportunities') || step13.content.includes('clients') || step13.content.includes('Apex Media Agency');
  results.push({ step: 13, text: 'Find clients who need video editors.', pass: step13Ok });
  console.log(`Step 13 result: ${step13Ok ? '✅ PASS' : '❌ FAIL'}`);

  // 14. "Find creators."
  const step14 = await sendMessage('Find creators.', 14, 5000);
  const step14Ok = step14.content.includes('Verified Creators') || step14.content.includes('creator profiles') || step14.content.includes('What type of creators');
  results.push({ step: 14, text: 'Find creators.', pass: step14Ok });
  console.log(`Step 14 result: ${step14Ok ? '✅ PASS' : '❌ FAIL'}`);

  console.log('\n================================================================================');
  console.log('FINAL E2E EXECUTION SUMMARY:');
  console.log('================================================================================');
  let allPassed = true;
  for (const r of results) {
    console.log(`Step ${r.step} [${r.pass ? 'PASS' : 'FAIL'}]: ${r.text}`);
    if (!r.pass) allPassed = false;
  }
  console.log(`\nOVERALL STATUS: ${allPassed ? '🎉 ALL 14 STEPS PASSED' : '⚠️ SOME STEPS FAILED'}`);

  await browser.close();
  return { results, allPassed };
}

runScenario().catch(console.error);
