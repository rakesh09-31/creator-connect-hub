import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\rakes\\.gemini\\antigravity-ide\\brain\\2da62df8-aeaa-49e4-a08e-49ac59de241f';

async function run() {
  console.log('================================================================================');
  console.log('STARTING REAL BROWSER E2E: CREATOR JOB SEEKING & OPPORTUNITY DISCOVERY');
  console.log('================================================================================\n');

  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Monitor console
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log(`[Browser Console Error] ${msg.text()}`);
    }
  });

  console.log('1. Navigating to login page...');
  await page.goto('http://localhost:8081/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Sign in
  console.log('2. Signing in with test account...');
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
  console.log('   [PASS] Chat input field ready!');
  const sendBtn = page.locator('form button[type="submit"]').last();

  // =========================================================================
  // STEP 1: Creator Job Seeking Prompt
  // "I am a video editor and I want to apply for a job"
  // =========================================================================
  console.log('\n--- STEP 1: Send "I am a video editor and I want to apply for a job" ---');
  const prompt1 = 'I am a video editor and I want to apply for a job';
  await chatInput.fill(prompt1);
  await sendBtn.click();
  console.log('Prompt sent. Waiting for response...');
  await page.waitForTimeout(4000);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e_creator_job_step1.png'), fullPage: true });
  console.log('Saved e2e_creator_job_step1.png');

  // Verify response
  const pageContent1 = await page.content();
  const hasOpportunityHeader = pageContent1.includes('Video Editor Opportunities') || pageContent1.includes('Open Opportunities');
  console.log(`   Header Verification: ${hasOpportunityHeader ? '✅ PASS' : '❌ FAIL'}`);

  const hasApexJob = pageContent1.includes('Lead Commercial Video Editor Needed') || pageContent1.includes('Apex Media Agency');
  console.log(`   Real Job (Apex Media Agency) Verification: ${hasApexJob ? '✅ PASS' : '❌ FAIL'}`);

  const hasApplyButton = pageContent1.includes('Apply') || pageContent1.includes('Apply to');
  console.log(`   Apply Action Verification: ${hasApplyButton ? '✅ PASS' : '❌ FAIL'}`);

  // Verify NO unrelated creator cards appear
  const hasUnrelatedCards = pageContent1.includes('Matched Verified Creators') &&
    (pageContent1.includes('UI/UX Designer') || pageContent1.includes('Frontend Web Developer'));
  console.log(`   Zero Unrelated Creator Cards: ${!hasUnrelatedCards ? '✅ PASS' : '❌ FAIL'}`);

  // =========================================================================
  // STEP 2: Apply for the Job
  // =========================================================================
  console.log('\n--- STEP 2: Apply for the job via "I want to apply for this project" ---');
  const applyPrompt = 'I want to apply for this project';
  await chatInput.fill(applyPrompt);
  await sendBtn.click();
  console.log('Apply prompt sent. Waiting for application submission...');
  await page.waitForTimeout(4000);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e_creator_job_step2_applied.png'), fullPage: true });
  console.log('Saved e2e_creator_job_step2_applied.png');

  const pageContent2 = await page.content();
  const hasAppliedConfirmation = pageContent2.includes('Application Submitted Successfully') || pageContent2.includes('Pending Review');
  console.log(`   Application Submitted Confirmation: ${hasAppliedConfirmation ? '✅ PASS' : '❌ FAIL'}`);

  // =========================================================================
  // STEP 3: Refresh & Verify State Persistence
  // =========================================================================
  console.log('\n--- STEP 3: Reload and Verify Persistence ---');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e_creator_job_step3_reload.png'), fullPage: true });
  console.log('Saved e2e_creator_job_step3_reload.png');

  const pageContent3 = await page.content();
  const hasPersistedHistory = pageContent3.includes('Video Editor Opportunities') || pageContent3.includes('Application Submitted');
  console.log(`   History & State Persistence: ${hasPersistedHistory ? '✅ PASS' : '❌ FAIL'}`);

  // =========================================================================
  // STEP 4: Bug Prompt Verification
  // "I am a video editor so I need too apply for a job so find all the creators"
  // =========================================================================
  console.log('\n--- STEP 4: Send Exact Bug Prompt ---');
  const bugPrompt = 'I am a video editor so I need too apply for a job so find all the creators';
  await chatInput.fill(bugPrompt);
  await sendBtn.click();
  console.log('Bug prompt sent. Waiting for response...');
  await page.waitForTimeout(4000);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e_creator_job_step4_bug_prompt.png'), fullPage: true });
  console.log('Saved e2e_creator_job_step4_bug_prompt.png');

  const pageContent4 = await page.content();
  const bugSearchSuccess = pageContent4.includes('Video Editor Opportunities') && !pageContent4.includes('UI/UX Designer');
  console.log(`   Bug Prompt Handled as Job Discovery: ${bugSearchSuccess ? '✅ PASS' : '❌ FAIL'}`);

  console.log('\n================================================================================');
  console.log('REAL BROWSER E2E VERIFICATION COMPLETE!');
  console.log('================================================================================\n');

  await browser.close();
}

run().catch((err) => {
  console.error('Fatal error during browser E2E:', err);
  process.exit(1);
});
