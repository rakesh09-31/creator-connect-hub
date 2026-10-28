import { classifyUserIntent, isDeterministicIntent } from "../src/lib/omniforge/intent.ts";

for (const q of [
  "What is stress?",
  "What is artificial intelligence?",
  "What is motivation?",
  "Explain DNS.",
  "Explain blockchain simply.",
  "How does Python work?",
  "How can I learn Python?",
  "How do I hire a creator?",
  "Find performers."
]) {
  const res = classifyUserIntent(q);
  const isFast = isDeterministicIntent(res.intent, Boolean(res.deterministicText));
  console.log(`Query: "${q}" -> Intent: ${res.intent} | hasDetText: ${Boolean(res.deterministicText)} | isFastAction: ${isFast}`);
}
