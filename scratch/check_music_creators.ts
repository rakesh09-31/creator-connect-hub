import { fetchCreatorDirectoryPool } from '../src/lib/omniforge/matcher';

async function run() {
  const pool = await fetchCreatorDirectoryPool();
  const music = pool.filter(c => (c.specialties || []).some(s => /music/i.test(s)) || (c.roles || []).some(r => /music/i.test(r)));
  console.log('Music creators count:', music.length);
  for (const m of music) {
    console.log('@' + m.username, 'specialties:', m.specialties, 'roles:', m.roles, 'skills:', m.skills);
  }
}
run().catch(console.error);
