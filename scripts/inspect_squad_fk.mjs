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
  // 1. Inspect profiles for ramu
  const { data: ramu, error: rErr } = await supabase.from('profiles').select('*').eq('username', 'ramu');
  console.log('RAMU profile:', JSON.stringify(ramu, null, 2));

  // 2. Try to query information_schema or pg_constraint via rpc or query if available, or test insert
  const { data: constraints, error: cErr } = await supabase.rpc('get_table_constraints', { t_name: 'squad_invitations' }).maybeSingle();
  console.log('Constraints rpc:', constraints, 'cErr:', cErr?.message);

  // 3. Inspect other tables like creators
  const { data: creators, error: crErr } = await supabase.from('creators').select('*').limit(5);
  console.log('Creators table:', creators, 'crErr:', crErr?.message);

  // 4. Inspect existing squad_invitations
  const { data: existingInvs, error: invErr } = await supabase.from('squad_invitations').select('*').limit(5);
  console.log('Existing squad_invitations count:', existingInvs?.length, 'error:', invErr?.message);
  if (existingInvs && existingInvs.length > 0) {
    console.log('Sample existing invitation:', JSON.stringify(existingInvs[0], null, 2));
  }

  // 5. Inspect squads
  const { data: squads, error: sqErr } = await supabase.from('squads').select('*').limit(3);
  console.log('Squads count:', squads?.length, 'error:', sqErr?.message);
  if (squads && squads.length > 0) {
    console.log('Sample squad:', JSON.stringify(squads[0], null, 2));
  }
}

run();
