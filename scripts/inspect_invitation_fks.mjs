import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function inspectConstraints() {
  const { data: signinData, error: sErr } = await supabase.auth.signInWithPassword({
    email: 'creator_1789410388281@testomnicraft.dev',
    password: 'TestPassword123!#',
  });
  if (sErr) console.error('Sign in error:', sErr);
  const userId = signinData?.user?.id;
  console.log('Signed in as:', userId);

  // 1. Get or create squad owned by userId
  let { data: squad } = await supabase.from('squads').select('id, owner_id').eq('owner_id', userId).limit(1).maybeSingle();
  if (!squad) {
    const { data: newSquad } = await supabase.from('squads').insert({
      name: 'Constraint Test Squad',
      owner_id: userId
    }).select().single();
    squad = newSquad;
  }
  console.log('Using squad:', squad);

  const validProfileId = '9b050dec-41de-4a9f-a5b8-5e41129cb2cd'; // sketchsiren
  const fakeId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

  // Test 1: Fake invitee_id with real inviter_id
  const { error: err1 } = await supabase.from('squad_invitations').insert({
    squad_id: squad.id,
    inviter_id: squad.owner_id,
    invitee_id: fakeId,
    role: 'Actor',
    status: 'pending'
  });
  console.log('\nTest 1 (Fake invitee_id):', {
    code: err1?.code,
    message: err1?.message,
    details: err1?.details,
    hint: err1?.hint
  });

  // Test 2: Real invitee_id with fake inviter_id
  const { error: err2 } = await supabase.from('squad_invitations').insert({
    squad_id: squad.id,
    inviter_id: fakeId,
    invitee_id: validProfileId,
    role: 'Actor',
    status: 'pending'
  });
  console.log('\nTest 2 (Fake inviter_id):', {
    code: err2?.code,
    message: err2?.message,
    details: err2?.details,
    hint: err2?.hint
  });

  // Test 3: What if inviter_id is an auth.uid() that has NO profile row?
  // Let's check who the current authenticated user in the browser is!
}

inspectConstraints();
