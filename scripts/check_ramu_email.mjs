import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function checkEmails() {
  const testEmails = [
    'ramu@gmail.com',
    'ramu@omnicraft.dev',
    'ramu@testomnicraft.dev',
    'ramu@test.com',
    'ramu@yahoo.com',
    'ramu@example.com'
  ];

  for (const email of testEmails) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: 'TemporaryPassword123!#',
    });
    console.log(`Email ${email}:`, error ? error.message : `Created/found: ${data?.user?.id}`);
  }
}

checkEmails();
