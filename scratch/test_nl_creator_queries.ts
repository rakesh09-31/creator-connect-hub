import { classifyUserIntent, isCreatorSearchQuery } from "../src/lib/omniforge/intent.ts";

const queries = [
  "Search the best video editor for my YouTube channel",
  "Find the best video editor for my YouTube channel",
  "Search for a video editor",
  "I need a video editor for my YouTube channel",
  "Can you find me a good editor?",
  "Find someone who can edit my YouTube videos",
  "I need an editor for my channel",
  "Show me video editors",
  "Who can edit my videos?",
  "Find a cinematographer for my short film",
  "I need a sound engineer",
  "Find performers for my festival",
  // HOW_TO queries:
  "How can I find a good YouTube video editor?",
  "Where can I hire a video editor?",
  "What should I look for in a YouTube editor?",
  "How do I recruit an editor?",
  "What skills should a YouTube editor have?",
  // Definition query:
  "What is a video editor?"
];

console.log("==================================================");
console.log("TESTING NATURAL-LANGUAGE CREATOR SEARCH ROUTING");
console.log("==================================================");

for (const q of queries) {
  const isSearch = isCreatorSearchQuery(q);
  const res = classifyUserIntent(q);
  console.log(`\nQuery: "${q}"`);
  console.log(`  isCreatorSearchQuery: ${isSearch}`);
  console.log(`  intent: ${res.intent} | targetRole: ${res.targetRole} | action: ${res.matching_action}`);
}
