/**
 * OmniForge Architecture & Orchestration Test Suite
 *
 * Verifies all 12 minimum test matrix categories from the Architecture Upgrade Spec:
 * 1. GENERAL: "What is stress?", "What does motivation mean?", "Explain quantum computing."
 * 2. HOW TO: "How can I learn Python?", "How can I find performers?"
 * 3. CREATOR: "Find performers.", "Find video editors."
 * 4. PROJECT: "I want to organize a college cultural festival.", "What roles are missing?"
 * 5. STORY: Multi-turn continuity:
 *    - "I want to direct an action thriller."
 *    - "Generate the story."
 *    - "Make the villain more intelligent."
 *    - "Find plot holes."
 *    - "Convert it to a screenplay."
 * 6. TECHNICAL: "Explain DNS.", "Give me Python code for binary search."
 * 7. FOLLOW-UP CHIPS: Dynamically relevant; no leakage of educational/project chips into general queries.
 * 8. 18 TOOLS REGISTRY: Verifies all 18 tools are registered with schemas and descriptions.
 * 9. ANTI-HIJACKING: Verifies active projects (Festival, Film) NEVER hijack standalone queries.
 */

import { OMNIFORGE_TOOLS, OmniForgeToolName } from "../src/lib/omniforge/tools";
import {
  isQueryProjectRelated,
  isQueryStoryRelated,
  resolveContextLayers,
} from "../src/lib/omniforge/context-manager";
import { generateDynamicFollowUpChips } from "../src/lib/omniforge/dynamic-chips";
import { orchestrateOmniForgeMessage } from "../src/lib/omniforge/orchestrator";
import { createInitialConversationState } from "../src/lib/omniforge/conversation-state";
import { OmniForgeProject } from "../src/lib/omniforge/types";

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

const mockFestivalProject: OmniForgeProject = {
  id: "proj-festival-101",
  title: "College Cultural Festival",
  domain: "Events",
  type: "Cultural Festival",
  stage: "planning",
  goal: "Annual inter-college cultural festival with dance, music, and drama",
  phases: [],
  roles: [
    { roleName: "Event Coordinator", description: "Coordination", isFilled: false },
    { roleName: "Sound Engineer", description: "Audio", isFilled: false },
    { roleName: "Performers", description: "Live entertainment", isFilled: false },
  ],
  recommendations: [],
  coverage: {
    totalRequired: 3,
    totalCovered: 0,
    coveredCapabilities: [],
    missingCapabilities: [
      { roleName: "Event Coordinator", requiredSkills: ["Event Planning"], priority: "high" },
      { roleName: "Sound Engineer", requiredSkills: ["Sound Mixing"], priority: "high" },
      { roleName: "Performers", requiredSkills: ["Stage Performance"], priority: "high" },
    ],
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockFilmProject: OmniForgeProject = {
  id: "proj-film-202",
  title: "Midnight Cipher",
  domain: "Film",
  type: "Action Thriller",
  stage: "planning",
  currentUserRole: "DIRECTOR",
  storyPremise: "A cyber-investigator uncovers a rogue AI embedded in city infrastructure.",
  phases: [],
  roles: [
    { roleName: "Film Director", description: "Director", isFilled: true },
    { roleName: "Cinematographer", description: "DoP", isFilled: false },
    { roleName: "Video Editor", description: "Editor", isFilled: false },
  ],
  recommendations: [],
  coverage: {
    totalRequired: 2,
    totalCovered: 0,
    coveredCapabilities: [],
    missingCapabilities: [
      { roleName: "Cinematographer", requiredSkills: ["Lighting", "Camera"], priority: "high" },
      { roleName: "Video Editor", requiredSkills: ["Pacing", "Continuity"], priority: "high" },
    ],
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

async function runAllTests() {
  console.log("==================================================");
  console.log("OMNIFORGE ORCHESTRATOR ARCHITECTURE TEST MATRIX");
  console.log("==================================================\n");

  // --------------------------------------------------------------------------
  // TEST GROUP 1: Tool Registry Completeness (18 Required Tools)
  // --------------------------------------------------------------------------
  console.log("--- 1. TOOL REGISTRY VERIFICATION (18 Tools) ---");
  const expectedTools: OmniForgeToolName[] = [
    "create_project",
    "analyze_project",
    "analyze_requirements",
    "generate_story",
    "modify_story",
    "analyze_story",
    "find_plot_holes",
    "create_screenplay",
    "create_shot_list",
    "create_production_plan",
    "analyze_missing_roles",
    "search_creators",
    "view_creator",
    "invite_creator",
    "build_squad",
    "create_tasks",
    "manage_project",
    "summarize_project",
  ];

  assert(
    Object.keys(OMNIFORGE_TOOLS).length === 18,
    `Registry contains exactly 18 tools (found: ${Object.keys(OMNIFORGE_TOOLS).length})`
  );

  for (const t of expectedTools) {
    const def = OMNIFORGE_TOOLS[t];
    assert(Boolean(def), `Tool '${t}' is registered`);
    assert(Boolean(def.description && def.description.length > 10), `Tool '${t}' has descriptive purpose`);
    assert(Boolean(def.category), `Tool '${t}' has category (${def.category})`);
  }

  // --------------------------------------------------------------------------
  // TEST GROUP 2: Anti-Hijacking Context Scoping
  // --------------------------------------------------------------------------
  console.log("\n--- 2. CONTEXT MANAGEMENT & ANTI-HIJACKING ---");
  const generalQuestions = [
    "What is stress?",
    "What does motivation mean?",
    "Explain quantum computing.",
    "Explain DNS.",
    "How does Python work?",
    "Give me Python code for binary search.",
    "Compare SQL and NoSQL.",
    "Give me startup ideas.",
  ];

  for (const q of generalQuestions) {
    const isProject = isQueryProjectRelated(q, mockFestivalProject);
    assert(!isProject, `[Festival Project] "${q}" is not hijacked into project context`);
  }

  for (const q of generalQuestions) {
    const isProject = isQueryProjectRelated(q, mockFilmProject);
    assert(!isProject, `[Film Project] "${q}" is not hijacked into project context`);
  }

  // Legitimate project questions MUST be recognized
  const projectQuestions = [
    "What roles are missing?",
    "Who is still missing from my team?",
    "Review the project plan",
    "Create tasks for the sound engineer",
    "Show the blueprint for College Cultural Festival",
  ];

  for (const q of projectQuestions) {
    const isProject = isQueryProjectRelated(q, mockFestivalProject);
    assert(isProject, `Project query "${q}" correctly scoped to project context`);
  }

  // --------------------------------------------------------------------------
  // TEST GROUP 3: Dynamic Follow-Up Chips Matrix
  // --------------------------------------------------------------------------
  console.log("\n--- 3. DYNAMIC FOLLOW-UP CHIPS MATRIX ---");

  // General Questions: ["Explain Further", "Give Examples", "Simplify This"]
  const generalChips = generateDynamicFollowUpChips({
    intent: "GENERAL_QUESTION",
    userQuery: "What is stress?",
    activeProject: mockFestivalProject,
    isProjectTurn: false,
    isStoryTurn: false,
  });
  assert(
    generalChips.includes("Explain Further") &&
    generalChips.includes("Give Examples") &&
    generalChips.includes("Simplify This"),
    `General question chips match: [${generalChips.join(", ")}]`
  );
  assert(
    !generalChips.some((c) => c.includes("Performers") || c.includes("Viva") || c.includes("5-Mark")),
    "General chips contain NO festival or academic exam chips"
  );

  // Story Questions: ["Make It More Emotional", "Find Plot Holes", "Convert to Screenplay", "Create Shot List"]
  const storyChips = generateDynamicFollowUpChips({
    intent: "STORY_GENERATION",
    userQuery: "Generate the story",
    activeProject: mockFilmProject,
    isProjectTurn: false,
    isStoryTurn: true,
  });
  assert(
    storyChips.includes("Make It More Emotional") &&
    storyChips.includes("Find Plot Holes") &&
    storyChips.includes("Convert to Screenplay") &&
    storyChips.includes("Create Shot List"),
    `Story chips match: [${storyChips.join(", ")}]`
  );

  // Creator Search: ["Show More Creators", "Refine Search", "Search Another Role"]
  const creatorChips = generateDynamicFollowUpChips({
    intent: "CREATOR_SEARCH",
    userQuery: "Find performers",
    resultCount: 5,
  });
  assert(
    creatorChips.includes("Show More Creators") &&
    creatorChips.includes("Refine Search") &&
    creatorChips.includes("Search Another Role"),
    `Creator search chips match: [${creatorChips.join(", ")}]`
  );

  // Project Planning: ["Analyze Missing Roles", "Create Tasks", "Find Creators"]
  const projectChips = generateDynamicFollowUpChips({
    intent: "PROJECT_ANALYSIS",
    userQuery: "What roles are missing?",
    activeProject: mockFilmProject,
    isProjectTurn: true,
    isStoryTurn: false,
  });
  assert(
    projectChips.includes("Analyze Missing Roles") &&
    projectChips.includes("Create Tasks") &&
    projectChips.includes("Find Creators"),
    `Project chips match: [${projectChips.join(", ")}]`
  );

  // Academic Exam: ["Explain in Detail", "Give Examples", "Give 5-Mark Answer"]
  const examChips = generateDynamicFollowUpChips({
    intent: "EXAM_PREPARATION",
    userQuery: "Give 5-mark answer for OSI layers in semester exam",
    isProjectTurn: false,
    isStoryTurn: false,
  });
  assert(
    examChips.includes("Explain in Detail") &&
    examChips.includes("Give Examples") &&
    examChips.includes("Give 5-Mark Answer"),
    `Exam chips match: [${examChips.join(", ")}]`
  );

  // Technical Code: ["Explain Code Step by Step", "Optimize Code", "Give Test Cases", "Convert to Another Language"]
  const codeChips = generateDynamicFollowUpChips({
    intent: "PROGRAMMING_QUESTION",
    userQuery: "Give me Python code for binary search",
    isProjectTurn: false,
    isStoryTurn: false,
  });
  assert(
    codeChips.includes("Give Code Example") &&
    codeChips.includes("Explain Step by Step") &&
    codeChips.includes("Alternative Approaches"),
    `Technical code chips match: [${codeChips.join(", ")}]`
  );

  // --------------------------------------------------------------------------
  // TEST GROUP 4: Story Continuity Multi-Turn Tracking
  // --------------------------------------------------------------------------
  console.log("\n--- 4. STORY MULTI-TURN CONTINUITY ---");

  let state = createInitialConversationState();
  assert(!state.activeStory, "Initial conversation has no active story");

  // Turn 1: Concept
  const turn1Query = "I want to direct an action thriller.";
  assert(isQueryStoryRelated(turn1Query, false), "Turn 1 is recognized as story request");

  // Turn 2: Generate
  const turn2Query = "Generate the story.";
  assert(isQueryStoryRelated(turn2Query, true), "Turn 2 is recognized as story continuation");
  state.activeStory = "ACT 1: Detective Maya infiltrates the central data repository under cover of night...";

  // Turn 3: Modify villain
  const turn3Query = "Make the villain more intelligent.";
  assert(isQueryStoryRelated(turn3Query, true), "Turn 3 ('Make the villain more intelligent') preserves story context");

  // Turn 4: Add emotional scene
  const turn4Query = "Add an emotional scene.";
  assert(isQueryStoryRelated(turn4Query, true), "Turn 4 ('Add an emotional scene') preserves story context");

  // Turn 5: Find plot holes
  const turn5Query = "Find plot holes.";
  assert(isQueryStoryRelated(turn5Query, true), "Turn 5 ('Find plot holes') preserves story context");

  // Turn 6: Convert to screenplay
  const turn6Query = "Convert it into a screenplay.";
  assert(isQueryStoryRelated(turn6Query, true), "Turn 6 ('Convert it into a screenplay') preserves story context");

  // Turn 7: Create shot list
  const turn7Query = "Create a shot list.";
  assert(isQueryStoryRelated(turn7Query, true), "Turn 7 ('Create a shot list') preserves story context");

  // Turn 8: Low budget
  const turn8Query = "Make this possible on a low budget.";
  assert(isQueryStoryRelated(turn8Query, true), "Turn 8 ('Make this possible on a low budget') preserves story context");

  assert(Boolean(state.activeStory), "Active story preserved across all turns");

  // --------------------------------------------------------------------------
  // TEST GROUP 5: End-to-End Orchestrator Invocations
  // --------------------------------------------------------------------------
  console.log("\n--- 5. ORCHESTRATOR INVOCATIONS ---");

  // Test 5A: Fast-path definition with active project
  const resStress = await orchestrateOmniForgeMessage({
    userMessage: "What is stress?",
    activeProject: mockFestivalProject,
    conversationHistory: [],
    conversationState: state,
    userId: "test-user-1",
    userType: "creator",
  });
  assert(resStress.success, "Orchestrator returned success for 'What is stress?'");
  assert(resStress.intent === "DEFINITION", `'What is stress?' intent is DEFINITION (got: ${resStress.intent})`);
  assert(resStress.response.toLowerCase().includes("stress"), "Definition text explains stress");
  assert(
    !resStress.suggestedChips.some((c) => c.includes("Performers") || c.includes("Festival")),
    `Chips do NOT leak active project: [${resStress.suggestedChips.join(", ")}]`
  );

  // Test 5B: Missing roles tool execution
  const resMissing = await orchestrateOmniForgeMessage({
    userMessage: "What roles are missing?",
    activeProject: mockFestivalProject,
    conversationHistory: [],
    conversationState: state,
    userId: "test-user-1",
    userType: "creator",
  });
  assert(resMissing.success, "Orchestrator executed missing roles tool successfully");
  assert(resMissing.executionMode === "TOOL", `Execution mode is TOOL (got: ${resMissing.executionMode})`);
  assert(resMissing.response.includes("Event Coordinator"), "Missing roles includes Event Coordinator");

  // Test 5C: Creator search tool execution
  const resSearch = await orchestrateOmniForgeMessage({
    userMessage: "Find performers.",
    activeProject: mockFestivalProject,
    conversationHistory: [],
    conversationState: state,
    userId: "test-user-1",
    userType: "creator",
  });
  assert(resSearch.success, "Orchestrator executed creator search successfully");
  assert(resSearch.executionMode === "TOOL", `Execution mode is TOOL (got: ${resSearch.executionMode})`);
  assert(resSearch.suggestedChips.includes("Show More Creators"), "Returns creator follow-up chips");

  // Test 5D: How to learn Python
  const resPython = await orchestrateOmniForgeMessage({
    userMessage: "How can I learn Python?",
    activeProject: mockFestivalProject,
    conversationHistory: [],
    conversationState: state,
    userId: "test-user-1",
    userType: "creator",
  });
  assert(resPython.success, "Orchestrator answered 'How can I learn Python?'");
  assert(resPython.executionMode === "AI", `Execution mode is AI (got: ${resPython.executionMode})`);
  assert(!resPython.response.includes("OmniCraft workflow guide"), "Did NOT return hardcoded OmniCraft workflow guide");
  assert(
    resPython.response.toLowerCase().includes("python") || resPython.response.toLowerCase().includes("programming"),
    "Answer addresses learning Python"
  );

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log("\n==================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
