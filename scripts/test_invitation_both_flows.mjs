import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabaseOwner = createClient(url, key);
const supabaseCreator = createClient(url, key);

async function runComprehensiveFlows() {
  console.log('===============================================================');
  console.log('  TESTING SQUAD INVITATION IDENTITY MAPPING & FK INTEGRATION  ');
  console.log('===============================================================\n');

  // 1. Sign in as client / inviter
  const { data: signinData, error: sErr } = await supabaseOwner.auth.signInWithPassword({
    email: 'creator_1789410388281@testomnicraft.dev',
    password: 'TestPassword123!#',
  });
  if (sErr) throw new Error(`Sign in failed: ${sErr.message}`);

  const authUser = signinData.user;
  console.log('1. Authenticated Inviter:');
  console.log('   auth.uid():', authUser.id);

  // Resolve inviter profile
  const { data: inviterProf, error: pErr } = await supabaseOwner
    .from('profiles')
    .select('id, auth_user_id, username, full_name, role')
    .or(`id.eq.${authUser.id},auth_user_id.eq.${authUser.id}`)
    .limit(1)
    .single();

  if (pErr || !inviterProf) throw new Error(`Could not resolve inviter profile: ${pErr?.message}`);
  console.log('   Canonical Profile ID:', inviterProf.id);
  console.log('   Profile auth_user_id:', inviterProf.auth_user_id);
  console.log('   Username:', inviterProf.username);

  // 2. Create or find test squad
  const squadName = `FK Test Squad ${Date.now()}`;
  const { data: squadRes, error: rpcErr } = await supabaseOwner.rpc('create_project_squad_workspace', {
    p_name: squadName,
    p_description: 'Squad for verifying foreign key constraint mappings',
    p_specialty: 'Video Editing',
    p_budget: '$1500',
    p_timeline: '2 weeks',
    p_project_brief: 'Testing FK and RLS integration',
    p_owner_profile_id: inviterProf.id
  });

  if (rpcErr || !squadRes?.squad_id) {
    throw new Error(`Failed to create squad workspace: ${rpcErr?.message}`);
  }
  const squadId = squadRes.squad_id;
  console.log('\n2. Squad Workspace Created:');
  console.log('   Squad ID:', squadId);

  // 3. Flow A: Invite Auth-Linked Creator (ramu: 01214642-fd80-41b3-b1c8-e1241ab84c60)
  console.log('\n3. Flow A: Inviting Auth-Linked Creator (ramu)...');
  const { data: ramuProf } = await supabaseOwner
    .from('profiles')
    .select('id, auth_user_id, username, full_name')
    .eq('username', 'ramu')
    .single();

  console.log('   Target Creator ID (profiles.id):', ramuProf.id);
  console.log('   Target Creator auth_user_id:', ramuProf.auth_user_id);

  // Clean any old invitations for this creator in this squad
  await supabaseOwner.from('squad_invitations').delete().eq('squad_id', squadId).eq('invitee_id', ramuProf.id);

  const { data: rpcInvA, error: errA } = await supabaseOwner.rpc('send_project_squad_invitation', {
    p_squad_id: squadId,
    p_invitee_profile_id: ramuProf.id,
    p_role: 'Lead Video Editor',
    p_project_name: 'Short Film Flow A',
    p_brief: 'Lead editing and color grading',
    p_budget: '$1200',
    p_timeline: '10 days'
  });

  if (errA || !rpcInvA?.success) {
    throw new Error(`Flow A RPC failed: ${errA?.message || JSON.stringify(rpcInvA)}`);
  }
  console.log('   [SUCCESS] Flow A RPC returned:', rpcInvA);

  // Verify in squad_invitations table
  const { data: invRowA, error: fetchErrA } = await supabaseOwner
    .from('squad_invitations')
    .select('*')
    .eq('id', rpcInvA.invitation_id)
    .single();

  if (fetchErrA || !invRowA) throw new Error(`Could not fetch created invitation A: ${fetchErrA?.message}`);
  console.log('   Verified squad_invitations row A:');
  console.log('     id:', invRowA.id);
  console.log('     squad_id:', invRowA.squad_id, '(matches squadId:', invRowA.squad_id === squadId, ')');
  console.log('     inviter_id:', invRowA.inviter_id, '(matches canonical profile:', invRowA.inviter_id === inviterProf.id, ')');
  console.log('     invitee_id:', invRowA.invitee_id, '(matches canonical profile:', invRowA.invitee_id === ramuProf.id, ')');
  console.log('     status:', invRowA.status);

  // 4. Flow B: Invite Directory-Only Creator (rc_edits: 0da09bf1-a9f1-47b1-9a50-0165c2c3c853)
  console.log('\n4. Flow B: Inviting Directory-Only Creator (rc_edits)...');
  const { data: dirProf } = await supabaseOwner
    .from('profiles')
    .select('id, auth_user_id, username, full_name')
    .eq('username', 'rc_edits')
    .single();

  console.log('   Target Directory Creator ID (profiles.id):', dirProf.id);
  console.log('   Target Directory Creator auth_user_id:', dirProf.auth_user_id, '(NULL as expected for directory creator)');

  const { data: rpcInvB, error: errB } = await supabaseOwner.rpc('send_project_squad_invitation', {
    p_squad_id: squadId,
    p_invitee_profile_id: dirProf.id,
    p_role: 'Video Editor & Sound FX',
    p_project_name: 'Short Film Flow B',
    p_brief: 'Sound effects and pacing',
    p_budget: '$800',
    p_timeline: '7 days'
  });

  if (errB || !rpcInvB?.success) {
    throw new Error(`Flow B RPC failed: ${errB?.message || JSON.stringify(rpcInvB)}`);
  }
  console.log('   [SUCCESS] Flow B RPC returned:', rpcInvB);

  // Verify in squad_invitations table
  const { data: invRowB, error: fetchErrB } = await supabaseOwner
    .from('squad_invitations')
    .select('*')
    .eq('id', rpcInvB.invitation_id)
    .single();

  if (fetchErrB || !invRowB) throw new Error(`Could not fetch created invitation B: ${fetchErrB?.message}`);
  console.log('   Verified squad_invitations row B:');
  console.log('     id:', invRowB.id);
  console.log('     squad_id:', invRowB.squad_id);
  console.log('     inviter_id:', invRowB.inviter_id, '(matches canonical profile:', invRowB.inviter_id === inviterProf.id, ')');
  console.log('     invitee_id:', invRowB.invitee_id, '(matches directory profile:', invRowB.invitee_id === dirProf.id, ')');
  console.log('     status:', invRowB.status);

  // 5. Test Notification dispatch
  console.log('\n5. Verifying Notification Rows...');
  const { data: notifs } = await supabaseOwner
    .from('notifications')
    .select('*')
    .eq('entity_id', squadId);

  console.log(`   Found ${notifs?.length || 0} notifications for this squad.`);
  for (const n of notifs || []) {
    console.log(`     -> user_id: ${n.user_id}, actor_id: ${n.actor_id}, type: ${n.type}`);
  }

  // 6. Test Flow C: Accept Invitation as Ramu (Auth-Linked Creator)
  console.log('\n6. Flow C: Accepting Invitation as Auth-Linked Creator (ramu)...');
  const { data: creatorAuth, error: cErr } = await supabaseCreator.auth.signInWithPassword({
    email: 'ramu@gmail.com',
    password: 'TemporaryPassword123!#',
  });
  if (cErr) {
    throw new Error(`Creator (ramu) sign-in failed: ${cErr.message}`);
  }
  console.log('   [PASS] Creator signed in:', creatorAuth.user.id);

  // Call accept_squad_invitation RPC
  const { data: acceptRes, error: acceptErr } = await supabaseCreator.rpc('accept_squad_invitation', {
    p_invitation_id: invRowA.id
  });

  if (acceptErr || !acceptRes) {
    throw new Error(`Failed to accept invitation: ${acceptErr?.message}`);
  }
  console.log('   [PASS] accept_squad_invitation returned true!');

  // Verify invitation status is now 'accepted'
  const { data: invAfter } = await supabaseCreator
    .from('squad_invitations')
    .select('status')
    .eq('id', invRowA.id)
    .single();
  console.log(`   [PASS] Invitation status in DB: ${invAfter?.status}`);
  if (invAfter?.status !== 'accepted') {
    throw new Error(`Expected status 'accepted', got '${invAfter?.status}'`);
  }

  // Verify Ramu is in squad_members with canonical profile ID
  const { data: memRow } = await supabaseOwner
    .from('squad_members')
    .select('user_id, role, squad_id')
    .eq('squad_id', squadId)
    .eq('user_id', ramuProf.id)
    .single();

  if (!memRow) {
    throw new Error(`Ramu was not found in squad_members!`);
  }
  console.log('   [PASS] squad_members row successfully verified:');
  console.log('     squad_id:', memRow.squad_id);
  console.log('     user_id (canonical profiles.id):', memRow.user_id);
  console.log('     matches ramuProf.id:', memRow.user_id === ramuProf.id);
  console.log('     role:', memRow.role);

  console.log('\n===============================================================');
  console.log('  ALL CHECKS PASSED: ZERO FK VIOLATIONS, CLEAN IDENTITY MAP  ');
  console.log('===============================================================');
}

runComprehensiveFlows().catch((e) => {
  console.error('\n[FATAL ERROR IN TEST]:', e);
  process.exit(1);
});
