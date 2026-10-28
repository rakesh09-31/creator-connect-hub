import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function check() {
  console.log('Testing query on squad_members...');
  const { data: members, error: memErr } = await supabase
    .from('squad_members')
    .select('*, user:user_id(id, username, full_name, avatar_url)')
    .limit(5);

  console.log('squad_members join query error:', memErr);
  console.log('squad_members count:', members?.length);
  if (members && members.length > 0) {
    console.log('sample member:', JSON.stringify(members[0], null, 2));
  }

  // Also test query on squad_invitations
  const { data: invs, error: invErr } = await supabase
    .from('squad_invitations')
    .select('*, invitee:invitee_id(id, username, full_name, avatar_url), inviter:inviter_id(id, username, full_name)')
    .limit(5);

  console.log('squad_invitations join query error:', invErr);
  console.log('squad_invitations count:', invs?.length);
  if (invs && invs.length > 0) {
    console.log('sample invitation:', JSON.stringify(invs[0], null, 2));
  }

  // Check recent squads
  const { data: squads, error: sqErr } = await supabase
    .from('squads')
    .select('id, name, owner_id, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  console.log('Recent squads:', squads);
}

check();
