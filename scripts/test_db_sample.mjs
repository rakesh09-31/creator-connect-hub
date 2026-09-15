import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function test() {
  const { data: jobs, error } = await supabase.from('jobs').select('id, title, skills_required, experience_level, category, location, budget, deadline, status').limit(2);
  console.log('jobs sample:', jobs);
  const { data: roles } = await supabase.from('professional_roles').select('id, name').limit(3);
  console.log('roles sample:', roles);
  const { data: skills } = await supabase.from('skills').select('id, name').limit(3);
  console.log('skills sample:', skills);
  const { data: cs } = await supabase.from('creator_skills').select('creator_id, skill_id, skills(name)').limit(3);
  console.log('creator_skills sample:', cs);
  const { data: cr } = await supabase.from('creator_roles').select('creator_id, role_id, professional_roles(name)').limit(3);
  console.log('creator_roles sample:', cr);
  const { data: jr } = await supabase.from('job_roles').select('job_id, role_id, professional_roles(name)').limit(3);
  console.log('job_roles sample:', jr);
  const { data: js } = await supabase.from('job_skills').select('job_id, skill_id, skills(name)').limit(3);
  console.log('job_skills sample:', js);
}

test();
