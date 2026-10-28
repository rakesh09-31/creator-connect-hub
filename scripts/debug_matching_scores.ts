import { searchCreatorsDirectory } from '../src/lib/omniforge/matcher';

async function main() {
  const roles = ['Lead Actor', 'Lead Actress', 'Dancer', 'Lead Singer', 'Cinematographer', 'Video Editor', 'Sound Designer'];
  for (const r of roles) {
    const res = await searchCreatorsDirectory({ targetRole: r, pageSize: 5 });
    console.log(`\n=================== ${r} (${res.totalCount} found) ===================`);
    res.creators.forEach((c) => {
      console.log(`- @${c.creator.username} | Score: ${c.matchScore}% | Reason: ${c.matchReason}`);
      console.log(`  Roles: [${c.creator.roles.join(', ')}] | Specs: [${c.creator.specialties.join(', ')}] | Skills: [${c.creator.skills.join(', ')}] | Portfolios: ${c.creator.portfolioSamples.map(p => p.title).join(', ') || 'None'}`);
    });
  }
}

main().catch(console.error);
