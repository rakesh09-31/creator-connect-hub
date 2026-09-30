import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function testAuthSignInProfile() {
  const { data: signin, error: sErr } = await supabase.auth.signInWithPassword({
    email: 'ramu@gmail.com',
    password: 'TemporaryPassword123!#',
  });
  console.log('Signed in as ramu@gmail.com:', signin?.user?.id, sErr?.message);

  const ramuAuthId = signin?.user?.id;
  const { data: insData, error: insErr } = await supabase.from('profiles').insert({
    id: ramuAuthId,
    username: 'ramu_auth_test',
    full_name: 'Ramu Actor',
    role: 'creator',
    account_type: 'creator',
    onboarded: true
  }).select();

  console.log('Insert profile as authenticated ramu:', insData ? 'OK' : 'ERR', insErr?.message);

  if (insData) {
    await supabase.from('profiles').delete().eq('id', ramuAuthId);
    console.log('Cleaned up temp profile');
  }
}

testAuthSignInProfile();
