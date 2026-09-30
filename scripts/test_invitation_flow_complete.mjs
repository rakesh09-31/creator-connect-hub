import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function runTests() {
  console.log('=== SQUAD INVITATION E2E VERIFICATION SUITE ===\n');

  // 1. Sign in as test project owner
  const { data: signinData, error: signinErr } = await supabase.auth.signInWithPassword({
    email: 'creator_1789410388281@testomnicraft.dev',
    password: 'TestPassword123!#',
  });
  if (signinErr || !signinData?.user) {
    console.error('Failed to sign in:', signinErr);
    process.exit(1);
  }
  const userId = signinData.user.id;
  console.log(`[PASS] Step 1: Signed in as test owner (${userId})`);

  // 2. Fetch or create project squad
  let { data: squad } = await supabase.from('squads').select('*').eq('owner_id', userId).limit(1).maybeSingle();
  if (!squad) {
    const { data: newSquad, error: sqErr } = await supabase.from('squads').insert({
      owner_id: userId,
      name: 'Village Singer Short Film Squad',
      description: 'Production team for short film',
      specialty: 'Film & Media'
    }).select().single();
    if (sqErr) {
      console.error('Failed to create squad:', sqErr);
      process.exit(1);
    }
    squad = newSquad;
  }
  console.log(`[PASS] Step 2: Active project squad (${squad.id}: "${squad.name}")`);

  // 3. Resolve @ramu from profiles
  const { data: ramuProfile, error: ramuErr } = await supabase
    .from('profiles')
    .select('id, username, full_name, role')
    .eq('username', 'ramu')
    .single();

  if (ramuErr || !ramuProfile) {
    console.error('Failed to find ramu in profiles:', ramuErr);
    process.exit(1);
  }
  console.log(`[PASS] Step 3: Resolved @ramu profile (ID: ${ramuProfile.id}, username: @${ramuProfile.username})`);

  // Clean any existing invitations for ramu to ensure clean state
  await supabase.from('squad_invitations').delete().eq('squad_id', squad.id).eq('invitee_id', ramuProfile.id);

  // 4. Send invitation to @ramu
  const { data: inv, error: invErr } = await supabase
    .from('squad_invitations')
    .insert({
      squad_id: squad.id,
      inviter_id: userId,
      invitee_id: ramuProfile.id,
      role: 'Lead Actor',
      project_name: 'Short Film - A Village Girl Who Becomes a Singer',
      brief: 'Lead acting role portraying the village mentor.',
      budget: '₹20,000',
      timeline: '3 weeks',
      status: 'pending'
    })
    .select('*, invitee:invitee_id(id, username, full_name, avatar_url), inviter:inviter_id(id, username, full_name)')
    .single();

  if (invErr || !inv) {
    console.error('[FAIL] Step 4: Failed to insert squad invitation for @ramu:', invErr);
    process.exit(1);
  }
  console.log(`[PASS] Step 4: Successfully inserted squad invitation for @ramu!`);
  console.log(`       Invitation ID: ${inv.id}`);
  console.log(`       invitee_id: ${inv.invitee_id} (matches ramuProfile.id: ${inv.invitee_id === ramuProfile.id})`);
  console.log(`       Relational Join Invitee: @${inv.invitee?.username} (${inv.invitee?.full_name})`);

  // 5. Test duplicate invitation prevention
  const { data: dupData, error: dupErr } = await supabase
    .from('squad_invitations')
    .insert({
      squad_id: squad.id,
      inviter_id: userId,
      invitee_id: ramuProfile.id,
      role: 'Lead Actor',
      status: 'pending'
    })
    .select();

  if (dupErr) {
    console.log(`[PASS] Step 5: Duplicate invitation rejected by database constraint: ${dupErr.message} (code: ${dupErr.code})`);
  } else {
    console.error('[FAIL] Step 5: Duplicate invitation was unexpectedly permitted!');
    process.exit(1);
  }

  // 6. Test unlinked creator (e.g. abhiram_actor)
  const { data: unlinkedProfile } = await supabase
    .from('profiles')
    .select('id, username')
    .eq('username', 'abhiram_actor')
    .single();

  if (unlinkedProfile) {
    const { data: unlinkedInv, error: unlinkedErr } = await supabase
      .from('squad_invitations')
      .insert({
        squad_id: squad.id,
        inviter_id: userId,
        invitee_id: unlinkedProfile.id,
        role: 'Actor',
        status: 'pending'
      });

    if (unlinkedErr) {
      console.log(`[PASS] Step 6: Unlinked creator @${unlinkedProfile.username} blocked by foreign key constraint:`);
      console.log(`       Error details: ${unlinkedErr.message}`);
    } else {
      console.error('[FAIL] Step 6: Unlinked profile invitation was unexpectedly permitted!');
      process.exit(1);
    }
  }

  // 7. Verify invitation persists in database
  const { data: fetchedInv, error: fetchErr } = await supabase
    .from('squad_invitations')
    .select('*')
    .eq('id', inv.id)
    .single();

  if (!fetchErr && fetchedInv && fetchedInv.invitee_id === ramuProfile.id) {
    console.log(`[PASS] Step 7: Verified invitation row is saved in Supabase with correct invitee_id (${fetchedInv.invitee_id})`);
  } else {
    console.error('[FAIL] Step 7: Invitation row verification failed:', fetchErr);
    process.exit(1);
  }

  console.log('\n>>> ALL INVITATION FLOW TESTS PASSED SUCCESSFULLY! <<<\n');
}

runTests();
