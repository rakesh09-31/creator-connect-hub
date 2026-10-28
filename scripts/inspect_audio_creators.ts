import { fetchCreatorDirectoryPool } from "../src/lib/omniforge/matcher";

async function main() {
  const pool = await fetchCreatorDirectoryPool();
  for (const c of pool) {
    const hasAudio = c.roles.some(r => /audio|sound|music|mix|master/i.test(r)) ||
      c.specialties.some(s => /audio|sound|music|mix|master/i.test(s)) ||
      c.skills.some(sk => /audio|sound|music|mix|master/i.test(sk));
    if (hasAudio) {
      console.log(`@${c.username}: roles=${JSON.stringify(c.roles)}, specs=${JSON.stringify(c.specialties)}, skills=${JSON.stringify(c.skills)}`);
    }
  }
}
main().catch(console.error);
