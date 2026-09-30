import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function checkLimit() {
  const { data: first100 } = await supabase.from('profiles').select('id, username').limit(100);
  const { data: all } = await supabase.from('profiles').select('id, username').limit(500);

  console.log('First 100 count:', first100?.length);
  console.log('All count:', all?.length);

  for (const u of ['sketchsiren', 'abhiram_actor', 'ram09chinnram09chinna', 'ramu']) {
    const in100 = first100?.some(p => p.username === u);
    const inAll = all?.some(p => p.username === u);
    console.log(`@${u}: in first 100? ${in100} | in all? ${inAll}`);
  }
}

checkLimit();
