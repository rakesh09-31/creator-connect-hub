import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function testCollaboration() {
  console.log('--- Testing Collaboration Queries ---');

  // 1. Fetch squads
  const { data: squads, error: sqErr } = await supabase.from('squads').select('*').limit(2);
  console.log('Squads:', squads?.length, 'error:', sqErr);

  // 2. Fetch squad invitations with joins
  const { data: invs, error: invErr } = await supabase
    .from('squad_invitations')
    .select('*, invitee:invitee_id(id, username, full_name, avatar_url), inviter:inviter_id(id, username, full_name)')
    .limit(2);
  console.log('Squad Invitations:', invs?.length, 'error:', invErr);

  // 3. Fetch squad members with joins
  const { data: members, error: memErr } = await supabase
    .from('squad_members')
    .select('*, user:user_id(id, username, full_name, avatar_url)')
    .limit(2);
  console.log('Squad Members:', members?.length, 'error:', memErr);

  // 4. Fetch squad tasks
  const { data: tasks, error: taskErr } = await supabase
    .from('squad_tasks')
    .select('*, assignee:assigned_to(id, username, full_name, avatar_url)')
    .limit(2);
  console.log('Squad Tasks:', tasks?.length, 'error:', taskErr);
}

testCollaboration();
