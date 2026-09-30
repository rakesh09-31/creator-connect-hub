import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function findValidAuthProfiles() {
  const { data: signinData } = await supabase.auth.signInWithPassword({
    email: 'creator_1789410388281@testomnicraft.dev',
    password: 'TestPassword123!#',
  });
  const userId = signinData?.user?.id;

  const { data: squad } = await supabase.from('squads').select('*').eq('owner_id', userId).limit(1).single();

  const { data: profiles } = await supabase.from('profiles').select('id, username, full_name, role');
  console.log(`Checking ${profiles?.length} profiles to see which exist in auth.users...`);

  const validAuthUsers = [];
  const invalidAuthUsers = [];

  for (const p of profiles || []) {
    // Attempt an insert in a roll-backable or unique way, or check if we can insert and delete
    const { data, error } = await supabase.from('squad_invitations').insert({
      squad_id: squad.id,
      inviter_id: userId,
      invitee_id: p.id,
      role: 'Test',
      status: 'pending',
    }).select('id');

    if (!error) {
      validAuthUsers.push(p);
      // clean up immediately
      await supabase.from('squad_invitations').delete().eq('id', data[0].id);
    } else {
      if (error.message.includes('violates foreign key constraint "squad_invitations_invitee_id_fkey"')) {
        invalidAuthUsers.push(p);
      } else {
        // Some other error (e.g. unique constraint or self-invite)
        validAuthUsers.push({ ...p, note: error.message });
      }
    }
  }

  console.log(`Valid auth users: ${validAuthUsers.length}`);
  console.log('Sample valid auth users:', validAuthUsers.map(u => `@${u.username} (${u.id})`));
  console.log(`Profiles without auth user: ${invalidAuthUsers.length}`);
  console.log('Sample profiles without auth user:', invalidAuthUsers.slice(0, 10).map(u => `@${u.username}`));
}

findValidAuthProfiles();
