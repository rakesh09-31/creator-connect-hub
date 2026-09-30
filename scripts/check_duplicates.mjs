import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function checkDuplicates() {
  const { data: vinays, error: vErr } = await supabase.from('profiles').select('id, username, full_name, role').ilike('username', '%vinay%');
  console.log('Vinays in profiles:', vinays, 'error:', vErr?.message);

  const { data: ramus, error: rErr } = await supabase.from('profiles').select('id, username, full_name, role').ilike('username', '%ramu%');
  console.log('Ramus in profiles:', ramus, 'error:', rErr?.message);

  const { data: ramusByName, error: rnErr } = await supabase.from('profiles').select('id, username, full_name, role').ilike('full_name', '%ramu%');
  console.log('Ramus by full_name:', ramusByName, 'error:', rnErr?.message);
}

checkDuplicates();
