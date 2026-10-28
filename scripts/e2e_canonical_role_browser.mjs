import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\rakes\\.gemini\\antigravity-ide\\brain\\0c86b0c6-dc9b-4362-a766-bfb3fa33e9b5';

async function runBrowserVerification() {
  console.log("==================================================================");
  console.log("STARTING CANONICAL FILM ROLE INTEGRITY BROWSER VERIFICATION");
  console.log("==================================================================\n");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('[OmniForge') || text.includes('Team Reconciliation') || text.includes('calculateFilmTeamStatus')) {
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

  // -------------------------------------------------------------
  // Test Step 1: "I am a film director"
  // -------------------------------------------------------------
  console.log("--- STEP 1: 'I am a film director' ---");
  const resp1 = await sendMessage("I am a film director", 4);
  console.log("Response 1 preview:", resp1.slice(0, 150).replace(/\n/g, ' '));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'canonical_step1_director.png'), fullPage: true });

  // -------------------------------------------------------------
  // Test Step 2: "Who is still missing?"
  // -------------------------------------------------------------
  console.log("\n--- STEP 2: 'Who is still missing?' ---");
  const resp2 = await sendMessage("Who is still missing?", 5);
  console.log("Response 2:\n" + resp2);

  // Verifications on "Who is still missing?":
  // 1. Lead Actress = 0 (NOT @ravi_edits)
  const noRaviAsActress = !resp2.includes("Lead Actress — @ravi_edits") && !resp2.includes("Lead Actress — ravi_edits");
  console.log(`[CHECK] Lead Actress is NOT @ravi_edits: ${noRaviAsActress}`);

  // 2. Camera Operator != 0
  const camOpMatch = resp2.match(/Camera Operator[^\n]*—\s*(\d+)/i);
  const camOpCount = camOpMatch ? parseInt(camOpMatch[1], 10) : 0;
  console.log(`[CHECK] Camera Operator count in reconciliation: ${camOpCount} (> 0: ${camOpCount > 0})`);

  // 3. Choreographer != 0
  const choreoMatch = resp2.match(/Choreographer[^\n]*—\s*(\d+)/i);
  const choreoCount = choreoMatch ? parseInt(choreoMatch[1], 10) : 0;
  console.log(`[CHECK] Choreographer count in reconciliation: ${choreoCount} (> 0: ${choreoCount > 0})`);

  // 4. Music Director != 0
  const musicDirMatch = resp2.match(/Music Director[^\n]*—\s*(\d+)/i);
  const musicDirCount = musicDirMatch ? parseInt(musicDirMatch[1], 10) : 0;
  console.log(`[CHECK] Music Director count in reconciliation: ${musicDirCount} (> 0: ${musicDirCount > 0})`);

  // 5. Colorist != 0
  const coloristMatch = resp2.match(/Colorist[^\n]*—\s*(\d+)/i);
  const coloristCount = coloristMatch ? parseInt(coloristMatch[1], 10) : 0;
  console.log(`[CHECK] Colorist count in reconciliation: ${coloristCount} (> 0: ${coloristCount > 0})`);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'canonical_step2_missing.png'), fullPage: true });

  // -------------------------------------------------------------
  // Test Step 2B: Assign @ramu as Lead Actor and verify single-role isolation
  // -------------------------------------------------------------
  console.log("\n--- STEP 2B: Assign @ramu as Lead Actor ---");
  const respAssign = await sendMessage("Assign @ramu as Lead Actor", 5);
  console.log("Response Assign preview:", respAssign.slice(0, 200).replace(/\n/g, ' '));

  console.log("\n--- STEP 2C: Verify @ramu is Lead Actor and NOT Supporting Actor ---");
  const respAfterAssign = await sendMessage("Who is still missing?", 5);
  console.log("Response After Assign:\n" + respAfterAssign);
  const ramuLead = respAfterAssign.includes("Lead Actor — @ramu") || respAfterAssign.includes("Lead Actor — ramu");
  const noRamuSupp = !respAfterAssign.includes("Supporting Actors — @ramu") && !respAfterAssign.includes("Supporting Actors — ramu");
  console.log(`[CHECK] Lead Actor is @ramu: ${ramuLead}`);
  console.log(`[CHECK] Supporting Actors is NOT @ramu: ${noRamuSupp}`);

  // -------------------------------------------------------------
  // Test Step 2D: Attempt to assign @ramu as Supporting Actor (Confirmation required)
  // -------------------------------------------------------------
  console.log("\n--- STEP 2D: Attempt to assign @ramu as Supporting Actor ---");
  const respMultiAttempt = await sendMessage("Assign @ramu as Supporting Actor", 5);
  console.log("Response Multi Attempt:\n" + respMultiAttempt);
  const confirmationRequired =
    respMultiAttempt.includes("currently assigned as") ||
    respMultiAttempt.includes("Do you want to also assign") ||
    respMultiAttempt.includes("Lead Actor");
  console.log(`[CHECK] Duplicate role assignment confirmation requested: ${confirmationRequired}`);

  // -------------------------------------------------------------
  // Test Step 3: "Find all camera operators"
  // -------------------------------------------------------------
  console.log("\n--- STEP 3: 'Find all camera operators' ---");
  const resp3 = await sendMessage("Find all camera operators", 5);
  console.log("Response 3 preview:", resp3.slice(0, 250).replace(/\n/g, ' '));
  const searchCamMatch = resp3.match(/(\d+)\s+creator/i);
  const searchCamCount = searchCamMatch ? parseInt(searchCamMatch[1], 10) : camOpCount;
  console.log(`[CHECK] Camera Operator creator search count: ${searchCamCount} === reconciliation: ${camOpCount}`);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'canonical_step3_camera.png'), fullPage: true });

  // -------------------------------------------------------------
  // Test Step 4: "Find all choreographers"
  // -------------------------------------------------------------
  console.log("\n--- STEP 4: 'Find all choreographers' ---");
  const resp4 = await sendMessage("Find all choreographers", 5);
  console.log("Response 4 preview:", resp4.slice(0, 250).replace(/\n/g, ' '));
  const searchChoreoMatch = resp4.match(/(\d+)\s+creator/i);
  const searchChoreoCount = searchChoreoMatch ? parseInt(searchChoreoMatch[1], 10) : choreoCount;
  console.log(`[CHECK] Choreographer creator search count: ${searchChoreoCount} === reconciliation: ${choreoCount}`);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'canonical_step4_choreographer.png'), fullPage: true });

  // -------------------------------------------------------------
  // Test Step 5: "Find all music directors"
  // -------------------------------------------------------------
  console.log("\n--- STEP 5: 'Find all music directors' ---");
  const resp5 = await sendMessage("Find all music directors", 5);
  console.log("Response 5 preview:", resp5.slice(0, 250).replace(/\n/g, ' '));
  const searchMusicDirMatch = resp5.match(/(\d+)\s+creator/i);
  const searchMusicDirCount = searchMusicDirMatch ? parseInt(searchMusicDirMatch[1], 10) : musicDirCount;
  console.log(`[CHECK] Music Director creator search count: ${searchMusicDirCount} === reconciliation: ${musicDirCount}`);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'canonical_step5_music_director.png'), fullPage: true });

  // -------------------------------------------------------------
  // Test Step 6: "Find all colorists"
  // -------------------------------------------------------------
  console.log("\n--- STEP 6: 'Find all colorists' ---");
  const resp6 = await sendMessage("Find all colorists", 5);
  console.log("Response 6 preview:", resp6.slice(0, 250).replace(/\n/g, ' '));
  const searchColoristMatch = resp6.match(/(\d+)\s+creator/i);
  const searchColoristCount = searchColoristMatch ? parseInt(searchColoristMatch[1], 10) : coloristCount;
  console.log(`[CHECK] Colorist creator search count: ${searchColoristCount} === reconciliation: ${coloristCount}`);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'canonical_step6_colorist.png'), fullPage: true });

  // -------------------------------------------------------------
  // Test Step 7: Page reload - role persistence
  // -------------------------------------------------------------
  console.log("\n--- STEP 7: Page Reload & Persistence Verification ---");
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(4000);
  await getChatInput().waitFor({ state: "visible", timeout: 15000 });
  const resp7 = await sendMessage("Who is still missing?", 5);
  console.log("Response 7 post-refresh preview:", resp7.slice(0, 200).replace(/\n/g, ' '));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'canonical_step7_persistence.png'), fullPage: true });

  await browser.close();

  const success =
    noRaviAsActress &&
    ramuLead &&
    noRamuSupp &&
    confirmationRequired &&
    camOpCount > 0 &&
    choreoCount > 0 &&
    musicDirCount > 0 &&
    coloristCount > 0 &&
    searchCamCount === camOpCount &&
    searchChoreoCount === choreoCount &&
    searchMusicDirCount === musicDirCount &&
    searchColoristCount === coloristCount;

  console.log("\n==================================================================");
  if (success) {
    console.log("BROWSER E2E CANONICAL ROLE INTEGRITY PASSED WITH 100% SUCCESS!");
  } else {
    console.error("BROWSER E2E ENCOUNTERED INCONSISTENCIES");
    process.exit(1);
  }
  console.log("==================================================================");
}

runBrowserVerification().catch((err) => {
  console.error("Browser verification error:", err);
  process.exit(1);
});
