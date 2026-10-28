import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function runVerification() {
  console.log('====================================================');
  console.log('  OMNIFORGE SQUADS RLS & INVITATION E2E TEST SUITE  ');
  console.log('====================================================\n');

  // Step 1: Sign in as authenticated user
  const { data: signinData, error: signinErr } = await supabase.auth.signInWithPassword({
    email: 'creator_1789410388281@testomnicraft.dev',
    password: 'TestPassword123!#',
  });
  if (signinErr || !signinData?.user) {
    console.error('Failed to authenticate test user:', signinErr);
    process.exit(1);
  }
  const authUser = signinData.user;
  console.log(`[PASS] 1. Authenticated as user ${authUser.id} (${authUser.email})`);

  // Step 2: Fetch user profile and check mapping
  let { data: profile } = await supabase
    .from('profiles')
    .select('id, username, full_name, role, auth_user_id')
    .or(`id.eq.${authUser.id},auth_user_id.eq.${authUser.id}`)
    .maybeSingle();

  if (!profile) {
    // If not found, create or link
    const { data: newProf, error: pErr } = await supabase.from('profiles').insert({
      id: authUser.id,
      auth_user_id: authUser.id,
      username: 'test_architect',
      full_name: 'Test Project Architect',
      role: 'creator',
      account_type: 'creator',
      onboarded: true
    }).select().single();
    profile = newProf;
  } else if (!profile.auth_user_id) {
    await supabase.from('profiles').update({ auth_user_id: authUser.id }).eq('id', profile.id);
    profile.auth_user_id = authUser.id;
  }
  console.log(`[PASS] 2. Canonical Profile: ID=${profile.id}, auth_user_id=${profile.auth_user_id}`);

  // Resolve a real target creator (e.g. video editor / actor) from directory
  const { data: targetCreator } = await supabase
    .from('profiles')
    .select('id, username, full_name, role')
    .neq('id', profile.id)
    .limit(1)
    .single();
  console.log(`[PASS] 3. Target creator in directory: @${targetCreator.username} (${targetCreator.id})`);

  // Test 1: SECURITY DEFINER RPC create_project_squad_workspace
  const testSquadName = `AI Test Squad ${Date.now()}`;
  console.log(`\n--- Test A: create_project_squad_workspace RPC ---`);
  const { data: rpcRes, error: rpcErr } = await supabase.rpc('create_project_squad_workspace', {
    p_name: testSquadName,
    p_description: 'Automated test project squad workspace',
    p_specialty: 'Film & Video',
    p_budget: '₹25,000',
    p_timeline: '2 weeks',
    p_project_brief: 'Short film collaboration created via OmniForge AI',
    p_owner_profile_id: profile.id
  });

  if (rpcErr || !rpcRes?.success) {
    console.error('[FAIL] RPC failed:', rpcErr);
    process.exit(1);
  }
  console.log('[PASS] RPC succeeded atomically! Squad ID:', rpcRes.squad_id);

  const rpcSquadId = rpcRes.squad_id;

  // Verify owner in squad_members
  const { data: memberCheck } = await supabase
    .from('squad_members')
    .select('*')
    .eq('squad_id', rpcSquadId)
    .eq('user_id', profile.id)
    .maybeSingle();

  if (!memberCheck) {
    console.error('[FAIL] Owner not found in squad_members after RPC!');
    process.exit(1);
  }
  console.log('[PASS] Owner membership confirmed in squad_members (role: ' + memberCheck.role + ')');

  // Test 2: Direct INSERT into public.squads with owner_id = profile.id (testing RLS policy fix)
  console.log(`\n--- Test B: Direct INSERT into public.squads with owner_id = profile.id ---`);
  const directSquadName = `Direct RLS Squad ${Date.now()}`;
  const { data: directSquad, error: directErr } = await supabase
    .from('squads')
    .insert({
      name: directSquadName,
      description: 'Testing direct insert under new RLS policy',
      specialty: 'Film',
      owner_id: profile.id,
      budget: '₹10,000'
    })
    .select('id, name, owner_id')
    .single();

  if (directErr) {
    console.error('[FAIL] Direct squad insert failed under RLS:', directErr);
    process.exit(1);
  }
  console.log('[PASS] Direct squad insert SUCCEEDED without RLS error! ID:', directSquad.id);

  // Test 3: Insert squad invitation into public.squad_invitations
  console.log(`\n--- Test C: Insert squad invitation for creator ---`);
  // Clean up any existing invitation for this creator in this squad
  await supabase.from('squad_invitations').delete().eq('squad_id', rpcSquadId).eq('invitee_id', targetCreator.id);

  const { data: invData, error: invErr } = await supabase
    .from('squad_invitations')
    .insert({
      squad_id: rpcSquadId,
      inviter_id: profile.id,
      invitee_id: targetCreator.id,
      role: 'Video Editor',
      status: 'pending',
      project_name: 'Short Film - Singer Journey',
      brief: 'Need a video editor for fast-paced musical sequence',
      budget: '₹15,000',
      timeline: '1 week'
    })
    .select('id, squad_id, inviter_id, invitee_id, status, role')
    .single();

  if (invErr) {
    console.error('[FAIL] Squad invitation insert failed:', invErr);
    process.exit(1);
  }
  console.log('[PASS] Squad invitation created successfully! ID:', invData.id, 'Status:', invData.status);

  // Test 4: Notification creation
  console.log(`\n--- Test D: Insert notification for invited creator ---`);
  const { error: notifErr } = await supabase
    .from('notifications')
    .insert({
      user_id: targetCreator.id,
      actor_id: profile.id,
      type: 'squad_invitation',
      entity_type: 'squad',
      entity_id: rpcSquadId,
      data: {
        squad_id: rpcSquadId,
        project_name: 'Short Film - Singer Journey',
        role: 'Video Editor'
      },
      read: false
    });

  if (notifErr) {
    console.error('[FAIL] Notification insert failed:', notifErr);
    process.exit(1);
  }
  console.log('[PASS] Notification created successfully without RLS error!');

  // Test 5: UNAUTHORIZED ATTEMPT BLOCK TEST
  console.log(`\n--- Test E: Unauthorized user spoofing attempt (RLS enforcement check) ---`);
  const fakeProfileId = '00000000-0000-0000-0000-000000000999';
  const { data: unauthSquad, error: unauthErr } = await supabase
    .from('squads')
    .insert({
      name: 'Unauthorized Squad Attempt',
      description: 'Should be blocked by RLS',
      specialty: 'Hacking',
      owner_id: fakeProfileId
    })
    .select();

  if (unauthErr) {
    console.log('[PASS] RLS correctly BLOCKED unauthorized direct insert with message:', unauthErr.message);
  } else {
    console.error('[FAIL] Unauthorized insert was NOT blocked! Squad ID:', unauthSquad);
    process.exit(1);
  }

  // Also test RPC unauthorized spoofing
  const { data: unauthRpcRes, error: unauthRpcErr } = await supabase.rpc('create_project_squad_workspace', {
    p_name: 'Unauthorized RPC Squad',
    p_owner_profile_id: fakeProfileId
  });

  if (unauthRpcErr) {
    console.log('[PASS] RPC correctly REJECTED spoofed owner profile with message:', unauthRpcErr.message);
  } else {
    console.error('[FAIL] RPC allowed unauthorized owner profile!');
    process.exit(1);
  }

  // Cleanup test data
  console.log('\n--- Cleanup test records ---');
  await supabase.from('squad_invitations').delete().eq('id', invData.id);
  await supabase.from('squad_members').delete().eq('squad_id', rpcSquadId);
  await supabase.from('squads').delete().eq('id', rpcSquadId);
  await supabase.from('squads').delete().eq('id', directSquad.id);
  console.log('[PASS] Cleaned up temporary test squads and invitations.');

  console.log('\n====================================================');
  console.log('  ALL SQUADS RLS AND INVITATION TESTS PASSED 100%!  ');
  console.log('====================================================');
}

runVerification().catch((e) => {
  console.error('Unhandled test exception:', e);
  process.exit(1);
});
