import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function testAllAppJoins() {
  const joins = [
    { desc: 'creator_roles -> professional_roles', q: supabase.from('creator_roles').select('creator_id, role_id, professional_roles(id, name)').limit(1) },
    { desc: 'creator_skills -> skills', q: supabase.from('creator_skills').select('creator_id, skill_id, skills(id, name)').limit(1) },
    { desc: 'client_roles -> professional_roles', q: supabase.from('client_roles').select('client_id, role_id, professional_roles(id, name)').limit(1) },
    { desc: 'posts -> profiles', q: supabase.from('posts').select('id, profiles:author_id(id, username)').limit(1) },
    { desc: 'messages -> profiles', q: supabase.from('messages').select('id, sender:sender_id(id, username)').limit(1) },
    { desc: 'squad_members -> profiles', q: supabase.from('squad_members').select('squad_id, profiles:user_id(id, username)').limit(1) },
    { desc: 'squad_members -> squads', q: supabase.from('squad_members').select('user_id, squads:squad_id(id, name)').limit(1) },
    { desc: 'conversation_members -> profiles', q: supabase.from('conversation_members').select('conversation_id, profiles:user_id(id, username)').limit(1) },
    { desc: 'conversation_members -> conversations', q: supabase.from('conversation_members').select('user_id, conversations:conversation_id(id)').limit(1) },
    { desc: 'jobs -> profiles', q: supabase.from('jobs').select('id, client:client_id(id, username)').limit(1) },
    { desc: 'job_applications -> jobs', q: supabase.from('job_applications').select('id, jobs:job_id(id, title)').limit(1) },
    { desc: 'follows -> profiles (following)', q: supabase.from('follows').select('follower_id, profiles:following_id(id, username)').limit(1) },
    { desc: 'follows -> profiles (follower)', q: supabase.from('follows').select('following_id, profiles:follower_id(id, username)').limit(1) }
  ];

  console.log('--- TESTING CODEBASE JOINS ---');
  for (const j of joins) {
    const res = await j.q;
    if (res.error) {
      console.log(`❌ ${j.desc}: ${res.error.message}`);
    } else {
      console.log(`✅ ${j.desc}: OK`);
    }
  }
}

testAllAppJoins();
