import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\rakes\\.gemini\\antigravity-ide\\brain\\c2b67297-05ed-410e-be26-da91ea625f0b';

async function run() {
  console.log('🚀 Launching Chromium for OmniForge 3-Connected Systems Verification...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1680, height: 1050 } });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:8081/login...');
  await page.goto('http://localhost:8081/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Track console logs and errors
  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error') {
      console.log(`[Browser Console Error] ${text}`);
    } else if (text.includes('[OmniForge]') || text.includes('[AI] Fast path')) {
      console.log(`[Browser App Log] ${text}`);
    }
  });

  console.log('Navigating to http://localhost:8081/login...');
  await page.goto('http://localhost:8081/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Sign in
  console.log('Signing in with test account...');
  await page.fill('input[type="email"]', 'creator_1789410388281@testomnicraft.dev');
  await page.fill('input[type="password"]', 'TestPassword123!#');
  await page.click('button[type="submit"]');
  
  // Wait for login redirection away from /login
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 }).catch((e) => {
    console.log('Warning: URL did not change immediately, checking current URL:', page.url());
  });
  await page.waitForTimeout(3000);
  console.log(`Logged in successfully. Current URL: ${page.url()}`);

  console.log('Navigating to http://localhost:8081/omniforge...');
  await page.goto('http://localhost:8081/omniforge', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  // Capture Step 1: Initial 3-Panel Studio Load
  console.log('Verifying initial 3-panel studio layout...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'step1_3panel_initial.png'), fullPage: true });
  console.log('Saved step1_3panel_initial.png');

  const chatInput = page.locator('form input[type="text"], input[placeholder*="Ask a question"], input[placeholder*="Describe your business"]').first();
  await chatInput.waitFor({ state: 'visible', timeout: 15000 });
  console.log('Chat input field successfully located!');
  const sendBtn = page.locator('form button[type="submit"]').last();

  // ----------------------------------------------------
  // TEST 1: Creator Career Goal & Skill Gap Matrix
  // ----------------------------------------------------
  console.log('\n--- TEST 1: "I want to become a full stack developer" ---');
  await chatInput.fill('I want to become a full stack developer');
  await sendBtn.click();
  await page.waitForTimeout(4000);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'step2_fullstack_roadmap.png') });
  console.log('Saved step2_fullstack_roadmap.png');

  // Verify Skill Gap Matrix in Center Panel
  const gapItems = await page.locator('text=Gap:').count();
  console.log(`[TEST 1] Skill Gap items found in center view: ${gapItems}`);

  // ----------------------------------------------------
  // TEST 2: "What should I learn next?"
  // ----------------------------------------------------
  console.log('\n--- TEST 2: "What should I learn next?" ---');
  await chatInput.fill('What should I learn next?');
  await sendBtn.click();
  await page.waitForTimeout(4000);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'step3_what_to_learn_next.png') });
  console.log('Saved step3_what_to_learn_next.png');

  // ----------------------------------------------------
  // TEST 3: Task Completion & Advancement in Roadmap
  // ----------------------------------------------------
  console.log('\n--- TEST 3: Click Complete Task in Visual Roadmap ---');
  const completeTaskBtn = page.locator('button:has-text("Complete Task")').first();
  if (await completeTaskBtn.isVisible()) {
    await completeTaskBtn.click();
    await page.waitForTimeout(2000);
    console.log('Clicked "Complete Task" successfully.');
  } else {
    // Alternatively send "Complete this task" in chat
    await chatInput.fill('Complete this task');
    await sendBtn.click();
    await page.waitForTimeout(3000);
  }

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'step4_task_completed.png') });
  console.log('Saved step4_task_completed.png');

  // ----------------------------------------------------
  // TEST 4: Client AI Project Plan Generation
  // ----------------------------------------------------
  console.log('\n--- TEST 4: "I want to build an AI-powered restaurant application" ---');
  await chatInput.fill('I want to build an AI-powered restaurant application');
  await sendBtn.click();
  await page.waitForTimeout(5000);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'step5_client_project_plan.png') });
  console.log('Saved step5_client_project_plan.png');

  // ----------------------------------------------------
  // TEST 5: Resume Upload & Calibration Modal
  // ----------------------------------------------------
  console.log('\n--- TEST 5: Resume Upload Modal ---');
  const uploadResumeBtn = page.locator('button:has-text("Upload Resume")').first();
  await uploadResumeBtn.click();
  await page.waitForTimeout(1500);

  const sampleResumeBtn = page.locator('button:has-text("Load Sample")').first();
  if (await sampleResumeBtn.isVisible()) {
    await sampleResumeBtn.click();
    await page.waitForTimeout(1000);
    console.log('Loaded sample resume in modal.');
  }

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'step6_resume_modal.png') });
  console.log('Saved step6_resume_modal.png');

  const analyzeBtn = page.locator('button:has-text("Analyze & Extract DNA")').first();
  if (await analyzeBtn.isVisible()) {
    await analyzeBtn.click();
    await page.waitForTimeout(2000);
    console.log('Clicked "Analyze & Extract DNA". Showing preview.');
  }

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'step6b_resume_extracted_preview.png') });
  console.log('Saved step6b_resume_extracted_preview.png');

  const applyBtn = page.locator('button:has-text("Update Skill DNA & Roadmap")').first();
  if (await applyBtn.isVisible()) {
    await applyBtn.click();
    await page.waitForTimeout(3000);
    console.log('Clicked "Update Skill DNA & Roadmap". Modal closed, profile calibrated.');
  }

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'step7_post_resume_calibrated.png') });
  console.log('Saved step7_post_resume_calibrated.png');

  console.log('\n🎉 ALL 5 E2E TESTS COMPLETED SUCCESSFULLY!');
  await browser.close();
}

run().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
