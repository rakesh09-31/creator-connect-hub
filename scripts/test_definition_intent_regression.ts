import { classifyUserIntent, isDeterministicIntent } from "../src/lib/omniforge/intent";

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

const romanticMusicalProject = {
  id: "proj_romantic_musical_456",
  title: "Romantic Musical Film",
  domain: "Film",
  type: "Short Film",
  roles: [
    { role: "Film Director", required: 1, filled: 1, department: "Directing" },
    { role: "Lead Actor", required: 1, filled: 0, department: "Cast" },
    { role: "Lead Actress", required: 1, filled: 0, department: "Cast" },
    { role: "Cinematographer", required: 1, filled: 0, department: "Camera" },
    { role: "Video Editor", required: 1, filled: 0, department: "Post-Production" },
    { role: "Sound Designer", required: 1, filled: 0, department: "Audio" }
  ]
};

const forbiddenIntents = [
  "PROJECT_CREATION",
  "PROJECT_CREATE",
  "PROJECT_ANALYSIS",
  "CREATOR_SEARCH",
  "TEAM_BUILDING",
  "TEAM_FORMATION",
  "MISSING_ROLES",
  "HOW_TO"
];

const forbiddenChipSubstrings = [
  "find creators",
  "review project plan",
  "view missing roles",
  "build team",
  "find performers",
  "find clients",
  "squad"
];

async function runRegressionSuite() {
  console.log("==================================================");
  console.log("OMNIFORGE GENERAL KNOWLEDGE & DEFINITION INTENT REGRESSION");
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

  // Section 1: Core Definition Queries (Standalone)
  console.log("--- SECTION 1: Standalone Definition Queries ---");

  const coreQueries = [
    {
      query: "What is stress?",
      expectedTerm: "stress",
      expectedExactText: "Stress means a state of mental or emotional pressure or tension caused by challenging or demanding situations."
    },
    {
      query: "What is the meaning of stress?",
      expectedTerm: "stress",
      expectedExactText: "Stress means a state of mental or emotional pressure or tension caused by challenging or demanding situations."
    },
    {
      query: "What does stress mean?",
      expectedTerm: "stress",
      expectedExactText: "Stress means a state of mental or emotional pressure or tension caused by challenging or demanding situations."
    },
    {
      query: "Define stress.",
      expectedTerm: "stress",
      expectedExactText: "Stress means a state of mental or emotional pressure or tension caused by challenging or demanding situations."
    },
    {
      query: "What is motivation?",
      expectedTerm: "motivation",
      expectedExactText: "Motivation is the internal drive, desire, or reason that stimulates, directs, and sustains goal-oriented behavior and action."
    },
    {
      query: "What is leadership?",
      expectedTerm: "leadership",
      expectedExactText: "Leadership is the ability to inspire, guide, influence, and support individuals or teams toward achieving a shared goal or vision."
    },
    {
      query: "What is teamwork?",
      expectedTerm: "teamwork",
      expectedExactText: "Teamwork is the collaborative effort of a group of people working together effectively and cooperatively to achieve a common objective."
    },
    {
      query: "Define anxiety.",
      expectedTerm: "anxiety",
      expectedExactText: "Anxiety is an emotion characterized by feelings of tension, worried thoughts, and physical changes in response to perceived stress or uncertainty."
    },
    {
      query: "Meaning of resilience.",
      expectedTerm: "resilience",
      expectedExactText: "Resilience is the ability to adapt, recover, and bounce back effectively from adversity, difficult life challenges, or stress."
    }
  ];

  for (const item of coreQueries) {
    console.log(`\nTesting: "${item.query}"`);
    const res = classifyUserIntent(item.query);

    assert(
      res.intent === "DEFINITION" || res.intent === "GENERAL_KNOWLEDGE",
      `Intent is DEFINITION or GENERAL_KNOWLEDGE (got: ${res.intent})`
    );
    assert(
      !forbiddenIntents.includes(res.intent),
      `Intent NOT in forbidden list (${forbiddenIntents.join(", ")})`
    );
    assert(res.project_action === "NONE", `project_action is NONE (got: ${res.project_action})`);
    assert(res.matching_action === "NONE", `matching_action is NONE (got: ${res.matching_action})`);
    assert(isDeterministicIntent(res.intent, Boolean(res.deterministicText)), `Fast path isDeterministicIntent returns true`);

    if (item.expectedExactText) {
      assert(
        res.deterministicText === item.expectedExactText,
        `Exact deterministic text returned: "${res.deterministicText}"`
      );
    }

    // Suggested chips check
    const chips = res.suggestedChips || [];
    const hasForbiddenChips = chips.some((c) =>
      forbiddenChipSubstrings.some((f) => c.toLowerCase().includes(f))
    );
    assert(!hasForbiddenChips, `No project action chips returned (got: ${JSON.stringify(chips)})`);
  }

  // Section 2: Active Project Non-Hijacking Verification
  console.log("\n--- SECTION 2: Active Project Non-Hijacking Verification ---");

  const testActiveContexts = [
    { name: "College Cultural Festival", project: collegeFestivalProject },
    { name: "Romantic Musical Film", project: romanticMusicalProject }
  ];

  for (const ctx of testActiveContexts) {
    console.log(`\nTesting with active project: "${ctx.name}"`);

    for (const item of coreQueries) {
      const res = classifyUserIntent(item.query, {
        activeProject: ctx.project,
        hasActiveProject: true
      });

      assert(
        res.intent === "DEFINITION" || res.intent === "GENERAL_KNOWLEDGE",
        `[${ctx.name}] "${item.query}" -> ${res.intent} (not hijacked)`
      );
      assert(
        !forbiddenIntents.includes(res.intent),
        `[${ctx.name}] Intent NOT hijacked by project context`
      );
      assert(res.project_action === "NONE", `[${ctx.name}] project_action remains NONE`);
      assert(res.matching_action === "NONE", `[${ctx.name}] matching_action remains NONE`);

      const chips = res.suggestedChips || [];
      const hasForbiddenChips = chips.some((c) =>
        forbiddenChipSubstrings.some((f) => c.toLowerCase().includes(f))
      );
      assert(
        !hasForbiddenChips,
        `[${ctx.name}] No project chips injected (got: ${JSON.stringify(chips)})`
      );
    }
  }

  // Section 3: Preserving Existing Intent Routing Behavior
  console.log("\n--- SECTION 3: Preserving Existing Intent Routing Behavior ---");

  // 1. "Find Performers" -> CREATOR_SEARCH
  console.log(`\nTesting: "Find Performers" with College Cultural Festival`);
  const r1 = classifyUserIntent("Find Performers", { activeProject: collegeFestivalProject });
  assert(r1.intent === "CREATOR_SEARCH", `"Find Performers" -> CREATOR_SEARCH (got: ${r1.intent})`);
  assert(r1.targetRole === "Performers", `targetRole is Performers (got: ${r1.targetRole})`);

  // 2. "How can I find performers?" -> HOW_TO
  console.log(`\nTesting: "How can I find performers?" with College Cultural Festival`);
  const r2 = classifyUserIntent("How can I find performers?", { activeProject: collegeFestivalProject });
  assert(r2.intent === "HOW_TO", `"How can I find performers?" -> HOW_TO (got: ${r2.intent})`);

  // 3. "Explain DNS" -> EDUCATIONAL / EXPLANATION / DEFINITION with academic chips
  console.log(`\nTesting: "Explain DNS"`);
  const r3 = classifyUserIntent("Explain DNS");
  assert(
    r3.intent === "EDUCATIONAL_QUESTION" || r3.intent === "EXPLANATION" || r3.intent === "DEFINITION",
    `"Explain DNS" classified as educational/explanation (got: ${r3.intent})`
  );

  // 4. Story generation -> STORY_GENERATION
  console.log(`\nTesting: "Write a short film screenplay about a missing student"`);
  const r4 = classifyUserIntent("Write a short film screenplay about a missing student");
  assert(
    r4.intent === "STORY_GENERATION" || r4.intent === "STORY_MODIFICATION" || r4.intent === "EXPLANATION",
    `Story request classified as STORY_GENERATION / EXPLANATION (got: ${r4.intent})`
  );

  // 5. Project creation -> PROJECT_CREATION / PROJECT_CREATE
  console.log(`\nTesting: "I want to build a modern portfolio website"`);
  const r5 = classifyUserIntent("I want to build a modern portfolio website");
  assert(
    r5.intent === "PROJECT_CREATION" || r5.intent === "PROJECT_CREATE",
    `Project creation classified as PROJECT_CREATION (got: ${r5.intent})`
  );

  console.log("\n==================================================");
  console.log(`REGRESSION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runRegressionSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
