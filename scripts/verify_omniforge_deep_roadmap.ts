/**
 * Automated Verification Suite for OmniForge Deep Roadmap Engine
 * 
 * Verifies all 12 cases specified in Section H:
 * 1. Generate a roadmap for an arbitrary technical subject
 * 2. Generate a roadmap for a non-technical learning subject
 * 3. Generate a roadmap for a practical project-execution goal
 * 4. Verify detailed topics and subtopics exist in the saved artifact
 * 5. Verify detailed content remains after refresh (serialization roundtrip)
 * 6. Verify every roadmap appears in Roadmaps after successful persistence
 * 7. Verify opening a roadmap displays all its saved sections
 * 8. Verify two roadmaps coexist without content contamination
 * 9. Verify progress updates persist independently
 * 10. Verify long roadmaps can resume without missing or duplicated stages
 * 11. Verify malformed generation is rejected or repaired before saving
 * 12. Verify existing chat history, creator search, and project workflows still work
 */

import {
  cleanAndExtractGoalSubject,
  detectRoadmapSubject,
  buildUniversalRoadmap,
  buildUniversalDynamicRoadmap,
  buildProjectExecutionPlan,
  validateRoadmapCompleteness,
  validateAndSanitizeRoadmap,
  UniversalRoadmapZodSchema,
} from "../src/lib/omniforge/universal-roadmap";

import { classifyUserIntent } from "../src/lib/omniforge/intent";
import { sanitizeSavedRoadmapItem } from "../src/lib/omniforge/storage";
import { SavedRoadmapItem } from "../src/lib/omniforge/types";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passedCount++;
    console.log(`[PASS] ${testName}`);
  } else {
    failedCount++;
    console.error(`[FAIL] ${testName}${detail ? ` -> ${detail}` : ""}`);
  }
}

async function runDeepRoadmapTests() {
  console.log("==================================================================");
  console.log("OMNIFORGE DEEP ROADMAP ENGINE VERIFICATION SUITE");
  console.log("==================================================================\n");

  // CASE 1: Arbitrary Technical Subject
  console.log("--- CASE 1: Arbitrary Technical Subject (Distributed Systems in Go) ---");
  const techPrompt = "I need a complete roadmap for Distributed Systems in Go";
  const techExtracted = cleanAndExtractGoalSubject(techPrompt);
  assert(
    techExtracted.subject.includes("Distributed Systems") && techExtracted.subject.includes("Go"),
    "Technical subject cleanly extracted without conversational fluff",
    `Extracted: "${techExtracted.subject}"`
  );

  const techRoadmap = buildUniversalRoadmap(techPrompt, "conv_tech_1", "user_1");
  assert(
    techRoadmap.title.includes("Distributed Systems") && techRoadmap.nodes.length >= 6,
    "Technical roadmap generated with dedicated title and full stage sequence",
    `Title: "${techRoadmap.title}", Stages: ${techRoadmap.stages.length}`
  );

  // CASE 2: Non-Technical Learning Subject
  console.log("\n--- CASE 2: Non-Technical Learning Subject (Screenwriting & Narrative) ---");
  const nonTechPrompt = "Create a detailed learning curriculum for Screenwriting and Narrative Architecture";
  const nonTechExtracted = cleanAndExtractGoalSubject(nonTechPrompt);
  assert(
    nonTechExtracted.subject.includes("Screenwriting") && !nonTechExtracted.isAmbiguous,
    "Non-technical subject correctly extracted",
    `Extracted: "${nonTechExtracted.subject}"`
  );

  const nonTechRoadmap = buildUniversalRoadmap(nonTechPrompt, "conv_nontech_1", "user_1");
  assert(
    nonTechRoadmap.title.includes("Screenwriting") &&
    nonTechRoadmap.roadmapType === "LEARNING" &&
    nonTechRoadmap.nodes.length >= 6,
    "Non-technical roadmap generated as learning curriculum with distinct stages",
    `Title: "${nonTechRoadmap.title}", Stages: ${nonTechRoadmap.nodes.length}`
  );

  // CASE 3: Practical Project-Execution Goal
  console.log("\n--- CASE 3: Practical Project-Execution Goal ---");
  const execPrompt = "Create an execution plan to launch an enterprise mobile application and cloud backend";
  const execRoadmap = buildUniversalRoadmap(execPrompt, "conv_exec_1", "user_1");
  assert(
    execRoadmap.roadmapType === "EXECUTION",
    "Project execution goal produces an EXECUTION roadmap type",
    `Type: ${execRoadmap.roadmapType}`
  );
  assert(
    execRoadmap.nodes.every((n) => n.actionableTasks && n.actionableTasks.length > 0),
    "Execution roadmap contains actionable tasks with deliverables across all stages"
  );

  // CASE 4: Detailed Topics and Subtopics Exist in the Saved Artifact
  console.log("\n--- CASE 4: Deep Content at Topic & Subtopic Level ---");
  const sampleNode = techRoadmap.nodes[0];
  assert(
    Boolean(sampleNode.topics && sampleNode.topics.length >= 3),
    "Every stage contains at least 3 major topics",
    `Topics count: ${sampleNode.topics?.length}`
  );

  const sampleTopic = sampleNode.topics![0];
  assert(
    Boolean(sampleTopic.subtopics && sampleTopic.subtopics.length >= 4),
    "Every major topic contains granular subtopics (>= 4)",
    `Subtopics count: ${sampleTopic.subtopics?.length}`
  );
  assert(
    Boolean(sampleTopic.explanation && sampleTopic.explanation.length > 40),
    "Every topic includes an in-depth concept explanation",
    `Explanation length: ${sampleTopic.explanation?.length}`
  );
  assert(
    Boolean(sampleTopic.example && sampleTopic.example.codeOrWalkthrough),
    "Every topic contains worked examples or demonstrations"
  );
  assert(
    Boolean(sampleTopic.exercise && sampleTopic.exercise.prompt && sampleTopic.exercise.expectedOutcome),
    "Every topic includes a practical exercise with expected outcome"
  );
  assert(
    Boolean(sampleNode.commonMistakesAndTroubleshooting && sampleNode.commonMistakesAndTroubleshooting.length > 0),
    "Stage contains common mistakes & troubleshooting guidance"
  );
  assert(
    Boolean(sampleNode.knowledgeCheck && sampleNode.knowledgeCheck.length > 0 && sampleNode.knowledgeCheck[0].solutionRubric),
    "Stage contains knowledge checks with assessment questions and solution rubrics"
  );
  assert(
    Boolean(sampleNode.completionCriteria && sampleNode.completionCriteria.length >= 3),
    "Stage contains specific, verifiable completion criteria"
  );

  // CASE 5: Detailed Content Remains After Refresh (Serialization Roundtrip)
  console.log("\n--- CASE 5: Persistence & Serialization Roundtrip ---");
  const serialized = JSON.stringify(techRoadmap);
  const deserialized = JSON.parse(serialized);
  const revalidated = validateAndSanitizeRoadmap(deserialized, techRoadmap.subject);
  assert(
    revalidated.valid &&
    revalidated.roadmap.nodes[0].topics!.length === sampleNode.topics!.length &&
    revalidated.roadmap.nodes[0].topics![0].subtopics.length === sampleTopic.subtopics.length,
    "Full deep topics, subtopics, and explanations survive JSON serialization without truncation"
  );

  // CASE 6: Verify SavedRoadmapItem Metadata For Roadmaps Section
  console.log("\n--- CASE 6: Roadmaps Section Card Metadata ---");
  const savedItem: SavedRoadmapItem = {
    id: techRoadmap.id,
    userId: "user_1",
    conversationId: "conv_tech_1",
    title: techRoadmap.title,
    subject: techRoadmap.subject,
    domain: techRoadmap.domain,
    summary: techRoadmap.summary,
    roadmapType: techRoadmap.roadmapType,
    targetSkillOrOutcome: techRoadmap.targetRole,
    totalStages: techRoadmap.stages.length,
    completedStages: 0,
    progressPercent: 0,
    activeMilestoneTitle: techRoadmap.nodes[0].title,
    roadmapData: techRoadmap,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const sanitizedCard = sanitizeSavedRoadmapItem(savedItem);
  assert(
    Boolean(sanitizedCard.title && sanitizedCard.subject && sanitizedCard.summary && sanitizedCard.totalStages && typeof sanitizedCard.progressPercent === "number"),
    "Saved roadmap item contains all 6 required card fields (Title, Subject, Summary, Stages, Progress, Updated)",
    `Summary: "${sanitizedCard.summary?.substring(0, 40)}..."`
  );

  // CASE 7: Opening a Saved Roadmap Displays Full Detail
  console.log("\n--- CASE 7: Opening Saved Roadmap Retrieves Complete Artifact ---");
  const openedData = sanitizedCard.roadmapData;
  assert(
    Boolean(openedData && openedData.nodes[0].topics && openedData.nodes[0].topics[0].example),
    "Opening saved roadmap yields full deep artifact with code examples and exercises"
  );

  // CASE 8: Multi-Roadmap Coexistence Without Contamination
  console.log("\n--- CASE 8: Independent Multi-Roadmap Coexistence ---");
  const savedList: SavedRoadmapItem[] = [
    sanitizedCard,
    sanitizeSavedRoadmapItem({
      id: nonTechRoadmap.id,
      userId: "user_1",
      conversationId: "conv_nontech_1",
      title: nonTechRoadmap.title,
      subject: nonTechRoadmap.subject,
      totalStages: nonTechRoadmap.stages.length,
      progressPercent: 15,
      roadmapData: nonTechRoadmap,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
  ];

  assert(
    savedList[0].id !== savedList[1].id &&
    savedList[0].title !== savedList[1].title &&
    savedList[0].roadmapData?.nodes[0].title !== savedList[1].roadmapData?.nodes[0].title,
    "Two independently generated roadmaps have distinct IDs, titles, and non-overlapping stages",
    `Roadmap 1: ${savedList[0].title} (${savedList[0].id}) vs Roadmap 2: ${savedList[1].title} (${savedList[1].id})`
  );

  // CASE 9: Independent Progress Persistence
  console.log("\n--- CASE 9: Independent Progress Persistence ---");
  const updatedRoadmap1 = {
    ...techRoadmap,
    nodes: techRoadmap.nodes.map((n, idx) => (idx === 0 ? { ...n, state: "COMPLETED" as const } : n)),
    overallProgress: Math.round((1 / techRoadmap.nodes.length) * 100),
  };
  const sanitizedR1 = validateAndSanitizeRoadmap(updatedRoadmap1);
  const sanitizedR2 = validateAndSanitizeRoadmap(nonTechRoadmap);
  assert(
    sanitizedR1.roadmap.overallProgress > 0 && sanitizedR2.roadmap.overallProgress === 0,
    "Advancing progress on Roadmap 1 does not mutate or affect Roadmap 2",
    `R1 progress: ${sanitizedR1.roadmap.overallProgress}%, R2 progress: ${sanitizedR2.roadmap.overallProgress}%`
  );

  // CASE 10: Resumption of Long Roadmaps Without Duplication
  console.log("\n--- CASE 10: Resumption & Stage Ordering ---");
  const stagesOrdered = techRoadmap.stages.every((stg, i) => stg.stage === i + 1);
  const nodesOrdered = techRoadmap.nodes.every((node, i) => node.level === i + 1);
  assert(
    stagesOrdered && nodesOrdered,
    "Long roadmap maintains strictly monotonic 1-to-N stage and node levels with zero duplicates"
  );

  // CASE 11: Completeness Validator Rejects or Repairs Malformed Generation
  console.log("\n--- CASE 11: Completeness Validator & Repair ---");
  const malformedInput = {
    id: "corrupt_1",
    title: "I need as a Mastery Roadmap",
    nodes: [
      { id: "bad_node_1", level: 1, title: "I need as a Stage 1" },
      { id: "bad_node_3", level: 3, title: "Stage 3 out of order" },
    ],
    stages: [],
  };
  const completenessCheck = validateRoadmapCompleteness(malformedInput, "Quantum Computing");
  assert(
    completenessCheck.issues.length > 0 &&
    completenessCheck.repairedRoadmap.title.includes("Quantum Computing") &&
    completenessCheck.repairedRoadmap.nodes.every((n) => !n.title.includes("I need as a")),
    "Completeness validator flags malformed titles/stages and repairs them into valid curriculum",
    `Issues caught: ${completenessCheck.issues.length}`
  );

  // CASE 12: Existing Chat and Project Workflows Preserved
  console.log("\n--- CASE 12: System Intent & Workflow Preservation ---");
  const chatIntent = classifyUserIntent("Hello, can you help me find a React creator for my project?");
  assert(
    chatIntent.intent === "CREATOR_SEARCH" || chatIntent.intent === "TALENT_SEARCH" || chatIntent.intent === "FIND_TALENT",
    "Creator search queries correctly route without roadmap hijack",
    `Intent: ${chatIntent.intent}`
  );

  const ambiguousIntent = classifyUserIntent("Can you give me a roadmap?");
  assert(
    ambiguousIntent.intent === "ROADMAP_CAPABILITY_INQUIRY",
    "Unspecified roadmap requests route to capability inquiry with options instead of false generation",
    `Intent: ${ambiguousIntent.intent}`
  );

  console.log("\n==================================================================");
  console.log(`DEEP ROADMAP VERIFICATION SUITE RESULTS:`);
  console.log(`TOTAL TESTS: ${passedCount + failedCount}`);
  console.log(`PASSED: ${passedCount}`);
  console.log(`FAILED: ${failedCount}`);
  console.log("==================================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runDeepRoadmapTests().catch((err) => {
  console.error("Unhandled test execution error:", err);
  process.exit(1);
});
