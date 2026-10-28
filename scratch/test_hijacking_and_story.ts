import { sendLocalAIChatMessage } from "../src/lib/api/local-ai.ts";
import { classifyUserIntent } from "../src/lib/omniforge/intent.ts";
import { isQueryProjectRelated, isQueryStoryRelated } from "../src/lib/omniforge/context-manager.ts";
import { OmniForgeProject } from "../src/lib/omniforge/types.ts";

const mockActiveProject: OmniForgeProject = {
  id: "test-proj-festival",
  title: "College Cultural Festival",
  domain: "Events",
  stages: [],
  milestones: [],
  budget: "50000",
  teamSize: 6,
  recommendations: [],
  coverage: {
    totalRequired: 6,
    totalCovered: 2,
    percentComplete: 33,
    coveredCapabilities: [],
    missingCapabilities: [
      { roleName: "Performer", importance: "CRITICAL", suggestedSpecialties: ["Acting", "Singing"] },
      { roleName: "Sound Engineer", importance: "HIGH", suggestedSpecialties: ["Audio"] }
    ]
  },
  tasks: [],
  deliverables: []
};

async function testProjectScoping() {
  console.log("\n==================================================");
  console.log("SECTION 8: TESTING PROJECT NON-HIJACKING");
  console.log("==================================================");

  // 1. "What is artificial intelligence?" with active project
  const q1 = "What is artificial intelligence?";
  const isProj1 = isQueryProjectRelated(q1, mockActiveProject);
  console.log(`Query: "${q1}" with Active Project [${mockActiveProject.title}]`);
  console.log(`  isQueryProjectRelated: ${isProj1} (Expected: false)`);
  if (isProj1) throw new Error("q1 failed: hijacked by project!");

  // 2. "What is stress?" with active project
  const q2 = "What is stress?";
  const isProj2 = isQueryProjectRelated(q2, mockActiveProject);
  console.log(`Query: "${q2}" with Active Project [${mockActiveProject.title}]`);
  console.log(`  isQueryProjectRelated: ${isProj2} (Expected: false)`);
  if (isProj2) throw new Error("q2 failed: hijacked by project!");

  // 3. "What roles are missing?" with active project
  const q3 = "What roles are missing?";
  const isProj3 = isQueryProjectRelated(q3, mockActiveProject);
  console.log(`Query: "${q3}" with Active Project [${mockActiveProject.title}]`);
  console.log(`  isQueryProjectRelated: ${isProj3} (Expected: true)`);
  if (!isProj3) throw new Error("q3 failed: should be project-related!");

  console.log("  [PASS] Project scoping correctly distinguishes project vs general queries.");
}

async function testStoryContinuity() {
  console.log("\n==================================================");
  console.log("SECTION 9: TESTING STORY PIPELINE CONTINUITY");
  console.log("==================================================");

  // Turn 1: Concept
  const t1 = "I want to direct an action thriller.";
  console.log(`\nTurn 1: "${t1}"`);
  const c1 = classifyUserIntent(t1);
  console.log(`  Intent: ${c1.intent}`);

  // Turn 2: Generate Story
  const t2 = "Generate the story.";
  console.log(`\nTurn 2: "${t2}"`);
  let tokens2 = 0;
  const r2 = await sendLocalAIChatMessage(
    t2,
    [{ role: "user", content: t1 }],
    { domain: "Film", title: "Action Thriller" },
    undefined,
    (token, acc) => {
      tokens2++;
    }
  );
  console.log(`  Generated story (${tokens2} tokens): ${r2.answer.length} chars`);
  console.log(`  Story preview: "${r2.answer.slice(0, 150).replace(/\n/g, ' ')}..."`);
  if (!r2.answer || r2.answer.length < 100) throw new Error("Story generation yielded empty or truncated text!");

  // Turn 3: Modify story
  const t3 = "Make the villain more intelligent.";
  console.log(`\nTurn 3: "${t3}"`);
  console.log(`  Calling sendLocalAIChatMessage with active_story preserved...`);
  let tokens3 = 0;
  const r3 = await sendLocalAIChatMessage(
    t3,
    [
      { role: "user", content: t1 },
      { role: "assistant", content: r2.answer }
    ],
    { active_story: r2.answer },
    undefined,
    (token, acc) => {
      tokens3++;
    }
  );
  console.log(`  Modified story (${tokens3} tokens): ${r3.answer.length} chars`);
  console.log(`  Modified preview: "${r3.answer.slice(0, 150).replace(/\n/g, ' ')}..."`);
  if (!r3.answer || r3.answer.length < 100) throw new Error("Story modification yielded empty text!");

  console.log("  [PASS] Story multi-turn generation and modification successfully verified!");
}

async function main() {
  await testProjectScoping();
  await testStoryContinuity();
  console.log("\nALL SECTION 8 & SECTION 9 AUTOMATED CHECKS PASSED!");
}

main().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
