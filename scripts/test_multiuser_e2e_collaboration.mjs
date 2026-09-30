import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

if (!url || !key) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

async function getOrCreateUser(email, password, username, fullName) {
  const client = createClient(url, key);
  const { data: signinData, error: signinErr } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (signinData?.user) {
    return { client, user: signinData.user };
  }

  const { data: signupData, error: signupErr } = await client.auth.signUp({
    email,
    password,
    options: {
      data: { username, full_name: fullName, role: 'creator' },
    },
  });

  if (signupErr || !signupData.user) {
    throw new Error(`Failed to sign up ${email}: ${signupErr?.message}`);
  }

  await client.from('profiles').upsert({
    id: signupData.user.id,
    username,
    full_name: fullName,
    role: 'creator',
    account_type: 'creator',
    onboarded: true,
  });

  return { client, user: signupData.user };
}

async function runMultiUserAudit() {
  console.log('===============================================================');
  console.log(' AUDIT: MULTI-USER INVITATION LIFECYCLE & RLS AUTHORIZATION');
  console.log('===============================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, label, detail = '') {
    total++;
    if (condition) {
      console.log(`[PASS] Test ${total}: ${label}`);
      passed++;
    } else {
      console.error(`[FAIL] Test ${total}: ${label} ${detail}`);
    }
  }

  const ts = Date.now();
  // 1. Setup 3 distinct accounts:
  // User A: Project Owner
  const { client: clientOwner, user: userOwner } = await getOrCreateUser(
    `owner_${ts}@testomnicraft.dev`,
    'Pass123456!#',
    `owner_${ts}`,
    'Audit Project Owner'
  );
  assert(!!userOwner?.id, `Owner User A created & authenticated (${userOwner.id})`);

  // User B: Creator to invite
  const { client: clientCreator, user: userCreator } = await getOrCreateUser(
    `creator_${ts}@testomnicraft.dev`,
    'Pass123456!#',
    `creator_${ts}`,
    'Audit Creator Invitee'
  );
  assert(!!userCreator?.id, `Creator User B created & authenticated (${userCreator.id})`);

  // User C: Unauthorized third-party
  const { client: clientUnauthorized, user: userUnauthorized } = await getOrCreateUser(
    `intruder_${ts}@testomnicraft.dev`,
    'Pass123456!#',
    `intruder_${ts}`,
    'Audit Unauthorized ThirdParty'
  );
  assert(!!userUnauthorized?.id, `Unauthorized User C authenticated (${userUnauthorized.id})\n`);

  // 2. User A creates Squad
  const squadName = `Audit Squad ${ts}`;
  const { data: squad, error: sqErr } = await clientOwner
    .from('squads')
    .insert({
      name: squadName,
      description: 'Private project squad for audit verification',
      specialty: 'Film & Media',
      owner_id: userOwner.id,
      budget: '₹40,000',
      timeline: '3 weeks',
      project_brief: 'Confidential feature film brief.',
    })
    .select('id, name')
    .single();

  assert(!sqErr && !!squad?.id, 'User A created private squad in public.squads', sqErr?.message);
  const squadId = squad.id;

  // Add Owner to squad_members
  await clientOwner
    .from('squad_members')
    .upsert({ squad_id: squadId, user_id: userOwner.id, role: 'owner' }, { onConflict: 'squad_id,user_id' });

  // 3. User A invites User B (Creator)
  const { data: invitation, error: invErr } = await clientOwner
    .from('squad_invitations')
    .insert({
      squad_id: squadId,
      inviter_id: userOwner.id,
      invitee_id: userCreator.id,
      role: 'Lead Sound Designer',
      status: 'pending',
      project_name: squadName,
      brief: 'Handle foley recording, ambient audio, and Dolby 5.1 mixing.',
      budget: '₹15,000',
      timeline: '2 weeks',
    })
    .select('*')
    .single();

  assert(!invErr && !!invitation?.id, 'User A sent invitation with role, brief, budget, timeline to User B', invErr?.message);

  // Send in-app notification
  await clientOwner.from('notifications').insert({
    user_id: userCreator.id,
    actor_id: userOwner.id,
    type: 'squad_invitation',
    entity_type: 'squad',
    entity_id: squadId,
    data: { squad_id: squadId, project_name: squadName, role: 'Lead Sound Designer' },
    read: false,
  });

  // 4. Verification: User B receives invitation & notification
  const { data: creatorNotifications, error: notifReadErr } = await clientCreator
    .from('notifications')
    .select('*')
    .eq('user_id', userCreator.id);

  assert(
    !notifReadErr && creatorNotifications?.some((n) => n.entity_id === squadId),
    'User B received the in-app notification in public.notifications'
  );

  const { data: creatorInvitations, error: invReadErr } = await clientCreator
    .from('squad_invitations')
    .select('*')
    .eq('invitee_id', userCreator.id)
    .eq('status', 'pending');

  assert(
    !invReadErr && creatorInvitations?.some((i) => i.id === invitation.id),
    'User B can read their pending project invitation'
  );

  // 5. Verification: User C (Unauthorized) CANNOT read User B's invitation
  const { data: unauthorizedInvs } = await clientUnauthorized
    .from('squad_invitations')
    .select('*')
    .eq('id', invitation.id);

  assert(!unauthorizedInvs || unauthorizedInvs.length === 0, 'RLS BLOCKS User C from reading private squad invitation');

  // 6. User A creates private tasks in squad
  const { data: task1, error: tErr } = await clientOwner
    .from('squad_tasks')
    .insert({
      squad_id: squadId,
      title: 'Sound design session 1',
      description: 'Record natural outdoor soundscapes',
      assigned_to: userCreator.id,
      priority: 'high',
      status: 'todo',
      created_by: userOwner.id,
    })
    .select('*')
    .single();

  assert(!tErr && !!task1?.id, 'User A created private squad task in public.squad_tasks', tErr?.message);

  // 7. Verification: Before accepting, User C and unaccepted users CANNOT read squad tasks
  const { data: unauthTasks } = await clientUnauthorized
    .from('squad_tasks')
    .select('*')
    .eq('squad_id', squadId);

  assert(!unauthTasks || unauthTasks.length === 0, 'RLS BLOCKS unauthorized User C from reading private squad tasks');

  const { error: unauthWriteErr } = await clientUnauthorized
    .from('squad_tasks')
    .insert({
      squad_id: squadId,
      title: 'Hacked task by User C',
      created_by: userUnauthorized.id,
      status: 'todo',
      priority: 'urgent',
    });

  assert(!!unauthWriteErr, 'RLS BLOCKS unauthorized User C from creating tasks in private squad');

  // 8. User B ACCEPTS the invitation
  // Update invitation to accepted
  const { error: acceptErr } = await clientCreator
    .from('squad_invitations')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', invitation.id);

  assert(!acceptErr, 'User B accepted the squad invitation');

  // Add User B to squad_members
  const { error: joinMemErr } = await clientCreator
    .from('squad_members')
    .insert({
      squad_id: squadId,
      user_id: userCreator.id,
      role: 'Lead Sound Designer',
    });

  assert(!joinMemErr, 'User B added as accepted member in public.squad_members');

  // 9. Verification: Accepted User B CAN now access squad tasks
  const { data: creatorTasks, error: cTasksErr } = await clientCreator
    .from('squad_tasks')
    .select('*, assignee:assigned_to(id, username, full_name)')
    .eq('squad_id', squadId);

  assert(!cTasksErr && creatorTasks && creatorTasks.length >= 1, 'Accepted User B can now read squad workspace tasks');
  assert(creatorTasks?.[0]?.assignee?.id === userCreator.id, 'Task assignee join correctly resolved for User B');

  // 10. User B updates task status to in_progress
  const { data: updatedByB, error: bUpdateErr } = await clientCreator
    .from('squad_tasks')
    .update({ status: 'in_progress', updated_at: new Date().toISOString() })
    .eq('id', task1.id)
    .select('id, status')
    .single();

  assert(!bUpdateErr && updatedByB?.status === 'in_progress', 'Accepted User B successfully updated task status to in_progress');

  // 11. Task persistence verification: Re-query from fresh client to verify persistence after refresh
  const freshClient = createClient(url, key);
  await freshClient.auth.signInWithPassword({
    email: `creator_${ts}@testomnicraft.dev`,
    password: 'Pass123456!#',
  });

  const { data: persistedTask, error: freshErr } = await freshClient
    .from('squad_tasks')
    .select('id, title, description, assigned_to, status, priority')
    .eq('id', task1.id)
    .single();

  assert(!freshErr && persistedTask?.status === 'in_progress', 'Task state and assignment verified persistent in database across new session');

  // 12. Task Deletion: Owner deletes task
  const { error: delErr } = await clientOwner
    .from('squad_tasks')
    .delete()
    .eq('id', task1.id);

  assert(!delErr, 'Task deletion succeeds and cleans up cleanly');

  // Clean up test squad
  await clientOwner.from('squad_invitations').delete().eq('squad_id', squadId);
  await clientOwner.from('squad_members').delete().eq('squad_id', squadId);
  await clientOwner.from('squads').delete().eq('id', squadId);

  console.log('\n===============================================================');
  console.log(`MULTI-USER AUDIT COMPLETE: ${passed} / ${total} tests passed!`);
  console.log('===============================================================\n');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runMultiUserAudit().catch((err) => {
  console.error('Audit script uncaught exception:', err);
  process.exit(1);
});
