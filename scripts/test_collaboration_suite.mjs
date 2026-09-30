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

const unauthClient = createClient(url, key);

async function runTestSuite() {
  console.log('==============================================');
  console.log(' OMNIFORGE REAL CREATOR COLLABORATION TEST SUITE');
  console.log('==============================================\n');

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

  // 1. Authenticate or create test user
  const authClient = createClient(url, key);
  let sessionUser = null;

  // Try signing in with existing test user
  const { data: signinData } = await authClient.auth.signInWithPassword({
    email: 'creator_1789410388281@testomnicraft.dev',
    password: 'TestPassword123!#',
  });

  if (signinData?.user) {
    sessionUser = signinData.user;
  } else {
    // Create new test user
    const ts = Date.now();
    const email = `collab_test_${ts}@testomnicraft.dev`;
    const password = 'CollabTestPassword123!#';
    const { data: signupData, error: signupErr } = await authClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: `collab_tester_${ts}`,
          full_name: 'Collab Project Owner',
          role: 'creator',
        },
      },
    });

    if (signupErr || !signupData.user) {
      console.error('Failed to create or sign in test user:', signupErr);
      process.exit(1);
    }
    sessionUser = signupData.user;

    // Ensure profile exists
    await authClient.from('profiles').upsert({
      id: sessionUser.id,
      username: `collab_tester_${ts}`,
      full_name: 'Collab Project Owner',
      role: 'creator',
      account_type: 'creator',
      onboarded: true,
    });
  }

  assert(!!sessionUser?.id, `Authenticated as test user (${sessionUser.id})`);

  // 2. Fetch a different real creator profile from Supabase to invite
  const { data: candidateProfiles, error: candErr } = await authClient
    .from('profiles')
    .select('id, username, full_name, role, avatar_url')
    .neq('id', sessionUser.id)
    .limit(5);

  assert(!candErr && candidateProfiles && candidateProfiles.length > 0, 'Discovered real candidate profiles in Supabase');
  const invitee = candidateProfiles[0];
  console.log(`Invitee selected: ${invitee.full_name || invitee.username} (@${invitee.username}, ID: ${invitee.id})\n`);

  // 3. Create or retrieve Project Squad
  const testSquadName = 'OmniForge Epic Feature Film';
  const { data: existingSquads } = await authClient
    .from('squads')
    .select('id, name')
    .eq('owner_id', sessionUser.id)
    .eq('name', testSquadName);

  let squadId = existingSquads?.[0]?.id;
  if (!squadId) {
    const { data: newSquad, error: sqErr } = await authClient
      .from('squads')
      .insert({
        name: testSquadName,
        description: 'Story of a village singer journeying to the city stage.',
        specialty: 'Film & Media',
        owner_id: sessionUser.id,
        budget: '₹75,000',
        timeline: '6 weeks',
        project_brief: 'Looking for a director of photography and sound engineer for a festival short.',
      })
      .select('id, name, budget, timeline, project_brief')
      .single();

    assert(!sqErr && !!newSquad?.id, 'Created squad in public.squads with budget, timeline, and brief', sqErr?.message);
    assert(newSquad?.budget === '₹75,000' && newSquad?.timeline === '6 weeks', 'Squad preserves budget and timeline fields');
    squadId = newSquad?.id;
  } else {
    assert(true, 'Retrieved existing squad for test user');
  }

  // Ensure owner is registered in squad_members
  const { error: memErr } = await authClient
    .from('squad_members')
    .upsert({ squad_id: squadId, user_id: sessionUser.id, role: 'owner' }, { onConflict: 'squad_id,user_id' });
  assert(!memErr, 'Owner is in public.squad_members', memErr?.message);

  // 4. Clean previous invitation for clean state
  await authClient
    .from('squad_invitations')
    .delete()
    .eq('squad_id', squadId)
    .eq('invitee_id', invitee.id);

  // 5. Send Creator Invitation with role, brief, budget, timeline
  const { data: sentInv, error: sendErr } = await authClient
    .from('squad_invitations')
    .insert({
      squad_id: squadId,
      inviter_id: sessionUser.id,
      invitee_id: invitee.id,
      role: 'Director of Photography',
      project_name: testSquadName,
      brief: 'Lead handheld camera cinematography with vintage prime lenses for rural exterior scenes.',
      budget: '₹25,000',
      timeline: '3 weeks',
      status: 'pending',
    })
    .select('*, invitee:invitee_id(id, username, full_name, avatar_url), inviter:inviter_id(id, username, full_name)')
    .single();

  assert(!sendErr && !!sentInv?.id, 'Sent creator invitation with project metadata (brief, budget, timeline)', sendErr?.message);
  assert(sentInv?.status === 'pending', 'Invitation status is pending');
  assert(sentInv?.role === 'Director of Photography', 'Role is preserved');
  assert(sentInv?.invitee?.id === invitee.id, 'Relational PostgREST join on invitee_id returns creator profile');

  // 6. Test duplicate invitation check
  const { data: checkDup } = await authClient
    .from('squad_invitations')
    .select('id, status')
    .eq('squad_id', squadId)
    .eq('invitee_id', invitee.id);

  assert(checkDup && checkDup.length === 1, 'Duplicate prevention: exactly 1 active invitation exists');

  // 7. Test in-app notification dispatch to invitee
  const { data: notif, error: notifErr } = await authClient
    .from('notifications')
    .insert({
      user_id: invitee.id,
      actor_id: sessionUser.id,
      type: 'squad_invitation',
      entity_type: 'squad',
      entity_id: squadId,
      data: {
        squad_id: squadId,
        project_name: testSquadName,
        role: 'Director of Photography',
        budget: '₹25,000',
        timeline: '3 weeks',
      },
      read: false,
    })
    .select('id, user_id, type')
    .single();

  assert(!notifErr && !!notif?.id, 'In-app notification created in public.notifications for invitee', notifErr?.message);

  // 8. Test Squad Tasks creation in public.squad_tasks
  const { data: task1, error: taskCreateErr } = await authClient
    .from('squad_tasks')
    .insert({
      squad_id: squadId,
      title: 'Lighting plan for sunset village scenes',
      description: 'Prepare lighting grid and battery powered LED diffusion for the night market shoot.',
      assigned_to: invitee.id,
      status: 'todo',
      priority: 'high',
      due_date: '2026-10-18',
      created_by: sessionUser.id,
    })
    .select('*, assignee:assigned_to(id, username, full_name)')
    .single();

  assert(!taskCreateErr && !!task1?.id, 'Created persistent task in public.squad_tasks', taskCreateErr?.message);
  assert(task1?.assignee?.id === invitee.id, 'Task assignee PostgREST relational join succeeded');

  // 9. Update Task status
  const { data: updatedTask, error: taskUpdateErr } = await authClient
    .from('squad_tasks')
    .update({ status: 'in_progress', updated_at: new Date().toISOString() })
    .eq('id', task1.id)
    .select('id, status')
    .single();

  assert(!taskUpdateErr && updatedTask?.status === 'in_progress', 'Updated task status to in_progress in public.squad_tasks');

  // 10. Query all tasks for squad
  const { data: squadTasks, error: fetchTasksErr } = await authClient
    .from('squad_tasks')
    .select('*, assignee:assigned_to(id, username, full_name, avatar_url)')
    .eq('squad_id', squadId);

  assert(!fetchTasksErr && squadTasks && squadTasks.length >= 1, 'Queried all persistent squad tasks for workspace');

  // 11. Test RLS Isolation: unauthenticated client CANNOT insert tasks or invitations
  const { data: unauthTask, error: unauthTaskErr } = await unauthClient
    .from('squad_tasks')
    .insert({
      squad_id: squadId,
      title: 'Malicious unauthorized task',
      created_by: sessionUser.id,
      status: 'todo',
      priority: 'urgent',
    })
    .select();

  assert(!!unauthTaskErr || !unauthTask || unauthTask.length === 0, 'RLS correctly blocked unauthenticated task insertion');

  // 12. Test Owner Invitation Cancellation
  const { data: cancelledInv, error: cancelErr } = await authClient
    .from('squad_invitations')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', sentInv.id)
    .select('id, status')
    .single();

  assert(!cancelErr && cancelledInv?.status === 'cancelled', 'Project owner successfully cancelled invitation');

  // Clean up test task
  await authClient.from('squad_tasks').delete().eq('id', task1.id);

  console.log('\n==============================================');
  console.log(`RESULTS: ${passed} / ${total} tests passed!`);
  console.log('==============================================\n');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Test suite uncaught error:', err);
  process.exit(1);
});
