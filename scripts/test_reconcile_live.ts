import { supabase } from '../src/integrations/supabase/client';
import { generateStructuredBlueprint } from '../src/lib/omniforge/engine-blueprint';
import { reconcileProjectTeamState } from '../src/lib/omniforge/team-reconciliation';
import { fetchSquadMembers, fetchSquadInvitations } from '../src/lib/omniforge/collaboration';

async function testReconciliation() {
  const squadId = 'd7c14b35-6554-4c23-a638-527f0d6c7df4';

  const [dbMembers, dbInvs] = await Promise.all([
    fetchSquadMembers(squadId),
    fetchSquadInvitations(squadId),
  ]);

  console.log('dbMembers count:', dbMembers?.length);
  console.log('dbMembers users:', dbMembers?.map(m => ({ role: m.role, username: m.user?.username, id: m.user_id })));
  console.log('dbInvs count:', dbInvs?.length);

  const project = generateStructuredBlueprint("Romantic Musical Film", "creator", "1db1f000-718e-4164-b216-e428fd874afb", "DIRECTOR");
  project.squadId = squadId;

  console.log('\n--- Project roles before reconciliation ---');
  console.log(project.roles.map(r => ({ id: r.id, name: r.roleName, isFilled: r.isFilled })));

  const reconciled = reconcileProjectTeamState(project, dbMembers || [], dbInvs || [], "1db1f000-718e-4164-b216-e428fd874afb");

  console.log('\n--- Project roles after reconciliation ---');
  console.log(reconciled.roles.map(r => ({ id: r.id, name: r.roleName, isFilled: r.isFilled, assignedCreatorId: r.assignedCreatorId })));

  console.log('\n--- Recommendations after reconciliation ---');
  console.log(reconciled.recommendations.map(r => ({ role: r.roleName, creator: r.creator.username, status: r.status })));

  console.log('\n--- Coverage after reconciliation ---');
  console.log(JSON.stringify(reconciled.coverage, null, 2));
}

testReconciliation().catch(console.error);
