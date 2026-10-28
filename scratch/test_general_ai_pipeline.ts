import { sendLocalAIChatMessage, validateLocalAIResponse } from "../src/lib/api/local-ai.ts";
import { classifyUserIntent, isDeterministicIntent } from "../src/lib/omniforge/intent.ts";

const TEST_QUERIES = [
  "What is artificial intelligence?",
  "What is stress?",
  "What is motivation?",
  "Explain DNS.",
  "Explain blockchain simply.",
  "How does Python work?",
  "Give me a simple explanation of APIs."
];

async function runTests() {
  console.log("==================================================");
  console.log("TESTING GENERAL AI PIPELINE END-TO-END");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  for (const query of TEST_QUERIES) {
    console.log(`\nTesting Query: "${query}"`);
    const intentResult = classifyUserIntent(query);
    const hasDetText = Boolean(intentResult.deterministicText?.trim());
    const isFast = isDeterministicIntent(intentResult.intent, hasDetText) && (
      !["DEFINITION", "GENERAL_KNOWLEDGE", "KNOWLEDGE", "HOW_TO"].includes(intentResult.intent) ||
      hasDetText
    );

    console.log(`  Intent: ${intentResult.intent} | isFast: ${isFast} | hasDetText: ${hasDetText}`);

    let responseText = "";

    if (isFast && intentResult.deterministicText) {
      responseText = intentResult.deterministicText;
      console.log(`  [FAST PATH] Returned cached deterministic text (${responseText.length} chars)`);
    } else {
      console.log(`  [AI PATH] Calling local Qwen via sendLocalAIChatMessage...`);
      try {
        let streamTokens = 0;
        const res = await sendLocalAIChatMessage(
          query,
          [],
          undefined,
          60000,
          (token, acc) => {
            streamTokens++;
          }
        );
        responseText = res.answer;
        console.log(`  [AI PATH] Completed. Stream tokens: ${streamTokens}, Final text length: ${responseText.length} chars`);
      } catch (err: any) {
        console.error(`  [FAIL] sendLocalAIChatMessage threw error:`, err.message);
        failed++;
        continue;
      }
    }

    // Validate using validateLocalAIResponse
    const val = validateLocalAIResponse(responseText, { intent: intentResult.intent });
    if (!val.isValid || !val.cleanedText.trim()) {
      console.error(`  [FAIL] validateLocalAIResponse failed: ${val.error}`);
      failed++;
    } else {
      console.log(`  [PASS] Non-empty valid response (${val.cleanedText.length} chars). Preview: "${val.cleanedText.slice(0, 100).replace(/\n/g, ' ')}..."`);
      passed++;
    }
  }

  console.log("\n==================================================");
  console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${TEST_QUERIES.length} tests.`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
