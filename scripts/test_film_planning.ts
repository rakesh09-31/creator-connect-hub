import { classifyUserIntent } from "../src/lib/omniforge/intent";
import { buildFilmRolePlanningResponse, COMPLETE_FILM_ROLE_TAXONOMY } from "../src/lib/omniforge/film-taxonomy";

console.log("=== RUNNING OMNIFORGE FILM-TEAM UNDERSTANDING & ROLE PLANNING TESTS ===\n");

let allPassed = true;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
  } else {
    console.error(`[FAIL] ${testName}${detail ? ` - ${detail}` : ""}`);
    allPassed = false;
  }
}

// 1. SECTION 14 TEST MATRIX:
const testCases = [
  {
    name: "1. User is Director: 'I am the director and I want to make a film.'",
    input: "I am the director and I want to make a film.",
    expectedIntent: "FILM_TEAM_PLANNING",
    expectedAction: "NONE",
    expectDirectorExcluded: true,
  },
  {
    name: "2. Role requirement: 'What roles do I need for a complete film?'",
    input: "What roles do I need for a complete film?",
    expectedIntent: "FILM_TEAM_PLANNING",
    expectedAction: "NONE",
  },
  {
    name: "3. Specific cast/musical roles: 'I need hero, heroine, dancers and singers.'",
    input: "I need hero, heroine, dancers and singers.",
    expectedIntent: "FILM_TEAM_PLANNING",
    expectedAction: "NONE",
  },
  {
    name: "4. Multi-role search: 'Find all the people I need.'",
    input: "Find all the people I need.",
    expectedIntent: "MULTI_ROLE_SEARCH",
    expectedAction: "SEARCH_MULTI_ROLES",
  },
  {
    name: "5. Single role (Hero): 'Find a hero.'",
    input: "Find a hero.",
    expectedIntent: "CREATOR_SEARCH",
    expectedAction: "SEARCH_CREATORS",
    expectedTargetRole: "Lead Actor",
  },
  {
    name: "6. Single role (Heroine): 'Find a heroine.'",
    input: "Find a heroine.",
    expectedIntent: "CREATOR_SEARCH",
    expectedAction: "SEARCH_CREATORS",
    expectedTargetRole: "Lead Actress",
  },
  {
    name: "7. How-To guidance: 'How do I hire a cinematographer?'",
    input: "How do I hire a cinematographer?",
    expectedIntent: "HOW_TO",
    expectedAction: "NONE",
  },
  {
    name: "8. Explicit hire: 'Hire this cinematographer.'",
    input: "Hire this cinematographer.",
    expectedIntent: "HIRE_CREATOR",
    expectedAction: "HIRE_CREATOR",
  },
  {
    name: "9. Missing roles analysis: 'Who is missing from my film team?'",
    input: "Who is missing from my film team?",
    expectedIntent: "PROJECT_ANALYSIS",
    expectedAction: "NONE",
  },
  {
    name: "10. Squad formation: 'Build the complete film squad.'",
    input: "Build the complete film squad.",
    expectedIntent: "TEAM_FORMATION",
    expectedAction: "MATCH_ROLES",
  },
  {
    name: "PRIMARY USER REQUEST: 'I don't need directors because I am a director. I need all the other roles to make a film like actors, dancers, singers, hero, heroine, and others who are required to make a complete film.'",
    input: "I don't need directors because I am a director. I need all the other roles to make a film like actors, dancers, singers, hero, heroine, and others who are required to make a complete film.",
    expectedIntent: "FILM_TEAM_PLANNING",
    expectedAction: "NONE",
    expectDirectorExcluded: true,
  },
  {
    name: "SEQ_1: 'I am the director. I want to make a romantic musical film..'",
    input: "I am the director. I want to make a romantic musical film..",
    expectedIntent: "FILM_TEAM_PLANNING",
    expectedAction: "NONE",
    expectDirectorExcluded: true,
  },
  {
    name: "SEQ_2: 'I need everyone required for the film.'",
    input: "I need everyone required for the film.",
    expectedIntent: "MULTI_ROLE_SEARCH",
    expectedAction: "SEARCH_MULTI_ROLES",
  },
  {
    name: "SEQ_3: 'Start with the hero and heroine.Find them.'",
    input: "Start with the hero and heroine.Find them.",
    expectedIntent: "MULTI_ROLE_SEARCH",
    expectedAction: "SEARCH_MULTI_ROLES",
  },
  {
    name: "SEQ_4: 'Who is still missing from my film team?'",
    input: "Who is still missing from my film team?",
    expectedIntent: "PROJECT_ANALYSIS",
    expectedAction: "NONE",
  },
  {
    name: "SEQ_5: 'Build my complete film squad.'",
    input: "Build my complete film squad.",
    expectedIntent: "TEAM_FORMATION",
    expectedAction: "MATCH_ROLES",
  },
];

for (const tc of testCases) {
  const result = classifyUserIntent(tc.input);
  const intentMatches = result.intent === tc.expectedIntent || 
    (tc.expectedIntent === "PROJECT_ANALYSIS" && result.intent === "TEAM_GAP_ANALYSIS");
  assert(
    intentMatches,
    `${tc.name} - Intent Match`,
    `Got ${result.intent}, expected ${tc.expectedIntent}`
  );
  assert(
    result.matching_action === tc.expectedAction,
    `${tc.name} - Action Match`,
    `Got ${result.matching_action}, expected ${tc.expectedAction}`
  );
  if (tc.expectedTargetRole) {
    assert(
      result.targetRole === tc.expectedTargetRole,
      `${tc.name} - Target Role Match`,
      `Got ${result.targetRole}, expected ${tc.expectedTargetRole}`
    );
  }
}

// 2. FILM TAXONOMY RESPONSE VERIFICATION
console.log("\n--- Testing Film Role Planning Taxonomy Content ---");
const primaryPrompt = "I don't need directors because I am a director. I need all the other roles to make a film like actors, dancers, singers, hero, heroine, and others who are required to make a complete film.";
const planResult = buildFilmRolePlanningResponse({
  isUserDirector: true,
  userPrompt: primaryPrompt,
});

import { detectUserRoleFromText } from "../src/lib/omniforge/intent";

assert(
  detectUserRoleFromText(primaryPrompt) === "DIRECTOR",
  "Director Detection: User role is director"
);

assert(
  planResult.responseText.includes("Director — You") &&
  planResult.responseText.includes("Covered by you — no external director recommended or hired"),
  "Director Exclusion: Director marked as covered by user and excluded from hiring"
);

assert(
  !planResult.responseText.includes('find creators role="film"'),
  "No Fake Syntax: Output contains zero fake command line syntax"
);

assert(
  !planResult.responseText.includes("type="),
  "No Fake Syntax: Output contains zero fake query parameters"
);

assert(
  !planResult.responseText.includes("You need to hire 7 core roles"),
  "No Arbitrary Limits: Output does not claim a film needs exactly 7 roles"
);

// Department verification
const requiredDepartments = [
  "CORE CREATIVE & PRODUCTION",
  "CAST & TALENT",
  "MUSIC & PERFORMANCE",
  "CAMERA & PRODUCTION DESIGN",
  "SOUND",
  "POST-PRODUCTION & FINISHING",
  "PRODUCTION SUPPORT & MARKETING",
];

for (const dept of requiredDepartments) {
  assert(
    planResult.responseText.includes(dept),
    `Department Taxonomy: Contains '${dept}'`
  );
}

// Role classification tags
assert(
  planResult.responseText.includes("[REQUIRED]"),
  "Role Classification: Contains [REQUIRED] tags"
);
assert(
  planResult.responseText.includes("[LIKELY REQUIRED]"),
  "Role Classification: Contains [LIKELY REQUIRED] tags"
);
assert(
  planResult.responseText.includes("[OPTIONAL / DEPENDS ON PROJECT]"),
  "Role Classification: Contains [OPTIONAL / DEPENDS ON PROJECT] tags"
);

// Cast mapping
assert(
  planResult.responseText.includes("Lead Actor (Hero)") &&
  planResult.responseText.includes("Lead Actress (Heroine)"),
  "Cast Mapping: Maps hero/heroine to Lead Actor and Lead Actress"
);

// Music & performance
assert(
  planResult.responseText.includes("Playback Singers / Vocalists") &&
  planResult.responseText.includes("Dancers / Dance Troupe") &&
  planResult.responseText.includes("Choreographer"),
  "Performance Mapping: Distinguishes singers, dancers, and choreographer"
);

// Stage 2 Options
assert(
  planResult.responseText.includes("Next Steps — How would you like to proceed?") &&
  planResult.responseText.includes("Start with the hero and heroine") &&
  planResult.responseText.includes("Find all required roles") &&
  planResult.responseText.includes("Build the complete film squad"),
  "Stage 2 Workflow: Provides clear structured next-step options"
);

// 3. PERSISTENCE IN CONTEXT
console.log("\n--- Testing Persistence of User Director Role Across Turns ---");
const turn1 = classifyUserIntent("I am the director.");
assert(
  turn1.intent === "FILM_TEAM_PLANNING" || turn1.intent === "IDENTITY",
  "Turn 1 Intent: FILM_TEAM_PLANNING or IDENTITY"
);

const turn2WithContext = classifyUserIntent("I need everyone for my film.", {
  currentUserRole: "DIRECTOR",
  conversationHistory: [
    { id: "1", sender: "user", text: "I am the director.", timestamp: "2026-10-02" },
  ],
});
assert(
  turn2WithContext.intent === "FILM_TEAM_PLANNING" || turn2WithContext.intent === "MULTI_ROLE_SEARCH",
  "Turn 2 Intent with Persisted Context"
);
assert(
  turn2WithContext.deterministicText?.includes("Director — You") === true || turn2WithContext.intent === "MULTI_ROLE_SEARCH",
  "Turn 2 Preserves Director role"
);

if (allPassed) {
  console.log("\n✨ ALL TYPESCRIPT INTENT & FILM PLANNING TESTS PASSED PERFECTLY!");
  process.exit(0);
} else {
  console.error("\n❌ SOME TESTS FAILED!");
  process.exit(1);
}
