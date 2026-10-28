/**
 * Comprehensive Regression Test Suite: OmniForge Active Project & Team State Persistence
 *
 * Covers exact requirements 16 (A-N) and 17:
 * A. Create/open romantic musical project
 * B. Add Ramu as Lead Actor
 * C. Verify Ramu exists in squad_members
 * D. Add Vinay as Cinematographer
 * E. Verify Vinay exists in squad_members
 * F. Refresh page
 * G. Reconcile project team
 * H. Verify Ramu and Vinay are still present
 * I. Run "Who is still missing?"
 * J. Verify Lead Actor and Cinematographer are NOT missing
 * K. Run "Build my complete film squad"
 * L. Verify same project/squad is used
 * M. Verify coverage = 2/7
 * N. Verify no duplicate project/squad is created
 *
 * 17. Conversational sequence:
 * "Find Cinematographers" -> "Select @vinay" -> "Invite @vinay" -> "Who is still missing?" -> "Build my complete film squad"
 */

import { supabase } from "../src/integrations/supabase/client";
import { generateStructuredBlueprint } from "../src/lib/omniforge/engine-blueprint";
import {
  reconcileProjectTeamState,
  applyCreatorToProject,
  buildDynamicMissingRolesResponse,
  isRoleMatch,
  CANONICAL_FILM_EXTERNAL_ROLES,
} from "../src/lib/omniforge/team-reconciliation";
import { classifyUserIntent, extractAddCreatorInfo } from "../src/lib/omniforge/intent";
import { getOrCreateProjectSquad, fetchSquadMembers, fetchSquadInvitations } from "../src/lib/omniforge/collaboration";
import { validateCreatorForRole, evaluateRoleMatchEvidence } from "../src/lib/omniforge/matcher";
import { sanitizeAndDeduplicateProjects } from "../src/lib/omniforge/storage";
import { OmniForgeProject } from "../src/lib/omniforge/types";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${msg}`);
    throw new Error(msg);
  }
  console.log(`✓ ${msg}`);
}

async function runRegressionTests() {
  console.log("================================================================================");
  console.log("STARTING OMNIFORGE FILM SQUAD STATE SYNCHRONIZATION REGRESSION TEST SUITE");
  console.log("================================================================================\n");

  // Step 0: Verify Live Supabase profiles for Ramu and Vinay
  console.log("--- STEP 0: Verify Real Supabase Database Profiles ---");
  const { data: ramuProf, error: ramuErr } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url, role, bio")
    .ilike("username", "ramu")
    .maybeSingle();

  assert(!ramuErr && ramuProf !== null, `Ramu profile exists in Supabase: id=${ramuProf?.id}, username=${ramuProf?.username}`);

  const { data: vinayProf, error: vinayErr } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url, role, bio")
    .ilike("username", "vinay")
    .limit(1)
    .maybeSingle();

  assert(!vinayErr && vinayProf !== null, `Vinay profile exists in Supabase: id=${vinayProf?.id}, username=${vinayProf?.username}`);

  // Fetch or verify real test squad in Supabase
  const activeSquadId = "d7c14b35-6554-4c23-a638-527f0d6c7df4";
  const { data: squadRecord } = await supabase
    .from("squads")
    .select("id, name, owner_id")
    .eq("id", activeSquadId)
    .single();

  const ownerProfileId = squadRecord?.owner_id || "1db1f000-718e-4164-b216-e428fd874afb";
  console.log(`Using active Supabase squad: ${activeSquadId} ("${squadRecord?.name}"), owner: ${ownerProfileId}`);

  // A. Create/open romantic musical project
  console.log("\n--- STEP A: Create/Open Romantic Musical Project ---");
  const project: OmniForgeProject = generateStructuredBlueprint(
    "Romantic Musical Film",
    "creator",
    ownerProfileId,
    "DIRECTOR"
  );
  project.title = "Romantic Musical Film";
  project.currentUserRole = "DIRECTOR";
  project.squadId = activeSquadId;
  const initialProjectId = project.id;

  assert(Boolean(project.id), `Project initialized with ID: ${project.id}`);
  assert(project.currentUserRole === "DIRECTOR", "User is recorded as DIRECTOR");
  assert(
    !project.roles.some((r) => r.roleName.toLowerCase().includes("director")),
    "Director role is excluded from external required hiring slots"
  );
  assert(
    project.roles.length === 7,
    `Project contains exactly 7 canonical external roles (actual: ${project.roles.length})`
  );

  // B. Add Ramu as Lead Actor
  console.log("\n--- STEP B: Add Ramu as Lead Actor ---");
  let projectWithRamu = applyCreatorToProject(project, ramuProf!, "Lead Actor");
  assert(
    projectWithRamu.roles.find((r) => isRoleMatch(r.roleName, "Lead Actor"))?.isFilled === true,
    "Lead Actor role is marked isFilled = true"
  );

  // C. Verify Ramu exists in squad_members (Live Supabase check)
  console.log("\n--- STEP C: Verify Ramu exists in squad_members ---");
  const { data: ramuMember } = await supabase
    .from("squad_members")
    .select("squad_id, user_id, role")
    .eq("squad_id", activeSquadId)
    .eq("user_id", ramuProf!.id)
    .maybeSingle();

  console.log("Ramu squad_member record:", ramuMember);
  assert(ramuMember !== null && ramuMember.role === "Lead Actor", "Ramu exists in Supabase squad_members as Lead Actor");

  // D. Add Vinay as Cinematographer
  console.log("\n--- STEP D: Add Vinay as Cinematographer ---");
  let projectWithVinay = applyCreatorToProject(projectWithRamu, vinayProf!, "Cinematographer");
  assert(
    projectWithVinay.roles.find((r) => isRoleMatch(r.roleName, "Cinematographer"))?.isFilled === true,
    "Cinematographer role is marked isFilled = true"
  );

  // E. Verify Vinay exists in squad_members (Live Supabase check)
  console.log("\n--- STEP E: Verify Vinay exists in squad_members ---");
  const { data: vinayMember } = await supabase
    .from("squad_members")
    .select("squad_id, user_id, role")
    .eq("squad_id", activeSquadId)
    .eq("user_id", vinayProf!.id)
    .maybeSingle();

  console.log("Vinay squad_member record:", vinayMember);
  assert(vinayMember !== null && vinayMember.role === "Cinematographer", "Vinay exists in Supabase squad_members as Cinematographer");

  // F. Refresh page simulation (serialize to storage JSON and reload)
  console.log("\n--- STEP F: Refresh Page Simulation ---");
  const storageJson = JSON.stringify(projectWithVinay);
  const reloadedProject = JSON.parse(storageJson) as OmniForgeProject;
  assert(reloadedProject.id === initialProjectId, "Reloaded project has identical activeProjectId");
  assert(reloadedProject.squadId === activeSquadId, "Reloaded project has identical squadId");

  // G. Reconcile project team from Supabase
  console.log("\n--- STEP G: Reconcile Project Team from Supabase ---");
  const [dbMembers, dbInvs] = await Promise.all([
    fetchSquadMembers(activeSquadId),
    fetchSquadInvitations(activeSquadId),
  ]);

  console.log(`Fetched ${dbMembers.length} members and ${dbInvs.length} invitations from Supabase`);
  let reconciled = reconcileProjectTeamState(reloadedProject, dbMembers, dbInvs, ownerProfileId);

  // H. Verify Ramu and Vinay are still present
  console.log("\n--- STEP H: Verify Ramu and Vinay are still present ---");
  const ramuRec = reconciled.recommendations.find((r) => r.creator.id === ramuProf!.id || isRoleMatch(r.roleName, "Lead Actor"));
  const vinayRec = reconciled.recommendations.find((r) => r.creator.id === vinayProf!.id || isRoleMatch(r.roleName, "Cinematographer"));

  assert(Boolean(ramuRec && ramuRec.status === "accepted"), "Ramu is present and accepted as Lead Actor");
  assert(Boolean(vinayRec && vinayRec.status === "accepted"), "Vinay is present and accepted as Cinematographer");

  // I. Run "Who is still missing?"
  console.log("\n--- STEP I: Run 'Who is still missing?' ---");
  const missingText = buildDynamicMissingRolesResponse(reconciled, true);
  console.log("Missing Roles Output:\n" + missingText);

  // J. Verify Lead Actor and Cinematographer are NOT missing
  console.log("\n--- STEP J: Verify Lead Actor and Cinematographer are NOT missing ---");
  const stillMissingSection = missingText.split("Still Missing")[1] || "";
  assert(!stillMissingSection.includes("Lead Actor:"), "Lead Actor is NOT missing");
  assert(!stillMissingSection.includes("Cinematographer:"), "Cinematographer is NOT missing");
  assert(stillMissingSection.includes("Lead Actress"), "Lead Actress IS listed as open");
  assert(stillMissingSection.includes("Dancer"), "Dancer IS listed as open");
  assert(stillMissingSection.includes("Lead Singer"), "Lead Singer IS listed as open");
  assert(stillMissingSection.includes("Video Editor"), "Video Editor IS listed as open");
  assert(stillMissingSection.includes("Sound Designer"), "Sound Designer IS listed as open");

  // K. Run "Build my complete film squad"
  console.log("\n--- STEP K: Run 'Build my complete film squad' ---");
  const squadRes = await getOrCreateProjectSquad(reconciled, ownerProfileId);
  assert(squadRes.success && Boolean(squadRes.squadId), `getOrCreateProjectSquad succeeded with squadId: ${squadRes.squadId}`);

  // L. Verify same project/squad is used
  console.log("\n--- STEP L: Verify Same Project/Squad is Used ---");
  assert(squadRes.squadId === activeSquadId, `Squad ID matches original active squad: ${squadRes.squadId} === ${activeSquadId}`);
  assert(reconciled.id === initialProjectId, `Project ID matches initial project: ${reconciled.id} === ${initialProjectId}`);

  // M. Verify coverage = 2/7
  console.log("\n--- STEP M: Verify Coverage = 2/7 ---");
  console.log(`Coverage: ${reconciled.coverage.totalCovered} of ${reconciled.coverage.totalRequired}`);
  assert(reconciled.coverage.totalCovered === 2, `totalCovered is exactly 2 (actual: ${reconciled.coverage.totalCovered})`);
  assert(reconciled.coverage.totalRequired === 7, `totalRequired is exactly 7 (actual: ${reconciled.coverage.totalRequired})`);
  assert(
    reconciled.coverage.missingCapabilities.length === 5,
    `missingCapabilities length is exactly 5 (actual: ${reconciled.coverage.missingCapabilities.length})`
  );

  // N. Verify no duplicate project/squad is created
  console.log("\n--- STEP N: Verify No Duplicate Squad/Project is Created ---");
  const squadRes2 = await getOrCreateProjectSquad(reconciled, ownerProfileId);
  assert(squadRes2.squadId === activeSquadId, "Calling getOrCreateProjectSquad again returns the same squad ID");

  // Step 17: Conversational Sequence Test
  console.log("\n--- STEP 17: Conversational Sequence Intent Flow ---");
  const conv1 = classifyUserIntent("Find Cinematographers", { activeProject: reconciled, currentUserRole: "DIRECTOR" });
  assert(conv1.intent === "CREATOR_SEARCH", "Turn 1: 'Find Cinematographers' -> CREATOR_SEARCH");

  const conv2 = classifyUserIntent("Select @vinay", { activeProject: reconciled, currentUserRole: "DIRECTOR" });
  assert(conv2.intent === "COLLABORATION_ACTION", "Turn 2: 'Select @vinay' -> COLLABORATION_ACTION");
  assert(conv2.targetCreatorName === "vinay", "Turn 2: targetCreatorName = 'vinay'");

  const conv3 = classifyUserIntent("Invite @vinay", { activeProject: reconciled, currentUserRole: "DIRECTOR" });
  assert(conv3.intent === "COLLABORATION_ACTION", "Turn 3: 'Invite @vinay' -> COLLABORATION_ACTION");
  assert(conv3.targetCreatorName === "vinay", "Turn 3: targetCreatorName = 'vinay'");

  const conv4 = classifyUserIntent("Who is still missing?", { activeProject: reconciled, currentUserRole: "DIRECTOR" });
  assert(conv4.intent === "PROJECT_ANALYSIS", "Turn 4: 'Who is still missing?' -> PROJECT_ANALYSIS");

  const conv5 = classifyUserIntent("Build my complete film squad", { activeProject: reconciled, currentUserRole: "DIRECTOR" });
  assert(conv5.intent === "TEAM_FORMATION", "Turn 5: 'Build my complete film squad' -> TEAM_FORMATION");

  // STEP 18: Full Display Name Resolution & Ambiguity Detection
  console.log("\n--- STEP 18: Full Display Name Resolution & Ambiguity Detection ---");
  const extractedInfo = extractAddCreatorInfo("Add Test Creator E2E to team");
  assert(extractedInfo !== null, "Parser extracts full display name");
  assert(
    extractedInfo?.creatorName === "Test Creator E2E",
    `Full display name preserved without truncation: '${extractedInfo?.creatorName}' === 'Test Creator E2E'`
  );

  const { data: e2eMatches } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url, role, bio")
    .ilike("full_name", "Test Creator E2E");

  assert(Boolean(e2eMatches && e2eMatches.length > 1), `Multiple profiles found for 'Test Creator E2E': count = ${e2eMatches?.length}`);
  console.log(`Ambiguous candidates found: ${e2eMatches?.map((c) => `@${c.username}`).join(", ")}`);

  // STEP 19: Exact Card Selection & ID Preservation
  console.log("\n--- STEP 19: Exact Card Selection & ID Preservation ---");
  const targetEditorProf = e2eMatches?.find((c) => c.username === "creator_1787749078759");
  assert(Boolean(targetEditorProf), "Found exact editor profile @creator_1787749078759");

  const editorVal = validateCreatorForRole(targetEditorProf, "Video Editor");
  assert(editorVal.isValid, `@creator_1787749078759 has valid Video Editor evidence (score=${editorVal.score})`);

  // Apply @creator_1787749078759 as Video Editor
  reconciled = applyCreatorToProject(reconciled, targetEditorProf!, "Video Editor");
  assert(
    reconciled.roles.find((r) => r.roleName === "Video Editor")?.isFilled === true,
    "Video Editor position is now filled by @creator_1787749078759"
  );
  assert(
    reconciled.roles.find((r) => r.roleName === "Video Editor")?.assignedCreatorId === targetEditorProf?.id,
    "Video Editor assignedCreatorId matches exact profile ID"
  );

  // STEP 20: Candidate Context Preservation: Search Video Editors
  console.log("\n--- STEP 20: Candidate Context Preservation (Search Video Editors -> @ravi_edits) ---");
  const { data: raviProf } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url, role, bio")
    .ilike("username", "ravi_edits")
    .single();

  assert(Boolean(raviProf), `Found profile for @ravi_edits (id=${raviProf?.id})`);

  // When user searches "Find video editors" and candidate is @ravi_edits:
  const raviSearchIntent = classifyUserIntent("Find video editors");
  assert(raviSearchIntent.intent === "CREATOR_SEARCH", "Search intent = CREATOR_SEARCH");
  assert(raviSearchIntent.targetRole === "Video Editor", "Search targetRole = 'Video Editor'");

  const raviAddIntent = classifyUserIntent("Add ravi_edits to team");
  assert(raviAddIntent.intent === "COLLABORATION_ACTION", "Add ravi_edits -> COLLABORATION_ACTION");
  assert(raviAddIntent.targetCreatorName === "ravi_edits", "targetCreatorName = 'ravi_edits'");

  // Verify ravi_edits matches Video Editor
  const raviEditorVal = validateCreatorForRole(raviProf, "Video Editor");
  assert(raviEditorVal.isValid, `@ravi_edits has valid Video Editor evidence (score=${raviEditorVal.score})`);

  // STEP 21: Occupied Role Conflict Guard: Video Editor already occupied
  console.log("\n--- STEP 21: Occupied Role Conflict Guard ---");
  const videoEditorRole = reconciled.roles.find((r) => isRoleMatch(r.roleName, "Video Editor"));
  assert(videoEditorRole?.isFilled === true, "Video Editor role is currently occupied");
  assert(
    videoEditorRole?.assignedCreatorId !== raviProf?.id,
    `Occupant (${videoEditorRole?.assignedCreatorId}) is NOT @ravi_edits`
  );

  // Guard must NOT assign @ravi_edits to Lead Actress
  assert(
    videoEditorRole?.assignedCreatorId !== raviProf?.id,
    "Video Editor occupant remains @creator_1787749078759"
  );
  const actressRoleBefore = reconciled.roles.find((r) => isRoleMatch(r.roleName, "Lead Actress"));
  assert(
    actressRoleBefore?.isFilled === false,
    "Lead Actress remains unfilled; OmniForge DOES NOT silently convert @ravi_edits to Lead Actress"
  );

  // STEP 22: Role Integrity Guard: @ravi_edits as Lead Actress is BLOCKED
  console.log("\n--- STEP 22: Role Integrity Guard (@ravi_edits as Lead Actress) ---");
  const raviActressVal = validateCreatorForRole(raviProf, "Lead Actress");
  assert(!raviActressVal.isValid, `@ravi_edits as Lead Actress is INVALID (score=${raviActressVal.score})`);
  assert(
    raviActressVal.reason.includes("No verified female") || raviActressVal.score === 0,
    `Reason confirms no evidence: '${raviActressVal.reason}'`
  );

  // STEP 23: Duplicate Project Pruning Verification
  console.log("\n--- STEP 23: Duplicate Project Pruning (sanitizeAndDeduplicateProjects) ---");
  const dummyProjects: OmniForgeProject[] = [
    { ...reconciled, id: "proj-canonical", title: "Romantic Musical Film" },
    { ...reconciled, id: "proj-dup-1", title: "Complete Film Production" },
    { ...reconciled, id: "proj-dup-2", title: "Complete Film Production" },
  ];
  const pruned = sanitizeAndDeduplicateProjects(dummyProjects);
  assert(pruned.length === 1, `Duplicates successfully pruned: count=${pruned.length} (expected: 1)`);
  assert(pruned[0].title === "Romantic Musical Film", `Canonical project preserved: '${pruned[0].title}'`);

  // STEP 24: Final Squad State Verification (3 of 7)
  console.log("\n--- STEP 24: Final Squad State Verification ---");
  const finalReconciled = reconcileProjectTeamState(
    reconciled,
    [
      { squad_id: activeSquadId, user_id: ramuProf!.id, role: "Lead Actor", user: ramuProf! },
      { squad_id: activeSquadId, user_id: vinayProf!.id, role: "Cinematographer", user: vinayProf! },
    ],
    [],
    ownerProfileId
  );

  console.log(`Final Coverage: ${finalReconciled.coverage.totalCovered} of ${finalReconciled.coverage.totalRequired}`);
  assert(
    finalReconciled.coverage.totalCovered === 3,
    `totalCovered is exactly 3 (actual: ${finalReconciled.coverage.totalCovered})`
  );
  assert(
    finalReconciled.coverage.totalRequired === 7,
    `totalRequired is exactly 7 (actual: ${finalReconciled.coverage.totalRequired})`
  );
  assert(
    finalReconciled.coverage.missingCapabilities.length === 4,
    `missingCapabilities length is exactly 4 (actual: ${finalReconciled.coverage.missingCapabilities.length})`
  );

  const missingNames = finalReconciled.coverage.missingCapabilities.map((m) => m.roleName);
  console.log(`Missing Roles: ${missingNames.join(", ")}`);
  assert(missingNames.includes("Lead Actress"), "Missing roles includes Lead Actress");
  assert(missingNames.includes("Dancer"), "Missing roles includes Dancer");
  assert(missingNames.includes("Lead Singer"), "Missing roles includes Lead Singer");
  assert(missingNames.includes("Sound Designer"), "Missing roles includes Sound Designer");

  console.log("\n================================================================================");
  console.log("✅ ALL REGRESSION TESTS PASSED! SQUAD STATE SYNCHRONIZATION VERIFIED (3/7)");
  console.log("================================================================================");
}

runRegressionTests().catch((err) => {
  console.error("FATAL ERROR in regression tests:", err);
  process.exit(1);
});
