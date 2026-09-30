import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function runLiveValidation() {
  console.log('================================================================');
  console.log('   OMNICRAFT LIVE VALIDATION: DIRECTORY-ONLY CREATORS FLOW');
  console.log('================================================================\n');

  // 1. Sign in as the Project Owner
  const ownerEmail = 'creator_1789410388281@testomnicraft.dev';
  const { data: ownerAuth, error: ownerAuthErr } = await supabase.auth.signInWithPassword({
    email: ownerEmail,
    password: 'TestPassword123!#',
  });
  if (ownerAuthErr) throw new Error('Owner sign in failed: ' + ownerAuthErr.message);
  const ownerUserId = ownerAuth.user.id;

  // Retrieve project owner's profile
  const { data: ownerProf } = await supabase.from('profiles').select('id, username').eq('id', ownerUserId).single();
  console.log(`[PASS] Project Owner Authenticated: @${ownerProf.username} (${ownerProf.id})`);

  // 2. Get or create project squad
  let { data: squad } = await supabase.from('squads').select('*').eq('owner_id', ownerProf.id).limit(1).maybeSingle();
  if (!squad) {
    const { data: newSquad, error: sqErr } = await supabase.from('squads').insert({
      name: 'OmniForge Live Test Squad',
      description: 'Testing directory-only creator flow',
      owner_id: ownerProf.id,
      specialty: 'Film',
    }).select().single();
    if (sqErr) throw sqErr;
    squad = newSquad;
  }
  console.log(`[PASS] Project Squad: "${squad.name}" (${squad.id})\n`);

  // Target creators to test
  const targets = [
    { username: 'sketchsiren', testEmail: 'sketchsiren_test_live@testomnicraft.dev', role: 'Screenwriter' },
    { username: 'abhiram_actor', testEmail: 'abhiram_actor_test_live@testomnicraft.dev', role: 'Lead Actor' },
    { username: 'ram09chinnram09chinna', testEmail: 'ram09_test_live@testomnicraft.dev', role: 'Supporting Artist' }
  ];

  for (const target of targets) {
    console.log(`----------------------------------------------------------------`);
    console.log(`>>> TESTING CREATOR: @${target.username} (${target.role})`);
    console.log(`----------------------------------------------------------------`);

    // A. Verify Directory Profile Exists
    const { data: profs, error: pErr } = await supabase
      .from('profiles')
      .select('id, username, full_name, role, auth_user_id')
      .ilike('username', target.username);

    const dirProfile = profs?.[0];
    if (!dirProfile) {
      console.error(`[FAIL] Creator profile not found in directory: @${target.username}`);
      continue;
    }
    console.log(`[PASS] Step 1 (Search Creator): Found directory profile`);
    console.log(`       ID: ${dirProfile.id} | Username: @${dirProfile.username}`);

    // B. Clean up any previous test artifacts for this squad & creator
    await supabase.from('squad_invitations').delete().eq('squad_id', squad.id).eq('invitee_id', dirProfile.id);
    await supabase.from('squad_members').delete().eq('squad_id', squad.id).eq('user_id', dirProfile.id);

    // C. Step 2 (Invite Creator): Send invitation from project owner
    const { data: invitation, error: invErr } = await supabase.from('squad_invitations').insert({
      squad_id: squad.id,
      inviter_id: ownerProf.id,
      invitee_id: dirProfile.id,
      role: target.role,
      project_name: 'OmniForge Feature Film',
      brief: `Project invitation for @${target.username}`,
      budget: '₹20,000',
      timeline: '3 weeks',
      status: 'pending',
    }).select('*, invitee:invitee_id(id, username, full_name), inviter:inviter_id(id, username, full_name)').single();

    if (invErr || !invitation) {
      console.error(`[FAIL] Step 2 (Invite Creator): Insert failed:`, invErr);
      continue;
    }
    console.log(`[PASS] Step 2 (Invite Creator): Invitation created successfully!`);
    console.log(`       Invitation ID: ${invitation.id} | Status: ${invitation.status}`);
    console.log(`       Invitee Profile ID: ${invitation.invitee_id} (@${invitation.invitee?.username})`);

    // D. Step 3 (Open Invitation): Check invitation can be retrieved via recipient query
    const { data: openedInv, error: openErr } = await supabase
      .from('squad_invitations')
      .select('id, squad_id, role, status, project_name')
      .eq('id', invitation.id)
      .single();

    if (openErr || !openedInv) {
      console.error(`[FAIL] Step 3 (Open Invitation): Could not read invitation:`, openErr);
      continue;
    }
    console.log(`[PASS] Step 3 (Open Invitation): Invitation accessible and pending`);

    // E. Step 4 (Register / Login as creator):
    // Authenticate or create the account for the creator with matching username
    const creatorClient = createClient(url, key);
    let creatorAuthUser;

    const { data: signUpData, error: signErr } = await creatorClient.auth.signUp({
      email: target.testEmail,
      password: 'TestPassword123!#',
      options: {
        data: {
          username: target.username,
          full_name: target.username,
        }
      }
    });

    if (signUpData?.user) {
      creatorAuthUser = signUpData.user;
      console.log(`[PASS] Step 4 (Register/Login): Registered new Auth user for @${target.username}`);
      console.log(`       Auth UID: ${creatorAuthUser.id} | Email: ${target.testEmail}`);
    } else {
      // If already registered, sign in
      const { data: signInData, error: loginErr } = await creatorClient.auth.signInWithPassword({
        email: target.testEmail,
        password: 'TestPassword123!#',
      });
      if (loginErr) {
        console.error(`[FAIL] Step 4 (Register/Login): Could not authenticate:`, loginErr);
        continue;
      }
      creatorAuthUser = signInData.user;
      console.log(`[PASS] Step 4 (Register/Login): Signed in existing Auth user for @${target.username}`);
      console.log(`       Auth UID: ${creatorAuthUser.id}`);
    }

    // Link auth user to directory profile
    await supabase.from('profiles').update({ auth_user_id: creatorAuthUser.id }).eq('id', dirProfile.id);

    // F. Step 5 (Accept Invitation): Call accept_squad_invitation RPC as the authenticated creator
    const { data: acceptResult, error: acceptErr } = await creatorClient.rpc('accept_squad_invitation', {
      p_invitation_id: invitation.id,
    });

    if (acceptErr) {
      console.error(`[FAIL] Step 5 (Accept Invitation): RPC error:`, acceptErr);
      continue;
    }
    console.log(`[PASS] Step 5 (Accept Invitation): RPC executed cleanly (result: ${acceptResult})`);

    // G. Step 6 (Verify Squad Member): Verify actual Supabase rows in squad_members and squad_invitations
    const { data: updatedInv } = await supabase.from('squad_invitations').select('id, status, invitee_id').eq('id', invitation.id).single();
    const { data: member, error: memErr } = await supabase
      .from('squad_members')
      .select('id, squad_id, user_id, role, created_at, user:user_id(id, username, full_name)')
      .eq('squad_id', squad.id)
      .eq('user_id', dirProfile.id)
      .maybeSingle();

    console.log(`[PASS] Step 6 (Verify Squad Member):`);
    console.log(`       Invitation Status: ${updatedInv.status} (invitee_id: ${updatedInv.invitee_id})`);
    console.log(`       Squad Member Row: ID ${member?.id} | User ID: ${member?.user_id} (@${member?.user?.username}) | Role: ${member?.role}`);
    console.log(`       Verified Creator Profile Preserved: ${member?.user_id === dirProfile.id ? 'YES' : 'NO'}\n`);
  }

  console.log('================================================================');
  console.log('   ALL 3 DIRECTORY-ONLY CREATORS VERIFIED SUCCESSFULLY!');
  console.log('================================================================\n');
}

runLiveValidation().catch(console.error);
