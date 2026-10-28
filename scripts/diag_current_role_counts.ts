import { fetchCreatorDirectoryPool, computeRoleCandidateCount } from "../src/lib/omniforge/matcher";
import { ALL_CANONICAL_CINEMATIC_ROLES } from "../src/lib/omniforge/film-taxonomy";

async function main() {
  const pool = await fetchCreatorDirectoryPool();
  console.log(`Total creator pool size: ${pool.length}`);
  
  const targetRoles = [
    "Lead Actor",
    "Lead Actress",
    "Dancer",
    "Choreographer",
    "Lead Singer",
    "Cinematographer",
    "Camera Operator",
    "Video Editor",
    "Sound Designer",
    "Music Director",
    "Colorist"
  ];

  console.log("\nCurrent Counts Before Fix:");
  for (const role of targetRoles) {
    const count = computeRoleCandidateCount(pool, role);
    console.log(`${role}: ${count}`);
  }
}

main().catch(console.error);
