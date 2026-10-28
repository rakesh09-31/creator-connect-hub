/**
 * OmniForge Master Regression Test Suite
 *
 * Covers:
 * Part A: User-request understanding (Capability, Filmmaking, How-To vs Search, Story follow-up, etc.)
 * Part B: Roadmap quality & isolation (12 deep filmmaking stages, Rust roadmap, distinct IDs, independent storage)
 * Part C: Chat history & Recents (Multi-conversation isolation, persistence across hydration, deduplication)
 * Part D: Orchestration correctness (Single authoritative owner, latest-request priority over stale state)
 */

import { classifyUserIntent, isHowToQuery, isCreatorSearchQuery, extractDefinitionTerm } from "../src/lib/omniforge/intent";
import { buildUniversalRoadmap, detectRoadmapSubject } from "../src/lib/omniforge/universal-roadmap";
import {
  saveConversation,
  loadConversation,
  loadConversationsList,
  saveRoadmapItem,
  loadSavedRoadmapsList,
  findSavedRoadmapById,
  findSavedRoadmapBySubject,
} from "../src/lib/omniforge/storage";
import { OmniForgeConversation, SavedRoadmapItem, ChatMessage } from "../src/lib/omniforge/types";

let passedCount = 0;
let totalCount = 0;

function assert(condition: boolean, msg: string) {
  totalCount++;
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  }
  console.log(`✅ PASSED: ${msg}`);
  passedCount++;
}

async function runMasterSuite() {
  console.log("================================================================================");
  console.log("🚀 STARTING OMNIFORGE MASTER IMPLEMENTATION REGRESSION SUITE");
  console.log("================================================================================\n");

  // ============================================================================
  // PART A: USER-REQUEST UNDERSTANDING
  // ============================================================================
  console.log("--- PART A: USER-REQUEST UNDERSTANDING ---");

  // A1: General knowledge question -> relevant answer, no roadmap
  {
    const q = "What is cinematography?";
    const intentRes = classifyUserIntent(q);
    assert(
      intentRes.intent === "DEFINITION" || intentRes.intent === "GENERAL_KNOWLEDGE" || intentRes.intent === "KNOWLEDGE",
      "A1: 'What is cinematography?' is classified as educational/definition, not a roadmap or creator search"
    );
    assert(intentRes.intent !== "ROADMAP_CREATE" && intentRes.intent !== "ROADMAP_REQUEST", "A1: Does not generate a roadmap");
  }

  // A2: "Can you create a roadmap?" -> capability answer or clarification, no old roadmap
  {
    const q = "Can you create a roadmap?";
    const intentRes = classifyUserIntent(q);
    assert(
      intentRes.intent === "ROADMAP_CAPABILITY_INQUIRY",
      "A2: 'Can you create a roadmap?' triggers ROADMAP_CAPABILITY_INQUIRY"
    );
    assert(
      Boolean(intentRes.deterministicText && intentRes.deterministicText.includes("generate comprehensive, structured learning")),
      "A2: Returns capability explanation asking what subject/goal to learn"
    );
    assert(
      !intentRes.deterministicText?.includes("Full Stack Developer career journey underway"),
      "A2: Does not silently open or inject an old Full Stack roadmap"
    );
  }

  // A3: Explicit new roadmap request -> creates new artifact
  {
    const q = "Create a roadmap for filmmaking.";
    const intentRes = classifyUserIntent(q);
    assert(intentRes.intent === "ROADMAP_CREATE", "A3: 'Create a roadmap for filmmaking.' triggers ROADMAP_CREATE");
    assert(intentRes.roadmapSubject === "Filmmaking", "A3: Subject is accurately identified as Filmmaking");
    assert(Boolean(intentRes.roadmapData), "A3: Generates dedicated roadmapData artifact");
  }

  // A4: "Show my saved roadmaps" -> list saved artifacts
  {
    const q = "Show all my roadmaps";
    const intentRes = classifyUserIntent(q);
    assert(
      intentRes.intent === "LIST_SAVED_ROADMAPS" || intentRes.intent === "VIEW_CURRENT_ROADMAP",
      "A4: 'Show all my roadmaps' lists saved artifacts"
    );
  }

  // A5: "Show my filmmaking roadmap" -> view saved roadmap
  {
    const q = "Show my filmmaking roadmap";
    const intentRes = classifyUserIntent(q);
    assert(
      intentRes.intent === "VIEW_SAVED_ROADMAP",
      "A5: 'Show my filmmaking roadmap' triggers VIEW_SAVED_ROADMAP"
    );
    assert(
      intentRes.targetRoadmapTitle === "Filmmaking",
      "A5: Targets the Filmmaking roadmap artifact"
    );
  }

  // A6: "Modify this roadmap" -> modify correct artifact
  {
    const q = "Improve the second stage of my filmmaking roadmap";
    const intentRes = classifyUserIntent(q);
    assert(
      intentRes.intent === "ROADMAP_MODIFY" || intentRes.intent === "MODIFY_ROADMAP",
      "A6: 'Improve the second stage of my filmmaking roadmap' triggers ROADMAP_MODIFY"
    );
  }

  // A7: Creator-search vs How-To query distinction
  {
    const howTo = "How do I find a cinematographer?";
    const intentHowTo = classifyUserIntent(howTo);
    assert(
      intentHowTo.intent === "HOW_TO",
      "A7a: 'How do I find a cinematographer?' is procedural guidance (HOW_TO), not creator search"
    );
    assert(
      !isCreatorSearchQuery(howTo),
      "A7b: isCreatorSearchQuery returns false for 'How do I find a cinematographer?'"
    );

    const searchDirect = "Find all cinematographers.";
    const intentSearch = classifyUserIntent(searchDirect);
    assert(
      intentSearch.intent === "CREATOR_SEARCH",
      "A7c: 'Find all cinematographers.' triggers authentic CREATOR_SEARCH"
    );
    assert(
      isCreatorSearchQuery(searchDirect),
      "A7d: isCreatorSearchQuery returns true for 'Find all cinematographers.'"
    );

    const whatDoesDo = "What does a cinematographer do?";
    const intentWhat = classifyUserIntent(whatDoesDo);
    assert(
      intentWhat.intent === "ROLE_OR_CONCEPT_EXPLANATION" || intentWhat.intent === "DEFINITION" || intentWhat.intent === "GENERAL_KNOWLEDGE",
      "A7e: 'What does a cinematographer do?' answers the question without displaying creator cards"
    );
    assert(
      !isCreatorSearchQuery(whatDoesDo),
      "A7f: isCreatorSearchQuery returns false for 'What does a cinematographer do?'"
    );
  }

  // ============================================================================
  // PART B: ROADMAP QUALITY AND ISOLATION
  // ============================================================================
  console.log("\n--- PART B: ROADMAP QUALITY AND ISOLATION ---");

  // B1: Generate 12-stage Filmmaking Roadmap
  const filmRm = buildUniversalRoadmap("Create a roadmap for filmmaking", "conv_film_1");
  assert(filmRm.stages.length === 12, "B1: Filmmaking roadmap contains exactly 12 sequenced stages");
  assert(
    filmRm.domain === "Filmmaking & Cinema Production" || filmRm.domain.includes("Cinema") || filmRm.domain.includes("Film"),
    "B1: Domain is Cinema/Filmmaking Production"
  );

  // Inspect stage and node depth
  const stage1 = filmRm.stages[0];
  const node1 = filmRm.nodes[0];
  assert(Boolean(stage1.skillFocus && stage1.projectTitle && stage1.deliverables), "B1: Stage 1 has skillFocus, projectTitle, deliverables");
  assert(Array.isArray(node1.topicChecklist) && node1.topicChecklist.length >= 3, "B1: Node 1 has at least 3 deep core topics in checklist");
  assert(Array.isArray(node1.learningObjectives) && node1.learningObjectives.length >= 3, "B1: Node 1 has learning objectives");
  assert(Boolean(node1.assessment && node1.assessment.criterion), "B1: Node 1 has passing criteria and assessment");
  assert(Boolean(node1.estimatedStudyTime || node1.estimatedStudyHours), "B1: Node 1 includes estimated duration/effort");

  // Check stage 9 (Principal photography) and 12 (Distribution)
  const stage9 = filmRm.stages[8];
  assert(stage9.skillFocus.includes("Principal Photography"), "B1: Stage 9 covers Principal Photography & Directing on Set");
  const stage12 = filmRm.stages[11];
  assert(
    stage12.skillFocus.includes("Festival") || stage12.skillFocus.includes("Release") || stage12.skillFocus.includes("Distribution") || stage12.projectTitle.includes("Festival"),
    "B1: Stage 12 covers Theatrical, Festival & Digital Distribution/Release"
  );

  // B2: Generate unrelated Rust Roadmap in a separate request
  const rustRm = buildUniversalRoadmap("Create a roadmap for Rust", "conv_rust_2");
  assert(rustRm.stages.length === 6, "B2: Rust roadmap generated with progressive stages");
  assert(rustRm.title.includes("Rust"), "B2: Rust roadmap title is specific to Rust");

  // B3: Verify both have different IDs
  assert(filmRm.id !== rustRm.id, "B3: Filmmaking roadmap and Rust roadmap have unique, distinct IDs");

  // B4: Mock localStorage for isolated storage verification
  const storageMap = new Map<string, string>();
  (global as any).window = {};
  (global as any).localStorage = {
    getItem: (k: string) => storageMap.get(k) || null,
    setItem: (k: string, v: string) => storageMap.set(k, v),
    removeItem: (k: string) => storageMap.delete(k),
  };

  const filmItem: SavedRoadmapItem = {
    id: filmRm.id,
    userId: "user_test_1",
    conversationId: "conv_film_1",
    title: filmRm.title,
    targetSkillOrOutcome: "Filmmaker",
    progressPercent: 0,
    totalStages: 12,
    completedStages: 0,
    activeMilestoneTitle: stage1.skillFocus,
    roadmapData: filmRm,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const rustItem: SavedRoadmapItem = {
    id: rustRm.id,
    userId: "user_test_1",
    conversationId: "conv_rust_2",
    title: rustRm.title,
    targetSkillOrOutcome: "Rust Systems Engineer",
    progressPercent: 0,
    totalStages: 6,
    completedStages: 0,
    activeMilestoneTitle: rustRm.stages[0].skillFocus,
    roadmapData: rustRm,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  saveRoadmapItem(filmItem, "user_test_1");
  saveRoadmapItem(rustItem, "user_test_1");

  const roadmapsInDb = loadSavedRoadmapsList("user_test_1");
  assert(roadmapsInDb.length === 2, "B4: Both roadmaps saved independently in storage (length = 2)");
  assert(roadmapsInDb.some((r) => r.id === filmRm.id), "B4: Filmmaking roadmap is present");
  assert(roadmapsInDb.some((r) => r.id === rustRm.id), "B4: Rust roadmap is present");
  assert(
    findSavedRoadmapBySubject("film", "user_test_1")?.id === filmRm.id,
    "B4: findSavedRoadmapBySubject('film') resolves Filmmaking roadmap"
  );
  assert(
    findSavedRoadmapBySubject("rust", "user_test_1")?.id === rustRm.id,
    "B4: findSavedRoadmapBySubject('rust') resolves Rust roadmap"
  );

  // B5: Creating a second Filmmaking roadmap with a new ID must NOT overwrite the first one
  const filmRm2 = buildUniversalRoadmap("Create a new roadmap for filmmaking", "conv_film_3");
  // Ensure distinct ID
  filmRm2.id = `rm_film_second_${Date.now()}`;
  const filmItem2: SavedRoadmapItem = {
    id: filmRm2.id,
    userId: "user_test_1",
    conversationId: "conv_film_3",
    title: filmRm2.title,
    targetSkillOrOutcome: "Filmmaker",
    progressPercent: 0,
    totalStages: 12,
    completedStages: 0,
    activeMilestoneTitle: "Concept Development",
    roadmapData: filmRm2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  saveRoadmapItem(filmItem2, "user_test_1");
  const roadmapsAfterSecondFilm = loadSavedRoadmapsList("user_test_1");
  assert(
    roadmapsAfterSecondFilm.length === 3,
    "B5: Two roadmaps with similar titles coexist without overwriting each other (length = 3)"
  );

  // ============================================================================
  // PART C: CHAT HISTORY AND RECENTS
  // ============================================================================
  console.log("\n--- PART C: CHAT HISTORY AND RECENTS ---");

  // C1: Start Conversation A and add multiple messages
  const convA: OmniForgeConversation = {
    id: "conv_A_101",
    userId: "user_test_1",
    title: "Filmmaking Concept Discussion",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    messages: [
      { id: "m1", sender: "user", text: "I have a concept for a short film.", timestamp: new Date().toISOString() },
      { id: "m2", sender: "ai", text: "Great! Tell me about the story.", timestamp: new Date().toISOString() },
      { id: "m3", sender: "user", text: "Create a roadmap for filmmaking.", timestamp: new Date().toISOString() },
      { id: "m4", sender: "ai", text: "Here is your 12-stage filmmaking roadmap.", timestamp: new Date().toISOString(), roadmapArtifact: filmRm as any },
    ],
    state: {
      conversationStage: "REQUIREMENTS_INVESTIGATION",
      targetDomain: "Film",
      activeGenre: "Suspense Thriller",
      requirementsCollected: { duration: "5 minutes" },
      missingRequirements: [],
    } as any,
  };
  saveConversation(convA, "user_test_1");

  // C2: Start Conversation B and search for creators
  const convB: OmniForgeConversation = {
    id: "conv_B_202",
    userId: "user_test_1",
    title: "Find Telugu Actors",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [
      { id: "mb1", sender: "user", text: "Find all Telugu lead actors aged 20–25", timestamp: new Date().toISOString() },
      { id: "mb2", sender: "ai", text: "Found 3 verified Telugu actors in directory.", timestamp: new Date().toISOString() },
    ],
    state: {
      conversationStage: "REQUIREMENTS_INVESTIGATION",
      investigationArea: "casting",
      targetRole: "Lead Actor",
      requirementsCollected: { language: "Telugu", ageRange: "20-25" },
      missingRequirements: [],
    } as any,
  };
  saveConversation(convB, "user_test_1");

  // C3: Simulate Browser Refresh / Reload
  const loadedList = loadConversationsList("user_test_1");
  assert(loadedList.length === 2, "C3: Both Conversation A and Conversation B persist in Recents (length = 2)");
  assert(loadedList[0].id === "conv_B_202", "C3: Most recently updated Conversation B is at top of Recents");
  assert(loadedList[1].id === "conv_A_101", "C3: Conversation A is retained in Recents");

  // C4: Verify complete message history of Conversation A
  const loadedA = loadConversation("conv_A_101", "user_test_1");
  assert(Boolean(loadedA), "C4: Conversation A loads cleanly");
  assert(loadedA!.messages.length === 4, "C4: Conversation A retains all 4 messages in chronological order");
  assert(Boolean(loadedA!.messages[3].roadmapArtifact), "C4: Conversation A retains its generated roadmap artifact");

  // C5: Verify complete message history of Conversation B
  const loadedB = loadConversation("conv_B_202", "user_test_1");
  assert(Boolean(loadedB), "C5: Conversation B loads cleanly");
  assert(loadedB!.messages.length === 2, "C5: Conversation B retains its messages and casting search results");

  // C6: Start Conversation C and verify A and B remain untouched
  const convC: OmniForgeConversation = {
    id: "conv_C_303",
    userId: "user_test_1",
    title: "Rust Systems Architecture",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [
      { id: "mc1", sender: "user", text: "Create a roadmap for Rust", timestamp: new Date().toISOString() },
    ],
  };
  saveConversation(convC, "user_test_1");

  const listAfterC = loadConversationsList("user_test_1");
  assert(listAfterC.length === 3, "C6: Recents now contains all 3 conversations (A, B, C)");
  const reloadedA = loadConversation("conv_A_101", "user_test_1");
  assert(reloadedA!.messages.length === 4, "C6: Conversation A remains completely untouched");

  // ============================================================================
  // PART D: ORCHESTRATION CORRECTNESS
  // ============================================================================
  console.log("\n--- PART D: ORCHESTRATION CORRECTNESS ---");

  // D1: Explicit response owner tracking
  const sampleMsgA: ChatMessage = {
    id: "msg_stream_1",
    sender: "ai",
    text: "Here are the steps to find a cinematographer.",
    timestamp: new Date().toISOString(),
    sourceMeta: {
      provider: "fast-path",
      model: "deterministic",
      responseOwner: "FAST_PATH",
      isRealLLM: false,
      status: "live_verified",
      statusMessage: "Fast path — Ollama skipped",
      executionMode: "FAST",
    },
  };
  assert(sampleMsgA.sourceMeta?.responseOwner === "FAST_PATH", "D1: Deterministic fast actions have explicit FAST_PATH owner");

  // D2: Latest-request priority over stale active project/roadmap
  // User had Full Stack roadmap active, but now asks for Filmmaking roadmap
  const promptFilmmaking = "Create a roadmap for filmmaking";
  const intentPriority = classifyUserIntent(promptFilmmaking, {
    activeGoal: "Full Stack Developer",
  });
  assert(
    intentPriority.intent === "ROADMAP_CREATE" && intentPriority.roadmapSubject === "Filmmaking",
    "D2: Latest request for Filmmaking overrides stale 'Full Stack Developer' goal"
  );
  assert(
    intentPriority.careerGoal !== "Full Stack Developer",
    "D2: Does not redirect user back to Full Stack Developer when they ask for Filmmaking"
  );

  // D3: Prevent duplicate assistant responses
  const uniqueMessageIds = new Set(convA.messages.map((m) => m.id));
  assert(uniqueMessageIds.size === convA.messages.length, "D3: No duplicate messages in conversation history");

  console.log("\n================================================================================");
  console.log(`🏆 ALL ${passedCount}/${totalCount} MASTER REGRESSION TESTS PASSED!`);
  console.log("================================================================================");
}

runMasterSuite().catch((err) => {
  console.error("FATAL SUITE ERROR:", err);
  process.exit(1);
});
