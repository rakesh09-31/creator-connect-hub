import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function testLiveRPC() {
  const { data: profiles } = await supabase.from('profiles').select('id, username').limit(1);
  if (!profiles || profiles.length === 0) {
    console.log('No profiles found');
    return;
  }
  const testId = profiles[0].id;
  console.log(`Testing get_recommended_jobs_for_creator with creator_id: ${testId} (${profiles[0].username})`);

  const { data, error } = await supabase.rpc('get_recommended_jobs_for_creator', {
    p_creator_id: testId,
    p_limit: 5
  });

  if (error) {
    console.error('RPC Error:', error);
    process.exit(1);
  }

  console.log('Live RPC Results:', data);
  console.log('✓ RPC executed successfully!');
}

testLiveRPC();
