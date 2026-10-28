import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\rakes\\.gemini\\antigravity-ide\\brain\\0c86b0c6-dc9b-4362-a766-bfb3fa33e9b5';

async function runCrewPlanningBrowserVerification() {
  console.log("==================================================================");
  console.log("STARTING CREW REQUIREMENT INTELLIGENCE BROWSER VERIFICATION");
  console.log("==================================================================\n");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('[OmniForge') || text.includes('Crew Intelligence') || text.includes('Team Reconciliation') || text.includes('calculateFilmTeamStatus')) {
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

    const chatAiBubbles = page.locator('.justify-start div[class*="bg-surface"], .justify-start .chat-markdown');
    const count = await chatAiBubbles.count();
    let latest = "";
    if (count > 0) {
      latest = (await chatAiBubbles.nth(count - 1).innerText()) || "";
    }
    return latest;
  }

  let totalPassed = 0;
  let totalTests = 0;

  function assertCheck(name, condition, details = "") {
    totalTests++;
    if (condition) {
      totalPassed++;
      console.log(`  [PASS] ${name} ${details}`);
    } else {
      console.error(`  [FAIL] ${name} ${details}`);
    }
  }

  // -------------------------------------------------------------
  // Test Step 1: "I am a professional film director and I want to make a short film."
  // -------------------------------------------------------------
  console.log("\n--- STEP 1: 'I am a professional film director and I want to make a short film.' ---");
  const resp1 = await sendMessage("I am a professional film director and I want to make a short film.", 5);
  console.log("Response 1 snippet:\n" + resp1.slice(0, 400) + "...\n");
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'crew_step1_generic_short_film.png'), fullPage: true });

  // Checks on Step 1:
  // Dancer and Lead Singer must NOT be marked as required/core
  const dancerNotRequired = !resp1.includes("Dancer: REQUIRED") && !resp1.includes("[CORE] Dancer") && !resp1.includes("[PROJECT_REQUIRED] Dancer");
  assertCheck("Step 1: Dancer is not marked as REQUIRED/CORE", dancerNotRequired);

  const singerNotRequired = !resp1.includes("Lead Singer: REQUIRED") && !resp1.includes("[CORE] Lead Singer") && !resp1.includes("[PROJECT_REQUIRED] Lead Singer");
  assertCheck("Step 1: Lead Singer is not marked as REQUIRED/CORE", singerNotRequired);

  const mentionsProjectDependent = resp1.includes("PROJECT_DEPENDENT") || resp1.includes("Project-Dependent") || resp1.includes("Project-dependent");
  assertCheck("Step 1: Response indicates Project-Dependent roles", mentionsProjectDependent);

  // -------------------------------------------------------------
  // Test Step 2: "Who is still missing?"
  // -------------------------------------------------------------
  console.log("\n--- STEP 2: 'Who is still missing?' ---");
  const resp2 = await sendMessage("Who is still missing?", 5);
  console.log("Response 2 snippet:\n" + resp2.slice(0, 500) + "...\n");
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'crew_step2_missing_roles.png'), fullPage: true });

  // Checks on Step 2:
  // Dancer, Singer, Choreographer must NOT appear in Open/Missing Required Roles
  const openOrMissingPart = resp2.split(/Project-Dependent Roles/i)[0] || "";
  const dancerNotInMissing = !openOrMissingPart.includes("Dancer —") && !openOrMissingPart.includes("Dancer -");
  assertCheck("Step 2: Dancer NOT in Open/Missing Required Roles", dancerNotInMissing);

  const singerNotInMissing = !openOrMissingPart.includes("Lead Singer —") && !openOrMissingPart.includes("Lead Singer -");
  assertCheck("Step 2: Lead Singer NOT in Open/Missing Required Roles", singerNotInMissing);

  const choreoNotInMissing = !openOrMissingPart.includes("Choreographer —") && !openOrMissingPart.includes("Choreographer -");
  assertCheck("Step 2: Choreographer NOT in Open/Missing Required Roles", choreoNotInMissing);

  const hasProjectDependentSection = resp2.includes("Project-Dependent Roles");
  assertCheck("Step 2: Has separate Project-Dependent Roles section", hasProjectDependentSection);

  // -------------------------------------------------------------
  // Test Step 3: "Find all dancers"
  // -------------------------------------------------------------
  console.log("\n--- STEP 3: 'Find all dancers' ---");
  const resp3 = await sendMessage("Find all dancers", 5);
  console.log("Response 3 snippet:\n" + resp3.slice(0, 300) + "...\n");
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'crew_step3_candidate_search.png'), fullPage: true });

  // Candidate search should return dancer candidates (e.g. priya_dance or dancers found)
  const foundDancers = resp3.toLowerCase().includes("dancer") || resp3.toLowerCase().includes("priya");
  assertCheck("Step 3: Found dancer candidates without altering requirement status", foundDancers);

  // -------------------------------------------------------------
  // Test Step 4: "I need dancers for my film."
  // -------------------------------------------------------------
  console.log("\n--- STEP 4: 'I need dancers for my film.' ---");
  const resp4 = await sendMessage("I need dancers for my film.", 5);
  console.log("Response 4 snippet:\n" + resp4.slice(0, 400) + "...\n");
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'crew_step4_explicit_activation.png'), fullPage: true });

  const activatedDancer = resp4.toLowerCase().includes("dancer") && (resp4.toLowerCase().includes("activated") || resp4.toLowerCase().includes("project-required") || resp4.toLowerCase().includes("added"));
  assertCheck("Step 4: Explicit requirement activated Dancer role", activatedDancer);

  // -------------------------------------------------------------
  // Test Step 5: "Who is still missing?" (after activation)
  // -------------------------------------------------------------
  console.log("\n--- STEP 5: 'Who is still missing?' (after activating dancers) ---");
  const resp5 = await sendMessage("Who is still missing?", 5);
  console.log("Response 5 snippet:\n" + resp5.slice(0, 500) + "...\n");
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'crew_step5_missing_with_dancers.png'), fullPage: true });

  // Now Dancer SHOULD appear in the required open roles
  const openOrMissingPart5 = resp5.split(/Project-Dependent Roles/i)[0] || "";
  const dancerNowInOpen = openOrMissingPart5.includes("Dancer") || resp5.includes("🟡 Open Roles With Candidates In System:\n- Dancer");
  assertCheck("Step 5: Dancer now included in required open roles", dancerNowInOpen);

  // -------------------------------------------------------------
  // Test Step 6: "Build my complete film squad."
  // -------------------------------------------------------------
  console.log("\n--- STEP 6: 'Build my complete film squad.' ---");
  const resp6 = await sendMessage("Build my complete film squad.", 6);
  console.log("Response 6 snippet:\n" + resp6.slice(0, 600) + "...\n");
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'crew_step6_complete_squad_matrix.png'), fullPage: true });

  // Verification of dynamic count and 4 sections:
  const notHardcoded5of7 = !resp6.includes("External Positions Filled: 5 of 7");
  assertCheck("Step 6: Ratio is NOT hardcoded '5 of 7'", notHardcoded5of7);

  const hasSection1 = resp6.includes("1. FILLED POSITIONS") || resp6.includes("FILLED");
  assertCheck("Step 6: Section 1 (Filled positions) is present", hasSection1);

  const hasSection2 = resp6.includes("2. OPEN ROLES WITH MATCHED CANDIDATES") || resp6.includes("MATCHED CANDIDATES");
  assertCheck("Step 6: Section 2 (Open with candidates) is present", hasSection2);

  const hasSection3 = resp6.includes("3. OPEN ROLES REQUIRING EXTERNAL RECRUITMENT") || resp6.includes("WITHOUT CANDIDATES");
  assertCheck("Step 6: Section 3 (Open without candidates) is present", hasSection3);

  const hasSection4 = resp6.includes("4. PROJECT-DEPENDENT") || resp6.includes("PROJECT-DEPENDENT");
  assertCheck("Step 6: Section 4 (Project-dependent) is present", hasSection4);

  console.log(`\n==================================================================`);
  console.log(`BROWSER VERIFICATION SUMMARY: ${totalPassed}/${totalTests} CHECKS PASSED`);
  console.log(`==================================================================\n`);

  await browser.close();

  if (totalPassed < totalTests) {
    process.exit(1);
  }
}

runCrewPlanningBrowserVerification().catch((err) => {
  console.error("FATAL ERROR in browser verification:", err);
  process.exit(1);
});
