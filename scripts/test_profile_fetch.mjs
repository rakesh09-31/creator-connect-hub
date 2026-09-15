import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function testFetch(identifier) {
  console.log(`\nTesting fetch for: "${identifier}"`);
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
  
  let q = supabase.from('profiles').select('*');
  if (isUuid) {
    q = q.or(`id.eq.${identifier},username.eq.${identifier}`);
  } else {
    q = q.eq('username', identifier);
  }
  
  const { data: p, error: pErr } = await q.maybeSingle();
  if (pErr || !p) {
    console.log('Profile fetch error or null:', pErr?.message || 'Not found');
    return;
  }
  console.log(`Found profile: ${p.username} (${p.id}), role: ${p.role}, exp: ${p.experience_level}`);
  
  const isClient = p.role === 'client' || p.account_type === 'client';
  const [rolesRes, skillsRes, specRes, postsRes, followsRes] = await Promise.all([
    isClient
      ? supabase.from('client_roles').select('role_id, professional_roles(id, name)').eq('client_id', p.id)
      : supabase.from('creator_roles').select('role_id, professional_roles(id, name)').eq('creator_id', p.id),
    supabase.from('creator_skills').select('skill_id, skills(id, name)').eq('creator_id', p.id),
    supabase.from('creator_specialties').select('specialty').eq('user_id', p.id),
    supabase.from('posts').select('id, caption, media_url').eq('author_id', p.id),
    supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', p.id),
  ]);
  
  console.log('Roles:', rolesRes.data?.map(r => r.professional_roles?.name));
  console.log('Skills:', skillsRes.data?.map(s => s.skills?.name));
  console.log('Specialties:', specRes.data?.map(s => s.specialty));
  console.log('Posts count:', postsRes.data?.length);
  console.log('Followers count:', followsRes.count);
}

async function run() {
  await testFetch('lensluna');
  await testFetch('d7f1178f-b6d3-494b-8663-49c8b2e14834'); // Omnicraft UUID
  await testFetch('creator_1789410388281');
  await testFetch('nonexistent_user_123');
}

run();
