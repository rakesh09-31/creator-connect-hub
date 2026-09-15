import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function checkFks() {
  console.log('--- Inspecting foreign key constraints via RPC or joins ---');
  // Let's test inserting a fake UUID into stories to see the exact constraint name and message!
  const fakeId = '00000000-0000-0000-0000-000000000000';
  const { error: storyErr } = await supabase.from('stories').insert({
    user_id: fakeId,
    media_url: 'https://example.com/test.jpg',
    media_type: 'image'
  });
  console.log('Stories fake insert error:', storyErr);

  const { error: commentErr } = await supabase.from('post_comments').insert({
    user_id: fakeId,
    post_id: fakeId,
    body: 'test'
  });
  console.log('Comments fake insert error:', commentErr);

  const { error: likeErr } = await supabase.from('post_likes').insert({
    user_id: fakeId,
    post_id: fakeId
  });
  console.log('Likes fake insert error:', likeErr);

  const { error: saveErr } = await supabase.from('post_saves').insert({
    user_id: fakeId,
    post_id: fakeId
  });
  console.log('Saves fake insert error:', saveErr);

  const { error: postErr } = await supabase.from('posts').insert({
    author_id: fakeId,
    caption: 'test'
  });
  console.log('Posts fake insert error:', postErr);

  const { error: portErr } = await supabase.from('portfolios').insert({
    user_id: fakeId,
    title: 'test'
  });
  console.log('Portfolios fake insert error:', portErr);
}

checkFks();
