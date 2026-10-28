import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);
const squadId = 'd7c14b35-6554-4c23-a638-527f0d6c7df4';

async function run() {
  const res = await supabase.from('squad_members').delete().eq('squad_id', squadId).eq('role', 'Performers');
  console.log('Delete result:', res);
}
run();
