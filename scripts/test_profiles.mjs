import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function run() {
  const { count: total } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
  const { count: onboardedCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('onboarded', true);
  const { count: notOnboardedCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('onboarded', false);
  console.log({ total, onboardedCount, notOnboardedCount });
}

run();
