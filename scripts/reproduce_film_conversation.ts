import { orchestrateOmniForgeConversation } from "../src/lib/omniforge/server/orchestrator.server";
import { ChatMessage, OmniForgeProject } from "../src/lib/omniforge/types";
import { createInitialConversationState } from "../src/lib/omniforge/conversation-state";

async function runSequence() {
  const turns = [
    "I have an idea for a short film.",
    "I have a story, generate the execution plan and find creators.",
    "A suspense thriller about a missing student.",
    "I have a completed script.",
    "Just make the complete plan and find the actors.",
  ];

  let history: ChatMessage[] = [];
  let state = createInitialConversationState();
  let activeProject: OmniForgeProject | null = null;

  for (let i = 0; i < turns.length; i++) {
    const text = turns[i];
    console.log(`\n========================================`);
    console.log(`TURN ${i + 1}: USER -> "${text}"`);
    console.log(`========================================`);

    const userMsg: ChatMessage = {
      id: `u-${i}`,
      sender: "user",
      text,
      timestamp: new Date().toISOString(),
    };
    history.push(userMsg);

    const result = await orchestrateOmniForgeConversation({
      text,
      activeProject,
      conversationHistory: history,
      conversationState: state,
      userType: "client",
      userId: "test-user-123",
    });

    console.log(`[Status: ${result.meta.status} | Provider: ${result.meta.provider} | isRealLLM: ${result.meta.isRealLLM}]`);
    console.log(`AI Response (${result.structuredResponse.message.length} chars):`);
    console.log(result.structuredResponse.message);

    if (result.structuredResponse.creatorCards) {
      console.log(`Creator cards returned:`, result.structuredResponse.creatorCards.length);
    }
    if (result.structuredResponse.updatedProject) {
      console.log(`Project updated: "${result.structuredResponse.updatedProject.title}"`);
      activeProject = result.structuredResponse.updatedProject;
    }
    if (result.structuredResponse.conversationState) {
      state = result.structuredResponse.conversationState;
    }

    const aiMsg: ChatMessage = {
      id: `ai-${i}`,
      sender: "ai",
      text: result.structuredResponse.message,
      timestamp: new Date().toISOString(),
      conversationState: state,
    };
    history.push(aiMsg);
  }
}

runSequence().catch(console.error);
