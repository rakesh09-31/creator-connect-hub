import { processConversationalOmniForgeMessage } from "../src/lib/omniforge/engine";

async function main() {
  const tests = [
    "Can I swap skills for my project?",
    "I know editing but need a cinematographer. Can we exchange work?",
    "I can design the poster if someone helps with my website.",
    "I don't have money to hire someone. Can I collaborate?",
    "What does a director do?",
    "What does a producer do?",
    "What is a Squad?",
    "What is React?",
    "Tell me a joke",
    "Thanks for the help",
    "I have an idea but I don't know what to do next."
  ];

  for (const t of tests) {
    const res = await processConversationalOmniForgeMessage(t, null, [], "creator");
    console.log("--------------------------------------------------");
    console.log(`QUERY: "${t}"`);
    console.log(`INTENT: ${res.intent} | LEVEL: ${res.responseLevel}`);
    console.log(`SWAP CARDS: ${res.skillSwapCards?.length || 0} | CREATOR CARDS: ${res.creatorCards?.length || 0}`);
    console.log(`REPLY:\n${res.message}`);
    console.log(`FOLLOW-UPS: ${res.suggestedFollowUps?.join(" | ")}`);
  }
}

main().catch(console.error);
