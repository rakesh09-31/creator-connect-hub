import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\rakes\\.gemini\\antigravity-ide\\brain\\c2b67297-05ed-410e-be26-da91ea625f0b';

async function runBrowserVerification() {
  console.log("==================================================================");
  console.log("STARTING SECTION 16: REAL BROWSER WORKFLOW VERIFICATION");
  console.log("==================================================================\n");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('[OmniForge Telemetry]') || text.includes('[AI] Fast path') || text.includes('searchCreatorsDirectory') || text.includes('reconcileProjectTeamState') || text.includes('Local AI Error')) {
      console.log(`  [Browser Console] ${text}`);
    }
  });

  console.log("1. Navigating to login page...");
  await page.goto("http://localhost:8081/login", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  console.log("2. Logging in with test creator account...");
  await page.fill('input[type="email"]', 'creator_1789410388281@testomnicraft.dev');
  await page.fill('input[type="password"]', 'TestPassword123!#');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);
  console.log(`   Logged in. Current URL: ${page.url()}`);

  console.log("3. Navigating to OmniForge workspace...");
  await page.goto("http://localhost:8081/omniforge", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);

  const getChatInput = () => page.locator('form input[type="text"], input[placeholder*="Ask a question"], input[placeholder*="Describe your business"]').first();
  const getSendBtn = () => page.locator('form button[type="submit"]').last();

  await getChatInput().waitFor({ state: "visible", timeout: 20000 });
  console.log("   [PASS] OmniForge Chat input ready!\n");

  async function sendMessage(text, waitSec = 5) {
    console.log(`\n[Browser Action] Sending: "${text}"`);
    const input = getChatInput();
    const btn = getSendBtn();
    await input.fill(text);
    await btn.click();
    await page.waitForTimeout(waitSec * 1000);

    // Grab latest AI message text specifically from the left chat feed (.justify-start)
    const chatAiBubbles = page.locator('.justify-start div[class*="bg-surface"], .justify-start .chat-markdown');
    const count = await chatAiBubbles.count();
    let latest = "";
    if (count > 0) {
      latest = (await chatAiBubbles.nth(count - 1).innerText()) || "";
    }
    return latest;
  }

  const results = {};

  // -------------------------------------------------------------
  // Step 1: I am a film director
  // -------------------------------------------------------------
  console.log("--- STEP 1: 'I am a film director' ---");
  const resp1 = await sendMessage("I am a film director", 4);
  console.log("Response 1 preview:", resp1.slice(0, 200).replace(/\n/g, ' '));
  const isDirectorCovered1 = resp1.toLowerCase().includes("director") && (resp1.includes("You") || resp1.includes("Director") || resp1.includes("film") || resp1.includes("Short Film"));
  results.step1 = { text: resp1.slice(0, 150), isDirectorCovered: isDirectorCovered1 };
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'step1_director.png'), fullPage: true });

  // -------------------------------------------------------------
  // Step 2: Find all creators related to cinematic field
  // -------------------------------------------------------------
  console.log("\n--- STEP 2: 'Find all creators related to cinematic field' ---");
  const resp2 = await sendMessage("Find all creators related to cinematic field", 6);
  console.log("Response 2 preview:", resp2.slice(0, 350).replace(/\n/g, ' '));
  const pageContent2 = await page.content();
  const hasDepartments = resp2.includes("CAST & ACTING") || resp2.includes("CAMERA & VISUALS") || pageContent2.includes("CAST & ACTING") || pageContent2.includes("CAMERA & VISUALS");
  const hasGenericDump = resp2.includes("211 verified creator profiles") || pageContent2.includes("211 verified creator profiles");
  console.log(`Verified Departments present: ${hasDepartments}`);
  console.log(`Verified NOT generic 211-dump: ${!hasGenericDump}`);
  results.step2 = { hasDepartments, noGenericDump: !hasGenericDump };
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'step2_cinema_search.png'), fullPage: true });

  // -------------------------------------------------------------
  // Step 3: Find all dancers
  // -------------------------------------------------------------
  console.log("\n--- STEP 3: 'Find all dancers' ---");
  const resp3 = await sendMessage("Find all dancers", 5);
  console.log("Response 3 preview:", resp3.slice(0, 200).replace(/\n/g, ' '));
  const pageContent3 = await page.content();
  const dancersFound = ['dhee10_raju', 'bv_edits', 'bsk', 'sanket_dancer'].filter(d => pageContent3.includes(d));
  console.log(`Real Dancer creators displayed: ${dancersFound.length} verified dancers (${dancersFound.map(d => '@' + d).join(', ')})`);
  results.step3 = { dancerCount: dancersFound.length, dancers: dancersFound };
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'step3_find_dancers.png'), fullPage: true });

  // -------------------------------------------------------------
  // Step 4: Who is still missing?
  // -------------------------------------------------------------
  console.log("\n--- STEP 4: 'Who is still missing?' ---");
  const resp4 = await sendMessage("Who is still missing?", 5);
  console.log("Response 4:\n" + resp4);
  const dancerOpenIn4 = resp4.includes("Dancer") && (resp4.includes("Open Positions") || resp4.includes("verified creators available") || resp4.includes("🟡") || resp4.includes("candidates"));
  const notMissingDancerIn4 = !resp4.includes("Missing Dancer") && !resp4.includes("Required production position: Dancer");
  console.log(`Dancer shows OPEN_WITH_CANDIDATES: ${dancerOpenIn4}`);
  console.log(`Dancer is NOT labeled generic missing: ${notMissingDancerIn4}`);
  results.step4 = { dancerOpen: dancerOpenIn4, notMissing: notMissingDancerIn4 };
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'step4_who_is_missing.png'), fullPage: true });

  // -------------------------------------------------------------
  // Step 5: Find all choreographers
  // -------------------------------------------------------------
  console.log("\n--- STEP 5: 'Find all choreographers' ---");
  const resp5 = await sendMessage("Find all choreographers", 5);
  console.log("Response 5 preview:", resp5.slice(0, 200).replace(/\n/g, ' '));
  const pageContent5 = await page.content();
  const choreosFound = ['bsk', 'sanket_dancer', 'dhee10_raju', 'bv_edits'].filter(c => pageContent5.includes(c));
  console.log(`Choreographers found: ${choreosFound.length}`);
  results.step5 = { choreoCount: choreosFound.length };
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'step5_find_choreographers.png'), fullPage: true });

  // -------------------------------------------------------------
  // Step 6: Who is still missing? (Choreographer check)
  // -------------------------------------------------------------
  console.log("\n--- STEP 6: 'Who is still missing?' ---");
  const resp6 = await sendMessage("Who is still missing?", 5);
  console.log("Response 6:\n" + resp6);
  const choreoIn6 = resp6.includes("Choreographer — Required") || resp6.includes("• Choreographer —") || resp6.includes("Choreographer — 4");
  console.log(`Choreographer correctly NOT in required film roles: ${!choreoIn6}`);
  results.step6 = { choreoNotAdded: !choreoIn6 };
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'step6_who_is_missing_choreo.png'), fullPage: true });

  // -------------------------------------------------------------
  // Step 7: Build my complete film squad
  // -------------------------------------------------------------
  console.log("\n--- STEP 7: 'Build my complete film squad' ---");
  const resp7 = await sendMessage("Build my complete film squad", 5);
  console.log("Response 7:\n" + resp7);
  const hasActions7 = resp7.includes("Team Building Actions") || resp7.includes("Open Positions") || resp7.includes("Find Dancers") || resp7.includes("Positions Filled");
  const noAutoHire = !resp7.includes("automatically invited") && !resp7.includes("automatically hired");
  console.log(`Coverage summary & open positions present: ${hasActions7}`);
  console.log(`No automatic hiring/inviting: ${noAutoHire}`);
  results.step7 = { hasActions: hasActions7, noAutoHire };
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'step7_build_squad.png'), fullPage: true });

  // -------------------------------------------------------------
  // Step 8: Refresh
  // -------------------------------------------------------------
  console.log("\n--- STEP 8: Page Refresh ---");
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(4000);
  console.log("Page reloaded. Verifying chat re-attachment...");
  await getChatInput().waitFor({ state: "visible", timeout: 15000 });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'step8_refresh.png'), fullPage: true });

  // -------------------------------------------------------------
  // Step 9: Who is still missing? post-refresh
  // -------------------------------------------------------------
  console.log("\n--- STEP 9: 'Who is still missing?' post-refresh ---");
  const resp9 = await sendMessage("Who is still missing?", 5);
  console.log("Response 9:\n" + resp9);
  const dancerOpenIn9 = resp9.includes("Dancer") && (resp9.includes("Open Positions") || resp9.includes("verified creators available") || resp9.includes("🟡") || resp9.includes("candidates"));
  console.log(`Persistent state preserved: Dancer shows OPEN_WITH_CANDIDATES after refresh: ${dancerOpenIn9}`);
  results.step9 = { dancerOpenPostRefresh: dancerOpenIn9 };
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'step9_who_is_missing_post_refresh.png'), fullPage: true });

  await browser.close();

  console.log("\n==================================================================");
  console.log("REAL BROWSER VERIFICATION SUMMARY:");
  console.log(JSON.stringify(results, null, 2));
  console.log("==================================================================");
}

runBrowserVerification().catch((err) => {
  console.error("Browser verification error:", err);
  process.exit(1);
});
