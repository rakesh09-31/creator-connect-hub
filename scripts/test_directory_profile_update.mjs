import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

async function run() {
  const adminClient = createClient(url, key);
  const ts = Date.now();
  const email = `test_dir_${ts}@testomnicraft.dev`;
  const password = 'Password123!#';
  
  // 1. Sign up user
  const { data: { user }, error: sErr } = await adminClient.auth.signUp({
    email,
    password,
    options: { data: { username: `dir_${ts}` } }
  });
  console.log('User created:', user.id);

  // 2. Pre-create a directory profile with DIFFERENT id, linked to auth_user_id
  const dirId = '11111111-2222-3333-4444-555555555555';
  await adminClient.from('profiles').delete().eq('id', dirId);
  const { data: dirP, error: dirErr } = await adminClient.from('profiles').insert({
    id: dirId,
    username: `dir_${ts}`,
    full_name: 'Directory Creator',
    role: null,
    account_type: null,
    onboarded: false,
    auth_user_id: user.id
  }).select().single();
  console.log('Directory profile inserted:', dirP?.id, dirErr);

  // 3. Now authenticate as the user
  const userClient = createClient(url, key, { auth: { persistSession: false } });
  await userClient.auth.signInWithPassword({ email, password });

  // 4. Try to update the directory profile as this authenticated user!
  const updateRes = await userClient
    .from('profiles')
    .update({
      role: 'creator',
      account_type: 'creator',
      onboarded: true
    })
    .or(`id.eq.${dirId},auth_user_id.eq.${user.id}`)
    .select();
  console.log('User updating directory profile: result count =', updateRes.data?.length, 'error =', updateRes.error);

  // Clean up
  await adminClient.from('profiles').delete().eq('id', dirId);
  await adminClient.from('profiles').delete().eq('id', user.id);
}

run().catch(console.error);
