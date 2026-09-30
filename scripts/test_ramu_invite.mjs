import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function testRamuInvite() {
  // Sign in as test user
  const { data: signinData } = await supabase.auth.signInWithPassword({
    email: 'creator_1789410388281@testomnicraft.dev',
    password: 'TestPassword123!#',
  });
  console.log('Signed in user:', signinData?.user?.id);
  const userId = signinData?.user?.id;

  // Find ramu in profiles
  const { data: ramu } = await supabase.from('profiles').select('*').eq('username', 'ramu').single();
  console.log('Ramu in profiles:', ramu?.id, ramu?.username);

  // Find a squad
  const { data: squad } = await supabase.from('squads').select('*').eq('owner_id', userId).limit(1).single();
  console.log('Squad:', squad?.id);

  // Try insert squad_invitation with invitee_id = ramu.id
  const { data: inv, error: invErr } = await supabase.from('squad_invitations').insert({
    squad_id: squad.id,
    inviter_id: userId,
    invitee_id: ramu.id,
    role: 'Actor',
    project_name: 'Short Film',
    status: 'pending'
  }).select();

  console.log('Insert with ramu.id result:', inv);
  console.log('Insert with ramu.id error:', invErr);
}

testRamuInvite();
