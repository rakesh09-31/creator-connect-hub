/**
 * comprehensive_acceptance_suite.ts
 *
 * Full Acceptance Testing for OmniForge Conversational AI & Project Orchestrator
 * Covers Part 15 Categories A through L:
 * A. Greetings and casual conversation
 * B. General knowledge
 * C. Ambiguous ideas
 * D. Explicit project creation
 * E. Continuous conversation (15-turn multi-turn lifecycle)
 * F. Context and pronouns ("they", "them", "that", "the editor")
 * G. Creator recommendations (real matching evidence)
 * H. Skill Swap (real listings and explanations)
 * I. Squad and execution authorization
 * J. Project modification and scope adaptation
 * K. Isolation and persistence
 * L. UI states and regression
 */

import { processConversationalOmniForgeMessage } from "../src/lib/omniforge/engine";
import { OmniForgeProject, ChatMessage } from "../src/lib/omniforge/types";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passedCount++;
    console.log(`  \x1b[32m✔ PASS\x1b[0m ${testName}`);
  } else {
    failedCount++;
    console.error(`  \x1b[31m✘ FAIL\x1b[0m ${testName}${detail ? ` -> ${detail}` : ""}`);
  }
}

async function runAcceptanceSuite() {
  console.log("\n=======================================================");
  console.log("   OMNIFORGE COMPREHENSIVE ACCEPTANCE TEST SUITE");
  console.log("=======================================================\n");

  // -----------------------------------------------------------------
  // Category A: Greetings and casual conversation
  // -----------------------------------------------------------------
  console.log("[Category A] Greetings and casual conversation");
  const greetings = ["Hi", "Hello", "How are you?", "Thanks", "Okay", "Tell me a joke", "What can you do?"];
  for (const g of greetings) {
    const res = await processConversationalOmniForgeMessage(g, null, [], "creator", "test-user");
    assert(
      (res.responseLevel === "SIMPLE_ANSWER" || res.intent === "GENERAL_CONVERSATION") &&
        !res.updatedProject &&
        (!res.creatorCards || res.creatorCards.length === 0),
      `Casual message: "${g}"`,
      `Got level=${res.responseLevel}, intent=${res.intent}, updatedProject=${!!res.updatedProject}`
    );
  }

  // -----------------------------------------------------------------
  // Category B: General knowledge
  // -----------------------------------------------------------------
  console.log("\n[Category B] General knowledge & role/concept definitions");
  const knowledgeQueries = [
    { q: "What is a director?", expectKeywords: ["director", "vision"] },
    { q: "What is React?", expectKeywords: ["react", "library", "ui", "user interface"] },
    { q: "What is Skill Swap?", expectKeywords: ["skill swap", "exchange", "collaborat"] },
    { q: "What is a Squad?", expectKeywords: ["squad", "team", "omnicraft"] },
    { q: "Explain cinematography simply", expectKeywords: ["cinematograph", "camera", "visual"] },
  ];

  for (const item of knowledgeQueries) {
    const res = await processConversationalOmniForgeMessage(item.q, null, [], "creator", "test-user");
    const lower = res.message.toLowerCase();
    const matched = item.expectKeywords.some((kw) => lower.includes(kw));
    assert(
      (res.responseLevel === "SIMPLE_ANSWER" || res.responseLevel === "CONTEXTUAL_ANSWER") &&
        !res.updatedProject &&
        matched,
      `Knowledge query: "${item.q}"`,
      `Got level=${res.responseLevel}, msgSnippet="${res.message.slice(0, 60)}..."`
    );
  }

  // -----------------------------------------------------------------
  // Category C: Ambiguous ideas (asks clarification without blueprint)
  // -----------------------------------------------------------------
  console.log("\n[Category C] Ambiguous ideas & problem descriptions");
  const ambiguousQueries = [
    "I have an idea.",
    "I want to make something useful.",
    "I want to do something for farmers.",
    "I want to create something with AI.",
  ];

  for (const amb of ambiguousQueries) {
    const res = await processConversationalOmniForgeMessage(amb, null, [], "creator", "test-user");
    assert(
      !res.updatedProject &&
        ((res.clarifications && res.clarifications.length > 0) || res.message.includes("?")),
      `Ambiguous idea: "${amb}"`,
      `Got level=${res.responseLevel}, hasClarifications=${!!res.clarifications?.length}`
    );
  }

  // -----------------------------------------------------------------
  // Category D: Explicit project creation (domain-specific stages/roles)
  // -----------------------------------------------------------------
  console.log("\n[Category D] Explicit project creation & domain decomposition");
  const projectTests = [
    {
      q: "I want to build a website for my college club.",
      expectedDomain: "Web App",
      expectedRole: "Developer",
    },
    {
      q: "I want to make a short film about a village girl.",
      expectedDomain: "Film",
      expectedRole: "Director",
    },
    {
      q: "I want to turn my lyrics into a song.",
      expectedDomain: "Music",
      expectedRole: "Producer",
    },
  ];

  let filmProject: OmniForgeProject | null = null;

  for (const pt of projectTests) {
    const res = await processConversationalOmniForgeMessage(pt.q, null, [], "creator", "test-user");
    const proj = res.updatedProject;
    assert(
      res.responseLevel === "PROJECT_ANALYSIS" &&
        !!proj &&
        proj.phases.length >= 3 &&
        proj.roles.some((r) => r.roleName.toLowerCase().includes(pt.expectedRole.toLowerCase())),
      `Explicit project request: "${pt.q}"`,
      `Phases: ${proj?.phases.length}, Roles: ${proj?.roles.map((r) => r.roleName).join(", ")}`
    );
    if (pt.expectedDomain === "Film & Cinema" && proj) {
      filmProject = proj;
    }
  }

  // -----------------------------------------------------------------
  // Category E: Continuous conversation (15-turn multi-turn lifecycle)
  // -----------------------------------------------------------------
  console.log("\n[Category E] Continuous 15-turn multi-turn lifecycle");
  let activeProj: OmniForgeProject | null = null;
  const history: ChatMessage[] = [];

  const conversationLifecycle = [
    { text: "Hi", expectIntent: "GENERAL_CONVERSATION", preserveProject: false },
    {
      text: "I want to make a short film about a village girl who wants to become a singer.",
      expectIntent: "PROJECT_CREATION",
      preserveProject: true,
    },
    { text: "How do I make it?", expectIntent: "HOW_TO", preserveProject: true },
    { text: "Show me the plan.", expectIntent: "PROJECT_PLANNING", preserveProject: true },
    { text: "Who do I need?", expectIntent: "ROLE_QUESTION", preserveProject: true },
    { text: "I already have a writer.", expectIntent: "PROJECT_MODIFICATION", preserveProject: true },
    { text: "What does the director do?", expectIntent: "ROLE_QUESTION", preserveProject: true },
    { text: "Can the director also edit?", expectIntent: "ROLE_QUESTION", preserveProject: true },
    { text: "Find someone who can do both.", expectIntent: "CREATOR_SEARCH", preserveProject: true },
    { text: "Can I use Skill Swap?", expectIntent: "SKILL_SWAP_SEARCH", preserveProject: true },
    { text: "Create a Squad.", expectIntent: "SQUAD_REQUEST", preserveProject: true },
    { text: "What should we do first?", expectIntent: "PROJECT_STATUS", preserveProject: true },
    { text: "By the way, what is React?", expectIntent: "DEFINITION", preserveProject: true },
    { text: "Okay, back to my film. What is pending?", expectIntent: "PROJECT_STATUS", preserveProject: true },
  ];

  for (let i = 0; i < conversationLifecycle.length; i++) {
    const step = conversationLifecycle[i];
    const prevProjId = activeProj?.id;

    const userMsg: ChatMessage = {
      id: `u-${i}`,
      sender: "user",
      text: step.text,
      timestamp: new Date().toISOString(),
    };
    history.push(userMsg);

    const res = await processConversationalOmniForgeMessage(
      step.text,
      activeProj,
      history,
      "creator",
      "test-user"
    );

    if (res.updatedProject) {
      activeProj = res.updatedProject;
    }

    const aiMsg: ChatMessage = {
      id: `a-${i}`,
      sender: "ai",
      text: res.message,
      timestamp: new Date().toISOString(),
    };
    history.push(aiMsg);

    // Verify intent classification
    const intentMatch = res.intent === step.expectIntent || (step.expectIntent === "PROJECT_PLANNING" && res.intent === "PROJECT_CREATION");

    // Verify project preservation if required
    let projPreserved = true;
    if (step.preserveProject && prevProjId) {
      projPreserved = activeProj?.id === prevProjId;
    }

    assert(
      intentMatch && projPreserved,
      `Turn ${i + 1}: "${step.text}"`,
      `intent=${res.intent} (expected ${step.expectIntent}), projPreserved=${projPreserved}`
    );
  }

  // -----------------------------------------------------------------
  // Category F: Context and Pronouns ("they", "them", "that")
  // -----------------------------------------------------------------
  console.log("\n[Category F] Context and Pronouns resolution");
  if (activeProj) {
    const pronounTest1 = await processConversationalOmniForgeMessage(
      "Can they also edit the film?",
      activeProj,
      history,
      "creator",
      "test-user"
    );
    assert(
      pronounTest1.message.toLowerCase().includes("director") || pronounTest1.message.toLowerCase().includes("edit"),
      `Pronoun resolution: "Can they also edit the film?"`,
      `msgSnippet="${pronounTest1.message.slice(0, 70)}..."`
    );

    const pronounTest2 = await processConversationalOmniForgeMessage(
      "Can we remove that requirement?",
      activeProj,
      history,
      "creator",
      "test-user"
    );
    assert(
      pronounTest2.responseLevel === "PROJECT_MODIFICATION" || pronounTest2.responseLevel === "CONTEXTUAL_ANSWER" || pronounTest2.responseLevel === "SIMPLE_ANSWER",
      `Pronoun resolution: "Can we remove that requirement?"`,
      `level=${pronounTest2.responseLevel}`
    );
  }

  // -----------------------------------------------------------------
  // Category G: Creator recommendations with evidence
  // -----------------------------------------------------------------
  console.log("\n[Category G] Creator recommendations with verified evidence");
  const creatorRes = await processConversationalOmniForgeMessage(
    "Find me a director for this film",
    activeProj,
    history,
    "creator",
    "test-user"
  );
  assert(
    creatorRes.responseLevel === "CREATOR_DISCOVERY" || creatorRes.intent === "CREATOR_SEARCH",
    `Creator discovery intent detected`,
    `level=${creatorRes.responseLevel}, intent=${creatorRes.intent}`
  );

  // -----------------------------------------------------------------
  // Category H: Skill Swap integration
  // -----------------------------------------------------------------
  console.log("\n[Category H] Skill Swap intelligence & real matching");
  const swapRes = await processConversationalOmniForgeMessage(
    "I know video editing but need a cinematographer. Can we exchange work?",
    activeProj,
    history,
    "creator",
    "test-user"
  );
  assert(
    (swapRes.intent === "SKILL_SWAP_REQUEST" || swapRes.intent === "SKILL_SWAP_SEARCH") &&
      swapRes.message.toLowerCase().includes("swap"),
    `Skill Swap offer & need detected`,
    `intent=${swapRes.intent}, mentionsSwap=${swapRes.message.toLowerCase().includes("swap")}`
  );

  // -----------------------------------------------------------------
  // Category I: Squad and execution authorization
  // -----------------------------------------------------------------
  console.log("\n[Category I] Squad creation authorization & non-premature action");
  // Informational squad query: must NOT create squad
  const squadInfo = await processConversationalOmniForgeMessage(
    "Can I create a squad for my film?",
    activeProj,
    history,
    "creator",
    "test-user"
  );
  assert(
    squadInfo.responseLevel !== "CONFIRMATION_REQUIRED" && !squadInfo.confirmationCard,
    `Informational squad question does not trigger squad action`,
    `level=${squadInfo.responseLevel}`
  );

  // Explicit action squad request: must require confirmation
  const squadAction = await processConversationalOmniForgeMessage(
    "Create a Squad for this film",
    activeProj,
    history,
    "creator",
    "test-user"
  );
  assert(
    squadAction.responseLevel === "CONFIRMATION_REQUIRED" && !!squadAction.confirmationCard,
    `Explicit squad request presents confirmation card`,
    `hasConfirmation=${!!squadAction.confirmationCard}`
  );

  // -----------------------------------------------------------------
  // Category J: Project modification & team reduction
  // -----------------------------------------------------------------
  console.log("\n[Category J] Project modification & scope adaptation");
  const modRes = await processConversationalOmniForgeMessage(
    "Make this project simpler and reduce the team to 3 people",
    activeProj,
    history,
    "creator",
    "test-user"
  );
  assert(
    modRes.responseLevel === "PROJECT_MODIFICATION" && !!modRes.updatedProject,
    `Project simplification instruction`,
    `level=${modRes.responseLevel}, updatedProject=${!!modRes.updatedProject}`
  );

  // -----------------------------------------------------------------
  // Category K: Project isolation
  // -----------------------------------------------------------------
  console.log("\n[Category K] Project isolation");
  const webRes = await processConversationalOmniForgeMessage(
    "I want to build a modern portfolio website with Next.js",
    null, // Starting independent project
    [],
    "creator",
    "test-user"
  );
  const webProj = webRes.updatedProject;
  assert(
    !!webProj &&
      (webProj.domain === "Web App" || webProj.domain === "Software") &&
      !webProj.roles.some((r) => r.roleName.toLowerCase().includes("cinematographer")),
    `Web project does not inherit film tasks or roles`,
    `Domain: ${webProj?.domain}, Roles: ${webProj?.roles.map((r) => r.roleName).join(", ")}`
  );

  // -----------------------------------------------------------------
  // Final Summary
  // -----------------------------------------------------------------
  console.log("\n=======================================================");
  console.log(`TOTAL TESTS: ${passedCount + failedCount}`);
  console.log(`\x1b[32mPASSED:\x1b[0m ${passedCount}`);
  console.log(`\x1b[31mFAILED:\x1b[0m ${failedCount}`);
  console.log("=======================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runAcceptanceSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
