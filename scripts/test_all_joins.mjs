import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function testJoins() {
  console.log('--- Testing individual joins ---');

  const t1 = await supabase.from('skill_swap_listings').select('id, teach_skills:skill_swap_listing_teach_skills(*)').limit(1);
  console.log('teach_skills join:', t1.error ? t1.error.message : 'OK');

  const t2 = await supabase.from('skill_swap_listings').select('id, learn_skills:skill_swap_listing_learn_skills(*)').limit(1);
  console.log('learn_skills join:', t2.error ? t2.error.message : 'OK');

  const t3 = await supabase.from('skill_swap_listings').select('id, specialties:skill_swap_specialties(*)').limit(1);
  console.log('specialties join:', t3.error ? t3.error.message : 'OK');

  const t4 = await supabase.from('skill_swap_requests').select('id, sender:profiles(id, username)').limit(1);
  console.log('requests -> sender join:', t4.error ? t4.error.message : 'OK');

  const t5 = await supabase.from('skill_swap_requests').select('id, receiver:profiles(id, username)').limit(1);
  console.log('requests -> receiver join:', t5.error ? t5.error.message : 'OK');
}

testJoins();
