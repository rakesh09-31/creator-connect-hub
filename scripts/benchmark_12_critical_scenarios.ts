import { classifyIntent } from "../src/lib/omniforge/intent";
import { searchCreatorsDirectory } from "../src/lib/omniforge/matcher";
import { sendLocalAIChatMessage, SendChatOptions } from "../src/lib/api/local-ai";
import { buildStandardFullStackRoadmap, DEFAULT_SKILL_DNA } from "../src/lib/omniforge/user-intelligence";

interface ScenarioResult {
  id: number;
  name: string;
  passed: boolean;
  durationMs: number;
  details: string;
}

const results: ScenarioResult[] = [];

async function runScenario(
  id: number,
  name: string,
  fn: () => Promise<{ passed: boolean; details: string }>
) {
  const start = performance.now();
  let passed = false;
  let details = "";
  try {
    const res = await fn();
    passed = res.passed;
    details = res.details;
  } catch (err: any) {
    passed = false;
    details = `Error: ${err?.message || String(err)}`;
  }
  const durationMs = Math.round(performance.now() - start);
  results.push({ id, name, passed, durationMs, details });
  const statusStr = passed ? "✓ PASS" : "✗ FAIL";
  console.log(`[${statusStr}] Scenario ${id}: ${name} (${durationMs}ms) - ${details}`);
}

async function main() {
  console.log("================================================================================");
  console.log("OMNIFORGE 12 CRITICAL SCENARIO BENCHMARK & REGRESSION SUITE");
  console.log("================================================================================\n");

  // 1. "hello"
  await runScenario(1, 'Deterministic Greeting ("hello")', async () => {
    const t0 = performance.now();
    const intentRes = classifyIntent("hello");
    const dur = performance.now() - t0;
    const isGreeting = intentRes.intent === "GREETING";
    const isDeterministic = Boolean(intentRes.deterministicText);
    const passed = isGreeting && isDeterministic && dur < 50;
    return {
      passed,
      details: `Intent: ${intentRes.intent}, Deterministic: ${isDeterministic}, Duration: ${dur.toFixed(2)}ms`,
    };
  });

  // 2. "What is photosynthesis?"
  await runScenario(2, 'Pure Q&A ("What is photosynthesis?")', async () => {
    const intentRes = classifyIntent("What is photosynthesis?");
    const isDef = ["DEFINITION", "GENERAL_KNOWLEDGE", "EXPLANATION"].includes(intentRes.intent);
    const noDbAction = intentRes.matching_action === "NONE" && intentRes.project_action === "NONE";

    // Call local AI
    const aiRes = await sendLocalAIChatMessage(
      "What is photosynthesis?",
      undefined,
      undefined,
      45000
    );

    const mentionsPlantOrLight = /plants?|light|chlorophyll|sunlight|glucose/i.test(aiRes.answer);
    const noFilmPollution = !/film|director|cinematographer|screenplay/i.test(aiRes.answer);
    const passed = isDef && noDbAction && mentionsPlantOrLight && noFilmPollution;

    return {
      passed,
      details: `Intent: ${intentRes.intent}, TTFT: ${aiRes.metrics?.ttft_ms}ms, Total: ${aiRes.metrics?.total_ms}ms, Length: ${aiRes.answer.length} chars`,
    };
  });

  // 3. "What is bubble sort?"
  await runScenario(3, 'Programming Q&A ("What is bubble sort?")', async () => {
    const intentRes = classifyIntent("What is bubble sort?");
    const isTech = [
      "PROGRAMMING_QUESTION",
      "TECHNICAL_QUESTION",
      "DEFINITION",
      "GENERAL_KNOWLEDGE",
    ].includes(intentRes.intent);

    const aiRes = await sendLocalAIChatMessage(
      "What is bubble sort?",
      undefined,
      undefined,
      45000
    );

    const mentionsSorting = /sort|adjacent|swap|algorithm|elements/i.test(aiRes.answer);
    const noFilmPollution = !/audition|director|cast|screenplay/i.test(aiRes.answer);
    const passed = isTech && mentionsSorting && noFilmPollution;

    return {
      passed,
      details: `Intent: ${intentRes.intent}, TTFT: ${aiRes.metrics?.ttft_ms}ms, Total: ${aiRes.metrics?.total_ms}ms, Length: ${aiRes.answer.length} chars`,
    };
  });

  // 4. "Can you find video editors?"
  await runScenario(4, 'Capability Query ("Can you find video editors?")', async () => {
    const intentRes = classifyIntent("Can you find video editors?");
    const isCapability = intentRes.intent === "CAPABILITY_QUERY";
    const noDirectSearch = intentRes.matching_action === "NONE";
    const hasChips = Boolean(intentRes.suggestedChips && intentRes.suggestedChips.length > 0);
    const passed = isCapability && noDirectSearch && hasChips;
    return {
      passed,
      details: `Intent: ${intentRes.intent}, Matching Action: ${intentRes.matching_action}, Chips: [${intentRes.suggestedChips?.join(", ")}]`,
    };
  });

  // 5. "Find all video editors"
  await runScenario(5, 'Direct Creator Search ("Find all video editors")', async () => {
    const intentRes = classifyIntent("Find all video editors");
    const isSearch =
      intentRes.intent === "CREATOR_SEARCH" &&
      intentRes.matching_action === "SEARCH_CREATORS" &&
      intentRes.targetRole === "Video Editor";

    const searchRes = await searchCreatorsDirectory({
      targetRole: "Video Editor",
      scope: "ALL",
      pageSize: 20,
    });

    const passed = isSearch && searchRes.creators.length > 0;
    return {
      passed,
      details: `Found ${searchRes.totalCount} video editors, Page 1 returned ${searchRes.creators.length}`,
    };
  });

  // 6. "Explain how to hire a creator"
  await runScenario(6, 'How-To Guidance ("Explain how to hire a creator")', async () => {
    const intentRes = classifyIntent("Explain how to hire a creator");
    const isHowTo = intentRes.intent === "HOW_TO";
    const notHireExecution = intentRes.intent !== "HIRE_CREATOR" && intentRes.matching_action !== "HIRE_CREATOR";
    const passed = isHowTo && notHireExecution;
    return {
      passed,
      details: `Intent: ${intentRes.intent}, Matching Action: ${intentRes.matching_action}`,
    };
  });

  // 7. "Hire creator @vinay"
  await runScenario(7, 'Direct Hire Execution ("Hire creator @vinay")', async () => {
    const intentRes = classifyIntent("Hire creator @vinay");
    const isHire = intentRes.intent === "HIRE_CREATOR" || intentRes.matching_action === "HIRE_CREATOR";
    const hasTarget = intentRes.targetName === "@vinay";
    const passed = isHire && hasTarget;
    return {
      passed,
      details: `Intent: ${intentRes.intent}, Target: ${intentRes.targetName}`,
    };
  });

  // 8. "Find cinematographers"
  await runScenario(8, 'Strict Cinematographer Search ("Find cinematographers")', async () => {
    const searchRes = await searchCreatorsDirectory({
      targetRole: "Cinematographer",
      scope: "ALL",
    });

    const onlyVinay =
      searchRes.creators.length === 1 &&
      (searchRes.creators[0].creator.username === "vinay" ||
        searchRes.creators[0].creator.id === "usr-cinematographer-1");

    const noVideographers = !searchRes.creators.some(
      (c) => c.creator.username.includes("video") || c.creator.skills.includes("videography")
    );

    const passed = onlyVinay && noVideographers;
    return {
      passed,
      details: `Found ${searchRes.totalCount} cinematographers: ${searchRes.creators.map((c) => `@${c.creator.username}`).join(", ")}`,
    };
  });

  // 9. "Find sound designers"
  await runScenario(9, 'Honest Zero Match ("Find sound designers")', async () => {
    const searchRes = await searchCreatorsDirectory({
      targetRole: "Sound Designer",
      scope: "ALL",
    });

    const honestZero = searchRes.totalCount === 0 && searchRes.creators.length === 0;
    return {
      passed: honestZero,
      details: `Returned honest count: ${searchRes.totalCount} sound designers`,
    };
  });

  // 10. "Find music directors"
  await runScenario(10, 'Honest Zero Match ("Find music directors")', async () => {
    const searchRes = await searchCreatorsDirectory({
      targetRole: "Music Director",
      scope: "ALL",
    });

    const honestZero = searchRes.totalCount === 0 && searchRes.creators.length === 0;
    return {
      passed: honestZero,
      details: `Returned honest count: ${searchRes.totalCount} music directors`,
    };
  });

  // 11. "I want to build a full stack developer career roadmap"
  await runScenario(11, 'Roadmap Request (Full Stack Developer)', async () => {
    const prompt = "I want to build a full stack developer career roadmap";
    const intentRes = classifyIntent(prompt);
    const isRoadmap = intentRes.intent === "ROADMAP_REQUEST" || intentRes.intent === "CAREER_ROADMAP";

    const roadmap = buildStandardFullStackRoadmap(DEFAULT_SKILL_DNA);
    const has10Levels = roadmap.nodes.length === 10;
    const hasMiniProjects = roadmap.nodes.every((n) => Boolean(n.miniProject?.title));
    const passed = isRoadmap && has10Levels && hasMiniProjects;
    return {
      passed,
      details: `Intent: ${intentRes.intent}, Roadmap Nodes: ${roadmap.nodes.length}, All nodes have mini-projects: ${hasMiniProjects}`,
    };
  });

  // 12. Stop/Cancel generation midway
  await runScenario(12, "Cancel Generation Midway via AbortSignal", async () => {
    const controller = new AbortController();
    let abortedCleanly = false;
    let tokensReceived = 0;

    const promise = sendLocalAIChatMessage(
      "Write a complete 10-page theatrical short film screenplay with stage directions",
      {
        signal: controller.signal,
        onToken: () => {
          tokensReceived++;
          if (tokensReceived >= 3) {
            controller.abort();
          }
        },
      }
    );

    // Abort after 1000ms if tokens didn't trigger abort yet
    const fallbackTimer = setTimeout(() => {
      controller.abort();
    }, 1000);

    try {
      await promise;
    } catch (err: any) {
      if (
        err?.message?.includes("cancelled") ||
        err?.name === "AbortError" ||
        controller.signal.aborted
      ) {
        abortedCleanly = true;
      }
    } finally {
      clearTimeout(fallbackTimer);
    }

    const passed = abortedCleanly;
    return {
      passed,
      details: `Aborted cleanly: ${abortedCleanly}, Tokens captured before stop: ${tokensReceived}`,
    };
  });

  console.log("\n================================================================================");
  console.log("BENCHMARK SUMMARY RESULTS");
  console.log("================================================================================");
  const totalPassed = results.filter((r) => r.passed).length;
  console.log(`Passed: ${totalPassed} / ${results.length} (${Math.round((totalPassed / results.length) * 100)}%)`);

  if (totalPassed === results.length) {
    console.log("ALL 12 CRITICAL SCENARIOS PASSED WITH 100% INTEGRITY & MEASURED LATENCIES!");
    process.exit(0);
  } else {
    console.log("FAILURES DETECTED:");
    for (const r of results.filter((r) => !r.passed)) {
      console.log(`- Scenario ${r.id}: ${r.name} -> ${r.details}`);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Benchmark runner failed:", err);
  process.exit(1);
});
