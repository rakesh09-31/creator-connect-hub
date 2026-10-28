import { classifyUserIntent } from '../src/lib/omniforge/intent';

const testPhrases = [
  "Find a cinematographer",
  "Find Cinematographers",
  "Select @vinay",
  "Select vinay",
  "Invite/add @vinay",
  "Invite @vinay",
  "Add @vinay",
  "Add @vinay to team",
  "Add vinay to team",
  "Who is still missing from my film team?",
  "Build my complete film squad."
];

for (const p of testPhrases) {
  const res = classifyUserIntent(p);
  console.log(`"${p}":`);
  console.log(`   intent: ${res.intent}`);
  console.log(`   matching_action: ${res.matching_action}`);
  console.log(`   targetCreatorName: ${res.targetCreatorName}`);
  console.log(`   targetRole: ${res.targetRole}`);
}
