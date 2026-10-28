import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function inspect() {
  const squadId = 'd7c14b35-6554-4c23-a638-527f0d6c7df4';
  const { data: members } = await supabase
    .from('squad_members')
    .select('id, user_id, role, created_at, user:user_id(id, username, full_name, specialties, skills, bio)')
    .eq('squad_id', squadId);
  console.log('Current members in d7c14b35-6554-4c23-a638-527f0d6c7df4:');
  for (const m of (members || [])) {
    console.log(JSON.stringify(m, null, 2));
  }

  // Check public.projects table if exists
  const { data: projects, error: pErr } = await supabase.from('projects').select('id, title, user_id, created_at');
  console.log('Projects table rows:', projects, 'Error:', pErr?.message);

  // Check ravi_edits profile
  const { data: ravi } = await supabase.from('profiles').select('*').ilike('username', 'ravi_edits');
  console.log('Ravi profile:', JSON.stringify(ravi, null, 2));

  if (ravi && ravi[0]) {
    const raviId = ravi[0].id;
    const { data: sk } = await supabase.from('creator_skills').select('*, skills(*)').eq('creator_id', raviId);
    const { data: sp } = await supabase.from('creator_specialties').select('*').eq('user_id', raviId);
    const { data: ro } = await supabase.from('creator_roles').select('*, professional_roles(*)').eq('creator_id', raviId);
    const { data: pf } = await supabase.from('portfolios').select('*').eq('user_id', raviId);
    const { data: pfi } = await supabase.from('portfolio_items').select('*').eq('user_id', raviId);
    console.log('Ravi relations:', JSON.stringify({ sk, sp, ro, pf, pfi }, null, 2));
  }
}
inspect();
