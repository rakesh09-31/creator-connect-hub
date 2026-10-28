import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function cleanDuplicate() {
  await supabase.from('squad_members').delete().eq('squad_id', 'e89b74aa-be38-4703-965c-16262195a4e2');
  await supabase.from('squad_invitations').delete().eq('squad_id', 'e89b74aa-be38-4703-965c-16262195a4e2');
  const { error } = await supabase.from('squads').delete().eq('id', 'e89b74aa-be38-4703-965c-16262195a4e2');
  console.log('Deleted duplicate squad, error:', error);
}
cleanDuplicate();
