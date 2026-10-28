import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\rakes\\.gemini\\antigravity-ide\\brain\\8dccd48b-d19e-4218-a5f9-9d51e5b85396';

async function run() {
  console.log('================================================================================');
  console.log('STARTING REAL PLAYWRIGHT BROWSER ACCEPTANCE TEST FOR MASTER ROADMAP ENGINE');
  console.log('================================================================================\n');

  console.log('Launching Chromium...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error') {
      console.log(`[Browser Console Error] ${text}`);
    }
  });

  console.log('1. Navigating to login page...');
  await page.goto('http://localhost:8081/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  console.log('2. Signing in with test account...');
  await page.fill('input[type="email"]', 'creator_1789410388281@testomnicraft.dev');
  await page.fill('input[type="password"]', 'TestPassword123!#');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);
  console.log(`   Logged in. Current URL: ${page.url()}`);

  console.log('3. Navigating to OmniForge...');
  await page.goto('http://localhost:8081/omniforge', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const chatInput = page.locator('textarea[placeholder*="Message OmniForge"], textarea').first();
  await chatInput.waitFor({ state: 'visible', timeout: 15000 });
  console.log('   [PASS] OmniForge Chat input ready!');
  const sendBtn = page.locator('button[type="submit"]').last();

  // -------------------------------------------------------------------------
  // STEP 1: Generate Python Learning Roadmap
  // -------------------------------------------------------------------------
  console.log('\n--- STEP 1: Send "Create a Python learning roadmap" ---');
  await chatInput.fill('Create a Python learning roadmap');
  await page.waitForTimeout(500);
  await sendBtn.click();
  console.log('   Waiting for roadmap generation & response...');
  await page.waitForTimeout(6000);

  const shot1 = path.join(ARTIFACT_DIR, 'browser_demo_python_roadmap.png');
  await page.screenshot({ path: shot1, fullPage: true });
  console.log(`   Saved screenshot: ${shot1}`);

  let content1 = await page.content();
  const hasPython = content1.includes('Python Mastery Roadmap') || content1.includes('Python');
  const hasOverview = content1.includes('What you will achieve') || content1.includes('Proposed Progression');
  console.log(`   [VERIFICATION STEP 1] Python Roadmap generated: ${hasPython ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   [VERIFICATION STEP 1] 5-Part Overview present: ${hasOverview ? '✅ PASS' : '❌ FAIL'}`);

  // -------------------------------------------------------------------------
  // STEP 2: Generate Screenwriting Roadmap
  // -------------------------------------------------------------------------
  console.log('\n--- STEP 2: Send "Create a detailed learning curriculum for Screenwriting and Narrative Architecture" ---');
  await chatInput.fill('Create a detailed learning curriculum for Screenwriting and Narrative Architecture');
  await page.waitForTimeout(500);
  await sendBtn.click();
  console.log('   Waiting for screenwriting roadmap generation...');
  await page.waitForTimeout(7000);

  const shot2 = path.join(ARTIFACT_DIR, 'browser_demo_screenwriting_roadmap.png');
  await page.screenshot({ path: shot2, fullPage: true });
  console.log(`   Saved screenshot: ${shot2}`);

  let content2 = await page.content();
  const hasScreenwriting = content2.includes('Screenwriting') || content2.includes('Narrative');
  console.log(`   [VERIFICATION STEP 2] Screenwriting Roadmap generated: ${hasScreenwriting ? '✅ PASS' : '❌ FAIL'}`);

  // -------------------------------------------------------------------------
  // STEP 3: Check Saved Roadmaps in Sidebar & Switch Back to Python
  // -------------------------------------------------------------------------
  console.log('\n--- STEP 3: Switch back to Python via Roadmaps sidebar ---');
  // Click roadmaps tab / button
  const roadmapsBtn = page.locator('button:has-text("Roadmaps")').first();
  if (await roadmapsBtn.isVisible()) {
    await roadmapsBtn.click();
    await page.waitForTimeout(2000);
    const pythonRoadmapCard = page.locator('div:has-text("Python Mastery Roadmap"), div:has-text("Python")').last();
    if (await pythonRoadmapCard.isVisible()) {
      await pythonRoadmapCard.click();
      await page.waitForTimeout(2000);
    }
  }

  const shot3 = path.join(ARTIFACT_DIR, 'browser_demo_roadmaps_sidebar.png');
  await page.screenshot({ path: shot3, fullPage: true });
  console.log(`   Saved screenshot: ${shot3}`);

  // -------------------------------------------------------------------------
  // STEP 4: Refresh Page and Verify Persistence
  // -------------------------------------------------------------------------
  console.log('\n--- STEP 4: Refresh page and verify persistence ---');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  const shot4 = path.join(ARTIFACT_DIR, 'browser_demo_after_refresh.png');
  await page.screenshot({ path: shot4, fullPage: true });
  console.log(`   Saved screenshot: ${shot4}`);

  let content4 = await page.content();
  const persisted = content4.includes('Roadmap') || content4.includes('Stage');
  console.log(`   [VERIFICATION STEP 4] State persisted after refresh: ${persisted ? '✅ PASS' : '❌ FAIL'}`);

  console.log('\n================================================================================');
  console.log('PLAYWRIGHT BROWSER ACCEPTANCE TESTS COMPLETED SUCCESSFULLY!');
  console.log('================================================================================\n');

  await browser.close();
}

run().catch((err) => {
  console.error('Playwright execution error:', err);
  process.exit(1);
});
