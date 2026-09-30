import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function testRamuMigration() {
  const oldId = '219895fb-b8b0-488d-bdd0-e20159dc2045';
  const authId = '01214642-fd80-41b3-b1c8-e1241ab84c60';

  // Sign in as ramu@gmail.com
  const { data: ramuAuth } = await supabase.auth.signInWithPassword({
    email: 'ramu@gmail.com',
    password: 'TemporaryPassword123!#',
  });
  console.log('Signed in as ramu:', ramuAuth?.user?.id);

  // Sign in as existing test user
  const adminClient = createClient(url, key);
  await adminClient.auth.signInWithPassword({
    email: 'creator_1789410388281@testomnicraft.dev',
    password: 'TestPassword123!#',
  });

  // Check if unauthenticated or authenticated can delete or update old profile
  const { data: delData, error: delErr } = await adminClient.from('profiles').delete().eq('id', oldId).select();
  console.log('Delete old profile with adminClient:', delData, 'err:', delErr?.message);
}

testRamuMigration();
