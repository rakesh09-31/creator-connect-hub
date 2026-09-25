import { processConversationalOmniForgeMessage } from "../src/lib/omniforge/engine";
import { createInitialConversationState } from "../src/lib/omniforge/conversation-state";
import { ChatMessage, ConversationState } from "../src/lib/omniforge/types";

async function runTests() {
  console.log("==================================================");
  console.log("RUNNING OMNIFORGE CONVERSATION SYSTEM VERIFICATION");
  console.log("==================================================\n");

  let allPassed = true;

  // ----------------------------------------------------
  // TEST 1: Actor recommendation
  // ----------------------------------------------------
  console.log("--- TEST 1: Actor Recommendation Flow ---");
  {
    let history: ChatMessage[] = [];
    let state: ConversationState = createInitialConversationState();

    // Turn 1
    const t1Msg = "I need an actor for my short film. Can you suggest the best?";
    history.push({ id: "1", sender: "user", text: t1Msg, timestamp: new Date().toISOString() });
    const r1 = await processConversationalOmniForgeMessage(t1Msg, null, history, "creator", "test-user", state);
    state = r1.conversationState!;
    history.push({ id: "2", sender: "ai", text: r1.message, timestamp: new Date().toISOString(), suggestedFollowUps: r1.suggestedFollowUps });

    console.log("T1 User:", t1Msg);
    console.log("T1 AI:", r1.message);
    console.log("T1 Stage:", state.stage, "| Area:", state.investigationArea);
    console.log("T1 Suggestions:", r1.suggestedFollowUps);

    const t1Passed =
      state.investigationArea === "casting" &&
      !r1.message.includes("What are you thinking of creating") &&
      (r1.message.toLowerCase().includes("actor") || r1.message.toLowerCase().includes("lead") || r1.message.toLowerCase().includes("character"));

    if (!t1Passed) {
      console.error("FAIL: Turn 1 did not acknowledge casting or asked generic question.");
      allPassed = false;
    } else {
      console.log("PASS: Turn 1 acknowledged casting request and asked relevant casting question.");
    }

    // Turn 2
    const t2Msg = "I need a male lead actor.";
    history.push({ id: "3", sender: "user", text: t2Msg, timestamp: new Date().toISOString() });
    const r2 = await processConversationalOmniForgeMessage(t2Msg, null, history, "creator", "test-user", state);
    state = r2.conversationState!;
    history.push({ id: "4", sender: "ai", text: r2.message, timestamp: new Date().toISOString() });

    console.log("\nT2 User:", t2Msg);
    console.log("T2 AI:", r2.message);
    console.log("T2 Stage:", state.stage, "| Role:", state.targetRole, "| Gender:", state.requirements.gender);
    console.log("T2 Suggestions:", r2.suggestedFollowUps);

    const t2Passed =
      state.stage !== "GENERAL_CHAT" &&
      !r2.message.includes("What are you thinking of creating") &&
      (r2.message.toLowerCase().includes("age") || r2.message.toLowerCase().includes("language") || r2.message.toLowerCase().includes("location") || r2.creatorCards);

    if (!t2Passed) {
      console.error("FAIL: Turn 2 restarted flow or did not ask missing casting requirement.");
      allPassed = false;
    } else {
      console.log("PASS: Turn 2 progressed without restarting and asked missing requirement (age/language/location).");
    }
  }

  // ----------------------------------------------------
  // TEST 2: Existing short film idea
  // ----------------------------------------------------
  console.log("\n--- TEST 2: Existing Short Film Idea Flow ---");
  {
    let history: ChatMessage[] = [];
    let state: ConversationState = createInitialConversationState();

    const t1Msg = "I have an idea for a short film.";
    history.push({ id: "1", sender: "user", text: t1Msg, timestamp: new Date().toISOString() });
    const r1 = await processConversationalOmniForgeMessage(t1Msg, null, history, "creator", "test-user", state);
    state = r1.conversationState!;
    history.push({ id: "2", sender: "ai", text: r1.message, timestamp: new Date().toISOString() });

    console.log("T1 User:", t1Msg);
    console.log("T1 AI:", r1.message);
    console.log("T1 Stage:", state.stage, "| Project Type:", state.projectType);

    const t1Passed =
      state.projectType === "Short Film" &&
      (r1.message.toLowerCase().includes("story") || r1.message.toLowerCase().includes("concept") || r1.message.toLowerCase().includes("genre"));

    if (!t1Passed) {
      console.error("FAIL: Turn 1 did not ask about story/concept/genre.");
      allPassed = false;
    } else {
      console.log("PASS: Turn 1 recognized short film and asked about story/genre.");
    }

    const t2Msg = "It is a suspense thriller about a missing student.";
    history.push({ id: "3", sender: "user", text: t2Msg, timestamp: new Date().toISOString() });
    const r2 = await processConversationalOmniForgeMessage(t2Msg, null, history, "creator", "test-user", state);
    state = r2.conversationState!;
    history.push({ id: "4", sender: "ai", text: r2.message, timestamp: new Date().toISOString() });

    console.log("\nT2 User:", t2Msg);
    console.log("T2 AI:", r2.message);
    console.log("T2 Stage:", state.stage, "| Description:", state.projectDescription);

    const t2Passed =
      state.stage === "REQUIREMENTS_INVESTIGATION" &&
      (r2.message.toLowerCase().includes("duration") || r2.message.toLowerCase().includes("script") || r2.message.toLowerCase().includes("shoot") || r2.message.toLowerCase().includes("cast") || r2.message.toLowerCase().includes("crew") || r2.message.toLowerCase().includes("thriller"));

    if (!t2Passed) {
      console.error("FAIL: Turn 2 did not acknowledge thriller/missing student or progress investigation.");
      allPassed = false;
    } else {
      console.log("PASS: Turn 2 acknowledged story and asked follow-up on duration/script/cast.");
    }
  }

  // ----------------------------------------------------
  // TEST 3: Direct question
  // ----------------------------------------------------
  console.log("\n--- TEST 3: Direct Question ---");
  {
    let history: ChatMessage[] = [];
    let state: ConversationState = createInitialConversationState();

    const t1Msg = "What does a film director do?";
    history.push({ id: "1", sender: "user", text: t1Msg, timestamp: new Date().toISOString() });
    const r1 = await processConversationalOmniForgeMessage(t1Msg, null, history, "creator", "test-user", state);
    state = r1.conversationState!;

    console.log("User:", t1Msg);
    console.log("AI:", r1.message);
    console.log("Stage:", state.stage, "| Updated Project:", r1.updatedProject ? "Yes" : "No");

    const t1Passed =
      !r1.updatedProject &&
      state.stage === "GENERAL_CHAT" &&
      (r1.message.toLowerCase().includes("director") && (r1.message.toLowerCase().includes("creative") || r1.message.toLowerCase().includes("vision") || r1.message.toLowerCase().includes("actors")));

    if (!t1Passed) {
      console.error("FAIL: Direct question launched project creation or gave non-informational response.");
      allPassed = false;
    } else {
      console.log("PASS: Answered direct question clearly without launching project discovery.");
    }
  }

  // ----------------------------------------------------
  // TEST 4: Website creation
  // ----------------------------------------------------
  console.log("\n--- TEST 4: Website Creation ---");
  {
    let history: ChatMessage[] = [];
    let state: ConversationState = createInitialConversationState();

    const t1Msg = "I want to build a website for my college club.";
    history.push({ id: "1", sender: "user", text: t1Msg, timestamp: new Date().toISOString() });
    const r1 = await processConversationalOmniForgeMessage(t1Msg, null, history, "creator", "test-user", state);
    state = r1.conversationState!;

    console.log("User:", t1Msg);
    console.log("AI:", r1.message);
    console.log("Stage:", state.stage, "| Project Type:", state.projectType);

    const t1Passed =
      (state.projectType === "Website" || state.projectType === "Web Application") &&
      (r1.message.toLowerCase().includes("feature") || r1.message.toLowerCase().includes("events") || r1.message.toLowerCase().includes("members") || r1.message.toLowerCase().includes("registration"));

    if (!t1Passed) {
      console.error("FAIL: Did not recognize college club website or ask relevant feature questions.");
      allPassed = false;
    } else {
      console.log("PASS: Recognized college club website and investigated key features.");
    }
  }

  // ----------------------------------------------------
  // TEST 5: Context retention
  // ----------------------------------------------------
  console.log("\n--- TEST 5: Context Retention ---");
  {
    let history: ChatMessage[] = [];
    let state: ConversationState = createInitialConversationState();

    const t1Msg = "I need an actor for a Telugu short film.";
    history.push({ id: "1", sender: "user", text: t1Msg, timestamp: new Date().toISOString() });
    const r1 = await processConversationalOmniForgeMessage(t1Msg, null, history, "creator", "test-user", state);
    state = r1.conversationState!;
    history.push({ id: "2", sender: "ai", text: r1.message, timestamp: new Date().toISOString() });

    console.log("T1 User:", t1Msg);
    console.log("T1 Language remembered:", state.requirements.language);

    const t2Msg = "I need someone aged 20–25.";
    history.push({ id: "3", sender: "user", text: t2Msg, timestamp: new Date().toISOString() });
    const r2 = await processConversationalOmniForgeMessage(t2Msg, null, history, "creator", "test-user", state);
    state = r2.conversationState!;
    history.push({ id: "4", sender: "ai", text: r2.message, timestamp: new Date().toISOString() });

    console.log("T2 User:", t2Msg);
    console.log("T2 AI:", r2.message);
    console.log("T2 Language:", state.requirements.language, "| Age:", state.requirements.ageRange);
    console.log("T2 Matched Creators Count:", r2.creatorCards ? r2.creatorCards.length : 0);

    const t2Passed =
      state.requirements.language === "Telugu" &&
      (state.requirements.ageRange === "20-25" || (state.requirements.ageRange?.includes("20") && state.requirements.ageRange?.includes("25"))) &&
      !r2.message.toLowerCase().includes("which language do you") &&
      !r2.message.toLowerCase().includes("what age range do you");

    if (!t2Passed) {
      console.error("FAIL: Context lost; re-asked language or age, or didn't retain entities.");
      allPassed = false;
    } else {
      console.log("PASS: Retained both Telugu language and 20-25 age range without re-asking.");
    }
  }

  // ----------------------------------------------------
  // TEST 6: Interactive suggestions
  // ----------------------------------------------------
  console.log("\n--- TEST 6: Suggestion Interaction ---");
  {
    let history: ChatMessage[] = [];
    let state: ConversationState = createInitialConversationState();

    const t1Msg = "I need an actor for my short film.";
    history.push({ id: "1", sender: "user", text: t1Msg, timestamp: new Date().toISOString() });
    const r1 = await processConversationalOmniForgeMessage(t1Msg, null, history, "creator", "test-user", state);
    state = r1.conversationState!;
    history.push({ id: "2", sender: "ai", text: r1.message, timestamp: new Date().toISOString(), suggestedFollowUps: r1.suggestedFollowUps });

    console.log("T1 AI Suggestions:", r1.suggestedFollowUps);

    // Simulate clicking "Lead actor" suggestion
    const clickedSuggestion = "Lead actor";
    history.push({ id: "3", sender: "user", text: clickedSuggestion, timestamp: new Date().toISOString() });
    const r2 = await processConversationalOmniForgeMessage(clickedSuggestion, null, history, "creator", "test-user", state);
    state = r2.conversationState!;

    console.log("Clicked Suggestion:", clickedSuggestion);
    console.log("T2 AI Response:", r2.message);
    console.log("T2 New Suggestions:", r2.suggestedFollowUps);
    console.log("T2 Role in State:", state.targetRole);

    const t6Passed =
      (state.targetRole === "Lead Actor" || state.requirements.roleType?.toLowerCase().includes("lead")) &&
      r2.message.toLowerCase().includes("age") &&
      r2.suggestedFollowUps && r2.suggestedFollowUps.some(s => s.includes("18") || s.includes("25") || s.includes("35"));

    if (!t6Passed) {
      console.error("FAIL: Suggestion click did not advance conversation or update state.");
      allPassed = false;
    } else {
      console.log("PASS: Suggestion click updated state to Lead Actor and served dynamic age suggestions.");
    }
  }

  console.log("\n==================================================");
  if (allPassed) {
    console.log("ALL 6 CONVERSATION SCENARIO TESTS PASSED SUCCESSFULLY!");
  } else {
    console.error("ONE OR MORE TESTS FAILED.");
    process.exit(1);
  }
  console.log("==================================================");
}

runTests().catch((err) => {
  console.error("Fatal error running tests:", err);
  process.exit(1);
});
