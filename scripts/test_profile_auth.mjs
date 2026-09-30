import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function testProfileForAuthUser() {
  const ramuAuthId = '01214642-fd80-41b3-b1c8-e1241ab84c60';

  // Check if we can upsert profile for ramuAuthId
  // Wait, username 'ramu' is on 219895fb-b8b0-488d-bdd0-e20159dc2045
  // If 219895fb-b8b0-488d-bdd0-e20159dc2045 is the old profile without auth,
  // let's see what happens if we check profiles
  const { data: existingRamu } = await supabase.from('profiles').select('*').eq('username', 'ramu').single();
  console.log('Existing ramu profile:', existingRamu);
}

testProfileForAuthUser();
