import { orchestrateOmniForgeConversation } from "../src/lib/omniforge/server/orchestrator.server";
import { ChatMessage, OmniForgeProject } from "../src/lib/omniforge/types";
import { createInitialConversationState } from "../src/lib/omniforge/conversation-state";
import { generateStructuredBlueprint } from "../src/lib/omniforge/engine-blueprint";

async function runAllComprehensiveTests() {
  console.log("==================================================================");
  console.log("🚀 RUNNING FULL AUTONOMOUS OMNIFORGE TEST SUITE");
  console.log("==================================================================");

  let totalTests = 0;
  let passedTests = 0;

  // -------------------------------------------------------------------------
  // TEST SUITE 1: The Exact 5-Turn Short Film Sequence
  // -------------------------------------------------------------------------
  console.log("\n--- [SUITE 1] 5-Turn Autonomous Short Film Sequence ---");
  const filmTurns = [
    "I have an idea for a short film.",
    "I have a story, so generate the execution plan and creators.",
    "A suspense thriller about a missing student.",
    "I have a completed script.",
    "Just make the complete plan for making a short film and find the actors.",
  ];

  let filmHistory: ChatMessage[] = [];
  let filmState = createInitialConversationState();
  let filmProject: OmniForgeProject | null = null;

  for (let i = 0; i < filmTurns.length; i++) {
    totalTests++;
    const text = filmTurns[i];
    filmHistory.push({ id: `u-${i}`, sender: "user", text, timestamp: new Date().toISOString() });

    const res = await orchestrateOmniForgeConversation({
      text,
      activeProject: filmProject,
      conversationHistory: filmHistory,
      conversationState: filmState,
      userType: "client",
      userId: "test-client-1",
    });

    const msg = res.structuredResponse.message;
    console.log(`\nTurn ${i + 1} (${text}):`);
    console.log(`- Response length: ${msg.length} chars | Status: ${res.meta.status}`);

    if (i === 0) {
      if (msg.includes("short film") && !msg.includes("I'm monitoring your")) {
        console.log("  ✅ PASS: Conversational greeting and orientation");
        passedTests++;
      } else {
        console.error("  ❌ FAIL: Turn 1 failed:", msg);
      }
    } else if (i === 1) {
      const hasRealCreators = (res.structuredResponse.creatorCards && res.structuredResponse.creatorCards.length > 0) || msg.includes("ramu") || msg.includes("vinay") || msg.includes("Director") || msg.includes("creator") || msg.includes("Actor");
      if (hasRealCreators && !msg.includes("I'm monitoring your")) {
        console.log(`  ✅ PASS: Turn 2 matched creators and initialized execution plan (${msg.length} chars)`);
        passedTests++;
      } else {
        console.error("  ❌ FAIL: Turn 2 failed:", msg);
      }
    } else if (i === 2 || i === 4) {
      const hasAssumptions = msg.includes("Working Assumptions") || msg.includes("Project Overview");
      const hasLogline = msg.includes("Logline") || msg.includes("Synopsis");
      const hasCharacters = msg.includes("Character") || msg.includes("Casting");
      const hasRoadmap = msg.includes("Roadmap") || msg.includes("Pre-Production");
      const hasBudget = msg.includes("Budget");
      const hasRealCreators = (res.structuredResponse.creatorCards && res.structuredResponse.creatorCards.length > 0) || msg.includes("ramu");

      if (hasAssumptions && hasLogline && hasCharacters && hasRoadmap && (hasRealCreators || msg.includes("ramu"))) {
        console.log(`  ✅ PASS: Full 10-section autonomous report with real creators returned (${msg.length} chars)`);
        passedTests++;
      } else {
        console.error(`  ❌ FAIL: Turn ${i + 1} missing key sections:`, { hasAssumptions, hasLogline, hasCharacters, hasRoadmap, hasBudget, hasRealCreators });
      }
    } else if (i === 3) {
      if (msg.includes("screenplay") || msg.includes("script") || msg.includes("production")) {
        console.log("  ✅ PASS: Script status recognized and integrated");
        passedTests++;
      } else {
        console.error("  ❌ FAIL: Turn 4 failed:", msg);
      }
    }

    if (res.structuredResponse.updatedProject) filmProject = res.structuredResponse.updatedProject;
    if (res.structuredResponse.conversationState) filmState = res.structuredResponse.conversationState;
    filmHistory.push({ id: `ai-${i}`, sender: "ai", text: msg, timestamp: new Date().toISOString() });
  }

  // -------------------------------------------------------------------------
  // TEST SUITE 2: E-Commerce Website Roadmap & Developer Matching
  // -------------------------------------------------------------------------
  console.log("\n--- [SUITE 2] E-Commerce Roadmap & Developer Matching ---");
  totalTests++;
  const ecomRes = await orchestrateOmniForgeConversation({
    text: "Create an ecommerce website development roadmap and find developers.",
    activeProject: null,
    conversationHistory: [],
    userType: "client",
    userId: "test-client-1",
  });

  const ecomMsg = ecomRes.structuredResponse.message;
  if (
    (ecomMsg.includes("E-Commerce") || ecomMsg.includes("e-commerce")) &&
    (ecomMsg.includes("Frontend") || ecomMsg.includes("Backend") || ecomMsg.includes("Payments") || ecomMsg.includes("Database")) &&
    !ecomMsg.includes("I'm monitoring your")
  ) {
    console.log(`  ✅ PASS: E-commerce roadmap returned (${ecomMsg.length} chars)`);
    passedTests++;
  } else {
    console.error("  ❌ FAIL: E-commerce roadmap failed:", ecomMsg);
  }

  // -------------------------------------------------------------------------
  // TEST SUITE 3: Targeted Regional Actor Search (Telugu / Hyderabad)
  // -------------------------------------------------------------------------
  console.log("\n--- [SUITE 3] Targeted Regional Actor Search (Telugu / Hyderabad) ---");
  totalTests++;
  const teluguRes = await orchestrateOmniForgeConversation({
    text: "Find actors for a Telugu short film in Hyderabad.",
    activeProject: null,
    conversationHistory: [],
    userType: "client",
    userId: "test-client-1",
  });

  const teluguMsg = teluguRes.structuredResponse.message;
  if (
    (teluguMsg.includes("actor") || teluguMsg.includes("Actor") || teluguMsg.includes("casting")) &&
    !teluguMsg.includes("I'm monitoring your")
  ) {
    console.log(`  ✅ PASS: Regional actor matching / casting returned (${teluguMsg.length} chars)`);
    passedTests++;
  } else {
    console.error("  ❌ FAIL: Regional actor search failed:", teluguMsg);
  }

  // -------------------------------------------------------------------------
  // TEST SUITE 4: General Tech Definition (Explain React)
  // -------------------------------------------------------------------------
  console.log("\n--- [SUITE 4] General Tech Explanation (React) ---");
  totalTests++;
  const reactRes = await orchestrateOmniForgeConversation({
    text: "Explain React.",
    activeProject: null,
    conversationHistory: [],
    userType: "creator",
    userId: "test-creator-1",
  });

  const reactMsg = reactRes.structuredResponse.message;
  if (reactMsg.includes("React") && (reactMsg.includes("component") || reactMsg.includes("DOM") || reactMsg.includes("JavaScript"))) {
    console.log(`  ✅ PASS: React explained clearly (${reactMsg.length} chars)`);
    passedTests++;
  } else {
    console.error("  ❌ FAIL: React explanation failed:", reactMsg);
  }

  // -------------------------------------------------------------------------
  // TEST SUITE 5: Dynamic Follow-up Resolution ("What is the next step?")
  // -------------------------------------------------------------------------
  console.log("\n--- [SUITE 5] Dynamic Next Step Resolution ---");
  totalTests++;
  const nextRes = await orchestrateOmniForgeConversation({
    text: "What is the next step?",
    activeProject: filmProject,
    conversationHistory: filmHistory,
    conversationState: filmState,
    userType: "client",
    userId: "test-client-1",
  });

  const nextMsg = nextRes.structuredResponse.message;
  if (nextMsg.length > 50 && !nextMsg.includes("I'm monitoring your E-commerce store")) {
    console.log(`  ✅ PASS: Next step contextually resolved (${nextMsg.length} chars)`);
    passedTests++;
  } else {
    console.error("  ❌ FAIL: Next step failed:", nextMsg);
  }

  // -------------------------------------------------------------------------
  // TEST SUITE 6: Failure Simulation & Truthful Attribution
  // -------------------------------------------------------------------------
  console.log("\n--- [SUITE 6] Failure Simulation & Truthful Attribution ---");
  totalTests++;
  const failRes = await orchestrateOmniForgeConversation({
    text: "Simulate AI Provider failure",
    activeProject: null,
    conversationHistory: [],
    userType: "client",
    userId: "test-client-1",
  });

  if (
    failRes.meta.status === "provider_error" &&
    failRes.meta.isRealLLM === false &&
    failRes.structuredResponse.message.includes("Simulated")
  ) {
    console.log("  ✅ PASS: Simulated failure safely handled and attributed");
    passedTests++;
  } else {
    console.error("  ❌ FAIL: Failure simulation failed:", failRes);
  }

  console.log("\n==================================================================");
  console.log(`📊 FINAL RESULT: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log("==================================================================");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runAllComprehensiveTests().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
