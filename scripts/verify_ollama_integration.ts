import { handleAIRoute } from "../src/lib/omniforge/server/ai-routes.server";
import { checkOllamaHealth } from "../src/lib/omniforge/server/llm-provider.server";
import { getServerConfig } from "../src/lib/config.server";

async function verify() {
  console.log("==================================================================");
  console.log("🧪 COMPLETE OMNIFORGE OLLAMA PRODUCTION INTEGRATION VERIFICATION");
  console.log("==================================================================");

  const cfg = getServerConfig();
  console.log(`Config: OLLAMA_BASE_URL=${cfg.ollamaBaseUrl}, OLLAMA_MODEL=${cfg.ollamaModel}`);

  // TEST 1: Health check endpoint via handleAIRoute
  console.log("\n[TEST 1] GET /api/health through server route handler");
  const healthReq = new Request("http://localhost:8081/api/health", { method: "GET" });
  const healthRes = await handleAIRoute(healthReq);
  if (!healthRes) {
    throw new Error("handleAIRoute returned null for /api/health");
  }
  const healthJson = await healthRes.json();
  console.log("Health Status:", healthJson.status);
  console.log("Provider:", healthJson.provider);
  console.log("Model:", healthJson.model);
  console.log("Ollama Connected:", healthJson.ollama_connected);
  console.log("Model Available:", healthJson.model_available);
  console.log("Status Message:", healthJson.status_message);

  if (healthJson.provider !== "ollama" || healthJson.model !== "qwen3:4b") {
    throw new Error(`Expected provider ollama and model qwen3:4b, got ${healthJson.provider} / ${healthJson.model}`);
  }
  if (!healthJson.ollama_connected) {
    throw new Error(`Ollama was not reported as connected: ${healthJson.status_message}`);
  }

  // TEST 2: Non-streaming chat endpoint via handleAIRoute
  console.log("\n[TEST 2] POST /api/chat (non-streaming general chat)");
  const chatReq = new Request("http://localhost:8081/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "Explain what an API is in 2 sentences.",
      stream: false,
    }),
  });
  const chatRes = await handleAIRoute(chatReq);
  if (!chatRes) throw new Error("handleAIRoute returned null for /api/chat");
  const chatJson = await chatRes.json();
  console.log("Chat Success:", chatJson.success);
  console.log("Provider:", chatJson.provider);
  console.log("Model:", chatJson.model);
  console.log("Answer Excerpt:", chatJson.answer?.slice(0, 150));
  if (!chatJson.success || !chatJson.answer) {
    throw new Error(`Chat failed: ${JSON.stringify(chatJson)}`);
  }

  // TEST 3: Streaming chat endpoint via handleAIRoute
  console.log("\n[TEST 3] POST /api/chat (streaming SSE)");
  const streamReq = new Request("http://localhost:8081/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "Hello OmniForge!",
      stream: true,
    }),
  });
  const streamRes = await handleAIRoute(streamReq);
  if (!streamRes) throw new Error("handleAIRoute returned null for streaming /api/chat");
  if (!streamRes.body) throw new Error("Streaming response has no body");

  const reader = streamRes.body.getReader();
  const decoder = new TextDecoder();
  let receivedTokens = 0;
  let finalStreamPayload: any = null;
  let sseBuffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    sseBuffer += decoder.decode(value, { stream: true });
    const lines = sseBuffer.split("\n");
    sseBuffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const dataStr = line.slice(5).trim();
      if (!dataStr) continue;
      try {
        const parsed = JSON.parse(dataStr);
        if (parsed.token) receivedTokens++;
        if (parsed.done) finalStreamPayload = parsed;
      } catch {}
    }
  }

  console.log("Stream Tokens Received:", receivedTokens);
  console.log("Final Done Event Success:", finalStreamPayload?.success);
  console.log("Final Model:", finalStreamPayload?.model);
  console.log("Stream Answer Excerpt:", finalStreamPayload?.answer?.slice(0, 100));

  if (!finalStreamPayload?.success) {
    throw new Error("Stream did not complete successfully");
  }

  // TEST 4: Unreachable Ollama Failure Handling (Requirement 8: No silent mock responses)
  console.log("\n[TEST 4] Error Handling: Unreachable host returns accurate error, never silent mock");
  const badHealth = await checkOllamaHealth("http://127.0.0.1:9999", "qwen3:4b", 1000);
  console.log("Unreachable Connected:", badHealth.connected);
  console.log("Unreachable Status:", badHealth.status);
  console.log("Unreachable Error Message:", badHealth.statusMessage);
  if (badHealth.connected) {
    throw new Error("Expected unreachable host to return connected: false");
  }

  console.log("\n==================================================================");
  console.log("🎉 ALL INTEGRATION VERIFICATION TESTS PASSED SUCCESSFULLY!");
  console.log("==================================================================");
}

verify().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
