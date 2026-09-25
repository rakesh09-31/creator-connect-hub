import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '';
let key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function createVerifiedUser() {
  const ts = Date.now();
  const email = `omniforge_${ts}@testomnicraft.dev`;
  const password = 'OmniForgeTest123!#';
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: `omniforge_${ts}`,
        full_name: 'OmniForge Tester',
        role: 'creator',
      },
    },
  });

  if (error) {
    console.error('SignUp Error:', error);
    return;
  }

  const uid = data.user.id;
  await supabase.from('profiles').upsert({
    id: uid,
    username: `omniforge_${ts}`,
    full_name: 'OmniForge Tester',
    role: 'creator',
    account_type: 'creator',
    onboarded: true,
  });

  console.log('SUCCESS_CREATED_USER:', JSON.stringify({ email, password, uid }));
}

createVerifiedUser();
