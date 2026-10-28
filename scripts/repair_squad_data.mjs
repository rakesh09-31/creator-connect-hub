import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function repairSquad() {
  const squadId = 'd7c14b35-6554-4c23-a638-527f0d6c7df4';

  // 1. Remove ravi_edits from squad_members and squad_invitations if present
  const raviId = '485f7840-3ead-443e-8438-1eb2a6dfe2c1';
  await supabase.from('squad_members').delete().eq('squad_id', squadId).eq('user_id', raviId);
  await supabase.from('squad_invitations').delete().eq('squad_id', squadId).eq('invitee_id', raviId);
  console.log('Removed ravi_edits from squad_members and invitations if present');

  // 2. Ensure creator_1787749078759 is in squad_members as Video Editor
  const editorId = '442b38ab-ce40-48f3-8b89-8e5ae8e69482';
  const { error: insErr } = await supabase.from('squad_members').upsert({
    squad_id: squadId,
    user_id: editorId,
    role: 'Video Editor'
  }, { onConflict: 'squad_id,user_id' });
  console.log('Upserted creator_1787749078759 as Video Editor, error:', insErr);

  // 3. Inspect final squad_members
  const { data: members } = await supabase
    .from('squad_members')
    .select('squad_id, user_id, role');
  console.log('Final members for squad:', members?.filter(m => m.squad_id === squadId));
}
repairSquad();
