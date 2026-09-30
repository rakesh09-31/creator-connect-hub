import { cleanAiResponseText, sendLocalAIChatMessage, checkLocalAIHealth } from "../src/lib/api/local-ai";

async function runRegressionSuite() {
  console.log("=================================================");
  console.log(" OmniCraft Local AI Regression Test Suite ");
  console.log("=================================================\n");

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

  // ----------------------------------------------------
  // SECTION 1: UNIT TESTS FOR REASONING STRIPPING LOGIC
  // ----------------------------------------------------
  console.log("--- SECTION 1: Reasoning Sanitization Unit Tests ---");

  const testCase1 = "<think>\nThinking through this...\nLet's unpack the village girl story.\n</think>\n# The Village Singer\nHere is the plan.";
  assert(
    cleanAiResponseText(testCase1) === "# The Village Singer\nHere is the plan.",
    "Clean standard <think>...</think> tags"
  );

  const testCase2 = "Unmatched start of thinking trace\n</think>\n## Story Concept\nThis is the real answer.";
  assert(
    cleanAiResponseText(testCase2) === "## Story Concept\nThis is the real answer.",
    "Handle closing </think> marker without opening tag"
  );

  const testCase3 = "[THOUGHT]Internal deliberations here[/THOUGHT]\n## Production Plan\n1. Pre-Production";
  assert(
    cleanAiResponseText(testCase3) === "## Production Plan\n1. Pre-Production",
    "Clean [THOUGHT]...[/THOUGHT] tags"
  );

  const testCase4 = "<thought>Deliberating roles...</thought>Clean final answer only.";
  assert(
    cleanAiResponseText(testCase4) === "Clean final answer only.",
    "Clean <thought>...</thought> tags"
  );

  const testCase5 = "Direct clean message without any tags.";
  assert(
    cleanAiResponseText(testCase5) === "Direct clean message without any tags.",
    "Pass through clean text unchanged"
  );

  const testCase6 = "Okay, the user wants to build a web application where creators can swap skills. Let me break this down.\nFirst, I need to understand what swap skills means.\n\n### 1. Project Concept\nA platform for creators to exchange skills.";
  assert(
    cleanAiResponseText(testCase6) === "### 1. Project Concept\nA platform for creators to exchange skills.",
    "Strip untagged stream-of-consciousness thought preambles"
  );

  const testCase7 = "*Brainstorming angles*: maybe she sings to animals...\n...Time to write.\n### 1. Short Film Blueprint\nA story of Lila.";
  assert(
    cleanAiResponseText(testCase7) === "### 1. Short Film Blueprint\nA story of Lila.",
    "Strip brainstorming notes and '...Time to write' delimiters"
  );

  // ----------------------------------------------------
  // SECTION 2: HEALTH CHECK OF LOCAL AI ENGINE
  // ----------------------------------------------------
  console.log("\n--- SECTION 2: Live AI Engine Health Check ---");
  const health = await checkLocalAIHealth();
  assert(
    health.status === "running" && health.ollama_connected === true,
    "Local AI engine is running and Ollama is connected",
    `Status: ${health.status}, Provider: ${health.provider}, Model: ${health.model}`
  );

  // ----------------------------------------------------
  // SECTION 3: PROMPTS FROM TRANSCRIPT & VILLAGE GIRL
  // ----------------------------------------------------
  console.log("\n--- SECTION 3: Live Model Output & Film-Specific Plan Validation ---");

  const promptsToTest = [
    {
      id: "village-girl-1",
      prompt: "I want to make a short film about a village girl who wants to become a singer",
      category: "film",
      expectedKeywords: ["film", "story", "pre-production", "production", "director", "actor", "sound", "camera", "singer", "village", "project"],
      minMatches: 2,
      forbiddenKeywords: ["<think>", "</think>", "<thought>", "</thought>", "<reasoning>", "</reasoning>", "[thought]", "Okay, the user wants", "Let me break this down", "backend", "api endpoints", "database schema"],
    },
    {
      id: "village-girl-2",
      prompt: "I wrote a story about a village girl who wants to become a singer.",
      category: "story",
      expectedKeywords: ["story", "village", "character", "project", "creative", "film", "video", "book", "publish"],
      minMatches: 2,
      forbiddenKeywords: ["<think>", "</think>", "<thought>", "</thought>", "<reasoning>", "</reasoning>", "[thought]", "Okay, the user wants", "Let me break this down", "api endpoints", "database schema"],
    },
    {
      id: "village-girl-3",
      prompt: "I am a writer. I have a story about a young village girl who wants to become a singer, but I don't know how to make it into a film.",
      category: "film",
      expectedKeywords: ["script", "film", "production", "director", "story", "writer", "singer", "village", "project"],
      minMatches: 2,
      forbiddenKeywords: ["<think>", "</think>", "<thought>", "</thought>", "<reasoning>", "</reasoning>", "[thought]", "Okay, the user wants", "Let me break this down", "api endpoints", "database schema"],
    },
    {
      id: "software-project",
      prompt: "I need to build a web application for creators to swap skills.",
      category: "software",
      expectedKeywords: ["application", "frontend", "backend", "features", "development", "web", "platform", "skills", "creators", "collaboration", "exchange"],
      minMatches: 2,
      forbiddenKeywords: ["<think>", "</think>", "<thought>", "</thought>", "<reasoning>", "</reasoning>", "[thought]", "Okay, the user wants", "Let me break this down"],
    },
  ];

  for (const item of promptsToTest) {
    console.log(`\nTesting Prompt [${item.id}]: "${item.prompt}"...`);
    try {
      const response = await sendLocalAIChatMessage(item.prompt, 180000);
      const answer = response.answer;
      const lower = answer.toLowerCase();

      // Check success
      assert(response.success === true && answer.length > 50, `Received successful non-empty response for ${item.id}`);

      // Check reasoning is completely absent
      const hasForbidden = item.forbiddenKeywords.some((fk) => {
        const regex = new RegExp(`\\b${fk.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, "i");
        return lower.includes(fk.toLowerCase()) || regex.test(lower);
      });
      assert(!hasForbidden, `No internal reasoning or forbidden software leaks in ${item.id}`,
        hasForbidden ? `Found forbidden traces in response: ${item.forbiddenKeywords.filter(fk => lower.includes(fk.toLowerCase())).join(", ")}` : undefined
      );

      // Check domain-specific expectations
      const foundKeywords = item.expectedKeywords.filter((k) => lower.includes(k.toLowerCase()));
      const meetsExpectation = foundKeywords.length >= (item.minMatches || 2);
      assert(
        meetsExpectation,
        `Received appropriate ${item.category} plan for ${item.id}`,
        `Matched keywords: ${foundKeywords.join(", ")} (minimum required: ${item.minMatches || 2})`
      );

      console.log(`Sample output preview (first 150 chars):\n${answer.slice(0, 150).replace(/\n/g, " ")}...`);
    } catch (err: any) {
      assert(false, `Prompt execution failed for ${item.id}`, err.message);
    }
  }
  // ----------------------------------------------------
  // SECTION 4: MULTI-TURN CONVERSATION CONTEXT RETENTION
  // ----------------------------------------------------
  console.log("\n--- SECTION 4: Multi-Turn Context Retention & Follow-Up Test ---");

  // Step A: State Machine Entity & Multi-Turn Retention Unit Test
  const { createInitialConversationState, transitionConversationState, generateContextualConversationResponse } = await import("../src/lib/omniforge/conversation-state");

  console.log("\nTesting State Machine Context Retention across turns...");
  const s0 = createInitialConversationState();
  const s1 = transitionConversationState(s0, "I want to make a short film about a village girl who wants to become a singer");

  assert(s1.projectDomain === "Film", "State Machine: domain identified as Film on Turn 1");
  assert(s1.projectType === "Short Film", "State Machine: projectType identified as Short Film on Turn 1");
  assert(Boolean(s1.requirements.storyPremise && s1.requirements.storyPremise.toLowerCase().includes("village girl")), "State Machine: storyPremise retained on Turn 1");

  const turn2UserText = "My budget is ₹10,000 and I have 5 people in my team. Create a complete shooting plan, budget breakdown, and assign responsibilities to each team member.";
  const s2 = transitionConversationState(s1, turn2UserText);

  assert(s2.projectDomain === "Film", "State Machine: domain preserved as Film on Turn 2");
  assert(s2.projectType === "Short Film", "State Machine: projectType preserved as Short Film on Turn 2");
  assert(Boolean(s2.requirements.storyPremise && s2.requirements.storyPremise.toLowerCase().includes("village girl")), "State Machine: storyPremise preserved on Turn 2");
  assert(Boolean(s2.requirements.budget && (s2.requirements.budget.includes("10,000") || s2.requirements.budget.includes("10000"))), "State Machine: budget ₹10,000 extracted on Turn 2");
  assert(Boolean(s2.requirements.teamSize && s2.requirements.teamSize.includes("5")), "State Machine: team size (5 people) extracted on Turn 2");

  const contextualResponse = await generateContextualConversationResponse(s2, turn2UserText);
  assert(
    !contextualResponse.message.toLowerCase().includes("what kind of project") &&
    !contextualResponse.message.toLowerCase().includes("what type of project"),
    "State Machine Response: does NOT ask what kind of project it is"
  );
  assert(
    contextualResponse.message.includes("10,000") || contextualResponse.message.includes("₹10,000"),
    "State Machine Response: includes ₹10,000 budget breakdown"
  );
  assert(
    contextualResponse.message.includes("Person 1") && contextualResponse.message.includes("Person 5"),
    "State Machine Response: assigns responsibilities to all 5 team members"
  );

  // Step B: Live Multi-Turn Local AI Inference Test
  console.log("\nTesting Live Local AI Engine Multi-Turn Context Handling...");
  try {
    const turn1Prompt = "I want to make a short film about a village girl who wants to become a singer";
    const turn1Res = await sendLocalAIChatMessage(turn1Prompt, 180000);
    assert(turn1Res.success === true, "Live Turn 1: Successfully generated film-specific plan");

    const turn2History = [
      { role: "user" as const, content: turn1Prompt },
      { role: "assistant" as const, content: turn1Res.answer },
    ];

    const turn2ProjectContext = {
      title: "Short Film: Village Girl Aspiring Singer",
      domain: "Film",
      type: "Short Film",
      story_premise: "A village girl who wants to become a singer",
      budget: "₹10,000",
      team_size: "5 people",
    };

    console.log("Sending Live Turn 2 (with history and project context)...");
    const turn2Res = await sendLocalAIChatMessage(turn2UserText, turn2History, turn2ProjectContext, 180000);
    const turn2Answer = turn2Res.answer;
    const turn2Lower = turn2Answer.toLowerCase();

    // Verification 1: Success & Non-empty
    assert(turn2Res.success === true && turn2Answer.length > 200, "Live Turn 2: Received detailed response");

    // Verification 2: Zero Reasoning Leaks
    const hasThinkTags = turn2Lower.includes("<think>") || turn2Lower.includes("</think>") || turn2Lower.includes("<thought>") || turn2Lower.includes("okay, the user wants");
    assert(!hasThinkTags, "Live Turn 2: Response is free of internal reasoning/think tags");

    // Verification 3: Does NOT ask what kind of project it is
    const asksProjectType = turn2Lower.includes("what kind of project") || turn2Lower.includes("what type of project") || turn2Lower.includes("what is your project about");
    assert(!asksProjectType, "Live Turn 2: Did NOT ask what kind of project it is (preserved context)");

    // Verification 4: References the established story (village girl / singer)
    const mentionsStory = turn2Lower.includes("village") || turn2Lower.includes("singer") || turn2Lower.includes("song") || turn2Lower.includes("girl") || turn2Lower.includes("music");
    assert(mentionsStory, "Live Turn 2: Preserves and references established story premise");

    // Verification 5: Budget breakdown with ₹10,000 / INR
    const mentionsBudget = turn2Lower.includes("10,000") || turn2Lower.includes("10000") || turn2Lower.includes("₹") || turn2Lower.includes("inr") || turn2Lower.includes("budget");
    assert(mentionsBudget, "Live Turn 2: Includes budget breakdown for ₹10,000");

    // Verification 6: Team responsibilities for 5 people
    const mentionsTeam = (turn2Lower.includes("5") || turn2Lower.includes("five")) && (turn2Lower.includes("director") || turn2Lower.includes("cinematographer") || turn2Lower.includes("camera") || turn2Lower.includes("sound") || turn2Lower.includes("editor") || turn2Lower.includes("actor") || turn2Lower.includes("person"));
    assert(mentionsTeam, "Live Turn 2: Assigns responsibilities for 5 team members");

    // Verification 7: Schedule / Equipment / Locations
    const mentionsSchedule = turn2Lower.includes("pre-production") || turn2Lower.includes("shooting") || turn2Lower.includes("day 1") || turn2Lower.includes("schedule") || turn2Lower.includes("shoot");
    assert(mentionsSchedule, "Live Turn 2: Contains pre-production and shooting schedule");

    console.log(`\nTurn 2 Sample Output Preview:\n${turn2Answer.slice(0, 300).replace(/\n/g, " ")}...\n`);
  } catch (err: any) {
    assert(false, "Live Multi-Turn Context Test failed", err.message);
  }

  console.log("\n=================================================");
  console.log(` Results: ${passedTests} / ${totalTests} tests passed (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log("=================================================");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runRegressionSuite().catch((err) => {
  console.error("Regression suite encountered unexpected fatal error:", err);
  process.exit(1);
});

