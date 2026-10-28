import { classifyUserIntent } from "../src/lib/omniforge/intent";
import { searchCreatorsDirectory, searchClientOpportunities } from "../src/lib/omniforge/matcher";
import { createInitialConversationState, transitionConversationState } from "../src/lib/omniforge/conversation-state";
import { ChatMessage, OmniForgeProject } from "../src/lib/omniforge/types";

async function testScenario() {
  const steps = [
    "I am a director.",
    "I want to make an action comedy thriller.",
    "Find all cinema creators.",
    "Find all heroes.",
    "Find all video editors.",
    "Find all fight masters.",
    "Find all choreographers.",
    "Choose the best hero.",
    "Who is missing?",
    "Prepare the complete film schedule including songs, dance and fights.",
    "Build my complete film squad.",
    "Find clients who need video editors.",
    "Find creators."
  ];

  let state = createInitialConversationState();
  let history: ChatMessage[] = [];
  let activeProject: OmniForgeProject | null = null;

  for (let i = 0; i < steps.length; i++) {
    const text = steps[i];
    console.log(`\n======================================================`);
    console.log(`STEP ${i + 1}: "${text}"`);
    console.log(`======================================================`);

    const intent = classifyUserIntent(text, {
      hasActiveProject: Boolean(activeProject),
      activeProject,
      conversationHistory: history,
      currentUserRole: state.currentUserRole,
      currentUserType: state.currentUserType,
      activeGoal: state.activeGoal,
    });

    console.log(`Intent:`, intent.intent);
    console.log(`Matching action:`, intent.matching_action);
    console.log(`Project action:`, intent.project_action);
    console.log(`Target role:`, intent.targetRole);
    console.log(`Scope:`, intent.scope);
    console.log(`Extracted roles:`, intent.extractedRoles);
    console.log(`Current user role:`, intent.currentUserRole);

    state = transitionConversationState(state, text, history);
    if (intent.currentUserRole) state.currentUserRole = intent.currentUserRole;
    if (intent.currentUserType) state.currentUserType = intent.currentUserType;
    if (intent.activeGoal) state.activeGoal = intent.activeGoal;

    const userMsg: ChatMessage = { id: `u-${i}`, sender: "user", text, timestamp: new Date().toISOString() };
    const aiMsg: ChatMessage = { id: `a-${i}`, sender: "ai", text: intent.deterministicText || "AI response", timestamp: new Date().toISOString() };
    history.push(userMsg, aiMsg);
  }
}

testScenario().catch(console.error);
