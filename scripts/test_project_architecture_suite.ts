import {
  extractStructuredRequirements,
  deriveRolesFromCapabilities,
  derivePhasesAndTasks,
  generateRequirementsDerivedBlueprint,
  enrichBlueprintWithArchitectureRefinement,
} from "../src/lib/omniforge/requirements-engine";
import { classifyUserIntent } from "../src/lib/omniforge/intent";
import { searchCreatorsDirectory } from "../src/lib/omniforge/matcher";
import { OmniForgeProject, ProjectDomain } from "../src/lib/omniforge/types";

interface TestCase {
  name: string;
  prompt: string;
  expectedDomain: ProjectDomain;
  expectedUsersHint: string;
  expectedTechnicalHint: string;
  disallowedGenericRoles: string[];
  disallowedGenericPhases: string[];
  minPhases: number;
  minRoles: number;
}

const TEST_PROJECTS: TestCase[] = [
  {
    name: "AI-Powered Crop Disease Detection",
    prompt: "I want to build an AI-powered crop disease detection application from leaf photos for farmers.",
    expectedDomain: "AI / ML",
    expectedUsersHint: "farmer",
    expectedTechnicalHint: "vision",
    disallowedGenericRoles: ["Project Lead", "Domain Specialist"],
    disallowedGenericPhases: ["Discovery & Planning", "Execution & Delivery"],
    minPhases: 4,
    minRoles: 4,
  },
  {
    name: "Short Film Production",
    prompt: "I want to make a short film.",
    expectedDomain: "Film",
    expectedUsersHint: "audience",
    expectedTechnicalHint: "camera",
    disallowedGenericRoles: ["Project Lead", "Domain Specialist"],
    disallowedGenericPhases: ["Discovery & Planning", "Execution & Delivery"],
    minPhases: 4,
    minRoles: 4,
  },
  {
    name: "Food Delivery Application",
    prompt: "I want to build a food delivery application.",
    expectedDomain: "Software",
    expectedUsersHint: "consumer",
    expectedTechnicalHint: "backend",
    disallowedGenericRoles: ["Project Lead", "Domain Specialist"],
    disallowedGenericPhases: ["Discovery & Planning", "Execution & Delivery"],
    minPhases: 4,
    minRoles: 4,
  },
  {
    name: "Cybersecurity Platform",
    prompt: "I want to build a cybersecurity platform.",
    expectedDomain: "Cybersecurity",
    expectedUsersHint: "security",
    expectedTechnicalHint: "telemetry",
    disallowedGenericRoles: ["Project Lead", "Domain Specialist"],
    disallowedGenericPhases: ["Discovery & Planning", "Execution & Delivery"],
    minPhases: 4,
    minRoles: 4,
  },
  {
    name: "College Cultural Festival",
    prompt: "I want to organize a college cultural festival.",
    expectedDomain: "Events",
    expectedUsersHint: "student",
    expectedTechnicalHint: "sound",
    disallowedGenericRoles: ["Project Lead", "Domain Specialist"],
    disallowedGenericPhases: ["Discovery & Planning", "Execution & Delivery"],
    minPhases: 4,
    minRoles: 4,
  },
];

async function runTestSuite() {
  console.log("================================================================================");
  console.log("🚀 OMNIFORGE ARCHITECTURAL REGRESSION TEST SUITE");
  console.log("================================================================================\n");

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition: boolean, message: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✅ PASS: ${message}`);
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  for (const tc of TEST_PROJECTS) {
    console.log(`\n--------------------------------------------------------------------------------`);
    console.log(`🧪 TESTING ARCHETYPE: ${tc.name}`);
    console.log(`   Prompt: "${tc.prompt}"`);
    console.log(`--------------------------------------------------------------------------------`);

    // 1. Structured Requirements Extraction & Capability Derivation
    const { requirements: reqs, capabilities: caps } = extractStructuredRequirements(tc.prompt);
    assert(!!reqs.projectGoal && reqs.projectGoal.length > 5, `projectGoal extracted: "${reqs.projectGoal}"`);
    assert(reqs.domain === tc.expectedDomain, `Domain is correctly mapped to: "${reqs.domain}"`);
    assert(
      reqs.targetUsers.toLowerCase().includes(tc.expectedUsersHint.toLowerCase()),
      `Target users extracted accurately: "${reqs.targetUsers}"`
    );
    assert(
      reqs.technicalRequirements.some((t) => t.toLowerCase().includes(tc.expectedTechnicalHint.toLowerCase())),
      `Technical requirements contain expected domain tech: "${tc.expectedTechnicalHint}"`
    );
    assert(reqs.constraints.length >= 2, `Constraints extracted (${reqs.constraints.length} constraints identified)`);
    assert(reqs.expectedDeliverables.length >= 3, `Expected deliverables extracted (${reqs.expectedDeliverables.length} deliverables)`);

    // 2. Capability Extraction & Classification
    assert(caps.length >= 4, `Extracted ${caps.length} capabilities from requirements`);
    const hasRequired = caps.some((c) => c.level === "REQUIRED");
    const hasLikely = caps.some((c) => c.level === "LIKELY");
    const hasOptional = caps.some((c) => c.level === "OPTIONAL");
    assert(hasRequired, "Capabilities classified with REQUIRED tier");
    assert(hasLikely, "Capabilities classified with LIKELY tier");
    assert(hasOptional, "Capabilities classified with OPTIONAL tier");

    // 3. Role Derivation
    const derivedRoles = deriveRolesFromCapabilities(caps, reqs.domain);
    assert(derivedRoles.length >= tc.minRoles, `Derived ${derivedRoles.length} distinct roles (min required: ${tc.minRoles})`);
    
    // Crucial check: Disallow generic 2-role fallback!
    const roleNames = derivedRoles.map((r) => r.roleName);
    const isGenericFallback =
      derivedRoles.length === 2 &&
      roleNames.includes(tc.disallowedGenericRoles[0]) &&
      roleNames.includes(tc.disallowedGenericRoles[1]);
    assert(!isGenericFallback, `Project does NOT use the generic 2-role fallback (${tc.disallowedGenericRoles.join(" & ")})`);

    // Ensure every role has structured properties
    for (const r of derivedRoles) {
      assert(!!r.whyRequired && r.whyRequired.length > 5, `Role "${r.roleName}" has explicit whyRequired rationale`);
      assert(r.responsibilities.length >= 2, `Role "${r.roleName}" has concrete responsibilities list`);
      assert(r.requiredSkills.length >= 1, `Role "${r.roleName}" specifies required technical skills`);
    }

    // 4. Phase & Task Derivation
    const { phases, deliverables, parallelWorkstreams, workflowStages } =
      derivePhasesAndTasks(reqs, caps, derivedRoles, reqs.domain);
    assert(phases.length >= tc.minPhases, `Derived ${phases.length} project-specific stages (min: ${tc.minPhases})`);
    
    const phaseNames = phases.map((p) => p.name);
    const isGenericPhases =
      phases.length === 2 &&
      phaseNames.includes(tc.disallowedGenericPhases[0]) &&
      phaseNames.includes(tc.disallowedGenericPhases[1]);
    assert(!isGenericPhases, `Project does NOT use the generic 2-phase fallback (${tc.disallowedGenericPhases.join(" & ")})`);
    assert(parallelWorkstreams.length >= 1, `Identified ${parallelWorkstreams.length} parallel execution workstreams`);
    assert(workflowStages.length >= 4, `Derived logical workflow pipeline stages (${workflowStages.length} stages)`);

    // 5. Full Blueprint Generation
    const blueprint = generateRequirementsDerivedBlueprint({
      prompt: tc.prompt,
      userId: "test-user-id",
    });

    assert(blueprint.domain === tc.expectedDomain, `Blueprint domain is "${blueprint.domain}"`);
    assert(blueprint.roles.length === derivedRoles.length, `Blueprint roles count (${blueprint.roles.length}) matches derived roles`);
    assert(blueprint.phases.length === phases.length, `Blueprint phases count (${blueprint.phases.length}) matches derived phases`);
    assert(!!blueprint.structuredRequirements, "Blueprint contains structured requirements object");
    assert(!!blueprint.capabilities && blueprint.capabilities.length > 0, "Blueprint contains capabilities matrix");

    // 6. Follow-up Architecture Refinement
    console.log(`   Testing Follow-up: "Build the complete project architecture with all technical and domain roles required."`);
    const initialRoleCount = blueprint.roles.length;
    const initialPhaseCount = blueprint.phases.length;

    const { updatedProject: enriched, replyMessage } = enrichBlueprintWithArchitectureRefinement(
      blueprint,
      "Build the complete project architecture with all technical and domain roles required."
    );
    assert(
      enriched.roles.length >= initialRoleCount,
      `Enriched roles count (${enriched.roles.length}) >= initial (${initialRoleCount})`
    );
    assert(
      enriched.phases.length >= initialPhaseCount,
      `Enriched phases count (${enriched.phases.length}) >= initial (${initialPhaseCount})`
    );
    assert(replyMessage.length > 50, "Enriched blueprint produces detailed architecture response message");

    // 7. Role Search Integration (Searching Creators for Derived Roles)
    console.log(`   Testing Role Search Integration: searching creators for derived roles`);
    const roleToSearch = blueprint.roles[0].roleName;
    const searchRes = await searchCreatorsDirectory({
      targetRole: roleToSearch,
      scope: "BATCH",
      page: 1,
      pageSize: 5,
    });
    // Ensure no fabricated creators: search results must be valid database creators or empty
    assert(Array.isArray(searchRes.creators), `Search for "${roleToSearch}" returned structured array`);
    for (const c of searchRes.creators) {
      assert(!!c.creator.id && !!c.creator.username, `Creator returned (${c.creator.username}) has valid database ID`);
    }
  }

  // 8. Crop Disease Specific Regression Assertions
  console.log(`\n--------------------------------------------------------------------------------`);
  console.log(`🔬 SPECIAL REGRESSION VERIFICATION: CROP DISEASE DETECTION`);
  console.log(`--------------------------------------------------------------------------------`);

  const cropPrompt = "I want to build an AI-powered crop disease detection application from leaf photos for farmers.";
  const cropBp = generateRequirementsDerivedBlueprint({ prompt: cropPrompt });

  const cropRoleNames = cropBp.roles.map((r) => r.roleName);
  console.log(`  Derived Crop Roles:`, cropRoleNames);
  console.log(`  Derived Crop Stages:`, cropBp.phases.map((p) => p.name));

  assert(
    cropRoleNames.some((r) => /ML|Computer Vision|AI/i.test(r)),
    "Crop disease project requires ML / Computer Vision Engineer"
  );
  assert(
    cropRoleNames.some((r) => /Agricultural|Crop Disease|Domain Specialist/i.test(r)),
    "Crop disease project requires Agricultural / Crop Disease Specialist"
  );
  assert(
    cropRoleNames.some((r) => /Data/i.test(r)),
    "Crop disease project requires Data / ML Engineer"
  );
  assert(
    cropBp.phases.length >= 4,
    `Crop disease project has ${cropBp.phases.length} phases (strictly > 2 phases)`
  );
  assert(
    cropBp.roles.length >= 4,
    `Crop disease project has ${cropBp.roles.length} roles (strictly > 2 roles)`
  );

  // Assert intent detection for follow-up
  const followUpPrompt = "Build the complete project architecture with all technical and domain roles required.";
  const fastIntent = classifyUserIntent(followUpPrompt, {
    activeProject: cropBp,
  });
  assert(fastIntent !== null, "Follow-up architecture request is detected by intent engine");
  assert(
    fastIntent?.project_action === "UPDATE_PROJECT" || fastIntent?.intent === "PROJECT_MODIFY",
    `Follow-up routes to project update/modify (got intent: ${fastIntent?.intent}, action: ${fastIntent?.project_action})`
  );

  console.log(`\n================================================================================`);
  console.log(`🎉 ALL ARCHITECTURAL REGRESSION TESTS PASSED! (${passedTests}/${totalTests} assertions)`);
  console.log(`================================================================================\n`);
}

runTestSuite().catch((err) => {
  console.error("Test suite failed:", err);
  process.exit(1);
});
