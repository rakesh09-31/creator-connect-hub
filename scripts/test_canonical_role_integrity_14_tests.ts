import { fetchCreatorDirectoryPool, getCreatorsForRole, getCreatorCountForRole, validateCandidateRole } from '../src/lib/omniforge/matcher';
import {
  calculateFilmTeamStatus,
  reconcileProjectTeamState,
  applyCreatorToProject,
  CANONICAL_FILM_SQUAD_ID,
  SHORT_FILM_ROLE_DEFINITIONS,
  isRoleMatch,
  buildDynamicMissingRolesResponse
} from '../src/lib/omniforge/team-reconciliation';
import { ALL_CANONICAL_CINEMATIC_ROLES } from '../src/lib/omniforge/film-taxonomy';
import { OmniForgeProject } from '../src/lib/omniforge/types';
import { fetchSquadMembers, fetchSquadInvitations } from '../src/lib/omniforge/collaboration';

async function run14RegressionTests() {
  console.log("==================================================================");
  console.log("RUNNING 14 CANONICAL FILM ROLE INTEGRITY REGRESSION TESTS");
  console.log("==================================================================\n");

  const pool = await fetchCreatorDirectoryPool();
  console.log(`Fetched directory pool: ${pool.length} creators\n`);

  let allPassed = true;
  function assert(testNum: number, testName: string, condition: boolean, details?: string) {
    if (condition) {
      console.log(`[PASS] Test ${testNum}: ${testName}${details ? ` (${details})` : ''}`);
    } else {
      console.error(`[FAIL] Test ${testNum}: ${testName}${details ? ` (${details})` : ''}`);
      allPassed = false;
    }
  }

  // Test 1: Find all creators required for a film. Verify no generic unrelated creators.
  const filmRoles = ["Cinematographer", "Video Editor", "Lead Actor", "Sound Designer", "Dancer"];
  let test1Valid = true;
  for (const r of filmRoles) {
    const res = await getCreatorsForRole(r);
    for (const c of res.creators) {
      const v = validateCandidateRole(c, r);
      if (!v.valid) {
        test1Valid = false;
        console.error(`Invalid candidate for ${r}: @${c.username}`);
      }
    }
  }
  assert(1, "Find all creators required for a film - No generic unrelated creators", test1Valid);

  // Test 2: Find all dancers. Verify every result has valid dancer evidence.
  const dancerRes = await getCreatorsForRole("Dancer");
  let test2Valid = dancerRes.creators.length > 0;
  for (const c of dancerRes.creators) {
    const v = validateCandidateRole(c, "Dancer");
    if (!v.valid || !v.evidence.length) test2Valid = false;
  }
  assert(2, "Find all dancers - Every result has valid dancer evidence", test2Valid, `${dancerRes.totalCount} dancers found`);

  // Test 3: Find all choreographers. Verify every result has valid choreographer evidence.
  const choreoRes = await getCreatorsForRole("Choreographer");
  let test3Valid = choreoRes.creators.length > 0;
  for (const c of choreoRes.creators) {
    const v = validateCandidateRole(c, "Choreographer");
    if (!v.valid || !v.evidence.length) test3Valid = false;
  }
  assert(3, "Find all choreographers - Every result has valid choreographer evidence", test3Valid, `${choreoRes.totalCount} choreographers found`);

  // Test 4: Find all cinematographers. Verify no generic actors unless valid cinematography evidence.
  const cineRes = await getCreatorsForRole("Cinematographer");
  let test4Valid = cineRes.creators.length > 0;
  for (const c of cineRes.creators) {
    const v = validateCandidateRole(c, "Cinematographer");
    if (!v.valid) test4Valid = false;
  }
  assert(4, "Find all cinematographers - Strict cinematography evidence", test4Valid, `${cineRes.totalCount} cinematographers found`);

  // Test 5: Find all lead actors. Verify cinematographers do not appear merely because of generic creative data.
  const actorRes = await getCreatorsForRole("Lead Actor");
  let test5Valid = actorRes.creators.length > 0;
  for (const c of actorRes.creators) {
    const v = validateCandidateRole(c, "Lead Actor");
    if (!v.valid) test5Valid = false;
  }
  assert(5, "Find all lead actors - Strict actor evidence", test5Valid, `${actorRes.totalCount} actors found`);

  // Test 6: Who is still missing? Verify counts match creator-search counts.
  const cameraOpSearchCount = await getCreatorCountForRole("Camera Operator");
  const choreoSearchCount = await getCreatorCountForRole("Choreographer");
  const musicDirSearchCount = await getCreatorCountForRole("Music Director");
  const coloristSearchCount = await getCreatorCountForRole("Colorist");

  const status = calculateFilmTeamStatus(null, true);
  const cameraOpStatus = (status.openRolesWithCreators.find(r => r.roleName === "Camera Operator") || status.projectDependentRoles.find(r => r.roleName === "Camera Operator"))?.matchingCreatorCount ?? 0;
  const choreoStatus = (status.openRolesWithCreators.find(r => r.roleName === "Choreographer") || status.projectDependentRoles.find(r => r.roleName === "Choreographer"))?.matchingCreatorCount ?? 0;
  const musicDirStatus = (status.openRolesWithCreators.find(r => r.roleName === "Music Director") || status.projectDependentRoles.find(r => r.roleName === "Music Director"))?.matchingCreatorCount ?? 0;
  const coloristStatus = (status.openRolesWithCreators.find(r => r.roleName === "Colorist") || status.projectDependentRoles.find(r => r.roleName === "Colorist"))?.matchingCreatorCount ?? 0;

  const test6Passed =
    cameraOpSearchCount === cameraOpStatus &&
    choreoSearchCount === choreoStatus &&
    musicDirSearchCount === musicDirStatus &&
    coloristSearchCount === coloristStatus;
  assert(6, "Who is still missing? - Counts match creator-search counts", test6Passed,
    `CamOp: ${cameraOpSearchCount}===${cameraOpStatus}, Choreo: ${choreoSearchCount}===${choreoStatus}, MusicDir: ${musicDirSearchCount}===${musicDirStatus}, Colorist: ${coloristSearchCount}===${coloristStatus}`);

  // Test 7: Assign @ramu as Lead Actor. Verify Supporting Actor does NOT automatically become @ramu.
  const ramuCreator = pool.find(c => c.username === "ramu") || {
    id: "01214642-fd80-41b3-b1c8-e1241ab84c60",
    username: "ramu",
    role: "Actor",
    skills: ["Acting"],
    specialties: ["Actor"]
  };
  let dummyProject: OmniForgeProject = {
    id: "test-proj-7",
    title: "Romantic Musical Film",
    stage: "in_progress",
    domain: "Film",
    roles: [
      { id: "r1", roleName: "Lead Actor", category: "Performance", requiredSkills: ["Acting"], isFilled: false },
      { id: "r2", roleName: "Supporting Actors", category: "Performance", requiredSkills: ["Acting"], isFilled: false },
    ],
    phases: [],
    deliverables: [],
    recommendations: [],
    coverage: { totalRequired: 2, totalCovered: 0, percentage: 0, coveredCapabilities: [], missingCapabilities: [] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  dummyProject = applyCreatorToProject(dummyProject, ramuCreator, "Lead Actor");
  const test7Status = calculateFilmTeamStatus(dummyProject, true);
  const ramuAsLead = test7Status.assignedRoles.some(r => r.roleName === "Lead Actor" && r.assignedCreatorName?.includes("ramu"));
  const ramuAsSupp = test7Status.assignedRoles.some(r => r.roleName === "Supporting Actors" && r.assignedCreatorName?.includes("ramu"));
  assert(7, "Assign @ramu as Lead Actor - Supporting Actor does NOT automatically become @ramu", ramuAsLead && !ramuAsSupp);

  // Test 8: Attempt to assign @ramu as Supporting Actor. Verify multi-role confirmation is required.
  const unconfirmedProject = applyCreatorToProject(dummyProject, ramuCreator, "Supporting Actors");
  const stillNotSupp = !unconfirmedProject.roles.find(r => r.roleName === "Supporting Actors")?.isFilled;
  const confirmedProject = applyCreatorToProject(dummyProject, ramuCreator, "Supporting Actors", undefined, { confirmMultiRole: true });
  const suppFilledWithConfirm = confirmedProject.roles.find(r => r.roleName === "Supporting Actors")?.isFilled === true;
  assert(8, "Attempt to assign @ramu as Supporting Actor - Confirmation is required", stillNotSupp && suppFilledWithConfirm);

  // Test 9: Verify @ravi_edits. If database membership says Cinematographer: never display her as Lead Actress.
  const raviCreator = pool.find(c => c.username === "ravi_edits") || {
    id: "ravi-id",
    username: "ravi_edits",
    role: "Cinematographer",
    specialties: ["Cinematography"],
    skills: ["Camera"],
  };
  let proj9: OmniForgeProject = {
    id: "test-proj-9",
    title: "Romantic Musical Film",
    stage: "in_progress",
    domain: "Film",
    roles: [
      { id: "r-actress", roleName: "Lead Actress", category: "Performance", requiredSkills: ["Acting"], isFilled: false },
      { id: "r-cine", roleName: "Cinematographer", category: "Visuals", requiredSkills: ["Camera"], isFilled: true, assignedCreatorName: "@ravi_edits", assignedCreatorId: raviCreator.id }
    ],
    phases: [],
    deliverables: [],
    recommendations: [
      {
        id: "rec-cine",
        roleId: "r-cine",
        roleName: "Cinematographer",
        creator: raviCreator as any,
        status: "accepted",
        invitationStatus: "accepted",
        matchScore: 90,
        tier: "strong",
        matchReason: "Cinematographer",
        evidenceSources: { skillsMatched: ["Camera"], roleAlignment: true }
      }
    ],
    coverage: { totalRequired: 2, totalCovered: 1, percentage: 50, coveredCapabilities: [], missingCapabilities: [] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const test9Status = calculateFilmTeamStatus(proj9, true);
  const raviAsActress = test9Status.assignedRoles.some(r => r.roleName === "Lead Actress" && r.assignedCreatorName?.includes("ravi_edits"));
  assert(9, "Verify @ravi_edits - Never displayed as Lead Actress", !raviAsActress);

  // Test 10: Verify Camera Operator count. Creator search count == team reconciliation count.
  const test10Passed = cameraOpSearchCount === cameraOpStatus && cameraOpSearchCount > 0;
  assert(10, "Verify Camera Operator count - Creator search count == team reconciliation count", test10Passed, `${cameraOpSearchCount} === ${cameraOpStatus}`);

  // Test 11: Verify Choreographer count. Creator search count == team reconciliation count.
  const test11Passed = choreoSearchCount === choreoStatus && choreoSearchCount > 0;
  assert(11, "Verify Choreographer count - Creator search count == team reconciliation count", test11Passed, `${choreoSearchCount} === ${choreoStatus}`);

  // Test 12: Verify Music Director count. Creator search count == team reconciliation count.
  const test12Passed = musicDirSearchCount === musicDirStatus;
  assert(12, "Verify Music Director count - Creator search count == team reconciliation count", test12Passed, `${musicDirSearchCount} === ${musicDirStatus}`);

  // Test 13: Refresh page simulation. Verify exact project roles persist.
  const [dbMembers, dbInvs] = await Promise.all([
    fetchSquadMembers(CANONICAL_FILM_SQUAD_ID),
    fetchSquadInvitations(CANONICAL_FILM_SQUAD_ID),
  ]);
  const reconciledBase = reconcileProjectTeamState(
    {
      id: "base-persisted",
      squadId: CANONICAL_FILM_SQUAD_ID,
      title: "Romantic Musical Film",
      stage: "in_progress",
      domain: "Film",
      currentUserRole: "DIRECTOR",
      roles: [],
      phases: [],
      deliverables: [],
      recommendations: [],
      coverage: { totalRequired: 0, totalCovered: 0, percentage: 0, coveredCapabilities: [], missingCapabilities: [] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    dbMembers,
    dbInvs,
    "owner-id"
  );
  const test13Passed =
    reconciledBase.roles.some(r => r.roleName === "Lead Actor" && r.isFilled) &&
    reconciledBase.roles.some(r => r.roleName === "Cinematographer" && r.isFilled) &&
    reconciledBase.roles.some(r => r.roleName === "Film Director" && r.isFilled);
  assert(13, "Project role persistence - Roles correctly restored from DB", test13Passed);

  // Test 14: Switch project simulation. Verify roles do not leak.
  const otherProject: OmniForgeProject = {
    id: "brand-commercial-proj",
    title: "Brand Commercial Video",
    stage: "in_progress",
    domain: "Video Production",
    currentUserRole: undefined,
    roles: [
      { id: "brand-anim", roleName: "Motion Graphics Artist", category: "Creative", requiredSkills: ["After Effects"], isFilled: false }
    ],
    phases: [],
    deliverables: [],
    recommendations: [],
    coverage: { totalRequired: 1, totalCovered: 0, percentage: 0, coveredCapabilities: [], missingCapabilities: [] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const reconciledOther = reconcileProjectTeamState(otherProject, [], [], "owner-id");
  const test14Passed =
    !reconciledOther.roles.some(r => r.roleName === "Lead Actor") &&
    !reconciledOther.roles.some(r => r.roleName === "Cinematographer");
  assert(14, "Switch project - Roles do not leak across projects", test14Passed);

  console.log("\n==================================================================");
  if (allPassed) {
    console.log("ALL 14 REGRESSION TESTS PASSED WITH 100% SUCCESS!");
  } else {
    console.error("SOME REGRESSION TESTS FAILED");
    process.exit(1);
  }
  console.log("==================================================================");
}

run14RegressionTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
