import { classifyUserIntent, extractAddCreatorInfo } from "../src/lib/omniforge/intent";

const tests = [
  "Find a cinematographer",
  "Select @vinay",
  "Invite @vinay",
  "Invite/add @vinay",
  "Add @vinay to team",
  "Who is still missing from my film team?",
  "Who is still missing?",
  "Build my complete film squad",
];

console.log("--- Testing Intent Extraction & Classification ---");
for (const t of tests) {
  const addInfo = extractAddCreatorInfo(t);
  const result = classifyUserIntent(t, { currentUserRole: "DIRECTOR" });
  console.log(`Query: "${t}"`);
  console.log(`  AddCreatorInfo:`, addInfo);
  console.log(`  Intent: ${result.intent}, MatchingAction: ${result.matching_action}, TargetCreator: ${result.targetCreatorName}`);
}
