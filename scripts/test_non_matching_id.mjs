import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function testNonMatchingId() {
  console.log('Testing inviter whose profile.id != auth_user_id...');
  
  // Sign in as test user
  await supabase.auth.signInWithPassword({
    email: 'creator_1789410388281@testomnicraft.dev',
    password: 'TestPassword123!#',
  });

  // Create squad owned by sketchsiren (profile.id: 9b050dec-41de-4a9f-a5b8-5e41129cb2cd)
  // Or check if sketchsiren is in profiles
  const sketchsirenId = '9b050dec-41de-4a9f-a5b8-5e41129cb2cd';
  const { data: prof } = await supabase.from('profiles').select('id, auth_user_id').eq('id', sketchsirenId).single();
  console.log('sketchsiren profile:', prof);

  // Notice prof.id != prof.auth_user_id !
  // Let's create a squad
  const { data: squad } = await supabase.from('squads').insert({
    name: 'Different ID Test Squad',
    owner_id: sketchsirenId
  }).select().single();
  console.log('Squad created with owner sketchsirenId:', squad?.id);

  // Now insert into squad_invitations with inviter_id = sketchsirenId (which does NOT exist in auth.users!)
  const { data: inv, error: invErr } = await supabase.from('squad_invitations').insert({
    squad_id: squad.id,
    inviter_id: sketchsirenId,
    invitee_id: '01214642-fd80-41b3-b1c8-e1241ab84c60', // ramu
    role: 'Editor',
    status: 'pending'
  }).select().single();

  console.log('Insert squad_invitations with non-auth profile.id as inviter_id:');
  console.log('Result:', inv?.id ? 'SUCCESS (id=' + inv.id + ')' : 'FAIL');
  if (invErr) {
    console.error('Error was:', invErr);
  } else {
    console.log('[PROVED] inviter_id cleanly references public.profiles.id, even when profile.id is NOT an auth.users id!');
    // cleanup
    await supabase.from('squad_invitations').delete().eq('id', inv.id);
  }
  await supabase.from('squads').delete().eq('id', squad.id);
}

testNonMatchingId().catch(console.error);
