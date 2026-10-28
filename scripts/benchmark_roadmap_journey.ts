import {
  buildHtmlFrontendRoadmap,
  buildStandardFullStackRoadmap,
  inspectUserLearningState,
  calculateDynamicTimeline,
  explainCurrentMilestone,
  generateTodayLearningTasks,
  generateExercisesForTopic,
  assessUserSkills,
  resumeNextIncompleteMilestone,
  DEFAULT_SKILL_DNA,
  UserIntelligenceProfile,
} from "../src/lib/omniforge/user-intelligence";
import { classifyIntent } from "../src/lib/omniforge/intent";

console.log("================================================================================");
console.log("OMNIFORGE CONTEXT-AWARE LEARNING ROADMAPS & 9-INTENT INTEGRATION BENCHMARK");
console.log("================================================================================\n");

let passedCount = 0;
let totalCount = 0;

function assert(condition: boolean, testName: string, detail: string = "") {
  totalCount++;
  if (condition) {
    passedCount++;
    console.log(`[✓ PASS] ${testName} ${detail ? `(${detail})` : ""}`);
  } else {
    console.error(`[✗ FAIL] ${testName} ${detail ? `(${detail})` : ""}`);
    process.exitCode = 1;
  }
}

// -----------------------------------------------------------------------------
// TEST 1: UNDERSTAND USER'S EXISTING LEARNING STATE & 3-OPTION FORK
// -----------------------------------------------------------------------------
console.log("--- 1. Existing Learning State Detection & 3-Option Fork ---");
const initialProfile: UserIntelligenceProfile = {
  id: "test-user-1",
  role: "CREATOR",
  roleConfidence: 95,
  roleSource: "account",
  careerGoal: "Full Stack Developer",
  targetRole: "Full Stack Software Engineer",
  skillDna: { ...DEFAULT_SKILL_DNA },
  skillGaps: [],
  roadmap: buildStandardFullStackRoadmap(DEFAULT_SKILL_DNA),
  activeProjectPlan: null,
  resumeParsed: false,
};

const inspection = inspectUserLearningState(initialProfile, "I want an HTML roadmap");
assert(inspection.hasExistingJourney === true, "Detects active existing journey", inspection.existingGoal);
assert(inspection.isSubjectDivergent === true, "Flags divergence when user asks for beginner HTML roadmap while on Full Stack path");
assert(inspection.options.length === 3, "Offers exactly 3 context-aware paths", inspection.options.map(o => o.label).join(" | "));
assert(inspection.options[0].label === "Continue my current journey", "Option 1: Continue my current journey");
assert(inspection.options[1].label === "Create a separate HTML/frontend roadmap", "Option 2: Create a separate HTML/frontend roadmap");
assert(inspection.options[2].label === "Review and improve my current roadmap", "Option 3: Review and improve my current roadmap");

// -----------------------------------------------------------------------------
// TEST 2: COMPREHENSIVE 12-STAGE HTML & FRONTEND ROADMAP BLUEPRINT
// -----------------------------------------------------------------------------
console.log("\n--- 2. Comprehensive 12-Stage HTML & Frontend Curriculum ---");
const frontendRoadmap = buildHtmlFrontendRoadmap(DEFAULT_SKILL_DNA, 1.5);

assert(frontendRoadmap.nodes.length === 12, "Roadmap contains exactly 12 progression stages", `Stages: ${frontendRoadmap.nodes.length}`);
assert(frontendRoadmap.stages.length === 12, "Stage projects list contains exactly 12 stages", `Stages: ${frontendRoadmap.stages.length}`);
assert(frontendRoadmap.trackKey === "html_frontend", "Track key is tagged as 'html_frontend'");

// Validate each blueprint topic is covered in order
const expectedTitles = [
  "Web Fundamentals & Browser Architecture",
  "HTML5 Semantics, Accessibility & Forms",
  "CSS Cascades, Layouts, Flexbox, Grid & Animations",
  "JavaScript Fundamentals, Scope & Dynamic Logic",
  "DOM Manipulation, Browser APIs & Async Fetch",
  "Developer Workflows, Git & Build Tooling",
  "React Component Architecture, Hooks & State",
  "TypeScript Type Safety & Typed React Applications",
  "API Integration, Auth Concepts & State Management",
  "Testing, Accessibility (WCAG) & Web Vitals",
  "Build Tooling, CI/CD, Deployment & Monitoring",
  "Advanced Frontend Architecture & Production Systems",
];

expectedTitles.forEach((expectedTitle, idx) => {
  const node = frontendRoadmap.nodes[idx];
  assert(node.level === idx + 1, `Stage ${idx + 1} has correct level number`, node.title);
  assert(Boolean(node.learningObjectives && node.learningObjectives.length >= 2), `Stage ${idx + 1} has learning objectives`, `${node.learningObjectives?.length} items`);
  assert(Boolean(node.topicChecklist && node.topicChecklist.length >= 4), `Stage ${idx + 1} has complete topic checklist`, `${node.topicChecklist?.length} topics`);
  assert(Boolean(node.practicalExercises && node.practicalExercises.length >= 2), `Stage ${idx + 1} has practical exercises`, `${node.practicalExercises?.length} exercises`);
  assert(Boolean(node.miniProject && node.miniProject.title), `Stage ${idx + 1} has milestone project`, node.miniProject.title);
  assert(Boolean(node.rubric && node.rubric.length >= 3), `Stage ${idx + 1} has completion rubric`, `${node.rubric?.length} criteria`);
  assert(Boolean(node.freeResources && node.freeResources.length >= 2), `Stage ${idx + 1} has recommended free learning resources`, `${node.freeResources?.length} resources`);
  assert(Boolean(node.estimatedStudyHours && node.estimatedStudyHours > 0), `Stage ${idx + 1} has realistic estimated study hours`, `${node.estimatedStudyHours}h`);
});

// Verified skills protection: HTML (91%) and CSS (76%) should be marked completed
assert(frontendRoadmap.nodes[0].state === "COMPLETED", "Stage 1 (Web Fundamentals) verified as COMPLETED from Skill DNA");
assert(frontendRoadmap.nodes[1].state === "COMPLETED", "Stage 2 (HTML5 Semantics) verified as COMPLETED from Skill DNA");
assert(frontendRoadmap.nodes[2].state === "COMPLETED", "Stage 3 (CSS Layouts) verified as COMPLETED from Skill DNA");
assert(frontendRoadmap.nodes[3].state === "COMPLETED", "Stage 4 (JavaScript Fundamentals) verified as COMPLETED from Skill DNA (63%)");
assert(frontendRoadmap.nodes[4].state === "IN_PROGRESS", "Stage 5 (DOM & APIs) marked as active IN_PROGRESS starting point");

// -----------------------------------------------------------------------------
// TEST 3: DYNAMIC TIMELINE & REALISTIC STUDY PACING
// -----------------------------------------------------------------------------
console.log("\n--- 3. Dynamic Timeline & Adjustable Pacing ---");
const pace1h = calculateDynamicTimeline(16, 1.0);
const pace2h = calculateDynamicTimeline(16, 2.0);
const fullTrackPace = calculateDynamicTimeline(212, 1.5);

assert(pace1h.includes("16 days") || pace1h.includes("2.3 weeks"), "Pacing calculation for 1h/day is realistic", pace1h);
assert(pace2h.includes("8 days") || pace2h.includes("1.1 weeks"), "Pacing calculation for 2h/day is realistic", pace2h);
assert(fullTrackPace.includes("weeks"), "Full track pacing computes estimated timeline", fullTrackPace);

// -----------------------------------------------------------------------------
// TEST 4: ALL 9 DISTINCT INTENTS CLASSIFIED DETERMINISTICALLY
// -----------------------------------------------------------------------------
console.log("\n--- 4. Distinct Intent Classification Suite (9 Distinct Intents) ---");

const intentTestCases = [
  { prompt: "I want an HTML and frontend roadmap", expected: "ROADMAP_REQUEST", label: "Create new roadmap / roadmap request" },
  { prompt: "Create a separate HTML/frontend roadmap", expected: "ROADMAP_CREATE", label: "Create separate HTML/frontend roadmap" },
  { prompt: "View my current roadmap", expected: "VIEW_CURRENT_ROADMAP", label: "View my current roadmap" },
  { prompt: "Explain the current milestone", expected: "EXPLAIN_CURRENT_MILESTONE", label: "Explain current milestone" },
  { prompt: "Give me today's learning tasks", expected: "TODAY_LEARNING_TASKS", label: "Today's learning tasks" },
  { prompt: "Generate exercises for CSS Grid", expected: "GENERATE_TOPIC_EXERCISES", label: "Generate exercises for specific topic" },
  { prompt: "Review my project or code", expected: "REVIEW_PROJECT_OR_CODE", label: "Review my project or code" },
  { prompt: "Assess my skills", expected: "ASSESS_SKILLS", label: "Assess my skills" },
  { prompt: "I have finished and tested the calculator, mark milestone complete", expected: "MARK_MILESTONE_COMPLETE", label: "Mark milestone complete" },
  { prompt: "Resume the next incomplete milestone", expected: "RESUME_NEXT_MILESTONE", label: "Resume next incomplete milestone" },
];

for (const tc of intentTestCases) {
  const res = classifyIntent(tc.prompt);
  assert(res.intent === tc.expected, `Intent: ${tc.label}`, `Prompt: "${tc.prompt}" -> Got: ${res.intent}`);
  assert(Boolean(res.deterministicText), `Intent: ${tc.label} has deterministic text (zero-latency fast path)`);
}

// -----------------------------------------------------------------------------
// TEST 5: ACTIONABLE HELPER ENGINES OUTPUT INTEGRITY
// -----------------------------------------------------------------------------
console.log("\n--- 5. Actionable Milestone Helper Engines Output ---");

const explanationOutput = explainCurrentMilestone(frontendRoadmap);
assert(explanationOutput.includes("Active Milestone: Level 5"), "explainCurrentMilestone mentions active Level 5");
assert(explanationOutput.includes("Learning Objectives"), "explainCurrentMilestone includes Learning Objectives");
assert(explanationOutput.includes("Completion Rubric"), "explainCurrentMilestone includes Completion Rubric");
assert(explanationOutput.includes("Milestone Project"), "explainCurrentMilestone includes Milestone Project");

const todayTasksOutput = generateTodayLearningTasks(frontendRoadmap, 1.5);
assert(todayTasksOutput.includes("Today's Learning Plan"), "generateTodayLearningTasks creates daily plan");
assert(todayTasksOutput.includes("Theory & Concepts"), "generateTodayLearningTasks includes theory allocation");
assert(todayTasksOutput.includes("Practical Coding"), "generateTodayLearningTasks includes practical coding allocation");

const topicExercisesOutput = generateExercisesForTopic("CSS Grid", frontendRoadmap);
assert(topicExercisesOutput.includes("Exercise 1 (Beginner)"), "generateExercisesForTopic includes beginner exercise");
assert(topicExercisesOutput.includes("Exercise 2 (Intermediate)"), "generateExercisesForTopic includes intermediate exercise");
assert(topicExercisesOutput.includes("Exercise 3 (Challenge)"), "generateExercisesForTopic includes challenge exercise");

const skillAssessmentOutput = assessUserSkills(DEFAULT_SKILL_DNA, "Full Stack Developer");
assert(skillAssessmentOutput.includes("Skill DNA & Competency Assessment"), "assessUserSkills formats header");
assert(skillAssessmentOutput.includes("HTML"), "assessUserSkills includes verified HTML");
assert(skillAssessmentOutput.includes("JavaScript"), "assessUserSkills includes verified JavaScript");

const resumeResult = resumeNextIncompleteMilestone(frontendRoadmap);
assert(resumeResult.nextNode.level === 5, "resumeNextIncompleteMilestone targets Level 5 active stage", `Level ${resumeResult.nextNode.level}`);
assert(resumeResult.explanation.includes("Level 5"), "resumeNextIncompleteMilestone explains Level 5 target");

// -----------------------------------------------------------------------------
// TEST 6: MULTI-TRACK PRESERVATION (NO DESTRUCTIVE OVERWRITES)
// -----------------------------------------------------------------------------
console.log("\n--- 6. Multi-Track Coexistence (Full Stack + Frontend) ---");
const fullStackRoadmap = buildStandardFullStackRoadmap(DEFAULT_SKILL_DNA);
const savedTracks: Record<string, any> = {
  full_stack: fullStackRoadmap,
  html_frontend: frontendRoadmap,
};

assert(savedTracks.full_stack.nodes.length === 10, "Full Stack Developer track preserved with 10 stages");
assert(savedTracks.html_frontend.nodes.length === 12, "HTML & Frontend Specialist track preserved with 12 stages");
assert(savedTracks.full_stack.goal !== savedTracks.html_frontend.goal, "Both tracks have distinct goals and do not overwrite each other");

console.log("\n================================================================================");
console.log(`BENCHMARK SUMMARY: ${passedCount} / ${totalCount} PASSED (${Math.round((passedCount / totalCount) * 100)}%)`);
console.log("================================================================================");

if (passedCount === totalCount) {
  console.log("🎉 ALL ROADMAP & JOURNEY TESTS PASSED WITH 100% SUCCESS!");
  process.exit(0);
} else {
  console.error("❌ BENCHMARK COMPLETED WITH FAILURES.");
  process.exit(1);
}
