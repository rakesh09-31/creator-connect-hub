import { fetchCreatorDirectoryPool } from '../src/lib/omniforge/matcher';

async function inspectPool() {
  const pool = await fetchCreatorDirectoryPool();
  console.log("Total pool size:", pool.length);

  const cineCandidates = [];
  const soundCandidates = [];
  const musicCandidates = [];

  for (const c of pool) {
    const allText = [
      c.role,
      ...(c.roles || []),
      ...(c.specialties || []),
      ...(c.skills || []),
      ...(c.portfolioSamples || []).map(p => `${p.title} ${p.description || ''}`)
    ].join(' ').toLowerCase();

    if (/cinematograph|dop|director of photography/i.test(allText)) {
      cineCandidates.push({ username: c.username, roles: c.roles, specialties: c.specialties, skills: c.skills, portfolio: c.portfolioSamples?.map(p => p.title) });
    }
    if (/sound design|foley|audio mix|sound edit|5\.1|ambient sound|audio post/i.test(allText)) {
      soundCandidates.push({ username: c.username, roles: c.roles, specialties: c.specialties, skills: c.skills, portfolio: c.portfolioSamples?.map(p => p.title) });
    }
    if (/music direct|composer|film score|soundtrack|score/i.test(allText)) {
      musicCandidates.push({ username: c.username, roles: c.roles, specialties: c.specialties, skills: c.skills, portfolio: c.portfolioSamples?.map(p => p.title) });
    }
  }

  console.log("\nTrue Cinematography candidates:", cineCandidates);
  console.log("\nTrue Sound Design candidates:", soundCandidates);
  console.log("\nTrue Music Direction / Composer candidates:", musicCandidates);
}

inspectPool().catch(console.error);
