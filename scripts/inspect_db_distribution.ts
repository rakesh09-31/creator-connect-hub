import { fetchCreatorDirectoryPool } from "../src/lib/omniforge/matcher";

async function main() {
  const pool = await fetchCreatorDirectoryPool();
  console.log(`Total pool size: ${pool.length}`);

  const specCounts: Record<string, number> = {};
  const skillCounts: Record<string, number> = {};
  const roleCounts: Record<string, number> = {};

  for (const c of pool) {
    for (const s of c.specialties || []) {
      specCounts[s] = (specCounts[s] || 0) + 1;
    }
    for (const sk of c.skills || []) {
      skillCounts[sk] = (skillCounts[sk] || 0) + 1;
    }
    for (const r of c.roles || []) {
      roleCounts[r] = (roleCounts[r] || 0) + 1;
    }
  }

  console.log("\n--- SPECIALTIES IN DB ---");
  console.log(JSON.stringify(specCounts, null, 2));

  console.log("\n--- TOP SKILLS IN DB ---");
  const sortedSkills = Object.entries(skillCounts).sort((a, b) => b[1] - a[1]);
  console.log(JSON.stringify(sortedSkills.slice(0, 30), null, 2));

  console.log("\n--- ROLES IN DB ---");
  console.log(JSON.stringify(roleCounts, null, 2));
}

main().catch(console.error);
