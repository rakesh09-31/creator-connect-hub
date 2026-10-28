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
  const { data: specs } = await supabase.from('creator_specialties').select('specialty, user_id');
  const uniqueSpecs = [...new Set((specs || []).map((s) => s.specialty))];
  console.log('Unique Specialties:', uniqueSpecs);

  const { data: roles } = await supabase.from('professional_roles').select('id, name');
  console.log('Professional Roles:', roles);

  const { data: cRoles } = await supabase.from('creator_roles').select('creator_id, professional_roles(name)');
  console.log('Creator Roles assigned:', cRoles?.slice(0, 15));

  const { data: skills } = await supabase.from('skills').select('name').limit(50);
  console.log('Skills Sample:', skills?.map((s) => s.name));

  const { data: profiles } = await supabase.from('profiles').select('id, username, full_name, role, experience_level, bio');
  console.log('Total Profiles:', profiles?.length);
  const relevant = profiles?.filter((p) => {
    const text = `${p.username} ${p.full_name} ${p.bio} ${p.role}`.toLowerCase();
    return text.includes('actor') || text.includes('singer') || text.includes('dancer') || text.includes('music') || text.includes('sound') || text.includes('event') || text.includes('perform');
  });
  console.log('Relevant Profiles for performers/events:', relevant?.map((p) => ({ username: p.username, fullName: p.full_name, bio: p.bio })));
}

run();
