import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function testMatcherRamu() {
  const { data: profiles } = await supabase.from('profiles').select('id, username, full_name, role').eq('username', 'ramu');
  console.log('Ramu in profiles query:', profiles);

  const { data: specialties } = await supabase.from('creator_specialties').select('*').eq('user_id', profiles[0].id);
  console.log('Ramu specialties count:', specialties?.length);

  const { data: portfolios } = await supabase.from('portfolios').select('*').eq('user_id', profiles[0].id);
  console.log('Ramu portfolios count:', portfolios?.length);
}

testMatcherRamu();
