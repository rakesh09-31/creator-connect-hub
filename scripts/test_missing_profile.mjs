import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function testMissingProfileScenario() {
  console.log('--- Testing Signup and missing profile scenario ---');
  const stamp = Date.now();
  const testEmail = `orphan_${stamp}@testomnicraft.dev`;
  const password = 'TestPassword123!#';

  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email: testEmail,
    password: password,
    options: {
      data: {
        username: `orphan_${stamp}`,
        full_name: 'Orphan Test User'
      }
    }
  });

  if (authErr) {
    console.error('Signup error:', authErr);
    return;
  }
  const orphanUser = authData.user;
  console.log('Signed up orphan user ID:', orphanUser.id);

  // Check if a profile was automatically created by a trigger
  const { data: prof, error: profErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', orphanUser.id)
    .maybeSingle();

  console.log('Was profile automatically created for new signup?', prof ? 'YES' : 'NO');
  if (!prof) {
    console.log('Profile is MISSING! Now testing user actions without profile...');
    
    // Test story insert
    const storyRes = await supabase.from('stories').insert({
      user_id: orphanUser.id,
      media_url: 'https://example.com/test.jpg',
      media_type: 'image'
    });
    console.log('Story insert result without profile:', storyRes.error);

    // Test comment insert
    const commentRes = await supabase.from('post_comments').insert({
      user_id: orphanUser.id,
      post_id: 'e2553ef9-1241-44d5-8859-d141299bb15f',
      body: 'Hello without profile'
    });
    console.log('Comment insert result without profile:', commentRes.error);

    // Test post insert
    const postRes = await supabase.from('posts').insert({
      author_id: orphanUser.id,
      caption: 'Post without profile'
    });
    console.log('Post insert result without profile:', postRes.error);

    // Test like insert
    const likeRes = await supabase.from('post_likes').insert({
      user_id: orphanUser.id,
      post_id: 'e2553ef9-1241-44d5-8859-d141299bb15f'
    });
    console.log('Like insert result without profile:', likeRes.error);

    // Test save insert
    const saveRes = await supabase.from('post_saves').insert({
      user_id: orphanUser.id,
      post_id: 'e2553ef9-1241-44d5-8859-d141299bb15f'
    });
    console.log('Save insert result without profile:', saveRes.error);
  }
}

testMissingProfileScenario();
