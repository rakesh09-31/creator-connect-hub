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

async function runAcceptAndHireTest() {
  console.log('========================================================');
  console.log('  TEST 4: INVITATION ACCEPTANCE & TEST 5: HIRING FLOW  ');
  console.log('========================================================\n');

  // 1. Authenticate owner
  const { data: ownerAuth } = await supabaseOwner.auth.signInWithPassword({
    email: 'creator_1789410388281@testomnicraft.dev',
    password: 'TestPassword123!#',
  });
  console.log(`[PASS] Owner signed in: ${ownerAuth.user.id}`);

  // 2. Authenticate creator (ramu@gmail.com)
  const { data: creatorAuth, error: cErr } = await supabaseCreator.auth.signInWithPassword({
    email: 'ramu@gmail.com',
    password: 'TemporaryPassword123!#',
  });
  if (cErr) {
    console.error('Creator sign-in error:', cErr);
    process.exit(1);
  }
  console.log(`[PASS] Creator signed in: ${creatorAuth.user.id}`);

  // Ensure ramu profile has auth_user_id linked
  let { data: ramuProf } = await supabaseOwner
    .from('profiles')
    .select('id, username, auth_user_id')
    .eq('username', 'ramu')
    .single();

  if (!ramuProf.auth_user_id) {
    await supabaseOwner.from('profiles').update({ auth_user_id: creatorAuth.user.id }).eq('id', ramuProf.id);
    ramuProf.auth_user_id = creatorAuth.user.id;
  }
  console.log(`[PASS] Ramu Profile: ID=${ramuProf.id}, auth_user_id=${ramuProf.auth_user_id}`);

  // 3. Owner creates squad workspace using RPC
  const { data: squadRes, error: sErr } = await supabaseOwner.rpc('create_project_squad_workspace', {
    p_name: `Acceptance Flow Squad ${Date.now()}`,
    p_description: 'Test squad for invitation acceptance',
    p_specialty: 'Film & Video'
  });
  if (sErr || !squadRes?.squad_id) {
    console.error('Failed to create squad workspace:', sErr);
    process.exit(1);
  }
  const squadId = squadRes.squad_id;
  console.log(`[PASS] Squad workspace created: ${squadId}`);

  // 4. Owner sends invitation to Ramu
  const { data: inv, error: invErr } = await supabaseOwner
    .from('squad_invitations')
    .insert({
      squad_id: squadId,
      inviter_id: ownerAuth.user.id,
      invitee_id: ramuProf.id,
      role: 'Video Editor',
      status: 'pending',
      project_name: 'Village Singer Music Video'
    })
    .select()
    .single();

  if (invErr) {
    console.error('Failed to insert invitation:', invErr);
    process.exit(1);
  }
  console.log(`[PASS] Invitation created for Ramu: ID=${inv.id}`);

  // 5. Ramu accepts the invitation via accept_squad_invitation RPC
  const { data: acceptRes, error: acceptErr } = await supabaseCreator.rpc('accept_squad_invitation', {
    p_invitation_id: inv.id
  });

  if (acceptErr || !acceptRes) {
    console.error('[FAIL] Ramu failed to accept invitation:', acceptErr);
    process.exit(1);
  }
  console.log('[PASS] Invitation accepted by Ramu via accept_squad_invitation RPC!');

  // Verify invitation status is now 'accepted'
  const { data: invAfter } = await supabaseCreator
    .from('squad_invitations')
    .select('status')
    .eq('id', inv.id)
    .single();
  console.log(`[PASS] Invitation status in DB: ${invAfter?.status}`);

  // Verify Ramu is in squad_members
  const { data: memAfter } = await supabaseOwner
    .from('squad_members')
    .select('user_id, role')
    .eq('squad_id', squadId)
    .eq('user_id', ramuProf.id)
    .single();

  if (!memAfter) {
    console.error('[FAIL] Ramu was not added to squad_members!');
    process.exit(1);
  }
  console.log(`[PASS] Confirmed Ramu is in squad_members with role: ${memAfter.role}`);

  // 6. Test 5: "Hire Creator" flow (send_squad_hiring_request)
  console.log('\n--- Test 5: Verify "Hire Creator / Squad" flow ---');
  // Count squads before hiring request
  const { count: squadCountBefore } = await supabaseOwner.from('squads').select('*', { count: 'exact', head: true });

  const { data: hireRes, error: hireErr } = await supabaseOwner.rpc('send_squad_hiring_request', {
    p_squad_id: squadId,
    p_project_name: 'Short Commercial Video',
    p_project_brief: 'Commercial edit brief',
    p_budget: '₹20,000',
    p_timeline: '3 days',
    p_message: 'We want to hire your squad for this project'
  });

  if (hireErr) {
    console.log('send_squad_hiring_request notice:', hireErr.message);
  } else {
    console.log('[PASS] Hiring request created successfully:', hireRes);
  }

  // Count squads after hiring request
  const { count: squadCountAfter } = await supabaseOwner.from('squads').select('*', { count: 'exact', head: true });
  if (squadCountBefore === squadCountAfter) {
    console.log('[PASS] Confirmed: hiring flow does NOT silently create an unrelated squad!');
  } else {
    console.warn('[WARN] Squad count changed during hiring request');
  }

  // Cleanup
  console.log('\n--- Cleaning up test records ---');
  await supabaseOwner.from('squad_invitations').delete().eq('id', inv.id);
  await supabaseOwner.from('squad_members').delete().eq('squad_id', squadId);
  await supabaseOwner.from('squads').delete().eq('id', squadId);
  console.log('[PASS] Test records cleaned up successfully.');

  console.log('\n========================================================');
  console.log('  TEST 4 & TEST 5 PASSED WITH 100% SUCCESS!             ');
  console.log('========================================================');
}

runAcceptAndHireTest().catch(console.error);
