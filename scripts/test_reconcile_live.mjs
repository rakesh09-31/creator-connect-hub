import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { generateStructuredBlueprint } from '../src/lib/omniforge/engine-blueprint.js';
import { reconcileProjectTeamState } from '../src/lib/omniforge/team-reconciliation.js';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function testReconciliation() {
  const squadId = 'd7c14b35-6554-4c23-a638-527f0d6c7df4';

  const { data: dbMembers } = await supabase
    .from('squad_members')
    .select('*, user:user_id(id, username, full_name, avatar_url)')
    .eq('squad_id', squadId);

  const { data: dbInvs } = await supabase
    .from('squad_invitations')
    .select('*, invitee:invitee_id(id, username, full_name, avatar_url), inviter:inviter_id(id, username, full_name)')
    .eq('squad_id', squadId);

  console.log('dbMembers count:', dbMembers?.length);
  console.log('dbInvs count:', dbInvs?.length);

  // Let's create the project as created in _app.omniforge.tsx:
  // project = generateStructuredBlueprint("Romantic Musical Film", "creator", "anon", "DIRECTOR");
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
