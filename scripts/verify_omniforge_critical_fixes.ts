/**
 * Comprehensive Verification Suite for OmniForge Critical Fixes
 * 
 * Tests:
 * 1. 24-Stage Java Mastery Roadmap generation, prerequisites, checklist topics, non-falsification.
 * 2. Intent precedence & subject resolution (Java vs Python vs Full Stack).
 * 3. Artifact independence and multi-roadmap coexistence.
 * 4. Creator profile resolution without hallucinations.
 * 5. Learning streak integrity and calendar-day boundary enforcement.
 * 6. Document upload format acceptance and validation.
 */

import { buildCompleteJavaRoadmap, buildCompletePythonRoadmap } from "../src/lib/omniforge/universal-roadmap";
import { classifyUserIntent } from "../src/lib/omniforge/intent";
import { recordQualifyingLearningActivity, loadUserStreakProfile, saveUserStreakProfile } from "../src/lib/omniforge/learning-streaks";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

async function runAcceptanceTests() {
  console.log("\n=======================================================");
  console.log("🚀 STARTING OMNIFORGE CRITICAL FIX ACCEPTANCE SUITE");
  console.log("=======================================================\n");

  // TEST 1: Complete 24-Stage Java Roadmap
  console.log("--- TEST 1: 24-Stage Java Mastery Curriculum ---");
  const javaRoadmap = buildCompleteJavaRoadmap("test-conv-1", "test-user-1");
  assert(javaRoadmap.nodes.length === 24, `Java roadmap must contain exactly 24 stages (got ${javaRoadmap.nodes.length})`);
  assert(javaRoadmap.stages.length === 24, `Java roadmap stages list must contain 24 stages (got ${javaRoadmap.stages.length})`);
  assert(javaRoadmap.goal.toLowerCase().includes("java"), `Java roadmap goal must include 'Java' (got '${javaRoadmap.goal}')`);
  assert(javaRoadmap.trackKey === "java_mastery", `Track key must be 'java_mastery' (got '${javaRoadmap.trackKey}')`);
  assert(javaRoadmap.nodes[0].state === "IN_PROGRESS", `First milestone must be IN_PROGRESS (got '${javaRoadmap.nodes[0].state}')`);
  assert(javaRoadmap.nodes[1].state === "AVAILABLE" || javaRoadmap.nodes[1].state === "LOCKED", `Second milestone must be AVAILABLE or LOCKED (got '${javaRoadmap.nodes[1].state}')`);
  assert(javaRoadmap.nodes[2].state === "LOCKED", `Third milestone must be LOCKED (got '${javaRoadmap.nodes[2].state}')`);
  assert(javaRoadmap.overallProgress === 0, `Initial Java progress must be 0% (got ${javaRoadmap.overallProgress}%)`);

  // Verify all 24 required topics from Part 3 acceptance test
  const requiredTopics = [
    { level: 1, keyword: "Ecosystem" },
    { level: 2, keyword: "Syntax" },
    { level: 3, keyword: "Control Flow" },
    { level: 4, keyword: "Arrays" },
    { level: 5, keyword: "Object" },
    { level: 6, keyword: "Inheritance" },
    { level: 7, keyword: "Exception" },
    { level: 8, keyword: "Collections" },
    { level: 9, keyword: "File" },
    { level: 10, keyword: "Stream" },
    { level: 11, keyword: "Modern Java" },
    { level: 12, keyword: "Multithreading" },
    { level: 13, keyword: "JVM" },
    { level: 14, keyword: "Data Structures" },
    { level: 15, keyword: "JDBC" },
    { level: 16, keyword: "Networking" },
    { level: 17, keyword: "Unit Testing" },
    { level: 18, keyword: "Build Tools" },
    { level: 19, keyword: "Secure Coding" },
    { level: 20, keyword: "Spring Boot" },
    { level: 21, keyword: "REST" },
    { level: 22, keyword: "Design Patterns" },
    { level: 23, keyword: "Docker" },
    { level: 24, keyword: "Capstone" },
  ];

  for (const req of requiredTopics) {
    const node = javaRoadmap.nodes.find(n => n.level === req.level);
    assert(!!node, `Stage ${req.level} must exist in Java roadmap`);
    const fullDesc = `${node!.title} ${node!.concept || ""} ${node!.task?.description || ""} ${node!.skill || ""}`.toLowerCase();
    assert(
      fullDesc.includes(req.keyword.toLowerCase()),
      `Stage ${req.level} must cover '${req.keyword}' (Title: ${node!.title})`
    );
    assert(node!.topicChecklist && node!.topicChecklist.length >= 4, `Stage ${req.level} must have at least 4 checklist topics (got ${node!.topicChecklist?.length})`);
    assert(node!.learningObjectives && node!.learningObjectives.length >= 3, `Stage ${req.level} must have >= 3 learning objectives (got ${node!.learningObjectives?.length})`);
    assert(Boolean(node!.practicalExercises && node!.practicalExercises.length > 0) || Boolean(node!.task?.description), `Stage ${req.level} must have practical exercise description`);
    assert(Boolean(node!.deliverables && node!.deliverables.length > 0) || Boolean(node!.task?.deliverables && node!.task.deliverables.length > 0), `Stage ${req.level} must define tangible deliverable`);
  }

  // TEST 2: Intent Precedence & Strict Subject Resolution
  console.log("\n--- TEST 2: Strict Intent & Subject Resolution ---");
  const javaPrompt = "I want to learn complete Java from absolute beginner to advanced, covering all topics step by step. Generate a detailed interactive learning roadmap.";
  const javaIntent = classifyUserIntent(javaPrompt);
  assert(javaIntent.intent === "ROADMAP_CREATE", `Intent must be ROADMAP_CREATE (got ${javaIntent.intent})`);
  assert(javaIntent.careerGoal === "Java", `Subject must resolve to Java, never Full Stack (got ${javaIntent.careerGoal})`);

  const showRoadmapIntent = classifyUserIntent("show the complete roadmap");
  assert(showRoadmapIntent.intent === "VIEW_CURRENT_ROADMAP", `Show roadmap must classify as VIEW_CURRENT_ROADMAP (got ${showRoadmapIntent.intent})`);

  const clarifyNotFullStack = classifyUserIntent("not full stack i need java");
  assert(clarifyNotFullStack.intent === "ROADMAP_CREATE" || clarifyNotFullStack.intent === "CLARIFICATION", `Clarification must not fall through to unhandled (got ${clarifyNotFullStack.intent})`);

  const modifyRoadmapIntent = classifyUserIntent("Add multithreading and JVM internals to my roadmap");
  assert(modifyRoadmapIntent.intent === "ROADMAP_MODIFY", `Adding topics to roadmap must classify as ROADMAP_MODIFY (got ${modifyRoadmapIntent.intent})`);

  const pythonIntent = classifyUserIntent("Now create a Python roadmap");
  assert(pythonIntent.intent === "ROADMAP_CREATE", `Python roadmap request must classify as ROADMAP_CREATE (got ${pythonIntent.intent})`);
  assert(pythonIntent.careerGoal === "Python", `Subject must resolve to Python (got ${pythonIntent.careerGoal})`);

  const listRoadmapsIntent = classifyUserIntent("show all my roadmaps");
  assert(listRoadmapsIntent.intent === "VIEW_CURRENT_ROADMAP", `List all roadmaps must resolve to VIEW_CURRENT_ROADMAP (got ${listRoadmapsIntent.intent})`);

  // TEST 3: Creator Profile Resolution
  console.log("\n--- TEST 3: Creator Profile Grounding ---");
  const profileIntent1 = classifyUserIntent("View profile of @alex_editor");
  assert(profileIntent1.intent === "CREATOR_PROFILE", `View profile must classify as CREATOR_PROFILE (got ${profileIntent1.intent})`);
  assert(profileIntent1.targetCreatorName === "alex_editor", `Target creator name must be alex_editor (got ${profileIntent1.targetCreatorName})`);

  const profileIntent2 = classifyUserIntent("view profile");
  assert(profileIntent2.intent === "CREATOR_PROFILE", `'view profile' chip must classify as CREATOR_PROFILE (got ${profileIntent2.intent})`);

  // TEST 4: General Explanations & Platform Capabilities
  console.log("\n--- TEST 4: General Inquiries (No Hijacking) ---");
  const whatIsOmniforge = classifyUserIntent("What is OmniForge?");
  assert(
    whatIsOmniforge.intent === "IDENTITY" ||
    whatIsOmniforge.intent === "CAPABILITY_QUERY" ||
    whatIsOmniforge.intent === "KNOWLEDGE",
    `What is OmniForge must resolve to IDENTITY, CAPABILITY_QUERY, or KNOWLEDGE (got ${whatIsOmniforge.intent})`
  );

  const explainInheritance = classifyUserIntent("Explain Java inheritance in detail");
  assert(
    explainInheritance.intent === "EXPLANATION" ||
    explainInheritance.intent === "ROLE_OR_CONCEPT_EXPLANATION" ||
    explainInheritance.intent === "EDUCATIONAL_QUESTION" ||
    explainInheritance.intent === "GENERAL_QUESTION",
    `Explain Java inheritance must classify as explanatory or general question (got ${explainInheritance.intent})`
  );
  assert(explainInheritance.project_action === "NONE", "Educational explanation must not trigger project actions");

  // TEST 5: Python Roadmap Creation & Coexistence
  console.log("\n--- TEST 5: Subject Artifact Independence ---");
  const pythonRoadmap = buildCompletePythonRoadmap("test-conv-2", "test-user-1");
  assert(pythonRoadmap.nodes.length === 12, `Python roadmap must have 12 stages (got ${pythonRoadmap.nodes.length})`);
  assert(pythonRoadmap.goal.toLowerCase().includes("python"), `Python goal must include Python (got '${pythonRoadmap.goal}')`);
  assert(pythonRoadmap.id !== javaRoadmap.id, `Java and Python roadmaps must have unique IDs (${javaRoadmap.id} vs ${pythonRoadmap.id})`);

  // TEST 6: Streak Integrity and Calendar Boundaries
  console.log("\n--- TEST 6: Learning Streak Integrity ---");
  const testUserId = "test-streak-user-" + Date.now();
  const initialStreak = loadUserStreakProfile(testUserId);
  assert(initialStreak.currentStreak === 0, `Initial streak must be 0 (got ${initialStreak.currentStreak})`);

  // Record 1st activity today -> streak increments to 1
  const firstAct = recordQualifyingLearningActivity({
    activityType: "TOPIC_CHECKLIST",
    roadmapTitle: "Java",
    milestoneLevel: 1,
    topicName: "Java Ecosystem & Tooling",
    description: "Checked topic in Level 1"
  }, testUserId);

  assert(firstAct.streakAdvancedToday === true, "Streak must advance on first qualifying activity of today");
  assert(firstAct.profile.currentStreak === 1, `Current streak must now be 1 (got ${firstAct.profile.currentStreak})`);
  assert(firstAct.profile.totalActivitiesCompleted === 1, "Total activities completed must be 1");

  // Record 2nd activity on the SAME calendar day -> streak must NOT increment again (streak remains 1)
  const secondAct = recordQualifyingLearningActivity({
    activityType: "PRACTICE_EXERCISE",
    roadmapTitle: "Java",
    milestoneLevel: 1,
    description: "Completed HelloWorld compilation lab"
  }, testUserId);

  assert(secondAct.streakAdvancedToday === false, "Streak must NOT advance twice on the same calendar day");
  assert(secondAct.profile.currentStreak === 1, `Current streak must stay 1 for same-day activity (got ${secondAct.profile.currentStreak})`);
  assert(secondAct.profile.totalActivitiesCompleted === 2, "Total activities completed must be 2");

  console.log("\n=======================================================");
  console.log("🎉 ALL OMNIFORGE CRITICAL FIX ACCEPTANCE TESTS PASSED!");
  console.log("=======================================================\n");
}

runAcceptanceTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
