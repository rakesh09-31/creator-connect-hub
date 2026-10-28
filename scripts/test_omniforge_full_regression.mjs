import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://mouvlzrsaxhczywkrwyq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_nBxswRGxXCgpKQZLw2sZvA_ZZeNFuDn";
const LOCAL_AI_URL = "http://127.0.0.1:8001/chat";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testFastAPIChat(message, history = [], projectContext = null) {
  const res = await fetch(LOCAL_AI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      history,
      project_context: projectContext,
      stream: false,
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return await res.json();
}

async function runRegressionSuite() {
  console.log("==================================================");
  console.log("RUNNING OMNIFORGE ORCHESTRATOR REGRESSION SUITE");
  console.log("==================================================\n");

  const results = [];

  // TEST 1: Greeting
  {
    const res = await testFastAPIChat("hlo");
    const pass = res.intent === "GREETING" && res.matching_action === "NONE" && !res.creatorCards;
    results.push({ test: "TEST 1: 'hlo'", pass, details: `intent=${res.intent}, action=${res.matching_action}` });
  }

  // TEST 2: Knowledge
  {
    const res = await testFastAPIChat("what do you know");
    const pass = res.intent === "KNOWLEDGE" && res.matching_action === "NONE";
    results.push({ test: "TEST 2: 'what do you know'", pass, details: `intent=${res.intent}, action=${res.matching_action}` });
  }

  // TEST 3: Capability query (Do NOT search database)
  {
    const res = await testFastAPIChat("do you find creators and clients?");
    const pass = res.intent === "CAPABILITY_QUERY" && res.matching_action === "NONE";
    results.push({ test: "TEST 3: 'do you find creators and clients?'", pass, details: `intent=${res.intent}, action=${res.matching_action}` });
  }

  // TEST 3b: User problem 1 ("so can you find the creators and clients")
  {
    const res = await testFastAPIChat("so can you find the creators and clients");
    const pass = res.intent === "CAPABILITY_QUERY" && res.matching_action === "NONE";
    results.push({ test: "USER PROBLEM 1: 'so can you find the creators and clients'", pass, details: `intent=${res.intent}, action=${res.matching_action}` });
  }

  // TEST 6: User problem 2 (Clarification/Negation - "i dont ask find the person i asked you to do you find or not")
  {
    const res = await testFastAPIChat("i dont ask find the person i asked you to do you find or not");
    const pass = res.intent === "CLARIFICATION" && res.matching_action === "NONE";
    results.push({ test: "USER PROBLEM 2: 'i dont ask find the person i asked you to do you find or not'", pass, details: `intent=${res.intent}, action=${res.matching_action}` });
  }

  // TEST 4: "find all the video editors in omnicraft" (Must set scope=ALL, target_role=Video Editor, matching_action=SEARCH_CREATORS)
  {
    const res = await testFastAPIChat("find all the video editors in omnicraft");
    const pass = res.intent === "CREATOR_SEARCH" && res.matching_action === "SEARCH_CREATORS" && res.target_role === "Video Editor" && res.scope === "ALL";
    results.push({ test: "TEST 4: 'find all the video editors in omnicraft'", pass, details: `intent=${res.intent}, action=${res.matching_action}, role=${res.target_role}, scope=${res.scope}` });
  }

  // TEST 5: "find an actor for my short film"
  {
    const res = await testFastAPIChat("find an actor for my short film", [], { title: "Village Singer", domain: "Film" });
    const pass = res.intent === "CREATOR_SEARCH" && res.matching_action === "SEARCH_CREATORS" && res.target_role === "Actor";
    results.push({ test: "TEST 5: 'find an actor for my short film'", pass, details: `intent=${res.intent}, action=${res.matching_action}, role=${res.target_role}` });
  }

  // TEST 9: "how do I hire a squad?" (Explain only, NO DB action)
  {
    const res = await testFastAPIChat("how do I hire a squad?");
    const pass = res.intent === "HOW_TO" && res.matching_action === "NONE";
    results.push({ test: "TEST 9: 'how do I hire a squad?'", pass, details: `intent=${res.intent}, action=${res.matching_action}` });
  }

  // TEST 10: "hire this squad"
  {
    const res = await testFastAPIChat("hire this squad");
    const pass = res.intent === "HIRE_SQUAD" && res.matching_action === "HIRE_SQUAD";
    results.push({ test: "TEST 10: 'hire this squad'", pass, details: `intent=${res.intent}, action=${res.matching_action}` });
  }

  // TEST 11: "find clients looking for video editors"
  {
    const res = await testFastAPIChat("find clients looking for video editors");
    const pass = res.intent === "CLIENT_SEARCH" && res.matching_action === "SEARCH_CLIENTS";
    results.push({ test: "TEST 11: 'find clients looking for video editors'", pass, details: `intent=${res.intent}, action=${res.matching_action}` });
  }

  // TEST 11b: "find squads"
  {
    const res = await testFastAPIChat("find squads");
    const pass = res.intent === "SQUAD_SEARCH" && res.matching_action === "SEARCH_SQUADS";
    results.push({ test: "TEST 11b: 'find squads'", pass, details: `intent=${res.intent}, action=${res.matching_action}` });
  }

  // TEST 12: "show me more"
  {
    const res = await testFastAPIChat("show me more");
    const pass = res.intent === "FOLLOW_UP_PAGINATION" && res.matching_action === "PAGINATE_SEARCH";
    results.push({ test: "TEST 12: 'show me more'", pass, details: `intent=${res.intent}, action=${res.matching_action}` });
  }

  // TEST 13: "only experienced editors"
  {
    const res = await testFastAPIChat("only experienced editors");
    const pass = res.intent === "REFINE_SEARCH" && res.matching_action === "REFINE_SEARCH";
    results.push({ test: "TEST 13: 'only experienced editors'", pass, details: `intent=${res.intent}, action=${res.matching_action}` });
  }

  // TEST 14: "invite Ramu"
  {
    const res = await testFastAPIChat("invite Ramu");
    const pass = res.intent === "INVITE_CREATOR" && res.matching_action === "INVITE_CREATOR" && res.target_name === "Ramu";
    results.push({ test: "TEST 14: 'invite Ramu'", pass, details: `intent=${res.intent}, action=${res.matching_action}, target=${res.target_name}` });
  }

  // TEST 15: "what should I improve in my project?"
  {
    const res = await testFastAPIChat("what should I improve in my project?");
    const pass = res.intent === "PROJECT_ANALYSIS" && res.matching_action === "NONE";
    results.push({ test: "TEST 15: 'what should I improve in my project?'", pass, details: `intent=${res.intent}, action=${res.matching_action}` });
  }

  console.log("--------------------------------------------------");
  let allPass = true;
  for (const r of results) {
    const status = r.pass ? "[PASS]" : "[FAIL]";
    if (!r.pass) allPass = false;
    console.log(`${status} ${r.test} => ${r.details}`);
  }
  console.log("--------------------------------------------------");
  console.log(allPass ? "ALL 15 REGRESSION TESTS PASSED!" : "SOME TESTS FAILED!");

  // Now test database queries for ALL video editors, squads, and jobs
  console.log("\n==================================================");
  console.log("VERIFYING SUPABASE DATABASE DATA DISCOVERY");
  console.log("==================================================");

  const { data: profiles } = await supabase.from("profiles").select("id, username, full_name, role, bio").limit(500);
  const { data: roles } = await supabase.from("creator_roles").select("creator_id, professional_roles(name)");
  const { data: specs } = await supabase.from("creator_specialties").select("user_id, specialty");
  const { data: skills } = await supabase.from("creator_skills").select("creator_id, skills(name)");

  const editorProfiles = profiles.filter((p) => {
    const r = (p.role || "").toLowerCase();
    const b = (p.bio || "").toLowerCase();
    const cr = (roles || []).filter((x) => x.creator_id === p.id).map((x) => x.professional_roles?.name?.toLowerCase() || "");
    const cs = (specs || []).filter((x) => x.user_id === p.id).map((x) => (x.specialty || "").toLowerCase());
    const sk = (skills || []).filter((x) => x.creator_id === p.id).map((x) => (x.skills?.name || "").toLowerCase());
    return r.includes("editor") || b.includes("editor") || cr.some((x) => x.includes("editor")) || cs.some((x) => x.includes("edit")) || sk.some((x) => x.includes("edit") || x.includes("premiere") || x.includes("davinci"));
  });

  console.log(`\nReal Video Editors in DB: ${editorProfiles.length} profiles discovered.`);
  console.log("Discovered Video Editors Sample:");
  editorProfiles.slice(0, 5).forEach((e, i) => console.log(`  ${i + 1}. ${e.full_name || e.username} (@${e.username}) - role: ${e.role}`));

  const { data: squads, count: squadCount } = await supabase.from("squads").select("id, name, specialty, owner_id", { count: "exact" });
  console.log(`\nReal Squads in DB: ${squads?.length} squads available.`);
  console.log("Discovered Squads Sample:");
  squads?.slice(0, 3).forEach((s, i) => console.log(`  ${i + 1}. ${s.name} - specialty: ${s.specialty}`));

  const { data: jobs, count: jobCount } = await supabase.from("jobs").select("id, title, category, budget", { count: "exact" });
  console.log(`\nReal Client Jobs in DB: ${jobs?.length} open opportunities.`);
  console.log("Discovered Jobs Sample:");
  jobs?.slice(0, 3).forEach((j, i) => console.log(`  ${i + 1}. ${j.title} - category: ${j.category}, budget: ${j.budget}`));

  console.log("\n==================================================");
  console.log("VERIFICATION COMPLETE!");
  console.log("==================================================");
}

runRegressionSuite().catch(console.error);
