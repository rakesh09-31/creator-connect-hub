import { inspectLLMProviderConfiguration, executeLLMChatCompletion } from "../src/lib/omniforge/server/llm-provider.server";
import { orchestrateOmniForgeConversation } from "../src/lib/omniforge/server/orchestrator.server";

async function main() {
  const config = inspectLLMProviderConfiguration();
  console.log("=== OmniForge Real LLM Diagnostic ===");
  console.log("Active Provider:", config.provider);
  console.log("Active Model:", config.model);
  console.log("API Key Present:", config.hasKey);
  console.log("Status:", config.status);
  console.log("Message:", config.statusMessage);

  if (!config.hasKey) {
    console.log("\n⚠️ No live cloud LLM key is currently set in environment.");
    console.log("To test live cloud inference, run:");
    console.log("  $env:GROQ_API_KEY='gsk_your_key'; npx tsx scripts/test_live_llm_if_key.ts");
    return;
  }

  console.log("\n🚀 Testing live cloud inference with active provider:", config.provider);
  const startTime = Date.now();
  const testRes = await executeLLMChatCompletion({
    messages: [
      { role: "system", content: "You are OmniForge AI. Be concise and practical." },
      { role: "user", content: "Explain cinematography in 2 sentences." },
    ],
    temperature: 0.3,
    maxTokens: 150,
  });

  console.log("Call Success:", testRes.success);
  console.log("Latency:", Date.now() - startTime, "ms");
  console.log("Tokens Used:", testRes.tokensUsed);
  console.log("Output Text:\n" + testRes.text);
}

main().catch(console.error);
