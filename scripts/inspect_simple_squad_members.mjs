import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function inspect() {
  const { data: members, error: mErr } = await supabase
    .from('squad_members')
    .select('*');
  console.log('All squad_members count:', members?.length, 'error:', mErr);

  const { data: squadMembers, error: smErr } = await supabase
    .from('squad_members')
    .select('*')
    .eq('squad_id', 'd7c14b35-6554-4c23-a638-527f0d6c7df4');
  console.log('Squad d7c14b35 members:', squadMembers, 'error:', smErr);

  // Check squads table
  const { data: squads } = await supabase
    .from('squads')
    .select('id, name, owner_id');
  console.log('All squads:', squads);
}
inspect();
