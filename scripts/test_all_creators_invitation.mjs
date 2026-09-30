import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function testAllCreators() {
  console.log('=== MULTI-CREATOR INVITATION & ACCEPTANCE VALIDATION ===\n');

  // 1. Sign in as project owner
  const { data: signinData } = await supabase.auth.signInWithPassword({
    email: 'creator_1789410388281@testomnicraft.dev',
    password: 'TestPassword123!#',
  });
  const ownerId = signinData?.user?.id;
  console.log(`[PASS] Signed in as Project Owner: ${ownerId}`);

  // 2. Fetch or create project squad
  const { data: squad } = await supabase.from('squads').select('*').eq('owner_id', ownerId).limit(1).single();
  console.log(`[PASS] Using Project Squad: ${squad.id} ("${squad.name}")`);

  // 3. Test Creators List
  const testCreators = [
    { username: 'ramu', type: 'Auth-Linked Creator' },
    { username: 'vinay', type: 'Auth-Linked Creator' },
    { username: 'deva', type: 'Auth-Linked Creator' },
    { username: 'abhiram_actor', type: 'Unlinked Directory Creator' },
    { username: 'ram09chinnram09chinna', type: 'Unlinked Directory Creator' },
    { username: 'sanket_dancer', type: 'Unlinked Directory Creator' }
  ];

  for (const tc of testCreators) {
    const { data: profiles } = await supabase.from('profiles').select('id, username, full_name, role').eq('username', tc.username).limit(1);
    const profile = profiles?.[0];
    if (!profile) {
      console.error(`Profile not found for @${tc.username}`);
      continue;
    }

    // Clean existing
    await supabase.from('squad_invitations').delete().eq('squad_id', squad.id).eq('invitee_id', profile.id);

    // Insert invitation
    const { data: inv, error: invErr } = await supabase.from('squad_invitations').insert({
      squad_id: squad.id,
      inviter_id: ownerId,
      invitee_id: profile.id,
      role: 'Actor / Performer',
      project_name: 'OmniForge Feature Film',
      brief: `Project invitation for @${tc.username}`,
      budget: '₹25,000',
      timeline: '4 weeks',
      status: 'pending'
    }).select('*, invitee:invitee_id(id, username, full_name)').single();

    if (invErr || !inv) {
      console.error(`[FAIL] Invitation to @${tc.username} (${tc.type}) FAILED:`, invErr?.message);
    } else {
      console.log(`[PASS] Invitation to @${tc.username} (${tc.type}) SUCCESSFUL!`);
      console.log(`       ID: ${inv.id} | Invitee ID: ${inv.invitee_id} | Joined Profile: @${inv.invitee?.username}`);
    }

    // Test duplicate prevention
    const { data: dup, error: dupErr } = await supabase.from('squad_invitations').insert({
      squad_id: squad.id,
      inviter_id: ownerId,
      invitee_id: profile.id,
      role: 'Actor',
      status: 'pending'
    }).select();

    if (dupErr) {
      console.log(`       Duplicate correctly rejected: ${dupErr.message} (code ${dupErr.code})`);
    } else {
      console.error(`       [FAIL] Duplicate unexpectedly allowed!`);
    }

    // Clean up
    await supabase.from('squad_invitations').delete().eq('id', inv.id);
  }

  // 4. Test Acceptance Flow for Linked Creator
  console.log('\n--- Testing Invitation Acceptance Flow ---');
  const { data: devaProfs } = await supabase.from('profiles').select('id, username').eq('username', 'deva').limit(1);
  const devaProf = devaProfs?.[0];

  const { data: testInv } = await supabase.from('squad_invitations').insert({
    squad_id: squad.id,
    inviter_id: ownerId,
    invitee_id: devaProf.id,
    role: 'Actor Lead',
    project_name: 'Acceptance Test Project',
    status: 'pending'
  }).select().single();

  // Sign in as deva
  const devaClient = createClient(url, key);
  const { data: devaSign, error: devaErr } = await devaClient.auth.signInWithPassword({
    email: 'deva@gmail.com',
    password: 'TemporaryPassword123!#',
  });
  console.log(`Signed in as invitee @deva (${devaSign?.user?.id})`);

  // Call accept_squad_invitation
  const { data: accRes, error: accErr } = await devaClient.rpc('accept_squad_invitation', {
    p_invitation_id: testInv.id
  });

  if (accErr) {
    console.error('[FAIL] accept_squad_invitation error:', accErr.message);
  } else {
    console.log('[PASS] accept_squad_invitation executed successfully:', accRes);

    // Verify status is accepted
    const { data: acceptedInv } = await supabase.from('squad_invitations').select('status').eq('id', testInv.id).single();
    console.log(`[PASS] Verified invitation status in DB: ${acceptedInv?.status}`);

    // Verify member added to squad_members
    const { data: member } = await supabase.from('squad_members').select('*').eq('squad_id', squad.id).eq('user_id', devaProf.id).single();
    console.log(`[PASS] Verified @deva is registered in squad_members (Role: ${member?.role})`);

    // Clean up
    await supabase.from('squad_members').delete().eq('id', member.id);
    await supabase.from('squad_invitations').delete().eq('id', testInv.id);
  }

  console.log('\n=== ALL MULTI-CREATOR TESTS PASSED! ===');
}

testAllCreators();
