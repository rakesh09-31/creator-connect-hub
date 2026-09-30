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
  console.log('--- Checking Target Creators in profiles ---');
  const targetUsernames = ['sketchsiren', 'abhiram_actor', 'ram09chinnram09chinna'];
  const { data: profs, error: pErr } = await supabase
    .from('profiles')
    .select('*')
    .in('username', targetUsernames);

  console.log('Profiles found:', profs);
  if (pErr) console.error('Error fetching profiles:', pErr);

  // Check auth users
  const { data: usersData, error: uErr } = await supabase.auth.admin.listUsers();
  console.log('Total auth users:', usersData?.users?.length);
  const matching = usersData?.users?.filter(u => 
    u.id === '9d50642a-63d1-43cc-8905-c4d2e9e2407d' ||
    u.id === '0ee89da4-7458-42a1-aed5-a31e0e1d2019' ||
    u.id === '9b050dec-41de-4a9f-a5b8-5e41129cb2cd' ||
    u.email?.includes('sketchsiren') ||
    u.email?.includes('abhiram') ||
    u.email?.includes('ram09')
  );
  console.log('Matching auth users:', matching);

  // Also check existing squad_invitations for these profiles
  if (profs && profs.length > 0) {
    const profIds = profs.map(p => p.id);
    const { data: invs, error: iErr } = await supabase
      .from('squad_invitations')
      .select('id, squad_id, inviter_id, invitee_id, status, role, project_name')
      .in('invitee_id', profIds);
    console.log('Existing invitations for targets:', invs, iErr);
  }
}

check();
