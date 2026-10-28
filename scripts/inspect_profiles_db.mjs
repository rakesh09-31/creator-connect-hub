import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

async function run() {
  const client = createClient(url, key);
  const { data: profs, error } = await client
    .from('profiles')
    .select('id, username, role, account_type, onboarded, auth_user_id')
    .order('created_at', { ascending: false })
    .limit(20);
  console.log('Recent profiles:', profs, 'Error:', error);
}

run().catch(console.error);
