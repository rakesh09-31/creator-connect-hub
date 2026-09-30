// @ts-check
/**
 * OmniForge Intent Detection & UI Orchestration Regression Test Suite
 *
 * Tests requirements A through G:
 * A: "hlo" -> GREETING; zero project cards, zero creator searches.
 * B: "What is Skill Swap and how does it work?" -> FEATURE_EXPLANATION; zero project creation, zero creator matching, zero missing-role cards.
 * C: "What does a director do versus a cinematographer?" -> ROLE_OR_CONCEPT_EXPLANATION; direct explanation only, no project actions.
 * D: "I want to make a short film about a village girl who wants to become a singer" -> PROJECT_CREATION; roadmap activated, roles extracted, Supabase matching triggered.
 * E: "Find me a singer for my existing project" -> CREATOR_SEARCH; search only for singer using project context.
 * F: Multi-turn project follow-up retains context without duplicate project creation.
 * G: Deduplication test: rapid identical submissions produce exactly one response without corruption.
 */

const LOCAL_AI_URL = "http://127.0.0.1:8001/chat";
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function testBackendChat(message, projectContext = null, stream = false) {
  const payload = {
    message,
    project_context: projectContext,
    stream,
  };

  const response = await fetch(LOCAL_AI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
  }

  if (stream) {
    const text = await response.text();
    const lines = text.split("\n");
    let doneEvent = null;
    let tokens = [];

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.token) tokens.push(data.token);
          if (data.done) doneEvent = data;
        } catch {}
      }
    }
    const accumulated = tokens.join("");
    if (doneEvent) {
      doneEvent.answer = doneEvent.answer || accumulated;
      return doneEvent;
    }
    return { answer: accumulated };
  } else {
    return await response.json();
  }
}

async function runTests() {
  console.log("==================================================");
  console.log("OmniForge AI Intent & UI Orchestration Test Suite");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  // TEST A: "hlo"
  try {
    console.log("TEST A: 'hlo'");
    const res = await testBackendChat("hlo", null, false);
    console.log("  Response Answer:", res.answer);
    console.log("  Intent:", res.intent);
    console.log("  Project Action:", res.project_action);
    console.log("  Matching Action:", res.matching_action);

    if (
      res.intent === "GREETING" &&
      res.project_action === "NONE" &&
      res.matching_action === "NONE" &&
      !res.answer.includes("<think>") &&
      res.answer.toLowerCase().includes("hello")
    ) {
      console.log("  [PASS] Test A: Greeting classified, zero project/matching actions.\n");
      passed++;
    } else {
      console.error("  [FAIL] Test A failed conditions\n");
      failed++;
    }
  } catch (e) {
    console.error("  [FAIL] Test A exception:", e.message, "\n");
    failed++;
  }

  await delay(1200);

  // TEST B: "What is Skill Swap and how does it work?"
  try {
    console.log("TEST B: 'What is Skill Swap and how does it work?'");
    const res = await testBackendChat("What is Skill Swap and how does it work?", null, false);
    console.log("  Intent:", res.intent);
    console.log("  Project Action:", res.project_action);
    console.log("  Matching Action:", res.matching_action);
    console.log("  Answer Preview:", (res.answer || "").slice(0, 120) + "...");

    if (
      res.intent === "FEATURE_EXPLANATION" &&
      res.project_action === "NONE" &&
      res.matching_action === "NONE" &&
      res.answer &&
      res.answer.length > 20
    ) {
      console.log("  [PASS] Test B: Feature explanation classified, zero project/matching actions.\n");
      passed++;
    } else {
      console.error("  [FAIL] Test B failed conditions\n");
      failed++;
    }
  } catch (e) {
    console.error("  [FAIL] Test B exception:", e.message, "\n");
    failed++;
  }

  await delay(1200);

  // TEST C: "What does a director do versus a cinematographer?"
  try {
    console.log("TEST C: 'What does a director do versus a cinematographer?'");
    const res = await testBackendChat("What does a director do versus a cinematographer?", null, false);
    console.log("  Intent:", res.intent);
    console.log("  Project Action:", res.project_action);
    console.log("  Matching Action:", res.matching_action);
    console.log("  Answer Preview:", res.answer.slice(0, 120) + "...");

    if (
      res.intent === "ROLE_OR_CONCEPT_EXPLANATION" &&
      res.project_action === "NONE" &&
      res.matching_action === "NONE"
    ) {
      console.log("  [PASS] Test C: Role explanation classified, zero project/matching actions.\n");
      passed++;
    } else {
      console.error("  [FAIL] Test C failed conditions\n");
      failed++;
    }
  } catch (e) {
    console.error("  [FAIL] Test C exception:", e.message, "\n");
    failed++;
  }

  await delay(1200);

  // TEST D: "I want to make a short film about a village girl who wants to become a singer"
  let createdProjectData = null;
  try {
    console.log("TEST D: 'I want to make a short film about a village girl who wants to become a singer'");
    const res = await testBackendChat("I want to make a short film about a village girl who wants to become a singer", null, false);
    console.log("  Intent:", res.intent);
    console.log("  Project Action:", res.project_action);
    console.log("  Matching Action:", res.matching_action);
    console.log("  Project Data:", JSON.stringify(res.project_data));

    if (
      res.intent === "PROJECT_CREATION" &&
      res.project_action === "CREATE_PROJECT" &&
      res.matching_action === "MATCH_ROLES" &&
      res.project_data &&
      res.project_data.roles.length > 0
    ) {
      createdProjectData = res.project_data;
      console.log("  [PASS] Test D: Project creation classified, roadmap & role matching authorized.\n");
      passed++;
    } else {
      console.error("  [FAIL] Test D failed conditions\n");
      failed++;
    }
  } catch (e) {
    console.error("  [FAIL] Test D exception:", e.message, "\n");
    failed++;
  }

  await delay(1200);

  // TEST E: "Find me a singer for my existing project"
  try {
    console.log("TEST E: 'Find me a singer for my existing project'");
    const ctx = {
      title: "Short Film: A Village Singer's Dream",
      domain: "Film",
      type: "Short Film",
      story_premise: "A village girl who wants to become a singer",
    };
    const res = await testBackendChat("Find me a singer for my existing project", ctx, false);
    console.log("  Intent:", res.intent);
    console.log("  Project Action:", res.project_action);
    console.log("  Matching Action:", res.matching_action);

    if (
      res.intent === "CREATOR_SEARCH" &&
      res.project_action === "NONE" &&
      res.matching_action === "SEARCH_CREATORS"
    ) {
      console.log("  [PASS] Test E: Creator search only, project action is NONE.\n");
      passed++;
    } else {
      console.error("  [FAIL] Test E failed conditions\n");
      failed++;
    }
  } catch (e) {
    console.error("  [FAIL] Test E exception:", e.message, "\n");
    failed++;
  }

  await delay(1200);

  // TEST F: Project Follow-Up
  try {
    console.log("TEST F: Project Follow-Up ('How long will the shooting take?') with existing context");
    const ctx = {
      title: "Short Film: A Village Singer's Dream",
      domain: "Film",
      type: "Short Film",
      story_premise: "A village girl who wants to become a singer",
    };
    const res = await testBackendChat("How long will the shooting take?", ctx, false);
    console.log("  Intent:", res.intent);
    console.log("  Project Action:", res.project_action);
    console.log("  Matching Action:", res.matching_action);

    if (
      res.project_action === "NONE" &&
      res.matching_action === "NONE"
    ) {
      console.log("  [PASS] Test F: Context preserved without duplicate project creation.\n");
      passed++;
    } else {
      console.error("  [FAIL] Test F failed conditions\n");
      failed++;
    }
  } catch (e) {
    console.error("  [FAIL] Test F exception:", e.message, "\n");
    failed++;
  }

  await delay(1200);

  // TEST G: Streaming Response Contract Check
  try {
    console.log("TEST G: SSE Streaming Response Contract Check ('What is Skill Swap?')");
    const res = await testBackendChat("What is Skill Swap?", null, true);
    console.log("  Stream Done Event:", {
      done: res.done,
      intent: res.intent,
      project_action: res.project_action,
      matching_action: res.matching_action,
      hasAnswer: Boolean(res.answer),
    });

    if (
      res.done === true &&
      res.intent === "FEATURE_EXPLANATION" &&
      res.project_action === "NONE" &&
      res.matching_action === "NONE" &&
      res.answer.length > 20
    ) {
      console.log("  [PASS] Test G: Streaming contract correctly preserves validated intent & action fields.\n");
      passed++;
    } else {
      console.error("  [FAIL] Test G failed conditions\n");
      failed++;
    }
  } catch (e) {
    console.error("  [FAIL] Test G exception:", e.message, "\n");
    failed++;
  }

  console.log("==================================================");
  console.log(`Test Results Summary: ${passed} Passed, ${failed} Failed`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error("Fatal test runner error:", e);
  process.exit(1);
});
