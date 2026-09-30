import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function investigate() {
  // Check all profiles
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('*');
  console.log('Total profiles:', profiles?.length);

  // Check if any profiles have emails, or if there's any other columns
  if (profiles && profiles.length > 0) {
    console.log('Columns of profiles:', Object.keys(profiles[0]));
    console.log('Sample profiles with usernames:');
    profiles.forEach(p => {
      console.log(`- ID: ${p.id} | username: ${p.username} | full_name: ${p.full_name} | role: ${p.role}`);
    });
  }

  // Check migrations to see how profiles table was created and foreign keys
  // Also check if there's any RPC to check auth.users or if there's another table
}

investigate();
