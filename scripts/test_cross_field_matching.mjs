// scripts/test_cross_field_matching.mjs
import { calculateJobMatchScore, findRequirementEvidence } from '../src/lib/job-matching.ts';

console.log("=== RUNNING CROSS-FIELD MATCHING TESTS ===");

// TEST 1: User's primary case (Actor + Cinematography + Cinematography vs Job: Actor + Acting + Film Acting)
const creatorActor = {
  id: "creator-actor-1",
  username: "actor_john",
  roles: ["Actor"],
  skills: ["Cinematography"],
  specialties: ["Cinematography"],
  experienceLevel: "Intermediate",
};

const jobActing = {
  id: "job-acting-1",
  title: "Lead Actor for Indie Feature",
  description: "Looking for an actor for our upcoming film.",
  rolesRequired: ["Actor"],
  skillsRequired: ["Acting"],
  specialtiesRequired: ["Film Acting"],
  experienceLevel: "Intermediate",
};

const result1 = calculateJobMatchScore(creatorActor, jobActing);
console.log("\n--- TEST 1: Actor vs Acting Job ---");
console.log(`Score: ${result1.matchScore}% (Tier: ${result1.tierLabel})`);
console.log("Matched Roles:", result1.matchedRoles);
console.log("Matched Skills:", result1.matchedSkills);
console.log("Missing Skills:", result1.missingSkills);
console.log("Matched Specialties:", result1.matchedSpecialties);
console.log("Missing Specialties:", result1.missingSpecialties);
console.log("Evidence Details:");
result1.evidenceDetails.forEach(e => {
  console.log(`  • [${e.status.toUpperCase()}] ${e.type}: "${e.requirement}" → Source: ${e.evidenceSource} (Strength: ${e.strength})`);
});

// Assertions for Test 1
if (result1.missingSkills.includes("Acting")) {
  console.error("FAILED: 'Acting' should NOT be missing!");
  process.exit(1);
}
if (!result1.matchedSkills.some(s => s.toLowerCase().includes("acting"))) {
  console.error("FAILED: 'Acting' should be matched via Actor role evidence!");
  process.exit(1);
}
console.log("✓ TEST 1 PASSED: 'Acting' successfully matched via Actor role evidence!");

// TEST 2: Canonical Relationships (Actor -> Acting, Dancer -> Dance, etc.)
console.log("\n--- TEST 2: Canonical Cross-Field Relationships ---");
const canonicalPairs = [
  { role: "Actor", skill: "Acting" },
  { role: "Dancer", skill: "Dance" },
  { role: "Singer", skill: "Singing" },
  { role: "Photographer", skill: "Photography" },
  { role: "Writer", skill: "Writing" },
  { role: "Editor", skill: "Video Editing" },
  { role: "Video Editor", skill: "Video Editing" },
  { role: "Director", skill: "Directing" },
  { role: "Animator", skill: "Animation" },
  { role: "Designer", skill: "Design" },
  { role: "Voice Artist", skill: "Voice Acting" },
  { role: "Cinematographer", skill: "Cinematography" },
];

for (const pair of canonicalPairs) {
  const c = { id: "c", username: "c", roles: [pair.role], skills: [], specialties: [] };
  const ev = findRequirementEvidence(pair.skill, "skill", c);
  if (ev.status === "missing") {
    console.error(`FAILED: Role "${pair.role}" failed to match required skill "${pair.skill}"!`);
    process.exit(1);
  }
  console.log(`✓ ${pair.role} ↔ ${pair.skill} MATCHED: ${ev.evidenceSource} (strength: ${ev.strength})`);
}

// TEST 3: Unrelated combinations (Ensure no false matches)
console.log("\n--- TEST 3: Unrelated Combinations (No False Positives) ---");
const unrelatedPairs = [
  { role: "Actor", skill: "Video Editing" },
  { role: "Actor", skill: "Cinematography" },
  { role: "Photographer", skill: "Acting" },
  { role: "Dancer", skill: "Writing" },
];

for (const pair of unrelatedPairs) {
  const c = { id: "c", username: "c", roles: [pair.role], skills: [], specialties: [] };
  const ev = findRequirementEvidence(pair.skill, "skill", c);
  if (ev.status !== "missing") {
    console.error(`FAILED: Role "${pair.role}" should NOT match unrelated skill "${pair.skill}"! Got: ${ev.evidenceSource}`);
    process.exit(1);
  }
  console.log(`✓ ${pair.role} vs ${pair.skill} correctly rejected as missing`);
}

// TEST 4: Full Match (100%) vs Zero Match (0%)
console.log("\n--- TEST 4: Strict 100% and 0% Scenarios ---");
const fullMatchCreator = {
  id: "c-full",
  username: "full_match",
  roles: ["Video Editor"],
  skills: ["Premiere Pro", "Color Grading"],
  specialties: ["YouTube Editing"],
  experienceLevel: "Senior",
};

const fullMatchJob = {
  id: "j-full",
  title: "Senior YouTube Video Editor",
  description: "Need senior editor with Premiere and Color Grading for YouTube channel.",
  rolesRequired: ["Video Editor"],
  skillsRequired: ["Premiere Pro", "Color Grading"],
  specialtiesRequired: ["YouTube Editing"],
  experienceLevel: "Senior",
};

const fullResult = calculateJobMatchScore(fullMatchCreator, fullMatchJob);
console.log(`Full Match Score: ${fullResult.matchScore}% (Expected 100%)`);
if (fullResult.matchScore !== 100) {
  console.error(`FAILED: Expected 100% match, got ${fullResult.matchScore}%`);
  process.exit(1);
}

const zeroMatchCreator = {
  id: "c-zero",
  username: "actor_only",
  roles: ["Actor"],
  skills: ["Voice Acting"],
  specialties: ["Theatre"],
  experienceLevel: "Beginner",
};

const zeroResult = calculateJobMatchScore(zeroMatchCreator, fullMatchJob);
console.log(`Zero Match Score: ${zeroResult.matchScore}% (Expected 0%)`);
if (zeroResult.matchScore !== 0) {
  console.error(`FAILED: Expected 0% match, got ${zeroResult.matchScore}%`);
  process.exit(1);
}

console.log("\n=== ALL CROSS-FIELD MATCHING ENGINE TESTS PASSED! ===");
