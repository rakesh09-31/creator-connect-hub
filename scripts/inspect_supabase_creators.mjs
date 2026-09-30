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
  const { data: profs, error: prErr } = await supabase.from('profiles').select('*').limit(10);
  console.log('--- PROFILES ---', profs, prErr);

  const { data: ports, error: pErr } = await supabase.from('portfolios').select('*').limit(5);
  console.log('--- PORTFOLIOS ---', ports, pErr);

  const { data: pitems, error: piErr } = await supabase.from('portfolio_items').select('*').limit(5);
  console.log('--- PORTFOLIO ITEMS ---', pitems, piErr);

  const { data: specialties, error: sErr } = await supabase.from('creator_specialties').select('*').limit(10);
  console.log('--- CREATOR SPECIALTIES ---', specialties, sErr);
}

run();
