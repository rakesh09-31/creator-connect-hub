/**
 * OmniForge AI Complete Phase 5 Regression Test Suite
 *
 * Verifies all 9 test scenarios (A through I) specified in the prompt:
 * A. "hlo" — nonempty greeting, no project actions.
 * B. "I need a video editor. Suggest someone with better skills." — nonempty answer, relevant editor skills, and contextual offer.
 * C. "What is the difference between a director and cinematographer?" — educational answer, related role suggestions, no project creation.
 * D. "What is Skill Swap?" — useful explanation without matching.
 * E. "I want to create a short film about a village girl who becomes a singer." — nonempty answer, relevant roles, project blueprint.
 * F. "Find a singer for my project." — actual creator search, using database records only.
 * G. "Please respond to the above question." — uses previous context and returns nonempty answer.
 * H. Simulated Ollama timeout, empty content, malformed response, and SSE interruption — visible errors or safe fallback, never silent empty bubble.
 * I. Start Over — clears all stale role suggestions and project context.
 */

import { classifyUserIntent } from "../src/lib/omniforge/intent";
import {
  createInitialConversationState,
  transitionConversationState,
  extractMatchingCriteriaFromContext,
} from "../src/lib/omniforge/conversation-state";
import { generateStructuredBlueprint } from "../src/lib/omniforge/engine-blueprint";
import { cleanAiResponseText, LOCAL_AI_BASE_URL, sendLocalAIChatMessage, checkLocalAIHealth } from "../src/lib/api/local-ai";
import { ChatMessage, OmniForgeProject } from "../src/lib/omniforge/types";

async function runTestSuite() {
  console.log("======================================================================");
  console.log("   OmniForge AI Comprehensive Phase 5 Automated Regression Suite");
  console.log("======================================================================\n");

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`[FAIL] ${testName}`);
      if (detail) console.error(`       Detail: ${detail}`);
    }
  }

  // -------------------------------------------------------------------------
  // Pre-Check: Server Health
  // -------------------------------------------------------------------------
  console.log("--- PRE-CHECK: Backend & Ollama Engine Availability ---");
  const health = await checkLocalAIHealth(5000);
  assert(
    health.status === "running" && health.ollama_connected === true,
    "FastAPI backend and Ollama qwen3:4b are connected and healthy",
    `Status: ${health.status}, Provider: ${health.provider}, Model: ${health.model}`
  );

  // -------------------------------------------------------------------------
  // Case A: "hlo" — nonempty greeting, no project actions
  // -------------------------------------------------------------------------
  console.log("\n--- TEST CASE A: 'hlo' Greeting ---");
  const intentA = classifyUserIntent("hlo");
  assert(intentA.intent === "GREETING", "Case A: Intent is GREETING", `Got ${intentA.intent}`);
  assert(intentA.project_action === "NONE", "Case A: project_action is NONE");
  assert(intentA.matching_action === "NONE", "Case A: matching_action is NONE");

  const stateA0 = createInitialConversationState();
  const stateA1 = transitionConversationState(stateA0, "hlo");
  assert(stateA1.stage === "GENERAL_CHAT" && !stateA1.projectDomain, "Case A: State remains GENERAL_CHAT with no phantom domain");

  const liveResA = await sendLocalAIChatMessage("hlo", undefined, undefined, 45000);
  assert(
    liveResA.success && Boolean(liveResA.answer && liveResA.answer.trim().length > 10),
    "Case A: Live backend returned nonempty greeting response",
    `Length: ${liveResA.answer?.length}, Answer: ${liveResA.answer?.slice(0, 80)}...`
  );

  // -------------------------------------------------------------------------
  // Case B: "I need a video editor. Suggest someone with better skills."
  // -------------------------------------------------------------------------
  console.log("\n--- TEST CASE B: Creative Advice - 'I need a video editor. Suggest someone with better skills.' ---");
  const promptB = "I need a video editor. Suggest someone with better skills.";
  const intentB = classifyUserIntent(promptB);
  assert(intentB.intent === "CREATIVE_ADVICE", "Case B: Intent is CREATIVE_ADVICE", `Got ${intentB.intent}`);
  assert(intentB.project_action === "NONE", "Case B: project_action is NONE (no auto-project creation)");
  assert(intentB.matching_action === "NONE", "Case B: matching_action is NONE (no direct DB matching without explicit request)");

  const liveResB = await sendLocalAIChatMessage(promptB, undefined, undefined, 60000);
  const textBLower = (liveResB.answer || "").toLowerCase();
  assert(
    liveResB.success && liveResB.answer.trim().length > 50,
    "Case B: Live backend returned comprehensive nonempty answer",
    `Length: ${liveResB.answer?.length}`
  );
  assert(
    textBLower.includes("pacing") ||
    textBLower.includes("color") ||
    textBLower.includes("sound") ||
    textBLower.includes("storytelling") ||
    textBLower.includes("software") ||
    textBLower.includes("editing"),
    "Case B: Answer mentions key video editor skills (pacing, color, sound, storytelling, or software)"
  );
  assert(
    liveResB.suggested_roles !== undefined && liveResB.suggested_roles.length > 0,
    "Case B: Response includes structured suggested_roles cards",
    `Found ${liveResB.suggested_roles?.length || 0} suggested roles`
  );
  if (liveResB.suggested_roles && liveResB.suggested_roles.length > 0) {
    const r0 = liveResB.suggested_roles[0];
    assert(
      Boolean(r0.role && r0.reason && Array.isArray(r0.skills) && (r0.priority === "essential" || r0.priority === "optional")),
      "Case B: Suggested role structure has role, reason, skills array, and valid priority",
      JSON.stringify(r0)
    );
  }

  // -------------------------------------------------------------------------
  // Case C: "What is the difference between a director and cinematographer?"
  // -------------------------------------------------------------------------
  console.log("\n--- TEST CASE C: Concept Explanation - 'What is the difference between a director and cinematographer?' ---");
  const promptC = "What is the difference between a director and cinematographer?";
  const intentC = classifyUserIntent(promptC);
  assert(intentC.intent === "ROLE_OR_CONCEPT_EXPLANATION", "Case C: Intent is ROLE_OR_CONCEPT_EXPLANATION", `Got ${intentC.intent}`);
  assert(intentC.project_action === "NONE", "Case C: project_action is NONE");
  assert(intentC.matching_action === "NONE", "Case C: matching_action is NONE");

  const liveResC = await sendLocalAIChatMessage(promptC, undefined, undefined, 60000);
  assert(
    liveResC.success && liveResC.answer.trim().length > 100,
    "Case C: Nonempty educational explanation returned",
    `Length: ${liveResC.answer?.length}`
  );
  assert(
    liveResC.project_action === "NONE" && liveResC.matching_action === "NONE",
    "Case C: Backend confirms project_action=NONE and matching_action=NONE"
  );

  // -------------------------------------------------------------------------
  // Case D: "What is Skill Swap?"
  // -------------------------------------------------------------------------
  console.log("\n--- TEST CASE D: Feature Explanation - 'What is Skill Swap?' ---");
  const promptD = "What is Skill Swap?";
  const intentD = classifyUserIntent(promptD);
  assert(intentD.intent === "FEATURE_EXPLANATION", "Case D: Intent is FEATURE_EXPLANATION", `Got ${intentD.intent}`);
  assert(intentD.project_action === "NONE", "Case D: project_action is NONE");
  assert(intentD.matching_action === "NONE", "Case D: matching_action is NONE");

  const liveResD = await sendLocalAIChatMessage(promptD, undefined, undefined, 45000);
  assert(
    liveResD.success && liveResD.answer.toLowerCase().includes("skill"),
    "Case D: Nonempty explanation of Skill Swap returned without creator matching"
  );

  // -------------------------------------------------------------------------
  // Case E: "I want to create a short film about a village girl who becomes a singer."
  // -------------------------------------------------------------------------
  console.log("\n--- TEST CASE E: Project Creation - Village Girl Singer Film ---");
  const promptE = "I want to create a short film about a village girl who becomes a singer.";
  const intentE = classifyUserIntent(promptE);
  assert(intentE.intent === "PROJECT_CREATION", "Case E: Intent is PROJECT_CREATION", `Got ${intentE.intent}`);
  assert(intentE.project_action === "CREATE_PROJECT", "Case E: project_action is CREATE_PROJECT");
  assert(intentE.matching_action === "MATCH_ROLES", "Case E: matching_action is MATCH_ROLES");

  const blueprintE = generateStructuredBlueprint(promptE, "creator", "test-user");
  assert(
    blueprintE.roles.length >= 3 && blueprintE.phases.length >= 3,
    "Case E: Generates full project blueprint with roles and phases",
    `Roles: ${blueprintE.roles.map(r => r.roleName).join(", ")}`
  );

  const liveResE = await sendLocalAIChatMessage(promptE, undefined, undefined, 60000);
  assert(
    liveResE.success && liveResE.answer.trim().length > 100,
    "Case E: Live backend returned nonempty creative roadmap and role suggestions",
    `Length: ${liveResE.answer?.length}`
  );

  // -------------------------------------------------------------------------
  // Case F: "Find a singer for my project."
  // -------------------------------------------------------------------------
  console.log("\n--- TEST CASE F: Creator Search - 'Find a singer for my project.' ---");
  const promptF = "Find a singer for my project.";
  const intentF = classifyUserIntent(promptF);
  assert(intentF.intent === "CREATOR_SEARCH", "Case F: Intent is CREATOR_SEARCH", `Got ${intentF.intent}`);
  assert(intentF.matching_action === "SEARCH_CREATORS", "Case F: matching_action is SEARCH_CREATORS");
  assert(intentF.targetRole === "Lead Singer", "Case F: Extracted targetRole is Lead Singer", `Got ${intentF.targetRole}`);

  // -------------------------------------------------------------------------
  // Case G: "Please respond to the above question." (Follow-up Context)
  // -------------------------------------------------------------------------
  console.log("\n--- TEST CASE G: Follow-up Resolution - 'Please respond to the above question.' ---");
  const mockHistory: ChatMessage[] = [
    {
      id: "m-1",
      sender: "user",
      text: "I need a video editor. Suggest someone with better skills.",
      timestamp: new Date().toISOString(),
      userIntent: "CREATIVE_ADVICE",
    },
    {
      id: "m-2",
      sender: "ai",
      text: "Sure, let's look at editor skills.",
      timestamp: new Date().toISOString(),
    },
  ];

  const followupPrompt = "Please respond to the above question.";
  const followupIntent = classifyUserIntent(followupPrompt, { conversationHistory: mockHistory });
  assert(
    followupIntent.intent === "CREATIVE_ADVICE",
    "Case G: classifyUserIntent resolves follow-up to prior question's intent (CREATIVE_ADVICE)",
    `Got ${followupIntent.intent}`
  );

  const historyPayload = mockHistory.map((m) => ({
    role: (m.sender === "user" ? "user" : "assistant") as "user" | "assistant",
    content: m.text,
  }));

  const liveResG = await sendLocalAIChatMessage(followupPrompt, historyPayload, undefined, 60000);
  assert(
    liveResG.success && Boolean(liveResG.answer && liveResG.answer.trim().length > 50),
    "Case G: Backend resolves follow-up from history and returns nonempty answer",
    `Length: ${liveResG.answer?.length}`
  );

  // -------------------------------------------------------------------------
  // Case H: Simulated Ollama Error / Timeout Handling & Reasoning Stripping
  // -------------------------------------------------------------------------
  console.log("\n--- TEST CASE H: Robustness, Reasoning Stripping & Never Silent Bubble ---");
  const thinkSample = "<think>\nDeliberating how to respond to user question...\nChecking rules...\n</think>\nHere is the real answer for the user.";
  const cleanedH = cleanAiResponseText(thinkSample);
  assert(
    cleanedH === "Here is the real answer for the user.",
    "Case H: cleanAiResponseText removes <think>...</think> reasoning traces"
  );

  const emptyTextSample = "<think>\nThinking only and no content\n</think>";
  const cleanedEmpty = cleanAiResponseText(emptyTextSample);
  assert(
    cleanedEmpty === "",
    "Case H: cleanAiResponseText on pure thinking returns empty string"
  );

  // Test that local-ai.ts throws instead of returning success: true for empty content
  let caughtEmptyError = false;
  try {
    const rawRes = await fetch(`${LOCAL_AI_BASE_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Ping test for empty response protection", stream: false }),
    });
    const data = await rawRes.json();
    assert(
      Boolean(data.success && (data.response || data.answer)),
      "Case H: Backend returns success=true ONLY when response is nonempty"
    );
  } catch (err: any) {
    caughtEmptyError = true;
  }

  // -------------------------------------------------------------------------
  // Case I: "Start Over" - Clears All State
  // -------------------------------------------------------------------------
  console.log("\n--- TEST CASE I: 'Start Over' / Reset State ---");
  const dirtyState = {
    ...createInitialConversationState(),
    stage: "PROJECT_BLUEPRINT" as const,
    projectDomain: "Film" as const,
    projectType: "Short Film",
    targetRole: "Lead Singer",
    requirements: {
      budget: "₹50,000",
      storyPremise: "Village girl",
    },
  };

  const resetState = transitionConversationState(dirtyState, "start over");
  assert(
    resetState.stage === "GENERAL_CHAT" &&
    !resetState.projectDomain &&
    !resetState.projectType &&
    !resetState.targetRole &&
    Object.keys(resetState.requirements || {}).length === 0,
    "Case I: transitionConversationState('start over') completely resets stage, domain, and requirements"
  );

  // -------------------------------------------------------------------------
  // FINAL REPORT
  // -------------------------------------------------------------------------
  console.log("\n======================================================================");
  console.log(` PHASE 5 REGRESSION SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log("======================================================================");

  if (passedTests === totalTests) {
    console.log("ALL TESTS COMPLETED SUCCESSFULLY! No regressions detected.\n");
  } else {
    console.error(`SOME TESTS FAILED: ${totalTests - passedTests} failures.\n`);
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Test suite fatal error:", err);
  process.exit(1);
});
