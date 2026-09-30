import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function checkProfile() {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', '01214642-fd80-41b3-b1c8-e1241ab84c60');
  console.log('Profile for 01214642-fd80-41b3-b1c8-e1241ab84c60:', data, error);
}

checkProfile();
