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
  const { data: roles } = await supabase.from('creator_roles').select('creator_id, professional_roles(name)');
  const actorRoles = roles?.filter(r => /act|sing/i.test(r.professional_roles?.name));
  console.log('ACTOR/SINGER ROLES:', JSON.stringify(actorRoles, null, 2));

  const { data: specs } = await supabase.from('creator_specialties').select('user_id, specialty');
  const actorSpecs = specs?.filter(s => /act|sing/i.test(s.specialty));
  console.log('ACTOR/SINGER SPECS:', JSON.stringify(actorSpecs, null, 2));

  const allActorIds = [...new Set([...(actorRoles||[]).map(r=>r.creator_id), ...(actorSpecs||[]).map(s=>s.user_id)])];
  const { data: profs } = await supabase.from('profiles').select('id, username, full_name, bio').in('id', allActorIds);
  console.log('ACTOR PROFILES:', JSON.stringify(profs, null, 2));
}
check();
