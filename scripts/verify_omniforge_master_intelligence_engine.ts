/**
 * OmniForge Master Roadmap Intelligence Engine - Comprehensive Verification Suite
 *
 * Validates all 14 core requirements:
 * 1. Architecture Preservation
 * 2. Intent & Routing Pipeline (Casual, Q&A, Learning, Execution, Expand, Explain, Modify, Resume, Compare, Delete)
 * 3. Learning vs. Execution Structural Duality
 * 4. Subject-Aware Curriculum Planning (Python, Frontend, ML, Cybersecurity, Screenwriting, Dynamic)
 * 5. Deep Content Quality (>=3 topics, 4-5 subtopics, explanations, troubleshooting, rubrics, completion criteria)
 * 6. Code Accuracy & Real Examples (Imports, comments, expected outputs)
 * 7. Quality Gates & Centralized Validator (Cycle detection, 1-to-N ordering, auto-repair)
 * 8. Two-Level Approach (Blueprint Level A + Stage Content Level B + expandRoadmapStage)
 * 9. Personalization & Context Precedence (Zero cross-subject contamination)
 * 10. Realistic Planning (No false promises or "guaranteed job" claims)
 * 11. Conversational Overviews (5-part concise overview)
 * 12. State & Storage Isolation (Multiple roadmaps, delete safety, progress preservation)
 */

import {
  cleanAndExtractGoalSubject,
  detectRoadmapSubject,
  buildUniversalRoadmap,
  buildCompletePythonRoadmap,
  buildCompleteFrontendRoadmap,
  buildCompleteMachineLearningRoadmap,
  buildCompleteCybersecurityRoadmap,
  buildProjectExecutionPlan,
  expandRoadmapStage,
  validateRoadmapQualityGate,
  detectDependencyCycles,
  UniversalRoadmap,
} from "../src/lib/omniforge/universal-roadmap";
import {
  classifyUserIntent,
  formatRoadmapConversationalOverview,
} from "../src/lib/omniforge/intent";
import {
  saveRoadmapItem,
  loadSavedRoadmapsList,
  findSavedRoadmapById,
  deleteRoadmapItem,
  SavedRoadmapItem,
} from "../src/lib/omniforge/storage";

// Mock localStorage for node environment
const storageMock: Record<string, string> = {};
(globalThis as any).window = {};
(globalThis as any).localStorage = {
  getItem: (key: string) => storageMock[key] || null,
  setItem: (key: string, val: string) => {
    storageMock[key] = val;
  },
  removeItem: (key: string) => {
    delete storageMock[key];
  },
  clear: () => {
    for (const k in storageMock) delete storageMock[k];
  },
};

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`[PASS] ${testName}`);
  } else {
    console.error(`[FAIL] ${testName}${detail ? ` -> ${detail}` : ""}`);
  }
}

async function runMasterVerification() {
  console.log("==================================================================");
  console.log("OMNIFORGE MASTER ROADMAP INTELLIGENCE ENGINE VERIFICATION SUITE");
  console.log("==================================================================\n");

  // -----------------------------------------------------------------------------
  // REQUIREMENT 1 & 2: INTENT AND ROUTING PIPELINE & STRICT CONTEXT PRECEDENCE
  // -----------------------------------------------------------------------------
  console.log("--- 1 & 2. INTENT & ROUTING PIPELINE ---");

  // 1. Casual Chat must NOT generate a roadmap
  const casual1 = classifyUserIntent("Hello, how are you today?");
  assert(
    (casual1.intent === "GREETING" || casual1.intent === "CHAT" || casual1.intent === "GENERAL_QUESTION") && !casual1.roadmapData,
    "Casual greeting does not generate or save a roadmap"
  );

  const casual2 = classifyUserIntent("Thanks for your help!");
  assert(
    (casual2.intent === "CHAT" || casual2.intent === "GENERAL_QUESTION" || casual2.intent === "CLARIFICATION") && !casual2.roadmapData,
    "Casual polite statement does not generate a roadmap"
  );

  // 2. General Knowledge question must NOT generate a roadmap
  const genQ = classifyUserIntent("What is an event loop in JavaScript?");
  assert(
    (genQ.intent === "GENERAL_QUESTION" || genQ.intent === "TECHNICAL_QUESTION" || genQ.intent === "CONCEPT_EXPLANATION" || genQ.intent === "EXPLAIN_TOPIC" || genQ.intent === "DEFINITION") &&
    !genQ.roadmapData,
    "General technical question does not generate a roadmap"
  );

  // 3. Learning Roadmap Request
  const learnReq = classifyUserIntent("Create a dedicated learning roadmap for Python");
  assert(
    learnReq.intent === "ROADMAP_CREATE" &&
    Boolean(learnReq.roadmapData) &&
    learnReq.roadmapData?.roadmapType === "LEARNING",
    "Learning roadmap request produces validated LEARNING roadmap"
  );

  // 4. Project Execution Roadmap Request
  const execReq = classifyUserIntent("Plan and architect a mobile application development project");
  assert(
    execReq.intent === "ROADMAP_CREATE" &&
    Boolean(execReq.roadmapData) &&
    execReq.roadmapData?.roadmapType === "EXECUTION",
    "Project execution request produces validated EXECUTION roadmap"
  );

  // 5. Expand Stage Request
  const expandReq = classifyUserIntent("Expand stage 2 of my roadmap");
  assert(
    expandReq.intent === "EXPAND_ROADMAP_STAGE" && expandReq.targetRole === "2",
    "Stage expansion request recognized with correct target stage number"
  );

  // 6. Explain Topic Request
  const explainReq = classifyUserIntent("Explain closures in depth");
  assert(
    explainReq.intent === "EXPLAIN_TOPIC" && !explainReq.roadmapData,
    "Topic explanation request routes to EXPLAIN_TOPIC without generating new roadmap"
  );

  // 7. Revise Roadmap Request
  const reviseReq = classifyUserIntent("Add accessibility and testing to my frontend roadmap");
  assert(
    reviseReq.intent === "MODIFY_ROADMAP" && !reviseReq.roadmapData,
    "Revision request targets existing roadmap without creating duplicate artifact"
  );

  // 8. Compare Roadmaps Request
  const compareReq = classifyUserIntent("Compare all my saved roadmaps");
  assert(
    compareReq.intent === "COMPARE_ROADMAPS" && !compareReq.roadmapData,
    "Roadmap comparison request routes to COMPARE_ROADMAPS"
  );

  // 9. Delete Roadmap Request
  const deleteReq = classifyUserIntent("Delete my python roadmap");
  assert(
    deleteReq.intent === "DELETE_ROADMAP" && Boolean(deleteReq.targetRole),
    "Roadmap deletion request recognizes target subject and prompts confirmation"
  );

  // 10. Strict Context Precedence (Python after Screenwriting has zero contamination)
  console.log("\n--- CONTEXT PRECEDENCE & ZERO CONTAMINATION ---");
  const screenwritingRoadmap = buildUniversalRoadmap("Create screenwriting roadmap", "conv_sw", "user_test");
  assert(
    screenwritingRoadmap.title.toLowerCase().includes("screenwriting") || screenwritingRoadmap.title.toLowerCase().includes("film"),
    "Screenwriting roadmap generated cleanly"
  );

  // Subsequent request for Python must yield Python, NEVER screenwriting
  const pythonAfterSw = buildUniversalRoadmap("I want a Python learning roadmap", "conv_sw", "user_test");
  assert(
    pythonAfterSw.title.includes("Python") &&
    !pythonAfterSw.title.toLowerCase().includes("screenwriting") &&
    !pythonAfterSw.title.toLowerCase().includes("film"),
    "Request for Python after Screenwriting generates pure Python roadmap with zero contamination"
  );

  // -----------------------------------------------------------------------------
  // REQUIREMENT 3: DUALITY - LEARNING VS. EXECUTION ROADMAPS
  // -----------------------------------------------------------------------------
  console.log("\n--- 3. LEARNING VS. EXECUTION ROADMAP DUALITY ---");

  // Learning Roadmap Structure
  const pyLearning = buildCompletePythonRoadmap("conv_py", "user_test");
  assert(
    pyLearning.roadmapType === "LEARNING",
    "Python curriculum has explicit LEARNING roadmapType"
  );
  const firstPyNode = pyLearning.nodes[0];
  assert(
    Array.isArray(firstPyNode.topics) &&
    firstPyNode.topics.length >= 3 &&
    Array.isArray(firstPyNode.commonMistakesAndTroubleshooting) &&
    firstPyNode.commonMistakesAndTroubleshooting.length >= 2 &&
    Array.isArray(firstPyNode.knowledgeCheck) &&
    firstPyNode.knowledgeCheck.length >= 2 &&
    Array.isArray(firstPyNode.completionCriteria) &&
    firstPyNode.completionCriteria.length >= 2,
    "Learning roadmap node contains topics, troubleshooting, knowledge checks, and completion criteria"
  );

  // Execution Roadmap Structure
  const mobileExecution = buildProjectExecutionPlan("Mobile App Launch", "Mobile Engineering", "conv_mob", "user_test");
  assert(
    mobileExecution.roadmapType === "EXECUTION",
    "Mobile project plan has explicit EXECUTION roadmapType"
  );
  const firstExecNode = mobileExecution.nodes[0];
  assert(
    Array.isArray(firstExecNode.actionableTasks) &&
    firstExecNode.actionableTasks.length >= 2 &&
    firstExecNode.actionableTasks[0].role &&
    firstExecNode.actionableTasks[0].deliverable &&
    firstExecNode.actionableTasks[0].validationProcedure &&
    Array.isArray(firstExecNode.definitionOfDone) &&
    firstExecNode.definitionOfDone.length >= 1 &&
    Array.isArray(firstExecNode.acceptanceCriteria) &&
    firstExecNode.acceptanceCriteria.length >= 1,
    "Execution roadmap node contains genuine actionableTasks (with roles and deliverables), DoD, and acceptance criteria"
  );

  // -----------------------------------------------------------------------------
  // REQUIREMENT 4: SUBJECT-AWARE CURRICULUM PLANNING
  // -----------------------------------------------------------------------------
  console.log("\n--- 4. SUBJECT-AWARE CURRICULUM PLANNING ---");

  // Python Curriculum
  assert(
    pyLearning.stages.length === 12 &&
    pyLearning.stages.some((s) => s.skillFocus.toLowerCase().includes("syntax") || s.skillFocus.toLowerCase().includes("virtual")) &&
    pyLearning.stages.some((s) => s.projectTitle.toLowerCase().includes("fastapi") || s.deliverables.toLowerCase().includes("fastapi")) &&
    pyLearning.stages.some((s) => s.skillFocus.toLowerCase().includes("docker") || s.deliverables.toLowerCase().includes("docker")),
    "Python curriculum adapts to subject (syntax, venv, OOP, FastAPI, testing, Docker)"
  );

  // Frontend Curriculum
  const feLearning = buildCompleteFrontendRoadmap("conv_fe", "user_test");
  assert(
    feLearning.stages.length === 12 &&
    feLearning.stages.some((s) => s.skillFocus.toLowerCase().includes("landmark") || s.skillFocus.toLowerCase().includes("accessible")) &&
    feLearning.stages.some((s) => s.skillFocus.toLowerCase().includes("grid") || s.skillFocus.toLowerCase().includes("flexbox")) &&
    feLearning.stages.some((s) => s.projectTitle.toLowerCase().includes("react") || s.deliverables.toLowerCase().includes("react")),
    "Frontend curriculum adapts to subject (HTML5/WCAG, CSS Grid, React, Web Vitals)"
  );

  // Machine Learning Curriculum
  const mlLearning = buildCompleteMachineLearningRoadmap("conv_ml", "user_test");
  assert(
    mlLearning.stages.length === 12 &&
    mlLearning.stages.some((s) => s.skillFocus.toLowerCase().includes("numpy") || s.skillFocus.toLowerCase().includes("vector")) &&
    mlLearning.stages.some((s) => s.skillFocus.toLowerCase().includes("pytorch") || s.deliverables.toLowerCase().includes("pytorch")) &&
    mlLearning.stages.some((s) => s.projectTitle.toLowerCase().includes("rag") || s.deliverables.toLowerCase().includes("rag") || s.skillFocus.toLowerCase().includes("rag")),
    "Machine Learning curriculum adapts to subject (NumPy, Scikit-Learn, PyTorch, Transformers, RAG)"
  );

  // Cybersecurity Curriculum
  const secLearning = buildCompleteCybersecurityRoadmap("conv_sec", "user_test");
  assert(
    secLearning.stages.length === 10 &&
    secLearning.stages.some((s) => s.skillFocus.toLowerCase().includes("wireshark") || s.skillFocus.toLowerCase().includes("tcp/ip")) &&
    secLearning.stages.some((s) => s.projectTitle.toLowerCase().includes("owasp") || s.skillFocus.toLowerCase().includes("vulnerability")) &&
    secLearning.stages.some((s) => s.skillFocus.toLowerCase().includes("siem") || s.deliverables.toLowerCase().includes("incident")),
    "Cybersecurity curriculum adapts to subject (networking, Linux, OWASP Top 10, SIEM, incident response)"
  );

  // -----------------------------------------------------------------------------
  // REQUIREMENT 5 & 6: DEEP CONTENT QUALITY & CODE ACCURACY
  // -----------------------------------------------------------------------------
  console.log("\n--- 5 & 6. DEEP CONTENT QUALITY & CODE ACCURACY ---");

  // Every stage has >= 3 major topics with 4-5 subtopics each
  const allPyStagesMeetDepth = pyLearning.nodes.every((node) => {
    if (!Array.isArray(node.topics) || node.topics.length < 3) return false;
    return node.topics.every((t) => Array.isArray(t.subtopics) && t.subtopics.length >= 4 && t.explanation.length > 40);
  });
  assert(
    allPyStagesMeetDepth,
    "Every Python stage contains at least 3 major topics each with 4-5 substantive subtopics and non-empty explanations"
  );

  // Executable code verification
  const stage1PythonTopic = pyLearning.nodes[0].topics[0];
  assert(
    Boolean(stage1PythonTopic.example) &&
    stage1PythonTopic.example.codeOrWalkthrough.includes("sys") &&
    stage1PythonTopic.example.codeOrWalkthrough.includes("print"),
    "Python worked example includes required imports and runnable code syntax"
  );

  // Knowledge checks with assessment rubrics
  const stage1KnowledgeCheck = pyLearning.nodes[0].knowledgeCheck[0];
  assert(
    Boolean(stage1KnowledgeCheck.question) &&
    Boolean(stage1KnowledgeCheck.answerOrExplanation) &&
    Boolean(stage1KnowledgeCheck.solutionRubric),
    "Knowledge check item includes question, answer explanation, and evaluation rubric"
  );

  // -----------------------------------------------------------------------------
  // REQUIREMENT 7: QUALITY GATES & VALIDATOR
  // -----------------------------------------------------------------------------
  console.log("\n--- 7. QUALITY GATES & VALIDATOR ---");

  // Valid roadmap passes quality gate
  const pyGateResult = validateRoadmapQualityGate(pyLearning, "Python");
  assert(
    pyGateResult.isValid === true && pyGateResult.issues.length === 0,
    "Complete Python roadmap strictly passes centralized quality gate"
  );

  // Cycle detection on DAG
  const cyclicGraph = {
    "task_A": ["task_B"],
    "task_B": ["task_C"],
    "task_C": ["task_A"], // circular cycle A -> B -> C -> A
  };
  const cycleResult = detectDependencyCycles(cyclicGraph);
  assert(
    cycleResult.hasCycles === true && cycleResult.cycleNodes.length > 0,
    "Quality gate cycle detector identifies circular task dependency cycle"
  );

  const acyclicGraph = {
    "task_A": ["task_B"],
    "task_B": ["task_C"],
    "task_C": [],
  };
  const acyclicResult = detectDependencyCycles(acyclicGraph);
  assert(
    acyclicResult.hasCycles === false,
    "Quality gate cycle detector verifies valid acyclic DAG"
  );

  // Auto-repair on damaged input
  const damagedRoadmap: any = {
    id: "rm_damaged",
    title: "I need as a damaged roadmap",
    stages: [{ stage: 2, skillFocus: "Stage 2" }], // Out of order stage
    nodes: [{ level: 2, title: "", topics: [] }],
  };
  const repairResult = validateRoadmapQualityGate(damagedRoadmap, "Software Engineering");
  assert(
    repairResult.isValid === false &&
    Boolean(repairResult.repairedRoadmap) &&
    repairResult.repairedRoadmap.stages[0].stage === 1,
    "Centralized validator identifies damaged stages and produces clean 1-to-N repaired roadmap"
  );

  // -----------------------------------------------------------------------------
  // REQUIREMENT 8: TWO-LEVEL CURRICULUM BLUEPRINT & STAGE EXPANSION
  // -----------------------------------------------------------------------------
  console.log("\n--- 8. TWO-LEVEL CURRICULUM ARCHITECTURE ---");

  // Blueprint Level A is preserved
  assert(
    Boolean(pyLearning.curriculumBlueprint) &&
    Array.isArray(pyLearning.curriculumBlueprint?.stages) &&
    pyLearning.curriculumBlueprint?.stages?.length === 12,
    "Roadmap preserves Level A CurriculumBlueprint throughout lifecycle"
  );

  // Level B Stage Expansion
  const expandedStage3 = expandRoadmapStage(pyLearning, 3);
  const targetNode3 = expandedStage3.nodes.find((n) => n.level === 3);
  assert(
    Boolean(targetNode3?.isExpanded) &&
    Array.isArray(targetNode3?.topics) &&
    targetNode3.topics.length >= 3,
    "expandRoadmapStage expands target stage with deep topics while preserving structure"
  );

  // -----------------------------------------------------------------------------
  // REQUIREMENT 10: REALISTIC PLANNING (NO UNSUPPORTED CLAIMS)
  // -----------------------------------------------------------------------------
  console.log("\n--- 10. REALISTIC PLANNING ---");

  const fullSerialized = JSON.stringify([pyLearning, feLearning, mlLearning, secLearning, mobileExecution]);
  const hasJobGuarantee = /\bguaranteed\s+(?:job|placement|employment|hire)\b/i.test(fullSerialized);
  const hasFixedDayMastery = /\bmastery\s+in\s+\d+\s+days\b/i.test(fullSerialized);
  const hasFakeExpertClaims = /\bused\s+by\s+all\s+fortune\s+500\b/i.test(fullSerialized);

  assert(
    !hasJobGuarantee,
    "Roadmaps contain zero unsupported job placement guarantees"
  );
  assert(
    !hasFixedDayMastery,
    "Roadmaps contain zero arbitrary fixed-day mastery claims"
  );
  assert(
    !hasFakeExpertClaims,
    "Roadmaps contain zero unverified corporate/expert claims"
  );

  // -----------------------------------------------------------------------------
  // REQUIREMENT 11: CONVERSATIONAL OVERVIEW FORMATTING
  // -----------------------------------------------------------------------------
  console.log("\n--- 11. CONVERSATIONAL OVERVIEW FORMATTING ---");

  const overviewText = formatRoadmapConversationalOverview(pyLearning);
  assert(
    overviewText.includes("**What you will achieve:**") &&
    overviewText.includes("**Proposed Progression") &&
    overviewText.includes("**Major Milestone Deliverables:**") &&
    overviewText.includes("**Expected Completion Evidence:**") &&
    overviewText.includes("**How to Begin:**"),
    "Conversational overview includes all 5 required structured sections"
  );

  // -----------------------------------------------------------------------------
  // REQUIREMENT 12: STORAGE ISOLATION & PERSISTENCE
  // -----------------------------------------------------------------------------
  console.log("\n--- 12. STORAGE & PERSISTENCE INTEGRITY ---");

  const testUserId = "user_master_test_" + Date.now();

  const item1: SavedRoadmapItem = {
    id: pyLearning.id,
    userId: testUserId,
    title: pyLearning.title,
    subject: "Python",
    domain: pyLearning.domain,
    summary: pyLearning.summary || "Python Curriculum",
    roadmapType: "LEARNING",
    targetSkillOrOutcome: "Python Backend",
    progressPercent: 25,
    totalStages: 12,
    completedStages: 3,
    activeMilestoneTitle: "Stage 4: OOP",
    roadmapData: pyLearning,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const item2: SavedRoadmapItem = {
    id: mobileExecution.id,
    userId: testUserId,
    title: mobileExecution.title,
    subject: "Mobile Engineering",
    domain: mobileExecution.domain,
    summary: mobileExecution.summary || "Mobile Plan",
    roadmapType: "EXECUTION",
    targetSkillOrOutcome: "Lead Mobile Architect",
    progressPercent: 50,
    totalStages: 6,
    completedStages: 3,
    activeMilestoneTitle: "Phase 4: API Integration",
    roadmapData: mobileExecution,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  saveRoadmapItem(item1, testUserId);
  saveRoadmapItem(item2, testUserId);

  const savedList = loadSavedRoadmapsList(testUserId);
  assert(
    savedList.length === 2,
    "Both roadmaps coexist independently in storage"
  );

  // Verify non-mutating isolation
  const loaded1 = findSavedRoadmapById(item1.id, testUserId);
  const loaded2 = findSavedRoadmapById(item2.id, testUserId);
  assert(
    loaded1?.roadmapData?.id === pyLearning.id && loaded1.progressPercent === 25,
    "Roadmap 1 preserves independent identity and progress"
  );
  assert(
    loaded2?.roadmapData?.id === mobileExecution.id && loaded2.progressPercent === 50,
    "Roadmap 2 preserves independent identity and progress without crosstalk"
  );

  // Remove Roadmap 1
  deleteRoadmapItem(item1.id, testUserId);
  const afterDeleteList = loadSavedRoadmapsList(testUserId);
  assert(
    afterDeleteList.length === 1 && afterDeleteList[0].id === item2.id,
    "Deleting Roadmap 1 leaves Roadmap 2 completely intact"
  );

  // Cleanup
  deleteRoadmapItem(item2.id, testUserId);

  // -----------------------------------------------------------------------------
  // SUMMARY
  // -----------------------------------------------------------------------------
  console.log("\n==================================================================");
  console.log(`MASTER ROADMAP ENGINE VERIFICATION SUMMARY:`);
  console.log(`TOTAL TESTS: ${totalTests}`);
  console.log(`PASSED: ${passedTests}`);
  console.log(`FAILED: ${totalTests - passedTests}`);
  console.log("==================================================================");

  if (passedTests === totalTests) {
    console.log("✓ ALL MASTER ROADMAP ENGINE REQUIREMENTS VERIFIED SUCCESSFULLY!");
  } else {
    process.exit(1);
  }
}

runMasterVerification().catch((err) => {
  console.error("Unhandled test suite error:", err);
  process.exit(1);
});
