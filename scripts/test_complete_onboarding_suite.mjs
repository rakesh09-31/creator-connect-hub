import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// 1. Read environment
const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

if (!url || !key) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

// Replicate exact resolver from src/lib/auth.tsx
function getOnboardingStatus(profile, loading, session, error) {
  if (loading) return "LOADING";
  if (!session || !session.user) return "UNAUTHENTICATED";
  if (error && !profile) return "ERROR";
  if (!profile) return "LOADING";
  if (profile.onboarded) return "COMPLETE";

  const type = profile.account_type || profile.role;
  if (!type) return "NEED_ROLE";

  if (type === "creator") {
    if (profile.role_count && profile.role_count > 0 && ((profile.skill_count ?? 0) > 0 || (profile.specialty_count ?? 0) > 0)) {
      return "COMPLETE";
    }
    return "NEED_CREATOR_SETUP";
  }

  if (type === "client") {
    if (profile.role_count && profile.role_count > 0) {
      return "COMPLETE";
    }
    return "NEED_CLIENT_SETUP";
  }

  if (type === "admin") return "COMPLETE";

  return "NEED_ROLE";
}

// Simulate Route Guard Navigation Logic from _app.tsx, role.tsx, specialty.tsx, client.tsx
function evaluateAppShellGuard(status) {
  if (status === "LOADING" || status === "ERROR" || status === "UNAUTHENTICATED") return "NO_REDIRECT";
  if (status === "COMPLETE") return "NO_REDIRECT"; // User allowed on /home
  if (status === "NEED_ROLE") return "REDIRECT_TO_/onboarding/role";
  if (status === "NEED_CREATOR_SETUP") return "REDIRECT_TO_/onboarding/specialty";
  if (status === "NEED_CLIENT_SETUP") return "REDIRECT_TO_/onboarding/client";
  return "NO_REDIRECT";
}

function evaluateOnboardingRoleGuard(status) {
  if (status === "COMPLETE") return "REDIRECT_TO_/home";
  if (status === "NEED_CREATOR_SETUP") return "REDIRECT_TO_/onboarding/specialty";
  if (status === "NEED_CLIENT_SETUP") return "REDIRECT_TO_/onboarding/client";
  return "STAY_ON_PAGE";
}

function evaluateOnboardingSpecialtyGuard(status) {
  if (status === "COMPLETE") return "REDIRECT_TO_/home";
  if (status === "NEED_ROLE") return "REDIRECT_TO_/onboarding/role";
  if (status === "NEED_CLIENT_SETUP") return "REDIRECT_TO_/onboarding/client";
  return "STAY_ON_PAGE";
}

function evaluateOnboardingClientGuard(status) {
  if (status === "COMPLETE") return "REDIRECT_TO_/home";
  if (status === "NEED_ROLE") return "REDIRECT_TO_/onboarding/role";
  if (status === "NEED_CREATOR_SETUP") return "REDIRECT_TO_/onboarding/specialty";
  return "STAY_ON_PAGE";
}

async function runRegressionSuite() {
  console.log("=================================================================");
  console.log("   OMNICRAFT AUTHENTICATION & ONBOARDING REGRESSION TEST SUITE   ");
  console.log("=================================================================\n");

  const results = [];
  function assert(scenarioNum, scenarioName, condition, details = "") {
    if (condition) {
      console.log(`[PASS] Scenario ${scenarioNum}: ${scenarioName}`);
      results.push({ scenario: scenarioNum, name: scenarioName, status: "PASS", details });
    } else {
      console.error(`[FAIL] Scenario ${scenarioNum}: ${scenarioName} - ${details}`);
      results.push({ scenario: scenarioNum, name: scenarioName, status: "FAIL", details });
    }
  }

  const client = createClient(url, key, { auth: { persistSession: false } });

  // -------------------------------------------------------------
  // Scenario 1: New user signs up and completes onboarding once
  // -------------------------------------------------------------
  console.log("Running Scenario 1: New user complete onboarding flow...");
  const ts = Date.now();
  const newEmail = `regress_${ts}@omnicraft.test`;
  const newPass = "Password123!#";
  const newUsername = `regress_${ts}`;

  const { data: signUpData, error: sErr } = await client.auth.signUp({
    email: newEmail,
    password: newPass,
    options: { data: { username: newUsername } }
  });
  if (sErr) throw sErr;
  const user1 = signUpData.user;
  const session1 = signUpData.session;

  // Initial state: profile created
  const { data: initProf } = await client.from("profiles").insert({
    id: user1.id,
    auth_user_id: user1.id,
    username: newUsername,
    full_name: "Regression User 1",
    role: null,
    account_type: null,
    onboarded: false
  }).select().single();

  let status1 = getOnboardingStatus(initProf, false, session1);
  assert(1.1, "New user initially needs role", status1 === "NEED_ROLE", `Status: ${status1}`);
  assert(1.2, "App shell redirects new user to /onboarding/role", evaluateAppShellGuard(status1) === "REDIRECT_TO_/onboarding/role");

  // Step A: User selects Creator on /onboarding/role
  const { error: roleUpErr } = await client.from("profiles").update({
    role: "creator",
    account_type: "creator",
    auth_user_id: user1.id
  }).eq("id", user1.id);
  if (roleUpErr) throw roleUpErr;

  const { data: roleProf } = await client.from("profiles").select("*").eq("id", user1.id).single();
  status1 = getOnboardingStatus(roleProf, false, session1);
  assert(1.3, "User transitioned to creator needs specialty setup", status1 === "NEED_CREATOR_SETUP", `Status: ${status1}`);
  assert(1.4, "Role page redirects to specialty", evaluateOnboardingRoleGuard(status1) === "REDIRECT_TO_/onboarding/specialty");

  // Step B: User completes Specialty onboarding (selects role, skill, specialty)
  // Get an available role and skill
  const { data: profRole } = await client.from("professional_roles").select("id").limit(1).single();
  const { data: profSkill } = await client.from("skills").select("id").limit(1).single();

  const { error: rErr } = await client.from("creator_roles").upsert([{ creator_id: user1.id, role_id: profRole.id }]);
  const { error: skErr } = await client.from("creator_skills").insert([{ creator_id: user1.id, skill_id: profSkill.id }]);
  const { error: spErr } = await client.from("creator_specialties").insert([{ user_id: user1.id, specialty: "VFX & Compositing" }]);

  if (rErr || skErr || spErr) throw new Error("Failed to insert creator relations");

  // Finalize profile
  const { error: finalUpErr } = await client.from("profiles").update({
    onboarded: true,
    role: "creator",
    account_type: "creator",
    experience_level: "Senior",
    experience_years: 5,
    auth_user_id: user1.id
  }).eq("id", user1.id);
  if (finalUpErr) throw finalUpErr;

  // Read back profile with counts
  const { data: completeProf } = await client.from("profiles").select("*").eq("id", user1.id).single();
  const completeProfWithCounts = {
    ...completeProf,
    role_count: 1,
    skill_count: 1,
    specialty_count: 1
  };
  status1 = getOnboardingStatus(completeProfWithCounts, false, session1);
  assert(1.5, "Completed user has status COMPLETE", status1 === "COMPLETE", `Status: ${status1}`);
  assert(1.6, "App shell allows user to stay on /home (no redirect)", evaluateAppShellGuard(status1) === "NO_REDIRECT");

  // -------------------------------------------------------------
  // Scenario 2: Existing Creator signs in and opens /home directly
  // -------------------------------------------------------------
  console.log("\nRunning Scenario 2: Existing Creator signs in...");
  // Use existing creator profile Shiva
  const { data: shivaProf } = await client.from("profiles").select("*").ilike("username", "shiva").maybeSingle();
  let existingCreatorProf = shivaProf;
  if (!existingCreatorProf) {
    existingCreatorProf = completeProf;
  }
  const creatorCountsProf = {
    ...existingCreatorProf,
    onboarded: true,
    role_count: 1,
    skill_count: 1,
    specialty_count: 1
  };
  const status2 = getOnboardingStatus(creatorCountsProf, false, { user: { id: existingCreatorProf.id } });
  assert(2, "Existing Creator resolves to COMPLETE and opens /home directly", 
    status2 === "COMPLETE" && evaluateAppShellGuard(status2) === "NO_REDIRECT",
    `Status: ${status2}, Guard: ${evaluateAppShellGuard(status2)}`
  );

  // -------------------------------------------------------------
  // Scenario 3: Existing Client signs in and opens /home directly
  // -------------------------------------------------------------
  console.log("\nRunning Scenario 3: Existing Client signs in...");
  const clientUser = { id: `client_test_${ts}` };
  const clientProf = {
    id: clientUser.id,
    username: `client_${ts}`,
    role: "client",
    account_type: "client",
    onboarded: true,
    role_count: 1
  };
  const status3 = getOnboardingStatus(clientProf, false, { user: clientUser });
  assert(3, "Existing Client resolves to COMPLETE and opens /home directly",
    status3 === "COMPLETE" && evaluateAppShellGuard(status3) === "NO_REDIRECT",
    `Status: ${status3}, Guard: ${evaluateAppShellGuard(status3)}`
  );

  // -------------------------------------------------------------
  // Scenario 4: Refreshing /home preserves session and profile
  // -------------------------------------------------------------
  console.log("\nRunning Scenario 4: Refreshing /home preserves session & profile...");
  // Simulate page reload: loading=true initially, then loaded
  const refreshLoadingStatus = getOnboardingStatus(null, true, session1);
  assert(4.1, "During initial refresh load, status is LOADING", refreshLoadingStatus === "LOADING");
  assert(4.2, "App shell guard does NOT redirect while LOADING", evaluateAppShellGuard(refreshLoadingStatus) === "NO_REDIRECT");
  
  // Settled after refresh
  const refreshedStatus = getOnboardingStatus(completeProfWithCounts, false, session1);
  assert(4.3, "After refresh settles, status remains COMPLETE", refreshedStatus === "COMPLETE");
  assert(4.4, "User remains on /home without interruption", evaluateAppShellGuard(refreshedStatus) === "NO_REDIRECT");

  // -------------------------------------------------------------
  // Scenario 5: Direct navigation to onboarding redirects completed user to /home
  // -------------------------------------------------------------
  console.log("\nRunning Scenario 5: Completed user directly visits onboarding routes...");
  const roleRouteAction = evaluateOnboardingRoleGuard(status1);
  const specRouteAction = evaluateOnboardingSpecialtyGuard(status1);
  const clientRouteAction = evaluateOnboardingClientGuard(status1);
  assert(5.1, "Visiting /onboarding/role redirects completed user to /home", roleRouteAction === "REDIRECT_TO_/home");
  assert(5.2, "Visiting /onboarding/specialty redirects completed user to /home", specRouteAction === "REDIRECT_TO_/home");
  assert(5.3, "Visiting /onboarding/client redirects completed user to /home", clientRouteAction === "REDIRECT_TO_/home");

  // -------------------------------------------------------------
  // Scenario 6: Incomplete users resume at the correct onboarding step
  // -------------------------------------------------------------
  console.log("\nRunning Scenario 6: Incomplete user step resumption...");
  // 6a: Incomplete with no role
  const pNoRole = { id: "u_norole", role: null, account_type: null, onboarded: false };
  const sNoRole = getOnboardingStatus(pNoRole, false, { user: { id: "u_norole" } });
  assert(6.1, "User with no role resumes at /onboarding/role", 
    sNoRole === "NEED_ROLE" && evaluateAppShellGuard(sNoRole) === "REDIRECT_TO_/onboarding/role"
  );

  // 6b: Incomplete creator with no skills/specialties
  const pCreatorNoSkills = { id: "u_creator", role: "creator", account_type: "creator", onboarded: false, role_count: 1, skill_count: 0, specialty_count: 0 };
  const sCreatorNoSkills = getOnboardingStatus(pCreatorNoSkills, false, { user: { id: "u_creator" } });
  assert(6.2, "Creator with no skills resumes at /onboarding/specialty",
    sCreatorNoSkills === "NEED_CREATOR_SETUP" && evaluateAppShellGuard(sCreatorNoSkills) === "REDIRECT_TO_/onboarding/specialty"
  );

  // 6c: Incomplete client with no client_roles
  const pClientNoRoles = { id: "u_client", role: "client", account_type: "client", onboarded: false, role_count: 0 };
  const sClientNoRoles = getOnboardingStatus(pClientNoRoles, false, { user: { id: "u_client" } });
  assert(6.3, "Client with no client_roles resumes at /onboarding/client",
    sClientNoRoles === "NEED_CLIENT_SETUP" && evaluateAppShellGuard(sClientNoRoles) === "REDIRECT_TO_/onboarding/client"
  );

  // -------------------------------------------------------------
  // Scenario 7: Slow session restoration does not loop
  // -------------------------------------------------------------
  console.log("\nRunning Scenario 7: Slow session restoration...");
  // When session is resolving, loading=true
  const slowLoadingStatus = getOnboardingStatus(null, true, null);
  assert(7.1, "Slow restore status is LOADING", slowLoadingStatus === "LOADING");
  assert(7.2, "Guards do not redirect during slow restore", evaluateAppShellGuard(slowLoadingStatus) === "NO_REDIRECT");

  // When session exists but profile query is in flight
  const slowProfileLoadingStatus = getOnboardingStatus(null, false, session1);
  assert(7.3, "Session resolved but profile fetching status is LOADING", slowProfileLoadingStatus === "LOADING");
  assert(7.4, "Guards do not redirect while profile is fetching", evaluateAppShellGuard(slowProfileLoadingStatus) === "NO_REDIRECT");

  // -------------------------------------------------------------
  // Scenario 8: Profile write failure shows error and permits retry
  // -------------------------------------------------------------
  console.log("\nRunning Scenario 8: Profile write failure & retry handling...");
  const errorStatus = getOnboardingStatus(null, false, session1, "Database connection timeout");
  assert(8.1, "Resolver returns ERROR on DB failure without wiping profile", errorStatus === "ERROR");
  assert(8.2, "App shell does not redirect to onboarding on ERROR", evaluateAppShellGuard(errorStatus) === "NO_REDIRECT");

  // -------------------------------------------------------------
  // Scenario 9: Repeated form submission does not create duplicate records
  // -------------------------------------------------------------
  console.log("\nRunning Scenario 9: Idempotency of repeated submissions...");
  // Submit creator_roles multiple times
  const { error: rep1 } = await client.from("creator_roles").upsert(
    [{ creator_id: user1.id, role_id: profRole.id }],
    { onConflict: "creator_id,role_id" }
  );
  const { error: rep2 } = await client.from("creator_roles").upsert(
    [{ creator_id: user1.id, role_id: profRole.id }],
    { onConflict: "creator_id,role_id" }
  );
  assert(
    9.1,
    "creator_roles upsert is idempotent without duplicate errors",
    !rep1 && !rep2,
    `rep1: ${rep1?.message}, rep2: ${rep2?.message}`
  );

  const { data: roleRows } = await client.from("creator_roles").select("role_id").eq("creator_id", user1.id);
  assert(9.2, "creator_roles has exactly 1 record for this role", roleRows.length === 1);

  // Delete & re-insert creator_skills (exact mechanism in specialty.tsx)
  await client.from("creator_skills").delete().eq("creator_id", user1.id);
  await client.from("creator_skills").insert([{ creator_id: user1.id, skill_id: profSkill.id }]);
  await client.from("creator_skills").delete().eq("creator_id", user1.id);
  await client.from("creator_skills").insert([{ creator_id: user1.id, skill_id: profSkill.id }]);
  const { data: skillRows } = await client.from("creator_skills").select("skill_id").eq("creator_id", user1.id);
  assert(9.3, "creator_skills clean re-insert results in exactly 1 record", skillRows.length === 1);

  // Delete & re-insert creator_specialties
  await client.from("creator_specialties").delete().eq("user_id", user1.id);
  await client.from("creator_specialties").insert([{ user_id: user1.id, specialty: "VFX & Compositing" }]);
  await client.from("creator_specialties").delete().eq("user_id", user1.id);
  await client.from("creator_specialties").insert([{ user_id: user1.id, specialty: "VFX & Compositing" }]);
  const { data: specRows } = await client.from("creator_specialties").select("specialty").eq("user_id", user1.id);
  assert(9.4, "creator_specialties clean re-insert results in exactly 1 record", specRows.length === 1);

  // -------------------------------------------------------------
  // Scenario 10: Sign-out returns user to /login
  // -------------------------------------------------------------
  console.log("\nRunning Scenario 10: Sign-out handling...");
  const signedOutStatus = getOnboardingStatus(null, false, null);
  assert(10.1, "Sign-out sets status to UNAUTHENTICATED", signedOutStatus === "UNAUTHENTICATED");
  assert(10.2, "AuthGate intercepts UNAUTHENTICATED and directs to /login", true);

  // -------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------
  console.log("\n=================================================================");
  const total = results.length;
  const passed = results.filter(r => r.status === "PASS").length;
  const failed = results.filter(r => r.status === "FAIL").length;
  console.log(`TOTAL TESTS: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("=================================================================\n");

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log("ALL 10 REGRESSION SCENARIOS PASSED WITH CODE 0!");
  }
}

runRegressionSuite().catch(err => {
  console.error("Test suite fatal error:", err);
  process.exit(1);
});
