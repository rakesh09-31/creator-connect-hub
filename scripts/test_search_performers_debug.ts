import { searchCreatorsDirectory } from '../src/lib/omniforge/matcher.ts';

async function test() {
  const perf = await searchCreatorsDirectory({ targetRole: 'Performers' });
  console.log('Performers total count:', perf.totalCount);
  console.log('Performers candidates:');
  for (const c of perf.creators.slice(0, 10)) {
    console.log(`- @${c.creator.username} (${c.creator.fullName || c.creator.username}) | Score: ${c.matchScore}% | Reason: ${c.matchReason}`);
  }
}

test();
