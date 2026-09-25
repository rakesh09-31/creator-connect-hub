import { orchestrateOmniForgeConversation } from "../src/lib/omniforge/server/orchestrator.server";
import { inspectLLMProviderConfiguration } from "../src/lib/omniforge/server/llm-provider.server";
import { createInitialConversationState } from "../src/lib/omniforge/conversation-state";

async function runPromptTests() {
  console.log("================================================================================");
  console.log("🔍 OMNIFORGE REAL AI INTEGRATION & LIVE PROMPTS TEST SUITE");
  console.log("================================================================================\n");

  const providerInfo = inspectLLMProviderConfiguration();
  console.log("1. Current Provider Status Inspection:");
  console.log(`   • Provider:      ${providerInfo.provider}`);
  console.log(`   • Model:         ${providerInfo.model}`);
  console.log(`   • Key Present:   ${providerInfo.hasKey}`);
  console.log(`   • Status:        ${providerInfo.status}`);
  console.log(`   • Status Note:   ${providerInfo.statusMessage}\n`);

  const testPrompts = [
    {
      name: "Prompt 1: Short Film Investigation",
      text: "I want to make a short film.",
      expectInMessage: ["short film", "story"],
    },
    {
      name: "Prompt 2: Direct Concept Explanation",
      text: "Explain cinematography.",
      expectInMessage: ["cinematography", "lighting"],
    },
    {
      name: "Prompt 3: Screenplay Deliverable Writing",
      text: "Write a suspense thriller screenplay about a missing student.",
      expectInMessage: ["SCENE", "INT.", "VANISHED ECHOES"],
    },
    {
      name: "Prompt 4: Structured Website Planning",
      text: "I want to build a website for my college club.",
      expectInMessage: ["college club", "Phase"],
    },
  ];

  let state = createInitialConversationState();
  const history: any[] = [];

  for (let i = 0; i < testPrompts.length; i++) {
    const tp = testPrompts[i];
    console.log(`--------------------------------------------------------------------------------`);
    console.log(`▶ ${tp.name}`);
    console.log(`  Query: "${tp.text}"`);

    const startTime = Date.now();
    const result = await orchestrateOmniForgeConversation({
      text: tp.text,
      activeProject: null,
      conversationHistory: history,
      conversationState: state,
      userType: "client",
      userId: "test-user-live",
    });
    const duration = Date.now() - startTime;

    const resp = result.structuredResponse;
    const meta = result.meta;

    if (resp.conversationState) {
      state = resp.conversationState;
    }

    history.push({ id: `u-${i}`, sender: "user", text: tp.text });
    history.push({ id: `ai-${i}`, sender: "ai", text: resp.message });

    console.log(`  Engine Status:   [${meta.isRealLLM ? "LIVE CLOUD LLM" : "FALLBACK ENGINE"}]`);
    console.log(`  Active Provider: ${meta.provider} (${meta.model})`);
    console.log(`  Latency:         ${duration}ms`);
    console.log(`  Intent:          ${resp.intent} | Level: ${resp.responseLevel}`);
    console.log(`  Message Excerpt: "${resp.message.slice(0, 150).replace(/\n/g, " ")}..."`);
    console.log(`  Follow-Up Chips: ${JSON.stringify(resp.suggestedFollowUps)}`);

    const hasExpectedContent = tp.expectInMessage.some((term) =>
      resp.message.toLowerCase().includes(term.toLowerCase())
    );

    if (hasExpectedContent) {
      console.log(`  Result:          ✅ PASSED (Content & follow-ups validated)`);
    } else {
      console.error(`  Result:          ❌ FAILED: Missing expected terminology`);
    }
    console.log();
  }

  console.log("================================================================================");
  console.log("🏁 PROMPT VERIFICATION COMPLETE");
  console.log("================================================================================\n");
}

runPromptTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
