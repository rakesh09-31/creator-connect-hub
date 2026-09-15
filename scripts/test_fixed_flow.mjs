import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function testFix() {
  console.log('--- Testing Orphan User with Profile Upsert ---');
  // 1. Sign in as orphan user (or create a fresh test user)
  const stamp = Date.now();
  const testEmail = `fixed_${stamp}@testomnicraft.dev`;
  const password = 'TestPassword123!#';

  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email: testEmail,
    password: password,
    options: {
      data: {
        username: `fixed_${stamp}`,
        full_name: 'Fixed Test User'
      }
    }
  });

  const user = authData.user;
  console.log('User ID:', user.id);

  // Sign in to get authenticated session
  const userClient = createClient(url, key, { auth: { persistSession: false } });
  const { data: sessionData } = await userClient.auth.signInWithPassword({
    email: testEmail,
    password: password
  });

  // Self-heal / ensure profile
  console.log('\n--- Ensuring profile row exists via upsert ---');
  const { data: prof, error: profErr } = await userClient.from('profiles').upsert({
    id: user.id,
    username: `fixed_${stamp}`,
    full_name: 'Fixed Test User',
    role: 'creator',
    account_type: 'creator',
    onboarded: true
  }).select().single();

  console.log('Profile upsert result:', profErr ? profErr : 'SUCCESS: ' + prof.username);

  // Now test story upload
  const storyRes = await userClient.from('stories').insert({
    user_id: user.id,
    media_url: 'https://example.com/test_fixed_story.jpg',
    media_type: 'image',
    caption: 'Fixed story!'
  }).select();
  console.log('Story insert result:', storyRes.error ? storyRes.error : 'SUCCESS: id ' + storyRes.data?.[0]?.id);

  // Now test post upload
  const postRes = await userClient.from('posts').insert({
    author_id: user.id,
    post_type: 'photo',
    caption: 'Fixed post!',
    media_url: 'https://example.com/test_fixed_post.jpg'
  }).select();
  console.log('Post insert result:', postRes.error ? postRes.error : 'SUCCESS: id ' + postRes.data?.[0]?.id);
  const postId = postRes.data?.[0]?.id;

  // Now test like
  const likeRes = await userClient.from('post_likes').insert({
    user_id: user.id,
    post_id: postId
  }).select();
  console.log('Like insert result:', likeRes.error ? likeRes.error : 'SUCCESS: id ' + likeRes.data?.[0]?.id);

  // Now test comment
  const commentRes = await userClient.from('post_comments').insert({
    user_id: user.id,
    post_id: postId,
    body: 'Great work!'
  }).select();
  console.log('Comment insert result:', commentRes.error ? commentRes.error : 'SUCCESS: id ' + commentRes.data?.[0]?.id);

  // Now test save
  const saveRes = await userClient.from('post_saves').insert({
    user_id: user.id,
    post_id: postId
  }).select();
  console.log('Save insert result:', saveRes.error ? saveRes.error : 'SUCCESS: id ' + saveRes.data?.[0]?.id);

  // Now test project / portfolio
  const portRes = await userClient.from('portfolios').insert({
    user_id: user.id,
    title: 'Fixed Project',
    project_link: 'https://example.com/portfolio'
  }).select();
  console.log('Project insert result:', portRes.error ? portRes.error : 'SUCCESS: id ' + portRes.data?.[0]?.id);
}

testFix();
