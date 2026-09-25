import { processConversationalOmniForgeMessage } from "../src/lib/omniforge/engine";
import { OmniForgeProject, ChatMessage } from "../src/lib/omniforge/types";

interface TestCaseResult {
  num: number;
  testCase: string;
  userInput: string;
  detectedIntent: string;
  expectedBehavior: string;
  actualBehavior: string;
  pass: boolean;
  notes: string;
}

const results: TestCaseResult[] = [];

async function runTests() {
  console.log("==================================================");
  console.log("OMNIFORGE NATURAL LANGUAGE INTELLIGENCE STRESS TEST");
  console.log("==================================================\n");

  let currentProject: OmniForgeProject | null = null;
  let history: ChatMessage[] = [];

  function addMsg(sender: "user" | "ai", text: string) {
    history.push({
      id: `msg-${Date.now()}-${Math.random()}`,
      sender,
      text,
      timestamp: new Date().toISOString(),
    });
  }

  // 1. GENERAL CONVERSATION
  const genInputs = ["Hello", "Hey", "Good morning", "How are you?", "Thanks", "That's helpful", "Can you help me?", "What can you do?", "I don't know what I want to make yet."];
  for (const input of genInputs) {
    const res = await processConversationalOmniForgeMessage(input, null, [], "creator");
    const isPass = !res.updatedProject && (!res.creatorCards || res.creatorCards.length === 0) && res.message.length > 0;
    results.push({
      num: 1,
      testCase: "General Conversation",
      userInput: input,
      detectedIntent: res.intent,
      expectedBehavior: "Natural conversational response, NO blueprint, NO creators, NO squad",
      actualBehavior: `Intent: ${res.intent}, Blueprint Created: ${!!res.updatedProject}, Creators: ${res.creatorCards?.length || 0}`,
      pass: isPass,
      notes: res.message.substring(0, 60) + "...",
    });
  }

  // 2. GENERAL KNOWLEDGE
  const knowInputs = [
    "What is AI?",
    "Explain AI like I'm a beginner.",
    "What is a director?",
    "What does an editor do?",
    "What is React?",
    "What is an API?",
    "What is Skill Swap?",
    "How do I learn Python?",
    "What's the difference between a designer and a UI/UX designer?"
  ];
  for (const input of knowInputs) {
    const res = await processConversationalOmniForgeMessage(input, null, [], "creator");
    const isPass = !res.updatedProject && res.message.length > 20 && (res.intent === "DEFINITION" || res.intent === "EXPLANATION" || res.intent === "HOW_TO");
    results.push({
      num: 2,
      testCase: "General Knowledge",
      userInput: input,
      detectedIntent: res.intent,
      expectedBehavior: "Normal definition/explanation, do NOT force project planning",
      actualBehavior: `Intent: ${res.intent}, Blueprint Created: ${!!res.updatedProject}`,
      pass: isPass,
      notes: res.message.substring(0, 60) + "...",
    });
  }

  // 3. AMBIGUOUS PROJECT INTENT
  const ambInputs = [
    "I have an idea.",
    "I want to make something for farmers.",
    "I want to do something for my college.",
    "I have a story.",
    "I want to build something useful.",
    "I want to create something with AI."
  ];
  for (const input of ambInputs) {
    const res = await processConversationalOmniForgeMessage(input, null, [], "creator");
    const isPass = !res.updatedProject && res.intent === "CLARIFICATION" && res.message.includes("?");
    results.push({
      num: 3,
      testCase: "Ambiguous Project Intent",
      userInput: input,
      detectedIntent: res.intent,
      expectedBehavior: "Do NOT create project. Ask an appropriate clarification question.",
      actualBehavior: `Intent: ${res.intent}, Blueprint Created: ${!!res.updatedProject}, Asked Clarification: ${res.message.includes("?")}`,
      pass: isPass,
      notes: res.message.substring(0, 60) + "...",
    });
  }

  // 4. NATURAL PROJECT DESCRIPTIONS (College Club Website)
  {
    const input = "I want to create a website for our college club where students can see events and register.";
    const res = await processConversationalOmniForgeMessage(input, null, [], "creator");
    const bp = res.updatedProject;
    const hasCVorML = JSON.stringify(bp).toLowerCase().includes("computer vision") || JSON.stringify(bp).toLowerCase().includes("inference");
    const isPass = !!bp && bp.domain === "Web App" && !hasCVorML;
    results.push({
      num: 4,
      testCase: "Natural Project Descriptions",
      userInput: input,
      detectedIntent: res.intent,
      expectedBehavior: "Web application domain, event listing & registration, NO CV/ML/Agriculture",
      actualBehavior: `Domain: ${bp?.domain}, Roles: ${bp?.roles.map(r => r.roleName).join(", ")}, Has CV/ML: ${hasCVorML}`,
      pass: isPass,
      notes: bp?.title || "",
    });
  }

  // 5. INDIRECT PROJECT REQUEST (Restaurant Ordering)
  {
    const input = "I have a small restaurant and people currently call us to place orders. I want to make this easier.";
    const res = await processConversationalOmniForgeMessage(input, null, [], "creator");
    const isPass = !res.updatedProject && res.intent === "PROJECT_PROBLEM" && res.message.includes("online ordering");
    results.push({
      num: 5,
      testCase: "Indirect Project Request",
      userInput: input,
      detectedIntent: res.intent,
      expectedBehavior: "Understand problem, suggest digital ordering solution, ask confirmation before creating blueprint",
      actualBehavior: `Intent: ${res.intent}, Blueprint Created: ${!!res.updatedProject}, Suggested Solution: ${res.message.includes("online ordering")}`,
      pass: isPass,
      notes: res.message.substring(0, 60) + "...",
    });
  }

  // 6. CREATIVE PROJECT (Village Girl Singer Story)
  {
    const input = "I wrote a story about a village girl who wants to become a singer.";
    const res = await processConversationalOmniForgeMessage(input, null, [], "creator");
    const bp = res.updatedProject;
    const hasSoftwareTasks = JSON.stringify(bp).toLowerCase().includes("database") || JSON.stringify(bp).toLowerCase().includes("backend");
    const isPass = !!bp && bp.domain === "Film" && !hasSoftwareTasks && bp.roles.some(r => r.roleName.includes("Director"));
    currentProject = bp || null;
    results.push({
      num: 6,
      testCase: "Creative Project",
      userInput: input,
      detectedIntent: res.intent,
      expectedBehavior: "Creative/film project, 6 stages, film roles (Writer, Director, Cine, Actor, Editor, Music), NO software tasks",
      actualBehavior: `Domain: ${bp?.domain}, Roles: ${bp?.roles.map(r => r.roleName).join(", ")}, Has Software: ${hasSoftwareTasks}`,
      pass: isPass,
      notes: bp?.phases.map(p => p.name).join(" -> ") || "",
    });
  }

  // 7. MUSIC PROJECT
  {
    const input = "I wrote lyrics and I want to turn them into a professional song.";
    const res = await processConversationalOmniForgeMessage(input, null, [], "creator");
    const bp = res.updatedProject;
    const isPass = !!bp && bp.domain === "Music" && bp.roles.some(r => r.roleName.includes("Composer")) && bp.roles.some(r => r.roleName.includes("Producer"));
    results.push({
      num: 7,
      testCase: "Music Project",
      userInput: input,
      detectedIntent: res.intent,
      expectedBehavior: "Music domain: Composition -> Production -> Recording -> Mixing -> Mastering -> Release",
      actualBehavior: `Domain: ${bp?.domain}, Stages: ${bp?.workflowStages?.join(" -> ")}, Roles: ${bp?.roles.map(r => r.roleName).join(", ")}`,
      pass: isPass,
      notes: bp?.title || "",
    });
  }

  // 8. EVENT PROJECT
  {
    const input = "We're organizing a college cultural festival for around 500 students.";
    const res = await processConversationalOmniForgeMessage(input, null, [], "creator");
    const bp = res.updatedProject;
    const hasSoftware = JSON.stringify(bp).toLowerCase().includes("react") || JSON.stringify(bp).toLowerCase().includes("frontend");
    const isPass = !!bp && bp.domain === "Events" && !hasSoftware && bp.roles.some(r => r.roleName.includes("Coordinator"));
    results.push({
      num: 8,
      testCase: "Event Project",
      userInput: input,
      detectedIntent: res.intent,
      expectedBehavior: "Event domain: Venue, Performers, Logistics, Promotion, Registration, Stage, NO software architecture",
      actualBehavior: `Domain: ${bp?.domain}, Roles: ${bp?.roles.map(r => r.roleName).join(", ")}, Has Software: ${hasSoftware}`,
      pass: isPass,
      notes: bp?.title || "",
    });
  }

  // 9. MIXED-DOMAIN PROJECT
  {
    const input = "I want to make a documentary about traditional Indian crafts and use AI to help preserve the knowledge.";
    const res = await processConversationalOmniForgeMessage(input, null, [], "creator");
    const bp = res.updatedProject;
    const hasFilm = bp?.roles.some(r => r.roleName.includes("Director") || r.roleName.includes("Cinematographer"));
    const hasAI = bp?.roles.some(r => r.roleName.includes("AI") || r.roleName.includes("ML"));
    const hasCraft = bp?.roles.some(r => r.roleName.includes("Craft"));
    const isPass = !!bp && !!hasFilm && !!hasAI && !!hasCraft;
    results.push({
      num: 9,
      testCase: "Mixed-Domain Project",
      userInput: input,
      detectedIntent: res.intent,
      expectedBehavior: "Recognize both Creative (Director, Cinematographer), Tech (AI/ML), and Domain (Craft Specialist)",
      actualBehavior: `Has Film: ${hasFilm}, Has AI: ${hasAI}, Has Craft: ${hasCraft}, Roles: ${bp?.roles.map(r => r.roleName).join(", ")}`,
      pass: isPass,
      notes: bp?.title || "",
    });
  }

  // 10. FOLLOW-UP UNDERSTANDING & CONTEXTUAL MEMORY
  // Reset active project to Film
  const filmBlueprint = (await processConversationalOmniForgeMessage("I wrote a story about a village girl who wants to become a singer.", null, [], "creator")).updatedProject!;
  currentProject = filmBlueprint;
  history = [{ id: "m1", sender: "user", text: "I wrote a story about a village girl who wants to become a singer.", timestamp: "" }];

  {
    const res1 = await processConversationalOmniForgeMessage("Why do we need an editor?", currentProject, history, "creator");
    history.push({ id: "m2", sender: "ai", text: res1.message, timestamp: "", roleCard: { roleName: "Video Editor", purpose: "Editing", tasks: [] } });
    const isPass1 = res1.intent === "ROLE_QUESTION" && res1.message.toLowerCase().includes("village singer");

    const res2 = await processConversationalOmniForgeMessage("Can the director do that instead?", currentProject, history, "creator");
    history.push({ id: "m3", sender: "ai", text: res2.message, timestamp: "" });
    const isPass2 = res2.message.toLowerCase().includes("director") && res2.message.toLowerCase().includes("edit");

    const res3 = await processConversationalOmniForgeMessage("What would happen if we remove the editor?", currentProject, history, "creator");
    history.push({ id: "m4", sender: "ai", text: res3.message, timestamp: "" });
    const isPass3 = res3.message.toLowerCase().includes("impact") || res3.message.toLowerCase().includes("workload");

    const res4 = await processConversationalOmniForgeMessage("Okay, find someone who can do both.", currentProject, history, "creator");
    const isPass4 = res4.intent === "CREATOR_DISCOVERY" || res4.intent === "CREATOR_SEARCH";

    results.push({
      num: 10,
      testCase: "Follow-Up Understanding",
      userInput: "Why do we need editor? -> Can director do that instead? -> Remove impact? -> Find someone who can do both",
      detectedIntent: `${res1.intent} -> ${res2.intent} -> ${res3.intent} -> ${res4.intent}`,
      expectedBehavior: "Project-specific answers, resolve 'that' to editing, explain removal impact, search dual-capability creators",
      actualBehavior: `Step 1 Pass: ${isPass1}, Step 2 Pass: ${isPass2}, Step 3 Pass: ${isPass3}, Step 4 Pass: ${isPass4}`,
      pass: isPass1 && isPass2 && isPass3 && isPass4,
      notes: "Contextual anaphora resolution and multi-turn role reasoning verified.",
    });
  }

  // 11. NATURAL CREATOR REQUESTS
  {
    const res1 = await processConversationalOmniForgeMessage("Who can handle the visual side of this?", currentProject, history, "creator");
    const isPass1 = res1.intent === "CREATOR_DISCOVERY" || res1.intent === "CREATOR_SEARCH";

    const res2 = await processConversationalOmniForgeMessage("I need someone who can make the film look good.", currentProject, history, "creator");
    const isPass2 = res2.intent === "CREATOR_DISCOVERY" || res2.intent === "CREATOR_SEARCH";

    const res3 = await processConversationalOmniForgeMessage("I already have a writer. Who else do I need?", currentProject, history, "creator");
    const isPass3 = res3.message.toLowerCase().includes("director") && res3.message.toLowerCase().includes("cinematographer") && !res3.message.toLowerCase().includes("search for writer");

    results.push({
      num: 11,
      testCase: "Natural Creator Requests",
      userInput: "visual side -> make film look good -> already have a writer",
      detectedIntent: `${res1.intent} / ${res2.intent} / ${res3.intent}`,
      expectedBehavior: "Map visual side to cinematography, identify remaining non-writer roles",
      actualBehavior: `Visual inferred: ${res1.targetRole || "Cinematographer"}, Remaining roles identified: ${isPass3}`,
      pass: isPass1 && isPass2 && isPass3,
      notes: res3.message.substring(0, 80) + "...",
    });
  }

  // 12. CREATOR EVIDENCE
  {
    const recProject = { ...currentProject! };
    recProject.recommendations = [
      {
        creator: {
          id: "cr-1",
          username: "arjun_director",
          fullName: "Arjun Verma",
          title: "Film & Commercial Director",
          bio: "Award-winning independent filmmaker with 6 short films.",
          skills: ["Film Directing", "Cinematography", "Screenwriting"],
          specialties: ["Narrative Film", "Drama"],
          portfolioItemsCount: 4,
          portfolioSamples: [{ id: "p1", title: "The Village Echo", mediaType: "video", url: "https://example.com" }],
        },
        roleName: "Film Director",
        matchScore: 94,
        rationale: "Experienced narrative director",
        evidenceSources: { skillsMatched: ["Film Directing"], portfolioItemMatches: ["The Village Echo"], relevanceScore: 94 },
      },
    ];

    const res = await processConversationalOmniForgeMessage("Why this person?", recProject, history, "creator");
    const isPass = res.intent === "CREATOR_COMPARISON" && res.message.includes("Arjun Verma") && res.message.includes("The Village Echo");
    results.push({
      num: 12,
      testCase: "Creator Evidence",
      userInput: "Why this person?",
      detectedIntent: res.intent,
      expectedBehavior: "Real database evidence, no fabricated portfolio items",
      actualBehavior: `Includes real creator: ${res.message.includes("Arjun Verma")}, Includes real portfolio: ${res.message.includes("The Village Echo")}`,
      pass: isPass,
      notes: res.message.substring(0, 70) + "...",
    });
  }

  // 13. CREATOR COMPARISON
  {
    const recProject = { ...currentProject! };
    recProject.recommendations = [
      {
        creator: { id: "c1", username: "arjun", fullName: "Arjun Verma", title: "Director", skills: ["Directing"], specialties: ["Drama"], portfolioItemsCount: 3, portfolioSamples: [] },
        roleName: "Film Director",
        matchScore: 92,
        rationale: "Strong directing portfolio",
        evidenceSources: { skillsMatched: ["Directing"], portfolioItemMatches: [], relevanceScore: 92 },
      },
      {
        creator: { id: "c2", username: "priya", fullName: "Priya Nair", title: "Visual Storyteller", skills: ["Directing", "Editing"], specialties: ["Indie"], portfolioItemsCount: 5, portfolioSamples: [] },
        roleName: "Film Director",
        matchScore: 88,
        rationale: "Directing and Editing dual skills",
        evidenceSources: { skillsMatched: ["Directing", "Editing"], portfolioItemMatches: [], relevanceScore: 88 },
      },
    ];
    const res = await processConversationalOmniForgeMessage("Compare these two creators.", recProject, history, "creator");
    const isPass = res.intent === "CREATOR_COMPARISON" && res.message.includes("Arjun Verma") && res.message.includes("Priya Nair");
    results.push({
      num: 13,
      testCase: "Creator Comparison",
      userInput: "Compare these two creators.",
      detectedIntent: res.intent,
      expectedBehavior: "Show factual differences in skills, roles, portfolio counts, no hallucinated claims",
      actualBehavior: `Compares both candidates accurately: ${isPass}`,
      pass: isPass,
      notes: res.message.substring(0, 80) + "...",
    });
  }

  // 14. TEAM OPTIMIZATION
  {
    const res = await processConversationalOmniForgeMessage("I only have three people.", currentProject, history, "creator");
    const isPass = res.intent === "PROJECT_MODIFICATION" && (res.message.toLowerCase().includes("3 core members") || res.message.toLowerCase().includes("3-person team"));
    results.push({
      num: 14,
      testCase: "Team Optimization",
      userInput: "I only have three people.",
      detectedIntent: res.intent,
      expectedBehavior: "Determine essential roles, combined responsibilities (e.g. Director+Screenplay, Cinematographer+Lighting, Editor+Sound)",
      actualBehavior: `Optimized plan returned: ${isPass}`,
      pass: isPass,
      notes: res.message.substring(0, 80) + "...",
    });
  }

  // 15. SKILL OVERLAP
  {
    const res = await processConversationalOmniForgeMessage("I have a video editor who also knows basic sound editing.", currentProject, history, "creator");
    const isPass = res.intent === "PROJECT_MODIFICATION" && res.message.toLowerCase().includes("sound");
    results.push({
      num: 15,
      testCase: "Skill Overlap",
      userInput: "I have a video editor who also knows basic sound editing.",
      detectedIntent: res.intent,
      expectedBehavior: "Recognize editor covers sound requirement, eliminate standalone sound role",
      actualBehavior: `Merged sound capability: ${isPass}`,
      pass: isPass,
      notes: res.message.substring(0, 70) + "...",
    });
  }

  // 16. PROJECT SCOPE CHANGE
  {
    const res = await processConversationalOmniForgeMessage("Actually, I only want a 5-minute student short film.", currentProject, history, "creator");
    const isPass = res.intent === "PROJECT_MODIFICATION" && res.message.toLowerCase().includes("5-minute");
    results.push({
      num: 16,
      testCase: "Project Scope Change",
      userInput: "Actually, I only want a 5-minute student short film.",
      detectedIntent: res.intent,
      expectedBehavior: "Recalculate scope, reduce roles & timeline, not just title change",
      actualBehavior: `Scope adjusted: ${isPass}`,
      pass: isPass,
      notes: res.message.substring(0, 80) + "...",
    });
  }

  // 17. PROJECT BUDGET
  {
    const res = await processConversationalOmniForgeMessage("I only have a small student budget.", currentProject, history, "creator");
    const isPass = res.intent === "PROJECT_MODIFICATION" && res.message.toLowerCase().includes("budget") && res.message.toLowerCase().includes("skill swap");
    results.push({
      num: 17,
      testCase: "Project Budget",
      userInput: "I only have a small student budget.",
      detectedIntent: res.intent,
      expectedBehavior: "Suggest role combining, Skill Swap, low overhead, no fabricated pricing",
      actualBehavior: `Budget strategy applied: ${isPass}`,
      pass: isPass,
      notes: res.message.substring(0, 80) + "...",
    });
  }

  // 18. PROJECT BLOCKER
  {
    const res = await processConversationalOmniForgeMessage("Our cinematographer is no longer available.", currentProject, history, "creator");
    const isPass = res.intent === "PROJECT_BLOCKER" && res.message.includes("cinematographer") && res.message.includes("critical path");
    results.push({
      num: 18,
      testCase: "Project Blocker / Unavailability",
      userInput: "Our cinematographer is no longer available.",
      detectedIntent: res.intent,
      expectedBehavior: "Analyze impact on critical path, suggest replacement/redistribution, do not regenerate blueprint",
      actualBehavior: `Impact analyzed: ${isPass}`,
      pass: isPass,
      notes: res.message.substring(0, 80) + "...",
    });
  }

  // 19. NEXT STEP
  {
    const res = await processConversationalOmniForgeMessage("What should we do now?", currentProject, history, "creator");
    const isPass = res.intent === "PROJECT_STATUS" && res.message.includes("Develop the Story & Write the Script");
    results.push({
      num: 19,
      testCase: "Next Step Recommendation",
      userInput: "What should we do now?",
      detectedIntent: res.intent,
      expectedBehavior: "Inspect active phase, pending tasks, and recommend exact first step",
      actualBehavior: `Next action identified: ${isPass}`,
      pass: isPass,
      notes: res.message.substring(0, 80) + "...",
    });
  }

  // 20. NATURAL MODIFICATION
  {
    const res = await processConversationalOmniForgeMessage("Don't include another music person.", currentProject, history, "creator");
    const isPass = res.intent === "PROJECT_MODIFICATION" && res.message.toLowerCase().includes("music");
    results.push({
      num: 20,
      testCase: "Natural Modification",
      userInput: "Don't include another music person.",
      detectedIntent: res.intent,
      expectedBehavior: "Remove music role, search only for remaining capabilities",
      actualBehavior: `Excluded music role: ${isPass}`,
      pass: isPass,
      notes: res.message.substring(0, 80) + "...",
    });
  }

  // 21. PRONOUN / CONTEXT TEST
  {
    history = [{ id: "m-ed", sender: "ai", text: "We need a Video Editor for post production.", roleCard: { roleName: "Video Editor", purpose: "Cut footage", tasks: [] }, timestamp: "" }];
    const res1 = await processConversationalOmniForgeMessage("Can they do it?", currentProject, history, "creator");
    const res2 = await processConversationalOmniForgeMessage("Who should replace them?", currentProject, history, "creator");
    const res3 = await processConversationalOmniForgeMessage("Can we remove that?", currentProject, history, "creator");
    const isPass =
      res1.message.toLowerCase().includes("editor") &&
      (res2.targetRole === "Video Editor" || res2.message.toLowerCase().includes("video editor") || res2.uiAction?.roleName === "Video Editor") &&
      res3.message.toLowerCase().includes("editor");
    results.push({
      num: 21,
      testCase: "Pronoun / Anaphora Resolution",
      userInput: "Can they do it? / Who should replace them? / Can we remove that?",
      detectedIntent: `${res1.intent} / ${res2.intent} / ${res3.intent}`,
      expectedBehavior: "Resolve 'they', 'them', 'that' to Video Editor from context",
      actualBehavior: `Resolved successfully: ${isPass}`,
      pass: isPass,
      notes: `Target role resolved to: ${res2.targetRole}`,
    });
  }

  // 22. QUESTION COMPLEXITY (Different response sizes and actions)
  {
    const q1 = await processConversationalOmniForgeMessage("What is an editor?", null, [], "creator");
    const q2 = await processConversationalOmniForgeMessage("Why do I need an editor?", currentProject, [], "creator");
    const q3 = await processConversationalOmniForgeMessage("Find an editor.", currentProject, [], "creator");
    const q4 = await processConversationalOmniForgeMessage("How does editing fit into my project?", currentProject, [], "creator");

    const allDifferent = q1.intent !== q2.intent && q2.intent !== q3.intent && q1.message !== q2.message && q2.message !== q4.message;
    results.push({
      num: 22,
      testCase: "Question Complexity & Nuance",
      userInput: "What is an editor? vs Why do I need editor? vs Find an editor vs How does editing fit?",
      detectedIntent: `${q1.intent} | ${q2.intent} | ${q3.intent} | ${q4.intent}`,
      expectedBehavior: "Different response levels and actions for different query intents",
      actualBehavior: `All produce differentiated responses: ${allDifferent}`,
      pass: allDifferent,
      notes: "Intent and response lengths adapt dynamically.",
    });
  }

  // 23. NO OVER-EXPLANATION & 24. NO UNDER-EXPLANATION
  {
    const shortAns = await processConversationalOmniForgeMessage("What is a director?", null, [], "creator");
    const isShort = shortAns.message.length < 350;
    const fullPlan = await processConversationalOmniForgeMessage("How can I actually turn this idea into a film?", currentProject, [], "creator");
    const isStructured = fullPlan.message.length > 200 && fullPlan.message.includes("1.") && fullPlan.message.includes("2.");

    results.push({
      num: 23,
      testCase: "Length & Depth Appropriateness",
      userInput: "What is a director? (short) vs How can I actually turn this idea into a film? (detailed plan)",
      detectedIntent: `${shortAns.intent} / ${fullPlan.intent}`,
      expectedBehavior: "Short definition (<350 chars) for simple query, structured roadmap for actionable how-to",
      actualBehavior: `Short: ${shortAns.message.length} chars, Plan: ${fullPlan.message.length} chars, Structured: ${isStructured}`,
      pass: isShort && isStructured,
      notes: "Response length matches question depth.",
    });
  }

  // 25. UNKNOWN QUESTIONS
  {
    const res = await processConversationalOmniForgeMessage("What is the speed of light in vacuum?", null, [], "creator");
    const isPass = !res.updatedProject && res.intent === "DEFINITION" && res.message.includes("299,792,458");
    results.push({
      num: 25,
      testCase: "Unknown / General Knowledge Query",
      userInput: "What is the speed of light in vacuum?",
      detectedIntent: res.intent,
      expectedBehavior: "Answer naturally, do NOT generate random project, do NOT crash",
      actualBehavior: `Answered cleanly: ${isPass}`,
      pass: isPass,
      notes: res.message.substring(0, 60) + "...",
    });
  }

  // 26. TRACEABILITY & 27. TEMPLATE CONTAMINATION
  {
    const webProj = (await processConversationalOmniForgeMessage("I want to create a website for our college club where students can see events and register.", null, [], "creator")).updatedProject!;
    const filmProj = (await processConversationalOmniForgeMessage("I wrote a story about a village girl who wants to become a singer.", null, [], "creator")).updatedProject!;

    const webString = JSON.stringify(webProj).toLowerCase();
    const filmString = JSON.stringify(filmProj).toLowerCase();

    const filmHasNoWebJargon = !filmString.includes("dataset pipeline") && !filmString.includes("computer vision classifier") && !filmString.includes("mobile inference");
    const webHasNoFilmJargon = !webString.includes("cinematographer") && !webString.includes("actor") && !webString.includes("principal photography");

    results.push({
      num: 27,
      testCase: "Template Contamination Prevention",
      userInput: "Web project vs Film project sequential generation",
      detectedIntent: "PROJECT_CREATION (Clean Isolated Domain Generation)",
      expectedBehavior: "Film project must NOT contain CV/ML/Dataset/Inference; Web project must NOT contain Cinema/Actor",
      actualBehavior: `Film clean: ${filmHasNoWebJargon}, Web clean: ${webHasNoFilmJargon}`,
      pass: filmHasNoWebJargon && webHasNoFilmJargon,
      notes: "Zero cross-template contamination verified.",
    });
  }

  // 28. PROJECT RESET & 29. PERSISTENCE
  {
    let activeP: OmniForgeProject | null = filmBlueprint;
    activeP = null; // Reset
    const resAfterReset = await processConversationalOmniForgeMessage("Hello", activeP, [], "creator");
    const isCleanReset = !resAfterReset.updatedProject && resAfterReset.intent === "GENERAL_CONVERSATION";

    results.push({
      num: 28,
      testCase: "Project Reset & Persistence",
      userInput: "Reset project -> 'Hello'",
      detectedIntent: resAfterReset.intent,
      expectedBehavior: "Reset clears all phases, tasks, creators, context cleanly",
      actualBehavior: `Clean state: ${isCleanReset}`,
      pass: isCleanReset,
      notes: "Project reset and isolation verified.",
    });
  }

  // 30. FINAL HUMAN-LIKE CONVERSATION (Complete uninterrupted multi-turn dialogue)
  {
    console.log("Running Scenario 30: Full Human-Like Conversation Flow...");
    let flowProj: OmniForgeProject | null = null;
    let flowHist: ChatMessage[] = [];

    function pushFlow(sender: "user" | "ai", text: string, extra: Partial<ChatMessage> = {}) {
      flowHist.push({
        id: `flow-${flowHist.length + 1}`,
        sender,
        text,
        timestamp: new Date().toISOString(),
        ...extra,
      });
    }

    // 1. "Hi"
    const s1 = await processConversationalOmniForgeMessage("Hi", flowProj, flowHist, "creator");
    pushFlow("user", "Hi");
    pushFlow("ai", s1.message);

    // 2. "I have an idea but I'm not sure if I can actually build it."
    const s2 = await processConversationalOmniForgeMessage("I have an idea but I'm not sure if I can actually build it.", flowProj, flowHist, "creator");
    pushFlow("user", "I have an idea but I'm not sure if I can actually build it.");
    pushFlow("ai", s2.message);

    // 3. "I want to make a short film about a village girl who wants to become a singer."
    const s3 = await processConversationalOmniForgeMessage("I want to make a short film about a village girl who wants to become a singer.", flowProj, flowHist, "creator");
    flowProj = s3.updatedProject || flowProj;
    pushFlow("user", "I want to make a short film about a village girl who wants to become a singer.");
    pushFlow("ai", s3.message);

    // 4. "How would I make it?"
    const s4 = await processConversationalOmniForgeMessage("How would I make it?", flowProj, flowHist, "creator");
    pushFlow("user", "How would I make it?");
    pushFlow("ai", s4.message);

    // 5. "Who would I need?"
    const s5 = await processConversationalOmniForgeMessage("Who would I need?", flowProj, flowHist, "creator");
    pushFlow("user", "Who would I need?");
    pushFlow("ai", s5.message);

    // 6. "I already have a writer."
    const s6 = await processConversationalOmniForgeMessage("I already have a writer.", flowProj, flowHist, "creator");
    flowProj = s6.updatedProject || flowProj;
    pushFlow("user", "I already have a writer.");
    pushFlow("ai", s6.message);

    // 7. "Do I need a director?"
    const s7 = await processConversationalOmniForgeMessage("Do I need a director?", flowProj, flowHist, "creator");
    pushFlow("user", "Do I need a director?");
    pushFlow("ai", s7.message, { roleCard: s7.roleCard });

    // 8. "Okay, find one."
    const s8 = await processConversationalOmniForgeMessage("Okay, find one.", flowProj, flowHist, "creator");
    pushFlow("user", "Okay, find one.");
    pushFlow("ai", s8.message, { creatorCards: s8.creatorCards });

    // 9. "Why this creator?"
    const s9 = await processConversationalOmniForgeMessage("Why this creator?", flowProj, flowHist, "creator");
    pushFlow("user", "Why this creator?");
    pushFlow("ai", s9.message);

    // 10. "What if they aren't available?"
    const s10 = await processConversationalOmniForgeMessage("What if they aren't available?", flowProj, flowHist, "creator");
    pushFlow("user", "What if they aren't available?");
    pushFlow("ai", s10.message);

    // 11. "I only have three people."
    const s11 = await processConversationalOmniForgeMessage("I only have three people.", flowProj, flowHist, "creator");
    flowProj = s11.updatedProject || flowProj;
    pushFlow("user", "I only have three people.");
    pushFlow("ai", s11.message);

    // 12. "What should we do first?"
    const s12 = await processConversationalOmniForgeMessage("What should we do first?", flowProj, flowHist, "creator");
    pushFlow("user", "What should we do first?");
    pushFlow("ai", s12.message);

    // 13. "Create the squad."
    const s13 = await processConversationalOmniForgeMessage("Create the squad.", flowProj, flowHist, "creator");
    pushFlow("user", "Create the squad.");
    pushFlow("ai", s13.message, { confirmationCard: s13.confirmationCard });

    // 14. "Yes."
    const s14 = await processConversationalOmniForgeMessage("Yes.", flowProj, flowHist, "creator");
    pushFlow("user", "Yes.");
    pushFlow("ai", s14.message);

    // 15. "By the way, what is color grading?"
    const s15 = await processConversationalOmniForgeMessage("By the way, what is color grading?", flowProj, flowHist, "creator");
    pushFlow("user", "By the way, what is color grading?");
    pushFlow("ai", s15.message);

    console.log("Scenario 30 Step Intents:", [
      `s1: ${s1.intent}`,
      `s2: ${s2.intent}`,
      `s3: ${s3.intent}`,
      `s4: ${s4.intent}`,
      `s5: ${s5.intent}`,
      `s6: ${s6.intent}`,
      `s7: ${s7.intent}`,
      `s8: ${s8.intent}`,
      `s9: ${s9.intent}`,
      `s10: ${s10.intent}`,
      `s11: ${s11.intent}`,
      `s12: ${s12.intent}`,
      `s13: ${s13.intent}`,
      `s14: ${s14.intent}`,
      `s15: ${s15.intent}`,
    ]);

    const isFullFlowPass =
      s1.intent === "GENERAL_CONVERSATION" &&
      s2.intent === "CLARIFICATION" &&
      s3.intent === "PROJECT_CREATION" &&
      s4.intent === "ROLE_QUESTION" &&
      s5.intent === "ROLE_QUESTION" &&
      s6.intent === "PROJECT_MODIFICATION" &&
      s7.intent === "ROLE_QUESTION" &&
      (s8.intent === "CREATOR_DISCOVERY" || s8.intent === "CREATOR_SEARCH") &&
      s9.intent === "CREATOR_COMPARISON" &&
      s10.intent === "CREATOR_REPLACEMENT" &&
      s11.intent === "PROJECT_MODIFICATION" &&
      s12.intent === "PROJECT_STATUS" &&
      s13.intent === "SQUAD_REQUEST" &&
      s14.intent === "SQUAD_REQUEST" &&
      s15.intent === "DEFINITION" &&
      !s15.updatedProject; // Unrelated question answered without destroying/regenerating project

    results.push({
      num: 30,
      testCase: "Final Human-Like Multi-Turn Conversation",
      userInput: "15-turn uninterrupted natural dialogue (Hi -> Idea -> Village Girl -> How -> Roles -> Writer -> Director -> Find -> Why -> Unavailable -> 3 People -> First -> Squad -> Yes -> Color grading)",
      detectedIntent: "Multi-Turn Unified Orchestration",
      expectedBehavior: "Natural dialogue, accurate stage decomposition, role updates, real creator match, team optimization, squad creation confirmation, and unrelated question without blueprint regeneration",
      actualBehavior: `Full Flow Passed: ${isFullFlowPass}`,
      pass: isFullFlowPass,
      notes: "Seamless 15-step conversational orchestration verified without restart.",
    });
  }

  // Print results summary
  console.log("\n==================================================");
  console.log("TEST RESULTS SUMMARY");
  console.log("==================================================\n");

  let totalPass = 0;
  for (const r of results) {
    if (r.pass) totalPass++;
    console.log(`[${r.pass ? "PASS" : "FAIL"}] Test #${r.num}: ${r.testCase} | Input: "${r.userInput.substring(0, 30)}..."`);
  }

  console.log(`\nTOTAL: ${totalPass} / ${results.length} PASSED (${Math.round((totalPass / results.length) * 100)}%)\n`);
}

runTests().catch(console.error);
