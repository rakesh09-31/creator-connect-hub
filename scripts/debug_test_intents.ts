import {
  buildCompletePythonRoadmap,
  buildCompleteFrontendRoadmap,
  buildCompleteCybersecurityRoadmap,
} from "../src/lib/omniforge/universal-roadmap";
import {
  saveRoadmapItem,
  loadSavedRoadmapsList,
  findSavedRoadmapById,
  deleteRoadmapItem,
} from "../src/lib/omniforge/storage";

const py = buildCompletePythonRoadmap();
console.log("Python skillFocus:", py.stages.map(s => s.skillFocus));

const fe = buildCompleteFrontendRoadmap();
console.log("Frontend skillFocus:", fe.stages.map(s => s.skillFocus));

const sec = buildCompleteCybersecurityRoadmap();
console.log("Sec skillFocus:", sec.stages.map(s => s.skillFocus));

// Test storage
const testUserId = "user_debug_" + Date.now();
saveRoadmapItem({
  id: "test_1",
  userId: testUserId,
  title: "Test 1",
  subject: "Python",
  domain: "Eng",
  summary: "Sum",
  roadmapType: "LEARNING",
  targetSkillOrOutcome: "Eng",
  progressPercent: 20,
  totalStages: 12,
  completedStages: 2,
  activeMilestoneTitle: "Stage 3",
  roadmapData: py,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}, testUserId);

const list = loadSavedRoadmapsList(testUserId);
console.log("Loaded list length for " + testUserId + ":", list.length);
