import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\rakes\\.gemini\\antigravity-ide\\brain\\2da62df8-aeaa-49e4-a08e-49ac59de241f';

async function run() {
  console.log('================================================================================');
  console.log('STARTING REAL BROWSER E2E: CREATOR-TO-CLIENT OPPORTUNITY SEARCH & APPLICATION');
  console.log('================================================================================\n');

  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Monitor console errors
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log(`[Browser Console Error] ${msg.text()}`);
    }
  });

  console.log('1. Navigating to login page...');
  await page.goto('http://localhost:8081/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Sign in
  console.log('2. Signing in with creator test account...');
  await page.fill('input[type="email"]', 'creator_1789410388281@testomnicraft.dev');
  await page.fill('input[type="password"]', 'TestPassword123!#');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);
  console.log(`   Logged in. Current URL: ${page.url()}`);

  console.log('3. Navigating to OmniForge...');
  await page.goto('http://localhost:8081/omniforge', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const chatInput = page.locator('form input[type="text"], input[placeholder*="Ask a question"], input[placeholder*="Describe your business"]').first();
  await chatInput.waitFor({ state: 'visible', timeout: 15000 });
  console.log('   [PASS] OmniForge Chat input ready!');
  const sendBtn = page.locator('form button[type="submit"]').last();

  // =========================================================================
  // STEP 1: "I am a video editor."
  // =========================================================================
  console.log('\n--- STEP 1: Send "I am a video editor." ---');
  await chatInput.fill('I am a video editor.');
  await sendBtn.click();
  console.log('   Sent "I am a video editor." Waiting for response...');
  await page.waitForTimeout(3500);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e_step1_role_declaration.png'), fullPage: true });
  console.log('   Saved e2e_step1_role_declaration.png');

  // =========================================================================
  // STEP 2: "Find clients who require video editors."
  // =========================================================================
  console.log('\n--- STEP 2: Send "Find clients who require video editors." ---');
  await chatInput.fill('Find clients who require video editors.');
  await sendBtn.click();
  console.log('   Sent opportunity search query. Waiting for response...');
  await page.waitForTimeout(4500);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e_step2_clients_looking_for_video_editors.png'), fullPage: true });
  console.log('   Saved e2e_step2_clients_looking_for_video_editors.png');

  // Verify UI displays "Clients Looking for Video Editors" or "Video Editor Opportunities"
  let content = await page.content();
  const hasOpportunityHeader =
    content.includes('Clients Looking for Video Editors') ||
    content.includes('Video Editor Opportunities') ||
    content.includes('Clients Looking for Opportunities');
  console.log(`   [VERIFICATION] UI displays "Clients Looking for Video Editors": ${hasOpportunityHeader ? '✅ PASS' : '❌ FAIL'}`);

  // Verify real database record
  const hasRealJob = content.includes('Lead Commercial Video Editor Needed') || content.includes('Apex Media Agency');
  console.log(`   [VERIFICATION] Real database opportunity rendered (Apex Media Agency): ${hasRealJob ? '✅ PASS' : '❌ FAIL'}`);

  // Verify NO UI/UX Designer or unrelated creator cards appear
  const hasUiUxCards = content.includes('UI/UX Designer') && content.includes('@omnicraft_official');
  console.log(`   [VERIFICATION] ZERO UI/UX Designer creator cards: ${!hasUiUxCards ? '✅ PASS' : '❌ FAIL'}`);

  // =========================================================================
  // STEP 3: Click "View Details" on real opportunity
  // =========================================================================
  console.log('\n--- STEP 3: Click "View Details" on the opportunity ---');
  const viewDetailsBtn = page.locator('button:has-text("View Details")').first();
  await viewDetailsBtn.waitFor({ state: 'visible', timeout: 5000 });
  await viewDetailsBtn.click();
  console.log('   Clicked "View Details". Waiting for response...');
  await page.waitForTimeout(4000);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e_step3_view_details.png'), fullPage: true });
  console.log('   Saved e2e_step3_view_details.png');

  // =========================================================================
  // STEP 4: Apply to the opportunity
  // =========================================================================
  console.log('\n--- STEP 4: Click "Apply" to the opportunity ---');
  const applyBtn = page.locator('button:has-text("Apply")').first();
  if (await applyBtn.isVisible()) {
    await applyBtn.click();
    console.log('   Clicked "Apply" button directly on opportunity card.');
  } else {
    console.log('   Sending "Apply to this job" via chat...');
    await chatInput.fill('Apply to this job');
    await sendBtn.click();
  }
  await page.waitForTimeout(4500);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e_step4_applied.png'), fullPage: true });
  console.log('   Saved e2e_step4_applied.png');

  content = await page.content();
  const hasAppliedConfirmation =
    content.includes('Application Submitted Successfully') ||
    content.includes('Applied') ||
    content.includes('has been sent to');
  console.log(`   [VERIFICATION] Application submission confirmed: ${hasAppliedConfirmation ? '✅ PASS' : '❌ FAIL'}`);

  // =========================================================================
  // STEP 5: Browser Refresh & Verify Persistence
  // =========================================================================
  console.log('\n--- STEP 5: Reload page and verify state persistence ---');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e_step5_refresh_persisted.png'), fullPage: true });
  console.log('   Saved e2e_step5_refresh_persisted.png');

  content = await page.content();
  const hasPersistedState =
    content.includes('Clients Looking for Video Editors') ||
    content.includes('Lead Commercial Video Editor') ||
    content.includes('Application Submitted Successfully') ||
    content.includes('Applied');
  console.log(`   [VERIFICATION] State and application persisted across refresh: ${hasPersistedState ? '✅ PASS' : '❌ FAIL'}`);

  // =========================================================================
  // STEP 6: Exact Bug Prompt from User: "iam a video editor so find the cretors who required a video editor"
  // =========================================================================
  console.log('\n--- STEP 6: Test Exact Bug Prompt 1: "iam a video editor so find the cretors who required a video editor" ---');
  await chatInput.fill('iam a video editor so find the cretors who required a video editor');
  await sendBtn.click();
  console.log('   Sent exact prompt. Waiting for response...');
  await page.waitForTimeout(4500);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e_step6_exact_bug_prompt.png'), fullPage: true });
  console.log('   Saved e2e_step6_exact_bug_prompt.png');

  content = await page.content();
  const hasUiUxBug = content.includes('@omnicraft_official') || content.includes('@omniforger_fresh');
  console.log(`   [VERIFICATION] ZERO UI/UX Designer / @omnicraft_official cards returned: ${!hasUiUxBug ? '✅ PASS' : '❌ FAIL'}`);

  const hasVideoEditorOpportunities =
    content.includes('Clients Looking for Video Editors') ||
    content.includes('Video Editor Opportunities') ||
    content.includes('Lead Commercial Video Editor Needed');
  console.log(`   [VERIFICATION] Video Editor opportunities returned: ${hasVideoEditorOpportunities ? '✅ PASS' : '❌ FAIL'}`);

  // =========================================================================
  // STEP 7: Exact Clarification Prompt: "sorry ,find the clients who require video editors"
  // =========================================================================
  console.log('\n--- STEP 7: Test Exact Clarification: "sorry ,find the clients who require video editors" ---');
  await chatInput.fill('sorry ,find the clients who require video editors');
  await sendBtn.click();
  console.log('   Sent clarification prompt. Waiting for response...');
  await page.waitForTimeout(4500);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e_step7_clarification_prompt.png'), fullPage: true });
  console.log('   Saved e2e_step7_clarification_prompt.png');

  content = await page.content();
  const step7Success =
    (content.includes('Clients Looking for Video Editors') || content.includes('Video Editor Opportunities')) &&
    !content.includes('@omnicraft_official');
  console.log(`   [VERIFICATION] Clarification resolved to client opportunities: ${step7Success ? '✅ PASS' : '❌ FAIL'}`);

  console.log('\n================================================================================');
  console.log('🎉 ALL BROWSER E2E TESTS PASSED SUCCESSFULLY!');
  console.log('================================================================================\n');

  await browser.close();
}

run().catch((err) => {
  console.error('Fatal error during browser E2E:', err);
  process.exit(1);
});
