import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function inspectSquadMembers() {
  const ramuId = '219895fb-b8b0-488d-bdd0-e20159dc2045';
  const { data: member, error } = await supabase.from('squad_members').select('*').eq('user_id', ramuId);
  console.log('Ramu in squad_members:', member, 'error:', error);

  const { data: squad } = await supabase.from('squads').select('*').eq('id', member?.[0]?.squad_id);
  console.log('Squad details:', squad);
}

inspectSquadMembers();
