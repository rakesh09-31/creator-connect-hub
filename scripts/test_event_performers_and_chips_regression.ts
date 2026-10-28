import { classifyUserIntent, isCreatorSearchQuery } from "../src/lib/omniforge/intent";
import { searchCreatorsDirectory } from "../src/lib/omniforge/matcher";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Read .env if present
try {
  const envContent = fs.readFileSync(path.resolve(process.cwd(), ".env"), "utf8");
  for (const line of envContent.split("\n")) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      const value = (match[2] || "").trim().replace(/^['"]|['"]$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  }
} catch (e) {}

const collegeFestivalProject = {
  id: "proj_college_fest_123",
  title: "College Cultural Festival",
  domain: "Events",
  type: "Cultural Festival",
  roles: [
    { role: "Performers", required: 3, filled: 0, department: "Performance" },
    { role: "Event Coordinator", required: 1, filled: 0, department: "Operations" },
    { role: "Stage/Lighting Technician", required: 1, filled: 0, department: "Technical" },
    { role: "Sound Engineer", required: 1, filled: 0, department: "Audio" },
    { role: "Sponsorship/Business Development", required: 1, filled: 0, department: "Business" },
    { role: "Event Manager", required: 1, filled: 0, department: "Management" }
  ]
};

async function runTests() {
  console.log("==================================================");
  console.log("RUNNING OMNIFORGE INTENT & CHIP REGRESSION TESTS");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${msg}`);
      failed++;
    }
  }

  // TEST 1: "Find Performers"
  console.log("Test 1: 'Find Performers'");
  const t1 = classifyUserIntent("Find Performers", { activeProject: collegeFestivalProject });
  assert(t1.intent === "CREATOR_SEARCH", `Intent is CREATOR_SEARCH (got ${t1.intent})`);
  assert(t1.targetRole === "Performers", `Target role is Performers (got ${t1.targetRole})`);
  assert(t1.matching_action === "SEARCH_CREATORS", `Matching action is SEARCH_CREATORS (got ${t1.matching_action})`);
  assert(!t1.suggestedChips?.includes("Give Viva Questions"), `No viva questions chip in suggestedChips`);

  // TEST 2: "Search for performers"
  console.log("\nTest 2: 'Search for performers'");
  const t2 = classifyUserIntent("Search for performers", { activeProject: collegeFestivalProject });
  assert(t2.intent === "CREATOR_SEARCH", `Intent is CREATOR_SEARCH (got ${t2.intent})`);
  assert(t2.targetRole === "Performers", `Target role is Performers (got ${t2.targetRole})`);

  // TEST 3: "Show me performers"
  console.log("\nTest 3: 'Show me performers'");
  const t3 = classifyUserIntent("Show me performers", { activeProject: collegeFestivalProject });
  assert(t3.intent === "CREATOR_SEARCH", `Intent is CREATOR_SEARCH (got ${t3.intent})`);
  assert(t3.targetRole === "Performers", `Target role is Performers (got ${t3.targetRole})`);

  // TEST 4: "Find performers for this festival"
  console.log("\nTest 4: 'Find performers for this festival'");
  const t4 = classifyUserIntent("Find performers for this festival", { activeProject: collegeFestivalProject });
  assert(t4.intent === "CREATOR_SEARCH", `Intent is CREATOR_SEARCH (got ${t4.intent})`);
  assert(t4.targetRole === "Performers", `Target role is Performers (got ${t4.targetRole})`);

  // TEST 4B: "Can you find performers for my event?"
  console.log("\nTest 4B: 'Can you find performers for my event?'");
  const t4b = classifyUserIntent("Can you find performers for my event?", { activeProject: collegeFestivalProject });
  assert(t4b.intent === "CREATOR_SEARCH", `Intent is CREATOR_SEARCH (got ${t4b.intent})`);
  assert(t4b.targetRole === "Performers", `Target role is Performers (got ${t4b.targetRole})`);

  // TEST 5: "How can I find performers?"
  console.log("\nTest 5: 'How can I find performers?'");
  const t5 = classifyUserIntent("How can I find performers?", { activeProject: collegeFestivalProject });
  assert(t5.intent === "HOW_TO", `Intent is HOW_TO (got ${t5.intent})`);
  assert(t5.targetRole === undefined || t5.targetRole === null, `No directory targetRole for HOW_TO`);

  // TEST 6: "Where can I find performers?"
  console.log("\nTest 6: 'Where can I find performers?'");
  const t6 = classifyUserIntent("Where can I find performers?", { activeProject: collegeFestivalProject });
  assert(t6.intent === "HOW_TO", `Intent is HOW_TO (got ${t6.intent})`);

  // TEST 7: "What are good ways to recruit performers?"
  console.log("\nTest 7: 'What are good ways to recruit performers?'");
  const t7 = classifyUserIntent("What are good ways to recruit performers?", { activeProject: collegeFestivalProject });
  assert(t7.intent === "HOW_TO", `Intent is HOW_TO (got ${t7.intent})`);

  // TEST 8: "Find Video Editors"
  console.log("\nTest 8: 'Find Video Editors'");
  const t8 = classifyUserIntent("Find Video Editors");
  assert(t8.intent === "CREATOR_SEARCH", `Intent is CREATOR_SEARCH (got ${t8.intent})`);
  assert(t8.targetRole === "Video Editor", `Target role is Video Editor (got ${t8.targetRole})`);

  // TEST 9: "Find Cinematographers"
  console.log("\nTest 9: 'Find Cinematographers'");
  const t9 = classifyUserIntent("Find Cinematographers");
  assert(t9.intent === "CREATOR_SEARCH", `Intent is CREATOR_SEARCH (got ${t9.intent})`);
  assert(t9.targetRole === "Cinematographer", `Target role is Cinematographer (got ${t9.targetRole})`);

  // TEST 10: "Find Dancers"
  console.log("\nTest 10: 'Find Dancers'");
  const t10 = classifyUserIntent("Find Dancers");
  assert(t10.intent === "CREATOR_SEARCH", `Intent is CREATOR_SEARCH (got ${t10.intent})`);
  assert(t10.targetRole === "Dancer", `Target role is Dancer (got ${t10.targetRole})`);

  // TEST 11: Real Directory Search for "Performers"
  console.log("\nTest 11: Real Directory Search for 'Performers'");
  const searchResult = await searchCreatorsDirectory({
    targetRole: "Performers",
  });

  assert(searchResult.totalCount > 0, `Directory search found real performers (found ${searchResult.totalCount})`);
  assert(searchResult.creators.length > 0, `Returned candidate array is not empty (length = ${searchResult.creators.length})`);
  
  // Verify evidence
  const hasEvidence = searchResult.creators.every(c => c.matchReason && c.matchReason.length > 0);
  assert(hasEvidence, `Every performer candidate has legitimate match evidence`);
  
  // Check multi-role performers (Actor, Singer, Dancer, Musician)
  const specialties = searchResult.creators.flatMap(c => c.creator.specialties || []);
  const allRoles = searchResult.creators.flatMap(c => c.creator.roles || []);
  console.log(`  Candidate specialties: ${Array.from(new Set(specialties)).join(", ")}`);
  console.log(`  Candidate roles: ${Array.from(new Set(allRoles)).join(", ")}`);
  assert(
    specialties.some(s => ["Actor", "Dancer", "Singer", "Musician", "Performer"].includes(s)) ||
    allRoles.some(r => ["Actor", "Dancer", "Singer", "Musician", "Performer"].includes(r)),
    `Specialties or roles contain relevant performer evidence`
  );

  // TEST 12: Chip Context Tests
  console.log("\nTest 12: Context-Aware Chip Generation Tests");
  
  // 12A: College Cultural Festival chips
  const tFest = classifyUserIntent("I want to organize a College Cultural Festival");
  assert(
    !tFest.suggestedChips?.some(c => c.includes("Viva") || c.includes("5-Mark") || c.includes("Program")),
    `Project Creation for festival has no academic chips: ${JSON.stringify(tFest.suggestedChips)}`
  );
  assert(
    tFest.suggestedChips?.includes("Find Performers") || tFest.suggestedChips?.includes("Find Event Coordinator"),
    `Project Creation for festival contains event chips`
  );

  // 12B: Creator search chips
  assert(
    JSON.stringify(t1.suggestedChips) === JSON.stringify(["Show More Creators", "Refine Search", "Search Another Role", "Select Creator", "View Profile"]),
    `CREATOR_SEARCH has correct directory chips: ${JSON.stringify(t1.suggestedChips)}`
  );

  // 12C: "Explain my project requirements"
  const tExpProj = classifyUserIntent("Explain my project requirements", { activeProject: collegeFestivalProject });
  assert(
    !tExpProj.suggestedChips?.some(c => c.includes("Viva") || c.includes("5-Mark") || c.includes("Program")),
    `"Explain my project requirements" does NOT have educational chips: ${JSON.stringify(tExpProj.suggestedChips)}`
  );

  // 12D: "Explain how to hire a creator"
  const tExpHire = classifyUserIntent("Explain how to hire a creator");
  assert(
    !tExpHire.suggestedChips?.some(c => c.includes("Viva") || c.includes("5-Mark") || c.includes("Program")),
    `"Explain how to hire a creator" does NOT have educational chips: ${JSON.stringify(tExpHire.suggestedChips)}`
  );

  // 12E: "Explain DNS" (Genuine educational)
  const tEdu = classifyUserIntent("Explain DNS");
  assert(
    tEdu.suggestedChips?.includes("Give Viva Questions") || tEdu.suggestedChips?.includes("Give 5-Mark Answer"),
    `"Explain DNS" (genuine academic) has educational chips: ${JSON.stringify(tEdu.suggestedChips)}`
  );

  console.log("\n==================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("Test execution error:", err);
  process.exit(1);
});
