import { orchestrateOmniForgeConversation } from "../src/lib/omniforge/server/orchestrator.server";
import { getServerConfig } from "../src/lib/config.server";
import { executeLLMChatCompletion } from "../src/lib/omniforge/server/llm-provider.server";

async function run() {
  console.log("==================================================================");
  console.log("🔍 TESTING OMNIFORGE SERVER-SIDE ORCHESTRATION & GROQ FLOW");
  console.log("==================================================================");

  const cfg = getServerConfig();
  console.log("Configured Provider: Groq");
  console.log("Has API Key:", !!cfg.groqApiKey, "(Length:", cfg.groqApiKey?.length || 0, ")");
  console.log("Configured Model:", cfg.groqModel);

  // 1. Direct LLM completion test
  console.log("\n--- STEP 1: Direct executeLLMChatCompletion with configured model ---");
  const directResult = await executeLLMChatCompletion({
    messages: [{ role: "user", content: "Tell me in 10 words what filmmaking is." }],
  });
  console.log("Success:", directResult.success);
  console.log("Provider:", directResult.provider);
  console.log("Model:", directResult.model);
  console.log("Latency:", directResult.latencyMs, "ms");
  if (directResult.success) {
    console.log("Text response:", directResult.text.slice(0, 100));
  } else {
    console.log("Sanitized Error:", directResult.error);
  }

  // 2. Full Conversation Orchestration Test
  console.log("\n--- STEP 2: Full orchestrateOmniForgeConversation flow ---");
  const orchResult = await orchestrateOmniForgeConversation({
    text: "I want to make a short film.",
    activeProject: null,
    conversationHistory: [],
    userType: "creator",
    userId: "test-user-123",
  });

  console.log("Orchestration Meta:");
  console.log(" - Provider:", orchResult.meta.provider);
  console.log(" - Model:", orchResult.meta.model);
  console.log(" - isRealLLM:", orchResult.meta.isRealLLM);
  console.log(" - Status:", orchResult.meta.status);
  console.log(" - Status Message:", orchResult.meta.statusMessage);
  console.log(" - Fallback Used:", orchResult.meta.fallbackUsed);
  if (orchResult.meta.error) {
    console.log(" - Sanitized Error:", orchResult.meta.error);
  }
  console.log("\nStructured Response Message Excerpt:");
  console.log(orchResult.structuredResponse.message.slice(0, 200) + "...");
  console.log("Follow-up chips:", orchResult.structuredResponse.suggestedFollowUps);

  console.log("\n==================================================================");
  console.log("TEST FINISHED");
  console.log("==================================================================");
}

run().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
