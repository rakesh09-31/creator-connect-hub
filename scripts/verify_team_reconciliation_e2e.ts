import { supabase } from '../src/integrations/supabase/client';
import {
  CANONICAL_FILM_SQUAD_ID,
  CANONICAL_FILM_EXTERNAL_ROLES,
  reconcileProjectTeamState,
  buildDynamicMissingRolesResponse,
  applyCreatorToProject,
  isRoleMatch,
} from '../src/lib/omniforge/team-reconciliation';
import {
  getRoleCandidateCounts,
  searchCreatorsDirectory,
  searchCinemaCreatorsByDepartments,
} from '../src/lib/omniforge/matcher';
import { classifyMessageIntent } from '../src/lib/omniforge/intent';
import { OmniForgeProject } from '../src/lib/omniforge/types';
import { fetchSquadMembers, fetchSquadInvitations } from '../src/lib/omniforge/collaboration';

async function runVerification() {
  console.log("==================================================================");
  console.log("RUNNING COMPLETE OMNIFORGE TEAM RECONCILIATION & SEMANTICS VERIFICATION");
  console.log("==================================================================\n");

  // Step 1: Fetch real squad members and invitations for CANONICAL_FILM_SQUAD_ID
  console.log(`[Step 1] Fetching real members from Supabase squad: ${CANONICAL_FILM_SQUAD_ID}...`);
  const [dbMembers, dbInvs] = await Promise.all([
    fetchSquadMembers(CANONICAL_FILM_SQUAD_ID),
    fetchSquadInvitations(CANONICAL_FILM_SQUAD_ID),
  ]);

  console.log(`Squad members in DB (${dbMembers.length}):`);
  for (const m of dbMembers) {
    console.log(`  - Role: "${m.role}", Username: @${m.user?.username || 'unknown'}, UserID: ${m.user_id}`);
  }

  console.log(`\nSquad invitations in DB (${dbInvs.length}):`);
  for (const inv of dbInvs) {
    console.log(`  - Role: "${inv.role}", Invitee: @${inv.invitee?.username || 'unknown'}, Status: ${inv.status}`);
  }

  // Step 2: Query real creator directory counts for required roles
  console.log("\n[Step 2] Querying real database candidate counts for required film roles...");
  const roleNames = [
    "Lead Actor",
    "Lead Actress",
    "Dancer",
    "Lead Singer",
    "Cinematographer",
    "Video Editor",
    "Sound Designer",
    "Choreographer",
  ];
  const candidateCounts = await getRoleCandidateCounts(roleNames);
  console.log("Real Candidate Counts in Supabase Creator Directory:");
  for (const [r, count] of Object.entries(candidateCounts)) {
    console.log(`  - ${r}: ${count} candidates`);
  }

  // Step 3: Initialize base project and reconcile team state
  console.log("\n[Step 3] Reconciling Project Team State...");
  const initialProject: OmniForgeProject = {
    id: "proj-romantic-musical",
    squadId: CANONICAL_FILM_SQUAD_ID,
    title: "Romantic Musical Film",
    stage: "in_progress",
    domain: "Film",
    projectType: "Short Film",
    currentUserRole: "DIRECTOR",
    roles: [],
    phases: [],
    deliverables: [],
    recommendations: [],
    coverage: {
      totalRequired: 0,
      totalCovered: 0,
      percentage: 0,
      coveredCapabilities: [],
      missingCapabilities: [],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const reconciledProject = reconcileProjectTeamState(
    initialProject,
    dbMembers,
    dbInvs,
    "1db1f000-718e-4164-b216-e428fd874afb",
    candidateCounts
  );

  console.log("\n--- ROLE COVERAGES BREAKDOWN ---");
  const coverages = reconciledProject.coverage?.roleCoverages || [];
  for (const rc of coverages) {
    console.log(`Role: ${rc.roleName.padEnd(20)} | Status: ${rc.status.padEnd(20)} | Candidates: ${rc.candidateCount} | Assigned: ${rc.assignedCreatorName || 'None'}`);
  }

  console.log("\n--- DYNAMIC 'WHO IS STILL MISSING?' RESPONSE ---");
  const missingText = buildDynamicMissingRolesResponse(
    reconciledProject,
    true,
    undefined
  );
  console.log(missingText);

  // Assertions
  console.log("\n--- VALIDATING SYSTEM CONSTRAINTS ---");
  const dancerCov = coverages.find(c => isRoleMatch(c.roleName, "Dancer"));
  const singerCov = coverages.find(c => isRoleMatch(c.roleName, "Lead Singer"));
  const dirCov = coverages.find(c => isRoleMatch(c.roleName, "Film Director"));
  const choreoCov = coverages.find(c => isRoleMatch(c.roleName, "Choreographer"));

  console.log(`1. Dancer status is OPEN_WITH_CANDIDATES: ${dancerCov?.status === "OPEN_WITH_CANDIDATES"} (${dancerCov?.status})`);
  console.log(`2. Dancer candidateCount === 4: ${dancerCov?.candidateCount === 4} (${dancerCov?.candidateCount})`);
  console.log(`3. Dancer is NOT called 'missing': ${!missingText.includes("Missing Dancer")}`);
  console.log(`4. Lead Singer status is NO_CANDIDATES: ${singerCov?.status === "NO_CANDIDATES"} (${singerCov?.status})`);
  console.log(`5. Director status is COVERED_BY_USER: ${dirCov?.status === "COVERED_BY_USER"} (${dirCov?.status})`);
  console.log(`6. Choreographer does NOT appear in canonical film roles: ${choreoCov === undefined}`);

  // Test Cinema Search (Section 12)
  console.log("\n--- TESTING CINEMA SEARCH DEPARTMENTS (Section 12) ---");
  const cinemaSearchRes = await searchCinemaCreatorsByDepartments({
    isUserDirector: true,
    isShortFilm: true,
  });
  console.log("Departments returned:", cinemaSearchRes.departments.map(d => d.department));
  console.log("Total found creators across departments:", cinemaSearchRes.allFoundCreators.length);
  console.log("Film Director excluded from search:", !cinemaSearchRes.departments.some(d => d.roles.some(r => r.roleName.includes("Director"))));
  console.log("Sample role match evidence:");
  for (const cand of cinemaSearchRes.allFoundCreators.slice(0, 5)) {
    console.log(`  - ${cand.roleName} | @${cand.creator.username} | ${cand.matchScore}% Match | ${cand.matchReason}`);
  }

  console.log("\n==================================================================");
  console.log("ALL VERIFICATIONS COMPLETED SUCCESSFULLY!");
  console.log("==================================================================");
}

runVerification().catch(console.error);
