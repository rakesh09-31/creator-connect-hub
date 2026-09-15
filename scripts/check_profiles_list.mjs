import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function checkAuthAndProfiles() {
  console.log('--- Checking users and profiles ---');
  const { data: profs, error } = await supabase.from('profiles').select('id, username, full_name, role');
  console.log(`Total profiles in public.profiles: ${profs?.length}`);
  console.log('Profile IDs in public.profiles:', profs?.map(p => `${p.username}: ${p.id}`));
}

checkAuthAndProfiles();
