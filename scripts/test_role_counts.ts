import { searchCreatorsDirectory } from '../src/lib/omniforge/matcher';

async function main() {
  const roles = [
    "Lead Actor",
    "Lead Actress",
    "Dancer",
    "Choreographer",
    "Lead Singer",
    "Cinematographer",
    "Video Editor",
    "Sound Designer",
  ];

  for (const role of roles) {
    const t0 = performance.now();
    const res = await searchCreatorsDirectory({ targetRole: role });
    const ms = Math.round(performance.now() - t0);
    console.log(`${role}: ${res.totalCount} candidates in DB (${ms}ms) -> usernames:`, res.creators.map(c => c.creator.username));
  }
}

main().catch(console.error);
