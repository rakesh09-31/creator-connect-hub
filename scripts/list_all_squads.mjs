import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function listAllSquads() {
  const { data: squads } = await supabase
    .from('squads')
    .select('id, name, owner_id, created_at')
    .order('created_at', { ascending: false });

  console.log(`Total squads found: ${squads?.length}`);
  for (const s of (squads || [])) {
    const { data: members } = await supabase
      .from('squad_members')
      .select('user_id, role')
      .eq('squad_id', s.id);
    console.log(`Squad: id=${s.id}, name="${s.name}", owner=${s.owner_id}, members=${members?.length} (${members?.map(m => m.role + ':' + m.user_id).join(', ')})`);
  }
}

listAllSquads();
