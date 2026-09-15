import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function testRpc() {
  const { data: jobs } = await supabase.from('jobs').select('id, title').limit(1);
  if (jobs && jobs.length > 0) {
    const jobId = jobs[0].id;
    console.log('Testing get_recommended_creators_for_job with job:', jobs[0].title);
    const { data: recCreators, error: err1 } = await supabase.rpc('get_recommended_creators_for_job', {
      p_job_id: jobId,
      p_limit: 5
    });
    console.log('Rec Creators:', recCreators, 'Error:', err1);
  }

  const { data: creators } = await supabase.from('profiles').select('id, username').eq('role', 'creator').limit(1);
  if (creators && creators.length > 0) {
    const creatorId = creators[0].id;
    console.log('Testing get_recommended_jobs_for_creator with creator:', creators[0].username);
    const { data: recJobs, error: err2 } = await supabase.rpc('get_recommended_jobs_for_creator', {
      p_creator_id: creatorId,
      p_limit: 5
    });
    console.log('Rec Jobs:', recJobs, 'Error:', err2);
  }
}

testRpc();
