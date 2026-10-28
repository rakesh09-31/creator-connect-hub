import { classifyUserIntent, isDeterministicIntent } from "../src/lib/omniforge/intent";

interface TestCase {
  id: string;
  query: string;
  expectedIntent: string;
  expectedAction: string; // matching_action
  expectedProjectAction?: string;
  expectFastPath: boolean;
  disallowedChips?: string[];
  requiredChips?: string[];
  expectedTargetRole?: string;
}

const testCases: TestCase[] = [
  // ==========================================
  // SECTION 9: EXACT TEST MATRIX (A to N)
  // ==========================================
  {
    id: "Test A",
    query: "what is your name?",
    expectedIntent: "IDENTITY",
    expectedAction: "NONE",
    expectFastPath: true,
  },
  {
    id: "Test B",
    query: "who are you?",
    expectedIntent: "IDENTITY",
    expectedAction: "NONE",
    expectFastPath: true,
  },
  {
    id: "Test C",
    query: "what can you do?",
    expectedIntent: "CAPABILITY_QUERY",
    expectedAction: "NONE",
    expectFastPath: true,
  },
  {
    id: "Test D",
    query: "how do I hire a creator?",
    expectedIntent: "HOW_TO",
    expectedAction: "NONE",
    expectFastPath: true,
    disallowedChips: ["Send Offer", "Review Terms"],
    requiredChips: ["Show Hiring Steps", "Explain Creator Matching"],
  },
  {
    id: "Test E",
    query: "can you explain how to hire a creator?",
    expectedIntent: "HOW_TO",
    expectedAction: "NONE",
    expectFastPath: true,
    disallowedChips: ["Send Offer", "Review Terms"],
  },
  {
    id: "Test F",
    query: "explain the steps to hire a creator",
    expectedIntent: "HOW_TO",
    expectedAction: "NONE",
    expectFastPath: true,
    disallowedChips: ["Send Offer", "Review Terms"],
  },
  {
    id: "Test G",
    query: "what is the process for hiring a creator?",
    expectedIntent: "HOW_TO",
    expectedAction: "NONE",
    expectFastPath: true,
    disallowedChips: ["Send Offer", "Review Terms"],
  },
  {
    id: "Test H",
    query: "hire this creator",
    expectedIntent: "HIRE_CREATOR",
    expectedAction: "HIRE_CREATOR",
    expectFastPath: true,
    requiredChips: ["Send Offer", "Review Terms"],
    expectedTargetRole: "this creator",
  },
  {
    id: "Test I",
    query: "hire @ramu",
    expectedIntent: "HIRE_CREATOR",
    expectedAction: "HIRE_CREATOR",
    expectFastPath: true,
    requiredChips: ["Send Offer", "Review Terms"],
    expectedTargetRole: "@ramu",
  },
  {
    id: "Test J",
    query: "send an offer to @ramu",
    expectedIntent: "HIRE_CREATOR",
    expectedAction: "HIRE_CREATOR",
    expectFastPath: true,
    requiredChips: ["Send Offer", "Review Terms"],
    expectedTargetRole: "@ramu",
  },
  {
    id: "Test K",
    query: "how do I invite a creator?",
    expectedIntent: "HOW_TO",
    expectedAction: "NONE",
    expectFastPath: true,
    disallowedChips: ["Send Invitation"],
  },
  {
    id: "Test L",
    query: "invite this creator",
    expectedIntent: "INVITE_CREATOR",
    expectedAction: "INVITE_CREATOR",
    expectFastPath: true,
    requiredChips: ["Send Invitation"],
    expectedTargetRole: "this creator",
  },
  {
    id: "Test M",
    query: "how do I hire a squad?",
    expectedIntent: "HOW_TO",
    expectedAction: "NONE",
    expectFastPath: true,
    disallowedChips: ["Confirm Squad Hire"],
  },
  {
    id: "Test N",
    query: "hire this squad",
    expectedIntent: "HIRE_SQUAD",
    expectedAction: "HIRE_SQUAD",
    expectFastPath: true,
    requiredChips: ["Confirm Squad Hire"],
  },

  // ==========================================
  // SECTION 10: REGRESSION TEST EXPANSION
  // ==========================================
  // HOW_TO vs HIRE_CREATOR
  {
    id: "Bug 2 Reproduction",
    query: "can you explain how to hire a creator explain the steps",
    expectedIntent: "HOW_TO",
    expectedAction: "NONE",
    expectFastPath: true,
    disallowedChips: ["Send Offer", "Review Terms"],
    requiredChips: ["Show Hiring Steps", "Explain Creator Matching"],
  },
  {
    id: "Regress: Tell me how hiring works",
    query: "tell me how hiring a creator works",
    expectedIntent: "HOW_TO",
    expectedAction: "NONE",
    expectFastPath: true,
    disallowedChips: ["Send Offer", "Review Terms"],
  },
  {
    id: "Regress: How can I hire",
    query: "how can I hire a creator?",
    expectedIntent: "HOW_TO",
    expectedAction: "NONE",
    expectFastPath: true,
    disallowedChips: ["Send Offer", "Review Terms"],
  },
  {
    id: "Regress: Explain creator hiring",
    query: "explain creator hiring",
    expectedIntent: "HOW_TO",
    expectedAction: "NONE",
    expectFastPath: true,
    disallowedChips: ["Send Offer", "Review Terms"],
  },
  {
    id: "Regress: What does hiring involve",
    query: "what does hiring a creator involve?",
    expectedIntent: "HOW_TO",
    expectedAction: "NONE",
    expectFastPath: true,
    disallowedChips: ["Send Offer", "Review Terms"],
  },
  {
    id: "Regress: How does hiring work",
    query: "how does hiring work?",
    expectedIntent: "HOW_TO",
    expectedAction: "NONE",
    expectFastPath: true,
    disallowedChips: ["Send Offer", "Review Terms"],
  },
  {
    id: "Regress: Hire a creator for project (Action)",
    query: "hire a creator for my project",
    expectedIntent: "HIRE_CREATOR",
    expectedAction: "HIRE_CREATOR",
    expectFastPath: true,
    requiredChips: ["Send Offer", "Review Terms"],
  },
  {
    id: "Regress: Send offer to this creator (Action)",
    query: "send an offer to this creator",
    expectedIntent: "HIRE_CREATOR",
    expectedAction: "HIRE_CREATOR",
    expectFastPath: true,
    requiredChips: ["Send Offer", "Review Terms"],
    expectedTargetRole: "this creator",
  },

  // HOW_TO vs INVITE_CREATOR
  {
    id: "Regress: Explain creator invites",
    query: "explain how creator invitations work",
    expectedIntent: "HOW_TO",
    expectedAction: "NONE",
    expectFastPath: true,
  },
  {
    id: "Regress: Send invite to @ramu (Action)",
    query: "send an invitation to @ramu",
    expectedIntent: "INVITE_CREATOR",
    expectedAction: "INVITE_CREATOR",
    expectFastPath: true,
    expectedTargetRole: "@ramu",
  },
  {
    id: "Regress: Send invite to this creator (Action)",
    query: "send an invitation to this creator",
    expectedIntent: "INVITE_CREATOR",
    expectedAction: "INVITE_CREATOR",
    expectFastPath: true,
    expectedTargetRole: "this creator",
  },

  // HOW_TO vs HIRE_SQUAD
  {
    id: "Regress: Explain squad hiring",
    query: "explain how squad hiring works",
    expectedIntent: "HOW_TO",
    expectedAction: "NONE",
    expectFastPath: true,
  },
  {
    id: "Regress: Steps to hire a squad",
    query: "what are the steps to hire a squad?",
    expectedIntent: "HOW_TO",
    expectedAction: "NONE",
    expectFastPath: true,
  },

  // IDENTITY vs GENERAL_QUESTION
  {
    id: "Regress: What are you",
    query: "what are you?",
    expectedIntent: "IDENTITY",
    expectedAction: "NONE",
    expectFastPath: true,
  },
  {
    id: "Regress: Tell me about yourself",
    query: "tell me about yourself",
    expectedIntent: "IDENTITY",
    expectedAction: "NONE",
    expectFastPath: true,
  },
  {
    id: "Regress: What is hiring (Knowledge)",
    query: "What is hiring?",
    expectedIntent: "KNOWLEDGE",
    expectedAction: "NONE",
    expectFastPath: true,
  },
  {
    id: "Regress: What is creator collab (Knowledge)",
    query: "What is creator collaboration?",
    expectedIntent: "KNOWLEDGE",
    expectedAction: "NONE",
    expectFastPath: true,
  },
  {
    id: "Regress: What is a squad (Knowledge)",
    query: "What is a squad?",
    expectedIntent: "KNOWLEDGE",
    expectedAction: "NONE",
    expectFastPath: true,
  },

  // CAPABILITY_QUERY vs ACTION
  {
    id: "Regress: What can you help me with",
    query: "what can you help me with?",
    expectedIntent: "CAPABILITY_QUERY",
    expectedAction: "NONE",
    expectFastPath: true,
  },
  {
    id: "Regress: Can you find creators",
    query: "can you find creators?",
    expectedIntent: "CAPABILITY_QUERY",
    expectedAction: "NONE",
    expectFastPath: true,
  },

  // FOLLOW-UP CONTEXT
  {
    id: "Follow-up: Show me how",
    query: "show me how",
    expectedIntent: "HOW_TO",
    expectedAction: "NONE",
    expectFastPath: true,
  },
  {
    id: "Follow-up: Okay hire @ramu",
    query: "okay hire @ramu",
    expectedIntent: "HIRE_CREATOR",
    expectedAction: "HIRE_CREATOR",
    expectFastPath: true,
    expectedTargetRole: "@ramu",
  },
];

console.log("==================================================");
console.log("OmniForge Intent Classification & Fast-Path Tests");
console.log("==================================================\n");

let passed = 0;
let failed = 0;

for (const t of testCases) {
  const result = classifyUserIntent(t.query);
  const isFast = isDeterministicIntent(result.intent);

  let success = true;
  const failureReasons: string[] = [];

  if (result.intent !== t.expectedIntent) {
    success = false;
    failureReasons.push(`Expected intent '${t.expectedIntent}', got '${result.intent}'`);
  }

  if (result.matching_action !== t.expectedAction) {
    success = false;
    failureReasons.push(`Expected matching_action '${t.expectedAction}', got '${result.matching_action}'`);
  }

  if (isFast !== t.expectFastPath) {
    success = false;
    failureReasons.push(`Expected fast-path=${t.expectFastPath}, got ${isFast}`);
  }

  if (t.expectedTargetRole && result.targetRole !== t.expectedTargetRole) {
    success = false;
    failureReasons.push(`Expected targetRole '${t.expectedTargetRole}', got '${result.targetRole}'`);
  }

  if (t.disallowedChips && result.suggestedChips) {
    for (const chip of t.disallowedChips) {
      if (result.suggestedChips.includes(chip)) {
        success = false;
        failureReasons.push(`Disallowed chip '${chip}' was present in suggestedChips`);
      }
    }
  }

  if (t.requiredChips && result.suggestedChips) {
    for (const chip of t.requiredChips) {
      if (!result.suggestedChips.includes(chip)) {
        success = false;
        failureReasons.push(`Required chip '${chip}' was missing from suggestedChips`);
      }
    }
  }

  if (success) {
    console.log(`[PASS] ${t.id}: "${t.query}" -> ${result.intent} (Fast=${isFast})`);
    passed++;
  } else {
    console.error(`[FAIL] ${t.id}: "${t.query}"`);
    for (const r of failureReasons) {
      console.error(`       -> ${r}`);
    }
    failed++;
  }
}

console.log("\n==================================================");
console.log(`SUMMARY: ${passed} passed, ${failed} failed out of ${testCases.length} total tests.`);
console.log("==================================================");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("ALL INTENT CLASSIFICATION TESTS PASSED PERFECTLY!");
}
