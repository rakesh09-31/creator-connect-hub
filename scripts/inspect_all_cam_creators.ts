import { fetchCreatorDirectoryPool } from "../src/lib/omniforge/matcher";

async function main() {
  const pool = await fetchCreatorDirectoryPool();
  for (const c of pool) {
    const isCam = c.roles.some(r => /cinema|dop|camera|video|photo/i.test(r)) ||
      c.specialties.some(s => /cinema|dop|camera|video|photo/i.test(s)) ||
      c.skills.some(sk => /cinema|dop|camera|video|photo/i.test(sk)) ||
      c.portfolioSamples.some(p => /cinema|dop|camera|shoot|film/i.test(p.title));
    if (isCam) {
      console.log(`@${c.username}: roles=${JSON.stringify(c.roles)}, specs=${JSON.stringify(c.specialties)}, skills=${JSON.stringify(c.skills)}, port=${c.portfolioSamples.map(p => p.title).join(", ")}`);
    }
  }
}
main().catch(console.error);
