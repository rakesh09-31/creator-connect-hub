import { classifyUserIntent, extractCreatorSelfRole, isCreatorJobSeekingQuery, isJobApplicationQuery, isClientOpportunitySearchQuery, extractOpportunityTargetRole } from "../src/lib/omniforge/intent";
import { searchClientOpportunities } from "../src/lib/omniforge/matcher";
import { transitionConversationState, createInitialConversationState } from "../src/lib/omniforge/conversation-state";

async function runTestSuite() {
  console.log("================================================================================");
  console.log("CLIENT OPPORTUNITY SEARCH & CREATOR JOB SEEKING REGRESSION SUITE");
  console.log("================================================================================\n");

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
  // TEST 1: Exact User Message 1: "iam a video editor so find the cretors who required a video editor"
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 1: Exact User Message 1 ---");
  const p1 = "iam a video editor so find the cretors who required a video editor";
  const res1 = classifyUserIntent(p1);
  assert(res1.intent === "CLIENT_OPPORTUNITY_SEARCH", "Test 1a: Intent is CLIENT_OPPORTUNITY_SEARCH", `got ${res1.intent}`);
  assert(res1.matching_action === "SEARCH_CLIENT_OPPORTUNITIES", "Test 1b: Action is SEARCH_CLIENT_OPPORTUNITIES", `got ${res1.matching_action}`);
  assert(res1.currentUserType === "CREATOR", "Test 1c: currentUserType is CREATOR", `got ${res1.currentUserType}`);
  assert(res1.currentUserRole === "Video Editor", "Test 1d: currentUserRole is Video Editor", `got ${res1.currentUserRole}`);
  assert(res1.targetRole === "Video Editor", "Test 1e: targetRole is Video Editor", `got ${res1.targetRole}`);

  // -------------------------------------------------------------------------
  // TEST 2: Exact User Message 2: "sorry ,find the clients who require video editors"
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 2: Exact User Message 2 ---");
  const p2 = "sorry ,find the clients who require video editors";
  const res2 = classifyUserIntent(p2);
  assert(res2.intent === "CLIENT_OPPORTUNITY_SEARCH", "Test 2a: Intent is CLIENT_OPPORTUNITY_SEARCH", `got ${res2.intent}`);
  assert(res2.matching_action === "SEARCH_CLIENT_OPPORTUNITIES", "Test 2b: Action is SEARCH_CLIENT_OPPORTUNITIES", `got ${res2.matching_action}`);
  assert(res2.targetRole === "Video Editor", "Test 2c: targetRole is Video Editor", `got ${res2.targetRole}`);

  // -------------------------------------------------------------------------
  // TEST 3: Section 16 Test 1: "I am a video editor looking for clients"
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 3: Section 16 Test 1 ---");
  const p3 = "I am a video editor looking for clients";
  const res3 = classifyUserIntent(p3);
  assert(res3.intent === "CLIENT_OPPORTUNITY_SEARCH", "Test 3a: Intent is CLIENT_OPPORTUNITY_SEARCH", `got ${res3.intent}`);
  assert(res3.targetRole === "Video Editor", "Test 3b: targetRole is Video Editor", `got ${res3.targetRole}`);
  assert(res3.currentUserType === "CREATOR", "Test 3c: currentUserType is CREATOR", `got ${res3.currentUserType}`);

  // -------------------------------------------------------------------------
  // TEST 4: Section 16 Test 2: "find clients who need video editors"
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 4: Section 16 Test 2 ---");
  const p4 = "find clients who need video editors";
  const res4 = classifyUserIntent(p4);
  assert(res4.intent === "CLIENT_OPPORTUNITY_SEARCH", "Test 4a: Intent is CLIENT_OPPORTUNITY_SEARCH", `got ${res4.intent}`);
  assert(res4.targetRole === "Video Editor", "Test 4b: targetRole is Video Editor", `got ${res4.targetRole}`);

  // -------------------------------------------------------------------------
  // TEST 5: Section 16 Test 3: "find projects requiring video editors"
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 5: Section 16 Test 3 ---");
  const p5 = "find projects requiring video editors";
  const res5 = classifyUserIntent(p5);
  assert(res5.intent === "CLIENT_OPPORTUNITY_SEARCH", "Test 5a: Intent is CLIENT_OPPORTUNITY_SEARCH", `got ${res5.intent}`);
  assert(res5.targetRole === "Video Editor", "Test 5b: targetRole is Video Editor", `got ${res5.targetRole}`);

  // -------------------------------------------------------------------------
  // TEST 6: Section 16 Test 4: "find jobs for video editors"
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 6: Section 16 Test 4 ---");
  const p6 = "find jobs for video editors";
  const res6 = classifyUserIntent(p6);
  assert(res6.intent === "CLIENT_OPPORTUNITY_SEARCH", "Test 6a: Intent is CLIENT_OPPORTUNITY_SEARCH", `got ${res6.intent}`);
  assert(res6.targetRole === "Video Editor", "Test 6b: targetRole is Video Editor", `got ${res6.targetRole}`);

  // -------------------------------------------------------------------------
  // TEST 7: Section 16 Test 5 (Client Mode): "I need a video editor"
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 7: Section 16 Test 5 (Client Mode) ---");
  const p7 = "I need a video editor";
  const res7 = classifyUserIntent(p7);
  assert(res7.intent === "CREATOR_SEARCH", "Test 7a: Intent is CREATOR_SEARCH (Client Mode)", `got ${res7.intent}`);
  assert(res7.matching_action === "SEARCH_CREATORS", "Test 7b: Action is SEARCH_CREATORS", `got ${res7.matching_action}`);
  assert(res7.targetRole === "Video Editor", "Test 7c: targetRole is Video Editor", `got ${res7.targetRole}`);

  // -------------------------------------------------------------------------
  // TEST 8: Section 16 Test 6 (Client Mode): "find video editors for my project"
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 8: Section 16 Test 6 (Client Mode) ---");
  const p8 = "find video editors for my project";
  const res8 = classifyUserIntent(p8);
  assert(res8.intent === "CREATOR_SEARCH", "Test 8a: Intent is CREATOR_SEARCH (Client Mode)", `got ${res8.intent}`);
  assert(res8.matching_action === "SEARCH_CREATORS", "Test 8b: Action is SEARCH_CREATORS", `got ${res8.matching_action}`);
  assert(res8.targetRole === "Video Editor", "Test 8c: targetRole is Video Editor", `got ${res8.targetRole}`);

  // -------------------------------------------------------------------------
  // TEST 9: Explicit phrase rules: "who needs a video editor", "find clients for me"
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 9: Additional Explicit Phrase Rules ---");
  const p9a = "who needs a video editor";
  const res9a = classifyUserIntent(p9a);
  assert(res9a.intent === "CLIENT_OPPORTUNITY_SEARCH", "Test 9a: 'who needs a video editor' is CLIENT_OPPORTUNITY_SEARCH", `got ${res9a.intent}`);
  assert(res9a.targetRole === "Video Editor", "Test 9a: targetRole is Video Editor", `got ${res9a.targetRole}`);

  const p9b = "find clients for me";
  const res9b = classifyUserIntent(p9b, { currentUserRole: "Video Editor", currentUserType: "CREATOR", activeGoal: "FIND_JOB" });
  assert(res9b.intent === "CLIENT_OPPORTUNITY_SEARCH", "Test 9b: 'find clients for me' is CLIENT_OPPORTUNITY_SEARCH", `got ${res9b.intent}`);
  assert(res9b.targetRole === "Video Editor", "Test 9b: targetRole is Video Editor", `got ${res9b.targetRole}`);

  // -------------------------------------------------------------------------
  // TEST 10: State persistence & active project isolation
  // Active film project roles MUST NOT overwrite Video Editor opportunity search
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 10: Active Project Isolation & State Persistence ---");
  const fakeFilmProject = {
    id: "proj_123",
    title: "Romantic Musical Film",
    roles: [{ roleName: "UI/UX Designer" }, { roleName: "Frontend Developer" }],
  };
  const stateWithFilm = createInitialConversationState();
  stateWithFilm.projectDomain = "Film";
  stateWithFilm.projectType = "Short Film";
  stateWithFilm.currentUserRole = "Video Editor";
  stateWithFilm.currentUserType = "CREATOR";
  stateWithFilm.activeGoal = "FIND_JOB";

  // Intent classification with active film project context
  const res10 = classifyUserIntent(p1, {
    activeProject: fakeFilmProject as any,
    currentUserRole: "Video Editor",
    currentUserType: "CREATOR",
    activeGoal: "FIND_JOB",
  });
  assert(res10.intent === "CLIENT_OPPORTUNITY_SEARCH", "Test 10a: Active film project does NOT override CLIENT_OPPORTUNITY_SEARCH", `got ${res10.intent}`);
  assert(res10.targetRole === "Video Editor", "Test 10b: Active film project roles do NOT contaminate targetRole", `got ${res10.targetRole}`);

  // Transition conversation state
  const stateAfterSearch = transitionConversationState(stateWithFilm, p1);
  assert(stateAfterSearch.currentUserType === "CREATOR", "Test 10c: currentUserType remains CREATOR", `got ${stateAfterSearch.currentUserType}`);
  assert(stateAfterSearch.currentUserRole === "Video Editor", "Test 10d: currentUserRole remains Video Editor", `got ${stateAfterSearch.currentUserRole}`);
  assert(stateAfterSearch.activeGoal === "FIND_JOB", "Test 10e: activeGoal remains FIND_JOB", `got ${stateAfterSearch.activeGoal}`);
  assert(stateAfterSearch.lastSearchType === "clients", "Test 10f: lastSearchType is clients", `got ${stateAfterSearch.lastSearchType}`);

  // -------------------------------------------------------------------------
  // TEST 11: Follow-up queries stay in opportunity-search context
  // "show more", "which client is best?", "show details", "what is the budget?"
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 11: Follow-Up Queries Context Preservation ---");
  const followUp1 = classifyUserIntent("show more", {
    currentUserRole: "Video Editor",
    currentUserType: "CREATOR",
    activeGoal: "FIND_JOB",
  });
  assert(followUp1.intent === "FOLLOW_UP_PAGINATION" || followUp1.intent === "CLIENT_OPPORTUNITY_SEARCH", "Test 11a: 'show more' is in opportunity discovery context", `got ${followUp1.intent}`);

  const followUp2 = classifyUserIntent("which client is best?", {
    currentUserRole: "Video Editor",
    currentUserType: "CREATOR",
    activeGoal: "FIND_JOB",
  });
  assert(followUp2.intent === "CLIENT_OPPORTUNITY_SEARCH" || followUp2.intent === "FOLLOW_UP", "Test 11b: 'which client is best?' is in opportunity discovery context", `got ${followUp2.intent}`);

  const followUpApply = classifyUserIntent("apply to this", {
    currentUserRole: "Video Editor",
    currentUserType: "CREATOR",
    activeGoal: "FIND_JOB",
  });
  assert(followUpApply.intent === "APPLY_FOR_JOB", "Test 11c: 'apply to this' is APPLY_FOR_JOB", `got ${followUpApply.intent}`);

  // -------------------------------------------------------------------------
  // TEST 13: Section 13 Exact Conversation Sequence
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 13: Section 13 Exact Conversation Sequence ---");
  let seqState = createInitialConversationState();

  // 1. "I am a video editor."
  seqState = transitionConversationState(seqState, "I am a video editor.");
  assert(seqState.currentUserRole === "Video Editor", "Test 13a: Step 1 sets currentUserRole = Video Editor", `got ${seqState.currentUserRole}`);
  assert(seqState.currentUserType === "CREATOR", "Test 13b: Step 1 sets currentUserType = CREATOR", `got ${seqState.currentUserType}`);

  // 2. "Find clients who require video editors."
  const seqIntent2 = classifyUserIntent("Find clients who require video editors.", {
    currentUserRole: seqState.currentUserRole,
    currentUserType: seqState.currentUserType,
    activeGoal: seqState.activeGoal,
  });
  assert(seqIntent2.intent === "CLIENT_OPPORTUNITY_SEARCH", "Test 13c: Step 2 intent is CLIENT_OPPORTUNITY_SEARCH", `got ${seqIntent2.intent}`);
  assert(seqIntent2.matching_action === "SEARCH_CLIENT_OPPORTUNITIES", "Test 13d: Step 2 action is SEARCH_CLIENT_OPPORTUNITIES", `got ${seqIntent2.matching_action}`);
  assert(seqIntent2.searchEntity === "CLIENT_OPPORTUNITIES", "Test 13e: Step 2 searchEntity is CLIENT_OPPORTUNITIES", `got ${seqIntent2.searchEntity}`);
  seqState = transitionConversationState(seqState, "Find clients who require video editors.");
  assert(seqState.activeGoal === "FIND_JOB", "Test 13f: Step 2 sets activeGoal = FIND_JOB", `got ${seqState.activeGoal}`);
  assert(seqState.lastSearchType === "clients", "Test 13g: Step 2 sets lastSearchType = clients", `got ${seqState.lastSearchType}`);

  // 3. "show more"
  const seqIntent3 = classifyUserIntent("show more", {
    currentUserRole: seqState.currentUserRole,
    currentUserType: seqState.currentUserType,
    activeGoal: seqState.activeGoal,
  });
  assert(
    seqIntent3.intent === "FOLLOW_UP_PAGINATION" || seqIntent3.intent === "CLIENT_OPPORTUNITY_SEARCH",
    "Test 13h: Step 3 'show more' continues opportunity search/pagination",
    `got ${seqIntent3.intent}`
  );

  // 4. "iam a video editor so find the creators"
  const seqIntent4 = classifyUserIntent("iam a video editor so find the creators", {
    currentUserRole: seqState.currentUserRole,
    currentUserType: seqState.currentUserType,
    activeGoal: seqState.activeGoal,
  });
  assert(seqIntent4.intent === "CREATOR_SEARCH", "Test 13i: Step 4 'iam a video editor so find the creators' switches to CREATOR_SEARCH", `got ${seqIntent4.intent}`);
  assert(seqIntent4.matching_action === "SEARCH_CREATORS", "Test 13j: Step 4 action is SEARCH_CREATORS", `got ${seqIntent4.matching_action}`);
  assert(seqIntent4.searchEntity === "CREATORS", "Test 13k: Step 4 searchEntity is CREATORS", `got ${seqIntent4.searchEntity}`);
  assert(seqIntent4.targetRole === "Creator", "Test 13l: Step 4 targetRole is Creator (generic)", `got ${seqIntent4.targetRole}`);
  assert(seqIntent4.currentUserRole === "Video Editor", "Test 13m: Step 4 preserves currentUserRole = Video Editor", `got ${seqIntent4.currentUserRole}`);
  assert(seqIntent4.currentUserType === "CREATOR", "Test 13n: Step 4 preserves currentUserType = CREATOR", `got ${seqIntent4.currentUserType}`);
  assert(seqIntent4.activeGoal === undefined, "Test 13o: Step 4 activeGoal is reset (not forced to FIND_JOB)", `got ${seqIntent4.activeGoal}`);
  seqState = transitionConversationState(seqState, "iam a video editor so find the creators");
  assert(seqState.lastSearchType === "creators", "Test 13p: Step 4 sets lastSearchType = creators", `got ${seqState.lastSearchType}`);
  assert(seqState.activeGoal === undefined, "Test 13q: Step 4 clears state activeGoal", `got ${seqState.activeGoal}`);

  // 5. "find clients who require video editors"
  const seqIntent5 = classifyUserIntent("find clients who require video editors", {
    currentUserRole: seqState.currentUserRole,
    currentUserType: seqState.currentUserType,
    activeGoal: seqState.activeGoal,
  });
  assert(seqIntent5.intent === "CLIENT_OPPORTUNITY_SEARCH", "Test 13r: Step 5 switches back to CLIENT_OPPORTUNITY_SEARCH", `got ${seqIntent5.intent}`);
  assert(seqIntent5.matching_action === "SEARCH_CLIENT_OPPORTUNITIES", "Test 13s: Step 5 action is SEARCH_CLIENT_OPPORTUNITIES", `got ${seqIntent5.matching_action}`);
  seqState = transitionConversationState(seqState, "find clients who require video editors");
  assert(seqState.lastSearchType === "clients", "Test 13t: Step 5 sets lastSearchType = clients", `got ${seqState.lastSearchType}`);

  // 6. "find creators"
  const seqIntent6 = classifyUserIntent("find creators", {
    currentUserRole: seqState.currentUserRole,
    currentUserType: seqState.currentUserType,
    activeGoal: seqState.activeGoal,
  });
  assert(seqIntent6.intent === "CREATOR_SEARCH", "Test 13u: Step 6 switches to CREATOR_SEARCH", `got ${seqIntent6.intent}`);
  assert(seqIntent6.matching_action === "SEARCH_CREATORS", "Test 13v: Step 6 action is SEARCH_CREATORS", `got ${seqIntent6.matching_action}`);

  // -------------------------------------------------------------------------
  // TEST 14: Section 14 Regression Matrix
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 14: Section 14 Regression Matrix ---");

  // 14a. previous CLIENT_OPPORTUNITY_SEARCH + new "find creators" => CREATOR_SEARCH
  const r14a = classifyUserIntent("find creators", {
    currentUserRole: "Video Editor",
    currentUserType: "CREATOR",
    activeGoal: "FIND_JOB",
  });
  assert(r14a.intent === "CREATOR_SEARCH", "Test 14a: previous CLIENT_OPPORTUNITY_SEARCH + 'find creators' => CREATOR_SEARCH", `got ${r14a.intent}`);

  // 14b. previous CREATOR_SEARCH + new "find clients" => CLIENT_OPPORTUNITY_SEARCH
  const r14b = classifyUserIntent("find clients", {
    currentUserRole: "Video Editor",
    currentUserType: "CREATOR",
  });
  assert(r14b.intent === "CLIENT_OPPORTUNITY_SEARCH" || r14b.intent === "CLIENT_SEARCH", "Test 14b: previous CREATOR_SEARCH + 'find clients' => CLIENT search", `got ${r14b.intent}`);

  // 14c. previous JOB_SEARCH + new "find creators" => CREATOR_SEARCH
  const r14c = classifyUserIntent("find creators", {
    currentUserRole: "Frontend Web Developer",
    currentUserType: "CREATOR",
    activeGoal: "FIND_JOB",
  });
  assert(r14c.intent === "CREATOR_SEARCH", "Test 14c: previous JOB_SEARCH + 'find creators' => CREATOR_SEARCH", `got ${r14c.intent}`);

  // 14d. previous CREATOR_SEARCH + new "find jobs" => CLIENT_OPPORTUNITY_SEARCH / CREATOR_JOB_SEARCH
  const r14d = classifyUserIntent("find jobs", {
    currentUserRole: "Video Editor",
    currentUserType: "CREATOR",
  });
  assert(r14d.intent === "CLIENT_OPPORTUNITY_SEARCH" || r14d.intent === "CREATOR_JOB_SEARCH", "Test 14d: previous CREATOR_SEARCH + 'find jobs' => job search", `got ${r14d.intent}`);

  // 14e. previous FILM context + "find creators" => CREATOR_SEARCH
  const r14e = classifyUserIntent("find creators", {
    activeProject: { id: "p_film", domain: "Film", title: "Action Film" } as any,
    currentUserRole: "DIRECTOR",
  });
  assert(r14e.intent === "CREATOR_SEARCH", "Test 14e: previous FILM context + 'find creators' => CREATOR_SEARCH", `got ${r14e.intent}`);

  // 14f. previous MUSIC context + "find clients" => CLIENT_OPPORTUNITY_SEARCH / CLIENT_SEARCH
  const r14f = classifyUserIntent("find clients", {
    activeProject: { id: "p_music", domain: "Music", title: "Rock Band" } as any,
    currentUserRole: "Musician",
    currentUserType: "CREATOR",
  });
  assert(r14f.intent === "CLIENT_OPPORTUNITY_SEARCH" || r14f.intent === "CLIENT_SEARCH", "Test 14f: previous MUSIC context + 'find clients' => client search", `got ${r14f.intent}`);

  // -------------------------------------------------------------------------
  // TEST 15: Section 6 Important Distinctions
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 15: Section 6 Important Distinctions ---");

  // A: "I am a video editor. Find creators." => CREATOR_SEARCH
  const r15a = classifyUserIntent("I am a video editor. Find creators.");
  assert(r15a.intent === "CREATOR_SEARCH", "Test 15a: 'I am a video editor. Find creators.' => CREATOR_SEARCH", `got ${r15a.intent}`);
  assert(r15a.targetRole === "Creator", "Test 15a: targetRole is Creator", `got ${r15a.targetRole}`);
  assert(r15a.currentUserRole === "Video Editor", "Test 15a: currentUserRole is Video Editor", `got ${r15a.currentUserRole}`);

  // B: "I am a video editor. Find clients." => CLIENT_OPPORTUNITY_SEARCH
  const r15b = classifyUserIntent("I am a video editor. Find clients.");
  assert(r15b.intent === "CLIENT_OPPORTUNITY_SEARCH", "Test 15b: 'I am a video editor. Find clients.' => CLIENT_OPPORTUNITY_SEARCH", `got ${r15b.intent}`);

  // C: "I am a video editor. Find clients who need video editors." => CLIENT_OPPORTUNITY_SEARCH
  const r15c = classifyUserIntent("I am a video editor. Find clients who need video editors.");
  assert(r15c.intent === "CLIENT_OPPORTUNITY_SEARCH", "Test 15c: 'I am a video editor. Find clients who need video editors.' => CLIENT_OPPORTUNITY_SEARCH", `got ${r15c.intent}`);

  // D: "I am a video editor. Find creators who need a video editor." => CLIENT_OPPORTUNITY_SEARCH
  const r15d = classifyUserIntent("I am a video editor. Find creators who need a video editor.");
  assert(r15d.intent === "CLIENT_OPPORTUNITY_SEARCH", "Test 15d: 'I am a video editor. Find creators who need a video editor.' => CLIENT_OPPORTUNITY_SEARCH", `got ${r15d.intent}`);

  // E: "I am a video editor. Find other creators." => CREATOR_SEARCH
  const r15e = classifyUserIntent("I am a video editor. Find other creators.");
  assert(r15e.intent === "CREATOR_SEARCH", "Test 15e: 'I am a video editor. Find other creators.' => CREATOR_SEARCH", `got ${r15e.intent}`);

  // F: "I am a video editor looking for work." => CLIENT_OPPORTUNITY_SEARCH
  const r15f = classifyUserIntent("I am a video editor looking for work.");
  assert(r15f.intent === "CLIENT_OPPORTUNITY_SEARCH", "Test 15f: 'I am a video editor looking for work.' => CLIENT_OPPORTUNITY_SEARCH", `got ${r15f.intent}`);

  console.log("\n================================================================================");
  console.log(`TEST SUITE FINISHED: ${passed} / ${total} TESTS PASSED`);
  console.log("================================================================================\n");

  if (passed === total) {
    console.log("🎉 ALL TESTS PASSED SUCCESSFULLY!");
    process.exit(0);
  } else {
    console.error(`💥 ${total - passed} TESTS FAILED!`);
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error("Unhandled error in test suite:", err);
  process.exit(1);
});
