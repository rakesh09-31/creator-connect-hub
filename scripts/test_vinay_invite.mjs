import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function testVinay() {
  const { data: signinData } = await supabase.auth.signInWithPassword({
    email: 'creator_1789410388281@testomnicraft.dev',
    password: 'TestPassword123!#',
  });
  const userId = signinData?.user?.id;
  const { data: squad } = await supabase.from('squads').select('*').eq('owner_id', userId).limit(1).single();

  const { data: vinay, error: vErr } = await supabase.from('profiles').select('*').eq('id', 'af27cffd-257d-4881-bae0-83c13e7a89cb').single();
  console.log('Vinay profile:', vinay, 'vErr:', vErr);

  if (vinay) {
    const { data, error } = await supabase.from('squad_invitations').insert({
      squad_id: squad.id,
      inviter_id: userId,
      invitee_id: vinay.id,
      role: 'Actor',
      project_name: 'Short Film',
      status: 'pending'
    }).select();

    console.log('Vinay invite result:', data ? 'SUCCESS' : 'FAILED', error?.message);
    if (data && data[0]?.id) {
      await supabase.from('squad_invitations').delete().eq('id', data[0].id);
      console.log('Cleaned up test invite');
    }
  }
}

testVinay();
