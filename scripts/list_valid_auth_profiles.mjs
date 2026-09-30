import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function listAll34AuthUsers() {
  const { data: signinData } = await supabase.auth.signInWithPassword({
    email: 'creator_1789410388281@testomnicraft.dev',
    password: 'TestPassword123!#',
  });
  const userId = signinData?.user?.id;
  const { data: squad } = await supabase.from('squads').select('*').eq('owner_id', userId).limit(1).single();

  const { data: profiles } = await supabase.from('profiles').select('*');
  const valid = [];

  for (const p of profiles) {
    const { data, error } = await supabase.from('squad_invitations').insert({
      squad_id: squad.id,
      inviter_id: userId,
      invitee_id: p.id,
      role: 'Test',
      status: 'pending'
    }).select('id');

    if (!error) {
      valid.push(p);
      await supabase.from('squad_invitations').delete().eq('id', data[0].id);
    }
  }

  console.log('--- ALL VALID AUTH PROFILES ---');
  for (const p of valid) {
    console.log(`id: ${p.id} | username: ${p.username} | full_name: ${p.full_name} | role: ${p.role}`);
  }
}

listAll34AuthUsers();
