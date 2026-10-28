import { fetchCreatorDirectoryPool } from "../src/lib/omniforge/matcher";

async function main() {
  const pool = await fetchCreatorDirectoryPool();
  console.log(`Pool total: ${pool.length}`);
  const specsMap = new Map<string, number>();
  const rolesMap = new Map<string, number>();
  const skillsMap = new Map<string, number>();

  for (const c of pool) {
    for (const s of c.specialties) {
      specsMap.set(s, (specsMap.get(s) || 0) + 1);
    }
    for (const r of c.roles) {
      rolesMap.set(r, (rolesMap.get(r) || 0) + 1);
    }
    for (const sk of c.skills) {
      skillsMap.set(sk, (skillsMap.get(sk) || 0) + 1);
    }
  }

  console.log("\nTop Specialties in DB:", Array.from(specsMap.entries()).sort((a,b) => b[1] - a[1]));
  console.log("\nTop Roles in DB:", Array.from(rolesMap.entries()).sort((a,b) => b[1] - a[1]));
  console.log("\nTop Skills in DB:", Array.from(skillsMap.entries()).sort((a,b) => b[1] - a[1]).slice(0, 30));
}
main().catch(console.error);
