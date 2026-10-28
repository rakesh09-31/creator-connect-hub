import { classifyUserIntent } from '../src/lib/omniforge/intent';

function test() {
  const cases = [
    "I am a director. Find all cinematic creators.",
    "find all creators related to cinematic field",
    "Who is still missing?",
    "still who are missing",
    "Find all dancers",
    "Find all choreographers",
    "Build my complete film squad",
    "Build my complete film squad.",
  ];

  for (const c of cases) {
    const res = classifyUserIntent(c);
    console.log(`Query: "${c}"`);
    console.log(`  -> Intent: ${res.intent}`);
    console.log(`  -> Role: ${res.targetRole || res.currentUserRole || 'none'}`);
    console.log(`  -> ExtractedRoles: ${res.extractedRoles?.join(', ') || 'none'}`);
    console.log(`  -> isUserDirector: ${res.isUserDirector}`);
  }
}

test();
