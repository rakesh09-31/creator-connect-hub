import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function testProfiles() {
  const { data: allProfiles, error } = await supabase.from('profiles').select('id, username, full_name, role');
  console.log('Total profiles count:', allProfiles?.length);

  const targets = ['sketchsiren', 'abhiram_actor', 'ram09chinnram09chinna'];
  targets.forEach(t => {
    const idx = allProfiles?.findIndex(p => p.username === t);
    console.log(`Target @${t}: index = ${idx}, id = ${idx !== -1 ? allProfiles[idx].id : 'NOT FOUND'}`);
  });

  // Check with limit(100)
  const { data: limited } = await supabase.from('profiles').select('id, username').limit(100);
  console.log('\nWith limit(100):');
  targets.forEach(t => {
    const found = limited?.some(p => p.username === t);
    console.log(`Target @${t} in limit(100)?`, found);
  });
}

testProfiles();
