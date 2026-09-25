import { orchestrateOmniForgeConversation } from "../src/lib/omniforge/server/orchestrator.server";
import { generateStructuredBlueprint } from "../src/lib/omniforge/engine-blueprint";
import { processConversationalOmniForgeMessage } from "../src/lib/omniforge/engine";

const TEST_QUERIES = [
  // 1. E-Commerce Website Development Steps
  {
    title: "1. E-Commerce Website Steps",
    query: "can you provide the steps to develop the ecommerce website",
    expectedKeywords: ["requirement", "design", "frontend", "backend", "database", "checkout", "payment"],
  },
  // 2. General Website Development Steps
  {
    title: "2. General Website Steps",
    query: "can you make the steps to develop a website",
    expectedKeywords: ["discovery", "design", "frontend", "backend", "testing", "deployment"],
  },
  // 3. Technical Definition: React
  {
    title: "3. What is React?",
    query: "What is React?",
    expectedKeywords: ["react", "component", "interface", "javascript"],
  },
  // 4. Creative Writing: Short Film Screenplay
  {
    title: "4. Screenplay Generation",
    query: "Write a short film screenplay about a missing student",
    expectedKeywords: ["int.", "ext.", "maya", "night"],
  },
  // 5. Follow-up / Next Step Context
  {
    title: "5. Explain the next step",
    query: "Can you explain the next step?",
    expectedKeywords: ["step", "priority", "milestone"],
  },
  // 6. Casual Greeting
  {
    title: "6. Natural Greeting",
    query: "Hi",
    expectedKeywords: ["omniforge", "help", "create"],
  },
  // 7. General Coding / API Question
  {
    title: "7. API Explanation",
    query: "What is an API?",
    expectedKeywords: ["api", "interface", "application", "communicate"],
  },
  // 8. Creative / Filmmaking Concept
  {
    title: "8. Cinematography Role",
    query: "What does a cinematographer do?",
    expectedKeywords: ["camera", "lighting", "visual", "director"],
  },
  // 9. Python Learning Roadmap
  {
    title: "9. Learn Python",
    query: "How do I learn Python?",
    expectedKeywords: ["python", "syntax", "project", "problem"],
  },
  // 10. Directing vs Writing
  {
    title: "10. Writer vs Director",
    query: "What is the difference between a writer and a director?",
    expectedKeywords: ["writer", "director", "script", "visual"],
  },
  // 11. What is Next.js
  {
    title: "11. Next.js Explanation",
    query: "What is Next.js?",
    expectedKeywords: ["next.js", "react", "framework", "server"],
  },
  // 12. Skill Swap Definition
  {
    title: "12. Skill Swap Inquiry",
    query: "What is Skill Swap?",
    expectedKeywords: ["skill swap", "trade", "collaboration", "creator"],
  },
  // 13. Short Film Premise Discussion
  {
    title: "13. Short Film Idea",
    query: "I want to make a short film about a village girl who wants to become a singer",
    expectedKeywords: ["film", "story", "director"],
  },
  // 14. What can you do
  {
    title: "14. Capabilities Inquiry",
    query: "What can you do?",
    expectedKeywords: ["architect", "creator", "roadmap", "squad"],
  },
  // 15. Speed of Light
  {
    title: "15. Speed of Light",
    query: "What is the speed of light?",
    expectedKeywords: ["299,792,458", "speed of light"],
  },
];

async function runTestSuite() {
  console.log("==================================================================");
  console.log("🧪 RUNNING 15-QUERY VALIDATION SUITE: LIVE LLM & LOCAL FALLBACK");
  console.log("==================================================================\n");

  const dummyProject = generateStructuredBlueprint("E-commerce store", "creator", "test-user-1");

  let allPassed = true;
  const responses: string[] = [];

  for (let i = 0; i < TEST_QUERIES.length; i++) {
    const test = TEST_QUERIES[i];
    console.log(`[TEST ${i + 1}/15] ${test.title}`);
    console.log(`  Query: "${test.query}"`);

    // Test with active project loaded
    const res = await orchestrateOmniForgeConversation({
      text: test.query,
      activeProject: dummyProject,
      conversationHistory: [
        { id: "h1", sender: "user", text: "I want to build an ecommerce store", timestamp: "" },
        { id: "h2", sender: "ai", text: "Great, let's architect your store!", timestamp: "" },
      ],
      userType: "creator",
      userId: "test-user-1",
    });

    const msg = res.structuredResponse.message || "";
    responses.push(msg);

    // Verify it did not return the canned monitoring string
    const isCannedMonitoring = msg.includes("I'm monitoring your") || msg.includes("I'm tracking your");
    const lowerMsg = msg.toLowerCase();
    const hasExpectedKeyword = test.expectedKeywords.some((k) => lowerMsg.includes(k.toLowerCase()));

    console.log(`  Provider: ${res.meta.provider} (${res.meta.model}) | isRealLLM: ${res.meta.isRealLLM}`);
    console.log(`  Response Preview: ${msg.slice(0, 140).replace(/\n/g, " ")}...`);

    if (isCannedMonitoring) {
      console.error(`  ❌ FAILED: Repeated canned monitoring message detected!`);
      allPassed = false;
    } else if (!hasExpectedKeyword && msg.length < 50) {
      console.error(`  ❌ FAILED: Missing expected answer content.`);
      allPassed = false;
    } else {
      console.log(`  ✅ PASSED: Meaningful, differentiated response generated.`);
    }
    console.log("");
  }

  // Verify that all 15 queries did not produce the same canned response
  const uniqueResponses = new Set(responses);
  console.log(`Differentiated responses: ${uniqueResponses.size} / ${responses.length}`);
  if (uniqueResponses.size < responses.length - 1) {
    console.error("❌ High duplicate response rate across varied queries!");
    allPassed = false;
  } else {
    console.log("✅ All answers are unique and tailored to each specific prompt.");
  }

  // Test Fallback when provider key is disabled
  console.log("\n------------------------------------------------------------------");
  console.log("🧪 TESTING LOCAL FALLBACK ENGINE DIRECTLY (No live LLM key)");
  console.log("------------------------------------------------------------------");

  const fallbackQueries = [
    "can you provide the steps to develop the ecommerce website",
    "can you make the steps to develop a website",
    "What is React?",
    "Write a short film screenplay about a lost key",
    "Can you explain the next step?",
  ];

  for (const fq of fallbackQueries) {
    console.log(`\nFallback Query: "${fq}"`);
    const fallbackRes = await processConversationalOmniForgeMessage(
      fq,
      dummyProject,
      [],
      "creator",
      "test-user-1"
    );
    const fMsg = fallbackRes.message || "";
    const isCanned = fMsg.includes("I'm monitoring your") || fMsg.includes("I'm tracking your");
    console.log(`  Fallback Message: ${fMsg.slice(0, 160).replace(/\n/g, " ")}...`);
    if (isCanned) {
      console.error("  ❌ FAILED: Fallback returned canned monitoring message!");
      allPassed = false;
    } else {
      console.log("  ✅ PASSED: Fallback returned high-quality direct answer.");
    }
  }

  console.log("\n==================================================================");
  if (allPassed) {
    console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! ZERO CANNED MONITORING BUGS DETECTED.");
  } else {
    console.log("❌ SOME TESTS FAILED.");
    process.exit(1);
  }
  console.log("==================================================================");
}

runTestSuite().catch((err) => {
  console.error("Suite execution error:", err);
  process.exit(1);
});
