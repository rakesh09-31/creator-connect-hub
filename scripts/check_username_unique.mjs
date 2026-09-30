import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function checkUsernameConstraint() {
  // Let's test inserting a profile with an existing username 'sketchsiren' but different UUID
  const testId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const { data, error } = await supabase.from('profiles').insert({
    id: testId,
    username: 'sketchsiren',
    full_name: 'Duplicate Test',
    role: 'creator'
  }).select();

  console.log('Duplicate username insert result:', data, error);
}

checkUsernameConstraint();
