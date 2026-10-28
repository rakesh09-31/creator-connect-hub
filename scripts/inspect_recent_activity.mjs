import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function inspectRecent() {
  console.log("--- Recent squad_members ---");
  const { data: members } = await supabase
    .from('squad_members')
    .select('*, user:user_id(id, username), squad:squad_id(id, name, owner_id)')
    .order('created_at', { ascending: false })
    .limit(10);
  console.log(JSON.stringify(members, null, 2));

  console.log("\n--- Recent squad_invitations ---");
  const { data: invs } = await supabase
    .from('squad_invitations')
    .select('*, invitee:invitee_id(username), inviter:inviter_id(username)')
    .order('created_at', { ascending: false })
    .limit(10);
  console.log(JSON.stringify(invs, null, 2));
}

inspectRecent();
