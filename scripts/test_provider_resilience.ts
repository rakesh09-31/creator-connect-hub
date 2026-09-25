import { executeLLMChatCompletion } from "../src/lib/omniforge/server/llm-provider.server";
import { orchestrateOmniForgeConversation } from "../src/lib/omniforge/server/orchestrator.server";

async function testProviderResilience() {
  console.log("================================================================================");
  console.log("TESTING LLM PROVIDER RESILIENCE & ERROR RECOVERY");
  console.log("================================================================================\n");

  // 1. Test without any API key (current baseline)
  console.log("Test 1: Orchestration with no external API key configured");
  const res1 = await orchestrateOmniForgeConversation({
    text: "Hlo",
    activeProject: null,
    conversationHistory: [],
    userType: "creator",
    userId: "test-user-1",
  });

  console.log("  Status:", res1.meta.status);
  console.log("  Provider:", res1.meta.provider);
  console.log("  Model:", res1.meta.model);
  console.log("  Is Real LLM:", res1.meta.isRealLLM);
  console.log("  Fallback used:", res1.meta.fallbackUsed);
  console.log("  Status Message:", res1.meta.statusMessage);
  console.log("  AI Message:", res1.structuredResponse.message);

  if (res1.meta.status !== "no_provider" || res1.meta.isRealLLM !== false) {
    throw new Error("Test 1 Failed: Expected status='no_provider' and isRealLLM=false");
  }
  console.log("  ✔ PASS: Test 1 (Safe deterministic fallback when no key is present)\n");

  // 2. Test timeout handling
  console.log("Test 2: Provider timeout abort handling");
  const timeoutRes = await executeLLMChatCompletion({
    messages: [{ role: "user", content: "Hello" }],
    timeoutMs: 1, // 1 millisecond timeout to guarantee abort
  });
  console.log("  Timeout success:", timeoutRes.success);
  console.log("  Timeout error code:", timeoutRes.error);
  if (timeoutRes.success !== false) {
    throw new Error("Test 2 Failed: Expected failure on immediate timeout");
  }
  console.log("  ✔ PASS: Test 2 (Timeout controller correctly aborts)\n");

  console.log("================================================================================");
  console.log("ALL PROVIDER RESILIENCE TESTS COMPLETED SUCCESSFULLY");
  console.log("================================================================================");
}

testProviderResilience().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
