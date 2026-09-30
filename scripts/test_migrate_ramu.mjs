import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function testMigrateRamu() {
  const oldId = '219895fb-b8b0-488d-bdd0-e20159dc2045';
  const newAuthId = '01214642-fd80-41b3-b1c8-e1241ab84c60';

  // 1. Fetch old profile data
  const { data: oldProfile } = await supabase.from('profiles').select('*').eq('id', oldId).single();
  console.log('Old profile found:', oldProfile?.username);

  // 2. Try inserting new profile with newAuthId
  const newProfile = { ...oldProfile, id: newAuthId, username: 'ramu_temp' };
  const { data: insData, error: insErr } = await supabase.from('profiles').insert(newProfile).select();
  console.log('Insert new profile result:', insData ? 'OK' : 'ERR', insErr?.message);

  if (insData) {
    // Clean up temp
    await supabase.from('profiles').delete().eq('id', newAuthId);
    console.log('Cleaned up temp profile');
  }
}

testMigrateRamu();
