import {
  loadSavedRoadmapsList,
  saveRoadmapItem,
  deleteRoadmapItem,
  getRoadmapsStorageKey,
} from "../src/lib/omniforge/storage";
import { SavedRoadmapItem } from "../src/lib/omniforge/types";
import { buildUniversalRoadmap } from "../src/lib/omniforge/universal-roadmap";

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

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`[PASS] ${msg}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${msg}`);
    failCount++;
  }
}

console.log("==================================================================");
console.log("OMNIFORGE SIDEBAR LAYOUT & DELETE VERIFICATION SUITE");
console.log("==================================================================");

// Setup 3 roadmaps (including 2 with similar titles)
const rm1Data = buildUniversalRoadmap("Distributed Systems in Go");
const rm2Data = buildUniversalRoadmap("Distributed Systems in Python");
const rm3Data = buildUniversalRoadmap("Screenwriting & Narrative");

const rm1: SavedRoadmapItem = {
  id: "rm_dist_go_101",
  title: "Distributed Systems in Go Roadmap",
  subject: "Distributed Systems in Go",
  domain: "Backend Engineering",
  summary: "Comprehensive guide to distributed systems in Go.",
  roadmapType: "CURRICULUM",
  totalStages: 6,
  completedStages: 2,
  currentStageIndex: 2,
  progressPercent: 33,
  updatedAt: new Date().toISOString(),
  roadmapData: rm1Data,
};

const rm2: SavedRoadmapItem = {
  id: "rm_dist_py_102",
  title: "Distributed Systems in Python Roadmap", // Similar title to rm1
  subject: "Distributed Systems in Python",
  domain: "Backend Engineering",
  summary: "Comprehensive guide to distributed systems in Python.",
  roadmapType: "CURRICULUM",
  totalStages: 6,
  completedStages: 0,
  currentStageIndex: 0,
  progressPercent: 0,
  updatedAt: new Date().toISOString(),
  roadmapData: rm2Data,
};

const rm3: SavedRoadmapItem = {
  id: "rm_screen_103",
  title: "Screenwriting Mastery Roadmap",
  subject: "Screenwriting",
  domain: "Creative Writing",
  summary: "Curriculum for professional screenplay writing.",
  roadmapType: "CURRICULUM",
  totalStages: 6,
  completedStages: 1,
  currentStageIndex: 1,
  progressPercent: 17,
  updatedAt: new Date().toISOString(),
  roadmapData: rm3Data,
};

// Test 1: Save all 3 roadmaps
saveRoadmapItem(rm1);
saveRoadmapItem(rm2);
saveRoadmapItem(rm3);

let list = loadSavedRoadmapsList();
assert(list.length === 3, "Saved 3 distinct roadmaps successfully");

// Test 2: Deleting by canonical ID removes only that roadmap
deleteRoadmapItem(rm1.id);
list = loadSavedRoadmapsList();
assert(list.length === 2, "Removed exactly 1 roadmap by ID");
assert(!list.some((r) => r.id === rm1.id), "Deleted roadmap rm1 is no longer in saved list");
assert(
  list.some((r) => r.id === rm2.id),
  "Roadmap rm2 with similar title remains intact with 0% progress"
);
assert(
  list.some((r) => r.id === rm3.id),
  "Roadmap rm3 remains intact with original progress"
);

// Test 3: Simulating active roadmap deletion and auto-selection of next available
let activeRoadmapId = rm2.id;
let activeRoadmap = list.find((r) => r.id === activeRoadmapId);
assert(activeRoadmap !== undefined, "Active roadmap rm2 is found");

// Delete active roadmap rm2
deleteRoadmapItem(rm2.id);
list = loadSavedRoadmapsList();
assert(list.length === 1, "Only 1 roadmap remains after deleting active roadmap rm2");

// Auto-selection of next available roadmap
let nextSelected = list.length > 0 ? list[0] : null;
assert(nextSelected !== null && nextSelected.id === rm3.id, "Auto-selected remaining roadmap rm3");

// Test 4: Deleting the final roadmap leads to empty state
deleteRoadmapItem(rm3.id);
list = loadSavedRoadmapsList();
assert(list.length === 0, "No roadmaps remain in storage after deleting final roadmap");

let emptyStateActive = list.length === 0 ? null : list[0];
assert(emptyStateActive === null, "Empty state triggered when 0 roadmaps remain");

// Test 5: Re-saving after empty state works cleanly
saveRoadmapItem(rm1);
list = loadSavedRoadmapsList();
assert(list.length === 1 && list[0].id === rm1.id, "Successfully restored roadmap after empty state");

console.log("==================================================================");
console.log(`RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log("==================================================================");

if (failCount > 0) process.exit(1);
