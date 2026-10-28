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
  const { data: roles } = await client.from('professional_roles').select('*');
  console.log('Total professional_roles:', roles?.length);
  console.log('Sample roles:', roles?.slice(0, 10));
}

run().catch(console.error);
