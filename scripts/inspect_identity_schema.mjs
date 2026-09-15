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
  console.log('--- 1. Testing test user auth and profile ---');
  const { data: signinData, error: signinErr } = await supabase.auth.signInWithPassword({
    email: 'creator_1789410388281@testomnicraft.dev',
    password: 'TestPassword123!#'
  });
  if (signinErr) {
    console.error('Signin error:', signinErr);
    return;
  }
  const user = signinData.user;
  console.log('Auth User ID:', user.id);
  console.log('Auth User Email:', user.email);

  // Check profile
  const { data: prof, error: profErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  console.log('Profile with id == user.id:', prof);
  console.log('Profile query error:', profErr);

  // Check all profiles
  const { data: allProfs } = await supabase.from('profiles').select('id, username, full_name, email').limit(5);
  console.log('Sample profiles:', allProfs);

  // Check posts
  const { data: posts, error: postsErr } = await supabase.from('posts').select('*').limit(3);
  console.log('Posts sample:', posts, 'Error:', postsErr);

  // Check stories
  const { data: stories, error: storiesErr } = await supabase.from('stories').select('*').limit(3);
  console.log('Stories sample:', stories, 'Error:', storiesErr);

  // Check post_likes
  const { data: likes, error: likesErr } = await supabase.from('post_likes').select('*').limit(3);
  console.log('Likes sample:', likes, 'Error:', likesErr);

  // Check post_saves
  const { data: saves, error: savesErr } = await supabase.from('post_saves').select('*').limit(3);
  console.log('Saves sample:', saves, 'Error:', savesErr);

  // Check post_comments
  const { data: comments, error: commentsErr } = await supabase.from('post_comments').select('*').limit(3);
  console.log('Comments sample:', comments, 'Error:', commentsErr);

  // Check portfolios
  const { data: portfolios, error: portErr } = await supabase.from('portfolios').select('*').limit(3);
  console.log('Portfolios sample:', portfolios, 'Error:', portErr);
}

run();
