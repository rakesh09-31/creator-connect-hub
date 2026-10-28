/**
 * Acceptance Test Suite: Project-Specific Film Crew Planning
 * Tests all 10 scenarios from Section 11:
 * Test A: "I want to make a short film." -> baseline crew + project-dependent specialized roles
 * Test B: "I want to make a romantic musical short film." -> Dancer/Singer/Choreographer/Music roles become project-required
 * Test C: "I want to make an action short film." -> stunt/fight roles become relevant
 * Test D: "I want to make a documentary." -> acting/dance/singer roles NOT required
 * Test E: "Find all dancers." -> search only, does NOT change project requirement
 * Test F: "I need dancers for my film." -> Dancer becomes PROJECT_REQUIRED with reason
 * Test G: "Who is still missing?" -> only currently required roles
 * Test H: "Build my complete film squad." -> dynamic required-role count
 * Test I: Refresh -> project requirements persist
 * Test J: Switch project -> requirements do not leak
 */

import {
  detectFilmGenre,
  parseExplicitRoleRequirementRequest,
  getRoleRequirementInfo,
  RoleRequirementLevel,
} from "../src/lib/omniforge/crew-intelligence";
import {
  calculateFilmTeamStatus,
  buildDynamicMissingRolesResponse,
  buildCompleteFilmRoleMatrixResponse,
  resolveActiveProject,
  reconcileProjectTeamState,
} from "../src/lib/omniforge/team-reconciliation";
import { classifyUserIntent } from "../src/lib/omniforge/intent";
import { generateStructuredBlueprint } from "../src/lib/omniforge/engine-blueprint";
import { OmniForgeProject } from "../src/lib/omniforge/types";

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log("\n=======================================================");
  console.log("RUNNING ACCEPTANCE TESTS: CREW REQUIREMENT INTELLIGENCE");
  console.log("=======================================================\n");

  // TEST A: Generic Short Film
  console.log("TEST A: 'I want to make a short film.'");
  {
    const prompt = "I want to make a short film.";
    const genre = detectFilmGenre(prompt);
    assert(genre === "generic_short_film", `Detected genre is generic_short_film (got: ${genre})`);

    const dancerReq = getRoleRequirementInfo("Dancer", genre);
    assert(
      dancerReq.requirementLevel === "PROJECT_DEPENDENT",
      `Dancer is PROJECT_DEPENDENT for generic short film (got: ${dancerReq.requirementLevel})`
    );

    const singerReq = getRoleRequirementInfo("Lead Singer", genre);
    assert(
      singerReq.requirementLevel === "PROJECT_DEPENDENT",
      `Lead Singer is PROJECT_DEPENDENT for generic short film (got: ${singerReq.requirementLevel})`
    );

    const choroReq = getRoleRequirementInfo("Choreographer", genre);
    assert(
      choroReq.requirementLevel === "PROJECT_DEPENDENT",
      `Choreographer is PROJECT_DEPENDENT for generic short film (got: ${choroReq.requirementLevel})`
    );

    const cineReq = getRoleRequirementInfo("Cinematographer", genre);
    assert(cineReq.requirementLevel === "CORE", `Cinematographer is CORE (got: ${cineReq.requirementLevel})`);

    const editorReq = getRoleRequirementInfo("Video Editor", genre);
    assert(editorReq.requirementLevel === "CORE", `Video Editor is CORE (got: ${editorReq.requirementLevel})`);

    const matrixText = buildCompleteFilmRoleMatrixResponse(null, true, undefined, prompt);
    assert(!matrixText.includes("• **Dancer** `[REQUIRED FOR THIS FILM]`"), "Dancer is NOT marked [REQUIRED FOR THIS FILM]");
    assert(matrixText.includes("• **Dancer** `[PROJECT_DEPENDENT]`"), "Dancer is marked `[PROJECT_DEPENDENT]`");
  }

  // TEST B: Romantic Musical Film
  console.log("\nTEST B: 'I want to make a romantic musical short film.'");
  {
    const prompt = "I want to make a romantic musical short film.";
    const genre = detectFilmGenre(prompt);
    assert(genre === "musical", `Detected genre is musical (got: ${genre})`);

    const dancerReq = getRoleRequirementInfo("Dancer", genre);
    assert(dancerReq.requirementLevel === "PROJECT_REQUIRED", `Dancer is PROJECT_REQUIRED (got: ${dancerReq.requirementLevel})`);

    const singerReq = getRoleRequirementInfo("Lead Singer", genre);
    assert(singerReq.requirementLevel === "PROJECT_REQUIRED", `Lead Singer is PROJECT_REQUIRED (got: ${singerReq.requirementLevel})`);

    const choroReq = getRoleRequirementInfo("Choreographer", genre);
    assert(choroReq.requirementLevel === "PROJECT_REQUIRED", `Choreographer is PROJECT_REQUIRED (got: ${choroReq.requirementLevel})`);

    const composerReq = getRoleRequirementInfo("Music Composer", genre);
    assert(composerReq.requirementLevel === "PROJECT_REQUIRED", `Music Composer is PROJECT_REQUIRED (got: ${composerReq.requirementLevel})`);

    const actorReq = getRoleRequirementInfo("Lead Actor", genre);
    assert(actorReq.requirementLevel === "PROJECT_REQUIRED", `Lead Actor is PROJECT_REQUIRED (got: ${actorReq.requirementLevel})`);

    const actressReq = getRoleRequirementInfo("Lead Actress", genre);
    assert(actressReq.requirementLevel === "PROJECT_REQUIRED", `Lead Actress is PROJECT_REQUIRED (got: ${actressReq.requirementLevel})`);
  }

  // TEST C: Action Short Film
  console.log("\nTEST C: 'I want to make an action short film.'");
  {
    const prompt = "I want to make an action short film.";
    const genre = detectFilmGenre(prompt);
    assert(genre === "action", `Detected genre is action (got: ${genre})`);

    const fightReq = getRoleRequirementInfo("Fight Master", genre);
    assert(fightReq.requirementLevel === "PROJECT_REQUIRED", `Fight Master is PROJECT_REQUIRED (got: ${fightReq.requirementLevel})`);

    const stuntReq = getRoleRequirementInfo("Stunt Coordinator", genre);
    assert(stuntReq.requirementLevel === "PROJECT_REQUIRED", `Stunt Coordinator is PROJECT_REQUIRED (got: ${stuntReq.requirementLevel})`);

    const camOpReq = getRoleRequirementInfo("Camera Operator", genre);
    assert(camOpReq.requirementLevel === "PROJECT_REQUIRED", `Camera Operator is PROJECT_REQUIRED (got: ${camOpReq.requirementLevel})`);

    const dancerReq = getRoleRequirementInfo("Dancer", genre);
    assert(dancerReq.requirementLevel === "PROJECT_DEPENDENT", `Dancer remains PROJECT_DEPENDENT for action (got: ${dancerReq.requirementLevel})`);
  }

  // TEST D: Documentary Film
  console.log("\nTEST D: 'I want to make a documentary.'");
  {
    const prompt = "I want to make a documentary.";
    const genre = detectFilmGenre(prompt);
    assert(genre === "documentary", `Detected genre is documentary (got: ${genre})`);

    const actorReq = getRoleRequirementInfo("Lead Actor", genre);
    assert(actorReq.requirementLevel === "NOT_REQUIRED", `Lead Actor is NOT_REQUIRED for documentary (got: ${actorReq.requirementLevel})`);

    const actressReq = getRoleRequirementInfo("Lead Actress", genre);
    assert(actressReq.requirementLevel === "NOT_REQUIRED", `Lead Actress is NOT_REQUIRED for documentary (got: ${actressReq.requirementLevel})`);

    const dancerReq = getRoleRequirementInfo("Dancer", genre);
    assert(dancerReq.requirementLevel === "NOT_REQUIRED", `Dancer is NOT_REQUIRED for documentary (got: ${dancerReq.requirementLevel})`);

    const singerReq = getRoleRequirementInfo("Lead Singer", genre);
    assert(singerReq.requirementLevel === "NOT_REQUIRED", `Lead Singer is NOT_REQUIRED for documentary (got: ${singerReq.requirementLevel})`);

    const choroReq = getRoleRequirementInfo("Choreographer", genre);
    assert(choroReq.requirementLevel === "NOT_REQUIRED", `Choreographer is NOT_REQUIRED for documentary (got: ${choroReq.requirementLevel})`);

    const cineReq = getRoleRequirementInfo("Cinematographer", genre);
    assert(cineReq.requirementLevel === "CORE", `Cinematographer is CORE for documentary (got: ${cineReq.requirementLevel})`);

    const matrixText = buildCompleteFilmRoleMatrixResponse(null, true, undefined, prompt);
    assert(matrixText.includes("○ **Lead Actor** `[NOT_REQUIRED]`"), "Matrix marks Lead Actor as [NOT_REQUIRED]");
    assert(matrixText.includes("○ **Dancer** `[NOT_REQUIRED]`"), "Matrix marks Dancer as [NOT_REQUIRED]");
  }

  // TEST E: Candidate Search Does Not Modify Project Requirements
  console.log("\nTEST E: 'Find all dancers.' (Candidate search only)");
  {
    const prompt = "Find all dancers.";
    const explicitOverride = parseExplicitRoleRequirementRequest(prompt);
    assert(explicitOverride === null, "Search prompt returns null for explicit requirement override");

    const intent = classifyUserIntent(prompt);
    assert(intent.intent === "CREATOR_SEARCH", `Intent is CREATOR_SEARCH (got: ${intent.intent})`);
  }

  // TEST F: Explicit User Request Overrides
  console.log("\nTEST F: 'I need dancers for my film.'");
  {
    const prompt = "I need dancers for my film.";
    const explicitOverride = parseExplicitRoleRequirementRequest(prompt);
    assert(explicitOverride !== null, "Explicit override is detected");
    assert(explicitOverride?.roleName === "Dancer", `Role is Dancer (got: ${explicitOverride?.roleName})`);
    assert(explicitOverride?.level === "PROJECT_REQUIRED", `Level is PROJECT_REQUIRED (got: ${explicitOverride?.level})`);
    assert(Boolean(explicitOverride?.reason), `Reason is recorded: "${explicitOverride?.reason}"`);

    // Verify stored override takes effect on project
    const project: OmniForgeProject = {
      id: "test-proj-f",
      ownerId: "user-1",
      title: "My Narrative Short Film",
      description: "A short film",
      domain: "Film",
      userType: "creator",
      stage: "planning",
      goal: "Make film",
      targetAudience: "General",
      expectedFinalOutcome: "Film",
      complexity: "Moderate",
      estimatedTotalDuration: "1 month",
      deliverables: [],
      phases: [],
      roles: [],
      parallelWorkstreams: [],
      recommendations: [],
      coverage: { totalRequired: 0, totalCovered: 0, percentage: 0, coveredCapabilities: [], missingCapabilities: [] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      roleRequirements: {
        Dancer: {
          level: "PROJECT_REQUIRED",
          reason: explicitOverride!.reason,
        },
      },
    };

    const status = calculateFilmTeamStatus(project, true);
    const dancerState = status.allRoles.find((r) => r.roleName === "Dancer");
    assert(
      dancerState?.requirementLevel === "PROJECT_REQUIRED",
      `Project requirement override activates Dancer as PROJECT_REQUIRED (got: ${dancerState?.requirementLevel})`
    );
    assert(
      status.openRolesWithCreators.some((r) => r.roleName === "Dancer"),
      "Dancer is now in openRolesWithCreators"
    );
  }

  // TEST G: "Who is still missing?"
  console.log("\nTEST G: 'Who is still missing?' reports only currently required roles");
  {
    const project: OmniForgeProject = {
      id: "test-proj-g",
      ownerId: "user-1",
      title: "Drama Short Film",
      description: "Generic drama",
      domain: "Film",
      userType: "creator",
      stage: "planning",
      goal: "Make drama",
      targetAudience: "Festivals",
      expectedFinalOutcome: "Short film",
      complexity: "Moderate",
      estimatedTotalDuration: "2 weeks",
      deliverables: [],
      phases: [],
      roles: [],
      parallelWorkstreams: [],
      recommendations: [],
      coverage: { totalRequired: 6, totalCovered: 0, percentage: 0, coveredCapabilities: [], missingCapabilities: [] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const missingResponse = buildDynamicMissingRolesResponse(project, true);

    // Dancer, Singer, Choreographer must NOT be under open required positions
    const openRequiredSection = missingResponse.split("#### 💡 Project-Dependent Roles")[0];
    assert(!openRequiredSection.includes("• **Dancer**"), "Dancer is NOT in open required section");
    assert(!openRequiredSection.includes("• **Lead Singer**"), "Lead Singer is NOT in open required section");
    assert(!openRequiredSection.includes("• **Choreographer**"), "Choreographer is NOT in open required section");

    // They MUST appear under Project-Dependent Roles
    assert(missingResponse.includes("#### 💡 Project-Dependent Roles"), "Includes Project-Dependent Roles section");
    assert(missingResponse.includes("• **Dancer**"), "Dancer is under Project-Dependent Roles");
    assert(missingResponse.includes("• **Choreographer**"), "Choreographer is under Project-Dependent Roles");
    assert(missingResponse.includes("• **Lead Singer**"), "Lead Singer is under Project-Dependent Roles");
  }

  // TEST H: "Build my complete film squad." with dynamic count
  console.log("\nTEST H: 'Build my complete film squad' dynamic required count");
  {
    const project: OmniForgeProject = {
      id: "test-proj-h",
      ownerId: "user-1",
      title: "My Short Film",
      description: "Generic short film",
      domain: "Film",
      userType: "creator",
      stage: "planning",
      goal: "Make drama",
      targetAudience: "Audience",
      expectedFinalOutcome: "Master",
      complexity: "Moderate",
      estimatedTotalDuration: "1 month",
      deliverables: [],
      phases: [],
      roles: [],
      parallelWorkstreams: [],
      recommendations: [],
      coverage: { totalRequired: 0, totalCovered: 0, percentage: 0, coveredCapabilities: [], missingCapabilities: [] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const status = calculateFilmTeamStatus(project, true);
    // Dynamic requiredExternalRoles must be counted dynamically, not hardcoded to 7
    assert(
      status.requiredExternalRoles.length > 0,
      `Calculated dynamic requiredExternalRoles: ${status.requiredExternalRoles.length}`
    );
    assert(
      status.externalPositionsFilledText === `0 of ${status.requiredExternalRoles.length}`,
      `Dynamic ratio matches: ${status.externalPositionsFilledText}`
    );
    assert(
      !status.requiredExternalRoles.some((r) => r.roleName === "Dancer"),
      "Dancer is not counted in requiredExternalRoles"
    );
    assert(
      !status.requiredExternalRoles.some((r) => r.roleName === "Lead Singer"),
      "Lead Singer is not counted in requiredExternalRoles"
    );
  }

  // TEST I: Project requirements persist across reconcile
  console.log("\nTEST I: Project requirements persistence");
  {
    const project: OmniForgeProject = {
      id: "test-proj-i",
      ownerId: "user-1",
      title: "Dance Film Drama",
      description: "Story with dance",
      domain: "Film",
      userType: "creator",
      stage: "planning",
      goal: "Dance drama",
      targetAudience: "Festivals",
      expectedFinalOutcome: "Film",
      complexity: "Moderate",
      estimatedTotalDuration: "1 month",
      deliverables: [],
      phases: [],
      roles: [],
      parallelWorkstreams: [],
      recommendations: [],
      coverage: { totalRequired: 0, totalCovered: 0, percentage: 0, coveredCapabilities: [], missingCapabilities: [] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      roleRequirements: {
        Dancer: {
          level: "PROJECT_REQUIRED",
          reason: "Dance sequence featured in scene 3.",
        },
      },
    };

    // Reconcile project with db members
    const reconciled = reconcileProjectTeamState(project, [], []);
    assert(
      reconciled.roleRequirements?.Dancer?.level === "PROJECT_REQUIRED",
      "roleRequirements.Dancer persists after reconcile"
    );

    const status = calculateFilmTeamStatus(reconciled, true);
    const dancer = status.allRoles.find((r) => r.roleName === "Dancer");
    assert(dancer?.requirementLevel === "PROJECT_REQUIRED", "Dancer remains PROJECT_REQUIRED after reconcile");
  }

  // TEST J: Project switching isolation (requirements do not leak)
  console.log("\nTEST J: Project switching isolation");
  {
    const musicalProject: OmniForgeProject = {
      id: "proj-musical",
      ownerId: "user-1",
      title: "Romantic Musical Film",
      description: "Musical project",
      domain: "Film",
      userType: "creator",
      stage: "planning",
      goal: "Musical",
      targetAudience: "Fans",
      expectedFinalOutcome: "Film",
      complexity: "Moderate",
      estimatedTotalDuration: "2 months",
      deliverables: [],
      phases: [],
      roles: [],
      parallelWorkstreams: [],
      recommendations: [],
      coverage: { totalRequired: 0, totalCovered: 0, percentage: 0, coveredCapabilities: [], missingCapabilities: [] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      roleRequirements: {
        Dancer: { level: "PROJECT_REQUIRED", reason: "Musical dance" },
      },
    };

    const docuProject: OmniForgeProject = {
      id: "proj-documentary",
      ownerId: "user-1",
      title: "Cultural Documentary",
      description: "Documentary project",
      domain: "Film",
      userType: "creator",
      stage: "planning",
      goal: "Docu",
      targetAudience: "Public",
      expectedFinalOutcome: "Documentary",
      complexity: "Moderate",
      estimatedTotalDuration: "1 month",
      deliverables: [],
      phases: [],
      roles: [],
      parallelWorkstreams: [],
      recommendations: [],
      coverage: { totalRequired: 0, totalCovered: 0, percentage: 0, coveredCapabilities: [], missingCapabilities: [] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const musicalResolved = resolveActiveProject(musicalProject);
    const docuResolved = resolveActiveProject(docuProject);

    assert(musicalResolved?.id === "proj-musical", "Musical project resolves correctly");
    assert(docuResolved?.id === "proj-documentary", "Documentary project resolves correctly");
    assert(
      docuResolved?.roleRequirements === undefined || docuResolved?.roleRequirements?.Dancer === undefined,
      "Documentary does NOT inherit musical Dancer requirement"
    );

    const docuStatus = calculateFilmTeamStatus(docuResolved, true);
    const docuDancer = docuStatus.allRoles.find((r) => r.roleName === "Dancer");
    assert(docuDancer?.requirementLevel === "NOT_REQUIRED", "Documentary dancer is NOT_REQUIRED");
  }

  console.log("\n=======================================================");
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
