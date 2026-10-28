import { reconcileProjectTeamStateAsync } from '../src/lib/omniforge/team-reconciliation';

async function test() {
  const status = await reconcileProjectTeamStateAsync(null, true, undefined, 'I am a professional film director and I want to make a short film.');
  console.log('Covered:', status.coveredRoles.map(r => ({ name: r.roleName, user: r.assignedCreatorName })));
  console.log('Assigned:', status.assignedRoles.map(r => ({ name: r.roleName, user: r.assignedCreatorName })));
  console.log('Open with candidates:', status.openRolesWithCreators.map(r => r.roleName));
  console.log('Project dependent:', status.projectDependentRoles.map(r => r.roleName));
  process.exit(0);
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});
