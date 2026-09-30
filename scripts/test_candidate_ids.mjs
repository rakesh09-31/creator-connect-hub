import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function testInsert() {
  const { data: signinData } = await supabase.auth.signInWithPassword({
    email: 'creator_1789410388281@testomnicraft.dev',
    password: 'TestPassword123!#',
  });
  const userId = signinData?.user?.id;
  const { data: squad } = await supabase.from('squads').select('*').eq('owner_id', userId).limit(1).single();

  const testIds = [
    '219895fb-b8b0-488d-bdd0-e20159dc2045', // ramu in profiles
    '01214642-fd80-41b3-b1c8-e1241ab84c60', // ramu@gmail.com
    '87588dda-db53-4131-9ab1-6e8f31bb9c74', // ramu@omnicraft.dev
  ];

  for (const id of testIds) {
    const { data, error } = await supabase.from('squad_invitations').insert({
      squad_id: squad.id,
      inviter_id: userId,
      invitee_id: id,
      role: 'Actor',
      project_name: 'Short Film',
      status: 'pending'
    }).select();

    console.log(`Insert for ID ${id}:`, error ? error.message : `SUCCESS! ID: ${data?.[0]?.id}`);
    if (data && data[0]?.id) {
      await supabase.from('squad_invitations').delete().eq('id', data[0].id);
    }
  }
}

testInsert();
