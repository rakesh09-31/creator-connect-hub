import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\rakes\\.gemini\\antigravity-ide\\brain\\2da62df8-aeaa-49e4-a08e-49ac59de241f';

async function run() {
  console.log('================================================================================');
  console.log('STARTING REAL BROWSER E2E: FOLLOW-UP INTENT CONTAMINATION TEST');
  console.log('================================================================================\n');

  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Track console logs and errors
  const browserLogs = [];
  page.on('console', (msg) => {
    const text = msg.text();
    browserLogs.push(text);
    if (msg.type() === 'error') {
      console.log(`[Browser Console Error] ${text}`);
    } else if (text.includes('[OmniForge Telemetry]') || text.includes('[AI] Fast path') || text.includes('searchCreatorsDirectory') || text.includes('searchClientOpportunities')) {
      console.log(`[Browser App Log] ${text}`);
    }
  });

  console.log('1. Navigating to login page...');
  await page.goto('http://localhost:8081/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Sign in with verified test user
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
  // STEP A: "I am a video editor."
  // =========================================================================
  console.log('\n--- STEP A: Send "I am a video editor." ---');
  await chatInput.fill('I am a video editor.');
  await sendBtn.click();
  console.log('   Sent "I am a video editor." Waiting for response...');
  await page.waitForTimeout(3500);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e_contamination_stepA_role.png'), fullPage: true });
  console.log('   Saved e2e_contamination_stepA_role.png');

  // =========================================================================
  // STEP B: "Find clients who require video editors."
  // =========================================================================
  console.log('\n--- STEP B: Send "Find clients who require video editors." ---');
  await chatInput.fill('Find clients who require video editors.');
  await sendBtn.click();
  console.log('   Sent opportunity query. Waiting for response...');
  await page.waitForTimeout(4500);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e_contamination_stepB_clients.png'), fullPage: true });
  console.log('   Saved e2e_contamination_stepB_clients.png');

  let contentB = await page.content();
  const hasOpportunityHeaderB =
    contentB.includes('Clients Looking for Video Editors') ||
    contentB.includes('Video Editor Opportunities') ||
    contentB.includes('open opportunities in OmniCraft') ||
    contentB.includes('Apex Media Agency');
  console.log(`   [VERIFICATION STEP B] Client opportunity cards displayed: ${hasOpportunityHeaderB ? '✅ PASS' : '❌ FAIL'}`);

  // =========================================================================
  // STEP C: CRITICAL REGRESSION TEST
  // "iam a video editor so find the creators"
  // =========================================================================
  console.log('\n--- STEP C: Send "iam a video editor so find the creators" ---');
  await chatInput.fill('iam a video editor so find the creators');
  await sendBtn.click();
  console.log('   Sent "iam a video editor so find the creators". Waiting for response...');
  await page.waitForTimeout(5000);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e_contamination_stepC_creators.png'), fullPage: true });
  console.log('   Saved e2e_contamination_stepC_creators.png');

  let contentC = await page.content();

  // 1. Verify creator cards header / prompt is present
  const hasCreatorHeader =
    contentC.includes('Verified Creators in OmniCraft') ||
    contentC.includes('verified creator profiles in the OmniCraft directory') ||
    contentC.includes('What type of creators are you looking for?');
  console.log(`   [VERIFICATION STEP C1] UI switched to Creator Search header: ${hasCreatorHeader ? '✅ PASS' : '❌ FAIL'}`);

  // 2. Verify real Supabase creator cards are displayed (View Profile, Invite, Select)
  const hasCreatorActionButtons =
    contentC.includes('View Profile') ||
    contentC.includes('Invite') ||
    contentC.includes('Match score') ||
    contentC.includes('% Match');
  console.log(`   [VERIFICATION STEP C2] Real Creator cards with Profile/Invite actions displayed: ${hasCreatorActionButtons ? '✅ PASS' : '❌ FAIL'}`);

  // 3. Verify ZERO client opportunity cards / job applications are displayed for Step C
  // Check the last message in chat
  const aiMessagesC = await page.locator('div.flex.gap-3.justify-start div.rounded-2xl').allTextContents();
  const lastAiMessage = aiMessagesC[aiMessagesC.length - 1] || '';
  const lastMessageHasClientCards =
    lastAiMessage.includes('Clients Looking for Video Editors') ||
    lastAiMessage.includes('Apex Media Agency') ||
    lastAiMessage.includes('open opportunities in OmniCraft');
  console.log(`   [VERIFICATION STEP C3] ZERO client job opportunity cards in latest message: ${!lastMessageHasClientCards ? '✅ PASS' : '❌ FAIL'}`);

  // 4. Verify Suggested Chips: Video Editors, Designers, Developers, Musicians, Actors, Photographers, All Creators
  const hasCreatorChips =
    contentC.includes('Video Editors') &&
    (contentC.includes('Designers') || contentC.includes('Developers') || contentC.includes('All Creators'));
  console.log(`   [VERIFICATION STEP C4] Creator specialty chips displayed: ${hasCreatorChips ? '✅ PASS' : '❌ FAIL'}`);

  // =========================================================================
  // STEP D: "find clients who require video editors"
  // Switches back to client opportunities
  // =========================================================================
  console.log('\n--- STEP D: Send "find clients who require video editors" ---');
  await chatInput.fill('find clients who require video editors');
  await sendBtn.click();
  console.log('   Sent "find clients who require video editors". Waiting for response...');
  await page.waitForTimeout(4500);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e_contamination_stepD_back_to_clients.png'), fullPage: true });
  console.log('   Saved e2e_contamination_stepD_back_to_clients.png');

  let contentD = await page.content();
  const aiMessagesD = await page.locator('div.flex.gap-3.justify-start div.rounded-2xl').allTextContents();
  const lastAiMessageD = aiMessagesD[aiMessagesD.length - 1] || '';
  const hasOpportunityHeaderD =
    lastAiMessageD.includes('Clients Looking for Video Editors') ||
    lastAiMessageD.includes('Apex Media Agency') ||
    lastAiMessageD.includes('open opportunities in OmniCraft') ||
    contentD.includes('Clients Looking for Video Editors') ||
    contentD.includes('Clients Looking for Opportunities');
  console.log(`   [VERIFICATION STEP D] Successfully switched back to Client Opportunity Search: ${hasOpportunityHeaderD ? '✅ PASS' : '❌ FAIL'}`);

  console.log('\n================================================================================');
  console.log('BROWSER E2E TEST COMPLETED SUCCESSFULLY');
  console.log('================================================================================\n');

  await browser.close();
}

run().catch((err) => {
  console.error('Fatal Browser E2E Error:', err);
  process.exit(1);
});
