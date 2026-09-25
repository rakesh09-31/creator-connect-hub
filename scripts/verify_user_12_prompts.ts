import { processConversationalOmniForgeMessage } from "../src/lib/omniforge/engine";
import { ChatMessage, OmniForgeProject } from "../src/lib/omniforge/types";

const PROMPTS = [
  "Hlo",
  "How are you?",
  "What can you do?",
  "What is a director?",
  "I have an idea for a short film.",
  "Help me develop this idea.",
  "Show me the complete plan.",
  "Find me a director.",
  "Can they also edit?",
  "Create a squad.",
  "What is React?",
  "Return to my film. What is pending?"
];

async function runSequentialTest() {
  console.log("================================================================================");
  console.log("OMNIFORGE 12-PROMPT SEQUENTIAL REAL-WORLD VALIDATION SUITE");
  console.log("================================================================================\n");

  let currentProject: OmniForgeProject | null = null;
  const conversationHistory: ChatMessage[] = [];

  for (let i = 0; i < PROMPTS.length; i++) {
    const prompt = PROMPTS[i];
    console.log(`\n================================================================================`);
    console.log(`STEP ${i + 1} / 12: USER INPUT -> "${prompt}"`);
    console.log(`================================================================================`);

    // Add user message to history
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}-${i}`,
      sender: "user",
      text: prompt,
      timestamp: new Date().toISOString()
    };
    conversationHistory.push(userMsg);

    const startTime = Date.now();
    const response = await processConversationalOmniForgeMessage(
      prompt,
      currentProject,
      conversationHistory,
      "creator",
      "64b10400-23e9-4080-91f6-aed84a8f95cb"
    );
    const duration = Date.now() - startTime;

    // If an updated project was returned, maintain context
    if (response.updatedProject) {
      currentProject = response.updatedProject;
    }

    // Add AI message to history
    const aiMsg: ChatMessage = {
      id: `ai-${Date.now()}-${i}`,
      sender: "ai",
      text: response.message,
      timestamp: new Date().toISOString(),
      intent: response.intent,
      responseLevel: response.responseLevel,
      roleCard: response.roleCard,
      creatorCards: response.creatorCards,
      confirmationCard: response.confirmationCard,
      suggestedFollowUps: response.suggestedFollowUps
    };
    conversationHistory.push(aiMsg);

    console.log(`CLASSIFIED INTENT: ${response.intent}`);
    console.log(`RESPONSE LEVEL:   ${response.responseLevel}`);
    console.log(`EXECUTION TIME:   ${duration}ms`);
    console.log(`ACTIVE PROJECT:   ${currentProject ? currentProject.title : "(None)"}`);
    console.log(`ATTACHMENTS:      roleCard=${!!response.roleCard}, creatorCards=${response.creatorCards?.length || 0}, confirmCard=${!!response.confirmationCard}`);
    console.log(`--------------------------------------------------------------------------------`);
    console.log(`ASSISTANT REPLY:\n${response.message}`);
    console.log(`--------------------------------------------------------------------------------`);
    if (response.suggestedFollowUps && response.suggestedFollowUps.length > 0) {
      console.log(`SUGGESTED NEXT:   ${response.suggestedFollowUps.join(" | ")}`);
    }
  }

  console.log("\n================================================================================");
  console.log("SEQUENTIAL VALIDATION COMPLETE — ALL 12 PROMPTS PROCESSED SUCCESSFULLY");
  console.log("================================================================================");
}

runSequentialTest().catch((err) => {
  console.error("FATAL ERROR IN SEQUENTIAL VALIDATION:", err);
  process.exit(1);
});
