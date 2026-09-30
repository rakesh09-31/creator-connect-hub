import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function testInvCols() {
  const testCandidates = ['brief', 'budget', 'timeline', 'project_name', 'message', 'data', 'details', 'metadata'];
  for (const c of testCandidates) {
    const { error } = await supabase.from('squad_invitations').select(c).limit(1);
    console.log(`Column ${c}: ${error ? 'NO (' + error.message + ')' : 'YES'}`);
  }
}

testInvCols();
