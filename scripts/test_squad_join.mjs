import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function test() {
  const r1 = await supabase.from('squad_members').select('squad_id, squads:squad_id(id, name, description, specialty, avatar_url)').limit(1);
  console.log('squads:squad_id result:', r1.error ? r1.error.message : 'SUCCESS');

  const r2 = await supabase.from('squad_members').select('squad_id, squads(*)').limit(1);
  console.log('squads(*) result:', r2.error ? r2.error.message : 'SUCCESS');
}

test();
