import { orchestrateOmniForgeConversation } from "../src/lib/omniforge/server/orchestrator.server";
import { executeLLMChatCompletion } from "../src/lib/omniforge/server/llm-provider.server";

async function run() {
  console.log("==================================================================");
  console.log("⚡ TESTING OMNIFORGE WITH ACTIVE ACCOUNT MODEL: qwen/qwen3.8-27b");
  console.log("==================================================================");

  // Set model to the verified active model on this Groq account
  process.env.GROQ_MODEL = "qwen/qwen3.8-27b";

  // 1. Direct LLM completion test
  console.log("\n--- STEP 1: Direct executeLLMChatCompletion with qwen/qwen3.8-27b ---");
  const directResult = await executeLLMChatCompletion({
    messages: [{ role: "user", content: "Tell me in 10 words what filmmaking is." }],
  });
  console.log("Success:", directResult.success);
  console.log("Provider:", directResult.provider);
  console.log("Model:", directResult.model);
  console.log("Latency:", directResult.latencyMs, "ms");
  if (directResult.success) {
    console.log("Text response:", directResult.text.trim());
  } else {
    console.log("Sanitized Error:", directResult.error);
  }

  // 2. Full Conversation Orchestration Test
  console.log("\n--- STEP 2: Full orchestrateOmniForgeConversation flow with live LLM ---");
  const orchResult = await orchestrateOmniForgeConversation({
    text: "I want to make a short film about two astronauts stranded on Mars.",
    activeProject: null,
    conversationHistory: [],
    userType: "creator",
    userId: "test-user-live",
  });

  console.log("Orchestration Meta:");
  console.log(" - Provider:", orchResult.meta.provider);
  console.log(" - Model:", orchResult.meta.model);
  console.log(" - isRealLLM:", orchResult.meta.isRealLLM);
  console.log(" - Status:", orchResult.meta.status);
  console.log(" - Status Message:", orchResult.meta.statusMessage);
  console.log(" - Fallback Used:", orchResult.meta.fallbackUsed);
  console.log(" - Latency:", orchResult.meta.latencyMs, "ms");
  console.log("\nStructured Response Message Excerpt:");
  console.log(orchResult.structuredResponse.message.slice(0, 300) + "...");
  console.log("Follow-up chips:", orchResult.structuredResponse.suggestedFollowUps);

  console.log("\n==================================================================");
  console.log("LIVE TEST FINISHED");
  console.log("==================================================================");
}

run().catch((err) => {
  console.error("Live test execution error:", err);
  process.exit(1);
});
