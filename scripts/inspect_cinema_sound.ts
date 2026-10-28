import { fetchCreatorDirectoryPool, evaluateRoleMatchEvidence, findRoleDef } from "../src/lib/omniforge/matcher";

async function main() {
  const pool = await fetchCreatorDirectoryPool();
  console.log(`Pool size: ${pool.length}`);

  console.log("\nInspecting Cinematographer candidates:");
  let cinemaMatches = 0;
  for (const c of pool) {
    const ev = evaluateRoleMatchEvidence(c, "Cinematographer");
    const hasAny = c.roles.some(r => /cinema|dop|camera/i.test(r)) ||
      c.specialties.some(s => /cinema|dop|camera/i.test(s)) ||
      c.skills.some(sk => /cinema|dop|camera/i.test(sk)) ||
      c.portfolioSamples.some(p => /cinema|dop|camera/i.test(p.title + " " + (p.description || "")));
    if (hasAny) {
      console.log(`Creator @${c.username}: score=${ev.score}, reason=${ev.reason}, roles=${JSON.stringify(c.roles)}, specs=${JSON.stringify(c.specialties)}, skills=${JSON.stringify(c.skills)}`);
      if (ev.score > 0) cinemaMatches++;
    }
  }
  console.log(`Total Cinematographer matches: ${cinemaMatches}`);

  console.log("\nInspecting Sound Designer candidates:");
  let soundMatches = 0;
  for (const c of pool) {
    const ev = evaluateRoleMatchEvidence(c, "Sound Designer");
    const hasAny = c.roles.some(r => /sound|audio|foley/i.test(r)) ||
      c.specialties.some(s => /sound|audio|foley/i.test(s)) ||
      c.skills.some(sk => /sound|audio|foley/i.test(sk));
    if (hasAny) {
      console.log(`Creator @${c.username}: score=${ev.score}, reason=${ev.reason}, roles=${JSON.stringify(c.roles)}, specs=${JSON.stringify(c.specialties)}, skills=${JSON.stringify(c.skills)}`);
      if (ev.score > 0) soundMatches++;
    }
  }
  console.log(`Total Sound Designer matches: ${soundMatches}`);
}

main().catch(console.error);
