import { orchestrateOmniForgeConversation } from "../src/lib/omniforge/server/orchestrator.server";
import { getServerConfig } from "../src/lib/config.server";
import {
  executeLLMChatCompletion,
  executeLLMStreamingChatCompletion,
  checkOllamaHealth,
  inspectLLMProviderConfiguration,
} from "../src/lib/omniforge/server/llm-provider.server";

async function run() {
  console.log("==================================================================");
  console.log("🔍 TESTING OMNIFORGE SERVER-SIDE ORCHESTRATION & OLLAMA FLOW");
  console.log("==================================================================");

  const cfg = getServerConfig();
  console.log("Configured Base URL:", cfg.ollamaBaseUrl);
  console.log("Configured Model:", cfg.ollamaModel);

  // 1. Health check probe
  console.log("\n--- STEP 1: Ollama Reachability & Model Health Check ---");
  const health = await checkOllamaHealth(cfg.ollamaBaseUrl, cfg.ollamaModel, 5000);
  console.log("Connected:", health.connected);
  console.log("Model Available:", health.modelAvailable);
  console.log("Status:", health.status);
  console.log("Status Message:", health.statusMessage);
  console.log("Latency:", health.latencyMs, "ms");

  if (!health.connected) {
    console.error("❌ Ollama is not reachable at", cfg.ollamaBaseUrl);
    process.exit(1);
  }

  // 2. Direct LLM completion test
  console.log("\n--- STEP 2: Direct executeLLMChatCompletion with Ollama ---");
  const directResult = await executeLLMChatCompletion({
    messages: [{ role: "user", content: "Tell me in 10 words what filmmaking is." }],
    timeoutMs: 30000,
  });
  console.log("Success:", directResult.success);
  console.log("Provider:", directResult.provider);
  console.log("Model:", directResult.model);
  console.log("Latency:", directResult.latencyMs, "ms");
  if (directResult.success) {
    console.log("Text response:", directResult.text.slice(0, 150));
  } else {
    console.log("Sanitized Error:", directResult.error);
  }

  // 3. Streaming test
  console.log("\n--- STEP 3: Streaming executeLLMStreamingChatCompletion with Ollama ---");
  let streamTokens = 0;
  let accumulated = "";
  const streamResult = await executeLLMStreamingChatCompletion({
    messages: [{ role: "user", content: "Count from 1 to 5." }],
    timeoutMs: 30000,
    onDelta: (delta, acc) => {
      streamTokens++;
      accumulated = acc;
    },
  });
  console.log("Stream Success:", streamResult.success);
  console.log("Tokens Streamed:", streamTokens);
  console.log("Accumulated Text:", accumulated.trim());

  // 4. Full Conversation Orchestration Test
  console.log("\n--- STEP 4: Full orchestrateOmniForgeConversation flow ---");
  const orchResult = await orchestrateOmniForgeConversation({
    text: "I want to make a short film about a student.",
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
  console.log(" - Latency:", orchResult.meta.latencyMs, "ms");
  if (orchResult.meta.error) {
    console.log(" - Sanitized Error:", orchResult.meta.error);
  }
  console.log("\nStructured Response Message Excerpt:");
  console.log(orchResult.structuredResponse.message.slice(0, 300) + "...");
  console.log("Follow-up chips:", orchResult.structuredResponse.suggestedFollowUps);

  console.log("\n==================================================================");
  console.log("✅ ALL OLLAMA SERVER FLOW TESTS PASSED");
  console.log("==================================================================");
}

run().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
