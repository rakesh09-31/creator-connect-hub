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
  console.log('--- Signing in as creator_1789410388281@testomnicraft.dev ---');
  const { data: signinData, error: signinErr } = await supabase.auth.signInWithPassword({
    email: 'creator_1789410388281@testomnicraft.dev',
    password: 'TestPassword123!#'
  });
  if (signinErr) {
    console.error('Signin error:', signinErr);
    return;
  }
  const user = signinData.user;
  console.log('User ID:', user.id);

  // 1. Test stories insert
  console.log('\n--- 1. Testing stories insert ---');
  const storyInsert = await supabase.from('stories').insert({
    user_id: user.id,
    media_url: 'https://example.com/test_story.jpg',
    media_type: 'image',
    caption: 'Test story caption',
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  }).select();
  console.log('Stories insert result:', storyInsert);

  // 2. Test posts insert (Photo)
  console.log('\n--- 2. Testing posts insert (Photo) ---');
  const postInsert = await supabase.from('posts').insert({
    author_id: user.id,
    post_type: 'photo',
    caption: 'Test photo post caption',
    media_url: 'https://example.com/test_photo.jpg'
  }).select();
  console.log('Posts insert result:', postInsert);
  const postId = postInsert.data?.[0]?.id;

  // 3. Test post_likes insert
  console.log('\n--- 3. Testing post_likes insert ---');
  if (postId) {
    const likeInsert = await supabase.from('post_likes').insert({
      user_id: user.id,
      post_id: postId
    }).select();
    console.log('Post likes insert result:', likeInsert);
  }

  // 4. Test post_comments insert
  console.log('\n--- 4. Testing post_comments insert ---');
  if (postId) {
    const commentInsert = await supabase.from('post_comments').insert({
      user_id: user.id,
      post_id: postId,
      body: 'Test comment body'
    }).select();
    console.log('Post comments insert result:', commentInsert);
  }

  // 5. Test post_saves insert
  console.log('\n--- 5. Testing post_saves insert ---');
  if (postId) {
    const saveInsert = await supabase.from('post_saves').insert({
      user_id: user.id,
      post_id: postId
    }).select();
    console.log('Post saves insert result:', saveInsert);
  }

  // 6. Test portfolios insert
  console.log('\n--- 6. Testing portfolios insert ---');
  const portInsert = await supabase.from('portfolios').insert({
    user_id: user.id,
    title: 'Test Project Title',
    description: 'Test Project Description',
    project_link: 'https://github.com/test/project',
    media_url: 'https://example.com/test_project.jpg',
    media_type: 'image'
  }).select();
  console.log('Portfolios insert result:', portInsert);

  // 7. Test storage bucket uploads
  console.log('\n--- 7. Testing storage bucket uploads ---');
  for (const bucket of ['posts', 'stories', 'thumbnails', 'portfolio']) {
    const testPath = `users/${user.id}/test_${Date.now()}.txt`;
    const uploadRes = await supabase.storage.from(bucket).upload(testPath, 'Hello world', {
      contentType: 'text/plain'
    });
    console.log(`Bucket "${bucket}" upload:`, uploadRes.error ? uploadRes.error : 'SUCCESS: ' + uploadRes.data?.path);
    if (!uploadRes.error) {
      await supabase.storage.from(bucket).remove([testPath]);
    }
  }
}

run();
