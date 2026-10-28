import { detectCanonicalDomain, isExplicitDomainSwitch } from "../src/lib/omniforge/domain-detector";
import { classifyUserIntent } from "../src/lib/omniforge/intent";
import {
  generateRequirementsDerivedBlueprint,
  extractStructuredRequirements,
  deriveRolesFromCapabilities,
  derivePhasesAndTasks,
  buildMusicBandTeamArchitectureResponse,
} from "../src/lib/omniforge/requirements-engine";
import { searchAllMusicCreators, validateCreatorForRole } from "../src/lib/omniforge/matcher";
import { buildDynamicMissingRolesResponse } from "../src/lib/omniforge/team-reconciliation";
import { OmniForgeProject } from "../src/lib/omniforge/types";

async function runTestSuite() {
  console.log("==================================================");
  console.log("RUNNING MUSIC BAND & DOMAIN SWITCH TEST SUITE (A-H)");
  console.log("==================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (details) console.error(`   Details: ${details}`);
    }
  }

  // -------------------------------------------------------------------------
  // TEST A: CANONICAL DOMAIN DETECTION
  // -------------------------------------------------------------------------
  console.log("\n--- TEST A: CANONICAL DOMAIN DETECTION ---");
  const p1 = "I need to form a squad for music band ,so i need different type of talent musician creators related to music";
  const p2 = "I am directing a romantic musical short film";
  const p3 = "Build an AI crop disease detection platform";

  assert(detectCanonicalDomain(p1, null) === "MUSIC_BAND", "Test A1: Music band prompt detects MUSIC_BAND domain");
  assert(detectCanonicalDomain(p2, null) === "FILM", "Test A2: Film prompt detects FILM domain");
  assert(detectCanonicalDomain(p3, null) === "SOFTWARE" || detectCanonicalDomain(p3, null) === null, "Test A3: AI crop platform detects SOFTWARE or OTHER");

  // -------------------------------------------------------------------------
  // TEST B: DOMAIN SWITCH ISOLATION
  // -------------------------------------------------------------------------
  console.log("\n--- TEST B: DOMAIN SWITCH ISOLATION ---");
  const filmProject: OmniForgeProject = {
    id: "film-proj-1",
    title: "Romantic Musical Film",
    canonicalDomain: "FILM",
    domain: "Film",
    currentUserRole: "DIRECTOR",
    squadId: "d7c14b35-6554-4c23-a638-527f0d6c7df4",
    phases: [],
    roles: [
      { id: "r1", roleName: "Film Director", category: "Creative", requiredSkills: [], description: "", isFilled: true },
      { id: "r2", roleName: "Lead Actor", category: "Performance", requiredSkills: [], description: "", isFilled: false },
    ],
    capabilities: [],
    recommendations: [],
    coverage: { totalRequired: 1, totalCovered: 0, percentage: 0, coveredCapabilities: [], missingCapabilities: [] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const isSwitch = isExplicitDomainSwitch(p1, filmProject);
  assert(isSwitch === true, "Test B1: Explicit domain switch from Film to Music Band detected");

  // -------------------------------------------------------------------------
  // TEST C: MUSIC BAND ARCHITECTURE GENERATION
  // -------------------------------------------------------------------------
  console.log("\n--- TEST C: MUSIC BAND ARCHITECTURE GENERATION ---");
  const musicReq = extractStructuredRequirements(p1);
  assert(musicReq.requirements.domain === "Music", `Test C1: Requirements domain is Music (got ${musicReq.requirements.domain})`);
  assert(musicReq.capabilities.length >= 6, `Test C2: Generated at least 6 capabilities (got ${musicReq.capabilities.length})`);

  const hasVocals = musicReq.capabilities.some((c) => c.name.toLowerCase().includes("vocal") || c.name.toLowerCase().includes("sing"));
  const hasGuitar = musicReq.capabilities.some((c) => c.name.toLowerCase().includes("guitar"));
  const hasDrums = musicReq.capabilities.some((c) => c.name.toLowerCase().includes("drum") || c.name.toLowerCase().includes("percussion") || c.id.includes("drums"));
  const hasKeys = musicReq.capabilities.some((c) => c.name.toLowerCase().includes("piano") || c.name.toLowerCase().includes("keyboard"));
  assert(hasVocals && hasGuitar && hasDrums && hasKeys, "Test C3: Core band capabilities (vocals, guitar, drums, keys) present");

  const musicRoles = deriveRolesFromCapabilities(musicReq.capabilities);
  assert(musicRoles.length >= 6, `Test C4: Derived at least 6 roles (got ${musicRoles.length})`);

  const musicBlueprint = generateRequirementsDerivedBlueprint({
    userQuery: p1,
    userType: "creator",
    ownerId: "test-user-id",
  });
  assert(musicBlueprint.canonicalDomain === "MUSIC_BAND", "Test C5: Blueprint canonicalDomain is MUSIC_BAND");
  assert(musicBlueprint.title === "My Music Band", `Test C6: Blueprint title is My Music Band (got ${musicBlueprint.title})`);

  // -------------------------------------------------------------------------
  // TEST D: MUSIC BAND ROLES PLANNING INTENT
  // -------------------------------------------------------------------------
  console.log("\n--- TEST D: MUSIC BAND ROLES PLANNING INTENT ---");
  const pClarify = "not that i need only related to music creators like singer,piano player,drum master,and guitarist and many other";
  const intentClarify = classifyUserIntent(pClarify, {
    activeProject: musicBlueprint,
    hasActiveProject: true,
  });

  assert(
    intentClarify.intent === "PROJECT_ROLE_PLANNING",
    `Test D1: Multi-instrument prompt classifies as PROJECT_ROLE_PLANNING (got ${intentClarify.intent})`
  );
  assert(
    Boolean(intentClarify.deterministicText?.includes("Vocals") && intentClarify.deterministicText?.includes("Guitar")),
    "Test D2: Deterministic response contains structured taxonomy breakdown"
  );
  assert(
    !intentClarify.deterministicText?.toLowerCase().includes("director"),
    "Test D3: Deterministic response does NOT include Director"
  );

  // -------------------------------------------------------------------------
  // TEST E: REAL MUSIC CREATOR SEARCH (NO FAKE CREATORS)
  // -------------------------------------------------------------------------
  console.log("\n--- TEST E: REAL MUSIC CREATOR SEARCH (NO FAKE CREATORS) ---");
  const musicSearchRes = await searchAllMusicCreators();
  assert(musicSearchRes.roleCounts !== undefined, "Test E1: searchAllMusicCreators returns roleCounts");
  assert(
    musicSearchRes.roleCounts["Lead Singer"] >= 1,
    `Test E2: Verified Singer found in DB (got ${musicSearchRes.roleCounts["Lead Singer"]})`
  );
  assert(
    musicSearchRes.roleCounts["Piano Player"] === 0,
    `Test E3: Exactly 0 Piano Players reported (no hallucinated fake creators)`
  );
  assert(
    musicSearchRes.roleCounts["Drummer"] === 0,
    `Test E4: Exactly 0 Drummers reported (no hallucinated fake creators)`
  );
  assert(
    !musicSearchRes.replyMessage.includes("@singer_9876") &&
    !musicSearchRes.replyMessage.includes("@piano_muse_45") &&
    !musicSearchRes.replyMessage.includes("@drum_king_12") &&
    !musicSearchRes.replyMessage.includes("@guitar_sage_30"),
    "Test E5: Absolutely NO fictional/hallucinated handles in output"
  );
  assert(
    musicSearchRes.replyMessage.includes("Publish Client Job") &&
    musicSearchRes.replyMessage.includes("Open Collaboration Call") &&
    musicSearchRes.replyMessage.includes("Skill-for-Service Swap") &&
    musicSearchRes.replyMessage.includes("Add Manually by Username"),
    "Test E6: Output lists all 4 canonical alternatives for unfilled roles"
  );

  // -------------------------------------------------------------------------
  // TEST F: DYNAMIC MISSING ROLES
  // -------------------------------------------------------------------------
  console.log("\n--- TEST F: DYNAMIC MISSING ROLES ---");
  const missingMusicResp = buildDynamicMissingRolesResponse(musicBlueprint, false, "MUSIC_BAND");
  assert(
    missingMusicResp.includes("### 🎵 Music Band Team Coverage Analysis"),
    "Test F1: Output contains Music Band header"
  );
  assert(
    !missingMusicResp.includes("Film Production"),
    "Test F2: Output does NOT contain Film Production header"
  );
  assert(
    !missingMusicResp.includes("Director — Covered by You"),
    "Test F3: Output does NOT contain Director card"
  );
  assert(
    !missingMusicResp.includes("Lead Actor") && !missingMusicResp.includes("Cinematographer"),
    "Test F4: Output does NOT contain film roles (Lead Actor, Cinematographer)"
  );
  assert(
    missingMusicResp.includes("Lead Singer") && missingMusicResp.includes("Guitarist"),
    "Test F5: Output contains core band roles (Lead Singer, Guitarist)"
  );

  // -------------------------------------------------------------------------
  // TEST G: TEAM FORMATION ON MUSIC BAND
  // -------------------------------------------------------------------------
  console.log("\n--- TEST G: TEAM FORMATION ON MUSIC BAND ---");
  const buildBandIntent = classifyUserIntent("Build my complete music band", {
    activeProject: musicBlueprint,
    hasActiveProject: true,
  });
  assert(
    buildBandIntent.intent === "TEAM_FORMATION",
    `Test G1: "Build my complete music band" classifies as TEAM_FORMATION (got ${buildBandIntent.intent})`
  );
  assert(
    buildBandIntent.deterministicText?.includes("music band workspace"),
    `Test G2: Deterministic text refers to music band workspace (got "${buildBandIntent.deterministicText}")`
  );
  assert(
    !buildBandIntent.deterministicText?.includes("film squad"),
    "Test G3: Deterministic text does NOT refer to film squad"
  );

  // -------------------------------------------------------------------------
  // TEST H: PERSISTENCE & RELOAD
  // -------------------------------------------------------------------------
  console.log("\n--- TEST H: PERSISTENCE & RELOAD ---");
  assert(musicBlueprint.id !== filmProject.id, "Test H1: Music band project ID is distinct from film project ID");
  assert(musicBlueprint.canonicalDomain === "MUSIC_BAND", "Test H2: Music band canonical domain preserved");
  assert(filmProject.canonicalDomain === "FILM", "Test H3: Original film project preserved without mutation");

  console.log("\n==================================================");
  console.log(`TEST SUITE FINISHED: ${passed} / ${total} TESTS PASSED`);
  console.log("==================================================");

  if (passed === total) {
    console.log("🎉 ALL TESTS A-H PASSED SUCCESSFULLY!");
    process.exit(0);
  } else {
    console.error(`💥 ${total - passed} TESTS FAILED!`);
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
