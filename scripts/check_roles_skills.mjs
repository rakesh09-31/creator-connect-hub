import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function check() {
  const { data: roles } = await supabase.from('professional_roles').select('*');
  console.log('Current professional roles:', roles);

  const { data: skills } = await supabase.from('skills').select('*');
  console.log('Current skills:', skills);
}

check();
