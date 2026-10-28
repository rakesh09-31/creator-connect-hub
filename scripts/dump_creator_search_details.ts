import { searchCreatorsDirectory } from '../src/lib/omniforge/matcher';

async function dump() {
  console.log('=== LEAD ACTORS (HEROES) ===');
  const heroes = await searchCreatorsDirectory({ targetRole: 'Lead Actor', scope: 'ALL', page: 1, pageSize: 10 });
  console.log(`Total: ${heroes.totalCount}, Page: ${heroes.page}, PageSize: ${heroes.pageSize}`);
  for (const c of heroes.creators.slice(0, 5)) {
    console.log(`- ID: ${c.creator.id}, Username: @${c.creator.username}, Name: ${c.creator.fullName}, Score: ${c.matchScore}%, Reason: ${c.matchReason}`);
  }

  console.log('\n=== VIDEO EDITORS ===');
  const editors = await searchCreatorsDirectory({ targetRole: 'Video Editor', scope: 'ALL', page: 1, pageSize: 10 });
  console.log(`Total: ${editors.totalCount}, Page: ${editors.page}, PageSize: ${editors.pageSize}`);
  for (const c of editors.creators.slice(0, 5)) {
    console.log(`- ID: ${c.creator.id}, Username: @${c.creator.username}, Name: ${c.creator.fullName}, Score: ${c.matchScore}%, Reason: ${c.matchReason}`);
  }

  console.log('\n=== FIGHT MASTERS ===');
  const fighters = await searchCreatorsDirectory({ targetRole: 'Fight Master', scope: 'ALL', page: 1, pageSize: 10 });
  console.log(`Total: ${fighters.totalCount}, Page: ${fighters.page}, PageSize: ${fighters.pageSize}`);
  for (const c of fighters.creators) {
    console.log(`- ID: ${c.creator.id}, Username: @${c.creator.username}, Name: ${c.creator.fullName}, Score: ${c.matchScore}%, Reason: ${c.matchReason}`);
  }

  console.log('\n=== CHOREOGRAPHERS ===');
  const chor = await searchCreatorsDirectory({ targetRole: 'Choreographer', scope: 'ALL', page: 1, pageSize: 10 });
  console.log(`Total: ${chor.totalCount}, Page: ${chor.page}, PageSize: ${chor.pageSize}`);
  for (const c of chor.creators) {
    console.log(`- ID: ${c.creator.id}, Username: @${c.creator.username}, Name: ${c.creator.fullName}, Score: ${c.matchScore}%, Reason: ${c.matchReason}`);
  }
}

dump().catch(console.error);
